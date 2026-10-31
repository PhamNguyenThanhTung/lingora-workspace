# Slice 7 verification — local PASS, public pending

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

Pending the Slice 7 `main` deployment. This section will be completed with the deployment commit/status, public Teacher/Admin flow, failure/retry case, read-only SQL evidence, fixture baseline restoration, and unexpected-residue result before `SLICE 7 ACCEPTED` is reported.

Anti's requested local evidence directory was not present at handoff. This verification records Codex's independent local gates and mutation run; it does not claim Anti supplied those evidence files.
