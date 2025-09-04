// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '~/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  initializing: boolean;
};
const AuthContext = createContext<AuthCtx>({ session: null, userId: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, userId: session?.user?.id ?? null, initializing }),
    [session, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
