// types/event.types.ts
import type { Database, Tables } from './database.types';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type UserRow = Tables<'users'>;
export type EventHostRow = Tables<'event_hosts'> & { user: UserRow };
export type RsvpRow = Tables<'rsvps'> & { user: UserRow };
export type UserEventRow = Database['public']['Views']['v_user_events']['Row'];

export type EventWithJoins = EventRow & {
  event_hosts: EventHostRow[];
  rsvps: RsvpRow[];
};

// (optional, handy for UI mapping)
export type PersonCard = {
  id: UserRow['id'];
  name: string;
  profile_pic: UserRow['profile_picture'];
};

export type UserEventCardRow = Pick<
  UserEventRow,
  'id' | 'title' | 'cover_img' | 'created_at' | 'starts_at'
> & {
  event_status: 'upcoming' | 'past';
};

export * from './database.types';
