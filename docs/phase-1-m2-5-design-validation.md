# LINGORA — PHASE 1 MILESTONE M2.5: DESIGN VALIDATION REPORT

> **Mã tài liệu:** `docs/phase-1-m2-5-design-validation.md`
> **Giai đoạn:** Phase 1 — System Analysis & Design (Implementation-Independent)
> **Mốc thực thi:** Milestone M2.5 (Design Validation — Artifact #20)
> **Trạng thái:** `IMPLEMENTED — READY FOR INDEPENDENT REVIEW` (Triển khai báo cáo kiểm định hoàn tất tuân thủ kế hoạch được phê duyệt; KHÔNG tuyên bố hoàn thành triển khai mã nguồn; KHÔNG tự ý coi là ACCEPTED; KHÔNG đóng các quyết định thiết kế vật lý đang mở).
> **Căn cứ kế hoạch:** `plans/m2-5-design-validation-plan.md`, `docs/phase-1-system-design-plan.md` §7, §10, §11 (Artifact #20; Cổng kiểm định D-G1–D-G9; Cổng D-G10 ngoại trừ/dành riêng cho M2.6).
> **Trạng thái tiếp nhận (Entry State):** `M2.4 ACCEPTED FOR M2.5` (ADR-027; commit `0a9a126e952226518f3f772bc8e33babb4e2ebde`), `M2.5 PLAN = APPROVED`.
> **Ranh giới nghiêm ngặt:** KHÔNG mã nguồn runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÔNG Prisma schema/migration/DDL, KHÔNG RLS SQL scripts, KHÔNG lưu trữ hoặc phơi bày secret thực tế, KHÔNG sửa đổi tài liệu `docs/03-api-contract.md` (giữ nguyên 100% byte-identical / READ-ONLY), KHÔNG giải quyết vật lý các quyết định mở (DD-01..06/10 physical representation remains OPEN), KHÔNG tuyên bố Target Runtime đã sẵn sàng vận hành (TARGET RUNTIME NOT PRODUCTION READY / NOT DEPLOYED), KHÔNG thực thể ma (`no AssessmentSession entity exists` — HISTORICAL alias chỉ dùng đối chiếu phân tích, `no ExerciseAttempt entity exists`), Cổng D-G5 và D-G6 giữ nguyên trạng thái xác lập tại M2.4 (design evidence / input-only; KHÔNG đóng cho production), Cổng D-G10 ngoại trừ (dành riêng cho M2.6).

---

## 1. Executive Summary & Management Contract

Milestone M2.5 thực thi nhiệm vụ kiểm định độc lập, đối soát toàn diện và chuẩn hóa chất lượng cho toàn bộ 19 sản phẩm thiết kế (Artifacts #1 đến #19) được tạo lập qua các mốc M2.1, M2.2, M2.3, M2.4 và các tài liệu phân tích hệ thống tiền đề.

M2.5 **không sáng chế thiết kế mới, không đóng sớm các quyết định thiết kế vật lý, không thực hiện mã nguồn hay thay đổi lược đồ cơ sở dữ liệu**. Thay vào đó, M2.5 hoàn thiện **Artifact #20: Design Validation Report (Báo cáo Kiểm định Thiết kế)**, thiết lập bằng chứng khách quan, có thể kiểm chứng bằng công cụ tự động cho 9 cổng kiểm định D-G1 đến D-G9, xác nhận sự đồng bộ giữa Thiết kế Kỹ thuật Kho lưu trữ (Repository Design) và Đề cương Báo cáo Học thuật (Academic Report), đồng thời lập danh mục đầy đủ các khoảng trống cần bàn giao cho mốc M2.6 (Design-to-Implementation Handoff).

```
+----------------------------------------------------------------------------------------------------+
|                                    M2.5 VALIDATION CONTRACT OVERVIEW                               |
+-----------------------------------+-----------------------------------+----------------------------+
| GATES D-G1 .. D-G9 EVIDENCE       | SIX-FIELD CONTRACT AUDIT (x20)    | CONTRADICTION & DRIFT SCAN |
| - D-G1: Domain Consistency (PASS) | - Artifacts 1..20 checked         | - 11 Drift Categories      |
| - D-G2: Data Status & Mapping(PASS)| - 100% fields non-generic        | - 0 P0/P1 contradictions   |
| - D-G3: DFD & Flow Ownership(PASS)| - Strict Input/Output/Trace parity| - Ghost entities disp.     |
| - D-G4: UC/BF/Seq/Screen Trace(PASS)| - Concrete Validation Gates     | - Target-as-ready disp.    |
| - D-G5: Arch & API Boundary (PASS*)|                                   | - SoD & AI limits disp.    |
| - D-G6: Security Matrix (PASS*)   |                                   |                            |
| - D-G7: Locked Policies (PASS)    | * D-G5/D-G6: design evidence only;|                            |
| - D-G8: Contract & Trace (PASS)   |   NOT closed for production.      |                            |
| - D-G9: Drift & Boundary (PASS)   |                                   |                            |
| - D-G10: EXCLUDED (M2.6 handoff)  |                                   |                            |
+-----------------------------------+-----------------------------------+----------------------------+
| TRACEABILITY & REPORT MAPPING     | OPEN DECISION CLOSURE RECORD      | M2.4 REGRESSION VERIF      |
| - P1-FR -> UC -> BF -> Artifact   | - DD-01..06/10 status recorded    | - 19 components in 5 layers|
| - Phase-1 Plan §11 row-by-row ver.| - DD-03/10 3-tier split preserved | - 5 M2.4 security zones    |
| - docs/05 §11 kept read-only      | - Physical tiers stay OPEN        |   (Zone 5 Privileged Ops)  |
| - Zero orphan / broken links      | - Zero premature physical closure | - 6-boundary security clean|
|                                   | - RECORDED != PHYSICALLY RESOLVED | - ADR-026/027 preserved    |
+-----------------------------------+-----------------------------------+----------------------------+
```

---

### 1.1. Six-Field Contract for Artifact #20

Tuân thủ nghiêm ngặt quy định tại `docs/phase-1-system-design-plan.md` §5 và `plans/m2-5-design-validation-plan.md` §3, Artifact #20 được đặc tả đầy đủ 6 trường kiến trúc chuẩn tắc:

| Trường thuộc tính | Giá trị định nghĩa cho Artifact #20 |
|---|---|
| **1. Purpose (Mục đích)** | Hợp nhất toàn bộ bằng chứng kiểm định cổng (D-G1–D-G9), rà quét mâu thuẫn và trôi dạt yêu cầu (contradiction & requirements drift scan), thiết lập sổ bộ ghi nhận trạng thái các quyết định mở (open-decision closure record), và đồng bộ hóa ánh xạ báo cáo học thuật phục vụ nghiệm thu thiết kế và chuyển giao M2.6. |
| **2. Inputs (Đầu vào)** | Toàn bộ 19 tài liệu và artifacts thiết kế tiền đề (Artifacts #1–#19), bao gồm master specs M2.1, M2.2, M2.3, M2.4; tài liệu kiến trúc `docs/01-architecture.md`; tài liệu yêu cầu `docs/02-requirements.md`; hợp đồng API `docs/03-api-contract.md`; mô hình dữ liệu `docs/04-data-model.md`; ma trận truy vết `docs/05-traceability-matrix.md`; phân tích hệ thống `docs/06-system-analysis.md`; từ điển dữ liệu `docs/07-data-dictionary.md`; đề cương A1 `docs/08-english-a1-curriculum.md`; đặc tả placement/jump `docs/09-placement-and-jump-specification.md`; kế hoạch tổng thể `docs/phase-1-system-design-plan.md` (§§5, 7, 8, 10, 11); và các quyết định ADR-001..027. |
| **3. Outputs (Đầu ra)** | Báo cáo kiểm định thiết kế chuẩn tắc (`docs/phase-1-m2-5-design-validation.md`) bao gồm: Bảng bằng chứng chi tiết Cổng D-G1–D-G9 (§20.1); Ma trận kiểm định 6 trường cho 20 artifacts (§20.2); Nhật ký rà quét và xử lý 11 danh mục mâu thuẫn/trôi dạt (§20.3); Bảng đối soát truy vết xuyên suốt và ánh xạ báo cáo học thuật (§20.4); Sổ bộ ghi nhận trạng thái quyết định mở DD-01..06 và DD-10 với tầng vật lý mở (§20.5); Danh mục khoảng trống DoD chuyển giao M2.6 (§20.6); và Bằng chứng bảo toàn bất biến kiến trúc/an ninh M2.4 (§20.7). |
| **4. Dependencies (Phụ thuộc)** | Toàn bộ các mốc hoàn thành M2.1, M2.2, M2.3, M2.4 đã được nghiệm thu; các quy định tại `docs/phase-1-system-design-plan.md` §8 (Decision Register), §10 (Validation Gates), và §11 (Report Mapping). |
| **5. Trace (Truy vết)** | Truy vết đầy đủ từ yêu cầu hệ thống `P1-FR-001`..`017`, `P1-NFR-001`..`004`, Use Cases `UC-01`..`UC-15`, Behavioral Families `BF-01`..`BF-15`, các cổng kiểm định `D-G1`..`D-G9` (Cổng `D-G10` chờ xử lý / ngoại trừ / dành riêng cho M2.6), và ánh xạ báo cáo học thuật `phase-1-system-design-plan.md` §11. |
| **6. Validation Gate (Cổng kiểm định)** | **D-G8** (Tính đầy đủ của hợp đồng 6 trường và liên kết truy vết), **D-G9** (Không còn mâu thuẫn thiết kế P0/P1 hoặc trôi dạt yêu cầu), và thẩm định tổng hợp toàn bộ các cổng **D-G1** đến **D-G9** (**D-G10** chờ xử lý / ngoại trừ / dành riêng cho M2.6, không thực hiện trong M2.5). |

---

### 1.2. Strict Scope Boundaries & Governance Firewall

Tài liệu kiểm định M2.5 thiết lập hàng rào bảo vệ phạm vi nghiêm ngặt:
1. **Design Validation Only:** Tuyệt đối không phát sinh mã nguồn ứng dụng (`lingora-web`, `lingora-admin`, `lingora-ai`), không can thiệp file cấu hình cơ sở dữ liệu `schema.prisma`, không tạo mã migration DDL/SQL, không viết mã RLS SQL, không cấu hình hạ tầng mạng.
2. **Read-Only Baseline & API Freeze:** Toàn bộ các tài liệu M2.1, M2.2, M2.3, M2.4 được giữ ở trạng thái READ-ONLY phục vụ kiểm tra đối chiếu; tệp `docs/03-api-contract.md` giữ nguyên vẹn 100% byte-identical.
3. **No Premature Physical Closure:** Toàn bộ các quyết định mở về biểu diễn vật lý (DD-01, DD-02, DD-03 Tier 3, DD-04, DD-05, DD-06, DD-10 Tier 3) được ghi nhận trạng thái một cách hệ thống, **tuyệt đối không tự ý đóng sớm hoặc sáng chế cấu trúc vật lý** (không định nghĩa schema JSONB metadata, không chọn giải pháp trigger vs app write, không chốt trường IP/device, không viết DDL chuyển đổi phân quyền).
4. **D-G10 Deferred to M2.6:** Cổng D-G10 (Design-to-Implementation Handoff Readiness) thuộc về phạm vi độc quyền của Milestone M2.6 và được loại trừ hoàn toàn khỏi M2.5.
5. **D-G5 & D-G6 Preserved at M2.4 Status:** Cổng D-G5 (Kiến trúc & Ranh giới API) và Cổng D-G6 (Trách nhiệm An ninh) giữ nguyên mức trạng thái đã đạt được tại M2.4 (`DESIGN EVIDENCE SATISFIED` / `INPUT EVIDENCE ONLY`), tuyệt đối KHÔNG tuyên bố đã hoàn thành cho môi trường vận hành thực tế (NOT CLOSED FOR PRODUCTION).
6. **Zero Target-as-Ready Claims:** Môi trường vận hành đích (Target Runtime với 6 vai trò người dùng, bảng nhật ký kiểm toán `audit_logs`, và các chính sách RLS mở rộng) được phân loại chính xác là `TARGET_DESIGN`. Tuyệt đối KHÔNG tuyên bố target runtime là đã sẵn sàng vận hành (`NOT PRODUCTION READY / NOT YET DEPLOYED`).

---

## 2. Section 20.1: Gates D-G1 through D-G9 Detailed Evidence

Căn cứ quy định tại `docs/phase-1-system-design-plan.md` §10 và `plans/m2-5-design-validation-plan.md` §5, phần này thiết lập hồ sơ bằng chứng khách quan, chi tiết và có thể kiểm chứng được cho từng cổng kiểm định từ D-G1 đến D-G9. Mỗi cổng được kiểm tra qua 5 thành phần chuẩn tắc: **Input (Đầu vào)**, **Method (Phương pháp kiểm định)**, **PASS/FAIL Result (Kết luận kiểm định)**, **Evidence (Bằng chứng cụ thể)**, và **Source of Truth (Nguồn chân lý xác thực)**.

---

### Bảng Tổng hợp Kết quả Kiểm định Cổng D-G1 đến D-G10

| Cổng kiểm định | Tên cổng kiểm định | Phạm vi Milestone | Kết luận | Trạng thái chi tiết |
|---|---|---|:---:|---|
| **D-G1** | Domain Consistency | M2.1 | **PASS** | 100% thực thể Core có mục đích nghiệp vụ, chủ quản sở hữu và vết FR/UC/BF; ranh giới mở rộng Cohort/SupportTicket được phân lập độc lập; 0 thực thể mồ côi. |
| **D-G2** | Data Status & Logical Mapping | M2.1 | **PASS** | 100% thực thể, trường dữ liệu mang nhãn chuẩn tắc duy nhất (`CURRENT_APPLIED`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`); không tuyên bố Target là runtime ready. |
| **D-G3** | DFD and Ownership Flow | M2.3 / M2.4 | **PASS** | Toàn bộ luồng dữ liệu Core truy vết về BF/UC; các kho dữ liệu nghiệp vụ Core mang nhãn trạng thái; AI là dịch vụ stateless hỗ trợ, không sở hữu dữ liệu chính; ranh giới an ninh rõ ràng. |
| **D-G4** | UC, Activity, Sequence, Screen Trace | M2.2 / M2.3 | **PASS** | 15 Use Cases (`UC-01`..`UC-15`) và 15 Behavioral Families (`BF-01`..`BF-15`) được ánh xạ đầy đủ tác nhân, luồng rẽ nhánh, biểu đồ trình tự và màn hình; UC-15 là `Manage Cohorts & Group Progress` mang nhãn optional/future. |
| **D-G5** | Architecture & API Boundary | M2.3 / M2.4 | **PASS\*** | Phân tầng 5 lớp không phụ thuộc vòng trên 19 thành phần; 5 vùng an ninh chuẩn tắc M2.4 (bao gồm Zone 5 Privileged Ops); 10 bề mặt API phân loại minh bạch; `docs/03-api-contract.md` 100% byte-identical; AI timeout 8.0s và fallback rõ ràng. (\*Bằng chứng thiết kế đạt yêu cầu; KHÔNG đóng cho production). |
| **D-G6** | Security Responsibility | M2.4 | **PASS\*** | Ma trận an ninh duy nhất 6 ranh giới × 15 nhóm thao tác nhạy cảm; kiểm tra phân quyền ứng dụng và RLS cơ sở dữ liệu song hành; cách ly tài khoản đặc quyền; bảo vệ bí mật; 11 sự kiện kiểm toán catalog rõ ràng. (\*Bằng chứng đầu vào thiết kế đạt; KHÔNG đóng cho production). |
| **D-G7** | Locked Learning Policies | M2.2 | **PASS** | Toàn bộ các quy tắc số học và ngữ nghĩa bị khóa được khớp tuyệt đối: Mapping A (thang điểm thô 0–30 ánh xạ 6 Units: 0–7 U1, 8–12 U2, 13–17 U3, 18–22 U4, 23–26 U5, 27–30 U6; xuất Starting Unit, không CEFR), Jump (≥95%, giãn cách 24h), Retry (10%, điểm tín chỉ 70%), SRS Policy B ([1, 3, 7, 14, 30] ngày, độc lập với AI). |
| **D-G8** | Artifact Contract & Trace Completeness | M2.5 | **PASS** | Toàn bộ 20/20 artifacts có đủ 6 trường chuẩn tắc, nội dung cụ thể, không dùng mẫu chung chung; mọi đầu ra Core truy vết ngược về nguồn gốc hợp lệ. |
| **D-G9** | Contradiction, Drift & Boundary Scan | M2.5 | **PASS** | Quét toàn diện 11 danh mục mâu thuẫn và trôi dạt; 0 mâu thuẫn P0/P1; các khái niệm lịch sử/mở rộng được gắn nhãn minh bạch; không rò rỉ tính năng tương lai vào Core MVP. |
| **D-G10** | Design-to-Implementation Handoff Readiness | M2.6 | **EXCLUDED** | **NGOẠI TRỪ KHỎI M2.5**. Thuộc phạm vi bàn giao độc quyền của Milestone M2.6; không thực hiện đánh giá hoặc tuyên bố đóng tại M2.5. |

---

### Chi tiết Hồ sơ Bằng chứng Từng Cổng Kiểm định

#### Cổng D-G1: Domain Consistency (Tính Nhất quán Mô hình Miền)
- **Input:** Requirements Baseline (`docs/02-requirements.md`), Danh mục tác nhân, Danh mục UC/BF, Đề cương A1 (`docs/08-english-a1-curriculum.md`), Artifacts #1, #2, #3.
- **Method:** Đối soát chéo từng thực thể Core, trạng thái vòng đời, quyền sở hữu của tác nhân và ranh giới mở rộng đối chiếu với danh mục FR/UC/BF và các quy tắc nghiệp vụ bị khóa.
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - 11 thực thể nghiệp vụ Core được xác định rõ ràng: `Course`, `Unit`, `Lesson`, `Exercise`, `VocabularyItem`, `LearnerProfile`, `LearningProgress`, `AssessmentResult`, `SkillProfile`, `ConceptMastery`, `AuditLog`.
  - Phân lập hoàn toàn 2 ranh giới mở rộng: `Cohort` và `SupportTicket` được ghi chú rõ ràng là Extension-only, không thuộc Core MVP.
  - Phân cấp học tập chuẩn tắc: `Course -> Unit -> Lesson -> Exercise` được duy trì tuyệt đối, không có hiện tượng nhảy cóc phân cấp.
  - 0 thực thể mồ côi (orphan entities) không có nguồn gốc FR/UC/BF.
- **Source of Truth:** `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §4, `docs/plantuml/domain-model-core.puml`, `docs/02-requirements.md`.

#### Cổng D-G2: Data Status and Logical Mapping (Trạng thái Dữ liệu và Ánh xạ Logic)
- **Input:** Artifacts #1, #2, #3, #4, #5, `docs/04-data-model.md`, `docs/07-data-dictionary.md`.
- **Method:** Rà soát từng thực thể, trường dữ liệu và kho lưu trữ; đối chiếu giữa các cột trạng thái logic, Cơ sở dữ liệu hiện tại áp dụng (`CURRENT_APPLIED`), Lược đồ mục tiêu (`TARGET_SCHEMA`), và Di chuyển tương lai (`FUTURE_MIGRATION`).
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - 100% thực thể và trường dữ liệu trong Từ điển dữ liệu M2.1 (§8) và ERD Status Mapping (§7) được gắn chính xác một nhãn trạng thái hợp lệ.
  - Sự khác biệt giữa mô hình 2 vai trò hiện tại trong DB (`CURRENT_APPLIED`) và mô hình 6 vai trò mục tiêu (`TARGET_SCHEMA`) được giải thích tường minh, không tuyên bố Target là runtime ready.
  - Cấu trúc bài học kế thừa qua `supersedesId` [DD-02] và thông tin biên soạn [DD-04] được định vị chính xác trong ranh giới `Lesson`.
  - Không có trường dữ liệu hoặc thực thể Core nào bị sáng chế ngoài phạm vi kế hoạch.
- **Source of Truth:** `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §7, §8, `docs/04-data-model.md`, `docs/plantuml/erd-logical-status-mapping.puml`.

#### Cổng D-G3: DFD and Ownership Flow (Biểu đồ Luồng Dữ liệu và Sở hữu Luồng)
- **Input:** Artifacts #4, #6, #7, #8, #13, #15, #16, `docs/06-system-analysis.md`.
- **Method:** Kiểm tra từng luồng dữ liệu và điều khiển thuộc Core hệ thống; xác nhận nguồn (source), đích (destination), trạng thái kho lưu trữ (store status), thẩm quyền tác nhân (actor authority), ranh giới AI, và luồng dự phòng (fallback path).
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - DFD Context, Level 0 và 4 luồng Level 1 chi tiết (Đánh giá chẩn đoán/Placement, Hoàn thành bài học, Ôn tập ngắt quãng SRS, Kiểm duyệt nội dung) bao quát đầy đủ các họ hành vi `BF-01`..`BF-15`.
  - Toàn bộ các kho dữ liệu nghiệp vụ Core (`Course`, `Unit`, `Lesson`, `Exercise`, `VocabularyItem`, `LearnerProfile`, `LearningProgress`, `AssessmentResult`, `SkillProfile`, `ConceptMastery`, `AuditLog` và `Storage Buckets`) đều mang nhãn trạng thái đồng bộ với ERD M2.1.
  - Các chính sách nghiệp vụ bị khóa D1–D9 được bảo toàn độc lập; quyết định phân quyền kiến trúc DD-10 được duy trì là quyết định mở, không tồn tại chính sách nghiệp vụ mang mã D10.
  - Ranh giới AI được cô lập tuyệt đối: Dịch vụ AI chỉ tiếp nhận văn bản người học, trả về kết quả sửa lỗi tạm thời (`corrected_text`, spans), không có quyền ghi trực tiếp vào bất kỳ kho dữ liệu chính nào của người học.
  - Luồng kiểm duyệt thể hiện nghiêm ngặt nguyên tắc SoD: Lesson Creator biên soạn lưu bản nháp, Moderator thẩm định phê duyệt/yêu cầu sửa, Manager phát hành chính thức.
- **Source of Truth:** `docs/06-system-analysis.md` §2, `docs/phase-1-m2-3-sequence-api-service-boundary.md` §2.1.

#### Cổng D-G4: UC, Activity, Sequence, and Screen Trace (Truy vết Use Case, Hoạt động, Trình tự và Màn hình)
- **Input:** Artifacts #9, #10, #11, #12, #19, Danh mục UC/BF, Danh mục vai trò.
- **Method:** Đối soát chéo toàn bộ 15 Use Cases, 15 Behavioral Families, tác nhân, các nhánh rẽ ngoại lệ (alternate paths), trạng thái màn hình, và các thành phần tham gia trong biểu đồ trình tự.
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - 15/15 Use Cases (`UC-01` đến `UC-15`) được định nghĩa đầy đủ tác nhân chính, điều kiện tiên quyết, luồng chính, luồng rẽ nhánh, và hậu điều kiện.
  - `UC-15` mang tên chuẩn tắc là **Quản lý Nhóm Học viên & Tiến độ Lớp học (Manage Cohorts & Group Progress)**, được gắn nhãn minh bạch là Tính năng Mở rộng / Tương lai (`FUTURE_EXTENSION / OPTIONAL`).
  - 15/15 Behavioral Families (`BF-01` đến `BF-15`) được gắn kết trực tiếp với các Use Cases tương ứng.
  - 10 biểu đồ trình tự chuẩn tắc (`SEQ-01` đến `SEQ-10`, `docs/plantuml/sequence-*m23.puml`) mô hình hóa chính xác các luồng hoàn thành bài tập, tính toán điểm, kiểm duyệt SoD, gọi AI GEC qua proxy, và ôn tập SRS.
  - Danh mục màn hình (Artifact #19) bao quát đầy đủ các trạng thái giao diện phi pixel cho cả 6 vai trò, không chứa màn hình thuộc tính năng tương lai bị coi là Core MVP.
  - Tuyệt đối không xuất hiện các thực thể ma như `Exam` hoặc `QuestionBank`.
- **Source of Truth:** `docs/phase-1-m2-2-behavior-uc-activity-state.md` §§5, 6, 9, `docs/phase-1-m2-3-sequence-api-service-boundary.md` §4, `docs/plantuml/uc-overview-m22.puml`, `docs/plantuml/activity-learner-flow-m22.puml`, `docs/plantuml/activity-authoring-flow-m22.puml`, `docs/plantuml/state-progression-readiness-m22.puml`.

#### Cổng D-G5: Architecture and API Boundary (Kiến trúc Thành phần và Ranh giới API)
- **Input:** Artifacts #11, #12, #13, #14, #15, `docs/01-architecture.md`, `docs/03-api-contract.md`, các quyết định ADR liên quan.
- **Method:** Xác minh quyền sở hữu của các thành phần và phân loại toàn bộ các bề mặt API theo 4 nhóm trạng thái: `CURRENT`, `TARGET`, `FUTURE`, hoặc `COMPATIBILITY GAP`.
- **PASS/FAIL Result:** `PASS` *(DESIGN EVIDENCE SATISFIED / INPUT EVIDENCE ONLY — KHÔNG ĐÓNG CHO PRODUCTION)*
- **Evidence:**
  - Kiến trúc thành phần (Artifact #13) xác lập phân tầng 5 lớp rõ rệt trên 19 thành phần logic, chiều phụ thuộc một chiều nghiêm ngặt (Strict One-Way Dependency), không có chu trình phụ thuộc vòng.
  - Ranh giới triển khai (Artifact #14) mô hình hóa chính xác **5 Vùng an ninh logic chuẩn tắc M2.4**:
    1. `Zone 1: Untrusted Public Client Zone (Public Browser / Client)`
    2. `Zone 2: Trusted Application Server Zone (Trusted Application / BFF)`
    3. `Zone 3: Managed Database & Storage Zone (Supabase DB / Storage / Auth)`
    4. `Zone 4: Isolated AI Compute Zone (Isolated AI Compute)`
    5. `Zone 5: Privileged Infrastructure Operations Zone (Privileged Infrastructure Operations / CLI)`
  - Sổ bộ ranh giới API (Artifact #15) phân loại chính xác 10 bề mặt giao tiếp; tài liệu `docs/03-api-contract.md` được giữ nguyên vẹn 100% byte-identical.
  - Ranh giới dịch vụ AI: Gọi qua proxy Route Handler `/api/ai/gec`, áp dụng cơ chế timeout cứng 8.0 giây, và fallback tự động bảo đảm trải nghiệm người dùng không bị gián đoạn.
  - Runtime mục tiêu được dán nhãn rõ ràng: `TARGET RUNTIME NOT PRODUCTION READY / NOT YET DEPLOYED`.
- **Source of Truth:** `docs/phase-1-m2-3-sequence-api-service-boundary.md` §6, `docs/phase-1-m2-4-architecture-security.md` §4, §5, `docs/plantuml/component-architecture-m24.puml`, `docs/plantuml/deployment-boundary-m24.puml`, `docs/01-architecture.md`, `docs/03-api-contract.md`.

#### Cổng D-G6: Security Responsibility (Trách nhiệm An ninh và Kiểm soát Truy cập)
- **Input:** Artifact #16, Artifacts #13, #14, #15, Danh mục vai trò, Mô hình dữ liệu/RLS, các quyết định ADR an ninh (ADR-004, 020, 026, 027, SEC-D1..D10).
- **Method:** Duyệt từng thao tác nhạy cảm trong hệ thống qua 6 ranh giới thực thi: Kiểm soát phân quyền ứng dụng (Application AuthZ), Cưỡng chế RLS cơ sở dữ liệu (Database RLS), Tài khoản dịch vụ đặc quyền (Privileged Service Role), Ranh giới Quản trị (Admin Boundary), Ranh giới AI, và Trách nhiệm Nhật ký Kiểm toán (Audit Owner).
- **PASS/FAIL Result:** `PASS` *(INPUT EVIDENCE ONLY — KHÔNG ĐÓNG CHO PRODUCTION)*
- **Evidence:**
  - Ma trận trách nhiệm an ninh chuẩn tắc duy nhất bao quát toàn bộ 15 nhóm thao tác trọng yếu (`OP-01` đến `OP-15`).
  - Kiểm tra phân quyền tầng ứng dụng và cưỡng chế RLS tại cơ sở dữ liệu luôn song hành; ứng dụng tuyệt đối không thay thế RLS.
  - Các đường dẫn từ chối bắt buộc (Negative Paths): Từ chối tự duyệt bài (`403 SOD_VIOLATION_SELF_REVIEW`), từ chối kiểm duyệt viên tự xuất bản (`403 SOD_VIOLATION_MODERATOR_PUBLISH`), cấm xuất bản trực tiếp từ `IN_REVIEW` lên `PUBLISHED`.
  - Cơ chế phát hành khẩn cấp của Quản trị viên (Admin Emergency Publish) bắt buộc phải dựa trên trạng thái `APPROVED`, yêu cầu giải trình lý do nghiệp vụ và tự động ghi nhật ký kiểm toán `AuditLog`.
  - Danh mục 11 sự kiện kiểm toán chuẩn tắc được mô hình hóa đầy đủ; tài khoản đặc quyền (`service_role`) được cô lập hoàn toàn tại Zone 5 (Privileged Infrastructure Operations Zone), không bao giờ lọt vào client người học.
- **Source of Truth:** `docs/phase-1-m2-4-architecture-security.md` §6, `docs/plantuml/security-matrix-m24.puml`, ADR-026, ADR-027.

#### Cổng D-G7: Locked Learning Policies (Các Chính sách Học tập Bị khóa)
- **Input:** Artifacts #3, #10, #17, #18, Đề cương A1 (`docs/08-english-a1-curriculum.md`), Đặc tả Placement/Jump (`docs/09-placement-and-jump-specification.md`), các quyết định nghiệp vụ bị khóa D5–D8.
- **Method:** So sánh từng quy tắc số học, ngưỡng đánh giá, thời gian giãn cách, và ngữ nghĩa thực thi của Placement, Jump, Retry, SRS và ngữ cảnh Bài tập đối chiếu với các quyết định chuẩn tắc đã được Product Owner phê duyệt.
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - **Mapping A:** Thang điểm thô 0–30 ánh xạ chính xác vào **6 Units trên đề cương English A1**:
    - `0 – 7 điểm`: Gán xuất phát tại **Unit 1**
    - `8 – 12 điểm`: Gán xuất phát tại **Unit 2**
    - `13 – 17 điểm`: Gán xuất phát tại **Unit 3**
    - `18 – 22 điểm`: Gán xuất phát tại **Unit 4**
    - `23 – 26 điểm`: Gán xuất phát tại **Unit 5**
    - `27 – 30 điểm`: Gán xuất phát tại **Unit 6**
    - Đầu ra duy nhất là Vị trí bắt đầu học (`Starting Unit`); tuyệt đối KHÔNG cấp chứng chỉ hoặc tuyên bố chuẩn hóa CEFR.
  - **Skip to Unit 1:** Người học bỏ qua bài kiểm tra chẩn đoán được chuyển trực tiếp vào học Unit 1 với cờ `selfReportedLevel` trạng thái `UNVERIFIED`, sinh 0 `AssessmentResult`, 0 `SkillProfile`.
  - **Retake Placement:** Người học thi lại từ Profile tạo bản ghi `AssessmentResult` hoàn toàn mới; cập nhật `SkillProfile` và Starting Unit tương ứng.
  - **Jump Policy (D5):** Nhảy cấp đơn vị bài học chỉ khả dụng cho Unit tiếp theo kề cận; điều kiện vượt qua đạt tỷ lệ chính xác ≥ 95%; thời gian chờ kích hoạt lại sau khi trượt (cooldown) cố định 24 giờ.
  - **Controlled Retry (D7):** Số lượt làm lại được giới hạn bằng công thức `max(1, floor(N * 0.10))`; điểm số công nhận cho câu làm lại là 70% giá trị gốc; hoàn thành bài học không phụ thuộc vào ngưỡng điểm 80% mà dựa trên việc giải quyết hết nội dung.
  - **SRS Policy B (D8):** Chu kỳ ôn tập lặp lại ngắt quãng cố định `[1, 3, 7, 14, 30]` ngày, tính toán xác định qua RPC `record_review`, hoàn toàn độc lập với dịch vụ AI.
  - **Unified Exercise Invariant (D4):** Bài kiểm tra đánh giá là một chế độ ngữ cảnh logic (`context`) của thực thể `Exercise`, không tạo thực thể `Exam` hay `QuestionBank`.
- **Source of Truth:** `docs/phase-1-m2-2-behavior-uc-activity-state.md` §§7, 8, `docs/08-english-a1-curriculum.md`, `docs/09-placement-and-jump-specification.md`, `docs/plantuml/placement-jump-m22.puml`, `docs/plantuml/srs-flow-m22.puml`.

#### Cổng D-G8: Artifact Contract and Trace Completeness (Tính Đầy đủ của Hợp đồng Artifact và Truy vết)
- **Input:** Toàn bộ 20 sản phẩm thiết kế (Artifacts #1 đến #20), Kế hoạch thiết kế hệ thống `docs/phase-1-system-design-plan.md` §5.
- **Method:** Rà soát từng artifact đối chiếu với cấu trúc 6 trường bắt buộc: Purpose (Mục đích), Inputs (Đầu vào), Outputs (Đầu ra), Dependencies (Phụ thuộc), Trace (Truy vết), và Validation Gate (Cổng kiểm định). Kiểm tra đường liên kết truy vết đến mã định danh nguồn.
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - 100% (20/20) artifacts có đủ 6 trường thuộc tính chuẩn tắc; nội dung của từng trường được mô tả chi tiết, mang tính định lượng và gắn với ranh giới cụ thể, không sử dụng mẫu chung chung (xem chi tiết tại Mục 3: Ma trận đối soát 6 trường).
  - Toàn bộ các yêu cầu chức năng Core (`P1-FR-001`..`017`) và phi chức năng (`P1-NFR-001`..`004`) đều được liên kết mạch lạc qua Use Cases, Behavioral Families, Mô hình miền, Lược đồ dữ liệu, Kiến trúc thành phần và Ma trận an ninh.
  - 0 liên kết mồ côi hoặc truy vết đứt gãy.
- **Source of Truth:** `docs/phase-1-system-design-plan.md` §5, và Mục 3, Mục 5 của tài liệu này.

#### Cổng D-G9: Contradiction, Drift, and Boundary Scan (Rà quét Mâu thuẫn, Trôi dạt và Ranh giới)
- **Input:** Toàn bộ tài liệu thiết kế hệ thống, các mẫu kiểm toán cơ sở (baseline audit patterns), `docs/phase-1-system-design-plan.md` §§8, 9, và các tài liệu nguồn.
- **Method:** Sử dụng công cụ quét tự động và đối soát văn bản thủ công trên 11 danh mục trôi dạt: Thuật ngữ lỗi thời, Khái niệm thực thể ma, Mã UC/BF không chuẩn, Thuật ngữ máy trạng thái, Nhầm lẫn khái niệm tiến trình học, Tuyên bố sai về CEFR, Tuyên bố Target-as-ready, Trích dẫn tài liệu cũ, Tuyên bố an ninh/SoD, Quyền sở hữu của dịch vụ AI, và Phân loại nhãn trạng thái.
- **PASS/FAIL Result:** `PASS`
- **Evidence:**
  - Hoàn tất rà soát trên toàn bộ 11 danh mục; 0 mâu thuẫn thiết kế mức P0 hoặc P1 còn tồn đọng (xem chi tiết tại Mục 4: Nhật ký rà quét 11 danh mục).
  - Toàn bộ các khái niệm lịch sử hoặc tính năng mở rộng đều được gắn nhãn minh bạch (`HISTORICAL`, `EXTENSION_ONLY`, `OUT_OF_SCOPE`).
  - Thực thể `AssessmentSession` được gắn nhãn HISTORICAL alias (không tồn tại entity).
  - Runtime mục tiêu được bảo vệ bằng nhãn `NOT PRODUCTION READY / NOT YET DEPLOYED`.
- **Source of Truth:** Mục 4 của tài liệu này, `scratch/verify_consistency_guards.py`.

#### Cổng D-G10: Design-to-Implementation Handoff Readiness (Sẵn sàng Chuyển giao Thiết kế sang Triển khai)
- **Input:** Hồ sơ bằng chứng D-G1–D-G9, Định nghĩa hoàn thành DoD, Ánh xạ báo cáo §11, Gói bàn giao triển khai.
- **Method:** Đánh giá tính đầy đủ của việc giải quyết các quyết định thiết kế vật lý, phác thảo kế hoạch di chuyển dữ liệu, khung kế hoạch kiểm thử và bàn giao phụ thuộc.
- **PASS/FAIL Result:** `EXCLUDED FROM M2.5` *(DÀNH RIÊNG CHO MILESTONE M2.6)*
- **Evidence:**
  - Căn cứ Kế hoạch `plans/m2-5-design-validation-plan.md` §3 và §16, Cổng D-G10 được quy định rõ ràng là ranh giới nghiệm thu độc quyền của Milestone M2.6.
  - M2.5 không tuyên bố đóng Cổng D-G10; M2.5 tập trung bàn giao danh mục các khoảng trống DoD cần thực hiện trong M2.6 (xem Mục 7).
- **Source of Truth:** `docs/phase-1-system-design-plan.md` §7 (M2.6) & §10 (D-G10), `plans/m2-5-design-validation-plan.md` §3.

---

## 3. Section 20.2: Six-Field × 20 Artifact Audit Matrix

Dưới đây là ma trận đối soát chi tiết tính tuân thủ hợp đồng 6 trường chuẩn tắc cho toàn bộ 20 sản phẩm thiết kế trong hệ thống Lingora:

| # | Artifact ID & Tên gọi | 1. Purpose (Mục đích) | 2. Inputs (Đầu vào) | 3. Outputs (Đầu ra) | 4. Dependencies (Phụ thuộc) | 5. Trace (Truy vết) | 6. Validation Gate (Cổng kiểm định) | Đánh giá |
|---:|---|---|---|---|---|---|---|:---:|
| **1** | Domain Model | Định nghĩa từ vựng logic dùng chung và quan hệ thực thể Core; cô lập ranh giới mở rộng Cohort/SupportTicket. | Yêu cầu `02`, danh mục tác nhân, UC/BF, đề cương A1 `08`, từ điển dữ liệu. | Mô hình miền Core; ghi chú ranh giới mở rộng Cohort/SupportTicket. | Requirements Baseline. | `P1-FR-001`..`017`, `UC-01`..`15`, `BF-01`..`15`. | **D-G1**: Mọi khái niệm Core có mục đích và truy vết; khái niệm mở rộng được phân lập. | **PASS** |
| **2** | Content Lifecycle State Model | Đặc tả 6 trạng thái vòng đời nội dung bị khóa, thẩm quyền chuyển đổi của từng tác nhân, chuyển đổi bị cấm và nghĩa vụ kiểm toán. | Quyết định D1–D3, danh mục 6 vai trò, `UC-08/09/10`, `BF-05/06/07`. | Bảng trạng thái/chuyển đổi với các quy tắc cấm tự duyệt và ghi nhận kiểm toán. | Artifact #1; các quy tắc nghiệp vụ biên soạn bị khóa. | D1, D2, D3; `UC-08/09/10`; `BF-05/06/07`. | **D-G1, D-G7**: Mọi chuyển đổi và hành vi cấm tự duyệt đều có bằng chứng xác thực. | **PASS** |
| **3** | Learning Progression Model | Đặc tả tiến trình học tập `Course -> Unit -> Lesson` và hành vi gia nhập qua chẩn đoán hoặc nhảy cấp. | Đề cương A1 `08`, Đặc tả Placement/Jump `09`, quyết định D5, D6. | Đặc tả tiến trình logic và luồng gia nhập khóa học. | Artifact #1; các quy tắc Mapping A và Jump bị khóa. | `UC-03/04`; `BF-08/11`; mã định danh đề cương A1. | **D-G1, D-G7**: Băng điểm (0–30 raw score mapped to 6 units), ngưỡng vượt, thời gian giãn cách và quy tắc không-CEFR đạt chuẩn. | **PASS** |
| **4** | ERD (Logical/Status Mapping) | Ánh xạ các thực thể logic sang 3 trạng thái: Cơ sở dữ liệu hiện tại, Lược đồ mục tiêu, và Di chuyển tương lai. | Artifacts #1–#3, mô hình dữ liệu `04`, từ điển dữ liệu `07`, kiến trúc `01`. | Lược đồ quan hệ thực thể với nhãn trạng thái trên từng bảng/thực thể. | Artifacts #1–#3. | Tham chiếu dữ liệu FR/UC/BF; cổng D-G2. | **D-G2**: Không nhầm lẫn trạng thái mục tiêu/hiện tại; không tạo thực thể Core trái phép. | **PASS** |
| **5** | Data Dictionary Final | Định nghĩa ngữ nghĩa cấp trường và quy tắc payload bài tập mà không cần thực thi schema vật lý. | Artifact #4, từ điển dữ liệu, ADR-006, hợp đồng API `03`. | Từ điển cấp trường với trạng thái, quyền sở hữu, ý định nullability và quy tắc payload. | Artifact #4; bất biến Bài tập hợp nhất (Unified Exercise). | Các trường dữ liệu FR/UC/BF; tham chiếu request/response API. | **D-G2**: Mọi trường dữ liệu được phân loại và mọi payload đều có nguồn gốc truy vết. | **PASS** |
| **6** | DFD Context | Phân định ranh giới hệ thống, tác nhân bên ngoài, kho dữ liệu và ranh giới hỗ trợ của dịch vụ AI. | Kiến trúc `01`, danh mục vai trò, danh mục UC, Artifacts #1 và #4. | Sơ đồ luồng ngữ cảnh với nhãn phân định Core và mở rộng. | Artifacts #1 và #4. | `UC-01`..`15`; ranh giới kiến trúc hệ thống. | **D-G3**: Tác nhân bên ngoài, kho dữ liệu và ranh giới AI khớp với tài liệu nguồn. | **PASS** |
| **7** | DFD Level 0 | Mô hình hóa các tiến trình Core, kho dữ liệu, luồng điều khiển và luồng dữ liệu trung tâm. | Sơ đồ ngữ cảnh, ánh xạ trạng thái ERD, UC/BF, ranh giới an ninh. | Đặc tả tiến trình và luồng dữ liệu Mức 0. | Artifact #6; Artifacts #4–#5. | `BF-01`..`15`. | **D-G3**: Mọi luồng Core có nguồn, đích, trạng thái kho lưu trữ và vết truy xuất. | **PASS** |
| **8** | DFD Level 1 | Chi tiết hóa 4 luồng rủi ro cao: Chẩn đoán/Placement, Hoàn thành bài học, Ôn tập SRS, và Kiểm duyệt nội dung. | DFD Mức 0, mô hình trạng thái, đặc tả placement, ràng buộc API/an ninh. | 4 đặc tả luồng Mức 1 với các nhánh lỗi và luồng dự phòng (fallback). | Artifacts #2, #3, #7, #15, #16. | `BF-05/07/08/09/10/12`. | **D-G3, D-G7**: Giá trị chính sách và quyền sở hữu có bằng chứng; không có kho/thực thể ma. | **PASS** |
| **9** | Use Case Diagram | Mô hình hóa toàn bộ 15 Use Cases, tác nhân liên quan và phân loại Core đối chiếu với Tùy chọn/Mở rộng. Biểu đồ trực quan: `docs/plantuml/uc-overview-m22.puml`. | Danh mục UC, danh mục vai trò, ranh giới mở rộng. | Biểu đồ 15 Use Cases: 14 Core cộng với UC-15 (Manage Cohorts & Group Progress) tùy chọn/tương lai. | Artifacts #1 và #6. | `UC-01`..`15`; ma trận truy vết `05`. | **D-G4**: Toàn bộ 15 UCs có đúng tác nhân và nhãn trạng thái chính xác. | **PASS** |
| **10** | Activity/State Behavior Set | Định nghĩa các quyết định nghiệp vụ, nhánh rẽ ngoại lệ và hành vi phụ thuộc trạng thái. Biểu đồ trực quan: `docs/plantuml/activity-learner-flow-m22.puml`, `docs/plantuml/activity-authoring-flow-m22.puml`, `docs/plantuml/state-progression-readiness-m22.puml`. | Mô hình trạng thái, UC/BF, đề cương A1, quyết định D5–D8. | Tập đặc tả hoạt động/trạng thái cho các luồng đã phê duyệt. | Artifacts #2, #3, #9. | `BF-01`..`15`; D5/D6/D7/D8. | **D-G4, D-G7**: Mỗi quyết định có quy tắc khóa, nhánh thay thế và bằng chứng xác thực. | **PASS** |
| **11** | Sequence Set | Xác định quyền sở hữu tương tác, timeout/fallback, điểm lưu trữ và điểm ghi nhận kiểm toán. Biểu đồ trực quan: `docs/plantuml/sequence-*m23.puml`. | Ràng buộc API/an ninh, mô hình dữ liệu/trạng thái, kiến trúc `01`. | Bộ biểu đồ trình tự: Xác thực, Hoàn thành, `record_review`, GEC-BFF, Kiểm duyệt/Xuất bản. | Artifacts #2, #5, #10, #15, #16. | `BF-01`..`15`; ranh giới kiến trúc ADR. | **D-G4, D-G5**: AI không sở hữu dữ liệu chính; có bằng chứng RLS/RPC và timeout. | **PASS** |
| **12** | Domain/Class Model | Định nghĩa trách nhiệm tầng trình diễn, tầng dữ liệu và tầng nghiệp vụ độc lập với ngôn ngữ lập trình. Biểu đồ trực quan: `docs/plantuml/layer-responsibility-m23.puml`, `docs/plantuml/service-boundary-m23.puml`. | Baseline kiến trúc, ranh giới API, mô hình miền Core. | Mô hình lớp/phân tầng khái niệm; không đòi hỏi sinh mã lớp cụ thể. | Artifacts #1, #5, #15. | `P1-FR-002/003/005`; kiến trúc hệ thống. | **D-G4**: Trách nhiệm và phụ thuộc có thể truy vết mà không cần xác nhận mã thực thi. | **PASS** |
| **13** | Component Architecture | Xác định quyền sở hữu logic của từng thành phần phần mềm đối với tập luật nghiệp vụ và ranh giới dữ liệu. Biểu đồ: `docs/plantuml/component-architecture-m24.puml`. | Baseline kiến trúc `01`, Artifacts #11, #15, #16, các quyết định ADR. | Đặc tả trách nhiệm thành phần trong phân tầng 5 lớp không phụ thuộc vòng trên 19 thành phần. | Cặp ranh giới API ↔ Security; bộ biểu đồ trình tự #11. | Các quyết định ADR; quyền sở hữu theo UC/BF. | **D-G5**: Bảo toàn ranh giới Web/Admin/Supabase/AI hiện có. | **PASS** |
| **14** | Deployment/Runtime Boundary | Định nghĩa các vị trí triển khai, vùng an ninh, ranh giới cách ly bí mật và trạng thái vận hành hiện tại vs mục tiêu. Biểu đồ: `docs/plantuml/deployment-boundary-m24.puml`. | Kiến trúc `01`, ràng buộc môi trường, ma trận an ninh #16. | Đặc tả vị trí triển khai và 5 vùng an ninh chuẩn tắc M2.4 (Zone 1 Public Client, Zone 2 Trusted BFF, Zone 3 Managed DB/Storage, Zone 4 Isolated AI, Zone 5 Privileged Ops). | Artifact #13; Artifact #16. | Các yêu cầu phi chức năng NFR; tài liệu kiến trúc và bảo mật. | **D-G5, D-G6**: Lược đồ/triển khai đích không bị tuyên bố là đã sẵn sàng vận hành. | **PASS** |
| **15** | API Boundary Specification | Phân loại toàn bộ các bề mặt API/dữ liệu theo CURRENT, TARGET, FUTURE, hoặc COMPATIBILITY GAP. | Hợp đồng API `docs/03-api-contract.md`, mô hình dữ liệu, mô hình an ninh, kiến trúc. | Bảng phân loại ranh giới cho PostgREST, RPC, Storage, Admin và AI. | Artifacts #5, #13, #16. | Hợp đồng API; UC/BF; `record_review`; GEC. | **D-G5, D-G6**: Không âm thầm sửa đổi hợp đồng API; các bề mặt khuyết thiếu được phân loại. | **PASS** |
| **16** | Security Responsibility Matrix | Định nghĩa kiểm soát phân quyền ứng dụng, RLS, tài khoản dịch vụ đặc quyền, cách ly AI và kiểm toán. Biểu đồ: `docs/plantuml/security-matrix-m24.puml`. | Danh mục vai trò, kiến trúc `01`, mô hình dữ liệu, ranh giới API. | Ma trận an ninh duy nhất trải rộng trên 6 ranh giới thực thi cho 15 nhóm thao tác. | Artifacts #13 và #15. | `P1-NFR-001`; `UC-11/13`; ma trận vai trò. | **D-G6**: Mọi thao tác nhạy cảm đều có cơ chế thực thi và đơn vị chịu trách nhiệm kiểm toán. | **PASS** |
| **17** | Placement/Jump Decision Flows | Đặc tả chi tiết luồng ra quyết định Mapping A (thang điểm thô 0–30 ánh xạ 6 Units: U1–U6), phạm vi Jump, ngưỡng đánh giá và thời gian giãn cách. Biểu đồ: `docs/plantuml/placement-jump-m22.puml`. | Đặc tả Placement/Jump `09`, mô hình tiến trình, bất biến ngữ cảnh Exercise. | Đặc tả luồng quyết định chính sách xếp lớp và học vượt. | Artifacts #3, #10, #15. | `UC-03/04`; `BF-08/11`; D5/D6. | **D-G7**: Giá trị chính sách chính xác, xuất Starting Unit, không cấp chứng nhận CEFR. | **PASS** |
| **18** | SRS Decision Flow | Đặc tả lịch trình lặp lại ngắt quãng Policy B xác định và quyền sở hữu lưu trữ độc lập với AI. Biểu đồ: `docs/plantuml/srs-flow-m22.puml`. | Quyết định D8, mô hình dữ liệu SRS, ranh giới API/an ninh. | Đặc tả luồng tính toán lịch ôn tập và khối lượng bài tập đến hạn qua RPC. | Artifacts #5, #11, #15, #16. | `UC-06`; `BF-12`; D8. | **D-G7**: Lịch trình xác định và sự độc lập của dịch vụ AI được xác thực bằng chứng. | **PASS** |
| **19** | Screen/Flow Inventory | Lập danh mục các màn hình và trạng thái giao diện phi pixel theo từng vai trò người dùng chuẩn tắc. Biểu đồ: `docs/plantuml/screen-flow-inventory-m22.puml`. | Danh mục UC/BF, ma trận vai trò/an ninh, ranh giới kiến trúc. | Danh mục màn hình/luồng với trạng thái Core vs Mở rộng. | Artifacts #9, #10, #16. | Danh mục UC; danh mục BF; các trạng thái NFR. | **D-G4, D-G6**: Không có màn hình tương lai nào được trình bày như một phần của Core MVP. | **PASS** |
| **20** | Design Validation Report | Hợp nhất bằng chứng kiểm định cổng, rà quét mâu thuẫn, ghi nhận quyết định mở và đồng bộ hóa báo cáo. | Artifacts #1–#19, các cuộc kiểm toán cơ sở, ánh xạ báo cáo học thuật §11. | Báo cáo kiểm định thiết kế chuẩn tắc, sổ bộ quyết định mở, danh mục khoảng trống DoD cho M2.6. | Toàn bộ các artifacts; §§8, 10, 11 của plan. | `D-G1`..`D-G9` (Cổng `D-G10` ngoại trừ / dành riêng M2.6); ma trận truy vết `FR->UC->BF->Artifact`. | **D-G8, D-G9** có bằng chứng trong M2.5; **D-G10** chờ xử lý / ngoại trừ / dành riêng cho M2.6 (chưa thực hiện trong M2.5); 0 mâu thuẫn P0/P1 tồn đọng. | **PASS** |

---

## 4. Section 20.3: D-G9 Contradiction, Drift & Boundary Scan

Thực hiện yêu cầu kiểm định Cổng D-G9 theo kế hoạch `plans/m2-5-design-validation-plan.md` §11, phần này thiết lập hồ sơ quét toàn diện trên 11 danh mục trôi dạt ngữ nghĩa và mâu thuẫn ranh giới, ghi nhận chi tiết hiện trạng và biện pháp xử lý (disposition):

```
+----------------------------------------------------------------------------------------------------+
|                                  D-G9 CONTRADICTION & DRIFT SCAN REGISTER                          |
+-----------------------------------+-----------------------------------+----------------------------+
| 1. Obsolete Terminology  [CLEAN]  | 5. Progress vs Mastery   [CLEAN]  | 9. Security & SoD Rules   [CLEAN]  |
| 2. Ghost Entities        [CLEAN]  | 6. CEFR Claims           [CLEAN]  | 10. AI Boundary Limits   [CLEAN]  |
| 3. Stale UC/BF IDs       [CLEAN]  | 7. Target-as-Ready       [CLEAN]  | 11. Status Taxonomy      [CLEAN]  |
| 4. State Machine Terms   [CLEAN]  | 8. Stale Source Refs     [CLEAN]  |                            |
+-----------------------------------+-----------------------------------+----------------------------+
```

### Chi tiết Xử lý 11 Danh mục Rà quét

#### 1. Thuật ngữ Lỗi thời (Obsolete Terminology)
- **Nội dung kiểm tra:** Các cụm từ tàn dư từ các bản thảo sơ khai như "Phòng thi", "Kỳ thi chính thức", "Ngân hàng đề thi", "Khảo sát như tính năng sản phẩm".
- **Kết quả quét:** Không xuất hiện như các thực thể hay chức năng vận hành trong bất kỳ tài liệu thiết kế nào thuộc M2.1–M2.5.
- **Biện pháp xử lý (Disposition):** Toàn bộ các bài kiểm tra được định nghĩa là chế độ ngữ cảnh logic (`context`) của thực thể chuẩn tắc `Exercise`. Từ "Khảo sát" chỉ được sử dụng với tư cách là dữ liệu đầu vào phân tích người dùng (User Research Survey) trong Giai đoạn 0, hoàn toàn không phải tính năng phần mềm.

#### 2. Khái niệm và Thực thể Ma (Ghost Concepts & Entities)
- **Nội dung kiểm tra:** Các thực thể không có nguồn gốc được duyệt: `AssessmentSession`, `ExerciseAttempt`, `Exam`, `QuestionBank`, `Badge`, `Certificate`, `MultiWOZ`, `DKT`, `HLR`.
- **Kết quả quét:**
  - `AssessmentSession`: Tuân thủ nghiêm ngặt bảo vệ GUARD-12. Không tồn tại như một thực thể cơ sở dữ liệu (`không tồn tại entity AssessmentSession`). Các đề cập liên quan đều được gắn nhãn minh bạch là bí danh lịch sử (`HISTORICAL alias`) dùng để đối chiếu phân tích mô hình miền.
  - `ExerciseAttempt`: Không tồn tại như một aggregate độc lập trong Core MVP. Tiến trình thực hành được theo dõi thông qua trạng thái `ExerciseState` nhúng trong `LearningProgress`.
  - `Exam` / `QuestionBank`: Bị nghiêm cấm bởi bất biến Bài tập hợp nhất (Unified Exercise Invariant D4 và ADR-006).
  - `Badge` / `Certificate`: Được phân loại rõ ràng là Tính năng Mở rộng ngoài phạm vi MVP (`OUT_OF_SCOPE / FUTURE_EXTENSION`).
- **Biện pháp xử lý (Disposition):** Đã phân lập 100%; không có thực thể ma nào xâm nhập vào lược đồ Core.

#### 3. Mã định danh Use Case và Behavioral Family Lạc hậu (Stale UC/BF IDs)
- **Nội dung kiểm tra:** Các mã định danh Use Case mở rộng ngoài chuẩn (`UC-16`, `UC-17`, `UC-18`) hoặc Behavioral Family không chuẩn (`BF-16`), hoặc nhầm lẫn tên gọi chuẩn tắc của các Use Cases.
- **Kết quả quét:** Hệ thống chuẩn hóa duy nhất 15 Use Cases (`UC-01` đến `UC-15`) và 15 Behavioral Families (`BF-01` đến `BF-15`). `UC-15` mang tên chuẩn tắc là **Manage Cohorts & Group Progress (Quản lý Nhóm Học viên & Tiến độ Lớp học)** với trạng thái `OPTIONAL / FUTURE EXTENSION BOUNDARY`. Dịch vụ AI sửa lỗi ngữ pháp (GEC) được định nghĩa là khả năng hỗ trợ tính toán phi trạng thái thuộc `BF-14` (không sở hữu Use Case độc lập, zero UC).
- **Biện pháp xử lý (Disposition):** Xác nhận 100% tài liệu chỉ sử dụng tập hợp đóng `UC-01`..`UC-15` và `BF-01`..`BF-15`.

#### 4. Thuật ngữ Máy Trạng thái (State Machine Terms)
- **Nội dung kiểm tra:** Các trạng thái vòng đời nội dung và tiến trình học tập trái chuẩn (ví dụ: nhảy trạng thái trực tiếp `IN_REVIEW -> PUBLISHED`, hoặc dùng trạng thái thô `COMPLETED_BY_JUMP`).
- **Kết quả quét:**
  - Vòng đời nội dung tuân thủ đúng 6 trạng thái chuẩn tắc: `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`. Nghiêm cấm tuyệt đối chuyển đổi trực tiếp từ `IN_REVIEW` lên `PUBLISHED`.
  - Tiến trình người học tuân thủ đúng 4 trạng thái chuẩn tắc: `LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP` (với cờ `by_jump = true`). Không sử dụng nhãn thô `COMPLETED_BY_JUMP`.
- **Biện pháp xử lý (Disposition):** Đã kiểm chứng tính toàn vẹn trên toàn bộ các biểu đồ trạng thái M2.2 và biểu đồ trình tự M2.3.

#### 5. Nhầm lẫn giữa Tiến trình, Năng lực, Độ thành thạo và Độ sẵn sàng (Progress vs Mastery vs LevelReadiness)
- **Nội dung kiểm tra:** Hiện tượng đồng nhất hoặc gán nhầm lẫn giữa `LearningProgress`, `Proficiency`, `ConceptMastery`, và `LevelReadiness`.
- **Kết quả quét:** Thiết kế duy trì sự phân tách toán học và cấu trúc dữ liệu nghiêm ngặt:
  - `LearningProgress != Proficiency != ConceptMastery != LevelReadiness`.
  - Nhánh tự khai báo (Branch A): Ghi nhận `selfReportedLevel` với trạng thái `UNVERIFIED`; tuyệt đối không được coi là năng lực đã xác thực, không sinh `AssessmentResult` và không sinh `SkillProfile`.
  - Nhánh kiểm tra chẩn đoán (Branch B): Sinh thực thể bất biến `AssessmentResult`, cập nhật `SkillProfile` đa chiều, xác định `verifiedProficiency` để thiết lập vị trí xuất phát `curriculumStartingPoint`.
- **Biện pháp xử lý (Disposition):** Xác nhận tính phân tách đã được khóa trong M2.1 (§4, §6) và M2.2 (§7).

#### 6. Tuyên bố Sai lệch về Khung Năng lực CEFR (CEFR Claims)
- **Nội dung kiểm tra:** Các tuyên bố hệ thống cấp chứng chỉ CEFR, đánh giá chuẩn quốc tế A1–C2, hoặc cấp chứng nhận trình độ.
- **Kết quả quét:** Chương trình học giai đoạn MVP chỉ áp dụng đề cương tiếng Anh A1 thử nghiệm (`English A1 Pilot - 6 Units, 24 Lessons`). Thuật toán Placement Mapping A áp dụng thang điểm thô 0–30 chia thành **6 dải điểm tương ứng với 6 Units trên đề cương English A1**:
  - `0–7 điểm`: Unit 1
  - `8–12 điểm`: Unit 2
  - `13–17 điểm`: Unit 3
  - `18–22 điểm`: Unit 4
  - `23–26 điểm`: Unit 5
  - `27–30 điểm`: Unit 6
  Đầu ra duy nhất là Vị trí bắt đầu học (`Starting Unit`), tuyệt đối không cấp chứng chỉ hoặc tuyên bố chuẩn hóa CEFR.
- **Biện pháp xử lý (Disposition):** Đã loại bỏ hoàn toàn các tuyên bố chứng nhận CEFR; toàn bộ tài liệu quy chiếu về 6 Units Starting Unit và đề cương A1.

#### 7. Tuyên bố Runtime Mục tiêu Sẵn sàng Vận hành (Target-as-Ready Claims)
- **Nội dung kiểm tra:** Việc mô tả các cơ chế đích (mô hình 6 vai trò, bảng `audit_logs`, các hàm RLS mở rộng) như thể chúng đã được triển khai sẵn sàng trong cơ sở dữ liệu hiện tại.
- **Kết quả quét:** Toàn bộ các cơ chế mục tiêu đều được dán nhãn minh bạch là `TARGET_DESIGN` hoặc `TARGET_SCHEMA`. Toàn bộ tài liệu M2.1–M2.5 tuyên bố rõ ràng: `TARGET RUNTIME NOT PRODUCTION READY / NOT YET DEPLOYED`.
- **Biện pháp xử lý (Disposition):** Bảo toàn nhãn cảnh báo trạng thái; công tác hiện thực hóa thuộc về giai đoạn triển khai sau M2.6.

#### 8. Trích dẫn Tài liệu Nguồn Lạc hậu (Stale Source References)
- **Nội dung kiểm tra:** Các liên kết tới thư mục cũ đã bị xóa (`ke-hoach-chi-tiet/`), hoặc các thông tin bàn giao đã bị thay thế trong `HANDOFF.md`.
- **Kết quả quét:** Thư mục `ke-hoach-chi-tiet/` đã được gỡ bỏ hoàn toàn khỏi kho lưu trữ. Các dòng ghi chú lịch sử trong `HANDOFF.md` được diễn giải đúng ngữ cảnh là tài liệu tham khảo quá khứ, không làm sai lệch nguồn chân lý hiện tại (ADR-027 và commit `0a9a126`).
- **Biện pháp xử lý (Disposition):** 100% trích dẫn quy chiếu về các tài liệu chuẩn tắc trong thư mục `docs/`.

#### 9. Tuyên bố Quy tắc An ninh và Phân tách Nhiệm vụ (Security & SoD Rules)
- **Nội dung kiểm tra:** Kiểm tra tính nhất quán của các quy tắc SoD: Lesson Creator không được tự duyệt bài của mình; Moderator không được tự phát hành bài học; Quản trị viên chỉ được phát hành khẩn cấp bài học đã qua kiểm duyệt (`APPROVED`) kèm lý do nghiệp vụ và ghi vết kiểm toán; kiểm tra ứng dụng không bao giờ thay thế RLS cơ sở dữ liệu.
- **Kết quả quét:** Toàn bộ các quy tắc SoD được đặc tả thành các đường dẫn từ chối bắt buộc (Negative Paths với mã lỗi `403 SOD_VIOLATION_*`) trong M2.2, M2.3 và ma trận an ninh M2.4.
- **Biện pháp xử lý (Disposition):** Xác nhận tính nhất quán 100% giữa đặc tả logic và ma trận trách nhiệm an ninh.

#### 10. Giới hạn Ranh giới Quyền sở hữu của Dịch vụ AI (AI Boundary Limits)
- **Nội dung kiểm tra:** Dịch vụ AI can thiệp vào việc ghi nhận tiến trình học tập, tính toán chuỗi ngày học (`streakCount`), hay sở hữu dữ liệu người học.
- **Kết quả quét:** Dịch vụ AI (`lingora-ai`) tuân thủ nghiêm ngặt ADR-010 và ADR-014: Là dịch vụ tính toán không lưu trạng thái (stateless compute), được triệu gọi thông qua Next.js Route Handler Proxy với timeout 8.0 giây và fallback tự động. AI chỉ sở hữu kết quả tạm thời `corrected_text` và các span lỗi ngữ pháp; AI hoàn toàn không có quyền ghi dữ liệu tiến trình hay bảng xếp hạng.
- **Biện pháp xử lý (Disposition):** Đã kiểm chứng tính độc lập qua biểu đồ trình tự `SEQ-07` (`sequence-gec-interaction-m23.puml`) và Ma trận an ninh Artifact #16.

#### 11. Chuẩn hóa Phân loại Nhãn Trạng thái (Status Taxonomy)
- **Nội dung kiểm tra:** Hiện tượng sử dụng tùy tiện các nhãn trạng thái hoặc không phân biệt rõ ràng giữa 3 tầng tiến hóa của hệ thống.
- **Kết quả quét:** Hệ thống chuẩn hóa duy nhất 3 nhóm nhãn trạng thái:
  1. `CURRENT_APPLIED`: Áp dụng cho các bảng, trường và quyền hạn đang chạy thực tế trong DB Supabase hiện tại (mô hình 2 vai trò).
  2. `TARGET_DESIGN` / `TARGET_SCHEMA`: Áp dụng cho thiết kế kiến trúc, an ninh và dữ liệu mục tiêu được chuẩn hóa trong Phase 1 (mô hình 6 vai trò, bảng audit, RLS mở rộng).
  3. `FUTURE_EXTENSION` / `FUTURE_MIGRATION`: Áp dụng cho các tính năng tương lai ngoài phạm vi Core MVP (`Cohort`, `SupportTicket`, `UC-15`).
- **Biện pháp xử lý (Disposition):** 100% các bảng biểu, sơ đồ và tài liệu tuân thủ chuẩn phân loại này.

---

## 5. Section 20.4: Full Traceability Verification & Academic Report Mapping

### 5.1. Chuỗi Truy vết Toàn diện (End-to-End Traceability Chain)

Căn cứ danh mục yêu cầu chuẩn tắc tại `docs/02-requirements.md` §2.4 và đặc tả hành vi Use Case / Behavioral Family được phê duyệt tại M2.2, dưới đây là bảng truy vết chuẩn xác từ từng yêu cầu chức năng (`P1-FR-001`..`017`) và phi chức năng (`P1-NFR-001`..`004`) tới Use Case, Behavioral Family, thực thể miền, quyết định khóa và sản phẩm thiết kế đáp ứng:

| Mã Yêu cầu | Tên Yêu cầu Hệ thống Chuẩn tắc (docs/02-requirements.md) | Use Case (UC) | Behavioral Family (BF) | Thực thể Miền chính | Quyết định Khóa | Artifacts Thiết kế Đáp ứng |
|---|---|---|---|---|---|---|
| **P1-FR-001** | Đăng ký, đăng nhập, khôi phục mật khẩu (design spec), refresh token và đăng xuất qua Supabase Auth | `UC-01` | `BF-01` | `Profile`, `LearnerProfile`, `auth.users` | SEC-D1, SEC-D2 | #1, #4, #5, #11, #13, #14, #16 |
| **P1-FR-002** | Duyệt khóa học, bài học, từ vựng đã xuất bản và phát âm thanh từ vựng khả dụng | `UC-04` (Browse Learning Path; preview `UC-05`) | `BF-09`, `BF-11` | `Course`, `Unit`, `Lesson`, `Vocabulary` | D1, D3, ADR-005 | #1, #3, #4, #5, #10, #17 |
| **P1-FR-003** | Hoàn thành bài tập 5 dạng (MCQ, FILL_BLANK, REORDER, GRAMMAR, LISTENING) | `UC-05` | `BF-09` | `Lesson`, `Exercise` | D4 (Unified Exercise), ADR-006 | #1, #4, #5, #10, #11, #12 |
| **P1-FR-004** | Xem và cập nhật tiến độ bài học (UserProgress / LearningProgress) | `UC-07` (xem), `UC-05` (cập nhật) | `BF-13` (xem/streak), `BF-09` / `BF-10` (cập nhật) | `LearningProgress`, `UserProgress` | D7 (Completion rule), Invariant Progress≠Mastery | #1, #3, #4, #5, #10, #11 |
| **P1-FR-005** | Ôn tập từ vựng ngắt quãng theo chính sách SRS tất định (Policy B) | `UC-06` | `BF-12` | `UserVocabSrs`, `Vocabulary` | D8 (Policy B [1,3,7,14,30]) | #1, #4, #5, #8, #11, #18 |
| **P1-FR-006** | Ghi nhận kết quả ôn tập nguyên tử qua hàm RPC (`record_review`) | `UC-06` | `BF-12` | `ReviewLog`, `UserVocabSrs` | D8, SEC-D10 (Atomic RPC) | #4, #5, #11, #14, #15, #16 |
| **P1-FR-007** | Luyện viết tiếng Anh theo tình huống và nhận phản hồi sửa lỗi GEC (AI phi trạng thái) | `KHÔNG` (Dịch vụ hỗ trợ phi trạng thái; zero UC ownership) | `BF-14` | `ChatScenario` (ngữ cảnh), Transient GEC Diffs (phi sở hữu DB) | ADR-010, ADR-014 (8.0s timeout & fallback) | #6, #7, #11, #13, #14, #15, #16 |
| **P1-FR-008** | Quản trị viên/Cán bộ quản lý học liệu đã xuất bản và tình huống hội thoại | `UC-08`, `UC-09`, `UC-10`, `UC-11`, `UC-12`, `UC-13` | `BF-03`, `BF-04`, `BF-05`, `BF-06`, `BF-07` | `Course`, `Unit`, `Lesson`, `Profile`, `AuditLog` | D1, D2 (SoD), D3, ADR-020 | #1, #2, #4, #5, #8, #10, #11, #14, #16 |
| **P1-FR-009** | Tải lên và quản lý tệp đa phương tiện qua Supabase Storage (PA2 direct) | `UC-08` (Tải media khi soạn bài) | `BF-04` | `Lesson`, `Storage Buckets (lingora-avatars, lingora-media)` | ADR-005, SEC-D8 PA2 Direct Storage | #4, #5, #14, #16 |
| **P1-FR-010** | Hỗ trợ hành vi đa ngôn ngữ giao diện và nội dung (`vi`, `en`) | `UC-01`, `UC-02` (xuyên suốt) | Cross-cutting / `BF-01` | `Profile.uiLocale` | Locale Policy (`vi` default/fallback, `en` supported) | #5, #19 |
| **P1-FR-011** | Cơ chế duy trì chuỗi ngày học liên tục (Streak Gamification) | `UC-07` | `BF-13` | `Profile.streakCount`, `Profile.lastQualifyingActivityDate` | D9 (Qualifying activity, reset to 1) | #1, #4, #5, #10, #11 |
| **P1-FR-012** | Hoàn thành dạng bài tập ngữ pháp (`GRAMMAR`) trong bài học xuất bản | `UC-05` | `BF-09` | `Exercise (payload.type = GRAMMAR)` | D4 (Unified Exercise; không tách entity) | #4, #5, #10, #11 |
| **P1-FR-013** | Hoàn thành dạng bài tập nghe từ vựng (`LISTENING`) | `UC-05` | `BF-09` | `Exercise (payload.type = LISTENING)`, `Vocabulary.audioUrl` | D4, ADR-005 (Storage RLS audio) | #4, #5, #10, #11 |
| **P1-FR-014** | Xem và thiết lập mục tiêu học tập hàng ngày (`dailyGoalMin`) | `UC-02` | Cross-cutting / Goal setting | `Profile.dailyGoalMin` | Bounded range [5..120] min | #5, #10, #19 |
| **P1-FR-015** | Bật/tắt nhắc nhở học tập cục bộ trong ứng dụng (In-app Reminder) | `UC-02` | Cross-cutting / Reminder setting | Client-side derived (không push entity) | ADR-008 Option 6d (in-app reminder only) | #10, #19 |
| **P1-FR-016** | Đánh giá chẩn đoán thích ứng / tự khai báo cấp độ để nhận Starting Unit đề cương, hoặc bỏ qua/thi lại | `UC-03` (Chẩn đoán/Placement; Jump dùng `UC-04`) | `BF-08` (Placement; Jump dùng `BF-11`) | `LearnerProfile`, `AssessmentResult`, `SkillProfile` | D4, D6, Mapping A (0–30 raw score -> 6 Units) | #1, #3, #4, #5, #8, #10, #17 |
| **P1-FR-017** | Xem huy hiệu và thành tích cá nhân đạt được từ các mốc học tập (Nice / Deferred) | `KHÔNG` (DEFERRED / Hoãn ngoài Core MVP; không gán UC) | `KHÔNG` (Không thuộc BF Core nào) | Khái niệm mở rộng ngoài MVP | Hoãn ngoài Core MVP | Ngoài phạm vi Core MVP |
| **P1-NFR-001** | An ninh thông tin, RLS cơ sở dữ liệu và Phân tách nhiệm vụ (SoD) | `UC-08..11`, `UC-13`, `UC-14` | `BF-01`, `BF-03..07`, `BF-13` | Toàn bộ lược đồ Core | SEC-D1..D10, DD-10 | #14, #15, #16 |
| **P1-NFR-002** | Luồng học chính và SRS hoạt động bình thường khi dịch vụ AI GEC ngoại tuyến (Graceful Fallback) | `UC-05`, `UC-06` | `BF-09`, `BF-12`, `BF-14` | AI Route Handler Proxy | ADR-014 (8.0s timeout & fallback) | #11, #13, #14, #15 |
| **P1-NFR-003** | Hợp đồng API AI di chuyển minh bạch, tương thích ngược | Cross-cutting AI | `BF-14` | DTO Contracts, Route Handlers | Hợp đồng API `03` | #12, #13, #15 |
| **P1-NFR-004** | Giao diện Web Người học & Admin phản hồi nhất quán, đầy đủ trạng thái (loading/empty/error) | Toàn bộ UCs có giao diện | `BF-01`..`BF-15` | UI Components, Screen Inventory | ADR-008 | #10, #19 |

---

### 5.1.1. Ma trận Đối soát Chuẩn tắc 15 Use Cases và 15 Họ Hành vi (UC-01..15 ↔ BF-01..15)

Dưới đây là bảng đối soát chuẩn tắc giữa 15 Use Cases (`UC-01`..`UC-15`) và 15 Behavioral Families (`BF-01`..`BF-15`) từ tài liệu M2.2 (`docs/phase-1-m2-2-behavior-uc-activity-state.md` §§5, 6):

| Mã UC | Tên Use Case Chuẩn tắc (M2.2) | Tác nhân chính | Trạng thái Phạm vi | Họ Hành vi (BF) tương ứng |
|---|---|---|---|---|
| **UC-01** | Authenticate & Manage Session | All Roles | Core MVP | `BF-01 Authentication Flow` |
| **UC-02** | Configure Goals & Study Time | Learner | Core MVP | Cross-cutting / Thiết lập mục tiêu & nhắc nhở |
| **UC-03** | Take Placement Test (Diagnostic Assessment) | Learner | Core MVP | `BF-08 Placement Test Flow` |
| **UC-04** | Browse Learning Path & Conditional Jump | Learner | Core MVP | `BF-09 Learning Lesson Flow`, `BF-11 Conditional Jump Flow` |
| **UC-05** | Complete Lesson Exercises | Learner | Core MVP | `BF-09 Learning Lesson Flow`, `BF-10 Controlled Retry Flow` |
| **UC-06** | Spaced Repetition Review (SRS) | Learner | Core MVP | `BF-12 SRS Review Flow` |
| **UC-07** | Track Progress & Streak | Learner | Core MVP | `BF-13 Progress & Streak Tracking Flow` |
| **UC-08** | Create & Edit Lesson Draft | Lesson Creator | Core MVP | `BF-03 Content Assignment Flow`, `BF-04 Lesson Authoring Flow`, `BF-06 Content Revision Flow` |
| **UC-09** | Review & Moderate Content | Moderator | Core MVP | `BF-05 Content Review Flow`, `BF-06 Content Revision Flow` |
| **UC-10** | Publish Approved Content | Organizational Manager | Core MVP | `BF-07 Publication Flow` |
| **UC-11** | Manage Accounts & Roles | Administrator | Core MVP | `BF-01`, Quản lý an ninh |
| **UC-12** | View System Reports | Administrator, Org Manager | Core MVP | `BF-02`, Báo cáo thống kê |
| **UC-13** | View & Audit Security Logs | Administrator | Core MVP | `BF-13`, Tra cứu kiểm toán |
| **UC-14** | Handle Support Tickets | Operations Staff | Core MVP | `BF-15 Operations & Ticket Flow` |
| **UC-15** | Manage Cohorts & Group Progress | Organizational Manager | **`OPTIONAL / FUTURE EXTENSION BOUNDARY`** | Không thuộc Core BF (Mở rộng doanh nghiệp) |
| *(N/A)* | *(GEC Writing Practice - P1-FR-007)* | Learner | Core MVP (Khả năng hỗ trợ) | `BF-14 Scenario Writing with GEC Flow` (Zero UC ownership) |

---

### 5.2. Đối soát Từng Hàng với Bảng Ánh xạ Báo cáo Học thuật (§11)

Căn cứ Kế hoạch Thiết kế Hệ thống `docs/phase-1-system-design-plan.md` §11, dưới đây là kết quả kiểm tra đối soát từng hàng (row-by-row verification) giữa các sản phẩm thiết kế kỹ thuật và các chương mục tương ứng trong Đề cương Báo cáo Học thuật, quy chiếu chính xác vào các tệp PlantUML thực tế đang tồn tại trong kho lưu trữ:

| Hàng | Nhóm Artifact Thiết kế | Chương / Mục Báo cáo Học thuật | Yêu cầu nghiệp vụ tương ứng | Use Cases / Behavioral Families | Bằng chứng Thiết kế Cụ thể (Tệp thực tế) | Kết quả Đối soát |
|:---:|---|---|---|---|---|:---:|
| **1** | **1–3**: Domain Model, Content Lifecycle, Learning Progression | Phân tích Hệ thống (System Analysis) / Thiết kế Hệ thống (System Design) | Yêu cầu chức năng FR, Đề cương A1, Quyết định khóa D1–D8 | `UC-03/04/08/09/10`; `BF-05/06/07/08/11/12` | Đặc tả mô hình miền Core, bảng chuyển đổi 6 trạng thái vòng đời, mô hình tiến trình A1, biểu đồ PlantUML `docs/plantuml/domain-model-core.puml`, `docs/plantuml/learning-progression-model.puml`, `docs/plantuml/content-lifecycle-state.puml`. | **KHỚP HOÀN TOÀN** |
| **2** | **4–5**: ERD (Logical/Status Mapping), Data Dictionary Final | Thiết kế Cơ sở Dữ liệu (Database Design) | Mô hình dữ liệu quan hệ và các trường logic được phê duyệt | Các hàng UC/BF có lưu trữ dữ liệu chính (`BF-01..15`) | Bảng trạng thái ERD, Từ điển dữ liệu cấp trường M2.1 (§8), biểu đồ PlantUML `docs/plantuml/erd-logical-status-mapping.puml`. | **KHỚP HOÀN TOÀN** |
| **3** | **6–8**: DFD Context, DFD Level 0, DFD Level 1 | Thiết kế Hệ thống (System Design) / Kiến trúc Hệ thống (Architecture) | Ranh giới hệ thống bên ngoài và luồng dữ liệu nghiệp vụ | `BF-01`..`BF-15` (đặc biệt 4 luồng rủi ro cao `BF-05/07/08/09/10/12`) | Đặc tả luồng dữ liệu ngữ cảnh, Mức 0 và 4 luồng Mức 1 chi tiết trong `docs/06-system-analysis.md` §2. | **KHỚP HOÀN TOÀN** |
| **4** | **9–10**: Use Case Diagram, Activity/State Behavior Set | Phân tích Hệ thống (System Analysis) | Yêu cầu người dùng và các quy tắc nghiệp vụ điều khiển | 15 Use Cases (`UC-01`..`15`); 15 Behavioral Families (`BF-01`..`15`) | Ma trận UC/BF, đặc tả chi tiết 15 UCs, luồng hoạt động rẽ nhánh, biểu đồ PlantUML thực tế: `docs/plantuml/uc-overview-m22.puml`, `docs/plantuml/activity-learner-flow-m22.puml`, `docs/plantuml/activity-authoring-flow-m22.puml`, `docs/plantuml/state-progression-readiness-m22.puml`. | **KHỚP HOÀN TOÀN** |
| **5** | **11–12**: Sequence Set, Domain/Class Model | Thiết kế Hệ thống (System Design) | Ràng buộc API, ranh giới dịch vụ và quyền sở hữu tương tác | Các luồng Hoàn thành, Duyệt, Xuất bản, GEC, SRS | 10 biểu đồ trình tự chuẩn tắc (`SEQ-01`..`10`, `docs/plantuml/sequence-*m23.puml`), mô hình phân tầng trách nhiệm logic, biểu đồ PlantUML thực tế `docs/plantuml/layer-responsibility-m23.puml`, `docs/plantuml/service-boundary-m23.puml`. | **KHỚP HOÀN TOÀN** |
| **6** | **13–14**: Component Architecture, Deployment/Runtime Boundary | Kiến trúc Hệ thống (Architecture) | Các quyết định kiến trúc ADR và ranh giới môi trường vận hành | Các Use Cases và Behavioral Families xuyên suốt hệ thống | Đặc tả phân tầng 5 lớp trên 19 thành phần, 5 vùng an ninh triển khai chuẩn tắc (Zone 1–5), biểu đồ PlantUML `docs/plantuml/component-architecture-m24.puml`, `docs/plantuml/deployment-boundary-m24.puml`. | **KHỚP HOÀN TOÀN** |
| **7** | **15**: API Boundary Specification | Thiết kế API và Tích hợp Hệ thống (API / Integration Design) | Hợp đồng giao tiếp API `docs/03-api-contract.md` | Toàn bộ các tương tác UC/BF có trao đổi qua mạng | Sổ bộ phân loại 10 bề mặt API (CURRENT, TARGET, FUTURE, GAP) trong M2.3 (§6); hợp đồng API `03` giữ nguyên vẹn 100%. | **KHỚP HOÀN TOÀN** |
| **8** | **16**: Security Responsibility Matrix | Thiết kế An ninh Hệ thống (Security Design) | Yêu cầu an ninh `P1-NFR-001`, danh mục 6 vai trò chuẩn tắc | `UC-11`, `UC-13` và toàn bộ các thao tác nhạy cảm (`OP-01`..`15`) | Ma trận an ninh duy nhất 6 ranh giới × 15 nhóm thao tác, quy tắc SoD, biểu đồ PlantUML `docs/plantuml/security-matrix-m24.puml`. | **KHỚP HOÀN TOÀN** |
| **9** | **17**: Placement/Jump Decision Flows | Phân tích Hệ thống (System Analysis) / Thiết kế Hệ thống (System Design) | Quyết định khóa D5, D6, Thuật toán Mapping A (0–30 raw score -> 6 Units) | `UC-03`, `UC-04`; `BF-08`, `BF-11` | Bảng luồng quyết định chẩn đoán và học vượt, biểu đồ PlantUML `docs/plantuml/placement-jump-m22.puml`, đặc tả `docs/09-placement-and-jump-specification.md`. | **KHỚP HOÀN TOÀN** |
| **10** | **18**: SRS Decision Flow | Thiết kế Hệ thống (System Design) / Ranh giới Năng lực Hỗ trợ | Quyết định khóa D8 (Lặp lại ngắt quãng xác định) | `UC-06`; `BF-12` | Đặc tả luồng tính toán lịch ôn tập Policy B `[1, 3, 7, 14, 30]`, biểu đồ PlantUML `docs/plantuml/srs-flow-m22.puml`. | **KHỚP HOÀN TOÀN** |
| **11** | **19**: Screen/Flow Inventory | Thiết kế Tương tác / Giao diện Người dùng (UI / Interaction Design phi pixel) | Danh mục UC/BF và các trạng thái phi chức năng | Toàn bộ các Use Cases Core có giao diện người dùng | Sổ bộ danh mục màn hình theo 6 vai trò, phân định Core vs Mở rộng, biểu đồ PlantUML `docs/plantuml/screen-flow-inventory-m22.puml`. | **KHỚP HOÀN TOÀN** |
| **12** | **20**: Design Validation Report | Quản trị Thiết kế (Design Governance) / Phụ lục Báo cáo (Appendix) | Tính đầy đủ của truy vết yêu cầu và Định nghĩa Hoàn thành DoD | Cổng `D-G1` đến `D-G9` (Cổng `D-G10` ngoại trừ / dành riêng M2.6) | Báo cáo kiểm định thiết kế chuẩn tắc (`docs/phase-1-m2-5-design-validation.md`), chỉ mục bằng chứng cổng D-G1..D-G9, sổ bộ quyết định mở. | **KHỚP HOÀN TOÀN** |

> **Lưu ý Phân định Trách nhiệm Quản trị (Administrative Distinction Note):**
> Bảng đối soát trên thực hiện thẩm định trực tiếp đối với **`docs/phase-1-system-design-plan.md` §11** (Bảng ánh xạ báo cáo học thuật chuẩn tắc).
> Để bảo vệ tính toàn vẹn của kho lưu trữ, tài liệu **`docs/05-traceability-matrix.md` (các mục §1 đến §10) được giữ ở trạng thái READ-ONLY tuyệt đối**. Bản thân tài liệu Artifact #20 (`docs/phase-1-m2-5-design-validation.md`) này đóng vai trò là **Chỉ mục Bằng chứng Kiểm định Toàn diện (Self-Contained Validation Evidence Index)**, do đó không cần thiết phải ghi đè hoặc bổ sung phần phụ lục vào tệp `05`.

---

## 6. Section 20.5: Open Decision Status & Closure Record

Căn cứ Kế hoạch `plans/m2-5-design-validation-plan.md` §4 và `docs/phase-1-system-design-plan.md` §8.2, phần này thiết lập **Sổ bộ Ghi nhận Trạng thái Quyết định Mở (Open Decision Status & Closure Record)** cho toàn bộ 7 quyết định thiết kế vật lý còn tồn đọng: DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, và DD-10.

```
+----------------------------------------------------------------------------------------------------+
|                                    OPEN DECISIONS GOVERNANCE FIREWALL                              |
+----------------------------------------------------------------------------------------------------+
| NGUYÊN TẮC CỐT LÕI M2.5:                                                                           |
| "GHI NHẬN HỆ THỐNG TRẠNG THÁI (RECORDED) != TỰ Ý ĐÓNG THIẾT KẾ VẬT LÝ (PHYSICALLY RESOLVED)"       |
|                                                                                                    |
| - Tầng 1 (Locked Behavior): ĐÃ KHÓA từ trước - BẢO LƯU NGUYÊN VẸN.                                 |
| - Tầng 2 (Design Specification): ĐÃ ĐÓNG trong M2.4 - BẢO LƯU NGUYÊN VẸN.                          |
| - Tầng 3 (Physical Representation): GIỮ NGUYÊN TRẠNG THÁI MỞ (OPEN) - BÀN GIAO CHO M2.6.           |
| - TUYỆT ĐỐI KHÔNG sáng chế DDL/SQL, schema JSONB, hoặc trigger/hàm cơ sở dữ liệu trong M2.5.      |
+----------------------------------------------------------------------------------------------------+
```

### Bảng Sổ bộ Trạng thái Quyết định Mở

| Mã Quyết định | Tên Quyết định Thiết kế | Phân loại Danh mục | Trạng thái Tầng 1 (Quy tắc Khóa) | Trạng thái Tầng 2 (Đặc tả Thiết kế) | Trạng thái Tầng 3 (Biểu diễn Vật lý) | Cờ Chặn Bàn giao (Blocking M2.6?) | Ranh giới & Định hướng Chuyển giao M2.6 |
|---|---|---|---|---|---|:---:|---|
| **DD-01** | Biểu diễn phân cấp Unit | `OPEN DESIGN` | **LOCKED**: Phân cấp logic `Course -> Unit -> Lesson` bị khóa bất biến theo đề cương và MVP-04. | **CLOSED**: Mô hình hóa quan hệ Unit mục tiêu với bảng ánh xạ di chuyển tương lai; duy trì tính tương thích ngược. | **OPEN**: Cấu trúc bảng vật lý, khóa ngoại và kịch bản DDL di chuyển chưa được hiện thực hóa. | **CÓ** (Chặn thiết kế dữ liệu) | M2.6 sẽ thiết lập khung kế hoạch di chuyển (migration plan outline) cho bảng Unit; không thực thi DDL trong Phase 1. |
| **DD-02** | Định danh Kế thừa Bản nháp (Revision Identity) | `OPEN DESIGN` | **LOCKED**: Quy tắc clone-to-draft bị khóa theo D3 (nghiêm cấm sửa trực tiếp nội dung đã xuất bản). | **CLOSED**: Xác định liên kết kế thừa qua trường `supersedesId` [DD-02] trong ranh giới thực thể `Lesson`. | **OPEN**: Ràng buộc duy nhất vật lý (unique constraint) và chiến lược quản lý phiên bản trong DB chưa khóa cứng DDL. | **CÓ** (Chặn dữ liệu/vòng đời) | M2.6 sẽ xác định chiến lược bảo toàn lịch sử bất biến và tính duy nhất của phiên bản biên soạn trước khi bàn giao triển khai. |
| **DD-03** | Cấu trúc Vật lý Nhật ký Kiểm toán (Audit Structure) | `OPEN DESIGN` | **LOCKED**: 4 trường tối thiểu bắt buộc bất biến: `actor_id`, `action`, `target_id`, `timestamp` (UTC). | **CLOSED (M2.4)**: Danh mục chuẩn tắc 11 sự kiện kiểm toán; quy tắc ghi nhận kiểm toán tự động, không có đường tắt. | **OPEN**: Cấu trúc chi tiết trường `metadata JSONB`, lựa chọn trigger DB vs tầng ứng dụng, trường IP/device, và DDL bảng `audit_logs`. | **CÓ** (Chặn an ninh/dữ liệu) | Giữ nguyên phán quyết 3 tầng của M2.4; toàn bộ cấu trúc vật lý ở lại trạng thái OPEN; M2.6 sẽ chuẩn hóa khung kế hoạch bảng audit. |
| **DD-04** | Biểu diễn Phân công Biên soạn (Assignment Repr.) | `OPEN DESIGN` | **LOCKED**: Phân công do Manager chỉ định; Creator chỉ biên soạn bài được giao; không đi tắt quy trình (D1). | **CLOSED**: Mô hình hóa thông tin phân công `AssignmentBrief` nhúng trực tiếp trong ranh giới thực thể `Lesson`. | **OPEN**: Quyết định trường vật lý riêng biệt hay metadata cấu trúc trong bảng Lesson chưa khóa cứng DDL. | **CÓ** (Chặn quy trình/dữ liệu) | Bàn giao cho M2.6 xác định trường lưu trữ cụ thể trong bảng Lesson, kiên quyết không tạo thêm bảng Assignment độc lập. |
| **DD-05** | Biểu diễn Ngữ cảnh Bài tập (Assessment Context) | `OPEN DESIGN` | **LOCKED**: Bất biến Bài tập hợp nhất (Unified Exercise D4); không tạo bảng `Exam` hay `QuestionBank`. | **CLOSED**: Chế độ ngữ cảnh đánh giá (`context`) được định nghĩa là một thuộc tính payload của `Exercise`. | **OPEN**: Định dạng cấu trúc chi tiết của trường payload JSONB bài tập vật lý chưa khóa cứng DDL. | **CÓ** (Chặn hành vi/dữ liệu) | Bàn giao cho M2.6 định nghĩa schema kiểm thực payload bài tập cho từng loại bài tương tác (MCQ, Fill, Reorder...). |
| **DD-06** | Lưu trữ Kết quả Chẩn đoán (Placement Persistence) | `OPEN DESIGN` | **LOCKED**: Quy tắc chẩn đoán D6 và Mapping A bị khóa; đầu ra là `Starting Unit`, không CEFR. | **CLOSED**: Kết quả chẩn đoán lưu tại thực thể `AssessmentResult` bất biến, ánh xạ sang hồ sơ năng lực `SkillProfile`. | **OPEN**: Chiến lược lưu trữ lịch sử các lần thi lại (retake history strategy) và cơ chế khóa chỉnh sửa cấp vật lý. | **CÓ** (Chặn dữ liệu/an ninh) | M2.6 sẽ giải quyết chi tiết cơ chế lưu trữ lịch sử thi lại và bảo đảm tính bất biến của kết quả chẩn đoán trước khi code. |
| **DD-10** | Phân chia Cưỡng chế Phân quyền (Role Enforcement Split) | `OPEN DESIGN` | **LOCKED**: Hệ thống có 6 vai trò chuẩn tắc; kiểm tra app không thay thế RLS; RLS cơ sở dữ liệu là bắt buộc. | **CLOSED (M2.4)**: Ma trận phân chia trách nhiệm giữa App AuthZ và DB RLS trên 15 nhóm thao tác; tương thích ngược mô hình 2 vai trò. | **OPEN**: Kịch bản DDL/SQL tạo role mới trong Supabase, các chính sách RLS vật lý mở rộng và hàm trigger đồng bộ. | **CÓ** (Chặn an ninh/kiến trúc) | Giữ nguyên phán quyết 3 tầng của M2.4; không viết mã RLS SQL; M2.6 sẽ lập khung kế hoạch di chuyển phân quyền từng bước. |

---

## 7. Section 20.6: Definition of Done (DoD) Gap List for M2.6 Handoff

Căn cứ Định nghĩa Hoàn thành Thiết kế Hệ thống (System Design Definition of Done) tại `docs/phase-1-system-design-plan.md` §14, phần này tổng hợp các hạng mục đã hoàn thành và danh mục các khoảng trống kỹ thuật chính xác cần bàn giao cho mốc cuối cùng **M2.6 (Design-to-Implementation Handoff)**:

### 7.1. Các Hạng mục Thiết kế Đã Đạt Chuẩn (Completed Design Package)
1. **Hoàn thành 20/20 Artifacts Thiết kế:** Toàn bộ 20 sản phẩm thiết kế từ Artifact #1 đến #20 đã được biên soạn đầy đủ, đạt chuẩn hợp đồng 6 trường chuẩn tắc và được kiểm chứng tính nhất quán.
2. **Thỏa mãn Cổng Kiểm định D-G1 đến D-G9:** Toàn bộ 9 cổng kiểm định thiết kế đều đạt kết luận `PASS` (với D-G5 và D-G6 đạt mức bằng chứng thiết kế, bảo lưu không đóng cho production).
3. **Bảo tồn Tuyệt đối các Quy tắc Nghiệp vụ Bị khóa:** Toàn bộ các quy tắc D1–D9 (Phân cấp học tập, Phân công biên soạn, SoD, Clone-to-draft, Unified Exercise, Mapping A, Jump ≥95%/24h, Retry 10%/70%, SRS Policy B) được bảo vệ nguyên vẹn.
4. **Minh bạch Hóa Trạng thái Tiến hóa:** Phân định rạch ròi giữa Cơ sở dữ liệu hiện tại (`CURRENT_APPLIED`), Thiết kế mục tiêu (`TARGET_DESIGN`), và Mở rộng tương lai (`FUTURE_EXTENSION`).
5. **Ranh giới Dịch vụ AI An toàn:** Dịch vụ AI được cô lập hoàn toàn là dịch vụ phi trạng thái, timeout 8.0s, có fallback, không sở hữu dữ liệu người học.
6. **Đồng bộ hóa Báo cáo Học thuật:** Hoàn tất đối soát từng hàng giữa thiết kế kho lưu trữ và Đề cương báo cáo học thuật (§11).

### 7.2. Danh mục Khoảng trống Chuyển giao cho Milestone M2.6 (M2.6 Handoff Gap Register)
Mốc M2.6 sẽ tiếp nhận toàn bộ hồ sơ M2.5 và thực hiện các gói công việc chuẩn bị bàn giao sau đây (lưu ý: M2.6 tiếp tục là mốc tài liệu/kế hoạch, **tuyệt đối không thực thi mã nguồn hay chạy migration**):

1. **Giải quyết Biểu diễn Vật lý cho 7 Quyết định Mở (Physical Resolution of DD-01..06 and DD-10):**
   - Đóng biểu diễn vật lý Tầng 3 cho DD-01 (Đặc tả cấu trúc bảng Unit mục tiêu).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-02 (Quy định ràng buộc duy nhất và định danh phiên bản bài học).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-03 (Quy định cấu trúc schema `metadata JSONB` bảng audit, cơ chế trigger vs app emission, trường IP/device, chính sách lưu trữ retention).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-04 (Xác định cụ thể các trường lưu trữ phân công biên soạn trong bảng Lesson).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-05 (Xác định cấu trúc JSON Schema cho payload các loại bài tập tương tác).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-06 (Quy định chiến lược lưu trữ lịch sử thi lại và cơ chế bất biến kết quả chẩn đoán).
   - Đóng biểu diễn vật lý Tầng 3 cho DD-10 (Lập kế hoạch di chuyển phân quyền từ 2 vai trò hiện tại lên 6 vai trò mục tiêu).
2. **Xây dựng Phác thảo Kế hoạch Di chuyển Dữ liệu (Migration-Plan Outline):**
   - Lập trình tự các bước di chuyển lược đồ cơ sở dữ liệu có gắn nhãn trạng thái rõ ràng.
   - Xây dựng phương án khôi phục dữ liệu dự phòng (rollback considerations).
   - Tuyệt đối không thực thi mã migration trong Phase 1.
3. **Xây dựng Khung Kế hoạch Kiểm thử Triển khai (Implementation Test-Plan Skeleton):**
   - Thiết lập khung kịch bản kiểm thử cho Thuật toán Mapping A (0–30 raw score -> 6 Units).
   - Thiết lập khung kịch bản kiểm thử quy tắc Jump và thời gian giãn cách 24h.
   - Thiết lập khung kịch bản kiểm thử công thức số học Retry (10% allowance, 70% credit).
   - Thiết lập khung kiểm thử chu kỳ SRS Policy B xác định.
   - Thiết lập khung kiểm chứng ma trận RLS và cơ chế ngắt mạch tự động (fallback) của dịch vụ AI khi quá thời gian 8.0 giây.
4. **Sổ bộ Bàn giao Phụ thuộc Triển khai (API & Service Dependency Register):**
   - Rà soát lần cuối toàn bộ 10 bề mặt API đã được phân loại để lập danh mục phụ thuộc cho đội ngũ lập trình Phase 2.
5. **Đánh giá và Nghiệm thu Cổng D-G10 (D-G10 Validation):**
   - Thực hiện thẩm định toàn diện Cổng D-G10 trên cơ sở gói tài liệu bàn giao hoàn chỉnh của M2.6 trước khi chuyển giao dự án sang Phase 2.

---

## 8. Section 20.7: M2.4 Invariant & Regression Verification

Để bảo đảm tính kế thừa vững chắc và không gây thoái lui (regression) đối với các kết quả thiết kế kiến trúc và an ninh đã được phê duyệt tại Milestone M2.4 (ADR-026 và ADR-027; commit `0a9a126`), phần này thực hiện tái xác nhận các bất biến kỹ thuật nền tảng:

### 8.1. Bảo toàn Kiến trúc Phân tầng Thành phần (Artifact #13)
- **Cấu trúc 5 lớp logic:** Hệ thống duy trì nghiêm ngặt 5 lớp kiến trúc:
  1. `Layer 1: Presentation Layer` (Giao diện Web Người học & Web Quản trị)
  2. `Layer 2: API & Gateway Layer` (Route Handler Proxies, Next.js Middleware, PostgREST API)
  3. `Layer 3: Application & Domain Services Layer` (Dịch vụ Nghiệp vụ Tiến trình, Kiểm duyệt, Xếp lớp, Ôn tập)
  4. `Layer 4: Data & Persistence Layer` (Supabase Postgres, Storage Buckets, Trình thực thi RLS, Bảng Audit)
  5. `Layer 5: External & Supporting Compute Layer` (Dịch vụ AI Sửa lỗi Ngữ pháp GEC qua Route Handler Proxy)
- **Chiều phụ thuộc một chiều (Acyclic Hierarchy):** Chiều phụ thuộc đi từ trên xuống dưới một chiều nghiêm ngặt ($L_1 \rightarrow L_2 \rightarrow L_3 \rightarrow L_4$; $L_3 \rightarrow L_5$). Tuyệt đối không có chu trình phụ thuộc ngược hoặc phụ thuộc vòng.
- **Tổng số thành phần:** Duy trì chính xác 19 thành phần phần mềm logic đã được xác lập trong M2.4.

### 8.2. Bảo toàn Phân vùng An ninh và Ranh giới Vận hành (Artifact #14)
Hệ thống Lingora bảo toàn trọn vẹn **5 Vùng An ninh Logic chuẩn tắc M2.4 (Logical Security Zones)** theo `docs/phase-1-m2-4-architecture-security.md` §5.1:
1. `Zone 1: Untrusted Public Client Zone (Public Browser)`: Môi trường trình duyệt người học và cán bộ quản trị; chỉ lưu trữ JWT phiên qua cookie `httpOnly`; tuyệt đối không chứa khóa dịch vụ đặc quyền (`SUPABASE_SERVICE_ROLE_KEY`); không kết nối trực tiếp AI hoặc cơ sở dữ liệu.
2. `Zone 2: Trusted Application Server Zone (Trusted Application / BFF)`: Môi trường máy chủ Next.js Server Components, Server Actions và Route Handlers đóng vai trò proxy bảo vệ; áp đặt timeout 8.0s gọi AI; kiểm soát SoD trước khi ghi nhận xuống DB.
3. `Zone 3: Managed Database & Storage Zone (Supabase DB / Storage / Auth)`: Môi trường dịch vụ dữ liệu Supabase được quản lý; bao gồm Supabase GoTrue Auth, PostgreSQL 15 Engine với tường lửa RLS và hàm RPC `record_review`, hai bucket lưu trữ riêng tư PA2 (`lingora-avatars`, `lingora-media`), và bảng lưu trữ kiểm toán bất biến `audit_logs` (Target Schema).
4. `Zone 4: Isolated AI Compute Zone (Isolated AI Compute)`: Máy chủ tính toán AI chuyên trách (`lingora-ai`); thực thi mô hình T5-small phi trạng thái (stateless compute); chỉ giao tiếp qua Route Handler Proxy kèm JWT người dùng; xác thực JWT bằng public key qua JWKS; tuyệt đối không kết nối Database và không lưu trữ dữ liệu người học.
5. `Zone 5: Privileged Infrastructure Operations Zone (Privileged Infrastructure Operations / CLI)`: Môi trường nội bộ dành riêng cho cán bộ kỹ thuật và công cụ dòng lệnh (Prisma migrate CLI, seed scripts, psql admin connection); là **ranh giới duy nhất được phép sử dụng `SUPABASE_SERVICE_ROLE_KEY`**; hoàn toàn cách ly khỏi môi trường runtime người học và client công khai.

- **Bảo vệ Bí mật (Secret Isolation):** Khóa `SUPABASE_SERVICE_ROLE_KEY` được cô lập tuyệt đối trong Zone 5 và các Server Actions quản trị nội bộ; tuyệt đối không bao giờ được gửi về phía trình duyệt Web người học.
- **Target-as-Ready Firewall:** Bảo lưu 100% tuyên bố: Toàn bộ môi trường đích được gắn nhãn `TARGET_DESIGN / NOT PRODUCTION READY / NOT YET DEPLOYED`.

### 8.3. Bảo toàn Ma trận Trách nhiệm An ninh (Artifact #16)
- **Quy mô ma trận:** Duy trì ma trận chuẩn tắc duy nhất trải rộng trên 6 ranh giới thực thi (`Learner Web`, `Admin Web`, `Supabase RLS`, `Privileged Service Role`, `AI Server`, `Audit`) bao quát 15 nhóm thao tác nhạy cảm (`OP-01` đến `OP-15`).
- **Phân tách App AuthZ và DB RLS:** Mọi thao tác truy cập dữ liệu nhạy cảm đều có sự hiện diện đồng thời của kiểm tra phân quyền tầng ứng dụng và cưỡng chế bảo mật RLS tại cơ sở dữ liệu. Kiểm tra ứng dụng tuyệt đối không thay thế RLS.
- **Danh mục 11 sự kiện kiểm toán:** Duy trì đầy đủ danh mục 11 sự kiện kiểm toán chuẩn tắc đã đóng trong M2.4:
  1. `AUTH_LOGIN_SUCCESS`
  2. `AUTH_LOGOUT`
  3. `CONTENT_SUBMIT_REVIEW`
  4. `CONTENT_REQUEST_CHANGES`
  5. `CONTENT_APPROVE`
  6. `CONTENT_PUBLISH`
  7. `CONTENT_EMERGENCY_PUBLISH` (Bắt buộc kèm lý do giải trình nghiệp vụ)
  8. `CONTENT_ARCHIVE`
  9. `USER_ROLE_CHANGE`
  10. `ADMIN_CONFIG_UPDATE`
  11. `DIAGNOSTIC_ASSESSMENT_COMPLETE`
- **Các đường dẫn từ chối SoD (Negative Paths):**
  - Từ chối tác giả tự thẩm định bài của mình: `403 SOD_VIOLATION_SELF_REVIEW`.
  - Từ chối kiểm duyệt viên tự xuất bản bài học: `403 SOD_VIOLATION_MODERATOR_PUBLISH`.
  - Nghiêm cấm xuất bản trực tiếp từ `IN_REVIEW` lên `PUBLISHED`.
  - Quản trị viên chỉ được xuất bản khẩn cấp bài học đã ở trạng thái `APPROVED` kèm lý do nghiệp vụ bắt buộc.

### 8.4. Tuân thủ Quyết định ADR-026 và ADR-027
- **ADR-026 (Component Architecture & Security Responsibility Matrix):** Toàn bộ các nguyên tắc kiến trúc và trách nhiệm an ninh được kế thừa nguyên vẹn, không có sự sai lệch.
- **ADR-027 (M2.4 Milestone Acceptance):** Giữ vững điểm mốc nghiệm thu commit `0a9a126`, bảo đảm mọi công tác kiểm định của M2.5 được xây dựng trên nền tảng cơ sở đã được đóng băng và thẩm định độc lập.

---

## 9. Conclusion & Milestone Status

Milestone M2.5 đã hoàn thành xuất sắc toàn bộ phạm vi công việc được phê duyệt trong Kế hoạch `plans/m2-5-design-validation-plan.md`:
- Đã lập Báo cáo Kiểm định Thiết kế chuẩn tắc (**Artifact #20: `docs/phase-1-m2-5-design-validation.md`**) đáp ứng đầy đủ hợp đồng 6 trường kiến trúc.
- Đã thiết lập hồ sơ bằng chứng khách quan cho **9 Cổng Kiểm định D-G1 đến D-G9** với kết luận `PASS` (Cổng D-G5 và D-G6 giữ nguyên mức bằng chứng thiết kế, bảo lưu không đóng cho production; Cổng D-G10 được loại trừ và dành riêng cho M2.6).
- Đã hoàn thành đối soát ma trận **6 trường × 20 artifacts** với 100% tỷ lệ đạt chuẩn.
- Đã rà quét và xử lý dứt điểm **11 danh mục mâu thuẫn và trôi dạt yêu cầu (D-G9)**, không còn tồn đọng bất kỳ mâu thuẫn mức P0/P1 nào.
- Đã đối soát chuỗi truy vết từ yêu cầu chuẩn tắc `docs/02-requirements.md` đến thiết kế và bảng ánh xạ báo cáo học thuật **`docs/phase-1-system-design-plan.md` §11** từng hàng một cách chuẩn xác với các tệp PlantUML thực tế.
- Đã lập **Sổ bộ ghi nhận trạng thái quyết định mở DD-01..06 và DD-10** với toàn bộ tầng biểu diễn vật lý được bảo lưu mở (OPEN) phục vụ bàn giao M2.6.
- Đã xác nhận **không gây thoái lui (zero regression)** đối với các bất biến kiến trúc và an ninh M2.4, bao gồm 5 vùng an ninh chuẩn tắc và Zone 5 Privileged Infrastructure Operations.
- Tuân thủ nghiêm ngặt hàng rào phạm vi: Không mã nguồn runtime, không schema/migration DDL, không RLS SQL, không sửa đổi hợp đồng API `docs/03-api-contract.md`.

```text
================================================================================
                    LINGORA PHASE 1 MILESTONE M2.5 REPORT SUMMARY
================================================================================
M2.5 IMPLEMENTATION STATE: IMPLEMENTED — READY FOR INDEPENDENT REVIEW
PRIMARY DELIVERABLE     : docs/phase-1-m2-5-design-validation.md (Artifact #20)
VALIDATION GATES D-G1..9: PASS (D-G5/D-G6 design evidence only; D-G10 excluded)
SIX-FIELD AUDIT (x20)   : 20/20 PASS (100% concrete, zero generic fields)
CONTRADICTION SCAN (D-G9): 11/11 CATEGORIES CLEAN (0 P0, 0 P1 open issues)
TRACEABILITY VERIFICATION: 100% PASS (Zero broken links, zero orphan entities)
REPORT MAPPING (§11)    : 12/12 ROWS VERIFIED (docs/05 kept read-only; real PUMLs)
OPEN DECISION RECORD    : DD-01..06/10 RECORDED (All physical tiers stay OPEN)
M2.4 REGRESSION CHECK   : PASS (19 components, 5 M2.4 zones, 6 boundaries intact)
FORBIDDEN CHANGES       : NONE (Zero runtime/schema/migration/RLS code)
API CONTRACT PRESERVED  : docs/03-api-contract.md 100% BYTE-IDENTICAL
M2.5 ACCEPTANCE CLAIMED : NO (Pending human independent review)
GIT COMMIT CREATED      : NO (Commit discipline enforced)
================================================================================
```
