# 05 - Lingora Traceability Matrix

> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014):**
> This matrix provides bidirectional traceability between the **19 Phase 0 MVP Functions (`MVP-01`..`MVP-19`)**, the **15 Canonical Use Cases (`UC-01`..`UC-15`)**, Engineering Requirements (`P1-FR-*`, `P1-NFR-*`, `ML-GEC-*`), Data Entities, Runtime Surfaces, and Test Evidence.

---

## 1. Phase 0 MVP Function ➔ Use Case Traceability Matrix

| MVP ID | MVP Chức Năng | Owner Chính | Canonical Use Case | Requirements | Runtime Surface | Test Evidence | Trạng Thái (Status) |
|---|---|---|---|---|---|---|---|
| **MVP-01** | Đăng ký, đăng nhập, quên mật khẩu (design spec), khôi phục phiên | Administrator, All Roles | `UC-01 Authenticate & Manage Session` | `P1-FR-001`, `P1-NFR-001` | `lingora-web` (`/login`, `/register`, `@supabase/ssr`), Supabase GoTrue | `M1.6W-T-003/004/005` (PASS; Password Recovery: DESIGN SPEC ONLY / Runtime Pending) | `IMPLEMENTED (Auth Foundation) / PENDING (Recovery Runtime)` |
| **MVP-02** | Onboarding mục tiêu học | Learner | `UC-02 Configure Goals & Study Time` | `P1-FR-010`, `P1-FR-014` | `lingora-web` (`/profile`, `Profile.dailyGoalMin`, `uiLocale`) | `P1-T-018`, `M1.6W-T-002` (PASS) | `PARTIAL (Profile ready, Onboarding UI pending M2)` |
| **MVP-03** | Đánh giá chẩn đoán (Diagnostic) hoặc chọn cấp độ | Learner | `UC-03 Stage-Adaptive Diagnostic Assessment` | `P1-FR-016` | `lingora-web` (Diagnostic runner), Common Assessment Engine, Starting Unit mapper (OD-PLACEMENT-MAPPING: APPROVED MAPPING A [0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6] as initial English A1 curriculum placement rule) | Planned placement/diagnostic tests | `DESIGN (Specification updated; Implementation pending)` |
| **MVP-04** | Lộ trình học (Curriculum & Remediation) | Lesson Creator | `UC-04 Browse Learning Path` | `P1-FR-002` | `lingora-web` (`/courses`, `/learn`, Course/Lesson tree, Remedial Micro-lessons), Supabase RLS | `M1.4-T-001` (Seed PASS), `P1-T-002` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-05** | Lesson ngắn 5–10 phút | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-002`, `P1-FR-004` | `lingora-web` (Player), `lingora-admin` (Authoring), `Lesson` entity | `M1.4-T-001` (PASS) | `PARTIAL (DB ready; Player pending M2; Admin pending M3)` |
| **MVP-06** | Năm dạng exercise đề cương (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR) | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-003` (Core 3 types: `MCQ`, `FILL_BLANK`, `REORDER`; ext: `P1-FR-012` `GRAMMAR`, `P1-FR-013` `LISTENING`) | `lingora-web` (Exercise engine), `Exercise.payload` (Prisma JSONB) | `M1.6W-T-002` (PASS), `P1-T-003` | `PARTIAL (Prisma schema ready; Player pending M2)` |
| **MVP-07** | Phản hồi tức thời & giải thích | Moderator | `UC-05 Complete Lesson Exercises`, `UC-09 Review Content` | `P1-FR-003`, `P1-FR-012` | `lingora-web` (Instant feedback component), `Exercise.payload` | `P1-T-003`, `P1-T-016` | `PARTIAL (Payload schema ready; interactive UI pending M2)` |
| **MVP-08** | Tiến độ học tập cá nhân (Tách biệt Progress vs Mastery) | Learner | `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-004` | `lingora-web`, Supabase `UserProgress` table (Curriculum progress separate from skill mastery) | `M1.4-T-001` (PASS), `P1-T-004` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-09** | Ôn tập nội dung yếu (SRS) | Learner | `UC-06 Spaced Repetition Review (SRS)` | `P1-FR-005`, `P1-FR-006` | `lingora-web` (`/srs`), RPC `record_review`, `user_vocab_srs`, `review_logs` | `M1.3-T-001` (RPC PASS), `M1.4-T-001`, `M1.6W-T-006-RERUN` | `PARTIAL (RPC/DB ready; Web deterministic review UI pending M2)` |
| **MVP-10** | Daily goal và streak | Learner | `UC-02 Configure Goals`, `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-011`, `P1-FR-014` | `lingora-web`, `Profile.streakCount`, `lastQualifyingActivityDate` | `M1.4-T-001` (PASS), `P1-T-011`, `P1-T-018` | `PARTIAL (DB fields ready; UI pending M2)` |
| **MVP-11** | Báo cáo cá nhân (Skill Profile & Readiness) | Learner | `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-004`, `P1-FR-011`, `P1-FR-017` | `lingora-web` (`/profile`, spider/radar stats card: Progress, Skill Profile, Mastery, Level Readiness) | `M1.6W-T-002` (PASS) | `PARTIAL (Foundation ready; full dashboard pending M2)` |
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
| `UC-03` | Take Diagnostic Assessment / Select Level | Learner | Core Learning | `MVP-03` | `DESIGN (Approved specification; Implementation pending)` |
| `UC-04` | Browse Learning Path | Learner | Core Learning | `MVP-04` | `PARTIAL (DB Course/Lesson ready; Web UI pending M2)` |
| `UC-05` | Complete Lesson Exercises | Learner | Core Learning | `MVP-05`, `MVP-06`, `MVP-07` | `PARTIAL (Schema/types ready; Exercise engine pending M2)` |
| `UC-06` | Spaced Repetition Review (SRS) | Learner | Core Learning | `MVP-09` | `PARTIAL (RPC record_review ready; Web UI pending M2)` |
| `UC-07` | Track Progress, Mastery & Readiness | Learner | Core Learning (included by UC-05, UC-06) | `MVP-08`, `MVP-10`, `MVP-11` | `PARTIAL (DB progress/streak ready; full UI pending M2)` |
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
| **P1-FR-001** | Must | `UC-01` | `docs/01` Web SSR Auth, Password Recovery Spec | `Profile` | Supabase Auth (GoTrue ES256, `POST /auth/v1/recover`) | `M1.6W-T-003/004/005` (PASS; Recovery: DESIGN SPEC ONLY / Runtime Pending) | `IMPLEMENTED (M1.6W Auth) / PENDING (Recovery Runtime)` |
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
| **P1-FR-016** | Must | `UC-03` | `docs/01 §3`, `docs/phase-1-m2-1-domain-and-logical-data-foundation.md §6.12`, `docs/09-placement-and-jump-specification.md` | `LearnerProfile`, `SkillProfile`, `AssessmentResult` | Common Assessment Engine / Starting Unit mapper (OD-PLACEMENT-MAPPING: APPROVED MAPPING A for initial English A1 scope) | Planned Placement/Diagnostic tests | `DESIGN (Specification updated; Implementation pending)` |
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

---

## 4. Multilateral Traceability: Expert Research ➔ Design Decision ➔ Requirement ➔ Use Case ➔ Domain Concept

| Mã Bằng Chứng Chuyên Gia | Phát Hiện Thực Nghiệm (Expert Finding) | Quyết Định Thiết Kế (Design Decision) | Yêu Cầu Kỹ Thuật (Requirements) | Use Case Liên Kết | Khái Niệm / Thực Thể Domain Liên Kết | Trạng Thái Quyết Định |
|---|---|---|---|---|---|---|
| **E-EXP-01** (Thầy Quân) | Người học tự đánh giá sai trình độ (người đi làm tự nhận mất gốc nhưng test được A2/B1; sinh viên nhận B2 nhưng rỗng ngữ pháp/nghe) | Quyết định D4: Luồng khởi đầu linh hoạt. Tách biệt hoàn toàn `Initial Self-Reported Level` (tự chọn) với `Verified Proficiency` (đã qua kiểm tra) | `MVP-03`, `P1-FR-016` | `UC-03`, `UC-02` | `LearnerProfile.selfReportedLevel` vs `LearnerProfile.verifiedProficiency` | `FROZEN` |
| **E-EXP-02** (Thầy Quân) | Năng lực ngôn ngữ phát triển lệch (Spiky Profile / Jagged Skills); điểm trung bình phẳng làm che giấu lỗ hổng kỹ năng | Quyết định D1: Đánh giá chẩn đoán đa chiều (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu). Xuất Skill Profile đa chiều (Spider/Radar), không gộp thành 1 điểm chung duy nhất | `MVP-03`, `MVP-11`, `P1-FR-016` | `UC-03`, `UC-07` | `SkillProfile` (4 chiều năng lực), `AssessmentResult.dimensions` | `FROZEN` (Cấu trúc 4 chiều) / `PENDING VALIDATION` (Thuật toán Anchor Level) |
| **E-EXP-03** (Thầy Quân) | "Intermediate Trap" (kẹt ở B1/B2 do ảo tưởng hoàn thành bài học là đã giỏi; thiếu cơ chế xác nhận sẵn sàng lên cấp) | Tách biệt 4 khái niệm: Progress ≠ Proficiency ≠ Mastery ≠ Level Readiness. Đánh giá sẵn sàng chuyển cấp phải dựa trên bằng chứng tổng hợp | `MVP-08`, `MVP-11`, `YC-CORE-11`, `YC-EXT-03` | `UC-07`, `UC-04` | `LearningProgress` (sở hữu duy nhất bởi `LearnerProfile`), `ConceptMastery`, `LevelReadiness` | `FROZEN` |
| **E-EXP-04** (Cô Mai) | "Rào cản chữ Hán" & "Bẫy Pinyin" (nhìn pinyin thì đọc hiểu nhưng giấu pinyin thì mù chữ Hán); cần đo chính xác khả năng nhận diện ký tự | Kiến trúc Common Assessment Engine dùng chung cho đa ngôn ngữ, tham số hóa qua config. Phần đọc hiểu tiếng Trung mặc định ẩn pinyin (`hidePinyin: true`) | `MVP-03`, `P1-FR-016`, `NFR-LOC` | `UC-03` | `AssessmentResult.languageConfig`, Common Assessment Engine | `FROZEN` |
| **E-EXP-05** (Cô Mai) | Lỗi ngữ pháp trật tự từ và hư từ phân tán theo từng điểm kiến thức cụ thể, cần theo dõi lỗ hổng kiến thức chính xác | Concept Tagging trên bài tập/bài học để phát hiện Knowledge Gap cụ thể thay vì chỉ ghi nhận đúng/sai cơ học | `MVP-06`, `MVP-07`, `P1-FR-003`, `P1-FR-012` | `UC-05` | `ConceptMastery`, `KnowledgeGap` | `FROZEN` |
| **E-EXP-06** (Cô Mai & Thầy Quân) | Người học nản lòng và bỏ cuộc nếu bị hạ toàn bộ cấp độ (demotion) hoặc bị ép học lại bài cũ | Cơ chế Remedial Learning tại cấp độ Concept/Skill: giao micro-lesson bổ khuyết với ngữ cảnh mới; 3 trạng thái chuyển tiếp (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`) | `MVP-04`, `YC-EXT-03` | `UC-04` | `RemedialModule`, `Recommendation`, `LevelReadiness` | `FROZEN` (Nguyên lý Remediation) / `CONFIGURABLE` (Ngưỡng kích hoạt) |
| **E-EXP-07** (Thầy Quân & Cô Mai) | Người học mệt mỏi và làm bừa nếu bài test chẩn đoán vượt quá 15–20 phút | Quyết định D3: Stage-Adaptive Diagnostic Assessment 2 giai đoạn (Routing Stage → Targeted Stage, ~25–30 items, ≤ 15 min) | `MVP-03`, `P1-FR-016` | `UC-03` | `AssessmentResult.stageData` | `FROZEN` (Kiến trúc 2 giai đoạn) / `PROPOSED / PENDING VALIDATION` (Số lượng item, ngưỡng thăng/giáng nhánh) |

---

## 5. End-to-End Multilateral Traceability: YC ➔ MVP ➔ P1-FR ➔ UC ➔ Domain Design

Bảng dưới đây thiết lập chuỗi truy vết khép kín toàn diện 5 tầng:
`YC (Yêu cầu Nghiệp vụ)` $\longrightarrow$ `MVP (Chức năng Sản phẩm)` $\longrightarrow$ `P1-FR / NFR (Đặc tả Kỹ thuật)` $\longrightarrow$ `UC (Use Case Hệ thống)` $\longrightarrow$ `Design (Mô hình Thực thể Dữ liệu / Domain Design)`

### 5.1. Bảng Truy vết 12 Yêu cầu Nghiệp vụ Cốt lõi (YC-CORE-01 .. YC-CORE-12)

| Mã YC | Tên Yêu Cầu Nghiệp Vụ | Chức Năng MVP | Đặc Tả Kỹ Thuật (P1-FR / NFR) | Canonical Use Case | Thực Thể Miền & Cấu Trúc Thiết Kế Logic | Trạng Thái |
|---|---|---|---|---|---|---|
| **YC-CORE-01** | Đăng ký, đăng nhập, quên mật khẩu (design spec), bảo vệ phiên, phân quyền, chọn ngôn ngữ học | `MVP-01`, `MVP-02` | `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `UC-01`, `UC-02` | `Profile`, `Language`, `@supabase/ssr` session cookie, Password Recovery Spec | `IMPLEMENTED (Auth M1.6W) / PENDING (Recovery Runtime)` |
| **YC-CORE-02** | Tạo khung khóa học, Unit, phân công biên soạn (Assignment Brief) | `MVP-04`, `MVP-12` | `P1-FR-002`, `P1-FR-008` | `UC-08` | `Course`, `Unit`, `Lesson` (`creatorId`, `assignmentBrief`) | `PARTIAL (DB ready; Admin UI M3)` |
| **YC-CORE-03** | Biên soạn học liệu, tải âm thanh chuẩn, 5 dạng bài tập, giải thích đáp án | `MVP-05`, `MVP-06`, `MVP-07`, `MVP-12` | `P1-FR-003`, `P1-FR-009`, `P1-FR-012`, `P1-FR-013` | `UC-05`, `UC-08` | `Lesson`, `Vocabulary`, `LessonVocabulary`, `Exercise` (5 types: MCQ, FILL, REORDER, LISTENING, GRAMMAR), `Concept` | `PARTIAL (Prisma schema ready; UI M2/M3)` |
| **YC-CORE-04** | Kiểm duyệt bài học độc lập, nghe 100% âm thanh, phê duyệt / từ chối | `MVP-07`, `MVP-13` | `P1-FR-008` | `UC-09` | `Lesson` (`reviewerId`, `status: ContentStatus`), `Exercise`, `AuditLog` | `DESIGN / PARTIAL (Workflow specified; Admin UI M3)` |
| **YC-CORE-05** | Xuất bản bài học, mở khóa Unit đủ 4 bài, xuất bản khẩn cấp có giải trình | `MVP-13`, `MVP-19` | `P1-FR-008`, `P1-NFR-001` | `UC-10`, `UC-13` | `Course`, `Unit`, `Lesson.isPublished`, `AuditLog` | `PARTIAL (DB flag ready; UI M3)` |
| **YC-CORE-06** | Nhân bản bài học đã xuất bản (Clone-to-draft v2), không sửa in-place | `MVP-12`, `MVP-13` | `P1-FR-008` | `UC-08` | `Lesson.supersedesId`, Revision v2 pipeline, `AuditLog` | `LOCKED (ADR-002 / Spec)` |
| **YC-CORE-07** | Học bài học vi mô, làm bài tập 5 dạng, controlled retry, phân biệt progress/mastery | `MVP-05`, `MVP-06`, `MVP-07`, `MVP-08` | `P1-FR-002`, `P1-FR-003`, `P1-FR-004`, `P1-FR-012`, `P1-FR-013` | `UC-04`, `UC-05`, `UC-07` | `UserProgress`, `LearningProgress`, `Concept`, `ConceptMastery`, `KnowledgeGap` | `PARTIAL (DB ready; Player M2)` |
| **YC-CORE-08** | Lập lịch & thực hiện ôn tập từ vựng ngắt quãng (SRS Policy B: 1,3,7,14,30) | `MVP-09` | `P1-FR-005`, `P1-FR-006` | `UC-06` | `UserVocabSrs`, `ReviewLog`, `Vocabulary`, RPC `record_review` | `PARTIAL (RPC PASS; Review UI M2)` |
| **YC-CORE-09** | Đánh giá chẩn đoán thích ứng 2 giai đoạn, Skill Profile 4 chiều, Starting Unit | `MVP-03` | `P1-FR-016` | `UC-03` | `LearnerProfile`, `SkillProfile`, `AssessmentResult`, `Concept`, Starting Unit Mapper (Mapping A) | `DESIGN (Frozen architecture; Spec ready)` |
| **YC-CORE-10** | Theo dõi chuỗi ngày học liên tục (Streak), mục tiêu ngày (5–120p), nhắc in-app | `MVP-02`, `MVP-10` | `P1-FR-011`, `P1-FR-014`, `P1-FR-015` | `UC-02`, `UC-07` | `Profile` (`streakCount`, `dailyGoalMin`, `timezone`, `lastQualifyingActivityDate`), Client State | `PARTIAL (DB fields ready; UI M2)` |
| **YC-CORE-11** | Báo cáo cá nhân tổng hợp, phân định 4 khái niệm (Progress/Proficiency/Mastery/Readiness) | `MVP-08`, `MVP-11` | `P1-FR-004`, `P1-FR-011`, `P1-FR-017` | `UC-07` | `LearningProgress`, `SkillProfile`, `ConceptMastery`, `LevelReadiness` | `PARTIAL (Entities designed; Dashboard M2)` |
| **YC-CORE-12** | Quản trị tài khoản 6 vai trò, phân quyền SoD, ghi nhật ký kiểm toán bất biến | `MVP-14`, `MVP-19` | `P1-FR-008`, `P1-NFR-001` | `UC-11`, `UC-13` | `Profile` (`role`, `assignedRoles`), `AuditLog` | `PARTIAL (RLS harness PASS; Admin UI M3)` |

### 5.2. Bảng Truy vết 8 Yêu cầu Chức năng Mở rộng (YC-EXT-01 .. YC-EXT-08) & Chức năng Bổ trợ

| Mã YC | Tên Yêu Cầu Mở Rộng | Phân Loại / Module | Đặc Tả Kỹ Thuật (P1-FR / ML-GEC) | Canonical Use Case | Thực Thể Miền & Cấu Trúc Thiết Kế Logic | Trạng Thái Triển Khai |
|---|---|---|---|---|---|---|
| **YC-EXT-01** | Sửa lỗi ngữ pháp câu viết tự luận (GEC AI tool) | Supporting AI (GEC) | `P1-FR-007`, `ML-GEC-FR-001..005`, `ML-GEC-NFR-001..002` | Scenario Writing (`MVP-18` support) | `ChatScenario` (kết quả transient via Route Handler `/api/ai/gec`, không lưu lỗi vào DB) | `APPROVED PENDING (FastAPI model pipeline)` |
| **YC-EXT-02** | Luyện hội thoại theo tình huống thực tế (Roleplay Chat) | Supporting AI (NLP) | `P1-FR-007`, `P1-NFR-003` | Scenario Roleplay | `ChatScenario`, `ChatScenarioTranslation`, `ChatSession`, `ChatMessage` | `COMPATIBILITY SURFACE (FastAPI /v1/chat/roleplay)` |
| **YC-EXT-03** | Đề xuất lộ trình thích ứng & học bổ trợ khái niệm (Remedial Learning) | Core Adaptive Extension | `P1-FR-016`, `E-EXP-06` | `UC-04`, `UC-07` | `RemedialModule`, `Recommendation`, `KnowledgeGap`, `LevelReadiness`, `Concept` | `FROZEN ARCHITECTURE (Logical design M2.1)` |
| **YC-EXT-04** | Tiếp nhận & phân phối phiếu hỗ trợ người dùng (Support Ticket) | Administration & Operations | Operational Support | `UC-14` (`MVP-16`) | `SupportTicket` (`userId`, `assignedTo`, `status`) [Extension Boundary] | `DESIGN GAP (Scheduled for Ops Milestone)` |
| **YC-EXT-05** | Bảng điều khiển tra cứu và lọc nhật ký kiểm toán hệ thống | Administration & Operations | `P1-FR-008`, `P1-NFR-001` | `UC-12`, `UC-13` (`MVP-15`, `MVP-19`) | `AuditLog` [Target Schema] | `DESIGN (Scheduled for Admin M3)` |
| **YC-EXT-06** | Chuyển đổi ngôn ngữ giao diện song ngữ (i18n vi / en) | Cross-cutting Foundation | `P1-FR-010`, `P1-NFR-004` | Cross-cutting `UC-01`..`UC-15` (`MVP-18`) | `Language`, Next.js Locale Catalog (`vi` / `en`) | `IMPLEMENTED (M1.6W)` |
| **YC-EXT-07** | Gửi email nhắc nhở học tập định kỳ (Ngoài phạm vi MVP) | Deferred External Service | Notification Policy | `UC-02` (mở rộng) | Client-local daily goal setting; external email service deferred | `DEFERRED (Outside MVP scope)` |
| **YC-EXT-08** | Nhập danh mục bài học hàng loạt từ bảng tính (CSV/Excel) | Content Authoring Extension | `P1-FR-008` | `UC-08` | Batch importer service $\rightarrow$ `Lesson`, `Vocabulary`, `Exercise` (Draft) | `PLANNED (Post-M3 feature)` |
| — | Quản lý nhóm học viên & tiến độ lớp học (Cohort Portal) | Optional B2B Module | Organizational Extension | `UC-15` (`MVP-17`) | `Cohort`, `CohortMember` [Extension Boundary] | `DESIGN (Optional B2B Module / Future)` |

---

## 6. D3 Assessment & Learning Engine Traceability (Design-Only)

> Detail: [`docs/phase-1-d3-assessment-learning-engine-design.md`](phase-1-d3-assessment-learning-engine-design.md) (A–Q). 15-UC catalog unchanged (`UC-01`..`UC-15`). No new evidence invented. English A1 Mapping A is D2 compatibility (`docs/09-placement-and-jump-specification.md` §2), not a D3 scoring rule.

| Research / Evidence → Decision | Requirement → UC | Domain → D3 rule | D3 section |
|---|---|---|---|
| `E-EXP-01` → D4 flexible entry (`selfReportedLevel UNVERIFIED` ≠ `verifiedProficiency`) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03`, `UC-02` | `LearnerProfile` → `AssessmentResult` → `SkillProfile` → starting point | D3 §B, §C, §D, §I |
| `E-EXP-02` → D1 four-dimension profile (no flat average; Anchor pending) | `YC-CORE-09` → `MVP-03`, `MVP-11` → `P1-FR-016` → `UC-03`, `UC-07` | `SkillProfile` 4 dims + provenance + `sourceAssessmentResultId` | D3 §D |
| `E-EXP-07` → D3 two-stage adaptive (`ROUTING → TARGETED`; scale proposed) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | Engine stages → `AssessmentResult.stageData` | D3 §B, §C |
| `E-EXP-05` → concept-tagged errors → gaps | `YC-CORE-07` → `MVP-05/06/07` → `P1-FR-003` → `UC-05` | `Exercise` → `Concept` → `ConceptMastery` ↔ `KnowledgeGap` (typed error evidence) | D3 §E |
| `E-EXP-03` → four-concept separation (`LearningProgress` ≠ Proficiency ≠ Mastery ≠ Readiness) | `YC-CORE-11` → `MVP-08`, `MVP-11` → `P1-FR-004` → `UC-07` | `LearningProgress` / `SkillProfile` / `ConceptMastery` / `LevelReadiness` | D3 §D, §E, §F, §I |
| `E-EXP-06` → concept remediation + 3-state transition (no downgrade, no replay) | `YC-EXT-03` → `MVP-04` → `P1-FR-016` → `UC-04`, `UC-07` | `LevelReadiness` (`ADVANCE` / `ADVANCE_WITH_SUPPORT` / `REMEDIATE`) → `RemedialModule` → `Recommendation` | D3 §F, §G, §H |
| `E-EXP-04` → 4-tier multi-lang chain + `hidePinyin: true` | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | Engine → Config → Bank → Rubric; `AssessmentResult.languageConfig` | D3 §J, §A |

---

## 7. D4 Content & Curriculum Design Traceability (Logical Design)

> Detail: [`docs/phase-1-d4-content-curriculum-design.md`](phase-1-d4-content-curriculum-design.md) (A–T). Preserves 15-UC canonical catalog (`UC-01`..`UC-15`). Zero new requirements or ghost entities invented. All content rules trace backward to approved baselines and expert evidence.

| Source Evidence / Finding | Requirement → MVP → P1-FR → UC | Domain Entity / Logical Construct | D4 Content Design Rule | D4 Section | Status |
|---|---|---|---|---|---|
| `E-EXP-01` (Thầy Quân) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03`, `UC-02` | `LearnerProfile`, `Lesson`, `AssessmentItem` | Blueprint (§F) and Item Bank (§L) isolate unverified starting points from diagnostic items | D4 §F, §L | `FROZEN` |
| `E-EXP-02` (Thầy Quân) | `YC-CORE-09` → `MVP-03`, `MVP-11` → `P1-FR-016` → `UC-03`, `UC-07` | `SkillProfile`, `Exercise`, `AssessmentItem` | Exercise & Item authoring envelopes tag discrete skill dimensions (Vocab/Grammar/Reading/Listening) | D4 §H, §L | `FROZEN` |
| `E-EXP-03` (Thầy Quân) | `YC-CORE-11` → `MVP-08`, `MVP-11` → `P1-FR-004` → `UC-07` | `LearningProgress`, `ConceptMastery`, `LevelReadiness` | Strict separation: Lesson completion measures progress; mastery and readiness require evidence gates | D4 §D, §F | `FROZEN` |
| `E-EXP-04` (Cô Mai) | `YC-CORE-09`, `NFR-LOC` → `MVP-03` → `P1-FR-016` → `UC-03` | `LanguageConfig`, Common Engine | Declarative Chinese config enforces `hidePinyinDefault: true` for Hanzi reading assessment | D4 §M | `FROZEN` |
| `E-EXP-05` (Cô Mai) | `YC-CORE-07` → `MVP-05/06` → `P1-FR-003`, `P1-FR-012` → `UC-05` | `Concept`, `ConceptMastery`, `KnowledgeGap` | Authoritative `Concept` schema; 0 free-text `conceptTag` allowed; acyclic prerequisite DAG | D4 §G | `FROZEN` |
| `E-EXP-06` (Cô Mai & Quân) | `YC-EXT-03` → `MVP-04` → `P1-FR-016` → `UC-04` | `RemedialModule`, `KnowledgeGap`, `Recommendation` | RemedialModule delivers fresh context/exercises for target concept; no downgrade, no forced replay | D4 §K | `FROZEN` |
| `E-EXP-07` (Quân & Mai) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | `AssessmentItem`, `AssessmentResult.stageData` | Item Bank classifies items by difficulty bands (Entry/Mid/Upper) for 2-stage adaptive routing | D4 §L | `PROPOSED / PENDING` |
| ADR-002 / PO SoD | `YC-CORE-04..06` → `MVP-12/13/19` → `P1-FR-008` → `UC-08/10/13` | `Course`, `Unit`, `Lesson`, `AuditLog` | Content lifecycle SoD, Unit visibility (4/4 published), and `supersedesId` for Clone-to-Draft v2 | D4 §D | `FROZEN` |
| ADR-006 / PO Exercise Mix | `YC-CORE-03/07` → `MVP-05` → `P1-FR-012/013` → `UC-05` | `Exercise` (5 canonical types: MCQ, FILL, REORDER, LIS, GRM) | Standard 5-exercise mix per lesson; JSON authoring envelopes; 0 Matching canonical | D4 §H | `FROZEN (Logical)` |
| PO Policy D5 / D6 | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | `Unit`, `Lesson`, `AssessmentResult` | English A1 6-Unit/24-Lesson baseline mapping; Unit unlock via linear progress or Jump (>=95%) | D4 §E | `FROZEN (Mapping A)` |
| PO Policy D8 / SRS Baseline | `YC-CORE-08` → `MVP-09` → `P1-FR-005/006` → `UC-06` | `UserVocabSrs`, `Vocabulary` | MVP-09 is inherited from D8; D4 defines only vocabulary/content linkage (§J1) and does not redefine SRS scheduling policy | D4 §J | `FROZEN (D8)` |

---

## 8. M2.2 System Behavior, Use Cases & State Machine Traceability (Logical Design)

> Canonical Detail: [`docs/phase-1-m2-2-behavior-uc-activity-state.md`](phase-1-m2-2-behavior-uc-activity-state.md) (sections 1–16). Preserves the 15-UC canonical catalog (`UC-01`..`UC-15`) and maps exactly 15 Behavioral Families (`BF-01`..`BF-15`). Zero runtime code, zero schema migrations, zero ghost use cases (`UC-16/17/18`).

| Technical Requirement & Policy | MVP Feature | Canonical Use Case | Behavioral Family Mapping | Domain Entities & Logical State Representation | M2.2 Contract Ref | Governance Status |
|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Authentication Flow | `Profile`, Session Cookie (`@supabase/ssr`) | M2.2 §2 (UC-01), §3 | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Configuration | `Profile` (`dailyGoalMin`, `timezone`, In-app Reminder) | M2.2 §2 (UC-02), §3 | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Test Flow | `AssessmentResult`, `SkillProfile`, `verifiedProficiency`, `LearnerProfile` | M2.2 §2 (UC-03), §3, §6 | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump Flow & Path Browse | `Course`, `Unit`, `Lesson`, `LearningProgress` | M2.2 §2 (UC-04), §3, §6 | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learning Lesson & `BF-10` Controlled Retry | `Exercise`, `Concept`, `KnowledgeGap`, `ConceptMastery` | M2.2 §2 (UC-05), §3, §5 | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `UserVocabSrs`, `ReviewLog`, RPC `record_review` | M2.2 §2 (UC-06), §3, §7 | `FROZEN` |
| `P1-FR-004`, `P1-FR-011` (Skill Profile ref: `P1-FR-016`) | `MVP-08`, `MVP-10`, `MVP-11` | `UC-07` | `BF-13` Progress & Streak Tracking Flow | `LearningProgress`, `Profile.streakCount`, `SkillProfile`, `LevelReadiness` | M2.2 §2 (UC-07), §3, §4 | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03` Assignment, `BF-04` Authoring, `BF-06` Revision | `Lesson` (`creatorId`, `assignmentBrief`, `supersedesId`), `Exercise`, `Concept` | M2.2 §2 (UC-08), §3, §4 | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review Flow | `Lesson` (`reviewerId`, `status: IN_REVIEW / APPROVED / CHANGES_REQUESTED`), `AuditLog` | M2.2 §2 (UC-09), §3, §4 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13`, `MVP-19` | `UC-10` | `BF-07` Publication & `BF-02` Curriculum Planning | `Lesson.isPublished`, `Unit`, `AuditLog` | M2.2 §2 (UC-10), §3, §4 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-003 | `MVP-14` | `UC-11` | Account & Role Management | `Profile.role`, `AuditLog` | M2.2 §2 (UC-11), §3 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Reporting & Analytics | System Analytics Views, Aggregated Activity Logs | M2.2 §2 (UC-12), §3 | `DESIGN` |
| `P1-NFR-001`, ADR-004 | `MVP-19` | `UC-13` | Security Audit Log | `AuditLog` (immutable event ledger) | M2.2 §2 (UC-13), §3 | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Operations & Ticket Flow | `SupportTicket`, `Profile` | M2.2 §2 (UC-14), §3 | `DESIGN / SUPPORTING` |
| Scenario Writing with GEC (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless Service)* | `BF-14` Scenario Writing with GEC Flow | `ChatScenario`, transient `/api/ai/gec` | M2.2 §3 (BF-14) | `FROZEN (Stateless Service)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | `Cohort`, `CohortMember` (Extension Boundary) | M2.2 §2 (UC-15), §3 | `OPTIONAL BOUNDARY` |

---

## 9. M2.3 Sequence Interactions, API Contracts & Service Boundaries Traceability (Logical Design)

> Canonical Detail: [`docs/phase-1-m2-3-sequence-api-service-boundary.md`](phase-1-m2-3-sequence-api-service-boundary.md) (sections 1–11). Preserves 15-UC canonical catalog (`UC-01`..`UC-15`) and 15 Behavioral Families (`BF-01`..`BF-15`). Zero runtime code, zero schema migrations, zero ghost use cases (`UC-16/17/18`).

| Technical Requirement & Policy | MVP Feature | Canonical UC | Behavioral Family Mapping | Domain / Persistence Boundary | M2.3 Sequence Flow Ref | M2.3 Contract & Service Surface Ref | Governance Status |
|---|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Authentication Flow | `Profile`, Supabase GoTrue Auth, Session Cookie | `SEQ-01` | Surface 5 (GoTrue), §4.1 BFF | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Configuration | `Profile` (`dailyGoalMin`, `timezone`), `LearnerProfile` | `SEQ-02` | Surface 10 (App Services), §5 State 4 | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Test Flow | `AssessmentResult`, `SkillProfile`, `verifiedProficiency` | `SEQ-03` | Surface 10, §4.1 PlacementService, Mapping A | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump Flow & Path Browse | `Course`, `Unit`, `Lesson`, `LearningProgress` | `SEQ-04` | Surface 10, §4.1 JumpService (>=95%, 24h) | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learn & `BF-10` Retry | `Exercise`, `Concept`, `KnowledgeGap`, `ConceptMastery` | `SEQ-05` | Surface 6/8, §4.1 LessonExecutionService | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `user_vocab_srs`, `review_logs`, RPC `record_review` | `SEQ-06` | Surface 7 (RPC), §4.1 SrsScheduler (Policy B) | `FROZEN` |
| `P1-FR-004`, `P1-FR-016` (Skill Profile) | `MVP-08/10/11` | `UC-07` | `BF-13` Progress Tracking | `LearningProgress`, `Profile.streak_count`, `SkillProfile` | `SEQ-07` | Surface 6/7, §4.1 StreakEvaluator (Asia/Ho_Chi_Minh) | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03/04/06` Authoring | `Lesson` (`creatorId`), `Exercise` (supersedesId [TARGET-CANDIDATE DD-02]) | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review | `Lesson` (`reviewerId`, `status: IN_REVIEW/APPROVED`) | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13/19` | `UC-10` | `BF-07` Publish & `BF-02` Plan | `Lesson.isPublished`, `Unit` (4/4 published), `AuditLog` | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-003 | `MVP-14` | `UC-11` | Account/Role Management | `Profile.role`, `AuditLog` | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 AdminService | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Analytics & Reports | System Aggregated Views, Activity Logs | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 AdminService | `DESIGN` |
| `P1-NFR-001`, ADR-004 | `MVP-19` | `UC-13` | Security Audit Ledger | `AuditLog` (immutable event store) | `SEQ-09` | Surface 9 (Admin/Prisma), §5 State 9 | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Support Tickets | `SupportTicket`, `Profile` | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 SupportService | `DESIGN / SUPPORTING` |
| Scenario Free-Writing (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless)* | `BF-14` Scenario Writing Flow | `ChatScenario`, transient GEC diffs | `SEQ-10` | Surface 2 & 4 (Proxy, 8.0s timeout, fallback) | `FROZEN (Stateless)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | `Cohort`, `CohortMember` (Extension Boundary) | `SEQ-09` | Boundary marker only, Surface 9 | `OPTIONAL BOUNDARY` |
