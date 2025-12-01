import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { AppleOauth, AuthForm } from '~/components';
import { Divider, Flex, Pressable, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { ArrowLeft } from 'lucide-react-native';

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<'Register'>>();

  const onNext = () => {
    navigation.navigate('RegisterUserName');
  };

  const socialButtons = [
    { id: 'google', label: 'Google', accent: '#EA4335' },
    { id: 'facebook', label: 'Facebook', accent: '#1877F2' },
  ];

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
              submitButtonLabel="Create Account"
              buttonClassName="rounded-xl bg-secondary-500"
              inputSize="xl"
              inputClassName="rounded-xl border-background-100 bg-white"
            />

            <Flex direction="row" align="center" className="my-6 w-full">
              <Divider className="flex-1" />
              <Text className="px-4 text-typography-light">Or, Sign up with</Text>
              <Divider className="flex-1" />
            </Flex>

            <Flex gap={4}>
              <AppleOauth />
              {socialButtons.map((provider) => (
                <Pressable
                  key={provider.id}
                  className="w-full flex-row items-center justify-center rounded-xl border border-background-100 bg-white py-4"
                  onPress={() => Alert.alert(provider.label, 'Coming soon')}>
                  <Text bold className="mr-2 text-lg" style={{ color: provider.accent }}>
                    {provider.label.charAt(0)}
                  </Text>

                  <Text bold className="text-base text-typography-dark">
                    {provider.label}
                  </Text>
                </Pressable>
              ))}
            </Flex>
          </Flex>

          <Flex align="center" className="pb-4">
            <Text className="text-typography-light">
              Already have an account?{' '}
              <Text
                bold
                className="text-secondary-500"
                onPress={() => navigation.navigate('SignIn')}>
                Login.
              </Text>
            </Text>
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
