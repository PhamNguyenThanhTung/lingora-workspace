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
export const account = () => ({ id: learnerId, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner A', uiLocale: 'vi' });

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
      if (typeof direction === 'object') {const [nested,dir]=Object.entries(direction)[0];av=av?.[nested];bv=bv?.[nested];direction=dir;}
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
  state.contexts ||= [contextRow()];state.units ||= [unitRow()];state.lessons ||= [lessonRow(),lesson2Row()];state.exercises ||= exercisesRows();state.vocabulary ||= vocabularyRows();state.completions ||= [];state.consumptions ||= [];
  const many=(rows,args)=>ordered(rows.filter(r=>matches(r,args.where)),args.orderBy).map(r=>projected(r,args));
  const first=(rows,args)=>many(rows,args)[0]||null;
  const db={
    account:{findUnique:async args=>{if(state.dbFailure)throw new Error('Simulated database outage');return first([state.account].filter(Boolean),args);}},
    learningContext:{findFirst:async args=>{if(state.contextFailure)throw new Error('Simulated context outage');return first(state.contexts,args);},findMany:async args=>{if(state.contextFailure)throw new Error('Simulated context outage');return many(state.contexts,args);}},
    unit:{findMany:async args=>many(state.units.map(u=>({...u,lessons:state.lessons.filter(l=>l.unitId===u.id)})),args)},
    lesson:{findFirst:async args=>first(state.lessons,args),findMany:async args=>many(state.lessons,args)},
    lessonExercise:{findMany:async args=>many(state.exercises,args)},
    lessonVocabularyLink:{findMany:async args=>many(state.vocabulary,args)},
    lessonCompletion:{findFirst:async args=>first(state.completions,args),findMany:async args=>many(state.completions,args)},
    lessonConsumption:{
      findUnique:async args=>{const where=args.where.contextId_lessonRevisionId||args.where;return first(state.consumptions,{...args,where});},
      findMany:async args=>many(state.consumptions,args),
      create:async({data})=>{if(state.consumptions.some(r=>r.contextId===data.contextId&&r.lessonRevisionId===data.lessonRevisionId))throw Object.assign(new Error('Unique conflict'),{code:'P2002'});const row={id:randomUUID(),completedAt:null,createdAt:data.createdAt||data.startedAt,rowVersion:1n,...data};state.consumptions.push(row);return row;},
      update:async args=>{const i=state.consumptions.findIndex(r=>r.id===args.where.id);if(i<0)throw new Error('Record not found');const data={...args.data};if(typeof data.rowVersion==='object')data.rowVersion=state.consumptions[i].rowVersion+BigInt(data.rowVersion.increment);state.consumptions[i]={...state.consumptions[i],...data};return projected(state.consumptions[i],args);},
    },
    $transaction:async fn=>{const before=structuredClone(state.consumptions);try{return await fn(db);}catch(e){state.consumptions=before;throw e;}},
    $queryRaw:async(strings,...values)=>{const sql=strings.join('');if(sql.includes('clock_timestamp'))return [{ts:new Date()}];if(sql.includes('app.lesson_consumptions'))return state.consumptions.filter(r=>r.contextId===values[0]&&r.lessonRevisionId===values[1]).map(r=>({id:r.id}));return [];},
    $executeRaw:async(strings,...v)=>{if(strings.join('').includes('INSERT INTO app.lesson_consumptions')){if(state.consumptions.some(r=>r.contextId===v[0]&&r.lessonRevisionId===v[2]))return 0;await db.lessonConsumption.create({data:{contextId:v[0],lessonId:v[1],lessonRevisionId:v[2],startedAt:v[3],createdAt:v[4],updatedAt:v[5],rowVersion:1n}});}return 1;},
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
