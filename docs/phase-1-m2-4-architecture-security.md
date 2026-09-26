# LINGORA — PHASE 1 MILESTONE M2.4: ARCHITECTURE & SECURITY DESIGN

> **Mã tài liệu:** `docs/phase-1-m2-4-architecture-security.md`  
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Mốc thực thi:** Milestone M2.4 (Component Architecture, Deployment/Runtime Boundary & Security Responsibility Matrix)  
> **Trạng thái:** `IMPLEMENTED — READY FOR INDEPENDENT REVIEW` (Triển khai thiết kế hoàn tất tuân thủ kế hoạch được phê duyệt; KHÔNG tuyên bố Design Freeze; KHÔNG tự ý coi là ACCEPTED; KHÔNG tuyên bố Target Runtime đã sẵn sàng vận hành).  
> **Căn cứ kế hoạch:** `plans/m2-4-architecture-security-plan.md`, `docs/phase-1-system-design-plan.md` §7 (Artifacts #13, #14, #16; Cổng kiểm định D-G5, D-G6).  
> **Trạng thái tiếp nhận (Entry State):** `M2.1 ACCEPTED FOR M2.2`, `M2.2 ACCEPTED FOR M2.3`, `M2.3 ACCEPTED FOR M2.4` (commits `379c259`, `d37fc78`), `M2.4 PLAN = APPROVED`.  
> **Ranh giới nghiêm ngặt:** KHÔNG mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÔNG Prisma schema/migration/DDL, KHÔNG RLS SQL scripts, KHÔNG lưu trữ hoặc phơi bày secret thực tế, KHÔNG sửa đổi tài liệu `docs/03-api-contract.md` (giữ nguyên 100% byte-identical / READ-ONLY), KHÔNG sáng chế Use Case mới (`UC-16/17/18`), KHÔNG sáng chế Behavioral Family mới (`BF-16`), GEC là dịch vụ AI stateless (`BF-14`, zero UC, transient diffs only, KHÔNG sở hữu tiến trình học tập), KHÔNG thực thể ma (`no AssessmentSession entity exists`, `no ExerciseAttempt entity exists`), giữ nguyên các quyết định mở ở trạng thái `OPEN / CONFIGURABLE / PENDING VALIDATION`.

---

## 1. Executive Summary & Management Contract

Milestone M2.4 đóng lại khoảng trống cấu trúc cuối cùng trong Thiết kế Hệ thống Giai đoạn 1 (Phase 1 System Design): chuyển hóa toàn bộ các mô hình dữ liệu logic (M2.1), quy tắc hành vi người dùng (M2.2), và ranh giới tương tác dịch vụ/API (M2.3) thành một **gói thiết kế kiến trúc và an ninh toàn diện (Architecture & Security Design Package)**.

M2.4 tập trung vào 3 thực thể kiến trúc chuẩn tắc theo lộ trình master plan:
1. **Artifact #13 (Component Architecture):** Xác định quyền sở hữu logic của từng thành phần đối với các tập luật nghiệp vụ và ranh giới dữ liệu, thiết lập phân tầng 5 lớp (5-Layer Architectural Hierarchy) với chiều phụ thuộc một chiều nghiêm ngặt (Strict One-Way Dependency).
2. **Artifact #14 (Deployment/Runtime Boundary):** Mô hình hóa môi trường vận hành thành 5 vùng an ninh/runtime logic (Logical Security Zones), phân định ranh giới cách ly thông tin xác thực nhạy cảm (Secret Isolation Boundary), và phân loại minh bạch giữa trạng thái hiện tại (`CURRENT_APPLIED`), trạng thái đích (`TARGET`), và lộ trình tiến hóa tương lai (`FUTURE`).
3. **Artifact #16 (Security Responsibility Matrix):** Thiết lập ma trận trách nhiệm an ninh duy nhất trải rộng trên 6 ranh giới thực thi (Learner Web, Admin Web, Supabase RLS, Privileged Service Role, AI Server, Audit), bao quát toàn bộ 15 nhóm thao tác trọng yếu, phân định rõ ràng giữa kiểm tra phân quyền tại tầng ứng dụng (Application AuthZ) và cưỡng chế bảo mật tại tầng cơ sở dữ liệu (Database RLS), đảm bảo tuân thủ nguyên tắc đặc quyền tối thiểu (Least Privilege) và phân tách nhiệm vụ (Separation of Duties - SoD).

```
+----------------------------------------------------------------------------------------------------+
|                                    M2.4 ARCHITECTURAL CONTRACT                                     |
+-----------------------------------+-----------------------------------+----------------------------+
| ARTIFACT #13: COMPONENT ARCH      | ARTIFACT #14: DEPLOYMENT BOUNDARY | ARTIFACT #16: SECURITY     |
| - 5 Architectural Layers          | - 5 Logical Security Zones        | - 6-Boundary Matrix        |
| - One-Way Dependency (No cycles)  | - Secret & Credential Isolation   | - App AuthZ vs DB RLS Split|
| - Component Rule & State Ownership| - Privileged Role Isolation       | - Separation of Duties     |
| - Stateless AI Boundary (Non-owner| - CURRENT vs TARGET vs FUTURE     | - Negative Denial Paths    |
|   of progression/mastery/streak)  | - Zero Target-as-Ready Claims     | - Audit Event Ownership    |
+-----------------------------------+-----------------------------------+----------------------------+
```

---

### 1.1. Six-Field Contract for M2.4 Artifacts

Theo chuẩn hóa của `docs/phase-1-system-design-plan.md` §5 và `plans/m2-4-architecture-security-plan.md` §3, cả 3 artifacts thành phần thuộc M2.4 tuân thủ nghiêm ngặt hợp đồng 6 trường chuẩn tắc:

| Artifact ID & Tên Artifact | 1. Purpose (Mục đích) | 2. Inputs (Đầu vào) | 3. Outputs (Đầu ra) | 4. Dependencies (Phụ thuộc) | 5. Trace (Truy vết) | 6. Validation Gate (Cổng kiểm định) |
|---|---|---|---|---|---|---|
| **#13 Component Architecture** | Xác định quyền sở hữu logic của từng thành phần phần mềm đối với các tập luật nghiệp vụ và ranh giới dữ liệu; xác lập chiều phụ thuộc một chiều, triệt tiêu phụ thuộc vòng; bảo vệ ranh giới AI stateless. | Baseline kiến trúc `01`, đầu ra M2.3 (Artifact #15 service model, SEQ-01..10), danh mục 6 vai trò, các quyết định ADR (ADR-002, 005, 008, 010, 014). | Đặc tả phân tầng và trách nhiệm thành phần logic (§4), biểu đồ PlantUML phân tầng thành phần (`docs/plantuml/component-architecture-m24.puml`). | Cặp ranh giới API ↔ Security (#12, #15, #16); tập biểu đồ trình tự #11. | `UC-01`..`UC-15`, `BF-01`..`BF-15`, `P1-FR-001`..`017`, ADR-002/005/008/010/014. | **D-G5** (bảo toàn ranh giới Web/Admin/Supabase/AI, chiều phụ thuộc một chiều, AI không sở hữu dữ liệu chính). |
| **#14 Deployment/Runtime Boundary** | Xác định vị trí triển khai logic, các vùng an ninh (security zones), ranh giới quản lý bí mật (secrets), và phân định rạch ròi giữa trạng thái runtime hiện tại đối chiếu với thiết kế đích. | Ràng buộc môi trường `ENVIRONMENT.md`, ma trận an ninh #16, kiến trúc thành phần #13, các yêu cầu phi chức năng NFR. | Đặc tả ranh giới triển khai logic và cách ly secret (§5), biểu đồ PlantUML vùng triển khai (`docs/plantuml/deployment-boundary-m24.puml`). | Artifact #13; Artifact #16; kiến trúc máy chủ AI stateless. | `P1-NFR-001`..`004`, SEC-D1..D10, ADR-005 (PA2 Storage), ranh giới Vercel / Supabase / Render. | **D-G5** (phân loại ranh giới), **D-G6** (bảo vệ bí mật và cách ly quyền hạn; tuyệt đối không công nhận Target là đã sẵn sàng vận hành). |
| **#16 Security Responsibility Matrix** | Thiết lập ma trận trách nhiệm an ninh duy nhất định nghĩa kiểm soát phân quyền ứng dụng, cưỡng chế RLS, ranh giới tài khoản đặc quyền (service role), cách ly AI và trách nhiệm phát sinh nhật ký kiểm toán (audit). | Danh mục vai trò chuẩn tắc (6 vai trò), mô hình dữ liệu M2.1, quy tắc SoD M2.2, ranh giới API M2.3, quyết định SEC-D1..D10, DD-03, DD-10. | Ma trận an ninh 6 ranh giới (§6), biểu đồ PlantUML phân ranh giới an ninh (`docs/plantuml/security-matrix-m24.puml`), đặc tả SoD và đường dẫn từ chối (negative paths). | Artifact #13, Artifact #15; các luồng SEQ-01..10; quyết định DD-03 và DD-10. | `P1-NFR-001`, `UC-11`, `UC-13`, `UC-14`, SEC-D1..D10, ADR-004, ADR-020. | **D-G6** (mọi thao tác nhạy cảm đều có cơ chế cưỡng chế và kiểm toán; kiểm tra app không thay thế RLS; cách ly tài khoản đặc quyền). |

---

### 1.2. Strict Scope Boundaries & Invariants

Tài liệu thiết kế M2.4 tuân thủ nghiêm ngặt các ranh giới và bất biến kiến trúc sau:
1. **Design-Only Scope:** Tuyệt đối không phát sinh mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), không thay đổi file `schema.prisma`, không sinh mã migration, không can thiệp cơ sở dữ liệu thực tế, không cấu hình hạ tầng mạng hoặc secret manager.
2. **Read-Only API Contract:** `docs/03-api-contract.md` được giữ nguyên vẹn 100% (byte-identical).
3. **Canonical 6 Roles Invariant:** Hệ thống chỉ có chính xác 6 vai trò người dùng chuẩn tắc: `Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`. Tài khoản dịch vụ (`Privileged Service Role`) là một tác nhân hạ tầng kỹ thuật (infrastructure boundary swimlane), tuyệt đối KHÔNG phải vai trò người dùng thứ 7.
4. **Stateless AI Non-Ownership (ADR-014):** Dịch vụ AI (`lingora-ai`) hoàn toàn không lưu trạng thái (stateless), được triệu gọi thông qua Next.js Route Handler Proxy (`/api/ai/gec`), có timeout cố định 8.0 giây và cơ chế phục hồi (fallback) bắt buộc. AI sở hữu duy nhất kết quả tạm thời `corrected_text` và các span sửa lỗi; AI tuyệt đối **KHÔNG SỞ HỮU** và **KHÔNG ĐƯỢC GHI** bất kỳ trạng thái nào về tiến trình học tập (`LearningProgress`), mức độ thành thạo (`ConceptMastery`), hồ sơ kỹ năng (`SkillProfile`), điểm số, chuỗi ngày học (`streakCount`), hay trạng thái hoàn thành bài học.
5. **No Target-as-Ready False Claims:** Toàn bộ các cơ chế mục tiêu (mô hình 6 vai trò, bảng `audit_logs`, các chính sách RLS mở rộng) được phân loại chính xác là `TARGET_DESIGN`. Tuyệt đối KHÔNG tuyên bố target runtime là đã sẵn sàng vận hành (`NOT PRODUCTION READY / NOT YET DEPLOYED`).
6. **Preservation of Open Decisions:** Toàn bộ các quyết định mở về biểu diễn vật lý (DD-03 physical structure, DD-10 migration sequencing, ngưỡng thích ứng D3 §N, cấu hình D4 §Q) được bảo lưu nguyên vẹn ở trạng thái `OPEN`. Kiến trúc chấp nhận tính linh hoạt và thích ứng với các quyết định mở này mà không tự ý đóng sớm (force-close).

---

## 2. Current Baseline & Authoritative Context

Thiết kế Kiến trúc và An ninh M2.4 kế thừa trực tiếp và mang tính ràng buộc từ các tài liệu chuẩn tắc đã được thẩm định và chấp thuận:

1. **M2.1 Domain & Logical Data Foundation (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`):**
   - Đạt các cổng kiểm định **D-G1** và **D-G2** (PASS).
   - Thiết lập mô hình dữ liệu logic, phân định rõ ràng 3 trạng thái: Cơ sở dữ liệu hiện tại áp dụng (`CURRENT_APPLIED`), Lược đồ mục tiêu (`TARGET_SCHEMA`), và Di chuyển tương lai (`FUTURE_MIGRATION`).
   - Đóng băng cấu trúc định danh kế thừa bài học qua `supersedesId` [DD-02] và thông tin chỉ định biên soạn [DD-04].
2. **M2.2 System Behavior, Use Cases & State Machines (`docs/phase-1-m2-2-behavior-uc-activity-state.md`):**
   - Đạt các cổng kiểm định **D-G4** và **D-G7** (PASS).
   - Thiết lập 15 Use Cases (`UC-01`..`UC-15`) và 15 Behavioral Families (`BF-01`..`BF-15`).
   - Chuẩn hóa 6 trạng thái vòng đời nội dung (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`) với quy tắc SoD nghiêm ngặt.
   - Chuẩn hóa 4 trạng thái tiến trình người học (`LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP` với `by_jump=true`).
   - Chuẩn hóa 2 nhánh khởi đầu: Tự khai báo (Branch A - `selfReportedLevel` trạng thái `UNVERIFIED`, sinh 0 `AssessmentResult`, 0 `SkillProfile`) và Kiểm tra chẩn đoán (Branch B - sinh `AssessmentResult` bất biến và `SkillProfile` đa chiều).
   - Chuẩn hóa chính sách Retry D7 (allowance 10%, credit 70%) và SRS Policy B `[1, 3, 7, 14, 30]` ngày qua RPC `record_review`.
3. **M2.3 Sequence Interactions, API Contracts & Service Boundaries (`docs/phase-1-m2-3-sequence-api-service-boundary.md`):**
   - Đạt các cổng kiểm định **D-G4** và **D-G5** (PASS); cung cấp bằng chứng đầu vào **D-G6-input**.
   - Thiết lập 10 biểu đồ trình tự chuẩn tắc (`SEQ-01` đến `SEQ-10`).
   - Thiết lập Sổ bộ phân loại bề mặt API & Gap Register (10 bề mặt; `03` giữ nguyên byte-identical).
   - Thiết lập Mô hình ranh giới dịch vụ & phân tầng trách nhiệm (Artifact #15) và Bảng sở hữu trạng thái đơn nhất (Single State Ownership Matrix).
4. **Các quyết định Kiến trúc & An ninh (ADRs & SEC Decisions):**
   - `ADR-002`: Phân tách hệ thống Web Learner, Web Admin và AI Server.
   - `ADR-003`: Thiết lập các quy tắc quan hệ khóa ngoại và tính toàn vẹn dữ liệu.
   - `ADR-005` & `SEC-D8 PA2`: Ranh giới lưu trữ Supabase Storage hai bucket (`lingora-avatars`, `lingora-media`) với đường dẫn trực tiếp qua RLS, loại bỏ URL ký tạm (signed URLs).
   - `ADR-006`: Đơn giản hóa đề cương và học cụ bổ trợ; nhắc nhở học tập cục bộ tại trình duyệt (client-local).
   - `ADR-008`: Thiết lập nền tảng học tập hoàn toàn trên nền Web (`lingora-web`), loại bỏ nền tảng Android.
   - `ADR-010` & `ADR-014`: Chuẩn hóa 2 luồng SE Core + Transformer GEC hỗ trợ; AI hoàn toàn stateless, timeout 8.0s, non-owner đối với dữ liệu chính.
   - `ADR-020`: Cơ chế phát hành khẩn cấp của Quản trị viên (Admin Emergency Publish) bắt buộc phải có lý do nghiệp vụ và xuất nhật ký kiểm toán `AuditLog`.
   - `SEC-D1..D10`: 10 nguyên tắc bảo mật nền tảng (Auth rollback, trusted email sync, Profile validation, server chat ordering, published parent chain, row-lock retry, Storage PA2 direct).

---

## 3. Exact Roadmap Scope Definition

Căn cứ Mục 7 của `docs/phase-1-system-design-plan.md`, phạm vi của Milestone M2.4 bao gồm chính xác 3 artifacts kiến trúc:

```
+----------------------------------------------------------------------------------------------------+
|                                    ROADMAP SCOPE: ARTIFACTS 13, 14, 16                             |
+----------------------------------------------------------------------------------------------------+
| #13 COMPONENT ARCHITECTURE:                                                                        |
|     Đặc tả phân tầng 5 lớp; quyền sở hữu logic của từng component đối với luật và dữ liệu;        |
|     chiều phụ thuộc một chiều nghiêm ngặt (không chu trình); cô lập ranh giới AI stateless.        |
+----------------------------------------------------------------------------------------------------+
| #14 DEPLOYMENT / RUNTIME BOUNDARY:                                                                 |
|     Mô hình hóa 5 vùng an ninh/runtime logic; ranh giới cô lập secret và thông tin xác thực;       |
|     phân loại minh bạch CURRENT_APPLIED vs TARGET vs FUTURE; không nhận target là đã triển khai.   |
+----------------------------------------------------------------------------------------------------+
| #16 SECURITY RESPONSIBILITY MATRIX:                                                                |
|     Ma trận trách nhiệm an ninh duy nhất trải rộng 6 ranh giới thực thi; phân định App AuthZ      |
|     và Database RLS; quy tắc tài khoản đặc quyền; cưỡng chế SoD và đường dẫn từ chối; kiểm toán.   |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Artifact #13 — Component Architecture Specification

> **Mã Artifact:** `#13 Component Architecture`  
> **Biểu đồ trực quan:** [`docs/plantuml/component-architecture-m24.puml`](../plantuml/component-architecture-m24.puml)  
> **Cổng kiểm định:** `D-G5 — Architecture and API Boundary`

### 4.1. Phân tầng Kiến trúc 5 lớp (5-Layer Architectural Hierarchy)

Kiến trúc thành phần phần mềm của Lingora được phân ranh giới thành 5 tầng logic. Luồng phụ thuộc hệ thống tuân thủ nghiêm ngặt **nguyên tắc phụ thuộc một chiều (Strict One-Way Dependency)** từ trên xuống dưới; tuyệt đối không tồn tại phụ thuộc vòng (circular dependency) hoặc phụ thuộc ngược chiều (inverse dependency):

```
+-------------------------------------------------------------------------+
| Layer 1: Presentation Layer (Next.js Client Components)                 |
+-------------------------------------------------------------------------+
                                     ↓
+-------------------------------------------------------------------------+
| Layer 2: Application / BFF Layer (Next.js Server Actions & Proxies)     |
+-------------------------------------------------------------------------+
                                     ↓
+-------------------------------------------------------------------------+
| Layer 3: Domain Services Layer (Headless Business Engines)              |
+-------------------------------------------------------------------------+
                                     ↓
+-------------------------------------------------------------------------+
| Layer 4: Persistence & Infrastructure Layer (Supabase Postgres & RLS)   |
+-------------------------------------------------------------------------+
                                     ↓
+-------------------------------------------------------------------------+
| Layer 5: External Providers Layer (GoTrue Auth, Stateless FastAPI AI)   |
+-------------------------------------------------------------------------+
```

### 4.2. Đặc tả Chi tiết Thành phần Phần mềm (15 Tiêu chí Kỹ thuật)

#### A. Tầng 1: Presentation Layer

##### 1. `COMP-PRES-01: Learner Web Presentation Component`
1. **Title & Purpose:** Giao diện học tập trực tuyến dành cho người học (`lingora-web`), kết xuất UI học tập, làm bài tập, luyện phản xạ và theo dõi tiến trình.
2. **Source Traceability:** `docs/01-architecture.md` §3.2, M2.3 Artifact #15, `SCR-L-01`..`SCR-L-14`.
3. **Scope & Boundary:** Chạy hoàn toàn trên trình duyệt người dùng (Client Runtime Environment).
4. **Logical vs Physical:** Trách nhiệm logic kết xuất giao diện và tương tác UX; physical đóng gói dạng React/Next.js Client Components.
5. **Inputs:** Tương tác người dùng (click, submit câu trả lời, text nhập liệu bài viết tự do).
6. **Outputs:** Lệnh gọi Server Actions hoặc HTTP fetch tới Application/BFF nội bộ.
7. **Dependencies:** Phụ thuộc duy nhất vào Layer 2 (`COMP-APP-01: Learner BFF`).
8. **Actors & Roles:** Vai trò `Learner`.
9. **Owned Rules:** Client-side validation định dạng cơ bản (độ dài text, bắt buộc chọn đáp án); lưu trữ cấu hình nhắc nhở học tập cục bộ (`localStorage` per ADR-006).
10. **Owned Authoritative State:** Trạng thái giao diện cục bộ (UI state, form state, input text tạm thời).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC gọi trực tiếp API cơ sở dữ liệu (PostgREST); KHÔNG ĐƯỢC gọi trực tiếp máy chủ AI; KHÔNG ĐƯỢC lưu trữ token xác thực trong `localStorage`/`sessionStorage`; KHÔNG ĐƯỢC tự tính toán điểm số hoặc xác nhận hoàn thành bài học.
12. **Trust Boundary:** Vùng hoàn toàn không tin cậy (Untrusted Public Client Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED` (Next.js 15 App Router).
14. **Verification Method:** Cổng **D-G5**; rà soát không có import trực tiếp từ DB/AI.
15. **Acceptance Criteria:** 100% yêu cầu dữ liệu và AI đều đi qua Layer 2.

##### 2. `COMP-PRES-02: Admin Web Presentation Component`
1. **Title & Purpose:** Giao diện quản trị, biên soạn học liệu và kiểm duyệt nội dung (`lingora-admin`).
2. **Source Traceability:** `docs/01-architecture.md` §1.7, M2.3 Artifact #15, `SCR-A-01`..`SCR-A-11`.
3. **Scope & Boundary:** Trình duyệt người dùng của cán bộ vận hành và tác giả (Client Runtime Environment).
4. **Logical vs Physical:** Trách nhiệm logic biên soạn và quản trị; physical đóng gói dạng React/Next.js Client Components.
5. **Inputs:** Nhập liệu bài học, duyệt bài, xuất báo cáo, thao tác tài khoản.
6. **Outputs:** Lệnh gọi Server Actions hoặc HTTP fetch tới Admin BFF (`COMP-APP-02`).
7. **Dependencies:** Phụ thuộc duy nhất vào Layer 2 (`COMP-APP-02: Admin BFF`).
8. **Actors & Roles:** 5 vai trò nghiệp vụ: `Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`.
9. **Owned Rules:** Client-side form validation cho việc nhập liệu bài tập và đề cương.
10. **Owned Authoritative State:** Trạng thái form biên tập tạm thời.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC tự ý chuyển trạng thái xuất bản bài học; KHÔNG ĐƯỢC tự duyệt bài do chính mình biên soạn; KHÔNG ĐƯỢC truy cập trực tiếp kết nối Prisma TCP từ trình duyệt.
12. **Trust Boundary:** Vùng hoàn toàn không tin cậy (Untrusted Public Client Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED`.
14. **Verification Method:** Cổng **D-G5**; kiểm tra ranh giới giao tiếp qua BFF.
15. **Acceptance Criteria:** Mọi thao tác quản trị đều được ủy quyền xử lý tại Server.

---

#### B. Tầng 2: Application / BFF Layer

##### 3. `COMP-APP-01: Learner Application / BFF Orchestrator`
1. **Title & Purpose:** Điều phối logic ứng dụng phía máy chủ cho người học, xử lý phiên làm việc, quản lý cookie an toàn và làm proxy chuyển tiếp yêu cầu AI.
2. **Source Traceability:** M2.3 Artifact #15, `SEQ-01`..`SEQ-07`, `SEQ-10`.
3. **Scope & Boundary:** Vercel Serverless / Node.js Runtime (`lingora-web`).
4. **Logical vs Physical:** Lớp điều phối ứng dụng; physical là Next.js Route Handlers (`/api/ai/gec`) và Server Actions.
5. **Inputs:** Request từ `COMP-PRES-01` kèm session cookie `httpOnly`.
6. **Outputs:** Lệnh gọi tới Layer 3 (Domain Services) hoặc PostgREST/RPC kèm JWT người dùng; proxy request tới AI Server kèm Bearer token.
7. **Dependencies:** Phụ thuộc Layer 3 (Domain Services), Layer 4 (Supabase PostgREST/RPC), Layer 5 (`COMP-EXT-02: AI Service`).
8. **Actors & Roles:** Phục vụ tác nhân `Learner`.
9. **Owned Rules:** Quản lý vòng đời phiên qua cookie an toàn; áp đặt timeout 8.0 giây khi gọi AI GEC; kích hoạt fallback an toàn khi AI gặp sự cố (`is_mock=false` / graceful degraded UI).
10. **Owned Authoritative State:** Không lưu trạng thái nghiệp vụ lâu dài (Stateless Orchestration).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC sử dụng quyền Service Role đặc quyền cho các tác vụ của người học; KHÔNG ĐƯỢC cho phép bypass xác thực JWT; KHÔNG ĐƯỢC sửa đổi kết quả chấm điểm từ Domain Service.
12. **Trust Boundary:** Vùng máy chủ ứng dụng tin cậy (Trusted Application Server Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED` (Route Handler AI & SSR Auth baseline).
14. **Verification Method:** Cổng **D-G5**; kiểm tra cấu hình timeout 8.0s và forward JWT.
15. **Acceptance Criteria:** Mọi kết nối tới AI đều được proxy và quản lý lỗi tập trung.

##### 4. `COMP-APP-02: Admin Application / BFF Orchestrator`
1. **Title & Purpose:** Điều phối logic nghiệp vụ quản trị, biên soạn nội dung, kiểm duyệt và kiểm toán hệ thống.
2. **Source Traceability:** M2.3 Artifact #15, `SEQ-08`, `SEQ-09`.
3. **Scope & Boundary:** Vercel Serverless / Node.js Runtime (`lingora-admin`).
4. **Logical vs Physical:** Lớp điều phối ứng dụng quản trị; physical là Next.js Server Actions và Prisma Client.
5. **Inputs:** Request từ `COMP-PRES-02` kèm session cookie của cán bộ/quản trị viên.
6. **Outputs:** Lệnh thao tác cơ sở dữ liệu qua Prisma kết nối Shared Pooler (port 5432).
7. **Dependencies:** Phụ thuộc Layer 3 (Domain Services), Layer 4 (Postgres qua Prisma).
8. **Actors & Roles:** Phục vụ 5 vai trò cán bộ: `Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`.
9. **Owned Rules:** Cưỡng chế quy tắc phân tách nhiệm vụ (SoD) ở tầng ứng dụng trước khi ghi nhận xuống DB; kiểm tra quyền tự duyệt (Creator cannot self-approve); xuất nhật ký kiểm toán bắt buộc khi thực hiện thao tác nhạy cảm.
10. **Owned Authoritative State:** Không lưu trạng thái nghiệp vụ lâu dài.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC phơi bày kết nối Prisma hoặc quyền Service Role ra client; KHÔNG ĐƯỢC bỏ qua việc kiểm tra vai trò tại Server.
12. **Trust Boundary:** Vùng máy chủ ứng dụng tin cậy (Trusted Application Server Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED` (Prisma kết nối Shared Pooler 5432).
14. **Verification Method:** Cổng **D-G5**, **D-G6**; kiểm tra kiểm soát SoD tại Server Actions.
15. **Acceptance Criteria:** Mọi thao tác xuất bản, chuyển trạng thái đều được kiểm tra vai trò và quyền hạn.

---

#### C. Tầng 3: Domain Services Layer (Headless Business Engines)

##### 5. `COMP-DOM-01: Auth & Identity Domain Service`
1. **Title & Purpose:** Đảm bảo tính toàn vẹn của danh tính người dùng, kiểm tra trạng thái kích hoạt tài khoản (`isActive: boolean`, candidate `SUSPENDED [OPEN DESIGN]`), ánh xạ vai trò và thiết lập ngữ cảnh người dùng.
2. **Source Traceability:** `docs/01-architecture.md` §3.1, M2.3 §4.1, `SEQ-01`.
3. **Scope & Boundary:** Khối logic nghiệp vụ độc lập nền tảng (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Thông tin định danh từ GoTrue JWT (`sub`, `email`, `role`).
6. **Outputs:** Hồ sơ định danh người dùng chuẩn tắc (`Profile`).
7. **Dependencies:** Layer 4 (`COMP-INFRA-01: Postgres Store`).
8. **Actors & Roles:** Mọi vai trò trong hệ thống.
9. **Owned Rules:** Quy tắc đồng bộ danh tính email tin cậy (SEC-D2); quy tắc khóa tài khoản; quy tắc từ chối truy cập khi tài khoản bị đình chỉ.
10. **Owned Authoritative State:** Thuộc tính trạng thái tài khoản trên `Profile`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC tự cấp phát token JWT mà không thông qua GoTrue; KHÔNG ĐƯỢC tự thay đổi vai trò ngoài quy trình phân quyền quản trị (`UC-11`).
12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `CURRENT_APPLIED` (2 vai trò) / `TARGET_DESIGN` (6 vai trò).
14. **Verification Method:** Cổng **D-G5**; rà soát tính nhất quán trạng thái tài khoản.
15. **Acceptance Criteria:** Xử lý danh tính chính xác theo thông tin xác thực từ Supabase Auth.

##### 6. `COMP-DOM-02: Curriculum & Progression Domain Service`
1. **Title & Purpose:** Quản lý cấu trúc phân cấp đề cương (`Course -> Unit -> Lesson -> Exercise`), kiểm soát tính hợp lệ của việc mở khóa bài học và tiến trình tuyến tính.
2. **Source Traceability:** `docs/08-english-a1-curriculum.md`, M2.3 §4.1, `SEQ-02`, `SEQ-04`, `SEQ-07`.
3. **Scope & Boundary:** Khối logic nghiệp vụ đề cương và tiến trình (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** `learnerId`, `lessonId`, kết quả hoàn thành bài học, kết quả nhảy cấp.
6. **Outputs:** Bản ghi tiến độ cập nhật (`UserProgress`, `LearningProgress`).
7. **Dependencies:** Layer 4 (`COMP-INFRA-01: Postgres Store`).
8. **Actors & Roles:** `Learner`, `Organizational Manager` (quản lý xuất bản đề cương).
9. **Owned Rules:** Quy tắc hiển thị Unit (4/4 Lesson trạng thái `PUBLISHED`); bất biến tiến trình: `Progress ≠ Proficiency ≠ Mastery ≠ Readiness`.
10. **Owned Authoritative State:** `LearningProgress.completedContentRatio`, `UserProgress.status`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC tự ý nâng cấp trình độ ngôn ngữ (`verifiedProficiency`); KHÔNG ĐƯỢC ghi nhận `COMPLETED_BY_JUMP` (chỉ ghi nhận `SKIPPED_BY_JUMP`).
12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `TARGET_DESIGN` (Unit hierarchy & LearningProgress).
14. **Verification Method:** Cổng **D-G5**; kiểm tra quy tắc chuyển trạng thái bài học.
15. **Acceptance Criteria:** Quản lý tiến trình chuẩn xác theo các bất biến kiến trúc M2.2.

##### 7. `COMP-DOM-03: Assessment & Diagnostic Domain Service`
1. **Title & Purpose:** Quản lý quy trình kiểm tra đầu vào (Placement Test) và kiểm tra nhảy cấp (Conditional Jump), tính toán phân bổ điểm số theo Mapping A và xác định điểm bắt đầu học (`startingUnit`).
2. **Source Traceability:** `docs/09-placement-and-jump-specification.md`, M2.3 §4.1, `SEQ-03`, `SEQ-04`.
3. **Scope & Boundary:** Khối logic đánh giá và chẩn đoán (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Danh sách câu trả lời bài kiểm tra đánh giá (`assessmentType`, `deliveryMode`).
6. **Outputs:** Bản ghi `AssessmentResult` bất biến, `SkillProfile`, `startingUnit` (candidate DD-06), cờ khóa 24h cooldown nếu thất bại.
7. **Dependencies:** Layer 4 (`COMP-INFRA-01: Postgres Store`).
8. **Actors & Roles:** `Learner`.
9. **Owned Rules:** Phân tách rạch ròi 2 nhánh (Branch A tự khai báo sinh 0 kết quả đánh giá; Branch B kiểm tra chẩn đoán); quy tắc thang điểm Mapping A (0–30 điểm ứng với U1–U6); quy tắc nhảy cấp: đạt $\ge 95\%$ thì mở khóa Unit mục tiêu và gán `SKIPPED_BY_JUMP` (`by_jump=true`) cho các Unit trước đó; thất bại kích hoạt 24h cooldown.
10. **Owned Authoritative State:** `AssessmentResult`, `SkillProfile`, `LearnerProfile.verifiedProficiency`, candidate `starting_unit` trên `Profile`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC cấp chứng chỉ CEFR; không tồn tại entity `AssessmentSession` (HISTORICAL alias); KHÔNG ĐƯỢC tính điểm cho nhánh tự khai báo.

12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `TARGET_DESIGN`.
14. **Verification Method:** Cổng **D-G5**, **D-G7**; kiểm tra đúng dải điểm Mapping A và tỷ lệ 95%.
15. **Acceptance Criteria:** Đảm bảo phân lớp chính xác, bảo toàn bằng chứng đánh giá.

##### 8. `COMP-DOM-04: Spaced Repetition (SRS) Scheduling Domain Service`
1. **Title & Purpose:** Quản lý hàng đợi ôn tập từ vựng ngắt quãng theo thuật toán xác định Policy B, tính toán chu kỳ ôn tập kế tiếp và tương tác với cơ chế ghi nhận nguyên tử.
2. **Source Traceability:** `docs/01-architecture.md` §3.1, M2.3 §4.1, `SEQ-06`.
3. **Scope & Boundary:** Khối logic ôn tập ngắt quãng (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** `srsCardId`, đánh giá nhớ từ (`isCorrect: boolean`, `recallProbability: float`).
6. **Outputs:** Tham số truyền vào hàm lưu trữ nguyên tử `record_review` (interval mới, review count mới).
7. **Dependencies:** Layer 4 (`COMP-INFRA-03: RPC Engine`).
8. **Actors & Roles:** `Learner`.
9. **Owned Rules:** Chính sách khoảng cách Policy B: `[1, 3, 7, 14, 30]` ngày; trả lời sai lập tức reset interval về Stage 1 (1 ngày); hoàn toàn độc lập với AI.
10. **Owned Authoritative State:** Dữ liệu thẻ `user_vocab_srs` và lịch sử `review_logs` (thông qua RPC).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC để AI can thiệp quyết định lịch ôn tập; KHÔNG ĐƯỢC thực hiện cập nhật SRS trực tiếp qua bảng mà không thông qua hàm RPC `record_review`.
12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `CURRENT_APPLIED` (RPC `record_review` 4 tham số).
14. **Verification Method:** Cổng **D-G5**, **D-G7**; kiểm tra tính xác định của Policy B.
15. **Acceptance Criteria:** Tuân thủ đúng chữ ký 4 tham số và nguyên tắc Policy B.

##### 9. `COMP-DOM-05: Lesson Execution & Controlled Retry Domain Service`
1. **Title & Purpose:** Quản lý phiên làm bài tập trong bài học, kiểm soát hạn mức làm lại (Controlled Retry) và xác định điều kiện hoàn thành bài học.
2. **Source Traceability:** `docs/phase-1-m2-2-behavior-uc-activity-state.md` §5, M2.3 §4.1, `SEQ-05`.
3. **Scope & Boundary:** Khối logic thực thi bài học (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Câu trả lời bài tập của người học, số lần thử lại.
6. **Outputs:** Điểm số bài học, trạng thái hoàn thành bài học `COMPLETED`.
7. **Dependencies:** Layer 4 (`COMP-INFRA-01: Postgres Store`).
8. **Actors & Roles:** `Learner`.
9. **Owned Rules:** Chính sách Retry D7: hạn mức làm lại `allowance = max(1, floor(N * 0.10))`; điểm thưởng làm lại đúng nhận tối đa 70% số điểm; hoàn thành bài học khi xử lý hết các bài tập lượt 1 và hạn mức retry hợp lệ; bài tập audio lỗi cho phép fallback text; không lưu bảng `ExerciseAttempt` vật lý (dữ liệu transient trong phiên).
10. **Owned Authoritative State:** Trạng thái hoàn thành bài học thuộc `UC-05` / `BF-10`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC tạo bảng dữ liệu `ExerciseAttempt` vật lý trong DB; KHÔNG ĐƯỢC áp dụng sàn điểm 80% để chặn hoàn thành bài học.
12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `TARGET_DESIGN`.
14. **Verification Method:** Cổng **D-G5**, **D-G7**; kiểm tra công thức tính allowance và 70% credit.
15. **Acceptance Criteria:** Tuân thủ triệt để chính sách Retry D7.

##### 10. `COMP-DOM-06: Content Lifecycle & Moderation Domain Service`
1. **Title & Purpose:** Quản lý quy trình biên soạn, thẩm định, yêu cầu chỉnh sửa, phê duyệt và xuất bản nội dung bài học tuân thủ phân tách nhiệm vụ (SoD).
2. **Source Traceability:** `docs/phase-1-m2-2-behavior-uc-activity-state.md` §2, M2.3 §4.1, `SEQ-08`.
3. **Scope & Boundary:** Khối logic vòng đời học liệu (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Thao tác chuyển trạng thái học liệu, định danh tác giả, người kiểm duyệt, quản lý tổ chức.
6. **Outputs:** Trạng thái bài học (`ContentStatus`), phiên bản bài học, bản sao chỉnh sửa (`supersedesId`).
7. **Dependencies:** Layer 4 (`COMP-INFRA-01: Postgres Store`), `COMP-DOM-07: Admin Audit Service`.
8. **Actors & Roles:** `Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`.
9. **Owned Rules:** Vòng đời 6 trạng thái (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`); SoD: Creator biên soạn/gửi duyệt; Moderator duyệt (`APPROVED`) hoặc yêu cầu sửa (`CHANGES_REQUESTED`); Organizational Manager xuất bản (`PUBLISHED`); Quản trị viên chỉ được phát hành khẩn cấp từ bài học đã ở trạng thái `APPROVED` kèm lý do và ghi `AuditLog`; chỉnh sửa bài đã xuất bản bắt buộc nhân bản bản nháp v2 (`supersedesId` [DD-02]).
10. **Owned Authoritative State:** `Lesson.status`, `Lesson.isPublished`, `Lesson.version`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC cho phép Creator tự duyệt bài của mình; KHÔNG ĐƯỢC cho phép Moderator tự ý xuất bản bài học; KHÔNG ĐƯỢC cho phép chuyển trực tiếp `IN_REVIEW -> PUBLISHED`.
12. **Trust Boundary:** Vùng lõi nghiệp vụ tin cậy (Trusted Domain Core).
13. **Current vs Target Status:** `TARGET_DESIGN` (6 trạng thái vòng đời học liệu).
14. **Verification Method:** Cổng **D-G5**, **D-G6**; kiểm tra ma trận SoD và các điều kiện chuyển trạng thái.
15. **Acceptance Criteria:** 100% các vi phạm SoD đều bị chặn đứng và ghi nhận lỗi.

##### 11. `COMP-DOM-07: Admin Governance & Security Audit Domain Service`
1. **Title & Purpose:** Quản lý tài khoản cán bộ, thiết lập vai trò người dùng, theo dõi thống kê hệ thống và ghi nhận kiểm toán an ninh bất biến.
2. **Source Traceability:** M2.3 §4.1, `SEQ-09`, `UC-11`, `UC-12`, `UC-13`, `UC-14`.
3. **Scope & Boundary:** Khối logic quản trị hệ thống và kiểm toán (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Yêu cầu gán vai trò, thao tác khẩn cấp, sự kiện an ninh nhạy cảm.
6. **Outputs:** Bản ghi nhật ký kiểm toán bất biến (`AuditLog`).
7. **Dependencies:** Layer 4 (`COMP-INFRA-05: Audit Store`).
8. **Actors & Roles:** `Administrator`, `Operations Staff`.
9. **Owned Rules:** Quản trị viên quản lý phân quyền theo nguyên tắc đặc quyền tối thiểu; Operations Staff chỉ có quyền tra cứu hỗ trợ tối thiểu (read-only), không sửa nội dung học liệu; mọi thao tác thay đổi vai trò hoặc can thiệp khẩn cấp đều phải ghi `AuditLog` bất biến (DD-03).
10. **Owned Authoritative State:** `Profile.role`, `AuditLog`.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC sửa đổi hoặc xóa các bản ghi `AuditLog` đã ghi nhận (immutable/append-only).
12. **Trust Boundary:** Vùng quản trị an ninh tối cao (Trusted Security Core).
13. **Current vs Target Status:** `TARGET_DESIGN`.
14. **Verification Method:** Cổng **D-G6**; kiểm tra tính bất biến của nhật ký kiểm toán.
15. **Acceptance Criteria:** Đảm bảo truy vết đầy đủ mọi hành vi can thiệp hệ thống.

##### 12. `COMP-DOM-08: AI Integration & Proxy Domain Service`
1. **Title & Purpose:** Quản lý giao tiếp với dịch vụ AI hỗ trợ (GEC), xử lý cấu trúc request/response, giám sát thời gian phản hồi và thực thi chiến lược fallback phục hồi.
2. **Source Traceability:** `docs/01-architecture.md` §3.1, M2.3 §4.1, `SEQ-10`, ADR-014.
3. **Scope & Boundary:** Khối logic tích hợp AI (Domain Layer).
4. **Logical vs Physical:** Dịch vụ nghiệp vụ logic (Domain Service).
5. **Inputs:** Văn bản bài viết của người học (`original_text`), ngữ cảnh tình huống (`scenario_code`), token JWT người học.
6. **Outputs:** Văn bản gợi ý sửa lỗi (`corrected_text`), danh sách span lỗi phái sinh, thông số viễn trắc (`latency_ms`, `is_mock`).
7. **Dependencies:** Layer 5 (`COMP-EXT-02: Stateless AI Service`).
8. **Actors & Roles:** Phục vụ tác nhân `Learner`.
9. **Owned Rules:** Chuyển tiếp đúng token xác thực người dùng; cưỡng chế timeout cứng 8.0 giây; khi có lỗi hoặc timeout, lập tức trả về văn bản gốc của học viên kèm thông báo suy giảm chức năng, đảm bảo không làm gián đoạn luồng học.
10. **Owned Authoritative State:** Không lưu trạng thái nghiệp vụ (Transient Only).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC lưu trữ hoặc ghi nhận tiến trình học tập; KHÔNG ĐƯỢC can thiệp vào cơ sở dữ liệu học viên; KHÔNG ĐƯỢC triệu gọi trực tiếp từ client.
12. **Trust Boundary:** Vùng biên tích hợp an toàn (Trusted Integration Boundary).
13. **Current vs Target Status:** `CURRENT_APPLIED` (cấu trúc proxy) / `TARGET_DESIGN` (endpoint `/v1/gec/correct`).
14. **Verification Method:** Cổng **D-G5**; kiểm tra cơ chế ngắt mạch và fallback.
15. **Acceptance Criteria:** Đảm bảo AI hoàn toàn độc lập và không thể gây treo hệ thống.

---

#### D. Tầng 4: Persistence & Infrastructure Layer

##### 13. `COMP-INFRA-01: PostgreSQL Relational Database Engine`
1. **Title & Purpose:** Quản lý lưu trữ bền vững toàn bộ dữ liệu quan hệ của hệ thống Lingora (Postgres 15 trên Supabase).
2. **Source Traceability:** `docs/04-data-model.md`, `lingora-admin/prisma/schema.prisma`.
3. **Scope & Boundary:** Nền tảng cơ sở dữ liệu được quản lý (Managed Database Zone).
4. **Logical vs Physical:** Hệ quản trị cơ sở dữ liệu quan hệ; physical là Supabase Postgres 15.
5. **Inputs:** Truy vấn SQL từ PostgREST hoặc Prisma Client (qua Shared Pooler 5432).
6. **Outputs:** Dữ liệu bản ghi dạng quan hệ / JSON.
7. **Dependencies:** Hạ tầng máy chủ Supabase.
8. **Actors & Roles:** Tương tác gián tiếp thông qua các tầng trên.
9. **Owned Rules:** Ràng buộc toàn vẹn quan hệ (khóa chính, khóa ngoại, CHECK constraints per migration `202608140001_init`).
10. **Owned Authoritative State:** Toàn bộ trạng thái bền vững của hệ thống (Course, Lesson, Profile, Progress...).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC tự ý thực thi các logic nghiệp vụ không được bảo vệ bởi constraint hoặc RLS.
12. **Trust Boundary:** Vùng dữ liệu trung tâm được bảo vệ (Protected Data Core).
13. **Current vs Target Status:** `CURRENT_APPLIED` (17 bảng baseline) / `TARGET_SCHEMA` (mô hình 6 vai trò, Unit, AuditLog).
14. **Verification Method:** Cổng **D-G2**, **D-G5**; rà soát tính toàn vẹn khóa ngoại.
15. **Acceptance Criteria:** Lưu trữ bền vững và toàn vẹn dữ liệu theo schema.

##### 14. `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`
1. **Title & Purpose:** Cưỡng chế các quy tắc cách ly dữ liệu giữa các người học và kiểm soát quyền truy cập ở cấp độ từng dòng dữ liệu (Row Level).
2. **Source Traceability:** `docs/04-data-model.md` §3, `SEC-D5`, `SEC-D7`, `SEC-D9`.
3. **Scope & Boundary:** Bộ máy thực thi chính sách tích hợp trong PostgreSQL.
4. **Logical vs Physical:** Lớp bảo mật dữ liệu ở tầng thấp nhất (Database Security Engine).
5. **Inputs:** Danh tính người dùng từ token (`auth.uid()`), dòng dữ liệu đích.
6. **Outputs:** Quyết định cho phép (`PERMIT`) hoặc từ chối (`DENY` - trả về dòng trống hoặc lỗi 42501).
7. **Dependencies:** `COMP-INFRA-01: Postgres Engine`.
8. **Actors & Roles:** Áp dụng cho mọi tác nhân người dùng kết nối qua PostgREST.
9. **Owned Rules:** Người học chỉ được xem và sửa đổi dữ liệu thuộc quyền sở hữu của chính mình (`learner_id = auth.uid()`); chỉ được xem nội dung học liệu đã xuất bản (`is_published = true`); cán bộ quản trị được xem bản thảo theo quyền hạn.
10. **Owned Authoritative State:** Các tập chính sách bảo mật RLS được cài đặt trong CSDL.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC phụ thuộc vào việc client có gửi filter hay không (RLS tự động lọc độc lập với câu lệnh client).
12. **Trust Boundary:** Ranh giới thực thi an ninh tối hậu (Ultimate Security Enforcement Boundary).
13. **Current vs Target Status:** `CURRENT_APPLIED` (chính sách cho Profile, Progress, SRS) / `TARGET_DESIGN` (chính sách mở rộng cho 6 vai trò).
14. **Verification Method:** Cổng **D-G6**; chạy test suite RLS xác nhận từ chối truy cập chéo.
15. **Acceptance Criteria:** Chặn đứng 100% nỗ lực truy cập dữ liệu trái phép ở tầng CSDL.

##### 15. `COMP-INFRA-03: Stored Procedure / RPC Execution Engine`
1. **Title & Purpose:** Thực thi các tác vụ biến đổi dữ liệu phức hợp đòi hỏi tính nguyên tử (Atomicity), khóa dòng (Row-locking) và nhất quán tuyệt đối.
2. **Source Traceability:** `docs/04-data-model.md` §3, `SEC-D10`, M2.3 §4.1, `SEQ-06`.
3. **Scope & Boundary:** Bộ máy thủ tục lưu trữ trong PostgreSQL.
4. **Logical vs Physical:** Stored Procedure / PL/pgSQL Function.
5. **Inputs:** Tham số gọi hàm `record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`.
6. **Outputs:** Trạng thái cập nhật thẻ SRS, bản ghi lịch sử `ReviewLog`, cập nhật streak.
7. **Dependencies:** `COMP-INFRA-01: Postgres Engine`.
8. **Actors & Roles:** `Learner`.
9. **Owned Rules:** Kiểm tra quyền sở hữu thẻ SRS qua `auth.uid()`; khóa dòng bản ghi bằng `FOR UPDATE` để chống race condition; thực hiện cập nhật SRS, chèn log và tăng streak trong cùng một giao dịch nguyên tử.
10. **Owned Authoritative State:** Trạng thái giao dịch SRS và Streak.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC cho phép gọi cập nhật thẻ của người khác; KHÔNG ĐƯỢC nuốt lỗi giao dịch nếu một bước thất bại.
12. **Trust Boundary:** Vùng thực thi giao dịch tin cậy (Trusted Transaction Core).
13. **Current vs Target Status:** `CURRENT_APPLIED` (hàm RPC `record_review` chuẩn tắc).
14. **Verification Method:** Cổng **D-G5**, **D-G6**; kiểm tra tính nguyên tử và chống tranh chấp đồng thời.
15. **Acceptance Criteria:** Giao dịch thành công trọn vẹn hoặc rollback toàn bộ khi có lỗi.

##### 16. `COMP-INFRA-04: Object Media Storage Engine`
1. **Title & Purpose:** Quản lý lưu trữ và phân phối tệp tin đa phương tiện tĩnh (hình ảnh đại diện, âm thanh bài học) tuân thủ kiến trúc hai bucket.
2. **Source Traceability:** `ADR-005`, `SEC-D8 PA2 Direct Storage`.
3. **Scope & Boundary:** Dịch vụ lưu trữ đối tượng Supabase Storage.
4. **Logical vs Physical:** Object Storage Engine; physical là 2 private buckets: `lingora-avatars` và `lingora-media`.
5. **Inputs:** Luồng tải lên/tải xuống tệp tin, token xác thực.
6. **Outputs:** Dữ liệu nhị phân tệp tin hình ảnh/âm thanh.
7. **Dependencies:** Hạ tầng Supabase Storage và chính sách Storage RLS.
8. **Actors & Roles:** `Learner` (upload avatar), `Lesson Creator` (upload media), công chúng (đọc media bài học đã xuất bản).
9. **Owned Rules:** Tuân thủ chuẩn PA2: avatar tối đa 5MB (JPEG/PNG/WebP); media âm thanh tối đa 10MB (MPEG/WAV); truy cập trực tiếp qua đường dẫn RLS mà không dùng signed URLs; không cho phép ghi đè (no-overwrite).
10. **Owned Authoritative State:** Tệp tin nhị phân và siêu dữ liệu đối tượng lưu trữ.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC lưu trữ mã thực thi; KHÔNG ĐƯỢC cho phép người học tải lên tệp âm thanh giả mạo học liệu.
12. **Trust Boundary:** Vùng lưu trữ tài nguyên được kiểm soát (Controlled Media Storage Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED` (2 private buckets với Storage RLS).
14. **Verification Method:** Cổng **D-G5**, **D-G6**; kiểm tra kích thước tối đa và từ chối MIME không hợp lệ.
15. **Acceptance Criteria:** Phân phối media an toàn và kiểm soát quyền hạn nghiêm ngặt.

##### 17. `COMP-INFRA-05: Immutable Security Audit Log Store`
1. **Title & Purpose:** Lưu trữ chuỗi sự kiện kiểm toán an ninh bất biến (Append-Only Audit Ledger) ghi nhận toàn bộ các thao tác nhạy cảm của hệ thống.
2. **Source Traceability:** `docs/phase-1-system-design-plan.md` §8.2 (DD-03), `UC-13`, `P1-NFR-001`.
3. **Scope & Boundary:** Bảng lưu trữ chuyên biệt trong PostgreSQL.
4. **Logical vs Physical:** Append-Only Event Store; physical là bảng `audit_logs` (Target Schema).
5. **Inputs:** Bản ghi sự kiện từ các dịch vụ ứng dụng hoặc database triggers.
6. **Outputs:** Danh sách sự kiện kiểm toán phục vụ tra cứu bảo mật.
7. **Dependencies:** `COMP-INFRA-01: Postgres Engine`.
8. **Actors & Roles:** `Administrator` (tra cứu), các dịch vụ hệ thống (ghi nhận).
9. **Owned Rules:** Tính bất biến (Append-Only): chỉ hỗ trợ thao tác `INSERT` và `SELECT`; cấm hoàn toàn `UPDATE` và `DELETE` đối với mọi người dùng kể cả Administrator; ghi nhận đầy đủ `actor_id`, `action`, `target_type`, `target_id`, `created_at` (UTC).
10. **Owned Authoritative State:** Bản ghi lịch sử kiểm toán toàn hệ thống.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC cho phép bất kỳ ai sửa đổi hoặc xóa bản ghi kiểm toán; KHÔNG ĐƯỢC chứa mật khẩu thô hoặc thông tin bí mật trong payload.
12. **Trust Boundary:** Vùng kiểm toán an ninh tối cao (Tamper-Proof Audit Core).
13. **Current vs Target Status:** `TARGET_DESIGN` (thiết kế theo DD-03, chưa triển khai DDL).
14. **Verification Method:** Cổng **D-G6**; xác minh không có quyền UPDATE/DELETE trên bảng kiểm toán.
15. **Acceptance Criteria:** Ghi vết đầy đủ mọi hành động đặc quyền và bảo đảm không thể can thiệp sửa đổi.

---

#### E. Tầng 5: External Providers Layer

##### 18. `COMP-EXT-01: Supabase GoTrue Authentication Provider`
1. **Title & Purpose:** Cung cấp dịch vụ quản lý danh tính, xác thực thông tin đăng nhập, phát hành và ký số token JWT (ES256 / HS256).
2. **Source Traceability:** `docs/01-architecture.md` §1.7, `SEC-D1`.
3. **Scope & Boundary:** Dịch vụ xác thực độc lập được quản lý (Managed Auth Provider).
4. **Logical vs Physical:** External Auth Engine (Supabase GoTrue).
5. **Inputs:** Email, mật khẩu từ người dùng.
6. **Outputs:** Access token JWT, Refresh token, định danh người dùng `auth.uid()`.
7. **Dependencies:** Hạ tầng Supabase Auth.
8. **Actors & Roles:** Mọi người dùng hệ thống.
9. **Owned Rules:** Mã hóa mật khẩu bảo mật (bcrypt/argon2); ký JWT theo cặp khóa; kiểm tra thời hạn sống của token; thu hồi phiên làm việc khi đăng xuất.
10. **Owned Authoritative State:** Bảng `auth.users` nội bộ của Supabase.
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC lưu trữ thông tin nghiệp vụ học tập trong schema xác thực nội bộ.
12. **Trust Boundary:** Nhà cung cấp danh tính tin cậy (Trusted Identity Provider).
13. **Current vs Target Status:** `CURRENT_APPLIED` (xác thực GoTrue đang vận hành).
14. **Verification Method:** Cổng **D-G5**, **D-G6**; kiểm tra token JWT hợp lệ và mã hóa phiên.
15. **Acceptance Criteria:** Phát hành và kiểm chứng token an toàn theo chuẩn RFC 7519.

##### 19. `COMP-EXT-02: Stateless AI Compute Service (`lingora-ai`)`
1. **Title & Purpose:** Thực thi mô hình học máy T5-small để phát hiện và đề xuất sửa lỗi ngữ pháp tiếng Anh trong bài viết tự do (Supporting GEC Capability).
2. **Source Traceability:** `docs/03-api-contract.md`, ADR-010, ADR-014.
3. **Scope & Boundary:** Nền tảng tính toán AI độc lập (Render / Hugging Face Spaces).
4. **Logical vs Physical:** Microservice Python/FastAPI chạy PyTorch runtime; endpoint `POST /v1/gec/correct`.
5. **Inputs:** Payload chứa `original_text`, `scenario_code` kèm Bearer token JWT người dùng (được forward qua BFF).
6. **Outputs:** JSON chứa `corrected_text`, `error_spans`, `model_version`, viễn trắc (`latency_ms`, `is_mock`).
7. **Dependencies:** Runtime Python 3.11, thư viện PyTorch, mô hình ngôn ngữ T5-small.
8. **Actors & Roles:** Hỗ trợ bài tập tự viết của `Learner`.
9. **Owned Rules:** Hoàn toàn không lưu trạng thái (Stateless); không kết nối CSDL; xác thực JWT bằng public key qua JWKS endpoint; chỉ trả về gợi ý sửa lỗi và viễn trắc thời gian xử lý.
10. **Owned Authoritative State:** Tuyệt đối KHÔNG sở hữu bất kỳ trạng thái bền vững nào (Zero Persistent State).
11. **Forbidden Responsibilities:** KHÔNG ĐƯỢC kết nối tới PostgreSQL của Supabase; KHÔNG ĐƯỢC lưu trữ văn bản của người dùng vào đĩa cứng; KHÔNG ĐƯỢC sở hữu logic chấm điểm hay thăng cấp bài học.
12. **Trust Boundary:** Vùng tính toán AI độc lập và cách ly (Isolated AI Compute Zone).
13. **Current vs Target Status:** `CURRENT_APPLIED` (mock runtime & endpoint info) / `TARGET_DESIGN` (mô hình T5-small thực tế).
14. **Verification Method:** Cổng **D-G5**; rà soát mã nguồn API xác nhận 0 import DB client và xác thực JWT qua JWKS.
15. **Acceptance Criteria:** Hoạt động hoàn toàn không lưu trạng thái và độc lập với dữ liệu chính.

---

## 5. Artifact #14 — Deployment & Runtime Boundary Specification

> **Mã Artifact:** `#14 Deployment/Runtime Boundary`  
> **Biểu đồ trực quan:** [`docs/plantuml/deployment-boundary-m24.puml`](../plantuml/deployment-boundary-m24.puml)  
> **Cổng kiểm định:** `D-G5 — Architecture and API Boundary`, `D-G6 — Security Responsibility`

### 5.1. Mô hình 5 Vùng An ninh & Triển khai Logic (5 Logical Security Zones)

Mô hình triển khai của Lingora được thiết kế dưới dạng các **Vùng an ninh logic (Logical Security Zones)** nhằm xác định rõ ranh giới tin cậy, phạm vi truy cập mạng và quyền hạn của từng khối chức năng mà không phụ thuộc vào chi tiết cấu hình hạ tầng nhà mạng:

```
+----------------------------------------------------------------------------------------------------+
| ZONE 1: UNTRUSTED PUBLIC CLIENT ZONE (Trình duyệt Người học & Cán bộ)                              |
| - Learner Web Client (Next.js Client Components)                                                   |
| - Admin Web Client (Next.js Client Components)                                                     |
| - Không lưu trữ token bảo mật; chỉ sử dụng cookie httpOnly; không kết nối trực tiếp AI/DB          |
+----------------------------------------------------------------------------------------------------+
                                     ↓ HTTPS (TLS [ILLUSTRATIVE])
+----------------------------------------------------------------------------------------------------+
| ZONE 2: TRUSTED APPLICATION SERVER ZONE (Vercel Serverless / Edge Runtime [ILLUSTRATIVE deployment option])                         |
| - Learner BFF (Route Handlers, Proxy AI, 8.0s timeout, session cookie handler)                     |
| - Admin BFF (Server Actions, SoD enforcement, Prisma Shared Pooler connection)                     |
| - Lưu trữ Server-Only API Keys; cách ly hoàn toàn khỏi Service Role đặc quyền phía Learner         |
+----------------------------------------------------------------------------------------------------+
                        ↓ PostgREST / RPC / TCP                    ↓ Proxy Forward JWT
+-------------------------------------------------------+  +-----------------------------------------+
| ZONE 3: MANAGED DATABASE & STORAGE ZONE (Supabase)   |  | ZONE 4: ISOLATED AI COMPUTE ZONE        |
| - Supabase GoTrue Auth Service (Identity & JWT)       |  | - FastAPI Runtime (Python 3.11/PyTorch) |
| - PostgreSQL 15 Engine (RLS Policies & RPC Functions) |  | - Mô hình T5-small GEC Inference       |
| - Private Storage Buckets (Direct RLS Media PA2)      |  | - Không kết nối Database                |
| - Append-Only AuditLog Ledger (Target Schema)         |  | - Xác thực JWT qua JWKS public key     |
+-------------------------------------------------------+  +-----------------------------------------+
                        ▲ Direct Migration / Admin Tooling
+----------------------------------------------------------------------------------------------------+
| ZONE 5: PRIVILEGED INFRASTRUCTURE OPERATIONS ZONE (Nội bộ Cán bộ Kỹ thuật)                         |
| - Migration Execution CLI (Prisma migrate, psql admin connection)                                  |
| - Seed Harnesses & System Diagnostics                                                              |
| - Sử dụng SUPABASE_SERVICE_ROLE_KEY; hoàn toàn cách ly khỏi môi trường runtime người học           |
+----------------------------------------------------------------------------------------------------+
```

---

### 5.2. Ranh giới Quản lý Bí mật & Cách ly Thông tin Xác thực (Secret Boundary Architecture)

Hệ thống phân định nghiêm ngặt quyền truy cập và lưu trữ các lớp bí mật (secrets) theo bảng ma trận quản trị sau:

| Lớp Bí mật (Secret Category) | Vị trí Lưu trữ & Sử dụng (Location) | Phạm vi Cho phép (Allowed Boundaries) | Ranh giới Tuyệt đối Cấm (Strictly Forbidden) |
|---|---|---|---|
| **Public / Anon Credentials**<br>(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Client & Server Runtime (`lingora-web`, `lingora-admin`) | Kết nối tới GoTrue Auth và truy vấn PostgREST có bảo vệ bởi RLS. | Cấm sử dụng để thực hiện các thao tác đòi hỏi quyền hạn quản trị; cấm gán quyền bypass RLS. |
| **Server-Only API Keys**<br>(`AI_API_BASE_URL`, Internal Proxies) | Server Environment (`lingora-web` BFF) | Next.js Route Handlers sử dụng để định tuyến yêu cầu nội bộ tới AI Server. | **Tuyệt đối CẤM phơi bày ra trình duyệt** (không đặt tiền tố `NEXT_PUBLIC_*`); cấm log ra console/telemetry. |
| **Privileged Service Role Key**<br>(`SUPABASE_SERVICE_ROLE_KEY`) | Internal Deployment CLI & Admin Server Actions đặc quyền | Thực hiện migration, bảo trì CSDL định kỳ, nạp dữ liệu seed chuẩn tắc. | **Tuyệt đối CẤM nạp vào môi trường runtime của Learner Web (`lingora-web`)**; cấm chuyển qua client; cấm truyền qua API. |
| **JWT Verification Credentials**<br>(Supabase JWKS URL, `SUPABASE_JWT_SECRET`) | AI Compute Environment (`lingora-ai`) | Xác minh chữ ký ES256/HS256 của token người dùng độc lập không cần gọi DB. | Cấm lưu trữ private key ký số của Supabase Auth; chỉ lưu public key hoặc HMAC verification secret. |

---

### 5.3. Ma trận Phân loại Hiện tại vs Đích vs Tương lai (Current vs Target vs Future Runtime Matrix)

Hệ thống Lingora minh định rõ ràng trạng thái sẵn sàng của từng thành phần hạ tầng và an ninh, ngăn chặn triệt để ngộ nhận target là đã sẵn sàng vận hành:

| Thành phần / Đối tượng Kiến trúc | Phân loại Trạng thái | Hiện trạng Triển khai Thực tế (Current Evidence) | Kế hoạch Vận hành Đích (Target Design) | Điều kiện Tiên quyết Chuyển đổi |
|---|---|---|---|---|
| **Mô hình Phân quyền Vai trò** | `CURRENT_APPLIED` (2 vai trò) / `TARGET_DESIGN` (6 vai trò) | Cơ sở dữ liệu hiện tại chỉ hỗ trợ enum `Role { LEARNER, ADMIN }`. | Toàn bộ 6 vai trò chuẩn tắc được công nhận ở tầng ứng dụng và kiểm soát phân quyền. | Yêu cầu migration mở rộng enum/bảng vai trò trong tương lai (Phase 2). |
| **Chính sách Row Level Security (RLS)** | `CURRENT_APPLIED` (Cơ bản) / `TARGET_DESIGN` (Mở rộng) | Đã áp dụng và kiểm định thành công RLS cho `profiles`, `user_progress`, `user_vocab_srs`, `review_logs`. | Mở rộng RLS cho toàn bộ các bảng `Course`, `Unit`, `Lesson` (theo trạng thái xuất bản) và `AuditLog`. | Cần thiết kế và kiểm thử ma trận chính sách RLS 6 vai trò. |
| **Cơ chế Nhật ký Kiểm toán (`AuditLog`)** | `TARGET_DESIGN` | Chưa có bảng vật lý `audit_logs` trong cơ sở dữ liệu hiện tại. | Bảng lưu trữ bất biến (Append-Only) ghi nhận đầy đủ 11 nhóm sự kiện nhạy cảm (DD-03). | Cần ban hành DDL bảng `audit_logs` trước khi kích hoạt code ghi log. |
| **Khối tính toán AI GEC (`lingora-ai`)** | `CURRENT_APPLIED` (Mock) / `TARGET_DESIGN` (T5-small) | Runtime FastAPI với chế độ `MOCK_MODE=true`, xác thực token qua JWKS, phản hồi giả lập. | Triển khai mô hình học máy T5-small thực tế trên hạ tầng Render/Hugging Face Spaces. | Cần huấn luyện, đóng gói [CANDIDATE packaging option: ONNX/PyTorch, PENDING VALIDATION] và kiểm thử hiệu năng trễ < 2.0s. |
| **Hệ thống Lưu trữ Tệp (`Storage`)** | `CURRENT_APPLIED` | 2 private bucket (`lingora-avatars`, `lingora-media`) tuân thủ chuẩn PA2 direct RLS. | Duy trì chuẩn PA2, tối ưu hóa phân phối nội dung tĩnh. | Đã hoàn tất và sẵn sàng ở Phase 1. |
| **Mở rộng Doanh nghiệp (`Cohorts`)** | `FUTURE_EXTENSION` | Chưa có bảng hoặc logic xử lý nào trong mã nguồn. | Mô-đun mở rộng phục vụ quản lý lớp học và nhóm doanh nghiệp (`UC-15`). | Không nằm trong phạm vi MVP Core Phase 1; bàn giao Phase 3. |

> [!CAUTION]
> **Quy tắc An ninh Bất khả xâm phạm:** Trạng thái `TARGET_DESIGN` tuyệt đối không được coi là đã sẵn sàng vận hành (`NOT PRODUCTION READY`). Mọi nỗ lực thực thi code dựa trên giả định target đã triển khai sẽ bị hệ thống kiểm định đánh rớt.

---

## 6. Artifact #16 — Security Responsibility Matrix

> **Mã Artifact:** `#16 Security Responsibility Matrix`  
> **Biểu đồ trực quan:** [`docs/plantuml/security-matrix-m24.puml`](../plantuml/security-matrix-m24.puml)  
> **Cổng kiểm định:** `D-G6 — Security Responsibility`

### 6.1. Ma trận Trách nhiệm An ninh 6 Ranh giới (The Authoritative Six-Boundary Matrix)

Ma trận dưới đây xác lập quyền hạn và trách nhiệm thực thi trên 6 ranh giới an ninh:
1. **Learner Web:** Kiểm tra ngữ cảnh tại giao diện và BFF của người học (`lingora-web`).
2. **Admin Web:** Kiểm tra ngữ cảnh tại giao diện và BFF của cán bộ quản trị (`lingora-admin`).
3. **Supabase RLS:** Cơ chế thực thi an ninh độc lập tại tầng cơ sở dữ liệu PostgreSQL.
4. **Privileged Service Role:** Ranh giới sử dụng tài khoản đặc quyền (`service_role`).
5. **AI Server:** Ranh giới cách ly của máy chủ trí tuệ nhân tạo (`lingora-ai`).
6. **Audit Responsibility:** Trách nhiệm phát sinh bản ghi nhật ký kiểm toán an ninh.

| # | Thao tác Nghiệp vụ Nhạy cảm (Sensitive Operation) | 1. Learner Web (BFF / App) | 2. Admin Web (BFF / App) | 3. Supabase RLS (Database Core) | 4. Privileged Service Role (Infra / Maintenance) | 5. AI Server (Stateless Inference) | 6. Audit Responsibility (Event Ledger) |
|:---:|---|---|---|---|---|---|---|
| **OP-01** | **Đăng ký & Đăng nhập (`UC-01`)** | Client gửi form; Server Action gọi GoTrue; nhận session cookie httpOnly. | Client gửi form; Server Action gọi GoTrue; nhận session cookie httpOnly. | `profiles` RLS: chỉ cho phép người dùng đọc/sửa hồ sơ của chính mình (`auth.uid() = id`). | `N/A — privileged service-role path` (chỉ dùng khi khởi tạo tài khoản quản trị hệ thống ban đầu). | Không tham gia (Zero Involvement). | GoTrue ghi log xác thực nội bộ; Target emit sự kiện `AUTH_LOGIN` / `AUTH_REGISTER`. |
| **OP-02** | **Cập nhật Mục tiêu & Hồ sơ (`UC-02`)** | Xác thực session; kiểm tra dải giá trị hợp lệ `dailyGoalMin ∈ [5..120]`. | `DENY` (Cán bộ không cập nhật mục tiêu học tập cá nhân thay cho học viên). | `profiles` RLS: cưỡng chế `auth.uid() = id`; từ chối mọi truy cập chéo. | `FORBIDDEN` (Không sử dụng Service Role). | Không tham gia. | Không yêu cầu audit an ninh mức hệ thống (thuộc dữ liệu cá nhân thường lệ). |
| **OP-03** | **Đánh giá Chẩn đoán Đầu vào (`UC-03`)** | Gửi danh sách đáp án; từ chối nếu người học chọn nhánh tự khai báo (Branch A). | `DENY` (Chức năng dành riêng cho người học). | RLS kiểm soát chèn bản ghi `AssessmentResult` gắn chặt với `learner_id = auth.uid()`. | `FORBIDDEN` (Không sử dụng Service Role). | Không tham gia (Tính toán xác định theo Mapping A). | Target emit sự kiện `DIAGNOSTIC_COMPLETED` kèm dải điểm và `startingUnit`. |
| **OP-04** | **Kiểm tra Nhảy cấp Bài học (`UC-04`)** | Kiểm tra cờ 24h cooldown trước khi cho phép bắt đầu bài kiểm tra nhảy cấp. | `DENY`. | RLS kiểm soát chèn `AssessmentResult` (deliveryMode = JUMP); cập nhật Unit `SKIPPED_BY_JUMP`. | `FORBIDDEN`. | Không tham gia. | Target emit sự kiện `JUMP_PASSED` (nếu $\ge 95\%$) hoặc `JUMP_FAILED` (kích hoạt 24h lockout). |
| **OP-05** | **Thực thi Bài học & Retry (`UC-05`)** | Theo dõi số lần thử; áp dụng công thức allowance $10\%$ và credit $70\%$; phiên transient. | `DENY`. | `user_progress` RLS: chỉ chủ sở hữu được ghi nhận trạng thái bài học hoàn thành `COMPLETED`. | `FORBIDDEN`. | Không tham gia (Chấm điểm logic quy chuẩn). | Không yêu cầu audit an ninh (hoạt động học tập thường lệ). |
| **OP-06** | **Ôn tập SRS qua RPC (`UC-06`)** | Nhận kết quả ôn tập; gọi hàm cơ sở dữ liệu `record_review` kèm session JWT. | `DENY`. | RLS ngăn chặn thao tác chèn/sửa trực tiếp; hàm RPC cưỡng chế `auth.uid()` và row-lock. | `FORBIDDEN`. | Không tham gia (Lịch ôn tập tuân thủ Policy B xác định). | Ghi nhận bản ghi lịch sử nguyên tử vào bảng `review_logs`. |
| **OP-07** | **Biên soạn Bản nháp Học liệu (`UC-08`)** | `DENY` (Học viên tuyệt đối không có quyền tác giả bài học). | Xác thực vai trò `Lesson Creator`; lưu bản nháp gắn với `creatorId = auth.uid()`. | Target RLS: Creator chỉ được chèn và sửa bản nháp (`DRAFT`) do chính mình sở hữu. | `FORBIDDEN`. | Không tham gia. | Target emit sự kiện `CONTENT_DRAFT_CREATED` / `CONTENT_DRAFT_UPDATED`. |
| **OP-08** | **Kiểm duyệt & Phê duyệt Bài (`UC-09`)** | `DENY`. | Xác thực vai trò `Moderator`; cưỡng chế quy tắc SoD: `auth.uid() != creatorId`. | Target RLS: Moderator được phép chuyển trạng thái sang `APPROVED` hoặc `CHANGES_REQUESTED`. | `FORBIDDEN`. | Không tham gia. | Target emit sự kiện `CONTENT_REVIEW_APPROVED` hoặc `CONTENT_REVIEW_REJECTED` kèm nhận xét. |
| **OP-09** | **Xuất bản Nội dung Đề cương (`UC-10`)** | `DENY`. | Xác thực vai trò `Organizational Manager`; kiểm tra toàn bộ 4/4 bài học thuộc Unit đã `APPROVED`. | Target RLS: Chỉ Manager mới có quyền đổi trạng thái bài học sang `PUBLISHED`. | `FORBIDDEN`. | Không tham gia. | Target emit sự kiện `CONTENT_PUBLISHED` ghi nhận định danh người xuất bản và phiên bản. |
| **OP-10** | **Phát hành Khẩn cấp Cán bộ (`ADR-020`)** | `DENY`. | Xác thực vai trò `Administrator`; **bắt buộc bài học đã ở trạng thái `APPROVED`**; nhập lý do bắt buộc. | Target RLS / DB Constraint: Chặn đứng mọi cố gắng phát hành khẩn cấp từ bài học chưa qua kiểm duyệt (`IN_REVIEW`). | `N/A — privileged service-role path` (áp dụng nếu thực hiện qua script bảo trì nội bộ). | Không tham gia. | **BẮT BUỘC emit `AuditLog` khẩn cấp** chứa lý do can thiệp, snapshot bài học và admin ID. |
| **OP-11** | **Quản lý Tài khoản & Phân quyền (`UC-11`)** | `DENY`. | Xác thực vai trò `Administrator`; thực hiện gán vai trò tuân thủ đặc quyền tối thiểu. | Target RLS: Chỉ Administrator được phép cập nhật cột `role` trên bảng `profiles`. | `N/A — privileged service-role path` (dùng trong script khởi tạo hệ thống). | Không tham gia. | **BẮT BUỘC emit `AuditLog`** ghi nhận người thực hiện, vai trò cũ, vai trò mới và thời điểm. |
| **OP-12** | **Xem Báo cáo Tổng thể Hệ thống (`UC-12`)** | `DENY`. | Xác thực vai trò `Administrator` hoặc `Operations Staff`; giới hạn trường PII. | Target RLS: Giới hạn quyền truy cập các view thống kê tổng hợp; cấm truy cập dữ liệu nhạy cảm. | `FORBIDDEN`. | Không tham gia. | Emit sự kiện `ANALYTICS_ACCESSED` khi truy xuất báo cáo đặc quyền quy mô lớn. |
| **OP-13** | **Tra cứu Nhật ký Kiểm toán (`UC-13`)** | `DENY`. | Xác thực vai trò `Administrator`; chỉ hỗ trợ đọc dữ liệu (Read-Only). | Target RLS: Cấm hoàn toàn mọi thao tác chèn/sửa/xóa từ người dùng; chỉ cấp quyền đọc cho Admin. | `N/A — privileged service-role path` (hệ thống trích xuất sao lưu kiểm toán). | Không tham gia. | Bản thân thao tác tra cứu kiểm toán được ghi vết kiểm toán để chống lạm quyền (`AUDIT_READ`). |
| **OP-14** | **Hỗ trợ Kỹ thuật & Người học (`UC-14`)** | Gửi ticket hỗ trợ của chính mình; tra cứu trạng thái ticket cá nhân. | Xác thực vai trò `Operations Staff`; chỉ xem thông tin hỗ trợ cần thiết; cấm xem mật khẩu/token. | FUTURE_MIGRATION security design boundary (CURRENT_APPLIED has no SupportTicket persistence): Operations Staff được đọc ticket và thông tin công khai; không được sửa đổi bài học. | `FORBIDDEN`. | Không tham gia. | Emit sự kiện `SUPPORT_TICKET_PROCESSED` khi cán bộ thực hiện thao tác can thiệp hỗ trợ. |
| **OP-15** | **Gợi ý Chữa lỗi Viết Tự do (`BF-14`)** | Gửi văn bản bài viết tới Next.js Route Handler Proxy `/api/ai/gec` kèm session token. | `DENY`. | Không truy cập DB; không tạo bản ghi tiến trình; dữ liệu hoàn toàn transient. | `FORBIDDEN`. | Xác thực token qua JWKS; trả về text gợi ý sửa lỗi và viễn trắc; không ghi đĩa/DB. | Không ghi audit an ninh; emit viễn trắc hệ thống (`latency_ms`, `is_mock`). |

---

### 6.2. Các Đường dẫn Từ chối Nghiêm ngặt (Strict Negative Authorization Paths)

Kiến trúc an ninh thiết lập 6 rào cản ngăn chặn tuyệt đối các hành vi vi phạm toàn vẹn hệ thống:

```
[KỊCH BẢN VI PHẠM 1: CREATOR TỰ DUYỆT BÀI]
Creator submit duyệt bài của mình ──► Admin Server Action ──► [auth.uid() == creatorId?] ──► CẮT ĐỨT: 403 Forbidden (SOD_VIOLATION_SELF_REVIEW)

[KỊCH BẢN VI PHẠM 2: MODERATOR TỰ Ý XUẤT BẢN]
Moderator yêu cầu xuất bản ──► Admin Server Action ──► [Role == MODERATOR?] ──► CẮT ĐỨT: 403 Forbidden (SOD_VIOLATION_MODERATOR_PUBLISH)

[KỊCH BẢN VI PHẠM 3: HỌC VIÊN TRUY CẬP DỮ LIỆU CHÉO]
Learner A truy vấn kết quả của Learner B ──► Supabase PostgREST ──► [auth.uid() != learner_id] ──► CẮT ĐỨT: RLS DENY (HTTP 404 / Empty Set)

[KỊCH BẢN VI PHẠM 4: AI TỰ GHI TIẾN TRÌNH HỌC TẬP]
AI Server gửi lệnh chèn điểm/mastery ──► Không có DB connection string ──► CẮT ĐỨT: Lỗi kết nối (Architectural Invariant)

[KỊCH BẢN VI PHẠM 5: PHƠI BÀY SERVICE ROLE RA CLIENT]
Client cố gắng đọc Service Role Key ──► Biến môi trường không có NEXT_PUBLIC_ ──► CẮT ĐỨT: Undefined ở Client Bundle

[KỊCH BẢN VI PHẠM 6: PHÁT HÀNH BÀI CHƯA DUYỆT]
Admin yêu cầu emergency publish bài IN_REVIEW ──► Domain Service ──► [Status != APPROVED] ──► CẮT ĐỨT: 400 Bad Request (INVALID_LIFECYCLE_TRANSITION)
```

---

## 7. Authentication & Identity Propagation Architecture

1. **Giao thức Xác thực Nền tảng:** Sử dụng Supabase GoTrue Auth cung cấp cơ chế xác thực danh tính người dùng bằng email/password. Khi người dùng xác thực thành công, GoTrue phát hành cặp mã thông báo JSON Web Token (JWT) và Refresh Token.
2. **Cấu trúc Token & Tính tương thích Ký số:**
   - Token JWT chứa các claim chuẩn tắc: `sub` (UUID của người dùng), `email`, `role` (vai trò cơ sở dữ liệu), `exp` (thời điểm hết hạn).
   - Kiến trúc hỗ trợ cả hai thuật toán kiểm chứng chữ ký: thuật toán bất đối xứng **ES256** (sử dụng cặp khóa công khai xác minh qua endpoint JWKS của Supabase) và thuật toán đối xứng **HS256** (sử dụng `SUPABASE_JWT_SECRET`). Máy chủ AI (`lingora-ai`) ưu tiên xác thực token thông qua JWKS public key, đảm bảo không cần chia sẻ bí mật đối xứng giữa các vùng triển khai.
3. **Ranh giới Phiên làm việc Phía Máy chủ (Server-Side Session Boundary):**
   - Phía người học (`lingora-web`), access token và refresh token được quản lý hoàn toàn phía máy chủ thông qua cookie bảo mật mang cờ `httpOnly`, `Secure` (trên production), và `SameSite=Lax`.
   - **Tuyệt đối cấm** lưu trữ token trong `localStorage` hoặc `sessionStorage` của trình duyệt nhằm triệt tiêu hoàn toàn nguy cơ bị đánh cắp phiên qua tấn công Cross-Site Scripting (XSS).
4. **Lan truyền Danh tính Hệ thống (Identity Propagation):**
   - Khi trình duyệt gửi request tới Next.js Route Handlers hoặc Server Actions, cookie phiên được phân giải phía server.
   - Khi ứng dụng gọi tới Supabase PostgREST hoặc RPC, access token được đính kèm vào tiêu đề `Authorization: Bearer <token>`. Tầng cơ sở dữ liệu tự động trích xuất `auth.uid()` từ token để áp dụng các chính sách RLS.
   - Khi ứng dụng gọi tới AI Server để chấm bài viết tự do (`/api/ai/gec`), Route Handler Proxy tự động chuyển tiếp Bearer token của người học sang AI Server. AI Server kiểm chứng chữ ký token để xác thực danh tính người học mà không bao giờ kết nối tới cơ sở dữ liệu chính.
5. **Cấm Kết nối Trực tiếp Browser-to-AI:** Toàn bộ lưu lượng giao tiếp giữa người học và AI Server bắt buộc phải đi qua Next.js Route Handler Proxy. Kiến trúc cấm tuyệt đối mọi nỗ lực kết nối trực tiếp từ trình duyệt tới máy chủ AI nhằm ngăn ngừa lộ lọt địa chỉ hạ tầng nội bộ và đảm bảo áp đặt giới hạn timeout/ngắt mạch tập trung.

---

## 8. Authorization & RBAC Architecture (6 Canonical Roles)

### 8.1. Danh mục 6 Vai trò Chuẩn tắc (The 6 Canonical Roles)

Hệ thống Lingora chuẩn hóa chính xác 6 vai trò người dùng nghiệp vụ:

| Vai trò Chuẩn tắc | Mục đích Nghiệp vụ & Phạm vi Trách nhiệm | Loại Tài khoản | Môi trường Tương tác |
|---|---|---|---|
| **`Learner`** | Người học ngôn ngữ; tham gia học bài, làm bài tập, luyện phản xạ, ôn tập SRS và quản lý lộ trình cá nhân. | Người dùng cuối | Web Learner Portal (`lingora-web`) |
| **`Lesson Creator`** | Tác giả biên soạn học liệu; khởi tạo, biên tập bài học, gán bài tập và gửi yêu cầu phê duyệt nội dung. | Cán bộ chuyên môn | Web Admin Portal (`lingora-admin`) |
| **`Moderator`** | Chuyên viên thẩm định nội dung; rà soát bản thảo, yêu cầu chỉnh sửa hoặc phê duyệt chất lượng học liệu. | Cán bộ kiểm định | Web Admin Portal (`lingora-admin`) |
| **`Organizational Manager`** | Quản lý đào tạo/tổ chức; lập kế hoạch đề cương, giao việc biên soạn và chịu trách nhiệm xuất bản Unit ra catalog. | Cán bộ quản lý | Web Admin Portal (`lingora-admin`) |
| **`Operations Staff`** | Cán bộ vận hành kỹ thuật; tiếp nhận yêu cầu hỗ trợ, xử lý sự cố người học và theo dõi báo cáo hoạt động. | Cán bộ vận hành | Web Admin Portal (`lingora-admin`) |
| **`Administrator`** | Quản trị viên hệ thống tối cao; quản lý tài khoản, phân quyền vai trò, tra cứu kiểm toán và xử lý khẩn cấp. | Quản trị cấp cao | Web Admin Portal (`lingora-admin`) |

> [!NOTE]
> **Ranh giới Tác nhân Hạ tầng:** Tài khoản `Privileged Service Role` đóng vai trò ranh giới thực thi hạ tầng kỹ thuật (Infrastructure Boundary), được cô lập hoàn toàn cho việc bảo trì, nạp dữ liệu seed và chạy migration. Tuyệt đối không đại diện cho bất kỳ vai trò người dùng nghiệp vụ nào.

---

### 8.2. Ma trận Phân quyền Quyền hạn (RBAC Permission Matrix)

| Nhóm Chức năng / Quyền hạn | `Learner` | `Lesson Creator` | `Moderator` | `Organizational Manager` | `Operations Staff` | `Administrator` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Học tập & Bài tập (`UC-03..07`, `BF-14`)** | **Sở hữu** | Cấm | Cấm | Cấm | Cấm | Cấm |
| **Khởi tạo & Sửa Bản nháp (`UC-08`)** | Cấm | **Sở hữu (bản nháp của mình)** | Cấm | Cấm | Cấm | Cấm |
| **Thẩm định & Phê duyệt (`UC-09`)** | Cấm | Cấm | **Thẩm định (không phải bài mình)** | Cấm | Cấm | Cấm |
| **Lập Kế hoạch & Giao việc (`BF-02`)** | Cấm | Cấm | Cấm | **Sở hữu** | Cấm | Giám sát |
| **Xuất bản Nội dung (`UC-10`)** | Cấm | Cấm | Cấm | **Xuất bản Đề cương** | Cấm | Chỉ duyệt khẩn cấp bài `APPROVED` |
| **Xử lý Ticket Hỗ trợ (`UC-14`)** | Gửi ticket | Cấm | Cấm | Cấm | **Xử lý Hỗ trợ** | Giám sát |
| **Tra cứu Nhật ký Kiểm toán (`UC-13`)** | Cấm | Cấm | Cấm | Cấm | Cấm | **Đọc Toàn quyền (Read-Only)** |
| **Phân quyền & Khóa Tài khoản (`UC-11`)**| Cấm | Cấm | Cấm | Cấm | Cấm | **Quản trị Tối cao** |

---

## 9. Decision DD-03 — Audit Architecture Specification

### 9.1. Phán quyết 3 tầng cho DD-03 (Three-Tier Verdict for DD-03)

Căn cứ kế hoạch M2.4, quyết định DD-03 được phân định minh bạch thành 3 tầng:

1. **Tầng 1 — LOCKED BEHAVIOR (Hành vi Chuẩn tắc - Không mở lại):**
   - Toàn bộ các thao tác nghiệp vụ và bảo mật nhạy cảm bắt buộc phải phát sinh bản ghi kiểm toán.
   - Bản ghi kiểm toán bắt buộc phải chứa tối thiểu 4 trường ngữ nghĩa: Tác nhân (`actor`), Hành động (`action`), Đối tượng tác động (`target`), và Thời điểm (`timestamp`).
   - Bản ghi kiểm toán có tính chất **bất biến tuyệt đối (Immutable & Append-Only)**: cấm cập nhật (`UPDATE`) và cấm xóa (`DELETE`) dưới mọi hình thức.
2. **Tầng 2 — DESIGN SPECIFICATION (Đặc tả Thiết kế M2.4 - Đóng ở cấp độ thiết kế):**
   - Danh mục sự kiện an ninh nhạy cảm (Security-Sensitive Event Catalog §9.2).
   - Định danh tác nhân: sử dụng `actor_id` (UUID từ `auth.users`) kèm `actor_role` tại thời điểm thực thi.
   - Danh mục hành động và đối tượng chuẩn hóa.
   - Thời gian ghi nhận: chuẩn UTC ISO 8601 được tạo lập từ đồng hồ máy chủ (`NOW()`).
   - Phân loại nhóm sự kiện kiểm toán (§9.3).
3. **Tầng 3 — OPEN PHYSICAL REPRESENTATION (Biểu diễn Vật lý - Giữ nguyên Trạng thái Mở):**
   - Cấu trúc chi tiết của trường siêu dữ liệu `metadata JSONB` (giữ mở để linh hoạt cấu trúc theo yêu cầu phát triển thực tế).
   - Cơ chế phát sinh ghi log: lựa chọn giữa Database Triggers tự động hay Ứng dụng Server Actions chủ động phát sinh (giữ mở cho Phase 2).
   - Việc thu thập thông tin địa chỉ IP và danh tính thiết bị của client: giữ mở ở trạng thái `CANDIDATE / PENDING VALIDATION` (chỉ thu thập khi có căn cứ pháp lý và bảo vệ dữ liệu PII).
   - Chính sách lưu trữ lâu dài (retention period) và lưu trữ lạnh (cold storage archival).
   - **Tuyệt đối KHÔNG viết mã SQL DDL tạo bảng `audit_logs` tại mốc M2.4.**

---

### 9.2. Danh mục Sự kiện Kiểm toán Nhạy cảm (Security Event Catalog)

| Mã Sự kiện (Event Code) | Nhóm Sự kiện | Tác nhân Gây ra | Hành động Ghi nhận (`action`) | Đối tượng Tác động (`target`) | Mức độ Nghiêm trọng |
|---|---|---|---|---|:---:|
| `AUTH_LOGIN_FAILED` | Xác thực | Vô danh / Người dùng | Đăng nhập thất bại quá số lần quy định | `Profile` (email) | Cảnh báo (WARNING) |
| `ROLE_ASSIGNED` | Phân quyền | `Administrator` | Thay đổi hoặc gán vai trò người dùng | `Profile` (`target_user_id`) | Nghiêm trọng (CRITICAL) |
| `ACCOUNT_SUSPENDED` | Quản trị | `Administrator` | Khóa hoặc đình chỉ tài khoản | `Profile` (`target_user_id`) | Nghiêm trọng (CRITICAL) |
| `CONTENT_APPROVED` | Vòng đời học liệu | `Moderator` | Thẩm định và duyệt bản thảo bài học | `Lesson` (`lesson_id`) | Thông tin (INFO) |
| `CONTENT_CHANGES_REQ` | Vòng đời học liệu | `Moderator` | Yêu cầu chỉnh sửa bản thảo bài học | `Lesson` (`lesson_id`) | Thông tin (INFO) |
| `CONTENT_PUBLISHED` | Vòng đời học liệu | `Organizational Manager` | Xuất bản Unit/Lesson ra catalog học tập | `Unit` / `Lesson` | Thông tin (INFO) |
| `CONTENT_EMERGENCY_PUB` | Khẩn cấp | `Administrator` | Phát hành khẩn cấp bài đã `APPROVED` | `Lesson` (`lesson_id`) | Tối cao (ALERT) |
| `CONTENT_EMERGENCY_ARCH`| Khẩn cấp | `Administrator` | Lưu trữ khẩn cấp bài học đã xuất bản | `Lesson` (`lesson_id`) | Tối cao (ALERT) |
| `DIAGNOSTIC_COMPLETED` | Đánh giá | `Learner` | Hoàn thành bài chẩn đoán đầu vào | `AssessmentResult` | Thông tin (INFO) |
| `JUMP_LOCKOUT_TRIGGERED`| Đánh giá | `Learner` | Thất bại bài nhảy cấp, kích hoạt 24h khóa | `LearnerProfile` | Cảnh báo (WARNING) |
| `AUDIT_LOG_INSPECTED` | Kiểm toán | `Administrator` | Truy vấn tra cứu nhật ký kiểm toán hệ thống | `AuditLog` | Cảnh báo (WARNING) |

---

### 9.3. Phân loại Trường Siêu dữ liệu Kiểm toán (Audit Field Classification)

Nhằm tuân thủ nguyên tắc giảm thiểu dữ liệu cá nhân (PII Minimization) và bảo vệ an toàn thông tin, các trường dữ liệu kiểm toán được phân định như sau:

```
+----------------------------------------------------------------------------------------------------+
| 1. BẮT BUỘC (REQUIRED - Core Audit Schema):                                                         |
|    - id: UUID (Khóa chính)                                                                         |
|    - event_code: VARCHAR(50) (Mã sự kiện chuẩn hóa)                                                |
|    - actor_id: UUID (Khóa ngoại tham chiếu người thực hiện)                                         |
|    - actor_role: VARCHAR(50) (Vai trò của tác nhân tại thời điểm thực hiện)                         |
|    - action: VARCHAR(100) (Động từ mô tả hành vi)                                                  |
|    - target_type: VARCHAR(50) (Loại đối tượng bị tác động: LESSON, USER, UNIT...)                    |
|    - target_id: VARCHAR(100) (Khóa định danh đối tượng)                                            |
|    - created_at: TIMESTAMPTZ (Thời điểm UTC chính xác)                                              |
+----------------------------------------------------------------------------------------------------+
| 2. ỨNG VIÊN CHỜ THẨM ĐỊNH (CANDIDATE / PENDING VALIDATION - Metadata JSONB):                       |
|    - metadata: JSONB (Dữ liệu bổ sung: lý do khẩn cấp, điểm số đánh giá, version bài học)         |
|    - client_ip_hash: VARCHAR(64) (Mã băm IP bảo vệ quyền riêng tư, chỉ dùng khi có yêu cầu)        |
|    - user_agent_summary: VARCHAR(100) (Thông tin trình duyệt tóm tắt)                               |
+----------------------------------------------------------------------------------------------------+
| 3. TUYỆT ĐỐI CẤM (STRICTLY FORBIDDEN / OUT OF SCOPE):                                              |
|    - Cấm lưu trữ mật khẩu người dùng (kể cả mật khẩu đã băm).                                      |
|    - Cấm lưu trữ access token, refresh token hoặc secret keys.                                      |
|    - Cấm lưu trữ số thẻ thanh toán hoặc dữ liệu định danh tài chính.                                |
|    - Cấm lưu trữ toàn văn bài viết của học viên vào trường kiểm toán an ninh.                       |
+----------------------------------------------------------------------------------------------------+
```

---

## 10. Decision DD-10 — Role Enforcement Split & Evolution Architecture

### 10.1. Phán quyết 3 tầng cho DD-10 (Three-Tier Verdict for DD-10)

1. **Tầng 1 — LOCKED BEHAVIOR (Hành vi Chuẩn tắc):**
   - Hệ thống chuẩn hóa mục tiêu trên 6 vai trò người dùng chuẩn tắc.
   - Cưỡng chế an ninh bắt buộc phải hiện diện ở tầng cơ sở dữ liệu thông qua Row Level Security (RLS); kiểm tra ứng dụng **không bao giờ thay thế RLS**.
   - Phân tách nhiệm vụ (SoD) và cách ly tài khoản đặc quyền là bất biến bắt buộc.
2. **Tầng 2 — DESIGN SPECIFICATION (Đặc tả Thiết kế M2.4 - Đóng ở cấp độ thiết kế):**
   - Ánh xạ từ mô hình 2 vai trò hiện tại (`CURRENT_APPLIED: LEARNER, ADMIN`) sang mô hình 6 vai trò mục tiêu (`TARGET_DESIGN`).
   - Phân định rõ ràng trách nhiệm kiểm tra:
     - **Tầng Ứng dụng (App Check):** Cưỡng chế SoD logic, kiểm tra quyền tự duyệt bài, chặn đứng điều hướng giao diện trái phép, kiểm soát tham số nghiệp vụ trước khi gọi CSDL.
     - **Tầng Cơ sở dữ liệu (Database RLS):** Cưỡng chế cô lập dữ liệu theo dòng, ngăn chặn truy cập dữ liệu chéo của học viên, ngăn chặn sửa đổi bài học chưa được phê duyệt độc lập hoàn toàn với code ứng dụng.
     - **Tầng Tài khoản Đặc quyền (Privileged Service Role):** Cách ly trong môi trường vận hành hạ tầng; cấm nạp vào web client của người học.
   - Cam kết tương thích ngược (Backward Compatibility Guarantee): Quá trình chuyển đổi từ 2 vai trò sang 6 vai trò tuyệt đối không làm suy yếu bất kỳ chính sách RLS hiện hành nào đã được kiểm thử ở M1.3 và M1.4.
3. **Tầng 3 — OPEN PHYSICAL REPRESENTATION (Biểu diễn Vật lý - Giữ nguyên Trạng thái Mở):**
   - Trình tự chi tiết các bước chạy migration cơ sở dữ liệu để chuyển đổi kiểu enum hoặc cấu trúc bảng vai trò.
   - Kịch bản backfill dữ liệu tài khoản hiện có trong giai đoạn chuyển đổi.
   - Các file mã nguồn SQL RLS cụ thể.
   - **Tuyệt đối KHÔNG viết mã SQL RLS hoặc migration DDL tại mốc M2.4.**

---

### 10.2. Lộ trình Tiến hóa An ninh (Security Evolution & Role Mapping)

```
[GIAI ĐOẠN 1: CURRENT_APPLIED]
PostgreSQL Database áp dụng: enum Role { LEARNER, ADMIN }
- LEARNER: Người học (được bảo vệ bởi RLS cá nhân trên profiles, progress, srs).
- ADMIN: Toàn bộ cán bộ biên soạn, kiểm duyệt và quản trị viên chia sẻ chung định danh quyền hạn ADMIN ở mức CSDL.
                  ↓
[GIAI ĐOẠN 2: TARGET_DESIGN (M2.4 Đặc tả)]
Phân tách logic 6 vai trò tại tầng Ứng dụng & Server Actions:
- LEARNER ──► Cưỡng chế RLS cá nhân (auth.uid() = learner_id)
- CÁN BỘ BIÊN SOẠN & VẬN HÀNH được phân tách nhiệm vụ (SoD) nghiêm ngặt tại Server Actions:
  * Lesson Creator (Chỉ sửa bài nháp của mình)
  * Moderator (Chỉ duyệt bài người khác biên soạn, không được xuất bản)
  * Organizational Manager (Chỉ xuất bản bài đã APPROVED)
  * Operations Staff (Chỉ tra cứu hỗ trợ người học, không sửa bài)
  * Administrator (Quản trị vai trò, tra cứu audit, phát hành khẩn cấp bài APPROVED)
                  ↓
[GIAI ĐOẠN 3: FUTURE_MIGRATION (Phase 2 Triển khai)]
Migration mở rộng lược đồ CSDL sang cấu trúc 6 vai trò độc lập;
Cập nhật toàn diện chính sách PostgreSQL RLS tương ứng cho từng vai trò ở mức DB Core.
```

---

## 11. Comprehensive Current vs Target vs Future Classification Matrix

Toàn bộ các thực thể, ranh giới, vai trò và chính sách an ninh của Lingora được phân định trạng thái rõ ràng nhằm đảm bảo tính trung thực tuyệt đối của hồ sơ thiết kế:

| Đối tượng Kiến trúc / Ranh giới | Trạng thái Phân loại | Minh chứng Hiện tại (Current Evidence) | Đặc tả Thiết kế Đích (Target Specification) | Lộ trình Tương lai (Future Evolution) |
|---|:---:|---|---|---|
| **Vai trò Người học (`Learner`)** | `CURRENT_APPLIED` | Enum `LEARNER` trong Prisma schema và migration `202608140001_init`. | Duy trì đầy đủ các quyền học tập, làm bài tập và ôn tập SRS cá nhân. | Mở rộng tính năng theo dõi tiến trình nâng cao. |
| **Vai trò Cán bộ (`Creator, Mod, Mgr, Ops`)** | `TARGET_DESIGN` | Cơ sở dữ liệu hiện tại gộp chung trong quyền `ADMIN`. | Phân tách thành 4 vai trò cán bộ độc lập, cưỡng chế SoD tại tầng Server Actions. | Migration tách cột/bảng vai trò độc lập ở tầng cơ sở dữ liệu. |
| **Vai trò Quản trị viên (`Administrator`)** | `CURRENT_APPLIED` | Enum `ADMIN` trong schema hiện tại. | Quản trị tài khoản, kiểm tra audit, thực hiện phát hành khẩn cấp có lý do nghiệp vụ. | Quản trị đa tổ chức (Multi-tenant B2B). |
| **RLS Người học Cá nhân** | `CURRENT_APPLIED` | 4 chính sách RLS hiện hành: `profiles`, `user_progress`, `user_vocab_srs`, `review_logs`. | Giữ nguyên vẹn, cấm làm suy yếu ranh giới cách ly dữ liệu giữa các người học. | Tối ưu hóa hiệu năng index RLS. |
| **RLS Quản trị Phân cấp** | `TARGET_DESIGN` | Chưa có chính sách RLS riêng biệt cho từng vai trò cán bộ. | Chính sách RLS kiểm soát bài viết theo trạng thái (`isPublished`, `creatorId`, `reviewerId`). | Viết và kiểm thử mã nguồn SQL RLS ở Phase 2. |
| **Lưu trữ Nhật ký Kiểm toán** | `TARGET_DESIGN` | Chưa có bảng vật lý `audit_logs`. | Đặc tả thiết kế 11 mã sự kiện nhạy cảm, cấu trúc bất biến (DD-03). | Ban hành DDL và triển khai trigger/app logging ở Phase 2. |
| **Tích hợp AI GEC (`/v1/gec/correct`)** | `CURRENT_APPLIED` (Proxy) / `TARGET_DESIGN` (Core) | Route Handler Proxy đã có; FastAPI đang chạy ở chế độ `MOCK_MODE=true`. | Triển khai mô hình T5-small thực tế, timeout 8.0s, xác thực JWKS, fallback an toàn. | Nâng cấp mô hình lượng hóa hoặc hỗ trợ đa ngôn ngữ. |
| **Mở rộng Nhóm & Tổ chức (`Cohorts`)** | `FUTURE_EXTENSION` | Không tồn tại trong Phase 1. | Ranh giới kết nối tương lai (`UC-15`) phục vụ khách hàng B2B. | Thiết kế và hiện thực hóa ở Phase 3. |

---

## 12. Open Decision Firewall & Downstream Compatibility

Kiến trúc thành phần và an ninh M2.4 được thiết kế theo nguyên tắc **tương thích và dung nạp các quyết định mở (Open Decision Tolerant)**, tuyệt đối không tự ý đóng sớm bất kỳ quyết định nào chưa được phê duyệt:

1. **DD-03 (Audit Physical Structure):** Giữ mở cấu trúc `metadata JSONB` và cơ chế phát sinh trigger/app; kiến trúc thiết lập giao diện ghi nhận tổng quát chấp nhận mọi cấu trúc payload hợp lệ.
2. **DD-10 (Role Enforcement Split):** Giữ mở kịch bản migration vật lý; kiến trúc phân tầng đảm bảo phân tách trách nhiệm giữa App Check và RLS mà không phụ thuộc vào thời điểm chạy migration.
3. **Các Ngưỡng Năng lực & Sư phạm D3 §N:** Các ngưỡng làm chủ kiến thức (`ConceptMastery`), ngưỡng chuyển Unit (`LevelReadiness`), tham số dừng bài thích ứng (`Adaptive Stopping Criteria`), và trọng số tính điểm hoàn toàn không bị cứng hóa (hardcode) trong kiến trúc. Các Domain Services được thiết kế dưới dạng tham số hóa (Config-Driven / Threshold-Agnostic).
4. **Cấu hình Đề cương D4 §Q:** Cấu hình ngôn ngữ tiếng Trung (`hidePinyin: true`), phiên bản chuẩn HSK (2.0 vs 3.0), và định dạng bài đọc phức hợp (`READING`) được dung nạp dưới dạng lớp cấu hình độc lập mà không làm thay đổi kiến trúc dịch vụ cốt lõi.
5. **DD-06 (Placement Persistence HOW):** Việc lưu trữ điểm chẩn đoán và `starting_unit` trên `Profile` (candidate) hay bảng lịch sử chuyên biệt được kiến trúc dịch vụ `AssessmentService` đóng gói hoàn toàn, đảm bảo giao diện ứng dụng không bị ảnh hưởng khi quyết định vật lý cuối cùng được đưa ra.

---

## 13. Validation Gates Evidence (D-G5 & D-G6 Design Evidence)

> [!IMPORTANT]
> **Tuyên bố Giới hạn Thẩm định:** Bằng chứng dưới đây là bằng chứng phân tích và thiết kế kiến trúc (Phase 1 Design Evidence) nhằm thỏa mãn tiêu chí hoàn thành mốc M2.4. Cổng D-G5 và D-G6 **TUYỆT ĐỐI CHƯA ĐƯỢC CÔNG NHẬN LÀ ĐÓNG HOÀN TOÀN CHO GIAI ĐOẠN VẬN HÀNH (NOT CLAIMED AS CLOSED FOR PRODUCTION RUNTIME)** vì cần kiểm chứng thực tế bằng mã nguồn ở các mốc sau.

### 13.1. Bằng chứng Cổng D-G5 — Architecture and API Boundary

- **Đầu vào (Input):** Các Artifacts #11, #12, #15 từ M2.3; Artifact #13 và #14 từ M2.4; tài liệu kiến trúc `docs/01-architecture.md`; tài liệu hợp đồng `docs/03-api-contract.md`; các quyết định ADR-002, ADR-005, ADR-008, ADR-010, ADR-014.
- **Phương pháp Thẩm định (Validation Method):** Rà soát phân tầng 5 lớp và 19 thành phần phần mềm đối chiếu với ranh giới Web Learner, Web Admin, Supabase và AI Server; kiểm tra tính toàn vẹn của nguyên tắc phụ thuộc một chiều; kiểm tra tính chất stateless của AI Server; rà soát tính nguyên vẹn 100% byte-identical của file `docs/03-api-contract.md`.
- **Kết quả Thẩm định (Verdict):** **PASS (Cấp độ Thiết kế M2.4)**.
- **Minh chứng Cụ thể (Evidence):**
  1. Phân tầng 5 lớp xác lập rõ ràng quyền sở hữu luật và dữ liệu; không có chu trình phụ thuộc ngược chiều (§4.1).
  2. Dịch vụ AI (`lingora-ai`) được cô lập hoàn toàn trong Zone 4; không có kết nối cơ sở dữ liệu; sở hữu duy nhất `corrected_text` tạm thời; timeout 8.0s và fallback an toàn được quản lý tại Layer 2 (`COMP-APP-01`) (§4.2).
  3. Toàn bộ 10 bề mặt API từ M2.3 được kế thừa nguyên vẹn; file `docs/03-api-contract.md` hoàn toàn không bị chỉnh sửa.

---

### 13.2. Bằng chứng Cổng D-G6 — Security Responsibility

- **Đầu vào (Input):** Artifact #16 Ma trận An ninh 6 ranh giới; ranh giới vùng triển khai #14; danh mục 6 vai trò chuẩn tắc; các quyết định an ninh SEC-D1..D10; quyết định DD-03 và DD-10.
- **Phương pháp Thẩm định (Validation Method):** Duyệt từng dòng trong 15 nhóm thao tác nhạy cảm đối chiếu với 6 ranh giới thực thi; xác minh cả 2 cột kiểm tra phân quyền ứng dụng (App Check) và cưỡng chế cơ sở dữ liệu (RLS) đều hiện diện đồng thời; xác minh tài khoản Service Role được cô lập và có phạm vi sử dụng rõ ràng; xác minh các kịch bản từ chối (negative paths) và trách nhiệm ghi log kiểm toán.
- **Kết quả Thẩm định (Verdict):** **PASS (Cấp độ Thiết kế M2.4)**.
- **Minh chứng Cụ thể (Evidence):**
  1. Ma trận an ninh 6 ranh giới (§6.1) định nghĩa đầy đủ cơ chế cưỡng chế cho 15 nhóm thao tác nhạy cảm; không có bất kỳ thao tác nào chỉ dựa vào kiểm tra giao diện đơn thuần (zero UI-only checks).
  2. Kiểm tra phân quyền ứng dụng và cưỡng chế RLS luôn song hành; RLS đóng vai trò chốt chặn an ninh tối hậu độc lập với tầng ứng dụng.
  3. Tài khoản đặc quyền `Privileged Service Role` được định rõ phạm vi (`N/A — privileged service-role path` cho migration/seed), tuyệt đối cấm đưa vào runtime của người học (`lingora-web`).
  4. Sáu kịch bản từ chối nghiêm ngặt (SoD negative paths §6.2) được xác lập chi tiết: Creator tự duyệt bị chặn đứng, Moderator tự xuất bản bị chặn đứng, truy cập dữ liệu chéo bị RLS chặn đứng, AI tự ghi tiến trình bị triệt tiêu ở mức kiến trúc mạng.
  5. Mọi thao tác quản trị đặc quyền và phát hành khẩn cấp đều có chủ thể chịu trách nhiệm phát sinh kiểm toán `AuditLog` (§9.2).

---

## 14. Secondary Documents Synchronization Plan

Để duy trì tính toàn vẹn và nhất quán của toàn bộ kho tài liệu chuẩn tắc, mốc M2.4 thực hiện đồng bộ hóa tối thiểu có kiểm soát vào 2 vị trí được phê duyệt:

1. **[`docs/01-architecture.md`](01-architecture.md) — Bổ sung Mục 3.8:**
   - Thêm phần tóm tắt tham chiếu kiến trúc M2.4 (Cross-Reference Summary) kết nối với tài liệu đặc tả chuẩn tắc `docs/phase-1-m2-4-architecture-security.md`.
   - Giữ nguyên toàn bộ các mục nội dung khác của tài liệu kiến trúc.
2. **[`docs/05-traceability-matrix.md`](05-traceability-matrix.md) — Bổ sung Mục 10:**
   - Thêm bảng truy vết ma trận M2.4 ánh xạ từ Yêu cầu kỹ thuật (`P1-FR`, `P1-NFR`) → Tính năng MVP → Use Case (`UC-01`..`15`) → Behavioral Family (`BF-01`..`15`) → Thành phần phần mềm (#13) → Vùng an ninh (#14) → Ranh giới an ninh cưỡng chế (#16).
   - Chỉ sử dụng các mã định danh chuẩn tắc hiện hữu; không phát sinh bất kỳ ID mới nào.

---

## 15. Anti-Drift & Boundary Verification Checklist

| Tiêu chí Kiểm định Bất biến | Kết quả Kiểm tra | Ghi chú & Ranh giới |
|---|:---:|---|
| **1. Mã định danh Artifacts chuẩn tắc** | **PASS** | Chuẩn xác #13 Component Architecture, #14 Deployment/Runtime Boundary, #16 Security Responsibility Matrix. |
| **2. Danh mục 6 Vai trò Chuẩn tắc** | **PASS** | Chỉ có 6 vai trò: Administrator, Lesson Creator, Moderator, Operations Staff, Learner, Organizational Manager. Service role là tác nhân hạ tầng kỹ thuật. |
| **3. Phân định 2 vai trò hiện tại vs 6 vai trò đích** | **PASS** | Mô hình hóa minh bạch hiện tại (2 vai trò) và đích (6 vai trò) theo quyết định DD-10. |
| **4. Không ngộ nhận Target là đã sẵn sàng vận hành** | **PASS** | Mọi thành phần mục tiêu đều dán nhãn `TARGET_DESIGN`; khẳng định rõ `NOT PRODUCTION READY`. |
| **5. Xử lý 3 tầng cho quyết định DD-03** | **PASS** | Locked Behavior + Design Specification + Open Physical Representation (giữ mở metadata JSONB, trigger/app emission, IP fields, DDL). |
| **6. Xử lý 3 tầng cho quyết định DD-10** | **PASS** | Locked Behavior + Design Specification + Open Physical Representation (giữ mở migration sequencing, không viết SQL RLS). |
| **7. Ma trận An ninh đầy đủ 6 ranh giới** | **PASS** | Bao quát Learner Web, Admin Web, Supabase RLS, Privileged Service Role, AI Server, Audit trên 15 thao tác nhạy cảm. |
| **8. Phân định rõ ràng App Check vs Database RLS** | **PASS** | Kiểm tra ứng dụng không thay thế RLS; RLS là chốt chặn an ninh tối hậu tại cơ sở dữ liệu. |
| **9. Cách ly Tuyệt đối Tài khoản Đặc quyền** | **PASS** | `SUPABASE_SERVICE_ROLE_KEY` cấm tuyệt đối nạp vào runtime người học và client trình duyệt. |
| **10. Cưỡng chế Đường dẫn Từ chối SoD** | **PASS** | Ngăn chặn Creator tự duyệt, Moderator tự xuất bản, truy cập dữ liệu chéo và phát hành bài chưa duyệt. |
| **11. AI Hoàn toàn Không sở hữu Dữ liệu Chính** | **PASS** | AI Server stateless, sở hữu duy nhất `corrected_text` tạm thời; timeout 8.0s, fallback an toàn. |
| **12. Không sáng chế Mã định danh hoặc Thực thể ma** | **PASS** | Không có `UC-16/17/18`, `BF-16`, không tồn tại entity `AssessmentSession` (HISTORICAL alias), không có `ExerciseAttempt`. |
| **13. Bảo lưu nguyên vẹn các Quyết định Mở** | **PASS** | Toàn bộ các ngưỡng và chính sách mở từ D3 §N, D4 §Q, DD-06 được bảo lưu ở trạng thái `OPEN`. |
| **14. Kế thừa trọn vẹn Bất biến M2.2 & M2.3** | **PASS** | Bảo toàn các chính sách D5 (Jump 95%, 24h), D6 (Mapping A), D7 (Retry 10%/70%), D8 (SRS Policy B), D9 (Streak date boundary). |
| **15. Bảo toàn File Hợp đồng API `docs/03-api-contract.md`** | **PASS** | Giữ nguyên 100% byte-identical / READ-ONLY; không có bất kỳ ký tự nào bị sửa đổi. |
| **16. Tính hợp lệ Cú pháp PlantUML** | **PASS** | Toàn bộ các file `.puml` có đúng một cặp `@startuml` / `@enduml`, không có trailing whitespace. |
