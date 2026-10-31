import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3018;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('S6-CONTENT: Production Page Component Callback & DTO Reconciliation Suite', () => {
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

  async function withPage(state, run) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    try {
      await page.goto(`${TEST_URL}/?state=${state}`);
      await page.locator('#appContainer').waitFor();
      await run(page);
    } finally {
      await context.close();
    }
  }

  const fulfill = (route, status, data) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });

  // =========================================================================
  // 1. Full Authoring Lifecycle: Add all 5 Exercise types & Vocabulary,
  //    Save callback exact URL/method/payload & DTO reconciliation
  // =========================================================================

  test('Production Teacher page stages all 5 exercise types and vocabulary, submits exact API contract, and reconciles server DTO', { timeout: 25000 }, async () => {
    await withPage('page-teacher-draft-wire', async (page) => {
      const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
      const baseLesson = pageProps.initialLesson;
      const lessonId = baseLesson.id;

      let interceptedSave = null;
      let vocabSearchCount = 0;

      await page.route('**/api/**', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        const method = req.method();

        // 1. Vocabulary options lookup
        if (url.pathname.includes('/vocabulary-options') && method === 'GET') {
          vocabSearchCount++;
          const query = url.searchParams.get('q');
          return fulfill(route, 200, {
            data: [
              {
                id: 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
                canonicalForm: query || 'hello',
                senseKey: 'greeting',
                meaningLabels: { vi: 'lời chào', en: 'greeting' },
                phonetic: '/həˈloʊ/',
                partOfSpeech: 'noun',
                example: 'Say hello to everyone.',
              },
            ],
          });
        }

        // 2. Draft save PATCH
        if (url.pathname === `/api/teacher/lessons/${lessonId}/draft` && method === 'PATCH') {
          interceptedSave = {
            url: url.pathname,
            method,
            body: req.postDataJSON(),
          };

          const returnedLesson = {
            ...baseLesson,
            rowVersion: '2',
            highestRevision: {
              id: '88888888-8888-4888-8888-888888888002',
              revisionNo: 2,
              status: 'DRAFT',
              createdAt: '2026-10-30T10:00:00Z',
              changeSummary: 'Thêm bài tập và từ vựng',
              author: { id: pageProps.account.id, displayName: 'Nguyễn Thị Lan' },
            },
            currentDraft: {
              title: { vi: 'Bài học #1 đã cập nhật', en: 'Lesson 1 Updated' },
              contentBlocks: [{ type: 'paragraph', text: 'Nội dung cập nhật' }],
            },
            revisions: [
              {
                id: '88888888-8888-4888-8888-888888888002',
                revisionNo: 2,
                status: 'DRAFT',
                createdAt: '2026-10-30T10:00:00Z',
                changeSummary: 'Thêm bài tập và từ vựng',
                author: { id: pageProps.account.id, displayName: 'Nguyễn Thị Lan' },
              },
              ...(baseLesson.revisions || []),
            ],
            exercises: [
              {
                id: 'eeeeeeee-1111-4eee-8eee-eeeeeeee0001',
                itemId: '11111111-1111-4111-8111-111111110001',
                itemRevisionId: '22222222-1111-4222-8222-222222220001',
                position: 1,
                isCore: true,
                type: 'MCQ',
                promptData: {
                  prompt: 'Chọn từ đúng nghĩa với "resilient"',
                  options: [
                    { id: 'opt_1', text: 'Kiên cường' },
                    { id: 'opt_2', text: 'Yếu đuối' },
                  ],
                },
                gradingData: { correctOptionId: 'opt_1' },
                feedbackData: { explanation: 'Resilient nghĩa là kiên cường' },
              },
              {
                id: 'eeeeeeee-2222-4eee-8eee-eeeeeeee0002',
                itemId: '11111111-2222-4111-8111-111111110002',
                itemRevisionId: '22222222-2222-4222-8222-222222220002',
                position: 2,
                isCore: true,
                type: 'FILL_BLANK',
                promptData: { prompt: 'Điền từ vào chỗ trống', sentence: 'He is very ____ today.' },
                gradingData: { acceptedAnswers: ['happy', 'glad'], caseSensitive: false },
              },
              {
                id: 'eeeeeeee-3333-4eee-8eee-eeeeeeee0003',
                itemId: '11111111-3333-4111-8111-111111110003',
                itemRevisionId: '22222222-3333-4222-8222-222222220003',
                position: 3,
                isCore: false,
                type: 'REORDER',
                promptData: {
                  prompt: 'Sắp xếp câu đúng',
                  tokens: [
                    { id: 'tok_1', text: 'I' },
                    { id: 'tok_2', text: 'study' },
                    { id: 'tok_3', text: 'English' },
                  ],
                },
                gradingData: { correctOrder: ['tok_1', 'tok_2', 'tok_3'] },
              },
              {
                id: 'eeeeeeee-4444-4eee-8eee-eeeeeeee0004',
                itemId: '11111111-4444-4111-8111-111111110004',
                itemRevisionId: '22222222-4444-4222-8222-222222220004',
                position: 4,
                isCore: true,
                type: 'LISTENING',
                promptData: {
                  prompt: 'Nghe đoạn âm thanh và chọn câu trả lời',
                  audioUrl: 'https://cdn.example.com/audio/test-01.mp3',
                  options: [
                    { id: 'opt_1', text: 'Lựa chọn A' },
                    { id: 'opt_2', text: 'Lựa chọn B' },
                  ],
                },
                gradingData: { correctOptionId: 'opt_1', transcript: 'Transcript text' },
              },
              {
                id: 'eeeeeeee-5555-4eee-8eee-eeeeeeee0005',
                itemId: '11111111-5555-4111-8111-111111110005',
                itemRevisionId: '22222222-5555-4222-8222-222222220005',
                position: 5,
                isCore: false,
                type: 'GRAMMAR',
                promptData: {
                  prompt: 'Chuyển đổi sang câu bị động',
                  sourceSentence: 'They built this house.',
                  targetPattern: 'This house was built by them.',
                },
                gradingData: { acceptedAnswers: ['This house was built by them.'], caseSensitive: false },
              },
            ],
            vocabulary: [
              {
                id: 'vvvvvvvv-1111-4vvv-8vvv-vvvvvvvv0001',
                vocabularyId: 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
                position: 1,
                isCore: true,
                displaySnapshot: {
                  schemaVersion: 1,
                  languageId: '22222222-2222-4222-8222-222222222222',
                  canonicalForm: 'hello',
                  senseKey: 'greeting',
                  meaningLabels: { vi: 'lời chào', en: 'greeting' },
                  phonetic: '/həˈloʊ/',
                  partOfSpeech: 'noun',
                  example: 'Say hello to everyone.',
                },
              },
              {
                id: 'vvvvvvvv-2222-4vvv-8vvv-vvvvvvvv0002',
                vocabularyId: 'cccccccc-2222-4ccc-8ccc-cccccccc0002',
                position: 2,
                isCore: false,
                displaySnapshot: {
                  schemaVersion: 1,
                  languageId: '22222222-2222-4222-8222-222222222222',
                  canonicalForm: 'resilient',
                  senseKey: 'default',
                  meaningLabels: { vi: 'kiên cường', en: 'resilient' },
                  phonetic: '/rɪˈzɪliənt/',
                  partOfSpeech: 'adj',
                  example: 'Be resilient.',
                },
              },
            ],
          };

          return fulfill(route, 200, { data: returnedLesson });
        }

        return fulfill(route, 404, { error: { message: 'Unexpected endpoint' } });
      });

      // --- 1. Stage Exercise 1: MCQ ---
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#selectExerciseType').selectOption('MCQ');
      await page.locator('#inputExercisePrompt').fill('Chọn từ đúng nghĩa với "resilient"');
      await page.locator('#inputMcqOptionText-0').fill('Kiên cường');
      await page.locator('#inputMcqOptionText-1').fill('Yếu đuối');
      await page.locator('#radioMcqCorrectOption-0').check();
      await page.locator('#inputExerciseExplanation').fill('Resilient nghĩa là kiên cường');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // --- 2. Stage Exercise 2: FILL_BLANK ---
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#selectExerciseType').selectOption('FILL_BLANK');
      await page.locator('#inputExercisePrompt').fill('Điền từ vào chỗ trống');
      await page.locator('#inputFillBlankSentence').fill('He is very ____ today.');
      await page.locator('#inputFillBlankAnswers').fill('happy\nglad');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // --- 3. Stage Exercise 3: REORDER ---
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#selectExerciseType').selectOption('REORDER');
      await page.locator('#inputExercisePrompt').fill('Sắp xếp câu đúng');
      await page.locator('#inputReorderToken-0').fill('I');
      await page.locator('#inputReorderToken-1').fill('study');
      await page.locator('#btnAddReorderToken').click();
      await page.locator('#inputReorderToken-2').fill('English');
      await page.locator('#inputExerciseIsCore').uncheck();
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // --- 4. Stage Exercise 4: LISTENING ---
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#selectExerciseType').selectOption('LISTENING');
      await page.locator('#inputExercisePrompt').fill('Nghe đoạn âm thanh và chọn câu trả lời');
      await page.locator('#inputListeningAudioUrl').fill('https://cdn.example.com/audio/test-01.mp3');
      await page.locator('#inputListeningTranscript').fill('Transcript text');
      await page.locator('#inputListeningOptionText-0').fill('Lựa chọn A');
      await page.locator('#inputListeningOptionText-1').fill('Lựa chọn B');
      await page.locator('#radioListeningCorrectOption-0').check();
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // --- 5. Stage Exercise 5: GRAMMAR ---
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#selectExerciseType').selectOption('GRAMMAR');
      await page.locator('#inputExercisePrompt').fill('Chuyển đổi sang câu bị động');
      await page.locator('#inputGrammarSourceSentence').fill('They built this house.');
      await page.locator('#inputGrammarTargetPattern').fill('This house was built by them.');
      await page.locator('#inputGrammarAnswers').fill('This house was built by them.');
      await page.locator('#inputExerciseIsCore').uncheck();
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // Verify all 5 exercises are listed in staged table before save
      assert.equal(await page.locator('[id^="exerciseRow-"]').count(), 5);

      // --- 6. Stage Vocabulary 1 via Search tab ---
      await page.locator('#btnAddVocabulary').click();
      await page.locator('#vocabModal').waitFor({ state: 'visible' });
      await page.locator('#inputVocabSearch').fill('hello');
      await page.locator('#btnSearchVocab').click();
      await page.locator('#btnSelectVocabOption-0').waitFor({ state: 'visible' });
      await page.locator('#btnSelectVocabOption-0').click();
      await page.locator('#btnSaveVocabModal').click();
      await page.locator('#vocabModal').waitFor({ state: 'hidden' });

      // --- 7. Stage Vocabulary 2 via Create tab ---
      await page.locator('#btnAddVocabulary').click();
      await page.locator('#vocabModal').waitFor({ state: 'visible' });
      await page.locator('#tabVocabCreate').click();
      await page.locator('#inputVocabCanonical').fill('resilient');
      await page.locator('#inputVocabSenseKey').fill('default');
      await page.locator('#inputVocabMeaningVi').fill('kiên cường');
      await page.locator('#inputVocabMeaningEn').fill('resilient');
      await page.locator('#inputVocabPhonetic').fill('/rɪˈzɪliənt/');
      await page.locator('#inputVocabPartOfSpeech').fill('adj');
      await page.locator('#inputVocabExample').fill('Be resilient.');
      await page.locator('#inputVocabIsCore').uncheck();
      await page.locator('#btnSaveVocabModal').click();
      await page.locator('#vocabModal').waitFor({ state: 'hidden' });

      // Verify 2 vocabulary entries are listed in staged table before save
      assert.equal(await page.locator('[id^="vocabRow-"]').count(), 2);

      // --- 8. Submit Save Draft ---
      await page.locator('#inputDraftChangeSummary').fill('Thêm bài tập và từ vựng');
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveSuccess').waitFor();

      // Assert intercepted API call
      assert.ok(interceptedSave, 'Save draft API call must be intercepted');
      assert.equal(interceptedSave.url, `/api/teacher/lessons/${lessonId}/draft`);
      assert.equal(interceptedSave.method, 'PATCH');
      assert.equal(interceptedSave.body.expectedRowVersion, '1');
      assert.equal(interceptedSave.body.expectedRevisionId, '77777777-7777-7777-8777-777777777001');
      assert.equal(interceptedSave.body.exercises.length, 5);
      assert.equal(interceptedSave.body.vocabulary.length, 2);

      // Check exercises payload types
      assert.equal(interceptedSave.body.exercises[0].type, 'MCQ');
      assert.equal(interceptedSave.body.exercises[1].type, 'FILL_BLANK');
      assert.equal(interceptedSave.body.exercises[2].type, 'REORDER');
      assert.equal(interceptedSave.body.exercises[3].type, 'LISTENING');
      assert.equal(interceptedSave.body.exercises[4].type, 'GRAMMAR');

      // Check vocabulary payload structure
      assert.equal(interceptedSave.body.vocabulary[0].vocabularyId, 'cccccccc-cccc-4ccc-8ccc-cccccccc0001');
      assert.equal(interceptedSave.body.vocabulary[1].create.canonicalForm, 'resilient');

      // Assert UI reconciled from server DTO
      assert.equal(await page.locator('#badgeLessonToken').innerText(), 'Phiên bản: #2');
      assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'Bài học #1 đã cập nhật');
      assert.equal(await page.locator('#inputDraftChangeSummary').inputValue(), ''); // cleared on success
      assert.match(await page.locator('#row-revision-2').innerText(), /Nguyễn Thị Lan.*Thêm bài tập và từ vựng/s);

      // Reconciled exercise rows
      assert.equal(await page.locator('[id^="exerciseRow-"]').count(), 5);
      assert.match(await page.locator('#exerciseType-0').innerText(), /MCQ/);
      assert.match(await page.locator('#exerciseType-1').innerText(), /FILL_BLANK/);
      assert.match(await page.locator('#exerciseType-2').innerText(), /REORDER/);
      assert.match(await page.locator('#exerciseType-3').innerText(), /LISTENING/);
      assert.match(await page.locator('#exerciseType-4').innerText(), /GRAMMAR/);

      // Reconciled vocabulary rows
      assert.equal(await page.locator('[id^="vocabRow-"]').count(), 2);
      assert.match(await page.locator('#vocabTerm-0').innerText(), /hello/);
      assert.match(await page.locator('#vocabTerm-1').innerText(), /resilient/);
    });
  });

  // =========================================================================
  // 2. Exercise Type Switch: Clears Old Type-Specific Fields & Errors
  // =========================================================================

  test('Exercise modal switching type resets payload and errors cleanly so old fields do not submit', { timeout: 15000 }, async () => {
    await withPage('page-teacher-draft-wire', async (page) => {
      const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
      const lessonId = pageProps.initialLesson.id;

      let savedPayload = null;
      await page.route('**/api/**', async (route) => {
        const req = route.request();
        if (req.method() === 'PATCH' && req.url().includes(`/api/teacher/lessons/${lessonId}/draft`)) {
          savedPayload = req.postDataJSON();
          return fulfill(route, 200, { data: { ...pageProps.initialLesson, rowVersion: '2', exercises: [] } });
        }
        return fulfill(route, 200, { data: [] });
      });

      // Open exercise modal, select MCQ, type into option
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#inputExercisePrompt').fill('Prompt text');
      await page.locator('#inputMcqOptionText-0').fill('Old MCQ Option');

      // Switch type to FILL_BLANK
      await page.locator('#selectExerciseType').selectOption('FILL_BLANK');

      // Fill valid FILL_BLANK fields
      await page.locator('#inputFillBlankSentence').fill('This is a ____ test.');
      await page.locator('#inputFillBlankAnswers').fill('simple');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // Save draft
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveSuccess').waitFor();

      assert.ok(savedPayload);
      assert.equal(savedPayload.exercises.length, 1);
      const ex = savedPayload.exercises[0];
      assert.equal(ex.type, 'FILL_BLANK');
      assert.equal(ex.promptData.sentence, 'This is a ____ test.');
      // Crucial: MCQ options and correctOptionId MUST NOT exist on the FILL_BLANK payload
      assert.equal(ex.promptData.options, undefined);
      assert.equal(ex.gradingData.correctOptionId, undefined);
      assert.deepEqual(ex.gradingData.acceptedAnswers, ['simple']);
    });
  });

  // =========================================================================
  // 3. Gỡ khỏi bản nháp: Omits Items From Next Snapshot (No Global Delete)
  // =========================================================================

  test('"Gỡ khỏi bản nháp" removes items from staged draft without false success before Save', { timeout: 15000 }, async () => {
    await withPage('page-teacher-draft-wire', async (page) => {
      const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
      const lessonId = pageProps.initialLesson.id;

      let savedBody = null;
      await page.route('**/api/**', async (route) => {
        const req = route.request();
        if (req.method() === 'PATCH' && req.url().includes(`/api/teacher/lessons/${lessonId}/draft`)) {
          savedBody = req.postDataJSON();
          return fulfill(route, 200, {
            data: {
              ...pageProps.initialLesson,
              rowVersion: '3',
              exercises: [],
              vocabulary: [],
            },
          });
        }
        return fulfill(route, 200, { data: [] });
      });

      // Add 1 exercise
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#inputExercisePrompt').fill('Exercise to be removed');
      await page.locator('#inputMcqOptionText-0').fill('A');
      await page.locator('#inputMcqOptionText-1').fill('B');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('[id^="exerciseRow-"]').count(), 1);

      // Click "Gỡ khỏi bản nháp" on exercise
      await page.locator('#btnRemoveExercise-0').click();
      await page.locator('#emptyExercisesNotice').waitFor({ state: 'visible' });
      assert.equal(await page.locator('[id^="exerciseRow-"]').count(), 0);

      // Now save draft
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveSuccess').waitFor();

      assert.ok(savedBody);
      assert.deepEqual(savedBody.exercises, []);
      assert.deepEqual(savedBody.vocabulary, []);
    });
  });

  // =========================================================================
  // 4. Stale Recovery: 409 Conflict preserves staged input and reload syncs
  // =========================================================================

  test('Teacher 409 STALE_LESSON preserves staged inputs and reload token replaces all arrays authoritatively', { timeout: 15000 }, async () => {
    await withPage('page-teacher-draft-wire', async (page) => {
      const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
      const baseLesson = pageProps.initialLesson;
      const lessonId = baseLesson.id;

      let patchAttempts = 0;
      let finalSavedBody = null;

      await page.route('**/api/**', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        const method = req.method();

        if (method === 'GET' && url.pathname === `/api/teacher/lessons/${lessonId}`) {
          // Authoritative reload response with updated token and exercises
          return fulfill(route, 200, {
            data: {
              ...baseLesson,
              rowVersion: '10',
              currentDraft: {
                title: { vi: 'SERVER CONCURRENT TITLE', en: '' },
                contentBlocks: [{ type: 'paragraph', text: 'SERVER CONCURRENT BODY' }],
              },
              exercises: [
                {
                  id: 'eeeeeeee-9999-4eee-8eee-eeeeeeee9999',
                  itemId: '11111111-9999-4111-8111-111111119999',
                  itemRevisionId: '22222222-9999-4222-8222-222222229999',
                  position: 1,
                  isCore: true,
                  type: 'MCQ',
                  promptData: { prompt: 'Authoritative server prompt', options: [{ id: 'opt_1', text: 'Yes' }, { id: 'opt_2', text: 'No' }] },
                  gradingData: { correctOptionId: 'opt_1' },
                },
              ],
              vocabulary: [],
            },
          });
        }

        if (method === 'PATCH' && url.pathname === `/api/teacher/lessons/${lessonId}/draft`) {
          patchAttempts++;
          if (patchAttempts === 1) {
            return fulfill(route, 409, {
              error: {
                code: 'STALE_LESSON',
                message: 'Dữ liệu bài học đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại phiên bản mới nhất trước khi lưu.',
              },
            });
          }
          finalSavedBody = req.postDataJSON();
          return fulfill(route, 200, {
            data: {
              ...baseLesson,
              rowVersion: '11',
              highestRevision: { id: 'rev-11', revisionNo: 11, author: { displayName: 'Teacher' } },
              currentDraft: { title: { vi: 'SERVER CONCURRENT TITLE', en: '' }, contentBlocks: [] },
              exercises: [],
              vocabulary: [],
              revisions: [],
            },
          });
        }

        return fulfill(route, 200, { data: [] });
      });

      // User adds an exercise and changes title
      await page.locator('#inputDraftTitleVi').fill('CLIENT CONFLICT TITLE');
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#inputExercisePrompt').fill('Client prompt that caused conflict');
      await page.locator('#inputMcqOptionText-0').fill('A');
      await page.locator('#inputMcqOptionText-1').fill('B');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // Click save -> returns 409 STALE_LESSON
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveError').waitFor();
      await page.locator('#btnReloadLessonToken').waitFor({ state: 'visible' });

      // Verify client typed input is preserved during conflict
      assert.equal(await page.locator('#inputDraftTitleVi').inputValue(), 'CLIENT CONFLICT TITLE');
      assert.equal(await page.locator('[id^="exerciseRow-"]').count(), 1);
      assert.equal(await page.locator('#btnSaveDraft').isDisabled(), true);

      // Click reload latest content
      await page.locator('#btnReloadLessonToken').click();
      await page.waitForFunction(() => document.querySelector('#inputDraftTitleVi')?.value === 'SERVER CONCURRENT TITLE');

      // Verify token and exercise list replaced authoritatively
      assert.match(await page.locator('#badgeLessonToken').innerText(), /10/);
      assert.match(await page.locator('#exercisePrompt-0').innerText(), /Authoritative server prompt/);

      // Now save succeeds with expectedRowVersion: 10
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveSuccess').waitFor();
      assert.equal(patchAttempts, 2);
      assert.equal(finalSavedBody.expectedRowVersion, '10');
    });
  });

  // =========================================================================
  // 5. Mutant F Killer: Verifies Save callback URL/Method strictly
  // =========================================================================

  test('Mutant F Killer: verifies production Save callback triggers exact draft URL and method with staged content', { timeout: 15000 }, async () => {
    await withPage('page-teacher-draft-wire', async (page) => {
      const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
      const lessonId = pageProps.initialLesson.id;

      let calledExactEndpoint = false;
      await page.route('**/api/**', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (url.pathname === `/api/teacher/lessons/${lessonId}/draft` && req.method() === 'PATCH') {
          calledExactEndpoint = true;
          return fulfill(route, 200, {
            data: {
              ...pageProps.initialLesson,
              rowVersion: '5',
              exercises: [],
              vocabulary: [],
            },
          });
        }
        return fulfill(route, 404, { error: { message: 'Wrong URL or Method (Mutant F)' } });
      });

      // Add a staged exercise
      await page.locator('#btnAddExercise').click();
      await page.locator('#exerciseModal').waitFor({ state: 'visible' });
      await page.locator('#inputExercisePrompt').fill('Mutant F check prompt');
      await page.locator('#inputMcqOptionText-0').fill('A');
      await page.locator('#inputMcqOptionText-1').fill('B');
      await page.locator('#btnSaveExerciseModal').click();
      await page.locator('#exerciseModal').waitFor({ state: 'hidden' });

      // Click save
      await page.locator('#btnSaveDraft').click();
      await page.locator('#draftSaveSuccess').waitFor();

      // Assert callback was executed with exact URL and method
      assert.equal(calledExactEndpoint, true, 'Mutant F killed: Save draft MUST call exact PATCH URL');
    });
  });
});
