# Final physical review — observed verification

2026-10-11 · Documentation review only; no database or application test executed.

The source-design verdict is **NEEDS PHYSICAL CORRECTION**, with F01–F12 open. Passing documentation/scope checks cannot approve runtime semantics.

**Environment:** Windows NT 10.0.26200; Python 3.13.2; Node v24.11.1; OpenJDK 17.0.2; HEAD `89d58f3da8b9ffcb9a7d9bcdfc6eb76b93eab737`. Commands run from `C:\Users\PC\lingora`, PowerShell. Client review date: 2026-10-11, Asia/Saigon.

## Observed command results

| Command | Exit/output | Verdict and scope |
|---|---|---|
| `$env:PYTHONUTF8='1'; py -3.13 docs/design/physical/verify.py > docs/design/physical/final-review-evidence/physical-verifier-output.txt` | exit1; 55 local links and catalog/semantic-string/render assertions pass; four old-workspace-baseline assertions fail | **FAIL — historical baseline diagnostic**, not final-review acceptance. See exact failures below |
| `java '-Djava.awt.headless=true' -jar C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar -charset UTF-8 -checkonly docs/design/physical/physical-erd.puml` | exit0; no syntax diagnostics | **PASS — PlantUML syntax** |
| `java '-Djava.awt.headless=true' -jar C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar -charset UTF-8 -tsvg -o C:/Users/PC/lingora/docs/design/physical/final-review-evidence/rendered docs/design/physical/physical-erd.puml` | exit0; four SVGs | **PASS — fresh render** |
| Same Java command with `-tpng` instead of `-tsvg` | exit0; four PNGs | **PASS — fresh render** |
| `$env:PYTHONUTF8='1'; py -3.13 docs/design/physical/verify_final_review.py > docs/design/physical/final-review-evidence/current-verifier-output.txt` | exit0; `DOCUMENTATION_AND_SCOPE_CHECKS PASS`; `SEMANTIC_REVIEW NEEDS PHYSICAL CORRECTION; F01-F12 OPEN; RUNTIME TESTS NOT EXECUTED` | **PASS — review-document/scope acceptance only** |
| `git diff --check > docs/design/physical/final-review-evidence/diff-check-output.txt` | exit0; empty stdout; Git LF→CRLF notices on stderr | **PASS — whitespace check** |
| `git diff --stat > docs/design/physical/final-review-evidence/diff-stat-output.txt` | exit0; full global dirty-worktree diffstat attached | **PASS — evidence capture**, not attribution of all global changes |

The current acceptance verifier validates A–S, 34 distinct audited/catalog/ERD tables, twelve OPEN findings with six P1/six P2, local links, role/purpose/config/no-AI assertions, all original/fresh render hashes, 109 unchanged canonical PUML/render artifacts, exact original physical catalog bytes after the status pointer, all other preexisting source bytes, append-only baseline log prefixes, unchanged HEAD/index and confined new paths. Its semantic-string scan does not test SQL/RLS/runtime correctness. New text-file line counts are in its output; `git diff --stat` omits untracked new artifacts.

## Historical verifier failure retained

The prior `verify.py` is bound to the earlier physical-design creation baseline, its six draw.io observations and old task-only path inventory. Later approved native-layout/ACT-05 work and this separate review invalidate that time-specific workspace expectation. The script/output were not rewritten to make its old baseline pass.

```text
FAIL preexisting files changed only in authorized pointers/append-only logs: 11
FAIL six separately observed unrelated drawio files preserved
FAIL task new files only authorized physical/task artifacts
FAIL all 139 canonical modeling files unchanged
PHYSICAL DESIGN DOCUMENT CHECKS FAIL
```

Those 139 files include native editable delivery/preview/task evidence; they are not a claim that logical PUML semantics changed. The current task's 109 canonical PUML/render artifacts all match its own initial hashes. Exactly 38 concurrent modeling paths (including removed/renumbered page previews) are independently captured, corroborated by DNP-001-A logs and preserved at their observed hashes. No blanket unknown-file allowlist was added. [Concurrent observations](concurrent-workspace-observations.json).

## Render/manual evidence

All four original PNGs were individually inspected at full size. Source/caption, FK/nullability/cardinality summaries and cross-view references were compared with typed definitions. Freshly rendered eight outputs are byte-identical to originals, not merely similar dimensions: [fresh hash manifest](render-manifest.json). Identity 1192×655; content 869×760; learning 894×1319; assessment 1361×499. No clipping/layout defect was observed; no ERD source correction was made.

## Review and tooling recheck

Three independent read-only domain reviewers returned findings; primary reviewer checked their counterexamples against ADR/modeling/source. Potential extra demands for a selection-history table and changing current-gate-before-acceptance policy were rejected as insufficiently grounded. A separate final report read found no new material inconsistency and confirmed 34 tables, twelve findings, six P1/six P2 and no implied runtime/product approval.

The new verifier's first run reached all scope/render checks but exited1 at line-count reporting because Python rejected encoding alias `utf8-sig`. Changed it to the recognized `utf-8-sig`; the full rerun exited0. Initial baseline-capture attempt had failed before writing due to Windows default decoding; rerun with `PYTHONUTF8=1` captured 697 files before task writes. Neither failure changed application/source semantics.

No DB credentials were read/reprobed, connection established, SQL policy executed, application test run, migration/seed applied, provider object uploaded/deleted, deployment performed or Git staging/commit done. Runtime/security/rebuild acceptance scenarios remain **NOT EXECUTED**. No new technical architecture choice was adopted, so no accepted ADR was manufactured.

Evidence: [full old diagnostic output](physical-verifier-output.txt), [current acceptance output](current-verifier-output.txt), [diff check stdout](diff-check-output.txt), [global diffstat](diff-stat-output.txt), [review report](../final-review.md), [current verifier source](../verify_final_review.py).
