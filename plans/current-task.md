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

## Slice 5 — PASS / ACCEPTED
Lesson Assignment / Draft / Revision Foundation hoàn tất ngày2026-10-30 theo [spec](2026-10-30-slice-5-lesson-assignment-draft.md).
Anti implementation pass → independent Sol High review → Codex direct fixes/final acceptance. Feature327/327, components87/87, typecheck/build PASS; A–F KILLED, byte-exact restore.
Live3012: owned Lesson create/assign, Teacher saves/reloads3 linked DRAFT revisions, prior row unchanged; Teacher/Admin stale retry and same-session disable403/enable200 PASS. TeacherB negative uses actual production-handler integration, as allowed when no second safe live identity exists.
Owner approved one labeled reusable DEV set instead residue0:1 Course/Unit/Lesson/assignment/history/Teacher Account/Auth identity/provisioning request and3 revisions retained. Course inactive, Teacher DISABLED, session/browser closed; immutable guards intact, canonical data untouched.
See [final verification](slice-5-verification.md). SLICE5 ACCEPTED; commit/push metadata is reported in the final Codex delivery. No schema change or Slice6 work.

## Slice 6 — PASS / ACCEPTED
Exercises / Vocabulary / Media Foundation accepted ngày2026-10-31 theo [spec](2026-10-30-slice-6-exercises-vocabulary-media.md).
Anti initial implementation → independent review/repros → Codex direct fixes/acceptance. Feature386/386, components106/106, typecheck/build PASS; A–G semantic mutations KILLED, byte-exact restore.
All5 real exercise types; global Vocabulary reuse + revision snapshots; explicit atomic Save inserts successor children, old rows unchanged. LISTENING public HTTPS references only; upload/storage foundation deferred.
Live create/edit/reload, conflict/retry, stale recovery, deep SQL revision isolation, Vocabulary detach/reattach and same-session disabled403 PASS. TeacherB uses actual production-handler integration substitute.
Existing DEV set retained per owner:7 Lesson revisions,2 item identities,8 item revisions/secrets/exercises,1 global concept,3 links; unexpected residue0. Teacher DISABLED/Course inactive; sessions/browser closed; no canonical writes or schema/migration. See [verification](slice-6-verification.md). SLICE6 ACCEPTED; no Slice7.
