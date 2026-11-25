-- Gamification Phase 5 — gem ledger (non-punitive currency earned alongside XP).
-- Additive only: new table, no backfill, no data loss, no schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.gem_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  event_type text NOT NULL,
  source_id uuid NOT NULL,
  gems integer NOT NULL,
  local_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gem_events_learner_fkey
    FOREIGN KEY (learner_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT gem_events_gems_positive_check
    CHECK (gems > 0),
  CONSTRAINT gem_events_event_type_check
    CHECK (event_type IN ('LESSON_COMPLETION', 'DAILY_QUEST', 'PERFECT_PRACTICE')),
  CONSTRAINT gem_events_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(local_date))
);

CREATE UNIQUE INDEX gem_events_learner_event_source_key
  ON app.gem_events (learner_id, event_type, source_id);

CREATE INDEX gem_events_learner_created_at_idx
  ON app.gem_events (learner_id, created_at);

REVOKE ALL ON TABLE app.gem_events FROM PUBLIC, anon, authenticated;
ALTER TABLE app.gem_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.gem_events FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.gem_events IS
  'Append-only ledger of learner gems earned for lesson completions, daily quests and perfect practice.';

COMMIT;
