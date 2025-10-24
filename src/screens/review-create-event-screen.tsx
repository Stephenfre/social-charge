import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Calendar, Clock } from 'lucide-react-native';
import { Alert } from 'react-native';
import { Button, Flex, Image, Text } from '~/components/ui';
import { useEventCreateStore } from '~/hooks';
import { useUpsertEvent } from '~/hooks/useEvents';
import { useAuth } from '~/providers/AuthProvider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types/navigation.types';
import { Spinner } from '~/components/ui/spinner';
import { useTheme } from '~/providers/ThemeProvider';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

export function ReviewCreateEventScreen() {
  const { userId } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const { palette } = useTheme();

  const { mutateAsync: saveEvent, isPending } = useUpsertEvent(userId);
  const {
    eventId,
    title,
    hostId,
    hostName,
    ageLimit,
    description,
    location,
    startTime,
    endTime,
    capacity,
    creditCost,
    selectedInterests,
    coverImageUri,
    originalCoverPath,
    hasCoverChanged,
    reset,
  } = useEventCreateStore();

  const parseAgeLimit = parseInt(ageLimit, 10);

  const onSumbit = async () => {
    const coverPathToSave = hasCoverChanged() && coverImageUri ? coverImageUri : originalCoverPath;

    const eventDetails = {
      id: eventId,
      title,
      description,
      location_text: location?.locationText ?? '',
      formatted_address: location?.formattedAddress ?? '',
      provider: location?.provider ?? '',
      place_id: location?.placeId ?? '',
      longitude: location?.long,
      latitude: location?.lat,
      ageLimit: parseAgeLimit,
      startAtISO: startTime,
      endAtISO: endTime,
      capacity: Number(capacity),
      creditCost: Number(creditCost),
      category: selectedInterests ?? [],
      coverImageUri: coverPathToSave,
      hostId,
    };
    try {
      const result = await saveEvent(eventDetails);
      const nextId = eventId || result?.id; // prefer the fresh id
      if (!result || !nextId) return;

      if (!eventId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CreateEvent', params: { clear: true } }],
        });
        reset();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ViewEvent', params: { eventId: nextId } }],
        });
        reset();
      }
    } catch (error) {
      console.log('error', error);
      Alert.alert('failed to create event');
    }
  };

  return (
    <Flex flex className=" bg-background-dark p-4" justify="space-between">
      <Flex>
        <Image
          source={{
            uri: coverImageUri,
          }}
          size={'cover'}
          rounded={'lg'}
          alt="loaction image"
        />

        <Flex className="pt-4" gap={6}>
          <Flex gap={2}>
            <Text size="4xl" bold>
              {title}
            </Text>
            <Flex direction="row" gap={4}>
              <Flex direction="row" align="center" gap={2}>
                <Calendar color={palette.text} size={14} />
                <Text size="lg" style={{ color: palette.text }}>
                  {dayjs(startTime).format('ddd, MMM DD')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <Clock color={palette.text} size={14} />
                <Text size="lg" style={{ color: palette.text }}>
                  {dayjs(startTime).format('h:mm A')} - {dayjs(endTime).format('h:mm A')}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex>
            <Text size="xl" bold>
              Event Details:
            </Text>
            <Text size="md">Host: {hostName}</Text>
            <Text size="md">Capacity: {capacity}</Text>
            <Text size="md">Tokens: {creditCost}</Text>
            <Text size="md">Age Limit: {ageLimit}</Text>
            <Text size="md">
              Location: {location?.locationText} ({location?.formattedAddress})
            </Text>
          </Flex>
          <Flex>
            <Text size="xl" bold>
              Interests:
            </Text>
            {selectedInterests.map((interest) => {
              return <Text key={interest}>{interest}</Text>;
            })}
          </Flex>
          <Flex>
            <Text bold size="xl">
              Description
            </Text>
            <Text>{description}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Button variant="primary" size="xl" onPress={onSumbit}>
        {!isPending ? (
          <Text bold size="xl">
            {!eventId ? 'Create' : 'Update'}
          </Text>
        ) : (
          <Spinner />
        )}
      </Button>
    </Flex>
  );
}
