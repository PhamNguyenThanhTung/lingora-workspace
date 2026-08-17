import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"
};

function requiredEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment is not configured.");
  return { url, key };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = requiredEnvironment();

  return createServerClient(url, key, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, ...SESSION_COOKIE_OPTIONS })
          );
        } catch {
          // Server Components cannot write cookies; middleware/server actions own refresh writes.
        }
      }
    }
  });
}
