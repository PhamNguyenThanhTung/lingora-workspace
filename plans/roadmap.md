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

## Slice 3 ✅ — Courses và Units

- ACCEPTED ngày2026-10-30 sau [Final Acceptance Patch](slice-3-final-patch-verification.md); task trước đã FAIL/STOP, patch là task độc lập với correction1/1.
- `/courses` -> `/courses/[courseId]`; Course CRUD và nested Unit CRUD chỉ dành cho ACTIVE ADMIN, tái sử dụng auth/origin/UUID foundation.
- Course chỉ model target language, Framework và default-start Level thuộc Framework; instruction language chưa có trong schema, không có field giả.
- Unit thuộc Course/Level; position nguyên dương int32, unique(courseId,levelId,position); parent ownership và Framework scope được enforce ở server.
- Retry Level giữ input; dependency403 đóng modal/release inert để Logout usable; regression đi qua actual production-page props và callbacks.
- Feature196/196, components45/45, typecheck/build PASS;13 mutation controls KILLED, source restored byte-exact; canonical read-only/live A–E/fixture cleanup PASS.
- Không schema migration, không thay canonical data.

## Slice 4 ✅ — Teacher Accounts / Enable-Disable / Permissions

- ACCEPTED ngày2026-10-30; `/teachers`, Teacher-only GET/POST/PATCH APIs và `/activate-teacher` đã hoạt động.
- ACTIVE ADMIN quản lý Teachers; không mutate Admin/Learner/self, không role override hay PENDING enable shortcut.
- Provisioning server-only Auth create/invite + matching PENDING Account, durable ownership ledger, guarded compensation/recovery; không Admin password/token exposure.
- First-use xác minh confirmed Auth identity + READY Teacher ledger, user-scoped password update dưới Account lock rồi activate/audit; validation tối đa72 UTF-8 bytes theo provider.
- Disable chặn same valid session ở protected request tiếp theo; enable khôi phục quyền và giữ activatedAt. Không Auth ban/revoke.
- Codex tự review/fix và live acceptance; feature260/260, components60/60, typecheck/build PASS;6 controls A/B/C/C2/D/E KILLED, restore byte-exact.
- Live create/invite/activation/lifecycle/duplicate PASS; owned Auth/Account/provisioning residue0, giữ4 immutable audit events. Xem [verification](slice-4-verification.md).
- Không schema change, không canonical-account mutation; không bắt đầu Slice5.

## Slice 5 ✅ — Lesson Assignment / Draft / Revision Foundation

- ACCEPTED ngày2026-10-30; nested Unit Lessons page và `/my-lessons` list/detail dùng production wiring thật.
- Admin quản lý skeleton position/isRequired và assign/reassign ACTIVE Teacher; parent checks, Account/aggregate locking và rowVersion CAS enforce ở server.
- Teacher exact role/current ownership/ACTIVE only; mỗi Save append DRAFT LessonRevision với current episode, prior link và attribution, không mất bản cũ hoặc đổi publication pointer.
- Explicit Save, retained input/retry, authoritative DTO reconciliation, real stale-content reload, dependency recovery và401/403 Logout flow.
- Feature327/327, components87/87, typecheck/build PASS;6 semantic controls A–F KILLED và restore byte-exact. Codex sửa trực tiếp các finding sau Anti handoff; không correction round bắt buộc.
- Live Admin/Teacher/stale retry/revision/lifecycle PASS. Theo owner exception, giữ một bộ DEV riêng (Course inactive, Teacher DISABLED) với3 revisions; đóng session/browser, giữ immutable guards/canonical rows. Xem [verification](slice-5-verification.md).
- Không schema/migration, Exercise/Vocabulary/Media/review/publish hoặc Slice6 implementation.

## Slice 6 ✅ — Exercises / Vocabulary / Media Foundation

- ACCEPTED ngày2026-10-31; assigned Teacher draft page supports MCQ/FILL_BLANK/REORDER/LISTENING/GRAMMAR and global Vocabulary create/reuse/attach/detach.
- Strict per-type payloads, exact ACTIVE/ownership/parent/language checks, CAS and atomic successor revision snapshots; old content remains unchanged. Private grading data stays on authorized Teacher responses.
- LISTENING stores validated HTTPS references; uploads/managed media deferred for missing storage foundation. No schema/migration or review/publish/learner scope.
- Feature386/386, components106/106, typecheck/build PASS; A–G KILLED, byte-exact restore. Live exercise/vocabulary/retry/revision/lifecycle proof PASS; retained allowlisted DEV set, unexpected residue0, Teacher DISABLED/Course inactive. See [verification](slice-6-verification.md).
- No Slice7 implementation.
