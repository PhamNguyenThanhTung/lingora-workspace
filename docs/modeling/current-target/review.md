# Lingora — Full Diagram Correction Pass

**Date:** 2026-10-11. **Status:** Correction pass complete; READY FOR FINAL MODELING REVIEW. Final modeling approval belongs to the separate next task.
**Scope:** [Approved plan](../../../plans/approved/2026-10-11-full-diagram-correction-pass-APPROVED.md), [user request](../../../plans/approved/2026-10-11-full-diagram-correction-pass-REQUEST.txt). All 36 canonical sources audited; corrections preserve product authority and source identities.
**Authority:** PO decisions → ADR-036 → compatible ADR-030–035 → active requirements → active UC catalog → traceability → diagram. [Decision log](../../../logs/decision-log.md), [requirements](../../02-requirements.md), [UC](../../use-case-specifications.md), [traceability](../../05-traceability-matrix.md).

## A. Diagram inventory reviewed

36 sources: 30 TARGET + 5 CURRENT + 1 DEFERRED. By family: System4, UC4, Activity9, State3, Domain1, Data3, Sequence9, Security1, Deployment2. Active35. Stable VIEW-UC identities differ from UC catalog identities; canonical catalog remains 14 entries (13 active, deferred reminder UC-03). [Index](README.md) separates 20 Main Report, 10 Supporting, 5 CURRENT evidence, 1 Deferred views.

## B. Files changed

All36 `src/*.puml`; shared `style.puml`; `render.py`, `verify.py`, manifest and72 renders; README/review, verification/manual evidence; current-task, new approved/request/baseline/completion archive and indexes; HANDOFF/QUICK-REF/docs README/traceability pointer; appended test/development logs. Exact attribution is listed in [task change inventory](evidence/task-change-inventory.txt) and uses [baseline](../../../plans/approved/2026-10-11-full-diagram-correction-pass-BASELINE.json) and verification output, not whole-worktree diff stat. Existing unrelated changes/index remain preserved.

Prior modeling review, verifier and output are retained as raw evidence under `evidence/2026-10-11-prior-*`; old approved/archive records and ADRs are unchanged. This new correction pass requires a separate Final Modeling Review of corrected outputs.

## C. Use Case corrections

Four views now use Vietnamese academic titles, three business actors, clear Lingora boundary and black nondirectional associations. Overall includes a presentation-only Login from every protected capability (13 dependencies); signup/recovery/activation have no Login include. UC-01 is visually split without adding/renumbering any catalog UC. Include means dependency on authenticated session, not repeated password entry. Reminder and Reassessment removed from active rendered view. Detailed role views show assigned Teacher authoring and Admin blueprint/review/publish/account support.

## D. Activity corrections

All9 activity sources use short actions, participant swimlanes, decisions/merges and black top-down flow. ACT-03 models N core items, K first errors, queue-tail retry exactly once and contributions1.0/0.5/0 over N+K; invalid input is not a counted response. Completion is recorded independently of correctness. ACT-06 includes core auto-enrollment, optional opt-in, card reuse, Policy B recurring30, Forgotten reset and one reinforcement without rescheduling. ACT-01/04/09 cover available/locked/coming-soon content, eligible denominator, withdrawal/replacement and retained evidence. ACT-05 is disconnected DEFERRED — NOT IN MVP. ACT-08 shows Teacher authoring/validation and Admin review/approval with immutable publication.

## E. Sequence corrections

All9 use business-level Vietnamese messages and standard actor/Web/Backend/Auth/Database lifelines with alt/opt/loop. No API/SQL messages or note panels. SEQ-01 handles invalid credentials and fresh status checks. SEQ-06 models valid responses and queue/contributions. SEQ-07 separates invalid submission, duplicate same submission and valid new submission; binds the immutable version and returns aggregate evidence only. SEQ-08 separates enrollment, scheduling and non-scheduling reinforcement. SEQ-09 fixes the formerly unconditional DISABLED response: disable/re-enable now has current-status branches and minimal Learner support without evidence edits.

## F. State corrections

STA-01 retains authorized activation/active/disabled behavior and next-request denial. STA-02 removes unsupported CLOSED workflow; a single responsibility state changes current Teacher while preserving authorship/history. STA-03 retains Draft → In Review → Changes Requested/resubmit → Approved → Published → Archived/Withdrawn. Published change creates another revision; no in-place edit or hard-delete of learner references.

## G. Domain/Class corrections

DOM-01 is UML: business classes, named associations, multiplicities, minimal logical attributes and composition only for contained concepts. It has no SQL types, PK/FK, indexes or physical columns. LearningPlan and Progress are derived domain outputs. Course–Language multiplicity does not freeze the one-core-course MVP convention as a permanent schema invariant.

Manual DOM-01 versus DATA-03 comparison: DOM asks who owns/uses/contains which business concepts. DATA asks which evidence/identity/link/history structures must be retainable. DOM has User/Profile, Language/Framework/Level/Course/Unit and derived plan/progress; DATA groups account/curriculum references and adds response records, LessonVocabularyLink, version-bound item snapshots, assignment history and idempotent SRS operations. Node sets, attributes and relationship notation differ materially; they are not the same drawing with changed title.

## H. ERD/Data corrections

DATA-03 uses entity compartments with logical identifiers/references and crow's-foot cardinality. Completion evidence is distinct from attempt/per-response performance; contexts, SRS card uniqueness, immutable assessment versions/results and history are expressible. Grouped AccountRecord/CurriculumReference are presentation abstractions, not denormalization approval or required physical tables. Cross-domain references appear in fields; a few joins are omitted for readability and must be mapped in later approved physical design. No SQL datatype/index/cascade/naming strategy selected.

DATA-01/02 remain separate CURRENT subsets. Metadata and mismatch explanations move to comments/index; entity fields retain inspected artifact types. Migrations17tables/tworoles differ from Prisma18models/sixroles/Unit/AuditLog. This is repository evidence, not deployed DB evidence.

## I. System/Security/Deployment corrections

SYS-01/03 and DEP-01 now label repository/configuration artifacts; no current cloud deployment claim or unused learner product DB edge. SYS-04 uses explicit application/backend boundaries and distinct aliases for the two backend packages, preventing accidental PlantUML package merging. Modules are in-process. TARGET allocation uses only existing Learner Web, Admin Web and Supabase boundaries. SEC-01 retains untrusted browsers, trusted identity/server role/status, grading secrecy, published/draft access, authoritative/idempotent SRS, bounded support and append-only audit. No AI runtime or new infrastructure.

## J. Visual normalization

Shared monochrome style: white background, black text/arrows, black/gray borders, Arial14, title18, no shadows/decorative color. All report titles and business flow labels are Vietnamese; canonical class/entity names remain English for mapping. Removed blue arrows, yellow/colored notes, debug footer, rendered source/authority metadata, long annotation panels. Deprecated Padding was removed after a preview exposed a renderer warning banner. DOM/data package clustering was removed after preview showed excessive cross-package whitespace; short rows and a few hidden alignment links improve layout.

## K. Cross-diagram consistency

N/A means no separate authorized state machine/class behavior is necessary; the concern is represented in other views. The matrix evaluates logical documentation, not implementation.

| Concern | UC | Activity | State | Domain | ERD | Sequence | Security | Result |
|---|---|---|---|---|---|---|---|---|
| Authentication | UC-01; VIEW-UC-01–04 | ACT-01/07 | STA-01 | User/Profile | AccountRecord | SEQ-01/02/09 | SEC-01 Guard/Auth | Session dependency, public exceptions, trusted role/status |
| Lesson completion | UC-06/08 | ACT-03 | N/A | LessonAttempt/Progress | CompletionRecord vs AttemptRecord | SEQ-06 | Grading/LearningState | Valid flow + recorded completion, no accuracy gate |
| Lesson scoring | UC-06 | ACT-03 | N/A | LessonAttempt.performance | ResponseRecord + sum/count | SEQ-06 | Server grading | N+K;1.0/0.5/0; latest completed primary |
| SRS | UC-07/08 | ACT-06 | Card stage; no graduation state | User–SrsCard–Vocabulary | Card/Operation | SEQ-08 | Server schedule/idempotency | Core/optional/reuse/recurring30; reinforcement no reschedule |
| Placement | UC-02 | ACT-01/02 | No permanent lock | Context/Result/Version | Attempt→Version→Result | SEQ-07 | Protected keys/aggregate | Recommendation only; completed evidence; no certification |
| Level-up | UC-05 | ACT-04 | N/A | Blueprint/Version/Result | Pinned version/result | SEQ-07 | Protected keys/aggregate | Configured curriculum+exam gates; availability separate |
| Curriculum availability | UC-04/06/08 | ACT-01/04/09 | STA-03 | Lesson/Progress | CurriculumReference, Revision, Completion | SEQ-05/06/07 | Published reads | Future/withdrawn incomplete excluded; history retained |
| Teacher assignment | UC-09/10/11 | ACT-08/09 | STA-02 | Assignment–Teacher–Lesson | Assignment/History | SEQ-03 | Assigned scope | One current Teacher; attribution/history retained |
| Content review/publish | UC-12 | ACT-08/09 | STA-03 | ContentRevision | Revision/active reference | SEQ-04/05 | Approval/draft guard | Approval-first, immutable, atomic replacement/failure retain |
| Assessment package | UC-09–12;02/05 | ACT-08/02/04 | STA-03 content lifecycle | Blueprint/Version/Item/Result | VersionItem + Attempt/Result | SEQ-03/04/07 | Secret/readiness guard | Admin blueprint; Teacher items; validation/pinning/no exposed reuse |
| Account disable | UC-01/13/14 | ACT-07; support in SEQ09 | STA-01 | User/status/AuditEvent | Account/Audit | SEQ-01/09 | Guard/Support/Audit | Next-request denial; minimal reads; no evidence edit |

Remaining ambiguity is restricted to separately authorized physical/configuration design; it does not choose a new product policy here. Duplicate conceptual themes across activity/state/sequence are intentional complementary views. Keep detailed provisioning/replacement/state/module views as supporting material rather than deleting traceable sources.

## L. Render evidence

Final global render: **36 sources / 36 SVG / 36 PNG / 0 render failures**; SVG and PNG commands each exited0. All36 final PNGs were opened individually, with ACT-06/STA-01 reinspected after final regeneration. Static verification exited0: inventory/classification, fresh style/source/output hashes,36 visual rows bound to final PNG hashes, grayscale, no error/warning/metadata, semantic/legacy scans,183 local links, permitted scope and preserved HEAD/index. Independent review closed its ACT-06 reinforcement-loop finding and found no remaining substantive correction issue. `git diff --check` exited0; new-file line counts were observed. Required test/development logs appended without rewriting historical bytes; no new ADR or commit.

[Static output](verification-output.txt), [per-image review](evidence/visual-review.md), [independent review](evidence/independent-review.md), [manifest](render-manifest.json), [diff check](evidence/diff-check-output.txt), [whole-worktree stat](evidence/worktree-diff-stat.txt), [test log T-DCP-001](../../../logs/test-log.md#t-dcp-001---full-diagram-correction-pass-2026-10-11), [development log DCP-001](../../../logs/development-log.md#dcp-001---full-diagram-correction-pass-2026-10-11). Whole-worktree stat includes pre-existing unrelated changes; baseline comparison controls attribution.

## M. Remaining concerns

Aggregate DOM/ERD need a dedicated landscape report page or full-resolution SVG; long governance/SRS flows need a full portrait page. Page-fit readability depends on the final report template; no deck/report file was provided or changed. PO sample images were not attached, so acceptance follows the explicit written style requirements. Live DB/applied migrations/deployed controls remain unverified. Physical relation mapping/configuration remains separate authorized work. No unresolved product decision is inferred from those limits.

## N. Readiness

**READY FOR FINAL MODELING REVIEW**. Correction, render,36-image manual review, independent correction review,11-concern matrix and required evidence/logs are complete. No remaining logical mismatch was found within this correction scope. STOP: a separate FINAL MODELING REVIEW by Product Owner/Codex must review these corrected outputs. This pass does not authorize physical design, application implementation, migration/DB operation or final modeling approval.
