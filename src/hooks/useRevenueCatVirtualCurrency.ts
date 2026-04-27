import { useQuery } from '@tanstack/react-query';
import Purchases from 'react-native-purchases';

import { REVENUECAT_VIRTUAL_CURRENCY_CODE } from '~/config/revenuecat';
import { useAuth } from '~/providers/AuthProvider';

export const REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS = {
  all: (userId: string | null) => ['revenuecat-virtual-currencies', userId] as const,
  balance: (userId: string | null, code: string | null) =>
    ['revenuecat-virtual-currency-balance', userId, code] as const,
};

export function useRevenueCatVirtualCurrency(code = REVENUECAT_VIRTUAL_CURRENCY_CODE ?? null) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS.balance(userId, code),
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        await Purchases.invalidateVirtualCurrenciesCache();
      } catch {
        // Keep reading balance even if cache invalidation is unavailable or fails.
      }

      const live = await Purchases.getVirtualCurrencies();
      const cached = await Purchases.getCachedVirtualCurrencies();
      const virtualCurrencies = live ?? cached;
      const currencies = virtualCurrencies.all ?? {};

      if (code && currencies[code]) {
        return currencies[code];
      }

      const firstCurrency = Object.values(currencies)[0] ?? null;
      return firstCurrency;
    },
  });
}
