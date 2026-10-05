# Task: Master Implementation, Test, Demo & Report Planning (Phase 2)

## Status

`READY FOR HUMAN REVIEW` (Master Plan Re-scoped to Pure SE Core; Implementation NOT STARTED)
- `TASK = master-implementation-and-report-plan`
- `PLAN STATUS = DRAFT / READY FOR HUMAN REVIEW`
- `HUMAN APPROVAL = PENDING`
- `IMPLEMENTATION = NOT STARTED`
- `AI IMPLEMENTATION = OUT OF PHASE 2 SCOPE`
- `PRIMARY DELIVERABLE = plans/master-implementation-and-report-plan.md`
- `COMMIT = NOT CREATED`

## Baseline Context

- `M2.5 CHECKPOINT = d09f7cc`
- `M2.6 FINAL RE-REVIEW = PASS`
- `M2.6 ACCEPTANCE = ACCEPTED (ADR-029)`
- `M2.6 CHECKPOINT = 4c8a7dbd48c8c1a90c8a3e194b267916700bad2b`
- `M2.6 Handoff Specification = docs/phase-1-m2-6-design-handoff.md`

## Active Scope

1. Creation of the single authoritative master plan: `plans/master-implementation-and-report-plan.md`.
2. Repository audit: CURRENT (what actually exists/runs), TARGET (M2.2–M2.6 design), GAP analysis.
3. Canonical design baseline reconfirmation: 6 roles, UC-01..15, BF-01..15, D1–D9, 19 components, B1–B6 boundaries, 5 zones, 11 audit events, SoD rules, invariants.
4. Target system decomposition across 19 canonical components into 9 functional domains.
5. Implementation order: dependency-driven milestone sequence (M3.1..M3.10).
6. Database implementation plan: 8-phase migration roadmap, DDL specs, UP/DOWN/ROLLBACK, data safety, backfill.
7. Auth, RBAC, RLS & SoD implementation plan (dual-presence model, negative denial tests).
8. Learner core engine implementation plan (closed-loop 9-step learner cycle).
9. Assessment & progression plan (Placement ~25–30 proposed, Mapping A 0–30, Skip, Retake).
10. Learning intelligence plan (Jump ≥95% 24h lockout, Controlled retry max(1, floor(N*0.10)) 70% credit, SRS Policy B [1,3,7,14,30], Daily streak local IANA timezone).
11. Content governance implementation plan (6-state lifecycle, Creator no self-approve, Moderator no publish, Manager publish, Admin emergency publish with justification + audit, Unit 4/4 published rule, Clone-to-Draft v2).
12. API & BFF implementation rules (read-only `docs/03-api-contract.md`, `[ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]` tags).
13. Test strategy & executable test specifications converting 18 M2.6 test frames.
14. Deterministic seed dataset specifications (6 roles, 7 learner personas, content states).
15. Continuous 4-act demo plan with screen and evidence register.
16. Academic report evidence matrix (5 columns).
17. Performance / NFR validation framework (TARGET vs MEASURED).
18. Gated milestone governance model (10 steps).
19. Alignment with 5-chapter academic report structure.
20. Gap and risk register (7 columns).
21. Master roadmap: M3.1 through M3.10.

## Category Tag

`category: runtime-boundary`

## Critical Boundaries & Scope Firewall

- **Planning Only:** Zero application code written or modified in `lingora-web`, `lingora-admin`, or `lingora-ai`.
- **Zero Schema / Migration Execution:** Absolutely NO SQL written or executed, NO DDL, NO migration scripts run, NO `schema.prisma` edits, NO RLS policy deployment.
- **Contract Immutability:** `docs/03-api-contract.md` remains 100% byte-identical and read-only.
- **Worktree Discipline:** All unrelated dirty worktree changes preserved untouched; nothing staged; no commit created.
- **Gating Invariant:** AI coding agents must never move task status to `APPROVED`. Explicit human approval required before implementation begins.
- **Runtime Status:** Target runtime remains strictly `NOT PRODUCTION READY / NOT DEPLOYED`.

## Approval Section (Human Partner Only)

```text
[ ] APPROVED by: _____________________  Date: _______________
Comments / Scope Amendments:
```
