import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../server/auth/index.ts';
import {
  listCharacterCatalogue,
  createAdminCharacter,
} from '../../../server/characters/index.ts';

export const dynamic = 'force-dynamic';

const ALLOWED_QUERY_PARAMS = new Set([
  'languageId',
  'scriptType',
  'search',
  'limit',
  'offset',
]);

export async function GET(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();
  const cookieStore = await cookies();

  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(
    defaultHeaders,
    Object.fromEntries(refreshedHeaders.entries())
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
            message: 'Tham số truy vấn không hợp lệ.',
          },
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }
  }

  const queryInput = {
    languageId: url.searchParams.get('languageId') ?? undefined,
    scriptType: url.searchParams.get('scriptType') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    offset: url.searchParams.get('offset') ?? undefined,
  };

  const result = await listCharacterCatalogue(queryInput);
  if (result.error) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(result.data, {
    status: 200,
    headers: responseHeaders,
  });
}

export async function POST(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();

  if (!validateSameOrigin(request)) {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Yêu cầu bị từ chối do nguồn gốc (Origin) không hợp lệ.',
        },
      },
      {
        status: 403,
        headers: defaultHeaders,
      }
    );
  }

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(
    defaultHeaders,
    Object.fromEntries(refreshedHeaders.entries())
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

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Định dạng yêu cầu phải là application/json.',
        },
      },
      {
        status: 415,
        headers: responseHeaders,
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: 'MALFORMED_JSON',
          message: 'Dữ liệu JSON không hợp lệ.',
        },
      },
      {
        status: 400,
        headers: responseHeaders,
      }
    );
  }

  const result = await createAdminCharacter(body);
  if (result.error) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(result.data, {
    status: 201,
    headers: responseHeaders,
  });
}
