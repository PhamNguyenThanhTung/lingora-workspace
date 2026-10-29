# Codex pre-dispatch diagnosis

401: test bug reproduced with zero POST events; modal autofocus (50ms) moves focus during immediate Playwright fill. Observed code contains both code+Vietnamese name, vi empty, client validation blocks submit. Baseline targeted1/1 PASS and suite12/12 PASS demonstrate intermittent behavior; historical11/12 FAIL remains valid. Fix test synchronization, then assert actual401 response and correct payload, not expectation relaxation.
403: implementation regression and matching test gap; onForbidden callback unused despite existing catalogue permission-denial/logout contract.
Refresh: test gap, valid/unexpired cookie, unused tokenRefreshed flag, cookie-name-only assertion, copied algorithm outside production path. Require real SDK expired-session proxy integration and three independent mutation kills.

Commands (repo unless noted): agy models exit0 requested model present; targeted401 node --test --test-name-pattern exit0; npm run test:components -w lingora-admin exit0,12/12. Initial root npm run test:components exit1 because script is workspace-only; corrected command above. Diagnostic inline Playwright loop stopped at iteration1 and captured invalid mixed fields. No production source edits or DEV mutations. Raw output external /home/tung/.codex/task-logs/slice-1-final-acceptance-patch/.
