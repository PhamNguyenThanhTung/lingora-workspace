-- Pin the grader implementation used by each attempt-producing session.
ALTER TABLE app.writing_sessions
  ADD COLUMN grader_version integer NOT NULL DEFAULT 1;

ALTER TABLE app.writing_sessions
  ALTER COLUMN stroke_version TYPE integer;

ALTER TABLE app.writing_sessions
  ADD CONSTRAINT writing_sessions_status_completed_at_check
  CHECK (
    (status = 'ACTIVE' AND completed_at IS NULL) OR
    (status = 'COMPLETED' AND completed_at IS NOT NULL) OR
    (status = 'ABANDONED' AND completed_at IS NULL)
  );

ALTER TABLE app.writing_sessions
  ADD CONSTRAINT writing_sessions_id_learner_character_key
  UNIQUE (id, learner_id, character_id);

ALTER TABLE app.writing_attempts
  DROP CONSTRAINT writing_attempts_session_fkey;

ALTER TABLE app.writing_attempts
  ADD CONSTRAINT writing_attempts_session_learner_character_fkey
  FOREIGN KEY (session_id, learner_id, character_id)
  REFERENCES app.writing_sessions (id, learner_id, character_id)
  ON UPDATE NO ACTION
  ON DELETE RESTRICT;
