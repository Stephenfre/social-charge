import { useMemo, useState, useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { Beer, Calendar, Coffee, Moon, PartyPopper, Sun, Sunset, Users } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { RootRoute } from '~/types/navigation.types';
import { useAuth } from '~/providers/AuthProvider';
import { useNightPreferences } from '~/hooks';
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
] as const;

const DAY_OPTIONS = [
  { id: 'sunday', label: 'Sunday' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
] as const;
type DayOption = (typeof DAY_OPTIONS)[number];
type DayId = DayOption['id'];

const normalizeDayValue = (value?: string | null): DayId | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  const match = DAY_OPTIONS.find((day) => day.id === lower || day.label.toLowerCase() === lower);
  return match?.id ?? null;
};

const GROUP_LABELS = ['Solo', 'Duo', 'Crew', 'Party', 'Large'];

const ARCHETYPE_MAP: Record<(typeof VIBE_OPTIONS)[number]['id'], Enums<'social_archetype'>> = {
  chill: 'chill',
  social: 'social',
  adventure: 'adventurer',
};
const ARCHETYPE_TO_OPTION = Object.entries(ARCHETYPE_MAP).reduce<
  Record<string, (typeof VIBE_OPTIONS)[number]['id']>
>((acc, [optionId, archetype]) => {
  acc[archetype] = optionId as (typeof VIBE_OPTIONS)[number]['id'];
  return acc;
}, {});

type NightRoute = RootRoute<'OnboardingNight'>;

export function OnboardingNightScreen() {
  const navigation = useNavigation<NavigationProp<'OnboardingNight'>>();
  const route = useRoute<NightRoute>();
  const { userId } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState<(typeof VIBE_OPTIONS)[number]['id']>('chill');
  const [groupSize, setGroupSize] = useState(3);
  const [selectedTimes, setSelectedTimes] = useState<Enums<'time_bucket'>[]>(['evening']);
  const [selectedDays, setSelectedDays] = useState<DayId[]>([DAY_OPTIONS[0].id]);
  const [submitting, setSubmitting] = useState(false);

  const editMode = route.params?.editMode ?? false;
  const returnToSettings = route.params?.returnToSettings ?? false;
  const {
    data: nightPreferences,
    isLoading: nightPrefLoading,
    error: nightPrefError,
  } = useNightPreferences({ userId, enabled: editMode });
  const prefillLoading = editMode && nightPrefLoading;
  const groupLabel = useMemo(() => {
    const idx = Math.min(GROUP_LABELS.length - 1, Math.max(0, Math.round(groupSize) - 1));
    return GROUP_LABELS[idx];
  }, [groupSize]);

  const toggleItem = useCallback(<T extends string>(current: T[], value: T): T[] => {
    if (current.includes(value)) {
      return current.filter((item) => item !== value);
    }
    return [...current, value];
  }, []);

  useEffect(() => {
    if (nightPrefError) {
      console.error('Failed to load night preferences', nightPrefError);
    }
  }, [nightPrefError]);

  useEffect(() => {
    if (!editMode) return;
    if (!nightPreferences) return;

    const { profile, times, days } = nightPreferences;

    if (profile?.primary_archetype) {
      const optionId = ARCHETYPE_TO_OPTION[profile.primary_archetype];
      if (optionId) {
        setSelectedVibe(optionId);
      }
    }

    const savedGroupSize = profile?.preferred_group_size_min ?? profile?.preferred_group_size_max;
    if (typeof savedGroupSize === 'number' && !Number.isNaN(savedGroupSize)) {
      setGroupSize(savedGroupSize);
    }

    if (times.length) {
      setSelectedTimes(times);
    }

    if (days.length) {
      const normalizedDays = Array.from(
        new Set(
          days
            .map((value) => normalizeDayValue(value))
            .filter((value): value is DayId => Boolean(value))
        )
      );
      if (normalizedDays.length) {
        setSelectedDays(normalizedDays);
      }
    }
  }, [
    editMode,
    nightPreferences,
    setGroupSize,
    setSelectedDays,
    setSelectedTimes,
    setSelectedVibe,
  ]);

  const handleNext = useCallback(async () => {
    console.log('pressed');
    if (!userId) return;
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
      const dayRows: TablesInsert<'user_day_prefs'>[] = selectedDays
        .map((dayId) => {
          const option = DAY_OPTIONS.find((day) => day.id === dayId);
          if (!option) return null;
          return {
            user_id: userId,
            available_days: option.label as Enums<'days_available'>,
          };
        })
        .filter((row): row is TablesInsert<'user_day_prefs'> => Boolean(row));
      if (dayRows.length) {
        await supabase.from('user_day_prefs').insert(dayRows);
      }

      const nextParams = editMode || returnToSettings ? { editMode, returnToSettings } : undefined;
      navigation.navigate('Interest', nextParams);
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Failed to save night preferences', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    editMode,
    groupSize,
    navigation,
    returnToSettings,
    selectedDays,
    selectedTimes,
    selectedVibe,
    submitting,
    userId,
  ]);

  const disabledForm = prefillLoading || !userId || !selectedTimes.length || !selectedDays.length;

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
        <Flex flex={1} direction="column" gap={8}>
          <Flex className="pt-4">
            <OnboardingProgress currentStep={2} totalSteps={5} />
            <Flex>
              <Text size="2xl" bold className="mt-4">
                What does a great hangout look like for you?
              </Text>
              <Text size="md" className="text-gray-300">
                Choose the vibe, group energy, and the times you love to go out.
              </Text>
            </Flex>
          </Flex>

          <Flex gap={3}>
            <SectionLabel title="Time" />
            <Flex direction="row" justify="space-between">
              {TIME_OPTIONS.map(({ id, label, Icon, value }) => {
                const selected = selectedTimes.includes(value);
                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelectedTimes((prev) => toggleItem(prev, value))}
                    className={cn(
                      'rounded-xl border px-4 py-3',
                      selected ? 'border-primary' : 'border-white/10'
                    )}>
                    <Flex direction="row" align="center" gap={2}>
                      <Icon size={18} color={'white'} />
                      <Text className="text-white" bold={selected}>
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
            <Flex gap={3}>
              {DAY_OPTIONS.map(({ id, label }) => {
                const selected = selectedDays.includes(id);
                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelectedDays((prev) => toggleItem(prev, id))}
                    className={cn(
                      'flex-1 rounded-xl border py-3',
                      selected ? 'border-primary' : 'border-white/10'
                    )}>
                    <Text className={cn('text-center text-base')} bold>
                      {label}
                    </Text>
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
                      selected ? 'border-primary ' : 'border-white/10'
                    )}>
                    <Flex direction="row" align="center" gap={2}>
                      {/* <Icon size={18} color={selected ? '#0F1012' : '#F4F4F5'} /> */}
                      <Text className={cn('text-base')} bold={selected}>
                        {label}
                      </Text>
                    </Flex>
                  </Pressable>
                );
              })}
            </Flex>
          </Flex>

          <Button
            size="xl"
            className={cn(
              'h-14 w-full rounded-xl bg-primary-500',
              disabledForm && 'bg-background-500'
            )}
            disabled={disabledForm}
            onPress={handleNext}>
            <Text size="lg" weight="600" className="text-white">
              Next
            </Text>
          </Button>
        </Flex>
      </ScrollView>
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
