// src/providers/AuthProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react-native';
import { isSupabaseConfigured, supabase } from '~/lib/supabase';
import { UsersRow } from '~/types/user.type';
import { signInWithGoogle, signOut as providerSignOut } from '~/auth/google';
import { signInWithApple } from '~/auth/apple';

const STARTUP_PROFILE_TIMEOUT_MS = 8000;

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  user: UsersRow | null;
  initializing: boolean;
  refreshUser: () => Promise<UsersRow | null>;
  setUserState: React.Dispatch<React.SetStateAction<UsersRow | null>>;
  signInWithGoogle: () => Promise<{ cancelled: true } | { cancelled: false; session: Session }>;
  signInWithApple: () => Promise<{ cancelled: true } | { cancelled: false; session: Session }>;
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
  signInWithApple: async () => ({ cancelled: true }),
  signOut: async () => {},
  justCompletedOnboarding: false,
  setJustCompletedOnboarding: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UsersRow | null>(null);
  const [initializing, setInitializing] = useState(true);
  const mountedRef = useRef(false);
  const profileRequestIdRef = useRef(0);

  // 👇 NEW
  const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      profileRequestIdRef.current += 1;
    };
  }, []);

  const fetchUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }, []);

  const hydrateUser = useCallback(
    async (sess: Session | null) => {
      const requestId = profileRequestIdRef.current + 1;
      profileRequestIdRef.current = requestId;

      if (!sess?.user?.id) {
        setUser(null);
        return null;
      }

      try {
        const nextUser = await fetchUser(sess.user.id);
        if (mountedRef.current && profileRequestIdRef.current === requestId) {
          setUser(nextUser);
        }
        return nextUser;
      } catch (error) {
        Sentry.captureException(error);
        if (mountedRef.current && profileRequestIdRef.current === requestId) {
          setUser(null);
        }
        return null;
      }
    },
    [fetchUser]
  );

  const finishInitialProfileHydration = useCallback(
    async (sess: Session | null) => {
      if (!sess?.user?.id) {
        setUser(null);
        return;
      }

      await Promise.race([
        hydrateUser(sess),
        new Promise((resolve) => setTimeout(resolve, STARTUP_PROFILE_TIMEOUT_MS)),
      ]);
    },
    [hydrateUser]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      Sentry.captureMessage('Supabase public environment variables are missing.');
      setSession(null);
      setUser(null);
      setInitializing(false);
      return;
    }

    const startupTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setInitializing(false);
      }
    }, STARTUP_PROFILE_TIMEOUT_MS);

    const setSessionFromAuth = (nextSession: Session | null) => {
      setSession(nextSession);

      if (!nextSession?.user?.id) {
        profileRequestIdRef.current += 1;
        setUser(null);
        return;
      }

      setTimeout(() => {
        if (mountedRef.current) {
          void hydrateUser(nextSession);
        }
      }, 0);
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (!mountedRef.current) return;

        setSession(initialSession);
        await finishInitialProfileHydration(initialSession);
      })
      .catch((error) => {
        Sentry.captureException(error);
        if (!mountedRef.current) return;

        setSession(null);
        setUser(null);
      })
      .finally(() => {
        clearTimeout(startupTimeout);
        if (mountedRef.current) {
          setInitializing(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSessionFromAuth(nextSession);
    });

    return () => {
      clearTimeout(startupTimeout);
      subscription.unsubscribe();
    };
  }, [finishInitialProfileHydration, hydrateUser]);

  const refreshUser = useCallback(async () => {
    if (!session?.user?.id) return null;

    try {
      const nextUser = await fetchUser(session.user.id);
      if (mountedRef.current) {
        setUser(nextUser);
      }
      return nextUser;
    } catch (error) {
      Sentry.captureException(error);
      if (mountedRef.current) {
        setUser(null);
      }
      return null;
    }
  }, [session?.user?.id, fetchUser]);

  const signOut = useCallback(async () => {
    // Immediately clear local auth state so routing updates without waiting for auth callbacks.
    profileRequestIdRef.current += 1;
    setSession(null);
    setUser(null);

    try {
      await providerSignOut();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      user,
      initializing,
      refreshUser,
      setUserState: setUser,
      signInWithGoogle,
      signInWithApple,
      signOut,

      justCompletedOnboarding,
      setJustCompletedOnboarding,
    }),
    [session, user, initializing, refreshUser, justCompletedOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
