"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { buildStoragePath, validateUpload } from "@/lib/domain/upload-rules";
import { UserError, enforceRateLimit, guestAction, parseOrThrow } from "@/lib/server/action";
import { verifyStoredFile } from "@/lib/server/storage";
import { createServiceClient } from "@/lib/supabase/clients.server";
import { getInvitedGuest } from "@/lib/data/invitation";
import { photoRegistrationSchema } from "@/lib/validation/content";
import { inviteCodeSchema, rsvpSchema, wishSchema, type RsvpInput, type WishInput } from "@/lib/validation/guest-forms";
import type { InvitedGuest } from "@/lib/types";

const TEN_MINUTES = 600;
const ONE_HOUR = 3600;
const GUEST_UPLOAD_FOLDER = "guest-uploads";

const RSVP_FAILURES: Record<string, string> = {
  closed: "RSVPs are now closed. Please contact the organizer for help.",
  unknown_code: "We couldn't find that invitation code. Please check it and try again.",
  over_allowance: "That is more companions than your invitation allows.",
};

/** A filled-in honeypot means a bot. It gets a success response and nothing is saved. */
const isBot = (honeypot: string | undefined): boolean => Boolean(honeypot);

export async function submitRsvp(input: RsvpInput, honeypot?: string): Promise<ActionResult> {
  return guestAction("submitRsvp", async () => {
    if (isBot(honeypot)) return;
    const rsvp = parseOrThrow(rsvpSchema, input);
    await enforceRateLimit("rsvp", 12, TEN_MINUTES);

    const { data, error } = await createServiceClient().rpc("submit_rsvp", {
      p_code: rsvp.code,
      p_full_name: rsvp.fullName,
      p_email: rsvp.email,
      p_phone: rsvp.phone,
      p_status: rsvp.status,
      p_companions: rsvp.companions,
      p_dietary: rsvp.dietary,
      p_message: rsvp.message,
    });
    if (error) throw error;
    if (data !== "ok") throw new UserError(RSVP_FAILURES[data as string] ?? "We couldn't save your RSVP.");
  });
}

export async function findInvitation(rawCode: string): Promise<ActionResult<InvitedGuest>> {
  return guestAction("findInvitation", async () => {
    const code = parseOrThrow(inviteCodeSchema, rawCode);
    await enforceRateLimit("code-lookup", 15, TEN_MINUTES);
    const guest = await getInvitedGuest(code);
    if (!guest) throw new UserError("We couldn't find that invitation code. Please check it and try again.");
    return guest;
  });
}

async function assertControlEnabled(column: "guestbook_open" | "guest_uploads_enabled", message: string): Promise<void> {
  const { data } = await createServiceClient().from("site_controls").select(column).eq("id", 1).single().throwOnError();
  if (!(data as Record<string, boolean>)[column]) throw new UserError(message);
}

export async function submitWish(input: WishInput, honeypot?: string): Promise<ActionResult> {
  return guestAction("submitWish", async () => {
    if (isBot(honeypot)) return;
    const wish = parseOrThrow(wishSchema, input);
    await enforceRateLimit("wish", 6, ONE_HOUR);
    await assertControlEnabled("guestbook_open", "The guestbook is closed for now.");

    await createServiceClient()
      .from("guest_messages")
      .insert({ guest_name: wish.guestName, message: wish.message })
      .throwOnError();
  });
}

const guestTicketSchema = z.object({ contentType: z.string(), size: z.number() });

export async function createGuestUploadTicket(input: z.input<typeof guestTicketSchema>): Promise<ActionResult<{ path: string; token: string }>> {
  return guestAction("createGuestUploadTicket", async () => {
    const file = parseOrThrow(guestTicketSchema, input);
    const problem = validateUpload({ kind: "image", ...file });
    if (problem) throw new UserError(problem);
    await assertControlEnabled("guest_uploads_enabled", "Photo sharing isn't open right now.");
    await enforceRateLimit("guest-upload", 40, ONE_HOUR);

    const path = buildStoragePath(GUEST_UPLOAD_FOLDER, file.contentType, crypto.randomUUID());
    const { data, error } = await createServiceClient().storage.from("private-media").createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("No upload ticket returned");
    return { path, token: data.token };
  });
}

const guestUploadSchema = z.object({
  uploaderName: z.string().trim().min(1, "Please enter your name.").max(80),
  photo: photoRegistrationSchema,
});

export async function confirmGuestUpload(input: z.input<typeof guestUploadSchema>): Promise<ActionResult> {
  return guestAction("confirmGuestUpload", async () => {
    const { uploaderName, photo } = parseOrThrow(guestUploadSchema, input);
    if (!photo.storagePath.startsWith(`${GUEST_UPLOAD_FOLDER}/`)) throw new UserError("Invalid upload.");
    await assertControlEnabled("guest_uploads_enabled", "Photo sharing isn't open right now.");
    await enforceRateLimit("guest-confirm", 60, ONE_HOUR);
    await verifyStoredFile("private-media", photo.storagePath, "image");

    await createServiceClient()
      .from("guest_uploads")
      .insert({
        uploader_name: uploaderName,
        storage_path: photo.storagePath,
        caption: photo.caption,
        width: photo.width,
        height: photo.height,
        blur_data_url: photo.blurDataUrl,
      })
      .throwOnError();
  });
}
