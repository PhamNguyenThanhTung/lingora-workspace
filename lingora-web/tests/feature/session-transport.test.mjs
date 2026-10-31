import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest, NextResponse } from 'next/server.js';
import { createSupabaseServerClient, getLearnerCookieName } from '../../src/server/auth/index.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { proxy, applyProxyAuthToResponse } from '../../src/proxy.ts';
import { setupEnv, account, contextRow, confirmedUser, token, fixtureDb, providerDouble, fixtureEmail, fixturePassword } from './harness/learner-fixture.mjs';
let jar,state,writes;
const store={getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value,options)=>{jar.set(name,value);writes.push({name,value,options});},delete:name=>jar.delete(name)};
mock.module('next/headers.js',{exports:{cookies:async()=>store}});
const { GET: contextRoute }=await import('../../src/app/api/learner/context/route.ts');
const originalFetch=globalThis.fetch, originalNodeEnv=process.env.NODE_ENV;
beforeEach(()=>{
  setupEnv();process.env.NODE_ENV='production';jar=new Map();writes=[];
  state={account:account(),contexts:[contextRow()],user:{...confirmedUser(),user_metadata:{padding:'x'.repeat(9000)}}};
  globalThis.fetch=providerDouble(state);setLearnerPrismaForTest(fixtureDb(state));
});
afterEach(()=>{globalThis.fetch=originalFetch;setLearnerPrismaForTest(null);if(originalNodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=originalNodeEnv;});
function expire(){jar.set(getLearnerCookieName(),'base64-'+Buffer.from(JSON.stringify(token(confirmedUser(),-120))).toString('base64url'));}
function assertHeaders(headers){assert.match(headers.get('cache-control'),/private/);assert.match(headers.get('cache-control'),/no-store/);assert.equal(headers.get('expires'),'0');assert.equal(headers.get('pragma'),'no-cache');}
function assertCookies(cookies){
  assert.ok(cookies.length>=2,'Large real SDK session must be chunked');
  for(const cookie of cookies.filter(c=>c.value)){
    const options=cookie.options||cookie;
    assert.ok(cookie.name.startsWith(getLearnerCookieName()+'.'));assert.equal(options.httpOnly,true);assert.equal(options.secure,true);assert.equal(options.sameSite,'lax');assert.equal(options.path,'/');assert.equal(options.domain,undefined);
  }
}
test('real SDK login produces chunked HttpOnly Secure host-only cookies and preserved SDK headers',async()=>{
  const headers=new Headers();const client=createSupabaseServerClient(store,headers);
  const result=await client.auth.signInWithPassword({email:fixtureEmail,password:fixturePassword});
  assert.equal(result.error,null);assertCookies(writes);assertHeaders(headers);
});
test('real expired-session refresh propagates new chunk cookies downstream and across alternate redirect response',async()=>{
  expire();const cookie=[...jar].map(([name,value])=>`${name}=${value}`).join('; ');
  const response=await proxy(new NextRequest('https://learner.test/home',{headers:{cookie}}));
  assert.equal(state.refreshes,1);assertCookies(response.cookies.getAll());assertHeaders(response.headers);
  const downstream=response.headers.get('x-middleware-request-cookie');
  assert.ok(downstream?.includes(getLearnerCookieName()+'.0='));
  const redirect=applyProxyAuthToResponse(response,NextResponse.redirect(new URL('https://learner.test/login')));
  assertHeaders(redirect.headers);assertCookies(redirect.cookies.getAll());
});
for(const status of [200,403,503])test(`actual context response${status} preserves refreshed SDK cookies/headers`,async()=>{
  expire();if(status===403)state.account=null;if(status===503)state.dbFailure=true;
  const response=await contextRoute(new Request('https://learner.test/api/learner/context'));
  assert.equal(response.status,status);assert.equal(state.refreshes,1);assertHeaders(response.headers);assertCookies(writes);
});
