# Lingora Product Database

Từ 2026-10-28: `WP-DB-REMAIN-01` đã hủy; không dùng preapply/Stage A/Stage B làm cổng chặn phát triển tính năng. Quy tắc hiện hành: [AGENTS.md](../../../AGENTS.md).

## Source

- `schema.prisma`: product schema (34 models), giữ nguyên trong đợt reset.
- `migrations/`: bốn migration `20261027000000_product_baseline`, `20261027010000_product_finalize`, `20261027020000_product_correction`, `20261027030000_product_remediation`; giữ nguyên các file đã áp dụng.
- `seed.mjs`: seed cấu hình và dữ liệu mẫu DEV; giữ transaction và kiểm tra xung đột dữ liệu, không phụ thuộc preflight/catalog.
- Client generate tại `lingora-admin/generated/product-client/` (git-ignored).

Migration local thứ 5 `20261028000000_product_remaining_repair` đã bị xóa theo yêu cầu chủ dự án. Không tự khôi phục/chạy lại gói sửa đó.

## Commands

Cấu hình `DATABASE_URL` và `DIRECT_URL` trong `lingora-admin/.env`; không commit credentials. Từ workspace root:

```sh
npm run db:product:validate
npm run db:product:generate
npm run db:product:migrate
npm run db:product:seed
```

Hai lệnh ghi dữ liệu trên dùng trực tiếp Prisma CLI tại admin workspace:

```sh
prisma migrate deploy --schema prisma/product/schema.prisma
prisma db seed --schema prisma/product/schema.prisma
```

Prisma CLI nạp `.env`; lệnh seed được cấu hình ở `lingora-admin/package.json`. Không tự động chạy preflight, catalog parity hoặc smoke. Những script cũ vẫn được giữ chờ chủ dự án xác nhận dọn dẹp; chúng tham chiếu migration thứ 5 nên không dùng làm kiểm tra trạng thái hiện hành.

Kiểm tra kết nối/lịch sử chỉ đọc từ thư mục `lingora-admin`:

```sh
npx prisma migrate status --schema prisma/product/schema.prisma
```

Ngày 2026-10-28: generate thành công, migrate status báo bốn migration up to date; Client đọc được 2 languages và 1 course. Chưa chạy migrate/seed trong đợt reset. Đây là kiểm tra kết nối, không phải chứng minh replay từ database sạch.

## Validation

Nghiệp vụ mới nằm ở Backend JS/TS với Zod/Prisma. Giữ FK/UNIQUE/NOT NULL/CHECK cơ bản và kiểm tra quyền truy cập. Các trigger cũ vẫn có hiệu lực; nếu đơn giản hóa, dùng migration mới cho từng nhóm đã chọn. Xem [báo cáo reset](../../../docs/pragmatic-reset-2026-10-28.md); chưa có migration DROP trigger nào được tạo.
