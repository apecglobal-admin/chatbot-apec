"use client"

import { KeyRound, Trash2 } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/ui"

import { useCms } from "@/features/cms/components/layout/cms-provider"
import { Header } from "@/features/cms/components/layout/header"
import { DashboardView } from "@/features/cms/components/dashboard/dashboard-view"
import { EditorView } from "@/features/cms/components/editor/editor-view"
import { RoleManager } from "@/features/rbac/components/role-manager"
import { UserManager } from "@/features/rbac/components/user-manager"
import { PermissionGuard } from "@/features/auth/components/permission-guard"

export default function Page() {
  const { 
    activeView, 
    activeDepartment, 
    config, 
    removeDepartment, 
    activeDepartmentIndex 
  } = useCms()

  const currentViewTitle = 
    activeView === "dashboard" 
      ? "Bảng điều khiển CMS" 
      : activeView === "roles"
      ? "Quản lý quyền hạn"
      : activeView === "users"
      ? "Quản lý nhân sự"
      : activeDepartment?.name ?? "Ngành hàng"

  const headerMeta = activeView === "department" && activeDepartment ? (
    <>
      <Badge
        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          backgroundColor: activeDepartment.theme.accentSoft,
          color: activeDepartment.theme.badge,
        }}
      >
        {activeDepartment.zoneLabel}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
      >
        {activeDepartment.slug}
      </Badge>
      <Badge
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
          activeDepartment.integration.apiKeyConfigured
            ? "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100"
            : "bg-amber-100 text-amber-700 hover:bg-amber-100",
        )}
      >
        <KeyRound className="h-3 w-3 mr-1" />
        {activeDepartment.integration.apiKeyConfigured ? "Đã có API key" : "Thiếu API key"}
      </Badge>
    </>
  ) : undefined

  const headerAction = activeView === "department" && activeDepartment ? (
    <PermissionGuard permission="department:delete">
      <Button
        type="button"
        variant="outline"
        onClick={() => void removeDepartment(activeDepartmentIndex)}
        disabled={config.departments.length <= 1}
        className="h-7 rounded-full px-2.5 text-[11px] text-red-500 bg-red-50 border-red-100 hover:text-red-600 hover:bg-red-100 hover:border-red-200 transition-colors"
      >
        <Trash2 className="h-3 w-3" />
        <span className="hidden sm:inline">Xóa ngành hàng</span>
      </Button>
    </PermissionGuard>
  ) : undefined

  const isDashboardStyle = activeView === "dashboard" || activeView === "roles" || activeView === "users"

  return (
    <section className={cn("min-w-0", isDashboardStyle && "p-4")}>
      {activeView === "dashboard" && <DashboardView />}
      {activeView === "users" && <UserManager />}
      {activeView === "roles" && <RoleManager />}
      {activeView === "department" && (
        <EditorView
          headerNode={
            <Header
              title={currentViewTitle}
              updatedAt={activeDepartment?.updatedAt ?? config.updatedAt}
              meta={headerMeta}
              action={headerAction}
            />
          }
        />
      )}
    </section>
  )
}
