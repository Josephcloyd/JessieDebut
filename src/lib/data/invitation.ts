import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createAnonClient, createServiceClient } from "@/lib/supabase/clients.server";
import { isSupabaseConfigured, publicStorageUrl } from "@/lib/supabase/env";
import { getAdminContext } from "@/lib/server/admin";
import type {
  AlbumRow,
  EventSettings,
  GalleryAlbum,
  GalleryPhoto,
  GuestWish,
  InvitationData,
  InvitedGuest,
  Participant,
  PhotoRow,
  ProgramItem,
  SiteControls,
} from "@/lib/types";
import { isValidInviteCode, normalizeInviteCode } from "@/lib/domain/invite-code";
import { DEV_INVITATION } from "./dev-fixture";

const SIGNED_LINK_SECONDS = 60 * 60 * 6;
const MAX_WISHES_SHOWN = 120;
const WISH_COLUMNS = "id, guest_name, message, is_featured, created_at";

function toGalleryPhoto(row: PhotoRow, signedUrl?: string): GalleryPhoto {
  return {
    id: row.id,
    src: signedUrl ?? publicStorageUrl(row.bucket, row.storage_path),
    caption: row.caption,
    width: row.width,
    height: row.height,
    blurDataUrl: row.blur_data_url,
    isFeatured: row.is_featured,
    isSigned: Boolean(signedUrl),
  };
}

function groupAlbums(albums: AlbumRow[], photos: GalleryPhoto[], owners: Map<string, string>): GalleryAlbum[] {
  return albums
    .map((album) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      photos: photos.filter((photo) => owners.get(photo.id) === album.id),
    }))
    .filter((album) => album.photos.length > 0);
}

async function loadAlbums(client: SupabaseClient): Promise<GalleryAlbum[]> {
  const { data: albums } = await client
    .from("gallery_albums")
    .select("*")
    .eq("visibility", "public")
    .order("sort_order")
    .throwOnError();
  const albumRows = (albums ?? []) as AlbumRow[];
  if (albumRows.length === 0) return [];

  const { data: photos } = await client
    .from("gallery_photos")
    .select("*")
    .in("album_id", albumRows.map((album) => album.id))
    .eq("is_visible", true)
    .order("sort_order")
    .throwOnError();
  const photoRows = (photos ?? []) as PhotoRow[];
  const owners = new Map(photoRows.map((photo) => [photo.id, photo.album_id]));
  return groupAlbums(albumRows, photoRows.map((row) => toGalleryPhoto(row)), owners);
}

async function loadInvitation(client: SupabaseClient, state: EventSettings["state"]): Promise<InvitationData | null> {
  const [settings, controls, albums, participants, program, wishes] = await Promise.all([
    client.from("event_settings").select("*").eq("state", state).maybeSingle().throwOnError(),
    client.from("site_controls").select("*").eq("id", 1).maybeSingle().throwOnError(),
    loadAlbums(client),
    client.from("debut_participants").select("*").eq("is_visible", true).order("sort_order").throwOnError(),
    client.from("event_program").select("*").eq("is_visible", true).order("sort_order").throwOnError(),
    client
      .from("guest_messages")
      .select(WISH_COLUMNS)
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(MAX_WISHES_SHOWN)
      .throwOnError(),
  ]);
  if (!settings.data || !controls.data) return null;

  return {
    settings: settings.data as EventSettings,
    controls: controls.data as SiteControls,
    albums,
    participants: (participants.data ?? []) as Participant[],
    program: (program.data ?? []) as ProgramItem[],
    wishes: (wishes.data ?? []) as GuestWish[],
  };
}

/** Returns null only when the project has not been set up yet. Real failures throw. */
export async function getPublishedInvitation(): Promise<InvitationData | null> {
  if (!isSupabaseConfigured) {
    return process.env.NODE_ENV === "development" ? DEV_INVITATION : null;
  }
  return loadInvitation(createAnonClient(), "published");
}

export async function getDraftInvitation(): Promise<InvitationData | null> {
  const admin = await getAdminContext();
  return admin ? loadInvitation(admin.supabase, "draft") : null;
}

export const getInvitedGuest = cache(async (rawCode: string): Promise<InvitedGuest | null> => {
  const code = normalizeInviteCode(rawCode);
  if (!isSupabaseConfigured || !isValidInviteCode(code)) return null;

  const { data } = await createServiceClient()
    .from("guests")
    .select("full_name, invite_code, max_companions, rsvps(full_name, email, phone, status, companions, dietary, message)")
    .eq("invite_code", code)
    .maybeSingle()
    .throwOnError();
  if (!data) return null;

  const rsvp = data.rsvps as unknown as InvitedGuest["rsvp"];
  return { name: data.full_name, code: data.invite_code, maxCompanions: data.max_companions, rsvp };
});

/** Albums reserved for people holding a valid invitation, served through expiring links. */
export async function getGuestOnlyAlbums(): Promise<GalleryAlbum[]> {
  const service = createServiceClient();
  const { data: albums } = await service
    .from("gallery_albums")
    .select("*")
    .eq("visibility", "guests")
    .order("sort_order")
    .throwOnError();
  const albumRows = (albums ?? []) as AlbumRow[];
  if (albumRows.length === 0) return [];

  const { data: photos } = await service
    .from("gallery_photos")
    .select("*")
    .in("album_id", albumRows.map((album) => album.id))
    .eq("is_visible", true)
    .eq("bucket", "private-media")
    .order("sort_order")
    .throwOnError();
  const photoRows = (photos ?? []) as PhotoRow[];
  if (photoRows.length === 0) return [];

  const { data: signed, error } = await service.storage
    .from("private-media")
    .createSignedUrls(photoRows.map((photo) => photo.storage_path), SIGNED_LINK_SECONDS);
  if (error) throw error;

  const links = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  const usable = photoRows.filter((photo) => links.get(photo.storage_path));
  const owners = new Map(usable.map((photo) => [photo.id, photo.album_id]));
  return groupAlbums(albumRows, usable.map((row) => toGalleryPhoto(row, links.get(row.storage_path) ?? undefined)), owners);
}
