import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { Handshake, PartyPopper, Sparkles, Users } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { useAuth } from '~/providers/AuthProvider';
import { useUserEventGoals } from '~/hooks';
import { supabase } from '~/lib/supabase';
import { OnboardingProgress } from '~/components/OnboardingProgress';
import { RootRoute } from '~/types/navigation.types';

const REASONS = [
  {
    id: 'connect',
    title: 'Meet your people',
    description: 'You want to connect with people who match your energy.',
    Icon: Users,
  },
  {
    id: 'celebrate',
    title: 'Celebrate more',
    description: 'You are hunting for the best events every week.',
    Icon: PartyPopper,
  },
  {
    id: 'create',
    title: 'Create moments',
    description: 'You would love to host and bring new experiences to life.',
    Icon: Sparkles,
  },
  {
    id: 'support',
    title: 'Support friends',
    description: 'You are here to show up for the people that matter to you.',
    Icon: Handshake,
  },
];

const GOAL_MAP: Record<
  string,
  'meet_new_friends' | 'try_new_things' | 'networking' | 'wellness_balance'
> = {
  connect: 'meet_new_friends',
  celebrate: 'try_new_things',
  create: 'networking',
  support: 'wellness_balance',
};

const GOAL_TO_REASON = Object.entries(GOAL_MAP).reduce<Record<string, string>>(
  (acc, [reasonId, goal]) => {
    acc[goal] = reasonId;
    return acc;
  },
  {}
);

type StartRoute = RootRoute<'OnboardingStart'>;

export function OnboardingStartScreen() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation<NavigationProp<'OnboardingStart'>>();
  const route = useRoute<StartRoute>();
  const { userId } = useAuth();
  const editMode = route.params?.editMode ?? false;
  const returnToSettings = route.params?.returnToSettings ?? false;
  const {
    data: userEventGoals,
    isLoading: goalsLoading,
    error: goalsError,
  } = useUserEventGoals({ userId, enabled: editMode });
  const prefillLoading = editMode && goalsLoading;

  useEffect(() => {
    if (goalsError) {
      console.error('Failed to load onboarding reason', goalsError);
    }
  }, [goalsError]);

  useEffect(() => {
    if (!editMode) return;
    if (!userEventGoals?.length) return;

    const existingReason = userEventGoals
      .map((row) => (row.goal ? GOAL_TO_REASON[row.goal] : undefined))
      .find((reason): reason is string => Boolean(reason));
    if (existingReason) {
      setSelectedReason(existingReason);
    }
  }, [editMode, userEventGoals]);

  const handleContinue = useCallback(async () => {
    if (!selectedReason || !userId || saving) return;
    const reason = REASONS.find((item) => item.id === selectedReason);
    const mappedGoal = GOAL_MAP[selectedReason];
    setSaving(true);
    try {
      if (mappedGoal) {
        await supabase.from('user_event_goals').delete().eq('user_id', userId);
        await supabase.from('user_event_goals').insert({ user_id: userId, goal: mappedGoal });
      }
      navigation.navigate('OnboardingNight', {
        entryReason: reason?.title,
        editMode,
        returnToSettings,
      });
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save onboarding goal', error);
    } finally {
      setSaving(false);
    }
  }, [editMode, navigation, returnToSettings, saving, selectedReason, userId]);

  if (editMode && prefillLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark px-4">
        <Flex flex={1} align="center" justify="center">
          <ActivityIndicator size="large" />
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex justify="space-between">
        <Flex direction="column">
          <Flex direction="column" className="pt-4">
            <OnboardingProgress currentStep={1} totalSteps={5} />
            <Flex>
              <Text size="2xl" bold className="mt-4">
                Why are you here?
              </Text>
              <Text size="sm" className="text-gray-300">
                We will tailor the rest of onboarding so every screen feels relevant.
              </Text>
            </Flex>
          </Flex>

          <Flex direction="column" gap={10} justify="flex-start" className="mt-8">
            {REASONS.map(({ id, title, description }) => {
              const isSelected = selectedReason === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedReason(id)}
                  className={cn(
                    'rounded-xl border border-white/10  p-4',
                    isSelected && 'border-white/20 bg-white/10'
                  )}>
                  <Flex direction="row" align="center" gap={4}>
                    <Flex gap={1}>
                      <Text size="lg" bold>
                        {title}
                      </Text>
                      <Text className={cn('text-gray-300')}>{description}</Text>
                    </Flex>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </Flex>

        <Button
          size="xl"
          className={cn(
            'mb-10 h-14 w-full rounded-xl bg-primary-500',
            !selectedReason && 'bg-gray-500'
          )}
          disabled={!selectedReason || saving || !userId || (editMode && prefillLoading)}
          onPress={handleContinue}>
          <Text size="lg" weight="600" className="text-white">
            Next
          </Text>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
