import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import { Send, User as UserIcon, X } from 'lucide-react-native';
import { Box, Image, Text } from '~/components/ui';
import { useChatUserMetadata, useStorageImages } from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import { useRouteStack } from '~/types/navigation.types';
import { sendEventMessage, useEventChat } from '~/hooks/useEventChat';
import { cn } from '~/utils/cn';

type EventChatViewProps = {
  eventId: string | null;
  currentUserId?: string | null;
  highlightMessageId?: string | null;
  eventStartsAt?: string | null;
  eventEndsAt?: string | null;
};

export function EventChatScreen() {
  const route = useRouteStack<'EventChat'>();
  const eventId = route.params?.eventId ?? null;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <EventChatView eventId={eventId} />
    </KeyboardAvoidingView>
  );
}

export function EventChatModal({
  visible,
  onClose,
  eventId,
  currentUserId,
  highlightMessageId,
  eventTitle,
  eventStartsAt,
  eventEndsAt,
  topInset = 0,
}: {
  visible: boolean;
  onClose: () => void;
  eventId: string | null;
  currentUserId?: string | null;
  highlightMessageId?: string | null;
  eventTitle?: string;
  eventStartsAt?: string | null;
  eventEndsAt?: string | null;
  topInset?: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background-dark" style={{ paddingTop: topInset }}>
        {eventTitle ? (
          <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
            <Text bold className="text-lg text-typography-light">
              {eventTitle}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={onClose}
              className="h-9 w-9 items-center justify-center">
              <X size={22} color="#fff" />
            </Pressable>
          </View>
        ) : null}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <EventChatView
            eventId={eventId}
            currentUserId={currentUserId}
            highlightMessageId={highlightMessageId}
            eventStartsAt={eventStartsAt}
            eventEndsAt={eventEndsAt}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function EventChatView({
  eventId,
  currentUserId,
  highlightMessageId,
  eventStartsAt,
  eventEndsAt,
}: EventChatViewProps) {
  const { user } = useAuth();
  const { messages, isLoading, addOptimisticMessage, replaceMessage, removeMessage } =
    useEventChat(eventId);

  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatUserIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((message) => {
      if (message.user_id) ids.add(message.user_id);
    });
    return Array.from(ids);
  }, [messages]);

  const { avatarPathByUserId, roleByUserId } = useChatUserMetadata(chatUserIds);

  const avatarPaths = useMemo(() => {
    const paths = Array.from(avatarPathByUserId.values()).filter(Boolean) as string[];
    return Array.from(new Set(paths));
  }, [avatarPathByUserId]);

  const { data: avatarUrls, isLoading: avatarLoading, isError: avatarError } = useStorageImages({
    bucket: 'avatars',
    paths: avatarPaths,
  });

  const avatarMap = useMemo(() => {
    const map = new Map<string, string | null>();
    avatarPaths.forEach((path, index) => {
      map.set(path, avatarUrls?.[index] ?? null);
    });
    return map;
  }, [avatarPaths, avatarUrls]);

  const listData = useMemo(() => [...messages].reverse(), [messages]);
  const canSend = body.trim().length > 0 && !isSending;
  const effectiveUserId = currentUserId ?? user?.id ?? null;
  const isChatOpen = useMemo(() => {
    if (!eventStartsAt) return true;
    const opensAt = dayjs(eventStartsAt).subtract(24, 'hour');
    return dayjs().isAfter(opensAt);
  }, [eventStartsAt]);
  const hasEventEnded = useMemo(() => {
    if (!eventEndsAt) return false;
    return dayjs().isAfter(dayjs(eventEndsAt));
  }, [eventEndsAt]);
  const canShowInput = isChatOpen && !hasEventEnded;

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || !eventId || isSending || !canShowInput) return;

    setBody('');
    const optimisticId = addOptimisticMessage(trimmed);
    setIsSending(true);

    try {
      const inserted = await sendEventMessage(eventId, trimmed);
      replaceMessage(optimisticId, {
        ...inserted,
        user: user
          ? {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              profile_picture: user.profile_picture,
            }
          : null,
      });
    } catch (err) {
      removeMessage(optimisticId);
      Alert.alert('Message failed', 'Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [addOptimisticMessage, body, eventId, isSending, removeMessage, replaceMessage, user]);

  const emptyState = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-8">
          <Text className="text-typography-400">Loading messages...</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-typography-400">Be the first to ask a question.</Text>
      </View>
    );
  }, [isLoading]);



  return (
    <View className="flex-1">
      <FlatList
        data={listData}
        inverted
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={emptyState}
        renderItem={({ item }) => {
          const isMine = item.user_id === effectiveUserId;
          const avatarPath = item.user_id ? avatarPathByUserId.get(item.user_id) ?? null : null;
          const avatarUri = avatarPath ? avatarMap.get(avatarPath) ?? null : null;
          const rawRole = item.user_id ? roleByUserId.get(item.user_id) ?? null : null;
          const roleLabel =
            rawRole === 'super_admin' || rawRole === 'admin'
              ? 'Admin'
              : rawRole === 'host'
                ? 'Host'
                : null;
          const isHighlighted = Boolean(highlightMessageId && item.id === highlightMessageId);
          return (
            <View
              className={cn(
                'm-3 flex-row items-end',
                isMine ? 'flex-row-reverse self-end' : 'self-start'
              )}>
              <View className={cn(isMine ? 'ml-2' : 'mr-2')}>
                <ChatAvatar uri={avatarUri} loading={avatarLoading} error={avatarError} />
              </View>
              <View className={cn(' max-w-[65%]  ', isMine ? 'items-end' : 'items-start')}>
                {roleLabel ? (
                  <Text className="mb-1 text-[10px] uppercase">
                    {roleLabel}
                  </Text>
                ) : null}
                <View
                  className={cn(
                    'rounded-2xl px-4 py-2 ',
                    isMine ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-secondary',
                    isHighlighted && 'border border-yellow-400'
                  )}>
                  <Text className={cn(isMine ? 'text-white' : 'text-typography-light')}>
                    {item.body}
                  </Text>
                </View>
                <Text className={cn('mt-1 text-xs', isMine ? 'text-right' : 'text-left')}>
                  {dayjs(item.created_at).format('h:mm A')}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View className="mx-5 mb-8">
        {canShowInput ? (
          <View className="flex-row items-center rounded-3xl border border-[#2C2C2E] bg-[#1C1C1E] px-4">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Message"
              placeholderTextColor="#6B6B6F"
              multiline
              textAlignVertical="center"
              className="flex-1 py-2 text-base text-white"
            />
            {canSend && (
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                className={cn(
                  'ml-2 my-2 h-10 w-14 items-center justify-center rounded-2xl',
                  canSend ? 'bg-[#0A84FF]' : 'bg-[#2C2C2E]'
                )}>
                <Send size={18} color="#fff" />
              </Pressable>
            )}
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-center text-sm text-white/20">
              {hasEventEnded ? 'Event has ended' : 'Chat opens 24 hours before event'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

type ChatAvatarProps = {
  uri?: string | null;
  loading?: boolean;
  error?: boolean;
};

function ChatAvatar({ uri, loading, error }: ChatAvatarProps) {
  if (!uri || loading || error) {
    return (
      <Box className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-background-400">
        <UserIcon size={18} color="#94A3B8" />
      </Box>
    );
  }

  return <Image alt="user avatar" size='xs' rounded="full" source={{ uri }} />;
}
