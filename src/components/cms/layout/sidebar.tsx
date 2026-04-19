"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/ui"
import { useCms } from "./cms-provider"

export function Sidebar() {
  const {
    config,
    isDirty,
    configuredCount,
    activeView,
    activeDepartmentIndex,
    handleSelectView,
    openDepartment,
    addDepartment,
  } = useCms()

  return (
    <aside className="h-fit max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.06)] xl:sticky xl:top-4">
      <div className="space-y-3">
        <div className="rounded-[20px] bg-slate-950 px-4 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
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
        </div>

        <div className="rounded-[20px] border border-slate-500 bg-slate-50/30 p-2">
          {[
            { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectView(item.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-tr from-emerald-300/90 via-white to-orange-300/90 text-slate-900 border border-slate-200 shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm",
                )}
              >
                <div className={cn("rounded-xl p-2", isActive ? "bg-white/50 border border-slate-100 shadow-sm" : "bg-white border border-slate-100 shadow-sm")}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-[20px] border border-slate-500 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-500 px-3 py-3 bg-slate-200/80">
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Ngành hàng</p>
              <p className="text-[10px] font-medium text-slate-500">Mở từng chatbot để chỉnh sâu.</p>
            </div>
            <Button type="button" size="sm" onClick={() => void addDepartment()} className="rounded-full px-3 h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="h-3.5 w-3.5" />
              Thêm
            </Button>
          </div>

          <div className="space-y-1.5 p-2">
            {config.departments.map((department, index) => {
              const isActive = activeView === "department" && activeDepartmentIndex === index

              return (
                <button
                  key={`${department.id}-${index}`}
                  type="button"
                  onClick={() => openDepartment(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-300 text-slate-900",
                    isActive
                      ? "bg-gradient-to-tr from-emerald-300/90 via-white to-orange-300/90 border border-slate-200 shadow-sm"
                      : "bg-slate-50/50 hover:bg-white hover:ring-1 hover:ring-slate-100 hover:shadow-md",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold tracking-tight">{department.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/80 text-slate-700 border border-slate-100 shadow-sm"
                        )}
                      >
                        {department.zoneLabel}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-xs", isActive ? "text-slate-700" : "text-slate-600")}>
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
