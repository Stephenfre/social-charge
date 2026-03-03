import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';

const NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const createNonce = (length = 32) =>
  Array.from({ length }, () => NONCE_CHARSET[Math.floor(Math.random() * NONCE_CHARSET.length)]).join(
    ''
  );

const isCancellationError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'ERR_REQUEST_CANCELED';

export const isAppleSignInAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
};

export const signInWithApple = async (): Promise<
  { cancelled: true } | { cancelled: false; session: Session }
> => {
  const isAvailable = await isAppleSignInAvailable();
  if (!isAvailable) {
    throw new Error('Apple Sign In is not available on this device.');
  }

  const rawNonce = createNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) throw error;
    if (!data.session) throw new Error('Missing session after Apple sign-in.');

    return { cancelled: false, session: data.session };
  } catch (error) {
    if (isCancellationError(error)) {
      return { cancelled: true };
    }

    throw error;
  }
};
