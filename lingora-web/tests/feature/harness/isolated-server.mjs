import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { serializeCookieHeader } from '@supabase/ssr';
import { setLearnerPrismaForTest } from '../../../src/server/db/index.ts';
import { compileProductionModules } from './production-modules.mjs';
import { requests } from './request-context.mjs';
import { account, contextRow, setupEnv, fixtureDb, providerDouble } from './learner-fixture.mjs';

const appDir=path.resolve(import.meta.dirname,'../../..');
let cachedBundle;
export async function buildHarnessBundle(){
  const result=await build({entryPoints:[path.join(import.meta.dirname,'isolated-harness-entry.tsx')],bundle:true,format:'esm',jsx:'automatic',write:false,define:{'process.env.NODE_ENV':JSON.stringify('test')},alias:{'@':path.join(appDir,'src'),'next/navigation':path.join(import.meta.dirname,'mock-next-navigation.ts')}});
  cachedBundle=result.outputFiles[0].text;
  return cachedBundle;
}
export async function startIsolatedServer(port=3019){
  setupEnv();
  if(!cachedBundle)await buildHarnessBundle();
  const modules=await compileProductionModules();
  const state={account:account(),contexts:[contextRow()]};
  const originalFetch=globalThis.fetch;
  globalThis.fetch=providerDouble(state);
  setLearnerPrismaForTest(fixtureDb(state));
  const css=fs.readFileSync(path.join(appDir,'src/app/globals.css'),'utf8');
  const html=bootstrap=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div>${bootstrap?`<script id="production-page" type="application/json">${JSON.stringify(bootstrap).replaceAll('<','\\u003c')}</script>`:''}<script type="module" src="/bundle.js"></script></body></html>`;
  const server=http.createServer(async(req,res)=>{
    const origin=`http://127.0.0.1:${port}`;
    const url=new URL(req.url,origin);
    res.setHeader('Cache-Control','no-store, private');
    if(url.pathname==='/bundle.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(cachedBundle);return;}
    if(url.pathname==='/fonts/Lato-Regular.ttf'){res.end(fs.readFileSync(path.join(appDir,'public/fonts/Lato-Regular.ttf')));return;}
    if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html());return;}
    const jar=new Map((req.headers.cookie||'').split(';').filter(Boolean).map(c=>{const [name,...value]=c.trim().split('=');return [name,value.join('=')];}));
    const writes=[];
    const store={getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value,options)=>{if(options?.maxAge===0)jar.delete(name);else jar.set(name,value);writes.push(serializeCookieHeader(name,value,options));},delete:name=>{jar.delete(name);writes.push(serializeCookieHeader(name,'',{path:'/',maxAge:0}));}};
    const writeCookies=()=>{if(writes.length)res.setHeader('Set-Cookie',writes);};
    await requests.run(store,async()=>{
      try{
        if(url.pathname==='/login'||url.pathname==='/home'){
          const kind=url.pathname==='/login'?'login':'home';
          const element=await modules[`${kind}Page`].default();
          writeCookies();res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html({kind,props:element.props}));return;
        }
        const handler={ '/api/auth/login':modules.login.POST,'/api/auth/logout':modules.logout.POST,'/api/learner/context':modules.context.GET }[url.pathname];
        if(handler){
          const chunks=[];for await(const chunk of req)chunks.push(chunk);
          const body=Buffer.concat(chunks);
          const response=await handler(new Request(url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}));
          response.headers.forEach((value,key)=>{if(key!=='set-cookie')res.setHeader(key,value);});writeCookies();res.statusCode=response.status;res.end(await response.text());return;
        }
        res.writeHead(404);res.end('Not found');
      }catch(error){
        writeCookies();if(error.destination){res.writeHead(302,{Location:error.destination});res.end();return;}
        res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'TEST_SERVER_ERROR',message:error.name}}));
      }
    });
  });
  server.fixture=state;
  server.once('close',()=>{globalThis.fetch=originalFetch;setLearnerPrismaForTest(null);});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return server;
}
