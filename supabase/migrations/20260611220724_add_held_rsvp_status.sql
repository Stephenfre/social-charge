create or replace function public.waitlist_membership_priority(p_membership public.membership_role)
returns integer
language sql
stable
as $$
  select case p_membership
    when 'premium' then 1
    when 'plus' then 2
    when 'admin' then 1
    when 'superadmin' then 1
    else 3
  end;
$$;

create or replace function public.cancel_expired_rsvp_holds(p_event_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.rsvps
  set
    status = 'canceled',
    canceled_at = coalesce(canceled_at, now())
  where status = 'held'
    and held_expires_at is not null
    and held_expires_at <= now()
    and (p_event_id is null or event_id = p_event_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.waitlist_join(p_event_id uuid)
returns public.event_waitlist
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_entry public.event_waitlist;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.events where id = p_event_id and deleted_at is null
  ) then
    raise exception 'Event not found';
  end if;

  if exists (
    select 1
    from public.rsvps
    where event_id = p_event_id
      and user_id = v_user_id
      and status in ('active', 'held')
      and (status <> 'held' or held_expires_at > now())
  ) then
    raise exception 'You already have a reserved spot for this event.';
  end if;

  insert into public.event_waitlist (event_id, user_id, status, requested_at, canceled_at, promoted_at, promoted_by)
  values (p_event_id, v_user_id, 'waiting', now(), null, null, null)
  on conflict (event_id, user_id)
  do update set
    status = 'waiting',
    requested_at = case
      when public.event_waitlist.status = 'waiting' then public.event_waitlist.requested_at
      else now()
    end,
    canceled_at = null,
    promoted_at = null,
    promoted_by = null
  returning * into v_entry;

  return v_entry;
end;
$$;

create or replace function public.waitlist_cancel(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.event_waitlist
  set
    status = 'canceled',
    canceled_at = now()
  where event_id = p_event_id
    and user_id = v_user_id
    and status = 'waiting';

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.waitlist_position(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_can_view_position boolean := false;
  v_position integer;
begin
  if v_user_id is null then
    return null;
  end if;

  select
    u.role in ('host', 'admin', 'super_admin')
    or u.membership in ('plus', 'premium', 'admin', 'superadmin')
    or exists (
      select 1
      from public.event_hosts eh
      where eh.event_id = p_event_id
        and eh.user_id = v_user_id
    )
  into v_can_view_position
  from public.users u
  where u.id = v_user_id;

  if not coalesce(v_can_view_position, false) then
    return null;
  end if;

  select ranked.position
  into v_position
  from (
    select
      ew.user_id,
      (row_number() over (
        order by
          public.waitlist_membership_priority(u.membership),
          ew.requested_at,
          ew.id
      ))::integer as position
    from public.event_waitlist ew
    join public.users u on u.id = ew.user_id
    where ew.event_id = p_event_id
      and ew.status = 'waiting'
  ) ranked
  where ranked.user_id = v_user_id;

  return v_position;
end;
$$;

create or replace function public.waitlist_promote_next(p_event_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_reserved_count integer;
  v_waitlist_entry public.event_waitlist;
  v_rsvp_id uuid;
  v_hold_expires_at timestamptz := now() + interval '10 minutes';
begin
  perform public.cancel_expired_rsvp_holds(p_event_id);

  select capacity
  into v_capacity
  from public.events
  where id = p_event_id
    and deleted_at is null
  for update;

  if not found then
    return json_build_object('ok', false, 'status', 'event_not_found');
  end if;

  select count(*)
  into v_reserved_count
  from public.rsvps
  where event_id = p_event_id
    and (
      status = 'active'
      or (status = 'held' and held_expires_at > now())
    );

  if v_capacity is not null and v_reserved_count >= v_capacity then
    return json_build_object('ok', false, 'status', 'event_full');
  end if;

  select ew.*
  into v_waitlist_entry
  from public.event_waitlist ew
  join public.users u on u.id = ew.user_id
  where ew.event_id = p_event_id
    and ew.status = 'waiting'
  order by
    public.waitlist_membership_priority(u.membership),
    ew.requested_at,
    ew.id
  for update of ew skip locked
  limit 1;

  if v_waitlist_entry.id is null then
    return json_build_object('ok', false, 'status', 'no_waitlist_entries');
  end if;

  insert into public.rsvps (event_id, user_id, status, canceled_at, held_expires_at)
  values (p_event_id, v_waitlist_entry.user_id, 'held', null, v_hold_expires_at)
  on conflict (user_id, event_id)
  do update set
    status = 'held',
    canceled_at = null,
    held_expires_at = excluded.held_expires_at
  returning id into v_rsvp_id;

  update public.event_waitlist
  set
    status = 'promoted',
    promoted_at = now(),
    promoted_by = auth.uid()
  where id = v_waitlist_entry.id;

  return json_build_object(
    'ok', true,
    'status', 'held',
    'eventId', p_event_id,
    'userId', v_waitlist_entry.user_id,
    'waitlistId', v_waitlist_entry.id,
    'rsvpId', v_rsvp_id,
    'heldExpiresAt', v_hold_expires_at
  );
end;
$$;

create or replace function public.confirm_rsvp_after_credit_spend(
  p_event_id uuid,
  p_user_id uuid,
  p_token_cost integer,
  p_event_title text,
  p_idempotency_key text,
  p_virtual_currency_code text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_rsvp_open boolean;
  v_rsvp_open_at timestamptz;
  v_reserved_count integer;
  v_existing_status public.rsvp_status;
  v_existing_hold_expires_at timestamptz;
  v_rsvp_id uuid;
  v_user_membership public.membership_role;
  v_user_role public.user_role;
  v_is_event_host boolean := false;
  v_bypasses_rsvp_open boolean := false;
  v_public_rsvp_open boolean := false;
begin
  perform public.cancel_expired_rsvp_holds(p_event_id);

  select capacity, rsvp_open, rsvp_open_at
  into v_capacity, v_rsvp_open, v_rsvp_open_at
  from public.events
  where id = p_event_id
    and deleted_at is null
  for update;

  if not found then
    return json_build_object('ok', false, 'status', 'event_not_found');
  end if;

  select status, held_expires_at
  into v_existing_status, v_existing_hold_expires_at
  from public.rsvps
  where event_id = p_event_id
    and user_id = p_user_id
  for update;

  if v_existing_status = 'active' then
    return json_build_object('ok', true, 'status', 'confirmed');
  end if;

  select membership, role
  into v_user_membership, v_user_role
  from public.users
  where id = p_user_id;

  select exists (
    select 1
    from public.event_hosts
    where event_id = p_event_id
      and user_id = p_user_id
  )
  into v_is_event_host;

  v_bypasses_rsvp_open :=
    v_user_membership in ('plus', 'premium', 'admin', 'superadmin')
    or v_user_role in ('host', 'admin', 'super_admin')
    or v_is_event_host;

  v_public_rsvp_open := coalesce(v_rsvp_open, false)
    or v_rsvp_open_at is null
    or v_rsvp_open_at <= now();

  if not v_bypasses_rsvp_open and not v_public_rsvp_open then
    return json_build_object(
      'ok', false,
      'status', 'rsvp_not_open',
      'rsvpOpenAt', v_rsvp_open_at
    );
  end if;

  select count(*)
  into v_reserved_count
  from public.rsvps
  where event_id = p_event_id
    and user_id is distinct from p_user_id
    and (
      status = 'active'
      or (status = 'held' and held_expires_at > now())
    );

  if v_capacity is not null
    and v_reserved_count >= v_capacity
    and not (v_existing_status = 'held' and v_existing_hold_expires_at > now())
  then
    return json_build_object('ok', false, 'status', 'event_full');
  end if;

  insert into public.rsvps (event_id, user_id, status, canceled_at, held_expires_at)
  values (p_event_id, p_user_id, 'active', null, null)
  on conflict (user_id, event_id)
  do update set
    status = 'active',
    canceled_at = null,
    held_expires_at = null
  returning id into v_rsvp_id;

  update public.event_waitlist
  set
    status = 'converted',
    promoted_at = coalesce(promoted_at, now())
  where event_id = p_event_id
    and user_id = p_user_id
    and status in ('waiting', 'promoted');

  if p_token_cost > 0 then
    insert into public.token_transactions (user_id, kind, amount, meta)
    select
      p_user_id,
      'spend',
      p_token_cost,
      jsonb_build_object(
        'type', 'event_rsvp',
        'eventId', p_event_id,
        'eventTitle', p_event_title,
        'idempotencyKey', p_idempotency_key,
        'virtualCurrencyCode', p_virtual_currency_code
      )
    where not exists (
      select 1
      from public.token_transactions
      where user_id = p_user_id
        and kind = 'spend'
        and meta->>'idempotencyKey' = p_idempotency_key
    );
  end if;

  return json_build_object(
    'ok', true,
    'status', 'confirmed',
    'rsvpId', v_rsvp_id
  );
end;
$$;
