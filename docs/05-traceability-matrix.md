# 05 - Lingora Traceability Matrix

> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014):**
> This matrix provides bidirectional traceability between the **19 Phase 0 MVP Functions (`MVP-01`..`MVP-19`)**, the **15 Canonical Use Cases (`UC-01`..`UC-15`)**, Engineering Requirements (`P1-FR-*`, `P1-NFR-*`, `ML-GEC-*`), Data Entities, Runtime Surfaces, and Test Evidence.

---

## 1. Phase 0 MVP Function ➔ Use Case Traceability Matrix

| MVP ID | MVP Chức Năng | Owner Chính | Canonical Use Case | Requirements | Runtime Surface | Test Evidence | Trạng Thái (Status) |
|---|---|---|---|---|---|---|---|
| **MVP-01** | Đăng ký, đăng nhập, khôi phục phiên | Administrator | `UC-01 Authenticate & Manage Session` | `P1-FR-001`, `P1-NFR-001` | `lingora-web` (`/login`, `/register`, `@supabase/ssr`), Supabase GoTrue | `M1.6W-T-003/004/005` (PASS) | `IMPLEMENTED (Foundation)` |
| **MVP-02** | Onboarding mục tiêu học | Learner | `UC-02 Configure Goals & Study Time` | `P1-FR-010`, `P1-FR-014` | `lingora-web` (`/profile`, `Profile.dailyGoalMin`, `uiLocale`) | `P1-T-018`, `M1.6W-T-002` (PASS) | `PARTIAL (Profile ready, Onboarding UI pending M2)` |
| **MVP-03** | Placement hoặc chọn cấp độ | Learner | `UC-03 Take Placement Test` | `P1-FR-016` | `lingora-web` (Placement runner), Starting Unit mapper (OD-PLACEMENT-MAPPING: APPROVED MAPPING A [0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6]) | Planned placement tests | `DESIGN (Specification locked; Implementation pending)` |
| **MVP-04** | Lộ trình học (Curriculum) | Lesson Creator | `UC-04 Browse Learning Path` | `P1-FR-002` | `lingora-web` (`/courses`, `/learn`, Course/Lesson tree), Supabase RLS | `M1.4-T-001` (Seed PASS), `P1-T-002` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-05** | Lesson ngắn 5–10 phút | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-002`, `P1-FR-004` | `lingora-web` (Player), `lingora-admin` (Authoring), `Lesson` entity | `M1.4-T-001` (PASS) | `PARTIAL (DB ready; Player pending M2; Admin pending M3)` |
| **MVP-06** | Ba dạng exercise cơ bản (MCQ, FILL_BLANK, REORDER) | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-003` (Core 3 types; ext: `P1-FR-012`, `P1-FR-013`) | `lingora-web` (Exercise engine), `Exercise.payload` (Prisma JSONB) | `M1.6W-T-002` (PASS), `P1-T-003` | `PARTIAL (Prisma schema ready; Player pending M2)` |
| **MVP-07** | Phản hồi tức thời & giải thích | Moderator | `UC-05 Complete Lesson Exercises`, `UC-09 Review Content` | `P1-FR-003`, `P1-FR-012` | `lingora-web` (Instant feedback component), `Exercise.payload` | `P1-T-003`, `P1-T-016` | `PARTIAL (Payload schema ready; interactive UI pending M2)` |
| **MVP-08** | Tiến độ học tập cá nhân | Learner | `UC-07 Track Progress & Streak` | `P1-FR-004` | `lingora-web`, Supabase `UserProgress` table | `M1.4-T-001` (PASS), `P1-T-004` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-09** | Ôn tập nội dung yếu (SRS) | Learner | `UC-06 Spaced Repetition Review (SRS)` | `P1-FR-005`, `P1-FR-006` | `lingora-web` (`/srs`), RPC `record_review`, `user_vocab_srs`, `review_logs` | `M1.3-T-001` (RPC PASS), `M1.4-T-001`, `M1.6W-T-006-RERUN` | `PARTIAL (RPC/DB ready; Web deterministic review UI pending M2)` |
| **MVP-10** | Daily goal và streak | Learner | `UC-02 Configure Goals`, `UC-07 Track Progress & Streak` | `P1-FR-011`, `P1-FR-014` | `lingora-web`, `Profile.streakCount`, `lastQualifyingActivityDate` | `M1.4-T-001` (PASS), `P1-T-011`, `P1-T-018` | `PARTIAL (DB fields ready; UI pending M2)` |
| **MVP-11** | Báo cáo cá nhân | Learner | `UC-07 Track Progress & Streak` | `P1-FR-004`, `P1-FR-011`, `P1-FR-017` | `lingora-web` (`/profile`, stats card) | `M1.6W-T-002` (PASS) | `PARTIAL (Foundation ready; full dashboard pending M2)` |
| **MVP-12** | Quản lý nội dung (Draft/Media) | Lesson Creator | `UC-08 Create & Edit Lesson Draft` | `P1-FR-008`, `P1-FR-009` | `lingora-admin` (Authoring UI), Supabase Storage (`lingora-media`) | `M1.3-T-001` (Admin RLS PASS), `M1.3-T-002` (Storage PASS) | `PARTIAL (DB/Storage ready; Authoring UI pending M3)` |
| **MVP-13** | Kiểm duyệt & Xuất bản nội dung | Moderator, Organizational Manager | `UC-09 Review & Approve Content`, `UC-10 Publish Content` | `P1-FR-008` | `lingora-admin` (Moderation queue, Publishing), `Course/Lesson.isPublished` | `M1.3-T-001` (Admin RLS PASS) | `DESIGN / PARTIAL (DB publish flag exists; 6-state workflow UI pending M3)` |
| **MVP-14** | Quản trị tài khoản và quyền | Administrator | `UC-11 Manage Accounts & Roles` | `P1-FR-008`, `P1-NFR-001` | `lingora-admin` (`/users`), Supabase GoTrue, `Profile.role` | `M1.3-T-001` (RLS PASS) | `PARTIAL (2 roles in DB: LEARNER/ADMIN; 6-role RBAC UI pending M3)` |
| **MVP-15** | Báo cáo vận hành | Administrator | `UC-12 View System Reports` | `P1-FR-008` | `lingora-admin` (`/analytics`) | Planned operational tests | `DESIGN (Specification in Phase 0; Implementation pending M3)` |
| **MVP-16** | Hỗ trợ người dùng (Ticket) | Operations Staff | `UC-14 Handle Support Tickets` | Operational Support | `lingora-admin` (`/support`), Support ticket store | Planned ticket tests | `DESIGN (GAP: SupportTicket entity not yet in Prisma; scheduled for Ops milestone)` |
| **MVP-17** | Quản lý cohort tùy chọn | Organizational Manager | `UC-15 Manage Cohorts & Group Progress` | Optional Organization Module | `lingora-admin` (Cohort portal), Cohort grouping schema | Planned cohort tests | `DESIGN (FUTURE / OPTIONAL: Cohort entities not yet in Prisma; optional module)` |
| **MVP-18** | Trạng thái trải nghiệm chuẩn | Mọi owner | Cross-cutting across `UC-01`..`UC-15` | `P1-NFR-004` | `lingora-web`, `lingora-admin` shared UI (Loading skeleton, ErrorBoundary, EmptyState) | `M1.6W-T-002/008/009/010` (PASS) | `IMPLEMENTED (Foundation established in lingora-web)` |
| **MVP-19** | Quyền riêng tư và audit | Administrator | `UC-11 Manage Accounts`, `UC-13 View & Audit Security Logs` | `P1-NFR-001` | Supabase RLS, Audit log store, server-side validation | `M1.3-T-001` (RLS harness PASS: 34/34 tests) | `PARTIAL (RLS enforced at DB; dedicated Audit UI pending M3)` |

---

## 2. Use Case Catalog: 14 Core MVP Use Cases (UC-01..UC-14) & 1 Optional B2B Module (UC-15)

| UC ID | Tên Use Case | Tác Nhân Chính | Gói Chức Năng | MVP Functions | Trạng Thái Triển Khai |
|---|---|---|---|---|---|
| `UC-01` | Authenticate & Manage Session | Learner, Admin | Core Learning / Admin | `MVP-01` | `IMPLEMENTED (M1.6W Web SSR Auth + Supabase GoTrue)` |
| `UC-02` | Configure Goals & Study Time | Learner | Core Learning | `MVP-02`, `MVP-10` | `PARTIAL (DB Profile ready; Onboarding/Goal UI pending M2)` |
| `UC-03` | Take Placement Test | Learner | Core Learning | `MVP-03` | `DESIGN (Approved specification; Implementation pending)` |
| `UC-04` | Browse Learning Path | Learner | Core Learning | `MVP-04` | `PARTIAL (DB Course/Lesson ready; Web UI pending M2)` |
| `UC-05` | Complete Lesson Exercises | Learner | Core Learning | `MVP-05`, `MVP-06`, `MVP-07` | `PARTIAL (Schema/types ready; Exercise engine pending M2)` |
| `UC-06` | Spaced Repetition Review (SRS) | Learner | Core Learning | `MVP-09` | `PARTIAL (RPC record_review ready; Web UI pending M2)` |
| `UC-07` | Track Progress & Streak | Learner | Core Learning (included by UC-05, UC-06) | `MVP-08`, `MVP-10`, `MVP-11` | `PARTIAL (DB progress/streak ready; full UI pending M2)` |
| `UC-08` | Create & Edit Lesson Draft | Lesson Creator | Content Workflow | `MVP-05`, `MVP-06`, `MVP-12` | `PARTIAL (DB schema ready; Admin authoring UI pending M3)` |
| `UC-09` | Review & Approve Content | Moderator | Content Workflow | `MVP-07`, `MVP-13` | `DESIGN (Review flow specified; UI pending M3)` |
| `UC-10` | Publish Approved Content | Organizational Manager | Content Workflow | `MVP-13` | `PARTIAL (isPublished flag in DB; Publishing UI pending M3)` |
| `UC-11` | Manage Accounts & Roles | Administrator | Administration & Operations | `MVP-14`, `MVP-19` | `PARTIAL (Prisma Profile ready; Role management UI pending M3)` |
| `UC-12` | View System Reports | Administrator | Administration & Operations | `MVP-15` | `DESIGN (Metrics specified; Dashboard pending M3)` |
| `UC-13` | View & Audit Security Logs | Administrator | Administration & Operations | `MVP-19` | `PARTIAL (DB RLS logs ready; Audit UI pending M3)` |
| `UC-14` | Handle Support Tickets | Operations Staff | Administration & Operations | `MVP-16` | `DESIGN (GAP: Support ticket schema and UI pending Ops milestone)` |
| `UC-15` | [OPTIONAL B2B / FUTURE] Manage Cohorts & Group Progress | Organizational Manager | Optional Cohort Module | `MVP-17` | `DESIGN (FUTURE / OPTIONAL: Cohort schema and UI pending optional module)` |

---

## 3. Engineering Requirements (P1-FR, P1-NFR, ML-GEC) Traceability

| Requirement ID | Priority | Mapped UC | Architecture | Data Entity | API / RPC | Test Evidence | Status |
|---|---|---|---|---|---|---|---|
| **P1-FR-001** | Must | `UC-01` | `docs/01` Web SSR Auth | `Profile` | Supabase Auth (GoTrue ES256) | `M1.6W-T-003/004/005` (PASS) | `IMPLEMENTED (M1.6W)` |
| **P1-FR-002** | Must | `UC-04`, `UC-05` | `docs/01` Architecture | `Course`, `Lesson`, `Vocabulary` | PostgREST / Storage (`lingora-media`) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-003** | Must | `UC-05`, `UC-08` | `docs/01` Architecture | `Exercise.payload`, `UserProgress` | Server Actions / Client Engine | `M1.6W-T-002` (PASS) | `PARTIAL (Pending M2 Engine)` |
| **P1-FR-004** | Must | `UC-05`, `UC-07` | `docs/01` Architecture | `UserProgress` | Server Action (Score aggregate 0–100%) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-005** | Must | `UC-06` | `docs/01` SRS boundary | `UserVocabSrs`, `ReviewLog` | Deterministic due-card query | `M1.6W-T-006-RERUN` (PASS) | `PARTIAL (Audit Pending)` |
| **P1-FR-006** | Must | `UC-06` | `docs/01` RPC boundary | `UserVocabSrs`, `ReviewLog` | RPC `record_review` | `M1.3-T-001` (PASS: 34/34 tests) | `IMPLEMENTED (M1.3)` |
| **P1-FR-007** | Must | Scenario Writing | `docs/01` GEC boundary | `ChatScenario` (transient result) | Route Handler `/api/ai/gec` ➔ `/v1/gec/correct` | `M1.6W-T-007-RERUN` | `TARGET (Pending GEC API)` |
| **P1-FR-008** | Must | `UC-08`..`UC-11` | `docs/01` Admin boundary | `Course`, `Lesson`, `Exercise`, `Profile` | Admin Client / PostgREST RLS | `M1.3-T-001` (PASS) | `PARTIAL (DB ready; UI pending M3)` |
| **P1-FR-009** | Must | `UC-08` | `docs/01` Storage | `lingora-media`, `lingora-avatars` | Supabase Storage API + RLS policies | `M1.3-T-002` (PASS) | `IMPLEMENTED (M1.3)` |
| **P1-FR-010** | Must | `UC-01`..`UC-07` | `docs/01` i18n | `Language`, `*Translation` | Next.js Locale Catalog (`vi` / `en`) | `M1.6W-T-002` (PASS) | `IMPLEMENTED (M1.6W)` |
| **P1-FR-011** | Must | `UC-07` | `docs/01` Gamification | `Profile.streakCount`, `lastQualifyingActivityDate` | Server Action (Timezone-aware check) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-012** | Must | `UC-05` | `docs/01` ADR-006 | `Exercise.payload` (`type='GRAMMAR'`) | Client render component & validation | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-013** | Must | `UC-05` | `docs/01` ADR-006 | `Exercise.payload` (`type='LISTENING'`) | Audio element + Storage playback | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-014** | Must | `UC-02` | `docs/01` ADR-006 | `Profile.dailyGoalMin` | Profile Update Action (5–120 min) | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-015** | Must | In-App Reminder | `docs/01` ADR-008 | Client-local state (No reminder entity) | In-App Banner/Toast | Planned M2+ tests | `LOCKED (Option 6d; Later M2+)` |
| **P1-FR-016** | Must | `UC-03` | `docs/01` Placement | ~30 Questions & Starting Unit mapping (OD-PLACEMENT-MAPPING: APPROVED MAPPING A [0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6]) | Placement test service/API | Planned Placement tests | `DESIGN (Specification locked; Implementation pending)` |
| **P1-FR-017** | Nice / P2 | Achievements | `docs/01` Achievements | Private badge catalog | Badge evaluation service | Planned Badge tests | `[OPTIONAL / DEFERRED FROM MUST]` |
| **P1-NFR-001**| Must | All | `docs/01` Security | RLS on all 17 tables | JWT ES256 / RLS enforced at DB | `M1.3-T-001`, `M1.5-AMEND-T-001` | `IMPLEMENTED (M1.3/M1.5/M1.6W)` |
| **P1-NFR-002**| Must | `UC-05`, `UC-06`| `docs/01` Resilience | SRS state usable without GEC | 8s GEC timeout + recoverable UI | `M1.6W-T-006/007` (PASS) | `IMPLEMENTED (Foundation)` |
| **P1-NFR-003**| Must | AI API | `docs/01` Contract | N/A | snake_case, error envelope, compatibility | Historical 37-test suite (PASS) | `CONTRACT LOCKED` |
| **P1-NFR-004**| Must | All Web UI | `docs/01` UX | N/A | Resilient UI States (Loading/Empty/Error) | `M1.6W-T-002/008/009/010` (PASS) | `IMPLEMENTED (M1.6W)` |
| **ML-GEC-FR-001** | Must | GEC Pipeline | `docs/01` ML boundary | Dataset artifacts outside DB | Preprocessing pipeline | Future dataset tests | `APPROVED / PENDING` |
| **ML-GEC-FR-002** | Must | GEC Inference | `docs/01` T5-small | `logs/model-registry.csv` | `/v1/gec/correct`, `/v1/model/info` | Future training tests | `APPROVED / PENDING` |
| **ML-GEC-FR-003** | Must | GEC Alignment | `docs/01` Derived output | None; transient response | GEC corrections / error_type | Future diff tests | `APPROVED / PENDING` |
| **ML-GEC-FR-004** | Must | GEC Evaluation | `docs/01` Evaluation | `logs/model-registry.csv` | `/v1/model/info` | Future F0.5/ERRANT evidence | `APPROVED / PENDING` |
| **ML-GEC-FR-005** | Should | GEC Optional | Optional derived modules | None; transient response | Optional suggestion/explanation | Future optional tests | `APPROVED OPTIONAL / PENDING` |
| **ML-GEC-NFR-001** | Must | GEC Security | Stateless boundary | None | GEC endpoint + standard errors | Future contract tests | `APPROVED / PENDING` |
| **ML-GEC-NFR-002** | Must | GEC Latency | CPU deployment | `logs/model-registry.csv` | latency_ms + 8s Web timeout | Future latency tests | `APPROVED / PENDING` |
