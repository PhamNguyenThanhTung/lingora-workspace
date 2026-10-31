# Slice 7 — Submit / Review / Publish

## Verified source of truth

- `LessonRevision.status` is checked against `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, and `WITHDRAWN`.
- Submit facts live on that exact revision: `submittedBy/At`, `submittedAssignmentGeneration`, and `assignmentScopeSnapshot`. The closure trigger requires these for reviewable states, checks the assignment episode/snapshot and at least one core exercise, and freezes the submitted authored payload/provenance.
- `RevisionReview` is the append-only history table. It has exact `lessonRevisionId`, action (`SUBMIT`, `REQUEST_CHANGES`, `APPROVE`, `PUBLISH`, `ARCHIVE`, etc.), actual actor, assignment episode/generation/snapshot, `revisionRowVersion`, and nullable `comment`. It is the submission identity; there is no separate submission table.
- `Lesson.activeRevisionId` is the same-Lesson FK publication pointer. `availability` is a separate field. Item revisions have `frozenAt` protection and grading secrets freeze when the owning Lesson revision is submitted.
- Assignment history is append-only. Review records must retain the submitting revision's episode even after reassignment. Only an ACTIVE `ADMIN` reviews/publishes; no role is added.
- Existing authoring locks Account → Lesson → Assignment, then uses revision identity/version checks. Preserve that order and the existing authorization, origin, error, and payload-size conventions.

## State contract

| Current | Action | Next | Rule |
|---|---|---|---|
| `DRAFT` | Teacher submit | `IN_REVIEW` | Submit the exact persisted highest revision; never auto-save editor state. |
| `IN_REVIEW` | Admin request changes | `CHANGES_REQUESTED` | Preserve the revision; append an event with optional comment. |
| `IN_REVIEW` | Admin approve | `APPROVED` | Preserve the revision; append an event. |
| `CHANGES_REQUESTED` | Teacher save successor | new `DRAFT` | Revision N stays unchanged; create N+1 from its snapshots under the current assignment episode. |
| `APPROVED` | Admin publish | `PUBLISHED` | Exact approved revision only; atomically update `Lesson.activeRevisionId`. |
| `PUBLISHED` | Teacher save successor | new `DRAFT` | Permit a later revision while the published pointer/content remain unchanged. |
| `IN_REVIEW` / `APPROVED` | Teacher save | reject | Keep authoring locked until review resolves or approval is published. |

On a later publish, point the Lesson at the new revision before archiving the previous active `PUBLISHED` revision; append `ARCHIVE` history and retain its row/content. Do not change `Lesson.availability`: publishing content is distinct from learner availability, which is outside Slice 7 and the reusable DEV Course is inactive. No migration or schema change is expected.

Before submit, validate the persisted revision and all existing structural rules (including valid exercise/secret and vocabulary snapshots); require the schema's minimum of one core exercise. Do not add pedagogical count rules. Freeze the exact referenced `ItemRevision`s in the submit transaction. Successor draft validation must permit frozen predecessors as copy sources, then create fresh, unfrozen child revisions and snapshots. Never edit/delete submitted content or review history.

## Identity, concurrency, and API contract

- Submission ID is the `RevisionReview.id` for that revision's `SUBMIT` event. Queue/detail/mutations resolve that ID and its exact `lessonRevisionId`; never look up “latest” as the target after the request starts.
- Submit takes `{revisionId, expectedLessonRowVersion, expectedRevisionRowVersion}` only. Client cannot choose actor, status, reviewer, assignment, snapshot, or publication pointer. Server locks/rechecks ACTIVE Teacher, current assignment, latest assignment episode, highest revision, and both versions. Use server time and the actual episode snapshot.
- Review mutations take `{expectedRevisionRowVersion, comment?}`. Lock/recheck ACTIVE Admin and the pinned submission; only `IN_REVIEW` can transition. Append the actual Admin actor and the original submission episode. `revisionRowVersion` records the post-transition version.
- Publish takes the same pinned submission identity and expected revision/Lesson versions; only its `APPROVED` revision can publish. Use a transaction and conditional versions. A stale/duplicate/conflicting action returns deterministic 409 with no partial writes or false success.
- Request-change comment is optional because the schema field is nullable and has no required-reason constraint. Enforce body-size and safe text validation using existing conventions.
- All mutation routes enforce same-origin, JSON, exact role, active account, UUIDs, and safe error envelopes. Admin reads are ACTIVE ADMIN only. Teacher reads/writes remain current-assignee scoped; review attribution comes from the submit event, not current assignment.

## UI and production wiring

- Teacher `/my-lessons/[lessonId]`: display Vietnamese labels for all workflow states, persisted revision identity, latest optional change-request feedback, and only valid actions. Disable Submit while editor content is dirty and tell the Teacher to save first; Submit never silently saves. Offer “Chỉnh sửa lại” only for `CHANGES_REQUESTED` and “Tạo bản nháp mới” after `PUBLISHED`; save creates a successor and reconciles the server DTO. Preserve pending locks, errors, 401/403, stale reload, and retry behavior.
- Admin `/review` and `/review/[submissionId]`: queue active `IN_REVIEW` submit events; detail renders the pinned revision metadata, text, exercises, vocabulary snapshots, media HTTPS references, submitter, assignment episode and history read-only. Only valid Request changes / Approve / Publish actions render. Review DTOs are admin-only; no client mutation can alter content/assignment.
- Exercise snapshot content needed for review may include answer/feedback data, but only in the ACTIVE ADMIN response and never in logs or public/learner routes.
- Use the actual production page → component callback → API → service path in browser/component tests. No generic status PATCH or workflow engine.

## Owned implementation package: `S7-WORKFLOW`

Anti owns initial implementation and tests for the transactional workflow service/routes, teacher state/actions, admin queue/detail/navigation, and feature/component/browser suites. Keep the diff within current architecture; no dependencies, schema edits, migrations, live DB writes, deploy, commit, or push. Preserve pre-existing dirty `AGENTS.md`, product Prisma README, and the two untracked database plans. Save exact test commands/results under `plans/evidence/slice-7/anti/`.

Required tests/checks before handoff: submit authorization/state/identity/duplicate and structural validation; exact snapshot review after revision Y exists; request changes and optional feedback; approve and conflicting review race; publish only approved exact revision, republish/archive order, pointer isolation; current assignment/disabled Teacher behavior; immutable payload/children/history; actual production callbacks, pending/success/failure/stale/401/403; `npm run test:feature`, `npm run test:components`, `npm run typecheck`, `npm run build`. Do not run public live acceptance; Codex owns it after review and local acceptance.

## Final acceptance owned by Codex

Independently review schema/state/auth/actor/locking/pointer/history and production wiring. Fix findings directly; there is no mandatory Anti correction round. Run mutation controls A–H from the user request and prove byte-exact restoration, all local gates, public DEV deploy Ready for the exact commit, Teacher submit, Admin review/request-changes/approve/publish, revision isolation, one real conflict/retry, read-only DB evidence, and fixture restoration with unexpected residue zero. Commit only Slice 7 files plus current-task/roadmap/verification; preserve unrelated user changes; push `origin/main`. Do not begin Slice 8.
