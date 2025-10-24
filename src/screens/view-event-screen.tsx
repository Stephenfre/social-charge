// ViewEventScreen.tsx
import dayjs from 'dayjs';
import { Calendar, Clock, MapPin, TicketX } from 'lucide-react-native';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useStorageImages, useMyTokenBalance } from '~/hooks';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';
import { useRsvps, useCreateRsvp, useRemoveRsvp } from '~/hooks/useRsvps';
import { useAuth } from '~/providers/AuthProvider';
import { Spinner } from '~/components/ui/spinner';
import { EventCard } from '~/components/EventCard/EventCard';
import React from 'react';
import { cn } from '~/utils/cn';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDeleteEvent, useEventVibes } from '~/hooks/useEvents';
import { supabase } from '~/lib/supabase';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EventNav = NativeStackNavigationProp<RootStackParamList, 'CreateEvent', 'EventReview'>;

export function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEvent'>();
  const navigation = useNavigation<EventNav>();
  const insets = useSafeAreaInsets();

  const { userId, user } = useAuth();
  const { data: event, isLoading } = useEventById(params.eventId);
  const { data: eventVibes = [] } = useEventVibes(params.eventId);
  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);
  const { mutate: deleteEvent, isPending } = useDeleteEvent();
  const { data: tokenBalance, isLoading: tokenBalanceLoading } = useMyTokenBalance();
  const { mutateAsync: createRsvpAsync, isPending: creatingRsvp } = useCreateRsvp();
  const { mutateAsync: removeRsvpAsync } = useRemoveRsvp();

  const isRsvped = rsvps.some((r) => r.user_id === userId);

  const hostPaths = event?.event_hosts?.map((host) => host.profile_picture);
  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths ?? [],
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

  const [showRsvpModal, setShowRsvpModal] = React.useState(false);
  const [isConfirmingRsvp, setIsConfirmingRsvp] = React.useState(false);
  const [rsvpError, setRsvpError] = React.useState<string | null>(null);

  const tokenCost = event?.token_cost ?? 0;
  const currentBalance = tokenBalance ?? 0;
  const projectedBalance = currentBalance - tokenCost;

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
    if (!event || !userId) return;

    if (!tokenBalanceLoading && tokenCost > currentBalance) {
      setRsvpError('You do not have enough credits to RSVP for this event.');
      return;
    }

    setIsConfirmingRsvp(true);
    setRsvpError(null);
    let rsvpAdded = false;
    let ledgerId: string | null = null;
    let transactionId: string | null = null;

    try {
      const result = await createRsvpAsync({ eventId: event.id, userId });
      if (result !== 'added') {
        setRsvpError('You are already on the guest list for this event.');
        return;
      }
      rsvpAdded = true;

      if (tokenCost > 0) {
        const transactionMeta = {
          type: 'event_rsvp',
          eventId: event.id,
          eventTitle: event.title,
          tokenCost,
        };

        const { data: ledgerData, error: ledgerError } = await supabase
          .from('token_ledger')
          .insert({
            user_id: userId,
            credit: -tokenCost,
            reason: 'event_rsvp',
            event_id: event.id,
            meta: transactionMeta,
          })
          .select('id')
          .single();
        if (ledgerError) throw ledgerError;
        ledgerId = ledgerData?.id ?? null;

        const { data: transactionData, error: transactionError } = await supabase
          .from('token_transactions')
          .insert({
            amount: -tokenCost,
            kind: 'spend',
            user_id: userId,
            meta: transactionMeta,
          })
          .select('id')
          .single();
        if (transactionError) throw transactionError;
        transactionId = transactionData?.id ?? null;
      }

      setShowRsvpModal(false);
      Alert.alert(
        'RSVP Confirmed',
        tokenCost > 0
          ? `Your RSVP is confirmed. ${tokenCost} credits have been deducted from your balance.`
          : 'Your RSVP is confirmed.'
      );
    } catch (error) {
      if (tokenCost > 0) {
        if (transactionId) {
          try {
            await supabase.from('token_transactions').delete().eq('id', transactionId);
          } catch {}
        }
        if (ledgerId) {
          try {
            await supabase.from('token_ledger').delete().eq('id', ledgerId);
          } catch {}
        }
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

  if (isLoading) {
    return (
      <View className="h-full bg-background-dark">
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
    <Flex flex className=" bg-background-dark">
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

      {/* PERSISTENT BOTTOM SHEET ACTION BAR */}
      <BottomSheet
        index={0}
        snapPoints={['70%', '90%']}
        enablePanDownToClose={false}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        backgroundStyle={{
          backgroundColor: '#18191f',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}>
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120, // leave room for any fixed footer
          }}
          // helpful on Android when you have nested scrollables
          nestedScrollEnabled>
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
                  {event?.event_hosts?.map((host, i) => (
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
              <Text>{event?.description}</Text>
            </Flex>

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

            {user?.membership !== 'basic' && (
              <Flex gap={4}>
                <Text bold size="2xl">
                  Attendees
                </Text>
                {event?.rsvps?.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
                    <Flex direction="row" align="center" gap={10}>
                      {event?.rsvps?.map((rsvp, i) => (
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
          </Flex>
        </BottomSheetScrollView>
      </BottomSheet>
      <View
        className="absolute bottom-0 left-0 right-0 border border-background-800 bg-background-900 px-14 pt-3"
        style={{
          paddingBottom: insets.bottom + 10,
        }}>
        <Flex direction="row" align="center" justify="space-between">
          <Flex align="center">
            <Text bold size="md" className="text-white">
              Tokens Cost
            </Text>
            <Text size="2xl" bold className="text-primary-300">
              {event?.token_cost ?? 0}
            </Text>
          </Flex>
          <Flex style={{ width: '50%' }}>
            <RsvpButton onPress={openRsvpModal} />
          </Flex>
        </Flex>
      </View>

      {/* RSVP CONFIRMATION MODAL (unchanged) */}
      <RsvpConfirmationModal
        visible={showRsvpModal}
        onCancel={closeRsvpModal}
        onConfirm={handleConfirmRsvp}
        isProcessing={creatingRsvp || isConfirmingRsvp}
        eventTitle={event?.title ?? ''}
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
      className={cn('h-14 w-full bg-primary', canEdit && 'w-[48%]')}
      onPress={onPress}
      disabled={isLoading}>
      <Text bold size="lg">
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
  tokenCost,
  tokenBalance,
  projectedBalance,
  balanceLoading,
  errorMessage,
}: ConfirmationProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Flex className="relative flex-1 items-center justify-center bg-black/70 px-6">
        <Pressable
          className="absolute inset-0"
          onPress={onCancel}
          disabled={isProcessing}
          accessibilityRole="button"
        />
        <Flex className="w-full max-w-md rounded-2xl bg-background-900 p-6" gap={4}>
          <Text bold size="2xl">
            Confirm RSVP
          </Text>
          <Text>
            You are about to RSVP for{' '}
            <Text bold className="text-white">
              {eventTitle}
            </Text>
            .
          </Text>
          <Flex gap={2} className="rounded-xl bg-background-dark p-4">
            <Flex direction="row" justify="space-between">
              <Text bold>Credits Required</Text>
              <Text bold>{tokenCost}</Text>
            </Flex>
            <Flex direction="row" justify="space-between">
              <Text bold>Current Balance</Text>
              <Text bold>{balanceLoading ? 'Loading...' : tokenBalance}</Text>
            </Flex>
            <Flex direction="row" justify="space-between">
              <Text bold>Balance After RSVP</Text>
              <Text bold className={projectedBalance < 0 ? 'text-alert-500' : ''}>
                {balanceLoading ? 'Loading...' : projectedBalance}
              </Text>
            </Flex>
          </Flex>
          {errorMessage ? (
            <Text alert>{errorMessage}</Text>
          ) : projectedBalance < 0 && !balanceLoading ? (
            <Text alert>You do not have enough credits to complete this RSVP.</Text>
          ) : null}
          <Flex direction="row" gap={4}>
            <Button variant="outline" className="flex-1" onPress={onCancel} disabled={isProcessing}>
              <Text bold>Cancel</Text>
            </Button>
            <Button
              className="flex-1 bg-primary"
              onPress={onConfirm}
              disabled={isProcessing || balanceLoading || projectedBalance < 0}>
              {isProcessing ? (
                <Spinner />
              ) : (
                <Text bold size="lg">
                  Confirm
                </Text>
              )}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
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
