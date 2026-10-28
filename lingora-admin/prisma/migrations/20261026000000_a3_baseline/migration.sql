-- =============================================================================
-- Migration: 20261026000000_a3_baseline
-- Baseline migration for Lingora A3 Minimal Representative Baseline (AC-03)
-- Authority: plans/2026-10-22-database-runtime-implementation-spec.md §§2, 4-7
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure schemas exist
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS app_private;

-- -----------------------------------------------------------------------------
-- 2. Base Catalog & Relational Tables
-- -----------------------------------------------------------------------------

-- app.languages
CREATE TABLE IF NOT EXISTS app.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  names jsonb NOT NULL,
  is_learnable boolean NOT NULL DEFAULT false,
  is_ui_locale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT languages_code_key UNIQUE (code)
);

-- app.frameworks
CREATE TABLE IF NOT EXISTS app.frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version text NOT NULL,
  names jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT frameworks_code_version_key UNIQUE (code, version)
);

-- app.levels
CREATE TABLE IF NOT EXISTS app.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid NOT NULL REFERENCES app.frameworks(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  code text NOT NULL,
  label jsonb NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT levels_framework_id_code_key UNIQUE (framework_id, code),
  CONSTRAINT levels_framework_id_position_key UNIQUE (framework_id, position),
  CONSTRAINT levels_position_check CHECK (position > 0)
);

-- app.courses
CREATE TABLE IF NOT EXISTS app.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid NOT NULL REFERENCES app.languages(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  framework_id uuid NOT NULL REFERENCES app.frameworks(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  names jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  curriculum_generation bigint NOT NULL DEFAULT 1,
  default_start_level_id uuid REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  gate_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  practice_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage_catalog jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage_catalog_generation bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT courses_curriculum_generation_check CHECK (curriculum_generation > 0),
  CONSTRAINT courses_coverage_catalog_generation_check CHECK (coverage_catalog_generation > 0),
  CONSTRAINT courses_row_version_check CHECK (row_version > 0)
);

-- app.units
CREATE TABLE IF NOT EXISTS app.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES app.courses(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  level_id uuid NOT NULL REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  code text NOT NULL,
  position integer NOT NULL,
  names jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT units_course_id_level_id_position_key UNIQUE (course_id, level_id, position),
  CONSTRAINT units_position_check CHECK (position > 0),
  CONSTRAINT units_row_version_check CHECK (row_version > 0)
);

-- app.lessons (created before lesson_revisions; active_revision_id is nullable; circular FK added below)
CREATE TABLE IF NOT EXISTS app.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES app.units(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  position integer NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  availability text NOT NULL DEFAULT 'PLANNED',
  active_revision_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT lessons_unit_id_position_key UNIQUE (unit_id, position),
  CONSTRAINT lessons_availability_check CHECK (availability IN ('PLANNED', 'AVAILABLE', 'WITHDRAWN')),
  CONSTRAINT lessons_position_check CHECK (position > 0),
  CONSTRAINT lessons_row_version_check CHECK (row_version > 0)
);

-- app.content_assignments
CREATE TABLE IF NOT EXISTS app.content_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  current_teacher_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES app.lessons(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  scope_generation bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT content_assignments_lesson_id_key UNIQUE (lesson_id),
  CONSTRAINT content_assignments_id_lesson_id_key UNIQUE (id, lesson_id),
  CONSTRAINT content_assignments_scope_generation_check CHECK (scope_generation > 0),
  CONSTRAINT content_assignments_row_version_check CHECK (row_version > 0)
);

-- app.assignment_history
CREATE TABLE IF NOT EXISTS app.assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES app.content_assignments(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  sequence_no integer NOT NULL,
  event_type text NOT NULL,
  previous_teacher_id uuid,
  next_teacher_id uuid NOT NULL,
  scope_generation bigint NOT NULL,
  changed_by uuid NOT NULL,
  reason text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  scope_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT assignment_history_assignment_id_sequence_no_key UNIQUE (assignment_id, sequence_no),
  CONSTRAINT assignment_history_id_assignment_id_key UNIQUE (id, assignment_id),
  CONSTRAINT assignment_history_event_type_check CHECK (event_type IN ('ASSIGNED', 'REASSIGNED', 'SCOPE_CHANGED'))
);

-- app.lesson_revisions
CREATE TABLE IF NOT EXISTS app.lesson_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES app.lessons(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  revision_no integer NOT NULL,
  prior_revision_id uuid,
  change_summary text,
  assignment_id uuid NOT NULL REFERENCES app.content_assignments(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  creation_assignment_episode_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  title jsonb NOT NULL,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  topic_ids text[] NOT NULL DEFAULT '{}',
  skill_ids text[] NOT NULL DEFAULT '{}',
  purpose_tags text[] NOT NULL DEFAULT '{}',
  coverage_catalog_generation bigint,
  coverage_snapshot jsonb,
  submitted_assignment_generation bigint,
  assignment_scope_snapshot jsonb,
  created_by uuid NOT NULL,
  last_edited_by uuid NOT NULL,
  submitted_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT lesson_revisions_lesson_id_revision_no_key UNIQUE (lesson_id, revision_no),
  CONSTRAINT lesson_revisions_id_lesson_id_key UNIQUE (id, lesson_id),
  CONSTRAINT lesson_revisions_status_check CHECK (status IN ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN')),
  CONSTRAINT lesson_revisions_revision_no_check CHECK (revision_no > 0),
  CONSTRAINT lesson_revisions_row_version_check CHECK (row_version > 0)
);

-- Circular FK: app.lessons(active_revision_id, id) -> app.lesson_revisions(id, lesson_id) MATCH SIMPLE
ALTER TABLE app.lessons
  ADD CONSTRAINT lessons_active_revision_fkey
  FOREIGN KEY (active_revision_id, id)
  REFERENCES app.lesson_revisions(id, lesson_id)
  MATCH SIMPLE ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Self-referencing FK for prior revision
ALTER TABLE app.lesson_revisions
  ADD CONSTRAINT lesson_revisions_prior_revision_fkey
  FOREIGN KEY (prior_revision_id)
  REFERENCES app.lesson_revisions(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Composite FK: creation_assignment_episode_id -> assignment_history
ALTER TABLE app.lesson_revisions
  ADD CONSTRAINT lesson_revisions_creation_assignment_episode_fkey
  FOREIGN KEY (creation_assignment_episode_id, assignment_id)
  REFERENCES app.assignment_history(id, assignment_id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

-- app.item_identities
CREATE TABLE IF NOT EXISTS app.item_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  created_by uuid NOT NULL,
  variant_of_id uuid REFERENCES app.item_identities(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  exact_fingerprint text NOT NULL,
  practice_exposed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_identities_origin_check CHECK (origin IN ('PRACTICE', 'ASSESSMENT'))
);

-- app.assessment_blueprints
CREATE TABLE IF NOT EXISTS app.assessment_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  language_id uuid NOT NULL REFERENCES app.languages(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  framework_id uuid NOT NULL REFERENCES app.frameworks(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  purpose text NOT NULL,
  target_level_id uuid REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  next_level_id uuid REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage_catalog_generation bigint NOT NULL DEFAULT 1,
  generation bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT assessment_blueprints_purpose_check CHECK (purpose IN ('PLACEMENT', 'LEVEL_UP')),
  CONSTRAINT assessment_blueprints_generation_check CHECK (generation > 0),
  CONSTRAINT assessment_blueprints_row_version_check CHECK (row_version > 0)
);

-- app.item_revisions
CREATE TABLE IF NOT EXISTS app.item_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES app.item_identities(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  revision_no integer NOT NULL,
  type text NOT NULL,
  prompt_data jsonb NOT NULL,
  practice_skill_ids text[] NOT NULL DEFAULT '{}',
  practice_coverage_snapshot jsonb,
  schema_version integer NOT NULL DEFAULT 1,
  exact_fingerprint text NOT NULL,
  created_by uuid NOT NULL,
  creation_assignment_episode_id uuid NOT NULL,
  authoring_lesson_revision_id uuid NOT NULL REFERENCES app.lesson_revisions(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  assessment_blueprint_id uuid REFERENCES app.assessment_blueprints(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  blueprint_generation bigint,
  is_draft_omitted boolean NOT NULL DEFAULT false,
  frozen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT item_revisions_item_id_revision_no_key UNIQUE (item_id, revision_no),
  CONSTRAINT item_revisions_id_item_id_key UNIQUE (id, item_id),
  CONSTRAINT item_revisions_id_authoring_lesson_revision_id_key UNIQUE (id, authoring_lesson_revision_id),
  CONSTRAINT item_revisions_type_check CHECK (type IN ('MCQ', 'FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR')),
  CONSTRAINT item_revisions_revision_no_check CHECK (revision_no > 0),
  CONSTRAINT item_revisions_row_version_check CHECK (row_version > 0)
);

-- Composite FK: item_revisions.creation_assignment_episode_id -> assignment_history
ALTER TABLE app.item_revisions
  ADD CONSTRAINT item_revisions_creation_assignment_episode_fkey
  FOREIGN KEY (creation_assignment_episode_id)
  REFERENCES app.assignment_history(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

-- app.assessment_versions
CREATE TABLE IF NOT EXISTS app.assessment_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid NOT NULL REFERENCES app.assessment_blueprints(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  version_no integer NOT NULL,
  blueprint_generation bigint NOT NULL,
  blueprint_snapshot jsonb NOT NULL,
  assembled_at timestamptz NOT NULL DEFAULT now(),
  assembly_input_hash text NOT NULL,
  status text NOT NULL DEFAULT 'IN_REVIEW',
  is_active boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT assessment_versions_blueprint_id_version_no_key UNIQUE (blueprint_id, version_no),
  CONSTRAINT assessment_versions_blueprint_id_generation_input_hash_key UNIQUE (blueprint_id, blueprint_generation, assembly_input_hash),
  CONSTRAINT assessment_versions_status_check CHECK (status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN')),
  CONSTRAINT assessment_versions_version_no_check CHECK (version_no > 0),
  CONSTRAINT assessment_versions_row_version_check CHECK (row_version > 0)
);

-- Partial unique index: at most one active version per blueprint
CREATE UNIQUE INDEX IF NOT EXISTS assessment_versions_active_blueprint_idx
  ON app.assessment_versions(blueprint_id)
  WHERE is_active = true;

-- app.media_assets
CREATE TABLE IF NOT EXISTS app.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'lingora-media',
  object_key text NOT NULL,
  sha256 text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  uploaded_by uuid NOT NULL,
  owner_account_id uuid,
  assignment_id uuid REFERENCES app.content_assignments(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  kind text NOT NULL,
  ready_at timestamptz,
  frozen_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_bucket_id_object_key_key UNIQUE (bucket_id, object_key),
  CONSTRAINT media_assets_byte_size_check CHECK (byte_size > 0),
  CONSTRAINT media_assets_kind_check CHECK (kind IN ('AVATAR', 'CONTENT'))
);

-- app.accounts (auth.users foreign key is added if auth schema exists)
CREATE TABLE IF NOT EXISTS app.accounts (
  id uuid PRIMARY KEY,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  ui_locale text NOT NULL DEFAULT 'en' REFERENCES app.languages(code) ON UPDATE NO ACTION ON DELETE RESTRICT,
  native_language_id uuid REFERENCES app.languages(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  timezone text NOT NULL DEFAULT 'UTC',
  avatar_media_id uuid REFERENCES app.media_assets(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT accounts_role_check CHECK (role IN ('ADMIN', 'TEACHER', 'LEARNER')),
  CONSTRAINT accounts_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'DISABLED')),
  CONSTRAINT accounts_row_version_check CHECK (row_version > 0)
);

-- Hook external Auth provider FK if auth.users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'accounts_id_auth_users_fkey') THEN
      ALTER TABLE app.accounts
        ADD CONSTRAINT accounts_id_auth_users_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id)
        ON UPDATE NO ACTION ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- FKs to accounts
ALTER TABLE app.content_assignments
  ADD CONSTRAINT content_assignments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT content_assignments_current_teacher_fkey
  FOREIGN KEY (current_teacher_id) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.assignment_history
  ADD CONSTRAINT assignment_history_previous_teacher_fkey
  FOREIGN KEY (previous_teacher_id) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT assignment_history_next_teacher_fkey
  FOREIGN KEY (next_teacher_id) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT assignment_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.lesson_revisions
  ADD CONSTRAINT lesson_revisions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT lesson_revisions_last_edited_by_fkey
  FOREIGN KEY (last_edited_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT lesson_revisions_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT lesson_revisions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT lesson_revisions_published_by_fkey
  FOREIGN KEY (published_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.item_identities
  ADD CONSTRAINT item_identities_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.item_revisions
  ADD CONSTRAINT item_revisions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.assessment_blueprints
  ADD CONSTRAINT assessment_blueprints_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.assessment_versions
  ADD CONSTRAINT assessment_versions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT assessment_versions_published_by_fkey
  FOREIGN KEY (published_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

ALTER TABLE app.media_assets
  ADD CONSTRAINT media_assets_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT,
  ADD CONSTRAINT media_assets_owner_account_fkey
  FOREIGN KEY (owner_account_id) REFERENCES app.accounts(id)
  ON UPDATE NO ACTION ON DELETE RESTRICT;

-- app.learning_contexts
CREATE TABLE IF NOT EXISTS app.learning_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  language_id uuid NOT NULL REFERENCES app.languages(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'ACTIVE',
  purpose text,
  study_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  study_focus text NOT NULL DEFAULT 'BALANCED',
  selected_start_level_id uuid REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  start_source text,
  start_result_id uuid,
  self_report jsonb,
  working_level_id uuid REFERENCES app.levels(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT learning_contexts_learner_id_language_id_key UNIQUE (learner_id, language_id),
  CONSTRAINT learning_contexts_status_check CHECK (status IN ('ACTIVE', 'PAUSED')),
  CONSTRAINT learning_contexts_study_focus_check CHECK (study_focus IN ('BALANCED', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING')),
  CONSTRAINT learning_contexts_row_version_check CHECK (row_version > 0)
);

-- app.revision_reviews
CREATE TABLE IF NOT EXISTS app.revision_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_revision_id uuid REFERENCES app.lesson_revisions(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  assessment_version_id uuid REFERENCES app.assessment_versions(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  action text NOT NULL,
  actor_id uuid NOT NULL REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  assignment_episode_id uuid REFERENCES app.assignment_history(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  assignment_generation bigint,
  assignment_scope_snapshot jsonb,
  blueprint_generation bigint,
  feedback_item_ids uuid[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  revision_row_version bigint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revision_reviews_id_lesson_rev_assignment_ep_key UNIQUE (id, lesson_revision_id, assignment_episode_id),
  CONSTRAINT revision_reviews_action_check CHECK (action IN ('SUBMIT', 'REQUEST_CHANGES', 'APPROVE', 'PUBLISH', 'ARCHIVE', 'WITHDRAW'))
);

-- -----------------------------------------------------------------------------
-- 3. Private Infrastructure Tables (app_private)
-- -----------------------------------------------------------------------------

-- app_private.provisioning_requests
CREATE TABLE IF NOT EXISTS app_private.provisioning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key uuid NOT NULL,
  normalized_email text NOT NULL,
  requested_role text NOT NULL,
  requested_by uuid REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  auth_user_id uuid,
  state text NOT NULL DEFAULT 'REQUESTED',
  provider_correlation_id text,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT provisioning_requests_operation_key_key UNIQUE (operation_key),
  CONSTRAINT provisioning_requests_normalized_email_key UNIQUE (normalized_email),
  CONSTRAINT provisioning_requests_requested_role_check CHECK (requested_role IN ('TEACHER', 'ADMIN')),
  CONSTRAINT provisioning_requests_state_check CHECK (state IN ('REQUESTED', 'IDENTITY_CREATED', 'READY', 'FAILED_RETRYABLE')),
  CONSTRAINT provisioning_requests_row_version_check CHECK (row_version > 0)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'provisioning_requests_auth_user_id_fkey') THEN
      ALTER TABLE app_private.provisioning_requests
        ADD CONSTRAINT provisioning_requests_auth_user_id_fkey
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
        ON UPDATE NO ACTION ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- app_private.command_receipts
CREATE TABLE IF NOT EXISTS app_private.command_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  command text NOT NULL,
  operation_key uuid NOT NULL,
  input_hash text NOT NULL,
  target_id uuid NOT NULL,
  safe_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  committed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT command_receipts_actor_id_command_operation_key_key UNIQUE (actor_id, command, operation_key)
);

-- app_private.audit_events
CREATE TABLE IF NOT EXISTS app_private.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_kind text NOT NULL,
  actor_id uuid REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
  verified_auth_subject_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_version_id uuid,
  outcome text NOT NULL,
  reason text,
  correlation_id uuid,
  safe_context jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_actor_kind_check CHECK (actor_kind IN ('ACCOUNT', 'VERIFIED_AUTH_SUBJECT', 'SYSTEM')),
  CONSTRAINT audit_events_outcome_check CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILURE')),
  CONSTRAINT audit_events_actor_attribution_check CHECK (
    (actor_kind = 'ACCOUNT' AND actor_id IS NOT NULL AND verified_auth_subject_id IS NULL) OR
    (actor_kind = 'VERIFIED_AUTH_SUBJECT' AND actor_id IS NULL AND verified_auth_subject_id IS NOT NULL) OR
    (actor_kind = 'SYSTEM' AND actor_id IS NULL AND verified_auth_subject_id IS NULL)
  )
);

-- -----------------------------------------------------------------------------
-- 4. Seed Configuration and Locale (AC-03 requirement)
-- -----------------------------------------------------------------------------
INSERT INTO app.languages (id, code, names, is_learnable, is_ui_locale)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'en', '{"en": "English", "vi": "Tiếng Anh"}'::jsonb, true, true),
  ('00000000-0000-0000-0000-000000000002', 'vi', '{"en": "Vietnamese", "vi": "Tiếng Việt"}'::jsonb, false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.frameworks (id, code, version, names)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'CEFR', '2020', '{"en": "Common European Framework of Reference", "vi": "Khung tham chiếu chung Châu Âu"}'::jsonb)
ON CONFLICT (code, version) DO NOTHING;

INSERT INTO app.levels (id, framework_id, code, label, position)
VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'A1', '{"en": "Beginner", "vi": "Mới bắt đầu"}'::jsonb, 1),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'A2', '{"en": "Elementary", "vi": "Sơ cấp"}'::jsonb, 2),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', 'B1', '{"en": "Intermediate", "vi": "Trung cấp"}'::jsonb, 3),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000010', 'B2', '{"en": "Upper Intermediate", "vi": "Trung cao cấp"}'::jsonb, 4)
ON CONFLICT (framework_id, code) DO NOTHING;

INSERT INTO app.courses (id, language_id, framework_id, names, is_active, curriculum_generation, default_start_level_id)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '{"en": "English Core Curriculum", "vi": "Chương trình tiếng Anh chuẩn"}'::jsonb, true, 1, '00000000-0000-0000-0000-000000000021')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Security Definitive Functions & Procedures
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lingora_authz_reader') THEN
    GRANT lingora_authz_reader, lingora_content_writer, lingora_fingerprint_reader, lingora_auth_provisioner TO postgres;
    GRANT CREATE ON SCHEMA app_private TO lingora_authz_reader, lingora_content_writer, lingora_fingerprint_reader, lingora_auth_provisioner;
  END IF;
END $$;

-- Transaction-local authenticated subject reader
CREATE OR REPLACE FUNCTION app.current_auth_subject()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.auth_subject', true), '')::uuid;
$$;

-- Nonrecursive account lookup helper for RLS policies (bounded to verified transaction subject)
CREATE OR REPLACE FUNCTION app_private.get_auth_subject_account(p_subject uuid)
RETURNS TABLE (account_id uuid, role text, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.id, a.role, a.status
  FROM app.accounts a
  WHERE a.id = p_subject
    AND p_subject IS NOT NULL
    AND p_subject = app.current_auth_subject();
$$;
ALTER FUNCTION app_private.get_auth_subject_account(uuid) OWNER TO lingora_authz_reader;

-- Checked draft omission setter
CREATE OR REPLACE FUNCTION app_private.set_draft_assessment_contribution_omitted(
  p_lesson_revision_id uuid,
  p_item_id uuid,
  p_is_omitted boolean,
  p_expected_row_version bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_version bigint;
BEGIN
  SELECT row_version INTO v_current_version
  FROM app.lesson_revisions
  WHERE id = p_lesson_revision_id AND status IN ('DRAFT', 'CHANGES_REQUESTED')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LESSON_REVISION_NOT_EDITABLE: Revision is not unfrozen DRAFT or CHANGES_REQUESTED';
  END IF;

  IF v_current_version <> p_expected_row_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected row_version %, found %', p_expected_row_version, v_current_version;
  END IF;

  UPDATE app.item_revisions
  SET is_draft_omitted = p_is_omitted,
      updated_at = now(),
      row_version = row_version + 1
  WHERE authoring_lesson_revision_id = p_lesson_revision_id AND item_id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ITEM_REVISION_NOT_FOUND: Assessment contribution not found for revision';
  END IF;

  UPDATE app.lesson_revisions
  SET updated_at = now(),
      row_version = row_version + 1
  WHERE id = p_lesson_revision_id;

  RETURN true;
END;
$$;
ALTER FUNCTION app_private.set_draft_assessment_contribution_omitted(uuid, uuid, boolean, bigint) OWNER TO lingora_content_writer;

-- Existence-only fingerprint collision checker
CREATE OR REPLACE FUNCTION app_private.check_fingerprint_collision(
  p_fingerprint text,
  p_check_direction text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_check_direction = 'ASSESSMENT_TO_PRACTICE' THEN
    -- Check if fingerprint exists in published practice items
    RETURN EXISTS (
      SELECT 1 FROM app.item_identities ii
      JOIN app.item_revisions ir ON ir.item_id = ii.id
      JOIN app.lesson_revisions lr ON lr.id = ir.authoring_lesson_revision_id
      WHERE ii.exact_fingerprint = p_fingerprint
        AND ii.origin = 'PRACTICE'
        AND lr.status = 'PUBLISHED'
    );
  ELSIF p_check_direction = 'PRACTICE_TO_ASSESSMENT' THEN
    -- Check if fingerprint exists in active published assessment version
    RETURN EXISTS (
      SELECT 1 FROM app.item_identities ii
      JOIN app.item_revisions ir ON ir.item_id = ii.id
      JOIN app.assessment_versions av ON av.blueprint_id = ir.assessment_blueprint_id
      WHERE ii.exact_fingerprint = p_fingerprint
        AND ii.origin = 'ASSESSMENT'
        AND av.status = 'PUBLISHED'
        AND av.is_active = true
    );
  ELSE
    RAISE EXCEPTION 'INVALID_DIRECTION: %', p_check_direction;
  END IF;
END;
$$;
ALTER FUNCTION app_private.check_fingerprint_collision(text, text) OWNER TO lingora_fingerprint_reader;

-- -----------------------------------------------------------------------------
-- 6. Grants & Row Level Security (RLS)
-- -----------------------------------------------------------------------------

-- Enable and FORCE RLS on all 20 tables
ALTER TABLE app.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.languages FORCE ROW LEVEL SECURITY;

ALTER TABLE app.frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.frameworks FORCE ROW LEVEL SECURITY;

ALTER TABLE app.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.levels FORCE ROW LEVEL SECURITY;

ALTER TABLE app.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.courses FORCE ROW LEVEL SECURITY;

ALTER TABLE app.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.units FORCE ROW LEVEL SECURITY;

ALTER TABLE app.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.lessons FORCE ROW LEVEL SECURITY;

ALTER TABLE app.content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.content_assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE app.assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.assignment_history FORCE ROW LEVEL SECURITY;

ALTER TABLE app.lesson_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.lesson_revisions FORCE ROW LEVEL SECURITY;

ALTER TABLE app.item_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.item_identities FORCE ROW LEVEL SECURITY;

ALTER TABLE app.item_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.item_revisions FORCE ROW LEVEL SECURITY;

ALTER TABLE app.assessment_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.assessment_blueprints FORCE ROW LEVEL SECURITY;

ALTER TABLE app.assessment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.assessment_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE app.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.media_assets FORCE ROW LEVEL SECURITY;

ALTER TABLE app.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE app.learning_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.learning_contexts FORCE ROW LEVEL SECURITY;

ALTER TABLE app.revision_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.revision_reviews FORCE ROW LEVEL SECURITY;

ALTER TABLE app_private.provisioning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.provisioning_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE app_private.command_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.command_receipts FORCE ROW LEVEL SECURITY;

ALTER TABLE app_private.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.audit_events FORCE ROW LEVEL SECURITY;

-- Revoke default table access from public
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;

-- Revoke default function EXECUTE from public
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;

-- Grant EXECUTE on current_auth_subject to runtime, assembly, adapter, scoped locker, and authz reader
GRANT EXECUTE ON FUNCTION app.current_auth_subject() TO lingora_runtime, lingora_assembly, lingora_auth_adapter, lingora_scoped_locker, lingora_authz_reader;

-- Grant USAGE on schemas
GRANT USAGE ON SCHEMA app TO lingora_runtime, lingora_assembly, lingora_auth_adapter,
  lingora_authz_reader, lingora_scoped_locker, lingora_content_writer,
  lingora_transition_writer, lingora_learner_writer, lingora_fingerprint_reader,
  lingora_assembly_writer, lingora_auth_provisioner, lingora_audit_writer;

GRANT USAGE ON SCHEMA app_private TO lingora_runtime, lingora_assembly, lingora_auth_adapter,
  lingora_authz_reader, lingora_scoped_locker, lingora_content_writer,
  lingora_transition_writer, lingora_learner_writer, lingora_fingerprint_reader,
  lingora_assembly_writer, lingora_auth_provisioner, lingora_audit_writer;

-- Runtime table permissions
GRANT SELECT ON app.languages TO lingora_runtime;
GRANT SELECT ON app.frameworks TO lingora_runtime;
GRANT SELECT ON app.levels TO lingora_runtime;
GRANT SELECT ON app.courses TO lingora_runtime;
GRANT SELECT ON app.units TO lingora_runtime;
GRANT SELECT ON app.lessons TO lingora_runtime;
GRANT SELECT ON app.content_assignments TO lingora_runtime;
GRANT SELECT ON app.assignment_history TO lingora_runtime;
GRANT SELECT ON app.lesson_revisions TO lingora_runtime;
GRANT SELECT ON app.item_identities TO lingora_runtime;
GRANT SELECT ON app.item_revisions TO lingora_runtime;
GRANT SELECT ON app.assessment_blueprints TO lingora_runtime;
GRANT SELECT ON app.assessment_versions TO lingora_runtime;
GRANT SELECT ON app.media_assets TO lingora_runtime;
GRANT SELECT, UPDATE (ui_locale, native_language_id, timezone, avatar_media_id, updated_at, row_version) ON app.accounts TO lingora_runtime;
GRANT SELECT, INSERT, UPDATE ON app.learning_contexts TO lingora_runtime;
GRANT SELECT ON app.revision_reviews TO lingora_runtime;
GRANT SELECT ON app_private.command_receipts TO lingora_runtime;
GRANT SELECT ON app_private.audit_events TO lingora_runtime;
GRANT EXECUTE ON FUNCTION app_private.get_auth_subject_account(uuid) TO lingora_runtime;
GRANT EXECUTE ON FUNCTION app_private.get_auth_subject_account(uuid) TO lingora_scoped_locker;

-- Scoped locker table permissions: narrow scope-column SELECT and lock-column UPDATE
GRANT SELECT (id, status, role, row_version) ON app.accounts TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.accounts TO lingora_scoped_locker;
GRANT SELECT (id, is_active, row_version) ON app.courses TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.courses TO lingora_scoped_locker;
GRANT SELECT (id, row_version) ON app.assessment_blueprints TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.assessment_blueprints TO lingora_scoped_locker;
GRANT SELECT (id, lesson_id, current_teacher_id, row_version) ON app.content_assignments TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.content_assignments TO lingora_scoped_locker;
GRANT SELECT (id, row_version) ON app.lessons TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.lessons TO lingora_scoped_locker;
GRANT SELECT (id, assignment_id, row_version) ON app.lesson_revisions TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.lesson_revisions TO lingora_scoped_locker;
GRANT SELECT (id, authoring_lesson_revision_id, row_version) ON app.item_revisions TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.item_revisions TO lingora_scoped_locker;
GRANT SELECT (id, row_version) ON app.assessment_versions TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.assessment_versions TO lingora_scoped_locker;
GRANT SELECT (id, learner_id, row_version) ON app.learning_contexts TO lingora_scoped_locker;
GRANT UPDATE (row_version) ON app.learning_contexts TO lingora_scoped_locker;

-- Auth provisioner table permissions
GRANT SELECT, INSERT, UPDATE (status, activated_at, updated_at, row_version) ON app.accounts TO lingora_auth_provisioner;
GRANT SELECT, INSERT, UPDATE ON app_private.provisioning_requests TO lingora_auth_provisioner;

-- Auth adapter role permissions
GRANT SELECT, INSERT, UPDATE ON app.accounts TO lingora_auth_adapter;
GRANT SELECT, INSERT, UPDATE ON app_private.provisioning_requests TO lingora_auth_adapter;
GRANT SELECT, INSERT ON app_private.audit_events TO lingora_auth_adapter;

-- Authz reader table permissions
GRANT SELECT (id, role, status) ON app.accounts TO lingora_authz_reader;

-- Audit writer table permissions
GRANT INSERT ON app_private.audit_events TO lingora_audit_writer;

-- RLS Policies
-- Languages / Frameworks / Levels: readable by all runtime
CREATE POLICY languages_read_all ON app.languages FOR SELECT TO lingora_runtime USING (true);
CREATE POLICY frameworks_read_all ON app.frameworks FOR SELECT TO lingora_runtime USING (true);
CREATE POLICY levels_read_all ON app.levels FOR SELECT TO lingora_runtime USING (true);

-- Courses: active courses readable, or any course if subject is authenticated active
CREATE POLICY courses_read_all ON app.courses FOR SELECT TO lingora_runtime
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
    WHERE a.status = 'ACTIVE'
  ));

-- Units / Lessons: readable when course is accessible; published lessons require active account
CREATE POLICY units_read_all ON app.units FOR SELECT TO lingora_runtime USING (true);
CREATE POLICY lessons_read_all ON app.lessons FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (
          availability = 'AVAILABLE'
          OR EXISTS (
            SELECT 1 FROM app.content_assignments ca
            WHERE ca.lesson_id = app.lessons.id
              AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
          )
        )
    )
  );

-- Content assignments / history: readable by authorized staff (Admin or assigned Teacher)
CREATE POLICY content_assignments_read ON app.content_assignments FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = app.content_assignments.current_teacher_id))
    )
  );
CREATE POLICY assignment_history_read ON app.assignment_history FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      JOIN app.content_assignments ca ON ca.id = app.assignment_history.assignment_id
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
    )
  );

-- Lesson revisions: readable by published active, or authoring assigned staff / admin (requires active account)
CREATE POLICY lesson_revisions_read ON app.lesson_revisions FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (
          app.lesson_revisions.status = 'PUBLISHED'
          OR EXISTS (
            SELECT 1 FROM app.content_assignments ca
            WHERE ca.id = app.lesson_revisions.assignment_id
              AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
          )
        )
    )
  );

-- Item identities / revisions: readable when part of published lesson or by authoring staff / admin (requires active account)
CREATE POLICY item_revisions_read ON app.item_revisions FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (
          (
            is_draft_omitted = false
            AND EXISTS (
              SELECT 1 FROM app.lesson_revisions lr
              WHERE lr.id = app.item_revisions.authoring_lesson_revision_id AND lr.status = 'PUBLISHED'
            )
          )
          OR EXISTS (
            SELECT 1 FROM app.lesson_revisions lr
            JOIN app.content_assignments ca ON ca.id = lr.assignment_id
            WHERE lr.id = app.item_revisions.authoring_lesson_revision_id
              AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
          )
        )
    )
  );
CREATE POLICY item_identities_read ON app.item_identities FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND EXISTS (
          SELECT 1 FROM app.item_revisions ir
          WHERE ir.item_id = app.item_identities.id
        )
    )
  );

-- Assessment blueprints / versions: blueprints for staff; versions for published active or admin (requires active account)
CREATE POLICY assessment_blueprints_read ON app.assessment_blueprints FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE' AND (a.role = 'ADMIN' OR a.role = 'TEACHER')
    )
  );
CREATE POLICY assessment_versions_read ON app.assessment_versions FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (
          (app.assessment_versions.status = 'PUBLISHED' AND app.assessment_versions.is_active = true)
          OR a.role = 'ADMIN'
        )
    )
  );

-- Accounts: subject reads own account; active subject updates own account; authz_reader reads any account
CREATE POLICY accounts_select_own ON app.accounts FOR SELECT TO lingora_runtime
  USING (id = app.current_auth_subject());
CREATE POLICY accounts_update_own ON app.accounts FOR UPDATE TO lingora_runtime
  USING (id = app.current_auth_subject() AND status = 'ACTIVE')
  WITH CHECK (id = app.current_auth_subject() AND status = 'ACTIVE');
CREATE POLICY accounts_authz_reader_select ON app.accounts FOR SELECT TO lingora_authz_reader
  USING (true);
CREATE POLICY accounts_auth_adapter_all ON app.accounts FOR ALL TO lingora_auth_adapter
  USING (true) WITH CHECK (true);
CREATE POLICY accounts_auth_provisioner_all ON app.accounts FOR ALL TO lingora_auth_provisioner
  USING (true) WITH CHECK (true);

-- Learning contexts: learner owns their contexts and must be an ACTIVE account with role LEARNER
CREATE POLICY contexts_learner_select ON app.learning_contexts FOR SELECT TO lingora_runtime
  USING (
    learner_id = app.current_auth_subject()
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.account_id = app.current_auth_subject() AND a.status = 'ACTIVE' AND a.role = 'LEARNER'
    )
  );
CREATE POLICY contexts_learner_insert ON app.learning_contexts FOR INSERT TO lingora_runtime
  WITH CHECK (
    learner_id = app.current_auth_subject()
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.account_id = app.current_auth_subject() AND a.status = 'ACTIVE' AND a.role = 'LEARNER'
    )
  );
CREATE POLICY contexts_learner_update ON app.learning_contexts FOR UPDATE TO lingora_runtime
  USING (
    learner_id = app.current_auth_subject()
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.account_id = app.current_auth_subject() AND a.status = 'ACTIVE' AND a.role = 'LEARNER'
    )
  )
  WITH CHECK (
    learner_id = app.current_auth_subject()
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.account_id = app.current_auth_subject() AND a.status = 'ACTIVE' AND a.role = 'LEARNER'
    )
  );

-- Media assets: owner/uploader reads if active; content media requires active account and assigned staff or published lesson
CREATE POLICY media_assets_read ON app.media_assets FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (
          owner_account_id = app.current_auth_subject()
          OR uploaded_by = app.current_auth_subject()
          OR (
            kind = 'CONTENT'
            AND (
              EXISTS (
                SELECT 1 FROM app.content_assignments ca
                WHERE ca.id = app.media_assets.assignment_id
                  AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
              )
              OR (
                ready_at IS NOT NULL
                AND retired_at IS NULL
                AND EXISTS (
                  SELECT 1 FROM app.lesson_revisions lr
                  WHERE lr.assignment_id = app.media_assets.assignment_id
                    AND lr.status = 'PUBLISHED'
                )
              )
            )
          )
        )
    )
  );

-- Revision reviews: accessible by admin or creator
CREATE POLICY revision_reviews_read ON app.revision_reviews FOR SELECT TO lingora_runtime
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE' AND (a.role = 'ADMIN' OR a.account_id = app.revision_reviews.actor_id)
    )
  );

-- Provisioning requests: private to auth adapter and auth provisioner (NO runtime access)
CREATE POLICY provisioning_requests_adapter_all ON app_private.provisioning_requests FOR ALL TO lingora_auth_adapter
  USING (true) WITH CHECK (true);
CREATE POLICY provisioning_requests_provisioner_all ON app_private.provisioning_requests FOR ALL TO lingora_auth_provisioner
  USING (true) WITH CHECK (true);

-- Command receipts: actor reads own receipts; NO generic runtime insert grant
CREATE POLICY command_receipts_own ON app_private.command_receipts FOR SELECT TO lingora_runtime
  USING (actor_id = app.current_auth_subject());

-- Audit events: audit_writer inserts; auth_adapter manages; runtime reads own events
CREATE POLICY audit_events_insert_writer ON app_private.audit_events FOR INSERT TO lingora_audit_writer
  WITH CHECK (true);
CREATE POLICY audit_events_adapter_all ON app_private.audit_events FOR ALL TO lingora_auth_adapter
  USING (true) WITH CHECK (true);
CREATE POLICY audit_events_runtime_select ON app_private.audit_events FOR SELECT TO lingora_runtime
  USING (actor_id = app.current_auth_subject() AND actor_kind = 'ACCOUNT');

-- Scoped locker lock-only policies: constrained scope with WITH CHECK (false) denying domain writes
CREATE POLICY accounts_lock_only ON app.accounts FOR ALL TO lingora_scoped_locker
  USING (
    (id = app.current_auth_subject() AND status = 'ACTIVE')
    OR (
      role IN ('LEARNER', 'TEACHER')
      AND EXISTS (
        SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
        WHERE a.status = 'ACTIVE' AND a.role = 'ADMIN'
      )
    )
  )
  WITH CHECK (false);

CREATE POLICY courses_lock_only ON app.courses FOR ALL TO lingora_scoped_locker
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
    )
  )
  WITH CHECK (false);

CREATE POLICY blueprints_lock_only ON app.assessment_blueprints FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE' AND a.role = 'ADMIN'
    )
  )
  WITH CHECK (false);

CREATE POLICY assignments_lock_only ON app.content_assignments FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = app.content_assignments.current_teacher_id))
    )
  )
  WITH CHECK (false);

CREATE POLICY lessons_lock_only ON app.lessons FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      JOIN app.content_assignments ca ON ca.lesson_id = app.lessons.id
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
    )
  )
  WITH CHECK (false);

CREATE POLICY lesson_revisions_lock_only ON app.lesson_revisions FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      JOIN app.content_assignments ca ON ca.id = app.lesson_revisions.assignment_id
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
    )
  )
  WITH CHECK (false);

CREATE POLICY item_revisions_lock_only ON app.item_revisions FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      JOIN app.lesson_revisions lr ON lr.id = app.item_revisions.authoring_lesson_revision_id
      JOIN app.content_assignments ca ON ca.id = lr.assignment_id
      WHERE a.status = 'ACTIVE'
        AND (a.role = 'ADMIN' OR (a.role = 'TEACHER' AND a.account_id = ca.current_teacher_id))
    )
  )
  WITH CHECK (false);

CREATE POLICY assessment_versions_lock_only ON app.assessment_versions FOR ALL TO lingora_scoped_locker
  USING (
    EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE' AND a.role = 'ADMIN'
    )
  )
  WITH CHECK (false);

CREATE POLICY contexts_lock_only ON app.learning_contexts FOR ALL TO lingora_scoped_locker
  USING (
    learner_id = app.current_auth_subject()
    AND EXISTS (
      SELECT 1 FROM app_private.get_auth_subject_account(app.current_auth_subject()) a
      WHERE a.status = 'ACTIVE' AND a.role = 'LEARNER'
    )
  )
  WITH CHECK (false);

-- -----------------------------------------------------------------------------
-- 7. Auth Trigger Hookup (Installed last after security objects & locale)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_reserved boolean;
BEGIN
  -- Check if email was reserved for staff in provisioning_requests
  SELECT EXISTS (
    SELECT 1 FROM app_private.provisioning_requests pr
    WHERE pr.normalized_email = lower(trim(NEW.email))
      AND pr.state IN ('REQUESTED', 'IDENTITY_CREATED')
  ) INTO v_is_reserved;

  IF v_is_reserved THEN
    -- Skip application account creation: controlled staff provisioner will bind exact UUID & PENDING account
    RETURN NEW;
  END IF;

  -- Default public signup creates safe LEARNER account in ACTIVE status
  INSERT INTO app.accounts (
    id,
    role,
    status,
    ui_locale,
    timezone,
    created_at,
    updated_at,
    row_version
  ) VALUES (
    NEW.id,
    'LEARNER',
    'ACTIVE',
    'en',
    'UTC',
    now(),
    now(),
    1
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
ALTER FUNCTION app_private.handle_auth_user_created() OWNER TO lingora_auth_provisioner;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION app_private.handle_auth_user_created();
  END IF;
END $$;
