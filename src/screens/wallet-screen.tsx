import { useCallback } from 'react';
import dayjs from 'dayjs';
import { ArrowRight, Minus, Plus } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { Box, Button, Flex, Text } from '~/components/ui';
import { useTokenBalance, useTokenTransactions } from '~/hooks';
import { useRevenueCat } from '~/providers/RevenueCatProvider';

export function WalletScreen() {
  const { initialized, loadingOfferings, error, presentPlacementPaywall } = useRevenueCat();
  const {
    data: balance,
    isLoading: isBalanceInitialLoading,
    isRefetching: isBalanceRefetching,
  } = useTokenBalance();

  const { data: tokenTransactions, isLoading: isTransactionsLoading } = useTokenTransactions();
  const handleOpenTokensPaywall = useCallback(async () => {
    if (!initialized || loadingOfferings) {
      return;
    }

    await presentPlacementPaywall('battery_pack_purchase');
  }, [initialized, loadingOfferings, presentPlacementPaywall]);

  const isBalanceLoading = isBalanceInitialLoading || isBalanceRefetching;

  const errorMessage = error;

  return (
    <Flex flex className="bg-background-dark p-4">
      <ScrollView>
        <Flex gap={6}>
          <Box className="h-32 rounded-lg bg-background-900">
            <Flex className="px-4 pt-6" gap={2}>
              <Text size="lg">CURRENT BALANCE</Text>
              {!isBalanceLoading ? (
                <Flex direction="row" gap={2} align="center">
                  <Text size="5xl" bold>
                    {balance ?? 0}
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
                {tokenTransactions?.length ? (
                  <>
                    {tokenTransactions?.map((transaction) => {
                      const isSpend = transaction.kind === 'spend' || transaction.amount < 0;
                      const isRefund = transaction.kind === 'refund';
                      const amount = transaction.amount ?? 0;
                      const formattedAmount =
                        amount > 0 ? `+${amount}` : amount < 0 ? `${amount}` : '0';
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
                            <Text>{transaction.kind}</Text>
                            <Text>{dayjs(transaction.created_at).format('ddd MMMM DD, YYYY')}</Text>
                          </Flex>
                          <Text
                            size="xl"
                            className={
                              isRefund
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
