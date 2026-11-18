-- Sprint 6: S6-01 Character Catalogue (WritingCharacter)
-- Additive migration for WritingCharacter table in app schema.
-- Constraints: FK RESTRICT, unique (language_id, glyph), stroke_count 1..128,
-- script_type in 5 spec scripts, metadata JSON object, RLS ENABLE/FORCE and revoke PUBLIC/anon/authenticated.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.writing_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid NOT NULL,
  glyph text NOT NULL,
  script_type text NOT NULL,
  meaning text,
  primary_reading text,
  romanization text,
  stroke_count integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT writing_characters_language_fkey
    FOREIGN KEY (language_id) REFERENCES app.languages(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT writing_characters_language_id_glyph_key
    UNIQUE (language_id, glyph),
  CONSTRAINT writing_characters_glyph_nonempty_check
    CHECK (length(glyph) > 0),
  CONSTRAINT writing_characters_stroke_count_check
    CHECK (stroke_count >= 1 AND stroke_count <= 128),
  CONSTRAINT writing_characters_script_type_check
    CHECK (script_type IN ('HIRAGANA', 'KATAKANA', 'KANJI', 'HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL')),
  CONSTRAINT writing_characters_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT writing_characters_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(updated_at))
);

CREATE INDEX writing_characters_language_id_idx
  ON app.writing_characters (language_id);

CREATE INDEX writing_characters_script_type_idx
  ON app.writing_characters (script_type);

REVOKE ALL ON TABLE app.writing_characters FROM PUBLIC, anon, authenticated;
ALTER TABLE app.writing_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.writing_characters FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.writing_characters IS
  'Writing character catalogue for Japanese and Chinese scripts.';

COMMIT;
