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

type CancelRsvpRequest = {
  eventId?: string;
  shouldRefund?: boolean;
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

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: 'Unauthorized', details: userError?.message ?? 'No user found for token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = (await request.json()) as CancelRsvpRequest;
    const eventId = body.eventId?.trim();
    const shouldRefund = Boolean(body.shouldRefund);

    if (!eventId) {
      return Response.json({ error: 'eventId is required' }, { status: 400, headers: corsHeaders });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id,title,token_cost,deleted_at')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event || event.deleted_at) {
      return Response.json({ error: 'Event not found' }, { status: 404, headers: corsHeaders });
    }

    const tokenCost = event.token_cost ?? 0;
    const idempotencyKey = `rsvp-refund:${user.id}:${eventId}`;

    // Refund RevenueCat first if needed
    if (shouldRefund && tokenCost > 0) {
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
              [revenueCatVirtualCurrencyCode]: tokenCost,
            },
          }),
        }
      );

      if (!rcResponse.ok) {
        const errorBody = await rcResponse.text();
        return Response.json(
          { error: 'Failed to refund RevenueCat virtual currency', details: errorBody },
          { status: rcResponse.status, headers: corsHeaders }
        );
      }
    }

    // Atomic DB cancellation
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'cancel_rsvp_after_credit_refund',
      {
        p_event_id: eventId,
        p_user_id: user.id,
        p_token_cost: tokenCost,
        p_event_title: event.title,
        p_should_refund: shouldRefund,
        p_idempotency_key: idempotencyKey,
        p_virtual_currency_code: revenueCatVirtualCurrencyCode,
      }
    );

    if (rpcError) throw rpcError;

    if (!rpcResult?.ok) {
      return Response.json(rpcResult, {
        status: rpcResult?.status === 'not_found' ? 404 : 400,
        headers: corsHeaders,
      });
    }

    return Response.json(
      {
        status: rpcResult.status,
        eventId,
        eventTitle: event.title,
        tokenCost,
        refunded: rpcResult.refunded,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
