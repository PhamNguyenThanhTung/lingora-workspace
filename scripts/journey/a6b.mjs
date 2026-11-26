import { open, stack } from './lib.mjs';
const { browser, page } = await open('teacher');
await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
await page.click('#btnAddExercise');
console.log('radio0 checked by default:', await page.isChecked('#radioMcqCorrectOption-0'), 'radio1:', await page.isChecked('#radioMcqCorrectOption-1'));
await browser.close();
