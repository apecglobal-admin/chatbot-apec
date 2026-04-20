"use client"

import { AlertTriangle, Bot, MessageSquareText, Workflow } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/utils/ui"
import { SectionCard } from "../shared/section-card"
import { MetricCard } from "./metric-card"
import { useCms } from "../layout/cms-provider"

export function DashboardView() {
  const {
    config,
    isDirty,
    configuredCount,
    missingApiKeyCount,
    departmentsWithPromptSet,
    openDepartment,
  } = useCms()

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Ngành hàng"
          value={`${config.departments.length}`}
          hint="Số chatbot đang được quản lý."
          icon={Bot}
          tone="slate"
        />
        <MetricCard
          label="API key riêng"
          value={`${configuredCount}/${config.departments.length}`}
          hint="Mức độ hoàn thiện kết nối backend."
          icon={Bot}
          tone="emerald"
        />
        <MetricCard
          label="Prompt gợi ý"
          value={`${departmentsWithPromptSet}/${config.departments.length}`}
          hint={isDirty ? "Có thay đổi chưa lưu trong phiên làm việc." : "Phiên hiện tại đã đồng bộ."}
          icon={MessageSquareText}
          tone={isDirty ? "amber" : "blue"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard
          title="Ưu tiên xử lý"
          description="Những phần nên hoàn thiện trước để giảm lỗi vận hành."
          icon={AlertTriangle}
        >
          <div className="space-y-2">
            {[
              {
                label: "Quầy thiếu API key",
                value: `${missingApiKeyCount} mục`,
                tone:
                  missingApiKeyCount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
              },
              {
                label: "Quầy chưa đủ prompt",
                value: `${config.departments.length - departmentsWithPromptSet} mục`,
                tone:
                  departmentsWithPromptSet < config.departments.length
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <span className="text-sm font-medium text-slate-800">{item.label}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", item.tone)}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Danh sách ngành hàng"
          description="Một bảng gọn để truy cập nhanh, không lặp nội dung không cần thiết."
          icon={Workflow}
        >
          <div className="overflow-hidden rounded-[18px] border border-slate-200">
            <div className="grid grid-cols-[minmax(0,3fr)_100px_100px_70px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Ngành hàng</span>
              <span>Vị trí</span>
              <span>API key</span>
              <span>Prompt</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {config.departments.map((department, index) => (
                <button
                  key={`${department.id}-${index}-row`}
                  type="button"
                  onClick={() => openDepartment(index)}
                  className="grid w-full grid-cols-[minmax(0,3fr)_100px_100px_70px] gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{department.name}</p>
                    <p className="truncate text-xs text-slate-500">{department.slug}</p>
                  </div>
                  <span className="text-sm text-slate-700">{department.zoneLabel}</span>
                  <span>
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-1",
                        department.integration.apiKeyConfigured
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {department.integration.apiKeyConfigured ? "Sẵn sàng" : "Thiếu"}
                    </Badge>
                  </span>
                  <span className="text-sm text-slate-700">{department.suggestedPrompts.length}</span>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
