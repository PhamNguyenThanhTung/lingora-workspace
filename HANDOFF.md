# Lingora - Current handoff

**2026-10-17 - MODELING MAINTENANCE COMPLETE.**

[Current task](plans/current-task.md) is DONE; [completion snapshot](plans/archive/2026-10-17-modeling-maintenance-DONE.md). No follow-on task is active.

- **Accepted boundary:** Use Case, Activity and logical/domain Class baselines established. Class remains 22 classes + one enum, 28 relationships; no new product policy or ADR.
- **Saved artifacts:** Eight corrected Activity pages merged into the [44-page primary Draw.io](docs/modeling/current-target/lingora-all-diagrams.drawio). Other 36 pages, including accepted DOM, preserved byte-for-byte. Three native endpoint attributes repaired to match unchanged ACT-06/09 sources; original candidates and historical evidence preserved.
- **Provenance:** 17 stale source hashes reconciled. All 36 canonical sources unchanged from maintenance entry. PlantUML title punctuation normalization confirmed; 20 of 21 reproduced pairs identical, ACT-07 PNG has only minor grayscale raster differences.
- **Acceptance:** [Maintenance closeout](docs/modeling/current-target/modeling-closeout-2026-10-16.md), [independent Activity review](docs/modeling/current-target/evidence/2026-10-16-activity-layout/independent-review.md), [provenance review](docs/modeling/current-target/evidence/2026-10-16-modeling-closeout/provenance-review.md). Current artifact integrity, exact merge/scope/DOM preservation and visual review PASS. Logs T-MODELING-CLOSEOUT-001 / MODELING-CLOSEOUT-001 recorded.
- **Current checks:** `py -3.11 docs/modeling/current-target/verify_current.py` and `py -3.11 docs/modeling/current-target/evidence/2026-10-16-modeling-closeout/verify_closeout.py`. Old `verify.py` and Class verifier retain historical task-specific restrictions; their dated results remain unchanged. Raw source hashes are checkout-byte-sensitive.
- **Git:** Accompanying Conventional Commit includes the previously accepted uncommitted Class completion and this maintenance closeout; no push. See latest modeling commit for SHA.
- **Runtime:** Learner SSR auth/register/logout and vi/en foundation only. No learning/Admin/AI runtime or live database/deployment was inspected in this task.
- **Next permitted action:** Await a separately scoped task. Physical/database design, downstream semantic reconciliation, implementation planning, migration and application work remain unauthorized.
