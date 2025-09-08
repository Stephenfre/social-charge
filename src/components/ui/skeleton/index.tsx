import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { Animated, Easing, Platform, View } from 'react-native';
import { skeletonStyle, skeletonTextStyle } from './styles';

type ISkeletonProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonStyle> & {
    isLoaded?: boolean;
    startColor?: string;
    speed?: number;
  };

type ISkeletonTextProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonTextStyle> & {
    _lines?: number;
    isLoaded?: boolean;
    startColor?: string;
    gap?: number;
  };

const Skeleton = forwardRef<React.ComponentRef<typeof Animated.View>, ISkeletonProps>(
  function Skeleton(
    {
      className,
      variant,
      children,
      startColor = 'bg-gray-300',
      isLoaded = false,
      speed = 2,
      ...props
    },
    ref
  ) {
    // Keep the animated value stable across renders
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const customTimingFunction = useMemo(() => Easing.bezier(0.4, 0, 0.6, 1), []);
    const fadeDuration = 0.6;
    const animationDuration = useMemo(
      () => (fadeDuration * 10000) / speed, // ms
      [speed]
    );

    // Prepare the animation (memoized)
    const pulse = useMemo(
      () =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: animationDuration / 2,
              easing: customTimingFunction,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.75,
              duration: animationDuration / 2,
              easing: customTimingFunction,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: animationDuration / 2,
              easing: customTimingFunction,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ])
        ),
      [pulseAnim, animationDuration, customTimingFunction]
    );

    // Start/stop in effects (not during render)
    useEffect(() => {
      if (!isLoaded) {
        pulse.start();
      } else {
        pulse.stop();
        // reset to fully visible when loaded
        pulseAnim.setValue(1);
      }
      return () => {
        pulse.stop();
      };
    }, [isLoaded, pulse, pulseAnim]);

    if (!isLoaded) {
      return (
        <Animated.View
          style={{ opacity: pulseAnim }}
          className={`${startColor} ${skeletonStyle({ variant, class: className })}`}
          {...props}
          ref={ref}
        />
      );
    }

    // when loaded, just render children
    return <>{children}</>;
  }
);

const SkeletonText = forwardRef<React.ComponentRef<typeof View>, ISkeletonTextProps>(
  function SkeletonText(
    {
      className,
      _lines,
      isLoaded = false,
      startColor = 'bg-gray-300',
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
            {Array.from({ length: _lines }).map((_, index) => (
              <Skeleton
                key={index}
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
          ref={ref as any}
        />
      );
    }

    return <>{children}</>;
  }
);

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText };
