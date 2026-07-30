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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement_rules: {
        Row: {
          achievement_id: string
          comparator: string
          id: string
          metric: string
          sequence: number
          threshold: number
        }
        Insert: {
          achievement_id: string
          comparator?: string
          id?: string
          metric: string
          sequence?: number
          threshold: number
        }
        Update: {
          achievement_id?: string
          comparator?: string
          id?: string
          metric?: string
          sequence?: number
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievement_rules_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          metric: string
          name: string
          slug: string
          target: number
          tier: string
          updated_at: string
          xp_bonus: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          metric: string
          name: string
          slug: string
          target: number
          tier: string
          updated_at?: string
          xp_bonus?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          name?: string
          slug?: string
          target?: number
          tier?: string
          updated_at?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          category: string
          contraindicated_tags: string[]
          created_at: string
          created_by: string | null
          difficulty: string
          easier_alternative: string | null
          equipment_free: boolean
          id: string
          instructions: string[]
          is_active: boolean
          minutes: number
          position: string
          safety_notes: string | null
          slug: string
          summary: string
          timer_seconds: number | null
          title: string
          updated_at: string
          workout_id: string | null
          xp_value: number
        }
        Insert: {
          category: string
          contraindicated_tags?: string[]
          created_at?: string
          created_by?: string | null
          difficulty: string
          easier_alternative?: string | null
          equipment_free?: boolean
          id?: string
          instructions?: string[]
          is_active?: boolean
          minutes: number
          position: string
          safety_notes?: string | null
          slug: string
          summary: string
          timer_seconds?: number | null
          title: string
          updated_at?: string
          workout_id?: string | null
          xp_value: number
        }
        Update: {
          category?: string
          contraindicated_tags?: string[]
          created_at?: string
          created_by?: string | null
          difficulty?: string
          easier_alternative?: string | null
          equipment_free?: boolean
          id?: string
          instructions?: string[]
          is_active?: boolean
          minutes?: number
          position?: string
          safety_notes?: string | null
          slug?: string
          summary?: string
          timer_seconds?: number | null
          title?: string
          updated_at?: string
          workout_id?: string | null
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_event_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          occurred_at: string
          properties: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_event_name_fkey"
            columns: ["event_name"]
            isOneToOne: false
            referencedRelation: "analytics_event_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          reason: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_contributions: {
        Row: {
          challenge_id: string
          contributed_at: string
          contribution_points: number
          created_at: string
          id: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          contributed_at?: string
          contribution_points?: number
          created_at?: string
          id?: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          contributed_at?: string
          contribution_points?: number
          created_at?: string
          id?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_contributions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_members: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          joined_at: string
          left_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_members_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          invite_code: string | null
          max_members: number
          name: string
          owner_id: string
          ranking_metric: string
          slug: string
          starts_at: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name: string
          owner_id: string
          ranking_metric?: string
          slug: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          visibility: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name?: string
          owner_id?: string
          ranking_metric?: string
          slug?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_check_ins: {
        Row: {
          check_in_date: string
          created_at: string
          energy_level: number
          id: string
          mood: string | null
          notes: string | null
          soreness_level: number | null
          user_id: string
        }
        Insert: {
          check_in_date: string
          created_at?: string
          energy_level: number
          id?: string
          mood?: string | null
          notes?: string | null
          soreness_level?: number | null
          user_id: string
        }
        Update: {
          check_in_date?: string
          created_at?: string
          energy_level?: number
          id?: string
          mood?: string | null
          notes?: string | null
          soreness_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          all_completed_bonus_awarded: boolean
          created_at: string
          generated_reason: string
          id: string
          plan_date: string
          quest_count: number
          timezone_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_completed_bonus_awarded?: boolean
          created_at?: string
          generated_reason?: string
          id?: string
          plan_date: string
          quest_count: number
          timezone_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_completed_bonus_awarded?: boolean
          created_at?: string
          generated_reason?: string
          id?: string
          plan_date?: string
          quest_count?: number
          timezone_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          activity_id: string
          assigned_reason: string | null
          created_at: string
          daily_plan_id: string
          id: string
          position: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          assigned_reason?: string | null
          created_at?: string
          daily_plan_id: string
          id?: string
          position: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          assigned_reason?: string | null
          created_at?: string
          daily_plan_id?: string
          id?: string
          position?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quests_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quests_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          easier_variant: string | null
          equipment_free: boolean
          icon: string | null
          id: string
          instruction: string
          name: string
          position: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          easier_variant?: string | null
          equipment_free?: boolean
          icon?: string | null
          id?: string
          instruction: string
          name: string
          position?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          easier_variant?: string | null
          equipment_free?: boolean
          icon?: string | null
          id?: string
          instruction?: string
          name?: string
          position?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          comments: string | null
          contact_ok: boolean
          created_at: string
          feature_context: string | null
          id: string
          page_context: string | null
          rating: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          comments?: string | null
          contact_ok?: boolean
          created_at?: string
          feature_context?: string | null
          id?: string
          page_context?: string | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          comments?: string | null
          contact_ok?: boolean
          created_at?: string
          feature_context?: string | null
          id?: string
          page_context?: string | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          level: number
          min_xp: number
          name: string
        }
        Insert: {
          level: number
          min_xp: number
          name: string
        }
        Update: {
          level?: number
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          best_streak: number
          consent_analytics: boolean
          consent_privacy_at: string | null
          consent_tos_at: string | null
          created_at: string
          current_level: number
          current_streak: number
          current_xp: number
          display_name: string | null
          id: string
          last_active_day: string | null
          onboarding_completed_at: string | null
          role: string
          streak_freeze_available: boolean
          streak_freeze_reset_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          best_streak?: number
          consent_analytics?: boolean
          consent_privacy_at?: string | null
          consent_tos_at?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          current_xp?: number
          display_name?: string | null
          id: string
          last_active_day?: string | null
          onboarding_completed_at?: string | null
          role?: string
          streak_freeze_available?: boolean
          streak_freeze_reset_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          best_streak?: number
          consent_analytics?: boolean
          consent_privacy_at?: string | null
          consent_tos_at?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          current_xp?: number
          display_name?: string | null
          id?: string
          last_active_day?: string | null
          onboarding_completed_at?: string | null
          role?: string
          streak_freeze_available?: boolean
          streak_freeze_reset_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quest_completions: {
        Row: {
          activity_id: string
          completed_at: string
          created_at: string
          daily_quest_id: string | null
          id: string
          notes: string | null
          paused_seconds: number
          user_id: string
          work_session_id: string | null
        }
        Insert: {
          activity_id: string
          completed_at?: string
          created_at?: string
          daily_quest_id?: string | null
          id?: string
          notes?: string | null
          paused_seconds?: number
          user_id: string
          work_session_id?: string | null
        }
        Update: {
          activity_id?: string
          completed_at?: string
          created_at?: string
          daily_quest_id?: string | null
          id?: string
          notes?: string | null
          paused_seconds?: number
          user_id?: string
          work_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_daily_quest_id_fkey"
            columns: ["daily_quest_id"]
            isOneToOne: true
            referencedRelation: "daily_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_work_session_id_fkey"
            columns: ["work_session_id"]
            isOneToOne: true
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_explanations: {
        Row: {
          created_at: string
          detail: string | null
          factor_key: string
          headline: string
          id: string
          recommendation_score_id: string
          sequence: number
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          factor_key: string
          headline: string
          id?: string
          recommendation_score_id: string
          sequence?: number
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          factor_key?: string
          headline?: string
          id?: string
          recommendation_score_id?: string
          sequence?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_explanations_recommendation_score_id_fkey"
            columns: ["recommendation_score_id"]
            isOneToOne: false
            referencedRelation: "recommendation_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_explanations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_scores: {
        Row: {
          activity_id: string
          created_at: string
          daily_quest_id: string
          factors: Json
          id: string
          total_score: number
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          daily_quest_id: string
          factors?: Json
          id?: string
          total_score: number
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          daily_quest_id?: string
          factors?: Json
          id?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_scores_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_scores_daily_quest_id_fkey"
            columns: ["daily_quest_id"]
            isOneToOne: true
            referencedRelation: "daily_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_preferences: {
        Row: {
          channel: string[]
          created_at: string
          id: string
          max_per_day: number
          muted: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          snooze_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string[]
          created_at?: string
          id?: string
          max_per_day?: number
          muted?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          snooze_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string[]
          created_at?: string
          id?: string
          max_per_day?: number
          muted?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          snooze_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favourites: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favourites_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accessibility_prefs: Json
          activity_level: string | null
          activity_preference: string | null
          created_at: string
          goal: string | null
          hours_sitting: number | null
          id: string
          limitation_tags: string[]
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_preference: string | null
          session_duration: number | null
          updated_at: string
          user_id: string
          work_schedule: Json
        }
        Insert: {
          accessibility_prefs?: Json
          activity_level?: string | null
          activity_preference?: string | null
          created_at?: string
          goal?: string | null
          hours_sitting?: number | null
          id?: string
          limitation_tags?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_preference?: string | null
          session_duration?: number | null
          updated_at?: string
          user_id: string
          work_schedule?: Json
        }
        Update: {
          accessibility_prefs?: Json
          activity_level?: string | null
          activity_preference?: string | null
          created_at?: string
          goal?: string | null
          hours_sitting?: number | null
          id?: string
          limitation_tags?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_preference?: string | null
          session_duration?: number | null
          updated_at?: string
          user_id?: string
          work_schedule?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_sessions: {
        Row: {
          actual_minutes: number | null
          break_activity_id: string | null
          break_taken: boolean
          created_at: string
          ended_at: string | null
          id: string
          planned_minutes: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          break_activity_id?: string | null
          break_taken?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          break_activity_id?: string | null
          break_taken?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_break_activity_id_fkey"
            columns: ["break_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          position: number
          reps: number | null
          seconds: number | null
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          position: number
          reps?: number | null
          seconds?: number | null
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          position?: number
          reps?: number | null
          seconds?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          is_active: boolean
          slug: string
          title: string
          total_minutes: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title: string
          total_minutes?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          total_minutes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          idempotency_key: string
          note: string | null
          source_id: string | null
          source_type: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key: string
          note?: string | null
          source_id?: string | null
          source_type: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key?: string
          note?: string | null
          source_id?: string | null
          source_type?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_xp: {
        Args: { p_reason: string; p_user_id: string; p_xp_amount: number }
        Returns: undefined
      }
      award_xp: {
        Args: {
          p_idempotency_key: string
          p_note?: string
          p_source_id: string
          p_source_type: string
          p_user_id: string
          p_xp_amount: number
        }
        Returns: {
          awarded: boolean
          xp_transaction_id: string
        }[]
      }
      complete_activity_and_award_xp: {
        Args: { p_daily_quest_id: string; p_notes?: string; p_user_id: string }
        Returns: {
          completed: boolean
          completion_id: string
        }[]
      }
      complete_work_session_break: {
        Args: {
          p_activity_id: string
          p_user_id: string
          p_work_session_id: string
        }
        Returns: {
          completed: boolean
          completion_id: string
        }[]
      }
      evaluate_achievements: { Args: { p_user_id: string }; Returns: undefined }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_challenges: number
          active_users_7d: number
          open_feedback: number
          total_quest_completions: number
          total_users: number
          total_workouts_completed: number
          total_xp_awarded: number
        }[]
      }
      get_challenge_leaderboard: {
        Args: { p_challenge_id: string }
        Returns: {
          contribution_count: number
          contribution_points: number
          display_name: string
          user_id: string
        }[]
      }
      get_challenge_members: {
        Args: { p_challenge_id: string }
        Returns: {
          display_name: string
          joined_at: string
          left_at: string
          role: string
          user_id: string
        }[]
      }
      get_my_stats: {
        Args: never
        Returns: {
          best_streak: number
          days_active: number
          hydration_completed: number
          mobility_completed: number
          posture_completed: number
          quests_completed: number
          walks_completed: number
          workouts_completed: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_challenge_member: {
        Args: { p_challenge_id: string }
        Returns: boolean
      }
      join_challenge_by_code: {
        Args: { p_invite_code: string }
        Returns: string
      }
      log_reminder_sent: { Args: { p_message: string }; Returns: undefined }
      process_daily_streaks: { Args: never; Returns: undefined }
      record_challenge_contributions: {
        Args: {
          p_points: number
          p_source_id: string
          p_source_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      reset_my_progress: { Args: never; Returns: undefined }
      search_profiles_admin: {
        Args: { p_query: string }
        Returns: {
          current_level: number
          current_xp: number
          display_name: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
