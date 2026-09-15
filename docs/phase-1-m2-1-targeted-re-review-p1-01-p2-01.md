# M2.1 TARGETED INDEPENDENT RE-REVIEW — P1-01 / P2-01

> **Report:** `docs/phase-1-m2-1-targeted-re-review-p1-01-p2-01.md`
> **Scope:** verify ONLY the claimed fix of P1-01 (false Applied field claims) and P2-01
> (non-canonical scope label). No general redesign review. No modifications made during review
> (this report file is the sole creation). No M2.2. No D1–D9 changes.
> **Method:** direct file reads + line-level search inspection; migration DDL as physical ground truth;
> conceptual/domain intent never used as status evidence.

## Executive Verdict

**PASS**

`M2.1 = TARGETED INDEPENDENTLY VERIFIED FOR P1-01/P2-01`
(This is NOT a new full M2.1 audit.)

## P1-01

### Migration evidence (physical ground truth)

- `lingora-admin/prisma/migrations/202608140001_init/migration.sql`:
  - `review_logs` = exactly `id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`
    (DDL verified). **No physical `review_logs.score`.**
  - `user_vocab_srs` includes `recall_probability` (DOUBLE PRECISION, nullable); **no `recall_score`.**
  - `user_progress` includes `score INTEGER` (+ 0–100 CHECK) → legitimate applied field.

### Markdown evidence

- §8.15 `ReviewLog` rows now: `id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at` —
  the false `score INTEGER NULL CURRENT_APPLIED` row is gone.
- §8.14 `UserVocabSrs` rows use `recall_probability`; no `recall_score` anywhere in the document
  (search: 0 matches).
- §4.2 embedded UML `UserProgress.score [Applied]` (md:197), §8.13 row (md:587), DD-07 text (md:366,801)
  all refer to legitimate `user_progress.score` — manually inspected each hit.

### PlantUML evidence

- `domain-model-core.puml` `UserVocabSrs` class now lists `recall_probability: Float [Applied]`
  (no `recall_score`); `ReviewLog` class lists `id/srs_card_id/is_correct/interval_days/reviewed_at`
  (no `score`); `UserProgress.score: Integer [Applied]` retained (puml:131) — matches migration.
- Markdown ↔ PlantUML agree on all three entities.

### Search result

- `recall_score`: 0 matches (md + puml).
- `review_logs.*score` as applied claim: 0 matches.
- `score.*Applied` hits (md:197,366,587,801; puml:131): each manually inspected → all are
  legitimate `user_progress.score`. No equivalent forbidden statement remains.

### Verdict

**P1-01 = PASS.**

## P2-01

### §7.1 evidence

- `chat_sessions` row (§7.1:423): Scope = `EXCLUDED`, Implementation Status =
  `CURRENT_APPLIED_DATABASE` (PRESENT / EXCLUDED-from-target / NONE).
- `chat_messages` row (§7.1:424): identical classification.

### Scope / Status values

- Scope axis across §7.1: only `CORE`, `EXTENSION`, `EXCLUDED`.
- Implementation Status axis: only `CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`.

### `LEGACY_APPLIED` search result

- Search across M2.1 md + all 4 in-scope puml files: **0 matches.**

### Verdict

**P2-01 = PASS.**

## Regression Check

- `TARGET_EXT`: only "removed / 0 occurrences" statements in md (5 hits, all removal claims);
  0 in puml. No active design occurrence.
- `MATCHING`: 0 in puml; md hits are removal statements only.
- `Exam` / `QuestionBank` as entities: 0 (md mentions are D4 exclusion-register entries;
  puml: 0 entity/class claims).
- `ARCHIVED.*DRAFT`: puml hits are prohibition text (state note + rule 7), zero transition arrows
  from ARCHIVED (verified); md references are the forbidden-matrix row + boundary note.
- No Core `ARCHIVED -> DRAFT` transition introduced. **No regression detected.**

## Modification Check

- Before verification: `git status --short` (pre-existing worktree dirt from earlier milestones only).
- During verification: **zero files edited** (reads + searches only).
- After verification: `git status --short` + `git diff --check` run; the only new file is this report.
- Untouched: Markdown sources, PlantUML, Prisma schema, migrations, web code, AI code, governance files.

## Final State

`M2.1 = READY FOR NEXT GOVERNANCE DECISION`

`M2.2 = NOT STARTED`

STOP. No fixes applied, no global M2.1 approval claimed beyond P1-01/P2-01, no M2.2, no API/deployment
design, no migration, no schema or code changes.
