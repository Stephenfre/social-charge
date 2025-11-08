import { useCallback, useMemo, useRef, useState } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { Box, Button, Flex, Pressable, Text } from '~/components/ui';
import { usePurchaseTokens, useTokenBalance, useTokenTransactions } from '~/hooks';
import { useTheme } from '~/providers/ThemeProvider';

export function WalletScreen() {
  const { palette } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedAmount, setSelectedAmount] = useState(10);
  const {
    data: balance,
    isLoading: isBalanceInitialLoading,
    isRefetching: isBalanceRefetching,
  } = useTokenBalance();

  const { data: tokenTransactions, isLoading: isTransactionsLoading } = useTokenTransactions();
  const purchaseTokens = usePurchaseTokens();
  const minAmount = 5;
  const step = 5;

  const snapPoints = useMemo(() => ['35%'], []);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [palette.overlay]
  );

  const handleOpenAmountPicker = () => {
    if (purchaseTokens.isPending) return;
    bottomSheetRef.current?.present();
  };

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleDecrease = () => {
    if (purchaseTokens.isPending) return;
    setSelectedAmount((prev) => Math.max(minAmount, prev - step));
  };

  const handleIncrease = () => {
    if (purchaseTokens.isPending) return;
    setSelectedAmount((prev) => prev + step);
  };

  const handleConfirmPurchase = () => {
    if (purchaseTokens.isPending) return;
    const amount = selectedAmount;
    purchaseTokens.mutate(
      {
        amount,
        meta: { source: 'wallet_screen_add_button', selectedAmount: amount },
      },
      {
        onSuccess: () => {
          setSelectedAmount(amount);
          handleCloseSheet();
        },
      }
    );
  };

  const isBalanceLoading =
    isBalanceInitialLoading || isBalanceRefetching || purchaseTokens.isPending;

  const errorMessage = purchaseTokens.error instanceof Error ? purchaseTokens.error.message : null;

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
            onPress={handleOpenAmountPicker}
            disabled={purchaseTokens.isPending}>
            <Text size="xl" bold>
              {purchaseTokens.isPending ? 'Adding Credits...' : 'Add Credits'}
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
                            className={isSpend ? 'text-red-500' : 'text-green-500'}
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
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: '#0F1012',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{ backgroundColor: '#6B7280' }}>
        <BottomSheetView style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Flex gap={6}>
            <Text size="lg" bold>
              Choose credit amount
            </Text>
            <Flex direction="row" align="center" justify="center" gap={6}>
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.surfaceMuted }}
                disabled={selectedAmount <= minAmount || purchaseTokens.isPending}
                onPress={handleDecrease}>
                <Minus color={palette.text} size={24} />
              </Pressable>
              <Flex align="center">
                <Text size="5xl" bold>
                  {selectedAmount}
                </Text>
                <Text size="sm">Credits</Text>
              </Flex>
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.surface }}
                disabled={purchaseTokens.isPending}
                onPress={handleIncrease}>
                <Plus color={palette.text} size={24} />
              </Pressable>
            </Flex>
            <Button
              size="lg"
              className="rounded-xl"
              onPress={handleConfirmPurchase}
              disabled={purchaseTokens.isPending}>
              <Text size="lg" bold>
                {purchaseTokens.isPending ? 'Adding Credits...' : `Add ${selectedAmount} Credits`}
              </Text>
            </Button>
          </Flex>
        </BottomSheetView>
      </BottomSheetModal>
    </Flex>
  );
}
