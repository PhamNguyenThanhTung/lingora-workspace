import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { lessonsFixture } from './harness/lessons-fixture.mjs';

mock.module('next/headers.js', { exports: { cookies: async () => ({ getAll: () => [], get: () => undefined }) } });
mock.module('next/navigation.js', {
  exports: {
    notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
    redirect: () => {},
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/review',
  },
});
mock.module('server-only', { exports: {} });

const {
  provisionSampleA1Curriculum,
  SAMPLE_A1_CONSTANTS,
} = await import('../../src/server/curriculum/sample-a1.ts');

const {
  createLesson,
  assignLesson,
  saveTeacherLessonDraft,
} = await import('../../src/server/lessons/index.ts');

const adminId = '00000000-0000-4000-8000-000000000001';
const teacherId = '11111111-1111-4111-8111-111111111111';
const repoRoot = path.resolve(import.meta.dirname, '../../..');
const cliScript = path.resolve(repoRoot, 'scripts/seed-sample-curriculum.mjs');

describe('P6: Opt-in Useful Sample Curriculum CLI Guards (R1)', () => {
  const validOwnedUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/slice11_test';

  test('missing --confirm-owned-loopback flag fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: validOwnedUrl,
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Refusing to seed without explicit --confirm-owned-loopback flag/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when flag is omitted');
  });

  test('missing SLICE11_TEST_DATABASE_OWNED marker fails closed with exit code 1', () => {
    let exited = false;
    try {
      const cleanEnv = { ...process.env };
      delete cleanEnv.SLICE11_TEST_DATABASE_OWNED;
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...cleanEnv,
          SLICE11_TEST_DATABASE_URL: validOwnedUrl,
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /SLICE11_TEST_DATABASE_OWNED=1 is required for safety/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when owned marker is missing');
  });

  test('missing explicit SLICE11_TEST_DATABASE_URL fails closed with exit code 1', () => {
    let exited = false;
    try {
      const cleanEnv = { ...process.env };
      delete cleanEnv.SLICE11_TEST_DATABASE_URL;
      delete cleanEnv.SAMPLE_CURRICULUM_DATABASE_URL;
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...cleanEnv,
          SLICE11_TEST_DATABASE_OWNED: '1',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Explicit SLICE11_TEST_DATABASE_URL is required/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when SLICE11_TEST_DATABASE_URL is missing');
  });

  test('generic DATABASE_URL without explicit SLICE11_TEST_DATABASE_URL fails closed', () => {
    let exited = false;
    try {
      const cleanEnv = { ...process.env };
      delete cleanEnv.SAMPLE_CURRICULUM_DATABASE_URL;
      delete cleanEnv.SLICE11_TEST_DATABASE_URL;
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...cleanEnv,
          SLICE11_TEST_DATABASE_OWNED: '1',
          DATABASE_URL: validOwnedUrl,
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Explicit SLICE11_TEST_DATABASE_URL is required/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when generic DATABASE_URL fallback is attempted');
  });

  test('malformed database URL fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'http://[::1:not-a-valid-port',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Invalid database URL format/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when database URL is malformed');
  });

  test('wrong protocol (e.g. http:// or mysql://) fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'http://127.0.0.1:5432/slice11_test',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /protocol must be 'postgresql:' or 'postgres:'/);
    }
    assert.equal(exited, true, 'CLI must reject wrong protocol');
  });

  test('non-loopback hostname fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'postgresql://prod:secret@production-db.lingora.internal:5432/slice11_test',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Refusing to run on non-loopback host/);
    }
    assert.equal(exited, true, 'CLI must exit with code 1 when database URL is not loopback');
  });

  test('hostname containing localhost but not loopback (attacker domain) fails closed', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'postgresql://prod:secret@localhost.attacker.com:5432/slice11_test',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Refusing to run on non-loopback host/);
    }
    assert.equal(exited, true, 'CLI must reject substring localhost in foreign domain');
  });

  test('non-exact database pathname (e.g. /production or /slice10_test) fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/production',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Database URL must target exact database '\/slice11_test'/);
    }
    assert.equal(exited, true, 'CLI must reject non-slice11_test database path');
  });

  test('owned port A versus sample override port B fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:65431/slice11_test',
          SAMPLE_CURRICULUM_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:65432/slice11_test',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /Override SAMPLE_CURRICULUM_DATABASE_URL does not match owned SLICE11_TEST_DATABASE_URL/);
    }
    assert.equal(exited, true, 'CLI must reject sample override targeting a different cluster port');
  });

  test('owned port A versus runtime generic DATABASE_URL port B fails closed with exit code 1', () => {
    let exited = false;
    try {
      execFileSync('node', [cliScript, '--confirm-owned-loopback'], {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:65431/slice11_test',
          DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:65432/slice11_test',
        },
        stdio: 'pipe',
      });
    } catch (err) {
      exited = true;
      assert.equal(err.status, 1);
      assert.match(err.stderr.toString(), /DATABASE_URL does not match owned SLICE11_TEST_DATABASE_URL/);
    }
    assert.equal(exited, true, 'CLI must reject generic DATABASE_URL targeting a different cluster port');
  });

  test('valid explicit loopback URL and owned marker pass guard validation with exit code 0', () => {
    const output = execFileSync(
      'node',
      [cliScript, '--confirm-owned-loopback', '--check-guard-only'],
      {
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_OWNED: '1',
          SLICE11_TEST_DATABASE_URL: validOwnedUrl,
          SAMPLE_CURRICULUM_DATABASE_URL: validOwnedUrl,
          DATABASE_URL: validOwnedUrl,
        },
        encoding: 'utf8',
      }
    );
    assert.match(output, /Verified owned loopback DB: host=127.0.0.1, db=\/slice11_test/);
    assert.match(output, /GUARD_OK/);
  });
});

describe('P6: Sample Curriculum Provisioning & Content Invariants', () => {
  let fixture;

  beforeEach(() => {
    fixture = lessonsFixture();
    // Setup required base entities
    fixture.state.accounts.set(adminId, {
      id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Sample Admin',
    });
    fixture.state.accounts.set(teacherId, {
      id: teacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Sample Teacher',
    });
    fixture.state.courses.set(SAMPLE_A1_CONSTANTS.courseId, {
      id: SAMPLE_A1_CONSTANTS.courseId,
      languageId: '00000000-0000-0000-0000-000000000001',
      names: { en: '[DEV] English Core Curriculum', vi: '[DEV] Chương trình tiếng Anh chuẩn' },
      isActive: true,
    });
    fixture.state.units.set(SAMPLE_A1_CONSTANTS.unitId, {
      id: SAMPLE_A1_CONSTANTS.unitId,
      courseId: SAMPLE_A1_CONSTANTS.courseId,
      code: 'DEV-UNIT-01',
      position: 1,
      names: { en: '[DEV] Unit 1: Foundations', vi: '[DEV] Bài 1: Nền tảng' },
    });
  });

  test('provisions 3 ordered lessons through authoring/publication workflow', async () => {
    const result = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result.alreadyProvisioned, false);
    assert.equal(result.lessonIds.length, 3);
    assert.ok(result.lessonIds.every(id => typeof id === 'string' && id.length > 0));

    // Check all 3 lessons are AVAILABLE and have active PUBLISHED revision
    for (let i = 0; i < 3; i++) {
      const lessonId = result.lessonIds[i];
      const lesson = fixture.state.lessons.get(lessonId);
      assert.ok(lesson, `Lesson ${lessonId} must exist`);
      assert.equal(lesson.position, i + 1);
      assert.equal(lesson.isRequired, true);
      assert.equal(lesson.availability, 'AVAILABLE');
      assert.ok(lesson.activeRevisionId);

      const revision = fixture.state.revisions.get(lesson.activeRevisionId);
      assert.ok(revision);
      assert.equal(revision.status, 'PUBLISHED');
      assert.ok(Array.isArray(revision.contentBlocks));
      assert.ok(revision.contentBlocks.length >= 2);
    }

    // Check exercise types across unit: covers MCQ, FILL_BLANK, REORDER, GRAMMAR
    const allExercises = [...fixture.state.lessonExercises.values()];
    assert.ok(allExercises.length >= 9, 'Unit must contain at least 9 exercises (3 per lesson)');

    const itemRevisions = [...fixture.state.itemRevisions.values()];
    const types = new Set(itemRevisions.map(ir => ir.type));
    assert.ok(types.has('MCQ'), 'Must cover MCQ');
    assert.ok(types.has('FILL_BLANK'), 'Must cover FILL_BLANK');
    assert.ok(types.has('REORDER'), 'Must cover REORDER');
    assert.ok(types.has('GRAMMAR'), 'Must cover GRAMMAR');

    // Check authored explanations are present
    const explanations = [...fixture.state.itemGradingSecrets.values()]
      .map(s => s.feedbackData?.explanation)
      .filter(Boolean);
    assert.ok(explanations.length >= 9, 'All core exercises must have authored explanations');
  });

  test('idempotent second provision returns alreadyProvisioned: true without duplicate writes', async () => {
    // First run
    const result1 = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result1.alreadyProvisioned, false);

    const lessonsCountBefore = fixture.state.lessons.size;
    const revisionsCountBefore = fixture.state.revisions.size;
    const exercisesCountBefore = fixture.state.lessonExercises.size;

    // Second run
    const result2 = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result2.alreadyProvisioned, true);
    assert.deepEqual(result2.lessonIds, result1.lessonIds);

    // No duplicate lessons or revisions created
    assert.equal(fixture.state.lessons.size, lessonsCountBefore);
    assert.equal(fixture.state.revisions.size, revisionsCountBefore);
    assert.equal(fixture.state.lessonExercises.size, exercisesCountBefore);
  });

  test('R2: fails early with SAMPLE_CURRICULUM_CONFLICT when unrelated published lessons exist at positions 1..3', async () => {
    // Setup 3 published lessons with unrelated titles
    for (let pos = 1; pos <= 3; pos++) {
      const id = `unrelated-lesson-${pos}`;
      const revId = `unrelated-rev-${pos}`;
      fixture.state.lessons.set(id, {
        id,
        unitId: SAMPLE_A1_CONSTANTS.unitId,
        position: pos,
        isRequired: true,
        availability: 'AVAILABLE',
        activeRevisionId: revId,
        rowVersion: 1n,
      });
      fixture.state.revisions.set(revId, {
        id: revId,
        lessonId: id,
        revisionNo: 1,
        status: 'PUBLISHED',
        title: { vi: `Bài không liên quan ${pos}`, en: `Unrelated content ${pos}` },
        rowVersion: 1n,
      });
    }

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /Bài không liên quan/);
        return true;
      }
    );
  });

  test('R2: fails early when unrelated DRAFT/PLANNED lesson exists at position 1 without creating successor or publishing', async () => {
    const unrelatedLessonId = 'unrelated-planned-1';
    const unrelatedRevId = 'unrelated-draft-1';
    fixture.state.lessons.set(unrelatedLessonId, {
      id: unrelatedLessonId,
      unitId: SAMPLE_A1_CONSTANTS.unitId,
      position: 1,
      isRequired: true,
      availability: 'PLANNED',
      activeRevisionId: null,
      rowVersion: 1n,
    });
    fixture.state.revisions.set(unrelatedRevId, {
      id: unrelatedRevId,
      lessonId: unrelatedLessonId,
      revisionNo: 1,
      status: 'DRAFT',
      title: { vi: 'Bản nháp người dùng', en: 'User Draft' },
      rowVersion: 1n,
    });

    const lessonCountBefore = fixture.state.lessons.size;
    const revCountBefore = fixture.state.revisions.size;

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        return true;
      }
    );

    // Verify no new lessons or revisions were created
    assert.equal(fixture.state.lessons.size, lessonCountBefore);
    assert.equal(fixture.state.revisions.size, revCountBefore);
  });

  test('R2: conflict at position 3 fails before modifying positions 1 or 2', async () => {
    // Only position 3 has an unrelated lesson
    const unrelatedLesson3Id = 'unrelated-lesson-3';
    const unrelatedRev3Id = 'unrelated-rev-3';
    fixture.state.lessons.set(unrelatedLesson3Id, {
      id: unrelatedLesson3Id,
      unitId: SAMPLE_A1_CONSTANTS.unitId,
      position: 3,
      isRequired: true,
      availability: 'PLANNED',
      activeRevisionId: null,
      rowVersion: 1n,
    });
    fixture.state.revisions.set(unrelatedRev3Id, {
      id: unrelatedRev3Id,
      lessonId: unrelatedLesson3Id,
      revisionNo: 1,
      status: 'DRAFT',
      title: { vi: 'Bài 3 của giáo viên khác', en: 'Teacher 3 Draft' },
      rowVersion: 1n,
    });

    // Positions 1 and 2 do not exist yet
    assert.equal(fixture.state.lessons.has(SAMPLE_A1_CONSTANTS.lesson1Id), false);
    assert.equal(fixture.state.lessons.has(SAMPLE_A1_CONSTANTS.lesson2Id), false);

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        return true;
      }
    );

    // Positions 1 and 2 must NOT have been created or modified
    assert.equal(fixture.state.lessons.has(SAMPLE_A1_CONSTANTS.lesson1Id), false);
    assert.equal(fixture.state.lessons.has(SAMPLE_A1_CONSTANTS.lesson2Id), false);
  });

  test('R2: requires active staff accounts (fails upfront if teacher is disabled)', async () => {
    fixture.state.accounts.set(teacherId, {
      id: teacherId, role: 'TEACHER', status: 'DISABLED', displayName: 'Disabled Teacher',
    });

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /requires active TEACHER account/);
        return true;
      }
    );
  });

  test('R7: Lesson 3 Ex 1 accepts only "wakes" and rejects "wakes up"', async () => {
    await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    // Find Lesson 3 exercises
    const l3Exs = [...fixture.state.lessonExercises.values()].filter(e => {
      const itemRev = fixture.state.itemRevisions.get(e.itemRevisionId);
      return itemRev?.type === 'FILL_BLANK' && itemRev?.promptData?.sentence?.includes('(wake)');
    });
    assert.equal(l3Exs.length, 1);

    const secret = [...fixture.state.itemGradingSecrets.values()].find(
      s => s.itemRevisionId === l3Exs[0].itemRevisionId
    );
    assert.ok(secret);
    const accepted = secret.gradingData.acceptedAnswers;
    assert.deepEqual(accepted, ['wakes'], 'Must only accept "wakes" to avoid "wakes up up"');
    assert.equal(accepted.includes('wakes up'), false, 'Must NOT accept "wakes up"');
  });

  test('R7: Lesson 2 Ex 2 GRAMMAR provides sentence transformation exercise without answering in prompt', async () => {
    await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    const grammarExs = [...fixture.state.lessonExercises.values()].filter(e => {
      const itemRev = fixture.state.itemRevisions.get(e.itemRevisionId);
      return itemRev?.type === 'GRAMMAR';
    });
    assert.equal(grammarExs.length, 1);

    const itemRev = fixture.state.itemRevisions.get(grammarExs[0].itemRevisionId);
    assert.ok(itemRev.promptData.targetPattern);
    assert.notEqual(itemRev.promptData.prompt, itemRev.promptData.targetPattern);

    const secret = [...fixture.state.itemGradingSecrets.values()].find(
      s => s.itemRevisionId === grammarExs[0].itemRevisionId
    );
    assert.ok(secret);
    const accepted = secret.gradingData.acceptedAnswers;
    assert.ok(accepted.includes('I am from Vietnam.'), 'Accepted answers must include "I am from Vietnam."');
    assert.ok(secret.feedbackData.explanation.includes('I am from Vietnam'));
  });

  test('R2: fails early with SAMPLE_CURRICULUM_CONFLICT when rows have exact sample titles but altered paragraph content', async () => {
    // First provision correctly
    const res = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    // Teacher alters paragraph content of lesson 1 active revision
    const l1 = fixture.state.lessons.get(res.lessonIds[0]);
    assert.ok(l1?.activeRevisionId);
    const rev1 = fixture.state.revisions.get(l1.activeRevisionId);
    assert.ok(rev1);
    rev1.contentBlocks = [
      { type: 'paragraph', text: 'Nội dung đã bị sửa đổi bởi giáo viên.' },
    ];

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /contentBlocks do not match sample definition/);
        return true;
      }
    );
  });

  test('R2: fails early when one locale of title is altered while the other matches', async () => {
    const res = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    const l1 = fixture.state.lessons.get(res.lessonIds[0]);
    const rev1 = fixture.state.revisions.get(l1.activeRevisionId);
    rev1.title = { vi: 'Bài 1: Chào hỏi cơ bản', en: 'Altered English Title' };

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /title/);
        return true;
      }
    );
  });

  test('R2: fails early when exercise prompt, grading, or explanation is altered', async () => {
    const res = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    const l1 = fixture.state.lessons.get(res.lessonIds[0]);
    const rev1 = fixture.state.revisions.get(l1.activeRevisionId);
    const ex1 = [...fixture.state.lessonExercises.values()].find(e => e.lessonRevisionId === rev1.id && e.position === 1);
    assert.ok(ex1);

    const secret = [...fixture.state.itemGradingSecrets.values()].find(s => s.itemRevisionId === ex1.itemRevisionId);
    assert.ok(secret);
    secret.feedbackData = { explanation: 'Altered explanation text' };

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /feedbackData explanation mismatch/);
        return true;
      }
    );
  });

  test('R2: fails early when vocabulary concept or displaySnapshot is altered', async () => {
    const res = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    const l1 = fixture.state.lessons.get(res.lessonIds[0]);
    const rev1 = fixture.state.revisions.get(l1.activeRevisionId);
    const link1 = [...fixture.state.lessonVocabularyLinks.values()].find(v => v.lessonRevisionId === rev1.id && v.position === 1);
    assert.ok(link1);

    const conc = fixture.state.vocabularyConcepts.get(link1.vocabularyId);
    assert.ok(conc);
    conc.meaningLabels = { vi: 'Nghĩa bị sửa', en: 'Altered' };

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /vocabulary/);
        return true;
      }
    );
  });

  test('R2: fails early when extra successor revision exists on a slot', async () => {
    const res = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });

    const l1 = fixture.state.lessons.get(res.lessonIds[0]);
    // Add successor revision 2
    fixture.state.revisions.set('rev-1-successor', {
      id: 'rev-1-successor',
      lessonId: l1.id,
      revisionNo: 2,
      status: 'DRAFT',
      title: { vi: 'Bài 1: Chào hỏi cơ bản', en: 'Lesson 1: Basic Greetings' },
      contentBlocks: [],
      rowVersion: 1n,
    });

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /extra or successor revisions/);
        return true;
      }
    );
  });

  test('R2: preflights and rejects global conflicting vocabulary concept before any writes', async () => {
    // Pre-insert conflicting concept for word 'Hello' in unit course language
    fixture.state.vocabularyConcepts.set('conflicting-hello', {
      id: 'conflicting-hello',
      languageId: '00000000-0000-0000-0000-000000000001',
      canonicalForm: 'Hello',
      normalizedForm: 'hello',
      senseKey: 'greeting',
      meaningLabels: { vi: 'Nghĩa xung đột', en: 'Conflicting meaning' },
      phonetic: 'həˈləʊ',
      partOfSpeech: 'interjection',
      example: 'Hello!',
      createdBy: adminId,
      rowVersion: 1n,
    });

    const lessonCountBefore = fixture.state.lessons.size;

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /Conflicting global vocabulary concept for word 'Hello'/);
        return true;
      }
    );

    // Assert zero writes occurred
    assert.equal(fixture.state.lessons.size, lessonCountBefore);
  });

  test('R2: resumes authored checkpoint (exact DRAFT) without calling saveTeacherLessonDraft', async () => {
    // Provision up to lesson 1 draft
    const createRes = await createLesson(adminId, SAMPLE_A1_CONSTANTS.courseId, SAMPLE_A1_CONSTANTS.unitId, { position: 1, isRequired: true }, fixture.db);
    const l1Id = createRes.data.data.id;
    const l1 = fixture.state.lessons.get(l1Id);
    await assignLesson(adminId, SAMPLE_A1_CONSTANTS.courseId, SAMPLE_A1_CONSTANTS.unitId, l1Id, { teacherId, expectedRowVersion: l1.rowVersion.toString() }, fixture.db);

    const draftRes = await saveTeacherLessonDraft(teacherId, l1Id, {
      title: { vi: 'Bài 1: Chào hỏi cơ bản', en: 'Lesson 1: Basic Greetings' },
      contentBlocks: [
        { type: 'paragraph', text: 'Chào hỏi là bước đầu tiên và quan trọng nhất khi giao tiếp bằng tiếng Anh. Trong tiếng Anh, có nhiều cách chào hỏi khác nhau tùy theo mức độ thân mật và thời gian trong ngày.' },
        { type: 'paragraph', text: "Các lời chào phổ biến nhất bao gồm: 'Hello' (thông dụng nhất), 'Hi' (thân mật), 'Good morning' (chào buổi sáng), 'Good afternoon' (chào buổi chiều), và 'Good evening' (chào buổi tối)." },
        { type: 'paragraph', text: "Khi tạm biệt, chúng ta thường dùng 'Goodbye' hoặc 'See you later'. Khi gặp ai đó lần đầu tiên, câu chào lịch sự thường là 'Nice to meet you'." },
      ],
      changeSummary: 'Provisioned sample A1 curriculum content',
      expectedRowVersion: fixture.state.lessons.get(l1Id).rowVersion.toString(),
      exercises: [
        {
          position: 1, isCore: true, type: 'MCQ',
          promptData: { prompt: 'Từ nào sau đây dùng để chào một người vào buổi sáng?', options: [{ id: 'opt-1-1', text: 'Good morning' }, { id: 'opt-1-2', text: 'Good night' }, { id: 'opt-1-3', text: 'Goodbye' }] },
          gradingData: { correctOptionId: 'opt-1-1' },
          feedbackData: { explanation: "'Good morning' có nghĩa là chào buổi sáng, được dùng từ lúc thức dậy đến khoảng 12 giờ trưa." },
        },
        {
          position: 2, isCore: true, type: 'FILL_BLANK',
          promptData: { prompt: 'Điền từ còn thiếu vào câu chào lịch sự khi lần đầu gặp mặt:', sentence: 'Nice to ____ you.' },
          gradingData: { acceptedAnswers: ['meet', 'see'], caseSensitive: false },
          feedbackData: { explanation: "'Nice to meet you' có nghĩa là 'Rất vui được gặp bạn', là mẫu câu chuẩn mực khi làm quen." },
        },
        {
          position: 3, isCore: true, type: 'REORDER',
          promptData: { prompt: 'Sắp xếp các từ sau thành câu hỏi thăm sức khỏe thông dụng:', tokens: [{ id: 't1', text: 'How' }, { id: 't2', text: 'are' }, { id: 't3', text: 'you?' }] },
          gradingData: { correctOrder: ['t1', 't2', 't3'] },
          feedbackData: { explanation: "'How are you?' là câu hỏi 'Bạn có khỏe không?' theo đúng trật tự từ trong tiếng Anh." },
        },
      ],
      vocabulary: [
        { position: 1, isCore: true, create: { canonicalForm: 'Hello', senseKey: 'greeting', phonetic: 'həˈləʊ', partOfSpeech: 'interjection', meaningLabels: { vi: 'Xin chào', en: 'Greeting' }, example: 'Hello, my name is John.' } },
        { position: 2, isCore: true, create: { canonicalForm: 'Morning', senseKey: 'time-of-day', phonetic: 'ˈmɔː.nɪŋ', partOfSpeech: 'noun', meaningLabels: { vi: 'Buổi sáng', en: 'The early part of the day' }, example: 'Good morning, how are you?' } },
        { position: 3, isCore: true, create: { canonicalForm: 'Goodbye', senseKey: 'farewell', phonetic: 'ɡʊdˈbaɪ', partOfSpeech: 'interjection', meaningLabels: { vi: 'Tạm biệt', en: 'Farewell' }, example: 'Goodbye, see you tomorrow.' } },
      ],
    }, fixture.db);

    const initialDraftRevId = draftRes.data.data.highestRevision.id;
    assert.equal(fixture.state.revisions.get(initialDraftRevId).status, 'DRAFT');

    // Run provisioner: should resume draft without creating a new revision
    const result = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result.alreadyProvisioned, false);
    assert.equal(result.lessonIds.length, 3);

    // Verify Lesson 1 still uses initialDraftRevId (now PUBLISHED, not a successor)
    const l1After = fixture.state.lessons.get(l1Id);
    assert.equal(l1After.activeRevisionId, initialDraftRevId);
    assert.equal(fixture.state.revisions.get(initialDraftRevId).status, 'PUBLISHED');
    assert.equal(fixture.state.revisions.get(initialDraftRevId).revisionNo, 1);
  });

  test('R2: activates PUBLISHED+PLANNED lesson with no new revision', async () => {
    // Run provision once
    const result1 = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result1.alreadyProvisioned, false);

    const l1Id = result1.lessonIds[0];
    const l1 = fixture.state.lessons.get(l1Id);
    l1.availability = 'PLANNED';

    const revCountBefore = fixture.state.revisions.size;
    const l1ActiveRevBefore = l1.activeRevisionId;

    // Run provision again: should activate lesson 1 with NO new revisions
    const result2 = await provisionSampleA1Curriculum(fixture.db, { adminId, teacherId });
    assert.equal(result2.alreadyProvisioned, false);
    assert.equal(result2.lessonIds.length, 3);

    const l1After = fixture.state.lessons.get(l1Id);
    assert.equal(l1After.availability, 'AVAILABLE');
    assert.equal(l1After.activeRevisionId, l1ActiveRevBefore);
    assert.equal(fixture.state.revisions.size, revCountBefore);
  });
});
