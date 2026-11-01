import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startIsolatedServer } from './harness/isolated-server.mjs';
import {
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  fixtureEmail,
  fixturePassword,
  contextId,
  lesson1Id,
  lesson2Id,
  revision1Id,
} from './harness/learner-fixture.mjs';

const origin = 'http://127.0.0.1:3039';
let server, browser;

before(async () => {
  server = await startIsolatedServer(3039);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

beforeEach(() => {
  Object.assign(server.fixture, {
    account: account(),
    contexts: [contextRow()],
    units: [unitRow()],
    lessons: [lessonRow(), lesson2Row()],
    exercises: exercisesRows(),
    vocabulary: vocabularyRows(),
    completions: [],
    consumptions: [],
    expired: false,
    dbFailure: false,
    contextFailure: false,
  });
});

async function withLearner(run) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  try {
    await page.goto(`${origin}/home`);
    await page.waitForURL(`${origin}/login`);
    await page.locator('#loginEmail').fill(fixtureEmail);
    await page.locator('#loginPassword').fill(fixturePassword);
    await page.locator('#loginPassword').press('Enter');
    await page.waitForURL(`${origin}/home`);
    await page.getByText('Learner A', { exact: true }).waitFor();
    await run(page);
  } finally {
    await context.close();
  }
}

test('Production Navigation: /home -> enterContextBtn -> /learn/[contextId] catalogue renders units, lessons and lock states', async () => {
  await withLearner(async (page) => {
    // 1. Verify link on /home exists for actionable context
    const enterBtn = page.locator(`#enterContextBtn-${contextId}`);
    await enterBtn.waitFor({ state: 'visible' });
    await enterBtn.click();

    // 2. Navigated to /learn/[contextId]
    await page.waitForURL(`${origin}/learn/${contextId}`);
    await page.locator('#catalogueView').waitFor({ state: 'visible' });

    // Course heading
    const courseHeading = await page.locator('#courseHeading').textContent();
    assert.match(courseHeading, /Khóa học A/);

    // Unit and lessons
    await page.getByText('Chương 1: Chào hỏi').waitFor();
    await page.getByText('Bài 1: Làm quen').waitFor();
    await page.getByText('Bài 2: Tạm biệt').waitFor();

    // Lesson 1 is unlocked, Lesson 2 is locked
    const lesson1Link = page.locator(`#lessonLink-${lesson1Id}`);
    assert.equal(await lesson1Link.isVisible(), true);

    const lesson2Text = await page.locator(`[data-lesson-id="${lesson2Id}"]`).textContent();
    assert.match(lesson2Text, /Cần hoàn thành bài học trước/);
    assert.match(lesson2Text, /Đã khóa/);
  });
});

test('Mutation F Control & Production Callback: "Mở nội dung" sends start -> reconciles to "Đang đọc" -> reveals content -> "Hoàn thành đọc nội dung" sends complete -> "Đã đọc"', async () => {
  await withLearner(async (page) => {
    // Navigate directly to Lesson 1 player
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#lessonPlayerView').waitFor({ state: 'visible' });

    // Verify initial unstarted state
    const initialBadge = await page.locator('#readingStateBadge').textContent();
    assert.match(initialBadge, /Chưa đọc/);
    await page.locator('#unstartedNotice').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#lessonContentContainer').count(), 0);

    const startBtn = page.locator('#startReadingBtn');
    await startBtn.waitFor({ state: 'visible' });

    // Intercept network call to verify exact start payload and callback wiring
    let startCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/consumption') && req.method() === 'POST') {
        const postData = JSON.parse(req.postData() || '{}');
        if (postData.action === 'start') {
          startCalled = true;
          assert.equal(postData.expectedPublishedRevisionId, revision1Id);
        }
      }
    });

    // Click "Mở nội dung"
    await startBtn.click();

    // Verify UI reconciles to "Đang đọc" and content is revealed
    await page.waitForFunction(() => {
      const badge = document.querySelector('#readingStateBadge');
      return badge?.textContent?.includes('Đang đọc');
    });
    assert.equal(startCalled, true, 'Actual production POST callback must be invoked with start action');

    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
    await page.locator('#contentBlocksSection').waitFor({ state: 'visible' });
    await page.locator('#vocabularySection').waitFor({ state: 'visible' });
    await page.locator('#exercisesSection').waitFor({ state: 'visible' });

    // Verify reading explanation is shown
    const explanation = await page.locator('#readingExplanation').textContent();
    assert.match(explanation, /Ghi nhận việc đọc nội dung, không hoàn thành bài tập hoặc mở khóa bài học tiếp theo/);

    // Verify complete button is now active
    const completeBtn = page.locator('#completeReadingBtn');
    await completeBtn.waitFor({ state: 'visible' });

    // Refresh page: state must be preserved as "Đang đọc"
    await page.reload();
    await page.locator('#lessonPlayerView').waitFor({ state: 'visible' });
    const reloadedBadge = await page.locator('#readingStateBadge').textContent();
    assert.match(reloadedBadge, /Đang đọc/);
    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });

    // Click "Hoàn thành đọc nội dung"
    let completeCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/consumption') && req.method() === 'POST') {
        const postData = JSON.parse(req.postData() || '{}');
        if (postData.action === 'complete') {
          completeCalled = true;
          assert.equal(postData.expectedPublishedRevisionId, revision1Id);
        }
      }
    });

    await page.locator('#completeReadingBtn').click();

    // Verify UI reconciles to "Đã đọc"
    await page.waitForFunction(() => {
      const badge = document.querySelector('#readingStateBadge');
      return badge?.textContent?.includes('Đã đọc');
    });
    assert.equal(completeCalled, true, 'Actual production POST callback must be invoked with complete action');
    await page.locator('#completedStateBtn').waitFor({ state: 'visible' });

    // Refresh page: state must be preserved as "Đã đọc"
    await page.reload();
    await page.locator('#lessonPlayerView').waitFor({ state: 'visible' });
    const finalBadge = await page.locator('#readingStateBadge').textContent();
    assert.match(finalBadge, /Đã đọc/);
  });
});

test('Stale publication error: 409 PUBLICATION_CHANGED displays safe reload prompt', async () => {
  await withLearner(async (page) => {
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#startReadingBtn').waitFor({ state: 'visible' });

    // Simulate publication change before click
    server.fixture.lessons[0].activeRevisionId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    server.fixture.lessons[0].activeRevision = {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      lessonId: lesson1Id,
      revisionNo: 2,
      status: 'PUBLISHED',
      title: { vi: 'Bài 1: Tái bản', en: 'Lesson 1: Republished' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung mới.' }],
    };

    await page.locator('#startReadingBtn').click();
    await page.locator('#actionAlert').waitFor({ state: 'visible' });

    const alertText = await page.locator('#actionAlert').textContent();
    assert.match(alertText, /Nội dung bài học đã được cập nhật\. Vui lòng tải lại trang\./);
    assert.equal(await page.locator('#reloadBtn').isVisible(), true);
  });
});

test('Audio failure handling: Listening exercise handles audio error gracefully without crashing', async () => {
  await withLearner(async (page) => {
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#startReadingBtn').click();
    await page.locator('#exercisesSection').waitFor({ state: 'visible' });

    // Find audio element and trigger synthetic error event
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
    });

    // Audio error alert appears without crashing the page
    const audioErr = page.locator('.audio-error-box');
    await audioErr.waitFor({ state: 'visible' });
    const errText = await audioErr.textContent();
    assert.match(errText, /Không thể tải âm thanh/);

    // Page and rest of exercises remain interactive
    assert.equal(await page.locator('#completeReadingBtn').isVisible(), true);
  });
});

test('Gating persistence on catalogue: Completing reading on Lesson 1 does NOT unlock Lesson 2 without LessonCompletion', async () => {
  await withLearner(async (page) => {
    // 1. Mark Lesson 1 as read
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#startReadingBtn').click();
    await page.locator('#completeReadingBtn').waitFor({ state: 'visible' });
    await page.locator('#completeReadingBtn').click();
    await page.locator('#completedStateBtn').waitFor({ state: 'visible' });

    // 2. Go back to catalogue
    await page.locator('#backToCatalogueBtn').click();
    await page.waitForURL(`${origin}/learn/${contextId}`);

    // Lesson 1 shows "Đã đọc"
    const lesson1Card = page.locator(`[data-lesson-id="${lesson1Id}"]`);
    assert.match(await lesson1Card.textContent(), /Đã đọc/);

    // Lesson 2 must STILL be locked because LessonConsumption does not unlock curriculum
    const lesson2Card = page.locator(`[data-lesson-id="${lesson2Id}"]`);
    assert.match(await lesson2Card.textContent(), /Đã khóa/);
    assert.match(await lesson2Card.textContent(), /Cần hoàn thành bài học trước/);
    assert.equal(await page.locator(`#lessonLink-${lesson2Id}`).count(), 0);
  });
});


test('Next-style refresh preserves document but remounts X player for unstarted Y', async () => {
  await withLearner(async page => {
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#startReadingBtn').click();
    await page.locator('#completeReadingBtn').waitFor();
    await page.evaluate(() => { window.__sameDocument = 'retained'; });
    const X = structuredClone(server.fixture.consumptions[0]);
    const Y = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    Object.assign(server.fixture.lessons[0], { activeRevisionId: Y, activeRevision: { ...server.fixture.lessons[0].activeRevision, id: Y, revisionNo: 2, title: {vi:'Published Y'}, contentBlocks:[{type:'paragraph',text:'Y content'}] } });
    await page.locator('#completeReadingBtn').click();
    await page.locator('#reloadBtn').waitFor();
    await page.locator('#reloadBtn').click();
    await page.getByRole('heading',{name:'Published Y',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__sameDocument),'retained');
    assert.equal(await page.locator('#readingStateBadge').innerText(),'Chưa đọc');
    assert.equal(await page.locator('#lessonContentContainer').count(),0);
    assert.equal(await page.locator('#completeReadingBtn').count(),0);
    await page.locator('#startReadingBtn').click();
    await page.locator('#completeReadingBtn').waitFor();
    assert.equal(server.fixture.consumptions.length,2);
    assert.deepEqual(server.fixture.consumptions.find(r=>r.lessonRevisionId===revision1Id),X);
    assert.equal(server.fixture.consumptions.find(r=>r.lessonRevisionId===Y).rowVersion,1n);
  });
});

test('actual player pending/network failure → usable content → actual retry; session and disabled denial never succeed', async () => {
  await withLearner(async page => {
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#startReadingBtn').click();await page.locator('#completeReadingBtn').waitFor();
    let release;const held=new Promise(r=>{release=r});
    await page.route('**/consumption',async route=>{await held;await route.abort();});
    await page.locator('#completeReadingBtn').click();
    assert.equal(await page.locator('#completeReadingBtn').isDisabled(),true);
    release();await page.locator('#actionAlert').waitFor();
    assert.equal(await page.locator('#readingStateBadge').innerText(),'Đang đọc');
    assert.equal(await page.locator('#lessonContentContainer').isVisible(),true);
    await page.unroute('**/consumption');
    server.fixture.expired=true;await page.locator('#completeReadingBtn').click();await page.locator('#actionAlert').waitFor();
    assert.equal(server.fixture.consumptions[0].completedAt,null);
    server.fixture.expired=false;server.fixture.account.status='DISABLED';await page.locator('#completeReadingBtn').click();
    await page.waitForFunction(()=>document.querySelector('#actionAlert')?.textContent?.includes('Tài khoản'));
    assert.equal(server.fixture.consumptions[0].completedAt,null);
    server.fixture.account.status='ACTIVE';await page.locator('#completeReadingBtn').click();await page.locator('#completedStateBtn').waitFor();
    assert.ok(server.fixture.consumptions[0].completedAt);
  });
});
