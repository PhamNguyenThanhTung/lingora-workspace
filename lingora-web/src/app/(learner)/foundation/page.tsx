import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FoundationStatus } from "@/components/foundation/foundation-status";
import { logoutAction } from "@/features/auth/actions";
import { getLocale, messagesFor } from "@/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FoundationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const messages = messagesFor(await getLocale());
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12"><div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-balance text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">{messages.foundationTitle}</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">{messages.foundationIntro}</p></div><form action={logoutAction}><Button variant="secondary" type="submit">{messages.signOut}</Button></form></div><Card className="p-5 sm:p-7"><FoundationStatus messages={messages} /></Card></main>;
}
