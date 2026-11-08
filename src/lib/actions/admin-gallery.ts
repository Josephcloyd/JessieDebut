"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { UserError, adminAction, parseOrThrow, refreshPublicSite } from "@/lib/server/action";
import { moveStoredFile, removeStoredFiles, verifyStoredFile, type MediaBucket } from "@/lib/server/storage";
import { publicStorageUrl } from "@/lib/supabase/env";
import type { AlbumRow, AlbumVisibility, PhotoRow } from "@/lib/types";
import { albumSchema, photoRegistrationSchema, type AlbumInput, type PhotoRegistrationInput } from "@/lib/validation/content";

const uuid = z.uuid("Invalid item.");
const bucketFor = (visibility: AlbumVisibility): MediaBucket => (visibility === "public" ? "public-media" : "private-media");

async function findPhoto(supabase: SupabaseClient, id: string): Promise<PhotoRow> {
  const { data } = await supabase.from("gallery_photos").select("*").eq("id", parseOrThrow(uuid, id)).single().throwOnError();
  return data as PhotoRow;
}

async function findAlbum(supabase: SupabaseClient, id: string): Promise<AlbumRow> {
  const { data } = await supabase.from("gallery_albums").select("*").eq("id", parseOrThrow(uuid, id)).single().throwOnError();
  return data as AlbumRow;
}

async function nextSortOrder(supabase: SupabaseClient, albumId: string): Promise<number> {
  const { data } = await supabase
    .from("gallery_photos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .throwOnError();
  return (data?.[0]?.sort_order ?? 0) + 1;
}

export async function createAlbum(input: AlbumInput): Promise<ActionResult<AlbumRow>> {
  return adminAction("createAlbum", async (supabase) => {
    const album = parseOrThrow(albumSchema, input);
    const { data } = await supabase.from("gallery_albums").insert(album).select("*").single().throwOnError();
    refreshPublicSite();
    return data as AlbumRow;
  });
}

async function moveAlbumFiles(supabase: SupabaseClient, albumId: string, target: MediaBucket): Promise<void> {
  const { data } = await supabase.from("gallery_photos").select("*").eq("album_id", albumId).throwOnError();
  for (const photo of (data ?? []) as PhotoRow[]) {
    await moveStoredFile(photo.bucket, target, photo.storage_path);
    await supabase.from("gallery_photos").update({ bucket: target }).eq("id", photo.id).throwOnError();
  }
}

/** Hides first when going private and moves files first when going public, so nothing leaks mid-way. */
export async function updateAlbum(id: string, input: AlbumInput): Promise<ActionResult> {
  return adminAction("updateAlbum", async (supabase) => {
    const changes = parseOrThrow(albumSchema, input);
    const album = await findAlbum(supabase, id);
    const target = bucketFor(changes.visibility);

    if (target === "public-media") await moveAlbumFiles(supabase, album.id, target);
    await supabase.from("gallery_albums").update(changes).eq("id", album.id).throwOnError();
    if (target === "private-media") await moveAlbumFiles(supabase, album.id, target);
    refreshPublicSite();
  });
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  return adminAction("deleteAlbum", async (supabase) => {
    const album = await findAlbum(supabase, id);
    const { data } = await supabase.from("gallery_photos").select("bucket, storage_path").eq("album_id", album.id).throwOnError();
    await supabase.from("gallery_albums").delete().eq("id", album.id).throwOnError();
    const rows = (data ?? []) as Pick<PhotoRow, "bucket" | "storage_path">[];
    for (const bucket of ["public-media", "private-media"] as const) {
      await removeStoredFiles(bucket, rows.filter((row) => row.bucket === bucket).map((row) => row.storage_path));
    }
    refreshPublicSite();
  });
}

export async function registerPhoto(albumId: string, input: PhotoRegistrationInput): Promise<ActionResult<PhotoRow>> {
  return adminAction("registerPhoto", async (supabase) => {
    const album = await findAlbum(supabase, albumId);
    const photo = parseOrThrow(photoRegistrationSchema, input);
    const bucket = bucketFor(album.visibility);
    await verifyStoredFile(bucket, photo.storagePath, "image");

    const { data } = await supabase
      .from("gallery_photos")
      .insert({
        album_id: album.id,
        bucket,
        storage_path: photo.storagePath,
        caption: photo.caption,
        width: photo.width,
        height: photo.height,
        blur_data_url: photo.blurDataUrl,
        sort_order: await nextSortOrder(supabase, album.id),
      })
      .select("*")
      .single()
      .throwOnError();
    refreshPublicSite();
    return data as PhotoRow;
  });
}

export async function replacePhoto(id: string, input: PhotoRegistrationInput): Promise<ActionResult<PhotoRow>> {
  return adminAction("replacePhoto", async (supabase) => {
    const current = await findPhoto(supabase, id);
    const album = await findAlbum(supabase, current.album_id);
    const photo = parseOrThrow(photoRegistrationSchema, input);
    const bucket = bucketFor(album.visibility);
    await verifyStoredFile(bucket, photo.storagePath, "image");

    const { data } = await supabase
      .from("gallery_photos")
      .update({
        bucket,
        storage_path: photo.storagePath,
        width: photo.width,
        height: photo.height,
        blur_data_url: photo.blurDataUrl,
      })
      .eq("id", current.id)
      .select("*")
      .single()
      .throwOnError();
    await removeStoredFiles(current.bucket, [current.storage_path]);
    refreshPublicSite();
    return data as PhotoRow;
  });
}

const photoPatchSchema = z
  .object({ caption: z.string().trim().max(300), is_featured: z.boolean(), is_visible: z.boolean() })
  .partial();

export async function updatePhoto(id: string, input: z.input<typeof photoPatchSchema>): Promise<ActionResult> {
  return adminAction("updatePhoto", async (supabase) => {
    const changes = parseOrThrow(photoPatchSchema, input);
    await supabase.from("gallery_photos").update(changes).eq("id", parseOrThrow(uuid, id)).throwOnError();
    refreshPublicSite();
  });
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  return adminAction("deletePhoto", async (supabase) => {
    const photo = await findPhoto(supabase, id);
    await supabase.from("gallery_photos").delete().eq("id", photo.id).throwOnError();
    await removeStoredFiles(photo.bucket, [photo.storage_path]);
    refreshPublicSite();
  });
}

const reorderSchema = z.object({
  table: z.enum(["gallery_albums", "gallery_photos", "debut_participants", "event_program"]),
  ids: z.array(uuid).max(1000),
});

export async function reorderItems(input: z.input<typeof reorderSchema>): Promise<ActionResult> {
  return adminAction("reorderItems", async (supabase) => {
    const { table, ids } = parseOrThrow(reorderSchema, input);
    const { error } = await supabase.rpc("reorder_items", { p_table: table, p_ids: ids });
    if (error) throw error;
    refreshPublicSite();
  });
}

/** Points the draft hero at an existing gallery photo. Takes effect on Publish. */
export async function setHeroFromPhoto(id: string): Promise<ActionResult> {
  return adminAction("setHeroFromPhoto", async (supabase) => {
    const photo = await findPhoto(supabase, id);
    if (photo.bucket !== "public-media") {
      throw new UserError("Photos in private albums can't be used as the hero image.");
    }
    await supabase
      .from("event_settings")
      .update({ hero_image_url: publicStorageUrl(photo.bucket, photo.storage_path) })
      .eq("state", "draft")
      .throwOnError();
    await supabase.from("site_controls").update({ has_unpublished_changes: true }).eq("id", 1).throwOnError();
  });
}
