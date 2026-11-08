import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminStats,
  AlbumRow,
  EventSettings,
  GuestRow,
  GuestUploadRow,
  GuestWithRsvp,
  MessageRow,
  Participant,
  PhotoRow,
  ProgramItem,
  RsvpRow,
  SiteControls,
} from "@/lib/types";

export async function getDraftSettings(client: SupabaseClient): Promise<EventSettings> {
  const { data } = await client.from("event_settings").select("*").eq("state", "draft").single().throwOnError();
  return data as EventSettings;
}

export async function getControls(client: SupabaseClient): Promise<SiteControls> {
  const { data } = await client.from("site_controls").select("*").eq("id", 1).single().throwOnError();
  return data as SiteControls;
}

export async function getStats(client: SupabaseClient): Promise<AdminStats> {
  const { data, error } = await client.rpc("admin_stats");
  if (error) throw error;
  return data as AdminStats;
}

export async function getGuestsWithRsvps(client: SupabaseClient): Promise<GuestWithRsvp[]> {
  const { data } = await client
    .from("guests")
    .select("*, rsvps(*)")
    .order("full_name")
    .throwOnError();
  return ((data ?? []) as (GuestRow & { rsvps: RsvpRow | null })[]).map(({ rsvps, ...guest }) => ({
    ...guest,
    rsvp: rsvps,
  }));
}

export async function getAlbumsWithPhotos(client: SupabaseClient): Promise<{ albums: AlbumRow[]; photos: PhotoRow[] }> {
  const [albums, photos] = await Promise.all([
    client.from("gallery_albums").select("*").order("sort_order").throwOnError(),
    client.from("gallery_photos").select("*").order("sort_order").throwOnError(),
  ]);
  return { albums: (albums.data ?? []) as AlbumRow[], photos: (photos.data ?? []) as PhotoRow[] };
}

export async function getParticipants(client: SupabaseClient): Promise<Participant[]> {
  const { data } = await client.from("debut_participants").select("*").order("sort_order").throwOnError();
  return (data ?? []) as Participant[];
}

export async function getProgram(client: SupabaseClient): Promise<ProgramItem[]> {
  const { data } = await client.from("event_program").select("*").order("sort_order").throwOnError();
  return (data ?? []) as ProgramItem[];
}

export async function getMessages(client: SupabaseClient): Promise<MessageRow[]> {
  const { data } = await client.from("guest_messages").select("*").order("created_at", { ascending: false }).throwOnError();
  return (data ?? []) as MessageRow[];
}

export async function getGuestUploads(client: SupabaseClient): Promise<GuestUploadRow[]> {
  const { data } = await client.from("guest_uploads").select("*").order("created_at", { ascending: false }).throwOnError();
  return (data ?? []) as GuestUploadRow[];
}
