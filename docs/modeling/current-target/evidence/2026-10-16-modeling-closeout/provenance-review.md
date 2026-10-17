# Independent provenance maintenance review

Date: 2026-10-17 (Asia/Saigon). Verdict: **PASS for artifact integrity maintenance**.

Reviewed `verify_current.py`, `refresh_renders.py`, entry/baseline records, render-refresh evidence and current outputs. No blocking defect found. This review does not approve downstream diagrams, product behavior, physical design or implementation.

## Independently observed checks

Environment: Windows PowerShell, Python 3.11, Pillow; repository `D:/school/btl`.

- Command: `py -3.11 docs/modeling/current-target/verify_current.py`. Exit 0; all 36 source/PNG/SVG records PASS, 44 native pages/payloads and recorded native exports PASS. This checks hashes, visible PNG source parity, SVG parse/error markers and native validation, not semantic acceptance of every downstream diagram.
- Read-only Python SHA-256 comparison against `baseline.json`: all 36 canonical PUML files retain exact task-entry bytes. DOM source, PNG, SVG, native page and entry-manifest record remain unchanged. The historical `verify.py` also retains its entry hash.
- Independently counted `render-refresh.json`: 17 old/current source hashes differ; 21 pairs have renderer invocations. Twenty reproduced pairs are byte-identical; only ACT-07 PNG changes. Every reproduced SVG remains byte-identical. The recorded action `render title punctuation` is the initial reproduction label, not evidence that visible title text changed.
- Negative boundary checks on `verify_current.visible`: en dash versus hyphen in a title compares equal; the same substitution in an action body remains unequal; different title words remain unequal. All assertions PASS. Normalization is restricted to title lines and does not suppress body punctuation or wording changes.

## ACT-07 image acceptance

Obtained the prior PNG directly with `git show HEAD:docs/modeling/current-target/rendered/ACT-07-teacher-provisioning.png` using Python binary subprocess output, and compared it with the refreshed primary PNG. Both images are 1042 x 752 and their Pillow metadata dictionaries, including embedded PlantUML source, are identical. Exactly 290 of 783,584 pixels differ (about 0.037%). Every changed pixel differs by only 3 levels in each RGB channel; the only difference triples are `(0, 0, 0)` and `(3, 3, 3)`. The SVG hash is unchanged.

Viewed both images in full. Lane headers, title, action labels, guards, connectors and start/end nodes have the same layout and content; no clipping or readability regression was introduced. The measured difference is consistent with raster rounding, not a diagram change. Temporary local inspection copies under `scratch/provenance-review/` were removed after review; they are not canonical artifacts.

## Scope and limitations

The maintenance helper refuses unexpected non-title differences before rerendering and accepts title differences only after the narrow en-dash normalization. The current verifier retains source/output hashes and embedded-source checks; it explicitly reports artifact integrity without design approval. The old verifier includes historical task-specific assertions and was preserved rather than rewritten to imply that those historical snapshots now pass.

No application, database, deployment or full semantic review was performed. Activity native-layout acceptance and final merged-page preservation are covered by their separate review; this report accepts only the provenance maintenance inspected here. The helper uses local Java/JAR paths supplied by its caller and is dated evidence, not a portable build system.
