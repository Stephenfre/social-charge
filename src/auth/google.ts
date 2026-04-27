import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');
type GoogleSigninStatic = GoogleSigninModule['GoogleSignin'];

let isConfigured = false;
let playServicesPromise: Promise<boolean> | null = null;
let googleSigninModulePromise: Promise<GoogleSigninModule> | null = null;

const getGoogleSignin = async () => {
  googleSigninModulePromise ??= import('@react-native-google-signin/google-signin');
  const { GoogleSignin } = await googleSigninModulePromise;
  return GoogleSignin;
};

const getGoogleConfig = () => {
  const serverClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!serverClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID for Google Sign In.');
  }

  if (Platform.OS === 'android' && !androidClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID for Google Sign In.');
  }

  return {
    serverClientId,
    androidClientId,
    iosClientId,
  };
};

const configureGoogleSignin = async (): Promise<GoogleSigninStatic> => {
  const GoogleSignin = await getGoogleSignin();

  if (isConfigured) return GoogleSignin;

  const { serverClientId, iosClientId } = getGoogleConfig();

  GoogleSignin.configure({
    webClientId: serverClientId,
    iosClientId,
    offlineAccess: false,
  });

  isConfigured = true;
  return GoogleSignin;
};

export const prepareGoogleSignIn = async () => {
  const GoogleSignin = await configureGoogleSignin();

  if (Platform.OS === 'android') {
    playServicesPromise ??= GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    await playServicesPromise;
  }

  return GoogleSignin;
};

export const signInWithGoogle = async (): Promise<
  { cancelled: true } | { cancelled: false; session: Session }
> => {
  const GoogleSignin = await prepareGoogleSignIn();

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
    const GoogleSignin = await configureGoogleSignin();
    await GoogleSignin.signOut();
  } catch {
    // ignore native sign-out failures and always clear Supabase session
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    const code =
      'code' in error && typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : null;
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';

    // If the session is already gone, treat logout as successful.
    const isMissingSession =
      code === 'session_not_found' ||
      message.includes('auth session missing') ||
      message.includes('session missing');

    if (!isMissingSession) {
      throw error;
    }
  }
};
