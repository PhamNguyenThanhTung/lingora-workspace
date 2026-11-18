-- S6-09: skill-specific WRITING SRS on the existing Vocabulary card.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE app.srs_memory_states
  ADD COLUMN scheduled_days integer NOT NULL DEFAULT 0,
  ADD COLUMN learning_steps integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT srs_memory_states_fsrs_fields_check
    CHECK (scheduled_days >= 0 AND learning_steps >= 0);

ALTER TABLE app.srs_review_operations
  ADD COLUMN skill text NOT NULL DEFAULT 'MEANING',
  ADD COLUMN scheduler_version text NOT NULL DEFAULT 'POLICY_B',
  ADD COLUMN prior_state smallint,
  ADD COLUMN next_state smallint,
  ADD COLUMN scheduler_log jsonb,
  ALTER COLUMN next_stage DROP NOT NULL,
  DROP CONSTRAINT srs_review_operations_rating_check,
  ADD CONSTRAINT srs_review_operations_skill_check
    CHECK (skill IN ('MEANING', 'WRITING')),
  ADD CONSTRAINT srs_review_operations_scheduler_version_check
    CHECK (length(trim(scheduler_version)) > 0),
  ADD CONSTRAINT srs_review_operations_skill_rating_check
    CHECK (
      (skill = 'MEANING' AND rating IN ('REMEMBERED', 'FORGOTTEN')) OR
      (skill = 'WRITING' AND rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY') AND kind = 'SCHEDULE')
    ),
  ADD CONSTRAINT srs_review_operations_stage_state_check
    CHECK (
      (skill = 'MEANING' AND next_stage IS NOT NULL AND next_stage BETWEEN 1 AND 5 AND prior_state IS NULL AND next_state IS NULL) OR
      (skill = 'WRITING' AND next_stage IS NULL AND prior_stage IS NULL AND prior_state IS NOT NULL AND prior_state BETWEEN 0 AND 3 AND next_state IS NOT NULL AND next_state BETWEEN 0 AND 3)
    ),
  ADD CONSTRAINT srs_review_operations_scheduler_log_check
    CHECK (scheduler_log IS NULL OR jsonb_typeof(scheduler_log) = 'object');

DROP INDEX app.srs_review_ops_card_session_sched_idx;
DROP INDEX app.srs_review_ops_card_session_reinf_idx;
CREATE UNIQUE INDEX srs_review_ops_card_skill_session_sched_idx
  ON app.srs_review_operations (card_id, skill, session_key)
  WHERE kind = 'SCHEDULE';
CREATE UNIQUE INDEX srs_review_ops_card_skill_session_reinf_idx
  ON app.srs_review_operations (card_id, skill, session_key)
  WHERE kind = 'REINFORCEMENT';

COMMENT ON COLUMN app.srs_review_operations.skill IS
  'SRS skill whose independent memory state this operation schedules.';
COMMENT ON COLUMN app.srs_review_operations.scheduler_log IS
  'Immutable scheduler output for versioned non-Policy-B ratings; contains no raw learner strokes.';

COMMIT;
