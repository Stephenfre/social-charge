import dayjs from 'dayjs';
import { cn } from '~/utils/cn';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types/navigation.types';
import { UserEventCardRow } from '~/types/event.types';
import { Badge, Flex, Image, Pressable, Text } from '../ui';
import { useNavigation } from '@react-navigation/native';

type EventsListProp = {
  events: UserEventCardRow[];
  loading: boolean;
};

type ViewEventNav = NativeStackNavigationProp<RootStackParamList, 'ViewEvent'>;

export function EventsList({ events, loading }: EventsListProp) {
  const navigation = useNavigation<ViewEventNav>();

  const handlePressNavigateToViewEvent = (eventId: string | null) => {
    if (!eventId) return;
    navigation.navigate('ViewEvent', { eventId });
  };

  if (loading) {
    <Text>Loading</Text>;
  }

  return (
    <Flex gap={8}>
      {events.map((event) => {
        const isCurrentEvent =
          dayjs(event.starts_at).isSame(dayjs(), 'day') && dayjs().isBefore(event.ends_at);

        return (
          <Pressable key={event.id} onPress={() => handlePressNavigateToViewEvent(event.id)}>
            <Flex direction="row" align="center" justify="space-between">
              <Flex direction="row" gap={4} align="center">
                <Image alt="picture of host" size="sm" source={{ uri: event.cover_img ?? '' }} />
                <Flex>
                  <Text bold>{event.title}</Text>
                  <Text size="sm">{dayjs(event.starts_at).format('ddd, MMM DD, YYYY h:mm A')}</Text>
                </Flex>
              </Flex>
              <Badge
                variant={cn(
                  isCurrentEvent
                    ? 'primary'
                    : event.event_status == 'upcoming'
                      ? 'secondary'
                      : 'muted'
                )}>
                <Text
                  bold
                  size="xs"
                  className={cn(
                    isCurrentEvent
                      ? 'text-primary-300'
                      : event.event_status == 'upcoming'
                        ? 'text-green-600'
                        : 'text-gray-400',
                    'uppercase'
                  )}>
                  {isCurrentEvent ? 'TODAY' : event.event_status}
                </Text>
              </Badge>
            </Flex>
          </Pressable>
        );
      })}
    </Flex>
  );
}
