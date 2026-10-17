# Modeling maintenance closeout — started 2026-10-16, resumed 2026-10-17

User authorized completing the two identified leftovers: Activity v2 native layout and 17 stale source hashes. DESIGN maintenance only. Existing Class completion remains accepted; downstream physical design and implementation remain unauthorized.

## Scope and acceptance

- Review and correct eight Activity pages without changing labels, identifiers, embedded source or node ownership; merge only those pages into the current 44-page primary. Three native endpoint attribute repairs reproduce explicit canonical ACT-06/09 source flow; they do not change product behavior.
- Preserve the current DOM page and other 35 pages byte-for-byte. Historical candidates, approvals and evidence remain immutable.
- Diagnose source/render drift, retain unchanged images where inputs are visibly equivalent, regenerate any visibly changed source, and record exact provenance.
- Validate all 36 source/output manifest records, 44 native pages, relevant visual evidence, scope preservation and whitespace. Independent review must accept corrected native layout before merge.
- Record tests and development evidence, then commit scoped work. Pre-existing Class completion files are preserved; no application changes.

## Entry findings

17 records had stale raw source hashes: seven sequence files differ by line endings relative to the manifest; ten other records differ only in line endings or comment punctuation relative to embedded PNG source. No canonical source was changed by this maintenance task.

Apparent hyphen/en-dash title drift was investigated by reproducing 21 ACT/SEQ/STA PNG/SVG pairs using the existing PlantUML 1.2026.8 tool. **The renderer itself normalizes title en dashes**: 20 pairs reproduced byte-for-byte. Only ACT-07 PNG differs, at 290 grayscale pixels by 3/255 per channel; metadata, dimensions, SVG, text and layout are unchanged. The action label `render title punctuation` in the original run JSON describes the initial hypothesis, not a visible title correction. The current verifier normalizes only that title punctuation; title words and all body text must still match. [Independent provenance review](evidence/2026-10-16-modeling-closeout/provenance-review.md) records observed checks and limits.

The old `verify.py` combines general checks with immutable checks for an earlier physical correction task and its historical visual hashes. It cannot serve as acceptance for later authorized tasks. Historical evidence is retained; current checks must verify the actual current artifacts without claiming downstream approval.

Independent Activity v2 review found ambiguous shared branch/return routes in ACT-01/03/06/08/09. The correction preserves all IDs, labels and embedded source. In addition to geometry, ACT-06 removes two incorrect segment attachments (`e_16.target`, `e_18.source`) which sent optional enrollment through automatic core enrollment; ACT-09 changes `e_12.target` to `action_10` so assignment reaches cloning rather than withdrawal. Both reproduce the unchanged canonical PUML. Original candidates and historical evidence remain preserved.

On resumption, the interrupted executor's script referenced nonexistent `e_27` instead of ACT-01 `e_26`. Its pending pause/self-report routing edits were not yet in the candidate. The mechanical ID error was fixed, the script's invariants passed, and all eight pages were exported again before final independent acceptance. This completes the interrupted self-fix; no additional product decision or redesign was introduced.

## Current checks and scope

- `verify_current.py`: 36 source/PNG/SVG records, decoded image/SVG integrity, visible source parity, 44 native pages/source payloads and recorded native export hashes. Artifact integrity only, not a fresh semantic approval of downstream diagrams.
- `evidence/2026-10-16-modeling-closeout/verify_closeout.py`: exact eight-page candidate merge; other 36 pages including DOM unchanged; canonical source/history/runtime preservation; unchanged DOM manifest; current local links and independent review records.
- `verify.py` and the old Class verifier remain historical task-specific checks, including restrictions that later authorized changes intentionally supersede. Their recorded results are not rewritten or claimed as new PASS results.
- Scope includes current pointers, report, native primary, manifest, ACT-07 PNG, two current verifiers and dated evidence/logs. Prior uncommitted Class completion is retained and included in the final modeling checkpoint, supported by its existing independent acceptance plus current DOM preservation checks.

## Completion — 2026-10-17

**Status: COMPLETE.** [Independent Activity acceptance](evidence/2026-10-16-activity-layout/independent-review.md) accepted the final candidate `b953f9469b2375fa1c4cbcb49d8088668d6c46393cbbcb18d921b0e43e633b30`. Its eight Activity blocks are now in the primary; all 36 other blocks, including accepted DOM, are byte-identical to task entry. [Merge evidence](evidence/2026-10-16-modeling-closeout/merge.json) records exact primary/page identities and manifest native-export provenance.

Current artifact verification and exact closeout preservation checks both exit 0. Independent provenance review PASS; native source/label/endpoint and full-image Activity review PASS. Test/development entries T-MODELING-CLOSEOUT-001 / MODELING-CLOSEOUT-001 record commands, observed results, the interrupted script failure and successful correction. [Completion snapshot](../../../plans/archive/2026-10-17-modeling-maintenance-DONE.md) closes this task; no follow-on task is active.

No new product policy, ADR, database choice, physical approval or implementation work. Current raw-byte source hashes describe this checkout; different checkout line-ending conversion must be reconciled explicitly rather than silently treated as a semantic change.
