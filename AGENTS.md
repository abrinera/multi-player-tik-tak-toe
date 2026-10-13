<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agent Guide — Tic-Tac-Toe Live

Real-time two-player Tic-Tac-Toe: a TanStack Start (React 19, Vite 8) web app whose game rules
run in Supabase Postgres functions and whose updates arrive through Supabase Realtime. The full
engineering record is in [MASTER.md](MASTER.md). Current source is authoritative over both files.

## Standing rules (required)

1. Before changing code, configuration, dependencies, assets, tests, or documentation, read
   [MASTER.md](MASTER.md) and inspect the affected source and any applicable scoped instructions
   (for example [src/routes/README.md](src/routes/README.md) and the header comments in generated files).
2. In the same work item as every change, reconcile all affected *Codebase Analysis* subsections of
   MASTER.md against the resulting source. Update or remove obsolete statements. A change-log entry
   alone is insufficient.
3. Keep the Current Codebase Snapshot, Current Change Tracker, Implementation Progress, and
   verification summary consistent with the latest evidence.
4. Keep the annotated repository tree in MASTER.md complete and current. Update entries when files are
   added, removed, moved, or change responsibility. Update architecture and execution-flow diagrams when
   their structure changes.
5. If a change does not affect architecture or behavior, add a dated reconciliation note to MASTER.md
   explaining that conclusion.
6. Preserve earlier Verification Log and Change Log entries as history. Historical behavior must not
   remain presented as current behavior.
7. Record only checks actually performed. Distinguish source inspection, compilation/type-checking,
   lint, automated tests, runtime checks, and real Supabase integration checks. Follow the user's
   current testing instructions.
8. Preserve unrelated user changes and protect sensitive information. Never print or copy values from
   `.env` or any key, token, or credential; document variable names only.

## Lovable sync (explicit requirement — see block above)

- Do not force-push, rebase, amend, or squash pushed commits. Keep `main` in a working state.

## Generated files — do not hand-edit (explicit, from file headers)

| File | Generator / owner |
| --- | --- |
| [src/routeTree.gen.ts](src/routeTree.gen.ts) | TanStack Router plugin (regenerated from `src/routes/`) |
| [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts), [client.server.ts](src/integrations/supabase/client.server.ts), [auth-attacher.ts](src/integrations/supabase/auth-attacher.ts), [auth-middleware.ts](src/integrations/supabase/auth-middleware.ts) | Lovable Cloud Supabase integration |
| [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) | Supabase type generation (observed: matches the migrations; regenerate rather than edit) |
| [bun.lock](bun.lock) | Bun; change only through the package manager |

## Repository conventions

Explicit (stated in repository files):

- Routing is file-based under `src/routes/`; `__root.tsx` is the only root layout and must keep
  `<Outlet />`. Do not create `src/pages/` or Next.js/Remix layouts ([src/routes/README.md](src/routes/README.md)).
- Do not add TanStack devtools, `tanstackStart`, React, Tailwind, tsconfig-paths, or nitro plugins to
  [vite.config.ts](vite.config.ts); `@lovable.dev/vite-tanstack-config` already adds them.
- Server-only modules use the `*.server.ts` suffix; never import the `server-only` package (ESLint rule).
  The service-role client (`client.server.ts`) must never reach client code.
- [bunfig.toml](bunfig.toml) enforces a 24h minimum release age; confirm with the user before adding
  any exclusion.

Observed conventions (follow unless the user says otherwise):

- **Game authority lives in SQL.** All writes go through `SECURITY DEFINER` RPCs in
  `supabase/migrations/`; tables are read-only for `anon`/`authenticated`. Client code calls them only
  via [src/lib/game/api.ts](src/lib/game/api.ts). Do not add direct table writes from the browser.
- **Schema changes = new migration file** in `supabase/migrations/` (timestamp + UUID name, as Lovable
  creates them). Never edit an applied migration. After a schema change, regenerate `types.ts` and
  update `src/lib/game/types.ts` and the `errMsg` map in `api.ts` if error codes change.
- **Styling:** Tailwind CSS v4 configured in [src/styles.css](src/styles.css) (theme tokens, `--neo-*`
  colors, `neo-shadow*` utilities). App UI uses the neo-brutalist components in
  `src/components/neo/`; the shadcn components in `src/components/ui/` are template scaffolding and are
  currently unused by the app.
- Path alias `@/` → `src/`. Toasts use `sonner` directly. Formatting: Prettier (100 cols, double quotes,
  trailing commas).
- Package managers: two lockfiles are committed — `bun.lock` (Lovable) and `package-lock.json`
  (the user's local npm install). They can drift; ask the user before adding or upgrading dependencies.
- Running the dev server may rewrite `src/routeTree.gen.ts` (local router-plugin version). Don't
  commit that diff unless a route actually changed.
- README screenshots live in `docs/screenshots/`. Re-capturing them plays a real game against the
  connected Supabase project and writes rows, so ask the user first.

## Commands (from package.json)

| Purpose | Command |
| --- | --- |
| Dev server (port 8080) | `npm run dev` (`vite dev`) |
| Production build | `npm run build` · dev-mode build `npm run build:dev` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| Format (writes files) | `npm run format` |
| Type-check (no script) | `npx tsc --noEmit` |

`bun run <script>` works too. There is no automated test suite and no CI workflow. Only `npm run dev`
has been run so far (2026-10-13); see the Verification Log in MASTER.md. The app needs the Supabase
variables listed in MASTER.md.
