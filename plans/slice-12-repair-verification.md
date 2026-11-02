# Slice 12 Blocker Repair verification

Status: **SLICE 12 REPAIR: PASS. Slice12 remains NOT ACCEPTED: real activation/onboarding acceptance is operationally blocked by email rate limiting.** New owner-authorized [repair spec](2026-11-01-slice-12-blocker-repair.md) supersedes the prior task's STOP for this bounded repair only; [historical failed verification](slice-12-verification.md) remains unchanged.

Codex confirmed the two DEFAULT lock/read mismatches and independently reran the three guard cases from learner workspace cwd:0/3 before repair (`/tmp/lingora-s12-repair-subprocess-red.log`). Senior Sol High planning confirmed a single narrow parent-writer dependency: actual Lesson creation must lock Course before insertion so Course SHARE can protect the complete selection set. No other supported Unit/Lesson insertion path bypasses this protocol.

One Anti package owns minimal production repair + regressions; Codex owns actual source review/direct remaining fixes, final gates, manual negative controls, independent review and conditional release. No schema/migrations/trigger, broad auth/staff refactor, new feature, dependency advisory or Slice13. Preserve unrelated dirty files. Premaintenance `bc4ecf1` stays separate.

Required final commands from repository root: `npm run test:feature`, `npm run test:components`, `npm run test:integration:onboarding`, `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run typecheck`, `npm run build`, built-client secret scan and `git diff --check`. Before broad gates, three subprocess cases must pass from repo/workspace/unrelated cwd, and deterministic PostgreSQL schedules must prove actual blocking/winner ordering plus exact nonempty SRS/history preservation. Manual mutations A–E and new-Lesson parent-lock removal must be behaviorally KILLED with exact source restoration.

Before the local gates, no registration email, provider/data write or deployment was performed; public aliases and origin/main remained at `b9901d9`. Local gates + concurrency proof + final independent review + exact deployment READY must all precede real registration. Eventual DEV acceptance must conclude with session/credential cleanup, exact fixture restoration and read-only reconciliation with unexpected residue0. Generated artifacts/credentials/session state are excluded from source commits; concise durable verification docs may record results.

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

Final independent Sol 6.1 High review: **PASS**, no material findings; see [durable review](evidence/slice-12-repair/final-review.md). Codex checked the complete staged scope, actual secret values and supplied inbox; zero secret/artifact matches. This opened the authorized exact-source release gate. READY and final read-only reconciliation results follow below; Slice12 acceptance is separate.

## Exact-source release and public prechecks

Source commit `bd88903bbc6cd39c4c90fcaed154891f774b04fb` pushed to `origin/main` after all local/review gates. Separate maintenance `bc4ecf1` is unchanged. Learner deployment `dpl_55RMtXoSHfGWtFgpndxaFZwMqihm` and Staff deployment `dpl_H3YjV4xE8BjHqWdQVDJquHW3Lvtx` both report READY for that exact SHA, with the canonical aliases assigned. No schema/migration applied.

Public prechecks PASS: registration/login rendering200; anonymous context/options401; registration cross-origin403, non-JSON415 and invalid body400 before provider use; missing-token confirmation safely303 to login; Staff login200. Combined scan42 local +23 public files has zero credential/private-import/learner-answer matches. Raw metadata remains ignored.

Real product registration has now been exercised after READY. The first link was already provider-confirmed about21seconds before the agent's first navigation (read-only timestamp comparison); its callback therefore could not be accepted. No Account/history was created. Scoped Auth-only cleanup and final read-only reconciliation PASS with sessions0/unexpected residue0. The second link was also already consumed when opened by the test browser: provider303 carried otp_expired and no authorization code, then the application safely returned to login. No successful callback is claimed. Both Auth-only test identities were removed with scoped cleanup and read-only sessions0/residue0 reconciliation. No operator-created Account/context or auto-confirm substitute was used.


## Final operational boundary and cleanup

A fresh product-registration attempt was refused; one diagnostic UI retry captured exact HTTP429 / RATE_LIMITED. No further email attempts were made. The browser helper now retains only sanitized status/error/navigation diagnostics locally; no production source change was made after reviewed commit `bd88903`.

Final read-only reconciliation on2026-11-02: supplied test inbox has0 Auth identities,0 application Accounts/contexts/learning history/SRS cards/sessions. All other Accounts and the complete retained Course/Lesson runtime baseline match the before-registration snapshot. No curriculum setup, Practice or Pause mutation was reached on DEV. No bootstrap audit was created. Both earlier owned Auth identities were deleted; all browsers closed; temporary passwords, storage state and confirmation-link files removed. **Unexpected residue0.** Raw safe reconciliation and request diagnostics remain ignored local artifacts; no credentials or generated test artifacts are committed.

Repair scope is accepted: both DEFAULT races, three subprocess failures, true Pause concurrency and exact nonempty SRS preservation are fixed/proved, all local/review gates pass, exact source is pushed and both projects READY, cleanup is reconciled. `SLICE 12 REPAIR: PASS`.

`SLICE 12: NOT ACCEPTED` — missing real successful callback → normal password-login bootstrap → product context → first Lesson/Practice → public Pause/Resume. Provider confirmation alone and local mocks do not replace this evidence. Next step after provider email quota permits: one fresh product registration, provide only the token value (not a clickable URL), open the actual email URL in its original signup session, finish the existing public journey, then scoped cleanup/read-only reconciliation. No production code fix or broader auth/SMTP redesign is inferred from a pre-consumed link or rate limit. No Slice13 or dependency advisory work began.

The follow-up status commit changes documentation only; the reviewed/tested/deployed application source remains `bd88903`. Historical failed verification stays intact. Maintenance `bc4ecf1` remains separate, and unrelated workspace changes are preserved.
