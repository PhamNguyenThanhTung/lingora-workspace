# LINGORA — PHASE 1 MILESTONE M2.6: DESIGN-TO-IMPLEMENTATION HANDOFF SPECIFICATION

> **Mã tài liệu:** `docs/phase-1-m2-6-design-handoff.md`  
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Mốc thực thi:** Milestone M2.6 (Design-to-Implementation Handoff — Handoff Package)  
> **Trạng thái:** `IMPLEMENTED — READY FOR INDEPENDENT REVIEW`  
> **Căn cứ kế hoạch:** `plans/m2-6-design-handoff-plan.md`, `docs/phase-1-system-design-plan.md` §§7, 10, 11, 12, 14  
> **Trạng thái tiếp nhận (Entry State):** `M2.5 ACCEPTED FOR M2.6` (ADR-028; commit `d09f7cc5ef0ec251bbf64b272d91b4ecae56a3e4`), `M2.6 PLAN = APPROVED`  
> **Ranh giới nghiêm ngặt:**  
> 1. **HANDOFF-ONLY / ZERO IMPLEMENTATION:** M2.6 là gói bàn giao thiết kế sang triển khai, tuyệt đối KHÔNG viết mã nguồn ứng dụng (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÔNG chỉnh sửa `schema.prisma`, KHÔNG tạo hoặc thực thi file migration DDL/SQL, KHÔNG triển khai chính sách RLS trên cơ sở dữ liệu thực tế, KHÔNG chạy thử nghiệm mã nguồn, KHÔNG lưu trữ bí mật thực tế, và KHÔNG triển khai hạ tầng đám mây.  
> 2. **TIER-3 PHYSICAL DECISION ON PAPER:** Mọi quyết định thiết kế vật lý Tầng 3 (DD-01..06 và DD-10) được giải quyết trên giấy tờ dưới dạng đặc tả thiết kế (prose/spec form); một quyết định thiết kế trên giấy tờ KHÔNG PHẢI là một hành động triển khai thực thi (`Tier-3 written design decision != implementation`).  
> 3. **TARGET RUNTIME NOT PRODUCTION READY:** M2.6 KHÔNG tuyên bố môi trường runtime mục tiêu (Target Runtime) đã sẵn sàng vận hành sản xuất (`NOT PRODUCTION READY / NOT DEPLOYED`).  
> 4. **D-G10 VALIDATION SCOPE:** Cổng kiểm định D-G10 là cổng duy nhất của M2.6 và chỉ xác nhận **tính sẵn sàng bàn giao triển khai** (`IMPLEMENTATION HANDOFF READINESS`), tuyệt đối không xác nhận tính sẵn sàng vận hành runtime hay sản xuất.  
> 5. **CONTRACT IMMUTABILITY:** Hợp đồng dịch vụ trí tuệ nhân tạo `docs/03-api-contract.md` được giữ nguyên 100% byte-identical và chỉ đọc. Các sản phẩm số hiệu 1–20 từ M2.1–M2.5 được tham chiếu chỉ đọc và không bị sửa đổi.

---

## 1. Executive Summary & Governance Baseline

Milestone M2.6 là mốc kết thúc của Giai đoạn 1 (Phase 1 — System Analysis & Design). Nhiệm vụ cốt lõi của M2.6 là chuyển đổi toàn bộ 20 sản phẩm thiết kế hệ thống đã được kiểm định và chấp thuận (M2.1–M2.5) thành **gói bàn giao sẵn sàng triển khai (Implementation-Readable Handoff Package)** cho Giai đoạn 2 (Phase 2 — System Implementation).

M2.6 không tạo thêm số hiệu sản phẩm thiết kế mới (hệ thống 20 sản phẩm thiết kế đã hoàn thành trọn vẹn tại M2.5 với Artifact #20). Thay vào đó, tài liệu này đóng vai trò là bản đặc tả kỹ thuật bàn giao bao gồm 7 hợp phần chính:
1. **Khung kế hoạch di chuyển dữ liệu (Migration-Plan Outline + Rollback):** Đầy đủ 8 giai đoạn thiết kế có thứ tự thực hiện, ánh xạ quyết định thiết kế (DD), nhãn trạng thái và phương án hoàn nguyên chi tiết; không thực thi DDL/SQL.
2. **Khung kế hoạch kiểm thử triển khai (Test-Plan Skeleton):** 18 khung kịch bản kiểm thử chuẩn hóa bao phủ đầy đủ các chính sách nghiệp vụ cốt lõi và biên an ninh; đóng vai trò mẫu khung kịch bản cho Phase 2; không thực thi kiểm thử mã nguồn.
3. **Danh mục phụ thuộc giao diện lập trình (API Dependency Register):** Phân loại toàn bộ các bề mặt API theo 4 tầng trạng thái chuẩn tắc; đối chiếu toàn diện với `docs/03-api-contract.md`.
4. **Tái xác nhận mô hình an ninh và nhật ký kiểm toán (Security & Audit Reconfirmation):** Tái khẳng định nguyên vẹn 5 vùng an ninh (bao gồm Zone 5 Privileged Infrastructure Operations), 6 ranh giới an ninh, 6 vai trò chuẩn tắc, quy tắc phân tách nhiệm vụ (SoD), RLS kép, và danh mục 11 sự kiện kiểm toán của M2.4; không tái thiết kế.
5. **Đồng bộ hóa ánh xạ báo cáo học thuật (Report Mapping & Evidence Index):** Chuẩn hóa chuỗi truy vết từ yêu cầu nghiệp vụ đến các chương báo cáo học thuật theo `docs/phase-1-system-design-plan.md` §11 và thiết lập mục lục bằng chứng phân định rõ ràng giữa bằng chứng hiện tại và kế hoạch tương lai.
6. **Hồ sơ giải quyết quyết định thiết kế vật lý Tầng 3 (DD-01..06 & DD-10 Closure Record):** Đóng toàn bộ các khoảng trống biểu diễn vật lý còn mở từ M2.1–M2.5 trên giấy tờ theo đúng lược đồ chuẩn 10 cột.
7. **Sổ đăng ký phụ thuộc triển khai và quản trị (Implementation & Governance Dependency Register):** Sổ đăng ký độc lập theo đúng lược đồ chuẩn 9 trường quản trị mọi điều kiện kỹ thuật và mốc bàn giao trước khi bước vào Phase 2.

```
+----------------------------------------------------------------------------------------------------+
|                                    M2.6 HANDOFF ARCHITECTURE MATRIX                                |
+-----------------------------------+-----------------------------------+----------------------------+
| OUTPUT 1: MIGRATION OUTLINE       | OUTPUT 2: TEST-PLAN SKELETON      | OUTPUT 3: API REGISTER     |
| - 8 Design Phases (1..8)          | - 18 Mandatory Scenario Frames    | - 4-Tier Surface Audit     |
| - Explicit State Transitions      | - Inputs, Shapes, Pass Conditions | - CURRENT / TARGET /       |
| - Per-Step Rollback Targets       | - Security Implications & Layers  |   FUTURE / COMPATIBILITY   |
| - Zero Executed DDL / SQL         | - Labeled: SKELETON — NOT EXECUTED| - docs/03 Byte-Identical   |
+-----------------------------------+-----------------------------------+----------------------------+
| OUTPUT 4: SECURITY & AUDIT        | OUTPUT 5: REPORT MAPPING & INDEX  | OUTPUT 6: DD-01..06/10     |
| - 5 Zones (Zone 5 Privileged Ops) | - Trace: Req->UC->BF->Task->Report| - Exact 10-Column Schema   |
| - 6 Boundaries (B1..B6)           | - Roadmap §11 Row-by-Row Parity   | - Tier 3 Decided on Paper  |
| - 6 Canonical Roles (No 7th Role) | - Anti-Fabrication Rule Enforced  | - Zero Migration Execution |
| - 11 Canonical Audit Events       | - Current vs Future Evidence Index| - Full Physical Spec       |
+-----------------------------------+-----------------------------------+----------------------------+
| DELIVERABLE 7: DEPENDENCY REGISTER| GATE D-G10: HANDOFF READINESS     | FIREWALL & INTEGRITY       |
| - Exact 9-Field Mandatory Schema  | - Formal 6-Field Specification    | - Zero Runtime Code        |
| - Technical & Governance Scopes   | - Handoff Readiness ONLY          | - Zero Schema / Prisma DDL |
| - Status: RESOLVED / OPEN / BLOCK | - NOT Runtime / Production Ready  | - M2.5 Baselines Frozen    |
| - ZERO Unresolved BLOCKING Rows   | - Verdict: PASS                   | - Read-Only Artifacts 1-20 |
+-----------------------------------+-----------------------------------+----------------------------+
```

---

## 2. Output 1 — Migration-Plan Outline & Rollback Strategy

Khung kế hoạch di chuyển dữ liệu này xác lập lộ trình thiết kế có trật tự, có khả năng hoàn nguyên và được phân loại trạng thái rõ ràng nhằm dẫn đường cho các kỹ sư triển khai trong Giai đoạn 2. Khung kế hoạch bao gồm đầy đủ **8 giai đoạn chuẩn tắc**, được thiết kế thuần túy trên tài liệu và **tuyệt đối không chứa mã SQL thực thi**.

### Bảng Tổng Hợp 8 Giai Đoạn Di Chuyển Dữ Liệu (Design-Only Migration Outline)

| Giai đoạn | Tên Giai Đoạn | Phụ Thuộc | Đối Tượng Bị Ảnh Hưởng | Trạng Thái Phân Loại | Chuyển Đổi Trạng Thái Dự Kiến | Điểm Kiểm Soát (Validation Checkpoint) | Mục Tiêu Hoàn Nguyên (Rollback Target) | Rủi Ro Kỹ Thuật | Hệ Quả Triển Khai (Phase 2 Consequence) |
|---|---|---|---|---|---|---|---|---|---|
| **Phase 1** | Pre-Migration Checks & Snapshot | Quyền quản trị Zone 5; kho lưu trữ snapshot sẵn sàng | Toàn bộ cơ sở dữ liệu Supabase Postgres, catalog hệ thống | `CURRENT_APPLIED` | Xác nhận tính toàn vẹn của lược đồ hiện tại; khóa điểm snapshot an toàn | Kiểm tra checksum sao lưu, đo lường dung lượng đĩa trống, không có giao dịch ghi tồn đọng | Hoàn nguyên tức thì về điểm khôi phục thời gian thực (PITR) trước khi chạy lệnh | Xung đột khóa giao dịch nếu chạy vào giờ cao điểm; thiếu dung lượng lưu trữ | Viết script tự động hóa kiểm tra sức khỏe môi trường trong pipeline CI/CD trước khi kích hoạt |
| **Phase 2** | Compatibility / Expand Phase | Phase 1 PASS; công cụ migration CLI sẵn sàng | Bảng mới: `units`, `lesson_revisions`, `audit_logs`, `assessment_results`; cột mới: `lessons.unit_id`, `exercises.payload` | `TARGET_DESIGN` | Mở rộng lược đồ dạng cộng dồn (additive): tạo bảng và cột mới cho phép NULL hoặc có giá trị mặc định | Kiểm tra catalog `pg_tables` và `pg_attribute`; kiểm tra chỉ mục tạo bằng `CONCURRENTLY` | Lệnh `DROP TABLE` và `DROP COLUMN` cho các đối tượng mới tạo; khôi phục Phase 1 | Khóa bảng tạm thời khi thêm khóa ngoại; lỗi xung đột tên chỉ mục | Tuyệt đối không thêm cột `NOT NULL` mà không có giá trị `DEFAULT` trên các bảng đang vận hành |
| **Phase 3** | Data Transformation & Backfill | Phase 2 PASS; dữ liệu bảng hiện tại ổn định | `units`, `lesson_revisions`, `exercises.payload`, `assessment_results`, `profiles` | `TARGET_DESIGN` | Trích xuất dữ liệu bài học hiện tại sang các Unit mặc định (Unit 1..6); tạo bản ghi revision đầu tiên cho các bài học đã xuất bản | Truy vấn đối soát: 100% bài học có `unit_id` hợp lệ; 100% bài học xuất bản có revision tương ứng | Lệnh `TRUNCATE` các bảng phụ trợ mới; đặt giá trị các cột mới trỏ về NULL | Giao dịch cập nhật lớn làm tràn WAL log; nghẽn I/O hệ số đọc/ghi | Phải chia nhỏ thành từng đợt (batching ~500 bản ghi/lượt) có độ trễ giữa các lượt |
| **Phase 4** | Role & RLS Transition | Phase 3 PASS; logic phân quyền ứng dụng sẵn sàng | `auth.users`, `profiles.role`, các chính sách Supabase RLS trên toàn bộ các bảng | `TARGET_DESIGN` | Nâng cấp trường vai trò từ 2 vai trò (`USER`, `ADMIN`) lên 6 vai trò mục tiêu; cài đặt các hàm kiểm tra RLS mới | Thực thi ma trận kiểm thử quyền với các JWT giả lập 6 vai trò; kiểm tra không có lỗ hổng bypass | Khôi phục lại chính sách RLS 2 vai trò ban đầu; hoàn nguyên trường `role` về giá trị nhị phân | Khóa nhầm quyền của nhân sự quản trị; RLS quá chặt làm đứt gãy endpoint đọc của học viên | Phải chạy song song chế độ kiểm tra kép (dual-read check) trên staging trước khi kích hoạt chính thức |
| **Phase 5** | Application Cutover Considerations | Phase 4 PASS; bản dựng ứng dụng Phase 2 sẵn sàng | Next.js BFF Route Handlers, giao diện Admin, giao diện Learner, AI Gateway | `TARGET_DESIGN` | Chuyển hướng lưu lượng ứng dụng đọc/ghi sang cấu trúc revision và đơn vị bài học mục tiêu | Kiểm tra sức khỏe toàn diện (health checks) trên 15 luồng BF; xác nhận giao dịch đăng nhập và học tập thành công | Chuyển đổi lưu lượng (traffic flip) quay trở lại bản dựng ứng dụng legacy hỗ trợ lược đồ cũ | Cache trình duyệt giữ mã cũ; phiên kết nối WebSocket bị đứt đoạn | Áp dụng chiến lược triển khai Blue/Green hoặc Canary với tỷ lệ tăng dần 10% -> 50% -> 100% |
| **Phase 6** | Validation Checkpoints (System Audit) | Phase 5 PASS; hệ thống nhận lưu lượng thực tế | Toàn bộ các bảng nghiệp vụ, bảng audit log, kết nối AI | `TARGET_DESIGN` | Hệ thống vận hành ổn định trên môi trường mới; cơ chế ghi log kiểm toán ghi nhận đầy đủ | 100% kịch bản kiểm thử trong Test Skeleton vượt qua; nhật ký kiểm toán ghi nhận đủ 11 loại sự kiện | Kích hoạt kịch bản Phase 7 nếu phát hiện lỗi nghiêm trọng (Sev-1) ảnh hưởng đến dữ liệu | Cảnh báo sai do độ trễ mạng trong môi trường kiểm thử tự động | Chạy bộ kiểm thử tự động độc lập rà soát tính toàn vẹn dữ liệu định kỳ mỗi giờ trong 24 giờ đầu |
| **Phase 7** | Rollback Strategy & Emergency Plan | Phát hiện sự cố Sev-1 hoặc tỷ lệ lỗi API > 1% | Toàn bộ lược đồ và dữ liệu phát sinh trong quá trình chuyển đổi | `TARGET_DESIGN` | Đảo ngược có kiểm soát về trạng thái ổn định gần nhất; bảo vệ dữ liệu học tập của học viên | Chạy kịch bản hoàn nguyên dry-run; xác nhận tính sẵn sàng của bản sao lưu PITR | Trở về trạng thái Phase 1 hoặc Phase 4 tùy thuộc vào thời điểm phát hiện lỗi | Dữ liệu phát sinh mới trong giai đoạn cutover có thể bị mất nếu không có cơ chế trích xuất đệm | Mọi file migration trong Phase 2 bắt buộc phải đi kèm file hạ cấp `.down.sql` đã được kiểm thử |
| **Phase 8** | Post-Migration Cleanup (Contract Phase) | Phase 6 PASS; hệ thống vận hành ổn định tối thiểu 7 ngày | Các cột cũ không còn sử dụng, bảng ánh xạ tạm thời | `FUTURE_EXTENSION` | Thu hẹp lược đồ (Contract phase): loại bỏ các cột tạm, chỉ mục thừa và chế độ tương thích ngược | Xác nhận không còn truy vấn nào từ mã nguồn tham chiếu đến các cột cũ trong 7 ngày liên tục | Tạo lại các view giả lập tương thích ngược nếu phát hiện client cũ còn kết nối | Xóa nhầm cột còn được sử dụng bởi các báo cáo phân tích ngoại vi | Bắt buộc phải bật chế độ cảnh báo deprecation log 14 ngày trước khi thực thi xóa bỏ vật lý |

---

## 3. Output 2 — Implementation Test-Plan Skeleton

Khung kế hoạch kiểm thử này thiết lập các mẫu kịch bản kiểm thử chuẩn hóa (Test Frames) cho Phase 2. Toàn bộ các khung kiểm thử dưới đây được định danh và gắn nhãn nghiêm ngặt: **`TEST PLAN SKELETON — NOT EXECUTED`**. Tuyệt đối không giả mạo kết quả hay tuyên bố đã chạy kiểm thử.

### Danh Sách 18 Khung Kịch Bản Kiểm Thử Chuẩn Tắc (18 Mandatory Test Frames)

```text
====================================================================================================
                        TEST PLAN SKELETON — MANDATORY SCENARIO FRAMES
                            (ALL FRAMES STATUS: SKELETON — NOT EXECUTED)
====================================================================================================
```

#### Frame 1: Mapping A Raw-Score Bands (0–30)
- **Test ID:** `TEST-FRAME-MAPPING-A`
- **Mục đích:** Kiểm chứng tính tất định của thuật toán ánh xạ điểm số thô bài kiểm tra chẩn đoán (0–30 điểm) sang Đơn vị học xuất phát (Unit 1–6) theo Mapping A.
- **Tiền điều kiện:** Học viên đã xác thực; bài kiểm tra chẩn đoán được nộp với bộ câu trả lời hợp lệ.
- **Đầu vào (Input Shape):** Tập vector kiểm thử biên: `score ∈ {0, 7, 8, 12, 13, 17, 18, 22, 23, 26, 27, 30}`.
- **Kết quả kỳ vọng (Expected Result):**
  * `0 <= score <= 7`   --> `startingUnit = 1` (Beginner Foundation)
  * `8 <= score <= 12`  --> `startingUnit = 2` (Elementary Communication)
  * `13 <= score <= 17` --> `startingUnit = 3` (Pre-Intermediate Core)
  * `18 <= score <= 22` --> `startingUnit = 4` (Intermediate Transition)
  * `23 <= score <= 26` --> `startingUnit = 5` (Upper-Intermediate Fluency)
  * `27 <= score <= 30` --> `startingUnit = 6` (Advanced Mastery)
- **Điều kiện đạt (Pass Condition):** Ánh xạ chính xác 100% cho mọi điểm số biên; tuyệt đối không tạo ra nhãn chứng chỉ CEFR hay điểm quy đổi ngoài dải 1–6.
- **Hệ quả an ninh:** Ngăn chặn việc học viên tự ý gửi điểm số bất hợp pháp để nhảy cóc cấp độ trái phép.
- **Tầng mục tiêu:** Domain Assessment Engine / BFF Service Layer (COMP-APP-01 -> `COMP-DOM-03: Assessment & Diagnostic Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/assessment/test_mapping_a.py`.

#### Frame 2: Skip Diagnostic -> Default Unit 1
- **Test ID:** `TEST-FRAME-DIAG-SKIP`
- **Mục đích:** Kiểm chứng hành vi khi học viên chọn "Bỏ qua bài kiểm tra chẩn đoán" (Skip Diagnostic).
- **Tiền điều kiện:** Học viên mới tạo tài khoản, chưa từng làm bài chẩn đoán.
- **Đầu vào (Input Shape):** Yêu cầu (cú pháp route minh họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: `POST /api/assessment/placement/skip`) kèm JWT hợp lệ của học viên.
- **Kết quả kỳ vọng (Expected Result):** Hệ thống gán `startingUnit = 1` và trạng thái `UNVERIFIED` cho hồ sơ học viên. Tuyệt đối KHÔNG tạo bản ghi `AssessmentResult`, KHÔNG khởi tạo `SkillProfile`, và KHÔNG xác lập `verifiedProficiency` (phát sinh đúng 0 AssessmentResult, 0 SkillProfile khi chọn Skip theo chuẩn Canonical M2.2 Branch A).
- **Điều kiện đạt (Pass Condition):** Học viên được định tuyến chính xác vào Bài 1 của Unit 1 với trạng thái `UNVERIFIED`; số lượng bản ghi `assessment_results` và `skill_profiles` của học viên bằng 0.
- **Hệ quả an ninh:** Đảm bảo học viên không có kết quả kiểm tra không thể truy cập các bài học nâng cao mà chưa được kiểm định.
- **Tầng mục tiêu:** BFF Route Handler & Assessment Service (COMP-APP-01 -> `COMP-DOM-03: Assessment & Diagnostic Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/integration/api/test_placement_skip.py`.

#### Frame 3: Diagnostic Retake -> New Immutable AssessmentResult
- **Test ID:** `TEST-FRAME-DIAG-RETAKE`
- **Mục đích:** Kiểm chứng tính bất biến của lịch sử chẩn đoán khi học viên thực hiện thi lại từ màn hình hồ sơ cá nhân.
- **Tiền điều kiện:** Học viên đã có bản ghi chẩn đoán ban đầu `AssessmentResult_1` trong cơ sở dữ liệu.
- **Đầu vào (Input Shape):** Yêu cầu (cú pháp route minh họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: `POST /api/assessment/placement/submit`) lần thứ 2 với bộ câu trả lời mới (`score = 20`).
- **Kết quả kỳ vọng (Expected Result):** Tạo ra một bản ghi mới `AssessmentResult_2` với UUID mới và `completedAt` thời gian thực; bản ghi `AssessmentResult_1` giữ nguyên vẹn; chuỗi chuyển hóa năng lực bất biến được thực thi: `AssessmentResult_2` -> `SkillProfile` (cập nhật kỹ năng và `verifiedProficiency`) -> `curriculumStartingPoint = 4` -> cập nhật trường `profiles.verified_starting_unit = 4`.
- **Điều kiện đạt (Pass Condition):** Tồn tại 2 bản ghi độc lập trong bảng `assessment_results` cho cùng `userId`; bản ghi cũ không bị sửa đổi hay ghi đè.
- **Hệ quả an ninh:** Bảo tồn tính toàn vẹn dữ liệu kiểm toán và lịch sử học tập của người dùng.
- **Tầng mục tiêu:** Database RLS & Assessment Service (COMP-APP-01 -> `COMP-DOM-03: Assessment & Diagnostic Domain Service`, `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/integration/database/test_assessment_immutable.py`.

#### Frame 4: Jump Challenge Pass Threshold (>=95%)
- **Test ID:** `TEST-FRAME-JUMP-PASS`
- **Mục đích:** Kiểm chứng ngưỡng vượt qua thử thách nhảy cóc đơn vị học (Jump Challenge) phải đạt chính xác từ 95% trở lên.
- **Tiền điều kiện:** Học viên đủ điều kiện làm bài Jump; không bị vướng thời gian hồi chiêu (cooldown).
- **Đầu vào (Input Shape):** Vector kiểm thử: Trường hợp A (`score = 94.9%`), Trường hợp B (`score = 95.0%`).
- **Kết quả kỳ vọng (Expected Result):** Trường hợp A nhận kết quả không đạt (`isPassed = false`), đơn vị học tiếp theo vẫn khóa; Trường hợp B nhận kết quả đạt (`isPassed = true`), mở khóa đơn vị học mục tiêu.
- **Điều kiện đạt (Pass Condition):** So sánh số thực chính xác tuyệt đối `score >= 0.9500`; không làm tròn điểm từ 94.9% lên 95%.
- **Hệ quả an ninh:** Ngăn chặn gian lận vượt cấp độ học tập khi chưa đạt chuẩn năng lực khắt khe.
- **Tầng mục tiêu:** Progression & Assessment Service Layer (COMP-APP-01 -> `COMP-DOM-03: Assessment & Diagnostic Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/learning/test_jump_threshold.py`.

#### Frame 5: Jump Challenge Cooldown Enforcement (24 Hours)
- **Test ID:** `TEST-FRAME-JUMP-COOLDOWN`
- **Mục đích:** Kiểm chứng việc áp dụng bắt buộc thời gian hồi chiêu 24 giờ sau khi làm bài Jump thất bại.
- **Tiền điều kiện:** Học viên vừa làm bài Jump không đạt tại thời điểm `T0`.
- **Đầu vào (Input Shape):** Yêu cầu làm bài Jump mới tại thời điểm `T0 + 23h 59m` và thời điểm `T0 + 24h 01m`.
- **Kết quả kỳ vọng (Expected Result):** Yêu cầu tại `T0 + 23h 59m` bị từ chối với mã lỗi `429 / 403 JUMP_COOLDOWN_ACTIVE`; yêu cầu tại `T0 + 24h 01m` được chấp thuận khởi tạo phiên làm bài.
- **Điều kiện đạt (Pass Condition):** Thời gian hồi chiêu được tính toán dựa trên đồng hồ máy chủ cơ sở dữ liệu UTC, không phụ thuộc vào đồng hồ client.
- **Hệ quả an ninh:** Chống tấn công thử - sai (brute-force) để đoán đáp án câu hỏi bài Jump.
- **Tầng mục tiêu:** Assessment & Progression Service Layer (COMP-APP-01 -> `COMP-DOM-03: Assessment & Diagnostic Domain Service`, `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/integration/learning/test_jump_cooldown.py`.

#### Frame 6: Jump Challenge != Unit Completion
- **Test ID:** `TEST-FRAME-JUMP-NON-COMPLETION`
- **Mục đích:** Kiểm chứng nguyên tắc: Vượt qua bài Jump chỉ mở khóa đơn vị tiếp theo, TUYỆT ĐỐI KHÔNG đánh dấu các bài học bị nhảy qua là đã hoàn thành (`COMPLETED`).
- **Tiền điều kiện:** Học viên ở Unit 1 thực hiện Jump thành công sang Unit 2.
- **Đầu vào (Input Shape):** Truy vấn trạng thái tiến độ học tập thực thể `LearningProgress` của các bài học trong Unit 1 sau khi Jump thành công.
- **Kết quả kỳ vọng (Expected Result):** Đơn vị học Unit 2 chuyển sang trạng thái khả dụng (`AVAILABLE`); các bài học chưa học trong Unit 1 được đánh dấu cờ `by_jump = true` (hoặc trạng thái `SKIPPED_BY_JUMP`), tuyệt đối không chuyển sang `COMPLETED`; số lượng bài học hoàn thành không tăng thêm.
- **Điều kiện đạt (Pass Condition):** `LearningProgress.status != 'COMPLETED'` và cờ `by_jump = true` (hoặc trạng thái `SKIPPED_BY_JUMP`) cho mọi bài học bị nhảy qua trong Unit 1; không phát sinh bản ghi hoàn thành giả mạo.
- **Hệ quả an ninh:** Đảm bảo tính trung thực của dữ liệu tiến độ và các chứng chỉ học tập sau này.
- **Tầng mục tiêu:** Domain Progression Model (COMP-APP-01 -> `COMP-DOM-02: Curriculum & Progression Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/learning/test_jump_progression_integrity.py`.

#### Frame 7: Controlled Retry Allowance (`max(1, floor(N * 0.10))` Per Lesson Attempt)
- **Test ID:** `TEST-FRAME-RETRY-ALLOWANCE`
- **Mục đích:** Kiểm chứng hạn mức làm lại bài tập có kiểm soát (Controlled Retry) được tính toán theo từng lượt làm bài học (Per Lesson Attempt/Context) với công thức chuẩn tắc `allowance = max(1, floor(N * 0.10))` (trong đó N là tổng số bài tập trong bài học), tuyệt đối KHÔNG phải là hạn ngạch gộp hàng ngày (daily global pool) và KHÔNG đặt lại theo ranh giới nửa đêm.
- **Tiền điều kiện:** Học viên đang thực hiện một lượt làm bài học (Lesson Attempt) có N bài tập (ví dụ: N = 15 bài tập -> allowance = max(1, floor(1.5)) = 1 lượt; N = 25 bài tập -> allowance = 2 lượt).
- **Đầu vào (Input Shape):** Học viên gửi yêu cầu làm lại bài tập thứ k trong cùng một lượt học vượt quá số lượt `allowance` được tính theo N.
- **Kết quả kỳ vọng (Expected Result):** Các yêu cầu làm lại trong hạn mức `allowance` của lượt học được chấp nhận; yêu cầu làm lại thứ `(allowance + 1)` bị từ chối với mã lỗi `403 RETRY_ALLOWANCE_EXCEEDED`.
- **Điều kiện đạt (Pass Condition):** Công thức `allowance = max(1, floor(N * 0.10))` được tính toán chính xác trên phạm vi từng lượt bài học (per attempt); không dùng bộ đếm gộp theo ngày và không phụ thuộc vào đồng hồ nửa đêm.
- **Hệ quả an ninh:** Ngăn chặn hành vi lạm dụng làm lại vô hạn để farm điểm hoặc ghi nhớ đáp án trong một bài học.
- **Tầng mục tiêu:** Lesson Execution Service Layer (COMP-APP-01 -> `COMP-DOM-05: Lesson Execution & Controlled Retry Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/learning/test_retry_allowance.py`.

#### Frame 8: Controlled Retry 70% Score Credit Cap
- **Test ID:** `TEST-FRAME-RETRY-CREDIT`
- **Mục đích:** Kiểm chứng việc ghi nhận điểm số khi làm lại bài tập chỉ được tính tối đa 70% giá trị điểm cơ bản.
- **Tiền điều kiện:** Bài tập làm sai ở lượt đầu (0 điểm); được làm lại thành công trong lượt thứ hai.
- **Đầu vào (Input Shape):** Câu trả lời đúng nộp ở lượt làm lại cho bài tập có điểm cơ sở là 10 điểm.
- **Kết quả kỳ vọng (Expected Result):** Điểm ghi nhận thực tế (`effectiveScore`) đạt tối đa `10 * 0.70 = 7.0` điểm; cờ `isRetry = true` được lưu vào bản ghi kết quả.
- **Điều kiện đạt (Pass Condition):** `effectiveScore == rawScore * 0.70`; không bao giờ vượt quá trần 70%.
- **Hệ quả an ninh:** Đảm bảo tính công bằng giữa học viên làm đúng ngay lần đầu và học viên làm lại.
- **Tầng mục tiêu:** Scoring Engine (COMP-APP-01 -> `COMP-DOM-05: Lesson Execution & Controlled Retry Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/learning/test_retry_credit.py`.

#### Frame 9: SRS Deterministic Intervals `[1, 3, 7, 14, 30]` (Policy B)
- **Test ID:** `TEST-FRAME-SRS-POLICY-B`
- **Mục đích:** Kiểm chứng chu kỳ lặp lại ngắt quãng (SRS) tuân thủ nghiêm ngặt mảng số nguyên tất định theo Policy B mà không bị can thiệp bởi mô hình AI.
- **Tiền điều kiện:** Thẻ từ vựng nằm trong hàng đợi ôn tập SRS của học viên.
- **Đầu vào (Input Shape):** Chuỗi phản hồi đúng liên tiếp qua 5 cấp độ ôn tập (`Stage 0 -> 1 -> 2 -> 3 -> 4 -> 5`).
- **Kết quả kỳ vọng (Expected Result):** Lần ôn tập tiếp theo được lên lịch chính xác sau: `+1 ngày`, `+3 ngày`, `+7 ngày`, `+14 ngày`, `+30 ngày`. Nếu trả lời sai ở bất kỳ giai đoạn nào, cấp độ bị reset về `Stage 1` (+1 ngày).
- **Điều kiện đạt (Pass Condition):** Các giá trị khoảng cách ngày khớp chính xác với mảng hằng số `[1, 3, 7, 14, 30]`; không có sai số hoặc điều chỉnh động ngẫu nhiên.
- **Hệ quả an ninh:** Độc lập hoàn toàn với microservice AI; chống thao túng lịch ôn tập từ phía client.
- **Tầng mục tiêu:** SRS Scheduling Service (COMP-APP-01 -> `COMP-DOM-04: Spaced Repetition (SRS) Scheduling Domain Service`, `COMP-INFRA-03: Stored Procedure / RPC Execution Engine`).
- **Vị trí bằng chứng tương lai:** `tests/unit/srs/test_srs_policy_b.py`.

#### Frame 10: Streak Calculation Local Timezone Boundary
- **Test ID:** `TEST-FRAME-STREAK-TIMEZONE`
- **Mục đích:** Kiểm chứng chuỗi ngày học liên tục (Streak) được tính toán chính xác theo múi giờ IANA đã đăng ký của học viên thay vì đồng hồ máy chủ UTC.
- **Tiền điều kiện:** Học viên đăng ký múi giờ `Asia/Ho_Chi_Minh` (UTC+7).
- **Đầu vào (Input Shape):** Bài học hoàn thành lúc `23:30 UTC` ngày `2026-09-26` (tương ứng `06:30 UTC+7` ngày `2026-09-27`).
- **Kết quả kỳ vọng (Expected Result):** Hệ thống ghi nhận tiến độ thuộc ngày dương lịch `2026-09-27` theo giờ Việt Nam; duy trì hoặc gia tăng chuỗi cho ngày `2026-09-27`.
- **Điều kiện đạt (Pass Condition):** Ngày học được quy đổi chuẩn xác qua thư viện múi giờ chuẩn; không bị tính sai ngày do chênh lệch múi giờ.
- **Hệ quả an ninh:** Chống mất chuỗi oan do máy chủ chạy giờ UTC; tăng tính tin cậy của hệ thống.
- **Tầng mục tiêu:** Profile & Engagement Service (COMP-APP-01 -> `COMP-DOM-01: Auth & Identity Domain Service`, `COMP-DOM-02: Curriculum & Progression Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/engagement/test_streak_timezone.py`.

#### Frame 11: Streak Inactivity Reset to 1
- **Test ID:** `TEST-FRAME-STREAK-RESET`
- **Mục đích:** Kiểm chứng hành vi đặt lại chuỗi học tập về 1 khi học viên bỏ lỡ một ngày học (hệ thống MVP không hỗ trợ tính năng cứu chuỗi / streak freeze).
- **Tiền điều kiện:** Học viên học ngày `D`; không học ngày `D+1`.
- **Đầu vào (Input Shape):** Hoàn thành bài học vào ngày `D+2`.
- **Kết quả kỳ vọng (Expected Result):** Chuỗi hiện tại (`currentStreak`) được đặt lại bằng `1`; chuỗi kỷ lục (`longestStreak`) được bảo lưu nguyên vẹn nếu lớn hơn 1.
- **Điều kiện đạt (Pass Condition):** `currentStreak == 1`; không có bất kỳ ngoại lệ nào khôi phục chuỗi cũ trong phạm vi MVP.
- **Hệ quả an ninh:** Chống gian lận chuỗi ngày học; bảo đảm tính trung thực của cơ chế gamification.
- **Tầng mục tiêu:** Engagement Service (COMP-APP-01 -> `COMP-DOM-02: Curriculum & Progression Domain Service`).
- **Vị trí bằng chứng tương lai:** `tests/unit/engagement/test_streak_reset.py`.

#### Frame 12: Six-Role Authorization Matrix Walkthrough
- **Test ID:** `TEST-FRAME-ROLE-AUTH-MATRIX`
- **Mục đích:** Kiểm chứng tính tuân thủ ma trận phân quyền trên toàn bộ 6 vai trò chuẩn tắc (Administrator, Lesson Creator, Moderator, Operations Staff, Learner, Organizational Manager).
- **Tiền điều kiện:** Phiên xác thực hợp lệ được thiết lập cho từng vai trò trong 6 vai trò.
- **Đầu vào (Input Shape):** Thực hiện duyệt tuần tự 15 nhóm thao tác nghiệp vụ (OP-01 đến OP-15) với từng token đại diện cho từng vai trò.
- **Kết quả kỳ vọng (Expected Result):** Các thao tác được cấp phép hoặc từ chối chính xác tuyệt đối theo bảng phân quyền M2.4 Artifact #16.
- **Điều kiện đạt (Pass Condition):** Toàn bộ các yêu cầu trái phép đều trả về mã lỗi `403 Forbidden`; không có lỗ hổng leo thang đặc quyền.
- **Hệ quả an ninh:** Cốt lõi của mô hình bảo mật RBAC và phân tách người dùng trong hệ thống.
- **Tầng mục tiêu:** BFF API Gateway & Supabase RLS (COMP-APP-01 / COMP-APP-02 & `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_rbac_matrix.py`.

#### Frame 13: Cross-User RLS Isolation
- **Test ID:** `TEST-FRAME-RLS-ISOLATION`
- **Mục đích:** Kiểm chứng chính sách Row Level Security (RLS) của cơ sở dữ liệu ngăn chặn hoàn toàn việc Người dùng A đọc hoặc sửa đổi dữ liệu của Người dùng B.
- **Tiền điều kiện:** Người dùng A và Người dùng B cùng tồn tại trong hệ thống với các bản ghi tiến độ và hồ sơ độc lập.
- **Đầu vào (Input Shape):** Người dùng A gửi truy vấn trực tiếp qua PostgREST (`SELECT`, `UPDATE`, `DELETE`) nhắm vào UUID của Người dùng B.
- **Kết quả kỳ vọng (Expected Result):** Lệnh `SELECT` trả về tập kết quả rỗng (0 bản ghi); lệnh `UPDATE/DELETE` không tác động đến bất kỳ dòng dữ liệu nào.
- **Điều kiện đạt (Pass Condition):** Cách ly dữ liệu hoàn toàn ở tầng cơ sở dữ liệu ngay cả khi ứng dụng BFF bị bypass hoặc tấn công BOLA.
- **Hệ quả an ninh:** Phòng vệ theo chiều sâu (defense-in-depth) bảo vệ quyền riêng tư người dùng.
- **Tầng mục tiêu:** Supabase PostgreSQL Row Level Security (`COMP-INFRA-01: PostgreSQL Relational Database Engine` & `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_rls_isolation.py`.

#### Frame 14: Lesson Creator Self-Review Denial
- **Test ID:** `TEST-FRAME-SOD-SELF-REVIEW`
- **Mục đích:** Kiểm chứng nguyên tắc Phân tách Nhiệm vụ (SoD): Người biên soạn bài học (Lesson Creator) không được phép tự phê duyệt bài học do chính mình tạo ra.
- **Tiền điều kiện:** Creator #1 tạo bản thảo bài học `Revision_1` và nộp yêu cầu duyệt bài.
- **Đầu vào (Input Shape):** Creator #1 gửi yêu cầu (cú pháp route minh họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: `POST /api/content/review/{revisionId}`) với quyết định phê duyệt (`APPROVED`).
- **Kết quả kỳ vọng (Expected Result):** Hệ thống từ chối yêu cầu với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_SELF_REVIEW`); ghi nhận vi phạm phân tách nhiệm vụ vào log an ninh ứng dụng; không chuyển đổi trạng thái bài học.
- **Điều kiện đạt (Pass Condition):** Trạng thái bài học không thay đổi; giao dịch bị hủy bỏ; nhật ký ghi nhận ID của Creator vi phạm.
- **Hệ quả an ninh:** Đảm bảo quy trình kiểm duyệt nội dung độc lập, không bị lạm quyền.
- **Tầng mục tiêu:** BFF Content Review Service & Database Trigger (COMP-APP-02 -> `COMP-DOM-06: Content Lifecycle & Moderation Domain Service`, `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_sod_self_review.py`.

#### Frame 15: Moderator Publish Denial
- **Test ID:** `TEST-FRAME-SOD-MODERATOR-PUBLISH`
- **Mục đích:** Kiểm chứng nguyên tắc Phân tách Nhiệm vụ (SoD): Người kiểm duyệt (Moderator) chỉ có quyền phê duyệt nội dung, TUYỆT ĐỐI KHÔNG có quyền xuất bản bài học ra môi trường học tập.
- **Tiền điều kiện:** Bản thảo bài học đang ở trạng thái đã duyệt (`APPROVED`).
- **Đầu vào (Input Shape):** Moderator gửi yêu cầu (cú pháp route minh họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: `POST /api/content/publish/{revisionId}`).
- **Kết quả kỳ vọng (Expected Result):** Hệ thống từ chối yêu cầu với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_MODERATOR_PUBLISH`).
- **Điều kiện đạt (Pass Condition):** Bài học giữ nguyên trạng thái `APPROVED`; không hiển thị cho học viên; quyền xuất bản chỉ thuộc về Manager hoặc Admin khẩn cấp.
- **Hệ quả an ninh:** Ngăn ngừa việc đưa nội dung trực tiếp ra môi trường production mà thiếu sự kiểm soát của cấp quản lý tổ chức.
- **Tầng mục tiêu:** BFF Authorization Middleware & Database RLS (COMP-APP-02 -> `COMP-DOM-06: Content Lifecycle & Moderation Domain Service`, `COMP-INFRA-02: Row Level Security (RLS) Policy Engine`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_sod_moderator_publish.py`.

#### Frame 16: Admin Emergency Publish Constraints
- **Test ID:** `TEST-FRAME-ADMIN-EMERGENCY-PUBLISH`
- **Mục đích:** Kiểm chứng các ràng buộc nghiêm ngặt khi Quản trị viên (Administrator) thực hiện quyền xuất bản khẩn cấp: Chỉ áp dụng trên bài học đã `APPROVED`, bắt buộc cung cấp lý do giải trình, và ghi nhật ký kiểm toán chuẩn tắc `CONTENT_EMERGENCY_PUB`.
- **Tiền điều kiện:** Admin đăng nhập hợp lệ. Kịch bản kiểm thử:
  * Kịch bản A: Bài học đang ở trạng thái `IN_REVIEW`.
  * Kịch bản B: Bài học đang ở trạng thái `APPROVED` nhưng không có lý do giải trình (`reason` rỗng hoặc null).
  * Kịch bản C: Bài học đang ở trạng thái `APPROVED` kèm lý do giải trình hợp lệ (`reason` đầy đủ).
- **Đầu vào (Input Shape):** Yêu cầu xuất bản khẩn cấp (cú pháp route minh họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]: `POST /api/admin/content/emergency-publish`) tương ứng cho 3 kịch bản A, B, C.
- **Kết quả kỳ vọng (Expected Result):** Kịch bản A bị từ chối với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_EMERGENCY_UNAPPROVED` [M2.6 DESIGN ADDITION] — không được phép xuất bản khẩn cấp từ `IN_REVIEW`); Kịch bản B bị từ chối với mã lỗi `403 Forbidden` (`403 SOD_VIOLATION_MISSING_JUSTIFICATION` [M2.6 DESIGN ADDITION] — thiếu lý do giải trình bắt buộc); Kịch bản C thành công, chuyển bài học sang `PUBLISHED`, và ghi nhận nhật ký kiểm toán chuẩn tắc `CONTENT_EMERGENCY_PUB`.
- **Điều kiện đạt (Pass Condition):** Tuyệt đối không thể xuất bản khẩn cấp bài học chưa qua phê duyệt; trả về đúng mã lỗi `403 Forbidden`; nhật ký kiểm toán ghi nhận đầy đủ `actor_id` (admin), `action = CONTENT_EMERGENCY_PUB`, `target_id` (lesson revision), và `metadata.reason`.
- **Hệ quả an ninh:** Loại bỏ cửa sau (backdoor) xuất bản nội dung chưa kiểm định nhưng vẫn duy trì năng lực xử lý sự cố có trách nhiệm giải trình.
- **Tầng mục tiêu:** Admin BFF & Audit Emission (COMP-APP-02 -> `COMP-DOM-06: Content Lifecycle & Moderation Domain Service`, `COMP-DOM-07: Admin Governance & Security Audit Domain Service` -> `COMP-INFRA-05: Immutable Security Audit Log Store`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_admin_emergency_publish.py`.

#### Frame 17: GEC Service 8.0s Timeout and Graceful Fallback
- **Test ID:** `TEST-FRAME-GEC-TIMEOUT-FALLBACK`
- **Mục đích:** Kiểm chứng ranh giới tích hợp AI: Mọi yêu cầu chấm bài ngữ pháp (GEC) bắt buộc phải có thời gian chờ tối đa 8.0 giây và cơ chế xử lý dự phòng (fallback) không làm treo luồng học tập.
- **Tiền điều kiện:** Học viên làm bài tập tự luận ngữ pháp cần AI chấm điểm.
- **Đầu vào (Input Shape):** Giả lập microservice AI phản hồi chậm trễ (> 8.0 giây) hoặc trả về mã lỗi HTTP 500.
- **Kết quả kỳ vọng (Expected Result):** BFF ngắt kết nối tại đúng mốc thời gian 8.0 giây; trả về thông báo phản hồi dự phòng cho học viên (ghi nhận bài nộp, chuyển trạng thái chấm sau hoặc phản hồi luật cơ sở); giao diện người dùng không bị đóng băng.
- **Điều kiện đạt (Pass Condition):** Thời gian chờ tối đa `<= 8.0s`; không có ngoại lệ làm sập tiến trình BFF; lỗi kết nối AI được ghi log an toàn.
- **Hệ quả an ninh:** Chống tấn công từ chối dịch vụ (DoS) và cạn kiệt tài nguyên máy chủ do các lời gọi AI bị treo.
- **Tầng mục tiêu:** AI Integration Client / BFF Route Handler (COMP-APP-01 -> `COMP-DOM-08: AI Integration & Proxy Domain Service` -> `COMP-EXT-02: Stateless AI Compute Service (lingora-ai)`).
- **Vị trí bằng chứng tương lai:** `tests/integration/ai/test_gec_timeout_fallback.py`.

#### Frame 18: AI Microservice Non-Ownership of Learner State
- **Test ID:** `TEST-FRAME-AI-NON-OWNERSHIP`
- **Mục đích:** Kiểm chứng nguyên tắc bất biến: Microservice AI là dịch vụ phi trạng thái (stateless) và TUYỆT ĐỐI KHÔNG sở hữu, không đọc/ghi trực tiếp vào cơ sở dữ liệu tiến độ hay hồ sơ học viên.
- **Tiền điều kiện:** Container AI vận hành độc lập trong Zone 4.
- **Đầu vào (Input Shape):** Kiểm tra cấu hình môi trường container AI và phân tích các luồng mạng từ Zone 4.
- **Kết quả kỳ vọng (Expected Result):** Container AI không chứa chuỗi kết nối (connection string) đến Supabase Postgres; không có secret dịch vụ quản trị; chỉ nhận chuỗi văn bản thuần túy và trả về phân tích cú pháp JSON tạm thời.
- **Điều kiện đạt (Pass Condition):** Zero kết nối trực tiếp từ Zone 4 vào Zone 3; mọi cập nhật tiến độ học viên do BFF trong Zone 2 thực hiện sau khi xác thực dữ liệu.
- **Hệ quả an ninh:** Ngăn chặn nguy cơ tấn công prompt injection hoặc chiếm quyền container AI làm lộ lọt hay phá hoại dữ liệu học tập cốt lõi.
- **Tầng mục tiêu:** Kiến trúc mạng và hạ tầng (Zone 4 vs Zone 3 / `COMP-EXT-02: Stateless AI Compute Service` vs `COMP-INFRA-01: PostgreSQL Relational Database Engine`).
- **Vị trí bằng chứng tương lai:** `tests/security/test_ai_network_isolation.py`.

---

## 4. Output 3 — API Dependency Register

Danh mục này phân loại toàn diện mọi bề mặt giao diện lập trình ứng dụng (API Surfaces) của hệ thống Lingora thành **4 tầng trạng thái chuẩn tắc**, đồng thời đối chiếu nghiêm ngặt với hợp đồng dịch vụ AI `docs/03-api-contract.md` (giữ nguyên trạng thái byte-identical).

### 4.1. Quy Ước 4 Tầng Trạng Thái API & Thông Báo Cú Pháp Route Minh Họa:
1. `CURRENT_APPLIED`: Bề mặt API đã tồn tại và vận hành trên mã nguồn hiện tại.
2. `TARGET_DESIGN`: Bề mặt API đã được phê duyệt trong thiết kế kiến trúc Phase 1, sẵn sàng để triển khai trong Phase 2.
3. `FUTURE_EXTENSION`: Bề mặt API mở rộng dành cho các tính năng hậu MVP (như Quản lý Nhóm học Cohort, Ticket hỗ trợ).
4. `COMPATIBILITY_GAP`: Bề mặt API có sự sai lệch giữa triển khai hiện tại và thiết kế mục tiêu, cần chuyển đổi trong Phase 2.

> **Thông Báo Về Cú Pháp Route Minh Họa [ILLUSTRATIVE ROUTE EXAMPLE — NOT LOCKED]:**  
> Toàn bộ các chuỗi định dạng đường dẫn URL cụ thể (ví dụ: `POST /api/assessment/placement/skip`, `POST /api/content/review/{revisionId}`, v.v.) xuất hiện trong các khung kịch bản kiểm thử (Test Frames) chỉ đóng vai trò là **ví dụ minh họa cú pháp kỹ thuật** nhằm hỗ trợ kỹ sư triển khai Phase 2 hình dung luồng giao tiếp, **TUYỆT ĐỐI KHÔNG phải là hợp đồng API bị khóa (Locked API Contract)**.  
> Hệ thống Lingora tuân thủ kiến trúc phân rã độc lập với framework (framework-neutral) đã được xác lập tại M2.3. Định danh giao diện chuẩn tắc và có thẩm quyền duy nhất trong quản trị hệ thống là các mã bề mặt API chuẩn tắc (`API-AUTH-*`, `API-LEARN-*`, `API-ASSESS-*`, `API-PRACT-*`, `API-AUTHZ-*`, `API-AI-*`, `API-AUDIT-*`).

### 4.2. Bảng Ánh Xạ Ranh Giới An Ninh Chuẩn Tắc (M2.4 Architecture Parity)

| Ký Hiệu Ranh Giới | Định Danh Ranh Giới Chuẩn Tắc (M2.4) | Thành Phần Sở Hữu (Component Owner) | Mô Tả Kỹ Thuật |
|---|---|---|---|
| **B1** | Boundary 1: Learner Web (BFF / Client) | `COMP-PRES-01`, `COMP-APP-01` | Giao diện học viên và Next.js BFF Route Handlers & Proxies trong `lingora-web` |
| **B2** | Boundary 2: Admin Web (BFF / Server Actions) | `COMP-PRES-02`, `COMP-APP-02` | Giao diện quản trị và Next.js Server Actions & Prisma trong `lingora-admin` |
| **B3** | Boundary 3: Supabase RLS (Database Core) | `COMP-INFRA-01..04` | PostgreSQL RLS Engine, RPC Engine, Storage Buckets |
| **B4** | Boundary 4: Privileged Service Role (Operations / Maintenance) | Zone 5 CLI / Service Role Operator | Kênh vận hành hạ tầng đặc quyền thực thi DDL migration và seed |
| **B5** | Boundary 5: AI Server (Stateless Inference) | `COMP-EXT-02` (`lingora-ai`) | Microservice FastAPI T5-small phi trạng thái, timeout 8.0s |
| **B6** | Boundary 6: Audit Store (Immutable Ledger) | `COMP-INFRA-05` (`audit_logs`) | Kho lưu trữ nhật ký kiểm toán bất biến append-only |

### 4.3. Bảng Ma Trận Phân Định Thành Phần Sở Hữu Chuẩn Tắc (Canonical Component Ownership Matrix — 29 Auditable Rows)

| API / Frame / Responsibility | M2.3 Boundary/Service | M2.4 Component ID | Canonical Component Name | Ownership Evidence |
|---|---|---|---|---|
| **TEST-FRAME-MAPPING-A** | B1 / Assessment Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-03, SEQ-04 |
| **TEST-FRAME-DIAG-SKIP** | B1 / Placement Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-03, M2.2 Branch A |
| **TEST-FRAME-DIAG-RETAKE** | B1 / Assessment Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-03, DD-06 |
| **TEST-FRAME-JUMP-PASS** | B1 / Progression Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-04, D5 |
| **TEST-FRAME-JUMP-COOLDOWN** | B1 / Progression Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-04, D5 |
| **TEST-FRAME-JUMP-NON-COMPLETION** | B1 / Progression Service | `COMP-DOM-02` | Curriculum & Progression Domain Service | M2.4 Artifact #13, SEQ-04, M2.2 |
| **TEST-FRAME-RETRY-ALLOWANCE** | B1 / Lesson Service | `COMP-DOM-05` | Lesson Execution & Controlled Retry Domain Service | M2.4 Artifact #13, SEQ-05, D7 |
| **TEST-FRAME-RETRY-CREDIT** | B1 / Scoring Service | `COMP-DOM-05` | Lesson Execution & Controlled Retry Domain Service | M2.4 Artifact #13, SEQ-05, D7 |
| **TEST-FRAME-SRS-POLICY-B** | B1 / SRS Service | `COMP-DOM-04` | Spaced Repetition (SRS) Scheduling Domain Service | M2.4 Artifact #13, SEQ-06, D8, RPC `COMP-INFRA-03` |
| **TEST-FRAME-STREAK-TIMEZONE** | B1 / Profile Service | `COMP-DOM-02` | Curriculum & Progression Domain Service | M2.4 Artifact #13, SEQ-07, `COMP-DOM-01` |
| **TEST-FRAME-STREAK-RESET** | B1 / Progression Service | `COMP-DOM-02` | Curriculum & Progression Domain Service | M2.4 Artifact #13, SEQ-07, M2.2 |
| **TEST-FRAME-ROLE-AUTH-MATRIX** | B1/B2 / AuthZ Middleware | `COMP-INFRA-02` | Row Level Security (RLS) Policy Engine | M2.4 Artifact #16, B3, `COMP-APP-01/02` |
| **TEST-FRAME-RLS-ISOLATION** | B3 / Database Engine | `COMP-INFRA-02` | Row Level Security (RLS) Policy Engine | M2.4 Artifact #16, `COMP-INFRA-01` |
| **TEST-FRAME-SOD-SELF-REVIEW** | B2 / Review Service | `COMP-DOM-06` | Content Lifecycle & Moderation Domain Service | M2.4 Artifact #13, Artifact #16, SEQ-08 |
| **TEST-FRAME-SOD-MODERATOR-PUBLISH** | B2 / Publish Service | `COMP-DOM-06` | Content Lifecycle & Moderation Domain Service | M2.4 Artifact #13, Artifact #16, SEQ-08 |
| **TEST-FRAME-ADMIN-EMERGENCY-PUBLISH** | B2 / Admin Governance | `COMP-DOM-07` | Admin Governance & Security Audit Domain Service | M2.4 Artifact #13, Artifact #16, SEQ-09, `COMP-INFRA-05` |
| **TEST-FRAME-GEC-TIMEOUT-FALLBACK** | B1 / AI Proxy Service | `COMP-DOM-08` | AI Integration & Proxy Domain Service | M2.4 Artifact #13, SEQ-10, ADR-014, `COMP-EXT-02` |
| **TEST-FRAME-AI-NON-OWNERSHIP** | B5 / AI Inference Engine | `COMP-EXT-02` | Stateless AI Compute Service (lingora-ai) | M2.4 Artifact #13, Artifact #14, ADR-014 |
| **API-AUTH (01..04)** | B1 / Auth Provider | `COMP-EXT-01` | Supabase GoTrue Authentication Provider | M2.4 Artifact #13, SEQ-01, `COMP-APP-01` |
| **API-LEARN-01** | B1 / Curriculum Service | `COMP-DOM-02` | Curriculum & Progression Domain Service | M2.4 Artifact #13, SEQ-02, `COMP-APP-01` |
| **API-LEARN-02** | B1 / Content Delivery | `COMP-DOM-05` | Lesson Execution & Controlled Retry Domain Service | M2.4 Artifact #13, SEQ-05, `COMP-APP-01` |
| **API-LEARN-03** | B1 / Execution & Progress | `COMP-DOM-05` | Lesson Execution & Controlled Retry Domain Service | M2.4 Artifact #13, SEQ-05, `COMP-DOM-02` |
| **API-ASSESS (01..05)** | B1 / Assessment Service | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | M2.4 Artifact #13, SEQ-03, SEQ-04, `COMP-APP-01` |
| **API-PRACT (01..02)** | B1 / SRS Service | `COMP-DOM-04` | Spaced Repetition (SRS) Scheduling Domain Service | M2.4 Artifact #13, SEQ-06, `COMP-INFRA-03` |
| **API-AUTHZ (01..05)** | B2 / Content Lifecycle | `COMP-DOM-06` | Content Lifecycle & Moderation Domain Service | M2.4 Artifact #13, SEQ-08, `COMP-APP-02` |
| **API-AUTHZ-06** | B2 / Emergency Governance | `COMP-DOM-07` | Admin Governance & Security Audit Domain Service | M2.4 Artifact #13, SEQ-09, `COMP-INFRA-05` |
| **API-AI (GEC-01, HLTH)** | B5 / AI Inference | `COMP-EXT-02` | Stateless AI Compute Service (lingora-ai) | M2.4 Artifact #13, SEQ-10, `COMP-DOM-08` |
| **API-AUDIT-01** | B2 / Audit Governance | `COMP-DOM-07` | Admin Governance & Security Audit Domain Service | M2.4 Artifact #13, SEQ-09, `COMP-INFRA-05` |
| **API-EXT & API-GAP** | B1/B2 / Extension & Identity | `COMP-DOM-01` | Auth & Identity Domain Service | M2.4 Artifact #13, SEQ-01, `COMP-DOM-02/07` |

### 4.4. Bảng Danh Mục Phụ Thuộc API (API Dependency Register)

| Mã API | Mục Đích Nghiệp Vụ | Ranh Giới Sở Hữu | Thành Phần Gọi (Caller) | Thành Phần / Dịch Vụ Mục Tiêu | Trạng Thái Phân Tầng | Phụ Thuộc Nghiệp Vụ | Nguồn Hợp Đồng | Mốc Triển Khai | Trạng Thái Bằng Chứng |
|---|---|---|---|---|---|---|---|---|---|
| **API-AUTH-01** | Đăng ký tài khoản người dùng mới | B1 / B3 | Trình duyệt Client / `COMP-PRES-01` | Supabase GoTrue Auth Provider (`COMP-EXT-01`) qua `COMP-APP-01` | `CURRENT_APPLIED` | Email / Password hợp lệ | `01` §3.3, `04` Data Model | Phase 2 Entry (Auth/DB Foundation) | Đã kiểm chứng trên runtime M1 |
| **API-AUTH-02** | Đăng nhập và cấp phát JWT | B1 / B3 | Trình duyệt Client / `COMP-PRES-01` | Supabase GoTrue Auth Provider (`COMP-EXT-01`) qua `COMP-APP-01` | `CURRENT_APPLIED` | Tài khoản đã kích hoạt | `01` §3.3, ADR-002 | Phase 2 Entry (Auth/DB Foundation) | Đã kiểm chứng trên runtime M1 |
| **API-AUTH-03** | Làm mới Access Token (Token Refresh) | B1 / B3 | Trình duyệt Client / `COMP-PRES-01` | Supabase GoTrue Auth Provider (`COMP-EXT-01`) qua `COMP-APP-01` | `CURRENT_APPLIED` | Refresh Token hợp lệ | `01` §3.3, ADR-002 | Phase 2 Entry (Auth/DB Foundation) | Đã kiểm chứng trên runtime M1 |
| **API-AUTH-04** | Đăng xuất và vô hiệu hóa phiên | B1 / B3 | Trình duyệt Client / `COMP-PRES-01` | Supabase GoTrue Auth Provider (`COMP-EXT-01`) qua `COMP-APP-01` | `CURRENT_APPLIED` | JWT phiên hoạt động | `01` §3.3 | Phase 2 Entry (Auth/DB Foundation) | Đã kiểm chứng trên runtime M1 |
| **API-LEARN-01** | Lấy danh sách khóa học và đơn vị bài học | B1 / B3 | Learner Portal / `COMP-PRES-01` | Curriculum & Progression Service (`COMP-DOM-02`) qua `COMP-APP-01` | `TARGET_DESIGN` | Quyền Learner; Unit đã xuất bản | `docs/04-data-model.md` | Phase 2 Core Implementation (Learning Delivery) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-LEARN-02** | Tải nội dung chi tiết bài học và bài tập | B1 / B3 | Learner Portal / `COMP-PRES-01` | Lesson Execution Service (`COMP-DOM-05`) qua `COMP-APP-01` | `TARGET_DESIGN` | Bài học ở trạng thái `PUBLISHED` | `docs/04-data-model.md`, DD-02 | Phase 2 Core Implementation (Learning Delivery) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-LEARN-03** | Nộp kết quả làm bài tập và cập nhật tiến độ | B1 / B3 | Learner Portal / `COMP-PRES-01` | Lesson Execution Service (`COMP-DOM-05`) cập nhật `COMP-DOM-02` | `TARGET_DESIGN` | JWT học viên hợp lệ; RLS cách ly; D7 allowance | `docs/04-data-model.md`, D7 | Phase 2 Core Implementation (Learning Delivery) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-ASSESS-01** | Khởi tạo phiên kiểm tra chẩn đoán năng lực | B1 / B3 | Learner Portal / `COMP-PRES-01` | Assessment & Diagnostic Service (`COMP-DOM-03`) qua `COMP-APP-01` | `TARGET_DESIGN` | Học viên chưa hoàn thành chẩn đoán | `docs/09-placement-and-jump-specification.md` | Phase 2 Core Implementation (Assessment Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-ASSESS-02** | Nộp bài chẩn đoán và tính Unit xuất phát | B1 / B3 | Learner Portal / `COMP-PRES-01` | Assessment & Diagnostic Service (`COMP-DOM-03`) qua `COMP-APP-01` | `TARGET_DESIGN` | ~25–30 câu hỏi theo thiết kế; thang điểm thô 0–30 theo Mapping A | `docs/09`, DD-06 | Phase 2 Core Implementation (Assessment Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-ASSESS-03** | Bỏ qua bài chẩn đoán (Skip Diagnostic) | B1 / B3 | Learner Portal / `COMP-PRES-01` | Assessment & Diagnostic Service (`COMP-DOM-03`) qua `COMP-APP-01` | `TARGET_DESIGN` | Branch A Skip; 0 AssessmentResult, 0 SkillProfile | `docs/09`, D6 | Phase 2 Core Implementation (Assessment Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-ASSESS-04** | Khởi tạo thử thách nhảy cóc (Jump Challenge) | B1 / B3 | Learner Portal / `COMP-PRES-01` | Assessment & Diagnostic Service (`COMP-DOM-03`) qua `COMP-APP-01` | `TARGET_DESIGN` | Đơn vị liền kề (D5); đã hết thời gian 24h hồi chiêu | `docs/09`, D5 | Phase 2 Core Implementation (Assessment Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-ASSESS-05** | Nộp bài Jump và đánh giá điều kiện vượt cấp | B1 / B3 | Learner Portal / `COMP-PRES-01` | Assessment & Diagnostic Service (`COMP-DOM-03`) qua `COMP-APP-01` | `TARGET_DESIGN` | Điểm số đạt `>= 95.0%`; không đánh dấu hoàn thành Unit | `docs/09`, D5 | Phase 2 Core Implementation (Assessment Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-PRACT-01** | Lấy hàng đợi từ vựng ôn tập ngắt quãng SRS | B1 / B3 | Learner Portal / `COMP-PRES-01` | SRS Scheduling Service (`COMP-DOM-04`) qua `COMP-APP-01` | `TARGET_DESIGN` | Thẻ từ đến hạn ôn tập | `01` §3.5, D8 | Phase 2 Core Implementation (SRS Practice Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-PRACT-02** | Ghi nhận phản hồi đánh giá thẻ SRS | B1 / B3 | Learner Portal / `COMP-PRES-01` | SRS Scheduling Service (`COMP-DOM-04`) gọi RPC `COMP-INFRA-03` | `TARGET_DESIGN` | Policy B `[1, 3, 7, 14, 30]` | `01` §3.5, D8 | Phase 2 Core Implementation (SRS Practice Engine) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-01** | Lấy danh sách bài học phân công biên soạn | B2 / B3 | Admin / Creator / `COMP-PRES-02` | Content Lifecycle & Moderation Service (`COMP-DOM-06`) qua `COMP-APP-02` | `TARGET_DESIGN` | Quyền Lesson Creator | `01` §3.4, DD-04 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-02** | Tạo và cập nhật bản thảo bài học (Draft) | B2 / B3 | Admin / Creator / `COMP-PRES-02` | Content Lifecycle & Moderation Service (`COMP-DOM-06`) qua `COMP-APP-02` | `TARGET_DESIGN` | Creator được phân công bài đó (`assigned_creator_id`) | `docs/04`, DD-02, D1 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-03** | Nộp bản thảo bài học lên hàng đợi kiểm duyệt | B2 / B3 | Admin / Creator / `COMP-PRES-02` | Content Lifecycle & Moderation Service (`COMP-DOM-06`) qua `COMP-APP-02` | `TARGET_DESIGN` | Trạng thái chuyển `IN_REVIEW` | `01` §3.4, DD-02 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-04** | Phê duyệt hoặc từ chối bản thảo bài học | B2 / B3 | Admin / Moderator / `COMP-PRES-02` | Content Lifecycle & Moderation Service (`COMP-DOM-06`) qua `COMP-APP-02` | `TARGET_DESIGN` | Quyền Moderator; không tự duyệt (SoD) | `01` §3.4, D2 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-05** | Xuất bản bài học ra môi trường học tập | B2 / B3 | Admin / Manager / `COMP-PRES-02` | Content Lifecycle & Moderation Service (`COMP-DOM-06`) qua `COMP-APP-02` | `TARGET_DESIGN` | Quyền Manager; bài đã `APPROVED` | `01` §3.4, D2 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AUTHZ-06** | Xuất bản bài học khẩn cấp (Emergency) | B2 / B3 / B6 | Admin Portal / `COMP-PRES-02` | Admin Governance & Audit Service (`COMP-DOM-07`) phát thải `COMP-INFRA-05` | `TARGET_DESIGN` | Quyền Administrator; kèm lý do (SoD) | `01` §3.4, M2.4 | Phase 2 Core Implementation (Content Authoring) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-AI-GEC-01** | Phân tích và chấm lỗi ngữ pháp tự luận | B1 -> B5 | Trusted BFF Proxy / `COMP-APP-01` | Stateless AI Compute Service (`COMP-EXT-02` Zone 4) qua `COMP-DOM-08` | `TARGET_DESIGN` | Timeout 8.0s; có fallback luật cơ sở | `docs/03-api-contract.md` §3 | Phase 2 Core Implementation (AI Service Integration) | Hợp đồng 03 byte-identical |
| **API-AI-HLTH** | Kiểm tra trạng thái sức khỏe dịch vụ AI | B1 -> B5 | Trusted BFF Proxy / `COMP-APP-01` | Stateless AI Compute Service (`COMP-EXT-02` Zone 4) qua `COMP-DOM-08` | `TARGET_DESIGN` | Endpoint `/health` | `docs/03-api-contract.md` §2 | Phase 2 Core Implementation (AI Service Integration) | Hợp đồng 03 byte-identical |
| **API-AUDIT-01** | Truy vấn nhật ký kiểm toán hệ thống | B2 / B3 / B6 | Admin Portal / `COMP-PRES-02` | Admin Governance & Audit Service (`COMP-DOM-07`) đọc `COMP-INFRA-05` | `TARGET_DESIGN` | Quyền Administrator / Staff; truy vấn 11 audit events | `01` §3.8, DD-03 | Phase 2 Core Implementation (Audit & Security) | Đặc tả thiết kế mục tiêu hoàn tất / chờ triển khai Phase 2 |
| **API-EXT-COHORT**| Quản lý nhóm học viên và tiến độ nhóm | B2 / B3 | Manager Portal / `COMP-PRES-02` | Curriculum & Progression Service (`COMP-DOM-02` / Future Extension) | `FUTURE_EXTENSION` | Hậu MVP; không nằm trong Core Scope | Roadmap §9 | Phase 3+ (Future Extensions) | Trì hoãn mở rộng tương lai |
| **API-EXT-TICKET**| Tiếp nhận và xử lý yêu cầu hỗ trợ | B1 / B2 | All Portals / `COMP-PRES-01/02` | Admin Governance & Audit Service (`COMP-DOM-07` / Future Extension) | `FUTURE_EXTENSION` | Hậu MVP; không nằm trong Core Scope | Roadmap §9 | Phase 3+ (Future Extensions) | Trì hoãn mở rộng tương lai |
| **API-GAP-ROLE** | Giao diện quản lý 2 vai trò hiện tại | B2 / B3 | Admin Legacy / `COMP-PRES-02` | Auth & Identity Domain Service (`COMP-DOM-01` qua `COMP-APP-02`) | `COMPATIBILITY_GAP` | Cần chuyển đổi sang 6 vai trò chuẩn tắc | DD-10, Roadmap §8 | Phase 2 Entry (Role & RLS Migration) | Cần chuyển đổi trong Phase 2 |

### 4.5. Quy Chuẩn Phân Loại Mã Lỗi & Đặc Tả Bổ Sung Thiết Kế M2.6 (Error Taxonomy & M2.6 Design Additions)

Phần này làm rõ và chuẩn hóa các mã lỗi xuất hiện trong Khung kiểm thử (Test Frame 16) nhằm đáp ứng tính nghiêm ngặt về quản trị kiến trúc:
1. **Phân loại trạng thái mã lỗi (Classification):**
   - Các mã lỗi SoD chuẩn tắc kế thừa từ M2.4: `403 SOD_VIOLATION_SELF_REVIEW`, `403 SOD_VIOLATION_MODERATOR_PUBLISH`.
   - Các mã lỗi bổ sung trong thiết kế M2.6: `403 SOD_VIOLATION_EMERGENCY_UNAPPROVED` [M2.6 DESIGN ADDITION] và `403 SOD_VIOLATION_MISSING_JUSTIFICATION` [M2.6 DESIGN ADDITION].
2. **Lý do kỹ thuật cần thiết (Rationale):**
   - Theo M2.4 Artifact #16, Administrator chỉ được thực hiện xuất bản khẩn cấp khi thỏa mãn đồng thời hai điều kiện: nội dung bài học phải ở trạng thái đã được phê duyệt (`APPROVED`) và yêu cầu phải kèm lý do giải trình (`reason`).
   - Nhằm phân biệt rõ rệt hai nguyên nhân từ chối ủy quyền khác nhau để hỗ trợ xử lý lỗi client và ghi nhận nhật ký kiểm toán chính xác: một mã dành riêng cho trường hợp nội dung chưa qua phê duyệt (`IN_REVIEW`), và một mã dành riêng cho trường hợp thiếu lý do giải trình bắt buộc (`reason` rỗng/null).
3. **Cơ sở sử dụng mã trạng thái HTTP 403 (Why HTTP 403 Forbidden):**
   - Hai mã lỗi này phản ánh việc từ chối ủy quyền do vi phạm chính sách an ninh phân tách nhiệm vụ (Separation of Duties). Theo RFC 9110, HTTP 403 Forbidden là mã trạng thái chuẩn ngữ nghĩa cho các trường hợp danh tính đã được xác thực hợp lệ nhưng không được cấp quyền thực thi hành động trong trạng thái hiện tại của tài nguyên.
4. **Ranh giới sở hữu (Owning API Boundary):**
   - Thuộc về **Boundary 2: Admin Web (BFF / Server Actions)** (B2), thực thi kiểm soát tại tầng ứng dụng (`COMP-APP-02`) phối hợp với dịch vụ kiểm duyệt nội dung (`COMP-DOM-06`) và dịch vụ quản trị an ninh (`COMP-DOM-07`).
5. **Mối quan hệ với phân loại lỗi chuẩn tắc M2.4 (Error Taxonomy Parity):**
   - M2.4 Artifact #16 đã thiết lập quy chuẩn đặt tên lỗi SoD với tiền tố `SOD_VIOLATION_*`. Việc bổ sung hai mã lỗi này tuân thủ 100% cú pháp tiền tố và hệ thống ngữ nghĩa phân loại lỗi an ninh đã được phê duyệt, không tạo ra ngoại lệ dị biệt.
6. **Bảo tồn tính toàn vẹn của hợp đồng `docs/03-api-contract.md` (Zero Contract Drift):**
   - Hợp đồng `docs/03-api-contract.md` quy định độc quyền các endpoint của Microservice AI (FastAPI GEC). Các mã lỗi SoD quản trị nội dung thuộc về luồng Next.js Admin BFF nội bộ, hoàn toàn độc lập với dịch vụ AI. Tệp `docs/03-api-contract.md` được giữ nguyên 100% byte-identical.
7. **Mốc rà soát và kiểm chứng trong Phase 2 (Implementation Review Milestone):**
   - Hai mã lỗi bổ sung này sẽ được rà soát, kiểm thử mã nguồn và nghiệm thu chính thức trong Phase 2 tại mốc triển khai hệ thống quản trị và kiểm duyệt nội dung (`Phase 2 Core Implementation — Content Authoring & Moderation`).

---

## 5. Output 4 — Security & Audit Baseline Reconfirmation

Phần này tái xác nhận nguyên vẹn mô hình an ninh và nhật ký kiểm toán đã được phê duyệt tại mốc M2.4 (Artifact #16) và kiểm định tại M2.5. **Tuyệt đối không có bất kỳ sự tái thiết kế hoặc làm suy yếu chính sách nào.**

### 5.1. Mô Hình 5 Vùng An Ninh Logic (5 Security Zones)
1. **Zone 1 — Public Browser / Client Zone:** Trình duyệt người dùng (Learner Web, Admin Web). Là vùng không tin cậy (untrusted), không lưu trữ bí mật dịch vụ hoặc quyền quản trị cơ sở dữ liệu.
2. **Zone 2 — Trusted Application / BFF Zone:** Lớp máy chủ ứng dụng Next.js (Server Components, Route Handlers, Server Actions). Đóng vai trò Proxy tin cậy, thực thi kiểm tra phân quyền mức ứng dụng (App AuthZ), bóc tách token JWT, và giao tiếp với các dịch vụ nội bộ.
3. **Zone 3 — Supabase DB / Storage / Auth Zone:** Vùng dữ liệu tập trung (PostgreSQL, GoTrue, Supabase Storage). Là chốt chặn bảo mật dữ liệu tối hậu thông qua Row Level Security (RLS) bắt buộc; tuyệt đối không tin tưởng mù quáng vào các kiểm tra từ Zone 1 hoặc Zone 2.
4. **Zone 4 — Isolated AI Compute Zone:** Vùng điện toán AI độc lập (FastAPI GEC Container). Hoàn toàn phi trạng thái (stateless), không có quyền kết nối trực tiếp vào Zone 3, giao tiếp độc quyền với Zone 2 qua giao thức nội bộ với thời gian chờ tối đa 8.0 giây.
5. **Zone 5 — Privileged Infrastructure Operations / CLI Zone (BẮT BUỘC RÕ RÀNG):** Vùng vận hành hạ tầng đặc quyền. Nơi duy nhất lưu trữ và sử dụng khóa tối cao `service_role` key, thực thi các kịch bản migration DDL/SQL, backup cơ sở dữ liệu và bảo trì catalog hệ thống. Vùng này cô lập tuyệt đối khỏi các tiến trình runtime phục vụ người dùng.

### 5.2. Mô Hình 6 Ranh Giới An Ninh (6 Security Boundaries — M2.4 Artifact #16 Parity)
- **B1 — Boundary 1: Learner Web (BFF / Client):** Trình duyệt học viên và Next.js BFF Route Handlers / Proxies trong `lingora-web` (`COMP-PRES-01`, `COMP-APP-01`). Thực thi trích xuất phiên cookie HttpOnly, kiểm tra tính hợp lệ của dữ liệu đầu vào (bounds validation), bóc tách JWT, và sở hữu thời gian ngắt kết nối nghiêm ngặt 8.0s kèm mạch ngắt (circuit-breaker) dự phòng; tuyệt đối không gọi trực tiếp cơ sở dữ liệu hoặc container AI từ client.
- **B2 — Boundary 2: Admin Web (BFF / Server Actions):** Cổng quản trị và Next.js Server Actions / Prisma trong `lingora-admin` (`COMP-PRES-02`, `COMP-APP-02`). Thực thi lọc giao diện hiển thị theo vai trò, kiểm tra nghiêm ngặt quy tắc phân tách nhiệm vụ (SoD) trước khi lưu trữ (Creator tự duyệt -> 403 Forbidden, Moderator xuất bản -> 403 Forbidden, Admin xuất bản khẩn cấp sai trạng thái/thiếu lý do -> 403 Forbidden), và phát thải sự kiện kiểm toán bắt buộc.
- **B3 — Boundary 3: Supabase RLS (Database Core):** Động cơ PostgreSQL Row Level Security (`COMP-INFRA-01`, `COMP-INFRA-02`, `COMP-INFRA-03`, `COMP-INFRA-04`). Chốt chặn an ninh bắt buộc độc lập ở tầng cơ sở dữ liệu, thực thi `auth.uid() = learner_id`, cô lập dữ liệu đa người dùng tuyệt đối (trả về tập rỗng khi truy vấn chéo), và lọc nội dung đã xuất bản (`published = true`) cho học viên; không thể bị bypass bởi mã nguồn client ứng dụng.
- **B4 — Boundary 4: Privileged Service Role (Operations / Maintenance):** Vùng vận hành hạ tầng đặc quyền Zone 5. Nơi duy nhất lưu trữ và sử dụng khóa tối cao `service_role` key, cô lập hoàn toàn khỏi luồng người dùng chuẩn, chỉ dùng cho việc thực thi di chuyển lược đồ DDL và nạp dữ liệu mầm ban đầu (seed); không bao giờ được nạp vào môi trường runtime của Learner Web.
- **B5 — Boundary 5: AI Server (Stateless Inference):** Microservice FastAPI T5-small phi trạng thái trong Zone 4 (`COMP-EXT-02`). Chỉ tiếp nhận chuỗi văn bản và trả về phân tích sửa lỗi tạm thời, xác thực JWT người dùng qua JWKS (ES256), cấm tuyệt đối việc kết nối trực tiếp cơ sở dữ liệu hoặc ghi đè tiến độ học viên.
- **B6 — Boundary 6: Audit Store (Immutable Ledger):** Kho lưu trữ nhật ký kiểm toán bất biến `audit_logs` (`COMP-INFRA-05`). Thu thập các hành động quản trị nhạy cảm (xuất bản khẩn cấp kèm lý do giải trình, phân bổ vai trò, tạm khóa tài khoản), thiết lập cơ chế Append-Only cấm lệnh UPDATE/DELETE.

### 5.3. Mô Hình 6 Vai Trò Chuẩn Tắc (6 Canonical Roles)
Hệ thống Lingora chuẩn hóa chính xác **6 vai trò nghiệp vụ** (không coi khóa kỹ thuật hạ tầng `service_role` là vai trò kinh doanh thứ 7):
1. **Learner (Học viên):** Học bài, làm bài chẩn đoán, bài Jump, luyện từ vựng SRS, xem tiến độ bản thân.
2. **Lesson Creator (Người biên soạn bài học):** Biên soạn bài học được phân công, tạo bài tập, nộp duyệt bài thảo.
3. **Moderator (Người kiểm duyệt):** Đánh giá bài học, phê duyệt hoặc yêu cầu chỉnh sửa; không được tự biên soạn hoặc tự xuất bản.
4. **Organizational Manager (Quản lý tổ chức):** Lập kế hoạch bài học, phân công biên soạn, xuất bản bài học đã duyệt ra công chúng.
5. **Administrator (Quản trị viên hệ thống):** Quản lý tài khoản, cấu hình hệ thống, xem nhật ký kiểm toán, xuất bản khẩn cấp bài học đã duyệt kèm lý do.
6. **Operations Staff (Nhân viên vận hành):** Hỗ trợ kỹ thuật, giám sát hệ thống, tra cứu log hỗ trợ người dùng theo phạm vi ủy quyền.

### 5.4. Quy Tắc Phân Tách Nhiệm Vụ (Separation of Duties — SoD)
- **Cấm tự phê duyệt (No Self-Approval):** Lesson Creator không thể tự phê duyệt hoặc tự từ chối bài học do mình tạo ra (`403 SOD_VIOLATION_SELF_REVIEW`).
- **Cấm kiểm duyệt viên xuất bản (No Moderator Publishing):** Moderator chỉ có quyền duyệt nội dung (`APPROVED`), không có thẩm quyền đưa bài học lên trạng thái xuất bản `PUBLISHED` (`403 SOD_VIOLATION_MODERATOR_PUBLISH`).
- **Cấm đốt cháy giai đoạn (No Review Bypass):** Bài học đang ở trạng thái `IN_REVIEW` tuyệt đối không thể nhảy thẳng sang `PUBLISHED`.
- **Ràng buộc xuất bản khẩn cấp (Emergency Publish Constraints):** Administrator chỉ được phép xuất bản khẩn cấp đối với các bài học đã có trạng thái `APPROVED`, bắt buộc phải cung cấp lý do giải trình trong payload và tự động phát sinh bản ghi kiểm toán `CONTENT_EMERGENCY_PUB`.

### 5.5. Danh Mục Chuẩn Tắc 11 Sự Kiện Kiểm Toán (11 Canonical Audit Events)
Danh mục kiểm toán được chốt cứng chính xác 11 sự kiện chuẩn tắc từ M2.4 Artifact #16 / DD-03 (tuyệt đối không tự ý thêm bớt hoặc đổi tên):
1. `AUTH_LOGIN_FAILED` — Ghi nhận các lần đăng nhập thất bại (sai mật khẩu, tài khoản bị khóa)
2. `ROLE_ASSIGNED` — Phân bổ hoặc thay đổi vai trò người dùng trong hệ thống
3. `ACCOUNT_SUSPENDED` — Đình chỉ hoặc tạm khóa tài khoản người dùng
4. `CONTENT_APPROVED` — Phê duyệt bản thảo bài học bởi Moderator
5. `CONTENT_CHANGES_REQ` — Yêu cầu chỉnh sửa bản thảo bài học bởi Moderator
6. `CONTENT_PUBLISHED` — Xuất bản bài học bởi Organizational Manager
7. `CONTENT_EMERGENCY_PUB` — Xuất bản khẩn cấp bài học bởi Administrator kèm lý do
8. `CONTENT_EMERGENCY_ARCH` — Gỡ bỏ/thu hồi khẩn cấp bài học bởi Administrator kèm lý do
9. `DIAGNOSTIC_COMPLETED` — Hoàn thành bài kiểm tra chẩn đoán năng lực học viên
10. `JUMP_LOCKOUT_TRIGGERED` — Kích hoạt khóa hồi chiêu 24 giờ khi làm bài Jump không đạt
11. `AUDIT_LOG_INSPECTED` — Truy vấn và kiểm tra nhật ký kiểm toán bởi nhân sự có thẩm quyền

---

## 6. Output 5 — Academic Report Mapping & Artifact/Evidence Index

Phần này đồng bộ hóa toàn diện chuỗi truy vết từ Yêu cầu nghiệp vụ (Requirements) đến các chương mục của Báo cáo Học thuật (Academic Report) theo đúng bảng quy chuẩn `docs/phase-1-system-design-plan.md` §11.

Tuân thủ nghiêm ngặt **Quy tắc Chống Giả Mạo (Anti-Fabrication Rule)**: Mọi liên kết triển khai, mã commit tương lai, hoặc kết quả kiểm thử hạ tầng trong Phase 2 đều được gắn nhãn rõ ràng là **`PLANNED`** hoặc **`SKELETON`**, tuyệt đối không giả mạo kết quả thực thi hay đường dẫn file chưa tồn tại.

### Bảng Ánh Xạ Sản Phẩm Thiết Kế Sang Báo Cáo Học Thuật (Roadmap §11 Parity)

| Nhóm Sản Phẩm Thiết Kế | Chương Báo Cáo Học Thuật | Yêu Cầu Nghiệp Vụ (Requirements) | Ca Sử Dụng & Luồng Nghiệp Vụ (UC / BF) | Nhiệm Vụ Triển Khai Kế Hoạch (Planned Task) | Khung Kiểm Thử Kế Hoạch (Planned Test) | Bằng Chứng Tương Lai (Future Evidence) | Mục Báo Cáo Tương Ứng |
|---|---|---|---|---|---|---|---|
| **Artifacts 1–3** (Domain, Lifecycle, Progression) | Chương 3: Phân tích & Thiết kế Hệ thống | P1-FR-001..006, D1–D4 | UC-03, UC-04, UC-08, UC-09, UC-10; BF-05, BF-06, BF-07, BF-08, BF-11, BF-12 | `PLANNED-TASK-DOMAIN-CORE` | `TEST-FRAME-MAPPING-A`, `TEST-FRAME-DIAG-SKIP` | `PLANNED-EVIDENCE-DOMAIN-MODEL` | Mục 3.1 & 3.2 |
| **Artifacts 4–5** (ERD & Data Dictionary) | Chương 4: Thiết kế Cơ sở Dữ liệu | P1-FR-001..017, `04` Data Model | Toàn bộ các UC/BF mang dữ liệu nghiệp vụ | `PLANNED-TASK-DB-EXPAND` | `TEST-FRAME-RLS-ISOLATION`, `TEST-FRAME-DIAG-RETAKE` | `PLANNED-EVIDENCE-PRISMA-MIGRATION` | Mục 4.1 & 4.2 |
| **Artifacts 6–8** (DFD Context, Level 0, Level 1) | Chương 3: Thiết kế Kiến trúc Dữ liệu | System Boundaries, D1–D10 | Toàn bộ 15 Luồng Nghiệp vụ (BF-01 đến BF-15) | `PLANNED-TASK-DATA-FLOWS` | `TEST-FRAME-ROLE-AUTH-MATRIX` | `PLANNED-EVIDENCE-INTEGRATION-LOGS` | Mục 3.3 |
| **Artifacts 9–10** (UC, Activity & State Diagrams) | Chương 3: Mô hình Hóa Hành Vi | P1-FR-001..015, User Research | 15 Ca sử dụng chuẩn tắc (UC-01 đến UC-15) | `PLANNED-TASK-BFF-CONTROLLERS` | `TEST-FRAME-SOD-SELF-REVIEW`, `TEST-FRAME-SOD-MODERATOR-PUBLISH` | `PLANNED-EVIDENCE-E2E-TESTS` | Mục 3.4 |
| **Artifacts 11–12** (Sequence & Boundary Analysis) | Chương 3: Thiết kế Tương Tác & Dịch Vụ | SEQ-01..10, API Contracts | Completion, Review, Publish, GEC, SRS Flows | `PLANNED-TASK-SERVICE-INTERACTION` | `TEST-FRAME-GEC-TIMEOUT-FALLBACK` | `PLANNED-EVIDENCE-SEQUENCE-RUNS` | Mục 3.5 |
| **Artifacts 13–14** (Architecture & Deployment Boundary) | Chương 3: Kiến trúc Phần mềm | ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-008, ADR-010, ADR-011, ADR-012, ADR-014, ADR-016, ADR-020, ADR-023, ADR-024, ADR-025, ADR-026, ADR-027, ADR-028; Runtime Invariants | Cross-cutting UC/BF | `PLANNED-TASK-INFRA-DOCKER` | `TEST-FRAME-AI-NON-OWNERSHIP` | `PLANNED-EVIDENCE-DEPLOY-CONFIG` | Mục 3.6 |
| **Artifact 15** (API Boundary Register) | Chương 3: Thiết kế Giao diện Lập trình | `docs/03-api-contract.md` (read-only) | Toàn bộ các UC/BF giao tiếp qua API | `PLANNED-TASK-FASTAPI-BFF` | `TEST-FRAME-GEC-TIMEOUT-FALLBACK` | `PLANNED-EVIDENCE-API-SPECS` | Mục 3.7 |
| **Artifact 16** (Security, RBAC & Audit Matrix) | Chương 5: Thiết kế An toàn & Bảo mật | P1-NFR-001, Roles Baseline | UC-11, UC-13 và các thao tác nhạy cảm (OP-01..15) | `PLANNED-TASK-RLS-POLICIES` | `TEST-FRAME-ROLE-AUTH-MATRIX`, `TEST-FRAME-ADMIN-EMERGENCY-PUBLISH` | `PLANNED-EVIDENCE-AUDIT-LOGS` | Mục 5.1 & 5.2 |
| **Artifact 17** (Placement & Jump Specification) | Chương 3: Động cơ Đánh giá Năng lực | D5, D6, Mapping A (0–30 raw score) | UC-03, UC-04; BF-08, BF-11 | `PLANNED-TASK-ASSESS-ENGINE` | `TEST-FRAME-MAPPING-A`, `TEST-FRAME-JUMP-PASS`, `TEST-FRAME-JUMP-COOLDOWN` | `PLANNED-EVIDENCE-ASSESS-TESTS` | Mục 3.8 |
| **Artifact 18** (Spaced Repetition SRS Model) | Chương 3: Động cơ Ôn tập Ngắt quãng | D8 (Policy B: `[1, 3, 7, 14, 30]`) | UC-06; BF-12 | `PLANNED-TASK-SRS-SCHEDULER` | `TEST-FRAME-SRS-POLICY-B` | `PLANNED-EVIDENCE-SRS-RUNS` | Mục 3.9 |
| **Artifact 19** (Screen & State Inventory) | Chương 3: Thiết kế Luồng Tương tác | Giao diện không phụ thuộc pixel (wireframe) | Toàn bộ các UC/BF tương tác người dùng | `PLANNED-TASK-WEB-UI-COMPONENTS` | `TEST-FRAME-STREAK-TIMEZONE`, `TEST-FRAME-STREAK-RESET` | `PLANNED-EVIDENCE-UI-STORIES` | Mục 3.10 |
| **Artifact 20** (Design Validation Report) | Phụ lục A: Báo cáo Kiểm định Thiết kế | Toàn bộ ma trận truy vết và tiêu chí DoD | Cổng D-G1 đến D-G9 | Hoàn thành tại M2.5 | `docs/phase-1-m2-5-design-validation.md` | `ACCEPTANCE-RECORD-M25-ADR028` | Phụ lục A |
| **Handoff Spec** (M2.6 Design Handoff Package) | Phụ lục B: Hồ sơ Bàn giao Triển khai | Kế hoạch di chuyển dữ liệu, khung test, sổ phụ thuộc | Cổng D-G10 (Implementation Handoff Readiness) | Hoàn thành tại M2.6 | `docs/phase-1-m2-6-design-handoff.md` | `D-G10-EVIDENCE-PACKAGE` | Phụ lục B |

### Mục Lục Định Danh Bằng Chứng (Artifact & Evidence Index)
- **Bằng chứng hiện tại (CURRENT EVIDENCE):** Toàn bộ 20 sản phẩm thiết kế Artifacts #1 đến #20 đã được phê duyệt tại các mốc checkpoint thực tế trong lịch sử git: M2.1 (chấp thuận tại commit `ea1a2f3`), M2.2 (`7ab74b4`), M2.3 (`379c259`), M2.4 (`0a9a126`), và M2.5 (`d09f7cc`).
- **Thiết kế mục tiêu (TARGET DESIGN):** Hồ sơ bàn giao M2.6 bao gồm 8 giai đoạn di chuyển dữ liệu, 18 khung kiểm thử, danh mục API 4 tầng, và giải quyết 7 quyết định vật lý trên giấy.
- **Bằng chứng triển khai tương lai (FUTURE IMPLEMENTATION EVIDENCE):** Được gắn cờ `PLANNED`, sẽ được hình thành và xác thực trong các mốc thực thi mã nguồn của Giai đoạn 2 (các mốc triển khai Phase 2).

---

## 7. Output 6 — Open Decisions Closure Record (Tier-3 Physical Design on Paper)

Phần này thực hiện giải quyết dứt điểm các quyết định thiết kế vật lý Tầng 3 (Tier 3 Physical Decisions) cho 7 quyết định mở còn lại từ Phase 1: **DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, và DD-10**.

Toàn bộ 7 quyết định được lập bảng theo đúng **lược đồ bắt buộc 10 cột**, được giải quyết chi tiết trên giấy tờ dưới dạng văn bản đặc tả kỹ thuật, **tuyệt đối không viết file mã nguồn DDL/SQL thực thi và không làm thay đổi lược đồ database hiện tại**.

### Bảng Hồ Sơ Giải Quyết Quyết Định Thiết Kế Vật Lý Tầng 3 (10-Column DD Closure Record)

| Quyết Định | (1) Trạng Thái Hiện Tại | (2) Tier 1: Locked Behavior | (3) Tier 2: Design Specification | (4) Tier 3: Physical Decision (On Paper) | (5) Rationale (Lý do kỹ thuật) | (6) Dependencies (Phụ thuộc) | (7) Migration Impact (Tác động di chuyển) | (8) Rollback Consideration (Hoàn nguyên) | (9) Affected Artifacts (Sản phẩm ảnh hưởng) | (10) Implementation Consequences (Hệ quả triển khai Phase 2) |
|---|---|---|---|---|---|---|---|---|---|---|
| **DD-01** (Unit Representation) | `RESOLVED ON PAPER (M2.6)` | Phân cấp Course -> Unit -> Lesson là bất biến (MVP-04). | Quan hệ Unit mục tiêu với ánh xạ di chuyển rõ ràng; tương thích với trạng thái DB hiện tại. | Tạo bảng vật lý `units` gồm các trường: `id UUID PK`, `course_id UUID NOT NULL FK`, `order_index INT NOT NULL`, `title VARCHAR(255) NOT NULL`, `description TEXT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`. Thêm trường `unit_id UUID NULL FK` vào bảng `lessons`. Khóa ngoại `unit_id` đặt ràng buộc `ON DELETE RESTRICT`. | Đảm bảo tính toàn vẹn phân cấp mô hình giáo trình tiếng Anh A1 (6 Units); không gây gián đoạn các truy vấn bài học hiện tại nhờ tính chất khóa ngoại nullable trong giai đoạn mở rộng. | Khóa ngoại trỏ về `courses`; bảng `lessons` hiện tại. | Phase 2 tạo bảng `units`, điền 6 Unit chuẩn tắc cho khóa học tiếng Anh A1, sau đó chạy kịch bản cập nhật gán `lessons.unit_id` theo thứ tự bài học hiện có. | Xóa khóa ngoại `lessons.unit_id`; gỡ bỏ bảng `units` nếu cần hoàn nguyên; dữ liệu khóa học và bài học gốc không bị ảnh hưởng. | Artifacts #1, #2, #4, #5, #14 | Kỹ sư Phase 2 phải tạo migration Prisma tương ứng với bảng Unit và tạo chỉ mục `idx_units_course_order` trên cặp `(course_id, order_index)`. |
| **DD-02** (Revision Identity & Lineage) | `RESOLVED ON PAPER (M2.6)` | Cấm chỉnh sửa đè lên bài học đã xuất bản (D3); cơ chế clone-to-draft bất biến. | Định danh phiên bản độc lập; cây phả hệ qua `supersedesId`; chính sách bảo tồn lịch sử xuất bản. | Tách biệt thực thể logic `lessons` (chứa định danh ổn định `id`, `unit_id`, `created_at`) và thực thể phiên bản vật lý `lesson_revisions` gồm: `id UUID PK`, `lesson_id UUID NOT NULL FK`, `version INT NOT NULL`, `supersedes_id UUID NULL FK(lesson_revisions.id)`, `status VARCHAR(32) NOT NULL` (6 trạng thái chuẩn tắc: `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`), `content JSONB NOT NULL`, `assigned_creator_id UUID NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`. Ràng buộc duy nhất: Chỉ có tối đa 1 bản ghi `PUBLISHED` cho mỗi `lesson_id` tại một thời điểm (`CREATE UNIQUE INDEX idx_single_published_revision ON lesson_revisions(lesson_id) WHERE status = 'PUBLISHED'`). | Loại bỏ hoàn toàn rủi ro ghi đè dữ liệu đang được học viên học; cho phép biên soạn bản thảo mới trong khi bài học cũ vẫn đang phục vụ học viên bình thường; truy vết chính xác nguồn gốc sửa đổi qua `supersedes_id`. | Bảng `lessons` logic; tài khoản người dùng biên soạn. | Phase 2 tạo bảng `lesson_revisions`; trích xuất nội dung từ bảng `lessons` hiện tại để tạo bản ghi phiên bản 1 (`version = 1, status = 'PUBLISHED', supersedes_id = NULL`) cho toàn bộ bài học đã xuất bản. | Hủy bỏ bảng `lesson_revisions`; quay lại đọc trực tiếp nội dung từ bảng `lessons` cũ. | Artifacts #2, #4, #5, #11, #16 | Hệ thống Route Handler trong Phase 2 khi tạo bản thảo mới sẽ gọi lệnh nhân bản (clone) nội dung phiên bản published gần nhất thành một bản ghi mới với trạng thái `DRAFT` và `supersedes_id` trỏ về bản published đó. |
| **DD-03** (Audit Physical Structure) | `RESOLVED ON PAPER (M2.6)` | 4 trường bắt buộc bất biến: `actor_id`, `action`, `target_id`, `timestamp` (UTC). | Danh mục chuẩn tắc 11 sự kiện kiểm toán; cơ chế ghi tự động không có đường tắt bypass. | Tạo bảng vật lý `audit_logs` gồm: `id UUID PK DEFAULT gen_random_uuid()`, `actor_id UUID NOT NULL`, `action VARCHAR(64) NOT NULL`, `target_id VARCHAR(128) NOT NULL`, `timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`, `ip_address INET NULL`, `user_agent TEXT NULL`. Cơ chế phát thải (Emission): Kết hợp cả 2 tầng — Tầng ứng dụng (BFF) ghi nhận các sự kiện nghiệp vụ người dùng (đăng nhập, nộp bài, phân công); Tầng cơ sở dữ liệu (DB Triggers) ghi nhận các biến động bảng nhạy cảm và chặn vi phạm SoD. Chính sách IP/Thiết bị: Thu thập IP tại Zone 2 từ header chuẩn `x-forwarded-for`, ẩn danh octet cuối nếu cần tuân thủ quyền riêng tư, tuyệt đối không cho phép client tự gửi IP. Chính sách lưu trữ: Khóa bất biến không cho sửa xóa (`APPEND-ONLY` qua RLS); thời gian lưu trữ luân chuyển 365 ngày trước khi đẩy sang kho lưu trữ lạnh (Cold Storage). | Đảm bảo tính bất biến, chống chối bỏ và truy vết an ninh toàn diện; trường `metadata JSONB` cho phép lưu trữ chi tiết ngữ cảnh sự kiện (như lý do khẩn cấp của Admin) mà không làm phình cấu trúc cột cố định. | Hệ thống xác thực Supabase Auth; các bảng nghiệp vụ chính. | Phase 2 tạo bảng `audit_logs`, áp dụng chính sách RLS cấm lệnh `UPDATE` và `DELETE` đối với mọi vai trò ngoại trừ Zone 5. | Không cần hoàn nguyên dữ liệu log; có thể ngắt kết nối ghi nếu bảng gặp lỗi mà không làm sập luồng đọc của học viên. | Artifacts #4, #5, #13, #16 | Phase 2 triển khai một Audit Service dùng chung trong BFF để chuẩn hóa schema của trường `metadata` cho từng loại sự kiện trong 11 sự kiện chuẩn tắc. |
| **DD-04** (Assignment Representation) | `RESOLVED ON PAPER (M2.6)` | Phân công do Manager chỉ định; Creator chỉ biên soạn bài được giao; không đi tắt quy trình (D1). | Mô hình hóa thông tin phân công `AssignmentBrief` nhúng trực tiếp trong ranh giới `Lesson`. | Nhúng trực tiếp các trường phân công vào bảng vật lý `lesson_revisions` (và bảng quản lý bài học logic `lessons`): `assigned_creator_id UUID NULL FK(profiles.id)`, `assigned_by_id UUID NULL FK(profiles.id)`, `assignment_deadline TIMESTAMPTZ NULL`, `assignment_brief JSONB NULL` (chứa các thuộc tính: `objectives TEXT[]`, `target_vocab TEXT[]`, `notes TEXT`). Tuyệt đối KHÔNG tạo thêm bảng `assignments` độc lập. | Giữ cho mô hình dữ liệu tinh gọn theo đúng nguyên tắc MVP; tránh quan hệ thừa thãi giữa Lesson và Assignment; đảm bảo khi nhân bản bản thảo thì thông tin phân công gắn chặt với phiên bản đó. | Hồ sơ người dùng `profiles`; bảng `lesson_revisions`. | Thêm các cột phân công dạng nullable trong Phase 2 migration; không yêu cầu chuyển đổi dữ liệu phức tạp. | Xóa các cột phân công mới thêm nếu cần hoàn nguyên. | Artifacts #1, #4, #5, #10, #16 | RLS của Creator trong Phase 2 sẽ kiểm tra điều kiện `assigned_creator_id = auth.uid()` để chỉ cho phép biên soạn các bản thảo được đích danh quản lý phân công. |
| **DD-05** (Exercise Payload Representation) | `RESOLVED ON PAPER (M2.6)` | Bất biến Bài tập hợp nhất (Unified Exercise D4); không tạo bảng `Exam` hay `QuestionBank`. | Chế độ ngữ cảnh đánh giá (`context`) là thuộc tính của `Exercise`; hỗ trợ 5 loại bài tập chuẩn tắc. | Bảng vật lý `exercises` gồm: `id UUID PK`, `lesson_revision_id UUID NOT NULL FK`, `type VARCHAR(32) NOT NULL` (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR), `prompt TEXT NOT NULL`, `order_index INT NOT NULL`, `payload JSONB NOT NULL`. Cấu trúc JSON Schema của trường `payload` được chuẩn hóa theo từng loại: <br>1. **MCQ:** `{"options": [{"id": "opt1", "text": "...", "isCorrect": true}], "explanation": "..."}` <br>2. **FILL_BLANK:** `{"template": "I [blank1] to school", "blanks": [{"id": "blank1", "acceptedAnswers": ["go", "walk"]}]}` <br>3. **REORDER:** `{"tokens": [{"id": "t1", "text": "She"}, {"id": "t2", "text": "reads"}], "correctOrder": ["t1", "t2"]}` <br>4. **LISTENING:** `{"vocabularyId": "UUID_VOCAB_REF", "subType": "MCQ", "options": [...]}`. Đối với bài tập LISTENING, trường `vocabularyId` (UUID khóa ngoại trỏ về `vocabularies.id`) được sử dụng làm định danh bắt buộc để định tuyến tệp âm thanh qua Supabase Storage có kiểm soát RLS, TUYỆT ĐỐI KHÔNG lưu đường dẫn trực tiếp (free-form path/URL) trong payload nhằm ngăn chặn truy cập trái phép và bảo toàn tính toàn vẹn phân quyền. <br>5. **GRAMMAR:** `{"category": "TENSE_PRESENT", "errorText": "He go home", "correction": "goes", "explanation": "..."}`. Thuộc tính ngữ cảnh đánh giá được lưu trong `payload.context` (`{"mode": "NORMAL" | "DIAGNOSTIC" | "JUMP"}`). Kỹ năng đọc (Reading) được xử lý là chiều năng lực, không tạo thực thể bảng riêng. | Đáp ứng tính linh hoạt cao của các dạng bài tập tương tác ngôn ngữ mà không cần tạo hàng chục bảng con; bảo vệ nguyên tắc không thực thể ma (Zero ghost entities). | Bảng `lesson_revisions`. | Chuyển đổi định dạng payload từ cấu trúc JSON cũ sang cấu trúc JSON Schema chuẩn hóa trong Phase 3 backfill. | Khôi phục định dạng JSON cũ nếu phát hiện lỗi tương thích client. | Artifacts #4, #5, #11, #12, #18 | Kỹ sư triển khai Phase 2 sử dụng thư viện Zod để định nghĩa schema kiểm thực dữ liệu (runtime validation) cho từng loại payload trước khi lưu vào DB. |
| **DD-06** (Placement Persistence Strategy) | `RESOLVED ON PAPER (M2.6)` | Quy tắc chẩn đoán D6 và Mapping A bị khóa; đầu ra là `Starting Unit`, không CEFR. | Kết quả chẩn đoán lưu tại thực thể `AssessmentResult` bất biến, ánh xạ sang hồ sơ năng lực `SkillProfile`. | Tạo bảng vật lý `assessment_results` gồm: `id UUID PK DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL FK(profiles.id)`, `assessment_type VARCHAR(32) NOT NULL` (enum chuẩn tắc đã khóa: `DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`), `raw_score INT NOT NULL` (giá trị 0–30), `starting_unit INT NOT NULL` (giá trị 1–6), `answers JSONB NOT NULL`, `completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Bảng `profiles` bổ sung cột `verified_starting_unit INT NOT NULL DEFAULT 1` đóng vai trò con trỏ bộ nhớ đệm (cached denormalized pointer) phản ánh đúng `curriculumStartingPoint` được cập nhật tất định từ chuỗi năng lực: `AssessmentResult` -> `SkillProfile` -> `verifiedProficiency` -> `curriculumStartingPoint`. Bảng `skill_profiles` lưu trữ điểm năng lực chi tiết. Chiến lược lưu trữ lịch sử thi lại: Mỗi lần thi lại tạo ra một bản ghi `assessment_results` mới độc lập; kết quả mới nhất được truy vấn bằng `ORDER BY completed_at DESC LIMIT 1`; kết quả chẩn đoán là bất biến (`IMMUTABLE`), cấm mọi hành vi cập nhật (`UPDATE`) qua RLS. | Đảm bảo lưu vết lịch sử học tập trọn đời của học viên; Mapping A được tính toán tất định tại server trước khi lưu; enum `assessment_type` chỉ chứa đúng 3 giá trị chuẩn tắc (`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`), tách biệt hoàn toàn chế độ Jump (đơn vị liền kề phân biệt bằng `payload.context.mode = 'JUMP'`) và loại trừ hoàn toàn việc gắn các giá trị Jump vào enum `assessment_type`; ngăn chặn hoàn toàn việc sửa điểm chẩn đoán trong cơ sở dữ liệu. | Bảng tài khoản người dùng `profiles`. | Tạo bảng mới `assessment_results` trong Phase 2; di chuyển kết quả chẩn đoán hiện tại (nếu có) sang bảng mới. | Xóa bảng `assessment_results` và cột `verified_starting_unit` trong kịch bản hoàn nguyên. | Artifacts #2, #4, #5, #17 | Quyết định kiến trúc cụ thể: Lớp dịch vụ ứng dụng và đánh giá năng lực (Assessment & Diagnostic Domain Service — `COMP-DOM-03` phối hợp `COMP-APP-01`) chịu trách nhiệm thực thi giao dịch nguyên tử (atomic transaction) ghi bản ghi `assessment_results` mới và đồng thời cập nhật trường `profiles.verified_starting_unit` (cùng `SkillProfile.verifiedProficiency`) trong cùng một database transaction. Cơ chế Database Trigger chỉ đóng vai trò thứ cấp (secondary verification / audit trigger) để kiểm tra tính toàn vẹn và phát thải sự kiện kiểm toán `DIAGNOSTIC_COMPLETED`, tuyệt đối không phụ thuộc vào trigger để thực thi logic định tuyến nghiệp vụ cốt lõi. |
| **DD-10** (Role Enforcement Split & Migration) | `RESOLVED ON PAPER (M2.6)` | Hệ thống có 6 vai trò chuẩn tắc; kiểm tra app không thay thế RLS; RLS là bắt buộc. | Ma trận phân chia trách nhiệm giữa App AuthZ và DB RLS trên 15 nhóm thao tác; tương thích ngược 2 vai trò. | Kế hoạch di chuyển phân quyền 4 bước trên giấy tờ: <br>1. **Bước 1 (Lược đồ):** Bổ sung enum `app_role` gồm 6 giá trị (`Administrator`, `Lesson_Creator`, `Moderator`, `Operations_Staff`, `Learner`, `Organizational_Manager`) vào cột `profiles.role`. Ánh xạ mặc định tương thích ngược: Tài khoản có role `USER` cũ -> chuyển thành `Learner`; tài khoản có role `ADMIN` cũ -> chuyển thành `Administrator`. <br>2. **Bước 2 (Kiểm tra kép App AuthZ):** Cập nhật Next.js BFF đọc vai trò từ JWT claim/profile và thực thi kiểm tra quyền tại tầng server middleware. <br>3. **Bước 3 (Cài đặt RLS Mục Tiêu):** Tạo các chính sách RLS độc lập cho từng bảng nghiệp vụ, thực thi kiểm soát quyền trực tiếp tại database dựa trên danh tính xác thực `auth.uid()` đối soát với vai trò người dùng trong `profiles.role` (ví dụ: `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = '...')`). Trường hợp tối ưu hóa hiệu năng bằng custom JWT claim, claim phải được phát hành đồng bộ từ `profiles.role` qua Supabase Auth Hook và luôn có fallback đối soát `auth.uid()` để chống trôi dạt quyền khi thay đổi vai trò. <br>4. **Bước 4 (Cách ly Zone 5):** Khóa quyền `service_role` chỉ cho phép truy cập từ các tiến trình backend hạ tầng Zone 5, cấm tuyệt đối việc nhúng `service_role` key vào client hay BFF công cộng. | Duy trì tính liên tục của hệ thống, không làm gián đoạn người dùng hiện tại; đảm bảo phòng vệ 2 lớp (Dual presence): App AuthZ bảo vệ trải nghiệm và tối ưu hóa truy vấn, DB RLS bảo vệ dữ liệu tối hậu chống bypass. | Hệ thống Supabase GoTrue Auth; toàn bộ bảng nghiệp vụ. | Thực hiện cập nhật dữ liệu cột `role` trong Phase 3; triển khai chính sách RLS mới trong Phase 4 migration. | Khôi phục lại chính sách RLS nhị phân cũ; gán lại giá trị role về `USER` hoặc `ADMIN`. | Artifacts #4, #5, #13, #14, #16 | Phase 2 phải cung cấp bộ test tự động kiểm thử tính cách ly của cả 6 vai trò trước khi chuyển đổi toàn bộ lưu lượng ứng dụng. |

---

## 8. Deliverable 7 — Implementation & Governance Dependency Register

Sổ đăng ký phụ thuộc này được thiết lập độc lập với Danh mục API, tuân thủ nghiêm ngặt **lược đồ bắt buộc 9 trường** đã được phê chuẩn trong kế hoạch M2.6.

Sổ đăng ký bao quát toàn bộ các điều kiện tiên quyết về mặt Kỹ thuật (Technical Dependencies) và Quản trị (Governance Dependencies) cần thiết để bước vào Giai đoạn 2.

### Định Nghĩa Trạng Thái Phụ Thuộc:
- `RESOLVED`: Phụ thuộc đã có đầy đủ bằng chứng xác thực từ các tài liệu/sản phẩm đã được phê chuẩn (ví dụ: tài liệu thiết kế đã chốt, phiên bản công cụ đã được đặc tả yêu cầu; không yêu cầu cài đặt thực tế).
- `OPEN`: Phụ thuộc đã được nhận diện rõ ràng và đang chờ mốc thực thi cụ thể trong Phase 2.
- `BLOCKING`: Phụ thuộc còn mở mà sự vắng mặt của nó cản trở việc vượt qua cổng D-G10 bàn giao. **Tại thời điểm bàn giao M2.6, số lượng phụ thuộc `BLOCKING` chưa giải quyết bắt buộc phải bằng 0.**

### Sổ Đăng Ký Phụ Thuộc Triển Khai & Quản Trị (Mandatory 9-Field Schema)

| (1) Dependency ID | (2) Description | (3) Source | (4) Blocks | (5) Blocked by | (6) Current/Target/Future | (7) Required Milestone | (8) Evidence | (9) Resolution Status |
|---|---|---|---|---|---|---|---|---|
| **DEP-TECH-01** | Công cụ quản lý di chuyển lược đồ DB (Prisma Migrate / Supabase CLI) | `01` §3.3, Roadmap §8 | Triển khai mã nguồn cơ sở dữ liệu Phase 2 | Không có | `TARGET_DESIGN` | Phase 2 Entry (Database Foundation) | Đặc tả kỹ thuật công cụ trong `01` §3.3 và ADR-002 | `RESOLVED` |
| **DEP-TECH-02** | Khung định nghĩa lược đồ cơ sở dữ liệu mục tiêu (Prisma Schema Target) | `04` Data Model, DD-01..06 | Tạo mã client DB tự động (`@prisma/client`) | DEP-TECH-01 | `TARGET_DESIGN` | Phase 2 Entry (Database Foundation) | Đặc tả lược đồ thực thể trong `docs/04-data-model.md` | `RESOLVED` |
| **DEP-TECH-03** | Dịch vụ định danh và xác thực Supabase GoTrue Auth | `01` §3.3, ADR-002 | Luồng đăng nhập và cấp phát token người dùng | Không có | `CURRENT_APPLIED` | Phase 2 Entry (Auth Foundation) | Đã tích hợp và kiểm chứng trong Phase 0 & Phase 1 | `RESOLVED` |
| **DEP-TECH-04** | Cơ chế xác thực chữ ký số JWT và giải mã JWKS tại Next.js BFF | `01` §3.3, M2.4 Artifact #16 | Bảo vệ các Route Handler và bóc tách `user_id`, `role` | DEP-TECH-03 | `TARGET_DESIGN` | Phase 2 Entry (Auth & BFF Integration) | Đặc tả ranh giới B1/B2/B3 trong M2.4 Artifact #16 | `RESOLVED` |
| **DEP-TECH-05** | Kiến trúc lớp ứng dụng Next.js BFF và Server Actions | `01` §3.2, M2.4 Artifact #13 | Giao diện tương tác người dùng và điều phối API | Không có | `TARGET_DESIGN` | Phase 2 Core Implementation (BFF Layer) | Danh mục 19 thành phần kiến trúc M2.4 Artifact #13 | `RESOLVED` |
| **DEP-TECH-06** | Microservice AI chấm lỗi ngữ pháp độc lập (FastAPI GEC Service) | `03` API Contract, ADR-014 | Tính năng chấm bài tự luận ngữ pháp tiếng Anh | Không có | `TARGET_DESIGN` | Phase 2 Core Implementation (AI Service Integration) | Hợp đồng API chuẩn hóa tại `docs/03-api-contract.md` | `RESOLVED` |
| **DEP-TECH-07** | Ranh giới ngắt kết nối AI timeout 8.0s và cơ chế Fallback | `01` §3.5, ADR-014 | Luồng nộp bài tập tự luận của học viên | DEP-TECH-06 | `TARGET_DESIGN` | Phase 2 Core Implementation (AI Service Integration) | Khung kiểm thử `TEST-FRAME-GEC-TIMEOUT-FALLBACK` | `RESOLVED` |
| **DEP-TECH-08** | Cấu hình lưu trữ tệp tin âm thanh và hình ảnh (Supabase Storage) | `01` §3.3, ADR-005 | Bài tập nghe (Listening) và avatar người dùng | Không có | `TARGET_DESIGN` | Phase 2 Core Implementation (Storage & Media) | Đặc tả 2 bucket lưu trữ trong ADR-005 | `RESOLVED` |
| **DEP-TECH-09** | Kịch bản chính sách bảo mật hàng cơ sở dữ liệu (Database RLS Policies) | M2.4 Artifact #16, DD-10 | Khả năng cách ly dữ liệu đa người dùng | DEP-TECH-02 | `TARGET_DESIGN` | Phase 2 Entry (Role & RLS Migration) | Ma trận phân quyền 15 thao tác trong M2.4 Artifact #16 | `RESOLVED` |
| **DEP-TECH-10** | Hạ tầng kiểm thử tự động (Jest / Playwright / Pytest) | Roadmap §12, Output 2 | Thực thi kiểm thử mã nguồn và xác thực gate | Không có | `TARGET_DESIGN` | Phase 2 Entry (Test Infrastructure) | 18 khung kịch bản Test Skeleton trong M2.6 Output 2 | `RESOLVED` |
| **DEP-TECH-11** | Dữ liệu mầm giáo trình tiếng Anh A1 chuẩn tắc (Seed Data) | `08` English A1 Curriculum | Môi trường thử nghiệm và nghiệm thu bài học | DEP-TECH-02 | `TARGET_DESIGN` | Phase 2 Entry (Curriculum Seed Data) | Đặc tả 6 Unit / 24 Lesson trong `docs/08-english-a1-curriculum.md` | `RESOLVED` |
| **DEP-TECH-12** | Phân vùng môi trường vận hành hạ tầng đặc quyền Zone 5 | M2.4 Artifact #14, DD-03 | Thực thi các lệnh DDL migration và bảo trì | Không có | `TARGET_DESIGN` | Phase 2 Entry (Zone 5 Privileged Ops) | Đặc tả 5 vùng an ninh trong M2.4 Artifact #14 | `RESOLVED` |
| **DEP-GOV-01** | Phê chuẩn chính thức Gói Bàn giao Thiết kế Milestone M2.6 | Roadmap §7, §14 | Khởi động Giai đoạn 2 (Phase 2 Entry) | D-G10 PASS | `TARGET_DESIGN` | Phase 1 (M2.6 Closure) | Tài liệu bàn giao `docs/phase-1-m2-6-design-handoff.md` | `OPEN` (Đang chờ review) |
| **DEP-GOV-02** | Nghiệm thu và đóng toàn bộ 20 sản phẩm thiết kế Phase 1 | Roadmap §14 (DoD) | Đóng Giai đoạn 1 (Phase 1 Closure) | DEP-GOV-01 | `TARGET_DESIGN` | Phase 1 (M2.6 Closure) | Hồ sơ nghiệm thu M2.1–M2.5 và M2.6 D-G10 | `OPEN` (Chờ kết thúc M2.6) |
| **DEP-GOV-03** | Phê duyệt Kế hoạch Triển khai Chi tiết Giai đoạn 2 (Phase 2 Plan) | AGENTS.md Gate Rule | Viết mã nguồn triển khai cơ sở dữ liệu Phase 2 | DEP-GOV-01 | `FUTURE_EXTENSION` | Phase 2 Entry | Kế hoạch `plans/phase-2-implementation-plan.md` | `OPEN` (Theo quy trình gated) |
| **DEP-GOV-04** | Kiểm định độc lập chất lượng mã nguồn triển khai từng mốc Phase 2 | AGENTS.md Workflow | Chấp thuận nghiệm thu tính năng từng mốc | Mã nguồn hoàn thành | `FUTURE_EXTENSION` | Phase 2 Core Implementation | Báo cáo kiểm định độc lập của kiểm định viên Codex | `OPEN` (Theo quy trình gated) |

*Ghi chú quản trị:* Toàn bộ các phụ thuộc kỹ thuật tiên quyết cho thiết kế đều đã đạt trạng thái `RESOLVED` nhờ sự hiện diện của các tài liệu đặc tả chuẩn tắc. Hai phụ thuộc quản trị `DEP-GOV-01` và `DEP-GOV-02` đang ở trạng thái `OPEN` hợp lệ (chờ hoàn thành quy trình đánh giá độc lập của M2.6). **Không có bất kỳ phụ thuộc nào ở trạng thái `BLOCKING` cản trở việc bàn giao.**

---

## 9. Cổng Kiểm Định D-G10 — Handoff Readiness Validation

Cổng **D-G10 (Design-to-Implementation Handoff Readiness)** là cổng kiểm định duy nhất của Milestone M2.6, được thiết kế theo cấu trúc chuẩn tắc 6 trường thuộc tính:

### Đặc Tả 6 Trường Thuộc Tính Cổng D-G10

```text
====================================================================================================
                        CỔNG KIỂM ĐỊNH D-G10: TÍNH SẴN SÀNG BÀN GIAO TRIỂN KHAI
                                (IMPLEMENTATION HANDOFF READINESS ONLY)
====================================================================================================
```

1. **Đầu vào kiểm định (Input):**
   - Hồ sơ bằng chứng kiểm định 9 cổng D-G1 đến D-G9 đã được nghiệm thu tại M2.5 (Artifact #20).
   - Danh sách kiểm tra Định nghĩa Hoàn thành (DoD Checklist) theo `docs/phase-1-system-design-plan.md` §14.
   - Bảng ánh xạ báo cáo học thuật theo `docs/phase-1-system-design-plan.md` §11.
   - Toàn bộ gói bàn giao M2.6 (`docs/phase-1-m2-6-design-handoff.md`), bao gồm 6 hợp phần nội dung và Deliverable 7 (Sổ đăng ký phụ thuộc).
2. **Phương pháp kiểm định (Validation Method):**
   - Kiểm tra đối soát từng mục tiêu chí xuất xưởng trong DoD §14 đối chiếu với từng phần bằng chứng tương ứng trong gói bàn giao M2.6.
   - Xác nhận toàn bộ 7 quyết định thiết kế vật lý Tầng 3 (DD-01..06 và DD-10) đều được giải quyết trên giấy tờ có dẫn chiếu đầy đủ căn cứ Locked Behavior và Design Specification.
   - Kiểm tra rà soát trạng thái kho lưu trữ git (`git status`, `git diff`) để chứng minh không có bất kỳ hành vi thực thi mã nguồn hay thay đổi lược đồ database nào xảy ra trong quá trình thực hiện M2.6.
   - Kiểm tra Sổ đăng ký phụ thuộc để đảm bảo không còn bất kỳ mục phụ thuộc nào ở trạng thái `BLOCKING`.
3. **Điều kiện Đạt (PASS Condition — Bắt buộc thỏa mãn đồng thời toàn bộ 12 tiêu chí):**
   - [x] Tiêu chí 1: Đầy đủ 20 sản phẩm thiết kế hệ thống thỏa mãn hợp đồng 6 trường thuộc tính kiến trúc.
   - [x] Tiêu chí 2: Toàn bộ bằng chứng của 9 cổng D-G1 đến D-G9 kế thừa nguyên vẹn từ M2.5 mà không có bất kỳ sự thoái lui nào.
   - [x] Tiêu chí 3: Toàn bộ 6 hợp phần bàn giao của M2.6 đã được biên soạn hoàn chỉnh trong tài liệu bàn giao.
   - [x] Tiêu chí 4: Toàn bộ 7 quyết định thiết kế vật lý Tầng 3 (DD-01..06 và DD-10) được giải quyết dứt điểm trên giấy tờ theo đúng bảng 10 cột.
   - [x] Tiêu chí 5: Khung kế hoạch di chuyển dữ liệu bao quát đầy đủ 8 giai đoạn có thứ tự và nhãn trạng thái rõ ràng.
   - [x] Tiêu chí 6: Phương án hoàn nguyên (Rollback considerations) được thiết lập chi tiết cho từng giai đoạn di chuyển.
   - [x] Tiêu chí 7: Khung kế hoạch kiểm thử bao gồm đầy đủ 18 khung kịch bản chuẩn tắc có gắn nhãn `SKELETON — NOT EXECUTED`.
   - [x] Tiêu chí 8: Danh mục bề mặt API phân loại đầy đủ theo 4 tầng trạng thái và bảo toàn nguyên vẹn hợp đồng `docs/03-api-contract.md`.
   - [x] Tiêu chí 9: Tái xác nhận đầy đủ mô hình an ninh M2.4 (5 vùng an ninh, Zone 5 Privileged Ops, 6 ranh giới, 6 vai trò, SoD, RLS, và 11 sự kiện kiểm toán).
   - [x] Tiêu chí 10: Bảng ánh xạ báo cáo học thuật đồng bộ chính xác với `docs/phase-1-system-design-plan.md` §11; quy tắc chống giả mạo được tuân thủ nghiêm ngặt.
   - [x] Tiêu chí 11: Sổ đăng ký phụ thuộc triển khai và quản trị có đủ 9 trường thông tin và có **0 phụ thuộc `BLOCKING` chưa được giải quyết**.
   - [x] Tiêu chí 12: Tuyệt đối không có bất kỳ hành vi thực thi mã nguồn ứng dụng, schema DDL, migration, RLS deployment, hay chạy test thực tế nào xảy ra.
4. **Điều kiện Không Đạt (FAIL Condition — Kích hoạt nếu vi phạm bất kỳ điểm nào sau đây):**
   - Thiếu bất kỳ hợp phần nào trong 6 hợp phần bàn giao hoặc thiếu Sổ đăng ký phụ thuộc.
   - Bất kỳ quyết định vật lý nào trong 7 quyết định DD-01..06 và DD-10 còn mập mờ hoặc bị bỏ ngỏ buộc kỹ sư triển khai phải tự sáng chế thiết kế.
   - Tồn tại bất kỳ phụ thuộc nào ở trạng thái `BLOCKING` chưa được giải quyết.
   - Có sự mâu thuẫn hay thoái lui đối với các bất biến thiết kế đã được chấp thuận ở các mốc trước.
   - Phát sinh bất kỳ hành động viết mã nguồn runtime, sửa schema, chạy migration, áp dụng RLS SQL thực tế, hoặc chạy kiểm thử mã nguồn.
   - Xuất hiện bất kỳ tuyên bố nào cho rằng hệ thống runtime đã sẵn sàng vận hành sản xuất.
   - Sửa đổi trái phép nội dung hợp đồng `docs/03-api-contract.md`.
5. **Bằng chứng kiểm tra (Evidence):**
   - Hồ sơ bàn giao chi tiết tại tài liệu `docs/phase-1-m2-6-design-handoff.md`.
   - Bảng đối soát Định nghĩa Hoàn thành (DoD Checklist) tại Mục 9.1 dưới đây.
   - Sổ đăng ký phụ thuộc với 0 mục `BLOCKING` tại Mục 8.
   - Kết quả chạy kiểm thử tự động của bộ công cụ kiểm định M2.6 `scratch/verify_m26_handoff.py`.
   - Kết quả kiểm tra git diff xác nhận không có mã nguồn ứng dụng hay schema thay đổi.
6. **Nguồn chân lý (Source of Truth):**
   - `docs/phase-1-system-design-plan.md` §§7, 10, 11, 12, 14.
   - `plans/m2-6-design-handoff-plan.md` (Kế hoạch M2.6 đã được phê chuẩn).
   - `docs/phase-1-m2-5-design-validation.md` (Báo cáo kiểm định Artifact #20).

---

### 9.1. Bảng Đối Soát Định Nghĩa Hoàn Thành (Definition of Done Checklist — §14 Parity)

| Hạng mục DoD (§14) | Yêu Cầu Cụ Thể | Trạng Thái Đáp Ứng Trong M2.6 | Bằng Chứng Xác Thực |
|---|---|---|---|
| **1. 20 Sản phẩm Thiết kế** | Toàn bộ 20 sản phẩm hoàn thành hợp đồng 6 trường | `ĐẠT (PASS)` | Kế thừa từ M2.5 Artifact #20; không sửa đổi |
| **2. 6 Mốc Thiết kế** | M2.1 đến M2.6 hoàn thành đầy đủ phạm vi và tiêu chí xuất xưởng | `ĐẠT (PASS)` | M2.1–M2.5 đã Accepted; M2.6 đã triển khai gói bàn giao |
| **3. Cổng D-G1 đến D-G10** | D-G1..D-G9 có bằng chứng; D-G10 được kiểm định khách quan | `ĐẠT (PASS)` | D-G1..D-G9 từ M2.5; D-G10 được kiểm chứng đầy đủ tại Mục 9 |
| **4. Bất biến Thiết kế** | Bảo toàn locked behavior, chính sách học tập, và ranh giới an ninh | `ĐẠT (PASS)` | Không thay đổi Mapping A, Jump 95%/24h, Retry 70%, SRS, SoD |
| **5. Quyết định Mở DD** | Đóng toàn bộ quyết định vật lý DD-01..06 và DD-10 | `ĐẠT (PASS)` | Đã giải quyết trên giấy tờ dạng 10 cột tại Mục 7 |
| **6. Phân định Trạng Thái** | Phân định rõ ràng Current Applied, Target Design, Future Extension | `ĐẠT (PASS)` | Gắn nhãn trạng thái xuyên suốt 8 phase migration và API register |
| **7. Ma Trận An Ninh** | Ma trận an ninh và nhật ký kiểm toán đầy đủ | `ĐẠT (PASS)` | Tái xác nhận 5 vùng (kèm Zone 5), 6 ranh giới, 6 vai trò, 11 event |
| **8. Phân Loại API** | Toàn bộ bề mặt API được phân loại; hợp đồng 03 không đổi | `ĐẠT (PASS)` | Danh mục API 4 tầng tại Mục 4; `03` byte-identical |
| **9. Truy Vết Yêu Cầu** | Toàn bộ sản phẩm cốt lõi truy vết được về FR/UC/BF | `ĐẠT (PASS)` | Bảng ánh xạ báo cáo học thuật tại Mục 6 |
| **10. Báo Cáo Học Thuật** | Bảng ánh xạ sản phẩm sang chương báo cáo học thuật hoàn tất | `ĐẠT (PASS)` | Bảng đối soát khớp 100% với roadmap §11 |
| **11. Quản Trị Rủi Ro** | Rủi ro có biện pháp giảm thiểu gắn với cổng kiểm định | `ĐẠT (PASS)` | Tích hợp trong khung hoàn nguyên và sổ phụ thuộc |
| **12. Không Trôi Dạt Thiết Kế**| Không còn mâu thuẫn P0/P1 hay trôi dạt yêu cầu | `ĐẠT (PASS)` | Kế thừa kết quả scan sạch của M2.5 D-G9 |
| **13. Không Thực Thi Mã** | Không viết code, schema, migration, RLS SQL, hay chạy test thực tế | `ĐẠT (PASS)` | Xác thực qua lệnh kiểm tra `git status` và `git diff` |

**PHÁN QUYẾT CỔNG D-G10:** **`PASS`**  
*(Xác nhận gói thiết kế đạt chuẩn sẵn sàng bàn giao triển khai; TUYỆT ĐỐI KHÔNG xác nhận tính sẵn sàng vận hành runtime hay sản xuất).*

---

## 10. Current / Target / Future Integrity & Invariant Preservation

Nhằm đảm bảo tính trong sáng của hệ thống quản trị, tài liệu này áp dụng quy tắc phân định trạng thái nhất quán và không khoan nhượng:

1. **Bảo tồn Phân Tầng Trạng Thái:**
   - Mọi thực thể, trường dữ liệu, bề mặt API và giai đoạn di chuyển đều mang một nhãn duy nhất: `CURRENT_APPLIED`, `TARGET_DESIGN`, hoặc `FUTURE_EXTENSION`.
   - Tuyệt đối không sử dụng từ ngữ "đã triển khai" (implemented) cho các nội dung thuộc `TARGET_DESIGN` khi chúng mới chỉ được giải quyết trên phương diện thiết kế (designed on paper).
2. **Kiểm Tra Không Thoái Lui (Zero Regression Check):**
   - 6 vai trò chuẩn tắc: Administrator, Lesson Creator, Moderator, Operations Staff, Learner, Organizational Manager (không có vai trò nghiệp vụ thứ 7).
   - 15 Ca sử dụng (UC-01 đến UC-15) và 15 Luồng nghiệp vụ (BF-01 đến BF-15) nguyên vẹn; UC-15 giữ nhãn mở rộng tùy chọn tương lai.
   - Các chính sách học tập D5–D8 bất biến: Mapping A 6 dải điểm thô (0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6), Skip -> U1, Jump >=95% và hồi chiêu 24h, Jump không hoàn thành bài học, Retry allowance `max(1, floor(N * 0.10))` theo từng lượt bài học và trần điểm 70%, SRS Policy B `[1, 3, 7, 14, 30]`, Streak theo múi giờ địa phương và reset về 1 khi bỏ lỡ.
   - An ninh và phân tách nhiệm vụ: Cấm Creator tự duyệt bài, cấm Moderator xuất bản, cấm nhảy từ IN_REVIEW sang PUBLISHED, Admin xuất bản khẩn cấp chỉ áp dụng cho bài đã APPROVED kèm lý do và ghi audit log `CONTENT_EMERGENCY_PUB`.
   - Vùng an ninh: Đủ 5 vùng an ninh logic, duy trì rõ ràng Zone 5 Privileged Infrastructure Operations.
   - Dịch vụ AI: Hoàn toàn phi trạng thái, không sở hữu dữ liệu tiến độ người dùng, thời gian ngắt kết nối tối đa 8.0s kèm phương án dự phòng.
   - Hợp đồng dịch vụ: `docs/03-api-contract.md` giữ nguyên 100% byte-identical.

---

## 11. Kết Luận Bàn Giao & Trạng Thái Mốc

```text
====================================================================================================
                    LINGORA PHASE 1 MILESTONE M2.6 HANDOFF PACKAGE SUMMARY
====================================================================================================
M2.6 IMPLEMENTATION STATE: IMPLEMENTED — READY FOR INDEPENDENT REVIEW
PRIMARY DELIVERABLE     : docs/phase-1-m2-6-design-handoff.md (Handoff Specification)
OUTPUT 1 — MIGRATION     : 8 Design Phases Defined with Rollback Targets (Design-Only)
OUTPUT 2 — TEST SKELETON : 18 Mandatory Frames Defined (Status: SKELETON — NOT EXECUTED)
OUTPUT 3 — API REGISTER  : 26 Surfaces Classified into 4 Tiers (docs/03 Byte-Identical)
OUTPUT 4 — SECURITY/AUDIT: Reconfirmed (5 Zones incl. Zone 5, 6 Roles, 11 Audit Events)
OUTPUT 5 — REPORT MAPPING: Synced with Roadmap §11; Anti-Fabrication Rule Enforced
OUTPUT 6 — DD CLOSURE    : 7 Decisions Resolved on Paper (Exact 10-Column Schema)
DELIVERABLE 7 — DEPS     : 16 Technical/Governance Dependencies (Exact 9-Field Schema, 0 BLOCKING)
GATE D-G10 VERDICT       : PASS (Implementation Handoff Readiness ONLY; NOT Production Ready)
FORBIDDEN CHANGES        : NONE (Zero runtime code, zero schema/migration DDL, zero RLS SQL)
API CONTRACT PRESERVED   : docs/03-api-contract.md 100% BYTE-IDENTICAL
M2.6 ACCEPTANCE CLAIMED  : NO (Pending human independent review)
GIT COMMIT CREATED       : NO (Commit discipline strictly enforced)
====================================================================================================
```
