import {test} from 'node:test';
import assert from 'node:assert/strict';
import {account,contextRow,unitRow,lessonRow,fixtureDb,contextId} from './harness/learner-fixture.mjs';
import {loadLearnerHome} from '../../src/server/context/home-loader.ts';
function fixture(){const state={account:account(),contexts:[contextRow()],units:[unitRow()],lessons:[lessonRow()],exercises:[],vocabulary:[],completions:[],consumptions:[],attempts:[],responses:[],srsCards:[],srsReviewOperations:[],xpEvents:[],learnerAchievements:[]};return {state,db:fixtureDb(state)};}
const authClient=(id)=>({auth:{getUser:async()=>({data:{user:{id,email_confirmed_at:'2026-01-01T00:00:00Z'}},error:null})}});
test('home reads an owned remembered context and emits a private scoped cookie',async()=>{
 const {state,db}=fixture(),headers=new Headers();
 const result=await loadLearnerHome({get:()=>({value:contextId})},{authClient:authClient(state.account.id),prisma:db,responseHeaders:headers});
 assert.equal(result.ok,true);assert.equal(result.data.selectedContextId,contextId);assert.match(headers.get('Set-Cookie'),new RegExp('lingora_ctx='+contextId));assert.match(headers.get('Set-Cookie'),/HttpOnly; SameSite=Lax/);
 assert.ok(Array.isArray(result.data.path));assert.ok(Array.isArray(result.data.sections));assert.ok(result.data.currentLevel);
});
test('home ignores foreign cookie and never lets a cookie override an explicit foreign context',async()=>{
 const {state,db}=fixture();const options={authClient:authClient(state.account.id),prisma:db};
 const foreign='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
 assert.equal((await loadLearnerHome({get:()=>({value:foreign})},options)).data.selectedContextId,contextId);
 const denied=await loadLearnerHome({get:()=>({value:contextId})},{...options,contextId:foreign});assert.equal(denied.status,404);
});
