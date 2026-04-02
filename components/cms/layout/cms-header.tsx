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
}: CmsHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:px-5">
          <div className="flex flex-wrap items-center gap-2">

            <Badge
              className={`rounded-full px-3 py-1 ${
                isDirty ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {isDirty ? "Có thay đổi chưa lưu" : "Đang đồng bộ"}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-950 px-4 py-4 text-white shadow-[0_12px_36px_rgba(15,23,42,0.12)] md:px-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            <Clock3 className="h-3.5 w-3.5" />
            Cập nhật gần nhất
          </div>
          <p className="mt-2 text-sm font-semibold">{formatDateTime(updatedAt)}</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Lưu để áp dụng thay đổi hiện tại lên cấu hình CMS.
          </p>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="mt-4 h-11 w-full rounded-full bg-white text-slate-950 hover:bg-white/90"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : isDirty ? "Lưu thay đổi" : "Không có thay đổi"}
          </Button>
        </div>
      </div>

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
