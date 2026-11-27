import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

mock.module('server-only', { exports: {} });

let currentCookieStore = {
  getAll: () => [],
  get: () => undefined,
  set: () => {},
  delete: () => {},
};

let redirectTarget = null;

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

mock.module('next/navigation.js', {
  exports: {
    redirect: (target) => {
      redirectTarget = target;
      throw new Error(`REDIRECT:${target}`);
    },
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/characters',
  },
});

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { GET, POST } = await import('../../src/app/api/characters/route.ts');
const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const TEACHER_ID = '11111111-1111-4111-8111-111111111111';
const LEARNER_ID = '22222222-2222-4222-8222-222222222222';
const PENDING_ADMIN_ID = '33333333-3333-4333-8333-333333333333';

const JA_LANG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const ZH_LANG_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const EN_LANG_ID = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';

function mockSessionCookie(userId, expiresIn = 3600) {
  const payload = {
    sub: userId,
    email: `${userId}@lingora.test`,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
      JSON.stringify(payload)
    ).toString('base64url')}.signature`,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: { id: userId, email: payload.email },
  };
  return {
    name: 'sb-test-project-ref-auth-token',
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
  };
}

function buildMockDb() {
  const accounts = new Map([
    [ADMIN_ID, { id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin', uiLocale: 'vi' }],
    [TEACHER_ID, { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', displayName: 'Teacher', uiLocale: 'vi' }],
    [LEARNER_ID, { id: LEARNER_ID, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner', uiLocale: 'vi' }],
    [PENDING_ADMIN_ID, { id: PENDING_ADMIN_ID, role: 'ADMIN', status: 'PENDING', displayName: 'Pending Admin', uiLocale: 'vi' }],
  ]);

  const languages = new Map([
    [JA_LANG_ID, { id: JA_LANG_ID, code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' }, isLearnable: true, isUiLocale: false }],
    [ZH_LANG_ID, { id: ZH_LANG_ID, code: 'zh', names: { vi: 'Tiếng Trung', en: 'Chinese' }, isLearnable: true, isUiLocale: false }],
    [EN_LANG_ID, { id: EN_LANG_ID, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' }, isLearnable: true, isUiLocale: true }],
  ]);

  const characters = [];
  let dbCalls = 0;

  const matchesWhere = (row, where) => {
    if (!where) return true;
    if (where.languageId && row.languageId !== where.languageId) return false;
    if (where.scriptType && row.scriptType !== where.scriptType) return false;
    if (Array.isArray(where.OR) && where.OR.length > 0) {
      const q = (where.OR[0]?.glyph?.contains || '').toLowerCase();
      const matched =
        row.glyph.toLowerCase().includes(q) ||
        (row.meaning || '').toLowerCase().includes(q) ||
        (row.primaryReading || '').toLowerCase().includes(q) ||
        (row.romanization || '').toLowerCase().includes(q);
      if (!matched) return false;
    }
    return true;
  };

  return {
    getDbCalls: () => dbCalls,
    resetDbCalls: () => {
      dbCalls = 0;
    },
    seedCharacter: (row) => {
      characters.push(row);
    },
    db: {
      account: {
        findUnique: async ({ where }) => accounts.get(where.id) ?? null,
      },
      language: {
        findMany: async () => Array.from(languages.values()),
        findUnique: async ({ where }) => languages.get(where.id) ?? null,
      },
      writingCharacter: {
        findMany: async ({ where, take = 20, skip = 0 }) => {
          dbCalls++;
          const filtered = characters
            .filter((row) => matchesWhere(row, where))
            .sort((a, b) => a.strokeCount - b.strokeCount || a.glyph.localeCompare(b.glyph));
          return filtered.slice(skip, skip + take).map((row) => ({
            ...row,
            language: languages.get(row.languageId) ?? null,
          }));
        },
        count: async ({ where }) => {
          dbCalls++;
          return characters.filter((row) => matchesWhere(row, where)).length;
        },
        create: async ({ data }) => {
          dbCalls++;
          const dup = characters.find(
            (c) => c.languageId === data.languageId && c.glyph === data.glyph
          );
          if (dup) {
            const p2002 = new Error('Unique constraint failed on the fields: (`language_id`,`glyph`)');
            p2002.code = 'P2002';
            throw p2002;
          }
          const created = {
            id: data.id || randomUUID(),
            ...data,
            strokeData: null,
          };
          characters.push(created);
          return created;
        },
      },
    },
  };
}

describe('EXT-02 Route & Page Integration: /api/characters & /characters', () => {
  let mockStore;
  let currentAuthUserId = ADMIN_ID;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    currentAuthUserId = ADMIN_ID;
    redirectTarget = null;
    mockStore = buildMockDb();
    setProductPrismaForTest(mockStore.db);

    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/user')) {
        return Response.json({
          id: currentAuthUserId,
          email: `${currentAuthUserId}@lingora.test`,
        });
      }
      return Response.json({});
    };

    currentCookieStore = {
      getAll: () => [mockSessionCookie(currentAuthUserId)],
      get: () => mockSessionCookie(currentAuthUserId),
      set: () => {},
      delete: () => {},
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
  });

  test('Auth & RBAC: anonymous, Teacher, Learner, and PENDING Admin are denied with zero character DB ops', async () => {
    // 1. Anonymous GET & POST
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
    const anonGet = await GET(new Request('http://localhost/api/characters'));
    assert.equal(anonGet.status, 401);
    assert.equal(anonGet.headers.get('cache-control'), 'no-store, private');

    const anonPost = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ languageId: JA_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 4 }),
      })
    );
    assert.equal(anonPost.status, 401);
    assert.equal(mockStore.getDbCalls(), 0);

    // 2. Teacher, Learner, PENDING Admin
    for (const actorId of [TEACHER_ID, LEARNER_ID, PENDING_ADMIN_ID]) {
      currentAuthUserId = actorId;
      currentCookieStore = {
        getAll: () => [mockSessionCookie(actorId)],
        get: () => mockSessionCookie(actorId),
        set: () => {},
        delete: () => {},
      };

      const resGet = await GET(new Request('http://localhost/api/characters'));
      assert.equal(resGet.status, 403, `GET must deny ${actorId}`);

      const resPost = await POST(
        new Request('http://localhost/api/characters', {
          method: 'POST',
          headers: {
            Host: 'localhost',
            Origin: 'http://localhost',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ languageId: JA_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 4 }),
        })
      );
      assert.equal(resPost.status, 403, `POST must deny ${actorId}`);
    }
    assert.equal(mockStore.getDbCalls(), 0);
  });

  test('POST /api/characters enforces Origin, Content-Type, malformed JSON, Zod rules, and language/script rules', async () => {
    // Foreign origin
    const foreignRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
    );
    assert.equal(foreignRes.status, 403);
    assert.equal((await foreignRes.json()).error.code, 'FORBIDDEN_ORIGIN');

    // Non-JSON content-type
    const nonJsonRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'text/plain',
        },
        body: 'glyph=日',
      })
    );
    assert.equal(nonJsonRes.status, 415);

    // Malformed JSON
    const badJsonRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: '{invalid-json',
      })
    );
    assert.equal(badJsonRes.status, 400);
    assert.equal((await badJsonRes.json()).error.code, 'MALFORMED_JSON');

    // Multi-grapheme glyph, empty glyph, invalid strokeCount, unknown strict key
    const invalidPayloads = [
      { languageId: JA_LANG_ID, glyph: '', scriptType: 'KANJI', strokeCount: 4 },
      { languageId: JA_LANG_ID, glyph: '日本', scriptType: 'KANJI', strokeCount: 4 },
      { languageId: JA_LANG_ID, glyph: '\u{E0100}', scriptType: 'KANJI', strokeCount: 4 },
      { languageId: JA_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 0 },
      { languageId: JA_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 129 },
      { languageId: JA_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 4, extraField: true },
      // Missing language
      { languageId: randomUUID(), glyph: '日', scriptType: 'KANJI', strokeCount: 4 },
      // Script mismatch: HIRAGANA for zh, HANZI_SIMPLIFIED for ja, KANJI for en
      { languageId: ZH_LANG_ID, glyph: 'あ', scriptType: 'HIRAGANA', strokeCount: 3 },
      { languageId: JA_LANG_ID, glyph: '汉', scriptType: 'HANZI_SIMPLIFIED', strokeCount: 5 },
      { languageId: EN_LANG_ID, glyph: '日', scriptType: 'KANJI', strokeCount: 4 },
    ];

    for (const payload of invalidPayloads) {
      const res = await POST(
        new Request('http://localhost/api/characters', {
          method: 'POST',
          headers: {
            Host: 'localhost',
            Origin: 'http://localhost',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      );
      assert.equal(res.status, 400, `Expected 400 for payload ${JSON.stringify(payload)}`);
    }
  });

  test('POST /api/characters normalizes NFD -> NFC, handles 409 duplicate, and allows same glyph across languages', async () => {
    // 1. NFD decomposed 'が' -> NFC 'が'
    const nfdRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageId: JA_LANG_ID,
          glyph: '\u304B\u3099',
          scriptType: 'HIRAGANA',
          strokeCount: 4,
          primaryReading: 'が',
          romanization: 'ga',
        }),
      })
    );
    assert.equal(nfdRes.status, 201);
    const nfdJson = await nfdRes.json();
    assert.equal(nfdJson.data.glyph, 'が');

    // 2. Create 日 in ja
    const jaRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageId: JA_LANG_ID,
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
          meaning: 'mặt trời',
          primaryReading: 'にち',
          romanization: 'nichi',
          metadata: { jlptLevel: 'N5' },
        }),
      })
    );
    assert.equal(jaRes.status, 201);

    // 3. Duplicate 日 in ja -> 409 CHARACTER_DUPLICATE
    const dupRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageId: JA_LANG_ID,
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
        }),
      })
    );
    assert.equal(dupRes.status, 409);
    const dupJson = await dupRes.json();
    assert.equal(dupJson.error.code, 'CHARACTER_DUPLICATE');
    assert.ok(!dupJson.error.message.includes('P2002'));

    // 4. Same glyph 日 in zh -> 201 succeeds
    const zhRes = await POST(
      new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: {
          Host: 'localhost',
          Origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageId: ZH_LANG_ID,
          glyph: '日',
          scriptType: 'HANZI_SIMPLIFIED',
          strokeCount: 4,
          meaning: 'mặt trời',
          primaryReading: 'rì',
          romanization: 'ri',
        }),
      })
    );
    assert.equal(zhRes.status, 201);
  });

  test('GET /api/characters validates query params and supports language/script/search/pagination without leaking strokes', async () => {
    mockStore.seedCharacter({
      id: randomUUID(),
      languageId: JA_LANG_ID,
      glyph: '日',
      scriptType: 'KANJI',
      meaning: 'sun',
      primaryReading: 'にち',
      romanization: 'nichi',
      strokeCount: 4,
      metadata: {},
      strokeData: { version: 1, strokes: [{ index: 1, path: 'M 0 0 L 1 1' }] },
    });
    mockStore.seedCharacter({
      id: randomUUID(),
      languageId: JA_LANG_ID,
      glyph: 'あ',
      scriptType: 'HIRAGANA',
      meaning: 'kana a',
      primaryReading: 'あ',
      romanization: 'a',
      strokeCount: 3,
      metadata: {},
      strokeData: null,
    });
    mockStore.seedCharacter({
      id: randomUUID(),
      languageId: ZH_LANG_ID,
      glyph: '日',
      scriptType: 'HANZI_SIMPLIFIED',
      meaning: 'sun zh',
      primaryReading: 'rì',
      romanization: 'ri',
      strokeCount: 4,
      metadata: {},
      strokeData: null,
    });

    // Invalid query parameters
    for (const badUrl of [
      'http://localhost/api/characters?languageId=not-uuid',
      'http://localhost/api/characters?scriptType=LATIN',
      'http://localhost/api/characters?limit=101',
      'http://localhost/api/characters?limit=0',
      'http://localhost/api/characters?offset=-1',
      'http://localhost/api/characters?foo=bar',
      'http://localhost/api/characters?limit=10&limit=20',
    ]) {
      const badRes = await GET(new Request(badUrl));
      assert.equal(badRes.status, 400, `Expected 400 for ${badUrl}`);
    }

    // Filter by languageId + scriptType
    const jaKanjiRes = await GET(
      new Request(`http://localhost/api/characters?languageId=${JA_LANG_ID}&scriptType=KANJI`)
    );
    assert.equal(jaKanjiRes.status, 200);
    const jaKanjiJson = await jaKanjiRes.json();
    assert.equal(jaKanjiJson.total, 1);
    assert.equal(jaKanjiJson.data.length, 1);
    assert.equal(jaKanjiJson.data[0].glyph, '日');
    assert.equal(jaKanjiJson.data[0].hasStrokes, true);
    assert.equal('strokes' in jaKanjiJson.data[0], false);

    // Search + pagination
    const page1Res = await GET(
      new Request(`http://localhost/api/characters?limit=1&offset=0`)
    );
    assert.equal(page1Res.status, 200);
    const page1 = await page1Res.json();
    assert.equal(page1.total, 3);
    assert.equal(page1.data.length, 1);
    assert.equal(page1.data[0].glyph, 'あ');
    assert.equal(page1.data[0].hasStrokes, false);

    const searchRes = await GET(
      new Request(`http://localhost/api/characters?search=r%C3%AC`)
    );
    assert.equal(searchRes.status, 200);
    const searchJson = await searchRes.json();
    assert.equal(searchJson.total, 1);
    assert.equal(searchJson.data[0].languageCode, 'zh');
  });

  test('Page SSR wiring /characters/page.tsx gates anonymous, Teacher, Learner, Disabled Admin, and renders for Active Admin', async () => {
    const CharactersPage = await compileAndLoadPage('src/app/characters/page.tsx');

    // 1. Anonymous -> redirect /login
    currentCookieStore = { getAll: () => [], get: () => undefined };
    try {
      await CharactersPage();
    } catch {}
    assert.equal(redirectTarget, '/login');
    assert.equal(mockStore.getDbCalls(), 0);

    // 2. Teacher -> redirect /holding
    redirectTarget = null;
    currentAuthUserId = TEACHER_ID;
    currentCookieStore = { getAll: () => [mockSessionCookie(TEACHER_ID)] };
    try {
      await CharactersPage();
    } catch {}
    assert.equal(redirectTarget, '/holding');
    assert.equal(mockStore.getDbCalls(), 0);

    // 3. Learner -> AccessDeniedView
    currentAuthUserId = LEARNER_ID;
    currentCookieStore = { getAll: () => [mockSessionCookie(LEARNER_ID)] };
    const learnerJsx = await CharactersPage();
    assert.equal(learnerJsx.type?.name, 'AccessDeniedView');
    assert.equal(mockStore.getDbCalls(), 0);

    // 4. Pending Admin -> AccessDeniedView
    currentAuthUserId = PENDING_ADMIN_ID;
    currentCookieStore = { getAll: () => [mockSessionCookie(PENDING_ADMIN_ID)] };
    const pendingJsx = await CharactersPage();
    assert.equal(pendingJsx.type?.name, 'AccessDeniedView');
    assert.equal(mockStore.getDbCalls(), 0);

    // 5. Active Admin -> AppShell wrapping CharacterCatalogue
    currentAuthUserId = ADMIN_ID;
    currentCookieStore = { getAll: () => [mockSessionCookie(ADMIN_ID)] };
    const adminJsx = await CharactersPage();
    assert.equal(adminJsx.type?.name, 'AppShell');
    assert.equal(adminJsx.props.children.type?.name, 'CharacterCatalogue');
    assert.equal(adminJsx.props.children.props.initialLanguages.length, 3);
  });
});
