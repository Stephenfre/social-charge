import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { Tables } from '~/types/database.types';

type UserEventGoal = Pick<Tables<'user_event_goals'>, 'goal'>;

type UseUserEventGoalsArgs = {
  userId?: string | null;
  enabled?: boolean;
};

export function useUserEventGoals({ userId, enabled = true }: UseUserEventGoalsArgs) {
  return useQuery<UserEventGoal[]>({
    queryKey: ['user-event-goals', userId],
    enabled: Boolean(userId) && Boolean(enabled),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_event_goals')
        .select('goal')
        .eq('user_id', userId as string);

      if (error) throw error;
      return data ?? [];
    },
  });
}
