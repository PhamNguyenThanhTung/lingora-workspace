-- Sprint 3 LearningPlan — Onboarding và lộ trình học cá nhân.
-- Additive migration for LearningPlan persistence.
-- Target: app schema on reviewed product baseline.
-- Additive only: no backfill, no data loss, no schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid NOT NULL,
  course_id uuid NOT NULL,
  start_level_id uuid NOT NULL,
  source text NOT NULL,
  daily_goal_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  recommendation_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  replaced_at timestamptz,
  CONSTRAINT learning_plans_context_fkey
    FOREIGN KEY (context_id) REFERENCES app.learning_contexts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT learning_plans_course_fkey
    FOREIGN KEY (course_id) REFERENCES app.courses(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT learning_plans_start_level_fkey
    FOREIGN KEY (start_level_id) REFERENCES app.levels(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT learning_plans_source_check
    CHECK (source IN ('DEFAULT', 'SELF_REPORT', 'PLACEMENT')),
  CONSTRAINT learning_plans_status_check
    CHECK (status IN ('ACTIVE', 'REPLACED')),
  CONSTRAINT learning_plans_daily_goal_check
    CHECK (daily_goal_minutes IN (5, 10, 15, 20)),
  CONSTRAINT learning_plans_timestamps_check
    CHECK (
      isfinite(created_at)
      AND (replaced_at IS NULL OR (isfinite(replaced_at) AND replaced_at >= created_at))
    )
);

-- Index for foreign keys and context lookups
CREATE INDEX learning_plans_context_id_idx ON app.learning_plans (context_id);
CREATE INDEX learning_plans_course_id_idx ON app.learning_plans (course_id);
CREATE INDEX learning_plans_start_level_id_idx ON app.learning_plans (start_level_id);

-- Enforce exactly one ACTIVE plan per context using partial unique index
CREATE UNIQUE INDEX learning_plans_active_context_unique
  ON app.learning_plans (context_id)
  WHERE (status = 'ACTIVE');

-- Actual accepted runtime is trusted server Prisma, currently postgres/BYPASSRLS.
-- Deny direct client roles on this table only; no learner-write RLS architecture.
REVOKE ALL ON TABLE app.learning_plans FROM PUBLIC, anon, authenticated;
ALTER TABLE app.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.learning_plans FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.learning_plans IS
  'Per-context immutable snapshot of learning plans and recommendations; at most one ACTIVE plan per context.';

COMMIT;
