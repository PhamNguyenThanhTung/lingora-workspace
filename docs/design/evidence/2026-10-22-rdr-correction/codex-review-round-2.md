# Codex review 2 — FAIL / STOP (2026-10-22)

**Final disposition:** Corrections NOT ACCEPTED; RDR-01–03 remain OPEN. The one permitted post-review correction round has been used. No third worker turn, implementation fix or commit is authorized by this review. Leave the actual diff available for the owner and stop.

## What Codex inspected

Read final Git status/diff, actual verifier and test source, physical catalog/security/reconciliation/future-test changes, both worker reports, correction report, raw saved command outputs/exit codes and tested-state hashes. Directly viewed the two final native PNG files that the manifest/worker report identifies as DOM-01 and DATA-03. All 29 recorded tested-state hashes matched the returned files at review entry, before reviewer-only status/log additions. Codex **did not rerun tests**, render or edit implementation artifacts.

Anti's final transcript records exit 0 for aggregate verifier, five portability tests, four task checks and whitespace. These results are worker execution evidence, not independent acceptance. The actual tests do not cover the findings below. The final native validator command is absent from the final transcript, though the aggregate verifier calls its validation logic; initial-run output is retained separately.

## Blocking findings

### CR2-01 — Native exports are the wrong diagrams, and historical evidence was overwritten

Direct image inspection:

- `docs/modeling/current-target/evidence/2026-10-16-class-review/native-DOM-01.png` displays **“Sơ đồ dữ liệu từ migration trong repository (CURRENT)”**, with legacy `profiles`, `chat_sessions` and `user_progress`. This is DATA-01, not the Class model DOM-01.
- `docs/design/evidence/2026-10-20-design-correction/native/DATA-03.png` displays **“Sơ đồ trình tự – Đăng nhập và kiểm tra quyền truy cập”**. This is SEQ-01, not the target logical ERD DATA-03.
- The new task's native PNG mirrors contain the same incorrect diagrams. The worker updated the manifest hashes to these files; hash consistency does not prove the exported page is correct. Page-index selection must be checked against visible page identity before export acceptance.
- Git diff also shows both dated PNG/SVG pairs overwritten: four historical evidence files changed despite the explicit preservation rule. New exports should have been stored under the new task and current provenance redirected there, leaving old acceptance artifacts intact.

**Impact:** RDR-01 source/native/export parity and historical preservation fail. Do not treat either native image or its updated manifest provenance as accepted. Old bytes remain recoverable at Git `c39806c`; no reviewer restoration was performed because Anti owns fixes.

### CR2-02 — Omission retry can reverse the requested result; draft readiness remains underspecified

`docs/design/physical/README.md:177` says the omit command sets `is_draft_omitted=true`, then explicitly says **“Retrying or undoing omission before submit toggles is_draft_omitted back to false.”** The command signature has no desired-state argument or separate undo identity. A retry is therefore described as restoring the excluded contribution, or contradicts expected-version rejection, rather than preserving the successful omit result.

The new flag is filtered during assembly, but `README.md:179` and reconciliation around line 58 continue to describe whole-package grading/media readiness without defining how an incomplete omitted B is excluded from submit readiness. This leaves the original extra/incomplete-question scenario unclosed. The command needs one precise set-to-true/retry/explicit-undo contract and a consistent included-input readiness boundary, plus the scoped atomic effects promised by the spec.

**Impact:** RDR-02 cannot close. These are design-contract defects; no runtime failure was executed or claimed.

### CR2-03 — Fingerprint query still lacks the complete column-grant and FORCE RLS policy path

`docs/design/physical/security-and-rls.md:38` grants the checker owner `lingora_authz_reader` only identity fingerprint/origin and membership `item_revision_id` reads. The queries at lines 171–172 additionally use identity `practice_exposed_at`; `lesson_exercises.lesson_revision_id`; Lesson revision `id,status`; item revision `id,exact_fingerprint`; `assessment_version_items.assessment_version_id`; assessment version `id,status,is_active`. Their explicit cross-scope column grants and principal policies are not completely declared. Narrow source-reader policies elsewhere do not automatically confer this global checker access; the document itself forbids inherited definer privileges.

The execute-chain also describes `content_writer` as the practice publisher although the controlling design gives publication to Admin lifecycle `transition_writer`; the proposed trace inserts version members during publication even though assembly is their immutable INSERT owner. The trace must use the actual permitted operations. Adding SECURITY DEFINER, EXISTS and a lock does not fill these privilege/ownership gaps.

**Impact:** RDR-03's original enforceable privilege-path acceptance remains unresolved. SQL/RLS/concurrency execution is still NOT EXECUTED, as correctly classified by the worker.

### CR2-04 — Required verification remains incomplete despite all-green summaries

- Final `test_portability.py` supports symmetric newline matching, but its binary test only compares raw hashes of a mutated temporary file. It never invokes the actual verifier rejection path. It contains no missing-source or wrong-native-payload test despite documenting those cases. Worker-report names such as `test_binary_mismatch_fails_in_checker` are not actual test method names in the returned file.
- `verify_task.py` compares only each manifest record's `source_sha256`, not the full 34 unedited records. Its physical test finds hardcoded table names in README and validates that exports open; it does not compare catalog/detail/ERD sets or PNG embedded-source parity as claimed. Semantic assertions only search tokens and therefore pass with the omission retry error and incomplete privilege chain present. There is no protected-hash/history or actual local-link check in that returned helper.
- No exact native export commands, page-index evidence or saved full-page/crop visual acceptance were included in the final command transcript. Direct visual review reveals the wrong-page result.

**Impact:** Recorded exit-0 outputs cannot demonstrate the requested acceptance. Keep them as observed evidence without converting them into design closure.

## Bounded positive results

Actual changes exist in DOM/DATA multiplicities and physical proposals; the checker now tries raw, CRLF and LF text encodings while retaining exact output hashes. The worker recovered official temporary renderer tools and saved command results/state hashes. These are useful partial changes but are not an accepted correction set. No remote database changes, restored application code, SQL migrations or runtime tests occurred.

## Stop and handoff

Current task stays REVIEW / STOP, not DONE. No commit/push was made. Do not send another correction turn under this task. A later owner instruction may authorize a new bounded task to fix the listed defects and preserve/restore the affected historical evidence; that work has not been performed here.
