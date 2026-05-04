import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowLeft, Calendar, Clock, MapPin, TicketX } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventCard } from '~/components/EventCard/EventCard';
import { PremiumBlurGate } from '~/components/PremiumBlurGate';

import { Badge, Box, Button, Divider, Flex, Image, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import { Spinner } from '~/components/ui/spinner';
import { REVENUECAT_ENTITLEMENT, REVENUECAT_VIRTUAL_CURRENCY_CODE } from '~/config/revenuecat';
import {
  useCancelWaitlist,
  useCreditBalance,
  useEventById,
  useJoinWaitlist,
  useMyWaitlistEntry,
  REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS,
  useEventReview,
  useStorageImages,
  useWaitlistPosition,
} from '~/hooks';
import { useEventVibes } from '~/hooks/useEvents';
import { useRsvps } from '~/hooks/useRsvps';
import { TOKEN_QUERY_KEYS } from '~/hooks/useTokens';
import { WAITLIST_KEYS } from '~/hooks/useWaitlist';
import { EVENT_KEYS } from '~/hooks/useEvents';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { useRevenueCat } from '~/providers/RevenueCatProvider';
import { EventReviewContent } from './event-review-screen';
import {
  cancelEventLocalNotifications,
  notifyCreditRefund,
  notifyLowCreditsAfterRsvp,
  scheduleRsvpLocalNotifications,
} from '~/utils/localNotifications';

import { cn } from '~/utils/cn';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';
import type { VEventWithFullDetails } from '~/types/event.types';

type EventNav = NativeStackNavigationProp<RootStackParamList, 'CreateEvent', 'EventReview'>;
type ConfirmationMode = 'rsvp' | 'waitlist';
type CancellationReason = 'schedule_conflict' | 'not_interested' | 'cost' | 'other';

const CANCELLATION_REASONS: { label: string; value: CancellationReason }[] = [
  { label: 'Schedule conflict', value: 'schedule_conflict' },
  { label: 'No longer interested', value: 'not_interested' },
  { label: 'Credit cost', value: 'cost' },
  { label: 'Other', value: 'other' },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : null;
    const message = 'message' in error && typeof error.message === 'string' ? error.message : null;
    const detail = 'detail' in error && typeof error.detail === 'string' ? error.detail : null;
    const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint : null;

    if (code === '23505') {
      return "You're already on the waitlist for this event.";
    }

    return [message, detail, hint].filter(Boolean).join('\n') || fallback;
  }

  return fallback;
}

export function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEvent'>();
  const navigation = useNavigation<EventNav>();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%', '90%'], []);
  const SMALL_SCREEN_WIDTH = 390;

  const { session, userId } = useAuth();
  const {
    presentPaywall,
    presentPlacementPaywall,
    loadingOfferings,
    isPro,
    initialized: revenueCatInitialized,
    refreshCustomerInfo,
  } = useRevenueCat();
  const { data: event, isLoading } = useEventById(params.eventId);
  const { data: eventVibes = [] } = useEventVibes(params.eventId);
  const uniqueEventVibes = useMemo(
    () =>
      Array.from(
        new Map(
          eventVibes
            .filter(
              (vibe): vibe is (typeof eventVibes)[number] & { vibe_slug: string } =>
                typeof vibe?.vibe_slug === 'string' && vibe.vibe_slug.length > 0
            )
            .map((vibe) => [vibe.vibe_slug.toLowerCase(), vibe])
        ).values()
      ),
    [eventVibes]
  );
  const {
    data: existingReview,
    isLoading: reviewLoading,
    isFetching: reviewFetching,
    refetch: refetchExistingReview,
  } = useEventReview(params.eventId);
  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);
  const {
    balance: currentBalance,
    isLoading: tokenBalanceLoading,
    refetch: refetchCreditBalance,
    virtualCurrencyQuery,
  } = useCreditBalance();
  const virtualCurrency = virtualCurrencyQuery.data;
  const { mutateAsync: joinWaitlistAsync, isPending: joiningWaitlist } = useJoinWaitlist();
  const { mutateAsync: cancelWaitlistAsync, isPending: leavingWaitlist } = useCancelWaitlist();

  const hostPaths = event?.event_hosts?.map((host) => host.profile_picture) ?? [];
  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths,
  });

  const attendeePaths = event?.rsvps?.map((r) => r.profile_picture) ?? [];
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: attendeePaths,
  });

  const isEventDeleted = event?.deleted_at;

  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [isConfirmingRsvp, setIsConfirmingRsvp] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>('rsvp');
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isOpeningPaywall, setIsOpeningPaywall] = useState(false);
  const [hasValidatedAttendeeAccess, setHasValidatedAttendeeAccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!params.eventId || !userId) return;
      void refetchExistingReview();
    }, [params.eventId, refetchExistingReview, userId])
  );

  const tokenCost = event?.token_cost ?? 0;
  const projectedBalance = useMemo(() => currentBalance - tokenCost, [currentBalance, tokenCost]);
  const currentRsvpCount = rsvps.length;
  const remainingSpots = useMemo(() => {
    if (event?.capacity == null) return null;
    return Math.max(event.capacity - currentRsvpCount, 0);
  }, [event?.capacity, currentRsvpCount]);

  const isRsvped = useMemo(() => rsvps.some((r) => r.user_id === userId), [rsvps, userId]);
  const hasReviewedEvent = hasSubmittedReview || Boolean(existingReview);
  const reviewActionDisabled = reviewLoading || reviewFetching || hasReviewedEvent;
  const isSoldOut = remainingSpots !== null && remainingSpots <= 0;
  const { data: waitlistEntry } = useMyWaitlistEntry(event?.id ?? '');
  const { data: waitlistPosition } = useWaitlistPosition(event?.id ?? '', Boolean(waitlistEntry));
  const isOnWaitlist = waitlistEntry?.status === 'waiting';
  const hasEventEnded = useMemo(() => {
    if (!event?.ends_at) return false;
    return dayjs().isAfter(dayjs(event.ends_at));
  }, [event?.ends_at]);
  const canViewAttendees = hasValidatedAttendeeAccess && isPro;

  useEffect(() => {
    if (!revenueCatInitialized) {
      return;
    }

    let cancelled = false;

    setHasValidatedAttendeeAccess(false);

    const validateAttendeeAccess = async () => {
      const info = await refreshCustomerInfo();

      if (cancelled) {
        return;
      }

      setHasValidatedAttendeeAccess(Boolean(info?.entitlements.active[REVENUECAT_ENTITLEMENT]));
    };

    void validateAttendeeAccess();

    return () => {
      cancelled = true;
    };
  }, [refreshCustomerInfo, revenueCatInitialized]);

  useEffect(() => {
    const eventId = params.eventId;
    if (!eventId) return;

    const invalidateEventScreenData = () => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.eventById(eventId) });
      queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', 'eventVibes'] });
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEYS.mine(eventId, userId) });
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEYS.position(eventId, userId) });
    };

    const channel = supabase
      .channel(`view-event:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        invalidateEventScreenData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${eventId}` },
        invalidateEventScreenData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_waitlist', filter: `event_id=eq.${eventId}` },
        invalidateEventScreenData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.eventId, queryClient, userId]);

  const openConfirmationModal = (mode: ConfirmationMode) => {
    setConfirmationMode(mode);
    setRsvpError(null);
    setShowRsvpModal(true);
  };
  const closeRsvpModal = () => {
    if (isConfirmingRsvp) return;
    setShowRsvpModal(false);
    setRsvpError(null);
  };

  const handleSafeBack = () => {
    navigation.goBack();
  };

  const handleUpgradePress = async () => {
    setIsOpeningPaywall(true);
    try {
      await presentPaywall();
    } finally {
      setIsOpeningPaywall(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!event?.id) return;

    try {
      await joinWaitlistAsync({ eventId: event.id });
      setShowRsvpModal(false);
      Alert.alert('Waitlist joined', "You're on the waitlist for this event.");
    } catch (error) {
      const message = getErrorMessage(error, 'Something went wrong while joining the waitlist.');
      setRsvpError(message);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!event?.id) return;

    try {
      await cancelWaitlistAsync({ eventId: event.id });
      Alert.alert('Waitlist updated', 'You have left the waitlist.');
    } catch (error) {
      const message = getErrorMessage(error, 'Something went wrong while leaving the waitlist.');
      Alert.alert('Waitlist', message);
    }
  };

  const handleConfirmRsvp = async () => {
    if (!event || !userId || !event.id) return;

    if (confirmationMode === 'waitlist') {
      setIsConfirmingRsvp(true);
      setRsvpError(null);
      try {
        await handleJoinWaitlist();
      } finally {
        setIsConfirmingRsvp(false);
      }
      return;
    }

    if (!tokenBalanceLoading && tokenCost > currentBalance) {
      setIsConfirmingRsvp(true);
      try {
        await presentPlacementPaywall('battery_pack_purchase');
        await refetchCreditBalance();
      } finally {
        setIsConfirmingRsvp(false);
      }
      return;
    }

    setIsConfirmingRsvp(true);
    setRsvpError(null);
    let optimisticSnapshot: number | undefined;
    let optimisticVirtualCurrencySnapshot: typeof virtualCurrency | undefined;
    let appliedOptimisticUpdate = false;
    let appliedVirtualCurrencyOptimisticUpdate = false;

    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('You must be signed in to RSVP for an event.');
      }

      const tokenBalanceKey = TOKEN_QUERY_KEYS.balance(userId ?? undefined);
      const virtualCurrencyBalanceKey = REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS.balance(
        userId ?? null,
        REVENUECAT_VIRTUAL_CURRENCY_CODE ?? null
      );

      // Optimistically reduce balance so the modal/UI updates immediately.
      optimisticSnapshot = queryClient.getQueryData<number>(tokenBalanceKey);
      if (typeof optimisticSnapshot === 'number') {
        queryClient.setQueryData<number>(tokenBalanceKey, optimisticSnapshot - tokenCost);
        appliedOptimisticUpdate = true;
      }
      optimisticVirtualCurrencySnapshot =
        queryClient.getQueryData<typeof virtualCurrency>(virtualCurrencyBalanceKey);
      if (
        optimisticVirtualCurrencySnapshot &&
        typeof optimisticVirtualCurrencySnapshot.balance === 'number'
      ) {
        queryClient.setQueryData<typeof virtualCurrency>(virtualCurrencyBalanceKey, {
          ...optimisticVirtualCurrencySnapshot,
          balance: optimisticVirtualCurrencySnapshot.balance - tokenCost,
        });
        appliedVirtualCurrencyOptimisticUpdate = true;
      }

      const { data, error } = await supabase.functions.invoke('confirm-rsvp-and-spend-credits', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { eventId: event.id },
      });

      if (error) {
        throw error;
      }

      if (data?.status !== 'added' && data?.status !== 'confirmed') {
        setRsvpError('You are already on the guest list for this event.');
        return;
      }

      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.eventById(event.id) });
      queryClient.invalidateQueries({ queryKey: ['rsvps', event.id] });
      queryClient.invalidateQueries({ queryKey: ['events', 'userEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'checkIns', 'byUser', userId] });
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEYS.mine(event.id, userId) });
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEYS.position(event.id, userId) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(userId) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.userCheckedIn(userId, event.id) });
      queryClient.invalidateQueries({
        queryKey: TOKEN_QUERY_KEYS.balance(userId ?? undefined),
      });
      queryClient.invalidateQueries({
        queryKey: TOKEN_QUERY_KEYS.transactions(userId ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: virtualCurrencyBalanceKey });

      await scheduleRsvpLocalNotifications({
        eventId: event.id,
        title: event.title ?? 'Your event',
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        location: event.location_text || event.formatted_address,
      });
      await notifyLowCreditsAfterRsvp({ balance: Math.max(0, currentBalance - tokenCost) });

      setShowRsvpModal(false);
      Alert.alert('RSVP Confirmed', 'Your RSVP is confirmed.');
    } catch (error) {
      if (appliedOptimisticUpdate) {
        queryClient.setQueryData(TOKEN_QUERY_KEYS.balance(userId ?? undefined), optimisticSnapshot);
      }
      if (appliedVirtualCurrencyOptimisticUpdate) {
        queryClient.setQueryData(
          REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS.balance(
            userId ?? null,
            REVENUECAT_VIRTUAL_CURRENCY_CODE ?? null
          ),
          optimisticVirtualCurrencySnapshot
        );
      }
      const message =
        (error as { message?: string })?.message ??
        'Something went wrong while attempting to RSVP.';
      setRsvpError(message);
    } finally {
      await refetchCreditBalance();
      setIsConfirmingRsvp(false);
    }
  };

  if (isLoading || rsvpLoading) {
    return (
      <SafeAreaView className="h-full bg-background-dark">
        <Spinner />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Text size="xl">Event not found.</Text>
          <Button onPress={handleSafeBack}>
            <Text bold>Go Back</Text>
          </Button>
        </Flex>
      </View>
    );
  }

  if (isEventDeleted) {
    return (
      <View className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <Icon as={TicketX} size={'9xl'} className="text-typography-light" />
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

  const eventDateDisplay = event.starts_at
    ? dayjs(event.starts_at).format('MMM D, YYYY')
    : 'Date TBD';
  const eventTimeDisplay =
    event.starts_at && event.ends_at ? `${dayjs(event.starts_at).format('h:mm A')}` : 'Time TBD';
  const eventLocationDisplay = event.location_text ?? null;
  const primaryHost = event.event_hosts?.[0];
  const hostNameDisplay =
    primaryHost && (primaryHost.first_name || primaryHost.last_name)
      ? `${primaryHost.first_name ?? ''} ${primaryHost.last_name ?? ''}`.trim()
      : null;
  const handleReviewPress = () => {
    if (!event?.id || reviewActionDisabled) return;
    setIsReviewVisible(true);
  };
  return (
    <Flex flex className="bg-background-dark">
      <Flex className="relative">
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
        <Pressable className="absolute left-4 top-20" hitSlop={16} onPress={handleSafeBack}>
          <ArrowLeft size={28} color="#fff" />
        </Pressable>
      </Flex>

      {/* PERSISTENT BOTTOM SHEET ACTION BAR */}
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableOverDrag
        enableHandlePanningGesture
        enableContentPanningGesture
        handleIndicatorStyle={{ backgroundColor: '#3F3F46' }}
        backgroundStyle={{
          backgroundColor: '#0F1012',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
          }}>
          <Flex className="px-4" gap={6}>
            <Flex>
              <Text size={width < SMALL_SCREEN_WIDTH ? '4xl' : '5xl'} bold>
                {event.title}
              </Text>

              <Flex direction="row" gap={4} wrap="wrap">
                <Flex direction="row" align="center" gap={2}>
                  <Icon as={Calendar} size={'lg'} className="text-typography-light" />
                  <Text size="lg">{dayjs(event.starts_at).format('ddd, MMM DD')}</Text>
                </Flex>
                <Flex direction="row" align="center" gap={2}>
                  <Icon as={Clock} size={'lg'} className="text-typography-light" />
                  <Text size="lg">{dayjs(event.starts_at).format('h:mm A')}</Text>
                </Flex>
                <Flex direction="row" align="center" gap={2}>
                  <Icon as={MapPin} size={'lg'} className="text-typography-light" />
                  <Text size="lg">{event.location_text}</Text>
                </Flex>
              </Flex>
            </Flex>

            <Flex direction="row" align="center" gap={4}>
              {event.event_hosts?.length ? (
                <>
                  {event.event_hosts.map((host, idx) => (
                    <React.Fragment key={host.id}>
                      {hostAvatar && !hostAvatarLoading ? (
                        <Image
                          alt="picture of host"
                          rounded="full"
                          source={{ uri: hostAvatar[idx] ?? '' }}
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
                  ))}
                </>
              ) : (
                <Text>Host not assigned yet</Text>
              )}
            </Flex>

            <Flex gap={2}>
              <Text bold size="xl">
                Perfect if you’re into…
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

            <Flex gap={12}>
              <Flex>
                <Text bold size="2xl">
                  About this event
                </Text>
                <Text>{event.description}</Text>
              </Flex>

              <Flex>
                <Text bold size="2xl">
                  Vibe Check
                </Text>
                {uniqueEventVibes.length ? (
                  <Flex direction="row" flex wrap="wrap" gap={2}>
                    {uniqueEventVibes.map((vibe) => (
                      <Badge key={vibe.vibe_slug} variant="primary">
                        <Text size="sm" className="uppercase text-primary-300">
                          {vibe.vibe_slug}
                        </Text>
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Text>RSVP to change the vibe</Text>
                )}
              </Flex>
              <Flex>
                <Text bold size="2xl">
                  Who's Going?
                </Text>
                {canViewAttendees ? (
                  event.rsvps?.length ? (
                    <Flex direction="row" align="center" gap={10} wrap="wrap">
                      {event.rsvps.map((rsvp, idx) => (
                        <Flex key={rsvp.user_id} align="center" gap={4}>
                          {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                            <Image
                              key={rsvp.user_id}
                              alt="picture of guest"
                              source={{ uri: eventRsvpsAvatar[idx] ?? '' }}
                              rounded="full"
                              size="xl"
                            />
                          ) : (
                            <Box className="h-28 w-28 rounded-full bg-slate-500" />
                          )}
                          <Text>{rsvp.first_name + ' ' + rsvp.last_name}</Text>
                        </Flex>
                      ))}
                    </Flex>
                  ) : (
                    <Text>Be the first to RSVP!</Text>
                  )
                ) : (
                  <PremiumBlurGate
                    disabled={isOpeningPaywall || loadingOfferings}
                    onPress={handleUpgradePress}
                    minHeight={100}>
                    <>
                      {event.rsvps?.length ? (
                        <Flex
                          direction="row"
                          align="center"
                          gap={10}
                          wrap="wrap"
                          className="px-2 py-3">
                          {event.rsvps.map((rsvp, idx) => (
                            <Flex key={rsvp.user_id} align="center" gap={4}>
                              {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                                <Image
                                  key={rsvp.user_id}
                                  alt="picture of guest"
                                  source={{ uri: eventRsvpsAvatar[idx] ?? '' }}
                                  rounded="full"
                                  size="xl"
                                />
                              ) : (
                                <Box className="h-28 w-28 rounded-full bg-slate-500" />
                              )}
                              <Text>{rsvp.first_name + ' ' + rsvp.last_name}</Text>
                            </Flex>
                          ))}
                        </Flex>
                      ) : (
                        <Text>Be the first to RSVP!</Text>
                      )}
                    </>
                  </PremiumBlurGate>
                )}
              </Flex>
            </Flex>
          </Flex>
        </BottomSheetScrollView>
      </BottomSheet>
      <View
        className="absolute bottom-0 left-0 right-0 border-t bg-background-dark px-14 pt-3"
        style={{
          paddingBottom: insets.bottom + 10,
        }}>
        {hasEventEnded ? (
          <Button
            className={cn(
              'h-14 w-full rounded-lg',
              reviewActionDisabled ? 'bg-white/10' : 'bg-primary-600'
            )}
            onPress={handleReviewPress}
            disabled={reviewActionDisabled}>
            <Text bold size="lg" className={reviewActionDisabled ? 'text-white/60' : 'text-white'}>
              {hasReviewedEvent
                ? 'Reviewed'
                : reviewLoading || reviewFetching
                  ? 'Checking Review'
                  : 'Review Event'}
            </Text>
          </Button>
        ) : isRsvped && event.id ? (
          <CancelRsvpButton
            eventId={event.id}
            tokenCost={event.token_cost ?? 0}
            eventTitle={event.title ?? ''}
            eventStartsAt={event.starts_at ?? null}
            className="h-14 w-full rounded-lg bg-primary-700"
          />
        ) : (
          <Flex direction="row" align="center" justify="space-between">
            <Flex align="center">
              <Text bold size="md">
                Tokens Cost
              </Text>
              <Text size="2xl" bold className="text-primary">
                {event.token_cost ?? 0}
              </Text>
            </Flex>
            <Flex className="w-1/2" gap={2}>
              {isSoldOut ? (
                <>
                  <Button
                    variant="primary"
                    className={cn(
                      'h-14 w-full rounded-lg',
                      isOnWaitlist ? 'bg-background-700' : 'bg-primary-600'
                    )}
                    onPress={
                      isOnWaitlist ? handleLeaveWaitlist : () => openConfirmationModal('waitlist')
                    }
                    disabled={joiningWaitlist || leavingWaitlist}>
                    <Text bold size="lg" className="text-white">
                      {isOnWaitlist
                        ? leavingWaitlist
                          ? 'Leaving...'
                          : 'Leave Waitlist'
                        : joiningWaitlist
                          ? 'Joining...'
                          : 'Join Waitlist'}
                    </Text>
                  </Button>
                  {isOnWaitlist && waitlistPosition ? (
                    <Text size="sm" className="text-center text-white">
                      {`You're #${waitlistPosition} on the waitlist`}
                    </Text>
                  ) : null}
                </>
              ) : (
                <RsvpButton onPress={() => openConfirmationModal('rsvp')} />
              )}
              {remainingSpots !== null && remainingSpots > 0 ? (
                <Text
                  size="sm"
                  className={cn(
                    'text-center',
                    remainingSpots <= 10 ? 'text-error-500' : 'text-white'
                  )}>
                  {remainingSpots} {remainingSpots === 1 ? 'spot' : 'spots'} left
                </Text>
              ) : null}
            </Flex>
          </Flex>
        )}
      </View>

      {/* RSVP CONFIRMATION MODAL (unchanged) */}
      <RsvpConfirmationModal
        visible={showRsvpModal}
        onCancel={closeRsvpModal}
        onConfirm={handleConfirmRsvp}
        mode={confirmationMode}
        isProcessing={joiningWaitlist || isConfirmingRsvp}
        eventTitle={event.title ?? ''}
        eventDate={eventDateDisplay}
        eventTimeRange={eventTimeDisplay}
        eventLocation={eventLocationDisplay}
        hostName={hostNameDisplay ?? undefined}
        tokenCost={tokenCost}
        tokenBalance={currentBalance}
        projectedBalance={projectedBalance}
        balanceLoading={tokenBalanceLoading}
        errorMessage={rsvpError}
      />
      {event?.id && (
        <Modal
          animationType="slide"
          presentationStyle="fullScreen"
          visible={isReviewVisible}
          onRequestClose={() => setIsReviewVisible(false)}>
          <EventReviewContent
            eventId={event.id}
            onClose={() => setIsReviewVisible(false)}
            onSubmitted={() => setHasSubmittedReview(true)}
          />
        </Modal>
      )}
    </Flex>
  );
}

/* --- your existing button + modal components (unchanged) --- */
function RsvpButton({
  onPress,
  isLoading,
  canEdit,
}: {
  onPress: () => void;
  isLoading?: boolean;
  canEdit?: boolean;
}) {
  const label = isLoading ? <Spinner /> : 'RSVP';
  return (
    <Button
      variant="primary"
      className={cn('h-14 w-full rounded-lg bg-primary-700', canEdit && 'w-[48%]')}
      onPress={onPress}
      disabled={isLoading}>
      <Text bold size="lg" className="text-white dark:text-black">
        {label}
      </Text>
    </Button>
  );
}

type ConfirmationProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  mode: ConfirmationMode;
  isProcessing: boolean;
  eventTitle: string;
  eventDate: string;
  eventTimeRange: string;
  eventLocation?: string | null;
  hostName?: string | null;
  tokenCost: number;
  tokenBalance: number;
  projectedBalance: number;
  balanceLoading: boolean;
  errorMessage: string | null;
};

function RsvpConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  mode,
  isProcessing,
  eventTitle,
  eventDate,
  eventTimeRange,
  eventLocation,
  hostName,
  tokenCost,
  tokenBalance,
  projectedBalance,
  balanceLoading,
  errorMessage,
}: ConfirmationProps) {
  const costLine = [{ label: 'Event', value: eventTitle }];
  const isWaitlistMode = mode === 'waitlist';
  const needsCredits = !isWaitlistMode && projectedBalance < 0 && !balanceLoading;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Flex className="relative flex-1 items-center justify-center bg-black/70 px-6">
        <Pressable
          className="absolute inset-0"
          onPress={onCancel}
          disabled={isProcessing}
          accessibilityRole="button"
        />
        <Flex className="w-full max-w-md rounded-xl bg-background py-6" gap={4}>
          <Flex direction="row" justify="space-between" align="center" className=" px-4">
            <Text bold size="xl" className="text-white">
              {isWaitlistMode ? 'Waitlist Details' : 'RSVP Details'}
            </Text>
            <Text className="text-primary-600" onPress={onCancel}>
              Cancel
            </Text>
          </Flex>
          <Divider className="bg-background-800/20" />

          <Flex gap={3} className="rounded-2xl p-4">
            <Flex gap={4}>
              {costLine.map((item) => (
                <DetailRow key={item.label} label={item.label} value={item.value} />
              ))}
              <DetailRow label="Date" value={eventDate} />
              <DetailRow label="Time" value={eventTimeRange} />
              {eventLocation ? <DetailRow label="Location" value={eventLocation} /> : null}
              {hostName ? <DetailRow label="Host" value={hostName} /> : null}
            </Flex>
          </Flex>
          <View className="px-4">
            <Divider className="bg-background-800/20" />
          </View>
          <Flex gap={4} className="rounded-2xl p-4">
            {isWaitlistMode ? (
              <Text className="text-center text-white">
                You will be charged {tokenCost} {tokenCost === 1 ? 'token' : 'tokens'} only if you
                are promoted to RSVP.
              </Text>
            ) : (
              <Flex gap={2}>
                <Flex direction="row" justify="space-between">
                  <Text className="text-white">Tokens Required</Text>
                  <Text bold className="text-white">
                    {tokenCost}
                  </Text>
                </Flex>
                <Flex direction="row" justify="space-between">
                  <Text className="text-white">Current Balance</Text>
                  <Text className="text-white">{balanceLoading ? 'Loading…' : tokenBalance}</Text>
                </Flex>
                <Flex direction="row" justify="space-between" align="center">
                  <Text className="text-white">Balance After RSVP</Text>

                  <Text className={cn(projectedBalance < 0 ? 'text-red-600' : 'text-green-600')}>
                    {balanceLoading ? 'Loading…' : `${projectedBalance}`}
                  </Text>
                </Flex>
              </Flex>
            )}
          </Flex>

          <Flex className="px-4">
            {errorMessage ? (
              <Text alert>{errorMessage}</Text>
            ) : needsCredits ? (
              <Text alert>You do not have enough credits to complete this RSVP.</Text>
            ) : null}
            <Button
              className="h-14 rounded-lg bg-primary-600"
              onPress={onConfirm}
              disabled={isProcessing || (!isWaitlistMode && balanceLoading)}>
              {isProcessing ? (
                <Spinner />
              ) : (
                <Text bold size="lg" className="text-white">
                  {isWaitlistMode
                    ? 'Confirm Join Waitlist'
                    : needsCredits
                      ? 'Add Credits'
                      : 'Confirm RSVP'}
                </Text>
              )}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex direction="row" justify="space-between" align="center">
      <Text className="text-white">{label}</Text>
      <Text className="max-w-[60%] text-right text-white">{value}</Text>
    </Flex>
  );
}

export function CancelRsvpButton({
  eventId,
  tokenCost = 0,
  eventTitle,
  eventStartsAt,
  className,
  canEdit,
  onCancelled,
}: {
  eventId: string;
  tokenCost?: number;
  eventTitle?: string;
  eventStartsAt?: string | null;
  className?: string;
  canEdit?: boolean;
  onCancelled?: () => void;
}) {
  const queryClient = useQueryClient();
  const { session, userId } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<CancellationReason | null>(null);
  const [cancelReasonNote, setCancelReasonNote] = useState('');
  const label = isPending ? <Spinner /> : 'Cancel';
  const startsAt = eventStartsAt ? dayjs(eventStartsAt) : null;
  const hoursUntilStart = startsAt ? startsAt.diff(dayjs(), 'hour', true) : Infinity;
  const isWithinGracePeriod = hoursUntilStart >= 2;

  const performCancellation = async () => {
    try {
      setIsPending(true);
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('You must be signed in to cancel an RSVP.');
      }

      const shouldRefund = isWithinGracePeriod;
      const trimmedCancelReasonNote = cancelReasonNote.trim();
      const { data, error } = await supabase.functions.invoke('cancel-rsvp-and-refund-credits', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          eventId,
          shouldRefund,
          cancellationReason: selectedCancelReason,
          cancellationReasonNote: trimmedCancelReasonNote || null,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.status !== 'removed') {
        throw new Error('Unable to Cancel.');
      }

      const refundedAmount = typeof data?.tokenCost === 'number' ? data.tokenCost : tokenCost;

      queryClient.setQueryData<{ user_id: string | null }[]>(['rsvps', eventId], (current) =>
        current?.filter((rsvp) => rsvp.user_id !== userId)
      );
      queryClient.setQueryData<VEventWithFullDetails>(EVENT_KEYS.eventById(eventId), (current) =>
        current
          ? {
              ...current,
              is_current_user_rsvped: false,
              current_user_rsvp_at: null,
              rsvps: current.rsvps?.filter((rsvp) => rsvp.user_id !== userId) ?? null,
            }
          : current
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EVENT_KEYS.eventById(eventId) }),
        queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'userEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'checkIns', 'byUser', userId] }),
        queryClient.invalidateQueries({ queryKey: WAITLIST_KEYS.mine(eventId, userId ?? null) }),
        queryClient.invalidateQueries({
          queryKey: WAITLIST_KEYS.position(eventId, userId ?? null),
        }),
        queryClient.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(userId ?? null) }),
        queryClient.invalidateQueries({
          queryKey: EVENT_KEYS.userCheckedIn(userId ?? null, eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: TOKEN_QUERY_KEYS.balance(userId ?? undefined),
        }),
        queryClient.invalidateQueries({
          queryKey: TOKEN_QUERY_KEYS.transactions(userId ?? undefined),
        }),
        queryClient.invalidateQueries({
          queryKey: REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS.balance(
            userId ?? null,
            REVENUECAT_VIRTUAL_CURRENCY_CODE ?? null
          ),
        }),
      ]);
      await queryClient.refetchQueries({
        queryKey: REVENUECAT_VIRTUAL_CURRENCY_QUERY_KEYS.balance(
          userId ?? null,
          REVENUECAT_VIRTUAL_CURRENCY_CODE ?? null
        ),
      });

      await cancelEventLocalNotifications(eventId);
      if (shouldRefund) {
        await notifyCreditRefund({ amount: refundedAmount });
      }

      Alert.alert(
        'Your RSVP was removed',
        shouldRefund
          ? `${refundedAmount} credits have been refunded.`
          : 'No credits were refunded because the grace period has passed.'
      );
      setShowCancelModal(false);
      onCancelled?.();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Something went wrong.';
      Alert.alert('Failed to Cancel', message);
    } finally {
      setIsPending(false);
    }
  };

  const confirmCancellation = () => {
    setSelectedCancelReason(null);
    setCancelReasonNote('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (isPending) return;
    setShowCancelModal(false);
  };

  return (
    <>
      <Button
        size="xl"
        variant="primary"
        className={cn(
          className ? className : 'w-full whitespace-nowrap rounded-lg',
          canEdit && 'w-[48%]'
        )}
        onPress={confirmCancellation}
        disabled={isPending}>
        <Text bold size="lg">
          {label}
        </Text>
      </Button>
      <Modal
        transparent
        animationType="fade"
        visible={showCancelModal}
        onRequestClose={closeCancelModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={24}>
          <Flex className="relative flex-1 items-center justify-center bg-black/70 px-6 py-8">
            <Pressable
              className="absolute inset-0"
              onPress={closeCancelModal}
              disabled={isPending}
              accessibilityRole="button"
            />
            <Flex className="max-h-[88%] w-full max-w-md rounded-xl bg-background py-6" gap={4}>
              <Flex direction="row" justify="space-between" align="center" className="px-4">
                <Text bold size="xl" className="text-white">
                  Cancel RSVP
                </Text>
                <Text className="text-primary-600" onPress={closeCancelModal}>
                  Close
                </Text>
              </Flex>
              <Divider className="bg-background-800/20" />
              <ScrollView
                className="shrink"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-4 pb-2">
                <Flex gap={4}>
                  <Text className="text-white">
                    {eventTitle ? `Cancel your RSVP for ${eventTitle}?` : 'Cancel your RSVP?'}
                  </Text>
                  <Text size="sm" className="text-gray-300">
                    {isWithinGracePeriod
                      ? `${tokenCost} credits will be returned to your wallet.`
                      : 'The refund window has passed, so no credits will be returned.'}
                  </Text>

                  <Flex gap={3}>
                    <Text bold className="text-white">
                      Why are you cancelling?
                    </Text>
                    {CANCELLATION_REASONS.map((reason) => {
                      const selected = selectedCancelReason === reason.value;

                      return (
                        <Pressable
                          key={reason.value}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          disabled={isPending}
                          onPress={() => setSelectedCancelReason(reason.value)}
                          className={cn(
                            'rounded-lg border border-background-800 p-4',
                            selected && 'border-primary-600'
                          )}>
                          <Flex direction="row" align="center" gap={3}>
                            <Box
                              className={cn(
                                'h-5 w-5 rounded-full border-2 border-white p-1',
                                selected && 'border-primary-600'
                              )}>
                              {selected ? (
                                <Box className="h-full w-full rounded-full bg-primary-600" />
                              ) : null}
                            </Box>
                            <Text bold className="text-white">
                              {reason.label}
                            </Text>
                          </Flex>
                        </Pressable>
                      );
                    })}
                    {selectedCancelReason === 'other' ? (
                      <TextInput
                        multiline
                        textAlignVertical="top"
                        value={cancelReasonNote}
                        onChangeText={setCancelReasonNote}
                        editable={!isPending}
                        placeholder="Add a note"
                        placeholderTextColor="#9ca3af"
                        className="min-h-24 rounded-lg border border-background-800 p-4 text-white"
                      />
                    ) : null}
                  </Flex>
                </Flex>
              </ScrollView>
              <Flex direction="row" gap={3} className="px-4">
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-lg"
                  onPress={closeCancelModal}
                  disabled={isPending}>
                  <Text className="text-white">Keep RSVP</Text>
                </Button>
                <Button
                  variant="alert"
                  className="h-12 flex-1 rounded-lg"
                  onPress={performCancellation}
                  disabled={isPending || !selectedCancelReason}>
                  {isPending ? (
                    <Spinner />
                  ) : (
                    <Text bold className="text-white">
                      Cancel RSVP
                    </Text>
                  )}
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
