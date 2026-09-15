import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { logoutAction } from "@/features/auth/actions";
import { getLocale, messagesFor } from "@/i18n/config";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const messages = messagesFor(locale);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {messages.brand}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {messages.welcomeUser},{" "}
            <span className="font-semibold text-slate-900">{user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher
            locale={locale}
            label={messages.switchTo}
            accessibleLabel={messages.locale}
          />
          <form action={logoutAction}>
            <Button variant="secondary" type="submit">
              {messages.signOut}
            </Button>
          </form>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
            {messages.foundationTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            {messages.foundationIntro}
          </p>

          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              ✓ {messages.statusActive}
            </p>
            <p className="mt-1 text-xs text-emerald-700">{messages.m2Ready}</p>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {messages.coreModules}
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
                {messages.courseNav}
              </li>
              <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
                {messages.exerciseEngine}
              </li>
              <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
                {messages.srsReview}
              </li>
              <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
                {messages.progressTracking}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </main>
  );
}
