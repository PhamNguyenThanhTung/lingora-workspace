import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import {submitTeacherLesson,approveReview,publishReview} from '../../../../lingora-admin/src/server/lessons/index.ts';

export async function createPracticeFixture(db, {fiveTypes=false} = {}) {
  const id = () => randomUUID();
  const f = {
    admin: id(),
    teacher: id(),
    learnerA: id(),
    learnerB: id(),
    lang: id(),
    framework: id(),
    level: id(),
    course: id(),
    unit: id(),
    lesson: id(),
    revision: id(),
    assignment: id(),
    episode: id(),
    ctxA: id(),
    ctxB: id(),
    vocabId: id(),
    vocabLinkId: id(),
    itemId: id(),
    itemRevId: id(),
    exerciseId: id(),
  };

  // DB-native concurrent-safe insert for 'en' language
  await db.$executeRaw`
    INSERT INTO app.languages (id, code, names, is_learnable, is_ui_locale, created_at, updated_at)
    VALUES (gen_random_uuid(), 'en', '{"en": "English"}'::jsonb, true, true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING
  `;

  // Insert corresponding auth.users records for accounts
  for (const uid of [f.admin, f.teacher, f.learnerA, f.learnerB]) {
    await db.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${uid}::uuid, ${uid + '@test.local'}) ON CONFLICT DO NOTHING`;
  }

  // Create accounts
  await db.account.createMany({
    data: [
      { id: f.admin, role: 'ADMIN', status: 'ACTIVE', timezone: 'Asia/Ho_Chi_Minh' },
      { id: f.teacher, role: 'TEACHER', status: 'ACTIVE', timezone: 'Asia/Ho_Chi_Minh' },
      { id: f.learnerA, role: 'LEARNER', status: 'ACTIVE', timezone: 'Asia/Ho_Chi_Minh' },
      { id: f.learnerB, role: 'LEARNER', status: 'ACTIVE', timezone: 'Asia/Ho_Chi_Minh' },
    ],
  });

  // Language, Framework, Level
  await db.language.create({
    data: { id: f.lang, code: 'local-' + f.lang.slice(0, 8), names: { en: 'Local language' }, isLearnable: true, isUiLocale: true },
  });
  await db.framework.create({
    data: { id: f.framework, code: 'local-' + f.framework.slice(0, 8), version: '1', names: { en: 'Local framework' } },
  });
  await db.level.create({
    data: { id: f.level, frameworkId: f.framework, code: 'A1', label: { en: 'First' }, position: 1 },
  });

  // Course, Unit, Lesson
  await db.course.create({
    data: { id: f.course, languageId: f.lang, frameworkId: f.framework, names: { en: 'Local course' }, isActive: true, defaultStartLevelId: f.level },
  });
  await db.unit.create({
    data: { id: f.unit, courseId: f.course, levelId: f.level, code: 'U1', names: { en: 'Local unit' }, position: 1 },
  });
  await db.lesson.create({
    data: { id: f.lesson, unitId: f.unit, position: 1, availability: 'PLANNED' },
  });

  const snapshot = { unit: 'U1' };

  // Assignment and Episode
  await db.contentAssignment.create({
    data: { id: f.assignment, createdBy: f.admin, currentTeacherId: f.teacher, lessonId: f.lesson },
  });
  await db.assignmentHistory.create({
    data: {
      id: f.episode,
      assignmentId: f.assignment,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      nextTeacherId: f.teacher,
      scopeGeneration: 1n,
      changedBy: f.admin,
      scopeSnapshot: snapshot,
    },
  });

  // LessonRevision created as DRAFT first to allow adding exercises without triggering trg_lesson_exercise_parent_frozen
  await db.lessonRevision.create({
    data: {
      id: f.revision,
      lessonId: f.lesson,
      revisionNo: 1,
      assignmentId: f.assignment,
      creationAssignmentEpisodeId: f.episode,
      status: 'DRAFT',
      title: { en: 'Published local X' },
      contentBlocks: [{ type: 'paragraph', text: 'Local X content' }],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });

  // Practice Exercise (MCQ)
  const item = await db.itemIdentity.create({
    data: { id: f.itemId, origin: 'PRACTICE', createdBy: f.teacher, exactFingerprint: 'local-practice-fp-' + f.itemId },
  });
  const ir = await db.itemRevision.create({
    data: {
      id: f.itemRevId,
      itemId: item.id,
      revisionNo: 1,
      type: 'MCQ',
      promptData: { prompt: 'What is "Hello"?', options: [{ id: 'opt-1', text: 'Xin chào' }, { id: 'opt-2', text: 'Tạm biệt' }] },
      exactFingerprint: 'local-practice-fp-' + f.itemId,
      createdBy: f.teacher,
      creationAssignmentEpisodeId: f.episode,
      authoringLessonRevisionId: f.revision,
      frozenAt: null,
    },
  });
  await db.itemGradingSecret.create({
    data: { itemRevisionId: ir.id, gradingData: { correctOptionId: 'opt-1' } },
  });
  await db.lessonExercise.create({
    data: { id: f.exerciseId, lessonRevisionId: f.revision, itemId: item.id, itemRevisionId: ir.id, position: 1, isCore: true },
  });
  if(fiveTypes){
    const definitions=[
      ['FILL_BLANK',{prompt:'Fill',sentence:'Say ____'},{acceptedAnswers:['Café','Hello'],caseSensitive:false}],
      ['REORDER',{prompt:'Reorder duplicate text by token identity',tokens:[{id:'one',text:'word'},{id:'two',text:'word'}]},{correctOrder:['two','one']}],
      ['LISTENING',{prompt:'Listen',audioUrl:'https://example.com/audio.ogg',options:[{id:'a',text:'First'},{id:'b',text:'Second'}]},{correctOptionId:'a',transcript:'Private listening canary'}],
      ['GRAMMAR',{prompt:'Transform',sourceSentence:'She visits.',targetPattern:'Past simple.'},{acceptedAnswers:['She visited.'],caseSensitive:true}],
    ];
    for(const [i,[type,promptData,gradingData]] of definitions.entries()){
      const item=await db.itemIdentity.create({data:{origin:'PRACTICE',createdBy:f.teacher,exactFingerprint:`local-${randomUUID()}`}});
      const revision=await db.itemRevision.create({data:{itemId:item.id,revisionNo:1,type,promptData,exactFingerprint:item.exactFingerprint,createdBy:f.teacher,creationAssignmentEpisodeId:f.episode,authoringLessonRevisionId:f.revision}});
      await db.itemGradingSecret.create({data:{itemRevisionId:revision.id,gradingData}});
      await db.lessonExercise.create({data:{lessonRevisionId:f.revision,itemId:item.id,itemRevisionId:revision.id,position:i+2,isCore:true}});
    }
  }

  // Vocabulary Concept and Link (isCore: true)
  await db.vocabularyConcept.create({
    data: {
      id: f.vocabId,
      languageId: f.lang,
      canonicalForm: 'Hello',
      normalizedForm: 'hello',
      senseKey: 'greeting',
      meaningLabels: { vi: 'Xin chào', en: 'Hello' },
      createdBy: f.teacher,
    },
  });
  await db.lessonVocabularyLink.create({
    data: {
      id: f.vocabLinkId,
      lessonRevisionId: f.revision,
      vocabularyId: f.vocabId,
      position: 1,
      isCore: true,
      displaySnapshot: {
        schemaVersion: 1,
        languageId: f.lang,
        canonicalForm: 'Hello',
        senseKey: 'greeting',
        meaningLabels: { vi: 'Xin chào', en: 'Hello' },
      },
    },
  });

  // Use the actual staff workflow so initial publication has the same SUBMIT
  // provenance required when a real publisher later archives X for successor Y.
  const lesson = await db.lesson.findUnique({where:{id:f.lesson}});
  const submitted = await submitTeacherLesson(f.teacher,f.lesson,{revisionId:f.revision,expectedLessonRowVersion:lesson.rowVersion.toString(),expectedRevisionRowVersion:'1'},db);
  assert.equal(submitted.status,200,JSON.stringify(submitted));
  let revision = await db.lessonRevision.findUnique({where:{id:f.revision}});
  const approved = await approveReview(f.admin,submitted.data.submissionId,{expectedRevisionRowVersion:revision.rowVersion.toString()},db);
  assert.equal(approved.status,200,JSON.stringify(approved));
  revision = await db.lessonRevision.findUnique({where:{id:f.revision}});
  const currentLesson = await db.lesson.findUnique({where:{id:f.lesson}});
  const published = await publishReview(f.admin,submitted.data.submissionId,{expectedRevisionRowVersion:revision.rowVersion.toString(),expectedLessonRowVersion:currentLesson.rowVersion.toString(),makeAvailable:true},db);
  assert.equal(published.status,200,JSON.stringify(published));

  // Learning Contexts
  await db.learningContext.createMany({
    data: [
      { id: f.ctxA, learnerId: f.learnerA },
      { id: f.ctxB, learnerId: f.learnerB },
    ].map((x) => ({
      ...x,
      languageId: f.lang,
      courseId: f.course,
      status: 'ACTIVE',
      selectedStartLevelId: f.level,
      workingLevelId: f.level,
      startSource: 'DEFAULT',
    })),
  });

  return f;
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export async function bounded(p, label) {
  let timer;
  try {
    return await Promise.race([
      p,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout: ' + label)), 8000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
