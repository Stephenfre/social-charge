import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { ArrowLeft, Calendar, Clock, MapPin, TicketX } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventCard } from '~/components/EventCard/EventCard';

import { Badge, Box, Button, Divider, Flex, Image, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import { Spinner } from '~/components/ui/spinner';
import {
  useEventById,
  useRefundTokens,
  useSpendTokens,
  useStorageImages,
  useTokenBalance,
} from '~/hooks';
import { useEventVibes } from '~/hooks/useEvents';
import { useCreateRsvp, useRemoveRsvp, useRsvps } from '~/hooks/useRsvps';
import { useAuth } from '~/providers/AuthProvider';

import { cn } from '~/utils/cn';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';

type EventNav = NativeStackNavigationProp<RootStackParamList, 'CreateEvent', 'EventReview'>;

export function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEvent'>();
  const navigation = useNavigation<EventNav>();
  const insets = useSafeAreaInsets();

  const { userId, user } = useAuth();
  const { data: event, isLoading } = useEventById(params.eventId);
  const { data: eventVibes = [] } = useEventVibes(params.eventId);
  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);
  const { data: tokenBalance, isLoading: tokenBalanceLoading } = useTokenBalance();
  const { mutateAsync: createRsvpAsync, isPending: creatingRsvp } = useCreateRsvp();
  const { mutateAsync: removeRsvpAsync } = useRemoveRsvp();
  const spendTokens = useSpendTokens();
  const refundTokens = useRefundTokens();

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
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const tokenCost = event?.token_cost ?? 0;
  const currentBalance = tokenBalance ?? 0;
  const projectedBalance = useMemo(() => currentBalance - tokenCost, [currentBalance, tokenCost]);

  const isRsvped = useMemo(() => rsvps.some((r) => r.user_id === userId), [rsvps, userId]);
  const hasEventEnded = useMemo(() => {
    if (!event?.ends_at) return false;
    return dayjs().isAfter(dayjs(event.ends_at));
  }, [event?.ends_at]);

  const openRsvpModal = () => {
    setRsvpError(null);
    setShowRsvpModal(true);
  };
  const closeRsvpModal = () => {
    if (isConfirmingRsvp) return;
    setShowRsvpModal(false);
    setRsvpError(null);
  };

  const handleConfirmRsvp = async () => {
    if (!event || !userId || !event.id) return;

    // if (!tokenBalanceLoading && tokenCost > currentBalance) {
    //   setRsvpError('You do not have enough credits to RSVP for this event.');
    //   return;
    // }

    setIsConfirmingRsvp(true);
    setRsvpError(null);
    let rsvpAdded = false;
    let tokensSpent = false;

    try {
      const result = await createRsvpAsync({ eventId: event.id, userId });
      if (result !== 'added') {
        setRsvpError('You are already on the guest list for this event.');
        return;
      }
      rsvpAdded = true;

      if (tokenCost > 0) {
        await spendTokens.mutateAsync({
          amount: tokenCost,
          eventId: event.id,
          meta: {
            type: 'event_rsvp',
            eventId: event.id,
            eventTitle: event.title,
            tokenCost,
          },
        });
        tokensSpent = true;
      }

      setShowRsvpModal(false);
      Alert.alert('RSVP Confirmed', 'Your RSVP is confirmed.');
    } catch (error) {
      if (tokensSpent) {
        try {
          await refundTokens.mutateAsync({
            amount: tokenCost,
            eventId: event.id,
            meta: {
              type: 'event_rsvp_refund',
              eventId: event.id,
              eventTitle: event.title,
              tokenCost,
            },
          });
        } catch {}
      }

      if (rsvpAdded) {
        try {
          await removeRsvpAsync({ eventId: event.id });
        } catch {}
      }

      const message =
        (error as { message?: string })?.message ??
        'Something went wrong while attempting to RSVP.';
      setRsvpError(message);
    } finally {
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
          <Button onPress={() => navigation.goBack()}>
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
    if (!event?.id) return;
    navigation.navigate('EventReview', { eventId: event.id });
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

      {/* PERSISTENT BOTTOM SHEET ACTION BAR */}
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
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
          }}>
          <Flex className="px-4" gap={6}>
            <Flex>
              <Text size="5xl" bold>
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

            <Flex>
              <Text bold size="2xl">
                About this event
              </Text>
              <Text>{event.description}</Text>
            </Flex>

            {user?.membership !== 'basic' && (
              <Flex gap={4}>
                <Text bold size="2xl">
                  Who's Going?
                </Text>
                {event.rsvps?.length ? (
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
                )}
              </Flex>
            )}

            <Flex gap={4}>
              <Text bold size="2xl">
                Vibe Check
              </Text>
              {eventVibes.length ? (
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
                <Text>Rvsp to chage the vibe</Text>
              )}
            </Flex>
            {/* 
            <Flex gap={4}>
              <Text bold size="2xl">
                Check-in List
              </Text>
              <EventCheckInList
                checkIns={event.check_ins}
                emptyMessage="No attendees have checked in yet."
              />
            </Flex> */}
          </Flex>
        </BottomSheetView>
      </BottomSheet>
      <View
        className="absolute bottom-0 left-0 right-0 border-t bg-background-dark px-14 pt-3"
        style={{
          paddingBottom: insets.bottom + 10,
        }}>
        {hasEventEnded ? (
          <Button className="h-14 w-full rounded-lg bg-primary-600" onPress={handleReviewPress}>
            <Text bold size="lg" className="text-white">
              Review Event
            </Text>
          </Button>
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
            <Flex className="w-1/2">
              {isRsvped && event.id ? (
                <CancelRsvpButton
                  eventId={event.id}
                  tokenCost={event.token_cost ?? 0}
                  eventTitle={event.title ?? ''}
                  eventStartsAt={event.starts_at ?? null}
                />
              ) : (
                <RsvpButton onPress={openRsvpModal} />
              )}
            </Flex>
          </Flex>
        )}
      </View>

      {/* RSVP CONFIRMATION MODAL (unchanged) */}
      <RsvpConfirmationModal
        visible={showRsvpModal}
        onCancel={closeRsvpModal}
        onConfirm={handleConfirmRsvp}
        isProcessing={creatingRsvp || isConfirmingRsvp}
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
              RSVP Detail
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
          </Flex>

          <Flex className="px-4">
            {errorMessage ? (
              <Text alert>{errorMessage}</Text>
            ) : projectedBalance < 0 && !balanceLoading ? (
              <Text alert>You do not have enough credits to complete this RSVP.</Text>
            ) : null}
            <Button
              className="h-14 rounded-lg bg-primary-600"
              onPress={onConfirm}
              disabled={isProcessing || balanceLoading || projectedBalance < 0}>
              {isProcessing ? (
                <Spinner />
              ) : (
                <Text bold size="lg" className="text-white">
                  Confirm RSVP
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
}: {
  eventId: string;
  tokenCost?: number;
  eventTitle?: string;
  eventStartsAt?: string | null;
  className?: string;
  canEdit?: boolean;
}) {
  const navigation = useNavigation();
  const { mutateAsync: removeRsvpAsync, isPending } = useRemoveRsvp();
  const { mutateAsync: refundTokensAsync } = useRefundTokens();
  const label = isPending ? <Spinner /> : 'Cancel Rsvp';
  const startsAt = eventStartsAt ? dayjs(eventStartsAt) : null;
  const hoursUntilStart = startsAt ? startsAt.diff(dayjs(), 'hour', true) : Infinity;
  const isWithinGracePeriod = hoursUntilStart >= 2;

  const performCancellation = async (shouldRefund: boolean) => {
    try {
      await removeRsvpAsync({ eventId });
      if (shouldRefund && tokenCost > 0) {
        await refundTokensAsync({
          amount: tokenCost,
          eventId,
          meta: {
            type: 'event_rsvp_refund',
            eventId,
            eventTitle,
            tokenCost,
          },
        });
      }
      Alert.alert(
        'Your RSVP was removed',
        shouldRefund
          ? `${tokenCost} credits have been refunded.`
          : 'No credits were refunded because the grace period has passed.'
      );
      navigation.goBack();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Something went wrong.';
      Alert.alert('Failed to cancel RSVP', message);
    }
  };

  const confirmCancellation = () => {
    const message = isWithinGracePeriod
      ? 'Are you sure you want to cancel and refund your credits?'
      : "The cancellation grace period has passed. You can still cancel, but you won't receive a refund.";
    Alert.alert('Cancel RSVP', message, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => performCancellation(isWithinGracePeriod) },
    ]);
  };

  return (
    <Button
      size="xl"
      variant="primary"
      className={cn(className ? className : 'w-full rounded-lg', canEdit && 'w-[48%]')}
      onPress={confirmCancellation}
      disabled={isPending}>
      <Text bold size="lg">
        {label}
      </Text>
    </Button>
  );
}
