import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Text } from '~/components/ui';

type PremiumBlurGateProps = {
  children: ReactNode;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  buttonLabel?: string;
  minHeight?: number;
};

export function PremiumBlurGate({
  children,
  onPress,
  disabled = false,
  buttonLabel = 'Go Premium',
  minHeight = 180,
}: PremiumBlurGateProps) {
  return (
    <View className="relative overflow-hidden rounded-3xl" style={{ minHeight }}>
      {children}
      <BlurView
        intensity={36}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        className="absolute inset-0">
        <View className="flex-1 items-center justify-center bg-[#0F1012]/20 p-5">
          <Button
            className="w-full rounded-xl bg-primary-500"
            disabled={disabled}
            onPress={onPress}>
            <Text bold>{disabled ? 'Loading...' : buttonLabel}</Text>
          </Button>
        </View>
      </BlurView>
    </View>
  );
}
