"use client"

import { createContext, useContext, ReactNode } from "react"
import type { CmsConfig, DepartmentConfig } from "@/types/cms"
import type { CmsView } from "../constants"
import { useCmsProviderLogic } from "../hooks/use-cms-provider-logic"

/**
 * Context type defining the CMS management state and actions
 */
export interface CmsContextType {
  config: CmsConfig
  isSaving: boolean
  isDirty: boolean
  activeView: CmsView
  activeDepartmentIndex: number
  activeDepartment: DepartmentConfig | null
  configuredCount: number
  missingApiKeyCount: number
  departmentsWithPromptSet: number
  
  setConfig: (config: CmsConfig) => void
  setActiveView: (view: CmsView) => void
  setActiveDepartmentIndex: (index: number) => void
  handleSelectView: (view: CmsView) => void
  openDepartment: (index: number) => void
  addDepartment: () => Promise<void>
  removeDepartment: (index: number) => Promise<void>
  handleSave: () => Promise<void>
  
  updateDepartment: <K extends keyof DepartmentConfig>(index: number, field: K, value: DepartmentConfig[K]) => void
  updateIntegration: (index: number, field: keyof DepartmentConfig["integration"], value: string | number | boolean) => void
  updateTheme: (index: number, field: keyof DepartmentConfig["theme"], value: string) => void
  updateWaitingConfig: (index: number, field: keyof DepartmentConfig["waitingConfig"], value: string | number) => void
  uploadThemeMedia: (index: number, field: keyof DepartmentConfig["theme"], value: string) => Promise<void>
  uploadWaitingMedia: (index: number, field: keyof DepartmentConfig["waitingConfig"], value: string) => Promise<void>
}

const CmsContext = createContext<CmsContextType | undefined>(undefined)

/**
 * Provider component that wraps the application and provides CMS state
 */
export function CmsProvider({ 
  children, 
  initialConfig 
}: { 
  children: ReactNode, 
  initialConfig: CmsConfig 
}) {
  const cmsState = useCmsProviderLogic(initialConfig)

  return (
    <CmsContext.Provider value={cmsState}>
      {children}
    </CmsContext.Provider>
  )
}

/**
 * Hook to access the CMS context
 */
export function useCms() {
  const context = useContext(CmsContext)
  if (context === undefined) {
    throw new Error("useCms must be used within a CmsProvider")
  }
  return context
}
