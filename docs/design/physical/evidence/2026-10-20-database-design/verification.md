# Observed verification — 2026-10-20

Environment: Windows PowerShell, Python 3.11/Pillow, JDK17 and cached PlantUML 1.2026.8. Entry HEAD 90429f2637ffc66cc2cbc5681b75382b5c973479. No live DB connection or credential inspection.

## Physical source/render

Drafting executor ran this command, then repeated it with `--format png`; both exit 0:

```powershell
& 'D:/Android/jdk-17/bin/java.exe' '-Djava.awt.headless=true' '-DPLANTUML_LIMIT_SIZE=16384' '-jar' 'C:/Users/tungt/.cache/lingora-diagram-tools/plantuml-1.2026.8.jar' '-charset' 'UTF-8' '--check-before-run' '--no-error-image' '--format' 'svg' '--output-dir' 'D:/school/btl/docs/design/physical' 'D:/school/btl/docs/design/physical/physical-erd.puml'
```

Parent static inspection independently matched every PNG's embedded PlantUML body to its named source panel and parsed SVG/no syntax errors. Executor viewed all PNGs; independent reviewer viewed content/assessment, parent viewed identity/learning. Readable labels, no text/box overlaps. Four SVG/PNG pairs, 34 unique primary tables, no duplicate alias within a view. Reference boxes reuse tables.

## Scoped checks

`py -3.11 docs/design/physical/evidence/2026-10-20-database-design/verify_design.py`: exit 0. Legacy 18-model schema/three migrations, accepted DOM and native 44-page bundle hashes match entry. Catalog/detail/ERD sets agree; four views/eight renders and PNG source parity PASS. Documentation-only scope and local links PASS (215 links on closeout run before this evidence file); one inherited missing historical ERD link explicitly retained.

The first all-link run exited 1 on docs/04-data-model.md's historical plantuml/erd-mvp-learning.puml link. Confirmed identical missing target at entry, preserved historical prose, then changed the scoped check to fail on new broken targets and report inherited unresolved targets. The existing development log's mixed legacy byte encoding is preserved; the verifier scans it with surrogateescape, without conversion.

`py -3.11 docs/modeling/current-target/verify_current.py`: exit 0; all 36 source/render rows, 72 outputs/source parity, 44 native pages/payloads and native export provenance PASS. Integrity only, no reapproval of downstream logical semantics against ADR-043.

`git diff --check`: exit 0; only an existing log line-ending conversion notice. Development/test logs append records without rewriting prior content (12/16 added lines at that check).

## Acceptance boundary

Independent review PASS after one bounded correction, F-DB43-01 CLOSED; no remaining blockers in documentation scope. Full review evidence is review.md in this directory. DB43-01–13 are future runtime scenarios, NOT EXECUTED. No typecheck/unit/integration/installed-RLS/live-database success is claimed. Physical design remains PROPOSED / NOT IMPLEMENTED; no CLEAN REBUILD execution selected. Final staged checks/commit are recorded in T-DATABASE-DESIGN-043 and the completion report.
