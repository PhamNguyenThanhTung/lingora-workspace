import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
const auth=await import('../../src/server/auth/index.ts');
let authorized=true,calls=0,body;
mock.module('next/headers.js',{exports:{cookies:async()=>({getAll:()=>[]})}});
mock.module('../../src/server/auth/index.ts',{exports:{...auth,verifyLearnerIdentity:async()=>{calls++;return authorized?{ok:true,user:{id:'owner'}}:{ok:false,status:401,error:{code:'UNAUTHENTICATED',message:'Login required'}};}}});
mock.module('../../src/server/profile/service.ts',{exports:{loadLearnerProfile:async()=>({ok:true,status:200,data:{displayName:'Mai'}}),patchLearnerProfile:async(id,value)=>{body={id,value};return {displayName:value.displayName,rowVersion:'2'};}}});
const {GET,PATCH}=await import('../../src/app/api/learner/profile/route.ts');
const request=(data,origin='http://localhost:3200')=>new Request('http://localhost:3200/api/learner/profile',{method:'PATCH',headers:{Host:'localhost:3200',Origin:origin,'Content-Type':'application/json'},body:data});
process.env.LINGORA_APP_ORIGIN='http://localhost:3200';
test('profile route rejects foreign origin before authentication and preserves no-store',async()=>{calls=0;const r=await PATCH(request('{}','https://foreign.example'));assert.equal(r.status,403);assert.equal(calls,0);assert.match(r.headers.get('Cache-Control'),/no-store/);});
test('profile PATCH enforces identity, JSON and body size and passes only authenticated owner',async()=>{
 authorized=false;assert.equal((await PATCH(request('{}'))).status,401);authorized=true;
 assert.equal((await PATCH(request('broken'))).status,400);
 assert.equal((await PATCH(request('x'.repeat(4097)))).status,413);
 const r=await PATCH(request(JSON.stringify({displayName:'Mai',expectedRowVersion:'1'})));assert.equal(r.status,200);assert.equal(body.id,'owner');
});
test('profile GET uses safe loader envelope and private cache policy',async()=>{const r=await GET(new Request('http://localhost:3200/api/learner/profile'));assert.deepEqual(await r.json(),{data:{displayName:'Mai'}});assert.match(r.headers.get('Cache-Control'),/private/);});
