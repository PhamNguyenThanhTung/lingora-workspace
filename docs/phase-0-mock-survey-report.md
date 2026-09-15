# Lingora Phase 0 — Báo cáo khảo sát mô phỏng và định hướng thiết kế

**Trạng thái:** DRAFT — tài liệu mô phỏng để chốt yêu cầu ban đầu  
**Ngày:** 2026-09-07  
**Phạm vi:** 5 ngôn ngữ đầu tiên: English, Vietnamese, French, Chinese, Japanese

> **Lưu ý phương pháp:** Đây là báo cáo khảo sát mô phỏng. Các số liệu trong báo cáo là dữ liệu giả lập dùng để kiểm tra thiết kế và ưu tiên MVP, không được trình bày như kết quả khảo sát thị trường thật. File khảo sát 15 phản hồi hiện có được ghi riêng là bằng chứng tham khảo, không gộp vào mẫu mô phỏng.

## 1. Mục đích khảo sát

Khảo sát nhằm xác định:

- Nhóm người dùng đầu tiên và bối cảnh học.
- Lý do học và kết quả người học mong muốn.
- Thời lượng, thiết bị và tần suất học.
- Dạng bài tập và phản hồi được ưu tiên.
- Cơ chế duy trì hứng thú nhưng không làm lu mờ mục tiêu học.
- Nhu cầu quản lý nội dung, vận hành và báo cáo.

## 2. Xác định các yếu tố cần khảo sát

Trước khi tạo mẫu khảo sát, các yếu tố được tách thành các biến độc lập sau. Mỗi yếu tố phải được hỏi và phân tích riêng, không suy ra từ một câu hỏi tổng hợp.

| Mã | Yếu tố | Đối tượng chính | Cách đo riêng | Quyết định thiết kế có thể ảnh hưởng |
|---|---|---|---|---|
| F1 | Động cơ học | Learner | Lý do học, kết quả mong muốn, mức ưu tiên | Nội dung, mục tiêu và thông điệp onboarding |
| F2 | Ngôn ngữ và cấp độ | Learner, Administrator | Ngôn ngữ muốn học, trình độ tự đánh giá, placement | Phạm vi locale, course và lộ trình |
| F3 | Mục tiêu học tập | Learner | Giao tiếp, công việc, thi cử, du lịch, kỹ năng | Lộ trình và đề xuất lesson |
| F4 | Thời gian và thói quen | Learner | Số ngày/tuần, phút/phiên, khung giờ, thiết bị | Độ dài lesson, daily goal và reminder |
| F5 | Khó khăn học tập | Learner | Quên từ, nghe, nói, đọc, viết, ngữ pháp | Loại exercise và review |
| F6 | Phương pháp học ưa thích | Learner | Flashcard, ngữ cảnh, quiz, nghe, nói, viết | Thiết kế lesson và nội dung |
| F7 | Phản hồi và cá nhân hóa | Learner | Mức cần feedback, gợi ý, review từ yếu | Feedback loop và recommendation |
| F8 | Động lực duy trì | Learner | Streak, mục tiêu, huy hiệu, tiến bộ, cạnh tranh | Gamification và retention |
| F9 | Theo dõi tiến bộ | Learner, Organizational Manager | Điểm, bài hoàn thành, kỹ năng, thời gian | Dashboard và báo cáo |
| F10 | Trải nghiệm nội dung | Learner, Lesson Creator | Độ khó, độ dài, độ lặp, độ rõ hướng dẫn | Template và quality checklist |
| F11 | Quy trình tạo và duyệt bài | Lesson Creator, Moderator | Thời gian tạo, số vòng sửa, tiêu chí duyệt | Workflow và phân quyền |
| F12 | Nhu cầu vận hành | Administrator, Operations Staff | Ticket, sự cố, audit, báo cáo cần xem | Admin console và runbook |
| F13 | Học cá nhân hay theo tổ chức | Learner, Organizational Manager | Học cá nhân, lớp, cohort, doanh nghiệp | Bật/tắt Organizational Manager |
| F14 | Quyền riêng tư và an toàn | Tất cả nhóm | Dữ liệu được xem, chia sẻ, lưu trữ | RLS, visibility và audit |

### Nguyên tắc phân tích từng yếu tố

1. Mỗi yếu tố có ít nhất một câu hỏi định lượng và một câu hỏi mở.
2. Không dùng một tỷ lệ của F1 để kết luận cho F8 hoặc F10.
3. Kết quả phải được phân tách theo nhóm người dùng và ngôn ngữ.
4. Chỉ đưa yếu tố vào MVP khi có nhu cầu, owner và tiêu chí nghiệm thu rõ ràng.
5. Dữ liệu mô phỏng phải ghi rõ là giả định, không thay thế khảo sát thật.

## 3. Thiết kế mẫu mô phỏng

Mẫu giả lập gồm **120 người học**, **15 Lesson Creator**, **8 Moderator**, **5 nhân viên vận hành** và **6 quản lý tổ chức**. Người học được chia thành ba nhóm:

| Nhóm | Tỷ trọng mô phỏng | Đặc điểm |
|---|---:|---|
| Cá nhân mới bắt đầu | 50% | Cần hướng dẫn, bài ngắn và cảm giác tiến bộ sớm |
| Người học có nền tảng | 30% | Cần ôn tập theo điểm yếu và nội dung theo cấp độ |
| Người học bận rộn | 20% | Cần phiên học linh hoạt, tiếp tục nhanh và nhắc học nhẹ |

Kết quả dưới đây là **giả thuyết UX** để kiểm chứng bằng phỏng vấn và pilot thật.

## 4. Kết quả mô phỏng theo từng yếu tố

### F1 — Động cơ học

**Câu hỏi đo:** “Lý do quan trọng nhất khiến bạn học ngôn ngữ là gì?” và “Kết quả nào khiến bạn xem việc học là thành công?”

**Kết quả mô phỏng:** Công việc 38%, giao tiếp 27%, thi chứng chỉ 18%, du lịch 10%, giải trí 7%.

**Thiết kế:** Onboarding yêu cầu chọn một mục tiêu chính và tối đa hai mục tiêu phụ. Mỗi mục tiêu phải liên kết tới course hoặc skill cụ thể.

### F2 — Ngôn ngữ và cấp độ

**Câu hỏi đo:** “Bạn muốn học ngôn ngữ nào?” và “Bạn tự đánh giá cấp độ nào? Bạn có chấp nhận placement test không?”

**Kết quả mô phỏng:** 60% chọn English, 15% Vietnamese, 10% French, 8% Chinese, 7% Japanese; 68% chấp nhận placement test tùy chọn.

**Thiết kế:** Phát triển năm locale; English A1 là pilot ưu tiên. Cấp độ được lưu độc lập với ngôn ngữ để Chinese dùng HSK 1 và Japanese dùng N5.

### F3 — Mục tiêu học tập

**Câu hỏi đo:** “Bạn muốn cải thiện kỹ năng nào?” và “Bạn muốn đạt mục tiêu trong bao lâu?”

**Kết quả mô phỏng:** Nói 31%, từ vựng 24%, nghe 18%, viết 14%, đọc 13%.

**Thiết kế:** Learner có thể chọn kỹ năng ưu tiên, thời lượng mỗi ngày và mốc đánh giá. Mục tiêu có thể chỉnh sửa sau onboarding.

### F4 — Thời gian và thói quen

**Câu hỏi đo:** “Bạn học bao nhiêu phút mỗi phiên?” và “Bạn học bao nhiêu ngày mỗi tuần?”

**Kết quả mô phỏng:** 76% thích phiên 5–10 phút; 61% học 3–5 ngày/tuần; 54% dùng điện thoại là thiết bị chính.

**Thiết kế:** Lesson ngắn mặc định, lưu vị trí dang dở, daily goal có thể điều chỉnh và reminder chỉ là tùy chọn.

### F5 — Khó khăn học tập

**Câu hỏi đo:** “Khó khăn lớn nhất hiện nay là gì?” và “Bạn bỏ cuộc ở bước nào trong lesson?”

**Kết quả mô phỏng:** Quên từ 33%, thiếu thời gian 25%, nghe/nói 22%, ngữ pháp 12%, không thấy tiến bộ 8%.

**Thiết kế:** Ưu tiên review từ yếu, lesson có trạng thái tiến bộ rõ và exercise nghe/nói được mở rộng sau MVP.

### F6 — Phương pháp học ưa thích

**Câu hỏi đo:** “Bạn muốn dạng bài nào?” và “Dạng bài nào khiến bạn quay lại?”

**Kết quả mô phỏng:** Trắc nghiệm 72%, điền từ 64%, nghe 58%, sắp xếp câu 51%, viết 29%.

**Thiết kế:** MVP dùng MCQ, FILL_BLANK và REORDER; các dạng còn lại được kiểm chứng trong pilot.

### F7 — Phản hồi và cá nhân hóa

**Câu hỏi đo:** “Bạn cần giải thích ngay sau lỗi ở mức nào?” và “Bạn có muốn hệ thống tự đề xuất nội dung không?”

**Kết quả mô phỏng:** 88% muốn feedback ngay; 74% muốn tăng tần suất nội dung thường sai; 69% muốn đề xuất bài tiếp theo.

**Thiết kế:** Mỗi câu trả lời có kết quả và giải thích ngắn; hệ thống tạo danh sách review từ lỗi và tiến độ.

### F8 — Động lực duy trì

**Câu hỏi đo:** “Điều gì khiến bạn tiếp tục học?” và “Cơ chế nào khiến bạn thấy áp lực?”

**Kết quả mô phỏng:** Thấy tiến bộ 83%, mục tiêu ngày 66%, streak 52%, huy hiệu 41%; 64% không muốn leaderboard bắt buộc.

**Thiết kế:** Streak và daily goal nằm trong MVP; leaderboard chỉ opt-in hoặc tạm hoãn.

### F9 — Theo dõi tiến bộ

**Câu hỏi đo:** “Bạn muốn xem chỉ số nào?” và “Ai được xem báo cáo của bạn?”

**Kết quả mô phỏng:** Điểm/độ chính xác 79%, lesson hoàn thành 76%, kỹ năng yếu 71%, thời gian học 58%.

**Thiết kế:** Learner xem dữ liệu của mình; Organizational Manager chỉ xem tổng hợp cohort được giao.

### F10 — Trải nghiệm nội dung

**Câu hỏi đo:** “Lesson khó ở điểm nào?” và “Bạn gặp lặp lại nhàm chán ở dạng nào?”

**Kết quả mô phỏng:** 57% từng bỏ lesson vì lặp lại hoặc quá dài; 81% ưu tiên hướng dẫn ngắn và rõ.

**Thiết kế:** Template giới hạn độ dài, trộn exercise và bắt buộc preview trước khi gửi duyệt.

### F11 — Quy trình tạo và duyệt bài

**Câu hỏi đo:** “Một lesson mất bao lâu để tạo?” và “Lỗi nào thường bị phát hiện khi review?”

**Kết quả mô phỏng:** 15 Lesson Creator cần template chuẩn; 8 Moderator ưu tiên kiểm tra ngôn ngữ, đáp án, độ khó và media.

**Thiết kế:** `Draft → In Review → Changes Requested → Approved → Published`; Lesson Creator không tự xuất bản.

### F12 — Nhu cầu vận hành

**Câu hỏi đo:** “Báo cáo nào cần xem hằng ngày?” và “Sự cố nào cần chuyển cấp?”

**Kết quả mô phỏng:** Administrator ưu tiên user activity, completion, retention và content errors; Operations Staff ưu tiên ticket, login và lesson/media errors.

**Thiết kế:** Tách dashboard quản trị khỏi support queue; mọi hành động nhạy cảm có audit.

### F13 — Cá nhân hay tổ chức

**Câu hỏi đo:** “Bạn học một mình hay theo lớp?” và “Người quản lý cần xem gì?”

**Kết quả mô phỏng:** 70% học cá nhân, 20% lớp/trung tâm, 10% doanh nghiệp; nhu cầu cohort chỉ rõ ở nhóm tổ chức.

**Thiết kế:** Organizational Manager là module optional, không làm tăng độ phức tạp của luồng self-study.

### F14 — Quyền riêng tư và an toàn

**Câu hỏi đo:** “Dữ liệu nào không muốn chia sẻ?” và “Ai được xem kết quả?”

**Kết quả mô phỏng:** 82% muốn learner kiểm soát dữ liệu cá nhân; 100% yêu cầu Manager chỉ xem nhóm được giao.

**Thiết kế:** Phân quyền theo role và organization scope; không công khai điểm hoặc câu trả lời cá nhân.

## 5. Tổng hợp quyết định thiết kế

| Chủ đề | Kết quả mô phỏng | Quyết định thiết kế |
|---|---:|---|
| Muốn biết bài tiếp theo | 82% | Trang chính phải có một hành động học rõ ràng |
| Ưu tiên bài 5–10 phút | 76% | Lesson ngắn là mặc định; phiên dài là tùy chọn |
| Muốn nhận phản hồi ngay | 88% | Chấm và giải thích sau từng câu |
| Gặp vấn đề quên từ | 79% | Có ôn tập lặp lại và danh sách từ yếu |
| Muốn điều chỉnh mục tiêu | 71% | Mục tiêu học có thể thay đổi trong hồ sơ |
| Không thích bảng xếp hạng bắt buộc | 64% | Leaderboard không nằm trong MVP hoặc phải opt-in |
| Muốn xem tiến độ | 84% | Có báo cáo cá nhân theo lesson, kỹ năng và thời gian |
| Bỏ học vì nội dung lặp lại | 57% | Trộn dạng bài, ví dụ và ngữ cảnh |

## 6. Phạm vi ngôn ngữ giai đoạn đầu

Năm ngôn ngữ được chọn để phát triển đầu tiên:

| Mã | Ngôn ngữ | Cấp độ khởi đầu đề xuất | Ghi chú thiết kế |
|---|---|---|---|
| `en` | English | A1 | Ngôn ngữ pilot chính, ưu tiên dữ liệu và nội dung |
| `vi` | Vietnamese | A1 | Ngôn ngữ giao diện và một ngôn ngữ học đầu vào |
| `fr` | French | A1 | Cần chú ý giống, chia động từ và phát âm |
| `zh` | Chinese | HSK 1 tương đương A1 | Cần hỗ trợ pinyin, thanh điệu và chữ Hán theo từng bước |
| `ja` | Japanese | N5 tương đương A1 | Cần hiragana/katakana trước kanji và ngữ cảnh lịch sự |

CEFR được dùng làm khung tham chiếu chung cho English, Vietnamese và French. Chinese và Japanese cần ánh xạ riêng sang HSK/N5 nhưng vẫn dùng chung nguyên tắc: mục tiêu, kỹ năng, bài học, đánh giá và tiến độ. Nguồn tham chiếu CEFR: Council of Europe, *Common European Framework of Reference for Languages*.

## 7. Mục tiêu học tập có thể tùy chỉnh

Người học chọn mục tiêu khi onboarding và có thể thay đổi sau đó. Mục tiêu không chỉ là “học ngôn ngữ”, mà phải gắn với kết quả đo được.

### Nhóm mục tiêu

- Giao tiếp hằng ngày.
- Công việc.
- Du lịch.
- Thi chứng chỉ.
- Đọc hiểu.
- Nghe hiểu.
- Viết.
- Nói và phát âm.
- Từ vựng theo chủ đề.

### Cấu hình mục tiêu

Người học có thể chọn:

- Ngôn ngữ.
- Cấp độ hiện tại hoặc làm placement test.
- Cấp độ mong muốn.
- Kỹ năng ưu tiên.
- Chủ đề quan tâm.
- Số phút học mỗi ngày.
- Số ngày học mỗi tuần.
- Ngày dự kiến hoàn thành hoặc mốc đánh giá.

Hệ thống dùng cấu hình này để đề xuất lộ trình. Lesson Creator tạo nội dung theo mục tiêu; Moderator kiểm tra mục tiêu có thể đo lường; Administrator quản lý taxonomy và cấp độ.

## 8. Learning experience mô phỏng

Luồng chính:

> Onboarding → Placement/Chọn cấp độ → Chọn mục tiêu → Lộ trình → Lesson ngắn → Phản hồi → Ôn tập → Tiến độ → Bài tiếp theo

Thiết kế lấy cảm hứng từ các mẫu công khai của Duolingo: lộ trình theo unit, bài học ngắn, phản hồi tức thời, luyện tập lặp lại, mục tiêu ngày và streak. Đây là benchmark UX, không sao chép tài sản thương hiệu, nội dung hoặc triển khai độc quyền.

## 9. Vai trò và quyền hạn cuối cùng

| Vai trò | Trách nhiệm chính | Quyền hạn chính |
|---|---|---|
| **Administrator** | Vận hành hệ thống, tài khoản, quyền, cấu hình và báo cáo | Tạo/khóa tài khoản; cấp quyền; cấu hình ngôn ngữ, cấp độ, taxonomy; xem báo cáo toàn hệ thống; audit |
| **Lesson Creator** | Tạo, sửa và gửi lesson để duyệt | Tạo bản nháp; thêm exercise/media; xem trước; sửa bài của mình; gửi `In Review`; không tự xuất bản |
| **Moderator** | Kiểm tra nội dung, độ chính xác, sư phạm và phê duyệt | Xem bài chờ duyệt; yêu cầu chỉnh sửa; phê duyệt/từ chối; ghi nhận lý do; không quản trị tài khoản hệ thống |
| **Operations Staff** | Hỗ trợ người dùng, xử lý sự cố và theo dõi hoạt động | Xem trạng thái vận hành; quản lý ticket; gửi thông báo được duyệt; xem dữ liệu hỗ trợ tối thiểu; không sửa nội dung học thuật |
| **Learner** | Học, làm exercise, xem tiến độ và quản lý thời gian | Xem nội dung đã xuất bản; làm bài; ôn tập; chỉnh mục tiêu/ngôn ngữ/cài đặt cá nhân; xem dữ liệu của mình |
| **Organizational Manager** *(optional)* | Quản lý nhóm học viên và theo dõi kết quả nhóm | Tạo cohort; mời/gán học viên; gán khóa học; xem báo cáo tổng hợp của nhóm; không xem dữ liệu riêng tư ngoài phạm vi nhóm |

### Làm rõ Organizational Manager

Vai trò này chỉ cần bật khi sản phẩm phục vụ trường học, trung tâm hoặc doanh nghiệp. Với mô hình tự học cá nhân, vai trò này bị tắt và không xuất hiện trong giao diện.

Organizational Manager **không phải Administrator**. Họ chỉ được quản lý tổ chức/cohort được giao, không được:

- Cấp quyền Administrator hoặc Moderator.
- Thay đổi cấu hình toàn hệ thống.
- Sửa hoặc xuất bản lesson.
- Xem câu trả lời cá nhân hoặc dữ liệu ngoài tổ chức nếu không được cấp phép.

Nếu một người vừa là Administrator vừa là Organizational Manager, hệ thống vẫn phải ghi nhận hai quyền riêng biệt để audit rõ hành động.

## 10. MVP sau khảo sát mô phỏng

### Bắt buộc

- Onboarding với ngôn ngữ, cấp độ và mục tiêu tùy chỉnh.
- Năm ngôn ngữ với cấu trúc locale và nội dung có thể mở rộng.
- Course → Unit → Lesson → Exercise.
- Lesson ngắn và ba dạng exercise đầu tiên: trắc nghiệm, điền từ, sắp xếp câu.
- Phản hồi tức thời.
- Tiến độ lesson và báo cáo cá nhân.
- Ôn tập nội dung yếu hoặc đến hạn.
- Mục tiêu ngày và streak.
- Lesson Creator tạo bản nháp.
- Moderator duyệt nội dung.
- Administrator quản lý tài khoản, quyền và báo cáo.
- Operations Staff xử lý hỗ trợ và sự cố cơ bản.

### Sau pilot

- Organizational Manager và cohort nâng cao.
- Bảng xếp hạng opt-in.
- Nhiệm vụ, huy hiệu và phần thưởng mở rộng.
- Luyện nói/chấm phát âm.
- Hội thoại thời gian thực.
- Cá nhân hóa sâu bằng mô hình học máy.

## 11. Chỉ số thành công

| Chỉ số | Định nghĩa | Mục tiêu pilot đề xuất |
|---|---|---:|
| Onboarding completion | Người đăng ký hoàn thành onboarding / người đăng ký | ≥ 70% |
| First lesson completion | Người hoàn thành lesson đầu / người bắt đầu lesson | ≥ 60% |
| Day-7 retention | Người có hoạt động vào ngày 7 / cohort bắt đầu | ≥ 25% |
| Weekly learning habit | Số ngày học trung vị mỗi tuần của người hoạt động | ≥ 3 ngày |
| Lesson quality | Lesson không có lỗi blocker sau kiểm duyệt | 100% |
| Content turnaround | Thời gian từ draft đến approved | Theo dõi baseline, giảm qua mỗi vòng |
| Goal relevance | Người dùng đánh giá đề xuất phù hợp | ≥ 4/5 |
| Satisfaction | Điểm đánh giá sau pilot | ≥ 4/5 |

## 12. Nguồn tham chiếu trực tuyến

- Duolingo Research: <https://research.duolingo.com/> — các công bố và nghiên cứu về hiệu quả học tập, đánh giá và trải nghiệm.
- Duolingo Blog: <https://blog.duolingo.com/> — tham chiếu công khai về lesson ngắn, streak, lộ trình, review và thiết kế động lực.
- Council of Europe, CEFR: <https://www.coe.int/en/web/common-european-framework-reference-languages> — khung cấp độ và mô tả năng lực ngôn ngữ.
- HSK Chinese proficiency framework: <https://www.chinesetest.cn/> — tham chiếu cấp độ tiếng Trung.
- JLPT: <https://www.jlpt.jp/e/> — tham chiếu cấp độ tiếng Nhật N5–N1.

Các nguồn trên chỉ dùng để tham chiếu thiết kế và khung đánh giá. Không được coi chúng là dữ liệu khảo sát người dùng của Lingora.

## 13. Kết luận cần phê duyệt

Phase 0 có thể chuyển sang `APPROVED` sau khi xác nhận:

1. Năm ngôn ngữ trên là phạm vi phát triển đầu tiên.
2. English A1 là pilot ưu tiên; cấp độ các ngôn ngữ còn lại được hoàn thiện theo nội dung thực tế.
3. Mục tiêu học tập được chọn và tùy chỉnh bởi Learner.
4. Sáu vai trò và ranh giới quyền hạn được giữ như bảng trên.
5. Organizational Manager chỉ bật cho mô hình tổ chức.
6. MVP và success metrics được chấp nhận.
