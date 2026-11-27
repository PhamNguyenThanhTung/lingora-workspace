-- Standalone writing practice ("Luyện viết"): a session may be tied to a lesson (LESSON) or be free practice (FREE).
-- Additive/relaxing only: existing rows keep practice_kind = 'LESSON' and their lesson links.
ALTER TABLE app.writing_sessions
  ALTER COLUMN lesson_id DROP NOT NULL,
  ALTER COLUMN lesson_revision_id DROP NOT NULL;

ALTER TABLE app.writing_sessions
  ADD COLUMN practice_kind text NOT NULL DEFAULT 'LESSON';

ALTER TABLE app.writing_sessions
  ADD CONSTRAINT writing_sessions_practice_kind_check
    CHECK (practice_kind IN ('LESSON', 'FREE')),
  ADD CONSTRAINT writing_sessions_practice_kind_lesson_check
    CHECK (
      (practice_kind = 'LESSON' AND lesson_id IS NOT NULL AND lesson_revision_id IS NOT NULL)
      OR (practice_kind = 'FREE' AND lesson_id IS NULL AND lesson_revision_id IS NULL)
    );

CREATE INDEX writing_sessions_learner_id_character_id_idx
  ON app.writing_sessions (learner_id, character_id);
