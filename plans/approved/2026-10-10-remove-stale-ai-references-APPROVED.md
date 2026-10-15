# Remove Stale AI References Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Restore the Lingora Web typecheck and unit-test baseline by removing dead AI proxy code/tests and aligning the existing Playwright type dependency versions.

**Architecture:** The current web source has no non-AI consumer of the proxy/error helpers; their only runtime callers were the already-deleted AI route handlers. Remove those helpers and the AI-only test file, then remove obsolete AI startup instructions from the web quickstart. Pin playwright-core to the already locked @playwright/test version so axe and Playwright use one compatible Page type.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Playwright, npm workspaces.

**Spec:** User request dated 2026-10-10 (remove stale AI references and restore web typecheck/unit tests); repository workflow in AGENTS.md.

**Approval:** Explicitly approved by the user on 2026-10-10, including the supplemental constraints in the task message: no AI restoration; reconfirm no non-AI consumers before deletion; keep @playwright/test, playwright, and playwright-core at 1.62.1; modify the root lock only if necessary and stop on unrelated churn; leave Prisma, migrations, product decisions, and historical/target AI documents unchanged; do not stage or commit pre-existing changes.

## Global Constraints

- Do not restore lingora-ai, AI routes, AI contracts, providers, models, or behavior.
- Do not change Prisma/schema/migrations, product decisions, or P0-D02/P0-D07.
- Preserve all pre-existing dirty and untracked work outside the paths listed below.
- Keep @playwright/test, playwright, and playwright-core exactly at 1.62.1; do not upgrade any other dependency.
- Do not stage or commit pre-existing changes outside this task; do not create a commit in this shared dirty checkout.

---

### Task 1: Remove AI-only helpers and stale web quickstart claims

**Files:**
- Modify: README.md
- Delete: lingora-web/src/lib/api/proxy.ts
- Delete: lingora-web/src/lib/api/error.ts
- Delete: lingora-web/tests/unit/api.proxy.test.ts
- Modify: lingora-web/README.md

**Evidence and boundaries:** rg found no non-AI consumer of either helper. The only route callers in HEAD are src/app/api/ai/chat/route.ts and src/app/api/ai/srs/route.ts, both already deleted in the starting worktree. The test file exclusively tests those routes' AI payload validation/proxy behavior; it has no generic API tests to retain. The root README currently describes the removed service as a provided capability; qualify it as target-only with compatibility still open under P0-D07. The web README's current local-run steps still start lingora-ai/api and direct requests to the deleted AI handlers.

- [ ] Update only the root README AI capability wording to distinguish documented target intent from absent current runtime; do not change product direction or P0-D07.
- [ ] Immediately before deletion, repeat the consumer search and verify the only route callers remain the already-deleted AI handlers; stop if any non-AI consumer appears.
- [ ] Remove the two helpers and their AI-only test file; do not replace them with contracts, stubs, or a generic layer.
- [ ] Keep learner-auth local run steps in lingora-web/README.md; remove AI service startup and deleted-route claims, and describe only behavior supported by current web source.

### Task 2: Align the Playwright type dependency using the existing locked version

**Files:**
- Modify: lingora-web/package.json
- Modify: lingora-web/package-lock.json
- Modify: existing untracked root package-lock.json only as needed to keep its workspace install graph reproducible.

**Evidence and boundaries:** lingora-web/package.json and its lock pin @playwright/test, playwright, and playwright-core to 1.62.1. The current root workspace install instead hoists playwright-core@1.63.0 to satisfy @axe-core/playwright@4.13.0's open peer range while @playwright/test@1.62.1 uses nested core 1.62.1. Page from core 1.63 adds required ariaSnapshotJSON, causing TS2741 where axe's Page is passed the 1.62.1 test fixture.

- [ ] Add exact dev dependency playwright-core: 1.62.1 to lingora-web/package.json so the open axe peer resolves to the same version as the existing Playwright test package.
- [ ] Regenerate the web lock and current root workspace lock only if required to resolve the workspace graph, without upgrading unrelated packages; stop if npm produces unrelated lockfile churn. Verify npm ls @axe-core/playwright @playwright/test playwright playwright-core --all contains only core 1.62.1 for this workspace graph. If lock regeneration introduces unrelated version churn, stop and report it.

### Task 3: Verify, record, and close the bounded task

**Files:**
- Modify: logs/test-log.md
- Modify: logs/development-log.md
- Modify: HANDOFF.md already reflects this APPROVED task; update again when the task reaches DONE or BLOCKED
- Modify: plans/current-task.md; preserve the approved snapshot under plans/approved/

- [ ] Run npm run typecheck --workspace lingora-web.
- [ ] Run npm run test:unit --workspace lingora-web and any remaining directly relevant unit test.
- [ ] Run git diff --check, inspect final diff and status, and rescan all features/ai, lingora-ai, /api/ai, and @/features/ai/contracts references. Classify retained historical/target documentation references; require no stale web source/test imports or current web runtime reference.
- [ ] Record exact command, output, environment, and observed verdict in required logs. Mark DONE only if acceptance checks pass; otherwise document the independent blocker and leave the task open.

## Acceptance Criteria

1. No current web source or test imports the deleted AI contract or references removed AI runtime helpers.
2. No AI service, route, contract, stub, or feature is restored.
3. Non-AI learner-auth behavior is unchanged; current-facing README files do not claim the deleted AI runtime is present or direct users to deleted AI routes.
4. playwright-core, playwright, and @playwright/test resolve consistently to 1.62.1 for this workspace, without unrelated dependency upgrades.
5. Web typecheck and unit suite pass. If an independent out-of-scope failure remains, do not expand scope; keep the task incomplete and report its evidence.
6. No schema, migration, product decision, or unrelated pre-existing file is changed.

## Review Notes

- Baseline typecheck fails with three TS2307 imports of @/features/ai/contracts and one TS2741 Playwright Page mismatch.
- Baseline unit test run fails only the AI-only api.proxy.test.ts suite; the other 3 suites and 8 tests pass.
- Initial repository status is already dirty. The completed prior P0-D02 task pointer was captured byte-for-byte at plans/archive/2026-10-10-p0-d02-three-business-roles-content-responsibilities-DONE.md before this plan replaced the active pointer.
- The active decision documentation classifies docs/03-api-contract.md and Phase 1 AI materials as legacy/target references; this narrow task does not rewrite those records or settle AI compatibility under P0-D07.