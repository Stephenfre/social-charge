import type { Database } from './database.types';

export type UsersRow = Database['public']['Tables']['users']['Row'];
export type UsersInsert = Database['public']['Tables']['users']['Insert'];
export type UsersUpdate = Database['public']['Tables']['users']['Update'];

export type UsersInterests = Database['public']['Tables']['user_interests']['Row'];

export * from './database.types';
