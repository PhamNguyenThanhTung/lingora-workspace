-- Slice 10 LessonConsumption — owner approved 2026-11-01.
-- Apply explicitly to DEV; no migration command in application build hooks.
-- Target: existing app schema on the reviewed Slice 9/10 baseline.
-- No backfill, existing evidence mutation, role changes or schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.lesson_consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  lesson_revision_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT lesson_consumptions_context_revision_key
    UNIQUE (context_id, lesson_revision_id),
  CONSTRAINT lesson_consumptions_context_fkey
    FOREIGN KEY (context_id) REFERENCES app.learning_contexts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT lesson_consumptions_lesson_fkey
    FOREIGN KEY (lesson_id) REFERENCES app.lessons(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT lesson_consumptions_revision_lesson_fkey
    FOREIGN KEY (lesson_revision_id, lesson_id)
    REFERENCES app.lesson_revisions(id, lesson_id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT lesson_consumptions_row_version_check CHECK (row_version > 0),
  CONSTRAINT lesson_consumptions_timestamps_check CHECK (
    isfinite(started_at)
    AND isfinite(created_at)
    AND isfinite(updated_at) AND updated_at >= started_at AND updated_at >= created_at
    AND (completed_at IS NULL OR (
      isfinite(completed_at) AND completed_at >= started_at AND completed_at <= updated_at
    ))
  )
);

-- Context-leading UNIQUE supports owner-context lookups and identity guard EXISTS.
-- Separate child-key index supports revision/lesson FK dependency checks and cleanup.
CREATE INDEX lesson_consumptions_revision_lesson_idx
  ON app.lesson_consumptions (lesson_revision_id, lesson_id);
CREATE INDEX lesson_consumptions_lesson_idx ON app.lesson_consumptions (lesson_id);

-- Actual accepted runtime is trusted server Prisma, currently postgres/BYPASSRLS.
-- Deny direct client roles on this table only; no learner-write RLS architecture.
REVOKE ALL ON TABLE app.lesson_consumptions FROM PUBLIC, anon, authenticated;
ALTER TABLE app.lesson_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.lesson_consumptions FORCE ROW LEVEL SECURITY;
-- Intentionally no policies. A future non-bypass runtime requires separate review.

-- Extend the existing simple history/identity guard by one EXISTS.
-- Preserve its existing trigger, signature, security mode and all old conditions.
CREATE OR REPLACE FUNCTION app.guard_learning_context_immutable_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.learner_id IS DISTINCT FROM NEW.learner_id OR
     OLD.course_id IS DISTINCT FROM NEW.course_id OR
     OLD.language_id IS DISTINCT FROM NEW.language_id THEN
    IF EXISTS (SELECT 1 FROM app.lesson_attempts WHERE context_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.assessment_attempts WHERE context_id = OLD.id) OR
       EXISTS (SELECT 1 FROM app.lesson_consumptions WHERE context_id = OLD.id) THEN
      RAISE EXCEPTION 'Learning context learner, course, and language are immutable once learning evidence exists'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON TABLE app.lesson_consumptions IS
  'Per-context published-revision reading state; never graded lesson completion, performance, SRS, qualifying activity, curriculum or level-up evidence.';
COMMENT ON COLUMN app.lesson_consumptions.completed_at IS
  'Explicit learner acknowledgement of reading this revision; not app.lesson_completions.';

COMMIT;

-- ROLLBACK CONDITIONS (documentation only; no automatic down migration):
-- 1. Disable consumption UI/API writers and drain transactions.
-- 2. If table has any rows, retain table + context guard; rollback application only.
--    Destructive removal/export of real consumption history requires separate approval.
-- 3. Only if table is empty and rollback is approved: in one transaction restore
--    the prior guard body without the lesson_consumptions EXISTS, then DROP TABLE
--    app.lesson_consumptions (RESTRICT, never CASCADE). Preserve all prior guards.
