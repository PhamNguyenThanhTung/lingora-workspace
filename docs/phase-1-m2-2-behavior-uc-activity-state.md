# LINGORA — PHASE 1 MILESTONE M2.2: BEHAVIORAL SPECIFICATION (USE CASES, ACTIVITIES, STATE MACHINES & DECISION FLOWS)

> **Mã tài liệu:** `docs/phase-1-m2-2-behavior-uc-activity-state.md`  
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Mốc thực thi:** Milestone M2.2 (Behavior, Use Cases, Activities, State Machines & Screen Flows) — Remediation Revision  
> **Trạng thái:** `READY FOR INDEPENDENT RE-REVIEW` (Triển khai khắc phục toàn diện theo kết luận Đánh giá Độc lập; KHÔNG tuyên bố Design Freeze; KHÔNG tự ý coi là ACCEPTED).  
> **Căn cứ kế hoạch:** `plans/m2-2-behavior-uc-activity-state-plan.md`, `docs/phase-1-system-design-plan.md` §7 (Artifacts #2, #3, #9, #10, #17, #18, #19; Cổng D-G4, D-G7).  
> **Ranh giới nghiêm ngặt:** KHÔNG mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÔNG Prisma schema/migration/DB execution, KHÔNG UI components/CSS/pixel design, KHÔNG tự chế thuật toán tính điểm/xếp lớp/mastery/readiness, KHÔNG thay đổi Product Policies D1–D9 đã đóng băng, KHÔNG sửa đổi tài liệu nguồn D1–D4 và M2.1.

---

## 1. Executive Summary & Management Contract

Mốc M2.2 thiết lập toàn bộ **lớp hành vi (Behavior Layer)** cho hệ thống Lingora trên nền tảng mô hình miền và cấu trúc dữ liệu logic M2.1 đã được nghiệm thu độc lập (`M2.1 ACCEPTED FOR M2.2`). Tài liệu chuẩn hóa hành vi hệ thống ở mức độc lập triển khai, kế thừa nguyên văn các quyết định sản phẩm đã đóng băng (D1–D9, Khung 6 Units English A1, Placement Mapping A, Jump $\ge 95\%$, Controlled Retry D7, SRS Policy B D8, Streak D9).

### 1.1. Six-Field Contract for M2.2 Artifacts

Theo yêu cầu chuẩn hóa của `docs/phase-1-system-design-plan.md` §5, tất cả 7 artifacts thành phần thuộc M2.2 tuân thủ nghiêm ngặt hợp đồng 6 trường:

| Artifact ID & Tên Artifact | 1. Purpose (Mục đích) | 2. Inputs (Đầu vào) | 3. Outputs (Đầu ra) | 4. Dependencies (Phụ thuộc) | 5. Trace (Truy vết) | 6. Validation Gate (Cổng kiểm định) |
|---|---|---|---|---|---|---|
| **#2 Content Lifecycle State Model** | Định nghĩa hành vi chuyển trạng thái nội dung học liệu và thẩm quyền tác nhân (SoD) | M2.1 §5, ADR-002, `content-lifecycle-state.puml` | Quy tắc kích hoạt chuyển trạng thái, ràng buộc Clone-to-Draft v2, quyền khẩn cấp Admin | M2.1 §5.2, SoD Baseline | `YC-CORE-04..06`, `MVP-12/13/19`, `P1-FR-008`, `UC-08/09/10` | **D-G1** (kế thừa), **D-G4** |
| **#3 Learning Progression Model** | Định nghĩa hành vi tiến trình người học, phân định 2 nhánh nhập môn (Self-reported vs Diagnostic) | D3 §D/§F, M2.1 §6, `learning-progression-model.puml` | Quy tắc đánh giá 3 trạng thái (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`), Invariants I1–I10 | M2.1 §6, D3 Engine | `YC-CORE-07/09/11`, `MVP-03/08/11`, `P1-FR-004/016`, `UC-03/04/05/07` | **D-G4**, **D-G7** |
| **#9 Use Case Diagram & Catalog** | Bản đồ tương tác giữa 6 vai trò chuẩn tắc và 15 Use Cases chuẩn tắc | `docs/06-system-analysis.md` §4, `docs/02-requirements.md` | Danh mục 15 Use Cases hoàn chỉnh, ma trận liên kết Actor–UC, phân định Core vs Extension | Canonical Roles, SoD Matrix | `YC-CORE-01..12`, `YC-EXT-01..08`, `MVP-01..19`, `UC-01..15` | **D-G4** |
| **#10 Activity / State Behavior Set** | Đặc tả luồng hoạt động chi tiết cho 15 họ hành vi (BF-01..BF-15) và các máy trạng thái | `docs/06-system-analysis.md` §5, D1–D9 policies | 15 behavioral specifications, bảng quyết định rẽ nhánh, trạng thái đối tượng miền | 15 UC Specs, M2.1 Entities | `BF-01..15`, `P1-FR-001..016`, `UC-01..15` | **D-G4**, **D-G7** |
| **#17 Placement / Jump Decision Flows** | Luồng quyết định chẩn đoán xếp lớp và kiểm tra vượt cấp nhảy bài | `docs/09-placement-and-jump-specification.md`, D5, D6 | Cây quyết định Mapping A (English A1), cây quyết định Jump (20/25-30/40q, $\ge 95\%$, 24h cooldown) | Curriculum 08, D3 Engine | `YC-CORE-09`, `MVP-03`, `P1-FR-016`, `UC-03`, `UC-04` | **D-G7** |
| **#18 SRS Decision Flow** | Luồng quyết định ôn tập ngắt quãng từ vựng theo chu kỳ tất định | ADR-002, D8, `docs/04-data-model.md` RPC `record_review` | Cây quyết định chu kỳ $[1, 3, 7, 14, 30]$, hàng đợi `nextReviewAt`, tương tác chuỗi Streak | UserVocabSrs, ReviewLog | `YC-CORE-08`, `MVP-09`, `P1-FR-005/006`, `UC-06` | **D-G7** |
| **#19 Screen-Flow Inventory** | Sổ bộ kiểm kê luồng màn hình giao diện mức logic cho học viên và khối quản trị | `docs/06-system-analysis.md`, D4 Blueprint | Danh mục luồng màn hình logic (Learner Chain, Authoring Chain), nhãn trạng thái và phân quyền | 15 UCs, SoD Matrix | `MVP-01..19`, `UC-01..15` | **D-G4** |

---

## 2. Canonical 15 Use Cases Catalog & Full Specifications

Hệ thống Lingora chuẩn hóa chính xác **15 Use Cases** (`UC-01` đến `UC-15`). Tuyệt đối không tồn tại các mã ảo `UC-16`, `UC-17`, `UC-18`. Không dùng nhãn phân rã sai quy cách `UC-06-viết`. Tính năng kiểm tra ngữ pháp câu viết tự do theo `P1-FR-007` thuộc về họ hành vi **`BF-14`** (hỗ trợ bởi dịch vụ GEC stateless) và không chiếm một Use Case độc lập. `UC-15` (Quản lý lớp học & tiến độ nhóm) được phân loại chính thức là **`OPTIONAL / FUTURE EXTENSION BOUNDARY`**.

```
+-------------------------------------------------------------------------------------------------------+
|                                      LINGORA USE CASE CATALOG                                         |
+----------------------------------+----------------------------------+---------------------------------+
| CORE LEARNER SUITE               | CONTENT & AUTHORING SUITE        | ADMINISTRATION & OPERATIONS     |
| - UC-01: Authenticate & Session  | - UC-08: Create/Edit Lesson Draft| - UC-11: Manage Accounts & Roles|
| - UC-02: Configure Goals & Time  | - UC-09: Review/Moderate Content | - UC-12: View System Reports    |
| - UC-03: Take Placement Test     | - UC-10: Publish Approved Content| - UC-13: View/Audit Security Log|
| - UC-04: Browse Path & Jump      |                                  | - UC-14: Handle Support Tickets |
| - UC-05: Complete Lesson Exercises|                                 |                                 |
| - UC-06: Spaced Repetition (SRS) |                                  | EXTENSION SUITE (OPTIONAL/FUTURE|
| - UC-07: Track Progress & Streak |                                  | - UC-15: Manage Cohorts / Groups|
+----------------------------------+----------------------------------+---------------------------------+
```

---

### UC-01: Authenticate & Manage Session

- **Mã định danh:** `UC-01`
- **Tên Use Case:** Đăng ký, Đăng nhập & Quản lý Phiên Người dùng (Authenticate & Manage Session)
- **Tác nhân chính (Primary Actor):** `Learner`, Tất cả các vai trò hệ thống (`Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`)
- **Tác nhân hỗ trợ:** Hệ thống xác thực Supabase GoTrue Auth
- **Kích hoạt (Trigger):** Người dùng truy cập trang xác thực, gửi thông tin đăng ký/đăng nhập, hoặc phiên làm việc hết hạn/đăng xuất.
- **Tiền điều kiện (Preconditions):**
  1. Người dùng có kết nối mạng tới Lingora BFF/Web client.
  2. Địa chỉ email đăng ký chưa tồn tại trong hệ thống (đối với luồng Sign Up).
- **Luồng sự kiện chính (Main Success Flow):**
  1. Người dùng chọn phương thức xác thực: Email/Mật khẩu hoặc Đăng ký tài khoản mới.
  2. Hệ thống kiểm tra tính hợp lệ cú pháp (RFC 5322 email, mật khẩu tối thiểu 8 ký tự).
  3. Client gửi yêu cầu xác thực qua Next.js Server Action / Route Handler proxy tới Supabase GoTrue Auth.
  4. Supabase xác thực thông tin đăng nhập và phát hành JWT token (chuẩn ký ES256/HS256).
  5. Hệ thống tra cứu bản ghi `Profile` liên kết với `auth.uid()` để xác định vai trò (`role`) và quyền hạn.
  6. Hệ thống thiết lập phiên an toàn qua `httpOnly`, `Secure`, `SameSite=Lax` cookie (Client không lưu JWT thô trong `localStorage`).
  7. Người dùng được điều hướng về màn hình tương ứng: `Learner` về Bảng điều khiển học tập (`/learn`), Nhân sự quản trị về Cổng tác nghiệp tương ứng theo vai trò.
- **Luồng nhánh / Luồng thay thế (Alternate Flows):**
  - *AF-01 (Đăng ký tài khoản mới):* Người học điền email, mật khẩu, họ tên $\rightarrow$ Hệ thống tạo tài khoản auth $\rightarrow$ Tự động tạo bản ghi `Profile` mặc định vai trò `LEARNER` $\rightarrow$ Tự động khởi tạo `LearnerProfile` $\rightarrow$ Chuyển tiếp tới màn hình Thiết lập mục tiêu ban đầu (`UC-02`).
  - *AF-02 (Đăng xuất an toàn):* Người dùng bấm Đăng xuất $\rightarrow$ Server Action thu hồi refresh token tại Supabase Auth $\rightarrow$ Xóa sạch phiên cookie `httpOnly` $\rightarrow$ Điều hướng về trang đăng nhập `/login`.
- **Luồng ngoại lệ (Exception Flows):**
  - *EF-01 (Thông tin đăng nhập không hợp lệ):* Mật khẩu sai hoặc email không tồn tại $\rightarrow$ Hệ thống trả lỗi chuẩn `AUTH_INVALID_CREDENTIALS` $\rightarrow$ Giao diện hiển thị thông báo song ngữ (vi/en), không tiết lộ email có tồn tại hay không $\rightarrow$ Luồng dừng lại.
  - *EF-02 (Tài khoản bị khóa):* Bản ghi `Profile` có trạng thái vô hiệu hóa $\rightarrow$ Hệ thống hủy phiên và trả lỗi `AUTH_ACCOUNT_DISABLED` $\rightarrow$ Điều hướng tới thông báo hỗ trợ (`UC-14`).
- **Hậu điều kiện (Postconditions):**
  - Phiên làm việc hợp lệ được thiết lập qua cookie bảo mật.
  - Bản ghi kiểm toán phiên đăng nhập được ghi nhận nếu là tài khoản quản trị.
- **Quy tắc nghiệp vụ áp dụng (Business Rules):**
  - `BR-AUTH-01`: Client tuyệt đối không lưu JWT trong `localStorage` hay `sessionStorage`.
  - `BR-AUTH-02`: Phân quyền dựa trên vai trò gán (`Profile.role` / `Profile.assignedRoles`); người học chỉ truy cập được dữ liệu thuộc quyền sở hữu của chính mình (`auth.uid() = profile.id`).
- **Thực thể miền tham chiếu:** `Profile`, `LearnerProfile`.
- **Truy vết:** `YC-CORE-01` $\rightarrow$ `MVP-01` $\rightarrow$ `P1-FR-001`, `P1-FR-010` $\rightarrow$ `BF-01`.

---

### UC-02: Configure Goals & Study Time

- **Mã định danh:** `UC-02`
- **Tên Use Case:** Thiết lập Mục tiêu Học tập & Thời gian Hàng ngày (Configure Goals & Study Time)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học lần đầu nhập môn sau khi đăng ký, hoặc chủ động mở trang Cài đặt học tập cá nhân.
- **Tiền điều kiện:** Người học đã xác thực thành công (`UC-01`) và sở hữu bản ghi `LearnerProfile`.
- **Luồng sự kiện chính:**
  1. Người học truy cập giao diện thiết lập mục tiêu cá nhân (`SCR-L-02`).
  2. Hệ thống hiển thị các tùy chọn mục tiêu học tập (Giao tiếp công việc, Du lịch, Học thuật, Sở thích) và thời lượng cam kết hàng ngày: 5 phút, 15 phút, 30 phút, 60 phút, hoặc 120 phút (`P1-FR-014`).
  3. Người học lựa chọn mục tiêu học tập và thiết lập chỉ số `dailyGoalMin` (mặc định 15 phút).
  4. Người học chọn múi giờ địa phương (`timezone`, mặc định `Asia/Ho_Chi_Minh`).
  5. Người học bật/tắt nhắc nhở học tập trong ứng dụng (`In-app Reminder`, `P1-FR-015`).
  6. Người học nhấn Lưu cài đặt.
  7. Hệ thống cập nhật các trường cấu hình trên bản ghi `Profile` và `LearnerProfile`.
- **Luồng nhánh / Luồng thay thế:**
  - *AF-01 (Bỏ qua thiết lập ban đầu):* Người học bấm "Để sau" $\rightarrow$ Hệ thống áp dụng giá trị mặc định (`dailyGoalMin = 15`, `timezone = "Asia/Ho_Chi_Minh"`) và chuyển sang bước tiếp theo.
- **Luồng ngoại lệ:**
  - *EF-01 (Thời gian cam kết ngoài phạm vi):* Giá trị gửi lên $<5$ hoặc $>120$ phút $\rightarrow$ Hệ thống từ chối cập nhật, hiển thị thông báo lỗi `GOAL_OUT_OF_RANGE`.
- **Hậu điều kiện:**
  - Bản ghi `Profile` được cập nhật `dailyGoalMin`, `timezone`.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-GOAL-01`: Thời lượng cam kết hợp lệ nằm trong khoảng $[5..120]$ phút.
  - `BR-GOAL-02`: Nhắc nhở hoạt động theo cơ chế In-App trong phiên (`ADR-008 Option 6d`); push notifications từ server bị hoãn (DEFERRED).
- **Thực thể miền tham chiếu:** `Profile`, `LearnerProfile`.
- **Truy vết:** `YC-CORE-02`, `YC-CORE-10` $\rightarrow$ `MVP-02`, `MVP-10` $\rightarrow$ `P1-FR-014`, `P1-FR-015`. *(Lưu ý: P1-FR-011 thuộc về UC-07; không gộp sai vào UC-02)*.

---

### UC-03: Take Placement Test

- **Mã định danh:** `UC-03`
- **Tên Use Case:** Đánh giá Chẩn đoán Xếp lớp Ban đầu (Take Placement Test / Diagnostic Assessment)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học mới hoàn thành bước thiết lập mục tiêu trong Onboarding, hoặc học viên cũ chủ động chọn "Làm lại bài kiểm tra xếp lớp" từ trang Hồ sơ cá nhân.
- **Tiền điều kiện:** Người học đã đăng nhập (`UC-01`).
- **Luồng sự kiện chính (Làm bài Đánh giá Chẩn đoán Thích ứng):**
  1. Người học chọn làm bài Đánh giá Chẩn đoán (Diagnostic Assessment) trên màn hình lựa chọn (`SCR-L-03`).
  2. Hệ thống khởi tạo đề thi thích ứng 2 giai đoạn (Routing Stage $\rightarrow$ Targeted Stage, quy mô ước tính `~25–30 câu, PROPOSED / PENDING VALIDATION`).
  3. Người học lần lượt trả lời các câu hỏi đánh giá 4 chiều năng lực: Từ vựng (Vocab), Ngữ pháp (Grammar), Đọc hiểu (Reading), Nghe hiểu (Listening).
  4. Người học hoàn thành câu hỏi cuối cùng và nộp bài.
  5. Hệ thống tính toán điểm số thô theo thang điểm chuẩn tắc (thang điểm Mapping A: 0–30 điểm).
  6. Hệ thống tạo bản ghi kết quả đánh giá bất biến:
     - `assessmentType = DIAGNOSTIC`
     - `deliveryMode = PLACEMENT`
     - Trạng thái: hoàn tất, ghi nhận bằng chứng bất biến (`created → completed → immutable evidence`).
  7. Hệ thống tạo/cập nhật `SkillProfile` phản ánh năng lực 4 chiều độc lập (Spider/Radar chart; thuật toán gộp Anchor Level giữ trạng thái `PENDING VALIDATION`).
  8. Hệ thống gán trạng thái năng lực kiểm chứng: `verifiedProficiency = verified`.
  9. Hệ thống áp dụng quy tắc đề cương **English A1 Placement Mapping A** để xác định Điểm xuất phát (`curriculumStartingPoint`):
     - `0 – 7 điểm`: Gán xuất phát tại **Unit 1**
     - `8 – 12 điểm`: Gán xuất phát tại **Unit 2**
     - `13 – 17 điểm`: Gán xuất phát tại **Unit 3**
     - `18 – 22 điểm`: Gán xuất phát tại **Unit 4**
     - `23 – 26 điểm`: Gán xuất phát tại **Unit 5**
     - `27 – 30 điểm`: Gán xuất phát tại **Unit 6**
  10. Hệ thống hiển thị màn hình tóm tắt kết quả xếp lớp (`SCR-L-05`), sau đó điều hướng người học vào thẳng bài học đầu tiên của Unit được mở khóa (`UC-04`). Hộp thoại xác nhận nếu có chỉ là tùy chọn trải nghiệm người dùng (`[FUTURE UX OPTION]`), không phải chốt chặn bắt buộc.
- **Luồng nhánh / Luồng thay thế:**
  - *AF-01 (Tự khai báo cấp độ / Bỏ qua - Self-reported / Skip):* Người học chọn không làm bài kiểm tra và bấm "Bắt đầu từ đầu" hoặc chọn cấp độ tự nhận $\rightarrow$ Hệ thống ghi nhận `LearnerProfile.selfReportedLevel` với trạng thái `UNVERIFIED` $\rightarrow$ Gán xuất phát điểm tạm thời tại Unit 1 $\rightarrow$ **TUYỆT ĐỐI KHÔNG TẠO BẢN GHI `AssessmentResult`**, **KHÔNG TẠO `SkillProfile`**, và **KHÔNG GHI NHẬN `verifiedProficiency`** $\rightarrow$ Điều hướng vào học.
  - *AF-02 (Làm lại bài thi xếp lớp - Retake):* Người học làm lại bài từ trang cá nhân $\rightarrow$ Hệ thống tạo một bản ghi `AssessmentResult` **hoàn toàn mới**, giữ nguyên bản ghi cũ $\rightarrow$ Cập nhật lại `SkillProfile` và Starting Unit mới tương ứng.
- **Luồng ngoại lệ:**
  - *EF-01 (Gián đoạn bài làm):* Mất kết nối trong khi làm bài $\rightarrow$ Các câu đã nộp được lưu tạm thời; khi kết nối lại người học có thể làm tiếp các câu còn lại.
- **Hậu điều kiện:**
  - Bản ghi `AssessmentResult` bất biến được lưu trữ (nếu làm bài chẩn đoán).
  - `SkillProfile` và `curriculumStartingPoint` được xác lập.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-PLC-01`: Tách biệt tuyệt đối giữa Tự khai báo (`selfReportedLevel = UNVERIFIED`) và Năng lực kiểm chứng (`verifiedProficiency`).
  - `BR-PLC-02`: Quy mô đề thi chẩn đoán mang trạng thái `~25–30 items, PROPOSED / PENDING VALIDATION`. Mapping A quy định thang điểm thô 0–30, không bắt buộc số lượng item phải bằng 30.
  - `BR-PLC-03`: Kết quả xếp lớp chỉ định vị vị trí xuất phát trên đề cương English A1; tuyệt đối KHÔNG cấp chứng chỉ năng lực quốc tế CEFR.
- **Thực thể miền tham chiếu:** `LearnerProfile`, `AssessmentResult`, `SkillProfile`, `Concept`.
- **Truy vết:** `YC-CORE-09` $\rightarrow$ `MVP-03` $\rightarrow$ `P1-FR-016` $\rightarrow$ `BF-08`. *(Lưu ý: Cơ chế Jump thuộc về UC-04 / BF-11; không gộp Jump vào UC-03)*.

---

### UC-04: Browse Learning Path & Conditional Jump

- **Mã định danh:** `UC-04`
- **Tên Use Case:** Khám phá Lộ trình Học tập & Nhảy cấp Đơn vị (Browse Learning Path & Conditional Jump)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học mở màn hình Lộ trình học tập (`/learn`), hoặc chọn yêu cầu nhảy cóc qua Unit kế tiếp.
- **Tiền điều kiện:** Người học đã xác thực (`UC-01`) và đã có xuất phát điểm đề cương (`UC-03`).
- **Luồng sự kiện chính (Khám phá Lộ trình):**
  1. Người học truy cập Bảng điều khiển Lộ trình học tập (`SCR-L-06`).
  2. Hệ thống tải cây đề cương khóa học (gồm 6 Units, mỗi Unit 4 Lessons) với các bài học mang trạng thái `PUBLISHED`.
  3. Hệ thống hiển thị trực quan trạng thái từng bài: `LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP`.
  4. Người học có thể bấm xem thông tin mục tiêu bài học và danh sách từ vựng trọng tâm (Preview).
  5. Người học nhấn chọn bài học đang mở để kích hoạt Trình phát bài học (`UC-05`).
- **Luồng nhánh (Nhảy cấp Đơn vị - Conditional Jump - Decision D5, D6):**
  - *AF-01 (Yêu cầu Nhảy cấp):* Người học bấm vào biểu tượng "Jump" tại một Unit đang bị khóa để xin vượt cấp $\rightarrow$ Hệ thống kích hoạt quy trình kiểm tra Jump (`SCR-L-11`):
    1. Hệ thống kiểm tra thời gian chờ phạt (Cooldown): Nếu người học từng thi trượt Jump trong vòng **24 giờ qua**, hệ thống từ chối làm bài và hiển thị đồng hồ đếm ngược.
    2. Nếu đủ điều kiện, hệ thống xác định quy mô đề thi Jump dựa trên khoảng cách nhảy:
       - Nhảy vượt **1 Unit**: Đề thi gồm **20 câu hỏi**.
       - Nhảy vượt **2 – 3 Units**: Đề thi gồm **25 – 30 câu hỏi**.
       - Nhảy vượt **> 3 Units**: Đề thi gồm **40 câu hỏi**.
    3. Người học hoàn thành bài kiểm tra Jump.
    4. Hệ thống chấm điểm và so sánh với ngưỡng đạt chuẩn tắc:
       - **Nếu tỷ lệ đúng $\ge 95.0\%$ (JUMP PASS):**
         - Tạo bản ghi `AssessmentResult` (`assessmentType = DIAGNOSTIC`, `deliveryMode = JUMP`, kết quả PASS).
         - Tất cả các bài học và Unit bị nhảy qua được gán nhãn xuất xứ: `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` kèm cờ **`by_jump = true`**.
         - **TUYỆT ĐỐI CẤM GÁN NHÃN `COMPLETED_BY_JUMP`**.
         - Mở khóa Unit đích và bài học đầu tiên ngay lập tức.
       - **Nếu tỷ lệ đúng $< 95.0\%$ (JUMP FAIL):**
         - Tạo bản ghi `AssessmentResult` với kết quả FAIL.
         - Kích hoạt **thời gian chờ phạt Cooldown đúng 24 giờ**, khóa chức năng Jump tới Unit này.
         - Người học tiếp tục học theo tiến trình tuyến tính bình thường tại vị trí hiện tại.
- **Luồng nhánh (Học bổ trợ khái niệm - Remedial Micro-Lesson):**
  - *AF-02:* Nếu sau khi hoàn thành bài học trước, hệ thống đánh giá trạng thái chuyển cấp là `ADVANCE_WITH_SUPPORT` hoặc `REMEDIATE` $\rightarrow$ Lộ trình hiển thị nút liên kết tới mô-đun bổ trợ `RemedialModule` $\rightarrow$ Người học vào học micro-lesson với ngữ cảnh mới, từ vựng mới để lấp lỗ hổng `KnowledgeGap`.
- **Hậu điều kiện:**
  - Trạng thái mở khóa các bài học được cập nhật chính xác.
  - Các bài nhảy qua mang xuất xứ `SKIPPED_BY_JUMP` (`by_jump = true`).
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-JUMP-01`: Ngưỡng đạt bài thi Jump là $\ge 95.0\%$.
  - `BR-JUMP-02`: Thời gian phạt sau khi thi trượt là đúng 24 giờ.
  - `BR-JUMP-03`: Bất biến cấm gán nhãn `COMPLETED_BY_JUMP`.
  - `BR-JUMP-04`: Vượt cấp Jump không cấp chứng chỉ hay công nhận hoàn thành học phần.
  - `BR-REMED-01`: Không hạ toàn bộ cấp độ (No whole-level downgrade); không ép học lại bài cũ (No forced replay).
- **Thực thể miền tham chiếu:** `Course`, `Unit`, `Lesson`, `LearningProgress`, `AssessmentResult`.
- **Truy vết:** `YC-CORE-03`, `YC-CORE-09` $\rightarrow$ `MVP-04` $\rightarrow$ `P1-FR-002`, `P1-FR-016` (Jump) $\rightarrow$ `BF-09`, `BF-11`.

---

### UC-05: Complete Lesson Exercises

- **Mã định danh:** `UC-05`
- **Tên Use Case:** Hoàn thành Bài tập Bài học & Làm lại có Kiểm soát (Complete Lesson Exercises & Controlled Retry)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học chọn một bài học khả dụng trên lộ trình học tập (`UC-04`).
- **Tiền điều kiện:** Bài học đang ở trạng thái `PUBLISHED` và đã được mở khóa đối với người học.
- **Luồng sự kiện chính:**
  1. Người học vào Trình phát bài học (`SCR-L-07`).
  2. Hệ thống nạp danh mục 5 bài tập tương tác thuộc 5 dạng logic chuẩn tắc: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
  3. Đối với mỗi bài tập, người học thao tác trả lời và nhấn "Kiểm tra":
     - Nếu trả lời ĐÚNG: Hệ thống đánh dấu câu đúng ngay lượt đầu (First-pass Correct), phát phản hồi thành công và hiển thị giải thích luật (`rule_explanation`).
     - Nếu trả lời SAI: Hệ thống đánh dấu câu sai, hiển thị đáp án đúng kèm chi tiết `rule_explanation`, và đưa câu hỏi vào danh sách cần làm lại (Retry Queue).
  4. Người học hoàn thành lượt làm đầu tiên cho tất cả $N$ câu hỏi ($N=5$).
  5. **Quy trình Làm lại có Kiểm soát (Controlled Retry - Decision D7):**
     - Nếu không có câu sai: Bài học hoàn thành 100%.
     - Nếu có câu sai: Hệ thống tính số lượt được làm lại theo công thức đóng băng:
       $$\text{allowance} = \max(1, \lfloor N \cdot 0.10 \rfloor) = \max(1, \lfloor 5 \cdot 0.10 \rfloor) = 1 \text{ câu}$$
     - Hệ thống hiển thị giao diện làm lại (`SCR-L-08`) cho câu hỏi sai nằm trong định mức allowance.
     - Người học thực hiện làm lại câu hỏi:
       - Nếu làm lại ĐÚNG: Hệ thống ghi nhận câu trả lời đúng ở lượt retry và tính điểm đạt **chính xác 70.0% credit** của câu hỏi đó (Decision D7).
       - Nếu làm lại SAI: Hệ thống ghi nhận câu hỏi không đạt điểm và ghi nhận lỗi tới Concept tương ứng.
  6. **Quy tắc Hoàn thành Bài học (Lesson Completion Processing - Thẩm quyền thuộc UC-05):**
     - Sau khi người học đã xử lý hết tất cả các câu hỏi ở lượt đầu và hoàn thành số câu retry bắt buộc trong allowance:
     - Hệ thống xác định bài học đạt chuẩn hoàn thành theo quy tắc xử lý trọn vẹn (Completion Processing Rule).
     - **TUYỆT ĐỐI KHÔNG ÁP DỤNG ĐIỂM SÀN 80%** (Decision D7 bãi bỏ sàn 80%).
     - Hệ thống cập nhật tiến độ bài học: `UserProgress = COMPLETED`.
     - Hệ thống hiển thị màn hình tổng kết bài học (`SCR-L-09`).
  7. **Tạo tín hiệu Lỗ hổng & Lên lịch Ôn tập:**
     - Nếu phát hiện lỗi lặp lại trên cùng Concept vượt ngưỡng, hệ thống tự động tạo bản ghi `KnowledgeGap` với trạng thái `OPEN`.
     - Hệ thống đẩy các từ vựng và khái niệm vừa học vào hàng đợi Lặp lại ngắt quãng (SRS Queue) với chu kỳ khởi tạo ban đầu là 1 ngày (`stage = 1`).
- **Luồng nhánh / Luồng thay thế:**
  - *AF-01 (Làm lại bài học đã hoàn thành):* Người học học lại bài cũ để ôn tập $\rightarrow$ Điểm số và tiến độ hoàn thành không bị ghi đè giảm đi; chỉ cập nhật bằng chứng thực hành cho Concept.
- **Luồng ngoại lệ:**
  - *EF-01 (Thoát giữa bài):* Người học đóng trình duyệt khi chưa làm hết bài $\rightarrow$ Trạng thái bài học giữ nguyên `IN_PROGRESS`; khi quay lại người học phải làm lại bài từ đầu để đảm bảo tính toàn vẹn sư phạm.
- **Hậu điều kiện:**
  - Bản ghi `UserProgress` của bài học chuyển sang `COMPLETED`.
  - Các khái niệm và từ vựng được nạp vào hàng đợi SRS.
  - Bằng chứng thực hành được ghi nhận cho `ConceptMastery`.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-EXC-01`: Khối lượng bài học tiêu chuẩn gồm chính xác 5 câu hỏi tương tác.
  - `BR-RETRY-01`: Định mức retry là $\max(1, \lfloor N \cdot 0.10 \rfloor)$, với $N=5$ định mức là 1 câu.
  - `BR-RETRY-02`: Làm lại đúng nhận chính xác 70.0% điểm.
  - `BR-COMP-01`: Hoàn thành bài học dựa trên việc xử lý hết câu hỏi và retry theo quy định; bãi bỏ hoàn toàn điểm sàn 80%.
  - `BR-INVARIANT`: `Điểm đúng bài tập ≠ Hoàn thành bài học ≠ Mức độ thuần thục (Mastery) ≠ Trình độ năng lực (Proficiency)`.
- **Thực thể miền tham chiếu:** `Lesson`, `Exercise`, `Concept`, `UserProgress`, `KnowledgeGap`.
- **Truy vết:** `YC-CORE-03`, `YC-CORE-07` $\rightarrow$ `MVP-05`, `MVP-06`, `MVP-07` $\rightarrow$ `P1-FR-003`, `P1-FR-012`, `P1-FR-013` $\rightarrow$ `BF-09`, `BF-10`.

---

### UC-06: Spaced Repetition Review (SRS)

- **Mã định danh:** `UC-06`
- **Tên Use Case:** Ôn tập Lặp lại Ngắt quãng Thẻ Từ vựng (Spaced Repetition Review - SRS)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học mở tab Ôn tập trên ứng dụng, hoặc chọn phiên ôn khi có thông báo thẻ từ vựng đến hạn.
- **Tiền điều kiện:** Người học đã có các từ vựng được nạp vào hàng đợi `UserVocabSrs` từ các bài học đã hoàn thành (`UC-05`).
- **Luồng sự kiện chính:**
  1. Người học truy cập Trình ôn tập SRS (`SCR-L-10`).
  2. Hệ thống truy vấn các thẻ từ vựng đến hạn ôn tập:
     $$\text{nextReviewAt} \le \text{currentDate} \quad (\text{theo múi giờ } \text{Asia/Ho\_Chi\_Minh})$$
  3. Hệ thống hiển thị lần lượt từng thẻ từ vựng (thẻ lật gợi nhớ, nghe phát âm, hoặc prompt điền nghĩa).
  4. Người học nhập câu trả lời hoặc tự đánh giá mức độ nhớ.
  5. **Thực thi Thuật toán Chu kỳ Tất định (Deterministic Policy B - Decision D8):**
     - Áp dụng thang khoảng cách ngày cố định: $I = [1, 3, 7, 14, 30]$ ngày.
     - **Nếu Trả lời Đúng:**
       - Tăng bậc chu kỳ: $\text{stage} = \min(5, \text{stage} + 1)$.
       - Gán khoảng cách mới tương ứng: $1 \rightarrow 3 \rightarrow 7 \rightarrow 14 \rightarrow 30$ ngày.
       - Cập nhật thời điểm ôn tiếp theo: $\text{nextReviewAt} = \text{currentDate} + I[\text{stage}]$.
     - **Nếu Trả lời Sai:**
       - Đặt lại bậc chu kỳ về mốc đầu tiên: $\text{stage} = 1$.
       - Gán khoảng cách: $\text{interval\_days} = 1$ ngày.
       - Cập nhật thời điểm ôn tiếp theo: $\text{nextReviewAt} = \text{currentDate} + 1 \text{ ngày}$.
  6. Hệ thống thực thi hàm cập nhật nguyên tử trên cơ sở dữ liệu:
     $$\text{record\_review}(\text{card\_id}, \text{is\_correct}, \text{recall\_prob}, \text{interval\_days})$$
     *(Ghi chú: Ký hiệu hàm mang tính quy ước logic; phía DB kiểm tra chặt quyền sở hữu `auth.uid()`)*.
  7. Bản ghi lịch sử ôn tập `ReviewLog` được lưu trữ phục vụ thống kê.
  8. Hệ thống ghi nhận việc hoàn thành phiên ôn tập là một hoạt động hợp lệ (Qualifying Activity) phục vụ tính Streak (`UC-07`).
- **Luồng ngoại lệ:**
  - *EF-01 (Không có thẻ đến hạn):* Không có thẻ nào có `nextReviewAt <= currentDate` $\rightarrow$ Hệ thống hiển thị thông báo chúc mừng "Bạn đã hoàn thành hết mục tiêu ôn tập hôm nay!" và gợi ý học bài mới.
- **Hậu điều kiện:**
  - Trạng thái các thẻ trong `UserVocabSrs` được cập nhật chu kỳ và thời điểm ôn mới.
  - Lịch sử ôn tập được lưu vào `ReviewLog`.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SRS-01`: Chu kỳ ôn tập cố định theo Policy B: $[1, 3, 7, 14, 30]$ ngày.
  - `BR-SRS-02`: Trả lời sai lập tức reset chu kỳ về mốc 1 ngày.
  - `BR-SRS-03`: Dịch vụ AI không sở hữu quyền ghi lịch ôn; thuật toán Policy B chạy hoàn toàn deterministic độc lập với AI.
- **Thực thể miền tham chiếu:** `UserVocabSrs`, `ReviewLog`, `Vocabulary`.
- **Truy vết:** `YC-CORE-08` $\rightarrow$ `MVP-09` $\rightarrow$ `P1-FR-005`, `P1-FR-006` $\rightarrow$ `BF-12`.

---

### UC-07: Track Progress & Streak

- **Mã định danh:** `UC-07`
- **Tên Use Case:** Theo dõi Tiến độ Học tập, Năng lực & Chuỗi Ngày Học (Track Progress, Mastery & Streak)
- **Tác nhân chính:** `Learner`
- **Kích hoạt:** Người học hoàn thành một hoạt động học tập hợp lệ, hoặc mở Bảng điều khiển cá nhân (`/dashboard`).
- **Tiền điều kiện:** Người học đã đăng nhập (`UC-01`).
- **Luồng sự kiện chính:**
  1. Người học truy cập Bảng điều khiển cá nhân (`SCR-L-14`).
  2. Hệ thống tổng hợp và hiển thị các chỉ số theo 4 chiều độc lập:
     - **Learning Progress (`P1-FR-004`):** Tỷ lệ phần trăm hoàn thành bài học trên cây khóa học English A1 (`UserProgress = COMPLETED`).
     - **Skill Profile (`P1-FR-016`):** Năng lực 4 chiều độc lập (Từ vựng, Ngữ pháp, Đọc, Nghe) trích xuất từ `AssessmentResult` gần nhất (kế thừa từ `P1-FR-016`), hiển thị trong Báo cáo cá nhân (`MVP-11`).
     - **Concept Mastery:** Tổng số khái niệm ở các trạng thái `MASTERED`, `DEVELOPING`, `NOVICE`.
     - **Level Readiness:** Trạng thái sẵn sàng chuyển cấp (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`).
  3. **Xử lý chuỗi ngày học liên tục (Streak Processing - Decision D9, `P1-FR-011`):**
     - Khi người học hoàn thành ít nhất 1 bài học (`UC-05`) hoặc 1 phiên ôn tập từ vựng (`UC-06`) trong ngày, hệ thống ghi nhận một **hoạt động hợp lệ (Qualifying Activity)**.
     - Hệ thống xác định ngày địa phương hiện tại theo múi giờ IANA đã cấu hình (`Profile.timezone`, mặc định `Asia/Ho_Chi_Minh`):
       $$\text{currentDate} = \text{GetLocalDate}(\text{now}(), \text{Profile.timezone})$$
     - So sánh với ngày hoạt động hợp lệ gần nhất `lastQualifyingActivityDate`:
       - Nếu $\text{currentDate} = \text{lastQualifyingActivityDate}$: Đã tích lũy streak trong ngày hôm nay $\rightarrow$ Giữ nguyên `streakCount`.
       - Nếu $\text{currentDate} = \text{lastQualifyingActivityDate} + 1 \text{ ngày}$: Người học duy trì học liên tục ngày tiếp theo $\rightarrow$ Tăng `streakCount = streakCount + 1`.
       - Nếu $\text{currentDate} > \text{lastQualifyingActivityDate} + 1 \text{ ngày}$: Bị gián đoạn ít nhất một ngày $\rightarrow$ **Đặt lại chuỗi `streakCount = 1`** (Decision D9).
     - Cập nhật `lastQualifyingActivityDate = currentDate`.
  4. Hệ thống cập nhật biểu đồ lịch sử chuỗi ngày học trên màn hình dashboard.
- **Hậu điều kiện:** `Profile.streakCount` và `Profile.lastQualifyingActivityDate` được cập nhật chính xác.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-STREAK-01`: Chỉ hoàn thành bài học hoặc hoàn thành phiên SRS mới tính là Qualifying Activity; chỉ mở app không tính.
  - `BR-STREAK-02`: Bị gián đoạn ngày học (missed day) đặt lại chuỗi về **1**, TUYỆT ĐỐI KHÔNG reset về 0 (Decision D9).
  - `BR-STREAK-03`: Mọi phép tính chu kỳ ngày căn cứ theo ngày địa phương trong múi giờ `Asia/Ho_Chi_Minh`, không phụ thuộc đồng hồ client.
  - `BR-STREAK-04`: Tính năng Đóng băng chuỗi (Streak Freeze) và Mua lại chuỗi (Recovery Power-up) bị hoãn (DEFERRED ngoài phạm vi MVP).
- **Thực thể miền tham chiếu:** `Profile`, `LearnerProfile`, `LearningProgress`, `SkillProfile`, `ConceptMastery`, `LevelReadiness`.
- **Truy vết:** `YC-CORE-10`, `YC-CORE-11` $\rightarrow$ `MVP-08`, `MVP-10`, `MVP-11` $\rightarrow$ `P1-FR-004`, `P1-FR-011` (Skill Profile kế thừa `P1-FR-016`) $\rightarrow$ `BF-13`. *(Lưu ý: P1-FR-017 là yêu cầu Nice/P2 Achievements & Badges, bị hoãn DEFERRED ngoài phạm vi MVP Core và không thuộc quyền sở hữu của UC-07)*.

---

### UC-08: Create & Edit Lesson Draft

- **Mã định danh:** `UC-08`
- **Tên Use Case:** Tạo & Soạn thảo Bản nháp Bài học (Create & Edit Lesson Draft)
- **Tác nhân chính:** `Lesson Creator`
- **Kích hoạt:** Người soạn nội dung đăng nhập cổng tác nghiệp và mở danh sách bài học được giao phụ trách.
- **Tiền điều kiện:** 
  1. Người dùng có tài khoản với vai trò `LESSON_CREATOR`.
  2. Bài học đã được `Organizational Manager` lập kế hoạch và phân công phụ trách (`assignmentBrief` / `creatorId`).
- **Luồng sự kiện chính:**
  1. Creator mở màn hình "Bài soạn của tôi" (`SCR-A-03`).
  2. Creator chọn một bài học đang ở trạng thái `DRAFT` hoặc `CHANGES_REQUESTED` được giao cho mình.
  3. Creator nhập liệu thông tin sư phạm: Tiêu đề bài học, tóm tắt ngữ liệu, điểm kiến thức mục tiêu (`conceptId`).
  4. Creator cấu hình danh mục bài tập tương tác (chính xác 5 dạng logic: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`).
  5. Đối với mỗi bài tập, Creator điền đầy đủ Payload theo schema chuẩn: đề bài, danh sách đáp án, đáp án đúng, và giải thích luật (`rule_explanation`).
  6. Creator lưu bản nháp tạm thời (trạng thái giữ nguyên `DRAFT`).
  7. Khi hoàn tất bài soạn, Creator nhấn nút **"Gửi duyệt" (Submit for Review)**.
  8. Hệ thống kiểm tra tính toàn vẹn (đủ 5 bài tập, đủ đáp án đúng, có liên kết concept).
  9. Hệ thống chuyển trạng thái bài học từ **`DRAFT` $\longrightarrow$ `IN_REVIEW`**.
  10. Hệ thống ghi nhật ký kiểm toán hành động gửi duyệt.
- **Luồng nhánh (Tạo bản sửa đổi v2 từ bài đã xuất bản - Clone-to-Draft v2):**
  - *AF-01:* Khi cần cập nhật bài học đã `PUBLISHED` $\rightarrow$ Creator kích hoạt chức năng **Clone-to-Draft** $\rightarrow$ Hệ thống nhân bản nội dung bài học sang một bản ghi mới với trạng thái `DRAFT`, lưu mã `supersedesId` trỏ về bài học v1 đang phát hành $\rightarrow$ Bài học v1 tiếp tục phục vụ bình thường mà không bị gián đoạn $\rightarrow$ Bản nháp v2 bước vào quy trình duyệt độc lập.
- **Luồng ngoại lệ:**
  - *EF-01 (Creator tác động bài học không được phân công):* Creator cố tình truy cập bài học thuộc về người khác $\rightarrow$ Hệ thống chặn bằng quy tắc phân quyền, trả mã lỗi `AUTH_FORBIDDEN_ASSIGNMENT`.
  - *EF-02 (Tự ý xuất bản):* Creator cố tình gọi hàm xuất bản $\rightarrow$ Hệ thống từ chối hoàn toàn; Creator không có quyền duyệt hay xuất bản.
- **Hậu điều kiện:** Bài học chuyển sang trạng thái `IN_REVIEW`, sẵn sàng cho Moderator kiểm duyệt.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SOD-01`: Creator chỉ được soạn thảo nội dung đã được Manager phân công.
  - `BR-SOD-02`: Creator tuyệt đối không có quyền tự phê duyệt (`APPROVED`) hay tự xuất bản (`PUBLISHED`) nội dung của mình (Separation of Duties).
  - `BR-REV-01`: Không sửa đổi trực tiếp trên bài học đang `PUBLISHED`; bắt buộc dùng cơ chế Clone-to-Draft v2 qua `supersedesId` (Decision D3).
- **Thực thể miền tham chiếu:** `Course`, `Unit`, `Lesson`, `Exercise`, `Concept`, `AuditLog`.
- **Truy vết:** `YC-CORE-04`, `YC-CORE-06` $\rightarrow$ `MVP-12` $\rightarrow$ `P1-FR-008` $\rightarrow$ `BF-03`, `BF-04`, `BF-06`.

---

### UC-09: Review & Moderate Content

- **Mã định danh:** `UC-09`
- **Tên Use Case:** Kiểm duyệt & Thẩm định Chất lượng Nội dung (Review & Moderate Content)
- **Tác nhân chính:** `Moderator`
- **Kích hoạt:** Người kiểm duyệt mở Hàng đợi duyệt nội dung (`SCR-A-05`).
- **Tiền điều kiện:** 
  1. Người dùng có vai trò `MODERATOR`.
  2. Có các bài học đang ở trạng thái `IN_REVIEW`.
- **Luồng sự kiện chính:**
  1. Moderator mở hàng đợi kiểm duyệt và chọn một bài học đang `IN_REVIEW`.
  2. Hệ thống hiển thị toàn bộ nội dung bài học, ngữ liệu âm thanh, và 5 payload bài tập kèm đáp án và giải thích luật.
  3. Moderator thực hiện thẩm định:
     - Độ chính xác ngôn ngữ và tính sư phạm của ngữ liệu theo chuẩn English A1.
     - Tính đúng đắn của đáp án và liên kết Concept.
     - Đảm bảo an toàn nội dung và bản quyền.
  4. **Quyết định phê duyệt (Approval):**
     - Nếu nội dung đạt yêu cầu $\rightarrow$ Moderator nhấn "Phê duyệt" (Approve).
     - Hệ thống chuyển trạng thái bài học từ **`IN_REVIEW` $\longrightarrow$ `APPROVED`**.
     - Hệ thống ghi nhận `moderatorId` và thời điểm phê duyệt `approvedAt`.
     - **Hành trình kiểm duyệt kết thúc tại đây; Moderator DỪNG LẠI ở trạng thái `APPROVED`**.
- **Luồng nhánh (Yêu cầu chỉnh sửa - Request Changes):**
  - *AF-01:* Nếu phát hiện sai sót ngữ liệu hoặc bài tập chưa đạt $\rightarrow$ Moderator nhấn "Yêu cầu chỉnh sửa" (Request Changes) và bắt buộc nhập ghi chú nhận xét chi tiết (`feedbackNotes`) $\rightarrow$ Hệ thống chuyển trạng thái bài học từ **`IN_REVIEW` $\longrightarrow$ `CHANGES_REQUESTED`** $\rightarrow$ Bài học quay về hàng đợi của Creator phụ trách kèm toàn bộ ghi chú nhận xét. Trạng thái nghiệp vụ là `CHANGES_REQUESTED`, không tồn tại trạng thái gọi là `REJECTED`.
- **Luồng ngoại lệ:**
  - *EF-01 (Moderator kiêm Creator trên cùng nội dung):* Một người dùng có nhiều vai trò cố tình duyệt bài do chính mình soạn $\rightarrow$ Hệ thống kiểm tra `creatorId = auth.uid()` $\rightarrow$ Chặn hành động với lỗi `SOD_SELF_APPROVAL_BARRED`.
  - *EF-02 (Moderator cố tình xuất bản):* Moderator cố tình chuyển trạng thái sang `PUBLISHED` $\rightarrow$ Hệ thống từ chối vì Moderator không có thẩm quyền phát hành.
- **Hậu điều kiện:** Bài học chuyển trạng thái thành `APPROVED` (chờ Manager xuất bản) hoặc `CHANGES_REQUESTED` (trả về cho Creator).
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SOD-03`: Moderator có thẩm quyền tối cao trong việc chuyển bài học sang `APPROVED` hoặc `CHANGES_REQUESTED`.
  - `BR-SOD-04`: Moderator tuyệt đối KHÔNG có quyền xuất bản (`PUBLISHED`) học liệu ra môi trường công khai.
  - `BR-SOD-05`: Cấm tuyệt đối hành vi tự phê duyệt (Self-approval).
- **Thực thể miền tham chiếu:** `Course`, `Unit`, `Lesson`, `Exercise`, `AuditLog`.
- **Truy vết:** `YC-CORE-05` $\rightarrow$ `MVP-13` $\rightarrow$ `P1-FR-008` $\rightarrow$ `BF-05`.

---

### UC-10: Publish Approved Content

- **Mã định danh:** `UC-10`
- **Tên Use Case:** Xuất bản Nội dung Đã Phê duyệt (Publish Approved Content)
- **Tác nhân chính (Authoritative Publisher):** `Organizational Manager`
- **Tác nhân bổ trợ khẩn cấp:** `Administrator` (Quyền xuất bản khẩn cấp chỉ dành cho bài đã `APPROVED`, kèm lý do giải trình bắt buộc và nhật ký `AuditLog`)
- **Kích hoạt:** Manager mở Bảng điều khiển quản lý chương trình và danh sách bài học đã được phê duyệt (`SCR-A-06`).
- **Tiền điều kiện:** 
  1. Người thực hiện có vai trò `ORGANIZATIONAL_MANAGER` (hoặc `ADMINISTRATOR` trong tình huống khẩn cấp).
  2. Bài học đang ở trạng thái chính xác là **`APPROVED`**.
- **Luồng sự kiện chính (Xuất bản thường nhật bởi Manager):**
  1. Manager mở danh mục học liệu đã sẵn sàng phát hành (`/admin/publishing`).
  2. Hệ thống hiển thị các bài học đang mang trạng thái `APPROVED` (đã qua thẩm định độc lập của Moderator).
  3. Manager đối chiếu tiến độ phát hành của Unit (kiểm tra quy tắc hiển thị: đủ 4/4 bài học để mở toàn Unit).
  4. Manager chọn bài học và nhấn **"Xuất bản" (Publish)**.
  5. Hệ thống chuyển trạng thái bài học từ **`APPROVED` $\longrightarrow$ `PUBLISHED`**.
  6. Hệ thống ghi nhận `publishedAt = now()`, `publisherId = auth.uid()`.
  7. Hệ thống ghi nhật ký kiểm toán bất biến `AuditLog`.
  8. Hệ thống kiểm tra Unit chứa bài học: Nếu đủ 4/4 bài học đều đã `PUBLISHED`, Unit tự động chuyển trạng thái hiển thị công khai trên ứng dụng người học.
- **Luồng nhánh (Xuất bản khẩn cấp bởi Administrator):**
  - *AF-01:* Trong tình huống khẩn cấp (Manager vắng mặt hoặc cần khắc phục sự cố nghiệp vụ cấp bách), Administrator có quyền thực hiện xuất bản khẩn cấp cho một bài học **ĐÃ MANG TRẠNG THÁI `APPROVED`** $\rightarrow$ Administrator nhấn "Xuất bản khẩn cấp" $\rightarrow$ Hệ thống bắt buộc nhập văn bản giải trình lý do (`emergencyReason`) $\rightarrow$ Hệ thống chuyển trạng thái `APPROVED → PUBLISHED` $\rightarrow$ Tự động ghi nhận bản ghi kiểm toán đặc biệt `AuditLog` với cờ `IS_EMERGENCY = true`.
- **Luồng ngoại lệ:**
  - *EF-01 (Cố tình xuất bản bài chưa được duyệt):* Người dùng (kể cả Manager hay Admin) cố tình xuất bản bài học đang ở trạng thái `DRAFT`, `IN_REVIEW` hay `CHANGES_REQUESTED` $\rightarrow$ Hệ thống từ chối hoàn toàn với lỗi `LIFECYCLE_INVALID_PUBLISH_STATE`. Không ai được phép xuất bản bài học chưa qua phê duyệt của Moderator.
  - *EF-02 (Moderator cố tình xuất bản):* Moderator gọi lệnh xuất bản $\rightarrow$ Chặn với lỗi `SOD_MODERATOR_CANNOT_PUBLISH`.
- **Hậu điều kiện:** Bài học mang trạng thái `PUBLISHED` và trở nên khả dụng đối với người học.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SOD-06`: Thẩm quyền xuất bản nội dung chuẩn tắc thuộc độc quyền về `Organizational Manager`.
  - `BR-SOD-07`: Administrator chỉ được xuất bản khẩn cấp đối với nội dung **đã mang trạng thái `APPROVED`**, bắt buộc kèm lý do và ghi `AuditLog`; tuyệt đối không được xuất bản nội dung đang `IN_REVIEW` hay `DRAFT`.
  - `BR-SOD-08`: Moderator tuyệt đối không phải là publisher.
  - `BR-UNIT-VIS`: Unit hiển thị trên danh mục công khai khi và chỉ khi 4/4 bài học bên trong mang trạng thái `PUBLISHED`.
- **Thực thể miền tham chiếu:** `Course`, `Unit`, `Lesson`, `AuditLog`.
- **Truy vết:** `YC-CORE-06` $\rightarrow$ `MVP-13`, `MVP-19` $\rightarrow$ `P1-FR-008` $\rightarrow$ `BF-07`.

---

### UC-11: Manage Accounts & Roles

- **Mã định danh:** `UC-11`
- **Tên Use Case:** Quản trị Tài khoản & Phân quyền Người dùng (Manage Accounts & Roles)
- **Tác nhân chính:** `Administrator`
- **Tác nhân hỗ trợ:** Supabase GoTrue Auth
- **Kích hoạt:** Administrator truy cập Trung tâm điều hành người dùng (`SCR-A-07`).
- **Tiền điều kiện:** Administrator đã đăng nhập với vai trò `ADMINISTRATOR`.
- **Luồng sự kiện chính (Main Success Flow):**
  1. Administrator mở danh sách tài khoản người dùng trong hệ thống.
  2. Hệ thống hiển thị danh sách kèm email, họ tên, vai trò hiện tại (`role`), trạng thái kích hoạt, và ngày tạo.
  3. Administrator chọn một người dùng cụ thể để chỉnh sửa vai trò hoặc thêm vai trò bổ trợ (`assignedRoles`).
  4. Administrator chọn vai trò mới (ví dụ: gán quyền `MODERATOR` cho một giảng viên) và nhập lý do thay đổi.
  5. Administrator nhấn "Lưu thay đổi".
  6. Hệ thống kiểm tra các ràng buộc an toàn và cập nhật bản ghi `Profile`.
  7. Hệ thống tự động ghi nhận một bản ghi kiểm toán bất biến `AuditLog` chi tiết (`action = ROLE_CHANGE`, `adminId`, `targetUserId`, `oldRole`, `newRole`, `reason`).
  8. Màn hình hiển thị thông báo cập nhật thành công.
- **Luồng nhánh / Luồng thay thế (Alternate Flows):**
  - *AF-01 (Tạo tài khoản nhân sự mới):* Administrator nhập thông tin email, họ tên và vai trò nhân sự ban đầu $\rightarrow$ Hệ thống gửi thư mời kích hoạt tài khoản kèm mật khẩu tạm thời.
  - *AF-02 (Tạm khóa / Kích hoạt lại tài khoản):* Administrator chọn tạm dừng quyền truy cập của một tài khoản nghi vấn $\rightarrow$ Hệ thống cập nhật trạng thái `Profile.isActive = false` $\rightarrow$ Hủy mọi phiên đăng nhập hiện tại của người dùng đó.
- **Luồng ngoại lệ (Exception Flows):**
  - *EF-01 (Người thực hiện không có quyền Admin):* Người dùng không có vai trò `ADMINISTRATOR` cố tình gọi API cập nhật quyền $\rightarrow$ Hệ thống chặn với lỗi `AUTH_FORBIDDEN_ADMIN_ONLY`.
  - *EF-02 (Tự tước quyền Administrator duy nhất):* Administrator cố tình hạ quyền tài khoản của chính mình trong khi hệ thống không còn Admin nào khác $\rightarrow$ Hệ thống từ chối hành động với lỗi `SECURITY_LAST_ADMIN_PROTECTED`.
  - *EF-03 (Người dùng không tồn tại):* Mã định danh người dùng không tồn tại trong hệ thống $\rightarrow$ Trả mã lỗi `USER_NOT_FOUND`.
- **Hậu điều kiện:** Quyền hạn tài khoản được cập nhật và ghi nhận kiểm toán an ninh bất biến.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SEC-01`: Chỉ Administrator mới có quyền điều chỉnh vai trò nhân sự và phân bổ quyền SoD.
  - `BR-SEC-02`: Mọi thay đổi về phân quyền bắt buộc tạo bản ghi `AuditLog` bất biến.
- **Thực thể miền tham chiếu:** `Profile`, `AuditLog`.
- **Truy vết:** `YC-CORE-12` $\rightarrow$ `MVP-14`, `MVP-19` $\rightarrow$ `P1-FR-008`, `P1-NFR-001`.

---

### UC-12: View System Reports

- **Mã định danh:** `UC-12`
- **Tên Use Case:** Xem Báo cáo & Thống kê Vận hành Hệ thống (View System Reports)
- **Tác nhân chính:** `Administrator`, `Organizational Manager`
- **Kích hoạt:** Quản trị viên truy cập cổng Báo cáo thống kê (`SCR-A-08`).
- **Tiền điều kiện:** Người dùng có vai trò `ADMINISTRATOR` hoặc `ORGANIZATIONAL_MANAGER`.
- **Luồng sự kiện chính (Main Success Flow):**
  1. Quản trị viên truy cập màn hình báo cáo tổng hợp.
  2. Hệ thống tổng hợp và trực quan hóa các nhóm chỉ số vận hành:
     - Số lượng người học đăng ký mới và hoạt động hàng ngày (DAU/MAU).
     - Tỷ lệ hoàn thành bài học và phân bổ tiến độ học tập.
     - Tỷ lệ vượt qua và thất bại trong các bài kiểm tra Jump / Placement.
     - Hiệu suất phê duyệt học liệu của đội ngũ Creator/Moderator.
  3. Quản trị viên lọc dữ liệu theo khoảng thời gian, khóa học, hoặc cấp độ.
  4. Hệ thống tải dữ liệu thống kê tổng hợp và hiển thị biểu đồ trực quan.
- **Luồng nhánh / Luồng thay thế (Alternate Flows):**
  - *AF-01 (Xuất báo cáo định dạng bảng):* Quản trị viên nhấn nút "Xuất dữ liệu" $\rightarrow$ Hệ thống kết xuất dữ liệu báo cáo ra định dạng CSV/Excel tổng hợp (`YC-EXT-08` baseline).
- **Luồng ngoại lệ (Exception Flows):**
  - *EF-01 (Không có quyền truy cập báo cáo):* Người dùng mang vai trò `LEARNER`, `LESSON_CREATOR` hoặc `MODERATOR` cố truy cập $\rightarrow$ Hệ thống chặn truy cập với lỗi `AUTH_FORBIDDEN_REPORT`.
  - *EF-02 (Tập dữ liệu rỗng):* Khoảng thời gian lọc không có dữ liệu hoạt động $\rightarrow$ Hệ thống hiển thị trạng thái rỗng thân thiện (`EmptyState`: "Không có dữ liệu trong khoảng thời gian đã chọn").
  - *EF-03 (Khoảng thời gian không hợp lệ):* Ngày bắt đầu lớn hơn ngày kết thúc $\rightarrow$ Hệ thống thông báo lỗi `DATE_RANGE_INVALID`.
- **Hậu điều kiện:** Báo cáo được hiển thị và trích xuất an toàn.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-REP-01`: Dữ liệu báo cáo tuân thủ nguyên tắc ẩn danh, không làm lộ thông tin cá nhân nhạy cảm của người học.
- **Thực thể miền tham chiếu:** `Profile`, `Course`, `UserProgress`, `AssessmentResult`.
- **Truy vết:** `YC-CORE-12` $\rightarrow$ `MVP-15` $\rightarrow$ `P1-FR-008`.

---

### UC-13: View & Audit Security Logs

- **Mã định danh:** `UC-13`
- **Tên Use Case:** Tra cứu & Kiểm toán Nhật ký An ninh (View & Audit Security Logs)
- **Tác nhân chính:** `Administrator`
- **Kích hoạt:** Administrator mở Cổng tra cứu kiểm toán an ninh (`SCR-A-09`).
- **Tiền điều kiện:** Administrator đã đăng nhập với vai trò `ADMINISTRATOR`.
- **Luồng sự kiện chính (Main Success Flow):**
  1. Administrator mở màn hình nhật ký kiểm toán an ninh.
  2. Hệ thống truy vấn bảng `AuditLog` và hiển thị danh sách sự kiện bất biến theo thứ tự thời gian giảm dần:
     - Thời điểm sự kiện (`createdAt`).
     - Tác nhân thực hiện (`userId`, email, vai trò).
     - Hành động thực hiện (`action`: LOGIN, ROLE_CHANGE, PUBLISH, EMERGENCY_PUBLISH, ARCHIVE, etc.).
     - Đối tượng mục tiêu (`targetEntity`, `targetId`).
     - Chi tiết dữ liệu thay đổi (`payload` JSONB: old value vs new value).
     - Địa chỉ IP và User-Agent.
  3. Administrator có thể tìm kiếm theo tác nhân, lọc theo loại hành động hoặc khoảng thời gian.
  4. Hệ thống hiển thị chi tiết payload kiểm toán tương ứng với sự kiện được chọn.
- **Luồng nhánh / Luồng thay thế (Alternate Flows):**
  - *AF-01 (Lọc sự kiện khẩn cấp):* Administrator chọn bộ lọc `isEmergency = true` $\rightarrow$ Hệ thống lọc ra toàn bộ các hành động xuất bản/gỡ bài khẩn cấp kèm văn bản giải trình lý do bắt buộc.
- **Luồng ngoại lệ (Exception Flows):**
  - *EF-01 (Truy cập trái phép):* Người dùng không phải `ADMINISTRATOR` cố truy cập trang log $\rightarrow$ Chặn với lỗi `AUTH_FORBIDDEN_AUDIT_LOG`.
  - *EF-02 (Cố tình chỉnh sửa hoặc xóa log):* Bất kỳ yêu cầu `UPDATE` hoặc `DELETE` nào gửi tới bảng `AuditLog` $\rightarrow$ RLS và trigger cơ sở dữ liệu chặn cứng với lỗi `AUDIT_LOG_IMMUTABLE`.
  - *EF-03 (Bộ lọc không khớp kết quả):* Tìm kiếm không thấy bản ghi nào $\rightarrow$ Hiển thị thông báo "Không tìm thấy sự kiện kiểm toán phù hợp".
- **Hậu điều kiện:** Nhật ký kiểm toán được hiển thị an toàn; hệ thống ghi nhận chính hành động tra cứu này vào nhật ký kiểm toán truy cập.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-AUDIT-01`: Bảng `AuditLog` là dữ liệu bất biến (Append-only); cấm tuyệt đối mọi thao tác `UPDATE` hay `DELETE` trên bảng này kể cả quyền Administrator.
- **Thực thể miền tham chiếu:** `AuditLog`.
- **Truy vết:** `YC-CORE-12`, `YC-EXT-05` $\rightarrow$ `MVP-15`, `MVP-19` $\rightarrow$ `P1-FR-008`, `P1-NFR-001`.

---

### UC-14: Handle Support Tickets

- **Mã định danh:** `UC-14`
- **Tên Use Case:** Tiếp nhận & Xử lý Phiếu Yêu cầu Hỗ trợ (Handle Support Tickets)
- **Tác nhân chính:** `Operations Staff`
- **Tác nhân hỗ trợ:** `Learner` (người gửi yêu cầu), `Moderator` / `Administrator` (tuyến tiếp nhận leo thang)
- **Kích hoạt:** Người học gửi phản ánh sự cố từ ứng dụng, hoặc Operations Staff mở Hàng đợi hỗ trợ (`SCR-A-10`).
- **Tiền điều kiện:** Người dùng có vai trò `OPERATIONS_STAFF` (hoặc `ADMINISTRATOR`).
- **Luồng sự kiện chính (Main Success Flow):**
  1. Người học gửi phiếu hỗ trợ (báo lỗi bài tập, lỗi phát thanh, sự cố tài khoản). Hệ thống tạo bản ghi `SupportTicket` với trạng thái `OPEN`.
  2. Operations Staff mở danh sách phiếu hỗ trợ, tiếp nhận phiếu và chuyển trạng thái sang `IN_PROGRESS`.
  3. Operations Staff tra cứu thông tin học viên tối thiểu (không lộ mật khẩu, không xem dữ liệu riêng tư nhạy cảm).
  4. **Phân loại xử lý:**
     - Sự cố hướng dẫn nghiệp vụ thông thường $\rightarrow$ Trả lời giải đáp cho người học $\rightarrow$ Chuyển trạng thái sang `RESOLVED`.
     - Lỗi nội dung học liệu $\rightarrow$ Chuyển tiếp (escalate) phiếu tới `Moderator` phụ trách để tạo vòng phản hồi chỉnh sửa.
     - Lỗi an ninh hoặc sự cố tài khoản $\rightarrow$ Chuyển tiếp tới `Administrator`.
  5. Khi phiếu được giải quyết, hệ thống gửi phản hồi tới người học và đóng phiếu (`CLOSED`).
- **Luồng nhánh / Luồng thay thế (Alternate Flows):**
  - *AF-01 (Yêu cầu thêm thông tin từ người học):* Nhân viên vận hành gửi tin nhắn yêu cầu người học bổ sung ảnh chụp màn hình hoặc chi tiết lỗi $\rightarrow$ Phiếu chuyển trạng thái `WAITING_USER_INPUT`.
- **Luồng ngoại lệ (Exception Flows):**
  - *EF-01 (Truy cập trái phép):* Người dùng không có vai trò `OPERATIONS_STAFF` hoặc `ADMINISTRATOR` truy cập hàng đợi hỗ trợ $\rightarrow$ Chặn với lỗi `AUTH_FORBIDDEN_SUPPORT`.
  - *EF-02 (Phiếu hỗ trợ không tồn tại):* Mã định danh ticket sai $\rightarrow$ Trả lỗi `TICKET_NOT_FOUND`.
  - *EF-03 (Nhân viên vận hành cố tình can thiệp điểm số):* Nhân viên vận hành cố gọi API sửa tiến độ bài học $\rightarrow$ Hệ thống chặn với lỗi `SOD_OPS_CANNOT_MODIFY_PROGRESS`.
- **Hậu điều kiện:** `SupportTicket` được giải quyết hoặc chuyển tuyến chính xác.
- **Quy tắc nghiệp vụ áp dụng:**
  - `BR-SUP-01`: Nhân viên Operations Staff chỉ có quyền tra cứu tối thiểu; tuyệt đối không có quyền can thiệp sửa đổi nội dung học liệu, không có quyền duyệt bài hay sửa điểm số của học viên.
- **Thực thể miền tham chiếu:** `SupportTicket`, `Profile`.
- **Truy vết:** `YC-EXT-04` $\rightarrow$ `MVP-16` $\rightarrow$ `BF-15`.

---

### UC-15: Manage Cohorts & Group Progress (Optional / Future Extension)

- **Mã định danh:** `UC-15`
- **Tên Use Case:** Quản lý Nhóm Học viên & Tiến độ Lớp học (Manage Cohorts & Group Progress)
- **Tác nhân chính:** `Organizational Manager`
- **Phân loại ranh giới:** **`OPTIONAL / FUTURE EXTENSION BOUNDARY`** (Ngoài phạm vi triển khai MVP Core)
- **Kích hoạt:** Manager mở Cổng quản lý nhóm tổ chức (`SCR-A-11`).
- **Tiền điều kiện:** Tổ chức giáo dục hoặc doanh nghiệp có gói đào tạo theo nhóm được kích hoạt.
- **Đặc tả tóm tắt ranh giới (Lightweight Boundary Specification):**
  1. Use Case này đại diện cho phân hệ mở rộng quản lý tổ chức B2B, tách biệt hoàn toàn với trải nghiệm học tập cá nhân cốt lõi (`UC-01`..`UC-07`).
  2. Manager có thể tạo nhóm học viên (`Cohort`), gán chương trình học, và xem bảng tổng hợp tiến độ chung của các thành viên trong nhóm.
  3. Sự hiện diện hay vắng mặt của phân hệ này không gây ảnh hưởng tới bất kỳ quy tắc sư phạm, tiến trình hay cơ chế nào của hệ thống học viên cá nhân.
- **Hậu điều kiện:** Nhóm học viên được liên kết logic ở tầng mở rộng.
- **Thực thể miền tham chiếu:** `Cohort`, `CohortMember` (Mô hình mở rộng / Target Schema tương lai).
- **Truy vết:** `YC-EXT-08` tương đương $\rightarrow$ `MVP-17` $\rightarrow$ `UC-15 (Extension Boundary)`.

---

## 3. Activity Behavioral Families (BF-01 through BF-15)

Lớp hành vi M2.2 chuẩn hóa chính xác **15 họ hành vi chuẩn tắc** (`BF-01` đến `BF-15`) theo nguồn thẩm quyền chuẩn của `docs/06-system-analysis.md` §5. Tuyệt đối không tự chế `BF-16` và không gán ghép sai lệch thứ tự:

```
+----------------------------------------------------------------------------------------------------+
|                                    15 BEHAVIORAL FAMILIES (BF-01..BF-15)                           |
+------------------------------------+----------------------------------+----------------------------+
| QUẢN TRỊ ĐỀ CƯƠNG & HỌC LIỆU       | TIẾN TRÌNH HỌC VIÊN CỐT LÕI      | HỆ THỐNG, GEC & HỖ TRỢ     |
| - BF-02: Curriculum Planning       | - BF-01: Authentication & Session| - BF-14: Scenario Writing  |
| - BF-03: Content Assignment        | - BF-08: Placement Test          |          & GEC (P1-FR-007) |
| - BF-04: Lesson Authoring          | - BF-09: Learning Lesson Flow    | - BF-15: Operations &      |
| - BF-05: Content Review            | - BF-10: Controlled Retry        |          Ticket Flow       |
| - BF-06: Content Revision (v2)     | - BF-11: Conditional Jump        |                            |
| - BF-07: Content Publication       | - BF-12: SRS Review Flow         |                            |
|                                    | - BF-13: Progress & Streak Track |                            |
+------------------------------------+----------------------------------+----------------------------+
```

### Bảng Đặc tả Ma trận Hành vi 15 Họ BF Chuẩn tắc:

| Họ Hành vi | Tác nhân chính | Kích hoạt (Trigger) | Đầu vào (Inputs) | Các bước thực thi chính | Rẽ nhánh & Quyết định | Đầu ra & Thay đổi trạng thái |
|---|---|---|---|---|---|---|
| **BF-01** Authentication Flow | All Roles | Người dùng mở app / login | Email, Password, Session Cookie | 1. Gửi thông tin $\rightarrow$ 2. Xác thực Supabase $\rightarrow$ 3. Tra cứu Profile $\rightarrow$ 4. Set httpOnly cookie | Email đúng/sai; Tài khoản active/locked | Cookie phiên an toàn; Profile context nạp vào ứng dụng |
| **BF-02** Curriculum Planning Flow | Org Manager | Lập kế hoạch học kỳ | Khung 6 Units English A1, mục tiêu bài học | 1. Tạo cấu trúc Course/Unit skeleton $\rightarrow$ 2. Xác định danh mục 4 bài học/Unit | Khung hợp lệ $\rightarrow$ Tạo cấu trúc bài | Course, Unit skeleton tạo lập ở mức DRAFT |
| **BF-03** Content Assignment Flow | Org Manager | Phân công biên soạn | `Lesson`, danh sách Creator | 1. Manager chọn bài học $\rightarrow$ 2. Nhập `assignmentBrief` $\rightarrow$ 3. Gán `creatorId` | Creator hợp lệ $\rightarrow$ Gán bài | Bài học gán quyền tác giả, sẵn sàng cho Creator soạn |
| **BF-04** Lesson Authoring Flow | Creator | Mở bài được phân công | Ngữ liệu bài học, 5 bài tập payload | 1. Soạn tiêu đề $\rightarrow$ 2. Nhập 5 bài tập chuẩn $\rightarrow$ 3. Gán Concept $\rightarrow$ 4. Bấm Gửi duyệt | Kiểm tra đủ 5 bài tập; Kiểm tra đủ đáp án đúng | Bài học chuyển trạng thái: `DRAFT → IN_REVIEW` |
| **BF-05** Content Review Flow | Moderator | Hàng đợi kiểm duyệt | Bài học `IN_REVIEW` | 1. Thẩm định ngữ liệu English A1 $\rightarrow$ 2. Kiểm tra đáp án $\rightarrow$ 3. Đánh giá sư phạm | Đạt chuẩn $\rightarrow$ Phê duyệt; Chưa đạt $\rightarrow$ Yêu cầu sửa | Đạt: `IN_REVIEW → APPROVED`; Chưa đạt: Chuyển sang BF-06 |
| **BF-06** Content Revision Flow | Moderator, Creator | Yêu cầu sửa / Sửa bài phát hành | Ghi chú nhận xét hoặc Clone v2 | 1. Moderator gửi ghi chú $\rightarrow$ 2. Bài chuyển `CHANGES_REQUESTED` $\rightarrow$ 3. Creator sửa $\rightarrow$ 4. Gửi lại | Sửa bài nháp vs Clone bài đã xuất bản (v2) | `CHANGES_REQUESTED → DRAFT → IN_REVIEW` (hoặc Clone v2 `supersedesId`) |
| **BF-07** Publication Flow | Org Manager | Hàng đợi xuất bản | Bài học `APPROVED` | 1. Manager kiểm tra $\rightarrow$ 2. Nhấn Xuất bản $\rightarrow$ 3. Kiểm tra điều kiện đủ 4/4 bài của Unit | Đủ 4/4 bài $\rightarrow$ Hiển thị Unit; Chưa đủ $\rightarrow$ Ẩn Unit | Bài học: `APPROVED → PUBLISHED`; Unit hiển thị công khai |
| **BF-08** Placement Test Flow | Learner | Chọn kiểm tra trình độ | Câu trả lời chẩn đoán thích ứng | 1. Làm Routing Stage $\rightarrow$ 2. Làm Targeted Stage $\rightarrow$ 3. Tính điểm thô $\rightarrow$ 4. Áp dụng Mapping A | Điểm rơi vào 6 dải: 0–7 (U1), 8–12 (U2), ..., 27–30 (U6) | `AssessmentResult` bất biến; `SkillProfile` 4 chiều; Starting Unit mở khóa |
| **BF-09** Learning Lesson Flow | Learner | Chọn bài trên lộ trình | Thao tác trả lời 5 bài tập | 1. Hiển thị đề bài $\rightarrow$ 2. Nhận câu trả lời $\rightarrow$ 3. Trả về phản hồi tức thì + giải thích | Đúng $\rightarrow$ Tiếp tục; Sai $\rightarrow$ Đưa vào danh sách retry | Cập nhật bằng chứng Concept; chuyển tiếp sang BF-10 |
| **BF-10** Controlled Retry Flow | Learner | Kết thúc lượt first-pass | Các câu trả lời sai | 1. Tính allowance $= \max(1, \lfloor N \cdot 0.1 \rfloor) = 1 \rightarrow$ 2. Làm lại câu sai | Làm lại đúng $\rightarrow$ Nhận 70% credit; Sai $\rightarrow$ Không có điểm | Hoàn thành bài: `UserProgress = COMPLETED`; 0 điểm sàn 80% |
| **BF-11** Conditional Jump Flow | Learner | Chọn Jump tại Unit khóa | Bài làm 20/25-30/40 câu Jump | 1. Check cooldown 24h $\rightarrow$ 2. Làm bài Jump $\rightarrow$ 3. Đánh giá tỷ lệ đúng | $\ge 95\% \rightarrow$ PASS; $< 95\% \rightarrow$ FAIL (kích hoạt 24h cooldown) | PASS: `SKIPPED_BY_JUMP` (`by_jump = true`); FAIL: 24h cooldown |
| **BF-12** SRS Review Flow | Learner | Mở tab Ôn tập | Hàng đợi thẻ đến hạn | 1. Quét thẻ đến hạn $\rightarrow$ 2. Làm bài gợi nhớ $\rightarrow$ 3. Áp dụng Policy B $[1,3,7,14,30]$ | Đúng $\rightarrow$ Tăng mốc ngày; Sai $\rightarrow$ Reset về mốc 1 ngày | Chạy RPC `record_review` cập nhật `nextReviewAt` + `ReviewLog` |
| **BF-13** Progress & Streak Tracking Flow | Learner | Hoàn thành bài / SRS | Hoạt động hợp lệ, Timezone | 1. Xác định ngày học $\rightarrow$ 2. So sánh ngày trước đó $\rightarrow$ 3. Cập nhật chuỗi Streak | Liên tục $\rightarrow +1$; Gián đoạn $\ge 1$ ngày $\rightarrow$ **Reset về 1** | Cập nhật `Profile.streakCount`, `lastQualifyingActivityDate` |
| **BF-14** Scenario Writing with GEC Flow | Learner | Viết câu tự do tình huống | Câu văn tiếng Anh của người học | 1. Nhập câu $\rightarrow$ 2. BFF proxy gọi FastAPI `/v1/gec/correct` $\rightarrow$ 3. Hiển thị diff lỗi | Có lỗi $\rightarrow$ Hiển thị gợi ý sửa; Không lỗi $\rightarrow$ Khen ngợi | Kết quả hiển thị tức thời; **KHÔNG lưu lỗi vào DB**, không tính điểm |
| **BF-15** Operations & Ticket Flow | Operations Staff | Người học gửi phản ánh | Nội dung phản ánh sự cố | 1. Mở ticket $\rightarrow$ 2. Tra cứu học viên tối thiểu $\rightarrow$ 3. Xử lý hoặc chuyển tuyến | Nghiệp vụ $\rightarrow$ Giải quyết; Nội dung $\rightarrow$ Báo Moderator | `SupportTicket` chuyển trạng thái: `OPEN → IN_PROGRESS → RESOLVED` |

---

## 4. State Machine Specifications

### 4.1. Content Lifecycle State Machine

Tái sử dụng nguyên văn mô hình 6 trạng thái đã được nghiệm thu tại M2.1 §5 và biểu đồ `docs/plantuml/content-lifecycle-state.puml`. M2.2 đóng vai trò ràng buộc hành vi vào các Use Cases tác nghiệp:

```
                  [ Creator Drafts ]
                          |
                          v
    +-----------------------------------------------+
    |                     DRAFT                     |<-------------------+
    +-----------------------------------------------+                    |
                          |                                              |
                          | Submit for Review (UC-08)                    |
                          v                                              |
    +-----------------------------------------------+                    |
    |                   IN_REVIEW                   |                    |
    +-----------------------------------------------+                    |
         |                                     |                         |
         | Approve (UC-09)                     | Request Changes (UC-09) |
         v                                     v                         |
    +-------------------+    +------------------------------------+      |
    |     APPROVED      |    |          CHANGES_REQUESTED         |------+
    +-------------------+    +------------------------------------+
         |         |
         |         | Emergency Publish (Admin only, reason + AuditLog)
         |         +-----------------------+
         | Normal Publish (Org Manager, UC-10)
         v                                 v
    +-----------------------------------------------+
    |                   PUBLISHED                   |
    +-----------------------------------------------+
                          |
                          | Archive (Org Manager normal / Admin emergency)
                          v
    +-----------------------------------------------+
    |                   ARCHIVED                    |  (Terminal in Core)
    +-----------------------------------------------+
```

**Các quy tắc hành vi vòng đời nội dung:**
1. `Trạng thái khởi đầu`: Mọi bài học bắt đầu ở `DRAFT`.
2. `Thẩm quyền duyệt`: Chỉ `MODERATOR` mới có quyền chuyển `IN_REVIEW → APPROVED` hoặc `IN_REVIEW → CHANGES_REQUESTED`. Tuyệt đối không dùng tên trạng thái `REJECTED`.
3. `Thẩm quyền xuất bản chuẩn tắc`: Độc quyền thuộc về `ORGANIZATIONAL_MANAGER` thực hiện trên bài học đang mang trạng thái `APPROVED`.
4. `Thẩm quyền xuất bản khẩn cấp`: `ADMINISTRATOR` chỉ được xuất bản khẩn cấp cho bài học **ĐÃ MANG TRẠNG THÁI `APPROVED`**, bắt buộc kèm lý do giải trình và ghi nhận `AuditLog`. Tuyệt đối cấm Administrator xuất bản bài học đang `IN_REVIEW` hay `DRAFT`.
5. `Tính kết thúc của ARCHIVED`: Trạng thái `ARCHIVED` là điểm dừng cuối cùng (terminal) trong phạm vi Core. Cấm chuyển trực tiếp `ARCHIVED → DRAFT`. Khi cần sửa bài đã xuất bản/lưu trữ, bắt buộc dùng cơ chế **Clone-to-Draft v2** tạo bài học mới với `supersedesId`.

---

### 4.2. Learning Progression State Machine

Tiến trình chuyển cấp của học viên được điều chỉnh bởi mô hình 3 trạng thái đầu ra chuẩn tắc kế thừa từ D3 §F:

```
                    [ Hoàn thành Unit / Đánh giá Chuyển tiếp ]
                                       |
                                       v
                    +------------------------------------+
                    |        EVALUATE READINESS          |  (Ngưỡng đánh giá CONFIGURABLE)
                    +------------------------------------+
                                       |
            +--------------------------+--------------------------+
            |                          |                          |
       Tiêu chí Đạt               Tiêu chí Đạt có Hỗ trợ     Tiêu chí Cần Bổ khuyết
            |                          |                          |
            v                          v                          v
    +---------------+      +-----------------------+      +---------------+
    |    ADVANCE    |      | ADVANCE_WITH_SUPPORT  |      |   REMEDIATE   |
    +---------------+      +-----------------------+      +---------------+
            |                          |                          |
   Mở khóa Unit sau       Mở khóa Unit sau kèm bài     Kích hoạt RemedialModule
    ngay lập tức            luyện tập bổ trợ nhẹ          học bù concept hổng
```

**Các bất biến hành vi tiến trình:**
- `Không tự động chuyển cấp (No Automatic Advance)`: Hoàn thành 100% bài học không đồng nghĩa với tự động nâng cấp độ năng lực hay tự động mở khóa nếu chưa đạt tiêu chí Readiness.
- `Không hạ cấp toàn bộ (No Whole-level Downgrade)`: Kỹ năng yếu chỉ kích hoạt hỗ trợ hoặc mô-đun bổ khuyết cho khái niệm hổng; tuyệt đối không hạ cấp độ tổng thể của học viên.
- `Không bắt học lại bài cũ (No Forced Replay)`: Mô-đun bổ khuyết `RemedialModule` bắt buộc phân phối ngữ cảnh mới, từ vựng mới, bài tập mới để củng cố concept cũ.
- `Trạng thái trung gian`: Loại bỏ hoàn toàn các nhãn không chuẩn tắc như `NOT_READY` hay `EVALUATING` khỏi tập trạng thái kết quả; 3 trạng thái hợp lệ duy nhất là `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`. Mọi ngưỡng số học giữ nguyên trạng thái `CONFIGURABLE / OPEN`.

---

### 4.3. KnowledgeGap State Machine

Vòng đời của một lỗ hổng kiến thức được phát hiện:

$$\text{OPEN} \xrightarrow{\text{Giao RemedialModule}} \text{IN\_REMEDIATION} \xrightarrow{\text{Vượt qua bài kiểm tra bổ trợ}} \text{RESOLVED}$$

- `OPEN`: Được tạo tự động khi học viên mắc lỗi sai liên tiếp/lặp lại trên cùng một Concept vượt ngưỡng cho phép (thay thế nhãn cũ `DETECTED`; ngưỡng số lỗi cụ thể giữ `CONFIGURABLE`).
- `IN_REMEDIATION`: Chuyển sang trạng thái này khi học viên bắt đầu học mô-đun bổ khuyết được giao.
- `RESOLVED`: Khép lại khi học viên vượt qua bài kiểm tra củng cố của mô-đun bổ khuyết.
- `Chính sách lưu trữ (Archival Policy)`: Giữ nguyên trạng thái `OPEN / PENDING` kế thừa từ D3 §N.

---

### 4.4. ConceptMastery State Machine

Mức độ thuần thục của học viên đối với một điểm kiến thức tuân thủ 3 trạng thái chuẩn tắc:

$$\text{NOVICE} \xrightarrow{\text{Bằng chứng đúng ban đầu}} \text{DEVELOPING} \xrightarrow{\text{Bằng chứng đúng nhất quán và duy trì}} \text{MASTERED}$$

- Thay thế hoàn toàn các nhãn cũ `INTRODUCED` và `PRACTICING` bằng `NOVICE` và `DEVELOPING`.
- Khi học viên mắc lỗi nghiêm trọng hoặc quên từ vựng lâu ngày, trạng thái có thể bị điều chỉnh ngược từ `MASTERED → DEVELOPING` hoặc `DEVELOPING → NOVICE`.
- Mọi ngưỡng số câu đúng/sai cụ thể để chuyển trạng thái giữ nguyên là `CONFIGURABLE / PENDING VALIDATION`. Không tự chế cơ chế phân rã (decay mechanics) hay đánh số stage cứng.

---

### 4.5. Assessment Entry & Result Behavior (Tách biệt Tuyệt đối 2 Nhánh)

Hệ thống thiết lập ranh giới tách bạch tuyệt đối giữa hai luồng nhập môn của học viên:

#### Nhánh 1: Tự khai báo cấp độ / Bỏ qua (Self-reported Entry / Skip)
```text
Người học tự chọn trình độ (A1) hoặc bấm Bỏ qua (Skip)
  │
  ▼
Cập nhật Profile: selfReportedLevel = "A1", status = UNVERIFIED
  │
  ▼
Thiết lập xuất phát điểm tạm thời: curriculumStartingPoint = Unit 1 (provisional)
  │
  ├──► TUYỆT ĐỐI KHÔNG TẠO BẢN GHI AssessmentResult
  ├──► TUYỆT ĐỐI KHÔNG TẠO BẢN GHI SkillProfile
  └──► TUYỆT ĐỐI KHÔNG GHI NHẬN verifiedProficiency
```

#### Nhánh 2: Làm bài Đánh giá Chẩn đoán Xếp lớp (Diagnostic Assessment Entry)
```text
Người học thực hiện bài kiểm tra chẩn đoán thích ứng (~25–30 câu, PROPOSED)
  │
  ▼
Hoàn thành bài thi
  │
  ▼
Tạo bản ghi AssessmentResult bất biến (assessmentType=DIAGNOSTIC, deliveryMode=PLACEMENT)
  │
  ▼
Khởi tạo / Cập nhật SkillProfile 4 chiều (Vocab, Grammar, Reading, Listening)
  │
  ▼
Xác nhận năng lực kiểm chứng: verifiedProficiency = verified
  │
  ▼
Ánh xạ Mapping A: Thiết lập curriculumStartingPoint = Unit X (X ∈ [1..6])
```

#### Các Bất biến Hành vi Cốt lõi:
$$\text{Self-reported} \ne \text{Verified}$$
$$\text{Starting Point} \ne \text{Proficiency}$$
$$\text{Learning Completion} \ne \text{Proficiency}$$

#### Quy tắc Bất biến của Thực thể AssessmentResult:
- **Không phải máy trạng thái nghiệp vụ biến thiên**: `AssessmentResult` không bao giờ chuyển qua các trạng thái như `in_review`, `approved`, hay `published`.
- **Hành trình duy nhất**:
  $$\text{Assessment Execution} \longrightarrow \text{AssessmentResult Created} \longrightarrow \text{Completed} \longrightarrow \text{Immutable Persisted Evidence}$$
- **Nguyên tắc Làm lại (Retake)**: Mọi lượt thi lại (Retake hoặc Re-evaluation) **bắt buộc tạo một bản ghi `AssessmentResult` hoàn toàn mới**, giữ nguyên vẹn bản ghi cũ trong cơ sở dữ liệu để phục vụ kiểm toán và theo dõi tiến bộ lịch sử.

---

## 5. Progression, Placement & Jump Decision Behavior

### 5.1. Curriculum Progression Behavior
- Đề cương khóa học English A1 gồm **6 Units**, mỗi Unit gồm **4 Lessons**, tổng cộng 24 Lessons.
- Bài học thứ 4 của mỗi Unit (ví dụ `U1-L4`) là bài ôn tập và củng cố tích hợp (*Review Gate*). Hoàn thành bài này cho phép hệ thống đánh giá Readiness trước khi mở Unit kế tiếp.
- `Quy tắc hiển thị Unit (Catalog Visibility)`: Một Unit chỉ xuất hiện trên danh mục bài học khi và chỉ khi cả 4/4 bài học con đều mang trạng thái `PUBLISHED` (D4 §D).

---

### 5.2. Placement Decision Behavior (English A1 Mapping A)

Dành riêng cho chương trình **English A1 Pilot**. Tuyệt đối không áp dụng để cấp chứng chỉ hay quy đổi quốc tế CEFR:

```
                            [ Thang điểm Thô: Raw Score Range (0 - 30) ]
                                               │
         ┌───────────────┬────────────────┬───┴────────────┬────────────────┬───────────────┐
         │               │                │                │                │               │
     0 - 7 điểm      8 - 12 điểm     13 - 17 điểm     18 - 22 điểm     23 - 26 điểm    27 - 30 điểm
         │               │                │                │                │               │
         ▼               ▼                ▼                ▼                ▼               ▼
      Unit 1          Unit 2           Unit 3           Unit 4           Unit 5          Unit 6
```

- **Quy mô đề thi**: `~25–30 items, PROPOSED / PENDING VALIDATION`. Thang điểm 0–30 là dải điểm thô quy ước của Mapping A, không đồng nhất với việc bắt buộc nạp đúng 30 câu hỏi.
- **Thao tác Bỏ qua (Skip)**: Tự động gán xuất phát tạm thời Unit 1 (`provisional`), không ghi nhận điểm số, không tạo `AssessmentResult`.
- **Làm lại bài thi (Retake)**: Tạo `AssessmentResult` mới, cập nhật `SkillProfile` mới và điều chỉnh lại Starting Unit tương ứng.

---

### 5.3. Jump Assessment Decision Behavior

Nằm trong phạm vi năng lực của **`UC-04` (Khám phá Lộ trình & Nhảy cấp)** và họ hành vi **`BF-11` (Conditional Jump Flow)**. Cho phép người học giỏi bỏ qua các Unit nội dung đã nắm vững để tối ưu hóa thời gian:

```
                          [ Người học yêu cầu Jump tới Unit Đích (UC-04) ]
                                              │
                                              ▼
                              Kiểm tra Cooldown: Có trong 24h trượt trước?
                                              │
                           ┌──────────────────┴──────────────────┐
                          Có                                    Không
                           │                                     │
                           ▼                                     ▼
                 Từ chối làm bài                         Xác định quy mô đề thi:
              Hiển thị đồng hồ đếm                     - Nhảy 1 Unit: 20 câu
                                                       - Nhảy 2–3 Units: 25–30 câu
                                                       - Nhảy >3 Units: 40 câu
                                                                 │
                                                                 ▼
                                                         Người học nộp bài
                                                                 │
                                               ┌─────────────────┴─────────────────┐
                                               ▼                                   ▼
                                        Tỷ lệ đúng ≥ 95%                    Tỷ lệ đúng < 95%
                                               │                                   │
                                               ▼                                   ▼
                                         [ JUMP PASS ]                       [ JUMP FAIL ]
                                - Tạo AssessmentResult (PASS)        - Tạo AssessmentResult (FAIL)
                                - Gán SKIPPED_BY_JUMP /              - Kích hoạt Cooldown 24 giờ
                                  UNLOCKED_BY_JUMP (by_jump=true)    - Thông báo thử lại sau 24h
                                - Mở khóa Unit đích ngay lập tức
                                - TUYỆT ĐỐI CẤM COMPLETED_BY_JUMP
```

**Bảng Ràng buộc Kỹ thuật Bài thi Jump:**
| Tham số | Giá trị chuẩn tắc đã đóng băng | Ý nghĩa nghiệp vụ |
|---|---|---|
| **Ngưỡng đạt (Pass Threshold)** | $\ge 95.0\%$ | Đảm bảo học viên thực sự xuất sắc mới được nhảy qua bài học |
| **Thời gian phạt (Cooldown)** | Đúng **24 giờ** | Ngăn chặn hành vi đoán mò hoặc spam bài kiểm tra nhảy cấp |
| **Quy mô đề 1 Unit** | **20 câu hỏi** | Kiểm tra cô đọng kiến thức trọng tâm của 1 Unit |
| **Quy mô đề 2–3 Units** | **25 – 30 câu hỏi** | Đánh giá tổng hợp kiến thức liên Unit |
| **Quy mô đề $>3$ Units** | **40 câu hỏi** | Đánh giá bao quát toàn diện trước khi cho phép nhảy xa |
| **Nhãn xuất xứ Unit** | `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` | Ghi nhận cờ `by_jump = true`; cấm gán nhãn đã học xong |

---

## 6. Exercise & Controlled Retry Behavior

### 6.1. Quy trình Thực hiện Bài tập & Phản hồi Tức thì
1. Người học nhận đề bài tương tác từ 1 trong 5 dạng chuẩn tắc: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
2. Người học chọn/nhập đáp án và bấm "Kiểm tra".
3. Tầng ứng dụng đối chiếu với `correct_answer` hoặc mảng cấu trúc trong Payload:
   - Nếu đúng: Hiển thị trạng thái thành công, phát âm thanh chúc mừng, hiển thị `rule_explanation`.
   - Nếu sai: Hiển thị đáp án đúng, highlight phần sai, hiển thị chi tiết `rule_explanation` giải thích tại sao sai.
4. Ghi nhận bằng chứng câu trả lời liên kết với thực thể `Concept`.

---

### 6.2. Thuật toán Làm lại có Kiểm soát (Controlled Retry - Decision D7) & Hoàn thành Bài học

```
                             [ Kết thúc Lượt làm Đầu tiên (N = 5 câu) ]
                                                 │
                                                 ▼
                                     Có câu trả lời sai không?
                                                 │
                              ┌──────────────────┴──────────────────┐
                            Không                                   Có
                              │                                     │
                              ▼                                     ▼
                      Hoàn thành 100%                   Tính toán số câu được Retry:
                      ở lượt đầu tiên                 allowance = max(1, floor(N × 0.10))
                                                      Với N=5: allowance = max(1, 0) = 1 câu
                                                                    │
                                                                    ▼
                                                      Người học làm lại câu hỏi sai
                                                                    │
                                               ┌────────────────────┴────────────────────┐
                                               ▼                                         ▼
                                        Làm lại ĐÚNG                              Làm lại SAI
                                               │                                         │
                                               ▼                                         ▼
                                     Nhận chính xác 70%                      Không có điểm
                                    giá trị điểm tối đa                     Ghi nhận lỗi tới Concept
                                     (Credit = 70.0%)                       Tạo KnowledgeGap nếu lặp lại
                                               │                                         │
                                               └────────────────────┬────────────────────┘
                                                                    │
                                                                    ▼
                                                    ĐÁNH GIÁ HOÀN THÀNH BÀI HỌC (UC-05):
                                          - Đã xử lý hết lượt đầu và câu retry bắt buộc
                                          - TUYỆT ĐỐI KHÔNG ÁP DỤNG ĐIỂM SÀN 80%
                                          - Cập nhật UserProgress = COMPLETED
```

---

## 7. Spaced Repetition Review (SRS) & Streak Behavior

### 7.1. Chu kỳ Ôn tập Tất định (Deterministic Policy B - Decision D8)
Hệ thống áp dụng chuỗi khoảng thời gian ngắt quãng cố định:

$$I = [1, 3, 7, 14, 30] \text{ ngày}$$

- **Trường hợp Trả lời Đúng**:
  $$I_{k+1} = \begin{cases} 3 & \text{nếu } I_k = 1 \\ 7 & \text{nếu } I_k = 3 \\ 14 & \text{nếu } I_k = 7 \\ 30 & \text{nếu } I_k = 14 \\ 30 & \text{nếu } I_k = 30 \end{cases}$$
- **Trường hợp Trả lời Sai**:
  $$I_{\text{next}} = 1 \text{ ngày (Reset về mốc ban đầu)}$$
- **Thời điểm ôn tập kế tiếp**:
  $$\text{nextReviewAt} = \text{currentDate} + I_{\text{next}} \times 24 \text{ giờ}$$

Mọi thao tác cập nhật trạng thái thẻ được đóng gói trong lời gọi thủ tục logic:
$$\text{record\_review}(\text{card\_id}, \text{is\_correct}, \text{recall\_prob}, \text{interval\_days})$$
*(NON-NORMATIVE CONCEPTUAL LABEL: Ký hiệu hàm mang tính quy ước logic; cơ sở dữ liệu kiểm tra chặt quyền sở hữu `auth.uid()`)*.

---

### 7.2. Tương tác Chuỗi Ngày Học Liên tục (Streak Processing - Decision D9)

```
                             [ Người học hoàn thành Hoạt động Hợp lệ ]
                                  (Hoàn thành bài học HOẶC phiên SRS)
                                                 │
                                                 ▼
                          Xác định ngày địa phương hiện tại theo múi giờ:
                            currentDate = ToLocalDate(now(), "Asia/Ho_Chi_Minh")
                                                 │
                                                 ▼
                              So sánh với lastQualifyingActivityDate:
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          │                                      │                                      │
currentDate = lastDate            currentDate = lastDate + 1 ngày        currentDate > lastDate + 1 ngày
          │                                      │                                      │
          ▼                                      ▼                                      ▼
Đã tích lũy hôm nay                  Duy trì chuỗi liên tục                     Bị gián đoạn ≥ 1 ngày
  Giữ nguyên streak                    streakCount = streakCount + 1              streakCount = 1 (RESET)
                                                 │                                      │
                                                 └───────────────────┬──────────────────┘
                                                                     │
                                                                     ▼
                                                   Cập nhật lastQualifyingActivityDate
```

*(Ghi chú kỹ thuật: Mọi phép so sánh ngày đều sử dụng chuẩn múi giờ IANA `Asia/Ho_Chi_Minh`. Hành vi reset về 1 khi đứt chuỗi tuân thủ nghiêm ngặt Decision D9 đã đóng băng. Các cơ chế Streak Freeze và Recovery Power-Up bị hoãn DEFERRED ngoài phạm vi MVP).*

---

## 8. Logical Screen-Flow Inventory (Artifact #19)

Bản kiểm kê luồng màn hình ở mức **thiết kế logic (Logical Screen Flow)**, hoàn toàn đồng nhất 100% với biểu đồ `docs/plantuml/screen-flow-inventory-m22.puml`:

### 8.1. Chuỗi Màn hình Học viên (Learner Navigation Chain: SCR-L-01 .. SCR-L-14)

| Mã Màn hình | Tên Màn hình Logic | Vai trò & Thẩm quyền | Use Case & Họ BF Liên kết | Phân loại Phạm vi | Mô tả Trách nhiệm Giao diện Logic |
|---|---|---|---|:---:|---|
| **SCR-L-01** | Auth & Welcome Screen | Khách / Người học | `UC-01` / `BF-01` | `CORE` | Đăng nhập email/mật khẩu, đăng ký tài khoản mới, điều hướng khôi phục mật khẩu. |
| **SCR-L-02** | Onboarding & Goal Setting | `Learner` | `UC-02` / `P1-FR-014` | `CORE` | Thiết lập mục tiêu học tập, cam kết thời gian hàng ngày ($[5..120]$ phút), múi giờ `Asia/Ho_Chi_Minh`. |
| **SCR-L-03** | Assessment Pathway Choice | `Learner` | `UC-03` / `BF-08` | `CORE` | Lựa chọn giữa: (A) Làm bài đánh giá chẩn đoán thích ứng, hoặc (B) Tự khai báo cấp độ / Bỏ qua. |
| **SCR-L-04** | Diagnostic Assessment Runner | `Learner` | `UC-03` / `BF-08` | `CORE` | Trình làm bài kiểm tra thích ứng 2 giai đoạn (`~25–30 items, PROPOSED`), đánh giá 4 chiều năng lực. |
| **SCR-L-05** | Placement Summary Screen | `Learner` | `UC-03` / `BF-08` | `CORE` | Hiển thị tóm tắt Starting Unit đề xuất theo Mapping A; hộp thoại xác nhận là `[FUTURE UX OPTION]`. |
| **SCR-L-06** | Curriculum Dashboard & Path | `Learner` | `UC-04` / `BF-09` | `CORE` | Bản đồ toàn cảnh 6 Units / 24 Lessons; trạng thái mở khóa; nút kích hoạt bài học và Jump. |
| **SCR-L-07** | Lesson Player & Exercise Runner | `Learner` | `UC-05` / `BF-09` | `CORE` | Trình chạy 5 bài tập tương tác (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), âm thanh & diff giải thích. |
| **SCR-L-08** | Controlled Retry Modal | `Learner` | `UC-05` / `BF-10` | `CORE` | Giao diện làm lại câu sai trong hạn mức allowance ($\max(1, \lfloor N \cdot 0.1 \rfloor)$); tính điểm 70% credit. |
| **SCR-L-09** | Lesson Completion Summary | `Learner` | `UC-05` | `CORE` | Màn hình hoàn thành bài học, cập nhật `UserProgress = COMPLETED`; (chỉ số XP là `[FUTURE GAMIFICATION]`). |
| **SCR-L-10** | SRS Review Session Player | `Learner` | `UC-06` / `BF-12` | `CORE` | Trình ôn tập lặp lại ngắt quãng thẻ từ vựng đến hạn theo chu kỳ Policy B $[1, 3, 7, 14, 30]$ ngày. |
| **SCR-L-11** | Jump Assessment Runner | `Learner` | `UC-04` / `BF-11` | `CORE` | Trình làm bài kiểm tra vượt cấp nhảy bài (20/25-30/40 câu, $\ge 95\%$, cooldown 24h, cờ `by_jump = true`). |
| **SCR-L-12** | Remedial Micro-Lesson Hub | `Learner` | `UC-04` / `BF-09` | `CORE` | Khu vực học bài bổ khuyết vi mô củng cố khái niệm hổng với ngữ cảnh mới (không hạ level, không học lại bài cũ). |
| **SCR-L-13** | Scenario Writing & GEC | `Learner` | Supporting AI / `BF-14` | `SUPPORTING` | Môi trường luyện viết câu theo tình huống; hiển thị gợi ý sửa lỗi ngữ pháp tức thời từ model GEC. |
| **SCR-L-14** | Learner Profile & Streak View | `Learner` | `UC-07` / `BF-13` | `CORE` | Hồ sơ cá nhân, biểu đồ mạng nhện Skill Profile 4 chiều, chuỗi Streak liên tục, lịch sử hoạt động. |

### 8.2. Chuỗi Màn hình Tác nghiệp & Quản trị (Authoring & Operations Chain: SCR-A-01 .. SCR-A-11)

| Mã Màn hình | Tên Màn hình Logic | Vai trò & Thẩm quyền | Use Case & Họ BF Liên kết | Phân loại Phạm vi | Mô tả Trách nhiệm Giao diện Logic |
|---|---|---|---|:---:|---|
| **SCR-A-01** | Staff Auth & Dispatch | All Staff Roles | `UC-01` / `BF-01` | `CORE` | Xác thực đăng nhập nhân sự quản trị; phân luồng về đúng giao diện vai trò (MFA là `[FUTURE SECURITY OPTION]`). |
| **SCR-A-02** | Staff Operations Dashboard | Staff Roles | `UC-08`..`UC-14` | `CORE` | Bảng điều khiển tác nghiệp tổng quan, hiển thị việc cần làm theo từng vai trò nhân sự. |
| **SCR-A-03** | Curriculum & Lesson Editor | `Lesson Creator` | `UC-08` / `BF-04` | `CORE` | Soạn thảo metadata bài học, cấu trúc blueprint sư phạm, phân phối 5 dạng bài tập theo assignment. |
| **SCR-A-04** | Item Bank Authoring | `Lesson Creator` | `UC-08` / `BF-04` | `CORE` | Soạn chi tiết payload 5 dạng bài tập, gắn nhãn `conceptId` từ Từ điển Khái niệm, lưu nháp và gửi duyệt. |
| **SCR-A-05** | Content Moderation Queue | `Moderator` | `UC-09` / `BF-05, BF-06`| `CORE` | Hàng đợi kiểm duyệt học liệu `IN_REVIEW`; kiểm tra chất lượng; duyệt `APPROVED` hoặc yêu cầu sửa `CHANGES_REQUESTED`. |
| **SCR-A-06** | Publishing & Operations | `Org Manager`, `Admin` | `UC-10` / `BF-07` | `CORE` | Phát hành bài học `APPROVED → PUBLISHED` (Manager chuẩn tắc, Admin khẩn cấp kèm lý do), lưu trữ `ARCHIVED`. |
| **SCR-A-07** | Account Administration | `Administrator` | `UC-11` / Admin | `CORE` | Quản lý danh mục tài khoản người dùng, phân bổ quyền SoD, kích hoạt / vô hiệu hóa tài khoản. |
| **SCR-A-08** | System Operations Reports | `Admin`, `Org Manager` | `UC-12` / Admin | `CORE` | Xem báo cáo tổng hợp DAU/MAU, tiến độ học viên, tỷ lệ đỗ/trượt Jump và hiệu suất duyệt bài. |
| **SCR-A-09** | Security Audit Log Viewer | `Administrator` | `UC-13` / Admin | `CORE` | Tra cứu nhật ký kiểm toán hệ thống bất biến (Append-only `AuditLog`), lọc sự kiện khẩn cấp `isEmergency`. |
| **SCR-A-10** | Support Ticket Queue | `Operations Staff` | `UC-14` / `BF-15` | `CORE` | Tiếp nhận phản ánh sự cố của học viên, phân loại xử lý hoặc chuyển tiếp leo thang tới Moderator/Admin. |
| **SCR-A-11** | Cohort Management Portal | `Org Manager` | `UC-15` / Extension | `EXTENSION` | Quản lý lớp học liên kết B2B và báo cáo nhóm (`OPTIONAL / FUTURE EXTENSION BOUNDARY`). |

---

## 9. Design Decision (DD) Behavioral Closure

M2.2 chính thức khép lại các khía cạnh **ngữ nghĩa hành vi (Behavioral Semantics)** của các quyết định thiết kế mở, trong khi tiếp tục giữ nguyên tính linh hoạt cho việc biểu diễn vật lý (Physical Modeling) ở các mốc sau:

| Mã Quyết định | Khía cạnh Ngữ nghĩa Hành vi đã Đóng (M2.2 Closes) | Khía cạnh Biểu diễn Vật lý chưa Đóng (M2.3+ / M2.6) |
|---|---|---|
| **DD-01 Unit** | Hành vi phân cấp chặt chẽ: `Course → Unit → Lesson → Exercise`. Điều hướng tuyến tính và kiểm tra Jump thực hiện theo đơn vị Unit. Quy tắc hiển thị Unit đòi hỏi 4/4 bài con `PUBLISHED`. | Cấu trúc quan hệ bảng vật lý `Unit` và kịch bản di trú dữ liệu (`schema.prisma` mapping). |
| **DD-02 Revision** | Hành vi Clone-to-Draft v2: Khi sửa bài đã phát hành, tạo bản sao mới ở trạng thái `DRAFT`; bài cũ tiếp tục phục vụ bình thường cho đến khi bài mới được xuất bản. | Lưu vết qua trường `supersedesId` hay tách bảng lịch sử phiên bản riêng (`lesson_revisions`). |
| **DD-04 Assignment** | Hành vi phân công SoD: Manager lập kế hoạch và gán bài cho Creator; Creator chỉ được soạn bài được gán; cấm Creator tự phê duyệt hay tự ý xuất bản chéo. | Tên trường lưu trữ vật lý (`creatorId`, `assignmentBrief`, `assignedTo`). |
| **DD-05 Assessment Context** | Tách bạch hoàn toàn hai trục: Mục đích (`assessmentType`: DIAGNOSTIC, EXIT, RE_EVALUATION) vs Hình thức (`deliveryMode`: PLACEMENT, JUMP, STANDARD). Bài kiểm tra là một ngữ cảnh của Exercise; (no AssessmentSession entity exists); không tồn tại entity ma (`Exam`, `QuestionBank`, `AssessmentSession`). | Biểu diễn cờ vật lý `isAssessmentMode` hay lưu trữ trường phân loại `lesson_type`. |
| **DD-06 Placement** | Hành vi xếp lớp theo Mapping A (English A1): Điểm số chốt ra Starting Unit duy nhất; Skip gán U1 không điểm; Retake tạo bản ghi kết quả mới; bằng chứng kết quả là bất biến. | Tùy chọn lưu trữ `placement_history JSONB` trên `LearnerProfile` hay truy vấn động từ `AssessmentResult`. |

*(Lưu ý: Các quyết định DD-03 về AuditLog RLS và DD-10 về Storage RLS thuộc phạm vi Mốc M2.4 Kiến trúc & An ninh, không xử lý tại M2.2).*

---

## 10. Traceability Matrix (Requirements $\rightarrow$ M2.2 Behavior)

Bảng truy vết nối liền từ Yêu cầu nghiệp vụ đến Lớp Hành vi M2.2 tuân thủ nghiêm ngặt mã họ hành vi chuẩn tắc từ `docs/06-system-analysis.md`:

| Mã Yêu cầu | MVP ID | Mã Chuẩn tắc | Use Case | Họ Hành vi BF | Mô hình / Máy Trạng thái M2.2 | Ranh giới Phạm vi |
|---|---|---|---|---|---|:---:|
| `YC-CORE-01` | `MVP-01` | `P1-FR-001`, `P1-FR-010` | `UC-01` | `BF-01` | Session Lifecycle, Cookie httpOnly Auth | `CORE` |
| `YC-CORE-02` | `MVP-02` | `P1-FR-014`, `P1-FR-015` | `UC-02` | — | Daily Goal Min $[5..120]$, In-app Reminder Setup | `CORE` |
| `YC-CORE-03` | `MVP-04` | `P1-FR-002` | `UC-04` | `BF-09` | Curriculum Navigation (Course→Unit→Lesson) | `CORE` |
| `YC-CORE-04` | `MVP-12` | `P1-FR-008` | `UC-08` | `BF-03`, `BF-04` | Content Lifecycle (`DRAFT → IN_REVIEW`) | `CORE` |
| `YC-CORE-05` | `MVP-13` | `P1-FR-008` | `UC-09` | `BF-05` | Moderation (`IN_REVIEW → APPROVED / CHANGES_REQUESTED`) | `CORE` |
| `YC-CORE-06` | `MVP-13` | `P1-FR-008` | `UC-10` | `BF-07` | Publishing (`APPROVED → PUBLISHED`), Admin Emergency | `CORE` |
| `YC-CORE-07` | `MVP-05..07`| `P1-FR-003,012,013` | `UC-05` | `BF-09`, `BF-10` | 5 Exercise Payloads, Controlled Retry D7 | `CORE` |
| `YC-CORE-08` | `MVP-09` | `P1-FR-005,006` | `UC-06` | `BF-12` | SRS Policy B $[1,3,7,14,30]$, RPC `record_review` | `CORE` |
| `YC-CORE-09` | `MVP-03` | `P1-FR-016` | `UC-03` | `BF-08` | Placement Mapping A (Score Range 0–30) | `CORE` |
| `YC-CORE-09` | `MVP-03` | `P1-FR-016` | `UC-04` | `BF-11` | Conditional Jump Assessment $\ge 95\%$ | `CORE` |
| `YC-CORE-10` | `MVP-10` | `P1-FR-011` | `UC-07` | `BF-13` | Streak Tracking, Qualifying Activity, Reset to 1 | `CORE` |
| `YC-CORE-11` | `MVP-08,11` | `P1-FR-004`, `P1-FR-016` (Skill Profile ref) | `UC-07` | `BF-13` | 4-Concept Separation, Skill Profile Dashboard | `CORE` |
| `YC-CORE-12` | `MVP-14,19`| `P1-FR-008,NFR-001`| `UC-11..13`| `BF-01` / Admin | Account/Role Admin, Reports, Immutable AuditLog | `CORE` |
| `YC-EXT-01` | `MVP-18` | `P1-FR-007` | — | `BF-14` | Transient Scenario Writing & GEC `/v1/gec/correct` | `SUPPORTING` |
| `YC-EXT-04` | `MVP-16` | Operational | `UC-14` | `BF-15` | Support Ticket Handling (`OPEN → IN_PROGRESS → RESOLVED`) | `CORE` |
| `YC-EXT-08` | `MVP-17` | Organizational | `UC-15` | — | Cohort Management & Group Analytics | `EXTENSION` |

---

## 11. Verification & Validation Evidence (D-G4 & D-G7)

### 11.1. Cổng Kiểm tra D-G4: Use Case, Activity & Behavior Completeness

- **Đầu vào kiểm tra:** Danh mục 15 Use Cases, Danh mục 15 Họ hành vi BF, Ma trận phân quyền SoD, Artifacts #9, #10, #19.
- **Phương pháp kiểm tra:** Đối soát chéo từng Use Case, từng Activity Family, thẩm quyền tác nhân, các nhánh rẽ và ngoại lệ, không có Use Case mồ côi hay tác nhân sai lệch.
- **Tiêu chí Đạt chuẩn (PASS Conditions):**
  1. Bao phủ đầy đủ 15 Use Cases chuẩn tắc (`UC-01`..`UC-15`), không có `UC-16/17/18`.
  2. Bao phủ đầy đủ 15 họ hành vi (`BF-01`..`BF-15`), không có `BF-16`.
  3. Thẩm quyền tác nhân tuân thủ SoD: `Organizational Manager` xuất bản (`UC-10`), Moderator dừng ở `APPROVED` (`UC-09`), Admin chỉ xuất bản khẩn cấp bài `APPROVED`.
  4. Phân định rõ ràng `UC-15` là `OPTIONAL / FUTURE EXTENSION BOUNDARY`.
  5. Tuyệt đối (no AssessmentSession entity exists); không tồn tại entity ma (`Exam`, `QuestionBank`, `AssessmentSession`).
- **Kết luận Cổng D-G4:** **`PASS`** (Bằng chứng được xác lập đầy đủ tại Mục 2, 3 và 10 của tài liệu này).

---

### 11.2. Cổng Kiểm tra D-G7: Educational Policy & Business Rule Verification

- **Đầu vào kiểm tra:** Đề cương English A1 (`08`), Đặc tả Placement & Jump (`09`), Các quyết định sản phẩm D1–D9, Artifacts #3, #10, #17, #18.
- **Phương pháp kiểm tra:** Quét đối chiếu từng giá trị số học và quy tắc nghiệp vụ đã đóng băng xem có xuất hiện chính xác 100% không.
- **Bảng Đối soát Giá trị Số học Chuẩn tắc:**

| Quy tắc Nghiệp vụ / Tham số | Giá trị Đóng băng Bắt buộc | Giá trị Ghi nhận trong M2.2 | Kết luận Đối soát |
|---|:---:|:---:|:---:|
| **Placement Bands (0–7)** | Mở khóa **Unit 1** | Unit 1 (§5.2) | **PASS** |
| **Placement Bands (8–12)** | Mở khóa **Unit 2** | Unit 2 (§5.2) | **PASS** |
| **Placement Bands (13–17)** | Mở khóa **Unit 3** | Unit 3 (§5.2) | **PASS** |
| **Placement Bands (18–22)** | Mở khóa **Unit 4** | Unit 4 (§5.2) | **PASS** |
| **Placement Bands (23–26)** | Mở khóa **Unit 5** | Unit 5 (§5.2) | **PASS** |
| **Placement Bands (27–30)** | Mở khóa **Unit 6** | Unit 6 (§5.2) | **PASS** |
| **Placement Skip** | Gán **Unit 1 tạm thời, 0 điểm, 0 AssessmentResult** | Unit 1, no result (§4.5, §5.2) | **PASS** |
| **Jump Quy mô 1 Unit** | **20 câu hỏi** | 20 câu hỏi (§5.3) | **PASS** |
| **Jump Quy mô 2–3 Units** | **25 – 30 câu hỏi** | 25 – 30 câu hỏi (§5.3) | **PASS** |
| **Jump Quy mô $>3$ Units** | **40 câu hỏi** | 40 câu hỏi (§5.3) | **PASS** |
| **Jump Ngưỡng đạt** | $\mathbf{\ge 95.0\%}$ | $\ge 95.0\%$ (§5.3) | **PASS** |
| **Jump Cooldown** | Đúng **24 giờ** | Đúng 24 giờ (§5.3) | **PASS** |
| **Jump Xuất xứ** | `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` | `by_jump = true` (§5.3) | **PASS** |
| **Cấm nhãn Jump** | **Tuyệt đối cấm COMPLETED_BY_JUMP** | Cấm COMPLETED_BY_JUMP (§5.3) | **PASS** |
| **Controlled Retry Allowance** | $\mathbf{\max(1, \lfloor N \cdot 0.10 \rfloor)}$ | $\max(1, \lfloor N \cdot 0.10 \rfloor)$ (§6.2) | **PASS** |
| **Controlled Retry Credit** | Đúng $\mathbf{70.0\%}$ | Đúng 70.0% (§6.2) | **PASS** |
| **Hoàn thành bài học** | **Xử lý hết câu hỏi, KHÔNG sàn 80%** | Xử lý hết, không sàn 80% (§6.2) | **PASS** |
| **SRS Chu kỳ Policy B** | $[\mathbf{1, 3, 7, 14, 30}]$ ngày | $[1, 3, 7, 14, 30]$ ngày (§7.1) | **PASS** |
| **Streak Reset khi gián đoạn** | **Reset về 1** | Reset về 1 (§7.2) | **PASS** |
| **Streak Múi giờ** | $\mathbf{Asia/Ho\_Chi\_Minh}$ | `Asia/Ho_Chi_Minh` (§7.2) | **PASS** |
| **Tách biệt Nhập môn** | $\mathbf{Self-reported \ne Verified}$ | Tách 2 nhánh tuyệt đối (§4.5) | **PASS** |
| **Chứng chỉ CEFR** | **KHÔNG cấp chứng chỉ, KHÔNG universal** | Không cấp chứng chỉ (§5.2) | **PASS** |

- **Kết luận Cổng D-G7:** **`PASS`** (100% các giá trị tham số đóng băng khớp tuyệt đối với baseline).

---

## 12. Open Decisions Register (D3 §N / D4 §Q Preserved)

Tất cả 13 nhóm quyết định mở kế thừa từ D3 §N và D4 §Q tiếp tục được giữ nguyên trạng thái `OPEN / CONFIGURABLE / PENDING VALIDATION`. M2.2 không tự ý chốt số hay hardcode vào các luồng hoạt động:

1. **Diagnostic Item Count & Skill Distribution:** Quy mô câu hỏi (`~25–30 items, PROPOSED / PENDING VALIDATION`) và tỷ lệ phân bổ giữa 4 kỹ năng giữ `PROPOSED / PENDING VALIDATION`.
2. **Scoring Function & Weights:** Công thức chấm điểm thành phần và trọng số câu hỏi giữ `OPEN / CONFIGURABLE`.
3. **Adaptive Branching Thresholds:** Ngưỡng rẽ nhánh từ Routing Stage sang Targeted Stage giữ `PROPOSED / PENDING VALIDATION`.
4. **Stopping Rules:** Ngưỡng khoảng tin cậy dừng sớm bài chẩn đoán giữ `PROPOSED / PENDING VALIDATION`.
5. **Mastery Thresholds:** Số câu đúng/sai để chuyển `NOVICE → DEVELOPING → MASTERED` giữ `CONFIGURABLE`.
6. **Readiness Gate Cutoffs:** Ngưỡng đánh giá `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE` giữ `CONFIGURABLE`.
7. **Remediation Trigger Thresholds:** Số lỗi sai liên tiếp để tạo `KnowledgeGap` giữ `CONFIGURABLE`.
8. **Anchor Level Aggregation Formula:** Công thức gộp 4 chiều SkillProfile thành 1 bậc Anchor duy nhất giữ `PENDING VALIDATION`.
9. **CEFR Mapping Beyond English A1:** Ánh xạ chương trình ngoài English A1 Mapping A giữ `OPEN / PENDING`.
10. **HSK Framework Version:** Tùy chọn chuyển đổi HSK 2.0 vs 3.0 giữ `OPEN / CONFIGURABLE`.
11. **KnowledgeGap Archival Policy:** Chính sách lưu trữ/đóng vĩnh viễn các lỗ hổng kiến thức cũ giữ `OPEN / PENDING`.
12. **Recommendation Policy & Versioning:** Quy tắc tính toán phiên bản và cập nhật gợi ý học tập giữ `OPEN / PENDING`.
13. **Reading Physical Database Representation:** Dạng bài Đọc hiểu dạng phức hợp giữ `PROPOSED / DESIGN GAP`.

---

## 13. Design Risks & Mitigations

1. **R-M22-01: Nguy cơ Trôi ngưỡng (Threshold Drift):**
   - *Rủi ro:* Tài liệu hành vi vô tình chốt cứng một con số chưa được phê duyệt thành quy tắc nghiệp vụ.
   - *Giảm thiểu:* Gắn nhãn tường minh `CONFIGURABLE / PENDING VALIDATION` cho mọi ngưỡng quyết định thích ứng và mastery; Cổng D-G7 kiểm soát danh mục literal values.
2. **R-M22-02: Nguy cơ Gộp điểm phẳng (Flat-score Temptation):**
   - *Rủi ro:* Tính điểm trung bình cộng 4 chiều kỹ năng làm mất đi tính đa chiều của Skill Profile.
   - *Giảm thiểu:* Bắt buộc thể hiện 4 kỹ năng độc lập trong mọi luồng dữ liệu đánh giá và dashboard theo Bất biến I2.
3. **R-M22-03: Nguy cơ Tái xuất hiện Thực thể Ma (Ghost Entities):**
   - *Rủi ro:* Tái đưa `Exam`, `QuestionBank`, hoặc `AssessmentSession` (không phải persisted entity) vào các biểu đồ Use Case hoặc Activity.
   - *Giảm thiểu:* Kiểm tra phủ định tự động; khẳng định không tồn tại entity `AssessmentSession` hay `Exam`/`QuestionBank`.
4. **R-M22-04: Nguy cơ Nhầm lẫn Thẩm quyền Xuất bản (UC-10 SoD Conflict):**
   - *Rủi ro:* Nhầm lẫn vai trò Moderator là người xuất bản như bảng cũ trong một số báo cáo lịch sử.
   - *Giảm thiểu:* Khẳng định độc quyền xuất bản thuộc về `Organizational Manager`; Moderator dừng lại ở `APPROVED`; Administrator xuất bản khẩn cấp chỉ khi bài đã `APPROVED`.

---

## 14. Explicit Out-of-Scope Confirmations

Để bảo vệ ranh giới phát triển và chống phình phạm vi (Scope Creep):
- **KHÔNG Mã nguồn Runtime:** 0 dòng code TypeScript, Python, hoặc SQL được tạo mới hay sửa đổi.
- **KHÔNG Di trú Cơ sở dữ liệu:** Không tạo hay thực thi bất kỳ Prisma migration nào.
- **KHÔNG Thiết kế UI/CSS:** Không có mã giao diện, CSS, hay thiết kế pixel được sinh ra.
- **KHÔNG Thực thi Thuật toán:** Các công thức chấm điểm, xếp hạng gợi ý tiếp tục giữ trạng thái mở cho giai đoạn sau.
- **KHÔNG Tự chế UC/BF:** Không sinh mã `UC-16..18`, không sinh `BF-16`.

---

## 15. Negative Checks Verification Report

Kết quả quét tự động các từ khóa và khái niệm bị cấm trên toàn bộ tài liệu M2.2:

| Khái niệm Bị cấm / Nhạy cảm | Số lượng Xuất hiện Vi phạm | Trạng thái Kiểm tra |
|---|:---:|:---:|
| `UC-16`, `UC-17`, `UC-18` | **0** | **PASS** |
| `BF-16` | **0** | **PASS** |
| `UC-06-viết` | **0** | **PASS** |
| `COMPLETED_BY_JUMP` | **0** (Chỉ xuất hiện trong câu lệnh cấm) | **PASS** |
| `Exam`, `QuestionBank` | **0** (Chỉ xuất hiện trong câu lệnh cấm) | **PASS** |
| `AssessmentSession` | **0** (không tồn tại entity, chỉ xuất hiện trong câu lệnh phủ định) | **PASS** |
| `Self-reported → AssessmentResult` | **0** (Tách biệt hoàn toàn) | **PASS** |
| Điểm sàn hoàn thành bài học 80% | **0** (Đã bãi bỏ theo D7) | **PASS** |
| Reset streak về 0 | **0** (Chuẩn hóa reset về 1 theo D9) | **PASS** |
| Tự động nâng cấp độ sau bài học | **0** (Cấm automatic advance) | **PASS** |
| Hạ toàn bộ cấp độ (Whole-level downgrade) | **0** (Cấm hạ level) | **PASS** |
| Bắt học lại bài cũ (Forced replay) | **0** (Remediation dùng bài mới) | **PASS** |
| Cấp chứng chỉ năng lực CEFR | **0** (Chỉ định vị trí trên đề cương) | **PASS** |
| `REJECTED` như một trạng thái chuẩn tắc | **0** (Thay bằng `CHANGES_REQUESTED`) | **PASS** |
| `Content Manager` như một vai trò con người | **0** (Thay bằng `Organizational Manager`) | **PASS** |
| `NOT_READY`, `EVALUATING` như trạng thái Readiness | **0** (Chỉ 3 trạng thái `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`) | **PASS** |
| `DETECTED` như trạng thái KnowledgeGap | **0** (Thay bằng `OPEN`) | **PASS** |
| `INTRODUCED`, `PRACTICING` như trạng thái ConceptMastery | **0** (Thay bằng `NOVICE`, `DEVELOPING`) | **PASS** |
| `longest_streak` hoạt động | **0** (Đã loại bỏ khỏi luồng tính toán) | **PASS** |
| Hoạt động `Streak Freeze` / `Power-Up` | **0** (Đã loại bỏ khỏi luồng tính toán, đánh dấu DEFERRED) | **PASS** |

---

## 16. Final Status & Sign-off

```text
STATUS: READY FOR INDEPENDENT RE-REVIEW
DESIGN COMPLETE: NOT CLAIMED
ACCEPTED: NOT CLAIMED
COMPLETION DATE: 2026-09-26
```

Tài liệu này cung cấp đầy đủ đặc tả hành vi hệ thống đã được khắc phục toàn diện theo kết luận đánh giá độc lập cho Mốc M2.2 của dự án Lingora, sẵn sàng cho công tác tái kiểm định độc lập (Independent Re-Review).
