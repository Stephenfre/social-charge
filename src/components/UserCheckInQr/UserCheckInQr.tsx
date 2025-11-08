import { useEffect, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '~/lib/supabase';

type UserCheckInQrProps = {
  eventId: string;
  size?: number;
};

export function UserCheckInQr({ eventId, size }: UserCheckInQrProps) {
  const [token, setToken] = useState<string | null>(null);

  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke('qr-mint-user-checkin', {
      body: { event_id: eventId },
    });
    if (!error && data?.token) {
      setToken(data.token);
    } else {
      setToken(null);
    }
  };

  useEffect(() => {
    setToken(null);
    void refresh();
    const intervalId = setInterval(() => {
      void refresh();
    }, 10_000);
    return () => clearInterval(intervalId);
  }, [eventId]);

  return <QRCode value={token ?? 'hi'} size={size ?? 220} />;
}
