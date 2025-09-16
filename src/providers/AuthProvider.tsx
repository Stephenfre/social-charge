// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '~/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { UserRow } from '~/types/event.types';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  user: UserRow | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  userId: null,
  user: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserRow>();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (sess: Session | null) => {
      setSession(sess);
      if (sess?.user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', sess.user.id)
          .single();
        if (!error && data && mounted) {
          setUser(data);
        }
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
      user: user ?? null,
      initializing,
    }),
    [session, user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
