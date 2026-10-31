import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { verifyLearnerIdentity } from '../../src/server/auth/index.ts';
import { loadLearnerContext } from '../../src/server/context/loader.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { setupEnv, account, contextRow, confirmedUser, token, fixtureDb, providerDouble, fixtureEmail, fixturePassword } from './harness/learner-fixture.mjs';
let state, jar;
const store = { getAll: () => [...jar].map(([name,value]) => ({name,value})), set: (name,value,options) => options?.maxAge === 0 ? jar.delete(name) : jar.set(name,value), delete: name => jar.delete(name) };
mock.module('next/headers.js', { exports: { cookies: async () => store } });
const { POST: login } = await import('../../src/app/api/auth/login/route.ts');
const { POST: logout } = await import('../../src/app/api/auth/logout/route.ts');
const realFetch = globalThis.fetch;
const request = (route, body) => new Request(`http://learner.test${route}`, { method:'POST', headers:{host:'learner.test',origin:'http://learner.test','content-type':'application/json'}, ...(body && {body:JSON.stringify(body)}) });
beforeEach(() => { setupEnv(); jar=new Map(); state={account:account(),contexts:[contextRow()]}; setLearnerPrismaForTest(fixtureDb(state)); globalThis.fetch=providerDouble(state); });
afterEach(() => {globalThis.fetch=realFetch;setLearnerPrismaForTest(null);});
test('review: wrong-role login revokes only its new local session', async () => {
  state.account.role='ADMIN';
  const response=await login(request('/api/auth/login',{email:fixtureEmail,password:fixturePassword}));
  assert.equal(response.status,403); assert.deepEqual(state.logoutScopes,['local']);
});
test('review: logout uses provider local scope and clears only exact learner namespace',async()=>{
  await login(request('/api/auth/login',{email:fixtureEmail,password:fixturePassword}));
  jar.set('learner-preference','keep');jar.set('sb-staff-token','keep');
  assert.equal((await logout(request('/api/auth/logout'))).status,200);
  assert.deepEqual(state.logoutScopes,['local']);
  assert.equal(jar.get('learner-preference'),'keep');assert.equal(jar.get('sb-staff-token'),'keep');
  assert.ok(![...jar.keys()].some(name=>name.startsWith('sb-learner-test-learner-token')));
});
test('review: provider email_not_confirmed maps to safe confirmation403',async()=>{
  state.unconfirmed=true;
  const response=await login(request('/api/auth/login',{email:fixtureEmail,password:fixturePassword}));
  assert.equal(response.status,403);const body=await response.json();assert.equal(body.error.code,'FORBIDDEN');assert.match(body.error.message,/xác thực email/i);
});
test('review: generic or phone confirmation cannot substitute for email confirmation',async()=>{
  const user={...confirmedUser(),email_confirmed_at:null,confirmed_at:'2026-10-31T00:00:00Z',phone_confirmed_at:'2026-10-31T00:00:00Z'};
  const result=await verifyLearnerIdentity({authClient:{auth:{getUser:async()=>({data:{user},error:null})}},prisma:fixtureDb(state)});
  assert.equal(result.ok,false);assert.equal(result.status,403);
});
for(const relation of ['language','course','framework'])test(`review: mismatched joined ${relation} ID fails409`,async()=>{
  const row=contextRow();if(relation==='framework')row.course.framework.id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';else row[relation].id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const db=fixtureDb(state);db.learningContext.findMany=async()=>[row];
  const result=await loadLearnerContext(undefined,{authClient:{auth:{getUser:async()=>({data:{user:confirmedUser()},error:null})}},prisma:db});
  assert.equal(result.status,409);assert.equal(result.error.code,'CONTEXT_INCONSISTENT');
});
test('actual staff catalogue, teachers, courses, review, assessment and Teacher lesson handlers reject verified Learner',async()=>{
  const {setProductPrismaForTest}=await import('../../../lingora-admin/src/server/db/index.js');
  jar.set('sb-learner-test-auth-token','base64-'+Buffer.from(JSON.stringify(token())).toString('base64url'));
  setProductPrismaForTest(fixtureDb(state));
  try{
    for(const route of ['languages','teachers','courses','reviews','assessment-blueprints','teacher/lessons']){
      const {GET}=await import(`../../../lingora-admin/src/app/api/${route}/route.ts`);
      const response=await GET(new Request(`http://learner.test/api/${route}`));
      assert.equal(response.status,403,route);assert.equal((await response.json()).error.code,'FORBIDDEN',route);
    }
    const {compileAndLoadPage}=await import('../../../lingora-admin/tests/feature/harness/load-production-pages.mjs');
    const {setCookieStore}=await import('../../../lingora-admin/tests/feature/harness/next-headers-bridge.mjs');
    setCookieStore(store);
    const page=await compileAndLoadPage(new URL('../../../lingora-admin/src/app/my-lessons/page.tsx',import.meta.url).pathname,new URL('../../../tmp/slice9/staff-page.mjs',import.meta.url).pathname,{useBridge:true});
    const element=await page();assert.equal(element.type.name,'AccessDeniedView');assert.match(element.props.message,/phân hệ cán bộ/);
    const {POST:staffLogin}=await import('../../../lingora-admin/src/app/api/auth/login/route.ts');
    const denied=await staffLogin(request('/api/auth/login',{email:fixtureEmail,password:fixturePassword}));
    assert.equal(denied.status,403);assert.equal((await denied.json()).error.code,'FORBIDDEN');
  }finally{setProductPrismaForTest(null);}
});
