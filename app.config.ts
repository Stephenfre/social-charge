import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
const revenueCatAndroidTestApiKey = process.env.EXPO_PUBLIC_RC_TEST_API_KEY_ANDROID;
const revenueCatUseTestStore = process.env.EXPO_PUBLIC_RC_USE_TEST_STORE === 'true';
const revenueCatEntitlementIdentifier =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_IDENTIFIER ?? 'Social Charge Pro';
const revenueCatOfferingIdentifier = process.env.EXPO_PUBLIC_RC_OFFERING_IDENTIFIER ?? 'default';
const revenueCatVirtualCurrencyCode = process.env.EXPO_PUBLIC_RC_VIRTUAL_CURRENCY_CODE ?? 'battery';
const googleSignInPlugin: [string, any] | null = googleIosUrlScheme
  ? [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ]
  : null;
const googleServicesFile = './google-services.json';
const hasGoogleServicesFile = existsSync(resolve(__dirname, googleServicesFile));

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
        backgroundColor: '#0F1012',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1989E9',
        defaultChannel: 'default',
        enableBackgroundRemoteNotifications: true,
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
    backgroundColor: '#0F1012',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    usesAppleSignIn: true,
    bundleIdentifier: appBundleIdentifier,
    config: {
      googleMapsApiKey,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: appName,
      NSCameraUsageDescription:
        'Social Charge uses the camera only to take a profile photo or scan guest QR codes for event check-in.',
      NSLocationWhenInUseUsageDescription:
        'Social Charge uses your location to fill in your city, state, and country and to improve nearby event recommendations.',
      NSPhotoLibraryUsageDescription:
        'Social Charge uses your photo library only so you can choose a profile photo.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: appBundleIdentifier,
    googleServicesFile: hasGoogleServicesFile ? googleServicesFile : undefined,
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
      apiKeyIos: revenueCatIosApiKey,
      testApiKeyIos: revenueCatIosTestApiKey,
      apiKeyAndroid: revenueCatAndroidApiKey,
      testApiKeyAndroid: revenueCatAndroidTestApiKey,
      useTestStore: revenueCatUseTestStore,
      entitlementIdentifier: revenueCatEntitlementIdentifier,
      offeringIdentifier: revenueCatOfferingIdentifier,
      virtualCurrencyCode: revenueCatVirtualCurrencyCode,
      products: {
        monthly: 'basic_monthly',
        monthly_plus: 'plus_monthly',
        monthly_premium: 'premium_monthly',
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
