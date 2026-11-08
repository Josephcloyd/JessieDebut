-- Fields for the magazine cover and the formal printed invitation.

alter table public.event_settings
  add column hero_cutout_url text,
  add column hero_masthead_light boolean not null default true,
  add column invitation_hosts text not null default '',
  add column invitation_request text not null default
    'request the honour of your presence at the eighteenth birthday celebration of their daughter';
