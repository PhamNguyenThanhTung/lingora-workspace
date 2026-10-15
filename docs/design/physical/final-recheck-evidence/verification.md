# Final physical design recheck — evidence

Started 2026-10-11; completed 2026-10-12, Asia/Saigon. Documentation review only. LIVE DB UNVERIFIED. Acceptance scenarios are NOT EXECUTED.

## Observed execution

- At entry, before any recheck files: `py -3.13 docs/design/physical/verify.py`, exit 0, PHYSICAL CORRECTION VERIFICATION PASS; 34 unique table sets, 93 local links, fourteen commands/scenarios, 189 modeling files, unchanged HEAD/index. [Exact output](entry-verifier-output.txt).
- Syntax: `java '-Djava.awt.headless=true' -jar 'C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar' -charset UTF-8 -checkonly 'docs/design/physical/final-recheck-evidence/physical-erd.puml'`, exit 0, no stdout/stderr.
- PNG render: same Java prefix with `-tpng -o rendered` and same isolated source, exit 0, no output. SVG render: `-tsvg -o rendered`, exit 0, no output. Four of each produced; [manifest](render-manifest.json). All eight match primary renders byte-for-byte; primary renders/source unchanged.
- Each fresh PNG visually inspected individually: identity 1368×715, content 1043×1001, learning 894×1338, assessment 1403×513. Labels readable, no clipping; proposed captions, PK/FK/nullable/unique/cardinality checked against catalog. Governance repeats/alias and assessment tag/index shorthands are explicitly noted in report §N/Q rather than hidden.
- `py -3.13 docs/design/physical/final-recheck-evidence/check_artifacts.py`: final exact output [here](artifact-check-output.txt). Checks unique inventory, four views, edge endpoints/captions, fresh hashes/decode/parse, report links, task permissions/modeling hashes/append-only logs/HEAD/index and new-file line counts. This is artifact/scope verification, not a semantic acceptance test.
- `git diff --check`: observed exit 0; [output](diff-check-output.txt). `git diff --stat`: [output](diff-stat-output.txt) describes the entire preexisting dirty checkout, not task-only attribution. [Task-only diff](task-diff.txt) compares edited files to separately captured entry versions; new task artifacts are reviewed directly and enumerated by baseline check.
- [Authority/status/security scan](source-scan.txt): all legacy role/AI/Jump/A1/fixed-count/100% occurrences in active physical definitions are denials, historical inventory or configuration/test examples; no restored active capability. Historical original OPEN and earlier CLOSED are preserved, current status routes to final report F01/F02 STILL OPEN. No stale historical status is adopted as current approval.

## Verifier scope and independent review

The four prior stale checks were genuinely changed in the correction pass from an old task baseline to its own current authority; entry execution demonstrates its controls pass before this new review. No semantic assertion was deleted and the verifier source was not edited. Its exact new-file allowlist is correction-task specific. A final rerun after this separately authorized task reports new review artifacts outside that old allowlist; [output](post-review-verifier-output.txt) is preserved without changing it to force PASS. The final task-baseline checker independently protects this task's permitted outputs.

Verifier phrase checks cannot discover missing nested-principal grants. The focused [read-only reviewer](principal-review.md) and main reviewer independently traced those paths and found original F01/F02 still incomplete. Final design verdict is NEEDS PHYSICAL CORRECTION regardless of structural checks. No runtime, DB, restore, security-deployment or acceptance execution claim.

## Concurrent workspace observation

A later scope check observed a new unrelated presentation artifact after the entry baseline. Its exact path/hash is preserved in `concurrent-observation.json`; no content was edited or attributed to this task. Initial FAIL output remains in `prelog-artifact-check-output.txt`. The checker accepts only that exact observed path and verifies its captured hash, while preserving all original baseline controls.
