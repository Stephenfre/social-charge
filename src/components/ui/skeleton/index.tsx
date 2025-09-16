// src/components/ui/skeleton/index.tsx
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { skeletonStyle, skeletonTextStyle } from './styles';

type ISkeletonProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonStyle> & {
    isLoaded?: boolean;
    startColor?: string; // tailwind class (e.g., 'bg-background-200')
    speed?: number; // higher = faster
  };

type ISkeletonTextProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonTextStyle> & {
    _lines?: number;
    isLoaded?: boolean;
    startColor?: string;
    gap?: number;
  };

const Skeleton = forwardRef<View, ISkeletonProps>(function Skeleton(
  {
    className,
    variant,
    children,
    startColor = 'bg-background-200',
    isLoaded = false,
    speed = 2,
    ...props
  },
  ref
) {
  const opacity = useSharedValue(1);

  // run once on mount
  React.useEffect(() => {
    if (!isLoaded) {
      const dur = Math.max(150, 1000 / (speed || 1));
      opacity.value = withRepeat(
        withSequence(withTiming(0.75, { duration: dur }), withTiming(1, { duration: dur })),
        -1, // infinite
        false
      );
    } else {
      opacity.value = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, speed]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!isLoaded) {
    return (
      <Animated.View
        ref={ref}
        // nativewind will map className to style; reanimated reads the style fine
        className={`${startColor} ${skeletonStyle({ variant, class: className })}`}
        style={animatedStyle}
        {...props}
      />
    );
  }

  return <>{children}</>;
});

const SkeletonText = forwardRef<View, ISkeletonTextProps>(function SkeletonText(
  {
    className,
    _lines,
    isLoaded = false,
    startColor = 'bg-background-200',
    gap = 2,
    children,
    ...props
  },
  ref
) {
  if (!isLoaded) {
    if (_lines && _lines > 0) {
      return (
        <View className={skeletonTextStyle({ gap })} ref={ref}>
          {Array.from({ length: _lines }).map((_, idx) => (
            <Skeleton
              key={idx}
              className={`${startColor} ${skeletonTextStyle({ class: className })}`}
              {...props}
            />
          ))}
        </View>
      );
    }
    return (
      <Skeleton
        className={`${startColor} ${skeletonTextStyle({ class: className })}`}
        {...props}
        ref={ref}
      />
    );
  }
  return <>{children}</>;
});

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText };
