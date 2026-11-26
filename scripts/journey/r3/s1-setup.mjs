// R3 / S1 — Admin sets up the French and Japanese curriculum THROUGH THE ADMIN UI:
// languages (fr, ja), JLPT framework + level N5, one course / unit / lesson per language,
// each lesson assigned to the seeded teacher.
import { open, stack, shot, alerts, lines, saveIds, loadIds } from './lib3.mjs';

const a = await open('admin');
const p = a.page;
const go = async (url) => { await p.goto(`${stack.admin}${url}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(600); };

// ---------- languages ----------
await go('/languages');
console.log('LANGUAGES BEFORE:', await lines(p, 40));
await shot(p, 'S1-languages-before', 'desktop', 'fr');
for (const [code, vi, en] of [['fr', 'Tiếng Pháp', 'French'], ['ja', 'Tiếng Nhật', 'Japanese']]) {
  if ((await p.locator(`text=${vi}`).count()) > 0) { console.log(`[lang ${code}] already present`); continue; }
  await p.click('#openCreateBtn');
  await p.fill('#langCodeInput', code);
  await p.fill('#langViInput', vi);
  await p.fill('#langEnInput', en);
  await p.check('#checkLearnable');
  await shot(p, `S1-language-form-${code}`, 'desktop', code === 'fr' ? 'fr' : 'ja');
  await p.click('#submitLanguageFormBtn');
  await p.waitForSelector('#languageFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(800);
  console.log(`[lang ${code}] alerts=`, JSON.stringify(await alerts(p)));
}
await go('/languages');
console.log('LANGUAGES AFTER:', await lines(p, 60));
await shot(p, 'S1-languages-after', 'desktop', 'fr');

// ---------- framework JLPT + level N5 ----------
await go('/frameworks');
console.log('FRAMEWORKS:', await lines(p, 40));
if (!(await p.locator('td:has-text("JLPT")').count())) {
  await p.click('#btnOpenCreateFramework');
  await p.fill('#frameworkCode', 'JLPT');
  await p.fill('#frameworkVersion', '2010');
  await p.fill('#frameworkNameVi', 'Kỳ thi năng lực tiếng Nhật (JLPT)');
  await p.fill('#frameworkNameEn', 'Japanese-Language Proficiency Test');
  await shot(p, 'S1-framework-form', 'desktop', 'ja');
  await p.click('#btnSubmitFramework');
  await p.waitForSelector('#frameworkFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(800);
  console.log('[framework JLPT] alerts=', JSON.stringify(await alerts(p)));
}
await go('/frameworks');
await shot(p, 'S1-frameworks', 'desktop', 'ja');
const fwLinks = await p.$$eval('a[id^=btn-view-levels-]', (els) => els.map((e) => ({ href: e.getAttribute('href'), row: e.closest('tr')?.innerText.replace(/\n+/g, ' ') })));
console.log('FRAMEWORK ROWS:', JSON.stringify(fwLinks));
const jlpt = fwLinks.find((f) => /JLPT/.test(f.row || ''));
const cefr = fwLinks.find((f) => /CEFR/.test(f.row || ''));
saveIds({ jlptFrameworkId: jlpt?.href?.split('/').pop(), cefrFrameworkId: cefr?.href?.split('/').pop() });

await go(jlpt.href);
console.log('JLPT LEVELS:', await lines(p, 30));
for (const [code, pos, vi, en] of [['N5', 1, 'Sơ cấp (N5)', 'Beginner (N5)']]) {
  if (await p.locator(`td:has-text("${code}")`).count()) { console.log(`[level ${code}] present`); continue; }
  await p.click('#btnOpenCreateLevel').catch(async () => p.click('#btnEmptyCreateLevel'));
  await p.fill('#levelCode', code);
  await p.fill('#levelPosition', String(pos));
  await p.fill('#levelLabelVi', vi);
  await p.fill('#levelLabelEn', en);
  await p.click('#btnSubmitLevel');
  await p.waitForSelector('#levelFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(800);
  console.log(`[level ${code}] alerts=`, JSON.stringify(await alerts(p)));
}
await go(jlpt.href);
console.log('JLPT LEVELS AFTER:', await lines(p, 30));
await shot(p, 'S1-jlpt-levels', 'desktop', 'ja');

// ---------- courses ----------
const courses = [
  { lang: 'fr', nameVi: 'Tiếng Pháp cơ bản A1', nameEn: 'French Basics A1', language: 'Tiếng Pháp', framework: /CEFR/, level: /A1/ },
  { lang: 'ja', nameVi: 'Tiếng Nhật sơ cấp N5', nameEn: 'Japanese Beginner N5', language: 'Tiếng Nhật', framework: /JLPT/, level: /N5/ },
];
for (const c of courses) {
  await go('/courses');
  if (await p.locator(`td:has-text("${c.nameVi}")`).count()) { console.log(`[course ${c.lang}] present`); continue; }
  await p.click('#btnOpenCreateCourse');
  await p.fill('#inputCourseNameVi', c.nameVi);
  await p.fill('#inputCourseNameEn', c.nameEn);
  const langOpts = await p.$$eval('#selectCourseLanguage option', (o) => o.map((x) => `${x.value}|${x.textContent.trim()}`));
  console.log(`[course ${c.lang}] language options:`, JSON.stringify(langOpts));
  await p.selectOption('#selectCourseLanguage', { label: langOpts.find((o) => o.includes(c.language)).split('|')[1] });
  await p.waitForTimeout(400);
  const fwOpts = await p.$$eval('#selectCourseFramework option', (o) => o.map((x) => `${x.value}|${x.textContent.trim()}`));
  console.log(`[course ${c.lang}] framework options:`, JSON.stringify(fwOpts));
  await p.selectOption('#selectCourseFramework', fwOpts.find((o) => c.framework.test(o)).split('|')[0]);
  await p.waitForTimeout(800);
  const lvOpts = await p.$$eval('#selectCourseDefaultStartLevel option', (o) => o.map((x) => `${x.value}|${x.textContent.trim()}`));
  console.log(`[course ${c.lang}] level options:`, JSON.stringify(lvOpts));
  await p.selectOption('#selectCourseDefaultStartLevel', lvOpts.find((o) => c.level.test(o)).split('|')[0]);
  await shot(p, 'S1-course-form', 'desktop', c.lang);
  await p.click('#btnSubmitCourseModal');
  await p.waitForSelector('#courseFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1000);
  console.log(`[course ${c.lang}] alerts=`, JSON.stringify(await alerts(p)));
}
await go('/courses');
await shot(p, 'S1-courses', 'desktop', 'fr');
const courseRows = await p.$$eval('a[id^=linkCourseUnits-]', (els) => els.map((e) => ({ href: e.getAttribute('href'), row: e.closest('tr')?.innerText.replace(/\n+/g, ' ') })));
console.log('COURSE ROWS:', JSON.stringify(courseRows, null, 1));
const ids = {};
for (const c of courses) {
  const row = courseRows.find((r) => (r.row || '').includes(c.nameVi));
  ids[`${c.lang}CourseId`] = row.href.split('/')[2];
}
saveIds(ids);
console.log('IDS:', loadIds());

// ---------- units ----------
const units = [
  { lang: 'fr', code: 'FR-A1-U1', level: /A1/, nameVi: 'Chương 1: Chào hỏi và giới thiệu', nameEn: 'Unit 1: Greetings and introductions' },
  { lang: 'ja', code: 'JA-N5-U1', level: /N5/, nameVi: 'Chương 1: Chào hỏi và tự giới thiệu', nameEn: 'Unit 1: Greetings and self-introduction' },
];
for (const u of units) {
  const courseId = loadIds()[`${u.lang}CourseId`];
  await go(`/courses/${courseId}`);
  if (!(await p.locator(`td:has-text("${u.code}")`).count())) {
    await p.click('#btnOpenCreateUnit').catch(async () => p.click('#btnEmptyCreateUnit'));
    await p.waitForTimeout(600);
    const lvOpts = await p.$$eval('#selectUnitLevel option', (o) => o.map((x) => `${x.value}|${x.textContent.trim()}`));
    console.log(`[unit ${u.lang}] level options:`, JSON.stringify(lvOpts));
    await p.selectOption('#selectUnitLevel', lvOpts.find((o) => u.level.test(o)).split('|')[0]);
    await p.fill('#inputUnitPosition', '1');
    await p.fill('#inputUnitCode', u.code);
    await p.fill('#inputUnitNameVi', u.nameVi);
    await p.fill('#inputUnitNameEn', u.nameEn);
    await shot(p, 'S1-unit-form', 'desktop', u.lang);
    await p.click('#btnSubmitUnitModal');
    await p.waitForSelector('#unitFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1000);
    console.log(`[unit ${u.lang}] alerts=`, JSON.stringify(await alerts(p)));
    await go(`/courses/${courseId}`);
  }
  const unitRows = await p.$$eval('a[id^=btn-lessons-unit-]', (els) => els.map((e) => ({ href: e.getAttribute('href'), row: e.closest('tr')?.innerText.replace(/\n+/g, ' ') })));
  console.log(`[unit ${u.lang}] rows:`, JSON.stringify(unitRows));
  saveIds({ [`${u.lang}UnitId`]: unitRows.find((r) => (r.row || '').includes(u.nameVi) || true).href.split('/')[4] });
  await shot(p, 'S1-units', 'desktop', u.lang);
}

// ---------- lessons + assignment ----------
for (const u of units) {
  const { [`${u.lang}CourseId`]: courseId, [`${u.lang}UnitId`]: unitId } = loadIds();
  await go(`/courses/${courseId}/units/${unitId}`);
  console.log(`[lesson ${u.lang}] page:`, await lines(p, 30));
  if (!(await p.locator('tr[id^=row-lesson-]').count())) {
    await p.click('#btnOpenCreateLesson').catch(async () => p.click('#btnEmptyCreateLesson'));
    await p.fill('#inputLessonPosition', '1');
    await p.check('#inputLessonIsRequired').catch(() => {});
    await p.click('#btnSubmitLessonModal');
    await p.waitForSelector('#lessonFormModal', { state: 'detached', timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1000);
    console.log(`[lesson ${u.lang}] alerts=`, JSON.stringify(await alerts(p)));
    await go(`/courses/${courseId}/units/${unitId}`);
  }
  const lessonId = (await p.$eval('tr[id^=row-lesson-]', (e) => e.id)).replace('row-lesson-', '');
  saveIds({ [`${u.lang}LessonId`]: lessonId });
  // assign to teacher
  if (await p.locator(`#btn-assign-lesson-${lessonId}`).count()) {
    await p.click(`#btn-assign-lesson-${lessonId}`);
    await p.waitForTimeout(800);
    const tOpts = await p.$$eval('#selectAssignTeacher option', (o) => o.map((x) => `${x.value}|${x.textContent.trim()}`));
    console.log(`[assign ${u.lang}] teacher options:`, JSON.stringify(tOpts));
    const teacher = tOpts.find((o) => /Lan|teacher/i.test(o)) || tOpts[1];
    await p.selectOption('#selectAssignTeacher', teacher.split('|')[0]);
    await shot(p, 'S1-assign-form', 'desktop', u.lang);
    await p.click('#btnSubmitAssignModal');
    await p.waitForSelector('#lessonAssignModal', { state: 'detached', timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1200);
    console.log(`[assign ${u.lang}] alerts=`, JSON.stringify(await alerts(p)));
  }
  await go(`/courses/${courseId}/units/${unitId}`);
  console.log(`[lesson ${u.lang}] after:`, await lines(p, 40));
  await shot(p, 'S1-lessons', 'desktop', u.lang);
}

console.log('FINAL IDS:', JSON.stringify(loadIds(), null, 1));
console.log('console errors:', a.errors);
await a.browser.close();
