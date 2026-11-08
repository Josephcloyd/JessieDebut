import type { InvitationData, TraditionKey } from "@/lib/types";

/**
 * Lets the invitation render in `next dev` before Supabase is connected.
 * Production never uses this: it shows a setup notice instead.
 */
const participants = (tradition: TraditionKey, names: string[], message: string) =>
  names.map((name, index) => ({
    id: `${tradition}-${index}`,
    tradition,
    name,
    relationship: index % 2 === 0 ? "Family" : "Friend",
    message,
    photo_url: null,
    photo_path: null,
    is_visible: true,
    sort_order: index,
  }));

export const DEV_INVITATION: InvitationData = {
  settings: {
    state: "published",
    celebrant_name: "Jessiemae",
    monogram: "J",
    event_title: "The Grand Debut",
    event_at: "2027-03-20T10:00:00.000Z",
    venue_name: "Add your venue name",
    venue_address: "Add the complete venue address",
    maps_url: "https://maps.google.com",
    reception_info: "Dinner and dancing follow the program in the main hall.",
    dress_code: "Formal in Neutrals",
    dress_code_notes: "Think ivory, champagne, beige and soft gold. Please avoid bright colors.",
    special_instructions: "Please arrive thirty minutes before the program begins.",
    welcome_heading: "With Grateful Hearts",
    welcome_message: "You are warmly invited to celebrate an evening of family, friendship and new beginnings.",
    about_title: "The Girl Behind the Celebration",
    about_bio: "Add a short introduction here from the admin dashboard.",
    about_message: "Add a heartfelt message here from the admin dashboard.",
    about_image_url: null,
    hero_eyebrow: "An Evening to Remember",
    hero_description: "Celebrating eighteen beautiful years and the beginning of a new chapter.",
    hero_cta: "RSVP Now",
    hero_image_url: "/images/jessiemae-hero.webp",
    hero_image_position: "50% 15%",
    hero_cutout_url: null,
    hero_masthead_light: true,
    invitation_hosts: "Add the names of the hosts",
    invitation_request: "request the honour of your presence at the eighteenth birthday celebration of their daughter",
    contact_name: "The Organizer",
    contact_phone: "+63 900 000 0000",
    contact_email: "",
    thank_you_heading: "Thank You",
    thank_you_message: "Your presence is the most treasured gift of all.",
    traditions: {
      roses: { enabled: true, title: "18 Roses", intro: "Eighteen gentlemen, each offering a rose and a dance." },
      candles: { enabled: true, title: "18 Candles", intro: "Eighteen dear women, each lighting a candle with a wish." },
      treasures: { enabled: true, title: "18 Treasures", intro: "Eighteen keepsakes given with love." },
      blue_bills: { enabled: true, title: "18 Blue Bills", intro: "Eighteen blessings for the road ahead." },
      wishes: { enabled: true, title: "18 Wishes", intro: "Eighteen heartfelt messages for a new chapter." },
    },
    faqs: [{ question: "May I bring a guest?", answer: "Your personal invitation shows how many companions are reserved for you." }],
    updated_at: "2026-11-08T00:00:00.000Z",
  },
  controls: {
    rsvp_open: true,
    default_max_companions: 1,
    slideshow_autoplay: true,
    slideshow_interval_seconds: 5,
    music_enabled: false,
    music_url: null,
    music_title: "",
    guestbook_open: true,
    guest_uploads_enabled: false,
    has_unpublished_changes: false,
    published_at: null,
  },
  albums: [],
  participants: [
    ...participants("roses", ["Sample Name One", "Sample Name Two", "Sample Name Three", "Sample Name Four"], ""),
    ...participants("candles", ["Sample Name One", "Sample Name Two", "Sample Name Three"], "May your light always find you."),
    ...participants("treasures", ["Sample Name One", "Sample Name Two"], "A keepsake to remember this day."),
    ...participants("blue_bills", ["Sample Name One", "Sample Name Two"], ""),
    ...participants("wishes", ["Sample Name One", "Sample Name Two"], "Wishing you joy in every chapter still to come."),
  ],
  program: [
    { id: "p1", title: "Guest Arrival", start_time: "17:30:00", description: "Welcome drinks and photographs.", image_url: null, image_path: null, is_visible: true, sort_order: 1 },
    { id: "p2", title: "Grand Entrance", start_time: "18:15:00", description: "The debutant makes her entrance.", image_url: null, image_path: null, is_visible: true, sort_order: 2 },
    { id: "p3", title: "Dinner", start_time: "19:15:00", description: "Dinner is served.", image_url: null, image_path: null, is_visible: true, sort_order: 3 },
  ],
  wishes: [
    { id: "w1", guest_name: "Sample Guest", message: "Wishing you a lifetime of beautiful chapters.", is_featured: true, created_at: "2026-11-08T00:00:00.000Z" },
    { id: "w2", guest_name: "Another Guest", message: "So proud of the woman you are becoming.", is_featured: false, created_at: "2026-11-08T00:00:00.000Z" },
  ],
};
