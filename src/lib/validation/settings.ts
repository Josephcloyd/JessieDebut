import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

const httpsUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/[^\s]+$/i.test(value), "Please enter a full link starting with https://");

// Images bundled with the site, such as the starting hero portrait, use a path under /images/.
const BUNDLED_IMAGE = /^\/images\/[\w-]+\.[a-z]+$/;

const imageUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value) || BUNDLED_IMAGE.test(value), "Please choose a valid image.")
  .nullable()
  .transform((value) => (value === "" ? null : value));

const tradition = z.object({
  enabled: z.boolean(),
  title: text(60).min(1, "Please enter a title."),
  intro: text(400),
});

const faq = z.object({
  question: text(200).min(1, "Please enter a question."),
  answer: text(800).min(1, "Please enter an answer."),
});

/** Every field the dashboard may change on the draft. Unknown keys are dropped. */
export const settingsDraftSchema = z
  .object({
    celebrant_name: text(80).min(1, "Please enter the celebrant's name."),
    monogram: text(3).min(1, "Please enter initials."),
    event_title: text(120),
    // The database returns offsets such as +00:00, so they must be accepted on the way back in.
    event_at: z.iso.datetime({ offset: true, error: "Please enter a valid date and time." }),
    venue_name: text(160),
    venue_address: text(400),
    maps_url: httpsUrl,
    reception_info: text(800),
    dress_code: text(120),
    dress_code_notes: text(800),
    special_instructions: text(800),
    welcome_heading: text(120),
    welcome_message: text(1500),
    about_title: text(120),
    about_bio: text(3000),
    about_message: text(1500),
    about_image_url: imageUrl,
    hero_eyebrow: text(120),
    hero_description: text(400),
    hero_cta: text(40),
    hero_image_url: imageUrl,
    hero_image_position: z.string().regex(/^\d{1,3}% \d{1,3}%$/, "Invalid image position."),
    hero_cutout_url: imageUrl,
    hero_masthead_light: z.boolean(),
    invitation_hosts: text(200),
    invitation_request: text(400),
    contact_name: text(120),
    contact_phone: text(40),
    contact_email: text(160),
    thank_you_heading: text(120),
    thank_you_message: text(1500),
    traditions: z.object({
      roses: tradition,
      candles: tradition,
      treasures: tradition,
      blue_bills: tradition,
      wishes: tradition,
    }),
    faqs: z.array(faq).max(30),
  })
  .partial();
export type SettingsDraftInput = z.input<typeof settingsDraftSchema>;

export const controlsSchema = z
  .object({
    rsvp_open: z.boolean(),
    default_max_companions: z.number().int().min(0).max(20),
    slideshow_autoplay: z.boolean(),
    slideshow_interval_seconds: z.number().int().min(2, "The minimum is 2 seconds.").max(30, "The maximum is 30 seconds."),
    music_enabled: z.boolean(),
    music_url: imageUrl,
    music_title: text(120),
    guestbook_open: z.boolean(),
    guest_uploads_enabled: z.boolean(),
  })
  .partial();
export type ControlsInput = z.input<typeof controlsSchema>;
