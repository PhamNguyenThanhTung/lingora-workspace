# Supporting Plan

SRS Integration — Project 1 + ML boundary

## Status

REVIEW

This is a supporting future plan, not the active task. It cannot authorize implementation until it is promoted to `plans/current-task.md`, reviewed, and explicitly approved by a human.

## Objective

Complete the approved Lingora smart-review flow without mixing Project 1 persistence/integration ownership with ML model ownership.

## Canonical Scope

- Project 1 owns Android review UX, Supabase reads, fallback orchestration, `record_review` persistence and failure handling.
- ML owns DKT-LSTM, HLR, Scheduler, training, evaluation, acceptance and model selection.
- `/v1/srs/schedule` remains the canonical AI contract.
- `UserVocabSrs.nextReviewAt` is due state, not Notification/Reminder delivery.
- Vocabulary search/favorites/pronunciation scoring/extra mastery state, scored LISTENING, separate Quiz/Attempt persistence and notifications are outside this plan.

## Dependencies

1. M1.3 Auth/RLS/owner-checked `record_review` completed.
2. M1.4 deterministic language/course/lesson/vocabulary/SRS seed completed.
3. M1.5 FastAPI foundation and deterministic SRS mock completed.
4. M1.6 Android foundation, Auth session and Android-to-mock connectivity completed.

No SRS integration implementation may start merely because one dependency is complete.

## Proposed Gated Work

### SRS-I1 — Due-card fallback

- Review and approve the `get_due_srs_cards` contract, identity derivation, ownership rules, result ordering and limit bounds.
- Implement only after a separate approval; do not trust a caller-supplied user ID.
- Verify the fallback remains usable when the AI endpoint times out or returns `MODEL_UNAVAILABLE`.

### SRS-I2 — Android smart-review orchestration

- Load owned due cards/history through approved Supabase policies/RPCs.
- Call `/v1/srs/schedule` with the canonical request.
- Enforce the documented 8-second timeout and deterministic fallback.
- Display priority and recommended interval without presenting Scheduler output as direct DKT output.
- Submit completed reviews only through owner-checked `record_review`.

### SRS-I3 — Mock end-to-end evidence

- Complete Android → Supabase → deterministic mock FastAPI → `record_review` flow.
- Test success, AI timeout, model unavailable, unauthorized card, duplicate/retry behavior approved by M1.3, and recoverable UI states.

### SRS-I4 — Real model integration

- Integrate only a model version that passes the approved ML acceptance criteria.
- HLR remains baseline/production fallback; DKT-LSTM remains the research model.
- Preserve `model_version`, `scheduler_version`, and inference-scoped `is_mock` contract semantics.
- Do not change Project 1 persistence schema merely to store optional model metadata.

## Requirement Mapping

| Requirement | Responsibility |
|---|---|
| `P1-FR-005` | Android smart review, timeout and due-card fallback. |
| `P1-FR-006` | Atomic owner-checked review persistence supplied by completed M1.3. |
| `P1-FR-011` | Recorded vocabulary review qualifies for approved streak behavior. |
| `P1-NFR-002` | Core flow remains usable during AI failure. |
| `P1-NFR-003` | Contract metadata and snake_case compatibility. |
| `ML-FR-001..004`, `ML-NFR-001` | Model/Scheduler/evaluation ownership; not implemented by the Project 1 integration task. |

## Proposed Tests

- `SRS-I-T-001`: owned due cards are returned in approved order; cross-user access is denied.
- `SRS-I-T-002`: schedule success renders priority/interval and preserves model/Scheduler distinction.
- `SRS-I-T-003`: timeout within the approved boundary selects fallback without crash or indefinite loading.
- `SRS-I-T-004`: valid review creates one ReviewLog and updates one card atomically.
- `SRS-I-T-005`: non-owned/missing card produces zero writes.
- `SRS-I-T-006`: deterministic mock produces stable results for the same approved input.
- `SRS-I-T-007`: accepted real model and fallback versions expose required metadata.
- `SRS-I-T-008`: no Notification/Reminder, extra exercise, Quiz/Attempt or unapproved vocabulary feature is introduced.

## Decisions Required Before Promotion

1. M1.3 must finalize `record_review` signature, concurrency/retry and streak behavior.
2. `get_due_srs_cards` request/response and whether it is an RPC or approved query must be reviewed.
3. History window/ordering sent to FastAPI must match the canonical API contract.
4. The exact milestone/task that promotes this supporting plan must be human-approved.

## Approved Retry Limitation / Backlog

- M1.3 serializes `record_review` updates with a row lock but does not provide end-to-end idempotency.
- Android must not automatically retry after an ambiguous timeout; it may retry only after a clearly confirmed failure showing that the transaction did not commit.
- Idempotency token/schema design is backlog work for M1.4+ and requires a separate approved schema/API decision.

## Out of Scope

- Auth/RLS/Storage implementation.
- Seed implementation.
- FastAPI foundation creation.
- Android project creation.
- Model training/evaluation inside Project 1 work.
- Notification/Reminder.
- Scored LISTENING, grammar curriculum, separate Quiz/Attempt or extra vocabulary subfeatures.
- Canonical semantic changes, dependencies, database writes or commits during REVIEW.

## Approval

Status: REVIEW
Approved by: —
Date: —
