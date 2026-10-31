import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  buildAuthResponseHeaders,
} from '../../../server/auth/index.ts';
import { getReviewQueue } from '../../../server/lessons/index.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!authResult.ok) {
    return Response.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: responseHeaders,
      }
    );
  }

  if (authResult.account.role !== 'ADMIN') {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền truy cập hàng đợi kiểm duyệt.',
        },
      },
      {
        status: 403,
        headers: responseHeaders,
      }
    );
  }

  if (authResult.account.status !== 'ACTIVE') {
    return Response.json(
      {
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      },
      {
        status: 403,
        headers: responseHeaders,
      }
    );
  }

  const result = await getReviewQueue(authResult.account.id);
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
