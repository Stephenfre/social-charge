export const INTEREST_CATEGORIES = {
  active: ['Sports', 'Outdoors', 'Fitness', 'Hiking', 'Yoga', 'Dancing'],
  creative: ['Music', 'Art', 'Photography', 'Movies', 'Gaming', 'Fashion'],
  social: ['Travel', 'Nightlife', 'Foodie', 'Coffee', 'Volunteering'],
  relaxed: ['Reading', 'Tech', 'Pets'],
} as const;

export type Interest = (typeof INTEREST_CATEGORIES)[keyof typeof INTEREST_CATEGORIES][number];
