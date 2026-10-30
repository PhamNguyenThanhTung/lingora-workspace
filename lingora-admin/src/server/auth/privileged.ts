import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let testPrivilegedClient: any = null;

/**
 * Set a test double for the privileged Supabase client.
 * For use strictly by test infrastructure.
 */
export function setPrivilegedSupabaseForTest(client: any) {
  testPrivilegedClient = client;
}

/**
 * Checks server environment for URL and server-only secret key.
 * Never exposes or logs secret values.
 */
export function getPrivilegedSupabaseEnv(): { url: string; secretKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return null;
    if (!/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(secretKey) && secretKey.split('.').length !== 3) return null;
  } catch { return null; }
  return { url, secretKey };
}

/**
 * Lazily initializes a separate privileged Supabase client with no session persistence
 * or shared user cookies. Returns null if server configuration is absent.
 */
export function getPrivilegedSupabaseClient(): SupabaseClient | null {
  if (testPrivilegedClient) {
    return testPrivilegedClient;
  }
  const env = getPrivilegedSupabaseEnv();
  if (!env) {
    return null;
  }
  return createClient(env.url, env.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
