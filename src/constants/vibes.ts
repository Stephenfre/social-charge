import { Enums } from '~/types/database.types';

export type VibeOptionSlug = Enums<'vibe_slug'>;

export const VIBE_OPTIONS: {
  slug: VibeOptionSlug;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    slug: 'social',
    emoji: '🎉',
    title: 'Social',
    description: 'Big energy. Group events. Nightlife.',
  },
  {
    slug: 'explorer',
    emoji: '🌎',
    title: 'Explorer',
    description: 'Adventures. Trips. Trying new things.',
  },
  {
    slug: 'connector',
    emoji: '🤝',
    title: 'Connector',
    description: 'Deep convos. Meaningful moments.',
  },
  {
    slug: 'chill',
    emoji: '😌',
    title: 'Chill',
    description: 'Low-key. Relaxed. Easygoing.',
  },
  {
    slug: 'wildcard',
    emoji: '⚡',
    title: 'Wildcard',
    description: 'Spontaneous. Down for anything.',
  },
];

export const VIBE_SLUGS = VIBE_OPTIONS.map(({ slug }) => slug) as [
  VibeOptionSlug,
  ...VibeOptionSlug[],
];

export const formatVibeLabel = (slug: VibeOptionSlug) =>
  VIBE_OPTIONS.find((option) => option.slug === slug)?.title ?? slug;

export const isVibeOptionSlug = (value: unknown): value is VibeOptionSlug =>
  typeof value === 'string' && VIBE_SLUGS.includes(value as VibeOptionSlug);
