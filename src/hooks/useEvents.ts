import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { supabase } from '~/lib/supabase';
import { uploadEventCoverImage } from '~/lib/uploadImage';
import { useAuth } from '~/providers/AuthProvider';
import {
  EventCheckIn,
  EventRow,
  EventVibes,
  EventWithJoins,
  UserEventCardRow,
} from '~/types/event.types';

export const EVENT_KEYS = {
  events: ['events'] as const,
  eventById: (id: string) => ['event', id] as const,
  userEvents: (uid: string) => ['user', 'events', uid] as const,
  justForYou: (uid: string) => ['events', 'justForYou', uid] as const,
  upcoming: ['events', 'upcoming'] as const,
  cheap: ['events', 'cheap'] as const,
  thisWeekend: ['events', 'thisWeekend'] as const,
  trending: ['events', 'trending'] as const,
  userTokenBalance: (uid: string | null | undefined) => ['user', 'tokenBalance', uid] as const,
  checkIn: (userId?: string | null) => ['events', 'checkInEvent', userId] as const,
  userCheckedIn: (userId?: string | null, eventId?: string | null) =>
    ['events', 'checkIn', 'byUserEvent', userId, eventId] as const,
};

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

type ViewCheckInUser = {
  user_id: string;
  user: { id: string; first_name: string; last_name: string; profile_picture: string | null };
};
type ViewCheckInResult = {
  event: EventRow;
  hosts: ViewCheckInUser[] | null;
  attendees: ViewCheckInUser[] | null;
};

export function useViewCheckInEvent() {
  const { userId } = useAuth();

  return useQuery<ViewCheckInResult | null>({
    queryKey: EVENT_KEYS.checkIn(userId),
    enabled: !!userId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('f_user_event_today_or_next')
        .maybeSingle<ViewCheckInResult>();
      if (error) throw error;
      return data;
    },
  });
}

export function useUserCheckedInEvent(eventId: string | null) {
  const { userId } = useAuth();

  return useQuery<EventCheckIn | null>({
    queryKey: EVENT_KEYS.userCheckedIn(userId, eventId),
    enabled: !!userId && !!eventId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('event_id,user_id')
        .eq('user_id', userId!) // current user
        .eq('event_id', eventId!) // ✅ correct column name
        .maybeSingle<EventCheckIn>();
      if (error) throw error;
      return data;
    },
  });
}

export function useCheckIn() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc('check_in', { event_id: eventId });
      if (error) throw error;
      return true;
    },
    onSuccess: (_res, eventId) => {
      // re-fetch the stuff that depends on check-ins and balance
      qc.invalidateQueries({ queryKey: EVENT_KEYS.userTokenBalance(userId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(eventId) });
    },
  });
}

export function useMyTokenBalance() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: EVENT_KEYS.userTokenBalance(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_user_token_balance')
        .select('balance')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
    staleTime: 15_000,
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
    refetchOnMount: 'always',
    initialData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_events_for_current_user')
        .select('*')
        .is('deleted_at', null)
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
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
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
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
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
    refetchOnMount: 'always',
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
        .is('deleted_at', null)
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
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          rsvps:event_id(count)
        `
        )
        .is('deleted_at', null)
        .order('rsvps.count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useEventVibes(eventId: string) {
  return useQuery<EventVibes[]>({
    queryKey: ['events', 'eventVibes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_event_user_vibes')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      return data as EventVibes[];
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

type AnyKey = readonly unknown[];
type ListSnap<T> = [AnyKey, T | undefined];
// Your mutation context. All fields optional so returning `{}` is valid.
type Ctx = {
  listSnaps?: Array<ListSnap<EventRow[]>>; // snapshots of list queries
  prevDetail?: EventRow; // previous detail cache
  detailKey?: AnyKey; // key used for detail cache
  createdOptimisticId?: string; // if you create optimistic items
};

export function useUpsertEvent(userId: string | null) {
  const qc = useQueryClient();

  return useMutation<EventRow, unknown, UpsertEventArgs, Ctx>({
    mutationFn: async (vars) => {
      if (!userId) throw new Error('Not signed in');
      return upsertEvent(vars, userId);
    },

    onMutate: async (vars) => {
      const ctx: Ctx = {};

      // Only do optimistic detail patch for updates
      if (vars.id) {
        const detailKey = EVENT_KEYS.eventById(vars.id);
        await qc.cancelQueries({ queryKey: detailKey });

        const prev = qc.getQueryData<EventRow>(detailKey);
        if (prev) {
          ctx.prevDetail = prev;

          const patch: Partial<EventRow> = {
            title: vars.title?.trim() ?? prev.title,
            description: vars.description ?? prev.description,
            starts_at: vars.startAtISO ?? prev.starts_at,
            ends_at: vars.endAtISO ?? prev.ends_at,
            token_cost: vars.creditCost ?? prev.token_cost,
            capacity: vars.capacity ?? prev.capacity,
            location_text: vars.location_text ?? prev.location_text,
            formatted_address: vars.formatted_address ?? prev.formatted_address,
            provider: vars.provider ?? prev.provider,
            place_id: vars.place_id ?? prev.place_id,
            category: vars.category ?? prev.category,
          };

          qc.setQueryData<EventRow>(detailKey, { ...prev, ...patch });
        }
      }

      return ctx;
    },

    onError: (_err, vars, ctx) => {
      // rollback detail if we optimistically patched
      if (vars.id && ctx?.prevDetail) {
        qc.setQueryData<EventRow>(EVENT_KEYS.eventById(vars.id), ctx.prevDetail);
      }
    },

    onSuccess: (evt, vars) => {
      const isCreate = !vars.id;

      // Always keep the detail fresh
      qc.setQueryData<EventRow>(EVENT_KEYS.eventById(evt.id), evt);

      if (isCreate) {
        // Only on create: lists are stale
        qc.invalidateQueries({ queryKey: EVENT_KEYS.events });
        // if you maintain per-user cards:
        // qc.invalidateQueries({ queryKey: EVENT_KEYS.userEventCards(userId) });
      } else {
        // On update, avoid broad invalidations to prevent flicker/reset.
        // If lists depend on updated fields, do a targeted patch instead:
        qc.setQueriesData<EventRow[]>({ queryKey: EVENT_KEYS.events }, (prev) =>
          Array.isArray(prev) ? prev.map((e) => (e.id === evt.id ? evt : e)) : prev
        );
        // same idea for userEventCards:
        // qc.setQueriesData<EventCard[]>({ queryKey: EVENT_KEYS.userEventCards(userId) }, (prev) => ...)
      }
    },

    onSettled: (evt, _err, vars) => {
      if (!evt) return;
      // For create, you may want to ensure detail is in sync with server transforms:
      if (!vars.id) qc.invalidateQueries({ queryKey: EVENT_KEYS.eventById(evt.id) });
      // For updates, skip broad invalidations.
    },
  });
}

async function softDeleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: dayjs().toISOString() })
    .eq('id', eventId);

  if (error) throw error;
  return { id: eventId };
}

export function useDeleteEvent() {
  const { userId } = useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: softDeleteEvent,
    onMutate: async (eventId: string) => {
      // Cancel outgoing queries
      await qc.cancelQueries({ queryKey: EVENT_KEYS.events });

      // Snapshot
      const prevEvents = qc.getQueryData<any[]>(EVENT_KEYS.events);

      // Optimistically remove event
      if (prevEvents) {
        qc.setQueryData<any[]>(
          EVENT_KEYS.events,
          prevEvents.filter((e) => e.id !== eventId)
        );
      }

      return { prevEvents };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback
      if (ctx?.prevEvents) {
        qc.setQueryData(EVENT_KEYS.events, ctx.prevEvents);
      }
    },
    onSuccess: (eventId) => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.eventById(eventId.id) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.userEvents(userId!) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.events });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.justForYou(userId!) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.upcoming });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.cheap });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.thisWeekend });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.trending });
    },
  });
}
