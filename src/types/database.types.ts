export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["attend_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["attend_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["attend_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_hosts: {
        Row: {
          event_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_host_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          attend_again: string | null
          comment: string | null
          created_at: string
          event_id: string
          event_vibes: Database["public"]["Enums"]["vibe_slug"][] | null
          group_vibe_rating: number | null
          host_rating: number | null
          id: string
          is_anonymous: boolean
          meta: Json
          nps_score: number | null
          organization_rating: number | null
          quick_vibe_tags: string[] | null
          rating: number
          reviewer_id: string
          social_comment: string | null
          social_expectation: string | null
          updated_at: string
          venue_rating: number | null
        }
        Insert: {
          attend_again?: string | null
          comment?: string | null
          created_at?: string
          event_id: string
          event_vibes?: Database["public"]["Enums"]["vibe_slug"][] | null
          group_vibe_rating?: number | null
          host_rating?: number | null
          id?: string
          is_anonymous?: boolean
          meta?: Json
          nps_score?: number | null
          organization_rating?: number | null
          quick_vibe_tags?: string[] | null
          rating: number
          reviewer_id: string
          social_comment?: string | null
          social_expectation?: string | null
          updated_at?: string
          venue_rating?: number | null
        }
        Update: {
          attend_again?: string | null
          comment?: string | null
          created_at?: string
          event_id?: string
          event_vibes?: Database["public"]["Enums"]["vibe_slug"][] | null
          group_vibe_rating?: number | null
          host_rating?: number | null
          id?: string
          is_anonymous?: boolean
          meta?: Json
          nps_score?: number | null
          organization_rating?: number | null
          quick_vibe_tags?: string[] | null
          rating?: number
          reviewer_id?: string
          social_comment?: string | null
          social_expectation?: string | null
          updated_at?: string
          venue_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_limit: number
          capacity: number | null
          category: string[] | null
          cover_img: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string
          formatted_address: string
          geo: unknown
          id: string
          latitude: number
          location_text: string
          longitude: number
          place_id: string | null
          provider: string | null
          starts_at: string
          title: string
          token_cost: number
        }
        Insert: {
          age_limit?: number
          capacity?: number | null
          category?: string[] | null
          cover_img: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          ends_at: string
          formatted_address: string
          geo?: unknown
          id?: string
          latitude: number
          location_text: string
          longitude: number
          place_id?: string | null
          provider?: string | null
          starts_at: string
          title: string
          token_cost?: number
        }
        Update: {
          age_limit?: number
          capacity?: number | null
          category?: string[] | null
          cover_img?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          ends_at?: string
          formatted_address?: string
          geo?: unknown
          id?: string
          latitude?: number
          location_text?: string
          longitude?: number
          place_id?: string | null
          provider?: string | null
          starts_at?: string
          title?: string
          token_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorited_events: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorited_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      host_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          event_id: string
          host_id: string
          id: string
          rating: number
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_id: string
          host_id: string
          id?: string
          rating: number
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_id?: string
          host_id?: string
          id?: string
          rating?: number
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_tokens: {
        Row: {
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          issued_at: string
          jti: string
          purpose: string
          subject_user_id: string | null
          used_at: string | null
        }
        Insert: {
          created_by?: string | null
          event_id: string
          expires_at: string
          id?: string
          issued_at?: string
          jti: string
          purpose?: string
          subject_user_id?: string | null
          used_at?: string | null
        }
        Update: {
          created_by?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          issued_at?: string
          jti?: string
          purpose?: string
          subject_user_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_tokens_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_vibes: {
        Row: {
          event_id: string | null
          review_id: string
          vibe_user_id: string
          voter_id: string | null
        }
        Insert: {
          event_id?: string | null
          review_id: string
          vibe_user_id: string
          voter_id?: string | null
        }
        Update: {
          event_id?: string | null
          review_id?: string
          vibe_user_id?: string
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_vibe_user_id_fkey"
            columns: ["vibe_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_vibes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      token_ledger: {
        Row: {
          created_at: string
          credit: number
          event_id: string | null
          id: string
          meta: Json
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit: number
          event_id?: string | null
          id?: string
          meta?: Json
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit?: number
          event_id?: string | null
          id?: string
          meta?: Json
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          kind: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_day_prefs: {
        Row: {
          available_days: Database["public"]["Enums"]["days_available"]
          created_at: string
          user_id: string
        }
        Insert: {
          available_days: Database["public"]["Enums"]["days_available"]
          created_at?: string
          user_id: string
        }
        Update: {
          available_days?: Database["public"]["Enums"]["days_available"]
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_day_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_goals: {
        Row: {
          created_at: string
          goal: Database["public"]["Enums"]["event_goal"]
          user_id: string
        }
        Insert: {
          created_at?: string
          goal: Database["public"]["Enums"]["event_goal"]
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: Database["public"]["Enums"]["event_goal"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string | null
          interest: Database["public"]["Enums"]["interest"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          interest: Database["public"]["Enums"]["interest"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          interest?: Database["public"]["Enums"]["interest"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_profile: {
        Row: {
          budget_pref: Database["public"]["Enums"]["budget_band"] | null
          completed: boolean
          created_at: string
          preferred_group_size_max: number | null
          preferred_group_size_min: number | null
          primary_archetype:
            | Database["public"]["Enums"]["social_archetype"]
            | null
          style_pref: Database["public"]["Enums"]["style_band"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_pref?: Database["public"]["Enums"]["budget_band"] | null
          completed?: boolean
          created_at?: string
          preferred_group_size_max?: number | null
          preferred_group_size_min?: number | null
          primary_archetype?:
            | Database["public"]["Enums"]["social_archetype"]
            | null
          style_pref?: Database["public"]["Enums"]["style_band"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_pref?: Database["public"]["Enums"]["budget_band"] | null
          completed?: boolean
          created_at?: string
          preferred_group_size_max?: number | null
          preferred_group_size_min?: number | null
          primary_archetype?:
            | Database["public"]["Enums"]["social_archetype"]
            | null
          style_pref?: Database["public"]["Enums"]["style_band"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_time_prefs: {
        Row: {
          created_at: string
          time_pref: Database["public"]["Enums"]["time_bucket"]
          user_id: string
        }
        Insert: {
          created_at?: string
          time_pref: Database["public"]["Enums"]["time_bucket"]
          user_id: string
        }
        Update: {
          created_at?: string
          time_pref?: Database["public"]["Enums"]["time_bucket"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_time_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vibe_history: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          source: Database["public"]["Enums"]["vibe_source"]
          user_id: string
          vibe_slug: Database["public"]["Enums"]["vibe_slug"]
          voter_id: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          source: Database["public"]["Enums"]["vibe_source"]
          user_id: string
          vibe_slug: Database["public"]["Enums"]["vibe_slug"]
          voter_id?: string | null
          weight?: number
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          source?: Database["public"]["Enums"]["vibe_source"]
          user_id?: string
          vibe_slug?: Database["public"]["Enums"]["vibe_slug"]
          voter_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vibe_history_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age: number | null
          birth_date: string
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender"]
          id: string
          last_name: string | null
          membership: Database["public"]["Enums"]["membership_role"]
          onboarded: boolean
          phone_number: string | null
          preferred_vibe_slug: Database["public"]["Enums"]["vibe_slug"] | null
          profile_picture: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          token_count: number
        }
        Insert: {
          age?: number | null
          birth_date: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"]
          id: string
          last_name?: string | null
          membership?: Database["public"]["Enums"]["membership_role"]
          onboarded?: boolean
          phone_number?: string | null
          preferred_vibe_slug?: Database["public"]["Enums"]["vibe_slug"] | null
          profile_picture?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          token_count?: number
        }
        Update: {
          age?: number | null
          birth_date?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          last_name?: string | null
          membership?: Database["public"]["Enums"]["membership_role"]
          onboarded?: boolean
          phone_number?: string | null
          preferred_vibe_slug?: Database["public"]["Enums"]["vibe_slug"] | null
          profile_picture?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          token_count?: number
        }
        Relationships: []
      }
      venue_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string | null
          id: string
          is_anonymous: boolean
          place_id: string | null
          rating: number
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_anonymous?: boolean
          place_id?: string | null
          rating: number
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_anonymous?: boolean
          place_id?: string | null
          rating?: number
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "venue_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          created_at: string
          formatted_address: string
          lat: number | null
          lon: number | null
          name: string
          place_id: string
          provider: string
        }
        Insert: {
          created_at?: string
          formatted_address: string
          lat?: number | null
          lon?: number | null
          name: string
          place_id: string
          provider?: string
        }
        Update: {
          created_at?: string
          formatted_address?: string
          lat?: number | null
          lon?: number | null
          name?: string
          place_id?: string
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      v_event_counts: {
        Row: {
          check_in_count: number | null
          event_id: string | null
          rsvp_count: number | null
        }
        Relationships: []
      }
      v_event_ratings: {
        Row: {
          avg_rating: number | null
          event_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_with_host_rsvp_checkin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_for_current_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_user_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_weekend_events"
            referencedColumns: ["id"]
          },
        ]
      }
      v_event_summary: {
        Row: {
          age_limit: number | null
          capacity: number | null
          category: string[] | null
          check_in_count: number | null
          cover_img: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          formatted_address: string | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          place_id: string | null
          provider: string | null
          rsvp_count: number | null
          starts_at: string | null
          title: string | null
          token_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_event_with_host_rsvp_checkin: {
        Row: {
          age_limit: number | null
          capacity: number | null
          category: string[] | null
          check_ins:
            | Database["public"]["CompositeTypes"]["checkin_info"][]
            | null
          cover_img: string | null
          created_at: string | null
          created_by: string | null
          current_user_checked_in_at: string | null
          current_user_rsvp_at: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          event_hosts:
            | Database["public"]["CompositeTypes"]["host_info"][]
            | null
          formatted_address: string | null
          id: string | null
          is_current_user_checked_in: boolean | null
          is_current_user_host: boolean | null
          is_current_user_rsvped: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          place_id: string | null
          provider: string | null
          rsvps: Database["public"]["CompositeTypes"]["rsvp_info"][] | null
          starts_at: string | null
          title: string | null
          token_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_events_for_current_user: {
        Row: {
          age_limit: number | null
          capacity: number | null
          category: string[] | null
          cover_img: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          formatted_address: string | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          place_id: string | null
          provider: string | null
          starts_at: string | null
          title: string | null
          token_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_host_ratings: {
        Row: {
          avg_rating: number | null
          host_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "host_reviews_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_events: {
        Row: {
          age_limit: number | null
          capacity: number | null
          category: string[] | null
          cover_img: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          event_status: string | null
          formatted_address: string | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          place_id: string | null
          provider: string | null
          starts_at: string | null
          title: string | null
          token_cost: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_token_balance: {
        Row: {
          balance: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_venue_ratings: {
        Row: {
          avg_rating: number | null
          place_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["place_id"]
          },
        ]
      }
      view_weekend_events: {
        Row: {
          age_limit: number | null
          capacity: number | null
          category: string[] | null
          cover_img: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          formatted_address: string | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          place_id: string | null
          provider: string | null
          starts_at: string | null
          title: string | null
          token_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _set_search_path: { Args: never; Returns: undefined }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      check_in: { Args: { event_id: string }; Returns: undefined }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      f_user_event_current_or_next: { Args: never; Returns: Json }
      f_user_event_today_or_next: { Args: never; Returns: Json }
      f_user_token_balance: { Args: never; Returns: number }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_my_token_balance: { Args: never; Returns: number }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      purchase_tokens: {
        Args: { p_amount: number; p_meta?: Json }
        Returns: Json
      }
      refund_tokens: {
        Args: { p_amount: number; p_event_id: string; p_meta?: Json }
        Returns: Json
      }
      set_self_vibe: {
        Args: { p_vibe: Database["public"]["Enums"]["vibe_slug"] }
        Returns: undefined
      }
      spend_tokens: {
        Args: { p_amount: number; p_event_id: string; p_meta?: Json }
        Returns: Json
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_full_review:
        | {
            Args: {
              p_attendee_vibes: Json
              p_event_comment: string
              p_event_id: string
              p_event_meta: Json
              p_event_rating: number
              p_host_reviews: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_attendee_vibes: Json
              p_event_comment: string
              p_event_id: string
              p_event_rating: number
              p_host_reviews: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_attend_again: string
              p_attendee_vibes: Json
              p_event_comment: string
              p_event_id: string
              p_event_rating: number
              p_event_vibes: Database["public"]["Enums"]["vibe_slug"][]
              p_group_vibe_rating: number
              p_host_rating: number
              p_host_reviews: Json
              p_nps_score: number
              p_organization_rating: number
              p_social_comment: string
              p_social_expectation: string
              p_venue_rating: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_attend_again: string
              p_attendee_vibes: Json
              p_event_comment: string
              p_event_id: string
              p_event_rating: number
              p_group_vibe_rating: number
              p_host_rating: number
              p_host_reviews: Json
              p_nps_score: number
              p_organization_rating: number
              p_quick_vibe_tags: string[]
              p_social_comment: string
              p_social_expectation: string
              p_venue_rating: number
            }
            Returns: Json
          }
      undo_check_in: { Args: { event_id: string }; Returns: undefined }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      vote_user_vibe: {
        Args: {
          p_event_id: string
          p_vibe: Database["public"]["Enums"]["vibe_slug"]
          p_vibe_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attend_status: "yes" | "no" | "can"
      budget_band: "budget" | "moderate" | "premium" | "luxury"
      day_bucket: "weekdays" | "weekends" | "Sunday"
      days_available:
        | "Sunday"
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday"
      event_goal:
        | "meet_new_friends"
        | "dating_connections"
        | "networking"
        | "try_new_things"
        | "travel_buddy"
        | "wellness_balance"
      gender: "Male" | "Female" | "Non-binary" | "Other"
      interest:
        | "Sports"
        | "Outdoors"
        | "Fitness"
        | "Hiking"
        | "Yoga"
        | "Dancing"
        | "Music"
        | "Art"
        | "Photography"
        | "Movies"
        | "Gaming"
        | "Fashion"
        | "Travel"
        | "Nightlife"
        | "Foodie"
        | "Coffee"
        | "Volunteering"
        | "Reading"
        | "Tech"
        | "Pets"
      membership_role: "superadmin" | "admin" | "basic" | "plus" | "premium"
      social_archetype: "chill" | "social" | "adventurer"
      style_band:
        | "cheap_casual"
        | "value_for_money"
        | "premium_exclusive"
        | "splurge_big_events"
      time_bucket: "morning" | "afternoon" | "evening" | "late_night"
      user_role: "user" | "host" | "admin" | "super_admin"
      vibe_slug:
        | "explorer"
        | "chill"
        | "nightlife"
        | "culture"
        | "wildcard"
        | "deep_connector"
        | "fun_maker"
        | "connector"
        | "observer"
        | "hype_starter"
        | "early_riser"
        | "night_owl"
        | "planner"
        | "spontaneous"
        | "homebody"
        | "karaoke_star"
        | "late_night_foodie"
        | "trailblazer"
        | "music_lover"
        | "spontaneous_traveler"
        | "style_icon"
        | "chill_gamer"
        | "dog_person"
        | "zen"
        | "social_butterfly"
        | "summer_energy"
        | "holiday_spirit"
        | "mvp"
        | "vibe_validator"
        | "mystery"
      vibe_source: "self" | "peer"
    }
    CompositeTypes: {
      checkin_info: {
        user_id: string | null
        check_in_at: string | null
        first_name: string | null
        last_name: string | null
        profile_picture: string | null
      }
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      host_info: {
        id: string | null
        first_name: string | null
        last_name: string | null
        profile_picture: string | null
      }
      rsvp_info: {
        user_id: string | null
        rsvp_at: string | null
        first_name: string | null
        last_name: string | null
        profile_picture: string | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attend_status: ["yes", "no", "can"],
      budget_band: ["budget", "moderate", "premium", "luxury"],
      day_bucket: ["weekdays", "weekends", "Sunday"],
      days_available: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      event_goal: [
        "meet_new_friends",
        "dating_connections",
        "networking",
        "try_new_things",
        "travel_buddy",
        "wellness_balance",
      ],
      gender: ["Male", "Female", "Non-binary", "Other"],
      interest: [
        "Sports",
        "Outdoors",
        "Fitness",
        "Hiking",
        "Yoga",
        "Dancing",
        "Music",
        "Art",
        "Photography",
        "Movies",
        "Gaming",
        "Fashion",
        "Travel",
        "Nightlife",
        "Foodie",
        "Coffee",
        "Volunteering",
        "Reading",
        "Tech",
        "Pets",
      ],
      membership_role: ["superadmin", "admin", "basic", "plus", "premium"],
      social_archetype: ["chill", "social", "adventurer"],
      style_band: [
        "cheap_casual",
        "value_for_money",
        "premium_exclusive",
        "splurge_big_events",
      ],
      time_bucket: ["morning", "afternoon", "evening", "late_night"],
      user_role: ["user", "host", "admin", "super_admin"],
      vibe_slug: [
        "explorer",
        "chill",
        "nightlife",
        "culture",
        "wildcard",
        "deep_connector",
        "fun_maker",
        "connector",
        "observer",
        "hype_starter",
        "early_riser",
        "night_owl",
        "planner",
        "spontaneous",
        "homebody",
        "karaoke_star",
        "late_night_foodie",
        "trailblazer",
        "music_lover",
        "spontaneous_traveler",
        "style_icon",
        "chill_gamer",
        "dog_person",
        "zen",
        "social_butterfly",
        "summer_energy",
        "holiday_spirit",
        "mvp",
        "vibe_validator",
        "mystery",
      ],
      vibe_source: ["self", "peer"],
    },
  },
} as const
