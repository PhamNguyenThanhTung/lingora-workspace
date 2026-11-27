import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/product-client/index.js';
import {
  createCharacter,
  getCharacterById,
  getCharacterByGlyph,
  listCharacters,
  countCharacters,
  createAdminCharacter,
  listCharacterCatalogue,
} from '../../src/server/characters/index.ts';

export function validateTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Run npm run test:integration:characters to provision a disposable database');
  }
  if (env.SLICE11_TEST_DATABASE_OWNED !== '1' || url !== env.SLICE11_LOCAL_DATABASE_URL) {
    throw new Error('Expected the owned database provisioned by scripts/local-test-db.mjs');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Database URL is not a valid URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(`Database URL must target loopback host (127.0.0.1 or localhost), got: ${parsed.hostname}`);
  }
  return url;
}

const testDbUrl = validateTestDatabaseUrl(process.env);

describe('S6-01: Real PostgreSQL WritingCharacter Constraints, RLS and Scoped Lookups', () => {
  let prisma;
  let jaLang;
  let zhLang;

  before(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
      log: [],
    });

    await prisma.$connect();

    // Ensure test languages exist in app.languages
    jaLang = await prisma.language.upsert({
      where: { code: 'ja' },
      update: {},
      create: {
        code: 'ja',
        names: { ja: '日本語', en: 'Japanese', vi: 'Tiếng Nhật' },
        isLearnable: true,
        isUiLocale: false,
      },
    });

    zhLang = await prisma.language.upsert({
      where: { code: 'zh' },
      update: {},
      create: {
        code: 'zh',
        names: { zh: '中文', en: 'Chinese', vi: 'Tiếng Trung' },
        isLearnable: true,
        isUiLocale: false,
      },
    });
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  test('RLS is ENABLED and FORCED on app.writing_characters', async () => {
    const result = await prisma.$queryRawUnsafe(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'app' AND c.relname = 'writing_characters';
    `);

    assert.equal(result.length, 1);
    assert.equal(result[0].relrowsecurity, true, 'relrowsecurity must be true (ENABLE RLS)');
    assert.equal(result[0].relforcerowsecurity, true, 'relforcerowsecurity must be true (FORCE RLS)');
  });

  test('Direct access is REVOKED from anon and authenticated roles', async () => {
    // Test anon role access rejection
    await assert.rejects(
      async () => {
        await prisma.$executeRawUnsafe(`
          DO $$
          BEGIN
            SET LOCAL ROLE anon;
            PERFORM * FROM app.writing_characters LIMIT 1;
          END
          $$;
        `);
      },
      (err) => {
        // PostgreSQL error code 42501: insufficient_privilege
        return err.message.includes('42501') || err.message.includes('permission denied');
      },
      'anon role must be denied access with 42501'
    );

    // Test authenticated role access rejection
    await assert.rejects(
      async () => {
        await prisma.$executeRawUnsafe(`
          DO $$
          BEGIN
            SET LOCAL ROLE authenticated;
            PERFORM * FROM app.writing_characters LIMIT 1;
          END
          $$;
        `);
      },
      (err) => {
        return err.message.includes('42501') || err.message.includes('permission denied');
      },
      'authenticated role must be denied access with 42501'
    );
  });

  test('Foreign key constraint: inserting with non-existent language_id fails with 23503', async () => {
    const nonExistentLangId = randomUUID();
    await assert.rejects(
      async () => {
        await prisma.writingCharacter.create({
          data: {
            languageId: nonExistentLangId,
            glyph: 'あ',
            scriptType: 'HIRAGANA',
            strokeCount: 3,
          },
        });
      },
      (err) => {
        // Prisma P2003 or PostgreSQL 23503 foreign key violation
        return err.code === 'P2003' || (err.message && err.message.includes('foreign key constraint'));
      }
    );
  });

  test('Foreign key constraint: deleting a Language with characters fails with RESTRICT (23503)', async () => {
    // Create a temporary language
    const tempLang = await prisma.language.create({
      data: {
        code: `test-del-${randomUUID().slice(0, 8)}`,
        names: { en: 'Temp Delete' },
        isLearnable: false,
        isUiLocale: false,
      },
    });

    // Create a character under it
    await prisma.writingCharacter.create({
      data: {
        languageId: tempLang.id,
        glyph: 'テ',
        scriptType: 'KATAKANA',
        strokeCount: 3,
      },
    });

    // Attempt to delete language should fail with RESTRICT
    await assert.rejects(
      async () => {
        await prisma.language.delete({
          where: { id: tempLang.id },
        });
      },
      (err) => {
        return err.code === 'P2003' || (err.message && err.message.includes('foreign key constraint'));
      }
    );

    // Cleanup: delete character first, then language
    await prisma.writingCharacter.deleteMany({ where: { languageId: tempLang.id } });
    await prisma.language.delete({ where: { id: tempLang.id } });
  });

  test('Unique constraint: duplicate (language_id, glyph) in same language fails with 23505', async () => {
    const glyph = '字';
    const first = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph,
        scriptType: 'KANJI',
        strokeCount: 6,
      },
    });
    assert.ok(first.id);

    // Attempting same glyph in same language fails
    await assert.rejects(
      async () => {
        await prisma.writingCharacter.create({
          data: {
            languageId: jaLang.id,
            glyph,
            scriptType: 'KANJI',
            strokeCount: 6,
          },
        });
      },
      (err) => {
        return err.code === 'P2002' || (err.message && err.message.includes('Unique constraint failed'));
      }
    );

    // Clean up
    await prisma.writingCharacter.delete({ where: { id: first.id } });
  });

  test('Chữ cùng hình khác ngôn ngữ: identical glyph in different languages succeeds and scopes lookups', async () => {
    const sharedGlyph = '日';

    // 1. Insert in Japanese
    const jaChar = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: sharedGlyph,
        scriptType: 'KANJI',
        meaning: 'sun, day',
        primaryReading: 'にち',
        romanization: 'nichi',
        strokeCount: 4,
        metadata: { jlptLevel: 'N5' },
      },
      prisma
    );
    assert.ok(jaChar.id);
    assert.equal(jaChar.languageId, jaLang.id);

    // 2. Insert same glyph in Chinese (should succeed without conflict)
    const zhChar = await createCharacter(
      {
        languageId: zhLang.id,
        glyph: sharedGlyph,
        scriptType: 'HANZI_SIMPLIFIED',
        meaning: 'sun, day',
        primaryReading: 'rì',
        romanization: 'ri',
        strokeCount: 4,
        metadata: {
          hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
          pinyin: ['rì'],
          tones: [4],
        },
      },
      prisma
    );
    assert.ok(zhChar.id);
    assert.equal(zhChar.languageId, zhLang.id);
    assert.notEqual(jaChar.id, zhChar.id);

    // 3. Scoped lookup by ID
    const foundJaById = await getCharacterById(jaLang.id, jaChar.id, prisma);
    assert.ok(foundJaById);
    assert.equal(foundJaById.id, jaChar.id);
    assert.equal(foundJaById.scriptType, 'KANJI');

    const foundZhById = await getCharacterById(zhLang.id, zhChar.id, prisma);
    assert.ok(foundZhById);
    assert.equal(foundZhById.id, zhChar.id);
    assert.equal(foundZhById.scriptType, 'HANZI_SIMPLIFIED');

    // 4. Cross-language ID lookup returns null (safety guarantee)
    const crossJaLookingForZh = await getCharacterById(jaLang.id, zhChar.id, prisma);
    assert.equal(crossJaLookingForZh, null);

    const crossZhLookingForJa = await getCharacterById(zhLang.id, jaChar.id, prisma);
    assert.equal(crossZhLookingForJa, null);

    // 5. Scoped lookup by glyph
    const foundJaByGlyph = await getCharacterByGlyph(jaLang.id, sharedGlyph, prisma);
    assert.ok(foundJaByGlyph);
    assert.equal(foundJaByGlyph.id, jaChar.id);

    const foundZhByGlyph = await getCharacterByGlyph(zhLang.id, sharedGlyph, prisma);
    assert.ok(foundZhByGlyph);
    assert.equal(foundZhByGlyph.id, zhChar.id);

    // Clean up
    await prisma.writingCharacter.deleteMany({
      where: { id: { in: [jaChar.id, zhChar.id] } },
    });
  });

  test('Check constraint: stroke_count bounds (1 to 128)', async () => {
    // 0 strokes fails
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
        VALUES ('${jaLang.id}', '零', 'KANJI', 0);
      `);
    }, /check constraint.*stroke_count/i);

    // 129 strokes fails
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
        VALUES ('${jaLang.id}', '多', 'KANJI', 129);
      `);
    }, /check constraint.*stroke_count/i);

    // 1 and 128 strokes succeed
    await prisma.$executeRawUnsafe(`
      INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
      VALUES ('${jaLang.id}', '一', 'KANJI', 1);
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
      VALUES ('${jaLang.id}', '龍', 'KANJI', 128);
    `);

    // Clean up
    await prisma.writingCharacter.deleteMany({
      where: { languageId: jaLang.id, glyph: { in: ['一', '龍'] } },
    });
  });

  test('Check constraint: script_type must be one of the 5 spec scripts', async () => {
    // Invalid script fails CHECK
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
        VALUES ('${jaLang.id}', 'X', 'LATIN', 1);
      `);
    }, /check constraint.*script_type/i);

    // All 5 valid scripts succeed
    const scripts = ['HIRAGANA', 'KATAKANA', 'KANJI', 'HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL'];
    const glyphs = ['あ', 'ア', '漢', '简', '繁'];

    for (let i = 0; i < scripts.length; i++) {
      const char = await prisma.writingCharacter.create({
        data: {
          languageId: jaLang.id,
          glyph: glyphs[i],
          scriptType: scripts[i],
          strokeCount: i + 1,
        },
      });
      assert.ok(char.id);
    }

    // Clean up
    await prisma.writingCharacter.deleteMany({
      where: { languageId: jaLang.id, glyph: { in: glyphs } },
    });
  });

  test('Check constraint: metadata must be a JSON object', async () => {
    // Non-object JSON fails
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count, metadata)
        VALUES ('${jaLang.id}', '串', 'KANJI', 7, '"string_val"'::jsonb);
      `);
    }, /check constraint.*metadata_object/i);

    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count, metadata)
        VALUES ('${jaLang.id}', '串', 'KANJI', 7, '123'::jsonb);
      `);
    }, /check constraint.*metadata_object/i);

    // Valid object succeeds
    const created = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '串',
        scriptType: 'KANJI',
        strokeCount: 7,
        metadata: { customField: 'value' },
      },
    });
    assert.ok(created.id);

    // Clean up
    await prisma.writingCharacter.delete({ where: { id: created.id } });
  });

  test('Check constraint: glyph must not be empty string', async () => {
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO app.writing_characters (language_id, glyph, script_type, stroke_count)
        VALUES ('${jaLang.id}', '', 'KANJI', 1);
      `);
    }, /check constraint.*glyph_nonempty/i);
  });

  test('Unicode & IVS round-trip in PostgreSQL preserves exact codepoints', async () => {
    // '字' + VS17 (U+E0100)
    const ivsGlyph = '字\u{E0100}';
    const created = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: ivsGlyph,
        scriptType: 'KANJI',
        strokeCount: 6,
      },
    });

    const retrieved = await prisma.writingCharacter.findUnique({
      where: { id: created.id },
    });
    assert.ok(retrieved);
    assert.equal(retrieved.glyph, ivsGlyph);
    const codePoints = Array.from(retrieved.glyph).map((c) => c.codePointAt(0));
    assert.deepEqual(codePoints, [0x5b57, 0xe0100]);

    // Clean up
    await prisma.writingCharacter.delete({ where: { id: created.id } });
  });

  test('EXT-02: createAdminCharacter and listCharacterCatalogue enforce NFC, 409 duplicate, language/script rules, pagination & hasStrokes', async () => {
    // 1. NFD -> NFC normalization via createAdminCharacter
    const nfdRes = await createAdminCharacter(
      {
        languageId: jaLang.id,
        glyph: '\u304B\u3099', // decomposed が
        scriptType: 'HIRAGANA',
        strokeCount: 4,
        primaryReading: 'が',
        romanization: 'ga',
      },
      prisma
    );
    assert.equal(nfdRes.status, 201);
    assert.equal(nfdRes.data?.data.glyph, 'が');
    assert.equal(nfdRes.data?.data.hasStrokes, false);

    // 2. Duplicate in same language -> 409 CHARACTER_DUPLICATE
    const dupRes = await createAdminCharacter(
      {
        languageId: jaLang.id,
        glyph: 'が',
        scriptType: 'HIRAGANA',
        strokeCount: 4,
      },
      prisma
    );
    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.error?.code, 'CHARACTER_DUPLICATE');

    // 3. Language not found or language/script mismatch -> 400
    const missingLangRes = await createAdminCharacter(
      {
        languageId: randomUUID(),
        glyph: '火',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      prisma
    );
    assert.equal(missingLangRes.status, 400);

    const mismatchRes = await createAdminCharacter(
      {
        languageId: zhLang.id,
        glyph: 'あ',
        scriptType: 'HIRAGANA',
        strokeCount: 3,
      },
      prisma
    );
    assert.equal(mismatchRes.status, 400);

    // 4. Create additional character with stroke data and verify listCharacterCatalogue pagination + hasStrokes
    const sunRes = await createAdminCharacter(
      {
        languageId: jaLang.id,
        glyph: '山',
        scriptType: 'KANJI',
        strokeCount: 3,
        meaning: 'núi',
        primaryReading: 'やま',
        romanization: 'yama',
      },
      prisma
    );
    assert.equal(sunRes.status, 201);

    await prisma.characterStrokeData.create({
      data: {
        characterId: sunRes.data.data.id,
        version: 1,
        strokes: [
          { index: 1, points: [[0.5, 0.2], [0.5, 0.8]], start: [0.5, 0.2], end: [0.5, 0.8], path: 'M 0.5 0.2 L 0.5 0.8' },
          { index: 2, points: [[0.2, 0.5], [0.2, 0.8]], start: [0.2, 0.5], end: [0.2, 0.8], path: 'M 0.2 0.5 L 0.2 0.8' },
          { index: 3, points: [[0.8, 0.5], [0.8, 0.8]], start: [0.8, 0.5], end: [0.8, 0.8], path: 'M 0.8 0.5 L 0.8 0.8' },
        ],
        source: 'Lingora Test',
        license: 'CC0-1.0',
        provenance: { author: 'test', version: '1.0.0', attribution: 'test' },
      },
    });

    const page1 = await listCharacterCatalogue(
      { languageId: jaLang.id, limit: 1, offset: 0 },
      prisma
    );
    assert.equal(page1.status, 200);
    assert.equal(page1.data?.total, 2);
    assert.equal(page1.data?.data.length, 1);
    assert.equal(page1.data?.data[0].glyph, '山');
    assert.equal(page1.data?.data[0].hasStrokes, true);
    assert.equal('strokes' in page1.data.data[0], false);

    const page2 = await listCharacterCatalogue(
      { languageId: jaLang.id, limit: 1, offset: 1 },
      prisma
    );
    assert.equal(page2.status, 200);
    assert.equal(page2.data?.data.length, 1);
    assert.equal(page2.data?.data[0].glyph, 'が');
    assert.equal(page2.data?.data[0].hasStrokes, false);

    const searchRes = await listCharacterCatalogue(
      { languageId: jaLang.id, search: 'núi' },
      prisma
    );
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.data?.total, 1);
    assert.equal(searchRes.data?.data[0].glyph, '山');

    // Clean up
    await prisma.characterStrokeData.deleteMany({
      where: { characterId: sunRes.data.data.id },
    });
    await prisma.writingCharacter.deleteMany({
      where: { id: { in: [nfdRes.data.data.id, sunRes.data.data.id] } },
    });
  });
});
