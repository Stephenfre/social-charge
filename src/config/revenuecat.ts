import Constants from 'expo-constants';

type RevenueCatProductsConfig = {
  monthly: string;
  yearly: string;
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
  apiKey: string;
  entitlementIdentifier: string;
  offeringIdentifier?: string;
  products: RevenueCatProductsConfig;
  customerCenter: {
    enabled: boolean;
  };
};

const resolveExtra = (): Record<string, unknown> => {
  if (Constants.expoConfig?.extra) {
    return Constants.expoConfig.extra;
  }

  const manifestExtra = (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra;
  if (manifestExtra) {
    return manifestExtra;
  }

  const manifest2Extra = (
    Constants as unknown as {
      manifest2?: { extra?: Record<string, unknown> };
    }
  ).manifest2?.extra;

  return manifest2Extra ?? {};
};

const extra = resolveExtra();
const rawRevenueCat = (extra.revenuecat ?? {}) as RevenueCatExtra;

console.log(' rawRevenueCat.offeringIdentifier ', rawRevenueCat.offeringIdentifier);

const defaultProducts: RevenueCatProductsConfig = {
  monthly: 'sub_monthly_1',
  yearly: 'sub_yearly',
};

export const revenueCatConfig: RevenueCatConfig = {
  apiKey: rawRevenueCat.apiKey ?? '',
  entitlementIdentifier: rawRevenueCat.entitlementIdentifier ?? 'Social Charge Pro',
  offeringIdentifier: rawRevenueCat.offeringIdentifier ?? 'default',
  products: {
    monthly: rawRevenueCat.products?.monthly ?? defaultProducts.monthly,
    yearly: rawRevenueCat.products?.yearly ?? defaultProducts.yearly,
  },
  customerCenter: {
    enabled: rawRevenueCat.customerCenter?.enabled ?? true,
  },
};

if (!revenueCatConfig.apiKey) {
  console.warn('RevenueCat API key is missing. Did you set expo.extra.revenuecat.apiKey?');
}

export type RevenueCatProductKey = keyof RevenueCatProductsConfig;

export const REVENUECAT_ENTITLEMENT = revenueCatConfig.entitlementIdentifier;
export const REVENUECAT_API_KEY = revenueCatConfig.apiKey;
