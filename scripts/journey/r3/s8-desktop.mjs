// R3 / S8 — Desktop 1280x800 pass over the learner surfaces (lesson page after completion,
// home, SRS landing) to check Unicode rendering / layout outside mobile.
// Usage: node scripts/journey/r3/s8-desktop.mjs fr|ja
import { open, stack, shot, lines, overflow, loadIds } from './lib3.mjs';

const lang = process.argv[2];
const ids = loadIds();
const l = await open('learner');
const p = l.page;

await p.goto(`${stack.web}/learn/${ids[`${lang}ContextId`]}/${ids[`${lang}LessonId`]}`);
await p.waitForLoadState('load').catch(() => {});
await p.waitForTimeout(2500);
console.log('LESSON (desktop):', await lines(p, 60));
console.log('overflow:', await overflow(p));
await shot(p, 'C8-lesson-desktop', 'desktop', lang);

const review = await p.locator('#practiceFeedbackReview').innerText().catch(() => '(none)');
console.log('REVIEW (desktop):', review.replace(/\n+/g, ' | ').slice(0, 2000));
if (review !== '(none)') await shot(p, 'C8-result-review', 'desktop', lang);

await p.goto(`${stack.web}/review`);
await p.waitForLoadState('load').catch(() => {});
await p.waitForTimeout(2000);
console.log('SRS landing (desktop):', await lines(p, 30));
await shot(p, 'C8-srs-landing', 'desktop', lang);
console.log('console errors:', l.errors);
await l.browser.close();
