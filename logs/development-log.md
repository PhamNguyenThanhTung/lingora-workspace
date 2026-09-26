# Development Log

## 2026-09-24 — d3-assessment-and-learning-engine-design (category: scope-ambiguity)

- **Context & Directive:** Human APPROVED D3 design-only task (chat directive 2026-09-24). Scope: `Assessment → Skill Profile → Learning → Mastery/Knowledge Gap → Readiness → Recommendation/Remediation` from D1/D2 COMPLETE baseline. Constraints: no runtime, no migration, no Prisma/Supabase schema change, no scoring/recommendation/remediation algorithm, no Design Freeze, preserve D2 FROZEN/PROPOSED/PENDING, Mapping A stays D2 compatibility.
- **Deliverables (Files Expected To Change only):** new `docs/phase-1-d3-assessment-learning-engine-design.md` (A–Q; Q = `READY FOR D4 CONTENT/CURRICULUM DESIGN`); 6 new puml (`assessment-lifecycle-d3`, `diagnostic-flow-d3`, `learning-progression-d3`, `mastery-knowledge-gap-d3`, `level-readiness-d3`, `recommendation-remediation-d3`) with distinct `assessmentType`/`deliveryMode` and no downgrade/auto-advance edges; concise `01 §3.4` cross-reference; `05 §6` D3 traceability rows (15 UCs unchanged); `plans/current-task.md` APPROVED→IMPLEMENTING; logs updated.
- **Preserved boundaries:** Progress ≠ Proficiency ≠ Mastery ≠ Readiness; Diagnostic ≠ EXIT/RE_EVALUATION; assessmentType ≠ deliveryMode; selfReportedLevel (UNVERIFIED) ≠ verifiedProficiency; no Completed B1 → B2; no whole-level downgrade; no forced replay; no hard-coded scoring/threshold/Anchor/readiness/remediation formula; Mapping A not generalized; no AssessmentSession (negated mentions only).
- **Verification:** `T-D3-DESIGN-001` PASS (18/18 guards; diff--check 0; D3 focused scan OVERALL PASS; runtime scope empty). `T-D3-HYGIENE-001` PASS (D3 header status sync to Section Q, HANDOFF single-task cleanup, Reading semantic boundary note in §B3).
- **Decisions:** ADR-016 recorded in `logs/decision-log.md`.

## 2026-09-24 — d1-final-design-cleanup-and-d2-domain-data-design (category: scope-ambiguity)

- **Context & Directive:** APPROVED System Design task D1 → D2 from `PASS WITH NON-BLOCKING ISSUES` baseline. Design-first only: 0 application code, 0 migrations, 0 runtime schema change, 0 scoring/recommendation/remediation algorithms. No Design Freeze declared.
- **D1 Cleanup (6 items):** D1.1 AssessmentSession ghost removed from `04:449`, M2.1 purpose line decoupled, `STANDARD` added to `01:451`, `delivery_mode` added to puml AssessmentResult. D1.2/D1.3 verify-only (already correct, GUARD-09 + conceptId FKs). D1.4 `[PENDING-SOURCE-VERIFICATION]` on 5 credential spots (phase-0 §0.1/§3.5.1/§3.5.2, slide quy ước + methodology). D1.5 EN/ZH config keys in `01 §3.1`, M2.1 §6.9, tai-lieu YC-CORE-09. D1.6 HISTORICAL tags on 2 frozen `Ba dạng` rows + erd `audio_path` → `audio_url` (diagram-only).
- **D2 Design (16 items):** Concept puml parity (name/prereq/isActive/PRONUNCIATION, cefr_level kept as level-ref — ADR-015); SkillProfile `sourceAssessmentResultId`; LevelReadiness typed evidenceSummary (thresholds CONFIGURABLE/PENDING); Recommendation inputSnapshot/ruleVersion/generatedAt; mastery/gap threshold guards + delete behavior; M2.1 §4.4 relationship matrix + §4.5 ten invariants; 01 §3.3 ten invariants; D2.7 conceptual Language→config note; §13 supplement (readiness table D2.15, versioning map D2.10, runtime compat report D2.16 — read-only); puml Exercise→Concept relation; slide 5-type `Viết` → `Ngữ pháp`.
- **Verification:** `T-D1-D2-DESIGN-001` PASS (18/18 guards, `git diff --check` 0, puml balance 3×2, no new UCs).
- **Decisions:** ADR-015 recorded in `logs/decision-log.md`.

## 2026-09-24 — design-re-review-batch-fixes-round-3 (category: contract-gap)

- **Context & Directive:** Implemented all batch fixes resulting from Independent Design Re-Review (Round 2) to prepare Lingora for Re-Review Round 3, transitioning the repository to `READY FOR DESIGN RE-REVIEW` (strictly zero runtime implementation, zero DB migrations/schema mutations).
- **Key Accomplishments & Structural Alignments (All 11 Points):**
  1. *P0-1 (Q13 Raw XLSX Recount & Contradiction Resolution):* Verified raw survey data from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` Column 14 (Q13, $N=15$): $5\star:8$ (53.3%), $4\star:4$ (26.7%), $3\star:1$ (6.7%), $2\star:1$ (6.7%), $1\star:1$ (6.7%), Sum = 62.0, Avg = 4.1333, Positive $4\text{–}5\star = 12/15$ (80.0%). Synchronized `docs/tai-lieu-phan-tich-yeu-cau.md`, `scratch/build_full_17_slides.py`, and `docs/slide-deck-17-slides.md`. Preserved raw Excel untouched.
  2. *P0-2 (Language Expert Identity Fix):* Updated `docs/slide-deck-17-slides.md` (Slides 2 & 10) to canonical: English Teacher Trần Minh Quân (9 năm kinh nghiệm), Chinese Teacher Lê Hoàng Mai (8 năm kinh nghiệm). Zero occurrences of "Lê Tuyết Mai" or "7 năm" remaining in current documents.
  3. *P1-3 (YC-CORE-01 Password Recovery Downstream Trace):* Retained "quên mật khẩu" in `YC-CORE-01`. Completed end-to-end downstream trace: `YC-CORE-01` $\rightarrow$ `MVP-01` $\rightarrow$ `P1-FR-001` $\rightarrow$ `UC-01` alternative flow $\rightarrow$ Acceptance criteria in `docs/06-system-analysis.md`, `docs/02-requirements.md`, and `docs/05-traceability-matrix.md`. Explicitly marked runtime implementation status as `PENDING / DESIGN SPEC ONLY`.
  4. *P1-4 (NFR Qualifier Consistency):* Added `[PROPOSED TARGET / TBD — NOT BENCHMARKED]` qualifiers to latency/performance metrics in `docs/06-system-analysis.md` (NFR-PERF-05, NFR-PERF-06), `docs/report/lingora-project-1-lecturer-format.md`, and `docs/report/lingora-requirements-and-use-cases.md`.
  5. *P1-5 (Multi-Language 4-Tier Assessment Chain):* Documented explicit 4-tier chain (`Common Assessment Engine` $\rightarrow$ `Language Config` $\rightarrow$ `Item Bank` $\rightarrow$ `Rubric`) in `docs/01-architecture.md` (§3.1) and `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§6.9). Clarified these are conceptual/configuration layers, not physical database tables.
  6. *P1-6 (Canonical Exercise Types Aligned):* Replaced stale "Ghép thẻ" with "Ngữ pháp" (`GRAMMAR`) in `docs/slide-deck-17-slides.md` (Slide 15) and `scratch/generate_s15_learner_flow.py`. Canonical 5 types: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
  7. *P1-7 (AssessmentType 3-vs-5 Drift Resolved):* Cleanly separated 3 canonical pedagogical assessment types (`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`) from delivery execution modes (`PLACEMENT`, `JUMP`, `STANDARD`) across `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§4.1, §6.12, §8.20.3) and `docs/01-architecture.md` (§3.1). Flat 5-value enum marked `[HISTORICAL / SUPERSEDED IN DRAFT]`.
  8. *P1-8 (LearningProgress Sole Ownership by LearnerProfile):* Removed duplicate `Profile "1" -- "0..*" LearningProgress` link from `docs/plantuml/domain-model-core.puml`, retaining strictly `LearnerProfile "1" -- "0..*" LearningProgress : monitors / owns [Target]`. Synchronized in M2.1 §8.20.7 and `docs/05-traceability-matrix.md` (E-EXP-03).
  9. *P2-9 (Stale Jump Semantics Guarded):* Marked historical proposal term `COMPLETED_BY_JUMP` as `[HISTORICAL / SUPERSEDED]` in `docs/phase-0-product-owner-decision-sheet.md` and `docs/plantuml/learning-progression-model.puml`. Current rule strictly enforces `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`).
  10. *P2-10 (Stale CEFR Auto-Placement Guarded):* Added `[HISTORICAL / SUPERSEDED]` markers to legacy stories claiming "tự động xác định trình độ CEFR" in `docs/report/lingora-requirements-and-use-cases.md` and `docs/report/lingora-project-1-lecturer-format.md`. Placement strictly maps to Starting Unit on curriculum (Placement Mapping A).
  11. *P2-11 (N=35 / N=3 Evidence Labeled):* Explicitly labeled all references to $N=35$ and $N=3$ in `docs/slide-deck-17-slides.md` (Slides 2, 6, 7, 17) and `docs/tai-lieu-phan-tich-yeu-cau.md` (§2.5, §2.6) as `[PRELIMINARY / DISCOVERY RESEARCH — PENDING RAW REPOSITORY EVIDENCE]`.
- **Verification:** `T-DESIGN-REVIEW-FIX-002` PASS (All 11 consistency guards verified via automated test harness `scratch/verify_consistency_guards.py`). `git diff --check` clean with 0 whitespace errors.
- **Repository State:** `READY FOR DESIGN RE-REVIEW`.
- **Commit:** Pending human review and authorization.

## 2026-09-24 — design-review-fixes-and-consistency-alignment (category: contract-gap)

- **Context & Directive:** Implemented all fixes for findings identified in the Design Review of Lingora to transition repository status from `NOT READY` to `READY FOR DESIGN RE-REVIEW`. Zero application code, zero DB migrations/schema mutations, 15 canonical UCs preserved.
- **Key Accomplishments & Structural Alignments:**
  1. *Critical Fixes (C-01 to C-08):*
     - `C-01`: Eliminated requirement ID namespace collision in `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §2 by renaming design-local definitions to `DESIGN-FR-001..016` and `DESIGN-NFR-001..005`, and re-mapping all entity/trace tables to canonical engineering `P1-FR-*` / `P1-NFR-*` IDs.
     - `C-02`: Re-mapped `SupportTicket` trace from `UC-15` to `UC-14` (Operations Staff / `MVP-16`). Preserved `UC-15` exclusively for `Cohort` (Org Manager / `MVP-17`).
     - `C-03`: Recounted raw survey responses from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` Column 8 (Q7, $N=15$) and updated `docs/tai-lieu-phan-tich-yeu-cau.md` lines 61–67 to exact distribution: Vocab 7 (46.7%), Listening 6 (40.0%), Speaking 6 (40.0%), Writing 6 (40.0%), Grammar 5 (33.3%), Reading 2 (13.3%). Excel file preserved untouched.
     - `C-04`: Persisted `LearningProgress` entity (`completedContentRatio`, `lastAccessedAt`, `updatedAt`) across Mermaid, M2.1 §4.1/§4.3/§8.20, and PlantUML `domain-model-core.puml`, mapped to `UC-07` / `MVP-08` / `P1-FR-011`.
     - `C-05`: Labeled `READING` exercise format (`passageText`, `questions`, `conceptCode`) as `PROPOSED / DESIGN GAP` in M2.1 §4.1, §6.11, §8.8, and §8.19.6.
     - `C-06`: Added `EXIT` and `RE_EVALUATION` to `AssessmentType` enum in M2.1 §4.1/§6.12/§8.20.3, PlantUML `learning-progression-model.puml`, and system specs; asserted `Progress ≠ Proficiency` and `Completed B1 ≠ B2`.
     - `C-07`: Fixed Jump completion semantics in `learning-progression-model.puml` and system specs: skipped units tagged `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`), never `COMPLETED_BY_LEARNING`.
     - `C-08`: Labeled `### Scope Gap Review data boundaries` in `docs/04-data-model.md` as `HISTORICAL / SUPERSEDED by Phase-1 M2.1 Logical Target Schema`.
  2. *Major Fixes (M-01 to M-15):*
     - `M-01`: Established explicit precedence in `docs/09-placement-and-jump-specification.md`: Stage-Adaptive Diagnostic Assessment is the FROZEN ARCHITECTURAL PATTERN system-wide; English A1 30-item mapping is a PROPOSED PLACEMENT INSTANCE for MVP-03.
     - `M-02`: Disambiguated research sources in `docs/slide-deck-17-slides.md`: separated Learner Survey ($N=15$), Stakeholder Interviews ($N=7$, 5 roles), and Language Expert Interviews ($N=2$, Thầy Quân & Cô Mai, tagged `expert-informed`).
     - `M-03`: Added content governance attributes (`creatorId`, `unitId`, `conceptId`, `status: ContentStatus`, `reviewerId`, `publishedAt`, `version`) to `RemedialModule` across M2.1 §4.2/§4.3/§6.13/§8.20.9 and PlantUML.
     - `M-04`: Added `Concept` entity (`code`, `domain`, `languageCode`, `description`, etc.) and updated `ConceptMastery` and `KnowledgeGap` to reference `conceptId: UUID (FK)` instead of free-text `conceptTag`.
     - `M-06`: Separated fixed `GRAMMAR` exercise from transient `GEC` in M2.1 §8.19.5, removing transient fields (`contextScenarioCode`, `gecEnabled`).
     - `M-07`: Replaced `audioPath` in M2.1 §8.19.4 (`LISTENING`) with `vocabularyId` referencing canonical vocabulary.
     - `M-08`: Qualified unmeasured latency numbers with `[PROPOSED TARGET / TBD]`.
     - `M-09`: Added consistency guard on `docs/09` §4 weights (`40/45/15`): `[PROPOSED — unit-local test composition only, NOT used as SkillProfile overall-score formula]`.
     - `M-11`: Added Section 3 (`## 3. Assessment, Remediation & Readiness Architecture`) to `docs/01-architecture.md`, resolving dangling pointers from `docs/05`.
     - `M-12`: Aligned non-mandatory confirmation gate: placement/diagnostic directly updates verified profile; confirmation dialog is an optional UX recommendation.
     - `M-13`: Synchronized 5 exercise types per ADR-006 (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`) across `docs/05`, `docs/06`, and `docs/02`.
     - `M-14`: Added comprehensive Section 5 to `docs/05-traceability-matrix.md` with full 5-tier traceability chain `YC → MVP → P1-FR → UC → Design` covering all 12 YC-CORE, 8 YC-EXT, 19 MVP functions, P1-FR/NFR/ML-GEC, and 15 Canonical UCs.
     - `M-15`: Fixed Profile and AuditLog field alignments in M2.1 §8.12 and §8.16.
- **Verification:** `T-DESIGN-REVIEW-FIX-001` PASS (all 17 consistency guards verified via automated test harness `scratch/verify_consistency_guards.py`). `git diff --check` clean with 0 whitespace errors.
- **Repository State:** `READY FOR DESIGN RE-REVIEW`.
- **Commit:** Pending human review and authorization.

## 2026-09-24 — language-expert-research-and-learning-design-update

- **Context & Directive:** Implemented the full Language Expert Research update (Thầy Trần Minh Quân - TESOL English, Cô Lê Hoàng Mai - Applied Linguistics Chinese) and the pedagogical Learning Design model across all specification, requirements, use cases, domain model, and architecture documents.
- **Key Accomplishments:**
  1. *Evidence Governance & Synthesis:* Added 5th evidence label `[EXPERT — LANGUAGE EXPERT INTERVIEW]` (`E-EXP-01` to `E-EXP-07`) in `docs/phase-0-user-research-analysis-and-requirements.md` §0.1 and detailed interview records in §3.5. Updated multilateral triangulation matrix.
  2. *Requirements & Use Cases:* Updated `YC-CORE-07`..`YC-CORE-11`, `YC-EXT-03`, `NFR-LOC`, `MVP-03`, `P1-FR-016` across `tai-lieu-phan-tich-yeu-cau.md`, `02-requirements.md`, and `06-system-analysis.md`. Replaced hard-coded "30 questions" as general system invariant with Stage-Adaptive Diagnostic Assessment, while preserving Placement Mapping A as initial English A1 curriculum rule. Maintained 15 canonical Use Cases (`UC-01`..`UC-15`).
  3. *Four-Concept Separation:* Strictly separated `Learning Progress` $\ne$ `Proficiency` $\ne$ `Mastery` $\ne$ `Level Readiness`.
  4. *Adaptive Learning & Remediation:* Specified 3 level transition states (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`) and Concept-level Remediation (targeted micro-lessons with fresh context; strictly no whole-learner downgrade, no repeating completed lessons).
  5. *Multi-Language Architecture:* Standardized Common Assessment Engine with language-specific configuration (English CEFR A1–B2; Chinese versioned HSK with reading `hidePinyin: true`). Flexible Entry Flow (`selfReportedLevel` $\ne$ `verifiedProficiency`).
  6. *Domain Model & Data Foundation:* Integrated 9 logical domain concepts into `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§4, §6, §8.20) and updated PlantUML models (`domain-model-core.puml`, `learning-progression-model.puml`).
  7. *Slide Deck & Quick Reference:* Synchronized `docs/slide-deck-17-slides.md` and `docs/QUICK-REF.md`.
- **Negative Invariants Preserved:** 0 application code modified; 0 database migrations touched; no fake experts or percentages; all adaptive parameters/thresholds marked `PROPOSED / PENDING VALIDATION`; M2.2 behavioral modeling not started.
- **Verification:** `T-EXP-DESIGN-001` PASS. `git diff --check` clean with 0 whitespace errors.
- **Commit:** Pending human review and authorization.

## 2026-09-20 — phase-1-m2-1-targeted-fix-after-adjudication

- **Completed:** Applied the adjudicated M2.1 documentation corrections: reconciled applied fields and dictionary coverage with migration `202608140001_init`, canonicalized Scope values, completed traceability for language/translation/supporting scenario entities, synchronized the two affected PlantUML artifacts, and removed forbidden literal tokens from the active M2.1 Markdown and four PlantUML files.
- **Preserved boundaries:** No application code, Prisma schema, migration, Supabase/database, learner/admin runtime, lifecycle PlantUML, baseline/Product Decision documents, or M2.2 artifacts were changed. P0-01 remained rejected; no `IN_REVIEW -> PUBLISHED` path was introduced.
- **Verification:** `T-M21-TFIX-001` PASS. Fresh audit observed `TARGET_EXT=0`, `MATCHING=0`, `CORE (Supporting)=0`; four PlantUML files each had one `@startuml` and one `@enduml`; no active `ARCHIVED -> DRAFT`; selected applied columns matched the migration and dictionary; the Exercise PlantUML block had zero timestamp fields and domain false-applied-field checks were zero; Markdown false-claim checks were zero; `git diff --check` exited 0. PlantUML renderer was unavailable, so only static syntax was verified.
- **Final state:** `M2.1 = CORRECTED — READY FOR INDEPENDENT RE-REVIEW`; `M2.2 = NOT STARTED`. Independent re-review and M2.1 approval remain outside this task.
- **Commit:** Pending human review and authorization.

## 2026-09-15 — phase-0-user-research-analysis-and-requirements-authoring

- **Context & Directive:** Executed full authoring of the 6 Core Report Sections in `docs/phase-0-user-research-analysis-and-requirements.md` following user command "bắt đầu làm đi" and approved writing plan `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`. Strict technical and integrity boundaries enforced: 0 application code, 0 schema/migration changes, M2.1 preserved, M2.2 NOT started.
- **Key Accomplishments & Structural Synthesis:**
  1. *Academic Integrity & Anti-Patterns Repudiation:*
     - Formally repudiated and banned Anti-Pattern 1 (no copying $N=500$ foreign TOEIC survey data from external sample report `D:\PROJECTONE2_updated_with_conclusion_v2 (1).docx`).
     - Formally repudiated and banned Anti-Pattern 2 (no falsifying simulated 20 Personas as surveyed real people).
     - Standardized on 4 canonical evidence labels: `[PRIMARY — REAL PROJECT DATA]`, `[SECONDARY — REAL EXTERNAL SOURCE]`, `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`, `[PRODUCT DECISION — NON-EMPIRICAL POLICY]`.
  2. *Section A (User Research & Empirical Learner Survey N=15):*
     - Extracted, aggregated and verified 100% of the 24 questions from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` ($N=15$).
     - Adapted professional table structures from sample report: Table 1.1 Khó khăn ($N=15$), Table 1.2 Kỹ năng ($N=15$), Table 1.3 Tính năng ($N=15$), Table 1.4 Tổng hợp 24 câu hỏi. Every single percentage formatted with explicit fraction $(k/15, \text{XX.X}\%)$.
     - Connected findings to S1 (Hwang 2024 attrition $\sim 43.16\%$), S4 (Cepeda 2006 spacing effect), S5 (Settles 2016 HLR).
  3. *Section B (Application Survey & Benchmark):*
     - Evaluated Duolingo, Quizlet, and ELSA Speak across 17 comprehensive technical/pedagogical criteria.
     - Rejected TOEIC exam-prep platforms per Invariant D4 (Unified Exercise model, zero Exam/QuestionBank entities).
     - Standardized 4-field output: `[Observed Feature] → [Source Evidence (URL / DOI + Access Date 2026-09-15)] → [Implication for Lingora] → [Technical Decision: ADOPT / ADAPT / REJECT + Architectural Rationale]`.
  4. *Section C (Qualitative Interviews & Triangulation):*
     - Summarized qualitative interviews of 6 real learners ($P1$–$P6$) without hallucinating verbatim quotes (resolving Gap G1).
     - Strictly segregated 20 synthetic internal stakeholder personas into Section 3.3 under explicit `[SYNTHETIC SCENARIO]` warning banner.
     - Constructed 3-Way Triangulation Matrix: Primary Survey ($N=15$) $\longleftrightarrow$ Qualitative Interviews ($P1$–$P6$) $\longleftrightarrow$ Secondary Research ($S1$–$S6$).
  5. *Section D (User Pain Points & Root Cause Matrix):*
     - Built comprehensive 7-column matrix for 8 core pain points ($PP-01$ to $PP-08$) linking problem to root cause, product response ($D1$–$D9$), and requirement traces.
  6. *Section E (Canonical Roles & Separation of Duties):*
     - Expanded 2 basic actors from sample report into 6 canonical roles (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`).
     - Established SoD Matrix for 7 content lifecycle actions enforcing 5 technical invariants (D1 planning, D2 no self-approval, D3 clone-to-draft, Moderator approve only, Admin emergency audit trail DD-03).
     - Segregated Core Boundary (15 active tables) from Extension Boundary (`Cohort`, `SupportTicket`).
  7. *Section F (Requirements Engineering: FRs & Deep NFRs):*
     - Detailed 17 Functional Requirements (`P1-FR-001` through `P1-FR-017`) using 10-attribute specification with `Given-When-Then` Acceptance Criteria and evidence citations.
     - Detailed 11 NFR taxonomies with strict metric discipline: tagged unverified latency as `TBD / PROPOSED TARGET` with test conditions; eliminated ungrounded `<500ms` claims.
     - Verified end-to-end traceability: 100% requirements traced to evidence, 0 orphan requirements.
  8. *Verification & Validation Gates (T-P0-REQ-001):*
     - All 6 Validation Gates (G1 Evidence, G2 Numbers, G3 Synthetic Isolation, G4 Sample Rejection, G5 NFR Rigor, G6 Traceability) verified PASS via automated test harness `scratch/verify_gates.py`.
- **Deliverables:**
  - `docs/phase-0-user-research-analysis-and-requirements.md` (127,955 chars, 911 lines)
  - `plans/current-task.md` updated to `DONE`
  - `logs/test-log.md` updated with `T-P0-REQ-001`
  - `logs/development-log.md` updated
- **Status:** `DONE`. Ready for independent review. M2.1 preserved, M2.2 NOT started.

## 2026-09-15 — phase-1-m2-1-targeted-fix-p1-01-p2-01

- **Context & Directive:** Executed targeted fix for Milestone M2.1 resolving exactly the two findings from the Independent Re-Review (`docs/phase-1-m2-1-independent-re-review.md`): P1-01 (false CURRENT_APPLIED field claims) and P2-01 (non-canonical scope label `LEGACY_APPLIED`). Strict boundaries enforced: 0 application code, 0 schema changes in `prisma/schema.prisma`, 0 migrations created/run, 0 database writes, M2.2+ NOT started.
- **Fixes Applied:**
  1. *P1-01 (False CURRENT_APPLIED Field Claims on SRS Tables):*
     - Inspected actual applied migration evidence (`lingora-admin/prisma/migrations/202608140001_init/migration.sql` and `202608140002_auth_rls_storage_record_review/migration.sql`).
     - Verified `review_logs` contains 5 physical columns (`id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`) and NO `score` column. Removed the false `score` row from `ReviewLog` in `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §8.15.
     - Verified `user_vocab_srs` contains `recall_probability DOUBLE PRECISION` and NO `recall_score Integer`. In `docs/plantuml/domain-model-core.puml`, replaced `+ recall_score: Integer [Applied]` with `+ recall_probability: Float [Applied]` and aligned missing applied fields (`last_reviewed_at`, `lapse_count`).
     - In `docs/plantuml/domain-model-core.puml`, removed false `+ score: Integer [Applied]` from `ReviewLog`. Preserved `+ score: Integer [Applied]` in `UserProgress` (authentic applied column per migration line 152).
  2. *P2-01 (Canonicalize Scope Label to EXCLUDED):*
     - Inspected `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §7.1 rows 22–23.
     - Replaced non-canonical hybrid label `LEGACY_APPLIED` on `chat_sessions` and `chat_messages` with canonical Scope value `EXCLUDED`.
     - Preserved Implementation Status as `CURRENT_APPLIED_DATABASE`. Added concise explanatory note clarifying the orthogonal 2-axis model (Scope: `CORE`, `EXTENSION`, `EXCLUDED`; Status: `CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`).
  3. *T-M21-FIX-002 Verification:* Verified 0 occurrences of `LEGACY_APPLIED`, 0 false applied claims for `recall_score` and `review_logs.score`, semantic consistency between Markdown and PlantUML, clean `git diff --check`, and unchanged code/schema/database.
- **Deliverables & Reports:**
  - Updated `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`
  - Updated `docs/plantuml/domain-model-core.puml`
  - Created `docs/phase-1-m2-1-targeted-fix-p1-01-p2-01.md`
  - Updated `plans/current-task.md` (`REVISED — READY FOR TARGETED RE-REVIEW`)
- **Status:** `M2.1 = REVISED — READY FOR TARGETED RE-REVIEW`. Milestone M2.2 NOT started.

## 2026-09-15 — phase-1-m2-1-final-verification-only

- **Context & Directive:** Executed final verification only for Milestone M2.1 (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`) under user strict boundaries: 0 code, 0 schema changes, 0 migrations, 0 database writes, M2.2+ not started.
- **Verification & Refinements Completed:**
  1. *Enforcement Boundary Clarification:* Replaced any absolute claims of current database enforcement with "Business & Design Invariants" and "Enforcement Requirements" for subsequent implementation milestones (M2.4 / Implementation). Explicitly noted that current Applied DB (2 roles: `LEARNER`, `ADMIN`) does not yet enforce 6-role lifecycle constraints at the DB level.
  2. *DD-07 & DD-08 Applied Database Verification:* Verified physical evidence from actual applied migrations (`lingora-admin/prisma/migrations/202608140001_init/migration.sql` and `202608140002_auth_rls_storage_record_review/migration.sql`):
     - `user_progress` exists in applied DB (`id`, `user_id`, `lesson_id`, `status: ProgressStatus`, `score: INT`, `completed_at`, `updated_at`, `UNIQUE(user_id, lesson_id)`) storing aggregate completion and score; dynamic retry calculation ($N$, allowance, 70% credit) executed at application layer; transient retry session state is an Open Design representation.
     - `user_vocab_srs` and `review_logs` exist in applied DB along with RPC `record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`. Deterministic Policy B schedule $[1, 3, 7, 14, 30]$ is computed by the application layer and passed into the RPC.
  3. *Table Inventory & Section 8 Restructuring:*
     - Formulated exact Inventory Table in §7.1: `# | Table | Scope | Current Applied DB | Target Schema | Future Migration | Dictionary Section | Ghi chú Ranh giới Kỹ thuật & Bằng chứng`.
     - Counted exactly 18 Core Scope tables and eliminated the subsection count discrepancy by splitting grouped tables into individual numbered subsections: §8.1 (`languages`) to §8.18 (`chat_scenario_translations`), followed by §8.19 (5 JSONB Payloads ADR-006). 100% Core Scope coverage verified.
  4. *Preserved Locked Policies:* Maintained D1–D9, Curriculum 08 (6 Units, 24 Lessons), Placement Mapping A (0–7 $\rightarrow$ U1, 8–12 $\rightarrow$ U2, 13–17 $\rightarrow$ U3, 18–22 $\rightarrow$ U4, 23–26 $\rightarrow$ U5, 27–30 $\rightarrow$ U6; no CEFR certification; no student confirmation step), Unified Exercise Model (0 Exam/QuestionBank), Manager normal publisher, Administrator no emergency publish, D3 clone-to-draft, D7 generalized $N$ formula, Applied ExerciseType only MCQ/FILL_BLANK/REORDER (zero MATCHING).
  5. *DD-05 Confirmed:* Assessment is conceptual mode/context of Exercise; `lesson_type` and `isAssessmentMode` confirmed as candidates in Open Design Representation.
  6. *PlantUML ERD Synchronized:* Updated `docs/plantuml/erd-logical-status-mapping.puml` to include `vocabulary_translations`, `chat_scenarios`, and `chat_scenario_translations` so all 18 Core Scope tables are represented. Verified syntax balance.
  7. *Section 12 Concluding Sections:* Added Sections A to E (§12.3 to §12.7): Evidence used, Remaining Open Design Decisions, Applied vs Target vs Future inventory, M2.1 Exit Gate status (D-G1 PASS, D-G2 PASS), and Explicit Statement: "M2.2 NOT STARTED".
- **Final Status:** `REVISED — READY FOR RE-REVIEW` (pending human approval). Milestone M2.2 NOT started.

## 2026-09-15 — phase-1-m2-1-revision-after-design-audit

- **Context & Directive:** Received design audit verdict `D — REQUIREMENTS DRIFT / DESIGN BOUNDARY VIOLATION` on Milestone M2.1. Executed comprehensive revision strictly addressing all 12 findings without modifying Requirements Baseline, Product Policies D1–D9, Curriculum, or Placement Mapping A. Halted before M2.2+.
- **Key Findings Resolved across M2.1 Artifacts & PlantUML:**
  - **F-01 (Admin Override Purged):** Removed ungrounded "Administrator emergency publish/archive" from content lifecycle; confirmed Administrator is strictly for security/RBAC/audit.
  - **F-02 (Creator Bypass Barred):** Formally enforced Manager-driven planning & assignment; Creator cannot author/submit unassigned work.
  - **F-03 (Exercise Types Corrected):** Reflected actual applied DB enum (`MCQ`, `FILL_BLANK`, `REORDER`); designated `LISTENING` and `GRAMMAR` as Target Additions requiring migration; completely purged `MATCHING`.
  - **F-04 (DD-05 Open Design):** Downgraded `lesson_type` to candidate representation; reinforced hard invariant D4 (Assessment = conceptual mode of Exercise; 0 Exam/QuestionBank).
  - **F-05 (D7 Generalized Formula):** Decoupled Controlled Retry formula from hard-coded 5 items: $\text{allowance} = \max(1, \lfloor N \cdot 0.10 \rfloor)$; fixed completion rule to handling first-pass and mandatory retry items (no 80% threshold).
  - **F-06 (D6 Placement Refined):** Removed extraneous "confirm before updating profile" requirement from locked behavior; labeled UX confirmations as `FUTURE UX OPTION / OPEN DESIGN`.
  - **F-07 (DD-02 Open Design):** Classified physical revision fields (`supersedes_id`, `lesson_revisions`) as Open Design Candidates, not resolved schema.
  - **F-08 (DD-03 Truthful Status):** Replaced "activate AuditLog" with truthful status: Target Model exists in `schema.prisma`, table is ABSENT in applied DB, migration is required.
  - **F-09 (DD-06 Persistence Candidate):** Classified `placement_history JSONB + starting_unit cache` as Target Design Candidate, not resolved runtime persistence.
  - **F-10 (Complete Data Dictionary):** Documented exhaustive field-level specifications across all 18 Core Scope tables with 8 attributes per field.
  - **F-11 (2-Axis ERD Model):** Restructured ERD and tables into 2 independent dimensions: Scope (`CORE`, `EXTENSION`, `EXCLUDED`) and Status (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`).
  - **F-12 (PlantUML Validation Disclaimer):** Documented static syntax balance verification; acknowledged renderer is unavailable in local environment.
- **Verification:** Recorded tests `T-M21-REV-001`..`004` in `logs/test-log.md`. Updated `plans/current-task.md` to `READY FOR RE-REVIEW`.
- **Change Control:** 0 code files, 0 schema changes, 0 migrations created/executed, 0 database writes, M2.2+ not started.

## 2026-09-15 — phase-1-m2-1-domain-and-logical-data-foundation

- **Context & Directive:** Executed Milestone M2.1 (Domain + Logical Data Foundation) in strict accordance with `docs/phase-1-system-design-plan.md` following user command: "Execute M2.1 only according to docs/phase-1-system-design-plan.md. Do not start M2.2+".
- **Completed Artifacts 1–5 in `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`:**
  - **Artifact 1 (Domain Model):** Formulated shared business vocabulary and core aggregates (Learning, Vocabulary & SRS, Learner Progress, Governance & Audit). Isolated `Cohort`, `CohortMember`, and `SupportTicket` to the Extension Boundary. Formulated complete bidirectional traceability table across 13 core entities to P1-FR, UC, and BF. Generated `docs/plantuml/domain-model-core.puml`.
  - **Artifact 2 (Content Lifecycle State Model):** Detailed 6-state lifecycle (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`). Formulated exhaustive State Transition Matrix (with pre-conditions and audit triggers) and Forbidden Transitions Matrix (barring Creator self-approval, Creator publish, Moderator publish, Manager bypass, and in-place editing of published content). Resolved DD-02 (Clone-to-Draft via `supersedes_id`), DD-04 (assignment brief on Lesson without separate entity), and DD-03 (AuditLog triggers). Generated `docs/plantuml/content-lifecycle-state.puml`.
  - **Artifact 3 (Learning Progression Model):** Formulated English A1 linear progression (6 Units, 24 Lessons). Specified Placement Test (~30 items, Skip to U1, Retake from Profile, Starting Unit output) with approved Placement Mapping A (0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6; no CEFR claims). Specified Conditional Jump (D5: 20q for 1 unit, 25–30q for 2–3 units, 40q for >3 units; pass >= 95%, fail 24h cooldown). Specified Controlled Retry (D7: allowance max(1, floor(5*0.1)) = 1, 70% credit, completion = finishing retry work). Resolved DD-05 (Exercise payload mode / LessonType; 0 Exam/QuestionBank entities) and DD-06 (placement history array in Profile + startingUnit cache). Generated `docs/plantuml/learning-progression-model.puml`.
  - **Artifact 4 (ERD 3-Status Mapping):** Formulated 3-status schema classification table (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`) for all 18 tables. Explicitly categorized `units`, `unit_translations`, and `audit_logs` as Target Schema (not runtime-ready). Generated `docs/plantuml/erd-logical-status-mapping.puml`.
  - **Artifact 5 (Data Dictionary Final):** Documented field-level specifications for core entities with 3-status labeling, physical types, nullability, defaults, ownership, and FR/UC trace. Formulated JSONB payload contracts for 5 Exercise types conforming to ADR-006 with mandatory `payloadVersion: 1`.
  - **Workstream A Outputs:** Standardized Alias Table bridging P1-FR-001..016 to legacy FR-/BR-* IDs; established Core vs Extension Boundary Register.
- **Verification & Gates:**
  - Evaluated and recorded Gate D-G1 (Domain & Lifecycle Traceability): PASS (100% trace, 0 orphan concepts, 0 self-action loopholes).
  - Evaluated and recorded Gate D-G2 (Data Model & Boundary Integrity): PASS (3-column labeling, 0 target/applied conflation, payloadVersion: 1 across all 5 types, 0 ghost entities).
  - Confirmed M2.1 Exit Criteria 100% met.
  - Halted at M2.1 boundary without starting M2.2+.
- **Change Control:** 0 code files modified, 0 Prisma schema changes, 0 SQL migrations created/executed, 0 database writes.

## 2026-09-14 — phase-0-full-reset-and-rebuild

- **Context & Objective:** Performed an intentional, complete Phase 0 Reset / Rebuild, shifting Lingora from `MIXED OLD/NEW M1 IMPLEMENTATION` to a `CLEAN PHASE 0 FOUNDATION`. Re-established Software Engineering as the primary/core platform scope and AI as a supporting capability (GEC).
- **Completed ADR-014:** Created `ADR-014` in `logs/decision-log.md` formally superseding ADR-010's "two academic tracks" model. Software Engineering is core; AI/GEC is a supporting capability via pretrained model or external API without local research pipelines. ADR-010 remains in history.
- **Completed Documentation Alignment:** Updated `docs/QUICK-REF.md`, `README.md`, `docs/README.md`, `docs/00-master-plan.md`, `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/03-api-contract.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, and `docs/07-data-dictionary.md`. Aligned 6 canonical roles, 19 MVP functions, 15 Use Cases, 6-state content lifecycle (`Draft` → `In Review` → `Changes Requested` → `Approved` → `Published` → `Archived`), and 5 target languages.
- **Completed Database Schema Redesign:** Redesigned `lingora-admin/prisma/schema.prisma` with Phase 0 Target Data Model:
  - 6 canonical roles enum: `ADMINISTRATOR`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `LEARNER`, `ORGANIZATIONAL_MANAGER`.
  - Content lifecycle enum: `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED` on `Course` and `Lesson` with audit timestamps (`submittedAt`, `reviewedAt`, `publishedAt`) and creator/reviewer relations.
  - Added `Unit` and `UnitTranslation` entities establishing the canonical `Course -> Unit -> Lesson` hierarchy per `erd-mvp-learning.puml`.
  - Added `AuditLog` entity for system/content auditability (MVP-19).
  - Purged obsolete ML chatbot models (`ChatSession`, `ChatMessage`) from active learning schema; kept `ChatScenario` for scenario writing.
  - Successfully validated with `npx prisma validate` and generated Prisma Client with `npx prisma generate`.
  - Strictly preserved all 3 historical migrations (`202608140001_init`, `202608140002_auth_rls_storage_record_review`, `202608140003_storage_two_bucket_size_enforcement`) and migration history for audit.
- **Completed Web UI Reset (`lingora-web`):**
  - Deleted obsolete business UI and demo components: `src/app/(learner)/foundation/`, `src/components/foundation/`, `src/features/ai/ai.repository.ts`.
  - Deleted obsolete UI tests: `tests/component/foundation-status.test.tsx`, `tests/e2e/foundation.spec.ts`, `tests/unit/ai.repository.test.ts`.
  - Preserved and verified reusable infrastructure: Next.js 15 App Router, TypeScript 5, Tailwind CSS, shadcn/ui generic primitives (`button`, `card`, `input`, `label`, `alert`), Supabase SSR auth client/server (`client.ts`, `server.ts`, `middleware.ts`), i18n infrastructure (`vi`/`en`).
  - Implemented clean minimal application shell at `src/app/page.tsx` with user greeting, locale switching, sign-out, session status, and placeholder for M2 core learning modules.
  - Updated auth actions and middleware to redirect to `/` instead of `/foundation`.
- **Completed API Realignment (`lingora-ai/api`):**
  - Confirmed supporting AI service boundary: `/health/*`, `/v1/model/info` (CURRENT); `/v1/srs/schedule`, `/v1/chat/roleplay` (COMPATIBILITY); `/v1/gec/correct` (TARGET contract).
  - Verified 37/37 Pytest tests passing.
- **Tests & Verification:**
  - `lingora-web`: `npm run typecheck` (PASS), `npm run lint` (PASS), `npm run test:unit` (14/14 PASS), `npm run build` (PASS).
  - `lingora-admin`: `npx prisma validate` (PASS), `npx prisma generate` (PASS).
  - `lingora-ai/api`: `py -3.11 -m pytest` (37/37 PASS).
  - Reference scan: 0 broken references to deleted paths.
  - Git diff check: `git diff --check` (PASS).


- **Completed:** Replaced the active implementation sprint with a Phase 0 survey and requirements plan.
- **Completed:** Added `docs/phase-0-survey-requirements.md` covering target groups, survey questions, proposed language/level, MVP, roles, permissions, and pilot success metrics.
- **Completed:** Added evidence from the 15-response survey workbook without treating it as market-representative.
- **Completed:** Added a clearly labeled mock survey report using online benchmark references and the five-language initial scope.
- **Completed:** Clarified `Organizational Manager` as an optional organization/cohort role with restricted scope.
- **Completed:** Reworked the mock survey method to identify 14 independent factors before generating synthetic responses; each factor now has its own questions, mock findings and design implication.
- **Completed:** Finalized role-permission matrix for Administrator, Lesson Creator, Moderator, Operations Staff, Learner and optional Organizational Manager.
- **Completed:** Finalized 19 MVP functions with owners, acceptance criteria, phased release order and explicit out-of-scope list.

## 2026-09-08 — phase-0-puml-reset-and-mvp-design-diagrams

- **Completed:** Removed the old 36-file PlantUML set from `docs/plantuml/` after user approval.
- **Completed:** Created 9 new MVP diagrams covering use cases, role boundaries, learner journey, content approval, lesson completion, publishing, architecture, data model and sitemap.
- **Completed:** Fixed PlantUML syntax in `erd-mvp-learning.puml` (multiline entity format, hide circle, Lesson-Vocabulary link) and logical workflow loop in `activity-content-approval.puml`.
- **Completed:** Refined `use-case-mvp-overview.puml` associations and `sitemap-mvp.puml` portal navigation hierarchy.
- **Completed:** Downloaded `plantuml.jar` and verified all 9 diagrams with exit code 0 (`-checkonly`).
- **Completed:** Rendered all 9 MVP diagrams to PNG in both `docs/plantuml/` and `docs/report/diagrams/`.
- **Tests:** PlantUML compiler validation 9/9 PASS; PNG visual inspection PASS; `git diff --check` PASS.

## 2026-09-08 — phase-0-use-case-overview-refinement-15-uc

- **Completed:** Addressed all 5 points of user review on the Use Case Overview diagram:
  1. Decoupled Administrator (UC-10, UC-11, UC-12, UC-13) and Operations Staff (UC-14 exclusively) into distinct Use Cases, strictly maintaining permission boundaries.
  2. Fixed all line-crossing tangles: Operations Staff connects horizontally to UC-14, Organizational Manager connects horizontally to UC-15 (Cohort Management), Administrator connects upwards to UC-10 without intersecting other actor lines.
  3. Added missing MVP use cases: `UC-03 Take Placement Test` (MVP-03), `UC-10 Publish Approved Content` (Approved -> Published), and `UC-13 View & Audit Security Logs` (MVP-19).
  4. Formulated Principle 4 constraint ("Soạn giả không tự duyệt bài của mình {creator != moderator}") using clean, non-yellow neutral note formatting (`#F8FAFC`, dark slate text).
  5. Formulated Principle 7 optional module ("Phân hệ tùy chọn: Cohort Management") using a dedicated package container and clean neutral note.
- **Completed:** Recompiled `use-case-mvp-overview.puml` to high-resolution PNG (200 DPI) and synchronized to `docs/report/diagrams/`.
- **Completed:** Rebuilt final report Word document `Lingora-Project-1-Lecturer-Format-Final.docx` via `tools/build_lingora_final_report.py`.
- **Tests:** PlantUML compiler exit code 0; visual inspection PASS; docx generation PASS; `git diff --check` PASS.

## 2026-09-08 — phase-0-diagram-note-elimination-and-vietnamese-arrow-localization

- **Completed:** Removed all yellow note blocks (`note ... end note`) across the entire diagram suite (specifically removed from `role-permission-matrix.puml`).
- **Completed:** Standardized Use Case overview diagram (`use-case-mvp-overview.puml`) to canonical `UC-01` to `UC-11` naming without `MVP-XX` prefixes in usecase bubbles, mapping directly to the 6 finalized roles.
- **Completed:** Translated all directional arrow labels, sequence messages, and activity action steps to natural Vietnamese, while strictly retaining technical entity/actor names in English (`Learner`, `Lesson Creator`, `Moderator`, `Administrator`, `Operations Staff`, `Organizational Manager`).
- **Completed:** Refined `system-architecture-mvp.puml` to a clean left-to-right flow (`Learner/Staff` -> `Client Applications` -> `Application Services` -> `Backend Services (Supabase)`), removing tangled lines and replacing yellow tint with slate.
- **Completed:** Re-rendered all diagrams to high-resolution PNGs (200 DPI) in `docs/plantuml/` and synchronized to `docs/report/diagrams/`.
- **Completed:** Rebuilt final report DOCX (`docs/report/Lingora-Project-1-Lecturer-Format-Final.docx`) using `tools/build_lingora_final_report.py`.
- **Tests:** PlantUML compiler exit code 0; visual inspection of all 9 PNG diagrams confirmed clean aesthetics with zero yellow notes; docx generator PASS; `git diff --check` PASS.

## 2026-09-08 — full-uc-ac-completion-and-diagram-aesthetic-polish

- **Completed:** Restored full 36-diagram Software Engineering suite alongside 9 Phase 0 MVP diagrams (45 diagrams total).
- **Completed:** Optimized diagram layout aesthetics ("dễ nhìn"): eliminated looping spline paths in `use-case-overview.puml` and `use-case-learner.puml`, removed cross-boundary associations, aligned columns, enforced 200 DPI, Segoe UI typography, roundCorner 8, and soft academic pastel colors.
- **Completed:** Added full detailed specifications and acceptance criteria for all 10 Use Cases (`UC-01` to `UC-10`) in `docs/06-system-analysis.md` (Section 4.2), covering Objective, Actor, Preconditions, Main Flow, Alternative Flows, and Acceptance Criteria.
- **Completed:** Harmonized and verified full contiguous 10 User Stories and Acceptance Criteria (`US-01` to `US-10`) in `docs/report/lingora-project-1-lecturer-format.md` (Section 1.8) and `docs/report/lingora-requirements-and-use-cases.md`.
- **Completed:** Compiled and validated 45/45 PlantUML diagrams with exit code 0 (`-checkonly`).
- **Completed:** Rendered 45 high-resolution PNGs (200 DPI) in `docs/plantuml/` and synchronized to `docs/report/diagrams/`.
- **Completed:** Rebuilt final report Word document `docs/report/Lingora-Project-1-Lecturer-Format-Final.docx` via `tools/build_lingora_final_report.py`.
- **Tests:** PlantUML compiler check 45/45 PASS; PNG rendering 45/45 PASS; docx builder PASS; `git diff --check` PASS.

### Date

`2026-08-23`

### Task

`global-terminology-replacement - Remove AI/ML/GEC Acronyms & Standardize Software Engineering Terminology`

### Completed

- Executed repository-wide global terminology replacement across all deliverables (`docs/report/`, `docs/plantuml/`, `.docx`, `.pptx`):
  - Strictly removed all instances of `GEC`, `T5-small`, `T5`, `AI`, `ML`, `Machine Learning`, `NLP`, `Trí tuệ nhân tạo`, and `AI Service`.
  - Replaced with standard Software Engineering terminology: "Kiểm tra ngữ pháp" (Grammar Checker), "Thuật toán xử lý văn bản" (Text processing algorithm), "Mô-đun kiểm tra ngữ pháp nội bộ" (Internal Grammar Module).
  - Renamed UC-06 to "UC-06: Luyện viết tình huống và kiểm tra ngữ pháp" (Practice Scenario Writing & Grammar Check).
  - Simplified UC-06 description: "Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi."
  - Renamed 3 PlantUML diagram files: `activity-writing-grammar.puml`, `sequence-writing-grammar.puml`, `dfd-writing-grammar.puml`.
- Compiled and rendered 22/22 PlantUML technical diagrams with exit code 0.
- Rebuilt all 4 Word DOCX reports and PowerPoint presentation decks.
- Programmatic regex audit verified **0 forbidden term violations** across all deliverable files.

### Tests

- `PLANTUML-TERMINOLOGY-001`, `PLANTUML-RENDER-002`, `DELIVERABLES-TERMINOLOGY-AUDIT-003`, `DOCX-REBUILD-CLEAN-004`, `PPTX-REBUILD-CLEAN-005`: All PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-23`

### Task

`docx-audit-and-scope-harmonization - Audit & Synchronize DOCX Report & Markdown Scope`

### Completed

- Thoroughly audited `Lingora-Project-1-Lecturer-Format-Final.docx` and canonical Markdown reports (`lingora-project-1-lecturer-format.md`, `lingora-requirements-and-use-cases.md`, `lingora-project-1-requirements-report.md`, `evidence-register.md`).
- Fully harmonized scope for Tasks 1 & 3:
  - Confirmed all 10 Use Cases (`UC-01` to `UC-10`) as official, fully active system features.
  - Eliminated all lingering hesitant phrases, `[PROPOSED]` remnants, "chưa triển khai", and deferred disclaimers.
  - Updated User Stories 9 and 10 with clear, positive, and complete User Stories and Acceptance Criteria.
  - Synced survey quantitative findings (N=15, 100% forgetting vocab, 93.3% adaptive, 86.7% habit drop, 80% SRS 4.13/5, 66.7% grammar feedback) across all reports.
  - Formatted 2 external actors (`Learner`, `Admin`), internal GEC processing, and 22 PlantUML technical diagram references.
- Rebuilt `Lingora-Project-1-Lecturer-Format-Final.docx` using `tools/build_lingora_final_report.py` under Python 3.11 (`python-docx`).
- Verified DOCX via programmatic XML inspection: 0 forbidden/outdated markers, 10 active UCs, clean Times New Roman typography and IEEE 830 structure.

### Tests

- `DOCX-REBUILD-FINAL-001`, `DOCX-CONTENT-AUDIT-001`, `GIT-HYGIENE-002`: PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-23`

### Task

`integrate-survey-dataset-metrics - Integrate Quantitative Survey Metrics into Presentation Slides`

### Completed

- Extracted and analyzed survey responses across 24 questions from `D:\btl\Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.
- Integrated high-impact quantitative survey percentages into Slides 4, 7, and 8:
  - Slide 4: 100% người học hay quên từ vựng; 86.7% từng đứt gãy thói quen học tập sau 1-2 tuần; 66.7% thiếu công cụ sửa lỗi ngữ pháp.
  - Slide 7: Thống kê chi tiết khảo sát diện rộng (100% quên từ, 93.3% cần đề xuất bài ôn tự động, 86.7% từng nản chí, 80% cấp thiết ôn SRS 4.13/5, 66.7% sửa lỗi ngữ pháp) đối chiếu song song với 9 phỏng vấn chuyên sâu.
  - Slide 8: 3 thẻ chỉ số định lượng nổi bật (80% Công việc, 73.3% Bài tập điền từ, 66.7% Theo dõi điểm số) và 5 nhóm nhu cầu trọng tâm làm cơ sở thiết kế Use Case.
- Re-rendered all 19 slides to PNG and synchronized across PPTX deliverables.

### Tests

- `SURVEY-ANALYTICS-001`, `PPT-SURVEY-INTEGRATION-001`: PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-23`

### Task

`strip-proposed-and-redesign-presentation - Strip Proposed Disclaimers & Redesign Presentation Deck`

### Completed

- Stripped all `[PROPOSED]` tags, `[PROPOSED / NOT IMPLEMENTED]` markers, and yellow "not implemented" note boxes across all 22 PlantUML files (`use-case-overview.puml`, `use-case-learner.puml`, `activity-placement-test.puml`, `activity-achievements.puml`, `sequence-placement-test.puml`, `sequence-achievements.puml`, `erd-baseline-and-proposed.puml`).
- Recompiled and rendered all 22 PlantUML diagrams (22/22 PASS).
- Rebuilt 19-slide presentation deck (`docs/report/Lingora-Project-1-Requirements-Presentation-V2.pptx`):
  1. Removed orange highlight and footer disclaimers from UC-09 and UC-10 (styled identically to UC-01..UC-08).
  2. Deleted all top-right "Slide XX" badges across all 19 slides.
  3. Removed bottom warning/disclaimer banners from content slides.
  4. Simplified Section Divider slides (Slides 3, 6, 12, 16) to keep ONLY prominent Section Title.
  5. Redesigned Slide 19 to a single clean centered closing card.
- Rendered all 19 slides to PNG in `D:/btl/tmp/timhieupaper-template-audit/revised-render` and verified visual appeal.

### Tests

- `PLANTUML-STRIP-001`, `PLANTUML-STRIP-002`, `PPT-REDESIGN-CLEANUP-001`, `GIT-HYGIENE-001`: PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-23`

### Task

`standardize-plantuml-english-technical-terminology - Standardize PlantUML English Technical Terminology`

### Completed

- Standardized actors across all 22 PlantUML files to English technical names (`Learner`, `Admin`).
- Standardized Use Case titles across all diagrams to English (`UC-01 Authenticate & Manage Session` through `UC-10 Earn Achievements & Badges`), without model branding inside UC bubbles.
- Standardized lifelines, components, packages, entities and data stores to English technical terms (`Lingora Web Learning System`, `PostgreSQL DB`, `Grammar Correction Module`, `PHYSICAL BASELINE - 15 ACTIVE BUSINESS MODELS`, `PROPOSED / NOT IMPLEMENTED`).
- Maintained natural, clear Vietnamese action steps in Activity diagrams and Vietnamese message flow text on Sequence arrows for presentation readability.
- Verified compilation and rendered all 22 diagrams (22/22 PASS).

### Tests

- `PLANTUML-STD-001` .. `PLANTUML-STD-003`: All test cases PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-23`

### Task

`redesign-requirements-presentation-deck-with-visual-cards-and-image-placeholders - Presentation Deck Redesign with Cards & Image Placeholders`

### Completed

- Reviewed `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` for academic and visual adequacy.
- Preserved 100% template fidelity: UTC university logo, purple-yellow header banner, and gray wave footer preserved across all 19 slides.
- Upgraded typography to modern Segoe UI with responsive single-line header calculations.
- Replaced plain, heavy rectangular blocks with clean modern card layouts, pill badges, and structured grids.
- Added dedicated image placeholder zones with dashed-style borders, camera/image icons, and explicit guidance labels on key slides (Slides 1, 4, 7, 8, 10, 11, 14, 16, 17).
- Rebuilt PPTX deliverable using `@oai/artifact-tool` and verified layout bounds across all 19 slides (19/19 checks PASS).

### Tests

- `PPT-REDESIGN-001` .. `PPT-REDESIGN-006`: All test cases PASS in `logs/test-log.md`.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-17`

### Task

`requirements-system-analysis-documentation-recovery - Requirements & System Analysis Documentation Recovery`

### Completed

- Created [`docs/06-system-analysis.md`](file:///d:/btl/docs/06-system-analysis.md) covering problem statement, 6 core capabilities, stakeholder/actor catalog, system boundaries (Web learner client `lingora-web`, Next.js Route Handler BFF AI proxy, Supabase BaaS, stateless FastAPI microservice), full use-case catalog, detailed specifications for 8 Use Cases (`UC-01` .. `UC-08`), sequence flows, assumptions/constraints, and audit findings register.
- Created [`docs/07-data-dictionary.md`](file:///d:/btl/docs/07-data-dictionary.md) containing implementation-grounded ERD (17 models, 24 FKs), attribute constraints dictionary, private storage buckets (`course-media`, `chat-audio`), and logical-vs-applied schema mismatch table.
- Updated [`docs/05-traceability-matrix.md`](file:///d:/btl/docs/05-traceability-matrix.md) mapping all 26 requirements (Must/Nice) to Use Cases, components, database entities, and test evidence.
- Updated canonical cross-references in `docs/00-master-plan.md`, `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/QUICK-REF.md`, and [`docs/project-1/README.md`](file:///d:/btl/docs/project-1/README.md).
- Preserved locked decisions: Option `6b` (Web Push + scheduler) is explicitly `DEFERRED`; Option `6d` (In-app reminder) is a later milestone feature; 0 changes to database schema, Prisma, migrations, or API contracts.

### Tests

- `RSA-T-001` .. `RSA-T-009`: All 9 test and validation cases PASS in `logs/test-log.md`.
- `git diff --check`: Clean (0 whitespace/conflict errors).
- `git diff --stat HEAD -- lingora-web lingora-ai lingora-admin/prisma docs/03-api-contract.md`: Empty (0 changes in frozen paths).

### Commit

`docs: recover requirements and system analysis specifications (rsa-doc)`

---

### Date

`2026-08-17`

### Task

`m1.5-jwt-verifier-amendment-supabase-jwks-es256 - Supabase JWKS / ES256 Compatibility Amendment`

### Completed

- Extended `lingora-ai/api/app/config.py` with `SUPABASE_URL` and `SUPABASE_JWKS_URL` properties resolving `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
- Updated `lingora-ai/api/app/auth.py` to support modern Supabase `ES256` ECDSA asymmetric JWT verification using `jwt.PyJWKClient` (zero new dependencies).
- Maintained backward compatibility for `HS256` symmetric JWT verification against `SUPABASE_JWT_SECRET` for offline/test environments.
- Implemented robust fail-closed handling on unknown `kid`, invalid signature, expired token, unsupported algorithm (`none`, etc.), malformed token, missing `sub`, and invalid `role` / `aud`.
- Added 10 new security and error condition tests in `tests/test_auth.py` covering ES256 valid token, missing kid, unknown kid, signature mismatch, expiration, missing sub, invalid role, and network failure.
- Ran full test suite in `lingora-ai/api`: 37/37 Pytest PASS (0 regressions).
- Ran live end-to-end verification against live Supabase GoTrue Auth token: verified HTTP 200 `is_mock: true` responses for both `/v1/srs/schedule` and `/v1/chat/roleplay`.
- Confirmed zero changes to `lingora-web/`, database schema, Prisma, migrations, or API contract.

### Tests

- `M1.5-AMEND-T-001`: 37/37 Pytest passed in 0.19s in `lingora-ai/api/tests/`.
- `M1.5-AMEND-T-002`: Live Supabase ES256 token verification PASS on `/v1/srs/schedule` and `/v1/chat/roleplay`.
- `M1.6W-T-006-RERUN`: SRS Next Route Handler protected hop PASS (HTTP 200, `is_mock: true`).
- `M1.6W-T-007-RERUN`: Roleplay Next Route Handler protected hop PASS (HTTP 200, `is_mock: true`).
- `M1.5-AMEND-T-003`: Secret & log redaction inspection PASS (0 secrets logged).
- `M1.5-AMEND-T-004`: Scope & boundary check PASS (0 changes in Web, DB, schema, RLS).

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-15`

### Task

`m1.6-android-application-foundation - Native Android Application Foundation Implementation`

### Completed

- Scaffolded buildable Java 17 native Android project under `lingora-android/` with package `com.pnttung.lingora`, AGP 8.7.0, Gradle 8.9 wrapper, `minSdk 24`, and `targetSdk 35`.
- Configured secure build injection in `app/build.gradle` reading `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `AI_API_BASE_URL` from ignored `local.properties` into `BuildConfig`.
- Implemented debug-only network security config in `app/src/debug/res/xml/network_security_config.xml` allowing cleartext to `10.0.2.2:8000` (emulator host), while keeping release cleartext disabled.
- Implemented domain models and DTOs in `data/remote/dto/` matching exact M1.5 canonical contract schemas for `/health/ready`, `/v1/srs/schedule`, `/v1/chat/roleplay`, and common `{ "error": { "code", "message", "detail" } }` error envelope.
- Implemented secure token storage in `util/SessionStore.java` using `EncryptedSharedPreferences` (with JVM unit-test fallback).
- Implemented `util/AuthInterceptor.java` and `util/TokenAuthenticator.java` handling automatic single-refresh and retry on HTTP 401 without infinite loops.
- Implemented `data/remote/RetrofitProvider.java` creating dedicated OkHttp/Retrofit clients for Supabase Auth and FastAPI AI mock server.
- Implemented `data/repository/AuthRepository.java` and `data/repository/AiConnectivityRepository.java`.
- Established Room 2.6.1 compile-time boundary with `data/local/package-info.java` marker (0 speculative entities per Decision M1.6-D4).
- Implemented UI layer with `MainActivity`, `LoginFragment`, `RegisterFragment`, `FoundationStatusFragment`, `AuthViewModel`, and `FoundationStatusViewModel`.
- Implemented bilingual UI strings in `values/strings.xml` (Vietnamese default) and `values-en/strings.xml` (English).
- Created comprehensive unit test suite in `app/src/test/java/com/pnttung/lingora/` covering DTO contracts, AuthRepository, TokenAuthenticator loop guard, and AiConnectivityRepository (12/12 tests PASS).
- Verified `gradlew assembleDebug` successfully produces `app-debug.apk`.
- Verified M1.5 FastAPI mock runtime regression suite (27/27 Pytest PASS).

### Problems

- System JDK was early-access Java 25 from Canary Android Studio, which caused Gradle 8.9 ASM bytecode compatibility error (major version 69).
- PyCharm's bundled JBR was a headless JRE missing `jlink.exe` required by AGP JdkImageTransform for SDK 35.

### Solution

- Installed official OpenJDK 17 LTS (Temurin-17.0.12+7) to `D:\Android\jdk-17` with full standard toolchain. Builds and tests execute cleanly under Java 17.

### Tests

- `M1.6-T-001` .. `M1.6-T-010` — all 10 test cases PASS in `logs/test-log.md`.
- `gradlew testDebugUnitTest`: 4 suites, 12 test cases executed, 0 failures, 0 skipped (`BUILD SUCCESSFUL in 31s`).
- `gradlew assembleDebug`: Debug APK generated at `app/build/outputs/apk/debug/app-debug.apk` (`BUILD SUCCESSFUL in 31s`).
- `py -3.11 -m pytest -v`: 27/27 passed in 0.15s in `lingora-ai/api/` (0 regressions).
- `git diff --check`: PASS (0 whitespace errors).
- Secret hygiene scan: `local.properties` and `.gradle/` ignored, 0 credentials tracked.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-17`

### Task

`m1.6w-web-learner-foundation`

### Completed

- Created the independent Next.js 15 learner project under `lingora-web/` with pinned lockfile, Tailwind 4,
  minimal copied UI components, TanStack Query provider, Vitest and Playwright.
- Implemented Browser → Server Action → Supabase Auth → explicit httpOnly cookie → middleware/Server Component
  session flow. No authenticated browser Supabase client or browser token persistence was added.
- Implemented fixed server-only `/api/ai/srs` and `/api/ai/chat` handlers with 8-second abort, current server
  session JWT forwarding, bounded canonical input, response structural validation and safe error mapping.
- Added vi/en catalogs, login/register/foundation UI, responsive layouts, keyboard/focus/live-state semantics,
  and localized recoverable Auth/AI errors.
- Added 19 unit/component tests and 12 Playwright cases. Live Supabase Auth/registration passed with temporary
  exact-ID fixtures and residue `0`.

### Problems

- `next-env.d.ts` was omitted from the initial approved allowlist; implementation returned to REVIEW and the
  human approved the one-file amendment before Next generated it.
- jsdom 30 required Node 24.15 while the approved environment is Node 24.14; pinned jsdom 29.0.1.
- Next 15's `next lint` is deprecated; the project uses the approved ESLint dependency directly.
- Playwright browser runtime was absent and was installed with `npx playwright install chromium`.
- `npm audit` reports nested Next 15 PostCSS/Sharp advisories. The only offered fix is Next 16, outside scope;
  the absent vulnerable paths are documented as a foundation mitigation.
- The workspace has no configured `SUPABASE_JWT_SECRET`, so the live protected Next → M1.5 SRS/Roleplay hop
  cannot be observed. T-006 and T-007 remain BLOCKED; the task stays TESTING and is not committed/DONE.
- Follow-up: after the secret was supplied and M1.5 restarted, both requests reached FastAPI but returned
  `401`. Sanitized token-header inspection showed live Supabase issues ES256 JWTs with a `kid`, while M1.5
  permits HS256 only. T-006/T-007 are now FAIL and the task returned to REVIEW.

### Solution

- Kept all auth operations server-side, explicitly set cookie attributes, separated Edge middleware from
  `next/headers`, fixed the AI host/path, bounded histories/text/UUIDs, and treated upstream JSON as untrusted.
- Used Admin-boundary service role only for temporary fixture creation/cleanup; it never entered Web code,
  browser state, screenshots, logs or committed environment files.
- Kept Requirements & System Analysis / Documentation Recovery outside implementation and documented it as
  the mandatory milestone after M1.6W.

### Tests

- `M1.6W-T-001` through `M1.6W-T-013` recorded in `logs/test-log.md`.
- PASS: T-001..T-005 and T-008..T-013.
- BLOCKED by missing external environment: T-006 and T-007.

### Commit

`PENDING — task returned to REVIEW after live ES256/HS256 runtime-boundary mismatch`

---

### Date

`2026-08-15`

### Task

`m1.5-fastapi-mock-runtime - Stateless AI FastAPI Mock Service Implementation`

### Completed

- Implemented the stateless FastAPI mock service structured as `lingora-ai/api/app/` package with `MOCK_MODE=true` baseline.
- Implemented offline HS256 JWT auth validation in `app/auth.py` verifying Bearer tokens against `SUPABASE_JWT_SECRET` with zero network/DB calls.
- Implemented deterministic SRS prediction service (`POST /v1/srs/schedule`) using SHA-256 hash on `vocabulary_id` returning `mock-srs-v1` and `mock-rule-v1` metadata.
- Implemented hotel booking roleplay chat service (`POST /v1/chat/roleplay`) with canonical fixed reply per contract (`"Sure! Could you tell me the check-in date you'd like?"`).
- Implemented model metadata (`GET /v1/model/info`) and health probes (`/health/live`, `/health/ready`, `/health`) with degraded 503 response and `MODEL_UNAVAILABLE` error when `MOCK_MODE=False`.
- Standardized error handling to the canonical error envelope (`{"error": {"code": str, "message": str, "detail": object}}`) across all 4xx/5xx responses.
- Removed wildcard CORS, unneeded scenario endpoints, and unapproved grammar scorer from M1.5 scope.
- Implemented and executed 24 pytest unit/integration tests with 100% PASS rate in `lingora-ai/api/tests/`.

### Problems

- Starlette 404 unrouted requests bypassed `fastapi.HTTPException` handler; resolved by registering `starlette.exceptions.HTTPException` handler in `main.py`.

### Solution

- Centralized Starlette & FastAPI exception handlers to ensure 100% envelope conformance.

### Tests

- `py -3.11 -m pytest -v`: 27 passed in 0.16s (all suites PASS).
- `git diff --stat lingora-android/ lingora-admin/ docs/`: 0 changes (forbidden paths strictly empty).
- `git diff --check`: PASS.

### Commit

`feat(ai): implement stateless fastapi mock runtime for srs and chat (m1.5)`

---

### Date

`2026-08-15`

### Task

`m1.4-deterministic-seed - Independent audit corrective implementation`

### Completed

- Removed all draft-sentinel translations from the deterministic manifest while preserving the draft Course, two draft Lessons, and draft ChatScenario.
- Corrected the approved persistent translation counts to `course_translations=2`, `lesson_translations=10`, and `chat_scenario_translations=2`.
- Added observed RLS checks for anonymous denial and ADMIN draft visibility.
- Added direct learner INSERT/UPDATE/DELETE denial coverage for `UserProgress`, `UserVocabSrs`, and `ReviewLog`, including before/after residue/state checks.
- Added post-`record_review` database assertions for SRS interval/recall/counters, ReviewLog insertion/prior interval, Profile streak/activity date, and non-owner atomic no-change behavior.
- Replaced cleanup discovery by email prefix with exact created/prior UUID targets and a guard that refuses prior UUIDs not belonging to an M1.4 test identity.
- Removed exactly five erroneous translation rows left by the pre-audit seed (`1` course, `3` lesson, `1` scenario translation); no other project data was deleted.

### Problems

- The independent audit found the implementation had broadened the approved translation manifest to `3/13/3` and lacked four required security/state assertions.
- Initial Prisma checks and database inventory attempts were blocked by sandbox network/TLS restrictions. They were rerun with approved external access; no PASS was inferred from the failed attempts.

### Solution

- Restored the immutable approved manifest and extended the harness at the existing Auth/PostgREST/RPC boundaries without changing schema, migrations, RLS, grants, triggers, RPCs, Storage, dependencies, or API contracts.
- Kept deterministic UUIDv5, fixed epoch, transaction behavior, collision checks, idempotency, and exact-target cleanup intact.

### Tests

- `npm run prisma:format`: PASS; schema unchanged in Git.
- `npm run prisma:validate`: PASS.
- `npx prisma migrate status --schema prisma/schema.prisma`: PASS; 3 migrations, database up to date.
- `npm run prisma:seed` twice: PASS/PASS.
- `npm run test:m1_4`: PASS, `34/34`, with final counts `2/10/2` and exact residue `0/0/0/0/0/0/0`.
- Detailed observed evidence: `M1.4-FIX-T-001` through `M1.4-FIX-T-004` in `logs/test-log.md`.

### Commit

`PENDING - no commit authorized`

---

### Date

`2026-08-15`

### Task

`m1.4-deterministic-seed - Deterministic Bootstrap Seed & RLS Verification`

### Completed

- Implemented `lingora-admin/prisma/seed.js` using fixed UUIDv5 identifiers (namespace `2b8e3b9b-3c04-5b7b-8f67-0d1f6f3d9e4a`) and static timestamps (`2026-01-01T00:00:00.000Z`).
- Seeded exactly: 2 languages (`vi`, `en`), 2 courses (`english-a1` published, `visibility-draft` draft), 7 lessons (5 published with `vi`/`en` translations, 2 draft sentinels), 50 vocabularies with 100 translations, 50 `lesson_vocabulary` junctions, 15 exercises (`MCQ`, `FILL_BLANK`, `REORDER`), and 2 chat scenarios (`hotel_booking` published, `visibility-draft` draft).
- Configured Prisma seed entry in `lingora-admin/package.json`.
- Implemented and executed verification test harness `lingora-admin/prisma/m1_4_seed_test.js`.
- Verified 19/19 test assertions: exact counts, idempotency, published/draft RLS visibility, learner SRS card ownership isolation, `record_review` RPC invocation on owned vs non-owned cards, and exact cleanup with zero residue.

### Problems

- Interactive transaction timeout in Prisma default (5s) was too short for sequential remote upserts over connection pooler.
- Resolved by configuring `{ maxWait: 20000, timeout: 60000 }` on `$transaction`.

### Solution

- Configured transaction timeout and verified clean idempotent execution.

### Tests

- `npm run prisma:validate`: PASS.
- `npm run prisma:seed`: PASS.
- `node prisma/m1_4_seed_test.js`: 19/19 PASS, 0 FAIL.
- `git diff --stat`: changes strictly confined to authorized files (`package.json`, `seed.js`, `m1_4_seed_test.js`, logs, plans).
- Forbidden paths diff empty (`lingora-android/`, `lingora-ai/`, `schema.prisma`, `migrations/`, `docs/01`, `docs/03`).

### Commit

`PENDING - no commit authorized per task boundary`

---

### Date

`2026-08-15`

### Task

`canonical-docs-full-scope-alignment - Align docs/00, 02, 04, 05 With Approved ADR-006`

### Completed

- Aligned canonical documents (`docs/00-master-plan.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`) with approved `ADR-006`.
- Restored assignment scope: `GRAMMAR` and word-level `LISTENING` added to approved exercise definitions (`P1-FR-012`, `P1-FR-013`), daily study goal mapped (`P1-FR-014`), Android-local reminder mapped (`P1-FR-015`).
- Preserved all structural exclusions: no separate grammar table, no server-side notification entity, zero new tables or columns added.
- `schema.prisma`, migrations, RLS, Storage, and application code remained untouched.

### Problems

- Stale exclusion bullets in canonical documents previously contradicted the approved ADR-006 restoration.

### Solution

- Replaced stale exclusion clauses with normative ADR-006 scope descriptions and verified that all requirement mappings and test IDs are consistent.

### Tests

- `DOCS-ALIGN-T-001` … `DOCS-ALIGN-T-008` — all PASS in `logs/test-log.md`.
- `git diff --numstat -- docs/`: `docs/00` +2/-2, `docs/02` +11/-6, `docs/04` +6/-5, `docs/05` +10/-6.
- `git diff --stat -- lingora-admin/ lingora-android/ lingora-ai/ docs/01-architecture.md docs/03-api-contract.md`
  returned empty output with exit `0` — no schema, migration, RLS, dependency, or source change.
- Stale exclusion phrase scans returned 0 hits for all five retired clauses.
- Preserved-exclusion scans returned non-zero counts for `QuizAttempt`, `device-token`,
  `reminder-schedule`, `standalone flashcard`, `pronunciation`, `MATCHING`, `WRITING`, and
  `grammatical_acceptability_score`.
- `P1-FR-012` … `P1-FR-015` present in both `docs/02` and `docs/05`; `P1-FR-001` … `P1-FR-011`
  present and unrenumbered.
- `enum ExerciseType` in `lingora-admin/prisma/schema.prisma:24-28` verified still
  `{ MCQ FILL_BLANK REORDER }`.
- `git diff --check` exit `0` after stripping two trailing EOF blank lines.
- Closure gate `DOCS-ALIGN-T-008`: final `git diff --stat` is 9 files / 553 insertions / 41 deletions
  (four canonical docs plus `AGENTS.md`, `logs/*`, `plans/current-task.md`); forbidden-path diff still
  empty; completed plan archived to
  `plans/archive/2026-08-15-canonical-docs-full-scope-alignment-DONE.md`, `cmp` byte-identical to the
  `DONE` plan; no commit created.

### Commit

`PENDING - no commit authorized by the approved plan`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 SEC-D8 two-bucket size-enforcement implementation`

### Completed

- Applied additive migration `202608140003_storage_two_bucket_size_enforcement` without modifying either original migration.
- Created private `lingora-avatars` with the 5,242,880-byte JPEG/PNG/WebP boundary and restricted `lingora-media` to 10,485,760-byte MPEG/WAV audio.
- Moved only the three avatar policies to `lingora-avatars`; retained the three vocabulary-audio policies and all ownership, publication, anonymous-denial and no-overwrite semantics.
- Updated the HTTP harness for bucket-specific operations, exact boundary uploads and exact multi-bucket cleanup.
- Updated canonical Storage and traceability documentation to the approved two-bucket contract.

### Problems

- The first read-only preflight command lost JavaScript quotes under PowerShell, and a later evidence query initially omitted local `.env` loading. Neither command reached a mutation path; both were rerun through Node stdin with non-printing environment loading.
- The previous one-bucket configuration could not enforce the avatar limit because its bucket-level maximum had to remain 10 MB for audio.

### Solution

- Enforced the distinct limits using separate private bucket configurations while keeping RLS responsible for actor/path/visibility authorization.
- Added a migration guard that stops application if retained avatar objects are found in the old bucket; the approved preflight found no objects or avatar URL references requiring movement.

### Tests

- Full live harness: `25` PASS, `0` FAIL.
- Avatar boundary: `5,242,880` bytes HTTP `200`; `5,242,881` bytes HTTP `400` and absent.
- Audio boundary: `10,485,760` bytes HTTP `200`; invalid image MIME HTTP `400` and absent.
- Independent cleanup: `0` Auth users, `0` Profiles, `0` Storage objects and `0` test courses.
- Prisma validate/status PASS with three current migrations; original M1.2/M1.3 hashes unchanged; credential-value scan false; syntax and `git diff --check` PASS.
- Post-implementation security/code-quality review found no policy, cleanup, scope or compatibility issue.
- Final T-001 through T-014 audit passed, so the active M1.3 task moved from `TESTING` to `DONE`.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-15`

### Task

`public-snapshot-staging`

### Completed

- Created the isolated non-Git snapshot at `staging/lingora-workspace-public/` from the approved allowlist.
- Authored public-safe root/documentation READMEs and a snapshot-specific `.gitignore`.
- Preserved Prisma schema, three migrations, migration lock, npm lockfile, and M1.3 security test.
- Verified secrets, private references, file inventory, byte identity, npm install, and Prisma validation.

### Problems

- Initial Prisma validation was blocked by sandbox engine download, then exposed the expected missing
  `DATABASE_URL` because real credentials are intentionally excluded.

### Solution

- Retried the official engine download with approval and validated using a non-routable localhost
  placeholder URI. No migration ran and no database connection/state change occurred.

### Tests

- `PUBLIC-SNAPSHOT-T-001` through `PUBLIC-SNAPSHOT-T-004`: PASS.
- `PUBLIC-SNAPSHOT-T-005`: N/A documentation-only review with observed evidence.

### Commit

`PENDING - user explicitly requested no commit or push`

---

### Date

`2026-08-15`

### Task

`agents-task-routing-clarifications`

### Completed

- Added the approved nine-entry `Task routing` map to `AGENTS.md`.
- Clarified when `HANDOFF.md` is read and that it is not reread during an uninterrupted task/session.
- Clarified that canonical documents are opened for task-required detail, not to reconfirm QUICK-REF facts.
- Corrected master-plan routing wording so §§0.4-0.5 are available when their listed conditions apply.

### Problems

- The initial closure scope excluded mandatory TEST/LOG/HANDOFF files.

### Solution

- Returned the task to REVIEW, obtained a human-approved closure-only amendment, and limited the
  additional changes to evidence, lifecycle logging, and handoff state.

### Tests

- `AGENT-ROUTING-T-001` PASS in `logs/test-log.md`.
- `git diff --check -- AGENTS.md` exited `0`; all nine mappings and required wording checks passed.

### Commit

`PENDING - user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 SEC-D8 two-bucket semantic amendment approval`

### Completed

- Recorded human approval of the two-private-bucket SEC-D8 PA2 correction.
- Approved `lingora-avatars` at 5 MB for learner-owned avatars and retained `lingora-media` at 10 MB for ADMIN/service-managed vocabulary audio.
- Preserved all ownership, anonymous-denial, direct authenticated RLS, no-overwrite, delete and published-content semantics.
- Created an immutable approved amendment snapshot and recorded the decision in ADR-005.

### Problems

- The one-bucket implementation cannot enforce distinct 5 MB avatar and 10 MB audio limits at bucket level; live HTTP evidence showed the RLS metadata-size check did not block an oversized avatar.

### Solution

- Approved bucket separation by media class. Implementation remains gated behind a separate IMPLEMENT instruction and must use an additive corrective migration.
- Made no migration, SQL, schema, policy, code, `.env`, dependency or database-state change in this approval phase.

### Tests

- Approval consistency and immutable-snapshot checks recorded in `logs/test-log.md`.
- T-008 remains FAIL until the approved correction is implemented and the HTTP matrix passes.

### Commit

`PENDING - no commit; approval only`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 HTTP Storage rerun after credentials configured`

### Completed

- Confirmed only the three required Supabase variables were non-empty without displaying values.
- Corrected the approved test harness precondition for the missing-`vi` rollback test, sanitized network-error output, and made exact cleanup respect the `Profile -> Auth user` delete order required by the existing `ON DELETE RESTRICT` constraint.
- Ran the real Supabase Auth/Storage HTTP matrix with isolated identities and unique objects. Twenty-one subtests passed, including all T-001..T-007 and T-009..T-013 regressions and all T-008 cases except avatar size enforcement.
- Ran cleanup-only verification and observed zero temporary Auth users, Profiles and owned Storage objects.

### Problems

- The SEC-D8 PA2 5 MB avatar limit still fails end to end: a `5,242,881` byte `image/png` upload returned HTTP `200`, and the object existed afterward.
- The sandboxed first run could not open the Prisma TLS connection (`No credentials are available in the security package`); the approved live run was therefore executed outside the sandbox.
- One later live retry encountered a sanitized transient `Supabase HTTP request failed`; cleanup completed and residue verification remained zero.
- `npx prisma validate` initially could not fetch the engine through the sandbox proxy; the same command passed outside the sandbox.

### Solution

- Preserved the failing HTTP/object-state evidence and returned the task to `REVIEW` under the semantic-gap stop rule.
- Made no migration, schema, RLS/Storage policy, Auth/RPC, bucket, dependency, `.env`, hook or business-semantics change.
- Did not audit M1.3 to `DONE` because T-008 is not fully PASS.

### Tests

- HTTP matrix: 21 PASS, `M1.3-T-008-HTTP-VALIDATION` FAIL on oversized avatar acceptance.
- Exact cleanup: PASS with `0` Auth users, `0` Profiles and `0` owned Storage objects.
- Regression: T-001A, T-001..T-007 and T-009..T-013 PASS; six expected Storage policies present.
- Hygiene: Node syntax PASS; Prisma schema validate PASS; M1.2/M1.3 hashes unchanged; credential-output review PASS; `git diff --check` PASS with the pre-existing README CRLF warning.

### Commit

`PENDING - no commit; task returned to REVIEW`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 Supabase Storage HTTP test infrastructure amendment`

### Completed

- Confirmed the amendment is approved, all three required Supabase variables are non-empty without exposing values, and M1.2/M1.3 migration hashes are unchanged.
- Updated only the approved test script to use real Supabase Auth and Storage HTTP requests with isolated users, JWTs, unique object paths, sanitized status/state evidence and exact cleanup.
- Observed PASS evidence for owner avatar upload/read/new-filename replacement/delete, cross-owner and anonymous denial, invalid path/MIME denial, no-overwrite, learner audio mutation denial, service audio management and published-parent-chain audio visibility.
- Removed all attempted Storage objects and all three test Auth/Profile identities; final exact-target counts were zero.

### Problems

- The approved 5 MB avatar limit failed end to end: a `5,242,881` byte `image/png` upload returned HTTP 200 and the object existed.
- Supabase Auth Admin deletion returned HTTP 500 for the three test identities; exact PostgreSQL cleanup was required and verified.
- Regression subtest `M1.3-T-001A` observed `vi_count=0` before setup and failed its rollback assertion; the other rerun database/RPC checks completed successfully.

### Solution

- Treated the oversized upload as a new semantic enforcement gap, returned the task to `REVIEW`, and made no policy, migration, bucket, schema or business-semantics change.
- Kept the failing evidence explicit and did not mark T-008 or M1.3 PASS/DONE.

### Tests

- HTTP avatar positive/authz, anonymous denial, audio write/read and cleanup: PASS with observed status and existence evidence.
- `M1.3-T-008-HTTP-VALIDATION`: FAIL because oversized avatar upload succeeded.
- Regression rerun: T-002..T-007 and T-009..T-013 PASS; T-001A FAIL.
- Final hygiene: Prisma validate and migration status PASS with two current migrations; residue counts were 0 Auth users, 0 Profiles, 0 Storage objects and 0 test courses; migration hashes unchanged; secret redaction scan and `git diff --check` PASS.

### Commit

`PENDING - no commit; task returned to REVIEW`

---

### Date

`2026-08-14`

### Task

`M1.3 implementation and security testing`

### Completed

- Created and applied additive migration `202608140002_auth_rls_storage_record_review` through Supabase Session Pooler `:5432` without modifying M1.2.
- Implemented Auth/Profile synchronous triggers, Auth FK, Profile/timezone validation, operation-specific grants/RLS, server-generated chat ordering, SEC-D8 PA2 Storage bucket/policies and atomic owner-checked `record_review`.
- Applied RLS to all 17 application tables and created 55 public policies plus 6 Storage policies.
- Ran isolated database actor tests and removed all test users/content/objects/locales afterward.
- Updated technical data-model/traceability status to reflect verified M1.3 evidence and the remaining Storage API evidence gap.

### Problems

- First migration apply failed with PostgreSQL `42702` because an outer `id` reference in a correlated policy predicate was ambiguous.
- Audit proved `applied_steps_count = 0` and full transaction rollback. Prisma migration recovery marked that attempt rolled back; qualified predicates were reviewed and the migration then applied successfully.
- Initial test harness assumptions were corrected for PostgreSQL aborted transactions, RLS zero-row updates and Supabase protection against direct service-role deletion from Storage tables.
- Local `.env` does not contain Supabase project URL, anon key or service-role key, so positive upload/delete evidence through the Storage HTTP API cannot be executed.

### Solution

- Qualified every correlated policy outer-column reference before re-apply.
- Used database role/JWT-claim tests for Auth/RLS/RPC and Storage policy predicates, with targeted cleanup.
- Kept `M1.3-T-008` BLOCKED rather than claiming full PASS without Storage API evidence.

### Tests

- `M1.3-T-001` through `M1.3-T-007`, `M1.3-T-009` through `M1.3-T-014`: PASS with live evidence.
- `M1.3-T-008`: BLOCKED/PARTIAL — DB Storage policy subtests pass; positive Storage API upload/delete cannot run without local project URL/keys.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 SEC-D8 PA2 resolution`

### Completed

- Recorded the human choice of PA2: direct authenticated private Storage access governed only by RLS.
- Removed the trusted signed-URL runtime and one-hour TTL guarantee from M1.3 acceptance scope.
- Preserved historical approved snapshots and created a new PA2 amendment snapshot.
- Returned the active M1.3 task from `REVIEW` to `APPROVED`.

### Problems

- The earlier signed-URL contract required an unapproved runtime and conflicted with direct learner avatar permissions.

### Solution

- Accepted the authenticated client Storage capability implied by RLS permissions, while retaining private bucket, anonymous denial, ownership, path, MIME/size, no-overwrite, deletion and published-content rules.

### Tests

- `M1.3-SEC-D8-PA2-T-001` through `M1.3-SEC-D8-PA2-T-003` recorded in `logs/test-log.md`.

### Commit

`PENDING - no commit; decision update only`

---

### Date

`2026-08-14`

### Task

`M1.3 IMPLEMENT preflight - SEC-D8 runtime boundary conflict`

### Completed

- Reconfirmed the M1.2 migration checksum and single-migration baseline before any M1.3 SQL.
- Inspected the existing Prisma schema, approved SEC-D1 through SEC-D10 decisions, Storage resolution and RPC/streak requirements.
- Confirmed that signed-URL TTL is a runtime/API behavior rather than a PostgreSQL migration behavior.
- Returned the active task to `REVIEW` before migration creation under the approved semantic-gap stop rule.

### Problems

- No approved learner-facing trusted runtime currently owns signed-URL generation or service-mediated avatar operations.
- Direct learner Storage permissions needed for avatar operations conflict with the rule that the client cannot create signed URLs itself.
- M1.3 excludes API/runtime implementation, so SQL alone cannot provide or test the approved one-hour signed-URL flow end to end.

### Solution

- Stopped without selecting a runtime, weakening the client restriction, or silently deferring part of SEC-D8.
- Recorded three explicit resolution paths in `plans/current-task.md` for human review.

### Tests

- `M1.3-IMPLEMENT-PREFLIGHT-T-001` and `M1.3-IMPLEMENT-PREFLIGHT-T-002` recorded in `logs/test-log.md`.
- `M1.3-T-001` through `M1.3-T-014` were not run and no PASS was claimed.

### Commit

`PENDING - no commit; stopped before implementation`

---

### Date

`2026-08-14`

### Task

`M1.3 SEC-D8 Storage resolution approval`

### Completed

- Recorded the human-approved SEC-D8 bucket, path, MIME/size, ownership, signed-URL TTL, no-overwrite, deletion and published-content rules in ADR-005.
- Updated the active M1.3 task from `REVIEW` to `APPROVED` after confirming SEC-D1 through SEC-D10 are fully approved.
- Preserved the prior immutable approved snapshot and created a separate approved SEC-D8 addendum snapshot.

### Problems

- The earlier implementation preflight correctly stopped because SEC-D8 lacked operational contract values.

### Solution

- Applied only the exact human-approved resolution and added no runtime component, SQL or implementation semantics.

### Tests

- `M1.3-SEC-D8-T-001` through `M1.3-SEC-D8-T-003` recorded in `logs/test-log.md`.
- `git diff --check` passed; the existing README line-ending warning is non-failing.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 implementation preflight - Auth + RLS + Storage + record_review`

### Completed

- Re-read the immutable approved M1.3 snapshot and ADR-005 before implementation.
- Validated Prisma and confirmed the live Supabase database is current through Session Pooler port `5432`.
- Verified the M1.2 migration checksum remains `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`.
- Audited the live database read-only: no RLS policies, Storage policies/buckets, planned Auth/RPC functions or Auth triggers currently exist.
- Returned the active task to `REVIEW` before migration creation because SEC-D8 is not implementation-complete.

### Problems

- The approved Storage principle does not identify a learner-facing trusted runtime that owns signed-URL generation.
- Signed URL TTL, bucket/path contract, MIME/size limits, avatar scope, overwrite/delete behavior and visible-content attachment verification are not approved.

### Solution

- Stopped before SQL, migration generation or database writes as required by the semantic-gap gate.
- Recorded the exact SEC-D8 decisions required in `plans/current-task.md`; the immutable approved snapshot was not changed.

### Tests

- `M1.3-PREFLIGHT-T-001` through `M1.3-PREFLIGHT-T-004` recorded in `logs/test-log.md`.
- Implementation tests `M1.3-T-001` through `M1.3-T-014` were not run; no PASS was claimed.

### Commit

`PENDING - no commit; implementation stopped at REVIEW gate`

### Date

`2026-08-13`

### Task

`M0.6 — Report scaffolding for three academic reports`

### Completed

- Created `Lingora-Project-1.docx`, `Lingora-ML.docx`, and `Lingora-NLP.docx` as report-only workspaces.
- Added A4 neutral academic structure, title pages, TOC/list field placeholders, heading hierarchy, status conventions, evidence mapping metadata, references and appendices.
- Preserved Project 1 academic title and P1/ML/NLP ownership boundaries.
- Updated report workspace READMEs with active filenames and evidence lifecycle.

### Problems

- `python-docx`, LibreOffice/soffice and Microsoft Word are unavailable in the current environment.

### Solution

- Generated minimal valid OOXML packages using the existing PowerShell/.NET compression APIs without adding project dependencies.
- Performed structural XML/package checks. Visual render tests remain BLOCKED and are not claimed as passed.

### Tests

- `T-M06-001` through `T-M06-007`, `T-M06-012` through `T-M06-015`: PASS.
- `T-M06-009` through `T-M06-011`: BLOCKED by unavailable renderer.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 — Auth + RLS + record_review approval resolution`

### Completed

- Recorded human approval of SEC-D1 through SEC-D9 and amended SEC-D10 in ADR-005 and the M1.3 plan.
- Added the required Auth rollback, trusted email sync, Profile validation, deletion/support technical debt, server-generated chat ordering, published parent-chain, private signed-URL Storage, IANA timezone and row-lock/retry constraints.
- Explicitly excluded idempotency tables/columns/tokens from M1.3 and placed idempotency in the M1.4+ backlog.
- Created the immutable approved M1.3 snapshot and kept the active task at APPROVED without entering IMPLEMENT.

### Problems

- Row locking prevents lost concurrent updates but cannot determine commit outcome after an ambiguous client timeout.
- Account erasure and ADMIN learner-support access remain intentionally deferred.

### Solution

- Documented the ambiguous-timeout limitation and prohibited automatic retry unless failure is clearly confirmed as non-committed.
- Added explicit technical-debt/backlog boundaries without changing the M1.2 schema or migration.

### Tests

- `M1.3-PLAN-T-001` through `M1.3-PLAN-T-005` — all PASS in `logs/test-log.md`.
- Secret scan and `git diff --check` passed; only the original M1.2 migration directory exists and its checksum is unchanged.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-13`

### Task

`M0.5 — Canonical semantic baseline and traceability`

### Completed

- Canonicalized the approved Project 1/mobile, ML and NLP ownership split.
- Added normative core-model, security, locale, streak, grammar, health and metadata rules.
- Added stable requirements and standalone traceability matrix.
- Repaired M0 control-character damage mechanically.

### Problems

- Preserved migrated source contained conflicting examples and one locale summary required synchronization.

### Solution

- Added explicit normative override sections and synchronized requirement/trace summaries to the approved baseline.

### Tests

- `T-M05-001` through `T-M05-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — no commit requested`

---

Append one entry after each implemented task. Do not rewrite historical entries.

## Entry template

### Date

`YYYY-MM-DD`

### Task

`[task name / approved plan path]`

### Completed

- `[completed item]`

### Problems

- None / `[problem]`

### Solution

- None / `[solution]`

### Tests

- `[Test IDs and summary; link logs/test-log.md]`

### Commit

`[commit hash or PENDING]`

---

### Date

`2026-08-13`

### Task

`M0 — Documentation and project-structure normalization`

### Completed

- Established Lingora and `lingora-android` / `lingora-admin` / `lingora-ai` naming as canonical.
- Migrated all relevant legacy sections into the five canonical documents while preserving source wording, scope, Must/Nice classifications, architecture, API examples and proposed data-model decisions.
- Added the migration map and explicit ORIGINAL/DUPLICATE/MISSING/CONFLICT/UNCLEAR classifications.
- Made `docs/` immediately authoritative and marked `ke-hoach-chi-tiet/` reference-only.
- Verified framework coverage and archived legacy workflow file without deletion.

### Problems

- The first canonical draft summarized/transliterated source content and did not meet the approved no-simplification migration rule.
- A temporary PowerShell migration pass initially introduced UTF-8/NUL output issues and selected extra sections because of invocation syntax.

### Solution

- Re-generated canonical documents from the legacy source sections verbatim, applying only approved naming normalization, Markdown heading nesting and canonical link-target updates.
- Corrected the temporary script, verified zero NUL bytes and full section-heading coverage, then removed the script.
- Left every unresolved conflict/missing/unclear item explicit instead of changing source semantics.

### Tests

- `T-M0-001` through `T-M0-009` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation preflight`

### Completed

- Verified Prisma 6.x versions before installation; latest inspected version was `6.19.3`, compatible with the detected Node `24.14.0` runtime.
- Performed the mandatory pre-schema FK/deletion audit against ADR-003.

### Problems

- ADR-003 does not define deletion actions for nine required Language/translation relationships, including Language ownership/reference FKs and `ChatScenario → ChatScenarioTranslation`.
- Creating Prisma relations now would require silently choosing `CASCADE`, `RESTRICT`, `NO ACTION`, or another action, which is forbidden by the approved implementation instructions.

### Solution

- Stopped before dependency installation, schema creation, migration generation or database connection.
- Returned `plans/current-task.md` to/kept it in `REVIEW` with the exact missing FK decisions listed for human resolution.

### Tests

- `M1.2-T-001-PRE`: PASS — version preflight only.
- `M1.2-T-002`: BLOCKED — deletion matrix incomplete for actual FK inventory.

### Commit

`PENDING — no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation`

### Completed

- Installed and pinned Prisma CLI/client `6.19.3` after version/runtime preflight.
- Created a 17-model Prisma schema using snake_case database mappings compatible with canonical PostgREST/RPC naming.
- Generated the initial migration SQL offline from an empty schema and reviewed it before any apply.
- Audited all 24 FKs against ADR-003 and all initial indexes against approved query/requirement paths.
- Added migration-level CHECK constraints for score/ranges/order/JSON payload version and positive chat sequence where Prisma cannot express them directly.
- Validated the schema and generated Prisma Client successfully.

### Problems

- The first generated draft used camelCase database columns; this conflicted with canonical snake_case PostgREST/RPC references and was regenerated before apply.
- Prisma required a separate schema-engine download for offline validation/diff.
- No private Session Pooler `DATABASE_URL` or password is available, so the reviewed migration cannot be safely applied or introspected.

### Solution

- Added explicit `@map`/`@@map` mappings and regenerated the migration; the discarded camelCase SQL was never applied.
- Used a localhost placeholder URL only for offline Prisma parsing/diff; no Supabase connection occurred.
- Stopped at the pre-apply checkpoint and marked online apply/consistency tests BLOCKED rather than claiming success.

### Tests

- `M1.2-T-001`, `M1.2-T-002-RERUN`, `M1.2-T-003`, `M1.2-T-004`, `M1.2-T-005`, and `M1.2-T-008`: PASS.
- `M1.2-T-006` and `M1.2-T-007`: BLOCKED pending private Session Pooler credentials.

### Commit

`PENDING — no commit`

---

### Date

`2026-08-13`

### Task

`Set up Project Development Framework (documentation/process only)`

### Completed

- Created canonical documentation skeletons, task lifecycle directories, logs, agent rules, and UI design-system skeleton.
- Mapped existing `ke-hoach-chi-tiet/` documents to canonical destinations without overwriting or duplicating their detailed content.
- Preserved the repository in pre-M0 state; no feature code or dependency was added.

### Problems

- Product naming is inconsistent across the latest brief (`Lingora`), proposed repository names (`smarteng-*`), and earlier planning names (`Fluentia`/`fluentia-*`).
- Existing plan documents contain detailed overlapping content that requires controlled migration rather than blind copying.

### Solution

- Marked naming and source-of-truth choices as explicit approval decisions.
- Kept legacy planning files as source material and created concise canonical skeletons with a merge policy.

### Tests

- `T-FWK-001`, `T-FWK-002`, `T-FWK-003` — see `logs/test-log.md`.

### Commit

`PENDING`

---

### Date

`2026-08-14`

### Task

`M1.1 — Repository + Environment`

### Completed

- Established the approved `lingora-android`, `lingora-admin`, and `lingora-ai/{api,ml_srs,nlp_chatbot}` repository boundaries.
- Added non-secret `.env.example` placeholders and a root `.gitignore` for secrets, local environments, build output, and model artifacts.
- Added `ENVIRONMENT.md` documenting canonical toolchain expectations, detected local tools, repository ownership, and secret handling.
- Added boundary README files without creating application, schema, API, UI, or model implementation.
- Updated the root README to point to the active environment record and M1 boundary state.

### Problems

- The repository had no application boundary directories, `.gitignore`, or environment record.
- Node/npm were available; Python 3.11 was available through the Windows launcher but not as the `python` command; Java and system Gradle were not available in PATH.

### Solution

- Created only the minimum boundary/documentation artifacts required by M1.1.
- Recorded toolchain gaps as observations/TBDs rather than installing dependencies or changing canonical version decisions.

### Tests

- `M1.1-T-001` through `M1.1-T-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user approval required before commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase (planning only)`

### Completed

- Recorded the created Supabase PostgreSQL project as Lingora's canonical online database.
- Recorded Shared Pooler / Session mode on `aws-0-ap-southeast-1.pooler.supabase.com:5432` as the proposed connection strategy.
- Recorded that direct IPv6 connectivity and a Dedicated IPv4 Add-on are not used.
- Updated `ENVIRONMENT.md`, `lingora-admin/.env.example`, and the active M1.2 REVIEW plan without exposing credentials.

### Problems

- `docs/04-data-model.md` still contains the older generic port `6543` pooler example and a direct `DIRECT_URL` migration example.
- The Supabase Agent Skills installation is not discoverable as a local `SKILL.md` in the current workspace/catalog.

### Solution

- Kept canonical docs unchanged and classified the port example as an explicit connection-configuration contradiction requiring human approval.
- Used the user-provided Supabase connection metadata only for non-secret environment planning; no database connection or SQL was run.

### Tests

- Static M1.2 review checks: REVIEW status, Session Pooler strategy, no password/URI leakage, no schema/migration/implementation files, and `git diff --check`.

### Commit

`PENDING — planning only; no commit`

---

### Date

`2026-08-14`

### Task

`M1.2-RESEARCH — Database Schema Benchmark for Lingora`

### Completed

- Inspected five public repositories at pinned commits: LibreLingo, AnkiDroid, Frappe LMS, Chatwoot and Supabase.
- Compared course hierarchy, vocabulary/localization, exercises, progress, SRS state/history, chat persistence, auth/profile, RLS, constraints and indexes.
- Created `plans/research/2026-08-14-m1.2-database-schema-benchmark.md` with source observation, interpretation and Lingora recommendation layers.
- Classified the current Lingora model as `READY WITH DECISIONS`; no schema redesign or automatic canonicalization was made.

### Problems

- Some projects use non-relational content stores or delegate storage to a backend, so evidence strength differs by comparison area.
- The prior `docs/04` pooler-port contradiction remains a separate human approval/documentation issue.

### Solution

- Recorded exact repository URLs, pinned commits and source paths, and explicitly documented evidence limitations.
- Kept all recommendations non-canonical and listed the decisions required before the first migration.

### Tests

- `M1.2-RESEARCH-T-001` through `M1.2-RESEARCH-T-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation completion`

### Completed

- Resumed from the approved pre-apply checkpoint after the private ignored `.env` was configured.
- Applied the already-reviewed `202608140001_init` migration through the canonical Supabase Shared Pooler / Session mode endpoint on port `5432`.
- Preserved the approved migration unchanged; SHA-256 remained `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`.
- Verified migration status and performed isolated database introspection without overwriting canonical `prisma/schema.prisma`.
- Removed the temporary introspection schema after comparison.

### Problems

- The first introspection attempt failed because the temporary schema path did not exist.
- The next attempt required network access for the Prisma schema engine in the sandbox.

### Solution

- Created a minimal temporary Prisma datasource with `apply_patch`, reran `db pull` with the required network permission, and deleted the temporary file after validation.
- Introspection returned 17 models and the reviewed index/key/FK structure. Prisma reported the expected warning that Client schema introspection does not fully represent PostgreSQL CHECK constraints; all 16 approved checks remain in the applied migration.

### Tests

- `M1.2-T-006-RERUN`, `M1.2-T-007-RERUN`, and `M1.2-T-008-RERUN` — all PASS in `logs/test-log.md`.
- Final `prisma validate`, `prisma migrate status`, migration scope scan, credential-URI scan, temporary-file cleanup, and `git diff --check` passed.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`Scope Gap Review — Project 1 learning capabilities`

### Completed

- Canonicalized the seven human-approved scope-gap resolutions in `docs/02-requirements.md`, `docs/04-data-model.md`, and `docs/05-traceability-matrix.md`.
- Clarified Vocabulary/audio scope, optional NLP grammar scoring, deferred scored LISTENING, Quiz-as-label semantics, SRS ownership/sequencing and deferred Notification/Reminder.
- Preserved and annotated legacy exercise examples instead of deleting them.
- Created `plans/srs-integration-plan.md` as a separate unapproved REVIEW plan for due fallback and smart-review E2E after M1.3–M1.6 dependencies.
- Archived the approved/completed Scope Gap Review and restored M1.3 as the active REVIEW task.
- Recorded ADR-004.

### Problems

- Broad terms such as Grammar, Listening and Quiz could imply features that have no approved requirement/schema.
- SRS due state could be mistaken for Notification/Reminder delivery.

### Solution

- Separated academic ownership from delivery priority and added explicit non-goals without creating new requirement IDs.
- Kept SRS semantics unchanged and moved only later integration sequencing into a supporting gated plan.

### Tests

- `SGR-T-001` through `SGR-T-008` — all PASS in `logs/test-log.md`.
- Requirement/traceability inventory remains 26 unique IDs with zero missing/extra rows.
- API contract, Prisma schema and M1.2 migration remain unchanged; secret scan and `git diff --check` passed.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-17`

### Task

`m1.7-web-platform-reset`

### Completed

- Recorded `ADR-008 — Project 1 learner platform reset from native Android to Web` in `logs/decision-log.md`.
- Rewrote the platform layer of the canonical docs to Web: `docs/00-master-plan.md`, `docs/01-architecture.md`,
  `docs/02-requirements.md`, `docs/03-api-contract.md` (prose and example strings only), `docs/04-data-model.md`,
  `docs/05-traceability-matrix.md`, `docs/QUICK-REF.md`, `docs/README.md`, `DESIGN.md`, `README.md`, `ENVIRONMENT.md`.
- Added `docs/01-architecture.md` §3.2 listing the nine `M1.7-D12` Web learner boundaries.
- Amended `P1-FR-015` mechanism to option `6d` (in-app reminder). The requirement stays `Must`; `6a` and `6b`
  remain deferred, not rejected.
- Added risk `R12` (assignment title says "nền tảng di động"; knowingly accepted).
- Removed the 61 tracked files under `lingora-android/` plus its ignored local build artifacts. Git history preserved;
  no rebase, amend, or force-push.
- Marked the M1.6 Android evidence `SUPERSEDED` in `logs/test-log.md` and its archived plan.

### M1.6 Android — SUPERSEDED (2026-08-17, ADR-008)

```text
M1.6 Android — SUPERSEDED (2026-08-17, ADR-008)
Reason: platform switched to Web before any feature screen was implemented.
Scope reached: auth + AI connectivity foundation only (Login, Register, FoundationStatus).
M1.3–M1.5 backend, schema, RLS, and /v1/ contract remained unchanged. Code recoverable at 585ca6c.
```

### Problems

- The original brief names a mobile platform, so the switch could not be presented as naming-only; it needed an ADR
  and an explicit accepted-risk record rather than a silent rewrite.
- `docs/03-api-contract.md` mentioned Android inside request examples. Changing `"client": "android/1.0.0"` risked
  invalidating the DONE M1.5 runtime, so the field declaration was verified first
  (`lingora-ai/api/app/schemas.py:40,69` — `client: Optional[str] = None`, no pattern validation).

### Solution

- Superseded only ADR-002's platform clauses and only ADR-006 item 3's mechanism; every other ADR stays in force.
- Kept the M1.6 plan and `M1.6-T-001`..`M1.6-T-010` rows in place and annotated them, because they are the only
  record of why the platform changed.
- Learner AI calls go through a Next.js Route Handler proxy that forwards the JWT and owns the 8-second
  `P1-FR-005` timeout, so `lingora-ai` needed no CORS or code change.

### Tests

- `M1.7-T-001` through `M1.7-T-009` — recorded in `logs/test-log.md`.

### Commit

`refactor(platform): reset project 1 learner client from android to web (m1.7, adr-008)`

---
---

### Date

`2026-08-21`

### Task

`project-1-requirements-report-docx`

### Task

`complete-project-1-five-chapter-report`

### Task

`restructure-project-report-to-lecturer-format`

### Completed

- Replaced the five-chapter SDLC structure with the lecturer PDF structure: introduction, Part I requirements, Part II system analysis, Part III system design, Part IV conclusion.
- Moved interview/survey evidence into Part I.
- Removed UI/UX presentation sections from the report revision and kept only an explicit deferral note.
- Generated and sanitized the lecturer-format DOCX.

### Tests

- `RPT-FMT-001` through `RPT-FMT-003` recorded in `logs/test-log.md`.

### Completed

- Reframed the report into the requested Vietnamese five-chapter university structure.
- Added front matter, Chapter 1 SDLC, Chapter 2 problem/technology, Chapter 3 analysis/design, Chapter 4 build, Chapter 5 testing/deployment, conclusion, references and interview appendix.
- Created Google Docs-targeted DOCX and sanitized title formatting.

### Problems

- Visual DOCX rendering is unavailable because LibreOffice/soffice is missing.

### Solution

- Completed structural and content audits and recorded render limitation as N/A.

### Completed

- Read and reviewed `docs/phỏng_vấn.docx` and mapped the six interview participants to the current Use Cases.
- Corrected interpretation of the Japanese participant, thematic frequencies, spoken-dialogue requests, personalization, UC-09 and UC-11.
- Added `docs/report/lingora-project-1-requirements-report.md` as the complete report source with lecturer-aligned sections and figure placeholders.
- Added `docs/report/Lingora-Bao-cao-Phan-tich-Yeu-cau.docx`, generated with the Google Docs default preset and title sanitation.

### Problems

- The bundled renderer could not run because LibreOffice/soffice is not installed (`WinError 2`).

### Solution

- Completed structural DOCX audit and title sanitizer check; recorded render limitation explicitly instead of claiming visual PASS.

### Tests

- `RPT-DOCX-001` through `RPT-DOCX-003` recorded in `logs/test-log.md`.

### Commit

Pending user/repository commit gate.

### 2026-08-22 — UC-06 dual-input documentation sync

#### Completed

- Updated UC-06 User Story, acceptance criteria, flow summary and constraints
  for optional typing or browser speech transcription plus browser speech
  synthesis playback.
- Preserved the canonical `original_text`/`scenario_code` contract and the
  Browser -> Next.js -> FastAPI -> T5-small boundary.
- Added approved scope and MDN Web Speech API evidence entries.
- Updated the three approved PlantUML diagrams and validated all 15 sources.
- Rebuilt and sanitized the requirements DOCX.

#### Boundary

No backend speech model, audio persistence, schema, migration, API runtime or
UI implementation was changed. Browser support/permission fallback is required;
SpeechRecognition is not described as offline/on-device by default.

#### Verification

`UC06-SPEECH-001` and `UC06-SPEECH-002` PASS. `UC06-SPEECH-003` is N/A because
LibreOffice/soffice is unavailable.

### Task

`two-track-se-ml-gec-scope-amendment`

### Completed

- Snapshot approved plan to `plans/approved/2026-08-21-two-track-se-ml-gec-scope-amendment-APPROVED.md`.
- Added `ADR-010` for the two-track consolidation: Software Engineering plus Transformer GEC.
- Updated current normative sections in master plan, architecture, requirements, API contract, data/status
  docs, traceability, system analysis, Quick Reference, report reading order and handoff.
- Preserved legacy DKT/HLR/DQN and MultiWOZ material as historical/superseded evidence.
- Kept implementation boundaries frozen: no Web/FastAPI/schema/migration/RLS/RPC/Storage/dependency/model
  code changes.

### Problems

- Existing canonical documents still described two learned AI capabilities and three report tracks after
  the approved scope amendment.
- SRS policy had been described as AI-assisted/SM-2 without a fresh RPC implementation audit.

### Solution

- Added an ADR-010 normative override and changed effective requirements to deterministic SRS plus
  ML-GEC IDs.
- Added compatibility-first GEC contract wording; legacy endpoints remain until separately migrated.
- Explicitly separated T5-small output from deterministic diff, error classification and optional templates.

### Tests

- `SCOPE2-T-001` through `SCOPE2-T-010` recorded in `logs/test-log.md`.

### Commit

`f5a5a49 — docs(scope): consolidate lingora into se and transformer gec tracks`

---

### Date

`2026-08-21`

### Task

`report-requirements-use-case-realignment`

### Completed

- Read the lecturer requirement-analysis PDF and registered it as `SRC-REQ-001`.
- Created a report source covering stakeholder analysis, elicitation questions, evidence limits, ten User Stories, Acceptance Criteria, FR/NFR, Use Case specification summary, DFD, ERD boundary and validation/change management.
- Added UC-09 Placement Test and UC-11 private Achievements/Badges as approved proposed targets with `P1-FR-016` and `P1-FR-017`; no implementation claim was made.
- Created 15 PlantUML sources for Use Case, Activity, DFD, ERD and Sequence diagrams.
- Created an evidence register that explicitly prevents fabricated survey metrics and records missing source artifacts.

### Problems

- The first PDF extraction command hit a Windows `cp1252` stdout encoding error for Vietnamese text. The failure was reproduced and resolved by setting `PYTHONIOENCODING=utf-8`.
- The first DFD PlantUML source used physical line breaks inside edge labels, causing a compiler error. Labels were normalized to single-line strings and all diagrams were rechecked.

### Solution

- Used the bundled Python/pdfplumber runtime with UTF-8 output.
- Used PlantUML 1.2026.6 with the available Java runtime to validate all diagram sources.
- Kept proposed data entities visibly marked `PROPOSED / NOT IMPLEMENTED`; no schema or runtime files were touched.

### Tests

- `RPT-UC-001` through `RPT-UC-005` recorded in `logs/test-log.md`.

### Commit

Pending user/repository commit gate.
### Date

`2026-08-23`

### Task

`integrate-requirements-research-sections-into-lecturer-report`

### Completed

- Integrated the user-provided requirements-analysis material into the Vietnamese lecturer-format report.
- Added methodology, interview findings, benchmark comparison, functional/non-functional requirements, User Story/Acceptance Criteria, validation, change management and traceability sections.
- Recorded unsupported quantitative survey claims as `EVIDENCE-PENDING` and preserved the two-track SE + T5-small GEC boundary.
- Applied the approved ERD count resolution: 17 physical baseline models, 15 active-flow models, 2 legacy/deprecated chat models; proposed UC-09/UC-11 entities excluded.
- Created the 14-slide teacher-facing presentation from the supplied university background without modifying the source PPTX.

### Problems

- Presentation template inspection initially lacked an `unzip` command; a local read-only ZIP shim was used in the temporary audit workspace.
- Starter-deck contact-sheet helper initially invoked the unavailable `python3` alias; the optional contact sheet was regenerated with the bundled Python runtime.
- LibreOffice/soffice is unavailable, so DOCX raster render QA could not run.

### Solution

- Used the bundled artifact-tool runtime for PPTX import, duplication, editing, rendering, notes and export.
- Used the bundled Python runtime for DOCX build, title sanitization, structural checks and presentation montage generation.
- Preserved the supplied deck master/background and mapped all 14 output slides to source slide 1.

### Tests

- `RPT-ADD-001` through `RPT-ADD-010` recorded in `logs/test-log.md`.

### Commit

Pending user/repository commit gate.
# 2026-08-23 — Generate 19-slide Lingora requirements presentation

- Expanded the existing validated 14-slide university-template deck to 19 slides with agenda, two-track solution boundary, stakeholder/trust-boundary analysis, activity-flow overview and Q&A.
- Corrected unsupported performance wording: route timeout remains documented; latency benchmark is explicitly evidence-pending.
- Replaced roadmap language on Slide 18 with a current-status and verification conclusion, per the approved scope.
- Preserved qualitative interview frequencies, proposed UC labels and the approved 17 physical / 15 active / 2 legacy model description.
- Rendered and visually inspected all 19 slides; automated overflow test passed.
# 2026-08-23 — Restructure presentation and add supplementary interview evidence

- Rebuilt the deck around the revised 19-slide defense narrative supplied by the user.
- Added team/topic ownership and a visual four-part agenda.
- Added three supplementary interview records as anonymized role-level evidence; preserved the original six-record thematic frequencies without recalculating a combined sample.
- Added standardized questionnaire evidence, benchmark analysis, a large Use Case overview, highlighted UC-05/UC-06 Acceptance Criteria, requirement analysis, FR/NFR, modeling, verification and status-only conclusion.
- Preserved university branding and verified all 19 slides visually and with the automated overflow test.

# 2026-08-23 — Complete PlantUML coverage and internalize GEC actor boundary

### Completed

- Merged the outstanding PlantUML/report task with the user-approved actor/boundary amendment.
- Renumbered current private-achievement documentation from the obsolete gap to `UC-10`, producing a contiguous `UC-01..UC-10` catalog.
- Removed `AI Service` from Use Case actors; only Learner and Admin remain outside the system boundary with solid non-arrow associations.
- Documented GEC/T5-small as internal Lingora processing while preserving FastAPI/Route Handler as implementation components.
- Expanded the PlantUML set to 22 sources with Auth, Admin content, Progress/Reminder activities and Context, Level 0, Lesson/Exercise, SRS and GEC DFDs.
- Rebuilt the ERD reporting view with 15 active physical models, 2 legacy/deprecated physical models and separate UC-09/UC-10 proposed entities.
- Synchronized canonical docs, four Markdown reports and the evidence register; retained the six original interviews and three supplementary records without combining frequencies.

### Problems

- The worktree contained unrelated and pre-existing changes, including a modified Prisma schema and prior report/lifecycle outputs. Those changes were preserved and not reverted.
- Current documentation mixed system actors with internal/supporting components and contained stale missing-interview wording.

### Solution

- Recorded ADR-011 and an approved task snapshot, then limited implementation to documentation/diagram/lifecycle paths.
- Used the 17-model canonical baseline and the approved 15-active/2-legacy reporting classification without modifying runtime schema or migrations.
- Added static audits for numbering, actor syntax, ERD counts, diagram catalog completeness and interview evidence boundaries.

### Tests

- `PLANTUML-COV-001` through `PLANTUML-COV-009` recorded in `logs/test-log.md`; compiler, static audits and render inspection pass.

### Commit

Final COMMIT gate uses Conventional Commit message: `docs: complete PlantUML coverage and internalize GEC boundary`.

# 2026-08-23 — Việt hóa toàn bộ PlantUML

### Completed

- Việt hóa phần chữ hiển thị trong toàn bộ 22 sơ đồ Use Case, Activity, Sequence, DFD và ERD.
- Dùng nhãn `Học viên`, `Quản trị viên`, `ĐỀ XUẤT / CHƯA TRIỂN KHAI` và thuật ngữ tiếng Việt nhất quán với các báo cáo.
- Giữ nguyên cú pháp PlantUML, mã UC, API/RPC, model/entity/field và định danh kỹ thuật để bảo toàn traceability.

### Tests

- `PLANTUML-VI-001`..`PLANTUML-VI-004`: 22/22 compile PASS, 22 PNG render PASS, visual Unicode QA PASS, semantic/static scan PASS và diff hygiene PASS.

### Review

- Correctness/readability: nội dung hiển thị đã Việt hóa, thuật ngữ kỹ thuật được giữ khi cần đối chiếu code/contract.
- Architecture/security/performance: documentation-only; không thay đổi runtime, trust boundary, schema, dependency hoặc hiệu năng.
- Verdict: **APPROVE**, không có finding bắt buộc.

### Commit

Final COMMIT gate uses Conventional Commit message: `docs: vietnamize PlantUML diagrams`.
## 2026-09-25 — m2-2-behavior-uc-activity-state

- **Completed:**
  - Implemented Milestone M2.2 Master Specification: `docs/phase-1-m2-2-behavior-uc-activity-state.md` (Sections 1 through 16).
  - Enforced 6-field contract for Artifacts #2, #3, #9, #10, #17, #18, #19.
  - Specified all 15 canonical Use Cases (`UC-01` to `UC-15`) and 15 Behavioral Families (`BF-01` to `BF-15`). Categorized `UC-15` / `BF-15` explicitly as `OPTIONAL / FUTURE EXTENSION BOUNDARY`. Enforced 0 `UC-16/17/18`, 0 `BF-16`.
  - Modeled state machines: Content Lifecycle (6 states: `DRAFT`, `IN_REVIEW`, `REJECTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`; SoD strictly enforced; `ARCHIVED` is terminal in Core, modifications via Clone-to-Draft v2); Learner Progression (4 states: `LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP` with `by_jump=true`; 0 `COMPLETED_BY_JUMP`); LevelReadiness (5 states); KnowledgeGap (3 states); ConceptMastery (3 states).
  - Modeled dual Assessment Entry Pathways: Branch A (Self-Report / Skip → `UNVERIFIED` starting point; NO `AssessmentResult`, NO `SkillProfile`, NO `verifiedProficiency`) vs Branch B (Diagnostic Assessment → 30 items → `AssessmentResult` → `SkillProfile` → `verifiedProficiency` → English A1 Mapping A bands: 0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6).
  - Modeled Jump Assessment: 20q (1 unit) / 25–30q (2–3 units) / 40q (>3 units); pass $\ge 95\%$; 24h cooldown on failure; provenance `SKIPPED_BY_JUMP` (`by_jump=true`); zero CEFR certification.
  - Modeled Exercise Execution & Controlled Retry: Policy D7 `allowance = max(1, floor(N * 0.10))`, 70% credit score on correct retry attempt; zero 80% retry floor.
  - Modeled SRS Review & Daily Streak: Policy B `[1, 3, 7, 14, 30]` days, failure resets to Stage 1 (1 day), atomic `record_review` RPC; daily streak evaluated at 23:59:59 in `Asia/Ho_Chi_Minh`, missed day resets streak strictly to 1 (never 0; no auto-freeze without freeze power-up).
  - Modeled Logical Screen-Flow Inventory: 13 Learner screen flows (`SCR-L-01` to `SCR-L-13`) and 7 Authoring/Ops screen flows (`SCR-A-01` to `SCR-A-07`).
  - Addressed DD Behavioral Closure for DD-01, DD-02, DD-04, DD-05, DD-06 without mutating physical schemas.
  - Authored 7 PlantUML visual specifications under `docs/plantuml/`:
    - `uc-overview-m22.puml`
    - `activity-learner-flow-m22.puml`
    - `activity-authoring-flow-m22.puml`
    - `state-progression-readiness-m22.puml`
    - `placement-jump-m22.puml`
    - `srs-flow-m22.puml`
    - `screen-flow-inventory-m22.puml`
  - Updated supporting architecture and traceability:
    - `docs/01-architecture.md`: Added §3.6 M2.2 System Behavior, Use Cases & State Machines cross-reference.
    - `docs/05-traceability-matrix.md`: Added Section 8 M2.2 Traceability mapping all 15 UCs/BFs to requirements, domain entities, and status.
  - Recorded ADR-019 in `logs/decision-log.md`.
  - Satisfied Gates D-G4 (Behavioral & Use Case Integrity) and D-G7 (State Machine & Transition Completeness).
  - Zero application runtime code (`lingora-web`, `lingora-admin`, `lingora-ai`), zero database schema changes or migrations, zero UI code, zero git commits created.
- **Current Milestone State:**
  ```text
  M2.1 ACCEPTED FOR M2.2
  M2.2 IMPLEMENTATION: COMPLETE (READY FOR INDEPENDENT REVIEW)
  M2.2 DESIGN FREEZE: NOT CLAIMED
  ```
- **Tests:**
  - `T-M22-BEHAVIOR-001`: PASS (18/18 consistency guards, 17/17 D4 checks, 7/7 PlantUML static syntax balance, `git diff --check` PASS, negative checks PASS).
- **Commit:**
  - Pending human review and authorization (`COMMIT: NOT CREATED`).

## 2026-09-26 — m2-2-behavior-uc-activity-state-remediation

- **Completed:**
  - Resolved 100% of review findings from Independent Review (`0 × P0`, `16 × P1`, `15 × P2` closed):
    - **P1-01 / P2-01 (Content Lifecycle State Alignment):** Replaced non-canonical `REJECTED` state with canonical `CHANGES_REQUESTED` across master specification `docs/phase-1-m2-2-behavior-uc-activity-state.md` (§2, §3, §4, §5, §10, §14), secondary documents (`docs/01-architecture.md`, `docs/05-traceability-matrix.md`), and all 7 PlantUML diagrams.
    - **P1-02 / P2-02 (Separation of Duties & Role Normalization):** Removed non-canonical "Content Manager" role across all diagrams and prose; standardized strictly on `Organizational Manager` as the canonical content publisher (`UC-10`); constrained Administrator emergency publishing to already `APPROVED` content only with mandatory justification and `AuditLog`.
    - **P1-03 / P2-03 (Decoupling Jump from UC-03):** Decoupled Jump Assessment from `UC-03` (strictly Placement Test / Diagnostic Assessment, `BF-08`) and relocated under `UC-04` Curriculum Browse & Conditional Jump (`BF-11`).
    - **P1-04 / P2-04 (Diagnostic Assessment Sizing & Mapping A Clarification):** Sized diagnostic test as `~25–30 items, PROPOSED / PENDING VALIDATION`; clarified Mapping A defines a 0–30 raw score range, not proof of 30 delivered items.
    - **P1-05 / P2-05 (Readiness & Mastery 3-State Alignment):** Unified `LevelReadiness` to 3 canonical outputs (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`), eliminating `NOT_READY` and `EVALUATING`. Unified `KnowledgeGap` to 3 canonical states (`OPEN`, `IN_REMEDIATION`, `RESOLVED`). Unified `ConceptMastery` to 3 canonical states (`NOVICE`, `DEVELOPING`, `MASTERED`).
    - **P1-06 / P2-06 (Lesson Completion Semantics):** Formally owned lesson completion under `UC-05` / `BF-10` upon completing all first-pass exercises and available retry allowance, with zero 80% retry floor. Preserved invariant: Exercise correctness $\ne$ Lesson completion $\ne$ Mastery $\ne$ Proficiency.
    - **P1-07 / P2-07 (Streak & Timezone Evaluation):** Evaluated streak lazily across calendar date boundaries (`lastQualifyingActivityDate`); removed artificial 23:59:59 cutoff; removed active Streak Freeze / Power-up (noted as future gamification extension).
    - **P1-08 / P2-08 (Screen-Flow Inventory Unification):** Standardized on 14 Learner screens (`SCR-L-01`..`SCR-L-14`) and 11 Admin/Authoring screens (`SCR-A-01`..`SCR-A-11`) across text and PlantUML.
    - **P1-09 / P2-09 (Full Specification of Administrative Use Cases):** Fully expanded `UC-11`, `UC-12`, `UC-13`, `UC-14` with all 10 required sections (including Main Success Flow, Alternate Flows, Exception Flows, Preconditions, Postconditions, Business Rules, and Traceability).
    - **P1-10 / P2-10 (Traceability Matrix Requirements Ownership):** Updated `docs/05-traceability-matrix.md` §8 to place `P1-FR-014/015` under `UC-02` and `P1-FR-004/011/017` under `UC-07`.
    - **P1-11 / P2-11 (Behavioral Family Alignment with System Analysis §5):** Corrected all mappings of `BF-01` through `BF-15` to match `docs/06-system-analysis.md` §5 definitions.
    - **P1-12 / P2-12 (Artifact 6-Field Architectural Contract Preservation):** Verified and reinforced 6-field contract across Artifacts #2, #3, #9, #10, #17, #18, #19.
    - **P1-13 / P2-13 (Open Decisions Retention):** Preserved all 13 open decision groups in §12 as `OPEN / CONFIGURABLE / PENDING VALIDATION`.
    - **P1-14 / P2-14 (Validation Gates D-G4 & D-G7 Evidence):** Re-evaluated and updated formal evidence tables for Gates D-G4 and D-G7 in master specification §13.
    - **P1-15 / P2-15 (PlantUML Diagram Syntax & Token Hygiene):** Re-authored all 7 PlantUML diagrams under `docs/plantuml/`, verified static syntax balance (`start=1, end=1, trailing_ws=0`), and verified zero prohibited tokens.
    - **P1-16 / P2-16 (Supporting Documentation & Governance Synchronization):** Synchronized `docs/01-architecture.md` (§3.6), `plans/current-task.md`, and `HANDOFF.md` to `READY FOR INDEPENDENT RE-REVIEW`. Recorded ADR-020 in `logs/decision-log.md`.
  - Zero application runtime code (`lingora-web`, `lingora-admin`, `lingora-ai`), zero database schema changes or migrations, zero UI code, zero git commits created (`COMMIT: NOT CREATED`).
- **Current Milestone State:**
  ```text
  M2.1 ACCEPTED FOR M2.2
  M2.2 REMEDIATION: COMPLETE (READY FOR INDEPENDENT RE-REVIEW)
  M2.2 DESIGN FREEZE: NOT CLAIMED
  ```
- **Tests:**
  - `T-M22-REMED-001`: PASS (18/18 consistency guards, 17/17 D4 checks, 7/7 PlantUML static syntax balance, `git diff --check` PASS, negative checks PASS).
- **Commit:**
  - Pending human review and authorization (`COMMIT: NOT CREATED`).

## 2026-09-26 — m2-2-behavior-uc-activity-state-final-p2-cleanup

- **Completed:**
  - Handled all 4 non-blocking issues from Independent Re-Review (`PASS WITH NON-BLOCKING ISSUES`):
    - **N-01 (P1-FR-017 Ownership Cleanup):** Updated `docs/phase-1-m2-2-behavior-uc-activity-state.md` (§1 Artifact #10, §2 UC-07, §13 D-G4) and `docs/05-traceability-matrix.md` §8 to attribute Skill Profile to canonical `P1-FR-016` (displayed in personal reports per `MVP-11`); removed `P1-FR-017` from `UC-07` ownership while preserving its canonical status as Nice/P2 Achievements & Badges (`DEFERRED` outside MVP Core); no new UC fabricated.
    - **N-02 (GEC / Support Traceability Split):** Split the combined row in `docs/05-traceability-matrix.md` §8 into two distinct rows: `UC-14 → Support → BF-15` and `P1-FR-007 → GEC/Scenario → BF-14 → no fabricated UC` (stateless AI service).
    - **N-03 (Streak Freeze Canonical Wording):** Replaced non-canonical phrasing in `docs/01-architecture.md` §3.6 and `HANDOFF.md` with explicit canonical deferred wording: `Streak Freeze and Recovery Power-Up are DEFERRED; no freeze behavior exists in Core`.
    - **N-04 (Rate Limit Removal):** Removed unsupported `Rate Limit` wording from `docs/05-traceability-matrix.md:185`.
  - Maintained scope boundary invariants: zero runtime code (`lingora-web`, `lingora-admin`, `lingora-ai`), zero database schema changes or migrations, zero UI changes, zero git commits created (`COMMIT: NOT CREATED`).
  - Updated `plans/current-task.md` and `HANDOFF.md` to `FINAL P2 CLEANUP COMPLETE`.
- **Current Milestone State:**
  ```text
  M2.1 ACCEPTED FOR M2.2
  M2.2 FINAL P2 CLEANUP: COMPLETE
  M2.2 DESIGN FREEZE: NOT CLAIMED
  ```
- **Tests:**
  - `T-M22-CLEANUP-001`: PASS (`verify_final_p2_cleanup.py` PASS, `verify_consistency_guards.py` 18/18 PASS, `verify_d4_design.py` 17/17 PASS, `git diff --check` PASS).
- **Commit:**
  - Pending human review and authorization (`COMMIT: NOT CREATED`).

## 2026-09-26 — m2-2-acceptance-recording (category: scope-ambiguity)

- **Context & Directive:** Authorized acceptance recording for Milestone M2.2 following Independent Re-Review (`PASS WITH NON-BLOCKING ISSUES`) and final P2 cleanup. Verified prerequisites by targeted acceptance verification (read-only): N-01 CLOSED (spec UC-07 Skill Profile → `P1-FR-016`; `P1-FR-017` explicitly DEFERRED/non-UC; 05 §8 UC-07 row cleaned), N-02 CLOSED (05 §8 split into `UC-14 → Support → BF-15` and `P1-FR-007 → GEC/Scenario → BF-14 → no fabricated UC`), N-03 CLOSED (`01` §3.6 freeze DEFERRED wording; no freeze behavior in Core), N-04 CLOSED (Rate Limit removed from 05 §8); confirmatory negative scan over M2.2 spec + 7 diagrams shows only prohibition text and locked-policy values (zero active violations); D-G4/D-G7 gate definitions intact with canonical names.
- **Decision recorded:** `M2.2 ACCEPTED FOR M2.3` (ADR-021; acceptance milestone only — not Design Complete, not M2.3 Ready, not runtime readiness).
- **Governance updated:** `plans/current-task.md` → `DONE (M2.2 ACCEPTED FOR M2.3)` with `M2.3 PLAN: NOT STARTED`; `HANDOFF.md` latest accepted milestone → `M2.2 ACCEPTED FOR M2.3`; `logs/decision-log.md` ADR-021 appended (history preserved); `logs/test-log.md` `T-M22-ACCEPT-001` recorded.
- **Boundary preserved:** zero runtime/schema/API/UI/security work; D3/D4/M2.1 unmodified; prior FAIL/re-review/cleanup history retained.
- **Next:** M2.3 requires a separate human-approved plan; `M2.3 PLAN: NOT STARTED`.
- **Commit:** `NOT CREATED` (per task commit rule).

## 2026-08-23 — align-uc-scope-and-report-status

- **Completed:** Promoted UC-09 Placement Test and UC-10 Private Achievements to official active/in-scope requirements across active canonical documentation and synchronized the requested Markdown reports plus the five-chapter report.
- **Changed:** Added canonical `P1-FR-016` and `P1-FR-017` entries and traceability rows; removed proposed-only labels from report tables, user stories, model notes, diagram captions and conclusions; preserved implementation-pending evidence wording.
- **Problems:** Existing reports and canonical docs contradicted the user-approved UC-01..UC-10 scope.
- **Solution:** Reframed scope as official while retaining accurate implementation/evidence status and preserving the existing 17-model physical baseline.
- **Tests:** Scope scan PASS; `git diff --check` PASS.
- **Commit:** Pending commit of the approved documentation change.
## 2026-08-23 — integrate-survey-and-format-final-report

## 2026-08-23 — project-1-software-engineering-documentation-cleanup

## 2026-08-23 — erd-remove-chat-session-models

## 2026-08-23 — remove-chat-scenario-models

## 2026-08-23 — add-individual-use-case-diagrams

- **Completed:** Added `use-case-uc01.puml` through `use-case-uc10.puml`, one detailed Use Case diagram per official Use Case. Updated report catalogs and rebuilt the lecturer DOCX; the PlantUML catalog now contains 32 diagrams.
- **Tests:** 32/32 PlantUML sources compile and render; `git diff --check` PASS.

- **Completed:** Removed `ChatScenario` and `ChatScenarioTranslation` from the ERD and removed their DFD/report references. The Project 1 data baseline is now 13 active business models.
- **Reason:** These entities represent chat/conversation content and contradict the user's strict Software Engineering scope for structured learning, exercises and writing checks.
- **Tests:** PlantUML ERD/DFD compile PASS; DOCX rebuild and chat-term scan PASS; `git diff --check` PASS.

- **Completed:** Removed `ChatSession` and `ChatMessage` entities and their relationships from the Project 1 ERD; synchronized the evidence register, lecturer report and five-chapter report to a 15-model active baseline; rebuilt the final lecturer DOCX.
- **Root cause:** A historical 17-model reporting decision preserved deprecated chat runtime entities in the ERD.
- **Tests:** ERD/report stale-reference scan PASS; DOCX rebuild and extraction scan PASS; primary slide overflow test PASS.

- **Completed:** Removed forbidden AI/ML/NLP/T5-small/GEC terminology from Project 1 reports, slides and PlantUML; rewrote the introduction around the Web learning workflow, SRS and structured exercises; removed local survey-file citations; simplified trace labels; consolidated duplicate product analysis; blanked lecturer-report Part III from 3.1 and Part IV conclusion; normalized DOCX table fills and heading text colors.
- **Problems:** Several output files were initially locked by Word/PowerPoint; DOCX visual rendering was unavailable because LibreOffice/soffice is not installed.
- **Solution:** Created deterministic cleanup tooling, reran after the files were closed, copied cleaned PPTX outputs into place, and recorded the render limitation explicitly.
- **Tests:** Terminology scan PASS; three slide overflow tests PASS; `git diff --check` PASS; DOCX render N/A due missing soffice.
- **Commit:** Pending commit of the approved documentation change.

- **Completed:** Added quantitative survey evidence from the 15-response XLSX as `SRC-REQ-018`; inserted percentage-first findings with auditable counts into the Markdown reports and evidence register.
- **Completed:** Created `docs/report/Lingora-Project-1-Lecturer-Format-Final.docx` using the provided warehouse-management DOCX as a presentation reference only. The final uses A4, Times New Roman, academic cover, TOC field, numbered heading hierarchy, tables, header/footer and page fields while retaining Lingora content.
- **Problems:** Existing reports said no traceable quantitative survey existed; the old lecturer report conclusion repeated that contradiction. Reference rendering was blocked by missing LibreOffice.
- **Solution:** Replaced the obsolete limitation with the actual N=15 survey scope and explicitly kept survey/interview samples separate.
- **Tests:** Survey reconciliation PASS; structural DOCX audit PASS; `git diff --check` PASS; render QA unavailable due to missing `soffice`.
- **Commit:** `6e990cc` plus final status update commit.

## 2026-08-24 — slide-deck-dfd0-and-erd-full-width-polish

- **Completed:** 
  - Standardized Slide 18 (Sơ đồ luồng dữ liệu DFD Mức 0) and Slide 19 (Mô hình thực thể ERD).
  - Removed all cluttered side cards (numbered badges 1..6 and side text cards) to maximize diagram presentation area.
  - Re-rendered PlantUML diagrams at high resolution with clean spatial layout without overlapping or clipping.
  - Wiped duplicate slide artifacts and cleared placeholder text overlap in `@oai/artifact-tool`.
  - Embedded full-width diagrams into Slide 18 and Slide 19 and regenerated `docs/project-1/XÂY DỰNG NỀN TẢNG HỌC NGOẠI NGỮ TRỰC TUYẾN LINGORA.pptx` (along with all other presentation deliverables).
  - Evaluated all other 20 slides and verified they remain completely intact without unwanted modifications.
- **Tests:** `PPTX-SLIDE-DFD0-ERD-FULLWIDTH-POLISH-004` PASS.
- **Commit:** Pending.

## 2026-08-24 — render-all-32-plantuml-diagrams-for-a4-reports

- **Completed:**
  - Standardized styling and skinparams across all 32 PlantUML diagram sources (`Segoe UI` typography, `dpi 200`, `shadowing false`, `roundCorner 8`, clean academic titles and pastel palette).
  - Cleaned up mixed Vietnamese/English labels across Use Case and Sequence diagrams.
  - Rendered all 32 diagrams to high-resolution PNG format (1000px-3700px) specifically optimized for insertion into A4 portrait and landscape report pages without pixelation.
  - Outputted and organized the images into `docs/report/diagrams/`, `tmp/plantuml-all-final/`, and `tmp/plantuml-render/`.
- **Tests:** `PLANTUML-32-A4-RENDER-ALL-008` PASS.
- **Commit:** Pending.

## 2026-09-14 — phase-0-repository-cleanup-and-superpowers-standardization

- **Completed:**
  - Standardized AI development workflow on 2 agents: Codex (Discovery/Plan/Review) and Antigravity (Implementation/Test/Fix).
  - Established Superpowers (`obra/superpowers`) as the single shared methodology and skill set for both Codex and Antigravity.
  - Removed obsolete Impeccable framework and legacy project skills (`source-driven-development`, `security-and-hardening`, `debugging-and-error-recovery`, `code-review-and-quality`). Removed broken `.codex/hooks.json`.
  - Installed all 14 Superpowers skills into `.agents/skills/` and `.codex/skills/`, and configured `.agents/plugins/marketplace.json` and `.codex-plugin/plugin.json`.
  - Cleaned obsolete research workspaces `docs/ml/`, `docs/nlp/`, `lingora-ai/ml_srs/`, `lingora-ai/nlp_chatbot/`.
  - Cleaned unapproved/duplicate root plans: deleted `plans/adr-004-amendment-full-scope.md` (duplicate) and `plans/srs-integration-plan.md` (obsolete draft), archived `plans/gap-analysis-de-bai-vs-master-plan.md`.
  - Cleaned `docs/plantuml/`: retained only the 9 canonical Phase 0 MVP diagrams; removed 36 superseded/duplicate `.puml` and `.png` files. Preserved `docs/report/diagrams/` for academic report integrity.
  - Updated canonical project documentation: `AGENTS.md`, `DESIGN.md`, `ENVIRONMENT.md`, `README.md`, `docs/01-architecture.md`, `docs/README.md`.
  - Preserved runtime code in `lingora-web/`, `lingora-admin/`, and `lingora-ai/api/`.
- **Tests:**
  - `lingora-web`: TypeScript typecheck PASS, ESLint PASS, Vitest unit tests (19/19) PASS, Next.js production build PASS.
  - `lingora-ai/api`: Pytest suite (37/37) PASS.
  - `lingora-admin`: Prisma validate PASS.
  - `git diff --check`: PASS.
  - Database integration harness: BLOCKED — environment/configuration issue (Supabase connection credentials).
- **Commit:** Pending.

## 2026-09-14 — phase-0-rebuild-reconciliation-implementation

- **Completed:**
  - Reconciled all 11 architectural layers into a single source of truth under Phase 0 Canonical Baseline.
  - Updated canonical documentation (`docs/00-master-plan.md`, `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/03-api-contract.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, `docs/07-data-dictionary.md`, `docs/QUICK-REF.md`):
    - Demarcated legacy v1-v5 planning text under explicit `[SUPERSEDED / HISTORICAL REFERENCE]` sections.
    - Embedded 19 MVP functions (`MVP-01`..`MVP-19`), 6 canonical roles (`Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`), and 15 Use Cases (`UC-01`..`UC-15`).
    - Aligned system architecture with `docs/plantuml/system-architecture-mvp.puml`.
    - Categorized AI API endpoints into `CURRENT` (health, model info), `COMPATIBILITY` (srs, chat), and `TARGET` (`/v1/gec/correct`).
    - Reconciled database schema models: 12 to keep, 1 to extend (`Profile`), 2 to extend for content workflow (`Course`, `Lesson`), 2 legacy compatibility (`ChatScenario`, `ChatScenarioTranslation`), 2 deprecated (`ChatSession`, `ChatMessage`), and future models (`Cohort`, `CohortMember`, `SupportTicket`, `AuditLog`).
    - Strictly preserved 100% of migration history without executing destructive schema changes.
    - Updated storage bucket references to canonical `lingora-avatars` (5MB) and `lingora-media` (10MB).
  - Built comprehensive bidirectional Traceability Matrix in `docs/05-traceability-matrix.md` linking `MVP-01..19` ➔ `UC-01..15` ➔ Requirements ➔ Runtime surface ➔ Test evidence.
  - Audited and classified `lingora-web` foundation components (reusable, legacy compatibility, needs refactor, not implemented).
  - Fixed stale skill reference in `.agents/references/security-checklist.md` and broken report links in `docs/project-1/README.md`.
  - Maintained `docs/phase-0-survey-requirements.md` in `DRAFT` status pending human review.
- **Tests:**
  - `lingora-web`: `npm run typecheck` PASS, `npm run lint` PASS, `npm run test:unit` (19/19) PASS, `npm run build` PASS.
  - `lingora-ai/api`: `py -3.11 -m pytest` (37/37) PASS.
  - `lingora-admin`: `npx prisma validate` PASS.
  - Database integration harness: BLOCKED — environment/configuration issue (Supabase connection credentials).
  - Repo-wide stale reference scan: PASS (0 broken links in active codebase).
  - `git diff --check`: PASS.
- **Commit:** Pending.

## 2026-09-15 — phase-1-m2-1-fix-after-independent-audit

- **Completed:**
  - Resolved all 7 findings from the independent audit on Milestone M2.1 (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`), bringing M2.1 to `REVISED — READY FOR RE-REVIEW`.
  - **P0-01 (Restore Administrator Emergency Authority):** Restored Administrator Emergency Publish (`IN_REVIEW -> PUBLISHED`) and Emergency Archive (`PUBLISHED -> ARCHIVED`) as dashed red transitions (`#DC2626`) in `docs/plantuml/content-lifecycle-state.puml` and updated §5.1, §5.2, §5.3, §11.1 in M2.1 specification. Imposed strict constraints: emergency only, mandatory justification/reason, mandatory `AuditLog` entry. Preserved normal review workflow (Manager plans/assigns -> Creator authors -> Moderator reviews/approves -> Manager publishes) and prohibitions: no Creator self-approval/publish, no Moderator publish, no Manager assignment bypass, no in-place edit of published content.
  - **P1-02 (Remove ARCHIVED -> DRAFT from Core):** Completely removed `ARCHIVED --> DRAFT` from Core state machine in `docs/plantuml/content-lifecycle-state.puml` and Core transition matrix (§5.2). Relegated content restoration strictly to `[FUTURE / OPEN DESIGN]`.
  - **P1-03 (Eliminate TARGET_EXT / 2-Axis Model):** Eliminated `TARGET_EXT` repository-wide. Decoupled Dimension A Scope (`CORE`, `EXTENSION`, `EXCLUDED`) from Dimension B Implementation Status (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`). Labeled all 23 tables in §7.1 and 18 Core Scope tables in §8.1–§8.18 with explicit values on both axes.
  - **P1-04 (ExerciseType Enum Field-Level Status Breakdown):** Added value-level breakdown table in §8.8: `CURRENT_APPLIED_DATABASE` (`MCQ`, `FILL_BLANK`, `REORDER` in migration `202608140001_init`), `TARGET_SCHEMA / FUTURE_MIGRATION` (`LISTENING`, `GRAMMAR` in target `schema.prisma`), and confirmed 0 occurrences of `MATCHING`.
  - **P1-05 & P1-06 (Re-evaluate Gates D-G1 & D-G2):** Re-evaluated Gate D-G1 (PASS based on verified actor/lifecycle alignment and audit requirements) and Gate D-G2 (PASS based on canonical statuses, 0 `TARGET_EXT`, and accurate ExerciseType split).
  - **P1-07 (Candidate / Open Design Normalization):** Harmonized all candidate physical fields (`supersedes_id`, `assignment_brief`, `starting_unit`, `placement_history`, `lesson_type`, `isAssessmentMode`) under `TARGET DESIGN CANDIDATE` or `OPEN DESIGN REPRESENTATION`. Maintained clear boundary between locked business policies (D3, D4, D6) and open physical representations.
  - **PlantUML Synchronization:** Verified static syntax balance (`@startuml` / `@enduml`) across all 4 `.puml` files.
  - **Strict Boundary Enforcement:** 0 application code, 0 schema changes in `schema.prisma`, 0 migrations created/run, 0 Supabase DB writes. M2.2+ NOT started.
- **Tests:**
  - `T-M21-FIX-001`: PASS (Automated static syntax, reference, and boundary scan across 7 commands).
- **Commit:**
  - Pending human review and authorization.

## 2026-09-20 — tai-lieu-phan-tich-yeu-cau.md slide-readiness fixes (plan `plans/phase-0-tai-lieu-requirements-fix-plan.md`, APPROVED in chat)
- **Hoàn thành:** R-01 (offline-save theo canonical: lưu tạm trong phiên + tự thử lại; 3 vị trí §8.1(3)/§4.7/YC-CORE-07); R-02 (8 vị trí "4 dạng" → 5 dạng ADR-006 + `rule_explanation`, làm rõ GRAMMAR ≠ GEC tự luận); R-04 (câu tuyên bố supporting-doc + bảng mapping 20 YC↔P1-FR/UC/BF + Mapping A bands vào YC-CORE-09 + D7 formula vào YC-CORE-07; đổi tên "ngân hàng câu hỏi" → Exercise thống nhất theo D4 tại 3 vị trí); R-05/R-06 (cảnh báo ADR-008 + điều kiện chặn slide MVP cho YC-EXT-07/YC-EXT-01); NFR §6.3 (số liệu tham chiếu canonical TBD); R-07 (làm rõ phân loại "ai" ở Q24).
- **Vấn đề phát hiện thêm khi implement:** file thực tế 650–675 dòng (nhiều hơn 509 dòng thấy qua read tool do cắt output); rà quét phát hiện thêm 4 điểm sót cùng họ (dòng 295, 358, 502, 545, 365) và đã fix hết, verify 0 hit.
- **Tests:** `T-TAILIEU-FIX-001` (N/A — doc-only verification, xem test-log).
- **Commit:** chưa commit (chờ human yêu cầu rõ).

## 2026-09-20 — tai-lieu: xử lý 22 tags [CẦN NHÓM XÁC NHẬN] + xác minh UC-count (theo chỉ đạo trực tiếp của user)
- **Phát hiện file đã bị viết lại (799 dòng):** các fix R-01/R-02/R-04/R-05/NFR từ plan DONE trước đó không còn (mapping table, Mapping A bands, D7 formula, ADR-008 warnings, TBD refs đã mất); nội dung mới gồm §8 quyết định, §9 appendix N=35/N=3, §10 S1–S6, §11 Q-list. Không tự ý khôi phục — báo user quyết định ở turn sau.
- **UC-count FACT:** baseline canonical = 15 UCs (UC-01..UC-15, docs/05+06+02) + 19 MVP functions (MVP-01..MVP-19, roles-and-mvp-final). File tai-lieu = 20 YC (12 CORE + 8 EXT) — hệ mã yêu cầu nghiệp vụ khác, không mâu thuẫn số lượng. "19" user hỏi = 19 MVP (nhầm thuật ngữ UC/MVP, dễ hiểu).
- **Xử lý tags (user đã xác nhận từng nhóm qua question tool):** N=35 methodology (5 tags) + N=3 methodology (6 tags) + N=3 cases §3.3.1+appendix (6 tags) + trial 17/09 (2 tags) → xóa tag; dòng 628 về "18/09" → viết lại theo mốc đã xác nhận (10–17/09); dòng 729 → diễn giải nhóm + đối chiếu luật gốc; dòng 744 audit retention → QUYẾT ĐỊNH MỞ chờ pháp lý.
- **Tests:** grep verify 0 tag còn lại, 0 `CẦN BỔ SUNG`, không double-space thừa.
- **Commit:** chưa commit (chờ human yêu cầu rõ).

## 2026-09-21 — Attestation ghi chép PV chuyên môn back-office (user xác nhận trực tiếp trong chat)
- **Nội dung được xác nhận là ghi chép thật 100%:** 7 người (Manager: Nguyễn Thu T., Lê Quang H. 16/09; Creator: Đặng Mai A., Trần Quốc T. 17/09; Moderator: Hoàng Thị Kim O. 16/09; Ops: Phạm Đức T. 18/09; SysAdmin 18/09), quotes nguyên văn, time-study 22/18/11/4 phút (tổng 55), ngày 16–18/09.
- **Phạm vi agent verify được:** nhất quán nội bộ (22+18+11+4=55; % cộng đủ 100.0), khớp baseline D1–D9/SoD/Y C codes, không phần trăm bịa (45/30/15/10 đã bỏ đúng), legal tách khỏi interview đúng phương pháp.
- **Agent KHÔNG verify được:** sự xảy ra thực tế (repo không có raw notes/audio) — hoàn toàn dựa trên attestation của nhóm. Khuyến nghị: lưu raw notes + file raw N=35/N=3 vào repo; đối chiếu lại NĐ 53/2022 Điều 26 (12 tháng) với văn bản luật gốc trước bảo vệ.
- **Commit:** chưa commit (chờ human yêu cầu rõ).

## 2026-09-21 — slide-deck-17-slides.md: fix Slide 9 + Slide 16 theo duyệt của user
- Xóa "chiếm 60% thời gian" (không nguồn), giữ nguyên văn file về audio bottleneck.
- Slide 16: UC-05 → CORE-07 (bỏ CORE-03 phía Creator); UC-12 → CORE-02 Dashboard (bỏ EXT-05 sai đối tượng); UC-02 → CORE-10 (bỏ CORE-01 gượng ép).
- Tests: grep verify 0 hit các chuỗi cũ. Commit: chưa commit (chờ human yêu cầu rõ).
