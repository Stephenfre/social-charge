import Constants from 'expo-constants';
import { Platform } from 'react-native';

type RevenueCatProductsConfig = {
  monthly: string;
  monthly_plus: string;
  monthly_premium: string;
  yearly: string;
};
export type RevenueCatProductKey = keyof RevenueCatProductsConfig;

type RevenueCatExtra = {
  apiKeyIos?: string;
  apiKeyAndroid?: string;
  testApiKeyIos?: string;
  testApiKeyAndroid?: string;
  entitlementIdentifier?: string;
  offeringIdentifier?: string;
  products?: Partial<RevenueCatProductsConfig>;
  customerCenter?: { enabled?: boolean };
};

export type RevenueCatConfig = {
  apiKey: string;
  entitlementIdentifier: string;
  offeringIdentifier?: string;
  products: RevenueCatProductsConfig;
  customerCenter: { enabled: boolean };
  useTestStore: boolean;
};

const extra = (Constants.expoConfig?.extra?.revenuecat as RevenueCatExtra | undefined) ?? {};

const useTestStore = process.env.EXPO_PUBLIC_RC_USE_TEST_STORE === 'true';

// Prefer env vars, fall back to app config extra.
// Use platform-specific keys.
const apiKey = (() => {
  const isIos = Platform.OS === 'ios';

  const envProd = isIos
    ? process.env.EXPO_PUBLIC_RC_API_KEY_IOS
    : process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID;

  const envTest = isIos
    ? process.env.EXPO_PUBLIC_RC_TEST_API_KEY_IOS
    : process.env.EXPO_PUBLIC_RC_TEST_API_KEY_ANDROID;

  const extraProd = isIos ? extra.apiKeyIos : extra.apiKeyAndroid;
  const extraTest = isIos ? extra.testApiKeyIos : extra.testApiKeyAndroid;

  const chosen = useTestStore ? (envTest ?? extraTest) : (envProd ?? extraProd);

  if (!chosen || typeof chosen !== 'string' || chosen.trim().length === 0) {
    throw new Error(
      `[RevenueCat] Missing ${useTestStore ? 'TEST' : 'PROD'} API key for ${
        isIos ? 'iOS' : 'Android'
      }. Check EXPO_PUBLIC_RC_* env vars or app.config extra.`
    );
  }

  return chosen.trim();
})();

const defaultProducts: RevenueCatProductsConfig = {
  monthly: 'monthly_subscription',
  monthly_plus: 'monthly_plus_subscription',
  monthly_premium: 'monthly_premium_subscription',
  yearly: 'annual_subscription',
};

export const revenueCatConfig: RevenueCatConfig = {
  apiKey,
  entitlementIdentifier: extra.entitlementIdentifier ?? 'pro', // keep this stable; don't use display names with spaces
  offeringIdentifier: extra.offeringIdentifier ?? 'sale',
  products: {
    monthly: extra.products?.monthly ?? defaultProducts.monthly,
    monthly_plus: extra.products?.monthly_plus ?? defaultProducts.monthly_plus,
    monthly_premium: extra.products?.monthly_premium ?? defaultProducts.monthly_premium,
    yearly: extra.products?.yearly ?? defaultProducts.yearly,
  },
  customerCenter: {
    enabled: extra.customerCenter?.enabled ?? true,
  },
  useTestStore,
};

export const REVENUECAT_ENTITLEMENT = revenueCatConfig.entitlementIdentifier;
export const REVENUECAT_API_KEY = revenueCatConfig.apiKey;
