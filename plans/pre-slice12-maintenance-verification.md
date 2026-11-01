# Pre-Slice 12 maintenance verification

Status: implementation reviewed; focused root checks PASS. Final shared integration remains part of Slice12 gates. No advisory remediation, schema/migration change, provider write or deployment.

The supplied Practice recovery regression clicks the actual recovery button after403 and proves a saved attempt accepts a response again. Root independently reran that case:1/1 PASS (`/tmp/lingora-pre12-root-recovery.log`).

Root rejected the first runner's automatic auth-user trigger and removal of six production guards. The final runner applies all six migrations unchanged. Consumption fixtures now reuse the existing real staff publication fixture and publish successor Y through save/submit/approve/publish services. No guard weakening or synthetic Account->Auth creation remains.

Exact root commands from repository root:

- `npm run test:integration:lessons`:7/7 PASS, all migration guards retained (`/tmp/lingora-pre12-root-consumption-db.log`).
- `npm run test:integration:practice`:13/13 PASS (`/tmp/lingora-pre12-root-practice-db.log`).
- `node scripts/local-test-db.mjs node -e 'process.kill(process.pid,"SIGTERM")'`: expected nonzero exit1, verified (`/tmp/lingora-pre12-runner-signal.log`). A terminated child no longer produces false success.
- Focused browser command from `lingora-web/`: `node --experimental-test-module-mocks --import ./tests/feature/harness/server-only.mjs --test-name-pattern='real session loss and disabled errors' tests/feature/practice-components.test.mjs`:1/1 PASS.

Root selects an OS-assigned port for each owned disposable cluster, avoiding the shared preferred-port contention. The pinned dev dependency and runner are tracked; original ignored runners are not required. README and DESIGN changes replace stale current-scope claims and link the roadmap; historical documents are preserved.

Anti handoff is historical implementation evidence, not final acceptance; see `plans/evidence/pre-slice12-maintenance/anti.md`. No user changes to AGENTS.md, prisma/product/README.md or the two old database plans are included in this maintenance change.
