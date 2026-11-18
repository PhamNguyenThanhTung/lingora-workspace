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
    await page.getByRole('heading', { name: 'Khóa học A', exact: true }).waitFor();
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
    server.fixture.contextFailure=false;await page.locator('#retryBtn').click();await page.getByRole('heading', { name: 'Khóa học A', exact: true }).waitFor();
    assert.equal(await page.locator('#errorBox').count(),0);
  });
});
test('actual HomePage inconsistent409 → actual retry returns owned data; invalid session redirects401',async()=>{
  await withLearner(async page=>{
    server.fixture.contexts[0].course.framework.id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';await page.reload();await page.getByText('Dữ liệu không nhất quán',{exact:true}).waitFor();
    assert.equal((await page.request.get(`${origin}/api/learner/context`)).status(),409);
    server.fixture.contexts=[contextRow()];await page.locator('#retryBtn').click();await page.getByRole('heading', { name: 'Khóa học A', exact: true }).waitFor();
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
test('actual HomePage Pause / Resume button callbacks, rowVersion reconciliation & enter link visibility',async()=>{
  await withLearner(async page=>{
    const ctxId = server.fixture.contexts[0].id;
    await page.locator(`[data-context-id="${ctxId}"]`).waitFor();
    const transitionPayloads = [];
    const listener = (request) => {
      if (new URL(request.url()).pathname === `/api/learner/contexts/${ctxId}` && request.method() === 'PATCH') {
        transitionPayloads.push(request.postDataJSON());
      }
    };
    page.on('request', listener);
    assert.equal(await page.locator(`#rowVersion-${ctxId}`).count(), 0);
    const pauseBtn = page.locator(`#pauseBtn-${ctxId}`);
    await pauseBtn.waitFor();
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 1);

    // Pause context
    await pauseBtn.click();
    await page.locator(`#resumeBtn-${ctxId}`).waitFor();
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 0);

    // Resume context
    const resumeBtn = page.locator(`#resumeBtn-${ctxId}`);
    await resumeBtn.click();
    await page.locator(`#pauseBtn-${ctxId}`).waitFor();
    assert.equal(await page.locator(`#enterContextBtn-${ctxId}`).count(), 1);
    page.off('request', listener);
    assert.deepEqual(transitionPayloads.map(({ status, expectedRowVersion }) => ({ status, expectedRowVersion })), [
      { status: 'PAUSED', expectedRowVersion: '1' },
      { status: 'ACTIVE', expectedRowVersion: '2' },
    ]);
  });
});
test('actual HomePage stale rowVersion 409 displays alert with reload action',async()=>{
  await withLearner(async page=>{
    const ctxId = server.fixture.contexts[0].id;
    await page.locator(`[data-context-id="${ctxId}"]`).waitFor();
    // Simulate concurrent transition bumping rowVersion behind browser's back
    server.fixture.contexts[0].rowVersion = 5n;
    let stalePayload;
    const listener = (request) => {
      if (new URL(request.url()).pathname === `/api/learner/contexts/${ctxId}` && request.method() === 'PATCH') {
        stalePayload = request.postDataJSON();
      }
    };
    page.on('request', listener);
    const pauseBtn = page.locator(`#pauseBtn-${ctxId}`);
    await pauseBtn.click();
    const alert = page.locator(`#contextAlert-${ctxId}`);
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Phiên bản'));
    assert.ok(await alert.locator('button').isEnabled());
    page.off('request', listener);
    assert.equal(stalePayload.expectedRowVersion, '1');
  });
});
test('actual HomePage options persistent 503 has bounded request count, stable error alert, and manual retry succeeds', async () => {
  await withLearner(async (page) => {
    const ctx = server.fixture.contexts[0];
    Object.assign(ctx, { selectedStartLevelId: null, selectedStartLevel: null, workingLevelId: null, workingLevel: null });
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
    await page.locator(`#startLevelBtn-${ctx.id}`).click();
    const alert = page.locator('#optionsErrorAlert');
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Tùy chọn tạm thời không khả dụng.'));

    assert.equal(optionsRequests, 1, 'Opening recovery should fetch options once');

    // Unroute options and click explicit manual retry
    await page.unroute('**/api/learner/context/options');
    const retryBtn = page.locator('#retryOptionsBtn');
    await retryBtn.waitFor();
    await retryBtn.click();
    await page.locator(`input[name="startSource-${ctx.id}"][value="SELF_REPORT"]`).check();
    await page.locator(`#startLevelSelect-${ctx.id}`).waitFor();
    assert.equal(await page.locator('#optionsErrorAlert').count(), 0);
  });
});
test('actual HomePage options persistent 403 has bounded request count, stable error alert, and manual retry', async () => {
  await withLearner(async (page) => {
    const ctx = server.fixture.contexts[0];
    Object.assign(ctx, { selectedStartLevelId: null, selectedStartLevel: null, workingLevelId: null, workingLevel: null });
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
    await page.locator(`#startLevelBtn-${ctx.id}`).click();
    const alert = page.locator('#optionsErrorAlert');
    await alert.waitFor();
    assert.ok((await alert.innerText()).includes('Quyền truy cập tùy chọn bị từ chối.'));

    assert.equal(optionsRequests, 1, 'Opening recovery should fetch options once');

    // Unroute options and click explicit manual retry
    await page.unroute('**/api/learner/context/options');
    const retryBtn = page.locator('#retryOptionsBtn');
    await retryBtn.waitFor();
    await retryBtn.click();
    await page.locator(`input[name="startSource-${ctx.id}"][value="SELF_REPORT"]`).check();
    await page.locator(`#startLevelSelect-${ctx.id}`).waitFor();
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
test('actual HomePage sends adding another language through onboarding and respects the active limit', async () => {
  await withLearner(async (page) => {
    const lang1 = server.fixture.languages[0];
    const lang2Id = '22222222-2222-4222-8222-222222222222';
    const course2Id = '22222222-cccc-4ccc-8ccc-222222222222';
    const lang2 = { id: lang2Id, code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' }, isLearnable: true };
    const course2 = {
      id: course2Id,
      languageId: lang2Id,
      frameworkId: server.fixture.courses[0].frameworkId,
      names: { vi: 'Khóa Nhật', en: 'Japanese Course' },
      isActive: true,
      defaultStartLevelId: server.fixture.levels[0].id,
      framework: server.fixture.courses[0].framework,
    };
    server.fixture.languages.push(lang2);
    server.fixture.courses.push(course2);

    const ctx1 = { ...contextRow(), id: '11111111-cccc-4ccc-8ccc-111111111111', languageId: lang1.id, courseId: server.fixture.courses[0].id, status: 'ACTIVE', rowVersion: 1n };
    const ctx2 = { ...contextRow(), id: '22222222-dddd-4ddd-8ddd-222222222222', languageId: lang2Id, courseId: course2Id, status: 'PAUSED', rowVersion: 2n, language: lang2, course: course2 };
    server.fixture.contexts = [ctx1, ctx2];

    await page.reload();
    const addLanguageLink = page.locator('#addOnboardingLanguageBtn');
    await addLanguageLink.waitFor();
    assert.equal(await addLanguageLink.getAttribute('href'), '/onboarding');
    assert.equal(await page.locator('#createContextForm').count(), 0);
    assert.equal(await page.locator('#openCreateContextBtn').count(), 0);

    ctx2.status = 'ACTIVE';
    await page.reload();
    await page.getByText('Bạn đang học tối đa hai ngôn ngữ.', { exact: true }).waitFor();
    assert.equal(await page.locator('#addOnboardingLanguageBtn').count(), 0);
  });
});
