// Countdown.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../ui';

type Props = {
  to: string | Date; // ISO string or Date for starts_at
  onComplete?: () => void; // fires when countdown hits 0
  intervalMs?: number; // default 1000ms
  hideDaysIfZero?: boolean; // optional UX tweak
};

function msLeft(target: string | Date) {
  const t = typeof target === 'string' ? new Date(target).getTime() : target.getTime();
  return Math.max(0, t - Date.now());
}

function split(ms: number) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export const Countdown: React.FC<Props> = ({
  to,
  onComplete,
  intervalMs = 1000,
  hideDaysIfZero = true,
}) => {
  const [remaining, setRemaining] = useState(() => msLeft(to));

  useEffect(() => {
    setRemaining(msLeft(to)); // reset when target changes
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = msLeft(to);
        if (next === 0 && prev !== 0) onComplete?.();
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [to, intervalMs, onComplete]);

  const { days, hours, minutes, seconds } = useMemo(() => split(remaining), [remaining]);

  if (remaining === 0) {
    return;
  }

  return (
    <View className="flex-row items-center">
      {!hideDaysIfZero || days > 0 ? <Text className="mr-1 text-white">{days}d</Text> : null}
      <Text size="sm" weight="600">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </Text>
    </View>
  );
};
