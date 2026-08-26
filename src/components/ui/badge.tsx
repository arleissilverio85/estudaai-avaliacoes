import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "indigo"
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    danger: "bg-rose-950/60 text-rose-400 border-rose-800/60",
    indigo: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60",
    outline: "bg-transparent border-slate-700 text-slate-300",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
