"use client"

import { useEffect, useMemo, useState } from "react"
import { KeyRound, Trash2 } from "lucide-react"

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
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [activeView, setActiveView] = useState<CmsView>("dashboard")
  const [activeDepartmentIndex, setActiveDepartmentIndex] = useState(0)

  const isDirty = useMemo(
    () => JSON.stringify(config) !== savedSnapshot,
    [config, savedSnapshot],
  )

  const configuredCount = useMemo(
    () =>
      config.departments.filter((department) => department.integration.apiKeyConfigured).length,
    [config.departments],
  )

  const missingApiKeyCount = config.departments.length - configuredCount
  const departmentsWithPromptSet = config.departments.filter(
    (department) => department.suggestedPrompts.length >= 3,
  ).length
  const activeDepartment =
    config.departments[activeDepartmentIndex] ?? config.departments[0] ?? null

  useEffect(() => {
    if (activeDepartmentIndex > config.departments.length - 1) {
      setActiveDepartmentIndex(Math.max(config.departments.length - 1, 0))
    }
  }, [activeDepartmentIndex, config.departments.length])

  useEffect(() => {
    if (isDirty) {
      setStatusMessage("")
    }
  }, [isDirty])

  async function persistConfig(nextConfig: CmsConfig, successMessage: string) {
    setIsSaving(true)
    setStatusMessage("")
    setErrorMessage("")

    try {
      const response = await fetch("/api/cms-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextConfig),
      })

      const data = (await response.json()) as { config?: CmsConfig; error?: string }

      if (!response.ok || !data.config) {
        throw new Error(data.error ?? "Không thể lưu cấu hình CMS.")
      }

      setConfig(data.config)
      setSavedSnapshot(JSON.stringify(data.config))
      setStatusMessage(successMessage)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu cấu hình.")
      throw error
    } finally {
      setIsSaving(false)
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
    await persistConfig(nextConfig, "Đã lưu media và cấu hình CMS.")
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
    await persistConfig(nextConfig, "Đã lưu media và cấu hình CMS.")
  }

  function openDepartment(index: number) {
    setActiveDepartmentIndex(index)
    setActiveView("department")
  }

  function addDepartment() {
    const nextIndex = config.departments.length
    setConfig((current) => ({
      ...current,
      departments: [...current.departments, emptyDepartment(current.departments.length + 1)],
    }))
    openDepartment(nextIndex)
  }

  function removeDepartment(index: number) {
    if (config.departments.length <= 1) {
      return
    }

    setConfig((current) => ({
      ...current,
      departments: current.departments.filter((_, departmentIndex) => departmentIndex !== index),
    }))

    if (activeDepartmentIndex >= index) {
      setActiveDepartmentIndex(Math.max(index - 1, 0))
    }
  }

  async function handleSave() {
    try {
      await persistConfig(config, "Đã lưu cấu hình mới.")
    } catch {
      return
    }
  }

  const currentViewTitle =
    activeView === "dashboard" ? "Bảng điều khiển CMS" : activeDepartment?.name ?? "Ngành hàng"

  const currentViewDescription =
    activeView === "dashboard"
      ? "Theo dõi những mục còn thiếu và mở nhanh tới khu vực cần chỉnh sửa."
      : "Chỉnh nội dung, backend và giao diện của từng chatbot ngành hàng."

  const headerMeta =
    activeView === "department" && activeDepartment ? (
      <>
        <Badge
          className="rounded-full px-3 py-1"
          style={{
            backgroundColor: activeDepartment.theme.accentSoft,
            color: activeDepartment.theme.badge,
          }}
        >
          {activeDepartment.zoneLabel}
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
        >
          {activeDepartment.slug}
        </Badge>
        <Badge
          className={cn(
            "rounded-full px-3 py-1",
            activeDepartment.integration.apiKeyConfigured
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          <KeyRound className="h-3.5 w-3.5" />
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
        className="h-11 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
        Xóa ngành hàng
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
          onSelectView={setActiveView}
          onSelectDepartment={openDepartment}
          onAddDepartment={addDepartment}
        />

        <section className="space-y-4">
          <CmsHeader
            title={currentViewTitle}
            description={currentViewDescription}
            updatedAt={config.updatedAt}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            isSaving={isSaving}
            isDirty={isDirty}
            onSave={() => void handleSave()}
            meta={headerMeta}
            action={headerAction}
            variant={activeView === "department" ? "compact" : "default"}
          />

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
