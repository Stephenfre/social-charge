import { useEffect, useRef, useState } from 'react';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';

type ChatUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role?: string | null;
};

type EventChatMessageRow = {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

export type EventChatMessage = EventChatMessageRow & {
  user?: ChatUser | null;
  optimistic?: boolean;
};

type EventChatQueryRow = EventChatMessageRow;

type FetchEventMessagesOptions = {
  before?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 50;

const insertOrdered = (list: EventChatMessage[], msg: EventChatMessage) => {
  if (list.some((m) => m.id === msg.id)) return list;
  const next = [...list, msg];
  next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return next;
};

export function useEventChat(eventId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userMapRef = useRef<Record<string, ChatUser>>({});

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!eventId) {
        setMessages([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await fetchEventMessages(eventId, { limit: DEFAULT_LIMIT });
        if (!isActive) return;
        const rows = data.reverse().map((row) => ({
          ...row,
          user: null,
        }));
        setMessages(rows);
      } catch {
        if (!isActive) return;
        setMessages([]);
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const hydrateUser = async (userId: string) => {
      const cached = userMapRef.current[userId];
      if (cached) return cached;
      const { data } = await supabase
        .from('users')
        .select('id,first_name,last_name,profile_picture,role')
        .eq('id', userId)
        .maybeSingle<ChatUser>();
      if (data) userMapRef.current[userId] = data;
      return data ?? null;
    };

    const unsubscribe = subscribeToEventMessages(
      eventId,
      async (row) => {
        if (row.deleted_at) return;
        const u = await hydrateUser(row.user_id);
        setMessages((prev) => insertOrdered(prev, { ...row, user: u ?? null }));
      },
      `event:${eventId}:chat`
    );

    return unsubscribe;
  }, [eventId]);

  const addOptimisticMessage = (body: string) => {
    if (!eventId) return '';
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: EventChatMessage = {
      id: optimisticId,
      event_id: eventId,
      user_id: user?.id ?? 'unknown',
      body,
      created_at: new Date().toISOString(),
      deleted_at: null,
      optimistic: true,
      user: user
        ? {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_picture: user.profile_picture,
          }
        : null,
    };
    setMessages((prev) => insertOrdered(prev, optimisticMsg));
    return optimisticId;
  };

  const replaceMessage = (optimisticId: string, next: EventChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === optimisticId ? next : m)));
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    messages,
    isLoading,
    addOptimisticMessage,
    replaceMessage,
    removeMessage,
  };
}

export async function fetchEventMessages(
  eventId: string,
  options: FetchEventMessagesOptions = {}
) {
  const { before, limit = DEFAULT_LIMIT } = options;

  let query = supabase
    .from('event_messages')
    .select('id,event_id,user_id,body,created_at,deleted_at')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as EventChatQueryRow[];
}

export function subscribeToEventMessages(
  eventId: string,
  onInsert: (message: EventChatMessageRow) => void,
  channelName?: string
) {
  const channel = supabase
    .channel(channelName ?? `event-chat:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        onInsert(payload.new as EventChatMessageRow);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sendEventMessage(eventId: string, body: string) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user) {
    throw new Error('Not authenticated');
  }

  const payload = {
    event_id: eventId,
    user_id: sessionData.session.user.id,
    body,
  };

  const { data, error } = await supabase
    .from('event_messages')
    .insert(payload)
    .select('id,event_id,user_id,body,created_at,deleted_at')
    .single<EventChatMessageRow>();

  if (error || !data) throw error ?? new Error('Failed to send message');
  return data;
}
