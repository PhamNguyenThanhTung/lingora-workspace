import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

mock.module('server-only', { exports: {} });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '../..');

export function validateAuditTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Explicit owned loopback DB required: SLICE11_TEST_DATABASE_URL is missing');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SLICE11_TEST_DATABASE_URL is not a valid URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(
      `SLICE11_TEST_DATABASE_URL must target a loopback host (127.0.0.1 or localhost), got: ${parsed.hostname}`
    );
  }
  if (parsed.pathname !== '/slice11_test') {
    throw new Error(
      `SLICE11_TEST_DATABASE_URL must target exact database /slice11_test, got: ${parsed.pathname}`
    );
  }
  if (env.SLICE11_TEST_DATABASE_OWNED !== '1') {
    throw new Error('SLICE11_TEST_DATABASE_OWNED=1 is required for safety');
  }
  return url;
}

const isSubprocessCheck = process.env.AUDIT_POSTGRES_SUBPROCESS_CHECK === '1';

if (isSubprocessCheck) {
  validateAuditTestDatabaseUrl(process.env);
  console.log('VALIDATION_OK');
  process.exit(0);
}

const validatedTestUrl = validateAuditTestDatabaseUrl(process.env);

describe('PostgreSQL Safety Guard Verification (Subprocess Negative Tests)', () => {
  test('fails before client creation if SLICE11_TEST_DATABASE_OWNED is missing or not 1', () => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.SLICE11_TEST_DATABASE_OWNED;
    cleanEnv.AUDIT_POSTGRES_SUBPROCESS_CHECK = '1';

    const res = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--experimental-test-module-mocks',
        'tests/feature/audit-postgres.test.mjs',
      ],
      {
        cwd: adminRoot,
        env: cleanEnv,
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /SLICE11_TEST_DATABASE_OWNED=1 is required/);
  });

  test('fails before client creation if SLICE11_TEST_DATABASE_URL is non-loopback', () => {
    const cleanEnv = { ...process.env };
    cleanEnv.SLICE11_TEST_DATABASE_URL = 'postgresql://postgres:secret@db.external.domain:5432/slice11_test?schema=app';
    cleanEnv.SLICE11_TEST_DATABASE_OWNED = '1';
    cleanEnv.AUDIT_POSTGRES_SUBPROCESS_CHECK = '1';

    const res = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--experimental-test-module-mocks',
        'tests/feature/audit-postgres.test.mjs',
      ],
      {
        cwd: adminRoot,
        env: cleanEnv,
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /must target a loopback host/);
  });

  test('fails before client creation if SLICE11_TEST_DATABASE_URL has non-exact pathname (e.g. /slice11_test_extra)', () => {
    const cleanEnv = { ...process.env };
    cleanEnv.SLICE11_TEST_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/slice11_test_extra?schema=app';
    cleanEnv.SLICE11_TEST_DATABASE_OWNED = '1';
    cleanEnv.AUDIT_POSTGRES_SUBPROCESS_CHECK = '1';

    const res = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--experimental-test-module-mocks',
        'tests/feature/audit-postgres.test.mjs',
      ],
      {
        cwd: adminRoot,
        env: cleanEnv,
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /must target exact database \/slice11_test/);
  });

  test('fails before client creation if only DATABASE_URL is set without SLICE11_TEST_DATABASE_URL', () => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.SLICE11_TEST_DATABASE_URL;
    cleanEnv.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/slice11_test?schema=app';
    cleanEnv.SLICE11_TEST_DATABASE_OWNED = '1';
    cleanEnv.AUDIT_POSTGRES_SUBPROCESS_CHECK = '1';

    const res = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--experimental-test-module-mocks',
        'tests/feature/audit-postgres.test.mjs',
      ],
      {
        cwd: adminRoot,
        env: cleanEnv,
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /Explicit owned loopback DB required/);
  });
});

describe('Audit Service: Real PostgreSQL Keyset Pagination & Microsecond Fidelity', () => {
  let prisma;
  let listAuditEvents;
  const insertedRowIds = new Set();

  before(async () => {
    // Dynamically import prisma client
    const { PrismaClient } = await import('../../generated/product-client/index.js');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: validatedTestUrl,
        },
      },
    });

    const auditModule = await import('../../src/server/audit/index.ts');
    listAuditEvents = auditModule.listAuditEvents;

    // Verify database connectivity
    await prisma.$queryRawUnsafe('SELECT 1');
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  test('inserts rows straddling 50-row boundaries with microsecond and same-time groups, traversable to exhaustion with filters', async () => {
    const fromTime = '2026-11-01T00:00:00.000Z';
    const toTime = '2026-11-04T00:00:00.000Z';

    // 1. Boundary row: exactly at `fromTime` (inclusive) -> Row 108
    const fromBoundaryId = randomUUID();
    insertedRowIds.add(fromBoundaryId);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', $2::timestamptz)`,
      fromBoundaryId,
      fromTime
    );

    // 2. Boundary row: 1 microsecond before `fromTime` (must be excluded)
    const beforeFromId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-10-31 23:59:59.999999Z')`,
      beforeFromId
    );

    // 3. Boundary row: exactly at `toTime` (must be excluded because [from, to) is half-open)
    const toBoundaryId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', $2::timestamptz)`,
      toBoundaryId,
      toTime
    );

    // 4. Boundary row: 1 microsecond before `toTime` -> Row 1
    const beforeToId = randomUUID();
    insertedRowIds.add(beforeToId);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-03 23:59:59.999999Z')`,
      beforeToId
    );

    // 5. Insert 48 filler rows for Page 1 (Rows 2 to 49)
    for (let i = 1; i <= 48; i++) {
      const id = randomUUID();
      insertedRowIds.add(id);
      const minute = String(i).padStart(2, '0');
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
         VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-03 12:${minute}:00.000000Z')`,
        id
      );
    }

    // 6. Distinct microsecond pair: .123999Z (Row 50, LAST of Page 1) and .123001Z (Row 51, FIRST of Page 2)
    const microPairNewerId = '11111111-0000-0000-0000-000000000099';
    const microPairOlderId = '11111111-0000-0000-0000-000000000001';
    insertedRowIds.add(microPairNewerId);
    insertedRowIds.add(microPairOlderId);

    // Row 50:
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-02 12:00:00.123999Z')`,
      microPairNewerId
    );
    // Row 51:
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-02 12:00:00.123001Z')`,
      microPairOlderId
    );

    // 7. Insert 47 filler rows for Page 2 (Rows 52 to 98)
    for (let i = 1; i <= 47; i++) {
      const id = randomUUID();
      insertedRowIds.add(id);
      const minute = String(i).padStart(2, '0');
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
         VALUES ($1::uuid, 'SYSTEM', 'TEACHER_PROVISIONED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-02 11:${minute}:00.000000Z')`,
        id
      );
    }

    // 8. Equal-time UUID group: 5 rows at '2026-11-02 10:00:00.500000Z'
    // Rows 99 & 100 on Page 2; Rows 101, 102, 103 on Page 3
    const sameTimeUuids = [
      'ffffffff-0000-0000-0000-000000000005', // Row 99 (Page 2 Row 49)
      'ffffffff-0000-0000-0000-000000000004', // Row 100 (Page 2 Row 50, LAST of Page 2)
      'ffffffff-0000-0000-0000-000000000003', // Row 101 (Page 3 Row 1, FIRST of Page 3)
      'ffffffff-0000-0000-0000-000000000002', // Row 102 (Page 3 Row 2)
      'ffffffff-0000-0000-0000-000000000001', // Row 103 (Page 3 Row 3)
    ];
    for (const uuid of sameTimeUuids) {
      insertedRowIds.add(uuid);
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
         VALUES ($1::uuid, 'SYSTEM', 'TEACHER_ENABLED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-02 10:00:00.500000Z')`,
        uuid
      );
    }

    // 9. Additional rows with distinct known actions and FAILURE outcomes on Page 3 (Rows 104-107)
    const failureActionId1 = randomUUID();
    insertedRowIds.add(failureActionId1);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_ENABLED', 'ACCOUNT', 'FAILURE', TIMESTAMPTZ '2026-11-01 18:00:00.000000Z')`,
      failureActionId1
    );

    const successActionId2 = randomUUID();
    insertedRowIds.add(successActionId2);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_DISABLED', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-01 16:00:00.000000Z')`,
      successActionId2
    );

    const failureActionId2 = randomUUID();
    insertedRowIds.add(failureActionId2);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'TEACHER_ACTIVATED', 'ACCOUNT', 'FAILURE', TIMESTAMPTZ '2026-11-01 14:00:00.000000Z')`,
      failureActionId2
    );

    const otherActionId = randomUUID();
    insertedRowIds.add(otherActionId);
    await prisma.$executeRawUnsafe(
      `INSERT INTO app_private.audit_events (id, actor_kind, action, target_type, outcome, occurred_at)
       VALUES ($1::uuid, 'SYSTEM', 'UNREGISTERED_SYSTEM_MAINTENANCE', 'ACCOUNT', 'SUCCESS', TIMESTAMPTZ '2026-11-01 12:00:00.000000Z')`,
      otherActionId
    );

    // Total in-range rows = 1 (from) + 1 (beforeTo) + 48 (filler1) + 2 (micro) + 47 (filler2) + 5 (sameTime) + 4 (additional) = 108 rows
    const expectedTotalRows = insertedRowIds.size;
    assert.equal(expectedTotalRows, 108, `Expected exactly 108 rows, got ${expectedTotalRows}`);

    // =========================================================================
    // Traverse Pages to Exhaustion
    // =========================================================================
    // Page 1: exactly 50 rows
    const page1 = await listAuditEvents({ from: fromTime, to: toTime }, prisma);
    assert.equal(page1.ok, true);
    assert.equal(page1.data.length, 50, 'Page 1 must contain exactly 50 rows');
    assert.ok(page1.nextCursor, 'Page 1 must return a nextCursor');

    // Assert Row 50 (last of Page 1) is microPairNewerId (.123999Z)
    assert.equal(page1.data[49].id, microPairNewerId);
    assert.equal(page1.data[49].occurredAt, '2026-11-02T12:00:00.123999Z');

    // Page 2: exactly 50 rows (using page1 cursor)
    const page2 = await listAuditEvents(
      { from: fromTime, to: toTime, cursor: page1.nextCursor },
      prisma
    );
    assert.equal(page2.ok, true);
    assert.equal(page2.data.length, 50, 'Page 2 must contain exactly 50 rows');
    assert.ok(page2.nextCursor, 'Page 2 must return a nextCursor');

    // Assert Row 51 (Page 2 Row 1) is microPairOlderId (.123001Z) -> Microsecond straddle verified!
    assert.equal(page2.data[0].id, microPairOlderId);
    assert.equal(page2.data[0].occurredAt, '2026-11-02T12:00:00.123001Z');

    // Assert Row 99 and Row 100 on Page 2 are first two same-time UUIDs
    assert.equal(page2.data[48].id, sameTimeUuids[0]);
    assert.equal(page2.data[49].id, sameTimeUuids[1]);

    // Page 3: remainder 8 rows (using page2 cursor)
    const page3 = await listAuditEvents(
      { from: fromTime, to: toTime, cursor: page2.nextCursor },
      prisma
    );
    assert.equal(page3.ok, true);
    assert.equal(page3.data.length, 8, 'Page 3 must contain remaining 8 rows');
    assert.equal(page3.nextCursor, null, 'Page 3 must be the final page');

    // Assert Rows 101, 102, 103 (Page 3 Rows 1, 2, 3) are remaining same-time UUIDs -> Same-time straddle verified!
    assert.equal(page3.data[0].id, sameTimeUuids[2]);
    assert.equal(page3.data[1].id, sameTimeUuids[3]);
    assert.equal(page3.data[2].id, sameTimeUuids[4]);

    // Combine all retrieved rows
    const allRows = [...page1.data, ...page2.data, ...page3.data];
    assert.equal(allRows.length, 108, 'All 108 rows retrieved without skips');

    const retrievedIds = new Set(allRows.map((r) => r.id));
    assert.equal(retrievedIds.size, 108, 'All 108 retrieved IDs unique (zero duplicates)');

    // Assert strict descending keyset ordering across all 108 rows
    for (let i = 0; i < allRows.length - 1; i++) {
      const current = allRows[i];
      const next = allRows[i + 1];

      if (current.occurredAt === next.occurredAt) {
        assert.ok(
          current.id > next.id,
          `Same timestamp must be ordered by id DESC: ${current.id} > ${next.id}`
        );
      } else {
        assert.ok(
          current.occurredAt > next.occurredAt,
          `Timestamp must be descending: ${current.occurredAt} > ${next.occurredAt}`
        );
      }
    }

    // Boundary rows check
    assert.ok(retrievedIds.has(fromBoundaryId), 'Inclusive lower bound at fromTime included');
    assert.ok(!retrievedIds.has(beforeFromId), 'Row before fromTime excluded');
    assert.ok(!retrievedIds.has(toBoundaryId), 'Exclusive upper bound at toTime excluded');
    assert.ok(retrievedIds.has(beforeToId), 'Row just before toTime included');

    // =========================================================================
    // Known Action Filter & Multiple Outcome Filters
    // =========================================================================
    // 1. Filter by known action: TEACHER_ENABLED (5 from sameTime + 1 failure = 6 total)
    const actionRes = await listAuditEvents(
      { from: fromTime, to: toTime, action: 'TEACHER_ENABLED' },
      prisma
    );
    assert.equal(actionRes.ok, true);
    assert.equal(actionRes.data.length, 6);
    assert.ok(actionRes.data.every((r) => r.action === 'TEACHER_ENABLED'));

    // 2. Filter by outcome: FAILURE (failureActionId1 + failureActionId2 = 2 total)
    const failureRes = await listAuditEvents(
      { from: fromTime, to: toTime, outcome: 'FAILURE' },
      prisma
    );
    assert.equal(failureRes.ok, true);
    assert.equal(failureRes.data.length, 2);
    assert.ok(failureRes.data.every((r) => r.outcome === 'FAILURE'));
    assert.ok(failureRes.data.some((r) => r.id === failureActionId1));
    assert.ok(failureRes.data.some((r) => r.id === failureActionId2));

    // 3. Filter by outcome: SUCCESS (all other 106 rows)
    const successRes = await listAuditEvents(
      { from: fromTime, to: toTime, outcome: 'SUCCESS' },
      prisma
    );
    assert.equal(successRes.ok, true);
    assert.equal(successRes.data.length, 50, 'Page 1 of SUCCESS filter contains 50 rows');
    assert.ok(successRes.data.every((r) => r.outcome === 'SUCCESS'));

    // 4. Filter by action: OTHER (maps unregistered action)
    const otherRes = await listAuditEvents(
      { from: fromTime, to: toTime, action: 'OTHER' },
      prisma
    );
    assert.equal(otherRes.ok, true);
    assert.equal(otherRes.data.length, 1);
    assert.equal(otherRes.data[0].id, otherActionId);
    assert.equal(otherRes.data[0].action, 'OTHER');
    assert.equal(otherRes.data[0].outcome, 'SUCCESS');
  });
});
