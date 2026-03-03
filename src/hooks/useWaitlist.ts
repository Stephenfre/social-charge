import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import type { Database } from '~/types/database.types';

type EventWaitlistRow = Database['public']['Tables']['event_waitlist']['Row'];

export const WAITLIST_KEYS = {
  mine: (eventId: string, userId?: string | null) => ['waitlist', 'mine', eventId, userId] as const,
  position: (eventId: string, userId?: string | null) =>
    ['waitlist', 'position', eventId, userId] as const,
};

export function useMyWaitlistEntry(eventId: string) {
  const { userId } = useAuth();

  return useQuery<EventWaitlistRow | null>({
    queryKey: WAITLIST_KEYS.mine(eventId, userId),
    enabled: !!eventId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_waitlist')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId!)
        .eq('status', 'waiting')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useWaitlistPosition(eventId: string, enabled = true) {
  const { userId } = useAuth();

  return useQuery<number | null>({
    queryKey: WAITLIST_KEYS.position(eventId, userId),
    enabled: enabled && !!eventId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('waitlist_position', { p_event_id: eventId });
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useJoinWaitlist() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const { data, error } = await supabase.rpc('waitlist_join', { p_event_id: eventId });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: WAITLIST_KEYS.mine(eventId, userId) });
      qc.invalidateQueries({ queryKey: WAITLIST_KEYS.position(eventId, userId) });
    },
  });
}
