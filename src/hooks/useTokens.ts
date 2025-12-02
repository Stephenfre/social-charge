import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import type { Database } from '~/types/database.types';

export type TokenTransactionKind = 'purchase' | 'spend' | 'refund';

type TokenLedgerRow = Database['public']['Tables']['token_ledger']['Row'];
type TokenMeta = TokenLedgerRow['meta'];

export type TokenTransaction = {
  id: TokenLedgerRow['id'];
  user_id: TokenLedgerRow['user_id'];
  kind: TokenTransactionKind;
  amount: number;
  meta: TokenLedgerRow['meta'];
  created_at: TokenLedgerRow['created_at'];
};

export const TOKEN_QUERY_KEYS = {
  balance: (userId: string | undefined) => ['token-balance', userId] as const,
  transactions: (userId: string | undefined) => ['token-transactions', userId] as const,
};

type RpcName = keyof Database['public']['Functions'];
type RpcArgs<Name extends RpcName> = Database['public']['Functions'][Name]['Args'];
type RpcResult<Name extends RpcName> = Database['public']['Functions'][Name]['Returns'];

async function rpc<Name extends RpcName>(
  fn: Name,
  params?: RpcArgs<Name>
): Promise<RpcResult<Name>> {
  const { data, error } = await supabase.rpc<RpcResult<Name>, RpcArgs<Name>>(
    fn,
    // For RPCs with Args: never Supabase still accepts undefined here.
    params as RpcArgs<Name>
  );
  if (error) throw new Error(error.message);
  return data as RpcResult<Name>;
}

export function useTokenBalance() {
  const { userId } = useAuth();

  return useQuery<number>({
    queryKey: TOKEN_QUERY_KEYS.balance(userId ?? undefined),
    enabled: !!userId,
    queryFn: async () => {
      const result = await rpc('get_my_token_balance');
      return typeof result === 'string' ? Number(result) : Number(result ?? 0);
    },
  });
}

type TokenTransactionRow = Database['public']['Tables']['token_transactions']['Row'];

async function fetchTransactions(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('id,user_id,kind,amount,meta,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as TokenTransactionRow[];
}

export function useTokenTransactions(limit = 100) {
  const { userId } = useAuth();

  return useQuery<TokenTransactionRow[]>({
    queryKey: ['token-transactions', userId, limit],
    enabled: !!userId,
    queryFn: () => fetchTransactions(userId!, limit),
  });
}

type PurchaseInput = { amount: number; meta?: TokenMeta };
type SpendInput = { eventId?: string; amount: number; meta?: TokenMeta };
type RefundInput = { eventId?: string; amount: number; meta?: TokenMeta };

export function usePurchaseTokens() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, meta }: PurchaseInput) => {
      if (!userId) throw new Error('Not authenticated');
      if (amount <= 0) throw new Error('Amount must be > 0');

      return rpc('purchase_tokens', { p_amount: amount, p_meta: meta ?? {} });
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.balance(userId) });
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.transactions(userId) });
    },
  });
}

export function useSpendTokens() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, amount, meta }: SpendInput) => {
      if (!userId) throw new Error('Not authenticated');
      if (amount <= 0) throw new Error('Amount must be > 0');

      return rpc('spend_tokens', {
        p_event_id: eventId!,
        p_amount: amount,
        p_meta: meta ?? {},
      });
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.balance(userId) });
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.transactions(userId) });
    },
  });
}

export function useRefundTokens() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, amount, meta }: RefundInput) => {
      if (!userId) throw new Error('Not authenticated');
      if (amount <= 0) throw new Error('Amount must be > 0');

      return rpc('refund_tokens', {
        p_event_id: eventId!,
        p_amount: amount,
        p_meta: meta ?? {},
      });
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.balance(userId) });
      qc.invalidateQueries({ queryKey: TOKEN_QUERY_KEYS.transactions(userId) });
    },
  });
}

export function useHasTokens(min = 1) {
  const { data: balance, isLoading } = useTokenBalance();
  const ok = useMemo(() => (balance ?? 0) >= min, [balance, min]);
  return { ok, isLoading, balance: balance ?? 0 };
}
