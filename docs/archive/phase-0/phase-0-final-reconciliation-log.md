# LINGORA — BẢNG NHẬT KÝ ĐỒNG BỘ TÀI LIỆU CUỐI CÙNG (PHASE 0 FINAL RECONCILIATION LOG)

**Ngày thực hiện:** 14/09/2026  
**Trạng thái:** COMPLETED  
**Mục tiêu:** Lưu vết chi tiết toàn bộ các chỉnh sửa đồng bộ tài liệu kỹ thuật (Documentation Reconciliation) theo Case 1 & Case 5 trước khi thực hiện đánh giá nghiệm thu cuối cùng (Final Audit Verdict) cho Requirements Freeze.  
**Ranh giới tuyệt đối:** Toàn bộ chỉnh sửa chỉ áp dụng trên tầng tài liệu đặc tả (`docs/`); TUYỆT ĐỐI KHÔNG SỬA CODE, KHÔNG SỬA SCHEMA PRISMA, KHÔNG TẠO MIGRATION, KHÔNG THAY ĐỔI DATABASE, KHÔNG THAY ĐỔI PRODUCT DECISION D1–D9.

---

## 1. Tổng hợp Danh mục Đồng bộ (Reconciliation Summary)

| Mã ID | Hạng mục Xử lý | Phân loại Lỗi | Tệp Tài liệu Tác động | Tình trạng |
|:---:|---|---|---|:---:|
| **ACT-01** | Quyền hạn Xuất bản bài học | Mâu thuẫn Quyết định PO (D2=2B) | `docs/phase-0-roles-and-mvp-final.md` | `RESOLVED` |
| **ACT-02** | Cơ chế Đánh giá Định vị (Placement Test) | Mâu thuẫn Quyết định PO (D6) & Sai lệch CEFR | `docs/02-requirements.md` | `RESOLVED` |
| **ACT-03** | Hạ cấp Yêu cầu Huy hiệu (Badges) mồ côi | Xung đột Phạm vi (Scope Conflict / Orphan Requirement) | `docs/02-requirements.md`, `docs/05-traceability-matrix.md` | `RESOLVED` |
| **ACT-04** | Đồng bộ Ma trận Truy vết Placement Test | Lệch Runtime Surface & CEFR claim | `docs/05-traceability-matrix.md` | `RESOLVED` |
| **ACT-05** | Tách bạch 14 Core Use Cases & Phân hệ Cohort | Nhầm lẫn Phạm vi MVP (UC Scope Conflict) | `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md` | `RESOLVED` |
| **ACT-07** | Đánh dấu Tài liệu Báo cáo Cũ (Legacy Reports) | Báo cáo cũ chứa 10-UC catalog không còn hiệu lực | `docs/report/*.md` (4 tệp) | `RESOLVED` |
| **ACT-08** | Khóa Bảng Quy đổi Điểm Placement Mapping A | Chốt Quyết định PO; đóng `OD-PLACEMENT-MAPPING` | `docs/09`, `docs/02`, `docs/05`, `docs/06` | `RESOLVED` |
| **ACT-09** | Đồng bộ Phân định 3 Tầng Dữ liệu (OD-3 Sync) | Thay nhãn `IN_DATABASE` mơ hồ bằng Target vs Applied | `docs/06-system-analysis.md`, `docs/07-data-dictionary.md` | `RESOLVED` |

---

## 2. Chi tiết Từng Hành động Đồng bộ

### 2.1 ACT-01: Chuẩn hóa Quyền hạn Xuất bản Bài học (Publish Authority)
- **Phân loại:** Sửa mâu thuẫn trực tiếp với Quyết định PO D2=2B.
- **Tệp tác động:** [phase-0-roles-and-mvp-final.md](file:///d:/school/btl/docs/phase-0-roles-and-mvp-final.md#L64-L65).
- **Vấn đề phát hiện:** Văn bản trước đó ghi *"Trạng thái PUBLISHED: Chỉ Moderator hoặc Administrator mới có quyền kích hoạt"*. Điều này vi phạm trực tiếp Quyết định D2=2B đã được PO freeze: Quyền phê duyệt chuyên môn (`APPROVED`) thuộc về Moderator, nhưng trách nhiệm xuất bản công khai (`PUBLISHED`) thuộc về **Organizational Manager** (hoặc Administrator trong tình huống khẩn cấp).
- **Nội dung điều chỉnh:**
  - *Trước:* `Trạng thái PUBLISHED: Chỉ Moderator hoặc Administrator mới có quyền kích hoạt`
  - *Sau:* `Trạng thái PUBLISHED: Chỉ Organizational Manager (hoặc Administrator trong tình huống khẩn cấp) mới có quyền kích hoạt (theo D2=2B); Moderator chỉ cấp APPROVED.`
- **Căn cứ pháp lý:** Quyết định D2=2B tại [phase-0-final-product-owner-decision-sheet.md](file:///d:/school/btl/docs/phase-0-final-product-owner-decision-sheet.md).

---

### 2.2 ACT-02: Chuẩn hóa Yêu cầu Placement Test (P1-FR-016)
- **Phân loại:** Sửa mâu thuẫn giữa CEFR profiling quốc tế và cơ chế Starting Unit D6.
- **Tệp tác động:** [02-requirements.md](file:///d:/school/btl/docs/02-requirements.md#L260-L261).
- **Vấn đề phát hiện:** Văn bản cũ quy định `P1-FR-016` phân loại người học thành các cấp độ CEFR A1–B2 và tự động xếp vào trình độ CEFR tương ứng. Thực tế theo Quyết định D6, Lingora chỉ triển khai bài kiểm tra khoảng 30 câu hỏi để xác định **Starting Unit** trong Course, cho phép Bỏ qua (Skip bắt đầu từ Unit 1), cho phép Retake, và bảng ánh xạ `OD-PLACEMENT-MAPPING` vẫn đang `OPEN / CURRICULUM-DEPENDENT`. Hệ thống không tuyên bố cấp chứng chỉ CEFR độc lập.
- **Nội dung điều chỉnh:**
  - *Trước:* `P1-FR-016: Hệ thống phân loại người học thành các cấp độ CEFR (A1, A2, B1, B2) dựa trên điểm Placement Test và xếp vào trình độ tương ứng. (Must)`
  - *Sau:* `P1-FR-016: Hệ thống cung cấp bài kiểm tra định vị (~30 câu) đề xuất Starting Unit phù hợp, cho phép học viên bỏ qua (Skip - bắt đầu từ Unit 1) hoặc làm lại (Retake). Bảng quy đổi điểm sang Starting Unit tuân thủ OD-PLACEMENT-MAPPING (hiện OPEN / CURRICULUM-DEPENDENT). (Must)`
- **Căn cứ pháp lý:** Quyết định D6 tại [phase-0-final-product-owner-decision-sheet.md](file:///d:/school/btl/docs/phase-0-final-product-owner-decision-sheet.md).

---

### 2.3 ACT-03: Hạ cấp Yêu cầu Huy hiệu Thành tích (P1-FR-017)
- **Phân loại:** Xung đột phạm vi & Orphan Requirement.
- **Tệp tác động:** [02-requirements.md](file:///d:/school/btl/docs/02-requirements.md#L261) & [05-traceability-matrix.md](file:///d:/school/btl/docs/05-traceability-matrix.md#L76).
- **Vấn đề phát hiện:** `P1-FR-017` yêu cầu cấp huy hiệu khi đạt cột mốc và xếp loại `Must`. Tuy nhiên, trong cơ sở dữ liệu Prisma hiện tại hoàn toàn KHÔNG CÓ thực thể `Badge`, `Achievement`, `UserBadge`. API không có endpoint quản lý huy hiệu. Việc để `Must` tạo ra yêu cầu mồ côi không thể kiểm chứng.
- **Nội dung điều chỉnh:**
  - Chuyển phân hạng `P1-FR-017` từ `Must` sang `Nice / P2 (Optional Gamification / Deferred from Must)`.
  - Bổ sung ghi chú rõ ràng: Hoãn triển khai thực thể Badge trong MVP để tập trung tối đa vào luồng sư phạm cốt lõi; thành tích cá nhân thể hiện qua `streakCount` và tỷ lệ hoàn thành bài học.
- **Căn cứ pháp lý:** Quyết định D4=4A (tối giản thực thể) và ranh giới bảo toàn schema Phase 0.

---

### 2.4 ACT-04: Đồng bộ Bảng Truy vết Kỹ thuật cho Placement Test
- **Phân loại:** Sửa mô tả kiểm chứng và bề mặt runtime.
- **Tệp tác động:** [05-traceability-matrix.md](file:///d:/school/btl/docs/05-traceability-matrix.md#L14-L75).
- **Vấn đề phát hiện:** Dòng 14 và Dòng 75 của Ma trận truy vết vẫn mô tả bề mặt runtime là "CEFR mapper" và yêu cầu "CEFR mapping logic".
- **Nội dung điều chỉnh:**
  - Dòng 14: Đổi thành `Starting Unit mapper (OD-PLACEMENT-MAPPING: OPEN)`.
  - Dòng 75: Đổi thành `~30 Questions & Starting Unit mapping (Skip/Retake support; OD-PLACEMENT-MAPPING: OPEN)`.
- **Căn cứ pháp lý:** Đồng bộ với ACT-02 và Quyết định D6.

---

### 2.5 ACT-05: Chuẩn hóa Cấu trúc Danh mục Use Case (14 Core + 1 Optional B2B)
- **Phân loại:** Xung đột ranh giới phạm vi Use Case.
- **Tệp tác động:** [05-traceability-matrix.md](file:///d:/school/btl/docs/05-traceability-matrix.md#L52), [06-system-analysis.md](file:///d:/school/btl/docs/06-system-analysis.md#L374).
- **Vấn đề phát hiện:** Một số tài liệu ghi "15 Use Cases MVP", vô hình trung đưa phân hệ B2B Lớp học liên kết (`UC-15: Manage Cohorts`) thành yêu cầu bắt buộc của MVP B2C cốt lõi. Trong khi đó, mô hình cơ sở dữ liệu chưa có bảng `Cohort`, và PO xác định MVP tập trung vào B2C.
- **Nội dung điều chỉnh:**
  - Tách danh mục thành: **14 Use Cases Cốt lõi (Core MVP UC-01..UC-14)** và **1 Phân hệ Mở rộng Tùy chọn (Optional B2B Module UC-15)**.
  - Tại `UC-15` trong `06-system-analysis.md`: Bổ sung cảnh báo phân loại:
    `> **Phân loại Phân hệ:** OPTIONAL B2B MODULE / FUTURE (Non-MVP — Không thuộc phạm vi 14 Use Case cốt lõi bắt buộc của MVP).`
- **Căn cứ pháp lý:** Ranh giới MVP-17 và cấu trúc phân hệ giáo dục B2C vs B2B.

---

### 2.6 ACT-06: Khử Trường ma (Ghost Fields) & Chuẩn hóa Trạng thái Vòng đời
- **Phân loại:** Đồng bộ dữ liệu logic với Prisma Schema mục tiêu.
- **Tệp tác động:** [06-system-analysis.md](file:///d:/school/btl/docs/06-system-analysis.md).
- **Vấn đề phát hiện:**
  - Tài liệu phân tích hệ thống sử dụng trường ma `assignedToId` và `approvedBy` trên entity `Lesson`, trong khi Prisma schema định nghĩa là `creatorId` và `reviewerId`.
  - Sử dụng trạng thái `UNPUBLISHED` (không tồn tại trong enum `ContentStatus` gồm `[DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, ARCHIVED]`).
  - Định nghĩa Streak ghi sai cơ chế reset: "bỏ lỡ ngày học -> streakCount = 0". Theo quy tắc của Lingora, streak không tự động chạy cronjob về 0 mà được reset về 1 khi người dùng có hoạt động hợp lệ tiếp theo sau một ngày bị ngắt quãng.
- **Nội dung điều chỉnh:**
  - Thay thế toàn bộ `assignedToId` $\rightarrow$ `creatorId` (bao gồm mô tả, bảng trạng thái, và sơ đồ tuần tự Mermaid `BF-03`, `BF-05`).
  - Thay thế `approvedBy` $\rightarrow$ `reviewerId` trong sơ đồ `BF-05`.
  - Thay thế `UNPUBLISHED` $\rightarrow$ `ARCHIVED` trong bảng chuyển trạng thái, luồng D3 và sơ đồ `BF-07`.
  - Chuẩn hóa định nghĩa Streak: `UPDATE Profile SET streakCount = 1, lastDate = today` khi người học hoạt động trở lại sau khi bỏ lỡ ngày học.
- **Căn cứ pháp lý:** `prisma/schema.prisma` và Quyết định D3=3B, D8.

---

### 2.7 ACT-07: Đánh dấu Cảnh báo trên 4 Tệp Báo cáo Học thuật Cũ (Legacy Reports)
- **Phân loại:** Ngăn ngừa hiểu nhầm tài liệu lịch sử.
- **Tệp tác động:**
  1. [lingora-requirements-and-use-cases.md](file:///d:/school/btl/docs/report/lingora-requirements-and-use-cases.md)
  2. [lingora-project-1-requirements-report.md](file:///d:/school/btl/docs/report/lingora-project-1-requirements-report.md)
  3. [lingora-project-1-lecturer-format.md](file:///d:/school/btl/docs/report/lingora-project-1-lecturer-format.md)
  4. [lingora-project-1-five-chapter-report.md](file:///d:/school/btl/docs/report/lingora-project-1-five-chapter-report.md)
- **Vấn đề phát hiện:** Các tệp báo cáo cũ trong thư mục `docs/report/` phản ánh danh mục cũ gồm 10 Use Cases và 2 vai trò (`Learner`, `Admin`), chưa cập nhật 6 vai trò canonical và 14 Core Use Cases mới. Nếu không đánh dấu, người đọc hoặc agent có thể nhầm lẫn với tài liệu đặc tả hiện hành.
- **Nội dung điều chỉnh:** Thêm khối cảnh báo rõ ràng ở đầu mỗi tệp:
  ```markdown
  > [!WARNING]
  > **[HISTORICAL / SUPERSEDED — LEGACY 10-UC CATALOG]**
  > Tài liệu này thuộc tập báo cáo học thuật đợt 1 (legacy 10 Use Cases, 2 vai trò Learner/Admin). Toàn bộ danh mục Use Case chuẩn mực của dự án Lingora hiện đã được nâng cấp thành **14 Use Cases Cốt lõi (Core MVP UC-01..UC-14) & 1 Phân hệ Mở rộng Tùy chọn (Optional B2B Module UC-15)** phủ 6 vai trò canonical tại 06-system-analysis.md và 05-traceability-matrix.md. Giữ tài liệu này chỉ với mục đích tham khảo lịch sử đồ án.
  ```
- **Căn cứ pháp lý:** Quy định về Document Lifecycle tại `AGENTS.md`.

### 2.8 ACT-08: Khóa Chính thức Bảng Quy đổi Điểm Định vị Placement Mapping A
- **Phân loại:** Thực thi Quyết định Sản phẩm chính thức của Product Owner (PO Ruling).
- **Tệp tác động:**
  1. [09-placement-and-jump-specification.md](file:///d:/school/btl/docs/09-placement-and-jump-specification.md#L52-L66)
  2. [02-requirements.md](file:///d:/school/btl/docs/02-requirements.md#L259)
  3. [05-traceability-matrix.md](file:///d:/school/btl/docs/05-traceability-matrix.md#L14-L75)
  4. [06-system-analysis.md](file:///d:/school/btl/docs/06-system-analysis.md#L218)
  5. [phase-0-product-owner-approval-packet.md](file:///d:/school/btl/docs/phase-0-product-owner-approval-packet.md)
- **Vấn đề phát hiện:** Tồn tại hai phương án bảng quy đổi cạnh tranh giữa `docs/09 §2` (8–12, 13–17...) và Approval Packet sơ bộ (8–13, 14–19...).
- **Nội dung điều chỉnh:**
  - Product Owner đã chính thức phê duyệt **Phương án A (Mapping A)**:
    `0–7 → U1`, `8–12 → U2`, `13–17 → U3`, `18–22 → U4`, `23–26 → U5`, `27–30 → U6`.
  - Khóa chính thức trạng thái: `OD-PLACEMENT-MAPPING: APPROVED MAPPING A` (Đã giải quyết và khóa).
  - Loại bỏ hoàn toàn phương án cạnh tranh cũ khỏi mọi tài liệu hiện hành.
  - Khẳng định bản chất: `CURRICULUM-BASED PRODUCT PLACEMENT RULE`, không phải CEFR certification, không phải scientific calibration.
- **Căn cứ pháp lý:** Quyết định chính thức của Product Owner.

---

### 2.9 ACT-09: Đồng bộ Khái niệm Hiện thực 3 Tầng Dữ liệu (OD-3 Reality Check)
- **Phân loại:** Chuẩn hóa thuật ngữ kỹ thuật, xóa bỏ ngộ nhận CSDL hiện tại.
- **Tệp tác động:**
  1. [06-system-analysis.md](file:///d:/school/btl/docs/06-system-analysis.md#L680-L698)
  2. [07-data-dictionary.md](file:///d:/school/btl/docs/07-data-dictionary.md#L14-L18) & [L425-L427](file:///d:/school/btl/docs/07-data-dictionary.md#L425-L427)
- **Vấn đề phát hiện:** `docs/06 §6.1` sử dụng nhãn `IN_DATABASE` cho thực thể `Lesson` (với các trường `creatorId`, `reviewerId`, 6-state status) và `Exercise` (với `GRAMMAR`, `LISTENING`). Thực tế các trường/enum này mới chỉ tồn tại trong **Target Prisma Schema**, chưa có trong **PostgreSQL Applied Database** (vốn chỉ có 3 migration ban đầu, boolean `is_published`). Điều này gây hiểu lầm rằng hệ thống runtime hiện tại đã có phân cấp Unit và quy trình 6 vai trò.
- **Nội dung điều chỉnh:**
  - Thay thế nhãn mơ hồ `IN_DATABASE` bằng phân loại rõ ràng:
    - `APPLIED_IN_DATABASE`: Các bảng/trường đã chạy migration thực tế trong PostgreSQL.
    - `TARGET_SCHEMA_ONLY`: Các model/trường đã khai báo trong `schema.prisma` mục tiêu, đang chờ migration M3 (`Unit`, `AuditLog`).
    - `PARTIALLY_APPLIED`: Đã có bảng cơ bản nhưng các trường nâng cao thuộc về Target M2/M3 (`Lesson`, `Exercise`).
    - `LOGICAL GAP / OPTIONAL B2B`: Thực thể logic tương lai, không tạo bảng trong Phase 0 (`Cohort`, `SupportTicket`).
  - Thêm cảnh báo rõ ràng tại đầu biểu đồ ERD trong `docs/07`: ERD phản ánh trạng thái CSDL đang áp dụng (Applied DB), cần migration M3 trước khi kích hoạt Unit và quy trình 6 vai trò trên runtime.
- **Căn cứ pháp lý:** Nguyên tắc trung thực kỹ nghệ phần mềm và quy định tại `OD-3`.

---

## 3. Kết luận Sau Toàn bộ Đợt Đồng bộ (Final Reconciliation Verdict)

1. **Tính Nhất quán Tuyệt đối Xuyên suốt Dự án:** Toàn bộ 9 hành động hiệu chỉnh tài liệu (`ACT-01` đến `ACT-09`) đã giải quyết 100% các xung đột, mâu thuẫn văn bản, trường ma, và sự mơ hồ về ranh giới dữ liệu.
2. **Khép lại Hoàn toàn Điểm nghẽn Cuối cùng:** Với việc Product Owner phê duyệt chính thức **Placement Mapping A**, quyết định mở `OD-PLACEMENT-MAPPING` đã chính thức được đóng lại.
3. **Nguyên tắc Bảo tồn Tuyệt đối:** Quá trình đồng bộ hoàn toàn tuân thủ kỷ luật: **0 dòng code runtime bị thay đổi, 0 dòng diff trong `schema.prisma`, 0 migration SQL mới được tạo, giữ nguyên Product Policy D1–D9.**
4. **Trạng thái Dự án:** Đã hội tụ đầy đủ điều kiện để chuyển sang **`READY FOR REQUIREMENTS FREEZE`**.
