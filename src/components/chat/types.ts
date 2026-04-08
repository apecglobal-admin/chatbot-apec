export type ChatRole = "user" | "assistant"

export interface ChatThreadMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}
