import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, tone = "info", ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "success" }) {
  const tones = { info: "border-sky-200 bg-sky-50 text-sky-950", error: "border-red-200 bg-red-50 text-red-950", success: "border-emerald-200 bg-emerald-50 text-emerald-950" };
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}
