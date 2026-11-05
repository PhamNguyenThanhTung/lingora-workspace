# Slice 12 — offline PKCE helper verification

**PASS for the bounded helper repair; Slice 12 remains NOT ACCEPTED.** Scope and ownership: [plan](2026-11-05-slice-12-pkce-handoff.md). Anti Gemini3.8FlashHigh/effortHigh resumed the same interrupted initial conversation and delivered165 synthetic checks. No new correction worker or live attempt. Codex reviewed actual source/diff/tests and completed the fixes below.

## Source behavior and review

- Separate exclusive180-second local handoff policy, measured from durable `registrationAttemptedAt`; a later success/message timestamp or clock skew cannot extend it. Missing, malformed, future start or nonfinite clock denies. Existing email OTP checks remain separate. This is an operational window, **not verified provider TTL or proof that a provider flow is valid**.
- Actual `checkConfirmGuard` enforces the policy before DB work. The actual runner checks again after asynchronous DB work before its navigation hook, then after browser/context/page setup immediately before `page.goto(rawUrl)`. Denials cause zero navigation; persisted spent markers are retained and restart cannot retry/reset them.
- Codex reproduced a remaining new-boundary defect: JS Date normalizes invalid calendar days, allowing a malformed timestamp. Added H20 (four malformed/noncanonical cases), observed its FAIL, then required the exact ISO string emitted by the durable marker producer, including a calendar roundtrip. H20 now passes.
- Removed an unused window import and unneeded page/context/launcher override seams. The one synthetic browser dependency seam is sufficient; CLI still calls `runAuth(mode)` with production defaults and no options-based bypass from arguments/environment.
- Added actual-runner positive navigation evidence: a fake browser records the exact original URL including unknown parameters and original percent encoding, complete signup storage state, browser close and durable marker. A controlled stop occurs immediately after the observed goto effect; this is not a successful provider/callback claim. A second invocation is refused before another navigation. Sanitized evidence excludes all synthetic private input values.
- Reviewed original URL handling, storage-cookie binding, recipient/identity checks, one-shot state, safe error/navigation output and full retained snapshot/cleanup tests. Production auth, provider config, parser, product flows and schema were not changed. Existing Admin audit viewer/owner edits preserved.

## Actual root checks

All commands use the synthetic fallback environment in `tmp/slice12-pkce-handoff-worker/safe-run.py`. Actual guard/runner tests inject DB/browser effects and use temporary synthetic files. No live modes, .env inspection, original Downloads email, private operator artifacts, real provider/DB/email requests, signup, activation, commit, push or deployment.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Independent pre-fix full offline suite |165 PASS /0 FAIL, exit0 | `tmp/slice12-pkce-handoff-worker/root-initial-offline.log` |
| H20 reproduction on Anti source |H20 FAIL; existing19 Group H cases PASS, exit1 | `tmp/slice12-pkce-handoff-worker/root-calendar-red.log` |
| `python3 tmp/slice12-public-acceptance/test-offline.py` after fix |**166 PASS /0 FAIL**, exit0 | `tmp/slice12-pkce-handoff-worker/root-final-offline.log` |
| `node tmp/slice12-public-acceptance/test-pkce-navigation.mjs` |**2 PASS**, exit0; actual goto URL/state and restart/privacy | `tmp/slice12-pkce-handoff-worker/root-navigation.log` |
| Learner Node tests `auth-registration.test.mjs` + `confirmation-transport.test.mjs`, existing server-only harness and module-mock flags |**41 PASS /0 FAIL /0 skipped**, exit0 | `tmp/slice12-pkce-handoff-worker/root-registration-confirmation.log` |
| Node syntax for both modified JS helpers and new navigation test; Python py_compile; `git diff --check` |PASS, exit0 | root execution |

The new navigation fixture initially lacked the error-path `page.url()` stub; corrected the fixture and required the exact controlled stop error before its successful final run. This was a fixture failure, not a production callback defect.

Five source negative controls **failed for their intended assertions** (exit1 each): widen the deadline →H3 fails; bypass after-DB hook check →H15 fails; bypass post-browser goto check →H16 fails; remove calendar roundtrip →H20 fails; replace original URL with its origin →exact-URL assertion fails. Each source file was restored byte-for-byte in finally. Results and raw logs: `tmp/slice12-pkce-handoff-worker/negative-controls.json` and `negative-*.log`. No mutation remains. These tests establish effect boundaries; unrelated exceptions are insufficient for a negative control PASS.

Worker delivery is separately attributed at `plans/evidence/slice-12-pkce-handoff/anti-delivery.md`. Its165 PASS label did not establish acceptance; Codex found/fixed the calendar issue and added the stronger navigation test. Old useful146 checks remain, with timing fixtures adjusted to be genuinely fresh under the new policy.

## Limits and next step

No product source changed, so whole-product build/typecheck, broad UI/DB suites and public acceptance were not rerun for this helper-only patch. The actual provider flow TTL/override and current deployment/provider state were not read in this package. Historical callback422 and cleanup evidence remain unchanged; both real-attempt budgets stay spent. Uncommitted helper changes and new synthetic navigation test are preserved for a separate source checkpoint.

The remaining Slice 12 work is a newly authorized public attempt with inbox/handoff ready before signup, fresh provenance/baselines and independent cleanup reconciliation. A [concrete proposed next-attempt contract](2026-11-05-slice-12-next-public-attempt.md) is prepared; it is **not authorization**. No fresh signup or activation follows automatically from these offline PASS results.
