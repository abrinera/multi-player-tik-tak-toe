# Codebase Analysis & Implementation Record

## Purpose

This is the living engineering record for the Tic-Tac-Toe Live repository. It describes what the
code currently does, how it is assembled, what has been verified, and what is known to be missing
or risky. [AGENTS.md](AGENTS.md) holds the short rules agents must follow; this file holds the
detail those rules point to and must be reconciled in the same work item as any change.

Current source, configuration, and their actual consumers are authoritative. Where this document
and the source disagree, the source wins and this document must be corrected.

## Document Control

| Item | Value |
| --- | --- |
| Repository | `tik-tak-toe` (local path `C:\Projects\001ERA\tik-tak-toe`), remote `origin` |
| Analysis scope | All 93 Git-tracked files (`git ls-files`), plus root listing of untracked/ignored entries |
| Project type | Full-stack web application: TanStack Start SSR front end + Supabase (Postgres, Realtime) back end, built and published through Lovable |
| Purpose | Create a private Tic-Tac-Toe room (3×3, 5×5, 7×7), share an invite link, and play live against one other guest with rematches |
| Branch / HEAD | `main` @ `d1c234ce72920038ebc8081357eb509f8dfd6ea6` ("Removed the cross from header", 2026-07-22 08:51 UTC) |
| Tracking | `main...origin/main`, no ahead/behind shown (local refs only; no fetch was performed) |
| Working tree at analysis start | Clean; no untracked files. `node_modules/` absent |
| Last reconciliation | 2026-10-13, Bangladesh Standard Time (UTC+06:00) |
| Languages | TypeScript (TSX), SQL (PL/pgSQL), CSS |
| Frameworks / runtime | React 19.2, TanStack Start 1.168 / Router 1.170, React Query 5 (provider only), Tailwind CSS 4.2, Supabase JS 2.110; Vite 8 + nitro 3 beta (Cloudflare default target per [vite.config.ts](vite.config.ts) comment) |
| Package / build tools | Bun (`bun.lock`, [bunfig.toml](bunfig.toml)), Vite via `@lovable.dev/vite-tanstack-config` 2.7.7, ESLint 9, Prettier 3, TypeScript 5.9 (resolved versions from `bun.lock`) |
| Active work | None established by evidence. Git history (all commits authored by `gpt-engineer-app[bot]` except the template commit) ends at an MVP plus security and header tweaks |
| Coverage | Every authored file under `src/`, `supabase/`, root configs and docs was read, except the 46 shadcn files in `src/components/ui/`, which were inventoried and checked for imports but not reviewed line by line. `.env` was inspected for variable **names** only. `bun.lock` was searched, not read in full |
| Limitations | No dependencies installed; no build, lint, type-check, test, or runtime check was run. The live Supabase database, Realtime configuration, Lovable hosting, and the contents of `@lovable.dev/vite-tanstack-config` were not inspected, so whether the deployed database matches the migrations is **Unknown** |

## Source of Truth and Update Rules

1. **Order of authority:** source code and SQL migrations → configuration files → actual callers
   (traced imports and RPC calls) → recorded verification evidence → historical documentation and
   comments. A comment (for example "used for UI hints and tests" in `winDetection.ts`) is context,
   not proof of use.
2. **Integrations are only "implemented" when a caller is traced.** An installed SDK, a generated
   client, or an environment variable alone does not count.
3. **Same work item:** any change to code, config, dependencies, migrations, assets, or docs updates
   the affected sections here before the work is considered done. Adding only a change-log row is
   insufficient.
4. **Complete inventories:** the annotated tree and diagrams below must list every authored file and
   current flow. Generated, dependency, and build areas are described by role.
5. **History is preserved:** Verification Log and Change Log are append-only. When behavior changes,
   rewrite the current-state sections and leave old log rows intact.
6. **No sensitive values:** never copy keys, tokens, URLs with credentials, or personal data. Record
   variable names, purpose, and requiredness only.

## Status Legend

| Status | Meaning |
| --- | --- |
| Implemented | Supporting source exists and is connected to its consumers |
| Partially implemented | Meaningful parts exist; missing pieces are named |
| Inactive | Source exists but has no caller, or is wired in with no effect (for example unused template code) |
| Verified | A named check passed for a stated scope and date |
| Partially verified | Some checks passed; remaining checks are named |
| Not verified | No relevant execution evidence |
| Deferred | Explicitly accepted work outside the current scope |
| Unknown | Insufficient evidence |

Implementation and verification are separate dimensions. As of the baseline, **nothing in this
repository has execution evidence**; every row below is *Not verified* unless stated.

## Current Codebase Snapshot

| Subsystem | Status | Evidence | Verification |
| --- | --- | --- | --- |
| Home / create room | Implemented | [src/routes/index.tsx](src/routes/index.tsx) → `create_game_room` RPC | Not verified |
| Join, waiting room, share link | Implemented | [src/routes/game.$roomToken.tsx](src/routes/game.$roomToken.tsx) `JoinScreen`, `WaitingRoom` | Not verified |
| Gameplay (moves, win/draw) | Implemented, server-authoritative | `make_move`, `_check_win` in [migration 1](supabase/migrations/20260722070428_4fad66df-3b09-4ca2-a4c0-7f502d39a90d.sql) | Not verified |
| Rematch with symbol swap | Implemented | `request_rematch` RPC; `GameResult` UI | Not verified |
| Leave / cancel / forfeit | Implemented | `leave_room` RPC; `onLeave`, `onCancel` | Not verified |
| Session recovery after refresh | Implemented | [src/lib/game/session.ts](src/lib/game/session.ts) localStorage token + `join_game_room` hash match | Not verified |
| Real-time sync | Implemented (refetch-on-change) | [src/hooks/useRoomRealtime.ts](src/hooks/useRoomRealtime.ts) Postgres-changes channel | Not verified |
| Presence / connection status | Partially implemented | `heartbeat` only sets `connected`/keeps `left`; nothing sets `reconnecting`/`disconnected` | Not verified |
| Room expiry | Partially implemented | `expires_at` set by RPCs; only `join_game_room` marks `expired`; no scheduled job | Not verified |
| Persistence | Supabase Postgres: `game_rooms`, `player_sessions`, `game_rounds`, `game_moves` | 4 migrations | Live DB state Unknown |
| Auth | None (anonymous guests). Supabase Auth wiring is Inactive template code | `auth-attacher.ts`, `auth-middleware.ts` | — |
| SSR shell & error handling | Implemented | [src/server.ts](src/server.ts), [src/start.ts](src/start.ts), [src/routes/__root.tsx](src/routes/__root.tsx) | Not verified |
| shadcn UI kit (46 files) | Inactive (no app imports) | `src/components/ui/` | — |
| Client win detection | Inactive (no callers) | [src/lib/game/winDetection.ts](src/lib/game/winDetection.ts) | — |
| Tests / CI | None present | No test files, no `.github/` | — |

## Current Change Tracker

| Field | Value |
| --- | --- |
| Work item | DOC-BASELINE-1 — documentation baseline |
| Objective | Analyse the repository and create `MASTER.md`; extend `AGENTS.md` with standing rules and repository guidance |
| Scope / status | Documentation only — Complete |
| Affected files | [AGENTS.md](AGENTS.md) (existing Lovable block preserved verbatim, guidance appended), [MASTER.md](MASTER.md) (new) |
| Behavior / architecture changes | None |
| Checks performed | Source inspection; read-only Git commands (`status`, `branch`, `log`, `ls-files`, `rev-parse`, `show --stat`, `remote`); link/inventory cross-check of these docs |
| Remaining work / limitations | No build, lint, type-check, or runtime check was run; live database not inspected. Issues found are recorded under Known Issues for the user to triage — none were fixed |

---

# Codebase Analysis

## Technology Stack and Build

**Runtime shape.** TanStack Start renders HTML on the server (nitro, Cloudflare target by default
according to the comment in [vite.config.ts](vite.config.ts)) and hydrates a React SPA. All game data
flows browser ↔ Supabase directly; the app server itself holds no game logic and defines no server
functions or API routes.

**Build configuration.**

- [vite.config.ts](vite.config.ts) calls `defineConfig` from `@lovable.dev/vite-tanstack-config`, which
  (per its comment) supplies TanStack Start, React, Tailwind, tsconfig paths, nitro, `VITE_*` env
  injection, the `@` alias, and Lovable dev tooling. The only local option redirects the server entry
  to `src/server.ts`.
- [tsconfig.json](tsconfig.json): strict, `noEmit`, bundler resolution, `@/*` → `./src/*`, unused
  locals/params allowed.
- [eslint.config.js](eslint.config.js): JS + typescript-eslint recommended, react-hooks, react-refresh,
  Prettier as an ESLint rule, bans the `server-only` import, `no-unused-vars` off.
- [.prettierrc](.prettierrc) / [.prettierignore](.prettierignore): width 100, double quotes, trailing
  commas; ignores lockfiles and `routeTree.gen.ts`. Note: much of the hand-written game code is not
  Prettier-formatted (long single lines), so `bun run lint` would likely report Prettier violations —
  **not verified**.
- [bunfig.toml](bunfig.toml): text lockfile, 24h minimum release age with listed `@lovable.dev/*`
  exclusions.
- [components.json](components.json): shadcn "new-york" config pointing at `src/styles.css`.

**Scripts** ([package.json](package.json)): `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.
No `test` or `typecheck` script.

**Dependencies actually used by app code** (traced imports outside `src/components/ui/`):

| Package | Used by |
| --- | --- |
| `react`, `react-dom` | everywhere |
| `@tanstack/react-router`, `@tanstack/react-start` | routes, router, start, server, Supabase middleware |
| `@tanstack/react-query` | `QueryClient` created in [router.tsx](src/router.tsx) and provided in `__root.tsx`; **no queries use it** |
| `@supabase/supabase-js` | [client.ts](src/integrations/supabase/client.ts) (used); other integration files (inactive) |
| `sonner` | toasts in routes, `<Toaster>` in `__root.tsx` |
| `clsx`, `tailwind-merge` | `cn()` in [utils.ts](src/lib/utils.ts) |
| `tailwindcss`, `tw-animate-css` | [styles.css](src/styles.css) |

**Declared but used only by inactive shadcn files:** all `@radix-ui/*`, `class-variance-authority`,
`lucide-react`, `cmdk`, `vaul`, `embla-carousel-react`, `recharts`, `react-day-picker`, `input-otp`,
`react-resizable-panels`, `react-hook-form`.
**Declared with no import anywhere in `src/`:** `zod`, `@hookform/resolvers`, `date-fns`.
`@tailwindcss/vite`, `@tanstack/router-plugin`, `vite-tsconfig-paths`, `nitro`, `@vitejs/plugin-react`
are presumably consumed by the Lovable Vite config (not inspected).

## Repository Directory Architecture

```text
tik-tak-toe/
├── .env                      # Committed. Supabase project id / URL / publishable key (names in "Configuration"); values not reproduced
├── .gitignore                # Ignores node_modules, dist, .output, .vinxi, .tanstack, .nitro, .wrangler, *.local, editor files (NOT .env)
├── .lovable/project.json     # Lovable template id/revision (tanstack_start_ts_current)
├── .prettierignore           # Excludes lockfiles, build output, routeTree.gen.ts from formatting
├── .prettierrc               # Prettier style
├── AGENTS.md                 # Agent rules; contains Lovable-managed block (LOVABLE:BEGIN/END)
├── MASTER.md                 # This record
├── README.md                 # Lovable template README (npm instructions; repo actually uses bun.lock)
├── bun.lock                  # Generated lockfile (Bun text format)
├── bunfig.toml               # Bun install policy (24h release-age guard)
├── components.json           # shadcn CLI config
├── eslint.config.js          # ESLint flat config
├── package.json              # Scripts and dependency manifest (name still "tanstack_start_ts")
├── tsconfig.json             # TypeScript config, @/ alias
├── vite.config.ts            # Lovable Vite/TanStack config; server entry → src/server.ts
├── public/
│   └── favicon.ico           # Site icon, linked from __root.tsx
├── src/
│   ├── server.ts             # SSR fetch entry: wraps TanStack server entry, renders fallback HTML on 500s
│   ├── start.ts              # createStart: request error middleware + (inert) Supabase auth function middleware
│   ├── router.tsx            # getRouter(): router + QueryClient context, scroll restoration
│   ├── routeTree.gen.ts      # GENERATED route tree (/, /game/$roomToken)
│   ├── styles.css            # Tailwind v4 entry, theme tokens, --neo-* palette, neo-shadow/neo-border utilities, reduced-motion rule
│   ├── routes/
│   │   ├── README.md         # File-based routing conventions (scoped instruction)
│   │   ├── __root.tsx        # HTML shell, head/meta/fonts, QueryClientProvider, Toaster, 404 + error boundary
│   │   ├── index.tsx         # "/" — landing page and Create Game form
│   │   └── game.$roomToken.tsx # "/game/:roomToken" — join, waiting room, game board, result/rematch (all screens in one file)
│   ├── components/
│   │   ├── neo/              # App design system (used)
│   │   │   ├── NeoButton.tsx # Button with 6 color variants, 3 sizes, neo shadow/press effects
│   │   │   ├── NeoCard.tsx   # Bordered card with 7 tones
│   │   │   └── NeoInput.tsx  # Bordered text input
│   │   └── ui/               # 46 shadcn/Radix components from the template — INACTIVE (imported only by each other)
│   │       └── accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card,
│   │           carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form,
│   │           hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress,
│   │           radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
│   │           switch, table, tabs, textarea, toggle, toggle-group, tooltip (.tsx)
│   ├── hooks/
│   │   ├── useRoomRealtime.ts # Loads room state and refetches on Postgres changes; exposes connected flag
│   │   └── use-mobile.tsx    # useIsMobile (768px); used only by inactive ui/sidebar.tsx
│   ├── lib/
│   │   ├── utils.ts          # cn() class merger
│   │   ├── error-capture.ts  # Records last global error/unhandled rejection (5s TTL) for server.ts
│   │   ├── error-page.ts     # Static fallback HTML error page
│   │   ├── lovable-error-reporting.ts # Forwards boundary errors to Lovable editor hooks when present
│   │   └── game/
│   │       ├── api.ts        # The only RPC/data layer: create/join/move/rematch/leave/heartbeat/fetchRoomState + error-code → message map
│   │       ├── session.ts    # Per-room private token + session id in localStorage; client action ids
│   │       ├── types.ts      # Domain types and BOARD_CONFIGS (3→3, 5→4, 7→5)
│   │       └── winDetection.ts # Client checkWin/isDraw — INACTIVE (no callers)
│   └── integrations/supabase/ # GENERATED by Lovable Cloud
│       ├── client.ts         # Browser/SSR client (lazy Proxy, publishable key) — used
│       ├── client.server.ts  # Service-role admin client — INACTIVE (no importers)
│       ├── auth-attacher.ts  # Client function middleware adding bearer token — registered, but no server functions exist
│       ├── auth-middleware.ts # requireSupabaseAuth server middleware — INACTIVE
│       └── types.ts          # Generated Database types (tables + RPCs, incl. get_room_by_token)
└── supabase/
    ├── config.toml           # Supabase project id
    └── migrations/           # Applied in filename order (all 2026-07-22)
        ├── 20260722070428_…sql # Schema, RLS read policies, Realtime publication, all game RPCs
        ├── 20260722072112_…sql # pgcrypto in `extensions` schema; RPC search_path += extensions
        ├── 20260722074346_…sql # Hide private_session_token_hash (column-level SELECT); lock _check_win
        └── 20260722083412_…sql # Revoke public_token column SELECT; add get_room_by_token RPC
```

**Not tracked / generated / local-only by role:** `node_modules/` (dependencies, absent at
analysis), `dist/`, `.output/`, `.vinxi/`, `.nitro/`, `.tanstack/` (build and cache output),
`.wrangler/`, `.dev.vars`, `*.local` (local Cloudflare/env overrides), `.git/`.

## Entry Points and Execution Architecture

```text
 Browser ──HTTP──▶ src/server.ts (fetch) ──▶ @tanstack/react-start/server-entry
                     │ 500 + h3 "HTTPError" JSON → renderErrorPage()      │
                     └─ thrown error → renderErrorPage()                   ▼
                                               src/start.ts  requestMiddleware: errorMiddleware
                                                             functionMiddleware: attachSupabaseAuth (no serverFns → no effect)
                                                                   ▼
                                               src/router.tsx getRouter() + routeTree.gen.ts
                                                                   ▼
                                               __root.tsx  RootShell(<html>) → QueryClientProvider → Toaster → <Outlet/>
                                                     ├── /                  index.tsx
                                                     └── /game/$roomToken   game.$roomToken.tsx

 After hydration:  React components ──▶ lib/game/api.ts ──supabase.rpc / .from──▶ Supabase PostgREST
                   useRoomRealtime   ◀── Supabase Realtime (postgres_changes) ◀── table changes from RPCs
```

**Module boundaries.**

- Routes own UI and screen state. They call only `lib/game/api.ts`, `lib/game/session.ts`, and
  `hooks/useRoomRealtime.ts`.
- `lib/game/api.ts` is the single data boundary; it is the only module (besides the realtime hook's
  channel) that touches `supabase`.
- The database is the trust boundary and rule engine (see Authentication).
- `src/integrations/supabase/*` is generated infrastructure.

**SSR.** Both routes use the default SSR mode; nothing sets `ssr: false`. Data loading happens only
in client effects, so the server renders the `LOADING…` card for `/game/...`. See Known Issues S1
about `localStorage` access during that render.

## Routes

| Path | File | Behavior |
| --- | --- | --- |
| `/` | [index.tsx](src/routes/index.tsx) | Landing copy, name input (1–24 chars), board-size picker, "Create Game" |
| `/game/$roomToken` | [game.$roomToken.tsx](src/routes/game.$roomToken.tsx) | Chooses a screen from room state and local session (table below) |
| any other | `__root.tsx` `NotFoundComponent` | Neo-styled 404 |

Screen selection in `GamePage`, in order:

| Condition | Screen |
| --- | --- |
| initial load | `LOADING…` |
| `error === "not_found"` or no state after load (includes any fetch failure) | "INVALID LINK" |
| `room.status` is `expired` / `cancelled` | "GAME EXPIRED" / "GAME CANCELLED" |
| not a player and 2 players present | "GAME FULL" |
| not a player | `JoinScreen` |
| player, room `waiting` | `WaitingRoom` (copy link, Web Share, WhatsApp, cancel) |
| player, otherwise | `GameScreen` (status banner, player cards, board, forfeit or result/rematch) |

## Feature and Capability Inventory

### Create room
`Home.onCreate` generates a token under the temporary key `ttt.session.__bootstrap__`, calls
`create_game_room(name, size, token)`, then re-stores the token under `ttt.session.<room_token>`,
stores the session id, remembers the display name, deletes the bootstrap key, and navigates to the
room. The RPC strips `<`/`>`, validates name length and board size, requires a ≥32-char token, creates
the room (`waiting`, expires in 30 min), and inserts player 1 with the SHA-256 hash of the token.
Errors surface as a toast.

### Join and recover
`JoinScreen` calls `join_game_room`. If the token hash already belongs to a player in that room the
RPC marks them connected and returns `recovered: true` — this is how refresh / new-tab recovery works.
Otherwise it requires status `waiting` and fewer than 2 players, inserts player 2, randomly assigns X
(X moves first), creates round 1 with an empty board, sets the room `active`, and extends expiry to
24 h. A waiting room past `expires_at` is marked `expired` here (the only place that happens).

### Moves
`onCellClick` sends `make_move` with the round id, cell, `expectedTurn = round.turn_number`, and a
random `clientActionId`. The RPC locks room and round rows, checks status, membership, turn ownership,
turn number (`stale_turn`), cell bounds, duplicate action id, and occupancy; records a `game_moves`
row; runs `_check_win`; then either completes the round (winner, `winning_cells`, +1 `session_wins`,
room `completed`, expiry 60 min), records a draw, or passes the turn. The UI does not apply moves
optimistically; it waits for the realtime refetch.

### Rematch
First `request_rematch` call sets `rematch_requested_by`; the second (from the other player) swaps
both players' symbols, creates the next round with the new X to move, and reactivates the room.

### Leave, cancel, forfeit
`leave_room` marks the caller `left`. In a `waiting` room it cancels the room. In an `active` room with
`p_forfeit = true` the opponent wins the round and the room completes. The UI uses forfeit during play,
non-forfeit after a round ends, and cancel in the waiting room.

### Heartbeat and visibility
While the player has a session id, `heartbeat` runs every 15 s and on tab-visible (which also
reloads state). It updates `last_seen_at` and sets `connected` unless the player has `left`.

### Sharing
Invite link `origin/game/<public_token>`; Copy (Clipboard API), Share (Web Share API with copy
fallback), WhatsApp (`wa.me` link in a new tab).

### Inactive / placeholder code
- `winDetection.ts` (`checkWin`, `isDraw`): no callers; its comment claims test/UI use that does not exist.
- `session.ts` `setSessionToken`, `clearSessionToken`: no callers. The private token is never cleared
  on leave (only the session id is).
- React Query: provider present, no queries.
- Supabase auth middleware, admin client, `use-mobile`, and all `components/ui/*`: no app callers.
- UI states for `reconnecting` / `disconnected` exist but the server never produces them (Known Issues).

## Authentication, Sessions, and Trust Boundaries

- **No user accounts.** Players are anonymous guests identified per room by a 32-byte random hex
  token kept in `localStorage` (`ttt.session.<roomToken>`). Only `sha256(token)` is stored
  (`player_sessions.private_session_token_hash`).
- **Public identifiers:** room `public_token` (18 random bytes, URL-safe base64) in the invite URL;
  player `id` (UUID), readable by anyone.
- **Database privileges** (from migrations): `anon`/`authenticated` have `SELECT` on all four tables
  with `using (true)` RLS policies and no insert/update/delete policies. All writes go through
  `SECURITY DEFINER` functions with `search_path = public, extensions`, which re-check the token hash
  for every player action. `player_sessions` SELECT is column-limited so the hash is not readable.
  `_check_win` is not executable by clients.
- **Supabase Auth:** the generated client persists an auth session in `localStorage`, and
  `attachSupabaseAuth` would forward a bearer token to server functions, but the app never signs in and
  has no server functions, so this path is inactive.
- **Service role:** `client.server.ts` reads `SUPABASE_SERVICE_ROLE_KEY` but is never imported.
- Room-token confidentiality is weaker than intended — see Known Issues S2.

## Domain Model, Schema, and Validation

| Table | Key columns | Notes |
| --- | --- | --- |
| `game_rooms` | `public_token` (unique), `status` (`waiting/active/completed/cancelled/expired`), `board_size` (3/5/7), `winning_length` (3/4/5), `current_round_id`, `rematch_requested_by`, `expires_at` | No FK on `current_round_id` / `rematch_requested_by` |
| `player_sessions` | `room_id` FK cascade, `private_session_token_hash`, `display_name`, `player_position` (1/2), `symbol` (X/O/null), `connection_status`, `session_wins`, `last_seen_at` | Unique (room, position) and (room, hash) |
| `game_rounds` | `round_number`, `board_state text[]` (`''` = empty), `current_turn_player_id`, `turn_number`, `status` (`in_progress/completed/draw`), `winner_player_id`, `winning_cells int[]`, `starting_x_player_id` | Unique (room, round_number) |
| `game_moves` | `round_id`, `player_id`, `cell_index`, `symbol`, `turn_number`, `client_action_id` | Unique (round, action id), (round, cell). Written by `make_move`; never read by the client |

Client types mirror these in [src/lib/game/types.ts](src/lib/game/types.ts) (string unions narrower
than the generated `string` columns). Board configs: 3×3 connect 3, 5×5 connect 4, 7×7 connect 5 — the
same mapping is hard-coded in `create_game_room`.

Validation: client limits names to 1–24 trimmed characters; the server repeats this after stripping
`<` and `>`. RPC error codes are raised as exception text and mapped to messages by substring in
`errMsg` ([api.ts](src/lib/game/api.ts)); `invalid_round` has no mapping and shows raw.

## Data, State, and Real-time Behavior

- **Server state** lives only in Postgres. `fetchRoomState` calls `get_room_by_token`, then in parallel
  reads players (explicit safe column list) and the current round.
- **Client state:** `useRoomRealtime` holds `{room, players, round}`, `loading`, `error`, `connected`.
  Screen components hold form input, submitting flags, and copy feedback. `localStorage` keys:
  `ttt.session.<room>` (private token), `ttt.session.<room>.id` (session id), `ttt.displayName`,
  transient `ttt.session.__bootstrap__`, plus Supabase Auth's own storage.
- **Realtime:** one channel `room:<roomId>` subscribes to `postgres_changes` (`*`) on `game_rooms`
  (by id), `player_sessions` and `game_rounds` (by `room_id`). Every event triggers a full
  `fetchRoomState` (3 requests). `connected` is true while the channel status is `SUBSCRIBED`.
  `game_moves` is in the publication but not subscribed.
- **Polling:** 15 s heartbeat (write only); no polling reads.
- **Scheduled jobs:** none in the repository (no cron, edge functions, or pg_cron).

## UI, Styling, Responsiveness, and Accessibility

- Neo-brutalist look: thick black borders, hard offset shadows, flat bright `--neo-*` colors,
  `Archivo Black` display and `Space Grotesk` body fonts loaded from Google Fonts in `__root.tsx`,
  all radii forced to 0 in [styles.css](src/styles.css).
- Styling is Tailwind utility classes in components plus the custom utilities in `styles.css`; the
  404 page and Toaster use inline styles. The root `ErrorComponent` still uses shadcn token classes
  (`bg-primary`, `rounded-md`), so it does not match the neo look.
- Responsive via `sm:`/`lg:` breakpoints; board cell sizes scale with viewport width per board size.
- Accessibility present: labelled inputs, `aria-pressed` on board-size buttons, board as
  `role="grid"` with per-cell `aria-label`, `aria-live="polite"` status and connection badge,
  visible focus rings, `prefers-reduced-motion` disables transitions. Not audited at runtime.

## Configuration and Environment

| Variable | Read by | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | `client.ts` (browser, build-time) | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts` | Yes | Publishable (anon) key |
| `SUPABASE_URL` | `client.ts` SSR fallback, `client.server.ts`, `auth-middleware.ts` | SSR fallback | Same, server side |
| `SUPABASE_PUBLISHABLE_KEY` | `client.ts` SSR fallback, `auth-middleware.ts` | SSR fallback | Same, server side |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` (inactive) | No (not in `.env`) | Admin access — never expose |
| `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID` | none in `src/` | No | Present in `.env`; project id also in `supabase/config.toml` |

Precedence in `client.ts`: `import.meta.env.VITE_*` first, then `process.env.*`. The client is created
lazily on first property access and throws a descriptive error if either value is missing. `.env` is
committed and not git-ignored; it holds only the publishable key (designed to be public) — but any
secret added there would be committed. No feature flags exist.

## Error Handling, Logging, and Observability

- **SSR:** `server.ts` catches thrown errors and h3's swallowed `{"unhandled":true,"message":"HTTPError"}`
  500s and returns `renderErrorPage()`; it logs the error captured by `error-capture.ts` when available.
  `start.ts` request middleware does the same for non-HTTP errors.
- **React:** root `errorComponent` logs, reports via `reportLovableError` (only active inside the Lovable
  editor preview), and offers retry/home.
- **Game actions:** RPC errors become friendly toasts. `heartbeat` errors are ignored. Errors from the
  players/round reads in `fetchRoomState` are ignored (empty list / null).
- No logging service, metrics, or tracing beyond `console.error`.

## CI, Deployment, and Operations

- No CI workflows, Dockerfiles, or infrastructure code in the repository.
- Deployment appears to be Lovable publish (commit "Update site info for publish"; `og:image` hosted on
  a Lovable preview bucket). The nitro build target is Cloudflare by default per the config comment.
  Hosting configuration itself is outside the repository — **Unknown**.
- Database migrations are created and applied through Lovable Cloud (filename pattern and commit
  messages). How and when they are applied to the live project is outside the repository.

## Test Inventory and Verification Baseline

- **Automated tests:** none (no `*.test.*` / `*.spec.*`, no test runner dependency, no `test` script).
- **Available commands:** `bun run lint`, `bun run build`, `bun run build:dev`, `bun run dev`,
  `bun run preview`, `bunx tsc --noEmit` (no script). Dependencies must be installed first.
- **Historical results:** none recorded anywhere in the repository.
- **This task:** source inspection and read-only Git commands only. No compilation, lint, tests,
  runtime, or Supabase checks were run, so all behavior above is **Not verified**.
- **Highest-value checks to add:** type-check and lint; a manual two-browser play-through on each
  board size (create, join, win, draw, rematch, forfeit, refresh recovery); SQL-level tests of the
  RPCs (turn order, stale turn, duplicate action, rematch, privilege checks — see S2).

## Known Issues

Confirmed from source (behavioral impact not executed):

| ID | Issue | Evidence |
| --- | --- | --- |
| C1 | `connection_status` values `reconnecting` / `disconnected` are never written, so the "OPPONENT RECONNECTING" banner is unreachable; an opponent who has `left` is not shown at all | `heartbeat` / `join_game_room` / `leave_room` in migration 1; `statusText` in `game.$roomToken.tsx` |
| C2 | Expiry is lazy. Only `join_game_room` marks a room `expired`, and only a non-active, non-completed one. A stale `waiting` room keeps rendering the waiting screen; `make_move` ignores `expires_at`; nothing deletes old rows | migration 1 |
| C3 | `make_move` checks the duplicate `client_action_id` after the turn and `stale_turn` checks, so a retried, already-applied move fails with `not_your_turn`/`stale_turn` instead of returning `duplicate` (the client does not retry, so low impact) | migration 1, lines ~222–228 |
| C4 | Any `get_room_by_token` failure (for example network) leaves `state` null and shows "INVALID LINK" | `GamePage` condition `error === "not_found" \|\| (!state && !loading)` |
| C5 | Errors from the players/round queries in `fetchRoomState` are discarded, so a failed read can look like an empty room and show the Join screen | [api.ts](src/lib/game/api.ts) `fetchRoomState` |
| C6 | `invalid_round` RPC error has no friendly mapping | `errMsg` map |

Suspected risks (not verified):

| ID | Risk | Reasoning / how to verify |
| --- | --- | --- |
| S1 | Server-side render of `/game/$roomToken` may throw `localStorage is not defined`: `GamePage`'s `useState` initializer calls `getStoredSessionId` during render, and the route uses default SSR | Load a game URL directly and check server logs / whether the root error component flashes. The Lovable config may change SSR defaults (not inspected) |
| S2 | Room tokens may still be enumerable. Migration 4 revokes only column-level `SELECT (public_token)`, but migration 1 granted table-level `SELECT` on `game_rooms`; in PostgreSQL a column-level REVOKE does not remove a table-level grant. Migration 3 did this correctly for `player_sessions` (table REVOKE then column GRANT). If enumerable, anyone could list rooms and join waiting games. Realtime `game_rooms` payloads may also carry `public_token` | Query `game_rooms?select=public_token` with the anon key against a non-production project, or inspect `information_schema.role_table_grants` |
| S3 | Realtime reloads are not ordered; overlapping `fetchRoomState` calls can resolve out of order and briefly show stale state. Each move emits several change events, each causing 3 requests | `useRoomRealtime.reload` |
| S4 | If a host loses `localStorage` while waiting, the join screen lets them join their own room as player 2 with a new token | `GamePage` → `JoinScreen`, `join_game_room` |
| S5 | `get_room_by_token` returns a composite type; behavior for a missing token (null vs all-null object) through PostgREST is Unknown. The client only handles null/empty | `fetchRoomState` |

## Technical Debt

- 46 unused shadcn components plus ~30 dependencies that only they import; `zod`, `@hookform/resolvers`,
  `date-fns` unused entirely. Increases install size and audit surface.
- Inactive template wiring: React Query provider, Supabase auth middleware/attacher, admin client,
  `use-mobile`.
- Dead `winDetection.ts` duplicates `_check_win` with a misleading comment.
- `game.$roomToken.tsx` (455 lines) holds six components and all game-screen logic.
- Hand-written code is not Prettier-formatted although Prettier runs as an ESLint rule.
- Board-config mapping duplicated in `types.ts` and `create_game_room`; client types hand-maintained
  alongside generated `types.ts`.
- `_check_win` body duplicated across migrations 1 and 3 (expected for migrations, but changes must go
  in a new migration).
- `package.json` name and README remain template defaults; README's npm instructions conflict with the
  Bun lockfile.

## Deferred Decisions

None explicitly recorded in the repository or by the user. Items in Known Issues and Technical Debt
are suggestions awaiting triage, not accepted scope.

---

# Implementation Progress

| Workstream | Item | Implementation | Verification | Evidence | Remaining |
| --- | --- | --- | --- | --- | --- |
| Rooms | Create room, 3 board sizes | Implemented | Not verified | `index.tsx`, `create_game_room` | — |
| Rooms | Invite/share link | Implemented | Not verified | `WaitingRoom` | — |
| Rooms | Cancel waiting room | Implemented | Not verified | `leave_room` | — |
| Rooms | Expiry | Partially implemented | Not verified | C2 | Cleanup/expiry enforcement not built |
| Players | Join, symbol assignment | Implemented | Not verified | `join_game_room` | — |
| Players | Refresh/session recovery | Implemented | Not verified | `session.ts`, hash match | S4 edge case |
| Players | Presence/reconnecting status | Partially implemented | Not verified | C1 | No server transition to reconnecting/disconnected |
| Gameplay | Moves, turn order, stale-turn guard | Implemented | Not verified | `make_move` | C3 ordering |
| Gameplay | Win/draw detection (server) | Implemented | Not verified | `_check_win` | — |
| Gameplay | Session win counter | Implemented | Not verified | `session_wins` | — |
| Gameplay | Rematch with symbol swap | Implemented | Not verified | `request_rematch` | — |
| Gameplay | Forfeit | Implemented | Not verified | `leave_room(p_forfeit)` | — |
| Sync | Realtime refetch | Implemented | Not verified | `useRoomRealtime` | S3 |
| Security | Token hash hidden from clients | Implemented | Not verified | migration 3 | — |
| Security | Room token not enumerable | Partially implemented | Not verified | migration 4 | S2 |
| Platform | SSR shell and error pages | Implemented | Not verified | `server.ts`, `start.ts`, `__root.tsx` | S1 |
| Quality | Tests / CI | Not started | — | none | No accepted plan |

## Pending Requests and Handoff

- No outstanding user requests are established beyond this documentation baseline.
- Open questions for the user: whether to address S1 and S2 (the two potentially user-visible or
  security-relevant items) and whether to prune the unused template code and dependencies.
- Next actionable steps if work resumes: install dependencies; run `bunx tsc --noEmit` and
  `bun run lint` to set a verification baseline; check S1 and S2 against a non-production Supabase
  project before changing anything.

## Future Update Workflow and Architecture Drift

Required loop for every work item: **read** AGENTS.md and this file → **inspect** affected source,
migrations, and callers → **change** → **reconcile** the sections below against the resulting source
(including indirect effects such as generated types, error-code maps, and realtime subscriptions) →
**verify** with the checks the user permits → **record** in the Verification Log and Change Log.

| Change type | Sections to review |
| --- | --- |
| New/renamed route | Routes, Entry Points diagram, tree, `routeTree.gen.ts` regenerated, Snapshot |
| New migration / RPC / column | Domain Model, Authentication & Trust Boundaries, Data & Real-time, `types.ts` + `lib/game/types.ts`, `errMsg` map, Known Issues, Progress |
| RPC error code added/changed | `errMsg` in `api.ts`, Domain Model validation, Known Issues C6 |
| Realtime subscription change | Data & Real-time, Entry Points diagram, Known Issues S3 |
| `localStorage` key change | Data & State, Authentication, session recovery feature |
| Dependency add/remove | Technology Stack (used vs declared), tree, `bun.lock`; respect `bunfig.toml` guard |
| Styling / design tokens | UI & Styling, `styles.css` entry, neo component entries |
| Env var / config change | Configuration table, Technology Stack, Document Control |
| Server entry / middleware | Entry Points, Error Handling, Authentication |
| Adding tests or CI | Test Inventory, CI section, Snapshot, Progress, AGENTS.md commands |
| Removing inactive code | Tree, Inventory "Inactive" list, Technical Debt, Stack dependency lists |
| Docs-only change | Dated reconciliation note in Change Log stating no behavior impact |

## Verification Log

| Date | Work item / scope | Command or inspection | Result | Limitations |
| --- | --- | --- | --- | --- |
| 2026-10-13 | DOC-BASELINE-1 / whole repo | `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git log`, `git ls-files`, `git status -sb`, `git show --stat d1c234c` | Clean tree on `main` @ `d1c234c`; 93 tracked files; no untracked files | Local refs only; no fetch |
| 2026-10-13 | DOC-BASELINE-1 / source | Read all authored source, SQL migrations, configs, docs; import/caller tracing with ripgrep | Findings recorded above | `components/ui/*` inventoried, not reviewed line by line; `.env` names only |
| 2026-10-13 | DOC-BASELINE-1 / docs | Cross-checked tree against `git ls-files`; checked relative links and headings in AGENTS.md and MASTER.md | Consistent | Manual check, no Markdown linter |
| 2026-10-13 | DOC-BASELINE-1 | Build, lint, type-check, tests, runtime, Supabase | **Not run** (documentation task; `node_modules` absent) | — |

## Change Log

| Date | Work item | Change | Affected files / areas | Verification |
| --- | --- | --- | --- | --- |
| 2026-10-13 | DOC-BASELINE-1 | Created the codebase analysis and implementation record; added standing agent rules, generated-file list, conventions, and commands to AGENTS.md while preserving the Lovable-managed block. No application files changed | `MASTER.md` (new), `AGENTS.md` | Source inspection and read-only Git only |

