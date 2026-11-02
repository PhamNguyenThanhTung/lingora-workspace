# Slice 12 repair — independent final review

What this change does: Repairs DEFAULT selection so its Level ordering and exact published Lesson state remain protected until context creation commits. It also fixes portable guard subprocesses and supplies real Pause-versus-learning and exact SRS preservation evidence.

**Verdict: PASS for the local Slice 12 feature + repair candidate. No material correctness, authorization, data-integrity or acceptance-evidence blocker found.** This is approval to proceed through the separately gated source/release acceptance steps; it does not mark Slice 12 ACCEPTED or claim a deployment/email result.

Reviewed the complete uncommitted Slice 12 candidate against the original onboarding specification, new owner repair request, executable repair specification, senior plan and historical failed review. Inspected actual production services/routes/UI, supported curriculum writer paths, PostgreSQL tests, browser tests, current gate logs and fresh negative-control failures. Worker PASS labels were not accepted as proof. Applied code-review-and-quality and ponytail-review criteria. Expected load: concurrent learners and curriculum editors, including different learners selecting the same Course.

## Prior blockers and transaction review

- **DEFAULT Level ordering:** Account NO KEY UPDATE → Course SHARE → Language SHARE → referenced Levels → Units → all extant Lessons → exact active Revisions. Entity sets are locked in ascending immutable UUID order. Selection uses a later fresh read restricted to held Units/Lessons, verifies Level/framework and held Revision membership, and sorts fresh Level positions. No pre-lock position snapshot is reused. Writer-first reorder chooses the newly correct Level; learner-first holds off reorder until commit.
- **Lesson status/publication:** All existing Lessons are included, including PLANNED and null-active-revision rows. Their availability and active pointer cannot change after acquisition; exact Revision locks and the existing revision-parent/status predicate protect the final eligible set. Fresh writer-first withdrawal chooses the actual higher eligible Level. Learner-first withdrawal/activation and real publishReview wait behind the held set. A subsequent DEFAULT locks the replacement Revision. Honest null DEFAULT and SELF_REPORT/replay semantics remain intact.
- **New-row admission:** Actual createLesson now locks the selected Course FOR NO KEY UPDATE after fresh Admin verification and before Unit validation/insert. Existing Unit CRUD already takes Course FOR UPDATE; source search confirms no other supported Lesson insertion path. Thus Course SHARE fences new relevant Units/Lessons without an exclusive learner lock. Tests invoke real createLesson in both winner orders, including selection after full set capture and inclusion of a writer-first PLANNED child. The guarantee relies on these supported application writer protocols; fixture SQL is not treated as a production path.
- **Lock interactions:** Reviewed createLesson, Unit CRUD, Level/Language updates, publication, context lifecycle, Reading and Practice ordering. Relevant writers either conflict at the Course before child edits or at the protected entity. No new cyclic lock dependency identified. Different learners complete selection on the same Course while one selector remains held. Transaction timeout is bounded; there is no retry loop or SKIP LOCKED fallback.
- **Pause:** All five operations (Reading start/complete; Practice start/response/finalize) run actual overlapping production transactions on separate connections. A third connection observes pg_blocking_pids before releasing the winner. Pause-first waiters reject CONTEXT_INACTIVE; learning-first writes commit before Pause and remain present afterwards. Paused new requests and committed replays are denied. This replaces the historical sequential evidence gap.
- **SRS:** A real finalized Practice enrolls a card, then owned fixtures establish stage 3, nondefault due/review times, rowVersion 3 and nonempty valid review history. Ordered PostgreSQL to_jsonb(row)::text snapshots compare every card/history column and consumption/attempt/response/completion/receipt rows before Pause, while blocked, and after Resume. Microsecond timestamps, provenance, IDs, counts and technical fields are retained exactly.
- **Subprocesses:** process.execPath, module-relative file URL/path resolution and deliberate unrelated cwd execution replace the inherited-cwd assumption. Each negative checks its intended missing-URL/loopback/ownership diagnostic before connection; DATABASE_URL fallback remains forbidden.
- **Whole-candidate boundaries:** Registration emits fixed safe duplicate/success responses and sanitized provider errors. Bootstrap obtains fresh confirmed getUser, rejects private staff markers/reservations, inserts fixed LEARNER/ACTIVE and audit atomically, converges under real concurrent calls, and preserves existing accounts. Context routes retain origin/JSON/identity checks and server-owned validation. Browser regressions exercise actual product create/lifecycle callbacks, lost-response exact-payload retry and first Practice start. No schema, migration or production SRS/Practice implementation change is part of this repair.

## Final evidence inspected

Fresh root-run logs under ignored `tmp/slice12-repair/final-*.log`, with process exit markers:

| Gate | Result |
| --- | --- |
| Root feature | 603/603, exit 0 (Admin 413 + Learner 190) |
| Components/pages | 168/168, exit 0 |
| Onboarding PostgreSQL | 34/34 (bootstrap 12 + context 22) |
| Accepted Reading / Practice PostgreSQL | 7/7 + 13/13; aggregate PostgreSQL 54/54, exit 0 |
| Three subprocess guards from repo/workspace/unrelated cwd | 3/3 in each cwd |
| Both workspace typechecks and builds | Exit 0 |
| Built learner client scan | 42 files, zero secret/private-import/answer-contract matches |
| Final diff whitespace check | Exit 0, independently rerun after controls |

Inspected `tmp/slice12-repair/controls.json`, the temporary control script, and fresh persistent `control-{A..F}-{baseline,mutant,restored}.log` files. Every baseline/restored target passes; every mutant exits 1 for the intended assertion, rather than an unrelated timeout/type failure:

| Control | Observed kill |
| --- | --- |
| A: reuse Level snapshot from before locks | Wrong selected Level ID after held reorder |
| B: reuse publication snapshot from before Lesson lock | Withdrawn lower Level selected |
| C: remove PAUSED guard | Waiting Reading start fulfills after Pause |
| D: reset/reschedule card on Pause | Exact nonempty SRS snapshot differs |
| E: restore cwd-dependent import | All three children miss their required guard diagnostics |
| F: remove createLesson Course guard | New-child writer commits before the required blocker |

Control runner verifies exact source byte restoration in finally and at completion; final-controls exits 0. Re-read restored production/guard anchors and independently reran git diff --check. Raw artifacts and fixture identifiers are intentionally excluded from this durable report.

No source fixes or delegation were performed by this reviewer. Only this review artifact was written; unrelated files were preserved. No real .env, credentials, provider, email, remote DB, deployment, or canonical-data access was used. Local disposable PostgreSQL evidence is separate from live reconciliation. Exact source push/deployment READY, public/email acceptance and final live residue reconciliation remain root-owned subsequent gates; no such result is asserted here. No Slice 13 work reviewed or authorized.
