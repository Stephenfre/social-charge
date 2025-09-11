import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow, EventWithJoins, UserEventCardRow } from '~/types/event.types';

export function useUserEvents(limit?: number) {
  return useQuery<UserEventCardRow[]>({
    queryKey: ['events', 'userEvents', { limit }],
    queryFn: async () => {
      let q = supabase
        .from('v_user_events')
        .select('id, title, cover_img, event_status, starts_at, created_at')
        .order('event_status', { ascending: false })
        .order('starts_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data as UserEventCardRow[]) ?? [];
    },
  });
}

type CheckInUser = {
  user_id: string;
  user: { id: string; first_name: string; last_name: string; profile_picture: string | null };
};

type CheckInResult = {
  event: EventRow; // your generated type from Supabase
  hosts: CheckInUser[] | null;
  attendees: CheckInUser[] | null;
};

export function useCheckInEvent() {
  return useQuery<CheckInResult | null>({
    queryKey: ['events', 'checkInEvent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('f_user_event_today_or_next')
        .maybeSingle<CheckInResult>(); // 👈 add the generic

      if (error) throw error;
      return data; // null if none
    },
  });
}

export function useEventById(id: string) {
  return useQuery<EventWithJoins>({
    queryKey: ['events', 'eventById', id],
    enabled: !!id,
    initialData: undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          event_hosts:event_hosts!event_hosts_event_id_fkey (
            user:users!event_hosts_user_id_fkey ( id, first_name, last_name, profile_picture )
          ),
          rsvps:rsvps!rsvps_event_id_fkey (
            user:users!rsvps_user_id_fkey ( id, first_name, last_name, profile_picture )
          )
        `
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as EventWithJoins;
    },
  });
}

export function useForYouEvents(userId: string | null) {
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

export function useUpcomingEvents() {
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

export function useLowTokenEvents() {
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

export function useThisWeekendEvents() {
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

export function useTrendingEvents() {
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
