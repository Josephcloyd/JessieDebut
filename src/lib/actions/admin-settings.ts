"use server";

import type { ActionResult } from "@/lib/action-result";
import { adminAction, parseOrThrow, refreshPublicSite } from "@/lib/server/action";
import { controlsSchema, settingsDraftSchema, type ControlsInput, type SettingsDraftInput } from "@/lib/validation/settings";

export async function saveDraftSettings(input: SettingsDraftInput): Promise<ActionResult> {
  return adminAction("saveDraftSettings", async (supabase) => {
    const changes = parseOrThrow(settingsDraftSchema, input);
    await supabase.from("event_settings").update(changes).eq("state", "draft").throwOnError();
    await supabase.from("site_controls").update({ has_unpublished_changes: true }).eq("id", 1).throwOnError();
  });
}

export async function publishChanges(): Promise<ActionResult> {
  return adminAction("publishChanges", async (supabase) => {
    const { error } = await supabase.rpc("publish_event_settings");
    if (error) throw error;
    refreshPublicSite();
  });
}

/** Controls such as RSVP open/closed apply immediately, without Publish. */
export async function saveControls(input: ControlsInput): Promise<ActionResult> {
  return adminAction("saveControls", async (supabase) => {
    const changes = parseOrThrow(controlsSchema, input);
    await supabase.from("site_controls").update(changes).eq("id", 1).throwOnError();
    refreshPublicSite();
  });
}
