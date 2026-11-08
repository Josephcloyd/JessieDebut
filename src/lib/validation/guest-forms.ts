import { z } from "zod";
import { isValidInviteCode, normalizeInviteCode } from "@/lib/domain/invite-code";

const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

const optionalText = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`).default("");

const blankToNull = (value: string): string | null => (value === "" ? null : value);

export const inviteCodeSchema = z
  .string()
  .transform(normalizeInviteCode)
  .refine(isValidInviteCode, "Please check your invitation code.");

export const rsvpSchema = z.object({
  code: inviteCodeSchema,
  fullName: z.string().trim().min(1, "Please enter your full name.").max(120, "Please shorten your name."),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, "Please enter a valid email address.")
    .transform(blankToNull),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE_PATTERN.test(value), "Please enter a valid contact number.")
    .transform(blankToNull),
  status: z.enum(["attending", "declined"], { error: "Please choose attending or unable to attend." }),
  companions: z.number().int("Please enter a whole number.").min(0, "This can't be negative.").max(20),
  dietary: optionalText(300),
  message: optionalText(800),
});
export type RsvpInput = z.input<typeof rsvpSchema>;

export const wishSchema = z.object({
  guestName: z.string().trim().min(1, "Please enter your name.").max(80, "Please shorten your name."),
  message: z.string().trim().min(1, "Please write your message.").max(800, "Please keep your message under 800 characters."),
});
export type WishInput = z.input<typeof wishSchema>;
