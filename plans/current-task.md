# Current task

- **2026-10-28: Documentation closeout COMPLETE — Codex tự thực hiện.** [Spec closeout](2026-10-28-documentation-closeout-spec.md) đã xử lý hai điểm còn lại sau review FAIL: chỉ dẫn cũ trong mục lục và bằng chứng kiểm tra liên kết. Tự kiểm tra 12 file: 185 liên kết nội bộ hợp lệ, 0 gãy; xem [báo cáo dọn dẹp, mục 6](../docs/repository-cleanup-2026-10-28.md#6-closeout-2026-10-28). Hai review FAIL cũ được giữ làm lịch sử, không thay thành review độc lập PASS. Việc xóa plan/bản lưu và registry rỗng của đợt trước đã hoàn tất.
- **Current foundation:** `lingora-admin/` with 34-model product schema, 4 applied migrations, seed, and `src/server/db/index.js`. No web framework, dev/build scripts, UI, or learner auth app currently exists.
- **Workflow:** [AGENTS.md](../AGENTS.md) — KISS, validation tại Backend, phát triển từng vertical slice.
- **Next proposal:** Proposed vertical slice 1: [Language Management](2026-10-27-next-app-slice.md) (minimal web/Admin auth foundation, backend role/status checks, safe CRUD/duplicate/FK error handling, UI acceptance). Explicitly remains a proposal; no implicit feature implementation authorization.
