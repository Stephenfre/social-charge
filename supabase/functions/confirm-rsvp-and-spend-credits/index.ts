import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY')!;
const revenueCatProjectId = Deno.env.get('REVENUECAT_PROJECT_ID')!;
const revenueCatVirtualCurrencyCode = Deno.env.get('REVENUECAT_VIRTUAL_CURRENCY_CODE')!;

type ConfirmRsvpRequest = {
  eventId?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('[confirm-rsvp] start');

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    console.log('[confirm-rsvp] auth result', {
      userId: user?.id ?? null,
      userError: userError?.message ?? null,
    });

    if (userError || !user) {
      return Response.json(
        { error: 'Unauthorized', details: userError?.message ?? 'No user found for token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = (await request.json()) as ConfirmRsvpRequest;
    const eventId = body.eventId?.trim();

    if (!eventId) {
      return Response.json({ error: 'eventId is required' }, { status: 400, headers: corsHeaders });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id,title,token_cost,capacity,deleted_at,rsvp_open,rsvp_open_at')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event || event.deleted_at) {
      return Response.json({ error: 'Event not found' }, { status: 404, headers: corsHeaders });
    }

    const tokenCost = event.token_cost ?? 0;
    const { data: existingRsvp, error: existingRsvpError } = await supabaseAdmin
      .from('rsvps')
      .select('id,status,canceled_at,held_expires_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRsvpError) throw existingRsvpError;

    if (existingRsvp?.status === 'active') {
      return Response.json(
        {
          status: 'added',
          eventId,
          eventTitle: event.title,
          tokenCost,
          alreadyConfirmed: true,
        },
        { headers: corsHeaders }
      );
    }

    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from('users')
      .select('membership,role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfileError) throw userProfileError;

    const { data: eventHost, error: eventHostError } = await supabaseAdmin
      .from('event_hosts')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (eventHostError) throw eventHostError;

    const membership = userProfile?.membership ?? 'basic';
    const role = userProfile?.role ?? 'user';
    const bypassesRsvpOpen =
      membership === 'plus' ||
      membership === 'premium' ||
      membership === 'admin' ||
      membership === 'superadmin' ||
      role === 'host' ||
      role === 'admin' ||
      role === 'super_admin' ||
      Boolean(eventHost);
    const rsvpOpenAt = event.rsvp_open_at ? new Date(event.rsvp_open_at) : null;
    const isPublicRsvpOpen =
      event.rsvp_open === true || !rsvpOpenAt || rsvpOpenAt.getTime() <= Date.now();

    if (!bypassesRsvpOpen && !isPublicRsvpOpen) {
      return Response.json(
        {
          ok: false,
          status: 'rsvp_not_open',
          rsvpOpenAt: event.rsvp_open_at,
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const hasActiveHold =
      existingRsvp?.status === 'held' &&
      existingRsvp.held_expires_at != null &&
      new Date(existingRsvp.held_expires_at).getTime() > Date.now();

    const { count: activeRsvpCount, error: activeRsvpCountError } = await supabaseAdmin
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active');

    if (activeRsvpCountError) throw activeRsvpCountError;

    const { count: heldRsvpCount, error: heldRsvpCountError } = await supabaseAdmin
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'held')
      .gt('held_expires_at', new Date().toISOString());

    if (heldRsvpCountError) throw heldRsvpCountError;

    const reservedRsvpCount = (activeRsvpCount ?? 0) + (heldRsvpCount ?? 0);

    if (event.capacity != null && reservedRsvpCount >= event.capacity && !hasActiveHold) {
      return Response.json(
        { ok: false, status: 'event_full' },
        { status: 409, headers: corsHeaders }
      );
    }

    const idempotencyKey = `rsvp:${user.id}:${eventId}:${existingRsvp?.canceled_at ?? 'initial'}`;

    // Spend RevenueCat virtual currency first if needed
    if (tokenCost > 0) {
      console.log('[confirm-rsvp] about to call RevenueCat', {
        projectId: revenueCatProjectId,
        customerId: user.id,
        currencyCode: revenueCatVirtualCurrencyCode,
        hasSecret: Boolean(revenueCatSecretKey),
        secretPrefix: revenueCatSecretKey?.slice(0, 8) ?? null,
      });
      const rcResponse = await fetch(
        `https://api.revenuecat.com/v2/projects/${revenueCatProjectId}/customers/${user.id}/virtual_currencies/transactions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${revenueCatSecretKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            adjustments: {
              [revenueCatVirtualCurrencyCode]: -tokenCost,
            },
          }),
        }
      );

      const rcText = await rcResponse.text();

      console.log('[confirm-rsvp] RevenueCat response', {
        ok: rcResponse.ok,
        status: rcResponse.status,
        body: rcText,
      });

      if (!rcResponse.ok) {
        return Response.json(
          { error: 'Failed to spend RevenueCat virtual currency', details: rcText },
          { status: rcResponse.status, headers: corsHeaders }
        );
      }
    }

    const { data: confirmResult, error: confirmError } = await supabaseAdmin.rpc(
      'confirm_rsvp_after_credit_spend',
      {
        p_event_id: eventId,
        p_user_id: user.id,
        p_token_cost: tokenCost,
        p_event_title: event.title,
        p_idempotency_key: idempotencyKey,
        p_virtual_currency_code: revenueCatVirtualCurrencyCode,
      }
    );

    if (confirmError) throw confirmError;

    if (
      confirmResult &&
      typeof confirmResult === 'object' &&
      'ok' in confirmResult &&
      confirmResult.ok === false
    ) {
      const status = 'status' in confirmResult ? confirmResult.status : 'not_confirmed';
      const responseStatus = status === 'rsvp_not_open' ? 403 : 409;
      const rsvpOpenAt = 'rsvpOpenAt' in confirmResult ? confirmResult.rsvpOpenAt : null;
      return Response.json(
        { ok: false, status, rsvpOpenAt },
        { status: responseStatus, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        status: 'added',
        eventId,
        eventTitle: event.title,
        tokenCost,
        rsvpId:
          confirmResult && typeof confirmResult === 'object' && 'rsvpId' in confirmResult
            ? confirmResult.rsvpId
            : (existingRsvp?.id ?? null),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
