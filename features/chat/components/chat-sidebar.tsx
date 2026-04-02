"use client"

import type { KeyboardEvent } from "react"
import { Send, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { hexToRgba } from "@/lib/color"
import type { DepartmentConfig } from "@/lib/cms-types"

import { VoiceButton } from "./voice-button"

interface ChatSidebarProps {
  apiConfigured: boolean
  department: DepartmentConfig
  inputValue: string
  isListening: boolean
  isSpeaking: boolean
  isSubmitting: boolean
  onInputChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptSelect: (prompt: string) => void
  onStopSpeaking: () => void
  onSubmit: () => void
  onToggleListening: () => void
  recognitionSupported: boolean
}

export function ChatSidebar({
  apiConfigured,
  department,
  inputValue,
  isListening,
  isSpeaking,
  isSubmitting,
  onInputChange,
  onInputKeyDown,
  onPromptSelect,
  onStopSpeaking,
  onSubmit,
  onToggleListening,
  recognitionSupported,
}: ChatSidebarProps) {
  const disabled = !apiConfigured || isSubmitting

  return (
    <aside className="flex flex-col gap-5">
      <section className="rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          {"G\u1ee3i \u00fd m\u1edf \u0111\u1ea7u"}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          {"B\u1eaft \u0111\u1ea7u nhanh v\u1edbi c\u00e2u h\u1ecfi m\u1eabu"}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {department.suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPromptSelect(prompt)}
              disabled={disabled}
              className="rounded-full border px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: hexToRgba(department.theme.accent, 0.08),
                borderColor: hexToRgba(department.theme.accent, 0.12),
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              {"So\u1ea1n c\u00e2u h\u1ecfi"}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {"Nh\u1eadp ho\u1eb7c d\u00f9ng gi\u1ecdng n\u00f3i"}
            </h3>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: recognitionSupported
                ? hexToRgba(department.theme.accent, 0.12)
                : "#FEE2E2",
              color: recognitionSupported ? department.theme.badge : "#BE123C",
            }}
          >
            <Volume2 className="h-3.5 w-3.5" />
            {recognitionSupported ? "Voice ready" : "Voice unsupported"}
          </span>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-2">
          <Textarea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={department.placeholder || "Nh\u1eadp c\u00e2u h\u1ecfi c\u1ee7a b\u1ea1n..."}
            disabled={disabled}
            className="min-h-[132px] resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <p className="text-xs text-slate-500">
              {"Enter \u0111\u1ec3 g\u1eedi, Shift + Enter \u0111\u1ec3 xu\u1ed1ng d\u00f2ng"}
            </p>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!inputValue.trim() || disabled}
              className="rounded-full px-5 text-sm font-semibold text-white"
              style={{
                backgroundColor: department.theme.accent,
                boxShadow: `0 16px 32px ${hexToRgba(department.theme.accent, 0.24)}`,
              }}
            >
              {"G\u1eedi"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-4 py-5">
          <VoiceButton
            accent={department.theme.accent}
            disabled={disabled || !recognitionSupported}
            isListening={isListening}
            onClick={onToggleListening}
          />

          {isSpeaking ? (
            <Button
              type="button"
              variant="outline"
              onClick={onStopSpeaking}
              className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              {"D\u1eebng \u0111\u1ecdc"}
            </Button>
          ) : null}

          {!apiConfigured ? (
            <p className="text-center text-sm text-amber-700">
              {"API c\u1ee7a ng\u00e0nh h\u00e0ng n\u00e0y ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh n\u00ean chatbot \u0111ang b\u1ecb kh\u00f3a g\u1eedi tin."}
            </p>
          ) : null}
        </div>
      </section>
    </aside>
  )
}
