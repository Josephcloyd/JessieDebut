export type DetectedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "audio/mpeg"
  | "audio/mp4"
  | "audio/aac";

/** How many leading bytes detectFileType needs. */
export const FILE_SIGNATURE_BYTES = 32;

function asciiAt(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function detectIsoMedia(bytes: Uint8Array): DetectedFileType | null {
  if (asciiAt(bytes, 4, 4) !== "ftyp") return null;
  const brand = asciiAt(bytes, 8, 4);
  if (brand === "avif" || brand === "avis") return "image/avif";
  return ["M4A ", "M4B ", "isom", "mp42", "mp41", "dash"].includes(brand) ? "audio/mp4" : null;
}

function detectFrameSync(bytes: Uint8Array): DetectedFileType | null {
  if (bytes[0] !== 0xff || (bytes[1] & 0xe0) !== 0xe0) return null;
  // ADTS AAC reserves the layer bits as 00; MP3 frames never do.
  return (bytes[1] & 0x06) === 0 ? "audio/aac" : "audio/mpeg";
}

/** Identifies a file from its first bytes, ignoring its name and declared type. */
export function detectFileType(bytes: Uint8Array): DetectedFileType | null {
  if (bytes.length < 3) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (asciiAt(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP") return "image/webp";
  if (asciiAt(bytes, 0, 3) === "ID3") return "audio/mpeg";
  return detectIsoMedia(bytes) ?? detectFrameSync(bytes);
}

export function matchesDeclaredType(detected: DetectedFileType, declared: string): boolean {
  const canonical = declared === "audio/x-m4a" ? "audio/mp4" : declared;
  return detected === canonical;
}
