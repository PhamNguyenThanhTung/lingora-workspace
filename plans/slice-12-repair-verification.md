# Slice 12 Blocker Repair verification

Status: local regression, negative-control and final independent review gates PASS; source release/public acceptance pending. No release or email claim yet. New owner-authorized [repair spec](2026-11-01-slice-12-blocker-repair.md) supersedes the prior task's STOP for this bounded repair only; [historical failed verification](slice-12-verification.md) remains unchanged.

Codex confirmed the two DEFAULT lock/read mismatches and independently reran the three guard cases from learner workspace cwd:0/3 before repair (`/tmp/lingora-s12-repair-subprocess-red.log`). Senior Sol High planning confirmed a single narrow parent-writer dependency: actual Lesson creation must lock Course before insertion so Course SHARE can protect the complete selection set. No other supported Unit/Lesson insertion path bypasses this protocol.

One Anti package owns minimal production repair + regressions; Codex owns actual source review/direct remaining fixes, final gates, manual negative controls, independent review and conditional release. No schema/migrations/trigger, broad auth/staff refactor, new feature, dependency advisory or Slice13. Preserve unrelated dirty files. Premaintenance `bc4ecf1` stays separate.

Required final commands from repository root: `npm run test:feature`, `npm run test:components`, `npm run test:integration:onboarding`, `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run typecheck`, `npm run build`, built-client secret scan and `git diff --check`. Before broad gates, three subprocess cases must pass from repo/workspace/unrelated cwd, and deterministic PostgreSQL schedules must prove actual blocking/winner ordering plus exact nonempty SRS/history preservation. Manual mutations A–E and new-Lesson parent-lock removal must be behaviorally KILLED with exact source restoration.

No registration email, provider/curriculum/identity/data write or deployment has been performed in this repair task. The current public aliases still serve the accepted baseline; origin/main remains `b9901d9`. Local gates + concurrency proof + final independent review + exact deployment READY must all precede real registration. Eventual DEV acceptance must conclude with session/credential cleanup, exact fixture restoration and read-only reconciliation with unexpected residue0. Generated artifacts/credentials/session state are excluded from source commits; concise durable verification docs may record results.

## Codex review and direct fixes before full gate

Root independently verified the three previously failing guard tests from repo/workspace/unrelated cwd:3/3 in each. Worker PostgreSQL22 unique cases pass after removing one exact duplicate rollback case (worker reported23 including that duplicate). All five learning operations have both actual overlapping lock-winner schedules.

Codex found the publication test's concurrent branch used a raw Lesson lock while the actual publishReview call ran afterwards. Replaced it with actual concurrent publishReview, asserted old active Revision held during selector commit, and asserted the subsequent DEFAULT locks the exact replacement Revision. Strengthened new-Lesson admission test to hold selector AFTER its entire selection set is captured, and assert writer-first PLANNED/null-revision child enters the later held set. Captured expected rejected learning outcomes immediately to avoid late unhandled rejection races. Removed unnecessary empty immutable-history DELETE setup from fresh SRS fixture. No distinct regression or guard was removed.

Manual controls A–F independently executed against owned all-migrations PostgreSQL; each baseline and restored target passes, each mutant exits1 for its intended behavioral assertion, all touched source bytes restored. A caches Level before locks (wrong selected ID); B caches publication before Lesson lock (withdrawn lower Lesson chosen); C removes PAUSED guard (waiting Reading start fulfills); D injects SRS stage/due reset (exact snapshot differs); E old cwd-dependent import (child misses intended guard); F removes createLesson Course lock (new-child writer commits before required blocker). Raw logs and JSON are local ignored artifacts under `/tmp/lingora-s12-repair-control-*` and `tmp/slice12-repair/controls.json`.

## Fresh final gates — 2026-11-02

The runtime restarted before prior gate exits/review could be recovered. Codex reran the complete gates on the restored final source; these fresh results supersede unavailable `/tmp` logs. No source change followed them; sequential negative controls restored exact original bytes.

| Check from repository root | Result |
| --- | --- |
| `npm run test:feature` | 603/603 (Admin413 + Learner190) |
| `npm run test:components` | 168/168 |
| `npm run test:integration:onboarding` | 34/34 (bootstrap12 + context22 unique) |
| `npm run test:integration:lessons` | 7/7 |
| `npm run test:integration:practice` | 13/13 |
| `npm run typecheck` | Both applications exit0 |
| `npm run build` | Both applications exit0 |
| Built client secret/private-import/answer-contract scan | 42 files; zero matches |
| Three subprocess guards from repo/workspace/unrelated temporary cwd | 3/3 each; nine executions |
| Manual negative controls A–F | Six KILLED; baseline/restored targets pass; exact byte restoration |
| `git diff --check`, staged artifact/actual-credential/inbox scan | PASS; zero matches |

No skipped/cancelled tests. PostgreSQL total54/54 uses all six unchanged migrations and existing guards. Actual publication and createLesson run concurrently with DEFAULT; same-Course unrelated learners remain parallel. Pause matrix proves both actual lock-winner orderings for Reading start/complete and Practice start/response/finalize. Nonempty stage3 SRS card, microsecond due/last-review values, review operations and every saved history row remain exactly equal before Pause, while blocked and after Resume.

Fresh raw logs are ignored local artifacts `tmp/slice12-repair/final-*.log` and `control-{A..F}-{baseline,mutant,restored}.log`; controls metadata is `tmp/slice12-repair/controls.json`. The one-off mutation runner is not committed. Source/tests and concise specifications/review records are the release material; no credentials, storage state, screenshots or generated raw reports are staged.

Final independent Sol 6.1 High review: **PASS**, no material findings; see [durable review](evidence/slice-12-repair/final-review.md). Codex checked the complete staged scope, actual secret values and supplied inbox; zero secret/artifact matches. This permits the authorized exact-source release, while final repair PASS still requires READY and live reconciliation. Slice12 is not yet ACCEPTED.
