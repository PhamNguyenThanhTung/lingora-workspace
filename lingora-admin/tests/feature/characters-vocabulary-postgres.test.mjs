import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/product-client/index.js';
import {
  createCharacter,
  mapVocabularyCharacters,
  getVocabularyCharacters,
  getVocabularyCharactersScoped,
} from '../../src/server/characters/index.ts';

export function validateTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Run npm run test:integration:vocabulary-characters to provision a disposable database');
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

describe('S6-03: Real PostgreSQL VocabularyCharacter Constraints, RLS, Mapping and Idempotency', () => {
  let prisma;
  let jaLang;
  let zhLang;
  let enLang;
  let authorAccount;

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
    enLang = await prisma.language.upsert({
      where: { code: 'en' },
      update: {},
      create: {
        code: 'en',
        names: { en: 'English', vi: 'Tiếng Anh' },
        isLearnable: false,
        isUiLocale: true,
      },
    });

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

    // Create an author account for createdBy on vocabulary concepts
    const authorId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${authorId}::uuid, 's6-03-author@lingora.test')
      ON CONFLICT DO NOTHING
    `;

    authorAccount = await prisma.account.create({
      data: {
        id: authorId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'S6-03 Test Author',
        uiLocale: enLang.code,
      },
    });
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  test('RLS is ENABLED and FORCED on app.vocabulary_characters', async () => {
    const result = await prisma.$queryRaw`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'app'
        AND pg_class.relname = 'vocabulary_characters'
    `;
    assert.equal(result.length, 1);
    assert.equal(result[0].relrowsecurity, true, 'relrowsecurity must be true');
    assert.equal(result[0].relforcerowsecurity, true, 'relforcerowsecurity must be true');
  });

  test('Direct access is REVOKED from anon and authenticated roles', async () => {
    const anonPerms = await prisma.$queryRaw`
      SELECT has_table_privilege('anon', 'app.vocabulary_characters', 'SELECT') AS can_select,
             has_table_privilege('anon', 'app.vocabulary_characters', 'INSERT') AS can_insert
    `;
    assert.equal(anonPerms[0].can_select, false);
    assert.equal(anonPerms[0].can_insert, false);

    const authPerms = await prisma.$queryRaw`
      SELECT has_table_privilege('authenticated', 'app.vocabulary_characters', 'SELECT') AS can_select,
             has_table_privilege('authenticated', 'app.vocabulary_characters', 'INSERT') AS can_insert
    `;
    assert.equal(authPerms[0].can_select, false);
    assert.equal(authPerms[0].can_insert, false);
  });

  test('Foreign key constraint: inserting link with non-existent vocabulary_id fails with 23503', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '木',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      prisma
    );

    const nonExistentVocabId = randomUUID();
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.vocabulary_characters (
            id, vocabulary_id, character_id, position
          ) VALUES (
            gen_random_uuid(), ${nonExistentVocabId}::uuid, ${char.id}::uuid, 1
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23503') || err.message.includes('foreign key constraint'));
        return true;
      }
    );
  });

  test('Foreign key constraint: inserting link with non-existent character_id fails with 23503', async () => {
    const vocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '木',
        normalizedForm: '木',
        senseKey: 'tree-noun-1',
        meaningLabels: { en: 'tree' },
        createdBy: authorAccount.id,
      },
    });

    const nonExistentCharId = randomUUID();
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.vocabulary_characters (
            id, vocabulary_id, character_id, position
          ) VALUES (
            gen_random_uuid(), ${vocab.id}::uuid, ${nonExistentCharId}::uuid, 1
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23503') || err.message.includes('foreign key constraint'));
        return true;
      }
    );
  });

  test('Foreign key constraint: deleting WritingCharacter with linked vocabulary fails with RESTRICT (23503)', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '火',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      prisma
    );

    const vocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '火',
        normalizedForm: '火',
        senseKey: 'fire-noun-1',
        meaningLabels: { en: 'fire' },
        createdBy: authorAccount.id,
      },
    });

    await prisma.vocabularyCharacter.create({
      data: {
        vocabularyId: vocab.id,
        characterId: char.id,
        position: 1,
      },
    });

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
          err.message.toLowerCase().includes('foreign key')
        );
        return true;
      }
    );
  });

  test('Foreign key constraint: deleting VocabularyConcept with linked characters fails with RESTRICT (23503)', async () => {
    const char = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '水',
        scriptType: 'KANJI',
        strokeCount: 4,
      },
      prisma
    );

    const vocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '水',
        normalizedForm: '水',
        senseKey: 'water-noun-1',
        meaningLabels: { en: 'water' },
        createdBy: authorAccount.id,
      },
    });

    await prisma.vocabularyCharacter.create({
      data: {
        vocabularyId: vocab.id,
        characterId: char.id,
        position: 1,
      },
    });

    await assert.rejects(
      async () => {
        await prisma.vocabularyConcept.delete({
          where: { id: vocab.id },
        });
      },
      (err) => {
        assert.ok(
          err.code === 'P2003' ||
          err.message.includes('23503') ||
          err.message.toLowerCase().includes('foreign key')
        );
        return true;
      }
    );
  });

  test('Table constraints: unique (vocabulary_id, position) and position >= 1', async () => {
    const char1 = await createCharacter(
      { languageId: jaLang.id, glyph: '金', scriptType: 'KANJI', strokeCount: 8 },
      prisma
    );
    const char2 = await createCharacter(
      { languageId: jaLang.id, glyph: '土', scriptType: 'KANJI', strokeCount: 3 },
      prisma
    );

    const vocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '金土',
        normalizedForm: '金土',
        senseKey: 'metal-earth-1',
        meaningLabels: { en: 'gold and earth' },
        createdBy: authorAccount.id,
      },
    });

    await prisma.vocabularyCharacter.create({
      data: {
        vocabularyId: vocab.id,
        characterId: char1.id,
        position: 1,
      },
    });

    // 1. Duplicate position for same vocabulary fails with 23505
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.vocabulary_characters (
            id, vocabulary_id, character_id, position
          ) VALUES (
            gen_random_uuid(), ${vocab.id}::uuid, ${char2.id}::uuid, 1
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('23505') || err.message.includes('unique constraint'));
        return true;
      }
    );

    // 2. Position < 1 fails check constraint
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.vocabulary_characters (
            id, vocabulary_id, character_id, position
          ) VALUES (
            gen_random_uuid(), ${vocab.id}::uuid, ${char2.id}::uuid, 0
          )
        `;
      },
      (err) => {
        assert.ok(err.message.includes('check constraint') || err.message.includes('23514'));
        return true;
      }
    );
  });

  test('Exact 日本語 order: creates and returns mappings in exact 1: 日, 2: 本, 3: 語 order', async () => {
    const charNichi = await createCharacter(
      { languageId: jaLang.id, glyph: '日', scriptType: 'KANJI', strokeCount: 4 },
      prisma
    );
    const charHon = await createCharacter(
      { languageId: jaLang.id, glyph: '本', scriptType: 'KANJI', strokeCount: 5 },
      prisma
    );
    const charGo = await createCharacter(
      { languageId: jaLang.id, glyph: '語', scriptType: 'KANJI', strokeCount: 14 },
      prisma
    );

    const nihongoVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '日本語',
        normalizedForm: '日本語',
        senseKey: 'japanese-language-1',
        meaningLabels: { en: 'Japanese language', vi: 'Tiếng Nhật' },
        createdBy: authorAccount.id,
      },
    });

    const mapped = await mapVocabularyCharacters(nihongoVocab.id, prisma);
    assert.equal(mapped.length, 3);
    assert.equal(mapped[0].position, 1);
    assert.equal(mapped[0].characterId, charNichi.id);
    assert.equal(mapped[0].character.glyph, '日');

    assert.equal(mapped[1].position, 2);
    assert.equal(mapped[1].characterId, charHon.id);
    assert.equal(mapped[1].character.glyph, '本');

    assert.equal(mapped[2].position, 3);
    assert.equal(mapped[2].characterId, charGo.id);
    assert.equal(mapped[2].character.glyph, '語');

    // Verify lookup helper returns the exact order
    const retrieved = await getVocabularyCharacters(nihongoVocab.id, prisma);
    assert.equal(retrieved.length, 3);
    assert.deepEqual(
      retrieved.map((r) => ({ position: r.position, glyph: r.character.glyph })),
      [
        { position: 1, glyph: '日' },
        { position: 2, glyph: '本' },
        { position: 3, glyph: '語' },
      ]
    );
  });

  test('Repeated glyph: creates distinct mappings at positions 1 and 2 for same characterId', async () => {
    const charRen = await createCharacter(
      { languageId: zhLang.id, glyph: '人', scriptType: 'HANZI_SIMPLIFIED', strokeCount: 2 },
      prisma
    );

    const renrenVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: zhLang.id,
        canonicalForm: '人人',
        normalizedForm: '人人',
        senseKey: 'everyone-noun-1',
        meaningLabels: { en: 'everyone / people' },
        createdBy: authorAccount.id,
      },
    });

    const mapped = await mapVocabularyCharacters(renrenVocab.id, prisma);
    assert.equal(mapped.length, 2);
    assert.equal(mapped[0].position, 1);
    assert.equal(mapped[0].characterId, charRen.id);
    assert.equal(mapped[1].position, 2);
    assert.equal(mapped[1].characterId, charRen.id);

    // Both positions refer to the same WritingCharacter
    assert.equal(mapped[0].characterId, mapped[1].characterId);
  });

  test('Missing character gap: omits uncatalogued glyph while preserving original 1-based positions', async () => {
    // Catalogue has '日' and '語', but does NOT have 'a'
    const charNichi = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '日' } },
    });
    const charGo = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '語' } },
    });

    const gapVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '日a語',
        normalizedForm: '日a語',
        senseKey: 'gap-test-1',
        meaningLabels: { en: 'gap test' },
        createdBy: authorAccount.id,
      },
    });

    const mapped = await mapVocabularyCharacters(gapVocab.id, prisma);
    assert.equal(mapped.length, 2);
    assert.equal(mapped[0].position, 1);
    assert.equal(mapped[0].characterId, charNichi.id);

    assert.equal(mapped[1].position, 3);
    assert.equal(mapped[1].characterId, charGo.id);

    // Check DB rows directly to verify position 2 is indeed not stored
    const dbRows = await prisma.vocabularyCharacter.findMany({
      where: { vocabularyId: gapVocab.id },
      orderBy: { position: 'asc' },
    });
    assert.equal(dbRows.length, 2);
    assert.deepEqual(dbRows.map((r) => r.position), [1, 3]);
  });

  test('Cross-language same glyph: maps strictly to the character of the vocabulary language', async () => {
    // Create Japanese '一' and Chinese '一'
    const jaOne = await createCharacter(
      { languageId: jaLang.id, glyph: '一', scriptType: 'KANJI', strokeCount: 1 },
      prisma
    );
    const zhOne = await createCharacter(
      { languageId: zhLang.id, glyph: '一', scriptType: 'HANZI_SIMPLIFIED', strokeCount: 1 },
      prisma
    );

    assert.notEqual(jaOne.id, zhOne.id, 'Japanese and Chinese "一" must have distinct IDs');

    // Create Japanese vocabulary "一"
    const jaVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '一',
        normalizedForm: '一',
        senseKey: 'one-ja-1',
        meaningLabels: { en: 'one (Japanese)' },
        createdBy: authorAccount.id,
      },
    });

    // Create Chinese vocabulary "一"
    const zhVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: zhLang.id,
        canonicalForm: '一',
        normalizedForm: '一',
        senseKey: 'one-zh-1',
        meaningLabels: { en: 'one (Chinese)' },
        createdBy: authorAccount.id,
      },
    });

    // Map Japanese vocabulary -> must link to jaOne
    const jaMapped = await mapVocabularyCharacters(jaVocab.id, prisma);
    assert.equal(jaMapped.length, 1);
    assert.equal(jaMapped[0].characterId, jaOne.id);
    assert.notEqual(jaMapped[0].characterId, zhOne.id);

    // Map Chinese vocabulary -> must link to zhOne
    const zhMapped = await mapVocabularyCharacters(zhVocab.id, prisma);
    assert.equal(zhMapped.length, 1);
    assert.equal(zhMapped[0].characterId, zhOne.id);
    assert.notEqual(zhMapped[0].characterId, jaOne.id);

    // Scoped lookup strictly isolates by languageId
    const scopedJaInJa = await getVocabularyCharactersScoped(jaLang.id, jaVocab.id, prisma);
    assert.ok(scopedJaInJa);
    assert.equal(scopedJaInJa[0].characterId, jaOne.id);

    const scopedJaInZh = await getVocabularyCharactersScoped(zhLang.id, jaVocab.id, prisma);
    assert.equal(scopedJaInZh, null, 'Looking up Japanese vocab with Chinese languageId must return null');

    const scopedZhInZh = await getVocabularyCharactersScoped(zhLang.id, zhVocab.id, prisma);
    assert.ok(scopedZhInZh);
    assert.equal(scopedZhInZh[0].characterId, zhOne.id);

    const scopedZhInJa = await getVocabularyCharactersScoped(jaLang.id, zhVocab.id, prisma);
    assert.equal(scopedZhInJa, null, 'Looking up Chinese vocab with Japanese languageId must return null');
  });

  test('Idempotent replay: running mapVocabularyCharacters on identical data returns existing records', async () => {
    const jaOne = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '一' } },
    });
    const jaVocab = await prisma.vocabularyConcept.findFirstOrThrow({
      where: { languageId: jaLang.id, senseKey: 'one-ja-1' },
    });

    // Replay mapping for jaVocab
    const replayed = await mapVocabularyCharacters(jaVocab.id, prisma);
    assert.equal(replayed.length, 1);
    assert.equal(replayed[0].characterId, jaOne.id);
    assert.equal(replayed[0].position, 1);

    // Verify row count did not duplicate
    const count = await prisma.vocabularyCharacter.count({
      where: { vocabularyId: jaVocab.id },
    });
    assert.equal(count, 1);
  });

  test('Divergent existing mapping: throws VOCABULARY_CHARACTER_CONFLICT and preserves data intact', async () => {
    // Create a vocabulary and initial character
    const charA = await createCharacter(
      { languageId: jaLang.id, glyph: '山', scriptType: 'KANJI', strokeCount: 3 },
      prisma
    );
    const charB = await createCharacter(
      { languageId: jaLang.id, glyph: '川', scriptType: 'KANJI', strokeCount: 3 },
      prisma
    );

    const vocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '山川',
        normalizedForm: '山川',
        senseKey: 'mountain-river-1',
        meaningLabels: { en: 'mountain and river' },
        createdBy: authorAccount.id,
      },
    });

    // Pre-insert a divergent mapping manually (e.g. only mapped position 1, or mapped position 1 to charB)
    const divergentRow = await prisma.vocabularyCharacter.create({
      data: {
        vocabularyId: vocab.id,
        characterId: charB.id, // Should have been charA ('山'), but divergent
        position: 1,
      },
    });

    // Now attempt to run mapVocabularyCharacters -> should detect conflict
    await assert.rejects(
      async () => {
        await mapVocabularyCharacters(vocab.id, prisma);
      },
      (err) => {
        assert.equal(err.code, 'VOCABULARY_CHARACTER_CONFLICT');
        assert.ok(err.message.includes('conflict'));
        return true;
      }
    );

    // Verify existing database row was preserved completely untouched
    const afterRows = await prisma.vocabularyCharacter.findMany({
      where: { vocabularyId: vocab.id },
    });
    assert.equal(afterRows.length, 1);
    assert.equal(afterRows[0].id, divergentRow.id);
    assert.equal(afterRows[0].characterId, charB.id);
    assert.equal(afterRows[0].position, 1);
  });

  test('Default source of truth: ignores caller-supplied glyphs or language in favor of DB rows', async () => {
    const charHon = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '本' } },
    });

    const bookVocab = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '本',
        normalizedForm: '本',
        senseKey: 'book-noun-1',
        meaningLabels: { en: 'book' },
        createdBy: authorAccount.id,
      },
    });

    // Caller supplies conflicting/bogus languageId and glyphs in options object
    const callerSuppliedInput = {
      vocabularyId: bookVocab.id,
      languageId: zhLang.id, // Conflicting languageId
      glyphs: ['FakeGlyph1', 'FakeGlyph2'], // Conflicting glyphs
    };

    const mapped = await mapVocabularyCharacters(callerSuppliedInput, prisma);
    assert.equal(mapped.length, 1);
    // Verifies it mapped according to DB row (Japanese '本'), NOT caller's Chinese or fake glyphs
    assert.equal(mapped[0].characterId, charHon.id);
    assert.equal(mapped[0].position, 1);
    assert.equal(mapped[0].character.glyph, '本');
  });

  test('Concurrency: two independent concurrent mapVocabularyCharacters calls return identical stored rows without duplicates or P2002 across 3 fresh vocabularies', async () => {
    const charNichi = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '日' } },
    });
    const charHon = await prisma.writingCharacter.findUniqueOrThrow({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: '本' } },
    });

    for (let i = 1; i <= 3; i++) {
      const vocab = await prisma.vocabularyConcept.create({
        data: {
          languageId: jaLang.id,
          canonicalForm: '日本',
          normalizedForm: '日本',
          senseKey: `concurrent-fresh-vocab-${i}-${Date.now()}-${randomUUID()}`,
          meaningLabels: { en: `concurrent test ${i}` },
          createdBy: authorAccount.id,
        },
      });

      // Fire two independent concurrent requests simultaneously
      const [resA, resB] = await Promise.all([
        mapVocabularyCharacters(vocab.id, prisma),
        mapVocabularyCharacters(vocab.id, prisma),
      ]);

      assert.ok(resA);
      assert.ok(resB);
      assert.equal(resA.length, 2);
      assert.equal(resB.length, 2);

      // Both concurrent requests return identical stored rows
      assert.deepEqual(
        resA.map((r) => ({ id: r.id, characterId: r.characterId, position: r.position })),
        resB.map((r) => ({ id: r.id, characterId: r.characterId, position: r.position }))
      );

      // Verify database stored exactly 2 rows (no duplicate positions or P2002 errors)
      const stored = await prisma.vocabularyCharacter.findMany({
        where: { vocabularyId: vocab.id },
        orderBy: { position: 'asc' },
      });
      assert.equal(stored.length, 2);
      assert.equal(stored[0].position, 1);
      assert.equal(stored[0].characterId, charNichi.id);
      assert.equal(stored[1].position, 2);
      assert.equal(stored[1].characterId, charHon.id);
    }
  });

  test('Scoped read constraints: filters both vocabulary and character language, and does not expose stroke data', async () => {
    const jaVocab = await prisma.vocabularyConcept.findFirstOrThrow({
      where: { languageId: jaLang.id, senseKey: 'one-ja-1' },
    });

    const res = await getVocabularyCharactersScoped(jaLang.id, jaVocab.id, prisma);
    assert.ok(res);
    assert.equal(res.length, 1);
    assert.ok(res[0].character);
    // Stroke data must not be exposed at this checkpoint
    assert.equal(res[0].character.strokeData, undefined);

    const normalRes = await getVocabularyCharacters(jaVocab.id, prisma);
    assert.ok(normalRes);
    assert.equal(normalRes[0].character.strokeData, undefined);
  });
});
