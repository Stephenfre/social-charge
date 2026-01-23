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
  apiKey: string;
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
  apiKey: 'appl_vPEKVcWjqyMLZtOtsCItPFFXDud',
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
export const REVENUECAT_API_KEY = revenueCatConfig.apiKey;
