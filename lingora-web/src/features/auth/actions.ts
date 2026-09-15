"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthService } from "./auth.service";

export type AuthActionState = { code?: string };

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const result = await new AuthService().login(String(formData.get("email") ?? "").trim(), String(formData.get("password") ?? ""));
  if (!result.ok) return { code: result.code };
  redirect("/");
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const result = await new AuthService().register(String(formData.get("email") ?? "").trim(), String(formData.get("password") ?? ""));
  if (!result.ok) return { code: result.code };
  redirect("/");
}

export async function logoutAction() {
  await new AuthService().logout();
  redirect("/login");
}

export async function setLocaleAction(locale: "vi" | "en") {
  const store = await cookies();
  store.set("lingora-locale", locale, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
}
