import type { ExpoConfig } from 'expo/config';

const appEnv =
  process.env.APP_ENV ??
  (process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development');
const isDev = appEnv !== 'production';
const appName = isDev ? 'Social Charge (Beta)' : 'Social Charge';
const appBundleIdentifier = isDev ? 'dev.socialcharge.app' : 'com.socialcharge.app';
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? 'AIzaSyBCcCKvxUWXnP_qg9N2zoJclTIe4K_Cz8A';
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_RC_API_KEY_IOS;
const revenueCatIosTestApiKey = process.env.EXPO_PUBLIC_RC_TEST_API_KEY_IOS;
const revenueCatAndroidApiKey = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID;
const revenueCatUseTestStore = process.env.EXPO_PUBLIC_RC_USE_TEST_STORE === 'true';
const googleSignInPlugin: [string, any] | null = googleIosUrlScheme
  ? [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ]
  : null;

const config: ExpoConfig = {
  name: appName,
  slug: 'social-charge',
  scheme: 'socialcharge',
  version: '1.0.0',
  web: {
    favicon: './assets/sc_logo_dark.png',
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    'expo-font',
    'expo-maps',
    'expo-apple-authentication',
    ...(googleSignInPlugin ? [googleSignInPlugin] : []),
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'react-native',
        organization: 'social-charge',
      },
    ],
    'expo-web-browser',
  ],
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: appBundleIdentifier,
    config: {
      googleMapsApiKey,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: appName,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: appBundleIdentifier,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  updates: {
    url: 'https://u.expo.dev/d23885a9-5980-4fdb-a5ca-6f7921bc883b',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  newArchEnabled: true,
  extra: {
    revenuecat: {
      iosApiKey: revenueCatIosApiKey,
      iosTestApiKey: revenueCatIosTestApiKey,
      androidApiKey: revenueCatAndroidApiKey,
      useTestStore: revenueCatUseTestStore,
      entitlementIdentifier: 'Social Charge Pro',
      offeringIdentifier: 'default',
      products: {
        monthly: 'sub_monthly_1',
        yearly: 'sub_yearly',
        lifetime: 'sub_lifetime',
      },
      customerCenter: {
        enabled: true,
      },
    },
    eas: {
      projectId: 'd23885a9-5980-4fdb-a5ca-6f7921bc883b',
    },
  },
  owner: 'social-charge',
};

export default config;
