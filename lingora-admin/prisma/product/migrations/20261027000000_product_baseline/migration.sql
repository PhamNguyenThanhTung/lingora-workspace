-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app_private";

-- CreateTable
CREATE TABLE "app"."accounts" (
    "id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "display_name" TEXT,
    "ui_locale" TEXT NOT NULL DEFAULT 'en',
    "native_language_id" UUID,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "avatar_media_id" UUID,
    "activated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."languages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "is_learnable" BOOLEAN NOT NULL DEFAULT false,
    "is_ui_locale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."frameworks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "framework_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language_id" UUID NOT NULL,
    "framework_id" UUID NOT NULL,
    "names" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "curriculum_generation" BIGINT NOT NULL DEFAULT 1,
    "default_start_level_id" UUID NOT NULL,
    "gate_config" JSONB NOT NULL DEFAULT '{}',
    "practice_config" JSONB NOT NULL DEFAULT '{}',
    "coverage_catalog" JSONB NOT NULL DEFAULT '{}',
    "coverage_catalog_generation" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "names" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unit_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "availability" TEXT NOT NULL DEFAULT 'PLANNED',
    "active_revision_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."content_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "current_teacher_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "requirement" JSONB NOT NULL DEFAULT '{}',
    "scope" JSONB NOT NULL DEFAULT '{}',
    "scope_generation" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "content_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assignment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignment_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "previous_teacher_id" UUID,
    "next_teacher_id" UUID NOT NULL,
    "scope_generation" BIGINT NOT NULL,
    "changed_by" UUID NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope_snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_id" UUID NOT NULL,
    "revision_no" INTEGER NOT NULL,
    "prior_revision_id" UUID,
    "change_summary" TEXT,
    "assignment_id" UUID NOT NULL,
    "creation_assignment_episode_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" JSONB NOT NULL,
    "content_blocks" JSONB NOT NULL DEFAULT '[]',
    "topic_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "skill_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "purpose_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "coverage_catalog_generation" BIGINT,
    "coverage_snapshot" JSONB,
    "submitted_assignment_generation" BIGINT,
    "assignment_scope_snapshot" JSONB,
    "created_by" UUID NOT NULL,
    "last_edited_by" UUID NOT NULL,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "published_by" UUID,
    "published_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "lesson_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."vocabulary_concepts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language_id" UUID NOT NULL,
    "canonical_form" TEXT NOT NULL,
    "normalized_form" TEXT NOT NULL,
    "sense_key" TEXT NOT NULL,
    "meaning_labels" JSONB NOT NULL,
    "phonetic" TEXT,
    "part_of_speech" TEXT,
    "example" TEXT,
    "created_by" UUID NOT NULL,
    "frozen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "vocabulary_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_vocabulary_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_revision_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT true,
    "display_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_vocabulary_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."item_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "origin" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "variant_of_id" UUID,
    "exact_fingerprint" TEXT NOT NULL,
    "practice_exposed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."item_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "revision_no" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "prompt_data" JSONB NOT NULL,
    "practice_skill_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "practice_coverage_snapshot" JSONB,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "exact_fingerprint" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "creation_assignment_episode_id" UUID NOT NULL,
    "authoring_lesson_revision_id" UUID NOT NULL,
    "assessment_blueprint_id" UUID,
    "blueprint_generation" BIGINT,
    "is_draft_omitted" BOOLEAN NOT NULL DEFAULT false,
    "frozen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "item_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."item_grading_secrets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_revision_id" UUID NOT NULL,
    "grading_data" JSONB NOT NULL,
    "feedback_data" JSONB,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_grading_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_revision_id" UUID NOT NULL,
    "item_revision_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bucket_id" TEXT NOT NULL DEFAULT 'lingora-media',
    "object_key" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "owner_account_id" UUID,
    "assignment_id" UUID,
    "kind" TEXT NOT NULL,
    "ready_at" TIMESTAMPTZ(6),
    "frozen_at" TIMESTAMPTZ(6),
    "retired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."media_bindings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_asset_id" UUID NOT NULL,
    "lesson_revision_id" UUID,
    "item_revision_id" UUID,
    "position" INTEGER NOT NULL,
    "usage" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."learning_contexts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "learner_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purpose" TEXT,
    "study_preferences" JSONB NOT NULL DEFAULT '{}',
    "study_focus" TEXT NOT NULL DEFAULT 'BALANCED',
    "selected_start_level_id" UUID,
    "start_source" TEXT,
    "start_result_id" UUID,
    "self_report" JSONB,
    "working_level_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "learning_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "context_id" UUID NOT NULL,
    "lesson_revision_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "n_core" INTEGER NOT NULL,
    "k_first_wrong" INTEGER,
    "contribution_units" INTEGER,
    "response_count" INTEGER,
    "completion_operation_key" UUID,
    "qualifying_local_date" DATE,
    "timezone_at_completion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "lesson_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "lesson_exercise_id" UUID NOT NULL,
    "lesson_revision_id" UUID NOT NULL,
    "response_ordinal" INTEGER NOT NULL,
    "queue_position" INTEGER NOT NULL,
    "operation_key" UUID NOT NULL,
    "input" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "contribution_units" INTEGER NOT NULL,
    "responded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."lesson_completions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "context_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "first_attempt_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."srs_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "learner_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "stage" SMALLINT NOT NULL DEFAULT 1,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "last_reviewed_at" TIMESTAMPTZ(6),
    "enrollment_source" TEXT NOT NULL,
    "source_attempt_id" UUID,
    "source_lesson_vocabulary_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "srs_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."srs_review_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "card_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "operation_key" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "session_key" UUID NOT NULL,
    "reinforces_operation_id" UUID,
    "prior_stage" SMALLINT,
    "prior_due_at" TIMESTAMPTZ(6),
    "next_stage" SMALLINT NOT NULL,
    "next_due_at" TIMESTAMPTZ(6) NOT NULL,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifying_local_date" DATE,
    "input_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "srs_review_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assessment_blueprints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "framework_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "target_level_id" UUID,
    "next_level_id" UUID,
    "coverage" JSONB NOT NULL DEFAULT '{}',
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "config" JSONB NOT NULL DEFAULT '{}',
    "coverage_catalog_generation" BIGINT NOT NULL DEFAULT 1,
    "generation" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "assessment_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assessment_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blueprint_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "blueprint_generation" BIGINT NOT NULL,
    "blueprint_snapshot" JSONB NOT NULL,
    "assembled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assembly_input_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_REVIEW',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "published_by" UUID,
    "published_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "assessment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assessment_version_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_version_id" UUID NOT NULL,
    "item_revision_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "source_lesson_revision_id" UUID NOT NULL,
    "source_submission_id" UUID NOT NULL,
    "contribution_assignment_episode_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "weight" DECIMAL(10,4) NOT NULL,
    "coverage_tags" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_version_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assessment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "context_id" UUID NOT NULL,
    "assessment_version_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMPTZ(6),
    "submission_key" UUID,
    "submission_hash" TEXT,
    "context_row_version_at_start" BIGINT NOT NULL,
    "curriculum_generation_at_start" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."assessment_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "assessment_version_item_id" UUID NOT NULL,
    "assessment_version_id" UUID NOT NULL,
    "input" JSONB NOT NULL,
    "awarded_points" DECIMAL(10,4) NOT NULL,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."assessment_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "raw_points" DECIMAL(10,4) NOT NULL,
    "possible_points" DECIMAL(10,4) NOT NULL,
    "passed" BOOLEAN,
    "recommended_level_id" UUID,
    "assessment_type" TEXT NOT NULL,
    "delivery_mode" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progression_applied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."revision_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_revision_id" UUID,
    "assessment_version_id" UUID,
    "action" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "assignment_episode_id" UUID,
    "assignment_generation" BIGINT,
    "assignment_scope_snapshot" JSONB,
    "blueprint_generation" BIGINT,
    "feedback_item_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revision_row_version" BIGINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."provisioning_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operation_key" UUID NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "requested_role" TEXT NOT NULL,
    "requested_by" UUID,
    "auth_user_id" UUID,
    "state" TEXT NOT NULL DEFAULT 'REQUESTED',
    "provider_correlation_id" TEXT,
    "last_error_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_version" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "provisioning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."command_receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "command" TEXT NOT NULL,
    "operation_key" UUID NOT NULL,
    "input_hash" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "safe_result" JSONB NOT NULL DEFAULT '{}',
    "committed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "command_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_kind" TEXT NOT NULL,
    "actor_id" UUID,
    "verified_auth_subject_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "target_version_id" UUID,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "correlation_id" UUID,
    "safe_context" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "app"."languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_code_version_key" ON "app"."frameworks"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "levels_framework_id_code_key" ON "app"."levels"("framework_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "levels_framework_id_position_key" ON "app"."levels"("framework_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "units_course_id_level_id_position_key" ON "app"."units"("course_id", "level_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_unit_id_position_key" ON "app"."lessons"("unit_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "content_assignments_lesson_id_key" ON "app"."content_assignments"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_assignments_id_lesson_id_key" ON "app"."content_assignments"("id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_history_assignment_id_sequence_no_key" ON "app"."assignment_history"("assignment_id", "sequence_no");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_history_id_assignment_id_key" ON "app"."assignment_history"("id", "assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_revisions_lesson_id_revision_no_key" ON "app"."lesson_revisions"("lesson_id", "revision_no");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_revisions_id_lesson_id_key" ON "app"."lesson_revisions"("id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_concepts_lang_norm_sense_key" ON "app"."vocabulary_concepts"("language_id", "normalized_form", "sense_key");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_vocabulary_links_lesson_rev_vocab_key" ON "app"."lesson_vocabulary_links"("lesson_revision_id", "vocabulary_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_vocabulary_links_lesson_rev_pos_key" ON "app"."lesson_vocabulary_links"("lesson_revision_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "item_revisions_item_id_revision_no_key" ON "app"."item_revisions"("item_id", "revision_no");

-- CreateIndex
CREATE UNIQUE INDEX "item_revisions_id_item_id_key" ON "app"."item_revisions"("id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_revisions_id_authoring_lesson_revision_id_key" ON "app"."item_revisions"("id", "authoring_lesson_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_grading_secrets_item_revision_id_key" ON "app_private"."item_grading_secrets"("item_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_exercises_lesson_revision_id_position_key" ON "app"."lesson_exercises"("lesson_revision_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_exercises_lesson_revision_id_item_id_key" ON "app"."lesson_exercises"("lesson_revision_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_exercises_id_lesson_revision_id_key" ON "app"."lesson_exercises"("id", "lesson_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_bucket_id_object_key_key" ON "app"."media_assets"("bucket_id", "object_key");

-- CreateIndex
CREATE UNIQUE INDEX "learning_contexts_learner_id_language_id_key" ON "app"."learning_contexts"("learner_id", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_attempts_id_lesson_revision_id_key" ON "app"."lesson_attempts"("id", "lesson_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_attempts_id_context_id_lesson_id_key" ON "app"."lesson_attempts"("id", "context_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_responses_attempt_exercise_ordinal_key" ON "app"."lesson_responses"("attempt_id", "lesson_exercise_id", "response_ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_responses_attempt_operation_key_key" ON "app"."lesson_responses"("attempt_id", "operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_responses_attempt_queue_position_key" ON "app"."lesson_responses"("attempt_id", "queue_position");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_completions_context_id_lesson_id_key" ON "app"."lesson_completions"("context_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "srs_cards_learner_id_vocabulary_id_key" ON "app"."srs_cards"("learner_id", "vocabulary_id");

-- CreateIndex
CREATE UNIQUE INDEX "srs_cards_id_learner_id_key" ON "app"."srs_cards"("id", "learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "srs_review_operations_learner_id_operation_key_key" ON "app"."srs_review_operations"("learner_id", "operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_versions_blueprint_id_version_no_key" ON "app"."assessment_versions"("blueprint_id", "version_no");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_versions_blueprint_id_generation_input_hash_key" ON "app"."assessment_versions"("blueprint_id", "blueprint_generation", "assembly_input_hash");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_version_items_version_position_key" ON "app"."assessment_version_items"("assessment_version_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_version_items_version_item_id_key" ON "app"."assessment_version_items"("assessment_version_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_version_items_id_version_id_key" ON "app"."assessment_version_items"("id", "assessment_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempts_id_version_id_key" ON "app"."assessment_attempts"("id", "assessment_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_responses_attempt_item_key" ON "app_private"."assessment_responses"("attempt_id", "assessment_version_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_attempt_id_key" ON "app"."assessment_results"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "revision_reviews_id_lesson_rev_assignment_ep_key" ON "app"."revision_reviews"("id", "lesson_revision_id", "assignment_episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_requests_operation_key_key" ON "app_private"."provisioning_requests"("operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_requests_normalized_email_key" ON "app_private"."provisioning_requests"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "command_receipts_actor_id_command_operation_key_key" ON "app_private"."command_receipts"("actor_id", "command", "operation_key");

-- AddForeignKey
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_ui_locale_fkey" FOREIGN KEY ("ui_locale") REFERENCES "app"."languages"("code") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_native_language_id_fkey" FOREIGN KEY ("native_language_id") REFERENCES "app"."languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "app"."media_assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."levels" ADD CONSTRAINT "levels_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "app"."frameworks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."courses" ADD CONSTRAINT "courses_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "app"."languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."courses" ADD CONSTRAINT "courses_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "app"."frameworks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."courses" ADD CONSTRAINT "courses_default_start_level_id_fkey" FOREIGN KEY ("default_start_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."units" ADD CONSTRAINT "units_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "app"."courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."units" ADD CONSTRAINT "units_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lessons" ADD CONSTRAINT "lessons_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "app"."units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lessons" ADD CONSTRAINT "lessons_active_revision_fkey" FOREIGN KEY ("active_revision_id", "id") REFERENCES "app"."lesson_revisions"("id", "lesson_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."content_assignments" ADD CONSTRAINT "content_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."content_assignments" ADD CONSTRAINT "content_assignments_current_teacher_fkey" FOREIGN KEY ("current_teacher_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."content_assignments" ADD CONSTRAINT "content_assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "app"."lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assignment_history" ADD CONSTRAINT "assignment_history_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "app"."content_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assignment_history" ADD CONSTRAINT "assignment_history_previous_teacher_fkey" FOREIGN KEY ("previous_teacher_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assignment_history" ADD CONSTRAINT "assignment_history_next_teacher_fkey" FOREIGN KEY ("next_teacher_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assignment_history" ADD CONSTRAINT "assignment_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "app"."lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_prior_revision_fkey" FOREIGN KEY ("prior_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_assignment_lesson_fkey" FOREIGN KEY ("assignment_id", "lesson_id") REFERENCES "app"."content_assignments"("id", "lesson_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_creation_assignment_episode_fkey" FOREIGN KEY ("creation_assignment_episode_id", "assignment_id") REFERENCES "app"."assignment_history"("id", "assignment_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_revisions" ADD CONSTRAINT "lesson_revisions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."vocabulary_concepts" ADD CONSTRAINT "vocabulary_concepts_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "app"."languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."vocabulary_concepts" ADD CONSTRAINT "vocabulary_concepts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_vocabulary_links" ADD CONSTRAINT "lesson_vocabulary_links_lesson_revision_id_fkey" FOREIGN KEY ("lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_vocabulary_links" ADD CONSTRAINT "lesson_vocabulary_links_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "app"."vocabulary_concepts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_identities" ADD CONSTRAINT "item_identities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_identities" ADD CONSTRAINT "item_identities_variant_of_id_fkey" FOREIGN KEY ("variant_of_id") REFERENCES "app"."item_identities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_revisions" ADD CONSTRAINT "item_revisions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "app"."item_identities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_revisions" ADD CONSTRAINT "item_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_revisions" ADD CONSTRAINT "item_revisions_creation_assignment_episode_fkey" FOREIGN KEY ("creation_assignment_episode_id") REFERENCES "app"."assignment_history"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_revisions" ADD CONSTRAINT "item_revisions_authoring_lesson_revision_id_fkey" FOREIGN KEY ("authoring_lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."item_revisions" ADD CONSTRAINT "item_revisions_assessment_blueprint_id_fkey" FOREIGN KEY ("assessment_blueprint_id") REFERENCES "app"."assessment_blueprints"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."item_grading_secrets" ADD CONSTRAINT "item_grading_secrets_item_revision_id_fkey" FOREIGN KEY ("item_revision_id") REFERENCES "app"."item_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_exercises" ADD CONSTRAINT "lesson_exercises_lesson_revision_id_fkey" FOREIGN KEY ("lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_exercises" ADD CONSTRAINT "lesson_exercises_item_revision_item_fkey" FOREIGN KEY ("item_revision_id", "item_id") REFERENCES "app"."item_revisions"("id", "item_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_exercises" ADD CONSTRAINT "lesson_exercises_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "app"."item_identities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_assets" ADD CONSTRAINT "media_assets_owner_account_fkey" FOREIGN KEY ("owner_account_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_assets" ADD CONSTRAINT "media_assets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "app"."content_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_bindings" ADD CONSTRAINT "media_bindings_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "app"."media_assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_bindings" ADD CONSTRAINT "media_bindings_lesson_revision_id_fkey" FOREIGN KEY ("lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."media_bindings" ADD CONSTRAINT "media_bindings_item_revision_id_fkey" FOREIGN KEY ("item_revision_id") REFERENCES "app"."item_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "app"."languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "app"."courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_selected_start_level_id_fkey" FOREIGN KEY ("selected_start_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_working_level_id_fkey" FOREIGN KEY ("working_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."learning_contexts" ADD CONSTRAINT "learning_contexts_start_result_id_fkey" FOREIGN KEY ("start_result_id") REFERENCES "app"."assessment_results"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_attempts" ADD CONSTRAINT "lesson_attempts_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "app"."learning_contexts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_attempts" ADD CONSTRAINT "lesson_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "app"."lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_attempts" ADD CONSTRAINT "lesson_attempts_lesson_revision_lesson_fkey" FOREIGN KEY ("lesson_revision_id", "lesson_id") REFERENCES "app"."lesson_revisions"("id", "lesson_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_responses" ADD CONSTRAINT "lesson_responses_attempt_revision_fkey" FOREIGN KEY ("attempt_id", "lesson_revision_id") REFERENCES "app"."lesson_attempts"("id", "lesson_revision_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_responses" ADD CONSTRAINT "lesson_responses_exercise_revision_fkey" FOREIGN KEY ("lesson_exercise_id", "lesson_revision_id") REFERENCES "app"."lesson_exercises"("id", "lesson_revision_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_completions" ADD CONSTRAINT "lesson_completions_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "app"."learning_contexts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_completions" ADD CONSTRAINT "lesson_completions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "app"."lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."lesson_completions" ADD CONSTRAINT "lesson_completions_attempt_context_lesson_fkey" FOREIGN KEY ("first_attempt_id", "context_id", "lesson_id") REFERENCES "app"."lesson_attempts"("id", "context_id", "lesson_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_cards" ADD CONSTRAINT "srs_cards_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_cards" ADD CONSTRAINT "srs_cards_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "app"."vocabulary_concepts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_cards" ADD CONSTRAINT "srs_cards_source_attempt_id_fkey" FOREIGN KEY ("source_attempt_id") REFERENCES "app"."lesson_attempts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_cards" ADD CONSTRAINT "srs_cards_source_lesson_vocabulary_id_fkey" FOREIGN KEY ("source_lesson_vocabulary_id") REFERENCES "app"."lesson_vocabulary_links"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_review_operations" ADD CONSTRAINT "srs_review_operations_card_learner_fkey" FOREIGN KEY ("card_id", "learner_id") REFERENCES "app"."srs_cards"("id", "learner_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_review_operations" ADD CONSTRAINT "srs_review_operations_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."srs_review_operations" ADD CONSTRAINT "srs_review_operations_reinforces_operation_id_fkey" FOREIGN KEY ("reinforces_operation_id") REFERENCES "app"."srs_review_operations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "app"."languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "app"."frameworks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "app"."courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_target_level_id_fkey" FOREIGN KEY ("target_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_next_level_id_fkey" FOREIGN KEY ("next_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_versions" ADD CONSTRAINT "assessment_versions_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "app"."assessment_blueprints"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_versions" ADD CONSTRAINT "assessment_versions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_versions" ADD CONSTRAINT "assessment_versions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_assessment_version_id_fkey" FOREIGN KEY ("assessment_version_id") REFERENCES "app"."assessment_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_item_revision_item_fkey" FOREIGN KEY ("item_revision_id", "item_id") REFERENCES "app"."item_revisions"("id", "item_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "app"."item_identities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_source_lesson_revision_id_fkey" FOREIGN KEY ("source_lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_source_review_tuple_fkey" FOREIGN KEY ("source_submission_id", "source_lesson_revision_id", "contribution_assignment_episode_id") REFERENCES "app"."revision_reviews"("id", "lesson_revision_id", "assignment_episode_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_item_source_owner_fkey" FOREIGN KEY ("item_revision_id", "source_lesson_revision_id") REFERENCES "app"."item_revisions"("id", "authoring_lesson_revision_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_version_items" ADD CONSTRAINT "assessment_version_items_contribution_assignment_episode_i_fkey" FOREIGN KEY ("contribution_assignment_episode_id") REFERENCES "app"."assignment_history"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_attempts" ADD CONSTRAINT "assessment_attempts_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "app"."learning_contexts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_version_id_fkey" FOREIGN KEY ("assessment_version_id") REFERENCES "app"."assessment_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."assessment_responses" ADD CONSTRAINT "assessment_responses_attempt_version_fkey" FOREIGN KEY ("attempt_id", "assessment_version_id") REFERENCES "app"."assessment_attempts"("id", "assessment_version_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."assessment_responses" ADD CONSTRAINT "assessment_responses_version_item_fkey" FOREIGN KEY ("assessment_version_item_id", "assessment_version_id") REFERENCES "app"."assessment_version_items"("id", "assessment_version_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_results" ADD CONSTRAINT "assessment_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "app"."assessment_attempts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."assessment_results" ADD CONSTRAINT "assessment_results_recommended_level_id_fkey" FOREIGN KEY ("recommended_level_id") REFERENCES "app"."levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."revision_reviews" ADD CONSTRAINT "revision_reviews_lesson_revision_id_fkey" FOREIGN KEY ("lesson_revision_id") REFERENCES "app"."lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."revision_reviews" ADD CONSTRAINT "revision_reviews_assessment_version_id_fkey" FOREIGN KEY ("assessment_version_id") REFERENCES "app"."assessment_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."revision_reviews" ADD CONSTRAINT "revision_reviews_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."revision_reviews" ADD CONSTRAINT "revision_reviews_assignment_episode_id_fkey" FOREIGN KEY ("assignment_episode_id") REFERENCES "app"."assignment_history"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."provisioning_requests" ADD CONSTRAINT "provisioning_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."command_receipts" ADD CONSTRAINT "command_receipts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app_private"."audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;



-- =============================================================================
-- SQL-only Extensions for Unsupported Objects, Integrity, and Security
-- Authority: plans/2026-10-27-product-database-spec.md §§2-4
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. External Auth Provider Foreign Keys (fail closed if auth.users is absent)
-- -----------------------------------------------------------------------------
ALTER TABLE "app"."accounts"
  ADD CONSTRAINT "accounts_id_auth_users_fkey"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE "app_private"."provisioning_requests"
  ADD CONSTRAINT "provisioning_requests_auth_user_id_fkey"
  FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id")
  ON UPDATE NO ACTION ON DELETE RESTRICT;

-- -----------------------------------------------------------------------------
-- 2. Domain and Scalar CHECK Constraints
-- -----------------------------------------------------------------------------

-- app.accounts
ALTER TABLE "app"."accounts"
  ADD CONSTRAINT "accounts_role_check" CHECK ("role" IN ('ADMIN', 'TEACHER', 'LEARNER')),
  ADD CONSTRAINT "accounts_status_check" CHECK ("status" IN ('PENDING', 'ACTIVE', 'DISABLED')),
  ADD CONSTRAINT "accounts_row_version_check" CHECK ("row_version" > 0);

-- app.levels
ALTER TABLE "app"."levels"
  ADD CONSTRAINT "levels_position_check" CHECK ("position" > 0);

-- app.courses
ALTER TABLE "app"."courses"
  ADD CONSTRAINT "courses_curriculum_generation_check" CHECK ("curriculum_generation" > 0),
  ADD CONSTRAINT "courses_coverage_catalog_generation_check" CHECK ("coverage_catalog_generation" > 0),
  ADD CONSTRAINT "courses_row_version_check" CHECK ("row_version" > 0);

-- app.units
ALTER TABLE "app"."units"
  ADD CONSTRAINT "units_position_check" CHECK ("position" > 0),
  ADD CONSTRAINT "units_row_version_check" CHECK ("row_version" > 0);

-- app.lessons
ALTER TABLE "app"."lessons"
  ADD CONSTRAINT "lessons_availability_check" CHECK ("availability" IN ('PLANNED', 'AVAILABLE', 'WITHDRAWN')),
  ADD CONSTRAINT "lessons_position_check" CHECK ("position" > 0),
  ADD CONSTRAINT "lessons_row_version_check" CHECK ("row_version" > 0);

-- app.content_assignments
ALTER TABLE "app"."content_assignments"
  ADD CONSTRAINT "content_assignments_scope_generation_check" CHECK ("scope_generation" > 0),
  ADD CONSTRAINT "content_assignments_row_version_check" CHECK ("row_version" > 0);

-- app.assignment_history
ALTER TABLE "app"."assignment_history"
  ADD CONSTRAINT "assignment_history_event_type_check" CHECK ("event_type" IN ('ASSIGNED', 'REASSIGNED', 'SCOPE_CHANGED')),
  ADD CONSTRAINT "assignment_history_sequence_no_check" CHECK ("sequence_no" > 0),
  ADD CONSTRAINT "assignment_history_scope_generation_check" CHECK ("scope_generation" > 0);

-- app.lesson_revisions
ALTER TABLE "app"."lesson_revisions"
  ADD CONSTRAINT "lesson_revisions_status_check" CHECK ("status" IN ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN')),
  ADD CONSTRAINT "lesson_revisions_revision_no_check" CHECK ("revision_no" > 0),
  ADD CONSTRAINT "lesson_revisions_row_version_check" CHECK ("row_version" > 0);

-- app.vocabulary_concepts
ALTER TABLE "app"."vocabulary_concepts"
  ADD CONSTRAINT "vocabulary_concepts_row_version_check" CHECK ("row_version" > 0);

-- app.lesson_vocabulary_links
ALTER TABLE "app"."lesson_vocabulary_links"
  ADD CONSTRAINT "lesson_vocabulary_links_position_check" CHECK ("position" > 0);

-- app.item_identities
ALTER TABLE "app"."item_identities"
  ADD CONSTRAINT "item_identities_origin_check" CHECK ("origin" IN ('PRACTICE', 'ASSESSMENT'));

-- app.item_revisions
ALTER TABLE "app"."item_revisions"
  ADD CONSTRAINT "item_revisions_type_check" CHECK ("type" IN ('MCQ', 'FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR')),
  ADD CONSTRAINT "item_revisions_revision_no_check" CHECK ("revision_no" > 0),
  ADD CONSTRAINT "item_revisions_schema_version_check" CHECK ("schema_version" > 0),
  ADD CONSTRAINT "item_revisions_row_version_check" CHECK ("row_version" > 0);

-- app_private.item_grading_secrets
ALTER TABLE "app_private"."item_grading_secrets"
  ADD CONSTRAINT "item_grading_secrets_schema_version_check" CHECK ("schema_version" > 0);

-- app.lesson_exercises
ALTER TABLE "app"."lesson_exercises"
  ADD CONSTRAINT "lesson_exercises_position_check" CHECK ("position" > 0);

-- app.media_assets
ALTER TABLE "app"."media_assets"
  ADD CONSTRAINT "media_assets_byte_size_check" CHECK ("byte_size" > 0),
  ADD CONSTRAINT "media_assets_kind_check" CHECK ("kind" IN ('AVATAR', 'CONTENT')),
  ADD CONSTRAINT "media_assets_kind_ownership_check" CHECK (
    ("kind" = 'AVATAR' AND "owner_account_id" IS NOT NULL AND "assignment_id" IS NULL) OR
    ("kind" = 'CONTENT' AND "owner_account_id" IS NULL AND "assignment_id" IS NOT NULL)
  );

-- app.media_bindings
ALTER TABLE "app"."media_bindings"
  ADD CONSTRAINT "media_bindings_position_check" CHECK ("position" > 0),
  ADD CONSTRAINT "media_bindings_usage_check" CHECK ("usage" IN ('AUDIO', 'IMAGE')),
  ADD CONSTRAINT "media_bindings_owner_xor_check" CHECK (
    ("lesson_revision_id" IS NOT NULL AND "item_revision_id" IS NULL) OR
    ("lesson_revision_id" IS NULL AND "item_revision_id" IS NOT NULL)
  );

-- app.learning_contexts
ALTER TABLE "app"."learning_contexts"
  ADD CONSTRAINT "learning_contexts_status_check" CHECK ("status" IN ('ACTIVE', 'PAUSED')),
  ADD CONSTRAINT "learning_contexts_study_focus_check" CHECK ("study_focus" IN ('BALANCED', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING')),
  ADD CONSTRAINT "learning_contexts_start_source_check" CHECK ("start_source" IS NULL OR "start_source" IN ('DEFAULT', 'SELF_REPORT', 'PLACEMENT')),
  ADD CONSTRAINT "learning_contexts_row_version_check" CHECK ("row_version" > 0);

-- app.lesson_attempts
ALTER TABLE "app"."lesson_attempts"
  ADD CONSTRAINT "lesson_attempts_n_core_check" CHECK ("n_core" > 0),
  ADD CONSTRAINT "lesson_attempts_row_version_check" CHECK ("row_version" > 0),
  ADD CONSTRAINT "lesson_attempts_completion_shape_check" CHECK (
    ("completed_at" IS NULL AND "k_first_wrong" IS NULL AND "contribution_units" IS NULL AND "response_count" IS NULL AND "completion_operation_key" IS NULL AND "qualifying_local_date" IS NULL AND "timezone_at_completion" IS NULL) OR
    ("completed_at" IS NOT NULL AND "k_first_wrong" IS NOT NULL AND "contribution_units" IS NOT NULL AND "response_count" IS NOT NULL AND "completion_operation_key" IS NOT NULL AND "qualifying_local_date" IS NOT NULL AND "timezone_at_completion" IS NOT NULL)
  );

-- app.lesson_responses
ALTER TABLE "app"."lesson_responses"
  ADD CONSTRAINT "lesson_responses_response_ordinal_check" CHECK ("response_ordinal" IN (1, 2)),
  ADD CONSTRAINT "lesson_responses_queue_position_check" CHECK ("queue_position" > 0),
  ADD CONSTRAINT "lesson_responses_contribution_units_check" CHECK ("contribution_units" IN (0, 1, 2)),
  ADD CONSTRAINT "lesson_responses_contribution_rule_check" CHECK (
    ("response_ordinal" = 1 AND "is_correct" = true AND "contribution_units" = 2) OR
    ("response_ordinal" = 1 AND "is_correct" = false AND "contribution_units" = 0) OR
    ("response_ordinal" = 2 AND "is_correct" = true AND "contribution_units" = 1) OR
    ("response_ordinal" = 2 AND "is_correct" = false AND "contribution_units" = 0)
  );

-- app.srs_cards
ALTER TABLE "app"."srs_cards"
  ADD CONSTRAINT "srs_cards_stage_check" CHECK ("stage" BETWEEN 1 AND 5),
  ADD CONSTRAINT "srs_cards_enrollment_source_check" CHECK ("enrollment_source" IN ('CORE_COMPLETION', 'OPTIONAL_CHOICE')),
  ADD CONSTRAINT "srs_cards_row_version_check" CHECK ("row_version" > 0);

-- app.srs_review_operations
ALTER TABLE "app"."srs_review_operations"
  ADD CONSTRAINT "srs_review_operations_kind_check" CHECK ("kind" IN ('SCHEDULE', 'REINFORCEMENT')),
  ADD CONSTRAINT "srs_review_operations_rating_check" CHECK ("rating" IN ('REMEMBERED', 'FORGOTTEN')),
  ADD CONSTRAINT "srs_review_operations_stage_check" CHECK ("next_stage" BETWEEN 1 AND 5 AND ("prior_stage" IS NULL OR "prior_stage" BETWEEN 1 AND 5));

-- app.assessment_blueprints
ALTER TABLE "app"."assessment_blueprints"
  ADD CONSTRAINT "assessment_blueprints_purpose_check" CHECK ("purpose" IN ('PLACEMENT', 'LEVEL_UP')),
  ADD CONSTRAINT "assessment_blueprints_generation_check" CHECK ("generation" > 0),
  ADD CONSTRAINT "assessment_blueprints_coverage_catalog_generation_check" CHECK ("coverage_catalog_generation" > 0),
  ADD CONSTRAINT "assessment_blueprints_row_version_check" CHECK ("row_version" > 0);

-- app.assessment_versions
ALTER TABLE "app"."assessment_versions"
  ADD CONSTRAINT "assessment_versions_status_check" CHECK ("status" IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN')),
  ADD CONSTRAINT "assessment_versions_version_no_check" CHECK ("version_no" > 0),
  ADD CONSTRAINT "assessment_versions_blueprint_generation_check" CHECK ("blueprint_generation" > 0),
  ADD CONSTRAINT "assessment_versions_row_version_check" CHECK ("row_version" > 0),
  ADD CONSTRAINT "assessment_versions_active_published_check" CHECK (NOT "is_active" OR "status" = 'PUBLISHED');

-- app.assessment_version_items
ALTER TABLE "app"."assessment_version_items"
  ADD CONSTRAINT "assessment_version_items_position_check" CHECK ("position" > 0),
  ADD CONSTRAINT "assessment_version_items_weight_check" CHECK ("weight" > 0);

-- app.assessment_attempts
ALTER TABLE "app"."assessment_attempts"
  ADD CONSTRAINT "assessment_attempts_row_version_check" CHECK ("row_version" > 0),
  ADD CONSTRAINT "assessment_attempts_context_row_version_check" CHECK ("context_row_version_at_start" > 0),
  ADD CONSTRAINT "assessment_attempts_curriculum_generation_check" CHECK ("curriculum_generation_at_start" > 0),
  ADD CONSTRAINT "assessment_attempts_finalization_shape_check" CHECK (
    ("finalized_at" IS NULL AND "submission_key" IS NULL AND "submission_hash" IS NULL) OR
    ("finalized_at" IS NOT NULL AND "submission_key" IS NOT NULL AND "submission_hash" IS NOT NULL)
  );

-- app_private.assessment_responses
ALTER TABLE "app_private"."assessment_responses"
  ADD CONSTRAINT "assessment_responses_awarded_points_check" CHECK ("awarded_points" >= 0);

-- app.assessment_results
ALTER TABLE "app"."assessment_results"
  ADD CONSTRAINT "assessment_results_raw_points_check" CHECK ("raw_points" >= 0),
  ADD CONSTRAINT "assessment_results_possible_points_check" CHECK ("possible_points" > 0),
  ADD CONSTRAINT "assessment_results_points_bound_check" CHECK ("raw_points" <= "possible_points");

-- app.revision_reviews
ALTER TABLE "app"."revision_reviews"
  ADD CONSTRAINT "revision_reviews_action_check" CHECK ("action" IN ('SUBMIT', 'REQUEST_CHANGES', 'APPROVE', 'PUBLISH', 'ARCHIVE', 'WITHDRAW')),
  ADD CONSTRAINT "revision_reviews_owner_xor_check" CHECK (
    ("lesson_revision_id" IS NOT NULL AND "assessment_version_id" IS NULL) OR
    ("lesson_revision_id" IS NULL AND "assessment_version_id" IS NOT NULL)
  ),
  ADD CONSTRAINT "revision_reviews_row_version_check" CHECK ("revision_row_version" > 0);

-- app_private.provisioning_requests
ALTER TABLE "app_private"."provisioning_requests"
  ADD CONSTRAINT "provisioning_requests_requested_role_check" CHECK ("requested_role" IN ('TEACHER', 'ADMIN')),
  ADD CONSTRAINT "provisioning_requests_state_check" CHECK ("state" IN ('REQUESTED', 'IDENTITY_CREATED', 'READY', 'FAILED_RETRYABLE')),
  ADD CONSTRAINT "provisioning_requests_row_version_check" CHECK ("row_version" > 0);

-- app_private.command_receipts
ALTER TABLE "app_private"."command_receipts"
  ADD CONSTRAINT "command_receipts_command_check" CHECK ("command" IN ('PUBLISH_LESSON','PUBLISH_ASSESSMENT','DISABLE_ACCOUNT','ENABLE_ACCOUNT','COMPLETE_LESSON','SELECT_START','ASSIGN_TEACHER','SUBMIT_CONTENT','REMOVE_DRAFT_MEMBER','REQUEST_CHANGES','APPROVE','ARCHIVE','WITHDRAW'));

-- app_private.audit_events
ALTER TABLE "app_private"."audit_events"
  ADD CONSTRAINT "audit_events_actor_kind_check" CHECK ("actor_kind" IN ('ACCOUNT', 'VERIFIED_AUTH_SUBJECT', 'SYSTEM')),
  ADD CONSTRAINT "audit_events_outcome_check" CHECK ("outcome" IN ('SUCCESS', 'DENIED', 'FAILURE')),
  ADD CONSTRAINT "audit_events_actor_attribution_check" CHECK (
    ("actor_kind" = 'ACCOUNT' AND "actor_id" IS NOT NULL AND "verified_auth_subject_id" IS NULL) OR
    ("actor_kind" = 'VERIFIED_AUTH_SUBJECT' AND "actor_id" IS NULL AND "verified_auth_subject_id" IS NOT NULL) OR
    ("actor_kind" = 'SYSTEM' AND "actor_id" IS NULL AND "verified_auth_subject_id" IS NULL)
  );

-- JSON object/array shape and nonblank string checks (DB-R6)
ALTER TABLE "app"."languages"
  ADD CONSTRAINT "languages_names_object_check" CHECK (jsonb_typeof("names") = 'object'),
  ADD CONSTRAINT "languages_code_nonblank_check" CHECK (length(trim("code")) > 0);

ALTER TABLE "app"."frameworks"
  ADD CONSTRAINT "frameworks_names_object_check" CHECK (jsonb_typeof("names") = 'object'),
  ADD CONSTRAINT "frameworks_code_nonblank_check" CHECK (length(trim("code")) > 0),
  ADD CONSTRAINT "frameworks_version_nonblank_check" CHECK (length(trim("version")) > 0);

ALTER TABLE "app"."levels"
  ADD CONSTRAINT "levels_label_object_check" CHECK (jsonb_typeof("label") = 'object'),
  ADD CONSTRAINT "levels_code_nonblank_check" CHECK (length(trim("code")) > 0);

ALTER TABLE "app"."courses"
  ADD CONSTRAINT "courses_names_object_check" CHECK (jsonb_typeof("names") = 'object'),
  ADD CONSTRAINT "courses_gate_config_object_check" CHECK (jsonb_typeof("gate_config") = 'object'),
  ADD CONSTRAINT "courses_practice_config_object_check" CHECK (jsonb_typeof("practice_config") = 'object'),
  ADD CONSTRAINT "courses_coverage_catalog_object_check" CHECK (jsonb_typeof("coverage_catalog") = 'object');

ALTER TABLE "app"."units"
  ADD CONSTRAINT "units_names_object_check" CHECK (jsonb_typeof("names") = 'object'),
  ADD CONSTRAINT "units_code_nonblank_check" CHECK (length(trim("code")) > 0);

ALTER TABLE "app"."lesson_revisions"
  ADD CONSTRAINT "lesson_revisions_title_object_check" CHECK (jsonb_typeof("title") = 'object'),
  ADD CONSTRAINT "lesson_revisions_content_blocks_array_check" CHECK (jsonb_typeof("content_blocks") = 'array'),
  ADD CONSTRAINT "lesson_revisions_coverage_catalog_gen_positive_check" CHECK ("coverage_catalog_generation" IS NULL OR "coverage_catalog_generation" > 0),
  ADD CONSTRAINT "lesson_revisions_submitted_gen_positive_check" CHECK ("submitted_assignment_generation" IS NULL OR "submitted_assignment_generation" > 0),
  ADD CONSTRAINT "lesson_revisions_coverage_snapshot_object_check" CHECK ("coverage_snapshot" IS NULL OR jsonb_typeof("coverage_snapshot") = 'object'),
  ADD CONSTRAINT "lesson_revisions_assignment_scope_snapshot_object_check" CHECK ("assignment_scope_snapshot" IS NULL OR jsonb_typeof("assignment_scope_snapshot") = 'object');

ALTER TABLE "app"."vocabulary_concepts"
  ADD CONSTRAINT "vocabulary_concepts_meaning_labels_object_check" CHECK (jsonb_typeof("meaning_labels") = 'object'),
  ADD CONSTRAINT "vocabulary_concepts_canonical_form_nonblank_check" CHECK (length(trim("canonical_form")) > 0),
  ADD CONSTRAINT "vocabulary_concepts_normalized_form_nonblank_check" CHECK (length(trim("normalized_form")) > 0),
  ADD CONSTRAINT "vocabulary_concepts_sense_key_nonblank_check" CHECK (length(trim("sense_key")) > 0);

ALTER TABLE "app"."lesson_vocabulary_links"
  ADD CONSTRAINT "lesson_vocabulary_links_display_snapshot_object_check" CHECK (jsonb_typeof("display_snapshot") = 'object');

ALTER TABLE "app"."item_identities"
  ADD CONSTRAINT "item_identities_exact_fingerprint_nonblank_check" CHECK (length(trim("exact_fingerprint")) > 0);

ALTER TABLE "app"."item_revisions"
  ADD CONSTRAINT "item_revisions_prompt_data_object_check" CHECK (jsonb_typeof("prompt_data") = 'object'),
  ADD CONSTRAINT "item_revisions_exact_fingerprint_nonblank_check" CHECK (length(trim("exact_fingerprint")) > 0),
  ADD CONSTRAINT "item_revisions_blueprint_pin_shape_check" CHECK (
    ("assessment_blueprint_id" IS NULL AND "blueprint_generation" IS NULL) OR
    ("assessment_blueprint_id" IS NOT NULL AND "blueprint_generation" IS NOT NULL AND "blueprint_generation" > 0)
  ),
  ADD CONSTRAINT "item_revisions_practice_coverage_snapshot_object_check" CHECK ("practice_coverage_snapshot" IS NULL OR jsonb_typeof("practice_coverage_snapshot") = 'object');

ALTER TABLE "app_private"."item_grading_secrets"
  ADD CONSTRAINT "item_grading_secrets_grading_data_object_check" CHECK (jsonb_typeof("grading_data") = 'object'),
  ADD CONSTRAINT "item_grading_secrets_feedback_data_object_check" CHECK ("feedback_data" IS NULL OR jsonb_typeof("feedback_data") = 'object');

ALTER TABLE "app"."media_assets"
  ADD CONSTRAINT "media_assets_object_key_nonblank_check" CHECK (length(trim("object_key")) > 0),
  ADD CONSTRAINT "media_assets_sha256_nonblank_check" CHECK (length(trim("sha256")) > 0),
  ADD CONSTRAINT "media_assets_mime_type_nonblank_check" CHECK (length(trim("mime_type")) > 0);

ALTER TABLE "app"."lesson_responses"
  ADD CONSTRAINT "lesson_responses_input_object_check" CHECK (jsonb_typeof("input") = 'object'),
  ADD CONSTRAINT "lesson_responses_input_hash_nonblank_check" CHECK (length(trim("input_hash")) > 0);

ALTER TABLE "app"."content_assignments"
  ADD CONSTRAINT "content_assignments_requirement_object_check" CHECK (jsonb_typeof("requirement") = 'object'),
  ADD CONSTRAINT "content_assignments_scope_object_check" CHECK (jsonb_typeof("scope") = 'object');

ALTER TABLE "app"."assignment_history"
  ADD CONSTRAINT "assignment_history_scope_snapshot_object_check" CHECK (jsonb_typeof("scope_snapshot") = 'object');

ALTER TABLE "app_private"."assessment_responses"
  ADD CONSTRAINT "assessment_responses_input_object_check" CHECK (jsonb_typeof("input") = 'object');

ALTER TABLE "app"."assessment_blueprints"
  ADD CONSTRAINT "assessment_blueprints_coverage_object_check" CHECK (jsonb_typeof("coverage") = 'object'),
  ADD CONSTRAINT "assessment_blueprints_requirements_object_check" CHECK (jsonb_typeof("requirements") = 'object'),
  ADD CONSTRAINT "assessment_blueprints_config_object_check" CHECK (jsonb_typeof("config") = 'object');

ALTER TABLE "app"."assessment_versions"
  ADD CONSTRAINT "assessment_versions_blueprint_snapshot_object_check" CHECK (jsonb_typeof("blueprint_snapshot") = 'object'),
  ADD CONSTRAINT "assessment_versions_assembly_input_hash_nonblank_check" CHECK (length(trim("assembly_input_hash")) > 0);

ALTER TABLE "app"."assessment_version_items"
  ADD CONSTRAINT "assessment_version_items_coverage_tags_object_check" CHECK (jsonb_typeof("coverage_tags") = 'object');

ALTER TABLE "app_private"."command_receipts"
  ADD CONSTRAINT "command_receipts_input_hash_nonblank_check" CHECK (length(trim("input_hash")) > 0),
  ADD CONSTRAINT "command_receipts_safe_result_object_check" CHECK (jsonb_typeof("safe_result") = 'object');

ALTER TABLE "app_private"."audit_events"
  ADD CONSTRAINT "audit_events_safe_context_object_check" CHECK ("safe_context" IS NULL OR jsonb_typeof("safe_context") = 'object'),
  ADD CONSTRAINT "audit_events_action_nonblank_check" CHECK (length(trim("action")) > 0),
  ADD CONSTRAINT "audit_events_target_type_nonblank_check" CHECK (length(trim("target_type")) > 0);

-- Learning context start shape and preferences (DB-R6)
ALTER TABLE "app"."learning_contexts"
  ADD CONSTRAINT "learning_contexts_start_shape_check" CHECK (
    ("start_source" IS NULL AND "selected_start_level_id" IS NULL AND "start_result_id" IS NULL AND "self_report" IS NULL AND "working_level_id" IS NULL) OR
    ("start_source" = 'DEFAULT' AND "selected_start_level_id" IS NOT NULL AND "start_result_id" IS NULL AND "self_report" IS NULL) OR
    ("start_source" = 'SELF_REPORT' AND "selected_start_level_id" IS NOT NULL AND "start_result_id" IS NULL AND "self_report" IS NOT NULL AND jsonb_typeof("self_report") = 'object') OR
    ("start_source" = 'PLACEMENT' AND "selected_start_level_id" IS NOT NULL AND "start_result_id" IS NOT NULL)
  ),
  ADD CONSTRAINT "learning_contexts_study_preferences_object_check" CHECK (jsonb_typeof("study_preferences") = 'object');

-- Lesson attempt completion bounds (DB-R6)
ALTER TABLE "app"."lesson_attempts"
  ADD CONSTRAINT "lesson_attempts_completion_bounds_check" CHECK (
    "completed_at" IS NULL OR (
      "k_first_wrong" >= 0 AND "k_first_wrong" <= "n_core" AND
      "contribution_units" >= 0 AND
      "response_count" > 0 AND "response_count" <= 2 * "n_core"
    )
  );

-- SRS card source shape (DB-R6)
ALTER TABLE "app"."srs_cards"
  ADD CONSTRAINT "srs_cards_source_shape_check" CHECK (
    ("enrollment_source" = 'CORE_COMPLETION' AND "source_attempt_id" IS NOT NULL AND "source_lesson_vocabulary_id" IS NOT NULL) OR
    ("enrollment_source" = 'OPTIONAL_CHOICE' AND "source_lesson_vocabulary_id" IS NOT NULL)
  );

-- SRS review operation shape (DB-R6)
ALTER TABLE "app"."srs_review_operations"
  ADD CONSTRAINT "srs_review_operations_shape_check" CHECK (
    ("kind" = 'SCHEDULE' AND "reinforces_operation_id" IS NULL) OR
    ("kind" = 'REINFORCEMENT' AND "reinforces_operation_id" IS NOT NULL AND "qualifying_local_date" IS NULL)
  ),
  ADD CONSTRAINT "srs_review_operations_input_hash_nonblank_check" CHECK (length(trim("input_hash")) > 0);

-- Revision review shape (DB-R6)
ALTER TABLE "app"."revision_reviews"
  ADD CONSTRAINT "revision_reviews_lesson_review_shape_check" CHECK (
    "lesson_revision_id" IS NULL OR (
      "assignment_episode_id" IS NOT NULL AND "assignment_generation" IS NOT NULL AND "assignment_generation" > 0 AND
      "assignment_scope_snapshot" IS NOT NULL AND jsonb_typeof("assignment_scope_snapshot") = 'object'
    )
  ),
  ADD CONSTRAINT "revision_reviews_version_review_shape_check" CHECK (
    "assessment_version_id" IS NULL OR (
      "blueprint_generation" IS NOT NULL AND "blueprint_generation" > 0 AND
      "assignment_episode_id" IS NULL AND "assignment_generation" IS NULL AND "assignment_scope_snapshot" IS NULL
    )
  ),
  ADD CONSTRAINT "revision_reviews_submit_lesson_only_check" CHECK (
    "action" != 'SUBMIT' OR "lesson_revision_id" IS NOT NULL
  );

-- Assessment attempt and result checks (DB-R6)
ALTER TABLE "app"."assessment_results"
  ADD CONSTRAINT "assessment_results_assessment_type_check" CHECK ("assessment_type" IN ('PLACEMENT', 'LEVEL_UP')),
  ADD CONSTRAINT "assessment_results_delivery_mode_nonblank_check" CHECK (length(trim("delivery_mode")) > 0);

ALTER TABLE "app"."assessment_attempts"
  ADD CONSTRAINT "assessment_attempts_submission_hash_nonblank_check" CHECK ("submission_hash" IS NULL OR length(trim("submission_hash")) > 0);

ALTER TABLE "app_private"."provisioning_requests"
  ADD CONSTRAINT "provisioning_requests_normalized_email_nonblank_check" CHECK (length(trim("normalized_email")) > 0);

-- -----------------------------------------------------------------------------
-- 3. Partial Unique Indexes
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX "assessment_versions_active_blueprint_idx"
  ON "app"."assessment_versions"("blueprint_id")
  WHERE "is_active" = true;

CREATE UNIQUE INDEX "media_bindings_lesson_rev_pos_idx"
  ON "app"."media_bindings"("lesson_revision_id", "position")
  WHERE "lesson_revision_id" IS NOT NULL;

CREATE UNIQUE INDEX "media_bindings_item_rev_pos_idx"
  ON "app"."media_bindings"("item_revision_id", "position")
  WHERE "item_revision_id" IS NOT NULL;

CREATE UNIQUE INDEX "srs_review_ops_card_session_sched_idx"
  ON "app"."srs_review_operations"("card_id", "session_key")
  WHERE "kind" = 'SCHEDULE';

CREATE UNIQUE INDEX "srs_review_ops_card_session_reinf_idx"
  ON "app"."srs_review_operations"("card_id", "session_key")
  WHERE "kind" = 'REINFORCEMENT';

CREATE UNIQUE INDEX "srs_review_ops_reinforces_op_idx"
  ON "app"."srs_review_operations"("reinforces_operation_id")
  WHERE "kind" = 'REINFORCEMENT';

CREATE UNIQUE INDEX "assessment_attempts_context_submission_key_idx"
  ON "app"."assessment_attempts"("context_id", "submission_key")
  WHERE "submission_key" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Query / Performance Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX "srs_cards_learner_due_idx"
  ON "app"."srs_cards"("learner_id", "due_at", "id");

CREATE INDEX "lesson_attempts_latest_completed_idx"
  ON "app"."lesson_attempts"("context_id", "lesson_id", "completed_at" DESC, "id" DESC)
  WHERE "completed_at" IS NOT NULL;

CREATE INDEX "learning_contexts_own_active_idx"
  ON "app"."learning_contexts"("learner_id", "created_at")
  WHERE "status" = 'ACTIVE';

CREATE INDEX "assessment_attempts_own_history_idx"
  ON "app"."assessment_attempts"("context_id", "started_at" DESC, "id");

CREATE INDEX "content_assignments_teacher_worklist_idx"
  ON "app"."content_assignments"("current_teacher_id", "updated_at" DESC, "id");

CREATE INDEX "lesson_revisions_review_queue_idx"
  ON "app"."lesson_revisions"("submitted_at", "id")
  WHERE "status" = 'IN_REVIEW';

CREATE INDEX "assessment_versions_review_queue_idx"
  ON "app"."assessment_versions"("assembled_at", "id")
  WHERE "status" = 'IN_REVIEW';

CREATE INDEX "item_revisions_exact_fingerprint_idx"
  ON "app"."item_revisions"("exact_fingerprint");

CREATE INDEX "item_identities_exact_fingerprint_idx"
  ON "app"."item_identities"("exact_fingerprint");

CREATE INDEX "media_bindings_asset_id_idx"
  ON "app"."media_bindings"("media_asset_id");

CREATE INDEX "revision_reviews_lesson_rev_idx"
  ON "app"."revision_reviews"("lesson_revision_id", "occurred_at", "id")
  WHERE "lesson_revision_id" IS NOT NULL;

CREATE INDEX "revision_reviews_assessment_ver_idx"
  ON "app"."revision_reviews"("assessment_version_id", "occurred_at", "id")
  WHERE "assessment_version_id" IS NOT NULL;

CREATE INDEX "audit_events_actor_occurred_idx"
  ON "app_private"."audit_events"("actor_id", "occurred_at" DESC, "id" DESC);

CREATE INDEX "audit_events_verified_auth_subject_idx"
  ON "app_private"."audit_events"("verified_auth_subject_id", "occurred_at" DESC, "id" DESC);

CREATE INDEX "audit_events_target_occurred_idx"
  ON "app_private"."audit_events"("target_type", "target_id", "occurred_at" DESC, "id" DESC);

CREATE INDEX "srs_review_ops_streak_idx"
  ON "app"."srs_review_operations"("learner_id", "qualifying_local_date")
  WHERE "kind" = 'SCHEDULE';

CREATE INDEX "lesson_attempts_streak_idx"
  ON "app"."lesson_attempts"("context_id", "qualifying_local_date")
  WHERE "completed_at" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Core-Readiness, Provenance, Scope, and Immutability Triggers (DB-R3..R5)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.check_lesson_revision_core_readiness()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('IN_REVIEW', 'APPROVED', 'PUBLISHED') THEN
    IF NOT EXISTS (
      SELECT 1 FROM app.lesson_exercises
      WHERE lesson_revision_id = NEW.id
        AND is_core = true
    ) THEN
      RAISE EXCEPTION 'Lesson revision % cannot transition to % without at least one core exercise', NEW.id, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_core_readiness ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_core_readiness
  BEFORE INSERT OR UPDATE OF status ON app.lesson_revisions
  FOR EACH ROW
  EXECUTE FUNCTION app.check_lesson_revision_core_readiness();

-- DB-R4: Exercise must use PRACTICE origin items only
CREATE OR REPLACE FUNCTION app.check_lesson_exercise_practice_origin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app.item_identities
    WHERE id = NEW.item_id AND origin = 'PRACTICE'
  ) THEN
    RAISE EXCEPTION 'Lesson exercise item % must have PRACTICE origin', NEW.item_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_exercise_practice_origin ON app.lesson_exercises;
CREATE TRIGGER trg_lesson_exercise_practice_origin
  BEFORE INSERT OR UPDATE OF item_id ON app.lesson_exercises
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_exercise_practice_origin();

-- DB-R4: Prior lesson revision must belong to same lesson with earlier revision_no
CREATE OR REPLACE FUNCTION app.check_lesson_revision_prior_predecessor()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_prior_lesson UUID; v_prior_no INT;
BEGIN
  IF NEW.prior_revision_id IS NOT NULL THEN
    SELECT lesson_id, revision_no INTO v_prior_lesson, v_prior_no
      FROM app.lesson_revisions WHERE id = NEW.prior_revision_id;
    IF v_prior_lesson IS DISTINCT FROM NEW.lesson_id THEN
      RAISE EXCEPTION 'Prior revision must belong to the same lesson' USING ERRCODE = 'check_violation';
    END IF;
    IF v_prior_no >= NEW.revision_no THEN
      RAISE EXCEPTION 'Prior revision must have an earlier revision number' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_prior_predecessor ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_prior_predecessor
  BEFORE INSERT OR UPDATE OF prior_revision_id, revision_no, lesson_id ON app.lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_revision_prior_predecessor();

-- DB-R4: Assessment version item eligibility (ASSESSMENT origin, not omitted, SUBMIT review)
CREATE OR REPLACE FUNCTION app.check_assessment_version_item_eligibility()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_origin TEXT; v_omitted BOOLEAN; v_action TEXT;
BEGIN
  SELECT origin INTO v_origin FROM app.item_identities WHERE id = NEW.item_id;
  IF v_origin IS DISTINCT FROM 'ASSESSMENT' THEN
    RAISE EXCEPTION 'Assessment version item % must have origin ASSESSMENT', NEW.item_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT is_draft_omitted INTO v_omitted FROM app.item_revisions WHERE id = NEW.item_revision_id;
  IF v_omitted = true THEN
    RAISE EXCEPTION 'Draft-omitted item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT action INTO v_action FROM app.revision_reviews WHERE id = NEW.source_submission_id;
  IF v_action IS DISTINCT FROM 'SUBMIT' THEN
    RAISE EXCEPTION 'Source review action must be SUBMIT for assessment version item' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_item_eligibility ON app.assessment_version_items;
CREATE TRIGGER trg_assessment_version_item_eligibility
  BEFORE INSERT OR UPDATE OF item_id, item_revision_id, source_submission_id ON app.assessment_version_items
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_item_eligibility();

-- DB-R5: Unit level framework scope matches course
CREATE OR REPLACE FUNCTION app.check_unit_framework_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_course_fid UUID; v_level_fid UUID;
BEGIN
  SELECT framework_id INTO v_course_fid FROM app.courses WHERE id = NEW.course_id;
  SELECT framework_id INTO v_level_fid FROM app.levels WHERE id = NEW.level_id;
  IF v_course_fid IS DISTINCT FROM v_level_fid THEN
    RAISE EXCEPTION 'Unit level framework mismatch: course framework %, level framework %', v_course_fid, v_level_fid
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unit_framework_scope ON app.units;
CREATE TRIGGER trg_unit_framework_scope
  BEFORE INSERT OR UPDATE OF course_id, level_id ON app.units
  FOR EACH ROW EXECUTE FUNCTION app.check_unit_framework_scope();

-- DB-R5: Course default_start_level framework scope matches course
CREATE OR REPLACE FUNCTION app.check_course_default_level_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_level_fid UUID;
BEGIN
  IF NEW.default_start_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_level_fid FROM app.levels WHERE id = NEW.default_start_level_id;
    IF v_level_fid IS DISTINCT FROM NEW.framework_id THEN
      RAISE EXCEPTION 'Course default start level framework mismatch: course %, level %', NEW.framework_id, v_level_fid
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_default_level_scope ON app.courses;
CREATE TRIGGER trg_course_default_level_scope
  BEFORE INSERT OR UPDATE OF default_start_level_id, framework_id ON app.courses
  FOR EACH ROW EXECUTE FUNCTION app.check_course_default_level_scope();

-- DB-R5: AVAILABLE lesson requires own PUBLISHED active revision
CREATE OR REPLACE FUNCTION app.check_lesson_available_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status TEXT;
BEGIN
  IF NEW.availability = 'AVAILABLE' THEN
    IF NEW.active_revision_id IS NULL THEN
      RAISE EXCEPTION 'AVAILABLE lesson % requires a non-null active_revision_id', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT status INTO v_status FROM app.lesson_revisions WHERE id = NEW.active_revision_id AND lesson_id = NEW.id;
    IF v_status IS NULL OR v_status != 'PUBLISHED' THEN
      RAISE EXCEPTION 'AVAILABLE lesson % active revision must be PUBLISHED (got %)', NEW.id, COALESCE(v_status, 'NOT FOUND')
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_available_revision ON app.lessons;
CREATE TRIGGER trg_lesson_available_revision
  BEFORE INSERT OR UPDATE OF availability, active_revision_id ON app.lessons
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_available_revision();

-- DB-R5: Blueprint levels framework scope matches blueprint
CREATE OR REPLACE FUNCTION app.check_blueprint_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_level_fid UUID;
BEGIN
  IF NEW.target_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_level_fid FROM app.levels WHERE id = NEW.target_level_id;
    IF v_level_fid IS DISTINCT FROM NEW.framework_id THEN
      RAISE EXCEPTION 'Blueprint target level framework mismatch' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.next_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_level_fid FROM app.levels WHERE id = NEW.next_level_id;
    IF v_level_fid IS DISTINCT FROM NEW.framework_id THEN
      RAISE EXCEPTION 'Blueprint next level framework mismatch' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blueprint_scope ON app.assessment_blueprints;
CREATE TRIGGER trg_blueprint_scope
  BEFORE INSERT OR UPDATE OF framework_id, target_level_id, next_level_id ON app.assessment_blueprints
  FOR EACH ROW EXECUTE FUNCTION app.check_blueprint_scope();

-- DB-R5: SRS REINFORCEMENT parent check
CREATE OR REPLACE FUNCTION app.check_srs_reinforcement_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_parent_kind TEXT; v_parent_card_id UUID; v_parent_learner_id UUID; v_parent_session UUID; v_parent_rating TEXT;
BEGIN
  IF NEW.kind = 'REINFORCEMENT' AND NEW.reinforces_operation_id IS NOT NULL THEN
    SELECT kind, card_id, learner_id, session_key, rating
      INTO v_parent_kind, v_parent_card_id, v_parent_learner_id, v_parent_session, v_parent_rating
      FROM app.srs_review_operations WHERE id = NEW.reinforces_operation_id;
    IF v_parent_kind IS DISTINCT FROM 'SCHEDULE' THEN
      RAISE EXCEPTION 'REINFORCEMENT must reinforce a SCHEDULE operation' USING ERRCODE = 'check_violation';
    END IF;
    IF v_parent_card_id IS DISTINCT FROM NEW.card_id OR v_parent_learner_id IS DISTINCT FROM NEW.learner_id THEN
      RAISE EXCEPTION 'REINFORCEMENT must reinforce same card and learner' USING ERRCODE = 'check_violation';
    END IF;
    IF v_parent_session IS DISTINCT FROM NEW.session_key THEN
      RAISE EXCEPTION 'REINFORCEMENT must be in same session as parent SCHEDULE' USING ERRCODE = 'check_violation';
    END IF;
    IF v_parent_rating IS DISTINCT FROM 'FORGOTTEN' THEN
      RAISE EXCEPTION 'REINFORCEMENT parent must have FORGOTTEN rating' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_srs_reinforcement_parent ON app.srs_review_operations;
CREATE TRIGGER trg_srs_reinforcement_parent
  BEFORE INSERT OR UPDATE ON app.srs_review_operations
  FOR EACH ROW EXECUTE FUNCTION app.check_srs_reinforcement_parent();

-- DB-R5: Lesson completion first attempt must be completed
CREATE OR REPLACE FUNCTION app.check_lesson_completion_parent_attempt()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_completed TIMESTAMPTZ;
BEGIN
  SELECT completed_at INTO v_completed FROM app.lesson_attempts WHERE id = NEW.first_attempt_id;
  IF v_completed IS NULL THEN
    RAISE EXCEPTION 'Lesson completion first attempt % must be completed', NEW.first_attempt_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_completion_parent_attempt ON app.lesson_completions;
CREATE TRIGGER trg_lesson_completion_parent_attempt
  BEFORE INSERT OR UPDATE OF first_attempt_id ON app.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_completion_parent_attempt();

-- DB-R5: Assessment result attempt must be finalized
CREATE OR REPLACE FUNCTION app.check_assessment_result_parent_attempt()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_finalized TIMESTAMPTZ;
BEGIN
  SELECT finalized_at INTO v_finalized FROM app.assessment_attempts WHERE id = NEW.attempt_id;
  IF v_finalized IS NULL THEN
    RAISE EXCEPTION 'Assessment result attempt % must be finalized', NEW.attempt_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_result_parent_attempt ON app.assessment_results;
CREATE TRIGGER trg_assessment_result_parent_attempt
  BEFORE INSERT OR UPDATE OF attempt_id ON app.assessment_results
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_result_parent_attempt();

-- DB-R3: Generic append-only / immutable guard functions
CREATE OR REPLACE FUNCTION app.guard_no_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Record is append-only and cannot be deleted' USING ERRCODE = 'check_violation';
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_no_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Record is immutable and cannot be updated' USING ERRCODE = 'check_violation';
END;
$$;

-- DB-R3: Lesson completion immutable facts
CREATE OR REPLACE FUNCTION app.guard_lesson_completion_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.context_id != NEW.context_id OR OLD.lesson_id != NEW.lesson_id OR OLD.first_attempt_id != NEW.first_attempt_id THEN
    RAISE EXCEPTION 'Lesson completion facts are immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_completion_immutable ON app.lesson_completions;
CREATE TRIGGER trg_lesson_completion_immutable
  BEFORE UPDATE ON app.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_completion_immutable();

DROP TRIGGER IF EXISTS trg_lesson_completion_no_delete ON app.lesson_completions;
CREATE TRIGGER trg_lesson_completion_no_delete
  BEFORE DELETE ON app.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Lesson response immutable
DROP TRIGGER IF EXISTS trg_lesson_response_no_update ON app.lesson_responses;
CREATE TRIGGER trg_lesson_response_no_update
  BEFORE UPDATE ON app.lesson_responses
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_lesson_response_no_delete ON app.lesson_responses;
CREATE TRIGGER trg_lesson_response_no_delete
  BEFORE DELETE ON app.lesson_responses
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: SRS review operations immutable
DROP TRIGGER IF EXISTS trg_srs_review_operation_no_update ON app.srs_review_operations;
CREATE TRIGGER trg_srs_review_operation_no_update
  BEFORE UPDATE ON app.srs_review_operations
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_srs_review_operation_no_delete ON app.srs_review_operations;
CREATE TRIGGER trg_srs_review_operation_no_delete
  BEFORE DELETE ON app.srs_review_operations
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Assessment results immutable
CREATE OR REPLACE FUNCTION app.guard_assessment_result_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.attempt_id != NEW.attempt_id OR OLD.raw_points != NEW.raw_points OR OLD.possible_points != NEW.possible_points OR
     OLD.assessment_type != NEW.assessment_type OR OLD.delivery_mode != NEW.delivery_mode OR
     (OLD.passed IS DISTINCT FROM NEW.passed) OR (OLD.recommended_level_id IS DISTINCT FROM NEW.recommended_level_id) THEN
    RAISE EXCEPTION 'Assessment result evidence facts are immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_result_immutable ON app.assessment_results;
CREATE TRIGGER trg_assessment_result_immutable
  BEFORE UPDATE ON app.assessment_results
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_result_immutable();

DROP TRIGGER IF EXISTS trg_assessment_result_no_delete ON app.assessment_results;
CREATE TRIGGER trg_assessment_result_no_delete
  BEFORE DELETE ON app.assessment_results
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Assessment responses immutable
DROP TRIGGER IF EXISTS trg_assessment_response_no_update ON app_private.assessment_responses;
CREATE TRIGGER trg_assessment_response_no_update
  BEFORE UPDATE ON app_private.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_assessment_response_no_delete ON app_private.assessment_responses;
CREATE TRIGGER trg_assessment_response_no_delete
  BEFORE DELETE ON app_private.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Assessment version items immutable
DROP TRIGGER IF EXISTS trg_assessment_version_item_no_update ON app.assessment_version_items;
CREATE TRIGGER trg_assessment_version_item_no_update
  BEFORE UPDATE ON app.assessment_version_items
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_assessment_version_item_no_delete ON app.assessment_version_items;
CREATE TRIGGER trg_assessment_version_item_no_delete
  BEFORE DELETE ON app.assessment_version_items
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Assignment history append-only
DROP TRIGGER IF EXISTS trg_assignment_history_no_update ON app.assignment_history;
CREATE TRIGGER trg_assignment_history_no_update
  BEFORE UPDATE ON app.assignment_history
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_assignment_history_no_delete ON app.assignment_history;
CREATE TRIGGER trg_assignment_history_no_delete
  BEFORE DELETE ON app.assignment_history
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Command receipts immutable
DROP TRIGGER IF EXISTS trg_command_receipt_no_update ON app_private.command_receipts;
CREATE TRIGGER trg_command_receipt_no_update
  BEFORE UPDATE ON app_private.command_receipts
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_command_receipt_no_delete ON app_private.command_receipts;
CREATE TRIGGER trg_command_receipt_no_delete
  BEFORE DELETE ON app_private.command_receipts
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Audit events append-only
DROP TRIGGER IF EXISTS trg_audit_event_no_update ON app_private.audit_events;
CREATE TRIGGER trg_audit_event_no_update
  BEFORE UPDATE ON app_private.audit_events
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_audit_event_no_delete ON app_private.audit_events;
CREATE TRIGGER trg_audit_event_no_delete
  BEFORE DELETE ON app_private.audit_events
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- DB-R3: Frozen submitted lesson revision payload
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_submitted_payload()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status NOT IN ('DRAFT', 'CHANGES_REQUESTED') THEN
    IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content_blocks IS DISTINCT FROM NEW.content_blocks OR
       OLD.topic_ids IS DISTINCT FROM NEW.topic_ids OR OLD.skill_ids IS DISTINCT FROM NEW.skill_ids OR
       OLD.purpose_tags IS DISTINCT FROM NEW.purpose_tags THEN
      RAISE EXCEPTION 'Submitted lesson revision authored payload is frozen (status=%)', OLD.status
        USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.lesson_id != NEW.lesson_id OR OLD.assignment_id != NEW.assignment_id OR
       OLD.creation_assignment_episode_id != NEW.creation_assignment_episode_id OR
       OLD.revision_no != NEW.revision_no OR OLD.created_by != NEW.created_by THEN
      RAISE EXCEPTION 'Lesson revision identity fields are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_submitted_payload ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_submitted_payload
  BEFORE UPDATE ON app.lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_revision_submitted_payload();

-- DB-R3: Frozen item revision payload once frozen_at is set
CREATE OR REPLACE FUNCTION app.guard_item_revision_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL THEN
    IF OLD.prompt_data IS DISTINCT FROM NEW.prompt_data OR OLD.exact_fingerprint != NEW.exact_fingerprint OR
       OLD.type != NEW.type OR OLD.schema_version != NEW.schema_version OR
       OLD.is_draft_omitted IS DISTINCT FROM NEW.is_draft_omitted OR
       OLD.item_id != NEW.item_id OR OLD.revision_no != NEW.revision_no OR
       OLD.authoring_lesson_revision_id != NEW.authoring_lesson_revision_id THEN
      RAISE EXCEPTION 'Frozen item revision payload cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_frozen ON app.item_revisions;
CREATE TRIGGER trg_item_revision_frozen
  BEFORE UPDATE ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_revision_frozen();

-- DB-R3: Frozen grading secret once item revision is frozen
CREATE OR REPLACE FUNCTION app_private.guard_grading_secret_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_frozen TIMESTAMPTZ;
BEGIN
  SELECT frozen_at INTO v_frozen FROM app.item_revisions WHERE id = OLD.item_revision_id;
  IF v_frozen IS NOT NULL THEN
    IF OLD.grading_data IS DISTINCT FROM NEW.grading_data OR OLD.schema_version != NEW.schema_version THEN
      RAISE EXCEPTION 'Grading secret is frozen along with its item revision' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grading_secret_frozen ON app_private.item_grading_secrets;
CREATE TRIGGER trg_grading_secret_frozen
  BEFORE UPDATE ON app_private.item_grading_secrets
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_grading_secret_frozen();

-- DB-R3: Frozen vocabulary concept once frozen_at is set
CREATE OR REPLACE FUNCTION app.guard_vocabulary_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL THEN
    IF OLD.canonical_form != NEW.canonical_form OR OLD.normalized_form != NEW.normalized_form OR
       OLD.sense_key != NEW.sense_key OR OLD.meaning_labels IS DISTINCT FROM NEW.meaning_labels OR
       OLD.language_id != NEW.language_id THEN
      RAISE EXCEPTION 'Frozen vocabulary concept semantic identity cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vocabulary_frozen ON app.vocabulary_concepts;
CREATE TRIGGER trg_vocabulary_frozen
  BEFORE UPDATE ON app.vocabulary_concepts
  FOR EACH ROW EXECUTE FUNCTION app.guard_vocabulary_frozen();

-- DB-R3: Fixed account role
CREATE OR REPLACE FUNCTION app.guard_account_role_fixed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Account role is fixed and cannot be changed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_account_role_fixed ON app.accounts;
CREATE TRIGGER trg_account_role_fixed
  BEFORE UPDATE OF role ON app.accounts
  FOR EACH ROW EXECUTE FUNCTION app.guard_account_role_fixed();

-- DB-R3: Media asset immutable key and retirement
CREATE OR REPLACE FUNCTION app.guard_media_asset_immutable_key()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.object_key != NEW.object_key OR OLD.bucket_id != NEW.bucket_id OR OLD.sha256 != NEW.sha256 THEN
    RAISE EXCEPTION 'Media asset object key/bucket/hash are immutable' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.retired_at IS NOT NULL AND NEW.retired_at IS NULL THEN
    RAISE EXCEPTION 'Retired media asset cannot be unretired' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_media_asset_immutable_key ON app.media_assets;
CREATE TRIGGER trg_media_asset_immutable_key
  BEFORE UPDATE ON app.media_assets
  FOR EACH ROW EXECUTE FUNCTION app.guard_media_asset_immutable_key();

-- -----------------------------------------------------------------------------
-- 6. Baseline Public-Access Revocations (DB-06 / DB-R9 / §4)
-- -----------------------------------------------------------------------------
REVOKE ALL ON SCHEMA app FROM PUBLIC;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE ALL ON FUNCTIONS FROM PUBLIC;

-- DB-R9: Explicit PUBLIC EXECUTE revocation on existing functions
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA app FROM anon;
    REVOKE ALL ON SCHEMA app_private FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA app FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM anon;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app FROM authenticated;
    REVOKE ALL ON SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM authenticated;
  END IF;
END $$;
