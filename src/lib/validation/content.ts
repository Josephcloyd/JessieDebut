import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const blankToNull = (value: string | undefined): string | null => (value ? value : null);

export const guestSchema = z.object({
  full_name: text(120).min(1, "Please enter the guest's name."),
  email: text(160).optional().transform(blankToNull),
  phone: text(40).optional().transform(blankToNull),
  max_companions: z.number().int().min(0, "This can't be negative.").max(20, "The maximum is 20."),
  notes: text(500).default(""),
});
export type GuestInput = z.input<typeof guestSchema>;

export const adminRsvpSchema = z.object({
  status: z.enum(["attending", "declined"]),
  companions: z.number().int().min(0).max(20),
  dietary: text(300).default(""),
  message: text(800).default(""),
});
export type AdminRsvpInput = z.input<typeof adminRsvpSchema>;

export const TRADITION_KEYS = ["roses", "candles", "treasures", "blue_bills", "wishes"] as const;

export const participantSchema = z.object({
  tradition: z.enum(TRADITION_KEYS),
  name: text(120).min(1, "Please enter a name."),
  relationship: text(120).default(""),
  message: text(800).default(""),
  photo_url: z.string().nullable().optional(),
  photo_path: z.string().nullable().optional(),
  is_visible: z.boolean().default(true),
});
export type ParticipantInput = z.input<typeof participantSchema>;

export const programItemSchema = z.object({
  title: text(120).min(1, "Please enter a title."),
  start_time: z
    .string()
    .regex(/^(\d{2}:\d{2}(:\d{2})?)?$/, "Please enter a valid time.")
    .optional()
    .transform(blankToNull),
  description: text(500).default(""),
  image_url: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  is_visible: z.boolean().default(true),
});
export type ProgramItemInput = z.input<typeof programItemSchema>;

export const albumSchema = z.object({
  name: text(80).min(1, "Please enter an album name."),
  description: text(300).default(""),
  visibility: z.enum(["public", "guests", "hidden"]).default("public"),
});
export type AlbumInput = z.input<typeof albumSchema>;

export const photoRegistrationSchema = z.object({
  storagePath: z.string().regex(/^[a-z-]+\/[0-9a-f-]{36}\.[a-z0-9]{3,4}$/, "Invalid file path."),
  caption: text(300).default(""),
  width: z.number().int().min(0),
  height: z.number().int().min(0),
  blurDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Invalid image preview.").max(4000).nullable(),
});
export type PhotoRegistrationInput = z.input<typeof photoRegistrationSchema>;
