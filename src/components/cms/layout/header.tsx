"use client"

import { ReactNode } from "react"
import { Clock3, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/utils/ui"
import { formatDateTime } from "@/utils/date"
import { useCms } from "./cms-provider"

interface HeaderProps {
  title: string
  updatedAt: string
  meta?: ReactNode
  action?: ReactNode
}

export function Header({
  title,
  updatedAt,
  meta,
  action,
}: HeaderProps) {
  const { isSaving, isDirty, handleSave } = useCms()
  
  const saveLabel = isSaving
    ? "Đang lưu..."
    : isDirty
      ? "Lưu thay đổi"
      : "Không có thay đổi"

  return (
    <header className="sticky top-4 z-40 space-y-3">
      <div className="group relative rounded-[1.5rem] bg-slate-950 transition-all hover:scale-[1.005] overflow-hidden">
        <div className="relative px-4 py-3 md:px-6">
          <div className="flex flex-col gap-2.5">
            {/* Upper row: Meta and Timestamp */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">{meta}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                <span>Cập nhật: {formatDateTime(updatedAt)}</span>
              </div>
            </div>

            {/* Main row: Title and Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold tracking-tight truncate max-w-full sm:max-w-md bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                {title}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {action}
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !isDirty}
                  className="h-7 px-2.5 text-[11px] rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all"
                >
                  <Save className="h-3 w-3" />
                  {saveLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
