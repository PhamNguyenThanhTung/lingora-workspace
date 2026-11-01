import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  startPracticeAttempt,
  submitPracticeResponse,
  finalizePracticeAttempt,
  getPracticeAttempt,
  loadLatestPracticeAttempt,
} from '../../src/server/lessons/practice-service.ts';
import {saveTeacherLessonDraft,submitTeacherLesson,approveReview,publishReview} from '../../../lingora-admin/src/server/lessons/index.ts';
import { createPracticeFixture, deferred, bounded } from './harness/practice-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Explicit owned loopback DB required (run via tmp/slice11/local-db-runner.mjs)');
const parsed = new URL(url);
assert.ok(['127.0.0.1', 'localhost'].includes(parsed.hostname));
assert.match(parsed.pathname, /^\/slice11_test/);
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');

const db = new PrismaClient({ datasourceUrl: url, log: [] });
const other = new PrismaClient({ datasourceUrl: url, log: [] });
let f;

before(async () => {
  await db.$connect();
  await other.$connect();
});

after(async () => {
  setLearnerPrismaForTest(null);
  await Promise.all([db.$disconnect(), other.$disconnect()]);
});

beforeEach(async () => {
  f = await createPracticeFixture(db);
  setLearnerPrismaForTest(db);
});

test('Real PostgreSQL: Practice attempt lifecycle, atomic D2 core enrollment & completion triggers', async () => {
  const attemptId = randomUUID();

  // 1. Start practice attempt
  const startResult = await startPracticeAttempt(
    f.ctxA,
    f.lesson,
    { attemptId, expectedPublishedRevisionId: f.revision },
    f.learnerA
  );
  assert.equal(startResult.id, attemptId);
  assert.equal(startResult.lessonRevisionId, f.revision);
  assert.equal(startResult.isCompleted, false);
  assert.equal(startResult.nCore, 1);
  assert.equal(startResult.queuePosition, 1);
  assert.equal(startResult.nextExercise?.id, f.exerciseId);

  // Verify attempt in DB
  const dbAttempt = await db.lessonAttempt.findUnique({ where: { id: attemptId } });
  assert.ok(dbAttempt);
  assert.equal(dbAttempt.contextId, f.ctxA);
  assert.equal(dbAttempt.lessonRevisionId, f.revision);
  assert.equal(dbAttempt.completedAt, null);

  // 2. Submit response to exercise 1
  const opKey1 = randomUUID();
  const respResult = await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    {
      operationKey: opKey1,
      lessonExerciseId: f.exerciseId,
      input: { optionId: 'opt-1' },
    },
    f.learnerA
  );
  assert.equal(respResult.response.isCorrect, true);
  assert.equal(respResult.response.contributionUnits, 2);
  assert.equal(respResult.attempt.nextExercise, null, 'Queue should now be exhausted');

  // Verify response in DB
  const dbResponses = await db.lessonResponse.findMany({ where: { attemptId } });
  assert.equal(dbResponses.length, 1);
  assert.equal(dbResponses[0].isCorrect, true);
  assert.equal(dbResponses[0].contributionUnits, 2);
  assert.equal(dbResponses[0].responseOrdinal, 1);

  // 3. Finalize attempt (D2 atomic enrollment)
  const finalizeOpKey = randomUUID();
  const finResult = await finalizePracticeAttempt(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: finalizeOpKey },
    f.learnerA
  );
  assert.equal(finResult.attempt.isCompleted, true);
  assert.ok(finResult.attempt.score);
  assert.equal(finResult.attempt.score.contributionUnits, 2);
  assert.equal(finResult.attempt.score.maxUnits, 2);
  assert.equal(finResult.attempt.score.percentage, 100);
  assert.equal(finResult.isFirstCompletion, true);

  // Verify DB side-effects on real Postgres:
  // a) LessonAttempt updated with completed facts
  const completedAttempt = await db.lessonAttempt.findUnique({ where: { id: attemptId } });
  assert.ok(completedAttempt.completedAt);
  assert.equal(completedAttempt.contributionUnits, 2);
  assert.equal(completedAttempt.responseCount, 1);
  assert.equal(completedAttempt.completionOperationKey, finalizeOpKey);
  assert.ok(completedAttempt.qualifyingLocalDate);

  // b) First completion created in app.lesson_completions
  const completion = await db.lessonCompletion.findUnique({
    where: { contextId_lessonId: { contextId: f.ctxA, lessonId: f.lesson } },
  });
  assert.ok(completion);
  assert.equal(completion.firstAttemptId, attemptId);
  // Trigger check: trg_lesson_completion_timestamp verified completed_at matched attempt.completed_at
  assert.equal(completion.completedAt.toISOString(), completedAttempt.completedAt.toISOString());

  // c) D2: Core vocabulary enrolled into app.srs_cards at stage 1, due +1 day
  const srsCards = await db.srsCard.findMany({
    where: { learnerId: f.learnerA, vocabularyId: f.vocabId },
  });
  assert.equal(srsCards.length, 1);
  const card = srsCards[0];
  assert.equal(card.stage, 1);
  assert.equal(card.enrollmentSource, 'CORE_COMPLETION');
  assert.equal(card.sourceAttemptId, attemptId);
  assert.equal(card.sourceLessonVocabularyId, f.vocabLinkId);
  const expectedDue = new Date(completedAttempt.completedAt.getTime() + 24 * 60 * 60 * 1000);
  assert.equal(card.dueAt.toISOString(), expectedDue.toISOString());

  // d) Command receipt recorded
  const receipt = await db.commandReceipt.findUnique({
    where: {
      actorId_command_operationKey: {
        actorId: f.learnerA,
        command: 'COMPLETE_LESSON',
        operationKey: finalizeOpKey,
      },
    },
  });
  assert.ok(receipt);
  assert.equal(receipt.targetId, attemptId);
});

test('Real PostgreSQL: Immutability triggers reject direct modification of completed attempts & responses', async () => {
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
  await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: randomUUID(), lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
    f.learnerA
  );
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: randomUUID() }, f.learnerA);

  // 1. Direct update on completed attempt facts must be rejected by trg_lesson_attempt_completed (check_violation 23514)
  await assert.rejects(
    async () => {
      await db.$executeRaw`
        UPDATE app.lesson_attempts
        SET started_at = started_at + interval '1 millisecond'
        WHERE id = ${attemptId}::uuid
      `;
    },
    (err) => err.code === 'P2010' && err.meta?.code === '23514' && err.meta?.message?.includes('Completed lesson attempt facts are immutable')
  );

  // 2. Direct delete on completed attempt must be rejected by trg_lesson_attempt_no_delete (check_violation 23514)
  await assert.rejects(
    async () => {
      await db.$executeRaw`
        DELETE FROM app.lesson_attempts
        WHERE id = ${attemptId}::uuid
      `;
    },
    (err) => err.code === 'P2010' && err.meta?.code === '23514'
  );

  // 3. Direct update on response must be rejected by trg_lesson_response_no_update (check_violation 23514)
  await assert.rejects(
    async () => {
      await db.$executeRaw`
        UPDATE app.lesson_responses
        SET input = '{"optionId":"opt-2"}'::jsonb
        WHERE attempt_id = ${attemptId}::uuid
      `;
    },
    (err) => err.code === 'P2010' && err.meta?.code === '23514' && err.meta?.message?.includes('Record is immutable')
  );

  // 4. Direct delete on response must be rejected by trg_lesson_response_no_delete (check_violation 23514)
  await assert.rejects(
    async () => {
      await db.$executeRaw`
        DELETE FROM app.lesson_responses
        WHERE attempt_id = ${attemptId}::uuid
      `;
    },
    (err) => err.code === 'P2010' && err.meta?.code === '23514'
  );
});

test('Real PostgreSQL: D2 existing SRS cards remain untouched on completion (no-reset)', async () => {
  // Pre-insert an existing card for learnerA at stage 4 with custom due date
  const customDueAt = new Date('2026-12-15T12:00:00Z');
  const existingCard = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 4,
      dueAt: customDueAt,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceAttemptId: null,
      sourceLessonVocabularyId: f.vocabLinkId,
      rowVersion: 7n,
    },
  });

  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
  await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: randomUUID(), lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
    f.learnerA
  );
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: randomUUID() }, f.learnerA);

  // Existing card in Postgres must NOT have been overwritten or reset
  const cardAfter = await db.srsCard.findUnique({
    where: { id: existingCard.id },
  });
  assert.equal(cardAfter.stage, 4, 'Existing card stage must remain 4');
  assert.equal(cardAfter.rowVersion, 7n, 'Existing card rowVersion must remain 7');
  assert.equal(cardAfter.dueAt.toISOString(), customDueAt.toISOString(), 'Existing card dueAt must be untouched');
});

test('Real PostgreSQL: D3 stale publication X -> Y blocks new writes but allows committed replay', async () => {
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);

  const opKey1 = randomUUID();
  await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: opKey1, lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
    f.learnerA
  );

  const finOpKey = randomUUID();
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: finOpKey }, f.learnerA);

  // Now Teacher publishes successor revision Y on the same lesson
  const oldRev = await db.lessonRevision.findUnique({ where: { id: f.revision } });
  const revY = await db.lessonRevision.create({
    data: {
      lessonId: f.lesson,
      revisionNo: 2,
      assignmentId: oldRev.assignmentId,
      creationAssignmentEpisodeId: oldRev.creationAssignmentEpisodeId,
      status: 'DRAFT',
      title: { en: 'Revision Y' },
      contentBlocks: [],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });
  await db.lessonExercise.create({
    data: {
      lessonRevisionId: revY.id,
      itemId: f.itemId,
      itemRevisionId: f.itemRevId,
      position: 1,
      isCore: true,
    },
  });
  await db.lessonRevision.update({
    where: { id: revY.id },
    data: {
      status: 'PUBLISHED',
      submittedAssignmentGeneration: 1n,
      assignmentScopeSnapshot: { unit: 'U1' },
      submittedBy: f.teacher,
      submittedAt: new Date(),
      approvedBy: f.admin,
      approvedAt: new Date(),
      publishedBy: f.admin,
      publishedAt: new Date(),
    },
  });
  await db.lesson.update({
    where: { id: f.lesson },
    data: { activeRevisionId: revY.id },
  });

  // 1. Authorized exact committed-operation replay of finalize succeeds despite publication pointer update (D3)
  const replayFin = await finalizePracticeAttempt(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: finOpKey },
    f.learnerA
  );
  assert.equal(replayFin.attempt.id, attemptId);
  assert.equal(replayFin.attempt.isCompleted, true);

  // 2. Authorized exact committed-operation replay of response 1 succeeds despite publication pointer update (D3)
  const replayResp = await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: opKey1, lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
    f.learnerA
  );
  assert.equal(replayResp.response.isCorrect, true);

  // 3. Approved D3 publication error takes precedence for any new stale write.
  await assert.rejects(
    async () => {
      await submitPracticeResponse(
        f.ctxA,
        f.lesson,
        attemptId,
        { operationKey: randomUUID(), lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
        f.learnerA
      );
    },
    (err) => err.status === 409 && err.error?.code === 'PUBLICATION_CHANGED'
  );
});

test('Real PostgreSQL: Concurrent finalizations with same operation key deduplicate safely', async () => {
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
  await submitPracticeResponse(
    f.ctxA,
    f.lesson,
    attemptId,
    { operationKey: randomUUID(), lessonExerciseId: f.exerciseId, input: { optionId: 'opt-1' } },
    f.learnerA
  );

  const sharedOpKey = randomUUID();
  const [fin1, fin2] = await Promise.all([
    finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: sharedOpKey }, f.learnerA),
    finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: sharedOpKey }, f.learnerA),
  ]);

  assert.equal(fin1.attempt.id, attemptId);
  assert.equal(fin2.attempt.id, attemptId);
  assert.equal(fin1.attempt.score?.percentage, 100);
  assert.equal(fin2.attempt.score?.percentage, 100);

  // Exactly 1 receipt created
  const receipts = await db.commandReceipt.findMany({
    where: { actorId: f.learnerA, command: 'COMPLETE_LESSON', operationKey: sharedOpKey },
  });
  assert.equal(receipts.length, 1);
});

function instrument(client,hooks={}){
 return new Proxy(client,{get(target,key){
  if(key!=='$transaction')return Reflect.get(target,key);
  return(fn,options)=>target.$transaction(async tx=>{
   const proxy=new Proxy(tx,{get(t,k){
    if(k==='$queryRaw')return async(strings,...values)=>{
     const q={sql:strings.join(''),strings,values,tx};await hooks.before?.(q);
     const injected=await hooks.query?.(q);const result=injected?.handled?injected.result:await t.$queryRaw(strings,...values);
     await hooks.after?.({...q,result});return result;
    };
    if(k==='commandReceipt')return{...t.commandReceipt,create:async args=>{const row=await t.commandReceipt.create(args);await hooks.afterReceipt?.(row);return row;}};
    return Reflect.get(t,k);
   }});return fn(proxy);
  },options);
 }});
}
const begin=(actor=f.learnerA,ctx=f.ctxA,id=randomUUID())=>startPracticeAttempt(ctx,f.lesson,{attemptId:id,expectedPublishedRevisionId:f.revision},actor);
const answer=(attempt,operationKey=randomUUID(),optionId='opt-1')=>submitPracticeResponse(f.ctxA,f.lesson,attempt.id,{operationKey,lessonExerciseId:f.exerciseId,input:{optionId}},f.learnerA);
const finish=(attempt,operationKey=randomUUID())=>finalizePracticeAttempt(f.ctxA,f.lesson,attempt.id,{operationKey},f.learnerA);

async function approvedSuccessor(){
 const lesson=await db.lesson.findUnique({where:{id:f.lesson}});
 const saved=await saveTeacherLessonDraft(f.teacher,f.lesson,{
  title:{en:'Supported successor Y'},contentBlocks:[{type:'paragraph',text:'Y body'}],
  expectedRevisionId:f.revision,expectedRowVersion:lesson.rowVersion.toString(),
  exercises:[{sourceExerciseId:f.exerciseId,position:1,isCore:true,type:'MCQ',promptData:{prompt:'Exact Y prompt',options:[{id:'opt-1',text:'First'},{id:'opt-2',text:'Second'}]},gradingData:{correctOptionId:'opt-2'}}],vocabulary:[],
 },db);
 assert.equal(saved.status,200,JSON.stringify(saved));const dto=saved.data.data;
 const revision=dto.highestRevision;
 const submitted=await submitTeacherLesson(f.teacher,f.lesson,{revisionId:revision.id,expectedLessonRowVersion:dto.rowVersion,expectedRevisionRowVersion:revision.rowVersion},db);
 assert.equal(submitted.status,200,JSON.stringify(submitted));
 const r=await db.lessonRevision.findUnique({where:{id:revision.id}});
 const approved=await approveReview(f.admin,submitted.data.submissionId,{expectedRevisionRowVersion:r.rowVersion.toString()},db);assert.equal(approved.status,200,JSON.stringify(approved));
 return{revisionId:revision.id,submissionId:submitted.data.submissionId};
}
async function publish(y,client=other){
 const revision=await client.lessonRevision.findUnique({where:{id:y.revisionId}}),lesson=await client.lesson.findUnique({where:{id:f.lesson}});
 const result=await publishReview(f.admin,y.submissionId,{expectedRevisionRowVersion:revision.rowVersion.toString(),expectedLessonRowVersion:lesson.rowVersion.toString()},client);assert.equal(result.status,200,JSON.stringify(result));return result;
}

test('real PostgreSQL: same start and concurrent response commands have one canonical persisted outcome',async()=>{
 const id=randomUUID();const starts=await Promise.all([begin(f.learnerA,f.ctxA,id),begin(f.learnerA,f.ctxA,id)]);assert.equal(starts[0].id,starts[1].id);assert.equal(await db.lessonAttempt.count({where:{contextId:f.ctxA}}),1);
 const op=randomUUID();const responses=await Promise.all([answer(starts[0],op),answer(starts[0],op)]);assert.equal(responses[0].response.id,responses[1].response.id);assert.equal(await db.lessonResponse.count({where:{attemptId:id}}),1);
 const second=await begin();const raced=await Promise.allSettled([answer(second),answer(second)]);assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);assert.equal(await db.lessonResponse.count({where:{attemptId:second.id}}),1);
});

test('real PostgreSQL: independent learners hold shared parents together while an exclusive publisher waits',async()=>{
 const held=deferred(),release=deferred();let count=0;
 setLearnerPrismaForTest(instrument(db,{after:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR SHARE')){if(++count===2)held.resolve();await release.promise;}}}));
 const work=[begin(),begin(f.learnerB,f.ctxB)];
 try{await bounded(held.promise,'both independent learners share Lesson');
  await assert.rejects(other.$transaction(async tx=>{await tx.$executeRawUnsafe("SET LOCAL lock_timeout='150ms'");await tx.$queryRaw`SELECT id FROM app.lessons WHERE id=${f.lesson}::uuid FOR UPDATE`;}),e=>e.code==='P2010'&&e.meta?.code==='55P03');
 }finally{release.resolve();}await Promise.all(work);
});

test('real PostgreSQL: late failure rolls back attempt, first completion, enrollment and receipt; retry succeeds',async()=>{
 const attempt=await begin();await answer(attempt);const op=randomUUID();
 setLearnerPrismaForTest(instrument(db,{afterReceipt:()=>{throw new Error('Owned late fault after actual receipt insertion');}}));
 await assert.rejects(finish(attempt,op),/Owned late fault/);
 assert.equal((await db.lessonAttempt.findUnique({where:{id:attempt.id}})).completedAt,null);
 assert.equal(await db.lessonCompletion.count({where:{contextId:f.ctxA}}),0);assert.equal(await db.srsCard.count({where:{learnerId:f.learnerA}}),0);assert.equal(await db.commandReceipt.count({where:{actorId:f.learnerA}}),0);assert.equal(await db.lessonResponse.count({where:{attemptId:attempt.id}}),1);
 setLearnerPrismaForTest(db);assert.equal((await finish(attempt,op)).isFirstCompletion,true);
});

test('real PostgreSQL: current unfinished redo resumes while completed performance ties use id DESC',async()=>{
 setLearnerPrismaForTest(instrument(db,{query:async({sql,strings,values,tx})=>{
  if(!sql.includes('AS completed_at'))return;
  const text=strings.reduce((q,s,i)=>q+(i?`$${i}`:'')+s,'').replaceAll('clock_timestamp()',"TIMESTAMPTZ '2027-01-01 00:00:00+00'");
  return{handled:true,result:await tx.$queryRawUnsafe(text,...values)};
 }}));
 const a=await begin(f.learnerA,f.ctxA,'ffffffff-ffff-4fff-8fff-ffffffffffff');await answer(a);await finish(a);
 const b=await begin(f.learnerA,f.ctxA,'00000000-0000-4000-8000-0000000000b1');await answer(b);await finish(b);
 const rows=await db.lessonAttempt.findMany({where:{contextId:f.ctxA}});assert.equal(rows[0].completedAt.valueOf(),rows[1].completedAt.valueOf());
 const latest=await loadLatestPracticeAttempt(f.ctxA,f.lesson,f.learnerA);assert.equal(latest.id,a.id,'id DESC resolves equal completion timestamps without startedAt precedence');
 const redo=await begin();assert.equal((await loadLatestPracticeAttempt(f.ctxA,f.lesson,f.learnerA)).id,redo.id);
});

test('real PostgreSQL: completion and qualifying local day share one midnight-boundary clock sample',async()=>{
 const attempt=await begin();await answer(attempt);let samples=0;
 setLearnerPrismaForTest(instrument(db,{query:async({sql,strings,values,tx})=>{
  if(!sql.includes('AS completed_at'))return;
  const text=strings.reduce((q,s,i)=>q+(i?`$${i}`:'')+s,'').replaceAll('clock_timestamp()',()=>`TIMESTAMPTZ '${++samples===1?'2026-11-01 16:59:59.999+00':'2026-11-01 17:00:00+00'}'`);
  return{handled:true,result:await tx.$queryRawUnsafe(text,...values)};
 }}));
 await finish(attempt);const row=await db.lessonAttempt.findUnique({where:{id:attempt.id}});assert.equal(samples,1);assert.equal(row.completedAt.toISOString(),'2026-11-01T16:59:59.999Z');assert.equal(row.qualifyingLocalDate.toISOString().slice(0,10),'2026-11-01');assert.equal(row.timezoneAtCompletion,'Asia/Ho_Chi_Minh');
});

test('real publisher wins: supported Y publication makes unfinished X finalize409 without any partial writes',async()=>{
 const attempt=await begin();await answer(attempt);const y=await approvedSuccessor();
 const held=deferred(),release=deferred(),trying=deferred();
 const publisher=publish(y,instrument(other,{after:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR UPDATE')){held.resolve();await release.promise;}}}));
 await bounded(held.promise,'publisher holds real Lesson lock');
 setLearnerPrismaForTest(instrument(db,{before:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR SHARE'))trying.resolve();}}));
 const final=finish(attempt);try{await bounded(trying.promise,'finalizer attempts shared Lesson');}finally{release.resolve();}
 await publisher;await assert.rejects(final,e=>e.status===409&&e.error?.code==='PUBLICATION_CHANGED');
 assert.equal((await db.lessonAttempt.findUnique({where:{id:attempt.id}})).completedAt,null);assert.equal(await db.lessonCompletion.count({where:{contextId:f.ctxA}}),0);assert.equal(await db.srsCard.count({where:{learnerId:f.learnerA}}),0);assert.equal(await db.commandReceipt.count({where:{actorId:f.learnerA}}),0);
 assert.equal((await db.lesson.findUnique({where:{id:f.lesson}})).activeRevisionId,y.revisionId);
});

test('real finalizer wins: publisher waits; X completion and exact child grades survive supported Y publication',async()=>{
 const attempt=await begin();await answer(attempt);const y=await approvedSuccessor();
 const held=deferred(),release=deferred(),trying=deferred();
 setLearnerPrismaForTest(instrument(db,{after:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR SHARE')){held.resolve();await release.promise;}}}));
 const op=randomUUID(),final=finish(attempt,op);await bounded(held.promise,'finalizer holds shared Lesson');
 const publisher=publish(y,instrument(other,{before:async({sql})=>{if(sql.includes('app.lessons')&&sql.includes('FOR UPDATE'))trying.resolve();}}));
 try{await bounded(trying.promise,'publisher attempts exclusive Lesson');}finally{release.resolve();}
 assert.equal((await final).isFirstCompletion,true);await publisher;setLearnerPrismaForTest(db);
 const completion=await db.lessonCompletion.findUnique({where:{contextId_lessonId:{contextId:f.ctxA,lessonId:f.lesson}}});assert.equal(completion.firstAttemptId,attempt.id);
 const replay=await finish(attempt,op);assert.equal(replay.attempt.isStale,true);assert.equal(replay.attempt.score.contributionUnits,2);
 const response=await db.lessonResponse.findFirst({where:{attemptId:attempt.id},include:{lessonExercise:true}});assert.equal(response.lessonExercise.itemRevisionId,f.itemRevId);assert.equal(response.lessonRevisionId,f.revision);
 await assert.rejects(finish(attempt),e=>e.error?.code==='PUBLICATION_CHANGED');await assert.rejects(answer(attempt),e=>e.error?.code==='PUBLICATION_CHANGED');
});

test('real PostgreSQL: five exact types produce N5+K3 evidence and completion at a low score, never from partial work',async()=>{
 f=await createPracticeFixture(db,{fiveTypes:true});const attempt=await begin();assert.equal(attempt.nCore,5);
 await assert.rejects(finish(attempt),e=>e.error?.code==='INCOMPLETE_ATTEMPT');
 let current=attempt;
 for(let i=0;i<8;i++){
  const ex=current.nextExercise;assert.ok(ex);let input;
  switch(ex.type){
   case'MCQ':input={optionId:'opt-1'};break;
   case'FILL_BLANK':input={text:current.nextOrdinal===1?'wrong':'  CAFE\u0301  '};break;
   case'REORDER':input={tokenIds:current.nextOrdinal===1?['one','two']:['two','one']};break;
   case'LISTENING':input={optionId:'a'};break;
   case'GRAMMAR':input={text:'she visited'};break;
  }
  current=(await submitPracticeResponse(f.ctxA,f.lesson,attempt.id,{operationKey:randomUUID(),lessonExerciseId:ex.id,input},f.learnerA)).attempt;
  if(i===4){await assert.rejects(finish(attempt),e=>e.error?.code==='INCOMPLETE_ATTEMPT');assert.equal((await db.lessonAttempt.findUnique({where:{id:attempt.id}})).completedAt,null);assert.equal(await db.lessonCompletion.count({where:{contextId:f.ctxA}}),0);}
 }
 const result=await finish(attempt);assert.equal(result.attempt.nCore,5);assert.equal(result.attempt.kFirstWrong,3);assert.equal(result.attempt.responseCount,8);assert.deepEqual(result.attempt.score,{contributionUnits:6,maxUnits:16,percentage:38});assert.equal(result.isFirstCompletion,true);
 const rows=await db.lessonResponse.findMany({where:{attemptId:attempt.id},include:{lessonExercise:true},orderBy:{queuePosition:'asc'}});assert.equal(rows.length,8);assert.ok(rows.every(r=>r.lessonRevisionId===f.revision&&r.lessonExercise.lessonRevisionId===f.revision));
 assert.equal((await db.lessonCompletion.findUnique({where:{contextId_lessonId:{contextId:f.ctxA,lessonId:f.lesson}}})).firstAttemptId,attempt.id);
});
