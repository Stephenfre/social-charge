import type { ExpoConfig } from 'expo/config';

const appEnv =
  process.env.APP_ENV ??
  (process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development');
const isDev = appEnv !== 'production';
const appName = isDev ? 'Social Charge (Dev)' : 'Social Charge';
const appBundleIdentifier = isDev ? 'dev.socialcharge.app' : 'com.socialcharge.app';
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? 'AIzaSyBCcCKvxUWXnP_qg9N2zoJclTIe4K_Cz8A';

const config: ExpoConfig = {
  name: appName,
  slug: 'social-charge',
  version: '1.0.0',
  web: {
    favicon: './assets/sc_logo_dark.png',
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: [
    'expo-font',
    'expo-maps',
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'react-native',
        organization: 'social-charge',
      },
    ],
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
  },
  newArchEnabled: true,
  extra: {
    revenuecat: {
      apiKeyIos: process.env.EXPO_PUBLIC_RC_API_KEY_IOS,
      apiKeyAndroid: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID,
      testApiKeyIos: process.env.EXPO_PUBLIC_RC_TEST_API_KEY_IOS,
      testApiKeyAndroid: process.env.EXPO_PUBLIC_RC_TEST_API_KEY_ANDROID,
      entitlementIdentifier: 'pro',
      offeringIdentifier: 'sale',
      products: {
        monthly: 'monthly_subscription',
        yearly: 'annual_subscription',
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
