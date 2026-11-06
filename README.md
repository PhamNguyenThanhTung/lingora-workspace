# Lingora

Nền tảng học ngoại ngữ với ba vai trò: **Learner** học và ôn tập,
**Teacher** biên soạn nội dung được phân công, **Admin** quản trị và duyệt nội dung.
Mã nguồn gồm hai workspace: `lingora-admin/` (quản trị, biên soạn) và `lingora-web/` (học viên).

## Stack

Next.js 16, React 19, TypeScript, Zod, Prisma 6 và Supabase Auth/PostgreSQL.
Dùng Node.js 24 và npm workspaces; dependency được khóa trong `package-lock.json`.

## Chạy local

```sh
npm install
cp lingora-admin/.env.product.example lingora-admin/.env
# Điền cấu hình môi trường trước các lệnh truy cập database bên dưới.
npm run db:product:generate
npm run db:product:migrate
npm run db:product:seed
npm run dev
```

`DATABASE_URL` dùng cho Prisma runtime; `DIRECT_URL` dùng kết nối trực tiếp khi migrate.
Auth cần `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (hoặc `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
Không commit `.env`, database credentials, service-role key hay thông tin đăng nhập.

## Kiểm thử

- Chạy test tính năng và UI: `npm run test:feature`, `npm run test:components`, `npm run test:all`.
- Chạy PostgreSQL integration suites: `npm run test:integration:lessons` (Slice 10 consumption concurrency), `npm run test:integration:practice` (Slice 11 practice concurrency), `npm run test:integration:onboarding` (Slice 12 bootstrap/context lifecycle), `npm run test:integration:srs` (SRS concurrency) và `npm run test:e2e:learning` (Learning MVP end-to-end). Các lệnh này dùng runner cục bộ (`scripts/local-test-db.mjs`) khởi tạo PostgreSQL loopback tạm thời qua `embedded-postgres`, không yêu cầu database ngoài.
- Race khởi tạo fixture `en` trong `test:integration:onboarding` đã được xử lý bằng `ON CONFLICT DO NOTHING`; cả 2 lượt chạy liên tiếp trên cluster mới đều đạt 37/37 PASS với concurrency thực tế.

## Tiến độ và tài liệu

Core Learner MVP (P0–P7) cùng đợt hiệu chỉnh duy nhất (Correction Round 1) theo đánh giá Astra đã hoàn tất và vượt qua nghiệm thu local ngày 05/11 theo [kế hoạch](plans/2026-11-05-learning-mvp.md): kích hoạt bài học Admin, phục hồi LearningContext trình độ ban đầu, xem lại kết quả bài tập kèm lời giải thích ngữ liệu, ôn tập SRS từ vựng đến hạn (thuật toán 1, 3, 7, 14, 30 ngày) với idempotency giao dịch, đồng hồ fail-closed, layout mobile 390px chuẩn và bộ giáo trình mẫu A1. Toàn bộ 14 cổng kiểm thử, integration và E2E bằng Chromium trên loopback DB và synthetic auth provider đều PASS (exit code 0). Đăng ký/đăng nhập thật và level-up/assessment được bảo lưu hoãn lại theo phạm vi hợp đồng.

Trang nhật ký Admin chỉ đọc (`/audit-events`) đã qua kiểm chứng local ngày05/11: lọc/phân trang, quyền ACTIVE ADMIN và UI mobile PASS; chưa commit/deploy. Xem [plan](plans/2026-11-04-admin-audit-viewer.md) và [bằng chứng](plans/admin-audit-viewer-codex-verification-20261105.md). Đây là maintenance độc lập, chưa bao gồm toàn bộ báo cáo UC-14 và không thay đổi trạng thái Slice12.

Helper Slice12 đã sửa cửa sổ handoff PKCE ngày05/11:166 kiểm tra helper,2 kiểm tra runner URL/state/restart và41 regression đăng ký/callback PASS;5 negative controls bắt đúng lỗi. [Bằng chứng](plans/slice-12-pkce-handoff-verification-20261105.md). Chưa có lượt đăng ký/xác nhận thật mới; Slice12 vẫn NOT ACCEPTED, [lượt tiếp theo](plans/2026-11-05-slice-12-next-public-attempt.md) mới là đề xuất chờ cho phép riêng.

Các Slice 1 đến Slice 11 đã ACCEPTED (Admin catalogue, Teacher authoring/submission, Admin review/publish, Assessment authoring, Learner auth/context, Lesson reading/consumption, Practice attempt/grading).
Slice 12 đã implement; helper được sửa tại `137f246`, follow-up checkpoint `a795a4e` có 146/146 test offline PASS. Lần public acceptance 04/11 trên Learner/Staff READY đúng SHA đó: registration200, provider verify303 và callback có code, nhưng login không có `confirmed=1`. Cleanup/đối soát độc lập PASS, residue0; Slice12 vẫn **NOT ACCEPTED**, Slice13 chưa mở. Xem [kết quả lần thử](plans/slice-12-public-acceptance-20261104.md), [audit lịch sử](plans/2026-11-04-takeover-audit.md) và [execution spec](plans/2026-11-04-slice-12-public-acceptance.md).
Callback hiện có [diagnostic an toàn và fix no-store](plans/2026-11-04-slice-12-callback-diagnostics.md) tại `c7b8e40`; 202/202 feature tests, typecheck và Next/Chromium local PASS. Lượt instrumented được cho phép riêng tại `c279720` đã bắt lỗi thật `flow_state_expired` (HTTP422, có verifier cookie) sau khoảng25 phút. Email OTP TTL một giờ không bảo đảm PKCE còn hạn; hướng dẫn trước đó bỏ sót điểm này. Cleanup/đối soát độc lập PASS, residue0. Hai lượt đã được phép đều kết thúc; dừng, Slice12 **NOT ACCEPTED**. Xem [bằng chứng mới](plans/slice-12-instrumented-acceptance-20261104.md).
Xem [roadmap](plans/roadmap.md), [tài liệu](docs/README.md) và [quy tắc làm việc](AGENTS.md).
