# DOC-03 — Bảng Kiểm Kê Worktree & Đề Xuất Dọn Dẹp (`AWAITING_OWNER`)

Ngày kiểm kê: 2026-11-27 · Baseline `origin/main` = `9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd` · Luồng: **L4 — Chỉ đọc**.

> **Trạng thái: `AWAITING_OWNER` — Chưa xóa hoặc di chuyển bất kỳ worktree hay thư mục nào.**
> Chỉ thao tác sau khi chủ dự án duyệt danh sách cụ thể và kiểm tra lại `git status` ngay trước khi xóa.

## 1. Bảng 18 worktree hiện tại

| # | Worktree path | Branch | HEAD | Upstream | PR / Merge | Dirty (file thật / node_modules) | Commit riêng ngoài `origin/main` | Đề xuất |
|---|---|---|---|---|---|---|---|---|
| 1 | `/home/tung/workspace/school/project1/lingora-workspace` | `fix/review-comment-and-wrong-answer-hints` | `463af8b` | `origin/fix/...` | #10 `MERGED` | **77** (2 modified + 70 PNG + `docs/ui-audit/` + 3 plans + `scripts/journey*`) | 0 | **GIỮ** (workspace gốc chứa WIP chưa commit & tài liệu audit/plans) |
| 2 | `/home/tung/workspace/school/project1/lingora-admin-fix` | `fix/admin-authoring-labels` | `ca79cc4` | `origin/fix/...` | #23 `OPEN` | 0 | 1 (`ca79cc4`) | **GIỮ** (luồng L3 đang chạy) |
| 3 | `/home/tung/workspace/school/project1/lingora-lang` | `feat/lang-presentation-helpers` | `9dccaa8` | `origin/main` | Chưa có PR | 0 | 0 | **GIỮ** (luồng L5 mới tạo) |
| 4 | `/home/tung/workspace/school/project1/lingora-learner-fix` | `fix/learner-gating-numbering` | `5284d96` | `origin/fix/...` | #22 `OPEN` | 0 | 1 (`5284d96`) | **GIỮ** đến khi PR #22 được merge |
| 5 | `/home/tung/workspace/school/project1/lingora-onboarding-a11y` | `fix/onboarding-goal-a11y` | `d4df6f1` | `origin/fix/...` | #8 `OPEN` | 0 | 1 (`d4df6f1`) | **GIỮ** đến khi L2 gộp phần a11y vào #24 và đóng #8 |
| 6 | `/home/tung/workspace/school/project1/lingora-r2` | `docs/acceptance-round2-production` | `7ace3a1` | `origin/docs/...` | #21 `OPEN` | 0 | 1 (`7ace3a1`) | **GIỮ** đến khi đối chiếu/đóng PR #21 |
| 7 | `/home/tung/workspace/school/project1/lingora-test-fix` | `fix/test-flaky-timezone` | `e058278` | `origin/main` (chưa push nhánh) | Chưa có PR | 0 | **2** (`681d9ff`, `e058278` **chỉ có ở local**) | **GIỮ** (luồng L1; ưu tiên push lên GitHub) |
| 8 | `/home/tung/workspace/school/project1/lingora-ui` | `feat/learner-ui-gamified` | `0673ac4` | `origin/feat/...` | #24 `OPEN` | 0 | 4 (`5284d96`..`0673ac4`) | **GIỮ** (luồng L2 đang chạy, owner Sonnet) |
| 9 | `/home/tung/workspace/school/project1/lingora-practice-timezone` | `fix/practice-timezone-test` | `1667bb7` | Không có | Không có PR | 0 | **1** (`1667bb7` **chỉ có ở local**) | **CHỜ DUYỆT XÓA** (cách nới assertion cũ không dùng theo TST-01; tạo tag lưu `1667bb7` nếu muốn giữ trước khi xóa) |
| 10 | `/home/tung/workspace/school/project1/lingora-d1` | `fix/grader-trailing-punctuation` | `9912f2e` | `origin/fix/...` | #11 `MERGED` | 0 thật (4 `node_modules`/`generated`) | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 11 | `/home/tung/workspace/school/project1/lingora-d2` | `fix/sample-content-d2-d5` | `808dc32` | `origin/fix/...` | #12 `MERGED` | 0 thật (4 `node_modules`/`generated`) | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 12 | `/home/tung/workspace/school/project1/lingora-d6` | `feat/sample-content-d6-d7` | `495a84b` | `origin/feat/...` | #13 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 13 | `/home/tung/workspace/school/project1/lingora-docs` | `docs/journey-findings-round1-status` | `e136614` | `origin/docs/...` | #16 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 14 | `/home/tung/workspace/school/project1/lingora-f34` | `fix/f5-f15-d8` | `dcf709a` | `origin/fix/...` | #15 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 15 | `/home/tung/workspace/school/project1/lingora-f5` | `fix/f5-f12-preview` | `f11077d` | `origin/fix/...` | #17 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 16 | `/home/tung/workspace/school/project1/lingora-grade` | `feat/lenient-grading` | `98b01b0` | `origin/feat/...` | #19 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 17 | `/home/tung/workspace/school/project1/lingora-r3` | `docs/acceptance-round3-fr-ja` | `1d98459` | `origin/docs/...` | #18 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |
| 18 | `/home/tung/workspace/school/project1/lingora-srs` | `feat/srs-per-language` | `784a0f6` | `origin/feat/...` | #20 `MERGED` | 0 | 0 | **ĐỀ XUẤT XÓA** (đã merge vào `main`) |

## 2. Tóm tắt đề xuất cho chủ dự án duyệt

1. **Giữ ngay (8 worktree):** `lingora-workspace`, `lingora-admin-fix` (#23), `lingora-lang` (L5), `lingora-learner-fix` (#22), `lingora-onboarding-a11y` (#8), `lingora-r2` (#21), `lingora-test-fix` (L1), `lingora-ui` (#24).
2. **Đề xuất xóa đợt 1 — an toàn, đã merge & sạch WIP (9 worktree):**
   `lingora-d1`, `lingora-d2`, `lingora-d6`, `lingora-docs`, `lingora-f34`, `lingora-f5`, `lingora-grade`, `lingora-r3`, `lingora-srs`.
   *(Lưu ý: `lingora-d1` và `lingora-d2` có thư mục `node_modules` / `generated` riêng không track trong Git; kiểm tra không còn process chạy trước khi xóa thư mục).*
3. **Đề xuất xóa riêng nếu đồng ý bỏ commit local `1667bb7` (1 worktree):**
   `lingora-practice-timezone` — commit `1667bb7` chưa từng push lên remote và spec TST-01 đã chốt **không** cherry-pick. Nếu muốn giữ lịch sử tham khảo trước khi xóa worktree, có thể gắn tag/nhánh lưu hoặc xuất patch; nếu không cần thì xóa cả worktree lẫn nhánh local.
4. **Dọn sau khi xử lý WIP ở `lingora-workspace`:** hiện `lingora-workspace` đang ở nhánh cũ #10; sau khi lọc giữ/commit các file cần thiết (`docs/acceptance/`, `plans/`, `docs/ui-audit/`), mới chuyển về `main`. Không dùng `reset --hard` hay `git clean`.
