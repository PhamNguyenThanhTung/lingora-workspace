import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createStroke } from '../../../../lingora-admin/src/server/characters/validator.ts';
import { createCharacter } from '../../../../lingora-admin/src/server/characters/catalogue.ts';
import { seedCharacterStrokeData } from '../../../../lingora-admin/src/server/characters/strokes.ts';
import { mapVocabularyCharacters } from '../../../../lingora-admin/src/server/characters/vocabulary.ts';
import {
  saveTeacherLessonDraft,
  submitTeacherLesson,
  approveReview,
  publishReview,
} from '../../../../lingora-admin/src/server/lessons/index.ts';

const PROVENANCE = {
  author: 'Lingora Japanese Pedagogy & Calligraphy Team',
  version: '1.0.0',
  attribution: 'Self-authored normalized geometric coordinates for Lingora Japanese engine',
  licenseObligations: 'CC0-1.0 Universal Public Domain Dedication',
  createdAt: '2026-11-17T00:00:00.000Z',
  notes: 'Hand-crafted normalized [0,1] coordinates with SVG M/L geometric pathing',
};

const SOURCE = 'Lingora Japanese Script Engine Synthetic Fixtures';
const LICENSE = 'CC0-1.0 Universal';

/**
 * Creates and publishes the complete Japanese synthetic learning path fixture:
 * Representative stages strictly ordered:
 * Stage 1. Hiragana (Character: い, stroke animated, guided writing)
 * Stage 2. Katakana (Character: ア, stroke animated, guided writing)
 * Stage 3. Basic vocabulary (Word: いいえ, without kanji)
 * Stage 4. Kanji components (Character: 木, radical / component)
 * Stage 5. Kanji (Character: 日, full kanji)
 * Stage 6. Words containing Kanji (Word: 日本語, mapped to 日, 本, 語)
 * Stage 7. Incomplete curriculum (Lesson 7, availability: 'PLANNED')
 */
export async function createJapaneseCurriculumFixture(db, options = {}) {
  const fixtureKey = options.fixtureKey || randomUUID().replaceAll('-', '').slice(0, 12);
  assert.match(fixtureKey, /^[0-9a-f]{12}$/);
  const adminId = options.adminId || randomUUID();
  const teacherId = options.teacherId || randomUUID();
  const learnerId = options.learnerId || randomUUID();

  // 1. Ensure UI languages (en and vi) exist for Account FK constraints
  await db.language.upsert({
    where: { code: 'en' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'en',
      names: { en: 'English', vi: 'Tiếng Anh' },
      isLearnable: true,
      isUiLocale: true,
    },
    update: {},
  });
  await db.language.upsert({
    where: { code: 'vi' },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'vi',
      names: { en: 'Vietnamese', vi: 'Tiếng Việt' },
      isLearnable: false,
      isUiLocale: true,
    },
    update: {},
  });

  // 2. Ensure Auth and Account records
  for (const uid of [adminId, teacherId, learnerId]) {
    await db.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${uid}::uuid, ${uid + '@lingora.test'})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  await db.account.upsert({
    where: { id: adminId },
    create: { id: adminId, role: 'ADMIN', status: 'ACTIVE', uiLocale: 'vi', timezone: 'Asia/Tokyo', displayName: 'Japanese Admin' },
    update: { status: 'ACTIVE' },
  });
  await db.account.upsert({
    where: { id: teacherId },
    create: { id: teacherId, role: 'TEACHER', status: 'ACTIVE', uiLocale: 'vi', timezone: 'Asia/Tokyo', displayName: 'Japanese Teacher' },
    update: { status: 'ACTIVE' },
  });
  await db.account.upsert({
    where: { id: learnerId },
    create: { id: learnerId, role: 'LEARNER', status: 'ACTIVE', uiLocale: 'vi', timezone: 'Asia/Tokyo', displayName: 'Japanese Learner' },
    update: { status: 'ACTIVE' },
  });

  // Isolate fixture catalogue rows from any production-shaped Japanese data.
  const languageCode = `ja-x-lingora-${fixtureKey}`;
  let jaLang = await db.language.findUnique({ where: { code: languageCode } });
  if (!jaLang) {
    jaLang = await db.language.create({
      data: {
        id: randomUUID(),
        code: languageCode,
        names: { vi: 'Tiếng Nhật kiểm thử', en: 'Synthetic Japanese', ja: '日本語' },
        isLearnable: true,
        isUiLocale: false,
      },
    });
  }

  // 3. Framework & Level
  const frameworkCode = `JLPT-S6-${fixtureKey}`;
  let framework = await db.framework.findUnique({
    where: { code_version: { code: frameworkCode, version: '2020' } },
  });
  if (!framework) {
    framework = await db.framework.create({
      data: {
        id: randomUUID(),
        code: frameworkCode,
        version: '2020',
        names: { vi: 'Khung Nhật kiểm thử', en: 'Synthetic Japanese Framework' },
      },
    });
  }

  let levelN5 = await db.level.findFirst({
    where: { frameworkId: framework.id, code: 'N5' },
  });
  if (!levelN5) {
    levelN5 = await db.level.create({
      data: {
        id: randomUUID(),
        frameworkId: framework.id,
        code: 'N5',
        position: 1,
        label: { vi: 'N5 Mới bắt đầu', en: 'N5 Beginner', ja: 'N5 入門' },
      },
    });
  }

  // 4. Course
  let course = await db.course.findFirst({
    where: { languageId: jaLang.id, frameworkId: framework.id, isActive: true },
  });
  if (!course) {
    course = await db.course.create({
      data: {
        id: randomUUID(),
        languageId: jaLang.id,
        frameworkId: framework.id,
        names: { vi: 'Tiếng Nhật Sơ cấp', en: 'Beginner Japanese', ja: '初級日本語' },
        isActive: true,
        defaultStartLevelId: levelN5.id,
      },
    });
  }

  // 5. Unit 1
  let unit = await db.unit.findFirst({
    where: { courseId: course.id, levelId: levelN5.id, position: 1 },
  });
  if (!unit) {
    unit = await db.unit.create({
      data: {
        id: randomUUID(),
        courseId: course.id,
        levelId: levelN5.id,
        code: 'JA-U1',
        names: { vi: 'Chương 1: Khởi đầu Tiếng Nhật', en: 'Unit 1: Japanese Foundations', ja: '第1課：日本語の基礎' },
        position: 1,
      },
    });
  }

  // 6. Seed Catalogue Characters and Strokes
  async function ensureCharacter(params, strokes) {
    let char = await db.writingCharacter.findUnique({
      where: { languageId_glyph: { languageId: jaLang.id, glyph: params.glyph } },
    });
    if (!char) {
      char = await createCharacter(
        {
          languageId: jaLang.id,
          glyph: params.glyph,
          scriptType: params.scriptType,
          meaning: params.meaning ?? null,
          primaryReading: params.primaryReading ?? null,
          romanization: params.romanization ?? null,
          strokeCount: params.strokeCount,
          metadata: params.metadata || {},
        },
        db
      );
    }
    if (strokes && strokes.length > 0) {
      await seedCharacterStrokeData(
        {
          characterId: char.id,
          version: 1,
          strokes,
          source: SOURCE,
          license: LICENSE,
          provenance: PROVENANCE,
        },
        db
      );
    }
    return char;
  }

  // Stage 1: Hiragana い (2 strokes)
  const charHiraganaI = await ensureCharacter(
    {
      glyph: 'い',
      scriptType: 'HIRAGANA',
      meaning: null,
      primaryReading: 'い',
      romanization: 'i',
      strokeCount: 2,
    },
    [
      createStroke(1, [[0.3, 0.25], [0.28, 0.5], [0.35, 0.75]]),
      createStroke(2, [[0.7, 0.35], [0.72, 0.55]]),
    ]
  );

  // Stage 2: Katakana ア (2 strokes)
  const charKatakanaA = await ensureCharacter(
    {
      glyph: 'ア',
      scriptType: 'KATAKANA',
      meaning: null,
      primaryReading: 'ア',
      romanization: 'a',
      strokeCount: 2,
    },
    [
      createStroke(1, [[0.2, 0.3], [0.7, 0.3], [0.6, 0.5]]),
      createStroke(2, [[0.45, 0.4], [0.35, 0.8]]),
    ]
  );

  // Stage 4: Kanji component 木 (Radical / component, 4 strokes)
  const charKanjiCompTree = await ensureCharacter(
    {
      glyph: '木',
      scriptType: 'KANJI',
      meaning: 'cây, mộc',
      primaryReading: 'もく',
      romanization: 'moku',
      strokeCount: 4,
      metadata: { radical: '木' },
    },
    [
      createStroke(1, [[0.2, 0.4], [0.8, 0.4]]),
      createStroke(2, [[0.5, 0.15], [0.5, 0.85]]),
      createStroke(3, [[0.5, 0.4], [0.2, 0.85]]),
      createStroke(4, [[0.5, 0.4], [0.8, 0.85]]),
    ]
  );

  // Stage 5: Kanji 日 (4 strokes)
  const charKanjiSun = await ensureCharacter(
    {
      glyph: '日',
      scriptType: 'KANJI',
      meaning: 'mặt trời, ngày',
      primaryReading: 'にち',
      romanization: 'nichi',
      strokeCount: 4,
      metadata: { radical: '日', jlptLevel: 'N5' },
    },
    [
      createStroke(1, [[0.2, 0.1], [0.2, 0.9]]),
      createStroke(2, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9]]),
      createStroke(3, [[0.2, 0.5], [0.8, 0.5]]),
      createStroke(4, [[0.2, 0.9], [0.8, 0.9]]),
    ]
  );

  // Characters for Stage 6: 本 (5 strokes) and 語 (14 strokes)
  const charKanjiBook = await ensureCharacter(
    {
      glyph: '本',
      scriptType: 'KANJI',
      meaning: 'sách, gốc',
      primaryReading: 'ほん',
      romanization: 'hon',
      strokeCount: 5,
      metadata: { jlptLevel: 'N5' },
    },
    [
      createStroke(1, [[0.2, 0.4], [0.8, 0.4]]),
      createStroke(2, [[0.5, 0.15], [0.5, 0.85]]),
      createStroke(3, [[0.5, 0.4], [0.2, 0.85]]),
      createStroke(4, [[0.5, 0.4], [0.8, 0.85]]),
      createStroke(5, [[0.35, 0.7], [0.65, 0.7]]),
    ]
  );

  const charKanjiWord = await ensureCharacter(
    {
      glyph: '語',
      scriptType: 'KANJI',
      meaning: 'ngôn ngữ, từ',
      primaryReading: 'ご',
      romanization: 'go',
      strokeCount: 14,
      metadata: { jlptLevel: 'N5' },
    },
    null
  );

  // 7. Seed Vocabulary
  // Stage 3: Basic vocabulary without kanji (いいえ)
  let vocabBasic = await db.vocabularyConcept.findFirst({
    where: { languageId: jaLang.id, canonicalForm: 'いいえ' },
  });
  if (!vocabBasic) {
    vocabBasic = await db.vocabularyConcept.create({
      data: {
        id: randomUUID(),
        languageId: jaLang.id,
        canonicalForm: 'いいえ',
        normalizedForm: 'いいえ',
        senseKey: 'no-general',
        meaningLabels: { vi: 'Không', en: 'No', ja: 'いいえ' },
        createdBy: teacherId,
      },
    });
  }

  // Stage 6: Words containing kanji (日本語)
  let vocabKanji = await db.vocabularyConcept.findFirst({
    where: { languageId: jaLang.id, canonicalForm: '日本語' },
  });
  if (!vocabKanji) {
    vocabKanji = await db.vocabularyConcept.create({
      data: {
        id: randomUUID(),
        languageId: jaLang.id,
        canonicalForm: '日本語',
        normalizedForm: '日本語',
        senseKey: 'japanese-language',
        meaningLabels: { vi: 'Tiếng Nhật', en: 'Japanese language', ja: '日本語' },
        createdBy: teacherId,
      },
    });
  }

  // Map vocabulary 日本語 -> 日 (1), 本 (2), 語 (3)
  await mapVocabularyCharacters(vocabKanji.id, db);

  // 8. Publish Lessons (Stages 1 through 6) & Create Stage 7 (Planned)
  const lessonDefinitions = [
    {
      stage: 'HIRAGANA',
      position: 1,
      title: { vi: 'Bài 1: Chữ Hiragana (い)', en: 'Lesson 1: Hiragana (i)' },
      blocks: [
        {
          blockKey: 'h1_hiragana',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Chữ Hiragana cơ bản: い' },
        },
        {
          blockKey: 'char_hiragana_i',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charHiraganaI.id,
            showMeaning: false,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Chọn âm đọc Romaji của chữ "い":',
            options: [
              { id: 'opt_i', text: 'i' },
              { id: 'opt_a', text: 'a' },
            ],
          },
          gradingData: { correctOptionId: 'opt_i' },
          feedbackData: { explanation: 'Chữ い phát âm là /i/.' },
        },
      ],
    },
    {
      stage: 'KATAKANA',
      position: 2,
      title: { vi: 'Bài 2: Chữ Katakana (ア)', en: 'Lesson 2: Katakana (a)' },
      blocks: [
        {
          blockKey: 'h1_katakana',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Chữ Katakana cơ bản: ア' },
        },
        {
          blockKey: 'char_katakana_a',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charKatakanaA.id,
            showMeaning: false,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Chọn chữ Katakana tương ứng với âm đọc "a":',
            options: [
              { id: 'opt_a', text: 'ア' },
              { id: 'opt_i', text: 'イ' },
            ],
          },
          gradingData: { correctOptionId: 'opt_a' },
          feedbackData: { explanation: 'Chữ ア là chữ Katakana của âm /a/.' },
        },
      ],
    },
    {
      stage: 'BASIC_VOCABULARY',
      position: 3,
      title: { vi: 'Bài 3: Từ vựng cơ bản (いいえ)', en: 'Lesson 3: Basic Vocabulary' },
      blocks: [
        {
          blockKey: 'h1_basic_vocab',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Từ vựng giao tiếp cơ bản' },
        },
        {
          blockKey: 'text_basic_vocab',
          type: 'TEXT',
          position: 2,
          schemaVersion: 1,
          content: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Trong tiếng Nhật, "いいえ" có nghĩa là "Không", dùng để phủ định một cách lịch sự.' }],
              },
            ],
          },
        },
      ],
      vocabulary: [
        {
          vocabularyId: vocabBasic.id,
          position: 1,
          isCore: true,
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Từ "いいえ" có nghĩa là gì?',
            options: [
              { id: 'opt_no', text: 'Không' },
              { id: 'opt_yes', text: 'Vâng / Có' },
            ],
          },
          gradingData: { correctOptionId: 'opt_no' },
          feedbackData: { explanation: '"いいえ" có nghĩa là Không.' },
        },
      ],
    },
    {
      stage: 'KANJI_COMPONENTS',
      position: 4,
      title: { vi: 'Bài 4: Thành phần Kanji (Bộ Mộc 木)', en: 'Lesson 4: Kanji Components (Radical Tree)' },
      blocks: [
        {
          blockKey: 'h1_kanji_comp',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Bộ thủ và thành phần chữ Hán: Bộ Mộc (木)' },
        },
        {
          blockKey: 'char_comp_tree',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charKanjiCompTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Bộ Mộc (木) có ý nghĩa tượng trưng cho điều gì?',
            options: [
              { id: 'opt_tree', text: 'Cây cối, gỗ' },
              { id: 'opt_water', text: 'Nước, sông hồ' },
            ],
          },
          gradingData: { correctOptionId: 'opt_tree' },
          feedbackData: { explanation: 'Bộ Mộc tượng hình một cái cây với cành và rễ.' },
        },
      ],
    },
    {
      stage: 'KANJI',
      position: 5,
      title: { vi: 'Bài 5: Chữ Hán cơ bản (Nhật 日)', en: 'Lesson 5: Basic Kanji (Sun/Day)' },
      blocks: [
        {
          blockKey: 'h1_kanji_sun',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Chữ Hán cơ bản: Nhật (日)' },
        },
        {
          blockKey: 'char_kanji_sun',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charKanjiSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Chữ Hán "日" có nghĩa là gì?',
            options: [
              { id: 'opt_sun', text: 'Mặt trời, ngày' },
              { id: 'opt_moon', text: 'Mặt trăng, tháng' },
            ],
          },
          gradingData: { correctOptionId: 'opt_sun' },
          feedbackData: { explanation: 'Chữ 日 mang nghĩa là mặt trời hoặc ngày.' },
        },
      ],
    },
    {
      stage: 'WORDS_CONTAINING_KANJI',
      position: 6,
      title: { vi: 'Bài 6: Từ vựng chứa chữ Hán (日本語)', en: 'Lesson 6: Words Containing Kanji (Japanese)' },
      blocks: [
        {
          blockKey: 'h1_kanji_words',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Từ vựng cấu thành từ chữ Hán: 日本語' },
        },
        {
          blockKey: 'char_word_sun',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charKanjiSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
      vocabulary: [
        {
          vocabularyId: vocabKanji.id,
          position: 1,
          isCore: true,
        },
      ],
      exercises: [
        {
          type: 'MCQ',
          position: 1,
          isCore: true,
          promptData: {
            prompt: 'Từ "日本語" có nghĩa là gì?',
            options: [
              { id: 'opt_japanese', text: 'Tiếng Nhật' },
              { id: 'opt_english', text: 'Tiếng Anh' },
            ],
          },
          gradingData: { correctOptionId: 'opt_japanese' },
          feedbackData: { explanation: '日本語 có nghĩa là tiếng Nhật (Nhật Bản Ngữ).' },
        },
      ],
    },
  ];

  const lessons = [];

  for (const def of lessonDefinitions) {
    let lesson = await db.lesson.findFirst({
      where: { unitId: unit.id, position: def.position },
    });

    if (!lesson) {
      lesson = await db.lesson.create({
        data: {
          id: randomUUID(),
          unitId: unit.id,
          position: def.position,
          isRequired: true,
          availability: 'PLANNED',
          rowVersion: 1n,
        },
      });

      const assignment = await db.contentAssignment.create({
        data: {
          id: randomUUID(),
          lessonId: lesson.id,
          currentTeacherId: teacherId,
          createdBy: adminId,
          scopeGeneration: 1n,
        },
      });

      await db.assignmentHistory.create({
        data: {
          id: randomUUID(),
          assignmentId: assignment.id,
          sequenceNo: 1,
          eventType: 'ASSIGNED',
          nextTeacherId: teacherId,
          changedBy: adminId,
          scopeGeneration: 1n,
          reason: 'Initial assignment',
        },
      });

      // Save draft, submit, approve, and publish with makeAvailable: true
      const draftRes = await saveTeacherLessonDraft(
        teacherId,
        lesson.id,
        {
          title: def.title,
          contentSchemaVersion: 1,
          expectedRowVersion: lesson.rowVersion.toString(),
          expectedRevisionId: null,
          blocks: def.blocks,
          exercises: def.exercises,
          ...(def.vocabulary ? { vocabulary: def.vocabulary } : {}),
        },
        db
      );
      assert.equal(draftRes.status, 200, `Draft failed for lesson ${def.position}: ${JSON.stringify(draftRes)}`);
      const revisionId = draftRes.data?.data?.highestRevision?.id || draftRes.data?.revisionId;
      assert.ok(revisionId, `Revision ID not found for lesson ${def.position}`);

      const lessonAfterDraft = await db.lesson.findUnique({ where: { id: lesson.id } });
      const revAfterDraft = await db.lessonRevision.findUnique({ where: { id: revisionId } });

      const subRes = await submitTeacherLesson(
        teacherId,
        lesson.id,
        {
          revisionId,
          expectedLessonRowVersion: lessonAfterDraft.rowVersion.toString(),
          expectedRevisionRowVersion: revAfterDraft.rowVersion.toString(),
        },
        db
      );
      assert.equal(subRes.status, 200, `Submit failed for lesson ${def.position}: ${JSON.stringify(subRes)}`);

      const revAfterSubmit = await db.lessonRevision.findUnique({ where: { id: revisionId } });
      const appRes = await approveReview(
        adminId,
        subRes.data.submissionId,
        {
          expectedRevisionRowVersion: revAfterSubmit.rowVersion.toString(),
        },
        db
      );
      assert.equal(appRes.status, 200, `Approve failed for lesson ${def.position}: ${JSON.stringify(appRes)}`);

      const revAfterApprove = await db.lessonRevision.findUnique({ where: { id: revisionId } });
      const lessonBeforePublish = await db.lesson.findUnique({ where: { id: lesson.id } });
      const pubRes = await publishReview(
        adminId,
        subRes.data.submissionId,
        {
          expectedRevisionRowVersion: revAfterApprove.rowVersion.toString(),
          expectedLessonRowVersion: lessonBeforePublish.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      assert.equal(pubRes.status, 200, `Publish failed for lesson ${def.position}: ${JSON.stringify(pubRes)}`);

      lesson = await db.lesson.findUnique({
        where: { id: lesson.id },
        include: {
          activeRevision: {
            include: {
              blocks: { orderBy: { position: 'asc' } },
              exercises: { orderBy: { position: 'asc' } },
              vocabularyLinks: { orderBy: { position: 'asc' } },
            },
          },
        },
      });
    } else {
      lesson = await db.lesson.findUnique({
        where: { id: lesson.id },
        include: {
          activeRevision: {
            include: {
              blocks: { orderBy: { position: 'asc' } },
              exercises: { orderBy: { position: 'asc' } },
              vocabularyLinks: { orderBy: { position: 'asc' } },
            },
          },
        },
      });
    }

    lessons.push({ ...lesson, stage: def.stage });
  }

  // Stage 7: Incomplete curriculum (remains PLANNED, no active revision)
  let lesson7 = await db.lesson.findFirst({
    where: { unitId: unit.id, position: 7 },
  });
  if (!lesson7) {
    lesson7 = await db.lesson.create({
      data: {
        id: randomUUID(),
        unitId: unit.id,
        position: 7,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });

    const assignment7 = await db.contentAssignment.create({
      data: {
        id: randomUUID(),
        lessonId: lesson7.id,
        currentTeacherId: teacherId,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });

    await db.assignmentHistory.create({
      data: {
        id: randomUUID(),
        assignmentId: assignment7.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: teacherId,
        changedBy: adminId,
        scopeGeneration: 1n,
        reason: 'Initial assignment for incomplete lesson',
      },
    });
  }

  lessons.push({ ...lesson7, stage: 'INCOMPLETE_PLANNED' });

  return {
    fixtureKey,
    admin: adminId,
    teacher: teacherId,
    learner: learnerId,
    language: jaLang,
    framework,
    level: levelN5,
    course,
    unit,
    lessons,
    characters: {
      hiraganaI: charHiraganaI,
      katakanaA: charKatakanaA,
      kanjiCompTree: charKanjiCompTree,
      kanjiSun: charKanjiSun,
      kanjiBook: charKanjiBook,
      kanjiWord: charKanjiWord,
    },
    vocabulary: {
      basic: vocabBasic,
      kanji: vocabKanji,
    },
  };
}
