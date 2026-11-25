// R3 / S3 — Admin reviews the submitted lesson (queue + detail, desktop & mobile),
// approves, publishes and opens it to learners.
// Usage: node scripts/journey/r3/s3-review.mjs fr|ja
import { open, stack, shot, alerts, lines, overflow, loadIds } from './lib3.mjs';

const lang = process.argv[2];
const ids = loadIds();
const lessonId = ids[`${lang}LessonId`];
const courseName = lang === 'fr' ? 'Tiếng Pháp cơ bản A1' : 'Tiếng Nhật sơ cấp N5';

const a = await open('admin');
const p = a.page;
await p.goto(`${stack.admin}/review`);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(800);
console.log('QUEUE:', (await p.locator('#reviewQueueTable').innerText().catch(() => '(no table)')).replace(/\n+/g, ' | '));
await shot(p, 'B1-review-queue', 'desktop', lang);
const rows = await p.$$eval('a[id^=btnViewReview-]', (els) => els.map((e) => ({ href: e.getAttribute('href'), row: e.closest('tr')?.innerText.replace(/\n+/g, ' ') })));
console.log('ROWS:', JSON.stringify(rows, null, 1));
const target = rows.find((r) => (r.row || '').includes(courseName));
if (!target) { console.log('!! no submission found for', courseName); await a.browser.close(); process.exit(1); }

await p.goto(`${stack.admin}${target.href}`);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
const detail = await p.locator('body').innerText();
console.log('DETAIL:', detail.replace(/\n+/g, ' | ').slice(0, 5000));
console.log('MOJIBAKE:', /Ã|â€|ï¿½|�/.test(detail) ? 'FOUND' : 'none');
await shot(p, 'B2-review-detail', 'desktop', lang);
console.log('console errors (review detail):', a.errors);

// approve
await p.fill('#inputReviewComment', lang === 'fr' ? 'Nội dung tiếng Pháp chuẩn, dấu phụ đầy đủ. Duyệt.' : 'Nội dung tiếng Nhật chuẩn, kana/kanji đúng. Duyệt.').catch(() => {});
await p.click('#btnApprove');
await p.waitForTimeout(3000);
console.log('APPROVE alerts:', JSON.stringify(await alerts(p)));
console.log('STATUS:', (await p.locator('body').innerText()).match(/Trạng thái[^\n]*/g));
await shot(p, 'B4-approved', 'desktop', lang);

// publish
await p.click('#btnPublish');
await p.waitForTimeout(3500);
console.log('PUBLISH alerts:', JSON.stringify(await alerts(p)));
await shot(p, 'B6-published', 'desktop', lang);

// open to learners (availability)
if (await p.locator('#btnActivateLesson').count()) {
  await p.click('#btnActivateLesson');
  await p.waitForTimeout(2500);
  console.log('ACTIVATE alerts:', JSON.stringify(await alerts(p)));
} else {
  const courseId = ids[`${lang}CourseId`], unitId = ids[`${lang}UnitId`];
  await p.goto(`${stack.admin}/courses/${courseId}/units/${unitId}`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  if (await p.locator(`#btn-activate-lesson-${lessonId}`).count()) {
    await p.click(`#btn-activate-lesson-${lessonId}`);
    await p.waitForTimeout(2500);
    console.log('ACTIVATE (catalog) alerts:', JSON.stringify(await alerts(p)));
  } else {
    console.log('no activate control found');
  }
  console.log('LESSONS:', await lines(p, 60));
}
await shot(p, 'B7-lesson-available', 'desktop', lang);
console.log('console errors:', a.errors);
await a.browser.close();

// mobile look at the review detail (layout check)
const m = await open('admin', { mobile: true });
await m.page.goto(`${stack.admin}${target.href}`);
await m.page.waitForLoadState('networkidle');
await m.page.waitForTimeout(1500);
console.log('mobile review overflow-x:', await overflow(m.page));
await shot(m.page, 'B2-review-detail', 'mobile', lang);
console.log('console errors (mobile):', m.errors);
await m.browser.close();
