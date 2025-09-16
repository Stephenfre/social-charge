import { SafeAreaView, ScrollView } from 'react-native';
import { EventsList } from '~/components';
import { useUserEvents } from '~/hooks';

export function ViewUserEventsScreen() {
  const { data: events, isLoading: eventsLoading } = useUserEvents();

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView className="p-4">
        <EventsList events={events ?? []} loading={eventsLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}
