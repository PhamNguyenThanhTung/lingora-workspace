import { open, stack, shot, text } from './lib.mjs';
const t = await open('teacher');
await t.page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await t.page.waitForLoadState('networkidle');
const tx = await text(t.page); console.log(tx.match(/Trạng thái[^\n]*/g));
const i = tx.indexOf('Soạn thảo'); console.log(tx.slice(Math.max(0,i-600), i+200));
console.log(await t.page.locator('[role=alert],[role=status],.alert').allInnerTexts());
console.log('buttons', await t.page.$$eval('#btnSaveDraft,#btnSubmitForReview', (e) => e.map((x) => `${x.id}:${x.disabled}`)));
await shot(t.page, 'B3-teacher-sees-feedback', 'desktop');
console.log('errors', t.errors); await t.browser.close();
