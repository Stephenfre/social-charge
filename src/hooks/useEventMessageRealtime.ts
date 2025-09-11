// hooks/useEventMessagesRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventMessage } from '~/api/event-messages';

export function useEventMessagesRealtime(eventId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-messages:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          qc.setQueryData(['eventMessages', eventId], (prev: any) => {
            if (!prev?.pages) return prev;
            const pages: EventMessage[][] = prev.pages;

            switch (payload.eventType) {
              case 'INSERT': {
                const msg = payload.new as EventMessage;
                // Avoid dupes: if already optimistically added, skip
                if (pages[0]?.some((m) => m.id === msg.id)) return prev;
                return { ...prev, pages: [[msg, ...pages[0]], ...pages.slice(1)] };
              }
              case 'UPDATE': {
                const updated = payload.new as EventMessage;
                const nextPages = pages.map((pg) =>
                  pg.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
                );
                return { ...prev, pages: nextPages };
              }
              case 'DELETE': {
                const deletedId = (payload.old as any).id as string;
                const nextPages = pages.map((pg) => pg.filter((m) => m.id !== deletedId));
                return { ...prev, pages: nextPages };
              }
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);
}
