> **FINAL STATUS (2026-10-28): FAIL / STOP / NOT DATABASE READY.** Independent [correction re-review](preapply-review-correction.md) supersedes all resolved/complete claims below. The ERD and SQL bundle are verified local artifacts. Four migrations are recorded as applied; fifth is local/unapplied and has remaining blocking findings. [Source ZIP](database-source-review.zip) contains this review source, not accepted deployment. No Stage B operations were dispatched.

# Lingora Product Database — Remaining Repair (WP-DB-REMAIN-01, Stage A Deliverables)

This evidence directory contains the Stage A deliverables produced under owner authorization ("ok sửa đi rôi đưa 1 cái ảnh database cho tôi xem với cả code database nữa"):

## 1. Database Overview Diagram (ERD)
Generated directly from the canonical 34 product tables and foreign key relationships in `lingora-admin/prisma/product/schema.prisma` using native Graphviz rendering (no generative AI images):
- **PNG format (for viewing):** [`database-overview.png`](database-overview.png)
- **Vector format (SVG):** [`database-overview.svg`](database-overview.svg)
- **Graphviz DOT source:** [`database-overview.dot`](database-overview.dot)

### Domain Clusters Represented:
1. **Curriculum & Content Hierarchy (6 tables, Schema: app):** `languages`, `frameworks`, `levels`, `courses`, `units`, `lessons`.
2. **Authoring, Revisions & Exercise Bank (11 tables, Schema: app):** `content_assignments`, `assignment_history`, `lesson_revisions`, `revision_reviews`, `item_identities`, `item_revisions`, `lesson_exercises`, `vocabulary_concepts`, `lesson_vocabulary_links`, `media_assets`, `media_bindings`.
3. **Learning Runtime & SRS Progression (7 tables, Schema: app):** `accounts`, `learning_contexts`, `lesson_attempts`, `lesson_responses`, `lesson_completions`, `srs_cards`, `srs_review_operations`.
4. **Assessment Engine & Blueprints (5 tables, Schema: app):** `assessment_blueprints`, `assessment_versions`, `assessment_version_items`, `assessment_attempts`, `assessment_results`.
5. **Private Security & System Governance (5 tables, Schema: app_private):** `item_grading_secrets`, `assessment_responses`, `command_receipts`, `audit_events`, `provisioning_requests`.
6. **External Provider:** `auth.users` (Supabase Auth).

---

## 2. Database Code & Migration Source
- **Complete SQL Bundle:** [`database-source.sql`](database-source.sql) — Concatenation of all 5 ordered migrations with boundaries, prerequisites, migration-runner prerequisite clearly labeled, and SHA-256 checksums (6,028 lines, ~277 KB).
- **Canonical Prisma Schema:** [`lingora-admin/prisma/product/schema.prisma`](../../../../../lingora-admin/prisma/product/schema.prisma) (34 product models).
- **Idempotent Seed Script:** [`lingora-admin/prisma/product/seed.mjs`](../../../../../lingora-admin/prisma/product/seed.mjs).
- **Fifth Forward Migration:** [`lingora-admin/prisma/product/migrations/20261028000000_product_remaining_repair/migration.sql`](../../../../../lingora-admin/prisma/product/migrations/20261028000000_product_remaining_repair/migration.sql)
  - Resolves PRE-01 / FDB-05: Restores `prior_revision_id` and `created_at` freeze checks on ever-submitted lesson revisions; enforces monotonic timestamp and generation checks; validates submission facts on reviewable/approved/published states; permits standard lifecycle operations (archive/withdraw) without blocking on `OLD.status = 'PUBLISHED'`.
  - Resolves PRE-02 / PRE-03: Restores blueprint pins comparison against version blueprint pins; review generation vs episode generation check; version snapshot scope authority; enforces 3-array object envelope (`topic_ids`, `skill_ids`, `purpose_tags`) with source lesson tag correspondence; validates JSON regex patterns before casts to prevent SQLSTATE 22P02/22003 and ensure 23514.
  - Resolves PRE-04: Fail-closed transactional history assertion (exactly 4 applied or 5 in progress) plus data integrity assertion gates.

---

## 3. Tooling & Evidence Machinery
- **Catalog Parity Contract Helper:** [`lingora-admin/scripts/product-catalog-contract.mjs`](../../../../../lingora-admin/scripts/product-catalog-contract.mjs)
  - Resolves PRE-05: Authoritative expected structural catalog contract grounded in effective migration DDL.
  - Compares 34 tables, 34 UUID PKs, 100 foreign keys (98 product + 2 provider `auth.users`), 7 partial unique indexes with normalized predicate regexes, 71 enabled triggers, and key function definitions. Supports `allowPendingRepair` parameter.
- **Corrected Preflight Gate:** [`lingora-admin/scripts/product-preflight.mjs`](../../../../../lingora-admin/scripts/product-preflight.mjs)
  - Resolves PRE-04 / PRE-06: 5th migration checksum verification and finite state support (`UPGRADE_REPAIR` -> `REPLAY_REPAIRED`).
  - Implements guarded owned sibling database target exception (`ALLOW_SIBLING_TARGET=1` or `allowSiblingTarget: true`) matching `/lingora_clean_[a-z0-9_]+`.
  - Concrete safe sibling replay proof procedure documented in `inspectCleanProofCapability` with prerequisite checks.
  - Integrated bounded read-only data violation queries to reject incompatible persisted rows.
- **Precise Smoke Suite:** [`lingora-admin/scripts/product-database-smoke.mjs`](../../../../../lingora-admin/scripts/product-database-smoke.mjs)
  - Resolves PRE-07: Evaluates actual installed check expressions from `pg_constraint` (`assessment_results_raw_points_check`, `assessment_results_possible_points_check`, `assessment_results_points_bound_check`, `lesson_attempts_completion_bounds_check`, `lesson_attempts_completion_shape_check`, `revision_reviews_lesson_review_shape_check`, `revision_reviews_version_review_shape_check`) on all required test tuples (including N=2, K=0, count=1, units=999 counterexample, large bounds, SQL null).
  - Resolves PRE-08: Case-level truthfulness. Explicitly records `NOT RUN` for optional/dormant live auth probes and clean-proof capability, preventing false PASS or premature `DATABASE READY`.
  - Resolves PRE-09: Captures pre-mutation byte digest before probes; compares full bytes between seed runs; exhaustive test fixture registry; fresh-connection residue verification with safe client release.
  - Resolves PRE-10: Decomposes creator default ACL entries (`pg_default_acl`) for current user; verifies no default grants to `PUBLIC` (`=X/...`), `anon`, or `authenticated`.
