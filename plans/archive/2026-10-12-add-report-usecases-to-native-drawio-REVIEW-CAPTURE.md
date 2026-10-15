# Current task pointer

**Task:** Add report functional Use Case views to native Draw.io.
**Status:** REVIEW — implementation paused after a source/output semantic gap was found.
**Approval:** [Approved scope](approved/2026-10-12-add-report-usecases-to-native-drawio-APPROVED.md), authorized directly by the user's request to insert the new UCs immediately after page 08 Admin.
**Baseline:** [Pre-change package evidence](approved/2026-10-12-add-report-usecases-to-native-drawio-BASELINE.json) captured before implementation.

**Scope:** Add the nine existing `VIEW-RUC-01`–`VIEW-RUC-07`, `VIEW-RUC-08A`, and `VIEW-RUC-08B` diagrams as editable pages 09–17, immediately after Admin. Keep canonical UC identities and all 35 existing page semantics; keep deferred `ACT-05` omitted. Update builder, layout, validator, parity checks, focused tests, and package/task documentation as permitted by the approval snapshot.

**Permitted files/actions:** See approved scope. Do not edit report/canonical PUML or render outputs, product/physical decisions, application or database files. Preserve unrelated work. No staging or commit.

**Review blocker:** The pre-change Draw.io contains embedded PUML payloads that differ from the current canonical sources in UC-02, ACT-01, ACT-03, ACT-06, DOM-01, DATA-03, SEQ-06, and SEQ-08. Rebuilding the full bundle therefore changed existing page payloads while adding the nine report pages. The requested bounded addition cannot be accepted as implemented until the original pages are restored/preserved or the user explicitly resolves the source drift. The target currently has 44 generated pages, but completion and verification are paused in REVIEW.
