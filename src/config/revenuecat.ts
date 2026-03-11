import { Platform } from 'react-native';

type RevenueCatProductsConfig = {
  monthly: string;
};

type RevenueCatExtra = {
  apiKey?: string;
  entitlementIdentifier?: string;
  offeringIdentifier?: string;
  products?: Partial<RevenueCatProductsConfig>;
  customerCenter?: {
    enabled?: boolean;
  };
};

export type RevenueCatConfig = {
  iosApiKey?: string;
  iosTestApiKey?: string;
  androidApiKey?: string;
  useTestStore: boolean;
  virtualCurrencyCode?: string;
  entitlementIdentifier: string;
  offeringIdentifier?: string;
  products: RevenueCatProductsConfig;
  customerCenter: {
    enabled: boolean;
  };
};

const defaultProducts: RevenueCatProductsConfig = {
  monthly: 'monthly',
};

export const revenueCatConfig: RevenueCatConfig = {
  iosApiKey: process.env.EXPO_PUBLIC_RC_API_KEY_IOS,
  iosTestApiKey: process.env.EXPO_PUBLIC_RC_TEST_API_KEY_IOS,
  androidApiKey: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID,
  useTestStore: process.env.EXPO_PUBLIC_RC_USE_TEST_STORE === 'true',
  virtualCurrencyCode: process.env.EXPO_PUBLIC_RC_VIRTUAL_CURRENCY_CODE,
  entitlementIdentifier: 'Social Charge Pro',
  offeringIdentifier: 'default',
  products: {
    monthly: defaultProducts.monthly,
  },
  customerCenter: {
    enabled: true,
  },
};

export type RevenueCatProductKey = keyof RevenueCatProductsConfig;

export const REVENUECAT_ENTITLEMENT = revenueCatConfig.entitlementIdentifier;
export const REVENUECAT_API_KEY =
  Platform.OS === 'ios'
    ? revenueCatConfig.useTestStore
      ? revenueCatConfig.iosTestApiKey ?? revenueCatConfig.iosApiKey
      : revenueCatConfig.iosApiKey
    : revenueCatConfig.androidApiKey;
export const REVENUECAT_VIRTUAL_CURRENCY_CODE = revenueCatConfig.virtualCurrencyCode;
