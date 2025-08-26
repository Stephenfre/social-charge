import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthForm } from '~/components';
import { Button, Flex, Text, Divider } from '~/components/ui';

import { supabase } from '~/lib/supabase';
import { Alert } from 'react-native';
import { useSignupWizard } from '~/hooks/useSignupWizard';

export function SignInScreen() {
  const { email, password, reset } = useSignupWizard();

  const onSignIm = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // TODO: change from native Alert to alert message
    if (error) Alert.alert(error.message);
    if (!error) reset();
  };
  return (
    <SafeAreaView className="p-4">
      <Flex direction="column" align="center" className=" h-full" gap={5}>
        <Text size="4xl" bold>
          Welcome Back
        </Text>
        <Flex direction="column" justify="center" className="w-full  p-4" gap={6}>
          <Flex direction="column" align="center" gap={4}>
            <Button className="h-14 w-full bg-black">
              {/* <FontAwesome name="apple" size={24} color="white" /> */}
              <Text size="lg" weight="600" className="text-white">
                Continue with Apple
              </Text>
            </Button>
            <Button className="h-14 w-full bg-black">
              {/* <FontAwesome name="google" size={24} color="white" /> */}
              <Text size="lg" weight="600" className="text-white">
                Continue with Google
              </Text>
            </Button>
            <Button className="h-14 w-full bg-black">
              {/* <FontAwesome name="facebook" size={24} color="white" /> */}
              <Text size="lg" weight="600" className="text-white">
                Continue with Facebook
              </Text>
            </Button>
            <Flex align="center" justify="center" className="w-44">
              <Divider />
              <Text className="px-4">OR</Text>
              <Divider />
            </Flex>
            <AuthForm onNavigate={onSignIm} />
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
