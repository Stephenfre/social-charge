import dayjs from 'dayjs';
import { Calendar, Clock, MapPin, MessagesSquare } from 'lucide-react-native';
import { Alert, SafeAreaView, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useStorageImages } from '~/hooks';
import { useRouteStack } from '~/types/navigation.types';
import { EventWithJoins, PersonCard } from '~/types/event.types';
import { useRsvps, useCreateRsvp, useRemoveRsvp } from '~/hooks/useRsvps';
import { useAuth } from '~/providers/AuthProvider';
import { Spinner } from '~/components/ui/spinner';
import { EventCard } from '~/components/EventCard/EventCard';

export default function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEventScreen'>();
  const { data, isLoading } = useEventById(params.eventId);
  const { userId } = useAuth();
  const event = data as unknown as EventWithJoins;

  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);

  const isRsvped = rsvps.some((r) => r.user_id === userId);

  if (isLoading) {
    <SafeAreaView className=" h-full bg-background-dark">
      <Text>Loading....</Text>
    </SafeAreaView>;
  }

  const eventHosts: PersonCard[] =
    event?.event_hosts.map((host) => ({
      id: host.user.id,
      name: host.user.first_name + ' ' + host.user.last_name,
      profile_pic: host.user.profile_picture,
    })) ?? [];

  const eventRsvps: PersonCard[] | undefined =
    event?.rsvps.map((rsvp) => ({
      id: rsvp.user.id,
      name: rsvp.user.first_name + ' ' + rsvp.user.last_name,
      profile_pic: rsvp.user.profile_picture,
    })) ?? [];

  const eventHost: PersonCard | undefined = eventHosts[0];

  const hostPaths = eventHost?.profile_pic;
  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: [hostPaths], // stored in users table
  });

  const evenRsvpsPaths = eventRsvps.map((r) => r.profile_pic);
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: evenRsvpsPaths,
  });

  const eventStart = dayjs(data?.starts_at);
  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView>
        <View className="relative">
          <EventCard
            event={event}
            favorited={userId !== eventHost?.id ? true : false}
            imageSize="cover"
            rounded="none"
            showDate={false}
            showLocation={false}
            showTitle={false}
            showToken={false}
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
                {hostAvatar && !hostAvatarLoading ? (
                  <Image
                    alt="picture of host"
                    rounded="full"
                    source={{ uri: hostAvatar[0] ?? '' }}
                  />
                ) : (
                  <Box className="h-28 w-28 rounded-full bg-slate-500" />
                )}
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
          {userId !== eventHost?.id && (
            <>
              {!isRsvped ? (
                <RsvpButton
                  userId={userId ?? ''}
                  eventId={params.eventId}
                  isLoading={rsvpLoading}
                />
              ) : (
                <CancelRsvpButton userId={userId ?? ''} eventId={params.eventId} />
              )}
            </>
          )}
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
                  {eventRsvps?.map((rsvp, i) => {
                    return (
                      <Flex key={rsvp.id} align="center" gap={4}>
                        {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                          <Image
                            key={rsvp.id}
                            alt="picture of guest"
                            source={{ uri: eventRsvpsAvatar[i] ?? '' }}
                            rounded="full"
                            size="xl"
                          />
                        ) : (
                          <Box className="h-28 w-28 rounded-full bg-slate-500" />
                        )}
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

function RsvpButton({
  eventId,
  userId,
  isLoading,
}: {
  eventId: string;
  userId: string;
  isLoading: boolean;
}) {
  const createRsvp = useCreateRsvp();

  const label = createRsvp.isPending ? <Spinner /> : 'Rsvp';
  const onSubmit = () =>
    createRsvp.mutate({ eventId, userId }, { onError: () => Alert.alert('Something went wrong') });

  return (
    <Button
      className=" h-14 bg-primary"
      onPress={onSubmit}
      disabled={isLoading || createRsvp.isPending}>
      <Text bold size="xl">
        {label}
      </Text>
    </Button>
  );
}

function CancelRsvpButton({ eventId, userId }: { eventId: string; userId: string }) {
  const removeRsvp = useRemoveRsvp();

  const label = removeRsvp.isPending ? <Spinner /> : 'Cancel Rsvp';

  const onCancelSubmit = () => {
    removeRsvp.mutate(
      { eventId, userId },
      {
        onError: () => Alert.alert('Failed to cancel RSVP'),
        onSuccess: () => Alert.alert('Your RSVP was removed'),
      }
    );
  };

  return (
    <Button className=" h-14 bg-primary" onPress={onCancelSubmit} disabled={removeRsvp.isPending}>
      <Text bold size="xl">
        {label}
      </Text>
    </Button>
  );
}
