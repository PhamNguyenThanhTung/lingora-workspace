# Infrastructure — public DEV deployment

Scope: restore Git main → Vercel → stable public DEV → existing Supabase DEV. No Slice 7, schema changes, migrations, or product Auth changes. Preserve unrelated working-tree edits.

## Diagnosis

Deployment `8tPZyn7tnK2WsogabMik7XaUfnP9`, commit `122b933`: Turbopack cannot resolve `../../../generated/product-client/index.js` from `lingora-admin/src/server/db/index.js`. Reproduced with `git archive HEAD`, `npm ci`, `npm run build` in a separate clean directory without local env/generated artifacts.

Root cause category: build/generated artifact. The custom Prisma client is correctly ignored, but the build does not generate it. Vercel currently selects Next.js, root `lingora-admin`, automatic install/build, workspace files included, Node 26.x. No root-directory change needed.

## Fix and verification

1. Run existing `db:product:generate` before `next build`; never run migrations in the deployment build.
2. Verify clean install/build and typecheck; inspect diff and generated server/runtime assets.
3. Inspect configured env names/status only. Set canonical public origin in Vercel and verify Supabase Site URL / activation allowlist while retaining localhost.
4. Push scoped changes to main and verify Git-triggered deployment for the exact commit and stable domain.
5. Verify public unauthenticated routes, Admin critical routes, and owned Teacher fixture login/draft. Temporarily enable through supported flow and restore DISABLED. Browser sessions RAM only; close contexts.
6. Verify activation public redirect contract (full activation if safely feasible), Supabase runtime connectivity, and no private values in Git/client HTML/JS/source maps/evidence.

Codex directly implements and reviews this bounded infrastructure fix. Evidence: `/home/tung/.codex/task-logs/public-dev-deployment/`; no credentials or session material in evidence. Final acceptance requires the entire public runtime checklist, not build alone.

## Public runtime compatibility finding

Initial public Admin and owned Teacher smoke reached all required routes, but both browser consoles recorded React hydration error 418. Teacher creation/revision timestamps used the host timezone during SSR and the browser timezone during hydration (Vercel UTC versus the local browser UTC+7). Fix both existing Vietnamese date displays to an explicit `Asia/Ho_Chi_Minh` timezone and label UTC+7; no Auth or lesson behavior changes. Verify a hard page load in browsers with different timezones after redeployment, with no hydration errors. Restore the owned Teacher fixture to DISABLED after checks; do not save any lesson revision.
