import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/product-client/index.js';
import {
  createCharacter,
  createStroke,
  seedCharacterStrokeData,
  getCharacterStrokeData,
  getCharacterStrokeDataByGlyph,
  getCharacterWithStrokes,
  seedSelfAuthoredFixtures,
  SELF_AUTHORED_FIXTURES,
} from '../../src/server/characters/index.ts';

export function validateTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Run npm run test:integration:strokes to provision a disposable database');
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

describe('S6-02: Real PostgreSQL CharacterStrokeData Constraints, RLS, Scoped Read and Idempotency', () => {
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

  test('RLS is ENABLED and FORCED on app.character_stroke_data', async () => {
    const result = await prisma.$queryRaw`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'app'
        AND pg_class.relname = 'character_stroke_data'
    `;
    assert.equal(result.length, 1);
    assert.equal(result[0].relrowsecurity, true, 'relrowsecurity must be true');
    assert.equal(result[0].relforcerowsecurity, true, 'relforcerowsecurity must be true');
  });

  test('Direct access is REVOKED from anon and authenticated roles', async () => {
    const anonPerms = await prisma.$queryRaw`
      SELECT has_table_privilege('anon', 'app.character_stroke_data', 'SELECT') AS can_select,
             has_table_privilege('anon', 'app.character_stroke_data', 'INSERT') AS can_insert
    `;
    assert.equal(anonPerms[0].can_select, false);
    assert.equal(anonPerms[0].can_insert, false);

    const authPerms = await prisma.$queryRaw`
      SELECT has_table_privilege('authenticated', 'app.character_stroke_data', 'SELECT') AS can_select,
             has_table_privilege('authenticated', 'app.character_stroke_data', 'INSERT') AS can_insert
    `;
    assert.equal(authPerms[0].can_select, false);
    assert.equal(authPerms[0].can_insert, false);
  });

  test('Foreign key constraint: inserting stroke data with non-existent character_id fails with 23503', async () => {
    const nonExistentCharId = randomUUID();
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${nonExistentCharId}::uuid, 1,
            '[]'::jsonb, 'Test Source', 'CC0-1.0', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23503') || err.message.includes('foreign key constraint'));
        return true;
      }
    );
  });

  test('Foreign key constraint: deleting a WritingCharacter with stroke data fails with RESTRICT (23503)', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '木',
        scriptType: 'KANJI',
        meaning: 'tree',
        strokeCount: 4,
      },
      prisma
    );

    const strokes = [
      createStroke(1, [[0.2, 0.4], [0.8, 0.4]]),
      createStroke(2, [[0.5, 0.15], [0.5, 0.85]]),
      createStroke(3, [[0.5, 0.4], [0.2, 0.85]]),
      createStroke(4, [[0.5, 0.4], [0.8, 0.85]]),
    ];

    await seedCharacterStrokeData(
      {
        characterId: char.id,
        version: 1,
        strokes,
        source: 'Lingora Test',
        license: 'CC0-1.0',
      },
      prisma
    );

    // Attempting to delete the character should fail with FK RESTRICT
    await assert.rejects(
      async () => {
        await prisma.writingCharacter.delete({
          where: { id: char.id },
        });
      },
      (err) => {
        assert.ok(
          err.code === 'P2003' ||
          err.message.includes('23503') ||
          err.message.includes('foreign key constraint')
        );
        return true;
      }
    );
  });

  test('Unique constraint: duplicate character_id fails with 23505', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '山',
        scriptType: 'KANJI',
        meaning: 'mountain',
        strokeCount: 3,
      },
      prisma
    );

    const strokes = [
      createStroke(1, [[0.5, 0.2], [0.5, 0.8]]),
      createStroke(2, [[0.25, 0.45], [0.25, 0.8]]),
      createStroke(3, [[0.75, 0.45], [0.75, 0.8]]),
    ];

    await seedCharacterStrokeData(
      {
        characterId: char.id,
        version: 1,
        strokes,
        source: 'Lingora Test',
        license: 'CC0-1.0',
      },
      prisma
    );

    // Direct insertion of duplicate character_id must violate unique constraint
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${char.id}::uuid, 2,
            '[]'::jsonb, 'Another Source', 'CC0-1.0', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(
          err.message.includes('23505') ||
          err.message.includes('character_stroke_data_character_id_key') ||
          err.message.includes('unique constraint')
        );
        return true;
      }
    );
  });

  test('Check constraint: version must be >= 1', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '川',
        scriptType: 'KANJI',
        meaning: 'river',
        strokeCount: 3,
      },
      prisma
    );

    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${char.id}::uuid, 0,
            '[]'::jsonb, 'Source', 'CC0-1.0', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23514') || err.message.includes('character_stroke_data_version_positive_check'));
        return true;
      }
    );
  });

  test('Check constraint: source and license must not be empty or whitespace', async () => {
    const char = await createCharacter(
      {
        languageId: zhLang.id,
        glyph: '水',
        scriptType: 'HANZI_SIMPLIFIED',
        meaning: 'water',
        strokeCount: 4,
      },
      prisma
    );

    // Empty source
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${char.id}::uuid, 1,
            '[]'::jsonb, '   ', 'CC0-1.0', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23514') || err.message.includes('character_stroke_data_source_nonempty_check'));
        return true;
      }
    );

    // Empty license
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${char.id}::uuid, 1,
            '[]'::jsonb, 'Source', '', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23514') || err.message.includes('character_stroke_data_license_nonempty_check'));
        return true;
      }
    );
  });

  test('Check constraint: strokes must be a jsonb array', async () => {
    const char = await createCharacter(
      {
        languageId: zhLang.id,
        glyph: '火',
        scriptType: 'HANZI_SIMPLIFIED',
        meaning: 'fire',
        strokeCount: 4,
      },
      prisma
    );

    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.character_stroke_data (
            id, character_id, version, strokes, source, license, provenance
          ) VALUES (
            gen_random_uuid(), ${char.id}::uuid, 1,
            '{"not": "an_array"}'::jsonb, 'Source', 'CC0-1.0', '{}'::jsonb
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23514') || err.message.includes('character_stroke_data_strokes_array_check'));
        return true;
      }
    );
  });

  test('Idempotent fixture seeding: running twice produces identical state with zero duplicates', async () => {
    const countBefore = await prisma.characterStrokeData.count();

    // 1st run: seeds self-authored fixtures
    const firstRun = await seedSelfAuthoredFixtures(
      { jaLanguageId: jaLang.id, zhLanguageId: zhLang.id },
      prisma
    );
    assert.equal(firstRun.length, SELF_AUTHORED_FIXTURES.length);

    const countAfterFirst = await prisma.characterStrokeData.count();
    assert.equal(countAfterFirst, countBefore + SELF_AUTHORED_FIXTURES.length);

    // 2nd run: idempotent replay
    const secondRun = await seedSelfAuthoredFixtures(
      { jaLanguageId: jaLang.id, zhLanguageId: zhLang.id },
      prisma
    );
    assert.equal(secondRun.length, SELF_AUTHORED_FIXTURES.length);

    // IDs of returned records must match first run exactly
    for (let i = 0; i < firstRun.length; i++) {
      assert.equal(secondRun[i].strokeData.id, firstRun[i].strokeData.id);
      assert.equal(secondRun[i].character.id, firstRun[i].character.id);
    }

    // Total count must be identical (no duplicates created)
    const countAfterSecond = await prisma.characterStrokeData.count();
    assert.equal(countAfterSecond, countAfterFirst);
  });

  test('Conflict detection: seeding differing stroke data on an existing character throws STROKE_DATA_CONFLICT', async () => {
    // Find existing '一' in Japanese from seeded fixtures
    const jaOne = await prisma.writingCharacter.findUnique({
      where: {
        languageId_glyph: {
          languageId: jaLang.id,
          glyph: '一',
        },
      },
    });
    assert.ok(jaOne);

    // Try to seed conflicting stroke data (e.g. different point coordinates)
    const conflictingStrokes = [
      createStroke(1, [
        [0.1, 0.4], // differed from [0.2, 0.5]
        [0.5, 0.4],
        [0.9, 0.4],
      ]),
    ];

    await assert.rejects(
      async () => {
        await seedCharacterStrokeData(
          {
            characterId: jaOne.id,
            version: 1,
            strokes: conflictingStrokes,
            source: 'Conflicting Ingestion',
            license: 'CC0-1.0',
          },
          prisma
        );
      },
      (err) => {
        assert.equal(err.code, 'STROKE_DATA_CONFLICT');
        assert.ok(err.message.includes('conflicting stroke data'));
        return true;
      }
    );
  });

  test('Conflict detection: seeding differing provenance on an existing character throws STROKE_DATA_CONFLICT and preserves data', async () => {
    const jaOne = await prisma.writingCharacter.findUnique({
      where: {
        languageId_glyph: {
          languageId: jaLang.id,
          glyph: '一',
        },
      },
    });
    assert.ok(jaOne);

    const existingStrokeData = await prisma.characterStrokeData.findUnique({
      where: { characterId: jaOne.id },
    });
    assert.ok(existingStrokeData);

    // 1. Differing attribution
    await assert.rejects(
      async () => {
        await seedCharacterStrokeData(
          {
            characterId: jaOne.id,
            version: existingStrokeData.version,
            strokes: existingStrokeData.strokes,
            source: existingStrokeData.source,
            license: existingStrokeData.license,
            provenance: {
              ...existingStrokeData.provenance,
              attribution: 'Conflicting attribution string',
            },
          },
          prisma
        );
      },
      (err) => {
        assert.equal(err.code, 'STROKE_DATA_CONFLICT');
        assert.ok(err.message.includes('conflicting stroke data'));
        return true;
      }
    );

    // 2. Differing author
    await assert.rejects(
      async () => {
        await seedCharacterStrokeData(
          {
            characterId: jaOne.id,
            version: existingStrokeData.version,
            strokes: existingStrokeData.strokes,
            source: existingStrokeData.source,
            license: existingStrokeData.license,
            provenance: {
              ...existingStrokeData.provenance,
              author: 'Different Author',
            },
          },
          prisma
        );
      },
      (err) => {
        assert.equal(err.code, 'STROKE_DATA_CONFLICT');
        assert.ok(err.message.includes('conflicting stroke data'));
        return true;
      }
    );

    // 3. Verify existing data was preserved intact in database
    const strokeDataAfter = await prisma.characterStrokeData.findUnique({
      where: { characterId: jaOne.id },
    });
    assert.deepEqual(strokeDataAfter.provenance, existingStrokeData.provenance);
    assert.deepEqual(strokeDataAfter.strokes, existingStrokeData.strokes);
    assert.equal(strokeDataAfter.source, existingStrokeData.source);
    assert.equal(strokeDataAfter.license, existingStrokeData.license);
  });

  test('Language-scoped read: lookup strictly enforces character language boundary', async () => {
    // Retrieve Japanese '一' and Chinese '一'
    const jaOne = await prisma.writingCharacter.findUnique({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '一' } },
    });
    const zhOne = await prisma.writingCharacter.findUnique({
      where: { languageId_glyph: { languageId: zhLang.id, glyph: '一' } },
    });

    assert.ok(jaOne);
    assert.ok(zhOne);
    assert.notEqual(jaOne.id, zhOne.id, 'Japanese and Chinese "一" must have distinct IDs');

    // 1. Reading Japanese '一' with Japanese languageId -> succeeds
    const jaStroke = await getCharacterStrokeData(jaLang.id, jaOne.id, prisma);
    assert.ok(jaStroke);
    assert.equal(jaStroke.characterId, jaOne.id);

    // 2. Reading Japanese '一' with Chinese languageId -> returns null (scoped isolation)
    const crossScopeJaInZh = await getCharacterStrokeData(zhLang.id, jaOne.id, prisma);
    assert.equal(crossScopeJaInZh, null, 'Cross-language lookup must return null');

    // 3. Reading Chinese '一' with Chinese languageId -> succeeds
    const zhStroke = await getCharacterStrokeData(zhLang.id, zhOne.id, prisma);
    assert.ok(zhStroke);
    assert.equal(zhStroke.characterId, zhOne.id);

    // 4. Reading Chinese '一' with Japanese languageId -> returns null
    const crossScopeZhInJa = await getCharacterStrokeData(jaLang.id, zhOne.id, prisma);
    assert.equal(crossScopeZhInJa, null, 'Cross-language lookup must return null');

    // 5. getCharacterStrokeDataByGlyph scopes strictly by languageId
    const jaGlyphStroke = await getCharacterStrokeDataByGlyph(jaLang.id, '一', prisma);
    assert.ok(jaGlyphStroke);
    assert.equal(jaGlyphStroke.characterId, jaOne.id);

    const zhGlyphStroke = await getCharacterStrokeDataByGlyph(zhLang.id, '一', prisma);
    assert.ok(zhGlyphStroke);
    assert.equal(zhGlyphStroke.characterId, zhOne.id);

    // 6. getCharacterWithStrokes includes relation scoped to language
    const jaWithStrokes = await getCharacterWithStrokes(jaLang.id, jaOne.id, prisma);
    assert.ok(jaWithStrokes);
    assert.ok(jaWithStrokes.strokeData);
    assert.equal(jaWithStrokes.strokeData.characterId, jaOne.id);

    const crossScopeWithStrokes = await getCharacterWithStrokes(zhLang.id, jaOne.id, prisma);
    assert.equal(crossScopeWithStrokes, null);
  });
});
