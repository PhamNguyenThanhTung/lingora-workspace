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
