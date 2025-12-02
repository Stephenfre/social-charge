import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';

import { cn } from '~/utils/cn';
import { INTEREST_CATEGORIES } from '~/constants/interests';
import { categoryEmojis, interestEmojis } from '~/utils/const';
import { useAuth } from '~/providers/AuthProvider';
import { Constants, Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { userId } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
      return;
    }

    if (selectedInterests.length === 5) return;
    setSelectedInterests((prev) => [...prev, interest]);
  };

  const validInterests = useMemo(
    () => Constants.public.Enums.interest as readonly Enums<'interest'>[],
    []
  );
  const isInterest = useCallback(
    (interest: string): interest is Enums<'interest'> =>
      validInterests.includes(interest as Enums<'interest'>),
    [validInterests]
  );

  const onFinish = async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      await supabase.from('user_interests').delete().eq('user_id', userId);
      if (selectedInterests.length) {
        const payload = selectedInterests
          .filter(isInterest)
          .map((interest) => ({ user_id: userId, interest }));
        if (payload.length) {
          await supabase.from('user_interests').insert(payload);
        }
      }
      navigation.navigate('OnboardingBudget');
    } catch (error) {
      Alert.alert('Something went wrong', 'Unable to save your interests right now.');
      console.error('Failed to save interests', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="h-full bg-background-dark px-4">
      <Flex flex={1} direction="column" justify="space-between">
        <Flex gap={3} className="pt-4">
          <OnboardingProgress currentStep={3} totalSteps={5} />
          <Text size="4xl" bold>
            Choose 5 things worth showing up for
          </Text>
          <Text>Choose what excites you and meet people who feel the same.</Text>
        </Flex>
        <Flex flex={1} justify="center" gap={10}>
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
          <Flex direction="row" align="center" gap={4}>
            <Button
              size="xl"
              className={cn(
                'h-14 w-full rounded-xl bg-secondary-500',
                selectedInterests.length < 5 && 'bg-background-500'
              )}
              disabled={selectedInterests.length < 5}
              onPress={onFinish}>
              <Text size="lg" weight="600" className="text-white">
                Next
              </Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
