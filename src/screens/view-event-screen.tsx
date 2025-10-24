import dayjs from 'dayjs';
import { Calendar, Clock, MapPin, MessagesSquare, TicketX } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useStorageImages } from '~/hooks';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';
import { PersonCard } from '~/types/event.types';
import { useRsvps, useCreateRsvp, useRemoveRsvp } from '~/hooks/useRsvps';
import { useAuth } from '~/providers/AuthProvider';
import { Spinner } from '~/components/ui/spinner';
import { EventCard } from '~/components/EventCard/EventCard';
import React from 'react';
import { cn } from '~/utils/cn';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDeleteEvent, useEventVibes } from '~/hooks/useEvents';

type EventNav = NativeStackNavigationProp<RootStackParamList, 'CreateEvent', 'EventReview'>;

// TODO: WHEN YOU CLICK VIEW ALL GO TO A SCREEN WIITH SCROLLABLE DATES AND FILTERS

export function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEvent'>();
  const navigation = useNavigation<EventNav>();

  const { userId, user } = useAuth();
  const { data: event, isLoading } = useEventById(params.eventId);
  const { data: eventVibes = [], isLoading: loadingEventVibes } = useEventVibes(params.eventId);
  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);
  const { mutate: deleteEvent, isPending } = useDeleteEvent();

  const isRsvped = rsvps.some((r) => r.user_id === userId);

  const hostPaths = event?.event_hosts?.map((host) => host.profile_picture);
  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths ?? [], // stored in users table
  });

  const evenRsvpsPaths = event?.rsvps?.map((r) => r.profile_picture);
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: evenRsvpsPaths ?? [],
  });

  const handlePressNavigate = (type: string) => {
    switch (type) {
      case 'CreateEvent':
        navigation.navigate('CreateEvent', { eventId: event?.id ?? '' });
        break;
      case 'EventReview':
        navigation.navigate('EventReview', { eventId: event?.id ?? '' });
        break;
      default:
        console.warn(`Unknown navigation type: ${type}`);
        break;
    }
  };

  const handlePressDeleteEvent = () => {
    deleteEvent(params.eventId, {
      onError: () => Alert.alert('Failed to delete event'),
      onSuccess: () => Alert.alert('Event was deleted'),
    });
    navigation.goBack();
  };

  const isHost = event?.event_hosts?.some((host) => host?.id === userId);

  const isEventOver = dayjs().isAfter(event?.ends_at);

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = user?.role === 'super_admin';
  const isEventDeleted = event?.deleted_at;

  if (isLoading) {
    return (
      <View className=" h-full bg-background-dark">
        <Text>Loading....</Text>
      </View>
    );
  }

  if (isEventDeleted) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <TicketX size={48} color={'white'} />
            <Text bold size="2xl">
              Sorry this event is unavailable
            </Text>
          </Flex>
          <Button
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' as never }],
              })
            }>
            <Text bold>Find Events</Text>
          </Button>
        </Flex>
      </View>
    );
  }

  return (
    <View className="h-full bg-background-dark">
      <ScrollView>
        <View className="relative">
          <EventCard
            event={event!}
            favorited={event?.event_hosts?.some((host) => host?.id !== userId)}
            imageSize="cover"
            rounded="none"
            showDate={false}
            showLocation={false}
            showTitle={false}
            showToken={false}
          />
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
              {event?.title}
            </Text>

            <Flex direction="row" gap={4} wrap="wrap">
              <Flex direction="row" align="center" gap={2}>
                <Calendar color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(event?.starts_at).format('ddd, MMM DD')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <Clock color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(event?.starts_at).format('h:mm A')} -{' '}
                  {dayjs(event?.ends_at).format('h:mm A')}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <MapPin color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {event?.location_text}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex direction="row" align="center" gap={4}>
            {event?.event_hosts?.length ? (
              <>
                {event?.event_hosts?.map((host, i) => {
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
                          {host.first_name + ' ' + host.last_name}
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
          </Flex>

          {!isEventOver ? (
            <Flex direction="row" flex justify="space-between">
              {!isHost &&
                (!isRsvped ? (
                  <RsvpButton
                    userId={userId ?? ''}
                    eventId={params.eventId}
                    isLoading={rsvpLoading}
                    canEdit={canEdit}
                  />
                ) : (
                  <CancelRsvpButton
                    canEdit={canEdit}
                    userId={userId ?? ''}
                    eventId={params.eventId}
                  />
                ))}
              {canEdit && (
                <Button
                  className="h-14 w-['48%']"
                  variant="outline"
                  onPress={() => handlePressNavigate('CreateEvent')}>
                  <Text bold size="lg">
                    Edit
                  </Text>
                </Button>
              )}
            </Flex>
          ) : (
            <Flex gap={2}>
              <Text alert bold className="text-center">
                This Event Has Ended
              </Text>
              <Button
                className=" h-14"
                variant="solid"
                onPress={() => handlePressNavigate('EventReview')}>
                <Text bold className="text-gray-200">
                  Review Event
                </Text>
              </Button>
            </Flex>
          )}
          <Flex>
            <Text bold size="2xl">
              About this event
            </Text>
            <Text>{event?.description}</Text>
          </Flex>

          <Flex gap={4}>
            <Text bold size="2xl">
              Vibe Check
            </Text>
            {eventVibes.length ? (
              <Flex direction="row" flex wrap="wrap" gap={2}>
                {eventVibes.map((vibe) => {
                  return (
                    <Badge key={vibe.vibe_slug} variant="primary">
                      <Text size="sm" className="uppercase text-primary-300" key={vibe.vibe_slug}>
                        {vibe.vibe_slug}
                      </Text>
                    </Badge>
                  );
                })}
              </Flex>
            ) : (
              <Text>Rvsp to chage the vibe</Text>
            )}
          </Flex>

          {user?.membership !== 'basic' && (
            <Flex gap={4}>
              <Text bold size="2xl">
                Attendees
              </Text>
              {event?.rsvps?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Flex direction="row" align="center" gap={10}>
                    {event?.rsvps?.map((rsvp, i) => {
                      return (
                        <Flex key={rsvp.user_id} align="center" gap={4}>
                          {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                            <Image
                              key={rsvp.user_id}
                              alt="picture of guest"
                              source={{ uri: eventRsvpsAvatar[i] ?? '' }}
                              rounded="full"
                              size="xl"
                            />
                          ) : (
                            <Box className="h-28 w-28 rounded-full bg-slate-500" />
                          )}
                          <Text>{rsvp.first_name + ' ' + rsvp.last_name}</Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </ScrollView>
              ) : (
                <Text>Be the first to RSVP!</Text>
              )}
            </Flex>
          )}
          <Flex gap={2}>
            <Text bold size="xl">
              Perfect if you’re into…
            </Text>
            <Flex direction="row" gap={4} wrap="wrap">
              {event?.category?.map((cat) => (
                <Badge key={cat} variant="primary">
                  <Text size="sm" className="uppercase text-primary-300">
                    {cat}
                  </Text>
                </Badge>
              ))}
            </Flex>
          </Flex>
          {canDelete && !isEventOver && (
            <Button disabled={isPending} variant="alert" onPress={handlePressDeleteEvent}>
              {!isPending ? (
                <Text bold size="lg">
                  Delete
                </Text>
              ) : (
                <Spinner />
              )}
            </Button>
          )}
        </Flex>
      </ScrollView>
    </View>
  );
}

function RsvpButton({
  eventId,
  userId,
  isLoading,
  canEdit,
}: {
  eventId: string;
  userId: string;
  isLoading: boolean;
  canEdit: boolean;
}) {
  const { mutate: createRsvp, isPending } = useCreateRsvp();

  const label = isPending ? <Spinner /> : 'Rsvp';
  const onSubmit = () =>
    createRsvp({ eventId, userId }, { onError: () => Alert.alert('Something went wrong') });

  return (
    <Button
      className={cn('h-14 w-full bg-primary', canEdit && 'w-[48%]')}
      onPress={onSubmit}
      disabled={isLoading || isPending}>
      <Text bold size="lg">
        {label}
      </Text>
    </Button>
  );
}

export function CancelRsvpButton({
  eventId,
  className,
  canEdit,
}: {
  eventId: string;
  userId: string | undefined;
  className?: string;
  canEdit?: boolean;
}) {
  const { mutate: removeRsvp, isPending } = useRemoveRsvp();

  const label = isPending ? <Spinner /> : 'Cancel Rsvp';

  const onCancelSubmit = () => {
    removeRsvp(
      { eventId },
      {
        onError: () => Alert.alert('Failed to cancel RSVP'),
        onSuccess: () => Alert.alert('Your RSVP was removed'),
      }
    );
  };

  return (
    <Button
      size="xl"
      variant="primary"
      className={cn(className ? className : 'w-full', canEdit && 'w-[48%]')}
      onPress={onCancelSubmit}
      disabled={isPending}>
      <Text bold size="lg">
        {label}
      </Text>
    </Button>
  );
}
