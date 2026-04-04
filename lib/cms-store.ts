import "server-only"

import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { CmsConfig, DepartmentConfig } from "@/lib/cms-types"

const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
const WAITING_INDICATOR_MODES = ["text", "video"] as const

const departmentThemeSchema = z.object({
  accent: z.string().regex(COLOR_REGEX),
  accentSoft: z.string().regex(COLOR_REGEX),
  panel: z.string().regex(COLOR_REGEX),
  surface: z.string().regex(COLOR_REGEX),
  userBubble: z.string().regex(COLOR_REGEX),
  assistantBubble: z.string().regex(COLOR_REGEX),
  badge: z.string().regex(COLOR_REGEX),
  backgroundImageUrl: z.string().optional(),
  botAvatarUrl: z.string().optional(),
  headerLogoUrl: z.string().optional(),
  waitingIndicatorMode: z.enum(WAITING_INDICATOR_MODES).optional(),
  waitingVideoUrl: z.string().optional(),
  waitingText: z.string().optional(),
  waitingTextSpeed: z.coerce.number().int().min(20).max(200).optional(),
  waitingCursorColor: z.string().optional(),
})

const departmentIntegrationSchema = z.object({
  endpoint: z.string().url(),
  apiKey: z.string(),
  apiKeyConfigured: z.boolean(),
  partnerUserPrefix: z.string().min(1),
  requestTimeoutMs: z.number().int().min(3000).max(60000),
  assistantSlug: z.string().min(1),
})

const departmentSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  zoneLabel: z.string().min(1),
  description: z.string().min(1),
  welcomeMessage: z.string().min(1),
  placeholder: z.string().min(1),
  suggestedPrompts: z.array(z.string().min(1)).min(1),
  theme: departmentThemeSchema,
  integration: departmentIntegrationSchema,
})

const cmsConfigSchema = z
  .object({
    departments: z.array(departmentSchema).min(1),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine((value, ctx) => {
    const slugs = new Set<string>()
    const ids = new Set<string>()

    value.departments.forEach((department, index) => {
      if (slugs.has(department.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Slug ngành hàng phải là duy nhất.",
          path: ["departments", index, "slug"],
        })
      }

      if (ids.has(department.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID ngành hàng phải là duy nhất.",
          path: ["departments", index, "id"],
        })
      }

      slugs.add(department.slug)
      ids.add(department.id)
    })
  })


type DepartmentRow = {
  id: string
  name: string
  slug: string
  zone_label: string
  description: string
  welcome_message: string
  placeholder: string
  suggested_prompts: string[]
  theme: Record<string, string>
  assistant_slug: string
  api_endpoint: string
  api_key: string
  partner_user_prefix: string
  request_timeout_ms: number
  updated_at: string
  display_order: number
  is_active: boolean
}

export const DEFAULT_CONFIG: CmsConfig = {
  departments: [
    {
      id: "fresh-food",
      name: "Thực phẩm tươi",
      slug: "thuc-pham-tuoi",
      zoneLabel: "Kệ A1",
      description: "Rau củ, trái cây, thịt cá và gợi ý bảo quản tại quầy tươi.",
      welcomeMessage:
        "Xin chào, tôi phụ trách quầy Thực phẩm tươi. Bạn cần tìm sản phẩm, hỏi cách chọn hay bảo quản nguyên liệu nào?",
      placeholder: "Ví dụ: Cá hồi hôm nay còn không? Bảo quản thịt bò thế nào?",
      suggestedPrompts: [
        "Cá hồi hôm nay còn không?",
        "Rau nào hợp để nấu canh chua?",
        "Bảo quản thịt bò trong ngăn mát bao lâu?",
      ],
      theme: {
        accent: "#2F855A",
        accentSoft: "#D7F5E4",
        panel: "#F4FAF6",
        surface: "#FFFFFF",
        userBubble: "#2F855A",
        assistantBubble: "#E8F4EC",
        badge: "#163E2D",
        waitingIndicatorMode: "text",
        waitingVideoUrl: "",
      },
      integration: {
        endpoint: "https://rag-ai-jn9g.onrender.com/api/external/chat-stream",
        apiKey: "",
        apiKeyConfigured: false,
        partnerUserPrefix: "apec-shelf",
        requestTimeoutMs: 20000,
        assistantSlug: "fresh-food",
      },
    },
    {
      id: "beverages",
      name: "Đồ uống",
      slug: "do-uong",
      zoneLabel: "Kệ B3",
      description: "Nước giải khát, cà phê, trà và tư vấn ghép combo theo nhu cầu.",
      welcomeMessage:
        "Xin chào, tôi đang hỗ trợ tại quầy Đồ uống. Bạn muốn tìm đồ uống theo hương vị, thương hiệu hay dịp sử dụng?",
      placeholder: "Ví dụ: Có nước ép ít đường không? Cà phê nào bán chạy?",
      suggestedPrompts: [
        "Có loại nước ép ít đường nào?",
        "Cà phê lon nào bán chạy?",
        "Gợi ý combo nước cho tiệc 10 người.",
      ],
      theme: {
        accent: "#D97706",
        accentSoft: "#FFE6C7",
        panel: "#FFF8F0",
        surface: "#FFFFFF",
        userBubble: "#D97706",
        assistantBubble: "#FFF0DB",
        badge: "#7C2D12",
        waitingIndicatorMode: "text",
        waitingVideoUrl: "",
      },
      integration: {
        endpoint: "https://rag-ai-jn9g.onrender.com/api/external/chat-stream",
        apiKey: "",
        apiKeyConfigured: false,
        partnerUserPrefix: "apec-shelf",
        requestTimeoutMs: 20000,
        assistantSlug: "beverage",
      },
    },
    {
      id: "household",
      name: "Gia dụng",
      slug: "gia-dung",
      zoneLabel: "Kệ C2",
      description: "Dụng cụ nhà bếp, đồ gia dụng nhanh và tư vấn sử dụng an toàn.",
      welcomeMessage:
        "Xin chào, tôi phụ trách quầy Gia dụng. Bạn muốn tìm sản phẩm nào cho bếp, vệ sinh hay tổ chức không gian sống?",
      placeholder: "Ví dụ: Có hộp đựng thực phẩm chịu nhiệt không?",
      suggestedPrompts: [
        "Có hộp đựng thực phẩm chịu nhiệt không?",
        "Chảo chống dính nào phù hợp bếp từ?",
        "Gợi ý bộ đồ lau dọn căn hộ nhỏ.",
      ],
      theme: {
        accent: "#0F766E",
        accentSoft: "#D6F5F1",
        panel: "#F2FBFA",
        surface: "#FFFFFF",
        userBubble: "#0F766E",
        assistantBubble: "#E1F6F3",
        badge: "#134E4A",
        waitingIndicatorMode: "text",
        waitingVideoUrl: "",
      },
      integration: {
        endpoint: "https://rag-ai-jn9g.onrender.com/api/external/chat-stream",
        apiKey: "",
        apiKeyConfigured: false,
        partnerUserPrefix: "apec-shelf",
        requestTimeoutMs: 20000,
        assistantSlug: "homeware",
      },
    },
    {
      id: "beauty",
      name: "Mỹ phẩm",
      slug: "my-pham",
      zoneLabel: "Kệ D4",
      description: "Chăm sóc da, tóc và tư vấn routine cơ bản theo nhu cầu thường ngày.",
      welcomeMessage:
        "Xin chào, tôi là trợ lý quầy Mỹ phẩm. Bạn muốn tìm sản phẩm chăm sóc da, tóc hay quà tặng làm đẹp?",
      placeholder: "Ví dụ: Da dầu nên chọn sữa rửa mặt nào?",
      suggestedPrompts: [
        "Da dầu nên chọn sữa rửa mặt nào?",
        "Có kem chống nắng cho da nhạy cảm không?",
        "Gợi ý combo quà tặng chăm sóc da.",
      ],
      theme: {
        accent: "#BE185D",
        accentSoft: "#FFD7E8",
        panel: "#FFF3F8",
        surface: "#FFFFFF",
        userBubble: "#BE185D",
        assistantBubble: "#FFE3EF",
        badge: "#831843",
        waitingIndicatorMode: "text",
        waitingVideoUrl: "",
      },
      integration: {
        endpoint: "https://rag-ai-jn9g.onrender.com/api/external/chat-stream",
        apiKey: "",
        apiKeyConfigured: false,
        partnerUserPrefix: "apec-shelf",
        requestTimeoutMs: 20000,
        assistantSlug: "beauty",
      },
    },
  ],
  updatedAt: "2026-03-31T00:00:00.000Z",
}

function createSetupError() {
  return new Error(
    "Supabase chưa được khởi tạo. Hãy cấu hình biến môi trường và chạy `pnpm db:migrate`.",
  )
}

function mapDepartmentRow(row: DepartmentRow, includeSecrets: boolean): DepartmentConfig {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    zoneLabel: row.zone_label,
    description: row.description,
    welcomeMessage: row.welcome_message,
    placeholder: row.placeholder,
    suggestedPrompts: row.suggested_prompts,
    theme: {
      accent: row.theme.accent,
      accentSoft: row.theme.accentSoft,
      panel: row.theme.panel,
      surface: row.theme.surface,
      userBubble: row.theme.userBubble,
      assistantBubble: row.theme.assistantBubble,
      badge: row.theme.badge,
      backgroundImageUrl: row.theme.backgroundImageUrl || "",
      botAvatarUrl: row.theme.botAvatarUrl || "",
      headerLogoUrl: row.theme.headerLogoUrl || "",
      waitingIndicatorMode: row.theme.waitingIndicatorMode === "video" ? "video" : "text",
      waitingVideoUrl: row.theme.waitingVideoUrl || "",
      waitingText: row.theme.waitingText || "",
      waitingTextSpeed: Number(row.theme.waitingTextSpeed) || 60,
      waitingCursorColor: row.theme.waitingCursorColor || "",
    },
    integration: {
      endpoint: row.api_endpoint,
      apiKey: includeSecrets ? row.api_key : "",
      apiKeyConfigured: Boolean(row.api_key),
      partnerUserPrefix: row.partner_user_prefix,
      requestTimeoutMs: row.request_timeout_ms,
      assistantSlug: row.assistant_slug,
    },
  }
}

function sanitizeConfig(
  input: CmsConfig,
  existingSecrets: Map<string, string>,
) {
  return {
    ...input,
    departments: input.departments.map((department) => {
      const nextApiKey =
        department.integration.apiKey.trim() || existingSecrets.get(department.id) || ""

      return {
        ...department,
        id: department.id.trim(),
        name: department.name.trim(),
        slug: department.slug.trim(),
        zoneLabel: department.zoneLabel.trim(),
        description: department.description.trim(),
        welcomeMessage: department.welcomeMessage.trim(),
        placeholder: department.placeholder.trim(),
        suggestedPrompts: department.suggestedPrompts
          .map((prompt) => prompt.trim())
          .filter(Boolean),
        theme: {
          accent: department.theme.accent.toUpperCase(),
          accentSoft: department.theme.accentSoft.toUpperCase(),
          panel: department.theme.panel.toUpperCase(),
          surface: department.theme.surface.toUpperCase(),
          userBubble: department.theme.userBubble.toUpperCase(),
          assistantBubble: department.theme.assistantBubble.toUpperCase(),
          badge: department.theme.badge.toUpperCase(),
          backgroundImageUrl: department.theme.backgroundImageUrl?.trim() || "",
          botAvatarUrl: department.theme.botAvatarUrl?.trim() || "",
          headerLogoUrl: department.theme.headerLogoUrl?.trim() || "",
          waitingIndicatorMode:
            department.theme.waitingIndicatorMode === "video" ? "video" : "text",
          waitingVideoUrl: department.theme.waitingVideoUrl?.trim() || "",
          waitingText: department.theme.waitingText?.trim() || "",
          waitingTextSpeed: department.theme.waitingTextSpeed || 60,
          waitingCursorColor: department.theme.waitingCursorColor?.trim() || "",
        },
        integration: {
          endpoint: department.integration.endpoint.trim(),
          apiKey: nextApiKey,
          apiKeyConfigured: Boolean(nextApiKey),
          partnerUserPrefix: department.integration.partnerUserPrefix.trim(),
          requestTimeoutMs: department.integration.requestTimeoutMs,
          assistantSlug: department.integration.assistantSlug.trim(),
        },
      }
    }),
    updatedAt: new Date().toISOString(),
  }
}

export async function getCmsConfig(options?: { includeSecrets?: boolean }) {
  const includeSecrets = options?.includeSecrets ?? false
  const supabase = getSupabaseAdmin() as any

  const { data: departmentRows, error: departmentError } = await supabase
    .from("departments")
    .select(
      "id, name, slug, zone_label, description, welcome_message, placeholder, suggested_prompts, theme, assistant_slug, api_endpoint, api_key, partner_user_prefix, request_timeout_ms, updated_at, display_order, is_active",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (departmentError) {
    throw createSetupError()
  }

  if (!departmentRows?.length) {
    throw createSetupError()
  }

  const typedDepartmentRows = departmentRows as DepartmentRow[]

  const updatedAt = typedDepartmentRows
    .map((row: DepartmentRow) => row.updated_at)
    .sort()
    .at(-1)

  const config: CmsConfig = {
    departments: typedDepartmentRows.map((row: DepartmentRow) =>
      mapDepartmentRow(row, includeSecrets),
    ),
    updatedAt: updatedAt ?? new Date().toISOString(),
  }

  const parsed = cmsConfigSchema.safeParse(config)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu Supabase không hợp lệ.")
  }

  return parsed.data
}

export async function saveCmsConfig(input: CmsConfig) {
  const supabase = getSupabaseAdmin() as any
  const existingConfig = await getCmsConfig({ includeSecrets: true }).catch(() => null)
  const existingSecrets = new Map(
    existingConfig?.departments.map((department) => [
      department.id,
      department.integration.apiKey,
    ]) ?? [],
  )

  const sanitized = sanitizeConfig(input, existingSecrets)
  const parsed = cmsConfigSchema.safeParse(sanitized)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu CMS không hợp lệ.")
  }

  const departmentPayload = parsed.data.departments.map((department, index) => ({
    id: department.id,
    slug: department.slug,
    name: department.name,
    zone_label: department.zoneLabel,
    description: department.description,
    welcome_message: department.welcomeMessage,
    placeholder: department.placeholder,
    suggested_prompts: department.suggestedPrompts,
    theme: department.theme,
    assistant_slug: department.integration.assistantSlug,
    api_endpoint: department.integration.endpoint,
    api_key: department.integration.apiKey,
    partner_user_prefix: department.integration.partnerUserPrefix,
    request_timeout_ms: department.integration.requestTimeoutMs,
    display_order: index,
    is_active: true,
    updated_at: parsed.data.updatedAt,
  }))

  const { error: upsertError } = await supabase
    .from("departments")
    .upsert(departmentPayload, { onConflict: "id" })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const { data: currentIds, error: currentIdsError } = await supabase
    .from("departments")
    .select("id")

  if (currentIdsError) {
    throw new Error(currentIdsError.message)
  }

  const nextIds = new Set(parsed.data.departments.map((department) => department.id))
  const idsToDelete =
    (currentIds as Array<{ id: string }> | null)
      ?.map((row: { id: string }) => row.id)
      .filter((id: string) => !nextIds.has(id)) ?? []

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("departments")
      .delete()
      .in("id", idsToDelete)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  return getCmsConfig()
}
