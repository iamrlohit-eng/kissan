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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          page_path: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_path?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_path?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fertilizer_reports: {
        Row: {
          ai_analysis: string | null
          created_at: string
          field_id: string
          file_type: string | null
          file_url: string | null
          id: string
          improvement_techniques: string[] | null
          latitude: number | null
          longitude: number | null
          moisture: number | null
          nitrogen: number | null
          organic_matter: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          preferred_language: string | null
          recommended_crops: string[] | null
          report_date: string
          temperature: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          field_id: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          improvement_techniques?: string[] | null
          latitude?: number | null
          longitude?: number | null
          moisture?: number | null
          nitrogen?: number | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          preferred_language?: string | null
          recommended_crops?: string[] | null
          report_date?: string
          temperature?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          field_id?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          improvement_techniques?: string[] | null
          latitude?: number | null
          longitude?: number | null
          moisture?: number | null
          nitrogen?: number | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          preferred_language?: string | null
          recommended_crops?: string[] | null
          report_date?: string
          temperature?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fertilizer_reports_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          acres: number | null
          created_at: string
          current_crop: string | null
          id: string
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acres?: number | null
          created_at?: string
          current_crop?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acres?: number | null
          created_at?: string
          current_crop?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          farm_name: string | null
          full_name: string | null
          id: string
          location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _activity_type: Database["public"]["Enums"]["activity_type"]
          _description?: string
          _ip_address?: string
          _metadata?: Json
          _page_path?: string
          _user_agent?: string
          _user_email: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_type:
        | "login"
        | "logout"
        | "signup"
        | "page_view"
        | "field_create"
        | "field_update"
        | "field_delete"
        | "report_create"
        | "report_update"
        | "report_delete"
        | "report_upload"
        | "ai_analysis"
        | "ai_chat"
        | "profile_update"
      app_role: "admin" | "user"
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
      activity_type: [
        "login",
        "logout",
        "signup",
        "page_view",
        "field_create",
        "field_update",
        "field_delete",
        "report_create",
        "report_update",
        "report_delete",
        "report_upload",
        "ai_analysis",
        "ai_chat",
        "profile_update",
      ],
      app_role: ["admin", "user"],
    },
  },
} as const
