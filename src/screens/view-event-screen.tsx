import dayjs from 'dayjs';
import { Calendar, Clock, Heart, MapPin, MessagesSquare, Share } from 'lucide-react-native';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { useEventById } from '~/hooks';

import { useRouteStack } from '~/types/navigation.types';

export default function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEventScreen'>();
  const { data, isLoading } = useEventById(params.eventId);

  if (isLoading) {
    <SafeAreaView className=" h-full bg-background-dark">
      <Text>Loading....</Text>
    </SafeAreaView>;
  }

  const eventHost = data?.event_hosts.map((host) => ({
    id: host.user.id,
    name: host.user.first_name + ' ' + host.user.last_name,
    profile_pic: host.user.profile_picture,
  }))[0];

  const eventRsvps = data?.rsvps.map((rsvp) => ({
    id: rsvp.user.id,
    name: rsvp.user.first_name + ' ' + rsvp.user.last_name,
    profile_pic: rsvp.user.profile_picture,
  }));

  const eventStart = dayjs(data?.starts_at);

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView>
        <View className="relative">
          <Image
            source={{
              uri: data?.cover_img ?? 'https://picsum.photos/800/400',
            }}
            size="cover"
            overlay={true}
            rounded="none"
            alt="image"
          />
          {/* Fade overlay */}
          <LinearGradient
            colors={['transparent', '#0F1012']} // transparent top → dark bottom
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 125, // how tall the fade should be
            }}
          />
        </View>
        <Flex className="px-4" gap={6}>
          <Flex>
            <Text size="3xl" bold>
              {data?.title}
            </Text>
            <Flex direction="row" gap={4}>
              <Flex direction="row" align="center" gap={2}>
                <Calendar color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(data?.starts_at).format('ddd, MMM DD')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <Clock color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(data?.starts_at).format('h:mm A')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <MapPin color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {data?.location}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex direction="row" align="center" gap={4}>
            {eventHost ? (
              <>
                <Box className="h-20 w-20 rounded-full bg-slate-500" />
                <Flex>
                  <Text bold size="xl">
                    {eventHost.name}
                  </Text>
                  <Text>Host</Text>
                </Flex>
              </>
            ) : (
              <Text>Host not assigned yet</Text>
            )}
          </Flex>
          <Button className=" bg-primary h-14">
            <Text bold size="2xl">
              RSVP 5$B
            </Text>
          </Button>
          <Flex>
            <Text bold size="2xl">
              About this event
            </Text>
            <Text>{data?.description}</Text>
          </Flex>
          <Flex gap={2}>
            <Text bold size="2xl">
              Vibe Chack
            </Text>
            {data?.category?.map((cat) => {
              return (
                <Button key={cat} variant="tag" className="h-7 w-24 rounded-lg" disabled={true}>
                  <Text weight="600" className="text-primary-200">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Button>
              );
            })}
          </Flex>
          <Flex gap={4}>
            <Text bold size="2xl">
              Attendees
            </Text>
            {eventRsvps?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Flex direction="row" align="center" gap={10}>
                  {eventRsvps?.map((rsvp) => {
                    return (
                      <Flex key={rsvp.id} align="center" gap={4}>
                        <Box className="h-28 w-28 rounded-full bg-slate-500" />
                        <Text>{rsvp.name}</Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </ScrollView>
            ) : (
              <Text>Be the first to RSVP!</Text>
            )}
          </Flex>
          <Flex gap={2}>
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
          </Flex>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}
