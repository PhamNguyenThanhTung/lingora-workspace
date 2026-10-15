# Current Task — Remove Stale AI References from Lingora Web

**Status:** DONE
**Approval:** The user explicitly approved the exact plan on 2026-10-10 and added the constraints recorded in the approved snapshot. Do not restore AI runtime/route/contract/stubs, do not upgrade dependencies beyond aligning the three Playwright packages at 1.62.1, stop on unrelated root-lock churn, and do not stage/commit pre-existing changes.
**Scope:** Qualify the root README AI capability claim as target-only, remove stale code/test coupling to the deleted AI service, remove obsolete AI runtime instructions from the learner web README, and align @playwright/test, playwright, and playwright-core to the existing pinned 1.62.1 package set.
**Plan:** docs/superpowers/plans/2026-10-10-remove-stale-ai-references.md
**Prior task preservation:** The completed P0-D02 task pointer was copied byte-for-byte to plans/archive/2026-10-10-p0-d02-three-business-roles-content-responsibilities-DONE.md (SHA-256 verified).

## Permitted files and actions

- Update HANDOFF.md to reflect APPROVED status and the permitted implementation scope.
- Update only the root README statement of current AI runtime capability to distinguish target documentation from current code; preserve product intent and P0-D07 status.

- Delete only the confirmed AI-only lingora-web/src/lib/api/proxy.ts, lingora-web/src/lib/api/error.ts, and lingora-web/tests/unit/api.proxy.test.ts.
- Update only stale removed-service/runtime directions in lingora-web/README.md.
- Add exact playwright-core@1.62.1 to lingora-web/package.json; update lingora-web/package-lock.json and the existing untracked root package-lock.json only as needed to keep the workspace dependency graph locked without unrelated version churn.
- Update this task pointer and HANDOFF.md to reflect APPROVED; preserve the immutable approved snapshot before implementation. At task close, append observed evidence to logs/test-log.md and logs/development-log.md, and update HANDOFF.md as required by lifecycle rules.
- Preserve all other existing modifications, deletions, and untracked files. Do not stage or commit pre-existing changes outside task scope; do not create a commit in this shared dirty checkout.

## Out of scope

- Do not restore lingora-ai, AI routes, AI contracts, stubs, providers, models, or product behavior.
- Do not change schema, Prisma, migrations, P0-D02/P0-D07, or other product decisions.
- Do not rewrite historical/target AI documentation or broadly clean AI references outside the current-facing README and web runtime/test surface.
- Do not upgrade dependencies beyond the exact alignment described above.

## Dependencies and controlling sources

- User request dated 2026-10-10 and this approved task scope.
- Repository workflow: AGENTS.md; authority/classification: docs/README.md; current checkout and open AI compatibility conflict: docs/QUICK-REF.md, HANDOFF.md, and plans/master-implementation-and-report-plan.md §19.1.
- Preserve P0-D07 as open; no product decision is made by this cleanup.

## Acceptance criteria

1. No current web source/test imports @/features/ai/contracts or references the removed AI proxy helpers.
2. No AI feature/module is restored and non-AI web behavior remains unchanged.
3. Current-facing READMEs distinguish AI target intent from absent runtime and no longer direct users to deleted AI routes.
4. Playwright and axe use compatible playwright-core@1.62.1 from the existing pinned package line, with no broad upgrade.
5. Required web typecheck and unit tests pass, or any independent blocker is reproduced and classified.
6. No schema, migration, product decision, or unrelated pre-existing path is changed.

## Verification

- npm run typecheck --workspace lingora-web
- npm run test:unit --workspace lingora-web
- Directly relevant remaining test(s), if any
- npm ls @axe-core/playwright @playwright/test playwright playwright-core --all
- git diff --check
- Final rg scan for features/ai, lingora-ai, /api/ai, and @/features/ai/contracts, separately classifying historical/target documentation from current source and runtime references
- Final status/diff review confirming no schema, migration, product-decision, or unrelated-file changes

## Completion gate

After approval, preserve the immutable plan snapshot under plans/approved/ before implementation. Record observed test results in the required logs. Set DONE only after all acceptance checks pass; if an independent out-of-scope failure remains, keep the task incomplete and report evidence without widening scope. No commit is planned because the checkout contains unrelated existing changes.

## Final observed result

- Typecheck: PASS after removing the ignored generated `lingora-web/tsconfig.tsbuildinfo` cache that retained a diagnostic from the previous Playwright core version.
- Unit tests: PASS, 3 files / 8 tests.
- Dependency resolution: PASS; `@axe-core/playwright`, `@playwright/test`, `playwright`, and all resolved `playwright-core` instances are 1.62.1.
- Web lock dry run and `git diff --check`: PASS. Current web source/tests have no stale AI references.
- No AI runtime/route/contract/stub, schema, migration, P0-D02/P0-D07 decision, staged change, or commit was added.
- Detailed approved snapshot remains at `plans/approved/2026-10-10-remove-stale-ai-references-APPROVED.md`; the completed task pointer is archived at `plans/archive/2026-10-10-remove-stale-ai-references-DONE.md`. No follow-on task is active.
