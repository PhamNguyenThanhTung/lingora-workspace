import {randomUUID}from'node:crypto';
import {createPracticeFixture}from'./practice-db-fixture.mjs';
export async function createFixture(db){
 const fixture=await createPracticeFixture(db);
 const f={...fixture,a:fixture.learnerA,b:fixture.learnerB,c:randomUUID()};
 await db.$executeRaw`INSERT INTO auth.users(id,email) VALUES (${f.c}::uuid,${f.c+'@test.local'})`;
 await db.account.create({data:{id:f.c,role:'LEARNER',status:'ACTIVE'}});
 return f;
}
export const provider=id=>({auth:{getUser:async()=>({data:{user:{id,email_confirmed_at:'2026-01-01T00:00:00Z'}},error:null})}});
export function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
export async function bounded(p,label){let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Timeout: '+label)),8000)})]);}finally{clearTimeout(timer);}}
