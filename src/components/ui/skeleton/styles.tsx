import { tva } from '@gluestack-ui/nativewind-utils/tva';

export const skeletonStyle = tva({
  base: 'animate-pulse bg-gray-200',
  variants: {
    variant: {
      text: 'rounded',
      rounded: 'rounded-lg',
      circular: 'rounded-full',
    },
    speed: {
      1: 'duration-75',
      2: 'duration-100',
      3: 'duration-150',
      4: 'duration-200',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
});
export const skeletonTextStyle = tva({
  base: 'animate-pulse bg-neutral-200 rounded',
  variants: {
    speed: {
      1: 'duration-75',
      2: 'duration-100',
      3: 'duration-150',
      4: 'duration-200',
    },
    gap: {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
    },
  },
});
