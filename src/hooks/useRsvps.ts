// hooks/useRsvps.ts
import { Tables, TablesInsert } from '@/database.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { EventRow, UserEventCardRow } from '~/types/event.types';
import { EVENT_KEYS } from './useEvents';
import { useAuth } from '~/providers/AuthProvider';

const RSVP_KEYS = {
  userEvents: ['events', 'userEvents'] as const,
  eventById: (id: string) => ['events', 'eventById', id] as const,
  rsvps: (id: string) => ['rsvps', id] as const,
  checkIn: ['events', 'checkInEvent'] as const,
  eventVibes: ['events', 'eventVibes'] as const,
};

export type RsvpRow = Tables<'rsvps'>;
export type RsvpInsert = TablesInsert<'rsvps'>;
type ToggleArgs = {
  eventId: string;
  userId: string;
};

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
      await qc.cancelQueries({ queryKey: RSVP_KEYS.userEvents });
      await qc.cancelQueries({ queryKey: RSVP_KEYS.checkIn });
      await qc.cancelQueries({ queryKey: RSVP_KEYS.rsvps(eventId) });

      const listSnaps = qc.getQueriesData<UserEventCardRow[]>({ queryKey: RSVP_KEYS.userEvents });
      const rsvpKey = RSVP_KEYS.rsvps(eventId);
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      const isRsvped = prevRsvps.some((r) => r.user_id === userId);

      if (isRsvped) {
        qc.setQueryData<RsvpRow[]>(
          rsvpKey,
          prevRsvps.filter((r) => r.user_id !== userId)
        );
        // update ONLY userEvents lists
        qc.setQueriesData<UserEventCardRow[]>({ queryKey: RSVP_KEYS.userEvents }, (prev) =>
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
        const detail = qc.getQueryData<EventRow>(RSVP_KEYS.eventById(eventId));
        if (detail) {
          const status: 'upcoming' | 'past' =
            new Date(detail.starts_at) >= new Date() ? 'upcoming' : 'past';

          const card: UserEventCardRow = {
            id: detail.id,
            title: detail.title,
            cover_img: detail.cover_img,
            starts_at: detail.starts_at,
            ends_at: detail.ends_at,
            created_at: detail.created_at,
            event_status: status,
          };

          qc.setQueriesData<UserEventCardRow[]>({ queryKey: RSVP_KEYS.userEvents }, (prev) => {
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
      qc.invalidateQueries({ queryKey: RSVP_KEYS.rsvps(eventId) });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.eventById(eventId) });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.userEvents });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.checkIn });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.eventVibes });
    },
  });
}

type RemoveArgs = { eventId: string };
type ListSnap = [key: readonly unknown[], data: UserEventCardRow[] | undefined];
type Ctx = {
  listSnaps: ListSnap[];
  rsvpKey: ReturnType<typeof RSVP_KEYS.rsvps>;
  prevRsvps: RsvpRow[];
};

export function useRemoveRsvp() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation<void, unknown, RemoveArgs, Ctx>({
    mutationFn: async ({ eventId }) => {
      // Always use the authenticated user for RLS
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes.user) throw userErr ?? new Error('No auth user');
      const currentUser = userRes.user.id;

      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', currentUser)
        .select('*');

      if (error) {
        throw error;
      }
    },

    onMutate: async ({ eventId }) => {
      // use auth user for optimistic update as well
      const { data: userRes } = await supabase.auth.getUser();
      const me = userRes?.user?.id;
      await qc.cancelQueries({ queryKey: RSVP_KEYS.userEvents });
      await qc.cancelQueries({ queryKey: RSVP_KEYS.checkIn });
      await qc.cancelQueries({ queryKey: RSVP_KEYS.rsvps(eventId) });

      const listSnaps = qc.getQueriesData<UserEventCardRow[]>({ queryKey: RSVP_KEYS.userEvents });

      // Optimistically remove event from userEvents
      qc.setQueriesData<UserEventCardRow[]>({ queryKey: RSVP_KEYS.userEvents }, (prev) =>
        (prev ?? []).filter((e) => e.id !== eventId)
      );

      // Optimistically remove from rsvps cache
      const rsvpKey = RSVP_KEYS.rsvps(eventId);
      const prevRsvps = qc.getQueryData<RsvpRow[]>(rsvpKey) ?? [];
      qc.setQueryData<RsvpRow[]>(
        rsvpKey,
        prevRsvps.filter((r) => (me ? r.user_id !== me : true))
      );

      return { listSnaps, rsvpKey, prevRsvps };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      if (ctx) qc.setQueryData(ctx.rsvpKey, ctx.prevRsvps);
    },

    onSettled: (_res, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: RSVP_KEYS.userEvents });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.checkIn });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.eventById(eventId) });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.rsvps(eventId) });
      qc.invalidateQueries({ queryKey: RSVP_KEYS.eventVibes });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(userId) });
    },
  });
}
