# Task

requirements-system-analysis-documentation-recovery

## Status

IMPLEMENTING

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Plan Boundary

This is a documentation-recovery and requirements/system-analysis task. It is not an implementation milestone and does not authorize any product feature, Web screen, API, database, schema, migration, RLS, dependency, PWA, Web Push, scheduler, ML, NLP or reminder implementation. No file outside the approved allowlist below may be changed. Human approval is required before the task can move to `IMPLEMENTING`.

The task must end in `REVIEW` and wait for explicit human approval. It must not be marked `APPROVED` by an agent.

## Objective

Recover and complete the Requirements & System Analysis package after `M1.6W` DONE and before `M2` Web implementation, using repository evidence rather than retroactively normalizing history. The result must be usable by the team and report-ready, while preserving the distinction between:

1. confirmed requirements and acceptance criteria;
2. architecture/technical decisions locked by ADR;
3. implementation evidence observed in code, migrations, tests and commits;
4. missing, inferred, stale or contradictory material requiring human confirmation.

The six original assignment capabilities must be traced end to end:

| Capability | Required trace target |
|---|---|
| Foreign-language learning | Course/Lesson/Vocabulary, exercises, audio, `P1-FR-002/003/012/013` |
| Content/learning management | Admin content/media/scenario management, `P1-FR-008/009` |
| SRS/personalization | `P1-FR-005/006`, `UserVocabSrs`, `ReviewLog`, `record_review`, AI API and fallback |
| Chatbot roleplay | `P1-FR-007`, Chat entities, `/v1/chat/roleplay`, Web Route Handler hop |
| Progress/streak/daily goal | `P1-FR-004/011/014`, `UserProgress`, `Profile` fields and trusted write boundary |
| Scheduled reminder | `P1-FR-015`, client-local in-app `6d` only; no implementation in this task |

Reminder decisions remain locked exactly as follows: `6b` Web Push + scheduler is **DEFERRED, not rejected**; `6d` in-app reminder is a later feature milestone; no reminder is implemented or documented as background delivery in this task.

## Audit Evidence Already Inspected

The planning audit covered the requested canonical and historical sources plus implementation evidence:

- `docs/00-master-plan.md` through `docs/05-traceability-matrix.md`
- `DESIGN.md`, `HANDOFF.md`, `logs/decision-log.md`
- related archives: M0/M0.5/M0.6, scope-gap review, canonical scope alignment, M1.2, M1.5, M1.6 Android, M1.6W, M1.7 Web reset and ADR-009 amendment snapshots
- `lingora-admin/prisma/schema.prisma`
- all three existing Prisma migrations under `lingora-admin/prisma/migrations/`
- current `lingora-web/` foundation, `lingora-ai/api` runtime/tests and lifecycle logs
- current Git baseline: `f13521a` (`feat(web): implement next.js 15 learner foundation with route handler ai proxy (m1.6w)`), clean and tracking `origin/main`

### Confirmed / locked

- `ADR-001` makes `docs/` canonical and preserves legacy material as history/reference.
- `ADR-002`, `ADR-003`, `ADR-004`, `ADR-005`, `ADR-006`, `ADR-008` and `ADR-009` lock ownership, scope, data/RLS/security boundaries, the Web learner platform, the Route Handler AI hop, ES256/HS256 verifier compatibility, and reminder deferrals.
- `docs/02` contains the canonical P1/ML/NLP requirement IDs and acceptance criteria, including `P1-FR-001` through `P1-FR-015` and the NFRs.
- `docs/05` contains a requirement-to-architecture/data/API/test/report matrix and explicit implementation status vocabulary.
- Current Prisma implementation contains 17 application models, 3 migrations, RLS/RPC/storage evidence and only `MCQ`, `FILL_BLANK`, `REORDER` in the applied `ExerciseType` enum. No schema change is authorized here.
- `lingora-web` implements only the M1.6W foundation routes and fixed AI proxy; current M1.6W evidence is in `logs/test-log.md` rows `M1.6W-T-*` and the DONE archive.
- `lingora-ai/api` has protected SRS/roleplay routes, health/model-info routes and 37-test post-ADR-009 evidence; it is frozen for this task.

### Missing or incomplete analysis artifacts

- No authoritative stakeholder/actor catalog with goals, permissions and ownership.
- No complete use-case catalog and no actual use-case descriptions for all six assignment capabilities. `docs/02` lists report deliverables and four important UC topics, but does not provide the descriptions.
- No report/team-readable set of business/system flows covering Auth, lesson learning, content administration, SRS fallback/review write, roleplay, progress/streak/daily goal and the in-app reminder limitation.
- No dedicated implementation-grounded ERD artifact and no complete data dictionary with field ownership, lifecycle, cardinality, RLS/write path and evidence status.
- Existing traceability does not consistently include the required intermediate Use Case and concrete component/API/data links for all six capabilities.
- Assumptions, constraints, dependencies and deferred scope are spread across documents rather than captured in one analysis register.

### Findings and contradictions to preserve as findings

1. `HANDOFF.md` has a current-state paragraph saying M1.6W is DONE, but its “Do NOT do next” and “Suggested next step” sections still describe the pre-Web-foundation state. This is stale lifecycle documentation.
2. `docs/QUICK-REF.md` still says M1.6W is active/next and is dated before the DONE commit. It is inconsistent with `HANDOFF.md` current state, `plans/archive/2026-08-17-m1.6w-web-learner-foundation-DONE.md`, logs and Git `f13521a`.
3. `docs/05-traceability-matrix.md` still describes the M1.6W Web foundation as planned in a historical resolution note, although implementation and test evidence now exists. The note must be classified as historical or updated only with evidence; history must not be rewritten.
4. `docs/01-architecture.md` contains migrated legacy statements that conflict with current evidence: the overview/auth flow says HS256 as the only verifier, the repository tree describes unbuilt future routes, the learner storage text says public URLs while migrations implement two private buckets, and the top diagram includes a direct-looking AI path. ADR-008/ADR-009 and implementation evidence govern the current boundary.
5. `docs/04-data-model.md` explicitly preserves a legacy proposed schema block and marks it as superseded, but the normative data-model sections and the applied Prisma/migrations are not presented as one side-by-side “logical approved vs implemented” view. `GRAMMAR` and word-level `LISTENING` are approved by ADR-006 but are not in the current Prisma enum; this is an implementation gap, not permission to edit schema in this task.
6. The M1.5 archive describes `GET /v1/chat/scenarios` and optional chat score/feedback behavior, while the current `lingora-ai/api/app/main.py` exposes no `/v1/chat/scenarios` route and its response model omits the optional score/feedback fields. The optional fields are contract-compatible when omitted; the route/archive discrepancy must be recorded and escalated without changing `docs/03-api-contract.md` here.
7. The API contract is not to be silently “fixed”: `docs/03-api-contract.md` remains frozen. Any finding that requires a contract field/path/status decision is a human decision or a later approved task.

## Proposed Analysis Package

The following structure is proposed for team and report use. It is a proposal for approval, not an implicit authorization to create the files:

1. `docs/06-system-analysis.md`: problem statement and scope; stakeholders/actors; system boundaries; functional and non-functional requirement interpretation; use-case catalog and descriptions; business and system flows; architecture overview; assumptions, constraints, dependencies and deferred scope; finding register with evidence classification.
2. `docs/07-data-dictionary.md`: implementation-grounded ERD (Mermaid plus stable entity relationship text), entity/field dictionary, cardinality, lifecycle, ownership/RLS/write path, storage buckets and a logical-model-versus-Prisma mismatch table. It must distinguish approved logical fields from implemented fields.
3. `docs/05-traceability-matrix.md`: extend the existing matrix only where the audit proves the mapping, adding explicit `requirement -> use case -> component/service/API/RPC -> data -> test/report evidence` links and statuses such as `CONFIRMED`, `ADR-LOCKED`, `IMPLEMENTED`, `INFERRED`, `MISSING`, `CONFLICT` and `DEFERRED`.
4. `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/00-master-plan.md`: make only evidence-backed cross-reference/status corrections approved by this task. Do not delete migrated history; retain superseded blocks with explicit labels.
5. `docs/project-1/README.md`: report/team reading order linking the canonical docs, system-analysis package, report scaffold and evidence/log locations. Existing DOCX report files remain unchanged in this task.

`DESIGN.md` is audited but remains a UI-only skeleton and is frozen unless a human explicitly approves a narrow cross-reference that does not select brand, typography, navigation or visual tokens.

## Scope After Approval

### Files expected to change

- `plans/current-task.md`
- `docs/06-system-analysis.md` (new)
- `docs/07-data-dictionary.md` (new)
- `docs/05-traceability-matrix.md`
- `docs/00-master-plan.md` (status/ordering/reference corrections only)
- `docs/01-architecture.md` (current-boundary clarifications only)
- `docs/02-requirements.md` (analysis references/status clarifications only)
- `docs/04-data-model.md` (logical-vs-applied evidence clarifications only)
- `docs/project-1/README.md` (new or existing reading-order index)
- `logs/test-log.md`
- `logs/development-log.md`
- `logs/decision-log.md` only for decisions explicitly made by the human during review of this task
- `HANDOFF.md` only when the task reaches `DONE` or `BLOCKED`

### Frozen files and boundaries

- `docs/03-api-contract.md`
- `DESIGN.md` visual decisions and component guidance
- `lingora-web/` source, tests, package manifests and lockfile
- `lingora-ai/` source, tests, requirements and runtime configuration
- `lingora-admin/prisma/schema.prisma`
- `lingora-admin/prisma/migrations/**`, `seed.js`, RLS, RPC and Storage configuration
- all feature code, Web pages, Course/Lesson/Exercise UI, M2 work, Android artifacts/history and staging
- all dependencies, model/training/evaluation files and Word report binaries

Any necessary change outside the allowlist is a stop condition and returns the task to `REVIEW`.

## Ordered Work After Approval

1. Snapshot the approved plan and enter `IMPLEMENTING`; record any human decisions in `logs/decision-log.md`.
2. Re-run read-only inventory and hashes for the canonical docs, Prisma schema/migrations, current Web/AI boundaries and relevant archive snapshots.
3. Build the evidence register: confirmed requirement, ADR decision, implementation evidence, inference, missing item, conflict, owner and proposed resolution. Do not upgrade an inference to a requirement.
4. Draft `docs/06-system-analysis.md` with the six-capability scope and Web-only learner boundary. Include external actors (Learner, Admin, AI Service, Supabase/Auth/Storage as supporting systems) without restoring Android as a learner platform and without inventing a reminder scheduler actor.
5. Draft `docs/07-data-dictionary.md` from the actual Prisma schema and migration SQL; include the legacy-proposed block only as historical context and flag every logical/applied mismatch.
6. Expand traceability and correct only the canonical status/prose contradictions supported by evidence. Keep `docs/03-api-contract.md` and all implementation boundaries unchanged.
7. Update the team/report reading-order index and, only if required, the narrow lifecycle handoff.
8. Enter `TESTING`; run static validation, link/heading checks, entity/enum/migration consistency checks, six-capability trace checks, Web-vs-Android boundary scans, frozen-file diff checks and secret/whitespace scans.
9. Run `code-review-and-quality` as a documentation quality review before `DONE`; record findings and residual risks.

## Acceptance Criteria

1. Every requested audit source is listed with observed status and evidence pointers; no historical claim is silently rewritten.
2. The final analysis package contains all required sections: problem/scope, stakeholders/actors, functional/non-functional requirements, system boundaries, use-case list and descriptions, flows, architecture overview, ERD, data dictionary, API/service boundaries, full traceability, assumptions, constraints, dependencies and deferred scope.
3. All six original capabilities have at least one requirement, use case, owning component/API/data mapping, implementation status and validation/report evidence or an explicit `MISSING/DEFERRED/CONFLICT` status.
4. The learner platform is Web (`lingora-web`) after ADR-008. Android may appear only as superseded history; no current use case, boundary or architecture diagram presents Android as the learner platform.
5. Reminder wording preserves `6b` as deferred and `6d` as a later in-app feature; no task documentation claims background delivery, scheduler execution or Web Push implementation.
6. The data dictionary and ERD match the actual Prisma model/migration inventory as evidence, while clearly flagging approved-but-not-applied `GRAMMAR/LISTENING` scope and any other mismatch. No schema is changed.
7. The API review records implementation/contract/archive discrepancies without changing `docs/03-api-contract.md` or inventing compatibility decisions.
8. All new links resolve, terminology and requirement IDs are stable, and status labels distinguish confirmed, ADR-locked, implemented, inferred, missing, conflict and deferred material.
9. Frozen-boundary diff is empty; no feature, dependency, DB, RLS, API implementation or reminder code is added.
10. Required lifecycle logs contain observed validation output before any `DONE` status; `HANDOFF.md` is updated only at completion.

## Test / Validation Plan

| ID | Validation | Required evidence |
|---|---|---|
| RSA-T-001 | Read-only source inventory and file/hash capture | Commands, file list, commit SHA, clean/frozen boundary status |
| RSA-T-002 | Requirement/UC/architecture/API/data/test/report ID coverage | No missing six-capability trace rows; explicit unresolved statuses |
| RSA-T-003 | Prisma/migration/schema comparison | Entity/enum/FK/index/RLS/storage inventory; mismatch table; no schema diff |
| RSA-T-004 | API implementation comparison | Route/schema/status/error comparison; contract file unchanged; archive discrepancies recorded |
| RSA-T-005 | Web boundary and Android-history scan | Current Web-only references; Android only labeled superseded/history |
| RSA-T-006 | Reminder/deferred-scope scan | Exact `6b` deferred wording; `6d` later in-app limitation; no push/scheduler code |
| RSA-T-007 | Markdown links/headings/terminology and whitespace | Link checker, heading check, `git diff --check`, no secret findings |
| RSA-T-008 | Frozen-path diff and no-implementation scan | Empty diff for frozen files; no new source/dependency/schema/API files |
| RSA-T-009 | Documentation quality review | Review findings and residual risks recorded before DONE |

All test-log entries must use the mandatory Environment/Command/Output/Verdict format. A static/documentation test may be `N/A` only when no runnable command exists, with `git diff --stat` and line-count evidence still attached.

## Stop Conditions

Return to `REVIEW`, add a categorized decision-log finding and wait for human resolution if:

1. A required analysis claim cannot be supported by canonical text, ADR, implementation, migration, test or explicit human decision.
2. Resolving a mismatch requires changing `docs/03-api-contract.md`, schema/migration/RLS/RPC/Storage, FastAPI, Web code, a dependency, or an architecture boundary.
3. A proposed ERD/data dictionary would require adding an entity/column/enum value rather than documenting the observed gap.
4. The evidence contradicts an approved acceptance criterion or requires reopening an ADR.
5. Any document would reintroduce Android as the current learner platform, or describe `6b`/background reminder delivery as implemented.
6. A file outside the approved allowlist is needed, or a report binary/legacy archive would be overwritten.
7. Human clarification is required for a contract route/field/status, milestone ordering/priority, or the final canonical status of an unresolved finding.

## Risks

| Risk | Mitigation |
|---|---|
| Historical migrated prose is mistaken for current truth | Keep source/ADR/implementation labels and preserve superseded blocks |
| Documentation corrections accidentally authorize M2 | Explicit allowlist, frozen boundaries and no implementation claims |
| Prisma logical baseline is confused with applied schema | Side-by-side dictionary and mismatch register |
| Contract/archive mismatch is silently normalized | Freeze `docs/03`; record finding and decision owner |
| Stale handoff/quick-ref misleads team | Correct only through approved lifecycle/documentation scope and log evidence |
| Report package diverges from engineering docs | Single reading-order index and stable requirement/UC IDs |
| Reminder scope creeps into PWA/Web Push | Exact `6b`/`6d` wording and source/file scans |

## Approval

- Status: **APPROVED**
- Approved by: Pham Nguyen Thanh Tung (human)
- Explicit approval text: `APPROVE requirements-system-analysis-documentation-recovery. I approve the proposed docs/06-system-analysis.md and docs/07-data-dictionary.md structure, the stated allowlist and frozen boundaries, and the evidence-based handling of all listed findings. No product feature, M2 implementation, Web/API/AI/database/schema/RLS/RPC/Storage/dependency/reminder/PWA/Web Push changes are authorized. 6b remains DEFERRED and 6d remains a later feature milestone. Proceed only within the approved documentation-recovery scope and return to REVIEW on any stop condition.`
- Date: 2026-08-17

