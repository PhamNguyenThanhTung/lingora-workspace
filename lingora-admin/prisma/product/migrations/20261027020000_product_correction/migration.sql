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
