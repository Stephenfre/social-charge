import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { AppleOauth, AuthForm } from '~/components';
import { Flex, Text, Divider } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<'Register'>>();

  const onNext = () => {
    navigation.navigate('RegisterUserName');
  };

  return (
    <SafeAreaView className=" h-full bg-background-dark px-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Flex
          flex={1}
          direction="column"
          justify="center"
          align="center"
          className=" h-full"
          gap={5}>
          <Flex direction="column" className="mt-4">
            <Text size="4xl" bold>
              Join Social Charge
            </Text>
            <Text>Find your vibe and the people who share it.</Text>
          </Flex>
          <Flex direction="column" align="center" justify="center" className="w-full  p-4" gap={6}>
            <AppleOauth />
            {/* <Button className="h-14 w-full bg-black">
                <FontAwesome name="apple" size={24} color="white" />
                <Text size="lg" weight="600" className="text-white">
                  Sign Up with Apple
                </Text>
              </Button> */}
            {/* <Button className="h-14 w-full bg-black">
                <FontAwesome name="google" size={24} color="white" />
                <Text size="lg" weight="600" className="text-white">
                  Sign Up with Google
                </Text>
              </Button>
              <Button className="h-14 w-full bg-black">
                <FontAwesome name="facebook" size={24} color="white" />
                <Text size="lg" weight="600" className="text-white">
                  Sign Up with Facebook
                </Text>
              </Button> */}
            <Flex direction="row" align="center" justify="center" className="mt-6 w-44">
              <Divider />
              <Text className="px-4">OR</Text>
              <Divider />
            </Flex>
            <AuthForm onNavigate={onNext} from={'register'} />
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
