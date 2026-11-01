import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),app=path.join(root,'lingora-web');
const service='lingora-web/src/server/lessons/practice-service.ts',shared='lingora-web/src/server/lessons/service.ts',dto='lingora-web/src/server/lessons/dto.ts',player='lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx',page='lingora-web/src/app/learn/[contextId]/[lessonId]/page.tsx';
const files=[service,shared,dto,player,page],originals=new Map(files.map(f=>[f,fs.readFileSync(f)]));
function replace(s,a,b){assert.ok(s.includes(a),'mutation anchor missing: '+a);return s.replace(a,b);}
function within(s,name,mutate){const a=s.indexOf('export async function '+name);assert.ok(a>=0);const next=s.indexOf('\nexport async function ',a+1),b=next<0?s.length:next;return s.slice(0,a)+mutate(s.slice(a,b))+s.slice(b);}
const flags=['--experimental-strip-types','--experimental-test-module-mocks','--import','./tests/feature/harness/server-only.mjs','--test'];
const unit=pattern=>({cmd:'node',args:[...flags,'--test-name-pattern',pattern,'tests/feature/practice-review-regressions.test.mjs'],cwd:app});
const browser=pattern=>({cmd:'node',args:[...flags,'--test-name-pattern',pattern,'tests/feature/practice-components.test.mjs'],cwd:app});
const database=(pattern,env={})=>({cmd:'node',args:['tmp/slice11/local-db-runner.mjs','node',...flags.map(x=>x==='./tests/feature/harness/server-only.mjs'?'./lingora-web/tests/feature/harness/server-only.mjs':x),'--test-name-pattern',pattern,'lingora-web/tests/feature/practice-concurrency.test.mjs'],cwd:root,env});
const ownerBypass=s=>replace(replace(s,'where: { id, learnerId: actorId }','where: { id }'),'!c || c.learnerId !== actorId','!c');
const noPointer=s=>{const re=/    if \(currentLesson.activeRevisionId !== attempt.lessonRevisionId\) \{[\s\S]*?\n    \}/;assert.ok(re.test(s));return s.replace(re,'');};
const cases=[
 {id:'A',edits:{[service]:s=>replace(s,'coreExercises.map(ex => publicExercise(ex))','coreExercises.map(ex => ({...publicExercise(ex), gradingData: ex.itemRevision.gradingSecret?.gradingData}))')},run:unit('^A serialized')},
 {id:'B',edits:{[service]:s=>replace(s,'const secret = queue.nextExercise.itemRevision.gradingSecret;',"const latest = await tx.itemRevision.findFirst({where:{itemId:queue.nextExercise.itemId},orderBy:{revisionNo:'desc'},include:{gradingSecret:true}});\n    const secret = latest?.gradingSecret ?? queue.nextExercise.itemRevision.gradingSecret;")},run:unit('^B grader')},
 ...['read','submit','finalize'].map(action=>({id:`C-${action}`,edits:{[shared]:ownerBypass,...(action==='read'?{}:{[service]:s=>s.replaceAll('where: { id: contextId, learnerId: verifiedUserId }','where: { id: contextId }')})},run:unit(`^C ${action} cannot authorize through`)})),
 {id:'D',edits:{[service]:s=>replace(s,"      item: { origin: 'PRACTICE' },\n      itemRevision: { assessmentBlueprintId: null },",'')},run:unit('^D ASSESSMENT')},
 {id:'E',edits:{[dto]:s=>{const a=s.indexOf('export const responsePostSchema'),b=s.indexOf('export type ResponsePostInput',a);return s.slice(0,a)+replace(s.slice(a,b),'.strict();','.passthrough();')+s.slice(b);},[service]:s=>replace(s,'    const contributionUnits = queue.nextOrdinal === 1','    gradeResult.isCorrect = (input as any).isCorrect ?? gradeResult.isCorrect;\n    const contributionUnits = queue.nextOrdinal === 1')},run:unit('^E client')},
 {id:'F',edits:{[service]:s=>within(s,'submitPracticeResponse',part=>replace(part,"      return fail(409, 'ATTEMPT_ALREADY_FINALIZED', 'Phiên luyện tập đã hoàn thành, không thể ghi nhận thêm câu trả lời.');",`      const extra = await tx.lessonResponse.create({data:{attemptId,lessonRevisionId:attempt.lessonRevisionId,lessonExerciseId:attempt.responses[0].lessonExerciseId,responseOrdinal:2,queuePosition:attempt.responses.length+1,operationKey:input.operationKey,input:input.input as Prisma.InputJsonValue,inputHash,isCorrect:false,contributionUnits:0,respondedAt:await clock(tx)}});
      return {response:{...extra,respondedAt:extra.respondedAt.toISOString(),formativeFeedback:'Bad finalized append'},attempt:await buildAttemptDto(tx,{...attempt,responses:[...attempt.responses,extra]},currentLesson.activeRevisionId)};`))},run:unit('^F finalized')},
 {id:'G-submit',edits:{[player]:s=>replace(s,'onClick={handleSubmitResponse}','onClick={() => undefined}')},run:browser('^Practice UI: Start attempt')},
 {id:'G-finalize',edits:{[player]:s=>replace(s,'onClick={handleFinalizeAttempt}','onClick={() => undefined}')},run:browser('^Practice UI: Start attempt')},
 {id:'H',edits:{[shared]:s=>replace(s,'await db.lessonCompletion.findMany','await db.lessonConsumption.findMany')},run:unit('^H reading')},
 {id:'I-response',edits:{[service]:s=>within(s,'submitPracticeResponse',noPointer)},run:unit('^I stale')},
 {id:'I-finalize',edits:{[service]:s=>within(s,'finalizePracticeAttempt',noPointer)},run:unit('^I stale')},
 {id:'J-command-identity',edits:{[player]:s=>replace(s,'    } catch (err: unknown) {\n      setUncertain(true);','    } catch (err: unknown) {\n      pending.current = null;\n      setUncertain(true);')},run:browser('^production callbacks retry')},
 {id:'K-parent-exclusivity',edits:{[service]:s=>s.replaceAll('${candidate.courseId}::uuid FOR SHARE','${candidate.courseId}::uuid FOR UPDATE')},run:database('^real PostgreSQL: independent learners')},
 {id:'L-midnight-clock',edits:{[service]:s=>replace(s,'SELECT instant.ts AS completed_at, (timezone(${account.timezone}, instant.ts))::date AS qualifying_date\n      FROM (SELECT clock_timestamp() AS ts) AS instant','SELECT clock_timestamp() AS completed_at, (timezone(${account.timezone}, clock_timestamp()))::date AS qualifying_date')},run:database('^real PostgreSQL: completion and qualifying')},
 {id:'M-completed-tie',edits:{[service]:s=>replace(s,"orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],","orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }, { id: 'desc' }],")},run:database('^real PostgreSQL: current unfinished redo')},
 {id:'N-hidden-load-failure',edits:{[page]:s=>replace(s,'    const latestAttempt = await loadLatestPracticeAttempt(contextId, lessonId, verified.user.id);','    let latestAttempt = null;\n    try { latestAttempt = await loadLatestPracticeAttempt(contextId, lessonId, verified.user.id); } catch {}')},run:browser('^attempt-only loading failure')},
 {id:'F-attempt-db-guard',edits:{},run:database('^Real PostgreSQL: Immutability triggers',{SLICE11_GUARD_MUTATION:'attempt'})},
 {id:'F-response-db-guard',edits:{},run:database('^Real PostgreSQL: Immutability triggers',{SLICE11_GUARD_MUTATION:'response'})},
];
const selected=process.argv[2]?cases.filter(c=>c.id===process.argv[2]):cases;
assert.ok(selected.length);
const evidencePath='plans/evidence/slice-11/mutations.json';
const old=process.argv[2]&&fs.existsSync(evidencePath)?JSON.parse(fs.readFileSync(evidencePath)).results:[];
const results=old.filter(r=>!selected.some(c=>c.id===r.id));
try{
 for(const c of selected){
  try{
   for(const[file,patch]of Object.entries(c.edits)){const before=originals.get(file).toString(),after=patch(before);assert.notEqual(after,before,'empty mutation');fs.writeFileSync(file,after);}
   const r=spawnSync(c.run.cmd,c.run.args,{cwd:c.run.cwd,env:{...process.env,...c.run.env},encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024});
   const log=(r.stdout||'')+(r.stderr||'');fs.writeFileSync(`tmp/slice11/mutation-${c.id}.log`,log);
   const meaningful=r.status!==0&&!r.error&&!/SyntaxError|ERR_MODULE_NOT_FOUND|Cannot find module/.test(log)&&/not ok|✖|fail [1-9]/.test(log);
   const item={id:c.id,status:meaningful?'KILLED':'SURVIVED_OR_INVALID',exit:r.status,command:[c.run.cmd,...c.run.args],cwd:c.run.cwd,...(c.run.env?{ownedLocalDbMutation:c.run.env}: {})};results.push(item);console.log(`${c.id}: ${item.status}`);assert.ok(meaningful,c.id);
  }finally{for(const[file,bytes]of originals)fs.writeFileSync(file,bytes);}
 }
}finally{
 for(const[file,bytes]of originals){fs.writeFileSync(file,bytes);assert.ok(fs.readFileSync(file).equals(bytes));}
 fs.writeFileSync(evidencePath,JSON.stringify({results,byteExactRestored:true,localDbMutantsDiscarded:true},null,2));
}
