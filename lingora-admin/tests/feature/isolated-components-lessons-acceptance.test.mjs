import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const origin = 'http://127.0.0.1:3017';
const logs = '/home/tung/.codex/task-logs/slice-5-lessons';
let browser, server;
before(async () => { server = await startIsolatedServer(3017); browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); });
after(async () => { await browser?.close(); await server?.close(); });
async function withPage(state, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage(); page.setDefaultTimeout(4000);
  try { await page.goto(`${origin}/?state=${state}`); await page.locator('#appContainer').waitFor(); await run(page); }
  finally { await context.close(); }
}
const fulfill = (route, status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
const returnedDraft = (base, version = '2') => ({ ...base, rowVersion: version,
  highestRevision: { id: 'server-revision', revisionNo: 7, author: { id: 'teacher', displayName: 'SERVER AUTHOR' }, status: 'DRAFT', createdAt: '2026-10-30T09:00:00Z', changeSummary: 'SERVER SUMMARY' },
  currentDraft: { title: { vi: 'SERVER TITLE', en: '' }, contentBlocks: [{ type: 'paragraph', text: 'SERVER BODY' }] },
  revisions: [{ id: 'server-revision', revisionNo: 7, author: { id: 'teacher', displayName: 'SERVER AUTHOR' }, status: 'DRAFT', createdAt: '2026-10-30T09:00:00Z', changeSummary: 'SERVER SUMMARY' }, ...base.revisions],
});

test('Production Admin callbacks call exact create/edit/assignment APIs and reconcile distinct DTOs', { timeout: 20000 }, async () => withPage('page-unit-lessons-wire', async page => {
  const p = await page.evaluate(() => window.__PAGE_PROPS__);
  assert.ok(Array.isArray(p.initialLessons));
  const base = p.initialLessons[0], id = '88888888-8888-4888-8888-888888888888';
  const path = `/api/courses/${p.course.id}/units/${p.unit.id}/lessons`;
  const requests = [];
  let dto = { ...base, id, position: 8, isRequired: false, rowVersion: '4', assignment: null };
  await page.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url()).pathname, method = req.method();
    requests.push({ url, method, body: req.postDataJSON() });
    if (method === 'POST' && url === path) return fulfill(route, 201, { data: dto });
    if (method === 'PATCH' && url === `${path}/${id}`) { dto = { ...dto, position: 9, rowVersion: '5' }; return fulfill(route, 200, { data: dto }); }
    if (method === 'PATCH' && url === `${path}/${id}/assignment`) { dto = { ...dto, rowVersion: '6', assignment: { id: 'assignment', currentTeacher: { id: p.teacherOptions[0].id, displayName: 'SERVER TEACHER', status: 'ACTIVE' }, generation: '7' } }; return fulfill(route, 200, { data: dto }); }
    return fulfill(route, 404, { error: { message: 'Unexpected API' } });
  });
  await page.locator('#btnOpenCreateLesson').click();
  assert.equal(await page.locator('#lessonFormModalBackdrop').evaluate(e => getComputedStyle(e).position), 'fixed');
  await page.locator('#inputLessonPosition').fill('5'); await page.locator('#inputLessonIsRequired').uncheck();
  await page.locator('#btnSubmitLessonModal').click();
  await page.locator(`#row-lesson-${id}`).waitFor();
  assert.equal((await page.locator(`#lesson-pos-${id}`).innerText()).trim(), '#8');
  await page.locator(`#btn-edit-lesson-${id}`).click();
  await page.locator('#inputLessonPosition').fill('6'); await page.locator('#btnSubmitLessonModal').click();
  await page.waitForFunction(id => document.getElementById(`lesson-pos-${id}`)?.textContent?.trim() === '#9', id);
  await page.locator(`#btn-assign-lesson-${id}`).click();
  await page.locator('#selectAssignTeacher').selectOption(p.teacherOptions[0].id);
  await page.locator('#btnSubmitAssignModal').click();
  await page.waitForFunction(id => document.getElementById(`lesson-teacher-name-${id}`)?.textContent === 'SERVER TEACHER', id);
  assert.deepEqual(requests, [
    { url: path, method: 'POST', body: { position: 5, isRequired: false } },
    { url: `${path}/${id}`, method: 'PATCH', body: { position: 6, isRequired: false, expectedRowVersion: '4' } },
    { url: `${path}/${id}/assignment`, method: 'PATCH', body: { teacherId: p.teacherOptions[0].id, expectedRowVersion: '5' } },
  ]);
  assert.ok(await page.locator('.page-content').evaluate(e => parseFloat(getComputedStyle(e).paddingLeft) >= 24));
  await page.screenshot({ path: `${logs}/codex-admin-page.png`, fullPage: true });
}));

test('Production Teacher callback sends exact whitelist and renders authoritative title/body/history', { timeout: 15000 }, async () => withPage('page-teacher-draft-wire', async page => {
  const { initialLesson: base } = await page.evaluate(() => window.__PAGE_PROPS__);
  const calls = [];
  await page.route('**/api/**', async route => {
    const req = route.request(); calls.push({ path: new URL(req.url()).pathname, method: req.method(), body: req.postDataJSON() });
    return fulfill(route, new URL(req.url()).pathname === `/api/teacher/lessons/${base.id}/draft` && req.method() === 'PATCH' ? 200 : 404, { data: returnedDraft(base, '42') });
  });
  await page.locator('#inputDraftTitleVi').fill('CLIENT TITLE'); await page.locator('#inputDraftTitleEn').fill('');
  await page.locator('#inputParagraph-0').fill('CLIENT BODY'); await page.locator('#inputDraftChangeSummary').fill('CLIENT SUMMARY');
  await page.locator('#btnSaveDraft').click(); await page.locator('#draftSaveSuccess').waitFor();
  assert.deepEqual(calls, [{ path: `/api/teacher/lessons/${base.id}/draft`, method: 'PATCH', body: { title: { vi: 'CLIENT TITLE', en: '' }, contentBlocks: [{ type: 'paragraph', text: 'CLIENT BODY' }], changeSummary: 'CLIENT SUMMARY', expectedRowVersion: '1' } }]);
  assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'SERVER TITLE');
  assert.equal(await page.locator('#inputDraftTitleEn').inputValue(), '');
  assert.equal(await page.locator('#inputParagraph-0').inputValue(), 'SERVER BODY');
  assert.match(await page.locator('#row-revision-7').innerText(), /SERVER AUTHOR.*SERVER SUMMARY/s);
  assert.match(await page.locator('#badgeLessonToken').innerText(), /42/);
  await page.screenshot({ path: `${logs}/codex-teacher-page.png`, fullPage: true });
  await page.setViewportSize({ width: 1100, height: 800 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}));

test('Teacher pending save blocks duplicates/navigation; 503 preserves input and retry reconciles', { timeout: 15000 }, async () => withPage('page-teacher-draft-wire', async page => {
  const { initialLesson: base } = await page.evaluate(() => window.__PAGE_PROPS__);
  let release, count = 0; const held = new Promise(r => { release = r; });
  await page.route('**/api/**', async route => { count++; if (count === 1) { await held; return fulfill(route, 503, { error: { message: 'Temporarily unavailable' } }); } return fulfill(route, 200, { data: returnedDraft(base) }); });
  try {
    await page.locator('#inputDraftTitleVi').fill('RETAIN ME'); await page.locator('#btnSaveDraft').click();
    await page.waitForFunction(() => document.querySelector('#btnSaveDraft')?.disabled);
    await page.evaluate(() => { document.querySelector('#lessonDraftForm').requestSubmit(); document.querySelector('#lessonDraftForm').requestSubmit(); document.querySelector('#btnCancelDraft').click(); });
    assert.equal(count, 1); assert.match(page.url(), /page-teacher-draft-wire/);
    assert.equal(await page.locator('#inputDraftTitleVi').isDisabled(), true);
    release(); await page.locator('#draftSaveError').waitFor();
    assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'RETAIN ME'); assert.equal(await page.locator('#draftSaveSuccess').count(), 0);
    await page.locator('#btnSaveDraft').click(); await page.locator('#draftSaveSuccess').waitFor();
    assert.equal(count, 2); assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'SERVER TITLE');
  } finally { release(); }
}));

test('Teacher stale recovery loads latest body and token explicitly before allowing retry', { timeout: 15000 }, async () => withPage('page-teacher-draft-wire', async page => {
  const { initialLesson: base } = await page.evaluate(() => window.__PAGE_PROPS__); let patches = 0, saved;
  await page.route('**/api/**', async route => {
    if (route.request().method() === 'GET') return fulfill(route, 200, { data: returnedDraft(base, '10') });
    patches++; if (patches === 1) return fulfill(route, 409, { error: { code: 'STALE_LESSON' } });
    saved = route.request().postDataJSON(); return fulfill(route, 200, { data: returnedDraft(base, '11') });
  });
  await page.locator('#inputDraftTitleVi').fill('STALE INPUT'); await page.locator('#btnSaveDraft').click();
  await page.locator('#btnReloadLessonToken').waitFor();
  assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'STALE INPUT'); assert.equal(await page.locator('#btnSaveDraft').isDisabled(), true);
  await page.evaluate(() => document.querySelector('#lessonDraftForm').requestSubmit()); assert.equal(patches, 1);
  await page.locator('#btnReloadLessonToken').click();
  await page.waitForFunction(() => document.querySelector('#inputDraftTitleVi')?.value === 'SERVER TITLE');
  assert.equal(await page.locator('#inputParagraph-0').inputValue(), 'SERVER BODY');
  await page.locator('#btnSaveDraft').click(); await page.waitForFunction(() => document.querySelector('#badgeLessonToken')?.textContent?.includes('11'));
  assert.equal(saved.expectedRowVersion, '10'); assert.equal(saved.title.vi, 'SERVER TITLE');
}));

for (const status of [401, 403]) for (const operation of ['save', 'recovery', 'list']) test(`Teacher ${operation} handles ${status} with accepted login/logout flow`, { timeout: 12000 }, async () => withPage(operation === 'list' ? 'page-teacher-lessons-wire&failList=1' : 'page-teacher-draft-wire', async page => {
  let loggedOut = false;
  await page.route('**/api/**', async route => {
    if (new URL(route.request().url()).pathname === '/api/auth/logout') { loggedOut = true; return fulfill(route, 200, { ok: true }); }
    if (operation === 'recovery' && route.request().method() === 'PATCH') return fulfill(route, 409, { error: { code: 'STALE_LESSON' } });
    return fulfill(route, status, { error: { code: status === 403 ? 'ACCOUNT_INACTIVE' : 'UNAUTHENTICATED' } });
  });
  if (operation === 'list') await page.locator('#btnRetryTeacherLessons').click();
  else { await page.locator('#btnSaveDraft').click(); if (operation === 'recovery') { await page.locator('#btnReloadLessonToken').waitFor(); await page.locator('#btnReloadLessonToken').click(); } }
  if (status === 401) { await page.locator('#sessionLostModal').waitFor(); await page.locator('#sessionLoginBtn').click(); await page.waitForFunction(() => window.__lastNavigatedUrl === '/login?expired=1'); }
  else { await page.locator('.holding-card').getByRole('button', { name: 'Đăng xuất', exact: true }).click(); await page.waitForFunction(() => window.__lastNavigatedUrl === '/login'); assert.equal(loggedOut, true); assert.equal(await page.locator('#appContainer').getAttribute('inert'), null); }
}));

test('Production Teacher list uses real assigned props and unsupported draft stays read-only', async () => {
  await withPage('page-teacher-lessons-wire', async page => { assert.equal(await page.locator('[id^="row-teacher-lesson-"]').count(), 1); assert.equal(await page.locator('#navCourses').count(), 0); });
  await withPage('page-teacher-draft-wire&unsupported=1', async page => { await page.locator('#readOnlyReasonBanner').waitFor(); assert.equal(await page.locator('#btnSaveDraft').isDisabled(), true); });
});

for (const code of ['DRAFT_NOT_EDITABLE', 'UNSUPPORTED_DRAFT_CONTENT']) test(`Teacher save ${code} switches to read-only without false success`, async () => withPage('page-teacher-draft-wire', async page => {
  await page.route('**/api/**', route => fulfill(route, 409, { error: { code, message: 'Nội dung đã bị khóa.' } }));
  await page.locator('#btnSaveDraft').click(); await page.locator('#readOnlyReasonBanner').waitFor();
  assert.equal(await page.locator('#btnSaveDraft').isDisabled(), true); assert.equal(await page.locator('#draftSaveSuccess').count(), 0);
}));

test('Production options503 is visible and retry restores assignment choices', async () => withPage('page-unit-lessons-wire&failOptions=1', async page => {
  const p = await page.evaluate(() => window.__PAGE_PROPS__); assert.ok(p.initialTeacherOptionsError);
  await page.locator(`#btn-assign-lesson-${p.initialLessons[0].id}`).click(); await page.locator('#teacherOptionsError').waitFor();
  assert.equal(await page.locator('#btnSubmitAssignModal').isDisabled(), true);
  await page.route('**/api/**', route => fulfill(route, 200, { data: [{ id: '11111111-1111-4111-8111-111111111111', displayName: 'RECOVERED TEACHER' }] }));
  await page.locator('#btnRetryLessonTeachers').click(); await page.locator('#teacherOptionsError').waitFor({ state: 'hidden' });
  assert.match(await page.locator('#selectAssignTeacher').innerText(), /RECOVERED TEACHER/); assert.equal(await page.locator('#btnSubmitAssignModal').isEnabled(), true);
}));

for (const action of ['edit', 'assign']) test(`Admin stale ${action} retains input and refreshes catalogue token before retry`, async () => withPage('page-unit-lessons-wire', async page => {
  const p = await page.evaluate(() => window.__PAGE_PROPS__), base = p.initialLessons[0]; let writes = 0, last;
  await page.route('**/api/**', async route => {
    if (route.request().method() === 'GET') return fulfill(route, 200, { data: [{ ...base, position: 5, rowVersion: '20' }] });
    writes++; last = route.request().postDataJSON();
    return writes === 1 ? fulfill(route, 409, { error: { code: 'STALE_LESSON' } }) : fulfill(route, 200, { data: { ...base, position: 6, rowVersion: '21' } });
  });
  const open = `#btn-${action === 'edit' ? 'edit' : 'assign'}-lesson-${base.id}`, submit = action === 'edit' ? '#btnSubmitLessonModal' : '#btnSubmitAssignModal';
  await page.locator(open).click(); if (action === 'edit') await page.locator('#inputLessonPosition').fill('7');
  await page.locator(submit).click(); await page.getByText(/Làm mới danh sách\./).waitFor();
  if (action === 'edit') assert.equal(await page.locator('#inputLessonPosition').inputValue(), '7');
  await page.locator(action === 'edit' ? '#btnCancelLessonModal' : '#btnCancelAssignModal').click();
  await page.locator('#btnRefreshLessons').click(); await page.waitForFunction(id => document.getElementById(`lesson-pos-${id}`)?.textContent?.trim() === '#5', base.id);
  await page.locator(open).click(); await page.locator(submit).click(); await page.waitForFunction(id => document.getElementById(`lesson-pos-${id}`)?.textContent?.trim() === '#6', base.id);
  assert.equal(last.expectedRowVersion, '20');
}));

for (const status of [401, 403]) test(`Admin mutation ${status} releases editing modal and preserves usable auth controls`, async () => withPage('page-unit-lessons-wire', async page => {
  await page.route('**/api/**', route => fulfill(route, status, { error: { code: 'FORBIDDEN' } }));
  await page.locator('#btnOpenCreateLesson').click(); await page.locator('#btnSubmitLessonModal').click();
  await page.locator('#lessonFormModal').waitFor({ state: 'hidden' });
  if (status === 401) await page.locator('#sessionLostModal').waitFor();
  else { await page.locator('#lessonsForbiddenBanner').waitFor(); assert.equal(await page.locator('#appContainer').getAttribute('inert'), null); await page.locator('#btnLogout').click(); await page.waitForFunction(() => window.__lastNavigatedUrl === '/login'); }
}));
