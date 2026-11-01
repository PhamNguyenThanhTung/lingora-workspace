import {test,before,after,beforeEach}from'node:test';import assert from'node:assert/strict';
import {PrismaClient}from'../../../lingora-admin/generated/product-client/index.js';
import {setLearnerPrismaForTest}from'../../src/server/db/index.ts';
import {mutateLessonConsumption,getLessonReading}from'../../src/server/lessons/service.ts';
import {createFixture,deferred,bounded}from'./harness/consumption-db-fixture.mjs';
import {saveTeacherLessonDraft,submitTeacherLesson,approveReview,publishReview}from'../../../lingora-admin/src/server/lessons/index.ts';
// Explicit opt-in integration gate. The tracked runner applies every migration
// without removing guards; fixtures publish content through the staff services.
const url=process.env.SLICE10_TEST_DATABASE_URL;assert.ok(url,'Explicit owned loopback DB required');const parsed=new URL(url);assert.ok(['127.0.0.1','localhost'].includes(parsed.hostname));assert.match(parsed.pathname,/^\/slice10_test/);assert.equal(process.env.SLICE10_TEST_DATABASE_OWNED,'1');
const db=new PrismaClient({datasourceUrl:url,log:[]}),other=new PrismaClient({datasourceUrl:url,log:[]});let f;
before(async()=>{await db.$connect();await other.$connect();});after(async()=>{setLearnerPrismaForTest(null);await Promise.all([db.$disconnect(),other.$disconnect()]);});beforeEach(async()=>{f=await createFixture(db);setLearnerPrismaForTest(db);});
const command=(action,actor=f.a,ctx=f.ctxA,revision=f.revision)=>mutateLessonConsumption(ctx,f.lesson,{action,expectedPublishedRevisionId:revision},actor);
function instrument(hooks){return new Proxy(db,{get(target,key){if(key!=='$transaction')return Reflect.get(target,key);return (fn,options)=>target.$transaction(async tx=>{await hooks.enter?.(tx);const proxy=new Proxy(tx,{get(t,k){if(k==='$queryRaw')return async(strings,...values)=>{const q={sql:strings.join(''),values,tx};await hooks.before?.(q);const result=await t.$queryRaw(strings,...values);await hooks.after?.({...q,result});return result;};return Reflect.get(t,k);}});return fn(proxy);},options);}});}
const lockError=e=>e.code==='P2010'&&e.meta?.code==='55P03';
async function exclusiveLesson(){return other.$transaction(async tx=>{await tx.$executeRawUnsafe("SET LOCAL lock_timeout='150ms'");return tx.$queryRaw`SELECT id FROM app.lessons WHERE id=${f.lesson}::uuid FOR UPDATE`;});}
async function rewriteContext(){return other.$transaction(async tx=>{await tx.$executeRawUnsafe("SET LOCAL lock_timeout='150ms'");return tx.$executeRaw`UPDATE app.learning_contexts SET learner_id=${f.c}::uuid WHERE id=${f.ctxA}::uuid`;});}
test('production service: concurrent starts/completes and retries keep one immutable row',async()=>{const starts=await Promise.all(Array.from({length:5},()=>command('start')));assert.equal(new Set(starts.map(x=>x.id)).size,1);assert.ok(starts.every(x=>x.rowVersion==='1'));const completes=await Promise.all(Array.from({length:5},()=>command('complete')));assert.ok(completes.every(x=>x.rowVersion==='2'&&x.completedAt===completes[0].completedAt));const before=await db.lessonConsumption.findFirst({where:{contextId:f.ctxA}});await command('start');await command('complete');assert.deepEqual(await db.lessonConsumption.findUnique({where:{id:before.id}}),before);assert.equal(before.createdAt.valueOf(),before.startedAt.valueOf());assert.equal(await db.lessonAttempt.count({where:{contextId:f.ctxA}}),0);assert.equal(await db.lessonCompletion.count({where:{contextId:f.ctxA}}),0);});
test('production service: independent learners share parents; publisher waits until both commit',async()=>{const arrived=deferred(),release=deferred();let n=0;setLearnerPrismaForTest(instrument({after:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR SHARE')){if(++n===2)arrived.resolve();await release.promise;}}}));const work=[command('start'),command('start',f.b,f.ctxB)];try{await bounded(arrived.promise,'both real learner transactions hold shared Lesson');await assert.rejects(exclusiveLesson(),lockError);}finally{release.resolve();}await Promise.all(work);await exclusiveLesson();assert.equal(await db.lessonConsumption.count({where:{contextId:{in:[f.ctxA,f.ctxB]}}}),2);});
test('production service: completion transaction begun before later start uses post-lock DB clock',async()=>{const held=deferred(),release=deferred();let began;setLearnerPrismaForTest(instrument({enter:async tx=>{began=(await tx.$queryRaw`SELECT transaction_timestamp() AS ts`)[0].ts;},before:async({sql})=>{if(sql.includes('app.accounts')){held.resolve();await release.promise;}}}));const complete=command('complete');await bounded(held.promise,'completion begun');setLearnerPrismaForTest(db);try{await command('start');const start=await db.lessonConsumption.findFirst({where:{contextId:f.ctxA}});assert.ok(start.startedAt>=began);}finally{release.resolve();}await complete;const row=await db.lessonConsumption.findFirst({where:{contextId:f.ctxA}});assert.ok(row.completedAt>=row.startedAt);assert.equal(row.createdAt.valueOf(),row.startedAt.valueOf());assert.equal(row.rowVersion,2n);});
test('production service: completion samples clock only after competing consumption lock releases',async()=>{await command('start');const holding=deferred(),release=deferred(),attempted=deferred();const holder=other.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM app.lesson_consumptions WHERE context_id=${f.ctxA}::uuid FOR UPDATE`;holding.resolve();await release.promise;});await holding.promise;let clocks=0;setLearnerPrismaForTest(instrument({before:async({sql})=>{if(sql.includes('clock_timestamp'))clocks++;if(sql.includes('app.lesson_consumptions')&&sql.includes('FOR UPDATE'))attempted.resolve();}}));const completion=command('complete');try{await bounded(attempted.promise,'specific row lock attempted');assert.equal(clocks,0);}finally{release.resolve();}await holder;await completion;assert.equal(clocks,1);});
test('production service: first-start locks context; consumption-only history forbids reassignment',async()=>{const held=deferred(),release=deferred();setLearnerPrismaForTest(instrument({after:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR SHARE')){held.resolve();await release.promise;}}}));const start=command('start');try{await bounded(held.promise,'first-start parent locks');await assert.rejects(rewriteContext(),lockError);}finally{release.resolve();}await start;await assert.rejects(rewriteContext(),e=>e.code==='P2010'&&e.meta?.code==='23514');assert.equal((await db.learningContext.findUnique({where:{id:f.ctxA}})).learnerId,f.a);});
test('production service: context reassignment winning before locks rejects stale candidate without writes',async()=>{const held=deferred(),release=deferred();setLearnerPrismaForTest(instrument({before:async({sql})=>{if(sql.includes('app.courses')&&sql.includes('FOR SHARE')){held.resolve();await release.promise;}}}));const start=command('start');await bounded(held.promise,'candidate resolved');try{await rewriteContext();}finally{release.resolve();}await assert.rejects(start,e=>e.status===404);assert.equal(await db.lessonConsumption.count({where:{contextId:f.ctxA}}),0);});
test('production service: publication X→Y leaves completed X intact and stale committed retry conflicts',async()=>{
 await command('start');await command('complete');
 const X=await db.lessonConsumption.findFirst({where:{contextId:f.ctxA}});
 const lesson=await db.lesson.findUnique({where:{id:f.lesson}});
 const saved=await saveTeacherLessonDraft(f.teacher,f.lesson,{
  title:{en:'Y'},contentBlocks:[],expectedRevisionId:f.revision,expectedRowVersion:lesson.rowVersion.toString(),
  exercises:[{sourceExerciseId:f.exerciseId,position:1,isCore:true,type:'MCQ',promptData:{prompt:'Published Y prompt',options:[{id:'a',text:'One'},{id:'b',text:'Two'}]},gradingData:{correctOptionId:'a'}}],vocabulary:[],
 },db);
 assert.equal(saved.status,200,JSON.stringify(saved));
 const draft=saved.data.data;
 const submitted=await submitTeacherLesson(f.teacher,f.lesson,{revisionId:draft.highestRevision.id,expectedLessonRowVersion:draft.rowVersion,expectedRevisionRowVersion:draft.highestRevision.rowVersion},db);
 assert.equal(submitted.status,200,JSON.stringify(submitted));
 let Y=await db.lessonRevision.findUnique({where:{id:draft.highestRevision.id}});
 const approved=await approveReview(f.admin,submitted.data.submissionId,{expectedRevisionRowVersion:Y.rowVersion.toString()},db);
 assert.equal(approved.status,200,JSON.stringify(approved));
 Y=await db.lessonRevision.findUnique({where:{id:Y.id}});
 const current=await db.lesson.findUnique({where:{id:f.lesson}});
 const published=await publishReview(f.admin,submitted.data.submissionId,{expectedRevisionRowVersion:Y.rowVersion.toString(),expectedLessonRowVersion:current.rowVersion.toString()},db);
 assert.equal(published.status,200,JSON.stringify(published));
 await assert.rejects(command('complete'),e=>e.status===409&&e.error.code==='PUBLICATION_CHANGED');
 assert.equal((await getLessonReading(f.ctxA,f.lesson,f.a)).state,'NOT_STARTED');
 await command('start',f.a,f.ctxA,Y.id);
 assert.deepEqual(await db.lessonConsumption.findUnique({where:{id:X.id}}),X);
 assert.equal(await db.lessonConsumption.count({where:{contextId:f.ctxA}}),2);
});
