export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

/**
 * Returns the dedicated cookie namespace for learner session cookies.
 */
export function getLearnerCookieName(url?: string): string {
  const envUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (envUrl) {
    try {
      const hostname = new URL(envUrl).hostname;
      const ref = hostname.split('.')[0];
      if (ref) return `sb-${ref}-learner-token`;
    } catch {
      // ignore
    }
  }
  return 'sb-learner-auth-token';
}
