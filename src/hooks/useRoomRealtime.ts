import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRoomState } from "@/lib/game/api";
import type { GameRoom, PlayerSession, GameRound } from "@/lib/game/types";

export interface RoomState {
  room: GameRoom;
  players: PlayerSession[];
  round: GameRound | null;
}

export function useRoomRealtime(roomToken: string | undefined) {
  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const roomIdRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    if (!roomToken) return;
    try {
      const s = await fetchRoomState(roomToken);
      if (!s) { setError("not_found"); setState(null); }
      else {
        setError(null);
        setState(s as RoomState);
        roomIdRef.current = s.room.id;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }, [roomToken]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);

  useEffect(() => {
    if (!roomToken) return;
    const roomId = state?.room?.id;
    if (!roomId) return;
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "player_sessions", filter: `room_id=eq.${roomId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rounds", filter: `room_id=eq.${roomId}` }, () => reload())
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [roomToken, state?.room?.id, reload]);

  return { state, loading, error, connected, reload };
}
