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

## Slice 12 — IMPLEMENTED / PUBLIC ACCEPTANCE FAIL; NOT ACCEPTED

Current outcome: [instrumented attempt FAIL / STOP](slice-12-instrumented-acceptance-20261104.md), exact failure `flow_state_expired`/422 with verifier cookie present; independent cleanup PASS, residue0. Both authorized attempts spent. Current human action NONE; Slice12 NOT ACCEPTED.

Earlier outcome: [one fresh public attempt on2026-11-04](slice-12-public-acceptance-20261104.md), tested source/helper/deployment `137f246`, both canonical aliases READY. Application callback source remains `9b354c8`; prior feature/repair proofs and the [takeover audit](2026-11-04-takeover-audit.md) remain historical. Owner authorized Codex direct helper fixes without another Anti call. Helper PASS145/145 and fresh registration/login regressions36/36; both added source mutations were caught. All seven actual retained-scope PostgreSQL queries and safe original-email handoff preflight passed.

Post-STOP mechanical helper follow-up `a795a4e` fixes the journey checkpoint variable; actual mocked-runner regression reproduces the old failure and final offline suite146/146 PASS. This is separate from the live attempt tested at137f246; no further registration/activation or production-auth source change.

Exactly one product signup returned200 and one original-email verify navigation was made in the preserved signup PKCE context. Provider303 and application callback303 with code succeeded; final login200 had an error flag and no confirmed=1. Provider confirmed the email, but no application Account/context/session was created; saved verifier matched the provider S256 challenge. Exact runtime/SDK cause remains unavailable. This differs from the historical otp_expired/no-code failure; do not infer scanner, TTL, parameter loss or a particular source defect.

Downstream normal login/bootstrap/context/Lesson/Practice/Pause/Resume were NOT RUN. Actual cleanup and independent read-only reconciliation PASS: six owned Auth groups0, owned app/audit rows0, other Accounts/full curriculum/provider flows/all seven retained S11 groups unchanged, private credentials/state/URL scratch absent, unexpected residue0. Original user emails preserved; no SMTP/config/dependency/schema change.

**NEXT ACTION: STOP — ONE-ATTEMPT BUDGET SPENT.** Current human action NONE; no more email artifact is needed for this completed attempt. Preserve the callback failure evidence. No resend, second activation or speculative auth redesign in this package. `SLICE 12: NOT ACCEPTED`; Slice13 remains unopened. Unrelated owner changes and historical verification remain intact.

### Authorized callback diagnostic follow-up

Codex direct investigation and patch at `c7b8e40` is [deployed and verified](2026-11-04-slice-12-callback-diagnostics.md). Real SDK + production Next/Chromium loopback tests pass for original state through proxy/callback, including production's server-only env shape; no source cause of the historical failure was reproduced. Vercel URL/key type are valid. Added allowlisted phase/code/status/verifier-presence diagnostic and fixed missing private/no-store headers on client initialization failure. Learner feature202/202, typecheck, production build/browser tests PASS; allowlist source mutation killed and restored byte-exact.

Canonical Learner READY at c7b8e40; credential-free synthetic missing-verifier probe and scoped runtime logs verify the deployed diagnostic. This is synthetic evidence only. No new real signup/activation, DB/email/provider config change or Anti call. The earlier real attempt remains FAIL/spent, Slice12 NOT ACCEPTED. At that checkpoint a new instrumented attempt required separate bounded authorization and a fresh original `.eml`. The authorization and subsequent completed result are recorded below; the first attempt’s exact cause remains unresolved.

### Latest instrumented public result — FAIL / STOP

Owner separately authorized one instrumented attempt at c279720, Learner/Staff READY. [Result and cleanup](slice-12-instrumented-acceptance-20261104.md): registration200; original URL opened once after25minutes; callback diagnostic `pkce_exchange` / `flow_state_expired` / HTTP422 / verifierCookiePresent=true. Provider confirmed email; no application Account/context/session. Downstream public journey NOT RUN. Earlier one-hour guidance and OTP-only helper freshness guard omitted PKCE lifetime; they are insufficient for future preflight. Upstream default300seconds is not a verified effective project override. Earlier uninstrumented cause remains unknown.

Scoped cleanup and independent read-only reconciliation PASS: all six owned Auth groups0, owned app/audit rows0, full curriculum/other Accounts/provider-flow/seven-group S11 baseline unchanged, private scratch absent, residue0. Two separately authorized real registrations/navigations total; zero resends. Both budgets spent. **STOP; current human action NONE; Slice12 NOT ACCEPTED; Slice13 NOT STARTED.** No third attempt, SMTP/provider/env mutation or speculative auth redesign is authorized.

### Slice 12 follow-up — offline PKCE helper PASS (2026-11-05)

Owner asked to resume the unfinished work through Anti. Same interrupted Gemini3.8FlashHigh conversation continued; Codex reviewed/fixed malformed timestamp acceptance and verified the actual navigation path. [Helper plan](2026-11-05-slice-12-pkce-handoff.md), [final evidence](slice-12-pkce-handoff-verification-20261105.md):166 helper checks +2 actual-runner URL/state/restart/privacy checks +41 registration/callback regressions PASS; five negative controls caught/restored. Conservative exclusive180-second handoff checks run initially and immediately before each navigation effect. This is not verified provider TTL or public acceptance. No real artifacts/services/send/navigation/cleanup, commit/push or deployment. Both real budgets remain spent; Slice12 NOT ACCEPTED. [Proposed new bounded attempt](2026-11-05-slice-12-next-public-attempt.md) awaits separate owner authorization and inbox readiness.

### Independent maintenance — Admin audit viewer, local PASS (2026-11-05)

The bounded ACTIVE ADMIN read-only audit page/API is locally verified after an explicit owner-authorized Codex repair of the failed Anti delivery. [Plan](2026-11-04-admin-audit-viewer.md), [final evidence](admin-audit-viewer-codex-verification-20261105.md): feature460/460, components133/133, disposable PostgreSQL5/5, built Next smoke3/3, typecheck/build and independent browser checks PASS. Mobile clipping, timestamp semantics and test-fidelity blockers are closed, with three effective negative controls. Uncommitted/undeployed; no live provider/database or registration action. This maintenance does not accept Slice12, open Slice13 or complete all UC-14 reporting.

### Core Learner MVP — Post-Review Correction Round 1 (PASS / COMPLETED)

Thực hiện và nghiệm thu đợt hiệu chỉnh duy nhất (Correction Round 1) theo báo cáo đánh giá của Astra (`plans/evidence/learning-mvp-20261105/astra-review.md`) và đặc tả [Learning MVP](2026-11-05-learning-mvp.md):
- **R1 Loopback Guard & Actor Conflict:** `scripts/seed-sample-curriculum.mjs` và test suites kiểm tra nghiêm ngặt biến môi trường `SLICE11_TEST_DATABASE_OWNED === '1'`, loopback IP/host, và pathname bắt buộc chứa `/slice11_test`; từ chối thực thi nếu không có cờ hoặc trỏ vào DB không thuộc quyền quản lý; kiểm tra preflight không ghi đè hoặc đổi vai trò của actor đã tồn tại; loại bỏ hoàn toàn việc ghi log token/auth header trong runner và mock server.
- **R2 Sample Curriculum Preflight & Semantic Guard:** Kiểm tra vị trí bài học 1..3 trước khi import giáo trình mẫu A1, từ chối nếu có bản nháp hoặc nội dung không liên quan; xác thực danh tính staff `ACTIVE` và role hợp lệ; đảm bảo tính lũy thừa (idempotency) khi chạy lại.
- **R3 SRS Transactional Idempotency:** Kiểm tra lại bản ghi `srsReviewOperation.findUnique` ngay sau khi có khóa độc quyền bên trong giao dịch trước khi đánh giá CAS; bảo đảm hai yêu cầu trùng khóa gửi đồng thời đều nhận cùng kết quả thành công và chỉ ghi 1 dòng lịch sử DB duy nhất.
- **R4 Fail-Closed Clock, Locks & Timezone:** Loại bỏ fallback đồng hồ phía ứng dụng (`getDbTime` chỉ đọc từ PostgreSQL hoặc ném lỗi ngay); khóa thẻ bằng `NOWAIT` trả về 409 khi có tranh chấp; kiểm tra timezone hợp lệ qua `Intl.DateTimeFormat`.
- **R5 SRS UI Robustness:** Vô hiệu hóa nút đánh giá khi đang chờ phản hồi (`pendingOp`); nút "Thử lại thao tác" gửi lại chính xác `operationKey` và token cũ; nút "Bắt đầu lượt ôn tập mới" khi token hết hạn; đặt lại bộ đếm thẻ giao diện khi bắt đầu phiên mới.
- **R6 Joined Acceptance Fidelity & Context Concurrency:** `learning-mvp-e2e.test.mjs` thực hiện trọn vẹn luồng biên soạn của Admin và Giáo viên qua HTTP API chuẩn (tạo Bài 4 -> phân công -> lưu nháp -> nộp bài -> duyệt bài -> xuất bản với `makeAvailable: false` -> kích hoạt với HTTP 200 nghiêm ngặt); học viên đọc bài ("Mở nội dung", "Hoàn thành đọc nội dung") -> làm bài sai câu 1 -> làm lại đúng ở lượt 2 (pass 2) -> hoàn tất -> tải lại trang kiểm tra độ bền vững phản hồi và giải thích -> mở khóa Bài 2 -> điều hướng vào Bài 2; bổ sung test DB PostgreSQL thực tế trong `context-concurrency.test.mjs` cho `startLearningContext` (hội tụ lựa chọn đồng thời, từ chối CAS cũ, từ chối ngữ cảnh có lịch sử).
- **R7 Sample Curriculum Grammatical Precision:** Bài 3 Ex 1 chỉ chấp nhận `['wakes']`; Bài 2 Ex 2 bài tập ngữ pháp chuyển đổi câu.
- **R8 Responsive Mobile Header:** Header trang chủ học viên và ôn tập tại viewport 390px dùng `flex-wrap`, nút thao tác có `whiteSpace: 'nowrap'`, tên học viên hiển thị đầy đủ hoặc rút gọn bằng dấu chấm lửng (ellipsis) mà không bị che khuất hoặc tràn layout.
- **R9 Durable Evidence & Command Ledger:** Toàn bộ bằng chứng đợt sửa lỗi được lưu trữ tại `plans/evidence/learning-mvp-20261105/correction-run-1/` gồm 14 file raw logs đã khử nhạy cảm trong `logs/`, 10 ảnh chụp màn hình desktop và mobile trong `screenshots/`, ảnh chụp màn hình admin E2E trong `admin-e2e/`, cùng sổ lệnh `command-ledger.md` ghi nhận chi tiết lệnh, thư mục, môi trường và mã thoát.

**Kết quả kiểm tra toàn bộ cổng (All 14 Gates PASS - Exit Code 0):**
1. `npm run db:product:validate`: PASS (exit code 0, file log `01-db-product-validate.log`)
2. `npm run typecheck`: PASS (exit code 0, cả lingora-admin và lingora-web, file log `02-typecheck.log`)
3. `npm run build` (với synthetic env): PASS (exit code 0, cả lingora-admin và lingora-web, file log `03-build.log`)
4. `npm run test:feature`: PASS (exit code 0, 227/227 web tests + toàn bộ admin suites, file log `04-test-feature.log`)
5. `npm run test:components`: PASS (exit code 0, 100% component tests pass, file log `05-test-components.log`)
6. `node scripts/local-test-db.mjs npm run test:integration:lessons -w lingora-web`: PASS (exit code 0, 7/7 tests, file log `06-test-integration-lessons.log`)
7. `node scripts/local-test-db.mjs npm run test:integration:practice -w lingora-web`: PASS (exit code 0, 13/13 tests, file log `07-test-integration-practice.log`)
8. `node scripts/local-test-db.mjs npm run test:integration:onboarding -w lingora-web` (Run 1): PASS (exit code 0, 37/37 tests, file log `08-test-integration-onboarding-run1.log`)
9. `node scripts/local-test-db.mjs npm run test:integration:onboarding -w lingora-web` (Run 2): PASS (exit code 0, 37/37 tests, file log `09-test-integration-onboarding-run2.log`)
10. `node scripts/local-test-db.mjs npm run test:integration:audit -w lingora-admin`: PASS (exit code 0, 5/5 tests, file log `10-test-integration-audit.log`)
11. `node scripts/local-test-db.mjs npm run test:integration:srs -w lingora-web`: PASS (exit code 0, 10/10 tests, file log `11-test-integration-srs.log`)
12. `node scripts/local-test-db.mjs npm run test:e2e:learning -w lingora-web`: PASS (exit code 0, trọn vẹn luồng E2E joined browser/DB/Next/auth, 10 screenshots, file log `12-test-e2e-learning.log`)
13. `node scripts/local-test-db.mjs npm run test:smoke:audit -w lingora-admin`: PASS (exit code 0, 3/3 tests, file log `13-test-smoke-audit.log`)
14. `E2E_SCREENSHOT_DIR=plans/evidence/learning-mvp-20261105/correction-run-1/admin-e2e/screenshots E2E_SLICE2_SCREENSHOT_DIR=plans/evidence/learning-mvp-20261105/correction-run-1/admin-e2e/slice2-screenshots node scripts/local-test-db.mjs npm run test:e2e -w lingora-admin`: PASS (exit code 0, 35/35 states, 0 errors, file log `14-admin-test-e2e.log`)

**Phạm vi hoãn lại (Explicitly Deferred):** Triển khai đăng ký/đăng nhập thật (registration/login OTP/PKCE), đánh giá nâng trình độ (assessment/level-up), kết nối email/provider ngoài, deployment môi trường thực tế, commit và push git. Mã nguồn và bằng chứng hoàn tất chuyển giao cho Astra thẩm định độc lập.
