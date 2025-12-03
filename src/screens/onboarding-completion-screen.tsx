import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Text } from '~/components/ui';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { RootRoute } from '~/types/navigation.types';

export function OnboardingCompletionScreen() {
  const { userId, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<'OnboardingComplete'>>();
  const route = useRoute<RootRoute<'OnboardingComplete'>>();
  const returnToSettings = route.params?.returnToSettings ?? false;

  const handleFinish = useCallback(async () => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({ onboarded: true }).eq('id', userId);
      if (error) throw error;
      await supabase
        .from('user_onboarding_profile')
        .upsert(
          { user_id: userId, completed: true, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      await refreshUser();
      if (returnToSettings) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Root' as never,
              params: {
                screen: 'Tabs',
                params: {
                  screen: 'Profile',
                  params: {
                    screen: 'Profile Settings',
                  },
                },
              },
            } as never,
          ],
        });
        return;
      }
      const canResetToRoot = navigation.getState()?.routeNames?.includes('Root');
      if (canResetToRoot) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Root' as never } as never],
        });
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Onboarding completion failed', error);
    } finally {
      setLoading(false);
    }
  }, [loading, navigation, refreshUser, returnToSettings, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} justify="center" gap={6}>
        <Flex gap={3} className="rounded-3xl p-6">
          <Text size="4xl" bold>
            Awesome 🎉
          </Text>
          <Text className="text-gray-200">
            We've personalized your events feed to match your vibe. Get ready to meet amazing people
            and try new things!
          </Text>
          <Button
            className="mt-2 h-14 rounded-xl bg-primary"
            onPress={handleFinish}
            disabled={!userId || loading}>
            <Text bold size="lg">
              Show Me My Events
            </Text>
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
