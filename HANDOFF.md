# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current state

- Latest task: `m2-4-acceptance` (category: `runtime-boundary`) — DONE (`M2.4 ACCEPTED FOR M2.5`; `M2.5 = NEXT MILESTONE / PLAN NOT STARTED`; `COMMIT: NOT CREATED`).
  - Acceptance decision: `M2.4 ACCEPTED FOR M2.5` (ADR-027; acceptance milestone only — not Design Complete, not M2.5 Complete, no runtime implementation, not production-ready).
  - Acceptance evidence: Independent Review `PASS WITH NON-BLOCKING ISSUES` (0 P0/P1, 5 P2) + final P2 cleanup verified closed + `T-M24-ACCEPT-001` PASS (17/17, 18/18, 17/17, diff-check clean) + D-G5 design evidence PASS + D-G6 INPUT EVIDENCE ONLY; target runtime NOT PRODUCTION READY / NOT DEPLOYED; `03` byte-identical; open decisions preserved.
  - Master specification: `docs/phase-1-m2-4-architecture-security.md` (Sections 1–15, 6-field architectural contracts for Artifacts #13, #14, #16).
  - Artifact #13 (Component Architecture): 5-layer logical hierarchy, 19 logical components (`COMP-PRES-01/02`, `COMP-APP-01/02`, `COMP-DOM-01..08`, `COMP-INFRA-01..05`, `COMP-EXT-01/02`), strict top-down acyclic dependencies, rule/data ownership, stateless AI integration.
  - Artifact #14 (Deployment/Runtime Boundary): 5 logical security zones (Zone 1 Client, Zone 2 BFF/Vercel, Zone 3 Supabase DB/Storage, Zone 4 FastAPI AI, Zone 5 Privileged Ops), secret boundaries (zero service-role key in learner/client), `CURRENT_APPLIED` vs `TARGET_DESIGN` vs `FUTURE_EXTENSION`. Anti-drift rule: target runtime is NEVER claimed ready or deployed.
  - Artifact #16 (Security Responsibility Matrix): Single authoritative 6-boundary matrix across 15 sensitive operations (`OP-01`..`OP-15`). Application Authorization + Database RLS both present; app checks never replace RLS; privileged service role scoped strictly to maintenance/seed/migration (`N/A — privileged service-role path`). SoD negative denial paths (`403 SOD_VIOLATION_SELF_REVIEW`, `403 SOD_VIOLATION_MODERATOR_PUBLISH`).
  - DD-03 & DD-10: Handled in mandatory 3 tiers (Locked Behavior / Design Specification / Open Physical Representation). Physical tables, migration SQL, DDL, retention stay OPEN.
  - Visual Specifications: `docs/plantuml/component-architecture-m24.puml`, `docs/plantuml/deployment-boundary-m24.puml`, `docs/plantuml/security-matrix-m24.puml`.
  - Secondary Documentation: `docs/01-architecture.md` (§3.8), `docs/05-traceability-matrix.md` (§10).
  - Automated Verification: `scratch/verify_m24_design.py` (16/16 PASS), `verify_consistency_guards.py` (18/18 PASS), `verify_d4_design.py` (17/17 PASS), `git diff --check` (exit 0).
  - Governance: `ADR-026` in `logs/decision-log.md`, `T-M24-DESIGN-001` in `logs/test-log.md`, `logs/development-log.md`.
  - Invariants: Zero application runtime code, zero DB schema/migrations, zero RLS SQL written, `docs/03-api-contract.md` 100% byte-identical.
  - Next step: Human independent review of Milestone M2.4.

- Previous task: `m2-3-acceptance` (category: `runtime-boundary`) — DONE (`M2.3 ACCEPTED FOR M2.4`; `M2.4 = NEXT MILESTONE / PLAN NOT STARTED`; `COMMIT: NOT CREATED`).
  - Acceptance decision: `M2.3 ACCEPTED FOR M2.4` (ADR-025; acceptance milestone only — not Design Complete, not M2.4 Complete, no runtime implementation, not production-ready).
  - Acceptance evidence: Re-Review `PASS WITH NON-BLOCKING ISSUES` + final P2 cleanup N-R1..N-R7/F-WS-01 verified closed + `T-M23-ACCEPT-001` PASS (24/24, 18/18, 17/17, diff-check clean) + D-G4 PASS + D-G5 PASS + D-G6 INPUT EVIDENCE ONLY; `03` byte-identical; open decisions preserved.
  - Next milestone state: `M2.4 = NEXT MILESTONE / PLAN NOT STARTED` — M2.4 (Architecture + Security) requires a separate human-approved plan. Design-to-implementation boundary preserved.
  - Independent Re-Review Result: Re-review passed with `PASS WITH NON-BLOCKING ISSUES` (0 P0, 0 P1, 7 P2: N-R1..N-R7, F-WS-01).
  - Final Cleanup Completed: All 7 non-blocking findings (N-R1 through N-R7) and whitespace hygiene issue (F-WS-01) resolved strictly against canonical sources:
    - Master specification: `docs/phase-1-m2-3-sequence-api-service-boundary.md` (Sections 1–11, 6-field architectural contract preserved across Artifacts #11, #12, #15).
    - N-R1: Removed erroneous `[canonical]` marker from `isActive` on profiles; qualified `SUSPENDED` strictly as `[TARGET-CANDIDATE / OPEN DESIGN]`; completely unlinked `DD-01` from Profile state.
    - N-R2: Corrected `assignmentBrief` -> `DD-04` (Assignment Representation) and `supersedesId` -> `DD-02` (Revision Representation); corrected `reviewNotes` -> `DD-04`; eliminated all erroneous `DD-07` tags across all M2.3 design artifacts and `docs/05-traceability-matrix.md`.
    - N-R3: Audited error taxonomy strictly against `docs/03-api-contract.md`; classified exactly the 7 canonical codes from `03` as `CANONICAL_FROM_03` (`INVALID_INPUT`, `TEXT_TOO_LONG`, `LANG_NOT_SUPPORTED` [mapped to HTTP 422 per 03], `SCENARIO_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`, `MODEL_UNAVAILABLE`); classified all M2.3 design codes as `M2.3_DESIGN_ADDITION`; marked `request_id` as `[M2.3 DESIGN ADDITION / OPTIONAL]` telemetry.
    - N-R4: Removed all 5 occurrences of "public CDN" and "Supabase Storage CDN" across master spec and PlantUML diagrams (`sequence-lesson-exercise-retry-m23.puml`, `service-boundary-m23.puml`); direct RLS-mediated Supabase Storage paths maintained without premature CDN topology assumptions.
    - N-R5: Qualified entry pathway starting status as `IN_PROGRESS` (canonical M2.2) / `[PROVISIONAL / TARGET access status]`; annotated target unit unlocking in `sequence-conditional-jump-m23.puml` as `[PROVISIONAL / TARGET]`.
    - N-R6: Replaced hardcoded dummy literals for `latency_ms` and `is_mock` in SEQ-10 and `sequence-gec-interaction-m23.puml` with runtime-derived example values (`<runtime/config-derived boolean, e.g. false>`, `<runtime-measured integer, e.g. 120>`).
    - N-R7: Replaced Next.js bracket routes (`[id]`, `[exId]`) in Section 2 with framework-neutral URI templates (`{lessonId}`, `{exerciseId}`) annotated `[ILLUSTRATIVE / TARGET]`; sanitized Vietnamese headers containing "Mã lỗi Quy chuẩn"; qualified illustrative cookie names `sb-access-token` as `[ILLUSTRATIVE / TARGET]`.
    - F-WS-01: Stripped trailing whitespace in `logs/decision-log.md` (ADR-016 historical entries); verified `git diff --check` exits with 0 across entire repository.
  - Automated Verification: Expanded `scratch/verify_m23_design.py` to 24 deterministic checks (24/24 PASS); `verify_consistency_guards.py` (18/18 PASS); `verify_d4_design.py` (17/17 PASS); `git diff --check` (exit code 0).
  - Governance & Traceability: Recorded ADR-024 in `logs/decision-log.md` and `T-M23-CLEANUP-001` in `logs/test-log.md`; updated `logs/development-log.md`, `plans/current-task.md`, and `HANDOFF.md`.
  - Invariants Preserved: `docs/03-api-contract.md` 100% byte-identical; all 13 open decision groups preserved as `OPEN / CONFIGURABLE / PENDING VALIDATION`; zero runtime application code, zero DB schema/migrations, zero UI, zero commits created (`COMMIT: NOT CREATED`).
  - Next step: Human review and formal acceptance of Milestone M2.3.
  - History preserved: FAIL review, re-review, and P2 cleanup evidence retained in prior log/plan records (not deleted).
  - Independent Re-Review result: `PASS WITH NON-BLOCKING ISSUES` (0 × P0, 0 × P1, 4 × P2: N-01, N-02, N-03, N-04).
  - Milestone status: `M2.1 ACCEPTED FOR M2.2`, `M2.2 ACCEPTED FOR M2.3`, `M2.3 PLAN: NOT STARTED`.
  - Non-blocking P2 closures:
    - **N-01:** Corrected Skill Profile attribution to canonical `P1-FR-016` (displayed in `MVP-11` personal report); removed `P1-FR-017` from `UC-07` ownership while preserving its canonical status as Nice/P2 Achievements & Badges (`DEFERRED`).
    - **N-02:** Split combined `UC-14 / GEC` row in `docs/05-traceability-matrix.md` §8 into two distinct rows: `UC-14 → Support → BF-15` and `P1-FR-007 → GEC/Scenario → BF-14 → no fabricated UC`.
    - **N-03:** Replaced non-canonical wording in `docs/01-architecture.md` §3.6 and `HANDOFF.md` with explicit canonical deferred wording: `Streak Freeze and Recovery Power-Up are DEFERRED; no freeze behavior exists in Core`.
    - **N-04:** Removed unsupported `Rate Limit` wording from `docs/05-traceability-matrix.md:185`.
  - Resolution of Review Findings: 100% of findings corrected (16/16 P1, 15/15 P2 from initial review, 4/4 P2 from re-review).
  - Master specification: `docs/phase-1-m2-2-behavior-uc-activity-state.md` (Sections 1–16, 6-field contract preserved across Artifacts #2, #3, #9, #10, #17, #18, #19).
  - Canonical 15 Use Cases (`UC-01` to `UC-15`) and 15 Behavioral Families (`BF-01` to `BF-15`) aligned strictly with `docs/06-system-analysis.md` §5. `UC-15` explicitly categorized as `OPTIONAL / FUTURE EXTENSION BOUNDARY`. Zero `UC-16/17/18`, zero `BF-16`, zero `UC-06-viết`.
  - State machines: 6-state Content Lifecycle (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`; zero `REJECTED`; Clone-to-Draft v2 via `supersedesId`); 4-state Learner Progression (`LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP` with `by_jump=true`; zero `COMPLETED_BY_JUMP`); 3-state LevelReadiness (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`; zero `NOT_READY`, zero `EVALUATING`); 3-state KnowledgeGap (`OPEN`, `IN_REMEDIATION`, `RESOLVED`; zero `DETECTED`); 3-state ConceptMastery (`NOVICE`, `DEVELOPING`, `MASTERED`; zero `INTRODUCED`, zero `PRACTICING`).
  - Use Case & Behavioral Decoupling: Jump Assessment decoupled from UC-03 and placed under `UC-04` Curriculum Browse & Conditional Jump (`BF-11`); `UC-03` is strictly Placement Test / Diagnostic Assessment (`BF-08`).
  - Diagnostic Test Scope: Baseline is `~25–30 items, PROPOSED / PENDING VALIDATION`. Mapping A defines a 0–30 raw score range, not proof of 30 delivered items.
  - Actor Normalization: 6 canonical human roles only (`Learner`, `Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`). Content Publisher is `Organizational Manager` (`UC-10`); Administrator emergency publish permitted ONLY on already `APPROVED` content with mandatory reason + `AuditLog`. Zero "Content Manager".
  - Lesson Completion Semantics: Owned by `UC-05` / `BF-10` (all first-pass items and retry allowance processed; zero 80% retry floor). Invariant: Exercise correctness $\ne$ Lesson completion $\ne$ Mastery $\ne$ Proficiency.
  - SRS & Daily Streak: Policy B `[1, 3, 7, 14, 30]` days, failure resets interval strictly to Stage 1 (1 day), conceptual label `record_review` RPC; daily streak evaluated lazily across calendar date boundaries (`lastQualifyingActivityDate`); removed artificial 23:59:59 cutoff; Streak Freeze and Recovery Power-Up are DEFERRED; no freeze behavior exists in Core.
  - Logical Screen-Flow Inventory: Unified to 14 Learner screen flows (`SCR-L-01` to `SCR-L-14`) and 11 Authoring/Ops screen flows (`SCR-A-01` to `SCR-A-11`).
  - Full Expansion of Admin/Ops UCs: `UC-11`, `UC-12`, `UC-13`, `UC-14` fully detailed with all 10 required specification sections including Alternate and Exception flows.
  - PlantUML Diagrams: All 7 diagrams re-authored and statically verified (`start=1, end=1, trailing_ws=0`).
  - Supporting docs updated: `docs/01-architecture.md` (§3.6), `docs/05-traceability-matrix.md` (§8), `logs/decision-log.md` (ADR-020), `logs/test-log.md` (`T-M22-REMED-001`), `logs/development-log.md`.
  - Verification: `T-M22-REMED-001` PASS (18/18 consistency guards, 17/17 D4 checks, 7/7 PlantUML static syntax balance, `git diff --check` PASS, negative checks PASS).
  - Strict Boundary Invariants: Zero runtime application code, zero DB schema/migration changes, zero UI changes, zero git commits created (`COMMIT: NOT CREATED`).
  - Next step: Human-approved M2.3 plan (Sequence + API / Service Boundary) before any M2.3 work; M2.3 remains NOT STARTED.

- Previous task: `d1-final-design-cleanup-and-d2-domain-data-design` — DONE.
  - D1 (6/6 items) & D2 (16/16 items) completed; `T-D1-D2-DESIGN-001` PASS; ADR-015 recorded.

- Previous task: `design-re-review-batch-fixes-round-3` — DONE.
  - Resolved all 11 Round-3 batch fixes (Q13 recount, expert identities, NFR qualifiers, YC-CORE-01 trace, 4-tier chain, 5 exercise types, AssessmentType/DeliveryMode decoupling, LearningProgress ownership, jump/CEFR guards, N=35/3 labeling). Repository state: `READY FOR DESIGN RE-REVIEW`.

- Previous task: `language-expert-research-and-learning-design-update` — DONE.

- Previous task: `phase-0-user-research-analysis-and-requirements-authoring` — DONE. Completed comprehensive authoring of the 6 Core Report Sections in `docs/phase-0-user-research-analysis-and-requirements.md` (127,955 characters, 911 lines) adhering strictly to `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md` and academic integrity invariants.
  - **Academic Integrity Hard Constraints:** Banned Anti-Pattern 1 (zero foreign $N=500$ TOEIC survey data imported from external sample report `D:\PROJECTONE2_updated_with_conclusion_v2 (1).docx`) and Anti-Pattern 2 (zero falsification of simulated personas as surveyed people). Standardized on 4 canonical evidence labels (`PRIMARY`, `SECONDARY`, `SYNTHETIC`, `PRODUCT DECISION`).
  - **Section A (User Research & Empirical Learner Survey N=15):** 100% of 24 questions from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` ($N=15$) extracted and analyzed. Adapted sample report table layouts: Table 1.1 Khó khăn ($N=15$), Table 1.2 Kỹ năng ($N=15$), Table 1.3 Tính năng ($N=15$), Table 1.4 Tổng hợp 24 câu hỏi. Every percentage has explicit fraction $(k/15, \text{XX.X}\%)$. Grounded in S1 (Hwang 2024 attrition $\sim 43.16\%$), S4 (Cepeda 2006 Spacing Effect), S5 (Settles 2016 HLR).
  - **Section B (Application Survey & Benchmark):** Benchmarked Duolingo, Quizlet, and ELSA Speak across 17 comprehensive criteria with official URLs (accessed 2026-09-15). Formally rejected TOEIC test platforms per Invariant D4 (Unified Exercise model, zero Exam/QuestionBank). Formulated Adopt/Adapt/Reject decisions with architectural rationale.
  - **Section C (Qualitative Interviews & Triangulation):** Summarized qualitative interviews of 6 real learners ($P1$–$P6$) without hallucinated quotes (resolving Gap G1). Isolated 20 synthetic personas in Section 3.3 under explicit `[SYNTHETIC SCENARIO / DISCOVERY ONLY]` warning banner. Built 3-Way Triangulation Matrix.
  - **Section D (Pain Points & Root Cause Matrix):** 7-column matrix for 8 core pain points ($PP-01$ to $PP-08$) linking problems to 5-Why root causes, frozen product responses ($D1$–$D9$), and requirement traces.
  - **Section E (Canonical Roles & SoD Matrix):** Expanded 2 sample-report actors into 6 canonical roles (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`). Formulated SoD Matrix for 7 lifecycle actions enforcing 5 technical invariants (D1 planning, D2 no self-approval, D3 clone-to-draft, Moderator approve only, Admin emergency audit trail DD-03).
  - **Section F (Requirements Engineering):** 17 Functional Requirements (`P1-FR-001`..`017`) specified with 10 attributes, `Given-When-Then` Acceptance Criteria, and evidence sources. 11 NFR groups detailed with strict metric discipline (all unverified latencies tagged `TBD / PROPOSED TARGET`). Verified end-to-end traceability with zero orphan requirements.
  - **Verification (T-P0-REQ-001):** Passed all 6 Validation Gates (G1 Evidence, G2 Numbers, G3 Synthetic Isolation, G4 Sample Rejection, G5 NFR Rigor, G6 Traceability) via automated test script `scratch/verify_gates.py`.
  - **Strict Boundaries Preserved:** 0 application code, 0 schema/migration changes (`prisma/schema.prisma` untouched), M2.1 preserved (`REVISED — READY FOR TARGETED RE-REVIEW`), M2.2 NOT started.

- Previous task: `phase-1-m2-1-fix-after-independent-audit` — REVISED — READY FOR RE-REVIEW. Resolved all 7 findings (P0-01..P1-07) from the independent audit on Milestone M2.1 under `docs/phase-1-system-design-plan.md` under strict boundaries (0 code, 0 migrations, 0 DB writes, M2.2 NOT started).
  - **P0-01 (Administrator Emergency Authority Restored):** Restored Administrator Emergency Publish (`IN_REVIEW -> PUBLISHED`) and Emergency Archive (`PUBLISHED -> ARCHIVED`) as dashed red transitions (`#DC2626`) in `docs/plantuml/content-lifecycle-state.puml` and updated §5.1, §5.2, §5.3, §11.1. Mandatory justification and AuditLog required. Normal workflow (Manager publish) and prohibitions (Creator no self-approve/publish; Moderator no publish; no in-place edit) strictly preserved.
  - **P1-02 (ARCHIVED -> DRAFT Removed from Core):** Completely removed `ARCHIVED --> DRAFT` from Core state machine in `.puml` and Core transition matrix (§5.2); restoration relegated strictly to `[FUTURE / OPEN DESIGN]`.
  - **P1-03 (Eliminated TARGET_EXT / 2-Axis Model):** Decoupled Dimension A Scope (`CORE`, `EXTENSION`, `EXCLUDED`) from Dimension B Implementation Status (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`). Zero occurrences of composite `TARGET_EXT` in repo.
  - **P1-04 (ExerciseType Enum Field-Level Status):** Explicit value breakdown in §8.8: Applied DB (`MCQ`, `FILL_BLANK`, `REORDER`), Target Schema (`LISTENING`, `GRAMMAR`), and confirmed 0 occurrences of `MATCHING`.
  - **P1-05 & P1-06 (Re-evaluated Gates D-G1 & D-G2):** Re-evaluated Gate D-G1 (PASS) and Gate D-G2 (PASS) with explicit, verifiable evidence.
  - **P1-07 (Candidate / Open Design Normalization):** Harmonized all candidate fields (`supersedes_id`, `assignment_brief`, `starting_unit`, `placement_history`, `lesson_type`, `isAssessmentMode`) under `TARGET DESIGN CANDIDATE` or `OPEN DESIGN REPRESENTATION`.
  - **Static PlantUML Balance:** Verified syntax balance (`@startuml` / `@enduml`) across all 4 `.puml` files.
  - **Verification:** Recorded `T-M21-FIX-001` in `logs/test-log.md`.
  - **Strict Boundary:** Halted at M2.1 without starting M2.2+. Ready for independent re-review.


- Previous task: `phase-0-full-reset-and-rebuild` — DONE. Completed intentional Full Phase 0 Reset / Rebuild transitioning Lingora from `MIXED OLD/NEW M1 IMPLEMENTATION` to `CLEAN PHASE 0 FOUNDATION`.
  - **ADR-014 Recorded:** Formally established Software Engineering as CORE platform scope and AI as SUPPORTING CAPABILITY (GEC via pretrained model or external API, no local research pipeline). Historical ADR-010 preserved.
  - **Canonical Documentation Reset:** Synchronized `docs/00`–`docs/07`, `docs/QUICK-REF.md`, `README.md`, and `docs/README.md` to single source of truth: 6 canonical roles (`Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`), 19 MVP functions (`MVP-01`..`MVP-19`), 15 Use Cases (`UC-01`..`UC-15`), 6-state content review workflow (`Draft` → `In Review` → `Changes Requested` → `Approved` → `Published` → `Archived`), and 5 target languages (English A1 pilot first).
  - **Database Target Schema Redesign (`lingora-admin`):** Redesigned `prisma/schema.prisma` with Phase 0 Target Schema: 6 canonical roles enum, 6-state content lifecycle on `Course` and `Lesson` with audit timestamps and relations, `Unit` & `UnitTranslation` hierarchy, `AuditLog` entity. Purged obsolete ML chatbot models (`ChatSession`, `ChatMessage`). Validated cleanly with `npx prisma validate` and `prisma generate`. Preserved 100% of historical migrations for audit.
  - **Web UI Reset (`lingora-web`):** Purged obsolete business demo UI (`src/app/(learner)/foundation/`, `src/components/foundation/`, `src/features/ai/ai.repository.ts`, and associated tests). Preserved and verified reusable infrastructure: Next.js 15, TypeScript 5, Tailwind CSS, shadcn/ui generic primitives, Supabase SSR auth client/server, and i18n catalogs (`vi`/`en`). Implemented clean minimal application shell at `src/app/page.tsx` with user greeting, locale switching, sign-out, session status, and placeholder for M2 learning modules. Updated auth redirects to `/`.
  - **AI Service Boundary (`lingora-ai/api`):** Maintained stateless supporting AI service implementing `/health/*`, `/v1/model/info`, compatibility endpoints (`/v1/srs/schedule`, `/v1/chat/roleplay`), and target GEC specification (`/v1/gec/correct`). Verified 37/37 Pytest tests passing.
  - **Validation & Scans:** `lingora-web` (typecheck PASS, lint PASS, 14/14 unit tests PASS, Next.js production build PASS); `lingora-admin` (prisma validate & generate PASS); `lingora-ai/api` (37/37 Pytest PASS); zero broken references to deleted paths; `git diff --check` PASS.


- Previous task: `phase-0-repository-cleanup-and-superpowers-standardization` — DONE. Completed comprehensive repository cleanup and workflow standardization. Removed obsolete agent frameworks (Impeccable, old local skill trees: `source-driven-development`, `security-and-hardening`, `debugging-and-error-recovery`, `code-review-and-quality`) and broken hooks (`.codex/hooks.json`). Standardized the AI development workflow on 2 agents: **Codex** (Discovery, Architecture, Spec, Planning, Review, Verification, Acceptance) and **Antigravity** (Implementation, Coding, Testing, Fixing), unified under **Superpowers** (`obra/superpowers`) as the single shared methodology and skill set (14 skills installed in `.agents/skills/` and `.codex/skills/`). Cleaned obsolete research workspaces (`docs/ml/`, `docs/nlp/`, `lingora-ai/ml_srs/`, `lingora-ai/nlp_chatbot/`), unapproved/duplicate root plans (`plans/adr-004-amendment-full-scope.md`, `plans/srs-integration-plan.md`), and 36 superseded PlantUML diagrams from `docs/plantuml/` (retaining only 9 canonical Phase 0 MVP diagrams). Preserved `docs/report/diagrams/` for academic report traceability. Verified `lingora-web` (typecheck, lint, 19/19 Vitest tests, production build), `lingora-ai/api` (37/37 pytest tests), and `lingora-admin` (Prisma schema validate). Recorded database integration harness as `BLOCKED — environment/configuration issue`. All git diff checks and reference scans PASS.

- Latest task: `phase-0-diagram-note-elimination-and-vietnamese-arrow-localization` — DONE. Completely eliminated all yellow note boxes (`note ... end note`) across all PlantUML sources. Replaced harsh yellow background colors with soft neutral/pastel tones. Standardized Use Case overview diagram to canonical `UC-01` to `UC-11` naming without `MVP-XX` prefixes in bubbles. Translated all arrow labels, sequence messages, and activity action steps to natural Vietnamese, while retaining English for technical actor names and entities. Refined system architecture into a clean left-to-right hierarchy (`Learner/Staff` -> `Client Applications` -> `Application Services` -> `Backend Services (Supabase)`) with zero line tangles. Recompiled all diagrams (200 DPI), visually verified each rendered PNG, synchronized to `docs/report/diagrams/`, and rebuilt `Lingora-Project-1-Lecturer-Format-Final.docx`. All tests and `git diff --check` PASS.

- Latest task: `full-uc-ac-completion-and-diagram-aesthetic-polish` — DONE. Completed full 10 Use Cases (`UC-01` to `UC-10`) and 10 User Stories / Acceptance Criteria (`US-01` to `US-10`) across canonical documents and reports (`docs/report/lingora-project-1-lecturer-format.md` Section 1.8, `docs/06-system-analysis.md` Section 4.2, `docs/report/lingora-requirements-and-use-cases.md`). Restored and maintained full 45-diagram PlantUML suite (36 Software Engineering diagrams + 9 Phase 0 MVP diagrams). Optimized diagram aesthetics ("dễ nhìn"): fixed looping associations in `use-case-overview.puml` and `use-case-learner.puml`, aligned columns, enforced 200 DPI, Segoe UI typography, roundCorner 8, and soft academic pastel palette. All 45 diagrams pass syntax check (exit code 0). 45 PNGs generated and synchronized across `docs/plantuml/` and `docs/report/diagrams/`. Rebuilt final report Word document `docs/report/Lingora-Project-1-Lecturer-Format-Final.docx` successfully. Tests and git diff check PASS.

- Latest task: `phase-0-puml-reset-and-mvp-design-diagrams` — DONE. Replaced old 36 PlantUML sources with 9 MVP-aligned diagrams in `docs/plantuml/`. Fixed ERD and activity syntax/logic issues. All 9 diagrams compile with exit code 0 (`plantuml.jar`) and rendered to high-resolution PNGs in both `docs/plantuml/` and `docs/report/diagrams/`. Static checks and visual inspections PASS. Git history preserved.

- Latest task: `survey-charts-generation-and-slide-09-montage-embed` — DONE. Generated 5 high-resolution vector/PNG survey charts from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (N=15):
  1. `chart-survey-forgetting.png` (Tần suất quên từ vựng: 100% gặp vấn đề).
  2. `chart-survey-srs-rating.png` (Mức độ cần thiết của SRS SM-2: 80% đánh giá 4-5 sao, TB 4.13/5).
  3. `chart-survey-abandonment.png` (Tỷ lệ đứt gãy/bỏ học: 86.7% từng bỏ học vì nản).
  4. `chart-survey-grammar-needs.png` (Nhu cầu sửa lỗi & diff trực quan: 66.7%).
  5. `chart-survey-exercise-types.png` (Dạng bài tập điền từ/trắc nghiệm: 73.3%).
  6. `chart-survey-5-in-1-montage.png` (Tấm ghép toàn cảnh 5 biểu đồ độ nét cao).
  Inserted new Slide 9 into the presentation deck (expanding from 22 to 23 slides total). Embedded real diagrams and charts across all previously empty slots. Rendered all 23 slides to PNG and synchronized across `docs/project-1/` and `docs/report/`. Cleaned up temporary build directories and scratch files.

- Latest task: `full-suite-diagram-audit-and-supplementary-models` — DONE. Completed 36-diagram suite in `docs/report/diagrams/` by generating:
  1. `bfd-functional-decomposition.puml` (Sơ đồ phân rã chức năng BFD cân đối 2 nhánh 8 phân hệ).
  2. `class-diagram.puml` (Sơ đồ lớp nghiệp vụ Domain Class Diagram).
  3. `system-architecture.puml` (Sơ đồ kiến trúc 3 tầng Next.js + BFF + Supabase).
  4. `sitemap-ui-flow.puml` (Sơ đồ điều hướng màn hình & luồng giao diện người dùng).
  Removed all note boxes across all 36 diagrams. PlantUML compile validation (36/36 PASS), PNG rendering (36/36 PASS).

- Latest task: `project-1-software-engineering-documentation-cleanup` — DONE. Project 1 reports, final lecturer DOCX, three presentation decks and PlantUML sources were cleaned to a pure Software Engineering scope. Forbidden AI/ML/NLP/T5-small/GEC references and inaccessible survey-file citations were removed; trace labels were reduced to UC IDs; duplicate product analysis was removed; the lecturer report's Part III from 3.1 and Part IV conclusion are blank; DOCX table fills and heading colors were normalized. Terminology scan, slide render/overflow tests and `git diff --check` pass. DOCX visual rendering was unavailable because `soffice` is missing.
- ERD follow-up: removed `ChatSession` and `ChatMessage` entirely from `erd-baseline-and-proposed.puml` and synchronized reports/evidence to 15 active data models. Final DOCX rebuilt; stale-entity scan and DOCX extraction scan pass.
- Follow-up: removed `ChatScenario` and `ChatScenarioTranslation` as chat-domain entities; ERD/report baseline is now 13 active business models, with no chat terminology remaining in Project 1 reports or diagrams.
- Follow-up: added individual Use Case diagrams `use-case-uc01.puml` through `use-case-uc10.puml`; the PlantUML catalog now contains 32 diagrams, all compiled and rendered successfully.

- Latest task: `global-terminology-replacement` — DONE. Executed repository-wide global terminology replacement across all deliverables (`docs/report/`, `docs/plantuml/`, `.docx`, `.pptx`). Strictly removed all instances of `GEC`, `T5-small`, `T5`, `AI`, `ML`, `Machine Learning`, `NLP`, `Trí tuệ nhân tạo`, and `AI Service`. Replaced with standard Software Engineering terminology: "Kiểm tra ngữ pháp" (Grammar Checker), "Thuật toán xử lý văn bản", "Mô-đun kiểm tra ngữ pháp nội bộ". Renamed UC-06 to "UC-06: Luyện viết tình huống và kiểm tra ngữ pháp". Renamed 3 PlantUML files (`activity-writing-grammar.puml`, `sequence-writing-grammar.puml`, `dfd-writing-grammar.puml`). 22/22 PlantUML diagrams compiled and rendered (PASS). All 4 DOCX reports and PowerPoint presentation decks rebuilt. Automated regex scan verified 0 forbidden term violations.

- Latest task: `docx-audit-and-scope-harmonization` — DONE. Audited and fully harmonized `Lingora-Project-1-Lecturer-Format-Final.docx`, `lingora-project-1-lecturer-format.md`, `lingora-requirements-and-use-cases.md`, and `lingora-project-1-requirements-report.md`. All 10 Use Cases (`UC-01`..`UC-10`) are official, fully active system scope. Removed all `[PROPOSED]` remnants, "chưa triển khai", and deferred disclaimers. Rebuilt DOCX under Python 3.11 (`python-docx`). Automated XML inspection verified 0 forbidden/deferred markers, 10 active UCs, clean Times New Roman typography, 2 external actors, internal grammar processing, and 24-question survey findings.

- Latest task: `integrate-survey-dataset-metrics` — DONE. Extracted and analyzed survey responses across 24 questions from `D:\btl\Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`. Integrated high-impact quantitative survey percentages into Slides 4, 7, and 8 (100% forgetting vocab, 93.3% adaptive review, 86.7% habit drop, 80% SRS urgency 4.13/5, 66.7% grammar feedback, 80% career motivation, 73.3% fill-in-the-blank preference). Re-rendered all 19 slides to PNG and synchronized PPTX deliverables.

- Latest task: `strip-proposed-and-redesign-presentation` — DONE. All 22 PlantUML files have `[PROPOSED]` tags, `[PROPOSED / NOT IMPLEMENTED]` markers, and yellow "not implemented" note boxes stripped. PlantUML compiler validation (22/22 PASS) and PNG renders (22/22 PASS). PowerPoint 19-slide presentation redesigned (`docs/report/Lingora-Project-1-Requirements-Presentation-V2.pptx`): UC-09 & UC-10 styled identically without orange highlights/footer disclaimers, top-right slide badges deleted, bottom banners removed, section dividers simplified to only section titles, and Slide 19 redesigned to a single clean centered closing card. All 19 slides rendered to PNG and verified.

- Latest task: `align-uc-scope-and-report-status` — DONE. UC-01..UC-10 are official in-scope features in active canonical docs and Markdown reports; UC-09/UC-10 have canonical `P1-FR-016/017` entries and traceability rows. Runtime/schema/API implementation remains separately gated and is not claimed as complete. Scope scan and `git diff --check` pass.

- Latest task: `standardize-plantuml-english-technical-terminology` — DONE. Standardized all 22 PlantUML files across `docs/plantuml/`: actors (`Learner`, `Admin`), Use Cases (`UC-01`..`UC-10`), system boundary (`Lingora Web Learning System`), lifelines, DFD processes/stores, and ERD packages use standard English technical terminology without internal model branding in UC bubbles. Kept natural Vietnamese action steps in Activity diagrams and clear Vietnamese message labels on Sequence arrows. PlantUML compiler validation (22/22 PASS), PNG rendering (22/22 PASS), and `git diff --check` (PASS).

- Latest task: `vietnamize-all-plantuml-diagrams` — SUPERSEDED by `standardize-plantuml-english-technical-terminology`.

- Latest task: `complete-plantuml-coverage-and-integrate-reports` — DONE. Current documentation now uses the contiguous `UC-01`..`UC-10` catalog; UC-09 Placement and UC-10 Private Achievements remain `PROPOSED / NOT IMPLEMENTED`. Learner and Admin are the only external Use Case actors, both outside the Lingora boundary with solid non-arrow associations. GEC/T5-small is documented as internal processing. The PlantUML catalog contains 22 compiling sources, including Level 0 and detailed Lesson/Exercise, SRS and GEC DFDs. The ERD reports 15 active + 2 legacy/deprecated physical models and excludes proposed entities. Markdown reports retain six original interviews plus three supplementary records without combining frequencies. Final audit: 22/22 PlantUML compile PASS; actor/UC/ERD/catalog/interview scans PASS.

- Latest task: `redesign-requirements-presentation-deck-with-visual-cards-and-image-placeholders` — DONE. Redesigned all 19 slides of `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` using modern card layouts, typography (Segoe UI), status badges, single-line dynamic titles, and dedicated image placeholders with guidance text on key slides (Slides 1, 4, 7, 8, 10, 11, 14, 16, 17). 100% template fidelity preserved (UTC logo, header banner, footer graphics). All 19 slides rendered, visual checks and boundary layout validation passed.

- Latest task: `add-supplementary-interview-evidence-to-presentation` — DONE. The 19-slide Lingora requirements deck was fully restructured to the user-specified defense flow. Slides 7-8 now include the three newly supplied interview records as supplementary anonymized evidence; they are not mixed into the original six-record frequencies. The deck includes team/topic ownership, visual agenda, introduction, current state, problem framing, elicitation, benchmark, Use Case overview, UC-05/UC-06 Acceptance Criteria, FR/NFR, modeling, verification, current-status conclusion and Q&A. All 19 slides render and the overflow test passes.

- Latest task: `generate-19-slide-lingora-requirements-presentation` — DONE. Rebuilt `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` as a 19-slide Vietnamese academic deck using the supplied university template. The deck preserves evidence boundaries, labels UC-09/UC-10 proposed, uses the 17/15/2 model-count decision, removes unsupported latency claims, and keeps Slide 18 limited to current status/verification. All 19 slides rendered; visual review and automated overflow check pass.

- Latest task: `integrate-requirements-research-sections-into-lecturer-report` — DONE. Expanded the Vietnamese lecturer-format report with requirements elicitation, interview findings, benchmark, FR/NFR, User Story/Acceptance Criteria, validation, change management and traceability. Created `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` as a 14-slide deck cloned from `D:\TimHieuPaper_Nhom16.pptx` without modifying the source. Speaker notes cite the PDF, interview evidence, canonical docs and the approved ERD model-count decision. Physical schema is reported as 17 models; active business flow is 15; `ChatSession`/`ChatMessage` are legacy/deprecated pending formal migration cleanup; UC-09/UC-10 proposed entities are excluded from counts. DOCX title sanitation, deck template fidelity, overflow and full-slide visual QA pass. LibreOffice DOCX render remains unavailable.

- Latest task: `cleanup-legacy-chatbot-and-prepare-gec` — DONE. UC-06 report,
  evidence register and approved PlantUML diagrams now describe optional
  browser SpeechRecognition input and Speech Synthesis playback. The backend
  remains text-in/text-out with canonical `original_text` and
  `scenario_code`; no speech service, audio persistence, schema, migration or
  runtime change was made. All 15 PlantUML sources compile and the rebuilt DOCX
  passes Google Docs title sanitization. Visual DOCX render remains unavailable
  because LibreOffice/soffice is not installed.

- Current task: `project-1-requirements-report-docx` — report Markdown and Google Docs-targeted DOCX created. Interview review confirms alignment with UC-02/03/05/07/08 and partial UC-06; UC-09/UC-10 remain proposed. DOCX title sanitizer and structural checks pass. Visual render QA is pending because LibreOffice/soffice is unavailable (`WinError 2`).
- Latest task: `complete-project-1-five-chapter-report` — complete Vietnamese five-chapter Markdown and DOCX created at `docs/report/`. It follows the requested university structure, keeps the approved two-track scope, and marks unimplemented/proposed content explicitly. Structural/title checks pass; visual render remains unavailable because LibreOffice/soffice is not installed.
- Latest report revision: `restructure-project-report-to-lecturer-format` — created `docs/report/lingora-project-1-lecturer-format.md` and `docs/report/Lingora-Project-1-Lecturer-Format.docx` following the lecturer PDF: Part I contains survey/interview requirements; Part II contains BFD/DFD/analysis; Part III contains database design; Part IV contains conclusion. UI/UX is deferred and not presented as current scope.

- Last completed task: `report-requirements-use-case-realignment` — DONE. Created the report source `docs/report/lingora-requirements-and-use-cases.md`, evidence register and 15 PlantUML sources. The report covers the lecturer's elicitation, User Story/Acceptance Criteria, FR/NFR, Use Case, Activity, DFD, ERD, validation and traceability requirements. UC-09 Placement Test and UC-10 private Achievements/Badges are approved proposed targets, not implemented. PlantUML compiler validation: 15/15 PASS.

- Last completed task: `two-track-se-ml-gec-scope-amendment` — DONE. ADR-010 consolidates the future target into Software Engineering plus T5-small GEC. The documentation amendment did not change Web/FastAPI/model/database implementation.

- Previous completed task: `requirements-system-analysis-documentation-recovery` — DONE. Created authoritative
  [`docs/06-system-analysis.md`](docs/06-system-analysis.md) (problem statement, 6 capabilities, stakeholder/actor
  catalog, boundaries, 8 Use Cases, sequence flows, assumptions/constraints, audit findings register) and
  [`docs/07-data-dictionary.md`](docs/07-data-dictionary.md) (implementation-grounded ERD with 17 models, 24 FKs,
  attribute constraints, private storage buckets, schema mismatch table). Updated [`docs/05-traceability-matrix.md`](docs/05-traceability-matrix.md)
  and reading order in [`docs/project-1/README.md`](docs/project-1/README.md).
  Evidence: `RSA-T-001` .. `RSA-T-009` (all 9 checks PASS).
- Previous implementation milestones:
  - `M1.6W` Web learner foundation DONE (Next.js 15, SSR Auth, Route Handler proxy to AI, 19/19 Vitest unit tests, Playwright e2e).
  - `M1.5` JWT verifier amendment DONE (Supabase JWKS / ES256 & HS256 compatibility, 37/37 Pytest PASS).
  - `M1.4` Seed & RLS test harness DONE (34/34 tests PASS).
  - `M1.3` Auth + RLS + Storage (two-bucket) + `record_review` DONE.
  - `M1.2` Prisma + Supabase schema DONE (17 models, 3 migrations).
- Last approved scope decision: `ADR-010 — Two-track consolidation: Software Engineering + Transformer GEC`.
- Next implementation tasks remain separately gated: M2 Web core flow, deterministic SRS audit, GEC API foundation, scenario-writing UI and model training/evaluation.
- Public staging snapshot: `staging/lingora-workspace-public/` — pre-reset; regeneration pending.

---

## Pending decisions / open questions

- Exact SRS policy name remains pending a read-only audit of `record_review`; do not call it SM-2 without evidence.
- GEC offset units, input limit, dataset/license and benchmark protocol must be locked in their implementation plans.
- Legacy `/v1/srs/schedule` and `/v1/chat/roleplay` remain implemented compatibility endpoints until consumers migrate.

- `ADR-006` scope remains **approved and documented, not implemented**: enum `GRAMMAR`, listening option `4a`
  (word-level audio), `dailyGoalMin` UI. Payload shapes for `GRAMMAR` and `LISTENING` belong to the M2 implementation task.
- Reminder options `6a` (PWA/service worker notification) and `6b` (Web Push + `push_subscriptions` + scheduler,
  VAPID, a sender outside `lingora-web`) are **DEFERRED, not rejected**. Re-entry needs a new plan and a new ADR;
  it does not require reversing `ADR-008`.
- Option `6d` (in-app reminder) is approved for later feature milestone (M2+).
- `staging/lingora-workspace-public/` must be regenerated under its own approved task before any public
  publication — it now contradicts the canonical docs on platform.
- `.codex/` and `.agents/` cleanup completed: old frameworks and broken hooks removed; Superpowers 14-skill library canonically installed.

---

## Do NOT do next

- Do not implement M2 feature code without an approved `plans/current-task.md` for Milestone M2.
- Do not implement UC-09 placement test or UC-10 achievements/badges from the report alone. Create and approve separate implementation plans that lock scoring/badge policy, data/API/RLS impact and tests.
- Do not modify database schema, migrations, RLS, or RPC without an approved plan and ADR.
- Do not reintroduce Android, Gradle/AGP, Retrofit, Room, or APK into active codebase.
- Do not add a service worker, web app manifest, PWA install flow, push code, or scheduler — `6a`/`6b` are deferred.
- Do not touch `lingora-ai/api/` runtime without an approved task; current verifier supports both ES256 and HS256.
- Do not implement `/v1/gec/correct`, scenario UI, model training, endpoint deprecation or cleanup without their own approved follow-up task.
- Do not place secrets in code, logs, screenshots, fixtures, or commits.
- Do not amend or rebase historical commits, and do not rewrite Git history or force-push.

---

## Suggested next step

Draft `plans/current-task.md` for **`m2-web-core-lesson-flow`** (Milestone M2):
- Implement Course/Lesson navigation and lesson player in `lingora-web/`.
- Implement interactive exercise engine supporting `MCQ`, `FILL_BLANK`, `REORDER` (plus `GRAMMAR` and `LISTENING` per ADR-006).
- Implement lesson progress scoring (0–100%) and atomic completion update to `UserProgress`.
- Verify responsive layouts and accessibility.

---

## Git remotes — PUBLIC vs PRIVATE (human-confirmed 2026-09-15, never confuse)

- PRIVATE workspace (full work, agent logs/plans, all audits): `origin` →
  `https://github.com/PhamNguyenThanhTung/lingora-workspace` (default push target; commit `ea1a2f3` pushed here).
- PUBLIC repo (external sharing): `https://github.com/PhamNguyenThanhTung/BTL` (not configured as a
  remote in this clone; do NOT push here unless explicitly asked, and never push secrets/logs to it).

---

## Context not in code

- The platform switch was a human decision made on 2026-08-17 with the assignment-title risk raised and
  knowingly accepted (risk `R12` in `docs/00-master-plan.md`, recorded in `ADR-008`).
- Learner AI calls go through Next.js Route Handler proxy (`/api/ai/srs`, `/api/ai/chat`) rather than browser-to-FastAPI directly.
- Storage two-bucket split (`lingora-avatars` / `lingora-media`) is strictly enforced at database/storage level.
- The internal GEC FastAPI component is stateless by design; it never reads/writes Supabase directly.
- `MOCK_MODE=true` is supported for mock inference during development.
