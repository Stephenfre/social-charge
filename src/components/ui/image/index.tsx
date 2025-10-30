'use client';
import React from 'react';
import { createImage } from '@gluestack-ui/image';
import { Platform, Image as RNImage, View } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

// className merge
const cn = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ');

const imageStyle = tva({
  base: 'max-w-full',
  variants: {
    size: {
      '2xs': 'h-6 w-6',
      xs: 'h-10 w-10',
      sm: 'h-16 w-16',
      md: 'h-20 w-20',
      lg: 'h-24 w-24',
      xl: 'h-32 w-32',
      'xl-wide': 'h-32 w-44',
      '2xl': 'h-64 w-64',
      full: 'h-full w-full',
      cover: 'h-64 w-full',
      background: 'h-96 w-full',
      none: '',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    size: 'md',
    rounded: 'lg',
  },
});

const UIImage = createImage({ Root: RNImage });

type ImageProps = VariantProps<typeof imageStyle> &
  React.ComponentProps<typeof UIImage> & {
    className?: string;
    overlay?: boolean;
  };

const Image = React.forwardRef<React.ComponentRef<typeof UIImage>, ImageProps>(function Image(
  { size, rounded, className, overlay = false, ...props },
  ref
) {
  // Apply variants to the container so overlay clips correctly
  const wrapperClasses = imageStyle({ size, rounded });

  return (
    <View className={cn('relative overflow-hidden', wrapperClasses, className)}>
      <UIImage
        ref={ref}
        {...props}
        className="h-full w-full" // keep image filling the wrapper
        // @ts-expect-error web-only style reset
        style={
          Platform.OS === 'web' ? { height: 'revert-layer', width: 'revert-layer' } : undefined
        }
      />
      {overlay && <View className="pointer-events-none absolute inset-0 bg-black/40" />}
    </View>
  );
});

Image.displayName = 'Image';
export { Image };
