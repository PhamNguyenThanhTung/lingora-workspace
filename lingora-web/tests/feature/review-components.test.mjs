import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
} from './harness/learner-fixture.mjs';

const origin = 'http://127.0.0.1:3055';
let server, browser;

before(async () => {
  process.env.LINGORA_SRS_SIGNING_SECRET = 'a'.repeat(32);
  server = await startIsolatedServer(3055);
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
    attempts: [],
    responses: [],
    srsCards: [],
    srsReviewOperations: [],
    vocabularyConcepts: [
      {
        id: 'vocab-1',
        canonicalForm: 'Hello',
        senseKey: 'greeting',
        phonetic: 'həˈləʊ',
        partOfSpeech: 'interjection',
        meaningLabels: { vi: 'Xin chào', en: 'Greeting' },
        example: 'Hello, how are you today?',
      },
      {
        id: 'vocab-2',
        canonicalForm: 'Goodbye',
        senseKey: 'farewell',
        phonetic: 'ɡʊdˈbaɪ',
        partOfSpeech: 'interjection',
        meaningLabels: { vi: 'Tạm biệt' },
        example: 'Goodbye and see you tomorrow.',
      },
    ],
    commandReceipts: [],
  });
});

async function withLearner(run, options = {}) {
  const context = await browser.newContext(options);
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

test('P5 SRS UI: Home header navigation exposes "Ôn từ vựng" button linking to /review', async () => {
  await withLearner(async (page) => {
    const navBtn = page.locator('#reviewNavBtn');
    await navBtn.waitFor({ state: 'visible' });
    const text = await navBtn.textContent();
    assert.match(text, /Ôn từ vựng/);
    await navBtn.click();
    await page.waitForURL(`${origin}/review`);
    await page.locator('#srsInitialBox').waitFor({ state: 'visible' });
  });
});

test('P5 SRS UI: Empty due list -> click Start -> renders done box and return home link', async () => {
  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });

    // No cards in fixture -> click Start
    await page.locator('#startReviewBtn').click();
    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });
    const doneText = await page.locator('#srsDoneBox').textContent();
    assert.match(doneText, /không có từ vựng nào đến hạn ôn tập/);

    // Return to home
    await page.locator('#doneBackHomeBtn').click();
    await page.waitForURL(`${origin}/home`);
  });
});

test('P5 SRS UI: Due card progression: prompt -> reveal -> rate -> next card -> done (desktop)', async () => {
  const card1Id = randomUUID();
  const card2Id = randomUUID();
  const pastDue1 = new Date(Date.now() - 7200 * 1000);
  const pastDue2 = new Date(Date.now() - 3600 * 1000);

  server.fixture.srsCards = [
    {
      id: card1Id,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: pastDue1,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
    {
      id: card2Id,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-2',
      stage: 1,
      dueAt: pastDue2,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await page.locator('#startReviewBtn').click();

    // 1. First card: "Hello"
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    const word1 = await page.locator('.srs-canonical-form').textContent();
    assert.match(word1, /Hello/);
    assert.equal(await page.locator('.srs-phonetic, .srs-example, .srs-meaning').count(), 0);

    await page.locator('#revealAnswerBtn').click();
    await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });
    assert.match(await page.locator('.srs-phonetic').textContent(), /həˈləʊ/);
    assert.match(await page.locator('.srs-example').textContent(), /Hello, how are you today/);
    const meaning1 = await page.locator('.srs-meaning').textContent();
    assert.match(meaning1, /Xin chào/);

    // Rate "Đã nhớ"
    await page.locator('#rateRememberedBtn').click();

    // 2. Second card: "Goodbye"
    await page.locator('.srs-canonical-form').filter({ hasText: 'Goodbye' }).waitFor({ state: 'visible' });

    // Reveal and rate "Chưa nhớ"
    await page.locator('#revealAnswerBtn').click();
    await page.locator('#rateForgottenBtn').click();

    // 3. All done
    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });
    const doneText = await page.locator('#srsDoneBox').textContent();
    assert.match(doneText, /Hoàn thành ôn tập/);
    assert.match(doneText, /2 từ vựng/);

    // DB assertions
    assert.equal(server.fixture.srsReviewOperations.length, 2);
    assert.equal(server.fixture.srsReviewOperations[0].rating, 'REMEMBERED');
    assert.equal(server.fixture.srsReviewOperations[1].rating, 'FORGOTTEN');
  });
});

test('P5 SRS UI: Narrow mobile viewport (~390px) responsive layout & keyboard accessible', async () => {
  const cardId = randomUUID();
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });

    // Keyboard trigger start
    await page.locator('#startReviewBtn').press('Enter');
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });

    // Keyboard trigger reveal
    await page.locator('#revealAnswerBtn').press('Enter');
    await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });

    // Verify rating buttons are visible and click rateRememberedBtn
    await page.locator('#rateRememberedBtn').waitFor({ state: 'visible' });
    await page.locator('#rateRememberedBtn').click();

    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });
  }, { viewport: { width: 390, height: 844 } });
});

test('P5 SRS UI R5: Network failure before response -> retains pending operation, locks rating buttons, retry sends exact same operationKey', async () => {
  const cardId = randomUUID();
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await page.locator('#startReviewBtn').click();
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    await page.locator('#revealAnswerBtn').click();
    await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });

    const capturedBodies = [];
    let shouldFail = true;

    await page.route('**/api/srs/sessions/*/reviews', async (route) => {
      const body = route.request().postDataJSON();
      capturedBodies.push(body);
      if (shouldFail) {
        shouldFail = false;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Click rate "Đã nhớ" -> network abort
    await page.locator('#rateRememberedBtn').click();

    // Verify error alert & retry button
    await page.locator('#srsActionAlert').waitFor({ state: 'visible' });
    const alertText = await page.locator('#srsActionAlert').textContent();
    assert.match(alertText, /Lỗi kết nối mạng/);

    const retryBtn = page.locator('#retryReviewBtn');
    await retryBtn.waitFor({ state: 'visible' });
    const retryText = await retryBtn.textContent();
    assert.match(retryText, /Thử lại gửi kết quả/);

    // Verify rating buttons are DISABLED during unresolved pending operation
    const remDisabled = await page.locator('#rateRememberedBtn').isDisabled();
    const forgDisabled = await page.locator('#rateForgottenBtn').isDisabled();
    assert.equal(remDisabled, true, 'Rate Remembered must be disabled while operation is pending');
    assert.equal(forgDisabled, true, 'Rate Forgotten must be disabled while operation is pending');

    // Clicking retry now succeeds
    await retryBtn.click();
    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });

    // Assert that the exact same operationKey was used on retry
    assert.equal(capturedBodies.length, 2);
    assert.equal(capturedBodies[0].operationKey, capturedBodies[1].operationKey);
    assert.equal(capturedBodies[0].cardId, capturedBodies[1].cardId);
    assert.equal(capturedBodies[0].rating, capturedBodies[1].rating);

    // Only 1 operation recorded in DB
    assert.equal(server.fixture.srsReviewOperations.length, 1);
  });
});

test('P5 SRS UI R5: POST committed on server but response dropped -> retry idempotently succeeds without duplicate operation', async () => {
  const cardId = randomUUID();
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await page.locator('#startReviewBtn').click();
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    await page.locator('#revealAnswerBtn').click();
    await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });

    let requestCount = 0;
    await page.route('**/api/srs/sessions/*/reviews', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // Fetch to actual server to let it commit in DB, but return 500 error to browser client
        const response = await page.request.fetch(route.request());
        assert.equal(response.status(), 200, 'Server should have committed successfully');
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Mất kết nối sau ghi nhận.' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.locator('#rateRememberedBtn').click();
    await page.locator('#srsActionAlert').waitFor({ state: 'visible' });

    // Buttons must be disabled
    assert.equal(await page.locator('#rateRememberedBtn').isDisabled(), true);
    assert.equal(await page.locator('#rateForgottenBtn').isDisabled(), true);

    // Click retry -> re-submits exact same operationKey -> returns committed outcome
    await page.locator('#retryReviewBtn').click();
    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });

    // Exactly 1 operation row in DB, not 2
    assert.equal(server.fixture.srsReviewOperations.length, 1);
  });
});

test('P5 SRS UI R5: Invalid or expired token locks card and displays restart button', async () => {
  const cardId = randomUUID();
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await page.locator('#startReviewBtn').click();
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    await page.locator('#revealAnswerBtn').click();

    // Mock 409 SESSION_EXPIRED response
    await page.route('**/api/srs/sessions/*/reviews', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'SESSION_EXPIRED', message: 'Phiên ôn tập đã hết hạn.' },
        }),
      });
    });

    await page.locator('#rateRememberedBtn').click();

    // Restart button must appear
    await page.locator('#restartReviewBtn').waitFor({ state: 'visible' });
    const restartText = await page.locator('#restartReviewBtn').textContent();
    assert.match(restartText, /Bắt đầu phiên ôn tập mới/);

    // Rating buttons are disabled
    assert.equal(await page.locator('#rateRememberedBtn').isDisabled(), true);
    assert.equal(await page.locator('#rateForgottenBtn').isDisabled(), true);

    // Unroute and click restart
    await page.unroute('**/api/srs/sessions/*/reviews');
    await page.locator('#restartReviewBtn').click();

    // Re-starts fresh review session
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#restartReviewBtn').isVisible(), false);
    const counterText = await page.locator('#sessionCounter').textContent();
    assert.match(counterText, /Đã ôn:\s*0\s*\/\s*1\s*từ/, 'Session count must be reset to 0 on new/restarted session');
  });
});

test('P5 SRS UI: a stale rating refreshes the prompt and can end the session', async () => {
  const cardIds = [randomUUID(), randomUUID()];
  server.fixture.srsCards = cardIds.map((id, index) => ({
    id,
    learnerId: server.fixture.account.id,
    vocabularyId: `vocab-${index + 1}`,
    stage: 1,
    dueAt: new Date(Date.now() - (2 - index) * 60_000),
    lastReviewedAt: null,
    enrollmentSource: 'CORE_COMPLETION',
    rowVersion: 1n,
  }));

  await withLearner(async page => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').click();
    await page.locator('#revealAnswerBtn').click();
    await page.locator('#rateRememberedBtn').waitFor();

    // Another session has already reviewed this card.
    server.fixture.srsCards[0].dueAt = new Date(Date.now() + 60_000);
    await page.locator('#rateRememberedBtn').click();
    await page.getByText('Goodbye', { exact: true }).waitFor();
    await page.locator('#revealAnswerBtn').click();
    await page.getByText('Tạm biệt', { exact: true }).waitFor();
    assert.equal(await page.locator('#rateRememberedBtn').isEnabled(), true);

    const [completed] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/complete') && response.request().method() === 'POST'),
      page.locator('#completeReviewBtn').click(),
    ]);
    assert.equal(completed.status(), 200);
    assert.equal((await completed.json()).data.progress.completedCount, 0);
    await page.locator('#srsDoneBox').waitFor();
    assert.equal(server.fixture.srsReviewOperations.length, 0);
  });
});

test('P5 SRS UI: Account-wide SRS functions with paused learning context', async () => {
  // Pause context
  server.fixture.contexts[0].status = 'PAUSED';

  const cardId = randomUUID();
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    },
  ];

  await withLearner(async (page) => {
    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await page.locator('#startReviewBtn').click();
    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
    const word = await page.locator('.srs-canonical-form').textContent();
    assert.match(word, /Hello/);
  });
});
