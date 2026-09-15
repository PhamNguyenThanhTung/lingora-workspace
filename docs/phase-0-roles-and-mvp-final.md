# Lingora Phase 0 — Vai trò, Quyền hạn và Phạm vi MVP

**Trạng thái:** FINAL FOR PHASE 0  
**Ngày chốt:** 2026-09-07  
**Nguồn đầu vào:** khảo sát mô phỏng theo F1–F14 và khảo sát hiện có N=15

## 1. Nguyên tắc phân quyền

1. Mặc định không có quyền nếu chưa được cấp rõ ràng.
2. Quyền được kiểm tra ở server và database, không chỉ ẩn nút trên giao diện.
3. Người dùng chỉ xem dữ liệu cá nhân hoặc phạm vi tổ chức được giao.
4. Người tạo nội dung không tự duyệt hoặc tự xuất bản nội dung của mình.
5. Hành động cấp quyền, duyệt, xuất bản, khóa tài khoản và xuất báo cáo phải có audit log.
6. Một tài khoản có thể có nhiều vai trò, nhưng mỗi hành động phải ghi nhận vai trò đang được sử dụng.
7. Organizational Manager là module tùy chọn, chỉ bật cho tổ chức có hợp đồng hoặc cấu hình cohort.

## 2. Vai trò cuối cùng

| Vai trò | Phạm vi | Trách nhiệm cuối cùng |
|---|---|---|
| Administrator | Toàn hệ thống | Vận hành hệ thống, tài khoản, quyền, cấu hình và báo cáo |
| Lesson Creator | Nội dung được giao | Tạo, chỉnh sửa, xem trước và gửi lesson để duyệt |
| Moderator | Hàng đợi kiểm duyệt | Kiểm tra độ chính xác, sư phạm, media và phê duyệt nội dung |
| Operations Staff | Hỗ trợ và giám sát | Hỗ trợ người dùng, xử lý sự cố và theo dõi hoạt động |
| Learner | Dữ liệu cá nhân | Học, làm exercise, xem tiến độ và quản lý mục tiêu/thời gian |
| Organizational Manager | Tổ chức/cohort được giao | Quản lý nhóm học viên, gán course và xem kết quả nhóm |

## 3. Ma trận quyền hạn

Ký hiệu: `M` quản lý, `C` tạo, `R` xem, `U` sửa, `A` phê duyệt, `X` không có quyền.

| Tài nguyên/Hành động | Admin | Lesson Creator | Moderator | Operations | Learner | Org Manager |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Tài khoản hệ thống | M | X | X | R giới hạn | U bản thân | R thành viên nhóm |
| Gán vai trò hệ thống | M | X | X | X | X | X |
| Ngôn ngữ, cấp độ, taxonomy | M | R | R | R | R | R |
| Course/Unit | M | C/U được giao | R/A | R | R đã xuất bản | R/gán cho nhóm |
| Lesson/Exercise | M | C/U được giao | R/A | R | R đã xuất bản | R đã xuất bản |
| Media bài học | M | C/U được giao | R/A | R | R đã xuất bản | R đã xuất bản |
| Xuất bản/thu hồi nội dung | M | X | A | X | X | X |
| Ticket hỗ trợ | M | R liên quan | R liên quan | M | C/R của mình | C/R của nhóm |
| Tiến độ cá nhân | R khi cần audit | X | X | R tối thiểu khi hỗ trợ | M bản thân | X |
| Báo cáo toàn hệ thống | M | R hiệu quả nội dung của mình | R chất lượng nội dung | R vận hành | X | X |
| Báo cáo cohort | M | X | X | R khi hỗ trợ | X | R/M nhóm được giao |
| Audit log | M | R hành động của mình | R hành động của mình | R phần vận hành | X | R hành động quản lý nhóm |

### Ranh giới dữ liệu quan trọng

- Administrator không được xem nội dung nhạy cảm của người học nếu báo cáo tổng hợp đã đủ cho mục đích vận hành.
- Operations Staff chỉ xem dữ liệu tối thiểu cần thiết để xử lý ticket.
- Organizational Manager xem tiến độ, điểm tổng hợp và trạng thái hoàn thành của thành viên thuộc cohort; không mặc định xem câu trả lời chi tiết, lịch sử cá nhân ngoài học tập hoặc dữ liệu của tổ chức khác.
- Lesson Creator xem số liệu hiệu quả của nội dung, không xem hồ sơ cá nhân đầy đủ của Learner.

## 4. Quy trình nội dung bắt buộc

`Draft → In Review → Changes Requested → Approved → Published → Archived`

| Chuyển trạng thái | Vai trò được phép |
|---|---|
| Tạo Draft | Lesson Creator, Administrator |
| Draft → In Review | Lesson Creator |
| In Review → Changes Requested | Moderator |
| In Review → Approved | Moderator |
| Approved → Published | Organizational Manager (hoặc Administrator khẩn cấp) |
| Published → Archived | Organizational Manager (khi xuất bản Revision v2), Administrator |

Người tạo lesson không được duyệt lesson do chính mình tạo. Trong nhóm nhỏ, Administrator có thể kiêm Moderator nhưng hệ thống phải ghi nhận hai hành động và lý do override.

## 5. Phạm vi MVP cuối cùng

### 5.1 Năm ngôn ngữ

MVP hỗ trợ cấu trúc và nội dung khởi đầu cho:

- English A1.
- Vietnamese A1.
- French A1.
- Chinese HSK 1.
- Japanese N5.

Phát hành theo từng đợt trong cùng MVP: English trước để kiểm chứng luồng, sau đó Vietnamese, French, Chinese và Japanese. Một ngôn ngữ chỉ được công bố là “available” khi có ít nhất một course khởi đầu đã qua kiểm duyệt; không hiển thị course rỗng cho Learner.

### 5.2 Danh mục chức năng

| ID | Chức năng MVP | Owner chính | Tiêu chí nghiệm thu tối thiểu |
|---|---|---|---|
| MVP-01 | Đăng ký, đăng nhập, đăng xuất và khôi phục phiên | Administrator | Learner tạo phiên hợp lệ; lỗi xác thực rõ ràng; logout kết thúc phiên |
| MVP-02 | Onboarding mục tiêu học | Learner | Chọn ngôn ngữ, cấp độ, mục tiêu, kỹ năng ưu tiên và thời lượng; có thể sửa sau |
| MVP-03 | Placement hoặc chọn cấp độ | Learner | Có thể bỏ qua test và chọn cấp độ; kết quả test tạo đề xuất có giải thích |
| MVP-04 | Lộ trình học | Lesson Creator | Hiển thị Course → Unit → Lesson, trạng thái khóa/mở và lesson tiếp theo |
| MVP-05 | Lesson ngắn | Lesson Creator | Lesson có mục tiêu, thời lượng 5–10 phút, nội dung và điều kiện hoàn thành |
| MVP-06 | Ba dạng exercise | Lesson Creator | MCQ, FILL_BLANK, REORDER chấm đúng/sai ổn định và không ghi tiến độ lặp |
| MVP-07 | Phản hồi tức thời | Moderator | Mỗi câu có kết quả, đáp án đúng và giải thích ngắn đã được duyệt |
| MVP-08 | Tiến độ học | Learner | Lưu lesson đang học, hoàn thành, điểm và lần hoạt động gần nhất |
| MVP-09 | Ôn tập nội dung yếu | Learner | Nội dung sai hoặc đến hạn xuất hiện trong review; hoàn thành review cập nhật lịch |
| MVP-10 | Daily goal và streak | Learner | Goal chỉnh được; một ngày chỉ tăng streak tối đa một lần; bỏ ngày xử lý theo quy tắc công bố |
| MVP-11 | Báo cáo cá nhân | Learner | Xem lesson hoàn thành, độ chính xác, thời gian học, streak và nội dung cần ôn |
| MVP-12 | Quản lý nội dung | Lesson Creator | Tạo/sửa/preview draft, thêm exercise/media và gửi duyệt |
| MVP-13 | Kiểm duyệt nội dung | Moderator | Review, yêu cầu sửa, phê duyệt/từ chối và lưu lý do |
| MVP-14 | Quản trị tài khoản và quyền | Administrator | Tạo/khóa tài khoản, gán/thu hồi role và lưu audit |
| MVP-15 | Báo cáo vận hành | Administrator | Lọc theo thời gian/ngôn ngữ/course; xem active users, completion, retention và content errors |
| MVP-16 | Hỗ trợ người dùng | Operations Staff | Tạo, phân công, cập nhật và đóng ticket; truy cập dữ liệu tối thiểu |
| MVP-17 | Quản lý cohort tùy chọn | Organizational Manager | Khi module bật: tạo nhóm, thêm thành viên, gán course và xem báo cáo tổng hợp |
| MVP-18 | Trạng thái trải nghiệm chuẩn | Mọi owner | Các màn chính có loading, empty, error và success; dùng được trên mobile và desktop |
| MVP-19 | Quyền riêng tư và audit | Administrator | Kiểm tra quyền ở server/data layer; hành động nhạy cảm có actor, thời gian và đối tượng |

## 6. Không thuộc MVP

- Leaderboard công khai.
- Tiền tệ ảo, cửa hàng và phần thưởng phức tạp.
- Hội thoại AI thời gian thực.
- Chấm phát âm tự động.
- Cá nhân hóa bằng mô hình học máy.
- Mạng xã hội, kết bạn hoặc nhắn tin giữa Learner.
- Ứng dụng mobile native riêng.
- Billing, subscription và marketplace.

Những chức năng này chỉ được đưa lại vào kế hoạch sau khi pilot chứng minh nhu cầu và vòng học cốt lõi đạt success metrics.

## 7. Thứ tự triển khai dần

1. Identity và Learner role.
2. English A1, lộ trình và lesson engine.
3. Tiến độ, review, daily goal và báo cáo cá nhân.
4. Lesson Creator và quy trình Draft/In Review.
5. Moderator, publish và quality controls.
6. Administrator, Operations Staff, reporting và audit.
7. Bốn ngôn ngữ còn lại theo cùng content template.
8. Organizational Manager nếu pilot có nhóm trường/doanh nghiệp.

Mỗi bước chỉ bắt đầu sau khi bước trước đáp ứng acceptance criteria liên quan. Chức năng đã xây dựng sớm được giữ ở trạng thái đóng băng nếu chưa đến bước triển khai của nó.

## 8. Quyết định đã chốt

- Sáu vai trò được chấp nhận, trong đó Organizational Manager là tùy chọn.
- Lesson Creator và Moderator là hai quyền riêng biệt.
- MVP gồm 19 chức năng có owner và acceptance criteria.
- Năm ngôn ngữ nằm trong phạm vi MVP nhưng phát hành nội dung theo từng đợt.
- English A1 là pilot đầu tiên, không phải ngôn ngữ duy nhất của MVP.
- Mọi chức năng ngoài mục 5 phải qua thay đổi yêu cầu mới.
