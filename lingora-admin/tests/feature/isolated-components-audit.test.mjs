import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3014;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;
const SCREENSHOT_DIR = '/tmp/lingora-audit-codex-screenshots';

describe('Audit Events: Isolated Component & Browser Suite', () => {
  let server;
  let browser;

  before(async () => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    server = await startIsolatedServer(TEST_PORT);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  test('Populated table renders Sidebar active link with aria-current="page", table caption, permanent 31-day guidance and safe labels', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditEventsTable', { state: 'visible' });

    // 1. Sidebar link active state and aria-current
    const navItem = await page.$('#navAuditEvents');
    assert.ok(navItem, 'Sidebar must contain navAuditEvents link');
    const className = await navItem.getAttribute('class');
    assert.ok(className?.includes('active'), 'Sidebar navAuditEvents must have active class');
    const ariaCurrent = await navItem.getAttribute('aria-current');
    assert.equal(ariaCurrent, 'page', 'Sidebar navAuditEvents must have aria-current="page"');

    // 2. Heading and disclaimer with visible 31-day limit
    const titleText = await page.textContent('.page-title');
    assert.ok(titleText?.includes('Nhật ký hoạt động'));
    const descText = await page.textContent('.page-description');
    assert.ok(descText?.includes('Việc không có bản ghi không đồng nghĩa với việc không có hoạt động diễn ra'));
    assert.ok(descText?.includes('Khoảng thời gian tra cứu tối đa là 31 ngày'), 'Visible permanent 31-day limit guidance required');

    // 3. Table caption (Finding 5)
    const caption = await page.textContent('#auditEventsTable caption');
    assert.ok(caption?.includes('Nhật ký hoạt động hệ thống (tra cứu tối đa 31 ngày)'), 'Table must have semantic caption with 31-day limit');

    // 4. Table content and redaction
    const rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(rows.length, 5, 'Must render 5 mock audit event rows');

    // Row 1: TEACHER_PROVISIONED -> Khởi tạo giáo viên
    const row1Text = await rows[0].innerText();
    assert.ok(row1Text.includes('Khởi tạo giáo viên'));
    assert.ok(row1Text.includes('Tài khoản'));
    assert.ok(row1Text.includes('Thành công'));
    const timestamps = await page.locator('#auditEventsTable tbody time').evaluateAll((elements) =>
      elements.map((element) => ({ text: element.textContent, dateTime: element.getAttribute('datetime') }))
    );
    assert.equal(timestamps.length, rows.length, 'Every event must have a semantic timestamp');
    assert.ok(timestamps.every(({ text, dateTime }) => text === dateTime && /Z$/.test(dateTime)));

    // Row 3: VERIFIED_AUTH_SUBJECT -> Đối tượng xác thực without subject UUID
    const row3Text = await rows[2].innerText();
    assert.ok(row3Text.includes('Đối tượng xác thực'));
    assert.ok(row3Text.includes('Giáo viên hoàn tất kích hoạt'));

    // Row 5: OTHER -> Khác
    const row5Text = await rows[4].innerText();
    assert.ok(row5Text.includes('Khác'));
    assert.ok(row5Text.includes('Bị từ chối'));

    // 5. Initial Pagination buttons
    const prevBtn = await page.$('#btnAuditPrev');
    const nextBtn = await page.$('#btnAuditNext');
    assert.equal(await prevBtn?.isDisabled(), true, 'Trang trước must be disabled on first page');
    assert.equal(await nextBtn?.isDisabled(), false, 'Trang tiếp must be enabled when nextCursor exists');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit-populated-desktop.png') });
    await context.close();
  });

  test('Keyset pagination: Next advances page and Back returns to prior page waiting for completed responses', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnAuditNext', { state: 'visible' });

    // 1. Click Next and wait for response & DOM update
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnAuditNext'),
    ]);
    await page.waitForFunction(() =>
      document.querySelector('#auditEventsTable tbody tr')?.innerText.includes('Vô hiệu hóa giáo viên')
    );

    // After advancing to page 2:
    const prevBtn = await page.$('#btnAuditPrev');
    const nextBtn = await page.$('#btnAuditNext');
    assert.equal(await prevBtn?.isDisabled(), false, 'Trang trước must be enabled on page 2');
    assert.equal(await nextBtn?.isDisabled(), true, 'Trang tiếp must be disabled on last page');

    // Verify row rendered on page 2
    const page2Rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(page2Rows.length, 1);
    const page2Text = await page2Rows[0].innerText();
    assert.ok(page2Text.includes('Vô hiệu hóa giáo viên'));

    // 2. Click Back and wait for response & completed DOM update
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnAuditPrev'),
    ]);
    await page.waitForFunction(() =>
      document.querySelector('#auditEventsTable tbody tr')?.innerText.includes('Khởi tạo giáo viên')
    );

    // After returning to page 1:
    assert.equal(await prevBtn?.isDisabled(), true, 'Trang trước must be disabled on page 1');
    assert.equal(await nextBtn?.isDisabled(), false, 'Trang tiếp must be enabled on page 1');

    const page1Rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(page1Rows.length, 5);
    const page1Text = await page1Rows[0].innerText();
    assert.ok(page1Text.includes('Khởi tạo giáo viên'));

    await context.close();
  });

  test('Failed Next and Back preserve prior view state and history; Retry applies transition exactly once', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnAuditNext', { state: 'visible' });

    // --- 1. Test Failed Next on Page 1 ---
    let shouldFail = true;
    await page.route('**/api/audit-events*', async (route) => {
      if (shouldFail) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }),
        });
      } else {
        await route.continue();
      }
    });

    // Attempt Next -> fails
    await page.click('#btnAuditNext');
    await page.waitForSelector('#auditErrorBanner', { state: 'visible' });

    // Crucial Finding 1 checks:
    // Page must STILL be Trang 1, Back button disabled, Page 1 rows retained
    const paginationText = await page.textContent('.pagination-controls');
    assert.ok(paginationText?.includes('Trang 1'), 'Failed Next must preserve Trang 1');
    const isPrevDisabled = await page.$eval('#btnAuditPrev', (el) => el.hasAttribute('disabled'));
    assert.equal(isPrevDisabled, true, 'Failed Next must keep Back button disabled');
    const rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(rows.length, 5, 'Failed Next must preserve existing 5 rows');
    const firstRowText = await rows[0].innerText();
    assert.ok(firstRowText.includes('Khởi tạo giáo viên'), 'Failed Next must keep Page 1 content');

    // Click Retry (with route restored) -> Advances to Page 2
    shouldFail = false;
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnAuditRetry'),
    ]);
    await page.waitForFunction(() =>
      document.querySelector('#auditEventsTable tbody tr')?.innerText.includes('Vô hiệu hóa giáo viên')
    );

    const paginationTextP2 = await page.textContent('.pagination-controls');
    assert.ok(paginationTextP2?.includes('Trang 2'), 'Successful retry must advance to Trang 2');
    const isPrevEnabledP2 = await page.$eval('#btnAuditPrev', (el) => !el.hasAttribute('disabled'));
    assert.equal(isPrevEnabledP2, true, 'Back button must be enabled on Page 2');

    // --- 2. Test Failed Back on Page 2 ---
    shouldFail = true;
    await page.click('#btnAuditPrev');
    await page.waitForSelector('#auditErrorBanner', { state: 'visible' });

    // Crucial Finding 1 checks for Back failure:
    // Page must STILL be Trang 2, Back button STILL enabled, Page 2 rows retained
    const paginationTextBackFail = await page.textContent('.pagination-controls');
    assert.ok(paginationTextBackFail?.includes('Trang 2'), 'Failed Back must preserve Trang 2');
    const isPrevEnabledBackFail = await page.$eval('#btnAuditPrev', (el) => !el.hasAttribute('disabled'));
    assert.equal(isPrevEnabledBackFail, true, 'Failed Back must keep Back button enabled');
    const page2RowsAfterFail = await page.$$('#auditEventsTable tbody tr');
    assert.equal(page2RowsAfterFail.length, 1, 'Failed Back must preserve Page 2 single row');
    assert.ok((await page2RowsAfterFail[0].innerText()).includes('Vô hiệu hóa giáo viên'));

    // Click Retry -> Returns to Page 1
    shouldFail = false;
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnAuditRetry'),
    ]);
    await page.waitForFunction(() =>
      document.querySelector('#auditEventsTable tbody tr')?.innerText.includes('Khởi tạo giáo viên')
    );

    const paginationTextRestored = await page.textContent('.pagination-controls');
    assert.ok(paginationTextRestored?.includes('Trang 1'), 'Successful retry must return to Trang 1');
    const isPrevDisabledRestored = await page.$eval('#btnAuditPrev', (el) => el.hasAttribute('disabled'));
    assert.equal(isPrevDisabledRestored, true, 'Back button must be disabled on Page 1');

    await context.close();
  });

  test('Failed Apply and Reset preserve page, rows and inputs; Retry commits the same transition once', async () => {
    for (const action of ['apply', 'reset']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const settle = () => page.waitForFunction(() => !document.querySelector('#auditLoadingStatus'));
      await page.goto(`${TEST_URL}/audit-events?state=audit-populated`);
      await page.locator('#btnAuditNext').click();
      await settle();
      assert.match(await page.locator('.pagination-controls').innerText(), /Trang 2\)/);
      const rowsBefore = await page.locator('#auditEventsTable tbody').innerText();
      await page.locator('#auditActionSelect').selectOption('TEACHER_ENABLED');
      const inputsBefore = await page.locator('#auditFilterForm input, #auditFilterForm select')
        .evaluateAll((elements) => elements.map((element) => element.value));
      const requests = [];
      let shouldFail = true;
      await page.route('**/api/audit-events*', (route) => {
        requests.push(route.request().url());
        return shouldFail
          ? route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE', message: 'Synthetic outage' } } })
          : route.continue();
      });
      await page.locator(action === 'apply' ? '#btnApplyAuditFilters' : '#btnResetAuditFilters').click();
      await settle();
      assert.match(await page.locator('.pagination-controls').innerText(), /Trang 2\)/);
      assert.equal(await page.locator('#auditEventsTable tbody').innerText(), rowsBefore);
      assert.deepEqual(await page.locator('#auditFilterForm input, #auditFilterForm select')
        .evaluateAll((elements) => elements.map((element) => element.value)), inputsBefore);
      assert.equal(await page.locator('#btnAuditPrev').isDisabled(), false);
      assert.equal(await page.locator('#btnAuditRetry').isVisible(), true);
      shouldFail = false;
      await page.locator('#btnAuditRetry').click();
      await settle();
      assert.equal(requests.length, 2, 'One failed attempt and one retry');
      assert.equal(requests[1], requests[0], 'Retry preserves the intended filters and bounds');
      assert.match(await page.locator('.pagination-controls').innerText(), /Trang 1\)/);
      assert.equal(await page.locator('#btnAuditPrev').isDisabled(), true);
      assert.equal(await page.locator('#auditActionSelect').inputValue(), action === 'apply' ? 'TEACHER_ENABLED' : '');
      assert.equal(await page.locator('#auditErrorBanner').count(), 0);
      await context.close();
    }
  });

  test('Obsolete slower response does not overwrite newer completed response (guarded through body parsing)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditEventsTable', { state: 'visible' });

    // Set up delayed body parsing on the first request
    await page.evaluate(() => {
      let resolveFirstBody;
      window.__FIRST_BODY_PROMISE__ = new Promise((resolve) => {
        resolveFirstBody = resolve;
      });
      window.__FIRST_BODY_STARTED__ = false;
      window.__FIRST_BODY_FINISHED__ = false;
      window.__RESOLVE_FIRST_BODY__ = resolveFirstBody;

      const originalFetch = window.fetch;
      let fetchCount = 0;

      window.fetch = async (...args) => {
        fetchCount++;
        const currentCount = fetchCount;
        const res = await originalFetch(...args);

        if (currentCount === 1) {
          // Delay body parsing on first request
          return {
            status: 200,
            ok: true,
            json: async () => {
              window.__FIRST_BODY_STARTED__ = true;
              await window.__FIRST_BODY_PROMISE__;
              window.__FIRST_BODY_FINISHED__ = true;
              return {
                data: [
                  {
                    id: 'stale-slow-row-id',
                    occurredAt: '2026-11-04T00:00:00.000000Z',
                    actorKind: 'SYSTEM',
                    actorId: null,
                    action: 'TEACHER_DISABLED',
                    targetType: 'ACCOUNT',
                    targetId: null,
                    outcome: 'SUCCESS',
                  },
                ],
                filters: { from: '2026-11-01T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z', action: null, outcome: null },
                nextCursor: null,
              };
            },
          };
        }
        return res;
      };
    });

    // Trigger Request 1 (Next)
    await page.click('#btnAuditNext');

    await page.waitForFunction(() => window.__FIRST_BODY_STARTED__);

    // Simulate subsequent request arriving before Request 1's body resolves (Form submit)
    await page.evaluate(() => {
      const applyBtn = document.querySelector('#btnApplyAuditFilters');
      applyBtn?.removeAttribute('disabled');
      const form = document.querySelector('#auditFilterForm');
      if (typeof form?.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    // Wait for the UI loading status to finish from request 2
    await page.waitForFunction(() => document.querySelector('#auditLoadingStatus') === null);

    const goodRows = await page.locator('#auditEventsTable tbody').innerText();
    assert.match(goodRows, /Khởi tạo giáo viên/);

    // Now release the first request's held body parsing
    await page.evaluate(() => {
      if (typeof window.__RESOLVE_FIRST_BODY__ === 'function') {
        window.__RESOLVE_FIRST_BODY__();
      }
    });

    await page.waitForFunction(() => window.__FIRST_BODY_FINISHED__);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#auditEventsTable tbody').innerText(), goodRows,
      'Delayed stale body must not replace the newer visible rows');
    assert.match(await page.locator('.pagination-controls').innerText(), /Trang 1\)/);

    await context.close();
  });

  test('Filter Apply updates results and resets pagination stack; Reset restores defaults', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditFilterForm', { state: 'visible' });

    // Advance to page 2 first so back stack is non-empty
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnAuditNext'),
    ]);
    assert.equal(await page.$eval('#btnAuditPrev', (el) => el.hasAttribute('disabled')), false);

    // Select action filter
    await page.selectOption('#auditActionSelect', 'TEACHER_DISABLED');

    // Click Apply
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnApplyAuditFilters'),
    ]);

    // Applying filters must reset back stack
    const prevBtn = await page.$('#btnAuditPrev');
    assert.equal(await prevBtn?.isDisabled(), true, 'Applying filter must reset pagination back stack');

    // Click Reset
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/audit-events')),
      page.click('#btnResetAuditFilters'),
    ]);

    // Verify action select is reset to ''
    const actionVal = await page.$eval('#auditActionSelect', (el) => el.value);
    assert.equal(actionVal, '', 'Action select must reset to all actions');

    await context.close();
  });

  test('Pending button locking prevents duplicate clicks and shows status aria-busy', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let releaseRoute;
    const holdPromise = new Promise((resolve) => {
      releaseRoute = resolve;
    });

    let requestCount = 0;
    await page.route('**/api/audit-events*', async (route) => {
      requestCount++;
      await holdPromise;
      await route.continue();
    });

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnAuditNext', { state: 'visible' });

    // Click Next
    const nextBtn = await page.$('#btnAuditNext');
    await nextBtn?.click();

    // Verify loading status indicator and aria-busy
    await page.waitForSelector('#auditLoadingStatus', { state: 'visible' });
    const ariaBusy = await page.$eval('#auditLoadingStatus', (el) => el.getAttribute('aria-busy'));
    assert.equal(ariaBusy, 'true', 'Loading status must have aria-busy="true"');

    // Verify buttons disabled while pending
    const isApplyDisabled = await page.$eval('#btnApplyAuditFilters', (el) => el.hasAttribute('disabled'));
    const isResetDisabled = await page.$eval('#btnResetAuditFilters', (el) => el.hasAttribute('disabled'));
    const isNextDisabled = await page.$eval('#btnAuditNext', (el) => el.hasAttribute('disabled'));
    assert.equal(isApplyDisabled, true, 'Apply button must be disabled while request is pending');
    assert.equal(isResetDisabled, true, 'Reset button must be disabled while request is pending');
    assert.equal(isNextDisabled, true, 'Next button must be disabled while request is pending');

    // Attempt second click while pending
    await nextBtn?.click({ force: true }).catch(() => {});

    // Release held route
    releaseRoute();

    // Wait until loading finishes
    await page.waitForFunction(() => document.querySelector('#auditLoadingStatus') === null);
    assert.equal(requestCount, 1, 'Only one request must be dispatched; duplicate clicks ignored');

    await context.close();
  });

  test('Compiled production page props wire into browser DOM via page-audit-wire', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=page-audit-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditEventsTable', { state: 'visible' });

    // Assert compiled props from server component are rendered
    const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
    assert.ok(pageProps?.account, 'Must receive account in compiled props');
    assert.equal(pageProps.account.role, 'ADMIN');
    assert.ok(Array.isArray(pageProps.initialData), 'Must receive initialData array');

    const titleText = await page.textContent('.page-title');
    assert.ok(titleText?.includes('Nhật ký hoạt động'));

    const rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(rows.length, 1);
    const rowText = await rows[0].innerText();
    assert.ok(rowText.includes('Khởi tạo giáo viên'));

    await context.close();
  });

  test('Error state displays recoverable error with Retry button and keyboard focus', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-fetch-error`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditErrorBanner', { state: 'visible' });

    const bannerText = await page.textContent('#auditErrorBanner');
    assert.ok(bannerText?.includes('Không thể kết nối đến máy chủ Lingora'));

    const retryBtn = await page.$('#btnAuditRetry');
    assert.ok(retryBtn, 'Retry button must be visible on error');

    // Test keyboard focus
    await retryBtn.focus();
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'btnAuditRetry');
    assert.equal(isFocused, true, 'Retry button must be focusable by keyboard');

    // Click retry -> recovers cleanly
    await retryBtn.click();
    await page.waitForSelector('#auditEventsTable', { state: 'visible' });

    const errorBanner = await page.$('#auditErrorBanner');
    assert.equal(errorBanner, null, 'Error banner must be cleared after successful retry');

    await context.close();
  });

  test('Access denial on later 403 purges privileged rows and displays Access Denied banner', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditEventsTable', { state: 'visible' });

    // Override fetch to return 403
    await page.evaluate(() => {
      window.fetch = async () =>
        new Response(
          JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Tài khoản không có quyền xem nhật ký.' } }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    });

    // Trigger fetch via Next
    await page.click('#btnAuditNext');
    await page.waitForSelector('#auditAccessDeniedBanner', { state: 'visible' });

    // Privileged rows must be purged
    const rows = await page.$$('#auditEventsTable tbody tr');
    assert.equal(rows.length, 0, 'Privileged data rows must be purged on 403 response');

    await context.close();
  });

  test('Empty state renders clear message when no events exist', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}/audit-events?state=audit-empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auditEventsEmptyState', { state: 'visible' });

    const emptyText = await page.textContent('#auditEventsEmptyState');
    assert.ok(emptyText?.includes('Không tìm thấy sự kiện nhật ký nào trong khoảng thời gian đã chọn'));

    await context.close();
  });

  test('Audit controls fit at 320, 375, 768, 1024 and 1440px without hiding overflow', async () => {
    for (const width of [320, 375, 768, 1024, 1440]) {
      const vp = { width, height: 900 };
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(`${TEST_URL}/audit-events?state=audit-populated`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#auditEventsTable', { state: 'visible' });

      // Form controls must be visible and usable
      assert.ok(await page.isVisible('#auditFromInput'), `From input visible at ${vp.width}px`);
      assert.ok(await page.isVisible('#auditToInput'), `To input visible at ${vp.width}px`);
      assert.ok(await page.isVisible('#auditActionSelect'), `Action select visible at ${vp.width}px`);
      assert.ok(await page.isVisible('#auditOutcomeSelect'), `Outcome select visible at ${vp.width}px`);
      assert.ok(await page.isVisible('#btnApplyAuditFilters'), `Apply button visible at ${vp.width}px`);
      const geometry = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        controls: [...document.querySelectorAll('#auditFilterForm input, #auditFilterForm select, #auditFilterForm button, .pagination-controls button, #navAuditEvents, #btnLogout')].map((element) => {
          const rect = element.getBoundingClientRect();
          let clipped = false;
          for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) {
              const bounds = parent.getBoundingClientRect();
              clipped ||= rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
            }
          }
          return { id: element.id, left: rect.left, right: rect.right, width: rect.width, clipped };
        }),
      }));
      assert.ok(geometry.documentWidth <= width + 1, `Document overflows at ${width}px`);
      for (const control of geometry.controls) {
        assert.ok(control.left >= -1 && control.right <= width + 1 && !control.clipped,
          `${control.id} clipped at ${width}px: ${JSON.stringify(control)}`);
        if (control.id === 'auditFromInput' || control.id === 'auditToInput') {
          assert.ok(control.width >= 230, `${control.id} must fit the date and time at ${width}px`);
        }
      }

      // Mobile navigation is available through its drawer; desktop navigation stays visible.
      if (width < 768) {
        assert.equal(await page.isVisible('.app-sidebar'), false, 'Mobile drawer starts closed');
        const menu = page.getByRole('button', { name: 'Mở menu', exact: true });
        await menu.click();
        assert.ok(await page.isVisible('#navAuditEvents'), `Audit navigation reachable at ${width}px`);
        assert.equal(await page.locator('#navAuditEvents').getAttribute('aria-current'), 'page');
        await page.keyboard.press('Escape');
        assert.equal(await menu.evaluate(el => el === document.activeElement), true, 'Drawer restores menu focus');
      } else {
        assert.ok(await page.isVisible('.app-sidebar'), `Sidebar visible at ${vp.width}px`);
      }
      assert.ok(await page.isVisible('.logout-btn'), `Logout button visible at ${vp.width}px`);

      // Table wrapper must handle horizontal scroll
      const hasTableScroll = await page.$eval('#auditEventsTableWrapper', (el) => {
        const style = window.getComputedStyle(el);
        return style.overflowX === 'auto' || style.overflow === 'auto';
      });
      assert.equal(hasTableScroll, true, `Table wrap must have overflow-x auto at ${vp.width}px`);

      // Keyboard navigation check: can focus and type into inputs
      await page.focus('#auditActionSelect');
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#auditActionSelect').evaluate((el) => el === document.activeElement), true);
      await page.locator('#btnResetAuditFilters').click();
      await page.waitForFunction(() => !document.querySelector('#auditLoadingStatus'));
      assert.equal(await page.locator('#auditActionSelect').inputValue(), '');
      assert.deepEqual(pageErrors, [], `No browser errors at ${width}px`);

      if (vp.width === 375) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit-mobile-375.png'), fullPage: true });
      } else if (vp.width === 320) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit-mobile-320.png'), fullPage: true });
      } else if (vp.width === 1440) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit-populated-desktop.png') });
      }

      await context.close();
    }
  });
});
