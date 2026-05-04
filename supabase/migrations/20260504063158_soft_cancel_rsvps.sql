create or replace function public.cancel_rsvp_after_credit_refund(
  p_event_id uuid,
  p_user_id uuid,
  p_token_cost integer,
  p_event_title text,
  p_should_refund boolean,
  p_idempotency_key text,
  p_virtual_currency_code text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rsvp_id uuid;
  v_refunded boolean := false;
begin
  update public.rsvps
  set
    status = 'canceled',
    canceled_at = coalesce(canceled_at, now())
  where event_id = p_event_id
    and user_id = p_user_id
    and status = 'active'
  returning id into v_rsvp_id;

  if v_rsvp_id is null then
    return json_build_object('ok', false, 'status', 'not_found');
  end if;

  if p_should_refund and p_token_cost > 0 then
    insert into public.token_transactions (user_id, kind, amount, meta)
    select
      p_user_id,
      'refund',
      p_token_cost,
      jsonb_build_object(
        'type', 'event_rsvp_refund',
        'eventId', p_event_id,
        'eventTitle', p_event_title,
        'idempotencyKey', p_idempotency_key,
        'virtualCurrencyCode', p_virtual_currency_code
      )
    where not exists (
      select 1
      from public.token_transactions
      where user_id = p_user_id
        and kind = 'refund'
        and meta->>'idempotencyKey' = p_idempotency_key
    );

    v_refunded := true;
  end if;

  return json_build_object(
    'ok', true,
    'status', 'removed',
    'rsvpId', v_rsvp_id,
    'refunded', v_refunded
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
  v_active_rsvp_count integer;
  v_rsvp_id uuid;
begin
  select capacity
  into v_capacity
  from public.events
  where id = p_event_id
    and deleted_at is null
  for update;

  if not found then
    return json_build_object('ok', false, 'status', 'event_not_found');
  end if;

  if exists (
    select 1
    from public.rsvps
    where event_id = p_event_id
      and user_id = p_user_id
      and status = 'active'
  ) then
    return json_build_object('ok', true, 'status', 'confirmed');
  end if;

  select count(*)
  into v_active_rsvp_count
  from public.rsvps
  where event_id = p_event_id
    and status = 'active';

  if v_capacity is not null and v_active_rsvp_count >= v_capacity then
    return json_build_object('ok', false, 'status', 'event_full');
  end if;

  insert into public.rsvps (event_id, user_id, status, canceled_at)
  values (p_event_id, p_user_id, 'active', null)
  on conflict (user_id, event_id)
  do update set
    status = 'active',
    canceled_at = null
  returning id into v_rsvp_id;

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
