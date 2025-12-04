import type { Session } from '@supabase/supabase-js';
import type { UsersRow } from '~/types/user.type';

export type RootStackTarget = 'app' | 'auth' | 'onboarding';

export function resolveRootStackTarget(
  session: Session | null,
  user: UsersRow | null
): RootStackTarget {
  if (session && user?.onboarded === true) {
    return 'app';
  }

  if (session && user?.onboarded !== true) {
    return 'onboarding';
  }

  return 'auth';
}
