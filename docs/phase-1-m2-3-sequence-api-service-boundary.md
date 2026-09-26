# LINGORA — PHASE 1 MILESTONE M2.3: SEQUENCE INTERACTIONS, API CONTRACTS & SERVICE BOUNDARIES

> **Mã tài liệu:** `docs/phase-1-m2-3-sequence-api-service-boundary.md`  
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Mốc thực thi:** Milestone M2.3 (Sequence Interactions, API Contracts & Service Boundary Modeling)  
> **Trạng thái:** `READY FOR INDEPENDENT RE-REVIEW` (Triển khai hoàn tất khắc phục 14 P1 và các P2 theo kết quả thẩm định độc lập; KHÔNG tuyên bố Design Freeze; KHÔNG tự ý coi là ACCEPTED).  
> **Căn cứ kế hoạch:** `plans/m2-3-sequence-api-service-boundary-plan.md`, `docs/phase-1-system-design-plan.md` §7 (Artifacts #11, #12, #15; Cổng D-G4, D-G5, D-G6-input).  
> **Trạng thái tiếp nhận (Entry State):** `M2.1 ACCEPTED FOR M2.2`, `M2.2 ACCEPTED FOR M2.3`, `M2.3 PLAN = APPROVED`, `M2.3 REMEDIATION = COMPLETE (DESIGN ONLY)`.  
> **Ranh giới nghiêm ngặt:** KHÔNG mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÔNG Prisma schema/migration/DB execution, KHÔNG RLS/MFA/Security implementation, KHÔNG UI components/CSS, KHÔNG sửa đổi trực tiếp tài liệu `docs/03-api-contract.md` (giữ nguyên READ-ONLY tuyệt đối, ghi nhận khoảng cách qua Gap Register), KHÔNG sáng chế Use Case mới (`UC-16/17/18`), KHÔNG sáng chế Behavioral Family mới (`BF-16`), GEC là dịch vụ AI stateless (`BF-14`, zero UC, transient text only, không sở hữu tiến trình học tập), KHÔNG thực thể ma (`no AssessmentSession entity exists`, `no ExerciseAttempt entity exists`), giữ nguyên 13 nhóm quyết định mở ở trạng thái `OPEN / CONFIGURABLE / PENDING VALIDATION`.

---

## 1. Executive Summary & Management Contract

Mốc M2.3 thiết lập toàn bộ **lớp tương tác logic (Interaction & Boundary Layer)** cho hệ thống Lingora trên nền tảng hành vi chuẩn tắc M2.2 (`M2.2 ACCEPTED FOR M2.3`), mô hình miền M2.1 (`M2.1 ACCEPTED FOR M2.2`), và các quy tắc kiến trúc chuẩn tắc (ADR-002, ADR-005, ADR-008, ADR-010, ADR-014).

M2.3 chuyển hóa 15 Use Cases (`UC-01`..`UC-15`) và 15 Behavioral Families (`BF-01`..`BF-15`) thành các biểu đồ trình tự tương tác chuẩn tắc (Artifact #11), đặc tả ranh giới hợp đồng API/dịch vụ (Artifact #12), và mô hình ranh giới dịch vụ & phân tầng trách nhiệm (Artifact #15).

```
+----------------------------------------------------------------------------------------------------+
|                                    M2.3 ARCHITECTURAL CONTRACT                                     |
+-----------------------------------+-----------------------------------+----------------------------+
| ARTIFACT #11: SEQUENCE SET        | ARTIFACT #12: API BOUNDARY        | ARTIFACT #15: SERVICE MODEL|
| - SEQ-01: Auth & Session          | - Surface Classification          | - 4-Layer Architectural Map|
| - SEQ-02: Learner Onboarding      |   (CURRENT / TARGET / FUTURE /    | - Single State Ownership   |
| - SEQ-03: Placement Assessment    |    COMPATIBILITY GAP)             | - Stateless AI Boundary    |
| - SEQ-04: Conditional Jump        | - Read vs Write Split             |   (transient diffs only)   |
| - SEQ-05: Lesson & Retry (D7)     | - Auth Context & Error Codes      | - Persistence Boundary     |
| - SEQ-06: SRS Review (D8)         | - Read-Only Gap Register vs       |   (PostgreSQL, RPC, RLS)   |
| - SEQ-07: Progress & Streak (D9)  |   docs/03-api-contract.md         | - Failure Containment      |
| - SEQ-08: Content Authoring (SoD) | - Zero Direct Edits to 03         | - Idempotency & Atomicity  |
| - SEQ-09: Admin & Security Audit  |                                   |                            |
| - SEQ-10: Free-Writing & GEC      |                                   |                            |
+-----------------------------------+-----------------------------------+----------------------------+
```

---

### 1.1. Six-Field Contract for M2.3 Artifacts

Theo chuẩn hóa của `docs/phase-1-system-design-plan.md` §5 và `plans/m2-3-sequence-api-service-boundary-plan.md` §4, cả 3 artifacts thành phần thuộc M2.3 tuân thủ nghiêm ngặt hợp đồng 6 trường:

| Artifact ID & Tên Artifact | 1. Purpose (Mục đích) | 2. Inputs (Đầu vào) | 3. Outputs (Đầu ra) | 4. Dependencies (Phụ thuộc) | 5. Trace (Truy vết) | 6. Validation Gate (Cổng kiểm định) |
|---|---|---|---|---|---|---|
| **#11 Sequence Diagrams / Sequence Set** | Xác định tương tác giữa các tác nhân và thành phần hệ thống, quản lý timeout, fallback, điểm lưu vết dữ liệu và kiểm toán (audit points) cho toàn bộ luồng hành vi M2.2. | Ràng buộc API/Bảo mật (read-only), mô hình trạng thái M2.1, hành vi M2.2, ranh giới `01`, hợp đồng `03`. | Tập 10 biểu đồ trình tự chuẩn tắc (`docs/plantuml/sequence-*m23.puml`) và thuyết minh kỹ thuật chi tiết từng luồng (§2). | Artifacts #2, #5, #10 (tham chiếu hạ tầng #15). | `UC-01`..`15`, `BF-01`..`15`, ADR-002/005/008/014, RPC `record_review`, GEC 8.0s timeout. | **D-G4** (bao phủ tương tác, UC-15 tương lai), **D-G5** (ranh giới kiến trúc, AI không sở hữu dữ liệu chính). |
| **#12 API Contract / Service Boundary** | Định nghĩa ranh giới hợp đồng giao tiếp hướng dịch vụ: ngữ nghĩa request/response, quyền sở hữu dữ liệu I/O, phân tách đọc/ghi, ngữ cảnh xác thực, ranh giới lỗi và phân tích khoảng cách đối chiếu `03`. | `docs/03-api-contract.md` (READ-ONLY), luồng hành vi M2.2, quyền sở hữu dữ liệu M2.1, nhu cầu giao tiếp SEQ-01..10. | Bảng phân tích ranh giới hợp đồng theo từng bề mặt (§3), sổ bộ kiểm kê khoảng cách API (§3.2). TUYỆT ĐỐI KHÔNG sửa file `03`, KHÔNG viết mã nguồn. | #11 Sequences, M2.1 Domain Model, `docs/03-api-contract.md`. | Luồng UC/BF, `P1-FR-002/003/005`, `01` Architecture. | **D-G4** (ngữ nghĩa phía client traceable), **D-G5** (không âm thầm thay đổi hợp đồng). |
| **#15 Service Interaction / Boundary Model** | Định nghĩa trách nhiệm dịch vụ (gồm phân tầng Presentation, BFF, Domain, Persistence), chiều phụ thuộc, quyền sở hữu trạng thái duy nhất, ranh giới AI stateless, ranh giới lưu trữ và cô lập sự cố. | `docs/01-architecture.md`, mô hình trạng thái M2.1, hành vi M2.2, nhu cầu tương tác #11. | Mô hình tương tác logic dịch vụ, biểu đồ phân tầng và ranh giới (`service-boundary-m23.puml`, `layer-responsibility-m23.puml`), bảng phân loại CURRENT/TARGET/FUTURE/COMPATIBILITY GAP (§4). | #11 Sequences, M2.1 Model, tham chiếu hạ nguồn #13/#16 (M2.4). | Hợp đồng API, UC/BF, RPC `record_review`, GEC stateless, Bảng Single-Owner (§5). | **D-G5** (ranh giới phân loại đầy đủ, AI phi sở hữu), **D-G6-input** (cung cấp bằng chứng đầu vào cho M2.4, không tuyên bố đóng D-G6). |

---

### 1.2. Strict Scope Boundaries & Invariants

Tài liệu thiết kế M2.3 tuân thủ nghiêm ngặt các ranh giới và bất biến kiến trúc sau:
1. **Design-Only Boundary:** Tuyệt đối không phát sinh mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), không thay đổi file `schema.prisma`, không tạo migration, không can thiệp cơ sở dữ liệu thực tế, không triển khai giao diện UI/CSS.
2. **Read-Only API Contract:** `docs/03-api-contract.md` được giữ nguyên vẹn 100% (byte-identical). Mọi khoảng cách, bề mặt API mới hoặc sự mở rộng được ghi nhận độc lập tại Sổ bộ khoảng cách M2.3 (API Gap Register §3.2).
3. **Stateless AI Boundary (ADR-014):** Dịch vụ AI (`lingora-ai`) là dịch vụ hỗ trợ hoàn toàn không lưu trạng thái (stateless), chỉ được triệu gọi thông qua Next.js Route Handler Proxy (`/api/ai/gec`), có timeout cố định 8.0 giây và cơ chế phục hồi (fallback) bắt buộc. Dịch vụ AI **sở hữu duy nhất kết quả tạm thời `corrected_text` và các span sửa lỗi phái sinh**; tuyệt đối **KHÔNG SỞ HỮU** bất kỳ trạng thái nào về tiến trình học tập (`LearningProgress`), mức độ thành thạo (`ConceptMastery`), hồ sơ kỹ năng (`SkillProfile`), điểm số, chuỗi ngày học (`streakCount`), hay trạng thái hoàn thành bài học.
4. **Zero New Identifiers:** Giữ nguyên vẹn danh mục 15 Use Cases (`UC-01`..`UC-15`) và 15 Behavioral Families (`BF-01`..`BF-15`). Không phát sinh `UC-16`, `UC-17`, `UC-18`, hay `BF-16`. Tính năng chữa lỗi ngữ pháp tự do thuộc `BF-14` / `P1-FR-007` (không có Use Case riêng). `UC-15` (B2B Cohorts) giữ vai trò ranh giới mở rộng trong tương lai (`OPTIONAL / FUTURE EXTENSION BOUNDARY`).
5. **No Ghost Entities:** Không tồn tại bất kỳ thực thể ma nào như `AssessmentSession` (HISTORICAL alias / không tồn tại entity AssessmentSession - no AssessmentSession entity exists), `Exam`, hay `QuestionBank`.
6. **Preservation of Open Decisions:** Toàn bộ 13 nhóm quyết định mở từ D3 §N và D4 §Q được bảo lưu nguyên trạng là `OPEN / CONFIGURABLE / PENDING VALIDATION`. Không đóng băng hoặc áp đặt bất kỳ ngưỡng chấm điểm, trọng số, thuật toán thích ứng hay chính sách phục hồi nào chưa được phê duyệt.

---

## 2. Artifact #11: Sequence Specifications (SEQ-01 to SEQ-10)

Tập 10 biểu đồ trình tự bao phủ toàn diện 15 Use Cases và 15 Behavioral Families. Tất cả các biểu đồ sử dụng tập tác nhân/đường đời (lifeline vocabulary) chuẩn tắc, khép kín và không sử dụng nhãn chung chung "System":
- **Primary & Staff Actors:** `Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`, `Operations Staff`.
- **Client & Orchestrator Lifelines:** `Web Learner` (Next.js Client & Route Handler/BFF proxy), `Web Admin` (Admin Portal & Route Handlers).
- **Backend & Persistence Lifelines:** `Supabase GoTrue Auth`, `Supabase PostgREST`, `Supabase RPC (record_review)`, `Supabase Storage`.
- **Stateless AI Lifeline:** `AI Server (FastAPI, stateless)`.
- **Audit Ledger:** `AuditLog (append-only store, TARGET)`.

```
+----------------------------------------------------------------------------------------------------+
|                                    ARTIFACT #11 SEQUENCE COVERAGE                                  |
+--------+------------------------------------+-----------------------+------------------------------+
| ID     | Sequence Flow Name                 | Canonical Source      | PlantUML Reference           |
+--------+------------------------------------+-----------------------+------------------------------+
| SEQ-01 | Authenticate & Manage Session      | UC-01 / BF-01         | sequence-auth-session-m23    |
| SEQ-02 | Learner Onboarding & Entry Choice  | UC-02 (+ UC-03 offer) | sequence-learner-onboarding  |
| SEQ-03 | Diagnostic Placement Assessment    | UC-03 / BF-08         | sequence-diagnostic-placement|
| SEQ-04 | Conditional Jump Assessment        | UC-04 / BF-11         | sequence-conditional-jump    |
| SEQ-05 | Lesson Exercise & Controlled Retry | UC-05 / BF-09/10      | sequence-lesson-exercise-retr|
| SEQ-06 | Spaced Repetition (SRS) Review     | UC-06 / BF-12         | sequence-srs-review-m23      |
| SEQ-07 | Progress & Daily Streak Tracking   | UC-07 / BF-13         | sequence-progress-streak-m23 |
| SEQ-08 | Content Authoring & Moderation     | UC-08/09/10, BF-03..07| sequence-authoring-moderation|
| SEQ-09 | Admin Operations & Security Audit  | UC-11..15, BF-15      | sequence-admin-ops-m23       |
| SEQ-10 | Scenario Free-Writing & GEC        | BF-14 / P1-FR-007     | sequence-gec-interaction-m23 |
+--------+------------------------------------+-----------------------+------------------------------+
```

---

### 2.1. SEQ-01: Authenticate & Manage Session

- **Mã quy trình:** `SEQ-01`
- **Mã Use Case & Behavioral Family:** `UC-01`, `BF-01`
- **Tác nhân chính (Primary Actor):** `Learner`, Tất cả các vai trò nội bộ (`Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`, `Operations Staff`).
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner` / `Web Admin`, `Supabase GoTrue Auth`, `Supabase PostgREST`, `AuditLog`.
- **Ranh giới Client/UI:** Trang xác thực `/login`, `/register`, thành phần phiên đăng nhập.
- **Điều phối viên ứng dụng (BFF / Application Orchestrator):** Route Handler / BFF endpoints: `/api/auth/callback` và `/api/auth/signout` [ILLUSTRATIVE / TARGET] xử lý trao đổi PKCE code, thiết lập session cookie bảo mật (`httpOnly`, `Secure`, `SameSite=Lax`).
- **Thành phần Dịch vụ Miền (Domain Service):** `AuthSessionService` điều phối tra cứu hồ sơ người dùng theo RLS.
- **Ranh giới Lưu trữ (Persistence Boundary):** Supabase GoTrue Auth (bảng nội bộ `auth.users`), `public.Profile` (PostgREST read), `public.AuditLog` (append-only ledger).
- **Dịch vụ Ngoài/AI:** Supabase GoTrue Auth. Tuyệt đối không tương tác với AI Server.
- **Ngữ nghĩa Request / Response:**
  - `POST /auth/v1/token?grant_type=password`: Request nhận `email`, `password`. Response trả về `access_token` (JWT ES256), `refresh_token`, thông tin user.
  - Server-side set cookie: Ghi cookie phiên làm việc `httpOnly` (ví dụ tên quy ước của Supabase: `sb-access-token` và `sb-refresh-token` [ILLUSTRATIVE / TARGET]).
- **Chủ sở hữu trạng thái có thẩm quyền (Authoritative State Owner):**
  - Session state: `Supabase GoTrue Auth`.
  - Profile attributes & roles: `public.Profile` (đọc qua PostgREST với RLS `auth.uid() = id`).
- **Người đọc vs Tác nhân phái sinh:** UI nhận `ProfileDTO` tối giản (không chứa secret, không chứa quyền trực tiếp client side).
- **Đường đi khi lỗi / Thất bại (Error / Failure Paths):**
  - Thông tin đăng nhập sai: GoTrue trả về `400 Bad Request` (`invalid_credentials`), UI hiển thị thông báo lỗi.
  - Tài khoản bị vô hiệu hóa / khóa (trạng thái tài khoản ứng viên `Profile.isActive = false` hoặc `Profile.status = SUSPENDED` [TARGET-CANDIDATE / OPEN DESIGN]): BFF từ chối tạo phiên, xóa cookie, trả về `403 Forbidden` (`AUTH_ACCOUNT_DISABLED` / `ACCOUNT_SUSPENDED`), phát sinh sự kiện `AuditLog(AUTH_LOCKED_ACCESS_ATTEMPT)`.
- **Tham chiếu biểu đồ:** [`sequence-auth-session-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-auth-session-m23.puml).

---

### 2.2. SEQ-02: Learner Onboarding & Entry Pathway Choice

- **Mã quy trình:** `SEQ-02`
- **Mã Use Case & Behavioral Family:** `UC-02`, liên kết đề xuất `UC-03`.
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`.
- **Ranh giới Client/UI:** Màn hình Onboarding `/onboarding/goals`, `/onboarding/entry-choice`.
- **Điều phối viên ứng dụng (BFF):** Route Handler / BFF endpoints: `/api/learner/profile` và `/api/learner/onboarding` [ILLUSTRATIVE / TARGET].
- **Thành phần Dịch vụ Miền:** `LearnerProfileService` thực hiện xác thực mục tiêu học tập, múi giờ và phân nhánh nhập môn.
- **Ranh giới Lưu trữ:** `public.Profile` (cập nhật `dailyGoalMin`, `timezone`; cài đặt nhắc nhở in-app là client-local theo ADR-006, KHÔNG lưu cột trên `Profile`), `public.LearnerProfile` (cập nhật `selfReportedLevel`; điểm xuất phát ban đầu là `starting_unit INT` trên `Profile` [TARGET-CANDIDATE DD-06 / OPEN DESIGN]).
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Ngữ nghĩa Request / Response:**
  - `PATCH /api/learner/profile` [ILLUSTRATIVE / TARGET]: Cập nhật cấu hình học tập cá nhân (`dailyGoalMin`, `timezone`). Cài đặt nhắc nhở học tập (in-app reminder toggle) được lưu trữ phía client (localStorage / push notification API) theo ADR-006, không thuộc trường của `Profile`.
  - Phân nhánh nhập môn (Entry Pathway):
    - **Nhánh A (Self-Report / Skip):** `POST /api/learner/entry/self-report` [ILLUSTRATIVE / TARGET] gửi mức tự khai (ví dụ `BEGINNER`). Hệ thống ghi nhận `LearnerProfile.selfReportedLevel = 'A1'`, trạng thái thẩm định là `UNVERIFIED`. Hệ thống thiết lập Starting Unit mặc định (Unit 1, ứng viên `starting_unit INT` [TARGET-CANDIDATE DD-06 / OPEN DESIGN]), kích hoạt trạng thái tiến trình khởi đầu (chuẩn tắc M2.2: `IN_PROGRESS` / mở khóa bài học [PROVISIONAL / TARGET access status]). **Bất biến tuyệt đối:** Nhánh A tạo ra **0 `AssessmentResult`, 0 `SkillProfile`, và 0 `verifiedProficiency`**.
    - **Nhánh B (Diagnostic Placement Offer):** Học viên chấp nhận đề xuất làm bài kiểm tra xếp lớp, hệ thống điều hướng sang quy trình `SEQ-03`.
- **Chủ sở hữu trạng thái có thẩm quyền:** `LearnerProfile` (thuộc thẩm quyền duy nhất của `Role.LEARNER`).
- **Đường đi khi lỗi / Thất bại:**
  - Múi giờ không hợp lệ (ngoài định dạng chuẩn IANA tz identifier): Trả về `400 Bad Request` (`INVALID_INPUT`).
  - Mục tiêu học tập ngoài dải hợp lệ ($< 5$ phút hoặc $> 120$ phút): Trả về `422 Unprocessable Entity` (`GOAL_OUT_OF_RANGE`) hoặc `400 Bad Request` (`INVALID_INPUT`). Dải quy định chuẩn tắc nghiêm ngặt là `[5..120]` phút.
- **Tham chiếu biểu đồ:** [`sequence-learner-onboarding-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-learner-onboarding-m23.puml).

---

### 2.3. SEQ-03: Diagnostic Placement Assessment

- **Mã quy trình:** `SEQ-03`
- **Mã Use Case & Behavioral Family:** `UC-03`, `BF-08`.
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`, `PlacementService`.
- **Ranh giới Client/UI:** Giao diện thi chẩn đoán `/assessment/diagnostic`, trình hiển thị bài thi thích ứng 2 giai đoạn.
- **Điều phối viên ứng dụng (BFF):** Route Handler `/api/assessment/placement` (quản lý phiên làm bài và tổng hợp nộp bài).
- **Thành phần Dịch vụ Miền:** `PlacementService` (thuộc Common Assessment Engine phía server) điều phối thuật toán thích ứng 2 giai đoạn (Giai đoạn Định tuyến: [PROPOSED ~10–12 items, PENDING VALIDATION / Quyết định D-G6]; Tổng cộng: [PROPOSED ~25–30 items, PENDING VALIDATION]), đánh giá 4 chiều năng lực (Từ vựng, Ngữ pháp, Nghe hiểu, Đọc hiểu), áp dụng bảng quy đổi chuẩn tắc English A1 Mapping A.
- **Ranh giới Lưu trữ:** `public.AssessmentResult` (bản ghi bất biến lưu trữ `dimensions`, `rawScores`, `stageData`, `languageConfig`, `completedAt`; TUYỆT ĐỐI KHÔNG có cột điểm `score` hoặc `passed` được lưu trữ), `public.SkillProfile` (lưu trữ cấp độ năng lực `vocabularyLevel`, `grammarLevel`, `readingLevel`, `listeningLevel`, `radarData`, `sourceAssessmentResultId`; quyền sở hữu dữ liệu thuộc về miền `LearnerProfile`), `public.LearnerProfile` (`verifiedProficiency = 'VERIFIED'`; điểm xuất phát là ứng viên `starting_unit INT` trên `Profile` [TARGET-CANDIDATE DD-06 / OPEN DESIGN]), `public.LearningProgress` (mở khóa Starting Unit tương ứng).
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Ngữ nghĩa Request / Response:**
  - `POST /api/assessment/placement/submit`: Nộp toàn bộ câu trả lời bài kiểm tra.
  - Quy tắc ánh xạ Mapping A (Thang điểm thô 0–30):
    - $0 \le \text{Raw} \le 7$: Xuất phát tại Unit 1.
    - $8 \le \text{Raw} \le 12$: Xuất phát tại Unit 2 (Unit 1 đánh dấu `SKIPPED_BY_JUMP`).
    - $13 \le \text{Raw} \le 17$: Xuất phát tại Unit 3 (Unit 1–2 `SKIPPED_BY_JUMP`).
    - $18 \le \text{Raw} \le 22$: Xuất phát tại Unit 4 (Unit 1–3 `SKIPPED_BY_JUMP`).
    - $23 \le \text{Raw} \le 26$: Xuất phát tại Unit 5 (Unit 1–4 `SKIPPED_BY_JUMP`).
    - $27 \le \text{Raw} \le 30$: Xuất phát tại Unit 6 (Unit 1–5 `SKIPPED_BY_JUMP`).
  - Trả về: `{ startingUnit, rawScores: { total, vocab, grammar, reading, listening }, skillProfile: { vocabularyLevel, grammarLevel, readingLevel, listeningLevel }, assessmentResultId, verifiedProficiency: 'VERIFIED' }`.
- **Chủ sở hữu trạng thái có thẩm quyền:**
  - `AssessmentResult`: `PlacementService` (ghi bất biến). Thi lại (retake) tạo bản ghi mới hoàn toàn.
  - `SkillProfile`: Do `PlacementService` tính toán và phái sinh từ `AssessmentResult`, nhưng quyền sở hữu dữ liệu thuộc về miền `LearnerProfile` (Learner domain).
  - `LearnerProfile`: `PlacementService` cập nhật `verifiedProficiency = 'VERIFIED'`.
- **Đường đi khi lỗi / Thất bại:**
  - Bỏ dở bài thi giữa chừng: Không cập nhật `SkillProfile`, không mở khóa Starting Unit nâng cao, giữ nguyên mức hiện tại.
  - Lỗi mạng khi nộp bài: Giao diện lưu bộ đệm câu trả lời phía client và thực hiện thử lại (retry submit).
- **Tham chiếu biểu đồ:** [`sequence-diagnostic-placement-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-diagnostic-placement-m23.puml).

---

### 2.4. SEQ-04: Conditional Jump Assessment

- **Mã quy trình:** `SEQ-04`
- **Mã Use Case & Behavioral Family:** `UC-04`, `BF-11`.
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`, `JumpAssessmentService`.
- **Ranh giới Client/UI:** Màn hình duyệt lộ trình học `/learn/path`, hộp thoại xác nhận vượt cấp nhảy bài.
- **Điều phối viên ứng dụng (BFF):** Route Handler `/api/assessment/jump`.
- **Thành phần Dịch vụ Miền:** `JumpAssessmentService` kiểm tra quy tắc khóa thời gian chờ 24 giờ (24h cooldown rule; cơ chế lưu trữ OPEN DESIGN, được đánh giá từ lịch sử `AssessmentResult` hoàn thành, KHÔNG phải cột trên `LearnerProfile`), tạo đề bài thi vượt cấp có giới hạn phạm vi (20 câu cho Unit đơn, 25–30 câu cho nhóm 2–3 Units, 40 câu cho bài nhảy toàn cấp), và chấm điểm chuẩn xác.
- **Ranh giới Lưu trữ:** `public.AssessmentResult` (`deliveryMode = 'JUMP'`, `rawScores`, `dimensions`, `stageData`, `languageConfig`, `completedAt`; không có cột `score` hoặc `passed` được lưu trữ), `public.LearningProgress` (cập nhật trạng thái các Unit/Lesson được vượt qua).
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Ngữ nghĩa Request / Response:**
  - `GET /api/assessment/jump/eligibility?targetUnitId=...`: Kiểm tra điều kiện vượt cấp. Trả về trạng thái hợp lệ hoặc thời gian còn lại của khóa chờ 24h.
  - `POST /api/assessment/jump/submit`: Gửi bài làm kiểm tra nhảy bài.
  - Quy tắc phân nhánh kết quả:
    - **Đạt ($\text{Score} \ge 95\%$):** Các Unit và Lesson nằm trong phạm vi nhảy bài được cập nhật trạng thái `SKIPPED_BY_JUMP` với cờ xuất xứ `by_jump = true`. Unit mục tiêu chuyển trạng thái `IN_PROGRESS`. **Bất biến tuyệt đối:** Không bao giờ gán nhãn `COMPLETED_BY_JUMP`; không cấp chứng chỉ CEFR.
    - **Không đạt ($\text{Score} < 95\%$):** Ghi nhận bằng chứng `AssessmentResult` không đạt (`completedAt = now()`). Kích hoạt khóa thời gian chờ 24 giờ (quy tắc 24h cooldown rule; cơ chế lưu trữ OPEN DESIGN - không tồn tại cột `lastJumpFailedAt` trên `LearnerProfile`). Không thay đổi trạng thái tiến trình học tập của bất kỳ bài học nào.
- **Chủ sở hữu trạng thái có thẩm quyền:** `JumpAssessmentService` (sở hữu độc quyền việc ghi nhãn `SKIPPED_BY_JUMP` và đánh giá quy tắc khóa chờ).
- **Đường đi khi lỗi / Thất bại:**
  - Cố tình nộp bài khi đang trong thời gian khóa 24h: BFF từ chối xử lý, trả về `429 Too Many Requests` hoặc `409 Conflict` (`JUMP_COOLDOWN_ACTIVE`).
- **Tham chiếu biểu đồ:** [`sequence-conditional-jump-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-conditional-jump-m23.puml).

---

### 2.5. SEQ-05: Lesson Exercise Execution & Controlled Retry

- **Mã quy trình:** `SEQ-05`
- **Mã Use Case & Behavioral Family:** `UC-05`, `BF-09` (Learning Lesson) và `BF-10` (Controlled Retry).
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`, `Supabase Storage`, `LessonExecutionService`.
- **Ranh giới Client/UI:** Màn hình làm bài học `/learn/lesson/[id]`, trình thực thi bài tập tương tác (hỗ trợ 5 loại bài tập chuẩn tắc: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`).
- **Điều phối viên ứng dụng (BFF):** Route Handlers / BFF endpoints: `/api/lessons/{lessonId}/submit` và `/api/lessons/{lessonId}/complete` [ILLUSTRATIVE / TARGET].
- **Thành phần Dịch vụ Miền:** `LessonExecutionService` quản lý hạn ngạch làm lại theo Chính sách D7 (`allowance = max(1, floor(N * 0.10))`), tính điểm công nhận 70% đối với câu làm lại đúng, phân tuyến bằng chứng khái niệm tới `KnowledgeGap` / `ConceptMastery`.
- **Ranh giới Lưu trữ:** Dữ liệu lần thử bài tập tồn tại tạm thời ở cấp độ phiên/yêu cầu bộ nhớ (transient request/session-level data; TUYỆT ĐỐI KHÔNG có thực thể cơ sở dữ liệu `ExerciseAttempt`); `public.UserProgress` (cập nhật trạng thái `COMPLETED`), `public.ConceptMastery`, `public.KnowledgeGap`.
- **Dịch vụ Ngoài/AI:**
  - Supabase Storage: Truy xuất tệp âm thanh bài nghe qua ranh giới lưu trữ trực tiếp Supabase Storage bucket có RLS bảo vệ (`vocabulary/{vocabId}/{filename}`), tuân thủ PA2 (KHÔNG sinh signed-URL thời gian chạy).
  - Dịch vụ AI: Không tham gia trong luồng bài học chuẩn tắc (ngoại trừ luồng riêng biệt GEC tự do tại SEQ-10).
- **Ngữ nghĩa Request / Response:**
  - `POST /api/lessons/{lessonId}/exercises/{exerciseId}/answer` [ILLUSTRATIVE / TARGET]: Gửi câu trả lời của một bài tập. Trả về tính đúng sai tức thì và giải thích sư phạm từ học liệu tĩnh.
  - Trường hợp làm sai: Nếu còn hạn mức làm lại (`allowance > 0`), cho phép làm lại ngay; câu làm lại đúng được ghi nhận tối đa 70% giá trị điểm. Không tồn tại ngưỡng sàn 80%.
  - `POST /api/lessons/{lessonId}/complete` [ILLUSTRATIVE / TARGET]: Hoàn thành toàn bộ bài tập trong bài. Trạng thái bài học chuyển thành `COMPLETED`. Thẩm quyền công nhận hoàn thành thuộc về `UC-05` / `BF-10`.
- **Chủ sở hữu trạng thái có thẩm quyền:**
  - `UserProgress` (Lesson completion): `LessonExecutionService`.
  - `ConceptMastery` / `KnowledgeGap`: Bộ đánh giá sự thành thạo khái niệm (Concept Mastery Evaluator).
- **Đường đi khi lỗi / Thất bại:**
  - Không tải được tệp âm thanh bài nghe từ Storage: Giao diện hiển thị cảnh báo lỗi ngoại lệ tài nguyên, cung cấp tùy chọn bỏ qua bài tập nghe mà không phạt điểm học viên.
- **Tham chiếu biểu đồ:** [`sequence-lesson-exercise-retry-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-lesson-exercise-retry-m23.puml).

---

### 2.6. SEQ-06: Spaced Repetition (SRS) Review Flow

- **Mã quy trình:** `SEQ-06`
- **Mã Use Case & Behavioral Family:** `UC-06`, `BF-12`.
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`, `Supabase RPC (record_review)`.
- **Ranh giới Client/UI:** Màn hình ôn tập từ vựng `/review/srs`, thẻ ghi nhớ tương tác (flashcards).
- **Điều phối viên ứng dụng (BFF):** Route Handler `/api/srs/review`.
- **Thành phần Dịch vụ Miền:** `SrsScheduler` thực thi chu kỳ ôn tập ngắt quãng tất định theo Chính sách B (`intervals = [1, 3, 7, 14, 30]` ngày). Thất bại đưa chu kỳ về lại bước 1 (1 ngày).
- **Ranh giới Lưu trữ:** Hàm RPC nguyên tử chuẩn tắc `record_review(p_srs_card_id UUID, p_is_correct BOOLEAN, p_recall_probability DOUBLE PRECISION, p_recommended_interval_days DOUBLE PRECISION)`. Giao dịch nguyên tử cập nhật `public.user_vocab_srs` (`interval_days`, `next_review_at`, `last_reviewed_at`, `review_count`), thêm bản ghi `public.review_logs` (`id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`; TUYỆT ĐỐI KHÔNG có cột `rating`; `ReviewLog` là nhật ký lịch sử SRS, KHÔNG phải bảng kiểm toán hệ thống `audit_logs`).
- **Dịch vụ Ngoài/AI:** Hoàn toàn không triệu gọi AI Server (dịch vụ AI cũ `/v1/srs/schedule` thuộc diện COMPATIBILITY GAP và không được phép can thiệp vào quy trình chuẩn).
- **Ngữ nghĩa Request / Response:**
  - `GET /api/srs/due`: Truy vấn danh sách từ vựng đến hạn ôn tập (`next_review_at <= now()`, ví dụ phân trang `LIMIT 20 [cấu hình theo khối lượng]`).
  - `POST /api/srs/review`: Gửi kết quả ôn tập (`srsCardId`, `isCorrect: boolean`). TUYỆT ĐỐI KHÔNG sử dụng thang điểm AGAIN/HARD/GOOD/EASY trong hàm RPC.
  - Gọi RPC `record_review`: Hàm SQL chạy với quyền `SECURITY DEFINER`, tự động giải mã danh tính qua `auth.uid()`, xác thực `auth.uid() = user_vocab_srs.user_id`, cập nhật `interval_days`, `review_count`, `next_review_at`, chèn bản ghi nhật ký `review_logs`.
- **Chủ sở hữu trạng thái có thẩm quyền:** `Supabase RPC (record_review)` và cơ chế lưu trữ quan hệ PostgreSQL.
- **Đường đi khi lỗi / Thất bại:**
  - Gọi RPC với thẻ không thuộc sở hữu của người dùng hiện tại: RLS / RPC kiểm tra `user_id = auth.uid()` và trả về lỗi từ chối quyền truy cập (`403 Forbidden`).
- **Tham chiếu biểu đồ:** [`sequence-srs-review-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-srs-review-m23.puml).

---

### 2.7. SEQ-07: Learner Progress & Daily Streak Evaluation

- **Mã quy trình:** `SEQ-07`
- **Mã Use Case & Behavioral Family:** `UC-07`, `BF-13`.
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, `Supabase PostgREST`, `StreakEvaluatorService`.
- **Ranh giới Client/UI:** Bảng điều khiển học viên `/dashboard`, chỉ số hiển thị chuỗi ngày học liên tục (Streak Counter).
- **Điều phối viên ứng dụng (BFF):** Route Handler `/api/learner/progress`.
- **Thành phần Dịch vụ Miền:** `StreakEvaluatorService` thực hiện đánh giá lười (lazy evaluation) mỗi khi phát sinh hoạt động học tập đủ điều kiện (hoàn thành bài học, hoàn thành bài ôn tập SRS, nộp bài kiểm tra).
- **Ranh giới Lưu trữ:** `public.Profile` (`streak_count`, `last_qualifying_activity_date`), `public.LearningProgress`.
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Ngữ nghĩa Request / Response:**
  - Đánh giá chuỗi theo ranh giới ngày lịch múi giờ `Asia/Ho_Chi_Minh` (`last_qualifying_activity_date`):
    - Hoạt động trùng ngày với lần gần nhất ($\Delta \text{days} = 0$): Giữ nguyên `streak_count`.
    - Hoạt động vào ngày kế tiếp liên tục ($\Delta \text{days} = 1$): Tăng `streak_count = streak_count + 1`.
    - Bị gián đoạn ngày ($\Delta \text{days} > 1$): Đặt lại chuỗi về 1 (`streak_count = 1`). Không bao giờ về 0 khi có hoạt động mới.
  - Các cơ chế đóng băng chuỗi (Streak Freeze) và hồi sinh chuỗi (Streak Recovery Power-Up) được xác định chính thức là **`DEFERRED`**; không tồn tại logic đóng băng chuỗi trong hệ thống Core.
- **Chủ sở hữu trạng thái có thẩm quyền:** `StreakEvaluatorService` (tích hợp trong giao dịch hoàn thành hoạt động hoặc RPC).
- **Đường đi khi lỗi / Thất bại:**
  - Lỗi múi giờ client gửi lên: Hệ thống luôn dùng múi giờ chuẩn lưu trong `Profile.timezone` (mặc định `Asia/Ho_Chi_Minh`) để tính toán ranh giới lịch.
- **Tham chiếu biểu đồ:** [`sequence-progress-streak-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-progress-streak-m23.puml).

---

### 2.8. SEQ-08: Content Authoring, Moderation & Publication Flow

- **Mã quy trình:** `SEQ-08`
- **Mã Use Case & Behavioral Family:** `UC-08`, `UC-09`, `UC-10`, `BF-02` đến `BF-07`.
- **Tác nhân chính (Primary Actor):** `Lesson Creator`, `Moderator`, `Organizational Manager` (`ORG_MANAGER`), `Administrator`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Admin`, `Supabase PostgREST` (Prisma/Admin Boundary), `AuditLog`.
- **Ranh giới Client/UI:** Cổng quản trị tác nghiệp `/admin/curriculum`, biên tập bài học `/admin/lessons/{lessonId}/edit`, duyệt nội dung `/admin/review`.
- **Điều phối viên ứng dụng (BFF):** Route Handlers / BFF endpoints: `/api/admin/lessons/*` [ILLUSTRATIVE / TARGET] (đường dẫn minh họa kiến trúc Route Handler / BFF).
- **Thành phần Dịch vụ Miền:** `ContentLifecycleService` thực thi nghiêm ngặt nguyên tắc phân tách trách nhiệm (Separation of Duties - SoD):
  - **Creator:** Tạo bản nháp (`DRAFT`), biên tập nội dung, gửi kiểm duyệt (`IN_REVIEW`). Trường tóm tắt nhiệm vụ `assignmentBrief` [TARGET-CANDIDATE DD-04 / OPEN DESIGN]. Tuyệt đối không thể tự phê duyệt bài của mình.
  - **Moderator:** Xem xét bài học, phê duyệt (`APPROVED`) hoặc yêu cầu chỉnh sửa (`CHANGES_REQUESTED` kèm `reviewNotes` [TARGET-CANDIDATE DD-04 / OPEN DESIGN]). **Chốt chặn SoD bắt buộc:** Hệ thống kiểm tra `auth.uid() != Lesson.creatorId`; nếu bằng nhau, từ chối ngay lập tức với mã `403 Forbidden` (`SOD_VIOLATION_SELF_REVIEW`). Moderator không thể trực tiếp xuất bản bài học.
  - **Organizational Manager (`ORG_MANAGER`):** Người có thẩm quyền duy nhất thực hiện xuất bản (`PUBLISHED`) hàng loạt bài học đã được `APPROVED`. Áp dụng quy tắc hiển thị: Một `Unit` chỉ hiển thị trên danh mục người học khi và chỉ khi **4/4 bài học** trực thuộc đạt trạng thái `PUBLISHED`.
  - **Administrator:** Có thẩm quyền xuất bản khẩn cấp (Emergency Publish), nhưng **chỉ được phép thực hiện trên bài học đã đạt trạng thái `APPROVED`**, bắt buộc nhập lý do nghiệp vụ và hệ thống tự động ghi nhật ký kiểm toán không thể xóa (`AuditLog`).
  - **Bản sửa đổi nội dung đã lưu trữ (`ARCHIVED`):** Trạng thái `ARCHIVED` là đóng băng vĩnh viễn; mọi sửa đổi bắt buộc sử dụng cơ chế Clone-to-Draft v2 tạo bản ghi mới kế thừa qua trường `supersedesId` [TARGET-CANDIDATE DD-02 / OPEN DESIGN].
- **Ranh giới Lưu trữ:** `public.Lesson`, `public.Exercise`, `public.Unit`, `public.AuditLog`.
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Chủ sở hữu trạng thái có thẩm quyền:** `ContentLifecycleService` (chủ sở hữu duy nhất vòng đời nội dung).
- **Đường đi khi lỗi / Thất bại:**
  - Vi phạm SoD (ví dụ Creator cố tình tự duyệt bài): BFF từ chối `403 Forbidden` (`SOD_VIOLATION_SELF_REVIEW`).
  - Xuất bản khẩn cấp bài học đang ở trạng thái `DRAFT` hoặc `IN_REVIEW`: Từ chối `400 Bad Request` (`INVALID_STATE_TRANSITION`).
- **Tham chiếu biểu đồ:** [`sequence-authoring-moderation-publish-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-authoring-moderation-publish-m23.puml).

---

### 2.9. SEQ-09: Administration, Analytics, Security Audit & Operations

- **Mã quy trình:** `SEQ-09`
- **Mã Use Case & Behavioral Family:** `UC-11`, `UC-12`, `UC-13`, `UC-14`, `UC-15` (Boundary-only), `BF-15`.
- **Tác nhân chính (Primary Actor):** `Administrator`, `Operations Staff`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Admin` (lingora-admin Web Client, không có Desktop), `Supabase PostgREST`, `AuditLog`.
- **Ranh giới Client/UI:** Cổng quản trị phân quyền `/admin/users`, báo cáo `/admin/reports`, nhật ký kiểm toán `/admin/audit`, tiếp nhận hỗ trợ `/admin/tickets`.
- **Điều phối viên ứng dụng (BFF):** Route Handlers `/api/admin/*` (đường dẫn minh họa kiến trúc Next.js App Router / BFF).
- **Thành phần Dịch vụ Miền:** `AdminService`, `AuditLogService`, `SupportTicketService`.
- **Ranh giới Lưu trữ:** `public.Profile` (quản lý vai trò `Role`), `public.AuditLog` (chỉ đọc, bất biến append-only), `public.SupportTicket`.
- **Dịch vụ Ngoài/AI:** Không tương tác.
- **Ngữ nghĩa Request / Response:**
  - Quản lý tài khoản và phân quyền (`UC-11`): Gán vai trò mới (`MODERATOR`, `ORG_MANAGER`, ...) phát sinh bản ghi `AuditLog` bắt buộc.
  - Báo cáo phân tích hệ thống (`UC-12`): Đọc dữ liệu tổng hợp không làm biến đổi trạng thái.
  - Nhật ký kiểm toán bảo mật (`UC-13`): Cung cấp giao diện truy vấn bộ lọc thời gian/tác nhân/loại hành động trên kho nhật ký bất biến (ví dụ `LIMIT 50 [cấu hình theo khối lượng]`).
  - Xử lý phiếu hỗ trợ kỹ thuật (`UC-14`, `BF-15`): Tiếp nhận, phân loại và chuyển trạng thái phiếu hỗ trợ.
  - Mở rộng tổ chức / B2B (`UC-15`): Thể hiện dưới dạng ranh giới mở rộng tùy chọn (`OPTIONAL / FUTURE EXTENSION BOUNDARY`), không phụ thuộc trong hệ thống Core.
- **Chủ sở hữu trạng thái có thẩm quyền:**
  - `Profile.role`: `AdminService` (phát sinh kiểm toán).
  - `AuditLog`: Thành phần phát sinh sự kiện của từng phân hệ (hệ thống chỉ append, cấm cập nhật/xóa).
- **Đường đi khi lỗi / Thất bại:**
  - Người dùng không có vai trò `ADMIN` cố gắng truy cập: Trả về `403 Forbidden` (`UNAUTHORIZED`).
- **Tham chiếu biểu đồ:** [`sequence-admin-ops-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-admin-ops-m23.puml).

---

### 2.10. SEQ-10: Scenario Free-Writing with GEC AI Interaction

- **Mã quy trình:** `SEQ-10`
- **Mã Behavioral Family & Yêu cầu:** `BF-14`, `MVP-18`, `P1-FR-007` (TUYỆT ĐỐI KHÔNG sáng chế Use Case mới).
- **Tác nhân chính (Primary Actor):** `Learner`.
- **Tác nhân/Thành phần hỗ trợ:** `Web Learner`, Route Handler Proxy (`/api/ai/gec` [ILLUSTRATIVE / TARGET]), `AI Server (FastAPI, stateless)`.
- **Ranh giới Client/UI:** Màn hình luyện viết tự do theo tình huống `/practice/writing/{scenarioId}`.
- **Điều phối viên ứng dụng (BFF / Route Handler Proxy):** Route Handler `/api/ai/gec` [ILLUSTRATIVE / TARGET] tiếp nhận văn bản, kiểm tra xác thực người dùng, giải nén session JWT, đính kèm `request_id` [M2.3 DESIGN ADDITION / OPTIONAL telemetry], thiết lập cơ chế giới hạn thời gian chờ cứng **8.0 giây (Hard Timeout)**, và điều phối cuộc gọi tới `POST /v1/gec/correct`.
- **Thành phần Dịch vụ Miền:** Dịch vụ AI hoàn toàn **stateless** (ADR-014).
- **Ranh giới Lưu trữ:** **TUYỆT ĐỐI KHÔNG TRUY CẬP CƠ SỞ DỮ LIỆU**. Kết quả sửa lỗi và các span căn chỉnh từ ngữ (`edits`) hoàn toàn mang tính chất tạm thời (transient).
- **Dịch vụ Ngoài/AI:** `AI Server (FastAPI)` chạy mô hình sửa lỗi ngữ pháp.
- **Ngữ nghĩa Request / Response:**
  - Client gửi tới Route Handler: `POST /api/ai/gec` [ILLUSTRATIVE / TARGET] kèm `{ text, language, scenario_id }` (chứng thực qua httpOnly Session Cookie).
  - Route Handler proxy tới AI Server: `POST /v1/gec/correct` kèm Header `Authorization: Bearer <user_jwt_from_session>` và body `{ text, language, request_id }`.
  - AI Server xử lý và trả về (ví dụ phản hồi minh họa theo hợp đồng `docs/03-api-contract.md` §5.1): `{ corrected_text: "...", edits: [{ start, end, replacement, error_type, explanation }], model_version: "t5-small-gec-v1", is_mock: <runtime/config-derived boolean, e.g. false>, latency_ms: <runtime-measured integer, e.g. 120> }`. Các trường telemetry mang giá trị đo lường lúc runtime, không phải hằng số hệ thống cố định.
  - Route Handler nhận kết quả và chuyển tiếp về UI hiển thị đối chiếu trực quan cho học viên.
- **Chủ sở hữu trạng thái có thẩm quyền:**
  - AI Server **chỉ sở hữu duy nhất chuỗi văn bản tạm thời `corrected_text` và các span sửa lỗi phái sinh**.
  - AI Server **tuyệt đối KHÔNG SỞ HỮU**: `LearningProgress`, `ConceptMastery`, `SkillProfile`, `streak_count`, hay trạng thái hoàn thành bài học.
- **Đường đi khi lỗi & Cơ chế Phục hồi Bắt buộc (Failure & Recoverable Fallback):**
  - **Hết thời gian chờ (Timeout > 8.0s):** Route Handler chủ động ngắt kết nối (`AbortController`), trả về mã `504 Gateway Timeout` (`DEPENDENCY_TIMEOUT`), UI kích hoạt chế độ phục hồi an toàn: giữ nguyên văn bản của học viên, thông báo dịch vụ AI đang bận và cho phép tiếp tục học tập mà không làm gián đoạn bài học.
  - **Mô hình AI bị lỗi hoặc quá tải (`503 Model Unavailable`):** Trả về mã lỗi `MODEL_UNAVAILABLE`, UI kích hoạt fallback tương tự.
  - **Văn bản vượt quá độ dài quy định (500 ký tự):** Trả về `413 Payload Too Large` (`TEXT_TOO_LONG`) theo chuẩn `docs/03-api-contract.md`.
- **Tham chiếu biểu đồ:** [`sequence-gec-interaction-m23.puml`](file:///d:/school/btl/docs/plantuml/sequence-gec-interaction-m23.puml).

---

## 3. Artifact #12: API Contract / Service Boundary & Gap Register

Artifact #12 xác lập ranh giới giao tiếp từ góc độ hợp đồng tiêu thụ dịch vụ (Consumer & Surface Facing Contract). 

> **Quy tắc bất biến:** Tài liệu `docs/03-api-contract.md` được bảo lưu nguyên trạng 100% (READ-ONLY, không chỉnh sửa trực tiếp bất kỳ byte nào). Mọi phân tích bổ sung, bề mặt dịch vụ mới, và khoảng cách kỹ thuật được hệ thống hóa tại Sổ bộ khoảng cách API (API Gap Register) dưới đây.

---

### 3.1. Surface-by-Surface Contract Analysis

Hệ thống phân định 10 bề mặt giao tiếp cốt lõi với trạng thái phân loại chuẩn tắc:

| Bề mặt Giao tiếp | Trạng thái | Ngữ nghĩa Giao tiếp (I/O) | Phân tách Đọc / Ghi | Ngữ cảnh Xác thực (Auth Context) | Mã lỗi Giao tiếp (Error Codes: '03' hoặc M2.3 Design Addition) |
|---|---|---|---|---|---|
| **1. AI Health & Model Info** (`GET /health/*`, `GET /v1/model/info`) | `CURRENT` | Giám sát trạng thái dịch vụ AI, phiên bản mô hình loaded. Output: status, uptime, model_metadata. | Read-only | Không yêu cầu (Nội bộ / Private Subnet) | `MODEL_UNAVAILABLE` |
| **2. AI GEC Target** (`POST /v1/gec/correct`) | `TARGET` | Sửa lỗi câu tự do, trả về diffs/edits. Input: `text`, `language`. Output: `corrected_text`, `edits`, `model_version`, `is_mock`, `latency_ms`. | Read-only (Stateless Compute) | Route Handler Proxy (chứng thực qua User Bearer JWT từ phiên) | `INVALID_INPUT (400)`, `TEXT_TOO_LONG (413)`, `LANG_NOT_SUPPORTED (422)`, `MODEL_UNAVAILABLE (503)` |
| **3. AI Legacy Surface** (`POST /v1/srs/schedule`, `/v1/chat/*`) | `COMPATIBILITY GAP` | Các endpoint thử nghiệm lịch sử. Giữ nguyên ranh giới, không dùng cho luồng Core mới; chờ deprecation an toàn. | Read/Write | Legacy token | `SCENARIO_NOT_FOUND`, `INVALID_INPUT` |
| **4. Web Route Handler Proxy** (`POST /api/ai/gec` [ILLUSTRATIVE / TARGET]) | `TARGET` | Điểm tiếp nhận yêu cầu GEC từ trình duyệt, kiểm tra session, giới hạn 8.0s timeout, kích hoạt fallback. | Proxying (Transient) | Session Cookie (`Learner`) | `UNAUTHORIZED (401)`, `TEXT_TOO_LONG (413)`, `RATE_LIMITED (429)`, `DEPENDENCY_TIMEOUT (504)`, `INVALID_INPUT (400)` |
| **5. Supabase GoTrue Auth** (`/auth/v1/*`) | `CURRENT` | Đăng ký, đăng nhập email/mật khẩu, refresh token, cấp phát JWT (ES256). | Read / Write | Public & Token refresh | `invalid_credentials`, `user_already_exists` |
| **6. Supabase PostgREST Reads** (`/rest/v1/*`) | `CURRENT` | Đọc danh mục khóa học, bài học đã `PUBLISHED`, đọc dữ liệu của chính học viên theo RLS. | Read-only | Bearer JWT (`auth.uid()`) | `401 Unauthorized`, `403 Forbidden` (RLS filter) |
| **7. Supabase RPC `record_review`** | `CURRENT` | Ghi nhận ôn tập từ vựng nguyên tử: nhận `p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days`, cập nhật `user_vocab_srs`, chèn nhật ký `review_logs`. | Atomic Mutation | Session JWT (`auth.uid()` bắt buộc) | `403 Forbidden` (thẻ không thuộc sở hữu), `OPEN / PENDING` |
| **8. Supabase Storage API** (`/storage/v1/*`) | `CURRENT` | Truy xuất tệp âm thanh bài nghe (`audio_url`), avatar người dùng. Ranh giới lưu trữ trực tiếp Supabase Storage bucket có RLS bảo vệ (`vocabulary/{vocabId}/{filename}`) tuân thủ PA2. | Read / Write | Public read (audio), User-scoped write | `RESOURCE_NOT_FOUND`, `UNAUTHORIZED` |
| **9. Admin / Prisma Mutation Boundary** | `TARGET` | Tác nghiệp nội dung, phân công brief, duyệt bài, xuất bản theo SoD (chặn Creator tự duyệt), quản lý vai trò người dùng. | Write / Read | Session Cookie (`Staff Roles` + SoD Check) | `SOD_VIOLATION_SELF_REVIEW (403)`, `INVALID_STATE_TRANSITION (400)`, `UNAUTHORIZED (401)` |
| **10. Application Services Boundary** (Placement / Jump) | `TARGET` | Tiếp nhận bài thi xếp lớp / vượt cấp, tính toán điểm, cập nhật `AssessmentResult` và `SkillProfile`. | Write / Read | Session Cookie (`Learner`) | `JUMP_COOLDOWN_ACTIVE (429)`, `ASSESSMENT_ABORTED (400)`, `INVALID_INPUT (400)` |

---

### 3.2. API Gap Register vs `docs/03-api-contract.md`

Bảng đối chiếu ghi nhận khoảng cách kỹ thuật giữa tài liệu hợp đồng API hiện hành (`03`) và kiến trúc thiết kế M2.3:

| Mã Khoảng cách | Bề mặt / Endpoint | Hiện trạng trong `docs/03-api-contract.md` | Đặc tả Thiết kế trong M2.3 | Bản chất Khoảng cách & Đánh giá Tác động | Hướng xử lý / Lộ trình chuẩn hóa |
|---|---|---|---|---|---|
| **GAP-01** | `/v1/gec/correct` | Trạng thái `TARGET` (mô tả dạng phác thảo tại Tier 2). | Chuẩn hóa tại `SEQ-10`: Input `{ text, language, request_id }`, timeout 8.0s, fallback an toàn, không ghi DB. | Không xung đột. M2.3 cung cấp chi tiết điều phối tương tác cho đặc tả đã có trong `03`. | Triển khai runtime trong mốc phù hợp; cập nhật tài liệu `03` theo quy trình phiên bản khi phê duyệt. |
| **GAP-02** | `/v1/srs/schedule` | Trạng thái `CURRENT` (Tier 1: heuristics + SuperMemo-2 placeholder). | Chuẩn hóa tại `SEQ-06`: Thuật toán SRS Policy B chạy tất định tại phía client/BFF, lưu trữ qua RPC `record_review`. AI Server KHÔNG tham gia. | Điểm không tương thích lịch sử (Historical divergence). Giữ nguyên endpoint trong `03` ở trạng thái COMPATIBILITY GAP. | Deprecate endpoint này khi toàn bộ client chuyển sang sử dụng RPC `record_review`. |
| **GAP-03** | `/v1/chat/*` | Trạng thái `CURRENT` (Roleplay chat, scenario list). | Giữ nguyên trạng thái hỗ trợ thử nghiệm. Không thuộc phạm vi Core Learning MVP của M2.3. | Không gây xung đột luồng Core. | Duy trì tương thích ngược; cô lập khỏi luồng bài học chính. |
| **GAP-04** | Next.js BFF Route Handlers | Chưa được định nghĩa trong `03` (tài liệu `03` chỉ đặc tả tầng AI FastAPI). | Đặc tả rõ trách nhiệm của các Route Handlers `/api/*` làm BFF trung gian cho Web Learner và Web Admin. | Khoảng cách về phạm vi bao phủ (Scope Boundary). `03` vốn chỉ dành riêng cho AI Service. | Giữ nguyên `03`; ghi nhận toàn bộ hợp đồng BFF trong tài liệu M2.3 này và tài liệu API mở rộng trong tương lai. |
| **GAP-05** | RPC `record_review` | Chưa được ghi nhận trong `03` (thuộc tầng Data/RPC của Supabase). | Đặc tả rõ tại `SEQ-06`: Hàm nguyên tử chuẩn tắc nhận `(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`, thực thi với `SECURITY DEFINER`. | Thuộc bề mặt cơ sở dữ liệu PostgreSQL/RPC, không thuộc dịch vụ HTTP AI. | Ghi nhận trong tài liệu mô hình dữ liệu và M2.3; không đưa vào `03`. |

---

## 4. Artifact #15: Service Interaction Model & Layer Responsibilities

Artifact #15 định nghĩa cấu trúc tương tác logic giữa các dịch vụ và phân định trách nhiệm theo kiến trúc 4 phân tầng (4-Layer Architectural Responsibility Model).

```
+----------------------------------------------------------------------------------------------------+
|                                 4-LAYER ARCHITECTURAL MODEL                                        |
+----------------------------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER                                                                              |
|    - Web Learner UI (Next.js Client Components, React State, Audio Player, Practice Surfaces)       |
|    - Web Admin UI (lingora-admin Web Client: Dashboard, Curriculum Editor, Moderation Board, Audit)  |
+----------------------------------------------------------------------------------------------------+
                                      |   HTTP / Cookies / Client Actions
                                      v
+----------------------------------------------------------------------------------------------------+
| 2. APPLICATION / BFF LAYER (Next.js App Router Server Side)                                        |
|    - Route Handlers & Server Actions (/api/learner/*, /api/admin/*, /api/ai/gec)                   |
|    - Session Validation, PKCE Callback Handling, Cookie Lifecycle Management                       |
|    - AI Proxying, 8.0s Hard Timeout Enforcement & Fallback Circuit Breaker                         |
|    - Separation of Duties (SoD) Pre-Authorization Gates (Verify auth.uid() != Lesson.creatorId)   |
+----------------------------------------------------------------------------------------------------+
                                      |   Internal Service Invocations / Typed Domain Calls
                                      v
+----------------------------------------------------------------------------------------------------+
| 3. DOMAIN SERVICES LAYER (Pure Business Logic)                                                     |
|    - PlacementService: Two-Stage Adaptive Testing (Routing [PROPOSED ~10-12q, PENDING VALIDATION];  |
|      Total [PROPOSED ~25-30q, PENDING VALIDATION]), SkillProfile Evaluator, Mapping A              |
|    - JumpAssessmentService: 24h Cooldown Verification (conceptual rule, persistence OPEN DESIGN),   |
|      Jump Evaluation (>=95%), Bypass Manager (by_jump = true)                                      |
|    - LessonExecutionService: Exercise Validation, Retry Quota (Policy D7), 70% Credit Calculator  |
|    - SrsScheduler: Deterministic Interval Step Progression (Policy B: [1, 3, 7, 14, 30])           |
|    - StreakEvaluatorService: Calendar Day Comparison (Asia/Ho_Chi_Minh), Reset to 1 Logic          |
|    - ContentLifecycleService: Authoring, SoD Review Gates, Unit Visibility (4/4 Published) Rule   |
+----------------------------------------------------------------------------------------------------+
            |                                         |                                  |
            | Database Queries / RPC                  | Direct Compute (No DB)           | Assets
            v                                         v                                  v
+----------------------------------+  +----------------------------------+  +------------------------+
| 4A. PERSISTENCE & INFRASTRUCTURE |  | 4B. EXTERNAL AI SERVICES         |  | 4C. EXTERNAL PROVIDERS |
| - PostgreSQL Database            |  | - AI Server (FastAPI, Stateless) |  | - Supabase GoTrue Auth |
| - Supabase RLS Policies          |  | - Endpoint: POST /v1/gec/correct |  | - Supabase Storage     |
| - Atomic RPC Functions           |  | - Transient Text Diffs Only      |  |   (audio / avatars)    |
|   (record_review)                |  | - Non-owner of all core states   |  |                        |
| - AuditLog Ledger (Append-Only)  |  | - Fallback on Timeout (>8.0s)    |  |                        |
+----------------------------------+  +----------------------------------+  +------------------------+
```

---

### 4.1. Layer Responsibilities & Service Duties

1. **Presentation Layer (Tầng Trình diễn):**
   - Chịu trách nhiệm hiển thị giao diện người dùng tương tác, tiếp nhận hành động của người học và đội ngũ tác nghiệp nội bộ.
   - Quản lý trạng thái giao diện cục bộ (form state, audio playback buffering, visual feedback diffs).
   - Tuyệt đối không tự ý quyết định quy tắc nghiệp vụ (không tự quyết định việc vượt cấp, không tự tính điểm hoàn thành bài học, không tự cấp quyền).
2. **Application / BFF Layer (Tầng Điều phối Ứng dụng & BFF):**
   - Đóng vai trò lớp đệm an toàn giữa trình duyệt client và cơ sở hạ tầng backend.
   - Giải mã và xác thực phiên đăng nhập người dùng từ session cookie an toàn (`httpOnly`).
   - Kiểm tra sơ bộ quyền hạn và ma trận phân tách trách nhiệm (SoD) trước khi chuyển tiếp yêu cầu nghiệp vụ.
   - Điều phối cuộc gọi tới dịch vụ AI thông qua proxy, bảo vệ hệ thống với thời gian ngắt cưỡng bức 8.0 giây (hard timeout) và kích hoạt cơ chế phục hồi khi AI gặp sự cố.
3. **Domain Services Layer (Tầng Dịch vụ Miền Nghiệp vụ):**
   - Thực thi toàn bộ các quy tắc nghiệp vụ độc lập với giao diện và hạ tầng.
   - Sở hữu logic đánh giá bài thi thích ứng, tính điểm chuẩn tắc theo English A1 Mapping A, kiểm soát điều kiện vượt cấp nhảy bài (Jump), tính toán chu kỳ lặp lại ngắt quãng SRS (Policy B), và đánh giá chuỗi ngày học liên tục (Streak).
   - Kiểm soát vòng đời nội dung học liệu theo quy trình phê duyệt chặt chẽ và quy tắc hiển thị Unit (4/4 bài học `PUBLISHED`).
4. **Data, External & Infrastructure Layer (Tầng Dữ liệu & Hạ tầng Ngoài):**
   - Đảm bảo tính toàn vẹn và bất biến của dữ liệu thông qua cơ chế RLS và các hàm RPC nguyên tử (`record_review`).
   - Cung cấp dịch vụ định danh và xác thực tập trung qua Supabase GoTrue Auth.
   - Cung cấp năng lực tính toán xử lý ngôn ngữ tự nhiên thông qua AI Server hoàn toàn **stateless**, không lưu trữ dữ liệu người học.
   - Lưu trữ nhật ký kiểm toán bất biến (`AuditLog`) chỉ cho phép ghi thêm (append-only), phục vụ đối soát an ninh.

---

### 4.2. Dependency Directions & Strict Separation

1. **Chiều phụ thuộc một chiều (Unidirectional Dependency):**
   - `Presentation Layer` $\rightarrow$ `Application/BFF Layer` $\rightarrow$ `Domain Services Layer` $\rightarrow$ `Persistence / External Layer`.
   - Tuyệt đối không có chiều phụ thuộc ngược lại.
   - Client trình duyệt **tuyệt đối không được phép gọi trực tiếp tới AI Server** mà bắt buộc phải đi qua Route Handler Proxy của tầng BFF.
2. **Nguyên tắc phi sở hữu dữ liệu của AI (Stateless AI Non-Ownership Invariant):**
   - AI Server (`lingora-ai`) không có kết nối cơ sở dữ liệu, không có quyền truy cập bảng người dùng, và không lưu trữ bất kỳ trạng thái nào.
   - Khi dịch vụ AI bị sập, gặp lỗi hoặc phản hồi chậm quá 8.0 giây, toàn bộ hệ thống Core Learning vẫn hoạt động bình thường nhờ cơ chế cô lập sự cố (fault isolation) và phục hồi an toàn (graceful fallback).

---

## 5. Authoritative Data & State Ownership Matrix

Bảng chuẩn hóa thẩm quyền sở hữu dữ liệu và trạng thái hệ thống theo đúng phân định từ M2.1 §4, M2.2 §7 và Kế hoạch M2.3:

| Trạng thái / Dữ liệu Hệ thống | Thực thể Dữ liệu Liên quan | Chủ sở hữu Ghi có Thẩm quyền (Sole Authoritative Write Owner) | Chủ sở hữu Đọc & Đối tượng Tiêu thụ Phái sinh | Ghi chú & Ràng buộc Bất biến Kiến trúc |
|---|---|---|---|---|
| **1. Lesson Completion** | `public.UserProgress` | `LessonExecutionService` (thuộc luồng `UC-05` / `BF-10`) | Bảng điều khiển học viên (`Dashboard`), Lộ trình học | Trạng thái hoàn thành bài học $\ne$ Điểm số, $\ne$ Mastery, $\ne$ Năng lực CEFR. |
| **2. LearningProgress** | `public.LearningProgress` | `LearnerProfileService` / Tiến trình người học | Dashboard, Đánh giá mức sẵn sàng (`LevelReadiness`) | Thuộc quyền sở hữu duy nhất của `Role.LEARNER` qua `LearnerProfile`. |
| **3. Daily Streak** | `public.Profile.streak_count`, `last_qualifying_activity_date` | `StreakEvaluatorService` (trong giao dịch hoàn thành bài học và hoàn thành ôn tập SRS) | Header, Bảng điều khiển học viên | Đánh giá lười theo múi giờ `Asia/Ho_Chi_Minh`. AI hoàn toàn bị loại trừ. Gián đoạn reset về 1. |
| **4. Curriculum Entry / Starting Unit** | `public.Profile.starting_unit` [TARGET-CANDIDATE DD-06 / OPEN DESIGN], `public.LearnerProfile`, `public.LearningProgress` | `PlacementService` (Chẩn đoán) / Quy trình tự khai sơ bộ (Self-report) | Lộ trình duyệt bài (`Path Browse`) | Nhánh tự khai ghi nhận `UNVERIFIED`, tạo 0 `AssessmentResult`, 0 `SkillProfile`. |
| **5. Jump Provenance** | `public.LearningProgress.status`, `by_jump` | `JumpAssessmentService` (thuộc luồng `UC-04` / `BF-11`) | Lộ trình duyệt bài | Chỉ ghi nhãn `SKIPPED_BY_JUMP`. Tuyệt đối không ghi `COMPLETED_BY_JUMP`. |
| **6. KnowledgeGap & ConceptMastery** | `public.KnowledgeGap`, `public.ConceptMastery` | Bộ đánh giá mức thành thạo khái niệm (Concept Mastery Evaluator) | Gợi ý học tập (`Recommendation`), Lớp học phụ đạo (`RemedialModule`) | Ngưỡng đánh giá được bảo lưu ở trạng thái `CONFIGURABLE` (tường lửa quyết định mở). |
| **7. AssessmentResult** | `public.AssessmentResult` | Dịch vụ khảo thí (`PlacementService`, `JumpAssessmentService`) | Cập nhật `SkillProfile`, Kiểm toán học tập | Bản ghi bất biến (Immutable) lưu `dimensions, rawScores, stageData, completedAt`. TUYỆT ĐỐI KHÔNG có cột `score` hoặc `passed`. |
| **8. SkillProfile** | `public.SkillProfile` | Dữ liệu thuộc quyền sở hữu của `LearnerProfile` (Learner domain, `Role.LEARNER`); `PlacementService` tính toán và cập nhật phái sinh | Dashboard radar chart, Gợi ý lộ trình | Lưu trữ 4 cấp độ kỹ năng (`vocabularyLevel`, `grammarLevel`, `readingLevel`, `listeningLevel`), `radarData`. `verifiedProficiency` thuộc `LearnerProfile`. |
| **9. SRS History Log** | `public.review_logs` | Hàm RPC nguyên tử `record_review` | Lịch sử ôn tập SRS, thuật toán lặp ngắt quãng | Bảng `review_logs` là nhật ký lịch sử ôn tập SRS; TUYỆT ĐỐI KHÔNG phải bảng kiểm toán hệ thống `audit_logs`. |
| **10. Transient AI Outputs** | Văn bản sửa lỗi tạm thời (`corrected_text`, `edits`) | Chỉ tồn tại tạm thời trong bộ nhớ phiên làm việc | Giao diện hiển thị sửa lỗi ngữ pháp bài viết tự do | Dịch vụ AI sở hữu văn bản tạm thời; **AI KHÔNG SỞ HỮU BẤT KỲ TRẠNG THÁI NÀO Ở TRÊN**. |
| **11. Security Audit Events** | `public.AuditLog` | Điểm phát sinh sự kiện của từng phân hệ (Auth, Content, Admin) | Giao diện kiểm toán an ninh (`UC-13`) | Bản ghi bất biến chỉ ghi thêm (Append-only). Cấm sửa/xóa dưới mọi hình thức. |

---

## 6. Error & Failure Taxonomy (Design-Level)

Hệ thống Lingora kế thừa cấu trúc bao gói lỗi (Error Envelope) từ `docs/03-api-contract.md` §3.1 với trường `"detail"` số ít (string hoặc object/null). Trường `request_id` là phần mở rộng thiết kế tùy chọn (`[M2.3 DESIGN ADDITION / OPTIONAL]`) phục vụ telemetry/truy vết, KHÔNG PHẢI trường chuẩn tắc canonical (`not a canonical field`):

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Human-readable descriptive explanation of the error",
    "detail": "Field dailyGoalMin must be between 5 and 120",
    "request_id": "req_01hzx8abc123"
  }
}
```

---

### 6.1. Taxonomy of Interaction Errors

Bảng phân loại các mã lỗi tương tác, phân định rõ nguồn gốc chuẩn tắc (`CANONICAL_FROM_03`), mã thiết kế bổ sung của M2.3 (`M2.3_DESIGN_ADDITION`), và mã mở rộng tương lai (`FUTURE`):

| Họ Lỗi (Error Category) | Mã lỗi (Error Code) | Phân loại Nguồn gốc (Taxonomy Provenance) | Mã HTTP | Ngữ cảnh Phát sinh | Ranh giới Xử lý & Hành vi Phục hồi |
|---|---|---|---|---|---|
| **Lỗi Dữ liệu Đầu vào** | `INVALID_INPUT` | `CANONICAL_FROM_03` | 400 | Text rỗng / items rỗng (theo `03`), tham số không hợp lệ, mục tiêu phút ngoài [5..120]. | Trả về thông điệp chi tiết trong trường `detail`, giữ nguyên dữ liệu trên form người dùng. |
| **Lỗi Độ dài Văn bản AI** | `TEXT_TOO_LONG` | `CANONICAL_FROM_03` | **413** | `user_message` vượt quá 500 ký tự (chuẩn hóa HTTP 413 Payload Too Large theo `03`). | Trả về thông báo lỗi, yêu cầu người học rút ngắn văn bản trước khi gửi lại. |
| **Lỗi Ngôn ngữ Hỗ trợ** | `LANG_NOT_SUPPORTED` | `CANONICAL_FROM_03` | **422** | `lang != "en"` (chuẩn hóa HTTP 422 Unprocessable Entity theo `03`). | Từ chối xử lý, thông báo ngôn ngữ hỗ trợ hiện hành (English). |
| **Lỗi Kịch bản Luyện viết** | `SCENARIO_NOT_FOUND` | `CANONICAL_FROM_03` | 404 | `scenario_code` không tồn tại hoặc chưa xuất bản (theo `03`). | Hiển thị thông báo kịch bản không tồn tại, gợi ý quay về danh mục kịch bản. |
| **Lỗi Xác thực & Phiên** | `UNAUTHORIZED` | `CANONICAL_FROM_03` | 401 | JWT sai hoặc hết hạn, người dùng chưa đăng nhập hợp lệ (theo `03`). | BFF xóa session cookie hỏng, chuyển hướng người dùng về trang `/login`. |
| **Lỗi Giới hạn Tần suất** | `RATE_LIMITED` | `CANONICAL_FROM_03` | 429 | Vượt quá 20 req/phút/user (theo `03`). | Từ chối tạm thời, yêu cầu người học chờ trước khi gửi lại yêu cầu. |
| **Lỗi Dịch vụ AI Chưa sẵn sàng** | `MODEL_UNAVAILABLE` | `CANONICAL_FROM_03` | 503 | Mô hình AI chưa nạp xong hoặc dịch vụ AI bận (theo `03`). | Kích hoạt chế độ phục hồi an toàn, thông báo hệ thống AI bận, không chặn tiến trình học tập. |
| **Lỗi Dữ liệu Mức Ứng dụng** | `VALIDATION_ERROR` | `M2.3_DESIGN_ADDITION` | 400 | Dữ liệu form không hợp lệ ở tầng ứng dụng/BFF. | Trả về thông điệp chi tiết qua `detail`. |
| **Lỗi Phân quyền** | `FORBIDDEN` | `M2.3_DESIGN_ADDITION` | 403 | Người dùng không đủ quyền thực hiện hành động trên tài nguyên. | Từ chối truy cập, ghi nhận cảnh báo nếu cần. |
| **Lỗi Tài nguyên** | `NOT_FOUND` | `M2.3_DESIGN_ADDITION` | 404 | Bài học, từ vựng hoặc tài nguyên chung không tìm thấy trên hệ thống. | Hiển thị màn hình 404 thân thiện, gợi ý quay về danh mục. |
| **Lỗi Xung đột** | `CONFLICT` | `M2.3_DESIGN_ADDITION` | 409 | Trùng lặp trạng thái tài nguyên hoặc xung đột phiên bản. | Thông báo trạng thái xung đột, tải lại trạng thái mới nhất. |
| **Lỗi Máy chủ Nội bộ** | `INTERNAL_SERVER_ERROR` | `M2.3_DESIGN_ADDITION` | 500 | Lỗi không mong đợi trong quá trình xử lý logic phía máy chủ. | Trả về lỗi kèm `request_id` (optional telemetry) để tra cứu trong hệ thống log. |
| **Lỗi Hết giờ AI (Timeout)** | `DEPENDENCY_TIMEOUT` | `M2.3_DESIGN_ADDITION` | 504 | Yêu cầu tới AI Server vượt quá giới hạn cứng 8.0 giây. | BFF ngắt kết nối (`504 Gateway Timeout`), kích hoạt fallback an toàn, bảo toàn văn bản người học. |
| **Lỗi Phân tách SoD** | `SOD_VIOLATION_SELF_REVIEW` | `M2.3_DESIGN_ADDITION` | 403 | Creator cố tình phê duyệt bài học do chính mình tạo ra (`auth.uid() == Lesson.creatorId`). | BFF chặn đứng yêu cầu trước khi gọi DB, ghi nhận sự kiện cảnh báo an ninh vào `AuditLog`. |
| **Lỗi Admin Duyệt SoD** | `SOD_ADMIN_MUST_BE_APPROVED` | `M2.3_DESIGN_ADDITION` | 403 | Admin cố xuất bản khẩn cấp bài học chưa được phê duyệt (`status != 'APPROVED'`). | Từ chối thao tác, yêu cầu bài học phải qua quy trình kiểm duyệt học thuật trước. |
| **Lỗi Khóa chờ Vượt cấp** | `JUMP_COOLDOWN_ACTIVE` | `M2.3_DESIGN_ADDITION` | 429 | Học viên cố làm bài kiểm tra Jump khi đang trong thời gian phạt 24 giờ. | Từ chối nộp bài, hiển thị bộ đếm thời gian còn lại cho học viên. |
| **Lỗi Chuyển trạng thái** | `INVALID_STATE_TRANSITION` | `M2.3_DESIGN_ADDITION` | 400 | Thao tác chuyển đổi trạng thái nội dung sai quy trình (ví dụ xuất bản bài học `DRAFT`). | Từ chối thao tác, thông báo trạng thái hiện tại của thực thể. |
| **Lỗi Trùng lặp Giao dịch** | `DUPLICATE_MUTATION` | `M2.3_DESIGN_ADDITION` | 409 | Thao tác nộp bài hoặc bấm nút bị lặp lại nhiều lần do trễ mạng. | Cơ chế kiểm soát tính lũy thừa chặn đứng xử lý trùng lặp, trả về kết quả ban đầu. |
| **Lỗi Nguyên tử Dữ liệu** | `TRANSACTION_FAILURE` | `M2.3_DESIGN_ADDITION` | 500 | Lỗi xảy ra trong quá trình thực thi hàm RPC `record_review`. | Rollback toàn bộ giao dịch, đảm bảo không có dữ liệu rác hoặc trạng thái nửa vời. |
| **Lỗi Khóa Nhóm B2B** | `COHORT_SEATS_EXCEEDED` | `FUTURE` | 409 | Số lượng học viên vượt quá gói bản quyền nhóm đã cam kết (mở rộng `UC-15`). | Thông báo cho Organizational Manager nâng cấp gói thành viên. |

---

## 7. Conceptual Idempotency & Atomicity Matrix

Bảng phân tích yêu cầu lũy thừa (Idempotency) và tính nguyên tử (Atomicity) ở mức thiết kế khái niệm cho toàn bộ các thao tác tương tác trong hệ thống:

| Hành vi Tương tác (Interaction Action) | Bản chất Thao tác | Yêu cầu Nguyên tử (Atomicity Requirement) | Yêu cầu Lũy thừa (Idempotency Protection Analysis) | Cơ chế Đảm bảo ở Mức Khái niệm |
|---|---|---|---|---|
| **Truy vấn Đọc (Reads)** (Dashboard, Path, Due cards, Audit) | Đọc dữ liệu | Không áp dụng (Read-only) | Tự nhiên mang tính lũy thừa (Naturally Idempotent) | Thực hiện nhiều lần không làm thay đổi trạng thái hệ thống. |
| **Xác thực Đăng xuất (Safe Logout)** | Hủy phiên | Cần thiết | Lũy thừa (Idempotent) | Xóa session cookie phía client và thu hồi token; gọi nhiều lần kết quả vẫn là đã đăng xuất. |
| **Nộp bài Bài tập & Làm lại (Retry)** | Ghi điểm bài học | Nguyên tử đối với từng lần thử bài tập | **Cần bảo vệ chống nộp lặp (Anti-Double-Submit)** | Gửi kèm mã định danh lần nộp (`attempt_id`); dữ liệu lần thử tồn tại tạm thời trong phiên (TUYỆT ĐỐI KHÔNG có bảng `ExerciseAttempt`); nộp trùng không được cộng điểm hai lần hoặc tính thêm lượt làm lại. |
| **Ghi nhận Ôn tập SRS (`record_review`)** | Cập nhật SRS & History Log | **BẮT BUỘC NGUYÊN TỬ (Strictly Atomic)** | **Cần bảo vệ chống nộp lặp** | Đóng gói trong một hàm RPC chuẩn tắc duy nhất: cập nhật thẻ từ vựng `user_vocab_srs`, chèn nhật ký `review_logs` (SRS history log, KHÔNG phải `audit_logs`) phải cùng thành công hoặc cùng rollback. |
| **Nộp bài Thi Xếp lớp (Placement)** | Tạo hồ sơ kỹ năng | Nguyên tử trong việc ghi nhận kết quả và cập nhật hồ sơ | **Cần bảo vệ chống nộp lặp** | Bài thi đã nộp và tạo `AssessmentResult` (bất biến, không cột score) không thể nộp lại lần 2 trên cùng một phiên đề thi. |
| **Nộp bài Kiểm tra Nhảy bài (Jump)** | Mở khóa cấp độ | Nguyên tử trong việc ghi nhãn `SKIPPED_BY_JUMP` | **Cần bảo vệ chống Race Condition & Replay** | Đánh giá quy tắc khóa thời gian chờ 24 giờ trước khi ghi nhận (cơ chế lưu trữ OPEN DESIGN, không có cột `lastJumpFailedAt`); nếu thất bại, khóa kích hoạt tức thì chống bấm liên tục. |
| **Phê duyệt Nội dung (Review Approval)** | Chuyển trạng thái | Nguyên tử đối với bản ghi bài học | Lũy thừa có điều kiện | Kiểm tra trạng thái hiện tại phải là `IN_REVIEW`; kiểm tra SoD `auth.uid() != Lesson.creatorId`; nếu đã `APPROVED`, các yêu cầu sau bị từ chối hoặc trả về kết quả đã duyệt. |
| **Xuất bản Nội dung (Content Publish)** | Xuất bản bài học & kiểm tra Unit | **BẮT BUỘC NGUYÊN TỬ (Strictly Atomic)** | Lũy thừa | Chuyển trạng thái bài học sang `PUBLISHED`, kiểm tra điều kiện 4/4 của Unit, và ghi `AuditLog` phải thực hiện trong một giao dịch. |
| **Nhân bản Tạo nháp v2 (Clone-to-Draft)** | Tạo bản sao bài học | **BẮT BUỘC NGUYÊN TỬ (Strictly Atomic)** | Cần bảo vệ chống bấm đúp | Tạo mới bản ghi `Lesson` với `supersedesId` [TARGET-CANDIDATE DD-02 / OPEN DESIGN] trỏ về bài cũ và sao chép toàn bộ bài tập liên quan trong một giao dịch duy nhất. |

---

## 8. Traceability & Full Coverage Matrix

Bảng truy vết hoàn chỉnh kết nối từ Yêu cầu kỹ thuật $\rightarrow$ MVP Feature $\rightarrow$ Yêu cầu Chức năng P1-FR $\rightarrow$ Use Case $\rightarrow$ Behavioral Family $\rightarrow$ Thực thể Miền $\rightarrow$ Quy định D3/D4 $\rightarrow$ Hành vi M2.2 $\rightarrow$ **Đặc tả Tương tác & Ranh giới M2.3**:

| Yêu cầu & Chính sách Nguồn | MVP Ref | Canonical UC | Behavioral Family (BF) | Thực thể Dữ liệu / Trạng thái Miền | M2.2 Ref | M2.3 Sequence & Service Boundary Ref | Tình trạng Kiểm định |
|---|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Auth Flow | `Profile`, Session Cookie (`@supabase/ssr`) | M2.2 §2 (UC-01) | `SEQ-01`, §3.1 Bề mặt 5 (GoTrue), §4.1 BFF | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Setup | `Profile` (`dailyGoalMin`, `timezone`) | M2.2 §2 (UC-02) | `SEQ-02`, §3.1 Bề mặt 10, §5 Mục 4 | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Flow | `AssessmentResult`, `SkillProfile`, `verifiedProficiency` | M2.2 §2 (UC-03) | `SEQ-03`, §3.1 Bề mặt 10, §4.1 PlacementService | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump | `Course`, `Unit`, `Lesson`, `LearningProgress` | M2.2 §2 (UC-04) | `SEQ-04`, §3.1 Bề mặt 10, §4.1 JumpService | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learn & `BF-10` Retry | `Exercise`, `Concept`, `KnowledgeGap`, `ConceptMastery` | M2.2 §2 (UC-05) | `SEQ-05`, §3.1 Bề mặt 6/8, §4.1 LessonService | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `user_vocab_srs`, `review_logs`, RPC `record_review` | M2.2 §2 (UC-06) | `SEQ-06`, §3.1 Bề mặt 7 (RPC), §4.1 SrsScheduler | `FROZEN` |
| `P1-FR-004`, `P1-FR-016` (Skill Profile) | `MVP-08/10/11` | `UC-07` | `BF-13` Progress Tracking | `LearningProgress`, `Profile.streak_count`, `SkillProfile` | M2.2 §2 (UC-07) | `SEQ-07`, §3.1 Bề mặt 6/7, §4.1 StreakEvaluator | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03/04/06` Authoring | `Lesson` (`creatorId`), `Exercise` (supersedesId [TARGET-CANDIDATE DD-02]) | M2.2 §2 (UC-08) | `SEQ-08`, §3.1 Bề mặt 9 (Admin/Prisma), §4.1 Content | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review | `Lesson` (`reviewerId`, status `IN_REVIEW`/`APPROVED`) | M2.2 §2 (UC-09) | `SEQ-08`, §3.1 Bề mặt 9 (Admin/Prisma), §4.1 Content | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13/19` | `UC-10` | `BF-07` Publish & `BF-02` Plan | `Lesson.isPublished`, `Unit` (4/4 published), `AuditLog` | M2.2 §2 (UC-10) | `SEQ-08`, §3.1 Bề mặt 9, §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-003 | `MVP-14` | `UC-11` | Account/Role Management | `Profile.role`, `AuditLog` | M2.2 §2 (UC-11) | `SEQ-09`, §3.1 Bề mặt 9, §4.1 AdminService | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Analytics & Reports | System Aggregated Views, Activity Logs | M2.2 §2 (UC-12) | `SEQ-09`, §3.1 Bề mặt 9, §4.1 AdminService | `DESIGN` |
| `P1-NFR-001`, ADR-004 | `MVP-19` | `UC-13` | Security Audit Ledger | `AuditLog` (immutable event store) | M2.2 §2 (UC-13) | `SEQ-09`, §3.1 Bề mặt 9, §5 Mục 9 | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Support Tickets | `SupportTicket`, `Profile` | M2.2 §2 (UC-14) | `SEQ-09`, §3.1 Bề mặt 9, §4.1 SupportService | `DESIGN / SUPPORTING` |
| Scenario Free-Writing (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless)* | `BF-14` Scenario Writing Flow | `ChatScenario`, transient GEC diffs | M2.2 §3 (BF-14) | `SEQ-10`, §3.1 Bề mặt 2 & 4, §4.1 BFF Proxy | `FROZEN (Stateless)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | `Cohort`, `CohortMember` (Extension Boundary) | M2.2 §2 (UC-15) | `SEQ-09` (Boundary-only marker), §3.1 Bề mặt 9 | `OPTIONAL BOUNDARY` |

---

## 9. Validation Gates Evidence (D-G4, D-G5 & D-G6 Input Evidence)

Theo đúng quy định của Lộ trình thiết kế (`docs/phase-1-system-design-plan.md` §10) và Kế hoạch M2.3, tài liệu này thiết lập đầy đủ bằng chứng kiểm định cho các Cổng thiết kế:

### 9.1. D-G4 Gate Evidence (Completeness, Actor Tracing & Policy Alignment)
- **Bao phủ tương tác:** Tập 10 biểu đồ trình tự chuẩn tắc (`SEQ-01` đến `SEQ-10`) bao phủ trọn vẹn 100% các Use Cases (`UC-01`..`UC-15`) và 100% các Behavioral Families (`BF-01`..`BF-15`).
- **Phân định tác nhân chuẩn tắc:** 6 vai trò chuẩn tắc (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`, `Operations Staff`) được phân định trách nhiệm rõ ràng, không có hiện tượng tác nhân ma hoặc nhầm lẫn thẩm quyền.
- **Ranh giới mở rộng an toàn:** `UC-15` được thể hiện chính xác dưới dạng ranh giới mở rộng trong tương lai (`OPTIONAL / FUTURE EXTENSION BOUNDARY`), không tạo ra bất kỳ phụ thuộc nào vào hệ thống Core.
- **Không trôi dạt chính sách (Zero Policy Drift):** Các chính sách sản phẩm đã đóng băng (D1–D9) được phản ánh chuẩn xác trên các luồng tương tác (English A1 Mapping A, Jump $\ge 95\%$, Cooldown 24h, Retry D7 70% credit, SRS Policy B, Streak theo múi giờ `Asia/Ho_Chi_Minh`).
- **Không thực thể ma:** Không xuất hiện các thực thể ma `AssessmentSession` (HISTORICAL alias / không tồn tại entity AssessmentSession - no AssessmentSession entity exists), `ExerciseAttempt` (attempts remain request/session-level transient data; no ExerciseAttempt entity exists), `Exam`, hay `QuestionBank`.

### 9.2. D-G5 Gate Evidence (Architecture, Boundary Consistency & Stateless AI)
- **Nhất quán với các Quyết định Kiến trúc (ADRs):**
  - Tuân thủ ADR-002: Vòng đời nội dung và SoD được thể hiện chuẩn xác tại `SEQ-08` (chặn Creator tự duyệt bài với `403 Forbidden`).
  - Tuân thủ ADR-005 & ADR-008: Quản lý phiên làm việc thông qua session cookie an toàn (`@supabase/ssr`) tại `SEQ-01`.
  - Tuân thủ ADR-010: Phân tách ranh giới giữa dịch vụ học tập chính và các tiện ích AI.
  - Tuân thủ ADR-014: Dịch vụ AI (`lingora-ai`) hoàn toàn **stateless**, không kết nối DB, chỉ được gọi qua Route Handler proxy (`SEQ-10`), có timeout cứng 8.0s và fallback circuit breaker.
- **Không âm thầm thay đổi hợp đồng API:** Giữ nguyên vẹn 100% file `docs/03-api-contract.md`; toàn bộ các điểm giao tiếp mới hoặc khoảng cách đều được minh bạch hóa tại Sổ bộ khoảng cách API (§3.2).
- **Thẩm quyền sở hữu trạng thái duy nhất:** Bảng ma trận sở hữu trạng thái (§5) phân định một và chỉ một chủ sở hữu ghi cho từng trạng thái hệ thống. Dịch vụ AI hoàn toàn không sở hữu bất kỳ trạng thái người học nào.

### 9.3. D-G6 Input Evidence (Security, RLS & Boundary Readiness)
- **Cung cấp bằng chứng đầu vào (Input Evidence Only):** M2.3 xác lập rõ các điểm áp dụng kiểm tra quyền (`auth.uid()`, vai trò người dùng, kiểm tra SoD tại BFF, thực thi nguyên tử qua RPC `record_review`).
- **Ranh giới nghiêm ngặt:** **M2.3 TUYỆT ĐỐI KHÔNG TUYÊN BỐ ĐẠT (PASS) CỔNG D-G6**. Việc đóng cổng kiểm định D-G6 thuộc thẩm quyền của các mốc triển khai chính sách bảo mật và mô hình dữ liệu vật lý hạ nguồn (M2.4 / M2.5).

---

## 10. Open Decisions Firewall

Hệ thống Lingora thiết lập "tường lửa" bảo vệ nghiêm ngặt toàn bộ **13 nhóm quyết định mở** kế thừa từ D3 §N và D4 §Q. Trong toàn bộ các biểu đồ trình tự, hợp đồng API và mô hình dịch vụ M2.3, các yếu tố này luôn được giữ ở trạng thái **`OPEN / CONFIGURABLE / PENDING VALIDATION`**, tuyệt đối không đóng băng hoặc tự ý gán giá trị cứng:

1. **Scoring Algorithms & Skill Weights:** Thuật toán tính điểm chi tiết, trọng số câu hỏi và độ khó từng item thuộc Item Bank.
2. **Adaptive Branching Rules:** Tiêu chí rẽ nhánh thích ứng chi tiết giữa Giai đoạn 1 và Giai đoạn 2 của bài kiểm tra chẩn đoán.
3. **Diagnostic Stopping Criteria:** Điều kiện dừng sớm bài kiểm tra chẩn đoán (ngoài quy mô đề xuất `~25–30 items, PROPOSED`).
4. **Mastery Thresholds:** Ngưỡng xác định thành thạo khái niệm (`ConceptMastery`) và kích hoạt gợi ý bổ trợ.
5. **Level Readiness Thresholds:** Ngưỡng định lượng để xác định học viên đạt trạng thái sẵn sàng thăng cấp (`LevelReadiness`).
6. **Remediation Recommendation Policy:** Quy tắc lựa chọn và phân bổ các vi bài học phụ đạo (`RemedialModule`).
7. **Anchor Item Aggregation:** Phương pháp tổng hợp dữ liệu chuẩn hóa trên các câu hỏi mỏ neo (Anchor items).
8. **CEFR Expansion Beyond English A1:** Lộ trình và quy tắc mở rộng quy đổi trình độ sang các cấp độ A2, B1, B2.
9. **HSK Framework Mapping & Versioning:** Lựa chọn phiên bản HSK (HSK 2.0 6 cấp độ vs HSK 3.0 9 cấp độ) cho chương trình tiếng Trung.
10. **Recommendation Policy Versioning:** Quy trình quản lý phiên bản cho các thuật toán gợi ý học tập trong tương lai.
11. **Knowledge Gap Archival & Decay Policy:** Chính sách làm mờ (decay) hoặc lưu trữ các lỗ hổng kiến thức đã được khắc phục theo thời gian.
12. **Reading Exercise Physical Representation:** Cấu trúc bảng và lược đồ cơ sở dữ liệu vật lý cho bài tập đọc hiểu phức hợp (`READING`).
13. **Diagnostic Item Bank Scale Beyond ~25–30 Items:** Quy mô ngân hàng đề thi chẩn đoán mở rộng ngoài khoảng đề xuất `~25–30 câu`.

---

## 11. Scope Firewall & Negative Assertions

Nhằm ngăn chặn triệt để hiện tượng suy diễn hoặc mở rộng phạm vi trái phép, tài liệu thiết kế M2.3 xác nhận các tuyên bố phủ định (Negative Assertions) bắt buộc:
- **Zero Runtime Code:** Không có bất kỳ dòng mã nguồn nào được viết trong các ứng dụng `lingora-web`, `lingora-admin`, hoặc `lingora-ai`.
- **Zero Prisma Schema / DB Migration:** Không chỉnh sửa file `prisma/schema.prisma`, không tạo file migration SQL, không thay đổi cấu trúc bảng thực tế.
- **Zero RLS / Security Code Execution:** Không tạo mới hoặc chỉnh sửa chính sách RLS thực tế trên cơ sở dữ liệu (được thực hiện trong M2.4).
- **Zero Direct Edits to API Contract:** `docs/03-api-contract.md` được bảo toàn nguyên vẹn 100%.
- **Zero Ghost Entities:** Không tồn tại thực thể ma `AssessmentSession` (HISTORICAL alias / không tồn tại entity AssessmentSession - no AssessmentSession entity exists), không tồn tại thực thể ma `ExerciseAttempt` (attempts remain request/session-level transient data; no ExerciseAttempt entity exists).
- **Zero Fabricated Identifiers:** Không phát sinh bất kỳ mã Use Case nào ngoài 15 Use Cases chuẩn tắc (`UC-01`..`UC-15`).
- **Zero Milestone Claims:** **KHÔNG TUYÊN BỐ M2.3 ACCEPTED; KHÔNG TUYÊN BỐ DESIGN COMPLETE; KHÔNG TỰ Ý TẠO COMMIT GIT**. Mốc M2.3 chính thức dừng lại ở trạng thái **`READY FOR INDEPENDENT RE-REVIEW`**.
