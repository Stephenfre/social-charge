import type { Database } from './database.types';

// Events table
export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

// Re-export if you want everything from one entrypoint
export * from './database.types';
