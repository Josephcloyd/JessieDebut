"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { adminAction, parseOrThrow, refreshPublicSite } from "@/lib/server/action";
import { removeStoredFiles } from "@/lib/server/storage";
import type { Participant, ProgramItem } from "@/lib/types";
import { participantSchema, programItemSchema, type ParticipantInput, type ProgramItemInput } from "@/lib/validation/content";

const uuid = z.uuid("Invalid item.");

async function nextPosition(supabase: SupabaseClient, table: string): Promise<number> {
  const { data } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1).throwOnError();
  return (data?.[0]?.sort_order ?? 0) + 1;
}

export async function saveParticipant(id: string | null, input: ParticipantInput): Promise<ActionResult<Participant>> {
  return adminAction("saveParticipant", async (supabase) => {
    const fields = parseOrThrow(participantSchema, input);
    const table = supabase.from("debut_participants");
    const query = id
      ? table.update(fields).eq("id", parseOrThrow(uuid, id))
      : table.insert({ ...fields, sort_order: await nextPosition(supabase, "debut_participants") });
    const { data } = await query.select("*").single().throwOnError();
    refreshPublicSite();
    return data as Participant;
  });
}

export async function deleteParticipant(id: string): Promise<ActionResult> {
  return adminAction("deleteParticipant", async (supabase) => {
    const { data } = await supabase.from("debut_participants").delete().eq("id", parseOrThrow(uuid, id)).select("photo_path").single().throwOnError();
    if (data.photo_path) await removeStoredFiles("public-media", [data.photo_path]);
    refreshPublicSite();
  });
}

export async function saveProgramItem(id: string | null, input: ProgramItemInput): Promise<ActionResult<ProgramItem>> {
  return adminAction("saveProgramItem", async (supabase) => {
    const fields = parseOrThrow(programItemSchema, input);
    const table = supabase.from("event_program");
    const query = id
      ? table.update(fields).eq("id", parseOrThrow(uuid, id))
      : table.insert({ ...fields, sort_order: await nextPosition(supabase, "event_program") });
    const { data } = await query.select("*").single().throwOnError();
    refreshPublicSite();
    return data as ProgramItem;
  });
}

export async function deleteProgramItem(id: string): Promise<ActionResult> {
  return adminAction("deleteProgramItem", async (supabase) => {
    const { data } = await supabase.from("event_program").delete().eq("id", parseOrThrow(uuid, id)).select("image_path").single().throwOnError();
    if (data.image_path) await removeStoredFiles("public-media", [data.image_path]);
    refreshPublicSite();
  });
}
