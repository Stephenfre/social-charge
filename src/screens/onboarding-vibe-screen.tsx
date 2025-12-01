import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';
import { useAuth } from '~/providers/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { Enums } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';

const VIBE_OPTIONS: { slug: Enums<'vibe_slug'>; label: string; emoji: string }[] = [
  { slug: 'chill', label: 'Chill Hangouts', emoji: '🛋️' },
  { slug: 'low-key', label: 'Low-Key & Cozy', emoji: '☕️' },
  { slug: 'adventurous', label: 'Adventurous & Outdoors', emoji: '⛰️' },
  { slug: 'party-animal', label: 'Parties & Festivals', emoji: '🎉' },
];

export function OnboardingVibeScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingVibe'>>();
  const { userId } = useAuth();
  const [selected, setSelected] = useState<Enums<'vibe_slug'> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = useCallback((slug: Enums<'vibe_slug'>) => {
    setSelected((prev) => (prev === slug ? null : slug));
  }, []);

  const canContinue = useMemo(
    () => Boolean(selected) && !!userId && !submitting,
    [selected, submitting, userId]
  );

  const handleFinish = useCallback(async () => {
    if (!userId || !selected || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('users').update({ preferred_vibe_slug: selected }).eq('id', userId);
      navigation.navigate('OnboardingComplete');
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save vibe preference', error);
    } finally {
      setSubmitting(false);
    }
  }, [navigation, selected, submitting, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} gap={8}>
        <Flex gap={3} className="pt-6">
          <OnboardingProgress currentStep={4} />
          <Text size="4xl" bold>
            What's your vibe?
          </Text>
          <Text className="text-gray-300">Pick a few so we can prioritize the right events.</Text>
        </Flex>

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
          {VIBE_OPTIONS.map(({ slug, label, emoji }) => {
            const active = selected === slug;
            return (
              <Pressable
                key={slug}
                onPress={() => handleSelect(slug)}
                className={cn(
                  'rounded-2xl border px-4 py-4',
                  active ? 'border-white bg-white/10' : 'border-white/10 bg-white/5'
                )}>
                <Flex direction="row" align="center" gap={3}>
                  <Text className="text-2xl">{emoji}</Text>
                  <Text size="lg" bold className={active ? 'text-white' : undefined}>
                    {label}
                  </Text>
                </Flex>
              </Pressable>
            );
          })}
        </ScrollView>

        <Button
          size="xl"
          className="mb-4 h-16 rounded-2xl"
          disabled={!canContinue}
          onPress={handleFinish}>
          <ButtonText className="text-xl">Finish</ButtonText>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}
