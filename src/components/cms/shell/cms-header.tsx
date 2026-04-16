import { useEffect, type ReactNode } from "react"
import { Clock3, Save } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { formatDateTime } from "../utils"

interface CmsHeaderProps {
  title: string
  titleColor?: string
  updatedAt: string
  isSaving: boolean
  isDirty: boolean
  onSave: () => void
  meta?: ReactNode
  action?: ReactNode
  variant?: "default" | "compact"
}

export function CmsHeader({
  title,
  titleColor,
  updatedAt,
  isSaving,
  isDirty,
  onSave,
  meta,
  action,
  variant = "default",
}: CmsHeaderProps) {

  const saveLabel = isSaving ? "Đang lưu..." : isDirty ? "Lưu thay đổi" : "Không có thay đổi"

  return (
    <header className={cn("space-y-3", variant === "compact" && "sticky top-4 z-40")}>
      {variant === "compact" ? (
        <div className="group relative p-[1px] rounded-[1.25rem] bg-gradient-to-tr from-orange-400/40 via-slate-200/50 to-emerald-400/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
          <div className="rounded-[calc(1.25rem-1px)] bg-white/80 backdrop-blur-xl px-4 py-3 md:px-5">
            <div className="flex flex-col gap-2.5">
              {/* Hàng 1: Các status và update_at */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">{meta}</div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Cập nhật: {formatDateTime(updatedAt)}</span>
                </div>
              </div>

              {/* Hàng 2: Name và các button */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  className={cn(
                    "text-xl font-bold tracking-tight truncate max-w-full sm:max-w-md",
                    !titleColor && "text-slate-950"
                  )}
                  style={titleColor ? { color: titleColor } : undefined}
                >
                  {title}
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  {action}
                  <Button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || !isDirty}
                    className="h-7 px-2.5 text-[11px] rounded-full bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all"
                  >
                    <Save className="h-3 w-3" />
                    {saveLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </header>
  )
}
