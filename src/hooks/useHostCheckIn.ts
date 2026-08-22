import { useCallback } from 'react';
import { supabase } from '~/lib/supabase';

type ProcessScanArgs = {
  jti: string;
  eventId: string;
};

export function useHostCheckIn() {
  const processScan = useCallback(async ({ jti, eventId }: ProcessScanArgs) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const hostAccessToken = session?.access_token;
    if (!hostAccessToken) {
      throw new Error('You must be signed in to scan.');
    }

    const result = await supabase.functions.invoke('qr-consume', {
      headers: { Authorization: `Bearer ${hostAccessToken}` },
      body: { jti, eventId },
    });
    const referredUserId = result.data?.checkedInUserId ?? result.data?.user_id;
    if (!result.error && referredUserId) {
      const { error } = await supabase.functions.invoke('award-referral-social-batteries', {
        headers: { Authorization: `Bearer ${hostAccessToken}` },
        body: { referredUserId },
      });
      if (error) console.warn('Referral reward qualification failed:', error);
    }
    return result;
  }, []);

  return { processScan };
}
