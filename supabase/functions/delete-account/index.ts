import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function runCleanupStep(
  step: string,
  action: () => Promise<{ error: { message: string } | null }>
) {
  const { error } = await action();
  if (error) {
    throw new Error(`${step}: ${error.message}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return Response.json(
        { error: 'Missing authorization header' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return Response.json(
        { error: 'Unauthorized', details: userError?.message ?? 'No user found for token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const nowIso = new Date().toISOString();

    await runCleanupStep('delete check-ins', () =>
      supabaseAdmin.from('check_ins').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete event attendance', () =>
      supabaseAdmin.from('event_attendance').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete event messages', () =>
      supabaseAdmin.from('event_messages').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete event waitlist entries', () =>
      supabaseAdmin.from('event_waitlist').delete().eq('user_id', user.id)
    );
    await runCleanupStep('clear event waitlist promotions', () =>
      supabaseAdmin.from('event_waitlist').update({ promoted_by: null }).eq('promoted_by', user.id)
    );
    await runCleanupStep('delete favorites', () =>
      supabaseAdmin.from('favorited_events').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete RSVPs', () =>
      supabaseAdmin.from('rsvps').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete QR tokens created by user', () =>
      supabaseAdmin.from('qr_tokens').delete().eq('created_by', user.id)
    );
    await runCleanupStep('delete QR tokens for user', () =>
      supabaseAdmin.from('qr_tokens').delete().eq('subject_user_id', user.id)
    );
    await runCleanupStep('delete review vibes', () =>
      supabaseAdmin
        .from('review_vibes')
        .delete()
        .or(`vibe_user_id.eq.${user.id},voter_id.eq.${user.id}`)
    );
    await runCleanupStep('delete event reviews', () =>
      supabaseAdmin.from('event_reviews').delete().eq('reviewer_id', user.id)
    );
    await runCleanupStep('delete host reviews', () =>
      supabaseAdmin
        .from('host_reviews')
        .delete()
        .or(`host_id.eq.${user.id},reviewer_id.eq.${user.id}`)
    );
    await runCleanupStep('delete venue reviews', () =>
      supabaseAdmin.from('venue_reviews').delete().eq('reviewer_id', user.id)
    );
    await runCleanupStep('delete token ledger', () =>
      supabaseAdmin.from('token_ledger').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete token transactions', () =>
      supabaseAdmin.from('token_transactions').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete user day prefs', () =>
      supabaseAdmin.from('user_day_prefs').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete user event goals', () =>
      supabaseAdmin.from('user_event_goals').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete user interests', () =>
      supabaseAdmin.from('user_interests').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete onboarding profile', () =>
      supabaseAdmin.from('user_onboarding_profile').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete user time prefs', () =>
      supabaseAdmin.from('user_time_prefs').delete().eq('user_id', user.id)
    );
    await runCleanupStep('delete user vibe history', () =>
      supabaseAdmin
        .from('user_vibe_history')
        .delete()
        .or(`user_id.eq.${user.id},voter_id.eq.${user.id}`)
    );
    await runCleanupStep('remove host links', () =>
      supabaseAdmin.from('event_hosts').delete().eq('user_id', user.id)
    );
    await runCleanupStep('detach created events', () =>
      supabaseAdmin
        .from('events')
        .update({ created_by: null, deleted_at: nowIso })
        .eq('created_by', user.id)
    );
    await runCleanupStep('delete profile', () =>
      supabaseAdmin.from('users').delete().eq('id', user.id)
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id, false);

    if (deleteError) {
      return Response.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json({ status: 'deleted', userId: user.id }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
