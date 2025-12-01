import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';
import { useAuth } from '~/providers/AuthProvider';
import { DollarSign, Star, WalletMinimal, PartyPopper } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';

type SpendOption = {
  id: string;
  label: string;
  range: string;
  badge: string;
  colors: string;
};

const SPEND_OPTIONS: SpendOption[] = [
  { id: 'budget', label: 'Budget-Friendly', range: '< $25', badge: 'S', colors: 'bg-emerald-600' },
  { id: 'moderate', label: 'Moderate', range: '$25 - 75', badge: 'M', colors: 'bg-indigo-600' },
  { id: 'premium', label: 'Premium', range: '$75 - 150', badge: 'P', colors: 'bg-purple-600' },
  { id: 'luxury', label: 'Luxury', range: '$150+', badge: 'L', colors: 'bg-amber-600' },
];

const STYLE_OPTIONS = [
  { id: 'casual', label: 'Cheap & Casual', Icon: WalletMinimal },
  { id: 'value', label: 'Value for Money', Icon: DollarSign },
  { id: 'exclusive', label: 'Premium & Exclusive', Icon: Star },
  { id: 'splurge', label: 'Splurge on Big Events', Icon: PartyPopper },
] as const;

const STYLE_MAP: Record<string, Enums<'style_band'>> = {
  casual: 'cheap_casual',
  value: 'value_for_money',
  exclusive: 'premium_exclusive',
  splurge: 'splurge_big_events',
};

const BUDGET_MAP: Record<string, Enums<'budget_band'>> = {
  budget: 'budget',
  moderate: 'moderate',
  premium: 'premium',
  luxury: 'luxury',
};

export function OnboardingBudgetScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingBudget'>>();
  const { userId } = useAuth();
  const [selectedSpend, setSelectedSpend] = useState<string>('budget');
  const [selectedStyle, setSelectedStyle] = useState<string>('value');
  const [saving, setSaving] = useState(false);

  const handleFinish = useCallback(async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      await supabase.from('user_onboarding_profile').upsert(
        {
          user_id: userId,
          budget_pref: BUDGET_MAP[selectedSpend] ?? 'budget',
          style_pref: STYLE_MAP[selectedStyle] ?? 'cheap_casual',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      navigation.navigate('OnboardingVibe');
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save budget preferences', error);
    } finally {
      setSaving(false);
    }
  }, [navigation, saving, selectedSpend, selectedStyle, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} gap={8}>
        <Flex gap={3} className="pt-6">
          <OnboardingProgress currentStep={3} />
          <Text size="4xl" bold>
            When it comes to events...
          </Text>
          <Text className="text-gray-300">On average, I like to spend...</Text>
        </Flex>

        <Flex gap={3}>
          {SPEND_OPTIONS.map(({ id, label, range, badge, colors }) => {
            const selected = selectedSpend === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSelectedSpend(id)}
                className={cn(
                  'rounded-2xl px-4 py-3',
                  selected ? `${colors}` : 'border border-white/10 bg-white/5'
                )}>
                <Flex direction="row" align="center" justify="space-between">
                  <Flex direction="row" align="center" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      className={cn(
                        'h-8 w-8 rounded-full bg-white/20',
                        selected ? 'opacity-100' : 'opacity-60'
                      )}>
                      <Text bold>{badge}</Text>
                    </Flex>
                    <Flex>
                      <Text size="lg" bold className={selected ? 'text-white' : undefined}>
                        {label}
                      </Text>
                      <Text className="text-gray-200">{range}</Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Pressable>
            );
          })}
        </Flex>

        <Flex gap={2}>
          <Text className="text-gray-300">My style is usually...</Text>
          <Flex gap={3}>
            {STYLE_OPTIONS.map(({ id, label, Icon }) => {
              const selected = selectedStyle === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedStyle(id)}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    selected ? 'border-white bg-white' : 'border-white/10 bg-white/5'
                  )}>
                  <Flex direction="row" align="center" gap={3}>
                    <Icon size={18} color={selected ? '#0F1012' : '#E4E4E7'} />
                    <Text className={cn(selected && 'text-black')} bold>
                      {label}
                    </Text>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </Flex>

        <Flex className="flex-1" />

        <Button
          size="xl"
          className="mb-6 h-16 rounded-2xl"
          disabled={!userId || saving}
          onPress={handleFinish}>
          <ButtonText className="text-xl">Next</ButtonText>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
