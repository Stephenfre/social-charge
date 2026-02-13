import type { ExpoConfig } from 'expo/config';

const isDev = process.env.APP_ENV === 'development' || process.env.NODE_ENV === 'development';
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? 'AIzaSyBCcCKvxUWXnP_qg9N2zoJclTIe4K_Cz8A';

const config: ExpoConfig = {
  name: isDev ? 'Social Charge Dev' : 'Social Charge (Beta)',
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
    bundleIdentifier: isDev ? 'dev.socialcharge.app' : 'com.socialcharge.app',
    config: {
      googleMapsApiKey,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: isDev ? 'dev.socialcharge.app' : 'com.socialcharge.app',
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
      apiKey: 'appl_vPEKVcWjqyMLZtOtsCItPFFXDud',
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
