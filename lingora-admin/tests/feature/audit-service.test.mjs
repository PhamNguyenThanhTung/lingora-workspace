import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module('server-only', { exports: {} });
const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

const {
  encodeCursor,
  decodeCursor,
  validateAndNormalizeAuditParams,
  computeDefaultAuditBounds,
  listAuditEvents,
  AuditValidationError,
  KNOWN_ACTIONS,
  KNOWN_OUTCOMES,
} = await import('../../src/server/audit/index.ts');

describe('Audit Service: Parameter Validation and Date Handling', () => {
  test('both from and to omitted defaults to server-fixed 7 days span', () => {
    const before = Date.now();
    const result = validateAndNormalizeAuditParams({});
    const after = Date.now();

    assert.ok(result.effectiveFrom);
    assert.ok(result.effectiveTo);
    assert.equal(result.effectiveAction, null);
    assert.equal(result.effectiveOutcome, null);
    assert.equal(result.cursorPayload, null);

    const fromMs = new Date(result.effectiveFrom).getTime();
    const toMs = new Date(result.effectiveTo).getTime();
    const spanDays = (toMs - fromMs) / (24 * 60 * 60 * 1000);

    assert.ok(Math.abs(spanDays - 7) < 0.001, 'Span must be exactly 7 days');
    assert.ok(toMs >= before && toMs <= after + 1000, 'toMs must be around current time');
  });

  test('rejects when only from is provided', () => {
    assert.throws(
      () => validateAndNormalizeAuditParams({ from: '2026-11-01T00:00:00.000Z' }),
      AuditValidationError
    );
  });

  test('rejects when only to is provided', () => {
    assert.throws(
      () => validateAndNormalizeAuditParams({ to: '2026-11-04T00:00:00.000Z' }),
      AuditValidationError
    );
  });

  test('accepts valid canonical UTC ISO millisecond bounds within 31 days', () => {
    const from = '2026-10-10T00:00:00.000Z';
    const to = '2026-11-05T00:00:00.000Z'; // 26 days
    const result = validateAndNormalizeAuditParams({ from, to });
    assert.equal(result.effectiveFrom, from);
    assert.equal(result.effectiveTo, to);
  });

  test('rejects from >= to', () => {
    const ts = '2026-11-01T00:00:00.000Z';
    assert.throws(() => validateAndNormalizeAuditParams({ from: ts, to: ts }), AuditValidationError);

    const from = '2026-11-02T00:00:00.000Z';
    const to = '2026-11-01T00:00:00.000Z';
    assert.throws(() => validateAndNormalizeAuditParams({ from, to }), AuditValidationError);
  });

  test('rejects span exceeding 31 days', () => {
    const from = '2026-10-01T00:00:00.000Z';
    const to = '2026-11-02T00:00:00.001Z'; // 32 days + 1ms
    assert.throws(() => validateAndNormalizeAuditParams({ from, to }), AuditValidationError);
  });

  test('rejects malformed date strings (missing Z, non-UTC, invalid calendar)', () => {
    const valid = '2026-11-04T00:00:00.000Z';

    // Missing Z
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-11-01T00:00:00.000', to: valid }), AuditValidationError);
    // Non-canonical millisecond digits
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-11-01T00:00:00.00Z', to: valid }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-11-01T00:00:00.0000Z', to: valid }), AuditValidationError);
    // Invalid calendar (Feb 30)
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-02-30T00:00:00.000Z', to: valid }), AuditValidationError);
    // Invalid time (hour 25)
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-11-01T25:00:00.000Z', to: valid }), AuditValidationError);
    // Arbitrary text
    assert.throws(() => validateAndNormalizeAuditParams({ from: 'yesterday', to: valid }), AuditValidationError);
  });

  test('accepts known action codes and OTHER; rejects unknown action strings', () => {
    const from = '2026-11-01T00:00:00.000Z';
    const to = '2026-11-04T00:00:00.000Z';

    for (const act of KNOWN_ACTIONS) {
      const res = validateAndNormalizeAuditParams({ from, to, action: act });
      assert.equal(res.effectiveAction, act);
    }
    const otherRes = validateAndNormalizeAuditParams({ from, to, action: 'OTHER' });
    assert.equal(otherRes.effectiveAction, 'OTHER');

    // Unknown raw actions
    assert.throws(() => validateAndNormalizeAuditParams({ from, to, action: 'DROP_TABLE' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from, to, action: 'teacher_provisioned' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from, to, action: 'RANDOM' }), AuditValidationError);
  });

  test('accepts known outcomes; rejects unknown outcome strings', () => {
    const from = '2026-11-01T00:00:00.000Z';
    const to = '2026-11-04T00:00:00.000Z';

    for (const out of KNOWN_OUTCOMES) {
      const res = validateAndNormalizeAuditParams({ from, to, outcome: out });
      assert.equal(res.effectiveOutcome, out);
    }

    assert.throws(() => validateAndNormalizeAuditParams({ from, to, outcome: 'PENDING' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from, to, outcome: 'ERROR' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from, to, outcome: 'success' }), AuditValidationError);
  });

  test('rejects supplied empty strings for bounds, action, outcome and cursor', () => {
    assert.throws(() => validateAndNormalizeAuditParams({ from: '', to: '' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from: '   ', to: '2026-11-04T00:00:00.000Z' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ from: '2026-11-01T00:00:00.000Z', to: '' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ action: '' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ action: '   ' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ outcome: '' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ outcome: '   ' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ cursor: '' }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ cursor: '   ' }), AuditValidationError);
  });

  test('computeDefaultAuditBounds returns valid canonical 7-day UTC bounds', () => {
    const bounds = computeDefaultAuditBounds();
    assert.ok(bounds.from);
    assert.ok(bounds.to);
    const fromMs = new Date(bounds.from).getTime();
    const toMs = new Date(bounds.to).getTime();
    assert.ok(fromMs < toMs);
    const spanDays = (toMs - fromMs) / (24 * 60 * 60 * 1000);
    assert.ok(Math.abs(spanDays - 7) < 0.001);
  });
});

describe('Audit Service: Cursor Encoding, Decoding and Keyset Validation', () => {
  const validPayload = {
    v: 1,
    t: '2026-11-03T12:00:00.123456Z',
    id: '11111111-2222-3333-4444-555555555555',
    from: '2026-11-01T00:00:00.000Z',
    to: '2026-11-04T00:00:00.000Z',
    action: 'TEACHER_PROVISIONED',
    outcome: 'SUCCESS',
  };

  test('roundtrip cursor encoding and decoding succeeds with identical payload', () => {
    const encoded = encodeCursor(validPayload);
    assert.ok(typeof encoded === 'string');
    assert.ok(encoded.length < 1024);

    const decoded = decodeCursor(encoded);
    assert.deepEqual(decoded, validPayload);
  });

  test('cursor decoding rejects oversized string (> 1024 characters)', () => {
    const largeStr = 'a'.repeat(1025);
    assert.throws(() => decodeCursor(largeStr), AuditValidationError);
  });

  test('cursor decoding rejects non-canonical base64url or corrupt encoding', () => {
    assert.throws(() => decodeCursor('not_base64_json!@#$'), AuditValidationError);
    assert.throws(() => decodeCursor(''), AuditValidationError);
  });

  test('cursor decoding rejects malformed JSON', () => {
    const badJson = Buffer.from('{not-json}').toString('base64url');
    assert.throws(() => decodeCursor(badJson), AuditValidationError);
  });

  test('cursor decoding rejects missing or extra keys', () => {
    // Missing key
    const missingKey = { ...validPayload };
    delete missingKey.action;
    assert.throws(() => decodeCursor(encodeCursor(missingKey)), AuditValidationError);

    // Extra key
    const extraKey = { ...validPayload, evilExtra: 'hack' };
    assert.throws(() => decodeCursor(encodeCursor(extraKey)), AuditValidationError);
  });

  test('cursor decoding rejects invalid version', () => {
    const badVersion = { ...validPayload, v: 2 };
    assert.throws(() => decodeCursor(encodeCursor(badVersion)), AuditValidationError);
  });

  test('cursor decoding rejects invalid UUID', () => {
    const badUuid = { ...validPayload, id: 'not-a-uuid' };
    assert.throws(() => decodeCursor(encodeCursor(badUuid)), AuditValidationError);
  });

  test('cursor decoding rejects invalid microsecond timestamp', () => {
    // 3 digits ms instead of 6 digits microseconds
    const threeDigits = { ...validPayload, t: '2026-11-03T12:00:00.123Z' };
    assert.throws(() => decodeCursor(encodeCursor(threeDigits)), AuditValidationError);

    // Invalid calendar in t
    const badCalendar = { ...validPayload, t: '2026-02-31T12:00:00.123456Z' };
    assert.throws(() => decodeCursor(encodeCursor(badCalendar)), AuditValidationError);
  });

  test('cursor decoding rejects timestamp outside from/to range', () => {
    // Before from
    const beforeFrom = { ...validPayload, t: '2026-10-31T23:59:59.999999Z' };
    assert.throws(() => decodeCursor(encodeCursor(beforeFrom)), AuditValidationError);

    // At or after to
    const afterTo = { ...validPayload, t: '2026-11-04T00:00:00.000000Z' };
    assert.throws(() => decodeCursor(encodeCursor(afterTo)), AuditValidationError);
  });

  test('cursor request requires explicit from and to matching embedded bounds', () => {
    const cursor = encodeCursor(validPayload);

    // Missing from or to
    assert.throws(() => validateAndNormalizeAuditParams({ cursor }), AuditValidationError);
    assert.throws(() => validateAndNormalizeAuditParams({ cursor, from: validPayload.from }), AuditValidationError);

    // Mismatched from
    assert.throws(
      () => validateAndNormalizeAuditParams({
        cursor,
        from: '2026-11-02T00:00:00.000Z',
        to: validPayload.to,
        action: validPayload.action,
        outcome: validPayload.outcome,
      }),
      AuditValidationError
    );

    // Mismatched action
    assert.throws(
      () => validateAndNormalizeAuditParams({
        cursor,
        from: validPayload.from,
        to: validPayload.to,
        action: 'TEACHER_DISABLED',
        outcome: validPayload.outcome,
      }),
      AuditValidationError
    );

    // Matching everything succeeds
    const res = validateAndNormalizeAuditParams({
      cursor,
      from: validPayload.from,
      to: validPayload.to,
      action: validPayload.action,
      outcome: validPayload.outcome,
    });
    assert.equal(res.effectiveFrom, validPayload.from);
    assert.equal(res.effectiveTo, validPayload.to);
    assert.equal(res.effectiveAction, validPayload.action);
    assert.equal(res.effectiveOutcome, validPayload.outcome);
    assert.deepEqual(res.cursorPayload, validPayload);
  });
});

describe('Audit Service: Mock Query Execution & Projection Redaction', () => {
  test('returns 50 rows and nextCursor when 51 rows fetched from DB', async () => {
    const mockRows = [];
    for (let i = 51; i >= 1; i--) {
      mockRows.push({
        id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        occurredAt: `2026-11-03T12:00:${String(i).padStart(2, '0')}.123456Z`,
        actorKind: 'ACCOUNT',
        actorId: '11111111-1111-1111-1111-111111111111',
        action: 'TEACHER_PROVISIONED',
        targetType: 'ACCOUNT',
        targetId: '22222222-2222-2222-2222-222222222222',
        outcome: 'SUCCESS',
      });
    }

    let capturedQuery;
    const mockPrisma = {
      $queryRaw: async (query) => {
        capturedQuery = query;
        return mockRows;
      },
    };

    const res = await listAuditEvents(
      {
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-04T00:00:00.000Z',
        action: 'TEACHER_PROVISIONED',
      },
      mockPrisma
    );

    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 50);
    assert.ok(res.nextCursor);

    // Verify nextCursor points to 50th row
    const decoded = decodeCursor(res.nextCursor);
    assert.equal(decoded.id, mockRows[49].id);
    assert.equal(decoded.t, mockRows[49].occurredAt);

    // Verify parameterized SQL query
    assert.ok(capturedQuery.strings.some((s) => s.includes('app_private.audit_events')));
    assert.ok(capturedQuery.strings.some((s) => s.includes('LIMIT')));
    assert.ok(capturedQuery.values.includes('2026-11-01T00:00:00.000Z'));
    assert.ok(capturedQuery.values.includes('2026-11-04T00:00:00.000Z'));
    assert.ok(capturedQuery.values.includes('TEACHER_PROVISIONED'));
    assert.ok(capturedQuery.values.includes(51));
  });

  test('redacts unknown stored action, targetType, actorKind and outcome to OTHER', async () => {
    const dirtyRow = {
      id: '00000000-0000-0000-0000-000000000001',
      occurredAt: '2026-11-03T12:00:00.000000Z',
      actorKind: 'UNKNOWN_ROBOT',
      actorId: null,
      action: 'MALICIOUS_ATTACK_STRING_IN_DB',
      targetType: 'SECRET_VAULT',
      targetId: null,
      outcome: 'UNKNOWN_OUTCOME',
      reason: 'Should be stripped',
      safeContext: { secret: 'leak' },
      verifiedAuthSubjectId: '33333333-3333-3333-3333-333333333333',
    };

    const mockPrisma = {
      $queryRaw: async () => [dirtyRow],
    };

    const res = await listAuditEvents(
      { from: '2026-11-01T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z' },
      mockPrisma
    );

    assert.equal(res.ok, true);
    assert.equal(res.data.length, 1);
    const row = res.data[0];

    assert.equal(row.actorKind, 'OTHER');
    assert.equal(row.action, 'OTHER');
    assert.equal(row.targetType, 'OTHER');
    assert.equal(row.outcome, 'OTHER');

    // Strict DTO fields only: no reason, safeContext, or verifiedAuthSubjectId
    assert.equal('reason' in row, false);
    assert.equal('safeContext' in row, false);
    assert.equal('verifiedAuthSubjectId' in row, false);
  });

  test('generates OTHER action predicate when action=OTHER is requested', async () => {
    let capturedQuery;
    const mockPrisma = {
      $queryRaw: async (query) => {
        capturedQuery = query;
        return [];
      },
    };

    const res = await listAuditEvents(
      {
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-04T00:00:00.000Z',
        action: 'OTHER',
      },
      mockPrisma
    );

    assert.equal(res.ok, true);
    assert.equal(res.data.length, 0);
    assert.equal(res.nextCursor, null);

    const fullSql = capturedQuery.strings.join('?');
    assert.ok(
      fullSql.includes('action NOT IN'),
      'Must contain NOT IN predicate for known actions when OTHER is filtered'
    );
  });

  test('maps database connectivity error to 503 SERVICE_UNAVAILABLE', async () => {
    const mockPrisma = {
      $queryRaw: async () => {
        const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');
        throw err;
      },
    };

    const res = await listAuditEvents(
      { from: '2026-11-01T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z' },
      mockPrisma
    );

    assert.equal(res.ok, false);
    assert.equal(res.status, 503);
    assert.equal(res.error.code, 'SERVICE_UNAVAILABLE');
    assert.ok(!res.error.message.includes('ECONNREFUSED'), 'Never expose raw error message');
  });

  test('maps generic unexpected error to 500 INTERNAL_SERVER_ERROR', async () => {
    const mockPrisma = {
      $queryRaw: async () => {
        throw new Error('Some unexpected syntax error');
      },
    };

    const res = await listAuditEvents(
      { from: '2026-11-01T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z' },
      mockPrisma
    );

    assert.equal(res.ok, false);
    assert.equal(res.status, 500);
    assert.equal(res.error.code, 'INTERNAL_SERVER_ERROR');
    assert.ok(!res.error.message.includes('syntax error'), 'Never expose internal error details');
  });

  test('wraps actual getProductPrisma acquisition failure without a supplied client', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    setProductPrismaForTest(null);
    delete process.env.DATABASE_URL;
    try {
      const result = await listAuditEvents({
        from: '2026-11-01T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z',
      });
      assert.equal(result.ok, false);
      assert.equal(result.status, 500);
      assert.equal(result.error.code, 'INTERNAL_SERVER_ERROR');
      assert.ok(!JSON.stringify(result).includes('DATABASE_URL'), 'Do not expose acquisition details');
    } finally {
      if (databaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = databaseUrl;
      setProductPrismaForTest(null);
    }
  });
});
