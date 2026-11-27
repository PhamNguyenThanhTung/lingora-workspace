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
    await page.locator('#submitConfirmModal').waitFor();
    await page.locator('#btnConfirmSubmitForReview').click();
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
    await page.locator('#submitConfirmModal').waitFor();
    await page.locator('#btnConfirmSubmitForReview').click();
    await page.locator('#draftSaveError').waitFor();
    assert.equal(await page.locator('#reviewActionSuccess').count(), 0);
    assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), titleBefore);
    assert.equal(await page.locator('#btnSubmitForReview').isDisabled(), false);

    await page.locator('#btnSubmitForReview').click();
    await page.locator('#submitConfirmModal').waitFor();
    await page.locator('#btnConfirmSubmitForReview').click();
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
    await page.locator('#submitConfirmModal').waitFor();
    await page.locator('#btnConfirmSubmitForReview').click();
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
    // H3: the review header shows the revision number, never the concurrency row version.
    assert.match(await page.locator('#badgeRevisionNo').innerText(), /Bản sửa đổi: #\d+/);
    assert.equal((await page.locator('.review-header').innerText()).includes('Phiên bản'), false);
    const detail = await page.evaluate(() => window.__PAGE_PROPS__.initialDetail);
    assert.deepEqual(detail.exercises.map(ex => ex.type), ['FILL_BLANK', 'REORDER', 'GRAMMAR', 'MCQ', 'LISTENING']);
    await page.getByText('I ____ coffee every morning.').waitFor();
    await page.getByText('is reading', { exact: true }).waitFor();
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
      makeAvailable: true,
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
      if (action === 'request-changes') await page.locator('#inputReviewComment').fill('Cần sửa.');
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

test('LNG-04 (G9): ReviewDetailView renders preload=none audio player with error/retry without blocking Approve', async () => {
  await withPage('page-review-detail-wire', async (page) => {
    await page.locator('#reviewActionsPanel').waitFor();
    const detail = await page.evaluate(() => window.__PAGE_PROPS__.initialDetail);

    const reviewAudio = page.locator('#review-exercise-audio-4-player');
    await reviewAudio.waitFor({ state: 'visible' });
    assert.equal(await reviewAudio.getAttribute('preload'), 'none');
    assert.equal(await reviewAudio.getAttribute('autoplay'), null);
    assert.equal(await reviewAudio.evaluate((el) => el.controls), true);

    // Simulated audio load failure shows error + Retry button, and Approve stays interactive
    await reviewAudio.evaluate((el) => el.dispatchEvent(new Event('error')));
    await page.locator('#review-exercise-audio-4-error').waitFor({ state: 'visible' });
    await page.locator('#review-exercise-audio-4-retry').click();
    await page.locator('#review-exercise-audio-4-error').waitFor({ state: 'hidden' });

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === `/api/reviews/${detail.submissionId}/approve`) {
        return fulfill(route, 200, {
          data: {
            ...detail,
            revision: { ...detail.revision, status: 'APPROVED', rowVersion: '3' },
            reviewHistory: [],
          },
        });
      }
      return fulfill(route, 404, {});
    });

    assert.equal(await page.locator('#btnApprove').isDisabled(), false);
    await page.locator('#btnApprove').click();
    await page.locator('#reviewActionSuccess').waitFor({ state: 'visible' });
  });
});

test('LNG-01/02/03: ReviewDetailView joins ja REORDER without spaces, attaches lang, and formats ja vs fr phonetic', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  try {
    // 1. Japanese review detail
    await page.route('**/?state=page-review-detail-wire*', async (route) => {
      const response = await route.fetch();
      let html = await response.text();
      html = html.replace(
        /<script>window\.__PAGE_PROPS__ = .*?;<\/script>/,
        () => `<script>window.__PAGE_PROPS__ = ${JSON.stringify({
          account: { id: '00000000-0000-4000-8000-000000000001', role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' },
          initialDetail: {
            submissionId: '88888888-8888-4888-8888-888888888001',
            assignmentEpisode: null,
            lesson: {
              id: '55555555-5555-4555-8555-555555555001',
              position: 1,
              unitId: '44444444-4444-4444-8444-444444444040',
              unitCode: 'JA-01',
              unitName: { vi: 'Bài 1' },
              courseId: '33333333-3333-4333-8333-333333333030',
              courseName: { vi: 'Tiếng Nhật N5' },
              languageCode: 'ja',
              rowVersion: '1',
              activeRevisionId: null,
              availability: 'PLANNED',
            },
            revision: {
              id: '77777777-7777-4777-8777-777777777001',
              revisionNo: 1,
              status: 'IN_REVIEW',
              statusLabel: 'Đang chờ duyệt',
              title: { vi: 'Giới thiệu bản thân' },
              contentSchemaVersion: 1,
              contentBlocks: [],
              blocks: [
                {
                  blockKey: 'ex-1',
                  type: 'EXAMPLE',
                  position: 1,
                  schemaVersion: 1,
                  content: { text: 'わたしは田中です。', translation: 'Tôi là Tanaka.' },
                },
              ],
              presentation: {
                contentSchemaVersion: 1,
                languageCode: 'ja',
                blocks: [],
                vocabulary: [],
                exercises: [],
              },
              changeSummary: null,
              rowVersion: '1',
              createdAt: '2026-11-27T00:00:00.000Z',
              submittedAt: '2026-11-27T00:00:00.000Z',
              approvedAt: null,
              publishedAt: null,
              endedAt: null,
              submitter: { id: '1', displayName: 'GV' },
              approver: null,
              publisher: null,
            },
            exercises: [
              {
                id: 'ex-ja-1',
                itemId: 'item-1',
                itemRevisionId: 'irev-1',
                position: 1,
                isCore: true,
                type: 'REORDER',
                promptData: {
                  prompt: 'Sắp xếp câu tiếng Nhật',
                  tokens: [
                    { id: 't1', text: 'わたしは' },
                    { id: 't2', text: '田中' },
                    { id: 't3', text: 'です' },
                  ],
                },
                gradingData: { correctOrder: ['t1', 't2', 't3'] },
                feedbackData: null,
              },
            ],
            vocabulary: [
              {
                id: 'v-ja-1',
                vocabularyId: 'vc-ja-1',
                position: 1,
                isCore: true,
                displaySnapshot: {
                  schemaVersion: 1,
                  languageId: 'lang-ja',
                  canonicalForm: '学生',
                  senseKey: 'default',
                  meaningLabels: { vi: 'học sinh' },
                  phonetic: 'がくせい / gakusei',
                  partOfSpeech: 'noun',
                  example: 'わたしは学生です。',
                },
              },
              {
                id: 'v-ja-2',
                vocabularyId: 'vc-ja-2',
                position: 2,
                isCore: true,
                displaySnapshot: {
                  schemaVersion: 1,
                  languageId: 'lang-ja',
                  canonicalForm: '先生',
                  senseKey: 'default',
                  meaningLabels: { vi: 'giáo viên' },
                  reading: 'せんせい',
                  romanization: 'sensei',
                  partOfSpeech: 'noun',
                  example: '先生はお元気ですか。',
                },
              },
            ],
            reviews: [],
          },
        })};</script>`
      );
      await route.fulfill({ response, body: html });
    });

    await page.goto(`${TEST_URL}/?state=page-review-detail-wire`);
    await page.locator('#exerciseAnswer-0').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#exerciseAnswer-0').innerText()).trim(), 'わたしは田中です');
    assert.equal(await page.locator('#exerciseAnswer-0').getAttribute('lang'), 'ja');
    assert.equal(await page.locator('.lingora-example-text').getAttribute('lang'), 'ja');
    const jaVocabCell = page.locator('#sectionVocabulary, table').last();
    assert.match(await jaVocabCell.innerText(), /がくせい \/ gakusei/);
    assert.match(await jaVocabCell.innerText(), /せんせい/);
    assert.match(await jaVocabCell.innerText(), /\(sensei\)/);
    assert.equal((await jaVocabCell.innerText()).includes('/がくせい'), false);
    assert.equal(await page.locator('[lang="ja"]').count() >= 4, true);

    // 2. French review detail: single /.../ phonetic pair and lang="fr"
    await page.unrouteAll();
    await page.route('**/?state=page-review-detail-wire*', async (route) => {
      const response = await route.fetch();
      let html = await response.text();
      html = html.replace(
        /<script>window\.__PAGE_PROPS__ = .*?;<\/script>/,
        () => `<script>window.__PAGE_PROPS__ = ${JSON.stringify({
          account: { id: '00000000-0000-4000-8000-000000000001', role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' },
          initialDetail: {
            submissionId: '88888888-8888-4888-8888-888888888002',
            assignmentEpisode: null,
            lesson: {
              id: '55555555-5555-4555-8555-555555555002',
              position: 1,
              unitId: '44444444-4444-4444-8444-444444444040',
              unitCode: 'FR-01',
              unitName: { vi: 'Bài 1' },
              courseId: '33333333-3333-4333-8333-333333333030',
              courseName: { vi: 'Tiếng Pháp A1' },
              languageCode: 'fr',
              rowVersion: '1',
              activeRevisionId: null,
              availability: 'PLANNED',
            },
            revision: {
              id: '77777777-7777-4777-8777-777777777002',
              revisionNo: 1,
              status: 'IN_REVIEW',
              statusLabel: 'Đang chờ duyệt',
              title: { vi: 'Chào hỏi tiếng Pháp' },
              contentSchemaVersion: 1,
              contentBlocks: [],
              blocks: [],
              presentation: {
                contentSchemaVersion: 1,
                languageCode: 'fr',
                blocks: [],
                vocabulary: [],
                exercises: [],
              },
              changeSummary: null,
              rowVersion: '1',
              createdAt: '2026-11-27T00:00:00.000Z',
              submittedAt: '2026-11-27T00:00:00.000Z',
              approvedAt: null,
              publishedAt: null,
              endedAt: null,
              submitter: { id: '1', displayName: 'GV' },
              approver: null,
              publisher: null,
            },
            exercises: [
              {
                id: 'ex-fr-1',
                itemId: 'item-2',
                itemRevisionId: 'irev-2',
                position: 1,
                isCore: true,
                type: 'REORDER',
                promptData: {
                  prompt: 'Sắp xếp câu tiếng Pháp',
                  tokens: [
                    { id: 't1', text: 'Bonjour' },
                    { id: 't2', text: 'mon' },
                    { id: 't3', text: 'ami' },
                  ],
                },
                gradingData: { correctOrder: ['t1', 't2', 't3'] },
                feedbackData: null,
              },
            ],
            vocabulary: [
              {
                id: 'v-fr-1',
                vocabularyId: 'vc-fr-1',
                position: 1,
                isCore: true,
                displaySnapshot: {
                  schemaVersion: 1,
                  languageId: 'lang-fr',
                  canonicalForm: 'café',
                  senseKey: 'default',
                  meaningLabels: { vi: 'cà phê' },
                  phonetic: 'ka.fe',
                  partOfSpeech: 'noun',
                  example: 'Un café, s’il vous plaît.',
                },
              },
            ],
            reviews: [],
          },
        })};</script>`
      );
      await route.fulfill({ response, body: html });
    });

    await page.goto(`${TEST_URL}/?state=page-review-detail-wire`);
    await page.locator('#exerciseAnswer-0').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#exerciseAnswer-0').innerText()).trim(), 'Bonjour mon ami');
    assert.equal(await page.locator('#exerciseAnswer-0').getAttribute('lang'), 'fr');
    const frPageText = await page.locator('table').last().innerText();
    assert.match(frPageText, /\/ka\.fe\//);
    assert.equal(frPageText.includes('//ka.fe//'), false);
  } finally {
    await context.close();
  }
});
