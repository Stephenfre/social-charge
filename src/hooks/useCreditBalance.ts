import { useMemo } from 'react';

import { useRevenueCat } from '~/providers/RevenueCatProvider';
import { useRevenueCatVirtualCurrency } from './useRevenueCatVirtualCurrency';
import { useTokenBalance, useTokenTransactions } from './useTokens';

const inferAmountFromProductIdentifier = (productIdentifier: string): number | null => {
  const matches = productIdentifier.match(/\d+/g);
  if (!matches?.length) {
    return null;
  }

  const amount = Number(matches[matches.length - 1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const getAppTransactionDelta = (
  transactions: ReturnType<typeof useTokenTransactions>['data'] | undefined
) =>
  (transactions ?? []).reduce((total, transaction) => {
    const amount = Math.abs(transaction.amount ?? 0);

    if (transaction.kind === 'spend') {
      return total - amount;
    }

    if (transaction.kind === 'refund') {
      return total + amount;
    }

    return total;
  }, 0);

export function useCreditBalance() {
  const { customerInfo, refreshCustomerInfo } = useRevenueCat();
  const virtualCurrencyQuery = useRevenueCatVirtualCurrency();
  const tokenBalanceQuery = useTokenBalance();
  const tokenTransactionsQuery = useTokenTransactions();

  const balance = useMemo(() => {
    const purchaseAmounts =
      customerInfo?.nonSubscriptionTransactions.map((transaction) =>
        inferAmountFromProductIdentifier(transaction.productIdentifier)
      ) ?? [];
    const purchaseBalance =
      purchaseAmounts.length > 0 && purchaseAmounts.every((amount) => amount !== null)
        ? purchaseAmounts.reduce((total, amount) => total + (amount ?? 0), 0)
        : null;
    const virtualCurrencyBalance =
      typeof virtualCurrencyQuery.data?.balance === 'number'
        ? virtualCurrencyQuery.data.balance
        : null;
    const transactionDelta = getAppTransactionDelta(tokenTransactionsQuery.data);
    const balanceCandidates = [
      virtualCurrencyBalance,
      tokenBalanceQuery.data == null ? null : tokenBalanceQuery.data,
      purchaseBalance == null ? null : purchaseBalance + transactionDelta,
    ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    return Math.max(0, ...balanceCandidates);
  }, [
    customerInfo?.nonSubscriptionTransactions,
    tokenBalanceQuery.data,
    tokenTransactionsQuery.data,
    virtualCurrencyQuery.data?.balance,
  ]);

  const hasBalanceSource =
    virtualCurrencyQuery.data?.balance != null ||
    tokenBalanceQuery.data != null ||
    customerInfo != null;
  const isLoading =
    tokenTransactionsQuery.isLoading ||
    ((virtualCurrencyQuery.isLoading || tokenBalanceQuery.isLoading) && !hasBalanceSource);

  const isRefetching =
    virtualCurrencyQuery.isRefetching ||
    tokenBalanceQuery.isRefetching ||
    tokenTransactionsQuery.isRefetching;

  const refetch = async () => {
    await Promise.all([
      refreshCustomerInfo(),
      virtualCurrencyQuery.refetch(),
      tokenBalanceQuery.refetch(),
      tokenTransactionsQuery.refetch(),
    ]);
  };

  return {
    balance,
    isLoading,
    isRefetching,
    refetch,
    tokenTransactionsQuery,
    tokenBalanceQuery,
    virtualCurrencyQuery,
  };
}
