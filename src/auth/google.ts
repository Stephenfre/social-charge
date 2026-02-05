// import { Platform } from 'react-native';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// import { supabase } from '~/lib/supabase';

// const configureGoogleSignin = () => {
//   GoogleSignin.configure({
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
//     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
//     offlineAccess: false,
//   });
// };

// export const signInWithGoogle = async () => {
//   configureGoogleSignin();

//   try {
//     await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//     const userInfo = await GoogleSignin.signIn();
//     const idToken = userInfo.idToken;

//     if (!idToken) {
//       throw new Error('Missing Google idToken.');
//     }

//     const { data, error } = await supabase.auth.signInWithIdToken({
//       provider: 'google',
//       token: idToken,
//     });

//     if (error) throw error;
//     if (!data?.session) throw new Error('Missing session after Google sign-in.');

//     return { cancelled: false, session: data.session } as const;
//   } catch (err: unknown) {
//     if (
//       err &&
//       typeof err === 'object' &&
//       'code' in err &&
//       (err as { code?: string }).code === statusCodes.SIGN_IN_CANCELLED
//     ) {
//       return { cancelled: true } as const;
//     }

//     throw err;
//   }
// };

// export const signOut = async () => {
//   try {
//     await GoogleSignin.signOut();
//   } catch {
//     // ignore native sign-out errors
//   }
//   const { error } = await supabase.auth.signOut();
//   if (error) throw error;
// };

// export const isWeb = Platform.OS === 'web';
