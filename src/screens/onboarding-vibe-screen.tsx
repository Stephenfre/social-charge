import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';
import { useAuth } from '~/providers/AuthProvider';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';
import { RootRoute } from '~/types/navigation.types';

const VIBE_CATEGORIES = {
  personality: ['chill', 'wildcard', 'observer', 'deep_connector', 'fun_maker', 'connector', 'mystery'],
  social_energy: ['nightlife', 'hype_starter', 'social_butterfly', 'karaoke_star'],
  lifestyle: ['homebody', 'early_riser', 'night_owl', 'planner', 'spontaneous', 'zen'],
  interests: ['culture', 'music_lover', 'style_icon', 'chill_gamer', 'dog_person', 'late_night_foodie'],
  adventure: ['explorer', 'trailblazer', 'spontaneous_traveler', 'summer_energy'],
  seasonal: ['holiday_spirit'],
  reputation: ['mvp', 'vibe_validator'],
} as const satisfies Record<string, readonly Enums<'vibe_slug'>[]>;

const formatLabel = (slug: Enums<'vibe_slug'>) => {
  if (slug === 'mvp') return 'MVP';
  return slug
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCategory = (key: keyof typeof VIBE_CATEGORIES) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function OnboardingVibeScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingVibe'>>();
  const { userId, user, refreshUser, setUserState, setJustCompletedOnboarding } = useAuth();
  const [selected, setSelected] = useState<Enums<'vibe_slug'> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const route = useRoute<RootRoute<'OnboardingVibe'>>();
  const editMode = route.params?.editMode ?? false;
  const returnToSettings = route.params?.returnToSettings ?? false;
  const [prefillLoading, setPrefillLoading] = useState(editMode);

  const handleSelect = useCallback((slug: Enums<'vibe_slug'>) => {
    setSelected((prev) => (prev === slug ? null : slug));
  }, []);

  useEffect(() => {
    if (!editMode) return;
    if (!user) {
      setPrefillLoading(false);
      return;
    }
    if (user.preferred_vibe_slug) {
      setSelected(user.preferred_vibe_slug as Enums<'vibe_slug'>);
    }
    setPrefillLoading(false);
  }, [editMode, user]);

  const canContinue = useMemo(
    () => Boolean(selected) && !!userId && !submitting && !prefillLoading,
    [prefillLoading, selected, submitting, userId]
  );

  const handleReturnToSettings = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Root',
            state: {
              index: 0,
              routes: [
                {
                  name: 'Tabs',
                  state: {
                    index: 0,
                    routes: [
                      {
                        name: 'Profile',
                        state: {
                          index: 1,
                          routes: [{ name: 'ProfileIndex' }, { name: 'Profile Settings' }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      })
    );
  }, [navigation]);

  const handleFinish = useCallback(async () => {
    if (!userId || !selected || submitting) return;
    setSubmitting(true);
    try {
      await supabase
        .from('users')
        .update({ preferred_vibe_slug: selected, onboarded: true })
        .eq('id', userId);

      await supabase
        .from('user_onboarding_profile')
        .upsert(
          { user_id: userId, completed: true, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      const refreshed = await refreshUser();

      setUserState((prev) => {
        const base = refreshed ?? prev;
        if (!base) return base;
        return { ...base, preferred_vibe_slug: selected, onboarded: true };
      });

      // 👉 this flag is what HomeScreen listens for
      setJustCompletedOnboarding(true);

      if (returnToSettings) {
        handleReturnToSettings();
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save vibe preference', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    handleReturnToSettings,
    refreshUser,
    returnToSettings,
    selected,
    setJustCompletedOnboarding,
    setUserState,
    submitting,
    userId,
  ]);

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
      <Flex flex={1} gap={8}>
        <Flex gap={3} className="pt-6">
          <OnboardingProgress currentStep={5} totalSteps={5} />
          <Text size="4xl" bold>
            What's your vibe?
          </Text>
          <Text className="text-gray-300">Pick a few so we can prioritize the right events.</Text>
        </Flex>

        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
          {(Object.entries(VIBE_CATEGORIES) as [keyof typeof VIBE_CATEGORIES, readonly Enums<'vibe_slug'>[]][]).map(
            ([category, slugs]) => (
              <Flex key={category} gap={3}>
                <Text bold size="lg">
                  {formatCategory(category)}
                </Text>
                <Flex gap={8}>
                  {slugs.map((slug) => {
                    const active = selected === slug;
                    return (
                      <Pressable
                        key={slug}
                        onPress={() => handleSelect(slug)}
                        className={cn(
                          'rounded-2xl border px-4 py-4',
                          active ? 'border-primary' : 'border-white/10 '
                        )}>
                        <Text size="lg" bold={active} className={active ? 'text-white' : undefined}>
                          {formatLabel(slug)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Flex>
              </Flex>
            )
          )}
        </ScrollView>

        <Button
          size="xl"
          className={cn('h-14 w-full rounded-xl bg-primary-500', !canContinue && 'bg-gray-500')}
          disabled={!canContinue}
          onPress={handleFinish}>
          <Text size="lg" weight="600" className="text-white">
            Finish
          </Text>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
