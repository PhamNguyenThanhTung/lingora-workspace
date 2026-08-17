import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-55", {
  variants: { variant: { primary: "bg-slate-950 text-white hover:bg-slate-800", secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50", ghost: "text-slate-700 hover:bg-slate-100" } },
  defaultVariants: { variant: "primary" }
});

export function Button({ className, variant, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
