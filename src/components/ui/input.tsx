import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm transition-all duration-150",
            "border-slate-700/80 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            "disabled:cursor-not-allowed disabled:bg-slate-950 disabled:text-slate-600",
            error && "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
