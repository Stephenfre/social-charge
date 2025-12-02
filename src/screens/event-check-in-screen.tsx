import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Calendar, Clock, MapPin, TicketX } from 'lucide-react-native';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Countdown } from '~/components/Countdown/Countdown';
import { EventCard } from '~/components/EventCard/EventCard';
import { Map } from '~/components/Map/Map';
import { Badge, Box, Button, Flex, Image, Pressable, Text } from '~/components/ui';
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
import { UserCheckInQr } from '~/components';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

export function EventCheckInScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
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
  const [isUserCheckInModalVisible, setIsUserCheckInModalVisible] = useState(false);

  const handlePressNavigateHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  const handleUserCheckInPress = () => {
    setIsUserCheckInModalVisible(true);
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

  const formattedDate = startsAt ? startsAt.format('ddd, MMM DD') : null;
  const formattedTimeRange = startsAt ? `${startsAt.format('h:mm A')}` : null;
  const mapLocation = {
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
  };

  return (
    <Flex flex className="bg-background-dark">
      <Flex className="relative">
        <Pressable
          className="absolute left-4 top-20 z-10"
          hitSlop={16}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={28} color="#fff" />
        </Pressable>
        <EventCard
          event={event}
          overlay
          imageSize="background"
          rounded="none"
          showDate={false}
          showLocation={false}
          showTitle={false}
          showToken={false}
        />
      </Flex>

      <BottomSheet
        index={0}
        snapPoints={['70%', '75%']}
        enablePanDownToClose={false}
        enableOverDrag={false}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        backgroundStyle={{
          backgroundColor: '#0F1012',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 48,
          }}>
          <Flex className="px-4" gap={8}>
            <Flex gap={3}>
              <Text size="5xl" bold>
                {event.title}
              </Text>
              <Flex direction="row" align="center" gap={3} wrap="wrap">
                {formattedDate && (
                  <Flex direction="row" align="center" gap={2}>
                    <Icon as={Calendar} size={'lg'} className="text-typography-light" />
                    <Text size="lg">{formattedDate}</Text>
                  </Flex>
                )}
                {formattedTimeRange && (
                  <Flex direction="row" align="center" gap={2}>
                    <Icon as={Clock} size={'lg'} className="text-typography-light" />
                    <Text size="lg">{formattedTimeRange}</Text>
                  </Flex>
                )}
                {event.location_text && (
                  <Flex direction="row" align="center" gap={2}>
                    <Icon as={MapPin} size={'lg'} className="text-typography-light" />
                    <Text size="lg">{event.location_text}</Text>
                  </Flex>
                )}
              </Flex>
            </Flex>

            <Map location={mapLocation} height={220} rounded />

            <Flex direction="row" gap={2} align="center">
              {user?.role === 'user' ? (
                <>
                  <Button
                    size="xl"
                    className={cn(
                      'w-1/2',
                      isBeforeStart || isUserAlreadyCheckedIn ? 'bg-gray-500' : 'bg-primary',
                      withinTwoHours && 'w-full'
                    )}
                    onPress={handleUserCheckInPress}
                    disabled={isUserAlreadyCheckedIn || isBeforeStart || isPending}>
                    <Flex align="center">
                      <Text bold size="lg">
                        {isUserAlreadyCheckedIn ? 'Checked In' : 'Check In'}
                      </Text>
                      {event.starts_at && <Countdown to={event.starts_at} />}
                    </Flex>
                  </Button>
                  {!withinTwoHours && event.id && (
                    <CancelRsvpButton
                      className="w-1/2 bg-background-dark"
                      eventId={event.id}
                      tokenCost={event.token_cost ?? 0}
                      eventTitle={event.title ?? ''}
                      eventStartsAt={event.starts_at ?? null}
                    />
                  )}
                </>
              ) : (
                <Button
                  size="xl"
                  className={cn(
                    'w-1/2',
                    isBeforeStart || isUserAlreadyCheckedIn ? 'bg-gray-500' : 'bg-primary',
                    withinTwoHours && 'w-full'
                  )}
                  onPress={() => console}
                  disabled={isUserAlreadyCheckedIn || isBeforeStart || isPending}>
                  <Flex align="center">
                    <Text bold size="lg">
                      Scan Qr code
                    </Text>
                    {event.starts_at && <Countdown to={event.starts_at} />}
                  </Flex>
                </Button>
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
                        <Flex
                          key={`${rsvp?.user_id ?? 'attendee'}-${index}`}
                          align="center"
                          gap={4}>
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
        </BottomSheetScrollView>
      </BottomSheet>
      <Modal
        animationType="slide"
        transparent
        visible={isUserCheckInModalVisible}
        onRequestClose={() => setIsUserCheckInModalVisible(false)}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onPress={() => setIsUserCheckInModalVisible(false)}
        />
        <View className="flex-1 justify-end">
          <Flex
            className="h-96 w-full rounded-[24] bg-background-dark px-4 py-6"
            align="center"
            justify="center"
            gap={4}>
            <Text bold size="xl">
              Welcome
            </Text>
            <Text size="sm">Show QR code to checkIn</Text>
            <UserCheckInQr eventId={event.id!} size={160} />

            <Pressable onPress={() => setIsUserCheckInModalVisible(false)}>
              <Text bold size="md">
                Close
              </Text>
            </Pressable>
          </Flex>
        </View>
      </Modal>
    </Flex>
  );
}
