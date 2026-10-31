# Slice 7 verification — PASS / ACCEPTED

Date: 2026-10-31. Implementation contract: [Slice 7 spec](2026-10-31-slice-7-submit-review-publish.md).

## Verified domain contract

- `LessonRevision.status` uses `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, and `WITHDRAWN`.
- `RevisionReview` is the append-only submission/action identity, linked to one exact `lessonRevisionId`; it records action, actor, assignment episode/generation/snapshot, post-transition row version, and optional comment.
- Only ACTIVE `ADMIN` accounts review and publish. No new role or table was added.
- `Lesson.activeRevisionId` is the publication pointer; Lesson availability remains unchanged by publish.
- `DRAFT → IN_REVIEW → CHANGES_REQUESTED → successor DRAFT`, or `IN_REVIEW → APPROVED → PUBLISHED`. Submitted revisions stay unchanged. A successor after publication leaves the active pointer and published content unchanged. A later publish archives the previous active revision after moving the pointer.
- Publish takes the Lesson lock before the pinned review and revision locks, matching authoring's Lesson-first lock order and avoiding the revision/FK lock cycle found in review.

## Implementation and independent review

Teacher submit is available on `/my-lessons/[lessonId]` and pins the saved highest revision, current assignment episode, and expected Lesson/revision versions. It never auto-saves editor state. Admin `/review` and `/review/[submissionId]` read the pinned revision snapshot; request changes, approve, and publish use explicit authenticated routes and append actor-attributed review events.

Independent review found and Codex fixed: persisted exercises/vocabulary falsely marked the Teacher draft dirty; some exercise types lacked required read-only review fields; and publish lock order could deadlock with successor authoring. The Teacher Save button also unmounted during a pending request; it now stays mounted and disabled. Tests cover all five exercise types and a current-version invalid approval so the transition guard is actually exercised.

No Prisma schema or migration changes.

## Local acceptance

Commands run from `lingora-admin`; all passed:

| Gate | Result |
|---|---|
| `npm run test:feature` | PASS, 391 tests |
| `npm run test:components` | PASS, 113 tests |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

The Next build reported two existing generated-Prisma dynamic-filesystem tracing warnings; compilation, type checking, static generation, and route build completed with exit 0.

Mutation controls A–H were applied individually. Each mutant made its intended feature or production-page component assertion fail, then its source file was restored byte-for-byte (SHA-256 checked). Details are in [mutation evidence](evidence/slice-7/codex/mutation-results.md).

## Public DEV acceptance

Deployment `dpl_HYwmjTVpdkjYPzjHmSKkFu8Am2pz` was `READY` on production for exact commit `04c14951523137eb1b931817d335545219d8991a` before public writes. The production alias was `https://lingora-workspace.vercel.app/`.

Public DEV flow passed on that deployment:

1. Enabled the allowlisted Teacher through the Admin UI.
2. Teacher submitted revision #8 (`84c7162e-f2b1-4477-b94a-447eccdc4fff`); Admin opened its pinned submission, verified the submitted content, and requested changes.
3. Teacher created and submitted revision #9 (`a0dac479-6eae-44e0-ad3e-80c3ac8833e7`, submission `d70dfb4e-49ed-4377-b245-511fccc48fba`). Admin reviewed that exact snapshot and approved it.
4. A second stale Admin view attempted approval after the first approval. The API returned HTTP 409, the conflict state appeared, and reload reconciled to `Đã duyệt`. Admin then published the approved revision.
5. Teacher created revision #10 (`fb9acf29-fdf2-488d-a7c1-71689eaadbe2`). Reload showed it as a draft while Admin reload still showed revision #9 as published.

Read-only SQL evidence confirms revision #8 is `CHANGES_REQUESTED`, #9 is `PUBLISHED`, #10 is `DRAFT`, and `Lesson.activeRevisionId` points to #9. Revision #9 has the Teacher submit actor and the same ACTIVE Admin as approver and publisher. Its append-only review history is `SUBMIT → APPROVE → PUBLISH`; revision #8 has `SUBMIT → REQUEST_CHANGES`. The resulting five review events match the public actions. Course is inactive, Teacher is restored to `DISABLED`, assignment owner/episode remain unchanged, and original revisions #1–7 plus their exercise and vocabulary snapshots match the baseline exactly. The only added fixture records are the three allowlisted workflow revisions, their expected child snapshots, and five review events; the publication pointer intentionally retains the accepted publication result. Unexpected residue: **0**.

The browser and in-memory auth contexts were closed. No token, password, or browser storage state was saved. Read-only SQL, UI proof, and the complete result summary are recorded in [public DEV acceptance evidence](evidence/slice-7/public-dev-acceptance.md). No source changed after the tested commit, so local acceptance was not rerun.

**SLICE 7: PASS — SLICE 7 ACCEPTED**

Anti's requested local evidence directory was not present at handoff. This verification records Codex's independent local gates and mutation run; it does not claim Anti supplied those evidence files.
