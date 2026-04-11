export type WaitingIndicatorMode = "text" | "video"

export interface DepartmentTheme {
  accent: string
  accentSoft: string
  panel: string
  surface: string
  userBubble: string
  assistantBubble: string
  badge: string
  suggestedPromptsBgColor?: string
  suggestedPromptsTextColor?: string
  backgroundImageUrl?: string
  botAvatarUrl?: string
  headerLogoUrl?: string
}

export interface DepartmentWaitingConfig {
  mode: WaitingIndicatorMode
  videoUrl?: string
  text?: string
  textSpeed?: number
  cursorColor?: string
}

export interface DepartmentIntegration {
  endpoint: string
  apiKey: string
  apiKeyConfigured: boolean
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
  waitingConfig: DepartmentWaitingConfig
  integration: DepartmentIntegration
  inactivityTimeoutMinutes?: number
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
