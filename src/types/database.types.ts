/**
 * Supabase Database Types
 * Auto-generated placeholder - run `npx supabase gen types typescript` to regenerate
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | {[key: string]: Json | undefined}
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone_number: string;
          full_name: string;
          email: string | null;
          profile_photo_url: string | null;
          reputation_score: number;
          reputation_level: string;
          kyc_level: number;
          is_verified: boolean;
          city: string | null;
          region: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_number: string;
          full_name: string;
          email?: string | null;
          profile_photo_url?: string | null;
          reputation_score?: number;
          reputation_level?: string;
          kyc_level?: number;
          is_verified?: boolean;
          city?: string | null;
          region?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          full_name?: string;
          email?: string | null;
          profile_photo_url?: string | null;
          reputation_score?: number;
          reputation_level?: string;
          kyc_level?: number;
          is_verified?: boolean;
          city?: string | null;
          region?: string | null;
          date_of_birth?: string | null;
          updated_at?: string;
        };
      };
      user_statistics: {
        Row: {
          id: string;
          user_id: string;
          tontines_completed: number;
          active_tontines: number;
          total_contributed: number;
          total_received: number;
          on_time_payment_rate: number;
          late_payments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tontines_completed?: number;
          active_tontines?: number;
          total_contributed?: number;
          total_received?: number;
          on_time_payment_rate?: number;
          late_payments_count?: number;
        };
        Update: {
          tontines_completed?: number;
          active_tontines?: number;
          total_contributed?: number;
          total_received?: number;
          on_time_payment_rate?: number;
          late_payments_count?: number;
        };
      };
      mobile_money_accounts: {
        Row: {
          id: string;
          user_id: string;
          operator: string;
          account_number: string;
          account_name: string | null;
          is_default: boolean;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          operator: string;
          account_number: string;
          account_name?: string | null;
          is_default?: boolean;
          is_verified?: boolean;
        };
        Update: {
          operator?: string;
          account_number?: string;
          account_name?: string | null;
          is_default?: boolean;
          is_verified?: boolean;
        };
      };
      tontines: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          type: string;
          creator_id: string;
          contribution_amount: number;
          currency: string;
          frequency: string;
          total_members: number;
          current_members: number;
          start_date: string;
          end_date: string | null;
          status: string;
          distribution_order: string;
          late_penalty_percent: number;
          grace_period_days: number;
          management_fee_percent: number;
          min_reputation_required: number;
          is_public: boolean;
          deposit_amount: number;
          photo_url: string | null;
          chat_enabled: boolean;
          voting_enabled: boolean;
          auto_approve: boolean;
          allow_observers: boolean;
          current_round: number;
          total_rounds: number;
          current_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          type: string;
          creator_id: string;
          contribution_amount: number;
          currency?: string;
          frequency: string;
          total_members: number;
          current_members?: number;
          start_date: string;
          end_date?: string | null;
          status?: string;
          distribution_order: string;
          late_penalty_percent?: number;
          grace_period_days?: number;
          management_fee_percent?: number;
          min_reputation_required?: number;
          is_public?: boolean;
          deposit_amount?: number;
          photo_url?: string | null;
          chat_enabled?: boolean;
          voting_enabled?: boolean;
          auto_approve?: boolean;
          allow_observers?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: string;
          status?: string;
          photo_url?: string | null;
          current_members?: number;
          current_round?: number;
          current_balance?: number;
          updated_at?: string;
        };
      };
      tontine_members: {
        Row: {
          id: string;
          tontine_id: string;
          user_id: string;
          role: string;
          status: string;
          reception_order: number | null;
          joined_at: string;
          total_contributed: number;
          total_received: number;
          late_payments_count: number;
          is_current_beneficiary: boolean;
          has_received: boolean;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          user_id: string;
          role?: string;
          status?: string;
          reception_order?: number | null;
        };
        Update: {
          role?: string;
          status?: string;
          reception_order?: number | null;
          total_contributed?: number;
          total_received?: number;
          late_payments_count?: number;
          is_current_beneficiary?: boolean;
          has_received?: boolean;
        };
      };
      tontine_invitations: {
        Row: {
          id: string;
          tontine_id: string;
          inviter_id: string;
          invitee_phone: string;
          status: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          inviter_id: string;
          invitee_phone: string;
          status?: string;
          expires_at?: string;
        };
        Update: {
          status?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          tontine_id: string;
          member_id: string;
          user_id: string;
          amount: number;
          penalty_amount: number;
          round: number;
          due_date: string;
          paid_date: string | null;
          status: string;
          payment_method: string | null;
          transaction_id: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          member_id: string;
          user_id: string;
          amount: number;
          penalty_amount?: number;
          round: number;
          due_date: string;
          status?: string;
          payment_method?: string | null;
          transaction_id?: string | null;
        };
        Update: {
          paid_date?: string | null;
          status?: string;
          payment_method?: string | null;
          transaction_id?: string | null;
          penalty_amount?: number;
          receipt_url?: string | null;
        };
      };
      distributions: {
        Row: {
          id: string;
          tontine_id: string;
          recipient_id: string;
          amount: number;
          round: number;
          scheduled_date: string;
          distributed_date: string | null;
          status: string;
          transaction_id: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          recipient_id: string;
          amount: number;
          round: number;
          scheduled_date: string;
          status?: string;
        };
        Update: {
          distributed_date?: string | null;
          status?: string;
          transaction_id?: string | null;
          receipt_url?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          tontine_id: string;
          type: string;
          amount: number;
          currency: string;
          status: string;
          description: string;
          reference_id: string | null;
          external_transaction_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tontine_id: string;
          type: string;
          amount: number;
          currency?: string;
          status?: string;
          description: string;
          reference_id?: string | null;
          external_transaction_id?: string | null;
        };
        Update: {
          status?: string;
          external_transaction_id?: string | null;
        };
      };
      auto_pay_configs: {
        Row: {
          id: string;
          user_id: string;
          tontine_id: string;
          payment_method_id: string;
          is_enabled: boolean;
          days_before: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tontine_id: string;
          payment_method_id: string;
          is_enabled?: boolean;
          days_before?: number;
        };
        Update: {
          is_enabled?: boolean;
          days_before?: number;
          payment_method_id?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          tontine_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          attachment_url: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          attachment_url?: string | null;
          is_pinned?: boolean;
        };
        Update: {
          content?: string;
          is_pinned?: boolean;
          updated_at?: string;
        };
      };
      message_reads: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
        };
        Update: {};
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          related_id: string | null;
          related_data: Json | null;
          is_read: boolean;
          sent_at: string;
          read_at: string | null;
          action_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          related_id?: string | null;
          related_data?: Json | null;
          is_read?: boolean;
          action_url?: string | null;
        };
        Update: {
          is_read?: boolean;
          read_at?: string | null;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          sms_enabled: boolean;
          email_enabled: boolean;
          notification_preferences: Json;
          quiet_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          push_enabled?: boolean;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          notification_preferences?: Json;
          quiet_hours?: Json;
        };
        Update: {
          push_enabled?: boolean;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          notification_preferences?: Json;
          quiet_hours?: Json;
        };
      };
      votes: {
        Row: {
          id: string;
          tontine_id: string;
          created_by: string;
          title: string;
          description: string | null;
          vote_type: string;
          status: string;
          required_majority: number;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          vote_type: string;
          required_majority?: number;
          end_date: string;
        };
        Update: {
          status?: string;
        };
      };
      vote_ballots: {
        Row: {
          id: string;
          vote_id: string;
          user_id: string;
          choice: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vote_id: string;
          user_id: string;
          choice: string;
        };
        Update: {};
      };
      ratings: {
        Row: {
          id: string;
          tontine_id: string;
          rater_id: string;
          rated_id: string;
          rating: number;
          punctuality_score: number;
          communication_score: number;
          reliability_score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          rater_id: string;
          rated_id: string;
          rating: number;
          punctuality_score: number;
          communication_score: number;
          reliability_score: number;
          comment?: string | null;
        };
        Update: {};
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_url: string;
        };
        Update: {};
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
        };
        Update: {};
      };
      reputation_events: {
        Row: {
          id: string;
          user_id: string;
          tontine_id: string | null;
          event_type: string;
          points_change: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tontine_id?: string | null;
          event_type: string;
          points_change: number;
          description?: string | null;
        };
        Update: {};
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          device_token: string;
          platform: string;
          device_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_token: string;
          platform: string;
          device_id: string;
        };
        Update: {
          device_token?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      increment_member_count: {
        Args: {p_tontine_id: string};
        Returns: void;
      };
      decrement_member_count: {
        Args: {p_tontine_id: string};
        Returns: void;
      };
      get_tontine_stats: {
        Args: {p_tontine_id: string};
        Returns: {
          total_contributions: number;
          total_distributions: number;
          current_balance: number;
          average_punctuality: number;
          completion_rate: number;
        }[];
      };
      search_tontines: {
        Args: {query: string};
        Returns: Database['public']['Tables']['tontines']['Row'][];
      };
    };
    Enums: {};
  };
}
