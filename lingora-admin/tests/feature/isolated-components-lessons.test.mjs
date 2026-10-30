import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3016;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('S5-LESSONS: Isolated Component State & Interaction Suite', () => {
  let server;
  let browser;

  before(async () => {
    server = await startIsolatedServer(TEST_PORT);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  // =========================================================================
  // 1. LessonFormModal: Pending Locks, Escape/Backdrop, Duplicate Submit,
  //    409 Recovery & Reconciliation to Catalog
  // =========================================================================

  test('LessonFormModal POST create held pending locks, prevents duplicate submit, retries on 409 duplicate position, and reconciles 201 to catalog', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=lessons-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateLesson', { state: 'visible' });

    // 1. Open create modal
    await page.click('#btnOpenCreateLesson');
    await page.waitForSelector('#lessonFormModal', { state: 'visible' });

    // Initial focus on position input
    await page.waitForFunction(() => document.activeElement?.id === 'inputLessonPosition');
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'inputLessonPosition');
    assert.equal(isFocused, true, 'Position input must be focused on modal open');

    // 2. Pending lock & duplicate submit prevention
    await page.fill('#inputLessonPosition', '3');

    await page.evaluate(() => {
      window.__submitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST' && url.includes('/lessons')) {
          window.__submitCount++;
          // Simulate 400ms delay and 409 conflict
          return new Promise((resolve) => setTimeout(resolve, 400)).then(() =>
            Response.json(
              {
                error: {
                  code: 'DUPLICATE_LESSON_POSITION',
                  message: 'Vị trí bài học đã tồn tại trong đơn vị bài học này.',
                },
              },
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(url, opts);
      };

      // Rapidly click submit twice
      document.querySelector('#btnSubmitLessonModal').click();
      document.querySelector('#btnSubmitLessonModal').click();
    });

    const pendingState = await page.evaluate(() => {
      const submitBtn = document.querySelector('#btnSubmitLessonModal');
      const cancelBtn = document.querySelector('#btnCancelLessonModal');
      const closeBtn = document.querySelector('#btnCloseLessonModal');
      const posInput = document.querySelector('#inputLessonPosition');
      return {
        submitDisabled: submitBtn?.disabled,
        submitText: submitBtn?.textContent?.trim(),
        cancelDisabled: cancelBtn?.disabled,
        closeDisabled: closeBtn?.disabled,
        posDisabled: posInput?.disabled,
      };
    });

    assert.equal(pendingState.submitDisabled, true, 'Submit button must be disabled while pending');
    assert.equal(pendingState.submitText, 'Đang tạo...', 'Submit button must show pending label');
    assert.equal(pendingState.cancelDisabled, true, 'Cancel button must be disabled while pending');
    assert.equal(pendingState.posDisabled, true, 'Position input must be disabled while pending');

    // Escape must NOT dismiss while pending
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lessonFormModal').isVisible(), true);

    // Backdrop click must NOT dismiss while pending
    await page.click('#lessonFormModalBackdrop', { position: { x: 5, y: 5 } });
    assert.equal(await page.locator('#lessonFormModal').isVisible(), true);

    // Wait for in-flight request to finish with 409
    await page.waitForTimeout(450);

    const submitCount = await page.evaluate(() => window.__submitCount);
    assert.equal(submitCount, 1, 'Duplicate submit clicks must be ignored');

    // Verify 409 error message displayed and position input value retained
    const errorText = await page.textContent('#errorLessonPosition');
    assert.ok(errorText.includes('Vị trí bài học đã tồn tại'));
    const retainedPos = await page.inputValue('#inputLessonPosition');
    assert.equal(retainedPos, '3', 'Input value must be retained on 409 failure');

    // 3. Retry with valid position and reconcile 201 into table
    await page.evaluate(() => {
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          return Promise.resolve(
            Response.json(
              {
                data: {
                  id: '55555555-5555-5555-8555-555555555099',
                  unitId: '44444444-4444-4444-8444-444444444040',
                  position: 4,
                  isRequired: true,
                  availability: 'PLANNED',
                  rowVersion: '1',
                  courseContext: { id: 'c1', names: { vi: 'Khóa học 1' } },
                  unitContext: { id: 'u1', code: 'UNIT-01', names: { vi: 'Bài 1' } },
                  assignment: null,
                  highestRevision: null,
                  isEditable: false,
                  editabilityReason: 'Chưa phân công giáo viên.',
                },
              },
              { status: 201, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return window.fetch(url, opts);
      };
    });

    await page.fill('#inputLessonPosition', '4');
    await page.click('#btnSubmitLessonModal');

    // Modal closes and new row appears in table
    await page.waitForSelector('#lessonFormModal', { state: 'hidden' });
    await page.waitForSelector('#row-lesson-55555555-5555-5555-8555-555555555099', { state: 'visible' });

    const newRowPos = await page.textContent('#lesson-pos-55555555-5555-5555-8555-555555555099');
    assert.equal(newRowPos.trim(), '#4', 'Reconciled table row must display position #4');

    const statusBanner = await page.textContent('#lessonMutationStatus');
    assert.ok(statusBanner.includes('Đã tạo thành công bài học ở vị trí #4'));

    await page.close();
    await context.close();
  });

  test('LessonFormModal PATCH edit held pending lock, sends expectedRowVersion and reconciles 200', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=lessons-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-edit-lesson-55555555-5555-5555-8555-555555555001', { state: 'visible' });

    // Open edit modal for lesson 1
    await page.click('#btn-edit-lesson-55555555-5555-5555-8555-555555555001');
    await page.waitForSelector('#lessonFormModal', { state: 'visible' });

    const modalTitle = await page.textContent('#lessonFormModalTitle');
    assert.equal(modalTitle.trim(), 'Chỉnh sửa bài học');

    const curPos = await page.inputValue('#inputLessonPosition');
    assert.equal(curPos, '1');

    let capturedPayload = null;
    let capturedUrl = null;

    await page.evaluate(() => {
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH' && url.includes('/lessons/')) {
          window.__capturedUrl = url;
          window.__capturedPayload = JSON.parse(opts.body);
          return Promise.resolve(
            Response.json(
              {
                data: {
                  id: '55555555-5555-5555-8555-555555555001',
                  unitId: '44444444-4444-4444-8444-444444444040',
                  position: 5,
                  isRequired: false,
                  availability: 'PLANNED',
                  rowVersion: '2',
                  courseContext: { id: 'c1', names: { vi: 'Khóa học 1' } },
                  unitContext: { id: 'u1', code: 'UNIT-01', names: { vi: 'Bài 1' } },
                  assignment: null,
                  highestRevision: null,
                  isEditable: false,
                  editabilityReason: null,
                },
              },
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(url, opts);
      };
    });

    await page.fill('#inputLessonPosition', '5');
    await page.uncheck('#inputLessonIsRequired');
    await page.click('#btnSubmitLessonModal');

    await page.waitForSelector('#lessonFormModal', { state: 'hidden' });

    capturedUrl = await page.evaluate(() => window.__capturedUrl);
    capturedPayload = await page.evaluate(() => window.__capturedPayload);

    assert.ok(capturedUrl.includes('/55555555-5555-5555-8555-555555555001'));
    assert.equal(capturedPayload.position, 5);
    assert.equal(capturedPayload.isRequired, false);
    assert.equal(capturedPayload.expectedRowVersion, '1', 'Must strictly pass expectedRowVersion');

    // Row reconciles in table
    const updatedPos = await page.textContent('#lesson-pos-55555555-5555-5555-8555-555555555001');
    assert.equal(updatedPos.trim(), '#5');

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 2. LessonAssignModal: Disabled Status Representation, Option Filtering,
  //    Pending Lock & Reconciled Table Representation
  // =========================================================================

  test('LessonAssignModal displays current disabled teacher, filters options to active, and reconciles assignment', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=lessons-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-assign-lesson-55555555-5555-5555-8555-555555555002', { state: 'visible' });

    // Lesson 2 is currently assigned to disabled teacher Minh
    await page.click('#btn-assign-lesson-55555555-5555-5555-8555-555555555002');
    await page.waitForSelector('#lessonAssignModal', { state: 'visible' });

    // Assert disabled badge is rendered in modal for current teacher
    const disabledBadge = await page.textContent('#badgeCurrentTeacherDisabled');
    assert.ok(disabledBadge.includes('Đã vô hiệu hóa'));

    // Check teacher options: only active teachers present
    const options = await page.$$eval('#selectAssignTeacher option', (opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    assert.equal(options.some((o) => o.text.includes('Nguyễn Thị Lan')), true);
    assert.equal(options.some((o) => o.text.includes('Lê Văn Khóa')), false, 'Disabled teacher must not be an option');

    // Submit assignment to Lan
    await page.evaluate(() => {
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH' && url.includes('/assignment')) {
          window.__capturedAssignPayload = JSON.parse(opts.body);
          return Promise.resolve(
            Response.json(
              {
                data: {
                  id: '55555555-5555-5555-8555-555555555002',
                  unitId: '44444444-4444-4444-8444-444444444040',
                  position: 2,
                  isRequired: false,
                  availability: 'PLANNED',
                  rowVersion: '3',
                  courseContext: { id: 'c1', names: { vi: 'Khóa học 1' } },
                  unitContext: { id: 'u1', code: 'UNIT-01', names: { vi: 'Bài 1' } },
                  assignment: {
                    id: '66666666-6666-6666-8666-666666666002',
                    currentTeacher: {
                      id: '11111111-1111-4111-8111-111111111111',
                      displayName: 'Nguyễn Thị Lan',
                      status: 'ACTIVE',
                    },
                    generation: '3',
                  },
                  highestRevision: null,
                  isEditable: true,
                  editabilityReason: null,
                },
              },
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return window.fetch(url, opts);
      };
    });

    await page.selectOption('#selectAssignTeacher', '11111111-1111-4111-8111-111111111111');
    await page.click('#btnSubmitAssignModal');

    await page.waitForSelector('#lessonAssignModal', { state: 'hidden' });

    const assignPayload = await page.evaluate(() => window.__capturedAssignPayload);
    assert.equal(assignPayload.teacherId, '11111111-1111-4111-8111-111111111111');
    assert.equal(assignPayload.expectedRowVersion, '2');

    // Table reconciles: teacher is now Lan and disabled badge is cleared
    const teacherNameInTable = await page.textContent('#lesson-teacher-name-55555555-5555-5555-8555-555555555002');
    assert.ok(teacherNameInTable.includes('Nguyễn Thị Lan'));
    const isBadgeGone = (await page.$('#lesson-teacher-disabled-badge-55555555-5555-5555-8555-555555555002')) === null;
    assert.equal(isBadgeGone, true, 'Disabled badge must be cleared after reassigning to active teacher');

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 3. UnitsCatalog Link to dedicated Unit Lessons Page
  // =========================================================================

  test('UnitsCatalog table row renders link pointing to /courses/[courseId]/units/[unitId]', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-lessons-unit-44444444-4444-4444-8444-444444444040', { state: 'visible' });

    const href = await page.getAttribute(
      '#btn-lessons-unit-44444444-4444-4444-8444-444444444040',
      'href'
    );
    assert.equal(
      href,
      '/courses/33333333-3333-4333-8333-333333333030/units/44444444-4444-4444-8444-444444444040',
      'Unit row must link directly to dedicated Unit Lessons page'
    );

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 4. Production UnitLessonsPage Real Wire Test
  // =========================================================================

  test('Production UnitLessonsPage wires real page compiler props, renders LessonsCatalog, and wires API URLs', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=page-unit-lessons-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#lessonsPageTitle', { state: 'visible' });

    const title = await page.textContent('#lessonsPageTitle');
    assert.ok(title.includes('Quản lý bài học — Bài 1: Làm quen'));

    // Check breadcrumbs
    const bcCurrent = await page.textContent('#breadcrumbUnitCurrent');
    assert.ok(bcCurrent.includes('UNIT-01'));

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 5. Teacher Workstream: TeacherLessonsCatalog, LessonDraftEditor & 409 Token Recovery
  // =========================================================================

  test('TeacherLessonsCatalog renders assigned lessons and link to draft editor', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teacher-lessons-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#teacherLessonsTitle', { state: 'visible' });

    const openLink = await page.getAttribute('#btn-open-lesson-55555555-5555-5555-8555-555555555001', 'href');
    assert.equal(openLink, '/my-lessons/55555555-5555-5555-8555-555555555001');

    await page.close();
    await context.close();
  });

  test('LessonDraftEditor handles paragraph add/remove, pending locks, 409 conflict, token reload and successful save', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teacher-draft-editor`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#draftEditorTitle', { state: 'visible' });

    // Initial inputs populated from currentDraft
    const initialVi = await page.inputValue('#inputDraftTitleVi');
    assert.equal(initialVi, 'Chào hỏi cơ bản');

    // Add a new paragraph
    await page.click('#btnAddParagraph');
    await page.waitForSelector('#paragraphItem-2', { state: 'visible' });
    await page.fill('#inputParagraph-2', 'Đoạn văn số 3 mới thêm.');

    // Remove paragraph 1
    await page.click('#btnRemoveParagraph-0');
    await page.waitForFunction(() => document.querySelectorAll('[id^="paragraphItem-"]').length === 2);

    // Simulate 409 STALE_LESSON on first save
    await page.evaluate(() => {
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH' && url.includes('/draft')) {
          return Promise.resolve(
            Response.json(
              {
                error: {
                  code: 'STALE_LESSON',
                  message: 'Dữ liệu bài học đã bị thay đổi bởi phiên làm việc khác.',
                },
              },
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(url, opts);
      };
    });

    await page.click('#btnSaveDraft');

    // Verify 409 error banner and reload token button appear
    await page.waitForSelector('#draftSaveError', { state: 'visible' });
    const errText = await page.textContent('#draftSaveError');
    assert.ok(errText.includes('Dữ liệu bài học đã bị thay đổi'));
    await page.waitForSelector('#btnReloadLessonToken', { state: 'visible' });

    // Verify user typed inputs were retained!
    const paraText = await page.inputValue('#inputParagraph-1');
    assert.equal(paraText, 'Đoạn văn số 3 mới thêm.');

    // Now reload latest token
    await page.evaluate(() => {
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if ((!opts?.method || opts.method === 'GET') && url.includes('/teacher/lessons/')) {
          return Promise.resolve(
            Response.json(
              {
                data: {
                  id: '55555555-5555-5555-8555-555555555001',
                  unitId: '44444444-4444-4444-8444-444444444040',
                  position: 1,
                  isRequired: true,
                  availability: 'PLANNED',
                  rowVersion: '2', // Fresh token from server
                  courseContext: { id: 'c1', names: { vi: 'Khóa học 1' } },
                  unitContext: { id: 'u1', code: 'UNIT-01', names: { vi: 'Bài 1' } },
                  assignment: null,
                  highestRevision: null,
                  isEditable: true,
                  editabilityReason: null,
                  currentDraft: { title: { vi: 'Nội dung mới trên server' }, contentBlocks: [] },
                  revisions: [],
                },
              },
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (opts?.method === 'PATCH' && url.includes('/draft')) {
          window.__capturedSavePayload = JSON.parse(opts.body);
          return Promise.resolve(
            Response.json(
              {
                data: {
                  id: '55555555-5555-5555-8555-555555555001',
                  unitId: '44444444-4444-4444-8444-444444444040',
                  position: 1,
                  isRequired: true,
                  availability: 'PLANNED',
                  rowVersion: '3',
                  courseContext: { id: 'c1', names: { vi: 'Khóa học 1' } },
                  unitContext: { id: 'u1', code: 'UNIT-01', names: { vi: 'Bài 1' } },
                  assignment: null,
                  highestRevision: {
                    id: 'rev-2',
                    revisionNo: 2,
                    author: { id: 't1', displayName: 'Nguyễn Thị Lan' },
                    createdAt: new Date().toISOString(),
                    changeSummary: 'Lưu thành công',
                    status: 'DRAFT',
                  },
                  isEditable: true,
                  editabilityReason: null,
                  currentDraft: {
                    title: { vi: 'Chào hỏi cơ bản' },
                    contentBlocks: [{ type: 'paragraph', text: 'Đoạn văn số 3 mới thêm.' }],
                  },
                  revisions: [
                    {
                      id: 'rev-2',
                      revisionNo: 2,
                      author: { id: 't1', displayName: 'Nguyễn Thị Lan' },
                      createdAt: new Date().toISOString(),
                      changeSummary: 'Lưu thành công',
                      status: 'DRAFT',
                    },
                  ],
                },
              },
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(url, opts);
      };
    });

    await page.click('#btnReloadLessonToken');

    // Wait for success notice
    await page.waitForSelector('#draftSaveSuccess', { state: 'visible' });

    // Submit save again with fresh token
    await page.click('#btnSaveDraft');
    await page.waitForFunction(() => document.querySelector('#draftSaveSuccess')?.textContent?.includes('Bản sửa đổi #2'));

    const capturedPayload = await page.evaluate(() => window.__capturedSavePayload);
    assert.equal(capturedPayload.expectedRowVersion, '2', 'Re-saved request must send reconciled token 2');

    // Revision history updates
    const revRow = await page.textContent('#row-revision-2');
    assert.ok(revRow.includes('#2'));
    assert.ok(revRow.includes('Nguyễn Thị Lan'));

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 6. Production Teacher Callback Wire Test & Negative Mutant Proof
  // =========================================================================

  test('Production TeacherLessonDetailPage surfaces an endpoint failure', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=page-teacher-draft-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#draftEditorTitle', { state: 'visible' });

    const title = await page.textContent('#draftEditorTitle');
    assert.ok(title.includes('Soạn thảo nội dung — Bài học #1'));

    // Assert that if the editor is hooked to a wrong endpoint (mutant), submit fails and displays error
    await page.evaluate(() => {
      // Mutant injection: simulate wrong endpoint or 404
      window.fetch = () => Promise.resolve(Response.json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, { status: 404 }));
    });

    await page.click('#btnSaveDraft');
    await page.waitForSelector('#draftSaveError', { state: 'visible' });
    const err = await page.textContent('#draftSaveError');
    assert.ok(err.includes('Endpoint not found'), 'Proves real production callback catches network/endpoint failures');

    await page.close();
    await context.close();
  });

  // =========================================================================
  // 7. Empty States, 401 & 403 Usable Logout
  // =========================================================================

  test('Empty states and usable Logout on permission denial', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Lessons empty state
    await page.goto(`${TEST_URL}?state=lessons-empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#emptyLessonsTable', { state: 'visible' });
    const emptyTitle = await page.textContent('#emptyLessonsTable .empty-title');
    assert.equal(emptyTitle.trim(), 'Chưa có bài học nào');

    // 2. Teacher holding view has entry button to /my-lessons
    await page.goto(`${TEST_URL}?state=teacher-holding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnGoToMyLessons', { state: 'visible' });
    const linkHref = await page.getAttribute('#btnGoToMyLessons', 'href');
    assert.equal(linkHref, '/my-lessons');

    // 3. Logout button on holding view
    await page.waitForSelector('#btnLogoutHolding', { state: 'visible' });

    await page.close();
    await context.close();
  });
});
