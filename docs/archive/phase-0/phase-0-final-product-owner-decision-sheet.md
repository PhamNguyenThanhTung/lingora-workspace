# LINGORA — FINAL PRODUCT OWNER DECISION SHEET
**Giai đoạn:** Phase 0 Product Policy Freeze  
**Mục tiêu:** Tài liệu chốt hạ và ghi nhận toàn diện toàn bộ quyết định chính sách sản phẩm (Product Policy) chính thức từ Product Owner.  
**Trạng thái tài liệu:** `PHASE 0 — PRODUCT FROZEN (Note: OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT)`  
**Nguyên tắc bắt buộc:**  
- KHÔNG CODE, KHÔNG SỬA PRISMA SCHEMA, KHÔNG TẠO MIGRATION, KHÔNG SỬA REQUIREMENTS CANONICAL, KHÔNG CHUYỂN SANG M2.  
- Đóng băng chính sách sản phẩm (`Product Policy Freeze`), KHÔNG đồng nghĩa với việc Requirements đã đóng băng (`Requirements Freeze`).  
- Toàn bộ các quyết định D1 – D9 đã được chuyển thành `USER DECISION` chính thức từ Product Owner.  
- Loại bỏ hoàn toàn các giả định hay thông số cũ bị xung đột (80% pass score, 85% jump, 25 overdue throttle, 15/20 câu placement, 21–30 ngày mastery).  
- Giữ `OD-PLACEMENT-MAPPING` ở trạng thái `OPEN / CURRICULUM-DEPENDENT`, không tự ý bịa đặt dải điểm hay ánh xạ Unit; quyết định mở này không chặn Product Freeze mà là điều kiện phụ thuộc cho bước thiết kế Đề cương & Yêu cầu tiếp theo.  
- Phân loại trạng thái minh bạch: `FACT`, `ADR-LOCKED`, `USER DECISION`, `PROPOSAL`, `OPEN DECISION`, `DEFERRED`.

---

## I. HỆ THỐNG PHÂN LOẠI TRẠNG THÁI

| Ký hiệu | Ý nghĩa Kỹ thuật / Sản phẩm |
|---|---|
| `FACT` | Sự thật kỹ thuật bất biến của hệ thống (Next.js 15, Supabase, 6 Roles enum, không ML). |
| `ADR-LOCKED` | Quyết định kiến trúc đã khóa trong Architecture Decision Records (ADR-008, ADR-014). |
| `USER DECISION` | Quyết định chính sách sản phẩm chính thức đã được Product Owner phê duyệt dứt khoát và khóa nguyên tắc. |
| `PROPOSAL` | Đề xuất kỹ thuật / sư phạm của Agent, chỉ dùng để tham khảo khi có yêu cầu. |
| `OPEN DECISION` | Tham số phụ thuộc vào dữ liệu chuyên môn, để mở chờ triển khai theo nội dung thực tế (Curriculum-dependent). |
| `DEFERRED` | Tính năng/ý tưởng đã thống nhất tạm hoãn sau giai đoạn pilot (không có trong MVP v1). |

---

## II. BẢNG TỔNG HỢP QUYẾT ĐỊNH SẢN PHẨM PHÊ DUYỆT (D1 – D9)

| Mã Quyết định | Lĩnh vực Sản phẩm | Lựa chọn Chính thức của Product Owner | Trạng thái |
|---|---|---|---|
| **D1** | Content Workflow | **1A — Manager-Driven:** Manager lập kế hoạch Course/Unit/Lesson skeleton $\rightarrow$ phân công Creator $\rightarrow$ Creator biên soạn $\rightarrow$ Moderator duyệt $\rightarrow$ Manager xuất bản. Creator không được tự ý bypass planning/assignment. | `USER DECISION` |
| **D2** | Separation of Duties | **2B:** Moderator kiểm duyệt chuyên môn (`APPROVED`); Manager chịu trách nhiệm xuất bản (`PUBLISHED`); Creator tuyệt đối cấm tự duyệt/tự xuất bản nội dung của mình. | `USER DECISION` |
| **D3** | Published Content Update | **3B — Revision / Clone-to-Draft:** Published v1 $\rightarrow$ Clone Draft v2 $\rightarrow$ Moderator duyệt $\rightarrow$ Manager xuất bản v2. Không sửa in-place trực tiếp bài học đã xuất bản. | `USER DECISION` |
| **D4** | Assessment Boundary | **4A — Unified Exercise Model:** Dùng chung `Exercise` (`isAssessmentMode = true`) cho cả học tập, kiểm tra, placement, jump. Không tạo bảng `Exam`/`QuestionBank` trong MVP. | `USER DECISION` |
| **D5** | Curriculum & Jump | **Conditional Jump:** Jump 1 Unit (kiểm tra bài trước), 2–3 Units (tích lũy), >3 Units (toàn diện, không cấm). Điểm đạt $\ge 95\%$ (Product Policy). Trượt $\rightarrow$ Cooldown 24h trước khi thi lại. | `USER DECISION` |
| **D6** | Placement Test | **Exercise-Based Placement:** MVP-03 bắt buộc, có Skip, có Retake, quy mô ~30 câu, không claim CEFR, output ra Starting Unit. *(OD-PLACEMENT-MAPPING: OPEN / CURRICULUM-DEPENDENT).* | `USER DECISION` |
| **D7** | Controlled Retry | **2-Pass Controlled Retry:** Hạn mức retry 10% tổng số câu ($\max(1, \lfloor N \times 0.10 \rfloor)$); Hệ số cứu điểm 70%; Làm hết retry cho phép $\rightarrow$ `COMPLETED`; Không áp điểm sàn hoàn thành. | `USER DECISION` |
| **D8** | Personalized SRS | **Policy B — 4 Layers Balanced:** Baseline $[1, 3, 7, 14, 30]$ ngày; Due Queue; Item Adaptation; Learner Workload Adaptation. Thuật toán xác định, không ML. | `USER DECISION` |
| **D9** | Streak & Recovery | **MVP v1 Pure Streak:** Local timezone, đạt mục tiêu ngày +1, miss 1 ngày reset về 1 khi quay lại. Không Freeze/Recovery trong MVP v1; Recovery thuộc DEFERRED. | `USER DECISION` / `DEFERRED` |

---

## III. CHI TIẾT TOÀN VĂN 9 QUYẾT ĐỊNH CHÍNH THỨC (D1 – D9)

### D1 — Content Workflow: 1A — Manager-Driven Content Workflow (`USER DECISION`)
- **Quy trình chuẩn mực 5 bước:**
  $$\text{Organizational Manager (Kế hoạch)} \longrightarrow \text{Lesson Creator (Biên soạn)} \longrightarrow \text{Moderator (Kiểm duyệt)} \longrightarrow \text{Organizational Manager (Xuất bản)}$$
  1. `ORGANIZATIONAL_MANAGER`: Thiết kế toàn bộ đề cương Khóa học (`Course`), Chủ điểm (`Unit`) và danh mục bài học khung (`Lesson Skeleton`).
  2. `ORGANIZATIONAL_MANAGER`: Thực hiện phân công cụ thể (`assign`) từng bài học cho `LESSON_CREATOR`.
  3. `LESSON_CREATOR`: Tiến hành biên soạn nội dung chi tiết trong phạm vi bài học được giao. **Tuyệt đối KHÔNG được tự ý tạo bài mới nằm ngoài kế hoạch / phân công (Creator cannot bypass assignment/planning).**
  4. `MODERATOR`: Kiểm duyệt độc lập về mặt chuyên môn, sư phạm, chính tả, bản quyền và chất lượng bài học.
  5. `ORGANIZATIONAL_MANAGER`: Rà soát tổng thể và thực hiện kích hoạt xuất bản (`PUBLISH`).

### D2 — Separation of Duties & Publishing Authority: 2B (`USER DECISION`)
- **Phân định thẩm quyền và trách nhiệm:**
  - `MODERATOR`: Chịu trách nhiệm thẩm định chất lượng học liệu, có quyền yêu cầu sửa đổi (`CHANGES_REQUESTED`) hoặc phê duyệt đạt chuẩn chuyên môn (`APPROVED`).
  - `ORGANIZATIONAL_MANAGER`: Là vai trò chịu trách nhiệm kích hoạt xuất bản (`PUBLISHED`) nội dung lên môi trường trực tiếp.
  - `LESSON_CREATOR`: **Tuyệt đối KHÔNG có quyền tự duyệt hay tự xuất bản bài học do chính mình biên soạn** (Creator cannot approve/publish own content).
  - `ADMINISTRATOR`: Giám sát tuân thủ toàn hệ thống thông qua `AuditLog`, không can thiệp vào quy trình biên tập và phê duyệt chuyên môn thường nhật.

### D3 — Published Content Update: 3B — Revision / Clone-to-Draft Workflow (`USER DECISION`)
- **Quy trình cập nhật nội dung đã xuất bản:**
  $$\text{Published v1} \longrightarrow \text{Nhân bản tạo Draft v2} \longrightarrow \text{Moderator Review} \longrightarrow \text{Manager Publish v2}$$
- **Nguyên tắc toàn vẹn dữ liệu:**
  - **Tuyệt đối không sử dụng cơ chế chỉnh sửa trực tiếp (no general in-place editing) trên bài học đã xuất bản.**
  - Mọi cập nhật nội dung trên bài học đã `PUBLISHED` đều phải nhân bản thành một bản thảo mới (`Draft v2`), trải qua đầy đủ quy trình kiểm duyệt của Moderator và phê duyệt xuất bản bởi Organizational Manager.
  - Đảm bảo an toàn cho người học: Học viên đang học dở phiên bản v1 không bị lỗi runtime, không bị mất phiên học hoặc xung đột payload tiến độ học tập.

### D4 — Assessment Boundary: 4A — Unified Exercise Model Architecture (`USER DECISION`)
- **Mô hình thực thể tinh gọn trong MVP v1:**
  - MVP sử dụng thống nhất một mô hình thực thể `Exercise` chung cho cả:
    * Bài tập rèn luyện thông thường (`Learning Exercise`)
    * Bài kiểm tra cuối Unit (`Assessment Exercise`)
    * Bài kiểm tra đầu vào (`Placement Test`)
    * Bài kiểm tra học vượt (`Jump Assessment`)
  - Chuyển đổi ngữ cảnh thông qua cờ logic và thuộc tính cấu hình: `isAssessmentMode = true`.
  - **KHÔNG xây dựng riêng thực thể `Exam` hay `QuestionBank` trong cơ sở dữ liệu của giai đoạn MVP.**
- **Ranh giới tính năng mở rộng (`FUTURE / OPTIONAL / DEFERRED`):**
  - Không tuyên bố loại bỏ vĩnh viễn các thực thể trên. Các tính năng như `QuestionBank`, `Import DOCX`, `Formula parsing (LaTeX)`, `Advanced Exam Security / Proctoring` là các tính năng nằm ngoài phạm vi hiện tại của MVP (out of MVP current scope), không phải sự loại bỏ vĩnh viễn (not permanent rejection), chính thức xếp vào danh mục `FUTURE / OPTIONAL / DEFERRED` phục vụ nâng cấp sau này.

### D5 — Curriculum Structure & Conditional Jump (`USER DECISION`)
- **Cấu trúc phân cấp & Tiến trình:**
  - `Course → Unit → Lesson → Exercise`. Tiến trình học chính là tuyến tính; người học được phép xem trước (`Preview`) tiêu đề và nội dung cơ bản chưa mở ở chế độ read-only.
- **Quy tắc Kiểm tra Học vượt (Conditional Jump) theo khoảng cách:**
  - **Jump 1 Unit:** Bắt buộc hoàn thành bài kiểm tra (`Assessment`) của Unit liền trước.
  - **Jump 2–3 Units:** Bắt buộc vượt qua bài kiểm tra tích lũy (`Cumulative Assessment`) bao quát các Unit nhảy cóc.
  - **Jump > 3 Units:** Bắt buộc vượt qua bài kiểm tra định vị toàn diện (`Comprehensive Diagnostic Assessment`) có độ dài và độ bao phủ lớn hơn. **Không cấm người học Jump > 3 Units.**
- **Ngưỡng điểm đạt Jump:**
  - Product Owner chốt chính thức: **$\ge 95\%$**.
  - **Ranh giới quy chuẩn bắt buộc:** Ngưỡng **95% là PRODUCT POLICY** do Product Owner quy định nhằm đảm bảo tiêu chuẩn khắt khe cho học vượt, **KHÔNG TUYÊN BỐ là "scientific truth" hay "scientific mastery threshold"** trong các tài liệu và báo cáo học thuật.
- **Xử lý khi trượt bài Jump (< 95%):**
  - Không được phép mở khóa học vượt.
  - Áp dụng thời gian làm mát (**Cooldown 24 giờ**) trước khi được phép làm lại bài kiểm tra Jump (ngăn chặn hành vi spam bài thi hoặc đoán mò đáp án).

### D6 — Placement Test Baseline (`USER DECISION` kèm 1 Open Decision)
- **Quy chuẩn chức năng kiểm tra đầu vào:**
  - Là bài kiểm tra năng lực thực tế (`MVP-03` bắt buộc).
  - Có tùy chọn Bỏ qua (`Skip`) $\rightarrow$ Gán Starting Unit mặc định (Unit 1).
  - Có tính năng Làm lại (`Retake`) từ trang Hồ sơ cá nhân (Profile).
  - Kết quả đầu ra: Xác định **Starting Unit** phù hợp nhất trên lộ trình học.
  - Xây dựng trên nền tảng `Exercise` với `isAssessmentMode = true`.
  - **Tuyệt đối không tuyên bố/claim chứng chỉ hay chuẩn CEFR quốc tế.**
- **Quy mô bài kiểm tra:**
  - Product Owner chốt quy mô: **~ 30 câu hỏi** (khoảng 30 câu, bảo đảm bao quát kiến thức mà không gây kiệt sức cho người mới onboarding).
- **Quyết định Còn Mở duy nhất:** Bảng ánh xạ Điểm số $\rightarrow$ Starting Unit (`OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT`).

### D7 — Controlled Retry Core Behavior (`USER DECISION`)
- **Quy trình thử lại 2 vòng (2-Pass Controlled Retry):**
  - **Vòng 1 (First Pass):** Học viên làm toàn bộ câu hỏi của bài học. Những câu trả lời sai được hệ thống gom và đưa về cuối phiên học.
  - **Vòng 2 (Second Pass):** Học viên được làm lại một lần duy nhất các câu đã trả lời sai ở vòng 1.
  - Đúng ở vòng retry $\rightarrow$ Được cứu điểm theo tỷ lệ cứu điểm quy định (70% credit).
  - Sai ở vòng retry $\rightarrow$ Vẫn tính là sai trong toàn bộ phiên học.
- **Ngân sách câu cứu (Retry Allowance):**
  - Giới hạn tối đa: **10% tổng số câu hỏi** của bài học:
    $$\text{retry\_allowance} = \max\left(1, \lfloor N \times 0.10 \rfloor\right)$$
    *(Ví dụ: Bài 10 câu được cứu tối đa 1 câu; bài 20 câu cứu tối đa 2 câu; bài 30 câu cứu tối đa 3 câu).*
- **Hệ số cứu điểm (Retry Credit):**
  - Product Owner chốt chính thức: **70% (0.7)** cho câu trả lời đúng ở vòng retry.
- **Tiêu chuẩn Hoàn thành bài học (Lesson Completion Rule):**
  - Học viên hoàn thành toàn bộ câu hỏi ở vòng 1 VÀ hoàn thành đầy đủ các câu retry được phép trong hạn mức allowance $\rightarrow$ Bài học được xác nhận chuyển trạng thái **`COMPLETED`**.
  - **KHÔNG ÁP DỤNG NGƯỠNG ĐIỂM SÀN (no completion score threshold - không yêu cầu 70%, 80%, hay 85%) để hoàn thành bài.**
  - **Tách biệt hoàn toàn Điểm số (Score) và Sự Hoàn thành (Completion):** Điểm số phản ánh độ chính xác phục vụ xếp hạng và thống kê; Sự hoàn thành ghi nhận sự kiên trì đi hết bài học và nỗ lực sửa sai theo quy định, là điều kiện mở khóa bài học tiếp theo.
- **Ranh giới quyết định:** Phương án lưu trữ chi tiết (Client memory/Session state vs Server) là chi tiết thiết kế kỹ thuật/triển khai, **không định nghĩa cơ chế lưu trữ như một USER DECISION**.

### D8 — Balanced Personalized SRS: Policy B (`USER DECISION`)
Product Owner chính thức phê chuẩn **Policy B (Balanced Personalized SRS)** với 4 tầng kiến trúc xác định, không dùng Machine Learning:
1. **Tầng 1 — Baseline Interval Ladder:** Thang giãn cách cơ sở $[1, 3, 7, 14, 30]$ ngày. Đây là tham số cấu hình khởi điểm (`CONFIGURABLE`), có thể tinh chỉnh trong quá trình vận hành, không phải quy luật khoa học cố định.
2. **Tầng 2 — Due Queue (Hàng đợi theo hạn):** Lập lịch dựa trên thời điểm đến hạn (`nextReviewAt <= now()`), ưu tiên bổ sung cho các từ vựng mới tiếp thu trong 3 ngày đầu; **hoàn toàn không lập lịch cố định theo ngày tạo từ vựng**.
3. **Tầng 3 — Item Performance Adaptation (Thích ứng theo độ khó từ):**
   - Đánh giá `Quên` (Again): Interval bị rút ngắn hoặc reset về 1 ngày.
   - Đánh giá `Nhớ` (Good): Interval tăng theo hệ số giãn cách.
   - Đánh giá `Dễ` (Easy): Interval tăng nhanh hơn với hệ số thưởng.
4. **Tầng 4 — Learner Workload Adaptation (Điều tiết tải nhận thức người học):**
   - Học viên học nhanh, nợ tồn ôn tập (review backlog) thấp $\rightarrow$ Cho phép tiếp nhận lượng từ mới bình thường hoặc tăng tốc.
   - Học viên học chậm hoặc nợ tồn ôn tập cao $\rightarrow$ Hệ thống tự động điều tiết giảm lượng từ mới nạp vào, ưu tiên tối đa giải phóng hàng đợi ôn tập để chống quá tải nhận thức.
- **Ranh giới kỹ thuật bất biến:**
  - Thuật toán hoàn toàn xác định (deterministic), thực thi nguyên tử an toàn qua RPC/service.
  - Không sử dụng Machine Learning (không DKT-LSTM, HLR, DQN).
  - Không thêm các thực thể ngoài phạm vi như `KnowledgeItem`, `LearnerSkillState`, `NextAction` vào schema canonical.
  - Các tham số tinh chỉnh kỹ thuật chưa chỉ định chi tiết (unspecified technical tuning) tiếp tục thuộc phạm vi công việc thiết kế và triển khai sau này (implementation/design work).

### D9 — Streak & Recovery: Phân loại Tạm hoãn (`USER DECISION` / `DEFERRED`)
- Không cần mở biểu quyết.
- **MVP v1:**
  - Tính theo múi giờ địa phương của người học (local timezone).
  - Hoạt động học tập hợp lệ trong ngày (qualifying daily activity) $\rightarrow$ Daily streak +1.
  - Bỏ lỡ 1 ngày (miss) $\rightarrow$ Khi quay lại học ở ngày kế tiếp, chuỗi streak **reset về 1**.
  - **Hoàn toàn KHÔNG có cơ chế Streak Freeze hay Streak Recovery trong MVP v1.**
- **Tương lai (`DEFERRED`):**
  - Toàn bộ cơ chế bảo vệ và khôi phục chuỗi (Streak Freeze, Streak Repair Quest, Milestone Shield) được xếp vào danh mục `DEFERRED`, sẽ được nghiên cứu tích hợp ở các giai đoạn sau MVP.

---

## IV. DUY NHẤT 1 QUYẾT ĐỊNH CÒN MỞ (SINGLE REMAINING OPEN DECISION)

```
========================================================================================
QUYẾT ĐỊNH CÒN MỞ DUY NHẤT: OD-PLACEMENT-MAPPING (OPEN / CURRICULUM-DEPENDENT)
========================================================================================
```

### Mã Quyết định: `OD-PLACEMENT-MAPPING`
- **Nội dung:** Bảng ánh xạ chi tiết giữa **Điểm số / Tỷ lệ trả lời đúng** của bài Placement Test và **Starting Unit** được đề xuất trên lộ trình học.
- **Trạng thái:** `OPEN / CURRICULUM-DEPENDENT`
- **Nguyên tắc bắt buộc:**
  1. **TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT (Do NOT invent):**
     - Không tự đặt dải điểm số (score bands).
     - Không tự gán ánh xạ Unit (Unit mapping).
     - Không tự đặt phần trăm cắt ngưỡng (percentage cutoffs) vượt ngoài các quy định đã được phê duyệt.
  2. Bảng ánh xạ này sẽ được xác định chính thức sau khi đề cương chi tiết của Khóa học tiếng Anh A1 (detailed English A1 curriculum) được thiết kế hoàn chỉnh.
  3. **Quyết định còn mở này TUYỆT ĐỐI KHÔNG CHẶN Product Freeze (must NOT block Product Freeze).**
  4. Đây là điều kiện phụ thuộc kỹ thuật cho giai đoạn Thiết kế Đề cương & Yêu cầu chi tiết sau này (dependency for later Requirements/Curriculum design).

---

## V. RÀ SOÁT ĐỊNH NGHĨA 6 VAI TRÒ CHUẨN TẮC (ROLE BASELINE)

Bảo toàn đúng **6 vai trò chuẩn tắc (Canonical Roles)**, không tự ý mở thêm vai trò:
1. `ADMINISTRATOR`: Quản trị hệ thống, tài khoản, cấu hình toàn cục, giám sát `AuditLog`.
2. `ORGANIZATIONAL_MANAGER`: Hoạch định đề cương lộ trình (Curriculum planning), phân công bài học cho Creator, kích hoạt xuất bản Course.
3. `LESSON_CREATOR`: Biên soạn bài học, từ vựng, bài tập theo phân công; cấm bypass phân công; cấm tự duyệt/xuất bản bài của mình.
4. `MODERATOR`: Kiểm duyệt chuyên môn sư phạm độc lập (`APPROVED`), yêu cầu sửa đổi (`CHANGES_REQUESTED`).
5. `OPERATIONS_STAFF`: Tiếp nhận hỗ trợ người học (Support Tickets), tiếp nhận báo cáo lỗi bài tập (Content Errata Flags).
6. `LEARNER`: Học tập tương tác, thử lại có kiểm soát, ôn tập SRS, duy trì streak theo local timezone, làm bài Placement/Jump.

**CÁC VAI TRÒ TUYỆT ĐỐI KHÔNG ĐƯA VÀO HỆ THỐNG:**
- KHÔNG thêm `Teacher` như một vai trò người dùng tách biệt.
- KHÔNG thêm `System` hay `Auditor` như một vai trò người dùng.
- KHÔNG thêm `Exam Manager` hay `Question Bank Manager`.

---

## VI. DANH MỤC TÍNH NĂNG TƯƠNG LAI / TẠM HOÃN (`FUTURE / OPTIONAL / DEFERRED`)

Các tính năng dưới đây nằm ngoài phạm vi hiện tại của MVP (`OUT OF MVP CURRENT SCOPE`), nhưng không phải sự loại bỏ vĩnh viễn (`NOT PERMANENT REJECTION`) khỏi tầm nhìn phát triển dài hạn của Lingora:

| Tên Tính Năng / Thực Thể | Phân Loại | Lý do Tạm Hoãn & Định Hướng Tương Lai |
|---|---|---|
| **`Exam` & `QuestionBank` Entities** | `FUTURE / OPTIONAL` | MVP dùng thống nhất mô hình `Exercise` (`isAssessmentMode = true`). Thực thể Ngân hàng câu hỏi tập trung sẽ được thiết kế khi quy mô học liệu đạt hàng chục nghìn câu. |
| **`Import DOCX` & File Parser** | `DEFERRED` | Tính năng nhập liệu tự động từ tài liệu văn bản Word/PDF sẽ phát triển khi có đội ngũ số hóa nội dung chuyên trách. |
| **Formula Parsing (LaTeX Math)** | `DEFERRED` | Lingora là nền tảng học ngoại ngữ; công thức toán học/khoa học không thuộc miền kiến thức cốt lõi. |
| **Advanced Exam Security / Proctoring** | `DEFERRED` | Hệ thống tập trung vào trải nghiệm tự học và rèn luyện cá nhân, không phục vụ thi chứng chỉ khảo thí có giám sát nghiêm ngặt. |
| **Streak Freeze & Streak Recovery Quest** | `DEFERRED` | Giữ cơ chế Streak của MVP v1 đơn giản, thuần túy để học viên hình thành thói quen kỷ luật tự giác. |
| **Deep Knowledge Tracing (DKT / ML SRS)** | `DEFERRED` | Thay thế bằng SRS xác định 4 tầng (Policy B) minh bạch, ổn định, không phụ thuộc hạ tầng tính toán phức tạp. |

---

## VII. KẾT LUẬN & TRẠNG THÁI CUỐI CÙNG

$$\mathbf{\Large \text{TRẠNG THÁI: } \text{PHASE 0 — PRODUCT FROZEN}}$$
$$\text{(Ghi chú bắt buộc: } \mathbf{\text{OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT}}\text{)}$$

1. **Ý nghĩa của Trạng thái:**
   - Đóng băng chính sách sản phẩm (`Product Policy Freeze`) đã hoàn tất: Toàn bộ 9 quyết định chính sách sản phẩm cốt lõi (D1 – D9) đã được phê chuẩn dứt khoát thành `USER DECISION`.
   - **ĐIỀU NÀY KHÔNG CÓ NGHĨA LÀ YÊU CẦU KỸ THUẬT ĐÃ ĐÓNG BĂNG (This does NOT mean Requirements are frozen).**
2. **Lộ trình Các Bước Kế Tiếp:**
   $$\text{Product-Frozen} \longrightarrow \text{Curriculum Design} \longrightarrow \text{Requirements Freeze} \longrightarrow \text{Final Use Cases} \longrightarrow \text{ERD} \longrightarrow \text{DFD / UML} \longrightarrow \text{Report} \longrightarrow \text{Slides}$$
3. **Ranh giới Bất di bất dịch:**
   - **TUYỆT ĐỐI KHÔNG CODE, KHÔNG SỬA PRISMA SCHEMA, KHÔNG TẠO MIGRATION, KHÔNG TRIỂN KHAI BẤT KỲ TÍNH NĂNG NÀO.**
