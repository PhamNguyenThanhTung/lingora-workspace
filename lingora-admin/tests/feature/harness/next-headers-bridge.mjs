export function createMockSessionCookie(userId = '00000000-0000-4000-8000-000000000001', email = 'admin@lingora.edu.vn') {
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-project-ref.supabase.co').hostname.split('.')[0];
  return {
    name: `sb-${projectRef}-auth-token`,
    value: cookieValue,
  };
}

let currentCookieStore = {
  getAll: () => [createMockSessionCookie()],
  get: (name) => createMockSessionCookie(),
  set: () => {},
  delete: () => {},
};

export function setCookieStore(store) {
  currentCookieStore = store;
}

export async function cookies() {
  return currentCookieStore;
}
