import "server-only";

import { FILE_SIGNATURE_BYTES, detectFileType } from "@/lib/domain/file-type";
import type { UploadKind } from "@/lib/domain/upload-rules";
import { createServiceClient } from "@/lib/supabase/clients.server";
import { UserError } from "./action";

export type MediaBucket = "public-media" | "private-media";

const VERIFY_LINK_SECONDS = 60;

/** Inspects the stored bytes, and deletes the file if it isn't what it claims to be. */
export async function verifyStoredFile(bucket: MediaBucket, path: string, kind: UploadKind): Promise<void> {
  const storage = createServiceClient().storage.from(bucket);
  const { data, error } = await storage.createSignedUrl(path, VERIFY_LINK_SECONDS);
  if (error || !data) throw new UserError("We couldn't find that upload. Please try again.");

  const response = await fetch(data.signedUrl, { headers: { Range: `bytes=0-${FILE_SIGNATURE_BYTES - 1}` } });
  if (!response.ok) throw new Error(`Could not read uploaded file: ${response.status}`);

  const detected = detectFileType(new Uint8Array(await response.arrayBuffer()));
  if (!detected?.startsWith(`${kind}/`)) {
    await storage.remove([path]);
    throw new UserError("That file doesn't appear to be a valid " + kind + " file.");
  }
}

export async function removeStoredFiles(bucket: MediaBucket, paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await createServiceClient().storage.from(bucket).remove([...paths]);
  // The database record is already gone, so a leftover file should not fail the action.
  if (error) console.error("[storage:remove]", bucket, error.message);
}

export async function moveStoredFile(from: MediaBucket, to: MediaBucket, path: string): Promise<void> {
  if (from === to) return;
  const { error } = await createServiceClient().storage.from(from).move(path, path, { destinationBucket: to });
  if (error) throw new Error(`Could not move ${path}: ${error.message}`);
}
