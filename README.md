# Lingora

Nền tảng học ngoại ngữ với ba vai trò: **Learner** học và ôn tập,
**Teacher** biên soạn nội dung được phân công, **Admin** quản trị và duyệt nội dung.
Ứng dụng hiện có trong workspace `lingora-admin/`.

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

## Tiến độ và tài liệu

Slice 1 (Admin Auth + Languages) và Slice 2 (Frameworks/Levels) đã ACCEPTED; Slice 3 chưa bắt đầu.
Xem [roadmap](plans/roadmap.md), [tài liệu](docs/README.md) và [quy tắc làm việc](AGENTS.md).
