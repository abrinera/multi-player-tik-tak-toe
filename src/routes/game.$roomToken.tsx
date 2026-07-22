import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoInput } from "@/components/neo/NeoInput";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import {
  joinGameRoom,
  makeMove,
  requestRematch,
  leaveRoom,
  heartbeat,
} from "@/lib/game/api";
import {
  getOrCreateSessionToken,
  getStoredSessionId,
  setStoredSessionId,
  clearStoredSessionId,
  newClientActionId,
} from "@/lib/game/session";
import { cn } from "@/lib/utils";
import type { PlayerSession, GameRound } from "@/lib/game/types";

export const Route = createFileRoute("/game/$roomToken")({
  head: ({ params }) => ({
    meta: [
      { title: `Tic-Tac-Toe Live — Room ${params.roomToken.slice(0, 6)}` },
      { name: "description", content: "Join this live Tic-Tac-Toe game — pick a name and play in real time." },
      { property: "og:title", content: "Join my Tic-Tac-Toe game" },
      { property: "og:description", content: "Real-time multiplayer Tic-Tac-Toe. Tap to join." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const { roomToken } = Route.useParams();
  const { state, loading, error, connected, reload } = useRoomRealtime(roomToken);
  const [mySessionId, setMySessionId] = useState<string | null>(() => getStoredSessionId(roomToken));

  // Heartbeat while player is in room
  useEffect(() => {
    if (!mySessionId) return;
    const token = getOrCreateSessionToken(roomToken);
    const id = setInterval(() => { heartbeat(roomToken, token).catch(() => {}); }, 15000);
    heartbeat(roomToken, token).catch(() => {});
    const onVis = () => { if (document.visibilityState === "visible") { heartbeat(roomToken, token).catch(() => {}); reload(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [mySessionId, roomToken, reload]);

  if (loading) return <FullScreen><NeoCard tone="yellow"><p className="font-display text-xl">LOADING…</p></NeoCard></FullScreen>;

  if (error === "not_found" || (!state && !loading)) {
    return <ErrorScreen title="INVALID LINK" body="This game link doesn't exist." />;
  }
  if (!state) return null;

  const { room, players, round } = state;
  const me = mySessionId ? players.find((p) => p.id === mySessionId) ?? null : null;

  if (room.status === "expired") return <ErrorScreen title="GAME EXPIRED" body="This room is no longer available." />;
  if (room.status === "cancelled") return <ErrorScreen title="GAME CANCELLED" body="The host cancelled this game." />;

  // Not a player yet
  if (!me) {
    // Room full and I'm not one of them
    if (players.length >= 2) {
      return <ErrorScreen title="GAME FULL" body="This game already has two players." tone="coral" />;
    }
    return (
      <JoinScreen
        roomToken={roomToken}
        boardSize={room.board_size}
        winLength={room.winning_length}
        onJoined={(sid) => setMySessionId(sid)}
      />
    );
  }

  if (room.status === "waiting") {
    return <WaitingRoom room={room} me={me} roomToken={roomToken} onCancelled={() => { clearStoredSessionId(roomToken); }} />;
  }

  return (
    <GameScreen
      roomToken={roomToken}
      room={room}
      players={players}
      round={round}
      me={me}
      connected={connected}
    />
  );
}

/* ---------------- Screens ---------------- */

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-4">{children}</div>;
}

function ErrorScreen({ title, body, tone = "yellow" }: { title: string; body: string; tone?: "yellow" | "coral" }) {
  return (
    <FullScreen>
      <NeoCard tone={tone} className="max-w-md text-center">
        <h1 className="text-3xl">{title}</h1>
        <p className="mt-3 font-semibold">{body}</p>
        <Link to="/" className="inline-block mt-6">
          <NeoButton variant="default">Create New Game</NeoButton>
        </Link>
      </NeoCard>
    </FullScreen>
  );
}

function JoinScreen({
  roomToken, boardSize, winLength, onJoined,
}: { roomToken: string; boardSize: number; winLength: number; onJoined: (id: string) => void }) {
  const [name, setName] = useState(() => localStorage.getItem("ttt.displayName") ?? "");
  const [loading, setLoading] = useState(false);
  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 1 && trimmed.length <= 24 && !loading;

  async function onJoin() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const token = getOrCreateSessionToken(roomToken);
      const res = await joinGameRoom(roomToken, trimmed, token);
      setStoredSessionId(roomToken, res.session_id);
      localStorage.setItem("ttt.displayName", trimmed);
      onJoined(res.session_id);
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <FullScreen>
      <NeoCard tone="white" className="max-w-md w-full">
        <h1 className="text-3xl">JOIN GAME</h1>
        <p className="mt-2 font-semibold">Board: {boardSize}×{boardSize} · Connect {winLength}</p>
        <div className="mt-5">
          <label className="block text-xs font-bold uppercase mb-2" htmlFor="name">Your name</label>
          <NeoInput id="name" value={name} maxLength={24} placeholder="Player 2" onChange={(e) => setName(e.target.value)} />
        </div>
        <NeoButton variant="green" size="lg" className="w-full mt-5" onClick={onJoin} disabled={!canSubmit}>
          {loading ? "Joining…" : "Join Game →"}
        </NeoButton>
      </NeoCard>
    </FullScreen>
  );
}

function WaitingRoom({
  room, me, roomToken, onCancelled,
}: { room: { public_token: string; board_size: number; winning_length: number }; me: PlayerSession; roomToken: string; onCancelled: () => void }) {
  const navigate = useNavigate();
  const link = typeof window !== "undefined" ? `${window.location.origin}/game/${room.public_token}` : "";
  const shareText = `Join my Tic-Tac-Toe game and play live with me: ${link}`;
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Link copied!"); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Couldn't copy"); }
  }
  async function onShare() {
    if (navigator.share) {
      try { await navigator.share({ title: "Tic-Tac-Toe Live", text: shareText, url: link }); } catch { /* cancelled */ }
    } else { onCopy(); }
  }
  function onWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  }
  async function onCancel() {
    const token = getOrCreateSessionToken(roomToken);
    try { await leaveRoom(roomToken, token); onCancelled(); navigate({ to: "/" }); } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl space-y-5">
        <NeoCard tone="yellow">
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-black animate-pulse" aria-hidden />
            <h1 className="text-2xl">WAITING FOR OPPONENT</h1>
          </div>
          <p className="mt-2 font-semibold">Share the link with a friend to start.</p>
        </NeoCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <NeoCard tone="white">
            <div className="text-xs font-bold uppercase opacity-70">Host</div>
            <div className="mt-1 font-display text-2xl truncate">{me.display_name}</div>
          </NeoCard>
          <NeoCard tone="pink">
            <div className="text-xs font-bold uppercase opacity-70">Game</div>
            <div className="mt-1 font-display text-2xl">{room.board_size}×{room.board_size}</div>
            <div className="text-xs font-bold uppercase">Connect {room.winning_length}</div>
          </NeoCard>
        </div>

        <NeoCard tone="white">
          <div className="text-xs font-bold uppercase opacity-70">Invitation link</div>
          <div className="mt-2 border-[3px] border-black bg-[var(--muted)] p-3 font-mono text-sm break-all">{link}</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <NeoButton variant="yellow" onClick={onCopy}>{copied ? "Copied!" : "Copy Link"}</NeoButton>
            <NeoButton variant="blue" onClick={onShare}>Share…</NeoButton>
            <NeoButton variant="green" onClick={onWhatsapp}>WhatsApp</NeoButton>
          </div>
        </NeoCard>

        <NeoButton variant="coral" onClick={onCancel} className="w-full">Cancel Game</NeoButton>
      </div>
    </div>
  );
}

/* ---------------- Game screen ---------------- */

function GameScreen({
  roomToken, room, players, round, me, connected,
}: {
  roomToken: string;
  room: import("@/lib/game/types").GameRoom;
  players: PlayerSession[];
  round: GameRound | null;
  me: PlayerSession;
  connected: boolean;
}) {
  const opponent = players.find((p) => p.id !== me.id) ?? null;
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const pendingCell = useRef<number | null>(null);

  const board = round?.board_state ?? [];
  const myTurn = round?.status === "in_progress" && round?.current_turn_player_id === me.id;
  const roundOver = round?.status === "completed" || round?.status === "draw";
  const iWon = round?.winner_player_id === me.id;
  const winnerName = round?.winner_player_id
    ? players.find((p) => p.id === round.winner_player_id)?.display_name ?? ""
    : "";

  async function onCellClick(idx: number) {
    if (!round || !myTurn || submitting || roundOver) return;
    if (board[idx] && board[idx] !== "") return;
    setSubmitting(true);
    pendingCell.current = idx;
    try {
      const token = getOrCreateSessionToken(roomToken);
      await makeMove({
        roomToken,
        sessionToken: token,
        roundId: round.id,
        cellIndex: idx,
        expectedTurn: round.turn_number,
        clientActionId: newClientActionId(),
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
      pendingCell.current = null;
    }
  }

  async function onRematch() {
    try {
      const token = getOrCreateSessionToken(roomToken);
      const res = await requestRematch(roomToken, token);
      if (!res.accepted) toast.message("Rematch requested — waiting for opponent…");
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onLeave(forfeit: boolean) {
    try {
      const token = getOrCreateSessionToken(roomToken);
      await leaveRoom(roomToken, token, forfeit);
      clearStoredSessionId(roomToken);
      navigate({ to: "/" });
    } catch (e) { toast.error((e as Error).message); }
  }

  const statusText = useMemo(() => {
    if (roundOver) {
      if (round?.status === "draw") return "DRAW";
      return iWon ? "YOU WON" : "YOU LOST";
    }
    if (!opponent) return "WAITING FOR OPPONENT";
    if (submitting) return "MOVE CONFIRMED";
    if (opponent.connection_status === "reconnecting" || opponent.connection_status === "disconnected") return "OPPONENT RECONNECTING";
    return myTurn ? "YOUR TURN" : "OPPONENT'S TURN";
  }, [roundOver, round, iWon, opponent, submitting, myTurn]);

  const statusTone: "yellow" | "green" | "coral" | "blue" =
    roundOver ? (round?.status === "draw" ? "blue" : iWon ? "green" : "coral") : myTurn ? "yellow" : "blue";

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="font-display text-lg sm:text-xl truncate">TIC-TAC-TOE LIVE</Link>
          <div className="flex items-center gap-2">
            <span
              className={cn("inline-flex items-center gap-1 border-[3px] border-black px-2 py-1 text-xs font-bold uppercase neo-shadow-sm",
                connected ? "bg-[var(--neo-green)]" : "bg-[var(--neo-coral)]")}
              aria-live="polite"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-black" aria-hidden />
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <PlayerCard player={me} label="You" active={myTurn && !roundOver} tone="yellow" />
          <PlayerCard player={opponent} label="Opponent" active={!!round && !myTurn && !roundOver && !!opponent} tone="pink" />
        </div>

        <NeoCard tone={statusTone} className="text-center">
          <div aria-live="polite" className="font-display text-2xl sm:text-3xl">{statusText}</div>
          <div className="mt-1 text-xs font-bold uppercase">
            Round {round?.round_number ?? 1} · {room.board_size}×{room.board_size} · Connect {room.winning_length}
          </div>
        </NeoCard>

        <GameBoard
          board={board}
          size={room.board_size}
          winningCells={round?.winning_cells ?? null}
          disabled={!myTurn || submitting || roundOver}
          mySymbol={me.symbol}
          onCellClick={onCellClick}
        />

        {roundOver && (
          <GameResult
            iWon={iWon}
            isDraw={round?.status === "draw"}
            winnerName={winnerName}
            rematchRequestedBy={room.rematch_requested_by}
            meId={me.id}
            onRematch={onRematch}
            onLeave={() => onLeave(false)}
          />
        )}

        {!roundOver && (
          <div className="flex justify-end">
            <NeoButton variant="coral" size="sm" onClick={() => onLeave(true)}>Forfeit & Leave</NeoButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Small components ---------------- */

function PlayerCard({
  player, label, active, tone,
}: { player: PlayerSession | null; label: string; active: boolean; tone: "yellow" | "pink" }) {
  return (
    <NeoCard tone={active ? tone : "white"} className={cn("p-3 sm:p-4", active && "ring-0")}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase opacity-70">{label}</span>
        {player?.symbol && (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center border-[3px] border-black bg-white font-display text-sm">
            {player.symbol}
          </span>
        )}
      </div>
      <div className="mt-1 font-display text-lg sm:text-xl truncate">{player?.display_name ?? "—"}</div>
      <div className="mt-1 text-xs font-bold uppercase">Wins: {player?.session_wins ?? 0}</div>
    </NeoCard>
  );
}

function GameBoard({
  board, size, winningCells, disabled, mySymbol, onCellClick,
}: {
  board: string[]; size: number; winningCells: number[] | null;
  disabled: boolean; mySymbol: string | null;
  onCellClick: (i: number) => void;
}) {
  const winSet = useMemo(() => new Set(winningCells ?? []), [winningCells]);
  const cellSize = size === 3 ? "min-h-[22vw] sm:min-h-[110px]" : size === 5 ? "min-h-[14vw] sm:min-h-[70px]" : "min-h-[10vw] sm:min-h-[52px]";
  const symbolSize = size === 3 ? "text-5xl sm:text-6xl" : size === 5 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  return (
    <NeoCard tone="white" className="p-2 sm:p-3">
      <div
        role="grid"
        aria-label={`${size} by ${size} game board`}
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((v, i) => {
          const empty = !v || v === "";
          const winning = winSet.has(i);
          const row = Math.floor(i / size) + 1;
          const col = (i % size) + 1;
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Row ${row}, Column ${col}, ${empty ? "empty" : v}`}
              disabled={disabled || !empty}
              onClick={() => onCellClick(i)}
              className={cn(
                "border-[3px] border-black neo-shadow-sm font-display flex items-center justify-center",
                cellSize, symbolSize,
                winning ? "bg-[var(--neo-green)]" : empty ? "bg-white hover:bg-[var(--neo-yellow)]" : "bg-[var(--muted)]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--neo-blue)]",
                "disabled:hover:bg-white disabled:cursor-default",
                empty && !disabled && mySymbol && "cursor-pointer",
              )}
            >
              <span className={v === "X" ? "text-[var(--neo-coral)]" : v === "O" ? "text-[var(--neo-blue)]" : "opacity-0"}>{v || "·"}</span>
            </button>
          );
        })}
      </div>
    </NeoCard>
  );
}

function GameResult({
  iWon, isDraw, winnerName, rematchRequestedBy, meId, onRematch, onLeave,
}: {
  iWon: boolean; isDraw: boolean; winnerName: string;
  rematchRequestedBy: string | null; meId: string;
  onRematch: () => void; onLeave: () => void;
}) {
  const iRequested = rematchRequestedBy === meId;
  const oppRequested = !!rematchRequestedBy && !iRequested;
  return (
    <NeoCard tone={isDraw ? "blue" : iWon ? "green" : "coral"}>
      <div className="font-display text-2xl">{isDraw ? "IT'S A DRAW" : iWon ? "YOU WON!" : `${winnerName} WON`}</div>
      {oppRequested && <p className="mt-2 font-bold text-sm">Opponent requested a rematch. Accept?</p>}
      {iRequested && <p className="mt-2 font-bold text-sm">Waiting for opponent to accept rematch…</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <NeoButton variant="yellow" onClick={onRematch} disabled={iRequested}>
          {oppRequested ? "Accept Rematch" : iRequested ? "Requested…" : "Request Rematch"}
        </NeoButton>
        <NeoButton variant="default" onClick={onLeave}>Leave Game</NeoButton>
      </div>
    </NeoCard>
  );
}
