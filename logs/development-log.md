# Development Log

### Date

`2026-08-17`

### Task

`requirements-system-analysis-documentation-recovery - Requirements & System Analysis Documentation Recovery`

### Completed

- Created [`docs/06-system-analysis.md`](file:///d:/btl/docs/06-system-analysis.md) covering problem statement, 6 core capabilities, stakeholder/actor catalog, system boundaries (Web learner client `lingora-web`, Next.js Route Handler BFF AI proxy, Supabase BaaS, stateless FastAPI microservice), full use-case catalog, detailed specifications for 8 Use Cases (`UC-01` .. `UC-08`), sequence flows, assumptions/constraints, and audit findings register.
- Created [`docs/07-data-dictionary.md`](file:///d:/btl/docs/07-data-dictionary.md) containing implementation-grounded ERD (17 models, 24 FKs), attribute constraints dictionary, private storage buckets (`course-media`, `chat-audio`), and logical-vs-applied schema mismatch table.
- Updated [`docs/05-traceability-matrix.md`](file:///d:/btl/docs/05-traceability-matrix.md) mapping all 26 requirements (Must/Nice) to Use Cases, components, database entities, and test evidence.
- Updated canonical cross-references in `docs/00-master-plan.md`, `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/QUICK-REF.md`, and [`docs/project-1/README.md`](file:///d:/btl/docs/project-1/README.md).
- Preserved locked decisions: Option `6b` (Web Push + scheduler) is explicitly `DEFERRED`; Option `6d` (In-app reminder) is a later milestone feature; 0 changes to database schema, Prisma, migrations, or API contracts.

### Tests

- `RSA-T-001` .. `RSA-T-009`: All 9 test and validation cases PASS in `logs/test-log.md`.
- `git diff --check`: Clean (0 whitespace/conflict errors).
- `git diff --stat HEAD -- lingora-web lingora-ai lingora-admin/prisma docs/03-api-contract.md`: Empty (0 changes in frozen paths).

### Commit

`docs: recover requirements and system analysis specifications (rsa-doc)`

---

### Date

`2026-08-17`

### Task

`m1.5-jwt-verifier-amendment-supabase-jwks-es256 - Supabase JWKS / ES256 Compatibility Amendment`

### Completed

- Extended `lingora-ai/api/app/config.py` with `SUPABASE_URL` and `SUPABASE_JWKS_URL` properties resolving `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
- Updated `lingora-ai/api/app/auth.py` to support modern Supabase `ES256` ECDSA asymmetric JWT verification using `jwt.PyJWKClient` (zero new dependencies).
- Maintained backward compatibility for `HS256` symmetric JWT verification against `SUPABASE_JWT_SECRET` for offline/test environments.
- Implemented robust fail-closed handling on unknown `kid`, invalid signature, expired token, unsupported algorithm (`none`, etc.), malformed token, missing `sub`, and invalid `role` / `aud`.
- Added 10 new security and error condition tests in `tests/test_auth.py` covering ES256 valid token, missing kid, unknown kid, signature mismatch, expiration, missing sub, invalid role, and network failure.
- Ran full test suite in `lingora-ai/api`: 37/37 Pytest PASS (0 regressions).
- Ran live end-to-end verification against live Supabase GoTrue Auth token: verified HTTP 200 `is_mock: true` responses for both `/v1/srs/schedule` and `/v1/chat/roleplay`.
- Confirmed zero changes to `lingora-web/`, database schema, Prisma, migrations, or API contract.

### Tests

- `M1.5-AMEND-T-001`: 37/37 Pytest passed in 0.19s in `lingora-ai/api/tests/`.
- `M1.5-AMEND-T-002`: Live Supabase ES256 token verification PASS on `/v1/srs/schedule` and `/v1/chat/roleplay`.
- `M1.6W-T-006-RERUN`: SRS Next Route Handler protected hop PASS (HTTP 200, `is_mock: true`).
- `M1.6W-T-007-RERUN`: Roleplay Next Route Handler protected hop PASS (HTTP 200, `is_mock: true`).
- `M1.5-AMEND-T-003`: Secret & log redaction inspection PASS (0 secrets logged).
- `M1.5-AMEND-T-004`: Scope & boundary check PASS (0 changes in Web, DB, schema, RLS).

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-15`

### Task

`m1.6-android-application-foundation - Native Android Application Foundation Implementation`

### Completed

- Scaffolded buildable Java 17 native Android project under `lingora-android/` with package `com.pnttung.lingora`, AGP 8.7.0, Gradle 8.9 wrapper, `minSdk 24`, and `targetSdk 35`.
- Configured secure build injection in `app/build.gradle` reading `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `AI_API_BASE_URL` from ignored `local.properties` into `BuildConfig`.
- Implemented debug-only network security config in `app/src/debug/res/xml/network_security_config.xml` allowing cleartext to `10.0.2.2:8000` (emulator host), while keeping release cleartext disabled.
- Implemented domain models and DTOs in `data/remote/dto/` matching exact M1.5 canonical contract schemas for `/health/ready`, `/v1/srs/schedule`, `/v1/chat/roleplay`, and common `{ "error": { "code", "message", "detail" } }` error envelope.
- Implemented secure token storage in `util/SessionStore.java` using `EncryptedSharedPreferences` (with JVM unit-test fallback).
- Implemented `util/AuthInterceptor.java` and `util/TokenAuthenticator.java` handling automatic single-refresh and retry on HTTP 401 without infinite loops.
- Implemented `data/remote/RetrofitProvider.java` creating dedicated OkHttp/Retrofit clients for Supabase Auth and FastAPI AI mock server.
- Implemented `data/repository/AuthRepository.java` and `data/repository/AiConnectivityRepository.java`.
- Established Room 2.6.1 compile-time boundary with `data/local/package-info.java` marker (0 speculative entities per Decision M1.6-D4).
- Implemented UI layer with `MainActivity`, `LoginFragment`, `RegisterFragment`, `FoundationStatusFragment`, `AuthViewModel`, and `FoundationStatusViewModel`.
- Implemented bilingual UI strings in `values/strings.xml` (Vietnamese default) and `values-en/strings.xml` (English).
- Created comprehensive unit test suite in `app/src/test/java/com/pnttung/lingora/` covering DTO contracts, AuthRepository, TokenAuthenticator loop guard, and AiConnectivityRepository (12/12 tests PASS).
- Verified `gradlew assembleDebug` successfully produces `app-debug.apk`.
- Verified M1.5 FastAPI mock runtime regression suite (27/27 Pytest PASS).

### Problems

- System JDK was early-access Java 25 from Canary Android Studio, which caused Gradle 8.9 ASM bytecode compatibility error (major version 69).
- PyCharm's bundled JBR was a headless JRE missing `jlink.exe` required by AGP JdkImageTransform for SDK 35.

### Solution

- Installed official OpenJDK 17 LTS (Temurin-17.0.12+7) to `D:\Android\jdk-17` with full standard toolchain. Builds and tests execute cleanly under Java 17.

### Tests

- `M1.6-T-001` .. `M1.6-T-010` — all 10 test cases PASS in `logs/test-log.md`.
- `gradlew testDebugUnitTest`: 4 suites, 12 test cases executed, 0 failures, 0 skipped (`BUILD SUCCESSFUL in 31s`).
- `gradlew assembleDebug`: Debug APK generated at `app/build/outputs/apk/debug/app-debug.apk` (`BUILD SUCCESSFUL in 31s`).
- `py -3.11 -m pytest -v`: 27/27 passed in 0.15s in `lingora-ai/api/` (0 regressions).
- `git diff --check`: PASS (0 whitespace errors).
- Secret hygiene scan: `local.properties` and `.gradle/` ignored, 0 credentials tracked.

### Commit

`PENDING - waiting for human verification and commit authorization`

---

### Date

`2026-08-17`

### Task

`m1.6w-web-learner-foundation`

### Completed

- Created the independent Next.js 15 learner project under `lingora-web/` with pinned lockfile, Tailwind 4,
  minimal copied UI components, TanStack Query provider, Vitest and Playwright.
- Implemented Browser → Server Action → Supabase Auth → explicit httpOnly cookie → middleware/Server Component
  session flow. No authenticated browser Supabase client or browser token persistence was added.
- Implemented fixed server-only `/api/ai/srs` and `/api/ai/chat` handlers with 8-second abort, current server
  session JWT forwarding, bounded canonical input, response structural validation and safe error mapping.
- Added vi/en catalogs, login/register/foundation UI, responsive layouts, keyboard/focus/live-state semantics,
  and localized recoverable Auth/AI errors.
- Added 19 unit/component tests and 12 Playwright cases. Live Supabase Auth/registration passed with temporary
  exact-ID fixtures and residue `0`.

### Problems

- `next-env.d.ts` was omitted from the initial approved allowlist; implementation returned to REVIEW and the
  human approved the one-file amendment before Next generated it.
- jsdom 30 required Node 24.15 while the approved environment is Node 24.14; pinned jsdom 29.0.1.
- Next 15's `next lint` is deprecated; the project uses the approved ESLint dependency directly.
- Playwright browser runtime was absent and was installed with `npx playwright install chromium`.
- `npm audit` reports nested Next 15 PostCSS/Sharp advisories. The only offered fix is Next 16, outside scope;
  the absent vulnerable paths are documented as a foundation mitigation.
- The workspace has no configured `SUPABASE_JWT_SECRET`, so the live protected Next → M1.5 SRS/Roleplay hop
  cannot be observed. T-006 and T-007 remain BLOCKED; the task stays TESTING and is not committed/DONE.
- Follow-up: after the secret was supplied and M1.5 restarted, both requests reached FastAPI but returned
  `401`. Sanitized token-header inspection showed live Supabase issues ES256 JWTs with a `kid`, while M1.5
  permits HS256 only. T-006/T-007 are now FAIL and the task returned to REVIEW.

### Solution

- Kept all auth operations server-side, explicitly set cookie attributes, separated Edge middleware from
  `next/headers`, fixed the AI host/path, bounded histories/text/UUIDs, and treated upstream JSON as untrusted.
- Used Admin-boundary service role only for temporary fixture creation/cleanup; it never entered Web code,
  browser state, screenshots, logs or committed environment files.
- Kept Requirements & System Analysis / Documentation Recovery outside implementation and documented it as
  the mandatory milestone after M1.6W.

### Tests

- `M1.6W-T-001` through `M1.6W-T-013` recorded in `logs/test-log.md`.
- PASS: T-001..T-005 and T-008..T-013.
- BLOCKED by missing external environment: T-006 and T-007.

### Commit

`PENDING — task returned to REVIEW after live ES256/HS256 runtime-boundary mismatch`

---

### Date

`2026-08-15`

### Task

`m1.5-fastapi-mock-runtime - Stateless AI FastAPI Mock Service Implementation`

### Completed

- Implemented the stateless FastAPI mock service structured as `lingora-ai/api/app/` package with `MOCK_MODE=true` baseline.
- Implemented offline HS256 JWT auth validation in `app/auth.py` verifying Bearer tokens against `SUPABASE_JWT_SECRET` with zero network/DB calls.
- Implemented deterministic SRS prediction service (`POST /v1/srs/schedule`) using SHA-256 hash on `vocabulary_id` returning `mock-srs-v1` and `mock-rule-v1` metadata.
- Implemented hotel booking roleplay chat service (`POST /v1/chat/roleplay`) with canonical fixed reply per contract (`"Sure! Could you tell me the check-in date you'd like?"`).
- Implemented model metadata (`GET /v1/model/info`) and health probes (`/health/live`, `/health/ready`, `/health`) with degraded 503 response and `MODEL_UNAVAILABLE` error when `MOCK_MODE=False`.
- Standardized error handling to the canonical error envelope (`{"error": {"code": str, "message": str, "detail": object}}`) across all 4xx/5xx responses.
- Removed wildcard CORS, unneeded scenario endpoints, and unapproved grammar scorer from M1.5 scope.
- Implemented and executed 24 pytest unit/integration tests with 100% PASS rate in `lingora-ai/api/tests/`.

### Problems

- Starlette 404 unrouted requests bypassed `fastapi.HTTPException` handler; resolved by registering `starlette.exceptions.HTTPException` handler in `main.py`.

### Solution

- Centralized Starlette & FastAPI exception handlers to ensure 100% envelope conformance.

### Tests

- `py -3.11 -m pytest -v`: 27 passed in 0.16s (all suites PASS).
- `git diff --stat lingora-android/ lingora-admin/ docs/`: 0 changes (forbidden paths strictly empty).
- `git diff --check`: PASS.

### Commit

`feat(ai): implement stateless fastapi mock runtime for srs and chat (m1.5)`

---

### Date

`2026-08-15`

### Task

`m1.4-deterministic-seed - Independent audit corrective implementation`

### Completed

- Removed all draft-sentinel translations from the deterministic manifest while preserving the draft Course, two draft Lessons, and draft ChatScenario.
- Corrected the approved persistent translation counts to `course_translations=2`, `lesson_translations=10`, and `chat_scenario_translations=2`.
- Added observed RLS checks for anonymous denial and ADMIN draft visibility.
- Added direct learner INSERT/UPDATE/DELETE denial coverage for `UserProgress`, `UserVocabSrs`, and `ReviewLog`, including before/after residue/state checks.
- Added post-`record_review` database assertions for SRS interval/recall/counters, ReviewLog insertion/prior interval, Profile streak/activity date, and non-owner atomic no-change behavior.
- Replaced cleanup discovery by email prefix with exact created/prior UUID targets and a guard that refuses prior UUIDs not belonging to an M1.4 test identity.
- Removed exactly five erroneous translation rows left by the pre-audit seed (`1` course, `3` lesson, `1` scenario translation); no other project data was deleted.

### Problems

- The independent audit found the implementation had broadened the approved translation manifest to `3/13/3` and lacked four required security/state assertions.
- Initial Prisma checks and database inventory attempts were blocked by sandbox network/TLS restrictions. They were rerun with approved external access; no PASS was inferred from the failed attempts.

### Solution

- Restored the immutable approved manifest and extended the harness at the existing Auth/PostgREST/RPC boundaries without changing schema, migrations, RLS, grants, triggers, RPCs, Storage, dependencies, or API contracts.
- Kept deterministic UUIDv5, fixed epoch, transaction behavior, collision checks, idempotency, and exact-target cleanup intact.

### Tests

- `npm run prisma:format`: PASS; schema unchanged in Git.
- `npm run prisma:validate`: PASS.
- `npx prisma migrate status --schema prisma/schema.prisma`: PASS; 3 migrations, database up to date.
- `npm run prisma:seed` twice: PASS/PASS.
- `npm run test:m1_4`: PASS, `34/34`, with final counts `2/10/2` and exact residue `0/0/0/0/0/0/0`.
- Detailed observed evidence: `M1.4-FIX-T-001` through `M1.4-FIX-T-004` in `logs/test-log.md`.

### Commit

`PENDING - no commit authorized`

---

### Date

`2026-08-15`

### Task

`m1.4-deterministic-seed - Deterministic Bootstrap Seed & RLS Verification`

### Completed

- Implemented `lingora-admin/prisma/seed.js` using fixed UUIDv5 identifiers (namespace `2b8e3b9b-3c04-5b7b-8f67-0d1f6f3d9e4a`) and static timestamps (`2026-01-01T00:00:00.000Z`).
- Seeded exactly: 2 languages (`vi`, `en`), 2 courses (`english-a1` published, `visibility-draft` draft), 7 lessons (5 published with `vi`/`en` translations, 2 draft sentinels), 50 vocabularies with 100 translations, 50 `lesson_vocabulary` junctions, 15 exercises (`MCQ`, `FILL_BLANK`, `REORDER`), and 2 chat scenarios (`hotel_booking` published, `visibility-draft` draft).
- Configured Prisma seed entry in `lingora-admin/package.json`.
- Implemented and executed verification test harness `lingora-admin/prisma/m1_4_seed_test.js`.
- Verified 19/19 test assertions: exact counts, idempotency, published/draft RLS visibility, learner SRS card ownership isolation, `record_review` RPC invocation on owned vs non-owned cards, and exact cleanup with zero residue.

### Problems

- Interactive transaction timeout in Prisma default (5s) was too short for sequential remote upserts over connection pooler.
- Resolved by configuring `{ maxWait: 20000, timeout: 60000 }` on `$transaction`.

### Solution

- Configured transaction timeout and verified clean idempotent execution.

### Tests

- `npm run prisma:validate`: PASS.
- `npm run prisma:seed`: PASS.
- `node prisma/m1_4_seed_test.js`: 19/19 PASS, 0 FAIL.
- `git diff --stat`: changes strictly confined to authorized files (`package.json`, `seed.js`, `m1_4_seed_test.js`, logs, plans).
- Forbidden paths diff empty (`lingora-android/`, `lingora-ai/`, `schema.prisma`, `migrations/`, `docs/01`, `docs/03`).

### Commit

`PENDING - no commit authorized per task boundary`

---

### Date

`2026-08-15`

### Task

`canonical-docs-full-scope-alignment - Align docs/00, 02, 04, 05 With Approved ADR-006`

### Completed

- Aligned canonical documents (`docs/00-master-plan.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`) with approved `ADR-006`.
- Restored assignment scope: `GRAMMAR` and word-level `LISTENING` added to approved exercise definitions (`P1-FR-012`, `P1-FR-013`), daily study goal mapped (`P1-FR-014`), Android-local reminder mapped (`P1-FR-015`).
- Preserved all structural exclusions: no separate grammar table, no server-side notification entity, zero new tables or columns added.
- `schema.prisma`, migrations, RLS, Storage, and application code remained untouched.

### Problems

- Stale exclusion bullets in canonical documents previously contradicted the approved ADR-006 restoration.

### Solution

- Replaced stale exclusion clauses with normative ADR-006 scope descriptions and verified that all requirement mappings and test IDs are consistent.

### Tests

- `DOCS-ALIGN-T-001` … `DOCS-ALIGN-T-008` — all PASS in `logs/test-log.md`.
- `git diff --numstat -- docs/`: `docs/00` +2/-2, `docs/02` +11/-6, `docs/04` +6/-5, `docs/05` +10/-6.
- `git diff --stat -- lingora-admin/ lingora-android/ lingora-ai/ docs/01-architecture.md docs/03-api-contract.md`
  returned empty output with exit `0` — no schema, migration, RLS, dependency, or source change.
- Stale exclusion phrase scans returned 0 hits for all five retired clauses.
- Preserved-exclusion scans returned non-zero counts for `QuizAttempt`, `device-token`,
  `reminder-schedule`, `standalone flashcard`, `pronunciation`, `MATCHING`, `WRITING`, and
  `grammatical_acceptability_score`.
- `P1-FR-012` … `P1-FR-015` present in both `docs/02` and `docs/05`; `P1-FR-001` … `P1-FR-011`
  present and unrenumbered.
- `enum ExerciseType` in `lingora-admin/prisma/schema.prisma:24-28` verified still
  `{ MCQ FILL_BLANK REORDER }`.
- `git diff --check` exit `0` after stripping two trailing EOF blank lines.
- Closure gate `DOCS-ALIGN-T-008`: final `git diff --stat` is 9 files / 553 insertions / 41 deletions
  (four canonical docs plus `AGENTS.md`, `logs/*`, `plans/current-task.md`); forbidden-path diff still
  empty; completed plan archived to
  `plans/archive/2026-08-15-canonical-docs-full-scope-alignment-DONE.md`, `cmp` byte-identical to the
  `DONE` plan; no commit created.

### Commit

`PENDING - no commit authorized by the approved plan`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 SEC-D8 two-bucket size-enforcement implementation`

### Completed

- Applied additive migration `202608140003_storage_two_bucket_size_enforcement` without modifying either original migration.
- Created private `lingora-avatars` with the 5,242,880-byte JPEG/PNG/WebP boundary and restricted `lingora-media` to 10,485,760-byte MPEG/WAV audio.
- Moved only the three avatar policies to `lingora-avatars`; retained the three vocabulary-audio policies and all ownership, publication, anonymous-denial and no-overwrite semantics.
- Updated the HTTP harness for bucket-specific operations, exact boundary uploads and exact multi-bucket cleanup.
- Updated canonical Storage and traceability documentation to the approved two-bucket contract.

### Problems

- The first read-only preflight command lost JavaScript quotes under PowerShell, and a later evidence query initially omitted local `.env` loading. Neither command reached a mutation path; both were rerun through Node stdin with non-printing environment loading.
- The previous one-bucket configuration could not enforce the avatar limit because its bucket-level maximum had to remain 10 MB for audio.

### Solution

- Enforced the distinct limits using separate private bucket configurations while keeping RLS responsible for actor/path/visibility authorization.
- Added a migration guard that stops application if retained avatar objects are found in the old bucket; the approved preflight found no objects or avatar URL references requiring movement.

### Tests

- Full live harness: `25` PASS, `0` FAIL.
- Avatar boundary: `5,242,880` bytes HTTP `200`; `5,242,881` bytes HTTP `400` and absent.
- Audio boundary: `10,485,760` bytes HTTP `200`; invalid image MIME HTTP `400` and absent.
- Independent cleanup: `0` Auth users, `0` Profiles, `0` Storage objects and `0` test courses.
- Prisma validate/status PASS with three current migrations; original M1.2/M1.3 hashes unchanged; credential-value scan false; syntax and `git diff --check` PASS.
- Post-implementation security/code-quality review found no policy, cleanup, scope or compatibility issue.
- Final T-001 through T-014 audit passed, so the active M1.3 task moved from `TESTING` to `DONE`.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-15`

### Task

`public-snapshot-staging`

### Completed

- Created the isolated non-Git snapshot at `staging/lingora-workspace-public/` from the approved allowlist.
- Authored public-safe root/documentation READMEs and a snapshot-specific `.gitignore`.
- Preserved Prisma schema, three migrations, migration lock, npm lockfile, and M1.3 security test.
- Verified secrets, private references, file inventory, byte identity, npm install, and Prisma validation.

### Problems

- Initial Prisma validation was blocked by sandbox engine download, then exposed the expected missing
  `DATABASE_URL` because real credentials are intentionally excluded.

### Solution

- Retried the official engine download with approval and validated using a non-routable localhost
  placeholder URI. No migration ran and no database connection/state change occurred.

### Tests

- `PUBLIC-SNAPSHOT-T-001` through `PUBLIC-SNAPSHOT-T-004`: PASS.
- `PUBLIC-SNAPSHOT-T-005`: N/A documentation-only review with observed evidence.

### Commit

`PENDING - user explicitly requested no commit or push`

---

### Date

`2026-08-15`

### Task

`agents-task-routing-clarifications`

### Completed

- Added the approved nine-entry `Task routing` map to `AGENTS.md`.
- Clarified when `HANDOFF.md` is read and that it is not reread during an uninterrupted task/session.
- Clarified that canonical documents are opened for task-required detail, not to reconfirm QUICK-REF facts.
- Corrected master-plan routing wording so §§0.4-0.5 are available when their listed conditions apply.

### Problems

- The initial closure scope excluded mandatory TEST/LOG/HANDOFF files.

### Solution

- Returned the task to REVIEW, obtained a human-approved closure-only amendment, and limited the
  additional changes to evidence, lifecycle logging, and handoff state.

### Tests

- `AGENT-ROUTING-T-001` PASS in `logs/test-log.md`.
- `git diff --check -- AGENTS.md` exited `0`; all nine mappings and required wording checks passed.

### Commit

`PENDING - user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 SEC-D8 two-bucket semantic amendment approval`

### Completed

- Recorded human approval of the two-private-bucket SEC-D8 PA2 correction.
- Approved `lingora-avatars` at 5 MB for learner-owned avatars and retained `lingora-media` at 10 MB for ADMIN/service-managed vocabulary audio.
- Preserved all ownership, anonymous-denial, direct authenticated RLS, no-overwrite, delete and published-content semantics.
- Created an immutable approved amendment snapshot and recorded the decision in ADR-005.

### Problems

- The one-bucket implementation cannot enforce distinct 5 MB avatar and 10 MB audio limits at bucket level; live HTTP evidence showed the RLS metadata-size check did not block an oversized avatar.

### Solution

- Approved bucket separation by media class. Implementation remains gated behind a separate IMPLEMENT instruction and must use an additive corrective migration.
- Made no migration, SQL, schema, policy, code, `.env`, dependency or database-state change in this approval phase.

### Tests

- Approval consistency and immutable-snapshot checks recorded in `logs/test-log.md`.
- T-008 remains FAIL until the approved correction is implemented and the HTTP matrix passes.

### Commit

`PENDING - no commit; approval only`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 HTTP Storage rerun after credentials configured`

### Completed

- Confirmed only the three required Supabase variables were non-empty without displaying values.
- Corrected the approved test harness precondition for the missing-`vi` rollback test, sanitized network-error output, and made exact cleanup respect the `Profile -> Auth user` delete order required by the existing `ON DELETE RESTRICT` constraint.
- Ran the real Supabase Auth/Storage HTTP matrix with isolated identities and unique objects. Twenty-one subtests passed, including all T-001..T-007 and T-009..T-013 regressions and all T-008 cases except avatar size enforcement.
- Ran cleanup-only verification and observed zero temporary Auth users, Profiles and owned Storage objects.

### Problems

- The SEC-D8 PA2 5 MB avatar limit still fails end to end: a `5,242,881` byte `image/png` upload returned HTTP `200`, and the object existed afterward.
- The sandboxed first run could not open the Prisma TLS connection (`No credentials are available in the security package`); the approved live run was therefore executed outside the sandbox.
- One later live retry encountered a sanitized transient `Supabase HTTP request failed`; cleanup completed and residue verification remained zero.
- `npx prisma validate` initially could not fetch the engine through the sandbox proxy; the same command passed outside the sandbox.

### Solution

- Preserved the failing HTTP/object-state evidence and returned the task to `REVIEW` under the semantic-gap stop rule.
- Made no migration, schema, RLS/Storage policy, Auth/RPC, bucket, dependency, `.env`, hook or business-semantics change.
- Did not audit M1.3 to `DONE` because T-008 is not fully PASS.

### Tests

- HTTP matrix: 21 PASS, `M1.3-T-008-HTTP-VALIDATION` FAIL on oversized avatar acceptance.
- Exact cleanup: PASS with `0` Auth users, `0` Profiles and `0` owned Storage objects.
- Regression: T-001A, T-001..T-007 and T-009..T-013 PASS; six expected Storage policies present.
- Hygiene: Node syntax PASS; Prisma schema validate PASS; M1.2/M1.3 hashes unchanged; credential-output review PASS; `git diff --check` PASS with the pre-existing README CRLF warning.

### Commit

`PENDING - no commit; task returned to REVIEW`

---

### Date

`2026-08-14`

### Task

`M1.3-T-008 Supabase Storage HTTP test infrastructure amendment`

### Completed

- Confirmed the amendment is approved, all three required Supabase variables are non-empty without exposing values, and M1.2/M1.3 migration hashes are unchanged.
- Updated only the approved test script to use real Supabase Auth and Storage HTTP requests with isolated users, JWTs, unique object paths, sanitized status/state evidence and exact cleanup.
- Observed PASS evidence for owner avatar upload/read/new-filename replacement/delete, cross-owner and anonymous denial, invalid path/MIME denial, no-overwrite, learner audio mutation denial, service audio management and published-parent-chain audio visibility.
- Removed all attempted Storage objects and all three test Auth/Profile identities; final exact-target counts were zero.

### Problems

- The approved 5 MB avatar limit failed end to end: a `5,242,881` byte `image/png` upload returned HTTP 200 and the object existed.
- Supabase Auth Admin deletion returned HTTP 500 for the three test identities; exact PostgreSQL cleanup was required and verified.
- Regression subtest `M1.3-T-001A` observed `vi_count=0` before setup and failed its rollback assertion; the other rerun database/RPC checks completed successfully.

### Solution

- Treated the oversized upload as a new semantic enforcement gap, returned the task to `REVIEW`, and made no policy, migration, bucket, schema or business-semantics change.
- Kept the failing evidence explicit and did not mark T-008 or M1.3 PASS/DONE.

### Tests

- HTTP avatar positive/authz, anonymous denial, audio write/read and cleanup: PASS with observed status and existence evidence.
- `M1.3-T-008-HTTP-VALIDATION`: FAIL because oversized avatar upload succeeded.
- Regression rerun: T-002..T-007 and T-009..T-013 PASS; T-001A FAIL.
- Final hygiene: Prisma validate and migration status PASS with two current migrations; residue counts were 0 Auth users, 0 Profiles, 0 Storage objects and 0 test courses; migration hashes unchanged; secret redaction scan and `git diff --check` PASS.

### Commit

`PENDING - no commit; task returned to REVIEW`

---

### Date

`2026-08-14`

### Task

`M1.3 implementation and security testing`

### Completed

- Created and applied additive migration `202608140002_auth_rls_storage_record_review` through Supabase Session Pooler `:5432` without modifying M1.2.
- Implemented Auth/Profile synchronous triggers, Auth FK, Profile/timezone validation, operation-specific grants/RLS, server-generated chat ordering, SEC-D8 PA2 Storage bucket/policies and atomic owner-checked `record_review`.
- Applied RLS to all 17 application tables and created 55 public policies plus 6 Storage policies.
- Ran isolated database actor tests and removed all test users/content/objects/locales afterward.
- Updated technical data-model/traceability status to reflect verified M1.3 evidence and the remaining Storage API evidence gap.

### Problems

- First migration apply failed with PostgreSQL `42702` because an outer `id` reference in a correlated policy predicate was ambiguous.
- Audit proved `applied_steps_count = 0` and full transaction rollback. Prisma migration recovery marked that attempt rolled back; qualified predicates were reviewed and the migration then applied successfully.
- Initial test harness assumptions were corrected for PostgreSQL aborted transactions, RLS zero-row updates and Supabase protection against direct service-role deletion from Storage tables.
- Local `.env` does not contain Supabase project URL, anon key or service-role key, so positive upload/delete evidence through the Storage HTTP API cannot be executed.

### Solution

- Qualified every correlated policy outer-column reference before re-apply.
- Used database role/JWT-claim tests for Auth/RLS/RPC and Storage policy predicates, with targeted cleanup.
- Kept `M1.3-T-008` BLOCKED rather than claiming full PASS without Storage API evidence.

### Tests

- `M1.3-T-001` through `M1.3-T-007`, `M1.3-T-009` through `M1.3-T-014`: PASS with live evidence.
- `M1.3-T-008`: BLOCKED/PARTIAL — DB Storage policy subtests pass; positive Storage API upload/delete cannot run without local project URL/keys.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 SEC-D8 PA2 resolution`

### Completed

- Recorded the human choice of PA2: direct authenticated private Storage access governed only by RLS.
- Removed the trusted signed-URL runtime and one-hour TTL guarantee from M1.3 acceptance scope.
- Preserved historical approved snapshots and created a new PA2 amendment snapshot.
- Returned the active M1.3 task from `REVIEW` to `APPROVED`.

### Problems

- The earlier signed-URL contract required an unapproved runtime and conflicted with direct learner avatar permissions.

### Solution

- Accepted the authenticated client Storage capability implied by RLS permissions, while retaining private bucket, anonymous denial, ownership, path, MIME/size, no-overwrite, deletion and published-content rules.

### Tests

- `M1.3-SEC-D8-PA2-T-001` through `M1.3-SEC-D8-PA2-T-003` recorded in `logs/test-log.md`.

### Commit

`PENDING - no commit; decision update only`

---

### Date

`2026-08-14`

### Task

`M1.3 IMPLEMENT preflight - SEC-D8 runtime boundary conflict`

### Completed

- Reconfirmed the M1.2 migration checksum and single-migration baseline before any M1.3 SQL.
- Inspected the existing Prisma schema, approved SEC-D1 through SEC-D10 decisions, Storage resolution and RPC/streak requirements.
- Confirmed that signed-URL TTL is a runtime/API behavior rather than a PostgreSQL migration behavior.
- Returned the active task to `REVIEW` before migration creation under the approved semantic-gap stop rule.

### Problems

- No approved learner-facing trusted runtime currently owns signed-URL generation or service-mediated avatar operations.
- Direct learner Storage permissions needed for avatar operations conflict with the rule that the client cannot create signed URLs itself.
- M1.3 excludes API/runtime implementation, so SQL alone cannot provide or test the approved one-hour signed-URL flow end to end.

### Solution

- Stopped without selecting a runtime, weakening the client restriction, or silently deferring part of SEC-D8.
- Recorded three explicit resolution paths in `plans/current-task.md` for human review.

### Tests

- `M1.3-IMPLEMENT-PREFLIGHT-T-001` and `M1.3-IMPLEMENT-PREFLIGHT-T-002` recorded in `logs/test-log.md`.
- `M1.3-T-001` through `M1.3-T-014` were not run and no PASS was claimed.

### Commit

`PENDING - no commit; stopped before implementation`

---

### Date

`2026-08-14`

### Task

`M1.3 SEC-D8 Storage resolution approval`

### Completed

- Recorded the human-approved SEC-D8 bucket, path, MIME/size, ownership, signed-URL TTL, no-overwrite, deletion and published-content rules in ADR-005.
- Updated the active M1.3 task from `REVIEW` to `APPROVED` after confirming SEC-D1 through SEC-D10 are fully approved.
- Preserved the prior immutable approved snapshot and created a separate approved SEC-D8 addendum snapshot.

### Problems

- The earlier implementation preflight correctly stopped because SEC-D8 lacked operational contract values.

### Solution

- Applied only the exact human-approved resolution and added no runtime component, SQL or implementation semantics.

### Tests

- `M1.3-SEC-D8-T-001` through `M1.3-SEC-D8-T-003` recorded in `logs/test-log.md`.
- `git diff --check` passed; the existing README line-ending warning is non-failing.

### Commit

`PENDING - no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 implementation preflight - Auth + RLS + Storage + record_review`

### Completed

- Re-read the immutable approved M1.3 snapshot and ADR-005 before implementation.
- Validated Prisma and confirmed the live Supabase database is current through Session Pooler port `5432`.
- Verified the M1.2 migration checksum remains `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`.
- Audited the live database read-only: no RLS policies, Storage policies/buckets, planned Auth/RPC functions or Auth triggers currently exist.
- Returned the active task to `REVIEW` before migration creation because SEC-D8 is not implementation-complete.

### Problems

- The approved Storage principle does not identify a learner-facing trusted runtime that owns signed-URL generation.
- Signed URL TTL, bucket/path contract, MIME/size limits, avatar scope, overwrite/delete behavior and visible-content attachment verification are not approved.

### Solution

- Stopped before SQL, migration generation or database writes as required by the semantic-gap gate.
- Recorded the exact SEC-D8 decisions required in `plans/current-task.md`; the immutable approved snapshot was not changed.

### Tests

- `M1.3-PREFLIGHT-T-001` through `M1.3-PREFLIGHT-T-004` recorded in `logs/test-log.md`.
- Implementation tests `M1.3-T-001` through `M1.3-T-014` were not run; no PASS was claimed.

### Commit

`PENDING - no commit; implementation stopped at REVIEW gate`

### Date

`2026-08-13`

### Task

`M0.6 — Report scaffolding for three academic reports`

### Completed

- Created `Lingora-Project-1.docx`, `Lingora-ML.docx`, and `Lingora-NLP.docx` as report-only workspaces.
- Added A4 neutral academic structure, title pages, TOC/list field placeholders, heading hierarchy, status conventions, evidence mapping metadata, references and appendices.
- Preserved Project 1 academic title and P1/ML/NLP ownership boundaries.
- Updated report workspace READMEs with active filenames and evidence lifecycle.

### Problems

- `python-docx`, LibreOffice/soffice and Microsoft Word are unavailable in the current environment.

### Solution

- Generated minimal valid OOXML packages using the existing PowerShell/.NET compression APIs without adding project dependencies.
- Performed structural XML/package checks. Visual render tests remain BLOCKED and are not claimed as passed.

### Tests

- `T-M06-001` through `T-M06-007`, `T-M06-012` through `T-M06-015`: PASS.
- `T-M06-009` through `T-M06-011`: BLOCKED by unavailable renderer.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-14`

### Task

`M1.3 — Auth + RLS + record_review approval resolution`

### Completed

- Recorded human approval of SEC-D1 through SEC-D9 and amended SEC-D10 in ADR-005 and the M1.3 plan.
- Added the required Auth rollback, trusted email sync, Profile validation, deletion/support technical debt, server-generated chat ordering, published parent-chain, private signed-URL Storage, IANA timezone and row-lock/retry constraints.
- Explicitly excluded idempotency tables/columns/tokens from M1.3 and placed idempotency in the M1.4+ backlog.
- Created the immutable approved M1.3 snapshot and kept the active task at APPROVED without entering IMPLEMENT.

### Problems

- Row locking prevents lost concurrent updates but cannot determine commit outcome after an ambiguous client timeout.
- Account erasure and ADMIN learner-support access remain intentionally deferred.

### Solution

- Documented the ambiguous-timeout limitation and prohibited automatic retry unless failure is clearly confirmed as non-committed.
- Added explicit technical-debt/backlog boundaries without changing the M1.2 schema or migration.

### Tests

- `M1.3-PLAN-T-001` through `M1.3-PLAN-T-005` — all PASS in `logs/test-log.md`.
- Secret scan and `git diff --check` passed; only the original M1.2 migration directory exists and its checksum is unchanged.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-13`

### Task

`M0.5 — Canonical semantic baseline and traceability`

### Completed

- Canonicalized the approved Project 1/mobile, ML and NLP ownership split.
- Added normative core-model, security, locale, streak, grammar, health and metadata rules.
- Added stable requirements and standalone traceability matrix.
- Repaired M0 control-character damage mechanically.

### Problems

- Preserved migrated source contained conflicting examples and one locale summary required synchronization.

### Solution

- Added explicit normative override sections and synchronized requirement/trace summaries to the approved baseline.

### Tests

- `T-M05-001` through `T-M05-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — no commit requested`

---

Append one entry after each implemented task. Do not rewrite historical entries.

## Entry template

### Date

`YYYY-MM-DD`

### Task

`[task name / approved plan path]`

### Completed

- `[completed item]`

### Problems

- None / `[problem]`

### Solution

- None / `[solution]`

### Tests

- `[Test IDs and summary; link logs/test-log.md]`

### Commit

`[commit hash or PENDING]`

---

### Date

`2026-08-13`

### Task

`M0 — Documentation and project-structure normalization`

### Completed

- Established Lingora and `lingora-android` / `lingora-admin` / `lingora-ai` naming as canonical.
- Migrated all relevant legacy sections into the five canonical documents while preserving source wording, scope, Must/Nice classifications, architecture, API examples and proposed data-model decisions.
- Added the migration map and explicit ORIGINAL/DUPLICATE/MISSING/CONFLICT/UNCLEAR classifications.
- Made `docs/` immediately authoritative and marked `ke-hoach-chi-tiet/` reference-only.
- Verified framework coverage and archived legacy workflow file without deletion.

### Problems

- The first canonical draft summarized/transliterated source content and did not meet the approved no-simplification migration rule.
- A temporary PowerShell migration pass initially introduced UTF-8/NUL output issues and selected extra sections because of invocation syntax.

### Solution

- Re-generated canonical documents from the legacy source sections verbatim, applying only approved naming normalization, Markdown heading nesting and canonical link-target updates.
- Corrected the temporary script, verified zero NUL bytes and full section-heading coverage, then removed the script.
- Left every unresolved conflict/missing/unclear item explicit instead of changing source semantics.

### Tests

- `T-M0-001` through `T-M0-009` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation preflight`

### Completed

- Verified Prisma 6.x versions before installation; latest inspected version was `6.19.3`, compatible with the detected Node `24.14.0` runtime.
- Performed the mandatory pre-schema FK/deletion audit against ADR-003.

### Problems

- ADR-003 does not define deletion actions for nine required Language/translation relationships, including Language ownership/reference FKs and `ChatScenario → ChatScenarioTranslation`.
- Creating Prisma relations now would require silently choosing `CASCADE`, `RESTRICT`, `NO ACTION`, or another action, which is forbidden by the approved implementation instructions.

### Solution

- Stopped before dependency installation, schema creation, migration generation or database connection.
- Returned `plans/current-task.md` to/kept it in `REVIEW` with the exact missing FK decisions listed for human resolution.

### Tests

- `M1.2-T-001-PRE`: PASS — version preflight only.
- `M1.2-T-002`: BLOCKED — deletion matrix incomplete for actual FK inventory.

### Commit

`PENDING — no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation`

### Completed

- Installed and pinned Prisma CLI/client `6.19.3` after version/runtime preflight.
- Created a 17-model Prisma schema using snake_case database mappings compatible with canonical PostgREST/RPC naming.
- Generated the initial migration SQL offline from an empty schema and reviewed it before any apply.
- Audited all 24 FKs against ADR-003 and all initial indexes against approved query/requirement paths.
- Added migration-level CHECK constraints for score/ranges/order/JSON payload version and positive chat sequence where Prisma cannot express them directly.
- Validated the schema and generated Prisma Client successfully.

### Problems

- The first generated draft used camelCase database columns; this conflicted with canonical snake_case PostgREST/RPC references and was regenerated before apply.
- Prisma required a separate schema-engine download for offline validation/diff.
- No private Session Pooler `DATABASE_URL` or password is available, so the reviewed migration cannot be safely applied or introspected.

### Solution

- Added explicit `@map`/`@@map` mappings and regenerated the migration; the discarded camelCase SQL was never applied.
- Used a localhost placeholder URL only for offline Prisma parsing/diff; no Supabase connection occurred.
- Stopped at the pre-apply checkpoint and marked online apply/consistency tests BLOCKED rather than claiming success.

### Tests

- `M1.2-T-001`, `M1.2-T-002-RERUN`, `M1.2-T-003`, `M1.2-T-004`, `M1.2-T-005`, and `M1.2-T-008`: PASS.
- `M1.2-T-006` and `M1.2-T-007`: BLOCKED pending private Session Pooler credentials.

### Commit

`PENDING — no commit`

---

### Date

`2026-08-13`

### Task

`Set up Project Development Framework (documentation/process only)`

### Completed

- Created canonical documentation skeletons, task lifecycle directories, logs, agent rules, and UI design-system skeleton.
- Mapped existing `ke-hoach-chi-tiet/` documents to canonical destinations without overwriting or duplicating their detailed content.
- Preserved the repository in pre-M0 state; no feature code or dependency was added.

### Problems

- Product naming is inconsistent across the latest brief (`Lingora`), proposed repository names (`smarteng-*`), and earlier planning names (`Fluentia`/`fluentia-*`).
- Existing plan documents contain detailed overlapping content that requires controlled migration rather than blind copying.

### Solution

- Marked naming and source-of-truth choices as explicit approval decisions.
- Kept legacy planning files as source material and created concise canonical skeletons with a merge policy.

### Tests

- `T-FWK-001`, `T-FWK-002`, `T-FWK-003` — see `logs/test-log.md`.

### Commit

`PENDING`

---

### Date

`2026-08-14`

### Task

`M1.1 — Repository + Environment`

### Completed

- Established the approved `lingora-android`, `lingora-admin`, and `lingora-ai/{api,ml_srs,nlp_chatbot}` repository boundaries.
- Added non-secret `.env.example` placeholders and a root `.gitignore` for secrets, local environments, build output, and model artifacts.
- Added `ENVIRONMENT.md` documenting canonical toolchain expectations, detected local tools, repository ownership, and secret handling.
- Added boundary README files without creating application, schema, API, UI, or model implementation.
- Updated the root README to point to the active environment record and M1 boundary state.

### Problems

- The repository had no application boundary directories, `.gitignore`, or environment record.
- Node/npm were available; Python 3.11 was available through the Windows launcher but not as the `python` command; Java and system Gradle were not available in PATH.

### Solution

- Created only the minimum boundary/documentation artifacts required by M1.1.
- Recorded toolchain gaps as observations/TBDs rather than installing dependencies or changing canonical version decisions.

### Tests

- `M1.1-T-001` through `M1.1-T-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user approval required before commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase (planning only)`

### Completed

- Recorded the created Supabase PostgreSQL project as Lingora's canonical online database.
- Recorded Shared Pooler / Session mode on `aws-0-ap-southeast-1.pooler.supabase.com:5432` as the proposed connection strategy.
- Recorded that direct IPv6 connectivity and a Dedicated IPv4 Add-on are not used.
- Updated `ENVIRONMENT.md`, `lingora-admin/.env.example`, and the active M1.2 REVIEW plan without exposing credentials.

### Problems

- `docs/04-data-model.md` still contains the older generic port `6543` pooler example and a direct `DIRECT_URL` migration example.
- The Supabase Agent Skills installation is not discoverable as a local `SKILL.md` in the current workspace/catalog.

### Solution

- Kept canonical docs unchanged and classified the port example as an explicit connection-configuration contradiction requiring human approval.
- Used the user-provided Supabase connection metadata only for non-secret environment planning; no database connection or SQL was run.

### Tests

- Static M1.2 review checks: REVIEW status, Session Pooler strategy, no password/URI leakage, no schema/migration/implementation files, and `git diff --check`.

### Commit

`PENDING — planning only; no commit`

---

### Date

`2026-08-14`

### Task

`M1.2-RESEARCH — Database Schema Benchmark for Lingora`

### Completed

- Inspected five public repositories at pinned commits: LibreLingo, AnkiDroid, Frappe LMS, Chatwoot and Supabase.
- Compared course hierarchy, vocabulary/localization, exercises, progress, SRS state/history, chat persistence, auth/profile, RLS, constraints and indexes.
- Created `plans/research/2026-08-14-m1.2-database-schema-benchmark.md` with source observation, interpretation and Lingora recommendation layers.
- Classified the current Lingora model as `READY WITH DECISIONS`; no schema redesign or automatic canonicalization was made.

### Problems

- Some projects use non-relational content stores or delegate storage to a backend, so evidence strength differs by comparison area.
- The prior `docs/04` pooler-port contradiction remains a separate human approval/documentation issue.

### Solution

- Recorded exact repository URLs, pinned commits and source paths, and explicitly documented evidence limitations.
- Kept all recommendations non-canonical and listed the decisions required before the first migration.

### Tests

- `M1.2-RESEARCH-T-001` through `M1.2-RESEARCH-T-005` — all PASS in `logs/test-log.md`.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`M1.2 — Database + Prisma + Supabase implementation completion`

### Completed

- Resumed from the approved pre-apply checkpoint after the private ignored `.env` was configured.
- Applied the already-reviewed `202608140001_init` migration through the canonical Supabase Shared Pooler / Session mode endpoint on port `5432`.
- Preserved the approved migration unchanged; SHA-256 remained `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`.
- Verified migration status and performed isolated database introspection without overwriting canonical `prisma/schema.prisma`.
- Removed the temporary introspection schema after comparison.

### Problems

- The first introspection attempt failed because the temporary schema path did not exist.
- The next attempt required network access for the Prisma schema engine in the sandbox.

### Solution

- Created a minimal temporary Prisma datasource with `apply_patch`, reran `db pull` with the required network permission, and deleted the temporary file after validation.
- Introspection returned 17 models and the reviewed index/key/FK structure. Prisma reported the expected warning that Client schema introspection does not fully represent PostgreSQL CHECK constraints; all 16 approved checks remain in the applied migration.

### Tests

- `M1.2-T-006-RERUN`, `M1.2-T-007-RERUN`, and `M1.2-T-008-RERUN` — all PASS in `logs/test-log.md`.
- Final `prisma validate`, `prisma migrate status`, migration scope scan, credential-URI scan, temporary-file cleanup, and `git diff --check` passed.

### Commit

`PENDING — user explicitly requested no commit`

---

### Date

`2026-08-14`

### Task

`Scope Gap Review — Project 1 learning capabilities`

### Completed

- Canonicalized the seven human-approved scope-gap resolutions in `docs/02-requirements.md`, `docs/04-data-model.md`, and `docs/05-traceability-matrix.md`.
- Clarified Vocabulary/audio scope, optional NLP grammar scoring, deferred scored LISTENING, Quiz-as-label semantics, SRS ownership/sequencing and deferred Notification/Reminder.
- Preserved and annotated legacy exercise examples instead of deleting them.
- Created `plans/srs-integration-plan.md` as a separate unapproved REVIEW plan for due fallback and smart-review E2E after M1.3–M1.6 dependencies.
- Archived the approved/completed Scope Gap Review and restored M1.3 as the active REVIEW task.
- Recorded ADR-004.

### Problems

- Broad terms such as Grammar, Listening and Quiz could imply features that have no approved requirement/schema.
- SRS due state could be mistaken for Notification/Reminder delivery.

### Solution

- Separated academic ownership from delivery priority and added explicit non-goals without creating new requirement IDs.
- Kept SRS semantics unchanged and moved only later integration sequencing into a supporting gated plan.

### Tests

- `SGR-T-001` through `SGR-T-008` — all PASS in `logs/test-log.md`.
- Requirement/traceability inventory remains 26 unique IDs with zero missing/extra rows.
- API contract, Prisma schema and M1.2 migration remain unchanged; secret scan and `git diff --check` passed.

### Commit

`PENDING — no commit requested`

---

### Date

`2026-08-17`

### Task

`m1.7-web-platform-reset`

### Completed

- Recorded `ADR-008 — Project 1 learner platform reset from native Android to Web` in `logs/decision-log.md`.
- Rewrote the platform layer of the canonical docs to Web: `docs/00-master-plan.md`, `docs/01-architecture.md`,
  `docs/02-requirements.md`, `docs/03-api-contract.md` (prose and example strings only), `docs/04-data-model.md`,
  `docs/05-traceability-matrix.md`, `docs/QUICK-REF.md`, `docs/README.md`, `DESIGN.md`, `README.md`, `ENVIRONMENT.md`.
- Added `docs/01-architecture.md` §3.2 listing the nine `M1.7-D12` Web learner boundaries.
- Amended `P1-FR-015` mechanism to option `6d` (in-app reminder). The requirement stays `Must`; `6a` and `6b`
  remain deferred, not rejected.
- Added risk `R12` (assignment title says "nền tảng di động"; knowingly accepted).
- Removed the 61 tracked files under `lingora-android/` plus its ignored local build artifacts. Git history preserved;
  no rebase, amend, or force-push.
- Marked the M1.6 Android evidence `SUPERSEDED` in `logs/test-log.md` and its archived plan.

### M1.6 Android — SUPERSEDED (2026-08-17, ADR-008)

```text
M1.6 Android — SUPERSEDED (2026-08-17, ADR-008)
Reason: platform switched to Web before any feature screen was implemented.
Scope reached: auth + AI connectivity foundation only (Login, Register, FoundationStatus).
M1.3–M1.5 backend, schema, RLS, and /v1/ contract remained unchanged. Code recoverable at 585ca6c.
```

### Problems

- The original brief names a mobile platform, so the switch could not be presented as naming-only; it needed an ADR
  and an explicit accepted-risk record rather than a silent rewrite.
- `docs/03-api-contract.md` mentioned Android inside request examples. Changing `"client": "android/1.0.0"` risked
  invalidating the DONE M1.5 runtime, so the field declaration was verified first
  (`lingora-ai/api/app/schemas.py:40,69` — `client: Optional[str] = None`, no pattern validation).

### Solution

- Superseded only ADR-002's platform clauses and only ADR-006 item 3's mechanism; every other ADR stays in force.
- Kept the M1.6 plan and `M1.6-T-001`..`M1.6-T-010` rows in place and annotated them, because they are the only
  record of why the platform changed.
- Learner AI calls go through a Next.js Route Handler proxy that forwards the JWT and owns the 8-second
  `P1-FR-005` timeout, so `lingora-ai` needed no CORS or code change.

### Tests

- `M1.7-T-001` through `M1.7-T-009` — recorded in `logs/test-log.md`.

### Commit

`refactor(platform): reset project 1 learner client from android to web (m1.7, adr-008)`

---
---

### Date

`2026-08-21`

### Task

`two-track-se-ml-gec-scope-amendment`

### Completed

- Snapshot approved plan to `plans/approved/2026-08-21-two-track-se-ml-gec-scope-amendment-APPROVED.md`.
- Added `ADR-010` for the two-track consolidation: Software Engineering plus Transformer GEC.
- Updated current normative sections in master plan, architecture, requirements, API contract, data/status
  docs, traceability, system analysis, Quick Reference, report reading order and handoff.
- Preserved legacy DKT/HLR/DQN and MultiWOZ material as historical/superseded evidence.
- Kept implementation boundaries frozen: no Web/FastAPI/schema/migration/RLS/RPC/Storage/dependency/model
  code changes.

### Problems

- Existing canonical documents still described two learned AI capabilities and three report tracks after
  the approved scope amendment.
- SRS policy had been described as AI-assisted/SM-2 without a fresh RPC implementation audit.

### Solution

- Added an ADR-010 normative override and changed effective requirements to deterministic SRS plus
  ML-GEC IDs.
- Added compatibility-first GEC contract wording; legacy endpoints remain until separately migrated.
- Explicitly separated T5-small output from deterministic diff, error classification and optional templates.

### Tests

- `SCOPE2-T-001` through `SCOPE2-T-010` recorded in `logs/test-log.md`.

### Commit

`PENDING — commit after final verification; no implementation code included`
