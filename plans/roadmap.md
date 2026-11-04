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
- No schema/migration; Slice7 is the current workflow task.

## Slice 7 — Submit / Review / Publish (PASS / ACCEPTED)

- Uses exact `LessonRevision` identity and append-only `RevisionReview` events; only ACTIVE ADMIN reviews and publishes. `Lesson.activeRevisionId` remains separate from availability.
- Teacher submit pins the current persisted revision and assignment episode. Admin queue/detail render that snapshot. Request-changes creates an authoring successor; approve and publish enforce exact state/version guards.
- Publishing updates the pointer transactionally. New drafts preserve the current published revision and its content; republishing archives the previous publication with an event.
- Production UI callbacks are exercised for Teacher submit and Admin request-changes/approve/publish, including pending, retry, stale, 401 and 403 behavior.
- Local feature391/391, components113/113, typecheck/build PASS; mutation controls A–H KILLED with byte-exact source restore. No schema/migration or Slice8 work.
- Public DEV flow and read-only SQL evidence PASS on production deployment for commit `04c14951523137eb1b931817d335545219d8991a`; Teacher DISABLED/Course inactive, allowlisted workflow history retained, unexpected residue 0. See [Slice 7 verification](slice-7-verification.md).
- SLICE 7 ACCEPTED.

## Slice 8 — Assessment Authoring Foundation (PASS / ACCEPTED)

- Typed flat Blueprint coverage/minimum/config contract, Admin CRUD/explicit concrete version assembly, and assigned Teacher ASSESSMENT revision authoring through actual LessonRevision provenance. No schema/migration or section abstraction.
- Real Teacher SUBMIT source identity and exact immutable AssessmentVersionItem pins; snapshot/hash and prompt/grading-reference isolation remain unchanged after newer submitted Y.
- Full initial feature/component gates, independent review and A–G mutations PASS. Public timeout fix uses the existing 30-second lesson transaction convention; affected feature17/routes4/components8, typecheck/build and live retry PASS on READY commit `0f73586ffd2278d39378418ba5f3c004b556e3aa`.
- Public Blueprint/author/submit/assemble/failure-retry/isolation and read-only DB checks PASS. Teacher DISABLED/Auth sessions0, Course inactive, safe DRAFT r12 and published pointer r9 retained, explicit DEV_S8 history allowlisted, unexpected residue0; test sessions/tabs closed. See [verification](slice-8-verification.md).
- SLICE 8 ACCEPTED. Learner attempts, scoring/placement/level-up runtime and Slice 9 have not started.

## Slice 9 — Learner Auth / Learner Context Foundation (PASS / ACCEPTED)

- Accepted 2026-11-01: separate `lingora-web`, confirmed preprovisioned ACTIVE Learner login/home/logout, fresh role/status checks and owned context list; missing context is valid empty200.
- Anti implementation and independent review followed by Codex fixes for session isolation, confirmation, joined-parent validation, production-page/session fidelity and safe failure/retry. Public Prisma engine lookup bug fixed in the build/runtime assets, one existing schema owner.
- Root feature471/components138, typecheck/build, initial clean root build + clean learner runtime build and A–F mutations PASS. Public client/authenticated HTML/JS scans: no secret matches.
- [Learner DEV](https://lingora-learner-dev.vercel.app/) and staff READY on accepted fix `83aacbf`. Actual public login/home/context, staff denial403, disable→restore same-session retry, logout401 and read-only DB proofs PASS. All6 owned fixtures removed, other Accounts unchanged, residue0; sessions/browser and temporary CLI credential closed/removed. See [verification](slice-9-verification.md).
- SLICE 9 ACCEPTED. No schema migration, signup or Lesson/progress/assessment runtime. Slice 10 has not started.

## Slice 10 — Learner Lesson / Progress Foundation (PASS / ACCEPTED)

Accepted2026-11-01. Separate LessonConsumption records Chưa đọc → Đang đọc → Đã đọc per owned context/exact published revision. Reading never becomes graded completion or unlocks later curriculum/Level/SRS. User-approved additive migration `20261101000000_lesson_consumption` applied/verified DEV; FK/cardinality/guard/Prisma and guarded rollback PASS, existing grading unchanged.

Anti initial implementation → independent Sol High review → Codex direct fixes for shared access/gating, fresh post-lock checks, DB timestamps, safe projections and Next refresh state. Feature509/component145/integration7/typecheck/build/client scan PASS;12 semantic mutation variants KILLED and byte-exact restored.

Source `2fb844735beca8d024c310778a7c23d923eca054` pushed and READY on learner/staff before public writes. Public27-flow +7 exact child DTO/DB checks PASS, including X/draft isolation, Y separate progress, real stale409/reload/retry, and no graded unlock/evidence side effects. Five disposable learners removed; allowlisted content/history retained with Course inactive/Lessons PLANNED/staff DISABLED, original Teacher unchanged DISABLED, sessions0 and unexpected residue0. See [verification](slice-10-verification.md) and [public evidence](evidence/slice-10/public-acceptance.md). Final commit records evidence only; no local/public rerun for documentation. No Slice11.

`SLICE 10: PASS — SLICE 10 ACCEPTED`

## Slice 11 — Practice Attempt / Grading / Lesson Completion (PASS / ACCEPTED)

- Accepted 2026-11-01. Uses the existing attempt/response/completion domain with exact published LessonRevision and exact ItemRevision pins; no schema migration.
- Server grades all five Practice types. Text grading uses NFC, trim, and optional case folding with exact accepted-answer matching. Retry queue and half-unit scoring are deterministic; a completed graded attempt creates the first logical Lesson completion and atomically enrolls eligible core vocabulary.
- Learner-safe DTOs exclude answer keys/private grading data. Consumption stays independent; only graded completion unlocks the next eligible Lesson. Assessment, Level-up, SRS review, and streak behavior remain out of scope.
- Anti implementation → independent review → Codex direct fixes. Feature542/components152, Practice PostgreSQL13/13, Slice10 PostgreSQL7/7, typecheck/build PASS;20 semantic mutations KILLED and restored.
- Public24-check acceptance PASS on exact source commit `4ddc09c96b7f0455692eb5b76e515d1b8b9a5ab4`: true client retries, five-type scoring, X→Y stale409/committed replay, exact revision pins, and progression isolation. Read-only reconciliation confirms4 attempts/19 responses/1 first completion/2 receipts/1 core card. Runtime fixtures restored; immutable history allowlisted; sessions0 and unexpected residue0. Local/public client scan40/19 files PASS. See [verification](slice-11-verification.md) and [public evidence](evidence/slice-11/public-acceptance.md).

`SLICE 11: PASS — SLICE 11 ACCEPTED`

## Slice 12 — Learner Onboarding / Context Lifecycle (IMPLEMENTED; NOT ACCEPTED)

Latest: [instrumented activation FAIL](slice-12-instrumented-acceptance-20261104.md), `flow_state_expired`/422 with verifier cookie present; independent cleanup PASS, residue0. Both authorized attempts spent; current human action NONE.

The [feature contract](2026-11-01-slice-12-onboarding-context.md), historical repair/callback verification and [takeover audit](2026-11-04-takeover-audit.md) remain separate from public acceptance. Owner-authorized direct helper fixes PASS145/145 with mutation controls; fresh registration/login regressions36/36. Tested helper/source commit `137f246`, both canonical deployments READY; production callback source remains `9b354c8`.

The [fresh public attempt on2026-11-04](slice-12-public-acceptance-20261104.md) passed preflight and registration200; provider verify303 and callback303 with code were observed, but login lacked confirmed=1. Saved PKCE verifier matched the provider challenge; exact runtime/code-exchange cause remains unknown. No downstream public journey PASS is claimed. Scoped cleanup and independent reconciliation PASS, residue0, complete retained S11/curriculum/other Accounts/provider-flow baseline unchanged, private scratch removed.

A post-STOP mechanical journey checkpoint fix is separate helper commit `a795a4e`; final offline suite146/146 PASS including actual runner checkpoint/finalization regression. The public attempt remains tested at137f246 and was not repeated.

**Next: STOP — one-attempt budget spent.** Current human action NONE. Preserve current failure evidence; no resend/second activation or speculative production-auth fix under this package. Slice12 is **NOT ACCEPTED**; Slice13 is not started and has no canonical numbered spec. No unrelated debt or dependency-advisory work.


Callback diagnostic follow-up `c7b8e40`: [deployed safe diagnostics and no-store fix](2026-11-04-slice-12-callback-diagnostics.md), feature202/202 + typecheck + real Next/Chromium local protocol PASS. Runtime probe verifies missing-verifier diagnostic with synthetic code only. Prior real failure remains unresolved and its attempt budget spent; no new real signup/activation was made. Slice12 remains NOT ACCEPTED.

### Latest instrumented public result — FAIL / STOP

Owner separately authorized one instrumented attempt at c279720, Learner/Staff READY. [Result and cleanup](slice-12-instrumented-acceptance-20261104.md): registration200; original URL opened once after25minutes; callback diagnostic `pkce_exchange` / `flow_state_expired` / HTTP422 / verifierCookiePresent=true. Provider confirmed email; no application Account/context/session. Downstream public journey NOT RUN. Earlier one-hour guidance and OTP-only helper freshness guard omitted PKCE lifetime; they are insufficient for future preflight. Upstream default300seconds is not a verified effective project override. Earlier uninstrumented cause remains unknown.

Scoped cleanup and independent read-only reconciliation PASS: all six owned Auth groups0, owned app/audit rows0, full curriculum/other Accounts/provider-flow/seven-group S11 baseline unchanged, private scratch absent, residue0. Two separately authorized real registrations/navigations total; zero resends. Both budgets spent. **STOP; current human action NONE; Slice12 NOT ACCEPTED; Slice13 NOT STARTED.** No third attempt, SMTP/provider/env mutation or speculative auth redesign is authorized.
