# Slice 5 — Codex independent verification

**SLICE 5: PASS — SLICE 5 ACCEPTED (2026-10-30).** Baseline main/origin/main `a480051`. Codex review/direct fixes, final local gates, live acceptance and authorized retention accounting are complete.

## Domain and routes

[Spec](2026-10-30-slice-5-lesson-assignment-draft.md): Lesson UUID skeleton belongs to Unit; Course/Level derive through Unit. Position is positive int32, unique per Unit. Admin owns position/isRequired; new availability is PLANNED. There is no Lesson title/code/body/duration field. Localized title and plain paragraph content live in LessonRevision.

ContentAssignment is unique per Lesson; immutable AssignmentHistory captures assignment episodes. Targets must be ACTIVE TEACHER accounts. Lesson.rowVersion is the aggregate CAS token. Account-first sorted NO KEY UPDATE locks serialize lifecycle changes while allowing FK key-share checks; Lesson/assignment use FOR UPDATE. See the [PostgreSQL row-lock compatibility contract](https://www.postgresql.org/docs/17/explicit-locking.html#LOCKING-ROWS).

Each explicit Teacher Save appends a DRAFT LessonRevision with max revisionNo+1, priorRevisionId and current assignment episode; creator must match that episode's Teacher. Highest means highest across all statuses. Old rows are preserved; activeRevisionId stays a publication pointer. Unsupported existing structures/associations are read-only. No schema gap or migration, review/publish workflow, autosave or Slice6 implementation.

Admin page: `/courses/[courseId]/units/[unitId]`, linked from UnitsCatalog. Explicit nested Lesson list/create, detail/update, assignment and teacher-options APIs. Teacher entry from accepted holding into `/my-lessons` and `/my-lessons/[lessonId]`, with separate `/api/teacher/lessons` APIs and exact TEACHER enforcement in addition to accepted staff verification.

## Anti handoff and Codex corrections

[Anti initial delivery](slice-5-delivery.md): services/APIs, real pages/components/navigation and local fixtures/tests; initial291 feature/69 component passes. Correct old baseline is260/60, not the worker's inaccurate per-suite breakdown. [Independent Sol High review](slice-5-review.md) required changes. The review artifact was saved before that agent's final reply hit a usage limit; Codex owns final acceptance.

Codex addressed all nine findings: real stale-content reconciliation and blocked stale saves; exact production callbacks with distinct authoritative DTOs; owner/status/parent/episode/concurrency/rollback tests; real Admin refresh recovery; explicit cleared locales and success-field reconciliation; recoverable Teacher-options errors; accepted401/403 login/logout flows; correct503 retry page ordering; opaque404 ownership before CAS.

Additional fixes: removed swallowed SQL lock errors and unlocked mock fallbacks; strict positive canonical int64 tokens; preserved locale/scalar/coverage metadata; omitted ambiguous nullable JSON input (see [Prisma JSON NULL contract](https://www.prisma.io/docs/orm/v7/prisma-client/special-fields-and-types/working-with-json-fields#using-null-values)); blocked inconsistent workflow facts; bounded raw draft requests at1MiB; shared relation selection and highest-only summary reads; restored baseline page/modal primitives and pending navigation locks. Stateful doubles now enforce relevant FK/provenance/unique/JSON rules. New regressions first exposed14 failures on the handoff; server fixes made them green.

One final full run exposed the accepted Course pending test's fixed450ms race. Only that test was changed to hold/release the response explicitly; all original pending/duplicate/Escape/backdrop checks remain, plus payload assertions. Course runtime was unchanged. Failure diagnosis/focused logs are external.

## Gates

Cwd: `lingora-admin`. Raw logs remain outside Git in `/home/tung/.codex/task-logs/slice-5-lessons/`.

- Final `npm run test:feature`: **327/327**, Auth33 + Languages41 + Frameworks81 + Courses41 + Teachers64 + Lessons67; exit0, no skips.
- `npm run test:components`: **87/87**, exit0 after the deterministic Course-test correction; suite breakdown12+19+14+15+9+18, no skips/assertions/tests removed.
- `npm run typecheck`, then `npm run build`: exit0. Two inherited Turbopack tracing warnings point to unchanged generated Prisma client/runtime; no dependency/generated-client changes.
- Pre-live gates were322 feature/87 component plus typecheck/build and six killed controls. Five additional negative integration/episode/latest-status tests were added after live to make the final proof explicit; production code stayed unchanged.

Mutation controls: A uses assignee identity instead of verified caller at the ownership gate (so the unauthorized write reaches a valid provenance path); B removes the transaction ACTIVE check; C removes assignment target role/status guard; D removes nested parent checks; E changes the actual Teacher Save endpoint; F omits revision insertion/advance. Each baseline0 → mutant1 → byte-exact restored0. The failure must be an assertion/expected callback timeout, not syntax/module breakage. **All six KILLED again with the final fixture**, exit0 for the runner. Logs: `mutation-run.log`, `mutations.json`, per-control baseline/mutant/restored logs.

## Rebuilt production3012 — live proof

Only the verified repo-owned Next process was restarted after local gates. Admin used the ambient authenticated UI; no Admin credentials/cookies were extracted. Owner expressly allowed Playwright in a separate owned-fixture context, with session/password only in RAM. SMTP provisioning used the accepted Slice4 flow, fresh owned invite/session verification and activation API; no existing identity was adopted.

| Flow | Observed result |
|---|---|
| Read-only | Canonical Course→Unit→Lesson and assignment modal render correctly; options truthfully empty before owned Teacher creation. No canonical writes. |
| A/B | UI creates labeled inactive owned Course, Unit and PLANNED Lesson; assigns the newly ACTIVE owned Teacher. Server persistence and ownership checked. |
| C/F | Real Teacher holding→assigned list→editor; saves/reloads revisions1 and2, then3 after retry. Prior row bytes unchanged, predecessor links and episode attribution valid, publication pointer null; zero unexpected page exceptions. |
| D | No second safe live Teacher identity was created. Actual production-handler integration with TeacherB proves empty assigned list and404 detail/write without effects; explicit allowed substitute for live negative evidence. |
| E Teacher | Two tabs: older token rejected; typed input retained, no success/no extra revision. Explicit latest-content reload reconciles body/token; retry creates revision3. |
| E Admin | Cached pre-save token rejects metadata edit; checkbox retained. Close→Refresh fetches revision3/new token→reopen/retry changes isRequired to false without losing revisions. |
| Lifecycle | Same owned session: ACTIVE200→DISABLED403 ACCOUNT_INACTIVE and denied draft page→enabled200 and restored draft page. Assignment remains unchanged. Final fixture Teacher returned to DISABLED. |

Proof files: `live-teacher-proof.json`, `live-lifecycle-proof.json`, `live-retained-inventory.json`; screenshots `live-readonly-options.png`, `live-A-lesson.png`, `live-B-assigned.png`, `live-teacher-revision2.png`, `live-teacher-stale-retained.png`, `live-teacher-retry-revision3.png`, `live-admin-stale-retained.png`, `live-admin-retry.png`, `live-final-owned.png`.

## Cleanup / authorized retention

Owner explicitly superseded residue0 with one clearly marked reusable DEV set. AssignmentHistory no_update/no_delete and RESTRICT guards stayed intact. Owned Teacher session signed out, dedicated browser closed, temporary Admin tab closed; no password/session/token files. Production server3012 remains running. Course is inactive; Teacher DISABLED; assignment/revisions retained. No separately disposable extra product records were created. Do not claim zero residue.

Tag: `S5-DEV-20261030143359`. Retained inventory:

| Record | Count | IDs |
|---|---:|---|
| Course | 1 | `4a7024f1-d24a-42d8-9d3a-3591b67229ca` |
| Unit | 1 | `4b7b89f5-37a3-4720-b7f2-77f0744d8210` |
| Lesson | 1 | `96635a98-975a-487e-b8de-b80c8fd794d3` |
| ContentAssignment | 1 | `40cca48d-3f5a-43c7-b3df-fa8fd6b7535b` |
| AssignmentHistory | 1 | `32008c0d-b858-4752-82f1-0611f7f02e76` |
| LessonRevision | 3 | `75bf5e4b-4bb3-4c60-9b20-edefe0d3f685`, `7bfc01f5-3a98-400e-b034-3e52720e6b59`, `aea940fd-832e-472c-9919-43ed7d3e3089` |
| Teacher Account / Auth identity | 1 each | `7d14d388-bb1e-4c57-877a-4f07ec2468d0` |
| ProvisioningRequest | 1 | `93079244-a132-4830-8db8-303f24f16124` |

Revision1→2→3 are all DRAFT, created/edited by the owned Teacher and linked to the same assignment episode. Retained immutable lifecycle audits: 5. Final Account rowVersion=5, Lesson rowVersion=6, isRequired=false. Immutable audits remain per accepted policy. Canonical Course/Unit/Lesson and accounts were never mutated by this task. Private mailbox/correlation metadata remains outside Git.

## Final Git review

Only Slice5 source/tests/scripts/spec/delivery/review/verification/current-task/roadmap are eligible. Preserve unrelated AGENTS.md, product README and both DB plans outside commit. No env, credentials, raw logs/screenshots/browser artifacts, schema/migrations/generated client or dependency changes. Final code review PASS. Scoped commit/push follows the staged secret/allowlist checks; actual Git outcome is reported by Codex delivery. No Slice6 work.
