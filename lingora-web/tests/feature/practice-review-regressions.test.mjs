import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setLearnerPrismaForTest} from '../../src/server/db/index.ts';
import {startPracticeAttempt,submitPracticeResponse,finalizePracticeAttempt,getPracticeAttempt,loadLatestPracticeAttempt} from '../../src/server/lessons/practice-service.ts';
import {loadLearnerCatalogue,mutateLessonConsumption} from '../../src/server/lessons/service.ts';
import {gradePracticeExercise} from '../../src/server/lessons/grader.ts';
import {account,contextRow,unitRow,lessonRow,lesson2Row,exercisesRows,vocabularyRows,fixtureDb,learnerId,otherLearnerId,contextId,lesson1Id,lesson2Id,revision1Id} from './harness/learner-fixture.mjs';

let state,db;
beforeEach(()=>{state={account:account(),contexts:[contextRow()],units:[unitRow()],lessons:[lessonRow(),lesson2Row()],exercises:exercisesRows(),vocabulary:vocabularyRows(),completions:[],consumptions:[],attempts:[],responses:[],srsCards:[],commandReceipts:[]};db=fixtureDb(state);setLearnerPrismaForTest(db);});
after(()=>setLearnerPrismaForTest(null));
const start=()=>startPracticeAttempt(contextId,lesson1Id,{attemptId:randomUUID(),expectedPublishedRevisionId:revision1Id},learnerId);
const rejection=(code,status)=>e=>(!code||e.error?.code===code)&&(!status||e.status===status);
const post=(id,exercise,input,operationKey=randomUUID())=>submitPracticeResponse(contextId,lesson1Id,id,{operationKey,lessonExerciseId:exercise,input},learnerId);
function answer(ex){switch(ex.type){case'MCQ':return{optionId:'opt-1'};case'LISTENING':return{optionId:'opt-l1'};case'FILL_BLANK':return{text:'meet'};case'GRAMMAR':return{text:'Subject + To Be + Noun'};case'REORDER':return{tokenIds:['t-1','t-2','t-3']};}}
async function fill(attempt){let current=attempt;while(current.nextExercise)current=(await post(current.id,current.nextExercise.id,answer(current.nextExercise))).attempt;return current;}
function publishY(){const Y=randomUUID(),l=state.lessons.find(l=>l.id===lesson1Id);l.activeRevisionId=Y;l.activeRevision={...l.activeRevision,id:Y,lessonId:lesson1Id,status:'PUBLISHED'};state.exercises.push(...exercisesRows().map(ex=>(()=>{const id=randomUUID();return{...ex,id:randomUUID(),lessonRevisionId:Y,itemRevisionId:id,itemRevision:{...ex.itemRevision,id}};})()));return Y;}

test('A serialized attempt and feedback strip all private grading fields and canaries',async()=>{
 for(const ex of state.exercises){ex.itemRevision.gradingSecret.feedbackData={explanation:'private-rationale-canary'};}
 const attempt=await start();const response=await post(attempt.id,attempt.nextExercise.id,{optionId:'opt-1'});
 const json=JSON.stringify({attempt,response});for(const key of ['gradingData','gradingSecret','feedbackData','correctOptionId','acceptedAnswers','correctOrder','transcript','private-rationale-canary'])assert.ok(!json.includes(key),key);
});
test('B grader uses exact pinned ItemRevision even when a newer draft has opposite key',async()=>{
 const newer={...state.exercises[0].itemRevision,id:randomUUID(),gradingSecret:{schemaVersion:1,gradingData:{correctOptionId:'opt-2'}}};
 db.itemRevision={findFirst:async()=>newer};
 const attempt=await start();const result=await post(attempt.id,attempt.nextExercise.id,{optionId:'opt-1'});
 assert.equal(result.response.isCorrect,true);assert.equal(result.response.contributionUnits,2);assert.equal(result.attempt.exercises[0].itemRevisionId,state.exercises[0].itemRevisionId);
});
test('C own context does not authorize a foreign context attempt for read submit or finalize',async()=>{
 const foreignContext=randomUUID();state.contexts.push({...contextRow(),id:foreignContext,learnerId:otherLearnerId});
 const attempt=await start();state.attempts[0].contextId=foreignContext;
 await assert.rejects(getPracticeAttempt(contextId,lesson1Id,attempt.id,learnerId),rejection('NOT_FOUND',404));
 await assert.rejects(post(attempt.id,attempt.nextExercise.id,{optionId:'opt-1'}),rejection('NOT_FOUND',404));
 await assert.rejects(finalizePracticeAttempt(contextId,lesson1Id,attempt.id,{operationKey:randomUUID()},learnerId),rejection('NOT_FOUND',404));
 assert.equal(state.responses.length,0);assert.equal(state.completions.length,0);
});
test('D ASSESSMENT membership and blueprint-pinned items cannot enter Practice queue',async()=>{
 state.exercises[0].item.origin='ASSESSMENT';state.exercises[1].itemRevision.assessmentBlueprintId=randomUUID();
 const attempt=await start();assert.equal(attempt.nCore,3);assert.ok(attempt.exercises.every(x=>!['ex-mcq-1','ex-fill-2'].includes(x.id)));
 await assert.rejects(post(attempt.id,'ex-mcq-1',{optionId:'opt-1'}),rejection('INVALID_QUEUE_EXERCISE',400));assert.equal(state.responses.length,0);
});
test('E client correctness/score and unknown answer fields are rejected; valid wrong input stays wrong',async()=>{
 const attempt=await start();
 await assert.rejects(submitPracticeResponse(contextId,lesson1Id,attempt.id,{operationKey:randomUUID(),lessonExerciseId:attempt.nextExercise.id,input:{optionId:'opt-2'},isCorrect:true,score:100},learnerId),rejection('VALIDATION_ERROR',400));
 await assert.rejects(post(attempt.id,attempt.nextExercise.id,{optionId:'opt-2',isCorrect:true}),rejection('VALIDATION_ERROR',400));
 const result=await post(attempt.id,attempt.nextExercise.id,{optionId:'opt-2'});assert.equal(result.response.isCorrect,false);assert.equal(result.response.contributionUnits,0);
});
test('F finalized attempt accepts exact committed replay but no new response or finalize mutation',async()=>{
 const attempt=await fill(await start());const operationKey=randomUUID();await finalizePracticeAttempt(contextId,lesson1Id,attempt.id,{operationKey},learnerId);
 const before=structuredClone(state.responses);await assert.rejects(post(attempt.id,attempt.exercises[0].id,{optionId:'opt-2'}),rejection('ATTEMPT_ALREADY_FINALIZED',409));
 await assert.rejects(finalizePracticeAttempt(contextId,lesson1Id,attempt.id,{operationKey:randomUUID()},learnerId),rejection('ATTEMPT_ALREADY_FINALIZED',409));
 const replay=await finalizePracticeAttempt(contextId,lesson1Id,attempt.id,{operationKey},learnerId);assert.equal(replay.attempt.isCompleted,true);assert.deepEqual(state.responses,before);assert.equal(state.completions.length,1);
});
test('H reading completion never supplies LessonCompletion to the real sequential gate',async()=>{
 await mutateLessonConsumption(contextId,lesson1Id,{action:'start',expectedPublishedRevisionId:revision1Id},learnerId);
 await mutateLessonConsumption(contextId,lesson1Id,{action:'complete',expectedPublishedRevisionId:revision1Id},learnerId);
 const catalogue=await loadLearnerCatalogue(contextId,learnerId);const next=catalogue.units.flatMap(u=>u.lessons).find(l=>l.id===lesson2Id);
 assert.equal(next.isLocked,true);assert.equal(state.completions.length,0);assert.equal(state.attempts.length,0);
});
test('I stale unfinished redo fails response and finalize409 while committed X replays',async()=>{
 const first=await fill(await start()),op=randomUUID();await finalizePracticeAttempt(contextId,lesson1Id,first.id,{operationKey:op},learnerId);
 const redo=await fill(await start()),open=await start();const savedOp=randomUUID();await post(open.id,open.nextExercise.id,{optionId:'opt-1'},savedOp);
 publishY();const before={responses:state.responses.length,completions:state.completions.length,receipts:state.commandReceipts.length};
 await assert.rejects(finalizePracticeAttempt(contextId,lesson1Id,redo.id,{operationKey:randomUUID()},learnerId),rejection('PUBLICATION_CHANGED',409));
 await assert.rejects(post(open.id,'ex-fill-2',{text:'meet'}),rejection('PUBLICATION_CHANGED',409));
 assert.deepEqual({responses:state.responses.length,completions:state.completions.length,receipts:state.commandReceipts.length},before);
 assert.equal((await post(open.id,open.nextExercise.id,{optionId:'opt-1'},savedOp)).attempt.isStale,true);
 assert.equal((await finalizePracticeAttempt(contextId,lesson1Id,first.id,{operationKey:op},learnerId)).attempt.isCompleted,true);
});
test('latest player attempt resumes an unfinished current revision redo after an older completion',async()=>{
 const first=await fill(await start());await finalizePracticeAttempt(contextId,lesson1Id,first.id,{operationKey:randomUUID()},learnerId);
 const redo=await start();state.attempts.find(a=>a.id===redo.id).startedAt=new Date(Date.now()+5000);
 const latest=await loadLatestPracticeAttempt(contextId,lesson1Id,learnerId);assert.equal(latest.id,redo.id);assert.equal(latest.isCompleted,false);
});
test('new current publication page does not resume a stale unfinished X attempt',async()=>{
 await start();publishY();const latest=await loadLatestPracticeAttempt(contextId,lesson1Id,learnerId);assert.equal(latest,null);
});

test('text graders honor the complete approved D1 contract for both FILL_BLANK and GRAMMAR',()=>{
 for(const type of ['FILL_BLANK','GRAMMAR']){
  const sensitive={acceptedAnswers:['Café.','Another  answer'],caseSensitive:true};
  const grade=(text,secret=sensitive)=>gradePracticeExercise(type,{},secret,{text}).isCorrect;
  assert.equal(grade('  Cafe\u0301.  '),true);assert.equal(grade('café.'),false);assert.equal(grade('café.',{...sensitive,caseSensitive:false}),true);
  assert.equal(grade('Cafe.'),false);assert.equal(grade('Café'),false);assert.equal(grade('Another  answer'),true);assert.equal(grade('Another answer'),false);
  assert.equal(grade('Ａ',{acceptedAnswers:['A'],caseSensitive:false}),false,'NFC must not become NFKC');
 }
});
test('missing or non-object response input is a validation error before hashing or writes',async()=>{
 const attempt=await start();for(const input of [undefined,null,[],123])await assert.rejects(post(attempt.id,attempt.nextExercise.id,input),rejection('VALIDATION_ERROR',400));assert.equal(state.responses.length,0);
});

for(const action of ['read','submit','finalize'])test(`C ${action} cannot authorize through another learner's real context`,async()=>{
 const attempt=action==='finalize'?await fill(await start()):await start();
 const foreignContext=randomUUID();state.contexts.push({...contextRow(),id:foreignContext,learnerId:otherLearnerId});state.attempts.find(a=>a.id===attempt.id).contextId=foreignContext;
 const operation=action==='read'?getPracticeAttempt(foreignContext,lesson1Id,attempt.id,learnerId):action==='submit'?submitPracticeResponse(foreignContext,lesson1Id,attempt.id,{operationKey:randomUUID(),lessonExerciseId:attempt.exercises[0].id,input:{optionId:'opt-1'}},learnerId):finalizePracticeAttempt(foreignContext,lesson1Id,attempt.id,{operationKey:randomUUID()},learnerId);
 await assert.rejects(operation,rejection('NOT_FOUND',404));
});

test('unsupported private grading schema fails closed before persisting any response',async()=>{
 const attempt=await start();state.exercises[0].itemRevision.gradingSecret.schemaVersion=2;
 await assert.rejects(post(attempt.id,attempt.nextExercise.id,{optionId:'opt-1'}),rejection('GRADING_CONFIG_ERROR',500));assert.equal(state.responses.length,0);
});
