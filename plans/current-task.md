# Current task

## Slice 1 — PASS / ACCEPTED
Admin Auth và Language Management hoàn tất ngày 2026-10-29.
Feature74/74, components12/12, typecheck/build và live CRUD PASS.
Đăng nhập, phân quyền ACTIVE ADMIN, cookie refresh và draft cleanup đã nghiệm thu.

## Slice 2 — PASS / ACCEPTED
Frameworks/Levels hoàn tất ngày 2026-10-30, gồm canonical UUID compatibility.
Feature155/155, components31/31, typecheck/build PASS; live CEFR và A–E PASS.
Owned fixtures đã xóa sạch, canonical data giữ nguyên. Xem [roadmap](roadmap.md).

## Owner Override
Database DEV được chủ dự án chấp nhận: 5 migrations đã áp dụng.
Admin Auth và UI baseline được chấp nhận làm nền tảng phát triển.

## Slice 3 — PASS / ACCEPTED
Courses/Units được ACCEPTED ngày2026-10-30 sau task độc lập Final Acceptance Patch (correction1/1).
Feature196/196, components45/45, typecheck/build PASS;13 mutation controls KILLED, restore byte-exact.
Production3012 rebuilt: canonical read-only và live A–E PASS;2 owned Units -> Course đã xóa, reload owned residue0.
Retry giữ input, dependency403 đóng modal và Logout usable, actual-page props/callback/reconciliation có regression proof.
Xem [final verification](slice-3-final-patch-verification.md); [review cũ](slice-3-review.md) và [verification cũ](slice-3-verification.md) là lịch sử task FAIL/STOP trước patch. Không schema change; không bắt đầu Slice4.

## Slice 4 — PASS / ACCEPTED
Teacher Accounts / Enable-Disable / Permissions hoàn tất ngày2026-10-30 theo [spec](2026-10-30-slice-4-teacher-accounts.md).
Codex review/fix trực tiếp, không gọi lại Anti khi live acceptance. Feature260/260, components60/60, typecheck/build PASS; A/B/C/C2/D/E KILLED, restore byte-exact.
Live3012: create/invite/activation, disable + same-session ACCOUNT_INACTIVE, enable + restored holding, duplicate no-false-success PASS.
Owned Account/Auth/provisioning cleanup residue0; giữ4 immutable audit events. Không schema change/canonical-account mutation; không bắt đầu Slice5.
Xem [final verification](slice-4-verification.md). SLICE4 ACCEPTED; commit/push sau allowlist/secret review.
