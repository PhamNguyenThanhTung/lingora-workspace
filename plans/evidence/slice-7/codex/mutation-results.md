# Slice 7 mutation results

Run: 2026-10-31, local baseline gates green. Every mutant was applied independently, its focused Node feature/component test command ran in a separate process, then the original file bytes were restored in `finally` and verified by SHA-256.

| ID | Mutant | Killer assertion | Result | Restored file SHA-256 |
|---|---|---|---|---|
| A | Remove current-assignee check from Teacher submit | Unassigned Teacher submit rejection | KILLED | `workflow.ts`: `6869cf3007b55c1010031c917fdd2a7d2952f21565beb3d0c5e8ef42b67660fb` |
| B | Resolve review detail using latest Lesson revision | Pinned submitted revision remains the displayed snapshot after a successor exists | KILLED | `workflow.ts`: `6869cf3007b55c1010031c917fdd2a7d2952f21565beb3d0c5e8ef42b67660fb` |
| C | Remove `IN_REVIEW` approval transition guard | Current-version approval of a `CHANGES_REQUESTED` revision is rejected | KILLED | `workflow.ts`: `6869cf3007b55c1010031c917fdd2a7d2952f21565beb3d0c5e8ef42b67660fb` |
| D | Remove `APPROVED` publish transition guard | Publish of a current-version unapproved submission is rejected | KILLED | `workflow.ts`: `6869cf3007b55c1010031c917fdd2a7d2952f21565beb3d0c5e8ef42b67660fb` |
| E | Remove expected revision-version predicate from approval | Stale approval is rejected without changing revision/history | KILLED | `workflow.ts`: `6869cf3007b55c1010031c917fdd2a7d2952f21565beb3d0c5e8ef42b67660fb` |
| F | Change Teacher submit callback to a wrong URL | Production Teacher callback must call the exact submit route | KILLED | `LessonDraftEditor.tsx`: `c3761d01aff9ec6f9ef0a25877b29a4fd9f06aebd422b305b56a1f8ed1c888ba` |
| G | Change Admin approve callback to a wrong URL | Production Admin review callback must call the exact approve route | KILLED | `ReviewDetailView.tsx`: `7e2654759b178bb39f2a3642bf668f229f439c9190de39c9b2b1e62de8ab5956` |
| H | Set `activeRevisionId` to a newly created draft | Save-after-publish leaves the active pointer on the published revision | KILLED | `lessons/index.ts`: `d6f0133239c9d1872652c4f3abf3ea016cf85e4378d856e1e2d53d93a524fb3b` |

Focused commands:

```text
node --experimental-strip-types --experimental-test-module-mocks tests/feature/slice7-workflow.test.mjs
node tests/feature/isolated-components-slice7.test.mjs
```

All eight mutant runs exited nonzero because the named acceptance test failed. Each restore hash matched its pre-mutation bytes.
