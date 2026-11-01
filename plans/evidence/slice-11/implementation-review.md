What this change does: Adds persisted Practice attempts, deterministic grading, completion and vocabulary enrollment, plus learner UI and a narrow successor-copy fix.

**Review verdict: FAIL — changes required.** Reviewed the actual working diff and new files against baseline `b86ddc652310c37373c4ce921e38e39cba4c3562`, the final spec and attached task.

1. **P1 — UI retries lose command identity.**
   [PracticeSection.tsx:135](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx:135), also lines 63 and 192.
   Every click generates another UUID. If the server commits but its response is lost, retrying a response can fail against the advanced queue—or silently consume the required retry when the next exercise is the same. Retrying finalization gets `ATTEMPT_ALREADY_FINALIZED`; retrying start creates another attempt.
   **Fix/test:** Retain the pending command’s key and immutable payload until its outcome is resolved. Reconcile authoritative attempt state after ambiguous failures. Browser-test lost responses **after commit** for start, response and finalize; require one persisted operation.

2. **P1 — An unfinished stale attempt has no recovery path to the current publication.**
   [PracticeSection.tsx:26](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx:26), [PracticeSection.tsx:289](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx:289).
   After X→Y, the page reloads retained attempt X. The component ignores `attempt.isStale`, initializes its own stale flag to false, and offers submission against X. Following the resulting 409, “Tải lại trang” loads X again. An unfinished attempt exposes neither Start nor Redo, so the learner remains stuck.
   **Fix/test:** Render retained X as explicitly stale and provide a start-current-Y action. Verify actual-page recovery, preserving X history and creating a separately pinned Y attempt.

3. **P2 — Reload hides an unfinished redo behind any completed attempt.**
   [practice-service.ts:805](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/practice-service.ts:805).
   Complete A, start redo B, submit part of B, then reload. `completedAt DESC NULLS LAST` selects A, making B inaccessible through the page. The completed-score ordering also inserts `startedAt` before the approved `id DESC` tie-breaker.
   **Fix/test:** Distinguish the resumable attempt from primary completed performance; order completed performance exactly by completion time and ID. Test both together on PostgreSQL. The mock sorter at [learner-fixture.mjs:312](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/harness/learner-fixture.mjs:312) treats `{sort, nulls}` as a nested relation and ignores this scalar ordering; correct its fidelity too.

4. **P2 — Attempt-loading failures become a false “not started” state.**
   [page.tsx:30](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/app/learn/[contextId]/[lessonId]/page.tsx:30).
   Any attempt-query or DTO failure is swallowed into `latestAttempt = null`. A transient failure therefore hides persisted progress/results and presents Start as though no attempt existed.
   **Fix/test:** Propagate the failure or expose a retryable Practice-loading error. Inject failure specifically into attempt loading while lesson-detail loading succeeds; assert that the page does not show an unstarted state.

5. **P2 — Finalized-state checks override approved D3 stale errors.**
   [practice-service.ts:459](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/practice-service.ts:459), [practice-service.ts:623](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/practice-service.ts:623).
   Complete X, publish Y, then send a new response operation or a different finalize operation. These branches return `ATTEMPT_ALREADY_FINALIZED` before checking publication. D3 requires new stale operations to return `PUBLICATION_CHANGED`; exact committed replay remains the exception. The PostgreSQL test currently codifies the conflicting response expectation at [practice-concurrency.test.mjs:335](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice-concurrency.test.mjs:335).
   **Fix/test:** After authorized exact replay handling, apply the publication check before finalized-state rejection. Cover completed X, unfinished X and unfinished redo X after Y.

6. **P2 — Completion timestamp and qualifying date use different clock samples.**
   [practice-service.ts:681](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/practice-service.ts:681).
   The two `clock_timestamp()` calls can straddle midnight in the account timezone, assigning a qualifying day inconsistent with the persisted completion timestamp.
   **Fix/test:** Sample the database clock once after locks and derive both fields from that value. Add a timezone midnight-boundary test.

7. **P2 — Immutability UPDATE tests can pass without the intended guards.**
   [practice-concurrency.test.mjs:166](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice-concurrency.test.mjs:166), [practice-concurrency.test.mjs:189](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice-concurrency.test.mjs:189).
   Setting attempt units to 999 and response units to 10 independently violates existing CHECK constraints. Those produce the same asserted SQLSTATE `23514`, so rejection does not establish that immutable UPDATE guards worked.
   **Fix/test:** Attempt otherwise-valid fact changes, such as changing a response’s input or a completed attempt’s start timestamp. Assert the specific guard failure. Root’s mutation pass should confirm guard removal makes these tests fail.

Two remaining **P2 test-contract gaps** need concrete cases:

- **Race controls:** [practice-concurrency.test.mjs:339](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice-concurrency.test.mjs:339) is the only concurrent test. The runner genuinely deploys migrations and calls production services, but duplicate finalization alone cannot establish shared-parent lock scope/order, independent learners, publisher-first/finalizer-first behavior, competing responses/start retries or rollback after linked writes. Add controlled barriers and a late failure with reconciliation of attempt, completion, cards and receipt.
- **Boundary controls:** The “cross-learner” GET case at [practice.test.mjs:374](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice.test.mjs:374) uses a nonexistent UUID. Seed a real B-owned attempt and attack response/finalize as A; add competing child revisions, ASSESSMENT/foreign membership and private-key rejection cases. The successor regression ends after saving Y at [slice11-successor-copy.test.mjs:187](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/tests/feature/slice11-successor-copy.test.mjs:187); extend through submit/approve/publish Y and verify retained X attempt/child pins.

No edits, tests, browser, DB, provider or environment access were performed. Missing final acceptance evidence was not treated as an implementation defect. Exact model/effort routing could not be independently attested within this session.
