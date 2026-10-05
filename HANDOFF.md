# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current Operational State

- **Current Baseline:** `M2.6 ACCEPTED` (ADR-029; formal design handoff acceptance; checkpoint commit `4c8a7dbd48c8c1a90c8a3e194b267916700bad2b`).
- **Phase Transition:** System Design Phase (Phase 1) is formally accepted and closed. The project is at **Phase 2 Implementation Readiness / Planning**.
- **Execution Authority / Source of Truth:** `plans/master-implementation-and-report-plan.md` (Master Plan M3.1..M3.10) is the sole authoritative implementation roadmap.
- **Implementation Status:** `NOT STARTED`. Zero feature code, zero migrations, and zero RLS policies have been deployed for Phase 2. The existence of an approved Master Plan does NOT constitute completed runtime implementation.
- **Phase 2 Scope Boundary:** Strictly **NON-AI / Deterministic Software Engineering Core**. All AI/ML/GEC functions are retained only in canonical traceability/historical context and are excluded from Phase 2 implementation, testing, demo, and acceptance.
- **Design Invariants:** Product policies have been updated: Unlimited Retry for exercises (no partial credit tracking), Level-up Exam replaces conditional Jump, strict Unit sizing is enforced (all mandatory lessons must be APPROVED to publish), flexible Exercise sizing per lesson, and streamlined Admin "One-click Publish" (though still requiring strict unit completion) during MVP.
- **Learner UX Flow Closure:** Learner flow is confirmed and closed:
  $$\text{Open Lesson} \longrightarrow \text{Lesson Content Viewer} \longrightarrow \text{Start Exercises} \longrightarrow \text{Exercise Sequence} \longrightarrow \text{Lesson Result / Progress}$$
- **Worktree Invariant:** All dirty working tree changes preserved untouched; zero commits created without passing test/log gates.

---

## Pending Decisions & Implementation Entry Criteria

1. **Milestone M3.1 Entry Readiness:**
   - Physical representation choices for M3.1 must be resolved during M3.1 schema design:
     * Exercise Answer Security (`Learner payload != grading secret`).
     * Unit 4/4 Direct Access Denial enforcement mechanism.
     * Placement 30-item & Level-up Exam representation within Unified Exercise/Assessment model.
     * Server-side attempt/retry state representation for D7.
     * Exam result validation and passing threshold enforcement (80%).
     * Placement status semantic representation (`NOT_DECIDED`, `SKIPPED / UNVERIFIED`, `DIAGNOSTIC / VERIFIED`).
2. **AI Surface Isolation:**
   - Legacy AI route handlers in `lingora-web` (`/api/ai/chat`, `/api/ai/srs`) are retained compatibility surfaces and excluded from Phase 2 acceptance.

---

## Do NOT Do Next

- Do NOT alter frozen product policies (e.g. do not lower the Level-up Exam $\ge 80\%$ threshold or change Diagnostic 30 questions).
- Do NOT introduce AI runtime features or dynamic AI content generation into Phase 2.

---

## Suggested Next Step

**Milestone M3.1: Foundation (Database & Schema Migration Strategy)** is now unblocked.
Proceed with implementing the Prisma Schema and Monorepo setup.

---

## [HISTORICAL / SUPERSEDED CONTEXT] Prior Milestones & Design Evolution

> **Historical Context Note:** The items below record earlier milestones and design phases (Phase 0, M1, M2.1–M2.6) for audit and traceability. They do NOT override the current Phase 2 operational state above.

- `M2.6 ACCEPTANCE` (ADR-029): Formal Phase 1 Design-to-Implementation Handoff specification accepted (`docs/phase-1-m2-6-design-handoff.md`). Verified component ownership matrix, B1–B6 boundaries, error taxonomy.
- `M2.5 DESIGN VALIDATION` (ADR-028): Validation gates D-G1..D-G9 verified; 20-row six-field audit completed (`docs/phase-1-m2-5-design-validation.md`).
- `M2.4 ARCHITECTURE & SECURITY` (ADR-027): 19 canonical components, 5 zones, 6 security boundaries, 11 audit events established (`docs/phase-1-m2-4-architecture-security.md`).
- `M2.3 SEQUENCE & SERVICE BOUNDARY` (ADR-025): Sequence flows SEQ-01..SEQ-10 and framework-neutral API surface register defined (`docs/phase-1-m2-3-sequence-api-service-boundary.md`).
- `M2.2 BEHAVIOR & STATE MACHINES` (ADR-020): 15 Use Cases (`UC-01`..`UC-15`), 15 Behavioral Families (`BF-01`..`BF-15`), 6-state content lifecycle, and learner progression states locked (`docs/phase-1-m2-2-behavior-uc-activity-state.md`).
- `M2.1 DATA FOUNDATION & D1–D4`: Domain and logical data models, English A1 curriculum baseline (6 Units / 24 Lessons), unified exercise model established.
- `Phase 0 Reset & Rebuild` (ADR-014): Transitioned Lingora to SE Core + AI Supporting Capability; 6 canonical roles established; legacy research pipelines retired.
- `M1 Foundation`: Supabase Auth, initial Prisma schema, Storage buckets, and initial web shell implemented.
