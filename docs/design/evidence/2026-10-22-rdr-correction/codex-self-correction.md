# Codex self-correction after round-2 review

**Date:** 2026-10-22  
**Authorization:** Owner's direct instruction to fix the remaining review findings after [Codex round 2](codex-review-round-2.md).  
**Status:** Corrections for CR2-01–03 applied locally; CR2-04 and independent acceptance remain open. This report supplements the historical [Antigravity correction report](../../rdr-correction-2026-10-22.md); it does not rewrite that worker record or close RDR-01–03.

## Corrections made

- **CR2-01 — native exports and preservation:** Restored `native-DOM-01.png/.svg` and `native/DATA-03.png/.svg` to the bytes at entry commit `c39806c`. Exported the actual `page-DOM-01` (zero-based index 28) and `page-DATA-03` (index 31) from the 44-page primary Draw.io file into this task's `native/` directory. The images were visually inspected: DOM-01 shows the class model and optional audit actor; DATA-03 shows the logical ERD and optional account relation. Updated `render-manifest.json` to use those new paths and accurate Draw.io Desktop 24.7.17 page-index provenance.
- **CR2-02 — omission and readiness:** Kept `set_draft_assessment_contribution_omitted(lesson_revision_id, item_id, is_omitted, expected_row_version)` as a desired-state operation. Stale retries conflict without writes, same-state retries cannot undo omission, and explicit re-inclusion requires a current version. Teacher submission checks Lesson-level requirements separately from included ASSESSMENT contribution readiness; assembly filters omissions before blueprint count and coverage checks, without creating partial versions or falling back to an older source. Added the flag to the physical ERD and updated its rendered content view.
- **CR2-03 — checker privilege path:** The proposed dedicated `lingora_fingerprint_reader` has explicit SELECT columns for all six referenced relations, named independent FORCE RLS policies, no login/membership/BYPASSRLS, and no secret/prompt access. The only caller is the checked Admin publication path owned by `lingora_transition_writer`; `content_writer` and `assembly_writer` do not receive checker EXECUTE or version-member mutation responsibility. The two-course/two-assignment race trace retains the shared advisory lock through commit.

## Evidence and limits

The four restored historical assets match entry Git `c39806c` (compared with `git diff --quiet`). New native exports are SHA-bound in [render-manifest.json](../../../modeling/current-target/render-manifest.json). PlantUML rendered the four physical ERD views using the local 1.2026.8 JAR; the content view shows `is_draft_omitted` visibly and was manually inspected. The other three regenerated exports were restored byte-for-byte because their views did not change. The source and updated content PNG/SVG hashes, dimensions, and visual note are recorded in [verification-manifest.json](../../../design/physical/verification-manifest.json).

Commands run for the physical ERD render (working directory `docs/design/physical/`); both exited 0:

```text
java -Djava.awt.headless=true -DPLANTUML_LIMIT_SIZE=16384 -jar /tmp/lingora-diagram-tools/plantuml-1.2026.8.jar -charset UTF-8 -tsvg -o . physical-erd.puml
java -Djava.awt.headless=true -DPLANTUML_LIMIT_SIZE=16384 -jar /tmp/lingora-diagram-tools/plantuml-1.2026.8.jar -charset UTF-8 -tpng -o . physical-erd.puml
```

`git diff --check` exited 0 after removing two trailing-whitespace-only lines introduced at page boundaries. No tests, task verifier, database checks, SQL, migration or deployment were run. The prior test outputs are Antigravity's worker evidence; Codex did not independently reproduce them. CR2-04 remains open because the recorded helper coverage did not exercise the claimed rejection paths. Physical design remains PROPOSED, runtime/RLS/concurrency remain NOT EXECUTED, and the live database remains UNVERIFIED.

All changes remain uncommitted. The [current-task pointer](../../../../plans/current-task.md) and [handoff](../../../../HANDOFF.md) reflect the open status.
