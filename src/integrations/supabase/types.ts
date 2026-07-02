export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audits: {
        Row: {
          created_at: string;
          estimated_roi: string | null;
          id: string;
          issues: Json | null;
          lead_id: string;
          missing_features: string[] | null;
          overall_score: number | null;
          owner_id: string;
          priority: Database["public"]["Enums"]["lead_priority"] | null;
          raw_html_excerpt: string | null;
          scores: Json | null;
          suggestions: Json | null;
          summary: string | null;
        };
        Insert: {
          created_at?: string;
          estimated_roi?: string | null;
          id?: string;
          issues?: Json | null;
          lead_id: string;
          missing_features?: string[] | null;
          overall_score?: number | null;
          owner_id: string;
          priority?: Database["public"]["Enums"]["lead_priority"] | null;
          raw_html_excerpt?: string | null;
          scores?: Json | null;
          suggestions?: Json | null;
          summary?: string | null;
        };
        Update: {
          created_at?: string;
          estimated_roi?: string | null;
          id?: string;
          issues?: Json | null;
          lead_id?: string;
          missing_features?: string[] | null;
          overall_score?: number | null;
          owner_id?: string;
          priority?: Database["public"]["Enums"]["lead_priority"] | null;
          raw_html_excerpt?: string | null;
          scores?: Json | null;
          suggestions?: Json | null;
          summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audits_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          created_at: string;
          done: boolean;
          due_at: string;
          id: string;
          lead_id: string;
          note: string | null;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          due_at: string;
          id?: string;
          lead_id: string;
          note?: string | null;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          due_at?: string;
          id?: string;
          lead_id?: string;
          note?: string | null;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          address: string | null;
          business_name: string;
          category: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          google_maps_url: string | null;
          id: string;
          last_contacted_at: string | null;
          latitude: number | null;
          longitude: number | null;
          next_followup_at: string | null;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          place_id: string | null;
          priority: Database["public"]["Enums"]["lead_priority"];
          rating: number | null;
          reviews_count: number | null;
          social_facebook: string | null;
          social_instagram: string | null;
          social_linkedin: string | null;
          social_tiktok: string | null;
          social_x: string | null;
          social_youtube: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["lead_status"];
          tags: string[] | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_name: string;
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          google_maps_url?: string | null;
          id?: string;
          last_contacted_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          next_followup_at?: string | null;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          place_id?: string | null;
          priority?: Database["public"]["Enums"]["lead_priority"];
          rating?: number | null;
          reviews_count?: number | null;
          social_facebook?: string | null;
          social_instagram?: string | null;
          social_linkedin?: string | null;
          social_tiktok?: string | null;
          social_x?: string | null;
          social_youtube?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          tags?: string[] | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          google_maps_url?: string | null;
          id?: string;
          last_contacted_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          next_followup_at?: string | null;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          place_id?: string | null;
          priority?: Database["public"]["Enums"]["lead_priority"];
          rating?: number | null;
          reviews_count?: number | null;
          social_facebook?: string | null;
          social_instagram?: string | null;
          social_linkedin?: string | null;
          social_tiktok?: string | null;
          social_x?: string | null;
          social_youtube?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          tags?: string[] | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      outreach_messages: {
        Row: {
          body: string;
          channel: Database["public"]["Enums"]["outreach_channel"];
          created_at: string;
          error: string | null;
          id: string;
          kind: Database["public"]["Enums"]["outreach_kind"];
          lead_id: string;
          owner_id: string;
          provider_message_id: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["outreach_status"];
          subject: string | null;
          tone: string | null;
          updated_at: string;
        };
        Insert: {
          body: string;
          channel?: Database["public"]["Enums"]["outreach_channel"];
          created_at?: string;
          error?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["outreach_kind"];
          lead_id: string;
          owner_id: string;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["outreach_status"];
          subject?: string | null;
          tone?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string;
          channel?: Database["public"]["Enums"]["outreach_channel"];
          created_at?: string;
          error?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["outreach_kind"];
          lead_id?: string;
          owner_id?: string;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["outreach_status"];
          subject?: string | null;
          tone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_messages_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          signature: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          signature?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          signature?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      lead_priority: "low" | "medium" | "high";
      lead_status:
        | "new"
        | "audited"
        | "message_ready"
        | "sent"
        | "replied"
        | "interested"
        | "meeting"
        | "proposal_sent"
        | "won"
        | "lost";
      outreach_channel: "email" | "linkedin" | "facebook" | "instagram" | "x" | "contact_form";
      outreach_kind: "initial" | "short" | "long" | "followup_1" | "followup_2" | "final";
      outreach_status: "draft" | "approved" | "sent" | "failed" | "replied";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      lead_priority: ["low", "medium", "high"],
      lead_status: [
        "new",
        "audited",
        "message_ready",
        "sent",
        "replied",
        "interested",
        "meeting",
        "proposal_sent",
        "won",
        "lost",
      ],
      outreach_channel: ["email", "linkedin", "facebook", "instagram", "x", "contact_form"],
      outreach_kind: ["initial", "short", "long", "followup_1", "followup_2", "final"],
      outreach_status: ["draft", "approved", "sent", "failed", "replied"],
    },
  },
} as const;
