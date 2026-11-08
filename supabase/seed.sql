-- Starting content only. Everything here can be edited or removed in /admin.

insert into public.event_settings (
  state, celebrant_name, monogram, event_title, event_at,
  venue_name, venue_address, maps_url, reception_info,
  dress_code, dress_code_notes, special_instructions,
  welcome_heading, welcome_message,
  about_bio, about_message,
  hero_description, hero_image_url, hero_image_position, invitation_hosts, contact_name,
  thank_you_heading, thank_you_message,
  traditions, faqs
)
select
  s.state, 'Jessiemae', 'J', 'The Grand Debut', '2027-03-20 18:00:00+08',
  'Add your venue name', 'Add the complete venue address',
  'https://maps.google.com', 'Dinner and dancing follow the program in the main hall.',
  'Formal in Neutrals', 'Think ivory, champagne, beige and soft gold. Please avoid bright colors.',
  'Please arrive thirty minutes before the program begins.',
  'With Grateful Hearts',
  'You are warmly invited to celebrate an evening of family, friendship and new beginnings.',
  'Add a short introduction here from the admin dashboard.',
  'Add a heartfelt message here from the admin dashboard.',
  'Celebrating eighteen beautiful years and the beginning of a new chapter.',
  '/images/jessiemae-hero.webp', '50% 15%',
  'Add the names of the hosts',
  'The Organizer',
  'Thank You',
  'Your presence is the most treasured gift of all.',
  '{
    "roses": {"enabled": true, "title": "18 Roses", "intro": "Eighteen gentlemen who have shaped her story, each offering a rose and a dance."},
    "candles": {"enabled": true, "title": "18 Candles", "intro": "Eighteen dear women, each lighting a candle with a wish."},
    "treasures": {"enabled": true, "title": "18 Treasures", "intro": "Eighteen keepsakes given with love."},
    "blue_bills": {"enabled": false, "title": "18 Blue Bills", "intro": "Eighteen blessings for the road ahead."},
    "wishes": {"enabled": true, "title": "18 Wishes", "intro": "Eighteen heartfelt messages to carry into a new chapter."}
  }'::jsonb,
  '[
    {"question": "May I bring a guest?", "answer": "Your personal invitation shows how many companions are reserved for you."},
    {"question": "How do I change my RSVP?", "answer": "Open your personal invitation link again and resubmit the form while RSVPs are open."}
  ]'::jsonb
from (values ('draft'), ('published')) as s(state)
on conflict (state) do nothing;

insert into public.site_controls (id) values (1) on conflict (id) do nothing;

insert into public.gallery_albums (name, sort_order)
select v.name, v.position
from (values
  ('The Debutant', 1), ('Pre-Debut Photoshoot', 2), ('Childhood Memories', 3),
  ('Special Moments', 4), ('Behind the Scenes', 5)
) as v(name, position)
where not exists (select 1 from public.gallery_albums);

insert into public.event_program (title, start_time, description, sort_order)
select v.title, v.start_time::time, v.description, v.position
from (values
  ('Guest Arrival', '17:30', 'Welcome drinks and photographs.', 1),
  ('Registration', '17:45', 'Please sign the guest book.', 2),
  ('Opening Remarks', '18:00', 'A word of welcome from the family.', 3),
  ('Grand Entrance', '18:15', 'The debutant makes her entrance.', 4),
  ('18 Roses', '18:30', 'A dance with each of the eighteen gentlemen.', 5),
  ('Dinner', '19:15', 'Dinner is served.', 6),
  ('18 Candles', '20:00', 'Eighteen wishes, eighteen flames.', 7),
  ('Special Performances', '20:30', 'Songs and tributes from loved ones.', 8),
  ('18 Treasures', '20:50', 'Keepsakes given with love.', 9),
  ('Birthday Celebration', '21:15', 'The cake, the toast and the song.', 10),
  ('Closing Remarks', '21:45', 'A note of thanks.', 11)
) as v(title, start_time, description, position)
where not exists (select 1 from public.event_program);
