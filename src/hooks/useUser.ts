import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { UsersInterests } from '~/types/user.type';

export function useUserInterests(userId: string) {
  return useQuery<UsersInterests[]>({
    queryKey: ['user'],
    enabled: !!userId,
    initialData: undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as UsersInterests[];
    },
  });
}
