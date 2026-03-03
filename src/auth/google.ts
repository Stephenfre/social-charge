import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';

let isConfigured = false;

const getGoogleConfig = () => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID for Google Sign In.');
  }

  return {
    webClientId,
    iosClientId,
  };
};

const configureGoogleSignin = () => {
  if (isConfigured) return;

  const { webClientId, iosClientId } = getGoogleConfig();

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
  });

  isConfigured = true;
};

export const signInWithGoogle = async (): Promise<
  { cancelled: true } | { cancelled: false; session: Session }
> => {
  configureGoogleSignin();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    return { cancelled: true };
  }

  const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;
  if (!idToken) {
    throw new Error('Google Sign In did not return an ID token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
  if (!data.session) throw new Error('Missing session after Google sign-in.');

  return { cancelled: false, session: data.session };
};

export const signOut = async () => {
  try {
    configureGoogleSignin();
    await GoogleSignin.signOut();
  } catch {
    // ignore native sign-out failures and always clear Supabase session
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
