import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';

export function validateTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Run test with scripts/local-test-db.mjs to provision a disposable database');
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

describe('S6-04a1: PostgreSQL Enum Migration and LessonContentBlock CHARACTER Contract', () => {
  let prisma;
  let testRevision;

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
    await seed(prisma);

    const unit = await prisma.unit.findFirst();
    assert.ok(unit, 'Seeded unit must exist');

    // Create teacher and admin accounts
    const teacherId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${teacherId}::uuid, 's6-04a1-teacher@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    const teacher = await prisma.account.create({
      data: {
        id: teacherId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'S6-04a1 Test Teacher',
        uiLocale: 'en',
      },
    });

    const adminId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${adminId}::uuid, 's6-04a1-admin@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    const admin = await prisma.account.create({
      data: {
        id: adminId,
        role: 'ADMIN',
        status: 'ACTIVE',
        displayName: 'S6-04a1 Test Admin',
        uiLocale: 'en',
      },
    });

    // Create a dedicated test lesson
    const maxPos = await prisma.lesson.aggregate({
      where: { unitId: unit.id },
      _max: { position: true },
    });
    const lessonPos = (maxPos._max.position || 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        position: lessonPos,
        availability: 'PLANNED',
        isRequired: true,
        rowVersion: 1n,
      },
    });

    const assignment = await prisma.contentAssignment.create({
      data: {
        lessonId: lesson.id,
        currentTeacherId: teacher.id,
        createdBy: admin.id,
        scopeGeneration: 1n,
      },
    });

    const history = await prisma.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: teacher.id,
        changedBy: admin.id,
        scopeGeneration: 1n,
        reason: 'S6-04a1 test setup',
      },
    });

    testRevision = await prisma.lessonRevision.create({
      data: {
        lessonId: lesson.id,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: history.id,
        status: 'DRAFT',
        title: { en: 'Character Contract Test Lesson', vi: 'Bài học kiểm thử hợp đồng ký tự' },
        contentSchemaVersion: 1,
        contentBlocks: [],
        createdBy: teacher.id,
        lastEditedBy: teacher.id,
      },
    });
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  test('app.lesson_block_type PostgreSQL enum contains CHARACTER', async () => {
    const rows = await prisma.$queryRaw`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_namespace.nspname = 'app'
        AND pg_type.typname = 'lesson_block_type'
      ORDER BY enumsortorder;
    `;

    const labels = rows.map((r) => r.enumlabel);
    assert.ok(labels.includes('CHARACTER'), 'Enum must include CHARACTER');

    const expectedCanonical = [
      'HEADING',
      'TEXT',
      'GRAMMAR',
      'EXAMPLE',
      'DIALOGUE',
      'CALLOUT',
      'MEDIA',
      'VOCABULARY',
      'DIVIDER',
      'CHARACTER',
    ];

    for (const exp of expectedCanonical) {
      assert.ok(labels.includes(exp), `Enum must include ${exp}`);
    }
    assert.equal(labels.length, 10, 'Enum must contain exactly 10 values in S6-04a1');
  });

  test('can insert and query LessonContentBlock with type = CHARACTER', async () => {
    const characterId = randomUUID();
    const blockKey = `char_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    const contentPayload = {
      characterId,
      showMeaning: true,
      showReading: true,
      showStrokeAnimation: true,
      guidedWriting: false,
      snapshot: {
        glyph: '木',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'tree, wood',
        primaryReading: 'ki',
        romanization: 'moku',
        metadata: {},
        strokeVersion: 1,
      },
    };

    const inserted = await prisma.lessonContentBlock.create({
      data: {
        lessonRevisionId: testRevision.id,
        blockKey,
        type: 'CHARACTER',
        position: 1,
        schemaVersion: 1,
        content: contentPayload,
      },
    });

    assert.ok(inserted.id);
    assert.equal(inserted.type, 'CHARACTER');
    assert.equal(inserted.blockKey, blockKey);
    assert.equal(inserted.position, 1);
    assert.equal(inserted.schemaVersion, 1);

    // Query back using Prisma client
    const queried = await prisma.lessonContentBlock.findUnique({
      where: { id: inserted.id },
    });
    assert.ok(queried);
    assert.equal(queried.type, 'CHARACTER');
    assert.deepEqual(queried.content, contentPayload);

    // Query using raw SQL to verify enum column at PostgreSQL level
    const sqlRows = await prisma.$queryRaw`
      SELECT id, block_key, type::text as type_str, position, schema_version
      FROM app.lesson_content_blocks
      WHERE id = ${inserted.id}::uuid;
    `;
    assert.equal(sqlRows.length, 1);
    assert.equal(sqlRows[0].type_str, 'CHARACTER');
  });

  test('rejects inserting invalid enum values with PostgreSQL 22P02 error', async () => {
    const blockKey = `invalid_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    await assert.rejects(
      async () => {
        await prisma.$executeRaw`
          INSERT INTO app.lesson_content_blocks (
            id, lesson_revision_id, block_key, type, position, schema_version, content
          ) VALUES (
            gen_random_uuid(),
            ${testRevision.id}::uuid,
            ${blockKey},
            'INVALID_BLOCK_TYPE'::app.lesson_block_type,
            99,
            1,
            '{}'::jsonb
          );
        `;
      },
      (err) => {
        // PostgreSQL error 22P02: invalid input value for enum
        assert.match(err.message, /invalid input value for enum/i);
        return true;
      }
    );
  });

  test('ALTER TYPE app.lesson_block_type ADD VALUE IF NOT EXISTS is idempotent', async () => {
    // Re-running the migration SQL statement must succeed without error
    await prisma.$executeRawUnsafe(
      `ALTER TYPE app.lesson_block_type ADD VALUE IF NOT EXISTS 'CHARACTER';`
    );

    const rows = await prisma.$queryRaw`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_namespace.nspname = 'app'
        AND pg_type.typname = 'lesson_block_type'
        AND enumlabel = 'CHARACTER';
    `;
    assert.equal(rows.length, 1, 'CHARACTER enum value must still exist once');
  });
});
