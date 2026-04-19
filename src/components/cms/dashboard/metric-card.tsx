import { type LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/utils/ui"

interface MetricCardProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: "slate" | "emerald" | "amber" | "blue"
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  slate: "bg-slate-100 text-slate-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: MetricCardProps) {
  return (
    <Card className="rounded-[22px] border-slate-200 bg-white py-0 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <div className={cn("rounded-xl p-2", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="text-sm leading-5 text-slate-600">{hint}</p>
      </CardContent>
    </Card>
  )
}
