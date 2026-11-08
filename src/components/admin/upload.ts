"use client";

import { confirmPublicAsset, createUploadTicket } from "@/lib/actions/admin-media";
import type { UploadKind } from "@/lib/domain/upload-rules";
import { prepareImage, sendToStorage } from "@/lib/upload/client";
import type { PhotoRegistrationInput } from "@/lib/validation/content";

export type AssetFolder = "hero" | "about" | "participants" | "program" | "music";

async function sendPublicFile(file: File, kind: UploadKind, folder: AssetFolder): Promise<{ url: string; path: string }> {
  const ticket = await createUploadTicket({ kind, folder, contentType: file.type, size: file.size });
  if (!ticket.ok) throw new Error(ticket.error);
  await sendToStorage(ticket.data.bucket, ticket.data.path, ticket.data.token, file);
  const asset = await confirmPublicAsset({ kind, path: ticket.data.path });
  if (!asset.ok) throw new Error(asset.error);
  return asset.data;
}

export async function uploadPublicImage(original: File, folder: AssetFolder): Promise<{ url: string; path: string }> {
  const prepared = await prepareImage(original);
  return sendPublicFile(prepared.file, "image", folder);
}

export function uploadAudio(file: File): Promise<{ url: string; path: string }> {
  return sendPublicFile(file, "audio", "music");
}

/** Sends a photo to the bucket matching its album and returns what the server must register. */
export async function uploadAlbumPhoto(original: File, albumId: string): Promise<PhotoRegistrationInput> {
  const prepared = await prepareImage(original);
  const ticket = await createUploadTicket({
    kind: "image",
    folder: "gallery",
    contentType: prepared.file.type,
    size: prepared.file.size,
    albumId,
  });
  if (!ticket.ok) throw new Error(ticket.error);
  await sendToStorage(ticket.data.bucket, ticket.data.path, ticket.data.token, prepared.file);
  return {
    storagePath: ticket.data.path,
    caption: "",
    width: prepared.width,
    height: prepared.height,
    blurDataUrl: prepared.blurDataUrl,
  };
}
