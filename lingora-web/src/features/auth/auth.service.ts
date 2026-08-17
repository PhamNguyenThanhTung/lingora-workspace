import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true } | { ok: false; code: string };

function validCredentials(email: string, password: string) {
  return /^\S+@\S+\.\S+$/.test(email) && password.length >= 8 && password.length <= 128;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    if (!validCredentials(email, password)) return { ok: false, code: "INVALID_INPUT" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, code: "INVALID_CREDENTIALS" } : { ok: true };
  }

  async register(email: string, password: string): Promise<AuthResult> {
    if (!validCredentials(email, password)) return { ok: false, code: "INVALID_INPUT" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { ok: false, code: "REGISTRATION_FAILED" } : { ok: true };
  }

  async logout() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
}
