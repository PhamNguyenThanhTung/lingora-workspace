import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  WRITING_SCRIPT_TYPES,
  HANZI_SYSTEMS,
  validateAndNormalizeGlyph,
  writingCharacterMetadataSchema,
  createWritingCharacterSchema,
  validateCharacterInput,
  getCharacterById,
  getCharacterByGlyph,
  listCharacters,
  countCharacters,
  createCharacter,
  getAllowedScriptsForLanguageCode,
  isScriptTypeAllowedForLanguage,
  listCharactersQuerySchema,
  listCharacterCatalogue,
  createAdminCharacter,
} from '../../src/server/characters/index.ts';

describe('S6-01: Character Validator & Unicode / NFC Rules', () => {
  const dummyLangId = randomUUID();

  test('validateAndNormalizeGlyph normalizes decomposed NFD characters into single NFC grapheme', () => {
    // 'か' (U+304B) + combining mark U+3099 -> composed 'が' (U+304C)
    const decomposedGa = '\u304B\u3099';
    const res = validateAndNormalizeGlyph(decomposedGa);
    assert.equal(res.valid, true);
    if (res.valid) {
      assert.equal(res.glyph, 'が');
      assert.equal(res.glyph.length, 1);
      assert.equal(res.glyph.codePointAt(0), 0x304c);
    }
  });

  test('validateAndNormalizeGlyph preserves valid Variation Selectors (IVS) attached to base character', () => {
    // '字' (U+5B57) + VS17 (U+E0100)
    const ivsChar = '字\u{E0100}';
    const res = validateAndNormalizeGlyph(ivsChar);
    assert.equal(res.valid, true);
    if (res.valid) {
      assert.equal(res.glyph, ivsChar);
      const codePoints = Array.from(res.glyph).map((c) => c.codePointAt(0));
      assert.deepEqual(codePoints, [0x5b57, 0xe0100]);
    }
  });

  test('validateAndNormalizeGlyph rejects standalone variation selector without base glyph', () => {
    const standaloneVs = '\u{E0100}';
    const res = validateAndNormalizeGlyph(standaloneVs);
    assert.equal(res.valid, false);
    if (!res.valid) {
      assert.match(res.reason, /variation selector/i);
    }
  });

  test('validateAndNormalizeGlyph enforces exactly one grapheme cluster', () => {
    // Multi-grapheme
    assert.equal(validateAndNormalizeGlyph('あい').valid, false);
    assert.equal(validateAndNormalizeGlyph('日本語').valid, false);
    assert.equal(validateAndNormalizeGlyph('ab').valid, false);

    // Empty or whitespace
    assert.equal(validateAndNormalizeGlyph('').valid, false);
    assert.equal(validateAndNormalizeGlyph('   ').valid, false);
  });

  test('NFC is used strictly without NFKC collapsing distinct characters', () => {
    // '㌀' (U+3300) under NFKC becomes 'アパート' (4 graphemes), but under NFC remains '㌀' (1 grapheme)
    const ligature = '\u3300';
    assert.equal(ligature.normalize('NFC'), '\u3300');
    const res = validateAndNormalizeGlyph(ligature);
    assert.equal(res.valid, true);
    if (res.valid) {
      assert.equal(res.glyph, '\u3300');
    }
  });

  test('scriptType validation accepts only the 5 approved spec scripts', () => {
    assert.deepEqual(
      WRITING_SCRIPT_TYPES,
      ['HIRAGANA', 'KATAKANA', 'KANJI', 'HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL']
    );

    for (const script of WRITING_SCRIPT_TYPES) {
      const parsed = createWritingCharacterSchema.safeParse({
        languageId: dummyLangId,
        glyph: 'あ',
        scriptType: script,
        strokeCount: 3,
      });
      //あ is valid single grapheme
      assert.equal(parsed.success, true, `Script ${script} should be accepted`);
    }

    const invalidScripts = ['LATIN', 'CYRILLIC', 'hiragana', 'hanzi', ''];
    for (const badScript of invalidScripts) {
      const parsed = createWritingCharacterSchema.safeParse({
        languageId: dummyLangId,
        glyph: 'あ',
        scriptType: badScript,
        strokeCount: 3,
      });
      assert.equal(parsed.success, false, `Bad script ${badScript} should be rejected`);
    }
  });

  test('strokeCount validation enforces positive integer with upper bound 128', () => {
    const validCounts = [1, 5, 20, 64, 128];
    for (const count of validCounts) {
      const parsed = createWritingCharacterSchema.safeParse({
        languageId: dummyLangId,
        glyph: 'あ',
        scriptType: 'HIRAGANA',
        strokeCount: count,
      });
      assert.equal(parsed.success, true, `strokeCount ${count} should be valid`);
    }

    const invalidCounts = [0, -1, 129, 200, 1.5, NaN, '5'];
    for (const badCount of invalidCounts) {
      const parsed = createWritingCharacterSchema.safeParse({
        languageId: dummyLangId,
        glyph: 'あ',
        scriptType: 'HIRAGANA',
        strokeCount: badCount,
      });
      assert.equal(parsed.success, false, `strokeCount ${badCount} should be rejected`);
    }
  });
});

describe('S6-01: Hanzi Form Metadata Matching Script', () => {
  const dummyLangId = randomUUID();

  test('metadata is optional and defaults to empty object', () => {
    const parsed = validateCharacterInput({
      languageId: dummyLangId,
      glyph: 'あ',
      scriptType: 'HIRAGANA',
      strokeCount: 3,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.data.metadata, {});
    }
  });

  test('dual-system Hanzi character with SIMPLIFIED and TRADITIONAL is accepted on Hanzi scripts', () => {
    const parsed = validateCharacterInput({
      languageId: dummyLangId,
      glyph: '人',
      scriptType: 'HANZI_SIMPLIFIED',
      meaning: 'person',
      strokeCount: 2,
      metadata: {
        hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
        pinyin: ['rén'],
        tones: [2],
      },
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.data.metadata.hanziSystems, ['SIMPLIFIED', 'TRADITIONAL']);
    }
  });

  test('HANZI_SIMPLIFIED rejects hanziSystems containing only TRADITIONAL', () => {
    const parsed = validateCharacterInput({
      languageId: dummyLangId,
      glyph: '国',
      scriptType: 'HANZI_SIMPLIFIED',
      strokeCount: 8,
      metadata: {
        hanziSystems: ['TRADITIONAL'], // Mismatch!
      },
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      assert.ok(issues.some((i) => i.message.includes('HANZI_SIMPLIFIED script requires hanziSystems to include SIMPLIFIED')));
    }
  });

  test('HANZI_TRADITIONAL rejects hanziSystems containing only SIMPLIFIED', () => {
    const parsed = validateCharacterInput({
      languageId: dummyLangId,
      glyph: '國',
      scriptType: 'HANZI_TRADITIONAL',
      strokeCount: 11,
      metadata: {
        hanziSystems: ['SIMPLIFIED'], // Mismatch!
      },
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      assert.ok(issues.some((i) => i.message.includes('HANZI_TRADITIONAL script requires hanziSystems to include TRADITIONAL')));
    }
  });

  test('Kana scripts (HIRAGANA, KATAKANA) reject Hanzi metadata (hanziSystems, variants)', () => {
    const parsedSystems = validateCharacterInput({
      languageId: dummyLangId,
      glyph: 'あ',
      scriptType: 'HIRAGANA',
      strokeCount: 3,
      metadata: {
        hanziSystems: ['SIMPLIFIED'],
      },
    });
    assert.equal(parsedSystems.success, false);

    const parsedVariant = validateCharacterInput({
      languageId: dummyLangId,
      glyph: 'ア',
      scriptType: 'KATAKANA',
      strokeCount: 2,
      metadata: {
        simplifiedVariant: '阿',
      },
    });
    assert.equal(parsedVariant.success, false);
  });

  test('variant glyphs in metadata must be valid single graphemes in NFC', () => {
    const invalidVariant = validateCharacterInput({
      languageId: dummyLangId,
      glyph: '国',
      scriptType: 'HANZI_SIMPLIFIED',
      strokeCount: 8,
      metadata: {
        traditionalVariant: '國國', // Multi-grapheme
      },
    });
    assert.equal(invalidVariant.success, false);

    const validVariant = validateCharacterInput({
      languageId: dummyLangId,
      glyph: '国',
      scriptType: 'HANZI_SIMPLIFIED',
      strokeCount: 8,
      metadata: {
        traditionalVariant: '國',
      },
    });
    assert.equal(validVariant.success, true);
  });

  test('strict metadata schema rejects unrecognized fields', () => {
    const parsed = writingCharacterMetadataSchema.safeParse({
      pinyin: ['ni'],
      unrecognizedField: true,
    });
    assert.equal(parsed.success, false);
  });
});

describe('S6-01: Language-Scoped Catalogue Lookup Unit Logic', () => {
  const langJaId = randomUUID();
  const langZhId = randomUUID();

  // Test double simulating Prisma writingCharacter
  const store = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      languageId: langJaId,
      glyph: '日',
      scriptType: 'KANJI',
      meaning: 'day, sun',
      primaryReading: 'にち',
      romanization: 'nichi',
      strokeCount: 4,
      metadata: { jlptLevel: 'N5' },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      languageId: langZhId,
      glyph: '日',
      scriptType: 'HANZI_SIMPLIFIED',
      meaning: 'sun, day',
      primaryReading: 'rì',
      romanization: 'ri',
      strokeCount: 4,
      metadata: { hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'], pinyin: ['rì'] },
    },
  ];

  const mockDb = {
    writingCharacter: {
      findFirst: async ({ where }) => {
        return store.find((item) => {
          if (where.id && item.id !== where.id) return false;
          if (where.languageId && item.languageId !== where.languageId) return false;
          return true;
        }) ?? null;
      },
      findUnique: async ({ where }) => {
        if (where.languageId_glyph) {
          return store.find(
            (item) =>
              item.languageId === where.languageId_glyph.languageId &&
              item.glyph === where.languageId_glyph.glyph
          ) ?? null;
        }
        return null;
      },
      findMany: async ({ where }) => {
        return store.filter((item) => {
          if (where.languageId && item.languageId !== where.languageId) return false;
          if (where.scriptType && item.scriptType !== where.scriptType) return false;
          return true;
        });
      },
      count: async ({ where }) => {
        return store.filter((item) => {
          if (where.languageId && item.languageId !== where.languageId) return false;
          if (where.scriptType && item.scriptType !== where.scriptType) return false;
          return true;
        }).length;
      },
    },
  };

  test('getCharacterById retrieves character when languageId matches', async () => {
    const jaChar = await getCharacterById(langJaId, '11111111-1111-4111-8111-111111111111', mockDb);
    assert.ok(jaChar);
    assert.equal(jaChar.glyph, '日');
    assert.equal(jaChar.scriptType, 'KANJI');
  });

  test('getCharacterById returns null when character exists but under different language (cross-scope)', async () => {
    // Attempting to query the Chinese character ID using Japanese languageId
    const crossChar = await getCharacterById(langJaId, '22222222-2222-4222-8222-222222222222', mockDb);
    assert.equal(crossChar, null);
  });

  test('getCharacterByGlyph retrieves language-specific character for shared glyph', async () => {
    const jaGlyph = await getCharacterByGlyph(langJaId, '日', mockDb);
    assert.ok(jaGlyph);
    assert.equal(jaGlyph.languageId, langJaId);
    assert.equal(jaGlyph.scriptType, 'KANJI');

    const zhGlyph = await getCharacterByGlyph(langZhId, '日', mockDb);
    assert.ok(zhGlyph);
    assert.equal(zhGlyph.languageId, langZhId);
    assert.equal(zhGlyph.scriptType, 'HANZI_SIMPLIFIED');
  });

  test('listCharacters scopes results strictly to requested language', async () => {
    const jaList = await listCharacters({ languageId: langJaId }, mockDb);
    assert.equal(jaList.length, 1);
    assert.equal(jaList[0].languageId, langJaId);

    const zhList = await listCharacters({ languageId: langZhId }, mockDb);
    assert.equal(zhList.length, 1);
    assert.equal(zhList[0].languageId, langZhId);
  });
});

describe('EXT-02: Language/Script Compatibility & Admin Catalogue Service Helpers', () => {
  const langJaId = randomUUID();
  const langZhId = randomUUID();
  const langEnId = randomUUID();

  test('getAllowedScriptsForLanguageCode and isScriptTypeAllowedForLanguage enforce ja/zh rules', () => {
    assert.deepEqual(getAllowedScriptsForLanguageCode('ja'), ['HIRAGANA', 'KATAKANA', 'KANJI']);
    assert.deepEqual(getAllowedScriptsForLanguageCode('ja-JP'), ['HIRAGANA', 'KATAKANA', 'KANJI']);
    assert.deepEqual(getAllowedScriptsForLanguageCode('zh'), ['HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL']);
    assert.deepEqual(getAllowedScriptsForLanguageCode('zh_CN'), ['HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL']);
    assert.deepEqual(getAllowedScriptsForLanguageCode('en'), []);
    assert.deepEqual(getAllowedScriptsForLanguageCode('fr'), []);

    assert.equal(isScriptTypeAllowedForLanguage('ja', 'KANJI'), true);
    assert.equal(isScriptTypeAllowedForLanguage('ja', 'HIRAGANA'), true);
    assert.equal(isScriptTypeAllowedForLanguage('ja', 'HANZI_SIMPLIFIED'), false);
    assert.equal(isScriptTypeAllowedForLanguage('zh', 'HANZI_TRADITIONAL'), true);
    assert.equal(isScriptTypeAllowedForLanguage('zh', 'HIRAGANA'), false);
    assert.equal(isScriptTypeAllowedForLanguage('en', 'KANJI'), false);
  });

  test('listCharactersQuerySchema parses defaults and rejects invalid query params', () => {
    const empty = listCharactersQuerySchema.safeParse({});
    assert.equal(empty.success, true);
    if (empty.success) {
      assert.equal(empty.data.limit, 20);
      assert.equal(empty.data.offset, 0);
      assert.equal(empty.data.languageId, undefined);
      assert.equal(empty.data.scriptType, undefined);
      assert.equal(empty.data.search, undefined);
    }

    const withEmptyStrings = listCharactersQuerySchema.safeParse({
      languageId: '',
      scriptType: '',
      search: '   ',
      limit: '',
      offset: '',
    });
    assert.equal(withEmptyStrings.success, true);

    assert.equal(listCharactersQuerySchema.safeParse({ languageId: 'not-uuid' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ scriptType: 'LATIN' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ limit: '0' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ limit: '101' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ limit: 'abc' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ offset: '-1' }).success, false);
    assert.equal(listCharactersQuerySchema.safeParse({ unknown: 'x' }).success, false);
  });

  test('createAdminCharacter maps language mismatch, missing language, and P2002 duplicate cleanly', async () => {
    const languages = new Map([
      [langJaId, { id: langJaId, code: 'ja', names: { vi: 'Tiếng Nhật' } }],
      [langZhId, { id: langZhId, code: 'zh', names: { vi: 'Tiếng Trung' } }],
      [langEnId, { id: langEnId, code: 'en', names: { vi: 'Tiếng Anh' } }],
    ]);

    const mockDb = {
      language: {
        findUnique: async ({ where }) => languages.get(where.id) ?? null,
      },
      writingCharacter: {
        create: async ({ data }) => {
          if (data.glyph === '日' && data.languageId === langJaId) {
            const p2002 = new Error('Unique constraint failed on the fields: (`language_id`,`glyph`)');
            p2002.code = 'P2002';
            throw p2002;
          }
          return {
            id: randomUUID(),
            ...data,
          };
        },
      },
    };

    const missingLangRes = await createAdminCharacter(
      {
        languageId: randomUUID(),
        glyph: '日',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      mockDb
    );
    assert.equal(missingLangRes.status, 400);
    assert.equal(missingLangRes.error?.code, 'VALIDATION_ERROR');

    const mismatchRes = await createAdminCharacter(
      {
        languageId: langZhId,
        glyph: 'あ',
        scriptType: 'HIRAGANA',
        strokeCount: 3,
      },
      mockDb
    );
    assert.equal(mismatchRes.status, 400);
    assert.equal(mismatchRes.error?.code, 'VALIDATION_ERROR');

    const enMismatchRes = await createAdminCharacter(
      {
        languageId: langEnId,
        glyph: '日',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      mockDb
    );
    assert.equal(enMismatchRes.status, 400);

    const dupRes = await createAdminCharacter(
      {
        languageId: langJaId,
        glyph: '日',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      mockDb
    );
    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.error?.code, 'CHARACTER_DUPLICATE');
    assert.ok(!dupRes.error?.message.includes('Unique constraint failed'));

    const okRes = await createAdminCharacter(
      {
        languageId: langJaId,
        glyph: '\u304B\u3099', // NFD -> NFC 'が'
        scriptType: 'HIRAGANA',
        strokeCount: 4,
      },
      mockDb
    );
    assert.equal(okRes.status, 201);
    assert.equal(okRes.data?.data.glyph, 'が');
    assert.equal(okRes.data?.data.hasStrokes, false);
    assert.equal(okRes.data?.data.languageCode, 'ja');
  });

  test('listCharacterCatalogue returns hasStrokes flag without exposing stroke geometry', async () => {
    const mockDb = {
      writingCharacter: {
        findMany: async () => [
          {
            id: randomUUID(),
            languageId: langJaId,
            glyph: '日',
            scriptType: 'KANJI',
            meaning: 'sun',
            primaryReading: 'にち',
            romanization: 'nichi',
            strokeCount: 4,
            metadata: {},
            language: { id: langJaId, code: 'ja', names: { vi: 'Tiếng Nhật' } },
            strokeData: { version: 1 },
          },
          {
            id: randomUUID(),
            languageId: langJaId,
            glyph: '木',
            scriptType: 'KANJI',
            meaning: 'tree',
            primaryReading: 'き',
            romanization: 'ki',
            strokeCount: 4,
            metadata: {},
            language: { id: langJaId, code: 'ja', names: { vi: 'Tiếng Nhật' } },
            strokeData: null,
          },
        ],
        count: async () => 2,
      },
    };

    const res = await listCharacterCatalogue({ languageId: langJaId, limit: '20', offset: '0' }, mockDb);
    assert.equal(res.status, 200);
    assert.equal(res.data?.total, 2);
    assert.equal(res.data?.data[0].hasStrokes, true);
    assert.equal(res.data?.data[1].hasStrokes, false);
    assert.equal('strokes' in res.data.data[0], false);
  });
});
