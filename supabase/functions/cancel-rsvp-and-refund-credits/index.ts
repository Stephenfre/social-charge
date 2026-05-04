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
  cancellationReason?: string | null;
  cancellationReasonNote?: string | null;
};

const normalizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
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

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: 'Unauthorized', details: userError?.message ?? 'No user found for token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = (await request.json()) as CancelRsvpRequest;
    const eventId = body.eventId?.trim();
    const shouldRefund = Boolean(body.shouldRefund);
    const cancellationReason = normalizeText(body.cancellationReason, 100) ?? 'unknown';
    const cancellationReasonNote = normalizeText(body.cancellationReasonNote, 1000);

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

    const { data: rsvp, error: rsvpError } = await supabaseAdmin
      .from('rsvps')
      .select('id,status,canceled_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (rsvpError) throw rsvpError;

    if (!rsvp) {
      return Response.json(
        { ok: false, status: 'not_found', reason: 'No RSVP row exists for this user and event.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (rsvp.status === 'canceled') {
      return Response.json(
        {
          status: 'removed',
          eventId,
          eventTitle: event.title,
          tokenCost: event.token_cost ?? 0,
          refunded: false,
          alreadyCanceled: true,
        },
        { headers: corsHeaders }
      );
    }

    const { data: spendTransactions, error: spendTransactionsError } = await supabaseAdmin
      .from('token_transactions')
      .select('id,amount,created_at')
      .eq('user_id', user.id)
      .eq('kind', 'spend')
      .eq('meta->>eventId', eventId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (spendTransactionsError) throw spendTransactionsError;

    const spendTransaction = spendTransactions?.[0] ?? null;
    const originalSpendAmount = Math.abs(spendTransaction?.amount ?? 0);
    const tokenCost = originalSpendAmount > 0 ? originalSpendAmount : (event.token_cost ?? 0);
    const idempotencyKey = `rsvp-refund:${user.id}:${eventId}:${spendTransaction?.id ?? rsvp.id}`;

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
            reference: idempotencyKey,
          }),
        }
      );

      const rcText = await rcResponse.text();

      console.log('[cancel-rsvp] RevenueCat refund response', {
        ok: rcResponse.ok,
        status: rcResponse.status,
        customerId: user.id,
        currencyCode: revenueCatVirtualCurrencyCode,
        amount: tokenCost,
        idempotencyKey,
        body: rcText,
      });

      if (!rcResponse.ok) {
        return Response.json(
          { error: 'Failed to refund RevenueCat virtual currency', details: rcText },
          { status: rcResponse.status, headers: corsHeaders }
        );
      }
    }

    const { data: canceledRsvp, error: updateRsvpError } = await supabaseAdmin
      .from('rsvps')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', rsvp.id)
      .eq('status', 'active')
      .select('id')
      .maybeSingle();

    if (updateRsvpError) throw updateRsvpError;

    if (!canceledRsvp) {
      return Response.json(
        { ok: false, status: 'not_found', reason: 'RSVP was not active when cancellation ran.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (shouldRefund && tokenCost > 0) {
      const { error: transactionError } = await supabaseAdmin.from('token_transactions').insert({
        user_id: user.id,
        kind: 'refund',
        amount: tokenCost,
        meta: {
          type: 'event_rsvp_refund',
          eventId,
          eventTitle: event.title,
          idempotencyKey,
          virtualCurrencyCode: revenueCatVirtualCurrencyCode,
        },
      });

      if (transactionError && transactionError.code !== '23505') {
        throw transactionError;
      }
    }

    const { error: cancelationError } = await supabaseAdmin.from('rsvp_cancelation').insert({
      rsvp_id: canceledRsvp.id,
      event_id: eventId,
      user_id: user.id,
      reason: cancellationReason,
      note: cancellationReasonNote,
    });

    if (cancelationError) throw cancelationError;

    return Response.json(
      {
        status: 'removed',
        eventId,
        eventTitle: event.title,
        tokenCost,
        refunded: shouldRefund && tokenCost > 0,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
