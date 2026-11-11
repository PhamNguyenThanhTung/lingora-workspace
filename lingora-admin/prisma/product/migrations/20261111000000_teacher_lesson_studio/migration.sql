-- Teacher Lesson Studio & Revision Review Comments — Sprint 1 (T02).
-- Additive migration for canonical lesson blocks and review comment storage.
-- Target: app schema on reviewed product baseline.
-- Additive only: no backfill, no data loss, no schema-wide grants.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- 1. Enum for canonical block types
CREATE TYPE app.lesson_block_type AS ENUM (
  'HEADING',
  'TEXT',
  'GRAMMAR',
  'EXAMPLE',
  'DIALOGUE',
  'CALLOUT',
  'MEDIA',
  'VOCABULARY',
  'DIVIDER'
);

-- 2. Add content_schema_version marker to lesson_revisions
-- 0 = legacy paragraph content, 1 = canonical block rows
ALTER TABLE app.lesson_revisions
  ADD COLUMN content_schema_version integer NOT NULL DEFAULT 0;

ALTER TABLE app.lesson_revisions
  ADD CONSTRAINT lesson_revisions_content_schema_version_check
  CHECK (content_schema_version IN (0, 1));

-- 3. Table: lesson_content_blocks
CREATE TABLE app.lesson_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_revision_id uuid NOT NULL,
  block_key text NOT NULL,
  type app.lesson_block_type NOT NULL,
  position integer NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_content_blocks_revision_block_key
    UNIQUE (lesson_revision_id, block_key),
  CONSTRAINT lesson_content_blocks_revision_position_key
    UNIQUE (lesson_revision_id, position),
  CONSTRAINT lesson_content_blocks_lesson_revision_id_fkey
    FOREIGN KEY (lesson_revision_id) REFERENCES app.lesson_revisions(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT lesson_content_blocks_position_check
    CHECK (position > 0),
  CONSTRAINT lesson_content_blocks_schema_version_check
    CHECK (schema_version > 0),
  CONSTRAINT lesson_content_blocks_block_key_length_check
    CHECK (char_length(block_key) <= 128)
);

-- 4. Table: revision_review_comments
CREATE TABLE app.revision_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_revision_id uuid NOT NULL,
  block_key text,
  item_revision_id uuid,
  author_account_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  row_version bigint NOT NULL DEFAULT 1,
  resolved_at timestamptz,
  resolved_by_account_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revision_review_comments_lesson_revision_id_fkey
    FOREIGN KEY (lesson_revision_id) REFERENCES app.lesson_revisions(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT revision_review_comments_author_account_id_fkey
    FOREIGN KEY (author_account_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT revision_review_comments_resolved_by_account_id_fkey
    FOREIGN KEY (resolved_by_account_id) REFERENCES app.accounts(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT revision_review_comments_item_revision_id_fkey
    FOREIGN KEY (item_revision_id) REFERENCES app.item_revisions(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT revision_review_comments_item_authoring_lesson_fkey
    FOREIGN KEY (item_revision_id, lesson_revision_id)
    REFERENCES app.item_revisions(id, authoring_lesson_revision_id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT revision_review_comments_target_exclusive_check
    CHECK (block_key IS NULL OR item_revision_id IS NULL),
  CONSTRAINT revision_review_comments_status_check
    CHECK (status IN ('OPEN', 'RESOLVED')),
  CONSTRAINT revision_review_comments_resolution_check
    CHECK (
      (status = 'OPEN' AND resolved_at IS NULL AND resolved_by_account_id IS NULL) OR
      (status = 'RESOLVED' AND resolved_at IS NOT NULL AND resolved_by_account_id IS NOT NULL)
    ),
  CONSTRAINT revision_review_comments_row_version_check
    CHECK (row_version > 0),
  CONSTRAINT revision_review_comments_block_key_length_check
    CHECK (block_key IS NULL OR char_length(block_key) <= 128),
  CONSTRAINT revision_review_comments_body_check
    CHECK (char_length(body) > 0 AND char_length(body) <= 4000),
  CONSTRAINT revision_review_comments_timestamps_check
    CHECK (
      isfinite(created_at) AND isfinite(updated_at) AND updated_at >= created_at AND
      (resolved_at IS NULL OR (isfinite(resolved_at) AND resolved_at >= created_at AND resolved_at <= updated_at))
    )
);

CREATE INDEX revision_review_comments_rev_status_created_idx
  ON app.revision_review_comments (lesson_revision_id, status, created_at);

CREATE INDEX revision_review_comments_rev_block_key_idx
  ON app.revision_review_comments (lesson_revision_id, block_key);

-- 5. Revoke direct public/anon/authenticated access and enable RLS
REVOKE ALL ON TABLE app.lesson_content_blocks FROM PUBLIC, anon, authenticated;
ALTER TABLE app.lesson_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.lesson_content_blocks FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE app.revision_review_comments FROM PUBLIC, anon, authenticated;
ALTER TABLE app.revision_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.revision_review_comments FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE app.lesson_content_blocks IS
  'Canonical lesson content blocks per revision (V1); immutable once published.';

COMMENT ON TABLE app.revision_review_comments IS
  'Review comments targeted at a lesson revision, block, or exercise item.';

COMMIT;
