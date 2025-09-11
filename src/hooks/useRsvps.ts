// hooks/useRsvps.ts
import { Tables, TablesInsert } from '@/database.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow, UserEventCardRow } from '~/types/event.types';

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

type ToggleArgs = { eventId: string; userId: string };
type ListSnap = [key: readonly unknown[], data: UserEventCardRow[] | undefined];
type Ctx = { listSnaps: ListSnap[]; rsvpKey: readonly ['rsvps', string]; prevRsvps: RsvpRow[] };

export function useCreateRsvp() {
  const qc = useQueryClient();

  return useMutation<'added' | 'removed', unknown, ToggleArgs, Ctx>({
    // Toggle on server (insert if absent, delete if present)
    mutationFn: async ({ eventId, userId }) => {
      const { data: existing, error: exErr } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length) {
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

    // Optimistic update + snapshots for rollback
    onMutate: async ({ eventId, userId }) => {
      await qc.cancelQueries({ queryKey: ['events', 'userEvents'] });
      await qc.cancelQueries({ queryKey: ['rsvps', eventId] });

      // snapshot lists
      const listSnaps: ListSnap[] = qc.getQueriesData<UserEventCardRow[]>({
        queryKey: ['events', 'userEvents'],
      });

      // snapshot rsvps for the event
      const rsvpKey = ['rsvps', eventId] as const;
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      const isRsvped = prevRsvps.some((r) => r.user_id === userId);

      if (isRsvped) {
        // Optimistically remove
        qc.setQueryData<RsvpRow[]>(
          rsvpKey,
          prevRsvps.filter((r) => r.user_id !== userId)
        );
        // remove event from all userEvents lists
        qc.setQueriesData<UserEventCardRow[]>({ queryKey: ['events', 'userEvents'] }, (prev) =>
          (prev ?? []).filter((e) => e.id !== eventId)
        );
      } else {
        // Optimistically add
        const optimistic: RsvpRow = {
          id: `optimistic-${Date.now()}`,
          event_id: eventId,
          user_id: userId,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<RsvpRow[]>(rsvpKey, [optimistic, ...prevRsvps]);

        // Try to add event to userEvents using cached event detail
        const detail = qc.getQueryData<EventRow>(['events', 'eventById', eventId]);
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

          qc.setQueriesData<UserEventCardRow[]>({ queryKey: ['events', 'userEvents'] }, (prev) => {
            const arr = prev ?? [];
            if (arr.some((e) => e.id === card.id)) return arr;
            return [card, ...arr];
          });
        }
      }

      // context used for rollback
      return { listSnaps, rsvpKey, prevRsvps };
    },

    // Rollback
    onError: (_err, _vars, ctx) => {
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      if (ctx) qc.setQueryData(ctx.rsvpKey, ctx.prevRsvps);
    },

    // Sync with server
    onSettled: (_res, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['rsvps', eventId] });
      qc.invalidateQueries({ queryKey: ['events', 'eventById', eventId] });
      qc.invalidateQueries({ queryKey: ['events', 'userEvents'] });
    },
  });
}

type RemoveArgs = {
  eventId: string;
  userId: string;
};

export function useRemoveRsvp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: RemoveArgs) => {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
    },

    // Optimistic update
    onMutate: async ({ eventId, userId }) => {
      // 1) Pause queries
      await qc.cancelQueries({ queryKey: ['events', 'userEvents'] });
      await qc.cancelQueries({ queryKey: ['rsvps', eventId] });

      // 2) Snapshot lists to roll back later
      const listSnaps = qc.getQueriesData<UserEventCardRow[]>({
        queryKey: ['events', 'userEvents'],
      });

      // 3) Optimistically remove this event from ALL cached userEvents lists
      qc.setQueriesData<UserEventCardRow[]>({ queryKey: ['events', 'userEvents'] }, (prev) =>
        (prev ?? []).filter((e) => e.id !== eventId)
      );

      // 4) Also update the RSVP list cache for that event (if you cache it)
      const rsvpKey = ['rsvps', eventId] as const;
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      qc.setQueryData<RsvpRow[]>(
        rsvpKey,
        prevRsvps.filter((r) => r.user_id !== userId)
      );

      // 5) Return context for rollback
      return { listSnaps, rsvpKey, prevRsvps };
    },

    // Rollback if error
    onError: (_err, _vars, ctx) => {
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      if (ctx) qc.setQueryData(ctx.rsvpKey, ctx.prevRsvps);
    },

    // Always refetch latest server state
    onSettled: (_res, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['events', 'userEvents'] });
      qc.invalidateQueries({ queryKey: ['events', 'eventById', eventId] }); // if you cache event detail
      qc.invalidateQueries({ queryKey: ['rsvps', eventId] });
    },
  });
}
