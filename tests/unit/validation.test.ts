import { describe, expect, it } from "vitest";
import { albumSchema, guestSchema, participantSchema, photoRegistrationSchema, programItemSchema } from "@/lib/validation/content";
import { rsvpSchema, wishSchema } from "@/lib/validation/guest-forms";
import { controlsSchema, settingsDraftSchema } from "@/lib/validation/settings";

const validRsvp = {
  code: "abcd2345",
  fullName: "  Ana Reyes ",
  email: "",
  phone: "",
  status: "attending",
  companions: 1,
  dietary: "",
  message: "",
};

describe("rsvpSchema", () => {
  it("normalizes valid input", () => {
    const parsed = rsvpSchema.parse(validRsvp);
    expect(parsed.code).toBe("ABCD2345");
    expect(parsed.fullName).toBe("Ana Reyes");
    expect(parsed.email).toBeNull();
  });

  it("gives readable messages for bad fields", () => {
    const result = rsvpSchema.safeParse({ ...validRsvp, fullName: "", email: "nope", status: "maybe" });
    expect(result.success).toBe(false);
    const fields = result.error?.flatten().fieldErrors;
    expect(fields?.fullName?.[0]).toMatch(/name/i);
    expect(fields?.email?.[0]).toMatch(/email/i);
    expect(fields?.status?.[0]).toMatch(/attending/i);
  });

  it("rejects negative and fractional companions", () => {
    expect(rsvpSchema.safeParse({ ...validRsvp, companions: -1 }).success).toBe(false);
    expect(rsvpSchema.safeParse({ ...validRsvp, companions: 1.5 }).success).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    expect(rsvpSchema.safeParse({ ...validRsvp, phone: "call me" }).success).toBe(false);
    expect(rsvpSchema.safeParse({ ...validRsvp, phone: "+63 917 123 4567" }).success).toBe(true);
  });
});

describe("wishSchema", () => {
  it("requires a name and message within limits", () => {
    expect(wishSchema.safeParse({ guestName: "", message: "hi" }).success).toBe(false);
    expect(wishSchema.safeParse({ guestName: "A", message: "x".repeat(801) }).success).toBe(false);
    expect(wishSchema.safeParse({ guestName: "A", message: "Happy birthday" }).success).toBe(true);
  });
});

describe("settingsDraftSchema", () => {
  it("accepts a partial update", () => {
    expect(settingsDraftSchema.parse({ venue_name: "The Manor" })).toEqual({ venue_name: "The Manor" });
  });

  it("accepts the event time in the format the database returns", () => {
    expect(settingsDraftSchema.safeParse({ event_at: "2027-03-20T10:00:00+00:00" }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ event_at: "2027-03-20T10:00:00.000Z" }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ event_at: "next Saturday" }).success).toBe(false);
  });

  it("drops fields that are not editable", () => {
    expect(settingsDraftSchema.parse({ state: "published", venue_name: "X" })).toEqual({ venue_name: "X" });
  });

  it("refuses script links in the map URL", () => {
    expect(settingsDraftSchema.safeParse({ maps_url: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsDraftSchema.safeParse({ maps_url: "https://maps.app.goo.gl/x" }).success).toBe(true);
  });

  it("accepts uploaded and bundled images but not script links", () => {
    expect(settingsDraftSchema.safeParse({ hero_image_url: "/images/jessiemae-hero.webp" }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ hero_image_url: "https://x.supabase.co/a.webp" }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ hero_image_url: null }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ hero_image_url: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsDraftSchema.safeParse({ hero_image_url: "/images/../secret.webp" }).success).toBe(false);
  });

  it("validates image focus position", () => {
    expect(settingsDraftSchema.safeParse({ hero_image_position: "20% 40%" }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ hero_image_position: "url(x)" }).success).toBe(false);
  });

  it("validates FAQ entries and tradition settings", () => {
    expect(settingsDraftSchema.safeParse({ faqs: [{ question: "", answer: "a" }] }).success).toBe(false);
    const traditions = {
      roses: { enabled: true, title: "18 Roses", intro: "" },
      candles: { enabled: false, title: "18 Candles", intro: "" },
      treasures: { enabled: false, title: "18 Treasures", intro: "" },
      blue_bills: { enabled: false, title: "18 Blue Bills", intro: "" },
      wishes: { enabled: false, title: "18 Wishes", intro: "" },
    };
    expect(settingsDraftSchema.safeParse({ traditions }).success).toBe(true);
    expect(settingsDraftSchema.safeParse({ traditions: { roses: traditions.roses } }).success).toBe(false);
  });
});

describe("controlsSchema", () => {
  it("bounds slideshow timing and companions", () => {
    expect(controlsSchema.safeParse({ slideshow_interval_seconds: 1 }).success).toBe(false);
    expect(controlsSchema.safeParse({ slideshow_interval_seconds: 8 }).success).toBe(true);
    expect(controlsSchema.safeParse({ default_max_companions: 21 }).success).toBe(false);
  });
});

describe("photoRegistrationSchema", () => {
  const photo = { storagePath: "gallery/11111111-1111-4111-8111-111111111111.webp", width: 1, height: 1, blurDataUrl: null };

  it("accepts a real image preview", () => {
    expect(photoRegistrationSchema.safeParse({ ...photo, blurDataUrl: "data:image/webp;base64,AAAA" }).success).toBe(true);
  });

  it("rejects previews that could carry markup", () => {
    expect(photoRegistrationSchema.safeParse({ ...photo, blurDataUrl: "data:image/svg+xml,<svg onload=alert(1)>" }).success).toBe(false);
    expect(photoRegistrationSchema.safeParse({ ...photo, blurDataUrl: 'data:image/png;base64,AA");}' }).success).toBe(false);
  });

  it("rejects paths outside the expected shape", () => {
    expect(photoRegistrationSchema.safeParse({ ...photo, storagePath: "../secret.png" }).success).toBe(false);
  });
});

describe("content schemas", () => {
  it("guestSchema requires a name and blanks optional contact fields", () => {
    expect(guestSchema.safeParse({ full_name: "", max_companions: 1 }).success).toBe(false);
    expect(guestSchema.parse({ full_name: "Ana", email: "", phone: "", max_companions: 2, notes: "" }).email).toBeNull();
  });

  it("participantSchema only allows known traditions", () => {
    expect(participantSchema.safeParse({ tradition: "roses", name: "Ben" }).success).toBe(true);
    expect(participantSchema.safeParse({ tradition: "pearls", name: "Ben" }).success).toBe(false);
  });

  it("programItemSchema validates time format", () => {
    expect(programItemSchema.safeParse({ title: "Dinner", start_time: "19:15" }).success).toBe(true);
    expect(programItemSchema.safeParse({ title: "Dinner", start_time: "7pm" }).success).toBe(false);
    expect(programItemSchema.parse({ title: "Dinner", start_time: "" }).start_time).toBeNull();
  });

  it("albumSchema only allows known visibility values", () => {
    expect(albumSchema.safeParse({ name: "A", visibility: "secret" }).success).toBe(false);
    expect(albumSchema.parse({ name: "A" }).visibility).toBe("public");
  });
});
