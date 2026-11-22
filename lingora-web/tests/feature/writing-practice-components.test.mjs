import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './harness/isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3039;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('S6-07: Writing Practice UI (Màn luyện viết)', () => {
  let server;
  let browser;

  before(async () => {
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

  // Helper to open writing practice modal on isolated harness
  async function openPracticePage(options = {}) {
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1280, height: 800 },
      hasTouch: Boolean(options.hasTouch),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);

    // Setup default API intercepts for writing sessions & attempts
    let lastOperationKey = null;
    let attemptSubmissionCount = 0;
    let sessionCreationCount = 0;
    let completionCount = 0;
    let releaseCompletion;
    let completionCommitted = false;
    const completionGate = options.deferCompletion
      ? new Promise((resolve) => { releaseCompletion = resolve; })
      : null;
    const sessionRequestIds = [];

    await page.route('**/api/writing/sessions', async (route) => {
      if (route.request().method() === 'POST') {
        sessionCreationCount++;
        const sessionRequest = JSON.parse(route.request().postData() || '{}');
        sessionRequestIds.push(sessionRequest.requestId);
        if (options.simulateSessionStartError && sessionCreationCount === 1) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Tạm gián đoạn.' } }),
          });
          return;
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              sessionId: 'sess-1234-5678-9abc',
              characterId: 'char-1',
              status: 'ACTIVE',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/writing/sessions/*/attempts', async (route) => {
      if (route.request().method() === 'POST') {
        attemptSubmissionCount++;
        const postData = JSON.parse(route.request().postData() || '{}');
        lastOperationKey = postData.operationKey;

        if (options.simulateInvalidStrokeGeometry && attemptSubmissionCount === 1) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { code: 'INVALID_STROKE_GEOMETRY', message: 'Nét đứng yên không được chấp nhận.' },
            }),
          });
          return;
        }

        if (options.simulateNetworkError && attemptSubmissionCount === 1) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Kết nối máy chủ bị gián đoạn. Vui lòng thử lại.',
              },
            }),
          });
          return;
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              attemptId: 'att-1111',
              sessionId: 'sess-1234-5678-9abc',
              characterId: 'char-1',
              operationKey: postData.operationKey,
              score: 88,
              band: 'EXCELLENT',
              passed: true,
              strokeCount: postData.candidateStrokes?.length || 4,
              details: {
                shapeScore: 90,
                directionScore: 85,
                orderScore: 90,
                strokeCountScore: 100,
                strokeCount: { expected: 4, actual: 4, diff: 0 },
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/writing/sessions/*/complete', async (route) => {
      if (route.request().method() === 'POST') {
        completionCount++;
        if (completionGate) await completionGate;
        if ((options.simulateCompletionError || options.simulateLostCompletionResponse) && completionCount === 1) {
          completionCommitted = Boolean(options.simulateLostCompletionResponse);
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Chưa thể hoàn thành.' } }),
          });
          return;
        }
        completionCommitted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              sessionId: 'sess-1234-5678-9abc',
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${TEST_URL}?state=${options.state || 'writing-practice'}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#writingPracticeModal', { state: 'visible' });

    return {
      context,
      page,
      getLastOperationKey: () => lastOperationKey,
      getAttemptSubmissionCount: () => attemptSubmissionCount,
      getSessionRequestIds: () => [...sessionRequestIds],
      getCompletionCount: () => completionCount,
      isCompletionCommitted: () => completionCommitted,
      releaseCompletion: () => releaseCompletion?.(),
    };
  }

  // Draw a simulated stroke on a canvas
  async function drawStroke(page, canvasSelector, startPoint, endPoint) {
    const canvas = page.locator(canvasSelector);
    const box = await canvas.boundingBox();
    assert.ok(box, `Canvas ${canvasSelector} must have bounding box`);

    const startX = box.x + startPoint[0] * box.width;
    const startY = box.y + startPoint[1] * box.height;
    const endX = box.x + endPoint[0] * box.width;
    const endY = box.y + endPoint[1] * box.height;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move((startX + endX) / 2, (startY + endY) / 2);
    await page.mouse.move(endX, endY);
    await page.mouse.up();
  }

  test('1. Modal Mounting & DEMO stage: Displays glyph, details, step counter, and auto-play controls', async () => {
    const { context, page } = await openPracticePage();
    try {
      // Dialog semantics & title
      const modal = page.locator('#writingPracticeModal');
      await modal.waitFor({ state: 'visible' });
      assert.equal(await modal.getAttribute('role'), 'dialog');
      assert.equal(await modal.getAttribute('aria-modal'), 'true');

      // Title & glyph
      const title = await page.locator('#writing-practice-title').textContent();
      assert.match(title, /Luyện viết/);
      const glyph = await page.locator('header span').first().textContent();
      assert.equal(glyph?.trim(), '日');

      // DEMO tab is active
      const tabDemo = page.locator('#tab-demo');
      assert.match(await tabDemo.textContent(), /1\. Xem mẫu/);

      // Step counter exists
      const stepCounter = page.locator('#demo-step-counter');
      await stepCounter.waitFor({ state: 'visible' });
      assert.match(await stepCounter.textContent(), /Nét \d+ \/ 4/);

      // Controls exist
      await page.locator('#demo-play-pause-btn').waitFor({ state: 'visible' });
      await page.locator('#demo-replay-btn').waitFor({ state: 'visible' });
      await page.locator('#demo-prev-btn').waitFor({ state: 'visible' });
      await page.locator('#demo-next-btn').waitFor({ state: 'visible' });
      await page.locator('#demo-to-trace-btn').waitFor({ state: 'visible' });
    } finally {
      await context.close();
    }
  });

  test('1a. Animation-only character opens the demo without exposing writing stages', async () => {
    const { context, page, getSessionRequestIds } = await openPracticePage({ state: 'writing-practice-animation-only' });
    try {
      await page.locator('#stroke-order-svg').waitFor({ state: 'visible' });
      await page.locator('#demo-play-pause-btn').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#tab-demo').count(), 1);
      assert.equal(await page.locator('#tab-trace').count(), 0);
      assert.equal(await page.locator('#tab-freehand').count(), 0);
      assert.equal(await page.locator('#demo-to-trace-btn').count(), 0);
      assert.equal(getSessionRequestIds().length, 0, 'Viewing stroke animation must not start a graded session');
    } finally {
      await context.close();
    }
  });

  test('1b. Guided-writing-only character starts on tracing with animation controls hidden', async () => {
    const { context, page } = await openPracticePage({ state: 'writing-practice-guided-only' });
    try {
      await page.locator('#trace-canvas').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#tab-demo').count(), 0);
      assert.equal(await page.locator('#stroke-order-svg').count(), 0);
      assert.equal(await page.locator('#demo-play-pause-btn').count(), 0);
      await page.locator('#trace-to-freehand-btn').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });
    } finally {
      await context.close();
    }
  });

  test('2. DEMO stage animation: Play/Pause toggles, Replay resets, step forward/backward updates counter', async () => {
    const { context, page } = await openPracticePage();
    try {
      const playPauseBtn = page.locator('#demo-play-pause-btn');

      // Click pause
      await playPauseBtn.click();
      assert.equal(await playPauseBtn.textContent(), 'Tiếp tục');

      // Step next button increments step
      const nextBtn = page.locator('#demo-next-btn');
      await nextBtn.click();
      let text = await page.locator('#demo-step-counter').textContent();
      assert.match(text, /Nét 2 \/ 4/);

      // Step prev button decrements step
      const prevBtn = page.locator('#demo-prev-btn');
      await prevBtn.click();
      text = await page.locator('#demo-step-counter').textContent();
      assert.match(text, /Nét 1 \/ 4/);

      // Replay button resets to step 1
      await nextBtn.click();
      await nextBtn.click();
      const replayBtn = page.locator('#demo-replay-btn');
      await replayBtn.click();
      text = await page.locator('#demo-step-counter').textContent();
      assert.match(text, /Nét 1 \/ 4/);
    } finally {
      await context.close();
    }
  });

  test('3. Keyboard navigation: Space toggles play/pause in DEMO, Escape closes modal', async () => {
    const { context, page } = await openPracticePage();
    try {
      const playPauseBtn = page.locator('#demo-play-pause-btn');
      assert.equal(await playPauseBtn.textContent(), 'Dừng');
      assert.equal(await page.locator('#closePracticeModalBtn').evaluate((el) => document.activeElement === el), true);
      assert.equal(await page.locator('#stroke-order-svg').getAttribute('viewBox'), '0 0 1 1');

      // Modal opens with focus on the close control. The global shortcut must not steal its key.
      assert.equal(await page.locator('#closePracticeModalBtn').evaluate((el) => document.activeElement === el), true);
      await page.evaluate(() => document.activeElement?.blur());

      // Press Space to pause while focus is outside an interactive control.
      await page.keyboard.press(' ');
      assert.equal(await playPauseBtn.textContent(), 'Tiếp tục');

      // Press Space to resume
      await page.keyboard.press(' ');
      assert.equal(await playPauseBtn.textContent(), 'Dừng');
    } finally {
      await context.close();
    }
  });

  test('4. TRACE stage: Displays ghost template in background and updates stroke progress on drawing', async () => {
    const { context, page } = await openPracticePage();
    try {
      // Advance to TRACE stage
      await page.locator('#demo-to-trace-btn').click();
      await page.locator('#tab-trace').waitFor({ state: 'visible' });

      // Verify ghost template is present in DOM
      const ghostTemplate = page.locator('#trace-ghost-template');
      await ghostTemplate.waitFor({ state: 'visible' });

      // Verify canvas has touch-action: none
      const traceCanvas = page.locator('#trace-canvas');
      await traceCanvas.waitFor({ state: 'visible' });
      const touchAction = await traceCanvas.evaluate((el) => el.style.touchAction);
      assert.equal(touchAction, 'none', 'Canvas must enforce touch-action: none');

      // Initial progress: 0 / 4
      const progressLabel = page.locator('#trace-stroke-progress');
      assert.match(await progressLabel.textContent(), /Nét hiện tại: 0 \/ 4/);

      // Draw first stroke: left vertical (0.2, 0.2) to (0.2, 0.8)
      await drawStroke(page, '#trace-canvas', [0.2, 0.2], [0.2, 0.8]);

      // Progress updates to 1 / 4
      await page.waitForFunction(
        () => document.querySelector('#trace-stroke-progress')?.textContent?.includes('1 / 4')
      );
      assert.match(await progressLabel.textContent(), /Nét hiện tại: 1 \/ 4/);
    } finally {
      await context.close();
    }
  });

  test('5. TRACE stage controls: Undo removes last stroke, Reset clears all strokes', async () => {
    const { context, page } = await openPracticePage();
    try {
      await page.locator('#tab-trace').click();
      await page.locator('#trace-canvas').waitFor({ state: 'visible' });

      // Draw 2 strokes
      await drawStroke(page, '#trace-canvas', [0.2, 0.2], [0.2, 0.8]);
      await drawStroke(page, '#trace-canvas', [0.2, 0.2], [0.8, 0.2]);

      const progressLabel = page.locator('#trace-stroke-progress');
      await page.waitForFunction(
        () => document.querySelector('#trace-stroke-progress')?.textContent?.includes('2 / 4')
      );

      // Undo removes 1 stroke -> 1 / 4
      await page.locator('#trace-undo-btn').click();
      await page.waitForFunction(
        () => document.querySelector('#trace-stroke-progress')?.textContent?.includes('1 / 4')
      );
      assert.match(await progressLabel.textContent(), /Nét hiện tại: 1 \/ 4/);

      // Reset clears all strokes -> 0 / 4
      await page.locator('#trace-reset-btn').click();
      await page.waitForFunction(
        () => document.querySelector('#trace-stroke-progress')?.textContent?.includes('0 / 4')
      );
      assert.match(await progressLabel.textContent(), /Nét hiện tại: 0 \/ 4/);
    } finally {
      await context.close();
    }
  });

  test('6. FREEHAND stage: Strictly verifies NO ghost template is rendered in background', async () => {
    const { context, page } = await openPracticePage();
    try {
      // Advance to FREEHAND stage
      await page.locator('#tab-freehand').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });

      // CRITICAL SPEC REQUIREMENT: "màn tự viết không hiển thị mẫu mờ"
      const ghostTemplate = page.locator('#trace-ghost-template');
      const count = await ghostTemplate.count();
      assert.equal(count, 0, 'Freehand stage MUST NOT render ghost template in background');

      // Verify stroke counter starts at 0
      const strokeCount = page.locator('#freehand-stroke-count');
      assert.match(await strokeCount.textContent(), /Đã viết: 0 nét/);

      // Submit button is disabled when empty
      const submitBtn = page.locator('#freehand-submit-btn');
      assert.equal(await submitBtn.isDisabled(), true);
    } finally {
      await context.close();
    }
  });

  test('7. FREEHAND stage controls: Pointer drawing tracks strokes, Ctrl+Z / Undo works', async () => {
    const { context, page } = await openPracticePage();
    try {
      await page.locator('#tab-freehand').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });

      // Draw stroke 1
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      const strokeCount = page.locator('#freehand-stroke-count');
      await page.waitForFunction(
        () => document.querySelector('#freehand-stroke-count')?.textContent?.includes('1 nét')
      );
      assert.match(await strokeCount.textContent(), /Đã viết: 1 nét/);

      // Draw stroke 2
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.8, 0.2]);
      await page.waitForFunction(
        () => document.querySelector('#freehand-stroke-count')?.textContent?.includes('2 nét')
      );
      assert.match(await strokeCount.textContent(), /Đã viết: 2 nét/);

      // Keyboard shortcut Ctrl+Z triggers undo
      await page.keyboard.press('Control+z');
      await page.waitForFunction(
        () => document.querySelector('#freehand-stroke-count')?.textContent?.includes('1 nét')
      );
      assert.match(await strokeCount.textContent(), /Đã viết: 1 nét/);

      // Undo button triggers undo
      await page.locator('#freehand-undo-btn').click();
      await page.waitForFunction(
        () => document.querySelector('#freehand-stroke-count')?.textContent?.includes('0 nét')
      );
      assert.match(await strokeCount.textContent(), /Đã viết: 0 nét/);
    } finally {
      await context.close();
    }
  });

  test('8. Submit attempt: Evaluates strokes, transitions to RESULT stage, displays score, band badge, and comparison canvas', async () => {
    const { context, page } = await openPracticePage();
    try {
      await page.locator('#tab-freehand').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });

      // Draw 4 strokes for Kanji 日
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.8, 0.2]);
      await drawStroke(page, '#freehand-canvas', [0.2, 0.5], [0.8, 0.5]);
      await drawStroke(page, '#freehand-canvas', [0.2, 0.8], [0.8, 0.8]);

      // Submit attempt
      const submitBtn = page.locator('#freehand-submit-btn');
      assert.equal(await submitBtn.isDisabled(), false);
      await submitBtn.click();

      // Automatically transitions to RESULT stage
      await page.locator('#tab-result').waitFor({ state: 'visible' });
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      // Score and Band badge
      const scoreText = await page.locator('#attempt-score').textContent();
      assert.match(scoreText, /88 \/ 100/);

      const bandBadge = page.locator('#attempt-band-badge');
      assert.equal(await bandBadge.textContent(), 'Đạt');

      // Comparison canvas & legend
      const comparisonCanvas = page.locator('#comparison-canvas');
      await comparisonCanvas.waitFor({ state: 'visible' });
      const amberTemplatePixels = await comparisonCanvas.evaluate((canvas) => {
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] > 0 && pixels[i] > 200 && pixels[i + 1] > 120 && pixels[i + 2] < 120) count++;
        }
        return count;
      });
      assert.ok(amberTemplatePixels > 0, 'Comparison canvas must draw the pinned template in amber, distinct from the blue learner stroke');

      const legendBlue = page.getByText('Nét bạn vẽ');
      await legendBlue.waitFor({ state: 'visible' });
      const legendGreen = page.getByText('Mẫu chuẩn');
      await legendGreen.waitFor({ state: 'visible' });
    } finally {
      await context.close();
    }
  });

  test('9. Network Resilience: On submit error, preserves drawn strokes and enables retry with SAME operationKey', async () => {
    const { context, page, getLastOperationKey } = await openPracticePage({
      simulateNetworkError: true,
    });
    try {
      await page.locator('#tab-freehand').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });

      // Draw 2 strokes
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.8, 0.2]);

      // Click submit -> fails with simulated 503
      await page.locator('#freehand-submit-btn').click();

      // Error alert is displayed
      const errorAlert = page.locator('#submit-error-alert');
      await errorAlert.waitFor({ state: 'visible' });
      assert.match(await errorAlert.textContent(), /gián đoạn/);

      // CRITICAL SPEC REQUIREMENT: User strokes MUST BE PRESERVED on error!
      const strokeCount = page.locator('#freehand-stroke-count');
      assert.match(await strokeCount.textContent(), /Đã viết: 2 nét/);

      const firstOpKey = getLastOperationKey();
      assert.ok(firstOpKey, 'Operation key must have been generated and sent');

      // Retry button is shown with same operation key
      const retrySubmitBtn = page.locator('#retry-submit-btn');
      await retrySubmitBtn.waitFor({ state: 'visible' });
      assert.match(await retrySubmitBtn.textContent(), /cùng mã yêu cầu/);

      // Click retry -> succeeds (simulateNetworkError is only on attempt 1)
      await retrySubmitBtn.click();

      // Transitions to RESULT stage
      await page.locator('#attempt-score').waitFor({ state: 'visible' });
      const secondOpKey = getLastOperationKey();
      assert.equal(secondOpKey, firstOpKey, 'Retry submit MUST retain the exact same operationKey');
    } finally {
      await context.close();
    }
  });

  test('9b. Invalid geometry unlocks correction and resubmits edited strokes with a new operationKey', async () => {
    const { context, page, getLastOperationKey, getAttemptSubmissionCount } = await openPracticePage({
      simulateInvalidStrokeGeometry: true,
    });
    try {
      await page.locator('#tab-freehand').click();
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#submit-error-alert').waitFor({ state: 'visible' });
      assert.match(await page.locator('#submit-error-alert').textContent(), /đứng yên/);

      const firstOperationKey = getLastOperationKey();
      assert.equal(await page.locator('#freehand-undo-btn').isDisabled(), false);
      assert.equal(await page.locator('#freehand-reset-btn').isDisabled(), false);
      assert.equal(await page.locator('#retry-submit-btn').isDisabled(), true);

      const canvas = page.locator('#freehand-canvas');
      const box = await canvas.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.up();
      assert.equal(getAttemptSubmissionCount(), 1, 'A tap without a committed stroke must not unlock the rejected payload');
      assert.equal(await page.locator('#retry-submit-btn').isDisabled(), true);
      assert.equal(getLastOperationKey(), firstOperationKey);

      await page.locator('.writing-modal-card').focus();
      await page.keyboard.press('Enter');
      assert.equal(getAttemptSubmissionCount(), 1, 'Keyboard submit must not resend rejected geometry unchanged');

      await page.locator('#freehand-undo-btn').click();
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      assert.equal(getAttemptSubmissionCount(), 2);
      assert.notEqual(getLastOperationKey(), firstOperationKey);
    } finally {
      await context.close();
    }
  });

  test('9a. Session creation retry reuses one stable requestId', async () => {
    const { context, page, getSessionRequestIds } = await openPracticePage({ simulateSessionStartError: true });
    try {
      await page.locator('#tab-freehand').click();
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#submit-error-alert').waitFor({ state: 'visible' });
      assert.match(await page.locator('#submit-error-alert').textContent(), /gián đoạn/);

      await page.locator('#retry-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });
      const requestIds = getSessionRequestIds();
      assert.equal(requestIds.length, 2);
      assert.ok(requestIds[0]);
      assert.equal(requestIds[1], requestIds[0]);
    } finally {
      await context.close();
    }
  });

  test('10. Session completion & retry: Complete calls API and shows completion notice; Retry resets with new operationKey', async () => {
    const { context, page, getLastOperationKey, getSessionRequestIds } = await openPracticePage();
    try {
      await page.locator('#tab-freehand').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });

      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      const opKey1 = getLastOperationKey();

      // Click complete session button
      const completeBtn = page.locator('#complete-session-btn');
      await completeBtn.click();

      // Completion notice appears
      const notice = page.locator('#session-completed-notice');
      await notice.waitFor({ state: 'visible' });
      assert.match(await notice.textContent(), /Đã hoàn thành/);

      // Click "Viết lại" -> resets canvas and generates a new operationKey
      const retryPracticeBtn = page.locator('#retry-practice-btn');
      await retryPracticeBtn.click();

      // Returns to freehand stage
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });
      const strokeCount = page.locator('#freehand-stroke-count');
      assert.match(await strokeCount.textContent(), /Đã viết: 0 nét/);

      // Submit a second attempt
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      const opKey2 = getLastOperationKey();
      assert.notEqual(opKey2, opKey1, 'Active re-practice MUST generate a new operationKey');
      const requestIds = getSessionRequestIds();
      assert.equal(requestIds.length, 2, 'A completed session must start a fresh session before writing again');
      assert.notEqual(requestIds[1], requestIds[0]);
    } finally {
      await context.close();
    }
  });

  test('10a. Lost completion response stays locked until idempotent completion retry succeeds', async () => {
    const { context, page, getCompletionCount, isCompletionCommitted, getSessionRequestIds } = await openPracticePage({
      simulateLostCompletionResponse: true,
    });
    try {
      await page.locator('#tab-freehand').click();
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      const completeButton = page.locator('#complete-session-btn');
      await completeButton.click();
      await page.getByRole('alert').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#session-completed-notice').count(), 0);
      assert.equal(await completeButton.isDisabled(), false);
      assert.equal(isCompletionCommitted(), true, 'The first response is lost after the server committed completion');
      assert.equal(await page.locator('#retry-practice-btn').isDisabled(), true);

      await completeButton.click();
      await page.locator('#session-completed-notice').waitFor({ state: 'visible' });
      assert.equal(getCompletionCount(), 2);
      assert.equal(await page.locator('#retry-practice-btn').isDisabled(), false);

      await page.locator('#retry-practice-btn').click();
      await page.locator('#freehand-canvas').waitFor({ state: 'visible' });
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });
      const requestIds = getSessionRequestIds();
      assert.equal(requestIds.length, 2);
      assert.notEqual(requestIds[1], requestIds[0]);
    } finally {
      await context.close();
    }
  });

  test('10b. Rewrite is disabled while completion is pending, preventing a closed-session race', async () => {
    const { context, page, getCompletionCount, releaseCompletion } = await openPracticePage({ deferCompletion: true });
    try {
      await page.locator('#tab-freehand').click();
      await drawStroke(page, '#freehand-canvas', [0.2, 0.2], [0.2, 0.8]);
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });

      await page.locator('#complete-session-btn').click();
      await page.waitForFunction(() => document.querySelector('#complete-session-btn')?.textContent?.includes('Đang hoàn thành'));
      assert.equal(getCompletionCount(), 1);
      assert.equal(await page.locator('#retry-practice-btn').isDisabled(), true);

      releaseCompletion();
      await page.locator('#session-completed-notice').waitFor({ state: 'visible' });
    } finally {
      releaseCompletion();
      await context.close();
    }
  });

  test('11. Responsive Viewports: Renders cleanly and handles touch pointer drawing on 360px and 390px mobile viewports', async () => {
    for (const width of [360, 390]) {
      const { context, page } = await openPracticePage({
        viewport: { width, height: 740 },
        hasTouch: true,
      });
      try {
        const modal = page.locator('#writingPracticeModal');
        await modal.waitFor({ state: 'visible' });

        // Verify no horizontal document overflow
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        assert.equal(hasOverflow, false, `Viewport ${width}px must not trigger horizontal overflow`);

        // Switch to trace stage and verify canvas touch drawing
        await page.locator('#tab-trace').click();
        const canvas = page.locator('#trace-canvas');
        await canvas.waitFor({ state: 'visible' });

        // Dispatch a native touch drag across the canvas and verify pointer capture records a stroke.
        const box = await canvas.boundingBox();
        assert.ok(box);
        const touch = await context.newCDPSession(page);
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ id: 1, x: box.x + 45, y: box.y + 45, radiusX: 1, radiusY: 1, force: 1 }],
        });
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ id: 1, x: box.x + 100, y: box.y + 100, radiusX: 1, radiusY: 1, force: 1 }],
        });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(() => document.querySelector('#trace-stroke-progress')?.textContent?.includes('1 / 4'));
        await touch.detach();

        // Verify buttons are all accessible
        await page.locator('#trace-undo-btn').waitFor({ state: 'visible' });
        await page.locator('#trace-to-freehand-btn').waitFor({ state: 'visible' });
      } finally {
        await context.close();
      }
    }
  });

  test('12. ARIA Live region announces status updates for accessibility', async () => {
    const { context, page } = await openPracticePage();
    try {
      const liveRegion = page.locator('#practice-aria-live');
      await liveRegion.waitFor({ state: 'attached' });
      assert.equal(await liveRegion.getAttribute('aria-live'), 'polite');

      // Initial announcement
      let text = await liveRegion.textContent();
      assert.match(text, /thứ tự nét/i);

      // Switch to trace
      await page.locator('#tab-trace').click();
      await page.waitForFunction(
        () => document.querySelector('#practice-aria-live')?.textContent?.includes('đồ nét')
      );
      text = await liveRegion.textContent();
      assert.match(text, /đồ nét/i);

      // Switch to freehand
      await page.locator('#tab-freehand').click();
      await page.waitForFunction(
        () => document.querySelector('#practice-aria-live')?.textContent?.includes('tự viết')
      );
      text = await liveRegion.textContent();
      assert.match(text, /tự viết/i);
    } finally {
      await context.close();
    }
  });
});
