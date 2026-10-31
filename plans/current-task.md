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

## Slice 7 — PASS / ACCEPTED
Submit / Review / Publish workflow implemented against the existing `LessonRevision`, `RevisionReview`, and `Lesson.activeRevisionId` model; no schema change or migration.
ACTIVE ADMIN reviews and publishes. Submission pins its exact revision and assignment episode; request-changes preserves history, approval/publish use versioned transitions, and successor drafts leave published content/pointer intact.
Codex review/fixes: persisted-child dirty checking, complete exercise detail display, publish lock ordering, and pending Save control visibility. Mutations A–H KILLED with byte-exact restoration.
`npm run test:feature` (391 tests), `npm run test:components` (113 tests), `npm run typecheck`, and `npm run build` PASS. See [Slice 7 verification](slice-7-verification.md).
Public DEV submit/review/request-changes/approve/publish, stale conflict/reload retry, exact revision isolation, and read-only SQL all PASS on the `READY` deployment for commit `04c14951523137eb1b931817d335545219d8991a`. Teacher is DISABLED and Course inactive; only allowlisted workflow history and the published pointer remain; unexpected residue 0. See [Slice 7 verification](slice-7-verification.md). No Slice 8 work.

`SLICE 7: PASS — SLICE 7 ACCEPTED`

## Slice 8 — PASS / ACCEPTED

Assessment Authoring Foundation completed against the existing schema: typed flat Blueprint composition, ACTIVE Admin management/assembly, assigned Teacher ASSESSMENT revision authoring, real source SUBMIT provenance and immutable concrete version pins. Product decision preserves truthful Teacher `createdBy`; no migration or sections/runtime scoring scope.

Initial full local suites, typecheck/build, independent review and A–G mutation controls PASS. Public acceptance found a Prisma default transaction timeout; Codex fixed only the assembly timeout and added a RED→GREEN round-trip regression. Affected domain17/17, routes4/4, components8/8, typecheck/build and diff check PASS. Fix commit `0f73586ffd2278d39378418ba5f3c004b556e3aa` deployed READY before the successful public retry.

Public Blueprint create/edit, Teacher source submissions r10/r11, real composition failure with retained selection, successful V1 assembly, and X→Y exact prompt/grading-reference isolation PASS. Read-only DB checks PASS; safe DRAFT r12 restored, published r9 pointer unchanged, Teacher DISABLED/Auth session count0, Course inactive, unexpected residue0. Explicit DEV_S8 history and authorized credential rotation retained; both test sessions logged out and tabs closed. See [Slice 8 verification](slice-8-verification.md) and [DB evidence](2026-10-31-slice-8-public-dev-evidence.json). No Slice 9 work.

`SLICE 8: PASS — SLICE 8 ACCEPTED`

## Slice 9 — PASS / ACCEPTED

Accepted 2026-11-01 (Asia/Saigon). Dedicated `lingora-web`; preprovisioned confirmed ACTIVE LEARNER only, exact session-scoped LearningContext list and valid empty state. No signup, schema migration or learner runtime expansion.

Anti initial app/auth/context/UI/tests → independent senior review → Codex direct fixes for local sign-out scope, confirmation, parent IDs, actual-page/session test fidelity, safe retries and server-only boundary. Public acceptance then exposed missing Production DB config and Prisma engine lookup failure; Codex configured the Secret through CLI stdin and fixed build-time runtime-asset packaging, retaining one schema owner.

Final root feature471/components138, typecheck/build, clean install/build, client scan PASS; A–F mutations KILLED/restored. Fix `83aacbfc473199cc23fe158d77e484eb2af12bdc` deployed READY on learner/staff before live success. Public login→home/context200/empty, real staff role403, same-session disable403→restore/retry200, logout→401 and read-only DB identity/isolation all PASS. All6 disposable attempts cleaned, other Accounts unchanged, residue0, test sessions/browser closed; temporary CLI credential removed. See [verification](slice-9-verification.md). No Slice 10.

`SLICE 9: PASS — SLICE 9 ACCEPTED`
