import React from 'react';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TicketX } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';
import { Map } from '~/components';
import { Countdown } from '~/components/Countdown/Countdown';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';

import { useStorageImages } from '~/hooks';
import {
  useViewCheckInEvent,
  useEventVibes,
  useCheckIn,
  useUserCheckedInEvent,
} from '~/hooks/useEvents';
import { useAuth } from '~/providers/AuthProvider';
import { PersonCard } from '~/types/event.types';
import { RootStackParamList } from '~/types/navigation.types';
import { cn } from '~/utils/cn';
import { CancelRsvpButton } from './view-event-screen';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

export function EventCheckInScreen() {
  const navigation = useNavigation<HomeNav>();

  const { user } = useAuth();
  const { data: event, isLoading: loadingEvent } = useViewCheckInEvent();
  const { data: eventVibes = [], isLoading: loadingEventVibes } = useEventVibes(event?.event.id!);
  const { data: userCheckedIn, isLoading: loadingUserCheckedIn } = useUserCheckedInEvent(
    event?.event.id!
  );
  const { mutate: checkIn, isPending } = useCheckIn();

  const checkInEvent = event?.event;
  const host = event?.hosts;
  const attendees = event?.attendees;

  const eventHosts: PersonCard[] =
    host?.map((host) => ({
      id: host.user.id,
      name: host.user.first_name + ' ' + host.user.last_name,
      profile_pic: host.user.profile_picture,
    })) ?? [];

  const eventRsvps: PersonCard[] | undefined =
    attendees?.map((rsvp) => ({
      id: rsvp.user.id,
      name: rsvp.user.first_name + ' ' + rsvp.user.last_name,
      profile_pic: rsvp.user.profile_picture,
    })) ?? [];

  const hostPaths = eventHosts.map((host) => host.profile_pic);

  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths, // stored in users table
  });

  const evenRsvpsPaths = eventRsvps.map((r) => r.profile_pic);
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: evenRsvpsPaths,
  });

  const { data: eventImage, isLoading } = useStorageImages({
    bucket: 'event_cover',
    paths: [checkInEvent?.cover_img], // stored in users table
  });

  const handlePressNavigateToViewEvent = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  const handlePressCheckIn = () => {
    if (!event?.event.id) return;
    checkIn(event.event.id, {
      onSuccess: () => {
        Alert.alert('Success', 'You have checked into the event!');
      },
      onError: (err) => {
        Alert.alert('Check-in Failed', err.message ?? 'Something went wrong.');
      },
    });
  };

  const eventId = checkInEvent?.id;

  const isNotStartTime = dayjs().isBefore(dayjs(checkInEvent?.starts_at));
  const isAfterStartTime = dayjs().isAfter(dayjs(checkInEvent?.starts_at));
  const isUserCheckedIn =
    eventId === userCheckedIn?.event_id && user?.id === userCheckedIn?.user_id;

  if (loadingEvent) {
    return (
      <View className="h-full bg-background-dark">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!checkInEvent) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <TicketX size={48} color={'white'} />
            <Text bold size="2xl">
              Looks like your calendar’s clear
            </Text>
            <Text size="sm">Time to find something worth showing up for.</Text>
          </Flex>
          <Button onPress={handlePressNavigateToViewEvent}>
            <Text bold>Find Events</Text>
          </Button>
        </Flex>
      </View>
    );
  }

  const checkedInText = !isUserCheckedIn ? 'Check In' : 'Checked In';

  const startsAt = dayjs(checkInEvent.starts_at);
  const now = dayjs();
  const withinTwoHours = startsAt.diff(now, 'hour', true) <= 2;

  return (
    <View className="h-full bg-background-dark">
      <ScrollView>
        <Flex flex={true} className="px-4" gap={8}>
          <Map
            height={350}
            location={{
              latitude: checkInEvent.latitude ?? undefined,
              longitude: checkInEvent.longitude ?? undefined,
            }}
          />
          <Flex>
            <Text bold size="2xl" className="text-center">
              You're almost there!
            </Text>
            <Text size="sm" className="text-center">
              Get within 100 meters of the event location to check in.
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="center">
            <Image alt="picture of venue" size="sm" source={{ uri: eventImage?.[0] ?? '' }} />
            <Flex>
              <Text bold>{checkInEvent?.title}</Text>
              <Text size="sm">
                {dayjs(checkInEvent?.starts_at).format('ddd, MMM DD, YYYY h:mm A')}
              </Text>
            </Flex>
          </Flex>
          <Flex direction="row" gap={2} align="center">
            <Button
              size="xl"
              className={cn(
                'w-1/2',
                isNotStartTime || isUserCheckedIn ? 'bg-gray-500' : 'bg-primary',
                withinTwoHours && 'w-full'
              )}
              onPress={handlePressCheckIn}
              disabled={isNotStartTime || isUserCheckedIn}>
              <Flex align="center">
                <Text bold size="lg">
                  {!isAfterStartTime ? checkedInText : 'Event Started'}
                </Text>
                {checkInEvent && <Countdown to={checkInEvent?.starts_at} />}
              </Flex>
            </Button>
            {!withinTwoHours && (
              <CancelRsvpButton className="w-1/2" eventId={checkInEvent.id} userId={user?.id} />
            )}
          </Flex>
          <Flex direction="row" align="center" gap={4}>
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
          </Flex>
          <Flex>
            <Text bold size="2xl">
              About this event
            </Text>
            <Text>{checkInEvent?.description}</Text>
          </Flex>
          <Flex gap={4}>
            <Text bold size="2xl">
              Vibe Check
            </Text>
            {!loadingEventVibes ? (
              <>
                {eventVibes.length ? (
                  <Flex direction="row" flex wrap="wrap" gap={2}>
                    {eventVibes.map((vibe) => {
                      return (
                        <Badge key={vibe.vibe_slug} variant="primary">
                          <Text
                            size="sm"
                            className="uppercase text-primary-300"
                            key={vibe.vibe_slug}>
                            {vibe.vibe_slug}
                          </Text>
                        </Badge>
                      );
                    })}
                  </Flex>
                ) : (
                  <Text>No Vibes</Text>
                )}
              </>
            ) : (
              <Text>Loading...</Text>
            )}
          </Flex>

          {user?.membership === 'basic' && (
            <Flex gap={4}>
              <Text bold size="2xl">
                Who's Going:
              </Text>
              {attendees?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Flex direction="row" align="center" gap={6}>
                    {eventRsvps?.map((rsvp, i) => {
                      return (
                        <Flex key={rsvp.id} align="center" gap={4}>
                          {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                            <Image
                              key={rsvp.id}
                              alt="picture of guest"
                              source={{ uri: eventRsvpsAvatar[i] ?? '' }}
                              rounded="full"
                              size="md"
                            />
                          ) : (
                            <Box className="h-28 w-28 rounded-full bg-slate-500" />
                          )}
                          <Text size="sm">{rsvp.name}</Text>
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
              {checkInEvent?.category?.map((cat) => (
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
