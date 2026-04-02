import type { DepartmentConfig } from "@/lib/cms-types"

export type ChatRole = "user" | "assistant"

export interface ChatThreadMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}

export interface ChatbotShellProps {
  department: DepartmentConfig
  apiConfigured: boolean
}
