import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'social charge',
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
    bundleIdentifier: 'com.socialcharge.app',
    config: {
      googleMapsApiKey: 'AIzaSyBCcCKvxUWXnP_qg9N2zoJclTIe4K_Cz8A',
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
    package: 'com.socialcharge.app',
  },
  newArchEnabled: true,
  extra: {
    revenuecat: {
      apiKeyIos: 'appl_LKWuNKaYXNigYoCREEMMMSZjzVh',
      testApiKeyIos: 'test_gReKYJMgdINDFUNLBtAWZBHxyoR',
      entitlementIdentifier: 'Social Charge Pro',
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
