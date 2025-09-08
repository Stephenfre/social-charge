// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '~/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  membership_role: string;
  initializing: boolean;
};
const AuthContext = createContext<AuthCtx>({
  session: null,
  userId: null,
  membership_role: 'basic',
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membershipRole, setMembershipRole] = useState<string>('basic');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (sess: Session | null) => {
      setSession(sess);
      if (sess?.user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('membership')
          .eq('id', sess.user.id)
          .single();
        if (!error && data && mounted) {
          setMembershipRole(data.membership);
        }
      } else {
        setMembershipRole('basic');
      }
      setInitializing(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => load(s));

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      membership_role: membershipRole,
      initializing,
    }),
    [session, membershipRole, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
