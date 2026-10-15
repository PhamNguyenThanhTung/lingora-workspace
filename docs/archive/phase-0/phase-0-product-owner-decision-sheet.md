# LINGORA — PRODUCT OWNER DECISION SHEET
**Giai đoạn:** Phase 0 Pre-Freeze Reconciliation  
**Mục tiêu:** Tổng hợp, đối chiếu và chuẩn hóa toàn bộ các quyết định sản phẩm thành một tài liệu duy nhất trước khi đóng băng Phase 0 (Product Freeze).  
**Trạng thái tài liệu:** `READY FOR PRODUCT OWNER DECISION`  
**Nguyên tắc bắt buộc:**  
- KHÔNG code, KHÔNG sửa Prisma schema, KHÔNG tạo migration, KHÔNG sửa requirements canonical, KHÔNG chuyển sang M2.  
- Tuyệt đối không tự đóng băng (freeze) bất kỳ chính sách nào thay Product Owner.  
- Phân loại minh bạch mọi hạng mục: `FACT`, `USER DECISION`, `ADR-LOCKED`, `PROPOSAL`, `OPEN DECISION`, `DEFERRED`.

---

## I. HỆ THỐNG PHÂN LOẠI TRẠNG THÁI (STATUS CLASSIFICATION)

| Ký hiệu | Định nghĩa & Ý nghĩa Kỹ thuật / Sản phẩm |
|---|---|
| `FACT` | Sự thật kỹ thuật bất biến, ràng buộc nền tảng của hệ thống (Next.js 15, Supabase, 6 Roles enum, không ML). |
| `ADR-LOCKED` | Quyết định kiến trúc đã được ghi nhận chính thức trong Decision Log (ADR-008, ADR-014). |
| `USER DECISION` | Quyết định nghiệp vụ đã được Product Owner chính thức xác nhận và chỉ đạo. |
| `PROPOSAL` | Đề xuất giải pháp kỹ thuật/sư phạm của Agent nhằm tối ưu hệ thống, chưa được PO duyệt. |
| `OPEN DECISION` | Tham số hoặc chính sách nghiệp vụ đang để ngỏ, bắt buộc Product Owner phải lựa chọn. |
| `DEFERRED` | Tính năng/ý tưởng đã thống nhất tạm hoãn sau giai đoạn pilot (không đưa vào MVP v1). |

---

## 1. Decisions Already Stable (Các Quyết Định Đã Ổn Định)

Dưới đây là tập hợp các nguyên tắc và quyết định đã được xác lập chắc chắn (`FACT`, `ADR-LOCKED`, `USER DECISION`):

### 1.1 Về Định vị Hệ thống & Hạ tầng (ADR-014, ADR-008)
- **Software Engineering là CORE (`FACT` / `ADR-LOCKED`):** Lingora là nền tảng học ngoại ngữ trực tuyến (Web Responsive, Next.js 15, TypeScript, Supabase SSR Auth/DB/Storage).
- **AI là SUPPORTING CAPABILITY (`FACT` / `ADR-LOCKED`):** Mô-đun GEC (Sửa lỗi ngữ pháp) chạy phi trạng thái qua endpoint FastAPI `/v1/gec/correct`, sử dụng mô hình mã nguồn mở pretrained hoặc external API; không fine-tune, không huấn luyện từ đầu.
- **Không Machine Learning phức tạp (`FACT` / `ADR-LOCKED`):** Loại bỏ hoàn toàn DKT-LSTM, HLR, DQN, và chatbot MultiWOZ.
- **Web Responsive (`FACT` / `ADR-LOCKED`):** Thay thế app Android cũ; dùng In-App Reminder (Option 6d); tạm hoãn Web Push / PWA (Option 6a, 6b).

### 1.2 Về 6 Vai trò Chuẩn tắc (Roles Baseline)
- **Bảo toàn 6 vai trò (`FACT` / `USER DECISION`):** `ADMINISTRATOR`, `ORGANIZATIONAL_MANAGER`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `LEARNER`. Không thêm vai trò mới.
- **Trách nhiệm đã chắc chắn:**
  - `Administrator`: Quản trị tài khoản, phân quyền RBAC, giám sát hệ thống, tra cứu `AuditLog`.
  - `Operations Staff`: Tiếp nhận ticket hỗ trợ, xử lý khiếu nại tài khoản, tiếp nhận báo lỗi câu hỏi từ học viên để chuyển cho kiểm duyệt. Khác Moderator ở chỗ không tham gia thẩm định sư phạm học liệu.
  - `Learner`: Học tập cá nhân, làm bài tập tương tác, thử lại có kiểm soát, ôn tập SRS, luyện viết GEC, theo dõi tiến độ và streak.
- **Nguyên tắc Phân tách Trách nhiệm Cốt lõi (`USER DECISION`):**
  - **Lesson Creator TUYỆT ĐỐI KHÔNG tự phê duyệt bài của chính mình** (Separation of Duties).

### 1.3 Về Lộ trình Học & Nhảy Cóc (Curriculum & Jump)
- **Cấu trúc tuyến tính 4 cấp (`USER DECISION`):** `Course → Unit → Lesson → Exercise`.
- **Xem trước (`USER DECISION`):** Cho phép học viên xem trước (Preview) syllabus, mục tiêu và từ vựng ở chế độ chỉ đọc.
- **Nhảy cóc phân cấp (`USER DECISION`):**
  - Jump 1 Unit: Làm bài kiểm tra của Unit liền trước.
  - Jump 2–3 Unit: Làm bài kiểm tra tích lũy (Cumulative Assessment).
  - Jump >3 Unit: Làm bài kiểm tra định vị toàn diện (Comprehensive Diagnostic Assessment).
  - **Không cấm Jump >3 Unit (`USER DECISION`):** Mốc "3 Unit" chỉ là *guideline phân tầng bài kiểm tra*, không phải rào cấm cứng.

### 1.4 Về Kiểm tra Đầu vào (Placement Test)
- **MVP-03 bắt buộc và làm thật (`USER DECISION`):** Xây dựng bài kiểm tra đầu vào thực tế.
- **Có nút Bỏ qua (Skip) & Làm lại (Retake) (`USER DECISION`):** Skip đưa về Starting Unit mặc định; cho phép Retake từ Profile.
- **Mục tiêu đầu ra (`USER DECISION`):** Xác định Starting Unit phù hợp nhất.
- **Tuyệt đối không claim chứng chỉ CEFR (`USER DECISION`):** Không cấp chứng chỉ hay cam kết tương đương CEFR ra bên ngoài.

### 1.5 Về Thử lại Có Kiểm soát (Controlled Retry)
- **Quy trình 2 vòng tuần tự (`USER DECISION`):** Vòng 1 làm bài $\rightarrow$ câu sai chuyển xuống cuối phiên $\rightarrow$ Vòng 2 thử lại $\rightarrow$ đúng có thể cứu, sai vẫn sai $\rightarrow$ sai quá nhiều không thể cứu toàn bộ.
- **Trạng thái Transient (`FACT`):** Lưu tại bộ nhớ phiên làm việc trên Client/Session, **không tạo bảng `ExerciseAttempt` rác** trong cơ sở dữ liệu.

### 1.6 Về Lặp lại Ngắt quãng Cá nhân hóa (Personalized SRS)
- **Kiến trúc 4 tầng xác định (`USER DECISION`):** Baseline Interval $\rightarrow$ Age/Due Queue $\rightarrow$ Item Performance Adaptation $\rightarrow$ Learner Workload Adaptation.
- **Hàng đợi Age/Due Queue (`USER DECISION`):** Xếp theo thời điểm đến hạn và độ tuổi trí nhớ của thẻ, **không áp đặt lịch cứng theo ngày tạo từ vựng**.
- **Phân hóa tải học tập (`USER DECISION`):** Người học nhanh và người học chậm không bị ép chung một tiến độ hoặc số lượng thẻ ôn tập; có cơ chế bảo vệ chống dồn ứ (backlog protection); điều tiết nạp từ mới; **tuyệt đối không dùng ML**.

### 1.7 Về Chuỗi Ngày học (Streak)
- **Múi giờ địa phương (`USER DECISION`):** Daily Streak tính theo `Profile.timezone` (chuẩn IANA).
- **Quy tắc cơ bản (`USER DECISION`):** Hoàn thành bài học/SRS trong ngày $\rightarrow$ Streak +1 (tối đa 1 lần/ngày); bỏ lỡ 1 ngày $\rightarrow$ lần học tiếp theo **reset về 1**.
- **Không có Freeze trong MVP v1 (`USER DECISION`):** Chưa triển khai tính năng Streak Freeze để tránh lạm dụng.

---

## 2. Decisions Still Open (Các Quyết Định Còn Mở)

Dưới đây là 9 nhóm quyết định chi tiết bắt buộc Product Owner phải lựa chọn trước khi Phase 0 đóng băng:

1. **D1 — Content Workflow:** Lựa chọn quy trình biên soạn nào giữa Manager, Creator và Moderator, đặc biệt lưu ý phản biện của Giảng viên: *"thiết kế nội dung học trước, phân công giảng viên làm nội dung từng phần, không để GV tự đưa lên rồi mới kiểm duyệt"*.
2. **D2 — Separation of Duties & Publishing Authority:** Ai là người kích hoạt xuất bản (`PUBLISHED`) bài học? (Moderator xuất bản trực tiếp hay Manager phê duyệt cuối cùng? Admin can thiệp ở mức nào?).
3. **D3 — Published Content Update Policy:** Khi bài học đã xuất bản cần sửa, áp dụng chính sách nào? (Sửa trực tiếp lỗi nhỏ? Nhân bản draft? Định nghĩa cụ thể ranh giới Minor vs Major).
4. **D4 — Assessment & Question Boundary:** Xác nhận ranh giới giữa Bài tập (`Exercise`) và Bài kiểm tra (`Assessment`). Xác nhận việc phân loại `QuestionBank`, `Import DOCX`, `LaTeX`, `Exam Security` là các tính năng mở rộng trong tương lai (`FUTURE / OPTIONAL / DEFERRED`), không tạo bảng độc lập trong MVP v1.
5. **D5 — Curriculum Jump Rules:** Tiêu chí điểm đỗ của bài kiểm tra Jump (80%? 85%? Phân cấp?) và quy tắc mở khóa tiến độ các Unit trung gian.
6. **D6 — Placement Test Configuration:** Quy mô (15 hay 20 câu), định dạng (cố định hay phân nhánh), bảng ánh xạ Starting Unit chính thức, và vị trí lưu trữ (Profile hay bảng riêng).
7. **D7 — Controlled Retry Parameters:** Công thức tính ngân sách câu cứu, tỷ lệ điểm thưởng khi cứu đúng (credit %), và tiêu chuẩn điểm hoàn thành bài học.
8. **D8 — Personalized SRS Parameters:** Thang khoảng cách cơ sở, phương thức phản hồi thẻ, hạn mức ôn tập ngày (Daily Cap), và ngưỡng dồn ứ (Backlog Throttle).
9. **D9 — Streak Recovery Future Direction:** Lựa chọn phương án phục hồi chuỗi học tập trong tương lai (`DEFERRED` sau pilot).

---

## 3. Recommended Decisions (Đề Xuất Của Agent)

> [!NOTE]
> Toàn bộ nội dung trong mục này chỉ là **Đề xuất Chuyên môn của Agent (`PROPOSAL`)**, không phải quyết định đã khóa (`LOCKED`) hay chuẩn tắc (`CANONICAL`).

### D1 — Content Workflow: Đề xuất Policy A (Manager-Driven) hoặc Policy C có Ràng buộc Giao việc
- **Bối cảnh Phản biện của Giảng viên:** Giảng viên đã lưu ý rất rõ: *"thiết kế nội dung học trước, phân công giảng viên làm nội dung từng phần, không để GV tự đưa lên rồi mới kiểm duyệt"*.
- **Khuyến nghị của Agent (`PROPOSAL`):**  
  Áp dụng **Quy trình Phân công Kế hoạch Hóa (Assignment-Gated Workflow)**:
  1. `ORGANIZATIONAL_MANAGER` bắt buộc phải tạo Khung khóa học (`Course`), Chủ điểm (`Unit`) và danh mục bài học khung (`Lesson Skeleton`) trước.
  2. Manager phân công cụ thể (`assign`) từng bài học cho `LESSON_CREATOR`.
  3. Creator **chỉ được biên soạn nội dung trong phạm vi các bài học đã được phân công**, không được tự ý tạo bài học mới nằm ngoài đề cương đã duyệt.
  4. Sau khi Creator hoàn thành, bài chuyển sang `MODERATOR` kiểm duyệt độc lập.

### D2 — Separation of Duties & Publishing: Đề xuất Moderator Duyệt & Manager Kích hoạt Khóa học
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - `LESSON_CREATOR`: Chỉ biên soạn và gửi duyệt (`IN_REVIEW`). Tuyệt đối không có nút Duyệt hoặc Xuất bản.
  - `MODERATOR`: Thẩm định sư phạm, yêu cầu sửa đổi (`CHANGES_REQUESTED`) hoặc duyệt đạt chuẩn (`APPROVED`). Moderator có quyền xuất bản bài học lẻ (`Lesson.status = 'PUBLISHED'`).
  - `ORGANIZATIONAL_MANAGER`: Kiểm tra toàn bộ tiến độ các bài học trong Unit/Course và kích hoạt xuất bản toàn khóa (`Course.isPublished = true`).
  - `ADMINISTRATOR`: Giám sát qua `AuditLog`, chỉ can thiệp xử lý khi có tranh chấp bản quyền hoặc khiếu nại nhân sự.

### D3 — Published Content Update: Đề xuất Phân Tầng Minor vs Major
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - **Sửa đổi Nhỏ (Minor Edit — Moderator sửa trực tiếp, tự động ghi AuditLog):**
    - Sửa lỗi chính tả (typo) trong câu hỏi hoặc lời giải thích.
    - Cập nhật bản dịch nghĩa (`LessonTranslation`, `UnitTranslation`) cho mượt mà hơn.
    - Thay thế đường dẫn tệp âm thanh (audio URL) bị hỏng hoặc rè.
    - Cập nhật hình ảnh minh họa chất lượng cao hơn.
  - **Sửa đổi Lớn (Major Structural Edit — Bắt buộc tạo bài học phiên bản mới):**
    - Thay đổi đáp án đúng (`answerKey`) của câu hỏi (ảnh hưởng đến tính công bằng điểm số học viên cũ).
    - Thêm bài tập mới hoặc xóa bớt bài tập trong bài học.
    - Thay đổi loại bài tập (ví dụ từ `MCQ` sang `FILL_BLANK`).
    - Thay đổi mục tiêu học tập cốt lõi của bài học.

### D4 — Assessment Boundary: Đề xuất Dùng chung `Exercise`, Hoãn `QuestionBank`
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Trong MVP v1, cả bài học (`Lesson`) và bài kiểm tra (`Placement Test`, `Jump Assessment`) đều sử dụng chung cấu trúc thực thể `Exercise` với cờ phân loại logic `isAssessmentMode = true`.
  - Không tạo các bảng `Exam` hay `QuestionBank` trong cơ sở dữ liệu Phase 0 để tránh phân mảnh dữ liệu và nợ kỹ thuật.
  - **Đính chính ranh giới:** `QuestionBank`, `Import DOCX`, `Formula parsing` (LaTeX), và `Exam Encryption` được phân loại là **Tính năng Mở rộng Tương lai (`FUTURE / OPTIONAL / DEFERRED`)**, không tuyên bố loại bỏ vĩnh viễn khỏi tầm nhìn sản phẩm.

### D5 — Curriculum Jump: Đề xuất Điểm đỗ Phân cấp 80% / 85%
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Jump 1 Unit: Đạt $\ge 80\%$ bài kiểm tra của Unit trước.
  - Jump $\ge 2$ Units: Đạt $\ge 85\%$ bài kiểm tra tích lũy.
  - Quy tắc mở khóa: Đạt điểm thì mở khóa chính xác Unit đích; các Unit trung gian được đánh dấu theo diện nhảy cóc [HISTORICAL PROPOSAL TERM: `COMPLETED_BY_JUMP` — đã được chuẩn hóa thành `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`), không tương đương với hoàn thành học liệu thực tế], đồng thời tự động seed từ vựng cốt lõi của các Unit bỏ qua vào hàng đợi SRS để chống hổng kiến thức.

### D6 — Placement Test: Đề xuất 15 Câu Cố định, Lưu Profile
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Quy mô: 15 câu cố định (8 Từ vựng, 5 Ngữ pháp, 2 Đọc hiểu ngắn), thời gian ~10 phút.
  - Bảng ánh xạ đề xuất cho Khóa English A1 (10 Units kế hoạch):
    - $0 – 39$ điểm $\rightarrow$ Bắt đầu từ **Unit 1**
    - $40 – 69$ điểm $\rightarrow$ Bắt đầu từ **Unit 3**
    - $70 – 100$ điểm $\rightarrow$ Bắt đầu từ **Unit 6**
  - Lưu trữ: Lưu trực tiếp trên `Profile` (`placementScore`, `startingUnitId`, `placementCompletedAt`) để giữ nguyên 100% schema hiện hành.

### D7 — Controlled Retry: Đề xuất Cứu 20%, Hưởng 70% Điểm
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Ngân sách cứu: $\max(1, \min(4, \lfloor N \times 0.20 \rfloor))$ (tối đa 4 câu trong bài $\ge 20$ câu).
  - Tỷ lệ điểm cứu: Hưởng **70% số điểm gốc** ở Vòng 2.
  - Tiêu chuẩn đỗ bài học: Điểm tổng kết phiên đạt **$\ge 80\%$** mới được tính `COMPLETED`.
  - Vượt ngân sách: Học viên tự chọn số câu trong ngân sách để làm lại; các câu sai còn lại tính 0 điểm phiên đó.

### D8 — Personalized SRS: Đề xuất Thang 5 Bước, 3 Nút, Cap 30 Thẻ
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Thang khoảng cách cơ sở: $[1, 3, 7, 14, 30]$ ngày.
  - Nút phản hồi: 3 mức (`Quên` $\rightarrow$ reset 1 ngày; `Nhớ` $\rightarrow \times 1.5$; `Dễ` $\rightarrow \times 2.0$).
  - Hạn mức ôn tập ngày: Mặc định **30 thẻ/ngày** (cho phép học viên tùy biến $20–50$ thẻ).
  - Điều tiết nạp từ mới: Khi thẻ quá hạn tích lũy $> 25$ thẻ, hệ thống cảnh báo và tạm dừng gợi ý bài mới.
  - **Làm rõ Sư phạm (`PROPOSAL`):**
    - *Lesson Completion (Hoàn thành bài học):* Tiêu chí đạt phiên tức thời (ví dụ đỗ $\ge 80\%$).
    - *Learning Mastery (Nắm vững kiến thức):* Ký ức dài hạn bền vững (interval giãn cách dài qua nhiều lần kiểm tra ngắt quãng). Các con số cụ thể (80%, 21-30 ngày, 90%) là tham số cấu hình tùy biến (`TUNABLE PARAMETERS`), không phải chân lý bất biến.

### D9 — Streak Recovery: Đề xuất Tích lũy Chuyên cần 30 Ngày (`DEFERRED`)
- **Khuyến nghị của Agent (`PROPOSAL`):**
  - Giữ nguyên quyết định: MVP v1 không có Freeze hay Recovery.
  - Đề xuất cho giai đoạn tương lai: Học viên duy trì tỷ lệ chuyên cần cao trong 30 ngày (ví dụ $\ge 80\%$ ngày đạt goal) được thưởng 1–2 vé cứu chuỗi. Phân loại: `DEFERRED`.

---

## 4. Alternatives (Các Phương Án Thay Thế Chi Tiết)

| Mã Quyết định | Phương án A | Phương án B | Phương án C |
|---|---|---|---|
| **D1: Content Workflow** | **Manager-driven:** Manager tạo khung và giao từng bài; Creator chỉ làm bài được giao. | **Assignment Pool:** Manager tạo bể việc; Creator nhận bài từ backlog chung. | **Hybrid:** Manager tạo khung Unit; Creator có thể chủ động đề xuất bài nháp mới. |
| **D2: Separation of Duties**| **Moderator Publish:** Moderator duyệt bài và trực tiếp xuất bản bài học. | **Manager Publish:** Moderator chỉ duyệt chuyên môn; Manager mới có quyền xuất bản. | **Admin Gate:** Mọi nội dung xuất bản phải qua phê duyệt cuối của Administrator. |
| **D3: Content Update** | **Direct Minor Edit:** Moderator sửa trực tiếp typo/audio; thay đổi lớn tạo bài mới. | **Strict Clone-to-Draft:** Mọi sửa đổi dù nhỏ nhất đều phải clone bản nháp và duyệt lại. | **In-Place Free Edit:** Cho phép sửa trực tiếp toàn bộ bài học đang xuất bản. |
| **D4: Assessment Boundary**| **Shared Exercise:** Dùng chung Exercise với cờ `isAssessmentMode`, hoãn QuestionBank. | **Separate Assessment:** Tạo bảng riêng cho bài thi ngay trong Phase 0. | **External Exam System:** Tích hợp hệ thống thi ngoài qua API. |
| **D5: Curriculum Jump** | **Phân cấp 80% / 85%:** Jump 1 Unit đỗ $\ge 80\%$; Jump $\ge 2$ Units đỗ $\ge 85\%$. | **Phẳng 80%:** Thống nhất ngưỡng $\ge 80\%$ cho mọi cấp độ Jump. | **Linh hoạt 75%:** Cho phép nhảy ở mức $\ge 75\%$ kèm điều kiện nạp từ vào SRS. |
| **D6: Placement Test** | **15 câu cố định (Profile):** Nhanh gọn ~10 phút, 0 sửa schema, ánh xạ 3 bậc. | **20 câu có trọng số (Bảng riêng):** Phân lớp chi tiết hơn, hỗ trợ lưu vết lịch sử retake. | **12–15 câu Adaptive-lite:** Phân nhánh năng lực 2 chặng. |
| **D7: Controlled Retry** | **Balanced:** Cứu 20% (cap 4), 70% credit, đỗ bài $\ge 80\%$. | **Completion-driven:** Cứu 30%, 100% credit, không áp điểm đỗ bài học. | **Mastery-driven:** Cứu 1–2 câu, 50% credit, đỗ bài $\ge 85\%$, sai nhiều khóa retry. |
| **D8: Personalized SRS** | **Balanced Adaptive:** Thang 5 bước, 3 nút, cap 30 tùy biến, throttle nợ $> 25$. | **Conservative:** Thang 6 bước, 2 nút, cap 20 cố định, khóa nạp khi nợ $> 15$. | **Progressive:** Thang 4 bước, 4 nút easeFactor, cap 40+, chỉ cảnh báo nợ. |
| **D9: Streak Recovery** | **Habit-Consistency (`DEFERRED`):** Tích lũy chuyên cần 30 ngày đổi 1–2 vé cứu. | **Repair Quest (`DEFERRED`):** Học bù gấp đôi trong 3 ngày để nối lại chuỗi. | **Milestone Shield (`DEFERRED`):** Tặng khiên bảo vệ tại các mốc streak lớn (30, 60 ngày). |

---

## 5. Exact Product Owner Questions & Ballot (Phiếu Biểu Quyết)

Kính trình Product Owner đưa ra lựa chọn chính thức cho 9 hạng mục quyết định dưới đây để hoàn tất đóng băng Phase 0:

```
========================================================================================
PHIẾU BIỂU QUYẾT QUYẾT ĐỊNH SẢN PHẨM (PRODUCT OWNER DECISION BALLOT)
========================================================================================

[ ] D1 — CONTENT WORKFLOW (Quy trình Quản trị Học liệu):
    ( ) 1A - Policy A: Manager-driven (Manager phân công bài học, Creator chỉ làm bài được giao) [Khuyến nghị - Khớp feedback GV]
    ( ) 1B - Policy B: Assignment Pool (Manager tạo bể việc, Creator nhận việc từ backlog)
    ( ) 1C - Policy C: Hybrid Workflow (Manager quản lý khung, Creator có thể tự tạo draft trong Unit)
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D2 — SEPARATION OF DUTIES (Phân định Quyền Xuất bản):
    ( ) 2A - Moderator duyệt chuyên môn và kích hoạt xuất bản bài học (PUBLISHED) [Khuyến nghị]
    ( ) 2B - Moderator chỉ duyệt (APPROVED); Org Manager mới có quyền xuất bản (PUBLISHED)
    ( ) 2C - Administrator duyệt và xuất bản toàn bộ
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D3 — PUBLISHED CONTENT UPDATE (Cập nhật Bài học Đã Xuất bản):
    ( ) 3A - Phân tầng Minor/Major: Mod sửa nhanh typo/audio có log; Sửa lớn tạo bài mới [Khuyến nghị]
    ( ) 3B - Strict Clone-to-Draft: Mọi chỉnh sửa đều phải nhân bản bản nháp và duyệt lại từ đầu
    ( ) 3C - Cho phép sửa trực tiếp in-place toàn bộ
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D4 — ASSESSMENT BOUNDARY (Ranh giới Bài tập & Đánh giá):
    ( ) 4A - Xác nhận: Dùng chung Exercise (isAssessmentMode=true); Hoãn QuestionBank/Exam [Khuyến nghị]
    ( ) 4B - Tạo thực thể Assessment/Exam riêng biệt ngay trong Phase 0
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D5 — CURRICULUM JUMP (Quy tắc Nhảy Cóc Bài học):
    ( ) 5A - Phân cấp: Jump 1 Unit đỗ >= 80%; Jump >= 2 Units đỗ >= 85% [Khuyến nghị]
    ( ) 5B - Đồng nhất: Áp dụng ngưỡng đỗ >= 80% cho mọi cấp độ Jump
    ( ) 5C - Linh hoạt: Ngưỡng đỗ >= 75% kèm điều kiện nạp từ vựng vào SRS
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D6 — PLACEMENT TEST (Cấu hình Bài Kiểm tra Đầu vào):
    ( ) 6A - 15 câu cố định (~10 phút), lưu Profile, 0 sửa schema, ánh xạ 3 bậc [Khuyến nghị]
    ( ) 6B - 20 câu có trọng số (~15 phút), tách bảng riêng lưu lịch sử retake
    ( ) 6C - 12–15 câu Adaptive-lite phân nhánh năng lực
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D7 — CONTROLLED RETRY (Tham số Thử lại Có Kiểm soát):
    ( ) 7A - Balanced: Cứu 20% (cap 4 câu), hưởng 70% điểm, đỗ bài >= 80% [Khuyến nghị]
    ( ) 7B - Completion-driven: Cứu 30%, hưởng 100% điểm, không áp điểm đỗ
    ( ) 7C - Mastery-driven: Cứu 1-2 câu, hưởng 50% điểm, đỗ bài >= 85%
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D8 — PERSONALIZED SRS (Tham số Ôn tập Thích ứng 4 Tầng):
    ( ) 8A - Balanced: Thang 5 bước [1,3,7,14,30], 3 nút, cap 30 thẻ, throttle nợ > 25 [Khuyến nghị]
    ( ) 8B - Conservative: Thang 6 bước, 2 nút, cap 20 thẻ, khóa bài mới khi nợ > 15
    ( ) 8C - Progressive: Thang 4 bước, 4 nút easeFactor, cap 40+ thẻ, chỉ cảnh báo nợ
    ( ) Ý kiến khác của PO: ...........................................................

[ ] D9 — STREAK RECOVERY FUTURE (Định hướng Cứu Chuỗi Tương lai):
    ( ) 9A - Habit-Consistency: Chuyên cần 30 ngày đổi 1-2 vé cứu (DEFERRED) [Khuyến nghị]
    ( ) 9B - Streak Repair Quest: Hoàn thành nhiệm vụ học bù 3 ngày (DEFERRED)
    ( ) 9C - Milestone Shield: Khiên bảo vệ tại các mốc streak 30, 60 ngày (DEFERRED)
    ( ) Ý kiến khác của PO: ...........................................................

========================================================================================
TRẠNG THÁI HIỆN TẠI: READY FOR PRODUCT OWNER DECISION
Sau khi PO chốt 9 quyết định: Tiến hành Product Freeze -> Requirements Freeze -> UC Final 
-> ERD/DFD/UML -> Word/Slide. TUYỆT ĐỐI KHÔNG CHUYỂN SANG CODE IMPLEMENTATION.
========================================================================================
```
