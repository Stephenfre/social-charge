import { Alert } from 'react-native';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesError,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import {
  REVENUECAT_API_KEY,
  REVENUECAT_ENTITLEMENT,
  RevenueCatProductKey,
  revenueCatConfig,
} from '~/config/revenuecat';
import { useAuth } from './AuthProvider';

type RevenueCatContextValue = {
  initialized: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  loadingOfferings: boolean;
  isPro: boolean;
  activeProductIdentifier?: string;
  error: string | null;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  purchasePackage: (productKey: RevenueCatProductKey) => Promise<CustomerInfo | null>;
  presentPaywall: (offeringIdentifier?: string) => Promise<PAYWALL_RESULT | null>;
  presentOfferingPaywall: (offeringIdentifier?: string) => Promise<PAYWALL_RESULT | null>;
  presentPlacementPaywall: (placementIdentifier: string) => Promise<PAYWALL_RESULT | null>;
  presentCustomerCenter: () => Promise<void>;
  customerCenterEnabled: boolean;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

const resolveOffering = (
  availableOfferings: PurchasesOfferings | null,
  offeringIdentifier: string
): PurchasesOffering | null => {
  if (!availableOfferings) {
    return null;
  }

  const directMatch = availableOfferings.all?.[offeringIdentifier];
  if (directMatch) {
    return directMatch;
  }

  return (
    Object.values(availableOfferings.all ?? {}).find((offering) => {
      const candidate = offering as PurchasesOffering & {
        id?: string;
        identifier?: string;
        offeringIdentifier?: string;
      };

      return (
        candidate.identifier === offeringIdentifier ||
        candidate.id === offeringIdentifier ||
        candidate.offeringIdentifier === offeringIdentifier
      );
    }) ?? null
  );
};

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchasesError = useCallback(
    (err: unknown, { showAlert = true }: { showAlert?: boolean } = {}) => {
      if (!err) {
        return;
      }

      const purchasesError = err as PurchasesError;
      if (
        purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
        purchasesError?.userCancelled
      ) {
        return;
      }

      let message = 'Something went wrong while talking to the store. Please try again.';
      if (typeof purchasesError?.message === 'string') {
        message = purchasesError.message;
      }

      if (purchasesError?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        message =
          'Your payment is pending confirmation. We will automatically unlock access once the store confirms it.';
      }

      setError(message);

      if (showAlert) {
        Alert.alert('Purchase unavailable', message);
      }

      console.error('[RevenueCat]', err);
    },
    []
  );

  const loadCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setError(null);
      return info;
    } catch (err) {
      handlePurchasesError(err, { showAlert: false });
      return null;
    }
  }, [handlePurchasesError]);

  const loadOfferings = useCallback(async () => {
    setLoadingOfferings(true);
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      setOfferings(fetchedOfferings);
      setError(null);
      return fetchedOfferings;
    } catch (err) {
      handlePurchasesError(err, { showAlert: false });
      return null;
    } finally {
      setLoadingOfferings(false);
    }
  }, [handlePurchasesError]);

  useEffect(() => {
    let isMounted = true;

    const configurePurchases = async () => {
      try {
        if (!REVENUECAT_API_KEY) {
          throw new Error(
            'RevenueCat API key is missing. Set EXPO_PUBLIC_RC_API_KEY_IOS or EXPO_PUBLIC_RC_TEST_API_KEY_IOS for iOS builds.'
          );
        }

        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        if (!isMounted) {
          return;
        }
        await Promise.all([loadCustomerInfo(), loadOfferings()]);
      } catch (err) {
        handlePurchasesError(err);
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    configurePurchases();

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [handlePurchasesError, loadCustomerInfo, loadOfferings]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const syncUser = async () => {
      try {
        if (user?.id) {
          await Purchases.logIn(user.id);
        } else {
          await Purchases.logOut();
        }
      } catch (err) {
        handlePurchasesError(err, { showAlert: false });
      }
    };

    syncUser();
  }, [handlePurchasesError, initialized, user?.id]);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setError(null);
      return info;
    } catch (err) {
      handlePurchasesError(err);
      return null;
    }
  }, [handlePurchasesError]);

  const getPackageForProduct = useCallback(
    (productIdentifier: string): PurchasesPackage | null => {
      if (!offerings) {
        return null;
      }

      const allOfferings = [
        ...(offerings.current ? [offerings.current] : []),
        ...Object.values(offerings.all ?? {}),
      ];

      for (const offering of allOfferings) {
        const match = offering.availablePackages.find(
          (pkg) => pkg.product.identifier === productIdentifier || pkg.identifier === productIdentifier
        );
        if (match) {
          return match;
        }
      }

      return null;
    },
    [offerings]
  );

  const purchasePackage = useCallback(
    async (productKey: RevenueCatProductKey) => {
      try {
        const targetProductId = revenueCatConfig.products[productKey];
        const availableOfferings = offerings ?? (await loadOfferings());
        if (!availableOfferings) {
          throw new Error('No offerings are available for purchase yet.');
        }

        const pkg = getPackageForProduct(targetProductId);
        if (!pkg) {
          throw new Error('The selected product is not part of the current offering.');
        }

        const purchaseResult = await Purchases.purchasePackage(pkg);
        setCustomerInfo(purchaseResult.customerInfo);
        setError(null);
        await loadOfferings();
        return purchaseResult.customerInfo;
      } catch (err) {
        handlePurchasesError(err);
        return null;
      }
    },
    [getPackageForProduct, handlePurchasesError, loadOfferings, offerings]
  );

  const presentPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      try {
        const availableOfferings = offerings ?? (await loadOfferings());
        let selectedOffering =
          offeringIdentifier && availableOfferings?.all
            ? availableOfferings.all[offeringIdentifier] ?? availableOfferings.current
            : availableOfferings?.current;

        if (!selectedOffering && availableOfferings?.all && revenueCatConfig.offeringIdentifier) {
          selectedOffering =
            availableOfferings.all[revenueCatConfig.offeringIdentifier] ?? selectedOffering;
        }

        const presentDirectly = () =>
          RevenueCatUI.presentPaywall({ offering: selectedOffering ?? undefined });

        let result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT,
          offering: selectedOffering ?? undefined,
        });

        const hasActiveEntitlement = Boolean(
          customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT]
        );

        if (!hasActiveEntitlement && result === PAYWALL_RESULT.NOT_PRESENTED) {
          result = await presentDirectly();
        }

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await Promise.all([loadCustomerInfo(), loadOfferings()]);
        }

        return result;
      } catch (err) {
        handlePurchasesError(err);
        return null;
      }
    },
    [customerInfo, handlePurchasesError, loadCustomerInfo, loadOfferings, offerings]
  );

  const presentOfferingPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      try {
        const availableOfferings = offerings ?? (await loadOfferings());
        if (!offeringIdentifier) {
          throw new Error('A RevenueCat offering identifier is required to present this paywall.');
        }

        const selectedOffering = resolveOffering(availableOfferings, offeringIdentifier);
        if (!selectedOffering) {
          const availableIds = Object.keys(availableOfferings?.all ?? {});
          throw new Error(
            `RevenueCat offering "${offeringIdentifier}" was not found. Available offerings: ${
              availableIds.length ? availableIds.join(', ') : 'none'
            }.`
          );
        }

        const result = await RevenueCatUI.presentPaywall({
          offering: selectedOffering,
        });

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await Promise.all([loadCustomerInfo(), loadOfferings()]);
        }

        return result;
      } catch (err) {
        handlePurchasesError(err);
        return null;
      }
    },
    [handlePurchasesError, loadCustomerInfo, loadOfferings, offerings]
  );

  const presentPlacementPaywall = useCallback(
    async (placementIdentifier: string) => {
      try {
        const purchasesWithPlacements = Purchases as typeof Purchases & {
          getCurrentOfferingForPlacement?: (
            placementIdentifier: string
          ) => Promise<PurchasesOffering | null>;
          setAttributes?: (attributes: Record<string, string>) => Promise<void>;
          syncAttributesAndOfferingsIfNeeded?: () => Promise<PurchasesOfferings>;
        };

        if (!placementIdentifier) {
          throw new Error('A RevenueCat placement identifier is required to present this paywall.');
        }

        if (!purchasesWithPlacements.getCurrentOfferingForPlacement) {
          throw new Error(
            'This RevenueCat SDK version does not support placements. Upgrade react-native-purchases to use placement-based targeting.'
          );
        }

        await purchasesWithPlacements.setAttributes?.({
          purchase_batteries: 'true',
        });
        const syncedOfferings = await purchasesWithPlacements.syncAttributesAndOfferingsIfNeeded?.();

        console.log('[RevenueCat] synced offerings', {
          currentOfferingIdentifier: syncedOfferings?.current?.identifier ?? null,
          offeringIdentifiers: Object.keys(syncedOfferings?.all ?? {}),
        });

        const selectedOffering =
          await purchasesWithPlacements.getCurrentOfferingForPlacement(placementIdentifier);

        console.log('[RevenueCat] placement offering', {
          placementIdentifier,
          offeringIdentifier: selectedOffering?.identifier ?? null,
        });

        if (!selectedOffering) {
          throw new Error(`No offering was returned for placement "${placementIdentifier}".`);
        }

        const result = await RevenueCatUI.presentPaywall({
          offering: selectedOffering,
        });

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await Promise.all([loadCustomerInfo(), loadOfferings()]);
        }

        return result;
      } catch (err) {
        handlePurchasesError(err);
        return null;
      }
    },
    [handlePurchasesError, loadCustomerInfo, loadOfferings]
  );

  const presentCustomerCenter = useCallback(async () => {
    if (!revenueCatConfig.customerCenter.enabled) {
      await presentPaywall();
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter();
      await loadCustomerInfo();
    } catch (err) {
      handlePurchasesError(err);
    }
  }, [handlePurchasesError, loadCustomerInfo, presentPaywall]);

  const isPro = useMemo(() => {
    if (!customerInfo) {
      return false;
    }

    return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT]);
  }, [customerInfo]);

  const activeProductIdentifier = useMemo(() => {
    if (!customerInfo) {
      return undefined;
    }

    const entitlement = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT];
    return entitlement?.productIdentifier;
  }, [customerInfo]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      initialized,
      customerInfo,
      offerings,
      loadingOfferings,
      isPro,
      activeProductIdentifier,
      error,
      refreshCustomerInfo: loadCustomerInfo,
      restorePurchases,
      purchasePackage,
      presentPaywall,
      presentOfferingPaywall,
      presentPlacementPaywall,
      presentCustomerCenter,
      customerCenterEnabled: revenueCatConfig.customerCenter.enabled,
    }),
    [
      activeProductIdentifier,
      customerInfo,
      error,
      initialized,
      isPro,
      loadingOfferings,
      offerings,
      presentCustomerCenter,
      presentOfferingPaywall,
      presentPlacementPaywall,
      presentPaywall,
      purchasePackage,
      loadCustomerInfo,
      restorePurchases,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider.');
  }

  return context;
};
