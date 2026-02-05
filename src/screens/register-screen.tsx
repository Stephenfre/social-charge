import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { AppleOauth, AuthForm } from '~/components';
import { GoogleSignInButton } from '~/components/GoogleSignInButton';
import { Divider, Flex, Pressable, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { ArrowLeft } from 'lucide-react-native';

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<'Register'>>();

  const onNext = () => {
    navigation.navigate('RegisterUserName');
  };

  const inputClassName =
    'relative rounded-xl border border-background-500 bg-transparent px-2 py-1 data-[focus=true]:border-primary/50 overflow-visible';
  const floatingLabelWrapperClass = '-top-0.5';
  const floatingLabelTextClass = 'pointer-events-none bg-background-dark px-1 text-xs';
  const inputFieldClassName =
    'text-typography-light placeholder:text-typography-light/60 bg-background-dark text-base placeholder:text-base pb-1';

  // TODO: Reset form after signin

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <Flex flex={1} justify="space-between" className="px-6 py-4">
          <Flex gap={6}>
            <Pressable onPress={() => navigation.goBack()} className="mt-2">
              <ArrowLeft size={18} color="#FFFFFF" />
            </Pressable>

            <Flex gap={2}>
              <Text size="4xl" bold className="text-typography-light">
                Create Account
              </Text>
              <Text className="text-typography-light">
                Find your vibe and the people who share it.
              </Text>
            </Flex>

            <AuthForm
              onNavigate={onNext}
              from="register"
              showFieldLabels
              floatingLabel
              submitButtonLabel="Create Account"
              buttonClassName="rounded-xl bg-primary-500"
              inputSize="3xl"
              inputClassName={inputClassName}
              inputFieldClassName={inputFieldClassName}
              floatingLabelWrapperClassName={floatingLabelWrapperClass}
              floatingLabelTextClassName={floatingLabelTextClass}
              floatingLabelActiveTextClassName="text-primary-500"
            />

            <Flex direction="row" align="center" className="my-6 w-full">
              <Divider className="flex-1" />
              <Text className="px-4 text-typography-light">Or, Sign up with</Text>
              <Divider className="flex-1" />
            </Flex>

            <Flex gap={4}>
              {/* <AppleOauth /> */}
              <GoogleSignInButton />
            </Flex>
          </Flex>

          <Flex align="center" className="pb-4">
            <Text className="text-typography-light">
              Already have an account?{' '}
              <Text bold className="text-primary-500" onPress={() => navigation.navigate('SignIn')}>
                Login.
              </Text>
            </Text>
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
