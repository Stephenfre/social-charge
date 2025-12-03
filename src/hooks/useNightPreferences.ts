import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { Enums, Tables } from '~/types/database.types';

type OnboardingProfile = Pick<
  Tables<'user_onboarding_profile'>,
  'primary_archetype' | 'preferred_group_size_min' | 'preferred_group_size_max'
>;

type NightPreferencesResult = {
  profile: OnboardingProfile | null;
  times: Enums<'time_bucket'>[];
  days: Enums<'days_available'>[];
};

type UseNightPreferencesArgs = {
  userId?: string | null;
  enabled?: boolean;
};

export function useNightPreferences({ userId, enabled = true }: UseNightPreferencesArgs) {
  return useQuery<NightPreferencesResult>({
    queryKey: ['night-preferences', userId],
    enabled: Boolean(userId) && Boolean(enabled),
    queryFn: async () => {
      if (!userId) {
        return {
          profile: null,
          times: [],
          days: [],
        };
      }

      const [profileResult, timeResult, dayResult] = await Promise.all([
        supabase
          .from('user_onboarding_profile')
          .select('primary_archetype, preferred_group_size_min, preferred_group_size_max')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.from('user_time_prefs').select('time_pref').eq('user_id', userId),
        supabase.from('user_day_prefs').select('available_days').eq('user_id', userId),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (timeResult.error) throw timeResult.error;
      if (dayResult.error) throw dayResult.error;

      const times = (timeResult.data ?? [])
        .map((row) => row.time_pref)
        .filter((pref): pref is Enums<'time_bucket'> => Boolean(pref));
      const days = (dayResult.data ?? [])
        .map((row) => row.available_days)
        .filter((pref): pref is Enums<'days_available'> => Boolean(pref));

      return {
        profile: profileResult.data,
        times,
        days,
      };
    },
  });
}
