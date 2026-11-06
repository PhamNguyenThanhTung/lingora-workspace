import { randomUUID } from 'node:crypto';

export const learnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const otherLearnerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const fixtureEmail = 'learner@lingora.edu.vn';
export const fixturePassword = 'secret123';
export const providerOrigin = 'https://learner-test.supabase.co';

export const languageId = '11111111-1111-4111-8111-111111111111';
export const courseId = '22222222-2222-4222-8222-222222222222';
export const frameworkId = '33333333-3333-4333-8333-333333333333';
export const level1Id = '44444444-4444-4444-8444-444444444444';
export const level2Id = '55555555-5555-4555-8555-555555555555';
export const unit1Id = '66666666-6666-4666-8666-666666666666';
export const lesson1Id = '77777777-7777-4777-8777-777777777777';
export const lesson2Id = '88888888-8888-4888-8888-888888888888';
export const revision1Id = '99999999-9999-4999-8999-999999999999';
export const revision2Id = 'aaaaaaaa-1111-4111-8111-111111111111';
export const contextId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export const confirmedUser = () => ({ id: learnerId, email: fixtureEmail, email_confirmed_at: '2026-10-31T00:00:00Z' });
export const account = () => ({ id: learnerId, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner A', uiLocale: 'vi', timezone: 'Asia/Ho_Chi_Minh' });

export const languageRow = () => ({ id: languageId, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' }, isLearnable: true, isUiLocale: true });
export const courseRow = () => ({
  id: courseId,
  languageId,
  frameworkId,
  names: { vi: 'Khóa học A', en: 'Course A' },
  isActive: true,
  defaultStartLevelId: level1Id,
  framework: { id: frameworkId, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
});

export const level1Row = () => ({
  id: level1Id,
  frameworkId,
  code: 'A1',
  label: { vi: 'A1 Mới bắt đầu', en: 'Beginner' },
  position: 1,
});

export const level2Row = () => ({
  id: level2Id,
  frameworkId,
  code: 'A2',
  label: { vi: 'A2 Sơ cấp', en: 'Elementary' },
  position: 2,
});

export const contextRow = () => ({
  id: contextId,
  learnerId,
  languageId,
  courseId,
  status: 'ACTIVE',
  rowVersion: 1n,
  startSource: 'DEFAULT',
  language: { id: languageId, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
  course: {
    id: courseId,
    languageId,
    frameworkId,
    names: { vi: 'Khóa học A', en: 'Course A' },
    isActive: true,
    framework: { id: frameworkId, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
  },
  selectedStartLevelId: level1Id,
  selectedStartLevel: level1Row(),
  workingLevelId: level1Id,
  workingLevel: level1Row(),
});

export const unitRow = () => ({
  id: unit1Id,
  courseId,
  levelId: level1Id,
  position: 1,
  names: { vi: 'Chương 1: Chào hỏi', en: 'Unit 1: Greetings' },
  level: level1Row(),
});

export const revisionRow = () => ({
  id: revision1Id,
  lessonId: lesson1Id,
  revisionNo: 1,
  status: 'PUBLISHED',
  title: { vi: 'Bài 1: Làm quen', en: 'Lesson 1: Introduction' },
  contentBlocks: [
    { type: 'paragraph', text: 'Chào mừng bạn đến với bài học đầu tiên.' },
    { type: 'paragraph', text: 'Trong bài này chúng ta sẽ học cách chào hỏi cơ bản.' },
  ],
  topicIds: ['topic-greetings'],
  skillIds: ['skill-reading', 'skill-speaking'],
  purposeTags: ['core'],
});

export const lessonRow = () => ({
  id: lesson1Id,
  unitId: unit1Id,
  position: 1,
  isRequired: true,
  availability: 'AVAILABLE',
  activeRevisionId: revision1Id,
  activeRevision: revisionRow(),
  unit: unitRow(),
});

export const lesson2Row = () => ({
  id: lesson2Id,
  unitId: unit1Id,
  position: 2,
  isRequired: true,
  availability: 'AVAILABLE',
  activeRevisionId: revision2Id,
  activeRevision: {
    id: revision2Id,
    lessonId: lesson2Id,
    revisionNo: 1,
    status: 'PUBLISHED',
    title: { vi: 'Bài 2: Tạm biệt', en: 'Lesson 2: Goodbyes' },
    contentBlocks: [{ type: 'paragraph', text: 'Học cách nói lời tạm biệt.' }],
    topicIds: ['topic-goodbyes'],
    skillIds: ['skill-speaking'],
    purposeTags: ['core'],
  },
  unit: unitRow(),
});

export const exercisesRows = () => [
  {
    id: 'ex-mcq-1',
    lessonRevisionId: revision1Id,
    itemId: 'item-1',
    itemRevisionId: 'ir-1',
    position: 1,
    isCore: true,
    item: { id: 'item-1', origin: 'PRACTICE' },
    itemRevision: {
      id: 'ir-1',
      itemId: 'item-1',
      type: 'MCQ',
      schemaVersion: 1,
      promptData: {
        prompt: 'Chọn câu chào hỏi thông dụng:',
        options: [
          { id: 'opt-1', text: 'Hello' },
          { id: 'opt-2', text: 'Goodbye' },
        ],
      },
      assessmentBlueprintId: null,
      gradingSecret: {
        schemaVersion: 1,
        gradingData: { correctOptionId: 'opt-1' },
        feedbackData: { explanation: 'Hello là lời chào thông dụng.' },
      },
    },
  },
  {
    id: 'ex-fill-2',
    lessonRevisionId: revision1Id,
    itemId: 'item-2',
    itemRevisionId: 'ir-2',
    position: 2,
    isCore: true,
    item: { id: 'item-2', origin: 'PRACTICE' },
    itemRevision: {
      id: 'ir-2',
      itemId: 'item-2',
      type: 'FILL_BLANK',
      schemaVersion: 1,
      promptData: {
        prompt: 'Điền từ còn thiếu vào chỗ trống:',
        sentence: 'Nice to ____ you.',
      },
      assessmentBlueprintId: null,
      gradingSecret: {
        schemaVersion: 1,
        gradingData: { acceptedAnswers: ['meet', 'see'], caseSensitive: false },
        feedbackData: null,
      },
    },
  },
  {
    id: 'ex-reorder-3',
    lessonRevisionId: revision1Id,
    itemId: 'item-3',
    itemRevisionId: 'ir-3',
    position: 3,
    isCore: true,
    item: { id: 'item-3', origin: 'PRACTICE' },
    itemRevision: {
      id: 'ir-3',
      itemId: 'item-3',
      type: 'REORDER',
      schemaVersion: 1,
      promptData: {
        prompt: 'Sắp xếp lại câu:',
        tokens: [
          { id: 't-1', text: 'How' },
          { id: 't-2', text: 'are' },
          { id: 't-3', text: 'you?' },
        ],
      },
      assessmentBlueprintId: null,
      gradingSecret: {
        schemaVersion: 1,
        gradingData: { correctOrder: ['t-1', 't-2', 't-3'] },
        feedbackData: null,
      },
    },
  },
  {
    id: 'ex-listen-4',
    lessonRevisionId: revision1Id,
    itemId: 'item-4',
    itemRevisionId: 'ir-4',
    position: 4,
    isCore: true,
    item: { id: 'item-4', origin: 'PRACTICE' },
    itemRevision: {
      id: 'ir-4',
      itemId: 'item-4',
      type: 'LISTENING',
      schemaVersion: 1,
      promptData: {
        prompt: 'Nghe đoạn hội thoại và chọn đáp án:',
        audioUrl: 'https://cdn.lingora.edu.vn/audio/lesson-1.mp3',
        options: [
          { id: 'opt-l1', text: 'Chào buổi sáng' },
          { id: 'opt-l2', text: 'Chào buổi tối' },
        ],
      },
      assessmentBlueprintId: null,
      gradingSecret: {
        schemaVersion: 1,
        gradingData: { correctOptionId: 'opt-l1', transcript: 'Good morning everyone.' },
        feedbackData: null,
      },
    },
  },
  {
    id: 'ex-grammar-5',
    lessonRevisionId: revision1Id,
    itemId: 'item-5',
    itemRevisionId: 'ir-5',
    position: 5,
    isCore: true,
    item: { id: 'item-5', origin: 'PRACTICE' },
    itemRevision: {
      id: 'ir-5',
      itemId: 'item-5',
      type: 'GRAMMAR',
      schemaVersion: 1,
      promptData: {
        prompt: 'Nhận diện cấu trúc:',
        sourceSentence: 'I am a student.',
        targetPattern: 'Subject + To Be + Noun',
      },
      assessmentBlueprintId: null,
      gradingSecret: {
        schemaVersion: 1,
        gradingData: { acceptedAnswers: ['Subject + To Be + Noun'], caseSensitive: false },
        feedbackData: null,
      },
    },
  },
];

export const vocabularyRows = () => [
  {
    id: 'vocab-link-1',
    lessonRevisionId: revision1Id,
    vocabularyId: 'vocab-concept-1',
    position: 1,
    isCore: true,
    displaySnapshot: {
      canonicalForm: 'Hello',
      senseKey: 'greeting',
      phonetic: 'həˈləʊ',
      partOfSpeech: 'interjection',
      meaningLabels: {
        vi: 'Xin chào',
        en: 'Used as a greeting or to begin a conversation',
      },
      example: 'Hello, how are you today?',
    },
  },
];

export function token(user = confirmedUser(), expiresIn = 3600) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  return {
    access_token: `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, email: user.email, exp })).toString('base64url')}.test-signature`,
    refresh_token: 'local-refresh-token',
    expires_in: expiresIn,
    expires_at: exp,
    token_type: 'bearer',
    user,
  };
}

export function setupEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = providerOrigin;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'local-public-key';
}

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    const value = row?.[key];
    if (expected && typeof expected === 'object') {
      if ('in' in expected) return expected.in.includes(value);
      if ('not' in expected) return value !== expected.not;
      if ('lte' in expected) return value <= expected.lte;
      if ('is' in expected) return matches(value, expected.is);
      return matches(value, expected);
    }
    return value === expected;
  });
}
function ordered(rows, orderBy = []) {
  return [...rows].sort((a,b) => {
    for (const entry of Array.isArray(orderBy) ? orderBy : [orderBy]) {
      let [key,direction] = Object.entries(entry)[0];let av=a[key],bv=b[key];
      let nulls;
      if (typeof direction === 'object' && 'sort' in direction) {nulls=direction.nulls;direction=direction.sort;}
      else if (typeof direction === 'object') {const [nested,dir]=Object.entries(direction)[0];av=av?.[nested];bv=bv?.[nested];direction=dir;}
      if(av instanceof Date)av=av.valueOf();if(bv instanceof Date)bv=bv.valueOf();
      if(av==null&&bv==null)continue;
      if(av==null||bv==null){const first=(nulls|| (direction==='desc'?'first':'last'))==='first';return av==null?(first?-1:1):(first?1:-1);}
      if(av!==bv)return (av>bv?1:-1)*(direction==='desc'?-1:1);
    }
    return 0;
  });
}
function projected(row, args = {}) {
  if (row == null) return row;
  const pick = args.select || args.include;
  if (!pick) return row;
  const result = args.select ? {} : {...row};
  for (const [key, selection] of Object.entries(pick)) {
    if (selection === false) continue;
    const value = row[key];
    result[key] = selection === true ? value : Array.isArray(value)
      ? ordered(value.filter(v=>matches(v,selection.where)),selection.orderBy).map(v=>projected(v,selection))
      : projected(value, selection);
  }
  return result;
}
export function fixtureDb(state) {
  state.languages ||= [languageRow()];
  state.courses ||= [courseRow()];
  state.levels ||= [level1Row(), level2Row()];
  state.contexts ||= [contextRow()];
  state.units ||= [unitRow()];
  state.lessons ||= [lessonRow(), lesson2Row()];
  state.exercises ||= exercisesRows();
  state.vocabulary ||= vocabularyRows();
  state.completions ||= [];
  state.consumptions ||= [];
  state.attempts ||= [];
  state.responses ||= [];
  state.srsCards ||= [];
  state.srsReviewOperations ||= [];
  state.vocabularyConcepts ||= [
    {
      id: 'vocab-concept-1',
      canonicalForm: 'Hello',
      senseKey: 'greeting',
      phonetic: 'həˈləʊ',
      partOfSpeech: 'interjection',
      meaningLabels: {
        vi: 'Xin chào',
        en: 'Used as a greeting or to begin a conversation',
      },
      example: 'Hello, how are you today?',
    },
  ];
  state.commandReceipts ||= [];

  const many = (rows, args) => ordered(rows.filter(r => matches(r, args?.where)), args?.orderBy).map(r => projected(r, args));
  const first = (rows, args) => many(rows, args)[0] || null;

  const db = {
    account: {
      findUnique: async args => {
        if (state.dbFailure) throw new Error('Simulated database outage');
        return first([state.account].filter(Boolean), args);
      },
    },
    language: {
      findUnique: async args => first(state.languages, args),
      findMany: async args => many(state.languages, args),
    },
    course: {
      findUnique: async args => first(state.courses.map(c => ({
        ...c,
        language: state.languages.find(l => l.id === c.languageId),
        framework: c.framework || { id: frameworkId, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
      })), args),
      findMany: async args => many(state.courses.map(c => ({
        ...c,
        language: state.languages.find(l => l.id === c.languageId),
        framework: c.framework || { id: frameworkId, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
      })), args),
    },
    level: {
      findUnique: async args => first(state.levels, args),
      findMany: async args => many(state.levels, args),
    },
    learningContext: {
      findFirst: async args => {
        if (state.contextFailure) throw new Error('Simulated context outage');
        return first(state.contexts.map(c => ({
          ...c,
          language: c.language || state.languages?.find(l => l.id === c.languageId),
          course: c.course || state.courses?.find(co => co.id === c.courseId),
          selectedStartLevel: c.selectedStartLevel !== undefined ? c.selectedStartLevel : state.levels?.find(l => l.id === c.selectedStartLevelId) || null,
          workingLevel: c.workingLevel !== undefined ? c.workingLevel : state.levels?.find(l => l.id === c.workingLevelId) || null,
        })), args);
      },
      findUnique: async args => {
        if (state.contextFailure) throw new Error('Simulated context outage');
        const where = args.where.learnerId_languageId || args.where;
        return first(state.contexts.map(c => ({
          ...c,
          language: c.language || state.languages?.find(l => l.id === c.languageId),
          course: c.course || state.courses?.find(co => co.id === c.courseId),
          selectedStartLevel: c.selectedStartLevel !== undefined ? c.selectedStartLevel : state.levels?.find(l => l.id === c.selectedStartLevelId) || null,
          workingLevel: c.workingLevel !== undefined ? c.workingLevel : state.levels?.find(l => l.id === c.workingLevelId) || null,
        })), { ...args, where });
      },
      findMany: async args => {
        if (state.contextFailure) throw new Error('Simulated context outage');
        return many(state.contexts.map(c => ({
          ...c,
          language: c.language || state.languages?.find(l => l.id === c.languageId),
          course: c.course || state.courses?.find(co => co.id === c.courseId),
          selectedStartLevel: c.selectedStartLevel !== undefined ? c.selectedStartLevel : state.levels?.find(l => l.id === c.selectedStartLevelId) || null,
          workingLevel: c.workingLevel !== undefined ? c.workingLevel : state.levels?.find(l => l.id === c.workingLevelId) || null,
        })), args);
      },
      count: async args => state.contexts.filter(r => matches(r, args?.where)).length,
      create: async ({ data }) => {
        const lang = state.languages?.find(l => l.id === data.languageId);
        const course = state.courses?.find(c => c.id === data.courseId);
        const startLvl = state.levels?.find(l => l.id === data.selectedStartLevelId) || null;
        const workLvl = state.levels?.find(l => l.id === data.workingLevelId) || null;
        const row = {
          id: data.id || randomUUID(),
          learnerId: data.learnerId,
          languageId: data.languageId,
          courseId: data.courseId,
          status: data.status || 'ACTIVE',
          rowVersion: data.rowVersion || 1n,
          startSource: data.startSource || null,
          selfReport: data.selfReport || null,
          selectedStartLevelId: data.selectedStartLevelId || null,
          workingLevelId: data.workingLevelId || null,
          language: lang,
          course: course,
          selectedStartLevel: startLvl,
          workingLevel: workLvl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.contexts.push(row);
        return row;
      },
      update: async args => {
        const i = state.contexts.findIndex(r => r.id === args.where.id);
        if (i < 0) throw new Error('Record not found');
        const data = { ...args.data };
        if (typeof data.rowVersion === 'object') data.rowVersion = (state.contexts[i].rowVersion || 1n) + BigInt(data.rowVersion.increment);
        state.contexts[i] = { ...state.contexts[i], ...data, updatedAt: new Date() };
        return projected(state.contexts[i], args);
      },
    },
    unit: {
      findMany: async args => {
        const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
        const unitsWithRelations = (state.units || []).map(u => ({
          ...u,
          level: u.level || (state.levels || []).find(lvl => lvl.id === u.levelId),
          lessons: getUnitLessons(u),
        }));
        return many(unitsWithRelations, args);
      },
      count: async args => {
        const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
        const unitsWithRelations = (state.units || []).map(u => ({
          ...u,
          level: u.level || (state.levels || []).find(lvl => lvl.id === u.levelId),
          lessons: getUnitLessons(u),
        }));
        return many(unitsWithRelations, args).length;
      },
    },
    lesson: {
      findFirst: async args => {
        const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
        const allLessons = (state.units || []).flatMap(u => getUnitLessons(u).map(l => ({ ...l, unitId: u.id }))).concat(state.lessons || []);
        const uniqueLessons = Array.from(new Map(allLessons.map(l => [l.id, l])).values());
        return first(uniqueLessons, args);
      },
      findMany: async args => {
        const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
        const allLessons = (state.units || []).flatMap(u => getUnitLessons(u).map(l => ({ ...l, unitId: u.id }))).concat(state.lessons || []);
        const uniqueLessons = Array.from(new Map(allLessons.map(l => [l.id, l])).values());
        return many(uniqueLessons, args);
      },
      count: async args => {
        const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
        const allLessons = (state.units || []).flatMap(u => getUnitLessons(u).map(l => ({ ...l, unitId: u.id, unit: u }))).concat((state.lessons || []).map(l => ({ ...l, unit: (state.units || []).find(u => u.id === l.unitId) })));
        const uniqueLessons = Array.from(new Map(allLessons.map(l => [l.id, l])).values());
        return many(uniqueLessons, args).length;
      },
    },
    lessonExercise: {
      findMany: async args => many(state.exercises, args),
    },
    lessonVocabularyLink: {
      findMany: async args => many(state.vocabulary, args),
    },
    lessonCompletion: {
      findUnique: async args => {
        const where = args.where.contextId_lessonId || args.where;
        return first(state.completions, { ...args, where });
      },
      findFirst: async args => first(state.completions, args),
      findMany: async args => many(state.completions, args),
      create: async ({ data }) => {
        const row = { id: randomUUID(), ...data };
        state.completions.push(row);
        return row;
      },
    },
    lessonConsumption: {
      findUnique: async args => {
        const where = args.where.contextId_lessonRevisionId || args.where;
        return first(state.consumptions, { ...args, where });
      },
      findMany: async args => many(state.consumptions, args),
      create: async ({ data }) => {
        if (state.consumptions.some(r => r.contextId === data.contextId && r.lessonRevisionId === data.lessonRevisionId)) {
          throw Object.assign(new Error('Unique conflict'), { code: 'P2002' });
        }
        const row = { id: randomUUID(), completedAt: null, createdAt: data.createdAt || data.startedAt, rowVersion: 1n, ...data };
        state.consumptions.push(row);
        return row;
      },
      update: async args => {
        const i = state.consumptions.findIndex(r => r.id === args.where.id);
        if (i < 0) throw new Error('Record not found');
        const data = { ...args.data };
        if (typeof data.rowVersion === 'object') data.rowVersion = state.consumptions[i].rowVersion + BigInt(data.rowVersion.increment);
        state.consumptions[i] = { ...state.consumptions[i], ...data };
        return projected(state.consumptions[i], args);
      },
    },
    lessonAttempt: {
      findUnique: async args => {
        if(state.attemptFailure)throw new Error('Simulated attempt-only outage');
        const attempt = first(state.attempts, args);
        if (!attempt) return null;
        if (args.include?.responses) {
          const resps = many(state.responses.filter(r => r.attemptId === attempt.id), args.include.responses);
          return { ...attempt, responses: resps };
        }
        return attempt;
      },
      findFirst: async args => {
        if(state.attemptFailure)throw new Error('Simulated attempt-only outage');
        const attempt = first(state.attempts, args);
        if (!attempt) return null;
        if (args.include?.responses) {
          const resps = many(state.responses.filter(r => r.attemptId === attempt.id), args.include.responses);
          return { ...attempt, responses: resps };
        }
        return attempt;
      },
      findMany: async args => many(state.attempts, args),
      count: async args => state.attempts.filter(r => matches(r, args?.where)).length,
      create: async ({ data }) => {
        if (state.attempts.some(a => a.id === data.id)) {
          throw Object.assign(new Error('Attempt unique conflict'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          contextId: data.contextId,
          lessonId: data.lessonId,
          lessonRevisionId: data.lessonRevisionId,
          nCore: data.nCore,
          kFirstWrong: data.kFirstWrong ?? null,
          contributionUnits: data.contributionUnits ?? null,
          responseCount: data.responseCount ?? null,
          completionOperationKey: data.completionOperationKey ?? null,
          qualifyingLocalDate: data.qualifyingLocalDate ?? null,
          timezoneAtCompletion: data.timezoneAtCompletion ?? null,
          startedAt: data.startedAt || new Date(),
          completedAt: data.completedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          rowVersion: 1n,
        };
        state.attempts.push(row);
        return { ...row, responses: [] };
      },
      update: async args => {
        const i = state.attempts.findIndex(r => r.id === args.where.id);
        if (i < 0) throw new Error('Record not found');
        const data = { ...args.data };
        if (typeof data.rowVersion === 'object') data.rowVersion = state.attempts[i].rowVersion + BigInt(data.rowVersion.increment);
        state.attempts[i] = { ...state.attempts[i], ...data, updatedAt: new Date() };
        const updated = state.attempts[i];
        if (args.include?.responses) {
          const resps = many(state.responses.filter(r => r.attemptId === updated.id), args.include.responses);
          return { ...updated, responses: resps };
        }
        return projected(updated, args);
      },
    },
    lessonResponse: {
      findUnique: async args => {
        const where = args.where.attemptId_operationKey ||
                      args.where.attemptId_lessonExerciseId_responseOrdinal ||
                      args.where.attemptId_queuePosition ||
                      args.where;
        return first(state.responses, { ...args, where });
      },
      findFirst: async args => first(state.responses, args),
      findMany: async args => many(state.responses, args),
      create: async ({ data }) => {
        if (state.responses.some(r => r.attemptId === data.attemptId && r.operationKey === data.operationKey)) {
          throw Object.assign(new Error('Response operation_key unique conflict'), { code: 'P2002' });
        }
        if (state.responses.some(r => r.attemptId === data.attemptId && r.queuePosition === data.queuePosition)) {
          throw Object.assign(new Error('Response queue_position unique conflict'), { code: 'P2002' });
        }
        const row = {
          id: randomUUID(),
          attemptId: data.attemptId,
          lessonExerciseId: data.lessonExerciseId,
          lessonRevisionId: data.lessonRevisionId,
          responseOrdinal: data.responseOrdinal,
          queuePosition: data.queuePosition,
          operationKey: data.operationKey,
          input: data.input,
          inputHash: data.inputHash,
          isCorrect: data.isCorrect,
          contributionUnits: data.contributionUnits,
          respondedAt: data.respondedAt || new Date(),
          createdAt: new Date(),
        };
        state.responses.push(row);
        return row;
      },
    },
    srsCard: {
      findUnique: async args => {
        const where = args.where.learnerId_vocabularyId || args.where.id_learnerId || args.where;
        const row = first(state.srsCards, { ...args, where });
        if (row && args?.include?.vocabulary && !row.vocabulary) {
          row.vocabulary = (state.vocabularyConcepts || []).find(v => v.id === row.vocabularyId) || null;
        }
        return row;
      },
      findFirst: async args => {
        const rows = state.srsCards.map(c => {
          if (!c.vocabulary) {
            c.vocabulary = (state.vocabularyConcepts || []).find(v => v.id === c.vocabularyId) || null;
          }
          return c;
        });
        return first(rows, args);
      },
      findMany: async args => many(state.srsCards, args),
      update: async ({ where, data }) => {
        const target = state.srsCards.find(r => r.id === where.id);
        if (!target) throw new Error('Card not found for update');
        Object.assign(target, data);
        return target;
      },
      create: async ({ data }) => {
        const row = {
          id: randomUUID(),
          learnerId: data.learnerId,
          vocabularyId: data.vocabularyId,
          stage: data.stage ?? 1,
          dueAt: data.dueAt,
          lastReviewedAt: null,
          enrollmentSource: data.enrollmentSource,
          sourceAttemptId: data.sourceAttemptId ?? null,
          sourceLessonVocabularyId: data.sourceLessonVocabularyId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          rowVersion: 1n,
          vocabulary: (state.vocabularyConcepts || []).find(v => v.id === data.vocabularyId) || null,
        };
        state.srsCards.push(row);
        return row;
      },
    },
    srsReviewOperation: {
      findUnique: async args => {
        const where = args.where.learnerId_operationKey || args.where;
        return first(state.srsReviewOperations, { ...args, where });
      },
      create: async ({ data }) => {
        const row = {
          id: randomUUID(),
          ...data,
          createdAt: new Date(),
        };
        state.srsReviewOperations.push(row);
        return row;
      },
      findMany: async args => many(state.srsReviewOperations, args),
    },
    commandReceipt: {
      findUnique: async args => {
        const where = args.where.actorId_command_operationKey || args.where;
        return first(state.commandReceipts, { ...args, where });
      },
      create: async ({ data }) => {
        if (state.commandReceipts.some(r => r.actorId === data.actorId && r.command === data.command && r.operationKey === data.operationKey)) {
          throw Object.assign(new Error('Command receipt unique conflict'), { code: 'P2002' });
        }
        const row = {
          id: randomUUID(),
          actorId: data.actorId,
          command: data.command,
          operationKey: data.operationKey,
          inputHash: data.inputHash,
          targetId: data.targetId,
          safeResult: data.safeResult || {},
          committedAt: data.committedAt || new Date(),
          createdAt: new Date(),
        };
        state.commandReceipts.push(row);
        return row;
      },
    },
    $transaction: async fn => {
      const snap = {
        contexts: structuredClone(state.contexts),
        consumptions: structuredClone(state.consumptions),
        attempts: structuredClone(state.attempts),
        responses: structuredClone(state.responses),
        completions: structuredClone(state.completions),
        srsCards: structuredClone(state.srsCards),
        srsReviewOperations: structuredClone(state.srsReviewOperations),
        commandReceipts: structuredClone(state.commandReceipts),
      };
      try {
        return await fn(db);
      } catch (e) {
        state.contexts = snap.contexts;
        state.consumptions = snap.consumptions;
        state.attempts = snap.attempts;
        state.responses = snap.responses;
        state.completions = snap.completions;
        state.srsCards = snap.srsCards;
        state.srsReviewOperations = snap.srsReviewOperations;
        state.commandReceipts = snap.commandReceipts;
        throw e;
      }
    },
    $queryRaw: async (strings, ...values) => {
      const sql = strings.join('');
      if (sql.includes('clock_timestamp')) {
        const now = new Date();
        return [{ ts: now, completed_at: now, qualifying_date: now }];
      }
      if (sql.includes('app.accounts') && sql.includes('FOR UPDATE')) {
        return [{ id: values[0] }];
      }
      if (sql.includes('app.srs_cards') && sql.includes('FOR UPDATE')) {
        return [{ id: values[0], row_version: 1n }];
      }
      if (sql.includes('app.lesson_consumptions')) {
        return state.consumptions.filter(r => r.contextId === values[0] && r.lessonRevisionId === values[1]).map(r => ({ id: r.id }));
      }
      if (sql.includes('app.lesson_attempts')) {
        return state.attempts.filter(r => r.id === values[0]).map(r => ({ id: r.id }));
      }
      const getUnitLessons = (u) => (u.lessons && u.lessons.length > 0) ? u.lessons : (state.lessons || []).filter(l => l.unitId === u.id);
      if (sql.includes('app.levels') && sql.includes('FOR SHARE')) {
        const targetCourseId = values[0]?.toLowerCase?.() || values[0];
        const units = targetCourseId ? (state.units || []).filter(u => u.courseId?.toLowerCase() === targetCourseId) : (state.units || []);
        const levelIds = new Set(units.map(u => u.levelId));
        return (state.levels || []).filter(l => levelIds.has(l.id)).map(l => ({ id: l.id, position: l.position, frameworkId: l.frameworkId }));
      }
      if (sql.includes('app.lesson_revisions') && sql.includes('FOR SHARE')) {
        const targetCourseId = values[0]?.toLowerCase?.() || values[0];
        const units = targetCourseId ? (state.units || []).filter(u => u.courseId?.toLowerCase() === targetCourseId) : (state.units || []);
        const lessons = units.flatMap(u => getUnitLessons(u));
        return lessons.map(l => l.activeRevision).filter(Boolean).map(r => ({ id: r.id, lessonId: r.lessonId, status: r.status }));
      }
      if (sql.includes('app.lessons') && (sql.includes('FOR SHARE') || sql.includes('availability = \'AVAILABLE\''))) {
        const targetCourseId = values[0]?.toLowerCase?.() || values[0];
        const units = targetCourseId ? (state.units || []).filter(u => u.courseId?.toLowerCase() === targetCourseId) : (state.units || []);
        const lessons = units.flatMap(u => getUnitLessons(u).map(l => ({ ...l, unitId: u.id })));
        return lessons.map(l => ({ id: l.id, unitId: l.unitId, position: l.position, availability: l.availability, activeRevisionId: l.activeRevisionId || l.activeRevision?.id || null }));
      }
      if (sql.includes('app.units') && sql.includes('FOR SHARE')) {
        const targetCourseId = values[0]?.toLowerCase?.() || values[0];
        const units = targetCourseId ? (state.units || []).filter(u => u.courseId?.toLowerCase() === targetCourseId) : (state.units || []);
        return units.map(u => ({ id: u.id, levelId: u.levelId, position: u.position }));
      }
      return [];
    },
    $executeRaw: async (strings, ...v) => {
      const sql = strings.join('');
      if (sql.includes('UPDATE app.learning_contexts')) {
        const ctxId = v[v.length - 1];
        const ctx = state.contexts.find(c => c.id === ctxId);
        if (ctx) {
          ctx.status = v[0];
          ctx.rowVersion = (ctx.rowVersion || 1n) + 1n;
          ctx.updatedAt = v[1] || new Date();
        }
        return 1;
      }
      if (sql.includes('INSERT INTO app.lesson_consumptions')) {
        if (state.consumptions.some(r => r.contextId === v[0] && r.lessonRevisionId === v[2])) return 0;
        await db.lessonConsumption.create({
          data: { contextId: v[0], lessonId: v[1], lessonRevisionId: v[2], startedAt: v[3], createdAt: v[4], updatedAt: v[5], rowVersion: 1n },
        });
      }
      if (sql.includes('INSERT INTO app.lesson_completions')) {
        // v: contextId, lessonId, attemptId, completedAt, completedAt
        if (state.completions.some(r => r.contextId === v[0] && r.lessonId === v[1])) return 0;
        state.completions.push({
          id: randomUUID(),
          contextId: v[0],
          lessonId: v[1],
          firstAttemptId: v[2],
          completedAt: v[3],
          createdAt: v[4],
        });
      }
      if (sql.includes('INSERT INTO app.srs_cards')) {
        // interpolated values: [account.id, link.vocabularyId, dueAt, attemptId, link.id, completedAt, completedAt]
        if (state.srsCards.some(r => r.learnerId === v[0] && r.vocabularyId === v[1])) return 0;
        state.srsCards.push({
          id: randomUUID(),
          learnerId: v[0],
          vocabularyId: v[1],
          stage: 1,
          dueAt: v[2],
          enrollmentSource: 'CORE_COMPLETION',
          sourceAttemptId: v[3],
          sourceLessonVocabularyId: v[4],
          createdAt: v[5],
          updatedAt: v[6],
          rowVersion: 1n,
        });
      }
      return 1;
    },
  };
  return db;
}

export function providerDouble(state) {
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url || String(input));
    if (url.origin !== providerOrigin) throw new Error('Unexpected external test request');
    if (url.pathname.endsWith('/token')) {
      const body = JSON.parse(init?.body || '{}');
      if (state.unconfirmed) {
        return Response.json(
          { code: 'email_not_confirmed', message: 'Email not confirmed' },
          { status: 400, headers: { 'x-supabase-api-version': '2024-01-01' } }
        );
      }
      if (url.searchParams.get('grant_type') === 'password' && (body.email !== fixtureEmail || body.password !== fixturePassword)) {
        return Response.json({ code: 'invalid_credentials', message: 'Invalid credentials' }, { status: 400 });
      }
      state.refreshes = (state.refreshes || 0) + Number(url.searchParams.get('grant_type') === 'refresh_token');
      return Response.json(token(state.user || confirmedUser()));
    }
    if (url.pathname.endsWith('/user')) {
      return state.expired
        ? Response.json({ code: 'bad_jwt', message: 'Invalid token' }, { status: 401 })
        : Response.json(state.user || confirmedUser());
    }
    if (url.pathname.endsWith('/logout')) {
      state.logoutScopes ||= [];
      state.logoutScopes.push(url.searchParams.get('scope'));
      return new Response(null, { status: 204 });
    }
    return Response.json({ error: 'Unexpected provider path' }, { status: 404 });
  };
}
