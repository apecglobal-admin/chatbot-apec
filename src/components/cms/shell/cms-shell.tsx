"use client"

import { useEffect, useMemo, useState } from "react"
import { KeyRound, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CmsConfig, DepartmentConfig } from "@/lib/cms-types"
import { cn } from "@/lib/utils"

import { CmsDashboardView } from "../dashboard/cms-dashboard-view"
import { CmsDepartmentView } from "../department-editor/cms-department-view"
import type { CmsView } from "../types"
import { emptyDepartment } from "../utils"
import { CmsHeader } from "./cms-header"
import { CmsSidebar } from "./cms-sidebar"

interface CmsShellProps {
  initialConfig: CmsConfig
}

const skipUpperCase = [
  "backgroundImageUrl",
  "botAvatarUrl",
  "headerLogoUrl",
]

function buildConfigWithThemeUpdate(
  current: CmsConfig,
  index: number,
  field: keyof DepartmentConfig["theme"],
  value: string,
) {
  return {
    ...current,
    departments: current.departments.map((department, departmentIndex) =>
      departmentIndex === index
        ? {
            ...department,
            theme: {
              ...department.theme,
              [field]: skipUpperCase.includes(field) ? value : value.toUpperCase(),
            },
          }
        : department,
    ),
  }
}

export function CmsShell({ initialConfig }: CmsShellProps) {
  const [config, setConfig] = useState(initialConfig)
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialConfig))
  const [isSaving, setIsSaving] = useState(false)
  const [activeView, setActiveView] = useState<CmsView>("dashboard")
  const [activeDepartmentIndex, setActiveDepartmentIndex] = useState(0)

  const activeDepartment = config.departments[activeDepartmentIndex] ?? null;

  const parsedSnapshot = useMemo(() => {
    try {
      return JSON.parse(savedSnapshot) as CmsConfig;
    } catch {
      return null;
    }
  }, [savedSnapshot]);

  const activeDepartmentOriginal = useMemo(() => {
    if (parsedSnapshot && activeDepartmentIndex < parsedSnapshot.departments.length) {
      return parsedSnapshot.departments[activeDepartmentIndex];
    }
    return null;
  }, [parsedSnapshot, activeDepartmentIndex]);

  const isDirty = useMemo(() => {
    if (activeView !== "department" || !activeDepartment || !activeDepartmentOriginal) {
      return false;
    }
    return JSON.stringify(activeDepartment) !== JSON.stringify(activeDepartmentOriginal);
  }, [activeDepartment, activeDepartmentOriginal, activeView])

  const configuredCount = useMemo(
    () =>
      config.departments.filter((department) => department.integration.apiKeyConfigured).length,
    [config.departments],
  )

  const missingApiKeyCount = config.departments.length - configuredCount
  const departmentsWithPromptSet = config.departments.filter(
    (department) => department.suggestedPrompts.length >= 3,
  ).length

  useEffect(() => {
    if (activeDepartmentIndex > config.departments.length - 1) {
      setActiveDepartmentIndex(Math.max(config.departments.length - 1, 0))
    }
  }, [activeDepartmentIndex, config.departments.length])

  async function saveSpecificDepartment(dept: DepartmentConfig, successMessage: string) {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/departments/${dept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dept),
      })

      const data = (await response.json()) as { config?: CmsConfig; error?: string }

      if (!response.ok || !data.config) {
        throw new Error(data.error ?? "Không thể lưu thông tin ngành hàng.")
      }

      setConfig(data.config)
      setSavedSnapshot(JSON.stringify(data.config))
      toast.success(successMessage)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu."
      toast.error(msg)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  function checkUnsavedChanges() {
    if (isDirty) {
      const ok = window.confirm(
        "Ngành hàng hiện tại có những thay đổi chưa lưu. Tiếp tục sẽ xóa bỏ các thay đổi này, bạn có chắc không?"
      )
      if (ok) {
        setConfig((current) => {
          if (!parsedSnapshot) return current
          return {
            ...current,
            departments: current.departments.map((d, i) =>
              i === activeDepartmentIndex && i < parsedSnapshot.departments.length
                ? parsedSnapshot.departments[i]
                : d,
            ),
          }
        })
      }
      return ok
    }
    return true
  }

  function handleSelectView(view: CmsView) {
    if (view !== activeView) {
      if (!checkUnsavedChanges()) return
      setActiveView(view)
    }
  }

  function updateDepartment<K extends keyof DepartmentConfig>(
    index: number,
    field: K,
    value: DepartmentConfig[K],
  ) {
    setConfig((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index
          ? {
              ...department,
              [field]: value,
            }
          : department,
      ),
    }))
  }

  function updateIntegration(
    index: number,
    field: keyof DepartmentConfig["integration"],
    value: string | number | boolean,
  ) {
    setConfig((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index
          ? {
              ...department,
              integration: {
                ...department.integration,
                [field]: value,
              },
            }
          : department,
      ),
    }))
  }

  function updateTheme(
    index: number,
    field: keyof DepartmentConfig["theme"],
    value: string,
  ) {
    setConfig((current) => buildConfigWithThemeUpdate(current, index, field, value))
  }

  function updateWaitingConfig(
    index: number,
    field: keyof DepartmentConfig["waitingConfig"],
    value: string | number,
  ) {
    setConfig((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index
          ? {
              ...department,
              waitingConfig: {
                ...department.waitingConfig,
                [field]: value,
              },
            }
          : department,
      ),
    }))
  }

  async function uploadThemeMedia(
    index: number,
    field: keyof DepartmentConfig["theme"],
    value: string,
  ) {
    const nextConfig = buildConfigWithThemeUpdate(config, index, field, value)
    setConfig(nextConfig)
    const dept = nextConfig.departments[index]
    await saveSpecificDepartment(dept, "Đã lưu media và cấu hình CMS.")
  }

  async function uploadWaitingMedia(
    index: number,
    field: keyof DepartmentConfig["waitingConfig"],
    value: string,
  ) {
    const nextConfig = {
      ...config,
      departments: config.departments.map((department, departmentIndex) =>
        departmentIndex === index
          ? {
              ...department,
              waitingConfig: {
                ...department.waitingConfig,
                [field]: value,
              },
            }
          : department,
      ),
    }
    setConfig(nextConfig)
    const dept = nextConfig.departments[index]
    await saveSpecificDepartment(dept, "Đã lưu media và cấu hình CMS.")
  }

  function openDepartment(index: number) {
    if (activeView === "department" && index === activeDepartmentIndex) return
    if (!checkUnsavedChanges()) return
    setActiveDepartmentIndex(index)
    setActiveView("department")
  }

  async function addDepartment() {
    if (!checkUnsavedChanges()) return

    const newDept = emptyDepartment(config.departments.length + 1)
    setIsSaving(true)

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      })
      const data = (await response.json()) as { config?: CmsConfig; error?: string }
      if (!response.ok || !data.config) {
        throw new Error(data.error ?? "Không thể tạo ngành hàng.")
      }
      setConfig(data.config)
      setSavedSnapshot(JSON.stringify(data.config))
      
      const newIndex = data.config.departments.length - 1
      setActiveDepartmentIndex(newIndex)
      setActiveView("department")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi thêm ngành hàng.")
    } finally {
      setIsSaving(false)
    }
  }

  async function removeDepartment(index: number) {
    if (config.departments.length <= 1) return

    if (!checkUnsavedChanges()) return

    const deptToRemove = config.departments[index]
    if (window.confirm(`Xóa vĩnh viễn ngành hàng ${deptToRemove.name}? Thao tác này không thể hoàn tác.`)) {
      setIsSaving(true)
      try {
        const response = await fetch(`/api/departments/${deptToRemove.id}`, { method: "DELETE" })
        const data = (await response.json()) as { config?: CmsConfig; error?: string }
        if (!response.ok || !data.config) throw new Error(data.error ?? "Không thể xóa ngành hàng.")

        setConfig(data.config)
        setSavedSnapshot(JSON.stringify(data.config))
        
        if (activeDepartmentIndex >= index) {
          const prevIndex = Math.max(index - 1, 0)
          setActiveDepartmentIndex(prevIndex)
        }
        if (activeView === "department" && data.config.departments.length === 0) {
          setActiveView("dashboard")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Lỗi xóa ngành hàng.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  async function handleSave() {
    if (activeView === "department" && activeDepartment) {
      try {
        await saveSpecificDepartment(activeDepartment, "Đã lưu thông tin ngành hàng mới.")
      } catch {
        return
      }
    }
  }

  const currentViewTitle =
    activeView === "dashboard" ? "Bảng điều khiển CMS" : activeDepartment?.name ?? "Ngành hàng"

  const headerMeta =
    activeView === "department" && activeDepartment ? (
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

  const headerAction =
    activeView === "department" && activeDepartment ? (
      <Button
        type="button"
        variant="outline"
        onClick={() => removeDepartment(activeDepartmentIndex)}
        disabled={config.departments.length <= 1}
        className="h-7 rounded-full px-2.5 text-[11px] text-red-500 bg-red-50 border-red-100 hover:text-red-600 hover:bg-red-100 hover:border-red-200 transition-colors"
      >
        <Trash2 className="h-3 w-3" />
        <span className="hidden sm:inline">Xóa ngành hàng</span>
      </Button>
    ) : undefined

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf2f7_0%,#f7f9fb_100%)] px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto grid max-w-375 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <CmsSidebar
          config={config}
          isDirty={isDirty}
          configuredCount={configuredCount}
          activeView={activeView}
          activeDepartmentIndex={activeDepartmentIndex}
          onSelectView={handleSelectView}
          onSelectDepartment={openDepartment}
          onAddDepartment={addDepartment}
        />

        <section className={cn("min-w-0", activeView === "dashboard" && "space-y-4")}>
          {activeView !== "department" ? (
            <CmsHeader
              title={currentViewTitle}
              updatedAt={config.updatedAt}
              isSaving={isSaving}
              isDirty={isDirty}
              onSave={() => void handleSave()}
              variant="default"
            />
          ) : null}

          {activeView === "dashboard" ? (
            <CmsDashboardView
              config={config}
              isDirty={isDirty}
              configuredCount={configuredCount}
              missingApiKeyCount={missingApiKeyCount}
              departmentsWithPromptSet={departmentsWithPromptSet}
              onOpenDepartment={openDepartment}
            />
          ) : null}

          {activeView === "department" && activeDepartment ? (
            <CmsDepartmentView
              headerNode={
                <CmsHeader
                  title={currentViewTitle}
                  titleColor={activeDepartment.theme.accent}
                  updatedAt={(activeView === "department" && activeDepartment?.updatedAt) ? activeDepartment.updatedAt : config.updatedAt}
                  isSaving={isSaving}
                  isDirty={isDirty}
                  onSave={() => void handleSave()}
                  meta={headerMeta}
                  action={headerAction}
                  variant="compact"
                />
              }
              key={activeDepartment.id}
              department={activeDepartment}
              onUpdateDepartment={(field, value) =>
                updateDepartment(activeDepartmentIndex, field, value)
              }
              onUpdateIntegration={(field, value) =>
                updateIntegration(activeDepartmentIndex, field, value)
              }
              onUpdateTheme={(field, value) =>
                updateTheme(activeDepartmentIndex, field, value)
              }
              onUpdateWaitingConfig={(field, value) =>
                updateWaitingConfig(activeDepartmentIndex, field, value)
              }
              onUploadThemeMedia={(field, value) =>
                uploadThemeMedia(activeDepartmentIndex, field, value)
              }
              onUploadWaitingMedia={(field, value) =>
                uploadWaitingMedia(activeDepartmentIndex, field, value)
              }
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}
