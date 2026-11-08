export type UploadKind = "image" | "audio";

const MEGABYTE = 1024 * 1024;

const RULES: Record<UploadKind, { types: readonly string[]; maxBytes: number; label: string }> = {
  image: {
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    maxBytes: 15 * MEGABYTE,
    label: "Please choose a JPG, PNG, WebP or AVIF image.",
  },
  audio: {
    types: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac"],
    maxBytes: 25 * MEGABYTE,
    label: "Please choose an MP3, M4A or AAC audio file.",
  },
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

export interface UploadRequest {
  kind: UploadKind;
  contentType: string;
  size: number;
}

/** Returns a message explaining the problem, or null when the upload is allowed. */
export function validateUpload({ kind, contentType, size }: UploadRequest): string | null {
  const rule = RULES[kind];
  if (!rule.types.includes(contentType)) return rule.label;
  if (size <= 0) return "That file is empty.";
  if (size > rule.maxBytes) return `That file is too large. The limit is ${rule.maxBytes / MEGABYTE} MB.`;
  return null;
}

export function buildStoragePath(folder: string, contentType: string, id: string): string {
  return `${folder}/${id}.${EXTENSIONS[contentType]}`;
}

export const IMAGE_ACCEPT = RULES.image.types.join(",");
export const AUDIO_ACCEPT = RULES.audio.types.join(",");
