// api/event-messages.ts
import { supabase } from '~/lib/supabase';

export type EventMessage = {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  deleted_at: string | null;
  created_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
  };
};

export async function fetchEventMessages(
  eventId: string,
  limit = 30,
  before?: string
): Promise<EventMessage[]> {
  let q = supabase
    .from('event_messages')
    .select(
      `
      *,
      user:users!event_messages_user_id_fkey ( id, first_name, last_name, profile_picture )
    `
    )
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (before) q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EventMessage[];
}

export async function postEventMessage(eventId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1) Insert minimal fields first (avoid join errors masking insert)
  const { data: inserted, error: insertErr } = await supabase
    .from('event_messages')
    .insert([{ event_id: eventId, user_id: user.id, body }])
    .select('*')
    .single();

  if (insertErr) throw insertErr; // <-- You’ll now see FK / RLS details

  // 2) Optionally hydrate user in a separate query (won’t affect insert success)
  const { data: u, error: userErr } = await supabase
    .from('users')
    .select('id, first_name, last_name, profile_picture')
    .eq('id', inserted.user_id)
    .single();

  if (userErr) {
    // Don’t block; just return the inserted message without user
    return inserted as EventMessage;
  }

  return { ...inserted, user: u } as EventMessage;
}
