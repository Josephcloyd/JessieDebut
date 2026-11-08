-- Core tables for the debut invitation.

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Two rows: 'draft' is what the admin edits, 'published' is what guests see.
create table public.event_settings (
  state text primary key check (state in ('draft', 'published')),
  celebrant_name text not null check (char_length(celebrant_name) between 1 and 80),
  monogram text not null check (char_length(monogram) between 1 and 3),
  event_title text not null default 'The Grand Debut',
  event_at timestamptz not null,
  venue_name text not null default '',
  venue_address text not null default '',
  maps_url text not null default '',
  reception_info text not null default '',
  dress_code text not null default '',
  dress_code_notes text not null default '',
  special_instructions text not null default '',
  welcome_heading text not null default '',
  welcome_message text not null default '',
  about_title text not null default 'The Girl Behind the Celebration',
  about_bio text not null default '',
  about_message text not null default '',
  about_image_url text,
  hero_eyebrow text not null default 'An Evening to Remember',
  hero_description text not null default '',
  hero_cta text not null default 'RSVP Now',
  hero_image_url text,
  hero_image_position text not null default '50% 30%'
    check (hero_image_position ~ '^[0-9]{1,3}% [0-9]{1,3}%$'),
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  thank_you_heading text not null default '',
  thank_you_message text not null default '',
  traditions jsonb not null default '{}'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger event_settings_touch before update on public.event_settings
  for each row execute function public.touch_updated_at();

-- Live switches that take effect immediately, without a publish step.
create table public.site_controls (
  id smallint primary key default 1 check (id = 1),
  rsvp_open boolean not null default true,
  default_max_companions smallint not null default 1 check (default_max_companions between 0 and 20),
  slideshow_autoplay boolean not null default true,
  slideshow_interval_seconds smallint not null default 5 check (slideshow_interval_seconds between 2 and 30),
  music_enabled boolean not null default false,
  music_url text,
  music_title text not null default '',
  guestbook_open boolean not null default true,
  guest_uploads_enabled boolean not null default false,
  has_unpublished_changes boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger site_controls_touch before update on public.site_controls
  for each row execute function public.touch_updated_at();

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text,
  phone text,
  invite_code text not null unique check (invite_code ~ '^[A-Z2-9]{8,16}$'),
  max_companions smallint not null default 1 check (max_companions between 0 and 20),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger guests_touch before update on public.guests
  for each row execute function public.touch_updated_at();

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text,
  phone text,
  status text not null check (status in ('attending', 'declined')),
  companions smallint not null default 0 check (companions between 0 and 20),
  dietary text not null default '',
  message text not null default '',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint declined_has_no_companions check (status = 'attending' or companions = 0)
);
create index rsvps_status_idx on public.rsvps (status);
create trigger rsvps_touch before update on public.rsvps
  for each row execute function public.touch_updated_at();

create table public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'guests', 'hidden')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger gallery_albums_touch before update on public.gallery_albums
  for each row execute function public.touch_updated_at();

create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  bucket text not null default 'public-media' check (bucket in ('public-media', 'private-media')),
  storage_path text not null,
  caption text not null default '',
  width integer not null default 0 check (width >= 0),
  height integer not null default 0 check (height >= 0),
  blur_data_url text,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gallery_photos_album_idx on public.gallery_photos (album_id, sort_order);
create trigger gallery_photos_touch before update on public.gallery_photos
  for each row execute function public.touch_updated_at();

create table public.debut_participants (
  id uuid primary key default gen_random_uuid(),
  tradition text not null check (tradition in ('roses', 'candles', 'treasures', 'blue_bills', 'wishes')),
  name text not null check (char_length(name) between 1 and 120),
  relationship text not null default '',
  message text not null default '',
  photo_url text,
  photo_path text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index debut_participants_tradition_idx on public.debut_participants (tradition, sort_order);
create trigger debut_participants_touch before update on public.debut_participants
  for each row execute function public.touch_updated_at();

create table public.event_program (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  start_time time,
  description text not null default '',
  image_url text,
  image_path text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index event_program_sort_idx on public.event_program (sort_order);
create trigger event_program_touch before update on public.event_program
  for each row execute function public.touch_updated_at();

create table public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests (id) on delete set null,
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 800),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_featured boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index guest_messages_status_idx on public.guest_messages (status, created_at desc);

create table public.guest_uploads (
  id uuid primary key default gen_random_uuid(),
  uploader_name text not null check (char_length(uploader_name) between 1 and 80),
  storage_path text not null unique,
  caption text not null default '',
  width integer not null default 0,
  height integer not null default 0,
  blur_data_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index guest_uploads_status_idx on public.guest_uploads (status, created_at desc);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
create index rate_limits_window_idx on public.rate_limits (window_start);
