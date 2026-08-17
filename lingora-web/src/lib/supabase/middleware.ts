import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...SESSION_COOKIE_OPTIONS })
        );
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  const protectedRoute = request.nextUrl.pathname.startsWith("/foundation");
  const authRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";

  if (protectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/foundation");
    return NextResponse.redirect(url);
  }
  if (authRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/foundation";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
