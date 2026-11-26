import { open, stack, shot } from './lib.mjs';
const { browser, page, errors } = await open('teacher');
await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
const modalText = async () => (await page.locator('#exerciseModalBackdrop').innerText()).replace(/\n+/g, ' | ').slice(-350);
const alerts = async () => (await page.locator('[role=alert]').allInnerTexts()).filter(Boolean);
async function tryEx(label, setup) {
  await page.click('#btnAddExercise'); await setup(); await page.click('#btnSaveExerciseModal'); await page.waitForTimeout(500);
  const open = await page.locator('#exerciseModalBackdrop').count();
  console.log(`[${label}] modal stayed open=${!!open}; alerts=${JSON.stringify(await alerts())}; tail=${open ? await modalText() : '-'}`);
  if (open) { await shot(page, `A6-${label}`, 'desktop'); await page.click('#btnCancelExerciseModal'); }
}
await tryEx('empty-prompt', async () => {});
await tryEx('mcq-no-correct', async () => { await page.fill('#inputExercisePrompt', 'Câu hỏi thử'); await page.fill('#inputMcqOptionText-0', 'A'); await page.fill('#inputMcqOptionText-1', 'B'); });
await tryEx('mcq-empty-options', async () => { await page.fill('#inputExercisePrompt', 'Câu hỏi thử'); await page.check('#radioMcqCorrectOption-0'); });
await tryEx('fill-no-blank', async () => { await page.selectOption('#selectExerciseType', 'FILL_BLANK'); await page.fill('#inputExercisePrompt', 'x'); await page.fill('#inputFillBlankSentence', 'No blank here'); await page.fill('#inputFillBlankAnswers', 'a'); });
await tryEx('fill-no-answer', async () => { await page.selectOption('#selectExerciseType', 'FILL_BLANK'); await page.fill('#inputExercisePrompt', 'x'); await page.fill('#inputFillBlankSentence', 'A ____ b'); });
await tryEx('listening-bad-url', async () => { await page.selectOption('#selectExerciseType', 'LISTENING'); await page.fill('#inputExercisePrompt', 'x'); await page.fill('#inputListeningAudioUrl', 'not a url'); });
// page-level: empty titles
await page.fill('#inputDraftTitleVi', ''); await page.fill('#inputDraftTitleEn', '');
await page.click('#btnSaveDraft'); await page.waitForTimeout(800);
console.log('[empty titles save] alerts=', JSON.stringify(await alerts()), 'validity vi:', await page.$eval('#inputDraftTitleVi', e => e.validationMessage));
await shot(page, 'A6-empty-titles', 'desktop');
// vocab duplicate
await page.reload(); await page.waitForLoadState('networkidle');
await page.click('#btnAddVocabulary'); await page.click('#tabVocabCreate');
await page.fill('#inputVocabCanonical', 'mother'); await page.fill('#inputVocabMeaningVi', 'mẹ'); await page.click('#btnSaveVocabModal'); await page.waitForTimeout(800);
console.log('[vocab duplicate] still open=', await page.locator('#vocabModalBackdrop').count(), (await page.locator('#vocabModalBackdrop').innerText().catch(()=> '')).replace(/\n+/g,' | ').slice(-250));
await page.click('#btnSaveDraft').catch(()=>{}); await page.waitForTimeout(800);
console.log('[vocab dup then save] alerts=', JSON.stringify(await alerts()));
console.log('errors', errors); await browser.close();
