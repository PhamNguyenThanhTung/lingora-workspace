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

## Slice 10 — Learner Lesson / Progress Foundation (PASS / ACCEPTED)

Accepted2026-11-01. Separate LessonConsumption records Chưa đọc → Đang đọc → Đã đọc per owned context/exact published revision. Reading never becomes graded completion or unlocks later curriculum/Level/SRS. User-approved additive migration `20261101000000_lesson_consumption` applied/verified DEV; FK/cardinality/guard/Prisma and guarded rollback PASS, existing grading unchanged.

Anti initial implementation → independent Sol High review → Codex direct fixes for shared access/gating, fresh post-lock checks, DB timestamps, safe projections and Next refresh state. Feature509/component145/integration7/typecheck/build/client scan PASS;12 semantic mutation variants KILLED and byte-exact restored.

Source `2fb844735beca8d024c310778a7c23d923eca054` pushed and READY on learner/staff before public writes. Public27-flow +7 exact child DTO/DB checks PASS, including X/draft isolation, Y separate progress, real stale409/reload/retry, and no graded unlock/evidence side effects. Five disposable learners removed; allowlisted content/history retained with Course inactive/Lessons PLANNED/staff DISABLED, original Teacher unchanged DISABLED, sessions0 and unexpected residue0. See [verification](slice-10-verification.md) and [public evidence](evidence/slice-10/public-acceptance.md). Final commit records evidence only; no local/public rerun for documentation. No Slice11.

`SLICE 10: PASS — SLICE 10 ACCEPTED`

## Slice 11 — Practice Attempt / Grading / Lesson Completion (PASS / ACCEPTED)

D1–D3 approved2026-11-01: NFC/trim/case-sensitive exact text grading; atomic core enrollment with new stage1/due+1 day and existing cards unchanged; all new stale response/finalize writes409 including redo, authorized committed replay retained. Historical decision checkpoint FAIL resolved. Existing model supports the feature; no schema gap established.

Final [spec](2026-11-01-slice-11-practice-attempt-grading.md) delivered through Anti implementation/tests → independent Sol6.1High review → Codex direct fixes/local gates → exact-commit public DEV acceptance and read-only reconciliation. No schema change or migration. [Verification](slice-11-verification.md) and [public evidence](evidence/slice-11/public-acceptance.md).

Local gates PASS: feature542/components152, Practice DB13 + Slice10 DB7, typecheck/build,20 mutations KILLED/restored,40 local client files clean. Public flow24 checks PASS, including five-type grading, N5/K3 scoring, X→Y stale conflict/replay, second-revision grading, progression isolation, and failure/retry. Read-only DB reconciliation:4 attempts/19 responses,1 first completion,2 receipts,1 card; all runtime fixtures restored, immutable history allowlisted, sessions0, unexpected residue0. Learner/staff client scan40 local +19 public files PASS.

`SLICE 11: PASS — SLICE 11 ACCEPTED`

## Slice 12 — REPAIR PASS / EMAIL ACCEPTANCE BLOCKED; NOT ACCEPTED

The separately authorized [repair task](2026-11-01-slice-12-blocker-repair.md) resolves the five historical blockers without schema/migration/trigger changes. Anti initial repair → Codex source review/direct test-fidelity fixes → independent Sol6.1High final review PASS. [Final verification](slice-12-repair-verification.md); [historical FAIL/STOP](slice-12-verification.md) is preserved.

Final local gates:603/603 feature,168/168 components,54/54 PostgreSQL; both typechecks/builds;42 clean local +23 public client files; three guard cases in three cwd; A–F KILLED with exact byte restoration. Real writer/reader schedules and five-operation Pause matrix prove lock ordering; full nonempty SRS/history snapshots preserve microsecond values.

Source `bd88903` pushed to main, both Learner and Staff READY for that SHA. Maintenance `bc4ecf1` stays separate. Public non-email checks PASS. Two real email links were consumed before the test browser could exchange a code; a fresh registration diagnostic returned429 RATE_LIMITED. Successful callback/login/context/Lesson/Practice public journey is still unaccepted. Stop email sends until quota permits; next controlled run needs only the email token value to avoid hyperlink preview.

All owned Auth fixtures removed; no application Account/context/history/curriculum write reached. Final read-only reconciliation: other Accounts/curriculum unchanged, sessions0, unexpected residue0; passwords/storage state/link files removed. `SLICE 12 REPAIR: PASS`; `SLICE 12: NOT ACCEPTED`. No Slice13 or dependency advisory scope. Preserve unrelated changes.
