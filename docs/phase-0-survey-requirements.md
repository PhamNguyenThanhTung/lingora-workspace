# Lingora Phase 0 — Khảo sát và Chốt Yêu cầu

**Trạng thái:** DRAFT — baseline mới, chờ người dùng duyệt  
**Ngày:** 2026-09-07

Tài liệu này thay thế hiệu lực của các kế hoạch triển khai sớm đối với phạm vi thiết kế sản phẩm. Các tài liệu `approved/archive` vẫn được giữ nguyên như hồ sơ kiểm toán; chúng không còn là chỉ dẫn cho công việc mới.

## 1. Mục tiêu Phase 0

Phase 0 phải trả lời được sáu câu hỏi trước khi phát triển tiếp:

1. Ai là người dùng mục tiêu đầu tiên?
2. Họ học ngôn ngữ nào và bắt đầu ở cấp độ nào?
3. Họ cần đạt kết quả học tập cụ thể nào?
4. Ai tạo nội dung, ai duyệt nội dung và ai vận hành hệ thống?
5. Phiên bản MVP tối thiểu cần có những chức năng nào?
6. Dựa vào đâu để kết luận pilot thành công?

## 2. Nhóm người dùng cần khảo sát

| Nhóm | Giả thuyết nhu cầu | Cần xác minh |
|---|---|---|
| Người mới bắt đầu | Cần lộ trình rõ ràng, bài ngắn, phản hồi ngay | Mức độ chấp nhận bài 5–10 phút và placement test |
| Người học có nền tảng | Cần ôn tập có trọng tâm và nội dung khó hơn | Kỹ năng yếu, tần suất ôn và nhu cầu cá nhân hóa |
| Người học bận rộn | Cần học nhanh, tiếp tục đúng vị trí, nhắc học nhẹ nhàng | Thời lượng phiên học và khung giờ sử dụng |
| Người tạo bài học | Cần template, preview, versioning và quy trình duyệt | Thời gian tạo bài và tiêu chí chất lượng |
| Quản trị viên/vận hành | Cần quản lý tài khoản, nội dung, báo cáo và sự cố | Quy trình phân quyền, hỗ trợ và báo cáo bắt buộc |

## 2.1 Các yếu tố khảo sát bắt buộc

Mọi khảo sát thật hoặc mô phỏng phải xác định và đo riêng 14 yếu tố: động cơ học; ngôn ngữ/cấp độ; mục tiêu; thời gian/thói quen; khó khăn; phương pháp học; phản hồi/cá nhân hóa; động lực duy trì; theo dõi tiến bộ; trải nghiệm nội dung; quy trình tạo/duyệt bài; nhu cầu vận hành; học cá nhân/theo tổ chức; quyền riêng tư/an toàn.

Không được tạo một bảng kết quả tổng hợp trước khi hoàn thành phân tích riêng cho từng yếu tố. Chi tiết định nghĩa và câu hỏi đo được ghi tại [`phase-0-mock-survey-report.md`](phase-0-mock-survey-report.md).

## 3. Bộ câu hỏi khảo sát

### 3.1 Người học

- Mục tiêu chính khi học là gì: giao tiếp, công việc, du lịch, thi cử, học tập hay mục tiêu khác?
- Bạn đang học ngôn ngữ nào và tự đánh giá ở cấp độ nào?
- Bạn có thể học bao nhiêu ngày mỗi tuần và bao nhiêu phút mỗi lần?
- Bạn thường bỏ một ứng dụng học ngôn ngữ vì lý do nào?
- Bạn thích dạng bài nào: trắc nghiệm, điền từ, sắp xếp câu, nghe, nói, đọc, viết hay hội thoại?
- Bạn có muốn làm bài kiểm tra đầu vào để nhận lộ trình không?
- Bạn muốn xem những chỉ số tiến bộ nào?

### 3.2 Người tạo bài học

- Bài học hiện được tạo bằng quy trình nào?
- Các loại nội dung và bài tập bắt buộc là gì?
- Ai kiểm duyệt và ai có quyền xuất bản?
- Cần lưu phiên bản và lịch sử chỉnh sửa ở mức nào?
- Dữ liệu hiệu quả của bài học nào là cần thiết để cải thiện nội dung?

### 3.3 Quản trị viên và vận hành

- Cần những vai trò và quyền hạn nào?
- Ai quản lý tài khoản, khóa học, media và báo cáo?
- Những sự cố nào cần theo dõi hoặc chuyển cấp?
- Báo cáo nào cần xem hằng ngày, hằng tuần và hằng tháng?
- Có yêu cầu về dữ liệu cá nhân, lưu trữ, sao lưu hoặc xóa dữ liệu không?

## 4. Quyết định cần chốt

Các giá trị dưới đây là đề xuất để khảo sát xác nhận, chưa được coi là quyết định cuối cùng:

| Hạng mục | Đề xuất ban đầu |
|---|---|
| Ngôn ngữ học | English, Vietnamese, French, Chinese, Japanese |
| Giao diện | Tiếng Việt mặc định, hỗ trợ tiếng Anh |
| Cấp độ ban đầu | A1 cho English/Vietnamese/French; HSK 1 cho Chinese; N5 cho Japanese |
| Đối tượng MVP | Người học cá nhân mới bắt đầu và người học bận rộn; Organizational Manager chỉ bật cho trường/doanh nghiệp |
| Thời lượng bài | 5–10 phút |
| Mô hình học | Lộ trình theo unit, bài ngắn, luyện tập lặp lại, phản hồi ngay |
| Gamification MVP | Mục tiêu ngày, chuỗi ngày học, điểm hoàn thành cơ bản |
| Leaderboard | Tạm hoãn đến sau pilot |

Mục tiêu học tập được chọn và tùy chỉnh trong onboarding: giao tiếp, công việc, du lịch, thi chứng chỉ, nghe, nói, đọc, viết hoặc từ vựng theo chủ đề. Người học có thể thay đổi mục tiêu sau này; hệ thống dùng mục tiêu để đề xuất lộ trình và nội dung tiếp theo.

Ma trận quyền hạn và danh sách MVP đã chốt được quản lý trong [`phase-0-roles-and-mvp-final.md`](phase-0-roles-and-mvp-final.md). Đây là tài liệu chi tiết được ưu tiên khi chuyển Phase 0 sang triển khai.

## 5. MVP đề xuất

### Bắt buộc

- Đăng ký, đăng nhập và quản lý hồ sơ.
- Chọn mục tiêu, ngôn ngữ và cấp độ.
- Lộ trình khóa học gồm unit và lesson.
- Bài học ngắn với MCQ, FILL_BLANK và REORDER.
- Phản hồi ngay sau mỗi câu trả lời.
- Lưu tiến độ và trạng thái hoàn thành.
- Ôn lại nội dung trả lời sai hoặc đến hạn.
- Mục tiêu học hằng ngày và chuỗi ngày học.
- Báo cáo tiến độ cá nhân.
- Quản lý nội dung cơ bản cho Lesson Creator.
- Kiểm duyệt và xuất bản nội dung cho Administrator/Reviewer.
- Báo cáo vận hành cơ bản.

### Tạm hoãn

- Bảng xếp hạng công khai.
- Nhiều loại tiền tệ hoặc phần thưởng phức tạp.
- Hội thoại AI thời gian thực.
- Chấm phát âm nâng cao.
- Cá nhân hóa chương trình bằng mô hình học máy.
- Ứng dụng mobile riêng nếu web responsive chưa được pilot.

## 6. Vai trò và trách nhiệm

| Vai trò | Trách nhiệm |
|---|---|
| Administrator | Tài khoản, phân quyền, cấu hình, khóa học, báo cáo và vận hành |
| Lesson Creator | Tạo, sửa, xem trước và gửi bài để kiểm duyệt |
| Reviewer | Kiểm tra nội dung, sư phạm, media và phê duyệt |
| Operations/Support | Hỗ trợ người dùng, theo dõi hoạt động và xử lý sự cố |
| Learner | Học, làm bài, ôn tập và theo dõi tiến độ |
| Organizational Manager (optional) | Quản lý cohort, gán khóa học và xem báo cáo tổng hợp của tổ chức được giao; không có quyền quản trị toàn hệ thống |

## 7. Success metrics cho pilot

| Nhóm | Chỉ số | Mục tiêu đề xuất |
|---|---|---|
| Onboarding | Hoàn thành onboarding | ≥ 70% người đăng ký |
| Learning | Hoàn thành lesson đầu tiên | ≥ 60% người bắt đầu |
| Retention | Quay lại ngày 7 | ≥ 25% người dùng pilot |
| Habit | Hoàn thành mục tiêu ngày | ≥ 3 ngày/tuần ở người dùng hoạt động |
| Quality | Tỷ lệ lỗi blocker trong lesson | 0 lỗi blocker |
| Content ops | Thời gian tạo và duyệt lesson | Đo baseline, giảm qua mỗi vòng |
| Satisfaction | Đánh giá trải nghiệm sau pilot | ≥ 4/5 |

Các ngưỡng trên là giả thuyết để thiết kế pilot. Sau khảo sát và thử nghiệm nhỏ, nhóm phải ghi nhận giá trị chính thức cùng mẫu số, thời gian đo và cách tính.

## 8. Tiêu chí kết thúc Phase 0

Phase 0 chỉ được chuyển sang `APPROVED` khi:

- Có dữ liệu khảo sát được phân tách theo nhóm người dùng.
- Ngôn ngữ và cấp độ đầu tiên đã được xác nhận.
- Mục tiêu học tập có thể đo lường.
- Vai trò và quyền hạn có owner rõ ràng.
- MVP được phân loại Must/Should/Later.
- Success metrics có định nghĩa và nguồn dữ liệu.
- Các chức năng đã xây dựng sớm đã được phân loại xử lý.
- Người dùng phê duyệt baseline trước khi tiếp tục triển khai.

## 9. Bằng chứng khảo sát hiện có

Nguồn: `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`, 15 phản hồi. Đây là bằng chứng định hướng, chưa đủ để đại diện cho toàn bộ thị trường và vẫn cần khảo sát bổ sung theo từng target group.

- 13/15 người học tiếng Anh đơn ngữ hoặc kết hợp tiếng Anh, vì vậy tiếng Anh là lựa chọn hợp lý cho MVP nhưng cần ghi nhận 2 phản hồi tiếng Trung/Nhật để tránh khóa cứng chiến lược dài hạn.
- 15/15 người trả lời cho biết thường xuyên hoặc thỉnh thoảng quên từ đã học.
- 12/15 đánh giá mức 4–5 cho việc tự động xác định từ cần ôn và thời điểm ôn.
- 9/15 đánh giá mức 4–5 cho việc tăng tần suất xuất hiện của từ thường trả lời sai.
- 14/15 muốn hoặc có thể thử hệ thống tự đề xuất nội dung học/ôn theo kết quả trước đó.
- 12/15 chọn ít nhất một dạng bài trong nhóm trắc nghiệm, điền từ hoặc nghe; đây là cơ sở để ưu tiên các dạng bài ngắn trong MVP.
- 11/15 nêu nhu cầu theo dõi tiến độ ở ít nhất một khía cạnh như điểm, bài hoàn thành, thời gian hoặc tiến bộ theo thời gian.

Các tỷ lệ trên được dùng để ưu tiên giả thuyết sản phẩm, không được trình bày như tiêu chí thành công cuối cùng. Success metrics chính thức phải được xác nhận lại bằng pilot có phân nhóm người dùng và mẫu số rõ ràng.
