import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import pkg from 'pg';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import { validateOwnedDatabaseUrl } from '../../../scripts/test-guard-utils.mjs';
import {
  installNetworkGuard,
  assertNoForbiddenOutbound,
} from '../../../scripts/test-network-guard.mjs';
import {
  assignLesson,
  getTeacherLessonDetail,
  toTeacherLessonDetailDto,
  saveTeacherLessonDraft,
  evaluateEditability,
} from '../../src/server/lessons/index.ts';
import {
  submitTeacherLesson,
  getReviewDetail,
  approveReview,
  publishReview,
} from '../../src/server/lessons/workflow.ts';
import { loadLearnerLessonDetail } from '../../../lingora-web/src/server/lessons/service.ts';
import { setLearnerPrismaForTest } from '../../../lingora-web/src/server/db/index.ts';
import { parsePersistedLessonContent } from '@lingora/lesson-content';

const { Client } = pkg;

const guard = validateOwnedDatabaseUrl();
const databaseUrl = guard.ownedUrl;
const pgPort = Number(guard.parsedUrl.port || 5432);

installNetworkGuard({ allowedPorts: [pgPort] });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: [],
});

let pgClient;

const testTeacherId = '11111111-1111-4111-8111-111111111111';
const testAdminId = '00000000-0000-4000-8000-000000000001';
const testLearnerId = '22222222-2222-4222-8222-222222222222';

let unitId;
let courseId;
let contextId;

before(async () => {
  await prisma.$connect();
  setLearnerPrismaForTest(prisma);
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await seed(prisma);

  // Setup test unit and course context
  const unit = await prisma.unit.findFirst({
    include: { course: true },
  });
  assert.ok(unit, 'Seeded unit must exist');
  unitId = unit.id;
  courseId = unit.courseId;

  // Ensure test accounts exist in auth.users and app.accounts
  await pgClient.query(`
    INSERT INTO auth.users (id, email) VALUES
      ('${testTeacherId}', 'teacher.test@lingora.test'),
      ('${testAdminId}', 'admin.test@lingora.test'),
      ('${testLearnerId}', 'learner.test@lingora.test')
    ON CONFLICT (id) DO NOTHING;
  `);

  await pgClient.query(`
    INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
    VALUES
      ('${testTeacherId}', 'TEACHER', 'ACTIVE', 'Test Teacher', 'vi', NOW(), NOW()),
      ('${testAdminId}', 'ADMIN', 'ACTIVE', 'Test Admin', 'vi', NOW(), NOW()),
      ('${testLearnerId}', 'LEARNER', 'ACTIVE', 'Test Learner', 'vi', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `);

  // Ensure learning context exists for learner
  const existingContext = await prisma.learningContext.findFirst({
    where: { learnerId: testLearnerId, courseId },
  });
  if (existingContext) {
    contextId = existingContext.id;
  } else {
    const level = await prisma.level.findFirst({
      where: { framework: { courses: { some: { id: courseId } } } },
    });
    assert.ok(level, 'Seeded level must exist');
    const ctx = await prisma.learningContext.create({
      data: {
        learnerId: testLearnerId,
        courseId,
        languageId: unit.course.languageId,
        startSource: 'DEFAULT',
        selectedStartLevelId: level.id,
        workingLevelId: level.id,
        status: 'ACTIVE',
      },
    });
    contextId = ctx.id;
  }
});

after(async () => {
  await prisma.$disconnect();
  await pgClient.end();
  assertNoForbiddenOutbound();
});

describe('T02: PostgreSQL DDL & Constraints on lesson_revisions.content_schema_version', () => {
  test('accepts content_schema_version = 0 and 1, rejects invalid values', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 991, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    // Create assignment
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    // 1. Accepts version 0
    await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V0"}', '[]', 0
      );
    `);

    // 2. Accepts version 1
    await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 2, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V1"}', '[]', 1
      );
    `);

    // 3. Rejects version 2
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_revisions (
            lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
            created_by, last_edited_by, title, content_blocks, content_schema_version
          ) VALUES (
            '${lessonId}', 3, '${assignmentId}', '${episodeId}',
            '${testTeacherId}', '${testTeacherId}', '{"vi":"V2"}', '[]', 2
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_revisions_content_schema_version_check/);
        return true;
      }
    );
  });
});

describe('T02: PostgreSQL DDL & Constraints on app.lesson_content_blocks', () => {
  let testRevisionId;

  before(async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 992, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"Block Test"}', '[]', 1
      )
      RETURNING id;
    `);
    testRevisionId = revRes.rows[0].id;
  });

  test('inserts all 9 valid canonical block types', async () => {
    const types = [
      'HEADING',
      'TEXT',
      'GRAMMAR',
      'EXAMPLE',
      'DIALOGUE',
      'CALLOUT',
      'MEDIA',
      'VOCABULARY',
      'DIVIDER',
    ];

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const pos = i + 1;
      const res = await pgClient.query(`
        INSERT INTO app.lesson_content_blocks (
          lesson_revision_id, block_key, type, position, schema_version, content
        ) VALUES (
          '${testRevisionId}', 'block-key-${type.toLowerCase()}', '${type}', ${pos}, 1, '{"sample": true}'
        )
        RETURNING id, type;
      `);
      assert.equal(res.rows[0].type, type);
    }
  });

  test('rejects invalid block type not in enum', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${testRevisionId}', 'invalid-type-key', 'INVALID_TYPE'::app.lesson_block_type, 100, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /invalid input value for enum/);
        return true;
      }
    );
  });

  test('rejects position <= 0 via CHECK constraint', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${testRevisionId}', 'negative-pos-key', 'TEXT', 0, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_content_blocks_position_check/);
        return true;
      }
    );
  });

  test('enforces UNIQUE (lesson_revision_id, block_key)', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${testRevisionId}', 'block-key-text', 'TEXT', 50, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_content_blocks_revision_block_key/);
        return true;
      }
    );
  });

  test('enforces UNIQUE (lesson_revision_id, position)', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${testRevisionId}', 'new-unique-key', 'TEXT', 1, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_content_blocks_revision_position_key/);
        return true;
      }
    );
  });

  test('rejects block_key exceeding 128 characters', async () => {
    const longKey = 'a'.repeat(129);
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${testRevisionId}', '${longKey}', 'TEXT', 99, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_content_blocks_block_key_length_check/);
        return true;
      }
    );
  });

  test('enforces foreign key to app.lesson_revisions', async () => {
    const fakeRevId = '00000000-0000-0000-0000-000000000999';
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.lesson_content_blocks (
            lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            '${fakeRevId}', 'orphaned-key', 'TEXT', 1, 1, '{}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /lesson_content_blocks_lesson_revision_id_fkey/);
        return true;
      }
    );
  });
});

describe('T02: PostgreSQL DDL & Constraints on app.revision_review_comments', () => {
  let testRevisionId;
  let testItemId;
  let testItemRevisionId;

  before(async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 993, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"Comment Test"}', '[]', 1
      )
      RETURNING id;
    `);
    testRevisionId = revRes.rows[0].id;

    // Create a practice item revision for item anchoring
    const itemRes = await pgClient.query(`
      INSERT INTO app.item_identities (origin, exact_fingerprint, created_by)
      VALUES ('PRACTICE', 'fp-test', '${testTeacherId}')
      RETURNING id;
    `);
    testItemId = itemRes.rows[0].id;

    const itemRevRes = await pgClient.query(`
      INSERT INTO app.item_revisions (
        item_id, revision_no, type, prompt_data, exact_fingerprint,
        created_by, creation_assignment_episode_id, authoring_lesson_revision_id
      ) VALUES (
        '${testItemId}', 1, 'MCQ', '{"prompt":"Q"}', 'fp-test',
        '${testTeacherId}', '${episodeId}', '${testRevisionId}'
      )
      RETURNING id;
    `);
    testItemRevisionId = itemRevRes.rows[0].id;
  });

  test('inserts valid revision-wide comment (both block_key and item_revision_id null)', async () => {
    const res = await pgClient.query(`
      INSERT INTO app.revision_review_comments (
        lesson_revision_id, author_account_id, body, status
      ) VALUES (
        '${testRevisionId}', '${testAdminId}', 'Revision-wide feedback', 'OPEN'
      )
      RETURNING id, status, block_key, item_revision_id;
    `);
    assert.equal(res.rows[0].status, 'OPEN');
    assert.equal(res.rows[0].block_key, null);
    assert.equal(res.rows[0].item_revision_id, null);
  });

  test('inserts valid block-anchored comment', async () => {
    const res = await pgClient.query(`
      INSERT INTO app.revision_review_comments (
        lesson_revision_id, block_key, author_account_id, body, status
      ) VALUES (
        '${testRevisionId}', 'target-block-1', '${testAdminId}', 'Block specific feedback', 'OPEN'
      )
      RETURNING id, block_key;
    `);
    assert.equal(res.rows[0].block_key, 'target-block-1');
  });

  test('inserts valid item-anchored comment', async () => {
    const res = await pgClient.query(`
      INSERT INTO app.revision_review_comments (
        lesson_revision_id, item_revision_id, author_account_id, body, status
      ) VALUES (
        '${testRevisionId}', '${testItemRevisionId}', '${testAdminId}', 'Item specific feedback', 'OPEN'
      )
      RETURNING id, item_revision_id;
    `);
    assert.equal(res.rows[0].item_revision_id, testItemRevisionId);
  });

  test('rejects comment having BOTH block_key AND item_revision_id', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.revision_review_comments (
            lesson_revision_id, block_key, item_revision_id, author_account_id, body, status
          ) VALUES (
            '${testRevisionId}', 'block-1', '${testItemRevisionId}', '${testAdminId}', 'Conflicting targets', 'OPEN'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /revision_review_comments_target_exclusive_check/);
        return true;
      }
    );
  });

  test('enforces status metadata invariant (OPEN must have null resolvedAt/resolvedBy)', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.revision_review_comments (
            lesson_revision_id, author_account_id, body, status, resolved_at, resolved_by_account_id
          ) VALUES (
            '${testRevisionId}', '${testAdminId}', 'Invalid OPEN comment', 'OPEN', NOW(), '${testAdminId}'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /revision_review_comments_(status|resolution)_check/);
        return true;
      }
    );
  });

  test('enforces status metadata invariant (RESOLVED must have non-null resolvedAt/resolvedBy)', async () => {
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.revision_review_comments (
            lesson_revision_id, author_account_id, body, status
          ) VALUES (
            '${testRevisionId}', '${testAdminId}', 'Invalid RESOLVED comment', 'RESOLVED'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /revision_review_comments_(status|resolution)_check/);
        return true;
      }
    );
  });

  test('inserts valid RESOLVED comment with complete resolution metadata', async () => {
    const res = await pgClient.query(`
      INSERT INTO app.revision_review_comments (
        lesson_revision_id, author_account_id, body, status, resolved_at, resolved_by_account_id
      ) VALUES (
        '${testRevisionId}', '${testAdminId}', 'Resolved issue', 'RESOLVED', NOW(), '${testTeacherId}'
      )
      RETURNING id, status, resolved_by_account_id;
    `);
    assert.equal(res.rows[0].status, 'RESOLVED');
    assert.equal(res.rows[0].resolved_by_account_id, testTeacherId);
  });

  test('rejects item_revision_id belonging to a DIFFERENT lesson revision', async () => {
    // Create an item revision on another lesson revision
    const otherLessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 994, 'PLANNED')
      RETURNING id;
    `);
    const otherLessonId = otherLessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${otherLessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const otherAssignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${otherAssignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const otherEpisodeId = histRes.rows[0].id;

    const otherRevRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${otherLessonId}', 1, '${otherAssignmentId}', '${otherEpisodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"Other"}', '[]', 1
      )
      RETURNING id;
    `);
    const otherRevId = otherRevRes.rows[0].id;

    const foreignItemRevRes = await pgClient.query(`
      INSERT INTO app.item_revisions (
        item_id, revision_no, type, prompt_data, exact_fingerprint,
        created_by, creation_assignment_episode_id, authoring_lesson_revision_id
      ) VALUES (
        '${testItemId}', 2, 'MCQ', '{"prompt":"Q2"}', 'fp-test-2',
        '${testTeacherId}', '${otherEpisodeId}', '${otherRevId}'
      )
      RETURNING id;
    `);
    const foreignItemRevId = foreignItemRevRes.rows[0].id;

    // Attaching foreignItemRevId to testRevisionId must fail FK constraint
    await assert.rejects(
      async () => {
        await pgClient.query(`
          INSERT INTO app.revision_review_comments (
            lesson_revision_id, item_revision_id, author_account_id, body, status
          ) VALUES (
            '${testRevisionId}', '${foreignItemRevId}', '${testAdminId}', 'Mismatched lesson revision item', 'OPEN'
          );
        `);
      },
      (err) => {
        assert.match(err.message, /revision_review_comments_item_authoring_lesson_fkey/);
        return true;
      }
    );
  });
});

describe('T02: Security Boundaries & Permissions on new tables', () => {
  test('RLS is ENABLED and FORCED on lesson_content_blocks', async () => {
    const res = await pgClient.query(`
      SELECT relrowsecurity, relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'lesson_content_blocks' AND n.nspname = 'app';
    `);
    assert.equal(res.rows[0].relrowsecurity, true);
    assert.equal(res.rows[0].relforcerowsecurity, true);
  });

  test('RLS is ENABLED and FORCED on revision_review_comments', async () => {
    const res = await pgClient.query(`
      SELECT relrowsecurity, relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'revision_review_comments' AND n.nspname = 'app';
    `);
    assert.equal(res.rows[0].relrowsecurity, true);
    assert.equal(res.rows[0].relforcerowsecurity, true);
  });
});

describe('T03: Real DB Legacy Adapter & Read Parity Integration', () => {
  test('V0 legacy revision with content_schema_version = 0 reads as adapted canonical blocks', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 995, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    const legacyParagraphs = [
      { type: 'paragraph', text: 'Chào mừng các bạn đến với bài học.' },
      { type: 'paragraph', text: 'Đây là đoạn văn thứ hai.' },
    ];

    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"Bài học cũ"}',
        '${JSON.stringify(legacyParagraphs)}', 0
      )
      RETURNING id;
    `);
    const revId = revRes.rows[0].id;

    // Read via Teacher Lesson Detail
    const teacherDetail = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(teacherDetail.status, 200);
    const dto = teacherDetail.data.data;

    assert.equal(dto.contentSchemaVersion, 0);
    assert.ok(Array.isArray(dto.blocks));
    assert.equal(dto.blocks.length, 2);
    assert.equal(dto.blocks[0].type, 'TEXT');
    assert.equal(dto.blocks[0].blockKey, `legacy:${revId}:paragraph:0`);
    assert.equal(dto.blocks[1].blockKey, `legacy:${revId}:paragraph:1`);

    // Verify presentation DTO is built cleanly
    assert.ok(dto.presentation);
    assert.equal(dto.presentation.contentSchemaVersion, 0);
    assert.equal(dto.presentation.blocks.length, 2);

    // Verify backward compatibility: legacy contentBlocks format preserved in currentDraft
    assert.ok(dto.currentDraft);
    assert.deepEqual(dto.currentDraft.contentBlocks, legacyParagraphs);

    const declaredV1WithoutBlocks = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Không được lưu nhầm định dạng V0' },
        expectedRowVersion: '1',
        expectedRevisionId: revId,
      },
      prisma
    );
    assert.equal(declaredV1WithoutBlocks.status, 400);
    assert.equal(declaredV1WithoutBlocks.error?.code, 'CONTENT_SCHEMA_VERSION_MISMATCH');

    const declaredV1WithLegacyBlocks = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Không gửi paragraphs dưới dạng V1' },
        contentBlocks: legacyParagraphs,
        expectedRowVersion: '1',
        expectedRevisionId: revId,
      },
      prisma
    );
    assert.equal(declaredV1WithLegacyBlocks.status, 400);

    const revisionCount = await pgClient.query(`
      SELECT COUNT(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${lessonId}'
    `);
    assert.equal(revisionCount.rows[0].count, 1, 'Rejected schema mismatches must not append a revision');
  });

  test('V1 zero-block revision does NOT fall back to legacy contentBlocks', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 996, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    // Revision with content_schema_version = 1, NO block rows, and empty or stray legacy contentBlocks
    await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V1 Zero Blocks"}',
        '[{"type":"paragraph","text":"Stray text that must not be used"}]', 1
      );
    `);

    const teacherDetail = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(teacherDetail.status, 200);
    const dto = teacherDetail.data.data;

    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 0, 'Zero-block V1 revision must have 0 blocks, never fallback to content_blocks');
    assert.equal(dto.currentDraft.blocks.length, 0);
    assert.equal(dto.currentDraft.contentBlocks.length, 0);
  });

  test('V1 revision with canonical block rows reads all blocks in position order', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 997, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V1 Rich Lesson"}', '[]', 1
      )
      RETURNING id;
    `);
    const revId = revRes.rows[0].id;

    // Insert 3 blocks in reverse position order
    await pgClient.query(`
      INSERT INTO app.lesson_content_blocks (lesson_revision_id, block_key, type, position, schema_version, content)
      VALUES
        ('${revId}', 'block-ex', 'EXAMPLE', 3, 1, '{"text": "Je suis fatigué", "translation": "Tôi mệt"}'),
        ('${revId}', 'block-h', 'HEADING', 1, 1, '{"level": 2, "text": "Mục tiêu bài học"}'),
        ('${revId}', 'block-txt', 'TEXT', 2, 1, '{"nodes": [{"type": "paragraph", "runs": [{"text": "Nội dung chính"}]}]}');
    `);

    // Add review comment
    await pgClient.query(`
      INSERT INTO app.revision_review_comments (
        lesson_revision_id, block_key, author_account_id, body, status
      ) VALUES (
        '${revId}', 'block-h', '${testAdminId}', 'Tiêu đề cần rõ nghĩa hơn', 'OPEN'
      );
    `);

    const teacherDetail = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(teacherDetail.status, 200);
    const dto = teacherDetail.data.data;

    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 3);
    // Verified sorted by position
    assert.equal(dto.blocks[0].type, 'HEADING');
    assert.equal(dto.blocks[0].position, 1);
    assert.equal(dto.blocks[1].type, 'TEXT');
    assert.equal(dto.blocks[1].position, 2);
    assert.equal(dto.blocks[2].type, 'EXAMPLE');
    assert.equal(dto.blocks[2].position, 3);

    // Verify reviewComments included in TeacherLessonDetailDto
    assert.ok(Array.isArray(dto.reviewComments));
    assert.equal(dto.reviewComments.length, 1);
    assert.equal(dto.reviewComments[0].blockKey, 'block-h');
    assert.equal(dto.reviewComments[0].body, 'Tiêu đề cần rõ nghĩa hơn');
    assert.equal(dto.reviewComments[0].status, 'OPEN');
  });

  test('V1 predecessor rejects legacy paragraph save and marks draft uneditable (Finding 1)', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 998, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V1 Locked from Legacy"}', '[]', 1
      )
      RETURNING id;
    `);
    const revId = revRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.lesson_content_blocks (lesson_revision_id, block_key, type, position, schema_version, content)
      VALUES ('${revId}', 'block-h1', 'HEADING', 1, 1, '{"level": 2, "text": "Đầu trang V1"}');
    `);

    // 1. Verify evaluateEditability returns isEditable: true for valid supported V1 draft
    const teacherDetail = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(teacherDetail.status, 200);
    assert.equal(teacherDetail.data.data.isEditable, true);

    // 2. Verify legacy saveTeacherLessonDraft is blocked with 409 LEGACY_SAVE_FORBIDDEN_ON_V1
    const saveRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Hacked Title' },
        contentBlocks: [{ type: 'paragraph', text: 'Overwritten text' }],
        expectedRowVersion: '1',
      },
      prisma
    );
    assert.equal(saveRes.status, 409);
    assert.equal(saveRes.error?.code, 'LEGACY_SAVE_FORBIDDEN_ON_V1');

    // 3. Verify database was NOT modified (no successor revision created, block rows intact)
    const revCountRes = await pgClient.query(`
      SELECT COUNT(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${lessonId}'
    `);
    assert.equal(revCountRes.rows[0].count, 1);

    const blockRes = await pgClient.query(`
      SELECT block_key, type FROM app.lesson_content_blocks WHERE lesson_revision_id = '${revId}'
    `);
    assert.equal(blockRes.rows.length, 1);
    assert.equal(blockRes.rows[0].block_key, 'block-h1');
    assert.equal(blockRes.rows[0].type, 'HEADING');

    // 4. Verify editability checks content only after a valid DRAFT fixture.
    const validLegacyDraft = {
      status: 'DRAFT',
      contentSchemaVersion: 0,
      title: { vi: 'Tiêu đề' },
      contentBlocks: [],
    };
    assert.equal(evaluateEditability(validLegacyDraft).isEditable, true);

    const malformed1 = evaluateEditability({
      ...validLegacyDraft,
      contentBlocks: 'not-an-array',
    });
    assert.equal(malformed1.isEditable, false);
    assert.match(malformed1.editabilityReason, /Cấu trúc tiêu đề hoặc nội dung/);

    const malformed2 = evaluateEditability({
      ...validLegacyDraft,
      contentBlocks: [{ type: 'unsupported_custom_type' }],
    });
    assert.equal(malformed2.isEditable, false);
    assert.match(malformed2.editabilityReason, /Cấu trúc tiêu đề hoặc nội dung/);
  });

  test('Submit rejects malformed persisted V1 blocks without mutating workflow state', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 989, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const historyRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = historyRes.rows[0].id;

    const revisionRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"V1 lỗi"}', '[]', 1
      )
      RETURNING id;
    `);
    const revisionId = revisionRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.lesson_content_blocks (lesson_revision_id, block_key, type, position, schema_version, content)
      VALUES ('${revisionId}', 'bad-heading', 'HEADING', 1, 1, '{"unexpected":true}');
    `);

    const submitRes = await submitTeacherLesson(
      testTeacherId,
      lessonId,
      {
        revisionId,
        expectedLessonRowVersion: '1',
        expectedRevisionRowVersion: '1',
      },
      prisma
    );
    assert.equal(submitRes.status, 400);
    assert.equal(submitRes.error?.code, 'UNSUPPORTED_DRAFT_CONTENT');

    const stateRes = await pgClient.query(`
      SELECT status, row_version, submitted_at
      FROM app.lesson_revisions
      WHERE id = '${revisionId}';
    `);
    assert.equal(stateRes.rows[0].status, 'DRAFT');
    assert.equal(stateRes.rows[0].row_version, '1');
    assert.equal(stateRes.rows[0].submitted_at, null);

    const eventRes = await pgClient.query(`
      SELECT COUNT(*)::int AS count
      FROM app.revision_reviews
      WHERE lesson_revision_id = '${revisionId}';
    `);
    assert.equal(eventRes.rows[0].count, 0);
  });

  test('Cross-role Read Parity: Teacher, Admin Review, and Learner receive uniform V1 content (Finding 2)', async () => {
    // 1. Create Planned Lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, is_required, availability)
      VALUES ('${unitId}', 999, false, 'PLANNED')
      RETURNING id;
    `);
    const lessonId = lessonRes.rows[0].id;

    // 2. Create Assignment & Episode
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    const histRes = await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
      RETURNING id;
    `);
    const episodeId = histRes.rows[0].id;

    // 3. Create Item & ItemRevision (Practice MCQ)
    const itemRes = await pgClient.query(`
      INSERT INTO app.item_identities (origin, exact_fingerprint, created_by)
      VALUES ('PRACTICE', 'fp-parity-test', '${testTeacherId}')
      RETURNING id;
    `);
    const itemId = itemRes.rows[0].id;

    // Insert Revision
    const revRes = await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        created_by, last_edited_by, title, content_blocks, content_schema_version
      ) VALUES (
        '${lessonId}', 1, '${assignmentId}', '${episodeId}',
        '${testTeacherId}', '${testTeacherId}', '{"vi":"Bài học ngữ pháp V1"}', '[]', 1
      )
      RETURNING id;
    `);
    const revId = revRes.rows[0].id;

    const itemRevRes = await pgClient.query(`
      INSERT INTO app.item_revisions (
        item_id, revision_no, type, prompt_data, schema_version, exact_fingerprint,
        authoring_lesson_revision_id, created_by, creation_assignment_episode_id
      ) VALUES (
        '${itemId}', 1, 'MCQ',
        '{"prompt":"Chọn đáp án đúng","options":[{"id":"opt-1","text":"A"},{"id":"opt-2","text":"B"}]}',
        1, 'fp-parity-test', '${revId}', '${testTeacherId}', '${episodeId}'
      )
      RETURNING id;
    `);
    const itemRevId = itemRevRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app_private.item_grading_secrets (
        item_revision_id, grading_data
      ) VALUES (
        '${itemRevId}', '{"correctOptionId":"opt-1"}'
      );
    `);

    // 4. Insert Core Exercise Link
    await pgClient.query(`
      INSERT INTO app.lesson_exercises (
        lesson_revision_id, item_id, item_revision_id, position, is_core
      ) VALUES (
        '${revId}', '${itemId}', '${itemRevId}', 1, true
      );
    `);

    // 5. Create Vocabulary Concept & Link
    const vocabRes = await pgClient.query(`
      INSERT INTO app.vocabulary_concepts (
        language_id, canonical_form, sense_key, normalized_form, meaning_labels, created_by
      ) VALUES (
        (SELECT language_id FROM app.courses WHERE id = '${courseId}'),
        'pomme', 'default', 'pomme', '{"vi":"quả táo"}', '${testTeacherId}'
      )
      RETURNING id;
    `);
    const vocabId = vocabRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.lesson_vocabulary_links (
        lesson_revision_id, vocabulary_id, position, is_core, display_snapshot
      ) VALUES (
        '${revId}', '${vocabId}', 1, true,
        '{"schemaVersion":1,"languageId":"00000000-0000-0000-0000-000000000001","canonicalForm":"pomme","senseKey":"default","meaningLabels":{"vi":"quả táo"}}'
      );
    `);

    // 6. Insert 3 Canonical Content Blocks
    await pgClient.query(`
      INSERT INTO app.lesson_content_blocks (lesson_revision_id, block_key, type, position, schema_version, content)
      VALUES
        ('${revId}', 'b-h1', 'HEADING', 1, 1, '{"level": 2, "text": "Bài học ngữ pháp V1"}'),
        ('${revId}', 'b-txt', 'TEXT', 2, 1, '{"nodes": [{"type": "paragraph", "runs": [{"text": "Đây là đoạn văn bản V1."}]}]}'),
        ('${revId}', 'b-ex', 'EXAMPLE', 3, 1, '{"text": "Je mange une pomme", "translation": "Tôi ăn một quả táo"}');
    `);

    // --- Role 1: Teacher Service ---
    const teacherDetail = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(teacherDetail.status, 200);
    const teacherDto = teacherDetail.data.data;

    assert.equal(teacherDto.contentSchemaVersion, 1);
    assert.equal(teacherDto.blocks.length, 3);
    assert.equal(teacherDto.blocks[0].type, 'HEADING');
    assert.equal(teacherDto.blocks[1].type, 'TEXT');
    assert.equal(teacherDto.blocks[2].type, 'EXAMPLE');
    assert.equal(teacherDto.currentDraft.contentBlocks.length, 3, 'Teacher currentDraft must have projected paragraphs');
    assert.equal(teacherDto.currentDraft.contentBlocks[0].text, 'Bài học ngữ pháp V1');
    assert.equal(teacherDto.isEditable, true);

    // --- Role 2: Submit & Admin Review Service ---
    const submitRes = await submitTeacherLesson(
      testTeacherId,
      lessonId,
      {
        revisionId: revId,
        expectedLessonRowVersion: '1',
        expectedRevisionRowVersion: '1',
      },
      prisma
    );
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const adminReviewRes = await getReviewDetail(testAdminId, submissionId, prisma);
    assert.equal(adminReviewRes.status, 200);
    const adminDto = adminReviewRes.data.data;

    assert.equal(adminDto.revision.contentSchemaVersion, 1);
    assert.equal(adminDto.revision.blocks.length, 3);
    assert.equal(adminDto.revision.contentBlocks.length, 3, 'Admin review must receive projected legacy paragraphs, NOT empty array');
    assert.equal(adminDto.revision.contentBlocks[0].text, 'Bài học ngữ pháp V1');
    assert.equal(adminDto.revision.contentBlocks[1].text, 'Đây là đoạn văn bản V1.');
    assert.equal(adminDto.revision.contentBlocks[2].text, 'Je mange une pomme (Tôi ăn một quả táo)');
    assert.equal(adminDto.revision.presentation.blocks.length, 3);

    // --- Role 3: Admin Approves & Publishes -> Learner Service ---
    const approveRes = await approveReview(
      testAdminId,
      submissionId,
      { expectedRevisionRowVersion: '2' },
      prisma
    );
    assert.equal(approveRes.status, 200);

    const publishRes = await publishReview(
      testAdminId,
      submissionId,
      { expectedRevisionRowVersion: '3', expectedLessonRowVersion: '2', makeAvailable: true },
      prisma
    );
    assert.equal(publishRes.status, 200);

    const learnerDto = await loadLearnerLessonDetail(contextId, lessonId, testLearnerId);
    assert.equal(learnerDto.revision.contentSchemaVersion, 1);
    assert.equal(learnerDto.revision.blocks.length, 3);
    assert.equal(learnerDto.revision.contentBlocks.length, 3, 'Learner must receive projected legacy paragraphs, NOT empty array');
    assert.equal(learnerDto.revision.contentBlocks[0].text, 'Bài học ngữ pháp V1');
    assert.equal(learnerDto.revision.presentation.blocks.length, 3);
    assert.equal(learnerDto.exercises.length, 1);
    assert.equal('gradingData' in learnerDto.exercises[0], false, 'Learner exercise must not contain gradingData');

    // --- Read Parity Invariants across all 3 roles ---
    assert.deepEqual(teacherDto.blocks, adminDto.revision.blocks);
    assert.deepEqual(adminDto.revision.blocks, learnerDto.revision.blocks);
    assert.deepEqual(teacherDto.currentDraft.contentBlocks, adminDto.revision.contentBlocks);
    assert.deepEqual(adminDto.revision.contentBlocks, learnerDto.revision.contentBlocks);
  });
});

describe('T04: Real Snapshot Save with Canonical Block Rows', () => {
  let lessonId;
  let rev1Id;

  test('saves initial V1 draft with canonical blocks on planned lesson', async () => {
    // 1. Create fresh planned lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 1001, 'PLANNED')
      RETURNING id;
    `);
    lessonId = lessonRes.rows[0].id;

    // 2. Create Assignment & Episode
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    // 3. Save initial draft with contentSchemaVersion: 1 and 4 canonical blocks
    const saveRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học V1 Đầu Tiên' },
        blocks: [
          {
            blockKey: 'block-h1',
            type: 'HEADING',
            position: 1,
            schemaVersion: 1,
            content: { level: 2, text: 'Phần mở đầu' },
          },
          {
            blockKey: 'block-txt1',
            type: 'TEXT',
            position: 2,
            schemaVersion: 1,
            content: {
              nodes: [
                {
                  type: 'paragraph',
                  runs: [{ text: 'Chào mừng các bạn đến với Lingora.' }],
                },
              ],
            },
          },
          {
            blockKey: 'block-ex1',
            type: 'EXAMPLE',
            position: 3,
            schemaVersion: 1,
            content: {
              text: 'Bonjour le monde',
              translation: 'Xin chào thế giới',
            },
          },
          {
            blockKey: 'block-div1',
            type: 'DIVIDER',
            position: 4,
            schemaVersion: 1,
            content: {},
          },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );

    assert.equal(saveRes.status, 200, `Expected 200, got ${saveRes.status}: ${JSON.stringify(saveRes.error)}`);
    const dto = saveRes.data.data;

    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 4);
    assert.equal(dto.blocks[0].blockKey, 'block-h1');
    assert.equal(dto.blocks[1].blockKey, 'block-txt1');
    assert.equal(dto.blocks[2].blockKey, 'block-ex1');
    assert.equal(dto.blocks[3].blockKey, 'block-div1');
    assert.equal(dto.currentDraft.contentBlocks.length, 3, 'Must project 3 legacy paragraphs');
    assert.equal(dto.currentDraft.contentBlocks[0].text, 'Phần mở đầu');

    rev1Id = dto.highestRevision.id;

    // Verify directly in PostgreSQL
    const revRes = await pgClient.query(`
      SELECT * FROM app.lesson_revisions WHERE id = '${rev1Id}'
    `);
    assert.equal(revRes.rows.length, 1);
    assert.equal(revRes.rows[0].content_schema_version, 1);
    assert.equal(revRes.rows[0].revision_no, 1);
    assert.equal(revRes.rows[0].prior_revision_id, null);

    const blockRows = await pgClient.query(`
      SELECT block_key, type, position, schema_version
      FROM app.lesson_content_blocks
      WHERE lesson_revision_id = '${rev1Id}'
      ORDER BY position ASC
    `);
    assert.equal(blockRows.rows.length, 4);
    assert.equal(blockRows.rows[0].block_key, 'block-h1');
    assert.equal(blockRows.rows[1].block_key, 'block-txt1');
    assert.equal(blockRows.rows[2].block_key, 'block-ex1');
    assert.equal(blockRows.rows[3].block_key, 'block-div1');

    const lessonRow = await pgClient.query(`
      SELECT row_version FROM app.lessons WHERE id = '${lessonId}'
    `);
    assert.equal(lessonRow.rows[0].row_version.toString(), '2');
  });

  test('saves successor V1 draft with append-only block snapshot and predecessor immutability', async () => {
    // Save successor (revision 2) modifying blocks and adding a new one
    const saveRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học V1 Đã Sửa Đổi' },
        blocks: [
          {
            blockKey: 'block-h1',
            type: 'HEADING',
            position: 1,
            schemaVersion: 1,
            content: { level: 2, text: 'Phần mở đầu (Cập nhật)' },
          },
          {
            blockKey: 'block-callout',
            type: 'CALLOUT',
            position: 2,
            schemaVersion: 1,
            content: {
              tone: 'tip',
              document: {
                nodes: [
                  {
                    type: 'paragraph',
                    runs: [{ text: 'Mẹo phát âm: chú ý ngữ điệu.' }],
                  },
                ],
              },
            },
          },
          {
            blockKey: 'block-txt1',
            type: 'TEXT',
            position: 3,
            schemaVersion: 1,
            content: {
              nodes: [
                {
                  type: 'paragraph',
                  runs: [{ text: 'Chào mừng các bạn đến với Lingora.' }],
                },
              ],
            },
          },
          {
            blockKey: 'block-ex1',
            type: 'EXAMPLE',
            position: 4,
            schemaVersion: 1,
            content: {
              text: 'Bonjour le monde',
              translation: 'Xin chào thế giới',
            },
          },
          {
            blockKey: 'block-div1',
            type: 'DIVIDER',
            position: 5,
            schemaVersion: 1,
            content: {},
          },
        ],
        expectedRowVersion: '2',
        expectedRevisionId: rev1Id,
      },
      prisma
    );

    assert.equal(saveRes.status, 200, `Expected 200, got ${saveRes.status}: ${JSON.stringify(saveRes.error)}`);
    const dto = saveRes.data.data;
    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 5);
    const rev2Id = dto.highestRevision.id;
    assert.notEqual(rev2Id, rev1Id);

    // Predecessor Immutability: Rev 1's block rows MUST be completely unmodified!
    const predBlocks = await pgClient.query(`
      SELECT block_key, type, position, content
      FROM app.lesson_content_blocks
      WHERE lesson_revision_id = '${rev1Id}'
      ORDER BY position ASC
    `);
    assert.equal(predBlocks.rows.length, 4, 'Predecessor must retain exactly 4 blocks');
    assert.equal(predBlocks.rows[0].block_key, 'block-h1');
    assert.equal(predBlocks.rows[0].position, 1);
    assert.equal(predBlocks.rows[0].content.text, 'Phần mở đầu', 'Predecessor content must NOT be overwritten');
    assert.equal(predBlocks.rows[1].block_key, 'block-txt1');
    assert.equal(predBlocks.rows[1].position, 2);

    // Successor: Rev 2 has its own 5 block rows
    const succBlocks = await pgClient.query(`
      SELECT block_key, type, position, content
      FROM app.lesson_content_blocks
      WHERE lesson_revision_id = '${rev2Id}'
      ORDER BY position ASC
    `);
    assert.equal(succBlocks.rows.length, 5, 'Successor must have 5 blocks');
    assert.equal(succBlocks.rows[0].block_key, 'block-h1');
    assert.equal(succBlocks.rows[0].content.text, 'Phần mở đầu (Cập nhật)');
    assert.equal(succBlocks.rows[1].block_key, 'block-callout');
    assert.equal(succBlocks.rows[2].block_key, 'block-txt1');
    assert.equal(succBlocks.rows[2].position, 3);

    // Revisions lineage
    const rev2Row = await pgClient.query(`
      SELECT revision_no, prior_revision_id, content_schema_version FROM app.lesson_revisions WHERE id = '${rev2Id}'
    `);
    assert.equal(rev2Row.rows[0].revision_no, 2);
    assert.equal(rev2Row.rows[0].prior_revision_id, rev1Id);
    assert.equal(rev2Row.rows[0].content_schema_version, 1);
  });

  test('validates and rejects invalid V1 save requests without modifying DB', async () => {
    // 1. Missing expectedRevisionId in V1
    const resNoExpectedRev = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Tiêu đề' },
        blocks: [],
        expectedRowVersion: '3',
      },
      prisma
    );
    assert.equal(resNoExpectedRev.status, 400);
    assert.equal(resNoExpectedRev.error?.code, 'VALIDATION_ERROR');

    // 2. Both blocks and contentBlocks supplied
    const resBoth = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Tiêu đề' },
        blocks: [],
        contentBlocks: [{ type: 'paragraph', text: 'illegal' }],
        expectedRowVersion: '3',
        expectedRevisionId: rev1Id,
      },
      prisma
    );
    assert.equal(resBoth.status, 400);
    assert.equal(resBoth.error?.code, 'VALIDATION_ERROR');

    // 3. Duplicate blockKey within blocks
    const resDupKey = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Tiêu đề' },
        blocks: [
          { blockKey: 'dup-key', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H1' } },
          { blockKey: 'dup-key', type: 'HEADING', position: 2, schemaVersion: 1, content: { level: 3, text: 'H2' } },
        ],
        expectedRowVersion: '3',
        expectedRevisionId: rev1Id,
      },
      prisma
    );
    assert.equal(resDupKey.status, 400);
    assert.equal(resDupKey.error?.code, 'VALIDATION_ERROR');

    // 4. Duplicate position within blocks
    const resDupPos = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Tiêu đề' },
        blocks: [
          { blockKey: 'k1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H1' } },
          { blockKey: 'k2', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 3, text: 'H2' } },
        ],
        expectedRowVersion: '3',
        expectedRevisionId: rev1Id,
      },
      prisma
    );
    assert.equal(resDupPos.status, 400);
    assert.equal(resDupPos.error?.code, 'VALIDATION_ERROR');

    // 5. Wrong expectedRevisionId (does not match highest revision)
    const resConflict = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Tiêu đề' },
        blocks: [],
        expectedRowVersion: '3',
        expectedRevisionId: '00000000-0000-0000-0000-000000000000',
      },
      prisma
    );
    assert.equal(resConflict.status, 409);
    assert.equal(resConflict.error?.code, 'REVISION_CONFLICT');
  });

  test('preserves predecessor exercises and vocabulary snapshots across V1 successor saves', async () => {
    // 1. Create fresh planned lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 2005, 'PLANNED')
      RETURNING id;
    `);
    const lId = lessonRes.rows[0].id;

    // 2. Assignment & Episode
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${lId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const aId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${aId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    // 3. Save Rev 1 with blocks, exercises, and vocabulary
    const r1 = await saveTeacherLessonDraft(
      testTeacherId,
      lId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học Đa Thành Phần' },
        blocks: [
          { blockKey: 'b1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Tiêu đề' } },
        ],
        exercises: [
          {
            type: 'MCQ',
            promptData: {
              prompt: 'Chọn từ đúng',
              options: [{ id: 'opt-1', text: 'Chat' }, { id: 'opt-2', text: 'Chien' }],
            },
            gradingData: { correctOptionId: 'opt-1' },
            position: 1,
            isCore: true,
          },
        ],
        vocabulary: [
          {
            create: {
              canonicalForm: 'chat',
              senseKey: 'default-cat',
              meaningLabels: { vi: 'con mèo', en: 'cat' },
            },
            position: 1,
            isCore: true,
          },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );

    assert.equal(r1.status, 200, `Expected 200, got: ${JSON.stringify(r1.error)}`);
    const r1RevId = r1.data.data.highestRevision.id;
    assert.equal(r1.data.data.blocks.length, 1);
    assert.equal(r1.data.data.exercises.length, 1);
    assert.equal(r1.data.data.vocabulary.length, 1);

    // 4. Save Rev 2 with exercises/vocabulary undefined (clone predecessor children)
    const r2 = await saveTeacherLessonDraft(
      testTeacherId,
      lId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học Đa Thành Phần (Cập nhật Khối)' },
        blocks: [
          { blockKey: 'b1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Tiêu đề' } },
          { blockKey: 'b2', type: 'DIVIDER', position: 2, schemaVersion: 1, content: {} },
        ],
        expectedRowVersion: '2',
        expectedRevisionId: r1RevId,
      },
      prisma
    );

    assert.equal(r2.status, 200, `Expected 200, got: ${JSON.stringify(r2.error)}`);
    const r2RevId = r2.data.data.highestRevision.id;
    assert.notEqual(r2RevId, r1RevId);
    assert.equal(r2.data.data.blocks.length, 2, 'Rev 2 must have 2 blocks');
    assert.equal(r2.data.data.exercises.length, 1, 'Rev 2 must have cloned predecessor exercise');
    assert.equal(r2.data.data.vocabulary.length, 1, 'Rev 2 must have cloned predecessor vocabulary link');
    assert.equal(r2.data.data.exercises[0].type, 'MCQ');
    assert.equal(r2.data.data.vocabulary[0].displaySnapshot.canonicalForm, 'chat');

    // 5. Save Rev 3 with exercises: [] and vocabulary: [] (explicit empty)
    const r3 = await saveTeacherLessonDraft(
      testTeacherId,
      lId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học Rỗng Bài Tập & Từ Vựng' },
        blocks: [
          { blockKey: 'b1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Tiêu đề' } },
        ],
        exercises: [],
        vocabulary: [],
        expectedRowVersion: '3',
        expectedRevisionId: r2RevId,
      },
      prisma
    );

    assert.equal(r3.status, 200, `Expected 200, got: ${JSON.stringify(r3.error)}`);
    assert.equal(r3.data.data.blocks.length, 1);
    assert.equal(r3.data.data.exercises.length, 0, 'Rev 3 exercises must be explicitly empty');
    assert.equal(r3.data.data.vocabulary.length, 0, 'Rev 3 vocabulary must be explicitly empty');
  });

  test('clones predecessor blocks when blocks is omitted (undefined) on V1 predecessor', async () => {
    const lRow = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lessonId}'`);
    const currentVersion = lRow.rows[0].row_version.toString();
    const highestRevRow = await pgClient.query(`
      SELECT id FROM app.lesson_revisions WHERE lesson_id = '${lessonId}' ORDER BY revision_no DESC LIMIT 1
    `);
    const currentHighestRevId = highestRevRow.rows[0].id;

    // Save successor draft omitting both blocks and contentBlocks
    const cloneRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Bài học kế thừa khối nội dung' },
        expectedRowVersion: currentVersion,
        expectedRevisionId: currentHighestRevId,
      },
      prisma
    );

    assert.equal(cloneRes.status, 200, `Expected 200, got: ${JSON.stringify(cloneRes.error)}`);
    const dto = cloneRes.data.data;
    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 5, 'Must clone all 5 blocks of predecessor');
    assert.equal(dto.blocks[0].blockKey, 'block-h1');
    assert.equal(dto.blocks[1].blockKey, 'block-callout');
    const rev3Id = dto.highestRevision.id;

    // Direct DB verification
    const rev3Row = await pgClient.query(`SELECT * FROM app.lesson_revisions WHERE id = '${rev3Id}'`);
    assert.equal(rev3Row.rows[0].content_schema_version, 1);
    assert.deepEqual(rev3Row.rows[0].content_blocks, []);

    const rev3Blocks = await pgClient.query(`
      SELECT block_key, type, position, schema_version
      FROM app.lesson_content_blocks
      WHERE lesson_revision_id = '${rev3Id}'
      ORDER BY position ASC
    `);
    assert.equal(rev3Blocks.rows.length, 5);
    assert.equal(rev3Blocks.rows[0].block_key, 'block-h1');
    assert.equal(rev3Blocks.rows[1].block_key, 'block-callout');
  });

  test('saves zero-block V1 revision when blocks is empty array []', async () => {
    const lRow = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lessonId}'`);
    const currentVersion = lRow.rows[0].row_version.toString();
    const highestRevRow = await pgClient.query(`
      SELECT id FROM app.lesson_revisions WHERE lesson_id = '${lessonId}' ORDER BY revision_no DESC LIMIT 1
    `);
    const currentHighestRevId = highestRevRow.rows[0].id;

    const zeroRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học 0 khối' },
        blocks: [],
        expectedRowVersion: currentVersion,
        expectedRevisionId: currentHighestRevId,
      },
      prisma
    );

    assert.equal(zeroRes.status, 200, `Expected 200, got: ${JSON.stringify(zeroRes.error)}`);
    const dto = zeroRes.data.data;
    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 0);
    const rev4Id = dto.highestRevision.id;

    // Direct DB check: 0 block rows, content_blocks = []
    const rev4Row = await pgClient.query(`SELECT * FROM app.lesson_revisions WHERE id = '${rev4Id}'`);
    assert.equal(rev4Row.rows[0].content_schema_version, 1);
    assert.deepEqual(rev4Row.rows[0].content_blocks, []);

    const rev4Blocks = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_content_blocks WHERE lesson_revision_id = '${rev4Id}'
    `);
    assert.equal(rev4Blocks.rows[0].count, 0, 'Zero block rows must be persisted for empty blocks []');
  });

  test('rejects legacy paragraph save on V1 predecessor with 409 LEGACY_SAVE_FORBIDDEN_ON_V1', async () => {
    const lRow = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lessonId}'`);
    const currentVersion = lRow.rows[0].row_version.toString();

    const legRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Cố tình lưu legacy' },
        contentBlocks: [{ type: 'paragraph', text: 'Legacy content' }],
        expectedRowVersion: currentVersion,
      },
      prisma
    );

    assert.equal(legRes.status, 409);
    assert.equal(legRes.error?.code, 'LEGACY_SAVE_FORBIDDEN_ON_V1');
  });
});

describe('T05: Real Concurrency & Immutability Verification', () => {
  test('simultaneous saves on same row_version resolve with one 200 and one 409 STALE_LESSON', async () => {
    // 1. Create fresh planned lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 1002, 'PLANNED')
      RETURNING id;
    `);
    const concurrencyLessonId = lessonRes.rows[0].id;

    // 2. Create Assignment & Episode
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${concurrencyLessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    // 3. Fire two concurrent save requests with the same expectedRowVersion = '1'
    const savePromise1 = saveTeacherLessonDraft(
      testTeacherId,
      concurrencyLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Concurrent Save Winner A' },
        blocks: [
          { blockKey: 'block-a', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Heading A' } },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );

    const savePromise2 = saveTeacherLessonDraft(
      testTeacherId,
      concurrencyLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Concurrent Save Winner B' },
        blocks: [
          { blockKey: 'block-b', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Heading B' } },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );

    const [res1, res2] = await Promise.all([savePromise1, savePromise2]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [200, 409], 'Exactly one save must succeed (200) and one must conflict (409)');

    const conflictRes = res1.status === 409 ? res1 : res2;
    assert.equal(conflictRes.error?.code, 'STALE_LESSON');

    // 4. Verify in PostgreSQL: exactly 1 revision row, exactly 1 block row, lesson row_version = 2
    const revCount = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${concurrencyLessonId}'
    `);
    assert.equal(revCount.rows[0].count, 1, 'Only one revision must exist in database');

    const blockCount = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_content_blocks
      WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = '${concurrencyLessonId}')
    `);
    assert.equal(blockCount.rows[0].count, 1, 'Only one block row must exist (no partial/orphan rows from aborted attempt)');

    const finalLesson = await pgClient.query(`
      SELECT row_version FROM app.lessons WHERE id = '${concurrencyLessonId}'
    `);
    assert.equal(finalLesson.rows[0].row_version.toString(), '2');
  });

  test('published immutability: saving successor draft on PUBLISHED lesson does not mutate published evidence', async () => {
    // 1. Create fresh planned lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 1003, 'PLANNED')
      RETURNING id;
    `);
    const pubLessonId = lessonRes.rows[0].id;

    // 2. Assignment & Episode
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${pubLessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    // 3. Save initial draft V1 with core exercise
    const draftRes = await saveTeacherLessonDraft(
      testTeacherId,
      pubLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bài học sẽ xuất bản' },
        blocks: [
          { blockKey: 'pub-h1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Tiêu đề xuất bản' } },
          { blockKey: 'pub-txt', type: 'TEXT', position: 2, schemaVersion: 1, content: { nodes: [{ type: 'paragraph', runs: [{ text: 'Nội dung bất biến.' }] }] } },
        ],
        exercises: [
          {
            type: 'MCQ',
            promptData: {
              prompt: 'Câu hỏi kiểm tra xuất bản',
              options: [
                { id: 'opt-1', text: 'Đáp án A' },
                { id: 'opt-2', text: 'Đáp án B' },
              ],
            },
            gradingData: {
              correctOptionId: 'opt-1',
            },
            position: 1,
            isCore: true,
          },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );
    assert.equal(draftRes.status, 200, `Draft save expected 200, got: ${JSON.stringify(draftRes.error)}`);
    const pubRevId = draftRes.data.data.highestRevision.id;

    // 4. Submit -> Approve -> Publish
    const submitRes = await submitTeacherLesson(
      testTeacherId,
      pubLessonId,
      { revisionId: pubRevId, expectedLessonRowVersion: '2', expectedRevisionRowVersion: '1' },
      prisma
    );
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const approveRes = await approveReview(
      testAdminId,
      submissionId,
      { expectedRevisionRowVersion: '2' },
      prisma
    );
    assert.equal(approveRes.status, 200);

    const publishRes = await publishReview(
      testAdminId,
      submissionId,
      { expectedRevisionRowVersion: '3', expectedLessonRowVersion: '3', makeAvailable: true },
      prisma
    );
    assert.equal(publishRes.status, 200);

    // Snapshot the published evidence in PostgreSQL before saving new draft
    const beforePubRev = await pgClient.query(`
      SELECT * FROM app.lesson_revisions WHERE id = '${pubRevId}'
    `);
    const beforePubBlocks = await pgClient.query(`
      SELECT * FROM app.lesson_content_blocks WHERE lesson_revision_id = '${pubRevId}' ORDER BY position
    `);
    assert.equal(beforePubRev.rows[0].status, 'PUBLISHED');
    assert.equal(beforePubBlocks.rows.length, 2);

    // Current Lesson row_version after publish is 4
    const lessonAfterPub = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${pubLessonId}'`);
    const currentVer = lessonAfterPub.rows[0].row_version.toString();

    // 5. Teacher saves a new draft successor on top of the published revision
    const newDraftRes = await saveTeacherLessonDraft(
      testTeacherId,
      pubLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bản nháp mới sau xuất bản' },
        blocks: [
          { blockKey: 'pub-h1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'Tiêu đề sửa đổi mới' } },
          { blockKey: 'pub-txt', type: 'TEXT', position: 2, schemaVersion: 1, content: { nodes: [{ type: 'paragraph', runs: [{ text: 'Nội dung cập nhật mới.' }] }] } },
          { blockKey: 'pub-ex', type: 'EXAMPLE', position: 3, schemaVersion: 1, content: { text: 'Exemple', translation: 'Ví dụ mới' } },
        ],
        expectedRowVersion: currentVer,
        expectedRevisionId: pubRevId,
      },
      prisma
    );
    assert.equal(newDraftRes.status, 200, `Expected 200, got: ${JSON.stringify(newDraftRes.error)}`);
    const newDraftRevId = newDraftRes.data.data.highestRevision.id;
    assert.notEqual(newDraftRevId, pubRevId);

    // 6. Direct byte/value verification: Published Rev 1 MUST NOT BE MUTATED
    const afterPubRev = await pgClient.query(`
      SELECT * FROM app.lesson_revisions WHERE id = '${pubRevId}'
    `);
    const afterPubBlocks = await pgClient.query(`
      SELECT * FROM app.lesson_content_blocks WHERE lesson_revision_id = '${pubRevId}' ORDER BY position
    `);

    assert.equal(afterPubRev.rows[0].status, 'PUBLISHED');
    assert.equal(afterPubRev.rows[0].revision_no, beforePubRev.rows[0].revision_no);
    assert.equal(afterPubRev.rows[0].published_by, beforePubRev.rows[0].published_by);
    assert.equal(afterPubRev.rows[0].published_at.toISOString(), beforePubRev.rows[0].published_at.toISOString());
    assert.deepEqual(afterPubRev.rows[0].title, beforePubRev.rows[0].title);
    assert.deepEqual(afterPubRev.rows[0].content_blocks, beforePubRev.rows[0].content_blocks);

    assert.equal(afterPubBlocks.rows.length, 2);
    assert.deepEqual(afterPubBlocks.rows[0].content, beforePubBlocks.rows[0].content);
    assert.deepEqual(afterPubBlocks.rows[1].content, beforePubBlocks.rows[1].content);

    // And new draft successor exists with status DRAFT and 3 blocks
    const newDraftRevRow = await pgClient.query(`
      SELECT revision_no, prior_revision_id, status FROM app.lesson_revisions WHERE id = '${newDraftRevId}'
    `);
    assert.equal(newDraftRevRow.rows[0].revision_no, 2);
    assert.equal(newDraftRevRow.rows[0].prior_revision_id, pubRevId);
    assert.equal(newDraftRevRow.rows[0].status, 'DRAFT');

    const newDraftBlocks = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_content_blocks WHERE lesson_revision_id = '${newDraftRevId}'
    `);
    assert.equal(newDraftBlocks.rows[0].count, 3);
  });

  test('concurrent save and reassignment serialize on Lesson.rowVersion', async () => {
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 1006, 'PLANNED')
      RETURNING id;
    `);
    const raceLessonId = lessonRes.rows[0].id;

    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${raceLessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    const teacherBId = '33333333-3333-4333-8333-333333333333';
    await pgClient.query(`
      INSERT INTO auth.users (id, email) VALUES ('${teacherBId}', 'teacherB@lingora.test') ON CONFLICT (id) DO NOTHING;
      INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
      VALUES ('${teacherBId}', 'TEACHER', 'ACTIVE', 'Teacher B', 'vi', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
    `);

    const savePromise = saveTeacherLessonDraft(
      testTeacherId,
      raceLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Save cạnh tranh với đổi phân công' },
        blocks: [
          { blockKey: 'race-b1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H1' } },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );
    const reassignPromise = assignLesson(
      testAdminId,
      courseId,
      unitId,
      raceLessonId,
      { teacherId: teacherBId, expectedRowVersion: '1' },
      prisma
    );

    const [saveRes, reassignRes] = await Promise.all([savePromise, reassignPromise]);
    assert.deepEqual([saveRes.status, reassignRes.status].sort(), [200, 409]);
    const conflictRes = saveRes.status === 409 ? saveRes : reassignRes;
    assert.equal(conflictRes.error?.code, 'STALE_LESSON');

    const [lessonState, assignmentState, historyState, revisionCount, blockCount] = await Promise.all([
      pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${raceLessonId}'`),
      pgClient.query(`SELECT current_teacher_id, scope_generation FROM app.content_assignments WHERE id = '${assignmentId}'`),
      pgClient.query(`SELECT next_teacher_id, scope_generation FROM app.assignment_history WHERE assignment_id = '${assignmentId}' ORDER BY sequence_no DESC LIMIT 1`),
      pgClient.query(`SELECT COUNT(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${raceLessonId}'`),
      pgClient.query(`SELECT COUNT(*)::int AS count FROM app.lesson_content_blocks WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = '${raceLessonId}')`),
    ]);

    assert.equal(lessonState.rows[0].row_version.toString(), '2');
    if (saveRes.status === 200) {
      assert.equal(reassignRes.status, 409);
      assert.equal(assignmentState.rows[0].current_teacher_id, testTeacherId);
      assert.equal(assignmentState.rows[0].scope_generation.toString(), '1');
      assert.equal(historyState.rows[0].next_teacher_id, testTeacherId);
      assert.equal(revisionCount.rows[0].count, 1);
      assert.equal(blockCount.rows[0].count, 1);
    } else {
      assert.equal(saveRes.error?.code, 'STALE_LESSON');
      assert.equal(reassignRes.status, 200);
      assert.equal(assignmentState.rows[0].current_teacher_id, teacherBId);
      assert.equal(assignmentState.rows[0].scope_generation.toString(), '2');
      assert.equal(historyState.rows[0].next_teacher_id, teacherBId);
      assert.equal(revisionCount.rows[0].count, 0);
      assert.equal(blockCount.rows[0].count, 0);
    }
  });

  test('rejects pre-reassigned writes and inconsistent scope history', async () => {
    // 1. Create fresh planned lesson
    const lessonRes = await pgClient.query(`
      INSERT INTO app.lessons (unit_id, position, availability)
      VALUES ('${unitId}', 1005, 'PLANNED')
      RETURNING id;
    `);
    const raceLessonId = lessonRes.rows[0].id;

    // 2. Create Assignment & Episode for testTeacherId
    const assignRes = await pgClient.query(`
      INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
      VALUES ('${raceLessonId}', '${testTeacherId}', '${testAdminId}', 1)
      RETURNING id;
    `);
    const assignmentId = assignRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    `);

    // 3. Admin reassigns the lesson to another teacher (or bumps scope_generation)
    const teacherBId = '33333333-3333-4333-8333-333333333333';
    await pgClient.query(`
      INSERT INTO auth.users (id, email) VALUES ('${teacherBId}', 'teacherB@lingora.test') ON CONFLICT (id) DO NOTHING;
      INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
      VALUES ('${teacherBId}', 'TEACHER', 'ACTIVE', 'Teacher B', 'vi', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
    `);

    await pgClient.query(`
      UPDATE app.content_assignments
      SET current_teacher_id = '${teacherBId}', scope_generation = 2, updated_at = NOW()
      WHERE id = '${assignmentId}';
      INSERT INTO app.assignment_history (assignment_id, event_type, previous_teacher_id, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
      VALUES ('${assignmentId}', 'REASSIGNED', '${testTeacherId}', '${teacherBId}', '${testAdminId}', 2, 2, 'REASSIGN');
    `);

    // 4. Original teacher (testTeacherId) attempts to save a draft
    const saveRes = await saveTeacherLessonDraft(
      testTeacherId,
      raceLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Bản nháp của giáo viên cũ bị mất phân công' },
        blocks: [
          { blockKey: 'race-b1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H1' } },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );

    // Must be rejected safely (404 LESSON_NOT_FOUND because assignment is no longer owned by testTeacherId)
    assert.equal(saveRes.status, 404);
    assert.equal(saveRes.error?.code, 'LESSON_NOT_FOUND');

    // 5. Invariant: 0 partial rows in database!
    const revCount = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${raceLessonId}'
    `);
    assert.equal(revCount.rows[0].count, 0, 'Must have 0 partial revisions from aborted save');

    const blockCount = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_content_blocks
      WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = '${raceLessonId}')
    `);
    assert.equal(blockCount.rows[0].count, 0, 'Must have 0 block rows from aborted save');

    // Also test scope_generation bump without teacher change:
    await pgClient.query(`
      UPDATE app.content_assignments
      SET current_teacher_id = '${testTeacherId}', scope_generation = 3, updated_at = NOW()
      WHERE id = '${assignmentId}';
    `);
    // Note: latest history still has scope_generation = 2!
    const inconsistentRes = await saveTeacherLessonDraft(
      testTeacherId,
      raceLessonId,
      {
        contentSchemaVersion: 1,
        title: { vi: 'Scope mismatch' },
        blocks: [
          { blockKey: 'race-b2', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H2' } },
        ],
        expectedRowVersion: '1',
        expectedRevisionId: null,
      },
      prisma
    );
    assert.equal(inconsistentRes.status, 409);
    assert.equal(inconsistentRes.error?.code, 'INCONSISTENT_ASSIGNMENT_HISTORY');

    // Check again 0 partial rows
    const revCount2 = await pgClient.query(`
      SELECT count(*)::int AS count FROM app.lesson_revisions WHERE lesson_id = '${raceLessonId}'
    `);
    assert.equal(revCount2.rows[0].count, 0);
  });
});

