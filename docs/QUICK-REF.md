# Lingora — Quick Reference

> **Phase 2 Canonical Baseline (aligned with `plans/master-implementation-and-report-plan.md` & ADR-014/ADR-029):**
> LINGORA is an online language-learning platform developed strictly to Software Engineering standards.
> **Current Phase 2 Scope:** NON-AI / deterministic implementation. AI/GEC is retained only in canonical traceability and historical architecture context, NOT in Phase 2 runtime implementation, testing, demo, or acceptance.
> **Current Platform:** Web (`lingora-web` for Learner; `lingora-admin` for Content & Operations).
> **Canonical Roles (6 roles):** `Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`. (Do NOT use Student or Teacher as canonical roles).
> **Purpose:** Concise snapshot for developers and coding agents to read first and avoid misunderstandings.

---

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
