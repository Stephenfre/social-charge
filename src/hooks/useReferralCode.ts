import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';

type ReferralCodeRow = {
  code: string;
};

export function useReferralCode() {
  const { userId } = useAuth();

  return useQuery<string | null, Error>({
    queryKey: ['referral-code', userId],
    enabled: !!userId,
    queryFn: async () => {
      const queryReferralCode = supabase.from as unknown as (relation: 'referral_codes') => {
        select: (columns: 'code') => {
          eq: (
            column: 'user_id',
            value: string
          ) => {
            maybeSingle: () => Promise<{
              data: ReferralCodeRow | null;
              error: Error | null;
            }>;
          };
        };
      };
      const { data, error } = await queryReferralCode('referral_codes')
        .select('code')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data?.code ?? null;
    },
  });
}
