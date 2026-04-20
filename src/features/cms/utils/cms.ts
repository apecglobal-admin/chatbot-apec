import type { CmsConfig, DepartmentConfig } from "@/features/cms/types/cms"

/**
 * List of theme fields that should not be converted to uppercase
 */
export const SKIP_UPPERCASE_THEME_FIELDS = ["backgroundImageUrl", "botAvatarUrl", "headerLogoUrl"]

/**
 * Builds a new CmsConfig object with an updated theme field for a specific department
 */
export function buildConfigWithThemeUpdate(
  current: CmsConfig,
  index: number,
  field: keyof DepartmentConfig["theme"],
  value: string,
) {
  return {
    ...current,
    departments: current.departments.map((department, departmentIndex) =>
      departmentIndex === index
        ? {
            ...department,
            theme: {
              ...department.theme,
              [field]: SKIP_UPPERCASE_THEME_FIELDS.includes(field) ? value : value.toUpperCase(),
            },
          }
        : department,
    ),
  }
}

/**
 * Checks if a specific department configuration has changed compared to its original snapshot
 */
export function isDepartmentDirty(current: DepartmentConfig | null, original: DepartmentConfig | null): boolean {
  if (!current || !original) return false
  return JSON.stringify(current) !== JSON.stringify(original)
}

/**
 * Generates an empty department configuration with default values
 */
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
    },
    waitingConfig: {
      mode: "video",
      videoUrl: "",
    },
    integration: {
      endpoint: "/api/external/chat-stream",
      apiKey: "",
      apiKeyConfigured: false,
      requestTimeoutMs: 20000,
      assistantSlug: `assistant-${index}`,
    },
    inactivityTimeoutMinutes: 5,
  }
}
