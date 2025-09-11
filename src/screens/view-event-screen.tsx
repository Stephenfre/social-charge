import dayjs from 'dayjs';
import { Calendar, Clock, MapPin, MessagesSquare } from 'lucide-react-native';
import { Alert, FlatList, SafeAreaView, ScrollView, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useStorageImages } from '~/hooks';
import { useRouteStack } from '~/types/navigation.types';
import { EventWithJoins, PersonCard } from '~/types/event.types';
import { useRsvps, useCreateRsvp, useRemoveRsvp } from '~/hooks/useRsvps';
import { useAuth } from '~/providers/AuthProvider';
import { Spinner } from '~/components/ui/spinner';
import { EventCard } from '~/components/EventCard/EventCard';
import { useEventMessagesFeed } from '~/hooks/useEventMessage';
import { EventMessage } from '~/api/event-messages';
import { useMemo, useState } from 'react';

export default function ViewEventScreen() {
  const { params } = useRouteStack<'ViewEventScreen'>();
  const { data, isLoading } = useEventById(params.eventId);
  const { userId, membership_role } = useAuth();

  const event = data as unknown as EventWithJoins | undefined;

  const { data: rsvps = [], isLoading: rsvpLoading } = useRsvps(params.eventId);
  const isRsvped = !!userId && rsvps.some((r) => r.user_id === userId);

  const isReady = !isLoading && !!event;

  // Build host + rsvp display models
  const eventHosts: PersonCard[] =
    event?.event_hosts?.map((host) => ({
      id: host.user.id,
      name: `${host.user.first_name ?? ''} ${host.user.last_name ?? ''}`.trim(),
      profile_pic: host.user.profile_picture,
    })) ?? [];

  const eventRsvps: PersonCard[] =
    event?.rsvps?.map((rsvp) => ({
      id: rsvp.user.id,
      name: `${rsvp.user.first_name ?? ''} ${rsvp.user.last_name ?? ''}`.trim(),
      profile_pic: rsvp.user.profile_picture,
    })) ?? [];

  const eventHost: PersonCard | undefined = eventHosts[0];

  // Storage images
  const hostPaths = useMemo(
    () => [eventHost?.profile_pic].filter(Boolean) as string[],
    [eventHost?.profile_pic]
  );
  const { data: hostAvatar, isLoading: hostAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: hostPaths,
  });

  const rsvpPaths = useMemo(
    () => eventRsvps.map((r) => r.profile_pic).filter(Boolean) as string[],
    [eventRsvps]
  );
  const { data: eventRsvpsAvatar = [], isLoading: eventRsvpsAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: rsvpPaths,
  });

  const eventStart = dayjs(event?.starts_at);
  const chatOpen = !dayjs().isBefore(eventStart.subtract(24, 'hour'));

  // Messages feed (the list’s data)
  const { messages, initializing, hasMore, post } = useEventMessagesFeed(params.eventId, {
    pageSize: 10,
  });

  const onSend = async (text: string) => {
    try {
      if (!text.trim()) return;
      await post(text.trim());
    } catch (e: any) {
      Alert.alert('Failed to send', e?.message ?? 'Unknown error');
    }
  };

  // MAIN single VirtualizedList
  return (
    <SafeAreaView className="h-full bg-background-dark">
      <FlatList<EventMessage>
        data={!chatOpen ? messages : []} // only load discussion items when chat is open
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          return <MessageRow body={item.body} user={item.user} createdAt={item.created_at} />;
        }}
        // Everything that used to be inside your ScrollView lives here:
        ListHeaderComponent={
          isReady ? (
            <EventDetailsHeader
              event={event}
              userId={userId}
              eventHost={eventHost}
              hostAvatarUrl={hostAvatar?.[0] ?? null}
              hostAvatarLoading={hostAvatarLoading}
              isRsvped={isRsvped}
              rsvpLoading={rsvpLoading}
              membership_role={membership_role}
              eventRsvps={eventRsvps}
              eventRsvpsAvatar={eventRsvpsAvatar}
              eventRsvpsAvatarLoading={eventRsvpsAvatarLoading}
              chatOpen={chatOpen}
            />
          ) : (
            <View style={{ padding: 16 }}>
              <Text>Loading…</Text>
            </View>
          )
        }
        ListFooterComponent={
          <>
            {chatOpen ? (
              <Text>Chat opens 24 hours before the event begins — join the conversation!</Text>
            ) : (
              <Composer onSend={onSend} />
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

function EventDetailsHeader({
  event,
  userId,
  eventHost,
  hostAvatarUrl,
  hostAvatarLoading,
  isRsvped,
  rsvpLoading,
  membership_role,
  eventRsvps,
  eventRsvpsAvatar,
  eventRsvpsAvatarLoading,
  chatOpen,
}: {
  event: EventWithJoins;
  userId: string | null;
  eventHost?: PersonCard;
  hostAvatarUrl: string | null;
  hostAvatarLoading: boolean;
  isRsvped: boolean;
  rsvpLoading: boolean;
  membership_role: string;
  eventRsvps: PersonCard[];
  eventRsvpsAvatar: (string | null)[];
  eventRsvpsAvatarLoading: boolean;
  chatOpen: boolean;
}) {
  return (
    <View>
      {/* Hero image + gradient */}
      <View className="relative">
        <EventCard
          event={event}
          favorited={!!userId && userId !== eventHost?.id}
          imageSize="cover"
          rounded="none"
          showDate={false}
          showLocation={false}
          showTitle={false}
          showToken={false}
        />
        <LinearGradient
          colors={['transparent', '#0F1012']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 125 }}
        />
      </View>

      <Flex className="px-4" gap={6}>
        {/* Title / Meta */}
        <Flex>
          <Text size="3xl" bold>
            {event.title}
          </Text>
          <Flex direction="row" gap={4}>
            <Flex direction="row" align="center" gap={2}>
              <Calendar color={'white'} size={14} />
              <Text size="lg" className="text-white">
                {dayjs(event.starts_at).format('ddd, MMM DD')}
              </Text>
            </Flex>
            <Flex direction="row" align="center" gap={2}>
              <Clock color={'white'} size={14} />
              <Text size="lg" className="text-white">
                {dayjs(event.starts_at).format('h:mm A')}
              </Text>
            </Flex>
            <Flex direction="row" align="center" gap={2}>
              <MapPin color={'white'} size={14} />
              <Text size="lg" className="text-white">
                {event.location}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* Host */}
        <Flex direction="row" align="center" gap={4}>
          {eventHost ? (
            <>
              {hostAvatarUrl && !hostAvatarLoading ? (
                <Image alt="picture of host" rounded="full" source={{ uri: hostAvatarUrl }} />
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

        {/* RSVP buttons (hide for host) */}
        {userId !== eventHost?.id && (
          <>
            {!isRsvped ? (
              <RsvpButton userId={userId ?? ''} eventId={event.id} isLoading={rsvpLoading} />
            ) : (
              <CancelRsvpButton userId={userId ?? ''} eventId={event.id} />
            )}
          </>
        )}

        {/* About */}
        <Flex>
          <Text bold size="2xl">
            About this event
          </Text>
          <Text>{event.description}</Text>
        </Flex>

        {/* Categories */}
        {!!event.category?.length && (
          <Flex gap={2}>
            <Text bold size="2xl">
              Vibe Check
            </Text>
            {event.category.map((cat) => (
              <Button key={cat} variant="tag" className="h-7 w-24 rounded-lg" disabled>
                <Text weight="600" className="text-primary-200">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Button>
            ))}
          </Flex>
        )}

        {/* Attendees (horizontal is fine) */}
        {membership_role !== 'basic' && (
          <Flex gap={4}>
            <Text bold size="2xl">
              Attendees
            </Text>
            {eventRsvps.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Flex direction="row" align="center" gap={10}>
                  {eventRsvps.map((rsvp, i) => (
                    <Flex key={rsvp.id} align="center" gap={4}>
                      {eventRsvpsAvatar && !eventRsvpsAvatarLoading ? (
                        <Image
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
                  ))}
                </Flex>
              </ScrollView>
            ) : (
              <Text>Be the first to RSVP!</Text>
            )}
          </Flex>
        )}

        <Flex direction="row" justify="space-between">
          <Flex direction="row" align="center" gap={2}>
            <MessagesSquare color={'white'} size={20} />
            <Text bold size="2xl">
              Discussion
            </Text>
          </Flex>
          {!chatOpen && (
            <Button
              variant="link"
              // onPress={loadMore}
              className="mx-4 my-3">
              <Text>View All</Text>
            </Button>
          )}
        </Flex>
      </Flex>
    </View>
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
  const onSubmit = () =>
    createRsvp.mutate({ eventId, userId }, { onError: () => Alert.alert('Something went wrong') });

  return (
    <Button
      className="h-14 bg-primary"
      onPress={onSubmit}
      disabled={isLoading || createRsvp.isPending}>
      <Text bold size="xl">
        {createRsvp.isPending ? <Spinner /> : 'Rsvp'}
      </Text>
    </Button>
  );
}

function CancelRsvpButton({ eventId, userId }: { eventId: string; userId: string }) {
  const removeRsvp = useRemoveRsvp();

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
    <Button className="h-14 bg-primary" onPress={onCancelSubmit} disabled={removeRsvp.isPending}>
      <Text bold size="xl">
        {removeRsvp.isPending ? <Spinner /> : 'Cancel Rsvp'}
      </Text>
    </Button>
  );
}

/* === Discussion bits === */

type ComposerProps = { onSend: (text: string) => void | Promise<void> };

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSend(trimmed);
    setText('');
  };

  return (
    <Flex className="my-4" gap={4}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a message…"
        multiline
        className="rounded-lg border border-gray-800 p-3 text-white"
      />
      <Button onPress={handleSend} className="mt-2">
        <Text>Send</Text>
      </Button>
    </Flex>
  );
}

type MessageRowProps = {
  body: string;
  user?: EventMessage['user'];
  createdAt: string;
};

export function MessageRow({ body, user, createdAt }: MessageRowProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomColor: '#222',
        borderBottomWidth: 1,
      }}>
      <Flex direction="row" align="center" gap={8}>
        {user?.profile_picture ? (
          <Image alt="" source={{ uri: user.profile_picture }} rounded="full" size="xs" />
        ) : (
          <Box className="h-9 w-9 rounded-full bg-slate-500" />
        )}
        <Flex className="flex-1">
          <Text bold>{(user?.first_name ?? '') + ' ' + (user?.last_name ?? '')}</Text>
          <Text>{body}</Text>
          <Text className="text-primary-200">
            {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Flex>
      </Flex>
    </View>
  );
}
