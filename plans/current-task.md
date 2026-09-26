# Milestone M2.2: Behavior / Use Cases / Activity / State Machine Modeling (Acceptance)

## Status

`DONE` — `M2.2 ACCEPTED FOR M2.3` (Independent Re-Review verdict: `PASS WITH NON-BLOCKING ISSUES`; final P2 cleanup N-01..N-04 verified CLOSED by targeted acceptance verification; D-G4 = PASS; D-G7 = PASS; zero runtime/schema changes; `DESIGN COMPLETE: NOT CLAIMED`; `COMMIT: NOT CREATED`)

## Next Milestone State

```text
M2.3 PLAN: NOT STARTED
```

M2.3 (Sequence + API / Service Boundary) must remain planning/not-started until a separate human-approved M2.3 plan exists. Do not begin M2.3 implementation in this task.

## Entry Condition

- `M2.1 ACCEPTED FOR M2.2` (Gates D-G1 & D-G2 PASS; Independent Re-Review verified)
- D1–D4 baselines FROZEN & ACCEPTED

## Objective

Implement the complete authoritative behavior layer for Lingora according to approved plan `plans/m2-2-behavior-uc-activity-state-plan.md`, covering:
1. Master behavior specification `docs/phase-1-m2-2-behavior-uc-activity-state.md` (Artifacts #2, #3, #9, #10, #17, #18, #19 following the 6-field contract).
2. Canonical 15 Use Cases (`UC-01` through `UC-15`, with `UC-15` as optional/future extension).
3. 15 Activity behavioral families (`BF-01` through `BF-15`).
4. State-machine specifications (Content lifecycle, Learning progression 3-state, KnowledgeGap 3-state, ConceptMastery 3-state, AssessmentResult immutable evidence lifecycle).
5. Progression, Placement (Mapping A), Jump (scopes 20q/25-30q/40q, >=95%, 24h cooldown, `SKIPPED_BY_JUMP`/`UNLOCKED_BY_JUMP`, zero `COMPLETED_BY_JUMP`), Controlled Retry (`allowance = max(1, floor(N*0.10))`, 70% credit, no 80% floor), SRS (`[1,3,7,14,30]`, streak reset to 1), and screen-flow inventory.
6. Behavioral closure for DD-01, DD-02, DD-04, DD-05, DD-06 (semantics only).
7. Traceability update in `docs/05-traceability-matrix.md` (§8).
8. Architecture cross-reference in `docs/01-architecture.md` (§3.6).
9. Validation gates D-G4 and D-G7 evidence records.
10. PlantUML diagrams under `docs/plantuml/`.

## Category Tag

`category: scope-ambiguity`

## Constraints & Scope Firewall

- Zero runtime application code (`lingora-web`, `lingora-admin`, `lingora-ai`).
- Zero database schema or migration changes.
- Zero algorithm implementations (scoring, recommendation, mastery, readiness).
- Zero changes to D1/D2/D3/D4 source artifacts.
- Zero modifications to M2.1 source artifacts.
- Zero ghost entities (`Exam`, `QuestionBank`, `AssessmentSession`).
- No `UC-16/17/18`, no `UC-06-viết`, no `COMPLETED_BY_JUMP`.
- Self-reported entry strictly separated from diagnostic entry (no AssessmentResult, no SkillProfile, no verifiedProficiency).
- `AssessmentResult` modeled strictly as immutable evidence upon completion, never as a mutable business state machine. Retake creates new result.
- All open decisions from D3 §N / D4 §Q preserved as `OPEN / CONFIGURABLE / PENDING VALIDATION`.
- `COMMIT: NOT CREATED`.

## Acceptance Record (Authorized)

- **Milestone:** `M2.2 — Behavior / UC / Activity / State`
- **Decision:** `ACCEPTED FOR M2.3` (acceptance milestone only; not Design Complete; not M2.3 Ready; not product implementation complete; not runtime readiness).
- **Evidence:** 15 canonical UCs (`UC-01..UC-15`, UC-15 extension, zero `UC-16/17/18`, zero `UC-06-viết`); 15 canonical BFs (`BF-01..BF-15`, zero `BF-16`, `BF-14` = GEC with no fabricated UC); 6 canonical human roles with SoD (Manager publishes, Moderator approves only, Admin emergency `APPROVED → PUBLISHED` + reason + AuditLog); canonical state machines (lifecycle with `CHANGES_REQUESTED`; progression/readiness trio; gap trio; mastery trio; immutable AssessmentResult, retake = new result); locked policies (Mapping A bands, Skip → U1, Jump 20/25–30/40 + ≥95% + 24h + provenance, retry allowance + 70% + no 80% floor, SRS `[1,3,7,14,30]` deterministic + AI non-owner, streak miss → 1 + local timezone, no freeze/power-up); self-report vs diagnostic separation; screen inventory 14+11 consistent prose↔diagram; traceability chain to M2.2 Behavior; D-G4 = PASS; D-G7 = PASS; prior 31 findings + final N-01..N-04 verified resolved by targeted acceptance verification (read-only artifact reads + keyword scans).
- **Boundary:** Implementation remains out of scope (zero runtime/schema/API/UI/security work; D3/D4/M2.1 unmodified).
- **Next milestone:** `M2.3 Sequence + API / Service Boundary` — `PLAN: NOT STARTED`. Do not start M2.3 in this task.
- **History preserved:** FAIL review, PASS WITH NON-BLOCKING ISSUES re-review, and P2 cleanup evidence retained (not deleted).
