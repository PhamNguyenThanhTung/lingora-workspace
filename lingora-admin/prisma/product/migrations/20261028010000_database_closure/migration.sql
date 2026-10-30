-- =============================================================================
-- Migration: 20261028010000_database_closure
-- Description: Targeted database closure migration resolving FA-01, FA-02, FA-03
-- Authority: plans/2026-10-28-database-closure.md
-- Single transactional batch with 5s lock timeout and pre-apply assertion gates
-- =============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '10s';

-- -----------------------------------------------------------------------------
-- 0. Pre-apply Assertion Gates
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Assertion 1: Exact 4 finished migrations with matching local checksums
  IF (SELECT count(*) FROM app._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) != 4 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: expected exactly 4 applied migrations';
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

  IF NOT EXISTS (
    SELECT 1 FROM app._prisma_migrations 
    WHERE migration_name = '20261027030000_product_remediation' 
      AND checksum = '5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6'
  ) THEN
    RAISE EXCEPTION 'Pre-apply gate failed: remediation migration checksum mismatch';
  END IF;

  -- Assertion 2: Verify existing table count (29 app + 5 app_private)
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app' AND table_name != '_prisma_migrations') != 29 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: app tables count is not 29';
  END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app_private') != 5 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: app_private tables count is not 5';
  END IF;
END $$;

-- Lock the three affected tables in write-conflicting exclusive mode
LOCK TABLE app.lesson_revisions, app.revision_reviews, app.assessment_versions IN EXCLUSIVE MODE;

-- Assertion 3: Verify the three affected tables are currently empty
DO $$
DECLARE
  v_lr_count BIGINT;
  v_rr_count BIGINT;
  v_av_count BIGINT;
BEGIN
  SELECT count(*) INTO v_lr_count FROM app.lesson_revisions;
  SELECT count(*) INTO v_rr_count FROM app.revision_reviews;
  SELECT count(*) INTO v_av_count FROM app.assessment_versions;
  IF v_lr_count > 0 OR v_rr_count > 0 OR v_av_count > 0 THEN
    RAISE EXCEPTION 'Pre-apply gate failed: affected tables must be empty for database closure migration (lesson_revisions=%, revision_reviews=%, assessment_versions=%)',
      v_lr_count, v_rr_count, v_av_count;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. FA-01: Freeze created_at and prior_revision_id on ever-submitted lesson revisions
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
       OLD.created_by IS DISTINCT FROM NEW.created_by OR
       OLD.created_at IS DISTINCT FROM NEW.created_at OR
       OLD.prior_revision_id IS DISTINCT FROM NEW.prior_revision_id THEN
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
-- 2. FA-02: Validate revision review's own generation & scope against episode
-- -----------------------------------------------------------------------------
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
    IF NEW.assignment_episode_id IS NULL THEN
      RAISE EXCEPTION 'Lesson review requires assignment_episode_id' USING ERRCODE = 'check_violation';
    END IF;

    SELECT assignment_id, submitted_by, submitted_at, submitted_assignment_generation, assignment_scope_snapshot
      INTO v_lesson_assign_id, v_sub_by, v_sub_at, v_sub_gen, v_lr_snapshot
      FROM app.lesson_revisions WHERE id = NEW.lesson_revision_id;

    SELECT assignment_id, scope_generation, next_teacher_id, scope_snapshot
      INTO v_ep_assign_id, v_ep_gen, v_next_teacher_id, v_ep_snapshot
      FROM app.assignment_history WHERE id = NEW.assignment_episode_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Review assignment episode % not found', NEW.assignment_episode_id USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_ep_assign_id IS DISTINCT FROM v_lesson_assign_id THEN
      RAISE EXCEPTION 'Review episode assignment % does not match lesson assignment %',
        v_ep_assign_id, v_lesson_assign_id USING ERRCODE = 'check_violation';
    END IF;

    -- FA-02: Compare review's own generation and scope snapshot with referenced episode
    IF NEW.assignment_generation IS DISTINCT FROM v_ep_gen THEN
      RAISE EXCEPTION 'Review assignment_generation % does not match episode scope_generation %',
        NEW.assignment_generation, v_ep_gen USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.assignment_scope_snapshot IS DISTINCT FROM v_ep_snapshot THEN
      RAISE EXCEPTION 'Review assignment_scope_snapshot does not match episode scope_snapshot'
        USING ERRCODE = 'check_violation';
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
  BEFORE INSERT OR UPDATE OF lesson_revision_id, assignment_episode_id, action, actor_id, assignment_generation, assignment_scope_snapshot ON app.revision_reviews
  FOR EACH ROW EXECUTE FUNCTION app.check_revision_review_provenance();

-- -----------------------------------------------------------------------------
-- 3. FA-03: Validate assessment version blueprint snapshot shape, version and config
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
  v_bp_config JSONB;
  v_bp_catalog_gen BIGINT;
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

  -- FA-03: schema_version must be exact numeric 1 (reject string "1", float, boolean, null, etc.)
  IF (NEW.blueprint_snapshot->'schema_version') IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot schema_version must be numeric 1'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Read and bind against actual blueprint row at assembly with row share lock
  SELECT bp.course_id, c.language_id, c.framework_id, bp.purpose, bp.target_level_id, bp.next_level_id, bp.generation, bp.config, bp.coverage_catalog_generation
    INTO v_bp_course, v_bp_lang, v_bp_fw, v_bp_purpose, v_bp_target_level, v_bp_next_level, v_bp_generation, v_bp_config, v_bp_catalog_gen
    FROM app.assessment_blueprints bp
    JOIN app.courses c ON c.id = bp.course_id
   WHERE bp.id = NEW.blueprint_id
     FOR SHARE OF bp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment blueprint % not found', NEW.blueprint_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.blueprint_generation IS DISTINCT FROM v_bp_generation THEN
    RAISE EXCEPTION 'Assessment version blueprint_generation % does not match blueprint current generation %',
      NEW.blueprint_generation, v_bp_generation USING ERRCODE = 'check_violation';
  END IF;

  -- FA-03: config must be a JSON object and JSONB-equal to authoritative blueprint.config
  IF jsonb_typeof(NEW.blueprint_snapshot->'config') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot config must be a JSON object'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.blueprint_snapshot->'config') IS DISTINCT FROM v_bp_config THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot config does not match blueprint config'
      USING ERRCODE = 'check_violation';
  END IF;

  -- FA-03: coverage_catalog_generation must be a positive JSON number representing exact blueprint bigint
  IF jsonb_typeof(NEW.blueprint_snapshot->'coverage_catalog_generation') IS DISTINCT FROM 'number' OR
     (NEW.blueprint_snapshot->'coverage_catalog_generation') IS DISTINCT FROM to_jsonb(v_bp_catalog_gen) THEN
    RAISE EXCEPTION 'Assessment version blueprint_snapshot coverage_catalog_generation must match blueprint coverage_catalog_generation'
      USING ERRCODE = 'check_violation';
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

COMMIT;
