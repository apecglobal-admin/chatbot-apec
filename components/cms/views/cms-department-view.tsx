import { Bot, LayoutTemplate, Palette, Settings2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { hexToRgba } from "@/lib/color"
import type { DepartmentConfig } from "@/lib/cms-types"

import { themeFields } from "../config/theme-fields"
import { CloudinaryMediaInput } from "../shared/cloudinary-media-input"
import { FieldBlock } from "../shared/field-block"
import { SectionCard } from "../shared/section-card"
import {
  cmsInputClass,
  cmsInsetClass,
  cmsTextareaClass,
} from "../shared/styles"

interface CmsDepartmentViewProps {
  department: DepartmentConfig
  onUpdateDepartment: <K extends keyof DepartmentConfig>(
    field: K,
    value: DepartmentConfig[K],
  ) => void
  onUpdateIntegration: (
    field: keyof DepartmentConfig["integration"],
    value: string | number | boolean,
  ) => void
  onUpdateTheme: (
    field: keyof DepartmentConfig["theme"],
    value: string,
  ) => void
  onUploadThemeMedia: (
    field: keyof DepartmentConfig["theme"],
    value: string,
  ) => Promise<void> | void
}

export function CmsDepartmentView({
  department,
  onUpdateDepartment,
  onUpdateIntegration,
  onUpdateTheme,
  onUploadThemeMedia,
}: CmsDepartmentViewProps) {
  const waitingIndicatorMode =
    department.theme.waitingIndicatorMode === "video" ? "video" : "text"
  const waitingVideoUrl = department.theme.waitingVideoUrl || "/Robot-dao-boi.webm"
  const previewBackground = department.theme.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, ${hexToRgba(
          department.theme.panel,
          0.9,
        )} 0%, ${hexToRgba(department.theme.surface, 0.86)} 100%), url(${department.theme.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: `linear-gradient(135deg, ${department.theme.panel} 0%, ${department.theme.surface} 100%)`,
      }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <SectionCard
          title="Nội dung chính"
          description="Phần định danh và nội dung hội thoại cốt lõi."
          icon={Settings2}
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          <FieldBlock label="Tên hiển thị">
            <Input
              value={department.name}
              onChange={(event) => onUpdateDepartment("name", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Kệ / vị trí">
            <Input
              value={department.zoneLabel}
              onChange={(event) => onUpdateDepartment("zoneLabel", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Slug URL">
            <Input
              value={department.slug}
              onChange={(event) => onUpdateDepartment("slug", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="ID nội bộ">
            <Input
              value={department.id}
              onChange={(event) => onUpdateDepartment("id", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Mô tả ngành hàng" className="md:col-span-2">
            <Textarea
              value={department.description}
              onChange={(event) => onUpdateDepartment("description", event.target.value)}
              className={`${cmsTextareaClass} min-h-[60px]`}
            />
          </FieldBlock>

          <FieldBlock label="Lời chào mở đầu" className="md:col-span-2">
            <Textarea
              value={department.welcomeMessage}
              onChange={(event) =>
                onUpdateDepartment("welcomeMessage", event.target.value)
              }
              className={`${cmsTextareaClass} min-h-[60px]`}
            />
          </FieldBlock>

          <FieldBlock label="Placeholder ô chat">
            <Input
              value={department.placeholder}
              onChange={(event) => onUpdateDepartment("placeholder", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock
            label="Prompt gợi ý"
            hint="Mỗi dòng là một câu hỏi mẫu."
            className="md:col-span-2"
          >
            <Textarea
              value={department.suggestedPrompts.join("\n")}
              onChange={(event) =>
                onUpdateDepartment(
                  "suggestedPrompts",
                  event.target.value
                    .split("\n")
                    .map((prompt) => prompt.trim())
                    .filter(Boolean),
                )
              }
              className={`${cmsTextareaClass} min-h-[130px]`}
            />
          </FieldBlock>
        </SectionCard>

        <SectionCard
          title="Hiển thị khi chờ"
          description="Cấu hình text typewriter hoặc video trong lúc AI đang trả lời."
          icon={Settings2}
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          <FieldBlock
            label="Hiển thị khi chờ"
            hint="Chọn text typewriter hoặc video trong lúc AI đang trả lời."
          >
            <Select
              value={waitingIndicatorMode}
              onValueChange={(value) => onUpdateTheme("waitingIndicatorMode", value)}
            >
              <SelectTrigger className={`${cmsInputClass} w-full`}>
                <SelectValue placeholder="Chọn kiểu hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text typewriter</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </FieldBlock>

          {waitingIndicatorMode === "text" ? (
            <>
              <FieldBlock
                label="Text chờ phản hồi"
                hint="Hiệu ứng typewriter khi chờ AI trả lời."
              >
                <Input
                  value={department.theme.waitingText ?? ""}
                  onChange={(event) => onUpdateTheme("waitingText", event.target.value)}
                  className={cmsInputClass}
                  placeholder="Đang tìm câu trả lời phù hợp cho bạn"
                />
              </FieldBlock>
              <FieldBlock
                label="Tốc độ gõ (ms)"
                hint="Khoảng cách giữa mỗi ký tự (20-200)."
              >
                <Input
                  type="number"
                  min={20}
                  max={200}
                  value={department.theme.waitingTextSpeed ?? 60}
                  onChange={(event) =>
                    onUpdateTheme("waitingTextSpeed", event.target.value)
                  }
                  className={cmsInputClass}
                />
              </FieldBlock>
              <FieldBlock label="Màu con trỏ gõ">
                <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <input
                    type="color"
                    value={
                      department.theme.waitingCursorColor || department.theme.accent
                    }
                    onChange={(event) =>
                      onUpdateTheme("waitingCursorColor", event.target.value)
                    }
                    className="h-9 w-10 rounded-lg border-0 bg-transparent"
                  />
                  <Input
                    value={department.theme.waitingCursorColor ?? ""}
                    onChange={(event) =>
                      onUpdateTheme("waitingCursorColor", event.target.value)
                    }
                    className="h-9 rounded-xl border-0 bg-white shadow-none"
                    placeholder={department.theme.accent}
                  />
                </div>
              </FieldBlock>
            </>
          ) : (
            <FieldBlock
              label="Video chờ phản hồi"
              hint="Dán URL hoặc upload video lên Cloudinary. Nếu để trống sẽ fallback về /Robot-dao-boi.webm."
              className="xl:col-span-3"
            >
              <CloudinaryMediaInput
                resourceType="video"
                accept="video/*"
                value={department.theme.waitingVideoUrl ?? ""}
                onChange={(value) => onUpdateTheme("waitingVideoUrl", value)}
                onUploadComplete={(value) =>
                  onUploadThemeMedia("waitingVideoUrl", value)
                }
                placeholder="https://res.cloudinary.com/.../video/upload/..."
              />
            </FieldBlock>
          )}
        </SectionCard>

        <SectionCard
          title="Giao diện & media"
          description="Màu sắc, hình ảnh và video hiển thị của chatbot."
          icon={Palette}
          contentClassName="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {themeFields.map(({ field, label }) => (
              <FieldBlock key={field} label={label}>
                <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <input
                    type="color"
                    value={department.theme[field]}
                    onChange={(event) => onUpdateTheme(field, event.target.value)}
                    className="h-9 w-10 rounded-lg border-0 bg-transparent"
                  />
                  <Input
                    value={department.theme[field]}
                    onChange={(event) => onUpdateTheme(field, event.target.value)}
                    className="h-9 rounded-xl border-0 bg-white shadow-none"
                  />
                </div>
              </FieldBlock>
            ))}
          </div>

          <div className="grid gap-4">
            <FieldBlock
              label="Ảnh nền"
              hint="Dán URL hoặc upload trực tiếp lên Cloudinary."
            >
              <CloudinaryMediaInput
                resourceType="image"
                accept="image/*"
                value={department.theme.backgroundImageUrl ?? ""}
                onChange={(value) => onUpdateTheme("backgroundImageUrl", value)}
                onUploadComplete={(value) =>
                  onUploadThemeMedia("backgroundImageUrl", value)
                }
                placeholder="https://example.com/background.jpg"
              />
            </FieldBlock>
            <FieldBlock
              label="Avatar chatbot"
              hint="Dán URL hoặc upload trực tiếp lên Cloudinary."
            >
              <CloudinaryMediaInput
                resourceType="image"
                accept="image/*"
                value={department.theme.botAvatarUrl ?? ""}
                onChange={(value) => onUpdateTheme("botAvatarUrl", value)}
                onUploadComplete={(value) => onUploadThemeMedia("botAvatarUrl", value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </FieldBlock>
            <FieldBlock
              label="Logo trợ lý"
              hint="Dán URL hoặc upload trực tiếp lên Cloudinary."
            >
              <CloudinaryMediaInput
                resourceType="image"
                accept="image/*"
                value={department.theme.headerLogoUrl ?? ""}
                onChange={(value) => onUpdateTheme("headerLogoUrl", value)}
                onUploadComplete={(value) => onUploadThemeMedia("headerLogoUrl", value)}
                placeholder="https://example.com/logo.jpg"
              />
            </FieldBlock>
          </div>
        </SectionCard>

        <SectionCard
          title="Backend"
          description="Các tham số kết nối assistant và API riêng."
          icon={Bot}
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          <FieldBlock label="Assistant slug">
            <Input
              value={department.integration.assistantSlug}
              onChange={(event) =>
                onUpdateIntegration("assistantSlug", event.target.value)
              }
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Timeout request (ms)">
            <Input
              type="number"
              min={3000}
              max={60000}
              value={department.integration.requestTimeoutMs}
              onChange={(event) =>
                onUpdateIntegration(
                  "requestTimeoutMs",
                  Number(event.target.value) || 20000,
                )
              }
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Endpoint" className="md:col-span-2">
            <Input
              value={department.integration.endpoint}
              onChange={(event) => onUpdateIntegration("endpoint", event.target.value)}
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="User prefix">
            <Input
              value={department.integration.partnerUserPrefix}
              onChange={(event) =>
                onUpdateIntegration("partnerUserPrefix", event.target.value)
              }
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock
            label="API key riêng"
            hint={
              department.integration.apiKeyConfigured
                ? "Để trống nếu giữ key hiện tại."
                : "Nhập key riêng để tách luồng chatbot này."
            }
            className="md:col-span-2"
          >
            <Input
              type="password"
              value={department.integration.apiKey}
              onChange={(event) => onUpdateIntegration("apiKey", event.target.value)}
              className={cmsInputClass}
              placeholder={
                department.integration.apiKeyConfigured
                  ? "Để trống để giữ API key hiện tại"
                  : "Nhập API key riêng"
              }
            />
          </FieldBlock>
        </SectionCard>
      </div>

      <SectionCard
        title="Preview"
        description="Kiểm tra giao diện trước khi lưu"
        icon={LayoutTemplate}
        className="h-fit xl:sticky xl:top-4"
      >
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            <div className="p-3" style={previewBackground}>
              <div className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{department.name}</p>
                    <p className="text-xs text-slate-500">{department.zoneLabel}</p>
                  </div>
                  <Badge
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor: department.theme.accentSoft,
                      color: department.theme.badge,
                    }}
                  >
                    Live preview
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <div
                    className="ml-auto max-w-[88%] rounded-[18px] px-4 py-3 text-sm text-white"
                    style={{ backgroundColor: department.theme.userBubble }}
                  >
                    {department.suggestedPrompts[0] ||
                      "Khách đang hỏi về sản phẩm tại quầy này."}
                  </div>
                  <div
                    className="max-w-[88%] rounded-[18px] px-4 py-3 text-sm text-slate-900"
                    style={{ backgroundColor: department.theme.assistantBubble }}
                  >
                    {department.welcomeMessage || "Lời chào chatbot sẽ hiển thị tại đây."}
                  </div>
                  <div className="max-w-[88%] rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    {waitingIndicatorMode === "video" ? (
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-20 w-20 rounded-2xl object-contain"
                      >
                        <source src={waitingVideoUrl} />
                      </video>
                    ) : (
                      <span>
                        {department.theme.waitingText ||
                          "Đang tìm câu trả lời phù hợp cho bạn"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${cmsInsetClass} space-y-2 px-3 py-3`}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">Assistant slug</span>
              <span className="font-semibold text-slate-950">
                {department.integration.assistantSlug}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">Prompt gợi ý</span>
              <span className="font-semibold text-slate-950">
                {department.suggestedPrompts.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">Media</span>
              <span className="font-semibold text-slate-950">
                {department.theme.backgroundImageUrl ||
                department.theme.botAvatarUrl ||
                department.theme.headerLogoUrl ||
                department.theme.waitingVideoUrl
                  ? "Đã có"
                  : "Mặc định"}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
