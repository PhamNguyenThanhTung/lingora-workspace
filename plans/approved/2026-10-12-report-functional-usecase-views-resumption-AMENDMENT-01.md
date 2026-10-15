# Report Functional Use Case Views Resumption — Amendment 01

**Date:** 2026-10-12 (Asia/Saigon)  
**Approval evidence:** The user's direct instruction to continue the interrupted report-oriented UC task includes the original task's scoring and presentation requirements. This amendment records the narrow correction identified during manual review before editing.

## Finding

The rendered VIEW-RUC-03 did not visibly state the required `N`, `K`, `1 / 0.5 / 0`, `N + K`, and completion-independent-from-performance rules. VIEW-RUC-01 also retained an English staff-provisioning note despite the report requirement for Vietnamese labels and annotations.

## Amended permitted scope

- Add one concise Vietnamese note to `VIEW-RUC-03-lesson-practice.puml` stating the core scoring denominator and independent completion rule, with SRS/focus supplementary practice outside core score/completion.
- Translate the staff-provisioning note in `VIEW-RUC-01-auth-profile.puml` to Vietnamese.
- Rerender only VIEW-RUC-01 and VIEW-RUC-03 to SVG/PNG and update only their source/output hashes in the report render manifest.
- Keep all other sources and rendered artifacts unchanged. No canonical UC, behavioral rule, physical design, code, schema, or migration changes.

The amendment remains inside the user's direct documentation/modeling authorization and does not alter the original approval snapshot.
