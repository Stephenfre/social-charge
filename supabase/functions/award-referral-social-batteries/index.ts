import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY')!;
const revenueCatProjectId = Deno.env.get('REVENUECAT_PROJECT_ID')!;
const currencyCode = Deno.env.get('REVENUECAT_VIRTUAL_CURRENCY_CODE') ?? 'SCB';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { referredUserId } = (await request.json()) as { referredUserId?: string };
    if (!referredUserId) {
      return Response.json(
        { error: 'referredUserId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: checkIn, error: checkInError } = await admin
      .from('check_ins')
      .select('event_id')
      .eq('user_id', referredUserId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (checkInError) throw checkInError;
    if (!checkIn) {
      return Response.json({ status: 'not_qualified' }, { headers: corsHeaders });
    }

    if (user.id !== referredUserId) {
      const { data: hostedEvent, error: hostedEventError } = await admin
        .from('events')
        .select('id')
        .eq('id', checkIn.event_id)
        .eq('created_by', user.id)
        .maybeSingle();
      if (hostedEventError) throw hostedEventError;
      if (!hostedEvent) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }
    }

    const { data: referral, error: referralError } = await admin
      .from('user_referrals')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .in('status', ['pending', 'qualified'])
      .maybeSingle();
    if (referralError) throw referralError;
    if (!referral) {
      return Response.json({ status: 'no_pending_referral' }, { headers: corsHeaders });
    }

    const qualifiedAt = referral.qualified_at ?? new Date().toISOString();
    if (referral.status === 'pending') {
      const { error } = await admin
        .from('user_referrals')
        .update({ status: 'qualified', qualified_at: qualifiedAt })
        .eq('id', referral.id)
        .eq('status', 'pending');
      if (error) throw error;
    }

    const idempotencyKey = `referral-reward:${referral.id}`;
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v2/projects/${revenueCatProjectId}/customers/${referral.referrer_user_id}/virtual_currencies/transactions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${revenueCatSecretKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          adjustments: { [currencyCode]: referral.reward_amount },
          reference: idempotencyKey,
        }),
      }
    );
    const rcBody = await rcResponse.text();
    if (!rcResponse.ok) {
      return Response.json(
        { error: 'RevenueCat reward failed', details: rcBody },
        { status: 502, headers: corsHeaders }
      );
    }

    const rewardedAt = new Date().toISOString();
    const { error: transactionError } = await admin.from('token_transactions').upsert(
      {
        user_id: referral.referrer_user_id,
        kind: 'reward',
        amount: referral.reward_amount,
        idempotency_key: idempotencyKey,
        meta: {
          type: 'referral_reward',
          referralId: referral.id,
          referredUserId,
          idempotencyKey,
          source: 'referral_program',
        },
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true }
    );
    if (transactionError) throw transactionError;

    const { error: updateError } = await admin
      .from('user_referrals')
      .update({ status: 'rewarded', rewarded_at: rewardedAt })
      .eq('id', referral.id)
      .neq('status', 'rewarded');
    if (updateError) throw updateError;

    return Response.json(
      { status: 'rewarded', referralId: referral.id, idempotencyKey },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
