import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const TEST_URL = 'http://127.0.0.1:3023';
let browser;
let server;

before(async () => {
  server = await startIsolatedServer(3023);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function withPage(state, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  try {
    await page.goto(`${TEST_URL}/?state=${state}`);
    await run(page);
  } finally {
    await context.close();
  }
}

const fulfill = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

test('production Admin review queue page renders the server-provided submission DTO', async () => {
  await withPage('page-review-queue-wire', async (page) => {
    const { initialQueue } = await page.evaluate(() => window.__PAGE_PROPS__);
    assert.equal(initialQueue.length, 1);
    assert.equal(initialQueue[0].submissionId, '88888888-8888-4888-8888-888888888001');
    assert.equal(initialQueue[0].revisionId, '77777777-7777-4777-8777-777777777001');
    await page.locator('#reviewQueueTable').waitFor();
    await page.getByText('Bài học đang chờ duyệt').waitFor();
    assert.equal(await page.locator('#btnViewReview-88888888-8888-4888-8888-888888888001').getAttribute('href'), '/review/88888888-8888-4888-8888-888888888001');
  });
});

test('production Teacher page submits the persisted revision through its actual API callback', async () => {
  await withPage('page-teacher-draft-wire&slice7=1', async (page) => {
    await page.locator('#lessonDraftForm').waitFor();
    assert.equal(await page.locator('#btnSubmitForReview').isDisabled(), false, 'persisted children and nullable feedback must not mark the unchanged draft dirty');
    const { initialLesson } = await page.evaluate(() => window.__PAGE_PROPS__);
    const path = `/api/teacher/lessons/${initialLesson.id}/submit`;
    let captured;
    let release;
    let hold = new Promise(resolve => { release = resolve; });
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname !== path || request.method() !== 'POST') return route.fulfill({ status: 404, body: '{}' });
      captured = { path: url.pathname, method: request.method(), body: request.postDataJSON() };
      await hold;
      const revision = { ...initialLesson.highestRevision, status: 'IN_REVIEW', rowVersion: '2' };
      const updated = {
        ...initialLesson,
        rowVersion: '2',
        highestRevision: revision,
        revisions: [{ ...revision }, ...(initialLesson.revisions || []).slice(1)],
      };
      await fulfill(route, 200, { data: updated, submissionId: '88888888-8888-4888-8888-888888888001' });
    });

    await page.locator('#btnSubmitForReview').click();
    await page.waitForFunction(() => document.querySelector('#btnSubmitForReview')?.disabled);
    assert.equal(captured.path, path);
    assert.equal(captured.method, 'POST');
    assert.deepEqual(captured.body, {
      revisionId: initialLesson.highestRevision.id,
      expectedLessonRowVersion: initialLesson.rowVersion,
      expectedRevisionRowVersion: initialLesson.highestRevision.rowVersion,
    });
    release();
    await page.locator('#inReviewNotice').waitFor();
    assert.match(await page.locator('#badgeRevisionStatus').innerText(), /Đang chờ duyệt/);
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    hold = Promise.resolve();
  });
});

test('production Teacher submit failure keeps the lesson usable for a valid retry', async () => {
  await withPage('page-teacher-draft-wire&slice7=1', async (page) => {
    await page.locator('#lessonDraftForm').waitFor();
    const { initialLesson } = await page.evaluate(() => window.__PAGE_PROPS__);
    const path = `/api/teacher/lessons/${initialLesson.id}/submit`;
    let attempts = 0;
    await page.route('**/api/**', async (route) => {
      if (new URL(route.request().url()).pathname !== path) return route.fulfill({ status: 404, body: '{}' });
      attempts++;
      if (attempts === 1) return fulfill(route, 503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'Try again.' } });
      const revision = { ...initialLesson.highestRevision, status: 'IN_REVIEW', rowVersion: '2' };
      return fulfill(route, 200, { data: {
        ...initialLesson,
        highestRevision: revision,
        revisions: [revision],
      }, submissionId: '88888888-8888-4888-8888-888888888001' });
    });

    const titleBefore = await page.locator('#inputDraftTitleVi').inputValue();
    await page.locator('#btnSubmitForReview').click();
    await page.locator('#draftSaveError').waitFor();
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), titleBefore);
    assert.equal(await page.locator('#btnSubmitForReview').isDisabled(), false);

    await page.locator('#btnSubmitForReview').click();
    await page.locator('#inReviewNotice').waitFor();
    assert.equal(attempts, 2);
  });
});

test('production Teacher page exposes stale reload and handles 401/403 without false success', async () => {
  for (const status of [409, 401, 403]) {
    await withPage('page-teacher-draft-wire&slice7=1', async (page) => {
      await page.locator('#lessonDraftForm').waitFor();
      const { initialLesson } = await page.evaluate(() => window.__PAGE_PROPS__);
      const path = `/api/teacher/lessons/${initialLesson.id}/submit`;
      await page.route('**/api/**', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname === path) {
          return fulfill(route, status, { error: { code: status === 409 ? 'STALE_REVISION' : status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message: 'Request rejected' } });
        }
        if (url.pathname === `/api/teacher/lessons/${initialLesson.id}`) {
          return fulfill(route, 200, { data: { ...initialLesson, rowVersion: '3' } });
        }
        return fulfill(route, 404, {});
      });
      await page.locator('#btnSubmitForReview').click();
      if (status === 401) {
        await page.locator('#sessionLostModal').waitFor();
        assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
      } else if (status === 403) {
        await page.getByRole('heading', { name: /Truy cập bị từ chối/ }).waitFor();
        assert.equal(await page.locator('#lessonDraftForm').count(), 0);
      } else {
        await page.locator('#btnReloadLessonToken').waitFor();
        assert.equal(await page.locator('#btnSubmitForReview').isDisabled(), true);
        await page.locator('#btnReloadLessonToken').click();
        await page.waitForFunction(() => !document.querySelector('#btnSubmitForReview')?.disabled);
        assert.equal(await page.locator('#inReviewNotice').count(), 0);
      }
    });
  }
});

test('production Admin review page calls pinned approve and publish endpoints and reconciles each DTO', async () => {
  await withPage('page-review-detail-wire', async (page) => {
    await page.locator('#reviewActionsPanel').waitFor();
    const detail = await page.evaluate(() => window.__PAGE_PROPS__.initialDetail);
    assert.deepEqual(detail.exercises.map(ex => ex.type), ['FILL_BLANK', 'REORDER', 'GRAMMAR', 'MCQ', 'LISTENING']);
    await page.getByText('I ____ coffee every morning.').waitFor();
    await page.getByText('is reading').waitFor();
    await page.getByText('She go to school.').waitFor();
    await page.getByText('She goes to school.', { exact: false }).first().waitFor();
    await page.getByText('What is the opposite of hot?').waitFor();
    await page.getByText('cold', { exact: false }).first().waitFor();
    await page.getByText('https://media.example.test/hello.mp3').waitFor();
    const calls = [];
    let releaseApprove;
    let approveHold = new Promise(resolve => { releaseApprove = resolve; });
    let releasePublish;
    let publishHold = new Promise(resolve => { releasePublish = resolve; });
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const body = request.postDataJSON();
      calls.push({ path: url.pathname, method: request.method(), body });
      if (url.pathname.endsWith('/approve')) {
        await approveHold;
        const approved = {
          ...detail,
          revision: { ...detail.revision, status: 'APPROVED', statusLabel: 'Đã duyệt', rowVersion: '3', approvedAt: new Date().toISOString() },
          reviews: [...detail.reviews, { id: '88888888-8888-4888-8888-888888888002', action: 'APPROVE', actionLabel: 'Phê duyệt', actor: { id: '00000000-0000-4000-8000-000000000001', displayName: 'Nguyễn Quản Trị' }, occurredAt: new Date().toISOString(), comment: null, revisionRowVersion: '3' }],
        };
        return fulfill(route, 200, { data: approved });
      }
      if (url.pathname.endsWith('/publish')) {
        await publishHold;
        const published = {
          ...detail,
          lesson: { ...detail.lesson, rowVersion: '4', activeRevisionId: detail.revision.id },
          revision: { ...detail.revision, status: 'PUBLISHED', statusLabel: 'Đã xuất bản', rowVersion: '4', publishedAt: new Date().toISOString() },
        };
        return fulfill(route, 200, { data: published });
      }
      return fulfill(route, 404, {});
    });

    await page.locator('#btnApprove').click();
    await page.waitForFunction(() => document.querySelector('#btnApprove')?.disabled);
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    releaseApprove();
    await page.locator('#btnPublish').waitFor();
    assert.equal(calls[0].path, `/api/reviews/${detail.submissionId}/approve`);
    assert.equal(calls[0].method, 'POST');
    assert.deepEqual(calls[0].body, { expectedRevisionRowVersion: detail.revision.rowVersion });
    assert.match(await page.locator('#badgeRevisionStatus').innerText(), /Đã duyệt/);

    await page.locator('#btnPublish').click();
    await page.waitForFunction(() => document.querySelector('#btnPublish')?.disabled);
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    releasePublish();
    await page.locator('#reviewActionSuccess').waitFor();
    assert.equal(calls[1].path, `/api/reviews/${detail.submissionId}/publish`);
    assert.equal(calls[1].method, 'POST');
    assert.deepEqual(calls[1].body, {
      expectedLessonRowVersion: detail.lesson.rowVersion,
      expectedRevisionRowVersion: '3',
    });
    assert.match(await page.locator('#badgeRevisionStatus').innerText(), /Đã xuất bản/);
    approveHold = Promise.resolve();
    publishHold = Promise.resolve();
  });
});

test('production Admin request-changes callback shows stale conflict and reloads the exact submission', async () => {
  await withPage('page-review-detail-wire', async (page) => {
    await page.locator('#reviewActionsPanel').waitFor();
    const detail = await page.evaluate(() => window.__PAGE_PROPS__.initialDetail);
    const calls = [];
    let release;
    let hold = new Promise(resolve => { release = resolve; });
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      calls.push({ path: url.pathname, method: request.method(), body: request.postDataJSON() });
      if (url.pathname.endsWith('/request-changes')) {
        await hold;
        return fulfill(route, 409, { error: { code: 'STALE_REVISION', message: 'Reload required' } });
      }
      if (url.pathname === `/api/reviews/${detail.submissionId}`) return fulfill(route, 200, { data: detail });
      return fulfill(route, 404, {});
    });
    await page.locator('#inputReviewComment').fill('Please clarify this example.');
    await page.locator('#btnRequestChanges').click();
    await page.waitForFunction(() => document.querySelector('#btnRequestChanges')?.disabled);
    assert.equal(await page.locator('#btnApprove').isDisabled(), true);
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    release();
    await page.locator('#btnReloadReview').waitFor();
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    assert.match(await page.locator('#badgeRevisionStatus').innerText(), /Đang chờ duyệt/);
    assert.deepEqual(calls[0], {
      path: `/api/reviews/${detail.submissionId}/request-changes`,
      method: 'POST',
      body: { expectedRevisionRowVersion: detail.revision.rowVersion, comment: 'Please clarify this example.' },
    });
    await page.locator('#btnReloadReview').click();
    await page.locator('#btnApprove').waitFor();
    assert.equal(calls[1].path, `/api/reviews/${detail.submissionId}`);
    assert.equal(calls[1].method, 'GET');
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
  });
});

test('production Admin review handles 401 and 403 without false success', async () => {
  const cases = [
    { state: 'page-review-detail-wire', action: 'approve', status: 401 },
    { state: 'page-review-detail-wire', action: 'request-changes', status: 403 },
    { state: 'page-review-approved-detail-wire', action: 'publish', status: 403 },
  ];
  for (const { state, action, status } of cases) {
    await withPage(state, async (page) => {
      await page.locator('#reviewActionsPanel').waitFor();
      const detail = await page.evaluate(() => window.__PAGE_PROPS__.initialDetail);
      await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith(`/${action}`)) return fulfill(route, status, { error: { code: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message: 'Request rejected' } });
        return fulfill(route, 404, {});
      });
      const button = action === 'approve' ? '#btnApprove' : action === 'request-changes' ? '#btnRequestChanges' : '#btnPublish';
      await page.locator(button).click();
      if (status === 401) {
        await page.waitForURL('**/login');
      } else {
        await page.locator('#reviewActionError').waitFor();
        assert.match(await page.locator('#reviewActionError').innerText(), /quyền/);
      }
      assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
      assert.equal(detail.submissionId, '88888888-8888-4888-8888-888888888001');
    });
  }
});
