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
5. **Controlled Retry (D7):** Allowance $= \max(1, \lfloor N \times 0.10 \rfloor)$ per lesson session; retry items receive at most 70% credit. Completion does not require an 80% score floor.
6. **Progress Persistence:** Atomic updates to `UserProgress` (`status`, `score`, `completedAt`).
7. **Diagnostic Starting Point (D6):**
   - MVP placement / starting-point mechanism (NOT a psychometric or CEFR certified exam).
   - 30 HUMAN-SELECTED questions (1 correct answer = 1 raw point; raw score 0–30).
   - Mapping A: $0–7 \rightarrow \text{Unit 1}$, $8–12 \rightarrow \text{Unit 2}$, $13–17 \rightarrow \text{Unit 3}$, $18–22 \rightarrow \text{Unit 4}$, $23–26 \rightarrow \text{Unit 5}$, $27–30 \rightarrow \text{Unit 6}$.
   - Skip option: routes to Unit 1 with `UNVERIFIED` status; generates exactly 0 `AssessmentResult` and 0 `SkillProfile` records.
   - Retake from Profile: generates a new immutable `AssessmentResult` without deleting past progress.
8. **Conditional Jump (D5):** Adjacent Unit jump challenge; requires $\ge 95\%$ score; failure activates a 24-hour server cooldown; pass marks skipped units with `SKIPPED_BY_JUMP` (`by_jump = true`); jump is NOT curriculum completion.
9. **Spaced Repetition System (SRS - D8):** Deterministic Policy B with fixed interval stages $[1, 3, 7, 14, 30]$ days executed via database RPC `record_review`. Incorrect answers reset to Stage 1 (1 day).
10. **Daily Streak (D9):** Evaluated lazily across calendar date boundaries using learner-local IANA timezone (`Asia/Ho_Chi_Minh`). Missing $\ge 1$ day resets streak to 1. No streak freeze in MVP core.
11. **Profile & Basic Learner Settings:** Managed via PostgreSQL column-level grants. Learners can update personal fields; privileged fields (`role`, `streakCount`, `verifiedStartingUnit`) are server-protected.
12. **i18n Foundation:** Locale switching between `vi` (default) and `en` per Master Plan.

---

## 3. Content Governance & Separation of Duties (SoD)

The content lifecycle enforces strict role boundaries without unnecessary enterprise complexity:

```text
Manager (Plan & Assign)
  ──> Creator (Author Draft & Submit)
  ──> Moderator (Review: Approve or Request Changes)
  ──> Manager (Publish to Learner Web)
  [Emergency Path]: Administrator Emergency Publish (APPROVED content only, requires justification + AuditLog)
```

- **Separation of Duties (SoD):**
  - Creator CANNOT approve lessons (`403 Forbidden / ROLE_UNAUTHORIZED`).
  - Moderator CANNOT publish lessons to learners (`403 Forbidden`).
  - Manager CANNOT approve lessons.
  - Admin emergency publish is restricted strictly to already `APPROVED` lessons with mandatory reason logged to `audit_logs` (`CONTENT_EMERGENCY_PUB`).
- **Clone-to-Draft v2 (D3):** Published lessons are never edited in place; edits clone to a new `DRAFT` revision with `supersedes_id` pointing to the active revision.
- **Unit 4/4 Published Invariant:** A Unit is accessible to learners if and only if all 4 child lessons are in `PUBLISHED` status. Direct access to lessons in incomplete units is rejected at the server/RLS boundary (`UI hiding != authorization`).

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
  - Background Web Push / SMS notification daemons (in-app reminder is client-local per ADR-006/ADR-007).
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
