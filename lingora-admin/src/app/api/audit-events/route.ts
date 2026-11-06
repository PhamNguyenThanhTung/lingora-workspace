import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  buildAuthResponseHeaders,
} from '../../../server/auth/index.ts';
import { listAuditEvents } from '../../../server/audit/index.ts';

export const dynamic = 'force-dynamic';

const ALLOWED_QUERY_PARAMS = new Set(['from', 'to', 'action', 'outcome', 'cursor']);

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sdkHeaders = new Headers();

  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: sdkHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(
    undefined,
    Object.fromEntries(sdkHeaders.entries())
  );
  responseHeaders.set('Cache-Control', 'no-store, private');

  if (!authResult.ok) {
    return Response.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: responseHeaders,
      }
    );
  }

  const url = new URL(request.url);

  for (const key of url.searchParams.keys()) {
    if (!ALLOWED_QUERY_PARAMS.has(key) || url.searchParams.getAll(key).length > 1) {
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tham số yêu cầu không hợp lệ.',
          },
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }
  }

  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  const action = url.searchParams.get('action') ?? undefined;
  const outcome = url.searchParams.get('outcome') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const result = await listAuditEvents({ from, to, action, outcome, cursor });

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(
    {
      data: result.data,
      filters: result.filters,
      nextCursor: result.nextCursor,
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
