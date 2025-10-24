import { useQuery } from '@tanstack/react-query';
import { useAuth } from '~/providers/AuthProvider';
import { EVENT_KEYS } from './useEvents';
import { supabase } from '~/lib/supabase';
import { TokenTransactions } from '~/types/event.types';

export function useMyTokenBalance() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: EVENT_KEYS.userTokenBalance(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_user_token_balance')
        .select('balance')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
    staleTime: 15_000,
  });
}

export function useTokenTransactionsByUserId() {
  const { userId } = useAuth();

  return useQuery<TokenTransactions[]>({
    queryKey: EVENT_KEYS.userTokenTransaction(userId),
    enabled: !!userId, // don't run until we have a user
    queryFn: async () => {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*') // <- required before filters
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TokenTransactions[];
    },
  });
}
