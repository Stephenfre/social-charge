// hooks/useEventMessagesFeed.ts
import { useEffect, useRef, useState } from 'react';
import { EventMessage, fetchEventMessages, postEventMessage } from '~/api/event-messages';
import { supabase } from '~/lib/supabase';

type Options = { pageSize?: number };

export function useEventMessagesFeed(eventId: string, opts: Options = {}) {
  const pageSize = opts.pageSize ?? 30;

  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Load initial batch
  useEffect(() => {
    let active = true;
    setInitializing(true);
    setMessages([]);
    setHasMore(true);

    (async () => {
      try {
        const batch = await fetchEventMessages(eventId, pageSize);
        if (!active) return;
        setMessages(batch); // newest → oldest
        setHasMore(batch.length === pageSize); // if we got a full page, there may be more
      } catch (e) {
        console.error('load initial messages failed', e);
      } finally {
        if (active) setInitializing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [eventId, pageSize]);

  // Load more (older) on demand
  const loadMore = async () => {
    if (loadingRef.current || !hasMore || messages.length === 0) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const last = messages[messages.length - 1]; // oldest currently loaded
      const older = await fetchEventMessages(eventId, pageSize, last.created_at);
      // Append and dedupe
      setMessages((prev) => dedupeById([...prev, ...older]));
      setHasMore(older.length === pageSize);
    } catch (e) {
      console.error('load more failed', e);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };

  // Realtime: merge INSERT/UPDATE/DELETE
  useEffect(() => {
    if (!eventId) return;

    const handler = (payload: any) => {
      console.log('[realtime change]', payload.eventType, payload.new ?? payload.old);
      setMessages((prev) => {
        if (!prev) return prev;
        switch (payload.eventType) {
          case 'INSERT': {
            const msg = payload.new as EventMessage;
            if (msg.deleted_at) return prev;
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [msg, ...prev];
          }
          case 'DELETE': {
            const id = (payload.old as any).id as string;
            return prev.filter((m) => m.id !== id);
          }
          default:
            return prev;
        }
      });
    };

    const channel = supabase
      .channel(`event-messages:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        handler
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        handler
      )
      .subscribe((status, err) => {
        console.log('[realtime status]', status, err ?? '');
      });

    // optional: log low-level socket state
    console.log(
      '[socket state]',
      supabase.getChannels().map((c) => c.state)
    );

    return () => {
      // Either is fine:
      // channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const newestToOldest = messages; // already sorted newest→oldest

  return {
    messages: newestToOldest,
    initializing,
    loadMore,
    loadingMore,
    hasMore,
    post: (body: string) => postEventMessage(eventId, body), // handy passthrough
  };
}

function dedupeById(list: EventMessage[]) {
  const seen = new Set<string>();
  const out: EventMessage[] = [];
  for (const m of list) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}
