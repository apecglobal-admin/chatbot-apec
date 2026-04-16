import "server-only"

import { z } from "zod"

import { decrypt, encrypt } from "@/lib/crypto"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type {
  CmsConfig,
  DepartmentConfig,
  DepartmentIntegration,
  DepartmentTheme,
  DepartmentWaitingConfig,
} from "@/lib/cms-types"

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
  suggestedPromptsBgColor: z.string().optional(),
  suggestedPromptsTextColor: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  botAvatarUrl: z.string().optional(),
  headerLogoUrl: z.string().optional(),
})

const departmentWaitingConfigSchema = z.object({
  mode: z.enum(WAITING_INDICATOR_MODES),
  videoUrl: z.string().optional(),
  text: z.string().optional(),
  textSpeed: z.coerce.number().int().min(20).max(200).optional(),
  cursorColor: z.string().optional(),
})

const departmentIntegrationSchema = z.object({
  endpoint: z.string().min(1),
  apiKey: z.string(),
  apiKeyConfigured: z.boolean(),
  requestTimeoutMs: z.number().int().min(3000).max(60000),
  assistantSlug: z.string(),
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
  waitingConfig: departmentWaitingConfigSchema,
  integration: departmentIntegrationSchema,
  inactivityTimeoutMinutes: z.coerce.number().int().min(1).max(60).optional(),
  updatedAt: z.string().optional(),
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


// ── Row types matching normalized DB tables ─────────────────────────

type DepartmentRow = {
  id: string
  name: string
  slug: string
  zone_label: string
  description: string
  welcome_message: string
  placeholder: string
  display_order: number
  is_active: boolean
  inactivity_timeout_minutes: number
  suggested_prompts: string[]
  updated_at: string
  created_at: string
}

type ThemeRow = {
  department_id: string
  accent: string
  accent_soft: string
  panel: string
  surface: string
  user_bubble: string
  assistant_bubble: string
  badge: string
  suggested_prompts_bg_color: string
  suggested_prompts_text_color: string
  background_image_url: string
  bot_avatar_url: string
  header_logo_url: string
}

type IntegrationRow = {
  department_id: string
  api_endpoint: string
  api_key_encrypted: string
  request_timeout_ms: number
  assistant_slug: string
}

type WaitingConfigRow = {
  department_id: string
  mode: string
  video_url: string
  text_content: string
  text_speed: number
  cursor_color: string
}


// ── Default config ──────────────────────────────────────────────────

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
        assistantSlug: "",
      },
      inactivityTimeoutMinutes: 5,
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
        assistantSlug: "",
      },
      inactivityTimeoutMinutes: 5,
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
        assistantSlug: "",
      },
      inactivityTimeoutMinutes: 5,
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
        assistantSlug: "",
      },
      inactivityTimeoutMinutes: 5,
    },
  ],
  updatedAt: "2026-03-31T00:00:00.000Z",
}


// ── Helpers ─────────────────────────────────────────────────────────

function createSetupError() {
  return new Error(
    "Supabase chưa được khởi tạo. Hãy cấu hình biến môi trường và chạy `pnpm db:migrate`.",
  )
}

function mapThemeRow(row: ThemeRow): DepartmentTheme {
  return {
    accent: row.accent,
    accentSoft: row.accent_soft,
    panel: row.panel,
    surface: row.surface,
    userBubble: row.user_bubble,
    assistantBubble: row.assistant_bubble,
    badge: row.badge,
    suggestedPromptsBgColor: row.suggested_prompts_bg_color || "",
    suggestedPromptsTextColor: row.suggested_prompts_text_color || "",
    backgroundImageUrl: row.background_image_url || "",
    botAvatarUrl: row.bot_avatar_url || "",
    headerLogoUrl: row.header_logo_url || "",
  }
}

function mapWaitingConfigRow(row: WaitingConfigRow | undefined): DepartmentWaitingConfig {
  if (!row) {
    return { mode: "video", videoUrl: "", text: "", textSpeed: 60, cursorColor: "" }
  }
  return {
    mode: row.mode === "text" ? "text" : "video",
    videoUrl: row.video_url || "",
    text: row.text_content || "",
    textSpeed: row.text_speed || 60,
    cursorColor: row.cursor_color || "",
  }
}

function mapIntegrationRow(
  row: IntegrationRow | undefined,
  includeSecrets: boolean,
): DepartmentIntegration {
  if (!row) {
    return {
      endpoint: "/api/external/chat-stream",
      apiKey: "",
      apiKeyConfigured: false,
      requestTimeoutMs: 20000,
      assistantSlug: "",
    }
  }

  let decryptedKey = ""
  if (row.api_key_encrypted) {
    try {
      decryptedKey = decrypt(row.api_key_encrypted)
    } catch {
      // If decryption fails (e.g. migrated plaintext data), treat as plaintext
      decryptedKey = row.api_key_encrypted
    }
  }

  return {
    endpoint: row.api_endpoint,
    apiKey: includeSecrets ? decryptedKey : (row.api_key_encrypted ? "******" : ""),
    apiKeyConfigured: Boolean(row.api_key_encrypted),
    requestTimeoutMs: row.request_timeout_ms,
    assistantSlug: row.assistant_slug,
  }
}

function mapDepartmentRow(
  row: DepartmentRow,
  themeRow: ThemeRow | undefined,
  integrationRow: IntegrationRow | undefined,
  waitingConfigRow: WaitingConfigRow | undefined,
  prompts: string[],
  includeSecrets: boolean,
): DepartmentConfig {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    zoneLabel: row.zone_label,
    description: row.description,
    welcomeMessage: row.welcome_message,
    placeholder: row.placeholder,
    suggestedPrompts: prompts,
    theme: themeRow
      ? mapThemeRow(themeRow)
      : DEFAULT_CONFIG.departments[0].theme,
    waitingConfig: mapWaitingConfigRow(waitingConfigRow),
    integration: mapIntegrationRow(integrationRow, includeSecrets),
    inactivityTimeoutMinutes: row.inactivity_timeout_minutes ?? 5,
    updatedAt: row.updated_at,
  }
}

function sanitizeConfig(
  input: CmsConfig,
  existingSecrets: Map<string, string>,
) {
  return {
    ...input,
    departments: input.departments.map((department) => {
      // Sentinel "******" means user did not change the key → keep existing.
      // Any other value (including empty string) is treated as the new key.
      const SENTINEL = "******"
      const rawKey = department.integration.apiKey
      const nextApiKey = rawKey === SENTINEL
        ? existingSecrets.get(department.id) ?? ""
        : rawKey.trim()

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
          suggestedPromptsBgColor: department.theme.suggestedPromptsBgColor?.trim() || "",
          suggestedPromptsTextColor: department.theme.suggestedPromptsTextColor?.trim() || "",
          backgroundImageUrl: department.theme.backgroundImageUrl?.trim() || "",
          botAvatarUrl: department.theme.botAvatarUrl?.trim() || "",
          headerLogoUrl: department.theme.headerLogoUrl?.trim() || "",
        },
        waitingConfig: {
          mode: department.waitingConfig.mode === "text" ? "text" as const : "video" as const,
          videoUrl: department.waitingConfig.videoUrl?.trim() || "",
          text: department.waitingConfig.text?.trim() || "",
          textSpeed: department.waitingConfig.textSpeed || 60,
          cursorColor: department.waitingConfig.cursorColor?.trim() || "",
        },
        integration: {
          endpoint: department.integration.endpoint.trim(),
          apiKey: nextApiKey,
          apiKeyConfigured: Boolean(nextApiKey),
          requestTimeoutMs: department.integration.requestTimeoutMs,
          assistantSlug: department.integration.assistantSlug.trim(),
        },
        inactivityTimeoutMinutes: department.inactivityTimeoutMinutes || 5,
        updatedAt: department.updatedAt,
      }
    }),
    updatedAt: new Date().toISOString(),
  }
}


// ── Read ────────────────────────────────────────────────────────────

export async function getCmsConfig(options?: { includeSecrets?: boolean }) {
  const includeSecrets = options?.includeSecrets ?? false
  const supabase = getSupabaseAdmin() as any

  // Fetch departments
  const { data: departmentRows, error: departmentError } = await supabase
    .from("departments")
    .select("id, name, slug, zone_label, description, welcome_message, placeholder, suggested_prompts, display_order, is_active, inactivity_timeout_minutes, updated_at, created_at")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (departmentError || !departmentRows?.length) {
    throw createSetupError()
  }

  const typedRows = departmentRows as DepartmentRow[]
  const deptIds = typedRows.map((r) => r.id)

  // Fetch related tables in parallel
  const [
    { data: themeRows },
    { data: integrationRows },
    { data: waitingRows },
  ] = await Promise.all([
    supabase.from("department_themes").select("*").in("department_id", deptIds),
    supabase.from("department_integrations").select("*").in("department_id", deptIds),
    supabase.from("department_waiting_configs").select("*").in("department_id", deptIds),
  ])

  // Index by department_id
  const themeMap = new Map(
    (themeRows as ThemeRow[] | null)?.map((r) => [r.department_id, r]) ?? [],
  )
  const integrationMap = new Map(
    (integrationRows as IntegrationRow[] | null)?.map((r) => [r.department_id, r]) ?? [],
  )
  const waitingMap = new Map(
    (waitingRows as WaitingConfigRow[] | null)?.map((r) => [r.department_id, r]) ?? [],
  )

  const updatedAt = typedRows
    .map((row) => row.updated_at)
    .sort()
    .at(-1)

  const config: CmsConfig = {
    departments: typedRows.map((row) =>
      mapDepartmentRow(
        row,
        themeMap.get(row.id),
        integrationMap.get(row.id),
        waitingMap.get(row.id),
        row.suggested_prompts || [],
        includeSecrets,
      ),
    ),
    updatedAt: updatedAt ?? new Date().toISOString(),
  }

  const parsed = cmsConfigSchema.safeParse(config)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu Supabase không hợp lệ.")
  }

  return parsed.data
}


// ── Write ───────────────────────────────────────────────────────────

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

  // 1. Upsert departments
  const departmentPayload = parsed.data.departments.map((department, index) => ({
    id: department.id,
    slug: department.slug,
    name: department.name,
    zone_label: department.zoneLabel,
    description: department.description,
    welcome_message: department.welcomeMessage,
    placeholder: department.placeholder,
    suggested_prompts: department.suggestedPrompts,
    display_order: index,
    is_active: true,
    inactivity_timeout_minutes: department.inactivityTimeoutMinutes ?? 5,
    updated_at: parsed.data.updatedAt,
  }))

  const { error: upsertError } = await supabase
    .from("departments")
    .upsert(departmentPayload, { onConflict: "id" })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  // 2. Upsert themes
  const themePayload = parsed.data.departments.map((department) => ({
    department_id: department.id,
    accent: department.theme.accent,
    accent_soft: department.theme.accentSoft,
    panel: department.theme.panel,
    surface: department.theme.surface,
    user_bubble: department.theme.userBubble,
    assistant_bubble: department.theme.assistantBubble,
    badge: department.theme.badge,
    suggested_prompts_bg_color: department.theme.suggestedPromptsBgColor || "",
    suggested_prompts_text_color: department.theme.suggestedPromptsTextColor || "",
    background_image_url: department.theme.backgroundImageUrl || "",
    bot_avatar_url: department.theme.botAvatarUrl || "",
    header_logo_url: department.theme.headerLogoUrl || "",
  }))

  const { error: themeError } = await supabase
    .from("department_themes")
    .upsert(themePayload, { onConflict: "department_id" })

  if (themeError) {
    throw new Error(themeError.message)
  }

  // 3. Upsert integrations (encrypt api_key)
  const integrationPayload = parsed.data.departments.map((department) => ({
    department_id: department.id,
    api_endpoint: department.integration.endpoint,
    api_key_encrypted: department.integration.apiKey
      ? encrypt(department.integration.apiKey)
      : "",
    request_timeout_ms: department.integration.requestTimeoutMs,
    assistant_slug: department.integration.assistantSlug,
  }))

  const { error: integrationError } = await supabase
    .from("department_integrations")
    .upsert(integrationPayload, { onConflict: "department_id" })

  if (integrationError) {
    throw new Error(integrationError.message)
  }

  // 4. Upsert waiting configs
  const waitingPayload = parsed.data.departments.map((department) => ({
    department_id: department.id,
    mode: department.waitingConfig.mode,
    video_url: department.waitingConfig.videoUrl || "",
    text_content: department.waitingConfig.text || "",
    text_speed: department.waitingConfig.textSpeed || 60,
    cursor_color: department.waitingConfig.cursorColor || "",
  }))

  const { error: waitingError } = await supabase
    .from("department_waiting_configs")
    .upsert(waitingPayload, { onConflict: "department_id" })

  if (waitingError) {
    throw new Error(waitingError.message)
  }

  // 5. Delete removed departments
  const nextIds = parsed.data.departments.map((d) => d.id)
  const { data: currentIds, error: currentIdsError } = await supabase
    .from("departments")
    .select("id")

  if (currentIdsError) {
    throw new Error(currentIdsError.message)
  }

  const nextIdSet = new Set(nextIds)
  const idsToDelete =
    (currentIds as Array<{ id: string }> | null)
      ?.map((row: { id: string }) => row.id)
      .filter((id: string) => !nextIdSet.has(id)) ?? []

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

export async function saveDepartment(department: DepartmentConfig) {
  const supabase = getSupabaseAdmin() as any
  const existingConfig = await getCmsConfig({ includeSecrets: true }).catch(() => null)
  const existingSecrets = new Map(
    existingConfig?.departments.map((d) => [d.id, d.integration.apiKey]) ?? [],
  )

  const sanitized = sanitizeConfig(
    { departments: [department], updatedAt: new Date().toISOString() },
    existingSecrets,
  )

  const parsed = cmsConfigSchema.safeParse(sanitized)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dữ liệu CMS không hợp lệ.")
  }

  const sanitizedDepartment = parsed.data.departments[0]

  let displayOrder = 0
  const { data: existingRows } = await supabase.from("departments").select("id, display_order")
  
  if (existingRows) {
    const me = existingRows.find((r: any) => r.id === sanitizedDepartment.id)
    if (me) {
      displayOrder = me.display_order
    } else {
      const maxOrder = Math.max(-1, ...existingRows.map((r: any) => r.display_order))
      displayOrder = maxOrder + 1
    }
  }

  // 1. Upsert department
  const departmentPayload = {
    id: sanitizedDepartment.id,
    slug: sanitizedDepartment.slug,
    name: sanitizedDepartment.name,
    zone_label: sanitizedDepartment.zoneLabel,
    description: sanitizedDepartment.description,
    welcome_message: sanitizedDepartment.welcomeMessage,
    placeholder: sanitizedDepartment.placeholder,
    suggested_prompts: sanitizedDepartment.suggestedPrompts,
    display_order: displayOrder,
    is_active: true,
    inactivity_timeout_minutes: sanitizedDepartment.inactivityTimeoutMinutes ?? 5,
    updated_at: parsed.data.updatedAt,
  }

  const { error: upsertError } = await supabase
    .from("departments")
    .upsert(departmentPayload, { onConflict: "id" })

  if (upsertError) throw new Error(upsertError.message)

  // 2. Upsert theme
  const themePayload = {
    department_id: sanitizedDepartment.id,
    accent: sanitizedDepartment.theme.accent,
    accent_soft: sanitizedDepartment.theme.accentSoft,
    panel: sanitizedDepartment.theme.panel,
    surface: sanitizedDepartment.theme.surface,
    user_bubble: sanitizedDepartment.theme.userBubble,
    assistant_bubble: sanitizedDepartment.theme.assistantBubble,
    badge: sanitizedDepartment.theme.badge,
    suggested_prompts_bg_color: sanitizedDepartment.theme.suggestedPromptsBgColor || "",
    suggested_prompts_text_color: sanitizedDepartment.theme.suggestedPromptsTextColor || "",
    background_image_url: sanitizedDepartment.theme.backgroundImageUrl || "",
    bot_avatar_url: sanitizedDepartment.theme.botAvatarUrl || "",
    header_logo_url: sanitizedDepartment.theme.headerLogoUrl || "",
  }

  const { error: themeError } = await supabase
    .from("department_themes")
    .upsert(themePayload, { onConflict: "department_id" })

  if (themeError) throw new Error(themeError.message)

  // 3. Upsert integrations
  const integrationPayload = {
    department_id: sanitizedDepartment.id,
    api_endpoint: sanitizedDepartment.integration.endpoint,
    api_key_encrypted: sanitizedDepartment.integration.apiKey
      ? encrypt(sanitizedDepartment.integration.apiKey)
      : "",
    request_timeout_ms: sanitizedDepartment.integration.requestTimeoutMs,
    assistant_slug: sanitizedDepartment.integration.assistantSlug,
  }

  const { error: integrationError } = await supabase
    .from("department_integrations")
    .upsert(integrationPayload, { onConflict: "department_id" })

  if (integrationError) throw new Error(integrationError.message)

  // 4. Upsert waiting configs
  const waitingPayload = {
    department_id: sanitizedDepartment.id,
    mode: sanitizedDepartment.waitingConfig.mode,
    video_url: sanitizedDepartment.waitingConfig.videoUrl || "",
    text_content: sanitizedDepartment.waitingConfig.text || "",
    text_speed: sanitizedDepartment.waitingConfig.textSpeed || 60,
    cursor_color: sanitizedDepartment.waitingConfig.cursorColor || "",
  }

  const { error: waitingError } = await supabase
    .from("department_waiting_configs")
    .upsert(waitingPayload, { onConflict: "department_id" })

  if (waitingError) throw new Error(waitingError.message)

  return getCmsConfig()
}

export async function deleteDepartment(id: string) {
  const supabase = getSupabaseAdmin() as any
  const { error: deleteError } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  return getCmsConfig()
}
