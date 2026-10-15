# Lingora — Quick Reference

> **Classification: CURRENT snapshot (2026-10-11); see [docs/README.md](README.md) for controlling sources.**
> **Purpose/TARGET:** Lingora is intended as a multi-language, multi-course learning platform for students and working adults. English A1/A2 and its seed records are MVP content, not platform-wide invariants.
> **CURRENT repository:** A Next.js learner authentication foundation and a Prisma/migration/seed workspace exist. Learner placement, course enrollment, lesson execution, proficiency, progression, and the Admin web application are not implemented in this checkout. The Prisma file and SQL migrations disagree; remote applied database state is unverified.
> **TARGET decisions:** ADR-027 accepts the M2.4 architecture/security design; ADR-029 accepts a design handoff only; ADR-030–034 accept P0-D04/P0-D03/P0-D05/P0-D06/P0-D02 business/domain decisions; ADR-035 resolves P0-D07 logical product/security policy; ADR-036 records MVP lesson scoring/retry, SRS enrollment, curriculum availability, assessment package/versioning, Reassessment deferral, and Admin learner-account scope. ADR-036 is documentation/product policy only. None authorizes Phase 2 implementation. The master plan remains `TARGET / NOT AUTHORIZED FOR IMPLEMENTATION`.
> **P0-D04/P0-D03 accepted domain target:** ADR-030 sets shared/core Course per learnable Language in MVP by convention, controlled lesson metadata, framework-aware levels, context-scoped placement evidence, and deterministic LearningPlan with persistence deferred. ADR-031 sets one LearningContext per user+learned Language, at most two `ACTIVE`, lifecycle `ACTIVE`/`PAUSED`, account-global Profile state, context-owned language state and logical progress, assessment evidence scoped by context, User+Vocabulary SRS, account-global streak, no default persisted SkillProfile/LearningPlan/Enrollment, and simple context study preferences. These are domain decisions only; the physical schema is unchanged. TOEIC is `DEFERRED`; Track is not needed now.
> **P0-D05 accepted placement target (ADR-032):** MVP Placement is context-scoped onboarding/diagnostic with `recommended starting level`; entry paths are Placement, learner self-report, or default start. No placement-derived verified proficiency/certification/mastery, permanent lock, or lifetime quota. Completed evidence is retained; incomplete attempts produce no result. Assessment parameters are configuration. Stage-adaptive Placement is deferred for MVP. Historic English values and Mapping A are not platform defaults; review them as English configuration.
> **P0-D06 accepted progression target (ADR-033):** Lesson completion requires all required core exercises, valid submission, and successful recording; completion is separate from performance, with no accuracy threshold. MVP progress is an unweighted completed/eligible required-lesson ratio per level; core curriculum is mostly sequential. Level-up requires both a course-defined curriculum gate and a passed level-up assessment; Jump is deferred. Lesson redo may qualify as learning activity without changing completion count. Streak is account-global and qualifies completed lessons, legitimate completed redo, or recorded SRS reviews only. Physical score/attempt representation remains P0-D07.
> **P0-D02 resolved business baseline (ADR-034):** Exactly three business roles: Admin, Teacher, Learner; one role per account; Learner self-registration; Teacher/Admin controlled provisioning; assigned Teacher authoring; Admin requirements/assignment/reassignment, review, approval, and publish-only-after-approval. No Admin content authoring/self-approval, role-conversion UI, or staff account learner use. UC identities are catalog-versioned; see the crosswalk in `docs/use-case-specifications.md`.
> **P0-D07 RESOLVED — LOGICAL TARGET ONLY (ADR-035):** Trusted `auth.uid()` subject; server-controlled role/status and disable enforcement; no blanket conversion of ambiguous roles; assignment/authorship/concurrency rules; separate assignment/content lifecycle with immutable revision publishing; assessment grading/answer/result secrecy; Policy B with trusted SRS scheduling/idempotency; and minimum logical audit policy are approved. Physical role/RLS claims, assignment/revision/result/SRS/audit realization, context FK, `Profile.dailyGoalMin`, `UserProgress.score`, migration state and live DB remain deferred/unverified. Prisma or an individual migration is not product authority. AI compatibility is outside P0-D07. No physical design or implementation is approved.
> **Behavior reference:** `docs/use-case-specifications.md` is the current 14-entry catalog; UC-03 reminder is deferred under ADR-031, and Reassessment is not a current standalone MVP UC under ADR-036. The catalog count is an identity/crosswalk count, not an MVP capability count. ADR-032/033/036 control Placement, progression/activity, and revised learning/assessment rules. Historical 15-UC catalogs and statuses are not current implementation evidence.
> **Task state / next action:** Final Physical Data & Runtime Design Review found **NEEDS PHYSICAL CORRECTION / NOT READY FOR IMPLEMENTATION PLANNING**; the separate [F01–F12 correction pass](design/physical/correction-pass.md) is now **DONE**, and its independent [closure recheck](design/physical/independent-recheck.md) records all twelve findings CLOSED. The 34-table proposal remains unapproved and LIVE DB UNVERIFIED. Next separately authorized work is FINAL PHYSICAL DESIGN REVIEW; no implementation planning/code/database work is active. The earlier draw.io task remains pending its existing commit gate; its 35 active native pages and 36 canonical source/render inventory are preserved, with deferred ACT-05 excluded from the primary package. See `docs/modeling/current-target/evidence/native-render-review.md` and the pending task capture in `plans/archive/`.
---

> **Sections 1–5 status:** `HISTORICAL / SUPERSEDED` as operational instructions; they preserve a Phase 2 draft snapshot. Their stack, scope, learner-behavior, governance, and milestone statements are not verified current state or implementation approval. Role/governance statements are subordinate to ADR-034/035; reminders are deferred by ADR-031; Placement is subordinate to ADR-032; completion/progression/activity is subordinate to ADR-033. P0-D07 physical/deployment questions remain deferred. Use this file's opening snapshot and section 6 pointers to reach current or accepted topic sources.

## 1. Repositories & Platform Architecture

| Subsystem | Stack | Purpose |
|---|---|---|
| `lingora-web/` | Next.js 15 + React 19 + TypeScript 5, Tailwind CSS 4, shadcn/ui, `@supabase/ssr`, Vitest, Playwright | Learner Web Application (BFF & Client) |
| `lingora-admin/` | Next.js 15 + TypeScript 5, Tailwind CSS 4, shadcn/ui, Prisma 6, PostgreSQL | Content Authoring, Moderation & Admin Portal |
| `lingora-ai/` | Python 3.11, FastAPI [OUT OF PHASE 2 SCOPE] | Retained for historical architecture & traceability only |

**Backend / Database:** Supabase (PostgreSQL 15 + GoTrue Auth + Storage + RLS) in `ap-southeast-1`.

---

## 2. Core Learner Scope (Deterministic Engine)

The Phase 2 Learner experience follows a closed-loop flow with deterministic business logic:

1. **Course / Unit / Lesson Navigation:** Browse English A1 curriculum (6 Units / 24 Lessons).
2. **Lesson Content Viewer:** Learner reviews lesson learning content (vocabulary, phonetic transcription, Vietnamese meaning, contextual examples, standard static audio playback from Supabase Storage `lingora-media`, grammar summary) **BEFORE** starting exercises.
3. **Interactive Exercises (5 types):** `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING` (word-level static MP3 audio), `GRAMMAR`. (No TTS, no AI generation).
4. **Immediate Feedback & Scoring:** Server-authoritative grading (`Learner payload != grading secret`).
5. **Unlimited Retry (D7 Relaxed):** Learners can retry exercises unlimited times until correct. No punitive score reduction. Completion is based on passing the lesson, keeping the UX formative and encouraging.
6. **Progress Persistence:** Atomic updates to `UserProgress` (`status`, `score`, `completedAt`).
7. **Diagnostic Starting Point (D6):**
   - MVP placement / starting-point mechanism (NOT a psychometric or CEFR certified exam).
   - 30 HUMAN-SELECTED questions (1 correct answer = 1 raw point; raw score 0–30).
   - In pilot phase, all assessment results route the learner to start at **A1 Unit 1**.
   - Skip option: routes to Unit 1 with `UNVERIFIED` status; generates exactly 0 `AssessmentResult` and 0 `SkillProfile` records.
   - Retake from Profile: generates a new immutable `AssessmentResult` without deleting past progress.
8. **Level-up Exam (Thi lên cấp - D5):** Replaces Conditional Jump. At the end of the A1 curriculum, after 100% of lessons are completed, learners take a final exam. Requires $\ge 80\%$ score to pass and unlock A2. Unlimited immediate retries allowed.
9. **Spaced Repetition System (SRS - D8):** Deterministic Policy B with fixed interval stages $[1, 3, 7, 14, 30]$ days executed via **Application Layer (Next.js Backend)**. Incorrect answers reset to Stage 1 (1 day).
10. **Daily Streak (D9):** Evaluated lazily across calendar date boundaries using learner-local IANA timezone (`Asia/Ho_Chi_Minh`) via Application API. Missing $\ge 1$ day resets streak to 1. No streak freeze in MVP core.
11. **Profile & Basic Learner Settings:** Managed via PostgreSQL with simplified RLS. Learners can update personal fields; privileged fields (`role`, `streakCount`, `verifiedStartingUnit`) are protected by Application-level Role-Based Access Control.
12. **i18n Foundation:** Locale switching between `vi` (default) and `en` per Master Plan.

---

## 3. Content Governance (Agile SoD)

The content lifecycle allows flexible publishing for speed of development:

```text
Creator (Author Draft)
  ──> Manager / Admin (One-Click Publish to Learner Web)
  [Optional]: Moderator Review path exists but is not strictly enforced for MVP.
```

- **Agile Publishing:**
  - Manager and Admin can directly publish lessons.
- **Clone-to-Draft v2 (D3):** Published lessons are never edited in place; edits clone to a new `DRAFT` revision with `supersedes_id` pointing to the active revision.
- **Strict Unit Visibility:** A Unit is accessible to learners only if ALL mandatory lessons within it are in `PUBLISHED` status. Direct access to unpublished lessons is rejected.

---

## 4. Invariants & Guardrails

- **Core Pedagogical Separation Invariant:**
  $$\text{LearningProgress} \ne \text{Proficiency} \ne \text{ConceptMastery} \ne \text{LevelReadiness}$$
- **Exercise Security Invariant:**
  `Learner payload != grading secret` (Correct answers and regex rules are never exposed to learners before submission).
- **Single-Role Identity Model:**
  Each user has exactly one canonical role in `profiles.role`. Creator and Moderator are distinct accounts.
- **Explicit Out-of-Scope for Phase 2:**
  - AI runtime execution, LLM prompts, GEC inference pipelines.
  - Speech recognition, automated pronunciation assessment, real-time TTS.
  - Commercial payment gateways, public leaderboards, social gamification.
  - Background Web Push / SMS notification daemons (Email reminders to registered emails are ALLOWED and in-scope).
  - Multi-stage enterprise workflow orchestration engines.

---

## 5. Milestone Map (Phase 2 Master Plan M3.1..M3.10)

*Source: `plans/master-implementation-and-report-plan.md`*

| Milestone | Title | Focus |
|---|---|---|
| **M3.1** | Foundation (Database & Schema) | Physical schema, tables (`units`, `lesson_revisions`, `assessment_results`, `skill_profiles`), 6-role enum, WP-CONTENT seed |
| **M3.2** | Auth, RBAC, RLS & SoD Engine | 6-role JWT, RLS matrix, SoD rejection triggers, audit logging |
| **M3.3** | Learner Core (Lesson & Exercise) | Lesson Content Viewer, 5 exercise types, Unit 4/4 check, i18n foundation |
| **M3.4** | Assessment & Progression Engine | 30-item Placement (Mapping A), Skip branch, immutable Retake |
| **M3.5** | Learning Intelligence | Controlled Retry ($\le 70\%$), SRS Policy B ($[1,3,7,14,30]$), Jump $\ge 95\%$, Streak |
| **M3.6** | Content Governance & Moderation | 6-state lifecycle UI, Creator drafting, Moderator review, Manager publish, Admin emergency |
| **M3.7** | Cross-Cutting Supporting Infra | Full i18n bilingual sync (vi/en), shared BFF helpers |
| **M3.8** | System Integration & E2E Journey | Full integration of 14 core UCs (UC-01..UC-14), Playwright E2E suites |
| **M3.9** | Hardening & NFR Verification | k6 load benchmarks, Lighthouse audits, security scans |
| **M3.10** | Academic Closure & Demo Packing | 5-chapter thesis report evidence, 4-Act continuous demo script |

---

## 6. Pointer Map — When to Read Which Canonical File

| Task involves | Read |
|---|---|
| Execution roadmap, milestones M3.1–M3.10, detailed test specs | [`plans/master-implementation-and-report-plan.md`](../plans/master-implementation-and-report-plan.md) |
| Active task scope and status | [`plans/current-task.md`](../plans/current-task.md) |
| Session transition and current operational state | [`HANDOFF.md`](../HANDOFF.md) |
| System architecture, boundaries B1–B6, zones 1–5 | [`docs/01-architecture.md`](01-architecture.md) |
| Requirements summary and acceptance criteria | [`docs/02-requirements.md`](02-requirements.md) |
| AI contract (read-only reference) | [`docs/03-api-contract.md`](03-api-contract.md) |
| Database schema and historical migrations | [`docs/04-data-model.md`](04-data-model.md) |
| Traceability matrix | [`docs/05-traceability-matrix.md`](05-traceability-matrix.md) |
| UI/UX design tokens and screen flow index | [`DESIGN.md`](../DESIGN.md) |
| English A1 curriculum blueprint | [`docs/08-english-a1-curriculum.md`](08-english-a1-curriculum.md) |
