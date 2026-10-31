import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const TEST_URL = 'http://127.0.0.1:3024';
let browser;
let server;

before(async () => {
  server = await startIsolatedServer(3024);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function withPage(state, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  try { await page.goto(`${TEST_URL}/?state=${state}`); await run(page); }
  finally { await context.close(); }
}

const fulfill = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  teacher: '11111111-1111-4111-8111-111111111111',
  course: '33333333-3333-4333-8333-333333333030',
  framework: '11111111-1111-4111-8111-111111111111',
  language: '22222222-2222-4222-8222-222222222222',
  blueprint: '55555555-5555-4555-8555-555555555555',
  mcqRevision: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  fillRevision: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  version: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
};

function blueprint(overrides = {}) {
  return {
    id: ids.blueprint, createdBy: ids.admin, courseId: ids.course, languageId: ids.language, frameworkId: ids.framework,
    purpose: 'PLACEMENT', targetLevelId: null, nextLevelId: null,
    coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'FILL_BLANK'] },
    requirements: { minimumItemsByType: { MCQ: 1, FILL_BLANK: 1 } },
    config: { shuffleItems: false, shuffleOptions: false }, coverageCatalogGeneration: '4', generation: '1',
    createdAt: '2026-10-31T00:00:00.000Z', updatedAt: '2026-10-31T00:00:00.000Z', rowVersion: '1', versionCount: 0,
    course: { id: ids.course, names: { vi: 'DEV Course' } },
    ...overrides,
  };
}

function eligibleItem(itemRevisionId, type, lessonPosition) {
  return {
    itemRevisionId, itemId: `${itemRevisionId.slice(0, 8)}-1111-4111-8111-111111111111`, revisionNo: 1, type,
    promptData: { prompt: `${type} question` }, exactFingerprint: 'f'.repeat(64),
    sourceLessonRevisionId: `dddddddd-dddd-4ddd-8ddd-dddddddddd0${lessonPosition}`, sourceLessonRevisionNo: 1,
    lessonId: `eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee${lessonPosition}`, unitCode: 'DEV', unitPosition: 1,
    lessonPosition, teacherId: ids.teacher, teacherDisplayName: 'Teacher', sourceSubmissionId: `ffffffff-ffff-4fff-8fff-fffffffffff${lessonPosition}`,
    creationAssignmentEpisodeId: `99999999-9999-4999-8999-99999999900${lessonPosition}`,
    blueprintId: ids.blueprint, blueprintGeneration: '1', submittedAt: '2026-10-31T00:00:00.000Z',
  };
}

function versionDto(items) {
  return {
    id: ids.version, blueprintId: ids.blueprint, versionNo: 1, blueprintGeneration: '1',
    blueprintSnapshot: { blueprint_id: ids.blueprint, blueprint_generation: '1', coverage_catalog_generation: '4' },
    assembledAt: '2026-10-31T00:00:00.000Z', assemblyInputHash: 'a'.repeat(64), status: 'IN_REVIEW', isActive: false,
    createdAt: '2026-10-31T00:00:00.000Z', updatedAt: '2026-10-31T00:00:00.000Z', rowVersion: '1', items,
  };
}

test('Admin production callback creates a strict Blueprint, preserves failed selections, then retrieves exact revision pins', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    let createBody;
    let assemblyAttempts = 0;
    const selected = [eligibleItem(ids.mcqRevision, 'MCQ', 1), eligibleItem(ids.fillRevision, 'FILL_BLANK', 2)];
    const pinnedItems = selected.map((item, position) => ({
      id: `88888888-8888-4888-8888-88888888888${position}`,
      assessmentVersionId: ids.version, itemRevisionId: item.itemRevisionId, itemId: item.itemId,
      position: position + 1, weight: '1.0000', coverageTags: {}, createdAt: '2026-10-31T00:00:00.000Z',
      item: { origin: 'ASSESSMENT', exactFingerprint: 'identity-fingerprint' },
      itemRevision: { id: item.itemRevisionId, revisionNo: 1, type: item.type, promptData: item.promptData, schemaVersion: 1, exactFingerprint: 'f'.repeat(64), blueprintGeneration: '1', isDraftOmitted: false, frozenAt: '2026-10-31T00:00:00.000Z' },
      sourceLessonRevision: { id: item.sourceLessonRevisionId, revisionNo: 1, lessonId: item.lessonId },
    }));
    const version = versionDto(pinnedItems);

    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      if (path === '/api/courses' && request.method() === 'GET') return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' }, language: { code: 'en' } }] });
      if (path === '/api/assessment-blueprints' && request.method() === 'GET') return fulfill(route, 200, { data: [] });
      if (path === `/api/frameworks/${ids.framework}/levels` && request.method() === 'GET') return fulfill(route, 200, { data: [] });
      if (path === '/api/assessment-blueprints' && request.method() === 'POST') {
        createBody = request.postDataJSON();
        return fulfill(route, 201, { data: blueprint() });
      }
      if (path === `/api/assessment-blueprints/${ids.blueprint}/eligible-items` && request.method() === 'GET') return fulfill(route, 200, { data: selected });
      if (path === `/api/assessment-blueprints/${ids.blueprint}/versions` && request.method() === 'GET') return fulfill(route, 200, { data: [] });
      if (path === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'GET') return fulfill(route, 200, { data: blueprint({ versionCount: 1 }) });
      if (path === `/api/assessment-blueprints/${ids.blueprint}/versions` && request.method() === 'POST') {
        assemblyAttempts++;
        const body = request.postDataJSON();
        assert.equal(body.expectedBlueprintGeneration, '1');
        if (assemblyAttempts === 1) {
          assert.deepEqual(body.itemRevisionIds, [ids.mcqRevision]);
          return fulfill(route, 400, { error: { code: 'ITEM_COUNT_MISMATCH', message: 'Cần chọn đúng hai bài tập.' } });
        }
        assert.deepEqual(body.itemRevisionIds, [ids.mcqRevision, ids.fillRevision]);
        return fulfill(route, 201, { data: version });
      }
      if (path === `/api/assessment-versions/${ids.version}` && request.method() === 'GET') return fulfill(route, 200, { data: version });
      return fulfill(route, 404, { error: { message: `Unexpected ${request.method()} ${path}` } });
    });

    await page.getByRole('heading', { name: 'Assessment Blueprint' }).waitFor();
    await page.getByLabel('Số câu *').fill('2');
    await page.locator('#includeType-FILL_BLANK').check();
    await page.locator('#minimum-MCQ').fill('1');
    await page.locator('#minimum-FILL_BLANK').fill('1');
    await page.getByRole('button', { name: 'Tạo Blueprint' }).click();
    await page.getByText('Đã lưu Blueprint. Biểu mẫu đã được đồng bộ với dữ liệu máy chủ.').waitFor();
    assert.deepEqual(createBody, {
      courseId: ids.course, purpose: 'PLACEMENT', targetLevelId: null, nextLevelId: null,
      coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'FILL_BLANK'] },
      requirements: { minimumItemsByType: { MCQ: 1, FILL_BLANK: 1 } },
      config: { shuffleItems: false, shuffleOptions: false },
    });

    await page.getByLabel(`Chọn ${ids.mcqRevision}`).check();
    await page.getByRole('button', { name: 'Lắp ghép phiên bản IN_REVIEW' }).click();
    await page.getByText('Cần chọn đúng hai bài tập.').waitFor();
    assert.equal(await page.getByLabel(`Chọn ${ids.mcqRevision}`).isChecked(), true, 'the failed selection remains available for retry');

    await page.getByLabel(`Chọn ${ids.fillRevision}`).check();
    await page.getByRole('button', { name: 'Lắp ghép phiên bản IN_REVIEW' }).click();
    await page.getByRole('heading', { name: 'Phiên bản #1 · IN_REVIEW' }).waitFor();
    assert.equal(assemblyAttempts, 2);
    await page.locator('#selectedAssessmentVersion').getByText(ids.mcqRevision, { exact: true }).waitFor();
    await page.locator('#selectedAssessmentVersion').getByText(ids.fillRevision, { exact: true }).waitFor();
  });
});

test('Teacher production assessment form reuses exercise fields and posts the exact Blueprint/source revision payload', async () => {
  await withPage('page-teacher-draft-wire&slice7=1', async (page) => {
    const blueprintId = '55555555-5555-4555-8555-555555555555';
    const teacherBlueprint = blueprint({ id: blueprintId, purpose: 'LEVEL_UP', coverage: { itemCount: 1, exerciseTypes: ['MCQ'] }, requirements: { minimumItemsByType: {} } });
    let posted;
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.endsWith('/assessment-blueprints') && request.method() === 'GET') return fulfill(route, 200, { data: [teacherBlueprint] });
      if (url.pathname.endsWith('/assessment-items') && request.method() === 'GET') return fulfill(route, 200, { data: [] });
      if (url.pathname.endsWith('/assessment-items') && request.method() === 'POST') {
        posted = request.postDataJSON();
        return fulfill(route, 201, { data: {
          id: '77777777-7777-4777-8777-777777777777', itemId: '66666666-6666-4666-8666-666666666666', revisionNo: 1,
          type: 'MCQ', promptData: posted.promptData, gradingData: posted.gradingData, feedbackData: null,
          blueprintId, blueprintGeneration: '1', isDraftOmitted: false, frozenAt: null,
          authoringLessonRevisionId: posted.expectedRevisionId, isStaleBlueprintGeneration: false,
          createdAt: '2026-10-31T00:00:00.000Z', updatedAt: '2026-10-31T00:00:00.000Z',
        } });
      }
      return fulfill(route, 404, {});
    });

    const { initialLesson } = await page.evaluate(() => window.__PAGE_PROPS__);
    await page.locator('#btnAddAssessmentItem').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('#btnAddAssessmentItem')?.disabled);
    await page.locator('#btnAddAssessmentItem').click();
    await page.locator('#inputExercisePrompt').fill('Choose the correct greeting.');
    await page.locator('#inputMcqOptionText-0').fill('Hello');
    await page.locator('#inputMcqOptionText-1').fill('Goodbye');
    await page.locator('#btnSaveExerciseModal').click();
    await page.getByText('Đã lưu bản sửa đổi bài tập #1.').waitFor();
    await page.getByText('Choose the correct greeting.').waitFor();
    assert.deepEqual(posted, {
      blueprintId, sourceItemId: null, type: 'MCQ',
      promptData: { prompt: 'Choose the correct greeting.', options: [{ id: 'opt_1', text: 'Hello' }, { id: 'opt_2', text: 'Goodbye' }] },
      gradingData: { correctOptionId: 'opt_1' }, feedbackData: null,
      expectedRevisionId: initialLesson.highestRevision.id,
    });
  });
});

test('Blueprint conflict refresh reconciles immutable scope and keeps composition for retry', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    const patchTokens = [];
    const patchPurposes = [];
    const current = blueprint({ rowVersion: '8', generation: '4', coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'FILL_BLANK'] }, requirements: { minimumItemsByType: { MCQ: 1, FILL_BLANK: 1 } }, versionCount: 0 });
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } }] });
      if (url.pathname === '/api/assessment-blueprints' && request.method() === 'GET') return fulfill(route, 200, { data: [current] });
      if (url.pathname.includes('/levels')) return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'PATCH') {
        const body = request.postDataJSON();
        assert.equal(body.coverage.itemCount, 3);
        patchTokens.push(body.expectedRowVersion);
        patchPurposes.push(body.purpose);
        if (patchTokens.length === 1) {
          assert.equal(body.expectedRowVersion, '8');
          return fulfill(route, 409, { error: { code: 'REVISION_CONFLICT', message: 'Blueprint changed; retry.' } });
        }
        assert.equal(body.expectedRowVersion, '9');
        return fulfill(route, 200, { data: blueprint({ ...current, coverage: body.coverage, requirements: body.requirements, rowVersion: '10', generation: '5' }) });
      }
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'GET') {
        return fulfill(route, 200, { data: blueprint({ ...current, rowVersion: '9', versionCount: 1 }) });
      }
      if (url.pathname.endsWith('/eligible-items')) return fulfill(route, 200, { data: [] });
      if (url.pathname.endsWith('/versions')) return fulfill(route, 200, { data: [] });
      return fulfill(route, 404, {});
    });
    await page.getByLabel('Blueprint hiện có').selectOption(ids.blueprint);
    await page.getByLabel('Mục đích *').selectOption('LEVEL_UP');
    await page.getByLabel('Số câu *').fill('3');
    await page.getByRole('button', { name: 'Lưu Blueprint' }).click();
    await page.getByText('Blueprint changed; retry.').waitFor();
    assert.equal(await page.getByLabel('Số câu *').inputValue(), '3');
    assert.equal(await page.getByLabel('Mục đích *').inputValue(), 'PLACEMENT');
    assert.equal(await page.getByLabel('Mục đích *').isDisabled(), true, 'server scope locks as soon as a version exists');
    await page.getByRole('button', { name: 'Lưu Blueprint' }).click();
    await page.getByText('Đã lưu Blueprint. Biểu mẫu đã được đồng bộ với dữ liệu máy chủ.').waitFor();
    assert.deepEqual(patchTokens, ['8', '9']);
    assert.deepEqual(patchPurposes, ['LEVEL_UP', 'PLACEMENT']);
    assert.equal(await page.getByLabel('Số câu *').inputValue(), '3');
  });
});

test('Delayed conflict refresh cannot overwrite the Blueprint selected while its request was in flight', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    const secondBlueprintId = '66666666-6666-4666-8666-666666666666';
    const secondCourseId = '33333333-3333-4333-8333-333333333031';
    let releaseRefresh;
    let signalRefreshStarted;
    const refreshGate = new Promise((resolve) => { releaseRefresh = resolve; });
    const refreshStarted = new Promise((resolve) => { signalRefreshStarted = resolve; });
    const first = blueprint({ rowVersion: '8', purpose: 'PLACEMENT', versionCount: 0 });
    const second = blueprint({
      id: secondBlueprintId, courseId: secondCourseId, purpose: 'LEVEL_UP', versionCount: 0,
      course: { id: secondCourseId, names: { vi: 'Second course' } },
    });

    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') return fulfill(route, 200, { data: [
        { id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } },
        { id: secondCourseId, frameworkId: ids.framework, names: { vi: 'Second course' } },
      ] });
      if (url.pathname === '/api/assessment-blueprints' && request.method() === 'GET') return fulfill(route, 200, { data: [first, second] });
      if (url.pathname.includes('/levels')) return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'PATCH') return fulfill(route, 409, { error: { code: 'REVISION_CONFLICT', message: 'Blueprint changed; retry.' } });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'GET') {
        signalRefreshStarted();
        await refreshGate;
        return fulfill(route, 200, { data: blueprint({ ...first, rowVersion: '9', versionCount: 1 }) });
      }
      if (url.pathname.endsWith('/eligible-items')) return fulfill(route, 200, { data: [] });
      if (url.pathname.endsWith('/versions')) return fulfill(route, 200, { data: [] });
      return fulfill(route, 404, {});
    });

    await page.getByLabel('Blueprint hiện có').selectOption(ids.blueprint);
    await page.getByLabel('Số câu *').fill('3');
    await page.getByRole('button', { name: 'Lưu Blueprint' }).click();
    await refreshStarted;
    await page.getByLabel('Blueprint hiện có').selectOption(secondBlueprintId);
    releaseRefresh();
    await page.getByText('Blueprint changed; retry.').waitFor();
    assert.equal(await page.getByLabel('Blueprint hiện có').inputValue(), secondBlueprintId);
    assert.equal(await page.getByLabel('Mục đích *').inputValue(), 'LEVEL_UP');
    assert.equal(await page.getByLabel('Khóa học *').inputValue(), secondCourseId);
  });
});

test('Assembly dependency errors expose a retry and reload eligible items', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    let eligibleReads = 0;
    const item = eligibleItem(ids.mcqRevision, 'MCQ', 1);
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } }] });
      if (url.pathname === '/api/assessment-blueprints') return fulfill(route, 200, { data: [blueprint()] });
      if (url.pathname.includes('/levels')) return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}/eligible-items`) {
        eligibleReads++;
        if (eligibleReads === 1) return fulfill(route, 503, { error: { message: 'Eligible items unavailable.' } });
        return fulfill(route, 200, { data: [item] });
      }
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}/versions`) return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'GET') return fulfill(route, 200, { data: blueprint() });
      return fulfill(route, 404, {});
    });

    await page.getByText('Eligible items unavailable.').waitFor();
    await page.getByRole('button', { name: 'Tải lại dữ liệu lắp ghép' }).click();
    await page.getByLabel(`Chọn ${ids.mcqRevision}`).waitFor();
    assert.equal(eligibleReads, 2);
  });
});

test('Stale Blueprint generation conflict refreshes Blueprint and eligible items before retry', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    const oldRevisionId = ids.mcqRevision;
    const freshRevisionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
    const postGenerations = [];
    let blueprintReads = 0;
    let eligibleReads = 0;
    let versionCount = 0;
    const initialBlueprint = blueprint({ coverage: { itemCount: 1, exerciseTypes: ['MCQ'] }, requirements: { minimumItemsByType: {} } });
    const newBlueprint = blueprint({ generation: '2', rowVersion: '2', coverage: { itemCount: 1, exerciseTypes: ['MCQ'] }, requirements: { minimumItemsByType: {} } });
    const version = versionDto([]);
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } }] });
      if (url.pathname === '/api/assessment-blueprints') return fulfill(route, 200, { data: [initialBlueprint] });
      if (url.pathname.includes('/levels')) return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}` && request.method() === 'GET') {
        blueprintReads++;
        return fulfill(route, 200, { data: versionCount ? { ...newBlueprint, versionCount } : newBlueprint });
      }
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}/eligible-items`) {
        eligibleReads++;
        return fulfill(route, 200, { data: [eligibleItem(eligibleReads === 1 ? oldRevisionId : freshRevisionId, 'MCQ', 1)] });
      }
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}/versions` && request.method() === 'GET') return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/assessment-blueprints/${ids.blueprint}/versions` && request.method() === 'POST') {
        const body = request.postDataJSON();
        postGenerations.push(body.expectedBlueprintGeneration);
        if (postGenerations.length === 1) return fulfill(route, 409, { error: { code: 'STALE_BLUEPRINT_GENERATION', message: 'Blueprint generation changed.' } });
        assert.deepEqual(body.itemRevisionIds, [freshRevisionId]);
        versionCount = 1;
        return fulfill(route, 201, { data: version });
      }
      if (url.pathname === `/api/assessment-versions/${ids.version}`) return fulfill(route, 200, { data: version });
      return fulfill(route, 404, {});
    });

    await page.getByLabel(`Chọn ${oldRevisionId}`).check();
    await page.getByRole('button', { name: 'Lắp ghép phiên bản IN_REVIEW' }).click();
    await page.getByText('Blueprint generation changed.', { exact: true }).waitFor();
    await page.getByLabel(`Chọn ${freshRevisionId}`).waitFor();
    assert.equal(blueprintReads, 1, 'stale generation triggers a current Blueprint read');
    await page.getByLabel(`Chọn ${freshRevisionId}`).check();
    await page.getByRole('button', { name: 'Lắp ghép phiên bản IN_REVIEW' }).click();
    await page.getByRole('heading', { name: 'Phiên bản #1 · IN_REVIEW' }).waitFor();
    assert.deepEqual(postGenerations, ['1', '2']);
    assert.equal(await page.getByLabel('Mục đích *').isDisabled(), true, 'successful assembly locks Blueprint scope immediately');
    assert.equal(blueprintReads, 2, 'successful assembly refreshes the authoritative version count');
  });
});

test('Assessment catalogue exposes a retry after its initial data request fails', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    let courseReads = 0;
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') {
        courseReads++;
        if (courseReads === 1) return fulfill(route, 503, { error: { message: 'Courses unavailable.' } });
        return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } }] });
      }
      if (url.pathname === '/api/assessment-blueprints') return fulfill(route, 200, { data: [] });
      return fulfill(route, 404, {});
    });

    await page.getByText('Courses unavailable.').waitFor();
    await page.getByRole('button', { name: 'Tải lại danh mục' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('option')].some((option) => option.textContent?.includes('DEV Course')));
    assert.equal(courseReads, 2);
  });
});

test('Assessment catalogue exposes a retry after its Level request fails', async () => {
  await withPage('assessment-catalog-test', async (page) => {
    let levelReads = 0;
    await page.route('**/api/**', async (route) => {
      const request = route.request(); const url = new URL(request.url());
      if (url.pathname === '/api/courses') return fulfill(route, 200, { data: [{ id: ids.course, frameworkId: ids.framework, names: { vi: 'DEV Course' } }] });
      if (url.pathname === '/api/assessment-blueprints') return fulfill(route, 200, { data: [] });
      if (url.pathname === `/api/frameworks/${ids.framework}/levels`) {
        levelReads++;
        if (levelReads === 1) return fulfill(route, 503, { error: { message: 'Levels unavailable.' } });
        return fulfill(route, 200, { data: [{ id: '77777777-7777-4777-8777-777777777777', code: 'A1', position: 1, label: { vi: 'Mới bắt đầu' } }] });
      }
      return fulfill(route, 404, {});
    });

    await page.getByText('Levels unavailable.').waitFor();
    await page.getByRole('button', { name: 'Tải lại cấp độ' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('option')].some((option) => option.textContent?.includes('A1')));
    assert.equal(levelReads, 2);
  });
});
