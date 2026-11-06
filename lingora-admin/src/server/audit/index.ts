import 'server-only';
import { Prisma } from '../../../generated/product-client/index.js';
import { getProductPrisma } from '../db/index.js';
import {
  KNOWN_ACTIONS,
  KNOWN_OUTCOMES,
  KNOWN_ACTOR_KINDS,
  KNOWN_TARGET_TYPES,
  type AuditCursorPayload,
  type AuditEventAction,
  type AuditEventActorKind,
  type AuditEventDto,
  type AuditEventOutcome,
  type AuditEventTargetType,
  type AuditFilters,
  type ListAuditEventsInput,
  type ListAuditEventsResult,
} from './types.ts';

export * from './types.ts';

const PAGE_SIZE = 50;
const FETCH_LIMIT = 51;
const MAX_SPAN_MS = 31 * 24 * 60 * 60 * 1000;
const UTC_MS_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UTC_MICRO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AuditValidationError extends Error {
  code = 'VALIDATION_ERROR' as const;
  constructor(message = 'Tham số yêu cầu không hợp lệ.') {
    super(message);
    this.name = 'AuditValidationError';
  }
}

export function encodeCursor(payload: AuditCursorPayload): string {
  const jsonStr = JSON.stringify(payload);
  return Buffer.from(jsonStr, 'utf8').toString('base64url');
}

export function decodeCursor(cursorStr: string): AuditCursorPayload {
  if (typeof cursorStr !== 'string' || cursorStr.length === 0 || cursorStr.length > 1024) {
    throw new AuditValidationError();
  }

  let jsonStr: string;
  try {
    const buf = Buffer.from(cursorStr, 'base64url');
    jsonStr = buf.toString('utf8');
    if (buf.toString('base64url') !== cursorStr) {
      throw new AuditValidationError();
    }
  } catch {
    throw new AuditValidationError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AuditValidationError();
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new AuditValidationError();
  }

  const payload = parsed as Record<string, unknown>;
  const keys = Object.keys(payload).sort();
  const expectedKeys = ['action', 'from', 'id', 'outcome', 't', 'to', 'v'];
  if (keys.length !== expectedKeys.length || !keys.every((k, i) => k === expectedKeys[i])) {
    throw new AuditValidationError();
  }

  if (payload.v !== 1) {
    throw new AuditValidationError();
  }

  if (typeof payload.id !== 'string' || !UUID_REGEX.test(payload.id)) {
    throw new AuditValidationError();
  }

  if (typeof payload.t !== 'string' || !UTC_MICRO_REGEX.test(payload.t)) {
    throw new AuditValidationError();
  }

  const dateCheck = new Date(payload.t.slice(0, 23) + 'Z');
  if (Number.isNaN(dateCheck.getTime()) || dateCheck.toISOString().slice(0, 19) !== payload.t.slice(0, 19)) {
    throw new AuditValidationError();
  }

  if (typeof payload.from !== 'string' || !UTC_MS_REGEX.test(payload.from)) {
    throw new AuditValidationError();
  }
  const fromDate = new Date(payload.from);
  if (Number.isNaN(fromDate.getTime()) || fromDate.toISOString() !== payload.from) {
    throw new AuditValidationError();
  }

  if (typeof payload.to !== 'string' || !UTC_MS_REGEX.test(payload.to)) {
    throw new AuditValidationError();
  }
  const toDate = new Date(payload.to);
  if (Number.isNaN(toDate.getTime()) || toDate.toISOString() !== payload.to) {
    throw new AuditValidationError();
  }

  if (fromDate.getTime() >= toDate.getTime() || toDate.getTime() - fromDate.getTime() > MAX_SPAN_MS) {
    throw new AuditValidationError();
  }

  if (
    payload.action !== null &&
    (typeof payload.action !== 'string' ||
      (!KNOWN_ACTIONS.includes(payload.action as (typeof KNOWN_ACTIONS)[number]) && payload.action !== 'OTHER'))
  ) {
    throw new AuditValidationError();
  }

  if (
    payload.outcome !== null &&
    (typeof payload.outcome !== 'string' ||
      !KNOWN_OUTCOMES.includes(payload.outcome as (typeof KNOWN_OUTCOMES)[number]))
  ) {
    throw new AuditValidationError();
  }

  const fromMicro = payload.from.replace('Z', '000Z');
  const toMicro = payload.to.replace('Z', '000Z');
  if (payload.t < fromMicro || payload.t >= toMicro) {
    throw new AuditValidationError();
  }

  return {
    v: 1,
    t: payload.t,
    id: payload.id,
    from: payload.from,
    to: payload.to,
    action: payload.action as string | null,
    outcome: payload.outcome as string | null,
  };
}

function isDatabaseConnectivityError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; name?: string };
  if (e.name === 'PrismaClientInitializationError') return true;
  if (e.code === 'P1000' || e.code === 'P1001' || e.code === 'P1002' || e.code === 'P1008' || e.code === 'P1017') {
    return true;
  }
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes('connection') ||
    msg.includes('connect') ||
    msg.includes('econnrefused') ||
    msg.includes('closed') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('network')
  );
}

export function computeDefaultAuditBounds(): { from: string; to: string } {
  const now = new Date();
  return {
    to: now.toISOString(),
    from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function validateAndNormalizeAuditParams(input: ListAuditEventsInput = {}): {
  effectiveFrom: string;
  effectiveTo: string;
  effectiveAction: AuditEventAction | null;
  effectiveOutcome: AuditEventOutcome | null;
  cursorPayload: AuditCursorPayload | null;
} {
  const { from, to, action, outcome, cursor } = input;

  let effectiveAction: AuditEventAction | null = null;
  if (action !== undefined) {
    if (typeof action !== 'string' || action.trim() === '') {
      throw new AuditValidationError();
    }
    if (KNOWN_ACTIONS.includes(action as (typeof KNOWN_ACTIONS)[number]) || action === 'OTHER') {
      effectiveAction = action as AuditEventAction;
    } else {
      throw new AuditValidationError();
    }
  }

  let effectiveOutcome: AuditEventOutcome | null = null;
  if (outcome !== undefined) {
    if (typeof outcome !== 'string' || outcome.trim() === '') {
      throw new AuditValidationError();
    }
    if (KNOWN_OUTCOMES.includes(outcome as (typeof KNOWN_OUTCOMES)[number])) {
      effectiveOutcome = outcome as AuditEventOutcome;
    } else {
      throw new AuditValidationError();
    }
  }

  let cursorPayload: AuditCursorPayload | null = null;
  if (cursor !== undefined) {
    if (typeof cursor !== 'string' || cursor.trim() === '') {
      throw new AuditValidationError();
    }
    if (from === undefined || to === undefined) {
      throw new AuditValidationError();
    }
    cursorPayload = decodeCursor(cursor);

    if (cursorPayload.from !== from || cursorPayload.to !== to) {
      throw new AuditValidationError();
    }
    if (cursorPayload.action !== effectiveAction) {
      throw new AuditValidationError();
    }
    if (cursorPayload.outcome !== effectiveOutcome) {
      throw new AuditValidationError();
    }
  }

  let effectiveFrom: string;
  let effectiveTo: string;

  if (from === undefined && to === undefined) {
    const defaultBounds = computeDefaultAuditBounds();
    effectiveFrom = defaultBounds.from;
    effectiveTo = defaultBounds.to;
  } else {
    if (from === undefined || to === undefined) {
      throw new AuditValidationError();
    }
    if (typeof from !== 'string' || from.trim() === '' || typeof to !== 'string' || to.trim() === '') {
      throw new AuditValidationError();
    }
    if (!UTC_MS_REGEX.test(from) || !UTC_MS_REGEX.test(to)) {
      throw new AuditValidationError();
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate.toISOString() !== from ||
      toDate.toISOString() !== to
    ) {
      throw new AuditValidationError();
    }
    if (fromDate.getTime() >= toDate.getTime()) {
      throw new AuditValidationError();
    }
    if (toDate.getTime() - fromDate.getTime() > MAX_SPAN_MS) {
      throw new AuditValidationError();
    }
    effectiveFrom = from;
    effectiveTo = to;
  }

  return {
    effectiveFrom,
    effectiveTo,
    effectiveAction,
    effectiveOutcome,
    cursorPayload,
  };
}

export async function listAuditEvents(
  input: ListAuditEventsInput = {},
  prismaClient?: any
): Promise<ListAuditEventsResult> {
  let normalizedParams;
  try {
    normalizedParams = validateAndNormalizeAuditParams(input);
  } catch (err) {
    if (err instanceof AuditValidationError) {
      return {
        ok: false,
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tham số yêu cầu không hợp lệ.',
        },
      };
    }
    return {
      ok: false,
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Tham số yêu cầu không hợp lệ.',
      },
    };
  }

  const { effectiveFrom, effectiveTo, effectiveAction, effectiveOutcome, cursorPayload } =
    normalizedParams;

  try {
    const prisma = prismaClient || getProductPrisma();
    const conditions = [
      Prisma.sql`occurred_at >= ${effectiveFrom}::timestamptz`,
      Prisma.sql`occurred_at < ${effectiveTo}::timestamptz`,
    ];

    if (cursorPayload) {
      conditions.push(
        Prisma.sql`(occurred_at, id) < (${cursorPayload.t}::timestamptz, ${cursorPayload.id}::uuid)`
      );
    }

    if (effectiveAction) {
      if (effectiveAction === 'OTHER') {
        conditions.push(
          Prisma.sql`action NOT IN ('TEACHER_PROVISIONED', 'TEACHER_DISABLED', 'TEACHER_ENABLED', 'TEACHER_ACTIVATED', 'LEARNER_BOOTSTRAPPED')`
        );
      } else {
        conditions.push(Prisma.sql`action = ${effectiveAction}`);
      }
    }

    if (effectiveOutcome) {
      conditions.push(Prisma.sql`outcome = ${effectiveOutcome}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        id::text,
        to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "occurredAt",
        CASE
          WHEN actor_kind = 'ACCOUNT' THEN 'ACCOUNT'
          WHEN actor_kind = 'VERIFIED_AUTH_SUBJECT' THEN 'VERIFIED_AUTH_SUBJECT'
          WHEN actor_kind = 'SYSTEM' THEN 'SYSTEM'
          ELSE 'OTHER'
        END AS "actorKind",
        actor_id::text AS "actorId",
        CASE
          WHEN action IN ('TEACHER_PROVISIONED', 'TEACHER_DISABLED', 'TEACHER_ENABLED', 'TEACHER_ACTIVATED', 'LEARNER_BOOTSTRAPPED') THEN action
          ELSE 'OTHER'
        END AS "action",
        CASE
          WHEN target_type = 'ACCOUNT' THEN 'ACCOUNT'
          ELSE 'OTHER'
        END AS "targetType",
        target_id::text AS "targetId",
        CASE
          WHEN outcome IN ('SUCCESS', 'DENIED', 'FAILURE') THEN outcome
          ELSE 'OTHER'
        END AS "outcome"
      FROM app_private.audit_events
      ${whereClause}
      ORDER BY occurred_at DESC, id DESC
      LIMIT ${FETCH_LIMIT}
    `);

    const rawRows = (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];

    const hasMore = rawRows.length > PAGE_SIZE;
    const pageRows = hasMore ? rawRows.slice(0, PAGE_SIZE) : rawRows;

    const data: AuditEventDto[] = pageRows.map((r) => {
      const actorKind = KNOWN_ACTOR_KINDS.includes(r.actorKind as (typeof KNOWN_ACTOR_KINDS)[number])
        ? (r.actorKind as AuditEventActorKind)
        : 'OTHER';

      const action = KNOWN_ACTIONS.includes(r.action as (typeof KNOWN_ACTIONS)[number])
        ? (r.action as AuditEventAction)
        : 'OTHER';

      const targetType = KNOWN_TARGET_TYPES.includes(r.targetType as (typeof KNOWN_TARGET_TYPES)[number])
        ? (r.targetType as AuditEventTargetType)
        : 'OTHER';

      const outcome = KNOWN_OUTCOMES.includes(r.outcome as (typeof KNOWN_OUTCOMES)[number])
        ? (r.outcome as AuditEventOutcome)
        : 'OTHER';

      return {
        id: String(r.id),
        occurredAt: String(r.occurredAt),
        actorKind,
        actorId: r.actorId ? String(r.actorId) : null,
        action,
        targetType,
        targetId: r.targetId ? String(r.targetId) : null,
        outcome,
      };
    });

    let nextCursor: string | null = null;
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1];
      nextCursor = encodeCursor({
        v: 1,
        t: lastRow.occurredAt,
        id: lastRow.id,
        from: effectiveFrom,
        to: effectiveTo,
        action: effectiveAction,
        outcome: effectiveOutcome,
      });
    }

    const filters: AuditFilters = {
      from: effectiveFrom,
      to: effectiveTo,
      action: effectiveAction,
      outcome: effectiveOutcome,
    };

    return {
      ok: true,
      status: 200,
      data,
      filters,
      nextCursor,
    };
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      return {
        ok: false,
        status: 503,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
        },
      };
    }

    return {
      ok: false,
      status: 500,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống khi đọc nhật ký hoạt động.',
      },
    };
  }
}
