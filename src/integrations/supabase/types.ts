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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      carescore_criteria: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label_de: string
          label_en: string
          label_tr: string
          max_points: number
          sort_order: number
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label_de: string
          label_en: string
          label_tr: string
          max_points?: number
          sort_order?: number
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label_de?: string
          label_en?: string
          label_tr?: string
          max_points?: number
          sort_order?: number
          weight?: number
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          address: string | null
          company_name: string
          company_type: string | null
          created_at: string
          description: string | null
          employee_count: number | null
          founded_year: number | null
          id: string
          is_verified: boolean | null
          profile_id: string
          subscription_plan: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          company_type?: string | null
          created_at?: string
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: string
          is_verified?: boolean | null
          profile_id: string
          subscription_plan?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          company_type?: string | null
          created_at?: string
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: string
          is_verified?: boolean | null
          profile_id?: string
          subscription_plan?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          company_profile_id: string
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          company_profile_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
        }
        Update: {
          company_profile_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_id: string
          responded_at: string | null
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          completed_at: string | null
          id: string
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_posting_id: string
          nurse_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_posting_id: string
          nurse_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_posting_id?: string
          nurse_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_nurse_profile_id_fkey"
            columns: ["nurse_profile_id"]
            isOneToOne: false
            referencedRelation: "nurse_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          applications_count: number | null
          benefits: string[] | null
          company_profile_id: string
          created_at: string
          description: string
          employment_type: string | null
          experience_required: number | null
          german_level_required: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean
          location: string | null
          requirements: string[] | null
          salary_max: number | null
          salary_min: number | null
          specializations_required: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          benefits?: string[] | null
          company_profile_id: string
          created_at?: string
          description: string
          employment_type?: string | null
          experience_required?: number | null
          german_level_required?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean
          location?: string | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          specializations_required?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          benefits?: string[] | null
          company_profile_id?: string
          created_at?: string
          description?: string
          employment_type?: string | null
          experience_required?: number | null
          german_level_required?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean
          location?: string | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          specializations_required?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nurse_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          care_score: number | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          german_level: string | null
          hourly_rate: number | null
          icu_experience: boolean | null
          id: string
          is_verified: boolean | null
          pediatric_experience: boolean | null
          profile_id: string
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          care_score?: number | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          german_level?: string | null
          hourly_rate?: number | null
          icu_experience?: boolean | null
          id?: string
          is_verified?: boolean | null
          pediatric_experience?: boolean | null
          profile_id: string
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          care_score?: number | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          german_level?: string | null
          hourly_rate?: number | null
          icu_experience?: boolean | null
          id?: string
          is_verified?: boolean | null
          pediatric_experience?: boolean | null
          profile_id?: string
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_relative_profiles: {
        Row: {
          care_needs: string[] | null
          created_at: string
          id: string
          notes: string | null
          patient_age: number | null
          preferred_care_type: string | null
          profile_id: string
          relationship_type: string | null
          updated_at: string
        }
        Insert: {
          care_needs?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          preferred_care_type?: string | null
          profile_id: string
          relationship_type?: string | null
          updated_at?: string
        }
        Update: {
          care_needs?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          preferred_care_type?: string | null
          profile_id?: string
          relationship_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_relative_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_relative_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount_eur: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_method: string | null
          plan_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_eur: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          cookie_preferences: Json | null
          country: string | null
          created_at: string
          full_name: string | null
          gdpr_consent_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          phone_verified: boolean | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_email: boolean
          show_name: boolean
          show_phone: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          cookie_preferences?: Json | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          gdpr_consent_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          cookie_preferences?: Json | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          gdpr_consent_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          otp_code: string
          phone: string
          provider: string
          status: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          otp_code: string
          phone: string
          provider?: string
          status?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          otp_code?: string
          phone?: string
          provider?: string
          status?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          description: string | null
          description_de: string | null
          description_en: string | null
          description_tr: string | null
          featured_listings: number
          id: string
          is_active: boolean
          max_job_postings: number
          name: string
          name_de: string | null
          name_en: string | null
          name_tr: string | null
          price_eur: number
          sort_order: number
        }
        Insert: {
          billing_period?: string
          created_at?: string
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_tr?: string | null
          featured_listings?: number
          id?: string
          is_active?: boolean
          max_job_postings?: number
          name: string
          name_de?: string | null
          name_en?: string | null
          name_tr?: string | null
          price_eur?: number
          sort_order?: number
        }
        Update: {
          billing_period?: string
          created_at?: string
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_tr?: string | null
          featured_listings?: number
          id?: string
          is_active?: boolean
          max_job_postings?: number
          name?: string
          name_de?: string | null
          name_en?: string | null
          name_tr?: string | null
          price_eur?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          user_id: string
          watched_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          watched_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          watched_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          show_name: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          show_name?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          show_name?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_notification_for_user: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_company_profile_id_for_user: { Args: never; Returns: string }
      get_user_profile_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_profile: { Args: { check_profile_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_role: "nurse" | "company" | "patient_relative" | "admin"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      user_role: ["nurse", "company", "patient_relative", "admin"],
    },
  },
} as const
