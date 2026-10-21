# Lingora — Full design re-review, 2026-10-21

**Request:** “review lại full phần thiết kế”. **Mode:** DESIGN, review only.

**Verdict: NEEDS BOUNDED DESIGN RECONCILIATION.** Three P2 findings remain in the reviewed design. No new P0/P1 was confirmed. Previous FDR-01–07 corrections remain closed within their documented scope; this review identifies additional cross-view and physical-command gaps, not a blanket reopening of that work. This verdict neither approves physical mechanisms nor authorizes implementation.

## Scope and method

- Clean entry HEAD `752b4e147ca841cac83670bb8a21f5a2fa5f5cf5`. Read current-task, QUICK-REF, HANDOFF and documentation authority map in order.
- Approved ADR-030–036/041–043, current UC catalog and requirements/traceability addenda control behavior. Current implementation and historical reports are evidence only.
- Three independent read-only reviewers covered logical/domain sources and nine report-usecase sources; physical catalog/security/reconciliation/ERD; architecture/UI/requirements/traceability. Coordinator checked the reported source lines and counterexamples. No implementation work packages.
- Coverage includes the canonical 36-source inventory (30 TARGET, five CURRENT evidence views, one DEFERRED marker), current UI index, compatible accepted architecture target, historical M2.3/core-contract boundary and proposed physical design. Historical/current distinctions were preserved; no report/deck or historical approval was rewritten.
- Visual sampling: current SEQ-03 PNG and physical identity ERD PNG. No obvious clipping or renderer failure in those samples. This is not full visual reacceptance of all 44 native pages.

## RDR-01 — P2: Logical audit relations require an account for system events

**Evidence:** [DATA-03](../modeling/current-target/src/DATA-03-target-logical-erd.puml), line 164, `Account ||--o{ Audit`; [DOM-01](../modeling/current-target/src/DOM-01-core-domain-model.puml), line 280, `User "1" -- "0..*" SecurityAuditEvent`. Both require exactly one business account per event. Corrected [SEQ-03](../modeling/current-target/src/SEQ-03-assignment-authoring-submit.puml), line 55, records SYSTEM audit for system assembly. [Physical security proposal](physical/security-and-rls.md), lines 43/168, explicitly distinguishes SYSTEM without a fabricated account, and verified-auth-subject denial before an application account exists.

**Scenario/impact:** System assembles a valid version and must record its event. The structural logical models cannot represent that event without attributing it to an unrelated User/Account or omitting it. The optional-account physical proposal handles it, but the logical views and sequence disagree. This is a modeling mismatch, not observed audit loss.

**Minimum correction:** Express the logical actor distinction and conditional account reference; account actions must still identify their account. Do not add a fourth business role or require a new table. Reconcile current DOM/DATA source, exports and native pages with scoped preservation; retain dated Class acceptance as history.

**Acceptance:** Account action, system assembly and denial with verified identity but no application account can each be represented without false attribution; account-required actions cannot omit their actor. **Owner:** domain/modeling maintainer; route a genuinely new actor policy to PO if needed.

## RDR-02 — P2: No defined removal path for an assessment contribution in an unfrozen Lesson draft

**Evidence:** [Physical catalog](physical/README.md), lines 87/89/177: an ASSESSMENT item has immutable `authoring_lesson_revision_id`; `lesson_exercises` accepts PRACTICE only; removal covers exercise, vocabulary and media association rows. [Security proposal](physical/security-and-rls.md), lines 41/95/125, grants only those association deletes, with no item-revision deletion. [Assembly reconciliation](physical/database-reconciliation-2026-10-20.md), lines 60–64, selects declared blueprint contributions from the effective submitted Lesson snapshot.

**Scenario/impact:** Teacher adds an extra or incomplete ASSESSMENT question to an unfrozen Lesson and then wants to omit it before submitting. There is no assessment draft association to remove, no declared inclusion/exclusion flag, and the owner reference cannot be detached. Editing the question is possible but does not express omission. Successor snapshots can omit old contributions, so this is not proof that submission is impossible forever; it is a missing ordinary draft-edit contract and may force an unspecified whole-package workaround.

**Minimum correction:** Specify a bounded way to exclude an unsubmitted assessment contribution from that draft, or explicitly define a supported successor-with-omission operation for this case. Map its fields, command, grants, locks, readiness and assembly filtering. Preserve immutable submitted sources, item attribution and historical version membership; do not introduce a generic delete or question bank.

**Acceptance:** Add A/B to a current assigned unfrozen draft, remove B, submit and assemble without B; stale-version/former-assignee/frozen-source removal is rejected; A and prior evidence remain intact. **Owner:** physical/content design maintainer.

## RDR-03 — P2: Cross-scope fingerprint checks lack a complete privilege path

**Evidence:** [Physical catalog](physical/README.md), line 181, requires rejection of equal fingerprints appearing in practice membership/exposure, including copied IDs, and the inverse guard before exposing practice matching a published assessment. It prescribes fingerprint advisory locks. [Security proposal](physical/security-and-rls.md), lines 156–166, restricts readiness/grader/assembly reads to exact source, review or pinned-attempt scope; lines 203/206 restrict supplementary reads to accessible PRACTICE/context scope. No bounded cross-scope existence-check function, principal policy and EXECUTE chain is specified.

**Scenario/impact:** A matching exposed practice item belongs to a different assignment outside the assessment-source reader's permitted rows. The required collision query cannot be assumed to see it under the declared FORCE RLS policies. The fingerprint lock serializes checks but does not grant visibility. Depending on implementation, the command could fail or miss a prohibited match; no deployed leak was observed.

**Minimum correction:** Specify an internal existence-only collision check with explicit cross-scope fingerprint/membership/exposure reads and named caller privileges, or an equivalently bounded enforceable mechanism. Do not grant Teachers access to other Teachers' question bodies or keys. Preserve shared lock ordering and check both assessment publication and practice exposure directions.

**Acceptance:** Distinct item IDs with equal fingerprints across assignments and courses are rejected where the declared rule requires; authorized callers receive only a bounded result; concurrent absent-row creation/publication cannot bypass the check; ordinary Teacher/runtime callers cannot enumerate foreign content. **Owner:** physical/security design maintainer. Future SQL/RLS acceptance is required; documentation checks alone cannot prove enforcement.

## Coverage and existing open work

| Area | Review outcome |
|---|---|
| UC/Activity/Sequence and nine report views | No further confirmed behavior regression: three roles, Lesson-only assignment, system assembly, correction successors, entry and deferred UC boundaries remain consistent. |
| Lesson/assessment/SRS/context | N+K performance, completion independent of correctness, immutable assessment pins/aggregate feedback, revision vocabulary, SRS scheduling/reinforcement and Study Focus boundaries remain consistent in the reviewed sources. |
| Class/logical data | RDR-01 actor/cardinality reconciliation. FDR revision vocabulary and provenance corrections remain present. |
| Physical catalog/security | RDR-02/03. FDR supporting UNIQUE keys, review receipt command/replay rules and purpose mapping remain present; prior closed F01/F02 are not reopened merely because runtime is unverified. |
| UI/architecture/traceability | No new actionable semantic finding. Current UI index includes staff activation/shared account states and approved flows. SYS/SEC/DEP preserve logical boundaries and distinguish repository evidence from deployed state. |
| Implementation readiness | Core transport contracts, concrete configuration, per-slice UI details and NFR/operational acceptance remain explicitly open. These are prerequisites, not newly discovered regressions. Physical approval is still separate. |

## Verification and limits

Environment: local Windows PowerShell, Python 3.11/Pillow, repository entry above. No remote research or live database access.

1. `py -3.11 docs/modeling/current-target/verify_current.py` with `PYTHONUTF8=1`: exit 0, all 36 source/PNG/SVG records, visible source parity, 44 native pages/payloads and export provenance PASS. Artifact integrity only.
2. Inline Python read-only catalog/detail/ERD inventory plus Pillow embedded-source and SVG parsing: exit 0, 34 matching table definitions, four views/eight valid exports, PNG/source parity PASS. No historical task-specific preservation checker was misused as this review's gate.
3. Independent source reviews and coordinator line-level validation produced the three findings above. No runtime, SQL, DB43/PERS, security or concurrency acceptance was executed. Live DB/deployment remains UNVERIFIED.

The review changes only this report, task/handoff/index/closeout and appended logs. Canonical diagrams, proposed physical mechanisms, approved ADRs and application/database files remain unchanged.

## Active review backlog

RDR-01 → modeling maintainer; RDR-02 → physical/content maintainer; RDR-03 → physical/security maintainer. Close each with the acceptance above and independent verification. Suggested order: reconcile actor semantics, specify draft omission, then complete collision-check privileges before physical approval. These findings do not automatically authorize a correction task. Review completion and design approval are separate outcomes.
