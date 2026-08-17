import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none placeholder:text-slate-500 focus:border-sky-600 focus:ring-3 focus:ring-sky-200", className)} {...props} />;
}
