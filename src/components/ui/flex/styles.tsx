import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { isWeb } from '@gluestack-ui/nativewind-utils/IsWeb';

const baseStyle = isWeb
  ? 'flex relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent m-0 p-0 text-decoration-none'
  : '';

export const flexStyle = tva({
  base: baseStyle,
  variants: {
    direction: {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse',
    },
    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
    },
    justify: {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      center: 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    },
    align: {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      center: 'items-center',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
      16: 'gap-16',
      20: 'gap-20',
      24: 'gap-24',
    },
  },
  defaultVariants: {
    direction: 'column',
    wrap: 'nowrap',
    gap: 0,
  },
});
