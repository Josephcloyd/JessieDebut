"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { buildStoragePath, validateUpload } from "@/lib/domain/upload-rules";
import { UserError, adminAction, parseOrThrow } from "@/lib/server/action";
import { verifyStoredFile, type MediaBucket } from "@/lib/server/storage";
import { createServiceClient } from "@/lib/supabase/clients.server";
import { publicStorageUrl } from "@/lib/supabase/env";

const ticketSchema = z.object({
  kind: z.enum(["image", "audio"]),
  folder: z.enum(["hero", "about", "gallery", "participants", "program", "music"]),
  contentType: z.string(),
  size: z.number(),
  albumId: z.uuid().optional(),
});

export interface UploadTicket {
  bucket: MediaBucket;
  path: string;
  token: string;
}

export async function createUploadTicket(input: z.input<typeof ticketSchema>): Promise<ActionResult<UploadTicket>> {
  return adminAction("createUploadTicket", async (supabase) => {
    const file = parseOrThrow(ticketSchema, input);
    const problem = validateUpload(file);
    if (problem) throw new UserError(problem);

    let bucket: MediaBucket = "public-media";
    if (file.albumId) {
      const { data } = await supabase.from("gallery_albums").select("visibility").eq("id", file.albumId).single().throwOnError();
      if (data.visibility !== "public") bucket = "private-media";
    }

    const path = buildStoragePath(file.folder, file.contentType, crypto.randomUUID());
    const { data, error } = await createServiceClient().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("No upload ticket returned");
    return { bucket, path, token: data.token };
  });
}

const assetSchema = z.object({
  kind: z.enum(["image", "audio"]),
  path: z.string().regex(/^[a-z-]+\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/, "Invalid file path."),
});

/** Checks a finished upload and returns its permanent public address. */
export async function confirmPublicAsset(input: z.input<typeof assetSchema>): Promise<ActionResult<{ url: string; path: string }>> {
  return adminAction("confirmPublicAsset", async () => {
    const { kind, path } = parseOrThrow(assetSchema, input);
    await verifyStoredFile("public-media", path, kind);
    return { url: publicStorageUrl("public-media", path), path };
  });
}
