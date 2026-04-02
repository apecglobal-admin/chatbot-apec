import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface FieldBlockProps {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

export function FieldBlock({ label, hint, children, className }: FieldBlockProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <label className="text-sm font-semibold tracking-tight text-slate-900">{label}</label>
        {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}
