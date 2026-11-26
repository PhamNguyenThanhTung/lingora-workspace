import { open, stack, shot } from './lib.mjs';
const { browser, page, errors } = await open('teacher');
await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
const dump = async (sel) => (await page.$$eval(`${sel} input, ${sel} textarea, ${sel} select, ${sel} button`, (els) => els.map((e) => `${e.tagName}|${e.type||''}|${e.name||''}|#${e.id||''}|${e.getAttribute('aria-label')||''}|${e.placeholder||''}|${(e.innerText||'').slice(0,40).replace(/\n/g,' ')}`))).join('\n');
await page.getByRole('button', { name: '+ Thêm đoạn văn' }).click();
console.log('=== after add paragraph\n' + await dump('form, body'));
await shot(page, 'A3-paragraph', 'desktop');
for (const [btn, modal, code] of [['+ Thêm từ vựng', '#vocabModalBackdrop', 'A4-vocab-modal'], ['+ Thêm bài tập', '#exerciseModalBackdrop', 'A5-exercise-modal']]) {
  await page.getByRole('button', { name: btn, exact: true }).click(); await page.waitForTimeout(400);
  console.log(`=== ${modal}\n` + await dump(modal));
  console.log((await page.locator(modal).innerText()).slice(0, 1200));
  await shot(page, code, 'desktop');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  if (await page.locator(modal).isVisible()) { console.log('NOTE: Escape does not close ' + modal); await page.locator(`${modal} button`, { hasText: /Hủy|Đóng/ }).first().click(); }
}
console.log('errors', errors);
await browser.close();
