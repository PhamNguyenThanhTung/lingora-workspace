# Slice 11 — final verification

Status: **PASS / ACCEPTED** (2026-11-01, Asia/Saigon). Historical FAIL checkpoint for D1–D3 was resolved by explicit user approval on 2026-11-01. No schema migration was needed or applied. No Slice 12 work started.

Baseline: `b86ddc652310c37373c4ce921e38e39cba4c3562`. [Spec and decision proposals](2026-11-01-slice-11-practice-attempt-grading.md); [senior planning evidence](evidence/slice-11/senior-plan.md).

Completed: actual schema/canonical/runtime inspection; one read-only Sol 6.1 High planning pass (CLI header confirms exact model/effort, exit 0); scoped DEV read-only catalog query with six migrations, relevant constraints/indexes/trigger bodies captured in [schema-read-only.json](evidence/slice-11/schema-read-only.json). No migration necessary from findings so far. Confirmed the staff successor-copy attempt guard needs a narrow eventual repair.

Approved decisions: D1 NFC → trim → optional `toLowerCase()` exact comparison; D2 atomic core enrollment, new stage1/due+1 day with existing cards unchanged; D3 stale new response/finalize409 including redo, authorized committed replay retained. See final spec for exact boundaries.

Initial state before dispatch: no implementation/source change, tests/build/mutations, deployment, live acceptance or DEV/provider writes for Slice 11. No browser/auth session created. Existing fixture baseline and four unrelated workspace changes remained untouched. The unrelated changes remain outside the Slice 11 commits.

## Local acceptance — PASS

Anti initial implementation delivered. Independent Sol6.1High review found7 actionable defects and boundary/race test gaps; Codex fixed them directly, with [review/fix details](evidence/slice-11/codex-review-fixes.md). No second Anti round.

- Root feature542/542, components/pages152/152, typecheck and both production builds PASS.
- Actual production-service Practice PostgreSQL13/13 (all six applied migrations/guards on owned loopback DB); accepted Slice10 integration7/7 PASS.
- All20 semantic mutation variants KILLED, including A–I and additional command identity/locks/clock/ordering/error/DB-guard controls. Source restored byte-exact; local mutant databases discarded. C-submit's initial mutant left a separate candidate-owner check intact; the final vulnerable variant bypassed both query/owner layers. Assertions were retained.
- Client scan:40 local static files, no server credential/import or learner answer-contract matches. Staff authoring payload property names are expected and not treated as learner disclosure.
- `git diff --check` PASS. No schema/migration change. Exact source commit was pushed and both learner/staff deployments were verified READY before public writes.

[Local summary](evidence/slice-11/local-acceptance.json), [mutation results](evidence/slice-11/mutations.json) and [driver source](evidence/slice-11/mutation-runner.mjs). Full command logs remain in ignored `tmp/slice11/final-*.log`; DB gates require explicit owned loopback URLs and never fall back to real `.env`. Temporary test runner used embedded-postgres18.6; no product dependency was added.

## Public DEV acceptance — PASS

Source commit `4ddc09c96b7f0455692eb5b76e515d1b8b9a5ab4` was verified READY on both Vercel projects before live writes, with the stable learner and staff aliases bound to those deployments. The public run exercised four real fixture logins and passed all24 checks. An initial operator wait timed out after seven real responses had committed; fixture cleanup completed, then the same owned immutable attempt and responses were resumed. The timeout was an operator synchronization issue, not an application failure. The successful retry also proves recovery after an actual lost response acknowledgment and exact request replay.

Published revision X was `68b61be9-ba8a-49cb-b639-f11143dc579e`; successor Y was `72f05567-87cc-4c4e-b335-e1a363975fdd`. X attempt `2cfc2245-1f1c-4379-8c2c-4c63641e641e` completed at N=5/K=3, 6/16 contribution units (38%), and created the only logical Lesson completion plus one stage-1 core card. Stale unfinished X redo finalization and a new response against X returned409 after Y publication; committed response/finalize retries replayed their original outcomes. Y attempt `2f6fb6b9-ddca-4cf7-99e8-538af228f234` scored10/10, retained the X completion, and did not rewrite the existing card. Consumption READ alone never created graded completion or unlocked the next Lesson; the graded X completion did. No Level, Assessment, or SRS review evidence was written.

Read-only DEV reconciliation confirms4 attempts,19 responses,2 finalized attempts,1 first completion pinned to X,2 `COMPLETE_LESSON` receipts,1 unchanged core card,15 exact exercise/item revisions,15 private grading-secret identities (IDs only),10 review events with the assigned Teacher/Admin actors, and4 supported Teacher lifecycle audit events. The owned fixture was restored to runtime baseline: fixture staff and learners DISABLED, contexts PAUSED, Course inactive, Lessons PLANNED, reading rows0, auth sessions0, browser closed, unexpected residue0. Immutable attempt/revision/review/receipt/card history and required FK ancestors are explicitly allowlisted.

The production client scan covered40 local static files and19 public HTML/JavaScript files on learner and staff origins: secret matches0, server-private import matches0, learner answer-contract matches0. No token, password, cookie, or storage state is present in committed evidence.

See [public acceptance evidence](evidence/slice-11/public-acceptance.md), [retry run](evidence/slice-11/public/DEV_S11_1793532144359_retry_1793532900496.json), [read-only reconciliation](evidence/slice-11/public/final-cleanup-readonly.json), and [public client scan](evidence/slice-11/client-secret-scan.json).

`SLICE 11: PASS`

`SLICE 11 ACCEPTED`
