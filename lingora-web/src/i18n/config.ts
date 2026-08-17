import { cookies } from "next/headers";
import { en } from "./messages/en";
import { vi } from "./messages/vi";

export type Locale = "vi" | "en";
export type Messages = { [Key in keyof typeof vi]: string };

export async function getLocale(): Promise<Locale> {
  const locale = (await cookies()).get("lingora-locale")?.value;
  return locale === "en" ? "en" : "vi";
}

export function messagesFor(locale: Locale): Messages { return locale === "en" ? en : vi; }
