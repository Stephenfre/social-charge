import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthForm } from '~/components';
import { Divider, Flex, Pressable, Text } from '~/components/ui';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '~/lib/supabase';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { NavigationProp } from '~/types/navigation';

export function SignInScreen() {
  const { reset } = useSignupWizard();
  const navigation = useNavigation<NavigationProp<'SignIn'>>();

  const onSignIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // TODO: change from native Alert to alert message
    if (error) Alert.alert(error.message);
    if (!error) reset();
  };

  const handleForgotPassword = () =>
    Alert.alert('Forgot Password', 'Password reset will be available soon.');

  const socialButtons = [
    { id: 'google', label: 'Google', accent: '#EA4335' },
    { id: 'facebook', label: 'Facebook', accent: '#1877F2' },
  ];

  const inputClassName =
    'relative rounded-xl border border-background-500 bg-transparent px-2 py-1 data-[focus=true]:border-primary/50 overflow-visible';
  const floatingLabelWrapperClass = '-top-0.5';
  const floatingLabelTextClass = 'pointer-events-none bg-background-dark px-1 text-xs';
  const inputFieldClassName =
    'text-typography-light placeholder:text-typography-light/60 bg-background-dark text-base placeholder:text-base pb-1';

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
                Login
              </Text>
              <Text className="text-typography-light">
                Enter your email and password to log in.
              </Text>
            </Flex>

            <AuthForm
              onNavigate={onSignIn}
              showFieldLabels
              floatingLabel
              submitButtonLabel="Continue"
              buttonClassName="rounded-xl bg-primary-500"
              inputSize="3xl"
              inputClassName={inputClassName}
              inputFieldClassName={inputFieldClassName}
              floatingLabelWrapperClassName={floatingLabelWrapperClass}
              floatingLabelTextClassName={floatingLabelTextClass}
              floatingLabelActiveTextClassName="text-primary-500"
              // afterFields={
              //   <Flex className="w-full items-end">
              //     <Pressable onPress={handleForgotPassword}>
              //       <Text size="sm" bold className="text-primary-600">
              //         Forgot Password?
              //       </Text>
              //     </Pressable>
              //   </Flex>
              // }
            />
            {/* 
            <Flex direction="row" align="center" className="my-6 w-full">
              <Divider className="flex-1" />
              <Text className="px-4 text-typography-light">Or, Login with</Text>
              <Divider className="flex-1" />
            </Flex>

            <Flex gap={4}>
              {socialButtons.map((provider) => (
                <Pressable
                  key={provider.id}
                  className="w-full flex-row items-center justify-center rounded-2xl border border-background-100 bg-white py-4"
                  onPress={() => Alert.alert(provider.label, 'Coming soon')}>
                  <Text bold className="mr-2 text-lg text-typography-dark">
                    {provider.label.charAt(0)}
                  </Text>
                  <Text bold className="text-base text-typography-dark">
                    {provider.label}
                  </Text>
                </Pressable>
              ))}
            </Flex> */}
          </Flex>

          <Flex align="center" className="pb-4">
            <Text className="text-typography-light">
              Don&apos;t have an account?{' '}
              <Text
                bold
                className="text-primary-600"
                onPress={() => navigation.navigate('Register')}>
                Register.
              </Text>
            </Text>
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
