/**
 * Lingora M1.4 Deterministic Seed Verification Harness
 * Verifies exact seed counts, idempotency, published/draft RLS visibility,
 * and learner-ownership boundaries with zero test residue.
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { runSeed, uuidv5, NAMESPACE, FIXED_EPOCH, SEED_DATA } = require('./seed');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const db = new PrismaClient();
const results = [];
const createdTestUserIds = [];
const priorTestUserIds = (process.env.M14_PRIOR_TEST_USER_IDS || '')
  .split(',')
  .filter(id => /^[0-9a-f-]{36}$/i.test(id));
const createdSrsCardIds = [];

function record(testId, passed, evidence) {
  results.push({ testId, passed, evidence });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${testId}: ${evidence}`);
}

async function authAdminRequest(method, suffix, body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users${suffix}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Auth admin request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

async function signIn(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error(`Auth sign-in failed with HTTP ${response.status}`);
  return payload.access_token;
}

async function createTestUser(label) {
  const email = `m14-${label}-${crypto.randomUUID().slice(0, 8)}@lingora.local`;
  const password = `M14!${crypto.randomBytes(16).toString('hex')}Aa1`;
  const created = await authAdminRequest('POST', '', {
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Test ${label}` }
  });
  const id = created.id || created.user?.id;
  if (!id) throw new Error('Create user returned no ID');
  createdTestUserIds.push(id);
  const token = await signIn(email, password);
  return { id, email, token };
}

async function restRequest(token, method, relation, query = '', body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${relation}${query}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

function isPrivilegeDenial(response) {
  return [401, 403, 405].includes(response.status) || response.payload?.code === '42501';
}

function sameSrsState(left, right) {
  return left.intervalDays === right.intervalDays &&
    left.recallProbability === right.recallProbability &&
    left.reviewCount === right.reviewCount &&
    left.lapseCount === right.lapseCount &&
    String(left.lastReviewedAt) === String(right.lastReviewedAt) &&
    String(left.nextReviewAt) === String(right.nextReviewAt);
}

async function verifyCounts() {
  console.log('\n--- 1. Verifying Deterministic Seed Counts ---');
  
  const langCount = await db.language.count({ where: { code: { in: ['vi', 'en'] } } });
  const courseCount = await db.course.count({ where: { id: { in: SEED_DATA.courses.map(c => c.id) } } });
  const courseTransCount = await db.courseTranslation.count({ where: { courseId: { in: SEED_DATA.courses.map(c => c.id) } } });
  const lessonCount = await db.lesson.count({ where: { id: { in: SEED_DATA.lessons.map(l => l.id) } } });
  const lessonTransCount = await db.lessonTranslation.count({ where: { lessonId: { in: SEED_DATA.lessons.map(l => l.id) } } });
  
  const vocabIds = SEED_DATA.vocabularies.map(v => uuidv5(`lingora:m1.4:vocab:english-a1:${v.lessonKey}:${String(v.index).padStart(2, '0')}`));
  const vocabCount = await db.vocabulary.count({ where: { id: { in: vocabIds } } });
  const vocabTransCount = await db.vocabularyTranslation.count({ where: { vocabularyId: { in: vocabIds } } });
  const junctionCount = await db.lessonVocabulary.count({ where: { vocabularyId: { in: vocabIds } } });
  
  const exerciseIds = SEED_DATA.exercises.map(e => e.id);
  const exerciseCount = await db.exercise.count({ where: { id: { in: exerciseIds } } });
  
  const scenarioIds = SEED_DATA.scenarios.map(s => s.id);
  const scenarioCount = await db.chatScenario.count({ where: { id: { in: scenarioIds } } });
  const scenarioTransCount = await db.chatScenarioTranslation.count({ where: { scenarioId: { in: scenarioIds } } });

  const publishedCourseCount = await db.course.count({ where: { id: { in: SEED_DATA.courses.map(c => c.id) }, isPublished: true } });
  const draftCourseCount = await db.course.count({ where: { id: { in: SEED_DATA.courses.map(c => c.id) }, isPublished: false } });
  const publishedLessonCount = await db.lesson.count({ where: { id: { in: SEED_DATA.lessons.map(l => l.id) }, isPublished: true } });
  const draftLessonCount = await db.lesson.count({ where: { id: { in: SEED_DATA.lessons.map(l => l.id) }, isPublished: false } });

  record('M1.4-COUNT-LANGUAGES', langCount === 2, `languages count = ${langCount} (expected 2)`);
  record('M1.4-COUNT-COURSES', courseCount === 2 && publishedCourseCount === 1 && draftCourseCount === 1, `courses count = ${courseCount} (published: ${publishedCourseCount}, draft: ${draftCourseCount})`);
  record('M1.4-COUNT-COURSE-TRANS', courseTransCount === 2, `course_translations count = ${courseTransCount} (expected 2)`);
  record('M1.4-COUNT-LESSONS', lessonCount === 7 && publishedLessonCount === 5 && draftLessonCount === 2, `lessons count = ${lessonCount} (published: ${publishedLessonCount}, draft: ${draftLessonCount})`);
  record('M1.4-COUNT-LESSON-TRANS', lessonTransCount === 10, `lesson_translations count = ${lessonTransCount} (expected 10)`);
  record('M1.4-COUNT-VOCABULARIES', vocabCount === 50, `vocabularies count = ${vocabCount} (expected 50)`);
  record('M1.4-COUNT-VOCAB-TRANS', vocabTransCount === 100, `vocabulary_translations count = ${vocabTransCount} (expected 100)`);
  record('M1.4-COUNT-LESSON-VOCAB', junctionCount === 50, `lesson_vocabulary junctions = ${junctionCount} (expected 50)`);
  record('M1.4-COUNT-EXERCISES', exerciseCount === 15, `exercises count = ${exerciseCount} (expected 15)`);
  record('M1.4-COUNT-SCENARIOS', scenarioCount === 2, `chat_scenarios count = ${scenarioCount} (expected 2)`);
  record('M1.4-COUNT-SCENARIO-TRANS', scenarioTransCount === 2, `chat_scenario_translations = ${scenarioTransCount} (expected 2)`);
}

async function verifyIdempotency() {
  console.log('\n--- 2. Verifying Seed Idempotency (Second Execution) ---');
  
  const beforeStats = {
    courses: await db.course.count(),
    lessons: await db.lesson.count(),
    vocabularies: await db.vocabulary.count(),
    exercises: await db.exercise.count(),
    scenarios: await db.chatScenario.count()
  };

  await runSeed(db);

  const afterStats = {
    courses: await db.course.count(),
    lessons: await db.lesson.count(),
    vocabularies: await db.vocabulary.count(),
    exercises: await db.exercise.count(),
    scenarios: await db.chatScenario.count()
  };

  const isIdentical = 
    beforeStats.courses === afterStats.courses &&
    beforeStats.lessons === afterStats.lessons &&
    beforeStats.vocabularies === afterStats.vocabularies &&
    beforeStats.exercises === afterStats.exercises &&
    beforeStats.scenarios === afterStats.scenarios;

  record('M1.4-IDEMPOTENCY', isIdentical, `Second seed run produced identical table counts: ${JSON.stringify(afterStats)}`);
}

async function verifyRLSAndOwnership() {
  console.log('\n--- 3. Verifying RLS Visibility & Learner Boundaries ---');

  let userA, userB, admin;
  try {
    userA = await createTestUser('learner-a');
    userB = await createTestUser('learner-b');
    admin = await createTestUser('admin');
    await db.profile.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });

    const publishedCourseId = uuidv5('lingora:m1.4:course:english-a1');
    const draftCourseId = uuidv5('lingora:m1.4:course:visibility-draft');
    const draftLessonId = uuidv5('lingora:m1.4:lesson:english-a1:draft');
    const nestedDraftLessonId = uuidv5('lingora:m1.4:lesson:visibility-draft:01');
    const draftScenarioId = uuidv5('lingora:m1.4:scenario:visibility-draft');
    const publishedLessonId = uuidv5('lingora:m1.4:lesson:english-a1:01');

    const published = await restRequest(userA.token, 'GET', 'courses', `?id=eq.${publishedCourseId}`);
    record('M1.4-RLS-PUBLISHED-COURSE', published.status === 200 && published.payload?.length === 1 && published.payload[0].is_published === true, `Learner published-course read HTTP ${published.status}, rows ${published.payload?.length ?? 'n/a'}`);

    const learnerDraftCourse = await restRequest(userA.token, 'GET', 'courses', `?id=eq.${draftCourseId}`);
    const learnerDraftLesson = await restRequest(userA.token, 'GET', 'lessons', `?id=eq.${draftLessonId}`);
    const learnerNestedDraftLesson = await restRequest(userA.token, 'GET', 'lessons', `?id=eq.${nestedDraftLessonId}`);
    const learnerDraftScenario = await restRequest(userA.token, 'GET', 'chat_scenarios', `?id=eq.${draftScenarioId}`);
    const learnerDraftsHidden = [learnerDraftCourse, learnerDraftLesson, learnerNestedDraftLesson, learnerDraftScenario]
      .every(response => response.status === 200 && Array.isArray(response.payload) && response.payload.length === 0);
    record('M1.4-RLS-DRAFT-HIDDEN', learnerDraftsHidden, `Learner draft reads: course=${learnerDraftCourse.payload?.length ?? 'n/a'}, lessons=${learnerDraftLesson.payload?.length ?? 'n/a'}/${learnerNestedDraftLesson.payload?.length ?? 'n/a'}, scenario=${learnerDraftScenario.payload?.length ?? 'n/a'}`);

    const anonymousResponse = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${publishedCourseId}`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(30000),
    });
    const anonymousPayload = await anonymousResponse.json().catch(() => null);
    record('M1.4-RLS-ANONYMOUS-DENIED', anonymousResponse.status >= 400 && !Array.isArray(anonymousPayload), `Anonymous published-course read denied with HTTP ${anonymousResponse.status}`);

    const adminDraftCourse = await restRequest(admin.token, 'GET', 'courses', `?id=eq.${draftCourseId}`);
    const adminDraftLesson = await restRequest(admin.token, 'GET', 'lessons', `?id=eq.${draftLessonId}`);
    const adminNestedDraftLesson = await restRequest(admin.token, 'GET', 'lessons', `?id=eq.${nestedDraftLessonId}`);
    const adminDraftScenario = await restRequest(admin.token, 'GET', 'chat_scenarios', `?id=eq.${draftScenarioId}`);
    const adminSeesDrafts = [adminDraftCourse, adminDraftLesson, adminNestedDraftLesson, adminDraftScenario]
      .every(response => response.status === 200 && Array.isArray(response.payload) && response.payload.length === 1);
    record('M1.4-RLS-ADMIN-DRAFT-READ', adminSeesDrafts, `Admin draft reads: course=${adminDraftCourse.payload?.length ?? 'n/a'}, lessons=${adminDraftLesson.payload?.length ?? 'n/a'}/${adminNestedDraftLesson.payload?.length ?? 'n/a'}, scenario=${adminDraftScenario.payload?.length ?? 'n/a'}`);

    const firstVocabId = uuidv5('lingora:m1.4:vocab:english-a1:lesson-01:01');
    const progressA = await db.userProgress.create({
      data: { userId: userA.id, lessonId: publishedLessonId, status: 'IN_PROGRESS', score: 20 }
    });
    const srsCardA = await db.userVocabSrs.create({
      data: {
        userId: userA.id,
        vocabularyId: firstVocabId,
        easeFactor: 2.5,
        intervalDays: 1.0,
        recallProbability: 0.5,
        nextReviewAt: new Date()
      }
    });
    createdSrsCardIds.push(srsCardA.id);

    const srsReadA = await restRequest(userA.token, 'GET', 'user_vocab_srs', `?user_id=eq.${userA.id}`);
    const srsReadB = await restRequest(userB.token, 'GET', 'user_vocab_srs', `?user_id=eq.${userA.id}`);
    record('M1.4-RLS-OWN-SRS-READ', srsReadA.status === 200 && srsReadA.payload?.length === 1, `Learner A own-card read HTTP ${srsReadA.status}, rows ${srsReadA.payload?.length ?? 'n/a'}`);
    record('M1.4-RLS-OTHER-SRS-BLOCKED', srsReadB.status === 200 && srsReadB.payload?.length === 0, `Learner B cross-owner read HTTP ${srsReadB.status}, rows ${srsReadB.payload?.length ?? 'n/a'}`);

    const deniedProgressInsertId = crypto.randomUUID();
    const deniedSrsInsertId = crypto.randomUUID();
    const deniedReviewInsertId = crypto.randomUUID();
    const directMutations = [
      ['PROGRESS-INSERT', await restRequest(userA.token, 'POST', 'user_progress', '', { id: deniedProgressInsertId, user_id: userA.id, lesson_id: publishedLessonId, status: 'IN_PROGRESS' })],
      ['PROGRESS-UPDATE', await restRequest(userA.token, 'PATCH', 'user_progress', `?id=eq.${progressA.id}`, { score: 99 })],
      ['PROGRESS-DELETE', await restRequest(userA.token, 'DELETE', 'user_progress', `?id=eq.${progressA.id}`)],
      ['SRS-INSERT', await restRequest(userA.token, 'POST', 'user_vocab_srs', '', { id: deniedSrsInsertId, user_id: userA.id, vocabulary_id: firstVocabId, interval_days: 3, next_review_at: new Date().toISOString() })],
      ['SRS-UPDATE', await restRequest(userA.token, 'PATCH', 'user_vocab_srs', `?id=eq.${srsCardA.id}`, { interval_days: 9 })],
      ['SRS-DELETE', await restRequest(userA.token, 'DELETE', 'user_vocab_srs', `?id=eq.${srsCardA.id}`)],
      ['REVIEW-INSERT', await restRequest(userA.token, 'POST', 'review_logs', '', { id: deniedReviewInsertId, srs_card_id: srsCardA.id, is_correct: true, interval_days: 1 })]
    ];
    for (const [name, response] of directMutations) {
      record(`M1.4-RLS-DIRECT-${name}-DENIED`, isPrivilegeDenial(response), `${name} denied with HTTP ${response.status}, code ${response.payload?.code ?? 'n/a'}`);
    }

    const progressAfterDenied = await db.userProgress.findUnique({ where: { id: progressA.id } });
    const srsBeforeRpc = await db.userVocabSrs.findUnique({ where: { id: srsCardA.id } });
    const deniedInsertResidue = await Promise.all([
      db.userProgress.count({ where: { id: deniedProgressInsertId } }),
      db.userVocabSrs.count({ where: { id: deniedSrsInsertId } }),
      db.reviewLog.count({ where: { id: deniedReviewInsertId } })
    ]);
    record('M1.4-RLS-DIRECT-MUTATION-STATE-UNCHANGED', progressAfterDenied?.score === 20 && srsBeforeRpc?.intervalDays === 1 && deniedInsertResidue.every(count => count === 0), `Protected rows unchanged; denied insert residue=${deniedInsertResidue.join('/')}`);

    const profileBeforeRpc = await db.profile.findUnique({ where: { id: userA.id } });
    const reviewCountBeforeRpc = await db.reviewLog.count({ where: { srsCardId: srsCardA.id } });
    const rpcResA = await fetch(`${supabaseUrl}/rest/v1/rpc/record_review`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userA.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_srs_card_id: srsCardA.id,
        p_is_correct: true,
        p_recall_probability: 0.85,
        p_recommended_interval_days: 2.0
      })
    });
    record('M1.4-RPC-RECORD-REVIEW-OWNER', rpcResA.status === 204 || rpcResA.status === 200, `record_review owner response HTTP ${rpcResA.status}`);

    const srsAfterRpc = await db.userVocabSrs.findUnique({ where: { id: srsCardA.id } });
    const profileAfterRpc = await db.profile.findUnique({ where: { id: userA.id } });
    const reviewsAfterRpc = await db.reviewLog.findMany({ where: { srsCardId: srsCardA.id }, orderBy: { reviewedAt: 'desc' } });
    const newestReview = reviewsAfterRpc[0];
    const rpcStateChanged = srsAfterRpc?.recallProbability === 0.85 &&
      srsAfterRpc?.intervalDays === 2 &&
      srsAfterRpc?.reviewCount === (srsBeforeRpc?.reviewCount ?? 0) + 1 &&
      srsAfterRpc?.lapseCount === srsBeforeRpc?.lapseCount &&
      srsAfterRpc?.lastReviewedAt instanceof Date &&
      srsAfterRpc?.nextReviewAt > srsBeforeRpc?.nextReviewAt &&
      reviewsAfterRpc.length === reviewCountBeforeRpc + 1 &&
      newestReview?.isCorrect === true && newestReview?.intervalDays === 1 &&
      profileAfterRpc?.streakCount === 1 && profileAfterRpc?.lastQualifyingActivityDate instanceof Date &&
      profileBeforeRpc?.streakCount === 0 && profileBeforeRpc?.lastQualifyingActivityDate === null;
    record('M1.4-RPC-RECORD-REVIEW-STATE-MUTATION', rpcStateChanged, `SRS interval=${srsAfterRpc?.intervalDays}, recall=${srsAfterRpc?.recallProbability}, reviews=${srsAfterRpc?.reviewCount}, logs=${reviewsAfterRpc.length}, streak=${profileAfterRpc?.streakCount}, activityDate=${profileAfterRpc?.lastQualifyingActivityDate?.toISOString().slice(0, 10) ?? 'null'}`);

    const reviewUpdate = await restRequest(userA.token, 'PATCH', 'review_logs', `?id=eq.${newestReview.id}`, { interval_days: 99 });
    const reviewDelete = await restRequest(userA.token, 'DELETE', 'review_logs', `?id=eq.${newestReview.id}`);
    record('M1.4-RLS-DIRECT-REVIEW-UPDATE-DENIED', isPrivilegeDenial(reviewUpdate), `REVIEW-UPDATE denied with HTTP ${reviewUpdate.status}, code ${reviewUpdate.payload?.code ?? 'n/a'}`);
    record('M1.4-RLS-DIRECT-REVIEW-DELETE-DENIED', isPrivilegeDenial(reviewDelete), `REVIEW-DELETE denied with HTTP ${reviewDelete.status}, code ${reviewDelete.payload?.code ?? 'n/a'}`);
    const reviewAfterDenied = await db.reviewLog.findUnique({ where: { id: newestReview.id } });
    record('M1.4-RLS-DIRECT-REVIEW-STATE-UNCHANGED', reviewAfterDenied?.intervalDays === 1, `ReviewLog interval remained ${reviewAfterDenied?.intervalDays}`);

    const ownerStateBeforeNonOwner = await db.userVocabSrs.findUnique({ where: { id: srsCardA.id } });
    const profileStateBeforeNonOwner = await db.profile.findUnique({ where: { id: userA.id } });
    const logCountBeforeNonOwner = await db.reviewLog.count({ where: { srsCardId: srsCardA.id } });
    const rpcResB = await fetch(`${supabaseUrl}/rest/v1/rpc/record_review`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userB.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_srs_card_id: srsCardA.id,
        p_is_correct: true,
        p_recall_probability: 0.85,
        p_recommended_interval_days: 2.0
      })
    });
    record('M1.4-RPC-RECORD-REVIEW-NON-OWNER', rpcResB.status >= 400, `record_review blocked for non-owner (HTTP ${rpcResB.status})`);

    const ownerStateAfterNonOwner = await db.userVocabSrs.findUnique({ where: { id: srsCardA.id } });
    const profileStateAfterNonOwner = await db.profile.findUnique({ where: { id: userA.id } });
    const logCountAfterNonOwner = await db.reviewLog.count({ where: { srsCardId: srsCardA.id } });
    const nonOwnerAtomic = sameSrsState(ownerStateBeforeNonOwner, ownerStateAfterNonOwner) &&
      profileStateBeforeNonOwner?.streakCount === profileStateAfterNonOwner?.streakCount &&
      String(profileStateBeforeNonOwner?.lastQualifyingActivityDate) === String(profileStateAfterNonOwner?.lastQualifyingActivityDate) &&
      logCountBeforeNonOwner === logCountAfterNonOwner;
    record('M1.4-RPC-NON-OWNER-STATE-UNCHANGED', nonOwnerAtomic, `Non-owner attempt left SRS/profile/log state unchanged; logs=${logCountAfterNonOwner}`);

  } catch (err) {
    record('M1.4-RLS-ERROR', false, `RLS verification failed: ${err.message}`);
  }
}

async function cleanup() {
  console.log('\n--- 4. Cleaning Up Temporary Test Fixtures ---');
  const allTestIds = Array.from(new Set([...createdTestUserIds, ...priorTestUserIds]));

  for (const userId of allTestIds) {
    if (priorTestUserIds.includes(userId) && !createdTestUserIds.includes(userId)) {
      const priorProfile = await db.profile.findUnique({ where: { id: userId }, select: { email: true } });
      if (priorProfile && !priorProfile.email.startsWith('m14-')) {
        throw new Error(`Refusing cleanup: exact prior UUID ${userId} is not an M1.4 test identity`);
      }
    }
    await db.reviewLog.deleteMany({ where: { srsCard: { userId } } });
    await db.userVocabSrs.deleteMany({ where: { userId } });
    await db.userProgress.deleteMany({ where: { userId } });
    const sessions = await db.chatSession.findMany({ where: { userId }, select: { id: true } });
    if (sessions.length) {
      await db.chatMessage.deleteMany({ where: { sessionId: { in: sessions.map(session => session.id) } } });
      await db.chatSession.deleteMany({ where: { id: { in: sessions.map(session => session.id) } } });
    }
    await db.profile.deleteMany({ where: { id: userId } });

    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ should_soft_delete: false }),
      signal: AbortSignal.timeout(30000),
    });
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      throw new Error(`Exact Auth cleanup failed for ${userId} with HTTP ${deleteResponse.status}`);
    }
  }

  let authResidue = 0;
  for (const userId of allTestIds) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      signal: AbortSignal.timeout(30000),
    });
    if (response.status !== 404) authResidue += 1;
  }
  const profileResidue = await db.profile.count({ where: { id: { in: allTestIds } } });
  const progressResidue = await db.userProgress.count({ where: { userId: { in: allTestIds } } });
  const srsResidue = await db.userVocabSrs.count({ where: { userId: { in: allTestIds } } });
  const reviewResidue = createdSrsCardIds.length ? await db.reviewLog.count({ where: { srsCardId: { in: createdSrsCardIds } } }) : 0;
  const chatResidue = await db.chatSession.count({ where: { userId: { in: allTestIds } } });
  let storageResidue = 0;
  for (const userId of allTestIds) {
    const rows = await db.$queryRaw`SELECT count(*)::int AS count FROM storage.objects WHERE owner_id = ${userId}`;
    storageResidue += rows[0]?.count ?? 0;
  }
  const totalResidue = authResidue + profileResidue + progressResidue + srsResidue + reviewResidue + chatResidue + storageResidue;
  record('M1.4-CLEANUP-SAFETY', totalResidue === 0, `Exact-target residue auth/profile/progress/srs/review/chat/storage=${authResidue}/${profileResidue}/${progressResidue}/${srsResidue}/${reviewResidue}/${chatResidue}/${storageResidue}`);
}

async function main() {
  console.log('=== Lingora M1.4 Deterministic Seed Verification ===\n');
  try {
    await verifyCounts();
    await verifyIdempotency();
    await verifyRLSAndOwnership();
    await cleanup();

    console.log('\n=== Summary of Test Results ===');
    const allPassed = results.every(r => r.passed);
    console.log(`Total tests: ${results.length}, Passed: ${results.filter(r => r.passed).length}, Failed: ${results.filter(r => !r.passed).length}`);
    
    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Test harness failed:', err);
  process.exit(1);
});
