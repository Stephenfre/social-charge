import React from 'react';
import { View, ViewProps } from 'react-native';

import type { VariantProps } from '@gluestack-ui/nativewind-utils';

import { flexStyle } from './styles';

type IFlexProps = ViewProps &
  VariantProps<typeof flexStyle> & {
    className?: string;
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    wrap?: 'wrap' | 'nowrap';
    flex?: number | boolean;
    justify?:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly';
    align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  };

const Flex = React.forwardRef<React.ComponentRef<typeof View>, IFlexProps>(function Flex(
  { className, direction, flex, wrap, justify, align, gap, ...props },
  ref
) {
  const flexStyleValue = React.useMemo(() => {
    if (flex === undefined) return undefined;
    if (typeof flex === 'number') return { flex };
    if (flex === true) return { flex: 1 };
    if (flex === false) return { flex: 0 };
    return undefined;
  }, [flex]);

  return (
    <View
      ref={ref}
      {...props}
      style={[flexStyleValue, props.style]}
      className={flexStyle({
        class: className,
        direction,
        wrap,
        justify,
        align,
        gap,
      })}
    />
  );
});

Flex.displayName = 'Flex';

export { Flex };
