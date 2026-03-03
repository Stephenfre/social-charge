// src/components/ui/skeleton/index.tsx
import React, { forwardRef } from 'react';
import { View } from 'react-native';
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
    ...props
  },
  ref
) {
  if (!isLoaded) {
    return (
      <View
        ref={ref}
        className={`${startColor} ${skeletonStyle({ variant, class: className })}`}
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
