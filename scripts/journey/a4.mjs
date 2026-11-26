import { open, stack, shot } from './lib.mjs';
const { browser, page, errors } = await open('teacher');
await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
const dump = async (sel) => (await page.$$eval(`${sel} input, ${sel} textarea, ${sel} select`, (els) => els.filter(e=>e.offsetParent).map((e) => `${e.tagName}|${e.type||''}|#${e.id||''}|${e.getAttribute('aria-label')||''}|${e.placeholder||''}`))).join('\n');
await page.getByRole('button', { name: '+ Thêm từ vựng' }).click();
await page.locator('#tabVocabCreate').click(); await page.waitForTimeout(300);
console.log('=== vocab create\n' + await dump('#vocabModalBackdrop'));
await shot(page, 'A4-vocab-create', 'desktop');
await page.locator('#btnCancelVocabModal').click();
await page.getByRole('button', { name: '+ Thêm bài tập', exact: true }).click();
for (const t of ['FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR']) {
  await page.selectOption('#selectExerciseType', t); await page.waitForTimeout(300);
  console.log(`=== ${t}\n` + await dump('#exerciseModalBackdrop'));
  await shot(page, `A5-exercise-${t}`, 'desktop');
}
console.log('errors', errors); await browser.close();
