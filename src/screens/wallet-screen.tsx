import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { ArrowRight, Minus, Plus } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { Box, Button, Flex, Text } from '~/components/ui';
import { useRevenueCatVirtualCurrency, useTokenTransactions } from '~/hooks';
import { useRevenueCat } from '~/providers/RevenueCatProvider';

type WalletHistoryItem = {
  id: string;
  kind: 'purchase' | 'spend' | 'refund';
  amount: number | null;
  createdAt: string;
  title: string;
  subtitle?: string | null;
  amountLabel?: string | null;
};

const inferAmountFromProductIdentifier = (productIdentifier: string): number | null => {
  const matches = productIdentifier.match(/\d+/g);
  if (!matches?.length) {
    return null;
  }

  const amount = Number(matches[matches.length - 1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const formatProductIdentifier = (productIdentifier: string): string => {
  const amount = inferAmountFromProductIdentifier(productIdentifier);
  if (amount) {
    return `${amount} Social Battery Pack`;
  }

  return productIdentifier;
};

const toTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function WalletScreen() {
  const { initialized, loadingOfferings, error, presentPlacementPaywall, customerInfo, offerings } =
    useRevenueCat();
  const {
    data: virtualCurrency,
    isLoading: isBalanceInitialLoading,
    isRefetching: isBalanceRefetching,
    refetch: refetchVirtualCurrency,
  } = useRevenueCatVirtualCurrency();

  const { data: tokenTransactions, isLoading: isTransactionsLoading } = useTokenTransactions();
  const handleOpenTokensPaywall = useCallback(async () => {
    if (!initialized || loadingOfferings) {
      return;
    }

    await presentPlacementPaywall('battery_pack_purchase');
    await refetchVirtualCurrency();
  }, [initialized, loadingOfferings, presentPlacementPaywall, refetchVirtualCurrency]);

  const isBalanceLoading = isBalanceInitialLoading || isBalanceRefetching;
  const historyItems = useMemo<WalletHistoryItem[]>(() => {
    const productPriceMap = new Map<string, string>();

    Object.values(offerings?.all ?? {}).forEach((offering) => {
      offering.availablePackages.forEach((pkg) => {
        productPriceMap.set(pkg.product.identifier, pkg.product.priceString);
      });
    });

    const revenueCatPurchases =
      customerInfo?.nonSubscriptionTransactions.map((transaction) => ({
        id: `rc-${transaction.transactionIdentifier}`,
        kind: 'purchase' as const,
        amount: inferAmountFromProductIdentifier(transaction.productIdentifier),
        createdAt: transaction.purchaseDate,
        title: 'Purchased credits',
        subtitle: formatProductIdentifier(transaction.productIdentifier),
        amountLabel: productPriceMap.get(transaction.productIdentifier) ?? null,
      })) ?? [];

    const appTransactions =
      tokenTransactions
        ?.filter((transaction) => transaction.kind !== 'purchase')
        .map<WalletHistoryItem>((transaction) => ({
          id: transaction.id,
          kind: transaction.kind === 'refund' ? 'refund' : 'spend',
          amount: transaction.amount ?? 0,
          createdAt: transaction.created_at ?? new Date(0).toISOString(),
          title:
            typeof transaction.meta === 'object' &&
            transaction.meta &&
            'eventTitle' in transaction.meta &&
            typeof transaction.meta.eventTitle === 'string'
              ? transaction.meta.eventTitle
              : transaction.kind,
          subtitle:
            typeof transaction.meta === 'object' &&
            transaction.meta &&
            'type' in transaction.meta &&
            typeof transaction.meta.type === 'string'
              ? transaction.meta.type === 'event_rsvp_free'
                ? 'Joined free event'
                : transaction.meta.type === 'event_rsvp'
                  ? 'RSVP confirmed'
                  : transaction.meta.type === 'event_rsvp_refund'
                    ? 'RSVP refunded'
                    : null
              : null,
          amountLabel: null,
        })) ?? [];

    return [...revenueCatPurchases, ...appTransactions].sort(
      (left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
    );
  }, [customerInfo?.nonSubscriptionTransactions, offerings, tokenTransactions]);

  const errorMessage = error;

  return (
    <Flex flex className="bg-background-dark p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex gap={6}>
          <Box className="h-32 rounded-lg bg-background-900">
            <Flex className="px-4 pt-6" gap={2}>
              <Text size="lg">CURRENT BALANCE</Text>
              {!isBalanceLoading ? (
                <Flex direction="row" gap={2} align="center">
                  <Text size="5xl" bold>
                    {virtualCurrency?.balance ?? 0}
                  </Text>
                  <Text size="2xl">Credits</Text>
                </Flex>
              ) : (
                <Text>Loading...</Text>
              )}
            </Flex>
          </Box>
          <Button
            size="xl"
            className="rounded-xl"
            onPress={handleOpenTokensPaywall}
            disabled={!initialized || loadingOfferings}>
            <Text size="xl" bold>
              {loadingOfferings ? 'Loading Store...' : 'Add Credits'}
            </Text>
          </Button>
          {errorMessage && (
            <Text className="text-error-400" size="sm">
              {errorMessage}
            </Text>
          )}
          <Flex gap={4}>
            <Text size="2xl" bold>
              Transaction History
            </Text>
            {!isTransactionsLoading ? (
              <>
                {historyItems.length ? (
                  <>
                    {historyItems.map((transaction) => {
                      const isSpend =
                        transaction.kind === 'spend' ||
                        (typeof transaction.amount === 'number' && transaction.amount < 0);
                      const isRefund = transaction.kind === 'refund';
                      const isPurchase = transaction.kind === 'purchase';
                      const amount = transaction.amount ?? 0;
                      const formattedAmount = transaction.amountLabel
                        ? transaction.amountLabel
                        : transaction.amount == null
                          ? 'Purchased'
                          : amount > 0
                            ? `+${amount}`
                            : amount < 0
                              ? `${amount}`
                              : '0';
                      return (
                        <Flex
                          key={transaction.id}
                          direction="row"
                          align="center"
                          className="rounded-xl bg-background-900 p-4">
                          {isSpend ? (
                            <Box className="mr-4 rounded-full bg-red-300 p-3">
                              <Minus color={'#ef4444'} size={24} />
                            </Box>
                          ) : isRefund ? (
                            <Box className="mr-4 rounded-full bg-yellow-200 p-3">
                              <ArrowRight color={'#ca8a04'} size={24} />
                            </Box>
                          ) : (
                            <Box className="mr-4 rounded-full bg-green-300 p-3">
                              <Plus color={'#16a34a'} size={24} />
                            </Box>
                          )}
                          <Flex className="w-2/3">
                            <Text>{transaction.title}</Text>
                            {transaction.subtitle ? <Text>{transaction.subtitle}</Text> : null}
                            <Text>{dayjs(transaction.createdAt).format('ddd MMMM DD, YYYY')}</Text>
                          </Flex>
                          <Text
                            size="xl"
                            className={
                              isPurchase
                                ? 'text-green-500'
                                : isRefund
                                  ? 'text-yellow-600'
                                  : isSpend
                                    ? 'text-red-500'
                                    : 'text-green-500'
                            }
                            weight="600">
                            {formattedAmount}
                          </Text>
                        </Flex>
                      );
                    })}
                  </>
                ) : (
                  <Text>No transactions</Text>
                )}
              </>
            ) : (
              <Text>Loading...</Text>
            )}
          </Flex>
        </Flex>
      </ScrollView>
    </Flex>
  );
}
