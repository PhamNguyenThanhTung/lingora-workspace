import { z } from 'zod';
import { getLearnerPrisma } from '../db/index.ts';
import { isProviderAvailabilityError } from './index.ts';

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email không đúng định dạng').max(255, 'Email quá dài'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(72, 'Mật khẩu quá dài. Vui lòng rút ngắn mật khẩu.'),
    displayName: z
      .string()
      .trim()
      .max(100, 'Tên hiển thị tối đa 100 ký tự')
      .optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export type BootstrapLearnerResult =
  | { ok: true; account: any; created: boolean }
  | { ok: false; status: 401 | 403 | 503; error: { code: string; message: string } };

/**
 * Checks whether Supabase app_metadata contains server-private staff provisioning markers.
 */
export function hasStaffAppMetadata(appMetadata: any): boolean {
  if (!appMetadata || typeof appMetadata !== 'object') return false;
  if (appMetadata.ownedBy === 'lingora-provisioning') return true;
  if (Boolean(appMetadata.operationKey)) return true;
  const role = String(appMetadata.role || '').toUpperCase();
  if (role === 'TEACHER' || role === 'ADMIN' || role === 'STAFF') return true;
  return false;
}

/**
 * Narrow confirmed password-login Account bootstrap.
 *
 * 1. Independently obtains fresh getUser() from authClient; requires email and email_confirmed_at.
 * 2. If Account already exists, does not alter any field; existing verifier remains authoritative.
 * 3. For missing UUID: transactionally rejects trusted private app_metadata staff marker and
 *    any private ProvisioningRequest matched by normalized verified email, authUserId or providerCorrelationId.
 * 4. Inserts fixed LEARNER/ACTIVE with schema defaults and activation time; ON CONFLICT DO NOTHING then re-reads.
 * 5. On successful creation, appends append-only AuditEvent.
 */
export async function bootstrapLearnerAccount(options: {
  authClient: {
    auth: {
      getUser: () => Promise<{
        data: {
          user: {
            id: string;
            email?: string;
            email_confirmed_at?: string | null;
            app_metadata?: any;
            user_metadata?: any;
          } | null;
        } | null;
        error: any;
      }>;
    };
  };
  prisma?: any;
}): Promise<BootstrapLearnerResult> {
  let userResult;
  try {
    userResult = await options.authClient.auth.getUser();
  } catch (err) {
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
      },
    };
  }

  if (userResult.error || !userResult.data?.user) {
    if (isProviderAvailabilityError(userResult?.error)) {
      return {
        ok: false,
        status: 503,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      };
    }
    return {
      ok: false,
      status: 401,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
      },
    };
  }

  const user = userResult.data.user;

  // Strict email confirmation enforcement
  if (!user.email || !user.email_confirmed_at) {
    return {
      ok: false,
      status: 403,
      error: {
        code: 'FORBIDDEN',
        message: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư để xác thực email trước khi đăng nhập.',
      },
    };
  }

  const prisma = options.prisma || getLearnerPrisma();
  if (!prisma || typeof prisma.account?.findUnique !== 'function') {
    console.error('learner.bootstrap_prisma_invalid', { category: 'UNAVAILABLE' });
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }

  // Fast check if Account already exists (without modifying anything)
  try {
    const existing = await prisma.account.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, status: true, displayName: true, uiLocale: true },
    });
    if (existing) {
      return {
        ok: true,
        account: existing,
        created: false,
      };
    }
  } catch (error) {
    console.error('learner.bootstrap_lookup_failed', { category: 'UNAVAILABLE' });
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }

  // Account does not exist: require real Prisma transaction capability
  if (typeof prisma.$transaction !== 'function') {
    console.error('learner.bootstrap_prisma_nontransactional', { category: 'UNAVAILABLE' });
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }

  // Perform transactional insertion with guard checks
  try {
    return await prisma.$transaction(async (tx: any) => {
      if (
        !tx ||
        typeof tx.account?.findUnique !== 'function' ||
        typeof tx.provisioningRequest?.findFirst !== 'function' ||
        typeof tx.$executeRaw !== 'function'
      ) {
        throw new Error('Prisma transaction client lacks required transactional methods');
      }

      // Re-check existing in tx
      const txExisting = await tx.account.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, status: true, displayName: true, uiLocale: true },
      });
      if (txExisting) {
        return {
          ok: true,
          account: txExisting,
          created: false,
        };
      }

      // Reject trusted private app_metadata staff marker
      if (hasStaffAppMetadata(user.app_metadata)) {
        return {
          ok: false,
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản nhân sự không được khởi tạo qua phân hệ học viên.',
          },
        };
      }

      // Transactionally reject private ProvisioningRequest matches
      const normalizedEmail = user.email!.trim().toLowerCase();
      const staffReservation = await tx.provisioningRequest.findFirst({
        where: {
          OR: [
            { normalizedEmail },
            { authUserId: user.id },
            { providerCorrelationId: user.id },
          ],
        },
      });

      if (staffReservation) {
        return {
          ok: false,
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản nhân sự không được khởi tạo qua phân hệ học viên.',
          },
        };
      }

      // Insert fixed LEARNER/ACTIVE with schema defaults and activation time; ON CONFLICT DO NOTHING then re-read
      const displayName =
        typeof user.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name.trim().slice(0, 100)
          : typeof user.user_metadata?.displayName === 'string'
          ? user.user_metadata.displayName.trim().slice(0, 100)
          : null;

      const insertedCount = await tx.$executeRaw`
        INSERT INTO app.accounts (
          id,
          role,
          status,
          display_name,
          ui_locale,
          timezone,
          activated_at,
          created_at,
          updated_at,
          row_version
        ) VALUES (
          ${user.id}::uuid,
          'LEARNER',
          'ACTIVE',
          ${displayName || null},
          'en',
          'UTC',
          NOW(),
          NOW(),
          NOW(),
          1
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      if (insertedCount === 1) {
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
            ${user.id}::uuid,
            'LEARNER_BOOTSTRAPPED',
            'ACCOUNT',
            ${user.id}::uuid,
            'SUCCESS',
            NOW(),
            NOW()
          );
        `;
      }

      // Re-read account
      const finalAccount = await tx.account.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, status: true, displayName: true, uiLocale: true },
      });

      if (!finalAccount) {
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
        ok: true,
        account: finalAccount,
        created: insertedCount === 1,
      };
    });
  } catch (err: unknown) {
    console.error('learner.bootstrap_tx_failed', { category: 'UNAVAILABLE' });
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
