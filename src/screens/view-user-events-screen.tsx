import { useLayoutEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { EventsList } from '~/components';
import { Flex, Text } from '~/components/ui';
import { useUserEvents } from '~/hooks';
import { useNavigationStack, useRouteStack } from '~/types/navigation.types';

export function ViewUserEventsScreen() {
  const navigation = useNavigationStack<'Event History'>();
  const { params } = useRouteStack<'Event History'>();
  const filter = params?.filter ?? 'all';
  const { data: events, isLoading: eventsLoading } = useUserEvents();
  const upcomingEvents = (events ?? []).filter((event) => event.event_status === 'upcoming');
  const pastEvents = (events ?? []).filter((event) => event.event_status !== 'upcoming');

  useLayoutEffect(() => {
    const title =
      filter === 'upcoming'
        ? 'Upcoming Events'
        : filter === 'history'
          ? 'Event History'
          : 'Your Events';
    navigation.setOptions({ title });
  }, [filter, navigation]);

  const renderSection = (title: string, data: typeof upcomingEvents, emptyText: string) => (
    <Flex gap={2} key={title}>
      <Text size="2xl" bold>
        {title}
      </Text>
      {data.length ? (
        <EventsList events={data} loading={eventsLoading} />
      ) : (
        !eventsLoading && (
          <Text size="sm" className="text-typography-500">
            {emptyText}
          </Text>
        )
      )}
    </Flex>
  );

  const sections: Array<{ title: string; data: typeof upcomingEvents; empty: string }> = [];
  if (filter !== 'history') {
    sections.push({
      title: 'Upcoming Events',
      data: upcomingEvents,
      empty: 'No upcoming events yet.',
    });
  }
  if (filter !== 'upcoming') {
    sections.push({
      title: 'Event History',
      data: pastEvents,
      empty: 'No past events just yet.',
    });
  }

  return (
    <View className="h-full bg-background-dark">
      <ScrollView className="p-4">
        <Flex gap={8}>
          {sections.map((section) => renderSection(section.title, section.data, section.empty))}
        </Flex>
      </ScrollView>
    </View>
  );
}
