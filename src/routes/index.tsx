import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoInput } from "@/components/neo/NeoInput";
import { BOARD_CONFIGS, type BoardSize } from "@/lib/game/types";
import { createGameRoom } from "@/lib/game/api";
import {
  getOrCreateSessionToken,
  setStoredSessionId,
} from "@/lib/game/session";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tic-Tac-Toe Live — Real-time multiplayer" },
      { name: "description", content: "Create a private Tic-Tac-Toe room, share the link, and play live from any device. 3×3, 5×5 or 7×7 boards." },
      { property: "og:title", content: "Tic-Tac-Toe Live — Real-time multiplayer" },
      { property: "og:description", content: "Create a private Tic-Tac-Toe room, share the link, and play live from any device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [name, setName] = useState("");
  const [size, setSize] = useState<BoardSize>(3);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const trimmed = useMemo(() => name.trim(), [name]);
  const canSubmit = trimmed.length >= 1 && trimmed.length <= 24 && !loading;

  async function onCreate() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      // Temporary token to create room; we'll re-tag under the room's public token afterwards.
      const bootstrap = getOrCreateSessionToken("__bootstrap__");
      const res = await createGameRoom(trimmed, size, bootstrap);
      // Re-anchor tokens to the room's public token so refresh works.
      localStorage.setItem(`ttt.session.${res.room_token}`, bootstrap);
      setStoredSessionId(res.room_token, res.session_id);
      localStorage.setItem("ttt.displayName", trimmed);
      localStorage.removeItem("ttt.session.__bootstrap__");
      navigate({ to: "/game/$roomToken", params: { roomToken: res.room_token } });
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-[4px] border-black bg-[var(--neo-yellow)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center border-[3px] border-black bg-white neo-shadow-sm font-display text-lg">✕</div>
            <span className="font-display text-xl sm:text-2xl">TIC-TAC-TOE LIVE</span>
          </div>
          <span className="hidden sm:inline-flex border-[3px] border-black bg-white px-3 py-1 text-xs font-bold uppercase neo-shadow-sm">Real-time</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="text-4xl sm:text-6xl leading-[0.95]">
              PLAY TIC-TAC-<span className="bg-[var(--neo-coral)] px-2 border-[3px] border-black inline-block neo-shadow-sm">TOE</span> <br />
              LIVE WITH A FRIEND.
            </h1>
            <p className="mt-6 max-w-md text-lg font-medium">
              Create a private room, share the link, and play live from separate devices.
              Three board sizes. Zero setup. No account needed.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-bold uppercase">
              <li>▸ Private invite link</li>
              <li>▸ Real-time moves</li>
              <li>▸ Rematch with symbol swap</li>
              <li>▸ Session recovery after refresh</li>
            </ul>
          </div>

          <NeoCard tone="white" className="p-6">
            <h2 className="text-2xl">CREATE GAME</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase mb-2">Your name</label>
                <NeoInput
                  id="name"
                  placeholder="Player 1"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={trimmed.length > 24}
                />
                <p className="mt-1 text-xs opacity-70">1–24 characters. No HTML.</p>
              </div>

              <div>
                <div className="block text-xs font-bold uppercase mb-2">Board size</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BOARD_CONFIGS.map((c) => {
                    const selected = size === c.size;
                    return (
                      <button
                        key={c.size}
                        type="button"
                        onClick={() => setSize(c.size)}
                        aria-pressed={selected}
                        className={`text-left border-[3px] border-black neo-shadow-sm p-3 transition-transform hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--neo-blue)] ${
                          selected ? "bg-[var(--neo-yellow)]" : "bg-white"
                        }`}
                      >
                        <div className="font-display text-xl">{c.label}</div>
                        <div className="text-xs font-semibold uppercase mt-1">Connect {c.winLength}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <NeoButton variant="green" size="lg" className="w-full" onClick={onCreate} disabled={!canSubmit}>
                {loading ? "Creating…" : "Create Game →"}
              </NeoButton>
            </div>
          </NeoCard>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl">HOW IT WORKS</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <NeoCard tone="blue">
              <div className="font-display text-2xl">1.</div>
              <div className="mt-2 font-bold">Enter your name and pick a board size.</div>
            </NeoCard>
            <NeoCard tone="pink">
              <div className="font-display text-2xl">2.</div>
              <div className="mt-2 font-bold">Share your private invite link with a friend.</div>
            </NeoCard>
            <NeoCard tone="green">
              <div className="font-display text-2xl">3.</div>
              <div className="mt-2 font-bold">Play live — moves sync in real time.</div>
            </NeoCard>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-10 text-xs font-bold uppercase opacity-70">Built for fast, playful multiplayer.</footer>
    </div>
  );
}
