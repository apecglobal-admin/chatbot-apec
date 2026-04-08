import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface FieldBlockProps {
  label: string
  hint?: string
  children: ReactNode
  className?: string
  isError?: boolean
}

export function FieldBlock({
  label,
  hint,
  children,
  className,
  isError,
}: FieldBlockProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <label
          className={cn(
            "text-sm font-semibold tracking-tight",
            isError ? "text-red-500" : "text-slate-900",
          )}
        >
          {label}
        </label>
        {hint ? (
          <p
            className={cn(
              "text-xs leading-5",
              isError ? "text-red-500" : "text-slate-500",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  )
}
