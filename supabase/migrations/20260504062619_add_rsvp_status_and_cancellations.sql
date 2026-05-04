do $$
begin
  create type public.rsvp_status as enum ('active', 'canceled');
exception
  when duplicate_object then null;
end $$;

alter table public.rsvps
  add column if not exists status public.rsvp_status not null default 'active',
  add column if not exists canceled_at timestamptz;

create table if not exists public.rsvp_cancelation (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid references public.rsvps(id) on delete set null,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint rsvp_cancelation_note_length check (note is null or char_length(note) <= 1000),
  constraint rsvp_cancelation_reason_length check (char_length(reason) <= 100)
);

create index if not exists rsvp_cancelation_event_id_idx
  on public.rsvp_cancelation(event_id);

create index if not exists rsvp_cancelation_user_id_idx
  on public.rsvp_cancelation(user_id);

create index if not exists rsvp_cancelation_rsvp_id_idx
  on public.rsvp_cancelation(rsvp_id);

alter table public.rsvp_cancelation enable row level security;

drop policy if exists "Users can view their RSVP cancelations" on public.rsvp_cancelation;
create policy "Users can view their RSVP cancelations"
  on public.rsvp_cancelation
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their RSVP cancelations" on public.rsvp_cancelation;
create policy "Users can create their RSVP cancelations"
  on public.rsvp_cancelation
  for insert
  with check (auth.uid() = user_id);
