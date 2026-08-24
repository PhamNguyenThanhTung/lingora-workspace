# LINGORA - Báo cáo Phân tích Yêu cầu và Mô hình hóa

**Phiên bản:** 0.1.0
**Ngày:** 2026-08-23
**Phạm vi:** Project 1 / Software Engineering

> Tài liệu chuẩn hóa kỹ nghệ yêu cầu theo chuẩn IEEE 830, đồng bộ 10 Use Cases và 32 sơ đồ PlantUML.

## 1. Mục tiêu và phạm vi

LINGORA là nền tảng Web học tiếng Anh trực tuyến toàn diện gồm khóa học, bài học có cấu trúc, quản lý từ vựng, bài tập tương tác, thuật toán ôn tập ngắt quãng thuật toán ôn tập lặp lại ngắt quãng SRS, luyện viết theo tình huống kịch bản tích hợp mô-đun kiểm tra ngữ pháp nội bộ, theo dõi tiến độ, chuỗi ngày Streak, mục tiêu ngày, bài kiểm tra trình độ đầu vào (Placement Test) và hệ thống huy hiệu thành tích cá nhân.

### 1.1 Danh mục Use Case

| Mã | Tên Use Case | Actor chính | Trạng thái |
|---|---|---|---|
| UC-01 | Đăng ký, đăng nhập và quản lý phiên an toàn | Learner, Admin | In Scope / Active |
| UC-02 | Khám phá và học bài học theo lộ trình | Learner | In Scope / Active |
| UC-03 | Làm bài tập tương tác và đánh giá kết quả | Learner | In Scope / Active |
| UC-04 | Quản trị nội dung học tập và xuất bản | Admin | In Scope / Active |
| UC-05 | Ôn tập từ vựng ngắt quãng bằng thuật toán SRS | Learner | In Scope / Active |
| UC-06 | Luyện viết tình huống và kiểm tra ngữ pháp | Learner | In Scope / Active |
| UC-07 | Theo dõi tiến độ học tập, chuỗi Streak và mục tiêu ngày | Learner | In Scope / Active |
| UC-08 | Nhắc nhở học tập thông minh trong ứng dụng | Learner | In Scope / Active |
| UC-09 | Kiểm tra định vị trình độ đầu vào và gợi ý cấp độ | Learner | In Scope / Active |
| UC-10 | Hệ thống thành tích và bộ sưu tập huy hiệu cá nhân | Learner | In Scope / Active |

Toàn bộ 10 Use Cases (`UC-01`..`UC-10`) là các chức năng chính thức trong phạm vi hệ thống Lingora.

## 2. Thu thập yêu cầu

### 2.1 Nguồn và quy định

Tài liệu bài giảng Kỹ nghệ Yêu cầu quy định quy trình chuẩn gồm: xác định stakeholder; lập kế hoạch phỏng vấn và bảng hỏi; thu thập quy định/mẫu biểu; viết User Story và Acceptance Criteria; đặc tả Functional và Non-Functional Requirements; xây dựng mô hình Use Case, Activity, DFD các mức và ERD dữ liệu; xác minh yêu cầu; quản lý baseline và ma trận truy vết.

Nguồn dự án: `docs/00`-`docs/07`, `DESIGN.md` và `plans/current-task.md`. Chi tiết bằng chứng được lưu tại [evidence-register.md](evidence-register.md).

### 2.2 Stakeholders

| Stakeholder | Mối quan tâm |
|---|---|
| Learner | Học bài, làm bài tập, ôn tập SRS, sửa lỗi ngữ pháp, theo dõi tiến độ và nhận huy hiệu |
| Admin / Teacher | Tạo mới, chỉnh sửa, kiểm duyệt và xuất bản học liệu |
| Project Owner / Nhóm phát triển | Đảm bảo kiến trúc, chất lượng phần mềm và các mốc bàn giao |
| Supabase Services | Cung cấp dịch vụ Auth, RLS, PostgreSQL Data, RPC và Media Storage |
| Mô-đun kiểm tra ngữ pháp nội bộ | Thành phần xử lý ngữ pháp nội bộ nằm trong ranh giới hệ thống; không phải Actor ngoài |
| Giảng viên / Hội đồng đánh giá | Đánh giá quy trình phân tích, chất lượng kỹ nghệ yêu cầu và tính truy vết |

### 2.3 Phương pháp thu thập và Dữ liệu thực chứng

Áp dụng phương pháp phân tích tài liệu, User Stories, Use Cases, 6 cuộc phỏng vấn chuyên sâu gốc (P1–P6), 3 bản ghi phỏng vấn mở rộng bổ sung (IV-SUPP-01..03) và bộ dữ liệu khảo sát định lượng 24 chỉ số trên 15 người học.

### 2.4 Kết quả Khảo sát Định lượng (N=15)

Khảo sát định lượng ghi nhận các kết quả thực chứng:
- **100,0% (15/15)** người học từng quên từ đã học (53,3% rất thường xuyên).
- **93,3% (14/15)** mong muốn hệ thống tự động đề xuất nội dung cần học/ôn dựa trên kết quả trước đó.
- **86,7% (13/15)** từng học không đều hoặc bỏ học do thiếu phương pháp và mất động lực.
- **80,0% (12/15)** đánh giá tự động xác định từ và thời điểm ôn tập ở mức 4–5 sao (Điểm trung bình: **4,13 / 5,0**).
- **66,7% (10/15)** yêu cầu công cụ kiểm tra ngữ pháp và giải thích chi tiết lỗi sai khi viết câu.
- **80,0%** học vì mục tiêu công việc và giao tiếp; **73,3%** ưu tiên dạng bài tập điền từ.

## 3. User Story và Acceptance Criteria

### US-01 - Xác thực phiên an toàn
- **Story:** Với tư cách Learner hoặc Admin, tôi muốn đăng ký, đăng nhập, duy trì phiên và đăng xuất an toàn để truy cập đúng chức năng tương ứng.
- **Acceptance Criteria:** Thông tin hợp lệ tạo phiên qua httpOnly cookie; mật khẩu được băm an toàn; người dùng chưa xác thực bị từ chối truy cập luồng học; đăng xuất xóa sạch phiên làm việc.
- **Trace:** `UC-01`.

### US-02 - Khám phá và Học bài học
- **Story:** Với tư cách Learner, tôi muốn duyệt các khóa học/bài học đã xuất bản và học từ vựng kèm audio phát âm chuẩn theo lộ trình.
- **Acceptance Criteria:** Chỉ hiển thị nội dung đã xuất bản (`Published`); thứ tự bài học ổn định; audio phát âm chuẩn bản xứ; xử lý lỗi an toàn khi mất mạng.
- **Trace:** `UC-02`.

### US-03 - Làm bài tập tương tác
- **Story:** Với tư cách Learner, tôi muốn làm các bài tập trắc nghiệm, điền từ, sắp xếp câu và luyện nghe để củng cố kiến thức bài học.
- **Acceptance Criteria:** Dữ liệu bài nộp được validate đầy đủ; hiển thị phản hồi đúng/sai tức thì; mỗi lần hoàn thành bài tập cập nhật tiến độ `UserProgress` nguyên tử.
- **Trace:** `UC-03`.

### US-04 - Quản trị nội dung học tập (CMS)
- **Story:** Với tư cách Admin, tôi muốn tạo mới, chỉnh sửa, tải lên media và xuất bản khóa học, bài học, kịch bản để người học tiếp cận nội dung chuẩn.
- **Acceptance Criteria:** Chỉ tài khoản có quyền ADMIN mới được thao tác ghi; kiểm soát trạng thái xuất bản (Draft/Published); kiểm tra định dạng và kích thước media an toàn.
- **Trace:** `UC-04`.

### US-05 - Ôn tập từ vựng thuật toán ôn tập lặp lại ngắt quãng SRS
- **Story:** Với tư cách Learner, tôi muốn ôn tập các từ vựng đến hạn và gửi đánh giá ghi nhớ để hệ thống tự động cập nhật chu kỳ ôn tập tối ưu.
- **Acceptance Criteria:** Lọc thẻ từ vựng thuộc chính người dùng có `next_review_at <= now()`; gọi RPC `record_review` cập nhật đồng thời trạng thái thẻ và ghi `ReviewLog`; tính toán Ease Factor và Interval chính xác theo thuật toán SM-2.
- **Trace:** `UC-05`.

### US-06 - Luyện viết tình huống và kiểm tra ngữ pháp
- **Story:** Với tư cách Learner, tôi muốn nhập câu tiếng Anh theo kịch bản tình huống và nhận phản hồi sửa lỗi tức thì để nâng cao kỹ năng diễn đạt.
- **Acceptance Criteria:** Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi. Hỗ trợ tùy chọn nhập giọng nói qua Web Speech API; hiển thị vị trí lỗi sai trực quan (diff); hiển thị giải thích thân thiện và hỗ trợ phát âm câu sửa.
- **Trace:** `UC-06`.

### US-07 - Theo dõi tiến độ, Chuỗi Streak và Mục tiêu ngày
- **Story:** Với tư cách Learner, tôi muốn theo dõi tỷ lệ hoàn thành khóa học, chuỗi ngày học liên tục Streak và thiết lập mục tiêu học tập hằng ngày.
- **Acceptance Criteria:** Cập nhật trạng thái tiến độ; tính toán chuỗi Streak chuẩn xác theo múi giờ địa phương; thiết lập mục tiêu thời lượng học cá nhân.
- **Trace:** `UC-07`.

### US-08 - Nhắc nhở học tập trong ứng dụng
- **Story:** Với tư cách Learner, tôi muốn nhận thông báo nhắc nhở khi mở ứng dụng nếu chưa hoàn thành mục tiêu học trong ngày.
- **Acceptance Criteria:** Hiển thị nhắc nhở nhẹ nhàng trong giao diện ứng dụng khi mở trang; không gửi push ngoài ứng dụng; có thể đóng thông báo dễ dàng.
- **Trace:** `UC-08`.

### US-09 - Kiểm tra trình độ đầu vào (Placement Test)
- **Story:** Với tư cách Learner mới, tôi muốn làm bài kiểm tra ngắn gồm 15–20 câu hỏi đa kỹ năng để hệ thống tự động xác định trình độ CEFR (A1–B2) và phân bổ lộ trình học phù hợp.
- **Acceptance Criteria:** Ngân hàng câu hỏi phân bố đều các cấp độ; tự động chấm điểm và xác định trình độ ngay khi hoàn thành; lưu kết quả vào hồ sơ và gợi ý bài học xuất phát tương ứng.
- **Trace:** `UC-09`.

### US-10 - Hệ thống thành tích và Huy hiệu cá nhân
- **Story:** Với tư cách Learner, tôi muốn nhận huy hiệu khi đạt các mốc học tập (hoàn thành bài học đầu tiên, chuỗi Streak 7 ngày, ôn tập 50 từ vựng) để ghi nhận nỗ lực và duy trì động lực học.
- **Acceptance Criteria:** Tự động kiểm tra điều kiện và mở khóa huy hiệu; hiển thị thông báo chúc mừng; bộ sưu tập huy hiệu được lưu trữ an toàn và hiển thị trang trọng trong trang cá nhân.
- **Trace:** `UC-10`.

## 4. Đặc tả Yêu cầu Hệ thống

### 4.1 Bảng tóm tắt Use Case

| UC | Điều kiện tiên quyết | Luồng chính | Ngoại lệ / Fallback | Kết quả đạt được |
|---|---|---|---|---|
| UC-01 | Người dùng ở trang xác thực | Nhập thông tin -> Supabase Auth -> Thiết lập phiên an toàn | Sai thông tin; lỗi mạng | Đăng nhập thành công / Thông báo lỗi an toàn |
| UC-02 | Có bài học đã xuất bản | Duyệt khóa học -> Chọn bài -> Học từ vựng / Audio | Bài học rỗng / Lỗi tải media | Hiển thị bài học hoặc giao diện phục hồi |
| UC-03 | Bài học có câu hỏi bài tập | Tải danh sách bài tập -> Trả lời -> Chấm điểm | Lỗi nộp bài -> Cho phép thử lại | Điểm số và UserProgress được cập nhật |
| UC-04 | Admin đã đăng nhập | Quản trị học liệu -> Lưu -> Xuất bản | Không có quyền / Dữ liệu không hợp lệ | Cập nhật trạng thái nội dung thành công |
| UC-05 | Người học có từ vựng đến hạn | Lấy danh sách thẻ -> Ôn tập -> record_review | Lỗi kết nối -> Thử lại | Trạng thái thẻ và ReviewLog cập nhật nguyên tử |
| UC-06 | Kịch bản tình huống sẵn sàng | Người học nhập câu tiếng Anh -> Gọi mô-đun kiểm tra ngữ pháp -> Nhận kết quả | Lỗi xử lý -> Thông báo thân thiện | Nhận câu sửa và gạch chân vị trí lỗi |
| UC-07 | Người học có tài khoản | Truy vấn tiến độ -> Cập nhật mục tiêu / Streak | Trùng ngày -> Giữ nguyên streak | Tiến độ và chuỗi ngày học được cập nhật |
| UC-08 | Ứng dụng mở trong khung giờ | Kiểm tra hoạt động trong ngày -> Hiện nhắc nhở | Đã học -> Không hiện | Nhắc nhở hiển thị nhẹ nhàng |
| UC-09 | Người học mới bắt đầu | Tải bài test -> Làm bài -> Tự động xếp lớp CEFR | Chưa hoàn thành -> Lưu tạm / Bỏ qua | Gợi ý lộ trình khóa học phù hợp |
| UC-10 | Đạt mốc điều kiện học tập | Kiểm tra quy tắc -> Cấp huy hiệu -> Lưu UserBadge | Đã cấp -> Không cấp trùng | Huy hiệu xuất hiện trong bộ sưu tập |

### 4.2 Yêu cầu Phi chức năng (NFR)

- **Security:** Người học chỉ truy cập dữ liệu của chính mình thông qua RLS; quyền Admin được kiểm tra phía Server/Database; Route Handler trung gian bảo vệ backend.
- **Performance:** Tải bài học và Flashcard < 500ms; Route Handler timeout tối đa 8 giây.
- **Reliability:** Các luồng học bài và ôn tập SRS hoạt động độc lập ngay cả khi mô-đun kiểm tra ngữ pháp gặp sự cố; xử lý lỗi an toàn và có trạng thái phục hồi.
- **Usability:** Giao diện Responsive trên mọi thiết bị; đầy đủ trạng thái Loading/Empty/Error/Success.
- **Privacy:** Kết quả sửa lỗi ngữ pháp xử lý transient; hệ thống huy hiệu cá nhân (Private by default) không áp lực bảng xếp hạng công khai.

## 5. Danh mục 32 Sơ đồ PlantUML Chuẩn hóa

| STT | Tên sơ đồ | Tệp nguồn PlantUML (`docs/plantuml/`) |
|---|---|---|
| 1 | Sơ đồ Use Case Tổng quan | `use-case-overview.puml` |
| 2 | Sơ đồ Use Case Learner | `use-case-learner.puml` |
| 3 | Sơ đồ Use Case Admin | `use-case-admin.puml` |
| 4 | Sơ đồ Use Case UC-01 | `use-case-uc01.puml` |
| 5 | Sơ đồ Use Case UC-02 | `use-case-uc02.puml` |
| 6 | Sơ đồ Use Case UC-03 | `use-case-uc03.puml` |
| 7 | Sơ đồ Use Case UC-04 | `use-case-uc04.puml` |
| 8 | Sơ đồ Use Case UC-05 | `use-case-uc05.puml` |
| 9 | Sơ đồ Use Case UC-06 | `use-case-uc06.puml` |
| 10 | Sơ đồ Use Case UC-07 | `use-case-uc07.puml` |
| 11 | Sơ đồ Use Case UC-08 | `use-case-uc08.puml` |
| 12 | Sơ đồ Use Case UC-09 | `use-case-uc09.puml` |
| 13 | Sơ đồ Use Case UC-10 | `use-case-uc10.puml` |
| 4 | Activity Xác thực Phiên | `activity-auth-session.puml` |
| 5 | Activity Học bài & Làm bài | `activity-lesson-exercise.puml` |
| 6 | Activity Quản trị CMS | `activity-admin-content.puml` |
| 7 | Activity Ôn tập SRS | `activity-srs-review.puml` |
| 8 | Activity Luyện viết & Kiểm tra ngữ pháp | `activity-writing-grammar.puml` |
| 9 | Activity Tiến độ & Nhắc nhở | `activity-progress-reminder.puml` |
| 10 | Activity Placement Test | `activity-placement-test.puml` |
| 11 | Activity Achievements & Badges | `activity-achievements.puml` |
| 12 | Sequence Xác thực Phiên | `sequence-auth.puml` |
| 13 | Sequence Ôn tập SRS | `sequence-srs.puml` |
| 14 | Sequence Luyện viết & Kiểm tra ngữ pháp | `sequence-writing-grammar.puml` |
| 15 | Sequence Placement Test | `sequence-placement-test.puml` |
| 16 | Sequence Achievements & Badges | `sequence-achievements.puml` |
| 17 | DFD Sơ đồ Mức Ngữ cảnh | `dfd-context.puml` |
| 18 | DFD Biểu đồ Luồng Dữ liệu Mức Đỉnh | `dfd-level-0.puml` |
| 19 | DFD Chi tiết Học bài & Làm bài | `dfd-lesson-exercise.puml` |
| 20 | DFD Chi tiết Ôn tập SRS | `dfd-srs.puml` |
| 21 | DFD Chi tiết Luyện viết & Kiểm tra ngữ pháp | `dfd-writing-grammar.puml` |
| 22 | ERD Sơ đồ Thực thể Liên kết | `erd-baseline-and-proposed.puml` |

## 6. Xác minh và Ma trận Truy vết

Hệ thống thẩm định theo 5 tiêu chí chuẩn IEEE 830 (Đúng đắn, Đầy đủ, Nhất quán, Khả thi, Kiểm thử được). Chuỗi truy vết được duy trì xuyên suốt:
`Nhu cầu Khảo sát -> User Story -> Use Case (10) -> Yêu cầu Chức năng (FR) -> Sơ đồ DFD/ERD -> Tiêu chuẩn Nghiệm thu`.

## 7. Kết luận

Báo cáo hoàn thành toàn diện công tác phân tích, đặc tả và mô hình hóa hệ thống Lingora với 10 Use Cases hoàn chỉnh, 32 sơ đồ kỹ thuật chuẩn hóa, sẵn sàng cho các giai đoạn phát triển tiếp theo.
