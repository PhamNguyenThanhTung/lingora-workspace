import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  buildAuthResponseHeaders,
} from '../../../../server/auth/index.ts';
import {
  listTeacherAssignedLessons,
} from '../../../../server/lessons/index.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'TEACHER',
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

  // Exact Teacher check: Admin is strictly forbidden on Teacher endpoints
  if (authResult.account.role !== 'TEACHER') {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ giáo viên mới có quyền truy cập phân hệ này.',
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

  const result = await listTeacherAssignedLessons(authResult.account.id);
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
