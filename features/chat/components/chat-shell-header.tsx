"use client"

import Link from "next/link"
import { ArrowLeft, Bot, Sparkles, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { hexToRgba } from "@/lib/color"
import type { DepartmentConfig } from "@/lib/cms-types"

interface ChatShellHeaderProps {
  department: DepartmentConfig
  apiConfigured: boolean
  isSpeaking: boolean
  onStopSpeaking: () => void
}

export function ChatShellHeader({
  department,
  apiConfigured,
  isSpeaking,
  onStopSpeaking,
}: ChatShellHeaderProps) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
            style={{
              backgroundColor: department.theme.headerLogoUrl
                ? "#FFFFFF"
                : hexToRgba(department.theme.accent, 0.14),
            }}
          >
            {department.theme.headerLogoUrl ? (
              <img
                src={department.theme.headerLogoUrl}
                alt={department.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Bot
                className="h-8 w-8"
                style={{ color: department.theme.accent }}
              />
            )}
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách ngành hàng
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: department.theme.accentSoft,
                  color: department.theme.badge,
                }}
              >
                {department.zoneLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Trợ lý theo ngành hàng
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                {department.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                {department.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:min-w-[280px]">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Trạng thái
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {apiConfigured ? "API đã sẵn sàng" : "API chưa được cấu hình"}
            </p>
            <p className="text-sm leading-6 text-slate-500">
              Giao diện chat đã được làm đồng bộ với homepage để giữ trải nghiệm nhất quán.
            </p>
          </div>

          {isSpeaking ? (
            <Button
              type="button"
              variant="outline"
              onClick={onStopSpeaking}
              className="rounded-full border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              Dừng đọc phản hồi
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
