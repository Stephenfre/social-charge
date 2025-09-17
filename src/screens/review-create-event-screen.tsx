import dayjs from 'dayjs';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button, Flex, Image, Text } from '~/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEventCreateStore } from '~/hooks';

export function ReviewCreateEventScreen() {
  const {
    name,
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
    <SafeAreaView className="h-full bg-background-dark p-4">
      <Image
        source={{
          uri: coverImageUri, // fallback
        }}
        size={'cover'}
        rounded={'lg'}
        alt="loaction image"
      />

      <Flex className="px-4" gap={6}>
        <Flex>
          <Text size="3xl" bold>
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
        {/* <Flex direction="row" align="center" gap={4}>
            {eventHosts.length ? (
              <>
                {eventHosts.map((host, i) => {
                  return (
                    <React.Fragment key={host.id}>
                      {hostAvatar && !hostAvatarLoading ? (
                        <Image
                          alt="picture of host"
                          rounded="full"
                          source={{ uri: hostAvatar[i] ?? '' }}
                        />
                      ) : (
                        <Box className="h-28 w-28 rounded-full bg-slate-500" />
                      )}
                      <Flex>
                        <Text bold size="xl">
                          {host.name}
                        </Text>
                        <Text>Host</Text>
                      </Flex>
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              <Text>Host not assigned yet</Text>
            )}
          </Flex> */}
        <Flex>
          <Text bold size="2xl">
            About this event
          </Text>
          <Text>{description}</Text>
        </Flex>
        {/* <Flex gap={2}>
            <Text bold size="2xl">
              Vibe Chack
            </Text>
            <Flex direction="row" gap={4} wrap="wrap">
              {event?.category?.map((cat) => (
                <Badge key={cat} variant="primary" className="rounded-lg px-4 py-1">
                  <Text size="sm" className="uppercase text-primary-300">
                    {cat}
                  </Text>
                </Badge>
              ))}
            </Flex>
          </Flex> */}
        {/* <Flex gap={2}>
            <Flex direction="row" align="center" gap={2}>
              <MessagesSquare color={'white'} size={20} />
              <Text bold size="2xl">
                Discussion
              </Text>
            </Flex>
            {dayjs().isBefore(eventStart.subtract(24, 'hour')) ? (
              <Text>Chat opens 24 hours before the event begins — join the conversation!</Text>
            ) : (
              <Text>Show discussion</Text>
            )}
          </Flex> */}
      </Flex>
      <Button>
        <Text>Create</Text>
      </Button>
    </SafeAreaView>
  );
}
