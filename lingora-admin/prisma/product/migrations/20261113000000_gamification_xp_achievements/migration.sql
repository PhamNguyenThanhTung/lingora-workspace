-- Sprint 4 Gamification — XP events and Learner achievements.
-- Additive migration for XpEvent and LearnerAchievement persistence.
-- Target: app schema on reviewed product baseline.
-- Additive only: no backfill, no data loss, no schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  event_type text NOT NULL,
  source_id uuid NOT NULL,
  xp integer NOT NULL,
  local_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xp_events_learner_fkey
    FOREIGN KEY (learner_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT xp_events_xp_positive_check
    CHECK (xp > 0),
  CONSTRAINT xp_events_event_type_check
    CHECK (event_type IN ('LESSON_COMPLETION', 'SRS_REVIEW', 'DAILY_QUEST')),
  CONSTRAINT xp_events_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(local_date))
);

CREATE UNIQUE INDEX xp_events_learner_event_source_key
  ON app.xp_events (learner_id, event_type, source_id);

CREATE INDEX xp_events_learner_local_date_idx
  ON app.xp_events (learner_id, local_date);

CREATE INDEX xp_events_learner_created_at_idx
  ON app.xp_events (learner_id, created_at);

REVOKE ALL ON TABLE app.xp_events FROM PUBLIC, anon, authenticated;
ALTER TABLE app.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.xp_events FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.xp_events IS
  'Append-only ledger of learner XP events for lesson completions, SRS reviews, and daily quests.';

CREATE TABLE app.learner_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  achievement_code text NOT NULL,
  source_id uuid NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_achievements_learner_fkey
    FOREIGN KEY (learner_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT learner_achievements_code_check
    CHECK (achievement_code IN (
      'FIRST_LESSON',
      'LESSONS_10',
      'STREAK_7',
      'STREAK_30',
      'WORDS_100',
      'PERFECT_PRACTICE'
    )),
  CONSTRAINT learner_achievements_timestamps_check
    CHECK (isfinite(awarded_at) AND isfinite(created_at))
);

CREATE UNIQUE INDEX learner_achievements_learner_code_key
  ON app.learner_achievements (learner_id, achievement_code);

CREATE INDEX learner_achievements_learner_id_idx
  ON app.learner_achievements (learner_id);

REVOKE ALL ON TABLE app.learner_achievements FROM PUBLIC, anon, authenticated;
ALTER TABLE app.learner_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.learner_achievements FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.learner_achievements IS
  'Immutable record of learner achievements awarded upon qualifying events.';

COMMIT;
