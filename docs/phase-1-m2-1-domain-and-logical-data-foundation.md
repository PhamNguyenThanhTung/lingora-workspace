# LINGORA — MILESTONE M2.1: DOMAIN & LOGICAL DATA FOUNDATION (REVISED)

> **Mã tài liệu:** `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`  
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Mốc thực thi:** Milestone M2.1 (Domain + Logical Data Foundation)  
> **Trạng thái:** `ACCEPTED FOR M2.2` (Đã vượt qua Independent Re-Review với kết luận D-G1 = PASS, D-G2 = PASS; sẵn sàng cho Milestone M2.2; không runtime/migration).
> **Căn cứ kế hoạch:** `docs/phase-1-system-design-plan.md` §7 (M2.1), §8, §9, §10  
> **Ranh giới nghiêm ngặt:** KHÔNG code, KHÔNG schema/migration/DB execution, KHÔNG API/UI implementation, KHÔNG thay đổi Product Policies D1–D9, KHÔNG sửa Requirements Baseline, KHÔNG bắt đầu M2.2+.

---

## 1. Milestone Overview & Management Contract

Mốc M2.1 thiết lập toàn bộ nền tảng mô hình miền logic và cấu trúc dữ liệu cho Lingora ở mức độc lập với triển khai (implementation-independent). 

### 1.1. Nguyên tắc Phân định Cốt lõi: WHAT vs HOW
Tài liệu tuân thủ tuyệt đối quy tắc không biến giải pháp kỹ thuật (HOW) thành yêu cầu nghiệp vụ (WHAT). Mọi thành phần trong mốc M2.1 được phân loại rạch ròi theo 6 cấp độ:
1. `ALREADY LOCKED BEHAVIOR`: Các quy tắc nghiệp vụ, sản phẩm và ràng buộc phân quyền đã đóng băng chính thức (D1–D9, Khung 6 Units English A1, Mapping A, Jump 95%/24h, Controlled Retry, Policy B, Unified Exercise). Bất biến, cấm mở lại.
2. `OPEN DESIGN REPRESENTATION`: Các phương án biểu diễn kỹ thuật (physical modeling) đang trong giai đoạn thiết kế, chưa đóng đinh duy nhất một phương án vật lý.
3. `TARGET DESIGN`: Cấu trúc mô hình mục tiêu trong thiết kế (ví dụ: `schema.prisma` mục tiêu).
4. `CURRENT APPLIED`: Cấu trúc dữ liệu thực tế đang chạy trên Supabase (migrations `202608140001_init`..`003`).
5. `FUTURE MIGRATION`: Kế hoạch chuyển đổi dữ liệu cần thực hiện trong tương lai để đưa Applied lên Target; không ngộ nhận Target là runtime-ready.
6. `IMPLEMENTATION DETAIL`: Chi tiết triển khai mã nguồn hoặc cấu hình runtime, dành cho Phase 2.

### 1.2. Hợp đồng Quản lý M2.1
| Trường Quản lý | Nội dung Đặc tả M2.1 |
|---|---|
| **Scope (Phạm vi)** | Hoàn thành 5 Artifacts cốt lõi: Domain Model (#1), Content Lifecycle State Model (#2), Learning Progression Model (#3), ERD 2-Trục (#4), Data Dictionary Đầy đủ (#5), kèm Bảng Alias Chuẩn hóa và Sổ bộ Ranh giới Mở rộng. Phân loại minh bạch các quyết định DD-01..DD-06, DD-10. |
| **Inputs (Đầu vào)** | `docs/02-requirements.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, `docs/07-data-dictionary.md`, `docs/08-english-a1-curriculum.md`, `docs/09-placement-and-jump-specification.md`, `docs/04-data-model.md`, `lingora-admin/prisma/schema.prisma`, migrations hiện tại, ADR-001..014, Policies D1–D9 & Approved Placement Mapping A. |
| **Outputs (Đầu ra)** | Tài liệu M2.1 sửa đổi toàn diện, 4 sơ đồ PlantUML chuẩn hóa trong `docs/plantuml/`, hồ sơ bằng chứng kiểm chứng Cổng D-G1 và D-G2. |
| **Dependencies** | Requirements Baseline ổn định; danh mục Invariants tại §2 của Kế hoạch Phase 1. |
| **Validation** | Cổng **D-G1** (Domain & Lifecycle Traceability) và Cổng **D-G2** (Data Model & Boundary Integrity). |
| **Exit Criteria** | Thỏa mãn toàn bộ 13 tiêu chí tại §10; dừng lại hoàn toàn, không thực thi M2.2+. |

---

## 2. Alias Table & Terminology Normalization (Workstream A)

> **Lưu ý Quản trị Namespace:** Để tránh xung đột với mã yêu cầu kỹ nghệ chuẩn tắc (`P1-FR-001..017`, `P1-NFR-001..004` trong `docs/02-requirements.md` và `docs/05-traceability-matrix.md`), bảng đối chiếu cục bộ của thiết kế M2.1 sử dụng tiền tố **`DESIGN-FR-*`** và **`DESIGN-NFR-*`** (`category: contract-gap`). Toàn bộ các bảng thực thể và ma trận truy vết hệ thống tiếp tục liên kết trực tiếp với các mã chuẩn tắc `P1-FR-*` / `P1-NFR-*`.

Bảng chuẩn hóa thuật ngữ đối chiếu các mã thiết kế cục bộ (`DESIGN-FR-*`, `DESIGN-NFR-*`) với các mã cũ (`FR-*`, `BR-*`), gắn nhãn ranh giới dữ liệu thực tế:

| Mã Thiết kế Cục bộ | Mã Cũ / Bí danh | Tên Nghiệp vụ Chuẩn hóa | Tác nhân / Quyền hạn | Phân loại Trạng thái Dữ liệu | Trạng thái Nghiệp vụ | Mã Yêu cầu Canonical tương đương |
|---|---|---|---|---|---|---|
| **DESIGN-FR-001** | FR-01, FR-AUTH | Đăng ký, Đăng nhập & Quản lý Phiên | Learner, All Roles | `CURRENT_APPLIED_DATABASE` (`profiles`) | Core MVP Active | `P1-FR-001` |
| **DESIGN-FR-002** | FR-02, FR-NAV | Điều hướng Cấu trúc Khóa học (Course→Unit→Lesson) | Learner | `TARGET_SCHEMA` (`units`, `courses`, `lessons`) | Core MVP Active (DD-01) | `P1-FR-002` |
| **DESIGN-FR-003** | FR-03, FR-LESSON | Học bài tương tác (Exercise Model hợp nhất) | Learner | `CURRENT_APPLIED_DATABASE` (`exercises`) | Core MVP Active (ADR-006) | `P1-FR-003` |
| **DESIGN-FR-004** | FR-04, FR-PROGRESS | Ghi nhận Tiến độ & Hoàn thành Bài học | Learner | `CURRENT_APPLIED_DATABASE` (`user_progress`) | Core MVP Active (D7) | `P1-FR-004` |
| **DESIGN-FR-005** | FR-05, FR-SRS | Lặp lại Ngắt quãng Từ vựng (SRS Policy B) | Learner | `CURRENT_APPLIED_DATABASE` (`user_vocab_srs`, `review_logs`) | Core MVP Active (D8) | `P1-FR-005, P1-FR-006` |
| **DESIGN-FR-006** | FR-06, FR-STREAK | Duy trì Chuỗi Ngày Học (Streak Daily Goal) | Learner | `CURRENT_APPLIED_DATABASE` (`profiles.streak_count`) | Core MVP Active (D9 deferred) | `P1-FR-011, P1-FR-014` |
| **DESIGN-FR-007** | FR-07, FR-GEC | Luyện viết & Kiểm tra Ngữ pháp (GEC Supporting) | Learner | `CURRENT_APPLIED_DATABASE` (`chat_scenarios`) | Core MVP Supporting (ADR-014) | `P1-FR-007` |
| **DESIGN-FR-008** | FR-08, FR-CONTENT-PLAN | Lập kế hoạch Khóa học & Đơn vị bài học | Organizational Manager | `TARGET_SCHEMA` (`courses`, `units`, `lessons`) | Core MVP Active (D1) | `P1-FR-008` |
| **DESIGN-FR-009** | FR-09, FR-AUTHOR | Biên soạn Nội dung Bài học được giao | Lesson Creator | `CURRENT_APPLIED_DATABASE` (`lessons`, `exercises`) | Core MVP Active (D1) | `P1-FR-008, P1-FR-009` |
| **DESIGN-FR-010** | FR-10, FR-MODERATE | Kiểm duyệt Chuyên môn & Phê duyệt Xuất bản | Moderator, Org Manager | `TARGET_SCHEMA` (`ContentStatus`, `audit_logs`) | Core MVP Active (D2/D3) | `P1-FR-008` |
| **DESIGN-FR-011** | FR-11, FR-USER-MGMT | Quản lý Người dùng & Phân vai Hệ thống | Administrator | `TARGET_SCHEMA` (Role 6-enum, `profiles`) | Core MVP Active (DD-10) | `P1-FR-008, P1-NFR-001` |
| **DESIGN-FR-012** | FR-12, FR-SYS-AUDIT | Kiểm toán Hệ thống & Nhật ký Vết thao tác | Administrator | `TARGET_SCHEMA` (`audit_logs`) | Core MVP Active (DD-03) | `P1-FR-008, P1-NFR-001` |
| **DESIGN-FR-013** | FR-13, FR-AUDIO | Quản lý Âm thanh Luyện nghe Từ vựng | Creator, Learner | `CURRENT_APPLIED_DATABASE` (`vocabularies.audio_url`) | Core MVP Active (DD-11) | `P1-FR-002, P1-FR-009, P1-FR-013` |
| **DESIGN-FR-014** | FR-14, FR-REVISION | Nhân bản Cập nhật Bài đã Xuất bản (Clone-to-Draft) | Creator, Org Manager | `TARGET_SCHEMA` (`lessons.supersedes_id` candidate) | Core MVP Active (D3, DD-02) | `P1-FR-008` |
| **DESIGN-FR-015** | FR-15, FR-COHORT | Quản lý Lớp học / Nhóm Tổ chức B2B | Organizational Manager | `FUTURE_MIGRATION` (`cohorts`, `cohort_members`) | **EXTENSION BOUNDARY ONLY** | `MVP-17 (Optional B2B)` |
| **DESIGN-FR-016** | FR-16, FR-PLACEMENT | Kiểm tra Đầu vào & Nhảy bài Có điều kiện | Learner | `TARGET_SCHEMA` candidate (`profiles.placement_history`) | Core MVP Active (D5, D6, DD-06) | `P1-FR-016` |
| **DESIGN-NFR-001**| NFR-01, NFR-SEC | An toàn Thông tin & Phân quyền RLS Đa tầng | All Roles | `CURRENT_APPLIED_DATABASE` (Supabase RLS) | Core MVP Active (DD-10) | `P1-NFR-001` |
| **DESIGN-NFR-002**| NFR-02, NFR-PERF | Hiệu năng Hệ thống & Timeout AI 8s [PROPOSED TARGET] | All Roles | Architecture Boundary (Web BFF) | Core MVP Active (ADR-014) | `P1-NFR-002` |
| **DESIGN-NFR-003**| NFR-03, NFR-AVAIL | Độ Sẵn sàng & Khả năng Chịu lỗi Fallback | Learner | Architecture Boundary (Web BFF) | Core MVP Active (ADR-014) | `P1-NFR-002` |
| **DESIGN-NFR-004**| NFR-04, NFR-ENV | Cách ly Môi trường & Bảo mật Khóa Bí mật | Infrastructure | Infrastructure Boundary (Vercel, Supabase) | Core MVP Active | `P1-NFR-001` |
| **DESIGN-NFR-005**| NFR-05, NFR-UX | Trải nghiệm Người dùng Đa ngôn ngữ (vi/en) | Learner | `CURRENT_APPLIED_DATABASE` (i18n catalogs) | Core MVP Active | `P1-FR-010, P1-NFR-004` |

---

## 3. Core vs Extension Boundary Register (Mô hình 2 Trục)

Toàn bộ các thực thể được phân loại dứt khoát theo hai chiều độc lập: **Trục 1: Phạm vi Nghiệp vụ (Scope)** và **Trục 2: Trạng thái Triển khai (Implementation Status)**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TRỤC 1: PHẠM VI NGHIỆP VỤ (SCOPE)                                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CORE MVP SCOPE (Bắt buộc cho MVP v1):                                               │
│    - Course, CourseTranslation, Unit (Target), UnitTranslation (Target)                │
│    - Lesson, LessonTranslation, Exercise (Unified Payload), Vocabulary, LessonVocab    │
│    - Profile (6 roles target), UserProgress, UserVocabSrs, ReviewLog, AuditLog (Target)│
│    - Language, ChatScenario (Context GEC), ChatScenarioTranslation                     │
│                                                                                        │
│ 2. EXTENSION BOUNDARY (Tùy chọn B2B / Vận hành — NẰM NGOÀI CORE MVP):                 │
│    - Cohort, CohortMember (UC-15 Quản lý nhóm B2B / Org Manager)                       │
│    - SupportTicket (UC-14 Help Desk hỗ trợ người dùng / Operations Staff)               │
│    * Quy ước: Luôn vẽ nét đứt (dashed); không chặn nghiệm thu Core MVP.                 │
│                                                                                        │
│ 3. EXCLUDED CONCEPTS (Tuyệt đối Cấm đưa vào Thiết kế hoặc Dữ liệu):                   │
│    - Exam Entity / QuestionBank Entity (BẤT BIẾN D4 CẤM)                               │
│    - Badge Entity, Streak Recovery (D9 hoãn), Channel Notification bên ngoài           │
│    - DOCX Import, LaTeX Processor, Giám sát thi cử (Proctoring)                        │
│    - Chứng chỉ CEFR quốc tế, Mô hình ML DKT/HLR, MultiWOZ, Ứng dụng Android           │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TRỤC 2: TRẠNG THÁI TRIỂN KHAI (IMPLEMENTATION STATUS)                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ A. CURRENT_APPLIED_DATABASE: Đang hoạt động trên Supabase (migrations 001..003).       │
│    (languages, profiles [2 roles], courses [boolean], course_translations,             │
│     lessons [boolean, no unit], lesson_translations, exercises [MCQ/FILL/REORDER],      │
│     vocabularies, lesson_vocabularies, user_progress, user_vocab_srs, review_logs,      │
│     chat_scenarios, chat_scenario_translations, chat_sessions [dep], chat_messages [dep])│
│                                                                                        │
│ B. TARGET_SCHEMA: Đã thiết kế trong lingora-admin/prisma/schema.prisma nhưng CHƯA CÓ   │
│    trong Applied DB (cần migration để đưa vào runtime).                                │
│    (units, unit_translations, audit_logs, Profile 6-role enum, ContentStatus 6-enum)  │
│                                                                                        │
│ C. FUTURE_MIGRATION: Các thực thể/thuộc tính tương lai chưa có cả trong target schema  │
│    lẫn applied database (cohorts, cohort_members, support_tickets).                    │
│    * Lưu ý: EXTENSION_BOUNDARY KHÔNG thay thế FUTURE_MIGRATION.                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Artifact 1: Domain Model (Mô hình Miền Nghiệp vụ Cốt lõi)

### 4.1. Khái niệm & Ranh giới Ngữ cảnh Nghiệp vụ
1. **Course (Khóa học — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Đơn vị chương trình học tập cao nhất cho một ngôn ngữ và trình độ (`English A1`). Chứa danh sách tuần tự các Unit.
2. **Unit (Đơn vị Bài học — Scope: CORE | Status: TARGET_SCHEMA):** Khối kiến thức chủ đề (English A1 có 6 Units: Greetings, Daily Life, Food & Shopping, Directions & Travel, Routines & Past, Plans & Future). Unit là ranh giới phân loại kết quả Placement Test (Mapping A) và ranh giới bài thi Jump Assessment. *Cảnh báo: Chưa có trong Applied DB, cần Future Migration (DD-01).*
3. **Lesson (Bài học — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Đơn vị học tập thực hành (mỗi Unit gồm 4 Lessons; tổng 24 Lessons). Lesson chứa mục tiêu bài học, phân công biên soạn (`creatorId`, `assignmentBrief` [Target Candidate]), trạng thái vòng đời nội dung, từ vựng và bài tập.
4. **Exercise (Bài tập Hợp nhất — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Thực thể bài tập đa năng duy nhất (D4). Không tồn tại `Exam` hay `QuestionBank`.
   - **Phân loại Trạng thái Exercise Types theo từng Giá trị Enum:**
     - `CURRENT_APPLIED_DATABASE`: Chỉ hỗ trợ 3 kiểu enum: `MCQ`, `FILL_BLANK`, `REORDER` (đã có trong migration `202608140001_init`).
     - `TARGET_SCHEMA / FUTURE_MIGRATION`: Hai kiểu `LISTENING` và `GRAMMAR` (phê duyệt trong ADR-006) định nghĩa ở `schema.prisma`, chưa có trong enum DB hiện tại, cần migration mở rộng enum Postgres trong tương lai.
     - `PROPOSED / DESIGN GAP (C-05)`: Dạng bài tập Đọc hiểu `READING` (Passage + Questions payload). Chưa triển khai trong runtime bài học MVP nhưng kiến trúc logic và động cơ đánh giá (Assessment Engine) dành sẵn slot biểu diễn dữ liệu.
     - **Không có enum bài tập ghép cặp riêng:** Baseline chỉ phê duyệt các kiểu Applied và hai Target additions được liệt kê bên dưới; mọi nhãn ghép cặp ngoài baseline đã bị loại bỏ.
5. **Language & Vocabulary (Ngôn ngữ & Từ vựng — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Danh mục từ vựng chuẩn hóa theo ngôn ngữ, liên kết bài học qua `LessonVocabulary`.
6. **UserProgress (Tiến độ — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Theo dõi trạng thái học tập (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), điểm số và số lần retry.
7. **UserVocabSrs & ReviewLog (Ôn tập Ngắt quãng — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Thẻ ghi nhớ từ vựng cá nhân hóa theo thuật toán Policy B `[1, 3, 7, 14, 30]` (xác định, không ML, không AI sở hữu tiến độ; lưu DB qua bảng SRS và RPC `record_review`).
8. **Profile (Hồ sơ Người dùng — Scope: CORE | Status: CURRENT_APPLIED_DATABASE):** Mở rộng từ `auth.users`, lưu trữ vai trò (Applied: 2 roles, Target: 6 roles), streak count, Starting Unit (Target Candidate DD-06).
9. **AuditLog (Kiểm toán — Scope: CORE | Status: TARGET_SCHEMA):** Ghi vết bất biến các hành vi nhạy cảm (actor, action, target, timestamp). *Cảnh báo: Bảng chưa có trong Applied DB, cần Future Migration (DD-03).*
10. **Cohort, CohortMember, SupportTicket (Scope: EXTENSION | Status: FUTURE_MIGRATION):** Các module mở rộng tổ chức và hỗ trợ, không thuộc Core MVP.
11. **Learning Assessment, Remediation & Mastery Subsystem (Phân hệ Đánh giá, Bổ khuyết & Độ thuần thục — Scope: CORE | Status: TARGET_SCHEMA / LOGICAL_MODEL):**
Bộ thực thể logic phục vụ mô hình sư phạm chuyên gia (Expert-informed Learning Design):
- `LearnerProfile`: Quản lý mục tiêu học tập, ngôn ngữ đích, phân tách rõ `selfReportedLevel` (chưa kiểm chứng, cờ `UNVERIFIED`) và `verifiedProficiency` (đã qua kiểm tra). Ràng buộc liên kết: chỉ áp dụng cho người dùng có vai trò `Role.LEARNER`.
- `SkillProfile`: Hồ sơ năng lực 4 chiều (Vocabulary, Grammar, Reading, Listening), xuất dạng Radar/Spider chart. Thuật toán Anchor Level mang trạng thái `PENDING VALIDATION`.
- `AssessmentResult`: Kết quả bài đánh giá gồm 3 dạng (`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`), ghi nhận điểm chi tiết từng chiều và dữ liệu phân nhánh (C-06).
- `Concept`: Thực thể định danh khái niệm học thuật chuẩn hóa (`code`, `domain`, `languageCode`), thay thế chuỗi tự do `conceptTag` (M-04).
- `ConceptMastery`: Trạng thái nắm vững từng khái niệm/kỹ năng cụ thể dựa trên chuỗi bằng chứng làm bài tập (`NOVICE`, `DEVELOPING`, `MASTERED`).
- `KnowledgeGap`: Lỗ hổng kiến thức được phát hiện từ các chuỗi lỗi lặp lại, có độ nghiêm trọng và trạng thái khắc phục (tự động đóng khi `ConceptMastery` đạt ngưỡng).
- `LearningProgress`: Tiến độ hoàn thành chương trình tuyến tính (Course/Unit/Lesson, `completedContentRatio`), tách biệt hoàn toàn với `ConceptMastery` và `Proficiency` (`LearningProgress ↔ UC-07 ↔ MVP-08`).
- `LevelReadiness`: Đánh giá mức độ sẵn sàng chuyển cấp (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`).
- `Recommendation`: Đề xuất lộ trình/bước học tiếp theo dựa trên 6 biến đầu vào.
- `RemedialModule`: Mô-đun bổ khuyết khái niệm/kỹ năng có đầy đủ trường quản trị nội dung (`creatorId`, `status`, `reviewerId`, `publishedAt`, `version`), không hạ cấp độ tổng thể, không bắt học lại bài cũ (M-03).

### 4.2. Sơ đồ Domain Model UML
Sơ đồ PlantUML lưu tại [`docs/plantuml/domain-model-core.puml`](plantuml/domain-model-core.puml).  
> **Ghi chú Kiểm tra PlantUML (PlantUML Validation):** Static syntax balance checked (`@startuml` / `@enduml`, quan hệ, định danh). Renderer không khả dụng trong môi trường hiện tại (`plantuml.jar` / Java không có sẵn).

```mermaid
classDiagram
  direction TB

  class Language {
    +String code (PK) [Applied]
    +String name [Applied]
    +Boolean isLearnable [Applied]
  }

  class Course {
    +UUID id (PK) [Applied]
    +String languageCode (FK) [Applied]
    +Cefr cefr [Applied]
    +Integer orderIndex [Applied]
    +Boolean isPublished [Applied]
    +ContentStatus status [Target]
    +UUID creatorId [Target]
    +UUID reviewerId [Target]
  }

  class Unit {
    +UUID id (PK) [Target Schema]
    +UUID courseId (FK) [Target Schema]
    +Integer orderIndex (1..6) [Target Schema]
  }

  class Lesson {
    +UUID id (PK) [Applied]
    +UUID courseId (FK) [Applied]
    +UUID unitId (FK) [Target Schema]
    +Integer orderIndex (1..24) [Applied]
    +Boolean isPublished [Applied]
    +ContentStatus status [Target]
    +UUID creatorId [Target]
    +UUID reviewerId [Target]
    +String assignmentBrief [Candidate DD-04]
    +UUID supersedesId [Candidate DD-02]
  }

  class Exercise {
    +UUID id (PK) [Applied]
    +UUID lessonId (FK) [Applied]
    +ExerciseType type [Applied: MCQ, FILL_BLANK, REORDER | Target: LISTENING, GRAMMAR]
    +JSONB payload [Applied]
    +Integer orderIndex [Applied]
  }

  class Profile {
    +UUID id (PK) [Applied]
    +String email [Applied]
    +Role role [Applied: 2 roles | Target: 6 roles]
    +Integer startingUnit [Candidate DD-06]
    +JSONB placementHistory [Candidate DD-06]
  }

  class UserProgress {
    +UUID id (PK) [Applied]
    +UUID userId (FK) [Applied]
    +UUID lessonId (FK) [Applied]
    +ProgressStatus status [Applied]
    +Integer score [Applied]
  }

  class AuditLog {
    +UUID id (PK) [Target Schema]
    +UUID actorId (FK) [Target Schema]
    +String action [Target Schema]
    +String entityType [Target Schema]
    +UUID entityId [Target Schema]
    +JSONB metadata [Target Schema]
  }

  class LearnerProfile {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +String targetLanguage [Logical/Target]
    +String learningGoal [Logical/Target]
    +String selfReportedLevel [Logical/Target]
    +String verifiedProficiency [Logical/Target]
  }

  class SkillProfile {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +String vocabularyLevel [Logical/Target]
    +String grammarLevel [Logical/Target]
    +String readingLevel [Logical/Target]
    +String listeningLevel [Logical/Target]
    +String anchorLevel [Pending Validation]
  }

  class AssessmentResult {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +AssessmentType assessmentType [Logical/Target]
    +JSONB dimensions [Logical/Target]
    +JSONB rawScores [Logical/Target]
    +JSONB stageData [Logical/Target]
    +JSONB languageConfig [Logical/Target]
    +DateTime completedAt [Logical/Target]
  }

  class LearningProgress {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +UUID courseId (FK) [Logical/Target]
    +UUID unitId (FK) [Logical/Target]
    +UUID lessonId (FK) [Logical/Target]
    +Float completedContentRatio [Logical/Target]
    +DateTime completedAt [Logical/Target]
  }

  class Concept {
    +UUID id (PK) [Logical/Target]
    +String code [Logical/Target]
    +String languageCode (FK) [Logical/Target]
    +String domain [Logical/Target]
    +String name [Logical/Target]
    +String description [Logical/Target]
    +UUID prerequisiteConceptId (FK) [Logical/Target]
    +Boolean isActive [Logical/Target]
  }

  class ConceptMastery {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +UUID conceptId (FK) [Logical/Target]
    +MasteryState masteryState [Logical/Target]
    +Integer evidenceCount [Logical/Target]
    +DateTime lastAssessedAt [Logical/Target]
  }

  class KnowledgeGap {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +UUID conceptId (FK) [Logical/Target]
    +GapSeverity gapSeverity [Logical/Target]
    +DateTime detectedAt [Logical/Target]
    +DateTime resolvedAt [Logical/Target]
  }

  class LevelReadiness {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +String currentLevel [Logical/Target]
    +String targetLevel [Logical/Target]
    +ReadinessStatus readinessStatus [Logical/Target]
    +JSONB evidenceSummary [Logical/Target]
    +DateTime evaluatedAt [Logical/Target]
  }

  class RemedialModule {
    +UUID id (PK) [Logical/Target]
    +UUID creatorId (FK) [Logical/Target]
    +UUID unitId (FK) [Logical/Target]
    +UUID conceptId (FK) [Logical/Target]
    +RemedialType remedialType [Logical/Target]
    +ContentStatus status [Logical/Target]
    +UUID reviewerId (FK) [Logical/Target]
    +JSONB contentPayload [Logical/Target]
    +DateTime publishedAt [Logical/Target]
    +Integer version [Logical/Target]
  }

  class Recommendation {
    +UUID id (PK) [Logical/Target]
    +UUID userId (FK) [Logical/Target]
    +RecommendationType recommendationType [Logical/Target]
    +UUID targetUnitId [Logical/Target]
    +UUID remedialModuleId [Logical/Target]
    +String rationale [Logical/Target]
  }

  Language "1" --> "0..*" Course
  Course "1" --> "1..*" Unit : contains [Target]
  Course "1" --> "1..*" Lesson : direct [Applied]
  Unit "1" --> "1..*" Lesson : contains [Target]
  Lesson "1" --> "1..*" Exercise : contains
  Profile "1" --> "0..*" UserProgress
  Lesson "1" --> "0..*" UserProgress
  Profile "1" --> "0..*" AuditLog : triggers [Target]
  Lesson "0..1" --> "0..1" Lesson : supersedes [Candidate DD-02]
  Profile "1" --> "0..1" LearnerProfile : role=LEARNER [Target]
  LearnerProfile "1" --> "0..1" SkillProfile [Target]
  LearnerProfile "1" --> "0..*" AssessmentResult [Target]
  LearnerProfile "1" --> "0..*" LearningProgress [Target]
  LearnerProfile "1" --> "0..*" ConceptMastery [Target]
  LearnerProfile "1" --> "0..*" KnowledgeGap [Target]
  LearnerProfile "1" --> "0..*" LevelReadiness [Target]
  LearnerProfile "1" --> "0..*" Recommendation [Target]
  Concept "1" --> "0..*" ConceptMastery [Target]
  Concept "1" --> "0..*" KnowledgeGap [Target]
  Concept "1" --> "0..*" RemedialModule [Target]
  Recommendation "0..*" --> "0..1" RemedialModule [Target]
```

### 4.3. Bảng Truy vết Mô hình Miền về Yêu cầu (Traceability Table)

| Thực thể Logic Domain | Scope (Trục 1) | Implementation Status (Trục 2) | Yêu cầu Canonical (P1-FR / MVP) | Use Case | Business Flow | Quyết định Khóa Chi phối |
|---|---|---|---|---|---|---|
| **Course** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-FR-008` | `UC-02, 08` | `BF-02, 05` | Baseline Curriculum 08 |
| **Unit** | `CORE` | `TARGET_SCHEMA` | `P1-FR-002, P1-FR-008` | `UC-02, 08` | `BF-02, 05` | Hierarchy Invariant, DD-01 |
| **Lesson** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-FR-003, P1-FR-008, P1-FR-009` | `UC-02, 04, 08, 09, 10` | `BF-02, 03, 05, 06, 07` | Policies D1, D2, D3, DD-02, DD-04 |
| **Exercise** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-003, P1-FR-012, P1-FR-013` | `UC-04, 05, 08` | `BF-03, 10` | Unified Model D4, ADR-006, DD-05 |
| **Vocabulary** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-FR-003, P1-FR-013` | `UC-04, 06` | `BF-03, 12` | Curriculum 08, DD-11 |
| **LessonVocabulary**| `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-FR-003, P1-FR-005` | `UC-04, 06` | `BF-03, 12` | Curriculum 08 |
| **Profile** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-001, P1-FR-011, P1-FR-014, P1-FR-016` | `UC-01, 02, 03, 11` | `BF-01, 08, 11` | Roles Baseline, Mapping A, DD-06 |
| **UserProgress** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-004` | `UC-04, 05` | `BF-04, 10` | Controlled Retry D7, DD-07 |
| **LearningProgress** | `CORE` | `TARGET_SCHEMA` | `P1-FR-004, MVP-08` | `UC-07` | `BF-04, 10` | Linear Progress Tracking, Progress != Proficiency (C-04) |
| **UserVocabSrs** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-005, P1-FR-006` | `UC-06` | `BF-12` | SRS Policy B D8, DD-08 |
| **ReviewLog** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-005, P1-FR-006` | `UC-06` | `BF-12` | SRS Policy B D8, DD-08 |
| **AuditLog** | `CORE` | `TARGET_SCHEMA` | `P1-FR-008, P1-NFR-001, MVP-19` | `UC-10, 13` | `BF-07, 13` | Governance Invariant, DD-03 |
| **Language** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-NFR-005, P1-FR-010` | `UC-02, 04` | `BF-02, 03` | Language taxonomy and locale boundary |
| **CourseTranslation** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-002, P1-NFR-005, P1-FR-010` | `UC-02, 04` | `BF-02, 03` | Course i18n representation |
| **UnitTranslation** | `CORE` | `TARGET_SCHEMA` | `P1-FR-002, P1-NFR-005, P1-FR-010` | `UC-02` | `BF-02` | Unit i18n representation |
| **LessonTranslation** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-008, P1-NFR-005, P1-FR-010` | `UC-04, 08` | `BF-03, 05` | Lesson i18n representation |
| **VocabularyTranslation** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-003, P1-NFR-005, P1-FR-010` | `UC-04, 06` | `BF-03, 12` | Vocabulary i18n representation |
| **ChatScenario** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-007` | Scenario Writing | Supporting GEC | Supporting GEC scenario context (ADR-014) |
| **ChatScenarioTranslation** | `CORE` | `CURRENT_APPLIED_DATABASE` | `P1-FR-007, P1-NFR-005, P1-FR-010` | Scenario Writing | Supporting GEC | Supporting scenario i18n context |
| **LearnerProfile** | `CORE` | `TARGET_SCHEMA` | `P1-FR-016, MVP-02, MVP-03` | `UC-02, UC-03` | Flexible Entry Flow | D4, E-EXP-01 (Self-Reported != Verified) |
| **SkillProfile** | `CORE` | `TARGET_SCHEMA` | `P1-FR-016, MVP-03, MVP-11` | `UC-03, UC-07` | Multidimensional Reporting | D1, E-EXP-03 (Spider/Radar Chart, Anchor pending) |
| **AssessmentResult** | `CORE` | `TARGET_SCHEMA` | `P1-FR-016, MVP-03` | `UC-03, UC-07` | Stage-Adaptive Diagnostic & Exit | D3, E-EXP-01, E-EXP-07 (Diagnostic vs Exit C-06) |
| **Concept** | `CORE` | `TARGET_SCHEMA` | `P1-FR-003, MVP-08` | `UC-05, UC-07` | Concept Taxonomy | Standardized Concept Model, M-04 |
| **ConceptMastery** | `CORE` | `TARGET_SCHEMA` | `P1-FR-003, MVP-08, MVP-11` | `UC-05, UC-07` | Mastery Tracking | E-EXP-03, E-EXP-07 (Mastery != Progress) |
| **KnowledgeGap** | `CORE` | `TARGET_SCHEMA` | `P1-FR-003, MVP-09` | `UC-05, UC-06` | Error Signal Detection | E-EXP-05 (Concept-based gap tracking) |
| **LevelReadiness** | `CORE` | `TARGET_SCHEMA` | `MVP-08, MVP-11, YC-EXT-03` | `UC-04, UC-07` | Path Transition Check | E-EXP-07 (Readiness evaluation: 3 states) |
| **RemedialModule** | `CORE` | `TARGET_SCHEMA` | `MVP-04, YC-EXT-03` | `UC-04` | Concept-level Remediation | E-EXP-06 (Governed micro-lesson, M-03) |
| **Recommendation** | `CORE` | `TARGET_SCHEMA` | `YC-EXT-03` | `UC-04` | Adaptive Recommendation | Scope Level 3 (6 inputs -> path) |
| **Cohort / Member**| `EXTENSION` | `FUTURE_MIGRATION` | `MVP-17` | `UC-15` | `BF-15` | Extension Boundary (Outside MVP / Org Manager) |
| **SupportTicket** | `EXTENSION` | `FUTURE_MIGRATION` | `MVP-16` | `UC-14` | `BF-14 (Ops)` | Extension Boundary (Outside MVP / Ops Staff) |

### 4.4. Ma trận Quan hệ & Cardinality (D2.12)

| Quan hệ | Owner | Cardinality | Optionality | Lifecycle dependency | Delete / Archive |
|---|---|---|---|---|---|
| `LearnerProfile → LearningProgress` | `LearnerProfile` | 1 → 0..* | Bắt buộc phía owner; progress optional | Progress sống theo learner; course/unit/lesson ref có thể null khi nội dung bị archive | Không xóa cứng; chỉ learner mang `Role.LEARNER` mới có rows |
| `LearnerProfile → SkillProfile` | `LearnerProfile` | 1 → 0..1 | Optional (null tới diagnostic đầu tiên) | Tạo/cập nhật bởi `AssessmentResult` (DIAGNOSTIC/EXIT/RE_EVALUATION) | Giữ snapshot cuối; không xóa khi có assessment mới |
| `LearnerProfile → AssessmentResult` | `LearnerProfile` | 1 → 0..* | Optional | Immutable log; không depend vòng đời nội dung | Bất biến, không xóa/sửa (P1-FR-016) |
| `LearnerProfile → ConceptMastery` | `LearnerProfile` | 1 → 0..* | Optional | Phụ thuộc `Concept.isActive`; giữ lịch sử khi concept ngừng active | Không xóa cứng |
| `LearnerProfile → KnowledgeGap` | `LearnerProfile` | 1 → 0..* | Optional | Mở khi chuỗi lỗi; đóng (`resolvedAt`) khi mastery đạt ngưỡng | Resolved giữ làm provenance; archive policy PENDING |
| `Concept → ConceptMastery` | `Concept` (registry) | 1 → 0..* | Mastery optional per learner | Concept `isActive=false` → ngừng dùng cho readiness mới | Registry không xóa; chỉ deactivate |
| `Concept → KnowledgeGap` | `Concept` (registry) | 1 → 0..* | Gap optional per learner | Như trên | Như trên |
| `Concept → RemedialModule` | `Concept` (registry) | 1 → 0..* | Module optional per concept | Module theo lifecycle nội dung 6 trạng thái (D1/D2/D3) | Archive theo content lifecycle, không xóa published history |
| `Lesson → Exercise` | `Lesson` | 1 → 1..* | Bắt buộc ≥1 exercise khi Published | Exercise sống theo lesson version (clone-to-draft tạo v2) | Bản published bất biến; sửa qua v2 |
| `Exercise → Concept` | `Concept` (registry) | * → 1 (mỗi exercise gắn đúng 1 `conceptId` chính) | Bắt buộc ở Target; Applied rows thiếu tag được backfill ở M-implementation | Tag theo concept version tại thời điểm biên soạn | Đổi tag = revision nội dung, qua review |

Không tồn tại duplicate ownership: `Profile` chung không trực tiếp sở hữu `LearningProgress`/`SkillProfile`/`AssessmentResult` (đi qua `LearnerProfile`).

### 4.5. Logical Invariants (D2.11)

1. `LearningProgress ≠ Proficiency` — hoàn thành nội dung không phải năng lực verified.
2. `Proficiency ≠ Mastery` — SkillProfile 4 chiều không suy ra mastery từng concept.
3. `Mastery ≠ LevelReadiness` — mastery là input, readiness là quyết định tổng hợp.
4. `Completed B1 ≠ B1 proficiency certification` — cần EXIT thẩm định.
5. `Completed B1 ≠ Automatic B2` — không tự nâng cấp độ.
6. `Weak skill ≠ whole-level downgrade` — chỉ remediation/scaffolding có mục tiêu.
7. `Remediation ≠ replay old lesson` — micro-lesson với vocab/context/exercise mới cho concept cũ.
8. `Jump ≠ learning completion` — `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump=true`), never `COMPLETED_BY_LEARNING`.
9. `Self-reported level ≠ verified proficiency` — self-report là `UNVERIFIED`.
10. `Diagnostic ≠ Exit Assessment` — entry xác định điểm vào; exit thẩm định chuyển cấp; cả hai đều sinh `AssessmentResult` bất biến.

---

## 5. Artifact 2: Content Lifecycle State Model (Máy Trạng thái Vòng đời Nội dung)

### 5.1. Quy trình Chuẩn mực D1/D2/D3
Quy trình vận hành nội dung tuân thủ đúng trật tự canonical:
$$\text{Manager lập kế hoạch} \longrightarrow \text{Manager phân công Creator} \longrightarrow \text{Creator biên soạn} \longrightarrow \text{Moderator kiểm duyệt (APPROVED)} \longrightarrow \text{Manager xuất bản (PUBLISHED)}$$

- **Phân định Quyền hạn Chuẩn xác:**
  - `Organizational Manager`: Thiết kế khung Course/Unit/Lesson, phân công Lesson Creator, và chịu trách nhiệm xuất bản thường nhật (`PUBLISHED`).
  - `Lesson Creator`: Biên soạn nội dung trong phạm vi bài học được giao. **Tuyệt đối KHÔNG được tạo/gửi bài ngoài phân công để bypass quy trình.**
  - `Moderator`: Kiểm duyệt độc lập chuyên môn (`CHANGES_REQUESTED` hoặc `APPROVED`). Không có quyền xuất bản.
  - `Administrator`: Giám sát tuân thủ toàn hệ thống qua `AuditLog`, quản lý phân quyền và bảo mật.
    - **Quy trình thường nhật (Normal Workflow):** Administrator **KHÔNG tham gia xuất bản thay Manager** và không bypass quy trình kiểm duyệt chuyên môn.
    - **Quyền hạn can thiệp khẩn cấp (Emergency Override — Khôi phục theo Baseline):** Administrator **CÓ THỂ xuất bản khẩn cấp (Emergency Publish) hoặc gỡ bỏ / lưu trữ khẩn cấp (Emergency Archive)** CHỈ trong các tình huống khẩn cấp được định nghĩa rõ ràng (ví dụ: phát hiện nội dung độc hại, vi phạm pháp luật nghiêm trọng, lỗi dữ liệu phá hỏng hệ thống, hoặc sự cố vận hành cấp bách).
    - **Ràng buộc khẩn cấp nghiêm ngặt:**
      1. Đây KHÔNG PHẢI là quyền xuất bản thường nhật của Administrator.
      2. KHÔNG được dùng để bypass quy trình review trong hoạt động bình thường.
      3. Mọi hành động Emergency Publish / Archive bắt buộc phải có lý do giải trình cụ thể (`reason / justification`).
      4. Mọi hành động Emergency Publish / Archive bắt buộc phải kích hoạt sự kiện `AuditLog` lưu vết bất biến.
      5. Creator vẫn tuyệt đối không được tự duyệt (no self-approval).
      6. Creator vẫn tuyệt đối không được xuất bản.
      7. Moderator vẫn tuyệt đối không được xuất bản.
      8. Creator không được bypass phân công kế hoạch của Manager.
      9. Published content không được chỉnh sửa in-place (bắt buộc dùng Clone-to-Draft D3).

### 5.2. Ma trận Chuyển trạng thái Toàn diện (State Transition Matrix)

| Trạng thái Hiện tại | Tác nhân (Actor) | Hành động (Action) | Trạng thái Đích | Điều kiện Tiên quyết (Pre-conditions) | Kích hoạt Sự kiện Audit? |
|---|---|---|---|---|---|
| *(Khởi tạo)* | Org Manager | `PLAN_AND_ASSIGN` | `DRAFT` | Course/Unit skeleton tồn tại; chỉ định `creatorId` & `assignmentBrief`. | CÓ (`action: ASSIGN`) |
| `DRAFT` | Lesson Creator | `SAVE_DRAFT` | `DRAFT` | `auth.uid = creatorId`; Creator được phân công bài này. | Không |
| `DRAFT` | Lesson Creator | `SUBMIT_FOR_REVIEW` | `IN_REVIEW` | `auth.uid = creatorId`; bài học thỏa mãn số lượng bài tập yêu cầu. | CÓ (`action: SUBMIT`) |
| `IN_REVIEW` | Moderator | `REQUEST_CHANGES` | `CHANGES_REQUESTED` | `auth.uid != creatorId` (cấm tự duyệt); gửi kèm feedback text. | CÓ (`action: REJECT`) |
| `CHANGES_REQUESTED`| Lesson Creator | `RE_SUBMIT` | `IN_REVIEW` | `auth.uid = creatorId`; đã cập nhật sửa đổi. | CÓ (`action: RESUBMIT`) |
| `IN_REVIEW` | Moderator | `APPROVE_CONTENT` | `APPROVED` | `auth.uid != creatorId`; đạt chuẩn sư phạm và ngôn ngữ. | CÓ (`action: APPROVE`) |
| `APPROVED` | Org Manager | `PUBLISH_CONTENT` | `PUBLISHED` | Role = `ORGANIZATIONAL_MANAGER` duy nhất trong vận hành thường nhật. | CÓ (`action: PUBLISH`) |
| `APPROVED` | Administrator | `EMERGENCY_PUBLISH` | `PUBLISHED` | Quyền can thiệp khẩn cấp (Emergency Override): Chỉ thực thi trong tình huống khẩn cấp xác định; bắt buộc có lý do giải trình (`justification`). Không áp dụng cho vận hành thường nhật. | CÓ (`action: EMERGENCY_PUBLISH`) |
| `PUBLISHED` | Org Manager | `ARCHIVE_CONTENT` | `ARCHIVED` | Role = `ORGANIZATIONAL_MANAGER` trong vận hành thường nhật. | CÓ (`action: ARCHIVE`) |
| `PUBLISHED` | Administrator | `EMERGENCY_ARCHIVE` | `ARCHIVED` | Quyền can thiệp khẩn cấp (Emergency Override): Gỡ bỏ khẩn cấp nội dung vi phạm/lỗi; bắt buộc có lý do giải trình (`justification`). | CÓ (`action: EMERGENCY_ARCHIVE`) |
| `PUBLISHED` | Manager / Creator| `CLONE_TO_DRAFT` (D3)| `DRAFT` (bản mới) | Khởi tạo bài học v2 mới theo phân công; v1 vẫn giữ `PUBLISHED`. | CÓ (`action: CLONE_DRAFT`)|

> **Ghi chú về Luồng ARCHIVED (Archive Boundary Note):**  
> Baseline nghiệp vụ KHÔNG phê duyệt chuyển trạng thái `ARCHIVED -> DRAFT` trong Core Lifecycle. Do đó, trạng thái `ARCHIVED` là điểm kết thúc trong Core Lifecycle. Mọi khả năng khôi phục (restore) trong tương lai chỉ được xem xét dưới dạng `[FUTURE / OPEN DESIGN]`, tuyệt đối không thuộc Core Lifecycle và không được dùng làm bằng chứng nghiệm thu PASS.

### 5.3. Ma trận Quy tắc Cấm Tuyệt đối (Forbidden Transitions Matrix)

| Thao tác Bị cấm | Tác nhân Cố gắng Thực hiện | Trạng thái Bắt đầu → Đích | Căn cứ Bắt buộc |
|---|---|---|---|
| **CẤM Tự Phê duyệt** | Lesson Creator | `IN_REVIEW` → `APPROVED` | BẤT BIẾN D2: Creator tuyệt đối không tự duyệt bài của mình. |
| **CẤM Creator Xuất bản** | Lesson Creator | `*` → `PUBLISHED` | BẤT BIẾN D2: Creator không có thẩm quyền phát hành ra production. |
| **CẤM Moderator Xuất bản**| Moderator | `APPROVED` → `PUBLISHED` | BẤT BIẾN D2: Moderator chỉ duyệt chuyên môn, không chịu trách nhiệm xuất bản. |
| **CẤM Manager Bypass Duyệt**| Org Manager | `DRAFT` → `PUBLISHED` | BẤT BIẾN D1: Manager không được bypass bước kiểm duyệt chuyên môn. |
| **CẤM Administrator Xuất bản Thường nhật**| Administrator | `*` → `PUBLISHED` (thường nhật) | BẤT BIẾN D1/D2: Administrator không tham gia xuất bản thường nhật (chỉ được phép Emergency Override khi có sự cố khẩn cấp xác định, có lý do cụ thể và bắt buộc ghi AuditLog). |
| **CẤM Sửa In-place Bài Published**| Mọi Tác nhân | `UPDATE` trực tiếp Lesson `PUBLISHED` | BẤT BIẾN D3: Không sửa in-place bài đã phát hành; bắt buộc dùng Clone-to-Draft. |
| **CẤM Tự tạo Bài ngoài Kế hoạch**| Lesson Creator | `*` → `DRAFT` (tự ý tạo mới) | BẤT BIẾN D1: Creator không được tự ý tạo bài nằm ngoài kế hoạch của Manager. |
| **CẤM Phục hồi Core từ ARCHIVED**| Mọi Tác nhân | `ARCHIVED` → `DRAFT` (Core) | Baseline không khóa quy tắc restore; ARCHIVED là điểm kết thúc trong Core Lifecycle; mọi restore thuộc `[FUTURE / OPEN DESIGN]`. |

> **Lưu ý Ranh giới Thực thi (Enforcement Boundary Note):**  
> Các quy tắc cấm trong ma trận trên là **Bất biến Nghiệp vụ & Thiết kế (Business & Design Invariants)** của hệ thống mục tiêu, đồng thời là **Yêu cầu Ràng buộc Phân quyền (Enforcement Requirements)** bắt buộc phải được hiện thực hóa ở cả tầng kiểm soát logic ứng dụng và chính sách phân quyền cơ sở dữ liệu (RLS / triggers) tại các milestone triển khai sau (M2.4 / Implementation).  
> **M2.1 tuyệt đối không tuyên bố** rằng cơ sở dữ liệu đang chạy thực tế hiện tại (`CURRENT_APPLIED_DATABASE`, vốn chỉ hỗ trợ 2 vai trò `LEARNER` và `ADMIN`) đã tự động khóa cứng hoặc bảo vệ các quy tắc 6 vai trò này tại tầng DB khi chưa có migration và chính sách RLS mở rộng tương ứng.

### 5.4. Trạng thái Quyết định Thiết kế DD-02 (Revision Representation)
- **LOCKED BEHAVIOR (D3):** Bài đã xuất bản không được chỉnh sửa trực tiếp. Thay đổi nội dung phải đi qua: Published v1 $\rightarrow$ Clone/Draft v2 $\rightarrow$ Moderator review $\rightarrow$ Manager publish v2. Lịch sử published là bất biến.
- **OPEN DESIGN REPRESENTATION (Chưa chốt phương án vật lý duy nhất):**
  - *Candidate 1 (Khuyến nghị sơ bộ):* Khóa ngoại tự tham chiếu `supersedes_id UUID NULL` trên bảng `lessons`.
  - *Candidate 2:* Bảng lịch sử phiên bản riêng biệt `lesson_revisions`.
  - *Candidate 3:* Quản lý phiên bản thông qua trường `version_number` và cờ `is_superseded`.
  - **Kết luận DD-02:** Trạng thái là `OPEN DESIGN REPRESENTATION`. Các trường vật lý (`supersedes_id`...) thuộc `TARGET DESIGN CANDIDATE / FUTURE MIGRATION`, không được coi là đã "resolved" dứt khoát ở cấp vật lý.

### 5.5. Trạng thái Quyết định Thiết kế DD-04 (Assignment Representation)
- **LOCKED BEHAVIOR (D1):** Manager lập kế hoạch và phân công; Creator biên soạn bài được giao; cấm Creator tạo bài bypass.
- **OPEN DESIGN REPRESENTATION:**
  - *Candidate:* Thuộc tính trực tiếp trên Lesson (`creatorId` + `assignmentBrief TEXT/JSONB`), không tạo thực thể `Assignment` độc lập (tuân thủ nguyên tắc tối giản thực thể).

### 5.6. Trạng thái Quyết định Thiết kế DD-03 (AuditLog)
- **LOCKED BEHAVIOR:** Bắt buộc kiểm toán các hành vi nhạy cảm; dữ liệu ngữ nghĩa gồm: `actor`, `action`, `target`, `timestamp`; ngữ nghĩa bất biến/chỉ thêm (append-only).
- **OPEN DESIGN & IMPLEMENTATION STATUS:**
  - Mô hình `AuditLog`: `TARGET_SCHEMA` (đã có trong `schema.prisma`).
  - Bảng vật lý `audit_logs`: `CURRENT_APPLIED = ABSENT` (chưa có trong database Supabase hiện tại).
  - Yêu cầu di chuyển: `FUTURE_MIGRATION = REQUIRED`.
  - Tuyệt đối không dùng cụm từ "kích hoạt AuditLog" theo nghĩa cơ sở dữ liệu đã hoạt động ngay lúc này.

---

## 6. Artifact 3: Learning Progression Model (Tiến trình Học tập & Đánh giá)

### 6.1. Tiến trình Tuyến tính English A1
Tiến trình học tập cốt lõi là tuyến tính tuần tự: $\text{Unit 1} \rightarrow \text{Unit 2} \rightarrow \text{Unit 3} \rightarrow \text{Unit 4} \rightarrow \text{Unit 5} \rightarrow \text{Unit 6}$. Mỗi Unit gồm đúng 4 Lessons (U$k$-L1 đến U$k$-L4; bài L4 đóng vai trò Review Gate của Unit).

### 6.2. Kiểm tra Đầu vào (Placement Test — D6 + Mapping A)
- **Hành vi Đã khóa (Locked Behavior D6):**
  - Bài kiểm tra năng lực ~30 câu hỏi trải đều theo 6 khối Unit (B1..B6: 6, 6, 5, 5, 5, 3 câu).
  - Có tính năng Bỏ qua (`Skip`) $\rightarrow$ Gán thẳng `Starting Unit = Unit 1`, không lưu điểm số.
  - Có tính năng Làm lại (`Retake`) từ trang Profile.
  - Đầu ra duy nhất: `Starting Unit` (Unit 1..6).
  - **Tuyệt đối KHÔNG cấp chứng chỉ CEFR và không tuyên bố tương đương chuẩn quốc tế.**
  - **Bỏ bước xác nhận bắt buộc:** Baseline D6 không yêu cầu bước "học viên phải xác nhận mới cập nhật lộ trình". Nếu giao diện cần hộp thoại xác nhận, đó là `[FUTURE UX OPTION / OPEN DESIGN]`, không phải quy tắc nghiệp vụ bắt buộc.
- **Bảng Điểm Chuẩn Hóa Approved Placement Mapping A (BẤT BIẾN):**
  - `0 – 7` điểm $\rightarrow$ **Starting Unit = Unit 1**
  - `8 – 12` điểm $\rightarrow$ **Starting Unit = Unit 2**
  - `13 – 17` điểm $\rightarrow$ **Starting Unit = Unit 3**
  - `18 – 22` điểm $\rightarrow$ **Starting Unit = Unit 4**
  - `23 – 26` điểm $\rightarrow$ **Starting Unit = Unit 5**
  - `27 – 30` điểm $\rightarrow$ **Starting Unit = Unit 6**

### 6.3. Nhảy bài Có điều kiện (Conditional Jump — D5)
- **Quy mô Bài kiểm tra:**
  - Nhảy 1 Unit (vào Unit $k$): 20 câu hỏi kiểm tra Unit $k-1$.
  - Nhảy 2–3 Units: 25–30 câu hỏi tích lũy các Unit bị bỏ qua.
  - Nhảy >3 Units: 40 câu hỏi chẩn đoán toàn diện (Comprehensive Diagnostic). Không cấm người học Jump >3 Units.
- **Ngưỡng đạt:** Điểm số $\ge 95\%$ (Product Policy D5).
- **Xử lý trượt:** Điểm số $< 95\%$ $\rightarrow$ Áp dụng **Cooldown 24 giờ** trước khi được phép thi lại bài Jump.

### 6.4. Thuật toán Làm lại Có kiểm soát (Controlled Retry — D7 + DD-07)
- **Thuật toán Chuẩn (Không hard-code số lượng câu hỏi):**
  - Gọi $N$ là tổng số câu hỏi thực tế trong bài học / phiên làm bài ($N \ge 1$).
  - Hạn ngạch câu hỏi được phép làm lại:
    $$\text{allowance} = \max\left(1, \left\lfloor N \times 0.10 \right\rfloor\right)$$
  *(Quy ước bài học English A1 có 5 câu hỏi/bài là dữ liệu đầu vào thiết kế chương trình, không phải bất biến thuật toán D7).*
- **Hệ số Cứu điểm:** Làm lại đúng nhận **70% số điểm** của câu đó (credit = 0.70).
- **Quy tắc Hoàn thành Bài học (Completion Rule):**
  - Hoàn thành bài học gắn với việc: **Xử lý đầy đủ toàn bộ câu hỏi lượt đầu (first-pass) và toàn bộ các câu làm sai bắt buộc trong phạm vi hạn ngạch Controlled Retry.**
  - **Hoàn thành $\ne$ Ngưỡng điểm đạt (Completion $\ne$ Score Threshold).** Tuyệt đối không áp dụng điểm sàn 80% để xét hoàn thành.
  - Không định nghĩa hoàn thành là "làm hết toàn bộ hạn ngạch allowance" (nếu bài chỉ sai ít hơn allowance thì chỉ cần xử lý hết số câu sai thực tế).
- **Xác minh DD-07 từ `CURRENT_APPLIED_DATABASE`:**
  - *Bằng chứng Migration:* Bảng `user_progress` đã tồn tại trong Applied DB (`lingora-admin/prisma/migrations/202608140001_init/migration.sql`, dòng 147–158) với các trường: `id UUID PK`, `user_id UUID FK`, `lesson_id UUID FK`, `status ProgressStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), `score INT` (CHECK $0 \le score \le 100$), `completed_at TIMESTAMP`, `updated_at TIMESTAMP`, và ràng buộc `UNIQUE(user_id, lesson_id)`.
  - *Chính sách RLS:* Migration `202608140002_auth_rls_storage_record_review` kích hoạt RLS và thiết lập policy `user_progress_own_read`.
  - *Phân định Ranh giới Vật lý vs Ứng dụng:* Bảng `user_progress` lưu trữ trạng thái hoàn thành tổng hợp (`status`, `score`, `completed_at`). Thuật toán tính hạn ngạch Controlled Retry và credit 70% được tính toán tại tầng ứng dụng / logic nghiệp vụ; phiên làm bài làm lại tạm thời (transient retry session) không có bảng riêng trong Applied DB (`OPEN DESIGN REPRESENTATION`).
  - *Phân loại DD-07:* `LOCKED BEHAVIOR` + `CURRENT_APPLIED_DATABASE (Progress Aggregate)` + `OPEN DESIGN (Session State Representation)`.

### 6.5. Trạng thái Quyết định Thiết kế DD-05 (Unified Exercise & Assessment Mode)
- **LOCKED BEHAVIOR (D4):** BẤT BIẾN: Assessment là chế độ ngữ cảnh (conceptual mode/context) của `Exercise`. Tuyệt đối KHÔNG tạo thực thể `Exam`, `QuestionBank` hay assessment aggregate độc lập trong MVP.
- **OPEN DESIGN REPRESENTATION:**
  - *Candidate 1 (ADR-006 / D4 proposal):* Sử dụng cờ ngữ cảnh `isAssessmentMode = true` trong JSONB payload của Exercise.
  - *Candidate 2:* Sử dụng cờ hoặc phân loại cấp độ bài học (ví dụ: `lesson_type`).
  - **Kết luận DD-05:** Thuộc tính `lesson_type` CHƯA CÓ trong `schema.prisma` và chỉ là một ứng viên thiết kế (Candidate), KHÔNG PHẢI thiết kế đã chốt. Cả `isAssessmentMode` lẫn `lesson_type` đều chỉ là các phương án biểu diễn mở (`OPEN DESIGN REPRESENTATION`), không phải physical design đã chọn.

### 6.6. Trạng thái Quyết định Thiết kế DD-06 (Placement Persistence)
- **LOCKED BEHAVIOR (D6):** Kết quả trả về Starting Unit; hỗ trợ Retake; học viên không được tự sửa kết quả; có khả năng truy vết và kiểm toán; không cấp chứng chỉ CEFR; không có bước xác nhận bắt buộc trước khi áp dụng kết quả.
- **OPEN DESIGN & IMPLEMENTATION STATUS:**
  - Đề xuất kỹ thuật: Bổ sung trường `starting_unit INT` và `placement_history JSONB` trên `Profile`.
  - Phân loại: Đây là **`TARGET DESIGN CANDIDATE`**, thuộc **`FUTURE MIGRATION`**, KHÔNG PHẢI `CURRENT APPLIED`.
  - Quyết định DD-06 tiếp tục được quản lý dưới dạng `OPEN DESIGN REPRESENTATION` và sẽ được giải quyết dứt khoát trước khi bàn giao triển khai (implementation handoff).

### 6.7. Trạng thái Quyết định Thiết kế DD-08 (Personalized SRS Policy B)
- **LOCKED BEHAVIOR (D8):** Chu kỳ lặp lại ngắt quãng xác định theo Policy B: $[1, 3, 7, 14, 30]$ ngày; thuật toán xác định (deterministic algorithm); AI không sở hữu tiến độ học tập (ADR-005).
- **Xác minh DD-08 từ `CURRENT_APPLIED_DATABASE`:**
  - *Bằng chứng Migration:* Bảng `user_vocab_srs` và `review_logs` đã tồn tại trong Applied DB (`lingora-admin/prisma/migrations/202608140001_init/migration.sql`, dòng 161–192):
    - `user_vocab_srs`: `id UUID PK`, `user_id UUID FK`, `vocabulary_id UUID FK`, `ease_factor FLOAT`, `interval_days FLOAT`, `recall_probability FLOAT`, `next_review_at TIMESTAMP`, `last_reviewed_at TIMESTAMP`, `review_count INT`, `lapse_count INT`, `created_at TIMESTAMP`, `UNIQUE(user_id, vocabulary_id)`.
    - `review_logs`: `id UUID PK`, `srs_card_id UUID FK`, `is_correct BOOLEAN`, `interval_days FLOAT`, `reviewed_at TIMESTAMP`.
  - *Bằng chứng Stored Function / RPC:* Migration `202608140002_auth_rls_storage_record_review` định nghĩa hàm `public.record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`. Hàm này ghi log vào `review_logs`, cập nhật `user_vocab_srs.interval_days = p_recommended_interval_days`, tính `next_review_at = clock_timestamp() + (p_recommended_interval_days * INTERVAL '1 day')`, và cập nhật streak của user.
  - *Phân định Ranh giới Vật lý vs Ứng dụng:* Bảng dữ liệu và RPC atomic update hoàn toàn tồn tại trong `CURRENT_APPLIED_DATABASE`. Chuỗi khoảng thời gian Policy B $[1, 3, 7, 14, 30]$ ngày được tầng logic ứng dụng / client service tính toán xác định và truyền qua đối số `p_recommended_interval_days`, không hardcode vào constraint DB.
  - *Phân loại DD-08:* `LOCKED BEHAVIOR` + `CURRENT_APPLIED_DATABASE (SRS Tables & RPC)` + `APPLICATION LAYER (Deterministic Schedule Calculation)`.

### 6.8. Tách biệt 4 Khái niệm Sư phạm Cốt lõi & Luồng Khởi đầu Linh hoạt (Expert-informed)
Dựa trên nghiên cứu chuyên gia ngôn ngữ (`E-EXP-01`..`E-EXP-07`), Lingora phân định dứt khoát 4 khái niệm sư phạm độc lập:
1. **Tiến độ Học tập (`Learning Progress`):** Tỷ lệ % hoàn thành nội dung bài học/Unit/Khóa học tuyến tính (lưu tại `user_progress.status = COMPLETED`). Tiến độ chỉ phản ánh việc người học đã đi qua bài học, không phản ánh năng lực thực tế.
2. **Trình độ Năng lực (`Proficiency`):** Năng lực ngôn ngữ chuẩn hóa theo khung tham chiếu (CEFR A1–B2 cho tiếng Anh, HSK versioned cho tiếng Trung), ghi nhận qua bài đánh giá chẩn đoán thích ứng (`verifiedProficiency`).
3. **Mức độ Thuần thục (`Mastery`):** Độ thành thạo trên từng khái niệm/kỹ năng cụ thể (`ConceptMastery`), được tích lũy từ chuỗi bài tập và ôn tập SRS, độc lập với tiến độ hoàn thành bài.
4. **Mức độ Sẵn sàng Lên cấp (`Level Readiness`):** Đánh giá tổng hợp xem học viên có đủ điều kiện và sẵn sàng chuyển cấp/lên Unit tiếp theo hay chưa (dựa trên Progress + Mastery + Skill Profile + Knowledge Gaps còn đọng).

- **Luồng khởi đầu linh hoạt (Decision D4):** Người học được quyền chọn:
  - (A) Làm bài đánh giá chẩn đoán thích ứng $\rightarrow$ ghi nhận `verifiedProficiency`.
  - (B) Chọn cấp độ tự khai báo (`Initial Self-Reported Level`) hoặc Bỏ qua (Skip) $\rightarrow$ ghi nhận `selfReportedLevel` (trạng thái `UNVERIFIED`).
  - Hệ thống nghiêm cấm đồng nhất tự khai báo với năng lực đã kiểm chứng (`E-EXP-01`).

### 6.9. Hệ thống Đánh giá Chẩn đoán Thích ứng (Stage-Adaptive Diagnostic Assessment) & Common Assessment Engine
- **Kiến trúc Thích ứng 2 Giai đoạn:**
  - **Giai đoạn 1 (Routing Stage):** Nhóm câu hỏi định tuyến ban đầu với độ khó trung bình nhằm ước lượng sơ bộ dải năng lực của học viên.
  - **Giai đoạn 2 (Targeted Stage):** Phân nhánh học viên vào nhóm câu hỏi chuyên sâu theo độ khó phù hợp để đo đạc chính xác 4 chiều năng lực cốt lõi.
- **Bốn Chiều Năng lực Cốt lõi:**
  - **Từ vựng (Vocabulary)**, **Ngữ pháp (Grammar)**, **Đọc hiểu (Reading)**, **Nghe hiểu (Listening)**.
  - Kỹ năng Viết (Writing) và Nói (Speaking) được phân loại là tùy chọn tương lai.
  - Kết quả xuất ra: **Skill Profile đa chiều** (Spider/Radar Chart), hiển thị độc lập từng kỹ năng (`E-EXP-02`), không cào bằng thành 1 điểm số duy nhất. Thuật toán tính Anchor Level mang trạng thái `PENDING VALIDATION`.
- **Cấu hình Đa Ngôn ngữ (Common Assessment Engine):** Dùng chung engine thích ứng, tham số hóa qua file cấu hình ngôn ngữ (`Language-Specific Config`) theo chuỗi kiến trúc 4 tầng:
  $$\text{Common Assessment Engine} \longrightarrow \text{Language Config} \longrightarrow \text{Item Bank} \longrightarrow \text{Rubric}$$
  - *Tầng 1 (Engine):* Điều phối phiên thi, định tuyến 2 giai đoạn, xuất spider/radar chart đa chiều. Bất biến theo ngôn ngữ.
  - *Tầng 2 (Language Config):* Tham số hóa cấu hình cho từng ngôn ngữ:
    - **Tiếng Anh:** Khung tham chiếu CEFR A1–B2 cho MVP; config có room cho `contextual vocabulary`, `collocation`, `word family`, `connected speech` (`E-EXP-07`).
    - **Tiếng Trung:** Khung tham chiếu HSK có hỗ trợ versioning (HSK 2.0 / HSK 3.0). Phần đọc hiểu tiếng Trung mặc định ẩn hoàn toàn pinyin (`hidePinyin: true`) để đo chính xác năng lực nhận diện chữ Hán (`E-EXP-04`).
  - *Tầng 3 (Item Bank):* Ngân hàng câu hỏi/học liệu phân loại theo `Concept` và độ khó theo từng ngôn ngữ.
  - *Tầng 4 (Rubric):* Bộ quy tắc chấm điểm và phân loại lỗi sai riêng biệt (Tiếng Anh: trật tự từ, thì, hòa hợp chủ-vị, collocation, word family, connected speech; Tiếng Trung: nét/bộ thủ, thanh điệu, trật tự từ/lượng từ và hư từ, nghe hiểu).
  - *Lưu ý:* 4 tầng trên là cấu trúc kiến trúc logic & cấu hình hệ thống, không yêu cầu phân mảnh thành 4 bảng vật lý riêng biệt.
  - *Cấu trúc domain khái niệm (D2.7):* `Language` (bảng applied `languages`) → `LanguageConfig` / `AssessmentConfig` (các scope cấu hình JSON trong file `Language-Specific Config`, hiện thực runtime là `AssessmentResult.languageConfig`, không phải bảng riêng) → `ItemBank` (tập Exercise/Concept phân loại theo ngôn ngữ) → `Rubric` (quy tắc chấm trong config). Không rải nhánh `if language` khắp domain.
- **Trạng thái Thông số:** Số lượng câu hỏi (~25–30 câu), thời gian hoàn thành ($\le 15$ phút), ngưỡng thăng/giáng nhánh và công thức điểm mang trạng thái `PROPOSED / PENDING VALIDATION`.

### 6.10. Cơ chế Chuyển tiếp Lộ trình (3 Trạng thái) & Bổ khuyết Chuyên biệt (Concept-level Remediation)
- **Ba Trạng thái Chuyển cấp (Transition States):** Khi học viên kết thúc một Unit, hệ thống đánh giá chuyển tiếp với 3 trạng thái:
  - `ADVANCE`: Đạt cả tiến độ và độ thuần thục, tự động mở khóa Unit kế tiếp.
  - `ADVANCE_WITH_SUPPORT`: Mở khóa Unit kế tiếp kèm theo các gợi ý bài tập hỗ trợ nhẹ cho các kỹ năng còn yếu.
  - `REMEDIATE`: Kích hoạt mô-đun bổ khuyết khái niệm (`RemedialModule`) trước khi cho phép tiếp tục.
- **Nguyên tắc Remedial Learning (`E-EXP-06`):**
  - Giao micro-lesson bổ khuyết nhắm đúng `KnowledgeGap` với ngữ cảnh mới, từ vựng mới và bài tập mới.
  - **Tuyệt đối không hạ cấp độ tổng thể của người học (No demotion).**
  - **Tuyệt đối không bắt người học học lại toàn bộ bài học cũ đã hoàn thành (No repeating completed lessons).**

### 6.11. Thiết kế Logic cho Dạng bài Đọc hiểu (`READING` Representation & Payload Shape [C-05])
- **Ranh giới Thiết kế & Phân loại:**
  - Kỹ năng Đọc hiểu (Reading) là 1 trong 4 chiều năng lực cốt lõi bắt buộc của Động cơ Đánh giá Chẩn đoán Thích ứng (`E-EXP-01`..`07`).
  - Trong chương trình bài học thường nhật MVP v1 (English A1), dạng bài tập Reading được phân loại là **`PROPOSED / DESIGN GAP`** (chưa kích hoạt trong runtime bài học thường nhật nhưng cấu trúc dữ liệu logic được chuẩn hóa sẵn sàng).
  - Tuyệt đối không biến Reading thành từ đồng nghĩa của Trắc nghiệm đơn lẻ (MCQ). Mô hình Reading yêu cầu cấu trúc gồm đoạn văn bản đọc hiểu ngữ cảnh (*Reading Passage*) kết hợp chuỗi câu hỏi phân tích (*Questions Array*):
- **Cấu trúc Dữ liệu Logic của Payload Đọc hiểu (`Exercise.payload`):**
  - `passageText`: Văn bản đoạn đọc vi mô (micro-reading, 50–150 từ ở mức độ A1/A2).
  - `questions`: Mảng các câu hỏi đọc hiểu đi kèm (`questionId`, `prompt`, `options`, `correctAnswer`, `explanation`).
  - `conceptId`: Liên kết tới khái niệm học thuật (ví dụ: `reading-main-idea`, `reading-detail`, `reading-inference`).
  - `languageConfig`: Cấu hình chuyên biệt theo ngôn ngữ (với tiếng Trung: bắt buộc `hidePinyin: true` để đo khả năng nhận diện Hán tự không có nạng Pinyin).

### 6.12. Vòng đời Đánh giá Năng lực: Phân biệt Chẩn đoán vs Đánh giá Chuyển cấp / Cuối khóa (`EXIT / RE_EVALUATION` [C-06])
- **Phân định Rạch ròi 3 Dạng Đánh giá Sư phạm Canonical (`AssessmentType`):**
  1. `DIAGNOSTIC`: Đánh giá chẩn đoán đầu vào để xác định hồ sơ năng lực khởi đầu (`SkillProfile`) và gợi ý Unit bắt đầu (`Starting Unit`).
  2. `EXIT`: Đánh giá cuối Unit hoặc cuối Khóa học nhằm thẩm định năng lực thực tế trước khi xác nhận chuyển cấp.
  3. `RE_EVALUATION`: Đánh giá kiểm tra lại theo yêu cầu của học viên hoặc định kỳ để cập nhật lại `SkillProfile`.
- **Phân định Chế độ Thực thi / Phân lớp (`DeliveryMode`):**
  - `PLACEMENT`: Chế độ phân lớp đầu vào đề cương (onboarding instance, e.g. 30 câu đề cương English A1 theo Placement Mapping A).
  - `JUMP`: Chế độ kiểm tra nhảy cóc vượt cấp đơn vị học bài tập (`SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP`).
  - `STANDARD`: Chế độ thực hiện đánh giá tiêu chuẩn.
  - *Ghi chú nhất quán:* Biểu diễn gộp 5 giá trị enum phẳng trong các bản thảo trước mang trạng thái `[HISTORICAL / SUPERSEDED IN DRAFT]`; kiến trúc chuẩn tách rạch ròi mục đích đánh giá (`AssessmentType` - 3 giá trị) khỏi chế độ thực thi (`DeliveryMode`).
- **Vòng đời Đánh giá Chuẩn mực:**
  $$\text{Quá trình Học} \longrightarrow \text{Exit / Level Assessment} \longrightarrow \text{AssessmentResult} \longrightarrow \text{SkillProfile} \longrightarrow \text{LevelReadiness} \longrightarrow \text{Quyết định chuyển cấp}$$
- **Ràng buộc Bất biến Tuyệt đối (Consistency Guards):**
  - **`Learning Progress ≠ Proficiency`:** Việc hoàn thành 100% nội dung bài học cơ học chỉ thể hiện người học đã xem/làm qua bài, không chứng minh người học đã đạt trình độ năng lực tương ứng.
  - **`Completed B1 ≠ Automatically B1 Proficiency`:** Hoàn thành toàn bộ bài học cấp độ B1 tuyệt đối không tự động cấp chứng chỉ hoặc nâng trình độ B1/B2 nếu chưa vượt qua bài kiểm tra `EXIT` đánh giá năng lực độc lập.

### 6.13. Quản trị Nội dung Mô-đun Bổ khuyết (`RemedialModule` Content Governance [M-03])
- Mô-đun học bổ trợ `RemedialModule` là một dạng học liệu chuyên biệt, tuân thủ nghiêm ngặt **Quy trình Quản trị Nội dung 6 Trạng thái** (`Draft` $\rightarrow$ `In Review` $\rightarrow$ `Changes Requested` $\rightarrow$ `Approved` $\rightarrow$ `Published` $\rightarrow$ `Archived`), tuyệt đối không được bypass kiểm duyệt:
  - Trường `creatorId`: Soạn giả chịu trách nhiệm biên soạn nội dung.
  - Trường `unitId`: Gắn liền với Unit học tập tương ứng.
  - Trường `conceptId`: Khái niệm học thuật mà mô-đun nhắm tới để khắc phục.
  - Trường `status`: Trạng thái vòng đời (`ContentStatus`), chỉ nội dung `PUBLISHED` mới được động cơ đề xuất đưa vào lộ trình học.
  - Trường `reviewerId` & `publishedAt`: Ghi vết kiểm toán chuyên môn của Moderator và thời điểm xuất bản của Organizational Manager.

### 6.14. Chuẩn hóa Khái niệm Học thuật (`Concept` Model & Gap Resolution [M-04])
- Loại bỏ hoàn toàn việc sử dụng chuỗi văn bản tự do (`conceptTag: String`) làm khóa định danh duy nhất. Thay thế bằng thực thể **`Concept`**:
  - `id: UUID (PK)`, `code: VARCHAR(64) UNIQUE`, `languageCode: VARCHAR(8)`, `domain: VARCHAR(32)` (`VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING`), `name: TEXT`, `description: TEXT`.
- **Quan hệ Giải quyết Lỗ hổng Kiến thức (`KnowledgeGap` $\longleftrightarrow$ `ConceptMastery`):**
  - Một `KnowledgeGap` được hệ thống tự động ghi nhận khi học viên làm sai liên tiếp các bài tập gắn với một `conceptId`.
  - Lỗ hổng được chuyển trạng thái `RESOLVED` (`resolvedAt = now()`) khi và chỉ khi `ConceptMastery` của khái niệm đó đạt ngưỡng thuần thục quy định (`masteryState` chuyển sang `DEVELOPING` hoặc `MASTERED`). Ngưỡng điểm chi tiết ở trạng thái `CONFIGURABLE / PENDING VALIDATION`.

---

## 7. Artifact 4: ERD (2-Axis Logical Status Mapping)

### 7.1. Bảng Kiểm Kê & Phân loại Toàn bộ Thực thể (Core Scope Inventory & 2-Axis Mapping)
Bảng tổng hợp kiểm kê toàn diện và phân loại chính xác các thực thể dữ liệu theo hai trục độc lập (Scope vs Implementation Status), đối chiếu trực tiếp với bằng chứng Migration thực tế và các đề mục Data Dictionary tại §8:

| # | Table | Scope (Trục 1) | Implementation Status (Trục 2) | Current Applied DB | Target Schema | Future Migration | Dictionary Section | Ghi chú Ranh giới Kỹ thuật & Bằng chứng |
|---|---|---|---|---|---|---|---|---|
| 1 | `languages` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.1 | Chạy thực tế (Supabase baseline migration `202608140001_init`) |
| 2 | `courses` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXTENDED` | `REQUIRED` | §8.2 | Applied có `is_published`; Target thêm `status: ContentStatus`, `creator_id`, `reviewer_id` |
| 3 | `course_translations` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.3 | Chạy thực tế (Supabase baseline migration `202608140001_init`) |
| 4 | `units` | `CORE` | `TARGET_SCHEMA` | `ABSENT` | `DEFINED` | `REQUIRED` | §8.4 | Mô hình Target Schema; chưa có trong Applied DB, cần migration tạo bảng |
| 5 | `unit_translations` | `CORE` | `TARGET_SCHEMA` | `ABSENT` | `DEFINED` | `REQUIRED` | §8.5 | Mô hình Target Schema; chưa có trong Applied DB, cần migration tạo bảng |
| 6 | `lessons` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXTENDED` | `REQUIRED` | §8.6 | Applied trỏ thẳng `course_id`; Target chuyển trỏ `unit_id`, thêm `status`, `assignment_brief`, `supersedes_id` |
| 7 | `lesson_translations` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.7 | Chạy thực tế (Supabase baseline migration `202608140001_init`) |
| 8 | `exercises` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXTENDED` | `REQUIRED` | §8.8 | Applied hỗ trợ `MCQ`, `FILL_BLANK`, `REORDER`; Target mở rộng thêm `LISTENING`, `GRAMMAR` |
| 9 | `vocabularies` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.9 | Chạy thực tế (Supabase baseline migration `202608140001_init`) |
| 10 | `lesson_vocabulary` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.10 | Chạy thực tế (bảng `lesson_vocabulary`, alias logic `lesson_vocabularies`) |
| 11 | `vocabulary_translations` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.11 | Chạy thực tế (Supabase baseline migration `202608140001_init`) |
| 12 | `profiles` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXTENDED` | `REQUIRED` | §8.12 | Applied có 2 roles (`LEARNER`, `ADMIN`); Target mở rộng 6 roles enum + placement candidate |
| 13 | `user_progress` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.13 | Chạy thực tế (`202608140001_init`); tiến độ tổng hợp lưu DB, thuật toán D7 tính tại tầng ứng dụng |
| 14 | `user_vocab_srs` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.14 | Chạy thực tế (`202608140001_init`); cập nhật chu kỳ SRS qua RPC `record_review` (`202608140002`) |
| 15 | `review_logs` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.15 | Chạy thực tế (`202608140001_init`); ghi log qua RPC `record_review` (`202608140002`) |
| 16 | `audit_logs` | `CORE` | `TARGET_SCHEMA` | `ABSENT` | `DEFINED` | `REQUIRED` | §8.16 | Target Schema (`schema.prisma`); chưa có trong Applied DB, cần migration tạo bảng |
| 17 | `chat_scenarios` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.17 | Supporting capability phục vụ ngữ cảnh GEC AI; qualifier nằm ở ghi chú, không nằm trong Scope value |
| 18 | `chat_scenario_translations` | `CORE` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `ALIGNED` | `NONE` | §8.18 | Supporting capability phục vụ i18n GEC; qualifier nằm ở ghi chú, không nằm trong Scope value |
| 19 | `cohorts` | `EXTENSION` | `FUTURE_MIGRATION` | `ABSENT` | `ABSENT` | `FUTURE_MIGRATION` | Excluded | Tùy chọn B2B ngoài Core MVP (Boundary Register §3) |
| 20 | `cohort_members` | `EXTENSION` | `FUTURE_MIGRATION` | `ABSENT` | `ABSENT` | `FUTURE_MIGRATION` | Excluded | Tùy chọn B2B ngoài Core MVP (Boundary Register §3) |
| 21 | `support_tickets` | `EXTENSION` | `FUTURE_MIGRATION` | `ABSENT` | `ABSENT` | `FUTURE_MIGRATION` | Excluded | Tùy chọn HelpDesk ngoài Core MVP (Boundary Register §3) |
| 22 | `chat_sessions` | `EXCLUDED` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXCLUDED` | `NONE` | Excluded | Bảng legacy tồn tại thực tế trong Applied DB (`202608140001_init`), nằm ngoài phạm vi Core MVP; phân loại Scope là EXCLUDED, Implementation Status là CURRENT_APPLIED_DATABASE (bảo toàn backward-compatible) |
| 23 | `chat_messages` | `EXCLUDED` | `CURRENT_APPLIED_DATABASE` | `PRESENT` | `EXCLUDED` | `NONE` | Excluded | Bảng legacy tồn tại thực tế trong Applied DB (`202608140001_init`), nằm ngoài phạm vi Core MVP; phân loại Scope là EXCLUDED, Implementation Status là CURRENT_APPLIED_DATABASE (bảo toàn backward-compatible) |

> **Ghi chú Chuẩn hóa 2 Trục (Scope vs Implementation Status):**  
> - **Trục 1 (Scope):** Chỉ nhận đúng 3 giá trị chuẩn tắc: `CORE`, `EXTENSION`, `EXCLUDED`. Tuyệt đối không sử dụng giá trị lai ghép hay giá trị thứ tư. Các đối tượng legacy như `chat_sessions` và `chat_messages` nằm ngoài ranh giới Core MVP nên được phân loại chuẩn tắc là `EXCLUDED`.  
> - **Trục 2 (Implementation Status):** Nhận đúng 3 giá trị: `CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`. Hai bảng legacy trên hiện diện vật lý trong cơ sở dữ liệu Supabase đang chạy (`202608140001_init`) để bảo toàn tương thích ngược nên có trạng thái triển khai là `CURRENT_APPLIED_DATABASE`. Hai trục hoàn toàn độc lập và không gộp nhãn.

*Xác nhận Độ phủ Data Dictionary:* Đúng 18 bảng Core Scope được mô tả độc lập, chi tiết từng trường dữ liệu tại 18 đề mục §8.1 đến §8.18 (độ phủ 100% Core Scope, không có độ lệch giữa số bảng Core và số đề mục).

### 7.2. Sơ đồ ERD 2 Trục PlantUML
Sơ đồ nguồn lưu tại [`docs/plantuml/erd-logical-status-mapping.puml`](plantuml/erd-logical-status-mapping.puml).  
> **Ghi chú Kiểm tra PlantUML (PlantUML Validation):** Static syntax balance checked (`@startuml` / `@enduml`, liên kết bảng, phân định màu theo 2 trục). Renderer không khả dụng trong môi trường hiện tại.

---

## 8. Artifact 5: Data Dictionary Final (Từ điển Dữ liệu Mức Trường Đầy đủ)

Nhằm đảm bảo tính trung thực tuyệt đối, danh mục dưới đây bao phủ đầy đủ toàn bộ các thực thể thuộc phạm vi Core Scope với từng trường dữ liệu cụ thể:

### 8.1. Thực thể `Language` (Bảng `languages` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `code` | `VARCHAR(8)` | NO | PK | Admin | Static taxonomy | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `name` | `TEXT` | NO | - | Admin | Static taxonomy | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `native_name` | `TEXT` | NO | - | Admin | Static taxonomy | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `is_learnable` | `BOOLEAN` | NO | `false` | Admin | Active toggle | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `is_ui_locale` | `BOOLEAN` | NO | `false` | Admin | Active toggle | `CURRENT_APPLIED_DATABASE` | P1-NFR-005 |

### 8.2. Thực thể `Course` (Bảng `courses` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Org Manager | Created on init | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `language_code` | `VARCHAR(8)` | NO | FK | Org Manager | Static linkage | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `cefr` | `ENUM Cefr` | NO | `A1` | Org Manager | Internal taxonomy | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `order_index` | `INTEGER` | NO | - | Org Manager | Progression rank | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `is_published` | `BOOLEAN` | NO | `false` | Org Manager | Applied toggle | `CURRENT_APPLIED_DATABASE` | P1-FR-010 |
| `status` | `ENUM ContentStatus`| NO | `DRAFT` | Org Manager | Target 6-state | `TARGET_SCHEMA` | P1-FR-010 |
| `creator_id` | `UUID` | YES | NULL | Org Manager | Target audit | `TARGET_SCHEMA` | P1-FR-008 |
| `reviewer_id` | `UUID` | YES | NULL | Moderator | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `submitted_at` | `TIMESTAMPTZ` | YES | NULL | Creator | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `reviewed_at` | `TIMESTAMPTZ` | YES | NULL | Moderator | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `published_at` | `TIMESTAMPTZ` | YES | NULL | Org Manager | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | System | Mutable | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |

### 8.3. Thực thể `CourseTranslation` (Bảng `course_translations` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `course_id` | `UUID` | NO | PK, FK | Org Manager | Created with course | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `locale` | `VARCHAR(8)` | NO | PK, FK | Org Manager | i18n key (vi/en) | `CURRENT_APPLIED_DATABASE` | P1-NFR-005 |
| `title` | `TEXT` | NO | - | Org Manager | Content title | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `description` | `TEXT` | YES | NULL | Org Manager | Content summary | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |

### 8.4. Thực thể `Unit` (Bảng `units` — Scope: CORE | Status: TARGET_SCHEMA [Migration Required])
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Org Manager | Created in plan | `TARGET_SCHEMA` | P1-FR-008 |
| `course_id` | `UUID` | NO | FK | Org Manager | Parent linkage | `TARGET_SCHEMA` | P1-FR-008 |
| `order_index` | `INTEGER` | NO | - | Org Manager | Rank (1..6) | `TARGET_SCHEMA` | P1-FR-008 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `TARGET_SCHEMA` | P1-FR-008 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | System | Mutable | `TARGET_SCHEMA` | P1-FR-008 |

### 8.5. Thực thể `UnitTranslation` (Bảng `unit_translations` — Scope: CORE | Status: TARGET_SCHEMA [Migration Required])
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `unit_id` | `UUID` | NO | PK, FK | Org Manager | Created with unit | `TARGET_SCHEMA` | P1-FR-008 |
| `locale` | `VARCHAR(8)` | NO | PK, FK | Org Manager | i18n key | `TARGET_SCHEMA` | P1-NFR-005 |
| `title` | `TEXT` | NO | - | Org Manager | Unit title | `TARGET_SCHEMA` | P1-FR-008 |
| `description` | `TEXT` | YES | NULL | Org Manager | Unit summary | `TARGET_SCHEMA` | P1-FR-008 |

### 8.6. Thực thể `Lesson` (Bảng `lessons` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Org Manager / Creator | Created on assign | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `course_id` | `UUID` | NO | FK | Org Manager | Direct parent link | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `unit_id` | `UUID` | YES | NULL | Org Manager | Target parent link | `TARGET_SCHEMA` | P1-FR-002 |
| `order_index` | `INTEGER` | NO | - | Org Manager | Sequence rank (1..24)| `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `is_published` | `BOOLEAN` | NO | `false` | Org Manager | Applied toggle | `CURRENT_APPLIED_DATABASE` | P1-FR-010 |
| `status` | `ENUM ContentStatus`| NO | `DRAFT` | Moderator / Manager| Target 6-state | `TARGET_SCHEMA` | P1-FR-010 |
| `objective` | `TEXT` | YES | NULL | Creator | Learning goal | `TARGET_SCHEMA` | P1-FR-009 |
| `creator_id` | `UUID` | YES | NULL | Org Manager | Assignee link | `TARGET_SCHEMA` | P1-FR-008 |
| `reviewer_id` | `UUID` | YES | NULL | Moderator | Reviewer link | `TARGET_SCHEMA` | P1-FR-010 |
| `assignment_brief`| `TEXT / JSONB` | YES | NULL | Org Manager | Candidate brief | `TARGET DESIGN CANDIDATE (DD-04 / OPEN DESIGN)` | P1-FR-008 |
| `supersedes_id` | `UUID` | YES | NULL | System / Creator | Candidate clone link| `TARGET DESIGN CANDIDATE (DD-02 / OPEN DESIGN)` | P1-FR-014 |
| `submitted_at` | `TIMESTAMPTZ` | YES | NULL | Creator | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `reviewed_at` | `TIMESTAMPTZ` | YES | NULL | Moderator | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `published_at` | `TIMESTAMPTZ` | YES | NULL | Org Manager | Target audit | `TARGET_SCHEMA` | P1-FR-010 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | System | Mutable | `CURRENT_APPLIED_DATABASE` | P1-FR-008 |

### 8.7. Thực thể `LessonTranslation` (Bảng `lesson_translations` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `lesson_id` | `UUID` | NO | PK, FK | Creator | Created with lesson | `CURRENT_APPLIED_DATABASE` | P1-FR-009 |
| `locale` | `VARCHAR(8)` | NO | PK, FK | Creator | i18n key | `CURRENT_APPLIED_DATABASE` | P1-NFR-005 |
| `title` | `TEXT` | NO | - | Creator | Lesson title | `CURRENT_APPLIED_DATABASE` | P1-FR-009 |
| `description` | `TEXT` | YES | NULL | Creator | Lesson summary | `CURRENT_APPLIED_DATABASE` | P1-FR-009 |

### 8.8. Thực thể `Exercise` (Bảng `exercises` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Creator | Created in lesson | `CURRENT_APPLIED_DATABASE` | P1-FR-003 |
| `lesson_id` | `UUID` | NO | FK | Creator | Parent link | `CURRENT_APPLIED_DATABASE` | P1-FR-003 |
| `type` | `ENUM ExerciseType`| NO | - | Creator | Kiểu bài tập (Chi tiết giá trị xem bảng dưới) | `CURRENT_APPLIED_DATABASE` | P1-FR-003 |
| `payload` | `JSONB` | NO | - | Creator | ADR-006 payload | `CURRENT_APPLIED_DATABASE` | P1-FR-003 |
| `order_index` | `INTEGER` | NO | - | Creator | Sequence rank | `CURRENT_APPLIED_DATABASE` | P1-FR-003 |

*Chi tiết Trạng thái Triển khai từng Giá trị Enum `ExerciseType` (Field-Level Values Status):*
| Giá trị Enum (`ExerciseType`) | Trạng thái Triển khai (Implementation Status) | Bằng chứng Kỹ thuật & Ranh giới | Ghi chú Sư phạm / Nghiệp vụ |
|---|---|---|---|
| `MCQ` | `CURRENT_APPLIED_DATABASE` | Đã có trong DB (migration `202608140001_init`) | Trắc nghiệm khách quan (1 hoặc nhiều đáp án) |
| `FILL_BLANK` | `CURRENT_APPLIED_DATABASE` | Đã có trong DB (migration `202608140001_init`) | Điền từ vào chỗ trống trong câu |
| `REORDER` | `CURRENT_APPLIED_DATABASE` | Đã có trong DB (migration `202608140001_init`) | Sắp xếp lại trật tự các khối từ |
| `LISTENING` | `TARGET_SCHEMA / FUTURE_MIGRATION` | Khai báo trong `schema.prisma`; chưa có trong Postgres enum DB | Luyện nghe tương tác (cần migration bổ sung enum; P1-FR-013) |
| `GRAMMAR` | `TARGET_SCHEMA / FUTURE_MIGRATION` | Khai báo trong `schema.prisma`; chưa có trong Postgres enum DB | Luyện ngữ pháp chuyên sâu (cần migration bổ sung enum; P1-FR-012) |
| `READING` | `PROPOSED / DESIGN GAP (C-05)` | Định nghĩa trong mô hình dữ liệu logic & Assessment Engine; chưa có trong DB enum | Đọc hiểu văn bản vi mô kèm câu hỏi ngữ cảnh (C-05) |

### 8.9. Thực thể `Vocabulary` (Bảng `vocabularies` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Creator / Admin | Created on dictionary entry | `CURRENT_APPLIED_DATABASE` | P1-FR-002, P1-FR-003 |
| `language_code` | `VARCHAR(8)`| NO | FK | Creator / Admin | Static linkage | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `term` | `TEXT` | NO | - | Creator / Admin | Word/phrase term | `CURRENT_APPLIED_DATABASE` | P1-FR-002, P1-FR-003 |
| `normalized_term` | `TEXT` | NO | - | System | Canonical lookup term | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `phonetic` | `TEXT` | YES | NULL | Creator / Admin | Pronunciation notation | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `audio_url` | `TEXT` | YES | NULL | Creator / Admin | Storage URL/path to audio | `CURRENT_APPLIED_DATABASE` | P1-FR-002, P1-FR-009, P1-FR-013 |
| `cefr` | `ENUM Cefr` | YES | NULL | Admin | Internal level tag (Tiếng Anh; Tiếng Trung dùng lớp ánh xạ HSK) | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | System | Mutable | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |

### 8.10. Thực thể `LessonVocabulary` (Bảng `lesson_vocabulary` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `lesson_id` | `UUID` | NO | PK, FK | Creator | Created on associate | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `vocabulary_id` | `UUID` | NO | PK, FK | Creator | Created on associate | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `order_index` | `INTEGER` | NO | - | Creator | Presentation order | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |

### 8.11. Thực thể `VocabularyTranslation` (Bảng `vocabulary_translations` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `vocabulary_id`| `UUID` | NO | PK, FK | Creator | Created with term | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `locale` | `VARCHAR(8)` | NO | PK, FK | Creator | i18n key | `CURRENT_APPLIED_DATABASE` | P1-NFR-005, P1-FR-010 |
| `meaning` | `TEXT` | NO | - | Creator | Vietnamese meaning | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |
| `example` | `TEXT` | YES | NULL | Creator | Example sentence | `CURRENT_APPLIED_DATABASE` | P1-FR-002 |

### 8.12. Thực thể `Profile` (Bảng `profiles` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | PK (`auth.users`) | System Trigger | Linked to auth | `CURRENT_APPLIED_DATABASE` | P1-FR-001 |
| `email` | `TEXT` | NO | Unique | System / Learner | Account identity | `CURRENT_APPLIED_DATABASE` | P1-FR-001 |
| `display_name` | `TEXT` | YES | NULL | Learner | User profile | `CURRENT_APPLIED_DATABASE` | P1-FR-001 |
| `avatar_url` | `TEXT` | YES | NULL | Learner | Storage link | `CURRENT_APPLIED_DATABASE` | P1-FR-001 |
| `role` | `ENUM Role` | NO | `LEARNER` | Admin | Applied: 2 roles; Target: 6 roles | `CURRENT_APPLIED_DATABASE` | P1-FR-008, P1-NFR-001, MVP-14 |
| `assigned_roles` | `ENUM Role[]` | NO | `[LEARNER]` | Admin | Target multi-role | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-14 |
| `ui_locale` | `VARCHAR(8)` | NO | `vi` | System / Learner | UI locale | `CURRENT_APPLIED_DATABASE` | P1-FR-010, P1-NFR-004 |
| `native_lang_code` | `VARCHAR(8)` | NO | `vi` | System / Learner | Native language | `CURRENT_APPLIED_DATABASE` | P1-FR-010 |
| `daily_goal_min` | `INTEGER` | NO | `15` | Learner | Daily target | `CURRENT_APPLIED_DATABASE` | P1-FR-014, MVP-10 |
| `streak_count` | `INTEGER` | NO | `0` | System (`record_review`)| Daily counter | `CURRENT_APPLIED_DATABASE` | P1-FR-011, MVP-10 |
| `timezone` | `TEXT` | NO | `Asia/Ho_Chi_Minh` | Learner / System | Local-timezone streak basis | `CURRENT_APPLIED_DATABASE` | P1-FR-011 |
| `last_qualifying_activity_date` | `DATE` | YES | NULL | System (`record_review`) | Last qualifying local date | `CURRENT_APPLIED_DATABASE` | P1-FR-011 |
| `starting_unit` | `INTEGER` | NO | `1` | System (Placement) | Target Candidate DD-06| `TARGET DESIGN CANDIDATE (DD-06 / OPEN DESIGN)` | P1-FR-016 |
| `placement_history`| `JSONB` | NO | `'[]'` | System (Placement) | Target Candidate DD-06| `TARGET DESIGN CANDIDATE (DD-06 / OPEN DESIGN)` | P1-FR-016 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-001 |

### 8.13. Thực thể `UserProgress` (Bảng `user_progress` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | System (`record_review`)| Created on start | `CURRENT_APPLIED_DATABASE` | P1-FR-004, MVP-08 |
| `user_id` | `UUID` | NO | FK | System | Learner link | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
| `lesson_id` | `UUID` | NO | FK | System | Lesson link | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
| `status` | `ENUM ProgressStatus`| NO | `NOT_STARTED`| System | Progress state | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
| `score` | `INTEGER` | YES | NULL | System | Weighted score, nullable until scored | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
| `completed_at` | `TIMESTAMPTZ` | YES | NULL | System | Completion timestamp | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | System | Mutable | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |

### 8.14. Thực thể `UserVocabSrs` (Bảng `user_vocab_srs` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | System (`record_review`)| Created on first encounter | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006, MVP-09 |
| `user_id` | `UUID` | NO | FK | System | Learner owner link | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006 |
| `vocabulary_id`| `UUID` | NO | FK | System | Vocabulary item link | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `ease_factor` | `FLOAT` | NO | `2.5` | System (Deterministic D8)| Multiplier factor | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `interval_days`| `FLOAT` | NO | `1.0` | System (Policy B D8) | Review interval | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `recall_probability`| `FLOAT`| YES| NULL | System (`record_review`)| Algorithmic probability | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `next_review_at`| `TIMESTAMPTZ`| NO | `now()` | System (`record_review`)| Scheduled review timestamp| `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `last_reviewed_at`| `TIMESTAMPTZ`| YES| NULL | System (`record_review`)| Last review timestamp | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `review_count` | `INTEGER` | NO | `0` | System (`record_review`)| Total reviews completed | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `lapse_count` | `INTEGER` | NO | `0` | System (`record_review`)| Total recall failures | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-005 |

### 8.15. Thực thể `ReviewLog` (Bảng `review_logs` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | System (`record_review`)| Immutable log entry | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006, MVP-09 |
| `srs_card_id` | `UUID` | NO | FK | System (`record_review`)| Linked SRS card PK | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006 |
| `is_correct` | `BOOLEAN` | NO | - | System (`record_review`)| Binary review result | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006 |
| `interval_days`| `FLOAT` | NO | - | System (`record_review`)| Prior interval before update| `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006 |
| `reviewed_at` | `TIMESTAMPTZ` | NO | `now()` | System (`record_review`)| Review timestamp | `CURRENT_APPLIED_DATABASE` | P1-FR-005, P1-FR-006 |

### 8.16. Thực thể `AuditLog` (Bảng `audit_logs` — Scope: CORE | Status: TARGET_SCHEMA [Migration Required])
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | System | Immutable entry | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `actor_id` | `UUID` | NO | FK | System (Trích xuất từ JWT) | Immutable entry | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `action` | `TEXT` | NO | - | System | Event name | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `entity_type` | `TEXT` | NO | - | System | Target table | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `entity_id` | `UUID` | NO | - | System | Target PK | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `metadata` | `JSONB` | YES | NULL | System | Context data | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable timestamp | `TARGET_SCHEMA` | P1-FR-008, P1-NFR-001, MVP-19 |

### 8.17. Thực thể Ngữ cảnh Bổ trợ: `ChatScenario` (Bảng `chat_scenarios` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid()` | Admin | Scenario definition | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `code` | `TEXT` | NO | Unique | Admin | Unique scenario code | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `is_published` | `BOOLEAN` | NO | `false` | Admin | Scenario publication flag | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `system_prompt`| `TEXT` | NO | - | Admin | System prompt template | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | System | Immutable | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |

### 8.18. Thực thể Ngữ cảnh Bổ trợ: `ChatScenarioTranslation` (Bảng `chat_scenario_translations` — Scope: CORE | Status: CURRENT_APPLIED_DATABASE)
| Tên Trường | Kiểu Dữ liệu | Nullable? | Mặc định | Quyền Ghi (Owner) | Vòng đời | Trạng thái Triển khai | Truy vết |
|---|---|---|---|---|---|---|---|
| `scenario_id` | `UUID` | NO | PK, FK | Admin | Created with scenario | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `ui_locale` | `VARCHAR(8)`| NO | PK, FK | Admin | i18n key | `CURRENT_APPLIED_DATABASE` | P1-NFR-005 |
| `title` | `TEXT` | NO | - | Admin | Scenario title | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |
| `description` | `TEXT` | YES | NULL | Admin | Scenario summary | `CURRENT_APPLIED_DATABASE` | P1-FR-007 |

---

### 8.19. Đặc tả Cấu trúc JSONB Payloads (5 Dạng Bài tập ADR-006)

Mọi payload bài tập trong thực thể `Exercise` đều phải chứa thuộc tính bắt buộc `payloadVersion: 1`:

#### 1. Dạng Trắc nghiệm (Multiple Choice Question — `MCQ` [Status: CURRENT_APPLIED])
```json
{
  "payloadVersion": 1,
  "instruction": "Chọn đáp án đúng để hoàn thành câu chào:",
  "prompt": "Hello, my name ___ Nam.",
  "options": [
    {"id": "opt_1", "text": "is", "isCorrect": true},
    {"id": "opt_2", "text": "am", "isCorrect": false},
    {"id": "opt_3", "text": "are", "isCorrect": false}
  ],
  "explanation": "Chủ ngữ ngôi thứ ba số ít 'my name' đi với động từ to-be 'is'."
}
```

#### 2. Dạng Điền từ vào chỗ trống (Fill in the Blank — `FILL_BLANK` [Status: CURRENT_APPLIED])
```json
{
  "payloadVersion": 1,
  "instruction": "Điền từ thích hợp vào chỗ trống:",
  "sentenceTemplate": "I live ___ Hanoi.",
  "blankIndex": 1,
  "acceptedAnswers": ["in"],
  "caseSensitive": false,
  "hint": "Giới từ chỉ nơi chốn đứng trước tên thành phố."
}
```

#### 3. Dạng Sắp xếp từ thành câu (Sentence Reordering — `REORDER` [Status: CURRENT_APPLIED])
```json
{
  "payloadVersion": 1,
  "instruction": "Sắp xếp các từ thành câu hoàn chỉnh:",
  "tokens": [
    {"id": "t1", "text": "Where"},
    {"id": "t2", "text": "are"},
    {"id": "t3", "text": "you"},
    {"id": "t4", "text": "from?"}
  ],
  "correctSequence": ["t1", "t2", "t3", "t4"]
}
```

#### 4. Dạng Luyện nghe Từ vựng (Word-Level Audio Comprehension — `LISTENING` [Status: TARGET_SCHEMA / FUTURE_MIGRATION])
```json
{
  "payloadVersion": 1,
  "instruction": "Nghe phát âm và chọn từ đúng:",
  "vocabularyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "transcript": "twelve",
  "options": [
    {"id": "opt_1", "text": "twelve", "isCorrect": true},
    {"id": "opt_2", "text": "twenty", "isCorrect": false}
  ]
}
```
*Ghi chú Ranh giới (M-07):* Payload tham chiếu trực tiếp qua `vocabularyId` chuẩn hóa, không sử dụng đường dẫn file tĩnh (`audioPath`) tự do nhằm loại bỏ filesystem coupling và tuân thủ Storage RLS policy.

#### 5. Dạng Luyện Ngữ pháp Chuyên sâu (Grammar Rule Practice — `GRAMMAR` [Status: TARGET_SCHEMA / FUTURE_MIGRATION])
```json
{
  "payloadVersion": 1,
  "instruction": "Chọn dạng đúng của động từ để hoàn thành câu:",
  "prompt": "She _____ (go) to school by bus every morning.",
  "options": [
    {"id": "opt_1", "text": "goes", "isCorrect": true},
    {"id": "opt_2", "text": "go", "isCorrect": false},
    {"id": "opt_3", "text": "going", "isCorrect": false}
  ],
  "ruleExplanation": "Với chủ ngữ ngôi thứ ba số ít (She) ở thì Hiện tại Đơn, động từ kết thúc bằng 'o' thêm 'es'."
}
```
*Ghi chú Ranh giới (M-06):* Bài tập `GRAMMAR` là dạng bài tập cố định trong bài học (`P1-FR-012`). Dịch vụ kiểm tra ngữ pháp tự luận GEC (`P1-FR-007`) là tính năng bổ trợ không trạng thái (stateless/transient), không ghép chung các trường transient (`contextScenarioCode`, `gecEnabled`) vào cấu trúc bài tập cố định.

#### 6. Dạng Đọc hiểu Ngữ cảnh (Contextual Reading Comprehension — `READING` [Status: PROPOSED / DESIGN GAP])
```json
{
  "payloadVersion": 1,
  "instruction": "Đọc đoạn văn ngắn và trả lời câu hỏi bên dưới:",
  "passageText": "Minh is a software engineer living in Hanoi. Every morning, he wakes up at 6:30 AM, drinks a cup of black coffee, and walks to his office near West Lake.",
  "questions": [
    {
      "id": "q1",
      "prompt": "Where does Minh live?",
      "options": [
        {"id": "opt_1", "text": "Hanoi", "isCorrect": true},
        {"id": "opt_2", "text": "Da Nang", "isCorrect": false},
        {"id": "opt_3", "text": "Ho Chi Minh City", "isCorrect": false}
      ],
      "explanation": "Đoạn văn nêu rõ: 'Minh is a software engineer living in Hanoi.'"
    }
  ],
  "conceptCode": "EN-READ-DETAIL-LOC"
}
```
*Ghi chú Sư phạm (C-05):* Đọc hiểu là 1 trong 4 chiều đánh giá bắt buộc. Cấu trúc lưu trữ cho phép quản trị đoạn văn bản kèm chuỗi câu hỏi phân tích, hỗ trợ cấu hình ẩn Pinyin (`hidePinyin: true`) cho tiếng Trung.

### 8.20. Đặc tả Thực thể Logic Phân hệ Đánh giá & Bổ khuyết (Learning Assessment & Remediation Logical Entities [Status: TARGET_SCHEMA / LOGICAL_MODEL])

> **Ghi chú phân loại ranh giới:**
> Toàn bộ 10 thực thể logic dưới đây thuộc phạm vi **`CORE SCOPE (Target Design & Logical Progression)`**, phục vụ trực tiếp cho mô hình sư phạm chuyên gia (`E-EXP-01`..`E-EXP-07`).
> Trạng thái kỹ thuật: **`TARGET_SCHEMA / LOGICAL_MODEL`** (chưa có trong migrations Supabase hiện tại; sẽ được thiết kế chi tiết và sinh migration ở các mốc tiếp theo).

#### 1. Thực thể `LearnerProfile` (Hồ sơ Năng lực Người học)
- **Mục đích:** Quản lý thông tin học tập, mục tiêu, ngôn ngữ đích và lịch sử năng lực.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id, UNIQUE)`
  - `targetLanguage: VARCHAR(10)` (ví dụ: `en`, `zh`)
  - `learningGoal: VARCHAR(100)` (ví dụ: giao tiếp công sở, du lịch, học tập)
  - `selfReportedLevel: VARCHAR(20)` (cấp độ tự khai báo: A0, A1, A2, B1, B2)
  - `verifiedProficiency: VARCHAR(20) [Nullable]` (cấp độ đã kiểm chứng qua bài đánh giá chẩn đoán)
  - `createdAt: TIMESTAMP`, `updatedAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:**
  - Tuyệt đối không đồng nhất `selfReportedLevel` với `verifiedProficiency`. Khi người học chưa làm bài chẩn đoán, `verifiedProficiency` nhận giá trị `NULL` hoặc `UNVERIFIED`.
  - Ràng buộc vai trò: Chỉ người dùng có vai trò `Role.LEARNER` mới được khởi tạo bản ghi `LearnerProfile`.

#### 2. Thực thể `SkillProfile` (Hồ sơ Kỹ năng Đa chiều)
- **Mục đích:** Lưu trữ năng lực chi tiết trên 4 chiều độc lập của người học.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id, UNIQUE)`
  - `vocabularyLevel: VARCHAR(20)` (ví dụ: `A2.2` [Internal Lingora Sub-level])
  - `grammarLevel: VARCHAR(20)` (ví dụ: `A1.3` [Internal Lingora Sub-level])
  - `readingLevel: VARCHAR(20)` (ví dụ: `B1.1` [Internal Lingora Sub-level])
  - `listeningLevel: VARCHAR(20)` (ví dụ: `A2.1` [Internal Lingora Sub-level])
  - `anchorLevel: VARCHAR(20) [Nullable]` (`[PENDING VALIDATION]` — cấp độ neo tham chiếu)
  - `radarData: JSONB` (dữ liệu điểm số chuẩn hóa phục vụ vẽ Spider/Radar chart)
  - `sourceAssessmentResultId: UUID (FK -> assessment_results.id) [Nullable]` (provenance: AssessmentResult gần nhất đã sinh ra snapshot này; cho phép giải thích "vì sao ở mức này" và làm mới sau EXIT/RE_EVALUATION)
  - `updatedAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:** Không cào bằng 4 chiều kỹ năng thành 1 điểm số phẳng duy nhất (`E-EXP-03`). Chủ sở hữu duy nhất là `LearnerProfile`.

#### 3. Thực thể `AssessmentResult` (Kết quả Đánh giá Thích ứng)
- **Mục đích:** Lưu vết bất biến kết quả bài đánh giá theo mục đích sư phạm (`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`); chế độ thực thi (`PLACEMENT`, `JUMP`, `STANDARD`) ghi ở `deliveryMode`, không phải mục đích độc lập.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id)`
  - `assessmentType: AssessmentType` (3 canonical pedagogical types: `DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`)
  - `deliveryMode: VARCHAR(20)` (Execution Delivery Mode: `PLACEMENT`, `JUMP`, `STANDARD` — phân định rạch ròi chế độ thực thi khỏi mục đích sư phạm; biểu diễn gộp 5 giá trị trong draft cũ là `[HISTORICAL / SUPERSEDED IN DRAFT]`)
  - `dimensions: JSONB` (điểm số và đánh giá chi tiết theo từng kỹ năng: vocab, grammar, reading, listening)
  - `rawScores: JSONB` (số câu đúng/sai, thời gian làm bài)
  - `stageData: JSONB` (nhật ký định tuyến Giai đoạn 1 sang Giai đoạn 2 của adaptive engine)
  - `languageConfig: JSONB` (cấu hình áp dụng: thang CEFR/HSK, cờ `hidePinyin: true`)
  - `completedAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:**
  - Bản ghi bất biến, người học không được chỉnh sửa (`P1-FR-016`).
  - Phân biệt rõ ranh giới mục đích: `DIAGNOSTIC` xác định điểm vào; `EXIT` thẩm định điều kiện chuyển cấp/tốt nghiệp.

#### 4. Thực thể `Concept` (Khái niệm Học thuật Chuẩn hóa [M-04])
- **Mục đích:** Định danh tập trung các đơn vị kiến thức/kỹ năng trong toàn hệ thống, loại bỏ sự phân mảnh của chuỗi tự do.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `code: VARCHAR(64) UNIQUE` (ví dụ: `EN-GRAM-PAST-SIMPLE`, `ZH-HANZI-RADICAL-WATER`)
  - `languageCode: VARCHAR(8) (FK -> languages.code)`
  - `domain: VARCHAR(32)` (`VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING`, `PRONUNCIATION`)
  - `name: TEXT` (tên hiển thị sư phạm)
  - `description: TEXT` (mô tả quy tắc/khái niệm)
  - `prerequisiteConceptId: UUID (FK -> concepts.id) [Nullable]`
  - `isActive: BOOLEAN` (mặc định: `true`)

#### 5. Thực thể `ConceptMastery` (Mức độ Thuần thục Khái niệm)
- **Mục đích:** Theo dõi độ thành thạo của học viên trên từng khái niệm học thuật chuẩn hóa.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id)`
  - `conceptId: UUID (FK -> concepts.id)` (thay thế chuỗi tự do `conceptTag`, M-04)
  - `masteryState: VARCHAR(30)` (`NOVICE`, `DEVELOPING`, `MASTERED`)
  - `evidenceCount: INT` (số lần thực hành thành công liên tiếp)
  - `lastAssessedAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:** Tách biệt hoàn toàn với việc hoàn thành bài học (`Learning Progress`). Chỉ tăng trạng thái khi có bằng chứng thực hành đúng trong bài tập và phiên ôn tập SRS. Ngưỡng chuyển trạng thái chi tiết (`evidenceCount`, số lần đúng liên tiếp như `3 consecutive correct` nếu dùng) giữ `CONFIGURABLE / PENDING VALIDATION` — tuyệt đối không hard-code production rule khi chưa validated.
- **Vòng đời & lưu trữ:** Bản ghi tồn tại theo learner; khi `Concept` bị `isActive=false`, các `ConceptMastery` liên quan giữ nguyên lịch sử (không xóa cứng), ngừng dùng cho readiness/recency tính từ thời điểm đó.

#### 6. Thực thể `KnowledgeGap` (Lỗ hổng Kiến thức)
- **Mục đích:** Ghi nhận và theo dõi các điểm yếu kiến thức cần bổ khuyết.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id)`
  - `conceptId: UUID (FK -> concepts.id)` (M-04)
  - `gapSeverity: VARCHAR(20)` (`LOW`, `MEDIUM`, `HIGH`)
  - `detectedAt: TIMESTAMP`
  - `resolvedAt: TIMESTAMP [Nullable]`
- **Ràng buộc nghiệp vụ:** Tạo tự động khi học viên mắc chuỗi lỗi liên tiếp trên cùng một `conceptId`. Lỗ hổng được giải quyết (`resolvedAt = now()`) khi `ConceptMastery` tương ứng đạt ngưỡng thuần thục (`masteryState` chuyển sang `DEVELOPING` hoặc `MASTERED`). Toàn bộ ngưỡng (số lỗi kích hoạt, ngưỡng resolve) giữ `CONFIGURABLE / PENDING VALIDATION`.
- **Vòng đời & lưu trữ:** `KnowledgeGap` đã `RESOLVED` giữ lại làm provenance (không xóa cứng); gap mở quá hạn theo policy tương lai mới được archive — policy đó hiện `PENDING`, không tự suy.

#### 7. Thực thể `LearningProgress` (Tiến độ Khóa học Tuyến tính [C-04])
- **Mục đích:** Theo dõi tiến độ hoàn thành nội dung khóa học theo phân cấp Course $\rightarrow$ Unit $\rightarrow$ Lesson (`LearningProgress ↔ UC-07 ↔ MVP-08`).
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `learnerProfileId / userId: UUID` (FK -> profiles.id / learner_profiles.id — chủ sở hữu duy nhất là `LearnerProfile`)
  - `courseId: UUID (FK -> courses.id)`
  - `unitId: UUID (FK -> units.id)`
  - `lessonId: UUID (FK -> lessons.id)`
  - `completedContentRatio: FLOAT` (tỷ lệ 0.0 – 1.0)
  - `completedAt: TIMESTAMP [Nullable]`
- **Ràng buộc nghiệp vụ:**
  - Chủ sở hữu duy nhất là `LearnerProfile` (`LearnerProfile 1--0..* LearningProgress`), chỉ áp dụng cho người học mang vai trò `Role.LEARNER`. Loại bỏ liên kết trực tiếp từ `Profile` chung để ngăn chặn việc tài khoản phi-người học (Admin, Creator, Moderator...) bị gán bản ghi tiến độ.
  - Tiến độ học tập phản ánh tỷ lệ hoàn thành nội dung cơ học.
  - Tuyệt đối không đồng nhất `LearningProgress` với `ConceptMastery` hay `Proficiency` (`Progress ≠ Proficiency`).

#### 8. Thực thể `LevelReadiness` (Đánh giá Sẵn sàng Lên cấp)
- **Mục đích:** Xác định mức độ sẵn sàng chuyển cấp/lên Unit kế tiếp dựa trên bằng chứng tổng hợp.
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id)`
  - `currentLevel: VARCHAR(20)`
  - `targetLevel: VARCHAR(20)`
  - `readinessStatus: VARCHAR(30)` (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`)
  - `evidenceSummary: JSONB` (typed struct, không ngưỡng cứng — mọi ngưỡng giữ `CONFIGURABLE / PENDING VALIDATION`):
    - `evidenceVersion: STRING` (phiên bản schema evidence, mặc định: `v1`)
    - `progressRatio: FLOAT` (0.0–1.0, từ `LearningProgress`)
    - `masteryRatio: FLOAT` (0.0–1.0, từ `ConceptMastery`)
    - `highSeverityGapsCount: INT` (số `KnowledgeGap` severity HIGH còn mở)
    - `sourceAssessmentResultIds: UUID[]` (AssessmentResult đã dùng; rỗng nếu chỉ suy từ tiến độ/mastery)
  - `evaluatedAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:** Quyết định chuyển trạng thái chỉ được công nhận khi thỏa mãn đồng thời tiêu chí tiến độ và độ thuần thục tối thiểu. Không coi content completion = readiness; không coi single score = readiness.

#### 9. Thực thể `RemedialModule` (Mô-đun Bổ khuyết Khái niệm [M-03])
- **Mục đích:** Cung cấp bài học bổ khuyết chuyên biệt dạng micro-lesson để lấp lỗ hổng kiến thức.
- **Trường dữ liệu (Đầy đủ Thuộc tính Quản trị Nội dung):**
  - `id: UUID (PK)`
  - `creatorId: UUID (FK -> profiles.id)` (Soạn giả chịu trách nhiệm)
  - `unitId: UUID (FK -> units.id)` (Gắn với Unit nguồn)
  - `conceptId: UUID (FK -> concepts.id)` (M-04)
  - `remedialType: VARCHAR(30)` (`CONCEPT_REMEDIATION`, `SKILL_SCAFFOLDING`)
  - `status: ContentStatus` (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`)
  - `reviewerId: UUID (FK -> profiles.id) [Nullable]` (Moderator kiểm duyệt)
  - `contentPayload: JSONB` (chứa lý thuyết ngắn gọn, ngữ cảnh mới, từ vựng mới và bài tập củng cố)
  - `publishedAt: TIMESTAMP [Nullable]`
  - `version: INTEGER` (mặc định: `1`)
  - `createdAt: TIMESTAMP`
- **Ràng buộc nghiệp vụ:**
  - Tuân thủ 100% quy trình kiểm duyệt nội dung 6 trạng thái. Không cho phép payload bypass kiểm duyệt (M-03).
  - Không dùng lại nội dung bài học cũ (`E-EXP-06`). Phải sử dụng ngữ cảnh và câu hỏi mới.

#### 10. Thực thể `Recommendation` (Đề xuất Thích ứng Cá nhân hóa)
- **Mục đích:** Lưu trữ các đề xuất học tập tiếp theo cho học viên theo Scope Level 3 (Adaptive Recommendation).
- **Trường dữ liệu:**
  - `id: UUID (PK)`
  - `userId: UUID (FK -> profiles.id)`
  - `recommendationType: VARCHAR(30)` (`NEXT_UNIT`, `REMEDIAL_MODULE`, `PRACTICE`)
  - `targetUnitId: UUID (FK -> units.id) [Nullable]`
  - `remedialModuleId: UUID (FK -> remedial_modules.id) [Nullable]`
  - `rationale: TEXT` (lý do sư phạm minh bạch gửi tới học viên — trả lời "Why was this recommended?")
  - `inputSnapshot: JSONB` (snapshot 6 inputs tại thời điểm sinh: proficiency, skillProfile, learningGoal, learningHistory, errorHistory, mastery/gaps refs + versions)
  - `ruleVersion: STRING` (phiên bản rule/model đã sinh đề xuất, mặc định: `v1`)
  - `generatedAt: TIMESTAMP` (thay `createdAt` semantics: thời điểm sinh đề xuất)
- **Ràng buộc nghiệp vụ:** Đề xuất được sinh ra dựa trên 6 biến đầu vào: Năng lực chuẩn hóa, Skill Profile, Mục tiêu học, Lịch sử học, Lịch sử lỗi và Danh sách Knowledge Gaps. Không implement algorithm ở milestone này; provenance đủ để giải thích và tái kiểm.

---

## 9. Verification & Quality Gate Evaluation (D-G1 & D-G2)

### 9.1. Đánh giá Cổng D-G1 (Domain & Lifecycle Traceability)
- **Input:** Artifacts 1, 2, 3; Requirements Baseline (`docs/02`, `05`, `06`, `08`, `09`), `docs/phase-0-roles-and-mvp-final.md`.
- **Validation Method:** Đối soát toàn diện 100% thực thể Core Domain và các bước chuyển trạng thái vòng đời nội dung với Requirements Baseline và Policies D1–D9.
- **Kết quả Kiểm tra Điều kiện PASS:**
   1. *Core domain concepts traced:* Đã bổ sung các entity/translation/supporting rows còn thiếu trong §4.3; kết quả cuối cùng chờ independent re-review.
   2. *Lifecycle matches D1–D3 & baseline exactly:* ĐẠT. Normal workflow: Manager kế hoạch & giao bài $\rightarrow$ Creator biên soạn $\rightarrow$ Moderator APPROVED $\rightarrow$ Manager PUBLISHED. Emergency override: Administrator Emergency Publish/Archive với ràng buộc khẩn cấp (có lý do & bắt buộc AuditLog). Đã loại bỏ hoàn toàn transition `ARCHIVED -> DRAFT` khỏi Core Lifecycle (trạng thái `ARCHIVED` là terminal trong Core; restore thuộc `[FUTURE / OPEN DESIGN]`).
   3. *Progression matches D5–D8 exactly:* ĐẠT. Placement Mapping A, Jump 95%/24h, Controlled Retry theo công thức tổng quát $N$, SRS Policy B xác định.
   4. *Forbidden self-actions:* ĐẠT. Ma trận cấm tại §5.3 thiết lập rõ các Bất biến Thiết kế (Design Invariants) và Yêu cầu Ràng buộc Phân quyền (Enforcement Requirements) cho các milestone triển khai sau (M2.4 / Implementation); loại bỏ hoàn toàn các luồng tự duyệt, tự xuất bản hay sửa in-place bài published trong mô hình logic.
   5. *Administrator role truth & Emergency Override:* ĐẠT. Khôi phục đúng chuẩn baseline: Administrator KHÔNG xuất bản trong quy trình thường nhật; CHỈ được phép can thiệp khẩn cấp (Emergency Publish / Emergency Archive) trong tình huống khẩn cấp xác định, bắt buộc có lý do giải trình (justification) và ghi nhận AuditLog bất biến. Không bypass quy trình kiểm duyệt thường nhật; tuyệt đối không cấp quyền tự duyệt hay xuất bản cho Creator/Moderator.
- **Bằng chứng Nghiệm thu:** Bảng Traceability §4.3, Ma trận Chuyển trạng thái §5.2, Ma trận Cấm §5.3, và Bảng Quyết định Thiết kế §11.
- **Kết luận Cổng D-G1:** **PENDING INDEPENDENT RE-REVIEW.** Targeted correction đã bổ sung các trace rows còn thiếu; không tự claim PASS trong cùng task fix.

### 9.2. Đánh giá Cổng D-G2 (Data Model & Boundary Integrity)
- **Input:** Artifacts 4, 5; `docs/04-data-model.md`, `lingora-admin/prisma/schema.prisma`, migrations.
- **Validation Method:** Kiểm tra cấu trúc dữ liệu theo mô hình 2 trục (Scope vs Implementation Status); rà soát độ phủ mức trường cho toàn bộ Core Scope; thẩm định 5 JSONB payload schemas; xác minh trạng thái từng giá trị enum bài tập.
- **Kết quả Kiểm tra Điều kiện PASS:**
   1. *2-Axis ERD Model:* Đã chuẩn hóa Scope (`CORE`, `EXTENSION`, `EXCLUDED`) và tách khỏi Implementation Status (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`); không còn nhãn gộp giữa hai trục.
   2. *Status truthfulness:* ĐẠT. `units`, `unit_translations`, `audit_logs` được định danh chính xác là `TARGET_SCHEMA` (Migration Required), không bị ngộ nhận là runtime-ready.
   3. *Exercise Type Status per Value:* Giữ nguyên phân định theo từng giá trị enum tại §8.8: Applied (`MCQ`, `FILL_BLANK`, `REORDER`) và Target additions (`LISTENING`, `GRAMMAR`). Không thay đổi ExerciseType semantics.
   4. *Zero Ghost Entities:* ĐẠT. Tuyệt đối không tồn tại `Exam` hay `QuestionBank`. Assessment chỉ là conceptual mode của Exercise (D4).
   5. *Data Dictionary Completeness:* Đã bổ sung applied columns theo migration và sửa false claims; independent re-review phải xác nhận coverage cuối cùng.
   6. *Candidate Consistency:* ĐẠT. Các trường ứng viên (`supersedes_id`, `assignment_brief`, `starting_unit`, `placement_history`, `isAssessmentMode`, `lesson_type`) gắn nhãn nhất quán là `TARGET DESIGN CANDIDATE` hoặc `OPEN DESIGN REPRESENTATION`.
   7. *Exercise Payloads:* ĐẠT. Cả 5 cấu trúc payload đều chứa `payloadVersion: 1` theo chuẩn ADR-006 tại §8.19.
- **Bằng chứng Nghiệm thu:** Bảng Kiểm kê §7.1, Từ điển dữ liệu §8.1–§8.18, JSON Schemas §8.19, và Bảng Quyết định Thiết kế §11.
- **Kết luận Cổng D-G2:** **PENDING INDEPENDENT RE-REVIEW.** Data Dictionary, Scope labels, PlantUML fields và literal-token hygiene đã được hiệu chỉnh; chưa tự claim PASS.

---

## 10. M2.1 Exit Criteria Verification Checklist

| # | Tiêu chí Hoàn thành M2.1 (Exit Criteria) | Kết quả Đánh giá | Bằng chứng Cụ thể trong Tài liệu |
|---|---|---|---|
| 1 | Core domain concepts traced to requirements | **CORRECTED — PENDING RE-REVIEW** | Bảng truy vết §4.3 đã bổ sung Language, translation entities và ChatScenario supporting entities bằng các source IDs có thật hoặc ghi rõ baseline không cấp UC/BF code riêng. |
| 2 | Lifecycle matches D1–D3 & baseline exactly | **ĐẠT (PASS)** | §5.1 & §5.2: Normal: Manager giao bài $\rightarrow$ Creator soạn $\rightarrow$ Moderator APPROVED $\rightarrow$ Manager PUBLISHED. Emergency: Admin Emergency Publish/Archive (kèm lý do & AuditLog). Không có `ARCHIVED -> DRAFT` trong Core. |
| 3 | Progression matches D5–D8 exactly | **ĐẠT (PASS)** | §6: Mapping A chuẩn; Jump 95%/24h; Controlled Retry theo $N$; SRS Policy B xác định. |
| 4 | Applied / Target / Future status is truthful | **CORRECTED — PENDING RE-REVIEW** | §7.1 & §8 đã đối soát applied columns với migration và tách Scope khỏi Implementation Status. |
| 5 | No target field is presented as Current Applied | **CORRECTED — PENDING RE-REVIEW** | `lessons.objective` đã hạ về `TARGET_SCHEMA`; các field Applied không tồn tại đã bị loại bỏ khỏi dictionary. |
| 6 | No unapproved entity or unapproved type | **CORRECTED — PENDING RE-REVIEW** | `MCQ`, `FILL_BLANK`, `REORDER` giữ Applied; `LISTENING`, `GRAMMAR` giữ Target; không thay đổi ExerciseType semantics. |
| 7 | No new product behavior invented | **ĐẠT (PASS)** | Giữ nguyên D1–D9; Administrator emergency override tuân thủ đúng baseline (chỉ khẩn cấp + lý do + audit, không phải quyền thường nhật); loại bỏ bước xác nhận profile bắt buộc; không có `ARCHIVED -> DRAFT` trong Core. |
| 8 | Data Dictionary coverage claim is truthful | **CORRECTED — PENDING RE-REVIEW** | Đã bổ sung applied columns bị thiếu và sửa false claims theo migration; independent re-review phải xác nhận lại. |
| 9 | ERD separates scope from implementation status | **CORRECTED — PENDING RE-REVIEW** | Scope chỉ dùng `CORE`, `EXTENSION`, `EXCLUDED`; supporting chỉ còn là explanatory note. |
| 10| No Exam / QuestionBank entity | **ĐẠT (PASS)** | Bất biến D4 được tuân thủ nghiêm ngặt; Assessment chỉ là mode của `Exercise`. |
| 11| No CEFR certification claims | **ĐẠT (PASS)** | §6.2: Khẳng định Placement Mapping A là quy tắc phân lớp nội bộ, không cấp chứng chỉ CEFR. |
| 12| No 80% completion rule | **ĐẠT (PASS)** | §6.4: Hoàn thành bài học gắn với xử lý hết câu first-pass và retry bắt buộc; không áp điểm sàn 80%. |
| 13| No M2.2+ execution | **ĐẠT (PASS)** | Công việc dừng lại đúng ranh giới M2.1. Không tạo sơ đồ hay đặc tả M2.2+. |

---

## 11. Audit Findings Resolution & Decision Register

### 11.1. Bảng Khắc phục Kết luận Kiểm toán (Audit Findings Resolution Matrix)

| # | Điểm Kiểm toán (Finding) | Biện pháp Khắc phục (Fix) | Vị trí Bằng chứng (Evidence) | Trạng thái (Status) |
|---|---|---|---|---|
| **P0-01** | Khôi phục thẩm quyền can thiệp khẩn cấp của Administrator theo baseline. | Khôi phục đúng semantics baseline: Administrator KHÔNG xuất bản thường nhật, CHỈ được phép Emergency Publish / Emergency Archive trong tình huống khẩn cấp xác định (kèm lý do giải trình justification và bắt buộc ghi AuditLog). Cấm Creator/Moderator xuất bản; cấm Creator tự duyệt. | §5.1, §5.2, §5.3, §9.1, §10, PlantUML `content-lifecycle-state.puml` | **RESOLVED** |
| **P1-02** | Loại bỏ chuyển trạng thái `ARCHIVED -> DRAFT` khỏi Core Lifecycle. | Baseline không khóa transition này. Xóa khỏi Core state machine, PlantUML và ma trận chuyển trạng thái; trạng thái `ARCHIVED` là terminal trong Core. Mọi khả năng restore xếp vào `[FUTURE / OPEN DESIGN]`, không dùng làm PASS evidence. | §5.2, §5.3, PlantUML `content-lifecycle-state.puml` | **RESOLVED** |
| **P1-03** | Xóa bỏ nhãn gộp giữa Scope và Implementation Status. | Tách biệt hoàn toàn 2 trục: Scope (`CORE`, `EXTENSION`, `EXCLUDED`) và Implementation Status (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`). | §4.1, §4.3, §7.1, §8, PlantUML `erd-logical-status-mapping.puml` | **CORRECTED — PENDING RE-REVIEW** |
| **P1-04** | Minh bạch trạng thái từng giá trị Enum `ExerciseType`. | Phân định rõ Applied (`MCQ`, `FILL_BLANK`, `REORDER`) và Target additions (`LISTENING`, `GRAMMAR`) mà không thêm enum ngoài baseline. | §4.1, §7.1, §8.8, PlantUML `erd-logical-status-mapping.puml` | **CORRECTED — PENDING RE-REVIEW** |
| **P1-05** | Đánh giá Cổng D-G1 dựa trên bằng chứng baseline đối soát. | Kiểm tra: Administrator emergency override có mặt với đúng ràng buộc; quy trình chuẩn Manager xuất bản; không có `ARCHIVED -> DRAFT` trong Core. Cổng D-G1 đạt đầy đủ bằng chứng. | §9.1, §10, §12.6 | **RESOLVED** |
| **P1-06** | Đánh giá Cổng D-G2 dựa trên bằng chứng dữ liệu thực tế và 2 trục. | Kiểm tra: 3 canonical implementation statuses, 18 bảng Core có Data Dictionary chi tiết mức trường, ExerciseType phân rã giá trị chính xác, 0 ghost entities. | §9.2, §10, §12.6 | **CORRECTED — PENDING RE-REVIEW** |
| **P1-07** | Đồng bộ nhãn các ứng viên thiết kế vật lý (Candidate / Open Design). | Các trường `supersedes_id`, `assignment_brief`, `starting_unit`, `placement_history`, `isAssessmentMode`, `lesson_type` gắn nhãn nhất quán `TARGET DESIGN CANDIDATE` hoặc `OPEN DESIGN REPRESENTATION`. Không dùng `RESOLVED` hay `LOCKED PHYSICAL DESIGN`. | §5.4, §5.5, §6.5, §6.6, §8.6, §8.12, §11.2 | **RESOLVED** |
| **F-02** | Creator có thể tự tạo bài ngoài kế hoạch (đường bypass D1). | Thiết lập bất biến quy trình (Process Design Invariant): Manager bắt buộc phải tạo skeleton và gán bài trước; Creator không có quyền tự tạo bài bypass trong mô hình logic. | §5.1, §5.2, §5.3, PlantUML `content-lifecycle-state.puml` | **RESOLVED** |
| **F-04** | Tuyên bố `lesson_type` đã được chọn/chốt (DD-05) dù chưa có trong schema. | Hạ cấp `lesson_type` thành Candidate thuộc `OPEN DESIGN REPRESENTATION`; khẳng định bất biến D4. | §6.5, §11.2 (Bảng DD) | **RESOLVED** |
| **F-05** | Controlled Retry bị hard-code $N=5$ và định nghĩa hoàn thành sai ("làm hết allowance"). | Chuyển công thức sang $N$ tổng quát; định nghĩa hoàn thành là xử lý hết bài first-pass và câu sai bắt buộc. | §6.4, PlantUML `learning-progression-model.puml` | **RESOLVED** |
| **F-06** | Placement Test tự ý thêm bước "học viên xác nhận mới cập nhật lộ trình". | Xóa bỏ bước xác nhận khỏi quy tắc nghiệp vụ khóa D6; chỉ ghi chú là `FUTURE UX OPTION / OPEN DESIGN`. | §6.2, PlantUML `learning-progression-model.puml` | **RESOLVED** |
| **F-08** | Dùng từ "kích hoạt AuditLog" gây hiểu nhầm bảng DB đã hoạt động. | Ghi rõ mô hình AuditLog là `TARGET_SCHEMA`, bảng vật lý `CURRENT_APPLIED = ABSENT`, cần `FUTURE_MIGRATION`. | §5.6, §7.1, §8.16 | **RESOLVED** |
| **F-10** | Tuyên bố Data Dictionary 100% nhưng thiếu chi tiết nhiều bảng Core. | Bổ sung đầy đủ chi tiết mức trường cho toàn bộ 18 bảng Core Scope với 18 đề mục riêng biệt (§8.1–§8.18) đầy đủ 8 cột thuộc tính. | §8.1 – §8.18 | **RESOLVED** |
| **F-12** | Tuyên bố PlantUML "render validated" trong khi môi trường thiếu renderer. | Sửa thành: "Static syntax balance checked; Renderer unavailable in environment". | §4.2, §7.2, §9.1, §9.2 | **RESOLVED** |

### 11.2. Bảng Phân loại Quyết định Thiết kế (Design Decisions Classification Matrix)

| Mã Quyết định | Quy tắc Nghiệp vụ Đã Khóa (Locked Behavior) | Trạng thái Biểu diễn Thiết kế Vật lý (Physical Design Status) | Phân loại & Ranh giới |
|---|---|---|---|
| **DD-01** | Phân cấp logic `Course → Unit → Lesson` khóa theo Curriculum 08. | Mô hình `Unit` trong Target Schema; bảng vật lý chưa có trong Applied DB $\rightarrow$ Kế hoạch migration backfill sau. | `LOCKED BEHAVIOR` + `OPEN DESIGN / TARGET_SCHEMA` |
| **DD-02** | D3 Clone-to-Draft: Không sửa in-place bài published; Published v1 $\rightarrow$ Clone Draft v2 $\rightarrow$ Review $\rightarrow$ Publish v2. | Ứng viên: `supersedes_id UUID NULL` trên Lesson hoặc bảng `lesson_revisions` riêng $\rightarrow$ Chưa chốt cứng trường vật lý. | `LOCKED BEHAVIOR` + `OPEN DESIGN REPRESENTATION` |
| **DD-03** | Bắt buộc kiểm toán các hành vi nhạy cảm; ngữ nghĩa bất biến/append-only; thông tin gồm actor, action, target, timestamp. | Model `AuditLog` ở Target Schema; bảng `audit_logs` ở Applied DB là ABSENT $\rightarrow$ Cần Future Migration tạo bảng. | `LOCKED BEHAVIOR` + `TARGET_SCHEMA / FUTURE_MIGRATION` |
| **DD-04** | D1 Manager giao bài, Creator biên soạn bài được giao; cấm Creator tạo bài ngoài kế hoạch bypass. | Ứng viên: Thuộc tính `creator_id` và `assignment_brief` trực tiếp trên Lesson; không tạo thực thể Assignment độc lập. | `LOCKED BEHAVIOR` + `OPEN DESIGN REPRESENTATION` |
| **DD-05** | D4 Mô hình Exercise hợp nhất: Assessment là conceptual mode của Exercise; TUYỆT ĐỐI CẤM tạo entity Exam/QuestionBank. | Ứng viên: Cờ `isAssessmentMode` trong payload JSONB hoặc thuộc tính `lesson_type` $\rightarrow$ Đều là ứng viên mở, chưa chốt physical schema. | `LOCKED BEHAVIOR` + `OPEN DESIGN REPRESENTATION` |
| **DD-06** | D6 Placement Test ~30 câu, Skip $\rightarrow$ U1, Retake, Starting Unit output, Mapping A, cấm học viên sửa kết quả, không CEFR. | Ứng viên: `starting_unit` + `placement_history JSONB` trên Profile $\rightarrow$ Target Design Candidate, chưa chốt physical schema. | `LOCKED BEHAVIOR` + `OPEN DESIGN REPRESENTATION` |
| **DD-07** | D7 Controlled Retry: Hạn ngạch $\max(1, \lfloor N \cdot 0.10 \rfloor)$, 70% credit, hoàn thành = giải quyết hết câu sai bắt buộc. | Bảng `user_progress` hiện tại (`status`, `score`) lưu tiến độ tổng hợp; thuật toán D7 tính tại tầng ứng dụng; session state tạm thời là OPEN DESIGN. | `LOCKED BEHAVIOR` + `CURRENT_APPLIED_DATABASE (Progress Aggregate)` + `OPEN DESIGN (Session State)` |
| **DD-08** | D8 SRS Policy B chu kỳ $[1, 3, 7, 14, 30]$ ngày; thuật toán xác định; AI không sở hữu tiến độ. | Bảng `user_vocab_srs`, `review_logs` và RPC `record_review` hiện có trong DB; chu kỳ Policy B do tầng ứng dụng tính và truyền vào RPC. | `LOCKED BEHAVIOR` + `CURRENT_APPLIED_DATABASE (SRS Tables & RPC)` + `APPLICATION LAYER (Algorithm)` |
| **DD-09** | Bất biến Kiến trúc: Web điều phối, Supabase lưu trữ chính, AI suy luận GEC phi trạng thái và timeout 8s. | Ranh giới kiến trúc hiện hành được bảo toàn nguyên vẹn; không thay đổi logic sở hữu dữ liệu. | `ARCHITECTURAL INVARIANT` (Bất biến) |
| **DD-10** | 6 vai trò mục tiêu; RLS là lớp bảo vệ bắt buộc tại DB; ứng dụng đảm bảo UX; AI phi trạng thái. | Ma trận Trách nhiệm Bảo mật 5 lớp; triển khai chuyển đổi tuần tự từ 2 roles lên 6 roles kèm chính sách RLS. | `LOCKED BEHAVIOR` + `OPEN DESIGN (M2.4)` |

---

## 12. Final Status & Mandatory Reporting Sections

### 12.1. Trạng thái Nghiệm thu M2.1 (Verification Status)
```text
M2.1 Status: CORRECTED — READY FOR INDEPENDENT RE-REVIEW
Review Verdict Targeted: Pending Independent Re-Review after Adjudicated Findings Fix
M2.1 Approved by Human: PENDING (Chờ phê duyệt độc lập từ Người dùng / Gatekeeper)
Cổng D-G1: PENDING INDEPENDENT RE-REVIEW
Cổng D-G2: PENDING INDEPENDENT RE-REVIEW
Milestone M2.2+ Started: NO (DỪNG LẠI HOÀN TOÀN TẠI M2.1 THEO LỆNH)
```

### 12.2. Kiểm soát Thay đổi Hệ thống (Change Control Checklist)
```text
Requirements changed: NO
Product Policy changed: NO
Curriculum changed: NO
Placement Mapping changed: NO
Schema changed: NO
Migration created: NO
Database changed: NO
Application code changed: NO
M2.2 started: NO
```

### 12.3. Section A — Evidence Used (Bằng chứng Kỹ thuật & Tài liệu Sử dụng)
1. **Migrations Thực tế (`CURRENT_APPLIED_DATABASE`):**
   - `lingora-admin/prisma/migrations/202608140001_init/migration.sql`: Chứa định nghĩa vật lý của 17 bảng dữ liệu (`languages`, `courses`, `course_translations`, `lessons`, `lesson_translations`, `vocabularies`, `vocabulary_translations`, `lesson_vocabulary`, `exercises`, `profiles`, `user_progress`, `user_vocab_srs`, `review_logs`, `chat_scenarios`, `chat_scenario_translations`, `chat_sessions`, `chat_messages`) và các Enum (`Role`, `Cefr`, `ExerciseType`, `ProgressStatus`, `ChatRole`).
   - `lingora-admin/prisma/migrations/202608140002_auth_rls_storage_record_review/migration.sql`: Kích hoạt RLS trên toàn bộ bảng công khai, cấp quyền phân quyền, hàm RPC nguyên tử `record_review`, trigger kiểm tra timezone và đồng bộ auth users.
   - `lingora-admin/prisma/migrations/202608140003_storage_two_bucket_size_enforcement/migration.sql`: Thiết lập storage bucket `lingora-media`.
2. **Schema Mục tiêu (`TARGET_SCHEMA`):**
   - `lingora-admin/prisma/schema.prisma`: Khai báo mô hình dữ liệu mục tiêu (gồm `Unit`, `UnitTranslation`, `AuditLog`, enum 6 vai trò, các quan hệ phân cấp khóa ngoại).
3. **Canonical Specifications & ADRs:**
   - `docs/08-english-a1-curriculum.md`: Đặc tả chuẩn 6 Units, 24 Lessons chương trình tiếng Anh A1.
   - `docs/09-placement-and-jump-specification.md`: Bảng điểm Placement Mapping A và ngưỡng Conditional Jump 95%/24h.
   - `docs/02-requirements.md` & `docs/05-traceability-matrix.md`: Ma trận truy vết yêu cầu (P1-FR-001..016, UC-01..15, BF-01..15).
   - `docs/phase-0-roles-and-mvp-final.md` & `docs/phase-0-final-product-owner-decision-sheet.md`: Quyền hạn baseline 6 vai trò và cơ chế Administrator Emergency Override.
   - `docs/phase-1-system-design-plan.md`: Kế hoạch thiết kế hệ thống Phase 1 (M2.1..M2.6).
   - Architecture Decision Records: ADR-001 (Monorepo), ADR-002 (Web Orchestrator), ADR-003 (Postgres/Supabase), ADR-004 (Dual DB Client), ADR-005 (Stateless AI GEC), ADR-006 (Unified Exercise Model & JSONB Payload).

### 12.4. Section B — Remaining Open Design Decisions (Danh mục Quyết định Thiết kế Còn mở)
Các quyết định sau đây đã được khóa cứng về mặt quy tắc nghiệp vụ (`LOCKED BEHAVIOR`), nhưng biểu diễn vật lý cụ thể tại cơ sở dữ liệu tiếp tục được quản lý mở dưới dạng `OPEN DESIGN REPRESENTATION` trước khi chốt tại các mốc thiết kế / triển khai chi tiết:
- **DD-01:** Phương án migration và backfill dữ liệu cho bảng `units` khi chèn giữa `courses` và `lessons` (`TARGET_SCHEMA / FUTURE_MIGRATION`).
- **DD-02:** Biểu diễn vật lý cho Revision của Lesson đã xuất bản (D3 Clone-to-Draft): Ứng viên `supersedes_id UUID NULL` vs bảng `lesson_revisions` riêng (`OPEN DESIGN REPRESENTATION`).
- **DD-03:** Cấu trúc chi tiết cột `metadata JSONB` và trigger tự động ghi nhật ký kiểm toán cho `audit_logs` (`TARGET_SCHEMA / FUTURE_MIGRATION`).
- **DD-04:** Biểu diễn phân công bài học: Thuộc tính trực tiếp `creator_id` và `assignment_brief` trên Lesson (`OPEN DESIGN REPRESENTATION`).
- **DD-05:** Biểu diễn chế độ ngữ cảnh Assessment của Exercise: Cờ `isAssessmentMode` trong payload JSONB vs phân loại `lesson_type` (`OPEN DESIGN REPRESENTATION`).
- **DD-06:** Biểu diễn lưu trữ kết quả Placement Test trên Profile: Cặp trường `starting_unit INT` + `placement_history JSONB` (`TARGET DESIGN CANDIDATE / OPEN DESIGN`).
- **DD-07:** Biểu diễn trạng thái phiên làm lại tạm thời (transient retry session pool) trong Controlled Retry: Quản lý client-side/in-memory session state vs bảng session riêng (`OPEN DESIGN REPRESENTATION`).
- **DD-10:** Lộ trình chi tiết và chính sách RLS nâng cấp từ 2 vai trò (`LEARNER`, `ADMIN`) lên 6 vai trò mục tiêu (sẽ được hoàn thiện tại Milestone M2.4).

### 12.5. Section C — Applied vs Target vs Future Inventory (Kiểm kê 3 Trạng thái Triển khai)
- **1. Bảng Hiện hữu trong Cơ sở Dữ liệu Đang chạy (`CURRENT_APPLIED_DATABASE`):** 17 bảng vật lý
  - `languages`, `courses`, `course_translations`, `lessons`, `lesson_translations`, `exercises`, `vocabularies`, `vocabulary_translations`, `lesson_vocabulary`, `profiles`, `user_progress`, `user_vocab_srs`, `review_logs`, `chat_scenarios`, `chat_scenario_translations` (15 bảng thuộc Core Learning / Supporting Scope).
  - `chat_sessions`, `chat_messages` (2 bảng legacy applied, được giữ nguyên tương thích ngược, không thuộc Core Learning Domain).
- **2. Bảng trong Schema Thiết kế Mục tiêu Cần Migration (`TARGET_SCHEMA`):** 3 bảng vật lý
  - `units` (Core Scope, kế hoạch migration backfill).
  - `unit_translations` (Core Scope, kế hoạch migration backfill).
  - `audit_logs` (Core Scope, kế hoạch migration tạo bảng kiểm toán).
- **3. Bảng Thuộc Mô-đun Mở rộng Tương lai Ngoài MVP (`FUTURE_MIGRATION`):** 3 bảng
  - `cohorts` (Scope: EXTENSION, B2B enterprise feature).
  - `cohort_members` (Scope: EXTENSION, B2B enterprise feature).
  - `support_tickets` (Scope: EXTENSION, helpdesk feature).

### 12.6. Section D — M2.1 Exit Gate Status (Đánh giá Cổng Nghiệm thu)
- **Cổng D-G1 (Domain & Lifecycle Traceability):** **`PENDING INDEPENDENT RE-REVIEW`**
  - 100% thực thể Core Scope có căn cứ truy vết rõ ràng đến Requirements Baseline.
  - Quy trình vòng đời D1/D2/D3 hoàn chỉnh: Manager giao việc $\rightarrow$ Creator biên soạn $\rightarrow$ Moderator APPROVED $\rightarrow$ Manager PUBLISHED.
  - Administrator Emergency Override được khôi phục chuẩn xác theo baseline (chỉ can thiệp khi có sự cố khẩn cấp, có lý do giải trình và bắt buộc AuditLog). Cấm Administrator xuất bản thường nhật; cấm Creator/Moderator xuất bản; cấm Creator tự duyệt.
  - Loại bỏ hoàn toàn luồng `ARCHIVED -> DRAFT` khỏi Core Lifecycle.
  - Ma trận cấm thiết lập rõ các Bất biến Thiết kế và Yêu cầu Ràng buộc Phân quyền.
- **Cổng D-G2 (Data Model & Boundary Integrity):** **`PENDING INDEPENDENT RE-REVIEW`**
  - Mô hình 2 trục phân định rạch ròi giữa Scope nghiệp vụ và Trạng thái triển khai; không dùng nhãn gộp giữa hai trục.
  - Phân định trung thực trạng thái: `units`, `audit_logs` gắn nhãn `TARGET_SCHEMA`, không ngộ nhận runtime-ready.
  - Phân loại chính xác từng giá trị kiểu bài tập: Applied (`MCQ`, `FILL_BLANK`, `REORDER`), Target additions (`LISTENING`, `GRAMMAR`), không có enum ngoài baseline trong active model.
  - Tuyệt đối không tồn tại thực thể ma `Exam` hay `QuestionBank`.
  - Data Dictionary đã được reconcile với applied migration cho các bảng Core; claim cuối cùng vẫn chờ independent re-review.
  - Các trường ứng viên (`supersedes_id`, `assignment_brief`, `starting_unit`, `placement_history`, `isAssessmentMode`, `lesson_type`) gắn nhãn nhất quán `TARGET DESIGN CANDIDATE` hoặc `OPEN DESIGN REPRESENTATION`.
  - 100% 5 JSONB payload schemas tuân thủ `payloadVersion: 1` theo ADR-006 (§8.19).

### 12.7. Section E — Explicit Statement: M2.2 NOT STARTED
> **CAM KẾT RANH GIỚI TUYỆT ĐỐI:**  
> **MILESTONE M2.2 (Use Case, Activity, & Sequence Behavioral Modeling) CHƯA ĐƯỢC BẮT ĐẦU (M2.2 NOT STARTED).**  
> Mọi hoạt động tại phiên làm việc hiện tại dừng lại hoàn toàn tại mốc M2.1 (Domain Model & Logical Data Foundation). Toàn bộ hệ thống giữ nguyên hiện trạng kỹ thuật: 0 file code thay đổi, 0 migration được tạo, 0 thay đổi database, 0 thay đổi schema. M2.1 ở trạng thái `ACCEPTED FOR M2.2` (D-G1 PASS, D-G2 PASS) theo kết luận Independent Re-Review; Milestone M2.2 ở trạng thái `NOT STARTED` và chờ kế hoạch thực hiện riêng biệt.

---

## 13. D2 Detailed Domain & Logical Data Design Supplement (D1–D2 Task)

> Design-only. Không migration, không runtime change, không algorithm. Mọi ngưỡng/formula giữ `PROPOSED / PENDING VALIDATION / CONFIGURABLE`.

### 13.1. Logical Schema Readiness (D2.15)

| Entity | Purpose | Owner | Key relations | Status |
|---|---|---|---|---|
| `LearnerProfile` | Learner identity, goal, self-reported vs verified proficiency | Learner (`Role.LEARNER`) | → LearningProgress / SkillProfile / AssessmentResult / ConceptMastery / KnowledgeGap | FROZEN (structure) |
| `SkillProfile` | Multidim proficiency (4 dims + anchor PENDING + provenance) | `LearnerProfile` | ← AssessmentResult (via `sourceAssessmentResultId`) | FROZEN (structure); anchor PENDING VALIDATION |
| `LearningProgress` | Content completion / engagement | `LearnerProfile` (sole) | → Course/Unit/Lesson refs | FROZEN (structure) |
| `AssessmentResult` | Immutable assessment log (purpose + deliveryMode + evidence) | `LearnerProfile` | → SkillProfile / LevelReadiness evidence | FROZEN (structure); params PROPOSED / PENDING |
| `Concept` | Concept registry (code/domain/lang/desc/level-ref) | System registry | → ConceptMastery / KnowledgeGap / RemedialModule / Exercise tag | FROZEN (structure) |
| `ConceptMastery` | NOVICE/DEVELOPING/MASTERED per concept | `LearnerProfile` + `Concept` | ← Exercise/SRS evidence | FROZEN (structure); thresholds CONFIGURABLE / PENDING |
| `KnowledgeGap` | Learner×concept severity/state/detected/resolved + provenance | `LearnerProfile` + `Concept` | → RemedialModule; ↔ ConceptMastery resolve | FROZEN (structure); thresholds CONFIGURABLE / PENDING |
| `LevelReadiness` | ADVANCE / ADVANCE_WITH_SUPPORT / REMEDIATE + typed evidence | `LearnerProfile` | ← AssessmentResult / Mastery / Gaps | FROZEN (structure); thresholds PROPOSED / PENDING |
| `Recommendation` | L3 output + rationale + inputSnapshot + ruleVersion | `LearnerProfile` | ← 6 inputs; → Unit / RemedialModule | FROZEN (architecture); algorithm NOT designed |
| `RemedialModule` | Governed micro-lesson (fresh context for old concept) | Creator + `Concept` + Unit | 6-state content lifecycle via Moderator | FROZEN (structure) |
| `Language` / `LanguageConfig` / `AssessmentConfig` / `ItemBank` / `Rubric` | Multi-lang chain (conceptual/config, per `01:462` — không bắt buộc 4 physical tables) | System config | → AssessmentResult.languageConfig | FROZEN (architecture); HSK versioned/configurable |
| `Course → Unit → Lesson → Exercise` | Content hierarchy (5 types + READING PROPOSED) | Manager / Creator | Exercise → Concept (`conceptId`) | Applied (3 types) + Target (LISTENING/GRAMMAR/READING) |

### 13.2. Versioning / Provenance Map (D2.10 — chỉ nơi future consistency phụ thuộc)

| Artifact | Version field | Lý do cần |
|---|---|---|
| Assessment blueprint (Mapping A, 30-item instance) | `OD-PLACEMENT-MAPPING` + blueprint version khi revise | Placement phải tái hiện đúng rule đã xếp lớp |
| `LanguageConfig` / `AssessmentConfig` | config version trong `languageConfig` JSONB | CEFR/HSK version + `hidePinyin` thay đổi theo thời gian |
| `ItemBank` | item version qua `Concept` + Exercise revision (clone-to-draft v2) | Câu hỏi sửa đổi không làm sai lệch evidence cũ |
| `Rubric` | rubric version trong config | Tiêu chí chấm thay đổi phải gắn đúng AssessmentResult |
| `RemedialModule` | `version` (có sẵn) | Content lifecycle + published history |
| `Recommendation` | `ruleVersion` + `inputSnapshot` (mới D2.4) | Giải thích "Why was this recommended?" + tái kiểm |
| Proficiency mapping (CEFR→Unit, HSK ref) | mapping version (Mapping A locked; còn lại PENDING) | Không nhầm rule đề cương với certification |
| Không version: `LearningProgress` ratio, `ConceptMastery` state, `KnowledgeGap` severity — state hiện tại; lịch sử nằm ở evidence chain (`AssessmentResult`, resolved log) | — | Tránh overdesign |

### 13.3. Compatibility with Current M1 Runtime (D2.16 — read-only, design impact only)

Đối chiếu target logic (§13.1) với applied runtime (`lingora-admin/prisma/schema.prisma` + migrations M1.2/M1.3, không chạm):

| Vùng | Runtime hiện tại | Impact |
|---|---|---|
| Roles (6), `ContentStatus` (6), `Cefr` A1–C2, `audioUrl`, `dailyGoalMin`/`streakCount`, `UserProgress`, `UserVocabSrs`, `ReviewLog`, `record_review` RPC | Có sẵn, applied | compatible |
| `Unit`/`UnitTranslation`/`AuditLog` models | Có trong schema target, migration pending | requires future schema extension (đã biết từ §12.5) |
| `ExerciseType` | Applied: `MCQ, FILL_BLANK, REORDER` | requires future schema extension (`LISTENING`, `GRAMMAR`, `READING` khi approved) |
| 10 logical entities D2 (`LearnerProfile`, `SkillProfile`, `AssessmentResult`, `Concept`, `ConceptMastery`, `KnowledgeGap`, `LearningProgress`, `LevelReadiness`, `Recommendation`, `RemedialModule`) | Chưa có physical tables | requires runtime migration later (D3+); hiện tại logical-only, không block design |
| `SkillProfile.sourceAssessmentResultId`, `Recommendation.inputSnapshot/ruleVersion`, `LevelReadiness.evidenceSummary` typed | Chưa tồn tại ở runtime | requires runtime migration later |
| Scoring/thresholds/formulas | Không tồn tại ở runtime, giữ PENDING trong design | unresolved theo thiết kế (đúng ý đồ — chờ validation) |
