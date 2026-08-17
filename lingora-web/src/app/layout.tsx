import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale, messagesFor } from "@/i18n/config";

export const metadata: Metadata = { title: "Lingora", description: "Lingora Web learner foundation" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = messagesFor(locale);
  return <html lang={locale}><body><Providers><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"><Link className="text-lg font-black tracking-[-0.02em] text-slate-950" href="/">{messages.brand}</Link><LocaleSwitcher locale={locale} label={messages.switchTo} accessibleLabel={messages.locale} /></div></header>{children}</Providers></body></html>;
}
