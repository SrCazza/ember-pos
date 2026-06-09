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
  public: {
    Tables: {
      kitchen_stations: {
        Row: {
          color: string
          created_at: string | null
          display_order: number
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          station_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          station_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          menu_item_id: string
          notes: string | null
          order_id: string
          quantity: number
          station_id: string
          status: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          menu_item_id: string
          notes?: string | null
          order_id: string
          quantity?: number
          station_id: string
          status?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          menu_item_id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          station_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          is_addition: boolean
          notes: string | null
          order_number: number | null
          payment_method: string | null
          picked_up_at: string | null
          ready_at: string | null
          sent_to_kitchen_at: string | null
          status: string
          table_id: string
          waiter_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_addition?: boolean
          notes?: string | null
          order_number?: number | null
          payment_method?: string | null
          picked_up_at?: string | null
          ready_at?: string | null
          sent_to_kitchen_at?: string | null
          status?: string
          table_id: string
          waiter_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_addition?: boolean
          notes?: string | null
          order_number?: number | null
          payment_method?: string | null
          picked_up_at?: string | null
          ready_at?: string | null
          sent_to_kitchen_at?: string | null
          status?: string
          table_id?: string
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          name: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          number: number
          status: string
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: string
          number: number
          status?: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          number?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
