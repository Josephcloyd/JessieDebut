-- Row Level Security. Anyone not matched by a policy gets nothing.

alter table public.admin_users enable row level security;
alter table public.event_settings enable row level security;
alter table public.site_controls enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.debut_participants enable row level security;
alter table public.event_program enable row level security;
alter table public.guest_messages enable row level security;
alter table public.guest_uploads enable row level security;
alter table public.rate_limits enable row level security;
-- rate_limits has no policies on purpose: only service_role reaches it.

create policy admin_read_self on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create policy public_read_published on public.event_settings
  for select to anon, authenticated using (state = 'published');
create policy admin_all_settings on public.event_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_controls on public.site_controls
  for select to anon, authenticated using (true);
create policy admin_write_controls on public.site_controls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_guests on public.guests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all_rsvps on public.rsvps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all_uploads on public.guest_uploads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_albums on public.gallery_albums
  for select to anon, authenticated using (visibility = 'public');
create policy admin_all_albums on public.gallery_albums
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_photos on public.gallery_photos
  for select to anon, authenticated using (
    is_visible and exists (
      select 1 from public.gallery_albums a
      where a.id = album_id and a.visibility = 'public'
    )
  );
create policy admin_all_photos on public.gallery_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_participants on public.debut_participants
  for select to anon, authenticated using (is_visible);
create policy admin_all_participants on public.debut_participants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_program on public.event_program
  for select to anon, authenticated using (is_visible);
create policy admin_all_program on public.event_program
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_messages on public.guest_messages
  for select to anon, authenticated using (status = 'approved');
create policy admin_all_messages on public.guest_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Guests may see an approved wish, but never which guest record it came from.
revoke select on public.guest_messages from anon;
grant select (id, guest_name, message, is_featured, created_at) on public.guest_messages to anon;

-- Guests never write directly; every guest write goes through server actions.
revoke insert, update, delete on all tables in schema public from anon;
revoke all on public.guests, public.rsvps, public.guest_uploads, public.rate_limits, public.admin_users from anon;
