import { cookies } from 'next/headers.js';
import {
  buildAuthResponseHeaders,
  validateSameOrigin,
  verifyStaffIdentity,
} from '../auth/index.ts';

type AssessmentRole = 'ADMIN' | 'TEACHER';
type ServiceResult = { status: number; data?: unknown; error?: { code: string; message: string; fields?: Record<string, string> } };

interface AssessmentApiOptions {
  role: AssessmentRole;
  mutating?: boolean;
  readsJson?: boolean;
  action: (accountId: string, body: unknown) => Promise<ServiceResult>;
}

class PayloadTooLarge extends Error {}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing request body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1024 * 1024) {
        await reader.cancel();
        throw new PayloadTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function runAssessmentApi(request: Request, options: AssessmentApiOptions): Promise<Response> {
  const defaults = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();
  if (options.mutating && !validateSameOrigin(request)) {
    return Response.json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Yêu cầu bị từ chối do nguồn gốc (Origin) không hợp lệ.' } }, { status: 403, headers: defaults });
  }

  let body: unknown = undefined;
  if (options.readsJson) {
    if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
      return Response.json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Định dạng yêu cầu phải là application/json.' } }, { status: 415, headers: defaults });
    }
    try {
      body = await readJsonBody(request);
    } catch (error) {
      if (error instanceof PayloadTooLarge) {
        return Response.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Yêu cầu vượt quá 1 MiB.' } }, { status: 413, headers: defaults });
      }
      return Response.json({ error: { code: 'MALFORMED_JSON', message: 'Dữ liệu JSON không hợp lệ.' } }, { status: 400, headers: defaults });
    }
  }

  const authResult = await verifyStaffIdentity({
    cookieStore: await cookies(),
    requiredRole: options.role,
    responseHeaders: refreshedHeaders,
  });
  const headers = buildAuthResponseHeaders(defaults);
  refreshedHeaders.forEach((value, key) => headers.set(key, value));
  if (!authResult.ok) return Response.json({ error: authResult.error }, { status: authResult.status, headers });

  if (authResult.account.role !== options.role || authResult.account.status !== 'ACTIVE') {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'Tài khoản không có quyền truy cập phân hệ này.' } }, { status: 403, headers });
  }

  try {
    const result = await options.action(authResult.account.id, body);
    return Response.json(result.error ? { error: result.error } : result.data, { status: result.status, headers });
  } catch {
    return Response.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.' } }, { status: 503, headers });
  }
}
