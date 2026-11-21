// Local production Next/Chromium protocol test; all provider traffic stays on loopback.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const require=createRequire(import.meta.url);
const packageRoot=fileURLToPath(new URL('../..',import.meta.url));
let app, browser, output='', challenge, exchanges=0, base;
let verifyOtpPosts = 0;
const usedTokens = new Set();
const resendHistory = [];
const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'synthetic@example.test'};
const provider=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('Content-Type','application/json');
  if(req.method==='POST'&&url.pathname==='/auth/v1/verify'){
    verifyOtpPosts++;
    let body='';for await(const chunk of req)body+=chunk;
    const data=JSON.parse(body);
    if(usedTokens.has(data.token_hash)){
      res.writeHead(403).end(JSON.stringify({code:403,error_code:'otp_expired',msg:'Token has expired or is invalid'}));
      return;
    }
    usedTokens.add(data.token_hash);
    res.end(JSON.stringify({access_token:'synthetic-token-hash-access',refresh_token:'synthetic-token-hash-refresh',expires_in:3600,token_type:'bearer',user:{...user,email_confirmed_at:'2026-11-21T00:00:00Z'}}));
    return;
  }
  if(req.method==='POST'&&url.pathname==='/auth/v1/resend'){
    let body='';for await(const chunk of req)body+=chunk;
    const data=JSON.parse(body);
    resendHistory.push(data.email);
    res.end('{}');
    return;
  }
  if(url.pathname==='/auth/v1/verify'){
    res.writeHead(303,{Location:base+'/auth/confirm?code=synthetic-browser-code'}).end();return;
  }
  let body='';for await(const chunk of req)body+=chunk;
  if(url.pathname==='/auth/v1/signup'){
    challenge=JSON.parse(body).code_challenge;
    res.end(JSON.stringify({...user,identities:[{id:user.id}]}));return;
  }
  if(url.pathname==='/auth/v1/token'){
    exchanges++;
    const data=JSON.parse(body);
    const matched=data.auth_code==='synthetic-browser-code' &&
      createHash('sha256').update(data.code_verifier).digest('base64url')===challenge;
    if(!matched){res.writeHead(400).end(JSON.stringify({code:'bad_code_verifier',msg:'Synthetic mismatch'}));return;}
    res.end(JSON.stringify({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user}));return;
  }
  res.writeHead(404).end('{}');
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function stop(child){
  if(!child||child.exitCode!==null)return;
  child.kill('SIGTERM');await Promise.race([once(child,'exit'),pause(5000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
}
try{
  provider.listen(0,'127.0.0.1');await once(provider,'listening');
  const providerOrigin=`http://127.0.0.1:${provider.address().port}`;
  const portReservation=createServer();portReservation.listen(0,'127.0.0.1');await once(portReservation,'listening');
  const appPort=portReservation.address().port;await new Promise(resolve=>portReservation.close(resolve));
  base=`http://localhost:${appPort}`;
  const syntheticDb='postgresql://synthetic@127.0.0.1:1/synthetic';
  const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'',SUPABASE_URL:providerOrigin,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_PUBLISHABLE_KEY:'synthetic-public-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_ANON_KEY:'',
    SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',DATABASE_URL:syntheticDb,DIRECT_URL:syntheticDb,LINGORA_APP_ORIGIN:base};
  console.log('Building production Next with synthetic loopback provider');
  const build=spawn('npm',['run','build'],{cwd:packageRoot,env,stdio:['ignore','pipe','pipe']});
  build.stdout.on('data',b=>output+=b);build.stderr.on('data',b=>output+=b);
  assert.equal((await once(build,'exit'))[0],0,'Synthetic build failed');
  console.log('Production build PASS; starting local callback test');
  app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','-p',String(appPort)],{cwd:packageRoot,env,stdio:['ignore','pipe','pipe']});
  app.stdout.on('data',b=>output+=b);app.stderr.on('data',b=>output+=b);
  let ready=false;
  for(let i=0;i<100;i++){
    if(app.exitCode!==null)break;
    try{const response=await fetch(base+'/register');if(response.ok){ready=true;break;}}catch{}
    await pause(200);
  }
  assert.ok(ready,'Local Next did not become ready');
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext();
  // Static landing avoids DB/bootstrap; only actual proxy and callback are under test.
  await context.route(base+'/login?*',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>synthetic landing</p>'}));
  const page=await context.newPage();
  await page.goto(base+'/auth/confirm?code=synthetic-browser-code');
  assert.equal(new URL(page.url()).searchParams.get('error'),'confirmation_failed');
  assert.equal(exchanges,0,'No token POST without verifier');
  assert.match(output,/pkce_code_verifier_not_found/);
  assert.match(output,/verifierCookiePresent: false/);

  await page.goto(base+'/register');
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill('SyntheticPassword123!');
  await page.locator('#registerDisplayName').fill('Synthetic browser learner');
  const registered=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/auth/register'&&r.request().method()==='POST');
  await page.locator('button[type=submit]').click();assert.equal((await registered).status(),200);
  await page.locator('#registerSuccess').waitFor();
  const state=await context.storageState();
  assert.ok(state.cookies.some(c=>c.name.endsWith('-code-verifier')&&c.value));
  const resumed=await browser.newContext({storageState:state});
  await resumed.route(base+'/login?*',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>synthetic landing</p>'}));
  const callbackPage=await resumed.newPage();
  const callbackResponse=callbackPage.waitForResponse(r=>new URL(r.url()).pathname==='/auth/confirm');
  await callbackPage.goto(providerOrigin+'/auth/v1/verify?token=synthetic');
  const callback=await callbackResponse;
  assert.equal(callback.status(),303);
  assert.equal(new URL(callbackPage.url()).searchParams.get('confirmed'),'1');
  assert.equal(exchanges,1);
  const cookies=(await resumed.storageState()).cookies;
  assert.ok(cookies.some(c=>c.name==='sb-127-learner-token'&&c.value&&c.httpOnly&&c.secure&&c.sameSite==='Lax'));
  assert.ok(!cookies.some(c=>c.name==='sb-127-learner-token-code-verifier'&&c.value));

  // Cross-device confirmation with token_hash (D2, D4, D6)
  const crossContext = await browser.newContext();
  await crossContext.route(base+'/login?*',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>synthetic landing</p>'}));
  const crossPage = await crossContext.newPage();
  const testHash = 'synthetic-token-hash-cross-device';
  const confirmUrl = base + '/auth/confirm?token_hash=' + testHash + '&type=email';

  // 14. Anti-prefetch check: fetch GET consumes 0 verify calls
  const verifyBefore = verifyOtpPosts;
  const prefetchRes = await fetch(confirmUrl, { redirect: 'manual' });
  assert.equal(prefetchRes.status, 303);
  assert.equal(verifyOtpPosts, verifyBefore, 'Prefetch GET must not consume verifyOtp');

  // 13. Navigate to confirm link in Context B -> redirects to /auth/verify
  await crossPage.goto(confirmUrl);
  await crossPage.waitForURL('**/auth/verify?*');
  assert.equal(verifyOtpPosts, verifyBefore, 'Landing on verify page must not consume verifyOtp');
  const verifyBtn = crossPage.locator('#verifySubmitBtn');
  await verifyBtn.waitFor({ state: 'visible' });

  // Click verify -> POST /auth/confirm -> provider verifyOtp called -> /login?confirmed=1
  const postConfirmResponse = crossPage.waitForResponse(r => new URL(r.url()).pathname === '/auth/confirm' && r.request().method() === 'POST');
  await verifyBtn.click();
  const postConfirm = await postConfirmResponse;
  assert.equal(postConfirm.status(), 303);
  assert.equal(new URL(crossPage.url()).searchParams.get('confirmed'), '1');
  assert.equal(verifyOtpPosts, verifyBefore + 1, 'verifyOtp called exactly once on user submit');

  // 15. Spent link replay: clicking verify on already-spent token -> /login?error=confirmation_failed
  await crossPage.goto(confirmUrl);
  await crossPage.waitForURL('**/auth/verify?*');
  await crossPage.locator('#verifySubmitBtn').click();
  await crossPage.waitForURL('**/login?error=confirmation_failed');
  assert.equal(verifyOtpPosts, verifyBefore + 2, 'Provider returned otp_expired');

  await crossContext.close();

  console.log(JSON.stringify({status:'PASS',productionBuild:true,missingVerifierFailsWithoutTokenPost:true,
    realBrowserSignupProxyCallback:true,originalStorageStateRestored:true,codeVerifierMatched:true,pkceTokenPosts:exchanges,
    crossDeviceTokenVerify:true,antiPrefetchZeroVerify:true,tokenReplayFailed:true,
    callbackStatus:callback.status(),confirmed:true,secureHttpOnlySessionCookie:true,externalProviderCalls:0}));
}catch(error){
  console.error('Local confirmation browser test FAIL');
  console.error(output);
  console.error(error);process.exitCode=1;
}finally{
  await browser?.close();await stop(app);await new Promise(resolve=>provider.close(resolve));
}
