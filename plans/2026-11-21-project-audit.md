# Audit dự án Lingora — 21/11/2026

Baseline `fcfaee1` (origin/main, commit cuối 18/11) cùng 37 thay đổi local chưa commit. Audit chỉ đọc. Lệnh đã chạy lại: `npm run typecheck` và `npm run test:feature`.

## 1. Tiến độ

| Miền | Trạng thái thực tế |
|---|---|
| Staff Slice 1–8 (catalogue, Teacher, assignment, revision, review/publish, Assessment authoring) | ACCEPTED, có public acceptance lịch sử |
| Learner Slice 9–11 (auth, đọc bài, Practice/grading) | ACCEPTED, có public acceptance lịch sử |
| Slice 12 — public signup | **NOT ACCEPTED** từ 04/11 (`flow_state_expired`). Đây là blocker lâu nhất (17 ngày). |
| Sprint 3–5 (onboarding, Home/path/gamification, Meaning SRS) | Chỉ TESTED local; chưa xác minh trên deployment |
| Sprint 6 (Writing SRS) | TESTED local, sau feature flag + allowlist; chưa rollout |
| Assessment Learner runtime (placement, level-up) | NOT STARTED |
| Release stabilization P0-A/B/C, P1 demo A1 | Đang làm, chưa commit |

Kiểm tra hôm nay:

- `typecheck` (3 workspace): **PASS**
- `test:feature`: Admin PASS hết. Learner **382/383, FAIL 1**: `home-timezone-semantics.test.mjs:88`. `computeQualifyingLocalDate(now, undefined)` không ném `RangeError` và lặng lẽ dùng timezone của máy chủ. Lỗi nằm ở `lingora-web/src/server/gamification/service.ts:33-34`: timezone không hợp lệ vẫn được truyền thẳng cho `Intl`. Đây là bug thật trong code chưa commit, không phải lỗi của test.

## 2. File thừa / rác

### Chỉ có ở local (đã gitignore), xóa an toàn được khoảng 3,6 GB

| Đường dẫn | Dung lượng | Ghi chú |
|---|---|---|
| `.wp00-runs/` (`pkg-g0-minimal`) | 1,5 GB | Thuộc quy trình WP đã hủy theo AGENTS.md |
| `.supabase-home/` | 1,5 GB | Cache của Supabase CLI. Chỉ xóa khi không chạy stack local |
| `lingora-admin/.next`, `lingora-web/.next` | 447 MB | Build cache, sẽ tự tạo lại |
| `tmp/` (`slice10–12`) | 66 MB | Log và script của các slice đã đóng |
| `.wp00-home/`, `.wp00-state/`, `.local-stack/` | 27 MB | Quy trình cũ |
| `lingora-admin/plans/evidence`, `lingora-web/plans/evidence` | 5,6 MB | Evidence nằm lạc trong thư mục app |

### Đang được track trong Git, nên dọn

- **74 file `plans/evidence/**` được track dù `.gitignore` có `**/evidence/`.** Quy tắc này mâu thuẫn với thực tế. Cần chọn một hướng: bỏ rule ignore, hoặc `git rm --cached` rồi lưu evidence ở nơi khác.
- **`plans/` có 154 file.** Khoảng 60 file là plan/verification/review của Slice 3–12 đã đóng. Chuyển vào `plans/archive/` sẽ dễ đọc hơn. Các file trùng lặp rõ ràng:
  - `slice-3-review.md` và `slice-3-verification.md`: đã được `slice-3-final-patch-*` thay thế.
  - Slice 12 có 9 plan cùng 6 verification cho cùng một blocker.
- **`plans/current-task.md`** dừng ở Slice 8 nên đã lỗi thời. `tasks/todo.md` chỉ chứa Sprint 6, cũng đã xong. Nên gộp lại thành một file trạng thái.
- **`logs/CHANGELOG.md`** không được cập nhật từ 30/10 (Slice 2). Nên cập nhật hoặc bỏ hẳn, để Git log và roadmap làm nguồn duy nhất.
- **Font Lato bị nhân 3 lần** (khoảng 1,9 MB) ở `docs/design/.../prototype/fonts`, `lingora-admin/public/fonts` và `lingora-web/public/fonts`.
- **Lịch sử Git có khoảng 15 bản pptx cũ** (v3…v13, 4–8 MB mỗi bản), làm pack nặng 165 MB. Không cần rewrite history. Từ nay chỉ nên commit bản cuối, hoặc dùng Git LFS cho `.pptx`/`.docx`.
- File khảo sát `.xlsx` ở thư mục gốc là dữ liệu ẩn danh (không có email), nên chuyển vào `docs/report/`.

## 3. Quy trình làm việc

Điểm mạnh:

- Kỷ luật kiểm thử rất cao: hơn 100 file test, PostgreSQL tạm qua `embedded-postgres`, E2E bằng Chromium, mutation controls, evidence gắn với SHA.
- Có ADR (`decision-log`, 45 quyết định) và phân cấp source-of-truth rõ ràng (spec 18/11).
- Commit message theo Conventional Commits và gọn.

Vấn đề:

1. **Chi phí quy trình lớn hơn tốc độ làm tính năng.** Khối lượng tài liệu (154 plan, 44 MB evidence) gần bằng khối lượng code (khoảng 74k dòng TS). Riêng Slice 12 đã tốn hơn 15 tài liệu mà vẫn bị chặn.
2. **Không có CI.** Không có `.github/workflows`, nên mọi gate đều chạy tay và test FAIL ở trên có thể bị bỏ sót khi commit.
3. **Không có lint/format** (ESLint/Prettier).
4. **Working tree đang trộn nhiều lane:** admin draft recovery (P0-C), Home timezone, auth registration, demo A1 và UI audit nằm chung 37 file chưa commit. Chính spec 18/11 yêu cầu tách lane theo SHA, nhưng thực tế chưa làm.
5. **README và roadmap khó đọc với người ngoài:** nhiều jargon nội bộ (Anti, Codex, Sol, residue0), lỗi dính chữ ("ngày05/11", "registration200"), trộn Anh/Việt. README nên mô tả sản phẩm và cách chạy. Lịch sử Slice 12 nên chuyển sang roadmap.
6. **Danh sách test hard-code trong `package.json`:** thêm file test mới phải nhớ sửa script, dễ sót. Nên dùng glob, ví dụ `node --test "tests/feature/*.test.mjs"`, và tách integration/E2E theo hậu tố tên file.

## 4. Đề xuất ưu tiên

| # | Việc | Lý do |
|---|---|---|
| 1 | Sửa bug timezone (`throw RangeError` khi `!norm.ok`) rồi chạy lại `test:feature` | Gate đang đỏ |
| 2 | Tách 37 thay đổi local thành các commit theo lane (P0-C, Home timezone, auth, demo A1) | Tránh mất việc, dễ review |
| 3 | Thêm GitHub Actions: `npm ci`, `typecheck`, `test:feature`, `test:components` | Bắt lỗi tự động |
| 4 | Dọn khoảng 3,6 GB rác local và archive các plan Slice 1–12 đã đóng | Repo gọn, dễ tìm tài liệu |
| 5 | Chốt Slice 12: quyết định PKCE cùng thiết bị hay chuyển sang `token_hash` (cross-device), rồi làm một lượt public | Blocker lâu nhất |
| 6 | Nghiệm thu Sprint 3–6 trên deployment (P0-A) | Hiện chỉ có kết quả local |
| 7 | Gộp `current-task.md`, `todo.md`, `CHANGELOG` thành một nguồn trạng thái, và viết lại README ngắn gọn | Giảm trùng lặp |
| 8 | Lên kế hoạch Assessment Learner runtime | Tính năng lớn còn thiếu |
