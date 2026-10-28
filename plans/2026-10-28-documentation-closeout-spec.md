# Hoàn tất dọn tài liệu — 2026-10-28

**Trạng thái:** COMPLETE — Codex tự thực hiện và tự kiểm tra. Chủ dự án yêu cầu viết spec và Codex tự làm; không gọi Anti hoặc agent khác. Yêu cầu này thay cho giới hạn lượt sửa của đợt trước trong phạm vi dưới đây.

## Phạm vi

1. Sửa `docs/README.md` để mục lục/thẩm quyền không còn coi nền database là chưa triển khai hoặc yêu cầu duyệt thiết kế trước khi lập kế hoạch tính năng. Giữ các quyết định sản phẩm và đường dẫn đến báo cáo lịch sử.
2. Sửa phần kiểm tra liên kết trong `docs/repository-cleanup-2026-10-28.md`: bỏ các tổng số cũ không thể đối chiếu, nêu rõ log tạm đã mất và ghi kết quả kiểm tra mới với phạm vi cụ thể.
3. Cập nhật `plans/current-task.md` và trạng thái spec theo kết quả thực tế. Giữ nguyên hai báo cáo review FAIL cũ làm lịch sử; không đổi chúng thành PASS.

Không xóa thêm file, viết tính năng, đổi mã nguồn/cấu hình/migration/dữ liệu, chuẩn hóa log lịch sử, stage hay commit. Các thay đổi có sẵn của người dùng phải được giữ nguyên.

## Tiêu chí hoàn tất

- **C1:** Mục lục mô tả đúng product schema 34 models, 4 migration, seed/module DB; UI/API/đăng nhập chưa được xây dựng. Các bước duyệt năm 2026-10-11/12 chỉ là lịch sử, không còn chỉ dẫn thực thi hiện hành.
- **C2:** Kiểm tra mới đếm các liên kết Markdown nội bộ (file/thư mục và fragment) trên đúng 12 file: `README.md`, `HANDOFF.md`, `ENVIRONMENT.md`, `DESIGN.md`, `docs/README.md`, `docs/QUICK-REF.md`, `docs/design/physical/README.md`, `docs/design/physical/rebuild-plan.md`, `docs/design/physical/ftr-disposition-2026-10-22.md`, `docs/repository-cleanup-2026-10-28.md`, `plans/current-task.md` và spec này. Bỏ code block/inline code, URL ngoài và ảnh; mọi liên kết được đếm có một kết quả duy nhất. Ghi số kiểm tra/đạt/chưa giải quyết và giới hạn; không suy thành toàn repo hoặc kiểm tra DB.
- **C3:** Không còn tham chiếu điều hướng mới bị gãy trong phạm vi vừa sửa. Liên kết đến lịch sử vẫn hợp lệ; không cần sửa nội dung các báo cáo lịch sử.
- **C4:** `git diff --check` trên các file tracked vừa sửa và kiểm tra whitespace trên file mới đạt; `git ls-files --stage` trước/sau giống nhau. Không tuyên bố review độc lập hoặc chạy lại các kiểm tra bảo toàn của đợt trước.

## Cách thực hiện

Đọc trạng thái Git và hai lỗi còn lại → sửa mục lục/báo cáo → kiểm tra liên kết bằng Python chuẩn, chỉ đọc file → ghi kết quả mới → cập nhật current-task/spec → chạy lại kiểm tra trên bản cuối. Nếu có lỗi liên kết thực tế trong phần vừa sửa, sửa đúng đường dẫn; ghi rõ lỗi có sẵn nằm ngoài phạm vi.

## Kết quả

C1–C4 đã được tự kiểm tra: nội dung thẩm quyền cập nhật đúng hiện trạng; 12 file / 185 liên kết nội bộ hợp lệ / 0 gãy (3 fragment); whitespace trong phần vừa sửa đạt. Toàn bộ 1.175 entry chỉ mục khớp HEAD cộng đúng 47 lần chuyển scratch đã stage từ trước, gồm object ID/mode/stage. Số liệu từng file và giới hạn được ghi trong mục 6 của báo cáo dọn dẹp. Không có review độc lập mới hay kiểm thử DB/app trong lượt này.
