// =============================================================================
// Safe DB error description for logs.
// Prisma error messages can contain connection strings, hosts and file paths, so
// the raw message is NEVER logged. We emit only:
//   - category: Prisma P-code, ENGINE_NOT_FOUND, or UNAVAILABLE
//   - errorName: the error class name when it is a plain identifier
//   - reason: a label chosen from a fixed allowlist by matching the message
// =============================================================================

const REASON_PATTERNS: Array<[RegExp, string]> = [
  [/max(?:imum)? clients? reached|MaxClientsInSessionMode|pool_size/i, 'POOL_MAX_CLIENTS'],
  [/too many (?:connections|clients)|remaining connection slots/i, 'TOO_MANY_CONNECTIONS'],
  [/timed out fetching a new connection|connection pool/i, 'POOL_TIMEOUT'],
  [/prepared statement .* (?:already exists|does not exist)/i, 'PREPARED_STATEMENT'],
  [/can't reach database server|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i, 'UNREACHABLE'],
  [/ETIMEDOUT|timed? ?out|statement timeout|canceling statement/i, 'TIMEOUT'],
  [/password authentication failed|authentication failed|SASL/i, 'AUTH_FAILED'],
  [/\bSSL\b|TLS|certificate/i, 'TLS'],
  [/connection (?:terminated|closed|reset)|server closed the connection|ECONNRESET/i, 'CONNECTION_CLOSED'],
  [/could not locate the Query Engine/i, 'ENGINE_NOT_FOUND'],
  [/Unknown (?:argument|field)|Invalid `prisma\.|Argument .* is missing/i, 'CLIENT_VALIDATION'],
  [/(?:relation|table|column) .* does not exist|does not exist in the current database/i, 'MISSING_DB_OBJECT'],
  [/DATABASE_URL is not configured|Environment variable not found/i, 'MISSING_ENV'],
];

export interface SafeDbErrorInfo {
  category: string;
  errorName: string;
  reason: string;
}

export function describeDbError(error: unknown): SafeDbErrorInfo {
  const details = error as { code?: unknown; errorCode?: unknown; message?: unknown; name?: unknown } | null;
  const candidate = details?.code || details?.errorCode;
  const code = typeof candidate === 'string' && /^P\d{4}$/.test(candidate) ? candidate : null;
  const message = typeof details?.message === 'string' ? details.message : '';
  const reason = REASON_PATTERNS.find(([pattern]) => pattern.test(message))?.[1] ?? 'OTHER';
  const name = typeof details?.name === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(details.name)
    ? details.name
    : 'Unknown';
  return {
    category: reason === 'ENGINE_NOT_FOUND' ? 'ENGINE_NOT_FOUND' : code || 'UNAVAILABLE',
    errorName: name,
    reason,
  };
}
