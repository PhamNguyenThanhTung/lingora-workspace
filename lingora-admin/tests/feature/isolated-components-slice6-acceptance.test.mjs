import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIsolatedServer} from './isolated-server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
let browser,server;
before(async()=>{server=await startIsolatedServer(3022);browser=await chromium.launch({headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await server?.close();});
const uuid=n=>`70000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const exercise=(type,gradingData,promptData)=>({id:uuid(1),itemId:uuid(2),itemRevisionId:uuid(3),position:1,isCore:true,type,promptData:{prompt:'Original prompt',...promptData},gradingData,feedbackData:null});
const vocab={id:uuid(4),vocabularyId:uuid(5),position:1,isCore:true,displaySnapshot:{schemaVersion:1,languageId:uuid(6),canonicalForm:'Historical term',meaningLabels:{vi:'Nghĩa gốc'},phonetic:null,partOfSpeech:null,example:null}};
async function withSeed(ex,run){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(3500);
 try{
 await page.goto('http://127.0.0.1:3022/?state=page-teacher-draft-wire');await page.locator('#lessonDraftForm').waitFor();
 const {initialLesson:base}=await page.evaluate(()=>window.__PAGE_PROPS__);
 const dto={...base,rowVersion:'10',exercises:[ex],vocabulary:[vocab]};const path=`/api/teacher/lessons/${base.id}/draft`;
 let calls=[],respond=route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dto})});
 await page.route('**/api/**',async route=>{const r=route.request();calls.push({path:new URL(r.url()).pathname,method:r.method(),body:r.postDataJSON()});await respond(route);});
 await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();
 await run({page,dto,path,calls,setRespond:f=>{respond=f;}});
 }finally{await context.close();}
}
test('REORDER edit preserves a nontrivial saved correctOrder and allows explicit order changes',async()=>withSeed(
 exercise('REORDER',{correctOrder:['b','a']},{tokens:[{id:'a',text:'two'},{id:'b',text:'one'}]}),async({page,calls})=>{
 await page.locator('#btnEditExercise-0').click();await page.locator('#inputExercisePrompt').fill('Edited prompt');await page.locator('#btnSaveExerciseModal').click();
 await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();
 assert.deepEqual(calls.at(-1).body.exercises[0].gradingData.correctOrder,['b','a']);
 await page.locator('#btnEditExercise-0').click();await page.locator('#inputReorderCorrectOrder').fill('a\nb');await page.locator('#btnSaveExerciseModal').click();
 await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();assert.deepEqual(calls.at(-1).body.exercises[0].gradingData.correctOrder,['a','b']);
}));
for(const type of ['FILL_BLANK','GRAMMAR'])test(`${type} edit preserves commas inside accepted answers`,async()=>withSeed(
 exercise(type,{acceptedAnswers:['Hello, world','yes, please'],caseSensitive:false},type==='FILL_BLANK'?{sentence:'Say ____'}:{sourceSentence:'Hello',targetPattern:'Greeting'}),async({page,calls})=>{
 await page.locator('#btnEditExercise-0').click();await page.locator('#btnSaveExerciseModal').click();await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();
 assert.deepEqual(calls.at(-1).body.exercises[0].gradingData.acceptedAnswers,['Hello, world','yes, please']);
}));
test('Vocabulary membership position/core edit preserves source identity and snapshot display',async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,calls})=>{
 await page.locator('#inputVocabPositionRow-0').fill('9');await page.locator('#inputVocabCoreRow-0').uncheck();await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();
 assert.deepEqual(calls.at(-1).body.vocabulary,[{sourceLinkId:uuid(4),position:9,isCore:false}]);assert.equal(await page.locator('#vocabTerm-0').innerText(),'Historical term');
}));
for(const status of [400,409,503])test(`Draft ${status} preserves staged child content and retries exact callback`,async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,calls,setRespond,dto,path})=>{
 setRespond(route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({error:{code:status===409?'DUPLICATE_EXERCISE_POSITION':'VALIDATION_ERROR',message:'Recoverable server rejection'}})}));
 await page.locator('#inputDraftTitleVi').fill('Retain typed title');await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveError').waitFor();
 assert.equal(await page.locator('#inputDraftTitleVi').inputValue(),'Retain typed title');assert.equal(await page.locator('#exerciseRow-0').count(),1);assert.equal(await page.locator('#vocabTerm-0').innerText(),'Historical term');assert.equal(await page.locator('#draftSaveSuccess').count(),0);
 const first=calls.at(-1);setRespond(route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{...dto,rowVersion:'11',currentDraft:{...dto.currentDraft,title:{vi:'SERVER ACCEPTED'}},exercises:[{...dto.exercises[0],id:uuid(11),promptData:{...dto.exercises[0].promptData,prompt:'SERVER CHILD'}}]}})}));
 await page.locator('#btnSaveDraft').click();await page.locator('#draftSaveSuccess').waitFor();assert.deepEqual(calls.at(-1),first);assert.equal(first.path,path);assert.equal(first.method,'PATCH');assert.equal(await page.locator('#inputDraftTitleVi').inputValue(),'SERVER ACCEPTED');assert.match(await page.locator('#exerciseRow-0').innerText(),/SERVER CHILD/);
}));
for(const status of [401,403])test(`Draft ${status} with staged children enters the accepted terminal auth view`,async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,setRespond})=>{
 setRespond(route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({error:{code:status===401?'UNAUTHENTICATED':'ACCOUNT_INACTIVE',message:'Session ended'}})}));
 await page.locator('#btnSaveDraft').click();if(status===401){await page.locator('#sessionLostModal').waitFor();assert.equal(await page.locator('#appContainer').getAttribute('inert'),'');assert.equal(await page.locator('#draftSaveSuccess').count(),0);}else{await page.getByRole('heading',{name:/Truy cập bị từ chối/}).waitFor();assert.equal(await page.locator('#lessonDraftForm').count(),0);}
}));
test('REVISION_CONFLICT blocks repeated saves until authoritative content reload',async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,calls,setRespond,dto})=>{
 setRespond(route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:{code:'REVISION_CONFLICT',message:'Revision changed'}})}));
 await page.locator('#btnSaveDraft').click();await page.locator('#btnReloadLessonToken').waitFor();assert.equal(await page.locator('#btnSaveDraft').isDisabled(),true);
 setRespond(route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{...dto,rowVersion:'12',exercises:[],vocabulary:[]}})}));
 await page.locator('#btnReloadLessonToken').click();await page.waitForFunction(()=>!document.querySelector('#btnSaveDraft').disabled);
 assert.equal(calls.at(-1).method,'GET');assert.equal(await page.locator('#exerciseRow-0').count(),0);assert.equal(await page.locator('#vocabTerm-0').count(),0);
}));
test('Pending child save locks edits/navigation and suppresses synchronous duplicate submissions',async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,calls,setRespond,dto})=>{
 let release;const held=new Promise(resolve=>{release=resolve;});setRespond(async route=>{await held;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:dto})});});
 try{
 const before=calls.length;await page.evaluate(()=>{document.querySelector('#btnSaveDraft').click();document.querySelector('#btnSaveDraft').click();});
 await page.waitForFunction(()=>document.querySelector('#btnSaveDraft').disabled);assert.equal(calls.length,before+1);
 for(const selector of ['#btnAddExercise','#btnEditExercise-0','#btnRemoveExercise-0','#btnAddVocabulary','#btnRemoveVocab-0','#inputVocabPositionRow-0'])assert.equal(await page.locator(selector).isDisabled(),true,selector);
 const url=page.url();assert.equal(await page.locator('#btnBackToMyLessons').getAttribute('aria-disabled'),'true');await page.locator('#btnBackToMyLessons').dispatchEvent('click');assert.equal(page.url(),url);
 }finally{release();}await page.locator('#draftSaveSuccess').waitFor();
}));
for(const status of [503,401,403])test(`Vocabulary lookup ${status} has recoverable input or accepted terminal auth view`,async()=>withSeed(
 exercise('MCQ',{correctOptionId:'a'},{options:[{id:'a',text:'A'},{id:'b',text:'B'}]}),async({page,setRespond})=>{
 setRespond(route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({error:{code:'LOOKUP_FAILED',message:'Lookup rejected'}})}));
 await page.locator('#btnAddVocabulary').click();await page.locator('#inputVocabSearch').fill('Retained lookup');await page.locator('#btnSearchVocab').click();
 if(status===401)await page.locator('#sessionLostModal').waitFor();
 else if(status===403)await page.getByRole('heading',{name:/Truy cập bị từ chối/}).waitFor();
 else {await page.locator('#errorVocabModal').waitFor();assert.equal(await page.locator('#inputVocabSearch').inputValue(),'Retained lookup');setRespond(route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[]})}));await page.locator('#btnSearchVocab').click();await page.waitForFunction(()=>!document.querySelector('#btnSearchVocab').disabled);assert.equal(await page.locator('#inputVocabSearch').inputValue(),'Retained lookup');}
}));
