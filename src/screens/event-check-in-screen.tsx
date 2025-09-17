import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { MessagesSquare, TicketX } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';
import { Map } from '~/components';
import { Countdown } from '~/components/Countdown/Countdown';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import { useRsvps, useStorageImages } from '~/hooks';
import { useCheckInEvent } from '~/hooks/useEvents';
import { useAuth } from '~/providers/AuthProvider';
import { PersonCard } from '~/types/event.types';
import { RootStackParamList } from '~/types/navigation.types';
import { cn } from '~/utils/cn';
import { CancelRsvpButton } from './view-event-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

export function EventCheckInScreen() {
  const navigation = useNavigation<HomeNav>();

  const { user } = useAuth();
  const { data: event, isLoading: loadingEvent } = useCheckInEvent();

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

  const isNotStartTime = dayjs().isBefore(dayjs(checkInEvent?.starts_at));

  const evenRsvpsPaths = eventRsvps.map((r) => r.profile_pic);
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: evenRsvpsPaths,
  });

  const handlePressNavigateToViewEvent = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  if (loadingEvent) {
    return (
      <SafeAreaView className="h-full bg-background-dark">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!checkInEvent) {
    return (
      <SafeAreaView className="h-full bg-background-dark">
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
      </SafeAreaView>
    );
  }

  const startsAt = dayjs(checkInEvent.starts_at);
  const now = dayjs();
  const withinTwoHours = startsAt.diff(now, 'hour', true) <= 2; // true = fractional hours

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView>
        <Flex flex={true} className="px-4" gap={8}>
          <Text className="text-black">hi</Text>
          <Map height={350} />
          <Flex>
            <Text bold size="2xl" className="text-center">
              You're almost there!
            </Text>
            <Text size="sm" className="text-center">
              Get within 100 meters of the event location to check in.
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="center">
            <Image
              alt="picture of venue"
              size="sm"
              source={{ uri: checkInEvent?.cover_img ?? '' }}
            />
            <Flex>
              <Text bold>{checkInEvent?.title}</Text>
              <Text size="sm">
                {dayjs(checkInEvent?.starts_at).format('ddd, MMM DD, YYYY h:mm A')}
              </Text>
            </Flex>
          </Flex>
          <Flex direction="row" gap={2} align="center">
            <Button
              className={cn(isNotStartTime ? 'bg-gray-500' : 'bg-primary', 'h-14 w-1/2')}
              onPress={() => {
                console.log('pressed');
              }}
              disabled={isNotStartTime}>
              <Flex align="center">
                <Text bold size="lg">
                  Check In
                </Text>
                {checkInEvent && (
                  <Countdown
                    to={checkInEvent?.starts_at}
                    onComplete={() => console.log('Event started!')}
                  />
                )}
              </Flex>
            </Button>
            {!withinTwoHours && (
              <CancelRsvpButton className="w-1/2" eventId={checkInEvent.id} userId={user.id} />
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
          <Flex gap={2}>
            <Text bold size="2xl">
              Vibe Chack
            </Text>
            <Flex direction="row" gap={4} wrap="wrap">
              {checkInEvent?.category?.map((cat) => (
                <Badge key={cat} variant="primary" className="rounded-lg px-4 py-1">
                  <Text size="sm" className="uppercase text-primary-300">
                    {cat}
                  </Text>
                </Badge>
              ))}
            </Flex>
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
          {/* <Flex gap={2} className="pb-4">
            <Flex direction="row" align="center" gap={2}>
              <MessagesSquare color={'white'} size={20} />
              <Text bold size="2xl">
                Discussion
              </Text>
            </Flex>
            {dayjs().isBefore(dayjs(checkInEvent?.starts_at).subtract(24, 'hour')) ? (
              <Text>Chat opens 24 hours before the event begins — join the conversation!</Text>
            ) : (
              <Text>Show discussion</Text>
            )}
          </Flex> */}
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}
