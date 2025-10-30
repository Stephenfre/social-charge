import React from 'react';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TicketX } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';
import { Countdown } from '~/components/Countdown/Countdown';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import {
  useStorageImages,
  useEventById,
  useEventVibes,
  useCheckIn,
  useUserCheckedInEvent,
} from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';
import { cn } from '~/utils/cn';
import { CancelRsvpButton } from './view-event-screen';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

export function EventCheckInScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const { params } = useRouteStack<'CheckInIndex'>();
  const eventIdParam = params?.eventId ?? null;

  const { data: event, isLoading: loadingEvent } = useEventById(eventIdParam ?? '');
  const effectiveEventId = event?.id ?? eventIdParam ?? null;

  const { data: eventVibes = [], isLoading: loadingEventVibes } = useEventVibes(effectiveEventId);
  const { data: userCheckedIn } = useUserCheckedInEvent(effectiveEventId);
  const { mutate: checkIn, isPending } = useCheckIn();

  const hostPaths = event?.event_hosts?.map((host) => host?.profile_picture ?? null) ?? [];
  const { data: hostAvatars = [], isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths,
  });

  const attendeePaths = event?.rsvps?.map((r) => r?.profile_picture ?? null) ?? [];
  const { data: attendeeAvatars = [], isLoading: attendeeAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: attendeePaths,
  });

  const { data: eventImage } = useStorageImages({
    bucket: 'event_cover',
    paths: [event?.cover_img],
  });

  const handlePressNavigateHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  const handlePressCheckIn = () => {
    if (!effectiveEventId) return;
    checkIn(effectiveEventId, {
      onSuccess: () => {
        Alert.alert('Success', 'You have checked into the event!');
      },
      onError: (err) => {
        Alert.alert('Check-in Failed', err.message ?? 'Something went wrong.');
      },
    });
  };

  const startsAt = event?.starts_at ? dayjs(event.starts_at) : null;
  const isUserAlreadyCheckedIn =
    !!effectiveEventId && !!user && !!userCheckedIn
      ? effectiveEventId === userCheckedIn.event_id && user.id === userCheckedIn.user_id
      : false;
  const isBeforeStart = startsAt ? dayjs().isBefore(startsAt) : false;
  const withinTwoHours = startsAt ? startsAt.diff(dayjs(), 'hour', true) <= 2 : false;

  if (!eventIdParam) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <Icon as={TicketX} size={'lg'} className="text-typography-light" />
            <Text bold size="2xl">
              Looks like your calendar's clear
            </Text>
            <Text size="sm">Time to find something worth showing up for.</Text>
          </Flex>
          <Button onPress={handlePressNavigateHome}>
            <Text bold>Find Events</Text>
          </Button>
        </Flex>
      </View>
    );
  }

  if (loadingEvent) {
    return (
      <View className="h-full bg-background-dark">
        <Text className="text-center text-typography-light">Loading...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <Icon as={TicketX} size={'lg'} className="text-typography-light" />
            <Text bold size="2xl">
              Event not found
            </Text>
            <Text size="sm">Try refreshing or choose another event.</Text>
          </Flex>
          <Button onPress={handlePressNavigateHome}>
            <Text bold>Back Home</Text>
          </Button>
        </Flex>
      </View>
    );
  }

  return (
    <View className="h-full bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Flex className="px-4" gap={8}>
          <Flex align="center" gap={1}>
            <Text bold size="2xl" className="text-center">
              You're almost there!
            </Text>
            <Text size="sm" className="text-center">
              Get within 100 meters of the event location to check in.
            </Text>
          </Flex>

          <Flex direction="row" gap={4} align="center">
            {eventImage?.[0] ? (
              <Image alt="picture of venue" size="sm" source={{ uri: eventImage[0] ?? '' }} />
            ) : (
              <Box className="h-16 w-16 rounded-lg bg-background-800" />
            )}
            <Flex>
              <Text bold>{event.title}</Text>
              <Text size="sm">
                {startsAt ? startsAt.format('ddd, MMM DD, YYYY h:mm A') : 'Date TBA'}
              </Text>
              {event.location_text && (
                <Text size="sm" className="text-typography-light">
                  {event.location_text}
                </Text>
              )}
            </Flex>
          </Flex>

          <Flex direction="row" gap={2} align="center">
            <Button
              size="xl"
              className={cn(
                'w-1/2',
                isBeforeStart || isUserAlreadyCheckedIn ? 'bg-gray-500' : 'bg-primary',
                withinTwoHours && 'w-full'
              )}
              onPress={handlePressCheckIn}
              disabled={isUserAlreadyCheckedIn || isBeforeStart || isPending}>
              <Flex align="center">
                <Text bold size="lg">
                  {isUserAlreadyCheckedIn ? 'Checked In' : 'Check In'}
                </Text>
                {event.starts_at && <Countdown to={event.starts_at} />}
              </Flex>
            </Button>
            {!withinTwoHours && event.id && (
              <CancelRsvpButton className="w-1/2 bg-background-light" eventId={event.id} />
            )}
          </Flex>

          <Flex direction="row" align="center" gap={4}>
            {event.event_hosts?.length ? (
              <>
                {event.event_hosts.map((host, index) => (
                  <React.Fragment key={`${host?.id ?? 'host'}-${index}`}>
                    {hostAvatars && !hostAvatarLoading ? (
                      <Image
                        alt="picture of host"
                        rounded="full"
                        source={{ uri: hostAvatars[index] ?? '' }}
                      />
                    ) : (
                      <Box className="h-28 w-28 rounded-full bg-slate-500" />
                    )}
                    <Flex>
                      <Text bold size="xl">
                        {`${host?.first_name ?? ''} ${host?.last_name ?? ''}`.trim() || 'Host'}
                      </Text>
                      <Text>Host</Text>
                    </Flex>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <Text>Host not assigned yet</Text>
            )}
          </Flex>

          <Flex>
            <Text bold size="2xl">
              About this event
            </Text>
            <Text>{event.description}</Text>
          </Flex>

          <Flex gap={4}>
            <Text bold size="2xl">
              Vibe Check
            </Text>
            {!loadingEventVibes ? (
              eventVibes.length ? (
                <Flex direction="row" flex wrap="wrap" gap={2}>
                  {eventVibes.map((vibe) => (
                    <Badge key={vibe.vibe_slug} variant="primary">
                      <Text size="sm" className="uppercase text-primary-300">
                        {vibe.vibe_slug}
                      </Text>
                    </Badge>
                  ))}
                </Flex>
              ) : (
                <Text>No vibes yet</Text>
              )
            ) : (
              <Text>Loading...</Text>
            )}
          </Flex>

          {user?.membership === 'basic' && (
            <Flex gap={4}>
              <Text bold size="2xl">
                Who's Going:
              </Text>
              {event.rsvps?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Flex direction="row" align="center" gap={6}>
                    {event.rsvps.map((rsvp, index) => (
                      <Flex key={`${rsvp?.user_id ?? 'attendee'}-${index}`} align="center" gap={4}>
                        {attendeeAvatars && !attendeeAvatarLoading ? (
                          <Image
                            alt="picture of guest"
                            source={{ uri: attendeeAvatars[index] ?? '' }}
                            rounded="full"
                            size="md"
                          />
                        ) : (
                          <Box className="h-28 w-28 rounded-full bg-slate-500" />
                        )}
                        <Text size="sm">
                          {`${rsvp?.first_name ?? ''} ${rsvp?.last_name ?? ''}`.trim() || 'Guest'}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </ScrollView>
              ) : (
                <Text>Be the first to RSVP!</Text>
              )}
            </Flex>
          )}

          <Flex gap={2}>
            <Text bold size="xl">
              Perfect if you're into...
            </Text>
            <Flex direction="row" gap={4} wrap="wrap">
              {event.category?.map((cat) => (
                <Badge key={cat} variant="primary">
                  <Text size="sm" className="uppercase text-primary-300">
                    {cat}
                  </Text>
                </Badge>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
    </View>
  );
}
