import { Button } from '~/components/ui/button';
import { Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { SvgUri } from 'react-native-svg';

const logoAsset = Asset.fromModule(require('../../assets/sc_logo.svg'));

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp<'Welcome'>>();
  return (
    <SafeAreaView className="bg-background-dark">
      <Flex direction="column" align="center" justify="space-between" className=" h-full" gap={5}>
        <Flex className="mt-24 items-center justify-center">
          <SvgUri uri={logoAsset.uri} width={200} height={200} />
        </Flex>
        <Flex direction="column" justify="center" className="w-full  p-4" gap={6}>
          <Flex direction="column" justify="center" align="flex-start">
            <Text size="6xl" weight="600">
              Charge up your social life!
            </Text>
            <Text size="xl">Discover, share, and join events near you.</Text>
          </Flex>
          <Flex direction="column" align="center" gap={4}>
            <Button
              className="h-14 w-full rounded-xl bg-primary"
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
