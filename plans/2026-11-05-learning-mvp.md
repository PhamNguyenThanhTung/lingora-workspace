# Learning MVP core — executable spec — 2026-11-05

Status: **READY for Anti implementation.** User selected core MVP: publication/context fixes, useful sample curriculum, feedback, SRS. **Assessment/level-up and registration/login work are explicitly deferred.** Planner: Astra High. Implementer/test owner: Antigravity `gemini-3.8-flash-high`, effort `high`. Independent final review: Astra; no Sol. One task-wide Anti correction round after consolidated review; if still FAIL, stop/report, no silent implementation takeover.

## Goal and boundaries

A learner with an existing valid account can select a usable course, study published lessons, complete practice, understand mistakes, reload durable progress, and review due vocabulary. Staff can make newly authored and already-published planned lessons available without DB hand edits. Prove the joined browser→production Next→API→disposable PostgreSQL learning path with a local synthetic auth provider; retain production auth checks unchanged.

Baseline HEAD: `02acd2f79d99441fe19966be2512b453c5b7d1ca`. Audit: `plans/evidence/whole-project-audit-20261105/report.md`, `astra-review.md`, `runtime.md`. Current dirty admin audit-viewer source/tests, Sidebar/package/harness edits, AGENTS/README and plans predate this task: preserve them; take a fresh Git/diff baseline before edits. Existing evidence is ignored by Git and must not be overwritten. New evidence: `plans/evidence/learning-mvp-20261105/<package>/`; use new run subdirectories.

No real provider/email work, auth redesign, production bypass, deploy/push, real DB migration/seed/reset, bulk cleanup, unrelated refactor or new business triggers. Default seed remains unchanged. No schema migration expected: existing Lesson, LearningContext, ItemGradingSecret.feedbackData, SrsCard and SrsReviewOperation models suffice. If a real schema incompatibility prevents the contracted behavior, report the specific constraint before expanding scope.

Keep current completion policy: all N core questions plus one retry for each first-pass error; completion independent of accuracy; redo never duplicates first completion. No mastery claim, new scoring rule, assessment reuse, AI integration, reminder/streak dashboard, optional-vocabulary enrollment, adaptive practice, media-upload system or full reporting in this task.

## Code-grounded decisions

- `createLesson` sets PLANNED; `publishReview` currently preserves availability; learner requires AVAILABLE/PUBLISHED. Activation is an explicit staff intent, not an implicit side effect on every publish call.
- `context/service.ts` currently persists null-level DEFAULT contexts and only offers pause/resume afterward. Preserve existing null rows/history; repair through an owner-scoped explicit mutation, never GET side effects or bulk migration.
- Teacher authoring already stores `feedbackData.explanation`; learner practice loads it but discards it. Use the pinned attempt revision to expose a narrow completed-practice review, never raw gradingData in generic DTOs.
- Existing SRS policy in `docs/use-case-specifications.md:194-206` / `docs/study-focus-addendum.md:17-23`: server selects due cards only after Start; learner cannot enumerate due list/stage/date or choose arbitrary cards. REMEMBERED intervals 1→3→7→14→30 days, cap stage 5; FORGOTTEN reset stage 1/+1 day. Dedicated review is account-wide, including paused contexts. Reinforcement is optional and is **deferred** here.
- SrsReviewOperation already has immutable history, `(learnerId,operationKey)` uniqueness and one SCHEDULE/card/session. Reuse those rather than introducing a session table or generic command framework.
- Current onboarding retry 34/34 is not a sequential test run. Feature gate failed on generated package JSON but later JSON parses; investigate before assigning a cause.

## DAG and ownership

One Anti worker proceeds serially; shared generated clients/build dirs/fixtures make extra workers unnecessary. Each package is a thin acceptance checkpoint, not a separate correction round. Anti may fix its own implementation/test errors before handoff. No recursive delegation.

| Package | Depends on | Owned changes |
|---|---|---|
| P0 safe/reliable test harness | none | root/workspace scripts only as needed; `tests/feature/harness/*db-fixture.mjs`; E2E output paths and new integration harness utilities |
| P1 publication/activation | P0 | admin lessons workflow/service/API, ReviewDetailView/LessonsCatalog activation UI; workflow tests; remove manual activation bypass from learner fixture |
| P2 context recovery | P1 | web context DTO/service, new start-selection route, HomeView, CatalogueView; context and UI tests |
| P3 completed-practice feedback | P0 | web lessons DTO/practice service, PracticeSection, focused feedback tests |
| P4 SRS backend | P0 | new web `server/srs/*`, SRS routes, service/route/DB tests; narrow environment docs for signing key |
| P5 SRS UI | P4 | new `/review` page/component, HomeView navigation, SRS UI tests |
| P6 optional sample curriculum | P1,P3 | new sample content module/guarded CLI, sample tests; root script/docs |
| P7 joined acceptance + final evidence | P1–P6 | owned loopback provider/Next/browser/DB runner; whole-flow tests; README/current-task narrow update; evidence |
| R independent Astra review | P7 | source/diff/evidence review only, consolidated findings; Anti gets at most one task-wide correction round |

P3/P4 are logically independent of P1/P2, but do not run concurrent builds/generation/DB fixtures. HomeView ownership passes P2→P5. Treat this document as the task list; do not create duplicate `tasks/` plans.

## P0 — make verification safe and trustworthy

- Inspect scripts before execution; use `scripts/local-test-db.mjs` owned loopback clusters. Override inherited provider/service keys with synthetic values; never print .env, cookies, tokens or real credentials.
- Fix shared canonical `en` fixture race using a DB-native concurrent-safe insert (`ON CONFLICT DO NOTHING`) or equivalent proven-safe fixture mechanism. Keep real concurrent production-service tests concurrent; do not make the aggregate green by serializing/disabling them.
- Reproduce feature package-config failure under controlled single-owner generate/build/test ordering. Inspect writers/import timing. Implement only an evidenced fix. If not reproducible and complete gate passes, document “cause not established”; do not invent a root cause or add retry-to-green. Never edit generated client by hand.
- All screenshot-generating test scripts executed in this task must write to a task/run-specific configurable output dir, or execute in an isolated copy. Fix default E2E historical fixed paths. Do not copy over or delete prior evidence.
- Acceptance: two separate default onboarding runs pass on fresh disposable clusters with real concurrency; aggregate feature executes all chained suites. New evidence output verified; no historical screenshot writes. Preserve first failures in logs.

## P1 — explicit publication and activation

1. Add `makeAvailable?: boolean` to publish input, default **false** for backward-compatible existing callers. UI publish action explicitly sends true and says “Xuất bản và mở cho học viên”. If true, same transaction validates active parent course, valid supported core content (N>=1), publishes revision and updates pointer + availability AVAILABLE. Keep CAS, ownership, review provenance, immutability and successor archive behavior.
2. Provide a narrow existing-lesson activation action for old PUBLISHED+PLANNED or intentionally withdrawn lessons: `POST /api/courses/[courseId]/units/[unitId]/lessons/[lessonId]/activate`, body `{expectedRowVersion}`. Admin ACTIVE only; origin/JSON/strict body checks; hierarchy and pinned active PUBLISHED revision validated; active course, N>=1. It only sets AVAILABLE/increments rowVersion when needed. No unpublish/withdraw feature expansion. Already AVAILABLE matching version is a no-op; stale CAS returns409. UI button in lesson catalog/detail makes activation intent visible; invalid cases show specific409 feedback.
3. Lock order for activation-bearing paths: Account→Course(shared)→Lesson→Revision/review as needed; determine candidate course then lock and revalidate hierarchy. Do not acquire Course after holding Lesson in a way that deadlocks course-deactivation/context selection. Reject inactive course before writes; keep transaction rollback atomic.
4. Remove direct `db.lesson.update({availability:'AVAILABLE'})` bypass after publish in production-workflow fixtures; call publish with explicit true. Keep fixtures directly constructing special negative/concurrency states only where that is the test subject.

Acceptance: entirely new lesson created/assigned/drafted/submitted/approved/published through production services/API becomes visible to learner without direct availability writes; generic publish without flag preserves old contract; old published planned lesson can activate; wrong role/owner/hierarchy, inactive course, stale rowVersion and nonpublished revision fail without partial writes; successor publication retains old completed attempt evidence. Browser exercises activation control. Regression tests must assert source-to-learner connection, not just mocked DTO.

## P2 — safe initial-level selection and recovery

- New DEFAULT create with no eligible AVAILABLE/PUBLISHED lesson returns409 `COURSE_NO_AVAILABLE_LESSONS`, writes no context; UI explains course not yet ready and allows retry after content arrives. SELF_REPORT retains current eligibility checks.
- Add `POST /api/learner/contexts/[contextId]/start`, strict body `{startSource:'DEFAULT',expectedRowVersion}` or `{startSource:'SELF_REPORT',levelId,expectedRowVersion}`. Only existing ACTIVE owned context whose workingLevel/selectedStartLevel/startSource/startResult are null, with no lesson consumption, lesson attempts/completions or assessment attempts/results. Reject inconsistent/history-bearing rows; never change learner/language/course, existing learning evidence, SRS or already-selected level.
- Reuse/extract only the existing initial-level resolver needed for create and recovery; preserve complete lock-set/revalidation guarantees. Account→Course/Language→Context lock, then relevant hierarchy in consistent order; fresh role/status and course availability, CAS token. DEFAULT no eligible content remains409/no mutation. Atomically set initial/working level, source/selfReport and rowVersion. Same payload retry after a single successful selection may return current row when it is provably that selection with no intervening change; otherwise stale409. Do not reopen arbitrary level changes.
- HomeView offers “Chọn trình độ bắt đầu” on legacy null contexts using existing options UI; no automatic mutation on page render. Existing pause/resume behavior remains. Catalogue distinguishes no level from no published lessons at selected level.

Acceptance: create before content fails without row; preexisting null context stays intact until explicit recovery; add available content then recover→open catalogue; foreign/disabled/paused, invalid framework, noneligible level, stale CAS and history-bearing row denied; simultaneous selections converge to one selection/no lost update; pause/resume and unrelated SRS state preserved. Real DB plus UI error/retry checks.

## P3 — useful, bounded feedback after completion

- Preserve in-flight correctness and retry queue/scoring. Add completed-attempt review entries only after successful finalization (also available on owned completed-attempt GET/reload). Build from pinned PRACTICE item revisions and allowlisted grading fields; never reuse assessment-origin items.
- Each entry identifies exercise, learner response(s), correctness, a human-readable correct answer and existing authored explanation if present. MCQ/listening map correct option to text; reorder maps correct IDs to token text; fill/grammar show accepted answer text(s). Render plain text, not raw JSON/HTML. Listening transcript need not be disclosed.
- Before completion, generic catalogue/detail/attempt exercises and active answer responses expose no new answer key or explanation. Private gradingData objects never leave server. Completed historical attempts remain reviewable against pinned content after successor publish; no rewrite of saved grades.

Acceptance: all five types have understandable completed review; explanation from author appears; no secrets in generic/unfinished DTOs, foreign attempts, or assessment data; finalized retry and reload reproduce review; original performance/retry/unlock policy unchanged. UI browser covers wrong answer→retry→finalize→review and reload.

## P4 — minimal due-card SRS service and routes

Use dedicated account-wide review, not a due-list endpoint. Keep production learner verifier and same-origin/private-cache/error conventions. Suggested routes: `POST /api/learner/review/start` (strict empty body) and `POST /api/learner/review/respond` (strict review token, operationKey UUID, rating REMEMBERED|FORGOTTEN). Return one current prompt or done, never an upcoming queue or stage/due schedule.

- Start verifies ACTIVE LEARNER and selects earliest due `(dueAt,id)` from own cards using DB clock, joined vocabulary. No context ACTIVE requirement: global review works with paused contexts. Only after start return current word/meaning/example needed for that flashcard; reveal UI is a learning interaction, not assessment secrecy. Do not return all cards or future words.
- Bind response to server-selected current card, actor, rowVersion and server-generated UUID sessionKey. No existing signed-session primitive exists in current source. Minimal implementation: one server-only HMAC helper using Node crypto and dedicated `LINGORA_SRS_SIGNING_SECRET` (>=32 random bytes; fail503 if absent/invalid); token contains version, actor/card IDs, expected rowVersion, sessionKey and expiry, no schedule or other cards. Short bounded token and timing-safe signature verification; tests supply synthetic key. No general-purpose auth/session framework, new table, production identity bypass or client-selectable card ID. If Anti finds a simpler existing equivalent, retain these boundaries and document it.
- Respond locks fresh account then card; validates selected ownership, due state, rowVersion, active role/status and token/session. Use DB time after locks. Idempotency: existing `(learnerId,operationKey)` with matching canonical input hash returns prior outcome without schedule/history duplication; mismatched reuse409. Handle same token with two operation keys / parallel sessions using card lock+CAS, at most one scheduling update. Retry must not silently overwrite another review.
- REMEMBERED: nextStage=min(priorStage+1,5), nextDue=reviewedAt+[1,3,7,14,30][nextStage-1] days. FORGOTTEN: stage1/+1 day. Update card stage/due/lastReviewedAt/rowVersion and insert immutable SCHEDULE operation with prior/next fields, inputHash, sessionKey, qualifyingLocalDate using account timezone in one transaction. No reinforcement implementation, no second schedule, no lesson completion/score mutation.
- After valid rating, internally choose next currently due own card and issue current-card token in same logical session, or done. If response is lost, retry same operation safely; selected subsequent prompt is not a reserved queue and must be revalidated on submission. Reload may start a new session; completed scheduling remains durable and not due again early. Token expiry/tampering produces explicit restart action, not silent rating loss.

Acceptance: policy table stage1..5 both outcomes, timezone/day boundary, due equality/overdue, future-card rejection, active/foreign/staff/disabled denial, signed token tamper/expiry/key absence, arbitrary field rejection; duplicate same operation and conflicting payload; concurrent submissions/keys yield one history+schedule; rollback after injected history failure preserves old card; paused context allowed, other learners isolated. Real PostgreSQL tests exercise existing constraints. No stage/date/queue in learner DTO. Existing enrolled cards/schedules preserved until valid review.

## P5 — usable SRS screen

- `/review` guarded with existing learner auth; Home navigation exposes “Ôn từ vựng”. Initial view has Start, no preview list. After start: current word/prompt → “Xem nghĩa” → “Đã nhớ / Chưa nhớ”; disable double submits, retain operation key/token across network retries, distinguish stale-session restart from service retry.
- Show empty/done state, progress count for current UI session if useful, and route home. No due dates/stages/future-word list. Refresh keeps persisted schedule; explain starting a new review if transient session was lost.
- Browser checks empty, current prompt/reveal/rate, retry, double click, done, reload and paused-context availability at desktop and narrow mobile (~390px), keyboard buttons/focus/alerts. Use semantic HTML and existing design tokens, no UI framework rewrite.

## P6 — opt-in useful sample curriculum

- New reusable sample content module: one small English A1 unit, **3 ordered required lessons** (greetings, introductions, daily routines), each with short teaching paragraphs, 3–5 contextual core questions, 3–5 vocabulary entries, Vietnamese meanings and authored explanations. Cover MCQ, fill, reorder, grammar across unit. Avoid fake/broken audio URLs; audio demo can be added later with a real approved asset, not required here.
- Populate using existing admin/teacher authoring/review/publication services with supplied active test actor IDs; do not hand-set published/availability flags or invent authorship provenance. Keep canonical seed untouched. Stable sample identity allows a second run without duplicate courses/revisions; mismatched existing sample content fails clearly rather than overwriting. Keep learning history intact.
- Opt-in local sample command must require explicit owned loopback DB marker/URL with exact allowed disposable DB path, never fall back to inherited DATABASE_URL or mutate live DB. Local harness may create synthetic auth.users/accounts only in owned test cluster, separate from reusable curriculum module. No real admin/teacher account creation/provider call.
- Acceptance: default seed unchanged; no command invoked without explicit flag/owned guard; sample visible to learner after authoring workflow; second application idempotent; conflicts non-destructive; unit content coherent enough to learn without external docs. Test core completion unlocks next lesson and enrolls vocab; preserve minimum sample IDs/provenance in evidence.

## P7 — joined local proof and final gates

Build a test-only loopback provider compatible with existing Supabase SSR `getUser`/session flows. Precreate synthetic actors in disposable auth.users/app.accounts and establish valid session cookies via provider fixture or existing login path. This is test setup, **not registration/login feature work**. Production auth modules/routes must remain unchanged; do not add env bypass branches. Reject unexpected external network calls. Do not intercept production learner pages/API or replace DB with mocks in the joined test.

Run built admin/web against the same disposable DB; synthetic provider is the only mocked external boundary. Establish staff sessions, create/assign/draft/submit/approve/publish a new lesson through actual protected API routes (browser UI at least for publication/activation); learner browser selects/recover context, reads, answers, finalizes, reviews explanation, reloads, and opens next lesson. Verify DB completion, response counts, card enrollment. To test due SRS without waiting a day, test fixture may age **only its owned cards** in DB explicitly; then browser Start→reveal→rate→reload proves persisted schedule/history. Never add production time-travel hooks. Include two-learner isolation and anonymous protected-route rejection. Capture new task evidence at desktop/mobile, browser errors and useful DB assertions; do not log auth tokens.

Required commands (root unless noted), each exact exit/log saved:

1. `npm run db:product:validate`; `npm run typecheck`; `npm run build` with synthetic env.
2. `npm run test:feature`; `npm run test:components` complete chains, no skip-to-green.
3. `npm run test:integration:lessons`; `npm run test:integration:practice`; `npm run test:integration:onboarding` (two default fresh-cluster runs for fixture regression); `npm run test:integration:audit -w lingora-admin`.
4. Wire documented `npm run test:integration:srs` and `npm run test:e2e:learning` using safe disposable wrapper/one runtime owner; sample/context/publication real-DB regressions may join relevant existing suites.
5. Existing `npm run test:e2e` with new output dir; `npm run test:smoke:audit -w lingora-admin`; existing confirmation browser as unchanged-auth regression if final full gate warrants its separate build, synthetic only. Sequence builds/tests so confirmation's generated output cannot race other runners.

No need to rerun all gates after every slice; run focused checks at each checkpoint, full chain once integrated, rerun affected checks after a real change. New failure gets retained/diagnosed, not hidden by narrowed command. If unrelated runtime error cannot be fixed within scope, deliver BLOCKED with exact evidence instead of claiming completion.

## Handoff and acceptance

Anti delivery: changed files by package, exact commands/exits, current Git state, evidence paths, remaining issues and any environment setup requirement. Runtime/build ownership stays with Anti until stopped/handed off; stop only own processes. Do not commit/push unless separately instructed. Update README/current-task narrowly to actual shipped behavior and remaining deferred items, preserving previous edits.

Astra review must trace publication→learner without fixture bypass, no-content recovery invariants, completed-only feedback secrecy, SRS operation concurrency and token selection boundary, sample safety/idempotency and joined-test fidelity. Consolidate findings; one task-wide correction round then independent affected-code/integration recheck. Final report distinguishes “core learning MVP passes local acceptance with synthetic auth provider” from production readiness. Explicitly retain deferred registration/login, assessment/level-up, real email/provider, production operation/load/backup and advanced pedagogy.

No unanswered product-scope question remains. Implementation may begin in order P0→P1→P2→P3→P4→P5→P6→P7.
