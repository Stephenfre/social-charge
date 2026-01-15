import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';
import { useAuth } from '~/providers/AuthProvider';
import { DollarSign, Star, WalletMinimal, PartyPopper } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';
import { RootRoute } from '~/types/navigation.types';

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
const STYLE_REVERSE_MAP = Object.entries(STYLE_MAP).reduce<
  Record<string, (typeof STYLE_OPTIONS)[number]['id']>
>((acc, [optionId, enumValue]) => {
  acc[enumValue] = optionId as (typeof STYLE_OPTIONS)[number]['id'];
  return acc;
}, {});

const BUDGET_MAP: Record<string, Enums<'budget_band'>> = {
  budget: 'budget',
  moderate: 'moderate',
  premium: 'premium',
  luxury: 'luxury',
};
const BUDGET_REVERSE_MAP = Object.entries(BUDGET_MAP).reduce<Record<string, SpendOption['id']>>(
  (acc, [optionId, enumValue]) => {
    acc[enumValue] = optionId as SpendOption['id'];
    return acc;
  },
  {}
);

export function OnboardingBudgetScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingBudget'>>();
  const { userId } = useAuth();
  const [selectedSpend, setSelectedSpend] = useState<string>('budget');
  const [selectedStyle, setSelectedStyle] = useState<string>('value');
  const [saving, setSaving] = useState(false);
  const route = useRoute<RootRoute<'OnboardingBudget'>>();
  const editMode = route.params?.editMode ?? false;
  const returnToSettings = route.params?.returnToSettings ?? false;
  const [prefillLoading, setPrefillLoading] = useState(editMode);

  useEffect(() => {
    if (!editMode) return;
    if (!userId) {
      setPrefillLoading(false);
      return;
    }
    let isMounted = true;
    const loadPreferences = async () => {
      setPrefillLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_onboarding_profile')
          .select('budget_pref, style_pref')
          .eq('user_id', userId)
          .maybeSingle();
        if (!isMounted) return;
        if (!error && data) {
          if (data.budget_pref) {
            const spendId = BUDGET_REVERSE_MAP[data.budget_pref];
            if (spendId) {
              setSelectedSpend(spendId);
            }
          }
          if (data.style_pref) {
            const styleId = STYLE_REVERSE_MAP[data.style_pref];
            if (styleId) {
              setSelectedStyle(styleId);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load budget preferences', error);
      } finally {
        if (isMounted) {
          setPrefillLoading(false);
        }
      }
    };
    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [editMode, userId]);

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
      const nextParams = editMode || returnToSettings ? { editMode, returnToSettings } : undefined;
      navigation.navigate('OnboardingVibe', nextParams);
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save budget preferences', error);
    } finally {
      setSaving(false);
    }
  }, [editMode, navigation, returnToSettings, saving, selectedSpend, selectedStyle, userId]);

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
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex flex={1} gap={8}>
          <Flex gap={3} className="pt-6">
            <OnboardingProgress currentStep={4} totalSteps={5} />
            <Text size="4xl" bold>
              When it comes to events...
            </Text>
          </Flex>

          <Flex gap={3}>
            <Text bold size="lg" className="text-gray-300">
              On average, I like to spend...
            </Text>

            {SPEND_OPTIONS.map(({ id, label, range, badge, colors }) => {
              const selected = selectedSpend === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedSpend(id)}
                  className={cn(
                    'rounded-2xl px-4 py-3',
                    selected ? `${colors}` : 'border border-white/10 '
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
            <Text bold size="lg" className="text-gray-300">
              My style is usually...
            </Text>
            <Flex gap={3}>
              {STYLE_OPTIONS.map(({ id, label, Icon }) => {
                const selected = selectedStyle === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelectedStyle(id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3',
                      selected ? 'border-white/20 bg-white/10' : 'border-white/10'
                    )}>
                    <Flex direction="row" align="center" gap={3}>
                      <Icon size={18} color={'#FFFF'} />
                      <Text className="text-white" bold>
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
            className={cn(
              'h-14 w-full rounded-xl bg-primary-500',
              (!userId || saving || (editMode && prefillLoading)) && 'bg-gray-500'
            )}
            disabled={!userId || saving || (editMode && prefillLoading)}
            onPress={handleFinish}>
            <Text size="lg" weight="600" className="text-white">
              Continue
            </Text>
          </Button>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}
