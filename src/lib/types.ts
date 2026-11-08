export type TraditionKey = "roses" | "candles" | "treasures" | "blue_bills" | "wishes";

export interface TraditionConfig {
  enabled: boolean;
  title: string;
  intro: string;
}

export type TraditionsConfig = Record<TraditionKey, TraditionConfig>;

export interface Faq {
  question: string;
  answer: string;
}

export interface EventSettings {
  state: "draft" | "published";
  celebrant_name: string;
  monogram: string;
  event_title: string;
  event_at: string;
  venue_name: string;
  venue_address: string;
  maps_url: string;
  reception_info: string;
  dress_code: string;
  dress_code_notes: string;
  special_instructions: string;
  welcome_heading: string;
  welcome_message: string;
  about_title: string;
  about_bio: string;
  about_message: string;
  about_image_url: string | null;
  hero_eyebrow: string;
  hero_description: string;
  hero_cta: string;
  hero_image_url: string | null;
  hero_image_position: string;
  /** The hero photo with its background removed, so the masthead can sit behind the head. */
  hero_cutout_url: string | null;
  hero_masthead_light: boolean;
  invitation_hosts: string;
  invitation_request: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  thank_you_heading: string;
  thank_you_message: string;
  traditions: TraditionsConfig;
  faqs: Faq[];
  updated_at: string;
}

export interface SiteControls {
  rsvp_open: boolean;
  default_max_companions: number;
  slideshow_autoplay: boolean;
  slideshow_interval_seconds: number;
  music_enabled: boolean;
  music_url: string | null;
  music_title: string;
  guestbook_open: boolean;
  guest_uploads_enabled: boolean;
  has_unpublished_changes: boolean;
  published_at: string | null;
}

export type AlbumVisibility = "public" | "guests" | "hidden";

export interface AlbumRow {
  id: string;
  name: string;
  description: string;
  visibility: AlbumVisibility;
  sort_order: number;
}

export interface PhotoRow {
  id: string;
  album_id: string;
  bucket: "public-media" | "private-media";
  storage_path: string;
  caption: string;
  width: number;
  height: number;
  blur_data_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  sort_order: number;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  caption: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  isFeatured: boolean;
  /** Signed links expire, so they cannot go through the image optimizer cache. */
  isSigned: boolean;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  description: string;
  photos: GalleryPhoto[];
}

export interface Participant {
  id: string;
  tradition: TraditionKey;
  name: string;
  relationship: string;
  message: string;
  photo_url: string | null;
  photo_path: string | null;
  is_visible: boolean;
  sort_order: number;
}

export interface ProgramItem {
  id: string;
  title: string;
  start_time: string | null;
  description: string;
  image_url: string | null;
  image_path: string | null;
  is_visible: boolean;
  sort_order: number;
}

export interface GuestWish {
  id: string;
  guest_name: string;
  message: string;
  is_featured: boolean;
  created_at: string;
}

export interface InvitationData {
  settings: EventSettings;
  controls: SiteControls;
  albums: GalleryAlbum[];
  participants: Participant[];
  program: ProgramItem[];
  wishes: GuestWish[];
}

export type RsvpStatus = "attending" | "declined";

export interface RsvpRow {
  id: string;
  guest_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: RsvpStatus;
  companions: number;
  dietary: string;
  message: string;
  submitted_at: string;
}

export interface GuestRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  invite_code: string;
  max_companions: number;
  notes: string;
  created_at: string;
}

export interface GuestWithRsvp extends GuestRow {
  rsvp: RsvpRow | null;
}

/** What the invitation knows about the person holding a personal link. */
export interface InvitedGuest {
  name: string;
  code: string;
  maxCompanions: number;
  rsvp: Pick<RsvpRow, "full_name" | "email" | "phone" | "status" | "companions" | "dietary" | "message"> | null;
}

export type MessageStatus = "pending" | "approved" | "rejected";

export interface MessageRow {
  id: string;
  guest_name: string;
  message: string;
  status: MessageStatus;
  is_featured: boolean;
  created_at: string;
}

export interface GuestUploadRow {
  id: string;
  uploader_name: string;
  storage_path: string;
  caption: string;
  width: number;
  height: number;
  blur_data_url: string | null;
  status: MessageStatus;
  created_at: string;
}

export interface AdminStats {
  invited: number;
  attending: number;
  declined: number;
  companions: number;
  photos: number;
  wishes_published: number;
  wishes_pending: number;
  uploads_pending: number;
}
