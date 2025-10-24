// types/event.types.ts
import type { Database, Tables } from './database.types';
import { UsersRow } from './user.type';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type EventCheckIn = Database['public']['Tables']['check_ins']['Row'];
export type TokenTransactions = Database['public']['Tables']['token_transactions']['Row'];

export type EventHostRow = Tables<'event_hosts'> & { user: UsersRow };
export type RsvpRow = Tables<'rsvps'> & { user: UsersRow };
export type CheckInsRow = Tables<'check_ins'> & { user: UsersRow };
export type UserEventRow = Database['public']['Views']['v_user_events']['Row'];
export type EventVibes = Database['public']['Views']['v_event_user_vibes']['Row'];

export type EventWithJoins = EventRow &
  EventCheckIn & {
    event_hosts: EventHostRow[];
    rsvps: RsvpRow[];
    check_ins: CheckInsRow[];
  };

export type VEventWithFullDetails =
  Database['public']['Views']['v_event_with_host_rsvp_checkin']['Row'];

// (optional, handy for UI mapping)
export type PersonCard = {
  id: UsersRow['id'];
  name: string;
  profile_pic: UsersRow['profile_picture'];
};

export type UserEventCardRow = Pick<
  UserEventRow,
  'id' | 'title' | 'cover_img' | 'created_at' | 'starts_at' | 'ends_at'
> & {
  event_status: 'upcoming' | 'past';
};

export * from './database.types';
