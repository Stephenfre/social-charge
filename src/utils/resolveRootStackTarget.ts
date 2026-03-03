import type { Session } from '@supabase/supabase-js';
import type { UsersRow } from '~/types/user.type';

export type RootStackTarget = 'app' | 'auth' | 'onboarding' | 'profileCompletion';

function hasCompletedProfile(user: UsersRow | null) {
  if (!user) return false;

  return Boolean(
    user.first_name?.trim() &&
      user.last_name?.trim() &&
      user.gender &&
      user.birth_date &&
      user.age !== null
  );
}

export function resolveRootStackTarget(
  session: Session | null,
  user: UsersRow | null
): RootStackTarget {
  if (!session) {
    return 'auth';
  }

  if (!hasCompletedProfile(user)) {
    return 'profileCompletion';
  }

  if (user?.onboarded === true) {
    return 'app';
  }

  return 'onboarding';
}
