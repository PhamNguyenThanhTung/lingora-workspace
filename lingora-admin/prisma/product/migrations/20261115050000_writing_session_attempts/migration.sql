-- Sprint 6: S6-06a & S6-06b Writing Practice Sessions and Attempts
-- Additive migration for writing_sessions and writing_attempts in app schema.

CREATE TABLE app.writing_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    context_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    lesson_revision_id uuid NOT NULL,
    character_id uuid NOT NULL,
    stroke_version smallint NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    operation_key uuid,
    started_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    completed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    row_version bigint DEFAULT 1 NOT NULL,
    CONSTRAINT writing_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT writing_sessions_learner_id_operation_key_key UNIQUE (learner_id, operation_key),
    CONSTRAINT writing_sessions_status_check CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    CONSTRAINT writing_sessions_stroke_version_check CHECK (stroke_version > 0),
    CONSTRAINT writing_sessions_learner_fkey FOREIGN KEY (learner_id) REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_sessions_context_fkey FOREIGN KEY (context_id) REFERENCES app.learning_contexts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_sessions_lesson_fkey FOREIGN KEY (lesson_id) REFERENCES app.lessons(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_sessions_revision_fkey FOREIGN KEY (lesson_revision_id) REFERENCES app.lesson_revisions(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_sessions_character_fkey FOREIGN KEY (character_id) REFERENCES app.writing_characters(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

CREATE INDEX writing_sessions_learner_id_status_idx ON app.writing_sessions(learner_id, status);
CREATE INDEX writing_sessions_context_id_lesson_id_idx ON app.writing_sessions(context_id, lesson_id);

CREATE TABLE app.writing_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    learner_id uuid NOT NULL,
    character_id uuid NOT NULL,
    operation_key uuid NOT NULL,
    input_fingerprint text NOT NULL,
    score smallint NOT NULL,
    band text NOT NULL,
    stroke_count smallint NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    receipt jsonb,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    CONSTRAINT writing_attempts_pkey PRIMARY KEY (id),
    CONSTRAINT writing_attempts_learner_id_operation_key_key UNIQUE (learner_id, operation_key),
    CONSTRAINT writing_attempts_score_check CHECK (score >= 0 AND score <= 100),
    CONSTRAINT writing_attempts_band_check CHECK (band IN ('EXCELLENT', 'FAIR', 'POOR')),
    CONSTRAINT writing_attempts_stroke_count_check CHECK (stroke_count >= 0),
    CONSTRAINT writing_attempts_session_fkey FOREIGN KEY (session_id) REFERENCES app.writing_sessions(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_attempts_learner_fkey FOREIGN KEY (learner_id) REFERENCES app.accounts(id) ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT writing_attempts_character_fkey FOREIGN KEY (character_id) REFERENCES app.writing_characters(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

CREATE INDEX writing_attempts_session_id_created_at_idx ON app.writing_attempts(session_id, created_at);

-- RLS
ALTER TABLE app.writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.writing_sessions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE app.writing_sessions FROM PUBLIC, anon, authenticated;

ALTER TABLE app.writing_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.writing_attempts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE app.writing_attempts FROM PUBLIC, anon, authenticated;
