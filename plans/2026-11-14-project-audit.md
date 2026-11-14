# Rà soát dự án Lingora — 14/11/2026

Baseline `30177a3` cùng thay đổi Studio, Sprint 3 và Sprint 4 đang có. Rà soát tại local tập trung vào Learner, Teacher/Admin, thư viện lesson-content, Prisma và runner kiểm thử. Giả định tải của MVP. Chưa đo tải sản xuất hay kiểm tra dịch vụ triển khai.

## Lỗi đã sửa

- Studio lưu bản sao nháp theo ID bài học. Trên trình duyệt dùng chung, tài khoản kế tiếp có quyền với bài đó có thể khôi phục nháp của tài khoản trước. Khóa mới gồm ID giáo viên và ID bài. Bản sao cũ thiếu định danh người tạo không được đưa vào UI khôi phục. Lỗi bộ nhớ trình duyệt khi dọn bản sao không đổi kết quả lưu đã được server chấp nhận.
- Trình duyệt chặn lưu bài có link nội bộ như `/review` dù quy tắc nội dung cho phép. Ô nhập giữ bàn phím URL và dùng validator chung. Test xác minh payload PATCH chứa link đã gắn.
- Test Admin và Learner có thể lấy Supabase URL hoặc key từ môi trường chạy, khiến cookie namespace hoặc provider giả lệch fixture. Cố định fixture ở harness liên quan. Test Framework chờ dữ liệu form, test landing xác minh focus đúng link desktop và test conflict Studio quan sát GET tải lại. Lệnh `test:all` của Admin build trước khi browser test chạy Next production.
- npm báo một advisory lan qua ba package của Prisma CLI. Override giới hạn ở `@prisma/config` lên `deepmerge-ts` 8.0.0. Prisma validate/generate, build, migration PostgreSQL và cài dependency từ lockfile đều đã được kiểm tra. [CVE-2026-40345](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)

## Kiểm tra

| Mục | Kết quả |
| --- | --- |
| Prisma validate/generate, cài dependency từ lockfile, build và typecheck | PASS |
| Feature tests của ba workspace | 805/805 |
| Component tests Admin và Learner | 123/123 và 65/65 |
| PostgreSQL dùng một lần | 148/148 ở các suite sample, Studio, audit, lessons, Practice, onboarding, SRS và gamification. Chạy thêm 30/30 ca comment/lifecycle Studio trên hai DB riêng. |
| Chromium local | PASS ở Admin E2E, Audit production smoke, landing, xác nhận PKCE synthetic, Core Learner, Onboarding và Sprint 4 |
| npm audit | 0 advisory trên dependency tree đã khóa |

E2E xác nhận email dùng provider synthetic trên loopback. Slice 12 public vẫn chưa nghiệm thu. Chưa áp migration lên DB triển khai. [Kế hoạch Sprint 5](2026-11-14-sprint-5-srs-v2-flashcards.md)
