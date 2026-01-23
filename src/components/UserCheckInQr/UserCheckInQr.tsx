import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Flex, Text } from '~/components/ui';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';

type UserCheckInQrProps = {
  eventId: string;
  size?: number;
};

export function UserCheckInQr({ eventId, size = 220 }: UserCheckInQrProps) {
  const [token, setToken] = useState<string | null>(null);
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const refresh = useCallback(async () => {
    try {
      if (!accessToken || !eventId) {
        setToken(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('qr-mint', {
        body: { eventId },
          headers: { Authorization: `Bearer ${accessToken}` },
      });


      if (error) {
        console.log('invoke error:', error.message);

        // ✅ Print the actual edge function error body (text/plain)
        const res = (error as any).context as Response | undefined;
        if (res) {
          const txt = await res.text();
          console.log('edge body:', txt);
        }
      }

      setToken(data?.token ?? null);
    } catch (err) {
      setToken(null);
    }
  }, [eventId, accessToken]);

  // console.log(token)

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, 10_000); // rotate every 10s
    return () => clearInterval(intervalId);
  }, [refresh]);

  if (!token) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ height: size, width: size }}
        className="rounded-2xl border border-dashed border-background-500">
        <Text size="sm" className="text-background-200">
          Generating QR…
        </Text>
      </Flex>
    );
  }

  return <QRCode size={size} value={token} />;
}
