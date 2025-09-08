import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow } from '~/types/event.types';

export function useEventById(id: string) {
  return useQuery<EventRow>({
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
      return data as EventRow;
    },
  });
}
