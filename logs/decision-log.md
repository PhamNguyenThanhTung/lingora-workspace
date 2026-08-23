# Decision Log

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
