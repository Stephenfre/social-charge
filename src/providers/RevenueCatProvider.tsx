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
import Constants from 'expo-constants';
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
import { supabase } from '~/lib/supabase';
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

const hasAnyOfferings = (availableOfferings: PurchasesOfferings | null) =>
  Boolean(
    availableOfferings?.current || Object.keys(availableOfferings?.all ?? {}).length > 0
  );

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

const resolveDefaultPaywallOffering = (
  availableOfferings: PurchasesOfferings | null
): PurchasesOffering | null => {
  if (!availableOfferings) {
    return null;
  }

  if (availableOfferings.current) {
    return availableOfferings.current;
  }

  if (revenueCatConfig.offeringIdentifier) {
    const configuredOffering = resolveOffering(
      availableOfferings,
      revenueCatConfig.offeringIdentifier
    );
    if (configuredOffering) {
      return configuredOffering;
    }
  }

  const allOfferings = Object.values(availableOfferings.all ?? {});
  return allOfferings[0] ?? null;
};

const buildNoOfferingsMessage = (availableOfferings: PurchasesOfferings | null) => {
  const availableIds = Object.keys(availableOfferings?.all ?? {});
  const bundleIdentifier =
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    'unknown';
  const configuredOffering = revenueCatConfig.offeringIdentifier ?? 'not set';
  const storeMode = revenueCatConfig.useTestStore ? 'test' : 'production';

  return [
    `No RevenueCat paywall offering is available. Available offerings: ${
      availableIds.length ? availableIds.join(', ') : 'none'
    }.`,
    `Configured offering: ${configuredOffering}.`,
    `Bundle ID: ${bundleIdentifier}.`,
    `Store mode: ${storeMode}.`,
    revenueCatConfig.useTestStore
      ? 'This build uses the RevenueCat Test Store SDK key, so App Store products will not load unless the project also has Test Store products configured.'
      : 'In production, this usually means the public RevenueCat SDK key points to a different project than the dashboard you are checking, or the App Store products are unavailable for this bundle ID.',
  ].join(' ');
};

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const { setUserState, user } = useAuth();
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
      await Purchases.invalidateCustomerInfoCache();
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setError(null);
      return info;
    } catch (err) {
      handlePurchasesError(err, { showAlert: false });
      return null;
    }
  }, [handlePurchasesError]);

  const getProductDiagnosticsSummary = useCallback(async (source: string) => {
    const requestedProductIds = Array.from(
      new Set(
        Object.values(revenueCatConfig.products).filter(
          (productId): productId is string => typeof productId === 'string' && productId.length > 0
        )
      )
    );

    try {
      const products = await Purchases.getProducts(requestedProductIds);
      const returnedProductIds = products.map((product) => product.identifier);

      console.warn('[RevenueCat] Product diagnostics', {
        source,
        requestedProductIds,
        returnedProductIds,
        returnedProductsCount: products.length,
      });

      return `Requested product IDs: ${requestedProductIds.join(', ')}. Returned products: ${
        returnedProductIds.length ? returnedProductIds.join(', ') : 'none'
      }.`;
    } catch (err) {
      const purchasesError = err as PurchasesError;

      console.warn('[RevenueCat] Product diagnostics failed', {
        source,
        requestedProductIds,
        error: err,
      });

      return `Requested product IDs: ${requestedProductIds.join(
        ', '
      )}. Product lookup failed: ${
        typeof purchasesError?.message === 'string' ? purchasesError.message : 'unknown error'
      }.`;
    }
  }, []);

  const buildNoOfferingsMessageWithDiagnostics = useCallback(
    async (availableOfferings: PurchasesOfferings | null, source: string) => {
      const baseMessage = buildNoOfferingsMessage(availableOfferings);
      const diagnosticsSummary = await getProductDiagnosticsSummary(source);
      return `${baseMessage} ${diagnosticsSummary}`;
    },
    [getProductDiagnosticsSummary]
  );

  const loadOfferings = useCallback(async () => {
    setLoadingOfferings(true);
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      setOfferings(fetchedOfferings);
      setError(null);
      if (!hasAnyOfferings(fetchedOfferings)) {
        console.warn(
          '[RevenueCat]',
          await buildNoOfferingsMessageWithDiagnostics(fetchedOfferings, 'loadOfferings')
        );
      }
      return fetchedOfferings;
    } catch (err) {
      handlePurchasesError(err, { showAlert: false });
      return null;
    } finally {
      setLoadingOfferings(false);
    }
  }, [buildNoOfferingsMessageWithDiagnostics, handlePurchasesError]);

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

    let cancelled = false;

    const syncUser = async () => {
      try {
        if (user?.id) {
          const loginResult = await Purchases.logIn(user.id);
          if (!cancelled) {
            setCustomerInfo(loginResult.customerInfo);
          }
        } else {
          const loggedOutCustomerInfo = await Purchases.logOut();
          if (!cancelled) {
            setCustomerInfo(loggedOutCustomerInfo);
          }
        }

        if (!cancelled) {
          await Promise.all([loadCustomerInfo(), loadOfferings()]);
        }
      } catch (err) {
        handlePurchasesError(err, { showAlert: false });
      }
    };

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [handlePurchasesError, initialized, loadCustomerInfo, loadOfferings, user?.id]);

  useEffect(() => {
    if (!initialized || !user?.id || !customerInfo) {
      return;
    }

    if (user.membership === 'admin' || user.membership === 'superadmin') {
      return;
    }

    const nextMembership = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT]
      ? 'premium'
      : 'basic';

    if (user.membership === nextMembership) {
      return;
    }

    let cancelled = false;

    const syncMembership = async () => {
      const { error: updateError } = await supabase
        .from('users')
        .update({ membership: nextMembership })
        .eq('id', user.id);

      if (updateError) {
        handlePurchasesError(updateError, { showAlert: false });
        return;
      }

      if (cancelled) {
        return;
      }

      setUserState((current) =>
        current ? { ...current, membership: nextMembership } : current
      );
    };

    syncMembership();

    return () => {
      cancelled = true;
    };
  }, [customerInfo, handlePurchasesError, initialized, setUserState, user]);

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
    (
      availableOfferings: PurchasesOfferings | null,
      productIdentifier: string
    ): PurchasesPackage | null => {
      if (!availableOfferings) {
        return null;
      }

      const allOfferings = [
        ...(availableOfferings.current ? [availableOfferings.current] : []),
        ...Object.values(availableOfferings.all ?? {}),
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
    []
  );

  const purchasePackage = useCallback(
    async (productKey: RevenueCatProductKey) => {
      try {
        const targetProductId = revenueCatConfig.products[productKey];
        if (!targetProductId) {
          throw new Error(`RevenueCat product "${productKey}" is not configured for this build.`);
        }
        const availableOfferings = hasAnyOfferings(offerings) ? offerings : await loadOfferings();
        if (!hasAnyOfferings(availableOfferings)) {
          throw new Error(
            await buildNoOfferingsMessageWithDiagnostics(availableOfferings, 'purchasePackage')
          );
        }

        const pkg = getPackageForProduct(availableOfferings, targetProductId);
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
    [
      buildNoOfferingsMessageWithDiagnostics,
      getPackageForProduct,
      handlePurchasesError,
      loadOfferings,
      offerings,
    ]
  );

  const presentPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      try {
        const availableOfferings = hasAnyOfferings(offerings) ? offerings : await loadOfferings();
        const selectedOffering = offeringIdentifier
          ? resolveOffering(availableOfferings, offeringIdentifier) ??
            resolveDefaultPaywallOffering(availableOfferings)
          : resolveDefaultPaywallOffering(availableOfferings);

        if (!selectedOffering) {
          throw new Error(
            await buildNoOfferingsMessageWithDiagnostics(availableOfferings, 'presentPaywall')
          );
        }

        const presentDirectly = () =>
          RevenueCatUI.presentPaywall({ offering: selectedOffering });

        let result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT,
          offering: selectedOffering,
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
    [
      buildNoOfferingsMessageWithDiagnostics,
      customerInfo,
      handlePurchasesError,
      loadCustomerInfo,
      loadOfferings,
      offerings,
    ]
  );

  const presentOfferingPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      try {
        const availableOfferings = hasAnyOfferings(offerings) ? offerings : await loadOfferings();
        if (!offeringIdentifier) {
          throw new Error('A RevenueCat offering identifier is required to present this paywall.');
        }

        const selectedOffering = resolveOffering(availableOfferings, offeringIdentifier);
        if (!selectedOffering) {
          const availableIds = Object.keys(availableOfferings?.all ?? {});
          throw new Error(
            `RevenueCat offering "${offeringIdentifier}" was not found. Available offerings: ${
              availableIds.length ? availableIds.join(', ') : 'none'
            }. ${await getProductDiagnosticsSummary('presentOfferingPaywall')}`
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
    [
      getProductDiagnosticsSummary,
      handlePurchasesError,
      loadCustomerInfo,
      loadOfferings,
      offerings,
    ]
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
        await purchasesWithPlacements.syncAttributesAndOfferingsIfNeeded?.();

        const selectedOffering =
          await purchasesWithPlacements.getCurrentOfferingForPlacement(placementIdentifier);

        if (!selectedOffering) {
          throw new Error(`No offering was returned for placement "${placementIdentifier}".`);
        }

        const result = await RevenueCatUI.presentPaywall({
          offering: selectedOffering,
        });

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await Promise.all([
            loadCustomerInfo(),
            loadOfferings(),
            Purchases.invalidateVirtualCurrenciesCache(),
          ]);
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
