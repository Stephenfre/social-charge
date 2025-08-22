import React from 'react';

import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { Text as RNText } from 'react-native';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<typeof RNText> & VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(function Text(
  {
    className,
    isTruncated,
    bold,
    muted,
    underline,
    strikeThrough,
    size = 'md',
    sub,
    italic,
    highlight,
    weight,
    ...props
  },
  ref
) {
  return (
    <RNText
      className={textStyle({
        isTruncated,
        bold,
        muted,
        underline,
        strikeThrough,
        size,
        sub,
        italic,
        highlight,
        weight,
        class: className,
      })}
      {...props}
      ref={ref}
    />
  );
});

Text.displayName = 'Text';

export { Text };
