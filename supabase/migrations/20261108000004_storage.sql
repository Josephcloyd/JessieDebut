-- Two buckets. Files in private-media are reachable only through short-lived signed links.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']),
  ('private-media', 'private-media', false, 15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy admin_manage_media on storage.objects
  for all to authenticated
  using (bucket_id in ('public-media', 'private-media') and public.is_admin())
  with check (bucket_id in ('public-media', 'private-media') and public.is_admin());
