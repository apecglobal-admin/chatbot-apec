"use client"

import { useEffect, useMemo, useState } from "react"

import { CmsHeader } from "@/components/cms/layout/cms-header"
import { CmsSidebar } from "@/components/cms/layout/cms-sidebar"
import type { CmsView } from "@/components/cms/types"
import { emptyDepartment } from "@/components/cms/utils"
import { CmsDashboardView } from "@/components/cms/views/cms-dashboard-view"
import { CmsDepartmentView } from "@/components/cms/views/cms-department-view"
import type { CmsConfig, DepartmentConfig } from "@/lib/cms-types"

interface CmsShellProps {
  initialConfig: CmsConfig
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
    const skipUpperCase = [
      "backgroundImageUrl",
      "botAvatarUrl",
      "headerLogoUrl",
      "waitingIndicatorMode",
      "waitingText",
      "waitingTextSpeed",
      "waitingCursorColor",
    ]

    setConfig((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index
          ? {
              ...department,
              theme: {
                ...department.theme,
                [field]: skipUpperCase.includes(field)
                  ? value
                  : value.toUpperCase(),
              },
            }
          : department,
      ),
    }))
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
    setIsSaving(true)
    setStatusMessage("")
    setErrorMessage("")

    try {
      const response = await fetch("/api/cms-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = (await response.json()) as { config?: CmsConfig; error?: string }

      if (!response.ok || !data.config) {
        throw new Error(data.error ?? "Không thể lưu cấu hình CMS.")
      }

      setConfig(data.config)
      setSavedSnapshot(JSON.stringify(data.config))
      setStatusMessage("Đã lưu cấu hình mới.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu cấu hình.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const currentViewTitle =
    activeView === "dashboard"
      ? "Bảng điều khiển CMS"
      : activeDepartment?.name ?? "Ngành hàng"

  const currentViewDescription =
    activeView === "dashboard"
      ? "Theo dõi những mục còn thiếu và mở nhanh tới khu vực cần chỉnh sửa."
      : "Chỉnh nội dung, backend và giao diện của từng chatbot ngành hàng."

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf2f7_0%,#f7f9fb_100%)] px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
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
              departmentCount={config.departments.length}
              onRemoveDepartment={() => removeDepartment(activeDepartmentIndex)}
              onUpdateDepartment={(field, value) =>
                updateDepartment(activeDepartmentIndex, field, value)
              }
              onUpdateIntegration={(field, value) =>
                updateIntegration(activeDepartmentIndex, field, value)
              }
              onUpdateTheme={(field, value) =>
                updateTheme(activeDepartmentIndex, field, value)
              }
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}
