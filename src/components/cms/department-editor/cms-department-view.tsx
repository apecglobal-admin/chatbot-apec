import { Bot, ExternalLink, Palette, Settings2 } from "lucide-react"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DepartmentConfig } from "@/lib/cms-types"

import { SectionCard } from "../shared/section-card"
import {
  cmsInputClass,
  cmsTextareaClass,
} from "../shared/styles"
import { CloudinaryMediaInput } from "./cloudinary-media-input"
import { CmsDepartmentPreview } from "./cms-department-preview"
import { FieldBlock } from "./field-block"
import { themeFields } from "./theme-fields"

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

          <FieldBlock label="Placeholder ô chat" className="md:col-span-2">
            <Textarea
              value={department.placeholder}
              onChange={(event) => onUpdateDepartment("placeholder", event.target.value)}
              className={cmsTextareaClass}
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
                    value={department.theme[field] || "#000000"}
                    onChange={(event) => onUpdateTheme(field, event.target.value)}
                    className="h-9 w-10 rounded-lg border-0 bg-transparent"
                  />
                  <Input
                    value={department.theme[field] || ""}
                    onChange={(event) => onUpdateTheme(field, event.target.value)}
                    className="h-9 rounded-xl border-0 bg-white shadow-none"
                    placeholder="Mặc định"
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

          <FieldBlock
            label="API key"
            hint={
              department.integration.apiKeyConfigured
                ? "Để trống nếu giữ key hiện tại."
                : "Thiếu API key."
            }
            className="md:col-span-2"
            isError={!department.integration.apiKeyConfigured}
          >
            <Input
              type="password"
              value={department.integration.apiKey}
              onChange={(event) => onUpdateIntegration("apiKey", event.target.value)}
              className={cmsInputClass}
              placeholder={
                department.integration.apiKeyConfigured
                  ? "******"
                  : "Nhập API key"
              }
            />
          </FieldBlock>

          <FieldBlock label="Endpoint" className="md:col-span-2">
            <Input
              value={department.integration.endpoint}
              onChange={(event) => onUpdateIntegration("endpoint", event.target.value)}
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

          <FieldBlock label="User prefix">
            <Input
              value={department.integration.partnerUserPrefix}
              onChange={(event) =>
                onUpdateIntegration("partnerUserPrefix", event.target.value)
              }
              className={cmsInputClass}
            />
          </FieldBlock>

          <FieldBlock label="Auto clear chat (phút)" hint="Reset trò chuyện nếu không có tin nhắn mới.">
            <Input
              type="number"
              min={1}
              max={60}
              value={department.theme.inactivityTimeoutMinutes ?? 5}
              onChange={(event) =>
                onUpdateTheme(
                  "inactivityTimeoutMinutes",
                  event.target.value
                )
              }
              className={cmsInputClass}
            />
          </FieldBlock>

          <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-100">
            <Button
              variant="default"
              className="w-full gap-2 rounded-2xl bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-[0.98]"
              asChild
            >
              <a
                href="https://chatbot.apecglobal.net/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Đào tạo chatbot
              </a>
            </Button>
            <p className="mt-2 text-center text-xs text-slate-400 font-medium">
              Truy cập hệ thống quản trị tri thức để đào tạo thêm dữ liệu cho chatbot.
            </p>
          </div>
        </SectionCard>
      </div>

      <CmsDepartmentPreview department={department} />
    </div>
  )
}
