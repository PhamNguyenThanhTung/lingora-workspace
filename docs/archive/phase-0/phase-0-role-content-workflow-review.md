# LINGORA — ROLE & CONTENT WORKFLOW REVIEW — PRODUCT FROZEN
**Giai đoạn:** Phase 0 Product Policy Freeze  
**Mục tiêu:** Rà soát và chuẩn hóa toàn diện phân hệ Tác nhân (Roles), Phân quyền (Permissions), Quy trình Quản trị Học liệu (Content Workflow) và Ranh giới Kiểm tra Đánh giá (Assessment Boundary) dựa trên phản biện trực tiếp từ Giảng viên hướng dẫn:  
> *“Cần xác định lại các nhóm đối tượng người dùng, xác định yêu cầu chức năng của từng nhóm.”*  
**Trạng thái tài liệu:** `PHASE 0 — PRODUCT FROZEN (Note: OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT)`  
**Nguyên tắc bắt buộc:**  
- Đóng băng chính sách sản phẩm (`Product Policy Freeze`) đã hoàn tất: Toàn bộ quyết định D1–D9 đã được Product Owner phê chuẩn thành `USER DECISION`.  
- **ĐIỀU NÀY KHÔNG CÓ NGHĨA LÀ YÊU CẦU KỸ THUẬT ĐÃ ĐÓNG BĂNG (This does NOT mean Requirements are frozen).**  
- Giữ `OD-PLACEMENT-MAPPING` ở trạng thái `OPEN / CURRICULUM-DEPENDENT` (không chặn Product Freeze; là điều kiện phụ thuộc cho bước thiết kế đề cương và yêu cầu sau này).  
- Tuyệt đối không code, không sửa Prisma schema, không tạo migration, không chuyển sang M2.

---

## 1. Executive Summary

1. **Ranh giới sản phẩm cốt lõi (Product Boundary):**  
   Lingora là **Nền tảng Học Ngoại ngữ Trực tuyến Tự thích ứng (Adaptive Online Language Learning Platform)**.  
   Hệ thống tập trung giải quyết bài toán tiếp thu ngôn ngữ (Language Acquisition), xây dựng vốn từ vựng ngắt quãng (SRS), luyện tập cấu trúc ngữ pháp và viết câu theo tình huống có AI hỗ trợ sửa lỗi (GEC).  
   Lingora **tuyệt đối KHÔNG biến thành:**
   - Hệ thống thi trắc nghiệm trực tuyến chuyên dụng (Online Examination / Proctoring System như Eduso / Quiz Bank).
   - Hệ thống Quản trị Đào tạo Doanh nghiệp cồng kềnh (Enterprise LMS / SCORM / HR Training).
   - Sàn giao dịch khóa học thương mại (Marketplace / E-commerce Course Platform).
   - Mạng xã hội kết nối bạn bè / Diễn đàn thảo luận tự do (Social Network).

2. **Rà soát 6 Tác nhân chuẩn tắc (Canonical Roles Baseline):**  
   Bảo toàn đúng 6 vai trò đã xác lập tại ADR-014 và Prisma schema: `ADMINISTRATOR`, `ORGANIZATIONAL_MANAGER`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `LEARNER`.  
   Báo cáo xác lập chi tiết ma trận 13 thuộc tính cho từng vai trò, phân định rạch ròi biên giới trách nhiệm giữa **Soạn thảo (Creator)**, **Kiểm duyệt (Moderator)**, **Hoạch định (Manager)**, và **Hỗ trợ vận hành (Operations Staff)**.  
   **Tuyệt đối không thêm:** `Teacher` như vai trò tách biệt, `System/Auditor` như vai trò người dùng, `Exam Manager`, hay `Question Bank Manager`.

3. **Chính sách Quản trị Học liệu Đã Khóa (Content Workflow Policy Frozen):**  
   - **D1 — Content Workflow: 1A (Manager-driven):** Manager lập kế hoạch khung $\rightarrow$ phân công Creator $\rightarrow$ Creator biên soạn $\rightarrow$ Moderator kiểm duyệt $\rightarrow$ Manager xuất bản. Creator không được tự ý bypass phân công/lập kế hoạch.
   - **D2 — Separation of Duties: 2B:** Moderator kiểm duyệt chuyên môn (`APPROVED`); Manager chịu trách nhiệm xuất bản (`PUBLISHED`); Creator tuyệt đối cấm tự duyệt/xuất bản nội dung của mình.
   - **D3 — Published Content Update: 3B (Revision / Clone-to-Draft):** Published v1 $\rightarrow$ Clone Draft v2 $\rightarrow$ Moderator duyệt $\rightarrow$ Manager xuất bản v2. Không sửa in-place trực tiếp bài học đã xuất bản.

4. **Xác lập Ranh giới Kiểm tra Đánh giá (Assessment Boundary — D4):**  
   Phân định rõ sự khác biệt giữa **Exercise** trong bài học hàng ngày và **Assessment** trong Placement Test / Jump Unit. MVP sử dụng thống nhất một mô hình `Exercise` (`isAssessmentMode = true`). Lingora **không xây dựng thực thể `QuestionBank` hay `Exam` trong MVP**. Các tính năng mở rộng (`QuestionBank`, `Import DOCX`, `Formula LaTeX`, `Exam Security`) xếp vào danh mục `FUTURE / OPTIONAL / DEFERRED` (out of MVP current scope, not permanent rejection).

---

## 2. Lecturer Feedback Mapping & Domain Screening

### 2.1 Tiếp thu Phản biện của Giảng viên
- **Phản biện gốc:** *"Cần xác định lại các nhóm đối tượng người dùng, xác định yêu cầu chức năng của từng nhóm."*
- **Nguyên nhân gốc rễ (Root Cause):** Trong các tài liệu và slide trước đây, nhóm từng có sự mâu thuẫn khi một số tài liệu học thuật chỉ ghi "2 tác nhân ngoài hệ thống là Learner và Admin", trong khi kiến trúc dữ liệu và tài liệu Phase 0 lại đề cập tới 6 vai trò. Đồng thời, quyền hạn của người biên soạn, người duyệt và người quản trị chưa có ranh giới nghiệp vụ (separation of duties) rõ ràng.
- **Giải pháp chuẩn hóa:**
  1. Giữ vững mô hình **6 vai trò chuẩn tắc**.
  2. Bóc tách chi tiết: Mục tiêu, Trách nhiệm, Quyền hạn, Use Case, và Dữ liệu sở hữu cho từng vai trò.
  3. Lập ma trận phân công trách nhiệm (RACI) và bảng ánh xạ chức năng tường minh.

### 2.2 Học tập Phương pháp từ Đề tài Nhóm khác & Sàng lọc Ranh giới (Cross-Group Screening)
Chúng tôi tiếp thu phương pháp phân tích bài bản của các nhóm bạn (như nhóm thi trắc nghiệm Eduso, nhóm LMS), nhưng **thực hiện chọn lọc nghiêm ngặt theo đúng bản chất học ngôn ngữ của Lingora**:

| Ý tưởng từ Nhóm khác | Bản chất Đề tài Bạn | Đánh giá đối với Lingora | Phân loại | Lý do Chấp nhận / Phân loại |
|---|---|---|:---:|---|
| **Quản trị Ngân hàng Câu hỏi (`QuestionBank`)** | Hệ thống thi trắc nghiệm chuyên dụng | Bài tập của Lingora gắn liền với ngữ cảnh bài học (`Lesson`) và từ vựng (`VocabItem`). Dùng chung `Exercise` (`isAssessmentMode = true`). | `FUTURE / OPTIONAL` | Không tạo thực thể `QuestionBank` trong MVP. Xếp vào mở rộng sau này. |
| **Nhập đề từ Word / DOCX** | Số hóa đề thi có sẵn của giáo viên | Bài học ngoại ngữ Lingora có cấu trúc JSONB phức tạp (audio, vị trí điền khuyết, token dịch nghĩa, câu kịch bản). | `DEFERRED` | Out of MVP scope; nhập liệu trực tiếp qua CMS chuẩn của Creator. |
| **Công thức Toán học (LaTeX/MathJax)** | Thi Toán, Lý, Hóa | Lingora học tiếng Anh/ngoại ngữ giao tiếp cơ bản (English A1 pilot). | `DEFERRED` | Hoàn toàn ngoài phạm vi (Out of Scope). |
| **Quản lý Phương tiện (Image/Audio)** | Đề thi đa phương tiện | Học ngoại ngữ bắt buộc phải có hình ảnh trực quan và audio phát âm chuẩn. | `KEEP` | Tận dụng Supabase Storage bucket `lingora-media` ($\le 10\text{MB}$). |
| **Tiếp tục Bài thi dở dang (Resume Session)** | Chống rớt mạng khi thi | Học viên đang làm Placement Test hoặc Jump Assessment bị đứt mạng cần được khôi phục phiên. | `KEEP-LATER` | Đưa vào backlog hoàn thiện trải nghiệm client ở Phase sau; MVP v1 lưu điểm sau khi nộp. |
| **Mã hóa Đề thi (Exam Security / Proctoring)** | Kỳ thi quốc gia, chống lộ đề | Lingora là hệ thống học tập tự nguyện, cá nhân hóa, không phải kỳ thi tuyển sinh cạnh tranh. | `DEFERRED` | Làm phức tạp hóa hệ thống không cần thiết; out of MVP current scope. |

---

## 3. Current Role Audit (Kiểm toán Chi tiết 6 Vai trò)

```
========================================================================================
BẢNG KIỂM TOÁN VÀ ĐẶC TẢ CHI TIẾT 6 TÁC NHÂN HỆ THỐNG (CANONICAL ROLE BASELINE)
========================================================================================
```

### 3.1 ADMINISTRATOR (Quản trị viên Hệ thống)
- **1. Goal:** Bảo đảm tính toàn vẹn, bảo mật, vận hành ổn định và tuân thủ dữ liệu của toàn bộ nền tảng.
- **2. Responsibility:** Quản lý tài khoản người dùng, phân bổ và thu hồi vai trò hệ thống, cấu hình tham số toàn cục, giám sát nhật ký kiểm toán (Audit Logs) và sao lưu dữ liệu.
- **3. Permission:** Toàn quyền quản trị hệ thống (`ADMIN_ACCESS`). Không bị hạn chế bởi RLS ở các bảng cấu hình; tuy nhiên **không tự ý can thiệp làm sai lệch dữ liệu học tập cá nhân của Learner**.
- **4. Main Functions:** Quản trị người dùng (Khóa/Mở/Gán vai trò), Cấu hình hệ thống, Xem nhật ký hoạt động hệ thống, Xem báo cáo vận hành DAU/MAU.
- **5. Use Cases:** `UC-11` (Quản trị tài khoản & phân quyền), `UC-12` (Báo cáo vận hành hệ thống), `UC-13` (Nhật ký kiểm toán hệ thống).
- **6. Owned Data:** `AuditLog`, `SystemConfig`.
- **7. Read Data:** Toàn bộ thực thể trong hệ thống.
- **8. Create Data:** Tài khoản nội bộ (`Profile` với vai trò Creator/Mod/Ops), `AuditLog`.
- **9. Edit Data:** Trạng thái tài khoản người dùng (`Profile.role`, `Profile.isActive`), cấu hình hệ thống.
- **10. Review Data:** Xem xét các trường hợp vi phạm quy chuẩn, khiếu nại tài khoản.
- **11. Approve Data:** Phê duyệt cấp quyền vai trò đặc quyền (Creator, Moderator, Operations).
- **12. Publish Data:** Không trực tiếp xuất bản học liệu (để đảm bảo tính phân tách trách nhiệm).
- **13. Relationship với Roles khác:**
  - Cấp quyền và giám sát hoạt động của `ORGANIZATIONAL_MANAGER`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`.
  - Khóa tài khoản `LEARNER` khi có vi phạm nghiêm trọng.

### 3.2 ORGANIZATIONAL MANAGER (Quản lý Tổ chức / Đào tạo)
- **1. Goal:** Hoạch định lộ trình đào tạo, xây dựng đề cương khóa học (Syllabus) và điều phối tiến độ sản xuất học liệu.
- **2. Responsibility:** Tạo khung Khóa học (`Course`) và Chủ điểm (`Unit`); phân công chỉ tiêu biên soạn cho Lesson Creator; theo dõi tiến độ hoàn thành nội dung; chịu trách nhiệm kích hoạt xuất bản bài học/khóa học (`PUBLISHED`).
- **3. Permission:** Quản lý khóa học cấp độ khung (`CURRICULUM_PLANNING`), giao việc (`ASSIGNMENT_MANAGEMENT`), xuất bản nội dung (`PUBLISHING_AUTHORITY`).
- **4. Main Functions:** Tạo/sửa khung Course và Unit; Phân công biên soạn Lesson cho Creator; Theo dõi tiến độ duyệt nội dung; Kích hoạt xuất bản nội dung đã được Moderator duyệt; Xem báo cáo phân tích học tập theo nhóm.
- **5. Use Cases:** `UC-04` (Khám phá lộ trình), `UC-10` (Xuất bản học liệu), `UC-15` (Quản lý tổ chức & lớp học - tùy chọn).
- **6. Owned Data:** `Course`, `Unit`, `UnitTranslation`, phân công biên soạn.
- **7. Read Data:** `Course`, `Unit`, `Lesson`, `Profile` (Creator/Learner thuộc tổ chức), báo cáo tổng hợp tiến độ.
- **8. Create Data:** Khung `Course`, `Unit`, chỉ tiêu giao việc (`Assignment`).
- **9. Edit Data:** Tiêu đề, mục tiêu, thứ tự `orderIndex` của Course và Unit.
- **10. Review Data:** Theo dõi tiến độ hoàn thành bài học so với kế hoạch đào tạo.
- **11. Approve Data:** Không trực tiếp duyệt chi tiết sư phạm từng câu hỏi (đó là việc của Moderator).
- **12. Publish Data:** Chịu trách nhiệm cuối cùng trong việc bấm xuất bản bài học (`Lesson.status = 'PUBLISHED'`) và xuất bản khóa học (`Course.isPublished = true`) sau khi Moderator đã thẩm định đạt chuẩn (`APPROVED`).
- **13. Relationship với Roles khác:**
  - Lập kế hoạch và giao chỉ tiêu cho `LESSON_CREATOR`.
  - Phối hợp với `MODERATOR` để đẩy nhanh tiến độ kiểm duyệt.
  - Nhận ủy quyền quản trị đơn vị từ `ADMINISTRATOR`.

### 3.3 LESSON CREATOR (Soạn giả / Giảng viên Biên soạn)
- **1. Goal:** Xây dựng nội dung bài học chất lượng cao, thiết kế bài tập sư phạm phong phú và cung cấp giải thích dễ hiểu theo kế hoạch được giao.
- **2. Responsibility:** Biên soạn chi tiết Bài học (`Lesson`), Từ vựng (`VocabItem`), Bài tập (`Exercise`) và kịch bản viết (`ChatScenario`) theo đúng phân công của Manager; bổ sung media hợp lệ; tiếp thu phản hồi sửa đổi từ Moderator.
- **3. Permission:** Soạn thảo nội dung (`CONTENT_AUTHORING`), tải lên media bài học, gửi yêu cầu duyệt bài (`SUBMIT_FOR_REVIEW`).
- **4. Main Functions:** Tạo bản thảo bài học (`DRAFT`) theo phân công; Nhập liệu từ vựng và bài tập đa dạng (`MCQ`, `FILL_BLANK`, `REORDER`, `GRAMMAR`, `LISTENING`); Tải audio/ảnh; Chỉnh sửa bản thảo theo yêu cầu của Kiểm duyệt viên (`CHANGES_REQUESTED`).
- **5. Use Cases:** `UC-08` (Quản lý soạn thảo nội dung CMS), `UC-05` (Đóng góp bài học/bài tập).
- **6. Owned Data:** Các bản ghi `Lesson`, `Exercise`, `VocabItem` do chính mình tạo ra ở trạng thái `DRAFT` / `CHANGES_REQUESTED`.
- **7. Read Data:** Các Course, Unit được phân công; danh mục từ điển dùng chung; phản hồi từ Moderator.
- **8. Create Data:** `Lesson`, `LessonTranslation`, `Exercise`, `VocabItem`, `ChatScenario`.
- **9. Edit Data:** Sửa các nội dung do chính mình tạo ở trạng thái `DRAFT` hoặc `CHANGES_REQUESTED`. **Bị khóa quyền sửa khi nội dung đang `IN_REVIEW` hoặc đã `PUBLISHED`.**
- **10. Review Data:** Xem lại bài soạn của chính mình ở chế độ Preview.
- **11. Approve Data:** **TUYỆT ĐỐI KHÔNG CÓ QUYỀN TỰ PHÊ DUYỆT BÀI CỦA MÌNH** (Creator cannot approve own content).
- **12. Publish Data:** **TUYỆT ĐỐI KHÔNG CÓ QUYỀN TỰ XUẤT BẢN** (Creator cannot publish own content).
- **13. Relationship với Roles khác:**
  - Nhận kế hoạch phân công từ `ORGANIZATIONAL_MANAGER` (Creator không được tự ý bypass phân công/kế hoạch).
  - Gửi bản thảo cho `MODERATOR` thẩm định; nhận góp ý sửa bài từ Moderator.

### 3.4 MODERATOR (Kiểm duyệt viên Học thuật)
- **1. Goal:** Bảo đảm tính chuẩn xác về mặt chuyên môn sư phạm, chính tả, ngữ pháp, đạo đức và bản quyền của toàn bộ học liệu trước khi đến tay người học.
- **2. Responsibility:** Thẩm định nội dung bài học trong hàng đợi kiểm duyệt (`Review Queue`); kiểm tra tính chính xác của đáp án và lời giải thích; yêu cầu chỉnh sửa kèm lý do cụ thể (`CHANGES_REQUESTED`) hoặc phê duyệt đạt chuẩn chuyên môn (`APPROVED`).
- **3. Permission:** Thẩm định nội dung (`CONTENT_REVIEW`), yêu cầu sửa đổi (`REQUEST_CHANGES`), phê duyệt bài học (`APPROVE`).
- **4. Main Functions:** Xem hàng đợi bài học chờ duyệt (`IN_REVIEW`); Thực hiện nghiệm thu bài học ở chế độ giả lập học viên; Gửi ghi chú yêu cầu sửa đổi (`CHANGES_REQUESTED`); Ký duyệt đạt chuẩn bài học (`APPROVED`).
- **5. Use Cases:** `UC-09` (Kiểm duyệt nội dung học liệu).
- **6. Owned Data:** Các bản ghi đánh giá kiểm duyệt (`ReviewFeedback`), nhật ký phê duyệt.
- **7. Read Data:** Toàn bộ nội dung bản thảo gửi duyệt, tài liệu gốc, lịch sử sửa đổi.
- **8. Create Data:** Ghi chú kiểm duyệt (`ReviewFeedback`).
- **9. Edit Data:** Ghi nhận lỗi và đề xuất sửa đổi trong phiếu phản hồi.
- **10. Review Data:** Toàn quyền rà soát chi tiết từng câu hỏi, âm thanh, hình ảnh.
- **11. Approve Data:** Toàn quyền phê duyệt chuyên môn chuyển trạng thái `IN_REVIEW → APPROVED`.
- **12. Publish Data:** Không nắm quyền xuất bản độc lập (quyền xuất bản do Organizational Manager nắm giữ theo quyết định 2B).
- **13. Relationship với Roles khác:**
  - Phản hồi chất lượng cho `LESSON_CREATOR`.
  - Chuyển bài học đã phê duyệt (`APPROVED`) sang cho `ORGANIZATIONAL_MANAGER` để xuất bản.
  - Tiếp nhận phản ánh lỗi nội dung từ `OPERATIONS_STAFF` để yêu cầu tạo revision sửa bài.

### 3.5 OPERATIONS STAFF (Nhân viên Vận hành & Hỗ trợ)
- **1. Goal:** Hỗ trợ người học khắc phục sự cố kỹ thuật, giải đáp thắc mắc tài khoản và duy trì chất lượng dịch vụ khách hàng.
- **2. Responsibility:** Tiếp nhận và xử lý yêu cầu trợ giúp (Support Ticket); ghi nhận báo cáo lỗi bài tập (Content Errata Report) từ Learner và chuyển giao cho Moderator; hỗ trợ mở khóa tài khoản khi có khiếu nại.
- **3. Permission:** Quản lý yêu cầu hỗ trợ (`SUPPORT_ACCESS`), xem thông tin tài khoản người dùng ở mức tối thiểu, tạo báo cáo sự cố nội dung.
- **4. Main Functions:** Tiếp nhận ticket hỗ trợ; Cập nhật trạng thái xử lý ticket (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`); Tra cứu lịch sử học tập cơ bản của học viên; Gắn cờ (flag) bài tập bị người học phản ánh có lỗi.
- **5. Use Cases:** `UC-14` (Hỗ trợ người dùng & xử lý sự cố).
- **6. Owned Data:** `SupportTicket`, `TicketMessage`, `ContentReport`.
- **7. Read Data:** Thông tin cơ bản của `Profile`, nhật ký lỗi kỹ thuật, phản ánh của người học.
- **8. Create Data:** Ticket hỗ trợ, ghi chú xử lý sự cố nội bộ.
- **9. Edit Data:** Trạng thái ticket, gán người xử lý ticket.
- **10. Review Data:** Xem xét mức độ hợp lý của khiếu nại mất chuỗi học hoặc lỗi bài tập.
- **11. Approve Data:** Không có quyền duyệt bài học hay phân quyền tài khoản hệ thống.
- **12. Publish Data:** Không có quyền xuất bản nội dung.
- **13. Relationship với Roles khác:**
  - Hỗ trợ trực tiếp cho `LEARNER`.
  - Chuyển tiếp lỗi nội dung cho `MODERATOR` xử lý.
  - Báo cáo sự cố hệ thống nghiêm trọng cho `ADMINISTRATOR`.

### 3.6 LEARNER (Học viên)
- **1. Goal:** Nâng cao trình độ ngoại ngữ thông qua lộ trình cá nhân hóa, duy trì thói quen học tập đều đặn và ghi nhớ từ vựng bền vững.
- **2. Responsibility:** Hoàn thành bài học, tham gia ôn tập SRS đúng hạn, tuân thủ văn hóa ứng xử và tự giác kiểm tra đánh giá năng lực.
- **3. Permission:** Học tập và ôn tập cá nhân (`LEARN_ACCESS`), xem tiến độ cá nhân, thực hiện bài kiểm tra đầu vào / nhảy cóc, gửi yêu cầu hỗ trợ hoặc báo lỗi câu hỏi.
- **4. Main Functions:** Làm Placement Test (~30 câu) hoặc Bỏ qua (Skip); Học bài học tương tác (`MCQ`, `FILL_BLANK`, `REORDER`); Làm vòng thử lại có kiểm soát (Controlled Retry: 10% allowance, 70% credit); Ôn tập từ vựng SRS theo hạn đến (Policy B); Luyện viết tình huống có GEC trợ giúp; Duy trì Daily Goal và Streak theo local timezone; Gửi báo cáo lỗi nội dung (Report Errata).
- **5. Use Cases:** `UC-01` (Auth), `UC-02` (Onboarding), `UC-03` (Placement), `UC-04` (Khám phá lộ trình), `UC-05` (Học bài tương tác & Retry), `UC-06` (Luyện viết & SRS), `UC-07` (Theo dõi tiến độ cá nhân).
- **6. Owned Data:** `UserProgress`, `UserVocabSrs`, `ReviewLog`, `Profile` (thông tin cá nhân của chính mình).
- **7. Read Data:** Nội dung các bài học đã xuất bản (`PUBLISHED`), từ điển từ vựng trong bài, tiến độ của chính mình.
- **8. Create Data:** Bản ghi trả lời bài tập phiên học (transient), kết quả nộp bài, báo cáo lỗi câu hỏi (`ContentReport`).
- **9. Edit Data:** Cập nhật thông tin cá nhân (`displayName`, `avatarUrl`, `dailyGoalMin`, `timezone`).
- **10. Review Data:** Xem lại kết quả phiên học, xem lịch sử ôn tập từ vựng của bản thân.
- **11. Approve / Publish Data:** Hoàn toàn không có quyền quản trị hay phê duyệt.
- **12. Relationship với Roles khác:**
  - Tiếp nhận tri thức từ bài học do `LESSON_CREATOR` soạn, `MODERATOR` duyệt, và `ORGANIZATIONAL_MANAGER` xuất bản.
  - Nhận hỗ trợ kỹ thuật từ `OPERATIONS_STAFF`.

---

## 4. Role Responsibility Matrix (CRUD & RACI)

Bảng phân công trách nhiệm chi tiết trên các thực thể và phân hệ nghiệp vụ của Lingora:
*(Ký hiệu RACI: **R** = Responsible [Thực hiện], **A** = Accountable [Chịu trách nhiệm cuối cùng], **C** = Consulted [Tham vấn/Kiểm duyệt], **I** = Informed [Nhận thông tin])*

| Thực thể / Quy trình Nghiệp vụ | Administrator | Org Manager | Lesson Creator | Moderator | Operations Staff | Learner |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Course & Unit Planning (D1)** | **I** | **A / R** *(lập kế hoạch)* | **C** | **C** | **I** | **I** *(chỉ xem)* |
| **Lesson & Exercise Authoring (D1)**| **I** | **A** *(phân công)* | **R** *(biên soạn)* | **C** | **I** | **-** |
| **Media Upload (`lingora-media`)**| **A** *(quản trị dung lượng)* | **I** | **R** *(tải lên)* | **C** *(duyệt)* | **-** | **-** |
| **Content Review (`ReviewQueue` - D2)**| **I** | **I** | **I** *(nhận phản hồi)* | **A / R** *(duyệt APPROVED)* | **-** | **-** |
| **Content Publishing (`PUBLISHED` - D2)**| **I** | **A / R** *(xuất bản)*| **-** *(cấm tự publish)* | **C** *(đã thẩm định)* | **I** | **I** *(được học)* |
| **Published Content Revision (D3)** | **I** | **A** *(duyệt publish v2)*| **R** *(soạn draft v2)*| **C** *(duyệt draft v2)*| **I** | **I** *(không gián đoạn)* |
| **User Progress & Learning SRS (D8)**| **I** | **I** *(xem cohort)* | **-** | **-** | **I** *(hỗ trợ)* | **A / R** *(sở hữu)* |
| **Controlled Retry Session (D7)** | **-** | **-** | **-** | **-** | **-** | **A / R** *(10% allow, 70% credit)*|
| **Placement Test (~30q - D6)** | **I** | **C** | **R** *(soạn đề)* | **A** *(duyệt đề)* | **-** | **R** *(làm bài / Skip)* |
| **Jump Assessment ($\ge 95\%$ - D5)**| **I** | **C** | **R** *(soạn đề)* | **A** *(duyệt đề)* | **-** | **R** *(làm bài vượt cấp)*|
| **GEC Writing Interaction** | **A** *(service uptime)*| **-** | **R** *(soạn scenario)* | **C** *(duyệt scenario)*| **I** | **R** *(luyện viết)* |
| **Support Ticket & Errata Flag** | **I** | **I** | **I** *(được báo sửa)*| **C** *(sửa lỗi qua revision)*| **A / R** *(xử lý)* | **R** *(gửi ticket)* |
| **User Account & Role RBAC** | **A / R** *(cấp quyền)*| **C** *(yêu cầu)* | **I** | **I** | **I** | **I** |
| **System Audit Logs** | **A / R** | **I** | **-** | **I** | **-** | **-** |

---

## 5. Content Management Workflow: 1A — Manager-Driven (`USER DECISION` — D1)

Product Owner chính thức phê chuẩn **Policy 1A (Manager-driven Content Workflow)** làm quy trình vận hành chuẩn tắc của Lingora:

$$\text{Organizational Manager (Kế hoạch)} \longrightarrow \text{Lesson Creator (Biên soạn)} \longrightarrow \text{Moderator (Kiểm duyệt)} \longrightarrow \text{Organizational Manager (Xuất bản)}$$

### Các Bước Thực thi Chuẩn mực:
1. **Bước 1 — Hoạch định Đề cương & Kế hoạch (Curriculum Planning):**  
   `ORGANIZATIONAL_MANAGER` thiết kế toàn bộ đề cương Khóa học (`Course`), Chủ điểm (`Unit`) và danh mục bài học khung (`Lesson Skeleton`) theo thứ tự tuyến tính chuẩn.
2. **Bước 2 — Phân công Nhiệm vụ (Assignment):**  
   `ORGANIZATIONAL_MANAGER` phân công cụ thể (`assign`) từng bài học cho `LESSON_CREATOR`.
3. **Bước 3 — Biên soạn Chi tiết (Authoring Draft):**  
   `LESSON_CREATOR` nhận bài được giao và tiến hành biên soạn nội dung chi tiết (từ vựng, bài tập tương tác, media).  
   **Quy tắc bắt buộc:** **Creator tuyệt đối KHÔNG được tự ý bypass phân công/kế hoạch để tạo bài học ngoài đề cương (Creator cannot bypass assignment/planning).**
4. **Bước 4 — Kiểm tra Thử nghiệm (Creator Preview):**  
   Creator chạy thử bài học trên giao diện Player giả lập để tự kiểm tra chất lượng.
5. **Bước 5 — Gửi Thẩm định (Submit for Review):**  
   Creator hoàn tất bản thảo và bấm gửi duyệt $\rightarrow$ Hệ thống chuyển trạng thái `DRAFT → IN_REVIEW`. Creator bị khóa quyền sửa đổi trong thời gian chờ duyệt.
6. **Bước 6 — Kiểm duyệt Chuyên môn Độc lập (Moderation):**  
   `MODERATOR` mở hàng đợi kiểm duyệt, thẩm định độc lập về sư phạm, chính tả, bản quyền:
   - Nếu chưa đạt $\rightarrow$ Chuyển trạng thái `IN_REVIEW → CHANGES_REQUESTED` kèm lý do cụ thể.
   - Nếu đạt chuẩn $\rightarrow$ Chuyển trạng thái `IN_REVIEW → APPROVED`.
7. **Bước 7 — Phê duyệt Xuất bản (Publishing):**  
   `ORGANIZATIONAL_MANAGER` rà soát tổng thể và thực hiện kích hoạt xuất bản `APPROVED → PUBLISHED`. Bài học chính thức hiển thị cho toàn bộ người học. Toàn bộ quá trình lưu vào `AuditLog`.

---

## 6. Separation of Duties: 2B (`USER DECISION` — D2)

Nguyên tắc Phân tách Trách nhiệm (Separation of Duties) được khóa nghiêm ngặt:
- **`MODERATOR`:** Chịu trách nhiệm kiểm duyệt chuyên môn sư phạm độc lập; có quyền phê duyệt bài học đạt chuẩn chất lượng (`APPROVED`).
- **`ORGANIZATIONAL_MANAGER`:** Chịu trách nhiệm xuất bản (`PUBLISHED`) nội dung ra môi trường trực tiếp.
- **`LESSON_CREATOR`:** **Tuyệt đối KHÔNG có quyền tự duyệt hay tự xuất bản nội dung do chính mình tạo ra (Creator cannot approve/publish own content).**
- **`ADMINISTRATOR`:** Giám sát tuân thủ hệ thống qua `AuditLog`, không can thiệp vào quy trình biên tập thường nhật.

---

## 7. Content Lifecycle (Vòng Đời Nội Dung Chi Tiết)

Hệ thống bảo toàn 6 trạng thái chuẩn tắc đã định nghĩa trong Prisma schema:
$$\text{DRAFT} \longrightarrow \text{IN\_REVIEW} \longleftrightarrow \text{CHANGES\_REQUESTED} \longrightarrow \text{APPROVED} \longrightarrow \text{PUBLISHED} \longrightarrow \text{ARCHIVED}$$

### 7.1 Ma trận Chuyển dịch Trạng thái (State Transition Matrix)

| Trạng thái Nguồn | Trạng thái Đích | Tác nhân Kích hoạt | Điều kiện Tiên quyết Nghiệp vụ | Hành động Tự động của Hệ thống |
|---|---|---|---|---|
| *(Khởi tạo)* | `DRAFT` | Org Manager (tạo khung/giao việc) | Phải thuộc về một `Unit` hợp lệ đã tồn tại trong hệ thống. | Tạo bản ghi `Lesson`, gán `assignedToId = creator`. |
| `DRAFT` | `IN_REVIEW` | Lesson Creator | Bài học hoàn thành nội dung và tối thiểu 3 bài tập (`Exercise`). | Khóa quyền edit của Creator; đẩy bài vào `ReviewQueue`; ghi AuditLog. |
| `IN_REVIEW` | `CHANGES_REQUESTED` | Moderator | Phải nhập nội dung phản hồi (`feedback_note`) ít nhất 10 ký tự nêu rõ lý do. | Mở lại quyền edit cho Creator; gửi thông báo hệ thống cho Creator. |
| `CHANGES_REQUESTED` | `IN_REVIEW` | Lesson Creator | Creator đã thực hiện cập nhật nội dung sau khi sửa lỗi. | Khóa quyền edit của Creator; đưa lại bài học vào đầu hàng đợi duyệt. |
| `IN_REVIEW` | `APPROVED` | Moderator | Moderator khác `authorId` của bài học; nghiệm thu 100% bài tập không còn lỗi. | Đánh dấu bài học đạt chuẩn; ghi nhận `approvedBy = current_user`. |
| `APPROVED` | `PUBLISHED` | Org Manager | Khóa học cha (`Course`) đang ở trạng thái kích hoạt (`isPublished = true`). | Mở bài học cho toàn bộ Learner; bài học bắt đầu sinh tiến độ học tập. |
| `PUBLISHED` | `ARCHIVED` | Org Manager / Administrator | Bài học lỗi thời hoặc cần thay thế toàn diện bằng nội dung mới. | Ẩn bài học khỏi Learner mới; giữ nguyên dữ liệu lịch sử cho các Learner đã học. |
| `DRAFT` | `ARCHIVED` | Org Manager / Creator | Bản thảo nháp bị hủy bỏ hoặc trùng lặp. | Đánh dấu xóa mềm (`isArchived = true`), ẩn khỏi CMS. |

---

## 8. Published Content Update: 3B — Revision / Clone-to-Draft (`USER DECISION` — D3)

Product Owner chính thức phê chuẩn **Chính sách 3B (Revision / Clone-to-Draft Workflow)** cho việc cập nhật nội dung đã xuất bản:

$$\text{Published v1} \longrightarrow \text{Nhân bản tạo Draft v2} \longrightarrow \text{Moderator Review} \longrightarrow \text{Manager Publish v2}$$

### Nguyên Tắc Toàn Vẹn Dữ Liệu Bắt Buộc:
- **Tuyệt đối không sử dụng cơ chế sửa trực tiếp (no general in-place editing) trên bài học đã xuất bản.**
- Mọi chỉnh sửa nội dung trên bài học đã `PUBLISHED` đều phải nhân bản thành một bản thảo mới (`Draft v2`), trải qua đầy đủ quy trình kiểm duyệt độc lập của Moderator và kích hoạt xuất bản bởi Organizational Manager.
- Đảm bảo an toàn tuyệt đối cho người học: Học viên đang học dở phiên bản v1 không bị lỗi runtime, không bị mất phiên học hoặc xung đột payload tiến độ học tập.

---

## 9. Learning Workflow Audit (Kiểm toán Luồng Học Tập)

Luồng trải nghiệm người học được chuẩn hóa theo chuỗi tương tác khép kín:
$$\text{Placement} \rightarrow \text{Starting Unit} \rightarrow \text{Preview} \rightarrow \text{Jump (Năng lực)} \rightarrow \text{Lesson} \rightarrow \text{Exercise Engine} \rightarrow \text{Controlled Retry} \rightarrow \text{Completion} \rightarrow \text{Progress} \rightarrow \text{SRS} \rightarrow \text{Streak}$$

### 9.1 Phân Biệt Sư Phạm Rạch Ròi: Lesson Completion vs Learning Mastery

| Đặc tính So sánh | Hoàn Thành Bài Học (Lesson Completion) | Nắm Vững Kiến Thức (Learning Mastery) |
|---|---|---|
| **Bản chất** | Kết quả thực thi tức thời trong một phiên học ngắn (Session-level achievement). | Khả năng duy trì và truy xuất ký ức bền vững theo thời gian dài (Long-term retention). |
| **Không gian Đo lường**| Diễn ra cục bộ tại một bài học cụ thể (`Lesson`). | Trải rộng trên toàn bộ lộ trình và chu kỳ lặp lại ngắt quãng nhiều tuần (`SRS Timeline`). |
| **Tiêu chí Đánh giá (`USER DECISION`)**| Học viên hoàn thành Vòng 1 và hoàn thành đầy đủ các câu retry được phép theo hạn mức (10% allowance, 70% credit) $\rightarrow$ chuyển trạng thái **`COMPLETED`**. **Không áp điểm sàn hoàn thành.** | Thẻ từ vựng đạt Interval giãn cách dài theo thang SRS và có tỷ lệ nhớ liên tục qua nhiều lần kiểm tra ngắt quãng. |
| **Thực thể Dữ liệu** | Lưu tại `UserProgress.status = 'COMPLETED'` và `UserProgress.score`. | Lưu tại `UserVocabSrs.intervalDays`, `UserVocabSrs.easeFactor` và lịch sử các bản ghi `ReviewLog`. |
| **Ý nghĩa với Học viên**| Mở khóa bài học tiếp theo trên cây lộ trình. | Minh chứng cho năng lực phản xạ ngôn ngữ thực sự, chống lại sự xói mòn ký ức. |

---

## 10. Question / Assessment Boundary (Ranh Giới Bài Tập & Kiểm Tra — D4)

Để bảo đảm Lingora không bị biến chất thành hệ thống thi trắc nghiệm ngân hàng đề, ranh giới giữa các khái niệm được xác lập dứt khoát:

```
========================================================================================
RANH GIỚI KHÁI NIỆM: QUESTION vs EXERCISE vs ASSESSMENT vs EXAM
========================================================================================
```

1. **Question vs Exercise:**
   - **Question (Câu hỏi đơn lẻ):** Đơn vị hỏi-đáp nguyên tử.
   - **Exercise (Bài tập tương tác):** Thực thể quản trị trực tiếp chứa toàn bộ payload JSONB tương tác (câu hỏi, options, đáp án, audio, giải thích). Lingora lưu trữ ở cấp độ `Exercise`, không tách bảng `Question` riêng.
2. **Exercise vs Assessment:**
   - **Exercise:** Luyện tập hình thành kiến thức (Formative Learning). Có phản hồi tức thời đúng/sai, có vòng Controlled Retry.
   - **Assessment (Placement Test / Jump Assessment):** Đánh giá xác định năng lực (Diagnostic Evaluation). Không hiện giải thích tức thời sau từng câu; không có vòng thử lại câu sai; nộp toàn bộ bài một lần và tính điểm tổng kết để ra quyết định phân lớp hoặc mở khóa Unit.
3. **Assessment có phải một loại Exercise không?**
   - **Xác nhận (`USER DECISION` — D4):** Assessment sử dụng chung cấu trúc `Exercise` với cờ cấu hình `isAssessmentMode = true`.
   - Đề kiểm tra Assessment được cấu hình từ chính danh mục bài tập tiêu biểu hoặc tập bài tập chuyên biệt, **hoàn toàn KHÔNG cần tạo thực thể `Exam` hay `QuestionBank` riêng biệt trong MVP**.
4. **Lingora có cần thực thể `Exam` không?**
   - **KẾT LUẬN: KHÔNG TRONG MVP.** Lingora là nền tảng tự học ngoại ngữ trực tuyến, không tổ chức thi khảo thí cấp bằng. Thực thể `Exam` và `QuestionBank` chính thức xếp vào danh mục `FUTURE / OPTIONAL / DEFERRED` (out of MVP current scope, not permanent rejection).

---

## 11. Secondary Feature Screening (Sàng Lọc Tính Năng Nhóm Bạn)

Rà soát toàn diện các tính năng thường gặp ở các nhóm đề tài khác và phân loại dứt khoát cho Lingora:

| Mã Tính năng | Tên Tính năng Phụ | Phân loại | Căn cứ Sư phạm & Kỹ thuật đối với Lingora |
|---|---|---|---|
| **SEC-01** | **Import Word/DOCX tự động** | `DEFERRED` | Out of MVP scope; nhập liệu trực tiếp qua CMS chuẩn của Creator để bảo đảm định dạng JSONB. |
| **SEC-02** | **Công thức Toán / Khoa học (LaTeX)** | `DEFERRED` | Hoàn toàn ngoài phạm vi học ngoại ngữ giao tiếp cơ bản A1. |
| **SEC-03** | **Quản lý Hình ảnh (`Image Handling`)** | `KEEP` | Cần thiết để trực quan hóa từ vựng; dùng Supabase Storage `lingora-media`. |
| **SEC-04** | **Quản lý Âm thanh (`Audio Import/Play`)** | `KEEP` | Cốt lõi của học ngoại ngữ; bắt buộc cho từ vựng và bài tập nghe (`LISTENING`). |
| **SEC-05** | **Tiếp tục làm dở bài đánh giá (Resume)** | `KEEP-LATER`| Đưa vào backlog tối ưu trải nghiệm client sau pilot; MVP nộp bài trực tiếp. |
| **SEC-06** | **Mã hóa Đề thi & Khóa màn hình (Proctoring)**| `DEFERRED` | Out of MVP current scope; đi ngược triết lý tự học cá nhân hóa. |
| **SEC-07** | **Báo cáo lỗi câu hỏi (Errata Flag)** | `KEEP` | Học viên bấm báo lỗi câu hỏi $\rightarrow$ chuyển ticket cho Ops Staff / Moderator. |
| **SEC-08** | **Ghi chú cá nhân trong bài học (Personal Notes)** | `DEFERRED` | Tạm hoãn; tập trung vào luồng bài học và ôn tập SRS cốt lõi. |

---

## 12. Survey / Evidence Review (Rà Soát Cơ Sở Thực Nghiệm)

### 12.1 Phân loại Nguồn gốc Quyết định (Decision Grounding)
1. **Yêu cầu BẮT BUỘC có Bằng chứng Người dùng (User Evidence Driven):**
   - Hiện tượng hay quên từ vựng $\rightarrow$ Khảo sát $N=15$ (100% người học thừa nhận).
   - Nhu cầu được sửa lỗi câu trực quan $\rightarrow$ Khảo sát $N=15$ (66.7% mong muốn) và Phỏng vấn P1, P4.
   - Nhu cầu bài học ngắn 5–10 phút $\rightarrow$ Phỏng vấn định tính người đi làm P2, P5.
2. **Yêu cầu Xác lập bằng Phân tích Nghiệp vụ Phần mềm (Domain Analysis Driven):**
   - Vòng đời duyệt bài và nguyên tắc Creator không tự duyệt/publish bài của mình $\rightarrow$ Xuất phát từ nguyên lý Separation of Duties trong Kỹ nghệ Phần mềm.
   - Cơ chế điều tiết tải nhận thức trong SRS (Workload Adaptation) $\rightarrow$ Xuất phát từ Lý thuyết Tải nhận thức (Cognitive Load Theory).
3. **Yêu cầu là Quyết định Chính sách Sản phẩm (Product Policy Frozen):**
   - Quy mô Placement Test: ~30 câu.
   - Ngưỡng điểm Jump: $\ge 95\%$ (Product Policy), Cooldown 24h.
   - Tỷ lệ điểm cứu Retry: 70% credit, 10% allowance, no completion score threshold.
   - Thang cơ sở SRS: $[1, 3, 7, 14, 30]$ ngày.

### 12.2 Ranh giới Trung thực về Cỡ mẫu
- **Khảo sát Thực tế ($N=15$):** Khẳng định trung thực trong báo cáo đây là **Khảo sát Khám phá Định hướng Quy mô Nhỏ (Exploratory / Small-Sample Survey)** trên tập người dùng mẫu thuận tiện. **Tuyệt đối không overclaim là "khảo sát diện rộng toàn thị trường".**
- **Dữ liệu Mô phỏng Giả lập ($N=120$):** Được định danh chính xác là **Dữ liệu Giả lập Kiểm thử Giao diện (Synthetic UX Testing Data)**. **Tuyệt đối cấm trích dẫn số liệu này trong báo cáo đồ án và slide bảo vệ.**

---

## 13. Functional Requirement Candidates (Yêu Cầu Chức Năng Theo Nhóm Tác Nhân)

### Nhóm 1: Học viên (Learner Functional Requirements)
- `FR-LRN-01`: Đăng ký, đăng nhập an toàn, quản lý thông tin cá nhân và thiết lập mục tiêu học tập ngày (`dailyGoalMin`, `timezone`).
- `FR-LRN-02`: Làm bài kiểm tra đầu vào (Placement Test ~30 câu) để nhận Starting Unit, hoặc chọn Bỏ qua (Skip gán Unit 1); cho phép Retake từ Profile; không claim CEFR.
- `FR-LRN-03`: Xem trước (Preview) syllabus, từ vựng của Unit tiếp theo; yêu cầu làm bài đánh giá Nhảy cóc (Jump Assessment) với ngưỡng đỗ $\ge 95\%$ (trượt Cooldown 24h).
- `FR-LRN-04`: Thực hiện bài học tương tác đa dạng (`MCQ`, `FILL_BLANK`, `REORDER`, `GRAMMAR`, `LISTENING`) với phản hồi tức thời.
- `FR-LRN-05`: Tham gia Vòng thử lại có kiểm soát (Controlled Retry) ở cuối phiên với hạn mức 10% tổng số câu và hưởng 70% credit; hoàn thành hết câu hỏi vòng 1 và các câu retry cho phép $\rightarrow$ `COMPLETED` (không áp điểm sàn).
- `FR-LRN-06`: Ôn tập từ vựng thích ứng theo thuật toán Spaced Repetition (SRS) Policy B 4 tầng (Baseline, Due queue, Item adapt, Workload adapt; không dùng ML).
- `FR-LRN-07`: Luyện viết câu theo tình huống kịch bản và nhận phản hồi sửa lỗi ngữ pháp, đối chiếu diff trực quan từ AI nội bộ (GEC).
- `FR-LRN-08`: Theo dõi tiến độ học tập cá nhân, chuỗi ngày chuyên cần (Streak) theo múi giờ địa phương (miss reset về 1) và gửi báo cáo lỗi câu hỏi.

### Nhóm 2: Soạn giả (Lesson Creator Functional Requirements)
- `FR-CRE-01`: Tiếp nhận phân công biên soạn bài học từ Organizational Manager; không được tự ý bypass phân công/lập kế hoạch.
- `FR-CRE-02`: Biên soạn chi tiết bài học với tiêu đề, mô tả đa ngữ (`vi`/`en`) và thiết lập thứ tự hiển thị.
- `FR-CRE-03`: Thêm, sửa, xóa các bài tập tương tác (`Exercise`) gắn với bài học và cấu hình payload đáp án chuẩn xác.
- `FR-CRE-04`: Nạp danh mục từ vựng trọng tâm (`VocabItem`) của bài học, phiên âm IPA, nghĩa và ví dụ minh họa.
- `FR-CRE-05`: Tải lên tệp âm thanh phát âm và hình ảnh minh họa bài học vào kho lưu trữ media an toàn.
- `FR-CRE-06`: Xem trước bài học ở chế độ giả lập học viên (Preview Mode) để tự nghiệm thu chất lượng hiển thị.
- `FR-CRE-07`: Gửi bản thảo bài học sang Hàng đợi Kiểm duyệt (`IN_REVIEW`) và tiếp nhận các yêu cầu chỉnh sửa từ Moderator; tuyệt đối không tự duyệt hay tự xuất bản bài của mình.

### Nhóm 3: Kiểm duyệt viên (Moderator Functional Requirements)
- `FR-MOD-01`: Truy cập và quản lý Hàng đợi Kiểm duyệt bài học (`Review Queue`) theo thời gian thực.
- `FR-MOD-02`: Kiểm tra chi tiết bài học, phát hiện các lỗi sai về kiến thức, chính tả, phát âm hoặc vi phạm chuẩn mực.
- `FR-MOD-03`: Gửi yêu cầu chỉnh sửa (`CHANGES_REQUESTED`) kèm lý do cụ thể về cho Creator.
- `FR-MOD-04`: Phê duyệt bài học đạt chuẩn chuyên môn (`APPROVED`) với cơ chế kiểm tra chống tự phê duyệt bài của chính mình.
- `FR-MOD-05`: Chuyển bài học đã duyệt sang cho Organizational Manager xuất bản.

### Nhóm 4: Quản lý Đào tạo (Organizational Manager Functional Requirements)
- `FR-MGR-01`: Khởi tạo và quản trị cấu trúc khóa học (`Course`), thiết lập mã ngôn ngữ, cấp độ mục tiêu và thứ tự lộ trình.
- `FR-MGR-02`: Khởi tạo và phân chia các chủ điểm học tập (`Unit`), thiết lập đề cương và chuẩn đầu ra của từng Unit.
- `FR-MGR-03`: Phân công biên soạn bài học cho Lesson Creator và theo dõi tiến độ hoàn thành nội dung toàn khóa.
- `FR-MGR-04`: Kích hoạt xuất bản bài học đã được Moderator duyệt (`PUBLISHED`) và xuất bản toàn bộ Khóa học (`Course.isPublished = true`).
- `FR-MGR-05`: Xem báo cáo thống kê tổng hợp về tiến độ học tập của các nhóm học viên (Cohort Management - Tùy chọn).

### Nhóm 5: Nhân viên Vận hành (Operations Staff Functional Requirements)
- `FR-OPS-01`: Tiếp nhận danh sách các yêu cầu hỗ trợ và khiếu nại (Support Tickets) từ người học.
- `FR-OPS-02`: Cập nhật trạng thái xử lý sự cố, phản hồi giải đáp thắc mắc và đóng ticket khi hoàn tất.
- `FR-OPS-03`: Tiếp nhận danh sách phản ánh lỗi câu hỏi (`ContentReport`) từ học viên, kiểm tra thực tế và chuyển cờ cho Moderator.
- `FR-OPS-04`: Tra cứu lịch sử hoạt động cơ bản của học viên để hỗ trợ giải quyết khiếu nại theo quy định.

### Nhóm 6: Quản trị viên Hệ thống (Administrator Functional Requirements)
- `FR-ADM-01`: Quản trị danh sách người dùng toàn hệ thống; thực hiện khóa, mở khóa tài khoản người dùng vi phạm.
- `FR-ADM-02`: Phân bổ, điều chỉnh và thu hồi vai trò hệ thống (`RBAC Role Assignment`) trong phạm vi 6 vai trò chuẩn tắc.
- `FR-ADM-03`: Cấu hình các tham số vận hành toàn cục của nền tảng (giới hạn dung lượng media, cài đặt dịch vụ AI).
- `FR-ADM-04`: Truy xuất và tra cứu nhật ký kiểm toán toàn diện (`System Audit Logs`) để phục vụ giám sát và bảo mật.
- `FR-ADM-05`: Xem dashboard tổng quan về hiệu năng hệ thống, số lượng tài khoản hoạt động (DAU/MAU) và tình trạng lỗi.

---

## 14. Use Case Candidates (Danh Mục Use Case Chuẩn Hóa 15 UC)

Đồng bộ trọn vẹn với Ma trận Truy vết Canonical [`docs/05-traceability-matrix.md`](file:///d:/school/btl/docs/05-traceability-matrix.md):

| Mã UC | Tên Use Case Chuẩn Hóa | Tác nhân Chính | Tác nhân Hỗ trợ | Phân hệ Nghiệp vụ | Trạng thái Sau Product Freeze |
|---|---|---|---|---|:---:|
| **UC-01** | Đăng ký, đăng nhập và quản lý phiên | Learner, All Roles | Supabase Auth | Hạ tầng & Định danh | `IMPLEMENTED` (Foundation) |
| **UC-02** | Thiết lập mục tiêu & Onboarding | Learner | - | Trải nghiệm Người học | `USER DECISION` |
| **UC-03** | Kiểm tra đầu vào (Placement Test) | Learner | - | Trải nghiệm Người học | `USER DECISION (D6)` (Mapping: OPEN) |
| **UC-04** | Khám phá lộ trình & Nhảy cóc (Jump) | Learner | Org Manager | Quản lý Đào tạo | `USER DECISION (D5)` |
| **UC-05** | Học bài học tương tác & Retry | Learner | Lesson Creator | Lõi Học tập | `USER DECISION (D7)` |
| **UC-06** | Ôn tập từ vựng ngắt quãng (SRS) | Learner | - | Trí nhớ & Thói quen | `USER DECISION (D8)` |
| **UC-07** | Luyện viết tình huống & Sửa lỗi GEC | Learner | AI Service (Internal) | Năng lực Bổ trợ | `USER DECISION (ADR-014)` |
| **UC-08** | Theo dõi tiến độ cá nhân & Streak | Learner | - | Trải nghiệm Người học | `USER DECISION (D9)` |
| **UC-09** | Quản lý soạn thảo nội dung (CMS) | Lesson Creator | Org Manager | Quản trị Học liệu | `USER DECISION (D1, D2)` |
| **UC-10** | Kiểm duyệt nội dung học liệu | Moderator | Lesson Creator | Quản trị Học liệu | `USER DECISION (D1, D2)` |
| **UC-11** | Xuất bản học liệu trực tiếp | Org Manager | Moderator | Quản trị Học liệu | `USER DECISION (D2, D3)` |
| **UC-12** | Quản trị tài khoản và phân quyền | Administrator | - | Quản trị Hệ thống | `FACT` |
| **UC-13** | Xem báo cáo vận hành hệ thống | Administrator | - | Quản trị Hệ thống | `PROPOSAL` |
| **UC-14** | Tra cứu nhật ký kiểm toán (Audit Log) | Administrator | All Roles | Bảo mật & Tuân thủ | `FACT` |
| **UC-15** | Hỗ trợ người dùng & Báo lỗi nội dung | Operations Staff | Learner, Moderator | Hỗ trợ & Vận hành | `PROPOSAL` |

---

## 15. End-to-End Traceability Matrix

Bảng ma trận truy vết xuyên suốt từ phản biện của Giảng viên đến các quyết định chính sách sản phẩm đã đóng băng:

| Phản biện của Giảng viên | Câu hỏi Sản phẩm Đặt ra | Tác nhân Liên quan | Quy trình Nghiệp vụ | Chức năng Ứng viên | Use Case | Hỗ trợ Hiện có trong Repo | Khoảng cách (Gap) | Quyết định Chính thức của PO | Trạng thái |
|---|---|---|---|---|---|---|---|---|:---:|
| **Chưa rõ nhóm người dùng** | Lingora phục vụ những ai, ranh giới giữa các vai trò nội bộ là gì? | Cả 6 Roles | Toàn hệ thống | `FR-ADM-01..05`, `FR-LRN-01..08` | `UC-01` đến `UC-15` | Đã có Enum 6 vai trò trong Prisma schema | Thiếu đặc tả chi tiết CRUD/RACI trong báo cáo cũ | Khóa chính thức đúng 6 vai trò; không thêm Teacher/Auditor | `USER DECISION` |
| **Chưa rõ quyền Soạn giả vs Kiểm duyệt** | Soạn giả có tự duyệt bài của mình được không? Ai là người xuất bản bài? | Lesson Creator, Moderator, Org Manager | Soạn thảo & Duyệt học liệu | `FR-CRE-07`, `FR-MOD-04`, `FR-MGR-04` | `UC-09`, `UC-10`, `UC-11` | Đã có trường `authorId`, `approvedBy` | Chưa có ràng buộc chặn tự duyệt trên UI/API | **D2 = 2B:** Moderator duyệt APPROVED; Manager xuất bản PUBLISHED; Creator cấm tự duyệt/publish | `USER DECISION` |
| **Quy trình xuất bản nội dung cồng kềnh hay lỏng lẻo?** | Khóa học được lên kế hoạch như thế nào, Creator có được tự tạo bài nháp? | Org Manager, Lesson Creator | Quản lý vòng đời học liệu | `FR-MGR-01..03`, `FR-CRE-01` | `UC-09` | 6 trạng thái vòng đời đã có trong Prisma | Chưa chốt cơ chế giao việc hay tự tạo | **D1 = 1A:** Manager lập kế hoạch $\rightarrow$ phân công Creator $\rightarrow$ Creator soạn; Creator cấm bypass | `USER DECISION` |
| **Học viên sửa lỗi bài tập như thế nào?** | Học viên làm sai có được cứu điểm không, có khuyến khích đoán mò không? | Learner | Lõi học tập | `FR-LRN-05` | `UC-05` | Đã kiểm chứng luồng bài học tuần tự | Chưa chốt ngân sách câu cứu và tiêu chí hoàn thành | **D7:** 2-pass retry, 10% allowance, 70% credit, completion sau retry; không áp điểm sàn | `USER DECISION` |
| **Cá nhân hóa việc ôn tập từ vựng** | Làm sao để người học nhanh và chậm không bị ép học chung một lịch? | Learner | Ôn tập thích ứng | `FR-LRN-06` | `UC-06` | RPC `record_review` đã PASS 34 test | Chưa có cơ chế hàng đợi age/due và chống quá tải backlog | **D8:** Policy B 4 tầng (Baseline $[1,3,7,14,30]$, Due queue, Item adapt, Workload adapt, no ML) | `USER DECISION` |
| **Hệ thống có bị biến thành thi trắc nghiệm không?** | Lingora có cần ngân hàng câu hỏi và tạo đề thi như nhóm Eduso không? | Learner, Creator | Đánh giá năng lực | `FR-LRN-02`, `FR-LRN-03` | `UC-03`, `UC-04` | Cấu trúc `Exercise` với JSONB payload | Báo cáo cũ dùng lẫn lộn thuật ngữ "Exam / Đề thi" | **D4 = 4A:** Dùng chung Exercise (`isAssessmentMode = true`); Không tạo Exam/QuestionBank trong MVP | `USER DECISION` |

---

## 16. Missing / Conflict / Deferred Register

| Mã | Hạng mục | Bản chất Vấn đề | Trạng thái | Hướng Xử lý Chuẩn mực |
|---|---|---|:---:|---|
| **GAP-01** | Bảng Lưu trữ Hỗ trợ (`SupportTicket`) | Schema Prisma hiện hành chưa có bảng cho chức năng của Operations Staff (`MVP-16`). | `MISSING` | Giữ ở cấp độ đặc tả phân tích; bổ sung schema ở Milestone M3 theo quy trình kế hoạch. |
| **GAP-02** | Bảng Kết quả Placement Test | Bảng ánh xạ điểm sang Unit thuộc `OD-PLACEMENT-MAPPING`. | `OPEN DECISION` | Giữ trạng thái OPEN / CURRICULUM-DEPENDENT; chốt khi biên soạn đề cương Khóa English A1. |
| **CONF-01** | Xung đột Số lượng Tác nhân trong Báo cáo Word cũ | Báo cáo cũ ghi "2 tác nhân ngoài hệ thống", mâu thuẫn trực tiếp với kiến trúc 6 vai trò. | `RESOLVED` | Đồng bộ toàn bộ Báo cáo Word và Slide theo danh mục 6 vai trò chuẩn mực. |
| **CONF-02** | Nhầm lẫn giữa Exercise và Question Bank | Một số slide cũ vay mượn thuật ngữ "Ngân hàng đề thi" của hệ thống thi trắc nghiệm. | `RESOLVED` | Xác lập rõ ràng: Lingora chỉ quản trị `Exercise` trong bài học; không có thực thể `QuestionBank` trong MVP. |
| **DEF-01** | Phục hồi Chuỗi Học tập (`Streak Recovery Budget`)| Ý tưởng cấp vé cứu chuỗi thích ứng chuyên cần cho học viên. | `DEFERRED` | Hoãn toàn bộ sau giai đoạn pilot; MVP v1 chỉ duy trì Daily Streak chuẩn theo local timezone và reset về 1 khi miss. |
| **DEF-02** | Phân hệ Quản lý Lớp học Tổ chức (`UC-15 Cohort`)| Quản lý hợp đồng đào tạo trường học/doanh nghiệp của Organizational Manager. | `DEFERRED` | Đưa vào danh mục tùy chọn mở rộng B2B, không chặn tiến độ phát triển của nền tảng B2C cốt lõi. |

---

## 17. Product Owner Decisions Recorded (Đã Khóa Chính Thức)

Các quyết định sản phẩm đã được Product Owner phê chuẩn chính thức:

- **Q1 — Content Management Workflow:** Chọn **1A (Manager-driven)** — `USER DECISION`. Manager lập kế hoạch khung Course/Unit/Lesson $\rightarrow$ phân công Creator $\rightarrow$ Creator biên soạn $\rightarrow$ Moderator review $\rightarrow$ Manager publish. Creator không được tự ý bypass phân công/lập kế hoạch.
- **Q2 — Separation of Duties:** Chọn **2B** — `USER DECISION`. Moderator thẩm định chuyên môn độc lập (`APPROVED`); Manager chịu trách nhiệm kích hoạt xuất bản (`PUBLISHED`); Creator tuyệt đối cấm tự duyệt/xuất bản nội dung của mình.
- **Q3 — Published Content Update:** Chọn **3B (Revision / Clone-to-Draft)** — `USER DECISION`. Published v1 $\rightarrow$ Clone Draft v2 $\rightarrow$ Moderator review $\rightarrow$ Manager publish v2. Không sửa in-place trực tiếp bài đã xuất bản.
- **Q4 — Assessment Boundary:** Chọn **4A (Unified Exercise Model)** — `USER DECISION`. MVP dùng chung mô hình `Exercise` (`isAssessmentMode = true`) cho học tập, kiểm tra Unit, Placement Test, Jump Assessment. Không xây dựng riêng `Exam` hay `QuestionBank` trong MVP. Các tính năng QuestionBank, Import DOCX, LaTeX formula, Exam security xếp vào `FUTURE / OPTIONAL / DEFERRED`.
- **D5 — Curriculum Jump:** Conditional Jump: Jump 1 Unit (kiểm tra trước), 2–3 Units (tích lũy), >3 Units (toàn diện, không cấm). Ngưỡng đạt: $\ge 95\%$ (Product Policy). Trượt $\rightarrow$ Cooldown 24 giờ.
- **D6 — Placement Test:** Bắt buộc (`MVP-03`), ~30 câu, Skip gán Unit 1, Retake từ Profile, Starting Unit output, không claim CEFR. `OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT`.
- **D7 — Controlled Retry:** 2-pass retry; allowance 10% ($\max(1, \lfloor N \times 0.10 \rfloor)$); credit 70%; hoàn thành pass 1 và các câu retry cho phép $\rightarrow$ `COMPLETED`; không áp điểm sàn hoàn thành bài học.
- **D8 — Balanced Personalized SRS:** Policy B 4 tầng (Baseline $[1, 3, 7, 14, 30]$ ngày, Due queue, Item adapt, Workload adapt). Xác định, không ML.
- **D9 — Streak & Recovery:** Pure streak MVP v1: local timezone, qualifying activity +1, miss 1 ngày reset về 1. Recovery deferred.

---

## 18. Final Status

$$\mathbf{\Large \text{TRẠNG THÁI: } \text{PHASE 0 — PRODUCT FROZEN}}$$
$$\text{(Ghi chú bắt buộc: } \mathbf{\text{OD-PLACEMENT-MAPPING = OPEN / CURRICULUM-DEPENDENT}}\text{)}$$

> [!IMPORTANT]
> **ĐÓNG BĂNG CHÍNH SÁCH SẢN PHẨM KHÔNG ĐỒNG NGHĨA VỚI VIỆC YÊU CẦU KỸ THUẬT ĐÃ ĐÓNG BĂNG (This does NOT mean Requirements are frozen).**  
> Việc đóng băng chính sách sản phẩm (`Product Policy Freeze`) là bước đi tiên quyết để xác lập các nguyên tắc vận hành cốt lõi. Kế tiếp, nhóm sẽ tiến hành:
> 1. Thiết kế Đề cương Chi tiết Khóa tiếng Anh A1 (`Curriculum Design`).
> 2. Khóa bảng ánh xạ `OD-PLACEMENT-MAPPING` và đóng băng toàn bộ Yêu cầu Kỹ thuật (`Requirements Freeze`).
> 3. Cập nhật hồ sơ Use Case Canonical chi tiết.
> 4. Hoàn thiện các Sơ đồ Phân tích Thiết kế (ERD, DFD, UML Sequence/Activity/Class).
> 5. Cập nhật Báo cáo Học thuật (Word) và Slide thuyết trình bảo vệ.
> 
> **TUYỆT ĐỐI KHÔNG CODE, KHÔNG SỬA PRISMA SCHEMA, KHÔNG TẠO MIGRATION, KHÔNG TRIỂN KHAI M2.**
