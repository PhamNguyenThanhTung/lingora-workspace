# Anti Handoff — Slice 10: Learner Lesson / Progress Foundation

STATUS: DELIVERED

## CHANGED FILES

- `lingora-web/src/server/lessons/dto.ts`: Zod schemas and TypeScript interfaces for LessonCatalogue, LessonDetail, LessonReading, ConsumptionPostInput, and safe projections.
- `lingora-web/src/server/lessons/service.ts`: Core learner lesson service (`loadLearnerCatalogue`, `loadLearnerLessonDetail`, `getLessonReading`, `mutateLessonConsumption`) with strict ACTIVE checks, owned context guards, canonical gating resolver (`LessonCompletion` evidence only), parent shared locks (`Course FOR SHARE`, `LearningContext FOR SHARE`, `Lesson FOR SHARE`), specific consumption row exclusive lock (`FOR UPDATE`), database `clock_timestamp()` once after locks, safe projections (no grading secrets / assessment items leaked), and publication precondition validation before writes or idempotent returns.
- `lingora-web/src/app/api/learner/contexts/[contextId]/lessons/route.ts`: API route for learner lesson catalogue. Strict UUID validation, rejects unexpected query parameters (400), enforces auth and returns safe catalogue DTO with private, no-store headers.
- `lingora-web/src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/route.ts`: API route for safe published lesson detail. Strict UUID validation, rejects query parameters (400), canonical lock checks, returns safe detail DTO.
- `lingora-web/src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/consumption/route.ts`: API route for reading consumption GET and POST mutations. Enforces same-origin (403), application/json (415), strict schema (400), executes interactive transaction, returns safe reading DTO.
- `lingora-web/src/app/home/HomeView.tsx`: Links each actionable active context (`ctx.status === 'ACTIVE' && ctx.course.isActive`) to `/learn/[contextId]` via "Vào học" button.
- `lingora-web/src/app/learn/[contextId]/page.tsx`: Production page loader for learner course catalogue.
- `lingora-web/src/app/learn/[contextId]/CatalogueView.tsx`: Catalogue UI component rendering ordered units, lessons, badges ("Chưa đọc", "Đang đọc", "Đã đọc", "Khóa"), empty/null working level state, and unlocked navigation links.
- `lingora-web/src/app/learn/[contextId]/[lessonId]/page.tsx`: Production page loader for lesson reader player.
- `lingora-web/src/app/learn/[contextId]/[lessonId]/LessonPlayerView.tsx`: Lesson player UI component with explicit "Mở nội dung" player button, actual POST start callback, content revelation upon start, "Hoàn thành đọc nội dung" POST complete callback, state reconciliation from returned DTO, explanatory non-grade wording, safe read-only rendering of 5 exercise types (MCQ, FILL_BLANK, REORDER, LISTENING with audio error handling, GRAMMAR) without answer submission or HTML injection, and vocabulary displaySnapshot rendering.
- `lingora-web/package.json`: Registered new feature and component tests into `test:feature` and `test:components` scripts.
- `lingora-web/tests/feature/harness/learner-fixture.mjs`: Enriched mock fixture with predicate-based filters for units, lessons, exercises, vocabulary links, completions, and consumptions.
- `lingora-web/tests/feature/harness/production-modules.mjs`: Added esbuild compilation entry points for new pages and API routes.
- `lingora-web/tests/feature/harness/isolated-harness-entry.tsx`: Added CatalogueView and LessonPlayerView rendering to isolated harness entry.
- `lingora-web/tests/feature/harness/isolated-server.mjs`: Added HTTP routing for `/learn/:contextId`, `/learn/:contextId/:lessonId`, and learner API routes.
- `lingora-web/tests/feature/lessons.test.mjs`: Feature tests covering server success/denial matrix (401, 403, 404, 409), strict mutation validation, republish X -> Y stale precondition, canonical gating resolver (`LessonConsumption` alone does NOT unlock sequential lessons), safe projections, and mandatory mutation controls A–G.
- `lingora-web/tests/feature/lesson-pages.test.mjs`: Playwright browser and production page integration tests covering full `/home` -> `/learn/[contextId]` -> `/learn/[contextId]/[lessonId]` flow, Mutation F control (actual production callback), content revelation upon start, completion lifecycle, refresh persistence, stale 409 reload, audio error handling, and catalogue lock persistence.
- `lingora-web/tests/feature/lesson-concurrency.test.mjs`: Loopback local DB integration test testing concurrency across simultaneous start/complete transactions, database `clock_timestamp()` usage, shared parent locks across learners, and context identity guard (`guard_learning_context_immutable_identity`).

## TESTS

1. `lingora-web/tests/feature/lessons.test.mjs` (23 tests — all PASS)
   - 401 unauthenticated denial across all catalogue, detail, consumption routes
   - 403 inactive account (DISABLED, PENDING) and non-learner roles (TEACHER, ADMIN)
   - 403 paused context denial
   - 404 inaccessible contextId and lessonId
   - 409 inconsistent joins (course language mismatch, framework mismatch)
   - 200 null workingLevel non-actionable state with empty units and clear message
   - 200 catalogue ordered units, lessons, badges and lock states
   - Canonical Gating: LessonConsumption does NOT unlock sequential lessons; only LessonCompletion unlocks
   - Safe Projections: Detail DTO contains exact promptData and displaySnapshot; never leaks grading secrets, feedback, answer keys, or assessment items
   - POST consumption: rejects foreign origin (403 FORBIDDEN_ORIGIN)
   - POST consumption: rejects non-JSON content-type (415 UNSUPPORTED_MEDIA_TYPE)
   - POST consumption: rejects malformed JSON (400 MALFORMED_JSON)
   - POST consumption: rejects unexpected body fields (400 VALIDATION_ERROR)
   - POST consumption: complete when NOT started returns 409 CONSUMPTION_NOT_STARTED (never fabricates start)
   - POST consumption: start creates IN_PROGRESS version 1; duplicate start is idempotent (200, unchanged timestamps/version)
   - POST consumption: complete transitions to COMPLETED version 2; duplicate complete is idempotent (200, unchanged timestamps/version)
   - Republish X -> Y: stale expectedPublishedRevisionId returns 409 PUBLICATION_CHANGED before any write
   - Mutation A Control: exact activeRevisionId pointer used (not latest revision)
   - Mutation B Control: context ownership strictly enforced (foreign owner returns 404)
   - Mutation C Control: consumption ownership strictly enforced
   - Mutation D Control: ACTIVE status guard prevents access when context paused or course inactive
   - Mutation E Control: lesson availability guard rejects PLANNED / unavailable lessons
   - Mutation G Control: child snapshot isolation excludes assessment items and preserves promptData

2. `lingora-web/tests/feature/lesson-pages.test.mjs` (5 tests — all PASS)
   - Production Navigation: `/home` -> enterContextBtn -> `/learn/[contextId]` catalogue renders units, lessons and lock states
   - Mutation F Control & Production Callback: "Mở nội dung" sends start -> reconciles to "Đang đọc" -> reveals content -> "Hoàn thành đọc nội dung" sends complete -> "Đã đọc"
   - Stale publication error: 409 PUBLICATION_CHANGED displays safe reload prompt
   - Audio failure handling: Listening exercise handles audio error gracefully without crashing
   - Gating persistence on catalogue: Completing reading on Lesson 1 does NOT unlock Lesson 2 without LessonCompletion

3. `lingora-web/tests/feature/lesson-concurrency.test.mjs` (4 tests — all PASS on embedded-postgres 17.11)
   - Local DB: Simultaneous starts across concurrent transactions create exactly 1 row with row_version=1
   - Local DB: Simultaneous completions increment row_version exactly once and use post-lock clock
   - Local DB: Shared parent locks permit concurrent readers without blocking across learners
   - Local DB: Context identity guard prevents learner/course reassignment once consumption exists

## EVIDENCE

- Command: `npm run typecheck`
  - CWD: `/home/tung/workspace/school/project1/lingora-workspace/lingora-web`
  - Exit code: 0
  - Output: `tsc --noEmit` clean, 0 type errors.

- Command: `npm run test:all`
  - CWD: `/home/tung/workspace/school/project1/lingora-workspace/lingora-web`
  - Exit code: 0
  - Output:
    - `npm run test:feature`: 86 tests passed across 9 suites (0 failures, 0 skipped).
    - `npm run test:components`: 22 tests passed across 3 test files (0 failures, 0 skipped).
    - Total: 108 tests passing.

- Command: `npm run build`
  - CWD: `/home/tung/workspace/school/project1/lingora-workspace/lingora-web`
  - Exit code: 0
  - Output: Next.js 16.4.3 production build succeeded, client and server routes compiled.

- Command: `node --test tests/feature/lesson-concurrency.test.mjs`
  - CWD: `/home/tung/workspace/school/project1/lingora-workspace/lingora-web`
  - Exit code: 0
  - Output: 4 tests passed against disposable embedded PostgreSQL 17.11 instance.

## BLOCKER

None. All interfaces, access controls, canonical gates, mutation semantics, production UI and test suites delivered in accordance with the approved Slice 10 specifications.
