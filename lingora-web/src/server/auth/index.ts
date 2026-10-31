import { createServerClient } from '@supabase/ssr';
import { getLearnerPrisma } from '../db/index.ts';
import { getSupabaseEnv, getLearnerCookieName } from './env.ts';

export { getSupabaseEnv, getLearnerCookieName };

export interface LearnerAccount {
  id: string;
  role: 'LEARNER';
  status: 'ACTIVE';
  displayName: string | null;
  uiLocale: string;
}

export interface VerifiedLearnerSuccess {
  ok: true;
  user: {
    id: string;
    email?: string;
  };
  account: LearnerAccount;
}

export interface VerifiedLearnerFailure {
  ok: false;
  status: 401 | 403 | 503;
  error: {
    code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'ACCOUNT_INACTIVE' | 'SERVICE_UNAVAILABLE';
    message: string;
  };
}

export type VerifiedLearnerResult = VerifiedLearnerSuccess | VerifiedLearnerFailure;

export interface CookieAdapter {
  get?: (...args: any[]) => any;
  getAll?: (...args: any[]) => any;
  setAll?: (...args: any[]) => any;
  set?: (...args: any[]) => any;
  delete?: (...args: any[]) => any;
  [key: string]: any;
}

/**
 * Creates request-scoped Supabase client with dedicated learner cookie options.
 * Preserves SDK cache/Expires/Pragma and cookie flags through refresh,
 * downstream request and alternate responses.
 */
export function createSupabaseServerClient(
  cookieStore: CookieAdapter,
  responseHeaders?: Headers | Record<string, string>
) {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('Supabase configuration is missing in runtime environment');
  }
  const cookieName = getLearnerCookieName(env.url);
  return createServerClient(env.url, env.anonKey, {
    cookieOptions: {
      name: cookieName,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
    cookies: {
      getAll() {
        if (typeof cookieStore.getAll === 'function') {
          return cookieStore.getAll();
        }
        return [];
      },
      setAll(cookiesToSet, headers) {
        try {
          if (typeof cookieStore.setAll === 'function') {
            cookieStore.setAll(cookiesToSet, headers);
          } else if (typeof cookieStore.set === 'function') {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          }
          if (headers) {
            if (responseHeaders) {
              Object.entries(headers).forEach(([k, v]) => {
                if (typeof (responseHeaders as any).set === 'function') {
                  (responseHeaders as any).set(k, v);
                } else if (typeof responseHeaders === 'object') {
                  (responseHeaders as Record<string, string>)[k] = v;
                }
              });
            }
            if ((cookieStore as any)?.headers) {
              Object.entries(headers).forEach(([k, v]) => {
                if (typeof (cookieStore as any).headers.set === 'function') {
                  (cookieStore as any).headers.set(k, v);
                } else {
                  (cookieStore as any).headers[k] = v;
                }
              });
            }
          }
        } catch {
          // Read-only context (e.g. Server Component)
        }
      },
    },
  });
}

/**
 * Builds standard secure, private, no-store headers preserving any SDK refresh headers.
 */
export function buildAuthResponseHeaders(
  customHeaders?: HeadersInit,
  sdkHeaders?: Record<string, string>
): Headers {
  const headers = new Headers(customHeaders);
  if (sdkHeaders) {
    for (const [key, value] of Object.entries(sdkHeaders)) {
      headers.set(key, value);
    }
  }
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store, private');
  }
  return headers;
}

export function isProviderAvailabilityError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; name?: string; message?: string };
  if (e.status === 500 || e.status === 502 || e.status === 503 || e.status === 504) return true;
  if (e.name === 'AuthRetryableFetchError') return true;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout')
  );
}

/**
 * Strict server-side verification:
 * 1. Fresh SSR getUser() from Supabase Auth Server (session revocation enforced)
 * 2. Confirmed email required
 * 3. Fresh read from app.accounts by verified UUID
 * 4. Requires status === 'ACTIVE' and role === 'LEARNER'
 */
export async function verifyLearnerIdentity(
  options: {
    authClient?: { auth: { getUser: () => Promise<{ data: { user: { id: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null } | null } | null; error: unknown }> } };
    cookieStore?: CookieAdapter;
    prisma?: any;
    responseHeaders?: Headers | Record<string, string>;
  }
): Promise<VerifiedLearnerResult> {
  try {
    let authClient = options.authClient;
    if (!authClient) {
      if (!options.cookieStore) {
        return {
          ok: false,
          status: 401,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
          },
        };
      }
      const allCookies = typeof options.cookieStore.getAll === 'function' ? await options.cookieStore.getAll() : [];
      const hasAuthCookie = Array.isArray(allCookies) && allCookies.some(
        (c: { name: string }) => c.name.startsWith('sb-') || c.name.includes('auth') || c.name.includes('token') || c.name.includes('learner')
      );
      if (!hasAuthCookie) {
        return {
          ok: false,
          status: 401,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
          },
        };
      }
      authClient = createSupabaseServerClient(options.cookieStore, options.responseHeaders);
    }

    let authUserResult;
    try {
      authUserResult = await authClient.auth.getUser();
    } catch {
      return {
        ok: false,
        status: 503,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      };
    }

    if (authUserResult.error) {
      if (isProviderAvailabilityError(authUserResult.error)) {
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

    if (!authUserResult.data?.user) {
      return {
        ok: false,
        status: 401,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
        },
      };
    }

    const user = authUserResult.data.user;

    // Email confirmation enforcement
    const isEmailConfirmed = Boolean(user.email_confirmed_at);
    if (!isEmailConfirmed) {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư để xác thực email trước khi đăng nhập.',
        },
      };
    }

    // Fresh read from database
    const prisma = options.prisma || getLearnerPrisma();
    let account;
    try {
      account = await prisma.account.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          status: true,
          displayName: true,
          uiLocale: true,
        },
      });
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

    if (!account) {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Tài khoản chưa được khởi tạo phân hệ học viên.',
        },
      };
    }

    if (account.status !== 'ACTIVE') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    if (account.role !== 'LEARNER') {
      return {
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Tài khoản không thuộc phân hệ học viên.',
        },
      };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      account: {
        id: account.id,
        role: 'LEARNER',
        status: 'ACTIVE',
        displayName: account.displayName,
        uiLocale: account.uiLocale,
      },
    };
  } catch (err: unknown) {
    const safeMsg = err instanceof Error ? err.message : String(err);
    if (safeMsg.includes('Supabase configuration is missing') || safeMsg.includes('DATABASE_URL is not configured')) {
      return {
        ok: false,
        status: 503,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cấu hình môi trường dịch vụ chưa hoàn tất.',
        },
      };
    }
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
      },
    };
  }
}

/**
 * Strict same-origin validator for mutation endpoints.
 * Compares the complete Origin (scheme, hostname, and port) against the trusted application origin.
 */
export function validateSameOrigin(request: Request): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite === 'cross-site') {
    return false;
  }

  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const hostHeader = request.headers.get('host');
  if (!hostHeader) return false;

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  const proto = (request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '')).toLowerCase();
  const host = hostHeader.toLowerCase();

  const expectedOrigin = `${proto}://${host}`;

  return originUrl.origin.toLowerCase() === expectedOrigin;
}
