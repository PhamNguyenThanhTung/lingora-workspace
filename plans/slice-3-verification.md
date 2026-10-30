# Slice 3 — FAIL / STOP (not ACCEPTED)

Historical result before the independently authorized [Final Acceptance Patch](slice-3-final-patch-verification.md). The patch is now PASS / SLICE3 ACCEPTED; statements below describe the earlier stopped task only.

Codex directly planned/reviewed; Anti gemini-3.8-flash-high/high implemented and delivered one correction. Budget1/1 exhausted. Baseline main/ea35b48 remains unchanged; implementation is uncommitted for inspection. Exact blockers and source locations are in [review](slice-3-review.md); contract in [spec](2026-10-30-slice-3-courses-units.md). No further correction or Codex implementation takeover performed.

Actual domain: Course UUID PK, required target language/Framework/default-start-Level, names JSON, isActive, internal counters/config; no natural name/code key, no instruction-language property. Instruction-language gap is nonblocking for current schema catalogue CRUD; UI language is not a substitute. Default start Level and each Unit Level must belong to Course Framework. Unit UUID PK, parent Course, Level, nonblank code, names JSON, positive int32 position; uniqueness only(courseId,levelId,position), Lessons restrict delete. No migration/schema/seed changes.

Implemented scope: /courses and /courses/[courseId], nested Course/Unit API services/routes, explicit forms/catalogues/delete modals, Sidebar entry and small CSS action nowrap change, isolated tests/real-page compiler seam. No global Units or Slice4.

Independent final commands (cwd lingora-admin): npm run test:feature exit0 (195=33+41+81+40), npm run test:components exit0 (42=12+19+11), npm run typecheck exit0, npm run build exit0. Full scripts include targeted S3 feature40 and component11. git diff --check exit0. Raw logs only /home/tung/.codex/task-logs/slice-3-courses-units/codex-final/.

Independent mutation runner: A href, A exact parent prop, B atomic update selector, B relaxed ownership, C POST ADMIN->ANY, D Course Framework guard, D Unit Framework guard, supplemental existing-draft cleanup all KILLED (exit1). Byte-exact source restored in finally; restored relevant feature/component exit0. E new persisted draft keys N/A (none added). First review had2 SURVIVORS, both corrected; green mutation controls do not resolve the final UI failures.

Remaining real defects: Unit Level retry resets unsaved code/name/position; Course lookup403 leaves modal covering denial/logout. Required actual-page callback URL/payload/reconciliation and faithful option-error coverage remain incomplete. Independent diagnostic logs show UNIT_LEVEL_RETRY before=RETAIN-ME, after="", nameAfter="", positionAfter="1" and LOOKUP_403 modalStillOpen=true, logoutClickBlocked=true, appInert="". Diagnostic imports actual production components; it uses isolated HTTP doubles, not live DB evidence.

Local acceptance failed, so live production read-only gate and A–E were NOT RUN. No owned fixtures were created, hence no fixture cleanup needed; no claim of live residue query/proof. Canonical data was not mutated. No Slice3 commit/push; unrelated dirty product README and two pre-existing untracked DB plans preserved. No Slice4 started.
