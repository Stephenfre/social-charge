import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow } from '~/types/event.types';

// hooks/sections.ts
export function useForYou(userId: string | null) {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'justForYou', userId],
    enabled: !!userId,
    initialData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_events_for_current_user')
        .select('*')
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useUpcoming() {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gt('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useLowToken() {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'cheap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('token_cost', 1)
        .order('starts_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}
