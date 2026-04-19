import type { ChatThreadMessage } from "@/types/chat"

/** Tạo tin nhắn chào mừng mặc định từ Assistant */
export function createWelcomeMessage(content: string): ChatThreadMessage {
  return {
    id: "welcome",
    role: "assistant",
    content,
    timestamp: "",
  }
}
