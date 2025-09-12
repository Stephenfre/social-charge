// hooks/useRsvps.ts
import { Tables, TablesInsert } from '@/database.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow, UserEventCardRow } from '~/types/event.types';

const KEYS = {
  userEvents: ['events', 'userEvents'] as const,
  eventById: (id: string) => ['events', 'eventById', id] as const,
  rsvps: (id: string) => ['rsvps', id] as const,
  checkIn: ['events', 'checkInEvent'] as const, // <— use this everywhere
};

export type RsvpRow = Tables<'rsvps'>;
export type RsvpInsert = TablesInsert<'rsvps'>;

export function useRsvps(eventId: string) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    initialData: undefined,
    queryFn: async (): Promise<RsvpRow[]> => {
      const { data, error } = await supabase.from('rsvps').select('*').eq('event_id', eventId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateRsvp() {
  const qc = useQueryClient();

  return useMutation<'added' | 'removed', unknown, ToggleArgs, Ctx>({
    mutationFn: async ({ eventId, userId }) => {
      const { data: existing, error: exErr } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1);
      if (exErr) throw exErr;

      if (existing?.length) {
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (error) throw error;
        return 'removed';
      }

      const { error: upsertErr } = await supabase
        .from('rsvps')
        .upsert([{ event_id: eventId, user_id: userId }], {
          onConflict: 'user_id,event_id',
          ignoreDuplicates: true,
        });
      if (upsertErr) throw upsertErr;
      return 'added';
    },

    onMutate: async ({ eventId, userId }) => {
      await qc.cancelQueries({ queryKey: KEYS.userEvents });
      await qc.cancelQueries({ queryKey: KEYS.checkIn });
      await qc.cancelQueries({ queryKey: KEYS.rsvps(eventId) });

      const listSnaps = qc.getQueriesData<UserEventCardRow[]>({ queryKey: KEYS.userEvents });
      const rsvpKey = KEYS.rsvps(eventId);
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      const isRsvped = prevRsvps.some((r) => r.user_id === userId);

      if (isRsvped) {
        qc.setQueryData<RsvpRow[]>(
          rsvpKey,
          prevRsvps.filter((r) => r.user_id !== userId)
        );
        // update ONLY userEvents lists
        qc.setQueriesData<UserEventCardRow[]>({ queryKey: KEYS.userEvents }, (prev) =>
          (prev ?? []).filter((e) => e.id !== eventId)
        );
      } else {
        const optimistic: RsvpRow = {
          id: `optimistic-${Date.now()}`,
          event_id: eventId,
          user_id: userId,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<RsvpRow[]>(rsvpKey, [optimistic, ...prevRsvps]);

        // try to add to userEvents from cached event detail
        const detail = qc.getQueryData<EventRow>(KEYS.eventById(eventId));
        if (detail) {
          const status: 'upcoming' | 'past' =
            new Date(detail.starts_at) >= new Date() ? 'upcoming' : 'past';

          const card: UserEventCardRow = {
            id: detail.id,
            title: detail.title,
            cover_img: detail.cover_img,
            starts_at: detail.starts_at,
            created_at: detail.created_at,
            event_status: status,
          };

          qc.setQueriesData<UserEventCardRow[]>({ queryKey: KEYS.userEvents }, (prev) => {
            const arr = prev ?? [];
            return arr.some((e) => e.id === card.id) ? arr : [card, ...arr];
          });

          // (Optional) optimistic check-in: if this event is today and sooner than current,
          // you can set it—but simplest is just to invalidate on settle.
        }
      }

      return { listSnaps, rsvpKey, prevRsvps };
    },

    onError: (_e, _v, ctx) => {
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      if (ctx) qc.setQueryData(ctx.rsvpKey, ctx.prevRsvps);
    },

    onSettled: (_res, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: KEYS.rsvps(eventId) });
      qc.invalidateQueries({ queryKey: KEYS.eventById(eventId) });
      qc.invalidateQueries({ queryKey: KEYS.userEvents });
      qc.invalidateQueries({ queryKey: KEYS.checkIn }); // <— refetch RPC
    },
  });
}

type RemoveArgs = { eventId: string; userId: string };
type ListSnap = [key: readonly unknown[], data: UserEventCardRow[] | undefined];
type Ctx = { listSnaps: ListSnap[]; rsvpKey: ReturnType<typeof KEYS.rsvps>; prevRsvps: RsvpRow[] };

export function useRemoveRsvp() {
  const qc = useQueryClient();

  return useMutation<void, unknown, RemoveArgs, Ctx>({
    mutationFn: async ({ eventId, userId }) => {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
      if (error) throw error;
    },

    onMutate: async ({ eventId, userId }) => {
      // Pause relevant queries
      await qc.cancelQueries({ queryKey: KEYS.userEvents });
      await qc.cancelQueries({ queryKey: KEYS.checkIn });
      await qc.cancelQueries({ queryKey: KEYS.rsvps(eventId) });

      // Snapshot lists for rollback
      const listSnaps = qc.getQueriesData<UserEventCardRow[]>({ queryKey: KEYS.userEvents });

      // Optimistically remove event from ALL userEvents lists
      qc.setQueriesData<UserEventCardRow[]>({ queryKey: KEYS.userEvents }, (prev) =>
        (prev ?? []).filter((e) => e.id !== eventId)
      );

      // Optimistically remove user from RSVPs cache (if present)
      const rsvpKey = KEYS.rsvps(eventId);
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      qc.setQueryData<RsvpRow[]>(
        rsvpKey,
        prevRsvps.filter((r) => r.user_id !== userId)
      );

      return { listSnaps, rsvpKey, prevRsvps };
    },

    onError: (_err, _vars, ctx) => {
      // Rollback lists
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      // Rollback RSVPs
      if (ctx) qc.setQueryData(ctx.rsvpKey, ctx.prevRsvps);
    },

    onSettled: (_res, _err, { eventId }) => {
      // Sync with server
      qc.invalidateQueries({ queryKey: KEYS.userEvents });
      qc.invalidateQueries({ queryKey: KEYS.checkIn });
      qc.invalidateQueries({ queryKey: KEYS.eventById(eventId) });
      qc.invalidateQueries({ queryKey: KEYS.rsvps(eventId) });
    },
  });
}
