import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EventCard } from '~/components/EventCard/EventCard';
import { Button, Flex, Pressable, Text } from '~/components/ui';
import { Spinner } from '~/components/ui/spinner';
import { useEvents } from '~/hooks';
import { RootStackParamList } from '~/types/navigation.types';
import { cn } from '~/utils/cn';

type AllEventsNav = NativeStackNavigationProp<RootStackParamList, 'All Events'>;

type RangeOption = {
  id: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  labelStartText: string;
  labelEndText: string;
  startDayName: string;
  endDayName: string;
};

export function AllEventsScreen() {
  const navigation = useNavigation<AllEventsNav>();
  const { data: events = [], isLoading } = useEvents();
  const [selectedRanges, setSelectedRanges] = useState<number[]>([]);

  const currentMonthKey = dayjs().format('YYYY-MM');

  const rangeOptions = useMemo<RangeOption[]>(() => {
    const now = dayjs();
    const startOfMonth = now.startOf('month');
    const endOfMonth = now.endOf('month');

    const options: RangeOption[] = [];
    let weekStart = startOfMonth.startOf('week');
    if (startOfMonth.day() === 0) {
      weekStart = weekStart.subtract(1, 'day');
    }

    let index = 0;
    while (weekStart.isBefore(endOfMonth) || weekStart.isSame(endOfMonth, 'day')) {
      const rawWeekEnd = weekStart.add(6, 'day');
      const filterStartDate = weekStart.isBefore(startOfMonth) ? startOfMonth : weekStart;
      const filterEndDate = rawWeekEnd.isAfter(endOfMonth) ? endOfMonth : rawWeekEnd;

      const spansMonths = rawWeekEnd.month() !== weekStart.month();
      const labelStartText = spansMonths
        ? weekStart.format('MMM D')
        : weekStart.month() === startOfMonth.month()
          ? `${weekStart.date()}`
          : `${weekStart.format('MMM')} ${weekStart.date()}`;
      const labelEndText = `${rawWeekEnd.date()}`;

      options.push({
        id: index,
        startDate: filterStartDate.startOf('day'),
        endDate: filterEndDate.endOf('day'),
        labelStartText,
        labelEndText,
        startDayName: weekStart.format('ddd'),
        endDayName: rawWeekEnd.format('ddd'),
      });

      weekStart = weekStart.add(7, 'day');
      index += 1;
    }

    return options;
  }, [currentMonthKey]);

  useEffect(() => {
    setSelectedRanges((prev) => prev.filter((id) => id < rangeOptions.length));
  }, [rangeOptions.length]);

  const filteredEvents = useMemo(() => {
    if (!selectedRanges.length) return events;

    return events.filter((event) => {
      const eventDate = dayjs(event.starts_at);
      if (eventDate.isBefore(dayjs(), 'day')) return false;

      return selectedRanges.some((rangeId) => {
        const option = rangeOptions[rangeId];
        if (!option) return false;

        const startsOnOrAfter =
          eventDate.isSame(option.startDate, 'day') || eventDate.isAfter(option.startDate);
        const endsOnOrBefore =
          eventDate.isSame(option.endDate, 'day') || eventDate.isBefore(option.endDate);

        return startsOnOrAfter && endsOnOrBefore;
      });
    });
  }, [events, selectedRanges, rangeOptions]);

  const handlePressNavigateToEvent = (eventId: string) => {
    navigation.navigate('ViewEvent', { eventId });
  };

  const toggleRange = (rangeId: number) => {
    setSelectedRanges((prev) =>
      prev.includes(rangeId) ? prev.filter((id) => id !== rangeId) : [...prev, rangeId]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-dark">
        <Flex className="flex-1 items-center justify-center">
          <Spinner />
        </Flex>
      </View>
    );
  }

  const emptyStateText = selectedRanges.length
    ? 'No events match the selected date ranges.'
    : 'No events available yet.';

  return (
    <View className="flex-1 bg-background-dark">
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <Flex direction="row" align="center">
            {rangeOptions.map((option) => {
              const isSelected = selectedRanges.includes(option.id);
              return (
                <Pressable key={option.id} className="px-4" onPress={() => toggleRange(option.id)}>
                  <Flex align="center">
                    <Text size="xs" className={cn(isSelected && 'text-primary')}>
                      {option.startDayName} - {option.endDayName}
                    </Text>
                    <Text bold size="md" className={cn(isSelected && 'text-primary')}>
                      {option.labelStartText} - {option.labelEndText}
                    </Text>
                  </Flex>
                </Pressable>
              );
            })}
          </Flex>
        </ScrollView>
        <Flex gap={4}>
          {filteredEvents.length === 0 ? (
            <Text size="md" className="text-typography-500">
              {emptyStateText}
            </Text>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                imageSize="cover"
                rounded="lg"
                onPress={() => handlePressNavigateToEvent(event.id)}
              />
            ))
          )}
        </Flex>
      </ScrollView>
    </View>
  );
}
