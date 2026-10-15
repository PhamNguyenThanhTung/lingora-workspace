# Decision Log

## ADR-014 — Software Engineering Core & AI Supporting Capability Architecture (Superseding ADR-010 Two-Track Delivery)

### Date

`2026-09-14`

### Category

`runtime-boundary`

### Context

ADR-010 previously consolidated project scope into "two academic tracks": Software Engineering and a Machine Learning track focused on T5-small GEC fine-tuning. However, maintaining ML as a parallel research track created architectural friction, ambiguity in system boundaries, and unnecessary complexity (e.g. pressure to self-train models, manage research pipelines, or treat GEC as equal in scope to the entire learning platform).

Under the Phase 0 Rebuild, the product architecture is formally clarified: **Software Engineering is the CORE system**, while **AI is a SUPPORTING CAPABILITY**.

### Decision

1. **Software Engineering is Primary / Core:**
   - The core deliverable of Lingora is a complete, reliable, modern language learning web application: Auth, RBAC (6 canonical roles), Courses, Units, Lessons, Exercises (MCQ, Fill-in-the-blank, Reorder), Learning Progress tracking, Spaced Repetition System (SRS), Content Management & Review Workflow (6 lifecycle states: Draft → In Review → Changes Requested → Approved → Published → Archived), Content Publishing, Account Management, Operations/Support, Security, and Deployment.
2. **AI is a Supporting Capability:**
   - AI/ML is not a parallel, independent research track.
   - Grammatical Error Correction (GEC) is a supporting feature/service that assists learners with sentence-level feedback during scenario writing exercises.
3. **Flexible AI Model / Provider Abstraction:**
   - GEC does NOT require training from scratch or fine-tuning models locally (e.g. no mandatory self-trained T5-small pipeline).
   - GEC can be fulfilled via a pretrained model, a containerized open-source checkpoint, or an external API provider.
   - The underlying model or inference provider may be swapped at any time behind the service abstraction without impacting the core web application or database architecture.
4. **Historical Preservation:**
   - ADR-010, ADR-002, ADR-003, ADR-004, ADR-006, and all earlier plans and logs remain preserved in repository history for academic auditability.
   - Obsolete research tracks (DKT-LSTM, HLR, DQN, MultiWOZ generative dialogue) remain explicitly superseded and archived.
5. **Architectural Decoupling:**
   - The core learning platform functions 100% independently of the AI service. If the AI service is unreachable or degraded, core learning (courses, units, lessons, exercises, progress, and deterministic SRS) continues without interruption.

### Consequences

- Developers and agents will focus on delivering the core Software Engineering platform first.
- The AI API in `lingora-ai/api/` is maintained as a lightweight, stateless supporting service implementing standard contracts (`/health/*`, `/v1/model/info`, and target `/v1/gec/correct`).
- Complex ML training pipelines, model artifacts, and datasets are removed from active runtime scope.

---

## ADR-012 — Phase 0 product-design reset

### Date

`2026-09-07`

### Category

`scope-ambiguity`

### Decision

1. Pause feature implementation and return the active task to Phase 0 survey and requirements finalization.
2. Use `docs/phase-0-survey-requirements.md` as the new draft product-design baseline.
3. Treat earlier implementation-first plans as superseded instructions, while preserving approved/archive records and Git history.
4. Do not update PPTX deliverables until Phase 0 is approved.

### Consequences

Existing code is not deleted or expanded by this decision. Each early-built feature must be classified against the new MVP before implementation resumes.

## ADR-011 — Global Terminology Replacement for Pure Software Engineering Deliverables

### Date

`2026-08-23`

### Category

`scope-ambiguity`

### Context

To maintain pure Software Engineering (Project 1) academic standards across all deliverables presented to lecturers and evaluators, all references to AI/ML/NLP/GEC/T5-small acronyms and labels must be replaced with standard software engineering and technical terms across all student-facing deliverables (Word reports, PPTX presentation decks, PlantUML diagrams, and Markdown reports).

### Decision

1. Remove 100% of acronyms and terms: `GEC`, `T5-small`, `AI`, `ML`, `Machine Learning`, `NLP`, `Trí tuệ nhân tạo`, and `AI Service` from all deliverable files.
2. Standardize target terminology:
   - "GEC" / "Grammatical Error Correction" -> "Kiểm tra ngữ pháp" (Grammar Checker).
   - "T5-small" -> "Thuật toán xử lý văn bản" (Text processing algorithm).
   - "UC-06" title -> "UC-06: Luyện viết tình huống và kiểm tra ngữ pháp" (Practice Scenario Writing & Grammar Check).
   - "AI Service" / "GEC Module" -> "Mô-đun kiểm tra ngữ pháp nội bộ" (Internal Grammar Module).
3. UC-06 description standard: "Người học nhập câu tiếng Anh, hệ thống gọi mô-đun kiểm tra ngữ pháp nội bộ để đối chiếu và trả về câu đã sửa lỗi."
4. Maintain exactly 2 external system actors (`Learner`, `Admin`) with all grammar checking modeled as internal system processing.
5. Automated validation: All deliverables must pass automated regex scanning with 0 violations.

---

## ADR-010 — Two-track consolidation: Software Engineering + Transformer GEC

### Date

`2026-08-21`

### Category

`scope-ambiguity`

### Context

LINGORA's previous baseline split academic ownership across Project 1, an ML SRS track
(DKT-LSTM/HLR), and an NLP roleplay track (Transformer/T5-small on MultiWOZ). The human approved a
narrower two-track delivery: Software Engineering plus one learned capability, English Grammatical
Error Correction (GEC) with T5-small. The product still must cover the six assignment capabilities,
but the SRS scheduling policy no longer needs a learned model and scenario practice no longer claims
open-domain or generative dialogue.

The completed M1.2-M1.6W implementation remains valid evidence: 17 Prisma models, RLS/RPC/Storage,
FastAPI JWT verification, mock SRS/roleplay endpoints, and fixed Next.js AI proxies. This decision
changes the target baseline and future roadmap; it does not rewrite or invalidate the historical fact
that those endpoints and tests were implemented.

### Decision

1. Consolidate the current target into two academic tracks:
   - Project 1 / Software Engineering: Web learning platform and deterministic rule-based SRS.
   - Machine Learning / Deep Learning: T5-small fine-tuned for English GEC.
2. Supersede DKT-LSTM, HLR, DQN and MultiWOZ dialogue generation as future target scope. DKT/HLR are
   learned SRS approaches, not reinforcement learning; DQN is the rejected RL proposal.
3. Replace generative roleplay as a target with scenario-based writing practice driven by ordered
   prompts/state transitions. The model corrects learner text; it does not own dialogue progression.
4. Keep all 17 Prisma models and existing schema, migrations, RLS, RPC and Storage unchanged for MVP.
   GEC results are transient. Reuse of ChatSession/ChatMessage for writing history requires a later
   semantics decision and is not implied by this ADR.
5. Retain UserVocabSrs, ReviewLog and record_review. Describe the policy as deterministic rule-based
   SRS until an implementation audit proves exact SM-2 compatibility.
6. Adopt a proposed authenticated `POST /v1/gec/correct` contract. T5-small owns only
   `corrected_text`; deterministic alignment owns edits; ERRANT-compatible/rule mapping owns error
   types; suggestions/explanations are optional derived modules.
7. Preserve Browser -> fixed Next.js Route Handler -> stateless FastAPI and existing httpOnly/JWT/RLS
   boundaries. FastAPI performs no primary learner-data operations.
8. Migrate consumers before deprecating `/v1/chat/roleplay` or `/v1/srs/schedule`. Removal requires a
   later approved cleanup task.
9. Use warm CPU p95 <= 2,000 ms as an evaluation target, with cold start reported separately and the
   existing 8-second Route Handler timeout retained. No target is marked PASS without observed output.
10. Preserve all previous ADRs/plans/logs as historical evidence. Where this ADR conflicts with the
    future target scope of ADR-002/003/004/006/008, ADR-010 is the effective scope override; their
    security, platform, data ownership and reminder decisions otherwise remain in force.

### Reason

The previous plan required two unrelated learned systems, separate datasets and evaluation protocols,
and three reports from one developer. A single GEC research track creates a coherent product flow,
uses the already-proven Web/FastAPI boundary, and removes the unsupported claim that a new application
can personalize SRS using models trained on mismatched public interaction data.

### Alternatives considered

- Keep all three tracks: rejected due to scope and evaluation risk.
- Replace SRS with DQN: rejected because no real long-term learner interaction data or defensible reward
  model exists.
- Keep generative chatbot and add GEC: rejected because it retains two NLP behaviors and ambiguous
  evaluation ownership.
- Add writing_submissions immediately: rejected for MVP because transient feedback satisfies the new
  flow without a schema/RLS migration.
- Delete legacy endpoints immediately: rejected because Web/FastAPI code and tests still consume them.

### Consequences

- Positive: one learned model, one dataset/evaluation family, clearer report ownership and smaller
  deployment risk.
- Negative/trade-off: the canonical documentation and roadmap require broad amendment; existing mock
  endpoints become compatibility surfaces until later migration.
- Follow-up: documentation amendment first, followed by separately approved GEC API, SRS audit,
  scenario UI, training/evaluation, deprecation and cleanup tasks.

---

Use this append-only log for architecture, dependency, schema, API, model, scope, or other durable technical decisions. Routine implementation details do not require an ADR.

### ADR-ID

`ADR-003 — M1.2 database semantics before first migration`

### Date

`2026-08-14`

### Context

The M0.5 logical baseline deliberately deferred concrete database semantics for lesson progress, FK deletion, vocabulary identity, publication validation, Exercise JSON validation, ReviewLog provenance, chat ordering, ADMIN representation, indexes and the Supabase/Prisma connection strategy. A five-project source benchmark concluded `READY WITH DECISIONS`, after which the human reviewed DB-D1 through DB-D10.

### Decision

- `UserProgress.score` is a nullable integer percentage `0–100`. M1.2 stores only one lesson-level aggregate per `(userId, lessonId)`. Exercise completion and aggregate calculation belong to a trusted application/service layer; no attempt/session table is introduced. Completion writes are atomic and idempotent.
- FK deletion is governed relationship by relationship. Pure dependent translations/junctions may cascade only where explicitly listed. Normal content deletion must not remove `UserProgress`, `UserVocabSrs`, or `ReviewLog`. Published/referenced content is normally unpublished/archived; account-related deletion requires an explicit account-deletion workflow.
- All approved locale columns are real FKs to `Language.code`. `Language → Course`, `Language → Vocabulary`, `Language → Profile.uiLocale`, `Language → Profile.nativeLangCode`, and Language → Course/Lesson/Vocabulary/ChatScenario translations use `RESTRICT`. `ChatScenario → ChatScenarioTranslation` uses `CASCADE`.
- Vocabulary identity is unique by `(languageCode, normalizedTerm)`. Normalization is deterministic and shared by Admin validation, seed and trusted application writes. No alias/sense/lemma tables are added.
- Draft content may be incomplete. Publication requires an approved `vi` or `en` translation and valid required child content. Publication occurs through a trusted write path rather than UI-only validation.
- Exercise remains `type + JSONB payload` for `MCQ`, `FILL_BLANK`, and `REORDER`, with versioned type-specific trusted validation and practical database safety checks.
- ReviewLog remains minimal. API inference metadata does not automatically imply persistence. Optional ML-evaluation provenance fields are deferred unless a canonical persistence requirement is approved; no full model input/output or ML-specific table is added.
- ChatMessage uses a positive per-session sequence with unique `(sessionId, sequenceNumber)` for deterministic order. Grammar/naturalness score is not persisted.
- Profile uses the minimal database-controlled role enum `LEARNER | ADMIN`, default `LEARNER`. Clients cannot change roles; generalized RBAC is not introduced.
- Initial indexes are limited to approved uniqueness/order/ownership/due/history/chat query paths and must be rechecked against actual Prisma queries and requirements before migration.
- Supabase PostgreSQL is canonical. Prisma uses Shared Pooler / Session mode at port `5432` through private `DATABASE_URL`. Direct IPv6 and Dedicated IPv4 are not used; `DIRECT_URL` remains unset under this strategy.

### Reason

These decisions make the first migration implementable without expanding the approved product scope. They preserve learner history, make progress and ordering deterministic, retain the current compact Exercise/SRS model, and avoid speculative ML or authorization schema.

### Alternatives considered

- Add exercise-attempt/session history now: deferred because no canonical Must requirement requires it.
- Cascade all dependent records: rejected because normal content deletion could destroy learner history.
- Use global `UNIQUE(term)` or course-scoped vocabulary: rejected in favor of learned-language identity and reuse.
- Persist all API/model metadata in ReviewLog: rejected because runtime response metadata does not prove a persistence requirement.
- Introduce generalized roles/permissions tables: rejected as unnecessary for `LEARNER` and `ADMIN` scope.
- Use direct IPv6 or buy Dedicated IPv4: rejected by the approved Supabase connection strategy.

### Consequences

- Positive: M1.2 has an approved semantic baseline suitable for a separately approved Prisma/migration implementation task.
- Negative/trade-off: lesson attempt history, richer vocabulary senses, generalized RBAC and ML observability remain unavailable until separately approved.
- Follow-up: before migration, map every actual FK to the approved deletion matrix, validate proposed indexes against real queries/requirements, review generated migration SQL, and keep M1.3 RLS/RPC work separate.

---

### M1.6W REVIEW re-entry — live Supabase ES256 versus M1.5 HS256 verifier

**Date:** 2026-08-17
**category:** `runtime-boundary`

After the human supplied `SUPABASE_JWT_SECRET`, M1.5 was restarted without code changes and reported ready in
mock mode. The focused T-006/T-007 run reached both protected endpoints, and both returned `401`. Sanitized
inspection of a fresh live Supabase access-token header observed `alg=ES256` with a `kid`. M1.5 explicitly
rejects every algorithm except HS256 and verifies with `SUPABASE_JWT_SECRET`; that secret cannot validate an
ES256 signature.

The task therefore returned from TESTING to REVIEW. No Web or FastAPI code was changed. Resolution requires a
new approved runtime-boundary decision: preferably update M1.5 to verify current Supabase asymmetric JWTs via
JWKS/ES256, or deliberately reconfigure the Supabase project to legacy HS256 if supported and accepted. The
milestone cannot be marked DONE while T-006/T-007 fail.

---

### M1.6W dependency audit mitigation

**Date:** 2026-08-17
**category:** `missing-dependency`

`npm audit --json` reports three high-severity advisories through Next 15.5.23's nested PostCSS and Sharp
packages. The available automatic fix is Next 16.3.1, which is outside approved D1 (Next 15.x) and would be a
framework change. Reachability review found no user-controlled CSS/source-map build input, no runtime PostCSS
execution path, no `next/image` import, and no image upload/processing path in M1.6W. The advisories are
therefore mitigated by the absent vulnerable paths for this foundation; re-evaluate the Next 15 patch line or
an approved framework upgrade before adding image/content processing. No `npm audit fix --force` was run.

---

### M1.6W REVIEW re-entry — generated Next.js type declaration omitted from allowlist

**Date:** 2026-08-17
**category:** `scope-ambiguity`

During the approved M1.6W scaffold, `lingora-web/tsconfig.json` referenced the standard
`next-env.d.ts` declaration, but that generated file was not named in `Files Expected To Change`. Inspection
of the installed Next.js 15 runtime confirmed that its TypeScript setup invokes `writeAppTypeDeclarations`
and writes `<project>/next-env.d.ts` before build/type-aware development.

Per the approved stop condition and `AGENTS.md`, implementation was paused and `plans/current-task.md` was
returned from `IMPLEMENTING` to `REVIEW`. The requested amendment adds only
`lingora-web/next-env.d.ts` to the allowlist. It does not change D1-D10, dependencies, architecture, routes,
security boundaries, acceptance criteria, or test scope. Human re-approval is required before implementation
resumes.

---

### M1.6 Preflight Stop

- **category:** `missing-dependency`
- **Date:** `2026-08-15`
- **Observed:** `java -version` failed because Java is not on `PATH`; `gradle` and `adb` are unavailable;
  `JAVA_HOME`, `ANDROID_HOME`, and `ANDROID_SDK_ROOT` are unset; standard Android Studio JDK/SDK paths were
  absent. No project-owned wrapper exists yet.
- **Decision:** Stop Condition #3 is active. M1.6 remains `REVIEW`; do not create Android source, generated
  Gradle files, or install/upgrade dependencies as a workaround. Resume only after Java 17, Android SDK 35,
  ADB/emulator, and the approved wrapper bootstrap prerequisites are available.
- **Scope evidence:** only `plans/current-task.md` and this decision log changed; no Android implementation
  or product behavior was created.

---

### ADR-ID

`ADR-007 — M1.6 Android application foundation approval`

### Date

`2026-08-15`

### Category

`contract-gap` — resolved by explicit human approval of M1.6-D1 through M1.6-D6.

### Context

M1.6 requires a Java/Gradle Android foundation, Supabase Auth session handling, and authenticated connectivity
to the completed M1.5 mock runtime. Canonical documents lock the main architecture and AI contract but did not
fully specify Android configuration injection, local debug transport, GoTrue signup/logout and email-confirmation
behavior, Room schema depth, the temporary connectivity proof surface, or a minimal UI baseline while
`DESIGN.md` remains a skeleton.

### Decision

- **M1.6-D1:** use Groovy Gradle and a project-owned Gradle 8.9 wrapper. Read `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, and `AI_API_BASE_URL` from ignored `local.properties` into generated `BuildConfig`;
  `.env.example` remains documentation-only.
- **M1.6-D2:** allow configurable emulator access to `http://10.0.2.2:8000/` through a debug-only network
  security configuration. Release builds deny cleartext and require HTTPS.
- **M1.6-D3:** signup uses `POST {SUPABASE_URL}/auth/v1/signup` with only `email` and `password`; login and
  refresh use canonical GoTrue grants; logout uses Supabase Auth sign-out when supported and always clears the
  local Android session. The human has temporarily disabled email confirmation in the Supabase dashboard for
  development/testing; the agent will not change that provider setting through code or API. Test learner
  credentials remain only in ignored local configuration and are never committed.
- **M1.6-D4:** include Room 2.6.1 and its annotation processor and reserve `data/local/`, but create no
  `@Entity`, DAO, or `RoomDatabase` until M2 approves a cache schema.
- **M1.6-D5:** use a temporary authenticated `FoundationStatusFragment` to call and display parsed SRS/chat
  mock results without learner-history queries or chat/review persistence.
- **M1.6-D6:** use a functional default Material Views baseline and the temporary route
  `Auth -> Foundation Status -> Logout`; no custom brand or dark-mode system is approved.

// LINGORA-DEBT: email confirmation is OFF for dev/testing — must be turned back ON in Supabase dashboard before any production/demo deploy — see M1.6-D3

### Reason

These decisions close the implementation gaps without changing the canonical `/v1/` AI contract, database,
RLS, FastAPI verifier, or later M2/SRS integration scope. The conservative Room boundary avoids inventing a
local schema, while debug-only cleartext confines local Uvicorn access to development builds.

### Alternatives considered

- Commit environment values or use a tracked `.env`: rejected because local endpoints/keys and test
  credentials must remain ignored.
- Enable global cleartext: rejected because it weakens release transport security.
- Require email confirmation during current development: deferred by the human for faster local testing;
  restoration before demo/production is mandatory debt.
- Create placeholder Room entities: rejected because they would freeze speculative M2 behavior.
- Implement final SRS/chat screens now: rejected because M1.6 is foundation/connectivity only.

### Consequences

- Positive: M1.6 has an explicit, testable build/Auth/network/UI boundary and may enter IMPLEMENTING.
- Negative/trade-off: development signup currently omits email verification; local FastAPI access requires a
  debug-only exception; final product navigation and cache schema remain deferred.
- Stop rule: provider behavior or JWT compatibility that contradicts M1.6-D3/M1.5 returns the task to REVIEW;
  the implementation must not weaken the security boundary to pass tests.

---

### ADR-ID

`REVIEW-2026-08-15-02 - AGENTS routing task closure scope`

### Date

`2026-08-15`

### Category

`scope-ambiguity`

### Context

The approved `agents-task-routing-clarifications` task limits changes to `AGENTS.md` and the active
plan, while repository rules require test evidence, development logging, and a HANDOFF update before
the task can reach DONE.

### Decision

Return the task to REVIEW after implementation verification. Preserve the completed `AGENTS.md`
diff and request a closure-only scope amendment for the mandatory logs and HANDOFF lifecycle update.

### Reason

Marking DONE without evidence/logs would violate the gated workflow; editing excluded files without
approval would violate the approved scope and Stop Rules.

### Alternatives considered

- Mark DONE without logs: rejected because TEST and LOG are mandatory gates.
- Update logs silently: rejected because they are explicitly out of scope.
- Revert the completed AGENTS wording: rejected because the implementation matches the approved scope
  and passed the observed documentation checks.

### Consequences

- Positive: completed work is preserved and the closure gap is explicit.
- Negative/trade-off: the task remains REVIEW until the closure-only amendment is approved.
- Follow-up: approve the narrow amendment, record evidence, update HANDOFF, and close without commit.

---

### ADR-ID

`REVIEW-2026-08-15-01 - Public snapshot private-reference scan boundary`

### Date

`2026-08-15`

### Category

`scope-ambiguity`

### Context

The approved public-snapshot plan requires canonical PUBLIC documents to be copied byte-for-byte,
while Test Plan item 4 requires the entire snapshot to contain no references to `logs/` or private
workflow material. The audited canonical documents already contain some historical or traceability
references to internal logs and workflow files.

### Decision

Return `public-snapshot-staging` to REVIEW before implementation. No staging files are created.
Request a scope amendment defining whether the zero-reference requirement applies only to the two
authored public READMEs or also authorizes edits/removal of canonical PUBLIC documents.

### Reason

Both approved requirements cannot be satisfied simultaneously without changing canonical documents,
which is explicitly outside the approved scope.

### Alternatives considered

- Silently retain the references: rejected because it would fail the approved test.
- Edit canonical documents in the snapshot: rejected because copied canonical files must remain
  byte-identical and source documentation edits are out of scope.
- Exclude affected canonical documents: rejected because they are named in the approved allowlist.

### Consequences

- Positive: the private/public boundary remains explicit and reviewable.
- Negative/trade-off: snapshot creation pauses until the test boundary is amended and re-approved.
- Follow-up: amend Test Plan item 4, re-approve the task, then resume snapshot creation.

---

### ADR-ID

`ADR-005 Implementation Addendum — SEC-D8 PA2 bucket boundary realization`

### Date

`2026-08-14`

### Context

The approved two-bucket amendment required an additive correction after live HTTP evidence showed the one-bucket topology could not enforce distinct avatar and audio maxima.

### Decision

- Realize the approved topology through additive migration `202608140003_storage_two_bucket_size_enforcement`.
- Treat Storage bucket configuration as the server-side size/MIME boundary and keep RLS limited to actor, path, ownership and published-content authorization.
- Retain no UPDATE policy; replacement continues to use a new filename/object.
- Refuse migration application when old-bucket avatar objects exist, because object movement was not approved.

### Reason

The implementation exactly realizes the human-approved SEC-D8 amendment without changing the direct authenticated PA2 architecture or application schema/API.

### Alternatives considered

- Edit the applied M1.3 migration: rejected because applied history is immutable.
- Move retained objects automatically: rejected because preflight inventory and separate approval would be required.
- Remove RLS MIME/size predicates entirely: not required; bucket restrictions are authoritative while the predicates remain defense in depth.

### Consequences

- Live HTTP evidence now verifies the 5,242,880-byte avatar and 10,485,760-byte audio boundaries.
- Existing ownership, anonymous denial, published-only audio read, delete and no-overwrite behavior remains unchanged.
- The pre-apply inventory and post-test cleanup both found zero retained Storage objects requiring migration.

---

### ADR-ID

`ADR-005 Amendment — SEC-D8 PA2 two-bucket size enforcement`

### Date

`2026-08-14`

### Context

Live T-008 Storage HTTP evidence showed that a learner could upload a `5,242,881` byte avatar through the one-bucket implementation even though SEC-D8 limits avatars to `5,242,880` bytes. The shared `lingora-media` bucket must allow vocabulary audio up to `10,485,760` bytes, and the avatar `metadata.size` RLS predicate did not enforce the smaller limit end to end.

### Decision

- Replace the one-bucket SEC-D8 topology with two private buckets under the existing direct authenticated PA2 boundary.
- `lingora-avatars` stores `profiles/{userId}/{filename}`, permits `image/jpeg`, `image/png`, and `image/webp`, and enforces a bucket-level maximum of `5,242,880` bytes.
- `lingora-media` stores `vocabulary/{vocabularyId}/{filename}`, permits `audio/mpeg` and `audio/wav`, and enforces a bucket-level maximum of `10,485,760` bytes.
- Avatar policies move to `lingora-avatars`; vocabulary-audio policies remain on `lingora-media`.
- Ownership, anonymous denial, direct authenticated RLS access, no-overwrite, deletion permissions and published-content visibility remain unchanged.
- Implementation must be an additive corrective migration after a separate IMPLEMENT instruction. Applied migrations remain immutable.
- Existing avatar objects and `avatarUrl` references require exact pre-apply inventory; no object movement is inferred or authorized by this decision.

### Reason

Supabase enforces maximum upload size and MIME restrictions at bucket level. One bucket cannot enforce a 5 MB avatar maximum while also allowing 10 MB audio without another trusted upload runtime, which PA2 intentionally excludes.

### Alternatives considered

- Keep one 10 MB bucket and rely on `storage.objects.metadata.size`: rejected by observed HTTP behavior.
- Reduce the shared bucket to 5 MB: rejected because it violates the approved audio maximum.
- Client-only validation: rejected as a bypassable security boundary.
- Trusted upload API/Edge Function: rejected for this amendment because it changes the approved PA2 runtime architecture.

### Consequences

- Positive: both approved limits can be enforced by the documented Storage boundary without adding a runtime component.
- Trade-off: the Storage topology and avatar bucket address change; existing data/references must be audited before application.
- Follow-up: wait for a separate explicit IMPLEMENT command, then create an additive migration and rerun T-008. M1.3 remains non-DONE and M1.4 remains blocked.

---

## ADR template

### ADR-ID

`ADR-XXX — [title]`

### Date

`YYYY-MM-DD`

### Context

`[What situation or constraint requires a decision?]`

### Decision

`[What was decided?]`

### Reason

`[Why is this the preferred choice?]`

### Alternatives considered

- `[alternative and why it was not chosen]`

### Consequences

- Positive: `[impact]`
- Negative/trade-off: `[impact]`
- Follow-up: `[required action]`

---

### ADR-ID

`ADR-002 — M0.5 canonical scope, ownership and contract baseline`

### Date

`2026-08-13`

### Context

M0 migration exposed missing core data-model definitions and conflicts in grammar-score naming, health semantics, locale scope, gamification, API metadata and exercise coverage. The project also needed an unambiguous academic ownership split among Project 1, ML and NLP.

### Decision

- Product name: `Lingora`; Project 1 academic title: **Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động**.
- Project 1 owns the Android/mobile product and integration experience; ML owns personalized SRS model/evaluation; NLP owns roleplay model/evaluation. End-to-end features may trace across namespaces without mixing ownership.
- Grammar scoring is P2 and API-only when available, named `grammatical_acceptability_score`; it is not persisted.
- Health uses public `/health/live` liveness and `/health/ready` readiness; `/health` is not a keep-warm dependency and is retained only if compatibility requires it.
- UI locales `vi` and `en` are Must; `ja` is P2. English is the initial learned language. UI fallback is requested supported locale then `vi`; content fallback is requested locale, supported native locale, `vi`, `en`, then an explicit unavailable state.
- Streak is Must; points/rewards are P2 and leaderboard is P3/out of scope. Streak uses qualifying learning/review activity, once per local day, `lastQualifyingActivityDate`, and stored IANA timezone defaulting to `Asia/Ho_Chi_Minh`; no streak-history table is required.
- Required exercises are MCQ, Fill-blank and REORDER. REORDER uses exact indexed permutation grading.
- `record_review` must verify the caller owns the SRS card from `auth.uid()` before writing; it must not trust a client-supplied user ID.
- Successful AI inference responses require `model_version` and inference-scoped `is_mock`; non-inference supporting/health/error responses do not require fabricated model metadata.
- `docs/05-traceability-matrix.md` is canonical traceability authority. Operational-only components may map to an NFR or approved `N/A`.

### Reason

These decisions close the M1 blockers while retaining the approved architecture, limiting P2/P3 scope, preserving API-first integration and separating academic reporting responsibilities.

### Alternatives considered

- Persist grammar score or retain `naturalnessScore`: rejected because CoLA scoring is P2 and the terminology conflicts.
- Use `/health` as keep-warm: rejected because deployment health must not be a required warming dependency.
- Treat Project 1 as an AI-centric system: rejected because its original academic scope is the mobile application.
- Add points/rewards/leaderboard entities now: rejected as scope expansion.

### Consequences

- Positive: M1 has a governed data/API/RLS baseline and traceability structure.
- Negative/trade-off: several logical fields and policy details are approved design decisions rather than recovered legacy source.
- Follow-up: Implement only through separately approved M1 tasks; do not change ML/NLP architectures, datasets, training or metrics under this ADR.

---

### ADR-ID

`ADR-001 — Canonical documentation and Lingora repository boundaries`

### Date

`2026-08-13`

### Context

The repository contained detailed legacy plans under `ke-hoach-chi-tiet/`, new framework skeletons under `docs/`, and multiple historical product/repository names. M0 required one authoritative documentation set before feature implementation.

### Decision

- Final product name is `Lingora`.
- Approved repository boundaries are `lingora-android`, `lingora-admin`, and `lingora-ai/{api,ml_srs,nlp_chatbot}`.
- `docs/` is canonical immediately.
- `ke-hoach-chi-tiet/` is legacy/reference-only; conflicts require explicit decision.
- `logs/model-registry.csv` is the canonical model registry.
- Legacy workflow `06 quy trinh lam viec.md` is archived after coverage verification and is not deleted.

### Reason

One authoritative documentation set and stable repository naming prevent architecture drift and duplicate process rules before M1.

### Alternatives considered

- Keep `smarteng-*`: rejected by explicit M0 approval.
- Keep `fluentia-*`: rejected by final product naming decision.
- Keep legacy documents authoritative until later migration: rejected because `docs/` was explicitly approved as immediate source of truth.
- Delete legacy workflow: rejected because historical material must be preserved.

### Consequences

- Positive: new tasks have one canonical documentation entry point and stable naming.
- Negative/trade-off: legacy documents remain duplicated reference material and must not be edited as authority.
- Follow-up: unresolved `CONFLICT`, `MISSING`, and `UNCLEAR` findings require separate approved tasks/decisions.

---

### ADR-ID

`ADR-004 — Project 1 learning capability scope-gap resolutions`

### Date

`2026-08-14`

### Context

The canonical baseline used broad wording such as Vocabulary and preserved legacy examples for LISTENING, while Quiz and Notification/Reminder had no requirement. Grammar could also be misread as a Project 1 curriculum rather than the optional NLP scorer. The human approved a clarification-only Scope Gap Review before M1.3 implementation.

### Decision

- Current Project 1 Vocabulary scope is published lesson vocabulary browsing, available audio playback, MCQ/FILL_BLANK/REORDER exercises and SRS integration. Search/favorites, pronunciation scoring, separate mastery and an extra standalone flashcard mode are not implied.
- Grammar curriculum is outside current Project 1 scope. Optional `grammatical_acceptability_score` remains NLP-owned Nice/P2, API-only and non-persistent.
- Vocabulary audio playback remains in the P1 learning flow; a scored `LISTENING` exercise remains deferred/P2 and absent from the applied schema.
- “Quiz” may be a presentation/report label for the existing lesson exercise sequence only. No Quiz/Attempt persistence is introduced; attempt history remains deferred.
- SRS semantics are unchanged. Project 1 owns integration/persistence; ML owns model/Scheduler/evaluation. `record_review` stays in M1.3, while due fallback and smart-review E2E require a later approved SRS integration task.
- Notification/Reminder is not part of the current Must SRS scope and has no canonical priority. `nextReviewAt` is due state only.
- Legacy exercise examples are preserved but annotated as superseded by ADR-002/ADR-003 and the applied schema.

### Reason

These clarifications prevent broad product labels from silently creating new entities, requirements or implementation scope while preserving the complete approved mobile learning flow.

### Alternatives considered

- Add Grammar, LISTENING, Quiz and Notification features now: rejected because they lack approved requirements/semantics or are explicitly deferred.
- Remove legacy examples: rejected because historical source must be preserved.
- Treat SRS implementation gaps as a schema redesign: rejected because the existing data/API ownership boundary is already approved.

### Consequences

- Positive: Project 1 scope and ML/NLP ownership are explicit before Android/security work.
- Negative/trade-off: reminders, scored listening and richer vocabulary/quiz behavior remain unavailable unless separately approved.
- Follow-up: complete M1.3 review independently; promote `plans/srs-integration-plan.md` only after its dependencies and decisions are approved.

---

### ADR-ID

`ADR-005 — M1.3 Auth, RLS, Storage and record_review security semantics`

### Date

`2026-08-14`

### Context

M1.2 established the application schema but intentionally deferred Auth/Profile lifecycle, RLS, Storage authorization, ADMIN enforcement and `record_review`. The M1.3 review identified ten security decisions. The human approved SEC-D1 through SEC-D9 and approved SEC-D10 with an explicit no-idempotency amendment.

### Decision

- **SEC-D1:** Profile creation is synchronous in the Auth signup transaction. `Language('vi')` is a prerequisite; missing `vi` or Profile failure rolls back signup. The trigger does not create general seed data.
- **SEC-D2:** Auth email is authoritative and synchronizes through a trusted synchronous `SECURITY DEFINER` trigger/workflow. Raw metadata may populate only validated non-privileged presentation fields and can never set role, identity, streak or audit fields.
- **SEC-D3:** Learners may update only `displayName`, `avatarUrl`, `uiLocale`, `nativeLangCode`, `dailyGoalMin`, and `timezone`. Identity, email, role, streak and audit fields remain server-controlled. `dailyGoalMin`, locale and timezone require server/database validation.
- **SEC-D4:** Account deletion is deferred from M1.3. Normal operations cannot cascade through learner history. Right-to-erasure is explicit technical debt requiring a later privileged, audited deletion workflow.
- **SEC-D5:** RLS is operation-specific. UserProgress mutation remains trusted-flow-only. Chat authorization derives through owned sessions; `ChatMessage.sequenceNumber` is server-generated and client-controlled ordering/AI-role forgery is forbidden.
- **SEC-D6:** ADMIN manages content/scenarios/media but receives no learner-data support access in M1.3. Initial/later ADMIN role changes use a privileged service-role workflow. Future support access requires a separately approved audited path.
- **SEC-D7:** Learner content reads follow the published `Course → Lesson` parent chain, including child translations, Exercise, LessonVocabulary and reachable Vocabulary/translation. Draft content is hidden. Visibility is not denormalized without performance evidence and approval.
- **SEC-D8 amended — PA2:** Storage uses one private, non-public bucket named `lingora-media`, with anonymous access denied. Authenticated clients access permitted private objects directly under RLS; M1.3 adds no trusted signed-URL runtime, does not enforce a one-hour signed-URL TTL, and accepts the Storage client capability implied by granted RLS permissions. Vocabulary audio uses `vocabulary/{vocabularyId}/{filename}`, allows `audio/mpeg` or `audio/wav`, and is limited to 10 MB. Profile avatars use `profiles/{userId}/{filename}`, allow `image/jpeg`, `image/png`, or `image/webp`, and are limited to 5 MB. Learners may upload, read, replace, and delete only their own avatar objects. Vocabulary audio is ADMIN/service-managed; authenticated learners receive direct read-only access only when the vocabulary is reachable through published `Course → Lesson → LessonVocabulary` content. Existing objects are never overwritten; replacement uses a new object with a new filename/version. Only avatar owners may delete their avatar objects, while only ADMIN/service actors may delete vocabulary audio.
- **SEC-D9:** `record_review` excludes `p_response_ms` and adds no provenance column. A valid owned call atomically writes ReviewLog, updates UserVocabSrs and applies the review streak transition. `Profile.timezone` must validate as an IANA timezone.
- **SEC-D10 amended:** `record_review` uses row locking but adds no idempotency table/column/token in M1.3. Ambiguous timeouts are a known limitation; clients must not automatically retry unless failure is clearly confirmed as non-committed. Idempotency is M1.4+ backlog requiring separate schema/API approval.

### Reason

The decisions enforce least privilege and atomic review persistence without reopening the approved M1.2 schema or introducing speculative idempotency/support infrastructure.

### Alternatives considered

- Async Profile/email reconciliation: rejected because partially synchronized Auth/Profile state is not accepted.
- ADMIN blanket learner-data access: rejected because no support/audit requirement exists.
- Public/anonymous Storage: rejected because anonymous delivery conflicts with the approved boundary.
- Trusted signed-URL runtime in M1.3: superseded by human-selected PA2 to avoid adding an API/runtime component.
- Client-generated chat sequence or review retry: rejected because ordering and transaction outcome are trusted server concerns.
- Add idempotency schema in M1.3: rejected by explicit human amendment.

### Consequences

- Positive: M1.3 has an approved security baseline suitable for a separately started implementation phase.
- Negative/trade-off: Auth signup depends on `vi`; account erasure, learner support access and retry-safe idempotency remain technical debt/backlog.
- Follow-up: SEC-D8 PA2 is fully approved. Resume implementation only after an explicit IMPLEMENT instruction; any new semantic gap returns the task to REVIEW.

---

### ADR-ID

`ADR-006 — ADR-004 amendment: full assignment-scope restoration by absorption`

### Date

`2026-08-15`

### Category

`scope-ambiguity`

### Amends

`ADR-004 — Project 1 learning capability scope-gap resolutions` (2026-08-14). Does not replace `ADR-002`, `ADR-003`, or `ADR-005`. Full analysis: `plans/adr-004-amendment-full-scope.md`. Evidence base: `plans/gap-analysis-de-bai-vs-master-plan.md`.

### Context

An audit against the original assignment statement — *"Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động — Ứng dụng bao gồm các chức năng học từ vựng, ngữ pháp, nghe, kiểm tra, lên lịch học tập và nhắc nhở người học học tập theo lịch biểu"* — found that canonical `docs/00-05` covered roughly 1.5–2.5 of the 6 required functions. `ADR-004` had deliberately excluded Grammar curriculum, Notification/Reminder, and scored `LISTENING` (`docs/02:218`, `02:221`, `docs/04:433`, `docs/05:65–69`). That exclusion was correct scope control but left the product not covering the assignment. The human chose absorption into the existing architecture over building new subsystems (~3.5–4.5 weeks), and approved the amendment on 2026-08-15.

Three findings from reading the real migration SQL changed the cost model versus the gap analysis: (a) scheduling has zero backend cost because `GRANT UPDATE (… daily_goal_min …)`, policy `profiles_own_safe_update`, and `validate_profile_write()` non-negative validation already exist (`202608140002/migration.sql:316`, `:430`, `:36–38`); (b) adding an enum value still requires a real migration file even though no table changes (`ALTER TYPE`, enum created at `202608140001/migration.sql:11`); (c) the real barrier for listening is Storage RLS, not schema, because policy `lingora_vocabulary_audio_select` permits only `vocabulary/{vocabularyId}/` reachable through published `lesson_vocabulary → lessons → courses` (`202608140002/migration.sql:501–522`).

### Decision

- **Item 1 — Grammar:** add exactly one value `GRAMMAR` to `enum ExerciseType`. Name chosen over `GRAMMAR_MCQ` so `payload.mode` describes the form and a second grammar form needs no further enum value. Grammar does not become a subsystem: no `GrammarLesson`, no `UserGrammarProgress`; grammar content is `Exercise` attached to an existing `Lesson`, progress stays lesson-level `UserProgress` per `P1-FR-004`. Effort 2 days, week 5 + week 7.
- **Item 2 — Study scheduling:** UI-only work making the existing inert `Profile.dailyGoalMin` (`schema.prisma:68`) readable and writable from the learner profile screen. No migration, no RLS change, no grant, no new table — the write path was already granted in M1.3. Must be described honestly as a daily study goal, not a calendar/timetable. Effort 1 day, week 7.
- **Item 3 — Reminder:** Android-local only, via `WorkManager` + a local notification derived from `dailyGoalMin` and `lastQualifyingActivityDate`. Reminder time is stored client-side in `SharedPreferences` (**option 3a**); option 3b (`Profile.reminderTime`) is rejected because it would reopen SEC-D3. No backend, no device token, no FCM — the `docs/04:433` block on device-token/reminder-schedule entities stands unchanged. Effort 3 days, week 9.
- **Item 4 — Listening:** **option 4a**, word-level. Add `LISTENING` to `ExerciseType`; audio reuses the existing approved `vocabulary/{vocabularyId}/{filename}` path, and payload references `vocabularyId` rather than embedding a free-form URL, so read authorization stays with RLS. Option 4b (sentence-level audio) is rejected because it would require a new Storage path convention plus new policies and would force amending SEC-D8. Effort 2.5 days, week 5 + week 7.
- **Payload shapes are deliberately not frozen.** The final shape of the `GRAMMAR` and `LISTENING` payloads is delegated to the implementation task and its acceptance tests. The only binding constraints are `jsonb_typeof(payload) = 'object'` and `payload->>'payloadVersion' = '1'` (`202608140001/migration.sql:142–143`).
- **Totals:** 8.5 days · one combined `ALTER TYPE "ExerciseType" ADD VALUE` migration · zero new tables · zero SEC-D amendments. Allocated to weeks 5, 7, and 9; no M2/M3/M4/M4.5/M5 milestone is pushed and the M5 feature freeze at end of week 10 holds.
- **Security confirmation:** items 1, 2, 3a, and 4a require no amendment to `SEC-D1…SEC-D10`. SEC-D3 is untouched because no new learner-writable field is added; SEC-D5 is untouched because `UserProgress` mutation stays trusted-flow-only and `record_review` is unchanged; SEC-D8 is untouched because no new Storage path or policy is introduced. New `ExerciseType` values inherit correct visibility with no new policy because `exercises_visible_read` filters by `lesson_id`, not by `type` (`202608140002/migration.sql:393`).
- **This ADR approves scope only, not implementation.** No schema, migration, RLS, dependency, canonical document, or source file is modified by this entry.

### Reason

Absorption reuses `Exercise.payload` JSONB, the already-granted `dailyGoalMin` write path, and the already-approved vocabulary audio Storage path, so the assignment's 6 functions become demonstrable for 8.5 days of work without new entities, without new security boundaries, and without reopening SEC-D8 — where the project already had one real size-enforcement hole found by live HTTP evidence.

### Alternatives considered

- Build Grammar, Reminder, Scheduling, and Listening as proper subsystems (~3.5–4.5 weeks): rejected because it does not fit before the week-10 M5 feature freeze and would add entities the data model explicitly blocks.
- Do nothing and only document scope limits in report chapter 1: rejected because the assignment names 6 functions and 3 would be gradeable as missing.
- `GRAMMAR_MCQ` as the enum name: rejected because a second grammar form would then need another irreversible enum value.
- Option 3b (`Profile.reminderTime`): rejected — persistence convenience is not worth amending the learner-writable security boundary.
- Option 4b (sentence-level listening audio): rejected — 5.5 days and a mandatory SEC-D8 amendment.
- Freezing both payload shapes now: rejected by the human; deferred to implementation and acceptance tests.

### Consequences

- Positive: all 6 assignment functions become implementable within the locked roadmap; zero new tables; zero SEC-D amendments; `Profile.dailyGoalMin` stops being an inert field, which was the most exploitable weakness in a defense.
- Negative/trade-off: the locked v5 baseline is reopened; one irreversible enum migration (Postgres cannot drop enum values); reminder time is per-device and lost on reinstall (3a); `WorkManager` is a new dependency not named in `docs/01:149–176` (change control item 2); `WorkManager` cannot guarantee exact delivery time under doze/OEM battery restrictions, so the feature must be described as "reminds within the chosen window", not "exactly at 20:00"; Android 13+ requires the `POST_NOTIFICATIONS` runtime permission with a denied-state path.
- Follow-up: implementation requires a **new** `plans/current-task.md` at `APPROVED` — the current one is `public-snapshot-staging` at `DONE`. `docs/02-requirements.md`, `docs/04-data-model.md`, and `docs/05-traceability-matrix.md` currently negate all four items and **must** be updated as part of implementation or the project self-contradicts. The enum migration must not seed data using the new value in the same transaction that adds it, or `prisma migrate deploy` will fail. Recommended order: item 2, then items 1 + 4a sharing one migration, then item 3a.

---

### ADR-ID

`ADR-008 — Project 1 learner platform reset from native Android to Web`

### Date

`2026-08-17`

### Category

`runtime-boundary`

### Supersedes / Amends

Supersedes **only the platform clauses** of `ADR-002` — the academic title *"Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động"* as a binding platform constraint, and "Project 1 owns the Android/mobile product". `ADR-002`'s locale, streak, exercise-type, `record_review`, and metadata clauses are untouched. Amends `ADR-006` **item 3 only**, and only its delivery mechanism. `ADR-001`, `ADR-003`, `ADR-004`, `ADR-005`, `ADR-007` are untouched. `ADR-007` (M1.6 Android application foundation approval) is not reversed; its implementation is marked `SUPERSEDED`. Approved plan: `plans/approved/2026-08-17-m1.7-web-platform-reset-APPROVED.md`.

### Context

M1.6 delivered a native Android foundation (61 tracked files, 2,433 lines Java, 12/12 unit tests PASS, `assembleDebug` PASS — evidence `M1.6-T-001`..`M1.6-T-010`) covering authentication and AI connectivity only: Login, Register, and `FoundationStatusFragment`. No learner feature screen existed yet.

On 2026-08-17 the human decided to deliver the learner client as a web application instead. Verified state at commit `585ca6c` at the time of the decision:

- ~95% of realized investment is platform-neutral: `lingora-admin/prisma/` (308-line `schema.prisma`, 3 migrations ≈ 950 lines SQL, 527-line `seed.js`), `lingora-ai/api` (964 lines Python, 27/27 pytest PASS), the entire `/v1/` contract, Supabase Auth/RLS/RPC/Storage, and all ML/NLP scope.
- `lingora-admin/` is the Prisma/migration owner, **not** a completed Admin foundation: no Next.js, no `src/`.
- The approved Admin stack at `docs/01-architecture.md:137–138` is already Next.js 15 + TypeScript 5 + Tailwind 4 + shadcn/ui, so a web learner client introduces **zero new technology** to the canonical baseline.
- The only requirement that degrades on web is `P1-FR-015` (daily study reminder), because `ADR-006` item 3a specified `WorkManager` + `SharedPreferences`, which has no web equivalent with the same guarantee.

### Decision

- **Platform.** Project 1 delivers a **web** learner application at `lingora-web/`: Next.js 15 App Router, TypeScript 5, Tailwind 4, shadcn/ui, deployed on Vercel. The academic title is treated as a description of the original brief, not a binding platform constraint; the risk of being graded against it was raised, reaffirmed, and knowingly accepted by the human on 2026-08-17.
- **Boundary.** `lingora-web/` is a **fourth** repository boundary alongside `lingora-admin/`, `lingora-ai/`, and the Supabase project. It receives only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It must never hold `SUPABASE_SERVICE_ROLE_KEY`, never import Prisma, and never open a direct database TCP connection. Merging the learner and admin apps into one Next.js runtime is rejected, because it would place the service-role key in the same runtime as learner-facing routes.
- **AI path.** Browser → `lingora-web` Route Handler → `lingora-ai`. The handler forwards the Supabase JWT verbatim, persists nothing, and owns the 8-second `P1-FR-005` timeout. `lingora-ai/` is **not modified**, so its 27 pytest results remain valid evidence. Direct browser → FastAPI is rejected because it would require a CORS change to a `DONE` milestone. KNPM sequence diagrams must show this extra hop honestly.
- **Offline cache.** Room is replaced by a TanStack Query persisted cache. `docs/00-master-plan.md:108` already permits cutting offline cache.
- **Android.** The 61 tracked files under `lingora-android/` are deleted from the working tree. **Git history is not rewritten** — no `filter-branch`, no `rebase`, no force-push; the code remains recoverable at `585ca6c`. Evidence is preserved: `logs/test-log.md` rows `M1.6-T-001`..`M1.6-T-010` keep their text and results, with `Report Ref` set to `SUPERSEDED`.
- **Reminder — `P1-FR-015` stays `Must`.** `ADR-006` item 3a's mechanism is replaced by an **in-app reminder** (option `6d`): on application load, if the current local day has no qualifying activity and the current time falls inside the learner-chosen window, a persistent in-app banner and a badge on the study entry point are shown. Window stored alongside `Profile.dailyGoalMin`. No service worker, no new table, no scheduler, no secret, no OS permission. Delivery is **within the chosen window, never at an exact time**, and must never be described as background delivery. This is a **feature-level** item in the Progress/Profile milestone; it is explicitly **not** part of the web foundation milestone.
- **Deferred notification options**, recorded verbatim as decided by the human:

```text
6b — Web Push + scheduler: DEFERRED. Không thuộc M1.6W. Chỉ xem xét lại sau khi core learner
features và UX hoàn thành, nếu background reminder được chứng minh là cần thiết.
```

```text
Status: DEFERRED, not rejected. Re-entry needs a new plan and a new ADR; it does not require
reversing ADR-008, because ADR-008 defers 6b rather than cancelling it.
Known cost at deferral time (2026-08-17): one new table (push_subscriptions), one migration,
owner-only RLS policies, a server-side sender outside lingora-web, a scheduled trigger, and VAPID
secrets — which would also amend ADR-006's "zero new tables" clause.
```

  Option `6a` (installable PWA + service worker + Notification API, ~3 days) is **deferred to the polish phase** and is the first item cut if the schedule tightens, because `6d` already satisfies `P1-FR-015`. Option `6c` (demote `P1-FR-015` to Nice-to-have) was offered to the human and **not taken**, so `docs/00-master-plan.md:111` is **not** amended.
- **`ADR-006` clauses that remain true and unamended** for as long as `6b` stays deferred: zero new tables, no server-side delivery, no device token, no notification-preference entity, no reminder-schedule entity, and the `docs/04` block on those entities.
- **Deliverables.** `app-release.apk` → production Vercel URL + Lighthouse report. APK signing runbook → Vercel deploy runbook. Android MVVM class diagram → web data/domain class diagram. An installable PWA is **not** a required deliverable, since `6a` may be cut.
- **Tests.** `P1-T-001`..`P1-T-019` keep their IDs and intent. Espresso → Playwright; JUnit 4 + Mockito → Vitest.
- **Milestone identity.** The web foundation is **`M1.6W`** with evidence IDs `M1.6W-T-001`..`n`, not a reused `M1.6`, because `M1.6-T-001`..`M1.6-T-010` already exist in `logs/test-log.md` for Android. `M1.6W` is narrowly scoped to proving the web foundation can authenticate a learner and call the two protected M1.5 mock endpoints, across nine boundaries: web application, authentication/session, API client, repositories/services, SRS mock connectivity, Roleplay mock connectivity, UI foundation, vi/en i18n with `vi` fallback, and a responsive/accessibility baseline. `M1.6W` requires its own `APPROVED` plan and must not modify the database, Prisma schema or migrations, Supabase SQL/RLS/RPC/Storage, `lingora-ai/`, or `docs/03-api-contract.md`.
- **Roadmap order.** `M1.6W` → Auth → UX/navigation shell → Course/Lesson → Vocabulary/Exercise → SRS → Roleplay → Progress/Profile (`6d` lands here) → polish (`6a` lands here). M5 feature freeze at end of week 10 **holds**.
- **Unchanged by this ADR.** Database schema, the 3 existing migrations, `seed.js`, every RLS policy, `record_review`, both Storage buckets, the `/v1/` contract's endpoints, fields, types, status codes, error envelope and version rules, and all `ML-*` / `NLP-*` scope, datasets, and metrics.

### Reason

The platform switch is cheap because no learner feature screen had been built yet, while the expensive assets — schema, RLS, seed, the FastAPI runtime and its 27 tests, the API contract, and both AI research scopes — are platform-neutral. Sharing one stack between the learner and admin applications saves an estimated 5–8 days in weeks 6–7, offsetting most of the switch cost; net effect is ≈ +1 to +6 days with M5 still at week 10. Keeping `P1-FR-015` at `Must` with the cheap `6d` mechanism preserves one of the six functions named in the assignment statement — `plans/gap-analysis-de-bai-vs-master-plan.md` §5.1 measured coverage at 1.5–2.5/6 before `ADR-006` and warned the shortfall "hiện ngay trên sơ đồ" in the Use Case Diagram and "không thể bù bằng chất lượng AI" — while keeping the expensive Web Push infrastructure out of the foundation.

### Alternatives considered

- Keep Android and add web later: rejected; two clients cannot be built inside the remaining roadmap.
- Keep Android for the reminder alone: rejected; one requirement's delivery mechanism does not justify maintaining an entire second platform.
- Vite SPA instead of Next.js: rejected; loses server-side session handling and the shared-stack saving.
- Merge learner + admin into one Next.js app: rejected; would put `SUPABASE_SERVICE_ROLE_KEY` in a learner-facing runtime and reduce `P1-NFR-001` from a boundary to a convention.
- Direct browser → FastAPI with CORS: rejected; would modify a `DONE` milestone and invalidate its evidence.
- `6b` Web Push in the foundation (~5–7 days): rejected as foundation work; deferred with its cost recorded.
- `6a` PWA notifications in the foundation (~3 days): rejected as foundation work; deferred to polish.
- `6c` demote `P1-FR-015` to Nice-to-have: offered to the human and not taken; would return assignment coverage to the pre-`ADR-006` state and reopen `ADR-004`'s resolved deferral.
- Reuse the milestone ID `M1.6` for the web foundation: rejected; would make `M1.6-T-003` ambiguous across two platforms in one log.
- Rewrite Git history to remove Android: rejected; `AGENTS.md` forbids it and it would destroy the recoverable record.
- Delete the archived M1.6 plan and its test-log rows: rejected; they are the only record of why the platform changed and are cited by the report.

### Consequences

- Positive: zero new technology in the canonical baseline; the security boundary is strengthened, since the learner runtime now holds only the anon key and relies on RLS; `lingora-ai/`, the schema, and all migrations are byte-identical, so M1.3–M1.5 evidence stays valid; learner and admin share one stack, component library, and type source; M5 still holds at week 10.
- Negative/trade-off: the academic title no longer matches the deliverable (accepted risk, recorded above); the locked v5 baseline is reopened a second time; ~115 doc mentions and 19 traceability rows were rewritten; the M1.6 Android implementation (2,433 lines Java) is discarded as sunk cost; `P1-FR-015` delivery is weaker than the approved Android behaviour, since `6d` only reaches a learner who opens the application, and `docs/02` must state that limitation rather than imply background delivery; KNPM sequence diagrams gain one Route Handler hop.
- Follow-up: `M1.6W` requires a **new** `plans/current-task.md` at `APPROVED` before any file under `lingora-web/` is created. `staging/lingora-workspace-public/` still holds a pre-alignment snapshot and must be regenerated under its own approved task. A future "merge learner into admin" refactor is blocked by the `ENVIRONMENT.md` prohibition and would need to amend it deliberately.

---

### ADR-ID

`ADR-009 — M1.5 JWT verifier amendment: Supabase JWKS / ES256 compatibility`

### Date

`2026-08-17`

### Category

`runtime-boundary`

### Context

M1.5 originally verified incoming Supabase JWT tokens via symmetric `HS256` HMAC validation against `SUPABASE_JWT_SECRET`.
In live testing with Supabase Auth (GoTrue), modern Supabase projects issue asymmetric `ES256` (ECDSA P-256) JWTs containing a key ID (`kid`).
Because HMAC cannot cryptographically verify an ECDSA signature, protected calls from learner clients (`lingora-web` Next.js Route Handlers) were rejected with HTTP `401 Unauthorized`.

### Decision

1. Extend `lingora-ai/api/app/config.py` to support `SUPABASE_URL` and `SUPABASE_JWKS_URL` (defaulting to `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`).
2. Update `lingora-ai/api/app/auth.py` to:
   - Extract unverified header `alg` and `kid`.
   - Use `jwt.PyJWKClient` (part of existing `PyJWT[crypto]>=2.8.0`) to resolve public keys from the trusted Supabase JWKS endpoint when `alg == "ES256"`.
   - Retain `HS256` symmetric verification against `SUPABASE_JWT_SECRET` for offline/test backward compatibility.
   - Strictly verify signature, `exp`, `sub`, and `role == "authenticated"`.
   - Fail closed (HTTP 401) on invalid signature, expired token, unknown `kid`, unsupported algorithm, malformed token, or JWKS fetch failure.
   - Never log tokens or Authorization headers.
3. No dependencies added (PyJWT[crypto] already available).
4. No changes to Web code, API contract, database schema, Prisma, migrations, or RLS.

### Reason

Enables cryptographic verification of modern Supabase ES256 JWTs using the project's official JWKS endpoint without degrading security, requiring authentication bypass, or altering contract interfaces.

### Consequences

- Positive: Web Route Handler and mobile clients can authenticate against FastAPI M1.5 seamlessly using live Supabase tokens.
- Negative/trade-off: Verifier depends on reachable JWKS endpoint or JWKS cache for ES256 tokens.
- Tests: Existing 27/27 M1.5 pytest tests preserved; new JWKS/ES256 security tests added; live `M1.6W-T-006` and `M1.6W-T-007` hops verified.

---
### UC-06 dual-input modality review re-entry — 2026-08-22

### Category

`scope-ambiguity`

### Context

The requested amendment adds client-side Web Speech API speech-to-text and
Speech Synthesis playback to UC-06. The current approved report scope and
evidence register explicitly treat speech recognition/spoken dialogue as
deferred, and the current GEC contract uses `original_text` plus
`scenario_code`, not the proposed `text`-only payload.

### Decision

Return the task to `REVIEW`. Do not modify UC-06 report text, PlantUML, API,
UI, schema, migration, model, or DOCX artifacts until the user explicitly
approves the scope expansion and resolves the canonical contract shape.

### Consequences

The requested dual-input behavior remains proposed only. Existing baseline
documentation and runtime boundaries are preserved.
# REVIEW Re-entry: Lecturer report ERD model-count gap (2026-08-23)

- **category:** `contract-gap`
- **Task:** `integrate-requirements-research-sections-into-lecturer-report`
- **Observed gap:** the approved report/slide plan says the ERD baseline has 17 Prisma models, while the active `lingora-admin/prisma/schema.prisma` currently contains 15 models after legacy `ChatSession` and `ChatMessage` removal.
- **Risk:** publishing the approved wording would misrepresent the current implementation and contradict the completed cleanup state recorded in `HANDOFF.md` and `plans/current-task.md`.
- **Proposed resolution:** use 15 models for the current implementation, identify 17 only as the historical pre-cleanup baseline, and state that GEC output is transient. Do not modify canonical `docs/00`..`docs/07` in this task.
- **Status:** returned to `REVIEW`; awaiting human approval of the amendment before report/PPTX implementation.

## Resolution (2026-08-23)

- **Human decision:** retain 17 as the approved physical schema baseline; mark `ChatSession` and `ChatMessage` as deprecated/legacy awaiting formal migration cleanup.
- **Active-flow count:** 15 models.
- **Proposed entities:** UC-09 Placement and UC-11 Badges remain `PROPOSED / NOT IMPLEMENTED` and are excluded from the active baseline count.
- **Authorization:** report/DOCX and 14-slide PPTX generation approved; execute `RPT-ADD-001` through `RPT-ADD-010`.
- **Boundary:** no runtime, schema, migration, RLS, RPC, API, dependency, UI or model implementation change is authorized.

# ADR-011 — Use Case actor boundary and contiguous UC catalog

# REVIEW Re-entry: Project 1 cleanup allowlist expansion (2026-08-23)

- **category:** `scope-ambiguity`
- **Task:** `project-1-software-engineering-documentation-cleanup`
- **Observed gap:** `docs/report/evidence-register.md` contains the same forbidden AI/ML/NLP/T5-small/GEC references as the approved report set, but it was not listed in the initial allowlist. DOCX/PPTX targets are currently locked by an open application, preventing in-place replacement.
- **Required resolution:** approve adding `docs/report/evidence-register.md` and permit replacement of locked outputs after the owning application releases them.
- **Status:** returned to `REVIEW`; no further implementation until human confirmation.

### Date

`2026-08-23`

### Category

`runtime-boundary`

### Context

Current Use Case diagrams and reports represented `AI Service` as an external actor and used `UC-11` for private achievements, leaving a numbering gap. The user explicitly approved a documentation-wide correction before completing the outstanding PlantUML coverage task.

### Decision

1. Learner and Admin are the only external Use Case actors and remain outside the Lingora system boundary.
2. Actor-to-Use-Case associations are solid lines without arrowheads.
3. GEC/T5-small, including the Route Handler/FastAPI deployment components, is internal Lingora processing and is not a Use Case actor.
4. The current Use Case catalog is contiguous `UC-01`..`UC-10`; private achievements use `UC-10` and remain `PROPOSED / NOT IMPLEMENTED`.
5. The ERD reporting view contains 17 physical models: 15 active business-flow models plus 2 legacy/deprecated models (`ChatSession`, `ChatMessage`). Proposed UC-09/UC-10 entities remain outside that count.
6. Historical approved/archive plan snapshots and historical test/development log entries are not rewritten.

### Consequences

- Current canonical documentation, PlantUML and Markdown reports use one actor/boundary interpretation and one UC numbering scheme.
- No runtime, API behavior, schema, migration, RLS, RPC, dependency or model artifact changes are authorized or performed.
- Existing FastAPI architecture/API terminology may remain where it describes an internal deployable component rather than an external actor.

---

# ADR-012 — Phase 0 Repository Cleanup and Superpowers Workflow Standardization

### Date

`2026-09-14`

### Category

`runtime-boundary`

### Context

Following the Phase 0 Rebuild reset, the repository contained obsolete agent frameworks (Impeccable, old local skill trees), deprecated ML/NLP artifacts (DKT-LSTM, HLR, MultiWOZ), duplicate/unapproved plans, and superseded PlantUML diagrams conflicting with the Phase 0 baseline (6 final roles, 19 MVP functions, authorization matrix, 6-step review process). A single, standardized development workflow was required for both coding agents (Codex and Antigravity).

### Decision

1. **AI Workflow Standardization**:
   - Establish a 2-agent division of responsibility:
     - **Codex**: Discovery, Architecture, Specification, Planning, Review, Verification, Acceptance.
     - **Antigravity**: Implementation, Coding, Test execution, Fix implementation issues according to plan/review.
   - Establish **Superpowers** (`https://github.com/obra/superpowers`) as the single canonical skill and workflow methodology shared by Codex and Antigravity.
   - Completely remove the legacy Impeccable framework and obsolete project skills (`source-driven-development`, `security-and-hardening`, `debugging-and-error-recovery`, `code-review-and-quality`). Remove broken `.codex/hooks.json`.
2. **Phase 0 PlantUML Baseline**:
   - Retain only the 9 canonical Phase 0 MVP diagrams in `docs/plantuml/`: `use-case-mvp-overview.puml`, `role-permission-matrix.puml`, `activity-learner-journey.puml`, `activity-content-approval.puml`, `sequence-lesson-completion.puml`, `sequence-content-publishing.puml`, `system-architecture-mvp.puml`, `erd-mvp-learning.puml`, `sitemap-mvp.puml`.
   - Remove 36 superseded/duplicate `.puml` and `.png` files from `docs/plantuml/`.
   - Preserve all generated PNGs in `docs/report/diagrams/` for academic report traceability (DOCX, PPTX).
3. **Repository Cleanups**:
   - Remove obsolete research workspaces `docs/ml/`, `docs/nlp/`, `lingora-ai/ml_srs/`, `lingora-ai/nlp_chatbot/`.
   - Remove duplicate/obsolete root plans: `plans/adr-004-amendment-full-scope.md` (duplicate), `plans/srs-integration-plan.md` (obsolete draft), and archive `plans/gap-analysis-de-bai-vs-master-plan.md`.
4. **Runtime Invariant**:
   - Preserve all runtime code (`lingora-web/`, `lingora-admin/`, `lingora-ai/api/`) and database schemas intact.

### Consequences

- Repository is clean, compliant with Phase 0 baseline, and unified under Superpowers.
- Broken references and competing agent frameworks are eliminated.

---

# ADR-013 — Phase 0 Rebuild 11-Layer Reconciliation and Canonical Foundation Establishment

### Date

`2026-09-14`

### Category

`scope-ambiguity`

### Context

Following forensic discovery and repository cleanup, the repository remained in a `MIXED OLD/NEW` state with discrepancies across 11 architectural layers:
- Documentation in `docs/00`–`docs/07` still described superseded ML/NLP architectures (DKT-LSTM, HLR, MultiWOZ chat), older 2-actor models (Learner/Admin), and conflicting role enums (`STUDENT` vs `LEARNER`).
- Canonical Phase 0 baseline (`docs/phase-0-roles-and-mvp-final.md`) established 6 roles (`Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`), 19 MVP functions (`MVP-01`..`MVP-19`), and 15 Use Cases (`UC-01`..`UC-15`).
- The database schema (`lingora-admin/prisma/schema.prisma`) implemented 17 models with `enum Role { LEARNER ADMIN }`.
- AI API runtime (`lingora-ai/api`) implemented health, info, and compatibility endpoints (`/v1/srs/schedule`, `/v1/chat/roleplay`), while target GEC (`/v1/gec/correct`) was pending.
Reconciliation was required to unify all 11 layers into a single source of truth without creating parallel architectures or executing destructive schema changes.

### Decision

1. **Documentation Source-of-Truth Reconciliation (`docs/00`–`docs/07` & `QUICK-REF.md`)**:
   - Explicitly establish `docs/phase-0-roles-and-mvp-final.md`, `docs/phase-0-survey-requirements.md`, and 9 canonical Phase 0 PlantUML diagrams as controlling baseline.
   - Demarcate migrated legacy v1–v5 planning text in `docs/00`–`docs/04` under explicit `[SUPERSEDED / HISTORICAL REFERENCE]` headings.
   - Reconcile `docs/01-architecture.md` with `system-architecture-mvp.puml` (Client Apps, Application Services, Supabase Backend, internal stateless AI).
   - Reconcile `docs/02-requirements.md` to incorporate the 19 MVP functions (`MVP-01`..`MVP-19`) with owner and acceptance criteria.
   - Reconcile `docs/03-api-contract.md` into 3 explicit tiers: `CURRENT` (/health/*, /v1/model/info), `COMPATIBILITY` (/v1/srs/schedule, /v1/chat/roleplay, /v1/chat/scenarios), and `TARGET` (/v1/gec/correct).
   - Reconcile `docs/04-data-model.md` and `docs/07-data-dictionary.md` to reflect runtime `enum Role { LEARNER ADMIN }`, exact storage buckets (`lingora-avatars`, `lingora-media`), and define the Target Phase 0 Schema evolution strategy.
2. **MVP Function (MVP-01..19) ➔ Use Case (UC-01..15) Traceability Matrix**:
   - Update `docs/05-traceability-matrix.md` with complete bidirectional mapping connecting all 19 MVP functions to 15 canonical Use Cases, requirements, runtime surfaces, and tests.
   - Flag gaps (`MVP-16` SupportTicket, `MVP-17` Cohort) and future/non-MVP items clearly.
3. **Role Reconciliation**:
   - Classify the 6 canonical roles transparently: `Learner` (IMPLEMENTED / Foundation), `Administrator` (PARTIAL / DB enum exists), `Lesson Creator`, `Moderator`, `Operations Staff`, `Organizational Manager` (DESIGN / Target Phase 0 model).
4. **Database Reconciliation & Migration Invariant**:
   - Categorize 17 models: 12 models to keep, 1 model to extend (`Profile`), 2 models to extend for content workflow (`Course`, `Lesson`), 2 legacy compatibility models (`ChatScenario`, `ChatScenarioTranslation`), 2 deprecated models (`ChatSession`, `ChatMessage`), and future models (`Cohort`, `CohortMember`, `SupportTicket`, `AuditLog`).
   - 100% preservation of migration history (`202608140001_init`, `202608140002_auth_rls_storage_record_review`, `202608140003_storage_two_bucket_size_enforcement`). No destructive migrations in Phase 0 Reconciliation.
5. **Web & AI Foundation Reconciliation**:
   - Audit and classify all components in `lingora-web` (reusable, legacy compatibility, needs refactor, not implemented). Retain Next.js 15, SSR Auth, i18n, UI primitives.
   - Audit AI API endpoints; retain compatibility endpoints while consumers exist.
6. **Security Findings Tracking**:
   - Document security findings (`MOCK_MODE` default True, fallback JWT secret, error leakage) as controlled TODOs without introducing unsafe defaults.

### Consequences

- All 11 layers share a unified, verifiable Phase 0 canonical baseline.
- Zero broken references across the repository.
- The project is fully reconciled and ready for Milestone M2 (Web Core Lesson Flow).

## ADR-015 � D1 Final Design Cleanup & D2 Domain Decisions (Assessment Semantics, Concept Parity, Provenance)

### Date

2026-09-24

### Category

scope-ambiguity

### Context

FINAL INDEPENDENT DESIGN RE-REVIEW (Round 3) left non-blocking cleanups: ghost mention AssessmentSession, purpose/mode conflation in one dictionary line, LearningProgress dual-link risk, free-text conceptTag legacy, unverified university credentials, under-specified EN/ZH config keys, stale wording in frozen baselines, opaque evidenceSummary, rationale-only Recommendation. Task d1-final-design-cleanup-and-d2-domain-data-design (APPROVED) resolves them design-first: 0 code, 0 migrations, 0 algorithms.

### Decision

1. AssessmentSession is NOT an entity (removed from 04:449 canonical list); Assessment = conceptual mode of Exercise (D4); AssessmentResult = sole persisted logical entity with assessmentType (DIAGNOSTIC/EXIT/RE_EVALUATION) + deliveryMode (PLACEMENT/JUMP/STANDARD).
2. LearningProgress sole owner = LearnerProfile (Role.LEARNER only); no direct Profile link (puml + M2.1 + GUARD-09).
3. Concept identity = conceptId FK everywhere; Concept keeps cefr_level as level/reference metadata alongside name/prerequisiteConceptId/isActive; domain includes PRONUNCIATION.
4. Expert university credentials carry [PENDING-SOURCE-VERIFICATION]; names/tenures unchanged (Tr?n Minh Qu�n 9y; L� Ho�ng Mai 8y); no new university asserted.
5. Multi-lang chain stays logical/config (01:462); EN room for collocation/word family/connected speech/contextual vocab; ZH room for grammar-order/listening + hidePinyin + versioned HSK.
6. Frozen baselines are not rewritten: Ba-dang rows get HISTORICAL tags only.
7. LevelReadiness.evidenceSummary = typed struct (evidenceVersion/progressRatio/masteryRatio/highSeverityGapsCount/sourceAssessmentResultIds) with thresholds CONFIGURABLE/PENDING; Recommendation gains inputSnapshot/ruleVersion/generatedAt for Why-explainability; no algorithm designed.
8. Ten logical invariants consolidated (01 S3.3 + M2.1 S4.5); all adaptive/threshold/formula items stay PROPOSED/PENDING/CONFIGURABLE (open list in plan).

### Consequences

- Prose and diagrams agree; 18 guards green; D3 can start from S13 readiness/versioning/compat tables.
- No runtime, migration, or algorithm commitment made.

## ADR-016 — D3 Assessment & Learning Engine Design (Design-Only, D2-Compatible)

### Date

2026-09-24

### Category

scope-ambiguity

### Context

Approved D3 task designs the full logical flow Assessment → Skill Profile → Learning → Mastery/Knowledge Gap → Readiness → Recommendation/Remediation from the D1/D2 COMPLETE baseline. Constraints: design-only; no runtime, migration, schema change, or scoring/recommendation/remediation algorithm; no Design Freeze; preserve all D2 FROZEN/PROPOSED/PENDING boundaries and the separately approved English A1 Mapping A as D2 compatibility.

### Decision

1. Purpose (`assessmentType`: DIAGNOSTIC/EXIT/RE_EVALUATION) and execution (`deliveryMode`: PLACEMENT/JUMP/STANDARD) are independent axes with D2 naming; `AssessmentResult` is the sole persisted immutable/versioned/attributable evidence; no `AssessmentSession`.
2. Entry keeps selfReportedLevel (UNVERIFIED), assessed observations, verifiedProficiency, and curriculumStartingPoint distinct; diagnostic scale (~25-30 items, <=15 min) stays PROPOSED / PENDING VALIDATION.
3. `SkillProfile` holds four dimension level/status slots plus provenance (`sourceAssessmentResultId`, versions, `updatedAt`); Anchor slot stays PENDING with no flat score or weighted average.
4. `ConceptMastery` (NOVICE → DEVELOPING → MASTERED per LearnerProfile×Concept) and `KnowledgeGap` (OPEN → IN_REMEDIATION → RESOLVED, LOW/MEDIUM/HIGH labels) use typed evidence/provenance; all open/resolve/promotion policies stay CONFIGURABLE / PENDING VALIDATION with no hard-coded counts.
5. `LevelReadiness` uses typed evidence (`evidenceVersion`, progress/mastery/gap inputs, `sourceAssessmentResultIds`, `evaluatedAt`) and exactly three outputs (ADVANCE / ADVANCE_WITH_SUPPORT / REMEDIATE); completion is never certification and no threshold or single score is chosen.
6. Remediation is concept-targeted with fresh payloads via governed `RemedialModule` (PUBLISHED only); no whole-level downgrade and no forced replay; re-assessment uses fresh items.
7. Recommendation is a Level 3 explainable contract (six inputs → NEXT_UNIT/REMEDIAL_MODULE/PRACTICE + rationale + inputSnapshot + ruleVersion + generatedAt); no algorithm.
8. Common Engine stays language-invariant; EN room and ZH room (hidePinyin, versioned HSK) live in config/bank/rubric; HSK mapping/version stays open.
9. Ten invariants I1–I10 preserved; open decisions listed in D3 §N; Mapping A referenced only as D2 curriculum placement compatibility, never generalized.
10. Compatibility verdict: no D2 change required; stop-rule triggered no out-of-scope edit.

### Consequences

- D3 spec (A–Q) with Q = `READY FOR D4 CONTENT/CURRICULUM DESIGN`; six D3 diagrams mirror prose; `01 §3.4` + `05 §6` cross-references added; T-D3-DESIGN-001 PASS; no freeze claimed.

---

## ADR-017 — D4 Content & Curriculum Design (Logical Design Specification)

### Date

2026-09-24

### Category

scope-ambiguity

### Context

Following human approval of the D4 plan and D3 acceptance for D4, D4 formalizes the complete logical content and curriculum design artifacts inheriting D1/D2/D3 baselines. Constraints: design-only; zero runtime application code, zero database schema mutations or migrations, zero scoring/adaptive/recommendation algorithms, zero UI implementation; no Design Freeze claimed; strict prohibition of ghost entities (`Exam`, `QuestionBank`, `AssessmentSession`).

### Decision

1. **Curriculum Architecture & Hierarchy:** Enforce strict structural containment `Course → Unit → Lesson → Exercise`. Decouple structural containment from semantic knowledge reuse: `Concept` is an independent domain entity referenced across Lessons, Exercises, Assessment Items, `ConceptMastery`, and `KnowledgeGap`; `Concept` is NEVER a child entity of `Exercise`.
2. **Unit Publication Visibility vs Learner Progression:** A `Unit` is visible in the public catalog if and only if 4/4 child Lessons are `PUBLISHED`. Individual progression is governed by linear prerequisites, diagnostic placement (Mapping A), or Jump (≥95%). Invariant: `Catalog Publication Status ≠ Learner Unlock Status ≠ Learning Completion ≠ Proficiency ≠ Mastery`.
3. **English A1 Baseline Inventory:** Formalize 6 Units, 24 Lessons, ~200 vocabulary items, and 5 exercises per lesson based on `docs/08-english-a1-curriculum.md`.
4. **Lesson Blueprint:** Standardized logical template encompassing identity/governance (SoD, Clone-to-Draft v2 `supersedesId`), pedagogical outcomes, multi-skill payloads, 3-stage practice flow (Guided, Independent, Review), controlled retry allowance (`allowance = max(1, floor(5*0.10)) = 1`), and D3 evidence linkage. Invariant: `Practice Evidence vs Assessment Evidence vs Completion Boundary vs Verified Proficiency`.
5. **Concept Taxonomy:** Standardized `Concept` schema (`conceptId`, hierarchical code `LANG-LEVEL-DOMAIN-TOPIC-SEQ`, domain, prerequisite DAG, lifecycle status, version). Strict prohibition of untyped free-text `conceptTag`. Initial English A1 concept mapping marked `PROPOSED`.
6. **5 Canonical Logical Content Types:** Authoring envelopes for `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`. Explicitly designated as D4 logical/target authoring models (Applied DB supports MCQ/FILL/REORDER; LISTENING/GRAMMAR are Target Schema specifications). Zero `MATCHING` canonical; no `AssessmentSession`, `Exam`, or `QuestionBank` ghost entities. `GRAMMAR` exercise payload is deterministic and independent of transient GEC AI service (`/v1/gec/correct`).
7. **Reading Semantic Boundary:** Maintain strict decoupling: `Reading` = D3 skill/dimension; `READING` compound exercise payload = logical/design candidate (`PROPOSED / DESIGN GAP` per D2 §6.11). Physical database enum/schema is NOT DECIDED / OUT OF SCOPE.
8. **Remedial Content Model:** `RemedialModule` is governed micro-content targeting specific `Concept` deficits identified by `KnowledgeGap`. Delivery is restricted to `PUBLISHED` status only. Strict invariants: no whole-level downgrade, no forced replay of completed lessons, no reuse of old exercise payloads, no separate runtime `Remediation` entity.
9. **Assessment Item Bank:** Classify items by stable ID, language, skill dimension, conceptId, descriptive difficulty (Entry/Mid/Upper), and assessment eligibility. Decouple purpose (`assessmentType`) from execution mode (`deliveryMode`).
10. **Multi-Language 4-Tier Chain:** Declarative parameterization (`Common Content Model → Language Config → Content/Item Bank → Language-specific Rules`). Zero hardcoded language branching. English config accommodates collocations, word families, connected speech; Chinese config enforces `hidePinyin: true` default for Hanzi reading assessment (`E-EXP-04`); HSK framework versioning remains `OPEN / PENDING`.

### Consequences

- Master specification `docs/phase-1-d4-content-curriculum-design.md` (Sections A–T) with status `READY FOR INDEPENDENT REVIEW` and `DESIGN FREEZE: NOT CLAIMED`.
- 6 D4 PlantUML diagrams authored under `docs/plantuml/` (`curriculum-architecture-d4`, `lesson-blueprint-d4`, `concept-content-evidence-d4`, `item-bank-authoring-d4`, `remedial-content-d4`, `multilanguage-content-d4`).
- Secondary docs updated: `docs/08-english-a1-curriculum.md`, `docs/01-architecture.md` (§3.5), `docs/05-traceability-matrix.md` (§7), `docs/QUICK-REF.md`.
- Automated verification: `T-D4-DESIGN-001` PASS (18/18 consistency guards, 17/17 D4 checks, `git diff --check` 0).
- Zero code, zero migrations, zero UI code, zero git commits created.

---

## ADR-018 — Milestone M2.1 Domain & Logical Data Foundation Final Acceptance

### Date

2026-09-25

### Category

scope-ambiguity

### Context

Milestone M2.1 (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`) establishes the implementation-independent domain and logical data foundation for Lingora. Following comprehensive revisions addressing initial audit findings (P0-01 through P1-07), M2.1 underwent formal Independent Re-Review to determine readiness for downstream runtime milestones (M2.2+).

### Decision

1. **Formal Gate Acceptance:**
   - **Gate D-G1 (Domain & Lifecycle Traceability):** `PASS`.
   - **Gate D-G2 (Data Model & Boundary Integrity):** `PASS`.
   - **Overall Milestone Verdict:** `M2.1 ACCEPTED FOR M2.2`.
   - **Evidence Basis:** The Independent Re-Review serves as the authoritative final acceptance evidence.
2. **Audit Findings Closure:**
   - **P0-01 CLOSED:** Administrator emergency publish/archive authority is confirmed as an emergency-only bypass strictly for already `APPROVED` content (transition `APPROVED → PUBLISHED` with mandatory justification and `AuditLog`). Normal workflow remains Manager publish; Creator self-approval/publishing and Moderator publishing remain strictly barred.
   - **P1-05 CLOSED:** Gate D-G1 is formally accepted via independent re-review evidence.
   - All other findings (P1-01 through P1-07, P2-01) confirmed CLOSED.
3. **Log Reconciliation & Historical Governance:**
   - Appended corrections for historical log inaccuracies (F-LOG-01, F-LOG-02, F-LOG-03) across `HANDOFF.md`, `logs/development-log.md`, and `logs/test-log.md` without modifying historical timestamps or deleting past records.
4. **Boundary & Implementation Invariants:**
   - M2.1 remains strictly design-only. Zero runtime application code, zero database schema mutations or migrations, zero UI code were introduced.
   - Downstream milestone state: `M2.2 PLAN: NOT STARTED`.

### Consequences

- Milestone M2.1 is officially `ACCEPTED FOR M2.2`.
- `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` metadata reflects accepted state.
- Governance logs and handoff records are fully reconciled and consistent with independent review findings.
- Implementation of Milestone M2.2 remains separately gated and cannot proceed until an implementation plan is formally submitted and approved.

---

## ADR-019 — Milestone M2.2 System Behavior, Use Cases, Activity & State Machine Design Foundation

### Date

2026-09-25

### Category

runtime-boundary

### Context

Milestone M2.2 bridges the logical domain/data foundation (M2.1) and curriculum design (D3/D4) to runtime system behavior, activity modeling, use case execution, and state machines. It formalizes Artifacts #2, #3, #9, #10, #17, #18, #19 across Core Learning, Content Governance, Administration, and Optional Modules.

### Decision

1. **Master Specification:** Authored `docs/phase-1-m2-2-behavior-uc-activity-state.md` (Sections 1–16) establishing behavioral semantics, preconditions, postconditions, and error handling.
2. **15 Canonical Use Cases & 15 Behavioral Families:** Complete coverage of `UC-01` through `UC-15` and `BF-01` through `BF-15`. `UC-15` / `BF-15` explicitly categorized as `OPTIONAL / FUTURE EXTENSION BOUNDARY`. Zero ghost use cases (`UC-16/17/18`). `BF-14` encapsulates P1-FR-007 scenario writing/GEC.
3. **Six-Field Architectural Contract:** Enforced 6-field contract (`Artifact Number & Title`, `Source Traceability`, `Scope & Boundary`, `System Actors & Authorizations`, `Lifecycle States & Invariants`, `Open Decisions & Non-Claims`) across all designated artifacts (#2, #3, #9, #10, #17, #18, #19).
4. **Content Lifecycle & SoD:** 6 states (`DRAFT`, `IN_REVIEW`, `REJECTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`). Separation of Duties strictly enforced: Creator authors/submits; Moderator reviews/approves; Content Manager publishes approved batches; Administrator emergency publish permitted ONLY on `APPROVED` content. `ARCHIVED` is terminal in Core; mutations require Clone-to-Draft v2.
5. **Learner Progression & Jump Invariants:** 4 progression states (`LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP`). Successful Jump Assessment ($\ge 95\%$) marks bypassed units/lessons as `SKIPPED_BY_JUMP` (`by_jump=true`). Zero `COMPLETED_BY_JUMP`. Zero CEFR certification. Failed Jump triggers a 24-hour cooldown lock.
6. **Dual Assessment Entry Pathways:** Branch A (Self-Report / Skip) records `selfReportedLevel` as `UNVERIFIED` with default/provisional starting point; explicitly produces NO `AssessmentResult`, NO `SkillProfile`, and NO `verifiedProficiency`. Branch B (Diagnostic Assessment) administers 30-item test, persists immutable `AssessmentResult`, generates `SkillProfile`, assigns `verifiedProficiency`, and routes via English A1 Mapping A bands (0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6).
7. **Exercise Execution & Controlled Retry:** Policy D7: `allowance = max(1, floor(N * 0.10))`, 70% credit score on correct retry attempt. Zero 80% retry floor.
8. **SRS Review & Daily Streak Engine:** Policy B review intervals `[1, 3, 7, 14, 30]` days; failure resets interval strictly to Stage 1 (1 day). Atomic execution via `record_review` RPC. Daily streak evaluated at 23:59:59 in `Asia/Ho_Chi_Minh` timezone; missed day resets streak strictly to 1 (never 0; no auto-freeze without freeze power-up).
9. **Logical Screen-Flow Inventory:** 13 Learner screen flows (`SCR-L-01` to `SCR-L-13`) and 7 Authoring/Ops screen flows (`SCR-A-01` to `SCR-A-07`).
10. **DD Behavioral Closure:** Addressed DD-01, DD-02, DD-04, DD-05, DD-06 at the behavioral and lifecycle level without modifying frozen physical schemas.
11. **PlantUML Visual Specifications:** Authored 7 diagrams under `docs/plantuml/` (`uc-overview-m22.puml`, `activity-learner-flow-m22.puml`, `activity-authoring-flow-m22.puml`, `state-progression-readiness-m22.puml`, `placement-jump-m22.puml`, `srs-flow-m22.puml`, `screen-flow-inventory-m22.puml`).
12. **Gates D-G4 & D-G7 Satisfied:** Formal evidence documented in §12 for Gate D-G4 (Behavioral & Use Case Integrity) and Gate D-G7 (State Machine & Transition Completeness).
13. **Strict Boundary Invariants:** Zero runtime application code, zero database schema mutations or migrations, zero UI code, zero git commits created.

### Consequences

- Establishes canonical behavioral baseline for M2.3 API contract alignment and M3 runtime implementations.
- Status set to `READY FOR INDEPENDENT REVIEW` (`DESIGN COMPLETE: NOT CLAIMED`, `ACCEPTED: NOT CLAIMED`).

---

## ADR-020 — Milestone M2.2 Remediation & Independent Review Findings Closure

### Date

2026-09-26

### Category

scope-ambiguity

### Context

Milestone M2.2 independent review returned a verdict of `FAIL` citing 16 P1 and 15 P2 findings across Use Case definitions, Behavioral Family alignment, state machine naming, actor role terminology, diagnostic sizing, and diagram syntax. Remediation is required to restore complete semantic and architectural alignment before submitting for independent re-review.

### Decision

1. **Content Lifecycle State Machine Alignment:** Standardized on 6 canonical states (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`), eliminating the non-canonical `REJECTED` state across all text and diagrams. Content revisions strictly follow Clone-to-Draft v2 (`supersedesId`).
2. **Actor & Role Normalization:** Standardized strictly on the 6 canonical human roles (`Learner`, `Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`). Content publishing authority belongs canonically to `Organizational Manager` (`UC-10`). Administrator emergency publishing is restricted strictly to already `APPROVED` content with mandatory reason + `AuditLog`. The invented role "Content Manager" is completely eliminated.
3. **Decoupling Jump from UC-03:** `UC-03` is strictly defined as Placement Test / Diagnostic Assessment (`BF-08`). Conditional Jump is decoupled from UC-03 and placed under `UC-04` Curriculum Browse & Conditional Jump (`BF-11`).
4. **Behavioral Family Alignment with System Analysis §5:** Corrected all mappings of `BF-01` through `BF-15` to match `docs/06-system-analysis.md` §5 definitions (e.g. BF-02 = Curriculum Planning, BF-08 = Placement Test, BF-11 = Conditional Jump, BF-12 = SRS Review, BF-13 = Progress & Streak Tracking).
5. **State Machine Output & Transition Alignment:**
   - `LevelReadiness` strictly produces 3 canonical outputs: `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE` (eliminating `NOT_READY`, `EVALUATING`).
   - `KnowledgeGap` strictly follows 3 states: `OPEN`, `IN_REMEDIATION`, `RESOLVED` (eliminating `DETECTED`).
   - `ConceptMastery` strictly follows 3 states: `NOVICE`, `DEVELOPING`, `MASTERED` (eliminating `INTRODUCED`, `PRACTICING`).
6. **Lesson Completion Semantics:** Formally defined that lesson completion is owned by `UC-05` / `BF-10` upon completing all first-pass exercises and available retry allowance, with zero 80% retry floor. Invariant preserved: Exercise correctness $\ne$ Lesson completion $\ne$ Mastery $\ne$ Proficiency.
7. **Diagnostic Assessment Sizing:** Baseline scale is maintained as `~25–30 items, PROPOSED / PENDING VALIDATION`. Mapping A is clarified as a 0–30 raw score range, not proof of 30 delivered items.
8. **Streak & SRS Semantics:** Evaluated lazily on qualifying activity across calendar date boundaries (`lastQualifyingActivityDate`); removed the artificial 23:59:59 cutoff; removed active Streak Freeze / Power-up (noted as future gamification extension).
9. **Screen-Flow Inventory Unification:** Standardized on 14 Learner screens (`SCR-L-01`..`SCR-L-14`) and 11 Admin/Authoring screens (`SCR-A-01`..`SCR-A-11`).
10. **Full Specification of Administrative Use Cases:** Expanded `UC-11`, `UC-12`, `UC-13`, `UC-14` with all 10 required specification sections including Alternate and Exception flows.
11. **PlantUML Diagrams Re-authored:** All 7 PlantUML diagrams re-authored to reflect remediated states, roles, and flows, with verified syntax balance.
12. **Secondary Documents & Logs Aligned:** Synchronized `docs/05-traceability-matrix.md` §8 and `docs/01-architecture.md` §3.6.

### Consequences

- All 16 P1 findings and 15 P2 hygiene findings are completely resolved.
- M2.2 artifacts achieve 100% semantic consistency with D1–D4 and M2.1 frozen baselines.
- Status set to `READY FOR INDEPENDENT RE-REVIEW` (`DESIGN COMPLETE: NOT CLAIMED`, `ACCEPTED: NOT CLAIMED`, `COMMIT: NOT CREATED`).
- Zero runtime application code, zero DB migrations/schema changes created.

---

## ADR-021 — Milestone M2.2 Acceptance FOR M2.3

### Date

2026-09-26

### Category

scope-ambiguity

### Context

Milestone M2.2 completed implementation, Independent Final Review (`FAIL`: 16 P1 + 15 P2), full remediation, Independent Re-Review (`PASS WITH NON-BLOCKING ISSUES`: 0 P0, 0 P1, 4 P2: N-01..N-04), and final P2 cleanup. Targeted acceptance verification (read-only artifact reads + keyword scans, no trust in prior reports alone) confirmed: N-01 CLOSED (Skill Profile → `P1-FR-016`; `P1-FR-017` DEFERRED/non-UC with explicit note), N-02 CLOSED (05 §8 GEC row split: support `UC-14`/`BF-15` vs GEC `P1-FR-007`/no-UC/`BF-14`), N-03 CLOSED (freeze DEFERRED wording in `01` §3.6), N-04 CLOSED (Rate Limit removed from 05 §8); no remaining P1 semantic violations; no active ghost entities/values/roles (remaining scan hits are prohibition text or locked-policy values).

### Decision

1. Record `M2.2 ACCEPTED FOR M2.3` (acceptance milestone only — not Design Complete, not M2.3 Ready, not product implementation complete, not runtime readiness).
2. Confirm D-G4 = PASS and D-G7 = PASS on current artifacts (15 UCs, 15 canonical BFs, 6 roles + SoD, canonical state machines, locked placement/jump/retry/SRS values, self-report vs diagnostic separation, immutable AssessmentResult, consistent 14+11 screen inventory, traceability chain).
3. Set `M2.3 PLAN: NOT STARTED` — M2.3 requires a separate human-approved plan; no M2.3 work begins in this task.
4. Preserve all prior review/remediation history (FAIL review, re-review, P2 cleanup evidence retained, not deleted).

### Consequences

- M2.2 behavior layer is the accepted baseline for M2.3 Sequence + API / Service Boundary design.
- Implementation remains out of scope: zero runtime/schema/API/UI/security work; D3/D4/M2.1 unmodified.
- `COMMIT: NOT CREATED` in this task.

---

## ADR-022 — Milestone M2.3 Sequence, API Contract & Service Boundary Modeling

### Date

2026-09-26

### Category

runtime-boundary

### Context

Milestone M2.2 established the behavioral layer (15 Use Cases, 15 Behavioral Families, state machines, decision flows) and was formally accepted (`M2.2 ACCEPTED FOR M2.3`). Milestone M2.3 translates accepted behavior into an authoritative design-level interaction contract: sequence interactions, service boundaries, API surface classification, state-change ownership, and error containment without implementing runtime code or modifying frozen database schemas.

### Decision

1. **Artifact #11 (Sequence Interaction Suite):** Authored 10 canonical sequence specifications (`SEQ-01` through `SEQ-10`) in `docs/phase-1-m2-3-sequence-api-service-boundary.md` and 10 PlantUML diagrams under `docs/plantuml/sequence-*m23.puml`. Lifeline vocabulary is strictly closed: `Learner`, 5 staff roles (`Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`, `Operations Staff`), `Web Learner` (BFF proxy/UI), `Web Admin`, `Supabase GoTrue Auth`, `Supabase PostgREST`, `Supabase RPC (record_review)`, `Supabase Storage`, `AI Server (FastAPI, stateless)`, `AuditLog (append-only ledger)`.
2. **Artifact #12 (API Contract / Service Boundary & Gap Register):** Classified 10 core surfaces across `CURRENT` (GoTrue, PostgREST reads, RPC `record_review`, Storage, AI Health), `TARGET` (GEC `POST /v1/gec/correct`, Route Handler Proxy, Admin/Prisma, App Services), `COMPATIBILITY GAP` (AI legacy `/v1/srs/schedule`, `/v1/chat/*`), and `FUTURE` (B2B Cohorts). Kept `docs/03-api-contract.md` 100% byte-identical (read-only); recorded all technical distances in the M2.3 API Gap Register (§3.2).
3. **Artifact #15 (Service Interaction Model & 4-Layer Responsibility Model):** Modeled logical services across 4 architectural layers: Presentation Layer, Application/BFF Layer, Domain Services Layer (`PlacementService`, `JumpAssessmentService`, `LessonExecutionService`, `SrsScheduler`, `StreakEvaluatorService`, `ContentLifecycleService`), and Persistence/External Layer. Authored `service-boundary-m23.puml` and `layer-responsibility-m23.puml`.
4. **Stateless AI Non-Ownership Invariant (ADR-014):** GEC is a stateless AI service (`BF-14` / `P1-FR-007`, zero UC). Invoked exclusively through the Route Handler proxy with a hard 8.0s timeout and graceful fallback to learner raw text with user notification. AI Server owns solely transient `corrected_text` and derived edit spans; AI owns ZERO learner progression, mastery, proficiency, streak, or completion.
5. **Single State Ownership Matrix:** Established exclusive authoritative write owners across 9 core state categories, completely preventing conflicting mutations.
6. **Conceptual Idempotency & Atomicity:** Strict atomicity enforced for RPC `record_review`, content publishing, and clone-to-draft v2 creation. Anti-double-submit protections specified for lesson retry and assessment submissions.
7. **Preservation of Open Decisions:** Preserved all 13 open decision groups from D3 §N and D4 §Q as `OPEN / CONFIGURABLE / PENDING VALIDATION`.
8. **Traceability & Governance:** Appended Section 9 to `docs/05-traceability-matrix.md` and Section 3.7 to `docs/01-architecture.md`. Recorded D-G4 PASS, D-G5 PASS, and D-G6 Input Evidence.

### Consequences

- System interaction architecture is fully specified at the logical design level, unblocking Milestone M2.4 (Physical Data & Security Architecture).
- `docs/03-api-contract.md` preserved byte-identical with zero uncontrolled modifications.
- Zero runtime application code, zero DB migrations/schema changes created.
- Status set to `READY FOR INDEPENDENT REVIEW` (`DESIGN COMPLETE: NOT CLAIMED`, `M2.3 ACCEPTED: NOT CLAIMED`, `COMMIT: NOT CREATED`).

---

## ADR-023 — Milestone M2.3 Independent Review Findings Remediation

### Date

2026-09-26

### Category

runtime-boundary

### Context

Independent Review for Milestone M2.3 returned `FAIL` with 14 P1 findings and enumerated P2 findings across entity boundaries, RPC signatures, column names, policy ranges, separation of duties, and error envelope formatting. In accordance with canonical governance rules, remediation was executed strictly against canonical sources (`plans/m2-3-sequence-api-service-boundary-plan.md`, `docs/phase-1-m2-2-behavior-uc-activity-state.md`, `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`, `docs/01-architecture.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, ADR-002, ADR-003, ADR-006, ADR-008, ADR-010, ADR-014, SEC-D8..10), preserving `docs/03-api-contract.md` 100% byte-identical.

### Decision

1. **Entity Boundaries & Transient Attempts (F-ENT-01):** Removed `public.ExerciseAttempt` completely as a persisted entity across all specifications, diagrams, and matrices. Exercise attempts remain transient request/session data evaluated in-flight by `LessonExecutionService`.
2. **Canonical RPC Signature & SRS Columns (F-RPC-01, F-RPC-02, F-STEP-01):** Restored the canonical locked 4-parameter signature for `record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`. Completely eliminated non-canonical parameters (`p_rating`, `p_vocab_id`, `p_response_time`) and FSRS scale references (AGAIN/HARD/GOOD/EASY) from SEQ-06. Restored canonical columns on `review_logs` (`id, srs_card_id, is_correct, interval_days, reviewed_at`), removing any `rating` column. Reconciled column names to canonical `interval_days` and `review_count`. Clarified `ReviewLog Store` in SEQ-06 as `(SRS History Log)` rather than audit log.
3. **AssessmentResult & SkillProfile Canonical Alignment (F-FIELD-01, F-FIELD-02):** Removed non-canonical columns `score` and `passed` from `AssessmentResult`. Persist only canonical M2.1 fields (`dimensions, rawScores, stageData, languageConfig, completedAt`). Reconciled `SkillProfile` to contain skill dimension levels (`vocabularyLevel, ...`) and `radarData`, owned by Learner domain. Preserved `verifiedProficiency` strictly on `LearnerProfile`.
4. **Candidate Fields & Idempotency Rules (F-FIELD-03, F-FIELD-04):** Reconciled Profile starting unit to `starting_unit INT [TARGET-CANDIDATE DD-06 / OPEN DESIGN]`. Removed `lastJumpFailedAt` column from database references; 24h cooldown rule is enforced as a conceptual domain rule, with persistence mechanism preserved as OPEN DESIGN.
5. **Account Status & Reminder Ownership (F-FIELD-05, F-FIELD-06):** Reconciled account locking to canonical boolean `isActive: BOOLEAN` (default true) alongside candidate enum `SUSPENDED [DD-01 / OPEN DESIGN]`. Harmonized study reminders as client-local storage per ADR-006 with zero Profile database columns.
6. **Policy Ranges & Storage Boundaries (F-POL-01, F-OPEN-01, F-STORE-01):** Locked `dailyGoalMin` range strictly to `[5..120]`. Explicitly tagged diagnostic routing item count as `[PROPOSED ~10-12 items, PENDING VALIDATION]`. Updated vocabulary audio retrieval to direct RLS-mediated Supabase Storage paths (`vocabulary/{vocabId}/{filename}`) per PA2 compliance (zero signed URLs).
7. **Separation of Duties & Self-Approval Prevention (F-SOD-01):** Added explicit authorization guard in SEQ-08: `auth.uid() != Lesson.creatorId`, returning `403 Forbidden (SOD_VIOLATION_SELF_REVIEW)` upon self-approval attempt.
8. **Error Envelope & Code Taxonomy (F-ENV-01, F-CODE-01):** Reconciled error response envelope to singular `"detail"` (`{"detail": "..."}`). Error Taxonomy classifies every error code into `CANONICAL_FROM_03`, `M2.3_DESIGN_ADDITION`, or `FUTURE`. Reconciled `TEXT_TOO_LONG` strictly to HTTP 413.
9. **Stateless AI GEC Contract & Auth (F-AUTH-01, F-RESP-01):** Enforced forwarding of learner session JWT to AI GEC. AI response explicitly specifies `model_version`, `is_mock: false`, and `latency_ms: 120`.
10. **Hygiene & Architectural Parity (F-PLAT-01, F-FILE-01, F-WORD-01, N-03):** Labeled `layer-responsibility-m23.puml` as `#15 (Supporting)`. Reconciled platform scope to web-only admin portal (removed Desktop references from topology). Removed RFC phrasing and leaked finding IDs.

### Consequences

- All 14 P1 findings and all 13 enumerated P2 findings resolved.
- Automated verification expanded to 20 deterministic checks in `scratch/verify_m23_design.py`, passing with exit code 0.
- All 18 consistency guards and all D4 focused checks remain 100% green.
- Milestone status updated to `READY FOR INDEPENDENT RE-REVIEW` (`DESIGN COMPLETE: NOT CLAIMED`, `M2.3 ACCEPTED: NOT CLAIMED`, `COMMIT: NOT CREATED`).

---

## ADR-024 — Milestone M2.3 Final Cleanup of Independent Re-Review Non-Blocking Findings

### Date

2026-09-26

### Category

runtime-boundary

### Context

Milestone M2.3 Independent Re-Review returned `PASS WITH NON-BLOCKING ISSUES` (0 P0, 0 P1, 7 P2: N-R1..N-R7, F-WS-01). To achieve full cleanliness prior to formal acceptance, a targeted final cleanup was conducted addressing: profile state labeling, DD reference accuracy, error taxonomy provenance against `docs/03-api-contract.md`, CDN wording elimination, UNLOCKED vocabulary qualification, AI telemetry formatting as runtime-derived examples, framework-neutral URI templates, and zero whitespace errors (`git diff --check`).

### Decision

1. **Profile State Labeling (N-R1):** Removed `[canonical boolean]` from `isActive` since M2.1 does not define `Profile.isActive`; preserved `isActive` and `SUSPENDED` strictly as `[TARGET-CANDIDATE / OPEN DESIGN]`; completely removed ungrounded tag `DD-01` from Profile state.
2. **DD Reference Correction (N-R2):** Corrected `assignmentBrief` to reference `DD-04` (Assignment Representation) and `supersedesId` to reference `DD-02` (Revision Representation); completely eliminated erroneous `DD-07` tags across all M2.3 specifications and diagrams.
3. **Error Taxonomy Provenance (N-R3):** Re-audited error taxonomy strictly against `docs/03-api-contract.md`. Tagged exclusively the 7 canonical codes from `03` as `CANONICAL_FROM_03` (`INVALID_INPUT`, `TEXT_TOO_LONG`, `LANG_NOT_SUPPORTED` [mapped to HTTP 422 per 03], `SCENARIO_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`, `MODEL_UNAVAILABLE`). Classified all M2.3-designed codes as `M2.3_DESIGN_ADDITION`. Explicitly documented `request_id` as `[M2.3 DESIGN ADDITION / OPTIONAL]` telemetry rather than a canonical standard field.
4. **CDN Wording Elimination (N-R4):** Replaced all references to "public CDN" or "Supabase Storage CDN" with direct RLS-mediated Supabase Storage buckets, as baseline does not lock CDN topology.
5. **UNLOCKED Vocabulary Qualification (N-R5):** Qualified all lesson access references using canonical M2.2 terminology (`IN_PROGRESS`) or annotated as `[PROVISIONAL / TARGET access status]`; preserved canonical `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` provenance.
6. **AI Telemetry Examples (N-R6):** Formatted `latency_ms` and `is_mock` in SEQ-10 and diagram as explicit runtime-derived examples (`<runtime-derived boolean, e.g. false>`, `<runtime-measured integer, e.g. 120>`) rather than hardcoded system constants.
7. **Framework Neutrality & Hygiene (N-R7 & F-WS-01):** Standardized route definitions in Section 2 to framework-neutral URI templates (`{lessonId}`, `{exerciseId}`) annotated as `[ILLUSTRATIVE / TARGET]`; replaced "Mã lỗi Quy chuẩn" with descriptive headers; cleaned all trailing whitespace resulting in 0 errors in `git diff --check`.

### Consequences

- All 7 non-blocking P2 findings (N-R1..N-R7) and F-WS-01 closed.
- Automated verification suite `scratch/verify_m23_design.py` expanded to 24 deterministic checks, passing with exit code 0.
- All 18 consistency guards and all 17 D4 checks remain 100% green.
- Milestone status updated to `READY FOR ACCEPTANCE` (`M2.3 ACCEPTANCE: NOT CLAIMED`, `COMMIT: NOT CREATED`).

---

## ADR-025 — Milestone M2.3 Acceptance FOR M2.4

### Date

2026-09-26

### Category

`runtime-boundary`

### Context

Milestone M2.3 completed implementation, Independent Review (`FAIL`: 14 P1 + 13 P2), full remediation, Independent Re-Review (`PASS WITH NON-BLOCKING ISSUES`: 0 P0/P1, 7 P2 N-R1..N-R7), and final P2 cleanup (all closed; `verify_m23_design.py` 24/24 PASS, guards 18/18, D4 17/17, `git diff --check` clean). Targeted acceptance verification confirmed all preconditions: M2.2 ACCEPTED, plan APPROVED, artifacts complete, `03` byte-identical, zero runtime/schema changes, no unresolved P0/P1 or blocking P2.

### Decision

1. Record `M2.3 ACCEPTED FOR M2.4` (acceptance milestone only — not Design Complete, not M2.4 Complete, no runtime implementation, not production-ready).
2. Scope accepted: Artifact #11 (SEQ-01..10), Artifact #12 (contract/service boundary + Gap Register, `03` read-only), Artifact #15 (service interaction model, single ownership, stateless AI boundary); D-G4 PASS, D-G5 PASS, D-G6 INPUT EVIDENCE ONLY (closure belongs to M2.4/M2.5); 13 open decision groups preserved OPEN/CONFIGURABLE/PENDING.
3. Set `M2.4 = NEXT MILESTONE / PLAN NOT STARTED` — no M2.4 work begins in this task.
4. Preserve all prior review/remediation history; do not rewrite historical entries.

### Consequences

- M2.3 interaction layer is the accepted baseline for M2.4 Architecture + Security design.
- `COMMIT: NOT CREATED` in this task.

---

## ADR-026 — Milestone M2.4 Component Architecture and Security Responsibility Design

### Date

2026-09-26

### Category

`runtime-boundary`

### Context

Approved implementation plan `plans/m2-4-architecture-security-plan.md` required establishing Artifacts #13 (Component Architecture), #14 (Deployment/Runtime Boundary), and #16 (Security Responsibility Matrix), resolving DD-03 (Audit Architecture) and DD-10 (Role Enforcement Split) in mandatory 3 tiers, providing design evidence for validation gates D-G5 and D-G6, and mapping all 15 Use Cases and 15 sensitive operations without claiming the target runtime is production-ready or closed.

### Decision

1. **Component Hierarchy & Ownership (Artifact #13):** Established a strict 5-layer logical hierarchy (`Presentation → Application Orchestrators (BFF) → Domain Services → Persistence & Infrastructure → External Providers`) spanning 19 logical components with strictly acyclic, top-down dependencies. Every domain rule and state transition is owned by exactly one domain service. AI Integration is modeled as a stateless external provider proxy without database connections or state ownership.
2. **Deployment & Logical Security Zones (Artifact #14):** Partitioned the system into 5 logical security zones (Zone 1 Client, Zone 2 BFF/Vercel, Zone 3 Managed Supabase DB/Storage, Zone 4 Isolated AI Compute, Zone 5 Privileged Ops). Categorized all components, secrets, and datastores strictly as `CURRENT_APPLIED` vs `TARGET_DESIGN` vs `FUTURE_EXTENSION`. Established the anti-drift rule that target runtime is NEVER claimed ready or deployed.
3. **Secret Isolation & Credential Boundaries:** Completely isolated `SUPABASE_SERVICE_ROLE_KEY` from Learner Web runtime (`lingora-web`) and browser clients. Client sessions are managed strictly via server-side `httpOnly`, `SameSite=Lax` cookies. AI Server receives forwarded user JWT via Next.js proxy and verifies via public JWKS (ES256) with zero database credentials.
4. **Security Responsibility Matrix (Artifact #16):** Defined a single authoritative 6-boundary matrix (`Learner Web`, `Admin Web`, `Supabase RLS`, `Privileged Service Role`, `AI Server`, `Audit`) governing 15 sensitive operations (`OP-01`..`OP-15`). Application Authorization checks and Database RLS policies are both mandatory; app checks never replace RLS. Privileged service role execution is strictly limited to maintenance/seed/migrations (`N/A — privileged service-role path`).
5. **Separation of Duties (SoD) & Negative Denial Paths:** Explicitly modeled negative paths denying creator self-review (`403 SOD_VIOLATION_SELF_REVIEW`), moderator self-publish (`403 SOD_VIOLATION_MODERATOR_PUBLISH`), learner cross-tenant access, and direct transition `IN_REVIEW → PUBLISHED`. Administrator emergency publish is permitted ONLY on already `APPROVED` content with mandatory reason and `AuditLog` emission (ADR-020).
6. **Decision DD-03 (Audit Architecture) 3-Tier Resolution:** Locked Behavior (immutable, append-only, 4 core fields), Design Specification closed in M2.4 (event catalog of 11 sensitive event codes, actor/target typing, UTC ISO 8601 timestamps), and Open Physical Representation (`metadata JSONB` shape, trigger vs app emission, IP/device fields, retention values stay `OPEN`).
7. **Decision DD-10 (Role Enforcement Split) 3-Tier Resolution:** Locked Behavior (6 canonical roles, DB-level RLS mandatory, app never replaces RLS), Design Specification closed in M2.4 (CURRENT 2-role vs TARGET 6-role mapping, app check vs RLS split, backward compatibility guarantee), and Open Physical Representation (migration DDL and SQL scripts stay `OPEN`).
8. **Validation Gates D-G5 & D-G6:** Provided design evidence confirming component/deployment boundary consistency (D-G5) and security/auth boundary consistency (D-G6); explicit invariant that D-G5 and D-G6 are NOT claimed as closed.

### Consequences

- Master specification `docs/phase-1-m2-4-architecture-security.md` and 3 PlantUML diagrams (`docs/plantuml/component-architecture-m24.puml`, `docs/plantuml/deployment-boundary-m24.puml`, `docs/plantuml/security-matrix-m24.puml`) establish the complete architecture and security design baseline for M2.5/M2.6.
- Secondary docs reconciled: `docs/01-architecture.md` (§3.8) and `docs/05-traceability-matrix.md` (§10).
- Zero application runtime code, zero DB schema/migrations, zero RLS SQL written, `docs/03-api-contract.md` 100% byte-identical.
- Milestone status: `READY FOR INDEPENDENT REVIEW` (`M2.4 ACCEPTANCE: NOT CLAIMED`, `COMMIT: NOT CREATED`).

---

## ADR-027 — Milestone M2.4 Acceptance FOR M2.5

### Date

2026-09-26

### Category

`runtime-boundary`

### Context

Milestone M2.4 completed implementation, Independent Review (`PASS WITH NON-BLOCKING ISSUES`: 0 P0, 0 P1, 5 P2), and final P2 cleanup (F-AUTH-01 social-login removed; F-EVT-01 event count corrected to 11 specified events; F-DEP-01 deployment details marked illustrative/candidate; F-TGT-01 SupportTicket wording fixed to FUTURE_MIGRATION boundary; F-SCR-01 verifier precedence fixed with negative self-test CHECK-17). Targeted acceptance verification confirmed: `verify_m24_design.py` 17/17 PASS, guards 18/18, D4 17/17, `git diff --check` clean, `03` byte-identical, zero runtime/schema scope, no unresolved P0/P1 or blocking P2.

### Decision

1. Record `M2.4 ACCEPTED FOR M2.5` (acceptance milestone only — not Design Complete, not M2.5 Complete, no runtime implementation, not production-ready).
2. Scope accepted: Artifact #13 (Component Architecture, 19 components), Artifact #14 (Deployment/Runtime Boundary, 5 zones), Artifact #16 (Security Responsibility Matrix, 15 operations × 6 boundaries); D-G5 design evidence PASS; D-G6 INPUT EVIDENCE ONLY (closure belongs to M2.5/M2.6; production readiness NOT claimed); target runtime NOT PRODUCTION READY / NOT DEPLOYED; open decisions preserved.
3. Set `M2.5 = NEXT MILESTONE / PLAN NOT STARTED` — no M2.5 work begins in this task.
4. Preserve all prior review/remediation history; do not rewrite historical entries.

### Consequences

- M2.4 architecture/security package is the accepted baseline for M2.5 Design Validation.
- `COMMIT: NOT CREATED` in this task.

---

## ADR-028 — Milestone M2.5 Acceptance FOR M2.6

### Date

2026-09-26

### Category

`runtime-boundary`

### Context

Milestone M2.5 completed implementation (Artifact #20 Design Validation Report), Independent Review (`FAIL`: 4 P1 + 4 P2: P1-01 traceability rows, P1-02 Mapping A bands, P1-03 UC-15 identity, P1-04 PlantUML citations, P2-01 row #20 D-G10, P2-02 verifier weakness, P2-03 Zone 5, P2-04 D1–D10 wording), full remediation, and Independent Re-Review (`PASS`: all 8 findings P1-01..P1-04, P2-01..P2-04 verified CLOSED). Targeted acceptance verification confirmed: `verify_m25_validation.py` 16/16 PASS (incl. 10-mutation suite), guards 18/18, D4 17/17, `git diff --check` clean, `03` byte-identical, zero runtime/schema scope, D-G10 excluded, no unresolved P0/P1.

### Decision

1. Record `M2.5 ACCEPTED FOR M2.6` (acceptance milestone only — not Design Complete, not M2.6 Complete, no runtime implementation, not production-ready).
2. Scope accepted: Artifact #20 (Design Validation Report with six-field contract); D-G1..D-G9 validated with Input/Method/PASS-FAIL/Evidence each (D-G5 design evidence, D-G6 INPUT EVIDENCE ONLY as established by M2.4; D-G10 EXCLUDED to M2.6); six-field × 20 complete; traceability (P1-FR-001..017, P1-NFR-001..004, UC-01..15, BF-01..15) and `phase-1-system-design-plan.md` §11 mapping (12/12) validated; DD-01..DD-06/DD-10 status recorded with physical representations OPEN (DD-03/DD-10 physical OPEN); target runtime NOT PRODUCTION READY / NOT DEPLOYED; open decisions preserved.
3. Set `M2.6 = NEXT MILESTONE / NOT STARTED` — no M2.6 work begins in this task.
4. Preserve all prior review/remediation history; do not rewrite historical entries.

### Consequences

- M2.5 validation package is the accepted baseline for M2.6 Design-to-Implementation Handoff.
- `COMMIT: NOT CREATED` in this task.

---

## ADR-029 — Milestone M2.6 Acceptance (Design-to-Implementation Handoff)

### Date

2026-09-26

### Category

`runtime-boundary`

### Context

Milestone M2.6 completed implementation (Handoff Specification with 7 deliverables: migration-plan outline, test-plan skeleton, API register, security/audit reconfirmation, report mapping + index, DD closure record, dependency register), Independent Review (`FAIL`: 11 P1 + 6 P2), full remediation, Independent Re-Review (`FAIL`: NEW-P1-01, P2-01/P2-05 residuals, NEW-P2-01/02/03), second remediation, and Final Independent Re-Review (`PASS`: all findings verified CLOSED, no new regression). Targeted acceptance verification confirmed: `verify_m26_handoff.py` 17/17 PASS (incl. 25-mutant suite), `verify_m25_validation.py` 16/16, guards 18/18, `git diff --check` clean, `03` byte-identical, zero runtime/schema scope, D-G10 handoff-readiness evidenced, no unresolved P0/P1.

### Decision

1. Record `M2.6 ACCEPTED` (formal acceptance of the Phase 1 Design-to-Implementation Handoff; acceptance milestone only — no production implementation executed, not production-ready, not a deployment approval).
2. Scope accepted: Handoff Specification (`docs/phase-1-m2-6-design-handoff.md`) with migration-plan outline (8 phases + rollback, design-only), test-plan skeleton (18 frames, `SKELETON — NOT EXECUTED`), API register (4 tiers, `03` read-only), security/audit reconfirmation (5 zones incl. Zone 5, 6 roles, 11 canonical events), report mapping + artifact/evidence index (§11 parity, anti-fabrication enforced), DD-01..DD-06/DD-10 Tier 3 physical decisions documented on paper (no SQL/DDL executed, no schema modified), Implementation & Governance Dependency Register (9-field schema, 0 unresolved BLOCKING); D-G10 `IMPLEMENTATION HANDOFF READINESS` evidenced (NOT runtime/production readiness); target runtime NOT PRODUCTION READY / NOT DEPLOYED; open Phase 2 entry items preserved as documented dependencies.
3. Phase 1 System Design is COMPLETE up to the approved handoff boundary; downstream Phase 2 implementation requires its own gated plans. No Phase 2 work begins in this task.
4. Preserve all prior review/remediation history; do not rewrite historical entries.

### Consequences

- The M2.6 handoff package is the accepted baseline for Phase 2 implementation planning.
- `COMMIT: NOT CREATED` in this task.

---

## ADR-030 — P0-D04 Shared Curriculum and Learner-Context Domain Decision

### Date

2026-10-08

### Category

`domain-model / curriculum-architecture`

### Approval Evidence

The user explicitly accepted the revised P0-D04 proposal on 2026-10-08, subject to the three clarifications recorded below. This approval is limited to the domain decision and documentation reconciliation. It does not authorize product implementation, schema changes, migrations, or P0-D03 work.

### Context

P0-D04 was open in `plans/master-implementation-and-report-plan.md` §19.1. The current repository has `Language`, `Course`, `Unit`, `Lesson`, and learner-content state models, but no `LearningContext`, `LearningPlan`, or framework-aware `ProficiencyFramework` / `Level` models. The existing Prisma `Course.cefr` field and SQL migration state remain physical repository evidence and are not changed by this decision. Earlier logical designs contain English A1 assumptions and learner-state ownership choices that must not be generalized beyond their scope.

### Decision

1. Lingora uses **shared curriculum/content with learner-specific plans and state**. Learners do not own copies of `Course`, `Lesson`, or `Exercise`.
2. In the MVP, each learnable `Language` has one shared/core `Course` as its primary curriculum. This is an MVP business convention, not a permanent schema invariant. More than one `Course` for a `Language` may be justified later by a genuinely independent syllabus, such as a specialized exam-preparation program. No `Track` is needed now.
3. `Work`, `Study`, `Travel`, and `General communication` are primarily `LearningPurpose` preferences on a learner's context. They do not automatically create separate Courses. Shared Lessons may carry controlled metadata for applicable framework/level, skill, topic, and purpose.
4. `LearningContext` is learner-specific state scoped to a learned `Language`. In the MVP, a user has **at most one `LearningContext` per learned `Language`** and at most **two active learned languages**. These are business rules, not schema cardinality constraints. P0-D03 retains the remaining decisions about context persistence and ownership of goals, course participation, progress, and proficiency.
5. `ProficiencyFramework` and `Level` are framework-aware concepts. CEFR is not a universal level enum; a level is interpreted within its framework and, where required, its version. Detailed framework mappings and physical representation remain outside this decision.
6. Learning/content `Progress` and language `Proficiency` are distinct. Completing all content does not itself certify proficiency or promote a learner to another level.
7. Placement evidence is scoped to the relevant `LearningContext`, not a one-time global account state. This does not resolve placement behavior, skip/retake rules, or the physical evidence model; those remain with P0-D05 and the applicable assessment design.
8. SRS remains associated with the user and shared `Vocabulary` by default; this decision does not move SRS state into `LearningContext`.
9. `LearningPlan` is initially a domain concept and deterministic result, with ordered `LearningPlanItems` referring to shared Lessons. Do not create `LearningPlan` or `LearningPlanItem` tables in the MVP unless a requirement needs persistence, learner edits, exact resumption of a prior plan, or plan-history audit.
10. TOEIC remains `DEFERRED` until requirements establish whether it is only a learning purpose, a separate curriculum/program, or an assessment-specific target.

### Consequences and Supersession

- P0-D04 is `RESOLVED` for the domain semantics above. No other P0 decision is resolved by this ADR.
- This decision supersedes earlier logical-target interpretations that require one CEFR level to define every Course or treat English A1 seed/curriculum data as platform-wide architecture. The existing `Course.cefr` physical field remains unchanged and is not endorsed as the future framework-neutral domain model.
- D3's distinction between progress, proficiency, mastery, and readiness remains in force. Its exact learner-state ownership and evidence representation must be reconciled with the per-language context boundary through P0-D03/P0-D05; historical D3/D4 specifications are not rewritten by this ADR.
- The D4 document remains `READY FOR INDEPENDENT REVIEW`; this ADR controls only the P0-D04 decisions explicitly listed above and does not accept the rest of D4.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. No product implementation is authorized.
- P0-D03 remains open. P0-D05 through P0-D07 remain unresolved as listed in the master plan.

### Status

`ACCEPTED — P0-D04 DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-031 — P0-D03 Independent Learner Context and Learner-State Ownership

### Date

`2026-10-08`

### Category

`domain-model / learner-state-ownership`

### Approval Evidence

The user explicitly accepted the P0-D03 domain proposal on 2026-10-08 with the clarifications recorded below. Approval is limited to domain semantics and documentation reconciliation. It does not authorize product implementation, physical-schema changes, migrations, or starting P0-D05.

### Context

ADR-030 accepted shared curriculum and a per-language `LearningContext` boundary while leaving remaining learner-state ownership and persistence to P0-D03. The repository's current Prisma and ordered SQL migration artifacts do not implement `LearningContext`, and their physical state disagrees; live database state remains unverified. Earlier M2.1/D3 logical targets place learner state on a single `LearnerProfile`; that ownership and the assumed persistence of `SkillProfile` require a scoped update for the accepted multi-language context model. Those historical documents are retained unchanged.

### Decision

1. `LearningContext` is learner-specific state for the pair `(User, learned Language)`. In the MVP, each user has at most one context for each learned Language and at most two contexts in `ACTIVE` state. These are domain/business rules, not a permanent schema constraint or a maximum total row count.
2. MVP context lifecycle requires only `ACTIVE` and `PAUSED`. A paused context remains available to resume and does not count toward the two-active-context limit. Do not add `COMPLETED` unless a later requirement establishes a distinct lifecycle need; finishing content is not completion of the learner's language context.
3. `Profile` owns account-global state: UI locale, native language, timezone, account preferences, and the global streak. `LearningContext` owns the learned Language, one primary `LearningPurpose`, focus-skill preferences, simple study preferences, starting point, and self-reported proficiency. Changing purpose or pausing a context does not reset progress, proficiency evidence, or SRS.
4. Starting point is a curriculum entry reference, not verified proficiency. Keep it level-level in the MVP with source/provenance such as placement evidence, self-report, or default entry; these are conceptual sources, not a prescribed physical enum. Finer Unit/Lesson routing remains subject to separately approved placement requirements.
5. Verified proficiency must be derived from trusted assessment evidence scoped to the relevant context. Lesson completion does not create or update verified proficiency. The displayed/current level is derived from verified evidence where available; otherwise label self-report as unverified or show a provisional starting point. Do not require persisted `SkillProfile` by default; persist a derived profile only if a concrete requirement is approved. Preserve the distinctions `Progress ≠ Proficiency ≠ Mastery ≠ Readiness`.
6. Progress is logically owned by `LearningContext`. The MVP does not require a physical FK from progress to context where the context is uniquely derivable from `User + Lesson → Course → Language` under the one-context-per-user-language rule. This does not prescribe or modify physical tables or keys.
7. Placement and assessment evidence is scoped to its `LearningContext`. This decision does not choose placement behavior, thresholds, skip/retake rules, or level mapping; those remain outside P0-D03.
8. SRS remains learner-global by `(User, Vocabulary)`. Changing purpose or pausing a context does not reset vocabulary memory.
9. Streak remains global per account in the MVP. P0-D06 decides which activity qualifies toward that streak.
10. `LearningPlan` remains a deterministic domain output derived from context preferences, starting point, learner progress, and shared-content metadata. It is not a persisted entity by default; no plan tables are required absent an approved persistence, editing, exact-resume, or audit-history requirement. SRS review remains separate by default.
11. No separate `Enrollment` is needed in the MVP: the shared/core Course for a Language follows ADR-030 and can be derived from the context's Language. Reconsider Enrollment only if genuinely independent Courses for one Language or a separate enrollment lifecycle (such as paid access or organization assignment) becomes a requirement.
12. Study preferences are context-specific but must remain simple. Do not create a generic preference engine. The existing physical `Profile.dailyGoalMin` remains unchanged evidence; reconciling that field with the accepted context-owned study-preference target is a separate physical-schema task.
13. Reminder scheduling/persistence remains `DEFERRED`; this decision does not add account- or context-level reminder behavior.

### Consequences and Supersession

- P0-D03 is `RESOLVED` for the domain ownership and persistence defaults above. This is a domain target, not a physical-schema or implementation approval.
- This ADR supersedes M2.1/D3 ownership statements only where they make a single `LearnerProfile` the owner of state that must be per-language, including self-reported proficiency, progress ownership, and context-scoped assessment evidence. It also supersedes treating persisted `SkillProfile` as an unconditional MVP requirement. The historical documents are not rewritten.
- D3's immutable `AssessmentResult` evidence concept, no-self-report-promotion rule, and distinctions among progress, proficiency, mastery, and readiness remain in force where compatible. Assessment behavior and proficiency mappings remain open to their designated decisions.
- ADR-030 remains controlling for shared curriculum, Course/Language conventions, frameworks, placement-evidence context scope, SRS default scope, and deterministic `LearningPlan` semantics. ADR-031 adds the remaining state ownership rules without reopening P0-D04.
- P0-D02 roles, P0-D05 placement behavior, P0-D06 progression/qualifying activity, and P0-D07 physical schema, migrations, publication/governance, and AI compatibility remain unresolved as listed in the master plan.
- The `Profile` versus `LearnerProfile` physical FK target, existing `dailyGoalMin` reconciliation, and all live database state remain outside this ADR.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D03 DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-032 — P0-D05 Placement and Starting-Point Policy

### Date

`2026-10-08`

### Category

`product-domain / placement-policy`

### Approval Evidence

The user explicitly accepted the P0-D05 placement proposal on 2026-10-08 with the clarifications recorded below. Approval is limited to product/domain policy and documentation reconciliation. It does not authorize product implementation, schema changes, migrations, or P0-D06 work.

### Context

P0-D05 was `CONFLICT` in the existing decision queue. The repository has no implemented placement flow or `AssessmentResult` model in the current application/Prisma artifacts. The latest use-case specification, the earlier English placement specification, D3, and the Phase 2 draft roadmap contain conflicting rules for skip, retake, result, Mapping A, and adaptive assessment. This ADR establishes the accepted MVP domain policy and leaves English assessment values and physical realization open.

### Decision

1. MVP Placement is an onboarding/diagnostic mechanism for recommending where a learner should begin in the curriculum for a learned Language. It does not itself create verified proficiency, certification, or a mastery claim.
2. Learner entry has three paths: take Placement; self-report a known level; or start from the beginning/default starting point. A separate `Skip` choice is unnecessary where it means only bypassing assessment and using the default.
3. Placement's primary MVP output is `recommended starting level` in the applicable framework/curriculum. UI wording should say, for example, “Điểm bắt đầu đề xuất: A2”; do not imply “Trình độ của bạn là A2” from a starting recommendation.
4. Self-report creates no `AssessmentResult` and no verified proficiency. Preserve its provenance as learner self-report. Starting-from-beginning/default selects the lowest/default starting point with available curriculum content; do not label the learner A1/N5/etc. unless they self-report or valid assessment evidence supports that label. This path does not remove the learner's later access to Placement.
5. A permanent placement lock and a lifetime placement/reassessment quota are superseded for MVP. Preserve completed prior evidence when later evidence is recorded.
6. Distinguish initial Placement (onboarding), an optional placement retake near onboarding, Reassessment after a period of learning, and progression/level-up assessment (P0-D06). These purposes must not be collapsed into one behavior. Exact retake timing/cooldown is not decided here.
7. A completed assessment result exists only after a valid submission has been accepted by the server, graded, and recorded successfully. An interruption before a completed result produces no score of zero, no placement lock, and no fabricated recommendation. Timer expiry does not have a universally mandated auto-submit behavior; timer behavior belongs to assessment/runtime configuration.
8. Client-side temporary answer state until final submission may be an MVP implementation choice, not a platform/domain invariant. Server autosave and resume across sessions are `DEFERRED`.
9. Question count, time limit, blueprint, threshold, and mapping from evidence to a starting point are assessment/course configuration, not platform invariants. English values appearing in earlier documents (30 questions, 25 minutes, 20 A1 + 10 A2, threshold 15/20 + 7/10, and Mapping A) are not approved automatically by their presence in those documents. Keep them as English MVP configuration candidates requiring a separate review where approval is insufficient.
10. `AssessmentResult` remains scoped to `LearningContext`. Retain D3's separate `assessmentType` and `deliveryMode` classifications; no flat `PLACEMENT` enum is required.
11. `LearningPurpose` may influence deterministic `LearningPlan` content/routing after assessment, but it does not change the score or estimated level derived from the same evidence. `LearningPlan` uses the accepted starting point, context preferences, progress, and shared-curriculum metadata to produce a deterministic route; persistence is not required by this decision.
12. D3's stage-adaptive diagnostic is `DEFERRED`/superseded as a mandatory MVP Placement requirement. MVP Placement need not use adaptive branching. The historical D3 document and its approval remain intact as evidence; this supersession is limited to MVP Placement and does not rewrite D3 as a historical design.

### Consequences and Supersession

- P0-D05 is `RESOLVED` for the MVP domain policy stated above. This is not physical schema or implementation approval.
- For MVP Placement, this ADR supersedes the account-wide permanent lock, skip-consumes-placement rule, lifetime one-shot restriction, and any requirement to output a Starting Unit as the default product behavior in conflicting use-case/roadmap prose. It does not erase or rewrite those historical specifications.
- The previous approval of English A1 Mapping A is retained as historical, English-curriculum-specific approval evidence. Mapping A is not a platform-wide/default Placement policy, and its use in the current MVP English configuration remains subject to configuration review.
- D3's stage-adaptive mechanism is deferred for MVP Placement as stated above. D3's two classification axes, immutable completed `AssessmentResult` evidence concept, provenance/versioning, context ownership as reconciled by ADR-031, and distinctions between progress, proficiency, mastery, and readiness remain where compatible.
- ADR-030/031 continue to control shared curriculum, framework-aware levels, `LearningContext` ownership, and deterministic `LearningPlan` semantics. P0-D06 remains responsible for progression, completion, retry, and qualifying activity; P0-D07 remains responsible for physical schema, migration, governance, and runtime reconciliation.
- Existing English item counts, duration, blueprint, thresholds, and starting-point mapping remain unselected configuration candidates unless separately confirmed. Other language mappings and framework-specific assessment configurations remain open.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D05 PRODUCT/DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-033 — P0-D06 Lesson Completion, Retry, Progression and Qualifying Activity Policy

### Date

`2026-10-08`

### Category

`product-domain / lesson-completion-progression-activity`

### Approval Evidence

The user explicitly accepted P0-D06 on 2026-10-08 with the seventeen clarifications recorded below. Approval is limited to MVP product/domain policy and authority reconciliation. It does not authorize product implementation, physical-schema changes, migrations, or P0-D07 work.

### Context

P0-D06 was `CONFLICT` in the existing decision queue. The latest use-case specification, older M2.2/D3 material, English placement/Jump specification, and Phase 2 roadmap contain overlapping but inconsistent lesson completion, retry, curriculum completion, Jump/level-up, retake, and streak rules. The current repository has a physical `UserProgress` aggregate and a `record_review` migration that updates the account streak for recorded SRS reviews; it does not establish the accepted learner lesson/progression runtime. This ADR records the accepted MVP domain policy while leaving physical result representation and configuration values to their designated scope.

### Decision

1. An ordinary lesson is completed only when the learner answers every required core exercise, submits valid input, and the system successfully records completion. No accuracy threshold is required for ordinary lesson completion. Completion and performance are separate concepts.
2. A lesson may have a separate performance/result. This decision does not choose latest, best, first-attempt, or attempt-history semantics. Physical and presentation semantics remain for P0-D07 or a separately approved implementation design. A lesson score does not cancel completion, establish verified proficiency, or unlock a level.
3. Ordinary exercise retry and lesson redo may be unlimited in the MVP. Exercise retry, lesson redo, and assessment retake are separate actions; assessment retake has its own policy. A lesson redo does not reset completion, increment completed-lesson count, or delete progress, though a legitimate completed redo may create a new learning activity.
4. MVP level progress is the unweighted ratio `completed required lessons / eligible required lessons` within the current level. Optional review or purpose-specific content is outside the denominator by default. Progress is not proficiency.
5. Starting at a higher level does not mark earlier levels complete. Preserve the semantic distinction `SKIPPED_BY_STARTING_POINT != COMPLETED` without requiring a physical enum. Earlier content may remain available for review.
6. Core curriculum is mostly sequential: core lessons retain their order, and the next core lesson usually opens after completion of its predecessor. Review and prior content remain accessible; optional personalized review does not gate core progression.
7. Curriculum completion is distinct from proficiency. The completion gate is course-defined; the platform sets no universal percentage. An English MVP configuration may require 100% of required core lessons, but that value is not a platform invariant.
8. MVP level-up progression requires both the course-defined curriculum completion gate and a passed level-up assessment. Neither condition alone unlocks the next level by default. Conditional Jump is not a parallel MVP progression mechanism and is `DEFERRED`.
9. Passing a level-up assessment unlocks the next working/curriculum level and does not rewrite starting-point history. Keep unlocked learning level, displayed learning level, and verified proficiency distinct. Passing does not create verified proficiency unless the assessment independently meets approved trusted-proficiency evidence criteria. ADR-031 continues to govern displayed/current-level derivation.
10. Failing a level-up assessment does not delete progress/evidence, downgrade the learner, reset the context, or revoke existing lesson/review access. The system should suggest suitable review/remediation.
11. No lifetime retake cap or universal fixed cooldown applies by default. Review/remediation before a retake is the default recommendation and may be assessment configuration when suitable content exists; it is not a platform-wide mandatory gate.
12. Reassessment evaluates proficiency; a level-up assessment decides progression. Reassessment does not unlock a level unless a future policy explicitly says so. Placement is not a level-up assessment. Placement evidence and classification remain subject to ADR-032.
13. `LearningPlan` remains a deterministic domain output and may be recalculated after lesson completion, an assessment result, or a LearningPurpose change. MVP does not require plan persistence or version history.
14. MVP weak-skill review may use wrong answers, topic/skill metadata, and published review content. It does not require a mastery engine, BKT, recommendation engine, or AI adaptive system.
15. Streak remains global per account and can increase at most once per local calendar day using the account timezone. Qualifying activity is a completed lesson, a legitimate completed lesson redo, or a recorded SRS review. An isolated exercise retry, Placement, Reassessment, level-up assessment, login, and app opening do not qualify. A recorded SRS review qualifies even for a paused language context. Lesson progress is not recorded for a paused context until it is resumed. MVP has no streak freeze.
16. Daily goal and streak are separate: streak does not require the full daily goal, and the goal does not gate streak. The physical `Profile.dailyGoalMin` artifact remains for P0-D07 reconciliation.
17. Historical English values (100% lesson completion, 40 questions, 35 minutes, 80% pass, Jump 95%, and 24-hour cooldown) do not become platform invariants by appearing in older UCs/specifications. Retain the historical evidence, but treat the values as unselected English-specific configuration unless separately approved. Jump and its associated progression/cooldown policy are deferred for the MVP.

### Consequences and Supersession

- P0-D06 is `RESOLVED` for the MVP domain policy above. This is not implementation, physical-schema, migration, API, or test approval.
- ADR-033 controls the MVP domain meaning of lesson completion/performance, retry categories, progress ratio, starting-point semantics, sequencing, course-defined curriculum gate, level-up gate, retake/reassessment distinction, deterministic plan recalculation, weak-skill review scope, and qualifying streak activity.
- Earlier ADR-030/031/032 statements that P0-D06 remained unresolved are historical status statements superseded by this later acceptance; the substantive accepted scope of those ADRs is unchanged.
- Where they conflict within that scope, the latest use-case specification's lesson-completion/retry, level-up, and streak clauses and the older M2.2/D3/roadmap rules are superseded only for the MVP policy stated here; source files and historical approvals remain unchanged.
- The English-specific 100% curriculum gate remains an eligible configuration choice, not a selected platform rule. The 40-question/35-minute/80% level-up configuration remains unselected. Jump 95% and its 24-hour cooldown are deferred as an MVP progression mechanism. Other assessment parameters require their own configuration approval.
- ADR-031 continues to control account-global streak ownership, daily-goal ownership boundaries, context lifecycle, and current/displayed-level derivation. ADR-032 continues to control Placement and starting-point policy. ADR-030 continues to control shared curriculum and deterministic LearningPlan principles.
- Physical `UserProgress.score`, performance storage, attempt/result history, level-state representation, `Profile.dailyGoalMin`, migration reconciliation, and live runtime state remain for P0-D07 or a separately approved implementation design. The existing Prisma and migration artifacts are not changed or reconciled here.
- P0-D07 remains open. No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D06 MVP PRODUCT/DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-034 — P0-D02 Three Business Roles and Content Responsibilities

### Date

`2026-10-10`

### Category

`product-domain / role-semantics / content-governance`

### Approval Evidence

The user/PO explicitly authorized this bounded P0-D02 resolution in the task request attached on 2026-10-10. The approved scope is business-role semantics, permissions, assignment ownership, and current use-case identity reconciliation. It authorizes documentation reconciliation only. It does not authorize implementation, physical role mapping, schema/API/RLS changes, or any P0-D07 decision.

### Context

The repository contains a legacy six-business-role target, a current three-actor use-case model, and physical artifacts that disagree (including Prisma role/assigned-role fields and SQL role values). The active UC-10/12 text also allowed Admin self-authoring, self-approval, or direct publication, while the user-approved product model assigns authoring to Teachers and review/publication to Admin. Existing 14-entry and 15-entry use-case catalogs reuse UC identifiers for different meanings. P0-D02 must resolve the product meaning without implying a physical migration or treating historical diagrams, test evidence, or an implementation plan as approval.

### Decision

1. The product has exactly three business roles: `Admin`, `Teacher`, and `Learner`. Each account has exactly one business role in the MVP. There is no role-conversion UI. A staff member who wants to use learner features uses a separate Learner account; a staff account is not also a learner account.
2. Learners may self-register publicly. Teacher accounts are provisioned by Admin; Admin accounts use controlled provisioning. There is no public signup for Teacher or Admin.
3. Admin creates curriculum/content requirements and assignments, manages curriculum/configuration within the Admin remit, assigns/reassigns Teachers, administers Teacher accounts, reviews submitted work, requests changes, approves, publishes only approved content, and archives under an approved policy. Admin does not author lesson, exercise, or assessment content in the MVP. There is no Admin self-author or self-approval exception.
4. Teacher authors and edits only assigned work; may preview drafts, submit/resubmit, and see feedback/review history for assigned work. Teacher cannot assign work, author outside an assignment, review, approve, publish, archive, or administer accounts.
5. Reassignment changes the current assignee but preserves authorship attribution and assignment/review history. This is a business invariant; its physical representation remains P0-D07.
6. Assignment is a business concept and does not have to reuse `ContentStatus`. Assignment state names, tables, keys, workflow persistence, role enum/claims, RLS, and live DB mapping remain unresolved under P0-D07.
7. Current use-case identities are catalog-versioned. The current 14-entry catalog is the source for the current behavior names. Historical M2.2 and inherited Phase 0 trace catalogs remain historical; reused `UC-xx` strings are not a stable cross-catalog key. The crosswalk is recorded in `docs/use-case-specifications.md`. No arbitrary maximum/minimum UC count is imposed; keep, split, merge, defer, or add cases according to distinct business outcomes and actor goals.

### Permission Matrix

| Action | Learner | Teacher | Admin |
|---|---|---|---|
| Public self-registration | Yes | No | No |
| Account provisioning | Self-register | Admin-provisioned | Controlled provisioning |
| Learn, take assessments, use SRS, view own progress | Own account only | No on staff account; use separate Learner account | No on staff account; use separate Learner account |
| Manage curriculum requirements/configuration and create assignments | No | No | Yes, within Admin remit |
| Assign or reassign content work | No | No | Yes; retain attribution/history |
| View work/feedback | Own learning | Assigned work and its feedback/review history | Admin review/assignment remit |
| Author/edit/preview lesson, exercise, assessment content | No | Assigned work only | No |
| Submit/resubmit authored work | No | Assigned work only | No |
| Request changes/review/approve content | No | No | Yes |
| Publish approved content/archive under approved policy | No | No | Admin only |
| Administer Teacher accounts | No | No | Yes |
| Convert role in UI | No | No | No |

### Consequences and Supersession

- P0-D02 is `RESOLVED` for the business role, account, permission, assignment, authoring, review, and catalog-identity semantics above. This is not physical role mapping or implementation approval.
- Six-role documents and the six-role SoD/permission matrix are `HISTORICAL / SUPERSEDED` only where they define current business-role names, actors, or responsibility mapping. Preserve the historical records. The approved current business workflow is Teacher authoring assigned work and Admin review/approval/publication, with no Admin authoring or self-approval exception.
- ADR-034 does not decide answer secrecy or post-submit feedback, assessment result/attempt persistence, SRS scheduling/trust boundary, publication/version/replacement physical states, audit event schema/emission/retention, `ContentStatus` or assignment physical representation, or the Prisma/migration/live database reconciliation. These remain P0-D07.
- Historical reports, test logs, diagrams, and requirement rows are not implementation evidence unless confirmed by current source/runtime evidence. The current checkout has only its evidenced learner-auth foundation and database artifacts; the business decision does not assert that the role model is implemented.
- No application, API, schema, migration, RLS, seed, generated data-model, or runtime test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D02 BUSINESS/DOMAIN DOCUMENTATION ONLY; IMPLEMENTATION AND PHYSICAL MAPPING NOT AUTHORIZED`

---

## ADR-035 — P0-D07 Logical Product and Security Decision Resolution

### Date

`2026-10-10`

### Category

`product-domain / application-security / content-governance / assessment-integrity / audit`

### Approval Evidence

The user explicitly approved the seven decision packages in the 2026-10-10 request and directed Codex to resolve P0-D07 at the logical product/security level, document deferred physical/live-database questions, reassess Diagram Readiness, and require **Full CURRENT + TARGET Modeling Review** before implementation. Approval is limited to this logical policy and documentation reconciliation. It does not approve a physical table, column, enum, claim, grant, RLS policy, RPC, API shape, migration, live database state, or implementation.

### Context

P0-D07 combined business/security policy with unresolved physical realization and unverified current database state. ADR-034 had already approved exactly three business roles and their responsibilities, while Prisma, SQL migrations, historical six-role target documents, and runtime evidence did not align. The remaining product-level security rules could be decided independently of those physical facts. This ADR records those logical rules without treating Prisma or a migration as product authority.

### Decision

1. **Role and identity:** `auth.uid()` is the trusted subject identity. Role and account status come from server-controlled sources; client-supplied role and user ID are not trusted. Authorization is enforced at a trusted server boundary and by appropriate RLS. A disabled account is denied from its next request even while an older session/token remains unexpired. Legacy role records that cannot be mapped unambiguously to Admin, Teacher, or Learner require deliberate review and migration; no blanket conversion is allowed.
2. **Assignment and authorship:** One MVP assignment covers one Lesson/content package and its related exercise/assessment items. Exactly one Teacher is responsible at a time. Admin creates requirements, scope, checklist, and assignment but does not author content. Teacher authors/edits only assigned content. Reassignment preserves attribution and history. Use a minimal optimistic version/concurrency check; do not add collaboration or project-management subsystems.
3. **Content lifecycle:** Assignment lifecycle is separate from content lifecycle. The logical content flow is Draft → In Review → Changes Requested or Approved → Published → Archived/Withdrawn. Teacher may edit only Draft or Changes Requested. Approved/Published content is not edited in place. A change to published content creates a new revision and repeats review/approval. The active version switches atomically only after the new revision publishes successfully; on failure the current version remains active. Content with learner references/progress is not hard-deleted. The MVP publication unit is a Lesson/revision. Unit/Course visibility is derived from curriculum blueprint/eligibility; publishing an entire Unit as one transaction is not required.
4. **Assessment and answer secrecy:** Placement, Level-up, and Reassessment have distinct purposes and share security invariants. Grading is server-authoritative. Generic content reads do not expose answer keys. An invalid or unsubmitted attempt does not create a completed Result. Cross-session assessment resume is not required for MVP. Retrying the same submission is idempotent; a deliberate new attempt creates new result/evidence. Placement, Level-up, and Reassessment expose no per-item correctness during the attempt; after submission they expose only the required aggregate result/pass/recommendation, not an answer key or per-item solution. These restrictions do not apply to ordinary lesson practice, which may provide feedback/correctness through its separate learning flow.
5. **SRS:** Keep the already-approved Policy B; do not switch to SM-2 or FSRS. Client input is limited to card identity and a valid self-rating. Trusted server/RPC logic computes stage, interval, and due date; client interval/probability is not authoritative. Retrying the same review operation is idempotent; a deliberate re-review is a new operation. Pausing a LearningContext does not pause global SRS. A recorded legitimate SRS review continues to qualify for streak under the controlling ADR.
6. **Audit:** Minimum audited events are account provision/disable/enable/role change; assignment/reassignment; submit/request changes/approve/publish/archive/withdraw/replacement; assessment configuration changes; and denied sensitive privileged actions. Each event logically records actor, action, target/version, server timestamp, outcome, and reason when policy requires it. Security audit is append-only in logical behavior and separate from workflow/content history. Admin is the MVP reader of security audit. Passwords, tokens, and answer secrets are never logged. Retention and anonymization duration are deferred to NFR/implementation design and do not block P0-D07 logical resolution.
7. **Database reconciliation:** Neither Prisma nor an individual migration is product authority. Before implementation or migration, inspect the live database read-only and reconcile it with Prisma, migration history, role distribution, grants, RLS/policies, and RPCs. Never rewrite historical migrations. After logical approval, prepare a forward-migration strategy. Preserve IDs, progress, attribution, and history; never auto-convert ambiguous role data.

### Deferred Physical and Deployment Questions

- Actual live database contents, applied migration state, role distribution, grants, RLS/policies, RPC definitions, and runtime behavior remain unverified and must be inspected read-only before implementation/migration.
- Physical representation of identity/role/status, assignment and authorship/version concurrency, content revisions and atomic active-version selection, assessment attempts/results, answer filtering/API payloads, SRS idempotency keys and trusted RPC inputs, and audit storage/emission/access/retention remains open for a separately authorized design.
- Physical realization of ADR-031 context ownership/FK, `Profile.dailyGoalMin`, and `UserProgress.score`/performance also remains deferred.
- No physical schema or migration strategy is approved here; forward migrations may be planned only after the required live-state inspection and a separately approved implementation scope.

### Consequences and Supersession

- P0-D07 is `RESOLVED — LOGICAL PRODUCT/SECURITY TARGET ONLY`. The status does not mean the current database or runtime conforms, and does not authorize diagrams that claim unverified current physical state or any implementation.
- ADR-034 remains authoritative for the three business roles and role responsibilities. ADR-035 adds identity trust, account disable enforcement, assessment answer/result behavior, SRS trust, assignment/revision behavior, and audit policy; it does not remap roles or reopen P0-D02.
- Within the scope above, conflicting historical/target requirements and use-case prose are superseded as current logical policy. Historical records remain preserved. Physical names and persistence semantics are not inferred from logical lifecycle labels.
- AI runtime/compatibility is outside this P0-D07 decision. No AI capability is restored or approved.
- Diagram Readiness: business-level CURRENT + TARGET behavior modeling has no remaining P0-D07 policy blocker. A trustworthy CURRENT deployment/database view is not ready until read-only live reconciliation. The next task is **Full CURRENT + TARGET Modeling Review**; implementation must not precede it.
- No application, API, schema, Prisma, migration, seed, live-database, generated, or diagram-file change is included. Runtime tests are not applicable to this decision-only task.

### Status

`ACCEPTED — P0-D07 LOGICAL PRODUCT/SECURITY TARGET ONLY; PHYSICAL DESIGN, LIVE-DB CLAIMS, AND IMPLEMENTATION DEFERRED`

---

## ADR-036 — MVP Learning, SRS, Assessment and Learner Operations Product Revision

### Date

2026-10-10

### Category

`product-behavior / learning-progress / assessment / learner-operations`

### Approval Evidence

The Product Owner explicitly approved the six decision groups in the 2026-10-10 Product Revision request and directed this bounded documentation-only reconciliation. It does not authorize application implementation, API changes, physical schema, migrations, Prisma edits, or database operations.

### Context

The prior audit found that several canonical activity diagrams still implied correctness-gated lesson completion, English-specific assessment defaults, periodic Reassessment, and incomplete SRS enrollment behavior. The current detailed learner requirements and approved ADR-030–035 provide the broader authority; this ADR resolves the requested MVP product behavior without changing physical representation or historical documents.

### Decision

1. **Lesson attempt, retry, score and completion.** A lesson has `N` required core exercises, configured for that lesson; no question count is a platform invariant. In one attempt, a first correct response contributes `1.0`. A first incorrect response receives formative feedback and that exercise moves to the end of the queue for exactly one retry. A correct retry contributes `0.5`; an incorrect retry contributes `0`. If `K` exercises were first answered incorrectly, the completed attempt performance is `sum(contributions) / (N + K)`: every actual response, including each retry, is in the denominator. The score may be displayed as a percentage, but no example count defines the rule. Completion requires validly processing all core exercises, including each required retry, and successfully recording the validly ended attempt; correctness does not gate completion. An unfinished attempt creates no completion or completed performance. Redo creates a new attempt without incrementing completed-lesson count. The latest completed attempt is the primary performance display; best completed performance may be secondary. Completion and progress do not depend on either score.
2. **Vocabulary enrollment and SRS.** Core Vocabulary attached to a lesson is enrolled for that learner when the lesson is completed. Optional Vocabulary is not enrolled automatically; the learner may explicitly add it for review. A learner has one logical card per Vocabulary identity. Seeing the same Vocabulary again reuses the card without resetting stage or due date. A newly enrolled card starts at Policy B stage 1 with its first due date one day later. Remembered ratings advance the stage and server-calculated due date through `1 → 3 → 7 → 14 → 30` days; after the final stage, the card remains active and recurs every 30 days. A forgotten rating resets the schedule to stage 1 with a one-day due date and may return the card to the end of the same review session once. That reinforcement is not a second scheduling operation and does not change the long-term schedule again. Scheduling authority and operation idempotency remain governed by ADR-035. This does not adopt a four-rating scale.
3. **Available curriculum, withdrawal and replacement.** Learners follow the active curriculum. Future content that is not published/available can be shown as locked or coming soon and is excluded from the eligible required-lesson progress denominator. Withdrawal preserves valid completion, result, performance and history; an uncompleted withdrawn lesson is unavailable and does not appear as an uncompleted requirement in current eligible progress. Replacement does not erase history or force a learner who completed the prior version to repeat it. A learner who has not completed the lesson follows the active replacement. Current-curriculum progress uses eligible available requirements; historical evidence remains available separately. A future policy that requires relearning or migrates curriculum obligations needs separate approval. If the next level has no available content, show it as locked/coming soon and explain that the learner completed all currently available content.
4. **Assessment blueprint and immutable version.** Admin defines the assessment requirement/blueprint, including language, framework, level or transition, purpose, curriculum and topic coverage, skill/knowledge coverage, item requirements/distribution, and necessary configuration. Teacher authors the actual items within assigned work. The system checks blueprint coverage, required items/configuration, valid answer/grading data, required media, and item completeness before submission/publication. Teacher submits; Admin reviews, approves and publishes an immutable logical Assessment Version. A learner attempt is bound to one version; its items and grading keys cannot change during that attempt. An exact item previously exposed in ordinary lesson practice together with its answer, correctness, or answer-revealing explanation cannot be reused in an assessment; the same concepts may be tested with different items or variants. This is a bounded product flow, not authorization for a generic workflow engine or a physical schema.
5. **Reassessment is deferred.** Reassessment, periodic rechecking, and verified-proficiency reassessment are outside MVP. MVP learner assessment purposes are Placement (starting-point recommendation only) and Level-up (curriculum progression only); neither implies comprehensive certification. Reassessment material in historical specifications remains historical. Any retained diagram artifact must be labelled `DEFERRED — NOT MVP` and must not appear in the active learner journey or active MVP diagram catalog. The current detailed 14-entry use-case catalog contains no standalone Reassessment use case; its count and identities do not change. UC-03 email reminder remains a catalog placeholder deferred under ADR-031.
6. **Admin learner-account operations.** Admin may find a Learner account, view only necessary identity/status/role information and a minimal LearningContext summary for support, disable/re-enable the account, enter a reason where appropriate, and have the operation audited. Admin may not alter lesson completion, performance, assessment results, SRS review history, activity, level, progress, or other learning evidence. Password recovery remains an account recovery flow; Admin does not learn or set the learner's current password.

### Logical Data Implications

The logical model must be able to express lesson attempt/performance provenance, completion facts, Vocabulary identity and SRS enrollment/review history, curriculum availability/eligibility, assessment blueprint/version/items/results, and audited learner-account actions. These are domain concepts, not instructions to create one physical table per concept. No `SkillProfile`, mastery engine, `KnowledgeGap`, persisted `LearningPlan`, `Enrollment`, generalized QuestionBank, or generic workflow engine is introduced.

### Consequences and Supersession

- ADR-036 is the current MVP product authority for the six scopes above. It supplements ADR-030–035; it does not reopen their other decisions or approve implementation/physical design.
- Within the stated scope, it supersedes conflicting active TARGET prose/diagrams that require correctness for completion, imply fixed question counts as platform rules, enroll all vocabulary automatically, stop SRS at the final stage, count unavailable content as incomplete, force redo after replacement, reuse answer-exposed practice items verbatim in assessments, include Reassessment in MVP, or let Admin edit learning evidence.
- Existing catalog numbering and historical crosswalks remain stable. No current detailed UC is removed for Reassessment because none exists there; reminder UC-03 remains explicitly deferred.
- Existing English curriculum examples may remain curriculum-specific configuration/content. They do not become platform-wide question counts, level mappings, or assessment thresholds.
- Physical attempt/performance, SRS enrollment/review records, curriculum eligibility, assessment versioning, Admin learner scope, audit representation, and live runtime/database state remain for later approved design and implementation tasks.
- This approval covers documentation only. No application source, API, Prisma, SQL migration, seed, RLS/RPC, or database was changed or authorized.

### Status

`ACCEPTED — MVP PRODUCT/DOCUMENTATION POLICY; IMPLEMENTATION AND PHYSICAL DESIGN NOT AUTHORIZED`


## ADR-037 — Proposed Physical Data/Runtime and Conditional Rebuild Design

### Date

2026-10-11

### Category

`physical-data-design / runtime-security / rebuild-planning`

### Approval Evidence

The explicit PO request preserved in `plans/approved/2026-10-11-physical-data-runtime-design-REQUEST.txt` authorizes this design-only task and proposing clean rebuild. It does NOT approve the resulting physical choices, database execution or product implementation. The design scope snapshot is `plans/approved/2026-10-11-physical-data-runtime-design-APPROVED.md`.

### Context

Approved modeling is MODELING APPROVED / READY FOR PHYSICAL DESIGN. Legacy Prisma has 18 models/six roles while initial migrations have 17 tables/two roles; TARGET revision/context/attempt/assessment/SRS trust representation is absent. Valid process/conventional local DB credentials are absent, so LIVE DB UNVERIFIED. Latest PO authorization permits proposing reset/rebuild instead of assuming ADR-035's earlier forward-only preference; unknown live preservation remains an execution gate.

### Proposed Decision — not accepted

Propose existing PostgreSQL/Supabase Auth/private Storage/two Next.js backends with Prisma mapping; 34 application tables; unified application account/profile keyed to auth UUID; fixed three roles and ACTIVE/DISABLED plus authorized PENDING activation; Unit table; separate lesson logical identity/revisions; immutable item versions and private grading; bounded first/retry response evidence and authoritative completion; derived plan/progress/latest performance/streak; account-wide vocabulary SRS and idempotent operation evidence; version-pinned assessment aggregate results; assignment/review provenance separate from append-only audit. Dedicated non-owner/NOBYPASSRLS runtime and scoped non-login function principals provide explicit FORCE RLS/grant/row-lock responsibilities. Published replacement and evidence/scheduling finalization are atomic. Recommend conditional CLEAN REBUILD in an isolated environment first, preserving historical migration bytes/data/provenance with inventory/backup/restore/cutover gates.

### Alternatives

Embedded Units simplify table count but weaken query/order management; summarized response outcomes lose actual first/retry integrity; mutable item joins break pinned history; unconditional JSON snapshots duplicate grading without need; forward migration requires substantial meaning/backfill/policy transition work. All choices remain subject to FINAL PHYSICAL DESIGN REVIEW. No new product policy is accepted.

### Consequences / Evidence

Design is `docs/design/physical/README.md` with security, rebuild/tests, separate four-view ERD and review/verification evidence. Independent review found and corrected assignment scope, item ownership, absent-fingerprint concurrency and helper/function/row-lock privilege details. Observed documentation checks pass; no live deployment/security or restore proof exists. Retention duration and real data disposition stay unresolved for their proper approval gates. Historical ADR-030–036 and approved canonical modeling remain unchanged. No implementation, code/Prisma/migration/database/seed/deploy/staging/commit.

### Status

`PROPOSED — PHYSICAL DESIGN READY FOR REVIEW; NOT APPROVED / NOT IMPLEMENTED`


## ADR-038 -- Native draw.io Diagram Delivery and Layout Normalization

### Date

2026-10-11

### Category

`diagram-tooling / renderer / presentation`

### Approval Evidence

The user approved the native editable diagram design, its implementation plan, and the presentation-only native-cell layout amendment on 2026-10-11. Immutable records: `plans/approved/2026-10-11-drawio-native-render-parity-APPROVED.md` and `plans/approved/2026-10-11-drawio-native-cell-layout-APPROVED.md`. This tooling record has no product, business, logical-model, or physical-schema authority.

### Context

The bundled draw.io PlantUML conversion creates editable mxGraph cells but its raw positions/routes are materially less readable than the local PlantUML/Graphviz reference on some diagrams. An SVG-backed alternative reproduces the reference but each diagram is a single image cell and does not meet the user's editability requirement.

### Decision

Keep `docs/modeling/current-target/lingora-all-diagrams.drawio` as the primary 36-page native editable output. After conversion, deterministically transfer matched node bounds and relationship routes from the local SVGs as read-only geometry references. Map actor glyph identities as well as labeled cells so actor associations receive their reference routes. Preserve cell IDs, labels, source/target endpoints, expanded PUML edit payloads, and all semantic inventories. Do not embed SVG diagram images.

### Alternatives

- Raw native conversion only: rejected for this task because observed grouping/routing gaps made several pages difficult to read.
- SVG-backed pages: retained as comparison outputs only; rejected as the primary deliverable because the diagrams are not individually editable native shapes.
- Change canonical model declarations to influence native placement: rejected because layout cleanup must not alter product or model meaning.

### Consequences / Evidence

The native output has 36 ordered pages, 2,115 mxCells, 2,043 editable vertices/edges, and zero SVG image cells. Actual draw.io Desktop 32.4.1 exports and hashes are in `docs/modeling/current-target/evidence/native-render-review/final/`. All 36 semantic inventories and expanded PUML page payloads match the approved baseline. Renderer-specific font metrics and small path-coordinate differences remain. The repository-wide modeling verifier has an unrelated pre-existing canonical file-count conflict from `docs/design/physical/physical-erd.puml`; that file was preserved.

### Status

`RECORDED -- USER-APPROVED PRESENTATION/TOOLING IMPLEMENTATION; NO PRODUCT OR MODEL AUTHORITY`

## ADR-039 — F01–F12 Proposed Physical Correction Record

### Date

2026-10-11

### Category

`physical-data-design / runtime-security / correction-evidence`

### Approval Evidence

The direct user request preserved in `plans/approved/2026-10-11-physical-design-correction-pass-REQUEST.txt` authorizes bounded documentation-only corrections to F01–F12. The immutable scope snapshot is `plans/approved/2026-10-11-physical-design-correction-pass-APPROVED.md`. This authorization permits recording proposed technical corrections; it does not accept them as physical/product decisions or authorize implementation.

### Context

The separate final physical design review found F01–F12 open. The correction pass clarified the proposed runtime/security/constraint model and its future acceptance scenarios. Approved ACT-01 controls default selection as the lowest level with content; the correction aligns the resolver to that source. Coverage-tag validation needs both positive and negative scenarios. The independent closure recheck found all twelve documentation corrections complete.

### Proposed Decision — not accepted

Carry the corrected F01–F12 documentation as the current proposed physical design for a separate final physical design review. Preserve the 34-table inventory, use the approved ACT-01 lowest-level-with-content behavior for default resolution, represent finite versioned coverage tags/catalog data on existing rows, and retain the specified lock, provenance, immutability and capability constraints. No new product behavior or schema subsystem is approved here. All choices remain PROPOSED until the separate review's explicit approval.

### Alternatives

Retaining the known F01–F12 counterexamples would leave the proposal incomplete. Introducing additional taxonomy/workflow tables or changing approved learner behavior is outside the correction scope and was not proposed. Neither is selected.

### Consequences / Evidence

`docs/design/physical/correction-pass.md` records the corrections and `docs/design/physical/independent-recheck.md` records one CLOSED result per finding. `docs/design/physical/rebuild-plan.md` includes sixteen future F01–F12 acceptance scenarios; none was executed. Render hashes, visual inspection and observed verification outputs are in `docs/design/physical/correction-pass-evidence/`. LIVE DB UNVERIFIED; no app, Prisma, SQL/migration, DB, seed, deployment, stage or commit action was performed.

### Status

`PROPOSED — CORRECTION SCOPE COMPLETE; AWAITING FINAL PHYSICAL DESIGN REVIEW; NOT APPROVED / NOT IMPLEMENTED`

## ADR-040 — Final Physical Recheck Rejection and Remaining Principal Dependencies

### Date

2026-10-12 (review started 2026-10-11).

### Category

`physical-design-review / runtime-security / acceptance-gate`

### Approval Evidence

Direct human request `plans/approved/2026-10-11-final-physical-design-recheck-REQUEST.txt` and immutable bounded review snapshot authorize documentation review only. No physical proposal or implementation is accepted by this record.

### Context

The correction task and its independent closure report marked F01–F12 CLOSED. Final recheck traced definitions/principals rather than adopting those labels. Teacher SUBMIT and first-context branch are corrected, but original dependencies for Teacher authoring-secret SELECT and existing-context scoped-locker lookup remain incomplete under the proposed principal separation.

### Decision — review outcome, not accepted physical design

Record NEEDS PHYSICAL CORRECTION / NOT READY FOR IMPLEMENTATION PLANNING. F01/F02 STILL OPEN; F03–F12 CLOSED. Retain all original identifiers and historical evidence. Next separately authorized correction must name bounded executable principal/grant/policy/helper dependencies without changing approved product semantics or adding a subsystem. No physical strategy is selected inside this review.

### Alternatives

Approving from verifier/CLOSED labels alone is unsupported. Broad redesign or silently choosing new privilege paths exceeds final recheck. LIVE DB UNVERIFIED alone is not a design rejection; current rejection follows source defects.

### Consequences / Evidence

Final A–R report and exact commands/hashes/reviewer record: `docs/design/physical/final-recheck.md` and `final-recheck-evidence/`. 34 APPROPRIATE; Unit retained; four fresh render pairs match primary artifacts. CLEAN REBUILD RECOMMENDED conditionally, destructive execution blocked pending live inventory, owner-approved preservation/disposition, backup/restore and exact cutover/rollback. Future scenarios NOT EXECUTED; live DB UNVERIFIED. No app/schema/SQL/DB/seed/deploy/stage/commit or implementation plan.

### Status

`RECORDED — FINAL REVIEW COMPLETE; PHYSICAL DESIGN NOT APPROVED; F01/F02 REQUIRE CORRECTION; IMPLEMENTATION PLANNING NOT READY`

## ADR-041 — Learner-Facing SRS Selection and Assessment Session Boundary

### Date

2026-10-12.

### Category

product-behavior / srs-interaction / assessment-boundary

### Approval Evidence

The user's direct task request and PO clarification are preserved in plans/approved/2026-10-12-report-functional-usecase-views-REQUEST.txt with the bounded documentation-only scope in -APPROVED.md. This record authorizes the stated product interaction clarification and its logical/report documentation; it does not authorize application implementation or physical-design changes.

### Context

The previous SRS specification described opening a review session and returning a due-card list to the learner interface. The latest PO clarification says due/overdue identity and schedule are internal and the learner should not preview the vocabulary that the system will ask. The same clarification distinguishes ordinary learning/practice from scored immutable Placement and Level-up Assessment Versions.

### Decision — accepted PO clarification

1. Do not provide learner-facing due/overdue vocabulary list, preview, stage list, or selection from a due queue. due_at, due detection, and candidate selection remain internal/server-authoritative.
2. During an ordinary learning/practice/checkpoint session, the system may select eligible due/overdue cards and append or interleave review questions. The learner sees only each selected question/prompt and answer interaction. A dedicated review session is optional; if offered, item selection starts only after the learner begins that session.
3. Keep due/overdue cards eligible for later suitable sessions until validly reviewed. The learner may supply a valid recall outcome and may explicitly Add to Review for optional vocabulary, but does not choose stage, interval, due date, or the due-card set.
4. Never insert dynamic SRS items into the scored immutable Assessment Version used for Placement or Level-up. A separate review block near an assessment remains outside that version, score, and pass/fail result.
5. Preserve ADR-036 scheduling semantics: core vocabulary auto-enrolls after valid lesson completion; optional vocabulary requires learner action; one logical card per Learner+Vocabulary; Policy B is 1 → 3 → 7 → 14 → 30 days then every 30 days; forgot resets stage and allows at most one same-session reinforcement with no second scheduling operation. Server scheduling authority and operation idempotency remain.

This clarification changes only learner-facing SRS interaction and session composition. It does not create a new canonical UC, role, persisted Progress subsystem, or physical design.

### Alternatives

Showing a due-word list or letting learners choose items was rejected by the supplied PO clarification. Injecting SRS questions into immutable scored assessment versions is rejected because it changes item composition by learner and can alter score/pass-fail semantics. Keeping a separate optional review after the learner starts it is allowed.

### Consequences / Evidence

docs/02-requirements.md, UC-06/UC-07 in docs/use-case-specifications.md, docs/05-traceability-matrix.md, ACT-03/ACT-06/SEQ-06/SEQ-08, and report-oriented views now state this interaction boundary. VIEW-RUC-* identifiers are report diagrams only; canonical UC-01–UC-14 remain unchanged. The Domain/Data diagrams retain dueAt/due_at as internal scheduling data and were inspected; they do not claim learner visibility. Physical design must consume the updated SRS interaction semantics; due_at remains persisted/internal, but learner-facing due-list browsing is not an MVP capability. Physical files were not changed.

### Status

ACCEPTED — PO CLARIFICATION; LOGICAL PRESENTATION ONLY; NO PHYSICAL-DESIGN APPROVAL

## ADR-042 — Study Focus personalization addendum and bounded physical correction

### Date
2026-10-12

### Category
product-behavior / logical-modeling / proposed-physical-security

### Approval Evidence
Direct PO instruction preserved in plans/approved/2026-10-12-study-focus-personalization-f01-f02-REQUEST.txt and bounded APPROVED.md. Product semantics are authorized; physical correction is proposed documentation, not physical-design or implementation approval. ADR-036 and ADR-041 remain unchanged.

### Context
PO requested lightweight context personalization without changing shared core, SRS schedules or immutable scored assessments. The final physical recheck left exact authoring-secret and context-lock principal dependencies F01/F02 open.

### Decision
One primary Study Focus per LearningContext: BALANCED default, VOCABULARY, GRAMMAR, READING, LISTENING. Owned-context preference change affects only subsequent supplementary composition; no resets/history rewrite. Use configuration-driven nonexclusive bias with eligible fallback, independently selected internal due/overdue SRS and finite existing course Topic/Skill metadata. Eligible authored PRACTICE stays published AVAILABLE and accessible in context; secure assessment items and prohibited reuse excluded. Shared core N/K contributions 1/0.5/0 with N+K, completion/order/unlocks/gates and Policy B remain unchanged. Learner receives only current prompt after start, no due browse/preview. Placement/Level-up retain pinned composition/results. No new canonical UC or preference/composition/history/taxonomy table.

The proposed physical realization uses existing context study_focus and item practice-skill metadata, retaining 34 tables; named checked Teacher grading read/edit/readiness/submit and Admin review/pinned grader paths; learner_writer stable parent-account lock before context lookup/count with explicit FORCE RLS grants/policies, and independent scoped-locker context SELECT. These proposed mechanisms still require separate final physical approval.

### Alternatives
Exclusive focus filtering, fixed selection percentages/counts, due-list browsing, dynamic secure-assessment injection, score/progress/SRS reset and new taxonomy/history/composition tables are rejected within this PO scope.

### Consequences / Evidence
docs/study-focus-addendum.md controls semantics/PERS-01–10; requirements, UC-04 supporting preferences, UC-06/07, trace, seven targeted logical sources and three existing report views are synchronized. docs/design/physical/personalization-and-final-correction.md, security-and-rls.md and rebuild-plan.md describe design/future acceptance. Runtime cases are NOT EXECUTED; current DB remains LIVE DB UNVERIFIED. Historical approval/review/ADR records are preserved.

### Status
ACCEPTED — PO PRODUCT ADDENDUM; PROPOSED PHYSICAL REALIZATION; NO IMPLEMENTATION AUTHORIZATION
