import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { getLocale, messagesFor } from "@/i18n/config";

export default async function RegisterPage() {
  const messages = messagesFor(await getLocale());
  return <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10"><Card className="w-full max-w-md p-6 sm:p-8"><h1 className="mb-2 text-balance text-2xl font-black tracking-[-0.02em] text-slate-950">{messages.registerTitle}</h1><p className="mb-7 max-w-[42ch] text-sm leading-6 text-slate-600">{messages.registerDescription}</p><AuthForm mode="register" messages={messages} /></Card></main>;
}
