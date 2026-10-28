# Lingora — Handoff

2026-10-28: Chủ dự án hủy `WP-DB-REMAIN-01` và quy trình preapply/Stage A/Stage B. Gói dọn dẹp tài liệu `DOC-CLEAN-01` đã hoàn tất (xem [báo cáo dọn dẹp](docs/repository-cleanup-2026-10-28.md)). Những kết luận review trước đây được giữ trong tài liệu lịch sử, không còn chặn việc bắt đầu code tính năng.

Bốn migration baseline/finalize/correction/remediation và `lingora-admin/prisma/product/schema.prisma` (34 models) giữ nguyên. Prisma Client generate thành công; database up to date với bốn migration. Client đọc được languages/courses. Chưa thực hiện migrate, seed hay thay đổi dữ liệu trong đợt dọn dẹp này.

Migrate/seed chạy qua Prisma CLI tiêu chuẩn. Preflight/catalog/smoke cũ còn trên đĩa là công cụ lịch sử, không phải cổng bắt buộc. Lưu ý các lưu vết đúng đắn dữ liệu (FDB-05 về immutability khi freeze lesson revision, FDB-06 về snapshot correspondence trong revision reviews) vẫn được ghi nhận trong báo cáo để xử lý trong nghiệp vụ tương ứng, không tạo gate chặn toàn cục. Tài nguyên harness test cũ vẫn parked.

Hiện admin có schema, seed, module truy cập DB (`src/server/db/index.js`); chưa có web framework, API routes, UI hay đăng nhập Admin.

Tác vụ hữu ích tiếp theo: [Đề xuất vertical slice Quản lý Ngôn ngữ](plans/2026-10-27-next-app-slice.md), bao gồm xác thực tối thiểu và kiểm tra quyền Admin tại Backend.

Làm theo [AGENTS.md](AGENTS.md).
