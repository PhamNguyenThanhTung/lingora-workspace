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
- Chạy PostgreSQL integration suites: `npm run test:integration:lessons` (Slice 10 consumption concurrency), `npm run test:integration:practice` (Slice 11 practice concurrency) và `npm run test:integration:onboarding` (Slice 12 bootstrap/context lifecycle). Các lệnh này dùng runner cục bộ (`scripts/local-test-db.mjs`) khởi tạo PostgreSQL loopback tạm thời qua `embedded-postgres`, không yêu cầu database ngoài.

Default `test:integration:onboarding` còn có race khởi tạo fixture `en` giữa hai test file; đây là nợ test harness. Historical run tuần tự34/34 không đồng nghĩa default command PASS. Lệnh tuần tự và provenance của các gate được ghi trong [audit](plans/2026-11-04-takeover-audit.md).

## Tiến độ và tài liệu

Các Slice 1 đến Slice 11 đã ACCEPTED (Admin catalogue, Teacher authoring/submission, Admin review/publish, Assessment authoring, Learner auth/context, Lesson reading/consumption, Practice attempt/grading).
Slice 12 đã implement; repair và bản sửa callback provider-error đã được kiểm chứng. Audit 2026-11-04 xác nhận Learner/Staff READY ở `95816ab` (source callback `9b354c8`). Public activation/onboarding vẫn chưa ACCEPTED: provider đã trả `otp_expired` không có code; nguyên nhân khởi phát chưa xác định. Cần hoàn tất evidence cấu hình/provider và preflight trước đúng một lần thử mới, không suy đoán token đã bị scanner consume. Xem [audit](plans/2026-11-04-takeover-audit.md) và [bounded execution spec](plans/2026-11-04-slice-12-public-acceptance.md).
Xem [roadmap](plans/roadmap.md), [tài liệu](docs/README.md) và [quy tắc làm việc](AGENTS.md).
