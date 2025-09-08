import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow } from '~/types/event.types';

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

export function useThisWeekend() {
  return useQuery({
    queryKey: ['events', 'thisWeekend'],
    queryFn: async () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun … 6=Sat

      // calculate upcoming Friday
      const daysUntilFriday = (5 - day + 7) % 7;
      const friday = new Date(now);
      friday.setDate(now.getDate() + daysUntilFriday);
      friday.setHours(0, 0, 0, 0);

      // calculate end of Sunday
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('starts_at', friday.toISOString())
        .lte('ends_at', sunday.toISOString())
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useTrending() {
  return useQuery({
    queryKey: ['events', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          rsvps:event_id(count)
        `
        )
        .order('rsvps.count', { ascending: false }) // sort by RSVP count
        .limit(10);

      if (error) throw error;
      return data as EventRow[];
    },
  });
}
