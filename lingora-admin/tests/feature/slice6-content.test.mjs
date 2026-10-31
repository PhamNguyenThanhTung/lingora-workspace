import { lessonsFixture } from './harness/lessons-fixture.mjs';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

let currentCookieStore = {
  getAll: () => [],
  get: () => undefined,
  set: () => {},
  delete: () => {},
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

mock.module('next/navigation.js', {
  exports: {
    notFound: () => {
      const err = new Error('NEXT_NOT_FOUND');
      err.digest = 'NEXT_NOT_FOUND';
      throw err;
    },
    redirect: (url) => {
      const err = new Error(`NEXT_REDIRECT:${url}`);
      err.digest = `NEXT_REDIRECT;${url}`;
      throw err;
    },
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/my-lessons/test',
  },
});

mock.module('server-only', {
  exports: {},
});

const {
  saveTeacherLessonDraft,
  getTeacherLessonDetail,
  getTeacherVocabularyOptions,
  getLesson,
  assignLesson,
  createLesson,
  toLessonDetailDto,
  toTeacherLessonDetailDto,
} = await import('../../src/server/lessons/index.ts');

const {
  isValidAudioReferenceUrl,
  canonicalJsonStringify,
  computeExerciseFingerprint,
  normalizeVocabularyTerm,
} = await import('../../src/server/lessons/content.ts');

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { GET: getTeacherLessonDetailRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/route.ts');
const { PATCH: patchTeacherDraftRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/draft/route.ts');
const { GET: getTeacherVocabularyOptionsRoute } = await import(
  '../../src/app/api/teacher/lessons/[lessonId]/vocabulary-options/route.ts'
);

function createMockSessionCookie(
  userId = '00000000-0000-4000-8000-000000000001',
  email = 'admin@lingora.edu.vn'
) {
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    Buffer.from(JSON.stringify(payload)).toString('base64url') +
    '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-sncfyvpzwedqgwfpffkh-auth-token',
    value: cookieValue,
  };
}

describe('S6-CONTENT: Exercises, Vocabulary & Revision Integrity Suite', () => {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const teacherId = '11111111-1111-4111-8111-111111111111';
  const teacherBId = '22222222-2222-4222-8222-222222222222';
  const langEnId = 'eeeeeeee-1111-4111-8111-111111111111';
  const langFrId = 'f0000000-1111-4111-8111-111111111111';
  const courseId = '33333333-3333-4333-8333-333333333333';
  const unitId = '44444444-4444-4444-8444-444444444444';
  const lessonId = '55555555-5555-4555-8555-555555555555';

  let fixture;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    globalThis.fetch = async () => Response.json({ id: teacherId });
    fixture = lessonsFixture();
    setProductPrismaForTest(fixture.db);

    // Accounts
    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Quản trị viên',
    });
    fixture.state.accounts.set(teacherId, {
      id: teacherId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Cô Hương',
    });
    fixture.state.accounts.set(teacherBId, {
      id: teacherBId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Thầy Hùng',
    });

    // Courses & Units (Target Language: English)
    fixture.state.courses.set(courseId, {
      id: courseId,
      languageId: langEnId,
      frameworkId: 'ff000000-0000-4000-8000-000000000001',
      names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
      defaultStartLevelId: 'll000000-0000-4000-8000-000000000001',
      isActive: true,
      rowVersion: 1n,
    });
    fixture.state.units.set(unitId, {
      id: unitId,
      courseId,
      levelId: 'll000000-0000-4000-8000-000000000001',
      code: 'UNIT-01',
      position: 1,
      names: { vi: 'Khởi động', en: 'Warm Up' },
      rowVersion: 1n,
    });

    // Lesson
    fixture.state.lessons.set(lessonId, {
      id: lessonId,
      unitId,
      position: 1,
      isRequired: true,
      availability: 'PLANNED',
      activeRevisionId: null,
      rowVersion: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Initial Assignment to Teacher Hương
    const assignmentId = 'aa111111-1111-4111-8111-111111111111';
    fixture.state.assignments.set(assignmentId, {
      id: assignmentId,
      lessonId,
      createdBy: adminId,
      currentTeacherId: teacherId,
      scopeGeneration: 1n,
      rowVersion: 1n,
      requirement: {},
      scope: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const episodeId = 'ep111111-1111-4111-8111-111111111111';
    fixture.state.histories.set(episodeId, {
      id: episodeId,
      assignmentId,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      previousTeacherId: null,
      nextTeacherId: teacherId,
      scopeGeneration: 1n,
      changedBy: adminId,
      scopeSnapshot: {},
      changedAt: new Date(),
      createdAt: new Date(),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
  });

  // ===========================================================================
  // 1. Audio Reference URL Validation & Helpers
  // ===========================================================================

  test('Audio Reference URL strictly requires HTTPS, public DNS with dot, no query/hash/port/ip/localhost', () => {
    // Valid public HTTPS URLs
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org/audio/track1.mp3'), true);
    assert.equal(isValidAudioReferenceUrl('https://cdn.example.com/sound.ogg'), true);
    assert.equal(isValidAudioReferenceUrl('https://sub.domain.co.uk/file.wav'), true);
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org:443/track1.mp3'), true);

    // Invalid: non-HTTPS
    assert.equal(isValidAudioReferenceUrl('http://media.lingora.org/audio/track1.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('ftp://media.lingora.org/audio/track1.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('javascript:alert(1)'), false);
    assert.equal(isValidAudioReferenceUrl('data:audio/mp3;base64,AAAA'), false);
    assert.equal(isValidAudioReferenceUrl('//media.lingora.org/audio/track1.mp3'), false);

    // Invalid: query string or fragment
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org/audio.mp3?token=secret'), false);
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org/audio.mp3#t=10'), false);

    // Invalid: custom port
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org:8443/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://media.lingora.org:80/audio.mp3'), false);

    // Invalid: credentials
    assert.equal(isValidAudioReferenceUrl('https://user:pass@media.lingora.org/audio.mp3'), false);

    // Invalid: IP literals
    assert.equal(isValidAudioReferenceUrl('https://127.0.0.1/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://192.168.1.1/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://[::1]/audio.mp3'), false);

    // Invalid: localhost / local / internal hostnames
    assert.equal(isValidAudioReferenceUrl('https://localhost/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://api.localhost/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://service.local/audio.mp3'), false);
    assert.equal(isValidAudioReferenceUrl('https://backend.internal/audio.mp3'), false);

    // Invalid: no dot in hostname
    assert.equal(isValidAudioReferenceUrl('https://example/audio.mp3'), false);

    // Invalid: blank / too long (>2048 chars)
    assert.equal(isValidAudioReferenceUrl(''), false);
    assert.equal(isValidAudioReferenceUrl('https://' + 'a'.repeat(2045) + '.org/audio.mp3'), false);
  });

  test('Canonical JSON and deterministic fingerprint computation', () => {
    const fp1 = computeExerciseFingerprint({
      type: 'MCQ',
      schemaVersion: 1,
      promptData: { prompt: 'Chọn từ đúng', options: [{ id: 'opt_1', text: 'Cat' }, { id: 'opt_2', text: 'Dog' }] },
      gradingData: { correctOptionId: 'opt_1' },
      feedbackData: { explanation: 'Mèo là cat' },
    });
    // Same content with keys ordered differently produces identical fingerprint
    const fp2 = computeExerciseFingerprint({
      schemaVersion: 1,
      type: 'MCQ',
      feedbackData: { explanation: 'Mèo là cat' },
      gradingData: { correctOptionId: 'opt_1' },
      promptData: { options: [{ text: 'Cat', id: 'opt_1' }, { id: 'opt_2', text: 'Dog' }], prompt: 'Chọn từ đúng' },
    });
    assert.equal(fp1, fp2);
    assert.equal(typeof fp1, 'string');
    assert.equal(fp1.length, 64);
  });

  test('Vocabulary normalization collapses whitespace, normalizes NFC, lowercases', () => {
    assert.equal(normalizeVocabularyTerm('  Xin   chào  '), 'xin chào');
    assert.equal(normalizeVocabularyTerm('HELLO   WORLD'), 'hello world');
    assert.equal(normalizeVocabularyTerm('\u0045\u0301cole'), 'école');
  });

  // ===========================================================================
  // 2. All 5 Exercise Types: Happy Paths & Invalid Payloads
  // ===========================================================================

  test('MCQ: happy path creates ItemIdentity, ItemRevision, ItemGradingSecret, LessonExercise', async () => {
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài 1: Trắc nghiệm' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: {
              prompt: 'Which word means "quả táo"?',
              options: [
                { id: 'opt_a', text: 'Apple' },
                { id: 'opt_b', text: 'Orange' },
              ],
            },
            gradingData: {
              correctOptionId: 'opt_a',
            },
            feedbackData: {
              explanation: 'Apple có nghĩa là quả táo.',
            },
          },
        ],
      },
      fixture.db
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.data.exercises.length, 1);
    const ex = res.data.data.exercises[0];
    assert.equal(ex.type, 'MCQ');
    assert.equal(ex.position, 1);
    assert.equal(ex.isCore, true);
    assert.equal(ex.promptData.prompt, 'Which word means "quả táo"?');
    assert.equal(ex.gradingData.correctOptionId, 'opt_a');
    assert.equal(ex.feedbackData.explanation, 'Apple có nghĩa là quả táo.');

    // Verify DB double records
    assert.equal(fixture.state.itemIdentities.size, 1);
    const item = [...fixture.state.itemIdentities.values()][0];
    assert.equal(item.origin, 'PRACTICE');
    assert.equal(item.createdBy, teacherId);

    assert.equal(fixture.state.itemRevisions.size, 1);
    const itemRev = [...fixture.state.itemRevisions.values()][0];
    assert.equal(itemRev.itemId, item.id);
    assert.equal(itemRev.revisionNo, 1);
    assert.equal(itemRev.schemaVersion, 1);

    assert.equal(fixture.state.itemGradingSecrets.size, 1);
    const secret = [...fixture.state.itemGradingSecrets.values()][0];
    assert.equal(secret.itemRevisionId, itemRev.id);
    assert.equal(secret.gradingData.correctOptionId, 'opt_a');
  });

  test('MCQ: invalid payload rejects when correctOptionId not in options or duplicate option IDs', async () => {
    // correctOptionId not in options
    const res1 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài 1' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: {
              prompt: 'Chọn',
              options: [
                { id: 'opt_1', text: 'One' },
                { id: 'opt_2', text: 'Two' },
              ],
            },
            gradingData: {
              correctOptionId: 'opt_unknown',
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res1.status, 400);
    assert.equal(res1.error?.code, 'VALIDATION_ERROR');

    // Duplicate option IDs
    const res2 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài 1' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: {
              prompt: 'Chọn',
              options: [
                { id: 'opt_dup', text: 'One' },
                { id: 'opt_dup', text: 'Two' },
              ],
            },
            gradingData: {
              correctOptionId: 'opt_dup',
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res2.status, 400);
    assert.equal(res2.error?.code, 'VALIDATION_ERROR');
  });

  test('FILL_BLANK: happy path and invalid blank marker', async () => {
    // Happy path: exactly one '____'
    const resHappy = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Điền từ' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'FILL_BLANK',
            promptData: {
              prompt: 'Điền từ còn thiếu vào chỗ trống',
              sentence: 'She is a talented ____.',
            },
            gradingData: {
              acceptedAnswers: ['singer', 'artist'],
              caseSensitive: false,
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resHappy.status, 200);
    assert.equal(resHappy.data.data.exercises[0].type, 'FILL_BLANK');

    // Invalid: no blank marker
    const resNoBlank = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Điền từ' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'FILL_BLANK',
            promptData: {
              prompt: 'Điền từ',
              sentence: 'She is a talented singer.',
            },
            gradingData: {
              acceptedAnswers: ['singer'],
              caseSensitive: false,
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resNoBlank.status, 400);
    assert.equal(resNoBlank.error?.code, 'VALIDATION_ERROR');

    // Invalid: two blank markers
    const resTwoBlanks = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Điền từ' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'FILL_BLANK',
            promptData: {
              prompt: 'Điền từ',
              sentence: '____ is a talented ____.',
            },
            gradingData: {
              acceptedAnswers: ['She', 'singer'],
              caseSensitive: false,
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resTwoBlanks.status, 400);
    assert.equal(resTwoBlanks.error?.code, 'VALIDATION_ERROR');
  });

  test('REORDER: happy path and invalid permutation', async () => {
    // Happy path: correctOrder is exact permutation of token IDs
    const resHappy = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Sắp xếp' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'REORDER',
            promptData: {
              prompt: 'Sắp xếp các từ thành câu đúng',
              tokens: [
                { id: 't1', text: 'I' },
                { id: 't2', text: 'love' },
                { id: 't3', text: 'you' },
              ],
            },
            gradingData: {
              correctOrder: ['t1', 't2', 't3'],
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resHappy.status, 200);
    assert.equal(resHappy.data.data.exercises[0].type, 'REORDER');

    // Invalid: correctOrder length mismatch or missing token
    const resMissing = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Sắp xếp' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'REORDER',
            promptData: {
              prompt: 'Sắp xếp',
              tokens: [
                { id: 't1', text: 'I' },
                { id: 't2', text: 'love' },
                { id: 't3', text: 'you' },
              ],
            },
            gradingData: {
              correctOrder: ['t1', 't2'],
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resMissing.status, 400);
    assert.equal(resMissing.error?.code, 'VALIDATION_ERROR');
  });

  test('LISTENING: happy path and invalid audioUrl inputs', async () => {
    // Happy path: public HTTPS URL
    const resHappy = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Nghe hiểu' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'LISTENING',
            promptData: {
              prompt: 'Listen and choose what the speaker ordered',
              audioUrl: 'https://cdn.lingora.org/audio/restaurant_dialogue.mp3',
              options: [
                { id: 'opt_1', text: 'Coffee' },
                { id: 'opt_2', text: 'Tea' },
              ],
            },
            gradingData: {
              correctOptionId: 'opt_1',
              transcript: 'I would like a cup of coffee, please.',
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resHappy.status, 200);
    assert.equal(resHappy.data.data.exercises[0].type, 'LISTENING');
    assert.equal(resHappy.data.data.exercises[0].promptData.audioUrl, 'https://cdn.lingora.org/audio/restaurant_dialogue.mp3');

    // Invalid: signed query string
    const resQuery = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Nghe hiểu' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'LISTENING',
            promptData: {
              prompt: 'Listen',
              audioUrl: 'https://cdn.lingora.org/audio/file.mp3?token=secret123',
              options: [
                { id: 'opt_1', text: 'Coffee' },
                { id: 'opt_2', text: 'Tea' },
              ],
            },
            gradingData: { correctOptionId: 'opt_1' },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resQuery.status, 400);
    assert.equal(resQuery.error?.code, 'VALIDATION_ERROR');

    // Invalid: localhost / IP literal
    const resIp = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Nghe hiểu' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'LISTENING',
            promptData: {
              prompt: 'Listen',
              audioUrl: 'https://192.168.1.100/audio/file.mp3',
              options: [
                { id: 'opt_1', text: 'Coffee' },
                { id: 'opt_2', text: 'Tea' },
              ],
            },
            gradingData: { correctOptionId: 'opt_1' },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resIp.status, 400);
    assert.equal(resIp.error?.code, 'VALIDATION_ERROR');
  });

  test('GRAMMAR: happy path and invalid bounds', async () => {
    const resHappy = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Ngữ pháp' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'GRAMMAR',
            promptData: {
              prompt: 'Chuyển sang câu bị động',
              sourceSentence: 'They built this house in 1990.',
              targetPattern: 'This house was built in 1990.',
            },
            gradingData: {
              acceptedAnswers: ['This house was built in 1990.'],
              caseSensitive: false,
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resHappy.status, 200);
    assert.equal(resHappy.data.data.exercises[0].type, 'GRAMMAR');

    // Invalid: duplicate acceptedAnswers
    const resDupAnswers = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Ngữ pháp' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'GRAMMAR',
            promptData: {
              prompt: 'Prompt',
              sourceSentence: 'Source',
              targetPattern: 'Target',
            },
            gradingData: {
              acceptedAnswers: ['answer 1', 'answer 1'],
              caseSensitive: false,
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resDupAnswers.status, 400);
    assert.equal(resDupAnswers.error?.code, 'VALIDATION_ERROR');
  });

  // ===========================================================================
  // 3. Collection Limits & Position Conflicts
  // ===========================================================================

  test('Duplicate exercise position within request returns 409 DUPLICATE_EXERCISE_POSITION', async () => {
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài học' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'P1', options: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
            gradingData: { correctOptionId: 'o1' },
          },
          {
            position: 1, // Duplicate position!
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'P2', options: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
            gradingData: { correctOptionId: 'o1' },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'DUPLICATE_EXERCISE_POSITION');
  });

  test('Duplicate vocabulary position returns 409 DUPLICATE_VOCABULARY_POSITION', async () => {
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài học' },
        contentBlocks: [],
        expectedRowVersion: '1',
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: { canonicalForm: 'apple', senseKey: 'default', meaningLabels: { vi: 'quả táo' } },
          },
          {
            position: 1, // Duplicate position!
            isCore: true,
            create: { canonicalForm: 'banana', senseKey: 'default', meaningLabels: { vi: 'quả chuối' } },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'DUPLICATE_VOCABULARY_POSITION');
  });

  // ===========================================================================
  // 4. Vocabulary Create, Reuse, Identity Conflict & Language Mismatch
  // ===========================================================================

  test('Vocabulary create creates global concept; exact identical recreate reuses concept without duplication', async () => {
    // 1. Create first revision with new concept 'cat'
    const res1 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Học từ vựng' },
        contentBlocks: [],
        expectedRowVersion: '1',
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: 'cat',
              senseKey: 'default',
              meaningLabels: { vi: 'con mèo', en: 'feline animal' },
              phonetic: '/kæt/',
              partOfSpeech: 'noun',
              example: 'The cat is sleeping.',
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res1.status, 200);
    assert.equal(res1.data.data.vocabulary.length, 1);
    const v1 = res1.data.data.vocabulary[0];
    assert.equal(v1.displaySnapshot.canonicalForm, 'cat');
    assert.equal(v1.displaySnapshot.meaningLabels.vi, 'con mèo');

    const globalConcepts = [...fixture.state.vocabularyConcepts.values()];
    assert.equal(globalConcepts.length, 1);
    const catConceptId = globalConcepts[0].id;

    // 2. Save revision 2 creating the exact same concept (reuse check)
    const res2 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Học từ vựng' },
        contentBlocks: [],
        expectedRowVersion: '2',
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: 'cat',
              senseKey: 'default',
              meaningLabels: { vi: 'con mèo', en: 'feline animal' },
              phonetic: '/kæt/',
              partOfSpeech: 'noun',
              example: 'The cat is sleeping.',
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res2.status, 200);
    // Concept ID should be reused, NOT duplicated
    assert.equal(fixture.state.vocabularyConcepts.size, 1);
    assert.equal(res2.data.data.vocabulary[0].vocabularyId, catConceptId);
  });

  test('Vocabulary create with differing display metadata returns 409 VOCABULARY_IDENTITY_CONFLICT', async () => {
    // Concept 'dog' already exists in English
    const dogConceptId = 'dd111111-1111-4111-8111-111111111111';
    fixture.state.vocabularyConcepts.set(dogConceptId, {
      id: dogConceptId,
      languageId: langEnId,
      canonicalForm: 'dog',
      normalizedForm: 'dog',
      senseKey: 'default',
      meaningLabels: { vi: 'con chó' },
      phonetic: '/dɒɡ/',
      partOfSpeech: 'noun',
      example: 'A friendly dog.',
      createdBy: teacherId,
      frozenAt: null,
      rowVersion: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt to create 'dog' with conflicting meaningLabels
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Từ vựng' },
        contentBlocks: [],
        expectedRowVersion: '1',
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: 'dog',
              senseKey: 'default',
              meaningLabels: { vi: 'chó cưng của tôi' }, // Differing meaning!
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'VOCABULARY_IDENTITY_CONFLICT');
  });

  test('Attaching concept of foreign language returns 409 VOCABULARY_LANGUAGE_MISMATCH', async () => {
    // Create French concept
    const frenchConceptId = 'f1111111-1111-4111-8111-111111111111';
    fixture.state.vocabularyConcepts.set(frenchConceptId, {
      id: frenchConceptId,
      languageId: langFrId, // French, whereas Course is English!
      canonicalForm: 'bonjour',
      normalizedForm: 'bonjour',
      senseKey: 'default',
      meaningLabels: { vi: 'xin chào' },
      phonetic: null,
      partOfSpeech: 'interjection',
      example: null,
      createdBy: teacherId,
      frozenAt: null,
      rowVersion: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Từ vựng' },
        contentBlocks: [],
        expectedRowVersion: '1',
        vocabulary: [
          {
            position: 1,
            isCore: true,
            vocabularyId: frenchConceptId,
          },
        ],
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'VOCABULARY_LANGUAGE_MISMATCH');
  });

  test('Vocabulary options endpoint returns target-language scoped senses only', async () => {
    // English 'book'
    const bookEnId = 'b0000000-0000-4000-8000-000000000001';
    fixture.state.vocabularyConcepts.set(bookEnId, {
      id: bookEnId,
      languageId: langEnId,
      canonicalForm: 'book',
      normalizedForm: 'book',
      senseKey: 'noun',
      meaningLabels: { vi: 'quyển sách' },
      phonetic: '/bʊk/',
      partOfSpeech: 'noun',
      example: 'Read a book.',
      createdBy: teacherId,
      frozenAt: null,
      rowVersion: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // French 'book' (e.g. loanword)
    const bookFrId = 'b0000000-0000-4000-8000-000000000002';
    fixture.state.vocabularyConcepts.set(bookFrId, {
      id: bookFrId,
      languageId: langFrId,
      canonicalForm: 'book',
      normalizedForm: 'book',
      senseKey: 'default',
      meaningLabels: { vi: 'sách ảnh' },
      phonetic: null,
      partOfSpeech: null,
      example: null,
      createdBy: teacherId,
      frozenAt: null,
      rowVersion: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await getTeacherVocabularyOptions(teacherId, lessonId, '  BOOK  ', fixture.db);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.length, 1);
    assert.equal(res.data.data[0].id, bookEnId);
    assert.equal(res.data.data[0].senseKey, 'noun');
  });

  // ===========================================================================
  // 5. Revision & Persistence Integrity
  // ===========================================================================

  test('Persistence Integrity: Revision 1 has Exercise A and Vocab A; Revision 2 edits/adds/removes to B; Revision 1 remains completely intact', async () => {
    // 1. Save Revision 1
    const resRev1 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 1' },
        contentBlocks: [{ type: 'paragraph', text: 'Đoạn 1' }],
        expectedRowVersion: '1',
        expectedRevisionId: null, // First revision
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Q1', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] },
            gradingData: { correctOptionId: 'a' },
            feedbackData: { explanation: 'Giải thích 1' },
          },
        ],
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: 'sun',
              senseKey: 'default',
              meaningLabels: { vi: 'mặt trời' },
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resRev1.status, 200);
    const rev1Id = resRev1.data.data.highestRevision.id;
    const rev1Ex1 = resRev1.data.data.exercises[0];
    const rev1Voc1 = resRev1.data.data.vocabulary[0];

    // Take deep snapshot of all records after Revision 1
    const snapshotRev1 = {
      lessons: new Map([...fixture.state.lessons].map(([k, v]) => [k, structuredClone(v)])),
      revisions: new Map([...fixture.state.revisions].map(([k, v]) => [k, structuredClone(v)])),
      exercises: new Map([...fixture.state.lessonExercises].map(([k, v]) => [k, structuredClone(v)])),
      itemIdentities: new Map([...fixture.state.itemIdentities].map(([k, v]) => [k, structuredClone(v)])),
      itemRevisions: new Map([...fixture.state.itemRevisions].map(([k, v]) => [k, structuredClone(v)])),
      itemGradingSecrets: new Map([...fixture.state.itemGradingSecrets].map(([k, v]) => [k, structuredClone(v)])),
      vocabularyConcepts: new Map([...fixture.state.vocabularyConcepts].map(([k, v]) => [k, structuredClone(v)])),
      vocabularyLinks: new Map([...fixture.state.lessonVocabularyLinks].map(([k, v]) => [k, structuredClone(v)])),
    };

    // 2. Save Revision 2:
    // - Edit Q1 (retained via sourceExerciseId)
    // - Add new Q2
    // - Retain 'sun' (via sourceLinkId)
    // - Add new 'moon'
    const resRev2 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 2' },
        contentBlocks: [{ type: 'paragraph', text: 'Đoạn 1 sửa' }],
        expectedRowVersion: '2',
        expectedRevisionId: rev1Id,
        exercises: [
          {
            sourceExerciseId: rev1Ex1.id,
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Q1 updated', options: [{ id: 'a', text: '10' }, { id: 'b', text: '20' }] },
            gradingData: { correctOptionId: 'b' },
          },
          {
            position: 2,
            isCore: false,
            type: 'GRAMMAR',
            promptData: { prompt: 'Q2 Grammar', sourceSentence: 'Active', targetPattern: 'Passive' },
            gradingData: { acceptedAnswers: ['Passive'], caseSensitive: true },
          },
        ],
        vocabulary: [
          {
            sourceLinkId: rev1Voc1.id,
            position: 2, // position changed in successor
            isCore: false,
          },
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: 'moon',
              senseKey: 'default',
              meaningLabels: { vi: 'mặt trăng' },
            },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resRev2.status, 200);
    const rev2Id = resRev2.data.data.highestRevision.id;
    assert.notEqual(rev2Id, rev1Id);
    assert.equal(resRev2.data.data.highestRevision.revisionNo, 2);
    assert.equal(resRev2.data.data.exercises.length, 2);
    assert.equal(resRev2.data.data.vocabulary.length, 2);

    // Verify Retained Exercise Q1 in Revision 2:
    const rev2Ex1 = resRev2.data.data.exercises.find((e) => e.position === 1);
    assert.equal(rev2Ex1.itemId, rev1Ex1.itemId, 'Retained exercise reuses ItemIdentity!');
    assert.notEqual(rev2Ex1.id, rev1Ex1.id, 'Fresh LessonExercise ID for successor');
    assert.notEqual(rev2Ex1.itemRevisionId, rev1Ex1.itemRevisionId, 'Fresh ItemRevision for successor');

    const itemRev2 = fixture.state.itemRevisions.get(rev2Ex1.itemRevisionId);
    assert.equal(itemRev2.revisionNo, 2);
    assert.equal(itemRev2.authoringLessonRevisionId, rev2Id);

    // Verify Retained Vocabulary in Revision 2:
    const rev2VocSun = resRev2.data.data.vocabulary.find((v) => v.displaySnapshot.canonicalForm === 'sun');
    assert.notEqual(rev2VocSun.id, rev1Voc1.id, 'Fresh LessonVocabularyLink ID');
    assert.equal(rev2VocSun.position, 2);
    assert.equal(rev2VocSun.isCore, false);
    assert.deepEqual(rev2VocSun.displaySnapshot, rev1Voc1.displaySnapshot, 'Predecessor snapshot copied byte-for-JSON-value!');

    // VERIFY REVISION 1 WAS UNTOUCHED (DEEP IMMUTABILITY CHECK)
    const oldRev1 = fixture.state.revisions.get(rev1Id);
    assert.deepEqual(oldRev1.title, snapshotRev1.revisions.get(rev1Id).title);
    assert.deepEqual(oldRev1.contentBlocks, snapshotRev1.revisions.get(rev1Id).contentBlocks);

    const oldEx1 = fixture.state.lessonExercises.get(rev1Ex1.id);
    assert.deepEqual(oldEx1, snapshotRev1.exercises.get(rev1Ex1.id));

    const oldItemRev1 = fixture.state.itemRevisions.get(rev1Ex1.itemRevisionId);
    assert.deepEqual(oldItemRev1, snapshotRev1.itemRevisions.get(rev1Ex1.itemRevisionId));

    const oldSecret1 = fixture.state.itemGradingSecrets.get(rev1Ex1.itemRevisionId);
    assert.deepEqual(oldSecret1, snapshotRev1.itemGradingSecrets.get(rev1Ex1.itemRevisionId));

    const oldVocLink1 = fixture.state.lessonVocabularyLinks.get(rev1Voc1.id);
    assert.deepEqual(oldVocLink1, snapshotRev1.vocabularyLinks.get(rev1Voc1.id));
  });

  test('Omitted collections clone predecessor children unchanged', async () => {
    // 1. Create Rev 1 with 1 exercise and 1 vocab
    const res1 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 1' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Q1', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] },
            gradingData: { correctOptionId: 'a' },
          },
        ],
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: { canonicalForm: 'star', senseKey: 'default', meaningLabels: { vi: 'ngôi sao' } },
          },
        ],
      },
      fixture.db
    );
    assert.equal(res1.status, 200);

    // 2. Save Rev 2 with omitted exercises and vocabulary collections (metadata-only update)
    const res2 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 2 cập nhật tiêu đề' },
        contentBlocks: [{ type: 'paragraph', text: 'Thêm đoạn văn' }],
        expectedRowVersion: '2',
        // exercises omitted!
        // vocabulary omitted!
      },
      fixture.db
    );
    assert.equal(res2.status, 200);
    assert.equal(res2.data.data.highestRevision.revisionNo, 2);
    // Successor automatically inherited both exercise and vocabulary
    assert.equal(res2.data.data.exercises.length, 1);
    assert.equal(res2.data.data.exercises[0].promptData.prompt, 'Q1');
    assert.equal(res2.data.data.vocabulary.length, 1);
    assert.equal(res2.data.data.vocabulary[0].displaySnapshot.canonicalForm, 'star');
  });

  test('Explicit empty array removes all children from successor', async () => {
    // 1. Create Rev 1 with children
    await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 1' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Q1', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] },
            gradingData: { correctOptionId: 'a' },
          },
        ],
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: { canonicalForm: 'star', senseKey: 'default', meaningLabels: { vi: 'ngôi sao' } },
          },
        ],
      },
      fixture.db
    );

    // 2. Save Rev 2 with explicit empty arrays
    const res2 = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bản 2' },
        contentBlocks: [],
        expectedRowVersion: '2',
        exercises: [],
        vocabulary: [],
      },
      fixture.db
    );
    assert.equal(res2.status, 200);
    assert.equal(res2.data.data.exercises.length, 0);
    assert.equal(res2.data.data.vocabulary.length, 0);
  });

  test('Transaction rollback on injected error leaves zero partial rows or version bumps', async () => {
    const initialState = structuredClone(fixture.state);

    // Inject failure during lessonExerciseCreate
    fixture.fail.lessonExerciseCreate = true;

    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thất bại' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Q1', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] },
            gradingData: { correctOptionId: 'a' },
          },
        ],
      },
      fixture.db
    );

    assert.equal(res.status, 503);

    // Zero partial records in any map!
    assert.equal(fixture.state.revisions.size, initialState.revisions.size);
    assert.equal(fixture.state.itemIdentities.size, initialState.itemIdentities.size);
    assert.equal(fixture.state.itemRevisions.size, initialState.itemRevisions.size);
    assert.equal(fixture.state.itemGradingSecrets.size, initialState.itemGradingSecrets.size);
    assert.equal(fixture.state.lessonExercises.size, initialState.lessonExercises.size);
    assert.equal(fixture.state.lessons.get(lessonId).rowVersion, 1n);
  });

  // ===========================================================================
  // 6. Security, Ownership & Concurrency Barriers
  // ===========================================================================

  test('Unassigned Teacher B receives opaque 404 LESSON_NOT_FOUND', async () => {
    const resDetail = await getTeacherLessonDetail(teacherBId, lessonId, fixture.db);
    assert.equal(resDetail.status, 404);
    assert.equal(resDetail.error?.code, 'LESSON_NOT_FOUND');

    const resVocab = await getTeacherVocabularyOptions(teacherBId, lessonId, 'test', fixture.db);
    assert.equal(resVocab.status, 404);
    assert.equal(resVocab.error?.code, 'LESSON_NOT_FOUND');

    const resSave = await saveTeacherLessonDraft(
      teacherBId,
      lessonId,
      {
        title: { vi: 'Bài hack' },
        contentBlocks: [],
        expectedRowVersion: '1',
      },
      fixture.db
    );
    assert.equal(resSave.status, 404);
    assert.equal(resSave.error?.code, 'LESSON_NOT_FOUND');
  });

  test('Disabled Teacher is rejected with 403 ACCOUNT_INACTIVE', async () => {
    fixture.state.accounts.get(teacherId).status = 'DISABLED';

    const resSave = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '1',
      },
      fixture.db
    );
    assert.equal(resSave.status, 403);
    assert.equal(resSave.error?.code, 'ACCOUNT_INACTIVE');

    const resVocab = await getTeacherVocabularyOptions(teacherId, lessonId, 'test', fixture.db);
    assert.equal(resVocab.status, 403);
    assert.equal(resVocab.error?.code, 'ACCOUNT_INACTIVE');
  });

  test('CAS expectedRowVersion mismatch returns 409 STALE_LESSON', async () => {
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '999', // Mismatched CAS token!
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'STALE_LESSON');
  });

  test('expectedRevisionId mismatch returns 409 REVISION_CONFLICT', async () => {
    // Lesson currently has 0 revisions; client supplies an arbitrary revision ID
    const res = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '1',
        expectedRevisionId: '99999999-9999-4999-8999-999999999999',
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'REVISION_CONFLICT');
  });

  test('Referencing sourceExerciseId or sourceLinkId not in predecessor revision returns 404 RELATION_NOT_FOUND', async () => {
    const resEx = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            sourceExerciseId: '99999999-9999-4999-8999-999999999999',
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'P', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] },
            gradingData: { correctOptionId: 'a' },
          },
        ],
      },
      fixture.db
    );
    assert.equal(resEx.status, 404);
    assert.equal(resEx.error?.code, 'RELATION_NOT_FOUND');

    const resVoc = await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '1',
        vocabulary: [
          {
            sourceLinkId: '99999999-9999-4999-8999-999999999999',
            position: 1,
            isCore: true,
          },
        ],
      },
      fixture.db
    );
    assert.equal(resVoc.status, 404);
    assert.equal(resVoc.error?.code, 'RELATION_NOT_FOUND');
  });

  test('Admin Lesson detail DTO does not leak grading secrets or private answers', async () => {
    // 1. Create a lesson revision with an MCQ exercise that has grading secrets
    await saveTeacherLessonDraft(
      teacherId,
      lessonId,
      {
        title: { vi: 'Bài 1' },
        contentBlocks: [],
        expectedRowVersion: '1',
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'MCQ',
            promptData: { prompt: 'Bí mật', options: [{ id: 'opt_1', text: 'A' }, { id: 'opt_2', text: 'B' }] },
            gradingData: { correctOptionId: 'opt_1' },
            feedbackData: { explanation: 'Đáp án bí mật' },
          },
        ],
      },
      fixture.db
    );

    // 2. Fetch lesson via Admin service getLesson
    const adminRes = await getLesson(courseId, unitId, lessonId, fixture.db);
    assert.equal(adminRes.status, 200);
    const adminData = adminRes.data.data;

    // Admin DTO must not have gradingData or feedbackData
    assert.equal('exercises' in adminData, false);
    assert.equal(JSON.stringify(adminData).includes('opt_1'), false);
    assert.equal(JSON.stringify(adminData).includes('Đáp án bí mật'), false);
  });

  // ===========================================================================
  // 7. Route Handlers Integration Matrix
  // ===========================================================================

  test('Actual Route Handlers enforce auth, origin, and return appropriate DTOs', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(teacherId, 'teacher@lingora.edu.vn')],
    };

    // 1. Vocabulary options route
    const reqVocab = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}/vocabulary-options?q=test`);
    const resVocab = await getTeacherVocabularyOptionsRoute(reqVocab, { params: Promise.resolve({ lessonId }) });
    assert.equal(resVocab.status, 200);
    assert.equal(resVocab.headers.get('Cache-Control'), 'no-store, private');

    // 2. Teacher detail route
    const reqDetail = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}`);
    const resDetail = await getTeacherLessonDetailRoute(reqDetail, { params: Promise.resolve({ lessonId }) });
    assert.equal(resDetail.status, 200);
    const bodyDetail = await resDetail.json();
    assert.equal(Array.isArray(bodyDetail.data.exercises), true);
    assert.equal(Array.isArray(bodyDetail.data.vocabulary), true);
    assert.equal(bodyDetail.data.courseContext.languageId, langEnId);

    // 3. Teacher draft patch route with full payload
    const reqDraft = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}/draft`, {
      method: 'PATCH',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: { vi: 'Bài lưu qua route' },
        contentBlocks: [],
        expectedRowVersion: '1',
        expectedRevisionId: null,
        exercises: [
          {
            position: 1,
            isCore: true,
            type: 'FILL_BLANK',
            promptData: { prompt: 'Điền từ', sentence: 'Hello ____!' },
            gradingData: { acceptedAnswers: ['world'], caseSensitive: false },
          },
        ],
      }),
    });
    const resDraft = await patchTeacherDraftRoute(reqDraft, { params: Promise.resolve({ lessonId }) });
    assert.equal(resDraft.status, 200);
    const bodyDraft = await resDraft.json();
    assert.equal(bodyDraft.data.highestRevision.revisionNo, 1);
    assert.equal(bodyDraft.data.exercises.length, 1);
    assert.equal(bodyDraft.data.exercises[0].type, 'FILL_BLANK');
  });

  // ===========================================================================
  // 8. Codex Mutation Controls A-G Explicit Proofs
  // ===========================================================================

  test('Mutant A Kill: Unassigned Teacher cannot bypass ownership check (returns 404 opaque)', async () => {
    const res = await saveTeacherLessonDraft(teacherBId, lessonId, { title: { vi: 'Mutant A' }, contentBlocks: [], expectedRowVersion: '1' }, fixture.db);
    assert.equal(res.status, 404);
    assert.equal(res.error?.code, 'LESSON_NOT_FOUND');
  });

  test('Mutant B Kill: Inactive Teacher inside transaction cannot bypass ACTIVE guard (returns 403 ACCOUNT_INACTIVE)', async () => {
    fixture.state.accounts.get(teacherId).status = 'DISABLED';
    const res = await saveTeacherLessonDraft(teacherId, lessonId, { title: { vi: 'Mutant B' }, contentBlocks: [], expectedRowVersion: '1' }, fixture.db);
    assert.equal(res.status, 403);
    assert.equal(res.error?.code, 'ACCOUNT_INACTIVE');
  });

  test('Mutant C Kill: Weaken type-specific validator rejects invalid payload (MCQ wrong correctOptionId returns 400)', async () => {
    const res = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Mutant C' }, contentBlocks: [], expectedRowVersion: '1',
      exercises: [{ position: 1, isCore: true, type: 'MCQ', promptData: { prompt: 'P', options: [{ id: 'a', text: '1' }] }, gradingData: { correctOptionId: 'wrong' } }],
    }, fixture.db);
    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'VALIDATION_ERROR');
  });

  test('Mutant D Kill: In-place update or omission of successor copy fails; old revision & records remain untouched', async () => {
    const r1 = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Mutant D Rev 1' }, contentBlocks: [], expectedRowVersion: '1',
      exercises: [{ position: 1, isCore: true, type: 'MCQ', promptData: { prompt: 'Original', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] }, gradingData: { correctOptionId: 'a' } }],
    }, fixture.db);
    const ex1 = r1.data.data.exercises[0];
    const itemRev1Before = structuredClone(fixture.state.itemRevisions.get(ex1.itemRevisionId));

    const r2 = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Mutant D Rev 2' }, contentBlocks: [], expectedRowVersion: '2',
      exercises: [{ sourceExerciseId: ex1.id, position: 1, isCore: true, type: 'MCQ', promptData: { prompt: 'Mutated in R2', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] }, gradingData: { correctOptionId: 'b' } }],
    }, fixture.db);

    const itemRev1After = fixture.state.itemRevisions.get(ex1.itemRevisionId);
    assert.deepEqual(itemRev1After, itemRev1Before, 'ItemRevision 1 MUST NOT be mutated in place!');
    assert.notEqual(r2.data.data.exercises[0].itemRevisionId, ex1.itemRevisionId, 'Successor MUST create new ItemRevision copy!');
  });

  test('Mutant E Kill: Remove source revision membership gate fails; foreign source ID rejected with 404', async () => {
    const foreignUUID = '99999999-9999-4999-8999-999999999999';
    const res = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Mutant E' }, contentBlocks: [], expectedRowVersion: '1',
      exercises: [{ sourceExerciseId: foreignUUID, position: 1, isCore: true, type: 'MCQ', promptData: { prompt: 'P', options: [{ id: 'a', text: '1' }, { id: 'b', text: '2' }] }, gradingData: { correctOptionId: 'a' } }],
    }, fixture.db);
    assert.equal(res.status, 404);
    assert.equal(res.error?.code, 'RELATION_NOT_FOUND');
  });

  test('Mutant G Kill: Remove course language check fails; mismatched vocabulary language rejected with 409', async () => {
    const frenchConceptId = 'f1111111-1111-4111-8111-111111111111';
    fixture.state.vocabularyConcepts.set(frenchConceptId, {
      id: frenchConceptId, languageId: langFrId, canonicalForm: 'merci', normalizedForm: 'merci', senseKey: 'default',
      meaningLabels: { vi: 'cảm ơn' }, phonetic: null, partOfSpeech: null, example: null, createdBy: teacherId, frozenAt: null, rowVersion: 1n, createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Mutant G' }, contentBlocks: [], expectedRowVersion: '1',
      vocabulary: [{ position: 1, isCore: true, vocabularyId: frenchConceptId }],
    }, fixture.db);
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'VOCABULARY_LANGUAGE_MISMATCH');
  });
  test('Actual Teacher B child routes deny list/detail/lookup/save and inactive status with zero persistence effects', async () => {
    const { GET: listRoute } = await import('../../src/app/api/teacher/lessons/route.ts');
    currentCookieStore = {getAll: () => [createMockSessionCookie(teacherBId, 'teacher-b@lingora.test')]};
    globalThis.fetch = async () => Response.json({id: teacherBId});
    const before = structuredClone(fixture.state);
    const params = {params: Promise.resolve({lessonId})};
    const list = await listRoute(new Request('http://localhost:3000/api/teacher/lessons'));
    assert.equal(list.status, 200); assert.deepEqual((await list.json()).data, []);
    for (const [handler, suffix] of [[getTeacherLessonDetailRoute, ''], [getTeacherVocabularyOptionsRoute, '/vocabulary-options?q=hello']]) {
      const res = await handler(new Request('http://localhost:3000/api/teacher/lessons/'+lessonId+suffix), params);
      assert.equal(res.status, 404);
    }
    for (const expectedRowVersion of ['1', '999']) {
      const res = await patchTeacherDraftRoute(new Request('http://localhost:3000/api/teacher/lessons/'+lessonId+'/draft', {
        method:'PATCH', headers:{Origin:'http://localhost:3000',Host:'localhost:3000','Content-Type':'application/json'},
        body:JSON.stringify({title:{vi:'Foreign child write'},contentBlocks:[],expectedRowVersion,
          exercises:[{position:1,isCore:true,type:'MCQ',promptData:{prompt:'P',options:[{id:'a',text:'A'},{id:'b',text:'B'}]},gradingData:{correctOptionId:'a'}}],
          vocabulary:[{create:{canonicalForm:'hello',senseKey:'default',meaningLabels:{vi:'Xin chào'}},position:1,isCore:true}]}),
      }), params);
      assert.equal(res.status,404); assert.equal((await res.json()).error.code,'LESSON_NOT_FOUND');
    }
    assert.deepEqual(fixture.state,before);
    fixture.state.accounts.get(teacherBId).status='DISABLED';
    const denied = await getTeacherVocabularyOptionsRoute(new Request('http://localhost:3000/api/teacher/lessons/'+lessonId+'/vocabulary-options?q=hello'),params);
    assert.equal(denied.status,403); assert.equal((await denied.json()).error.code,'ACCOUNT_INACTIVE');
  });

});
