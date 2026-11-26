// R3 / S2 — Teacher authors the lesson in the admin lesson editor, saves, reloads to
// check the Unicode round-trip, opens the Lesson Studio preview, then submits for review.
// Usage: node scripts/journey/r3/s2-author.mjs fr|ja
import { open, stack, shot, alerts, lines, overflow, loadIds } from './lib3.mjs';
import { FR, JA, fillLesson } from './content.mjs';

const lang = process.argv[2];
const L = lang === 'fr' ? FR : JA;
const lessonId = loadIds()[`${lang}LessonId`];
console.log('lesson', lang, lessonId);

const t = await open('teacher');
const p = t.page;
await p.goto(`${stack.admin}/my-lessons`);
await p.waitForLoadState('networkidle');
console.log('MY LESSONS:', await lines(p, 60));
await shot(p, 'A1-my-lessons', 'desktop', lang);

await p.goto(`${stack.admin}/my-lessons/${lessonId}`);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(800);
await fillLesson(p, L);
await shot(p, 'A5-editor-filled', 'desktop', lang);
await p.click('#btnSaveDraft');
await p.waitForTimeout(2500);
console.log('SAVE alerts:', JSON.stringify(await alerts(p)));

// Unicode round-trip after reload
await p.reload();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
console.log('RELOAD titleVi:', await p.inputValue('#inputDraftTitleVi'));
for (let i = 0; i < L.paragraphs.length; i++) {
  const v = await p.inputValue(`#inputParagraph-${i}`).catch(() => '(missing)');
  console.log(`  paragraph ${i} match=${v === L.paragraphs[i]}`, v.slice(0, 80));
}
const body = await p.locator('body').innerText();
for (const v of L.vocab) console.log(`  vocab "${v.w}" present=${body.includes(v.w)} phonetic="${v.ph}" present=${body.includes(v.ph)}`);
for (const e of L.exercises) console.log(`  ex ${e.type} prompt present=${body.includes(e.prompt)}`);
console.log('MOJIBAKE markers:', /Ã|â€|ï¿½|�/.test(body) ? 'FOUND' : 'none');
await shot(p, 'A8-editor-after-reload', 'desktop', lang);

// Lesson Studio preview (desktop + mobile)
await p.click('#btnToggleStudioMode');
await p.waitForTimeout(2000);
console.log('STUDIO overflow-x:', await overflow(p));
console.log('STUDIO text:', (await p.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 2500));
await shot(p, 'A9-studio-preview', 'desktop', lang);
console.log('console errors (teacher desktop):', t.errors);
await t.browser.close();

const m = await open('teacher', { mobile: true });
await m.page.goto(`${stack.admin}/my-lessons/${lessonId}`);
await m.page.waitForLoadState('networkidle');
await m.page.waitForTimeout(800);
await m.page.click('#btnToggleStudioMode');
await m.page.waitForTimeout(2000);
console.log('STUDIO mobile overflow-x:', await overflow(m.page));
await shot(m.page, 'A9-studio-preview', 'mobile', lang);
console.log('console errors (teacher mobile):', m.errors);
await m.browser.close();

// submit for review
const s = await open('teacher');
await s.page.goto(`${stack.admin}/my-lessons/${lessonId}`);
await s.page.waitForLoadState('networkidle');
await s.page.waitForTimeout(1000);
await s.page.fill('#inputDraftChangeSummary', L.changeSummary);
await s.page.click('#btnSaveDraft');
await s.page.waitForTimeout(2000);
await s.page.click('#btnSubmitForReview');
await s.page.waitForTimeout(2500);
console.log('SUBMIT alerts:', JSON.stringify(await alerts(s.page)));
console.log('STATUS:', (await s.page.locator('body').innerText()).match(/Trạng thái[^\n]*/g));
await shot(s.page, 'A10-submitted', 'desktop', lang);
console.log('console errors (submit):', s.errors);
await s.browser.close();
