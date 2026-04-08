import type { ChatThreadMessage } from "./types"

export function formatChatTimestamp(date = new Date()) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function createWelcomeMessage(content: string): ChatThreadMessage {
  return {
    id: "welcome",
    role: "assistant",
    content,
    timestamp: "",
  }
}
