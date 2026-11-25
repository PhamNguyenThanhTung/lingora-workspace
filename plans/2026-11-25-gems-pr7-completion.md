# Hoàn thiện PR #7 — Kim cương 💎 (Phase 5, bản thu gọn)

Ngày: 2026-11-25 · Trạng thái: CHỜ DUYỆT · PR: https://github.com/PhamNguyenThanhTung/lingora-workspace/pull/7

## Phạm vi

Chỉ hoàn thiện và đưa lên production cơ chế kim cương đã có trong PR #7. **Không làm** tim/năng lượng,
đóng băng chuỗi ngày, bảng xếp hạng, linh vật (chủ dự án đã quyết định bỏ, 2026-11-25).

Luật thưởng (giữ nguyên):

| Sự kiện | Kim cương | Khi nào |
|---|---|---|
| `LESSON_COMPLETION` | +5 | Hoàn thành một bài lần đầu (làm lại = 0) |
| `DAILY_QUEST` | +5 | Hoàn thành nhiệm vụ "Hoàn thành 1 bài học" trong ngày |
| `PERFECT_PRACTICE` | +5 | Lần đầu hoàn thành bài và đúng hết ngay lượt đầu |

## Hiện trạng (đã kiểm tra 2026-11-25)

- Code đã xong: bảng `app.gem_events`, cộng kim cương trong cùng transaction với hoàn thành bài,
  chống cộng trùng (unique `learner_id, event_type, source_id`), hiển thị ở trang chủ và màn ăn mừng.
- CI của PR #7 xanh; PR merge được vào `main` (base đã đổi sang `main` sau khi #6 merge).
- Test tích hợp trên Postgres thật pass: bài đầu đúng hết = 15 kim cương, làm lại = 0,
  gửi trùng/đồng thời không cộng hai lần.
- Migration dùng đúng mẫu quyền của `app.xp_events` (REVOKE anon/authenticated + FORCE RLS). Server chạy
  bằng role `postgres` có BYPASSRLS nên đọc/ghi được, giống `xp_events` đang chạy trên production.
- Migration được áp **thủ công** (`prisma migrate deploy`), không tự chạy khi Vercel build.

## Rủi ro chính: thứ tự deploy

Nếu code #7 lên production **trước** migration:

- Trang chủ lỗi 503 (đọc tổng kim cương từ bảng chưa tồn tại).
- **Không học viên nào hoàn thành được bài**: lệnh ghi kim cương nằm trong transaction hoàn thành bài,
  lỗi làm rollback cả transaction.

Ngược lại, áp migration trước là an toàn: chỉ thêm bảng mới, code hiện tại trên production không đụng tới.
→ **Luôn áp migration trước, merge sau.** Không dùng bản Vercel preview của #7 để test trước khi áp
migration (preview có thể đang trỏ vào database production).

## Các bước

### Bước 1 — Bổ sung test giao diện (Claude, ~30 phút)

- `lingora-web/tests/feature/home-path-e2e.test.mjs`: kiểm tra `#totalGemsBadge` = 0 lúc đầu,
  `#celebrationGems` = "+15" sau bài đầu đúng hết, `#totalGemsBadge` = 15 khi quay lại trang chủ.
- Thêm `aria-hidden="true"` cho các icon emoji (🔥 ⚡ 💎) ở thanh thống kê để trình đọc màn hình chỉ đọc
  số và nhãn ("15 Kim cương").
- Đẩy lên nhánh `feat/gamify-phase5-gems`, chờ CI xanh.

### Bước 2 — Kiểm tra toàn bộ trên máy (Claude)

Trên bản `next build` mới (không dùng `.next` cũ):

```bash
npm run typecheck && npm run test:feature && npm run test:components -w lingora-web
node scripts/local-test-db.mjs npm run test:integration:gamification -w lingora-web
node scripts/local-test-db.mjs npm run test:e2e:gamification -w lingora-web
node scripts/local-test-db.mjs npm run test:e2e:learning -w lingora-web
```

### Bước 3 — Áp migration lên Supabase (chủ dự án chạy, hoặc cấp quyền cho Claude)

Từ thư mục `lingora-admin`, với `.env` trỏ tới Supabase project "lingnora":

```bash
npx prisma migrate status --schema prisma/product/schema.prisma
```

Kết quả mong đợi: còn đúng 1 migration chưa áp là `20261122010000_gem_events`. Nếu thấy migration khác
chưa áp → dừng lại, báo trước khi chạy tiếp.

```bash
npx prisma migrate deploy --schema prisma/product/schema.prisma
```

Chạy lại `migrate status` → "Database schema is up to date".

### Bước 4 — Merge #7

Merge commit (giống #1–#6), Vercel tự deploy `main`. Chỉ merge sau khi Bước 3 xong.

### Bước 5 — Nghiệm thu trên production

Với một tài khoản học viên (tài khoản cũ đã học bài 1 thì học bài 2):

- Trang chủ hiện ô 💎 (tài khoản cũ bắt đầu từ 0 — xem "Quyết định" bên dưới).
- Học xong một bài mới, đúng hết lần đầu → màn ăn mừng hiện "💎 +15"
  (+10 nếu đã làm nhiệm vụ ngày hôm đó, +5/+10 nếu có câu sai lượt đầu).
- Về trang chủ → tổng kim cương tăng đúng.
- Làm lại bài vừa học → không cộng thêm.
- Trang chủ không 503, hoàn thành bài không lỗi.

## Rollback

- Lỗi giao diện/logic: revert merge commit của #7 → Vercel deploy lại. Bảng `app.gem_events` để nguyên,
  vô hại với code cũ.
- Chỉ xóa bảng (`DROP TABLE app.gem_events;`) **sau khi** code đã được revert, nếu thật sự cần.

## Quyết định cần chốt (đề xuất mặc định)

1. **Không cộng bù** kim cương cho bài đã học trước đây — học viên cũ bắt đầu từ 0. (Cộng bù cần script
   riêng trên production, rủi ro hơn lợi ích.)
2. **Kim cương chỉ để hiển thị** trong đợt này, chưa có chỗ tiêu. Thêm "cửa hàng" là việc sau.

## Xong khi

- [ ] Bước 1–2: test mới pass, CI #7 xanh
- [ ] Bước 3: `migrate status` báo up to date trên Supabase
- [ ] Bước 4: #7 merged
- [ ] Bước 5: nghiệm thu production đạt cả 5 ý
