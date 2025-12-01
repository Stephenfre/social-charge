import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { Alert } from 'react-native';
import dayjs from 'dayjs';

import { ChevronRight } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { INTEREST_CATEGORIES } from '~/constants/interests';
import { useSignUp } from '~/hooks';
import { categoryEmojis, interestEmojis } from '~/utils/const';
import { useAuth } from '~/providers/AuthProvider';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const signUp = useSignUp();
  const { user, refreshUser } = useAuth();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
      return;
    }

    if (selectedInterests.length === 5) return;
    setSelectedInterests((prev) => [...prev, interest]);
  };

  const {
    email,
    password,
    firstName,
    lastName,
    city,
    state,
    country,
    birthDate,
    profileImageUri,
    reset,
  } = useSignupWizard();

  const [month, day, year] = birthDate?.split('/').map(Number) || [];
  const birthDateObj = dayjs(`${year}-${month}-${day}`);
  const getAge = dayjs().diff(birthDateObj, 'year');

  useEffect(() => {
    if (!pendingUserId || !user || user.id !== pendingUserId) return;

    if (user.onboarded === false) {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingStart' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Root' }] });
    }

    setPendingUserId(null);
  }, [navigation, pendingUserId, user]);

  const onFinish = async (skip: boolean) => {
    signUp.mutate(
      {
        email,
        password,
        firstName,
        lastName,
        city,
        state,
        country,
        birthDate,
        age: getAge,
        profileImageUri,
        selectedInterests,
        skipInterests: skip,
      },
      {
        onSuccess: async ({ needsEmailConfirm, userId }) => {
          reset();
          if (needsEmailConfirm) {
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            return;
          }

          if (userId) {
            setPendingUserId(userId);
            await refreshUser();
          }
        },
        onError: async (err: any) => {
          // sign out on failure to keep state clean (mirrors your original)
          try {
            await supabase.auth.signOut();
          } catch {}
          Alert.alert(err?.message ?? 'An unexpected error occurred. Please try again.');
          console.error('Signup error:', err);
        },
      }
    );
  };

  return (
    <SafeAreaView className="h-full bg-background-dark px-4">
      <Flex flex={1} direction="column" justify="space-between">
        <Flex flex={1} justify="center" gap={10}>
          <Flex direction="column" align="center" gap={2}>
            <Text size="4xl" bold>
              Choose 5 things worth showing up for
            </Text>
            <Text>Choose what excites you and meet people who feel the same.</Text>
          </Flex>
          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <Flex key={category} direction="column" gap={2}>
              <Text size="lg" bold className="capitalize">
                {categoryEmojis[category as keyof typeof categoryEmojis]} {category}
              </Text>
              <Flex direction="row" gap={2} wrap="wrap">
                {interests.map((interest: string) => (
                  <Button
                    key={interest}
                    variant="outline"
                    className={`rounded-xl ${selectedInterests.includes(interest) && 'bg-white'}`}
                    onPress={() => handleSelectInterest(interest)}
                    disabled={
                      !selectedInterests.includes(interest) && selectedInterests.length === 5
                    }>
                    <Text className={`${selectedInterests.includes(interest) && 'text-black'}`}>
                      {interestEmojis[interest]} {interest}
                    </Text>
                  </Button>
                ))}
              </Flex>
            </Flex>
          ))}
        </Flex>
        <Flex direction="row" justify="space-between" align="center">
          <Button variant="link" onPress={() => onFinish(true)}>
            <Text>Skip</Text>
          </Button>
          <Flex direction="row" align="center" gap={4}>
            <Text weight="500">Selected {selectedInterests.length}/5</Text>
            <Button
              size="lg"
              disabled={selectedInterests.length < 5}
              className={cn(
                'h-16 w-16 rounded-full',
                selectedInterests.length < 5 && 'bg-gray-400'
              )}
              onPress={() => onFinish(false)}>
              <ChevronRight size={35} color="white" />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
