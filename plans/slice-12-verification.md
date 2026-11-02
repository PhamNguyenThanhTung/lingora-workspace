# Slice 12 verification

Status: **FAIL / STOP after correction1/1; NOT ACCEPTED.** No further feature fixes, push/deploy or real registration performed. Separate maintenance is committed locally as `bc4ecf1`. [Official spec](2026-11-01-slice-12-onboarding-context.md), [sole correction contract](2026-11-01-slice-12-correction.md), [roadmap](roadmap.md).

Anti A/B implemented the feature and the single correction round. Initial independent Sol 6.1 High review returned eight findings. Affected-code/integration re-review still reproduces two DEFAULT starting-state races, so owner workflow requires stopping. Root has preserved the uncommitted feature for review. Worker PASS claims do not establish acceptance.

## Remaining blockers

1. The DEFAULT locking query selects only currently AVAILABLE/PUBLISHED candidates. A previously PLANNED lower-Level Lesson can become eligible after that query, be read by the next units query without a held lock, and be withdrawn before insertion. Creation still selects its now-unavailable Level. Reproduced with all six migrations/guards intact; another higher Level remains eligible.
2. DEFAULT reads/sorts Level.position without locking Level rows. A competing writer can reorder the chosen Level from position1 to3 after that read; creation persists it even though another eligible Level remains position2. Framework mutations are guarded by existing constraints, but position mutation is allowed. Both are production service races, not merely missing tests.
3. Three new guard subprocess tests fail under the actual npm workspace command: relative `--import ./lingora-web/tests/feature/harness/server-only.mjs` resolves from `lingora-web`, so the child fails with ERR_MODULE_NOT_FOUND instead of executing the DB ownership guard. Top-level DB suites themselves now have owned-loopback guards; the new subprocess evidence is broken.
4. Pause-vs-reading/Practice tests labelled as winner schedules remain sequential. They do not prove simultaneous in-flight lock ordering. Preservation snapshots omit SRS cards. This required evidence remains incomplete after the requested correction.

Review/repro: [final review](evidence/slice-12/final-review.md), [initial review](evidence/slice-12/initial-review.md). Root/reviewer raw logs remain local `/tmp/lingora-s12-final-*.log`; the sanitized gate summary is [local-gates.json](evidence/slice-12/local-gates.json).

## Final root gates

Run from repository root after both workers stopped:

| Command | Result |
| --- | --- |
| `npm run test:feature` | FAIL:600/603;3 failures described above |
| `npm run test:components` | PASS:168/168 |
| `npm run test:integration:onboarding` | PASS:29/29 (Auth12 + Context17) |
| `npm run test:integration:lessons` | PASS:7/7 |
| `npm run test:integration:practice` | PASS:13/13 |
| `npm run typecheck` | PASS:both workspaces |
| `npm run build` | PASS:both workspaces |
| `git diff --check` | PASS |
| Local built client scan | PASS:42 files,0 secret/private-import/learner-answer matches |

The tracked local runner `scripts/local-test-db.mjs` creates owned loopback PostgreSQL databases and applies all six migrations unchanged. Root independently validated the accepted Practice recovery test clicks the actual product button after403; existing DB suites retain all production guards. The unrelated existing Admin modal assertion now waits for the same intended authoritative value rather than reading its first render; no staff source changed or assertion weakened.

## DEV and data boundaries

Read-only discovery confirms email/signup enabled, auto-confirm disabled and no signup Account trigger. The provider now honors the Learner callback: synthetic invalid-token probe303 to exact `/auth/confirm`; no registration email was sent. Real confirmation→password login→product context→first Lesson/Practice has **not** been accepted, because local feature review is FAIL. No reviewed feature was deployed. Local provider doubles are not real email evidence.

No learner/Auth/context/curriculum DEV writes were performed in this task. Final read-only reconciliation matches the before-registration baseline: supplied inbox still has0 Auth identities/Accounts/contexts/history/sessions, curriculum unchanged, all other Accounts unchanged, unexpected residue0. See [reconciliation](evidence/slice-12/public-no-write-reconciliation.json). Generated local private test credentials were removed; personal inbox, passwords, tokens and storage state are excluded from committed evidence. Owner-added callback configuration is retained as intended.

Next work requires a separately authorized correction task for the two races, missing concurrency/history evidence and workspace-safe test invocation, followed by gates/review before real DEV activation acceptance. No Slice13 or dependency advisory remediation was started.
