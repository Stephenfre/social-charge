alter type public.rsvp_status add value if not exists 'held';

alter table public.rsvps
  add column if not exists held_expires_at timestamptz;

alter table public.events
  add column if not exists rsvp_open boolean not null default false,
  add column if not exists rsvp_open_at timestamptz;

create index if not exists rsvps_event_status_hold_idx
  on public.rsvps (event_id, status, held_expires_at);

create index if not exists events_rsvp_open_at_idx
  on public.events (rsvp_open_at)
  where rsvp_open_at is not null;
