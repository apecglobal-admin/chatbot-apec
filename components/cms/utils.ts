import type { DepartmentConfig } from "@/lib/cms-types"

export function emptyDepartment(index: number): DepartmentConfig {
  return {
    id: `department-${index}`,
    name: `Ngành hàng ${index}`,
    slug: `nganh-hang-${index}`,
    zoneLabel: `Kệ ${String.fromCharCode(64 + Math.min(index, 26))}1`,
    description: "Mô tả ngắn để khách hàng biết chatbot này phụ trách khu vực nào.",
    welcomeMessage: "Xin chào, tôi là trợ lý của ngành hàng này. Bạn cần tìm gì?",
    placeholder: "Nhập câu hỏi khách hàng thường hỏi tại quầy này.",
    suggestedPrompts: [
      "Sản phẩm nào đang bán chạy?",
      "Mặt hàng nào phù hợp với nhu cầu của tôi?",
      "Có khuyến mãi nào trong khu vực này không?",
    ],
    theme: {
      accent: "#2563EB",
      accentSoft: "#DBEAFE",
      panel: "#EFF6FF",
      surface: "#FFFFFF",
      userBubble: "#2563EB",
      assistantBubble: "#E0EEFF",
      badge: "#1E3A8A",
      backgroundImageUrl: "",
      botAvatarUrl: "",
      headerLogoUrl: "",
      waitingIndicatorMode: "text",
      waitingVideoUrl: "",
    },
    integration: {
      endpoint: "https://rag-ai-jn9g.onrender.com/api/external/chat-stream",
      apiKey: "",
      apiKeyConfigured: false,
      partnerUserPrefix: "apec-shelf",
      requestTimeoutMs: 20000,
      assistantSlug: `assistant-${index}`,
    },
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
