import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
    });

    console.log('[confirm-rsvp] start');

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser();

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
      .select('id,title,token_cost,capacity,deleted_at')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event || event.deleted_at) {
      return Response.json({ error: 'Event not found' }, { status: 404, headers: corsHeaders });
    }

    const tokenCost = event.token_cost ?? 0;
    const idempotencyKey = `rsvp:${user.id}:${eventId}`;

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
        const errorBody = await rcResponse.text();
        return Response.json(
          { error: 'Failed to spend RevenueCat virtual currency', details: errorBody },
          { status: rcResponse.status, headers: corsHeaders }
        );
      }
    }

    // Atomic DB confirmation
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
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

    if (rpcError) throw rpcError;

    if (!rpcResult?.ok) {
      return Response.json(rpcResult, {
        status: rpcResult?.status === 'event_full' ? 409 : 400,
        headers: corsHeaders,
      });
    }

    return Response.json(
      {
        status: rpcResult.status,
        eventId,
        eventTitle: event.title,
        tokenCost,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
