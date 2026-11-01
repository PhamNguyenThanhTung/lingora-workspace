# Slice 11 — public DEV acceptance

Date: 2026-11-01 (Asia/Saigon)

## Deployment gate

Before live writes, both Vercel projects were READY on source commit `4ddc09c96b7f0455692eb5b76e515d1b8b9a5ab4` and their stable DEV aliases were verified against those deployments. The learner deployment was `dpl_HpZNkZgehSYkPGjASsvjGVhfemwT`; staff was `dpl_3Q3gtCxkwGfvsbVt2mNmwu8M7mM7`.

## Public flow

Four real fixture logins passed. The learner opened the exact published Lesson, verified the safe DTO, exercised independent reading state, started and resumed the exact attempt, graded MCQ/FILL_BLANK/REORDER/LISTENING/GRAMMAR, finalized through the public UI, and verified the graded progression gate.

An initial operator synchronization timed out after seven responses were committed. Its cleanup completed. The retry resumed that same owned X attempt and those immutable responses without changing application source or rerunning local acceptance. The successful run also forced a response acknowledgment loss after the server committed; the UI retained the exact command/input and replayed it without duplicating evidence. This was an operator wait issue followed by verified recovery, not a product defect.

Published X was `68b61be9-ba8a-49cb-b639-f11143dc579e`; successor Y was `72f05567-87cc-4c4e-b335-e1a363975fdd`. X's first attempt completed with N=5, K=3, 6/16 contribution units (38%). It remained a genuine completion despite the low score, created the single logical completion, and atomically enrolled one new core card at stage1 due the next day. A new stale redo finalize and a new learner-B response against X returned409 after Y publication. An exact committed response replay returned its original outcome; an already committed X finalize replayed without regrading. Y's new attempt scored10/10, did not replace X's logical completion, and left the existing card byte-equivalent. Consumption READ alone did not create completion or unlock the second Lesson; graded completion did. No Assessment, Level, or SRS review evidence was created.

All24 public checks passed. The run artifact records each check and safe metadata in [retry evidence](public/DEV_S11_1793532144359_retry_1793532900496.json). The prior operator-timeout evidence is preserved in [initial run evidence](public/DEV_S11_1793532144359.json).

## Read-only DEV reconciliation and cleanup

The final database query ran in a transaction explicitly marked `READ ONLY` and verified exact ownership, revision/item pins, response rows, grading facts, completion pointer, receipts, vocabulary card, Teacher/Admin review actors, lifecycle audit history, and no Level/Assessment/review writes. Counts:4 attempts,19 responses,2 finalized attempts,1 first completion pinned to X,2 completion receipts,1 core card,15 exercise/item revisions,15 grading-secret identities (identifiers only),10 revision review events, and4 supported Teacher enable/disable audit events. Full safe row identities are in [read-only evidence](public/final-cleanup-readonly.json); private answer material is not included.

Runtime state was restored: both staff actors and both learners are DISABLED, both contexts PAUSED, Course inactive, Lessons PLANNED, no LessonConsumption rows, auth session count0, browser closed, and unexpected residue0. Exact immutable attempts/responses, content revisions and review history, completion receipts/card, and FK ancestors remain as the allowlisted acceptance history. The original unrelated Teacher fixture remained DISABLED and unchanged.

## Client scan

The scan covered40 local static files and19 files fetched from the learner and staff public origins. It found0 secret matches,0 private server import matches, and0 learner answer-contract matches. See [scan evidence](../client-secret-scan.json).

## Result

`SLICE 11: PASS`

`SLICE 11 ACCEPTED`

No Slice 12 was started.
