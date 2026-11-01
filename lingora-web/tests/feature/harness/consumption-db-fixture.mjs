import {randomUUID}from'node:crypto';
export async function createFixture(db){
 const id=()=>randomUUID();const f={admin:id(),teacher:id(),a:id(),b:id(),c:id(),lang:id(),framework:id(),level:id(),course:id(),unit:id(),lesson:id(),revision:id(),assignment:id(),episode:id(),ctxA:id(),ctxB:id()};
 await db.language.upsert({where:{code:'en'},create:{code:'en',names:{en:'English'},isUiLocale:true,isLearnable:true},update:{}});
 await db.account.createMany({data:[{id:f.admin,role:'ADMIN',status:'ACTIVE'},{id:f.teacher,role:'TEACHER',status:'ACTIVE'},...[f.a,f.b,f.c].map(id=>({id,role:'LEARNER',status:'ACTIVE'}))]});
 await db.language.create({data:{id:f.lang,code:'local-'+f.lang,names:{en:'Local language'},isLearnable:true,isUiLocale:true}});
 await db.framework.create({data:{id:f.framework,code:'local-'+f.framework,version:'1',names:{en:'Local framework'}}});
 await db.level.create({data:{id:f.level,frameworkId:f.framework,code:'A1',label:{en:'First'},position:1}});
 await db.course.create({data:{id:f.course,languageId:f.lang,frameworkId:f.framework,names:{en:'Local course'},isActive:true,defaultStartLevelId:f.level}});
 await db.unit.create({data:{id:f.unit,courseId:f.course,levelId:f.level,code:'U1',names:{en:'Local unit'},position:1}});
 await db.lesson.create({data:{id:f.lesson,unitId:f.unit,position:1,availability:'PLANNED'}});
 await db.contentAssignment.create({data:{id:f.assignment,createdBy:f.admin,currentTeacherId:f.teacher,lessonId:f.lesson}});
 await db.assignmentHistory.create({data:{id:f.episode,assignmentId:f.assignment,sequenceNo:1,eventType:'ASSIGNED',nextTeacherId:f.teacher,scopeGeneration:1n,changedBy:f.admin}});
 await db.lessonRevision.create({data:{id:f.revision,lessonId:f.lesson,revisionNo:1,assignmentId:f.assignment,creationAssignmentEpisodeId:f.episode,status:'PUBLISHED',submittedBy:f.teacher,submittedAt:new Date(),approvedBy:f.admin,approvedAt:new Date(),title:{en:'Published local X'},contentBlocks:[{type:'paragraph',text:'Local X'}],createdBy:f.teacher,lastEditedBy:f.teacher,publishedBy:f.admin,publishedAt:new Date()}});
 const item=await db.itemIdentity.create({data:{origin:'PRACTICE',createdBy:f.teacher,exactFingerprint:'local-fixture-only'}});
 const ir=await db.itemRevision.create({data:{itemId:item.id,revisionNo:1,type:'MCQ',promptData:{prompt:'Local exact prompt',options:[{id:'a',text:'One'},{id:'b',text:'Two'}]},exactFingerprint:'local-fixture-only',createdBy:f.teacher,creationAssignmentEpisodeId:f.episode,authoringLessonRevisionId:f.revision,frozenAt:new Date()}});
 await db.itemGradingSecret.create({data:{itemRevisionId:ir.id,gradingData:{correctOptionId:'a'}}});
 await db.lessonExercise.create({data:{lessonRevisionId:f.revision,itemId:item.id,itemRevisionId:ir.id,position:1,isCore:true}});
 await db.lesson.update({where:{id:f.lesson},data:{availability:'AVAILABLE',activeRevisionId:f.revision}});
 await db.learningContext.createMany({data:[{id:f.ctxA,learnerId:f.a},{id:f.ctxB,learnerId:f.b}].map(x=>({...x,languageId:f.lang,courseId:f.course,status:'ACTIVE',selectedStartLevelId:f.level,workingLevelId:f.level,startSource:'DEFAULT'}))});
 return f;
}
export const provider=id=>({auth:{getUser:async()=>({data:{user:{id,email_confirmed_at:'2026-01-01T00:00:00Z'}},error:null})}});
export function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
export async function bounded(p,label){let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Timeout: '+label)),8000)})]);}finally{clearTimeout(timer);}}
