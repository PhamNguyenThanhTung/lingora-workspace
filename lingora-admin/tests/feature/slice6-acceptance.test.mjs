import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFixture} from './harness/lessons-fixture.mjs';
import {saveTeacherLessonDraft,getTeacherLessonDetail,listTeacherAssignedLessons} from '../../src/server/lessons/index.ts';
import {exerciseInputSchema} from '../../src/server/lessons/content.ts';
const id=n=>`80000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const actor=id(1),other=id(2),course=id(3),unit=id(4),lesson=id(5),assignment=id(6),episode=id(7),lang=id(8);
const mcq={position:1,isCore:true,type:'MCQ',promptData:{prompt:'Question',options:[{id:'a',text:'Yes'},{id:'b',text:'No'}]},gradingData:{correctOptionId:'a'}};
const createVocab={canonicalForm:'Hello',senseKey:'greeting',meaningLabels:{vi:'Xin chào'}};
function setup(){
 const f=lessonsFixture();
 f.state.accounts.set(actor,{id:actor,role:'TEACHER',status:'ACTIVE'});f.state.accounts.set(other,{id:other,role:'TEACHER',status:'ACTIVE'});
 f.state.courses.set(course,{id:course,names:{vi:'DEV'},languageId:lang});f.state.units.set(unit,{id:unit,courseId:course,position:1,code:'DEV',names:{vi:'DEV'}});
 f.state.lessons.set(lesson,{id:lesson,unitId:unit,position:1,isRequired:true,availability:'PLANNED',rowVersion:1n,activeRevisionId:null});
 f.state.assignments.set(assignment,{id:assignment,lessonId:lesson,currentTeacherId:actor,scopeGeneration:1n});f.state.histories.set(episode,{id:episode,assignmentId:assignment,sequenceNo:1,nextTeacherId:actor,scopeGeneration:1n});
 return f;
}
const body=(f,extra={})=>({title:{vi:'Draft'},contentBlocks:[],expectedRowVersion:f.state.lessons.get(lesson).rowVersion.toString(),...extra});
async function seeded(){const f=setup();const r=await saveTeacherLessonDraft(actor,lesson,body(f,{exercises:[mcq],vocabulary:[{create:createVocab,position:1,isCore:true}]}),f.db);assert.equal(r.status,200);return f;}
const first=m=>[...m.values()][0];
const corruptions={
 'invalid type-specific payload':f=>{first(f.state.itemRevisions).promptData={prompt:'Legacy unknown shape'};},
 'item-owned media bindings':f=>{f.state.mediaBindings.set(id(20),{id:id(20),itemRevisionId:first(f.state.itemRevisions).id,lessonRevisionId:null});},
 'orphan authored item':f=>{const ir=first(f.state.itemRevisions);f.state.itemRevisions.set(id(21),{...structuredClone(ir),id:id(21),revisionNo:2});},
 'foreign authoring revision':f=>{first(f.state.itemRevisions).authoringLessonRevisionId=id(22);},
 'invalid display snapshot':f=>{first(f.state.lessonVocabularyLinks).displaySnapshot.meaningLabels=null;},
 'foreign vocabulary language':f=>{first(f.state.vocabularyConcepts).languageId=id(23);},
 'foreign snapshot language':f=>{first(f.state.lessonVocabularyLinks).displaySnapshot.languageId=id(23);},
 'item assessment binding':f=>{first(f.state.itemRevisions)._count={assessmentVersionItems:1};},
};
for(const [label,corrupt]of Object.entries(corruptions))for(const explicitEmpty of [false,true])test(`Unsupported ${label}: detail read-only and ${explicitEmpty?'empty':'omitted'} save rejects with no changes`,async()=>{
 const f=await seeded();corrupt(f);const before=structuredClone(f.state);
 const detail=await getTeacherLessonDetail(actor,lesson,f.db);assert.equal(detail.status,200);assert.equal(detail.data.data.isEditable,false);
 const r=await saveTeacherLessonDraft(actor,lesson,body(f,explicitEmpty?{exercises:[],vocabulary:[]}:{}),f.db);
 assert.equal(r.status,409);assert.equal(r.error.code,'UNSUPPORTED_DRAFT_CONTENT');assert.deepEqual(f.state,before);
});
test('Created revision relation counts reflect persisted child rows and assigned list stays editable',async()=>{
 const f=await seeded();const rev=await f.db.lessonRevision.findFirst({where:{lessonId:lesson},include:{_count:{select:{exercises:true,vocabularyLinks:true,authoredItemRevisions:true}}}});
 assert.equal(rev._count.exercises,1);assert.equal(rev._count.vocabularyLinks,1);assert.equal(rev._count.authoredItemRevisions,1);
 const list=await listTeacherAssignedLessons(actor,f.db);assert.equal(list.data.data[0].isEditable,true);
});
test('Canonical UUID values accepted by existing domain stay accepted for new child selectors',()=>{
 assert.equal(exerciseInputSchema.safeParse({...mcq,sourceExerciseId:'00000000-0000-0000-0000-000000000050'}).success,true);
});
test('Vocabulary identity appearing with conflicting metadata before persistence rejects and rolls back',async()=>{
 const f=setup();let calls=0;const find=f.db.vocabularyConcept.findUnique;
 f.db.vocabularyConcept.findUnique=async q=>{if(q.where.languageId_normalizedForm_senseKey&&++calls===2){f.state.vocabularyConcepts.set(id(30),{id:id(30),languageId:lang,canonicalForm:'Hello',normalizedForm:'hello',senseKey:'greeting',meaningLabels:{vi:'CONCURRENT DIFFERENT'},phonetic:null,partOfSpeech:null,example:null});}return find(q);};
 const r=await saveTeacherLessonDraft(actor,lesson,body(f,{vocabulary:[{create:createVocab,position:1,isCore:true}]}),f.db);
 assert.equal(r.status,409);assert.equal(r.error.code,'VOCABULARY_IDENTITY_CONFLICT');assert.equal(f.state.revisions.size,0);assert.equal(f.state.lessonVocabularyLinks.size,0);assert.equal(f.state.lessons.get(lesson).rowVersion,1n);
});
test('Retained vocabulary snapshot remains exact when global meaning changes; old identities and rows unchanged',async()=>{
 const f=await seeded();first(f.state.vocabularyConcepts).meaningLabels={vi:'GLOBAL NEW',fr:'Bonjour'};const before=structuredClone(f.state);
 const r=await saveTeacherLessonDraft(actor,lesson,body(f),f.db);assert.equal(r.status,200);
 for(const name of ['revisions','itemIdentities','itemRevisions','itemGradingSecrets','lessonExercises','vocabularyConcepts','lessonVocabularyLinks'])for(const [key,row]of before[name])assert.deepEqual(f.state[name].get(key),row);
 assert.deepEqual([...f.state.lessonVocabularyLinks.values()][1].displaySnapshot,first(before.lessonVocabularyLinks).displaySnapshot);
});
test('Child save for unassigned Teacher is opaque with current and guessed tokens and changes nothing',async()=>{
 const f=await seeded(),before=structuredClone(f.state);for(const token of ['1','2','999']){const r=await saveTeacherLessonDraft(other,lesson,body(f,{expectedRowVersion:token,exercises:[mcq]}),f.db);assert.equal(r.status,404);}assert.deepEqual(f.state,before);
});
test('Single-line answer contract rejects embedded newline instead of allowing lossy editor round trips',()=>{
 assert.equal(exerciseInputSchema.safeParse({position:1,isCore:true,type:'GRAMMAR',promptData:{prompt:'P',sourceSentence:'S',targetPattern:'T'},gradingData:{acceptedAnswers:['one\ntwo'],caseSensitive:false}}).success,false);
});
test('Invalid shared vocabulary labels cannot be silently filtered into a new snapshot',async()=>{
 const f=setup();f.state.vocabularyConcepts.set(id(40),{id:id(40),languageId:lang,canonicalForm:'Hello',senseKey:'default',meaningLabels:{vi:{bad:'object'}},phonetic:null,partOfSpeech:null,example:null});
 const before=structuredClone(f.state);const r=await saveTeacherLessonDraft(actor,lesson,body(f,{vocabulary:[{vocabularyId:id(40),position:1,isCore:true}]}),f.db);
 assert.equal(r.status,409);assert.equal(r.error.code,'UNSUPPORTED_DRAFT_CONTENT');assert.deepEqual(f.state,before);
});
test('New vocabulary snapshot retains the actual sense, including non-default senses',async()=>{
 const f=await seeded();const r=await getTeacherLessonDetail(actor,lesson,f.db);assert.equal(r.data.data.vocabulary[0].displaySnapshot.senseKey,'greeting');
});
test('Foreign Lesson source membership cannot be substituted for an owned current exercise',async()=>{
 const f=await seeded(),foreignLesson=id(60),foreignAssignment=id(61),foreignEpisode=id(62);
 f.state.lessons.set(foreignLesson,{...f.state.lessons.get(lesson),id:foreignLesson,position:2,rowVersion:1n});
 f.state.assignments.set(foreignAssignment,{id:foreignAssignment,lessonId:foreignLesson,currentTeacherId:other,scopeGeneration:1n});
 f.state.histories.set(foreignEpisode,{id:foreignEpisode,assignmentId:foreignAssignment,sequenceNo:1,nextTeacherId:other,scopeGeneration:1n});
 const otherSave=await saveTeacherLessonDraft(other,foreignLesson,{...body(f,{exercises:[mcq]}),expectedRowVersion:'1'},f.db);assert.equal(otherSave.status,200);
 const before=structuredClone(f.state),foreignId=otherSave.data.data.exercises[0].id;
 const r=await saveTeacherLessonDraft(actor,lesson,body(f,{exercises:[{...mcq,sourceExerciseId:foreignId}]}),f.db);
 assert.equal(r.status,404);assert.equal(r.error.code,'RELATION_NOT_FOUND');assert.deepEqual(f.state,before);
});
test('Distinct vocabulary identity tuples containing underscores remain distinct in one atomic save',async()=>{
 const f=setup();const vocabulary=[{create:{canonicalForm:'alpha_beta',senseKey:'gamma',meaningLabels:{vi:'One'}},position:1,isCore:true},{create:{canonicalForm:'alpha',senseKey:'beta_gamma',meaningLabels:{vi:'Two'}},position:2,isCore:true}];
 const r=await saveTeacherLessonDraft(actor,lesson,body(f,{vocabulary}),f.db);assert.equal(r.status,200);assert.equal(f.state.vocabularyConcepts.size,2);assert.equal(r.data.data.vocabulary.length,2);
});
