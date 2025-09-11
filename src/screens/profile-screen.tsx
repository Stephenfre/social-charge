import dayjs from 'dayjs';
import { SafeAreaView, ScrollView } from 'react-native';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';
import { useStorageImages, useUserEvents } from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import { UserEventCardRow } from '~/types/event.types';
import { cn } from '~/utils/cn';

export function ProfileScreen() {
  const { user } = useAuth();
  const { data, isLoading } = useUserEvents(10);
  const { data: userAvater, isLoading: userAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: [user?.profile_picture], // stored in users table
  });

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView className="p-4">
        <Flex align="center">
          <Flex align="center" gap={1}>
            {userAvater && !userAvatarLoading ? (
              <Image
                alt="picture of host"
                size="xl"
                rounded="full"
                source={{ uri: userAvater[0] ?? '' }}
              />
            ) : (
              <Box className="h-28 w-28 rounded-full bg-slate-500" />
            )}
            <Text bold size="2xl">
              {user?.first_name} {user?.last_name}
            </Text>
            {/* CREATE THIS IN DB */}
            <Text size="sm">@DevinBooker</Text>
            <Text size="sm">Joined in {dayjs(user?.created_at).format('YYYY')}</Text>
          </Flex>
        </Flex>
        <Flex direction="row" justify="space-between" className="mb-4">
          <Text size="2xl" bold>
            Events
          </Text>
          <Button variant="link">
            <Text>View All</Text>
          </Button>
        </Flex>
        <EventList events={data ?? []} loading={isLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}
type EventListProp = {
  events: UserEventCardRow[];
  loading: boolean;
};
function EventList({ events, loading }: EventListProp) {
  console.log(events[0]);

  if (loading) {
    <Text>Loading</Text>;
  }

  return (
    <Flex gap={8}>
      {events.map((event) => {
        return (
          <Flex key={event.id} direction="row" align="center" justify="space-between">
            <Flex direction="row" gap={4}>
              <Image alt="picture of host" size="sm" source={{ uri: event.cover_img ?? '' }} />
              <Flex>
                <Text bold>{event.title}</Text>
                <Text size="sm">{dayjs(event.starts_at).format('ddd, MMM DD, YYYY h:mm A')}</Text>
              </Flex>
            </Flex>
            <Badge variant={event.event_status == 'upcoming' ? 'primary' : 'muted'}>
              <Text
                bold
                size="xs"
                className={cn(
                  event.event_status == 'upcoming' ? 'text-green-600' : 'text-gray-400',
                  'uppercase'
                )}>
                {event.event_status}
              </Text>
            </Badge>
          </Flex>
        );
      })}
    </Flex>
  );
}
