import { useCallback } from 'react';
import { supabase } from '~/lib/supabase';

type QrResponse = { jti: string; eventId: string; expiresAt: string };

export function useUserCheckInQr() {
  const fetchQrToken = useCallback(async (eventId: string) => {
    if (!eventId) {
      throw new Error('Missing event identifier');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const { data, error } = await supabase.functions.invoke<QrResponse>('qr-mint', {
      body: { eventId },
      headers,
    });

    if (error) {
      let detail: string | undefined;
      try {
        detail = await error.context?.response?.text();
      } catch (ctxErr) {
        console.error('Failed to read edge error response', ctxErr);
      }
      console.error('Edge function error', error.message, detail);
      throw new Error(detail ?? error.message ?? 'Unable to generate QR code');
    }

    if (!data?.jti) throw new Error('QR response missing jti');

    return data;
  }, []);

  return { fetchQrToken };
}
