import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Text } from '~/components/ui';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';

import { cn } from '~/utils/cn';
import { INTEREST_CATEGORIES } from '~/constants/interests';
import { categoryEmojis, interestEmojis } from '~/utils/const';
import { useAuth } from '~/providers/AuthProvider';
import { Constants, Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';
import { RootRoute } from '~/types/navigation.types';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { userId } = useAuth();
  const [saving, setSaving] = useState(false);
  const route = useRoute<RootRoute<'Interest'>>();
  const editMode = route.params?.editMode ?? false;
  const returnToSettings = route.params?.returnToSettings ?? false;
  const [prefillLoading, setPrefillLoading] = useState(editMode);

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
      return;
    }

    if (selectedInterests.length >= 5) {
      Alert.alert('Limit reached', 'Remove one interest before selecting another.');
      return;
    }

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

  useEffect(() => {
    if (!editMode) return;
    if (!userId) {
      setPrefillLoading(false);
      return;
    }
    let isMounted = true;
    const loadInterests = async () => {
      setPrefillLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_interests')
          .select('interest')
          .eq('user_id', userId);
        if (!isMounted) return;
        if (!error && data) {
          const existing = data
            .map((row) => row.interest)
            .filter((interest): interest is string => Boolean(interest) && isInterest(interest));
          if (existing.length) {
            setSelectedInterests(existing.slice(0, 5));
          }
        }
      } catch (error) {
        console.error('Failed to load interests', error);
      } finally {
        if (isMounted) {
          setPrefillLoading(false);
        }
      }
    };
    loadInterests();
    return () => {
      isMounted = false;
    };
  }, [editMode, isInterest, userId]);

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
      const nextParams = editMode || returnToSettings ? { editMode, returnToSettings } : undefined;
      navigation.navigate('OnboardingBudget', nextParams);
    } catch (error) {
      Alert.alert('Something went wrong', 'Unable to save your interests right now.');
      console.error('Failed to save interests', error);
    } finally {
      setSaving(false);
    }
  };

  if (editMode && prefillLoading) {
    return (
      <SafeAreaView className="h-full bg-background-dark px-4">
        <Flex flex={1} align="center" justify="center">
          <ActivityIndicator size="large" />
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-background-dark px-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex flex={1} direction="column" justify="space-between">
          <Flex gap={3} className="pt-4">
            <OnboardingProgress currentStep={3} totalSteps={5} />
            <Text size="4xl" bold>
              Choose 5 things worth showing up for
            </Text>
            <Text>Choose what excites you and meet people who feel the same.</Text>
          </Flex>
          <Flex flex={1} gap={10} className="mt-4">
            {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
              <Flex key={category} direction="column" gap={2}>
                <Text size="lg" bold className="capitalize">
                  {categoryEmojis[category as keyof typeof categoryEmojis]} {category}
                </Text>
                <Flex gap={4}>
                  {interests.map((interest: string) => (
                    <Button
                      key={interest}
                      variant="outline"
                      size="xl"
                      className={`rounded-xl ${selectedInterests.includes(interest) && 'border border-white/20 bg-white/10'}`}
                      onPress={() => handleSelectInterest(interest)}>
                      <Text className={`${selectedInterests.includes(interest) && 'text-white'}`}>
                        {interestEmojis[interest]} {interest}
                      </Text>
                    </Button>
                  ))}
                </Flex>
              </Flex>
            ))}
          </Flex>
          <Flex direction="row" justify="space-between" align="center" className="mt-10">
            <Flex direction="row" align="center" gap={4}>
              <Button
                size="xl"
                className={cn(
                  'h-14 w-full rounded-xl bg-primary-500',
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
      </ScrollView>
    </SafeAreaView>
  );
}
