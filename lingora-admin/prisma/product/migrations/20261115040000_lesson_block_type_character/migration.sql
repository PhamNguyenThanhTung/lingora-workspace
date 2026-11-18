-- Sprint 6: S6-04a1 CHARACTER Enum Contract
-- Additive migration for LessonBlockType enum value CHARACTER in app schema.
-- Extends app.lesson_block_type enum with CHARACTER.
-- Safe, additive: no data loss, idempotent.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TYPE app.lesson_block_type ADD VALUE IF NOT EXISTS 'CHARACTER';

COMMIT;
