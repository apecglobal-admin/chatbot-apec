import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/ui"

interface SectionCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
  className?: string
  contentClassName?: string
  action?: ReactNode
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  action,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl border-slate-200 bg-white py-0 shadow-[0_12px_36px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <CardHeader className="relative px-4 py-3 md:px-5 bg-gradient-to-tr from-emerald-300 via-white to-orange-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 ">
            <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700">
              <Icon className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                {title}
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-5 text-slate-700">
                {description}
              </CardDescription>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("px-4 py-4 md:px-5 md:py-5 -mt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
