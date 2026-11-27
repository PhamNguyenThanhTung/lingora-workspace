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
    // G11: the home link carries the selected context so /review opens on the same language.
    await page.waitForURL(url => url.pathname === '/review');
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
    assert.match(doneText, /Chưa có từ nào đến hạn/);

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

test('S6-09 WRITING SRS UI hides glyphs until every character is graded, then offers four ratings', async () => {
  const sessionId = randomUUID();
  const cardId = randomUUID();
  const operationKeys = [];
  let attemptedCharacters = 0;
  let recordedRating;

  await withLearner(async page => {
    await page.route('**/api/srs/sessions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'chữ viết' },
              writing: { characterNumber: 1, characterCount: 2, strokeCount: 1, attemptedCharacters: 0, revealedCharacters: null },
            },
          },
        }),
      });
    });
    await page.route('**/api/srs/sessions/*/writing-attempts', async route => {
      const payload = route.request().postDataJSON();
      operationKeys.push(payload.operationKey);
      assert.equal(payload.cardId, cardId);
      assert.equal(payload.characterNumber, attemptedCharacters + 1);
      assert.equal('sessionId' in payload, false, 'Body must not contain sessionId');
      assert.equal(payload.candidateStrokes.length, 1);
      assert.ok(payload.candidateStrokes[0].points.length >= 2);
      attemptedCharacters += 1;
      const revealedCharacters = attemptedCharacters === 2
        ? [
          { glyph: '文', score: 94, band: 'EXCELLENT', passed: true, details: { strokeCount: { expected: 1, actual: 1, diff: 0 }, strokeFeedback: [] } },
          { glyph: '字', score: 88, band: 'EXCELLENT', passed: true, details: { strokeCount: { expected: 1, actual: 1, diff: 0 }, strokeFeedback: [] } },
        ]
        : null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'chữ viết' },
              writing: {
                characterNumber: Math.min(attemptedCharacters + 1, 2),
                characterCount: 2,
                strokeCount: attemptedCharacters === 2 ? 0 : 1,
                attemptedCharacters,
                revealedCharacters,
              },
            },
          },
        }),
      });
    });
    await page.route('**/api/srs/sessions/*/reviews', async route => {
      recordedRating = route.request().postDataJSON().rating;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { sessionId, status: 'COMPLETED', progress: { currentIndex: 1, completedCount: 1, total: 1 }, currentItem: null, recordedRating } }),
      });
    });
    await page.route(`**/api/srs/sessions/${sessionId}`, async route => {
      if (recordedRating) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { sessionId, status: 'COMPLETED', progress: { currentIndex: 1, completedCount: 1, total: 1 }, currentItem: null } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'chữ viết' },
              writing: {
                characterNumber: Math.min(attemptedCharacters + 1, 2),
                characterCount: 2,
                strokeCount: attemptedCharacters === 2 ? 0 : 1,
                attemptedCharacters,
                revealedCharacters: attemptedCharacters === 2 ? [
                  { glyph: '文', score: 94, band: 'EXCELLENT', passed: true, details: { strokeCount: { expected: 1, actual: 1, diff: 0 }, strokeFeedback: [] } },
                  { glyph: '字', score: 88, band: 'EXCELLENT', passed: true, details: { strokeCount: { expected: 1, actual: 1, diff: 0 }, strokeFeedback: [] } },
                ] : null,
              },
            },
          },
        }),
      });
    });

    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').click();
    await page.getByText('chữ viết', { exact: true }).waitFor();
    assert.equal(await page.getByText('文', { exact: true }).count(), 0);
    assert.equal(await page.getByText('字', { exact: true }).count(), 0);

    for (let index = 0; index < 2; index++) {
      const canvas = page.locator('#srs-writing-canvas');
      const box = await canvas.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + 30, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
      await page.mouse.up();
      await page.locator('#srs-writing-submit').click();
      if (index === 0) {
        await page.getByText('Ký tự 2/2', { exact: false }).waitFor();
        assert.equal(await page.getByText('文', { exact: true }).count(), 0);
      }
    }

    await page.getByText('文', { exact: true }).waitFor();
    await page.getByText('字', { exact: true }).waitFor();
    for (const rating of ['AGAIN', 'HARD', 'GOOD', 'EASY']) {
      await page.locator(`#rateWriting${rating}Btn`).waitFor({ state: 'visible' });
    }
    await page.locator('#rateWritingGOODBtn').click();
    await page.locator('#srsDoneBox').waitFor();
  });

  assert.equal(operationKeys.length, 2);
  assert.notEqual(operationKeys[0], operationKeys[1]);
  assert.equal(recordedRating, 'GOOD');
});

test('S6-10.2e Canvas limits: caps at 128 strokes, 256 points/stroke, and 4096 total points, and allows clearing at limit', async () => {
  const sessionId = randomUUID();
  const cardId = randomUUID();

  await withLearner(async page => {
    await page.route('**/api/srs/sessions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'giới hạn nét' },
              writing: { characterNumber: 1, characterCount: 1, strokeCount: 1, attemptedCharacters: 0, revealedCharacters: null },
            },
          },
        }),
      });
    });

    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').click();
    await page.locator('#srs-writing-canvas').waitFor();

    // 1. Point limit per stroke: dispatch pointerdown + 300 moves + pointerup
    await page.evaluate(() => {
      const svg = document.getElementById('srs-writing-canvas');
      const rect = svg.getBoundingClientRect();
      const fire = (type, x, y) => svg.dispatchEvent(new PointerEvent(type, {
        clientX: rect.left + x, clientY: rect.top + y, button: 0, bubbles: true, pointerId: 1,
      }));
      fire('pointerdown', 10, 10);
      for (let i = 0; i < 300; i++) {
        fire('pointermove', 10 + (i % 50), 10 + Math.floor(i / 50));
      }
      fire('pointerup', 50, 50);
    });

    const pointCount = await page.evaluate(() => {
      const polyline = document.querySelector('#srs-writing-canvas polyline');
      return polyline ? polyline.getAttribute('points').trim().split(' ').length : 0;
    });
    assert.equal(pointCount, 256, 'Should cap at 256 points per stroke');

    // 2. Stroke limit: dispatch 130 strokes (2 points each)
    await page.evaluate(() => {
      const svg = document.getElementById('srs-writing-canvas');
      const rect = svg.getBoundingClientRect();
      const fire = (type, x, y) => svg.dispatchEvent(new PointerEvent(type, {
        clientX: rect.left + x, clientY: rect.top + y, button: 0, bubbles: true, pointerId: 1,
      }));
      document.getElementById('srs-writing-clear').click();
      for (let s = 0; s < 130; s++) {
        fire('pointerdown', 10, 10);
        fire('pointermove', 20, 20);
        fire('pointerup', 20, 20);
      }
    });

    const strokeCount = await page.evaluate(() => {
      return document.querySelectorAll('#srs-writing-canvas polyline').length;
    });
    assert.equal(strokeCount, 128, 'Should cap at 128 strokes');

    // 3. Learner can clear canvas even when limit is reached
    const clearBtn = page.locator('#srs-writing-clear');
    assert.equal(await clearBtn.isEnabled(), true);
    await clearBtn.click();
    const countAfterClear = await page.evaluate(() => {
      return document.querySelectorAll('#srs-writing-canvas polyline').length;
    });
    assert.equal(countAfterClear, 0, 'Canvas should be clear');
  });
});

test('S6-10.2e ReviewView: definitive 400 releases canvas; ambiguous failure retains key and replays exact payload', async () => {
  const sessionId = randomUUID();
  const cardId = randomUUID();
  const attemptRequests = [];
  let attemptCallCount = 0;
  let sessionRefreshes = 0;

  await withLearner(async page => {
    await page.route('**/api/srs/sessions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'thử lại' },
              writing: { characterNumber: 1, characterCount: 1, strokeCount: 1, attemptedCharacters: 0, revealedCharacters: null },
            },
          },
        }),
      });
    });

    await page.route('**/api/srs/sessions/*/writing-attempts', async route => {
      const payload = route.request().postDataJSON();
      attemptRequests.push(payload);
      attemptCallCount += 1;

      if (attemptCallCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'INVALID_STROKE_GEOMETRY', message: 'Nét vẽ không tạo thành đường đi hợp lệ.' } }),
        });
      } else if (attemptCallCount === 2) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ tạm thời bận.' } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              sessionId,
              status: 'ACTIVE',
              progress: { currentIndex: 0, completedCount: 0, total: 1 },
              currentItem: {
                cardId,
                skill: 'WRITING',
                meaningLabels: { vi: 'thử lại' },
                writing: {
                  characterNumber: 1,
                  characterCount: 1,
                  strokeCount: 0,
                  attemptedCharacters: 1,
                  revealedCharacters: [
                    { glyph: '文', score: 90, band: 'EXCELLENT', passed: true, details: { strokeCount: { expected: 1, actual: 1, diff: 0 }, strokeFeedback: [] } },
                  ],
                },
              },
            },
          }),
        });
      }
    });
    await page.route(`**/api/srs/sessions/${sessionId}`, async route => {
      sessionRefreshes += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'COMPLETED',
            progress: { currentIndex: 1, completedCount: 0, total: 1 },
            currentItem: null,
          },
        }),
      });
    });

    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').click();
    await page.locator('#srs-writing-canvas').waitFor();

    // 1. First drawing and submit -> gets 400
    const canvas = page.locator('#srs-writing-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
    await page.mouse.up();
    await page.locator('#srs-writing-submit').click();

    // Verify 400 message shown and canvas is released (submit button enabled after drawing or retry cleared)
    await page.getByText('Nét vẽ không tạo thành đường đi hợp lệ.').waitFor();
    assert.equal(await page.locator('#retryReviewBtn').count(), 0, 'Retry button should NOT exist for definitive 400');

    // 2. Redraw and submit again -> fresh key generated, gets 503
    await page.locator('#srs-writing-clear').click();
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 40, box.y + 40);
    await page.mouse.up();
    await page.locator('#srs-writing-submit').click();

    // Verify second request has different operationKey
    assert.equal(attemptRequests.length, 2);
    assert.notEqual(attemptRequests[0].operationKey, attemptRequests[1].operationKey);

    // Verify ambiguous failure keeps retry button and locks canvas
    await page.locator('#retryReviewBtn').waitFor({ state: 'visible' });

    // 3. Click retry -> exact replay of second request payload
    await page.locator('#retryReviewBtn').click();
    assert.equal(attemptRequests.length, 3);
    assert.equal(attemptRequests[2].operationKey, attemptRequests[1].operationKey, 'Retry must send exact same operationKey');
    assert.deepEqual(attemptRequests[2].candidateStrokes, attemptRequests[1].candidateStrokes, 'Retry must send exact same strokes');
    assert.equal(attemptRequests[2].characterNumber, attemptRequests[1].characterNumber);

    // The POST replay can return an old prompt, so the UI follows it with a session refresh.
    await page.locator('#srsDoneBox').waitFor();
    assert.equal(sessionRefreshes, 1);
  });
});

test('S6-10.2d ReviewView: rollout disable on submission refreshes session and advances without infinite retry loop', async () => {
  const sessionId = randomUUID();
  const cardId = randomUUID();
  let refreshCalled = false;

  await withLearner(async page => {
    await page.route('**/api/srs/sessions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'ACTIVE',
            progress: { currentIndex: 0, completedCount: 0, total: 1 },
            currentItem: {
              cardId,
              skill: 'WRITING',
              meaningLabels: { vi: 'vô hiệu hóa' },
              writing: { characterNumber: 1, characterCount: 1, strokeCount: 1, attemptedCharacters: 0, revealedCharacters: null },
            },
          },
        }),
      });
    });

    await page.route('**/api/srs/sessions/*/writing-attempts', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Phiên luyện viết không tồn tại.' } }),
      });
    });

    await page.route(`**/api/srs/sessions/${sessionId}`, async route => {
      refreshCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            status: 'COMPLETED',
            progress: { currentIndex: 1, completedCount: 0, total: 1 },
            currentItem: null,
          },
        }),
      });
    });

    await page.goto(`${origin}/review`);
    await page.locator('#startReviewBtn').click();
    await page.locator('#srs-writing-canvas').waitFor();

    const canvas = page.locator('#srs-writing-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
    await page.mouse.up();
    await page.locator('#srs-writing-submit').click();

    // Client must refresh via GET and show completed box without retry loop
    await page.locator('#srsDoneBox').waitFor();
    assert.equal(refreshCalled, true);
  });
});

test('EXT-01: ReviewView reveals Japanese reading and romanization without leaking before reveal', async () => {
  const prevLangCode = server.fixture.contexts[0].language.code;
  const ctxLangId = server.fixture.contexts[0].languageId;
  server.fixture.contexts[0].language.code = 'ja';
  const cardId = randomUUID();
  server.fixture.vocabularyConcepts.push({
    id: 'vocab-ja-review-1',
    languageId: ctxLangId,
    canonicalForm: '学生',
    senseKey: 'default',
    phonetic: null,
    reading: 'がくせい',
    romanization: 'gakusei',
    partOfSpeech: 'noun',
    meaningLabels: { vi: 'học sinh' },
    example: 'わたしは学生です。',
  });
  server.fixture.srsCards = [
    {
      id: cardId,
      learnerId: server.fixture.account.id,
      vocabularyId: 'vocab-ja-review-1',
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

  try {
    await withLearner(async (page) => {
      await page.goto(`${origin}/review`);
      await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
      await page.locator('#startReviewBtn').click();
      await page.locator('#srsReviewCard').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.srs-canonical-form').textContent(), '学生');
      assert.equal(await page.locator('.srs-phonetic').count(), 0);

      await page.locator('#revealAnswerBtn').click();
      await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });
      const readingText = await page.locator('.srs-phonetic').textContent();
      assert.match(readingText, /がくせい/);
      assert.match(readingText, /\(gakusei\)/);
      assert.equal(await page.locator('.srs-phonetic').getAttribute('lang'), 'ja');
    });
  } finally {
    server.fixture.contexts[0].language.code = prevLangCode;
  }
});
