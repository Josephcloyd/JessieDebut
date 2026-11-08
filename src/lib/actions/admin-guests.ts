"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { generateInviteCode } from "@/lib/domain/invite-code";
import { adminAction, parseOrThrow, refreshPublicSite } from "@/lib/server/action";
import { moveStoredFile, removeStoredFiles } from "@/lib/server/storage";
import type { AlbumRow, GuestRow, GuestUploadRow, MessageStatus } from "@/lib/types";
import { adminRsvpSchema, guestSchema, type AdminRsvpInput, type GuestInput } from "@/lib/validation/content";

const uuid = z.uuid("Invalid item.");
const GUEST_UPLOAD_ALBUM = "Guest Moments";
const GUEST_ALBUM_POSITION = 99;
const MAX_BULK_GUESTS = 500;

export async function createGuest(input: GuestInput): Promise<ActionResult<GuestRow>> {
  return adminAction("createGuest", async (supabase) => {
    const guest = parseOrThrow(guestSchema, input);
    const { data } = await supabase
      .from("guests")
      .insert({ ...guest, invite_code: generateInviteCode() })
      .select("*")
      .single()
      .throwOnError();
    return data as GuestRow;
  });
}

const bulkSchema = z.object({
  names: z.array(z.string().trim().min(1).max(120)).min(1, "Please enter at least one name.").max(MAX_BULK_GUESTS),
  maxCompanions: z.number().int().min(0).max(20),
});

export async function createGuestsInBulk(input: z.input<typeof bulkSchema>): Promise<ActionResult<number>> {
  return adminAction("createGuestsInBulk", async (supabase) => {
    const { names, maxCompanions } = parseOrThrow(bulkSchema, input);
    const rows = names.map((full_name) => ({ full_name, max_companions: maxCompanions, invite_code: generateInviteCode() }));
    await supabase.from("guests").insert(rows).throwOnError();
    return rows.length;
  });
}

export async function updateGuest(id: string, input: GuestInput): Promise<ActionResult> {
  return adminAction("updateGuest", async (supabase) => {
    const guest = parseOrThrow(guestSchema, input);
    await supabase.from("guests").update(guest).eq("id", parseOrThrow(uuid, id)).throwOnError();
  });
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  return adminAction("deleteGuest", async (supabase) => {
    await supabase.from("guests").delete().eq("id", parseOrThrow(uuid, id)).throwOnError();
  });
}

export async function applyCompanionAllowanceToAll(maxCompanions: number): Promise<ActionResult> {
  return adminAction("applyCompanionAllowanceToAll", async (supabase) => {
    const value = parseOrThrow(z.number().int().min(0).max(20), maxCompanions);
    await supabase.from("guests").update({ max_companions: value }).not("id", "is", null).throwOnError();
    await supabase.from("site_controls").update({ default_max_companions: value }).eq("id", 1).throwOnError();
  });
}

export async function setGuestRsvp(guestId: string, input: AdminRsvpInput): Promise<ActionResult> {
  return adminAction("setGuestRsvp", async (supabase) => {
    const id = parseOrThrow(uuid, guestId);
    const answer = parseOrThrow(adminRsvpSchema, input);
    const { data: guest } = await supabase.from("guests").select("full_name, email, phone").eq("id", id).single().throwOnError();
    await supabase
      .from("rsvps")
      .upsert(
        {
          guest_id: id,
          full_name: guest.full_name,
          email: guest.email,
          phone: guest.phone,
          ...answer,
          companions: answer.status === "attending" ? answer.companions : 0,
        },
        { onConflict: "guest_id" },
      )
      .throwOnError();
  });
}

/** Removes the response only. The guest stays on the list as pending. */
export async function deleteRsvp(guestId: string): Promise<ActionResult> {
  return adminAction("deleteRsvp", async (supabase) => {
    await supabase.from("rsvps").delete().eq("guest_id", parseOrThrow(uuid, guestId)).throwOnError();
  });
}

const messagePatchSchema = z
  .object({ status: z.enum(["pending", "approved", "rejected"]), is_featured: z.boolean() })
  .partial();

export async function updateMessage(id: string, input: z.input<typeof messagePatchSchema>): Promise<ActionResult> {
  return adminAction("updateMessage", async (supabase) => {
    const changes = parseOrThrow(messagePatchSchema, input);
    const reviewed = changes.status ? { reviewed_at: new Date().toISOString() } : {};
    await supabase.from("guest_messages").update({ ...changes, ...reviewed }).eq("id", parseOrThrow(uuid, id)).throwOnError();
    refreshPublicSite();
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return adminAction("deleteMessage", async (supabase) => {
    await supabase.from("guest_messages").delete().eq("id", parseOrThrow(uuid, id)).throwOnError();
    refreshPublicSite();
  });
}

async function guestMomentsAlbum(supabase: SupabaseClient): Promise<Pick<AlbumRow, "id" | "visibility">> {
  const { data: existing } = await supabase.from("gallery_albums").select("id, visibility").eq("name", GUEST_UPLOAD_ALBUM).limit(1).throwOnError();
  if (existing?.[0]) return existing[0];
  const { data } = await supabase
    .from("gallery_albums")
    .insert({ name: GUEST_UPLOAD_ALBUM, visibility: "public", sort_order: GUEST_ALBUM_POSITION })
    .select("id, visibility")
    .single()
    .throwOnError();
  return data;
}

async function nextPhotoPosition(supabase: SupabaseClient, albumId: string): Promise<number> {
  const { data } = await supabase.from("gallery_photos").select("sort_order").eq("album_id", albumId).order("sort_order", { ascending: false }).limit(1).throwOnError();
  return (data?.[0]?.sort_order ?? 0) + 1;
}

async function findUpload(supabase: SupabaseClient, id: string): Promise<GuestUploadRow> {
  const { data } = await supabase.from("guest_uploads").select("*").eq("id", parseOrThrow(uuid, id)).single().throwOnError();
  return data as GuestUploadRow;
}

/** Adds a guest's photo to the "Guest Moments" album, stored to match that album's visibility. */
export async function approveGuestUpload(id: string): Promise<ActionResult> {
  return adminAction("approveGuestUpload", async (supabase) => {
    const upload = await findUpload(supabase, id);
    const album = await guestMomentsAlbum(supabase);
    const bucket = album.visibility === "public" ? "public-media" : "private-media";
    await moveStoredFile("private-media", bucket, upload.storage_path);
    await supabase
      .from("gallery_photos")
      .insert({
        album_id: album.id,
        bucket,
        sort_order: await nextPhotoPosition(supabase, album.id),
        storage_path: upload.storage_path,
        caption: upload.caption || `Shared by ${upload.uploader_name}`,
        width: upload.width,
        height: upload.height,
        blur_data_url: upload.blur_data_url,
      })
      .throwOnError();
    await supabase.from("guest_uploads").update({ status: "approved" satisfies MessageStatus }).eq("id", upload.id).throwOnError();
    refreshPublicSite();
  });
}

export async function deleteGuestUpload(id: string): Promise<ActionResult> {
  return adminAction("deleteGuestUpload", async (supabase) => {
    const upload = await findUpload(supabase, id);
    await supabase.from("guest_uploads").delete().eq("id", upload.id).throwOnError();
    if (upload.status !== "approved") await removeStoredFiles("private-media", [upload.storage_path]);
  });
}
