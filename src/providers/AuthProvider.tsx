// src/providers/AuthProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';
import { UsersRow } from '~/types/user.type';
import { signInWithGoogle, signOut } from '~/auth/google';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  user: UsersRow | null;
  initializing: boolean;
  refreshUser: () => Promise<UsersRow | null>;
  setUserState: React.Dispatch<React.SetStateAction<UsersRow | null>>;
  signInWithGoogle: () => Promise<{ cancelled: true } | { cancelled: false; session: Session }>;
  signOut: () => Promise<void>;

  // 👇 NEW
  justCompletedOnboarding: boolean;
  setJustCompletedOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  userId: null,
  user: null,
  initializing: true,
  refreshUser: async () => null,
  setUserState: () => {},
  signInWithGoogle: async () => ({ cancelled: true }),
  signOut: async () => {},
  justCompletedOnboarding: false,
  setJustCompletedOnboarding: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UsersRow | null>(null);
  const [initializing, setInitializing] = useState(true);

  // 👇 NEW
  const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false);

  const fetchUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!error && data) {
      setUser(data);
      return data;
    } else {
      setUser(null);
      return null;
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

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    if (!session?.user?.id) return null;
    return fetchUser(session.user.id);
  }, [session?.user?.id, fetchUser]);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      user,
      initializing,
      refreshUser,
      setUserState: setUser,
      signInWithGoogle,
      signOut,

      justCompletedOnboarding,
      setJustCompletedOnboarding,
    }),
    [session, user, initializing, refreshUser, justCompletedOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
