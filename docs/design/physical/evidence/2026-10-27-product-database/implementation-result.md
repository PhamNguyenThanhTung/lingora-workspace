# Lingora Product Database — WP-DB-01 Implementation Result

- **Date:** 2026-10-27
- **Work Package:** WP-DB-01 (Canonical product database foundation)
- **Authority:** `plans/2026-10-27-product-database-spec.md`
- **Status:** **IMPLEMENTED / REMOTE UNVERIFIED** (Static code, schema, migration, seed, server module, and smoke checks PASS; dedicated hosted DEV connection string is not available in environment; live checks NOT RUN / EXTERNAL).
- **Harness State:** Local Supabase/database harness, runtime safety, and A1/A2/A3 are **PARKED** and explicitly nonblocking.

---

## 1. Acceptance Outcomes Matrix (DB-01 .. DB-09)

| ID | Check / Observable Outcome | Target / Authority | Status | Evidence / Observed Result |
|---|---|---|---|---|
| **DB-01** | Prisma validate/generate succeeds for product schema; exact 34 canonical tables (29 app + 5 app_private), snake_case DB mapping, UUID PKs, RESTRICT FKs, field parity including `Account.display_name`, `LearningContext.start_result_id` relation, and composite FKs. | Spec §3, §6 | **PASS** | `npm run db:product:validate` and `npm run db:product:generate` PASS. Exact 34 models verified by `product-database-smoke.mjs`. Generated product client isolated at `lingora-admin/generated/product-client/`. |
| **DB-02** | Remote deploy on positively identified clean Supabase DEV (`prisma migrate deploy`). | Spec §4, §6 | **NOT RUN (EXTERNAL)** | Dedicated hosted Supabase DEV connection string not yet supplied by operator. Ready to execute upon configuration. |
| **DB-03** | Minimal configuration seed idempotency (languages `en`/`vi`, CEFR framework, A1-B2 levels, planned DEV fixture lesson). | Spec §5, §6 | **NOT RUN (EXTERNAL)** | Seed script implemented at `lingora-admin/prisma/product/seed.mjs`. Fails closed if DEV database URL is absent or placeholder. |
| **DB-04** | Representative CRUD & relational reads in rollback transactions (language -> course -> unit -> lesson; RESTRICT deletion). | Spec §4, §6 | **NOT RUN (EXTERNAL)** | Requires live dedicated DEV database. |
| **DB-05** | Integrity constraint smoke: duplicate keys, XOR shapes, positive bounds, ADR-044 core-readiness trigger rejection. | Spec §4, §6 | **NOT RUN (EXTERNAL)** | Requires live dedicated DEV database. |
| **DB-06** | Safe baseline public-access denial: PUBLIC, `anon`, `authenticated` revoked from `app` and `app_private` schemas/tables; default execute revoked. | Spec §4, §6 | **NOT RUN (EXTERNAL)** | DDL assertions encoded in migration SQL; live verification requires live DEV database. |
| **DB-07** | Real server connection module: imports distinct generated client, connects cleanly, performs health read, surfaces errors without credential leaks. | Spec §5, §6 | **PASS (Module) / NOT RUN (Live DB)** | Server module implemented at `lingora-admin/src/server/db/index.js` exporting `getProductPrisma`, `connect`, `disconnect`, `checkHealth`, and `readCanonicalCoursePath`. Live DB read pending hosted DEV target. |
| **DB-08** | Parked fixture/harness/tests baseline preservation. Existing 20-table fixture, tests, and evidence unchanged. | Spec §1, §6 | **PASS** | Verified byte-identical against `/tmp/lingora-product-database-entry-20261027.json`. Zero parked files modified. |
| **DB-09** | Truthful status and evidence reporting without DB READY overclaim. | Spec §6 | **PASS** | Recorded as IMPLEMENTED / REMOTE UNVERIFIED with exact external blocker identified. |

---

## 2. Implemented Canonical Inventory (34 Tables)

### Application Schema (`app` - 29 tables)
1. `app.accounts` (`Account`): Provider identity (`id` references `auth.users(id)`), fixed `role` ('ADMIN', 'TEACHER', 'LEARNER'), `status` ('PENDING', 'ACTIVE', 'DISABLED'), `display_name`, `ui_locale` -> `languages.code`, `native_language_id`, `timezone`, `avatar_media_id`, `row_version`.
2. `app.languages` (`Language`): `code` UNIQUE, `names` JSON, `is_learnable`, `is_ui_locale`.
3. `app.frameworks` (`Framework`): UNIQUE(`code`, `version`), `names` JSON.
4. `app.levels` (`Level`): `framework_id` -> `frameworks`, `code`, `label` JSON, `position`, UNIQUE(`framework_id`, `code`), UNIQUE(`framework_id`, `position`).
5. `app.courses` (`Course`): `language_id` -> `languages`, `framework_id` -> `frameworks`, `curriculum_generation`, `default_start_level_id`, `gate_config`, `practice_config`, `coverage_catalog`, `coverage_catalog_generation`.
6. `app.units` (`Unit`): `course_id` -> `courses`, `level_id` -> `levels`, `code`, `position`, UNIQUE(`course_id`, `level_id`, `position`).
7. `app.lessons` (`Lesson`): `unit_id` -> `units`, `position`, `is_required`, `availability` ('PLANNED', 'AVAILABLE', 'WITHDRAWN'), `active_revision_id` (circular FK `(active_revision_id, id)` -> `lesson_revisions(id, lesson_id)` MATCH SIMPLE), UNIQUE(`unit_id`, `position`).
8. `app.lesson_revisions` (`LessonRevision`): `lesson_id` -> `lessons`, `revision_no`, `prior_revision_id` -> self, `assignment_id` & `lesson_id` -> `content_assignments(id, lesson_id)`, `creation_assignment_episode_id` -> `assignment_history`, `status` ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN'), `title`, `content_blocks`, `topic_ids`, `skill_ids`, `purpose_tags`, creator/editor/reviewer account FKs, UNIQUE(`lesson_id`, `revision_no`), UNIQUE(`id`, `lesson_id`).
9. `app.vocabulary_concepts` (`VocabularyConcept`): `language_id` -> `languages`, `canonical_form`, `normalized_form`, `sense_key`, `meaning_labels`, `phonetic`, `part_of_speech`, `example`, `created_by`, `frozen_at`, UNIQUE(`language_id`, `normalized_form`, `sense_key`).
10. `app.lesson_vocabulary_links` (`LessonVocabularyLink`): `lesson_revision_id` -> `lesson_revisions`, `vocabulary_id` -> `vocabulary_concepts`, `position`, `is_core`, `display_snapshot`, UNIQUE(`lesson_revision_id`, `vocabulary_id`), UNIQUE(`lesson_revision_id`, `position`).
11. `app.item_identities` (`ItemIdentity`): `origin` ('PRACTICE', 'ASSESSMENT'), `created_by`, `variant_of_id`, `exact_fingerprint`, `practice_exposed_at`.
12. `app.item_revisions` (`ItemRevision`): `item_id` -> `item_identities`, `revision_no`, `type` ('MCQ', 'FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR'), `prompt_data`, `practice_skill_ids`, `practice_coverage_snapshot`, `schema_version`, `exact_fingerprint`, `created_by`, `creation_assignment_episode_id`, `authoring_lesson_revision_id`, `assessment_blueprint_id`, `blueprint_generation`, `is_draft_omitted`, `frozen_at`, UNIQUE(`item_id`, `revision_no`), UNIQUE(`id`, `item_id`), UNIQUE(`id`, `authoring_lesson_revision_id`).
13. `app.lesson_exercises` (`LessonExercise`): `lesson_revision_id` -> `lesson_revisions`, `(item_revision_id, item_id)` -> `item_revisions(id, item_id)`, `position`, `is_core`, UNIQUE(`lesson_revision_id`, `position`), UNIQUE(`lesson_revision_id`, `item_id`), UNIQUE(`id`, `lesson_revision_id`).
14. `app.media_assets` (`MediaAsset`): `bucket_id`, `object_key`, `sha256`, `mime_type`, `byte_size > 0`, `uploaded_by`, `owner_account_id`, `assignment_id`, `kind` ('AVATAR', 'CONTENT'), XOR owner check, UNIQUE(`bucket_id`, `object_key`).
15. `app.media_bindings` (`MediaBinding`): `media_asset_id` -> `media_assets`, `lesson_revision_id` XOR `item_revision_id`, `position`, `usage` ('AUDIO', 'IMAGE'), partial unique on `(lesson_revision_id, position)` and `(item_revision_id, position)`.
16. `app.learning_contexts` (`LearningContext`): `learner_id` -> `accounts`, `language_id` -> `languages`, `course_id` -> `courses`, `status` ('ACTIVE', 'PAUSED'), `study_focus` ('BALANCED', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'), `selected_start_level_id`, `start_source`, `start_result_id` -> `assessment_results.id`, `working_level_id`, UNIQUE(`learner_id`, `language_id`).
17. `app.lesson_attempts` (`LessonAttempt`): `context_id` -> `learning_contexts`, `(lesson_revision_id, lesson_id)` -> `lesson_revisions(id, lesson_id)`, `started_at`, `completed_at`, `n_core > 0`, `k_first_wrong`, `contribution_units`, `response_count`, `completion_operation_key`, `qualifying_local_date`, `timezone_at_completion`, completed vs incomplete nonnull shape check, UNIQUE(`id`, `lesson_revision_id`), UNIQUE(`id`, `context_id`, `lesson_id`).
18. `app.lesson_responses` (`LessonResponse`): `(attempt_id, lesson_revision_id)` -> `lesson_attempts(id, lesson_revision_id)`, `(lesson_exercise_id, lesson_revision_id)` -> `lesson_exercises(id, lesson_revision_id)`, `response_ordinal` (1, 2), `queue_position > 0`, `operation_key`, `input`, `input_hash`, `is_correct`, `contribution_units` (0, 1, 2), ordinal contribution check, UNIQUE(`attempt_id`, `lesson_exercise_id`, `response_ordinal`), UNIQUE(`attempt_id`, `operation_key`), UNIQUE(`attempt_id`, `queue_position`).
19. `app.lesson_completions` (`LessonCompletion`): `context_id` -> `learning_contexts`, `lesson_id` -> `lessons`, `(first_attempt_id, context_id, lesson_id)` -> `lesson_attempts(id, context_id, lesson_id)`, `completed_at`, UNIQUE(`context_id`, `lesson_id`).
20. `app.srs_cards` (`SrsCard`): `learner_id` -> `accounts`, `vocabulary_id` -> `vocabulary_concepts`, `stage` (1..5), `due_at`, `last_reviewed_at`, `enrollment_source` ('CORE_COMPLETION', 'OPTIONAL_CHOICE'), `source_attempt_id`, `source_lesson_vocabulary_id`, UNIQUE(`learner_id`, `vocabulary_id`), UNIQUE(`id`, `learner_id`).
21. `app.srs_review_operations` (`SrsReviewOperation`): `(card_id, learner_id)` -> `srs_cards(id, learner_id)`, `learner_id`, `operation_key`, `kind` ('SCHEDULE', 'REINFORCEMENT'), `rating` ('REMEMBERED', 'FORGOTTEN'), `session_key`, `reinforces_operation_id` -> self, `prior_stage`, `prior_due_at`, `next_stage`, `next_due_at`, `reviewed_at`, `qualifying_local_date`, `input_hash`, UNIQUE(`learner_id`, `operation_key`), partial uniques on `(card_id, session_key)` per kind and on `reinforces_operation_id` for REINFORCEMENT.
22. `app.assessment_blueprints` (`AssessmentBlueprint`): `created_by`, `language_id`, `framework_id`, `course_id`, `purpose` ('PLACEMENT', 'LEVEL_UP'), `target_level_id`, `next_level_id`, `coverage`, `requirements`, `config`, `coverage_catalog_generation`, `generation > 0`.
23. `app.assessment_versions` (`AssessmentVersion`): `blueprint_id` -> `assessment_blueprints`, `version_no`, `blueprint_generation`, `blueprint_snapshot`, `assembled_at`, `assembly_input_hash`, `status` ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN'), `is_active`, active implies PUBLISHED check, approved/published accounts, UNIQUE(`blueprint_id`, `version_no`), UNIQUE(`blueprint_id`, `blueprint_generation`, `assembly_input_hash`), partial unique on `(blueprint_id)` WHERE `is_active = true`.
24. `app.assessment_version_items` (`AssessmentVersionItem`): `assessment_version_id` -> `assessment_versions`, `(item_revision_id, item_id)` -> `item_revisions(id, item_id)`, `source_lesson_revision_id` -> `lesson_revisions`, `(source_submission_id, source_lesson_revision_id, contribution_assignment_episode_id)` -> `revision_reviews(id, lesson_revision_id, assignment_episode_id)`, `position`, `weight > 0`, `coverage_tags`, UNIQUE(`assessment_version_id`, `position`), UNIQUE(`assessment_version_id`, `item_id`), UNIQUE(`id`, `assessment_version_id`).
25. `app.assessment_attempts` (`AssessmentAttempt`): `context_id` -> `learning_contexts`, `assessment_version_id` -> `assessment_versions`, `started_at`, `finalized_at`, `submission_key`, `submission_hash`, `context_row_version_at_start`, `curriculum_generation_at_start`, finalization shape check, UNIQUE(`id`, `assessment_version_id`), partial unique on `(context_id`, `submission_key)` WHERE `submission_key IS NOT NULL`.
26. `app.assessment_results` (`AssessmentResult`): `attempt_id` -> `assessment_attempts` UNIQUE, `raw_points >= 0`, `possible_points > 0`, `raw_points <= possible_points`, `passed`, `recommended_level_id` -> `levels`, `assessment_type`, `delivery_mode`, `completed_at`, `progression_applied_at`.
27. `app.content_assignments` (`ContentAssignment`): `created_by` -> `accounts`, `current_teacher_id` -> `accounts`, `lesson_id` -> `lessons` UNIQUE, `requirement`, `scope`, `scope_generation > 0`, UNIQUE(`id`, `lesson_id`).
28. `app.assignment_history` (`AssignmentHistory`): `assignment_id` -> `content_assignments`, `sequence_no > 0`, `event_type` ('ASSIGNED', 'REASSIGNED', 'SCOPE_CHANGED'), `previous_teacher_id`, `next_teacher_id`, `scope_generation`, `changed_by`, `reason`, `changed_at`, `scope_snapshot`, UNIQUE(`assignment_id`, `sequence_no`), UNIQUE(`id`, `assignment_id`).
29. `app.revision_reviews` (`RevisionReview`): `lesson_revision_id` XOR `assessment_version_id`, `action` ('SUBMIT', 'REQUEST_CHANGES', 'APPROVE', 'PUBLISH', 'ARCHIVE', 'WITHDRAW'), `actor_id` -> `accounts`, `assignment_episode_id` -> `assignment_history`, `assignment_generation`, `assignment_scope_snapshot`, `blueprint_generation`, `feedback_item_ids`, `occurred_at`, `revision_row_version`, `comment`, UNIQUE(`id`, `lesson_revision_id`, `assignment_episode_id`).

### Private Schema (`app_private` - 5 tables)
30. `app_private.item_grading_secrets` (`ItemGradingSecret`): `item_revision_id` -> `item_revisions` UNIQUE, `grading_data`, `feedback_data`, `schema_version > 0`. Server-only access.
31. `app_private.assessment_responses` (`AssessmentResponse`): `(attempt_id, assessment_version_id)` -> `assessment_attempts(id, assessment_version_id)`, `(assessment_version_item_id, assessment_version_id)` -> `assessment_version_items(id, assessment_version_id)`, `input`, `awarded_points >= 0`, `answered_at`, UNIQUE(`attempt_id`, `assessment_version_item_id`).
32. `app_private.provisioning_requests` (`ProvisioningRequest`): `operation_key` UNIQUE, `normalized_email` UNIQUE, `requested_role` ('TEACHER', 'ADMIN'), `requested_by` -> `accounts`, `auth_user_id` -> `auth.users(id)` RESTRICT, `state` ('REQUESTED', 'IDENTITY_CREATED', 'READY', 'FAILED_RETRYABLE'), `provider_correlation_id`, `last_error_code`.
33. `app_private.command_receipts` (`CommandReceipt`): `actor_id` -> `accounts`, `command` allowlist CHECK, `operation_key`, `input_hash`, `target_id`, `safe_result`, `committed_at`, UNIQUE(`actor_id`, `command`, `operation_key`).
34. `app_private.audit_events` (`AuditEvent`): `actor_kind` ('ACCOUNT', 'VERIFIED_AUTH_SUBJECT', 'SYSTEM'), `actor_id` -> `accounts`, `verified_auth_subject_id`, actor attribution XOR check, `action`, `target_type`, `target_id`, `target_version_id`, `outcome` ('SUCCESS', 'DENIED', 'FAILURE'), `reason`, `correlation_id`, `safe_context`, `occurred_at`.

---

## 3. Commands Executed and Verification Results

| Command | Working Directory | Exit Code | Observed Output / Verdict |
|---|---|---|---|
| `npm run db:product:validate` | repo root (`lingora-workspace`) | 0 | `The schema at prisma/product/schema.prisma is valid 🚀` |
| `npm run db:product:generate` | repo root (`lingora-workspace`) | 0 | `✔ Generated Prisma Client (v6.19.3) to ./generated/product-client` |
| `npm run db:product:smoke` | repo root (`lingora-workspace`) | 0 | All static checks PASS (34 tables inventory, catalog parity, migration objects, baseline hash preservation, client generation, server module). Live DEV checks reported as NOT RUN (EXTERNAL) |
| `node prisma/product/seed.mjs` (without credentials) | `lingora-admin` | 1 | Clean fail-closed: `[seed] ERROR: Dedicated hosted DEV DATABASE_URL is not configured.` |
| `node -e 'import("./lingora-admin/src/server/db/index.js")'` | repo root | 0 | Module exports verified: `getProductPrisma`, `connect`, `disconnect`, `checkHealth`, `readCanonicalCoursePath` |

---

## 4. Preserved Baseline Boundaries

All parked harness, test, and fixture assets remain byte-identical:
- Parked 20-table schema: `lingora-admin/prisma/schema.prisma` UNTOUCHED.
- Parked migration: `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql` UNTOUCHED.
- Parked bootstrap and harness tests: `lingora-admin/prisma/bootstrap/**`, `lingora-admin/tests/database/**` UNTOUCHED.
- Native/local cache/registry/reservations: UNTOUCHED (`run-af1371dc4e4b01d7` retained).
- Baseline file hashes in `/tmp/lingora-product-database-entry-20261027.json` verified.

---

## 5. Next Steps / External Prerequisites

To proceed to **DATABASE READY (DEV)**:
1. Operator supplies dedicated hosted Supabase DEV credentials via `.env.product` or environment variables:
   - `SUPABASE_DEV_PROJECT_REF`
   - `DATABASE_URL` (pooler / transaction URL)
   - `DIRECT_URL` (direct migration connection)
2. Execute:
   ```sh
   npm run db:product:migrate -w lingora-admin
   npm run db:product:seed -w lingora-admin
   npm run db:product:smoke -w lingora-admin
   ```
3. Upon PASS, independent review verifies DEV acceptance and transition to the first app slice.
