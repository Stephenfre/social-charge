import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { Box, Button, Flex, Text } from '~/components/ui';
import { useMyTokenBalance, useTokenTransactionsByUserId } from '~/hooks';

export function WalletScreen() {
  const { data: tokens, isLoading: Loadingtokens } = useMyTokenBalance();
  const { data: tokenTransactions, isLoading: loadingTokenTransactions } =
    useTokenTransactionsByUserId();

  return (
    <Flex flex className="bg-background-dark p-4">
      <ScrollView>
        <Flex gap={6}>
          <Box className="h-32 rounded-lg bg-background-900">
            <Flex className="px-4 pt-6" gap={2}>
              <Text size="lg">CURRENT BALANCE</Text>
              {!Loadingtokens ? (
                <Flex direction="row" gap={2} align="center">
                  <Text size="5xl" bold>
                    {tokens ? tokens : 0}
                  </Text>
                  <Text size="2xl">Credits</Text>
                </Flex>
              ) : (
                <Text>Loading...</Text>
              )}
            </Flex>
          </Box>
          <Button size="xl" className="rounded-xl">
            <Text size="xl" bold>
              Buy Credits
            </Text>
          </Button>
          <Flex gap={4}>
            <Text size="2xl" bold>
              Transaction History
            </Text>
            {!loadingTokenTransactions ? (
              <>
                {tokenTransactions?.length ? (
                  <>
                    {tokenTransactions?.map((transaction) => {
                      return (
                        <Flex
                          key={transaction.id}
                          direction="row"
                          align="center"
                          className="rounded-xl bg-background-900 p-4">
                          {transaction.kind === 'spend' ? (
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
                          <Text size="xl" className="text-green-500" weight="600">
                            {transaction.amount}
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
