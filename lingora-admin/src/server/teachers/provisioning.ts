import 'server-only';
import { randomUUID } from 'node:crypto';
import { getProductPrisma } from '../db/index.js';
import { getPrivilegedSupabaseClient } from '../auth/privileged.ts';
import type { TeacherDto } from './index.ts';

/**
 * Retrieves and validates the fixed application origin for invite links.
 * Requires HTTPS in production; allows HTTP strictly on localhost/127.0.0.1.
 */
export function getAppOrigin(): string | null {
  const origin = process.env.LINGORA_APP_ORIGIN;
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'https:' || (isLocalhost && url.protocol === 'http:')) {
      return url.origin;
    }
    return null;
  } catch {
    return null;
  }
}



const fail = (status: number, code: string, message: string) => ({ ok: false as const, status, error: { code, message } });
class ProvisionFailure extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 503) { super(code); this.code = code; this.status = status; }
}
const ownIdentity = (user: any, request: any) => user?.id === request.providerCorrelationId
  && user.email?.trim().toLowerCase() === request.normalizedEmail
  && user.app_metadata?.operationKey === request.operationKey
  && user.app_metadata?.ownedBy === 'lingora-provisioning';

async function inspect(client: any, id: string) {
  const { data, error } = await client.auth.admin.getUserById(id);
  if (error && error.status !== 404) throw new ProvisionFailure('PROVIDER_UNAVAILABLE');
  return error ? null : data?.user || null;
}

/** Only the persisted plan plus server-managed ownership marker permits compensation. */
async function compensate(prisma: any, client: any, request: any, code: string) {
  let deletionStarted = false;
  try {
    const user = await inspect(client, request.providerCorrelationId);
    if (user && !ownIdentity(user, request)) throw new ProvisionFailure('OWNERSHIP_CONFLICT');
    await prisma.$transaction(async (tx: any) => {
      const current = await tx.provisioningRequest.findUnique({ where: { id: request.id } });
      if (!current || current.state === 'READY') throw new ProvisionFailure('FINAL_STATE_UNCERTAIN');
      await tx.$queryRaw`SELECT id FROM app.accounts WHERE id = ${request.providerCorrelationId}::uuid FOR UPDATE`;
      const account = await tx.account.findUnique({ where: { id: request.providerCorrelationId } });
      if (account) {
        if (!user || account.role !== 'TEACHER' || account.status !== 'PENDING' || account.activatedAt) {
          throw new ProvisionFailure('ACCOUNT_NOT_DISPOSABLE');
        }
        const removed = await tx.account.deleteMany({ where: {
          id: account.id, role: 'TEACHER', status: 'PENDING', activatedAt: null, rowVersion: account.rowVersion,
        } });
        if (removed.count !== 1) throw new ProvisionFailure('ACCOUNT_NOT_DISPOSABLE');
      }
      const released = await tx.provisioningRequest.updateMany({
        where: { id: request.id, state: { not: 'READY' } },
        data: { authUserId: null, state: 'REQUESTED', lastErrorCode: code, rowVersion: { increment: 1 } },
      });
      if (released.count !== 1) throw new ProvisionFailure('RECOVERY_WRITE_FAILED');
    });
    if (user) {
      deletionStarted = true;
      const { error } = await client.auth.admin.deleteUser(user.id);
      if (error && error.status !== 404) throw new ProvisionFailure('IDENTITY_CLEANUP_FAILED');
    }
    const finished = await prisma.provisioningRequest.updateMany({
      where: { id: request.id, state: 'REQUESTED' },
      data: { state: 'FAILED_RETRYABLE', lastErrorCode: code, rowVersion: { increment: 1 } },
    });
    if (finished.count !== 1) throw new ProvisionFailure('RECOVERY_WRITE_FAILED');
    return true;
  } catch {
    // An uncertain delete must not race a retry that could recreate the same planned UUID.
    try {
      await prisma.provisioningRequest.updateMany({
        where: { id: request.id, state: { not: 'READY' } },
        data: { state: deletionStarted ? 'REQUESTED' : 'FAILED_RETRYABLE', lastErrorCode: 'RECOVERY_REQUIRED', rowVersion: { increment: 1 } },
      });
    } catch { /* Existing durable REQUESTED/IDENTITY_CREATED plan remains discoverable. */ }
    return false;
  }
}

export async function provisionTeacher(
  actorId: string, input: { email: string; displayName?: string | null }, prismaClient?: any,
): Promise<{ ok: boolean; status: number; data?: TeacherDto; message?: string; error?: { code: string; message: string } }> {
  const origin = getAppOrigin();
  let client;
  try { client = getPrivilegedSupabaseClient(); } catch { /* Invalid configuration is unavailable, before writes. */ }
  if (!origin || !client) return fail(503, 'SERVICE_UNAVAILABLE', 'Cấu hình dịch vụ cấp phát chưa sẵn sàng.');
  const prisma = prismaClient || getProductPrisma();
  const email = input.email.trim().toLowerCase();
  let request: any;
  try {
    request = await prisma.provisioningRequest.findUnique({ where: { normalizedEmail: email } });
    if (request) {
      if (request.requestedRole !== 'TEACHER' || request.state === 'READY') {
        return fail(409, 'DUPLICATE_EMAIL', 'Email đã có tài khoản hoặc lời mời.');
      }
      if (request.state !== 'FAILED_RETRYABLE') return fail(409, 'PROVISIONING_IN_PROGRESS', 'Yêu cầu đang xử lý hoặc cần kiểm tra trước khi thử lại.');
      if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(request.providerCorrelationId || '')) {
        return fail(409, 'RECOVERY_REQUIRED', 'Yêu cầu cần được kiểm tra trên máy chủ trước khi thử lại.');
      }
      const claimed = await prisma.provisioningRequest.updateMany({
        where: { id: request.id, state: 'FAILED_RETRYABLE', rowVersion: request.rowVersion },
        data: { state: 'REQUESTED', lastErrorCode: null, rowVersion: { increment: 1 } },
      });
      if (claimed.count !== 1) return fail(409, 'PROVISIONING_IN_PROGRESS', 'Yêu cầu đang được xử lý.');
    } else {
      // Do not adopt an Auth-only identity, including an existing unconfirmed user.
      const existing = await prisma.$queryRaw`SELECT id FROM auth.users WHERE LOWER(email) = ${email}`;
      if (existing.length) return fail(409, 'DUPLICATE_EMAIL', 'Email đã tồn tại trong dịch vụ xác thực.');
      request = await prisma.provisioningRequest.create({ data: {
        operationKey: randomUUID(), normalizedEmail: email, requestedRole: 'TEACHER', requestedBy: actorId,
        state: 'REQUESTED', providerCorrelationId: randomUUID(),
      } });
    }
  } catch (error: any) {
    return error?.code === 'P2002'
      ? fail(409, 'PROVISIONING_IN_PROGRESS', 'Email đang có yêu cầu cấp phát.')
      : fail(503, 'SERVICE_UNAVAILABLE', 'Không thể ghi nhận yêu cầu cấp phát.');
  }

  const plannedId = request.providerCorrelationId;
  try {
    let user = await inspect(client, plannedId);
    if (user && !ownIdentity(user, request)) throw new ProvisionFailure('OWNERSHIP_CONFLICT', 409);
    if (!user) {
      // An app-only row is never repaired by recreating its Auth identity.
      if (await prisma.account.findUnique({ where: { id: plannedId } })) throw new ProvisionFailure('ORPHAN_ACCOUNT', 409);
      const created = await client.auth.admin.createUser({
        id: plannedId, email, email_confirm: false,
        app_metadata: { operationKey: request.operationKey, ownedBy: 'lingora-provisioning' },
      });
      if (created.error) {
        const duplicate = created.error.code === 'email_exists' || created.error.code === 'email_address_already_exists'
          || /already (registered|exists)/i.test(created.error.message || '');
        throw new ProvisionFailure(duplicate ? 'DUPLICATE_EMAIL' : 'IDENTITY_CREATE_FAILED', duplicate ? 409 : 503);
      }
      if (created.data?.user?.id !== plannedId) throw new ProvisionFailure('PROVIDER_ID_MISMATCH');
      user = created.data.user;
    }
    const tracked = await prisma.provisioningRequest.updateMany({
      where: { id: request.id, state: 'REQUESTED' },
      data: { authUserId: plannedId, state: 'IDENTITY_CREATED', rowVersion: { increment: 1 } },
    });
    if (tracked.count !== 1) throw new ProvisionFailure('IDENTITY_TRACKING_FAILED');
    let account = await prisma.account.findUnique({ where: { id: plannedId } });
    if (account && (account.role !== 'TEACHER' || account.status !== 'PENDING' || account.activatedAt)) {
      throw new ProvisionFailure('ACCOUNT_NOT_DISPOSABLE', 409);
    }
    if (!account) {
      account = await prisma.account.create({ data: {
        id: plannedId, role: 'TEACHER', status: 'PENDING', displayName: input.displayName?.trim() || null,
        uiLocale: 'en', timezone: 'UTC',
      } });
    }
    const invited = await client.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/activate-teacher` });
    if (invited.error || invited.data?.user?.id !== plannedId) throw new ProvisionFailure('INVITATION_FAILED');
    await prisma.$transaction(async (tx: any) => {
      const ready = await tx.provisioningRequest.updateMany({
        where: { id: request.id, state: 'IDENTITY_CREATED', authUserId: plannedId },
        data: { state: 'READY', lastErrorCode: null, rowVersion: { increment: 1 } },
      });
      if (ready.count !== 1) throw new ProvisionFailure('FINALIZATION_FAILED');
      await tx.auditEvent.create({ data: {
        actorKind: 'ACCOUNT', actorId, action: 'TEACHER_PROVISIONED', targetType: 'ACCOUNT', targetId: plannedId, outcome: 'SUCCESS',
      } });
    });
    return { ok: true, status: 201, message: 'Đã gửi lời mời, chờ kích hoạt', data: {
      id: account.id, email, displayName: account.displayName, role: 'TEACHER', status: 'PENDING',
      createdAt: account.createdAt.toISOString(), activatedAt: null,
    } };
  } catch (error) {
    const code = error instanceof ProvisionFailure ? error.code : 'PROVISIONING_FAILED';
    const recovered = await compensate(prisma, client, request, code);
    if (!recovered || code === 'PROVIDER_ID_MISMATCH') return fail(503, 'RECOVERY_REQUIRED', 'Cấp phát chưa hoàn tất; cần kiểm tra hoặc thử lại yêu cầu trên máy chủ.');
    return fail(error instanceof ProvisionFailure ? error.status : 503, code, 'Cấp phát không thành công; tài nguyên tạm đã được thu hồi. Có thể thử lại.');
  }
}
