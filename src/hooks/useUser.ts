import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { UsersInterests, UsersRow } from '~/types/user.type';

export function useHosts() {
  return useQuery<UsersRow[]>({
    queryKey: ['user', 'host'],
    initialData: [],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'host');
      if (error) throw error;
      return data as UsersRow[];
    },
  });
}

export function useUserInterests(userId: string | null) {
  return useQuery<UsersInterests[]>({
    queryKey: ['user'],
    enabled: !!userId,
    initialData: undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as UsersInterests[];
    },
  });
}

export function useNewUsers() {
  return useQuery<UsersRow[]>({
    queryKey: ['user', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UsersRow[];
    },
  });
}
