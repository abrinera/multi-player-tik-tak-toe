export type BoardSize = 3 | 5 | 7;
export type WinLength = 3 | 4 | 5;
export type Symbol = "X" | "O";
export type RoomStatus = "waiting" | "active" | "completed" | "cancelled" | "expired";
export type RoundStatus = "in_progress" | "completed" | "draw";
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected" | "left";

export const BOARD_CONFIGS: { size: BoardSize; winLength: WinLength; label: string; description: string }[] = [
  { size: 3, winLength: 3, label: "3 × 3", description: "Classic. Connect 3 to win." },
  { size: 5, winLength: 4, label: "5 × 5", description: "Bigger board. Connect 4 to win." },
  { size: 7, winLength: 5, label: "7 × 7", description: "Master mode. Connect 5 to win." },
];

export interface GameRoom {
  id: string;
  public_token: string;
  status: RoomStatus;
  board_size: BoardSize;
  winning_length: WinLength;
  current_round_id: string | null;
  rematch_requested_by: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  expires_at: string;
}

export interface PlayerSession {
  id: string;
  room_id: string;
  display_name: string;
  player_position: 1 | 2;
  symbol: Symbol | null;
  connection_status: ConnectionStatus;
  session_wins: number;
  last_seen_at: string;
}

export interface GameRound {
  id: string;
  room_id: string;
  round_number: number;
  board_state: string[];
  current_turn_player_id: string | null;
  turn_number: number;
  status: RoundStatus;
  winner_player_id: string | null;
  winning_cells: number[] | null;
  starting_x_player_id: string | null;
}
