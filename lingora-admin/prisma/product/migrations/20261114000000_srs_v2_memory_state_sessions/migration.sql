-- Sprint 5 — SRS v2 and Flashcards: SrsMemoryState and SrsReviewSession
-- Additive migration for SrsMemoryState and SrsReviewSession persistence.
-- Target: app schema on reviewed product baseline.
-- Additive only: no backfill, no data loss, no schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- 1. Create SrsMemoryState table
CREATE TABLE app.srs_memory_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL,
  skill text NOT NULL DEFAULT 'MEANING',
  scheduler_version text NOT NULL DEFAULT 'POLICY_B',
  state smallint NOT NULL DEFAULT 1,
  stability double precision,
  difficulty double precision,
  due_at timestamptz(6) NOT NULL,
  last_reviewed_at timestamptz(6),
  count integer NOT NULL DEFAULT 0,
  lapse integer NOT NULL DEFAULT 0,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT srs_memory_states_card_fkey
    FOREIGN KEY (card_id) REFERENCES app.srs_cards(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT srs_memory_states_state_check
    CHECK (state >= 1 AND state <= 5),
  CONSTRAINT srs_memory_states_count_check
    CHECK (count >= 0 AND lapse >= 0),
  CONSTRAINT srs_memory_states_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(updated_at) AND isfinite(due_at))
);

CREATE UNIQUE INDEX srs_memory_states_card_id_skill_key
  ON app.srs_memory_states (card_id, skill);

CREATE INDEX srs_memory_states_due_at_idx
  ON app.srs_memory_states (due_at);

REVOKE ALL ON TABLE app.srs_memory_states FROM PUBLIC, anon, authenticated;
ALTER TABLE app.srs_memory_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.srs_memory_states FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.srs_memory_states IS
  'Per-skill SRS memory state for vocabulary flashcards under Policy B and future schedulers.';

-- 2. Create SrsReviewSession table
CREATE TABLE app.srs_review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  context_id uuid,
  status text NOT NULL DEFAULT 'ACTIVE',
  session_limit integer NOT NULL DEFAULT 20,
  card_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_index integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz(6) NOT NULL,
  completed_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT srs_review_sessions_learner_fkey
    FOREIGN KEY (learner_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT srs_review_sessions_context_fkey
    FOREIGN KEY (context_id) REFERENCES app.learning_contexts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT srs_review_sessions_status_check
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED')),
  CONSTRAINT srs_review_sessions_indexes_check
    CHECK (current_index >= 0 AND completed_count >= 0),
  CONSTRAINT srs_review_sessions_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(updated_at) AND isfinite(expires_at))
);

CREATE INDEX srs_review_sessions_learner_id_idx
  ON app.srs_review_sessions (learner_id, created_at);

REVOKE ALL ON TABLE app.srs_review_sessions FROM PUBLIC, anon, authenticated;
ALTER TABLE app.srs_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.srs_review_sessions FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.srs_review_sessions IS
  'Server-authoritative SRS review sessions tracking queue, progress and bounds.';

COMMIT;
