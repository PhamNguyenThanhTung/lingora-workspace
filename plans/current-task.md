# Milestone M2.3: Sequence / API / Service Boundary Modeling — DONE (`M2.3 ACCEPTED FOR M2.4`)

## Status

`DONE — M2.3 ACCEPTED FOR M2.4` (acceptance recorded 2026-09-26: Re-Review `PASS WITH NON-BLOCKING ISSUES`, final P2 cleanup N-R1..N-R7 + F-WS-01 verified closed, 24/24 + 18/18 + 17/17 PASS, `git diff --check` clean, `03` byte-identical, zero runtime/schema scope; `M2.4 = NEXT MILESTONE / PLAN NOT STARTED`; `COMMIT: NOT CREATED`)

## Next Milestone State

```text
M2.4 = NEXT MILESTONE / PLAN NOT STARTED
```

M2.4 (Architecture + Security) requires a separate human-approved plan. No M2.4 work begins in this task.

## Entry Condition

- `M2.2 ACCEPTED FOR M2.3` (Independent Re-Review passed with non-blocking issues; final P2 cleanup N-01..N-04 closed; Gates D-G1, D-G2, D-G4, D-G7 PASS)
- `M2.3 PLAN APPROVED` (`plans/m2-3-sequence-api-service-boundary-plan.md`)
- D1–D4 & M2.1/M2.2 baselines FROZEN & ACCEPTED

## Objective

Implement the complete authoritative sequence, API, and service boundary layer for Lingora according to the approved plan `plans/m2-3-sequence-api-service-boundary-plan.md`, covering:
1. **Master Specification:** `docs/phase-1-m2-3-sequence-api-service-boundary.md` encompassing Artifacts #11, #12, #15, each exposing the roadmap-exact 6-field architectural contract.
2. **Artifact #11 (Sequence Diagrams / Sequence Set):** Grouped PlantUML sequence specifications for SEQ-01 through SEQ-10 mapping all 15 Use Cases (`UC-01`..`UC-15`) and 15 Behavioral Families (`BF-01`..`BF-15`), including alternate/error flows, timeout/fallback semantics, and authoritative persistence boundaries.
3. **Artifact #12 (API Contract / Service Boundary):** Service-facing request/response semantics, input/output ownership, auth context, error boundary taxonomy (codes reused from `docs/03-api-contract.md` or marked `OPEN / PENDING VALIDATION`), and API compatibility/gap register (`docs/03-api-contract.md` remains strictly READ-ONLY).
4. **Artifact #15 (Service Interaction / Boundary Model):** Service responsibilities, presentation/data/domain layer duties, dependency directions, authoritative state ownership matrix, AI stateless boundary (non-owner of progression/mastery/streak/completion), persistence boundaries, failure containment, and CURRENT / TARGET / FUTURE / COMPATIBILITY GAP classification.
5. **Data Ownership Matrix:** Explicit table establishing authoritative owners, AI role, and persistence boundaries across all learner states.
6. **Error / Failure Taxonomy & Conceptual Idempotency/Atomicity Matrix:** Classification of read, mutation, atomic mutation (`record_review`), and idempotent/replay-protected operations.
7. **Traceability:** Section 9 update in `docs/05-traceability-matrix.md` linking requirements, MVP, P1-FR, UC, BF, M2.2 behavior to M2.3 sequence and service boundaries.
8. **Architecture Cross-Reference:** Section 3.7 update in `docs/01-architecture.md`.
9. **Validation Gates:** Evidence records for D-G4 (Behavioral & Interaction Integrity), D-G5 (Boundary & Contract Consistency), and D-G6 Input Evidence (Security/Auth Boundary input to M2.4/M2.5; D-G6 closure not claimed).
10. **PlantUML Diagrams:** Authored under `docs/plantuml/`:
    - `sequence-auth-session-m23.puml` (SEQ-01)
    - `sequence-learner-onboarding-m23.puml` (SEQ-02)
    - `sequence-diagnostic-placement-m23.puml` (SEQ-03)
    - `sequence-conditional-jump-m23.puml` (SEQ-04)
    - `sequence-lesson-exercise-retry-m23.puml` (SEQ-05)
    - `sequence-srs-review-m23.puml` (SEQ-06)
    - `sequence-progress-streak-m23.puml` (SEQ-07)
    - `sequence-authoring-moderation-publish-m23.puml` (SEQ-08)
    - `sequence-admin-ops-m23.puml` (SEQ-09)
    - `sequence-gec-interaction-m23.puml` (SEQ-10)
    - `service-boundary-m23.puml`
    - `layer-responsibility-m23.puml`

## Category Tag

`category: runtime-boundary`

## Constraints & Scope Firewall

- Zero runtime application code (`lingora-web`, `lingora-admin`, `lingora-ai`).
- Zero database schema or migration changes (`schema.prisma`, `migrations/`).
- Zero RLS implementation, security middleware, or runtime security code.
- Zero AI model implementation or scoring algorithm code.
- Zero modifications to `docs/03-api-contract.md` (read-only context; gaps recorded in M2.3 spec).
- Zero changes to source artifacts of D1/D2/D3/D4, M2.1, or M2.2.
- Zero ghost entities (`Exam`, `QuestionBank`, `AssessmentSession`).
- No `UC-16/17/18`, no `BF-16`, no fabricated GEC UC.
- Self-reported entry produces 0 AssessmentResult, 0 SkillProfile, 0 verifiedProficiency.
- AI Server owns ZERO learner progression/mastery/proficiency/streak/completion.
- Jump remains strictly under `UC-04` / `BF-11`; Placement remains strictly under `UC-03` / `BF-08`.
- Content publishing owned by `Organizational Manager`; Admin emergency publish on `APPROVED` only.
- All 13 open decision groups preserved as `OPEN / CONFIGURABLE / PENDING VALIDATION`.
- `COMMIT: NOT CREATED`.
