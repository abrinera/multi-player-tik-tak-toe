import { supabase } from "@/integrations/supabase/client";

function errMsg(e: unknown): string {
  const raw = (e as { message?: string })?.message ?? "unknown_error";
  const known: Record<string, string> = {
    not_found: "This game link is invalid.",
    expired: "This game has expired.",
    cancelled: "This game was cancelled.",
    full: "This game is already full.",
    not_active: "This game isn't active.",
    not_a_player: "You aren't a player in this game.",
    not_your_turn: "It's not your turn.",
    stale_turn: "Your move was out of sync. Try again.",
    cell_taken: "That cell is already taken.",
    invalid_cell: "Invalid cell.",
    round_over: "This round is already over.",
    invalid_name: "Please enter a name (1–24 characters).",
    invalid_board_size: "Invalid board size.",
    invalid_session_token: "Invalid session.",
    not_completable: "Rematch not available yet.",
  };
  for (const k in known) if (raw.includes(k)) return known[k];
  return raw;
}

export async function createGameRoom(displayName: string, boardSize: number, sessionToken: string) {
  const { data, error } = await supabase.rpc("create_game_room", {
    p_display_name: displayName, p_board_size: boardSize, p_session_token: sessionToken,
  });
  if (error) throw new Error(errMsg(error));
  return data as { room_token: string; session_id: string; room_id: string };
}

export async function joinGameRoom(roomToken: string, displayName: string, sessionToken: string) {
  const { data, error } = await supabase.rpc("join_game_room", {
    p_room_token: roomToken, p_display_name: displayName, p_session_token: sessionToken,
  });
  if (error) throw new Error(errMsg(error));
  return data as { session_id: string; room_id: string; recovered: boolean };
}

export async function makeMove(args: {
  roomToken: string; sessionToken: string; roundId: string;
  cellIndex: number; expectedTurn: number; clientActionId: string;
}) {
  const { data, error } = await supabase.rpc("make_move", {
    p_room_token: args.roomToken, p_session_token: args.sessionToken,
    p_round_id: args.roundId, p_cell_index: args.cellIndex,
    p_expected_turn: args.expectedTurn, p_client_action_id: args.clientActionId,
  });
  if (error) throw new Error(errMsg(error));
  return data;
}

export async function requestRematch(roomToken: string, sessionToken: string) {
  const { data, error } = await supabase.rpc("request_rematch", {
    p_room_token: roomToken, p_session_token: sessionToken,
  });
  if (error) throw new Error(errMsg(error));
  return data as { accepted: boolean; already?: boolean };
}

export async function leaveRoom(roomToken: string, sessionToken: string, forfeit = false) {
  const { error } = await supabase.rpc("leave_room", {
    p_room_token: roomToken, p_session_token: sessionToken, p_forfeit: forfeit,
  });
  if (error) throw new Error(errMsg(error));
}

export async function heartbeat(roomToken: string, sessionToken: string) {
  await supabase.rpc("heartbeat", { p_room_token: roomToken, p_session_token: sessionToken });
}

export async function fetchRoomState(roomToken: string) {
  const { data: room, error } = await supabase.rpc("get_room_by_token", { p_room_token: roomToken });
  if (error) throw new Error(errMsg(error));
  if (!room) return null;
  const roomRow = Array.isArray(room) ? room[0] : room;
  if (!roomRow) return null;
  const [{ data: players }, { data: round }] = await Promise.all([
    supabase.from("player_sessions").select("id,room_id,display_name,player_position,symbol,connection_status,session_wins,joined_at,last_seen_at").eq("room_id", roomRow.id).order("player_position"),
    roomRow.current_round_id
      ? supabase.from("game_rounds").select("*").eq("id", roomRow.current_round_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { room: roomRow, players: players ?? [], round: round ?? null };
}
