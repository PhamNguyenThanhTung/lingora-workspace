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
