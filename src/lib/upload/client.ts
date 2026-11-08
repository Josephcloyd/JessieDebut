"use client";

import { createBrowserClient } from "@supabase/ssr";
import imageCompression from "browser-image-compression";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const MAX_IMAGE_EDGE = 2400;
const MAX_IMAGE_MB = 3;
const BLUR_EDGE = 16;

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
  blurDataUrl: string | null;
}

function createBlurDataUrl(bitmap: ImageBitmap): string | null {
  const scale = BLUR_EDGE / Math.max(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.5);
}

/** Shrinks a photo in the browser so uploads are fast and pages stay light. */
export async function prepareImage(original: File): Promise<PreparedImage> {
  const file = await imageCompression(original, {
    maxWidthOrHeight: MAX_IMAGE_EDGE,
    maxSizeMB: MAX_IMAGE_MB,
    fileType: "image/webp",
    initialQuality: 0.86,
    // The library's worker loads its code from a public CDN, so it stays off.
    useWebWorker: false,
  });
  const bitmap = await createImageBitmap(file);
  try {
    return {
      file: new File([file], "photo.webp", { type: "image/webp" }),
      width: bitmap.width,
      height: bitmap.height,
      blurDataUrl: createBlurDataUrl(bitmap),
    };
  } finally {
    bitmap.close();
  }
}

export async function sendToStorage(bucket: string, path: string, token: string, file: File): Promise<void> {
  const client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await client.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new Error("The upload didn't finish. Please check your connection and try again.");
}
