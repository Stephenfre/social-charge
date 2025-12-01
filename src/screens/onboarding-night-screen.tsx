import { useMemo, useState, useCallback } from 'react';
import { Alert, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Pressable, Text } from '~/components/ui';
import { Beer, Calendar, Coffee, Moon, PartyPopper, Sun, Sunset, Users } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { RootRoute } from '~/types/navigation.types';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { Enums, TablesInsert } from '~/types/database.types';
import { OnboardingProgress } from '~/components/OnboardingProgress';

const VIBE_OPTIONS = [
  { id: 'chill', label: 'Chill', Icon: Coffee },
  { id: 'social', label: 'Social', Icon: Beer },
  { id: 'adventure', label: 'Adventurer', Icon: PartyPopper },
] as const;

const TIME_OPTIONS = [
  { id: 'morning', label: 'Morning', Icon: Sun, value: 'morning' as Enums<'time_bucket'> },
  { id: 'afternoon', label: 'Afternoon', Icon: Sunset, value: 'afternoon' as Enums<'time_bucket'> },
  { id: 'evening', label: 'Evening', Icon: Moon, value: 'evening' as Enums<'time_bucket'> },
  {
    id: 'late-night',
    label: 'Late Night',
    Icon: Moon,
    value: 'late_night' as Enums<'time_bucket'>,
  },
] as const;

const DAY_OPTIONS = [
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
] as const;

const GROUP_LABELS = ['Solo', 'Duo', 'Crew', 'Party', 'Large'];

const ARCHETYPE_MAP: Record<(typeof VIBE_OPTIONS)[number]['id'], Enums<'social_archetype'>> = {
  chill: 'chill',
  social: 'social',
  adventure: 'adventurer',
};

type NightRoute = RootRoute<'OnboardingNight'>;

export function OnboardingNightScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingNight'>>();
  const route = useRoute<NightRoute>();
  const { userId } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState<(typeof VIBE_OPTIONS)[number]['id']>('chill');
  const [groupSize, setGroupSize] = useState(3);
  const [selectedTimes, setSelectedTimes] = useState<Enums<'time_bucket'>[]>(['evening']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['weekends']);
  const [submitting, setSubmitting] = useState(false);

  const reasonCopy = useMemo(() => route.params?.entryReason, [route.params?.entryReason]);
  const groupLabel = useMemo(() => {
    const idx = Math.min(GROUP_LABELS.length - 1, Math.max(0, Math.round(groupSize) - 1));
    return GROUP_LABELS[idx];
  }, [groupSize]);

  const toggleItem = useCallback((current: string[], value: string) => {
    if (current.includes(value)) {
      return current.filter((item) => item !== value);
    }
    return [...current, value];
  }, []);

  const handleNext = useCallback(async () => {
    if (!userId || submitting) return;
    setSubmitting(true);
    try {
      const archetype = ARCHETYPE_MAP[selectedVibe];
      await supabase.from('user_onboarding_profile').upsert(
        {
          user_id: userId,
          primary_archetype: archetype,
          preferred_group_size_min: groupSize,
          preferred_group_size_max: groupSize,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      await supabase.from('user_time_prefs').delete().eq('user_id', userId);
      const timeRows: TablesInsert<'user_time_prefs'>[] = selectedTimes.map((time_pref) => ({
        user_id: userId,
        time_pref,
      }));
      if (timeRows.length) {
        await supabase.from('user_time_prefs').insert(timeRows);
      }

      await supabase.from('user_day_prefs').delete().eq('user_id', userId);
      const dayRows: TablesInsert<'user_day_prefs'>[] = selectedDays.map((day_pref) => ({
        user_id: userId,
        day_pref: day_pref as Enums<'day_bucket'>,
      }));
      if (dayRows.length) {
        await supabase.from('user_day_prefs').insert(dayRows);
      }

      navigation.navigate('OnboardingBudget');
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save night preferences', error);
    } finally {
      setSubmitting(false);
    }
  }, [groupSize, navigation, selectedDays, selectedTimes, selectedVibe, submitting, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background-dark px-4">
      <Flex flex={1} direction="column" gap={8}>
        <Flex gap={2} className="pt-4">
          <OnboardingProgress currentStep={2} />
          <Text size="lg" className="text-gray-300">
            {reasonCopy ? `Let's plan nights for ${reasonCopy}.` : 'Dial in your vibe.'}
          </Text>
          <Text size="4xl" bold>
            Your perfect night looks like...
          </Text>
        </Flex>

        <Flex gap={4}>
          <SectionLabel title="Vibe" />
          <Flex direction="row" gap={3} wrap="wrap">
            {VIBE_OPTIONS.map(({ id, label, Icon }) => {
              const selected = selectedVibe === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedVibe(id)}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    selected ? 'border-white bg-white' : 'border-white/10 bg-white/5'
                  )}>
                  <Flex direction="row" align="center" gap={2}>
                    <Icon size={18} color={selected ? '#0F1012' : '#F4F4F5'} />
                    <Text className={cn('text-base', selected && 'text-black')} bold={selected}>
                      {label}
                    </Text>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </Flex>

        <Flex gap={3}>
          <SectionLabel title="Group Size" Icon={Users} />
          <Flex gap={3}>
            <Slider
              value={groupSize}
              minimumValue={1}
              maximumValue={5}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#3F3F46"
              thumbTintColor="#FFFFFF"
              onValueChange={setGroupSize}
            />
            <Flex direction="row" justify="space-between">
              <Text className="text-gray-400">Small</Text>
              <Text bold>{groupLabel}</Text>
              <Text className="text-gray-400">Large</Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex gap={3}>
          <SectionLabel title="Time" />
          <Flex direction="row" gap={3} wrap="wrap">
            {TIME_OPTIONS.map(({ id, label, Icon, value }) => {
              const selected = selectedTimes.includes(value);
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedTimes((prev) => toggleItem(prev, value))}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    selected ? 'border-white bg-white' : 'border-white/10 bg-white/5'
                  )}>
                  <Flex direction="row" align="center" gap={2}>
                    <Icon size={18} color={selected ? '#0F1012' : '#F4F4F5'} />
                    <Text className={cn(selected && 'text-black')} bold={selected}>
                      {label}
                    </Text>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </Flex>

        <Flex gap={3}>
          <SectionLabel title="Days" Icon={Calendar} />
          <Flex direction="row" gap={3}>
            {DAY_OPTIONS.map(({ id, label }) => {
              const selected = selectedDays.includes(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedDays((prev) => toggleItem(prev, id))}
                  className={cn(
                    'flex-1 rounded-2xl border px-4 py-3',
                    selected ? 'border-white bg-white' : 'border-white/10 bg-white/5'
                  )}>
                  <Text className={cn('text-center text-base', selected && 'text-black')} bold>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </Flex>
        </Flex>

        <View className="flex-1" />

        <Button
          size="xl"
          className="mb-4 h-16 rounded-2xl"
          disabled={!userId || submitting || !selectedTimes.length || !selectedDays.length}
          onPress={handleNext}>
          <ButtonText className="text-xl">Next</ButtonText>
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

function SectionLabel({ title, Icon }: { title: string; Icon?: typeof Users }) {
  return (
    <Flex direction="row" align="center" gap={2}>
      {Icon ? <Icon size={18} color="#A1A1AA" /> : null}
      <Text bold className="text-gray-200">
        {title}
      </Text>
    </Flex>
  );
}
