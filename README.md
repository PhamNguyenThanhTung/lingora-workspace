# Lingora

Dự án nền tảng học ngôn ngữ với ba vai trò: **Admin, Teacher, Learner**. Từ 2026-10-28, chuyển sang phát triển tính năng thực dụng theo [AGENTS.md](AGENTS.md): KISS, validation tại Backend, từng vertical slice Database Query → API Route → UI Component.

Chủ dự án đã hủy `WP-DB-REMAIN-01` cùng quy trình preapply/Stage A/Stage B. Các kế hoạch/review cũ được giữ làm lịch sử, không phải điều kiện bắt đầu code app. Đợt dọn dẹp tài liệu `DOC-CLEAN-01` đã hoàn tất theo [báo cáo dọn dẹp repository](docs/repository-cleanup-2026-10-28.md).

## Hiện trạng

- `lingora-admin/` chứa product Prisma schema (34 models), bốn migration đã áp dụng, seed, Prisma Client và module DB ở `src/server/db/index.js`.
- Chưa có ứng dụng web/Admin của thiết kế mới: chưa có web framework, API routes, UI, đăng nhập, lệnh `dev` hoặc `build`.
- Bốn migration up to date; Client đọc được ngôn ngữ/khóa học.
- Harness cũ vẫn parked. Các công cụ preflight/smoke cũ còn lưu trên đĩa là công cụ lịch sử, không phải cổng chặn bắt buộc khi phát triển tính năng.
- Đề xuất vertical slice tiếp theo: [Quản lý Ngôn ngữ](plans/2026-10-27-next-app-slice.md) (chưa bắt đầu).

## Database

Cấu hình kết nối ở `lingora-admin/.env` (không commit thông tin bí mật). Từ workspace root:

```sh
npm run db:product:generate
npm run db:product:migrate
npm run db:product:seed
```

Migrate dùng `prisma migrate deploy`; seed dùng `prisma db seed`, không chạy preflight/catalog/smoke tự động. Xem [hướng dẫn database](lingora-admin/prisma/product/README.md).

## Tài liệu

- [Báo cáo dọn dẹp repository](docs/repository-cleanup-2026-10-28.md)
- [Báo cáo reset thực dụng](docs/pragmatic-reset-2026-10-28.md)
- [Tác vụ hiện tại](plans/current-task.md)
- [Đề xuất slice tiếp theo](plans/2026-10-27-next-app-slice.md)
- [Handoff](HANDOFF.md)
- [Tài liệu sản phẩm](docs/README.md)
- [Môi trường](ENVIRONMENT.md)

Chỉ đọc tài liệu liên quan đến tính năng đang làm. Tài liệu thiết kế/báo cáo học thuật vẫn được giữ làm tài liệu tham khảo.
