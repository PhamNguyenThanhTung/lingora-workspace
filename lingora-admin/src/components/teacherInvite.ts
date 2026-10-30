import { createBrowserClient } from '@supabase/ssr';
import { clearAllDrafts } from './draftStorage';

/** Invites use implicit fragments; the SSR browser client otherwise assumes PKCE. */
export async function acceptTeacherInvite() {
  if (!window.location.hash) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (params.get('type') !== 'invite' || !accessToken || !refreshToken || params.has('error')) {
    throw new Error('Liên kết lời mời không hợp lệ hoặc đã hết hạn.');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Dịch vụ xác thực chưa sẵn sàng.');
  clearAllDrafts();
  const client = createBrowserClient(url, key, { isSingleton: false, auth: { detectSessionInUrl: false } });
  const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw new Error('Không thể xác nhận lời mời. Vui lòng mở lại liên kết hợp lệ.');
}
