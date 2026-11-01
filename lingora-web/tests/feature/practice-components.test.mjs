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
  revision1Id,
} from './harness/learner-fixture.mjs';

const origin = 'http://127.0.0.1:3049';
let server, browser;

before(async () => {
  server = await startIsolatedServer(3049);
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
    commandReceipts: [],
    expired: false,
    dbFailure: false,
    contextFailure: false,
    attemptFailure: false,
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

test('Practice UI: Start attempt -> submit responses across 5 exercise types -> finalize -> view score -> redo', async () => {
  await withLearner(async (page) => {
    // 1. Navigate to lesson player page
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#lessonPlayerView').waitFor({ state: 'visible' });

    // 2. Initial state: start practice button is visible
    const startPracticeBtn = page.locator('#startPracticeBtn');
    await startPracticeBtn.waitFor({ state: 'visible' });

    // Intercept POST /attempts
    let attemptStarted = false;
    page.on('request', (req) => {
      if (req.url().includes('/attempts') && !req.url().includes('/responses') && !req.url().includes('/finalize') && req.method() === 'POST') {
        attemptStarted = true;
      }
    });

    // Click "Bắt đầu luyện tập"
    await startPracticeBtn.click();
    await page.locator('#activePracticeBox').waitFor({ state: 'visible' });
    assert.equal(attemptStarted, true, 'POST /attempts must be called on click');

    // Exercise 1: MCQ (ex-mcq-1)
    await page.locator('#activeExerciseCard').waitFor({ state: 'visible' });
    const queueCounter = await page.locator('#queueProgressLabel').textContent();
    assert.match(queueCounter, /1/);

    // Empty validation check: click submit without selecting option
    const submitBtn = page.locator('#submitResponseBtn');
    await submitBtn.click();
    const validationError = await page.locator('#practiceActionAlert').textContent();
    assert.match(validationError, /Vui lòng chọn một đáp án/);

    // Select option 1 (opt-1: "Hello")
    await page.locator('#activeExerciseCard input[value="opt-1"]').click();
    assert.equal(await page.locator('#activeExerciseCard input[value="opt-1"]').isChecked(), true);

    // Submit answer
    await submitBtn.click();

    // Verify formative feedback is shown
    await page.locator('#formativeFeedback').waitFor({ state: 'visible' });
    const fbText1 = await page.locator('#formativeFeedback').textContent();
    assert.match(fbText1, /Chính xác/);

    // Exercise 2: FILL_BLANK (ex-fill-2: "Nice to ____ you.")
    await page.locator('#fillBlankInput').waitFor({ state: 'visible' });
    // Empty validation check
    await submitBtn.click();
    const fillError = await page.locator('#practiceActionAlert').textContent();
    assert.match(fillError, /Vui lòng nhập câu trả lời/);

    // Enter answer
    await page.locator('#fillBlankInput').fill('meet');
    await submitBtn.click();

    // Exercise 3: REORDER (ex-reorder-3)
    await page.locator('#tokenBtn-t-1').waitFor({ state: 'visible' });
    // Click tokens in correct order: t-1 ("How"), t-2 ("are"), t-3 ("you?")
    await page.locator('#tokenBtn-t-1').click();
    await page.locator('#tokenBtn-t-2').click();
    await page.locator('#tokenBtn-t-3').click();

    // Verify tokens were placed into selected area
    assert.equal(await page.locator('#selectedToken-0').isVisible(), true);
    await submitBtn.click();

    // Exercise 4: LISTENING (ex-listen-4)
    await page.locator('#activeExerciseCard input[value="opt-l1"]').waitFor({ state: 'visible' });
    await page.locator('#activeExerciseCard input[value="opt-l1"]').click();
    await submitBtn.click();

    // Exercise 5: GRAMMAR (ex-grammar-5)
    await page.locator('#grammarInput').waitFor({ state: 'visible' });
    await page.locator('#grammarInput').fill('Subject + To Be + Noun');
    await submitBtn.click();

    // All exercises completed: Finalize prompt box appears
    await page.locator('#finalizePromptBox').waitFor({ state: 'visible' });
    const finalizeBtn = page.locator('#finalizePracticeBtn');
    await finalizeBtn.waitFor({ state: 'visible' });

    // Finalize practice attempt
    await finalizeBtn.click();

    // Verification: Completion summary rendered with score
    await page.locator('#practiceCompletionSummary').waitFor({ state: 'visible' });
    const scoreText = await page.locator('#practiceCompletionScore').textContent();
    assert.match(scoreText, /10 \/ 10 \(100%\)/);

    // Verification: Redo practice button is present
    const redoBtn = page.locator('#redoPracticeBtn');
    await redoBtn.waitFor({ state: 'visible' });
    await redoBtn.click();

    // Re-starts fresh attempt
    await page.locator('#activePracticeBox').waitFor({ state: 'visible' });
    const redoQueue = await page.locator('#queueProgressLabel').textContent();
    assert.match(redoQueue, /1/);
  });
});

test('Practice UI: Audio error handling displays graceful non-crashing alert', async () => {
  await withLearner(async (page) => {
    // Navigate to lesson player
    await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
    await page.locator('#lessonPlayerView').waitFor({ state: 'visible' });

    // Start practice
    await page.locator('#startPracticeBtn').click();
    await page.locator('#activePracticeBox').waitFor({ state: 'visible' });

    // Step 1: MCQ
    await page.locator('#activeExerciseCard input[value="opt-1"]').click();
    await page.locator('#submitResponseBtn').click();

    // Step 2: FILL_BLANK
    await page.locator('#fillBlankInput').waitFor({ state: 'visible' });
    await page.locator('#fillBlankInput').fill('meet');
    await page.locator('#submitResponseBtn').click();

    // Step 3: REORDER
    await page.locator('#tokenBtn-t-1').waitFor({ state: 'visible' });
    await page.locator('#tokenBtn-t-1').click();
    await page.locator('#tokenBtn-t-2').click();
    await page.locator('#tokenBtn-t-3').click();
    await page.locator('#submitResponseBtn').click();

    // Step 4: LISTENING - simulate audio load error
    await page.locator('audio').waitFor({ state: 'visible' });
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) audio.dispatchEvent(new Event('error'));
    });

    // Alert appears cleanly
    await page.locator('.audio-error-box').waitFor({ state: 'visible' });
    const alertMsg = await page.locator('.audio-error-box').textContent();
    assert.match(alertMsg, /Không thể tải âm thanh/);

    // Audio error does NOT prevent learner from selecting option and continuing
    await page.locator('#activeExerciseCard input[value="opt-l1"]').click();
    assert.equal(await page.locator('#activeExerciseCard input[value="opt-l1"]').isChecked(), true);
  });
});

test('production callbacks retry the exact start, response and finalize after transport loss following commit',async()=>{
 server.fixture.exercises=exercisesRows().slice(0,1);
 await withLearner(async page=>{
  await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
  async function loseCommitted(suffix,button){
   const captured=[];const listener=r=>{if(new URL(r.url()).pathname.endsWith(suffix)&&r.method()==='POST')captured.push(r.postDataJSON());};page.on('request',listener);
   await page.route(`**${suffix}`,async route=>{await route.fetch();await route.abort('failed');},{times:1});
   await page.locator(button).click();await page.locator('#practiceActionAlert').waitFor();
   const retry=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith(suffix)&&r.status()===200);
   await page.locator(button).click();await retry;
   page.off('request',listener);assert.equal(captured.length,2);assert.deepEqual(captured[0],captured[1]);
  }
  await loseCommitted('/attempts','#startPracticeBtn');await page.locator('#activeExerciseCard').waitFor();assert.equal(server.fixture.attempts.length,1);
  await page.locator('#activeExerciseCard input[value="opt-2"]').check();
  await loseCommitted('/responses','#submitResponseBtn');
  assert.equal(server.fixture.responses.length,1,'replay must not silently consume the same-exercise required retry');
  assert.equal(server.fixture.responses[0].responseOrdinal,1);assert.match(await page.locator('#queueProgressLabel').textContent(),/Làm lại/);
  await page.locator('#activeExerciseCard input[value="opt-1"]').check();await page.locator('#submitResponseBtn').click();await page.locator('#finalizePracticeBtn').waitFor();
  await loseCommitted('/finalize','#finalizePracticeBtn');await page.locator('#practiceCompletionSummary').waitFor();
  assert.equal(server.fixture.responses.length,2);assert.equal(server.fixture.completions.length,1);assert.equal(server.fixture.commandReceipts.length,1);assert.match(await page.locator('#practiceCompletionScore').textContent(),/1 \/ 4 \(25%\)/);
 });
});

test('actual stale409 and preserved React refresh recover from X to a separately pinned Y',async()=>{
 await withLearner(async page=>{
  await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);await page.locator('#startPracticeBtn').click();await page.locator('#activeExerciseCard').waitFor();
  const old=server.fixture.attempts[0].id;const Y='dddddddd-dddd-4ddd-8ddd-dddddddddddd';const lesson=server.fixture.lessons[0];
  lesson.activeRevisionId=Y;lesson.activeRevision={...lesson.activeRevision,id:Y,title:{vi:'Published Y'},lessonId:lesson1Id};
  server.fixture.exercises.push(...exercisesRows().map((ex,i)=>{const ir=`ir-y-${i}`;return{...ex,id:`ex-y-${i}`,lessonRevisionId:Y,itemRevisionId:ir,itemRevision:{...ex.itemRevision,id:ir}};}));
  await page.locator('#activeExerciseCard input[value="opt-1"]').check();await page.locator('#submitResponseBtn').click();await page.locator('#reloadPracticeBtn').waitFor();
  assert.equal(server.fixture.responses.length,0);assert.equal(server.fixture.attempts[0].completedAt,null);
  await page.evaluate(()=>window.__slice11_same_document=true);await page.locator('#reloadPracticeBtn').click();await page.locator('#startPracticeBtn').waitFor();
  assert.equal(await page.evaluate(()=>window.__slice11_same_document),true,'Next refresh preserves the document');
  await page.locator('#startPracticeBtn').click();await page.locator('#activeExerciseCard').waitFor();
  assert.equal(server.fixture.attempts.length,2);assert.notEqual(server.fixture.attempts[1].id,old);assert.equal(server.fixture.attempts[1].lessonRevisionId,Y);assert.equal(server.fixture.attempts[0].lessonRevisionId,revision1Id);
 });
});

test('attempt-only loading failure renders retryable error instead of a false unstarted Practice',async()=>{
 await withLearner(async page=>{
  server.fixture.attemptFailure=true;await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);await page.locator('#playerErrorBox').waitFor();
  assert.equal(await page.locator('#startPracticeBtn').count(),0);assert.equal(server.fixture.attempts.length,0);
  server.fixture.attemptFailure=false;await page.locator('#retryBtn').click();await page.locator('#startPracticeBtn').waitFor();
 });
});

test('real session loss and disabled errors stop mutations and offer recovery',async()=>{
 await withLearner(async page=>{
  const savedAttemptId='33333333-3333-4333-8333-333333333333';
  server.fixture.attempts.push({
   id:savedAttemptId,contextId,lessonId:lesson1Id,lessonRevisionId:revision1Id,
   nCore:5,startedAt:new Date(),completedAt:null,createdAt:new Date(),updatedAt:new Date(),rowVersion:1n
  });
  await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);await page.locator('#activeExerciseCard').waitFor();
  await page.locator('#activeExerciseCard input[value="opt-1"]').check();server.fixture.account.status='DISABLED';await page.locator('#submitResponseBtn').click();await page.locator('#practiceActionAlert').waitFor();
  assert.equal(server.fixture.responses.length,0);assert.equal(await page.locator('#submitResponseBtn').isDisabled(),true);
  server.fixture.account.status='ACTIVE';await page.locator('#reloadPracticeBtn').click();await page.locator('#activeExerciseCard').waitFor();
  await page.locator(`#practice-${savedAttemptId}-${server.fixture.exercises[0].id}-opt-1`).waitFor();
  await page.locator('#activeExerciseCard input[value="opt-1"]').check();await page.locator('#submitResponseBtn').click();
  await page.locator('#formativeFeedback').waitFor();assert.equal(server.fixture.responses.length,1);assert.equal(server.fixture.responses[0].attemptId,savedAttemptId);
  await page.locator('#fillBlankInput').waitFor();await page.locator('#fillBlankInput').fill('meet');
  server.fixture.expired=true;await page.locator('#submitResponseBtn').click();await page.getByRole('link',{name:'Đăng nhập lại'}).waitFor();assert.equal(server.fixture.responses.length,1);assert.equal(await page.locator('#submitResponseBtn').isDisabled(),true);
 });
});

test('mismatched successful DTO never becomes false UI success and exact command retry reconciles',async()=>{
 await withLearner(async page=>{
  await page.goto(`${origin}/learn/${contextId}/${lesson1Id}`);
  await page.route('**/attempts',async route=>{const res=await route.fetch();const body=await res.json();body.data.contextId='foreign-context';await route.fulfill({response:res,json:body});},{times:1});
  await page.locator('#startPracticeBtn').click();await page.locator('#practiceActionAlert').waitFor();assert.equal(await page.locator('#activeExerciseCard').count(),0);
  await page.locator('#startPracticeBtn').click();await page.locator('#activeExerciseCard').waitFor();assert.equal(server.fixture.attempts.length,1);
 });
});
