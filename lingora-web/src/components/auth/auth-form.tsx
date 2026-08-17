"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction, type AuthActionState } from "@/features/auth/actions";
import type { Messages } from "@/i18n/config";

export function AuthForm({ mode, messages }: { mode: "login" | "register"; messages: Messages }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, {});
  const error = state.code === "INVALID_INPUT" ? messages.invalidInput : state.code === "INVALID_CREDENTIALS" ? messages.invalidCredentials : state.code ? messages.registrationFailed : null;

  return <form action={formAction} className="space-y-5" noValidate>
    {error ? <Alert tone="error">{error}</Alert> : null}
    <div className="space-y-2"><Label htmlFor="email">{messages.email}</Label><Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
    <div className="space-y-2"><Label htmlFor="password">{messages.password}</Label><Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} /></div>
    <Button className="w-full" type="submit" disabled={pending}>{mode === "login" ? messages.login : messages.register}</Button>
    <p className="text-center text-sm text-slate-600">{mode === "login" ? messages.noAccount : messages.haveAccount} <Link className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? messages.createAccount : messages.signIn}</Link></p>
  </form>;
}
