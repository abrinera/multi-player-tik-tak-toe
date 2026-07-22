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
      game_moves: {
        Row: {
          cell_index: number
          client_action_id: string
          created_at: string
          id: string
          player_id: string
          round_id: string
          symbol: string
          turn_number: number
        }
        Insert: {
          cell_index: number
          client_action_id: string
          created_at?: string
          id?: string
          player_id: string
          round_id: string
          symbol: string
          turn_number: number
        }
        Update: {
          cell_index?: number
          client_action_id?: string
          created_at?: string
          id?: string
          player_id?: string
          round_id?: string
          symbol?: string
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          board_size: number
          created_at: string
          current_round_id: string | null
          expires_at: string
          id: string
          last_activity_at: string
          public_token: string
          rematch_requested_by: string | null
          status: string
          updated_at: string
          winning_length: number
        }
        Insert: {
          board_size: number
          created_at?: string
          current_round_id?: string | null
          expires_at: string
          id?: string
          last_activity_at?: string
          public_token: string
          rematch_requested_by?: string | null
          status?: string
          updated_at?: string
          winning_length: number
        }
        Update: {
          board_size?: number
          created_at?: string
          current_round_id?: string | null
          expires_at?: string
          id?: string
          last_activity_at?: string
          public_token?: string
          rematch_requested_by?: string | null
          status?: string
          updated_at?: string
          winning_length?: number
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          board_state: string[]
          completed_at: string | null
          current_turn_player_id: string | null
          id: string
          room_id: string
          round_number: number
          started_at: string
          starting_x_player_id: string | null
          status: string
          turn_number: number
          winner_player_id: string | null
          winning_cells: number[] | null
        }
        Insert: {
          board_state: string[]
          completed_at?: string | null
          current_turn_player_id?: string | null
          id?: string
          room_id: string
          round_number: number
          started_at?: string
          starting_x_player_id?: string | null
          status?: string
          turn_number?: number
          winner_player_id?: string | null
          winning_cells?: number[] | null
        }
        Update: {
          board_state?: string[]
          completed_at?: string | null
          current_turn_player_id?: string | null
          id?: string
          room_id?: string
          round_number?: number
          started_at?: string
          starting_x_player_id?: string | null
          status?: string
          turn_number?: number
          winner_player_id?: string | null
          winning_cells?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_current_turn_player_id_fkey"
            columns: ["current_turn_player_id"]
            isOneToOne: false
            referencedRelation: "player_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "player_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_sessions: {
        Row: {
          connection_status: string
          display_name: string
          id: string
          joined_at: string
          last_seen_at: string
          player_position: number
          private_session_token_hash: string
          room_id: string
          session_wins: number
          symbol: string | null
        }
        Insert: {
          connection_status?: string
          display_name: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          player_position: number
          private_session_token_hash: string
          room_id: string
          session_wins?: number
          symbol?: string | null
        }
        Update: {
          connection_status?: string
          display_name?: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          player_position?: number
          private_session_token_hash?: string
          room_id?: string
          session_wins?: number
          symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _check_win: {
        Args: {
          board: string[]
          last_pos: number
          size: number
          win_len: number
        }
        Returns: number[]
      }
      create_game_room: {
        Args: {
          p_board_size: number
          p_display_name: string
          p_session_token: string
        }
        Returns: Json
      }
      heartbeat: {
        Args: { p_room_token: string; p_session_token: string }
        Returns: undefined
      }
      join_game_room: {
        Args: {
          p_display_name: string
          p_room_token: string
          p_session_token: string
        }
        Returns: Json
      }
      leave_room: {
        Args: {
          p_forfeit?: boolean
          p_room_token: string
          p_session_token: string
        }
        Returns: Json
      }
      make_move: {
        Args: {
          p_cell_index: number
          p_client_action_id: string
          p_expected_turn: number
          p_room_token: string
          p_round_id: string
          p_session_token: string
        }
        Returns: Json
      }
      request_rematch: {
        Args: { p_room_token: string; p_session_token: string }
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
