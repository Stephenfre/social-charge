import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { uploadEventCoverImage } from '~/lib/uploadImage';
import { useAuth } from '~/providers/AuthProvider';
import { EventRow, EventWithJoins, UserEventCardRow } from '~/types/event.types';

export function useUserEvents(limit?: number) {
  return useQuery<UserEventCardRow[]>({
    queryKey: ['events', 'userEvents', { limit }],
    queryFn: async () => {
      let q = supabase
        .from('v_user_events')
        .select('id, title, cover_img, event_status, starts_at, ends_at, created_at')
        .order('event_status', { ascending: false })
        .order('starts_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data as UserEventCardRow[]) ?? [];
    },
  });
}

type CheckInUser = {
  user_id: string;
  user: { id: string; first_name: string; last_name: string; profile_picture: string | null };
};

type CheckInResult = {
  event: EventRow; // your generated type from Supabase
  hosts: CheckInUser[] | null;
  attendees: CheckInUser[] | null;
};

export function useCheckInEvent() {
  return useQuery<CheckInResult | null>({
    queryKey: ['events', 'checkInEvent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('f_user_event_today_or_next')
        .maybeSingle<CheckInResult>(); // 👈 add the generic

      if (error) throw error;
      return data; // null if none
    },
  });
}

export function useEventById(id: string) {
  return useQuery<EventWithJoins>({
    queryKey: ['events', 'eventById', id],
    enabled: !!id,
    initialData: undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          event_hosts:event_hosts!event_hosts_event_id_fkey (
            user:users!event_hosts_user_id_fkey ( id, first_name, last_name, profile_picture )
          ),
          rsvps:rsvps!rsvps_event_id_fkey (
            user:users!rsvps_user_id_fkey ( id, first_name, last_name, profile_picture )
          )
        `
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as EventWithJoins;
    },
  });
}

const nowIso = new Date().toISOString();

export function useForYouEvents(userId: string | null) {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'justForYou', userId],
    enabled: !!userId,
    initialData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_events_for_current_user')
        .select('*')
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useUpcomingEvents() {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gt('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useLowTokenEvents() {
  return useQuery<EventRow[]>({
    queryKey: ['events', 'cheap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('token_cost', 1)
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useThisWeekendEvents() {
  return useQuery({
    queryKey: ['events', 'thisWeekend'],
    queryFn: async () => {
      const now = new Date();
      const nowIso = now.toISOString();

      // 0=Sun … 6=Sat
      const day = now.getDay();

      // Start of upcoming Friday
      const daysUntilFriday = (5 - day + 7) % 7;
      const friday = new Date(now);
      friday.setDate(now.getDate() + daysUntilFriday);
      friday.setHours(0, 0, 0, 0);

      // End of Sunday
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        // only events that start during the weekend window…
        .gte('starts_at', friday.toISOString())
        .lte('starts_at', sunday.toISOString())
        // …and have not already ended (excludes 3am-today past events)
        .gte('ends_at', nowIso)
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useTrendingEvents() {
  return useQuery({
    queryKey: ['events', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          rsvps:event_id(count)
        `
        )
        // .gte('starts_at', nowIso)
        .order('rsvps.count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as EventRow[];
    },
  });
}

/** ===== Types — align to your schema ===== */
type UpsertEventArgs = {
  id?: string; // if present => update, else create
  title: string; // if your form calls it "name", map before calling
  description: string;
  location: string;
  location_text: string;
  formatted_address: string;
  provider: string;
  place_id: string;
  ageLimit: number;
  startAtISO: string; // e.g. combine(...).toISOString()
  endAtISO: string; // if you don't store end, remove it below
  capacity: number;
  creditCost: number;
  category: string[]; // interests array
  coverImageUri: string; // local/expo file:// URI
  hostId: string; // selected host id (optional)
};

/** ===== Your query keys (same style as in useCreateRsvp) ===== */
export const KEYS = {
  events: ['events'] as const,
  eventById: (id: string) => ['event', id] as const,
  userEvents: ['user', 'events'] as const,
};

/** Server mutation doing the actual upsert */
async function upsertEvent(args: UpsertEventArgs, userId: string): Promise<EventRow> {
  const {
    id,
    title,
    description,
    location,
    location_text,
    formatted_address,
    provider,
    place_id,
    ageLimit,
    startAtISO,
    endAtISO,
    capacity,
    creditCost,
    category,
    coverImageUri,
    hostId,
  } = args;

  // map to your table schema (snake_case + token_cost)
  const base = {
    title: title.trim(),
    description: description?.trim() ?? null,
    location: location?.trim() ?? null,
    location_text: location_text.trim(),
    formatted_address: formatted_address.trim(),
    provider: provider.trim(),
    place_id: place_id.trim(),
    age_limit: ageLimit,
    starts_at: startAtISO,
    ends_at: endAtISO ?? null,
    capacity: Number(capacity),
    token_cost: Number(creditCost),
    category,
    cover_img: '',
    created_by: userId,
  };

  let eventId = id;
  let eventRow: EventRow | null = null;

  if (!eventId) {
    const { data, error } = await supabase
      .from('events')
      .insert(base)
      .select('*')
      .single<EventRow>();
    if (error) throw error;
    eventRow = data;
    eventId = data.id;
  } else {
    const { data, error } = await supabase
      .from('events')
      .update(base)
      .eq('id', eventId)
      .select('*')
      .single<EventRow>();
    if (error) throw error;
    eventRow = data;
  }

  // Upload cover (optional)
  if (coverImageUri) {
    const publicUrl = await uploadEventCoverImage(eventId!, coverImageUri);
    const { data, error } = await supabase
      .from('events')
      .update({ cover_img: publicUrl.path }) // ⇐ rename to your column
      .eq('id', eventId)
      .select('*')
      .single<EventRow>();
    if (error) throw error;
    eventRow = data;
  }

  // Reset host relation
  const { error: delErr } = await supabase.from('event_hosts').delete().eq('event_id', eventId);
  if (delErr) throw delErr;

  if (hostId) {
    const { error: insErr } = await supabase
      .from('event_hosts')
      .insert({ event_id: eventId, user_id: hostId });
    if (insErr) throw insErr;
  }

  return eventRow!;
}

/** ===== Hook with optimistic updates, same style as useCreateRsvp ===== */
type Ctx = {
  // snapshots for rollback
  listSnaps: [readonly unknown[], EventRow[] | undefined][];
  prevDetail?: EventRow;
  detailKey?: readonly unknown[];
  createdOptimisticId?: string;
};

export function useUpsertEvent(userId: string | null) {
  const qc = useQueryClient();

  return useMutation<EventRow, unknown, UpsertEventArgs, Ctx>({
    mutationFn: async (args) => {
      if (!userId) throw new Error('Not signed in');
      return upsertEvent(args, userId);
    },

    onMutate: async (vars) => {
      // stop refetches that could overwrite our optimistic state
      await qc.cancelQueries({ queryKey: KEYS.events });
      if (vars.id) await qc.cancelQueries({ queryKey: KEYS.eventById(vars.id) });
      await qc.cancelQueries({ queryKey: KEYS.userEvents });

      // snapshots
      const listSnaps = qc.getQueriesData<EventRow[]>({ queryKey: KEYS.events });
      const detailKey = vars.id ? KEYS.eventById(vars.id) : undefined;
      const prevDetail = detailKey ? qc.getQueryData<EventRow>(detailKey) : undefined;

      // optimistic event object
      const nowISO = new Date().toISOString();
      const optimisticId = vars.id ?? `optimistic-${Date.now()}`;
      const optimistic: EventRow = {
        id: optimisticId,
        title: vars.title.trim(),
        description: vars.description?.trim() ?? null,
        age_limit: vars.ageLimit,
        location_text: vars.location_text,
        formatted_address: vars.formatted_address,
        location: null,
        provider: vars.provider,
        place_id: vars.place_id,
        starts_at: vars.startAtISO,
        ends_at: vars.endAtISO ?? null,
        capacity: Number(vars.capacity),
        token_cost: Number(vars.creditCost),
        category: vars.category,
        cover_img: '',
        created_at: prevDetail?.created_at ?? nowISO,
        created_by: prevDetail?.created_by ?? userId,
      };

      // update events lists
      qc.setQueriesData<EventRow[]>({ queryKey: KEYS.events }, (prev) => {
        const arr = prev ?? [];
        const exists = arr.find((e) => e.id === optimistic.id);
        return exists
          ? arr.map((e) => (e.id === optimistic.id ? optimistic : e))
          : [optimistic, ...arr];
      });

      // update detail cache
      if (detailKey) {
        qc.setQueryData<EventRow>(detailKey, optimistic);
      }

      // optionally, update userEvents list (like your useCreateRsvp)
      qc.setQueriesData<any[]>({ queryKey: KEYS.userEvents }, (prev) => {
        const arr = prev ?? [];
        const exists = arr.find((e) => e.id === optimistic.id);
        if (exists) return arr;
        const status: 'upcoming' | 'past' =
          new Date(optimistic.starts_at) >= new Date() ? 'upcoming' : 'past';
        const card = {
          id: optimistic.id,
          title: optimistic.title,
          cover_img: optimistic.cover_img,
          starts_at: optimistic.starts_at,
          created_at: optimistic.created_at,
          event_status: status,
        };
        return [card, ...arr];
      });

      return {
        listSnaps,
        prevDetail,
        detailKey,
        createdOptimisticId: vars.id ? undefined : optimisticId,
      };
    },

    onError: (_e, _vars, ctx) => {
      // rollback lists
      ctx?.listSnaps.forEach(([key, prev]) => qc.setQueryData(key, prev));
      // rollback detail
      if (ctx?.detailKey) qc.setQueryData(ctx.detailKey, ctx.prevDetail);
      // if we created a brand new optimistic event, remove it from userEvents too
      if (ctx?.createdOptimisticId) {
        qc.setQueriesData<any[]>({ queryKey: KEYS.userEvents }, (prev) =>
          (prev ?? []).filter((e) => e.id !== ctx.createdOptimisticId)
        );
      }
    },

    onSettled: (evt, _err, _vars) => {
      // refetch authoritative data
      if (evt?.id) {
        qc.invalidateQueries({ queryKey: KEYS.eventById(evt.id) });
      }
      qc.invalidateQueries({ queryKey: KEYS.events });
      qc.invalidateQueries({ queryKey: KEYS.userEvents });
    },
  });
}
