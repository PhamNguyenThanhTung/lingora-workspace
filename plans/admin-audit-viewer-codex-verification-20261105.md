# Admin audit viewer — Codex repair verification

**PASS — bounded local acceptance, 2026-11-05.** After the completed Anti correction failed final review, the owner explicitly requested “lên plan rồi tự fix”. Codex planned, implemented and reviewed the remaining fixes directly. No additional worker, real signup, provider call, live database change, commit, push or deployment.

Contract: [original plan](2026-11-04-admin-audit-viewer.md). Direct repair: [plan](2026-11-04-admin-audit-viewer-codex-fix.md). The [historical FAIL](admin-audit-viewer-verification-20261104.md) and senior evidence remain historical; this newly authorized work supersedes their audit-viewer STOP only. Slice 12 remains **NOT ACCEPTED**; no numbered Slice 13.

## Findings closed

- **Mobile usability:** `lingora-admin/src/components/AuditEventsCatalog.tsx` uses audit-scoped small-screen selectors to stack the existing Sidebar above content. Removed overflow hiding, allowed action/pagination wrapping, retained table-only horizontal scroll. No shared AppShell/Sidebar/global CSS change in this repair. Real Chromium checks complete control bounds and clipping ancestors, readable datetime width, Reset interaction, focus, navigation/logout and document width at **320/375/768/1024/1440px**. Before-fix run failed the date width at320px; final run passes.
- **Timestamp semantics:** restored `<time dateTime={evt.occurredAt}>` with the exact UTC string. Browser verifies one matching semantic timestamp per row. That assertion failed before the source fix.
- **SDK/header fidelity:** replaced the ineffective provider-response-header test with an expired synthetic session using the installed SDK and actual route/auth/service. It must perform exactly one refresh and one fresh user lookup, invoke real `setAll`, write updated session cookies, and preserve SDK Expires/Pragma. The test explicitly injects a conflicting public cache header at the real adapter callback boundary and asserts final private no-store. Cookie assertions concern the Next cookie adapter writes, not an invented raw Set-Cookie header from a mocked response.
- **Acquisition fidelity:** invokes actual `getProductPrisma()` with no injected client and temporarily absent DATABASE_URL, restoring environment/singleton in finally. Asserts a generic500 envelope with no configuration detail.
- **Stale-body fidelity:** waits until the first body is held, completes a newer request, then releases the obsolete body and waits for rendering. Asserts complete visible table content and page number remain unchanged, replacing the never-rendered-ID assertion.
- **Failed Apply/Reset:** added persisted browser regression checks for page/rows/inputs/history preservation and one Retry of identical bounds/filters, followed by exactly one successful transition.

Repair changed only the audit component and its service/route/component tests, plus task/status documents. Existing audit implementation and unrelated owner changes were preserved. Auth, API, SQL service and database production behavior were not changed by this repair.

## Actual executions

All commands ran from repository root under `/tmp/lingora-admin-audit-safe-run.py`, with all provider/database/key fallbacks explicitly synthetic and loopback. No .env contents were read or copied. Existing disposable PostgreSQL runner used unchanged.

| Command/check | Result | Local raw evidence |
| --- | --- | --- |
| Targeted browser before source fix | 9 PASS / 2 FAIL, exit1: missing semantic timestamps and insufficient mobile date width | `/tmp/lingora-audit-codex-red-browser.log` |
| `npm run test:feature -w lingora-admin` | **460 PASS / 0 FAIL / 0 skipped**, exit0 | `/tmp/lingora-audit-codex-final-feature.log` |
| `npm run test:components -w lingora-admin` | **133 PASS / 0 FAIL / 0 skipped**, exit0; includes12 audit browser cases | `/tmp/lingora-audit-codex-final-components.log` |
| `npm run test:integration:audit -w lingora-admin` | **5 PASS / 0 FAIL / 0 skipped**, exit0; real108-row microsecond/UUID pagination proof | `/tmp/lingora-audit-codex-final-postgres.log` |
| `npm run build -w lingora-admin` | **PASS**, exit0; both audit routes compiled | `/tmp/lingora-audit-codex-final-build.log` |
| `npm run typecheck -w lingora-admin` after build | **PASS**, exit0 | `/tmp/lingora-audit-codex-final-typecheck.log` |
| `npm run test:smoke:audit -w lingora-admin` | **3 PASS / 0 FAIL / 0 skipped**, exit0; actual built Next + Chromium anonymous redirect/API401/no-store and harness404 | `/tmp/lingora-audit-codex-final-next-smoke.log` |
| Independent real-DOM/navigation probe | **PASS**, exit0; failed Next/Back/Apply/Reset + retry-once, control bounds/document width at320/375/768/1440px, zero page errors | `/tmp/lingora-audit-codex-final-independent-ui.log` |

Build emits two dynamic filesystem tracing warnings from generated Prisma client/runtime. Build succeeds; generated files and bundler configuration were not modified to suppress these warnings. Broad suites are not repeated after their final successful runs; no test skip or weakened assertion was introduced.

Three targeted source negative controls **failed as expected**, each exit1 for the intended assertion: remove post-body stale guard → visible rows change; remove API cache override → public cache escapes; move client acquisition outside try → missing-config exception escapes. Each mutation was restored byte-for-byte in finally before final gates. Raw results: `/tmp/lingora-audit-codex-negative-controls.json` and `/tmp/lingora-audit-codex-negative-{stale-body-guard,cache-override,acquisition-boundary}.log`. No mutation remains in product source.

Visual inspection: `/tmp/lingora-audit-root-375.png` (full page), `/tmp/lingora-audit-codex-screenshots/audit-mobile-320.png`, and `/tmp/lingora-audit-codex-screenshots/audit-populated-desktop.png`. Sidebar, full filter controls and pagination remain usable; the wide audit table scrolls within its wrapper.

## Final source review and limits

Reviewed actual component, route/page/service, test assertions and existing worker diff. Fresh ACTIVE ADMIN verification still precedes audit reads; denial makes zero audit reads. Explicit allowlisted DTO/SQL projection, parameter binding, fixed51-row fetch, exact six-digit cursor precision, filter validation, generic errors and private no-store remain intact. No production test-auth seam, untrusted HTML insertion, raw sensitive event field display, migration or new dependency was introduced. Navigation success/failure state and restored timestamp/accessibility requirements pass meaningful runtime checks.

This accepts the existing stored-event audit viewer locally; it does not complete every UC-14 reporting/event-emission requirement. No global chronological index was added. Authenticated positive browser behavior uses isolated production components/page-derived props with synthetic provider/database seams; built Next smoke covers anonymous real routes. Authenticated production/provider behavior and deployment remain untested in this repair. Owner worktree edits remain uncommitted and intact.
