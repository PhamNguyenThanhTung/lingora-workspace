# Physical Correction Pass Verification Evidence

> Documentation-only correction scope. Physical choices remain PROPOSED / NOT IMPLEMENTED; LIVE DB UNVERIFIED.

## Scope and review result

The correction pass closed the documented counterexamples F01–F12 while retaining the 34-table proposal and approved logical-model files. The second independent read-only recheck records all findings CLOSED in [`independent-recheck.md`](../independent-recheck.md). F10 follows approved ACT-01. Future acceptance scenarios, including default resolution and coverage-tag validation, remain NOT EXECUTED.

## Observed checks

| Check | Command / evidence | Result |
|---|---|---|
| PlantUML syntax | `java '-Djava.awt.headless=true' -jar 'C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar' -charset UTF-8 -checkonly docs/design/physical/physical-erd.puml` | Exit 0 |
| ERD render | PlantUML `-tpng` and `-tsvg`; hashes and PNG dimensions in [`render-manifest.json`](render-manifest.json) | Exit 0; 4 PNG + 4 SVG; SVGs parse; four PNGs visually inspected, labels readable and unclipped |
| Render artifact integrity | `py -3.13 docs/design/physical/correction-pass-evidence/verify_render_artifacts.py` | Exit 0; all four SVGs parse, four PNGs decode, and all 24 root/rendered/CLI-copy files match by SHA-256 |
| Physical correction verifier | `py -3.13 docs/design/physical/verify.py` | Full output: [`../verification-output.txt`](../verification-output.txt); final run is recorded after all task logs/pointers |
| Whitespace | `git diff --check` | Exit 0; only configured LF-to-CRLF informational warnings |
| Worktree baseline | Current verifier compares initial task baseline | 189 approved-modeling files unchanged; HEAD and original Git index unchanged; no out-of-scope pre-existing paths changed |
| Future runtime/database scenarios | No runtime or DB command authorized in this task | N/A — documentation-only correction; all acceptance scenarios remain NOT EXECUTED |

`git diff --stat` is preserved in [`diff-stat-output.txt`](diff-stat-output.txt). It reports the entire already-dirty workspace, not changes attributable only to this task. The exact test environment and output files are recorded in [`environment-and-git-checks.json`](environment-and-git-checks.json) and [`../verification-output.txt`](../verification-output.txt).

## Render artifact note

The `plantuml-cli-output-copy/` evidence directory contains the eight current PlantUML outputs generated during this correction. It is a byte-for-byte hash match to the primary `rendered/` evidence directory. The earlier CLI output-path issue left that duplicate under the task evidence prefix; no generated output was retained outside the correction evidence.

No code, Prisma schema, SQL/migration, database, seed, deployment, staging, or commit action was performed. This evidence does not approve the physical design or authorize implementation.
