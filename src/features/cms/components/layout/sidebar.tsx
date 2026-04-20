"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard, LogOut, Plus, ShieldCheck, Users, type LucideIcon } from "lucide-react"
import { logoutAction } from "@/features/auth/api/auth-actions"
import { PermissionGuard } from "@/features/auth/components/permission-guard"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/ui"
import { useCms } from "./cms-provider"
import { CmsView } from "@/features/cms/utils/constants"

interface NavItemProps {
  label: string
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
}

function NavItem({ label, icon: Icon, isActive, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] font-bold transition-all duration-300",
        isActive
          ? "bg-emerald-100 text-slate-900 border border-slate-200 shadow-sm"
          : "text-slate-600 hover:bg-white hover:text-slate-950",
      )}
    >
      <div
        className={cn(
          "rounded-lg p-1.5",
          isActive ? "bg-white/50 border border-slate-100 shadow-sm" : "bg-white border border-slate-100",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span>{label}</span>
    </button>
  )
}

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
    <aside className="h-fit max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:sticky xl:top-3">
      <div className="space-y-2">
        <div className="rounded-xl bg-slate-950 px-3 py-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-2 py-1.5 text-[13px] text-white/85 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Về trang chủ
            </Link>
            <Badge
              className={cn("rounded-full px-2 py-0.5 text-[10px]", isDirty ? "bg-amber-500" : "bg-emerald-500")}
            >
              {isDirty ? "Draft" : "Live"}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
            <div className="rounded-xl bg-white/8 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/55">Ngành</p>
              <p className="mt-0.5 font-bold">{config.departments.length}</p>
            </div>
            <div className="rounded-xl bg-white/8 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/55">Ready</p>
              <p className="mt-0.5 font-bold">
                {configuredCount}/{config.departments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-500 bg-slate-50/50 p-1.5">
          <NavItem
            label="Dashboard"
            icon={LayoutDashboard}
            isActive={activeView === "dashboard"}
            onClick={() => handleSelectView("dashboard")}
          />

          <PermissionGuard permission="staff:read">
            <div className="mt-1.5">
              <NavItem
                label="Nhân sự"
                icon={Users}
                isActive={activeView === "users"}
                onClick={() => handleSelectView("users")}
              />
            </div>
          </PermissionGuard>
          <PermissionGuard permission="roles:manage">
            <div className="mt-1">
              <NavItem
                label="Phân quyền"
                icon={ShieldCheck}
                isActive={activeView === "roles"}
                onClick={() => handleSelectView("roles")}
              />
            </div>
          </PermissionGuard>
        </div>

        <div className="rounded-xl border border-slate-500 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-500 px-3 py-2 bg-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ngành hàng</p>
            </div>
            <PermissionGuard permission="department:create">
              <Button type="button" size="sm" onClick={() => void addDepartment()} className="rounded-lg px-2.5 h-7 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-3 w-3" />
                Thêm
              </Button>
            </PermissionGuard>
          </div>

          <div className="space-y-1 p-1.5">
            {config.departments.map((department, index) => {
              const isActive = activeView === "department" && activeDepartmentIndex === index

              return (
                <button
                  key={`${department.id}-${index}`}
                  type="button"
                  onClick={() => openDepartment(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-all duration-300",
                    isActive
                      ? "bg-emerald-100 border border-slate-200 shadow-sm"
                      : "bg-transparent hover:bg-slate-50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-bold tracking-tight text-slate-900">{department.name}</p>
                      <span className="text-[9px] font-bold text-slate-500 italic">[{department.zoneLabel}]</span>
                    </div>
                  </div>
                  <div className={cn("h-2 w-2 rounded-full", department.integration.apiKeyConfigured ? "bg-emerald-500" : "bg-amber-500")} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={async () => {
              await logoutAction()
              window.location.href = "/login"
            }}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-rose-500 transition-all hover:bg-rose-50"
          >
            <div className="rounded-xl border border-rose-100 bg-white p-2 shadow-sm">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
