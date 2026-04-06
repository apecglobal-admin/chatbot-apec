export type WaitingIndicatorMode = "text" | "video"

export interface DepartmentTheme {
  accent: string
  accentSoft: string
  panel: string
  surface: string
  userBubble: string
  assistantBubble: string
  badge: string
  backgroundImageUrl?: string
  botAvatarUrl?: string
  headerLogoUrl?: string
  waitingIndicatorMode?: WaitingIndicatorMode
  waitingVideoUrl?: string
  waitingText?: string
  waitingTextSpeed?: number
  waitingCursorColor?: string
  inactivityTimeoutMinutes?: number
}

export interface DepartmentIntegration {
  endpoint: string
  apiKey: string
  apiKeyConfigured: boolean
  partnerUserPrefix: string
  requestTimeoutMs: number
  assistantSlug: string
}

export interface DepartmentConfig {
  id: string
  name: string
  slug: string
  zoneLabel: string
  description: string
  welcomeMessage: string
  placeholder: string
  suggestedPrompts: string[]
  theme: DepartmentTheme
  integration: DepartmentIntegration
}

export interface CmsConfig {
  departments: DepartmentConfig[]
  updatedAt: string
}

export interface ExternalChatResponse {
  response: string
  conversation_id?: string
  assistant_id?: string
  assistant_slug?: string
  intent?: string
}
