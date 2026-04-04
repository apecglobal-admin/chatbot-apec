import { type ReactNode } from "react"
import { Clock3, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { formatDateTime } from "../utils"

interface CmsHeaderProps {
  title: string
  description: string
  updatedAt: string
  statusMessage: string
  errorMessage: string
  isSaving: boolean
  isDirty: boolean
  onSave: () => void
  meta?: ReactNode
  action?: ReactNode
  variant?: "default" | "compact"
}

export function CmsHeader({
  title,
  description,
  updatedAt,
  statusMessage,
  errorMessage,
  isSaving,
  isDirty,
  onSave,
  meta,
  action,
  variant = "default",
}: CmsHeaderProps) {
  const dirtyBadge = (
    <Badge
      className={`rounded-full px-3 py-1 ${
        isDirty ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
      }`}
    >
      {isDirty ? "Có thay đổi chưa lưu" : "Đang đồng bộ"}
    </Badge>
  )

  const saveLabel = isSaving ? "Đang lưu..." : isDirty ? "Lưu thay đổi" : "Không có thay đổi"

  return (
    <header className="space-y-3">
      {variant === "compact" ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {dirtyBadge}
                {meta}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock3 className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Cập nhật: {formatDateTime(updatedAt)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                  {title}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
                {action}
                <Button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving || !isDirty}
                  className="h-11 min-w-[220px] rounded-full bg-slate-950 text-white hover:bg-slate-900"
                >
                  <Save className="h-4 w-4" />
                  {saveLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}

      {statusMessage ? (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </header>
  )
}
