# MASTER IMPLEMENTATION, TEST, DEMO & REPORT PLAN (PHASE 2)

> **Mã tài liệu:** `plans/master-implementation-and-report-plan.md`  
> **Giai đoạn:** Phase 2 — System Implementation, Verification, Demonstration & Academic Reporting  
> **Trạng thái:** `READY FOR HUMAN REVIEW` (Draft completed post M2.6 Acceptance; Implementation NOT STARTED)  
> **Căn cứ gốc:**  
> - `HANDOFF.md` (M2.6 Accepted, Checkpoint `4c8a7dbd48c8c1a90c8a3e194b267916700bad2b`)  
> - `docs/phase-1-m2-6-design-handoff.md` (Design-to-Implementation Handoff Specification)  
> - `docs/phase-1-m2-5-design-validation.md` (Artifact #20 Design Validation Report)  
> - `docs/phase-1-m2-4-architecture-security.md` (19 Components, 5 Zones, 6 Boundaries, 11 Audit Events)  
> - `docs/phase-1-m2-3-sequence-api-service-boundary.md` (Sequences SEQ-01..10, API Surfaces)  
> - `docs/phase-1-m2-2-behavior-uc-activity-state.md` (15 UCs, 15 BFs, D1–D9 Rules, State Machines)  
> - `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (Artifacts #1..#5)  
> - `docs/03-api-contract.md` (Read-only Canonical AI Service Contract)  
> - `ADR-014` & `ADR-029` (SE Core + AI Supporting Capability; M2.6 Formal Acceptance)  
> **Ranh giới nghiêm ngặt:**  
> 1. **KẾ HOẠCH DUY NHẤT (SINGLE MASTER PLAN):** Tài liệu này là kế hoạch tổng thể chỉ đạo toàn bộ quá trình lập trình (Implementation), kiểm thử (Testing), chuẩn bị dữ liệu & kịch bản trình diễn (Demo), và thu thập bằng chứng báo cáo học thuật (Report Evidence) cho Giai đoạn 2.  
> 2. **ZERO IMPLEMENTATION IN THIS TASK:** Tuyệt đối KHÔNG viết mã nguồn ứng dụng, KHÔNG chạy migration, KHÔNG thay đổi schema thực tế, KHÔNG triển khai RLS, KHÔNG sửa hợp đồng `docs/03-api-contract.md`, KHÔNG tạo commit code trong task này.  
> 3. **PHÂN ĐỊNH TRẠNG THÁI CHUẨN TẮC:** Phân biệt tuyệt đối giữa `CURRENT` (hệ thống/code/db đang tồn tại thực tế), `TARGET` (thiết kế đã chốt tại M2.2–M2.6), `FUTURE` (mở rộng chưa thuộc MVP), và `PROPOSED` (mục tiêu cần triển khai trong Phase 2). Tuyệt đối không mô tả target design như hệ thống đã chạy trên production.

---

## MỤC LỤC TỔNG THỂ

1. [AUDIT HIỆN TRẠNG KHO LƯU TRỮ (CURRENT VS TARGET VS GAP)](#1-audit-hiện-trạng-kho-lưu-trữ-current-vs-target-vs-gap)
2. [CĂN CỨ THIẾT KẾ CHUẨN TẮC & NGUYÊN TẮC GIẢI QUYẾT XUNG ĐỘT](#2-căn-cứ-thiết-kế-chuẩn-tắc--nguyên-tắc-giải-quyết-xung-đột)
3. [PHÂN RÃ HỆ THỐNG MỤC TIÊU THEO THÀNH PHẦN KIẾN TRÚC](#3-phân-rã-hệ-thống-mục-tiêu-theo-thành-phần-kiến-trúc)
4. [THỨ TỰ THỰC THI & KIẾN TRÚC PHỤ THUỘC TRIỂN KHAI](#4-thứ-tự-thực-thi--kiến-trúc-phụ-thuộc-triển-khai)
5. [KẾ HOẠCH TRIỂN KHAI CƠ SỞ DỮ LIỆU & LỘ TRÌNH MIGRATION](#5-kế-hoạch-triển-khai-cơ-sở-dữ-liệu--lộ-trình-migration)
6. [KẾ HOẠCH TRIỂN KHAI AUTH, RBAC, RLS & PHÂN TÁCH NHIỆM VỤ (SOD)](#6-kế-hoạch-triển-khai-auth-rbac-rls--phân-tách-nhiệm-vụ-sod)
7. [KẾ HOẠCH TRIỂN KHAI VÒNG ĐỜI HỌC VIÊN (LEARNER CORE ENGINE)](#7-kế-hoạch-triển-khai-vòng-đời-học-viên-learner-core-engine)
8. [KẾ HOẠCH TRIỂN KHAI ĐÁNH GIÁ NĂNG LỰC & ĐIỂM XUẤT PHÁT (ASSESSMENT)](#8-kế-hoạch-triển-khai-đánh-giá-năng-lực--điểm-xuất-phát-assessment)
9. [KẾ HOẠCH TRIỂN KHAI THỬ THÁCH NHẢY CÓC, LÀM LẠI, SRS & CHUỖI HỌC (INTELLIGENCE)](#9-kế-hoạch-triển-khai-thử-thách-nhảy-cóc-làm-lại-srs--chuỗi-học-intelligence)
10. [KẾ HOẠCH TRIỂN KHAI QUẢN TRỊ NỘI DUNG & DUYỆT BÀI HỌC (CONTENT GOVERNANCE)](#10-kế-hoạch-triển-khai-quản-trị-nội-dung--duyệt-bài-học-content-governance)
11. [QUY CHUẨN GIAO DIỆN LẬP TRÌNH API & LỚP ĐIỀU PHỐI BFF](#11-quy-chuẩn-giao-diện-lập-trình-api--lớp-điều-phối-bff)
12. [CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG & BỘ KHUNG KIỂM THỬ KHẢ THI](#12-chiến-lược-kiểm-thử-tự-động--bộ-khung-kiểm-thử-khả-thi)
13. [BỘ DỮ LIỆU KIỂM THỬ & DỮ LIỆU MẪU TRÌNH DIỄN (SEED DATA)](#13-bộ-dữ-liệu-kiểm-thử--dữ-liệu-mẫu-trình-diễn-seed-data)
14. [KỊCH BẢN TRÌNH DIỄN HỆ THỐNG LIÊN TỤC (DEMO PLAN)](#14-kịch-bản-trình-diễn-hệ-thống-liên-tục-demo-plan)
15. [MA TRẬN BẰNG CHỨNG BÁO CÁO HỌC THUẬT (REPORT EVIDENCE MATRIX)](#15-ma-trận-bằng-chứng-báo-cáo-học-thuật-report-evidence-matrix)
16. [KHUNG KIỂM ĐỊNH HIỆU NĂNG & TIÊU CHÍ PHI CHỨC NĂNG (NFR VALIDATION)](#16-khung-kiểm-định-hiệu-năng--tiêu-chí-phi-chức-năng-nfr-validation)
17. [MÔ HÌNH QUẢN TRỊ MỐC & CỔNG NGHIỆM THU (GATED MILESTONE MODEL)](#17-mô-hình-quản-trị-mốc--cổng-nghiệm-thu-gated-milestone-model)
18. [ÁNH XẠ TRIỂN KHAI VÀO CẤU TRÚC BÁO CÁO HỌC THUẬT](#18-ánh-xạ-triển-khai-vào-cấu-trúc-báo-cáo-học-thuật)
19. [SỔ ĐĂNG KÝ RỦI RO & KHOẢNG TRỐNG KỸ THUẬT (RISK REGISTER)](#19-sổ-đăng-ký-rủi-ro--khoảng-trống-kỹ-thuật-risk-register)
20. [LỘ TRÌNH TỔNG THỂ GIAI ĐOẠN 2 (MASTER ROADMAP M3.1..M3.10)](#20-lộ-trình-tổng-thể-giai-đoạn-2-master-roadmap-m31m310)
21. [RÀNG BUỘC CỨNG VÀ KỶ LUẬT THỰC THI (HARD CONSTRAINTS)](#21-ràng-buộc-cứng-và-kỷ-luật-thực-thi-hard-constraints)

---

## 1. AUDIT HIỆN TRẠNG KHO LƯU TRỮ (CURRENT VS TARGET VS GAP)

Để đảm bảo tính trung thực tuyệt đối, bảng audit này đối soát chi tiết giữa **mã nguồn/hạ tầng thực tế đang chạy (CURRENT)** và **thiết kế đã được chấp thuận tại M2.2–M2.6 (TARGET)**.

### 1.1. Hiện Trạng Thực Tế (CURRENT)
- **Ứng dụng Web Học viên (`lingora-web`):**
  - Khung công nghệ: Next.js 15.1.0, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui.
  - Mã nguồn hiện có: Vỏ ứng dụng cơ bản (`src/app/page.tsx`), trang xác thực đăng nhập/đăng ký (`src/app/(auth)/login`, `(auth)/register`), proxy định tuyến AI (`src/app/api/ai/chat/route.ts`, `api/ai/srs/route.ts`), gói ngôn ngữ i18n (`vi`, `en`), tiện ích Supabase client/server (`src/lib/supabase/`).
  - Kiểm thử hiện có: 14/14 bài test Vitest chạy đạt (`tests/unit/`).
  - **Thực tế vắng mặt:** Hoàn toàn chưa có giao diện học bài (Lesson Player), chưa có trình làm bài tập tương tác (Exercise Engine), chưa có màn hình chẩn đoán (Diagnostic Placement), chưa có giao diện nhảy cóc (Jump), chưa có màn hình ôn tập ngắt quãng (SRS Review), chưa có bảng theo dõi chuỗi học tập (Streak View), chưa có hồ sơ năng lực (Skill Profile).
- **Ứng dụng Quản trị & Cơ sở dữ liệu (`lingora-admin`):**
  - Khung công nghệ: Prisma ORM 6.2.1 kết nối PostgreSQL trên Supabase.
  - Lược đồ hiện tại (`prisma/schema.prisma`): Chứa 17 mô hình dữ liệu từ Phase 0 (`Language`, `Profile`, `Course`, `CourseTranslation`, `Unit`, `UnitTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, `Exercise`, `UserProgress`, `UserVocabSrs`, `ReviewLog`, `ChatScenario`, `ChatScenarioTranslation`, `AuditLog`).
  - Enum hiện tại: `Role` (6 giá trị), `ContentStatus` (6 giá trị), `Cefr` (6 giá trị), `ExerciseType` (chỉ có 3 giá trị: `MCQ`, `FILL_BLANK`, `REORDER`), `ProgressStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
  - Dữ liệu di chuyển: Thư mục `prisma/migrations` chứa 3 file migration lịch sử M1 (`init`, `profile_triggers`, `security_policies`).
  - **Thực tế vắng mặt:** Hoàn toàn chưa có bảng phiên bản bài học `lesson_revisions` (DD-02), chưa có bảng kết quả chẩn đoán `assessment_results` (DD-06), chưa có bảng hồ sơ kỹ năng `skill_profiles` (DD-06), chưa có bảng quản lý phân công bài học, thiếu 2 loại bài tập mục tiêu (`LISTENING`, `GRAMMAR`) trong enum `ExerciseType`, thiếu trạng thái `LOCKED` và `SKIPPED_BY_JUMP` trong `ProgressStatus`. Chưa có bất kỳ giao diện biên soạn hay kiểm duyệt nào trong `lingora-admin`.
- **Dịch vụ Trí tuệ Nhân tạo (`lingora-ai/api`):**
  - Khung công nghệ: FastAPI 0.115.6, Python 3.11, Pydantic v2.
  - Endpoint hiện có: `/health/live`, `/health/ready`, `/health`, `/v1/model/info`, và 2 endpoint tương thích ngược cũ `/v1/srs/schedule`, `/v1/chat/roleplay`.
  - Kiểm thử hiện có: 37/37 bài test Pytest chạy đạt (`tests/`).
  - **Thực tế vắng mặt:** Endpoint mục tiêu sửa lỗi ngữ pháp `/v1/gec/correct` (đặc tả tại `docs/03-api-contract.md`) HOÀN TOÀN CHƯA ĐƯỢC TRIỂN KHAI.
- **Hạ tầng Dữ liệu & An ninh Supabase:**
  - Cơ sở dữ liệu Postgres 15 tại vùng `ap-southeast-1`. Đã thiết lập 2 storage bucket (`lingora-avatars`, `lingora-media`).
  - Chính sách RLS hiện có trên database chỉ là phiên bản sơ khai M1 (kiểm tra 2 vai trò nhị phân `USER`/`ADMIN`), chưa triển khai ma trận RLS cho 6 vai trò và chưa cài đặt các hàm chặn vi phạm phân tách nhiệm vụ (SoD).

### 1.2. Thiết Kế Mục Tiêu (TARGET M2.2–M2.6)
- **Hệ thống 6 vai trò chuẩn tắc:** `Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`.
- **19 thành phần kiến trúc chuẩn tắc:** Phân rã 5 tầng (`COMP-PRES-01/02`, `COMP-APP-01/02`, `COMP-DOM-01..08`, `COMP-INFRA-01..05`, `COMP-EXT-01/02`).
- **5 vùng an ninh logic:** Zone 1 Client, Zone 2 Trusted BFF, Zone 3 Supabase Core, Zone 4 Isolated AI, Zone 5 Privileged Ops.
- **Vòng đời nội dung 6 trạng thái bất biến:** `Draft → In Review → Changes Requested → Draft → In Review → Approved → Published → Archived`, cơ chế nhân bản bản thảo (Clone-to-Draft v2 qua `supersedes_id`), điều kiện đơn vị hiển thị (Unit 4/4 Published).
- **Quy tắc phân tách nhiệm vụ (SoD):** Creator không tự duyệt, Moderator không xuất bản, Manager xuất bản thông thường, Administrator xuất bản khẩn cấp kèm lý do bắt buộc và ghi log kiểm toán `CONTENT_EMERGENCY_PUB`.
- **Động cơ học tập & bài tập hợp nhất (Unified Exercise):** 5 dạng bài tập (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), hạn mức làm lại có kiểm soát `max(1, floor(N * 0.10))` theo từng lượt làm bài, bảo lưu điểm trần 70%.
- **Động cơ đánh giá năng lực & xuất phát điểm:** Bài chẩn đoán ~25–30 câu hỏi theo thiết kế, Mapping A tất định (0–30 điểm thô ra Unit 1–6), Skip chuyển về Unit 1 `UNVERIFIED` (0 AssessmentResult, 0 SkillProfile), thi lại tạo bản ghi `AssessmentResult` bất biến mới. Thử thách nhảy cóc (Jump) ngưỡng ≥95%, hồi chiêu 24h, gán cờ `by_jump = true` (`SKIPPED_BY_JUMP`), không tính hoàn thành Unit.
- **Thuật toán ôn tập ngắt quãng (SRS):** Chu kỳ tất định Policy B `[1, 3, 7, 14, 30]`, trả lời sai đặt lại về Stage 1 (+1 ngày), chạy độc lập qua RPC cơ sở dữ liệu `record_review`.
- **Chuỗi ngày học liên tục (Streak):** Tính toán theo ngày dương lịch cục bộ thuộc múi giờ IANA của học viên, bỏ lỡ 1 ngày đặt lại về 1, không có cơ chế đóng băng (freeze) trong Core MVP.
- **Dịch vụ AI hỗ trợ:** Stateless FastAPI proxy qua Next.js Route Handler, thời gian ngắt kết nối nghiêm ngặt 8.0s, mạch ngắt dự phòng luật cơ sở khi AI quá tải hoặc gặp lỗi.
- **Kiểm toán an ninh:** 11 sự kiện kiểm toán chuẩn tắc ghi vào bảng append-only `audit_logs`.

### 1.3. Bảng Đối Soát Khoảng Trống Triển Khai (Gap Analysis Matrix)

| Lĩnh vực | Hiện trạng (CURRENT) | Thiết kế mục tiêu (TARGET) | Khoảng trống triển khai (GAP) | Phân loại |
|---|---|---|---|---|
| **Database Schema** | 17 models Phase 0; enum 3 ExerciseType; không có bảng versioning. | 5 dạng bài tập; thực thể `lesson_revisions`, `assessment_results`, `skill_profiles`. | Cần migration mở rộng (Expand phase) tạo 3 bảng mới, sửa đổi 4 bảng hiện có, cập nhật 2 enum. | `CORE GAP` |
| **Auth & Authorization** | Supabase Auth sơ khai; RLS kiểm tra nhị phân 2 vai trò (`USER`, `ADMIN`). | Mô hình 6 vai trò chuẩn tắc; kiểm tra kép App AuthZ và Database RLS; SoD triggers. | Nâng cấp toàn diện ma trận chính sách RLS cho 6 vai trò; viết trigger chặn tự duyệt/tự xuất bản. | `SECURITY GAP` |
| **Learner Core UI** | Chỉ có trang chủ trống và form đăng nhập/đăng ký. | Luồng học trọn vẹn: cây giáo trình, trình phát bài học, 5 dạng tương tác bài tập. | Xây dựng toàn bộ giao diện và logic client-side của phân hệ học tập trong `lingora-web`. | `FEATURE GAP` |
| **Assessment Engine** | Chưa có logic chẩn đoán hay bài tập kiểm tra đầu vào. | Khung chẩn đoán ~25–30 câu; Mapping A; lưu kết quả bất biến; Jump ≥95% kèm hồi chiêu 24h. | Triển khai domain service đánh giá năng lực, quản lý phiên làm bài Jump và tính toán điểm xuất phát. | `CORE GAP` |
| **Learning Intelligence** | SRS mock ở tầng AI (legacy `/v1/srs/schedule`); chưa có streak logic. | SRS tất định Policy B chạy bằng RPC Postgres; Streak tính theo múi giờ IANA người dùng. | Viết RPC `record_review` trên database; chuyển logic SRS về Core; lập trình bộ tính toán Streak. | `CORE GAP` |
| **Content Management** | Chưa có giao diện biên soạn hay kiểm duyệt nội dung. | Luồng 6 trạng thái: giao việc, soạn thảo, nộp duyệt, yêu cầu sửa, phê duyệt, xuất bản. | Xây dựng toàn bộ phân hệ quản trị nội dung trong `lingora-admin` tuân thủ nghiêm ngặt SoD. | `GOVERNANCE GAP` |
| **AI / GEC Service** | Chỉ có mock SRS và roleplay cũ; `/v1/gec/correct` chưa tồn tại. | Dịch vụ AI sửa lỗi ngữ pháp tiếng Anh T5-small phi trạng thái; timeout 8.0s; fallback. | Lập trình endpoint `/v1/gec/correct` trong `lingora-ai`; cấu hình client proxy và fallback tại BFF. | `INTEGRATION GAP` |
| **Audit & Governance** | Bảng `audit_logs` có cấu trúc cũ (chứa `entity_type`, `entity_id`). | Chuẩn 4 trường bất biến + `metadata JSONB`; ghi nhận 11 sự kiện kiểm toán chuẩn tắc. | Chuyển đổi cấu trúc bảng `audit_logs` theo DD-03; tích hợp phát thải log tại BFF và database. | `AUDIT GAP` |

---

## 2. CĂN CỨ THIẾT KẾ CHUẨN TẮC & NGUYÊN TẮC GIẢI QUYẾT XUNG ĐỘT

Mọi hoạt động triển khai trong Phase 2 bắt buộc phải tuân thủ nghiêm ngặt các quyết định chuẩn tắc đã được đóng băng. Tuyệt đối không tự ý phát minh hoặc tái thiết kế.

### 2.1. Danh Mục Các Bất Biến Thiết Kế Không Thể Thương Lượng
1. **6 Vai trò Chuẩn tắc:** `Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager` (Không coi khóa kỹ thuật `service_role` là vai trò thứ 7).
2. **15 Ca Sử Dụng & 15 Luồng Nghiệp Vụ:** `UC-01` đến `UC-15` và `BF-01` đến `BF-15`. Trong đó, `UC-15` (Quản lý Nhóm học & Cohort) là ranh giới mở rộng tương lai (`FUTURE_EXTENSION`), không thuộc MVP.
3. **9 Quyết Định Sản Phẩm Đóng Băng (D1–D9):**
   - **D1:** Kế hoạch bài học do Quản lý (Manager) chỉ định phân công; Creator chỉ biên soạn bài được giao.
   - **D2:** Phân tách nhiệm vụ tuyệt đối: Creator không tự duyệt; Moderator không xuất bản; Manager xuất bản thông thường; Admin xuất bản khẩn cấp có lý do.
   - **D3:** Cấm sửa đè nội dung đã xuất bản; bắt buộc nhân bản tạo bản thảo mới (Clone-to-Draft v2 qua `supersedes_id`).
   - **D4:** Mô hình bài tập hợp nhất (Unified Exercise); cấm tạo bảng `Exam` hay `QuestionBank`.
   - **D5:** Thử thách nhảy cóc (Jump) áp dụng cho đơn vị liền kề; đạt khi điểm ≥95%; trượt bị khóa hồi chiêu 24 giờ.
   - **D6:** Đánh giá chẩn đoán (Diagnostic) có độ dài ~25–30 câu hỏi theo thiết kế; Mapping A tính điểm thô 0–30 ra Đơn vị xuất phát (Unit 1–6); không cấp chứng chỉ CEFR.
   - **D7:** Hạn mức làm lại có kiểm soát `max(1, floor(N * 0.10))` tính theo từng lượt làm bài; làm lại đúng nhận tối đa 70% điểm; hoàn thành bài học không phụ thuộc trần điểm 80%.
   - **D8:** Ôn tập ngắt quãng (SRS) tuân thủ Policy B tất định `[1, 3, 7, 14, 30]` ngày; độc lập hoàn toàn với AI; chạy qua RPC cơ sở dữ liệu.
   - **D9:** Chuỗi ngày học liên tục (Streak) tính theo ngày lịch cục bộ thuộc múi giờ IANA của học viên; bỏ lỡ 1 ngày đặt lại về 1; không có tính năng cứu chuỗi (freeze) trong MVP.
4. **Bất Biến Năng Lực & Tiến Độ:**
   $$\text{LearningProgress} \ne \text{Proficiency} \ne \text{Mastery} \ne \text{LevelReadiness}$$
   - Khảo sát tự khai (Self-report) $\rightarrow$ trạng thái `UNVERIFIED`.
   - Chuỗi chuyển hóa năng lực kiểm định: $\text{Diagnostic} \rightarrow \text{AssessmentResult (Bất biến)} \rightarrow \text{SkillProfile} \rightarrow \text{verifiedProficiency} \rightarrow \text{curriculumStartingPoint}$.
5. **Điều Kiện Hiển Thị Đơn Vị Học (Unit 4/4 Published):** Một Unit chỉ hiển thị cho học viên khi và chỉ khi toàn bộ 4 bài học cấu thành trong Unit đó đều đã ở trạng thái `PUBLISHED`.
6. **Ranh Giới An Ninh & AI Phi Trạng Thái:**
   - 6 Ranh giới (B1: Learner Web, B2: Admin Web, B3: Supabase RLS, B4: Privileged Service Role, B5: AI Server, B6: Audit Store).
   - Kiểm tra tầng ứng dụng (App AuthZ) không bao giờ thay thế RLS; RLS là bắt buộc tại database.
   - Ẩn nút trên UI không phải là giải pháp bảo mật (`UI hiding != authorization`).
   - Dịch vụ AI phi trạng thái (Stateless), không kết nối DB, ngắt kết nối tại 8.0s, có fallback an toàn.
   - Hợp đồng `docs/03-api-contract.md` là tài liệu chỉ đọc (read-only) và giữ nguyên 100% byte-identical.

### 2.2. Nguyên Tắc Giải Quyết Xung Đột Tài Liệu (Conflict Resolution)
Khi phát sinh sự không nhất quán giữa các tài liệu cũ và tài liệu mới trong kho lưu trữ, các kỹ sư triển khai bắt buộc phải áp dụng quy tắc thứ bậc ưu tiên sau:
1. **Ưu tiên tối cao:** Các biên bản nghiệm thu và quyết định quản trị mới nhất (`ADR-029`, `ADR-028`, `ADR-026`, `ADR-014`).
2. **Ưu tiên thứ hai:** Bản đặc tả bàn giao thiết kế sang triển khai `docs/phase-1-m2-6-design-handoff.md`.
3. **Ưu tiên thứ ba:** Báo cáo kiểm định thiết kế tổng thể `docs/phase-1-m2-5-design-validation.md` (Artifact #20).
4. **Ưu tiên thứ tư:** Các tài liệu thiết kế kiến trúc chuẩn tắc M2.1–M2.4 (`docs/phase-1-m2-4-architecture-security.md`, `docs/phase-1-m2-3-sequence-api-service-boundary.md`, `docs/phase-1-m2-2-behavior-uc-activity-state.md`, `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`).
5. **Tài liệu tham chiếu cũ:** Mọi thông tin trong `docs/00` đến `docs/07` xung đột với M2.6 đều bị coi là thông tin lịch sử đã bị ghi đè. Mọi mâu thuẫn phải được ghi nhận vào `logs/decision-log.md` theo mẫu ADR trước khi thực hiện code.

---

## 3. PHÂN RÃ HỆ THỐNG MỤC TIÊU THEO THÀNH PHẦN KIẾN TRÚC

Hệ thống triển khai Phase 2 được phân rã thành **9 nhóm phân hệ chức năng**, ánh xạ trực tiếp và đầy đủ vào **19 thành phần kiến trúc chuẩn tắc (Canonical Components)** đã được phê chuẩn tại M2.4:

```
+----------------------------------------------------------------------------------------------------+
|                                    19 CANONICAL COMPONENTS IN PHASE 2                              |
+----------------------------------------------------------------------------------------------------+
| TẦNG TRÌNH DIỄN (Presentation Layer):                                                              |
|   - COMP-PRES-01: Learner Web Client (Next.js 15 SPA/SSR Pages in lingora-web)                     |
|   - COMP-PRES-02: Admin & Moderation Web Client (Next.js 15 Admin Portal in lingora-admin)         |
+----------------------------------------------------------------------------------------------------+
| TẦNG ĐIỀU PHỐI ỨNG DỤNG (Application / BFF Layer):                                                 |
|   - COMP-APP-01: Learner Application Coordinator & BFF API Handlers (Next.js Route Handlers)       |
|   - COMP-APP-02: Admin Application Coordinator & Server Actions (Next.js Server Actions)           |
+----------------------------------------------------------------------------------------------------+
| TẦNG NGHIỆP VỤ CỐT LÕI (Core Domain Layer):                                                        |
|   - COMP-DOM-01: Auth & Identity Domain Service (Session, Roles & Profiles)                        |
|   - COMP-DOM-02: Curriculum & Progression Domain Service (Courses, Units, Lessons & Streak)        |
|   - COMP-DOM-03: Assessment & Diagnostic Domain Service (Placement Test, Mapping A, Jump)          |
|   - COMP-DOM-04: Spaced Repetition (SRS) Scheduling Domain Service (Policy B Intervals)            |
|   - COMP-DOM-05: Lesson Execution & Controlled Retry Domain Service (Unified Exercise, 70% Credit) |
|   - COMP-DOM-06: Content Lifecycle & Moderation Domain Service (6 States, SoD Rules, Clone-to-Draft)|
|   - COMP-DOM-07: Admin Governance & Security Audit Domain Service (Emergency Operations & Audit)   |
|   - COMP-DOM-08: AI Integration & Proxy Domain Service (Circuit Breaker, 8.0s Timeout, Fallback)   |
+----------------------------------------------------------------------------------------------------+
| TẦNG HẠ TẦNG DỮ LIỆU & AN NINH (Infrastructure Layer):                                             |
|   - COMP-INFRA-01: PostgreSQL Relational Database Engine (Supabase Hosted)                         |
|   - COMP-INFRA-02: Row Level Security (RLS) Policy Engine (PostgreSQL Security Core)               |
|   - COMP-INFRA-03: Stored Procedure / RPC Execution Engine (Deterministic Functions: record_review)|
|   - COMP-INFRA-04: Encrypted Object Media Storage Engine (Supabase Storage: Media & Avatars)       |
|   - COMP-INFRA-05: Immutable Security Audit Log Store (Append-Only audit_logs Table)               |
+----------------------------------------------------------------------------------------------------+
| TẦNG DỊCH VỤ NGOẠI VI (External Services Layer):                                                   |
|   - COMP-EXT-01: Supabase GoTrue Authentication Provider (OAuth & JWT Issuer)                      |
|   - COMP-EXT-02: Stateless AI Compute Service (FastAPI GEC Microservice in lingora-ai)              |
+----------------------------------------------------------------------------------------------------+
```

### 3.1. Nhóm Nền Tảng Cơ Sở Dữ Liệu (Foundation)
- **Thành phần sở hữu:** `COMP-INFRA-01` (Postgres DB), `COMP-INFRA-04` (Storage), `COMP-INFRA-05` (Audit Store).
- **Phạm vi triển khai:** Quản lý vòng đời lược đồ dữ liệu qua Prisma và Supabase CLI; triển khai các bảng nền tảng, tạo storage buckets có phân quyền, nạp dữ liệu mầm giáo trình chuẩn tắc tiếng Anh A1.

### 3.2. Nhóm Xác Thực & Phân Quyền (Authentication & Authorization)
- **Thành phần sở hữu:** `COMP-EXT-01` (GoTrue), `COMP-APP-01/02` (BFF Auth Middleware), `COMP-DOM-01` (Identity Service), `COMP-INFRA-02` (RLS Policy Engine).
- **Phạm vi triển khai:** Xác thực phiên làm việc qua HttpOnly cookie; cấp phát và kiểm tra JWT; chuyển đổi mô hình 2 vai trò sang 6 vai trò chuẩn tắc; thiết lập chính sách RLS kép độc lập trên toàn bộ các bảng; lập trình các trigger ngăn chặn vi phạm SoD.

### 3.3. Nhóm Học Tập Cốt Lõi (Learner Core Engine)
- **Thành phần sở hữu:** `COMP-PRES-01` (Learner UI), `COMP-APP-01` (Learner BFF), `COMP-DOM-02` (Curriculum Service), `COMP-DOM-05` (Lesson Execution Service).
- **Phạm vi triển khai:** Trình diễn cây giáo trình 6 Unit theo điều kiện mở khóa; trình phát bài học tương tác hỗ trợ 5 dạng bài tập (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`); thuật toán hạn mức làm lại có kiểm soát `max(1, floor(N * 0.10))` bảo lưu điểm trần 70%; cập nhật tiến độ học tập nguyên tử (`UserProgress`).

### 3.4. Nhóm Đánh Giá Năng Lực (Assessment & Progression)
- **Thành phần sở hữu:** `COMP-DOM-03` (Assessment Service), `COMP-APP-01` (Assessment BFF).
- **Phạm vi triển khai:** Phiên thi chẩn đoán năng lực đầu vào (~25–30 câu hỏi); thuật toán ánh xạ điểm thô 0–30 ra Unit 1–6 theo Mapping A; nhánh Skip (vào thẳng Unit 1 với trạng thái `UNVERIFIED`, 0 AssessmentResult, 0 SkillProfile); tính năng thi lại (Retake) tạo bản ghi `AssessmentResult` bất biến mới và cập nhật `SkillProfile`.

### 3.5. Nhóm Trí Tuệ Học Tập (Learning Intelligence: Jump, Retry, SRS, Streak)
- **Thành phần sở hữu:** `COMP-DOM-04` (SRS Service), `COMP-DOM-02` (Streak & Progression), `COMP-INFRA-03` (RPC Engine).
- **Phạm vi triển khai:** Thử thách nhảy cóc (Jump) cho đơn vị liền kề với ngưỡng đạt ≥95%, khóa hồi chiêu 24h khi trượt, gán nhãn `SKIPPED_BY_JUMP` (`by_jump = true`) và không tính hoàn thành Unit; thuật toán SRS tất định Policy B `[1, 3, 7, 14, 30]` ngày thực thi qua RPC `record_review`; bộ tính toán Streak theo ngày lịch cục bộ múi giờ IANA (`Asia/Ho_Chi_Minh`), tự động đặt lại về 1 khi bỏ lỡ ngày học.

### 3.6. Nhóm Quản Trị & Kiểm Duyệt Nội Dung (Content Management & Governance)
- **Thành phần sở hữu:** `COMP-PRES-02` (Admin Portal), `COMP-APP-02` (Admin Server Actions), `COMP-DOM-06` (Content Lifecycle Service).
- **Phạm vi triển khai:** Giao diện phân công biên soạn của Manager; không gian soạn bài của Creator; hàng đợi kiểm duyệt độc lập của Moderator; quy trình xuất bản chính thức của Manager; cơ chế nhân bản bản thảo bất biến (Clone-to-Draft v2 qua `supersedes_id`); quy tắc hiển thị Unit 4/4 Published; chức năng xuất bản khẩn cấp của Admin kèm lý do giải trình bắt buộc và phát thải sự kiện kiểm toán `CONTENT_EMERGENCY_PUB`.

### 3.7. Nhóm Tích Hợp AI & Sửa Lỗi Ngữ Pháp (AI / GEC Service)
- **Thành phần sở hữu:** `COMP-DOM-08` (AI Proxy Service), `COMP-EXT-02` (Stateless AI Service `lingora-ai`).
- **Phạm vi triển khai:** Lập trình endpoint `/v1/gec/correct` trong FastAPI tuân thủ nghiêm ngặt hợp đồng `docs/03-api-contract.md`; xây dựng Next.js Route Handler proxy tin cậy bảo vệ bằng JWT; cài đặt cơ chế ngắt mạch (circuit breaker) với thời gian chờ tối đa 8.0 giây; cơ chế fallback trả về kết quả luật cơ sở khi microservice AI gặp sự cố.

### 3.8. Nhóm Quản Trị Hệ Thống & Kiểm Toán (Administration & Audit)
- **Thành phần sở hữu:** `COMP-DOM-07` (Admin Governance Service), `COMP-INFRA-05` (Audit Store).
- **Phạm vi triển khai:** Bảng điều khiển quản trị tài khoản người dùng; phân bổ vai trò; màn hình tra cứu nhật ký kiểm toán hệ thống an toàn hỗ trợ lọc theo 11 sự kiện kiểm toán chuẩn tắc; cơ chế ghi log bất biến không thể xóa sửa.

### 3.9. Ranh Giới Mở Rộng Tương Lai (Optional / Future Boundary)
- **Các thành phần/tính năng cách ly khỏi MVP:** Quản lý nhóm học viên & Cohort (`UC-15`), Hệ thống Ticket hỗ trợ người dùng nâng cao (`UC-14` mở rộng), Thông báo đẩy trình duyệt Web Push (`6a/6b` deferred), Đóng băng chuỗi học tập (Streak Freeze), Cấp chứng chỉ ngoại ngữ CEFR. Toàn bộ các thành phần này được đánh dấu `FUTURE_EXTENSION`, tuyệt đối không đưa vào phạm vi nghiệm thu cốt lõi của Phase 2.

---

## 4. THỨ TỰ THỰC THI & KIẾN TRÚC PHỤ THUỘC TRIỂN KHAI

Thứ tự triển khai trong Phase 2 được xây dựng dựa trên **nguyên tắc phụ thuộc kiến trúc nghiêm ngặt (Dependency-Driven Implementation Order)**: Tầng dữ liệu và an ninh phải đi trước tầng dịch vụ; tầng dịch vụ nghiệp vụ phải đi trước giao diện người dùng; và các phân hệ độc lập được tích hợp theo luồng từ dưới lên.

```mermaid
flowchart TD
    M3_1["M3.1: Foundation & DB Migration"] --> M3_2["M3.2: Auth, RBAC, RLS & SoD"]
    M3_2 --> M3_3["M3.3: Learner Core (Lesson & Exercises)"]
    M3_3 --> M3_4["M3.4: Assessment & Progression (Placement)"]
    M3_3 --> M3_5["M3.5: Intelligence (Retry, SRS, Jump, Streak)"]
    M3_2 --> M3_6["M3.6: Content Governance & Moderation"]
    M3_3 --> M3_7["M3.7: AI / GEC Service Integration"]
    M3_4 --> M3_8["M3.8: System Integration & E2E Journey"]
    M3_5 --> M3_8
    M3_6 --> M3_8
    M3_7 --> M3_8
    M3_8 --> M3_9["M3.9: System Hardening & Security Audit"]
    M3_9 --> M3_10["M3.10: Demo Readiness & Report Evidence"]

    style M3_1 fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style M3_2 fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style M3_8 fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style M3_10 fill:#dcfce7,stroke:#16a34a,stroke-width:2px
```

### Phân Tích Tính Hợp Lý Của Chuỗi Phụ Thuộc Triển Khai:
1. **Tại sao M3.1 (Foundation) bắt buộc phải là mốc đầu tiên?**
   - Không thể lập trình phân quyền hay lưu trữ bài học nếu lược đồ bảng `units`, `lesson_revisions`, `assessment_results` và enum 6 vai trò chưa tồn tại trong cơ sở dữ liệu.
2. **Tại sao M3.2 (Auth/RBAC/RLS) phải hoàn thành trước khi viết tính năng học tập?**
   - Theo nguyên tắc phòng vệ theo chiều sâu (Defense-in-depth), mọi bảng nghiệp vụ phát sinh sau này bắt buộc phải chịu sự kiểm soát của RLS ngay từ thời điểm tạo ra. Tuyệt đối không viết code ứng dụng trên một cơ sở dữ liệu mở toang rồi mới vá RLS sau cùng.
3. **Tại sao M3.3 (Learner Core) đi trước M3.4 (Assessment) và M3.5 (Intelligence)?**
   - Bài kiểm tra chẩn đoán (Placement) và bài kiểm tra nhảy cóc (Jump) thực chất là các chế độ đánh giá (`context.mode`) tái sử dụng trình phát bài tập hợp nhất (Unified Exercise Engine). Do đó, bộ khung thực thi bài tập cốt lõi của M3.3 phải hoàn thành trước để làm nền tảng cho M3.4 và M3.5.
4. **Tại sao M3.6 (Content Governance) có thể triển khai song song hoặc ngay sau M3.2?**
   - Phân hệ quản trị nội dung hoạt động độc lập ở ứng dụng `lingora-admin`, chỉ phụ thuộc vào hạ tầng DB và mô hình SoD của M3.2. Việc hoàn thành M3.6 giúp đội ngũ sớm có công cụ biên soạn và xuất bản bài học phục vụ cho việc tích hợp hệ thống.
5. **Tại sao M3.7 (AI / GEC) triển khai độc lập trước M3.8?**
   - Microservice AI là dịch vụ phi trạng thái (stateless) độc lập. Nó chỉ cần hoàn thành và kiểm thử hợp đồng tại container Zone 4 trước khi được lắp ghép vào luồng bài tập viết tình huống tại M3.8.

---

## 5. KẾ HOẠCH TRIỂN KHAI CƠ SỞ DỮ LIỆU & LỘ TRÌNH MIGRATION

Lộ trình di chuyển dữ liệu trong Phase 2 hiện thực hóa 8 giai đoạn thiết kế đã được duyệt tại M2.6 Output 1, tuân thủ chiến lược **Mở rộng trước, Thu hẹp sau (Expand and Contract Pattern)** để đảm bảo an toàn dữ liệu tuyệt đối và khả năng hoàn nguyên (Rollback) từng bước.

### 5.1. Bảng Phân Loại Mô Hình Dữ Liệu Mục Tiêu

| Tên Bảng Vật Lý | Tình Trạng | Thao Tác Lược Đồ (Schema Operation) | Ghi Chú Kỹ Thuật & Quyết Định Liên Quan |
|---|---|---|---|
| `languages` | Giữ nguyên | Không thay đổi | Lưu trữ mã ngôn ngữ chuẩn ISO (`vi`, `en`, `zh`, `ja`, `fr`). |
| `profiles` | Chỉnh sửa | Bổ sung cột: `verified_starting_unit INT DEFAULT 1`, nâng cấp enum `role` thành 6 giá trị chuẩn tắc. | Chứa con trỏ đệm điểm xuất phát đã kiểm định (DD-06, DD-10). |
| `courses` | Chỉnh sửa | Bổ sung chỉ mục tối ưu tìm kiếm theo ngôn ngữ và thứ tự. | Giữ nguyên quan hệ phân cấp giáo trình. |
| `course_translations` | Giữ nguyên | Không thay đổi | Đa ngôn ngữ tiêu đề và mô tả khóa học. |
| `units` | Tạo mới | Tạo bảng mới: `id UUID PK`, `course_id UUID FK`, `order_index INT`, `created_at`. | Phân cấp Course -> Unit -> Lesson bất biến (DD-01). |
| `unit_translations` | Giữ nguyên | Cập nhật khóa ngoại trỏ chính xác về bảng `units` mới. | Đa ngôn ngữ tiêu đề và mô tả đơn vị học (DD-01). |
| `lessons` | Chỉnh sửa | Thêm cột `unit_id UUID NULL FK(units.id)`. Chuyển vai trò thành thực thể quản lý logic bài học ổn định. | Tách biệt định danh logic và phiên bản nội dung (DD-01, DD-02). |
| `lesson_translations` | Chỉnh sửa | Giữ làm bản dịch tiêu đề bài học logic hoặc chuyển dần sang phiên bản. | Đảm bảo tương thích ngược trong giai đoạn chuyển đổi. |
| `lesson_revisions` | Tạo mới | Tạo bảng mới: `id UUID PK`, `lesson_id UUID FK`, `version INT`, `supersedes_id UUID NULL FK`, `status VARCHAR(32)`, `content JSONB`, `assigned_creator_id UUID NULL`, `assigned_by_id UUID NULL`, `assignment_deadline TIMESTAMPTZ NULL`, `assignment_brief JSONB NULL`. | Quản lý vòng đời 6 trạng thái, phân công biên soạn, nhân bản bất biến Clone-to-Draft v2 (DD-02, DD-04). |
| `vocabularies` | Giữ nguyên | Bổ sung chỉ mục tra cứu chuẩn hóa. | Kho từ vựng trung tâm của hệ thống. |
| `vocabulary_translations`| Giữ nguyên | Không thay đổi | Nghĩa và ví dụ từ vựng đa ngữ. |
| `lesson_vocabulary` | Giữ nguyên | Khóa ngoại có thể liên kết với bài học logic hoặc phiên bản. | Danh mục từ vựng trọng tâm bài học. |
| `exercises` | Chỉnh sửa | Thêm cột `lesson_revision_id UUID NULL FK`, nâng cấp enum `ExerciseType` (+`LISTENING`, +`GRAMMAR`), chuẩn hóa JSON schema `payload`. | Mô hình bài tập hợp nhất (Unified Exercise D4, DD-05). |
| `user_progress` | Chỉnh sửa | Bổ sung cờ `by_jump BOOLEAN DEFAULT FALSE`, thêm trạng thái `LOCKED`, `SKIPPED_BY_JUMP` vào `status`. | Quản lý tiến độ học tập bài học; phân biệt rõ bài học hoàn thành thật với bài bị nhảy cóc (D5, M2.2). |
| `assessment_results` | Tạo mới | Tạo bảng mới: `id UUID PK`, `user_id UUID FK`, `assessment_type VARCHAR(32)`, `raw_score INT`, `starting_unit INT`, `answers JSONB`, `completed_at TIMESTAMPTZ`. RLS Append-Only. | Lưu lịch sử kiểm tra chẩn đoán năng lực bất biến (DD-06). |
| `skill_profiles` | Tạo mới | Tạo bảng mới: `id UUID PK`, `user_id UUID UNIQUE FK`, `verified_proficiency JSONB`, `updated_at TIMESTAMPTZ`. | Lưu hồ sơ năng lực chi tiết của học viên phục vụ cá nhân hóa (DD-06). |
| `user_vocab_srs` | Chỉnh sửa | Cập nhật cấu trúc hỗ trợ Policy B: `stage INT DEFAULT 0`, `next_review_at TIMESTAMPTZ`. | Động cơ ôn tập ngắt quãng tất định Policy B (D8). |
| `review_logs` | Giữ nguyên | Giữ nguyên bảng nhật ký ôn tập. | Phục vụ truy vết lịch sử ôn tập từ vựng. |
| `chat_scenarios` | Giữ nguyên | Giữ nguyên danh mục tình huống viết ngữ pháp. | Phục vụ bài tập luyện viết tình huống GEC. |
| `chat_scenario_translations`| Giữ nguyên | Không thay đổi | Tiêu đề và mô tả tình huống viết. |
| `audit_logs` | Chỉnh sửa | Cấu trúc lại theo chuẩn DD-03: `id UUID PK`, `actor_id UUID`, `action VARCHAR(64)`, `target_id VARCHAR(128)`, `timestamp TIMESTAMPTZ`, `metadata JSONB`, `ip_address INET`, `user_agent TEXT`. RLS Append-Only. | Sổ cái kiểm toán an ninh bất biến, ghi nhận 11 sự kiện chuẩn tắc (DD-03). |

### 5.2. Đặc Tả Chi Tiết 8 Giai Đoạn Di Chuyển Dữ Liệu (Migration Plan Phases)

#### Giai Đoạn 1: Kiểm Tra Tiền Điều Kiện & Tạo Điểm Sao Lưu (Pre-Migration Checks & Snapshot)
- **UP:** Kiểm tra kết nối cơ sở dữ liệu Supabase, xác nhận quyền Zone 5; tạo bản sao lưu vật lý toàn bộ cơ sở dữ liệu và thiết lập điểm khôi phục thời gian thực (PITR Snapshot).
- **DOWN / ROLLBACK:** Không áp dụng (không có thay đổi lược đồ).
- **DATA SAFETY:** Xác nhận 100% dữ liệu hiện tại được sao lưu an toàn; kiểm tra dung lượng ổ đĩa khả dụng > 20%.
- **BACKFILL:** Không có.
- **TEST PLAN:** Chạy script `scratch/check_db_health.py` kiểm tra toàn vẹn bảng hiện tại và xác nhận snapshot hợp lệ.

#### Giai Đoạn 2: Mở Rộng Lược Đồ Dạng Cộng Dồn (Compatibility / Expand Phase)
- **UP:** 
  1. Tạo enum mới hoặc thêm giá trị: `ExerciseType` bổ sung `LISTENING`, `GRAMMAR`; `ProgressStatus` bổ sung `LOCKED`, `SKIPPED_BY_JUMP`.
  2. Tạo các bảng mới với các cột nullable hoặc default: `units`, `lesson_revisions`, `assessment_results`, `skill_profiles`.
  3. Thêm các cột mới dạng nullable vào bảng hiện có: `lessons.unit_id`, `exercises.lesson_revision_id`, `profiles.verified_starting_unit`.
- **DOWN / ROLLBACK:** Chạy script `.down.sql`: `DROP TABLE` các bảng mới tạo; `ALTER TABLE DROP COLUMN` các cột mới thêm; khôi phục định nghĩa enum cũ.
- **DATA SAFETY:** Tuyệt đối không thêm cột `NOT NULL` thiếu `DEFAULT`; không xóa hoặc sửa đổi bất kỳ cột hiện có nào đang phục vụ truy vấn.
- **BACKFILL:** Không có.
- **TEST PLAN:** Chạy lệnh `npx prisma validate`, kiểm tra catalog `pg_tables` xác nhận bảng mới đã xuất hiện và các bảng cũ hoạt động bình thường.

#### Giai Đoạn 3: Chuyển Đổi Dữ Liệu & Nạp Dữ Liệu Mầm (Data Transformation & Backfill Phase)
- **UP:**
  1. Chạy script backfill tạo 6 Unit chuẩn tắc cho khóa học tiếng Anh A1 trong bảng `units`.
  2. Cập nhật khóa ngoại `lessons.unit_id` cho 24 bài học hiện có theo đúng cấu trúc 4 bài học/Unit.
  3. Trích xuất nội dung từ bảng `lessons` hiện tại để tạo bản ghi phiên bản đầu tiên trong `lesson_revisions` (`version = 1, status = 'PUBLISHED', supersedes_id = NULL`).
  4. Cập nhật `exercises.lesson_revision_id` trỏ về revision tương ứng; chuẩn hóa trường `exercises.payload` sang JSON Schema mới.
- **DOWN / ROLLBACK:** `TRUNCATE TABLE lesson_revisions`; đặt giá trị `lessons.unit_id = NULL`; khôi phục dữ liệu payload cũ từ bảng sao lưu.
- **DATA SAFETY:** Thực hiện cập nhật theo từng đợt (batching ~500 bản ghi/lượt) trong các giao dịch có kiểm soát thời gian chờ (lock_timeout = 5s).
- **BACKFILL:** Kiểm tra đối soát sau khi chạy: 100% bài học có `unit_id` hợp lệ; 100% bài học xuất bản có bản ghi `lesson_revisions` tương ứng.
- **TEST PLAN:** Chạy truy vấn SQL kiểm toán đối chiếu số lượng bản ghi giữa bảng cũ và bảng mới (`COUNT(*)` khớp 100%).

#### Giai Đoạn 4: Chuyển Đổi Vai Trò & Thiết Lập Chính Sách RLS (Role & RLS Transition Phase)
- **UP:**
  1. Nâng cấp cột `profiles.role` lên 6 giá trị chuẩn tắc (chuyển đổi: `USER` cũ $\rightarrow$ `LEARNER`, `ADMIN` cũ $\rightarrow$ `ADMINISTRATOR`).
  2. Triển khai toàn bộ ma trận chính sách PostgreSQL Row Level Security (RLS) trên tất cả các bảng nghiệp vụ.
  3. Tạo các trigger cơ sở dữ liệu chặn vi phạm Phân tách nhiệm vụ (SoD) và trigger ghi log kiểm toán bất biến.
- **DOWN / ROLLBACK:** Khôi phục lại chính sách RLS 2 vai trò ban đầu; gỡ bỏ các trigger SoD; chuyển đổi giá trị role về lại `USER` hoặc `ADMIN`.
- **DATA SAFETY:** Áp dụng chế độ kiểm tra kép (dual-read check); đảm bảo tài khoản quản trị hiện tại không bị mất quyền truy cập.
- **TEST PLAN:** Thực thi bộ kiểm thử tự động `tests/security/test_rls_isolation.py` và `test_rbac_matrix.py` với 6 token JWT giả lập đại diện cho 6 vai trò.

#### Giai Đoạn 5: Chuyển Đổi Lưu Lượng Ứng Dụng (Application Cutover Phase)
- **UP:** Triển khai bản dựng ứng dụng Phase 2 cho `lingora-web` và `lingora-admin`. Chuyển hướng toàn bộ các thao tác đọc/ghi sang cấu trúc `units`, `lesson_revisions`, `assessment_results`.
- **DOWN / ROLLBACK:** Chuyển đổi lưu lượng (traffic flip) quay trở lại bản dựng ứng dụng Phase 1 hỗ trợ lược đồ cũ trên Vercel.
- **DATA SAFETY:** Theo dõi tỷ lệ lỗi API; nếu phát hiện tỷ lệ lỗi > 1% trong 15 phút đầu, kích hoạt hoàn nguyên ngay lập tức.
- **BACKFILL:** Không có.
- **TEST PLAN:** Thực hiện kiểm tra sức khỏe tự động (health check) trên 15 luồng BF; xác nhận giao dịch đăng nhập, xem bài và làm bài tập diễn ra trơn tru.

#### Giai Đoạn 6: Kiểm Định Hệ Thống Vận Hành (System Audit & Validation Checkpoint)
- **UP:** Hệ thống vận hành ổn định trên môi trường mới; giám sát hiệu năng truy vấn RLS và cơ chế ghi log kiểm toán.
- **DOWN / ROLLBACK:** Kích hoạt Giai đoạn 7 nếu phát hiện lỗi bảo mật nghiêm trọng (Sev-1).
- **DATA SAFETY:** Toàn bộ dữ liệu người dùng phát sinh mới trong giai đoạn này được bảo vệ bởi RLS và sao lưu liên tục.
- **BACKFILL:** Không có.
- **TEST PLAN:** Thực thi trọn vẹn bộ 18 kịch bản Test Frames của M2.6; xác nhận nhật ký kiểm toán ghi nhận đầy đủ 11 loại sự kiện.

#### Giai Đoạn 7: Kế Hoạch Ứng Phó Khẩn Cấp (Rollback Strategy & Emergency Plan)
- **UP:** Kích hoạt quy trình hoàn nguyên có kiểm soát khi xảy ra lỗi Sev-1 (mất dữ liệu, rò rỉ phân quyền RLS, đứt gãy toàn bộ API). Khôi phục trạng thái ổn định gần nhất từ điểm sao lưu PITR.
- **DOWN / ROLLBACK:** Không áp dụng.
- **DATA SAFETY:** Trích xuất phần dữ liệu học tập mới phát sinh trong thời gian cutover vào bảng đệm tạm trước khi hoàn nguyên PITR để nạp lại sau.
- **BACKFILL:** Chạy script bù trừ dữ liệu học viên từ bảng đệm tạm sau khi hệ thống ổn định.
- **TEST PLAN:** Thực hành diễn tập kịch bản hoàn nguyên dry-run trên môi trường staging trước khi chạy cutover thật.

#### Giai Đoạn 8: Thu Hẹp Lược Đồ & Dọn Dẹp Sau Chuyển Đổi (Post-Migration Cleanup / Contract Phase)
- **UP:** Sau khi hệ thống vận hành ổn định tối thiểu 14 ngày trên môi trường mục tiêu: tiến hành gỡ bỏ các cột dữ liệu cũ không còn sử dụng trên bảng `lessons` và `exercises`.
- **DOWN / ROLLBACK:** Không hoàn nguyên sau khi đã đóng hợp đồng (Contract Phase); dữ liệu cũ đã được lưu trữ trong bản sao lưu vĩnh viễn.
- **DATA SAFETY:** Xác nhận tuyệt đối không còn bất kỳ truy vấn nào trong mã nguồn ứng dụng hay báo cáo tham chiếu đến các cột cũ trong 14 ngày liên tục.
- **BACKFILL:** Không có.
- **TEST PLAN:** Chạy công cụ rà soát toàn bộ codebase quét các từ khóa cột cũ; chạy kiểm thử hồi quy toàn diện.

---

## 6. KẾ HOẠCH TRIỂN KHAI AUTH, RBAC, RLS & PHÂN TÁCH NHIỆM VỤ (SOD)

Hệ thống bảo mật của Lingora tuân thủ nguyên tắc **Phòng vệ kép (Dual-Presence Security Model)**: Kiểm soát tầng ứng dụng (Application AuthZ) mang lại trải nghiệm mượt mà và tối ưu hóa truy vấn; nhưng **chính sách bảo mật cấp dòng (Database RLS) tại PostgreSQL là chốt chặn bắt buộc tối hậu** bảo vệ dữ liệu chống lại mọi hành vi vượt quyền hay tấn công trực tiếp.

### 6.1. Mô Hình 6 Vai Trò & Phân Bổ Quyền Hạn

```text
+------------------------+---------------------------------------------------------------------------+
| VAI TRÒ CHUẨN TẮC      | PHẠM VI TRUY CẬP VÀ QUYỀN HẠN HỆ THỐNG                                    |
+------------------------+---------------------------------------------------------------------------+
| 1. Learner             | Chỉ đọc/ghi tiến độ của chính mình (auth.uid() = user_id).                |
|                        | Chỉ đọc các nội dung đã xuất bản (status = 'PUBLISHED').                  |
+------------------------+---------------------------------------------------------------------------+
| 2. Lesson Creator      | Đọc các bài học được phân công (assigned_creator_id = auth.uid()).        |
|                        | Tạo/sửa bản thảo (DRAFT, CHANGES_REQUESTED); nộp duyệt (IN_REVIEW).       |
|                        | CẤM: Tự phê duyệt bài của mình; xuất bản bài học ra học viên.             |
+------------------------+---------------------------------------------------------------------------+
| 3. Moderator           | Đọc hàng đợi kiểm duyệt (status = 'IN_REVIEW').                           |
|                        | Phê duyệt (APPROVED) hoặc Yêu cầu sửa (CHANGES_REQUESTED).                |
|                        | CẤM: Phê duyệt bài do chính mình biên soạn; xuất bản (PUBLISHED).         |
+------------------------+---------------------------------------------------------------------------+
| 4. Org Manager         | Tạo kế hoạch bài học, phân công biên soạn (gán assigned_creator_id).       |
|                        | Xuất bản bài học đã duyệt (chuyển APPROVED -> PUBLISHED).                 |
|                        | Lưu trữ bài học (PUBLISHED -> ARCHIVED).                                  |
+------------------------+---------------------------------------------------------------------------+
| 5. Administrator       | Quản lý tài khoản, gán vai trò người dùng (ROLE_ASSIGNED).                |
|                        | Tra cứu nhật ký kiểm toán hệ thống (AUDIT_LOG_INSPECTED).                  |
|                        | Xuất bản khẩn cấp bài học đã APPROVED kèm lý do bắt buộc và ghi log kiểm toán.|
+------------------------+---------------------------------------------------------------------------+
| 6. Operations Staff    | Tra cứu hồ sơ học viên, xem trạng thái hệ thống và log kỹ thuật.          |
|                        | Không có quyền can thiệp vào nội dung giáo trình hoặc phê duyệt bài học.  |
+------------------------+---------------------------------------------------------------------------+
```

### 6.2. Thiết Kế Ma Trận Chính Sách Supabase Row Level Security (RLS)

Mọi bảng trong cơ sở dữ liệu đều bắt buộc phải kích hoạt RLS: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.

```sql
-- Ví dụ minh họa kiến trúc chính sách RLS cho bảng tiến độ học tập (user_progress)
-- Đảm bảo cách ly tuyệt đối giữa các học viên: Người dùng A không thể đọc/sửa Người dùng B
CREATE POLICY "learner_manage_own_progress"
ON user_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ví dụ minh họa chính sách RLS cho bảng phiên bản bài học (lesson_revisions)
-- Học viên chỉ đọc bài đã xuất bản
CREATE POLICY "learner_read_published_revisions"
ON lesson_revisions
FOR SELECT
TO authenticated
USING (
  status = 'PUBLISHED' 
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'LEARNER')
);

-- Creator chỉ xem và sửa bài thảo được phân công cho chính mình
CREATE POLICY "creator_manage_assigned_revisions"
ON lesson_revisions
FOR ALL
TO authenticated
USING (
  assigned_creator_id = auth.uid() 
  AND status IN ('DRAFT', 'CHANGES_REQUESTED')
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'LESSON_CREATOR')
)
WITH CHECK (
  assigned_creator_id = auth.uid() 
  AND status IN ('DRAFT', 'IN_REVIEW')
);
```

### 6.3. Quy Tắc Chặn Vi Phạm Phân Tách Nhiệm Vụ (SoD Enforcement)
Các quy tắc phân tách nhiệm vụ được bảo vệ bằng cơ chế 2 lớp: Tầng ứng dụng (BFF) kiểm tra điều kiện nghiệp vụ và trả về mã lỗi HTTP 403 ngữ nghĩa; đồng thời Tầng cơ sở dữ liệu cài đặt các **Database Triggers** độc lập để từ chối giao dịch ngay cả khi ứng dụng BFF bị tấn công bypass.

1. **Cấm Lesson Creator Tự Duyệt Bài Của Chính Mình:**
   - **Tầng ứng dụng (BFF):** Nếu `revision.assigned_creator_id == session.user.id` và hành động là duyệt bài $\rightarrow$ Trả về mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_SELF_REVIEW`).
   - **Tầng DB Trigger:**
     ```sql
     CREATE OR REPLACE FUNCTION check_sod_self_review() RETURNS TRIGGER AS $$
     BEGIN
       IF NEW.status = 'APPROVED' AND NEW.assigned_creator_id = auth.uid() THEN
         RAISE EXCEPTION 'SoD Violation: Lesson Creator cannot approve their own lesson revision.'
           USING ERRCODE = 'P0403';
       END IF;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;
     ```
2. **Cấm Moderator Xuất Bản Bài Học Ra Môi Trường Học Tập:**
   - **Tầng ứng dụng (BFF):** Nếu vai trò là `MODERATOR` và yêu cầu chuyển trạng thái sang `PUBLISHED` $\rightarrow$ Trả về mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_MODERATOR_PUBLISH`).
   - **Tầng DB RLS:** Chính sách RLS chỉ cho phép vai trò `ORGANIZATIONAL_MANAGER` và `ADMINISTRATOR` thực thi lệnh `UPDATE` chuyển trạng thái sang `PUBLISHED`.
3. **Ràng Buộc Nghiêm Ngặt Khi Admin Xuất Bản Khẩn Cấp:**
   - **Tầng ứng dụng (BFF):**
     - Kịch bản A: Nếu bài học đang ở trạng thái `IN_REVIEW` $\rightarrow$ Từ chối với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_EMERGENCY_UNAPPROVED`).
     - Kịch bản B: Nếu bài học đã `APPROVED` nhưng trường lý do giải trình `reason` rỗng hoặc null $\rightarrow$ Từ chối với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_MISSING_JUSTIFICATION`).
     - Kịch bản C: Bài học đã `APPROVED` kèm `reason` hợp lệ $\rightarrow$ Chấp nhận chuyển sang `PUBLISHED`, đồng thời phát thải bản ghi kiểm toán chuẩn tắc `CONTENT_EMERGENCY_PUB` vào bảng `audit_logs`.

---

## 7. KẾ HOẠCH TRIỂN KHAI VÒNG ĐỜI HỌC VIÊN (LEARNER CORE ENGINE)

Phân hệ học viên hiện thực hóa trọn vẹn **Vòng lặp học tập khép kín 9 bước (Closed-Loop Learner Cycle)**, đảm bảo tính liên tục, tính công bằng và sự bảo vệ dữ liệu toàn diện.

```text
+---------------------------------------------------------------------------------------------------+
|                                  CLOSED-LOOP LEARNER CYCLE (9 STEPS)                              |
+---------------------------------------------------------------------------------------------------+
| [1. SIGN IN]                                                                                      |
|       |                                                                                           |
|       v                                                                                           |
| [2. STARTING POINT CHECK] ──(Unverified)──> [Placement Test / Skip] ──> [Gán Starting Unit 1..6] |
|       |                                                                          |                |
|       +───────────────────────────(Đã xác thực)──────────────────────────────────+                |
|       v                                                                                           |
| [3. LEARN (Curriculum)] ──> [Chọn Unit khả dụng (4/4 Published)] ──> [Chọn Lesson]                |
|       |                                                                                           |
|       v                                                                                           |
| [4. EXERCISE EXECUTION] ──> [Tương tác 5 dạng: MCQ, FILL, REORDER, LISTENING, GRAMMAR]            |
|       |                                                                                           |
|       v                                                                                           |
| [5. FEEDBACK & SCORING] ──> [Phản hồi đúng/sai, giải thích chi tiết, chấm điểm cơ sở]             |
|       |                                                                                           |
|       v                                                                                           |
| [6. CONTROLLED RETRY] ──(Làm sai & còn lượt)──> [max(1, floor(N*0.10)) / Tối đa 70% điểm]        |
|       |                                                                                           |
|       v                                                                                           |
| [7. PROGRESS PERSISTENCE] ──> [Cập nhật UserProgress nguyên tử: status, score, completedAt]       |
|       |                                                                                           |
|       v                                                                                           |
| [8. SRS PRACTICE QUEUE] ──> [Đẩy từ vựng vào hàng đợi ôn tập ngắt quãng Policy B: 1,3,7,14,30]    |
|       |                                                                                           |
|       v                                                                                           |
| [9. STREAK EVALUATION] ──> [Tính toán chuỗi ngày học theo múi giờ IANA, cập nhật kỷ lục]         |
+---------------------------------------------------------------------------------------------------+
```

### Chi Tiết Kỹ Thuật Từng Bước Trong Vòng Lặp Học Viên:

| Bước | Tên Bước | Nguồn Chân Lý (Source of Truth) | Trách Nhiệm API / BFF | Trách Nhiệm Tầng Nghiệp Vụ (Domain) | Lưu Trữ Cơ Sở Dữ Liệu | Kịch Bản Thất Bại & Phòng Vệ | Kịch Bản Kiểm Thử |
|---|---|---|---|---|---|---|---|
| **1** | **Sign In** | Supabase GoTrue Auth | Xử lý phiên cookie HttpOnly, xác thực JWT | `COMP-DOM-01`: Đọc hồ sơ người dùng, phân loại vai trò | Đọc bảng `profiles`, `auth.users` | Token hết hạn / sai mật khẩu $\rightarrow$ Trả về mã lỗi 401 | `test_auth_signin` |
| **2** | **Starting Point** | `profiles.verified_starting_unit` | Điều hướng giao diện dựa trên cờ trạng thái kiểm định | `COMP-DOM-03`: Kiểm tra học viên mới, kích hoạt chẩn đoán nếu chưa làm | Đọc `profiles.verified_starting_unit`, `assessment_results` | Mất kết nối DB $\rightarrow$ Mặc định gán Unit 1 an toàn | `test_placement_routing` |
| **3** | **Learn** | Bảng `units` & `lesson_revisions` | Lấy danh sách Unit và Lesson hiển thị cho học viên | `COMP-DOM-02`: Áp dụng luật Unit 4/4 Published; lọc bài khóa | Truy vấn `units` JOIN `lesson_revisions` qua RLS | Cố tình truy cập bài chưa xuất bản $\rightarrow$ 404/403 | `test_curriculum_visible` |
| **4** | **Exercise** | Bảng `exercises` (Unified Model) | Tải nội dung bài tập theo thứ tự `order_index` | `COMP-DOM-05`: Khởi tạo phiên làm bài học, tính số bài tập N | Đọc bảng `exercises` theo `lesson_revision_id` | Bài tập lỗi cấu trúc payload $\rightarrow$ Ghi log, bỏ qua câu | `test_exercise_render` |
| **5** | **Feedback** | Logic kiểm tra đáp án | Tiếp nhận câu trả lời, so khớp đáp án | `COMP-DOM-05`: So khớp chính xác; tính điểm thô bài tập | Không lưu DB (tạm giữ ở phiên làm bài) | Gian lận gửi đáp án sai cấu trúc $\rightarrow$ 400 Invalid | `test_exercise_eval` |
| **6** | **Controlled Retry** | Luật D7: `max(1, floor(N*0.10))` | Tiếp nhận yêu cầu làm lại câu sai trong lượt học | `COMP-DOM-05`: Kiểm tra hạn mức lượt; áp trần 70% điểm | Ghi nhận cờ `isRetry = true` trong phiên làm bài | Vượt quá hạn mức làm lại $\rightarrow$ 403 RETRY_EXCEEDED | `TEST-FRAME-RETRY-ALLOWANCE` |
| **7** | **Progress** | Bảng `user_progress` | Gửi gói tổng kết bài học sau khi hoàn thành | `COMP-DOM-02`: Đánh giá hoàn thành bài học; tính điểm cuối | `user_progress`: `COMPLETED`, `score`, `completed_at` | Rớt mạng khi nộp điểm $\rightarrow$ Client tự động thử lại có idempotent key | `test_progress_atomic` |
| **8** | **SRS Review** | Bảng `user_vocab_srs`, Policy B | Lấy hàng đợi từ vựng đến hạn ôn tập trong ngày | `COMP-DOM-04`: Gọi RPC `record_review` cập nhật khoảng cách ngày | Bảng `user_vocab_srs`, `review_logs` qua RPC | Lỗi RPC $\rightarrow$ Giữ nguyên trạng thái thẻ, không làm mất dữ liệu | `TEST-FRAME-SRS-POLICY-B` |
| **9** | **Streak** | `profiles.last_qualifying_activity_date`| Đọc và hiển thị số ngày học liên tục | `COMP-DOM-02`: Quy đổi giờ UTC sang múi giờ IANA của user | Cập nhật `profiles.streak_count`, `last_qualifying_activity_date`| Lệch múi giờ client $\rightarrow$ Luôn dùng thư viện IANA chuẩn trên server | `TEST-FRAME-STREAK-TIMEZONE` |

---

## 8. KẾ HOẠCH TRIỂN KHAI ĐÁNH GIÁ NĂNG LỰC & ĐIỂM XUẤT PHÁT (ASSESSMENT)

Phân hệ đánh giá năng lực bảo toàn tuyệt đối bất biến: **Tự khai không phải là năng lực kiểm định (`Self-report != verified proficiency`)** và **Điểm xuất phát giáo trình không phải là chứng chỉ năng lực CEFR**.

### 8.1. Quy Chuẩn Bài Kiểm Tra Chẩn Đoán (Placement / Diagnostic Test)
- **Quy mô bộ câu hỏi:** Được thiết kế với số lượng **`~25–30 câu hỏi theo đề xuất (proposed)`**, phân bổ đều qua các kỹ năng Từ vựng, Ngữ pháp, và Đọc hiểu cơ bản. Tuyệt đối không tự ý viết cứng thành "chính xác 30 câu".
- **Thang điểm thô và Thuật toán Mapping A:** Điểm số thô (Raw Score) nằm trong dải $0 \le \text{Raw Score} \le 30$, được ánh xạ tất định sang Đơn vị xuất phát giáo trình (Starting Unit 1..6) theo bảng quy chuẩn đã được phê duyệt:
  - $\text{Score } 0 - 7 \rightarrow \textbf{Unit 1}$ (Beginner Foundation)
  - $\text{Score } 8 - 12 \rightarrow \textbf{Unit 2}$ (Elementary Communication)
  - $\text{Score } 13 - 17 \rightarrow \textbf{Unit 3}$ (Pre-Intermediate Core)
  - $\text{Score } 18 - 22 \rightarrow \textbf{Unit 4}$ (Intermediate Transition)
  - $\text{Score } 23 - 26 \rightarrow \textbf{Unit 5}$ (Upper-Intermediate Fluency)
  - $\text{Score } 27 - 30 \rightarrow \textbf{Unit 6}$ (Advanced Mastery)

### 8.2. Nhánh Bỏ Qua Chẩn Đoán (Branch A: Skip Diagnostic)
- Khi học viên chọn "Bỏ qua bài kiểm tra chẩn đoán":
  - Hệ thống tự động gán `startingUnit = 1` và trạng thái năng lực là `UNVERIFIED`.
  - **Bất biến số lượng bản ghi:** Tuyệt đối phát sinh **đúng 0 bản ghi `AssessmentResult`** và **đúng 0 bản ghi `SkillProfile`**.
  - Hồ sơ `profiles` chỉ cập nhật trường `verified_starting_unit = 1` với đánh dấu chưa qua kiểm định.

### 8.3. Tính Bất Biến Của Kết Quả & Quy Trình Thi Lại (Retake Protocol)
- **Tính bất biến (Immutability):** Bảng `assessment_results` được cài đặt chính sách RLS chỉ cho phép chèn mới (`INSERT`), nghiêm cấm hoàn toàn các thao tác chỉnh sửa (`UPDATE`) hoặc xóa (`DELETE`) đối với mọi vai trò.
- **Quy trình thi lại (Retake from Profile):** Học viên có thể thực hiện thi lại từ màn hình hồ sơ cá nhân:
  1. Mỗi lần nộp bài thi lại sẽ tạo ra một bản ghi `AssessmentResult` mới độc lập với UUID mới và thời gian `completed_at` thời gian thực. Bản ghi cũ được giữ nguyên vẹn để phục vụ phân tích tiến bộ học tập.
  2. Dịch vụ ứng dụng (`COMP-DOM-03`) thực hiện giao dịch nguyên tử (atomic database transaction):
     $$\text{AssessmentResult (Mới)} \longrightarrow \text{SkillProfile (Cập nhật)} \longrightarrow \text{verifiedProficiency} \longrightarrow \text{profiles.verified_starting_unit}$$
  3. Kết quả chẩn đoán mới nhất luôn được xác định bằng truy vấn: `SELECT * FROM assessment_results WHERE user_id = :uid ORDER BY completed_at DESC LIMIT 1`.

---

## 9. KẾ HOẠCH TRIỂN KHAI THỬ THÁCH NHẢY CÓC, LÀM LẠI, SRS & CHUỖI HỌC (INTELLIGENCE)

### 9.1. Thử Thách Nhảy Cóc Đơn Vị Học (Jump Challenge — D5)
- **Phạm vi áp dụng:** Chỉ cho phép thực hiện bài Jump đối với **Đơn vị học liền kề tiếp theo** ($\text{Unit}_{\text{current}} + 1$). Cấm tuyệt đối nhảy cóc vượt cấp xa.
- **Ngưỡng điểm đạt (Pass Threshold):** Bắt buộc phải đạt chính xác từ **$95.0\%$ trở lên** ($\text{score} \ge 0.9500$). Không làm tròn số học từ $94.9\%$ lên $95\%$.
- **Cơ chế khóa hồi chiêu (Cooldown Lockout):** Nếu học viên làm bài Jump không đạt ($< 95\%$), hệ thống kích hoạt khóa hồi chiêu **bắt buộc 24 giờ** tính theo đồng hồ UTC của máy chủ cơ sở dữ liệu. Mọi yêu cầu làm bài Jump mới trong khoảng thời gian này bị từ chối với mã lỗi `429 / 403 JUMP_COOLDOWN_ACTIVE`.
- **Hệ quả tiến độ (Non-Completion Invariant):** Vượt qua bài Jump chỉ mở khóa đơn vị tiếp theo. Toàn bộ các bài học trong đơn vị bị nhảy qua được gán cờ `by_jump = true` (hoặc trạng thái `SKIPPED_BY_JUMP`), **TUYỆT ĐỐI KHÔNG đánh dấu là `COMPLETED`** và không làm tăng tổng số bài học hoàn thành trong thống kê.

### 9.2. Hạn Mức Làm Lại Có Kiểm Soát (Controlled Retry — D7)
- **Công thức tính hạn mức:** Tính toán trên phạm vi **từng lượt làm bài học cụ thể (Per Lesson Attempt/Context)**:
  $$\text{allowance} = \max(1, \lfloor N \times 0.10 \rfloor)$$
  *(Trong đó $N$ là tổng số lượng bài tập tương tác trong bài học đó).*
- **Không có hạn ngạch gộp ngày (No Daily Global Pool):** Hạn mức làm lại gắn chặt với phiên làm bài học, **tuyệt đối KHÔNG phải là hạn ngạch gộp hàng ngày** và không bị đặt lại theo ranh giới nửa đêm.
- **Bảo lưu điểm trần 70% (70% Score Credit Cap):** Nếu học viên làm sai ở lần đầu (0 điểm) và làm lại chính xác ở lần thứ hai, điểm số ghi nhận thực tế tối đa đạt:
  $$\text{effectiveScore} = \text{rawScore} \times 0.70$$
- **Điều kiện hoàn thành bài học:** Học viên hoàn thành bài học khi đã duyệt qua 100% các bài tập lượt một và xử lý hết hạn mức làm lại cho phép. Hoàn thành bài học không phụ thuộc vào một trần điểm số cố định (ví dụ: không bắt buộc phải đạt 80% điểm mới được coi là hoàn thành).

### 9.3. Thuật Toán Ôn Tập Ngắt Quãng Tất Định (SRS Policy B — D8)
- **Chu kỳ giãn cách chuẩn tắc:** Tuân thủ mảng hằng số nguyên ngày:
  $$\text{Intervals} = [1, 3, 7, 14, 30] \text{ ngày}$$
- **Quy tắc chuyển cấp:**
  - Trả lời đúng: Chuyển lên giai đoạn tiếp theo ($\text{Stage } k \rightarrow k+1$).
  - Trả lời sai ở bất kỳ giai đoạn nào: **Đặt lại ngay lập tức về Stage 1 (+1 ngày)**.
- **Tính độc lập với AI:** Thuật toán SRS được cài đặt thuần túy bằng hàm lưu trữ nội bộ PostgreSQL (RPC `record_review`), độc lập 100% với container AI và client.

### 9.4. Động Cơ Tính Chuỗi Ngày Học Liên Tục (Daily Streak — D9)
- **Hành động đủ điều kiện (Qualifying Activity):** Hoàn thành tối thiểu 1 bài học mới hoặc hoàn thành tối thiểu 1 phiên ôn tập từ vựng SRS trong ngày.
- **Ranh giới múi giờ người dùng:** Tính toán ngày học dựa trên **múi giờ IANA đã đăng ký của học viên** (mặc định `Asia/Ho_Chi_Minh` cho thị trường Việt Nam). Server quy đổi thời điểm hoàn thành UTC sang ngày dương lịch cục bộ của người dùng trước khi so sánh với `lastQualifyingActivityDate`.
- **Quy tắc đứt gãy chuỗi:** Nếu học viên bỏ lỡ không học trong 1 ngày dương lịch cục bộ, chuỗi hiện tại (`currentStreak`) bị **đặt lại về 1** vào lần học tiếp theo. Chuỗi kỷ lục (`longestStreak`) được bảo lưu nguyên vẹn. MVP không hỗ trợ tính năng đóng băng chuỗi (Streak Freeze).

### 9.5. Ma Trận Kiểm Thử Nghiệp Vụ & Phòng Vệ Lạm Dụng

| Chính Sách | Kịch Bản Chuẩn (Happy Path) | Kịch Bản Biên (Boundary Case) | Kịch Bản Lạm Dụng / Tấn Công (Abuse / Negative Case) |
|---|---|---|---|
| **Jump Challenge** | Đạt 96% điểm $\rightarrow$ Mở khóa Unit kế tiếp, gán `by_jump = true`. | Đạt chính xác 95.0% $\rightarrow$ PASS; đạt 94.9% $\rightarrow$ FAIL, khóa 24h. | Gửi yêu cầu Jump khi đang trong 24h hồi chiêu $\rightarrow$ 403 Forbidden; sửa đồng hồ client $\rightarrow$ Bị chặn bởi đồng hồ server. |
| **Controlled Retry**| Bài học 20 câu ($N=20$) $\rightarrow$ Có 2 lượt làm lại; làm lại đúng nhận 70% điểm. | Bài học 5 câu ($N=5$) $\rightarrow$ $\max(1, \lfloor 0.5 \rfloor) = 1$ lượt làm lại tối thiểu. | Gửi yêu cầu làm lại lần thứ 3 khi hạn mức chỉ có 2 $\rightarrow$ 403 RETRY_ALLOWANCE_EXCEEDED. |
| **SRS Policy B** | Trả lời đúng qua các mốc $\rightarrow$ Nhận chu kỳ +1, +3, +7, +14, +30 ngày. | Trả lời đúng ở Stage 5 $\rightarrow$ Duy trì mốc ôn tập tối đa 30 ngày. | Trả lời sai ở Stage 4 $\rightarrow$ Bắt buộc reset về Stage 1 (+1 ngày); client gửi interval tùy biến $\rightarrow$ Bị từ chối bởi RPC. |
| **Daily Streak** | Học đều đặn mỗi ngày lúc 23:00 $\rightarrow$ Tăng chuỗi liên tục. | Học lúc 23:59 ngày D và 00:05 ngày D+1 (giờ VN) $\rightarrow$ Ghi nhận 2 ngày liên tiếp thành công. | Học viên bỏ học ngày D+1, học lại ngày D+2 $\rightarrow$ Reset currentStreak về 1; client gửi ngày giả mạo $\rightarrow$ Bị chặn. |

---

## 10. KẾ HOẠCH TRIỂN KHAI QUẢN TRỊ NỘI DUNG & DUYỆT BÀI HỌC (CONTENT GOVERNANCE)

Hệ thống quản trị nội dung trong `lingora-admin` hiện thực hóa quy trình kiểm duyệt khép kín 6 trạng thái, loại bỏ hoàn toàn các lỗ hổng tự phê duyệt và tự xuất bản.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Manager tạo nhiệm vụ & Creator biên soạn
    DRAFT --> IN_REVIEW : Creator nộp duyệt bài
    IN_REVIEW --> CHANGES_REQUESTED : Moderator yêu cầu chỉnh sửa
    CHANGES_REQUESTED --> DRAFT : Creator tiếp nhận & chỉnh sửa
    IN_REVIEW --> APPROVED : Moderator phê duyệt (Cấm tự duyệt)
    APPROVED --> PUBLISHED : Manager xuất bản ra công chúng
    APPROVED --> PUBLISHED : Admin xuất bản khẩn cấp (Kèm lý do + Audit)
    PUBLISHED --> ARCHIVED : Manager lưu trữ
    PUBLISHED --> ARCHIVED : Admin gỡ khẩn cấp (Kèm lý do + Audit)
    PUBLISHED --> DRAFT : Clone-to-Draft v2 (Tạo Revision mới, supersedesId)
    ARCHIVED --> [*]
```

### 10.1. Chi Tiết Các Chuyển Dịch Trạng Thái & Thẩm Quyền Thực Hiện:
1. **Khởi tạo bản thảo (`DRAFT`):** Organizational Manager tạo nhiệm vụ bài học và gán `assigned_creator_id`. Lesson Creator được phân công tiến hành soạn thảo mục tiêu, từ vựng và bài tập.
2. **Nộp bài kiểm duyệt (`DRAFT → IN_REVIEW`):** Creator nộp bài khi đã hoàn thiện nội dung. Bài học chuyển vào hàng đợi kiểm duyệt tập trung.
3. **Yêu cầu chỉnh sửa (`IN_REVIEW → CHANGES_REQUESTED`):** Moderator đánh giá bài học, nếu chưa đạt chuẩn chất lượng sẽ gửi kèm ghi chú yêu cầu chỉnh sửa (`review_notes`). Trạng thái chuyển về để Creator cập nhật.
4. **Phê duyệt bài học (`IN_REVIEW → APPROVED`):** Moderator đánh giá đạt chất lượng và nhấn phê duyệt. **Ràng buộc SoD:** Hệ thống từ chối nếu Moderator chính là Creator của bài học đó (`403 SOD_VIOLATION_SELF_REVIEW`).
5. **Xuất bản bài học (`APPROVED → PUBLISHED`):**
   - **Luồng thông thường:** Do Organizational Manager thực hiện sau khi rà soát kế hoạch giáo trình.
   - **Luồng khẩn cấp của Quản trị viên (Admin Emergency):** Administrator chỉ được xuất bản khẩn cấp khi bài học **đã ở trạng thái `APPROVED`**, bắt buộc phải nhập lý do giải trình trong form, và hệ thống tự động ghi nhật ký kiểm toán `CONTENT_EMERGENCY_PUB`. Tuyệt đối cấm xuất bản khẩn cấp từ `IN_REVIEW`.
6. **Nhân bản tạo bản thảo mới (Clone-to-Draft v2 qua `supersedes_id` — D3):**
   - Tuyệt đối cấm sửa trực tiếp trên bản ghi bài học đã `PUBLISHED`.
   - Khi cần nâng cấp bài học, hệ thống thực hiện sao chép toàn bộ nội dung của phiên bản đang xuất bản sang một bản ghi mới trong bảng `lesson_revisions` với `version = version_cu + 1`, trạng thái `DRAFT`, và trường `supersedes_id` trỏ về bản ghi đã xuất bản. Bản học cũ vẫn phục vụ học viên bình thường cho đến khi bản mới được duyệt và xuất bản thay thế.

### 10.2. Điều Kiện Hiển Thị Đơn Vị Giáo Trình (Unit 4/4 Published Rule)
Để đảm bảo trải nghiệm học tập không bị đứt đoạn, tầng ứng dụng (`COMP-DOM-02`) và chính sách cơ sở dữ liệu thực thi nghiêm ngặt:
$$\text{Unit Visible to Learner} \iff \sum \text{Published Lessons in Unit} = 4$$
- Nếu một Unit chỉ mới có 1, 2 hoặc 3 bài học đạt trạng thái `PUBLISHED`, toàn bộ Unit đó vẫn ở trạng thái ẩn đối với học viên.

---

## 11. QUY CHUẨN GIAO DIỆN LẬP TRÌNH API & LỚP ĐIỀU PHỐI BFF

### 11.1. Căn Cứ Hợp Đồng & Quy Ước Route Minh Họa
- **Hợp đồng AI `docs/03-api-contract.md`:** Là tài liệu chuẩn tắc đóng băng, **100% byte-identical và chỉ đọc**. Mọi thay đổi trên tệp này đều bị hệ thống phát hiện và coi là vi phạm kỷ luật kiến trúc.
- **Cú pháp Route minh họa:** Toàn bộ các định dạng URL cụ thể xuất hiện dưới đây đều được gắn nhãn: **`[ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]`**. Định danh giao tiếp chuẩn tắc và có thẩm quyền duy nhất giữa các thành phần kiến trúc là các mã định danh bề mặt API (`API-AUTH-*`, `API-LEARN-*`, `API-ASSESS-*`, `API-PRACT-*`, `API-AUTHZ-*`, `API-AI-*`, `API-AUDIT-*`).

### 11.2. Danh Mục Bề Mặt API Chi Tiết (API Surface Register)

| Mã Bề Mặt API | Route Minh Họa [NOT LOCKED] | Thành Phần Sở Hữu | Ranh Giới An Ninh | Yêu Cầu Xác Thực & Quyền | RLS / DB Dependency | Mã Lỗi Chuẩn Tắc | Yêu Cầu Phát Thải Kiểm Toán |
|---|---|---|---|---|---|---|---|
| **API-AUTH-01** | `POST /api/auth/register` | `COMP-DOM-01` | B1 / B3 | Công khai (Public) | Tạo bản ghi `profiles` qua GoTrue | `INVALID_INPUT`, `USER_ALREADY_EXISTS` | Không có |
| **API-AUTH-02** | `POST /api/auth/login` | `COMP-DOM-01` | B1 / B3 | Công khai (Public) | Đọc `profiles` | `INVALID_CREDENTIALS` | `AUTH_LOGIN_FAILED` (nếu sai) |
| **API-LEARN-01**| `GET /api/curriculum/units` | `COMP-DOM-02` | B1 / B3 | Bearer JWT (Learner) | Đọc `units` thỏa mãn luật 4/4 | `UNAUTHORIZED` | Không có |
| **API-LEARN-02**| `GET /api/curriculum/lessons/{id}` | `COMP-DOM-05` | B1 / B3 | Bearer JWT (Learner) | Đọc `lesson_revisions` status `PUBLISHED` | `LESSON_NOT_FOUND`, `LESSON_LOCKED` | Không có |
| **API-LEARN-03**| `POST /api/learning/lesson/submit`| `COMP-DOM-05` | B1 / B3 | Bearer JWT (Learner) | Ghi nguyên tử `user_progress` | `RETRY_ALLOWANCE_EXCEEDED` | Không có |
| **API-ASSESS-01**|`POST /api/assessment/placement/start`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Kiểm tra `profiles.verified_starting_unit` | `ASSESSMENT_ALREADY_COMPLETED` | Không có |
| **API-ASSESS-02**|`POST /api/assessment/placement/submit`| `COMP-DOM-03`| B1 / B3 | Bearer JWT (Learner) | Ghi `assessment_results`, cập nhật `profiles` | `INVALID_INPUT` (ngoài dải 0–30) | `DIAGNOSTIC_COMPLETED` |
| **API-ASSESS-03**|`POST /api/assessment/placement/skip`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Cập nhật `profiles.verified_starting_unit = 1` | `ALREADY_VERIFIED` | Không có |
| **API-ASSESS-04**|`POST /api/assessment/jump/start` | `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Kiểm tra thời gian hồi chiêu 24h | `429 JUMP_COOLDOWN_ACTIVE` | `JUMP_LOCKOUT_TRIGGERED` (nếu trượt) |
| **API-ASSESS-05**|`POST /api/assessment/jump/submit`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Ghi `by_jump = true` trong `user_progress` | `INVALID_INPUT` | Không có |
| **API-PRACT-01**| `GET /api/practice/srs/queue` | `COMP-DOM-04` | B1 / B3 | Bearer JWT (Learner) | Đọc `user_vocab_srs` đến hạn | `UNAUTHORIZED` | Không có |
| **API-PRACT-02**| `POST /api/practice/srs/review` | `COMP-DOM-04` | B1 / B3 | Bearer JWT (Learner) | Thực thi RPC `record_review` Policy B | `INVALID_STAGE` | Không có |
| **API-AUTHZ-01**| `POST /api/admin/content/review`| `COMP-DOM-06` | B2 / B3 | JWT (Moderator) | Cập nhật `status = APPROVED/CHANGES_REQ` | `403 SOD_VIOLATION_SELF_REVIEW` | `CONTENT_APPROVED`, `CONTENT_CHANGES_REQ` |
| **API-AUTHZ-02**| `POST /api/admin/content/publish`| `COMP-DOM-06` | B2 / B3 | JWT (Manager) | Cập nhật `status = PUBLISHED` | `403 SOD_VIOLATION_MODERATOR_PUBLISH` | `CONTENT_PUBLISHED` |
| **API-AUTHZ-03**| `POST /api/admin/content/emergency-publish`| `COMP-DOM-07` | B2 / B3 / B6 | JWT (Administrator)| Cập nhật `status = PUBLISHED`, kèm reason | `403 SOD_VIOLATION_EMERGENCY_UNAPPROVED`, `403 SOD_VIOLATION_MISSING_JUSTIFICATION` | `CONTENT_EMERGENCY_PUB` |
| **API-AI-GEC-01**|`POST /v1/gec/correct` (Nội bộ) | `COMP-EXT-02` | B1 $\rightarrow$ B5 | JWT Header qua Trusted BFF Proxy | Stateless (Zero DB access) | `INVALID_INPUT`, `TEXT_TOO_LONG`, `MODEL_UNAVAILABLE` | Không có |
| **API-AUDIT-01**| `GET /api/admin/audit-logs` | `COMP-DOM-07` | B2 / B6 | JWT (Administrator/Staff)| Đọc bảng `audit_logs` Append-Only | `UNAUTHORIZED`, `FORBIDDEN` | `AUDIT_LOG_INSPECTED` |

---

## 12. CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG & BỘ KHUNG KIỂM THỬ KHẢ THI

Chiến lược kiểm thử của Phase 2 được xây dựng theo mô hình **Kim Tự Tháp Kiểm Thử (Test Pyramid)** hoàn chỉnh, bảo đảm mọi bất biến nghiệp vụ và ranh giới an ninh đều có kiểm thử tự động xác thực khách quan trước khi được chấp thuận.

```text
               / \
              /   \
             / E2E \             -> Playwright Browser Tests (End-to-End User Journeys)
            /-------\
           / Security\           -> RLS Multi-Role Matrix, SoD Denial & Abuse Penetration
          /-----------\
         / Integration \         -> BFF API Route Handlers, Database RPC & AI Proxy
        /---------------\
       / Domain & Logic  \       -> Mapping A, Retry Math, SRS Policy B, Streak Timezone
      /-------------------\
     /     Unit Tests      \     -> Individual utility functions, validators, Zod schemas
    /-----------------------\
```

### 12.1. Chuyển Đổi 18 Khung Kịch Bản M2.6 Thành Bộ Kiểm Thử Khả Thi (Executable Test Specs)

| Khung Test M2.6 | Tên Kịch Bản Kiểm Thử | Tệp Mã Nguồn Kiểm Thử Dự Kiến | Lệnh Thực Thi Kiểm Thử Tương Ứng | Điều Kiện Đạt Khách Quan (Pass Assertion) |
|---|---|---|---|---|
| **Frame 1** | `TEST-MAPPING-A` | `lingora-web/tests/unit/domain/mapping_a.test.ts` | `npx vitest run tests/unit/domain/mapping_a.test.ts` | 12 vector điểm biên (0..30) ánh xạ chính xác 100% ra Unit 1..6; không tạo nhãn CEFR. |
| **Frame 2** | `TEST-DIAG-SKIP` | `lingora-web/tests/integration/api/placement_skip.test.ts` | `npx vitest run tests/integration/api/placement_skip.test.ts` | Trả về `startingUnit = 1`, `UNVERIFIED`; `COUNT(assessment_results) == 0`. |
| **Frame 3** | `TEST-DIAG-RETAKE` | `lingora-admin/tests/integration/assessment_immutable.test.ts` | `npm run test:assessment` | Bản ghi cũ giữ nguyên; tạo bản ghi mới với UUID mới; `verified_starting_unit` cập nhật. |
| **Frame 4** | `TEST-JUMP-PASS` | `lingora-web/tests/unit/domain/jump_threshold.test.ts` | `npx vitest run tests/unit/domain/jump_threshold.test.ts` | Điểm 94.9% $\rightarrow$ FAIL (`isPassed = false`); điểm 95.0% $\rightarrow$ PASS (`isPassed = true`). |
| **Frame 5** | `TEST-JUMP-COOLDOWN`| `lingora-web/tests/integration/api/jump_cooldown.test.ts` | `npx vitest run tests/integration/api/jump_cooldown.test.ts` | Gọi Jump lúc $T_0 + 23h59m \rightarrow 403 / 429$; gọi lúc $T_0 + 24h01m \rightarrow 200 OK$. |
| **Frame 6** | `TEST-JUMP-NON-COMP`| `lingora-web/tests/integration/domain/jump_progression.test.ts` | `npx vitest run tests/integration/domain/jump_progression.test.ts` | Bài học bị nhảy có `by_jump = true`, status `SKIPPED_BY_JUMP`; không tính hoàn thành. |
| **Frame 7** | `TEST-RETRY-ALLOW` | `lingora-web/tests/unit/domain/retry_allowance.test.ts` | `npx vitest run tests/unit/domain/retry_allowance.test.ts` | Bài 15 câu $\rightarrow$ 1 lượt; bài 25 câu $\rightarrow$ 2 lượt; vượt quá lượt $\rightarrow 403 RETRY_EXCEEDED$. |
| **Frame 8** | `TEST-RETRY-CREDIT` | `lingora-web/tests/unit/domain/retry_credit.test.ts` | `npx vitest run tests/unit/domain/retry_credit.test.ts` | Bài 10 điểm làm lại đúng $\rightarrow$ Nhận chính xác $7.0$ điểm ($70\%$); không bao giờ vượt 70%. |
| **Frame 9** | `TEST-SRS-POLICY-B` | `lingora-admin/tests/integration/srs_policy_b.test.ts` | `npm run test:srs` | RPC `record_review` trả về khoảng cách đúng: 1, 3, 7, 14, 30; sai $\rightarrow$ reset về 1 ngày. |
| **Frame 10**| `TEST-STREAK-TZ` | `lingora-web/tests/unit/domain/streak_timezone.test.ts` | `npx vitest run tests/unit/domain/streak_timezone.test.ts` | Bài hoàn thành 23:30 UTC ngày 26 $\rightarrow$ Ghi nhận thuộc ngày 27 theo giờ Việt Nam (UTC+7). |
| **Frame 11**| `TEST-STREAK-RESET` | `lingora-web/tests/unit/domain/streak_reset.test.ts` | `npx vitest run tests/unit/domain/streak_reset.test.ts` | Bỏ học ngày D+1, học ngày D+2 $\rightarrow currentStreak = 1$, $longestStreak$ bảo lưu. |
| **Frame 12**| `TEST-RBAC-MATRIX` | `lingora-web/tests/security/rbac_matrix.test.ts` | `npx vitest run tests/security/rbac_matrix.test.ts` | Quét 15 thao tác nghiệp vụ trên 6 token vai trò; 100% yêu cầu trái phép trả về 403. |
| **Frame 13**| `TEST-RLS-ISOLATE` | `lingora-admin/tests/security/rls_isolation.test.ts` | `npm run test:security` | User A gửi truy vấn trực tiếp nhắm vào User B $\rightarrow$ Kết quả trả về rỗng (0 bản ghi). |
| **Frame 14**| `TEST-SOD-SELF-REV` | `lingora-admin/tests/security/sod_self_review.test.ts` | `npm run test:security` | Creator duyệt bài của chính mình $\rightarrow$ Bị chặn với lỗi `403 SOD_VIOLATION_SELF_REVIEW`. |
| **Frame 15**| `TEST-SOD-MOD-PUB` | `lingora-admin/tests/security/sod_moderator_publish.test.ts`| `npm run test:security` | Moderator xuất bản bài học $\rightarrow$ Bị chặn với lỗi `403 SOD_VIOLATION_MODERATOR_PUBLISH`. |
| **Frame 16**| `TEST-ADMIN-EMERG` | `lingora-admin/tests/security/admin_emergency_publish.test.ts`| `npm run test:security` | Chưa duyệt $\rightarrow 403$; thiếu reason $\rightarrow 403$; duyệt + reason $\rightarrow 200$ + log `CONTENT_EMERGENCY_PUB`. |
| **Frame 17**| `TEST-GEC-TIMEOUT` | `lingora-web/tests/integration/ai/gec_timeout.test.ts` | `npx vitest run tests/integration/ai/gec_timeout.test.ts` | AI phản hồi trễ > 8.0s $\rightarrow$ BFF ngắt kết nối tại 8.0s, trả fallback luật cơ sở. |
| **Frame 18**| `TEST-AI-ISOLATE` | `lingora-ai/api/tests/test_network_isolation.py` | `pytest tests/test_network_isolation.py` | Quét biến môi trường container AI; xác nhận không có chuỗi kết nối DB, không có secret. |

---

## 13. BỘ DỮ LIỆU KIỂM THỬ & DỮ LIỆU MẪU TRÌNH DIỄN (SEED DATA)

Để đảm bảo khả năng tái lặp (reproducibility) trong kiểm thử, ghi hình trình diễn (demo) và thu thập bằng chứng báo cáo, toàn bộ dữ liệu mẫu được chuẩn hóa tất định thông qua tệp kịch bản nạp dữ liệu mầm `prisma/seed.ts`.

### 13.1. Danh Sách Tài Khoản Mẫu Đại Diện 6 Vai Trò Chuẩn Tắc

| Vai Trò Chuẩn Tắc | Email Đăng Nhập | Mật Khẩu Mẫu | Mục Đích Sử Dụng |
|---|---|---|---|
| **Administrator** | `admin.demo@lingora.edu.vn` | `Lingora@2026!Admin` | Trình diễn quản trị tài khoản, kiểm tra audit log, xuất bản khẩn cấp có lý do. |
| **Organizational Manager** | `manager.demo@lingora.edu.vn` | `Lingora@2026!Mgr` | Trình diễn lập kế hoạch bài học, phân công biên soạn, xuất bản bài học chính thức. |
| **Lesson Creator** | `creator.demo@lingora.edu.vn` | `Lingora@2026!Create` | Trình diễn tiếp nhận phân công, soạn thảo bài học bản thảo (Draft), nộp bài kiểm duyệt. |
| **Moderator** | `moderator.demo@lingora.edu.vn` | `Lingora@2026!Mod` | Trình diễn hàng đợi kiểm duyệt, yêu cầu sửa bài, phê duyệt bài học (Approved). |
| **Learner** (Đã kiểm định)| `learner.demo@lingora.edu.vn` | `Lingora@2026!Learn` | Trình diễn luồng học bài, tương tác bài tập, làm lại, ôn tập SRS, chuỗi ngày học. |
| **Operations Staff** | `staff.demo@lingora.edu.vn` | `Lingora@2026!Staff` | Trình diễn tra cứu trạng thái hệ thống và hỗ trợ người dùng theo thẩm quyền. |

### 13.2. Danh Sách 7 Hồ Sơ Học Viên Mẫu (Learner Personas for Test & Demo)
1. `learner.new@lingora.edu.vn`: Học viên mới tinh, chưa làm bài chẩn đoán (sẵn sàng demo luồng Diagnostic và luồng Skip).
2. `learner.skip@lingora.edu.vn`: Học viên đã chọn Skip chẩn đoán, xuất phát điểm Unit 1 với trạng thái `UNVERIFIED` (0 AssessmentResult, 0 SkillProfile).
3. `learner.diagnosed@lingora.edu.vn`: Học viên đã làm bài chẩn đoán đạt 15 điểm, xuất phát điểm được xếp vào Unit 3 theo Mapping A, có bản ghi `AssessmentResult` và `SkillProfile` đầy đủ.
4. `learner.srsdue@lingora.edu.vn`: Học viên có 10 thẻ từ vựng đến hạn ôn tập trong ngày hôm nay (sẵn sàng demo luồng SRS Review).
5. `learner.retry@lingora.edu.vn`: Học viên đang trong một bài học có 20 bài tập, đã sử dụng 1 lượt làm lại và còn 1 lượt làm lại (sẵn sàng demo luồng Controlled Retry và trần điểm 70%).
6. `learner.jump@lingora.edu.vn`: Học viên đã hoàn thành Unit 1, đủ điều kiện làm bài Jump sang Unit 2 (sẵn sàng demo luồng Jump đạt ≥95% và luồng Jump trượt khóa hồi chiêu 24h).
7. `learner.streakreset@lingora.edu.vn`: Học viên có kỷ lục `longestStreak = 15`, ngày học gần nhất là 2 ngày trước (sẵn sàng demo việc đặt lại `currentStreak = 1` do bỏ lỡ 1 ngày).

### 13.3. Dữ Liệu Mẫu Giáo Trình & Vòng Đời Nội Dung
- **Khóa học tiếng Anh A1 (English A1 Pilot):**
  - **Unit 1 (Greetings & Personal Details):** Đầy đủ 4/4 bài học ở trạng thái `PUBLISHED` $\rightarrow$ Đơn vị hiển thị bình thường cho học viên.
  - **Unit 2 (Family & Daily Routines):** Có 3 bài học `PUBLISHED` và 1 bài học `APPROVED` (chưa xuất bản) $\rightarrow$ Đơn vị tự động ẩn đối với học viên theo đúng luật Unit 4/4 Published.
  - **Unit 3 (Food & Dining):** Chứa các bài học đang trong quá trình vòng đời:
    - Bài học 3.1: Trạng thái `DRAFT` (Creator đang biên soạn).
    - Bài học 3.2: Trạng thái `IN_REVIEW` (Đang nằm trong hàng đợi của Moderator).
    - Bài học 3.3: Trạng thái `CHANGES_REQUESTED` (Kèm ghi chú yêu cầu chỉnh sửa).
    - Bài học 3.4: Trạng thái `APPROVED` (Sẵn sàng cho Manager xuất bản hoặc Admin xuất bản khẩn cấp).
  - **Bản thảo nhân bản (Clone-to-Draft):** Một bài học phiên bản 2 (`version = 2`, `status = 'DRAFT'`) có trường `supersedes_id` trỏ về bài học phiên bản 1 đang `PUBLISHED` trong Unit 1.

---

## 14. KỊCH BẢN TRÌNH DIỄN HỆ THỐNG LIÊN TỤC (DEMO PLAN)

Kịch bản trình diễn được thiết kế thành **một câu chuyện liền mạch (Continuous Storyline)** chia làm 4 màn (Acts), phô diễn trọn vẹn sức mạnh của nền tảng, tính thân thiện của giao diện và tính chặt chẽ của các cơ chế quản trị.

```text
+----------------------------------------------------------------------------------------------------+
|                                    LINGORA LIVE DEMONSTRATION WORKFLOW                             |
+----------------------------------------------------------------------------------------------------+
| MÀN 1: HÀNH TRÌNH HỌC VIÊN TOÀN DIỆN (LEARNER JOURNEY)                                             |
|   1. Đăng nhập tài khoản học viên mới (learner.new) -> Hiển thị lời nhắc chẩn đoán năng lực.       |
|   2. Làm bài Placement Test -> Đạt 15/30 điểm thô -> Mapping A tự động xếp vào xuất phát điểm Unit 3|
|   3. Vào Unit 3 -> Vào Bài học -> Trình phát bài tập tương tác (MCQ, Fill, Reorder, Listening).    |
|   4. Cố tình làm sai 1 câu -> Hệ thống giải thích ngữ pháp -> Kích hoạt Controlled Retry.          |
|   5. Làm lại chính xác câu sai -> Điểm số cộng tối đa 70% -> Hoàn thành bài học nguyên tử.         |
|   6. Chuyển sang màn hình SRS -> Ôn tập 5 thẻ từ vựng đến hạn -> Chu kỳ Policy B nhảy bước.        |
|   7. Kiểm tra Streak -> Chuỗi ngày học tăng 1 ngày theo đúng múi giờ Việt Nam.                     |
+----------------------------------------------------------------------------------------------------+
| MÀN 2: HÀNH TRÌNH QUẢN TRỊ VÀ KIỂM DUYỆT NỘI DUNG (CONTENT GOVERNANCE)                             |
|   1. Manager đăng nhập -> Tạo nhiệm vụ biên soạn Bài 10, phân công cho Creator (creator.demo).     |
|   2. Creator đăng nhập -> Nhận thông báo nhiệm vụ -> Vào soạn nội dung và bài tập -> Nộp duyệt bài.|
|   3. Moderator đăng nhập -> Thấy bài trong hàng đợi -> Yêu cầu sửa đổi kèm lý do.                  |
|   4. Creator nhận phản hồi -> Chỉnh sửa và nộp duyệt lại.                                          |
|   5. Moderator kiểm tra -> Phê duyệt bài học (Approved).                                           |
|   6. Manager đăng nhập -> Nhìn thấy bài học đã Approved -> Bấm Xuất bản (Published).               |
+----------------------------------------------------------------------------------------------------+
| MÀN 3: KIỂM CHỨNG BẢO MẬT & PHÂN TÁCH NHIỆM VỤ (SECURITY & SOD DEFENSE)                           |
|   1. Creator cố tình tự duyệt bài do chính mình biên soạn -> Hệ thống chặn, báo lỗi 403 Forbidden. |
|   2. Moderator cố tình xuất bản bài học ra học viên -> Hệ thống chặn, báo lỗi 403 Forbidden.       |
|   3. Admin cố tình xuất bản bài chưa duyệt -> Bị chặn (403 SOD_VIOLATION_EMERGENCY_UNAPPROVED).    |
|   4. Admin xuất bản bài đã Approved nhưng không nhập lý do -> Bị chặn (403 MISSING_JUSTIFICATION). |
|   5. Admin xuất bản khẩn cấp bài Approved có nhập lý do -> Thành công.                             |
|   6. Mở màn hình Audit Log -> Hiển thị bản ghi CONTENT_EMERGENCY_PUB kèm lý do giải trình.         |
+----------------------------------------------------------------------------------------------------+
| MÀN 4: RANH GIỚI TRÍ TUỆ NHÂN TẠO PHI TRẠNG THÁI (AI & GEC FALLBACK BOUNDARY)                      |
|   1. Học viên vào bài tập viết tình huống -> Gõ câu sai ngữ pháp -> Gửi chấm điểm.                 |
|   2. Microservice AI phản hồi phân tích sửa lỗi trực quan (T5-small corrected text diff).          |
|   3. Giả lập microservice AI gặp sự cố (ngắt kết nối hoặc trễ > 8s) -> Mạch ngắt BFF kích hoạt.    |
|   4. Hệ thống tự động chuyển sang chế độ Fallback luật cơ sở -> Giao diện học viên không bị treo.  |
+----------------------------------------------------------------------------------------------------+
```

### Danh Mục Bằng Chứng Ghi Hình Trình Diễn (Demo Evidence Capture Register)

| Mã Bằng Chứng | Tên Phân Đoạn Demo | Trạng Thái Dữ Liệu Cần Seed | Kết Quả Đầu Ra Kỳ Vọng | Định Dạng Thu Thập |
|---|---|---|---|---|
| `DEMO-ACT1-01` | Chẩn đoán năng lực & Mapping A | `learner.new` | Bảng kết quả Mapping A Unit 3; Profile cập nhật | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT1-02` | Trình phát bài tập & Làm lại 70% | Khóa học A1 Unit 3 | Câu sai làm lại nhận 7.0/10 điểm; thanh tiến độ tăng | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT1-03` | Ôn tập ngắt quãng SRS Policy B | `learner.srsdue` | Thẻ đúng nhảy chu kỳ +1 ngày; RPC trả về thành công | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT2-01` | Vòng đời biên soạn & Kiểm duyệt | Bài học phân công mới | Chuyển dịch DRAFT $\rightarrow$ IN_REVIEW $\rightarrow$ APPROVED $\rightarrow$ PUBLISHED | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT3-01` | Chặn vi phạm SoD & Tự duyệt | `creator.demo` | Thông báo lỗi đỏ `403 SOD_VIOLATION_SELF_REVIEW` | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT3-02` | Xuất bản khẩn cấp & Nhật ký Audit| `admin.demo` | Modal nhập lý do; Bảng audit hiển thị sự kiện | Video MP4 / Ảnh chụp màn hình |
| `DEMO-ACT4-01` | Sửa lỗi GEC & Fallback khi AI trễ| Bài viết tình huống | Phản hồi diff ngữ pháp; Fallback kích hoạt tại 8.0s | Video MP4 / Ảnh chụp màn hình |

---

## 15. MA TRẬN BẰNG CHỨNG BÁO CÁO HỌC THUẬT (REPORT EVIDENCE MATRIX)

Nhằm phục vụ trực tiếp cho Báo cáo Học thuật Tốt nghiệp, mọi tuyên bố khoa học và kỹ thuật trong báo cáo đều phải được gắn kèm bằng chứng thực nghiệm khách quan theo bảng ma trận chuẩn 5 cột dưới đây:

| (1) Tuyên Bố Báo Cáo (Report Claim) | (2) Bằng Chứng Khách Quan (Evidence Artifact) | (3) Nguồn Bằng Chứng (Source of Truth) | (4) Phương Thức Thu Thập (How Captured) | (5) Mốc Hoàn Thành (Milestone) |
|---|---|---|---|---|
| **RC-01:** Hệ thống hỗ trợ đầy đủ 6 vai trò chuẩn tắc với phân quyền RLS độc lập | Kết quả test phân quyền 6 vai trò; Log RLS PostgreSQL | `lingora-admin/tests/security/` | Chạy lệnh `npm run test:security`, trích xuất stdout exit code 0 | M3.2 |
| **RC-02:** Thuật toán Mapping A ánh xạ điểm thô 0–30 ra Unit 1–6 tất định | Bảng kết quả chạy 12 vector điểm biên; Unit test log | `lingora-web/tests/unit/domain/mapping_a.test.ts` | Chạy lệnh `npx vitest run mapping_a`, xuất log kiểm thử | M3.4 |
| **RC-03:** Nhánh Skip chẩn đoán không phát sinh kết quả đánh giá giả mạo | Truy vấn SQL kiểm toán đối soát: số lượng bản ghi = 0 | Cơ sở dữ liệu Supabase Postgres | Chạy script kiểm tra DB sau khi nhấn Skip: `COUNT(*) == 0` | M3.4 |
| **RC-04:** Thử thách nhảy cóc đạt ngưỡng ≥95% và áp dụng hồi chiêu 24h | Kết quả chạy test biên 94.9% vs 95.0% và test hồi chiêu | `lingora-web/tests/unit/domain/jump_threshold.test.ts` | Chạy Vitest kiểm thử logic ngưỡng và mock đồng hồ server | M3.5 |
| **RC-05:** Hạn mức làm lại `max(1, floor(N*0.10))` áp dụng trần điểm 70% | Kết quả kiểm thử tính điểm làm lại và chặn lượt thứ N+1 | `lingora-web/tests/unit/domain/retry_allowance.test.ts` | Chạy Vitest kiểm thử logic làm lại có kiểm soát | M3.5 |
| **RC-06:** Thuật toán SRS Policy B tuân thủ nghiêm ngặt mảng `[1,3,7,14,30]` | Log thực thi hàm RPC PostgreSQL `record_review` | `lingora-admin/tests/integration/srs_policy_b.test.ts` | Thực thi test gọi trực tiếp RPC trên cơ sở dữ liệu test | M3.5 |
| **RC-07:** Chuỗi ngày học Streak tính chính xác theo múi giờ IANA của học viên | Kết quả kiểm thử chuyển đổi múi giờ qua các thời điểm biên | `lingora-web/tests/unit/domain/streak_timezone.test.ts` | Chạy Vitest với các trường hợp lệch giờ giữa UTC và UTC+7 | M3.5 |
| **RC-08:** Phân tách nhiệm vụ SoD ngăn chặn hoàn toàn việc Creator tự duyệt bài | Bản ghi phản hồi HTTP 403 và thông báo chặn từ DB Trigger | `lingora-admin/tests/security/sod_self_review.test.ts` | Chạy test giả lập Creator gửi request duyệt bài chính mình | M3.6 |
| **RC-09:** Cơ chế Clone-to-Draft v2 bảo tồn nguyên vẹn bài học đã xuất bản | Bản ghi cơ sở dữ liệu bảng `lesson_revisions` liên kết cha con | Cơ sở dữ liệu Supabase Postgres | Truy vấn cây phả hệ qua trường `supersedes_id` | M3.6 |
| **RC-10:** Đơn vị học chỉ hiển thị khi có đủ 4/4 bài học xuất bản | Kết quả test truy vấn danh sách Unit với các trạng thái bài | `lingora-web/tests/integration/api/curriculum.test.ts` | Test API lấy curriculum: Unit 3 bài published không xuất hiện | M3.3 |
| **RC-11:** Admin xuất bản khẩn cấp bắt buộc có lý do và phát sinh log kiểm toán | Bản ghi nhật ký kiểm toán có action `CONTENT_EMERGENCY_PUB` | Bảng `audit_logs` trong Supabase | Truy vấn bản ghi log sau khi Admin thực hiện xuất bản khẩn cấp | M3.6 |
| **RC-12:** Microservice AI phi trạng thái ngắt kết nối tại 8.0s và có fallback | Log ghi nhận thời gian ngắt kết nối và phản hồi fallback | `lingora-web/tests/integration/ai/gec_timeout.test.ts` | Test mock AI delay 10s: BFF ngắt đúng 8.0s, trả kết quả fallback | M3.7 |
| **RC-13:** Độc lập ranh giới mạng: AI container không thể truy cập trực tiếp DB | Kết quả quét mã nguồn cấu hình mạng và biến môi trường | `lingora-ai/api/tests/test_network_isolation.py` | Pytest kiểm tra cấu hình mạng và biến môi trường container | M3.7 |
| **RC-14:** Toàn bộ hệ thống vượt qua bộ kiểm thử hồi quy và an ninh | Báo cáo tổng hợp kiểm thử toàn hệ thống (Test Summary) | Toàn bộ các thư mục kiểm thử | Script chạy toàn bộ test suites và xuất báo cáo tỷ lệ đạt 100% | M3.9 |

---

## 16. KHUNG KIỂM ĐỊNH HIỆU NĂNG & TIÊU CHÍ PHI CHỨC NĂNG (NFR VALIDATION)

Để đảm bảo tính nghiêm ngặt về phương pháp luận khoa học, toàn bộ các chỉ số phi chức năng phải được **phân định tuyệt đối giữa Mục tiêu thiết kế (TARGET) và Kết quả đo lường thực tế (MEASURED)**. Tuyệt đối không sử dụng con số mục tiêu thiết kế để tuyên bố hệ thống đã đạt hiệu năng khi chưa tiến hành đo đạc thực tế.

### 16.1. Bảng Đối Soát Tiêu Chí Phi Chức Năng (NFR Target vs Measured Framework)

| Mã NFR | Tiêu Chí Phi Chức Năng | Mục Tiêu Thiết Kế (TARGET) | Phương Pháp Đo Lường Thực Nghiệm (Methodology) | Môi Trường Đo Đạc (Environment) | Kết Quả Thực Đo (MEASURED) | Ngưỡng Chấp Thuận (Acceptance Threshold) |
|---|---|---|---|---|---|---|
| **NFR-01** | Thời gian phản hồi API BFF | $< 200 \text{ ms}$ (p95 cho các truy vấn đọc) | Kịch bản k6 đo lường 50 người dùng đồng thời trong 5 phút | Local / Staging Server (Node.js 20) | `CHỜ ĐO ĐẠC TẠI M3.9` | p95 $< 300 \text{ ms}$ |
| **NFR-02** | Thời gian ngắt kết nối AI | $\le 8.0 \text{ giây}$ (Hard timeout) | Giả lập microservice AI phản hồi sau 15 giây | Local Docker Container | `CHỜ ĐO ĐẠC TẠI M3.9` | Ngắt kết nối trong khoảng $8.0 \pm 0.2 \text{ s}$ |
| **NFR-03** | Thời gian suy luận GEC CPU | $\le 2,000 \text{ ms}$ (Warm CPU, văn bản $< 200$ ký tự) | Pytest benchmark chạy 100 câu mẫu văn bản tiếng Anh | Python 3.11, CPU x86_64 4 Cores | `CHỜ ĐO ĐẠC TẠI M3.9` | Trung bình $< 2,500 \text{ ms}$ |
| **NFR-04** | Thời gian tải trang ban đầu (FCP)| $< 1.5 \text{ giây}$ trên đường truyền mạng 4G | Google Lighthouse Audit trên trình duyệt Chrome | Headless Chrome, Network Throttling | `CHỜ ĐO ĐẠC TẠI M3.9` | FCP $< 2.0 \text{ s}$, LCP $< 2.5 \text{ s}$ |
| **NFR-05** | Hiệu năng đánh giá RLS Database | $< 50 \text{ ms}$ (p95 trên tập dữ liệu 10,000 bản ghi) | EXPLAIN ANALYZE trên các câu lệnh SELECT có RLS | PostgreSQL 15 Supabase Instance | `CHỜ ĐO ĐẠC TẠI M3.9` | Execution Time $< 80 \text{ ms}$ |
| **NFR-06** | Khả năng chịu tải đồng thời | 50 phiên học viên tương tác đồng thời | k6 Virtual Users chạy kịch bản làm bài tập liên tục | Staging Environment | `CHỜ ĐO ĐẠC TẠI M3.9` | Tỷ lệ lỗi $< 0.1\%$, CPU $< 80\%$ |

---

## 17. MÔ HÌNH QUẢN TRỊ MỐC & CỔNG NGHIỆM THU (GATED MILESTONE MODEL)

Toàn bộ quá trình thực thi Phase 2 bắt buộc phải tuân thủ nghiêm ngặt **Quy trình Quản trị Đóng Cổng 10 Bước (10-Step Gated Workflow)** được quy định trong `AGENTS.md`. Tuyệt đối không cho phép AI coding agent tự động phê duyệt kế hoạch, tự động nghiệm thu hoặc tự ý commit mã nguồn trước khi vượt qua cổng kiểm định.

```text
+---------------------------------------------------------------------------------------------------+
|                                  10-STEP MANDATORY GATED WORKFLOW                                 |
+---------------------------------------------------------------------------------------------------+
| 1. PLAN: Soạn thảo hoặc cập nhật kế hoạch chi tiết cho mốc thực thi trong plans/current-task.md   |
|     |                                                                                             |
|     v                                                                                             |
| 2. PLAN REVIEW: Kiểm tra kế hoạch đối chiếu với kiến trúc, an ninh, schema và ranh giới hệ thống  |
|     |                                                                                             |
|     v                                                                                             |
| 3. HUMAN APPROVAL: Con người (Human Operator) kiểm tra và đổi trạng thái thành APPROVED           |
|     |               (KỸ SƯ AI TUYỆT ĐỐI KHÔNG TỰ CHUYỂN TRẠNG THÁI SANG APPROVED)                 |
|     v                                                                                             |
| 4. IMPLEMENT: Tiến hành lập trình chính xác theo phạm vi đã được phê duyệt trong kế hoạch          |
|     |                                                                                             |
|     v                                                                                             |
| 5. TEST: Thực thi 100% các bài kiểm thử tự động trong kế hoạch và ghi nhận bằng chứng khách quan  |
|     |                                                                                             |
|     v                                                                                             |
| 6. INDEPENDENT REVIEW: Kiểm định viên độc lập (Codex/Human) thực hiện rà soát chất lượng mã nguồn |
|     |                                                                                             |
|     v                                                                                             |
| 7. REMEDIATION (nếu có): Khắc phục toàn bộ các lỗi P0, P1 và P2 được phát hiện trong quá trình review|
|     |                                                                                             |
|     v                                                                                             |
| 8. RE-REVIEW: Kiểm định lại độc lập xác nhận 100% các phát hiện đã được khắc phục hoàn toàn       |
|     |                                                                                             |
|     v                                                                                             |
| 9. ACCEPTANCE: Con người ghi nhận quyết định chấp thuận nghiệm thu chính thức vào ADR              |
|     |                                                                                             |
|     v                                                                                             |
| 10. CHECKPOINT COMMIT: Tạo commit git ghi nhận mốc hoàn thành kèm đầy đủ log kiểm thử và quyết định|
+---------------------------------------------------------------------------------------------------+
```

---

## 18. ÁNH XẠ TRIỂN KHAI VÀO CẤU TRÚC BÁO CÁO HỌC THUẬT

Để tối ưu hóa năng suất và bảo đảm sự đồng bộ tuyệt đối giữa sản phẩm phần mềm và luận văn tốt nghiệp, toàn bộ các mốc triển khai Phase 2 được ánh xạ trực tiếp vào 5 chương chính của Báo cáo Học thuật theo nguyên tắc: **Lập trình một lần $\rightarrow$ Kiểm thử một lần $\rightarrow$ Thu thập bằng chứng một lần $\rightarrow$ Sử dụng đồng thời cho cả Demo và Báo cáo**.

```text
+----------------------------------------------------------------------------------------------------+
|                         ACADEMIC REPORT CHAPTER-TO-MILESTONE MAPPING MATRIX                        |
+----------------------------------------------------------------------------------------------------+
| CHƯƠNG 1: GIỚI THIỆU & NGHIÊN CỨU NHU CẦU NGƯỜI DÙNG                                               |
|   - Nội dung báo cáo: Kết quả khảo sát thực nghiệm N=15, 8 điểm đau, phân tích đối thủ cạnh tranh. |
|   - Bằng chứng thu thập: Biểu đồ khảo sát thực tế, ma trận Pain Points, căn cứ quyết định D1–D9.   |
|   - Mốc cung cấp bằng chứng: Kế thừa từ Phase 0 & Milestone M2.1.                                  |
+----------------------------------------------------------------------------------------------------+
| CHƯƠNG 2: PHÂN TÍCH YÊU CẦU & MÔ HÌNH HÓA NGHIỆP VỤ                                                |
|   - Nội dung báo cáo: 15 Ca sử dụng (UC), 15 Luồng nghiệp vụ (BF), 6 vai trò, quy tắc SoD.         |
|   - Bằng chứng thu thập: Sơ đồ Use Case, Activity Diagrams, ma trận phân quyền RBAC.               |
|   - Mốc cung cấp bằng chứng: Kế thừa từ Milestone M2.2 & M3.2.                                     |
+----------------------------------------------------------------------------------------------------+
| CHƯƠNG 3: PHÂN TÍCH & THIẾT KẾ KIẾN TRÚC HỆ THỐNG                                                  |
|   - Nội dung báo cáo: 19 Thành phần kiến trúc, 5 Vùng an ninh, 6 Ranh giới, Sơ đồ tuần tự SEQ-01..10|
|   - Bằng chứng thu thập: Sơ đồ Component, Deployment Boundary, Sequence Diagrams, DFD Context/L0/L1.|
|   - Mốc cung cấp bằng chứng: Kế thừa từ Milestone M2.3, M2.4 & M3.8.                               |
+----------------------------------------------------------------------------------------------------+
| CHƯƠNG 4: THIẾT KẾ & TRIỂN KHAI CƠ SỞ DỮ LIỆU                                                      |
|   - Nội dung báo cáo: Lược đồ quan hệ thực thể ERD, Từ điển dữ liệu, Chính sách RLS, 8 pha Migration|
|   - Bằng chứng thu thập: Prisma Schema, DDL Migration files, Mã nguồn chính sách RLS, Test logs RLS|
|   - Mốc cung cấp bằng chứng: Hình thành trực tiếp từ Milestone M3.1 & M3.2.                         |
+----------------------------------------------------------------------------------------------------+
| CHƯƠNG 5: CÀI ĐẶT HỆ THỐNG, KIỂM THỬ & THỰC NGHIỆM ĐÁNH GIÁ                                        |
|   - Nội dung báo cáo: Trình bày giao diện Web Learner & Admin, Bộ kiểm thử tự động, Đo lường NFR.   |
|   - Bằng chứng thu thập: Ảnh chụp giao diện thực tế, Kết quả kiểm thử Vitest/Pytest/Playwright,    |
|                          Biểu đồ hiệu năng k6 benchmark, Bảng đối soát NFR Target vs Measured.     |
|   - Mốc cung cấp bằng chứng: Hình thành trực tiếp từ Milestone M3.3 đến M3.10.                      |
+----------------------------------------------------------------------------------------------------+
| PHỤ LỤC HỌC THUẬT: HỒ SƠ KIỂM ĐỊNH THIẾT KẾ & NHẬT KÝ QUẢN TRỊ                                     |
|   - Nội dung báo cáo: Báo cáo kiểm định 10 cổng D-G1..D-G10, Sổ đăng ký quyết định kiến trúc ADR.  |
|   - Bằng chứng thu thập: Toàn bộ lịch sử logs/decision-log.md, logs/test-log.md, ADR-001..029.     |
|   - Mốc cung cấp bằng chứng: Kế thừa từ M2.5, M2.6 và hoàn thiện tại M3.10.                         |
+----------------------------------------------------------------------------------------------------+
```

---

## 19. SỔ ĐĂNG KÝ RỦI RO & KHOẢNG TRỐNG KỸ THUẬT (RISK REGISTER)

| ID | Tên Rủi Ro / Khoảng Trống | Mức Độ Ảnh Hưởng | Phụ Thuộc Liên Quan | Giải Pháp Giảm Thiểu (Mitigation Strategy) | Thành Phần Sở Hữu | Cổng Kiểm Soát |
|---|---|---|---|---|---|---|
| **RSK-01** | Xung đột khóa bảng PostgreSQL khi thực hiện di chuyển dữ liệu lớn | `CAO` (Gây tắc nghẽn truy vấn) | `DEP-TECH-01`, `DEP-TECH-02` | Áp dụng chiến lược chia nhỏ đợt (batching ~500 bản ghi), đặt `lock_timeout = 5s`, tạo chỉ mục bằng `CONCURRENTLY`. | `COMP-INFRA-01` | Cổng M3.1 |
| **RSK-02** | Lỗ hổng rò rỉ dữ liệu chéo học viên do cấu hình RLS sai sót | `NGHIÊM TRỌNG` (Vi phạm bảo mật) | `DEP-TECH-09` | Bắt buộc chạy bộ test tự động PostgREST giả lập tấn công chéo người dùng trước khi mở lưu lượng; cấm bypass RLS. | `COMP-INFRA-02` | Cổng M3.2 |
| **RSK-03** | Suy giảm hiệu năng truy vấn bài học do đệ quy kiểm tra trạng thái Unit | `TRUNG BÌNH` (Tăng độ trễ API) | `COMP-DOM-02` | Thiết lập chỉ mục phức hợp trên cặp `(course_id, order_index)` và chỉ mục trên trường `status`; tạo view đệm nếu cần. | `COMP-DOM-02` | Cổng M3.3 |
| **RSK-04** | Microservice AI phản hồi chậm làm cạn kiệt kết nối của máy chủ BFF | `CAO` (Gây sập dịch vụ web) | `DEP-TECH-06`, `DEP-TECH-07` | Cài đặt mạch ngắt (circuit breaker) với timeout cứng 8.0s; trả ngay kết quả dự phòng fallback luật cơ sở. | `COMP-DOM-08` | Cổng M3.7 |
| **RSK-05** | Gian lận điểm chuỗi học tập (Streak) bằng cách thao túng đồng hồ client | `TRUNG BÌNH` (Ảnh hưởng gamification)| `COMP-DOM-02` | Tuyệt đối sử dụng đồng hồ máy chủ UTC làm gốc, chỉ dùng múi giờ IANA của học viên trên server để quy đổi ngày lịch. | `COMP-DOM-02` | Cổng M3.5 |
| **RSK-06** | Creator tự phê duyệt bài học thông qua gọi trực tiếp API bỏ qua UI | `CAO` (Vi phạm phân tách nhiệm vụ) | `COMP-DOM-06` | Cài đặt trigger cơ sở dữ liệu độc lập ở tầng PostgreSQL từ chối giao dịch; không phụ thuộc vào kiểm tra UI. | `COMP-INFRA-02` | Cổng M3.6 |
| **RSK-07** | Thiếu dữ liệu thực nghiệm phục vụ viết Chương 5 của Luận văn | `TRUNG BÌNH` (Chậm tiến độ báo cáo) | `DEP-GOV-04` | Thu thập bằng chứng liên tục tại từng mốc (Code đến đâu thu test log, benchmark và ảnh chụp đến đó). | Toàn bộ hệ thống | Cổng M3.10 |

---

## 20. LỘ TRÌNH TỔNG THỂ GIAI ĐOẠN 2 (MASTER ROADMAP M3.1..M3.10)

Lộ trình tổng thể Giai đoạn 2 bao gồm **10 mốc triển khai chuẩn tắc (M3.1 đến M3.10)**, được thiết kế nối tiếp nhau theo thứ bậc phụ thuộc kiến trúc, kế thừa trọn vẹn từ M2.6 và dẫn dắt toàn bộ dự án đến đích bàn giao và bảo vệ thành công:

```text
====================================================================================================
                        LINGORA PHASE 2 MASTER IMPLEMENTATION ROADMAP
====================================================================================================

[PHASE 1: SYSTEM DESIGN] ──(M2.6 Accepted @ 4c8a7db)──┐
                                                      │
┌─────────────────────────────────────────────────────┘
│
├── M3.1: Foundation (Database & Schema Migration Strategy)
│   ├── Mục tiêu: Triển khai lược đồ vật lý, bảng units, lesson_revisions, assessment_results, seed A1.
│   └── Cổng nghiệm thu: Schema validation PASS, Migration UP/DOWN verified, Seed 6 Units A1 complete.
│
├── M3.2: Authentication, RBAC, RLS & SoD Engine
│   ├── Mục tiêu: Nâng cấp 6 vai trò, ma trận chính sách RLS kép, triggers chặn vi phạm SoD, audit logs.
│   └── Cổng nghiệm thu: 6-Role JWT auth PASS, Cross-user RLS isolation PASS, SoD denial tests PASS.
│
├── M3.3: Learner Core (Lesson & Exercise Execution Engine)
│   ├── Mục tiêu: Trình phát bài học, 5 dạng tương tác bài tập (MCQ, Fill, Reorder, Listening, Grammar).
│   └── Cổng nghiệm thu: 5 Exercise types interactive PASS, Unit 4/4 Published condition verified.
│
├── M3.4: Assessment & Progression Engine (Placement, Starting Point, Skip, Retake)
│   ├── Mục tiêu: Động cơ chẩn đoán ~25–30 câu, Mapping A (0–30), Skip Branch A, Retake bất biến.
│   └── Cổng nghiệm thu: Mapping A 12 boundary vectors PASS, Skip 0-record PASS, Retake immutable PASS.
│
├── M3.5: Learning Intelligence (Controlled Retry, SRS Policy B, Jump Challenge, Streak)
│   ├── Mục tiêu: Hạn mức retry max(1, floor(N*0.10)) trần 70%, SRS Policy B [1,3,7,14,30], Jump >=95%, Streak IANA.
│   └── Cổng nghiệm thu: Retry credit 70% PASS, SRS RPC determinism PASS, Jump 24h lockout PASS, Streak PASS.
│
├── M3.6: Content Governance & Moderation (Authoring, Review, Publish, Emergency, Clone-to-Draft)
│   ├── Mục tiêu: Phân công Manager, soạn thảo Creator, duyệt bài Moderator, xuất bản, Admin khẩn cấp kèm lý do.
│   └── Cổng nghiệm thu: Vòng đời 6 trạng thái PASS, Creator no self-approve PASS, Clone-to-Draft v2 PASS.
│
├── M3.7: AI / GEC Service Integration (Stateless Proxy, Timeout 8.0s, Fallback)
│   ├── Mục tiêu: Lập trình /v1/gec/correct trong FastAPI theo hợp đồng 03, Next.js proxy, mạch ngắt 8.0s, fallback.
│   └── Cổng nghiệm thu: Contract 03 byte-identical PASS, Timeout 8.0s circuit-breaker PASS, Fallback PASS.
│
├── M3.8: System Integration & End-to-End Learner Journey
│   ├── Mục tiêu: Lắp ghép toàn bộ các phân hệ thành luồng học tập và quản trị hoàn chỉnh; kiểm thử E2E Playwright.
│   └── Cổng nghiệm thu: 15 Use Cases & 15 Behavioral Families E2E pass, Zero broken routes.
│
├── M3.9: System Hardening, Performance & Security Verification
│   ├── Mục tiêu: Rà soát an ninh toàn diện, đo lường tiêu chí phi chức năng NFR (k6 benchmark, Lighthouse).
│   └── Cổng nghiệm thu: NFR Measured recorded, Security audit clean, Zero P0/P1 issues.
│
└── M3.10: Demo Readiness & Academic Report Evidence Consolidation
    ├── Mục tiêu: Thu thập toàn bộ bằng chứng cho 5 chương báo cáo học thuật, đóng gói kịch bản demo 4 Acts.
    └── Cổng nghiệm thu: Báo cáo Word/Markdown đồng bộ 100%, 4 Acts demo hoàn chỉnh, sẵn sàng bảo vệ.
```

---

## 21. RÀNG BUỘC CỨNG VÀ KỶ LUẬT THỰC THI (HARD CONSTRAINTS)

Để bảo đảm tính toàn vẹn và tuân thủ tuyệt đối quy tắc phát triển phần mềm trong dự án Lingora, toàn bộ các bên tham gia bắt buộc phải tuân thủ nghiêm ngặt các điều khoản sau:

1. **KHÔNG THỰC THI CODE TRONG TASK NÀY:** Nhiệm vụ của task này thuần túy là xây dựng bản Kế hoạch Tổng thể (Master Planning). Tuyệt đối không chỉnh sửa mã nguồn ứng dụng, không sửa `schema.prisma`, không chạy lệnh migration, không sửa RLS, và không can thiệp vào các tệp tin ngoài danh mục cho phép.
2. **BẢO TỒN TÍNH BẤT BIẾN CỦA HỢP ĐỒNG API:** Tệp `docs/03-api-contract.md` là hợp đồng giao tiếp chuẩn tắc đã đóng băng, giữ nguyên 100% byte-identical.
3. **BẢO TỒN CÁC THAY ĐỔI TRÊN WORKTREE HIỆN TẠI:** Toàn bộ các thay đổi chưa commit trên nhánh làm việc hiện tại (các tệp báo cáo học thuật, slide thuyết trình, tài liệu phân tích yêu cầu) thuộc về tiến trình song song và phải được bảo lưu nguyên vẹn, không được phép hoàn nguyên hay xóa bỏ.
4. **KHÔNG TỰ Ý CHUYỂN TRẠNG THÁI APPROVED:** Kế hoạch này được tạo ra ở trạng thái `READY FOR HUMAN REVIEW`. Chỉ có người dùng (Human Partner) mới có thẩm quyền chuyển trạng thái sang `APPROVED`. Mã nguồn triển khai chỉ được phép bắt đầu khi kế hoạch đã được phê duyệt chính thức.
5. **KỶ LUẬT CHUYỂN TIẾP MỐC TRIỂN KHAI:** Khi bước vào Giai đoạn 2, mỗi mốc từ M3.1 đến M3.10 bắt buộc phải có một kế hoạch chi tiết độc lập (`plans/current-task.md`), được thẩm định độc lập và kiểm tra đạt 100% các cổng kiểm soát trước khi chuyển sang mốc tiếp theo.
