# TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI
## KHOA CÔNG NGHỆ THÔNG TIN

# BÁO CÁO PROJECT 1
## PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG HỌC NGOẠI NGỮ TRỰC TUYẾN LINGORA

**Giảng viên hướng dẫn:** [Bổ sung tên Giảng viên]
**Sinh viên thực hiện:** Phạm Nguyễn Thanh Tùng và các thành viên nhóm
**Năm học:** 2025 – 2026

# LỜI GIỚI THIỆU

Lingora là nền tảng Web hỗ trợ người học tiếng Anh theo một quy trình học tập rõ ràng: khóa học được chia thành bài học ngắn, từ vựng được ôn theo lịch lặp lại ngắt quãng, bài tập được tổ chức theo từng mục tiêu và tiến độ được ghi nhận nhất quán. Hệ thống cung cấp các tiện ích kiểm tra và xử lý văn bản theo quy tắc, giúp người học nhận biết điểm cần sửa trong câu viết mà không làm gián đoạn luồng học. Báo cáo tập trung vào phân tích yêu cầu, mô hình hóa Use Case, Activity, DFD và ERD cho nền tảng Web trong phạm vi Project 1.

# PHẦN I. YÊU CẦU ĐỀ TÀI

## 1.1. Mô tả bài toán

Người học ngoại ngữ khi tự học thường gặp phải ba rào cản lớn gắn liền với nhau:
1. **Nhanh quên từ vựng:** Người học tiếp thu từ mới một cách thụ động, thiếu chu kỳ ôn tập củng cố khoa học dẫn đến việc quên đến 80% kiến thức chỉ sau 24–48 giờ (theo đường cong quên lãng Ebbinghaus).
2. **Hạn chế trong phản hồi kỹ năng viết:** Khi tự luyện viết câu, người học không có công cụ đối chiếu, phát hiện và giải thích chi tiết các lỗi sai ngữ pháp, cấu trúc câu hoặc cách dùng từ.
3. **Đứt gãy động lực và thói quen học tập:** Người học dễ nản lòng và từ bỏ sau 1–2 tuần do thiếu hệ thống theo dõi tiến độ trực quan, thiếu cơ chế duy trì chuỗi ngày học (Streak) và bài học phân mảnh quá dài.

Lingora giải quyết trực diện các bài toán trên thông qua việc tích hợp thuật toán ôn tập ngắt quãng SRS (dựa trên nguyên lý SM-2), môi trường luyện viết câu theo kịch bản tình huống thực tế với phản hồi sửa lỗi tức thì từ mô-đun kiểm tra ngữ pháp nội bộ, cùng hệ thống bài tập tương tác ngắn và cơ chế tạo động lực học tập bền vững.

## 1.2. Phương pháp thu thập yêu cầu

### 1.2.1. Phân tích tài liệu và hiện trạng dự án
Nhóm nghiên cứu đã phân tích kỹ lưỡng tài liệu bài giảng Kỹ nghệ Yêu cầu, tài liệu kiến trúc hệ thống, hợp đồng giao tiếp API, mô hình dữ liệu quan hệ và ma trận truy vết của đề tài Lingora. Phương pháp này giúp chuẩn hóa danh mục thuật ngữ, xác định ranh giới hệ thống và các quy chuẩn kỹ thuật.

### 1.2.2. Phỏng vấn bán cấu trúc
Nhóm thực hiện 6 cuộc phỏng vấn chuyên sâu gốc (P1–P6) và 3 bản ghi phỏng vấn mở rộng bổ sung (IV-SUPP-01 đến 03) với các đối tượng người học đa dạng (sinh viên, người đi làm, học viên luyện thi chứng chỉ). Bộ câu hỏi gồm 15 chỉ mục xoay quanh thói quen học, khó khăn thực tế, phương pháp ôn tập từ vựng, nhu cầu sửa lỗi ngữ pháp và cơ chế tạo động lực.

### 1.2.3. Phân tích đối sánh sản phẩm tương tự
Nhóm tiến hành khảo sát và đối sánh 4 giải pháp tiêu biểu trên thị trường: Duolingo (thế mạnh về game hóa và chuỗi Streak), Quizlet (thế mạnh về Flashcard và SRS), Grammarly (thế mạnh về phát hiện và gạch chân vị trí lỗi sai trực quan) và Anki (thuật toán lặp lại ngắt quãng mạnh mẽ). Từ đó, Lingora định vị giải pháp tích hợp toàn diện: Bài học có cấu trúc + Ôn tập SRS khoa học + Luyện viết tình huống có phản hồi ngữ pháp tức thì.

### 1.2.4. Khảo sát định lượng diện rộng (N=15)
Bộ dữ liệu khảo sát 24 câu hỏi chi tiết ghi nhận 15 phản hồi thực tế. Các kết quả nổi bật khẳng định nhu cầu cấp thiết:
- **100,0% (15/15)** người học thừa nhận gặp tình trạng hay quên từ vựng (53,3% Rất thường xuyên, 46,7% Thỉnh thoảng).
- **93,3% (14/15)** mong muốn hệ thống tự động đề xuất nội dung cần học/ôn dựa trên kết quả trước đó.
- **86,7% (13/15)** từng bỏ học hoặc học không đều do thiếu phương pháp và mất động lực.
- **80,0% (12/15)** đánh giá mức độ cấp thiết của việc tự động xác định từ và thời điểm ôn tập ở mức 4–5 sao (Điểm trung bình: **4,13 / 5,0**).
- **66,7% (10/15)** yêu cầu công cụ kiểm tra ngữ pháp và giải thích chi tiết lỗi sai khi viết câu.
- **80,0%** người học có mục tiêu phục vụ công việc và giao tiếp thực tế; **73,3%** ưu tiên định dạng bài tập điền từ và trắc nghiệm.

## 1.3. Kết quả nghiên cứu người dùng

| Nhóm nhu cầu quan sát | Tỷ lệ khảo sát / Tần suất | Ý nghĩa đối với thiết kế hệ thống Lingora |
|---|---|---|
| Quên từ vựng nhanh chóng | 100% khảo sát (6/6 phỏng vấn) | Xây dựng kho từ vựng theo bài và thuật toán ôn tập SRS (UC-02, UC-05) |
| Cần lịch nhắc nhở ôn tập tự động | 80,0% đánh giá 4-5 sao (4,13/5) | Tự động tính toán khoảng cách ôn tập theo thuật toán SM-2 (UC-05, UC-08) |
| Đứt gãy thói quen, mất động lực | 86,7% khảo sát (5/6 phỏng vấn) | Thiết lập chuỗi Streak, mục tiêu ngày và huy hiệu thành tích (UC-07, UC-10) |
| Cần định vị trình độ bài học | 93,3% mong muốn đề xuất nội dung | Xây dựng bài kiểm tra đầu vào Placement Test (UC-09) |
| Cần sửa lỗi ngữ pháp câu viết | 66,7% khảo sát (6/6 phỏng vấn) | Tích hợp mô-đun kiểm tra ngữ pháp nội bộ sửa lỗi câu viết theo tình huống (UC-06) |
| Bài tập tương tác đa dạng | 73,3% điền từ, 60% trắc nghiệm | Thiết kế engine bài tập tương tác đa dạng dạng thức (UC-03) |

## 1.5. Phạm vi, Stakeholder và Actor hệ thống

Phạm vi chính thức của hệ thống bao gồm đầy đủ **10 Use Cases (UC-01 đến UC-10)**.

Hệ thống xác định rõ **2 Actor ngoài hệ thống** duy nhất:
1. **Learner (Học viên):** Tương tác học bài học, làm bài tập tương tác, ôn tập từ vựng SRS, luyện viết câu theo tình huống kịch bản, làm bài kiểm tra đầu vào và nhận huy hiệu thành tích.
2. **Admin (Quản trị viên):** Quản trị danh mục khóa học, bài học, từ vựng, ngân hàng câu hỏi bài tập và xuất bản kịch bản luyện viết.

*Lưu ý về ranh giới hệ thống:*
- **Mô-đun kiểm tra ngữ pháp nội bộ:** Là thành phần xử lý thuật toán nội bộ của hệ thống Lingora (Internal Component), không phải Actor ngoài hệ thống.
- **Supabase:** Là nền tảng hạ tầng cung cấp dịch vụ Database, Auth, Storage và RPC, nằm trong ranh giới tin cậy phía Backend.

## 1.6. Danh mục Yêu cầu Chức năng (10 Use Cases)

| Mã yêu cầu | Use Case | Tên chức năng | Trạng thái phạm vi |
|---|---|---|---|
| P1-FR-001 | UC-01 | Xác thực và Quản lý phiên an toàn (Sign In, Sign Up, Session) | In Scope / Active |
| P1-FR-002 | UC-02 | Khám phá và Học bài học theo lộ trình (Lesson & Vocab) | In Scope / Active |
| P1-FR-003 | UC-03 | Làm bài tập tương tác và Đánh giá kết quả (Exercise Engine) | In Scope / Active |
| P1-FR-004 | UC-04 | Quản trị nội dung và Xuất bản học liệu (Admin CMS) | In Scope / Active |
| P1-FR-005 | UC-05 | Ôn tập từ vựng ngắt quãng bằng thuật toán SRS (Spaced Repetition) | In Scope / Active |
| P1-FR-006 | UC-06 | Luyện viết tình huống và kiểm tra ngữ pháp | In Scope / Active |
| P1-FR-007 | UC-07 | Theo dõi tiến độ học tập, Chuỗi ngày học Streak và Mục tiêu ngày | In Scope / Active |
| P1-FR-008 | UC-08 | Nhắc nhở học tập thông minh trong ứng dụng | In Scope / Active |
| P1-FR-009 | UC-09 | Kiểm tra định vị trình độ đầu vào và Gợi ý cấp độ học (Placement Test) | In Scope / Active |
| P1-FR-010 | UC-10 | Hệ thống thành tích và Bộ sưu tập huy hiệu cá nhân | In Scope / Active |

## 1.7. Yêu cầu Phi chức năng

- **Bảo mật (Security):** Quản lý phiên bằng cookie `httpOnly` an toàn; mã hóa mật khẩu; kiểm soát phân quyền dữ liệu nghiêm ngặt ở cấp hàng (Row-Level Security - RLS) theo `auth.uid()`; bảo vệ quyền Admin phía server.
- **Hiệu năng & Phản hồi (Performance):** Tải nội dung bài học và Flashcard < 500ms; phản hồi kiểm tra bài tập tức thì; timeout xử lý Route Handler tối đa 8 giây.
- **Độ tin cậy & Sẵn sàng (Reliability):** Hệ thống sẵn sàng 24/7; các luồng học bài và ôn tập SRS hoạt động độc lập ngay cả khi mô-đun kiểm tra ngữ pháp gặp sự cố; xử lý lỗi an toàn và có trạng thái phục hồi (fallback).
- **Khả năng tiếp cận & Trải nghiệm (Usability & Accessibility):** Giao diện Responsive tối ưu trên mọi kích thước màn hình (Desktop, Tablet, Mobile); hỗ trợ phím tắt và đa ngôn ngữ (tiếng Việt & tiếng Anh).
- **Quyền riêng tư (Privacy):** Kết quả sửa lỗi ngữ pháp xử lý tạm thời (transient) bảo vệ quyền riêng tư; hệ thống huy hiệu cá nhân (Private by default) không áp lực bảng xếp hạng công khai.

## 1.8. User Story và Tiêu chuẩn Nghiệm thu Tiêu biểu

### US-01 - Xác thực và Quản lý phiên
- **User Story:** Là Learner hoặc Admin, tôi muốn đăng ký, đăng nhập và quản lý phiên an toàn để truy cập đúng các chức năng học tập hoặc quản trị tương ứng.
- **Acceptance Criteria:** Đăng nhập thành công thiết lập phiên qua httpOnly cookie; mật khẩu được băm an toàn; người dùng chưa đăng nhập bị chặn truy cập luồng học; đăng xuất xóa sạch phiên làm việc.
- **Trace:** `UC-01`.

### US-05 - Ôn tập từ vựng thuật toán ôn tập lặp lại ngắt quãng SRS
- **User Story:** Là Learner, tôi muốn xem danh sách các từ vựng đến hạn và thực hiện ôn tập để củng cố trí nhớ dài hạn mà không cần tự tính toán lịch học.
- **Acceptance Criteria:** Hệ thống chỉ tải các thẻ từ vựng thuộc chính người dùng thỏa mãn `next_review_at <= now()`; khi gửi kết quả đánh giá (Easy/Good/Hard/Again), gọi RPC `record_review` cập nhật nguyên tử trạng thái thẻ và ghi lịch sử `ReviewLog`; chỉ số Ease Factor và khoảng cách ôn tập cập nhật chính xác theo thuật toán SM-2.
- **Trace:** `UC-05`.

### US-06 - Luyện viết tình huống và kiểm tra ngữ pháp
- **User Story:** Là Learner, tôi muốn nhập câu tiếng Anh theo ngữ cảnh tình huống giao tiếp và nhận phản hồi sửa lỗi tức thì để cải thiện kỹ năng diễn đạt.
- **Acceptance Criteria:** Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi. Hỗ trợ tùy chọn nhập giọng nói qua Web Speech API; hiển thị vị trí lỗi sai trực quan (diff); hiển thị giải thích thân thiện và hỗ trợ phát âm câu sửa.
- **Trace:** `UC-06`.

### US-09 - Kiểm tra định vị trình độ đầu vào (Placement Test)
- **User Story:** Là Learner mới, tôi muốn làm bài kiểm tra ngắn gồm 15–20 câu hỏi đa kỹ năng để hệ thống tự động xác định trình độ CEFR (A1–B2) và phân bổ lộ trình học phù hợp.
- **Acceptance Criteria:** Ngân hàng câu hỏi phân bố đều các cấp độ; hệ thống tự động chấm điểm và xác định trình độ ngay khi hoàn thành; lưu kết quả vào hồ sơ và gợi ý bài học xuất phát tương ứng.
- **Trace:** `UC-09`.

### US-10 - Hệ thống thành tích và Huy hiệu cá nhân
- **User Story:** Là Learner, tôi muốn nhận huy hiệu khi đạt các mốc học tập (hoàn thành bài học đầu tiên, chuỗi Streak 7 ngày, ôn tập 50 từ vựng) để ghi nhận nỗ lực và duy trì động lực học.
- **Acceptance Criteria:** Hệ thống tự động kiểm tra điều kiện và mở khóa huy hiệu; hiển thị thông báo chúc mừng trực quan; bộ sưu tập huy hiệu được lưu trữ an toàn và hiển thị trang trọng trong trang cá nhân.
- **Trace:** `UC-10`.

# PHẦN II. PHÂN TÍCH HỆ THỐNG

## 2.1. Sơ đồ Phân cấp Chức năng (BFD)

Hệ thống Lingora được phân rã thành 8 nhóm chức năng hoàn chỉnh:
1. **Quản lý Xác thực và Phiên người dùng (UC-01):** Đăng ký, đăng nhập, đổi mật khẩu, quản lý hồ sơ và phân quyền người dùng.
2. **Quản lý Khóa học và Bài học (UC-02):** Danh mục khóa học theo trình độ, danh sách bài học, hiển thị từ vựng kèm audio phát âm chuẩn.
3. **Quản lý Bài tập tương tác (UC-03):** Trắc nghiệm, điền từ, sắp xếp câu, luyện nghe, chấm điểm và phản hồi tức thì.
4. **Quản trị Nội dung Học tập (UC-04):** CMS cho Admin tạo mới, chỉnh sửa, tải lên media và xuất bản khóa học, bài học, kịch bản.
5. **Hệ thống Ôn tập Ngắt quãng SRS (UC-05):** Thuật toán SM-2 tính toán chu kỳ ôn tập, danh sách thẻ đến hạn và ghi nhật ký ôn tập.
6. **Luyện viết Tình huống & Kiểm tra Ngữ pháp (UC-06):** Kịch bản giao tiếp tương tác, phân tích câu viết, gạch chân lỗi sai và gợi ý sửa.
7. **Theo dõi Tiến độ & Nhắc nhở Học tập (UC-07, UC-08):** Tính toán % hoàn thành, theo dõi chuỗi ngày Streak, đặt mục tiêu ngày và nhắc nhở học tập.
8. **Định vị Trình độ & Hệ thống Huy hiệu (UC-09, UC-10):** Đánh giá trình độ đầu vào Placement Test và bộ sưu tập huy hiệu thành tích.

**[CHÈN HÌNH: Sơ đồ Phân cấp Chức năng BFD]**

## 2.2. Mô hình Thực thể Liên kết (ERD)

Mô hình dữ liệu quan hệ của Lingora bao quát đầy đủ 10 Use Cases chính thức:
- **Baseline vật lý gồm 13 mô hình nghiệp vụ hoạt động:** `Language`, `Profile`, `Course`, `CourseTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `Exercise`, `LessonVocabulary`, `UserProgress`, `UserVocabSrs`, `ReviewLog`.
- **Mô hình dữ liệu hoạt động:** 15 thực thể phục vụ các luồng nghiệp vụ của Project 1.
- **Cấu trúc thực thể mở rộng:** `PlacementQuestion`, `PlacementResult`, `Badge`, `UserBadge` phục vụ trọn vẹn UC-09 và UC-10.

**[CHÈN HÌNH: `docs/plantuml/erd-baseline-and-proposed.puml`]**

## 2.3. Sơ đồ Mức Ngữ cảnh (Context DFD)

Sơ đồ ngữ cảnh thể hiện ranh giới hệ thống Lingora và luồng trao đổi dữ liệu với 2 tác nhân ngoài:
- **Learner:** Gửi thông tin đăng ký/đăng nhập, câu trả lời bài tập, đánh giá ôn tập SRS, câu viết theo tình huống kịch bản; Nhận nội dung bài học, kết quả đánh giá, danh sách thẻ từ vựng đến hạn, phản hồi sửa lỗi ngữ pháp, thống kê tiến độ và huy hiệu thành tích.
- **Admin:** Gửi thông tin quản lý khóa học, bài học, từ vựng, câu hỏi bài tập và xuất bản kịch bản; Nhận báo cáo trạng thái nội dung và thống kê xuất bản.

**[CHÈN HÌNH: `docs/plantuml/dfd-context.puml`]**

## 2.4. Biểu đồ Luồng Dữ liệu Mức Đỉnh (Level 0 DFD)

Biểu đồ Level 0 DFD mô hình hóa 7 tiến trình nghiệp vụ cốt lõi:
- **P1: Xác thực & Quản lý phiên:** Tiếp nhận thông tin đăng nhập, xác thực qua Auth Store và trả về phiên làm việc hợp lệ.
- **P2: Cung cấp Bài học & Từ vựng:** Đọc dữ liệu từ Course/Lesson/Vocab Store và hiển thị lộ trình học cho Learner.
- **P3: Xử lý Bài tập & Ghi nhận tiến độ:** Chấm điểm bài tập, cập nhật `user_progress` và trả về kết quả đánh giá.
- **P4: Quản lý Ôn tập SRS:** Lọc thẻ từ vựng đến hạn, tiếp nhận đánh giá và thực thi RPC cập nhật `user_vocab_srs` và `review_logs`.
- **P5: Luyện viết Tình huống & Kiểm tra Ngữ pháp:** Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi.
- **P6: Quản trị & Xuất bản Nội dung:** Tiếp nhận học liệu từ Admin, lưu trữ và kiểm soát trạng thái xuất bản (Published/Draft).
- **P7: Kiểm tra Trình độ & Cấp phát Huy hiệu:** Xử lý bài thi Placement Test và tự động cấp huy hiệu thành tích vào hồ sơ người học.

**[CHÈN HÌNH: `docs/plantuml/dfd-level-0.puml`]**

## 2.5. Biểu đồ Luồng Dữ liệu Mức Dưới Đỉnh

### 2.5.1. Luồng Học bài và Làm bài tập tương tác
Learner chọn bài học, học từ vựng kèm audio, thực hiện bài tập tương tác (MCQ, Fill-in-the-blank, Reorder); hệ thống kiểm tra đáp án, lưu tiến độ `user_progress` và cập nhật danh sách từ mới vào kho ôn tập cá nhân.
**[CHÈN HÌNH: `docs/plantuml/dfd-lesson-exercise.puml`]**

### 2.5.2. Luồng Ôn tập thuật toán ôn tập lặp lại ngắt quãng SRS
Hệ thống truy vấn các thẻ từ vựng có `next_review_at <= now()`; Learner lật thẻ và đánh giá mức độ ghi nhớ; RPC `record_review` thực hiện giao dịch nguyên tử cập nhật Ease Factor, Interval và ghi nhật ký `review_logs`.
**[CHÈN HÌNH: `docs/plantuml/dfd-srs.puml`]**

### 2.5.3. Luồng Luyện viết Câu và Kiểm tra Ngữ pháp
Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi kèm vị trí sai khác trực quan.
**[CHÈN HÌNH: `docs/plantuml/dfd-writing-grammar.puml`]**

## 2.6. Mô hình Use Case và Activity Diagrams

Hệ thống PlantUML gồm đầy đủ 32 sơ đồ kỹ thuật chuẩn hóa, trong đó có 10 sơ đồ Use Case chi tiết từ UC-01 đến UC-10:
- **Use Case Overview:** Thể hiện 2 Actor ngoài (`Learner`, `Admin`) và 10 Use Cases (`UC-01`..`UC-10`) với tên chuẩn tiếng Anh kỹ thuật.
- **Use Case chi tiết cho Learner & Admin:** Mô tả phân rã các hành vi học tập và quản trị.
- **Hệ thống Activity Diagrams:** Bao phủ chi tiết toàn bộ các luồng nghiệp vụ: Xác thực phiên, Học bài tập, Quản trị CMS, Ôn tập SRS, Luyện viết kiểm tra ngữ pháp, Tiến độ & Nhắc nhở, Bài test đầu vào và Huy hiệu thành tích.

**[CHÈN HÌNH: `docs/plantuml/use-case-overview.puml` và các sơ đồ Activity]**

## 2.7. Xác minh Yêu cầu theo Chuẩn IEEE 830

Toàn bộ tài liệu yêu cầu được thẩm định theo 5 tiêu chuẩn kỹ nghệ phần mềm:
1. **Tính đúng đắn (Correctness):** Mọi chức năng đều phản ánh chính xác từ dữ liệu khảo sát thực tế và các quyết định kiến trúc được phê duyệt.
2. **Tính đầy đủ (Completeness):** Bao quát trọn vẹn 10 Use Cases với đầy đủ User Stories, Acceptance Criteria, ràng buộc dữ liệu và xử lý ngoại lệ.
3. **Tính nhất quán (Consistency):** Thuật ngữ, mã định danh, vai trò tác nhân và luồng dữ liệu đồng nhất 100% giữa tài liệu báo cáo, sơ đồ PlantUML và slide thuyết trình.
4. **Tính khả thi (Feasibility):** Kiến trúc công nghệ hiện đại (Next.js 14, Supabase PostgreSQL RLS, FastAPI) đáp ứng hoàn toàn yêu cầu vận hành.
5. **Khả năng kiểm thử (Verifiability):** 100% tiêu chuẩn nghiệm thu (AC) có kịch bản kiểm thử và tiêu chí đo lường rõ ràng.

## 2.8. Ma trận Truy vết Yêu cầu

Hệ thống duy trì chuỗi truy vết liên tục từ đầu vào đến kiểm thử nghiệm thu:
`Nhu cầu Khảo sát -> User Story -> Use Case (10) -> Yêu cầu Chức năng (FR) -> Sơ đồ DFD/ERD -> Kịch bản Kiểm thử -> Báo cáo Nghiệm thu`.

# PHẦN III. THIẾT KẾ HỆ THỐNG

## 3.1.

# PHẦN IV.

# PHỤ LỤC A. BIÊN BẢN PHỎNG VẤN VÀ DỮ LIỆU KHẢO SÁT

**[ĐÍNH KÈM TOÀN BỘ BIÊN BẢN PHỎNG VẤN 6 NGƯỜI THAM GIA GỐC, 3 BẢN GHI MỞ RỘNG VÀ BẢNG THỐNG KÊ KHẢO SÁT N=15]**
