-- Privileged functions. Guest-facing ones are callable only by the server (service_role).

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Fixed-window limiter. Returns true when the call is allowed.
create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else r.window_start end,
    hits = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else r.hits + 1 end
  returning hits into current_hits;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return current_hits <= p_limit;
end;
$$;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Creates or updates a guest's single RSVP. The guest row is locked so the
-- allowance and the open/closed state are checked and applied together.
-- Returns 'ok', 'closed', 'unknown_code' or 'over_allowance'.
create or replace function public.submit_rsvp(
  p_code text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_status text,
  p_companions integer,
  p_dietary text,
  p_message text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  target public.guests%rowtype;
  is_open boolean;
  final_companions integer := case when p_status = 'attending' then p_companions else 0 end;
begin
  select rsvp_open into is_open from public.site_controls where id = 1;
  if not coalesce(is_open, false) then
    return 'closed';
  end if;

  select * into target from public.guests where invite_code = upper(p_code) for update;
  if not found then
    return 'unknown_code';
  end if;
  if final_companions > target.max_companions then
    return 'over_allowance';
  end if;

  insert into public.rsvps (guest_id, full_name, email, phone, status, companions, dietary, message)
  values (target.id, p_full_name, p_email, p_phone, p_status, final_companions, p_dietary, p_message)
  on conflict (guest_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    status = excluded.status,
    companions = excluded.companions,
    dietary = excluded.dietary,
    message = excluded.message,
    submitted_at = now();
  return 'ok';
end;
$$;
revoke all on function public.submit_rsvp(text, text, text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, text, text, integer, text, text) to service_role;

-- Copies the draft row over the published row in one statement.
create or replace function public.publish_event_settings()
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  draft jsonb;
  stamp timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select to_jsonb(s) - 'state' - 'updated_at' into draft
  from public.event_settings s where state = 'draft';
  if draft is null then
    raise exception 'No draft settings exist';
  end if;

  delete from public.event_settings where state = 'published';
  insert into public.event_settings
  select * from jsonb_populate_record(
    null::public.event_settings,
    draft || jsonb_build_object('state', 'published', 'updated_at', stamp)
  );

  update public.site_controls set has_unpublished_changes = false, published_at = stamp where id = 1;
  return stamp;
end;
$$;
revoke all on function public.publish_event_settings() from public, anon;
grant execute on function public.publish_event_settings() to authenticated, service_role;

-- Applies a drag-and-drop order. Table names come from a fixed list, never from input.
create or replace function public.reorder_items(p_table text, p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_table not in ('gallery_albums', 'gallery_photos', 'debut_participants', 'event_program') then
    raise exception 'Unsupported table';
  end if;

  execute format(
    'update public.%I t set sort_order = o.position
     from unnest($1) with ordinality as o(id, position) where t.id = o.id',
    p_table
  ) using p_ids;
end;
$$;
revoke all on function public.reorder_items(text, uuid[]) from public, anon;
grant execute on function public.reorder_items(text, uuid[]) to authenticated, service_role;

-- One round trip for the admin overview. Admin only.
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'invited', (select count(*) from public.guests),
    'attending', (select count(*) from public.rsvps where status = 'attending'),
    'declined', (select count(*) from public.rsvps where status = 'declined'),
    'companions', (select coalesce(sum(companions), 0) from public.rsvps where status = 'attending'),
    'photos', (select count(*) from public.gallery_photos),
    'wishes_published', (select count(*) from public.guest_messages where status = 'approved'),
    'wishes_pending', (select count(*) from public.guest_messages where status = 'pending'),
    'uploads_pending', (select count(*) from public.guest_uploads where status = 'pending')
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated, service_role;
