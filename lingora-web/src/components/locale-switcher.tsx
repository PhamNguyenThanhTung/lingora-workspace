"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

export function LocaleSwitcher({ locale, label, accessibleLabel }: { locale: Locale; label: string; accessibleLabel: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <Button type="button" variant="ghost" disabled={pending} aria-label={accessibleLabel} onClick={() => startTransition(async () => { await setLocaleAction(locale === "vi" ? "en" : "vi"); router.refresh(); })}><Languages aria-hidden="true" size={18} />{label}</Button>;
}
