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

    return supabase.functions.invoke('consume-user-qr', {
      headers: { Authorization: `Bearer ${hostAccessToken}` },
      body: { jti, eventId },
    });
  }, []);

  return { processScan };
}
