import { useEffect, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Flex, Text } from '~/components/ui';
import { useUserCheckInQr } from '~/hooks';

type UserCheckInQrProps = {
  eventId: string;
  size?: number;
};

type QrPayload = {
  jti: string;
  eventId: string;
};

export function UserCheckInQr({ eventId, size = 220 }: UserCheckInQrProps) {
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const { fetchQrToken } = useUserCheckInQr();

  const refresh = async () => {
    try {
      const token = await fetchQrToken(eventId);
      setPayload(token);
    } catch (err) {
      console.error('Failed to refresh QR token', err);
      setPayload(null);
    }
  };

  useEffect(() => {
    setPayload(null);

    let intervalId: ReturnType<typeof setInterval>;

    const load = async () => {
      await refresh();
      intervalId = setInterval(refresh, 10_000); // rotate every 10s
    };

    load();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventId]);

  if (!payload) {
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

  return (
    <QRCode size={size} value={JSON.stringify({ jti: payload.jti, eventId: payload.eventId })} />
  );
}
