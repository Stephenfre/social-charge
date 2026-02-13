import { Alert, Platform } from 'react-native';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
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
  presentCustomerCenter: () => Promise<void>;
  customerCenterEnabled: boolean;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const initialAppUserIdRef = useRef<string | undefined>(user?.id ?? undefined);
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
      console.log('customerInfo', customerInfo)
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
      console.log('[RevenueCat] offerings', fetchedOfferings);
      console.log('[RevenueCat] offerings summary', {
        configuredOfferingIdentifier: revenueCatConfig.offeringIdentifier ?? null,
        currentOfferingIdentifier: fetchedOfferings.current?.identifier ?? null,
        availableOfferingIdentifiers: Object.keys(fetchedOfferings.all ?? {}),
        hasConfiguredOffering: Boolean(
          revenueCatConfig.offeringIdentifier &&
            fetchedOfferings.all?.[revenueCatConfig.offeringIdentifier]
        ),
      });
      setOfferings(fetchedOfferings);
      setError(null);
      return fetchedOfferings;
    } catch (err) {
      console.error('[RevenueCat] getOfferings failed raw', err);
      handlePurchasesError(err, { showAlert: false });
      return null;
    } finally {
      setLoadingOfferings(false);
    }
  }, [handlePurchasesError]);

  useEffect(() => {
    let isMounted = true;
    let listenerRegistered = false;
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    const configurePurchases = async () => {
      let configured = false;
      try {
        if (Platform.OS === 'web') {
          return;
        }

        console.log('[RevenueCat] config', {
          platform: Platform.OS,
          useTestStore: revenueCatConfig.useTestStore,
          offeringId: revenueCatConfig.offeringIdentifier,
          entitlementId: revenueCatConfig.entitlementIdentifier,
          products: revenueCatConfig.products,
        });
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: initialAppUserIdRef.current,
        });
        configured = true;

        Purchases.addCustomerInfoUpdateListener(listener);
        listenerRegistered = true;

        if (!isMounted) {
          return;
        }
        await Promise.all([loadCustomerInfo(), loadOfferings()]);
      } catch (err) {
        handlePurchasesError(err);
      } finally {
        if (isMounted) {
          setInitialized(configured);
        }
      }
    };

    configurePurchases();

    return () => {
      isMounted = false;
      if (listenerRegistered) {
        Purchases.removeCustomerInfoUpdateListener(listener);
      }
    };
  }, [handlePurchasesError, loadCustomerInfo, loadOfferings]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const syncUser = async () => {
      try {
        if (Platform.OS === 'web') {
          return;
        }

        if (user?.id) {
          await Purchases.logIn(user.id);
        } else {
          await Purchases.logOut();
        }
        await Promise.all([loadCustomerInfo(), loadOfferings()]);
      } catch (err) {
        handlePurchasesError(err, { showAlert: false });
      }
    };

    syncUser();
  }, [handlePurchasesError, initialized, loadCustomerInfo, loadOfferings, user?.id]);

  const restorePurchases = useCallback(async () => {
    if (!initialized) {
      return null;
    }

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setError(null);
      return info;
    } catch (err) {
      handlePurchasesError(err);
      return null;
    }
  }, [handlePurchasesError, initialized]);

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
      if (!initialized) {
        return null;
      }

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
    [getPackageForProduct, handlePurchasesError, initialized, loadOfferings, offerings]
  );

  const presentPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      if (!initialized) {
        return null;
      }

      try {
        const availableOfferings = offerings ?? (await loadOfferings());
        const allOfferingKeys = Object.keys(availableOfferings?.all ?? {});
        const configuredOfferingId = revenueCatConfig.offeringIdentifier;

        console.log('[RevenueCat] paywall selection input', {
          requestedOfferingIdentifier: offeringIdentifier ?? null,
          configuredOfferingIdentifier: configuredOfferingId ?? null,
          currentOfferingIdentifier: availableOfferings?.current?.identifier ?? null,
          availableOfferingIdentifiers: allOfferingKeys,
        });

        let selectedOffering =
          offeringIdentifier && availableOfferings?.all
            ? availableOfferings.all[offeringIdentifier] ?? availableOfferings.current
            : availableOfferings?.current;

        if (!selectedOffering && availableOfferings?.all && configuredOfferingId) {
          selectedOffering = availableOfferings.all[configuredOfferingId] ?? selectedOffering;
        }

        if (!selectedOffering) {
          console.warn('[RevenueCat] no offering selected for paywall', {
            requestedOfferingIdentifier: offeringIdentifier ?? null,
            configuredOfferingIdentifier: configuredOfferingId ?? null,
            availableOfferingIdentifiers: allOfferingKeys,
          });
        } else {
          console.log('[RevenueCat] paywall selected offering', {
            selectedOfferingIdentifier: selectedOffering.identifier,
            packageIdentifiers: selectedOffering.availablePackages.map((pkg) => pkg.identifier),
            productIdentifiers: selectedOffering.availablePackages.map(
              (pkg) => pkg.product.identifier
            ),
          });
        }

        const result = await RevenueCatUI.presentPaywall({
          offering: selectedOffering ?? undefined,
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
    [handlePurchasesError, initialized, loadCustomerInfo, loadOfferings, offerings]
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
