# Decision Log

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
