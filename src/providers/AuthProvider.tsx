// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '~/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { UsersRow } from '~/types/user.type';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  user: UsersRow | null;
  initializing: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  userId: null,
  user: null,
  initializing: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UsersRow | null>(null);
  const [initializing, setInitializing] = useState(true);

  const fetchUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!error && data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const load = async (sess: Session | null) => {
      setSession(sess);
      if (sess?.user?.id) {
        await fetchUser(sess.user.id);
      } else {
        setUser(null);
      }
      setInitializing(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => load(s));

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    if (!session?.user?.id) return;
    await fetchUser(session.user.id);
  }, [session?.user?.id, fetchUser]);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      user: user ?? null,
      initializing,
      refreshUser,
    }),
    [session, user, initializing, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
