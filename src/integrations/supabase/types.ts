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
      admin_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
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
      emergency_scans: {
        Row: {
          ai_analysis: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          follow_up_notes: string | null
          follow_up_status: string | null
          followed_up_at: string | null
          followed_up_by: string | null
          guest_identifier: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          improvement_techniques: string[] | null
          insert_token: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          moisture: number | null
          nitrogen: number | null
          organic_matter: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          preferred_language: string | null
          recommended_crops: string[] | null
          temperature: number | null
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          follow_up_notes?: string | null
          follow_up_status?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          guest_identifier: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          improvement_techniques?: string[] | null
          insert_token?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          moisture?: number | null
          nitrogen?: number | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          preferred_language?: string | null
          recommended_crops?: string[] | null
          temperature?: number | null
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          follow_up_notes?: string | null
          follow_up_status?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          guest_identifier?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          improvement_techniques?: string[] | null
          insert_token?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          moisture?: number | null
          nitrogen?: number | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          preferred_language?: string | null
          recommended_crops?: string[] | null
          temperature?: number | null
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
      field_images: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          image_metadata: Json | null
          image_url: string | null
          processing_status: string | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          processing_status?: string | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          processing_status?: string | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_images_field_id_fkey"
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
      pest_detection_results: {
        Row: {
          affected_areas: Json | null
          analysis_date: string | null
          analysis_text: string | null
          confidence_score: number | null
          created_at: string | null
          crop_type: string | null
          disease_detected: string | null
          estimated_spray_cost: number | null
          field_id: string
          field_image_id: string | null
          id: string
          infection_level: number | null
          pest_types: Json | null
          recommended_pesticides: Json | null
          severity_classification: string | null
          spray_urgency: string | null
          user_id: string
          weather_conditions: Json | null
        }
        Insert: {
          affected_areas?: Json | null
          analysis_date?: string | null
          analysis_text?: string | null
          confidence_score?: number | null
          created_at?: string | null
          crop_type?: string | null
          disease_detected?: string | null
          estimated_spray_cost?: number | null
          field_id: string
          field_image_id?: string | null
          id?: string
          infection_level?: number | null
          pest_types?: Json | null
          recommended_pesticides?: Json | null
          severity_classification?: string | null
          spray_urgency?: string | null
          user_id: string
          weather_conditions?: Json | null
        }
        Update: {
          affected_areas?: Json | null
          analysis_date?: string | null
          analysis_text?: string | null
          confidence_score?: number | null
          created_at?: string | null
          crop_type?: string | null
          disease_detected?: string | null
          estimated_spray_cost?: number | null
          field_id?: string
          field_image_id?: string | null
          id?: string
          infection_level?: number | null
          pest_types?: Json | null
          recommended_pesticides?: Json | null
          severity_classification?: string | null
          spray_urgency?: string | null
          user_id?: string
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pest_detection_results_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pest_detection_results_field_image_id_fkey"
            columns: ["field_image_id"]
            isOneToOne: false
            referencedRelation: "field_images"
            referencedColumns: ["id"]
          },
        ]
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
      spray_operations: {
        Row: {
          actual_coverage_area: number | null
          after_image_url: string | null
          application_method: string | null
          before_image_url: string | null
          completion_notes: string | null
          coverage_area: number | null
          created_at: string | null
          equipment_id: string | null
          field_id: string
          follow_up_date: string | null
          gps_coordinates: Json | null
          id: string
          infection_reduction: number | null
          pest_detection_id: string | null
          pesticide_used: string | null
          quantity_used: number | null
          safety_precautions: string[] | null
          spray_date: string | null
          spray_pattern: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          weather_conditions: Json | null
        }
        Insert: {
          actual_coverage_area?: number | null
          after_image_url?: string | null
          application_method?: string | null
          before_image_url?: string | null
          completion_notes?: string | null
          coverage_area?: number | null
          created_at?: string | null
          equipment_id?: string | null
          field_id: string
          follow_up_date?: string | null
          gps_coordinates?: Json | null
          id?: string
          infection_reduction?: number | null
          pest_detection_id?: string | null
          pesticide_used?: string | null
          quantity_used?: number | null
          safety_precautions?: string[] | null
          spray_date?: string | null
          spray_pattern?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          weather_conditions?: Json | null
        }
        Update: {
          actual_coverage_area?: number | null
          after_image_url?: string | null
          application_method?: string | null
          before_image_url?: string | null
          completion_notes?: string | null
          coverage_area?: number | null
          created_at?: string | null
          equipment_id?: string | null
          field_id?: string
          follow_up_date?: string | null
          gps_coordinates?: Json | null
          id?: string
          infection_reduction?: number | null
          pest_detection_id?: string | null
          pesticide_used?: string | null
          quantity_used?: number | null
          safety_precautions?: string[] | null
          spray_date?: string | null
          spray_pattern?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "spray_operations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spray_operations_pest_detection_id_fkey"
            columns: ["pest_detection_id"]
            isOneToOne: false
            referencedRelation: "pest_detection_results"
            referencedColumns: ["id"]
          },
        ]
      }
      spray_recommendations: {
        Row: {
          alternative_pesticides: Json | null
          application_method: string | null
          concentration: number | null
          cost_estimate: number | null
          created_at: string | null
          id: string
          pest_detection_id: string | null
          pesticide_name: string | null
          quantity_liters: number | null
          safety_precautions: string | null
          success_rate: number | null
          urgency_level: string | null
          user_id: string
          waiting_period_days: number | null
          weather_requirements: Json | null
        }
        Insert: {
          alternative_pesticides?: Json | null
          application_method?: string | null
          concentration?: number | null
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          pest_detection_id?: string | null
          pesticide_name?: string | null
          quantity_liters?: number | null
          safety_precautions?: string | null
          success_rate?: number | null
          urgency_level?: string | null
          user_id: string
          waiting_period_days?: number | null
          weather_requirements?: Json | null
        }
        Update: {
          alternative_pesticides?: Json | null
          application_method?: string | null
          concentration?: number | null
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          pest_detection_id?: string | null
          pesticide_name?: string | null
          quantity_liters?: number | null
          safety_precautions?: string | null
          success_rate?: number | null
          urgency_level?: string | null
          user_id?: string
          waiting_period_days?: number | null
          weather_requirements?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "spray_recommendations_pest_detection_id_fkey"
            columns: ["pest_detection_id"]
            isOneToOne: false
            referencedRelation: "pest_detection_results"
            referencedColumns: ["id"]
          },
        ]
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
      get_all_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: string
          user_id: string
        }[]
      }
      get_emergency_scan_by_identifier: {
        Args: { p_guest_identifier: string }
        Returns: {
          ai_analysis: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          follow_up_notes: string | null
          follow_up_status: string | null
          followed_up_at: string | null
          followed_up_by: string | null
          guest_identifier: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          improvement_techniques: string[] | null
          insert_token: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          moisture: number | null
          nitrogen: number | null
          organic_matter: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          preferred_language: string | null
          recommended_crops: string[] | null
          temperature: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "emergency_scans"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
