import { SafeAreaView } from 'react-native';
import { Button } from '~/components/ui/button';
import { Box, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp<'Welcome'>>();
  return (
    <SafeAreaView>
      <Flex direction="column" align="center" justify="space-between" className=" h-full" gap={5}>
        <Box className="mt-24 h-20 w-20 rounded-full bg-gray-400">
          <Text className="m-auto text-center">LOGO HERE</Text>
        </Box>
        <Flex direction="column" justify="center" className="w-full  p-4" gap={6}>
          <Flex direction="column" justify="center" align="flex-start">
            <Text size="6xl" weight="600" className=" text-h">
              Charge up your social life!
            </Text>
            <Text size="xl" className=" text-black">
              Discover, share, and join events near you.
            </Text>
          </Flex>
          <Flex direction="column" align="center" gap={4}>
            <Button
              className="h-14 w-full bg-black"
              onPress={() => navigation.navigate('Register')}>
              <Text className="text-white" weight="600">
                Get Started
              </Text>
            </Button>
            <Flex align="center" gap={1}>
              <Text>Have an account already?</Text>
              <Button variant="link" onPress={() => navigation.navigate('SignIn')}>
                <Text bold>Login</Text>
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
