"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import type { CmsConfig, DepartmentConfig } from "@/features/cms/types/cms"
import type { CmsView } from "@/features/cms/utils/constants"
import { emptyDepartment } from "@/features/cms/utils/cms"
import { saveDepartment, createDepartment, deleteDepartment } from "@/features/cms/api/cms"
import { buildConfigWithThemeUpdate, isDepartmentDirty } from "@/features/cms/utils/cms"

/**
 * Hook that encapsulates the CMS provider's state and business logic.
 */
export function useCmsProviderLogic(initialConfig: CmsConfig) {
  const [config, setConfig] = useState(initialConfig)
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialConfig))
  const [isSaving, setIsSaving] = useState(false)
  const [activeView, setActiveView] = useState<CmsView>("dashboard")
  const [activeDepartmentIndex, setActiveDepartmentIndex] = useState(0)

  const activeDepartment = config.departments[activeDepartmentIndex] ?? null

  const parsedSnapshot = useMemo(() => {
    try {
      return JSON.parse(savedSnapshot) as CmsConfig
    } catch {
      return null
    }
  }, [savedSnapshot])

  const activeDepartmentOriginal = useMemo(() => {
    if (parsedSnapshot && activeDepartmentIndex < parsedSnapshot.departments.length) {
      return parsedSnapshot.departments[activeDepartmentIndex]
    }
    return null
  }, [parsedSnapshot, activeDepartmentIndex])

  const isDirty = useMemo(() => {
    if (activeView !== "department" || !activeDepartment || !activeDepartmentOriginal) {
      return false
    }
    return isDepartmentDirty(activeDepartment, activeDepartmentOriginal)
  }, [activeDepartment, activeDepartmentOriginal, activeView])

  const configuredCount = useMemo(
    () => config.departments.filter((d) => d.integration.apiKeyConfigured).length,
    [config.departments],
  )

  const missingApiKeyCount = config.departments.length - configuredCount
  const departmentsWithPromptSet = config.departments.filter(
    (d) => d.suggestedPrompts.length >= 3,
  ).length

  useEffect(() => {
    if (activeDepartmentIndex > config.departments.length - 1) {
      setActiveDepartmentIndex(Math.max(config.departments.length - 1, 0))
    }
  }, [activeDepartmentIndex, config.departments.length])

  async function saveSpecificDepartment(dept: DepartmentConfig, successMessage: string) {
    setIsSaving(true)
    try {
      const updatedConfig = await saveDepartment(dept)
      setConfig(updatedConfig)
      setSavedSnapshot(JSON.stringify(updatedConfig))
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
        departmentIndex === index ? { ...department, [field]: value } : department,
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
              integration: { ...department.integration, [field]: value },
            }
          : department,
      ),
    }))
  }

  function updateTheme(index: number, field: keyof DepartmentConfig["theme"], value: string) {
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
              waitingConfig: { ...department.waitingConfig, [field]: value },
            }
          : department,
      ),
    }))
  }

  async function uploadThemeMedia(index: number, field: keyof DepartmentConfig["theme"], value: string) {
    const nextConfig = buildConfigWithThemeUpdate(config, index, field, value)
    setConfig(nextConfig)
    await saveSpecificDepartment(nextConfig.departments[index], "Đã lưu media và cấu hình CMS.")
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
              waitingConfig: { ...department.waitingConfig, [field]: value },
            }
          : department,
      ),
    }
    setConfig(nextConfig)
    await saveSpecificDepartment(nextConfig.departments[index], "Đã lưu media và cấu hình CMS.")
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
      const updatedConfig = await createDepartment(newDept)
      setConfig(updatedConfig)
      setSavedSnapshot(JSON.stringify(updatedConfig))
      setActiveDepartmentIndex(updatedConfig.departments.length - 1)
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
        const updatedConfig = await deleteDepartment(deptToRemove.id)
        setConfig(updatedConfig)
        setSavedSnapshot(JSON.stringify(updatedConfig))
        
        if (activeDepartmentIndex >= index) {
          setActiveDepartmentIndex(Math.max(index - 1, 0))
        }
        if (activeView === "department" && updatedConfig.departments.length === 0) {
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
      await saveSpecificDepartment(activeDepartment, "Đã lưu thông tin ngành hàng mới.")
    }
  }

  return {
    config,
    isSaving,
    isDirty,
    activeView,
    activeDepartmentIndex,
    activeDepartment,
    configuredCount,
    missingApiKeyCount,
    departmentsWithPromptSet,
    setConfig,
    setActiveView,
    setActiveDepartmentIndex,
    handleSelectView,
    openDepartment,
    addDepartment,
    removeDepartment,
    handleSave,
    updateDepartment,
    updateIntegration,
    updateTheme,
    updateWaitingConfig,
    uploadThemeMedia,
    uploadWaitingMedia,
  }
}
