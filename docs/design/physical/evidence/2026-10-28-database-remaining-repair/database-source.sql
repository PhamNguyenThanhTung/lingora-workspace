-- =============================================================================
-- Lingora Canonical Product Database — Complete Ordered Source SQL Bundle
-- Target: Canonical 34 Product Tables (29 app + 5 app_private)
-- Package: WP-DB-REMAIN-01 (Stage A Local Source Deliverable)
-- Date: 2026-10-28 (Updated: Correction Round)
--
-- PREREQUISITES & REPLAY INSTRUCTIONS:
-- 1. PostgreSQL 17.x server instance.
-- 2. Supabase Auth provider schema 'auth' with 'auth.users(id uuid PK)'.
-- 3. Schema 'app' and 'app_private' created with migration creator role.
-- 4. Associated Prisma schema: lingora-admin/prisma/product/schema.prisma
-- 5. Associated Seed script: lingora-admin/prisma/product/seed.mjs
-- 6. Migration Runner Prerequisite:
--    Standard deployment executes migrations in exact chronological order
--    managed via Prisma Migrate ('npm run db:product:migrate -w lingora-admin')
--    or compatible migration runner maintaining the 'app._prisma_migrations' tracking table.
--    This bundle concatenates all 5 migrations for offline review, standalone reference,
--    and schema-only replay proof inspection.
--
-- MIGRATION INVENTORY & SHA-256 CHECKSUMS:
--   * 20261027000000_product_baseline (69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862)
--   * 20261027010000_product_finalize (b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16)
--   * 20261027020000_product_correction (3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029)
--   * 20261027030000_product_remediation (5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6)
--   * 20261028000000_product_remaining_repair (c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75)
--
-- NOTICE: This bundle is assembled directly from local product migration source.
-- It contains no credentials, secrets, or fake live-state assertions.
-- =============================================================================

-- =============================================================================
-- START MIGRATION: 20261027000000_product_baseline
-- Path: lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql
-- SHA-256: 69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862
-- =============================================================================

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


-- =============================================================================
-- START MIGRATION: 20261027010000_product_finalize
-- Path: lingora-admin/prisma/product/migrations/20261027010000_product_finalize/migration.sql
-- SHA-256: b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16
-- =============================================================================

-- =============================================================================
-- Product Database Forward Finalization Migration
-- Migration: 20261027010000_product_finalize
-- Authority: plans/2026-10-27-product-database-finalize-spec.md §1-5
-- Closes: DB-C1, DB-R3, DB-R4, DB-R5, DB-R6, DB-R9
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fix DB-C1: Drop invented assessment_type purpose enum
-- -----------------------------------------------------------------------------
ALTER TABLE "app"."assessment_results"
  DROP CONSTRAINT IF EXISTS "assessment_results_assessment_type_check";

ALTER TABLE "app"."assessment_results"
  ADD CONSTRAINT "assessment_results_assessment_type_nonblank_check"
  CHECK (length(trim("assessment_type")) > 0);

-- -----------------------------------------------------------------------------
-- 2. Fix DB-R6: Row-local checks, null-safe start shape, bounds, nonblank
-- -----------------------------------------------------------------------------

-- Learning context start shape: null-safe CASE preventing UNKNOWN acceptance
ALTER TABLE "app"."learning_contexts"
  DROP CONSTRAINT IF EXISTS "learning_contexts_start_shape_check";

ALTER TABLE "app"."learning_contexts"
  ADD CONSTRAINT "learning_contexts_start_shape_check" CHECK (
    CASE
      WHEN "start_source" IS NULL THEN
        "selected_start_level_id" IS NULL AND
        "start_result_id" IS NULL AND
        "self_report" IS NULL AND
        "working_level_id" IS NULL
      WHEN "start_source" = 'DEFAULT' THEN
        "selected_start_level_id" IS NOT NULL AND
        "start_result_id" IS NULL AND
        "self_report" IS NULL
      WHEN "start_source" = 'SELF_REPORT' THEN
        "selected_start_level_id" IS NOT NULL AND
        "start_result_id" IS NULL AND
        "self_report" IS NOT NULL AND
        jsonb_typeof("self_report") = 'object'
      WHEN "start_source" = 'PLACEMENT' THEN
        "selected_start_level_id" IS NOT NULL AND
        "start_result_id" IS NOT NULL AND
        "self_report" IS NULL
      ELSE false
    END
  );

-- Lesson attempt completion bounds: exact response count and half-unit bounds
ALTER TABLE "app"."lesson_attempts"
  DROP CONSTRAINT IF EXISTS "lesson_attempts_completion_bounds_check";

ALTER TABLE "app"."lesson_attempts"
  ADD CONSTRAINT "lesson_attempts_completion_bounds_check" CHECK (
    "completed_at" IS NULL OR (
      "k_first_wrong" IS NOT NULL AND
      "k_first_wrong" >= 0 AND
      "k_first_wrong" <= "n_core" AND
      "response_count" IS NOT NULL AND
      "response_count" = ("n_core"::bigint + "k_first_wrong"::bigint) AND
      "contribution_units" IS NOT NULL AND
      "contribution_units" >= (2 * ("n_core"::bigint - "k_first_wrong"::bigint)) AND
      "contribution_units" <= (2 * "n_core"::bigint - "k_first_wrong"::bigint) AND
      length(trim("timezone_at_completion")) > 0
    )
  );

-- Revision reviews lesson review shape: blueprint_generation must be NULL
ALTER TABLE "app"."revision_reviews"
  DROP CONSTRAINT IF EXISTS "revision_reviews_lesson_review_shape_check";

ALTER TABLE "app"."revision_reviews"
  ADD CONSTRAINT "revision_reviews_lesson_review_shape_check" CHECK (
    "lesson_revision_id" IS NULL OR (
      "blueprint_generation" IS NULL AND
      "assignment_episode_id" IS NOT NULL AND
      "assignment_generation" IS NOT NULL AND "assignment_generation" > 0 AND
      "assignment_scope_snapshot" IS NOT NULL AND jsonb_typeof("assignment_scope_snapshot") = 'object'
    )
  );

-- Required nonblank checks
ALTER TABLE "app"."accounts"
  ADD CONSTRAINT "accounts_timezone_nonblank_check"
  CHECK (length(trim("timezone")) > 0);

ALTER TABLE "app"."media_assets"
  ADD CONSTRAINT "media_assets_bucket_id_nonblank_check"
  CHECK (length(trim("bucket_id")) > 0);

-- SRS reinforcement parent trigger: preserved schedule comparison
CREATE OR REPLACE FUNCTION app.check_srs_reinforcement_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_parent_kind TEXT;
  v_parent_card_id UUID;
  v_parent_learner_id UUID;
  v_parent_session UUID;
  v_parent_rating TEXT;
  v_parent_prior_stage SMALLINT;
  v_parent_prior_due TIMESTAMPTZ;
  v_parent_next_stage SMALLINT;
  v_parent_next_due TIMESTAMPTZ;
BEGIN
  IF NEW.kind = 'REINFORCEMENT' AND NEW.reinforces_operation_id IS NOT NULL THEN
    SELECT kind, card_id, learner_id, session_key, rating,
           prior_stage, prior_due_at, next_stage, next_due_at
      INTO v_parent_kind, v_parent_card_id, v_parent_learner_id, v_parent_session, v_parent_rating,
           v_parent_prior_stage, v_parent_prior_due, v_parent_next_stage, v_parent_next_due
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
    IF v_parent_prior_stage IS DISTINCT FROM NEW.prior_stage OR
       v_parent_prior_due IS DISTINCT FROM NEW.prior_due_at OR
       v_parent_next_stage IS DISTINCT FROM NEW.next_stage OR
       v_parent_next_due IS DISTINCT FROM NEW.next_due_at THEN
      RAISE EXCEPTION 'REINFORCEMENT schedule fields must match parent SCHEDULE' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Fix DB-R3: Freeze & monotonic protections
-- -----------------------------------------------------------------------------

-- Lesson revision monotonic submission & authored payload freeze
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_submitted_payload()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_submit BOOLEAN;
BEGIN
  -- Monotonic submitted_at: once set, cannot be cleared or changed
  IF OLD.submitted_at IS NOT NULL AND (NEW.submitted_at IS NULL OR NEW.submitted_at != OLD.submitted_at) THEN
    RAISE EXCEPTION 'Lesson revision submitted_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic approved_at / published_at
  IF OLD.approved_at IS NOT NULL AND (NEW.approved_at IS NULL OR NEW.approved_at != OLD.approved_at) THEN
    RAISE EXCEPTION 'Lesson revision approved_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.published_at IS NOT NULL AND (NEW.published_at IS NULL OR NEW.published_at != OLD.published_at) THEN
    RAISE EXCEPTION 'Lesson revision published_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Check if revision was ever submitted
  v_has_submit := (OLD.submitted_at IS NOT NULL) OR EXISTS (
    SELECT 1 FROM app.revision_reviews
     WHERE lesson_revision_id = OLD.id AND action = 'SUBMIT'
  );

  IF v_has_submit THEN
    -- Authored payload and snapshots are frozen even if status transitions to CHANGES_REQUESTED
    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.content_blocks IS DISTINCT FROM NEW.content_blocks OR
       OLD.topic_ids IS DISTINCT FROM NEW.topic_ids OR
       OLD.skill_ids IS DISTINCT FROM NEW.skill_ids OR
       OLD.purpose_tags IS DISTINCT FROM NEW.purpose_tags OR
       OLD.coverage_catalog_generation IS DISTINCT FROM NEW.coverage_catalog_generation OR
       OLD.coverage_snapshot IS DISTINCT FROM NEW.coverage_snapshot OR
       OLD.submitted_assignment_generation IS DISTINCT FROM NEW.submitted_assignment_generation OR
       OLD.assignment_scope_snapshot IS DISTINCT FROM NEW.assignment_scope_snapshot THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision authored payload is frozen' USING ERRCODE = 'check_violation';
    END IF;

    -- Identity and provenance are immutable
    IF OLD.lesson_id != NEW.lesson_id OR
       OLD.assignment_id != NEW.assignment_id OR
       OLD.creation_assignment_episode_id != NEW.creation_assignment_episode_id OR
       OLD.revision_no != NEW.revision_no OR
       OLD.created_by != NEW.created_by OR
       (OLD.submitted_by IS NOT NULL AND NEW.submitted_by != OLD.submitted_by) THEN
      RAISE EXCEPTION 'Lesson revision identity and provenance are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    -- Even before submission, identity cannot change
    IF OLD.lesson_id != NEW.lesson_id OR
       OLD.assignment_id != NEW.assignment_id OR
       OLD.creation_assignment_episode_id != NEW.creation_assignment_episode_id OR
       OLD.revision_no != NEW.revision_no OR
       OLD.created_by != NEW.created_by THEN
      RAISE EXCEPTION 'Lesson revision identity fields are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Submitted lesson revisions cannot be deleted
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.submitted_at IS NOT NULL OR OLD.status != 'DRAFT' OR EXISTS (
    SELECT 1 FROM app.revision_reviews WHERE lesson_revision_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Submitted or reviewed lesson revision cannot be deleted' USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_delete ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_delete
  BEFORE DELETE ON app.lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_revision_delete();

-- Lesson exercises membership guard: submitted/frozen parent blocks insert/update/delete
CREATE OR REPLACE FUNCTION app.guard_lesson_exercise_parent_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_rev_id UUID;
  v_submitted TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.lesson_revision_id;
  ELSE
    v_rev_id := NEW.lesson_revision_id;
  END IF;

  SELECT submitted_at, status INTO v_submitted, v_status
    FROM app.lesson_revisions WHERE id = v_rev_id;

  IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
    RAISE EXCEPTION 'Cannot modify exercises of submitted or non-draft lesson revision %', v_rev_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.lesson_revision_id != NEW.lesson_revision_id THEN
    SELECT submitted_at, status INTO v_submitted, v_status
      FROM app.lesson_revisions WHERE id = OLD.lesson_revision_id;
    IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
      RAISE EXCEPTION 'Cannot reparent exercise from submitted or non-draft lesson revision %', OLD.lesson_revision_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_exercise_parent_frozen ON app.lesson_exercises;
CREATE TRIGGER trg_lesson_exercise_parent_frozen
  BEFORE INSERT OR UPDATE OR DELETE ON app.lesson_exercises
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_exercise_parent_frozen();

-- Lesson vocabulary links membership guard
CREATE OR REPLACE FUNCTION app.guard_lesson_vocabulary_parent_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_rev_id UUID;
  v_submitted TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.lesson_revision_id;
  ELSE
    v_rev_id := NEW.lesson_revision_id;
  END IF;

  SELECT submitted_at, status INTO v_submitted, v_status
    FROM app.lesson_revisions WHERE id = v_rev_id;

  IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
    RAISE EXCEPTION 'Cannot modify vocabulary links of submitted or non-draft lesson revision %', v_rev_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.lesson_revision_id != NEW.lesson_revision_id THEN
    SELECT submitted_at, status INTO v_submitted, v_status
      FROM app.lesson_revisions WHERE id = OLD.lesson_revision_id;
    IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
      RAISE EXCEPTION 'Cannot reparent vocabulary link from submitted or non-draft lesson revision %', OLD.lesson_revision_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_vocabulary_parent_frozen ON app.lesson_vocabulary_links;
CREATE TRIGGER trg_lesson_vocabulary_parent_frozen
  BEFORE INSERT OR UPDATE OR DELETE ON app.lesson_vocabulary_links
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_vocabulary_parent_frozen();

-- Media bindings membership guard
CREATE OR REPLACE FUNCTION app.guard_media_binding_parent_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_rev_id UUID;
  v_item_rev_id UUID;
  v_submitted TIMESTAMPTZ;
  v_status TEXT;
  v_frozen TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.lesson_revision_id;
    v_item_rev_id := OLD.item_revision_id;
  ELSE
    v_rev_id := NEW.lesson_revision_id;
    v_item_rev_id := NEW.item_revision_id;
  END IF;

  IF v_rev_id IS NOT NULL THEN
    SELECT submitted_at, status INTO v_submitted, v_status
      FROM app.lesson_revisions WHERE id = v_rev_id;
    IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
      RAISE EXCEPTION 'Cannot modify media bindings of submitted or non-draft lesson revision %', v_rev_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_item_rev_id IS NOT NULL THEN
    SELECT frozen_at INTO v_frozen
      FROM app.item_revisions WHERE id = v_item_rev_id;
    IF v_frozen IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot modify media bindings of frozen item revision %', v_item_rev_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.lesson_revision_id IS NOT NULL AND OLD.lesson_revision_id IS DISTINCT FROM NEW.lesson_revision_id THEN
      SELECT submitted_at, status INTO v_submitted, v_status
        FROM app.lesson_revisions WHERE id = OLD.lesson_revision_id;
      IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
        RAISE EXCEPTION 'Cannot reparent media binding from submitted or non-draft lesson revision %', OLD.lesson_revision_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF OLD.item_revision_id IS NOT NULL AND OLD.item_revision_id IS DISTINCT FROM NEW.item_revision_id THEN
      SELECT frozen_at INTO v_frozen
        FROM app.item_revisions WHERE id = OLD.item_revision_id;
      IF v_frozen IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot reparent media binding from frozen item revision %', OLD.item_revision_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_media_binding_parent_frozen ON app.media_bindings;
CREATE TRIGGER trg_media_binding_parent_frozen
  BEFORE INSERT OR UPDATE OR DELETE ON app.media_bindings
  FOR EACH ROW EXECUTE FUNCTION app.guard_media_binding_parent_frozen();

-- Item revision monotonic frozen_at and payload immutability
CREATE OR REPLACE FUNCTION app.guard_item_revision_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Monotonic frozen_at: once set, cannot be cleared or modified
  IF OLD.frozen_at IS NOT NULL AND (NEW.frozen_at IS NULL OR NEW.frozen_at != OLD.frozen_at) THEN
    RAISE EXCEPTION 'Item revision frozen_at marker is monotonic and cannot be cleared or changed'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.frozen_at IS NOT NULL THEN
    IF OLD.prompt_data IS DISTINCT FROM NEW.prompt_data OR
       OLD.exact_fingerprint != NEW.exact_fingerprint OR
       OLD.type != NEW.type OR
       OLD.schema_version != NEW.schema_version OR
       OLD.is_draft_omitted IS DISTINCT FROM NEW.is_draft_omitted OR
       OLD.item_id != NEW.item_id OR
       OLD.revision_no != NEW.revision_no OR
       OLD.authoring_lesson_revision_id != NEW.authoring_lesson_revision_id OR
       OLD.created_by != NEW.created_by OR
       OLD.creation_assignment_episode_id != NEW.creation_assignment_episode_id OR
       OLD.practice_skill_ids != NEW.practice_skill_ids OR
       OLD.practice_coverage_snapshot IS DISTINCT FROM NEW.practice_coverage_snapshot THEN
      RAISE EXCEPTION 'Frozen item revision payload cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    -- Even before freeze, identity cannot change
    IF OLD.item_id != NEW.item_id OR
       OLD.revision_no != NEW.revision_no OR
       OLD.authoring_lesson_revision_id != NEW.authoring_lesson_revision_id OR
       OLD.created_by != NEW.created_by OR
       OLD.creation_assignment_episode_id != NEW.creation_assignment_episode_id THEN
      RAISE EXCEPTION 'Item revision identity fields are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_item_revision_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL THEN
    RAISE EXCEPTION 'Frozen item revision cannot be deleted' USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_delete ON app.item_revisions;
CREATE TRIGGER trg_item_revision_delete
  BEFORE DELETE ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_revision_delete();

-- Vocabulary concept monotonic frozen_at and identity immutability
CREATE OR REPLACE FUNCTION app.guard_vocabulary_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Monotonic frozen_at: once set, cannot be cleared or modified
  IF OLD.frozen_at IS NOT NULL AND (NEW.frozen_at IS NULL OR NEW.frozen_at != OLD.frozen_at) THEN
    RAISE EXCEPTION 'Vocabulary concept frozen_at marker is monotonic and cannot be cleared or changed'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.frozen_at IS NOT NULL THEN
    IF OLD.canonical_form != NEW.canonical_form OR
       OLD.normalized_form != NEW.normalized_form OR
       OLD.sense_key != NEW.sense_key OR
       OLD.meaning_labels IS DISTINCT FROM NEW.meaning_labels OR
       OLD.language_id != NEW.language_id OR
       OLD.created_by != NEW.created_by THEN
      RAISE EXCEPTION 'Frozen vocabulary concept semantic identity cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_vocabulary_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL THEN
    RAISE EXCEPTION 'Frozen vocabulary concept cannot be deleted' USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_vocabulary_delete ON app.vocabulary_concepts;
CREATE TRIGGER trg_vocabulary_delete
  BEFORE DELETE ON app.vocabulary_concepts
  FOR EACH ROW EXECUTE FUNCTION app.guard_vocabulary_delete();

-- Item grading secrets: freeze feedback_data, item_revision_id, and deny delete
CREATE OR REPLACE FUNCTION app_private.guard_grading_secret_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_frozen TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT frozen_at INTO v_frozen FROM app.item_revisions WHERE id = OLD.item_revision_id;
    IF v_frozen IS NOT NULL THEN
      RAISE EXCEPTION 'Grading secret for frozen item revision cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  SELECT frozen_at INTO v_frozen FROM app.item_revisions WHERE id = OLD.item_revision_id;
  IF v_frozen IS NOT NULL THEN
    IF OLD.item_revision_id != NEW.item_revision_id OR
       OLD.grading_data IS DISTINCT FROM NEW.grading_data OR
       OLD.feedback_data IS DISTINCT FROM NEW.feedback_data OR
       OLD.schema_version != NEW.schema_version THEN
      RAISE EXCEPTION 'Grading secret is frozen along with its item revision' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.item_revision_id != NEW.item_revision_id THEN
      RAISE EXCEPTION 'Grading secret item_revision_id cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grading_secret_frozen ON app_private.item_grading_secrets;
CREATE TRIGGER trg_grading_secret_frozen
  BEFORE UPDATE ON app_private.item_grading_secrets
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_grading_secret_frozen();

DROP TRIGGER IF EXISTS trg_grading_secret_no_delete ON app_private.item_grading_secrets;
CREATE TRIGGER trg_grading_secret_no_delete
  BEFORE DELETE ON app_private.item_grading_secrets
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_grading_secret_frozen();

-- Item identities metadata protection
CREATE OR REPLACE FUNCTION app.guard_item_identity_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.origin != NEW.origin THEN
    IF EXISTS (SELECT 1 FROM app.assessment_version_items WHERE item_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_exercises WHERE item_id = OLD.id) THEN
      RAISE EXCEPTION 'Item identity origin cannot be changed when referenced by exercises or assessment items'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF OLD.created_by != NEW.created_by THEN
    RAISE EXCEPTION 'Item identity created_by is immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_identity_update ON app.item_identities;
CREATE TRIGGER trg_item_identity_update
  BEFORE UPDATE ON app.item_identities
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_identity_update();

-- Revision reviews append-only (no update, no delete)
DROP TRIGGER IF EXISTS trg_revision_review_no_update ON app.revision_reviews;
CREATE TRIGGER trg_revision_review_no_update
  BEFORE UPDATE ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

DROP TRIGGER IF EXISTS trg_revision_review_no_delete ON app.revision_reviews;
CREATE TRIGGER trg_revision_review_no_delete
  BEFORE DELETE ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_delete();

-- Assessment versions assembly pins immutable
CREATE OR REPLACE FUNCTION app.guard_assessment_version_assembly_pins()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.blueprint_id != NEW.blueprint_id OR
     OLD.version_no != NEW.version_no OR
     OLD.blueprint_generation != NEW.blueprint_generation OR
     OLD.blueprint_snapshot IS DISTINCT FROM NEW.blueprint_snapshot OR
     OLD.assembled_at != NEW.assembled_at OR
     OLD.assembly_input_hash != NEW.assembly_input_hash THEN
    RAISE EXCEPTION 'Assessment version composition pins and blueprint snapshot are frozen from assembly'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_assembly_pins ON app.assessment_versions;
CREATE TRIGGER trg_assessment_version_assembly_pins
  BEFORE UPDATE ON app.assessment_versions
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_version_assembly_pins();

-- Lesson completions fact immutability
DROP TRIGGER IF EXISTS trg_lesson_completion_immutable ON app.lesson_completions;
CREATE TRIGGER trg_lesson_completion_immutable
  BEFORE UPDATE ON app.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION app.guard_no_update();

-- Assessment results evidence facts immutability & monotonic progression_applied_at
CREATE OR REPLACE FUNCTION app.guard_assessment_result_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.attempt_id != NEW.attempt_id OR
     OLD.raw_points != NEW.raw_points OR
     OLD.possible_points != NEW.possible_points OR
     OLD.assessment_type != NEW.assessment_type OR
     OLD.delivery_mode != NEW.delivery_mode OR
     OLD.completed_at != NEW.completed_at OR
     (OLD.passed IS DISTINCT FROM NEW.passed) OR
     (OLD.recommended_level_id IS DISTINCT FROM NEW.recommended_level_id) THEN
    RAISE EXCEPTION 'Assessment result evidence facts are immutable' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic progression_applied_at: once set, cannot be changed or cleared
  IF OLD.progression_applied_at IS NOT NULL AND
     (NEW.progression_applied_at IS NULL OR NEW.progression_applied_at != OLD.progression_applied_at) THEN
    RAISE EXCEPTION 'Assessment result progression_applied_at cannot be cleared or modified'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Lesson attempts completed fact immutability and delete guard
CREATE OR REPLACE FUNCTION app.guard_lesson_attempt_completed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Completed lesson attempt cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.completed_at IS NOT NULL THEN
    IF NEW.completed_at IS NULL OR NEW.completed_at != OLD.completed_at OR
       OLD.context_id != NEW.context_id OR
       OLD.lesson_id != NEW.lesson_id OR
       OLD.lesson_revision_id != NEW.lesson_revision_id OR
       OLD.started_at != NEW.started_at OR
       OLD.n_core != NEW.n_core OR
       OLD.k_first_wrong != NEW.k_first_wrong OR
       OLD.contribution_units != NEW.contribution_units OR
       OLD.response_count != NEW.response_count OR
       OLD.completion_operation_key != NEW.completion_operation_key OR
       OLD.qualifying_local_date != NEW.qualifying_local_date OR
       OLD.timezone_at_completion != NEW.timezone_at_completion THEN
      RAISE EXCEPTION 'Completed lesson attempt facts are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.context_id != NEW.context_id OR
       OLD.lesson_id != NEW.lesson_id OR
       OLD.lesson_revision_id != NEW.lesson_revision_id OR
       OLD.started_at != NEW.started_at THEN
      RAISE EXCEPTION 'Lesson attempt context and lesson references are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_attempt_completed ON app.lesson_attempts;
CREATE TRIGGER trg_lesson_attempt_completed
  BEFORE UPDATE ON app.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_attempt_completed();

DROP TRIGGER IF EXISTS trg_lesson_attempt_no_delete ON app.lesson_attempts;
CREATE TRIGGER trg_lesson_attempt_no_delete
  BEFORE DELETE ON app.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_attempt_completed();

-- Assessment attempts finalized fact immutability and delete guard
CREATE OR REPLACE FUNCTION app.guard_assessment_attempt_finalized()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.finalized_at IS NOT NULL THEN
      RAISE EXCEPTION 'Finalized assessment attempt cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.finalized_at IS NOT NULL THEN
    IF NEW.finalized_at IS NULL OR NEW.finalized_at != OLD.finalized_at OR
       OLD.context_id != NEW.context_id OR
       OLD.assessment_version_id != NEW.assessment_version_id OR
       OLD.started_at != NEW.started_at OR
       OLD.context_row_version_at_start != NEW.context_row_version_at_start OR
       OLD.curriculum_generation_at_start != NEW.curriculum_generation_at_start OR
       OLD.submission_key != NEW.submission_key OR
       OLD.submission_hash != NEW.submission_hash THEN
      RAISE EXCEPTION 'Finalized assessment attempt facts are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.context_id != NEW.context_id OR
       OLD.assessment_version_id != NEW.assessment_version_id OR
       OLD.started_at != NEW.started_at THEN
      RAISE EXCEPTION 'Assessment attempt context and version references are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_attempt_finalized ON app.assessment_attempts;
CREATE TRIGGER trg_assessment_attempt_finalized
  BEFORE UPDATE ON app.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_attempt_finalized();

DROP TRIGGER IF EXISTS trg_assessment_attempt_no_delete ON app.assessment_attempts;
CREATE TRIGGER trg_assessment_attempt_no_delete
  BEFORE DELETE ON app.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_attempt_finalized();

-- Media assets retired tombstone delete guard
CREATE OR REPLACE FUNCTION app.guard_media_asset_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.retired_at IS NOT NULL THEN
    RAISE EXCEPTION 'Retired media asset tombstone cannot be deleted' USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_media_asset_delete ON app.media_assets;
CREATE TRIGGER trg_media_asset_delete
  BEFORE DELETE ON app.media_assets
  FOR EACH ROW EXECUTE FUNCTION app.guard_media_asset_delete();

-- Referenced scope identities guards
CREATE OR REPLACE FUNCTION app.guard_framework_level_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.framework_id != NEW.framework_id THEN
    IF EXISTS (SELECT 1 FROM app.courses WHERE default_start_level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.units WHERE level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.learning_contexts WHERE selected_start_level_id = OLD.id OR working_level_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change framework_id of level referenced by courses, units, or contexts'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_framework_level_scope ON app.levels;
CREATE TRIGGER trg_framework_level_scope
  BEFORE UPDATE OF framework_id ON app.levels
  FOR EACH ROW EXECUTE FUNCTION app.guard_framework_level_scope();

CREATE OR REPLACE FUNCTION app.guard_unit_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.course_id != NEW.course_id OR OLD.level_id != NEW.level_id THEN
    IF EXISTS (SELECT 1 FROM app.lessons WHERE unit_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change course_id or level_id of unit with lessons'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unit_scope ON app.units;
CREATE TRIGGER trg_unit_scope
  BEFORE UPDATE OF course_id, level_id ON app.units
  FOR EACH ROW EXECUTE FUNCTION app.guard_unit_scope();

CREATE OR REPLACE FUNCTION app.guard_lesson_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.unit_id != NEW.unit_id THEN
    IF EXISTS (SELECT 1 FROM app.lesson_attempts WHERE lesson_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_completions WHERE lesson_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_revisions WHERE lesson_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change unit_id of lesson with revisions, attempts or completions'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_scope ON app.lessons;
CREATE TRIGGER trg_lesson_scope
  BEFORE UPDATE OF unit_id ON app.lessons
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_scope();

CREATE OR REPLACE FUNCTION app.guard_course_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.language_id != NEW.language_id OR OLD.framework_id != NEW.framework_id THEN
    IF EXISTS (SELECT 1 FROM app.units WHERE course_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.learning_contexts WHERE course_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.assessment_blueprints WHERE course_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change language_id or framework_id of course referenced by units, contexts or blueprints'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_scope ON app.courses;
CREATE TRIGGER trg_course_scope
  BEFORE UPDATE OF language_id, framework_id ON app.courses
  FOR EACH ROW EXECUTE FUNCTION app.guard_course_scope();

-- -----------------------------------------------------------------------------
-- 4. Fix DB-R4: Provenance & Source Eligibility
-- -----------------------------------------------------------------------------

-- Lesson revision creation episode and creator provenance
CREATE OR REPLACE FUNCTION app.check_lesson_revision_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_assign_id UUID;
  v_teacher_id UUID;
  v_prior_rev_no INTEGER;
  v_prior_lesson_id UUID;
BEGIN
  -- Episode must belong to assignment and created_by match that episode's teacher
  SELECT assignment_id, assigned_teacher_id
    INTO v_assign_id, v_teacher_id
    FROM app.assignment_history WHERE id = NEW.creation_assignment_episode_id;

  IF v_assign_id IS DISTINCT FROM NEW.assignment_id THEN
    RAISE EXCEPTION 'Creation assignment episode does not belong to assignment %', NEW.assignment_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_teacher_id IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Lesson revision created_by must match assigned teacher of creation episode'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Same-lesson earlier predecessor rule
  IF NEW.prior_revision_id IS NOT NULL THEN
    SELECT lesson_id, revision_no
      INTO v_prior_lesson_id, v_prior_rev_no
      FROM app.lesson_revisions WHERE id = NEW.prior_revision_id;

    IF v_prior_lesson_id IS DISTINCT FROM NEW.lesson_id THEN
      RAISE EXCEPTION 'Prior revision must belong to same lesson %', NEW.lesson_id
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_prior_rev_no >= NEW.revision_no THEN
      RAISE EXCEPTION 'Prior revision number % must be strictly less than revision number %', v_prior_rev_no, NEW.revision_no
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_provenance ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_provenance
  BEFORE INSERT OR UPDATE OF creation_assignment_episode_id, created_by, assignment_id, prior_revision_id, revision_no ON app.lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_revision_provenance();

-- Item revision creation episode and creator provenance
CREATE OR REPLACE FUNCTION app.check_item_revision_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_teacher_id UUID;
BEGIN
  SELECT assignment_id INTO v_lesson_assign_id
    FROM app.lesson_revisions WHERE id = NEW.authoring_lesson_revision_id;

  SELECT assignment_id, assigned_teacher_id
    INTO v_ep_assign_id, v_teacher_id
    FROM app.assignment_history WHERE id = NEW.creation_assignment_episode_id;

  IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
    RAISE EXCEPTION 'Item creation episode assignment % does not match authoring lesson assignment %',
      v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
  END IF;

  IF v_teacher_id IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Item revision created_by must match assigned teacher of creation episode'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_provenance ON app.item_revisions;
CREATE TRIGGER trg_item_revision_provenance
  BEFORE INSERT OR UPDATE OF creation_assignment_episode_id, created_by, authoring_lesson_revision_id ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.check_item_revision_provenance();

-- Revision reviews provenance
CREATE OR REPLACE FUNCTION app.check_revision_review_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_ep_gen BIGINT;
BEGIN
  IF NEW.lesson_revision_id IS NOT NULL THEN
    SELECT assignment_id INTO v_lesson_assign_id
      FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;

    SELECT assignment_id, generation
      INTO v_ep_assign_id, v_ep_gen
      FROM app.assignment_history WHERE id = NEW.assignment_episode_id;

    IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
      RAISE EXCEPTION 'Review episode assignment % does not match lesson assignment %',
        v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
    END IF;

    IF v_ep_gen IS DISTINCT FROM NEW.assignment_generation THEN
      RAISE EXCEPTION 'Review assignment_generation % does not match episode generation %',
        NEW.assignment_generation, v_ep_gen USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revision_review_provenance ON app.revision_reviews;
CREATE TRIGGER trg_revision_review_provenance
  BEFORE INSERT ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.check_revision_review_provenance();

-- Assessment version items eligibility: frozen, nonomitted, SUBMIT action, scope matching
CREATE OR REPLACE FUNCTION app.check_assessment_version_item_eligibility()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_origin TEXT;
  v_omitted BOOLEAN;
  v_frozen TIMESTAMPTZ;
  v_action TEXT;
  v_review_lesson_rev UUID;
  v_review_episode UUID;
  v_lesson_submitted TIMESTAMPTZ;
  v_bp_course UUID;
  v_bp_lang UUID;
  v_bp_fw UUID;
  v_lesson_course UUID;
  v_lesson_lang UUID;
  v_lesson_fw UUID;
BEGIN
  SELECT origin INTO v_origin FROM app.item_identities WHERE id = NEW.item_id;
  IF v_origin IS DISTINCT FROM 'ASSESSMENT' THEN
    RAISE EXCEPTION 'Assessment version item % must have origin ASSESSMENT', NEW.item_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT is_draft_omitted, frozen_at INTO v_omitted, v_frozen
    FROM app.item_revisions WHERE id = NEW.item_revision_id;
  IF v_omitted = true THEN
    RAISE EXCEPTION 'Draft-omitted item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;
  IF v_frozen IS NULL THEN
    RAISE EXCEPTION 'Unfrozen item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT action, lesson_revision_id, assignment_episode_id
    INTO v_action, v_review_lesson_rev, v_review_episode
    FROM app.revision_reviews WHERE id = NEW.source_submission_id;
  IF v_action IS DISTINCT FROM 'SUBMIT' THEN
    RAISE EXCEPTION 'Source review action must be SUBMIT for assessment version item' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_lesson_rev IS DISTINCT FROM NEW.source_lesson_revision_id THEN
    RAISE EXCEPTION 'Source review lesson revision does not match source_lesson_revision_id' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_episode IS DISTINCT FROM NEW.contribution_assignment_episode_id THEN
    RAISE EXCEPTION 'Source review episode does not match contribution_assignment_episode_id' USING ERRCODE = 'check_violation';
  END IF;

  SELECT submitted_at INTO v_lesson_submitted
    FROM app.lesson_revisions WHERE id = NEW.source_lesson_revision_id;
  IF v_lesson_submitted IS NULL THEN
    RAISE EXCEPTION 'Source lesson revision % must be submitted', NEW.source_lesson_revision_id USING ERRCODE = 'check_violation';
  END IF;

  -- Scope matching: assessment blueprint course/lang/framework must match lesson revision's course/lang/framework
  SELECT b.course_id, b.language_id, b.framework_id
    INTO v_bp_course, v_bp_lang, v_bp_fw
    FROM app.assessment_versions av
    JOIN app.assessment_blueprints b ON b.id = av.blueprint_id
   WHERE av.id = NEW.assessment_version_id;

  SELECT u.course_id, c.language_id, c.framework_id
    INTO v_lesson_course, v_lesson_lang, v_lesson_fw
    FROM app.lesson_revisions lr
    JOIN app.lessons l ON l.id = lr.lesson_id
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
   WHERE lr.id = NEW.source_lesson_revision_id;

  IF v_bp_course IS DISTINCT FROM v_lesson_course OR
     v_bp_lang IS DISTINCT FROM v_lesson_lang OR
     v_bp_fw IS DISTINCT FROM v_lesson_fw THEN
    RAISE EXCEPTION 'Item authoring lesson curriculum scope does not match assessment blueprint scope'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_item_eligibility ON app.assessment_version_items;
CREATE TRIGGER trg_assessment_version_item_eligibility
  BEFORE INSERT OR UPDATE ON app.assessment_version_items
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_item_eligibility();

-- -----------------------------------------------------------------------------
-- 5. Fix DB-R5: Context/Attempt Scope, Ancestors & Pinned Purpose Result Shape
-- -----------------------------------------------------------------------------

-- Learning context scope
CREATE OR REPLACE FUNCTION app.check_learning_context_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_course_lang UUID;
  v_course_fw UUID;
  v_level_fw UUID;
  v_result_attempt_ctx UUID;
  v_result_rec_level UUID;
  v_attempt_finalized TIMESTAMPTZ;
BEGIN
  -- Course must match context language
  SELECT language_id, framework_id INTO v_course_lang, v_course_fw
    FROM app.courses WHERE id = NEW.course_id;

  IF v_course_lang IS DISTINCT FROM NEW.language_id THEN
    RAISE EXCEPTION 'Context course language % does not match context language %', v_course_lang, NEW.language_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Start level must belong to course framework
  IF NEW.selected_start_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_level_fw
      FROM app.levels WHERE id = NEW.selected_start_level_id;
    IF v_level_fw IS DISTINCT FROM v_course_fw THEN
      RAISE EXCEPTION 'Context start level does not belong to course framework' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Working level must belong to course framework
  IF NEW.working_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_level_fw
      FROM app.levels WHERE id = NEW.working_level_id;
    IF v_level_fw IS DISTINCT FROM v_course_fw THEN
      RAISE EXCEPTION 'Context working level does not belong to course framework' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- If PLACEMENT start: verify start_result_id belongs to this context and recommended level matches
  IF NEW.start_source = 'PLACEMENT' THEN
    IF NEW.start_result_id IS NULL THEN
      RAISE EXCEPTION 'PLACEMENT start requires start_result_id' USING ERRCODE = 'check_violation';
    END IF;
    SELECT aa.context_id, aa.finalized_at, ar.recommended_level_id
      INTO v_result_attempt_ctx, v_attempt_finalized, v_result_rec_level
      FROM app.assessment_results ar
      JOIN app.assessment_attempts aa ON aa.id = ar.attempt_id
     WHERE ar.id = NEW.start_result_id;

    IF v_result_attempt_ctx IS DISTINCT FROM NEW.id THEN
      RAISE EXCEPTION 'start_result does not belong to this learning context' USING ERRCODE = 'check_violation';
    END IF;
    IF v_attempt_finalized IS NULL THEN
      RAISE EXCEPTION 'start_result attempt must be finalized' USING ERRCODE = 'check_violation';
    END IF;
    IF v_result_rec_level IS DISTINCT FROM NEW.selected_start_level_id THEN
      RAISE EXCEPTION 'selected_start_level_id must match PLACEMENT recommended_level_id' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learning_context_scope ON app.learning_contexts;
CREATE TRIGGER trg_learning_context_scope
  BEFORE INSERT OR UPDATE OF course_id, language_id, selected_start_level_id, working_level_id, start_source, start_result_id ON app.learning_contexts
  FOR EACH ROW EXECUTE FUNCTION app.check_learning_context_scope();

-- Assessment blueprint scope check
CREATE OR REPLACE FUNCTION app.check_assessment_blueprint_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_course_lang UUID;
  v_course_fw UUID;
  v_target_fw UUID;
  v_next_fw UUID;
BEGIN
  SELECT language_id, framework_id INTO v_course_lang, v_course_fw
    FROM app.courses WHERE id = NEW.course_id;

  IF v_course_lang IS DISTINCT FROM NEW.language_id THEN
    RAISE EXCEPTION 'Blueprint course language does not match blueprint language' USING ERRCODE = 'check_violation';
  END IF;
  IF v_course_fw IS DISTINCT FROM NEW.framework_id THEN
    RAISE EXCEPTION 'Blueprint course framework does not match blueprint framework' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.target_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_target_fw FROM app.levels WHERE id = NEW.target_level_id;
    IF v_target_fw IS DISTINCT FROM NEW.framework_id THEN
      RAISE EXCEPTION 'Blueprint target_level_id does not belong to blueprint framework' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.next_level_id IS NOT NULL THEN
    SELECT framework_id INTO v_next_fw FROM app.levels WHERE id = NEW.next_level_id;
    IF v_next_fw IS DISTINCT FROM NEW.framework_id THEN
      RAISE EXCEPTION 'Blueprint next_level_id does not belong to blueprint framework' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_blueprint_scope ON app.assessment_blueprints;
CREATE TRIGGER trg_assessment_blueprint_scope
  BEFORE INSERT OR UPDATE OF course_id, language_id, framework_id, target_level_id, next_level_id ON app.assessment_blueprints
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_blueprint_scope();

-- Lesson attempts context curriculum & active published revision check
CREATE OR REPLACE FUNCTION app.check_lesson_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_lesson_course UUID;
  v_course_active BOOLEAN;
  v_active_rev UUID;
  v_rev_status TEXT;
BEGIN
  -- Context course must match lesson's course
  SELECT course_id INTO v_ctx_course FROM app.learning_contexts WHERE id = NEW.context_id;

  SELECT u.course_id, c.is_active INTO v_lesson_course, v_course_active
    FROM app.lessons l
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
   WHERE l.id = NEW.lesson_id;

  IF v_ctx_course IS DISTINCT FROM v_lesson_course THEN
    RAISE EXCEPTION 'Lesson attempt lesson course does not match context course' USING ERRCODE = 'check_violation';
  END IF;

  IF v_course_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Cannot attempt lesson in inactive course' USING ERRCODE = 'check_violation';
  END IF;

  -- Revision must be the active revision and published
  SELECT active_revision_id INTO v_active_rev FROM app.lessons WHERE id = NEW.lesson_id;
  IF v_active_rev IS DISTINCT FROM NEW.lesson_revision_id THEN
    RAISE EXCEPTION 'Lesson attempt revision % is not the active revision of lesson %', NEW.lesson_revision_id, NEW.lesson_id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT status INTO v_rev_status FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;
  IF v_rev_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'Lesson attempt revision % is not PUBLISHED (status=%)', NEW.lesson_revision_id, v_rev_status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_attempt_scope ON app.lesson_attempts;
CREATE TRIGGER trg_lesson_attempt_scope
  BEFORE INSERT ON app.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_attempt_scope();

-- Assessment attempts context curriculum match
CREATE OR REPLACE FUNCTION app.check_assessment_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_ctx_lang UUID;
  v_bp_course UUID;
  v_bp_lang UUID;
BEGIN
  SELECT course_id, language_id INTO v_ctx_course, v_ctx_lang
    FROM app.learning_contexts WHERE id = NEW.context_id;

  SELECT b.course_id, b.language_id
    INTO v_bp_course, v_bp_lang
    FROM app.assessment_versions av
    JOIN app.assessment_blueprints b ON b.id = av.blueprint_id
   WHERE av.id = NEW.assessment_version_id;

  IF v_ctx_course IS DISTINCT FROM v_bp_course OR v_ctx_lang IS DISTINCT FROM v_bp_lang THEN
    RAISE EXCEPTION 'Assessment attempt context curriculum does not match assessment version blueprint'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_attempt_scope ON app.assessment_attempts;
CREATE TRIGGER trg_assessment_attempt_scope
  BEFORE INSERT ON app.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_attempt_scope();

-- Assessment results purpose-aware result shape (closes DB-C1 and DB-R5)
CREATE OR REPLACE FUNCTION app.check_assessment_result_parent_attempt()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_finalized TIMESTAMPTZ;
  v_snapshot JSONB;
  v_purpose TEXT;
  v_attempt_ctx UUID;
  v_ctx_fw UUID;
  v_rec_fw UUID;
BEGIN
  SELECT aa.finalized_at, aa.context_id, av.blueprint_snapshot
    INTO v_finalized, v_attempt_ctx, v_snapshot
    FROM app.assessment_attempts aa
    JOIN app.assessment_versions av ON av.id = aa.assessment_version_id
   WHERE aa.id = NEW.attempt_id;

  IF v_finalized IS NULL THEN
    RAISE EXCEPTION 'Assessment result attempt % must be finalized', NEW.attempt_id USING ERRCODE = 'check_violation';
  END IF;

  -- Points bound check
  IF NEW.raw_points > NEW.possible_points THEN
    RAISE EXCEPTION 'Assessment result raw_points cannot exceed possible_points' USING ERRCODE = 'check_violation';
  END IF;

  -- Derive purpose from pinned snapshot
  v_purpose := v_snapshot->>'purpose';
  IF v_purpose IS NULL THEN
    RAISE EXCEPTION 'Assessment version blueprint snapshot missing purpose' USING ERRCODE = 'check_violation';
  END IF;

  IF v_purpose = 'PLACEMENT' THEN
    IF NEW.passed IS NOT NULL THEN
      RAISE EXCEPTION 'Placement assessment result passed field must be NULL' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.recommended_level_id IS NULL THEN
      RAISE EXCEPTION 'Placement assessment result recommended_level_id must be NOT NULL' USING ERRCODE = 'check_violation';
    END IF;
    -- recommended_level_id must belong to the context framework
    SELECT c.framework_id INTO v_ctx_fw
      FROM app.learning_contexts lc
      JOIN app.courses c ON c.id = lc.course_id
     WHERE lc.id = v_attempt_ctx;

    SELECT framework_id INTO v_rec_fw
      FROM app.levels WHERE id = NEW.recommended_level_id;

    IF v_rec_fw IS DISTINCT FROM v_ctx_fw THEN
      RAISE EXCEPTION 'Recommended level framework does not match context framework' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_purpose = 'LEVEL_UP' THEN
    IF NEW.passed IS NULL THEN
      RAISE EXCEPTION 'Level-up assessment result passed field must be NOT NULL' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.recommended_level_id IS NOT NULL THEN
      RAISE EXCEPTION 'Level-up assessment result recommended_level_id must be NULL' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown assessment version blueprint purpose: %', v_purpose USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_result_parent_attempt ON app.assessment_results;
CREATE TRIGGER trg_assessment_result_parent_attempt
  BEFORE INSERT OR UPDATE OF attempt_id, raw_points, possible_points, passed, recommended_level_id ON app.assessment_results
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_result_parent_attempt();

-- -----------------------------------------------------------------------------
-- 6. Fix DB-R9: Creator-Wide Default Function Revocation and Public Denials
-- -----------------------------------------------------------------------------

-- Creator-wide default privilege: remove EXECUTE on future functions for migration creator
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Explicit revocations on schemas, tables, and functions
REVOKE ALL ON SCHEMA app FROM PUBLIC;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
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
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM anon;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app FROM authenticated;
    REVOKE ALL ON SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM authenticated;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM authenticated;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM authenticated;
  END IF;
END $$;


-- =============================================================================
-- START MIGRATION: 20261027020000_product_correction
-- Path: lingora-admin/prisma/product/migrations/20261027020000_product_correction/migration.sql
-- SHA-256: 3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029
-- =============================================================================

-- =============================================================================
-- Migration: 20261027020000_product_correction
-- Purpose: Bounded correction round 1/1 for WP-DB-FINAL-01 per review.md
-- Closes: FDB-05, FDB-06, FDB-07, FDB-08, FDB-10
-- Transactional DDL with bounded lock timeout
-- =============================================================================

SET LOCAL lock_timeout = '5s';

-- -----------------------------------------------------------------------------
-- Precondition assertions: baseline and finalize must be present and finished
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations
     WHERE migration_name = '20261027000000_product_baseline' AND finished_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Precondition failed: baseline migration 20261027000000_product_baseline not applied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations
     WHERE migration_name = '20261027010000_product_finalize' AND finished_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Precondition failed: finalize migration 20261027010000_product_finalize not applied';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. FDB-06: Provenance Functions & Assembly Storage Envelope
-- -----------------------------------------------------------------------------

-- Fix: check_lesson_revision_provenance uses next_teacher_id (not assigned_teacher_id)
CREATE OR REPLACE FUNCTION app.check_lesson_revision_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_assign_id UUID;
  v_next_teacher_id UUID;
  v_prior_rev_no INTEGER;
  v_prior_lesson_id UUID;
BEGIN
  SELECT assignment_id, next_teacher_id
    INTO v_assign_id, v_next_teacher_id
    FROM app.assignment_history WHERE id = NEW.creation_assignment_episode_id;

  IF v_assign_id IS DISTINCT FROM NEW.assignment_id THEN
    RAISE EXCEPTION 'Creation assignment episode does not belong to assignment %', NEW.assignment_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_next_teacher_id IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Lesson revision created_by must match assigned teacher of creation episode'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.prior_revision_id IS NOT NULL THEN
    SELECT lesson_id, revision_no
      INTO v_prior_lesson_id, v_prior_rev_no
      FROM app.lesson_revisions WHERE id = NEW.prior_revision_id;

    IF v_prior_lesson_id IS DISTINCT FROM NEW.lesson_id THEN
      RAISE EXCEPTION 'Prior revision must belong to same lesson %', NEW.lesson_id
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_prior_rev_no >= NEW.revision_no THEN
      RAISE EXCEPTION 'Prior revision number % must be strictly less than revision number %', v_prior_rev_no, NEW.revision_no
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: check_item_revision_provenance uses next_teacher_id (not assigned_teacher_id)
CREATE OR REPLACE FUNCTION app.check_item_revision_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_next_teacher_id UUID;
BEGIN
  SELECT assignment_id INTO v_lesson_assign_id
    FROM app.lesson_revisions WHERE id = NEW.authoring_lesson_revision_id;

  SELECT assignment_id, next_teacher_id
    INTO v_ep_assign_id, v_next_teacher_id
    FROM app.assignment_history WHERE id = NEW.creation_assignment_episode_id;

  IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
    RAISE EXCEPTION 'Item creation episode assignment % does not match authoring lesson assignment %',
      v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
  END IF;

  IF v_next_teacher_id IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Item revision created_by must match assigned teacher of creation episode'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: check_revision_review_provenance uses scope_generation and validates SUBMIT attribution
CREATE OR REPLACE FUNCTION app.check_revision_review_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_ep_gen BIGINT;
  v_next_teacher_id UUID;
  v_sub_by UUID;
  v_sub_at TIMESTAMPTZ;
BEGIN
  IF NEW.lesson_revision_id IS NOT NULL THEN
    SELECT assignment_id, submitted_by, submitted_at
      INTO v_lesson_assign_id, v_sub_by, v_sub_at
      FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;

    SELECT assignment_id, scope_generation, next_teacher_id
      INTO v_ep_assign_id, v_ep_gen, v_next_teacher_id
      FROM app.assignment_history WHERE id = NEW.assignment_episode_id;

    IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
      RAISE EXCEPTION 'Review episode assignment % does not match lesson assignment %',
        v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
    END IF;

    IF v_ep_gen IS DISTINCT FROM NEW.assignment_generation THEN
      RAISE EXCEPTION 'Review assignment_generation % does not match episode generation %',
        NEW.assignment_generation, v_ep_gen USING ERRCODE = 'check_violation';
    END IF;

    -- For SUBMIT action: actor must match episode next_teacher_id and lesson submitted_by
    IF NEW.action = 'SUBMIT' THEN
      IF NEW.actor_id IS DISTINCT FROM v_next_teacher_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % must match episode teacher %',
          NEW.actor_id, v_next_teacher_id USING ERRCODE = 'check_violation';
      END IF;
      IF v_sub_by IS NOT NULL AND v_sub_by IS DISTINCT FROM NEW.actor_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % does not match lesson revision submitted_by %',
          NEW.actor_id, v_sub_by USING ERRCODE = 'check_violation';
      END IF;
      IF v_sub_at IS NULL THEN
        RAISE EXCEPTION 'Lesson revision must have submitted_at timestamp when SUBMIT review is recorded'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: check_assessment_version_item_eligibility ties to immutable snapshot envelope
CREATE OR REPLACE FUNCTION app.check_assessment_version_item_eligibility()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_origin TEXT;
  v_omitted BOOLEAN;
  v_frozen TIMESTAMPTZ;
  v_action TEXT;
  v_review_lesson_rev UUID;
  v_review_episode UUID;
  v_review_gen BIGINT;
  v_ep_gen BIGINT;
  v_lesson_submitted TIMESTAMPTZ;
  v_lesson_course UUID;
  v_lesson_lang UUID;
  v_lesson_fw UUID;
  v_ver_bp_id UUID;
  v_ver_bp_gen BIGINT;
  v_snapshot JSONB;
  v_snap_course UUID;
  v_snap_lang UUID;
  v_snap_fw UUID;
  v_item_bp_id UUID;
  v_item_bp_gen BIGINT;
BEGIN
  SELECT origin INTO v_origin FROM app.item_identities WHERE id = NEW.item_id;
  IF v_origin IS DISTINCT FROM 'ASSESSMENT' THEN
    RAISE EXCEPTION 'Assessment version item % must have origin ASSESSMENT', NEW.item_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT is_draft_omitted, frozen_at, assessment_blueprint_id, blueprint_generation
    INTO v_omitted, v_frozen, v_item_bp_id, v_item_bp_gen
    FROM app.item_revisions WHERE id = NEW.item_revision_id;

  IF v_omitted = true THEN
    RAISE EXCEPTION 'Draft-omitted item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;
  IF v_frozen IS NULL THEN
    RAISE EXCEPTION 'Unfrozen item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT action, lesson_revision_id, assignment_episode_id, assignment_generation
    INTO v_action, v_review_lesson_rev, v_review_episode, v_review_gen
    FROM app.revision_reviews WHERE id = NEW.source_submission_id;

  IF v_action IS DISTINCT FROM 'SUBMIT' THEN
    RAISE EXCEPTION 'Source review action must be SUBMIT for assessment version item' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_lesson_rev IS DISTINCT FROM NEW.source_lesson_revision_id THEN
    RAISE EXCEPTION 'Source review lesson revision does not match source_lesson_revision_id' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_episode IS DISTINCT FROM NEW.contribution_assignment_episode_id THEN
    RAISE EXCEPTION 'Source review episode does not match contribution_assignment_episode_id' USING ERRCODE = 'check_violation';
  END IF;

  SELECT scope_generation INTO v_ep_gen
    FROM app.assignment_history WHERE id = NEW.contribution_assignment_episode_id;
  IF v_ep_gen IS DISTINCT FROM v_review_gen THEN
    RAISE EXCEPTION 'Review assignment_generation does not match contribution episode scope_generation' USING ERRCODE = 'check_violation';
  END IF;

  SELECT submitted_at INTO v_lesson_submitted
    FROM app.lesson_revisions WHERE id = NEW.source_lesson_revision_id;
  IF v_lesson_submitted IS NULL THEN
    RAISE EXCEPTION 'Source lesson revision % must be submitted', NEW.source_lesson_revision_id USING ERRCODE = 'check_violation';
  END IF;

  -- Read parent version and its immutable pinned snapshot
  SELECT blueprint_id, blueprint_generation, blueprint_snapshot
    INTO v_ver_bp_id, v_ver_bp_gen, v_snapshot
    FROM app.assessment_versions WHERE id = NEW.assessment_version_id;

  IF v_snapshot IS NULL OR jsonb_typeof(v_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version snapshot missing or invalid' USING ERRCODE = 'check_violation';
  END IF;

  IF (v_snapshot->>'blueprint_id') IS NULL OR
     (v_snapshot->>'blueprint_generation') IS NULL OR
     (v_snapshot->>'course_id') IS NULL OR
     (v_snapshot->>'language_id') IS NULL OR
     (v_snapshot->>'framework_id') IS NULL OR
     (v_snapshot->>'purpose') IS NULL THEN
    RAISE EXCEPTION 'Assessment version snapshot missing required envelope keys' USING ERRCODE = 'check_violation';
  END IF;

  -- Tie item blueprint pins to version blueprint identity
  IF v_item_bp_id IS DISTINCT FROM v_ver_bp_id OR v_item_bp_gen IS DISTINCT FROM v_ver_bp_gen THEN
    RAISE EXCEPTION 'Item revision blueprint pins (% / %) do not match assessment version (% / %)',
      v_item_bp_id, v_item_bp_gen, v_ver_bp_id, v_ver_bp_gen USING ERRCODE = 'check_violation';
  END IF;

  -- Curriculum scope matching: lesson curriculum must match pinned snapshot scope
  SELECT u.course_id, c.language_id, c.framework_id
    INTO v_lesson_course, v_lesson_lang, v_lesson_fw
    FROM app.lesson_revisions lr
    JOIN app.lessons l ON l.id = lr.lesson_id
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
   WHERE lr.id = NEW.source_lesson_revision_id;

  v_snap_course := (v_snapshot->>'course_id')::UUID;
  v_snap_lang := (v_snapshot->>'language_id')::UUID;
  v_snap_fw := (v_snapshot->>'framework_id')::UUID;

  IF v_snap_course IS DISTINCT FROM v_lesson_course OR
     v_snap_lang IS DISTINCT FROM v_lesson_lang OR
     v_snap_fw IS DISTINCT FROM v_lesson_fw THEN
    RAISE EXCEPTION 'Item authoring lesson curriculum scope does not match pinned version snapshot scope'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Snapshot shape trigger on assessment_versions
CREATE OR REPLACE FUNCTION app.check_assessment_version_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.blueprint_snapshot IS NULL OR jsonb_typeof(NEW.blueprint_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot must be a JSON object' USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->>'blueprint_id') IS NULL OR
     (NEW.blueprint_snapshot->>'blueprint_generation') IS NULL OR
     (NEW.blueprint_snapshot->>'course_id') IS NULL OR
     (NEW.blueprint_snapshot->>'language_id') IS NULL OR
     (NEW.blueprint_snapshot->>'framework_id') IS NULL OR
     (NEW.blueprint_snapshot->>'purpose') IS NULL THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot missing required envelope keys' USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->>'purpose') NOT IN ('PLACEMENT', 'LEVEL_UP') THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot purpose must be PLACEMENT or LEVEL_UP' USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->>'blueprint_id')::UUID IS DISTINCT FROM NEW.blueprint_id OR
     (NEW.blueprint_snapshot->>'blueprint_generation')::BIGINT IS DISTINCT FROM NEW.blueprint_generation THEN
    RAISE EXCEPTION 'Assessment version snapshot blueprint identity does not match version scalar columns'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_snapshot_shape ON app.assessment_versions;
CREATE TRIGGER trg_assessment_version_snapshot_shape
  BEFORE INSERT OR UPDATE OF blueprint_snapshot, blueprint_id, blueprint_generation ON app.assessment_versions
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_snapshot();

-- -----------------------------------------------------------------------------
-- 2. FDB-05: Permanent Freeze & Retained Fact Boundaries
-- -----------------------------------------------------------------------------

-- Fix: Lesson revision payload freeze with core readiness check and immutable timestamps
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_submitted_payload()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_submit BOOLEAN;
  v_has_core BOOLEAN;
BEGIN
  -- Transition to reviewable / approved / published requires submitted facts and core readiness
  IF NEW.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
    IF NEW.submitted_at IS NULL OR NEW.submitted_by IS NULL THEN
      RAISE EXCEPTION 'Lesson revision in % status requires nonnull submitted_at and submitted_by', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM app.lesson_exercises
       WHERE lesson_revision_id = NEW.id AND is_core = true
    ) INTO v_has_core;

    IF NOT v_has_core THEN
      RAISE EXCEPTION 'Lesson revision in % status requires at least one core exercise', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Monotonic submitted_at: once set, cannot be cleared or changed
  IF OLD.submitted_at IS NOT NULL AND (NEW.submitted_at IS NULL OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN
    RAISE EXCEPTION 'Lesson revision submitted_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic submitted_by: once set, cannot be cleared or changed
  IF OLD.submitted_by IS NOT NULL AND (NEW.submitted_by IS NULL OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by) THEN
    RAISE EXCEPTION 'Lesson revision submitted_by cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic approved_at / published_at
  IF OLD.approved_at IS NOT NULL AND (NEW.approved_at IS NULL OR NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
    RAISE EXCEPTION 'Lesson revision approved_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.published_at IS NOT NULL AND (NEW.published_at IS NULL OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
    RAISE EXCEPTION 'Lesson revision published_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Check if revision was ever submitted
  v_has_submit := (OLD.submitted_at IS NOT NULL) OR (OLD.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')) OR EXISTS (
    SELECT 1 FROM app.revision_reviews
     WHERE lesson_revision_id = OLD.id AND action = 'SUBMIT'
  );

  IF v_has_submit THEN
    IF NEW.status = 'DRAFT' THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision cannot return to DRAFT status' USING ERRCODE = 'check_violation';
    END IF;

    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.content_blocks IS DISTINCT FROM NEW.content_blocks OR
       OLD.topic_ids IS DISTINCT FROM NEW.topic_ids OR
       OLD.skill_ids IS DISTINCT FROM NEW.skill_ids OR
       OLD.purpose_tags IS DISTINCT FROM NEW.purpose_tags OR
       OLD.coverage_catalog_generation IS DISTINCT FROM NEW.coverage_catalog_generation OR
       OLD.coverage_snapshot IS DISTINCT FROM NEW.coverage_snapshot OR
       OLD.submitted_assignment_generation IS DISTINCT FROM NEW.submitted_assignment_generation OR
       OLD.assignment_scope_snapshot IS DISTINCT FROM NEW.assignment_scope_snapshot OR
       OLD.prior_revision_id IS DISTINCT FROM NEW.prior_revision_id OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision authored payload is frozen' USING ERRCODE = 'check_violation';
    END IF;

    IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'Lesson revision identity and provenance are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Lesson revision identity fields are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Item revision freeze checks owning lesson submission state & protects creation/blueprint pins
CREATE OR REPLACE FUNCTION app.guard_item_revision_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_item_frozen BOOLEAN;
BEGIN
  IF OLD.frozen_at IS NOT NULL AND (NEW.frozen_at IS NULL OR NEW.frozen_at IS DISTINCT FROM OLD.frozen_at) THEN
    RAISE EXCEPTION 'Item revision frozen_at marker is monotonic and cannot be cleared or changed'
      USING ERRCODE = 'check_violation';
  END IF;

  v_item_frozen := (OLD.frozen_at IS NOT NULL) OR EXISTS (
    SELECT 1 FROM app.lesson_revisions
     WHERE id = OLD.authoring_lesson_revision_id
       AND (submitted_at IS NOT NULL OR status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
  );

  IF v_item_frozen THEN
    IF OLD.prompt_data IS DISTINCT FROM NEW.prompt_data OR
       OLD.exact_fingerprint IS DISTINCT FROM NEW.exact_fingerprint OR
       OLD.type IS DISTINCT FROM NEW.type OR
       OLD.schema_version IS DISTINCT FROM NEW.schema_version OR
       OLD.is_draft_omitted IS DISTINCT FROM NEW.is_draft_omitted OR
       OLD.item_id IS DISTINCT FROM NEW.item_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.authoring_lesson_revision_id IS DISTINCT FROM NEW.authoring_lesson_revision_id OR
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.practice_skill_ids IS DISTINCT FROM NEW.practice_skill_ids OR
       OLD.practice_coverage_snapshot IS DISTINCT FROM NEW.practice_coverage_snapshot OR
       OLD.assessment_blueprint_id IS DISTINCT FROM NEW.assessment_blueprint_id OR
       OLD.blueprint_generation IS DISTINCT FROM NEW.blueprint_generation OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Frozen item revision payload cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.item_id IS DISTINCT FROM NEW.item_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.authoring_lesson_revision_id IS DISTINCT FROM NEW.authoring_lesson_revision_id OR
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Item revision identity fields are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Grading secrets covered on INSERT, UPDATE, and DELETE
CREATE OR REPLACE FUNCTION app_private.guard_grading_secret_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_item_id UUID;
  v_frozen TIMESTAMPTZ;
  v_lesson_submitted TIMESTAMPTZ;
  v_lesson_status TEXT;
BEGIN
  v_item_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.item_revision_id ELSE NEW.item_revision_id END;

  SELECT ir.frozen_at, lr.submitted_at, lr.status
    INTO v_frozen, v_lesson_submitted, v_lesson_status
    FROM app.item_revisions ir
    JOIN app.lesson_revisions lr ON lr.id = ir.authoring_lesson_revision_id
   WHERE ir.id = v_item_id;

  IF TG_OP = 'INSERT' THEN
    IF v_frozen IS NOT NULL OR v_lesson_submitted IS NOT NULL OR v_lesson_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
      RAISE EXCEPTION 'Cannot insert grading secret for a frozen or submitted item revision' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF v_frozen IS NOT NULL OR v_lesson_submitted IS NOT NULL OR v_lesson_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
      RAISE EXCEPTION 'Grading secret for frozen item revision cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF v_frozen IS NOT NULL OR v_lesson_submitted IS NOT NULL OR v_lesson_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
      IF OLD.item_revision_id IS DISTINCT FROM NEW.item_revision_id OR
         OLD.grading_data IS DISTINCT FROM NEW.grading_data OR
         OLD.feedback_data IS DISTINCT FROM NEW.feedback_data OR
         OLD.schema_version IS DISTINCT FROM NEW.schema_version OR
         OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        RAISE EXCEPTION 'Grading secret is frozen along with its item revision' USING ERRCODE = 'check_violation';
      END IF;
    ELSE
      IF OLD.item_revision_id IS DISTINCT FROM NEW.item_revision_id OR
         OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        RAISE EXCEPTION 'Grading secret item_revision_id and created_at cannot be changed' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grading_secret_no_insert ON app_private.item_grading_secrets;
CREATE TRIGGER trg_grading_secret_no_insert
  BEFORE INSERT ON app_private.item_grading_secrets
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_grading_secret_frozen();

-- Fix: Item identity variant_of_id and exact_fingerprint protected when revisions are frozen
CREATE OR REPLACE FUNCTION app.guard_item_identity_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_frozen BOOLEAN;
BEGIN
  IF OLD.origin IS DISTINCT FROM NEW.origin THEN
    IF EXISTS (SELECT 1 FROM app.assessment_version_items WHERE item_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_exercises WHERE item_id = OLD.id) THEN
      RAISE EXCEPTION 'Item identity origin cannot be changed when referenced by exercises or assessment items'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF OLD.created_by IS DISTINCT FROM NEW.created_by OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Item identity created_by and created_at are immutable' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.variant_of_id IS DISTINCT FROM NEW.variant_of_id OR OLD.exact_fingerprint IS DISTINCT FROM NEW.exact_fingerprint THEN
    SELECT EXISTS (
      SELECT 1 FROM app.item_revisions ir
       WHERE ir.item_id = OLD.id
         AND (ir.frozen_at IS NOT NULL OR EXISTS (
           SELECT 1 FROM app.lesson_revisions lr
            WHERE lr.id = ir.authoring_lesson_revision_id
              AND (lr.submitted_at IS NOT NULL OR lr.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
         ))
    ) INTO v_has_frozen;

    IF v_has_frozen THEN
      RAISE EXCEPTION 'Item identity variant_of_id and exact_fingerprint are immutable once revisions are frozen or submitted'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Assessment result progression_applied_at and created_at are immutable
CREATE OR REPLACE FUNCTION app.guard_assessment_result_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.attempt_id IS DISTINCT FROM NEW.attempt_id OR
     OLD.raw_points IS DISTINCT FROM NEW.raw_points OR
     OLD.possible_points IS DISTINCT FROM NEW.possible_points OR
     OLD.assessment_type IS DISTINCT FROM NEW.assessment_type OR
     OLD.delivery_mode IS DISTINCT FROM NEW.delivery_mode OR
     OLD.completed_at IS DISTINCT FROM NEW.completed_at OR
     OLD.passed IS DISTINCT FROM NEW.passed OR
     OLD.recommended_level_id IS DISTINCT FROM NEW.recommended_level_id OR
     OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Assessment result evidence facts are immutable' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.progression_applied_at IS DISTINCT FROM NEW.progression_applied_at THEN
    RAISE EXCEPTION 'Assessment result progression_applied_at is immutable after insertion'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Lesson attempt created_at immutable and null-safe comparisons
CREATE OR REPLACE FUNCTION app.guard_lesson_attempt_completed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Completed lesson attempt cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Lesson attempt created_at is immutable' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.completed_at IS NOT NULL THEN
    IF NEW.completed_at IS NULL OR NEW.completed_at IS DISTINCT FROM OLD.completed_at OR
       OLD.context_id IS DISTINCT FROM NEW.context_id OR
       OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.lesson_revision_id IS DISTINCT FROM NEW.lesson_revision_id OR
       OLD.started_at IS DISTINCT FROM NEW.started_at OR
       OLD.n_core IS DISTINCT FROM NEW.n_core OR
       OLD.k_first_wrong IS DISTINCT FROM NEW.k_first_wrong OR
       OLD.contribution_units IS DISTINCT FROM NEW.contribution_units OR
       OLD.response_count IS DISTINCT FROM NEW.response_count OR
       OLD.completion_operation_key IS DISTINCT FROM NEW.completion_operation_key OR
       OLD.qualifying_local_date IS DISTINCT FROM NEW.qualifying_local_date OR
       OLD.timezone_at_completion IS DISTINCT FROM NEW.timezone_at_completion THEN
      RAISE EXCEPTION 'Completed lesson attempt facts are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.context_id IS DISTINCT FROM NEW.context_id OR
       OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.lesson_revision_id IS DISTINCT FROM NEW.lesson_revision_id OR
       OLD.started_at IS DISTINCT FROM NEW.started_at THEN
      RAISE EXCEPTION 'Lesson attempt context and lesson references are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: Assessment attempt created_at immutable and null-safe comparisons
CREATE OR REPLACE FUNCTION app.guard_assessment_attempt_finalized()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.finalized_at IS NOT NULL THEN
      RAISE EXCEPTION 'Finalized assessment attempt cannot be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Assessment attempt created_at is immutable' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.finalized_at IS NOT NULL THEN
    IF NEW.finalized_at IS NULL OR NEW.finalized_at IS DISTINCT FROM OLD.finalized_at OR
       OLD.context_id IS DISTINCT FROM NEW.context_id OR
       OLD.assessment_version_id IS DISTINCT FROM NEW.assessment_version_id OR
       OLD.started_at IS DISTINCT FROM NEW.started_at OR
       OLD.context_row_version_at_start IS DISTINCT FROM NEW.context_row_version_at_start OR
       OLD.curriculum_generation_at_start IS DISTINCT FROM NEW.curriculum_generation_at_start OR
       OLD.submission_key IS DISTINCT FROM NEW.submission_key OR
       OLD.submission_hash IS DISTINCT FROM NEW.submission_hash THEN
      RAISE EXCEPTION 'Finalized assessment attempt facts are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.context_id IS DISTINCT FROM NEW.context_id OR
       OLD.assessment_version_id IS DISTINCT FROM NEW.assessment_version_id OR
       OLD.started_at IS DISTINCT FROM NEW.started_at THEN
      RAISE EXCEPTION 'Assessment attempt context and version references are immutable' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. FDB-07: Scope & Context Invariants (Immutable Identities & Historical Scope)
-- -----------------------------------------------------------------------------

-- Learning context immutable learner, course, language once attempts exist
CREATE OR REPLACE FUNCTION app.guard_learning_context_immutable_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.learner_id IS DISTINCT FROM NEW.learner_id OR
     OLD.course_id IS DISTINCT FROM NEW.course_id OR
     OLD.language_id IS DISTINCT FROM NEW.language_id THEN
    IF EXISTS (SELECT 1 FROM app.lesson_attempts WHERE context_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.assessment_attempts WHERE context_id = OLD.id) THEN
      RAISE EXCEPTION 'Learning context learner, course, and language are immutable once attempts exist'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learning_context_immutable_identity ON app.learning_contexts;
CREATE TRIGGER trg_learning_context_immutable_identity
  BEFORE UPDATE ON app.learning_contexts
  FOR EACH ROW EXECUTE FUNCTION app.guard_learning_context_immutable_identity();

-- Assessment blueprint immutable scope once versions exist
CREATE OR REPLACE FUNCTION app.guard_assessment_blueprint_immutable_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.course_id IS DISTINCT FROM NEW.course_id OR
     OLD.language_id IS DISTINCT FROM NEW.language_id OR
     OLD.framework_id IS DISTINCT FROM NEW.framework_id OR
     OLD.purpose IS DISTINCT FROM NEW.purpose THEN
    IF EXISTS (SELECT 1 FROM app.assessment_versions WHERE blueprint_id = OLD.id) THEN
      RAISE EXCEPTION 'Assessment blueprint scope and purpose are immutable once versions exist'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_blueprint_immutable_scope ON app.assessment_blueprints;
CREATE TRIGGER trg_assessment_blueprint_immutable_scope
  BEFORE UPDATE ON app.assessment_blueprints
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_blueprint_immutable_scope();

-- Fix: Assessment attempt scope derived from pinned snapshot
CREATE OR REPLACE FUNCTION app.check_assessment_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_ctx_lang UUID;
  v_snap_course UUID;
  v_snap_lang UUID;
  v_snapshot JSONB;
BEGIN
  SELECT course_id, language_id INTO v_ctx_course, v_ctx_lang
    FROM app.learning_contexts WHERE id = NEW.context_id;

  SELECT av.blueprint_snapshot INTO v_snapshot
    FROM app.assessment_versions av
   WHERE av.id = NEW.assessment_version_id;

  IF v_snapshot IS NULL OR jsonb_typeof(v_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint snapshot missing or invalid' USING ERRCODE = 'check_violation';
  END IF;

  v_snap_course := (v_snapshot->>'course_id')::UUID;
  v_snap_lang := (v_snapshot->>'language_id')::UUID;

  IF v_ctx_course IS DISTINCT FROM v_snap_course OR v_ctx_lang IS DISTINCT FROM v_snap_lang THEN
    RAISE EXCEPTION 'Assessment attempt context curriculum does not match pinned assessment version snapshot'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Assessment result parent attempt derives framework from pinned snapshot
CREATE OR REPLACE FUNCTION app.check_assessment_result_parent_attempt()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_finalized TIMESTAMPTZ;
  v_snapshot JSONB;
  v_purpose TEXT;
  v_pinned_fw UUID;
  v_rec_fw UUID;
BEGIN
  SELECT aa.finalized_at, av.blueprint_snapshot
    INTO v_finalized, v_snapshot
    FROM app.assessment_attempts aa
    JOIN app.assessment_versions av ON av.id = aa.assessment_version_id
   WHERE aa.id = NEW.attempt_id;

  IF v_finalized IS NULL THEN
    RAISE EXCEPTION 'Assessment result attempt % must be finalized', NEW.attempt_id USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.raw_points > NEW.possible_points THEN
    RAISE EXCEPTION 'Assessment result raw_points cannot exceed possible_points' USING ERRCODE = 'check_violation';
  END IF;

  IF v_snapshot IS NULL OR jsonb_typeof(v_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint snapshot missing or invalid' USING ERRCODE = 'check_violation';
  END IF;

  v_purpose := v_snapshot->>'purpose';
  IF v_purpose IS NULL THEN
    RAISE EXCEPTION 'Assessment version blueprint snapshot missing purpose' USING ERRCODE = 'check_violation';
  END IF;

  v_pinned_fw := (v_snapshot->>'framework_id')::UUID;

  IF v_purpose = 'PLACEMENT' THEN
    IF NEW.passed IS NOT NULL THEN
      RAISE EXCEPTION 'Placement assessment result passed field must be NULL' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.recommended_level_id IS NULL THEN
      RAISE EXCEPTION 'Placement assessment result recommended_level_id must be NOT NULL' USING ERRCODE = 'check_violation';
    END IF;

    SELECT framework_id INTO v_rec_fw
      FROM app.levels WHERE id = NEW.recommended_level_id;

    IF v_rec_fw IS DISTINCT FROM v_pinned_fw THEN
      RAISE EXCEPTION 'Recommended level framework does not match pinned assessment version framework'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_purpose = 'LEVEL_UP' THEN
    IF NEW.passed IS NULL THEN
      RAISE EXCEPTION 'Level-up assessment result passed field must be NOT NULL' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.recommended_level_id IS NOT NULL THEN
      RAISE EXCEPTION 'Level-up assessment result recommended_level_id must be NULL' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown assessment version blueprint purpose: %', v_purpose USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Lesson attempt requires AVAILABLE lesson, published revision, active course
CREATE OR REPLACE FUNCTION app.check_lesson_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_lesson_course UUID;
  v_lesson_status TEXT;
  v_rev_status TEXT;
  v_course_active BOOLEAN;
BEGIN
  SELECT availability INTO v_lesson_status FROM app.lessons WHERE id = NEW.lesson_id;
  IF v_lesson_status IS DISTINCT FROM 'AVAILABLE' THEN
    RAISE EXCEPTION 'Cannot start lesson attempt on lesson that is not AVAILABLE' USING ERRCODE = 'check_violation';
  END IF;

  SELECT course_id INTO v_ctx_course
    FROM app.learning_contexts WHERE id = NEW.context_id;

  SELECT u.course_id, c.is_active, lr.status
    INTO v_lesson_course, v_course_active, v_rev_status
    FROM app.lessons l
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
    JOIN app.lesson_revisions lr ON lr.id = NEW.lesson_revision_id
   WHERE l.id = NEW.lesson_id;

  IF v_ctx_course IS DISTINCT FROM v_lesson_course THEN
    RAISE EXCEPTION 'Lesson attempt context course does not match lesson course' USING ERRCODE = 'check_violation';
  END IF;

  IF v_course_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Cannot attempt lesson in inactive course' USING ERRCODE = 'check_violation';
  END IF;

  IF v_rev_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'Cannot attempt lesson revision that is not PUBLISHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: Guard course deactivation when AVAILABLE lessons exist
CREATE OR REPLACE FUNCTION app.guard_course_available_lessons()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    IF EXISTS (
      SELECT 1 FROM app.lessons l
      JOIN app.units u ON u.id = l.unit_id
      WHERE u.course_id = NEW.id AND l.availability = 'AVAILABLE'
    ) THEN
      RAISE EXCEPTION 'Cannot deactivate course with AVAILABLE lessons' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_deactivate_guard ON app.courses;
CREATE TRIGGER trg_course_deactivate_guard
  BEFORE UPDATE OF is_active ON app.courses
  FOR EACH ROW EXECUTE FUNCTION app.guard_course_available_lessons();

-- Fix: Guard lesson revision demotion while active for an AVAILABLE lesson
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_demote()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' AND NEW.status != 'PUBLISHED' THEN
    IF EXISTS (
      SELECT 1 FROM app.lessons
       WHERE active_revision_id = OLD.id AND availability = 'AVAILABLE'
    ) THEN
      RAISE EXCEPTION 'Cannot demote published revision while it is active for an AVAILABLE lesson'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_revision_demote_guard ON app.lesson_revisions;
CREATE TRIGGER trg_lesson_revision_demote_guard
  BEFORE UPDATE OF status ON app.lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_lesson_revision_demote();

-- Fix: Lesson completion completed_at must match first attempt completed_at
CREATE OR REPLACE FUNCTION app.check_lesson_completion_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_att_completed TIMESTAMPTZ;
BEGIN
  SELECT completed_at INTO v_att_completed
    FROM app.lesson_attempts WHERE id = NEW.first_attempt_id;

  IF NEW.completed_at IS DISTINCT FROM v_att_completed THEN
    RAISE EXCEPTION 'Lesson completion completed_at must match first attempt completed_at'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_completion_timestamp ON app.lesson_completions;
CREATE TRIGGER trg_lesson_completion_timestamp
  BEFORE INSERT ON app.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_completion_timestamp();

-- -----------------------------------------------------------------------------
-- 4. FDB-08: Item Origin / Blueprint Pin Correspondence
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.check_item_revision_origin_pins()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_origin TEXT;
BEGIN
  SELECT origin INTO v_origin FROM app.item_identities WHERE id = NEW.item_id;

  IF v_origin = 'ASSESSMENT' THEN
    IF NEW.assessment_blueprint_id IS NULL OR NEW.blueprint_generation IS NULL OR NEW.blueprint_generation <= 0 THEN
      RAISE EXCEPTION 'Item revision for ASSESSMENT item % must have nonnull positive blueprint pins', NEW.item_id
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_origin = 'PRACTICE' THEN
    IF NEW.assessment_blueprint_id IS NOT NULL OR NEW.blueprint_generation IS NOT NULL THEN
      RAISE EXCEPTION 'Item revision for PRACTICE item % must have both blueprint pins NULL', NEW.item_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_origin_pins ON app.item_revisions;
CREATE TRIGGER trg_item_revision_origin_pins
  BEFORE INSERT OR UPDATE OF item_id, assessment_blueprint_id, blueprint_generation ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.check_item_revision_origin_pins();

-- -----------------------------------------------------------------------------
-- 5. FDB-10: Baseline Privileges & Creator-Wide Defaults
-- -----------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA app, app_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app, app_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app, app_private FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA app, app_private FROM PUBLIC, anon, authenticated;


-- =============================================================================
-- START MIGRATION: 20261027030000_product_remediation
-- Path: lingora-admin/prisma/product/migrations/20261027030000_product_remediation/migration.sql
-- SHA-256: 5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6
-- =============================================================================

-- =============================================================================
-- Migration: 20261027030000_product_remediation
-- Description: Targeted remediation migration resolving FDB-01..10 remaining gaps
-- Authority: plans/2026-10-27-product-database-finalize-spec.md, review-correction.md
-- Single transactional batch with 5s lock timeout and preapply data/history assertions
-- =============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '8s';

-- -----------------------------------------------------------------------------
-- 0. Pre-apply Assertion Gates
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Assertion 1: Exact 3 finished migrations with matching local checksums
  IF (SELECT count(*) FROM app._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) != 3 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: expected exactly 3 applied migrations';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations 
    WHERE migration_name = '20261027000000_product_baseline' 
      AND checksum = '69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862'
  ) THEN
    RAISE EXCEPTION 'Pre-apply gate failed: baseline migration checksum mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations 
    WHERE migration_name = '20261027010000_product_finalize' 
      AND checksum = 'b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16'
  ) THEN
    RAISE EXCEPTION 'Pre-apply gate failed: finalize migration checksum mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations 
    WHERE migration_name = '20261027020000_product_correction' 
      AND checksum = '3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029'
  ) THEN
    RAISE EXCEPTION 'Pre-apply gate failed: correction migration checksum mismatch';
  END IF;

  -- Assertion 2: Verify existing table count (29 app + 5 app_private)
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app' AND table_name != '_prisma_migrations') != 29 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: app tables count is not 29';
  END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app_private') != 5 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: app_private tables count is not 5';
  END IF;

  -- Assertion 3: Verify no conflicting assessment_type CHECK remains
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'app.assessment_results'::regclass
      AND conname = 'assessment_results_assessment_type_check'
  ) THEN
    RAISE EXCEPTION 'Pre-apply gate failed: obsolete assessment_results_assessment_type_check still exists';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. FDB-05: Retained Freeze Boundaries & Submitted Parents
-- -----------------------------------------------------------------------------

-- Item revision DELETE guard: checks OLD.frozen_at OR authoring lesson revision submitted
CREATE OR REPLACE FUNCTION app.guard_item_revision_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM app.lesson_revisions
     WHERE id = OLD.authoring_lesson_revision_id
       AND (submitted_at IS NOT NULL OR status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
  ) THEN
    RAISE EXCEPTION 'Item revision cannot be deleted when frozen or its authoring lesson revision is submitted'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_delete ON app.item_revisions;
CREATE TRIGGER trg_item_revision_delete
  BEFORE DELETE ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_revision_delete();

-- Media binding guard: checks item frozen_at OR owning lesson revision submitted
CREATE OR REPLACE FUNCTION app.guard_media_binding_parent_frozen()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_rev_id UUID;
  v_item_rev_id UUID;
  v_submitted TIMESTAMPTZ;
  v_status TEXT;
  v_frozen TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.lesson_revision_id;
    v_item_rev_id := OLD.item_revision_id;
  ELSE
    v_rev_id := NEW.lesson_revision_id;
    v_item_rev_id := NEW.item_revision_id;
  END IF;

  IF v_rev_id IS NOT NULL THEN
    SELECT submitted_at, status INTO v_submitted, v_status
      FROM app.lesson_revisions WHERE id = v_rev_id;
    IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
      RAISE EXCEPTION 'Cannot modify media bindings of submitted or non-draft lesson revision %', v_rev_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_item_rev_id IS NOT NULL THEN
    SELECT ir.frozen_at, lr.submitted_at, lr.status
      INTO v_frozen, v_submitted, v_status
      FROM app.item_revisions ir
      JOIN app.lesson_revisions lr ON lr.id = ir.authoring_lesson_revision_id
     WHERE ir.id = v_item_rev_id;

    IF v_frozen IS NOT NULL OR v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
      RAISE EXCEPTION 'Cannot modify media bindings of frozen or submitted item revision %', v_item_rev_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.lesson_revision_id IS NOT NULL AND OLD.lesson_revision_id IS DISTINCT FROM NEW.lesson_revision_id THEN
      SELECT submitted_at, status INTO v_submitted, v_status
        FROM app.lesson_revisions WHERE id = OLD.lesson_revision_id;
      IF v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
        RAISE EXCEPTION 'Cannot reparent media binding from submitted or non-draft lesson revision %', OLD.lesson_revision_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF OLD.item_revision_id IS NOT NULL AND OLD.item_revision_id IS DISTINCT FROM NEW.item_revision_id THEN
      SELECT ir.frozen_at, lr.submitted_at, lr.status
        INTO v_frozen, v_submitted, v_status
        FROM app.item_revisions ir
        JOIN app.lesson_revisions lr ON lr.id = ir.authoring_lesson_revision_id
       WHERE ir.id = OLD.item_revision_id;

      IF v_frozen IS NOT NULL OR v_submitted IS NOT NULL OR v_status NOT IN ('DRAFT') THEN
        RAISE EXCEPTION 'Cannot reparent media binding from frozen or submitted item revision %', OLD.item_revision_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_media_binding_parent_frozen ON app.media_bindings;
CREATE TRIGGER trg_media_binding_parent_frozen
  BEFORE INSERT OR UPDATE OR DELETE ON app.media_bindings
  FOR EACH ROW EXECUTE FUNCTION app.guard_media_binding_parent_frozen();

-- Item revision INSERT guard: block insert if authoring lesson revision is already submitted/frozen
CREATE OR REPLACE FUNCTION app.guard_item_revision_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_submitted TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  SELECT submitted_at, status INTO v_submitted, v_status
    FROM app.lesson_revisions
   WHERE id = NEW.authoring_lesson_revision_id;

  IF v_submitted IS NOT NULL OR v_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
    RAISE EXCEPTION 'Cannot add item revision to submitted or frozen lesson revision %', NEW.authoring_lesson_revision_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_revision_insert ON app.item_revisions;
CREATE TRIGGER trg_item_revision_insert
  BEFORE INSERT ON app.item_revisions
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_revision_insert();

-- Lesson revision submission guard: require consistent submitted generation/scope metadata
CREATE OR REPLACE FUNCTION app.guard_lesson_revision_submitted_payload()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_submit BOOLEAN;
  v_has_core BOOLEAN;
  v_ep_gen BIGINT;
  v_ep_teacher UUID;
  v_ep_snapshot JSONB;
  v_creation_gen BIGINT;
BEGIN
  -- Transition to reviewable / approved / published requires submitted facts, generation, and scope snapshot
  IF NEW.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
    IF NEW.submitted_at IS NULL OR NEW.submitted_by IS NULL THEN
      RAISE EXCEPTION 'Lesson revision in % status requires nonnull submitted_at and submitted_by', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.submitted_assignment_generation IS NULL OR NEW.assignment_scope_snapshot IS NULL THEN
      RAISE EXCEPTION 'Lesson revision in % status requires nonnull submitted_assignment_generation and assignment_scope_snapshot', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    -- Validate against actual assignment_history episode
    SELECT scope_generation, next_teacher_id, scope_snapshot
      INTO v_ep_gen, v_ep_teacher, v_ep_snapshot
      FROM app.assignment_history
     WHERE assignment_id = NEW.assignment_id
       AND scope_generation = NEW.submitted_assignment_generation;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Submitted assignment generation % not found in assignment_history for assignment %',
        NEW.submitted_assignment_generation, NEW.assignment_id USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.submitted_by IS DISTINCT FROM v_ep_teacher THEN
      RAISE EXCEPTION 'Submitted_by % does not match assignment episode teacher %',
        NEW.submitted_by, v_ep_teacher USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_scope_snapshot IS DISTINCT FROM v_ep_snapshot THEN
      RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot does not match assignment episode scope_snapshot'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT scope_generation INTO v_creation_gen
      FROM app.assignment_history
     WHERE id = NEW.creation_assignment_episode_id;

    IF v_creation_gen IS NOT NULL AND NEW.submitted_assignment_generation < v_creation_gen THEN
      RAISE EXCEPTION 'Submitted assignment generation % cannot be older than creation episode generation %',
        NEW.submitted_assignment_generation, v_creation_gen USING ERRCODE = 'check_violation';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM app.lesson_exercises
       WHERE lesson_revision_id = NEW.id AND is_core = true
    ) INTO v_has_core;

    IF NOT v_has_core THEN
      RAISE EXCEPTION 'Lesson revision in % status requires at least one core exercise', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Monotonic submitted_at: once set, cannot be cleared or changed
  IF OLD.submitted_at IS NOT NULL AND (NEW.submitted_at IS NULL OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN
    RAISE EXCEPTION 'Lesson revision submitted_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic submitted_by: once set, cannot be cleared or changed
  IF OLD.submitted_by IS NOT NULL AND (NEW.submitted_by IS NULL OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by) THEN
    RAISE EXCEPTION 'Lesson revision submitted_by cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic submitted_assignment_generation
  IF OLD.submitted_assignment_generation IS NOT NULL AND (NEW.submitted_assignment_generation IS NULL OR NEW.submitted_assignment_generation IS DISTINCT FROM OLD.submitted_assignment_generation) THEN
    RAISE EXCEPTION 'Lesson revision submitted_assignment_generation cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic assignment_scope_snapshot
  IF OLD.assignment_scope_snapshot IS NOT NULL AND (NEW.assignment_scope_snapshot IS NULL OR NEW.assignment_scope_snapshot IS DISTINCT FROM OLD.assignment_scope_snapshot) THEN
    RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Monotonic approved_at / published_at
  IF OLD.approved_at IS NOT NULL AND (NEW.approved_at IS NULL OR NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
    RAISE EXCEPTION 'Lesson revision approved_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.published_at IS NOT NULL AND (NEW.published_at IS NULL OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
    RAISE EXCEPTION 'Lesson revision published_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- Check if revision was ever submitted
  v_has_submit := (OLD.submitted_at IS NOT NULL) OR (OLD.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')) OR EXISTS (
    SELECT 1 FROM app.revision_reviews
     WHERE lesson_revision_id = OLD.id AND action = 'SUBMIT'
  );

  IF v_has_submit THEN
    IF NEW.status = 'DRAFT' THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision cannot return to DRAFT status' USING ERRCODE = 'check_violation';
    END IF;

    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.content_blocks IS DISTINCT FROM NEW.content_blocks OR
       OLD.topic_ids IS DISTINCT FROM NEW.topic_ids OR
       OLD.skill_ids IS DISTINCT FROM NEW.skill_ids OR
       OLD.purpose_tags IS DISTINCT FROM NEW.purpose_tags OR
       OLD.coverage_catalog_generation IS DISTINCT FROM NEW.coverage_catalog_generation OR
       OLD.coverage_snapshot IS DISTINCT FROM NEW.coverage_snapshot OR
       OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'Lesson revision identity and provenance are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
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

-- Review provenance trigger: validates SUBMIT actor and scope against assignment episode
CREATE OR REPLACE FUNCTION app.check_revision_review_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_ep_gen BIGINT;
  v_next_teacher_id UUID;
  v_sub_by UUID;
  v_sub_at TIMESTAMPTZ;
  v_sub_gen BIGINT;
  v_ep_snapshot JSONB;
  v_lr_snapshot JSONB;
BEGIN
  IF NEW.lesson_revision_id IS NOT NULL THEN
    SELECT assignment_id, submitted_by, submitted_at, submitted_assignment_generation, assignment_scope_snapshot
      INTO v_lesson_assign_id, v_sub_by, v_sub_at, v_sub_gen, v_lr_snapshot
      FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;

    SELECT assignment_id, scope_generation, next_teacher_id, scope_snapshot
      INTO v_ep_assign_id, v_ep_gen, v_next_teacher_id, v_ep_snapshot
      FROM app.assignment_history WHERE id = NEW.assignment_episode_id;

    IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
      RAISE EXCEPTION 'Review episode assignment % does not match lesson assignment %',
        v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.action = 'SUBMIT' THEN
      IF NEW.actor_id IS DISTINCT FROM v_next_teacher_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % must match episode teacher %',
          NEW.actor_id, v_next_teacher_id USING ERRCODE = 'check_violation';
      END IF;
      IF v_sub_by IS NOT NULL AND v_sub_by IS DISTINCT FROM NEW.actor_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % does not match lesson revision submitted_by %',
          NEW.actor_id, v_sub_by USING ERRCODE = 'check_violation';
      END IF;
      IF v_sub_at IS NULL THEN
        RAISE EXCEPTION 'Lesson revision must have submitted_at timestamp when SUBMIT review is recorded'
          USING ERRCODE = 'check_violation';
      END IF;
      IF v_sub_gen IS NOT NULL AND v_sub_gen IS DISTINCT FROM v_ep_gen THEN
        RAISE EXCEPTION 'Lesson revision submitted_assignment_generation % does not match review episode scope_generation %',
          v_sub_gen, v_ep_gen USING ERRCODE = 'check_violation';
      END IF;
      IF v_lr_snapshot IS NOT NULL AND v_lr_snapshot IS DISTINCT FROM v_ep_snapshot THEN
        RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot does not match review episode scope_snapshot'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revision_review_provenance ON app.revision_reviews;
CREATE TRIGGER trg_revision_review_provenance
  BEFORE INSERT OR UPDATE OF lesson_revision_id, assignment_episode_id, action, actor_id ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.check_revision_review_provenance();

-- -----------------------------------------------------------------------------
-- 2. FDB-06: Minimal Validated Storage & Assignment Envelope
-- -----------------------------------------------------------------------------

-- Snapshot shape trigger on assessment_versions: binds to actual blueprint scope at assembly
CREATE OR REPLACE FUNCTION app.check_assessment_version_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_bp_course UUID;
  v_bp_lang UUID;
  v_bp_fw UUID;
  v_bp_purpose TEXT;
  v_bp_target_level UUID;
  v_bp_next_level UUID;
  v_bp_generation BIGINT;
BEGIN
  IF NEW.blueprint_snapshot IS NULL OR jsonb_typeof(NEW.blueprint_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot must be a JSON object' USING ERRCODE = 'check_violation';
  END IF;

  -- Required envelope keys per spec §4.3 and physical catalog
  IF (NEW.blueprint_snapshot->>'blueprint_id') IS NULL OR
     (NEW.blueprint_snapshot->>'blueprint_generation') IS NULL OR
     (NEW.blueprint_snapshot->>'course_id') IS NULL OR
     (NEW.blueprint_snapshot->>'language_id') IS NULL OR
     (NEW.blueprint_snapshot->>'framework_id') IS NULL OR
     (NEW.blueprint_snapshot->>'purpose') IS NULL OR
     (NEW.blueprint_snapshot->>'schema_version') IS NULL OR
     NOT (NEW.blueprint_snapshot ? 'coverage_catalog_generation') OR
     NOT (NEW.blueprint_snapshot ? 'config') OR
     NOT (NEW.blueprint_snapshot ? 'target_level_id') OR
     NOT (NEW.blueprint_snapshot ? 'next_level_id') THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot missing required envelope keys (blueprint_id, blueprint_generation, course_id, language_id, framework_id, purpose, schema_version, coverage_catalog_generation, config, target_level_id, next_level_id)'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Read and bind against actual blueprint row at assembly
  SELECT bp.course_id, c.language_id, c.framework_id, bp.purpose, bp.target_level_id, bp.next_level_id, bp.generation
    INTO v_bp_course, v_bp_lang, v_bp_fw, v_bp_purpose, v_bp_target_level, v_bp_next_level, v_bp_generation
    FROM app.assessment_blueprints bp
    JOIN app.courses c ON c.id = bp.course_id
   WHERE bp.id = NEW.blueprint_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment blueprint % not found', NEW.blueprint_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.blueprint_generation IS DISTINCT FROM v_bp_generation THEN
    RAISE EXCEPTION 'Assessment version blueprint_generation % does not match blueprint current generation %',
      NEW.blueprint_generation, v_bp_generation USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->>'blueprint_id')::UUID IS DISTINCT FROM NEW.blueprint_id OR
     (NEW.blueprint_snapshot->>'blueprint_generation')::BIGINT IS DISTINCT FROM NEW.blueprint_generation OR
     (NEW.blueprint_snapshot->>'course_id')::UUID IS DISTINCT FROM v_bp_course OR
     (NEW.blueprint_snapshot->>'language_id')::UUID IS DISTINCT FROM v_bp_lang OR
     (NEW.blueprint_snapshot->>'framework_id')::UUID IS DISTINCT FROM v_bp_fw OR
     (NEW.blueprint_snapshot->>'purpose') IS DISTINCT FROM v_bp_purpose THEN
    RAISE EXCEPTION 'Assessment version snapshot scope does not match actual blueprint scope'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->>'target_level_id')::UUID IS DISTINCT FROM v_bp_target_level OR
     (NEW.blueprint_snapshot->>'next_level_id')::UUID IS DISTINCT FROM v_bp_next_level THEN
    RAISE EXCEPTION 'Assessment version snapshot target/next levels do not match actual blueprint levels'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_snapshot_shape ON app.assessment_versions;
CREATE TRIGGER trg_assessment_version_snapshot_shape
  BEFORE INSERT OR UPDATE OF blueprint_snapshot, blueprint_id, blueprint_generation ON app.assessment_versions
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_snapshot();

-- -----------------------------------------------------------------------------
-- 3. FDB-07: Scope & Context Invariants
-- -----------------------------------------------------------------------------

-- Restore check_lesson_attempt_scope: active revision match, available status, active course
CREATE OR REPLACE FUNCTION app.check_lesson_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_lesson_course UUID;
  v_lesson_status TEXT;
  v_active_rev_id UUID;
  v_course_active BOOLEAN;
  v_rev_status TEXT;
BEGIN
  SELECT availability, active_revision_id INTO v_lesson_status, v_active_rev_id
    FROM app.lessons WHERE id = NEW.lesson_id;

  IF v_lesson_status IS DISTINCT FROM 'AVAILABLE' THEN
    RAISE EXCEPTION 'Cannot start lesson attempt on lesson that is not AVAILABLE' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.lesson_revision_id IS DISTINCT FROM v_active_rev_id THEN
    RAISE EXCEPTION 'Lesson attempt revision % must match lesson active revision %',
      NEW.lesson_revision_id, v_active_rev_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT course_id INTO v_ctx_course
    FROM app.learning_contexts WHERE id = NEW.context_id;

  SELECT u.course_id, c.is_active, lr.status
    INTO v_lesson_course, v_course_active, v_rev_status
    FROM app.lessons l
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
    JOIN app.lesson_revisions lr ON lr.id = NEW.lesson_revision_id
   WHERE l.id = NEW.lesson_id;

  IF v_ctx_course IS DISTINCT FROM v_lesson_course THEN
    RAISE EXCEPTION 'Lesson attempt context course does not match lesson course' USING ERRCODE = 'check_violation';
  END IF;

  IF v_course_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Cannot attempt lesson in inactive course' USING ERRCODE = 'check_violation';
  END IF;

  IF v_rev_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'Cannot attempt lesson revision that is not PUBLISHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_attempt_scope ON app.lesson_attempts;
CREATE TRIGGER trg_lesson_attempt_scope
  BEFORE INSERT ON app.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_attempt_scope();

-- Lesson availability guard: setting AVAILABLE requires active course
CREATE OR REPLACE FUNCTION app.check_lesson_available_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status TEXT;
  v_course_active BOOLEAN;
BEGIN
  IF NEW.availability = 'AVAILABLE' THEN
    IF NEW.active_revision_id IS NULL THEN
      RAISE EXCEPTION 'AVAILABLE lesson % requires a non-null active_revision_id', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT status INTO v_status
      FROM app.lesson_revisions
     WHERE id = NEW.active_revision_id AND lesson_id = NEW.id;

    IF v_status IS NULL OR v_status != 'PUBLISHED' THEN
      RAISE EXCEPTION 'AVAILABLE lesson % active revision must be PUBLISHED (got %)', NEW.id, COALESCE(v_status, 'NOT FOUND')
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT c.is_active INTO v_course_active
      FROM app.units u
      JOIN app.courses c ON c.id = u.course_id
     WHERE u.id = NEW.unit_id;

    IF v_course_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Cannot set lesson % availability to AVAILABLE in an inactive course', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_available_revision ON app.lessons;
CREATE TRIGGER trg_lesson_available_revision
  BEFORE INSERT OR UPDATE OF availability, active_revision_id, unit_id ON app.lessons
  FOR EACH ROW EXECUTE FUNCTION app.check_lesson_available_revision();

-- Assessment blueprint immutable scope: freeze target_level_id & next_level_id once versions exist
CREATE OR REPLACE FUNCTION app.guard_assessment_blueprint_immutable_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.course_id IS DISTINCT FROM NEW.course_id OR
     OLD.language_id IS DISTINCT FROM NEW.language_id OR
     OLD.framework_id IS DISTINCT FROM NEW.framework_id OR
     OLD.purpose IS DISTINCT FROM NEW.purpose OR
     OLD.target_level_id IS DISTINCT FROM NEW.target_level_id OR
     OLD.next_level_id IS DISTINCT FROM NEW.next_level_id THEN
    IF EXISTS (SELECT 1 FROM app.assessment_versions WHERE blueprint_id = OLD.id) THEN
      RAISE EXCEPTION 'Assessment blueprint scope, purpose, and level targets are immutable once versions exist'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_blueprint_immutable_scope ON app.assessment_blueprints;
CREATE TRIGGER trg_assessment_blueprint_immutable_scope
  BEFORE UPDATE ON app.assessment_blueprints
  FOR EACH ROW EXECUTE FUNCTION app.guard_assessment_blueprint_immutable_scope();

-- Referenced level framework edits: check courses, units, contexts, blueprints, and results
CREATE OR REPLACE FUNCTION app.guard_framework_level_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.framework_id IS DISTINCT FROM NEW.framework_id THEN
    IF EXISTS (SELECT 1 FROM app.courses WHERE default_start_level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.units WHERE level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.learning_contexts WHERE selected_start_level_id = OLD.id OR working_level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.assessment_blueprints WHERE target_level_id = OLD.id OR next_level_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.assessment_results WHERE recommended_level_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change framework_id of level referenced by courses, units, contexts, blueprints, or results'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_framework_level_scope ON app.levels;
CREATE TRIGGER trg_framework_level_scope
  BEFORE UPDATE OF framework_id ON app.levels
  FOR EACH ROW EXECUTE FUNCTION app.guard_framework_level_scope();

-- Assessment attempt start check: binds framework and level transitions
CREATE OR REPLACE FUNCTION app.check_assessment_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ctx_course UUID;
  v_ctx_lang UUID;
  v_ctx_fw UUID;
  v_ctx_working_level UUID;
  v_snap_course UUID;
  v_snap_lang UUID;
  v_snap_fw UUID;
  v_snap_purpose TEXT;
  v_target_level UUID;
  v_snapshot JSONB;
BEGIN
  SELECT lc.course_id, lc.language_id, lc.working_level_id, c.framework_id
    INTO v_ctx_course, v_ctx_lang, v_ctx_working_level, v_ctx_fw
    FROM app.learning_contexts lc
    JOIN app.courses c ON c.id = lc.course_id
   WHERE lc.id = NEW.context_id;

  SELECT av.blueprint_snapshot INTO v_snapshot
    FROM app.assessment_versions av
   WHERE av.id = NEW.assessment_version_id;

  IF v_snapshot IS NULL OR jsonb_typeof(v_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint snapshot missing or invalid' USING ERRCODE = 'check_violation';
  END IF;

  v_snap_course := (v_snapshot->>'course_id')::UUID;
  v_snap_lang := (v_snapshot->>'language_id')::UUID;
  v_snap_fw := (v_snapshot->>'framework_id')::UUID;
  v_snap_purpose := (v_snapshot->>'purpose');

  IF v_ctx_course IS DISTINCT FROM v_snap_course OR
     v_ctx_lang IS DISTINCT FROM v_snap_lang OR
     v_ctx_fw IS DISTINCT FROM v_snap_fw THEN
    RAISE EXCEPTION 'Assessment attempt context curriculum/framework does not match pinned assessment version snapshot'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Level-up attempt transition check
  IF v_snap_purpose = 'LEVEL_UP' THEN
    v_target_level := (v_snapshot->>'target_level_id')::UUID;
    IF v_target_level IS NOT NULL AND v_ctx_working_level IS NOT NULL AND v_ctx_working_level IS DISTINCT FROM v_target_level THEN
      RAISE EXCEPTION 'Level-up assessment attempt context working level % does not match target level %',
        v_ctx_working_level, v_target_level USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_attempt_scope ON app.assessment_attempts;
CREATE TRIGGER trg_assessment_attempt_scope
  BEFORE INSERT ON app.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_attempt_scope();

-- -----------------------------------------------------------------------------
-- 4. FDB-08: Item Identity Origin Changes & Revision Compatibility
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.guard_item_identity_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_frozen BOOLEAN;
BEGIN
  IF OLD.origin IS DISTINCT FROM NEW.origin THEN
    IF EXISTS (SELECT 1 FROM app.assessment_version_items WHERE item_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_exercises WHERE item_id = OLD.id) THEN
      RAISE EXCEPTION 'Item identity origin cannot be changed when referenced by exercises or assessment items'
        USING ERRCODE = 'check_violation';
    END IF;

    -- Validate that existing item revisions are compatible with the new origin
    IF NEW.origin = 'PRACTICE' AND EXISTS (
      SELECT 1 FROM app.item_revisions
       WHERE item_id = OLD.id
         AND (assessment_blueprint_id IS NOT NULL OR blueprint_generation IS NOT NULL)
    ) THEN
      RAISE EXCEPTION 'Cannot change item identity origin to PRACTICE when existing revisions have blueprint pins'
        USING ERRCODE = 'check_violation';
    ELSIF NEW.origin = 'ASSESSMENT' AND EXISTS (
      SELECT 1 FROM app.item_revisions
       WHERE item_id = OLD.id
         AND (assessment_blueprint_id IS NULL OR blueprint_generation IS NULL)
    ) THEN
      RAISE EXCEPTION 'Cannot change item identity origin to ASSESSMENT when existing revisions lack blueprint pins'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF OLD.created_by IS DISTINCT FROM NEW.created_by OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Item identity created_by and created_at are immutable' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.variant_of_id IS DISTINCT FROM NEW.variant_of_id OR OLD.exact_fingerprint IS DISTINCT FROM NEW.exact_fingerprint THEN
    SELECT EXISTS (
      SELECT 1 FROM app.item_revisions ir
       WHERE ir.item_id = OLD.id
         AND (ir.frozen_at IS NOT NULL OR EXISTS (
           SELECT 1 FROM app.lesson_revisions lr
            WHERE lr.id = ir.authoring_lesson_revision_id
              AND (lr.submitted_at IS NOT NULL OR lr.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
         ))
    ) INTO v_has_frozen;

    IF v_has_frozen THEN
      RAISE EXCEPTION 'Item identity variant_of_id and exact_fingerprint are immutable once revisions are frozen or submitted'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_identity_update ON app.item_identities;
CREATE TRIGGER trg_item_identity_update
  BEFORE UPDATE ON app.item_identities
  FOR EACH ROW EXECUTE FUNCTION app.guard_item_identity_update();

COMMIT;


-- =============================================================================
-- START MIGRATION: 20261028000000_product_remaining_repair
-- Path: lingora-admin/prisma/product/migrations/20261028000000_product_remaining_repair/migration.sql
-- SHA-256: c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75
-- =============================================================================

-- =============================================================================
-- Migration: 20261028000000_product_remaining_repair
-- Authority: plans/2026-10-28-database-remaining-repair-spec.md
-- Resolves: PRE-01, PRE-02, PRE-03, PRE-04
--           FDB-05 (Freeze Boundaries & Prior Revision / Created At Pins)
--           FDB-06 (Minimal Validated Storage & Assignment Envelope Review Correspondence)
-- Invariants: Retains all 4 applied migrations immutable; transactional BEGIN/COMMIT
--             Local statement & lock timeouts; preflight & postflight assertions
-- =============================================================================

BEGIN;

SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '5s';

-- -----------------------------------------------------------------------------
-- Step 1: Preflight Assertions (PRE-04)
-- Strict migration history validation and transactional data integrity assertions
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_base_ck TEXT := '69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862';
  v_fin_ck TEXT  := 'b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16';
  v_cor_ck TEXT  := '3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029';
  v_rem_ck TEXT  := '5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6';
  v_rep_name TEXT := '20261028000000_product_remaining_repair';
  v_total_migs INT;
  v_row RECORD;
  v_idx INT := 0;
  v_invalid_rows INT;
BEGIN
  -- 1. Exact migration history count: must be either 4 finished migrations (pre-deploy)
  --    OR 5 migrations where 5th is the current in-progress migration from Prisma.
  SELECT count(*) INTO v_total_migs FROM app._prisma_migrations;
  IF v_total_migs NOT IN (4, 5) THEN
    RAISE EXCEPTION 'Preflight assertion failed: expected 4 or 5 migrations in history, found %', v_total_migs;
  END IF;

  FOR v_row IN SELECT migration_name, checksum, finished_at, rolled_back_at 
                 FROM app._prisma_migrations 
                ORDER BY started_at ASC LOOP
    v_idx := v_idx + 1;
    IF v_row.rolled_back_at IS NOT NULL THEN
      RAISE EXCEPTION 'Preflight assertion failed: migration % is rolled back', v_row.migration_name;
    END IF;

    IF v_idx = 1 THEN
      IF v_row.migration_name != '20261027000000_product_baseline' OR v_row.checksum != v_base_ck OR v_row.finished_at IS NULL THEN
        RAISE EXCEPTION 'Preflight assertion failed: baseline migration verification failed';
      END IF;
    ELSIF v_idx = 2 THEN
      IF v_row.migration_name != '20261027010000_product_finalize' OR v_row.checksum != v_fin_ck OR v_row.finished_at IS NULL THEN
        RAISE EXCEPTION 'Preflight assertion failed: finalize migration verification failed';
      END IF;
    ELSIF v_idx = 3 THEN
      IF v_row.migration_name != '20261027020000_product_correction' OR v_row.checksum != v_cor_ck OR v_row.finished_at IS NULL THEN
        RAISE EXCEPTION 'Preflight assertion failed: correction migration verification failed';
      END IF;
    ELSIF v_idx = 4 THEN
      IF v_row.migration_name != '20261027030000_product_remediation' OR v_row.checksum != v_rem_ck OR v_row.finished_at IS NULL THEN
        RAISE EXCEPTION 'Preflight assertion failed: remediation migration verification failed';
      END IF;
    ELSIF v_idx = 5 THEN
      IF v_row.migration_name != v_rep_name THEN
        RAISE EXCEPTION 'Preflight assertion failed: unexpected 5th migration name % (expected %)', v_row.migration_name, v_rep_name;
      END IF;
    END IF;
  END LOOP;

  -- 2. Exact 34 product tables count (29 app + 5 app_private)
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app' AND table_name != '_prisma_migrations') != 29 THEN
    RAISE EXCEPTION 'Preflight assertion failed: app tables count is not 29';
  END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app_private') != 5 THEN
    RAISE EXCEPTION 'Preflight assertion failed: app_private tables count is not 5';
  END IF;

  -- 3. Transactional data integrity assertions (PRE-04)
  -- 3a. Check no submitted lesson revisions lack required submission facts
  SELECT count(*) INTO v_invalid_rows
    FROM app.lesson_revisions
   WHERE status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')
     AND (submitted_at IS NULL OR submitted_by IS NULL OR 
          submitted_assignment_generation IS NULL OR assignment_scope_snapshot IS NULL);
  IF v_invalid_rows > 0 THEN
    RAISE EXCEPTION 'Preflight data gate failed: % submitted lesson revisions lack required submission facts', v_invalid_rows;
  END IF;

  -- 3b. Check no assessment results have invalid points bounds
  SELECT count(*) INTO v_invalid_rows
    FROM app.assessment_results
   WHERE raw_points < 0 OR possible_points <= 0 OR raw_points > possible_points;
  IF v_invalid_rows > 0 THEN
    RAISE EXCEPTION 'Preflight data gate failed: % assessment results violate points bounds', v_invalid_rows;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 2: PRE-03 — Assignment History Scope Snapshot Guard at Episode Creation
-- Validates requirement, scope, lesson_id, generation, and safe UUID/integer casts
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.guard_assignment_history_scope_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_assign_lesson_id UUID;
  v_assign_req JSONB;
  v_assign_scope JSONB;
  v_assign_gen BIGINT;
  v_s JSONB := NEW.scope_snapshot;
  v_ver_str TEXT;
  v_lesson_str TEXT;
BEGIN
  IF v_s IS NULL OR jsonb_typeof(v_s) != 'object' THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot must be a JSON object'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 1. Envelope required keys check
  IF NOT (v_s ? 'schema_version') OR
     NOT (v_s ? 'lesson_id') OR
     NOT (v_s ? 'requirement') OR
     NOT (v_s ? 'scope') THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot missing required envelope keys (schema_version, lesson_id, requirement, scope)'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2. Validate types and format BEFORE any cast (PRE-03)
  IF jsonb_typeof(v_s->'schema_version') != 'number' THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot schema_version must be a number'
      USING ERRCODE = 'check_violation';
  END IF;

  v_ver_str := v_s->>'schema_version';
  IF v_ver_str !~ '^[0-9]+$' OR v_ver_str::int != 1 THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot schema_version must be integer 1'
      USING ERRCODE = 'check_violation';
  END IF;

  IF jsonb_typeof(v_s->'lesson_id') != 'string' THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot lesson_id must be a string'
      USING ERRCODE = 'check_violation';
  END IF;

  v_lesson_str := v_s->>'lesson_id';
  IF v_lesson_str !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot lesson_id has invalid UUID format: %', v_lesson_str
      USING ERRCODE = 'check_violation';
  END IF;

  IF jsonb_typeof(v_s->'requirement') != 'object' OR
     jsonb_typeof(v_s->'scope') != 'object' THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot requirement and scope must be JSON objects'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Bind against actual parent content_assignment record
  SELECT lesson_id, requirement, scope, scope_generation
    INTO v_assign_lesson_id, v_assign_req, v_assign_scope, v_assign_gen
    FROM app.content_assignments
   WHERE id = NEW.assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content assignment % not found', NEW.assignment_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_lesson_str::uuid IS DISTINCT FROM v_assign_lesson_id THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot lesson_id % does not match assignment lesson %',
      v_lesson_str, v_assign_lesson_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.scope_generation IS DISTINCT FROM v_assign_gen THEN
    RAISE EXCEPTION 'Assignment history scope_generation % does not match assignment scope_generation %',
      NEW.scope_generation, v_assign_gen
      USING ERRCODE = 'check_violation';
  END IF;

  IF (v_s->'requirement') IS DISTINCT FROM v_assign_req THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot requirement does not match assignment requirement'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (v_s->'scope') IS DISTINCT FROM v_assign_scope THEN
    RAISE EXCEPTION 'Assignment history scope_snapshot scope does not match assignment scope'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assignment_history_scope_snapshot ON app.assignment_history;
CREATE TRIGGER trg_assignment_history_scope_snapshot
  BEFORE INSERT ON app.assignment_history
  FOR EACH ROW EXECUTE FUNCTION app.guard_assignment_history_scope_snapshot();

-- -----------------------------------------------------------------------------
-- Step 3: PRE-01 — Restore Complete Lesson Revision Submitted Payload Guard
-- Preserves complete predecessor submission, monotonic, and freeze logic,
-- adds prior_revision_id and created_at freeze, and preserves permitted lifecycle.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.guard_lesson_revision_submitted_payload()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_has_submit BOOLEAN;
  v_has_core BOOLEAN;
  v_ep_gen BIGINT;
  v_ep_teacher UUID;
  v_ep_snapshot JSONB;
  v_creation_gen BIGINT;
BEGIN
  -- 1. Transition to reviewable / approved / published requires submitted facts, generation, and scope snapshot
  IF NEW.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED') THEN
    IF NEW.submitted_at IS NULL OR NEW.submitted_by IS NULL THEN
      RAISE EXCEPTION 'Lesson revision in % status requires nonnull submitted_at and submitted_by', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.submitted_assignment_generation IS NULL OR NEW.assignment_scope_snapshot IS NULL THEN
      RAISE EXCEPTION 'Lesson revision in % status requires nonnull submitted_assignment_generation and assignment_scope_snapshot', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    -- Validate against actual assignment_history episode
    SELECT scope_generation, next_teacher_id, scope_snapshot
      INTO v_ep_gen, v_ep_teacher, v_ep_snapshot
      FROM app.assignment_history
     WHERE assignment_id = NEW.assignment_id
       AND scope_generation = NEW.submitted_assignment_generation;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Submitted assignment generation % not found in assignment_history for assignment %',
        NEW.submitted_assignment_generation, NEW.assignment_id USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.submitted_by IS DISTINCT FROM v_ep_teacher THEN
      RAISE EXCEPTION 'Submitted_by % does not match assignment episode teacher %',
        NEW.submitted_by, v_ep_teacher USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_scope_snapshot IS DISTINCT FROM v_ep_snapshot THEN
      RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot does not match assignment episode scope_snapshot'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT scope_generation INTO v_creation_gen
      FROM app.assignment_history
     WHERE id = NEW.creation_assignment_episode_id;

    IF v_creation_gen IS NOT NULL AND NEW.submitted_assignment_generation < v_creation_gen THEN
      RAISE EXCEPTION 'Submitted assignment generation % cannot be older than creation episode generation %',
        NEW.submitted_assignment_generation, v_creation_gen USING ERRCODE = 'check_violation';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM app.lesson_exercises
       WHERE lesson_revision_id = NEW.id AND is_core = true
    ) INTO v_has_core;

    IF NOT v_has_core THEN
      RAISE EXCEPTION 'Lesson revision in % status requires at least one core exercise', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- 2. Monotonic submitted_at: once set, cannot be cleared or modified
  IF OLD.submitted_at IS NOT NULL AND (NEW.submitted_at IS NULL OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN
    RAISE EXCEPTION 'Lesson revision submitted_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Monotonic submitted_by: once set, cannot be cleared or changed
  IF OLD.submitted_by IS NOT NULL AND (NEW.submitted_by IS NULL OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by) THEN
    RAISE EXCEPTION 'Lesson revision submitted_by cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Monotonic submitted_assignment_generation
  IF OLD.submitted_assignment_generation IS NOT NULL AND (NEW.submitted_assignment_generation IS NULL OR NEW.submitted_assignment_generation IS DISTINCT FROM OLD.submitted_assignment_generation) THEN
    RAISE EXCEPTION 'Lesson revision submitted_assignment_generation cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- 5. Monotonic assignment_scope_snapshot
  IF OLD.assignment_scope_snapshot IS NOT NULL AND (NEW.assignment_scope_snapshot IS NULL OR NEW.assignment_scope_snapshot IS DISTINCT FROM OLD.assignment_scope_snapshot) THEN
    RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- 6. Monotonic approved_at / published_at
  IF OLD.approved_at IS NOT NULL AND (NEW.approved_at IS NULL OR NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
    RAISE EXCEPTION 'Lesson revision approved_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.published_at IS NOT NULL AND (NEW.published_at IS NULL OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
    RAISE EXCEPTION 'Lesson revision published_at cannot be cleared or modified' USING ERRCODE = 'check_violation';
  END IF;

  -- 7. Check if revision was ever submitted
  v_has_submit := (OLD.submitted_at IS NOT NULL) OR (OLD.status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')) OR EXISTS (
    SELECT 1 FROM app.revision_reviews
     WHERE lesson_revision_id = OLD.id AND action = 'SUBMIT'
  );

  IF v_has_submit THEN
    IF NEW.status = 'DRAFT' THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision cannot return to DRAFT status' USING ERRCODE = 'check_violation';
    END IF;

    -- Freeze check: all authored payload AND all provenance pins (including prior_revision_id and created_at)
    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.content_blocks IS DISTINCT FROM NEW.content_blocks OR
       OLD.topic_ids IS DISTINCT FROM NEW.topic_ids OR
       OLD.skill_ids IS DISTINCT FROM NEW.skill_ids OR
       OLD.purpose_tags IS DISTINCT FROM NEW.purpose_tags OR
       OLD.coverage_catalog_generation IS DISTINCT FROM NEW.coverage_catalog_generation OR
       OLD.coverage_snapshot IS DISTINCT FROM NEW.coverage_snapshot OR
       OLD.prior_revision_id IS DISTINCT FROM NEW.prior_revision_id OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Ever-submitted lesson revision authored payload is frozen' USING ERRCODE = 'check_violation';
    END IF;

    IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'Lesson revision identity and provenance are immutable' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
       OLD.assignment_id IS DISTINCT FROM NEW.assignment_id OR
       OLD.creation_assignment_episode_id IS DISTINCT FROM NEW.creation_assignment_episode_id OR
       OLD.revision_no IS DISTINCT FROM NEW.revision_no OR
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
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

-- -----------------------------------------------------------------------------
-- Step 4: PRE-03 — Review Provenance, Row Generation/Snapshot Correspondence
-- Validates review-row generation and snapshot against assignment episode,
-- validates assignment envelope with regex protection against incidental 22P02,
-- and enforces strict SUBMIT provenance.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.check_revision_review_provenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lesson_id UUID;
  v_lesson_assign_id UUID;
  v_ep_assign_id UUID;
  v_ep_gen BIGINT;
  v_next_teacher_id UUID;
  v_sub_by UUID;
  v_sub_at TIMESTAMPTZ;
  v_sub_gen BIGINT;
  v_ep_snapshot JSONB;
  v_lr_snapshot JSONB;
  v_version_bp_gen BIGINT;
  v_ver_str TEXT;
  v_lesson_str TEXT;
BEGIN
  IF NEW.lesson_revision_id IS NOT NULL THEN
    IF NEW.assessment_version_id IS NOT NULL THEN
      RAISE EXCEPTION 'Revision review cannot reference both a lesson revision and an assessment version'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.blueprint_generation IS NOT NULL THEN
      RAISE EXCEPTION 'Lesson revision review must have null blueprint_generation'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_episode_id IS NULL THEN
      RAISE EXCEPTION 'Lesson revision review requires assignment_episode_id'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT lesson_id, assignment_id, submitted_by, submitted_at, submitted_assignment_generation, assignment_scope_snapshot
      INTO v_lesson_id, v_lesson_assign_id, v_sub_by, v_sub_at, v_sub_gen, v_lr_snapshot
      FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;

    SELECT assignment_id, scope_generation, next_teacher_id, scope_snapshot
      INTO v_ep_assign_id, v_ep_gen, v_next_teacher_id, v_ep_snapshot
      FROM app.assignment_history WHERE id = NEW.assignment_episode_id;

    IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
      RAISE EXCEPTION 'Review episode assignment % does not match lesson assignment %',
        v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
    END IF;

    -- Validate NEW review row pins against episode authority
    IF NEW.assignment_generation IS DISTINCT FROM v_ep_gen THEN
      RAISE EXCEPTION 'Review assignment_generation % does not match episode scope_generation %',
        NEW.assignment_generation, v_ep_gen USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_scope_snapshot IS DISTINCT FROM v_ep_snapshot THEN
      RAISE EXCEPTION 'Review assignment_scope_snapshot does not match episode scope_snapshot'
        USING ERRCODE = 'check_violation';
    END IF;

    -- Validate assignment envelope shape in episode snapshot (PRE-03: safe format checks before cast)
    IF v_ep_snapshot IS NULL OR jsonb_typeof(v_ep_snapshot) != 'object' THEN
      RAISE EXCEPTION 'Assignment scope snapshot must be a JSON object' USING ERRCODE = 'check_violation';
    END IF;

    IF NOT (v_ep_snapshot ? 'schema_version') OR jsonb_typeof(v_ep_snapshot->'schema_version') != 'number' THEN
      RAISE EXCEPTION 'Assignment scope snapshot requires numeric schema_version' USING ERRCODE = 'check_violation';
    END IF;

    v_ver_str := v_ep_snapshot->>'schema_version';
    IF v_ver_str !~ '^[0-9]+$' OR v_ver_str::int != 1 THEN
      RAISE EXCEPTION 'Assignment scope snapshot requires schema_version = 1' USING ERRCODE = 'check_violation';
    END IF;

    IF NOT (v_ep_snapshot ? 'lesson_id') OR jsonb_typeof(v_ep_snapshot->'lesson_id') != 'string' THEN
      RAISE EXCEPTION 'Assignment scope snapshot requires string lesson_id' USING ERRCODE = 'check_violation';
    END IF;

    v_lesson_str := v_ep_snapshot->>'lesson_id';
    IF v_lesson_str !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'Assignment scope snapshot lesson_id has invalid UUID format: %', v_lesson_str
        USING ERRCODE = 'check_violation';
    END IF;

    IF v_lesson_str::uuid IS DISTINCT FROM v_lesson_id THEN
      RAISE EXCEPTION 'Assignment scope snapshot lesson_id % does not match lesson %',
        v_lesson_str, v_lesson_id USING ERRCODE = 'check_violation';
    END IF;

    IF NOT (v_ep_snapshot ? 'requirement') OR jsonb_typeof(v_ep_snapshot->'requirement') != 'object' OR
       NOT (v_ep_snapshot ? 'scope') OR jsonb_typeof(v_ep_snapshot->'scope') != 'object' THEN
      RAISE EXCEPTION 'Assignment scope snapshot requires requirement and scope JSON objects'
        USING ERRCODE = 'check_violation';
    END IF;

    -- If action is SUBMIT, strictly enforce complete submitted provenance
    IF NEW.action = 'SUBMIT' THEN
      IF NEW.actor_id IS DISTINCT FROM v_next_teacher_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % must match episode teacher %',
          NEW.actor_id, v_next_teacher_id USING ERRCODE = 'check_violation';
      END IF;

      IF v_sub_by IS NULL OR v_sub_by IS DISTINCT FROM NEW.actor_id THEN
        RAISE EXCEPTION 'SUBMIT review actor % does not match lesson revision submitted_by %',
          NEW.actor_id, v_sub_by USING ERRCODE = 'check_violation';
      END IF;

      IF v_sub_at IS NULL THEN
        RAISE EXCEPTION 'Lesson revision must have submitted_at timestamp when SUBMIT review is recorded'
          USING ERRCODE = 'check_violation';
      END IF;

      IF v_sub_gen IS NULL OR v_sub_gen IS DISTINCT FROM v_ep_gen THEN
        RAISE EXCEPTION 'Lesson revision submitted_assignment_generation % does not match review episode scope_generation %',
          v_sub_gen, v_ep_gen USING ERRCODE = 'check_violation';
      END IF;

      IF v_lr_snapshot IS NULL OR v_lr_snapshot IS DISTINCT FROM v_ep_snapshot THEN
        RAISE EXCEPTION 'Lesson revision assignment_scope_snapshot does not match review episode scope_snapshot'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

  ELSIF NEW.assessment_version_id IS NOT NULL THEN
    IF NEW.lesson_revision_id IS NOT NULL THEN
      RAISE EXCEPTION 'Revision review cannot reference both a lesson revision and an assessment version'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_episode_id IS NOT NULL OR
       NEW.assignment_generation IS NOT NULL OR
       NEW.assignment_scope_snapshot IS NOT NULL THEN
      RAISE EXCEPTION 'Assessment version review must have null assignment episode pins'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT blueprint_generation INTO v_version_bp_gen
      FROM app.assessment_versions WHERE id = NEW.assessment_version_id;

    IF v_version_bp_gen IS NULL THEN
      RAISE EXCEPTION 'Assessment version % not found', NEW.assessment_version_id USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NEW.blueprint_generation IS DISTINCT FROM v_version_bp_gen THEN
      RAISE EXCEPTION 'Review blueprint_generation % does not match assessment version blueprint_generation %',
        NEW.blueprint_generation, v_version_bp_gen USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revision_review_provenance ON app.revision_reviews;
CREATE TRIGGER trg_revision_review_provenance
  BEFORE INSERT OR UPDATE OF lesson_revision_id, assessment_version_id, assignment_episode_id,
                            assignment_generation, assignment_scope_snapshot, blueprint_generation,
                            action, actor_id ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.check_revision_review_provenance();

-- -----------------------------------------------------------------------------
-- Step 5: PRE-03 — Version Envelope, Catalog & Config Snapshot Validation
-- Validates schema_version, config, coverage, requirements, coverage_catalog
-- Enforces regex format validation before casts to avoid incidental 22P02/22003
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.check_assessment_version_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_bp_course UUID;
  v_bp_lang UUID;
  v_bp_fw UUID;
  v_bp_purpose TEXT;
  v_bp_target_level UUID;
  v_bp_next_level UUID;
  v_bp_generation BIGINT;
  v_bp_cat_gen BIGINT;
  v_bp_config JSONB;
  v_bp_coverage JSONB;
  v_bp_requirements JSONB;
  v_course_catalog JSONB;
  v_course_cat_gen BIGINT;
  s JSONB := NEW.blueprint_snapshot;
  v_str TEXT;
BEGIN
  IF s IS NULL OR jsonb_typeof(s) != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot must be a JSON object' USING ERRCODE = 'check_violation';
  END IF;

  -- 1. Envelope key existence: all 14 required keys
  IF NOT (s ? 'schema_version') OR
     NOT (s ? 'blueprint_id') OR
     NOT (s ? 'blueprint_generation') OR
     NOT (s ? 'course_id') OR
     NOT (s ? 'language_id') OR
     NOT (s ? 'framework_id') OR
     NOT (s ? 'purpose') OR
     NOT (s ? 'target_level_id') OR
     NOT (s ? 'next_level_id') OR
     NOT (s ? 'coverage_catalog_generation') OR
     NOT (s ? 'config') OR
     NOT (s ? 'coverage') OR
     NOT (s ? 'requirements') OR
     NOT (s ? 'coverage_catalog') THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot missing required envelope keys (schema_version, blueprint_id, blueprint_generation, course_id, language_id, framework_id, purpose, target_level_id, next_level_id, coverage_catalog_generation, config, coverage, requirements, coverage_catalog)'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2. Validate types and format BEFORE any cast (PRE-03)
  -- schema_version: must be integer 1
  IF jsonb_typeof(s->'schema_version') != 'number' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot schema_version must be integer 1' USING ERRCODE = 'check_violation';
  END IF;
  v_str := s->>'schema_version';
  IF v_str !~ '^[0-9]+$' OR v_str::int != 1 THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot schema_version must be integer 1' USING ERRCODE = 'check_violation';
  END IF;

  -- UUID identity keys: blueprint_id, course_id, language_id, framework_id
  IF jsonb_typeof(s->'blueprint_id') != 'string' OR
     jsonb_typeof(s->'course_id') != 'string' OR
     jsonb_typeof(s->'language_id') != 'string' OR
     jsonb_typeof(s->'framework_id') != 'string' OR
     jsonb_typeof(s->'purpose') != 'string' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot identity keys must be non-null strings' USING ERRCODE = 'check_violation';
  END IF;

  IF (s->>'blueprint_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' OR
     (s->>'course_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' OR
     (s->>'language_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' OR
     (s->>'framework_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot identity keys must be valid UUID strings' USING ERRCODE = 'check_violation';
  END IF;

  -- generations: must be positive integer strings
  IF jsonb_typeof(s->'blueprint_generation') != 'number' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot blueprint_generation must be positive integer' USING ERRCODE = 'check_violation';
  END IF;
  v_str := s->>'blueprint_generation';
  IF v_str !~ '^[1-9][0-9]*$' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot blueprint_generation must be positive integer' USING ERRCODE = 'check_violation';
  END IF;

  IF jsonb_typeof(s->'coverage_catalog_generation') != 'number' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot coverage_catalog_generation must be positive integer' USING ERRCODE = 'check_violation';
  END IF;
  v_str := s->>'coverage_catalog_generation';
  IF v_str !~ '^[1-9][0-9]*$' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot coverage_catalog_generation must be positive integer' USING ERRCODE = 'check_violation';
  END IF;

  -- nullable level keys: string with UUID format OR null
  IF jsonb_typeof(s->'target_level_id') = 'string' THEN
    IF (s->>'target_level_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'Assessment version blueprint_snapshot target_level_id has invalid UUID format' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF jsonb_typeof(s->'target_level_id') != 'null' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot target_level_id must be UUID string or null' USING ERRCODE = 'check_violation';
  END IF;

  IF jsonb_typeof(s->'next_level_id') = 'string' THEN
    IF (s->>'next_level_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'Assessment version blueprint_snapshot next_level_id has invalid UUID format' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF jsonb_typeof(s->'next_level_id') != 'null' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot next_level_id must be UUID string or null' USING ERRCODE = 'check_violation';
  END IF;

  -- config, coverage, requirements, coverage_catalog: must be JSON objects
  IF jsonb_typeof(s->'config') != 'object' OR
     jsonb_typeof(s->'coverage') != 'object' OR
     jsonb_typeof(s->'requirements') != 'object' OR
     jsonb_typeof(s->'coverage_catalog') != 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot config, coverage, requirements, and coverage_catalog must be JSON objects' USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Read and bind against actual blueprint row and parent course
  SELECT bp.course_id, c.language_id, c.framework_id, bp.purpose, bp.target_level_id, bp.next_level_id,
         bp.generation, bp.coverage_catalog_generation, bp.config, bp.coverage, bp.requirements,
         c.coverage_catalog, c.coverage_catalog_generation
    INTO v_bp_course, v_bp_lang, v_bp_fw, v_bp_purpose, v_bp_target_level, v_bp_next_level,
         v_bp_generation, v_bp_cat_gen, v_bp_config, v_bp_coverage, v_bp_requirements,
         v_course_catalog, v_course_cat_gen
    FROM app.assessment_blueprints bp
    JOIN app.courses c ON c.id = bp.course_id
   WHERE bp.id = NEW.blueprint_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment blueprint % not found', NEW.blueprint_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.blueprint_generation IS DISTINCT FROM v_bp_generation THEN
    RAISE EXCEPTION 'Assessment version blueprint_generation % does not match blueprint current generation %',
      NEW.blueprint_generation, v_bp_generation USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Verify scope equality against blueprint source
  IF (s->>'blueprint_id')::UUID IS DISTINCT FROM NEW.blueprint_id OR
     (s->>'blueprint_generation')::BIGINT IS DISTINCT FROM NEW.blueprint_generation OR
     (s->>'course_id')::UUID IS DISTINCT FROM v_bp_course OR
     (s->>'language_id')::UUID IS DISTINCT FROM v_bp_lang OR
     (s->>'framework_id')::UUID IS DISTINCT FROM v_bp_fw OR
     (s->>'purpose') IS DISTINCT FROM v_bp_purpose THEN
    RAISE EXCEPTION 'Assessment version snapshot scope does not match actual blueprint scope'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->>'target_level_id')::UUID IS DISTINCT FROM v_bp_target_level OR
     (s->>'next_level_id')::UUID IS DISTINCT FROM v_bp_next_level THEN
    RAISE EXCEPTION 'Assessment version snapshot target/next levels do not match actual blueprint levels'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->>'coverage_catalog_generation')::BIGINT IS DISTINCT FROM v_bp_cat_gen OR
     (s->>'coverage_catalog_generation')::BIGINT IS DISTINCT FROM v_course_cat_gen THEN
    RAISE EXCEPTION 'Assessment version snapshot coverage_catalog_generation does not match blueprint or course catalog generation'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->'config') IS DISTINCT FROM v_bp_config THEN
    RAISE EXCEPTION 'Assessment version snapshot config does not match blueprint config'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->'coverage') IS DISTINCT FROM v_bp_coverage THEN
    RAISE EXCEPTION 'Assessment version snapshot coverage does not match blueprint coverage'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->'requirements') IS DISTINCT FROM v_bp_requirements THEN
    RAISE EXCEPTION 'Assessment version snapshot requirements do not match blueprint requirements'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (s->'coverage_catalog') IS DISTINCT FROM v_course_catalog THEN
    RAISE EXCEPTION 'Assessment version snapshot coverage_catalog does not match course coverage_catalog'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_snapshot_shape ON app.assessment_versions;
CREATE TRIGGER trg_assessment_version_snapshot_shape
  BEFORE INSERT OR UPDATE OF blueprint_snapshot, blueprint_id, blueprint_generation ON app.assessment_versions
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_snapshot();

-- -----------------------------------------------------------------------------
-- Step 6: PRE-02 — Assessment Version Item Eligibility & Coverage Correspondence
-- Retains item blueprint pins check against version blueprint pins,
-- checks review generation against episode scope generation,
-- uses immutable version snapshot for scope matching, and enforces complete
-- coverage_tags 3-array envelope with source lesson dictionary correspondence.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.check_assessment_version_item_eligibility()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_origin TEXT;
  v_omitted BOOLEAN;
  v_frozen TIMESTAMPTZ;
  v_action TEXT;
  v_review_lesson_rev UUID;
  v_review_episode UUID;
  v_review_gen BIGINT;
  v_ep_gen BIGINT;
  v_lesson_submitted TIMESTAMPTZ;
  v_lesson_topic_ids TEXT[];
  v_lesson_skill_ids TEXT[];
  v_lesson_purpose_tags TEXT[];
  v_lesson_course UUID;
  v_lesson_lang UUID;
  v_lesson_fw UUID;
  v_ver_bp_id UUID;
  v_ver_bp_gen BIGINT;
  v_snapshot JSONB;
  v_snap_course UUID;
  v_snap_lang UUID;
  v_snap_fw UUID;
  v_item_bp_id UUID;
  v_item_bp_gen BIGINT;
  v_tags JSONB := NEW.coverage_tags;
  v_elem JSONB;
  v_elem_str TEXT;
BEGIN
  -- 1. Origin check: item identity must have origin ASSESSMENT
  SELECT origin INTO v_origin FROM app.item_identities WHERE id = NEW.item_id;
  IF v_origin IS DISTINCT FROM 'ASSESSMENT' THEN
    RAISE EXCEPTION 'Assessment version item % must have origin ASSESSMENT', NEW.item_id USING ERRCODE = 'check_violation';
  END IF;

  -- 2. Item revision checks: draft-omitted and frozen_at, plus read blueprint pins (PRE-02)
  SELECT is_draft_omitted, frozen_at, assessment_blueprint_id, blueprint_generation
    INTO v_omitted, v_frozen, v_item_bp_id, v_item_bp_gen
    FROM app.item_revisions WHERE id = NEW.item_revision_id;

  IF v_omitted = true THEN
    RAISE EXCEPTION 'Draft-omitted item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;
  IF v_frozen IS NULL THEN
    RAISE EXCEPTION 'Unfrozen item revision % cannot be included in assessment version', NEW.item_revision_id USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Source review submission checks
  SELECT action, lesson_revision_id, assignment_episode_id, assignment_generation
    INTO v_action, v_review_lesson_rev, v_review_episode, v_review_gen
    FROM app.revision_reviews WHERE id = NEW.source_submission_id;

  IF v_action IS DISTINCT FROM 'SUBMIT' THEN
    RAISE EXCEPTION 'Source review action must be SUBMIT for assessment version item' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_lesson_rev IS DISTINCT FROM NEW.source_lesson_revision_id THEN
    RAISE EXCEPTION 'Source review lesson revision does not match source_lesson_revision_id' USING ERRCODE = 'check_violation';
  END IF;
  IF v_review_episode IS DISTINCT FROM NEW.contribution_assignment_episode_id THEN
    RAISE EXCEPTION 'Source review episode does not match contribution_assignment_episode_id' USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Check review assignment_generation against contribution episode scope_generation (PRE-02)
  SELECT scope_generation INTO v_ep_gen
    FROM app.assignment_history WHERE id = NEW.contribution_assignment_episode_id;
  IF v_ep_gen IS DISTINCT FROM v_review_gen THEN
    RAISE EXCEPTION 'Review assignment_generation does not match contribution episode scope_generation' USING ERRCODE = 'check_violation';
  END IF;

  -- 5. Source lesson revision must be submitted, read its authored tags
  SELECT submitted_at, topic_ids, skill_ids, purpose_tags
    INTO v_lesson_submitted, v_lesson_topic_ids, v_lesson_skill_ids, v_lesson_purpose_tags
    FROM app.lesson_revisions WHERE id = NEW.source_lesson_revision_id;

  IF v_lesson_submitted IS NULL THEN
    RAISE EXCEPTION 'Source lesson revision % must be submitted', NEW.source_lesson_revision_id USING ERRCODE = 'check_violation';
  END IF;

  -- 6. Read parent version and its immutable pinned snapshot (PRE-02)
  SELECT blueprint_id, blueprint_generation, blueprint_snapshot
    INTO v_ver_bp_id, v_ver_bp_gen, v_snapshot
    FROM app.assessment_versions WHERE id = NEW.assessment_version_id;

  IF v_snapshot IS NULL OR jsonb_typeof(v_snapshot) != 'object' THEN
    RAISE EXCEPTION 'Assessment version snapshot missing or invalid' USING ERRCODE = 'check_violation';
  END IF;

  -- 7. Tie item blueprint pins to version blueprint identity (PRE-02)
  IF v_item_bp_id IS DISTINCT FROM v_ver_bp_id OR v_item_bp_gen IS DISTINCT FROM v_ver_bp_gen THEN
    RAISE EXCEPTION 'Item revision blueprint pins (% / %) do not match assessment version (% / %)',
      v_item_bp_id, v_item_bp_gen, v_ver_bp_id, v_ver_bp_gen USING ERRCODE = 'check_violation';
  END IF;

  -- 8. Scope matching: lesson curriculum must match pinned snapshot scope
  SELECT u.course_id, c.language_id, c.framework_id
    INTO v_lesson_course, v_lesson_lang, v_lesson_fw
    FROM app.lesson_revisions lr
    JOIN app.lessons l ON l.id = lr.lesson_id
    JOIN app.units u ON u.id = l.unit_id
    JOIN app.courses c ON c.id = u.course_id
   WHERE lr.id = NEW.source_lesson_revision_id;

  v_snap_course := (v_snapshot->>'course_id')::UUID;
  v_snap_lang := (v_snapshot->>'language_id')::UUID;
  v_snap_fw := (v_snapshot->>'framework_id')::UUID;

  IF v_snap_course IS DISTINCT FROM v_lesson_course OR
     v_snap_lang IS DISTINCT FROM v_lesson_lang OR
     v_snap_fw IS DISTINCT FROM v_lesson_fw THEN
    RAISE EXCEPTION 'Item authoring lesson curriculum scope does not match pinned version snapshot scope'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 9. Coverage tags envelope validation (PRE-02)
  -- Must be a JSON object containing all 3 required keys: topic_ids, skill_ids, purpose_tags
  IF v_tags IS NULL OR jsonb_typeof(v_tags) != 'object' THEN
    RAISE EXCEPTION 'Assessment version item coverage_tags must be a JSON object' USING ERRCODE = 'check_violation';
  END IF;

  IF NOT (v_tags ? 'topic_ids') OR NOT (v_tags ? 'skill_ids') OR NOT (v_tags ? 'purpose_tags') THEN
    RAISE EXCEPTION 'Assessment version item coverage_tags must contain topic_ids, skill_ids, and purpose_tags arrays'
      USING ERRCODE = 'check_violation';
  END IF;

  IF jsonb_typeof(v_tags->'topic_ids') != 'array' OR
     jsonb_typeof(v_tags->'skill_ids') != 'array' OR
     jsonb_typeof(v_tags->'purpose_tags') != 'array' THEN
    RAISE EXCEPTION 'Assessment version item coverage_tags topic_ids, skill_ids, and purpose_tags must all be JSON arrays'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Validate array elements are strings and match source lesson coverage
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_tags->'topic_ids') LOOP
    IF jsonb_typeof(v_elem) != 'string' THEN
      RAISE EXCEPTION 'Assessment version item coverage_tags topic_ids elements must be strings' USING ERRCODE = 'check_violation';
    END IF;
    v_elem_str := v_elem #>> '{}';
    IF array_length(v_lesson_topic_ids, 1) > 0 AND NOT (v_elem_str = ANY(v_lesson_topic_ids)) THEN
      RAISE EXCEPTION 'Coverage tag topic_id % is not present in source lesson topic_ids', v_elem_str USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_tags->'skill_ids') LOOP
    IF jsonb_typeof(v_elem) != 'string' THEN
      RAISE EXCEPTION 'Assessment version item coverage_tags skill_ids elements must be strings' USING ERRCODE = 'check_violation';
    END IF;
    v_elem_str := v_elem #>> '{}';
    IF array_length(v_lesson_skill_ids, 1) > 0 AND NOT (v_elem_str = ANY(v_lesson_skill_ids)) THEN
      RAISE EXCEPTION 'Coverage tag skill_id % is not present in source lesson skill_ids', v_elem_str USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_tags->'purpose_tags') LOOP
    IF jsonb_typeof(v_elem) != 'string' THEN
      RAISE EXCEPTION 'Assessment version item coverage_tags purpose_tags elements must be strings' USING ERRCODE = 'check_violation';
    END IF;
    v_elem_str := v_elem #>> '{}';
    IF array_length(v_lesson_purpose_tags, 1) > 0 AND NOT (v_elem_str = ANY(v_lesson_purpose_tags)) THEN
      RAISE EXCEPTION 'Coverage tag purpose_tag % is not present in source lesson purpose_tags', v_elem_str USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_version_item_eligibility ON app.assessment_version_items;
CREATE TRIGGER trg_assessment_version_item_eligibility
  BEFORE INSERT OR UPDATE ON app.assessment_version_items
  FOR EACH ROW EXECUTE FUNCTION app.check_assessment_version_item_eligibility();

-- -----------------------------------------------------------------------------
-- Step 7: Postflight Assertions
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_lr_src TEXT;
  v_rev_src TEXT;
  v_ver_src TEXT;
  v_item_src TEXT;
  v_hist_src TEXT;
BEGIN
  SELECT prosrc INTO v_hist_src FROM pg_proc WHERE proname = 'guard_assignment_history_scope_snapshot' AND pronamespace = 'app'::regnamespace;
  IF v_hist_src NOT LIKE '%schema_version%' OR v_hist_src NOT LIKE '%lesson_id%' THEN
    RAISE EXCEPTION 'Postflight assertion failed: guard_assignment_history_scope_snapshot missing schema_version or lesson_id check';
  END IF;

  SELECT prosrc INTO v_lr_src FROM pg_proc WHERE proname = 'guard_lesson_revision_submitted_payload' AND pronamespace = 'app'::regnamespace;
  IF v_lr_src NOT LIKE '%prior_revision_id%' OR v_lr_src NOT LIKE '%created_at%' OR v_lr_src NOT LIKE '%submitted_assignment_generation%' THEN
    RAISE EXCEPTION 'Postflight assertion failed: guard_lesson_revision_submitted_payload missing prior_revision_id, created_at, or submitted_assignment_generation check';
  END IF;

  SELECT prosrc INTO v_rev_src FROM pg_proc WHERE proname = 'check_revision_review_provenance' AND pronamespace = 'app'::regnamespace;
  IF v_rev_src NOT LIKE '%assignment_generation%' OR v_rev_src NOT LIKE '%assignment_scope_snapshot%' THEN
    RAISE EXCEPTION 'Postflight assertion failed: check_revision_review_provenance missing assignment_generation or assignment_scope_snapshot check';
  END IF;

  SELECT prosrc INTO v_ver_src FROM pg_proc WHERE proname = 'check_assessment_version_snapshot' AND pronamespace = 'app'::regnamespace;
  IF v_ver_src NOT LIKE '%schema_version%' OR v_ver_src NOT LIKE '%coverage_catalog%' THEN
    RAISE EXCEPTION 'Postflight assertion failed: check_assessment_version_snapshot missing schema_version or coverage_catalog check';
  END IF;

  SELECT prosrc INTO v_item_src FROM pg_proc WHERE proname = 'check_assessment_version_item_eligibility' AND pronamespace = 'app'::regnamespace;
  IF v_item_src NOT LIKE '%assessment_blueprint_id%' OR v_item_src NOT LIKE '%coverage_tags%' THEN
    RAISE EXCEPTION 'Postflight assertion failed: check_assessment_version_item_eligibility missing assessment_blueprint_id or coverage_tags check';
  END IF;
END $$;

COMMIT;


