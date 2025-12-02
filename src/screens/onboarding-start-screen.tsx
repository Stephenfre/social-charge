import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Pressable, Text } from '~/components/ui';
import { Handshake, PartyPopper, Sparkles, Users } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { OnboardingProgress } from '~/components/OnboardingProgress';

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

export function OnboardingStartScreen() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation<NavigationProp<'OnboardingStart'>>();
  const { userId } = useAuth();

  const handleContinue = useCallback(async () => {
    if (!selectedReason || !userId || saving) return;
    const reason = REASONS.find((item) => item.id === selectedReason);
    const mappedGoal = GOAL_MAP[selectedReason];
    setSaving(true);
    try {
      if (mappedGoal) {
        await supabase
          .from('user_event_goals')
          .upsert({ user_id: userId, goal: mappedGoal }, { onConflict: 'user_id,goal' });
      }
      navigation.navigate('OnboardingNight', { entryReason: reason?.title });
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save onboarding goal', error);
    } finally {
      setSaving(false);
    }
  }, [navigation, saving, selectedReason, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} direction="column" justify="space-between" gap={10}>
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

        <Flex direction="column" gap={10}>
          {REASONS.map(({ id, title, description }) => {
            const isSelected = selectedReason === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSelectedReason(id)}
                className={cn(
                  'rounded-xl border border-white/10  p-4',
                  isSelected && 'border-secondary'
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

        <Button
          size="xl"
          className={cn(
            'h-14 w-full rounded-xl bg-secondary-500',
            !selectedReason && 'bg-gray-500'
          )}
          disabled={!selectedReason || saving || !userId}
          onPress={handleContinue}>
          <Text size="lg" weight="600" className="text-white">
            Continue
          </Text>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
