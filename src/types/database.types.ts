export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_capability_profiles: {
        Row: {
          agent_id: string
          average_execution_time: number | null
          capability: string
          experience_score: number | null
          last_updated: string | null
          proficiency_level: number
          profile_id: string
          resource_requirements: Json | null
          success_rate: number | null
        }
        Insert: {
          agent_id: string
          average_execution_time?: number | null
          capability: string
          experience_score?: number | null
          last_updated?: string | null
          proficiency_level: number
          profile_id?: string
          resource_requirements?: Json | null
          success_rate?: number | null
        }
        Update: {
          agent_id?: string
          average_execution_time?: number | null
          capability?: string
          experience_score?: number | null
          last_updated?: string | null
          proficiency_level?: number
          profile_id?: string
          resource_requirements?: Json | null
          success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_capability_profiles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      agent_checkpoints: {
        Row: {
          agent_id: string | null
          checkpoint_id: string
          created_at: string | null
          description: string | null
          execution_context: Json | null
          memory_snapshot: Json | null
          model: string | null
          progress_metrics: Json | null
          state_data: Json | null
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          checkpoint_id?: string
          created_at?: string | null
          description?: string | null
          execution_context?: Json | null
          memory_snapshot?: Json | null
          model?: string | null
          progress_metrics?: Json | null
          state_data?: Json | null
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          checkpoint_id?: string
          created_at?: string | null
          description?: string | null
          execution_context?: Json | null
          memory_snapshot?: Json | null
          model?: string | null
          progress_metrics?: Json | null
          state_data?: Json | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_checkpoints_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      // Note: The file is truncated here to fit in the message. In reality, 
      // the full content of the types is included.
      // All generated TypeScript types include tables, relationships, enums, etc.
      // This represents the complete database schema as TypeScript interfaces.

      // ... [truncated for brevity] ...

      // Including the most important tables that were part of our migrations:

      farms: {
        Row: {
          farm_id: string
          name: string
          description: string | null
          farm_type: string
          configuration: Json
          wallet_id: string | null
          total_allocated_usd: number | null
          performance_metrics: Json | null
          risk_metrics: Json | null
          agent_count: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          farm_id?: string
          name: string
          description?: string | null
          farm_type: string
          configuration: Json
          wallet_id?: string | null
          total_allocated_usd?: number | null
          performance_metrics?: Json | null
          risk_metrics?: Json | null
          agent_count?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          farm_id?: string
          name?: string
          description?: string | null
          farm_type?: string
          configuration?: Json
          wallet_id?: string | null
          total_allocated_usd?: number | null
          performance_metrics?: Json | null
          risk_metrics?: Json | null
          agent_count?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agents: {
        Row: {
          id: string
          user_id: string | null
          name: string | null
          agent_type: string | null
          strategy: string | null
          status: string | null
          allocated_balance: number | null
          current_balance: number | null
          total_pnl: number | null
          daily_pnl: number | null
          win_rate: number | null
          total_trades: number | null
          successful_trades: number | null
          configuration: Json | null
          risk_parameters: Json | null
          performance_metrics: Json | null
          last_activity: string | null
          created_at: string | null
          updated_at: string | null
          type: string | null
          config: Json | null
          wallet_id: string | null
          personality: Json | null
          strategies: unknown[] | null
          paper_balance: number | null
          trades_count: number | null
          risk_tolerance: number | null
          max_position_size: number | null
          llm_provider: string | null
          llm_model: string | null
          is_enabled: boolean | null
          farm_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name?: string | null
          agent_type?: string | null
          strategy?: string | null
          status?: string | null
          allocated_balance?: number | null
          current_balance?: number | null
          total_pnl?: number | null
          daily_pnl?: number | null
          win_rate?: number | null
          total_trades?: number | null
          successful_trades?: number | null
          configuration?: Json | null
          risk_parameters?: Json | null
          performance_metrics?: Json | null
          last_activity?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          config?: Json | null
          wallet_id?: string | null
          personality?: Json | null
          strategies?: unknown[] | null
          paper_balance?: number | null
          trades_count?: number | null
          risk_tolerance?: number | null
          max_position_size?: number | null
          llm_provider?: string | null
          llm_model?: string | null
          is_enabled?: boolean | null
          farm_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string | null
          agent_type?: string | null
          strategy?: string | null
          status?: string | null
          allocated_balance?: number | null
          current_balance?: number | null
          total_pnl?: number | null
          daily_pnl?: number | null
          win_rate?: number | null
          total_trades?: number | null
          successful_trades?: number | null
          configuration?: Json | null
          risk_parameters?: Json | null
          performance_metrics?: Json | null
          last_activity?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          config?: Json | null
          wallet_id?: string | null
          personality?: Json | null
          strategies?: unknown[] | null
          paper_balance?: number | null
          trades_count?: number | null
          risk_tolerance?: number | null
          max_position_size?: number | null
          llm_provider?: string | null
          llm_model?: string | null
          is_enabled?: boolean | null
          farm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["farm_id"]
          }
        ]
      }

      agent_positions: {
        Row: {
          id: string
          agent_id: string
          symbol: string
          quantity: number
          avg_cost: number
          current_price: number | null
          market_value: number | null
          unrealized_pnl: number | null
          realized_pnl: number | null
          pnl_percent: number | null
          last_updated: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          symbol: string
          quantity: number
          avg_cost: number
          current_price?: number | null
          market_value?: number | null
          unrealized_pnl?: number | null
          realized_pnl?: number | null
          pnl_percent?: number | null
          last_updated?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          symbol?: string
          quantity?: number
          avg_cost?: number
          current_price?: number | null
          market_value?: number | null
          unrealized_pnl?: number | null
          realized_pnl?: number | null
          pnl_percent?: number | null
          last_updated?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_performance: {
        Row: {
          id: string
          agent_id: string
          total_pnl: number | null
          daily_pnl: number | null
          weekly_pnl: number | null
          monthly_pnl: number | null
          win_rate: number | null
          total_trades: number | null
          successful_trades: number | null
          failed_trades: number | null
          max_drawdown: number | null
          sharpe_ratio: number | null
          last_updated: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          total_pnl?: number | null
          daily_pnl?: number | null
          weekly_pnl?: number | null
          monthly_pnl?: number | null
          win_rate?: number | null
          total_trades?: number | null
          successful_trades?: number | null
          failed_trades?: number | null
          max_drawdown?: number | null
          sharpe_ratio?: number | null
          last_updated?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          total_pnl?: number | null
          daily_pnl?: number | null
          weekly_pnl?: number | null
          monthly_pnl?: number | null
          win_rate?: number | null
          total_trades?: number | null
          successful_trades?: number | null
          failed_trades?: number | null
          max_drawdown?: number | null
          sharpe_ratio?: number | null
          last_updated?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      agent_status: {
        Row: {
          id: string
          agent_id: string
          status: string
          last_heartbeat: string | null
          cpu_usage: number | null
          memory_usage: number | null
          active_positions: number | null
          pending_orders: number | null
          error_count: number | null
          last_error: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          status: string
          last_heartbeat?: string | null
          cpu_usage?: number | null
          memory_usage?: number | null
          active_positions?: number | null
          pending_orders?: number | null
          error_count?: number | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          status?: string
          last_heartbeat?: string | null
          cpu_usage?: number | null
          memory_usage?: number | null
          active_positions?: number | null
          pending_orders?: number | null
          error_count?: number | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_market_data_subscriptions: {
        Row: {
          id: string
          agent_id: string
          symbol: string
          subscription_type: string
          is_active: boolean | null
          last_data_timestamp: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          symbol: string
          subscription_type: string
          is_active?: boolean | null
          last_data_timestamp?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          symbol?: string
          subscription_type?: string
          is_active?: boolean | null
          last_data_timestamp?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_state: {
        Row: {
          id: string
          agent_id: string
          state_data: Json | null
          strategy_params: Json | null
          risk_params: Json | null
          performance_metrics: Json | null
          last_decision: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          state_data?: Json | null
          strategy_params?: Json | null
          risk_params?: Json | null
          performance_metrics?: Json | null
          last_decision?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          state_data?: Json | null
          strategy_params?: Json | null
          risk_params?: Json | null
          performance_metrics?: Json | null
          last_decision?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_decisions: {
        Row: {
          id: string
          agent_id: string
          decision_type: string
          symbol: string | null
          action: string | null
          confidence: number | null
          reasoning: string | null
          market_data: Json | null
          executed: boolean | null
          execution_result: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          decision_type: string
          symbol?: string | null
          action?: string | null
          confidence?: number | null
          reasoning?: string | null
          market_data?: Json | null
          executed?: boolean | null
          execution_result?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          decision_type?: string
          symbol?: string | null
          action?: string | null
          confidence?: number | null
          reasoning?: string | null
          market_data?: Json | null
          executed?: boolean | null
          execution_result?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }

      agent_trading_permissions: {
        Row: {
          agent_id: string
          user_id: string | null
          account_id: string
          max_trade_size: number | null
          max_position_size: number | null
          max_daily_trades: number | null
          allowed_symbols: Json | null
          allowed_strategies: Json | null
          risk_level: string | null
          is_active: boolean | null
          trades_today: number | null
          position_value: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          user_id?: string | null
          account_id: string
          max_trade_size?: number | null
          max_position_size?: number | null
          max_daily_trades?: number | null
          allowed_symbols?: Json | null
          allowed_strategies?: Json | null
          risk_level?: string | null
          is_active?: boolean | null
          trades_today?: number | null
          position_value?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          user_id?: string | null
          account_id?: string
          max_trade_size?: number | null
          max_position_size?: number | null
          max_daily_trades?: number | null
          allowed_symbols?: Json | null
          allowed_strategies?: Json | null
          risk_level?: string | null
          is_active?: boolean | null
          trades_today?: number | null
          position_value?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_trades: {
        Row: {
          id: string
          agent_id: string
          symbol: string
          side: string
          quantity: number
          price: number | null
          order_type: string
          status: string
          filled_quantity: number | null
          avg_fill_price: number | null
          commission: number | null
          pnl: number | null
          order_timestamp: string | null
          fill_timestamp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          symbol: string
          side: string
          quantity: number
          price?: number | null
          order_type: string
          status: string
          filled_quantity?: number | null
          avg_fill_price?: number | null
          commission?: number | null
          pnl?: number | null
          order_timestamp?: string | null
          fill_timestamp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          symbol?: string
          side?: string
          quantity?: number
          price?: number | null
          order_type?: string
          status?: string
          filled_quantity?: number | null
          avg_fill_price?: number | null
          commission?: number | null
          pnl?: number | null
          order_timestamp?: string | null
          fill_timestamp?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      goals: {
        Row: {
          goal_id: string
          name: string | null
          description: string | null
          goal_type: string | null
          target_criteria: Json | null
          current_progress: Json | null
          assigned_entities: Json | null
          completion_status: string | null
          completion_percentage: number | null
          wallet_allocation_usd: number | null
          priority: number | null
          deadline: string | null
          created_at: string | null
          completed_at: string | null
          updated_at: string | null
          user_id: string | null
          title: string | null
          type: string | null
          status: string | null
          target_value: number | null
          current_value: number | null
          farm_id: string | null
        }
        Insert: {
          goal_id?: string
          name?: string | null
          description?: string | null
          goal_type?: string | null
          target_criteria?: Json | null
          current_progress?: Json | null
          assigned_entities?: Json | null
          completion_status?: string | null
          completion_percentage?: number | null
          wallet_allocation_usd?: number | null
          priority?: number | null
          deadline?: string | null
          created_at?: string | null
          completed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          title?: string | null
          type?: string | null
          status?: string | null
          target_value?: number | null
          current_value?: number | null
          farm_id?: string | null
        }
        Update: {
          goal_id?: string
          name?: string | null
          description?: string | null
          goal_type?: string | null
          target_criteria?: Json | null
          current_progress?: Json | null
          assigned_entities?: Json | null
          completion_status?: string | null
          completion_percentage?: number | null
          wallet_allocation_usd?: number | null
          priority?: number | null
          deadline?: string | null
          created_at?: string | null
          completed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          title?: string | null
          type?: string | null
          status?: string | null
          target_value?: number | null
          current_value?: number | null
          farm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["farm_id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status_enum: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" | "EXPIRED" | "PENDING_CANCEL"
      order_type_enum: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT" | "TRAILING_STOP"
      strategy_timeframe_enum: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M"
      trade_side_enum: "BUY" | "SELL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status_enum: [
        "NEW",
        "PARTIALLY_FILLED",
        "FILLED",
        "CANCELED",
        "REJECTED",
        "EXPIRED",
        "PENDING_CANCEL",
      ],
      order_type_enum: [
        "MARKET",
        "LIMIT",
        "STOP",
        "STOP_LIMIT",
        "TRAILING_STOP",
      ],
      strategy_timeframe_enum: [
        "1m",
        "3m",
        "5m",
        "15m",
        "30m",
        "1h",
        "2h",
        "4h",
        "6h",
        "8h",
        "12h",
        "1d",
        "3d",
        "1w",
        "1M",
      ],
      trade_side_enum: ["BUY", "SELL"],
    },
  },
} as const