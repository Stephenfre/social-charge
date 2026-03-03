import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';
import { useAuth } from '~/providers/AuthProvider';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';
import { RootRoute } from '~/types/navigation.types';

const VIBE_OPTIONS: {
  slug: Enums<'vibe_slug'>;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    slug: 'social',
    emoji: '🎉',
    title: 'Social',
    description: 'Big energy. Group events. Nightlife.',
  },
  {
    slug: 'explorer',
    emoji: '🌎',
    title: 'Explorer',
    description: 'Adventures. Trips. Trying new things.',
  },
  {
    slug: 'connector',
    emoji: '🤝',
    title: 'Connector',
    description: 'Deep convos. Meaningful moments.',
  },
  {
    slug: 'chill',
    emoji: '😌',
    title: 'Chill',
    description: 'Low-key. Relaxed. Easygoing.',
  },
  {
    slug: 'wildcard',
    emoji: '⚡',
    title: 'Wildcard',
    description: 'Spontaneous. Down for anything.',
  },
];

export function OnboardingVibeScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingVibe'>>();
  const { userId, user, refreshUser, setUserState } = useAuth();
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

  const handleNext = useCallback(async () => {
    if (!userId || !selected || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('users').update({ preferred_vibe_slug: selected }).eq('id', userId);

      const refreshed = await refreshUser();

      setUserState((prev) => {
        const base = refreshed ?? prev;
        if (!base) return base;
        return { ...base, preferred_vibe_slug: selected };
      });
      const nextParams = editMode || returnToSettings ? { editMode, returnToSettings } : undefined;
      navigation.navigate('Interest', nextParams);
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save vibe preference', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    editMode,
    navigation,
    refreshUser,
    returnToSettings,
    selected,
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
          <OnboardingProgress currentStep={2} totalSteps={5} />
          <Text size="4xl" bold>
            What's your vibe?
          </Text>
          <Text className="text-gray-300">Pick one so we can prioritize the right events.</Text>
        </Flex>

        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
          <Flex gap={3}>
            {VIBE_OPTIONS.map(({ slug, emoji, title, description }) => {
              const active = selected === slug;
              return (
                <Pressable
                  key={slug}
                  onPress={() => handleSelect(slug)}
                  className={cn(
                    'rounded-2xl border px-4 py-4',
                    active ? 'border-primary bg-white/5' : 'border-white/10'
                  )}>
                  <Flex direction="row" align="center" gap={3}>
                    <Text size="2xl">{emoji}</Text>
                    <Flex className="flex-1">
                      <Text size="lg" bold={active} className={active ? 'text-white' : undefined}>
                        {title}
                      </Text>
                      <Text className="text-gray-300">{description}</Text>
                    </Flex>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </ScrollView>

        <Button
          size="xl"
          className={cn('h-14 w-full rounded-xl bg-primary-500', !canContinue && 'bg-gray-500')}
          disabled={!canContinue}
          onPress={handleNext}>
          <Text size="lg" weight="600" className="text-white">
            Next
          </Text>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
