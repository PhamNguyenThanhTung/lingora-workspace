# Codex independent refresh mutation proof

CWD: lingora-admin. Command for every row: `node --experimental-strip-types --experimental-test-module-mocks --test --test-name-pattern="proxy refreshes expired session" tests/feature/auth.test.mjs` (100s subprocess timeout).

| Local source state | Exit | Observable result |
|---|---:|---|
| Baseline real proxy |0|1/1 PASS|
| Remove awaited supabase.auth.getUser call |1|Refresh grant call count0, expected1|
| Omit request.cookies.set(name,value) |1|Request retained stale value|
| Omit response.cookies.set(name,value,options) |1|Missing response Set-Cookie|
| Replace refreshed value with original request value |1|Request retained stale value|
| Restore after EACH mutation |0|1/1 PASS each of4 restores|

Reviewer saved original proxy bytes in memory, restored in finally after each mutation and outer finally, compared equal afterward. Mutations were behavioral and parseable; none retained/staged. Real SDK/provider double integration, not live Supabase refresh. Full feature74/74 passed after all restores. Detailed raw logs and temporary reviewer script remain outside repository at /home/tung/.codex/task-logs/slice-1-final-acceptance-patch/.
