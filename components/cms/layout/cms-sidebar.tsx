import Link from "next/link"
import { ArrowLeft, LayoutDashboard, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CmsConfig } from "@/lib/cms-types"
import { cn } from "@/lib/utils"

import type { CmsView } from "../types"

interface CmsSidebarProps {
  config: CmsConfig
  isDirty: boolean
  configuredCount: number
  activeView: CmsView
  activeDepartmentIndex: number
  onSelectView: (view: CmsView) => void
  onSelectDepartment: (index: number) => void
  onAddDepartment: () => void
}

export function CmsSidebar({
  config,
  isDirty,
  configuredCount,
  activeView,
  activeDepartmentIndex,
  onSelectView,
  onSelectDepartment,
  onAddDepartment,
}: CmsSidebarProps) {
  return (
    <aside className="h-fit rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.06)] xl:sticky xl:top-4">
      <div className="space-y-3">
        <div className="rounded-[20px] bg-slate-950 px-4 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">
                CMS
              </p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight">Control Room</h1>
            </div>
            <Badge
              className={cn("rounded-full px-3 py-1", isDirty ? "bg-amber-500" : "bg-emerald-500")}
            >
              {isDirty ? "Draft" : "Live"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white/8 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Ngành hàng</p>
              <p className="mt-1 font-semibold">{config.departments.length}</p>
            </div>
            <div className="rounded-2xl bg-white/8 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">API ready</p>
              <p className="mt-1 font-semibold">
                {configuredCount}/{config.departments.length}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>

        <div className="rounded-[20px] border border-slate-500 bg-slate-50 p-2">
          {[
            { key: "dashboard" as const, label: "Bảng điều khiển", icon: LayoutDashboard },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectView(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition",
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-white hover:text-slate-950",
                )}
              >
                <div className={cn("rounded-xl p-2", isActive ? "bg-white/10" : "bg-white")}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-[20px] border border-slate-500 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Ngành hàng</p>
              <p className="text-xs text-slate-500">Mở từng chatbot để chỉnh sâu.</p>
            </div>
            <Button type="button" size="sm" onClick={onAddDepartment} className="rounded-full px-3">
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>

          <div className="max-h-[54vh] space-y-1 overflow-auto p-2">
            {config.departments.map((department, index) => {
              const isActive = activeView === "department" && activeDepartmentIndex === index

              return (
                <button
                  key={`${department.id}-${index}`}
                  type="button"
                  onClick={() => onSelectDepartment(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-white hover:ring-1 hover:ring-slate-200",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{department.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          isActive ? "bg-white/10 text-white/80" : "bg-white text-slate-600",
                        )}
                      >
                        {department.zoneLabel}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-xs", isActive ? "text-white/65" : "text-slate-500")}>
                      {department.integration.apiKeyConfigured ? "Đã có API key" : "Thiếu API key"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      department.integration.apiKeyConfigured ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
