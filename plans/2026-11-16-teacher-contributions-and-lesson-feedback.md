# Phân công bài cho giáo viên, hồ sơ và đánh giá bài học

## Luồng nghiệp vụ

- Chỉ Admin tạo khung bài và phân công. Vào **Khóa học → Đơn vị bài học → Quản lý bài học**, dùng **+ Thêm bài học** nếu cần khung mới, rồi chọn **Phân công**, chọn Teacher đang hoạt động và xác nhận.
- Teacher vào **Bài học được phân công**, mở bài được giao và soạn nội dung. **Lưu bản nháp** ghi một bản sửa đổi của bài đó. Mọi lần đọc, lưu và nộp từ Teacher Studio đều theo phân công hiện tại. Teacher xem phản hồi và chỉnh sửa, nộp lại trong cùng bài khi cần. [Quyền và phân công theo ADR-034](../logs/decision-log.md#adr-034--p0-d02-three-business-roles-and-content-responsibilities).
- Admin xem bản nộp trong hàng đợi, yêu cầu chỉnh sửa hoặc phê duyệt rồi xuất bản. Khi đổi giáo viên phụ trách, ghi lịch sử phân công và giữ tác giả của từng bản sửa đổi.
- `Account.displayName` phục vụ hồ sơ. `LessonRevision.createdBy` ghi tác giả của từng bản sửa đổi. Kế hoạch bổ sung trang tự chỉnh hồ sơ, tên tác giả và các bài đã xuất bản của giáo viên, cùng đánh giá chất lượng bài.

## Gói triển khai

| Gói | Phụ thuộc | Đầu ra và nghiệm thu |
| --- | --- | --- |
| 1. Kiểm tra Admin phân bài | — | Từ giao diện Admin, tạo khung bài và phân cho Teacher A. Kiểm tra trong `LessonsCatalog`, `LessonAssignModal` và API phân công. Bài chỉ xuất hiện trong `/my-lessons` của A. API tạo khung và phân công từ chối role Teacher, và Admin chỉ phân cho Teacher đang hoạt động. Tái hiện và sửa từng lỗi tìm được trên luồng hiện tại. |
| 2. Kiểm tra Teacher lưu và nộp | 1 | Dùng `LessonDraftEditor` và API hiện có. A mở bài được giao, lưu lần đầu, tải lại đúng nội dung và nộp thành công. Kiểm tra URL trực tiếp và API lưu/nộp khi chưa được giao hoặc đã bị đổi phân công. Kiểm tra lỗi phiên bản cũ khi lưu từ tab đã mở trước lúc phân công lại. |
| 3. Kiểm tra vòng duyệt | 2 | Từ `/review`, Admin yêu cầu chỉnh sửa. A thấy phản hồi trong bài được giao, cập nhật và nộp lại. Admin duyệt và xuất bản đúng bản nộp. Learner thấy bản đã xuất bản. Kiểm tra lịch sử tác giả, phân công và bản nộp khi đổi người phụ trách. |
| 4. Hồ sơ Teacher | — | Thêm lối vào hồ sơ từ Staff và cập nhật tên hiển thị của chính tài khoản Teacher. Kiểm tra dữ liệu không hợp lệ, tài khoản không hoạt động, chỉnh sửa trái quyền và tải lại giữ tên mới. |
| 5. Hồ sơ Learner | — | Thêm lối vào hồ sơ từ Home. Learner tự sửa tên hiển thị theo cùng quy tắc trường dữ liệu. Kiểm tra riêng auth của Learner, tải lại và trạng thái lỗi lưu. |
| 6. Hiện tác giả trong bài học | — | Đọc tên từ `LessonRevision.createdBy` của bản đang xuất bản. Kiểm tra đổi người phụ trách và tạo bản sửa đổi chưa xuất bản đều giữ đúng tác giả mà Learner đang thấy. Khi xuất bản bản mới, hiển thị tác giả của bản mới. |
| 7. Danh sách bài của tác giả | 6 | Từ tên tác giả, Learner mở danh sách bài đã xuất bản trong phạm vi được xem và mở từng bài qua quyền học hiện có. Kiểm tra bài bị rút, bài đã đổi tác giả, bài khóa và tác giả chưa có tên hiển thị. |
| 8. Gửi đánh giá bài học | — | Learner đã hoàn thành đúng bản học gửi hoặc cập nhật điểm 1–5. Kiểm tra tải lại giữ điểm, yêu cầu đồng thời chỉ lưu một lượt trên mỗi learner và bản sửa đổi, và yêu cầu từ người chưa hoàn thành hoặc bài bị rút bị từ chối. |
| 9. Hiện điểm tổng hợp | 8 | Trên bài đã xuất bản, hiển thị điểm trung bình và số lượt của bản hiện tại. Kiểm tra điểm thay đổi khi học viên cập nhật, và bản mới bắt đầu với số liệu riêng. |

Gói 1–3 ưu tiên theo thứ tự. Nghiệm thu trên PostgreSQL bằng `npm run test:integration:studio` và Chromium bằng `npm run build -w lingora-admin` rồi `npm run test:e2e:character-studio`. Bổ sung ca Chromium cho bước phân công và vòng yêu cầu chỉnh sửa nếu luồng hiện có chưa bao phủ. Gói 4 và 5 có thể làm độc lập. Gói 6–7 và 8–9 có thể chuẩn bị độc lập ở server. Điều phối lượt sửa trang chi tiết bài học vì cả hai dùng cùng màn hình.

V1 dùng tên hiển thị hiện có cho hai hồ sơ. Trường role, status và danh tính thuộc luồng quản trị. Learner chỉ thấy tên tác giả, danh sách và nội dung bài theo quyền học hiện tại. Đánh giá xác minh lần luyện đã hoàn thành cho đúng `LessonAttempt.lessonRevisionId`, vì `LessonCompletion` chỉ ghi lần hoàn thành đầu cho mỗi bài. Khi xuất bản bản mới, học viên có thể học bản mới và gửi đánh giá riêng cho bản đó. Kiểm tra gói 4–9 bằng feature test auth/route theo app và luồng trình duyệt từ điều hướng đến khi tải lại trang. Chạy `npm run typecheck` và `git diff --check` khi nghiệm thu các thay đổi code.

Gói 1–3 đã qua kiểm tra PostgreSQL và Chromium local. [Kết quả nghiệm thu](evidence/teacher-assignment-workflow/codex.md).

## Màn lắp ghép trong ảnh

- `AssessmentCatalog` tải `eligible-items` và `versions` riêng. Một lỗi 503 ở danh sách bài tập vẫn có thể đi cùng một phiên bản đã tạo trong danh sách phiên bản. Thông báo lỗi của dịch vụ là thông báo chung và cần HTTP response/log của môi trường xảy ra lỗi để biết nguyên nhân gốc.
- Kịch bản PostgreSQL disposable kiểm tra Admin phân bài, Teacher nộp một MCQ và một FILL_BLANK cùng Blueprint, Admin thấy đủ hai mục và lắp ghép được phiên bản. Lỗi 503 trong ảnh không tái hiện trong kịch bản này.
- Sửa giao diện để chỉ hiển thị trạng thái rỗng khi API tương ứng trả thành công với danh sách rỗng. Chromium xác nhận API bài tập trả 503 vẫn giữ phiên bản đã tạo, còn khi yêu cầu phiên bản mất kết nối thì bài tập tải thành công vẫn dùng được. Nút tải lại phục hồi cả hai danh sách. Suite giao diện 8/8.
- ADR-043 giao hệ thống lắp ghép, Admin duyệt và xuất bản. Màn hiện tại yêu cầu Admin tích từng câu. Đây là lệch hợp đồng riêng với lỗi tải danh sách. [Quyết định ADR-043](../logs/decision-log.md#adr-043--system-assembly-of-submitted-assessment-contributions).
