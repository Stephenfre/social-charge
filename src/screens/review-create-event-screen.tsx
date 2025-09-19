import dayjs from 'dayjs';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button, Flex, Image, Text } from '~/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEventCreateStore } from '~/hooks';

export function ReviewCreateEventScreen() {
  const {
    name,
    host,
    description,
    location,
    date,
    startTime,
    endTime,
    capacity,
    creditCost,
    selectedInterests,
    coverImageUri,
  } = useEventCreateStore();

  return (
    <Flex flex className=" bg-background-dark p-4" justify="space-between">
      <Flex>
        <Image
          source={{
            uri: coverImageUri, // fallback
          }}
          size={'cover'}
          rounded={'lg'}
          alt="loaction image"
        />

        <Flex className="pt-4" gap={6}>
          <Flex gap={2}>
            <Text size="4xl" bold>
              {/* CHANGE TO TITLE */}
              {name}
            </Text>
            <Flex direction="row" gap={4}>
              <Flex direction="row" align="center" gap={2}>
                <Calendar color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(startTime).format('ddd, MMM DD')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <Clock color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(endTime).format('h:mm A')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <MapPin color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {location}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Text bold size="xl">
            {host}
          </Text>
          <Flex>
            <Text bold size="2xl">
              About this event
            </Text>
            <Text>{description}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Button variant="primary" size="xl">
        <Text bold size="xl">
          Create
        </Text>
      </Button>
    </Flex>
  );
}
