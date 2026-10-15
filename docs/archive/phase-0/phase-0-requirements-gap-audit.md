# LINGORA — PHÂN TÍCH KHOẢNG TRỐNG YÊU CẦU & ĐỐI CHIẾU TÀI LIỆU
## (Phase 0 Requirements Gap Audit & Baseline Synchronization)

> [!WARNING]
> **THÔNG BÁO VỀ NGUYÊN TẮC HỌC THUẬT & PHÂN ĐỊNH DỮ LIỆU:**  
> Tài liệu này thực hiện đối chiếu, kiểm toán và nhận diện khoảng trống giữa các tài liệu đặc tả yêu cầu, phân tích hệ thống, từ điển dữ liệu và các quyết định sản phẩm đã đóng băng (`D1`–`D9`).
> Mọi dẫn xuất từ nghiên cứu mô phỏng 5 nhóm tác nhân nội bộ đều mang tính chất `[SYNTHETIC / SIMULATED / FOR REQUIREMENT-DISCOVERY ONLY]`. Khảo sát thực nghiệm duy nhất được công nhận là khảo sát người học $N=15$ (`[REAL / EXPLORATORY / SMALL-SAMPLE]`).
> **TUYỆT ĐỐI KHÔNG CODE, KHÔNG SỬA SCHEMA PRISMA, KHÔNG TẠO MIGRATION, KHÔNG TRIỂN KHAI M2.**

---

## 1. Mục đích & Phạm vi Kiểm toán (Audit Objectives & Scope)

### 1.1 Bối cảnh
Trước khi kết thúc Phase 0 và chuyển sang giai đoạn xây dựng các biểu đồ phân tích/thiết kế chính thức (UML, Use Case chi tiết, Sequence, Activity, DFD, BFD, Class, ERD) phục vụ Báo cáo Đồ án và Slide bảo vệ, hệ thống tài liệu Lingora cần một **đợt tổng kiểm toán khoảng trống (Gap Audit)**.

Mục tiêu cốt lõi:
1. Phát hiện và xử lý các điểm vênh (contradictions), xung đột thông số giữa các tài liệu cũ (đặc biệt là tàn dư từ báo cáo sinh viên cũ hoặc bản dịch lịch sử 3 chuyên ngành) và các quyết định đã đóng băng của Product Owner.
2. Kiểm tra sự bao phủ của 6 nhóm vai trò canonical (`Administrator`, `Organizational Manager`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`).
3. Đối chiếu dòng công việc nội dung (Content Workflow: `D1=1A`, `D2=2B`, `D3=3B`) và dòng công việc học tập (Learning Workflow: `D4=4A`, `D5=95%+24h`, `D6=~30q`, `D7=10%+70%`, `D8=Policy B`, `D9=Deferred`).
4. Đảm bảo toàn bộ 11 điểm phản biện của Giảng viên hướng dẫn được truy vết triệt để.
5. Đưa toàn bộ tài liệu về trạng thái đồng nhất: **`READY FOR REQUIREMENTS REVIEW`**.

### 1.2 Danh mục Tài liệu Thuộc Phạm vi Kiểm toán
1. `docs/02-requirements.md` (Yêu cầu hệ thống và phạm vi báo cáo đồ án)
2. `docs/05-traceability-matrix.md` (Ma trận truy vết yêu cầu - chức năng - use case)
3. `docs/06-system-analysis.md` (Phân tích hệ thống và đặc tả Use Case)
4. `docs/07-data-dictionary.md` (Từ điển dữ liệu và mô hình thực thể)
5. `docs/phase-0-final-product-owner-decision-sheet.md` (Bảng quyết định chính sách sản phẩm của PO)
6. `docs/phase-0-final-master-consolidation.md` (Bản hợp nhất Phase 0)
7. `docs/phase-0-role-content-workflow-review.md` (Rà soát vai trò và dòng công việc nội dung)
8. `docs/phase-0-synthetic-stakeholder-research.md` (Nghiên cứu mô phỏng 20 persona)

---

## 2. Ma trận Tổng hợp Khoảng trống Yêu cầu (Comprehensive Requirements Gap Matrix)

Bảng dưới đây phân loại chi tiết trạng thái từng khu vực yêu cầu theo 5 cột tiêu chuẩn:
- **Hiện trạng (Existing):** Những gì đã có trong tài liệu và mã nguồn/schema.
- **Khoảng trống / Thiếu sót (Missing):** Những gì chưa được đặc tả hoặc chưa có mô hình.
- **Điểm Xung đột (Conflict):** Những mâu thuẫn giữa tài liệu cũ và quyết định mới của PO.
- **Cần Làm rõ (Needs Clarification):** Những điểm còn mở, cần phụ thuộc đề cương.
- **Tạm hoãn (Deferred):** Những phạm vi đã có quyết định hoãn chính thức cho tương lai.

| STT | Khu vực Yêu cầu (Requirement Area) | Hiện trạng trong Repo (Existing) | Khoảng trống / Thiếu sót (Missing) | Điểm Xung đột (Conflict) | Cần Làm rõ (Needs Clarification) | Tạm hoãn (Deferred) | Đánh giá & Hành động Khuyến nghị |
|:---:|---|---|---|---|---|---|---|
| **1** | **Mô hình 6 Vai trò (Role Model & Permissions)** | `schema.prisma` có `enum Role { LEARNER, ADMIN }`. `Profile` lưu role. Đã định nghĩa 6 vai trò trong `phase-0-roles-and-mvp-final.md`. | Thiếu UI quản trị phân quyền đa vai trò trong `lingora-admin` (chờ M3). Thiếu bảng lưu quyền chi tiết. | Báo cáo sinh viên cũ (`06-system-analysis.md`) chỉ mô tả 2 tác nhân (`Learner`, `Admin`) ở sơ đồ Use case tổng thể. | Quy tắc phân quyền chi tiết cho `Operations Staff` khi xem thông tin người dùng (nguyên tắc dữ liệu tối thiểu). | Mở rộng phân quyền doanh nghiệp nhiều chi nhánh (Multi-tenant B2B). | **ĐÃ GIẢI QUYẾT TRÊN THIẾT KẾ:** Giữ 6 vai trò canonical. Cập nhật `docs/06` đặc tả trọn vẹn 6 Actor Catalog. Giữ schema DB hiện tại (2 roles runtime), mở rộng 6 roles ở tầng ứng dụng/M3. |
| **2** | **Kế hoạch Nội dung & Phân công (Planning & Assignment)** | Bảng `Course`, `Unit`, `Lesson` có quan hệ thứ bậc. `Lesson.assignedToId` lưu người được giao. | Thiếu thực thể `AssignmentBrief` (mục tiêu bài, từ vựng bắt buộc, deadline). Thiếu màn hình giao việc cho Manager. | Tài liệu cũ coi Creator là người tự chủ tạo bài học từ đầu đến cuối mà không cần khung từ Manager. | Định dạng của bản tóm tắt giao việc (`AssignmentBrief`) là bảng riêng hay trường JSON trong `Lesson`. | Hệ thống tự động giao việc theo thuật toán cân bằng tải (Auto-assignment). | **ĐÃ KHÓA (D1 = 1A):** Manager lập kế hoạch khung đề cương, giao bài cho Creator. `AssignmentBrief` được xử lý như một thuộc tính logic/JSON trong M3, không tạo bảng mới trong Phase 0. |
| **3** | **Biên soạn Học liệu (Lesson Authoring)** | `Lesson`, `Exercise`, `Vocabulary`, `LessonVocabulary`. Lưu trữ media trên Supabase Storage `lingora-media`. | UI Authoring WYSIWYG trên Next.js Admin chưa xây dựng (chờ M3). | Tài liệu cũ (`02-requirements.md` migrated source) đề cập dạng bài `MATCHING`, `WRITING` tự do. | Ràng buộc số lượng bài tập tối thiểu/tối đa trong 1 bài học (đề xuất: 3–7 bài tập). | Dạng bài tập chấm điểm phát âm qua AI (Pronunciation scoring). | **ĐÃ KHÓA (ADR-006 & D4):** 3 dạng bài tập cốt lõi (`MCQ`, `FILL_BLANK`, `REORDER`) + 2 dạng mở rộng (`GRAMMAR`, `LISTENING`). Bài học dài 5–10 phút. |
| **4** | **Kiểm duyệt & Phê duyệt (Review & Approval)** | Vòng đời 6 trạng thái trong `docs/04`: `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`. Trường `Lesson.approvedBy`. | Thiếu màn hình so sánh bản sửa đổi (`Diff viewer`) cho Moderator. Thiếu bảng ghi nhận nhận xét kiểm duyệt. | `05-traceability-matrix.md` ghi `UC-10` do Moderator và Admin phụ trách; mâu thuẫn với PO D2=2B. | Quy trình xử lý khi Moderator và Manager bất đồng quan điểm học thuật. | Hệ thống chấm tự động phát hiện vi phạm bản quyền bằng AI. | **ĐÃ KHÓA (D2 = 2B):** Moderator kiểm duyệt và cấp trạng thái `APPROVED`. Moderator tuyệt đối không tự duyệt bài do mình soạn. Quyền xuất bản thuộc về Manager. Sửa lại `docs/05` và `docs/06`. |
| **5** | **Xuất bản & Sửa đổi Đã Xuất bản (Publishing & Revision)** | Cờ `isPublished` trong `Course`, `Lesson`. | Quy trình nhân bản bản thảo (`Clone-to-draft v2`) chưa có API/UI hỗ trợ. | Tài liệu cũ giả định sửa trực tiếp trên bản ghi đang xuất bản (in-place edit), gây lỗi runtime cho học viên đang học. | Ràng buộc toàn vẹn dữ liệu: Khi v2 được xuất bản thì v1 tự động lưu trữ (`ARCHIVED`) như thế nào. | Phiên bản hóa đồng thời cho phép học viên tự chọn học v1 hoặc v2. | **ĐÃ KHÓA (D3 = 3B):** Áp dụng mô hình Revision (Clone-to-Draft). Sửa đổi nội dung đã xuất bản phải qua quy trình: Draft v2 $\rightarrow$ Moderator review $\rightarrow$ Manager publish v2. |
| **6** | **Kiểm tra Đầu vào & Xếp lớp (Placement Test)** | `MVP-03` trong danh mục MVP. Đặc tả `UC-03` trong `docs/06`. | Ngân hàng câu hỏi ~30 câu chưa được biên soạn chi tiết. | `02-requirements.md` (P1-FR-016) và `06-system-analysis.md` (UC-09 cũ) ghi "quy đổi sang trình độ CEFR A1..B2", trái với D6. | Bảng ánh xạ điểm số sang Starting Unit (`OD-PLACEMENT-MAPPING`). | Thuật toán Computerized Adaptive Testing (CAT) đa tầng phức tạp. | **ĐÃ KHÓA (D6):** Đề thi cố định ~30 câu, có Skip (gán Unit 1), có Retake từ Profile, đầu ra là Starting Unit (không claim chuẩn CEFR quốc tế). `OD-PLACEMENT-MAPPING` là `OPEN / CURRICULUM-DEPENDENT`. |
| **7** | **Lộ trình Tuyến tính & Nhảy bài (Curriculum Progression & Jump)** | Khóa học phân cấp `Course` $\rightarrow$ `Unit` $\rightarrow$ `Lesson`. Quan hệ thứ tự qua `orderIndex`. | Giao diện hiển thị cây bài học và trạng thái khóa/mở/preview. | Một số thảo luận trước đây đề xuất cấm hoàn toàn Jump bài, hoặc cho phép jump tự do không cần test. | Quy định số lượng Unit tối đa trong khóa học English A1 (chờ thiết kế đề cương). | Nhảy tắt toàn bộ khóa học mà không cần học bài nào. | **ĐÃ KHÓA (D5):** Lộ trình tuyến tính, cho phép preview bài chưa mở. Cho phép Jump nếu đạt bài kiểm tra đánh giá với ngưỡng $\ge 95\%$ và thời gian chờ làm lại (cooldown) là 24 giờ. |
| **8** | **Hoàn thành Bài học & Làm lại Có kiểm soát (Completion & Controlled Retry)** | `UserProgress` lưu trạng thái học và điểm số (`score`). | UI Exercise Player hỗ trợ hàng đợi làm lại câu sai (Retry Queue). | `06-system-analysis.md` (UC-03 cũ) ghi điều kiện hoàn thành bài là `score >= 80%`, mâu thuẫn trực tiếp với PO D7. | Công thức hiển thị điểm tổng kết trên giao diện người dùng sau khi đã áp dụng 70% retry credit. | Cơ chế trừ tim/mất mạng kiểu Duolingo (Hearts system). | **ĐÃ KHÓA (D7):** Tách biệt Hoàn thành và Điểm số. Không áp dụng điểm sàn 80%. Hoàn thành chỉ khi giải quyết hết câu hỏi và câu làm lại bắt buộc. Dung sai câu sai 10%, điểm câu làm lại hưởng 70% credit. Sửa `docs/06`. |
| **9** | **Lặp lại Ngắt quãng (Spaced Repetition System - SRS)** | Bảng `UserVocabSrs`, `ReviewLog`. Hàm RPC PostgreSQL `record_review` đã test PASS (34/34 tests). | UI màn hình ôn tập thẻ từ vựng (`/srs`) trên Web Client (chờ M2). | Phần tài liệu cũ (`02-requirements.md` lines 51–100) mô tả DKT-LSTM và HLR như model ML bắt buộc cho SRS; mâu thuẫn với ADR-010/014. | Tên gọi chuẩn xác của thuật toán: Giữ tên "Deterministic SRS Policy B" thay vì SM-2 cứng cho đến khi hoàn thành audit công thức. | Tích hợp Deep Knowledge Tracing (DKT-LSTM) trực tiếp vào runtime. | **ĐÃ KHÓA (D8 & ADR-014):** Áp dụng Policy B (4 tầng logic, xác định, chu kỳ cơ sở `[1, 3, 7, 14, 30]` ngày, độc lập 100% với AI service). DKT/HLR là tài liệu tham khảo lịch sử (`SUPERSEDED`). |
| **10**| **Chuỗi Ngày Học & Khôi phục Chuỗi (Streak & Retention)** | `Profile.streakCount`, `lastQualifyingActivityDate`. Logic tính theo múi giờ `Asia/Ho_Chi_Minh`. | UI chúc mừng đạt streak và cảnh báo nguy cơ đứt streak trên Web Client. | Một số tài liệu đề cập đến cơ chế mua vật phẩm đóng băng chuỗi (Streak Freeze/Recovery). | Quy tắc xác định hành vi hợp lệ tối thiểu để duy trì streak (hoàn thành 1 lesson hoặc 1 phiên SRS). | Cơ chế Mua bùa hộ mệnh / Khôi phục streak bằng tiền ảo hoặc điểm thưởng. | **ĐÃ KHÓA (D9):** Không triển khai Streak Recovery/Freeze trong MVP. Bỏ lỡ ngày học sẽ đặt lại streak về 0. Tập trung vào động lực học tập nội tại. |
| **11**| **Luyện viết Tình huống & Sửa lỗi Ngữ pháp (Scenario Writing & GEC)** | `ChatScenario`, `ChatScenarioTranslation`. Route Handler Next.js `/api/ai/gec` gọi FastAPI `/v1/gec/correct`. | UI diff highlight hiển thị câu sửa trực quan và giải thích ngữ pháp (chờ M2). | Tài liệu lịch sử (`02-requirements.md` lines 105–185) mô tả hệ thống hội thoại đa lượt MultiWOZ phức tạp. | Giới hạn độ dài câu nhập vào của học viên (quy định: tối đa 200 ký tự cho trình độ A1). | Chatbot đàm thoại tự do không giới hạn chủ đề (Open-domain LLM chat). | **ĐÃ KHÓA (ADR-010 & ADR-014):** GEC là năng lực hỗ trợ (Supporting Capability). Mô hình T5-small fine-tuned xử lý câu đơn lẻ, stateless, bảo vệ quyền riêng tư qua proxy BFF. MultiWOZ là `SUPERSEDED`. |
| **12**| **Hỗ trợ Vận hành & Tiếp nhận Lỗi (Operations & Support Tickets)** | Chưa có bảng `SupportTicket` trong DB. Bảng `AuditLog` đã được thiết kế logic. | Thực thể `SupportTicket` chưa có trong Prisma schema. Quy trình tiếp nhận và xử lý sự cố. | Báo cáo cũ không đề cập đến vai trò `Operations Staff`, dồn toàn bộ việc hỗ trợ người dùng cho `Admin`. | Tiêu chí phân loại ticket: Sự cố kỹ thuật (giao Admin) vs Báo lỗi học liệu (giao Moderator). | Hệ thống Live Chat hỗ trợ trực tuyến thời gian thực với nhân viên hỗ trợ. | **LOGICAL GAP — FUTURE/REVIEW:** Nhu cầu từ mô phỏng `OPS-SIM-01..04` đã xác định rõ yêu cầu nghiệp vụ. Đánh dấu thực thể `SupportTicket` là khoảng trống logic, không thêm vào schema Phase 0. |
| **13**| **Quản lý Lớp học Doanh nghiệp (Cohorts & Group Progress)** | Chưa có bảng `Cohort` trong DB. | Chưa có mô hình quản lý lớp học, phân quyền nhóm học viên và báo cáo tổng hợp. | Tài liệu cũ coi Lingora thuần túy là ứng dụng B2C tự do, không hỗ trợ bối cảnh đào tạo tổ chức. | Quy chế bảo mật dữ liệu: Quản lý tổ chức chỉ xem báo cáo tỷ lệ hoàn thành ẩn danh, không xem chi tiết cá nhân. | Tích hợp sâu với hệ sinh thái quản lý nhân sự doanh nghiệp (HRM / SSO SAML). | **FUTURE / OPTIONAL (MVP-17):** Đánh dấu là phân hệ mở rộng tùy chọn cho giai đoạn B2B. Không triển khai trong phạm vi MVP cốt lõi. |
| **14**| **Thành tích & Huy hiệu (Private Achievements & Badges)** | Mô tả cũ tại `P1-FR-017` trong `02-requirements.md` và `UC-10` cũ trong `06-system-analysis.md`. | Chưa có thực thể `Badge`, `UserBadge` trong schema. | `UC-10` cũ trong `06` là "Private Achievements & Badges", chiếm chỗ của `UC-10 Canonical: Publish Approved Content`. | Có nên duy trì bảng huy hiệu riêng hay chỉ ghi nhận thành tích qua số liệu Profile (streak, bài hoàn thành). | Bảng xếp hạng xã hội công khai (Public Social Leaderboard) — đã loại bỏ vì gây áp lực tiêu cực. | **ĐÃ GIẢI QUYẾT:** Thay thế toàn bộ đặc tả `UC-10 cũ (Badges)` trong `06-system-analysis.md` bằng `UC-10 Canonical: Publish Approved Content`. Đánh dấu Badge là tính năng thứ yếu (Nice/P2), không nằm trong 15 UC chính. |

---

## 3. Phân tích Chi tiết Các Điểm Xung đột Cốt lõi & Phương án Đồng bộ Hóa

### 3.1 Xung đột 1: Điều kiện Hoàn thành Bài học (Completion Criteria)
- **Tài liệu cũ (`docs/06-system-analysis.md` dòng 189):**  
  *"Server Action tính toán tỷ lệ đúng (score: 0–100%), ghi nhận hoàn thành vào UserProgress (trạng thái COMPLETED nếu score >= 80%)."*
- **Quyết định PO đã Đóng băng (`D7`):**  
  Tách rời hoàn toàn giữa Điểm số và Sự hoàn thành. **Không có ngưỡng điểm sàn 80% hay 85%**. Học viên chỉ hoàn thành bài học khi đã giải quyết toàn bộ bài tập ban đầu và hoàn tất mọi câu hỏi trong hàng đợi làm lại bắt buộc (sau khi trừ 10% allowance và hưởng 70% retry credit).
- **Hành động Đồng bộ:**  
  Cập nhật lại mục đặc tả Use Case `UC-05` trong `docs/06-system-analysis.md`, xóa bỏ hoàn toàn quy tắc `score >= 80%`, đồng bộ tuyệt đối với công thức chính thức của `D7`.

### 3.2 Xung đột 2: Đánh giá Trình độ Đầu vào (Placement Test Outcome)
- **Tài liệu cũ (`docs/02-requirements.md` dòng 260, `docs/06` dòng 303):**  
  *"Quy đổi sang trình độ CEFR tương ứng (A1, A2, B1, B2)... maps the result to a supported CEFR/course level."*
- **Quyết định PO đã Đóng băng (`D6`):**  
  Lingora là ứng dụng học ngoại ngữ cơ sở, không phải tổ chức khảo thí quốc tế. Bài kiểm tra đầu vào (~30 câu) không claim chứng chỉ CEFR mà chỉ nhằm mục đích **xác định Đơn vị bài học xuất phát (Starting Unit)** trong lộ trình. Hơn nữa, bảng ánh xạ điểm số sang Starting Unit được xác định rõ là **`OPEN / CURRICULUM-DEPENDENT`**.
- **Hành động Đồng bộ:**  
  Sửa đổi đặc tả `UC-03` trong `docs/06-system-analysis.md`, bỏ khẳng định quy đổi CEFR chuẩn hóa; ghi rõ kết quả đầu ra là Đề xuất Starting Unit và trạng thái ánh xạ tiếp tục duy trì `OPEN`.

### 3.3 Xung đột 3: Phân định Trách nhiệm Xuất bản (Publishing Authority)
- **Tài liệu cũ (`docs/05-traceability-matrix.md` dòng 47):**  
  *"UC-10 Publish Approved Content | Tác nhân chính: Moderator, Administrator."*
- **Quyết định PO đã Đóng băng (`D2 = 2B`):**  
  Nguyên tắc phân định trách nhiệm kép (Separation of Duties): Moderator chỉ có quyền thẩm định chuyên môn và cấp trạng thái `APPROVED`. Quyền quyết định đưa bài học/khóa học lên môi trường công khai (`PUBLISHED`) thuộc về **Organizational Manager** (đại diện cho chiến lược đào tạo của tổ chức). Administrator chỉ can thiệp gỡ bài khẩn cấp hoặc xuất bản cưỡng chế khi có sự cố vận hành.
- **Hành động Đồng bộ:**  
  Điều chỉnh tác nhân chính của `UC-10` thành `Organizational Manager` (với sự hỗ trợ giám sát của Administrator), bảo đảm Moderator không thể vừa duyệt vừa xuất bản.

### 3.4 Xung đột 4: Danh mục Use Case Cũ vs 15 Use Case Canonical
- **Tài liệu cũ (`docs/06-system-analysis.md` phần 4.2):**  
  Chỉ liệt kê đặc tả chi tiết cho 10 Use Case theo báo cáo sinh viên cũ, trong đó `UC-10` là "Hệ thống Thành tích & Huy hiệu Cá nhân (Private Achievements & Badges)", làm mất hoàn toàn đặc tả của các phân hệ quản trị, vận hành, kiểm duyệt (`UC-08` đến `UC-15`).
- **Quy chuẩn Phase 0 Canonical:**  
  Đã thống nhất danh mục **15 Canonical Use Cases (`UC-01` đến `UC-15`)** bao phủ trọn vẹn 6 nhóm vai trò và 19 chức năng MVP.
- **Hành động Đồng bộ:**  
  Viết lại toàn bộ Mục 4.2 của `docs/06-system-analysis.md` để đặc tả đầy đủ 15 Use Cases chuẩn mực, loại bỏ nội dung không thuộc danh mục canonical.

### 3.5 Xung đột 5: Tàn dư 3 Chuyên ngành Lịch sử trong Requirements
- **Tài liệu cũ (`docs/02-requirements.md` dòng 11–190):**  
  Chứa toàn bộ nội dung đề bài cũ phân chia 3 khoa viện (DKT-LSTM, Half-Life Regression, MultiWOZ Dialogue Roleplay).
- **Quy chuẩn Hiện hành (`ADR-010` & `ADR-014`):**  
  Toàn bộ nội dung này đã được gắn nhãn `[SUPERSEDED / HISTORICAL REFERENCE]`. Kiến trúc cốt lõi của Lingora là Kỹ nghệ phần mềm; AI (T5-small GEC) đóng vai trò năng lực hỗ trợ. Thuật toán SRS là mô hình xác định (Deterministic SRS Policy B), độc lập 100% với AI.
- **Đánh giá Kiểm toán:**  
  Các đoạn văn bản này được lưu giữ hợp lệ dưới dạng bối cảnh lịch sử có chú thích rõ ràng, không gây cản trở kỹ thuật vì các bảng yêu cầu chính thức (`P1-FR-*`, `ML-GEC-*`) đã được định nghĩa độc lập ở phần dưới.

---

## 4. Kiểm toán Sự Phù hợp với Khảo sát Thực tế và Khảo sát Mô phỏng

| Đối tượng Khảo sát | Cỡ mẫu & Hình thức | Mục đích Khoa học | Ranh giới Quy định | Tình trạng Kiểm toán |
|---|---|---|---|---|
| **Learner (Người học thực tế)** | $N=15$ phiếu khảo sát Excel/Forms + 6 phỏng vấn sâu P1–P6 | Xác thực bài toán người học: 100% hay quên từ vựng, 66.7% sợ sai ngữ pháp, mong muốn bài học ngắn 5–10 phút | Được công nhận là bằng chứng thực tế duy nhất (`[REAL / EXPLORATORY]`). | **HỢP LỆ:** Trích dẫn chuẩn xác trong tài liệu yêu cầu. |
| **Organizational Manager** | 4 Persona mô phỏng (`MGR-SIM-01..04`) | Khám phá yêu cầu: Lập đề cương cứng, phân công biên soạn (`Assignment`), giám sát tiến độ | Phải ghi nhãn `SYNTHETIC / SIMULATED`. Tuyệt đối không dùng cụm từ "Khảo sát thực tế các nhà quản lý". | **HỢP LỆ:** Đã tách riêng trong `docs/phase-0-synthetic-stakeholder-research.md`. |
| **Lesson Creator** | 4 Persona mô phỏng (`CRE-SIM-01..04`) | Khám phá yêu cầu: Cần bản tóm tắt giao việc (`AssignmentBrief`), công cụ soạn thảo trực quan, tiếp nhận phản hồi kiểm duyệt | Phải ghi nhãn `SYNTHETIC / SIMULATED`. Không ngụy tạo số liệu phần trăm nhu cầu. | **HỢP LỆ:** Khám phá thành công nhu cầu `BR-CREATOR-BRIEF-01`. |
| **Moderator** | 4 Persona mô phỏng (`MOD-SIM-01..04`) | Khám phá yêu cầu: Công cụ so sánh bản sửa đổi (`Diff Viewer`), chống xung đột lợi ích (không tự duyệt bài của mình) | Phải ghi nhãn `SYNTHETIC / SIMULATED`. | **HỢP LỆ:** Củng cố sự cần thiết của chính sách D2=2B và D3=3B. |
| **Operations Staff** | 4 Persona mô phỏng (`OPS-SIM-01..04`) | Khám phá yêu cầu: Phân hệ tiếp nhận sự cố (`SupportTicket`), chuyển tiếp lỗi học liệu sang Moderator, chuyển tiếp sự cố tài khoản sang Admin | Phải ghi nhãn `SYNTHETIC / SIMULATED`. | **HỢP LỆ:** Nhận diện khoảng trống logic `SupportTicket` cho tương lai. |
| **Administrator** | 4 Persona mô phỏng (`ADM-SIM-01..04`) | Khám phá yêu cầu: Bảng ghi nhật ký kiểm toán bất biến (`AuditLog`), quản trị tài khoản tối thiểu quyền hạn | Phải ghi nhãn `SYNTHETIC / SIMULATED`. | **HỢP LỆ:** Định hình các yêu cầu phi chức năng bảo mật `NFR-AUD-03`. |

---

## 5. Kết luận Kiểm toán & Trạng thái Hệ thống

$$\mathbf{\Large \text{KẾT QUẢ KIỂM TOÁN: } \text{READY FOR REQUIREMENTS REVIEW}}$$

1. **Tính Đồng bộ:** Mọi điểm vênh và xung đột giữa tài liệu phân tích cũ và 9 chính sách sản phẩm đóng băng (`D1`–`D9`) đã được xác định cụ thể cùng phương án xử lý dứt điểm.
2. **Tính Liêm chính:** Phân định tuyệt đối giữa dữ liệu thực nghiệm người học ($N=15$) và dữ liệu mô phỏng 5 nhóm tác nhân nội bộ (20 Persona).
3. **Trạng thái Kỹ thuật:**  
   - Bảng ánh xạ `OD-PLACEMENT-MAPPING` tiếp tục duy trì trạng thái **`OPEN / CURRICULUM-DEPENDENT`**.
   - Các thực thể chưa có trong cơ sở dữ liệu (`SupportTicket`, `Cohort`) được xác nhận là **`LOGICAL GAP — FUTURE/REVIEW`**, không gây áp lực sửa đổi schema trái phép.
4. **Cam kết Ranh giới:**  
   **TUYỆT ĐỐI KHÔNG CODE, KHÔNG SỬA SCHEMA PRISMA, KHÔNG TẠO MIGRATION, KHÔNG TRIỂN KHAI M2.**
