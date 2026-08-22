create schema if not exists app_private;

do $$
begin
  create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'rejected');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9]{8,16}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null unique references public.users(id) on delete cascade,
  referral_code text not null,
  status public.referral_status not null default 'pending',
  qualified_at timestamptz,
  rewarded_at timestamptz,
  rejection_reason text,
  reward_amount integer not null default 10 check (reward_amount > 0),
  created_at timestamptz not null default now(),
  constraint referral_no_self_referral check (referrer_user_id <> referred_user_id)
);

create index if not exists idx_user_referrals_referrer
  on public.user_referrals(referrer_user_id, created_at desc);

alter table public.token_transactions
  add column if not exists idempotency_key text;

alter table public.token_transactions
  drop constraint if exists token_transactions_kind_check;
alter table public.token_transactions
  add constraint token_transactions_kind_check
  check (kind in ('purchase', 'spend', 'refund', 'gift', 'reward'));

create unique index if not exists ux_token_transactions_idempotency_key
  on public.token_transactions(idempotency_key)
  where idempotency_key is not null;

create or replace function app_private.generate_referral_code(p_user_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(substr(encode(extensions.digest(p_user_id::text, 'sha256'), 'hex'), 1, 10));
$$;

create or replace function app_private.create_referral_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.referral_codes (user_id, code)
  values (new.id, app_private.generate_referral_code(new.id))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_referral_code_for_user on public.users;
create trigger create_referral_code_for_user
after insert on public.users
for each row execute function app_private.create_referral_code();

insert into public.referral_codes (user_id, code)
select id, app_private.generate_referral_code(id)
from public.users
on conflict do nothing;

create or replace function app_private.resolve_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_referrer uuid;
begin
  new.referral_code := upper(trim(new.referral_code));
  select user_id into resolved_referrer
  from public.referral_codes
  where code = new.referral_code;

  if resolved_referrer is null then
    raise exception 'Invalid referral code' using errcode = '22023';
  end if;

  new.referrer_user_id := resolved_referrer;
  new.referred_user_id := auth.uid();
  new.status := 'pending';
  new.reward_amount := 10;
  return new;
end;
$$;

drop trigger if exists resolve_user_referral on public.user_referrals;
create trigger resolve_user_referral
before insert on public.user_referrals
for each row execute function app_private.resolve_referral();

create or replace function public.claim_referral(p_code text)
returns public.user_referrals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  claimed public.user_referrals;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.user_referrals (
    referrer_user_id,
    referred_user_id,
    referral_code
  )
  values (auth.uid(), auth.uid(), p_code)
  returning * into claimed;

  return claimed;
end;
$$;

alter table public.referral_codes enable row level security;
alter table public.user_referrals enable row level security;

drop policy if exists "Authenticated users can resolve referral codes" on public.referral_codes;
create policy "Users can view their own referral code"
on public.referral_codes for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their referrals" on public.user_referrals;
create policy "Users can view their referrals"
on public.user_referrals for select to authenticated
using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "Users can claim one referral" on public.user_referrals;
create policy "Users can claim one referral"
on public.user_referrals for insert to authenticated
with check (
  auth.uid() = referred_user_id
  and status = 'pending'
  and referred_user_id <> referrer_user_id
);

revoke all on public.referral_codes from anon;
revoke all on public.user_referrals from anon;
grant select on public.referral_codes to authenticated;
grant select, insert on public.user_referrals to authenticated;
grant execute on function public.claim_referral(text) to authenticated;

comment on table public.user_referrals is
  'Supabase source of truth for referral attribution and reward state.';
