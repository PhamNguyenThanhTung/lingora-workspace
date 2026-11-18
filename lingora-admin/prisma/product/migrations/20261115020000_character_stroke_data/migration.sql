-- Sprint 6: S6-02 Stroke Data (CharacterStrokeData)
-- Additive migration for CharacterStrokeData table in app schema.
-- Constraints: FK character_id RESTRICT to app.writing_characters(id), unique character_id,
-- version >= 1, source/license non-empty, strokes JSON array, provenance JSON object,
-- RLS ENABLE/FORCE and revoke PUBLIC/anon/authenticated.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE app.character_stroke_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  strokes jsonb NOT NULL,
  source text NOT NULL,
  license text NOT NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT character_stroke_data_character_fkey
    FOREIGN KEY (character_id) REFERENCES app.writing_characters(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT character_stroke_data_character_id_key
    UNIQUE (character_id),
  CONSTRAINT character_stroke_data_version_positive_check
    CHECK (version >= 1),
  CONSTRAINT character_stroke_data_source_nonempty_check
    CHECK (length(trim(source)) > 0),
  CONSTRAINT character_stroke_data_license_nonempty_check
    CHECK (length(trim(license)) > 0),
  CONSTRAINT character_stroke_data_strokes_array_check
    CHECK (jsonb_typeof(strokes) = 'array'),
  CONSTRAINT character_stroke_data_provenance_object_check
    CHECK (jsonb_typeof(provenance) = 'object'),
  CONSTRAINT character_stroke_data_timestamps_check
    CHECK (isfinite(created_at) AND isfinite(updated_at))
);

REVOKE ALL ON TABLE app.character_stroke_data FROM PUBLIC, anon, authenticated;
ALTER TABLE app.character_stroke_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.character_stroke_data FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.character_stroke_data IS
  'Normalized stroke data for writing character animations, tracing, and grading.';

COMMIT;
