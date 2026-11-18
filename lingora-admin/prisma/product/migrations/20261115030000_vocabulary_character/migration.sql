-- Sprint 6: S6-03 Vocabulary Character Linking (VocabularyCharacter)
-- Additive migration for VocabularyCharacter table in app schema.
-- Constraints: FK vocabulary_id RESTRICT to app.vocabulary_concepts(id),
-- FK character_id RESTRICT to app.writing_characters(id),
-- unique (vocabulary_id, position), position >= 1,
-- RLS ENABLE/FORCE and revoke PUBLIC/anon/authenticated.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.vocabulary_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_id uuid NOT NULL,
  character_id uuid NOT NULL,
  position integer NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT vocabulary_characters_vocabulary_fkey
    FOREIGN KEY (vocabulary_id) REFERENCES app.vocabulary_concepts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT vocabulary_characters_character_fkey
    FOREIGN KEY (character_id) REFERENCES app.writing_characters(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT vocabulary_characters_vocabulary_id_position_key
    UNIQUE (vocabulary_id, position),
  CONSTRAINT vocabulary_characters_position_positive_check
    CHECK (position >= 1),
  CONSTRAINT vocabulary_characters_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(updated_at))
);

CREATE INDEX vocabulary_characters_vocabulary_id_idx
  ON app.vocabulary_characters (vocabulary_id);

CREATE INDEX vocabulary_characters_character_id_idx
  ON app.vocabulary_characters (character_id);

REVOKE ALL ON TABLE app.vocabulary_characters FROM PUBLIC, anon, authenticated;
ALTER TABLE app.vocabulary_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.vocabulary_characters FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.vocabulary_characters IS
  'Ordered grapheme-level links between vocabulary concepts and writing characters.';

COMMIT;
