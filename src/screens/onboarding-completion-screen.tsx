import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { Alert } from 'react-native';

const PLACEHOLDER_CARDS = [
  { emoji: '🎤', title: 'Live Music' },
  { emoji: '🍷', title: 'Dinner Party' },
  { emoji: '🌿', title: 'Outdoor Escape' },
];

export function OnboardingCompletionScreen() {
  const { userId, refreshUser } = useAuth();
  const navigation = useNavigation<NavigationProp<'OnboardingComplete'>>();
  const [loading, setLoading] = useState(false);

  const handleFinish = useCallback(async () => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({ onboarded: true }).eq('id', userId);
      if (error) throw error;
      await supabase
        .from('user_onboarding_profile')
        .upsert({ user_id: userId, completed: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      await refreshUser();
      navigation.reset({ index: 0, routes: [{ name: 'Root' }] });
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Onboarding completion failed', error);
    } finally {
      setLoading(false);
    }
  }, [loading, navigation, refreshUser, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} justify="center" gap={6}>
        <Flex gap={3} className="rounded-3xl bg-white/5 p-6">
          <Text size="4xl" bold>
            Awesome 🎉
          </Text>
          <Text className="text-gray-200">
            We've personalized your events feed to match your vibe. Get ready to meet amazing people
            and try new things!
          </Text>
          <Button className="mt-2 h-14 rounded-2xl" onPress={handleFinish} disabled={!userId || loading}>
            <ButtonText className="text-lg">Show Me My Events 🚀</ButtonText>
          </Button>
        </Flex>

        <Flex direction="row" justify="space-between" gap={4}>
          {PLACEHOLDER_CARDS.map(({ emoji, title }) => (
            <Flex
              key={title}
              align="center"
              justify="center"
              className="h-40 flex-1 rounded-3xl bg-white/5">
              <Text className="text-4xl">{emoji}</Text>
              <Text bold className="mt-2 text-center">
                {title}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
