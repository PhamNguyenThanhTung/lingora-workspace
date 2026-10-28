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
