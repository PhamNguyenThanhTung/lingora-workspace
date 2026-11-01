-- Reviewed rollback procedure for owner-approved LessonConsumption migration.
-- Never auto-run; real history must remain.
-- Only after application rollback and stopped/drained consumption writers.
-- Aborts if any consumption row exists; never removes real reading history.
-- Operator/disposable validation only; never put in an automated migration directory.
BEGIN;
SET LOCAL lock_timeout = '5s';
-- Fail rather than silently see an empty filtered set under a non-bypass role.
SET LOCAL row_security = off;

-- Lock before checking emptiness so a concurrent writer cannot pass the check.
LOCK TABLE app.lesson_consumptions IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM app.lesson_consumptions) THEN
    RAISE EXCEPTION 'Consumption history exists; retain table/guard and roll back application only';
  END IF;
END;
$$;

-- Restore the prior guard observed in the scoped DEV read-only evidence.
-- Before use, compare with the then-current guard; do not overwrite later changes.
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

DROP TABLE app.lesson_consumptions RESTRICT;
COMMIT;
