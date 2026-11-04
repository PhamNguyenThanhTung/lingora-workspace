import {test, beforeEach, afterEach, mock} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {NextRequest} from 'next/server.js';
import {getLearnerCookieName} from '../../src/server/auth/env.ts';
import {proxy} from '../../src/proxy.ts';
let jar;
const store = {
  getAll: () => [...jar].map(([name,value]) => ({name,value})),
  set: (name,value,options) => options?.maxAge === 0 ? jar.delete(name) : jar.set(name,value),
};
mock.module('next/headers.js', {exports:{cookies:async()=>store}});
const {POST:register} = await import('../../src/app/api/auth/register/route.ts');
const {GET:confirm} = await import('../../src/app/auth/confirm/route.ts');
const originalFetch=globalThis.fetch;
const originalEnv={...process.env};
const origin='https://learner.test';
const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'synthetic@example.test'};
const originalWarn=console.warn;
let challenge, exchanges, warnings, providerError;
beforeEach(()=>{
  jar=new Map(); exchanges=0; warnings=[]; providerError=null;
  console.warn=(...args)=>warnings.push(args);
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://synthetic.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='synthetic-publishable-key';
  process.env.NODE_ENV='production';
  globalThis.fetch=async(url,options)=>{
    const u=new URL(String(url));
    if(u.pathname==='/auth/v1/signup'){
      challenge=JSON.parse(options.body).code_challenge;
      return Response.json({...user,identities:[{id:user.id}]});
    }
    if(u.pathname==='/auth/v1/token' && u.searchParams.get('grant_type')==='pkce'){
      exchanges++;
      if(providerError) return Response.json(providerError,{status:400,headers:{'x-supabase-api-version':'2024-01-01'}});
      const body=JSON.parse(options.body);
      assert.equal(body.auth_code,'synthetic-code');
      assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'),challenge);
      return Response.json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user});
    }
    throw new Error('Unexpected synthetic provider request');
  };
});
afterEach(()=>{
  globalThis.fetch=originalFetch; console.warn=originalWarn;
  for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];
  Object.assign(process.env,originalEnv);
});

async function signupThroughProxy(){
  const signup=await register(new Request(origin+'/api/auth/register',{
    method:'POST',headers:{Origin:origin,Host:'learner.test','Content-Type':'application/json'},
    body:JSON.stringify({email:user.email,password:'SyntheticPassword123!',displayName:'Synthetic learner'}),
  }));
  assert.equal(signup.status,200);
  const verifierName=getLearnerCookieName()+'-code-verifier';
  assert.ok(jar.has(verifierName));
  const cookie=[...jar].map(([name,value])=>`${name}=${value}`).join('; ');
  const request=new NextRequest(origin+'/auth/confirm?code=synthetic-code',{headers:{cookie}});
  const refreshed=await proxy(request);
  const downstream=refreshed.headers.get('x-middleware-request-cookie')??request.headers.get('cookie');
  jar=new Map(new NextRequest(request.url,{headers:{cookie:downstream}}).cookies.getAll().map(c=>[c.name,c.value]));
  assert.ok(jar.get(verifierName),'Proxy must not remove the pending signup verifier');
  return new Request(request.url);
}

test('real SDK signup → proxy → callback keeps original verifier and establishes session',async()=>{
  const request=await signupThroughProxy();
  const response=await confirm(request);
  assert.equal(response.headers.get('location'),origin+'/login?confirmed=1');
  assert.equal(exchanges,1);
  assert.ok(jar.has(getLearnerCookieName()),'Session must be persisted by actual SSR SDK');
});


test('server-only production env keys keep verifier through proxy and callback',async()=>{
  process.env.SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const response=await confirm(await signupThroughProxy());
  assert.equal(response.headers.get('location'),origin+'/login?confirmed=1');
  assert.equal(exchanges,1);
  assert.deepEqual(warnings,[]);
});

test('missing callback verifier produces fixed diagnostic without contacting token endpoint',async()=>{
  const request=await signupThroughProxy();
  jar.clear();
  const response=await confirm(request);
  assert.equal(response.headers.get('location'),origin+'/login?error=confirmation_failed');
  assert.equal(exchanges,0);
  assert.deepEqual(warnings,[['learner_confirmation_failed',{
    phase:'pkce_exchange',code:'pkce_code_verifier_not_found',status:400,verifierCookiePresent:false,
  }]]);
});

for(const code of ['bad_code_verifier','PRIVATE_UNKNOWN_CODE_123'])test(`SDK failure diagnostic allowlists ${code}`,async()=>{
  const request=await signupThroughProxy();
  providerError={code,msg:'PRIVATE_TOKEN_123 PRIVATE_PASSWORD_456 private@example.test https://example.test/?code=PRIVATE_AUTH_CODE'};
  const response=await confirm(request);
  assert.equal(response.headers.get('location'),origin+'/login?error=confirmation_failed');
  assert.equal(exchanges,1);
  assert.deepEqual(warnings,[['learner_confirmation_failed',{
    phase:'pkce_exchange',code:code==='bad_code_verifier'?code:'unknown',status:400,verifierCookiePresent:true,
  }]]);
  assert.doesNotMatch(JSON.stringify(warnings)+JSON.stringify([...response.headers]),/PRIVATE_|private@example|synthetic-code/);
});

test('client initialization failure is logged without private error and has private no-store redirect',async()=>{
  for(const key of ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_ANON_KEY'])delete process.env[key];
  const response=await confirm(new Request(origin+'/auth/confirm?code=PRIVATE_CODE_123'));
  assert.equal(response.headers.get('location'),origin+'/login?error=service_unavailable');
  assert.match(response.headers.get('cache-control'),/private/);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.deepEqual(warnings,[['learner_confirmation_failed',{
    phase:'client_init',code:'unknown',status:null,verifierCookiePresent:null,
  }]]);
});
