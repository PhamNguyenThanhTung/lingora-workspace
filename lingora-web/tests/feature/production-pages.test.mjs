import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startIsolatedServer } from './harness/isolated-server.mjs';
import { account, contextRow, fixtureEmail, fixturePassword, learnerId } from './harness/learner-fixture.mjs';
const origin='http://127.0.0.1:3028';
let server,browser;
before(async()=>{server=await startIsolatedServer(3028);browser=await chromium.launch({headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
beforeEach(()=>Object.assign(server.fixture,{account:account(),contexts:[contextRow()],expired:false,dbFailure:false,contextFailure:false}));
async function withLearner(run){
  const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(6000);
  try{
    await page.goto(`${origin}/home`);await page.waitForURL(`${origin}/login`);
    await page.locator('#loginEmail').fill(fixtureEmail);await page.locator('#loginPassword').fill(fixturePassword);
    await page.locator('#loginPassword').press('Enter');await page.waitForURL(`${origin}/home`);
    await page.getByText('Learner A',{exact:true}).waitFor();
    await run(page);
  }finally{await context.close();}
}
test('actual LoginPage/Form → real login route/session → actual HomePage/loader → UI; logout leaves no authenticated request',async()=>{
  await withLearner(async page=>{
    await page.getByText('Khóa học A',{exact:true}).waitFor();
    const response=await page.request.get(`${origin}/api/learner/context`);
    assert.equal(response.status(),200);assert.equal((await response.json()).data.learner.id,learnerId);
    await page.goto(`${origin}/login`);await page.waitForURL(`${origin}/home`);
    await page.locator('#logoutBtn').click();await page.waitForURL(`${origin}/login`);
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),401);
    await page.goto(`${origin}/home`);await page.waitForURL(`${origin}/login`);
    assert.equal(server.fixture.logoutScopes.at(-1),'local');
  });
});
test('actual HomePage preserves empty success and reacts to current role/status on same session',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts=[];await page.reload();await page.getByText('Bạn chưa có lộ trình học.',{exact:true}).waitFor();
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),200);
    for(const change of [{status:'DISABLED'},{status:'ACTIVE',role:'TEACHER'},{role:'ADMIN'}]){
      Object.assign(server.fixture.account,change);await page.reload();await page.getByText('Truy cập bị từ chối',{exact:true}).waitFor();
      assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),403);
      assert.ok(await page.locator('#logoutBtn').isEnabled());assert.equal(new URL(page.url()).pathname,'/home');
    }
  });
});
test('actual HomePage context503 → actual retry callback → loader and visible successful context',async()=>{
  await withLearner(async page=>{
    server.fixture.contextFailure=true;await page.reload();await page.locator('#retryBtn').waitFor();
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),503);
    server.fixture.contextFailure=false;await page.locator('#retryBtn').click();await page.getByText('Khóa học A',{exact:true}).waitFor();
    assert.equal(await page.locator('#errorBox').count(),0);
  });
});
test('actual HomePage inconsistent409 → actual retry returns owned data; invalid session redirects401',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts[0].course.framework.id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';await page.reload();await page.getByText('Dữ liệu không nhất quán',{exact:true}).waitFor();
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),409);
    server.fixture.contexts=[contextRow()];await page.locator('#retryBtn').click();await page.getByText('Khóa học A',{exact:true}).waitFor();
    server.fixture.expired=true;await page.reload();await page.waitForURL(`${origin}/login`);
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),401);
  });
});
test('actual logout transport failure retains home, shows failure, and real retry logs out',async()=>{
  await withLearner(async page=>{
    await page.route('**/api/auth/logout',route=>route.abort());
    await page.locator('#logoutBtn').click();await page.locator('#logoutAlert').waitFor();
    assert.equal(new URL(page.url()).pathname,'/home');assert.ok(await page.locator('#logoutBtn').isEnabled());
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),200);
    await page.unroute('**/api/auth/logout');await page.locator('#logoutBtn').click();await page.waitForURL(`${origin}/login`);
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),401);
  });
});
test('actual HomePage create context (DEFAULT) → card v1 → enter first lesson and Practice',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts=[];
    await page.reload();
    await page.getByText('Bạn chưa có lộ trình học.',{exact:true}).waitFor();
    await page.locator('#createContextForm').waitFor();
    await page.locator('#submitCreateContextBtn').click();
    await page.getByText('Khóa học A',{exact:true}).waitFor();
    const enterBtn = page.locator('[id^="enterContextBtn-"]');
    await enterBtn.waitFor();
    const href = await enterBtn.getAttribute('href');
    assert.ok(href && href.startsWith('/learn/'));
    const newlyCreatedContextId = href.replace('/learn/', '');
    await Promise.all([
      page.waitForNavigation(),
      enterBtn.click(),
    ]);
    await page.locator('#catalogueView').waitFor();
    const openLessonBtn = page.locator('[id^="lessonLink-"]').first();
    await openLessonBtn.waitFor();
    await Promise.all([
      page.waitForNavigation(),
      openLessonBtn.click(),
    ]);
    await page.locator('#lessonPlayerView').waitFor();
    const startReadingBtn = page.locator('#startReadingBtn');
    await startReadingBtn.waitFor();
    await startReadingBtn.click();
    await page.getByText('Chào mừng bạn đến với bài học đầu tiên.',{exact:false}).waitFor();
    await page.locator('#practiceSection').waitFor();

    // CLICK #startPracticeBtn and assert new actual service attempt tied to newly created context
    const startPracticeBtn = page.locator('#startPracticeBtn');
    await startPracticeBtn.waitFor();
    await startPracticeBtn.click();
    await page.locator('#activeExerciseCard').waitFor();
    const createdAttempt = server.fixture.attempts.find((a) => a.contextId === newlyCreatedContextId);
    assert.ok(createdAttempt, 'An actual service attempt must be created tied to newly created contextId');
  });
});
test('actual HomePage Pause / Resume button callbacks, rowVersion reconciliation & enter link visibility',async()=>{
  await withLearner(async page=>{
    const ctxId = server.fixture.contexts[0].id;
    await page.locator(`[data-context-id="${ctxId}"]`).waitFor();
    const rowVerLocator = page.locator(`#rowVersion-${ctxId}`);
    assert.equal(await rowVerLocator.innerText(), 'v1');
    const pauseBtn = page.locator(`#pauseBtn-${ctxId}`);
    await pauseBtn.waitFor();
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 1);

    // Pause context
    await pauseBtn.click();
    await page.locator(`#resumeBtn-${ctxId}`).waitFor();
    assert.equal(await rowVerLocator.innerText(), 'v2');
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 0);

    // Resume context
    const resumeBtn = page.locator(`#resumeBtn-${ctxId}`);
    await resumeBtn.click();
    await page.locator(`#pauseBtn-${ctxId}`).waitFor();
    assert.equal(await rowVerLocator.innerText(), 'v3');
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 1);
  });
});
test('actual HomePage create context with SELF_REPORT level selection',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts=[];
    await page.reload();
    await page.locator('#createContextForm').waitFor();
    await page.locator('#startSourceSelfReport').check();
    await page.locator('#createLevelSelect').waitFor();
    await page.locator('#submitCreateContextBtn').click();
    await page.getByText('Khóa học A',{exact:true}).waitFor();
    const card = page.locator('.context-card').first();
    await card.waitFor();
    assert.ok((await card.innerText()).includes('A1'));
  });
});
test('actual HomePage create context lost response after commit retains payload; product retry dedupes to single context',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts=[];
    await page.reload();
    await page.locator('#createContextForm').waitFor();

    const captured = [];
    const listener = (r) => {
      if (new URL(r.url()).pathname === '/api/learner/context' && r.method() === 'POST') {
        captured.push(r.postDataJSON());
      }
    };
    page.on('request', listener);

    // Let actual POST commit on server, then abort response to simulate lost response
    await page.route('**/api/learner/context', async (route) => {
      await route.fetch();
      await route.abort('failed');
    }, { times: 1 });

    await page.locator('#submitCreateContextBtn').click();
    await page.locator('#createContextAlert').waitFor();

    // Assert server committed the context
    assert.equal(server.fixture.contexts.length, 1);
    const persistedContextId = server.fixture.contexts[0].id;

    // Retry via product submit button
    const retryResponse = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/learner/context' && r.status() === 201
    );
    await page.locator('#submitCreateContextBtn').click();
    await retryResponse;

    page.off('request', listener);

    // Assert exact retained contextId, languageId, courseId, startSource payload on product retry
    assert.equal(captured.length, 2);
    assert.deepEqual(captured[0], captured[1]);
    assert.equal(captured[0].contextId, persistedContextId);
    assert.ok(captured[0].languageId);
    assert.ok(captured[0].courseId);
    assert.equal(captured[0].startSource, 'DEFAULT');

    // Exactly one persisted context (deduped safely on replay)
    assert.equal(server.fixture.contexts.length, 1);
    await page.getByText('Khóa học A',{exact:true}).waitFor();
  });
});
test('actual HomePage stale rowVersion 409 displays alert with reload action',async()=>{
  await withLearner(async page=>{
    const ctxId = server.fixture.contexts[0].id;
    await page.locator(`[data-context-id="${ctxId}"]`).waitFor();
    // Simulate concurrent transition bumping rowVersion behind browser's back
    server.fixture.contexts[0].rowVersion = 5n;
    const pauseBtn = page.locator(`#pauseBtn-${ctxId}`);
    await pauseBtn.click();
    const alert = page.locator(`#contextAlert-${ctxId}`);
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Phiên bản'));
    assert.ok(await alert.locator('button').isEnabled());
  });
});
test('actual HomePage options persistent 503 has bounded request count, stable error alert, and manual retry succeeds', async () => {
  await withLearner(async (page) => {
    server.fixture.contexts = [];
    let optionsRequests = 0;
    await page.route('**/api/learner/context/options', async (route) => {
      optionsRequests++;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Tùy chọn tạm thời không khả dụng.' } }),
      });
    });

    await page.reload();
    const alert = page.locator('#optionsErrorAlert');
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Tùy chọn tạm thời không khả dụng.'));

    // Wait a bit to prove it is bounded and NOT looping infinitely
    await page.waitForTimeout(400);
    assert.equal(optionsRequests, 1, 'Automatic fetch must be bounded to exactly 1 request');

    // Unroute options and click explicit manual retry
    await page.unroute('**/api/learner/context/options');
    const retryBtn = page.locator('#retryOptionsBtn');
    await retryBtn.waitFor();
    await retryBtn.click();
    await page.locator('#createLanguageSelect').waitFor();
    assert.equal(await page.locator('#optionsErrorAlert').count(), 0);
  });
});
test('actual HomePage options persistent 403 has bounded request count, stable error alert, and manual retry', async () => {
  await withLearner(async (page) => {
    server.fixture.contexts = [];
    let optionsRequests = 0;
    await page.route('**/api/learner/context/options', async (route) => {
      optionsRequests++;
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Quyền truy cập tùy chọn bị từ chối.' } }),
      });
    });

    await page.reload();
    const alert = page.locator('#optionsErrorAlert');
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Quyền truy cập tùy chọn bị từ chối.'));

    await page.waitForTimeout(400);
    assert.equal(optionsRequests, 1, 'Automatic fetch must be bounded to exactly 1 request');

    // Unroute options and click explicit manual retry
    await page.unroute('**/api/learner/context/options');
    const retryBtn = page.locator('#retryOptionsBtn');
    await retryBtn.waitFor();
    await retryBtn.click();
    await page.locator('#createLanguageSelect').waitFor();
    assert.equal(await page.locator('#optionsErrorAlert').count(), 0);
  });
});
test('actual HomePage denied states do not fetch options', async () => {
  await withLearner(async (page) => {
    let optionsCalls = 0;
    const listener = (r) => {
      if (new URL(r.url()).pathname === '/api/learner/context/options') optionsCalls++;
    };
    page.on('request', listener);

    server.fixture.account = { ...server.fixture.account, status: 'DISABLED' };
    await page.reload();
    await page.getByText('Truy cập bị từ chối', { exact: true }).waitFor();
    await page.waitForTimeout(300);

    page.off('request', listener);
    assert.equal(optionsCalls, 0, 'Denied states must not fetch options');
    server.fixture.account = { ...server.fixture.account, status: 'ACTIVE', role: 'LEARNER' };
  });
});
test('actual UI with ACTIVE + PAUSED contexts can create 3rd language into free ACTIVE slot', async () => {
  await withLearner(async (page) => {
    const lang1 = server.fixture.languages[0];
    const lang2Id = '22222222-2222-4222-8222-222222222222';
    const course2Id = '22222222-cccc-4ccc-8ccc-222222222222';
    const lang3Id = '33333333-3333-4333-8333-333333333333';
    const course3Id = '33333333-cccc-4ccc-8ccc-333333333333';

    const lang2 = { id: lang2Id, code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' }, isLearnable: true };
    const lang3 = { id: lang3Id, code: 'fr', names: { vi: 'Tiếng Pháp', en: 'French' }, isLearnable: true };

    const course2 = {
      id: course2Id,
      languageId: lang2Id,
      frameworkId: server.fixture.courses[0].frameworkId,
      names: { vi: 'Khóa Nhật', en: 'Japanese Course' },
      isActive: true,
      defaultStartLevelId: server.fixture.levels[0].id,
      framework: server.fixture.courses[0].framework,
    };
    const course3 = {
      id: course3Id,
      languageId: lang3Id,
      frameworkId: server.fixture.courses[0].frameworkId,
      names: { vi: 'Khóa Pháp', en: 'French Course' },
      isActive: true,
      defaultStartLevelId: server.fixture.levels[0].id,
      framework: server.fixture.courses[0].framework,
    };

    const unit2 = {
      id: 'u-ja',
      courseId: course2Id,
      levelId: server.fixture.levels[0].id,
      position: 1,
      names: { vi: 'Chương 1' },
      lessons: [{ id: 'l-ja', availability: 'AVAILABLE', activeRevisionId: 'rev-ja', activeRevision: { id: 'rev-ja', lessonId: 'l-ja', status: 'PUBLISHED' } }],
    };
    const unit3 = {
      id: 'u-fr',
      courseId: course3Id,
      levelId: server.fixture.levels[0].id,
      position: 1,
      names: { vi: 'Chương 1' },
      lessons: [{ id: 'l-fr', availability: 'AVAILABLE', activeRevisionId: 'rev-fr', activeRevision: { id: 'rev-fr', lessonId: 'l-fr', status: 'PUBLISHED' } }],
    };

    server.fixture.languages.push(lang2, lang3);
    server.fixture.courses.push(course2, course3);
    server.fixture.units.push(unit2, unit3);

    const ctx1 = { ...contextRow(), id: 'ctx-1', languageId: lang1.id, courseId: server.fixture.courses[0].id, status: 'ACTIVE', rowVersion: 1n };
    const ctx2 = { ...contextRow(), id: 'ctx-2', languageId: lang2Id, courseId: course2Id, status: 'PAUSED', rowVersion: 2n, language: lang2, course: course2 };
    server.fixture.contexts = [ctx1, ctx2];

    await page.reload();
    // 2 total contexts, 1 ACTIVE -> activeCount is 1/2
    await page.getByText('Đang có 1/2 lộ trình hoạt động', { exact: true }).waitFor();
    const openBtn = page.locator('#openCreateContextBtn');
    await openBtn.waitFor();
    await openBtn.click();

    // Create form appears
    await page.locator('#createContextForm').waitFor();
    // Select the 3rd eligible language
    await page.locator('#createLanguageSelect').selectOption(lang3Id);
    await page.locator('#submitCreateContextBtn').click();

    // Context card for course 3 appears
    await page.getByText('Khóa Pháp', { exact: true }).waitFor();
    assert.equal(server.fixture.contexts.length, 3);
    const activeContexts = server.fixture.contexts.filter((c) => c.status === 'ACTIVE');
    assert.equal(activeContexts.length, 2);
    // Button is now hidden since capacity is reached (2/2)
    assert.equal(await page.locator('#openCreateContextBtn').count(), 0);
  });
});
