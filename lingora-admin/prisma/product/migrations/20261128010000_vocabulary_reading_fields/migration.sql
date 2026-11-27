-- EXT-01 — Japanese reading fields for vocabulary concepts.
-- Additive only: two nullable columns, no backfill, no default, no trigger.
-- Old code ignores the columns, so rolling code back does not require dropping them.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE app.vocabulary_concepts
  ADD COLUMN reading text NULL,
  ADD COLUMN romanization text NULL;

COMMIT;
