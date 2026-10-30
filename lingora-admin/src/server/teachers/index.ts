import 'server-only';
import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';

export interface TeacherDto {
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'TEACHER';
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  createdAt: string;
  activatedAt: string | null;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export { isValidUuid } from '../frameworks/index.ts';
import { isValidUuid } from '../frameworks/index.ts';
export const normalizeUuid = (id: string) => id.toLowerCase();

export { getAppOrigin } from './provisioning.ts';

export const createTeacherSchema = z
  .object({
    email: z
      .string({ message: 'Email là bắt buộc' })
      .trim()
      .toLowerCase()
      .email('Địa chỉ email không đúng định dạng')
      .max(255, 'Email không được vượt quá 255 ký tự'),
    displayName: z
      .string()
      .trim()
      .max(100, 'Tên hiển thị không được vượt quá 100 ký tự')
      .optional()
      .nullable(),
  })
  .strict();

export const updateTeacherStatusSchema = z
  .object({
    action: z.enum(['enable', 'disable'], {
      message: 'Thao tác trạng thái chỉ có thể là enable hoặc disable',
    }),
    reason: z.string().trim().max(1000, 'Lý do không được vượt quá 1000 ký tự').optional(),
  })
  .strict()
  .refine(
    (val) => {
      if (val.action === 'disable') {
        return typeof val.reason === 'string' && val.reason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Lý do vô hiệu hóa là bắt buộc và không được để trống',
      path: ['reason'],
    }
  );

export const activateTeacherSchema = z
  .object({
    password: z
      .string({ message: 'Mật khẩu là bắt buộc' })
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(72, 'Mật khẩu quá dài. Vui lòng rút ngắn mật khẩu.')
      .refine((password) => new TextEncoder().encode(password).length <= 72, 'Mật khẩu quá dài. Vui lòng rút ngắn mật khẩu.'),
  })
  .strict();

/**
 * Lists all Teacher accounts with their authoritative Auth email via single LEFT JOIN.
 * Excludes non-teacher accounts. Null email indicates broken/missing Auth identity.
 */
export async function listTeachers(prismaClient?: any): Promise<{
  ok: boolean;
  status: number;
  data?: TeacherDto[];
  error?: { code: string; message: string };
}> {
  const prisma = prismaClient || getProductPrisma();
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        a.id::text,
        u.email,
        a.display_name AS "displayName",
        a.role,
        a.status,
        a.created_at AS "createdAt",
        a.activated_at AS "activatedAt"
      FROM app.accounts a
      LEFT JOIN auth.users u ON a.id = u.id
      WHERE a.role = 'TEACHER'
      ORDER BY a.created_at DESC
    `;

    const teachers: TeacherDto[] = (rows as any[]).map((r) => ({
      id: r.id,
      email: r.email || null,
      displayName: r.displayName || null,
      role: 'TEACHER',
      status: r.status as 'PENDING' | 'ACTIVE' | 'DISABLED',
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString(),
      activatedAt: r.activatedAt
        ? r.activatedAt instanceof Date
          ? r.activatedAt.toISOString()
          : new Date(r.activatedAt).toISOString()
        : null,
    }));

    return {
      ok: true,
      status: 200,
      data: teachers,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

/**
 * Transitions Teacher status between ACTIVE and DISABLED.
 * Rejects transitions from PENDING, mutations of non-Teachers, orphans, or self-mutation.
 * Idempotent if target already in requested state.
 */
export async function updateTeacherStatus(
  adminAccountId: string,
  teacherId: string,
  input: { action: 'enable' | 'disable'; reason?: string },
  prismaClient?: any
): Promise<{
  ok: boolean;
  status: number;
  data?: TeacherDto;
  error?: { code: string; message: string; fields?: Record<string, string> };
}> {
  if (!isValidUuid(teacherId)) {
    return {
      ok: false,
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh tài khoản không hợp lệ.',
      },
    };
  }

  const targetId = normalizeUuid(teacherId);

  // Self mutation protection
  if (targetId === normalizeUuid(adminAccountId)) {
    return {
      ok: false,
      status: 409,
      error: {
        code: 'SELF_MUTATION_FORBIDDEN',
        message: 'Quản trị viên không thể tự thay đổi trạng thái của chính mình.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Row lock on target account with joined auth user
      const rows = await tx.$queryRaw`
        SELECT
          a.id::text,
          a.role,
          a.status,
          a.display_name AS "displayName",
          a.created_at AS "createdAt",
          a.activated_at AS "activatedAt",
          a.row_version AS "rowVersion",
          u.id::text AS "authId",
          u.email
        FROM app.accounts a
        LEFT JOIN auth.users u ON a.id = u.id
        WHERE a.id = ${targetId}::uuid
        FOR UPDATE OF a
      `;

      const list = rows as any[];
      if (list.length === 0) {
        return {
          ok: false,
          status: 404,
          error: {
            code: 'TEACHER_NOT_FOUND',
            message: 'Không tìm thấy tài khoản giáo viên trong hệ thống.',
          },
        };
      }

      const target = list[0];

      // Reject non-Teacher
      if (target.role !== 'TEACHER') {
        return {
          ok: false,
          status: 409,
          error: {
            code: 'INVALID_TARGET_ROLE',
            message: 'Tài khoản mục tiêu không thuộc vai trò Giáo viên.',
          },
        };
      }

      // Reject orphan account (missing Auth identity)
      if (!target.authId) {
        return {
          ok: false,
          status: 409,
          error: {
            code: 'ORPHAN_ACCOUNT',
            message: 'Tài khoản giáo viên không có định danh xác thực tương ứng trong hệ thống.',
          },
        };
      }

      // Reject transitions from PENDING
      if (target.status === 'PENDING') {
        return {
          ok: false,
          status: 409,
          error: {
            code: 'INVALID_TRANSITION',
            message: 'Tài khoản đang ở trạng thái chờ kích hoạt, không thể thay đổi trạng thái trực tiếp.',
          },
        };
      }

      const targetStatus = input.action === 'enable' ? 'ACTIVE' : 'DISABLED';

      // Idempotent: same requested end state returns authoritative DTO without bumping version or audit
      if (target.status === targetStatus) {
        const dto: TeacherDto = {
          id: target.id,
          email: target.email || null,
          displayName: target.displayName || null,
          role: 'TEACHER',
          status: target.status,
          createdAt: target.createdAt instanceof Date ? target.createdAt.toISOString() : new Date(target.createdAt).toISOString(),
          activatedAt: target.activatedAt
            ? target.activatedAt instanceof Date
              ? target.activatedAt.toISOString()
              : new Date(target.activatedAt).toISOString()
            : null,
        };
        return { ok: true, status: 200, data: dto };
      }

      // Validate non-blank reason when disabling
      let trimmedReason: string | null = null;
      if (input.action === 'disable') {
        trimmedReason = (input.reason || '').trim();
        if (!trimmedReason) {
          return {
            ok: false,
            status: 400,
            error: {
              code: 'MISSING_DISABLE_REASON',
              message: 'Lý do vô hiệu hóa là bắt buộc và không được để trống.',
              fields: { reason: 'Lý do vô hiệu hóa là bắt buộc.' },
            },
          };
        }
      } else {
        trimmedReason = input.reason ? input.reason.trim() : null;
      }

      // Atomic update with exact current status selector
      const updatedCount = await tx.$executeRaw`
        UPDATE app.accounts
        SET status = ${targetStatus},
            row_version = row_version + 1,
            updated_at = NOW()
        WHERE id = ${targetId}::uuid
          AND role = 'TEACHER'
          AND status = ${target.status}
      `;

      if (updatedCount === 0) {
        return {
          ok: false,
          status: 409,
          error: {
            code: 'CONCURRENT_MUTATION',
            message: 'Trạng thái tài khoản đã thay đổi trong quá trình xử lý. Vui lòng tải lại.',
          },
        };
      }

      // Atomic audit event
      const auditAction = input.action === 'disable' ? 'TEACHER_DISABLED' : 'TEACHER_ENABLED';
      await tx.$executeRaw`
        INSERT INTO app_private.audit_events (
          id,
          actor_kind,
          actor_id,
          action,
          target_type,
          target_id,
          outcome,
          reason,
          occurred_at,
          created_at
        ) VALUES (
          gen_random_uuid(),
          'ACCOUNT',
          ${adminAccountId}::uuid,
          ${auditAction},
          'ACCOUNT',
          ${targetId}::uuid,
          'SUCCESS',
          ${trimmedReason},
          NOW(),
          NOW()
        )
      `;

      const dto: TeacherDto = {
        id: target.id,
        email: target.email || null,
        displayName: target.displayName || null,
        role: 'TEACHER',
        status: targetStatus,
        createdAt: target.createdAt instanceof Date ? target.createdAt.toISOString() : new Date(target.createdAt).toISOString(),
        activatedAt: target.activatedAt
          ? target.activatedAt instanceof Date
            ? target.activatedAt.toISOString()
            : new Date(target.activatedAt).toISOString()
          : null,
      };

      return { ok: true, status: 200, data: dto };
    });

    return result;
  } catch (err) {
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export { provisionTeacher } from './provisioning.ts';

/**
 * Checks eligibility of an invited Teacher for first-use password activation.
 */
export async function verifyTeacherActivationEligibility(
  authUserId: string,
  prismaClient?: any
): Promise<{
  ok: boolean;
  status: number;
  data?: { id: string; email: string; displayName: string | null };
  error?: { code: string; message: string };
}> {
  const prisma = prismaClient || getProductPrisma();
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        a.id::text,
        a.role,
        a.status,
        a.display_name AS "displayName",
        u.email,
        u.email_confirmed_at AS "emailConfirmedAt",
        r.requested_role AS "requestedRole",
        r.state AS "provisioningState"
      FROM app.accounts a
      JOIN auth.users u ON a.id = u.id
      LEFT JOIN app_private.provisioning_requests r ON a.id = r.auth_user_id
      WHERE a.id = ${authUserId}::uuid
    `;

    const list = rows as any[];
    if (list.length === 0) {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Tài khoản chưa được khởi tạo phân quyền giáo viên.',
        },
      };
    }

    const row = list[0];

    if (row.role !== 'TEACHER') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ tài khoản Giáo viên mới được phép kích hoạt tại đây.',
        },
      };
    }

    if (row.status === 'ACTIVE') {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'ALREADY_ACTIVE',
          message: 'Tài khoản đã được kích hoạt trước đó. Vui lòng đăng nhập.',
        },
      };
    }

    if (row.status === 'DISABLED') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đã bị vô hiệu hóa.',
        },
      };
    }

    if (row.status !== 'PENDING') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Trạng thái tài khoản không hợp lệ để kích hoạt.',
        },
      };
    }

    if (!row.emailConfirmedAt || row.requestedRole !== 'TEACHER' || row.provisioningState !== 'READY') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'UNREADY_PROVISIONING',
          message: 'Yêu cầu cấp phát tài khoản chưa ở trạng thái sẵn sàng kích hoạt.',
        },
      };
    }

    return {
      ok: true,
      status: 200,
      data: {
        id: row.id,
        email: row.email,
        displayName: row.displayName || null,
      },
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

/**
 * Activates Teacher account with self-set password:
 * 1. Verifies eligibility.
 * 2. Calls user-scoped authClient.auth.updateUser({ password }) to set password.
 * 3. Atomically sets Account status = 'ACTIVE', sets activatedAt, bumps rowVersion, and records VERIFIED_AUTH_SUBJECT AuditEvent.
 */
export async function activateTeacherAccount(
  authUserId: string,
  password: string,
  authClient: { auth: { updateUser: (attr: { password: string }) => Promise<{ error: any }> } },
  prismaClient?: any
): Promise<{
  ok: boolean;
  status: number;
  redirect?: string;
  error?: { code: string; message: string; fields?: Record<string, string> };
}> {
  const prisma = prismaClient || getProductPrisma();
  let passwordChanged = false;
  try {
    return await prisma.$transaction(async (tx: any) => {
      // Serialize eligibility and provider password mutation, including concurrent activation requests.
      await tx.$queryRaw`SELECT id FROM app.accounts WHERE id = ${authUserId}::uuid FOR UPDATE`;
      const eligibility = await verifyTeacherActivationEligibility(authUserId, tx);
      if (!eligibility.ok) return eligibility;
      try {
        const { error } = await authClient.auth.updateUser({ password });
        if (error) return { ok: false, status: 400, error: {
          code: 'PASSWORD_REJECTED', message: 'Thiết lập mật khẩu không thành công. Kiểm tra yêu cầu mật khẩu rồi thử lại.',
        } };
        passwordChanged = true;
      } catch {
        return { ok: false, status: 503, error: { code: 'SERVICE_UNAVAILABLE', message: 'Không thể xác nhận thiết lập mật khẩu. Vui lòng thử lại.' } };
      }

      // Update to ACTIVE
      const updatedCount = await tx.$executeRaw`
        UPDATE app.accounts
        SET status = 'ACTIVE',
            activated_at = NOW(),
            row_version = row_version + 1,
            updated_at = NOW()
        WHERE id = ${authUserId}::uuid
          AND role = 'TEACHER'
          AND status = 'PENDING'
      `;

      if (updatedCount !== 1) throw new Error('ACTIVATION_CONFLICT');

      // Record VERIFIED_AUTH_SUBJECT AuditEvent (no actor Account FK!)
      await tx.$executeRaw`
        INSERT INTO app_private.audit_events (
          id,
          actor_kind,
          actor_id,
          verified_auth_subject_id,
          action,
          target_type,
          target_id,
          outcome,
          occurred_at,
          created_at
        ) VALUES (
          gen_random_uuid(),
          'VERIFIED_AUTH_SUBJECT',
          NULL,
          ${authUserId}::uuid,
          'TEACHER_ACTIVATED',
          'ACCOUNT',
          ${authUserId}::uuid,
          'SUCCESS',
          NOW(),
          NOW()
        )
      `;

      return {
        ok: true,
        status: 200,
        redirect: '/holding',
      };
    }, { timeout: 15000 });
  } catch {
    return {
      ok: false,
      status: 503,
      error: {
        code: passwordChanged ? 'ACTIVATION_RETRY_REQUIRED' : 'SERVICE_UNAVAILABLE',
        message: 'Chưa xác nhận hoàn tất kích hoạt. Vui lòng thử lại.',
      },
    };
  }
}
