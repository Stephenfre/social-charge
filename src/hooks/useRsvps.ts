// hooks/useRsvps.ts
import { Tables, TablesInsert } from '@/database.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';

export type RsvpRow = Tables<'rsvps'>;
export type RsvpInsert = TablesInsert<'rsvps'>;

export const rsvpKeys = {
  list: (eventId: string) => ['rsvps', eventId] as const,
};

export function useRsvps(eventId: string) {
  return useQuery({
    queryKey: rsvpKeys.list(eventId),
    queryFn: async (): Promise<RsvpRow[]> => {
      const { data, error } = await supabase.from('rsvps').select('*').eq('event_id', eventId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

type ToggleArgs = { eventId: string; userId: string };

export function useCreateRsvp() {
  const qc = useQueryClient();

  return useMutation({
    // we’ll decide insert vs delete inside mutationFn
    mutationFn: async ({ eventId, userId }: ToggleArgs): Promise<'added' | 'removed'> => {
      // Is there currently an RSVP?
      const { data: existing, error: exErr } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length) {
        // UN-RSVP: delete
        const { error: delErr } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (delErr) throw delErr;
        return 'removed';
      } else {
        // RSVP: idempotent add via upsert
        const { error: upsertErr } = await supabase
          .from('rsvps')
          .upsert([{ event_id: eventId, user_id: userId }] as RsvpInsert[], {
            onConflict: 'user_id,event_id',
            ignoreDuplicates: true,
          })
          .select()
          .single();
        if (upsertErr) throw upsertErr;
        return 'added';
      }
    },

    // Optimistic cache update
    onMutate: async ({ eventId, userId }) => {
      const key = rsvpKeys.list(eventId);
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<RsvpRow[]>(key) ?? [];

      const isRsvped = prev.some((r) => r.user_id === userId);

      if (isRsvped) {
        // remove optimistically
        qc.setQueryData<RsvpRow[]>(
          key,
          prev.filter((r) => r.user_id !== userId)
        );
      } else {
        // add a lightweight optimistic row
        const optimistic: RsvpRow = {
          id: `optimistic-${Date.now()}`,
          created_at: new Date().toISOString(),
          user_id: userId,
          event_id: eventId,
        };
        qc.setQueryData<RsvpRow[]>(key, [optimistic, ...prev]);
      }

      return { key, prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev); // rollback
    },

    onSettled: (_res, _err, { eventId }) => {
      // ensure cache exactly matches server
      qc.invalidateQueries({ queryKey: rsvpKeys.list(eventId) });
      qc.invalidateQueries({ queryKey: ['events', 'eventById', eventId] }); // <-- add this
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
    mutationFn: async ({ eventId, userId }: RemoveArgs): Promise<void> => {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
    },

    // Optimistic update
    onMutate: async ({ eventId, userId }) => {
      const key = rsvpKeys.list(eventId);
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<RsvpRow[]>(key) ?? [];

      qc.setQueryData<RsvpRow[]>(
        key,
        prev.filter((r) => r.user_id !== userId)
      );

      return { key, prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev); // rollback on failure
    },

    onSettled: (_res, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: rsvpKeys.list(eventId) });
      qc.invalidateQueries({ queryKey: ['events', 'eventById', eventId] }); // <-- add this
    },
  });
}
