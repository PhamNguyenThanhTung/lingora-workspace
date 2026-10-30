# Roadmap Lingora

Phát triển từng vertical slice Database Query → API Route → UI theo [AGENTS.md](../AGENTS.md).
Runtime hiện tại: Next.js App Router, React, TypeScript, Zod, Supabase Auth và product Prisma Client.
Giữ [Admin UI baseline](2026-10-28-admin-ui-baseline.md); không đưa test bypass vào production.

## Slice 1 ✅ — Admin Auth và Languages

- ACCEPTED ngày 2026-10-29; đăng nhập/đăng xuất staff và catalogue Languages đã hoạt động.
- Backend xác minh Supabase `getUser()` và Account hiện tại; chỉ ACTIVE ADMIN được quản trị catalogue.
- Mỗi page/API tự kiểm tra quyền; Teacher có holding view. Cookie refresh không thay thế authorization.
- `/languages`, `GET/POST /api/languages`, `PATCH/DELETE /api/languages/[id]`.
- Language code bất biến khi edit; tạo mới dùng regex `^[a-z0-9]{2,10}(-[a-z0-9]+)?$`, tổng dài 2–10.
- Validate names/booleans bằng Zod; merge locale, duplicate code409, FK-blocked delete409, absent404.
- JSON errors phân biệt401/403/503; same-origin cho mutation; không lộ Prisma/SQL/secret.
- UI giữ input khi lỗi, khóa thao tác pending, reconcile response thật và xử lý session loss/logout draft cleanup.
- Acceptance: feature74/74, components12/12, typecheck/build PASS; live CRUD/conflict/recovery/cleanup PASS.

## Slice 2 ✅ — Frameworks và Levels

- ACCEPTED ngày 2026-10-30; `/frameworks` và `/frameworks/[frameworkId]` đã hoạt động.
- Framework gồm code/version/names; unique `(code, version)`, không unique theo tên hay code đơn lẻ.
- Level thuộc Framework, code/label/position; position là số nguyên dương int32, không ép liên tục.
- Unique Level code và position theo parent; parent chỉ lấy từ URL, không cho chuyển qua payload.
- Framework API GET/POST và GET/PATCH/DELETE theo id; nested Level API GET/POST và PATCH/DELETE theo child id.
- Lookup/mutation child luôn scope bằng cả levelId và frameworkId; missing/mismatch404, conflict409.
- Framework/Level UUID dùng đủ 32 hex dạng `8-4-4-4-12`, không hạn chế version/variant; CEFR canonical được hỗ trợ.
- Áp dụng cùng auth/error/pending/retry/locale-merge contract của catalogue, count lấy từ dữ liệu thật.
- Acceptance tích hợp: feature155/155, components31/31, typecheck/build PASS; canonical navigation, live A–E và cleanup PASS.

## Slice 3 ⏳ — Chưa quyết định, chưa bắt đầu

Chủ dự án sẽ chọn scope tiếp theo. Chưa triển khai thêm Course/Unit/Lesson, learner flow, assessment hay SRS runtime.
Database, Admin Auth và UI baseline đã được chủ dự án chấp nhận làm nền tảng phát triển.
