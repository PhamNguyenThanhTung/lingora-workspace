import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createCharacter } from '../../../../lingora-admin/src/server/characters/catalogue.ts';
import { SELF_AUTHORED_FIXTURES, SELF_AUTHORED_LICENSE, SELF_AUTHORED_PROVENANCE, SELF_AUTHORED_SOURCE } from '../../../../lingora-admin/src/server/characters/fixtures.ts';
import { createStroke } from '../../../../lingora-admin/src/server/characters/validator.ts';
import { seedCharacterStrokeData } from '../../../../lingora-admin/src/server/characters/strokes.ts';
import { mapVocabularyCharacters } from '../../../../lingora-admin/src/server/characters/vocabulary.ts';
import {
  approveReview,
  publishReview,
  saveTeacherLessonDraft,
  submitTeacherLesson,
} from '../../../../lingora-admin/src/server/lessons/index.ts';

export const CHINESE_AUDIO_FIXTURE_URL = 'https://media.example.org/lingora/s6/zh-pinyin-tone-1.wav';

async function ensureSelfAuthoredCharacter(db, languageId, glyph, overrides = {}) {
  const authored = SELF_AUTHORED_FIXTURES.find((entry) => entry.languageCode === 'zh' && entry.glyph === glyph);
  assert.ok(authored, `Expected self-authored Chinese stroke fixture for ${glyph}`);
  let character = await db.writingCharacter.findUnique({
    where: { languageId_glyph: { languageId, glyph } },
  });
  if (!character) {
    character = await createCharacter({
      languageId,
      glyph,
      scriptType: authored.scriptType,
      meaning: authored.meaning,
      primaryReading: authored.primaryReading,
      romanization: authored.romanization,
      strokeCount: authored.strokeCount,
      metadata: authored.metadata || {},
      ...overrides,
    }, db);
  }
  await seedCharacterStrokeData({
    characterId: character.id,
    version: 1,
    strokes: authored.strokes,
    source: authored.source,
    license: authored.license,
    provenance: authored.provenance,
  }, db);
  return character;
}

async function publishLesson(db, { adminId, teacherId, unitId }, definition) {
  let lesson = await db.lesson.findFirst({ where: { unitId, position: definition.position } });
  if (!lesson) {
    lesson = await db.lesson.create({
      data: { unitId, position: definition.position, isRequired: true, availability: 'PLANNED' },
    });
    const assignment = await db.contentAssignment.create({
      data: { lessonId: lesson.id, currentTeacherId: teacherId, createdBy: adminId, scopeGeneration: 1n },
    });
    await db.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: teacherId,
        changedBy: adminId,
        scopeGeneration: 1n,
        reason: 'Initial assignment for synthetic Chinese curriculum',
      },
    });
    const draft = await saveTeacherLessonDraft(teacherId, lesson.id, {
      title: definition.title,
      contentSchemaVersion: 1,
      expectedRowVersion: lesson.rowVersion.toString(),
      expectedRevisionId: null,
      blocks: definition.blocks,
      exercises: [definition.exercise],
      ...(definition.vocabulary ? { vocabulary: definition.vocabulary } : {}),
    }, db);
    assert.equal(draft.status, 200, `Draft failed at lesson ${definition.position}: ${JSON.stringify(draft)}`);
    const revisionId = draft.data?.data?.highestRevision?.id || draft.data?.revisionId;
    assert.ok(revisionId, `Missing draft revision for lesson ${definition.position}`);
    const lessonAfterDraft = await db.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    const revisionAfterDraft = await db.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
    const submitted = await submitTeacherLesson(teacherId, lesson.id, {
      revisionId,
      expectedLessonRowVersion: lessonAfterDraft.rowVersion.toString(),
      expectedRevisionRowVersion: revisionAfterDraft.rowVersion.toString(),
    }, db);
    assert.equal(submitted.status, 200, `Submit failed at lesson ${definition.position}: ${JSON.stringify(submitted)}`);
    const revision = await db.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
    const approved = await approveReview(adminId, submitted.data.submissionId, {
      expectedRevisionRowVersion: revision.rowVersion.toString(),
    }, db);
    assert.equal(approved.status, 200, `Approve failed at lesson ${definition.position}: ${JSON.stringify(approved)}`);
    const approvedRevision = await db.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
    const currentLesson = await db.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    const published = await publishReview(adminId, submitted.data.submissionId, {
      expectedRevisionRowVersion: approvedRevision.rowVersion.toString(),
      expectedLessonRowVersion: currentLesson.rowVersion.toString(),
      makeAvailable: true,
    }, db);
    assert.equal(published.status, 200, `Publish failed at lesson ${definition.position}: ${JSON.stringify(published)}`);
  }
  return db.lesson.findUniqueOrThrow({
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

function title(vi, en) {
  return { vi, en };
}

function heading(key, position, text) {
  return { blockKey: key, type: 'HEADING', position, schemaVersion: 1, content: { level: 2, text } };
}

function textBlock(key, position, text) {
  return {
    blockKey: key,
    type: 'TEXT',
    position,
    schemaVersion: 1,
    content: { nodes: [{ type: 'paragraph', runs: [{ text }] }] },
  };
}

function characterBlock(key, position, characterId) {
  return {
    blockKey: key,
    type: 'CHARACTER',
    position,
    schemaVersion: 1,
    content: {
      characterId,
      showMeaning: true,
      showReading: true,
      showStrokeAnimation: true,
      guidedWriting: true,
    },
  };
}

function coreMcq(prompt, correctOptionId, options) {
  return {
    type: 'MCQ',
    position: 1,
    isCore: true,
    promptData: { prompt, options },
    gradingData: { correctOptionId },
    feedbackData: { explanation: 'Synthetic Chinese curriculum answer.' },
  };
}

function plannedLesson(db, { unitId, adminId, teacherId }) {
  return db.lesson.findFirst({ where: { unitId, position: 7 } }).then(async (existing) => {
    if (existing) return existing;
    const lesson = await db.lesson.create({
      data: { unitId, position: 7, isRequired: true, availability: 'PLANNED' },
    });
    const assignment = await db.contentAssignment.create({
      data: { lessonId: lesson.id, currentTeacherId: teacherId, createdBy: adminId, scopeGeneration: 1n },
    });
    await db.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: teacherId,
        changedBy: adminId,
        scopeGeneration: 1n,
        reason: 'Initial assignment for incomplete Chinese curriculum',
      },
    });
    return lesson;
  });
}

export async function createChineseCurriculumFixture(db, options = {}) {
  const fixtureKey = options.fixtureKey || randomUUID().replaceAll('-', '').slice(0, 12);
  assert.match(fixtureKey, /^[0-9a-f]{12}$/);
  const adminId = options.adminId || randomUUID();
  const teacherId = options.teacherId || randomUUID();
  const learnerId = options.learnerId || randomUUID();

  await db.language.upsert({
    where: { code: 'en' },
    create: { id: '00000000-0000-0000-0000-000000000001', code: 'en', names: { en: 'English' }, isLearnable: true, isUiLocale: true },
    update: {},
  });
  await db.language.upsert({
    where: { code: 'vi' },
    create: { id: '00000000-0000-0000-0000-000000000002', code: 'vi', names: { vi: 'Tiếng Việt' }, isLearnable: false, isUiLocale: true },
    update: {},
  });
  for (const [id, role, displayName] of [
    [adminId, 'ADMIN', 'Chinese Admin'],
    [teacherId, 'TEACHER', 'Chinese Teacher'],
    [learnerId, 'LEARNER', 'Chinese Learner'],
  ]) {
    await db.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${id}::uuid, ${id + '@lingora.test'}) ON CONFLICT (id) DO NOTHING`;
    await db.account.upsert({
      where: { id },
      create: { id, role, status: 'ACTIVE', uiLocale: 'vi', timezone: 'Asia/Shanghai', displayName },
      update: { status: 'ACTIVE' },
    });
  }

  const languageCode = `zh-x-lingora-${fixtureKey}`;
  let language = await db.language.findUnique({ where: { code: languageCode } });
  if (!language) {
    language = await db.language.create({
      data: {
        id: randomUUID(),
        code: languageCode,
        names: { vi: 'Tiếng Trung kiểm thử', en: 'Synthetic Chinese', zh: '中文' },
        isLearnable: true,
        isUiLocale: false,
      },
    });
  }

  const frameworkCode = `HSK-S6-${fixtureKey}`;
  let framework = await db.framework.findUnique({ where: { code_version: { code: frameworkCode, version: '2021' } } });
  if (!framework) {
    framework = await db.framework.create({
      data: { id: randomUUID(), code: frameworkCode, version: '2021', names: { vi: 'Khung HSK kiểm thử', en: 'Synthetic HSK Framework', zh: 'HSK 测试框架' } },
    });
  }
  let level = await db.level.findFirst({ where: { frameworkId: framework.id, code: 'HSK1' } });
  if (!level) {
    level = await db.level.create({
      data: { id: randomUUID(), frameworkId: framework.id, code: 'HSK1', position: 1, label: { vi: 'HSK 1', en: 'HSK 1 Beginner', zh: 'HSK 一级' } },
    });
  }
  let course = await db.course.findFirst({ where: { languageId: language.id, frameworkId: framework.id, isActive: true } });
  if (!course) {
    course = await db.course.create({
      data: {
        id: randomUUID(),
        languageId: language.id,
        frameworkId: framework.id,
        names: { vi: 'Tiếng Trung sơ cấp', en: 'Beginner Chinese', zh: '初级中文' },
        isActive: true,
        defaultStartLevelId: level.id,
      },
    });
  }
  let unit = await db.unit.findFirst({ where: { courseId: course.id, levelId: level.id, position: 1 } });
  if (!unit) {
    unit = await db.unit.create({
      data: {
        id: randomUUID(),
        courseId: course.id,
        levelId: level.id,
        code: `ZH-U1-${fixtureKey}`,
        names: { vi: 'Chương 1: Âm và chữ Hán', en: 'Unit 1: Sounds and Hanzi', zh: '第一单元：拼音与汉字' },
        position: 1,
      },
    });
  }

  const characterOne = await ensureSelfAuthoredCharacter(db, language.id, '一', { meaning: 'một' });
  const characterPerson = await ensureSelfAuthoredCharacter(db, language.id, '人', { meaning: 'người' });
  let characterMouth = await db.writingCharacter.findUnique({ where: { languageId_glyph: { languageId: language.id, glyph: '口' } } });
  if (!characterMouth) {
    characterMouth = await createCharacter({
      languageId: language.id,
      glyph: '口',
      scriptType: 'HANZI_SIMPLIFIED',
      meaning: 'miệng',
      primaryReading: 'kǒu',
      romanization: 'kou3',
      strokeCount: 3,
      metadata: { hanziSystems: ['SIMPLIFIED'], pinyin: ['kǒu'], tones: [3], hskLevel: 1 },
    }, db);
  }
  await seedCharacterStrokeData({
    characterId: characterMouth.id,
    version: 1,
    strokes: [
      createStroke(1, [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]]),
      createStroke(2, [[0.8, 0.8], [0.2, 0.8]]),
      createStroke(3, [[0.2, 0.8], [0.2, 0.2]]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  }, db);

  let vocabulary = await db.vocabularyConcept.findFirst({ where: { languageId: language.id, canonicalForm: '人口' } });
  if (!vocabulary) {
    vocabulary = await db.vocabularyConcept.create({
      data: {
        languageId: language.id,
        canonicalForm: '人口',
        normalizedForm: '人口',
        senseKey: 'population',
        meaningLabels: { vi: 'dân số', en: 'population', zh: '人口' },
        createdBy: teacherId,
      },
    });
  }
  await mapVocabularyCharacters(vocabulary.id, db);

  const stages = [
    {
      stage: 'PINYIN_TONES', position: 1,
      title: title('Bài 1: Pinyin và thanh điệu', 'Lesson 1: Pinyin and Tones'),
      blocks: [
        heading('zh_pinyin_heading', 1, 'Bốn thanh của âm ma'),
        textBlock('zh_pinyin_tones', 2, 'mā (thanh 1), má (thanh 2), mǎ (thanh 3), mà (thanh 4). Nghe mẫu âm thanh.'),
        { blockKey: 'zh_tone_audio', type: 'MEDIA', position: 3, schemaVersion: 1, content: { kind: 'audio', url: CHINESE_AUDIO_FIXTURE_URL, caption: 'Mẫu thanh điệu tiếng Trung tự tạo' } },
      ],
      exercise: coreMcq('Dấu nào biểu thị thanh 3 trong mǎ?', 'opt_third', [
        { id: 'opt_first', text: 'ā' }, { id: 'opt_second', text: 'á' }, { id: 'opt_third', text: 'ǎ' },
      ]),
    },
    {
      stage: 'BASIC_HANZI', position: 2,
      title: title('Bài 2: Hanzi cơ bản 一', 'Lesson 2: Basic Hanzi 一'),
      blocks: [heading('zh_hanzi_one_heading', 1, 'Chữ 一: một'), characterBlock('zh_char_one', 2, characterOne.id)],
      exercise: coreMcq('Chữ 一 có nghĩa là gì?', 'opt_one', [{ id: 'opt_one', text: 'một' }, { id: 'opt_person', text: 'người' }]),
    },
    {
      stage: 'COMPONENTS', position: 3,
      title: title('Bài 3: Thành phần chữ 口', 'Lesson 3: Hanzi Component 口'),
      blocks: [heading('zh_component_heading', 1, '口 là bộ khẩu'), characterBlock('zh_char_mouth', 2, characterMouth.id)],
      exercise: coreMcq('口 có nghĩa là gì?', 'opt_mouth', [{ id: 'opt_mouth', text: 'miệng' }, { id: 'opt_tree', text: 'cây' }]),
    },
    {
      stage: 'CHARACTERS', position: 4,
      title: title('Bài 4: Hanzi 人', 'Lesson 4: Hanzi 人'),
      blocks: [heading('zh_character_heading', 1, '人 nghĩa là người'), characterBlock('zh_char_person', 2, characterPerson.id)],
      exercise: coreMcq('人 đọc là gì?', 'opt_ren', [{ id: 'opt_ren', text: 'rén' }, { id: 'opt_yi', text: 'yī' }]),
    },
    {
      stage: 'WORDS', position: 5,
      title: title('Bài 5: Từ 人口', 'Lesson 5: Word 人口'),
      blocks: [heading('zh_word_heading', 1, '人口 nghĩa là dân số'), textBlock('zh_word_pinyin', 2, 'Pinyin: rénkǒu. Từ này gồm 人 (rén) và 口 (kǒu).')],
      vocabulary: [{ vocabularyId: vocabulary.id, position: 1, isCore: true }],
      exercise: coreMcq('人口 nghĩa là gì?', 'opt_population', [{ id: 'opt_population', text: 'dân số' }, { id: 'opt_language', text: 'ngôn ngữ' }]),
    },
    {
      stage: 'SENTENCES', position: 6,
      title: title('Bài 6: Câu đơn giản', 'Lesson 6: A Simple Sentence'),
      blocks: [
        heading('zh_sentence_heading', 1, '中国人很多。'),
        textBlock('zh_sentence_text', 2, '中国人很多。Pinyin: Zhōngguó rén hěn duō. Nghĩa: Có nhiều người Trung Quốc.'),
      ],
      exercise: coreMcq('中国人很多 có nghĩa là gì?', 'opt_many_people', [{ id: 'opt_many_people', text: 'Có nhiều người Trung Quốc.' }, { id: 'opt_one_person', text: 'Có một người.' }]),
    },
  ];

  const lessons = [];
  for (const definition of stages) {
    lessons.push(await publishLesson(db, { adminId, teacherId, unitId: unit.id }, definition));
  }
  let lastLesson = await plannedLesson(db, { unitId: unit.id, adminId, teacherId });
  lastLesson = await db.lesson.findUniqueOrThrow({ where: { id: lastLesson.id } });
  lessons.push({ ...lastLesson, stage: 'INCOMPLETE_PLANNED' });

  return {
    fixtureKey,
    admin: adminId,
    teacher: teacherId,
    learner: learnerId,
    language,
    framework,
    level,
    course,
    unit,
    lessons: lessons.map((lesson, index) => ({ ...lesson, stage: stages[index]?.stage || 'INCOMPLETE_PLANNED' })),
    characters: { one: characterOne, mouth: characterMouth, person: characterPerson },
    vocabulary: { population: vocabulary },
    audioUrl: CHINESE_AUDIO_FIXTURE_URL,
  };
}
