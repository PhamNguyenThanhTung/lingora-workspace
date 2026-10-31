export const learnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const otherLearnerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const fixtureEmail = 'learner@lingora.edu.vn';
export const fixturePassword = 'secret123';
export const providerOrigin = 'https://learner-test.supabase.co';
export const confirmedUser = () => ({ id: learnerId, email: fixtureEmail, email_confirmed_at: '2026-10-31T00:00:00Z' });
export const account = () => ({ id: learnerId, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner A', uiLocale: 'vi' });
export const contextRow = () => ({
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', learnerId,
  languageId: '11111111-1111-4111-8111-111111111111', courseId: '22222222-2222-4222-8222-222222222222', status: 'ACTIVE',
  language: { id: '11111111-1111-4111-8111-111111111111', code: 'en', names: { vi: 'Tiếng Anh' } },
  course: { id: '22222222-2222-4222-8222-222222222222', languageId: '11111111-1111-4111-8111-111111111111', frameworkId: '33333333-3333-4333-8333-333333333333', names: { vi: 'Khóa học A' }, isActive: true,
    framework: { id: '33333333-3333-4333-8333-333333333333', code: 'CEFR', version: '2020', names: { vi: 'CEFR' } } },
  selectedStartLevel: null, workingLevel: null,
});
export function token(user = confirmedUser(), expiresIn = 3600) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  return { access_token: `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, email: user.email, exp })).toString('base64url')}.test-signature`, refresh_token: 'local-refresh-token', expires_in: expiresIn, expires_at: exp, token_type: 'bearer', user };
}
export function setupEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = providerOrigin;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'local-public-key';
}
export function fixtureDb(state) {
  return {
    account: { findUnique: async ({ where }) => {
      if (state.dbFailure) throw new Error('Simulated database outage');
      return where.id === learnerId ? state.account : null;
    } },
    learningContext: { findMany: async ({ where }) => {
      if (state.contextFailure) throw new Error('Simulated context outage');
      return state.contexts.filter(c => c.learnerId === where.learnerId);
    } },
  };
}
export function providerDouble(state) {
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url || String(input));
    if (url.origin !== providerOrigin) throw new Error('Unexpected external test request');
    if (url.pathname.endsWith('/token')) {
      const body = JSON.parse(init?.body || '{}');
      if (state.unconfirmed) return Response.json({ code: 'email_not_confirmed', message: 'Email not confirmed' }, { status: 400, headers: { 'x-supabase-api-version': '2024-01-01' } });
      if (url.searchParams.get('grant_type') === 'password' && (body.email !== fixtureEmail || body.password !== fixturePassword)) return Response.json({ code: 'invalid_credentials', message: 'Invalid credentials' }, { status: 400 });
      state.refreshes = (state.refreshes || 0) + Number(url.searchParams.get('grant_type') === 'refresh_token');
      return Response.json(token(state.user || confirmedUser()));
    }
    if (url.pathname.endsWith('/user')) return state.expired ? Response.json({ code: 'bad_jwt', message: 'Invalid token' }, { status: 401 }) : Response.json(state.user || confirmedUser());
    if (url.pathname.endsWith('/logout')) { state.logoutScopes ||= []; state.logoutScopes.push(url.searchParams.get('scope')); return new Response(null, { status: 204 }); }
    return Response.json({ error: 'Unexpected provider path' }, { status: 404 });
  };
}
