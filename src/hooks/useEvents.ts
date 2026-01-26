import { UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import {
  EventCheckIn,
  EventRow,
  EventVibes,
  UserEventCardRow,
  VEventWithFullDetails,
} from '~/types/event.types';
import type { Enums } from '~/types/database.types';

export const EVENT_KEYS = {
  events: ['events'] as const,
  eventById: (id: string) => ['event', id] as const,
  userEvents: (uid: string) => ['user', 'events', uid] as const,
  justForYou: (uid: string) => ['events', 'justForYou', uid] as const,
  upcoming: ['events', 'upcoming'] as const,
  cheap: ['events', 'cheap'] as const,
  thisWeekend: ['events', 'thisWeekend'] as const,
  trending: ['events', 'trending'] as const,
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
        .select('*')
        .order('event_status', { ascending: false })
        .order('starts_at', { ascending: true });
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

export type UserEventCheckInRow = {
  event_id: string;
};

export function useUserEventCheckIns(
  eventIds: string[] | null
): UseQueryResult<UserEventCheckInRow[], Error> {
  const { userId } = useAuth();
  const normalizedIds = (eventIds ?? []).filter(Boolean) as string[];

  return useQuery<UserEventCheckInRow[], Error>({
    queryKey: ['events', 'checkIns', 'byUser', userId, normalizedIds.join(',')],
    enabled: !!userId && normalizedIds.length > 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async (): Promise<UserEventCheckInRow[]> => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('event_id')
        .eq('user_id', userId!)
        .in('event_id', normalizedIds);
      if (error) throw error;
      return data ?? [];
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
      qc.invalidateQueries({ queryKey: EVENT_KEYS.eventById(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(userId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.checkIn(eventId) });
    },
  });
}

export function useEvents() {
  return useQuery<EventRow[]>({
    queryKey: ['events'],
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useHostEvents() {
  return useQuery<EventRow[]>({
    queryKey: ['events'],
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useEventById(id: string) {
  return useQuery<VEventWithFullDetails>({
    queryKey: EVENT_KEYS.eventById(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_event_with_host_rsvp_checkin')
        .select('*')
        .eq('id', id)
        .maybeSingle<VEventWithFullDetails>();

      if (error) throw error;
      return data!;
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
      const { data, error } = await supabase
        .from('view_weekend_events')
        .select('*')
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

export type VibeSlug = Enums<'vibe_slug'>;

export type SocialExpectation = 'exceeded' | 'met' | 'below';
export type AttendAgainFeeling = 'charged_up' | 'sparked' | 'drained';
export type EventReviewRow = {
  id?: string;
  event_id?: string;
  reviewer_id?: string;
  rating?: number | null;
  comment?: string | null;
  overall_rating?: number | null;
  venue_rating?: number | null;
  organization_rating?: number | null;
  host_rating?: number | null;
  group_vibe_rating?: number | null;
  social_expectation?: SocialExpectation | null;
  social_comment?: string | null;
  attend_again?: AttendAgainFeeling | null;
  nps_score?: number | null;
  event_vibes?: VibeSlug[] | null;
  attendee_vibes?:
    | Array<{ subject_user: string; vibe_slug: VibeSlug }>
    | Record<string, VibeSlug | null>
    | null;
  additional_feedback?: string | null;
  event_comment?: string | null;
};

export function useEventReview(eventId?: string | null) {
  const { userId } = useAuth();

  return useQuery<EventReviewRow | null>({
    queryKey: ['reviews', 'event', eventId, userId],
    enabled: !!eventId && !!userId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('*')
        .eq('event_id', eventId!)
        .eq('reviewer_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as EventReviewRow | null) ?? null;
    },
  });
}

export type SubmitEventReviewArgs = {
  eventId: string;
  venueId: string | null;
  venueDetails?: {
    name: string;
    formattedAddress: string;
    lat?: number | null;
    lon?: number | null;
    provider?: string | null;
  };
  overallRating: number;
  venueRating: number;
  organizationRating: number;
  hostRating: number;
  groupVibeRating: number;
  socialExpectation: SocialExpectation;
  socialComment: string | null;
  attendAgain: AttendAgainFeeling;
  npsScore: number;
  eventVibes: VibeSlug[];
  additionalFeedback: string | null;
  // array of votes: { subject_user, vibe_slug }
  attendeeVibes: Array<{ subject_user: string; vibe_slug: VibeSlug }>;
  hostIds: string[];
};

export function useSubmitEventReview() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (payload: SubmitEventReviewArgs) => {
      const {
        eventId,
        venueId,
        venueDetails,
        overallRating,
        venueRating,
        organizationRating,
        hostRating,
        groupVibeRating,
        socialExpectation,
        socialComment,
        attendAgain,
        npsScore,
        eventVibes,
        additionalFeedback,
        attendeeVibes,
        hostIds,
      } = payload;
      if (!userId) throw new Error('User is not authenticated.');

      const hostReviews = hostIds.map((hostId) => ({
        host_user_id: hostId,
        rating: hostRating,
        comment: '',
      }));

      const attendeeReviewPayload = attendeeVibes.map((vote) => ({
        subject_user: vote.subject_user,
        vibe_slug: vote.vibe_slug,
        weight: 1,
      }));

      // ✅ CALL THE NEW RPC NAME
      console.log('[submit_review] payload', {
        eventId,
        venueId,
        hostIds,
        hostReviews,
        attendeeVibes,
      });

      const rpcReq = supabase.rpc('submit_full_review', {
        p_event_id: eventId,
        p_event_rating: overallRating,
        p_event_comment: additionalFeedback ?? '',
        p_venue_rating: venueRating,
        p_organization_rating: organizationRating,
        p_host_rating: hostRating,
        p_group_vibe_rating: groupVibeRating,
        p_social_expectation: socialExpectation,
        p_social_comment: socialComment ?? '',
        p_attend_again: attendAgain,
        p_nps_score: npsScore,
        p_event_vibes: eventVibes ?? [],
        p_host_reviews: hostReviews.length ? hostReviews : null,
        p_attendee_vibes: attendeeReviewPayload.length ? attendeeReviewPayload : null,
      });

      let venueReq: Promise<any> | null = null;
      if (venueId && venueRating) {
        if (!venueDetails?.name || !venueDetails?.formattedAddress) {
          console.warn('[submit_review] missing venue details, skipping venue review');
        } else {
          const venueUpsert = await supabase.from('venues').upsert(
            {
              place_id: venueId,
              name: venueDetails.name,
              formatted_address: venueDetails.formattedAddress,
              lat: venueDetails.lat ?? null,
              lon: venueDetails.lon ?? null,
              provider: venueDetails.provider ?? undefined,
            },
            { onConflict: 'place_id' }
          );
          if (venueUpsert.error) {
            console.warn('[submit_review] venue upsert failed, skipping venue review', venueUpsert);
          } else {
            venueReq = supabase.from('venue_reviews').upsert(
              {
                event_id: eventId,
                place_id: venueId,
                reviewer_id: userId,
                rating: venueRating,
                comment: null,
              },
              { onConflict: 'place_id,reviewer_id,event_id' }
            ) as unknown as Promise<any>;
          }
        }
      }

      let rpcData: unknown;
      let rpcError: { message?: string } | null = null;
      let venueRes: { error: { message?: string } | null } | undefined;
      try {
        const rpcResult = await rpcReq;
        rpcData = rpcResult.data;
        rpcError = rpcResult.error;
        if (venueReq) {
          venueRes = (await venueReq) as typeof venueRes;
        }
      } catch (err) {
        console.error('[submit_review] request failed', err);
        throw err;
      }

      console.log('[submit_review] rpc result', rpcData, rpcError);

      if (rpcError) throw new Error(rpcError.message);

      if (venueReq) {
        console.log('[submit_review] venue result', venueRes);
        if (venueRes?.error) {
          throw new Error(venueRes.error.message ?? 'Failed to save venue review');
        }
      }

      console.log('[submit_review] success');
      return rpcData;
    },

    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['events', 'eventById', vars.eventId] });
      qc.invalidateQueries({ queryKey: ['reviews', vars.eventId] });
      qc.invalidateQueries({ queryKey: ['reviews', 'event', vars.eventId, userId] });
      qc.invalidateQueries({ queryKey: ['user', userId, 'vibes'] });
    },

    onError: (err) => {
      console.error('submit review failed:', err);
    },
  });
}
