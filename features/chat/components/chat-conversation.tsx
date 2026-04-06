"use client"

import type { KeyboardEvent, RefObject } from "react"
import { Send, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { DepartmentTheme } from "@/lib/cms-types"
import { hexToRgba } from "@/lib/color"

import type { ChatThreadMessage } from "../types"
import { BotAvatar } from "./bot-avatar"
import { ChatMessage } from "./chat-message"
import { FakeStreamingText } from "./fake-streaming-text"
import { VoiceButton } from "./voice-button"
import { WaitingVideo } from "./waiting-video"

interface ChatConversationProps {
  apiConfigured: boolean
  departmentDescription: string
  departmentName: string
  errorMessage: string
  inputValue: string
  isListening: boolean
  isSpeaking: boolean
  isSubmitting: boolean
  isTranscribing: boolean
  messages: ChatThreadMessage[]
  onInputChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptSelect: (prompt: string) => void
  onStopSpeaking: () => void
  onSubmit: () => void
  onVoicePressStart: () => void
  onVoicePressEnd: () => void
  placeholder: string
  recognitionSupported: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  suggestedPrompts: string[]
  theme: DepartmentTheme
}

export function ChatConversation({
  apiConfigured,
  departmentDescription,
  departmentName,
  errorMessage,
  inputValue,
  isListening,
  isSpeaking,
  isSubmitting,
  isTranscribing,
  messages,
  onInputChange,
  onInputKeyDown,
  onPromptSelect,
  onStopSpeaking,
  onSubmit,
  onVoicePressStart,
  onVoicePressEnd,
  placeholder,
  recognitionSupported,
  scrollRef,
  suggestedPrompts,
  theme,
}: ChatConversationProps) {
  const disabled = !apiConfigured || isSubmitting
  const shouldShowWaitingState =
    isSubmitting &&
    !(
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      messages[messages.length - 1].content.length > 0
    )
  const waitingIndicatorMode = theme.waitingIndicatorMode === "video" ? "video" : "text"
  const waitingVideoUrl = theme.waitingVideoUrl || "/Robot-dao-boi.webm"

  return (
    <section className="relative flex h-full flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="px-6 py-4 md:px-8" style={{ backgroundColor: theme.accent }}>
        <h2 className="text-lg font-bold text-white md:text-xl">{departmentName}</h2>
        {departmentDescription ? (
          <p className="mt-1 text-sm text-white/90">{departmentDescription}</p>
        ) : null}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 md:px-8">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            theme={theme}
          />
        ))}

        {shouldShowWaitingState ? (
          <div className="mr-auto flex max-w-[90%] gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <BotAvatar theme={theme} />
            <div className="flex flex-col gap-1.5">
              {waitingIndicatorMode === "video" ? (
                <WaitingVideo url={waitingVideoUrl} />
              ) : (
                <div
                  className="rounded-[24px] rounded-bl-md border bg-white/92 px-4 py-3.5 text-sm leading-6 text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                  style={{
                    borderColor: hexToRgba(theme.accent, 0.14),
                  }}
                >
                  <FakeStreamingText
                    text={theme.waitingText || "Đang tìm câu trả lời phù hợp cho bạn"}
                    speed={theme.waitingTextSpeed || 60}
                    cursorColor={theme.waitingCursorColor || theme.accent}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="relative border-t border-slate-200/60 bg-gradient-to-t from-white/95 via-white/90 to-white/70 px-5 pb-5 pt-4 md:px-8">
        {suggestedPrompts.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              {"Có thể bạn muốn hỏi"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPromptSelect(prompt)}
                  disabled={disabled}
                  className="rounded-full border px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: hexToRgba(theme.accent, 0.08),
                    borderColor: hexToRgba(theme.accent, 0.14),
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-3">
          <div className="flex-1 rounded-[20px] border border-slate-200 bg-white/90 px-1.5 shadow-sm transition focus-within:border-slate-300 focus-within:shadow-md">
            <Textarea
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder || "Nhập câu hỏi của bạn..."}
              disabled={disabled}
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-3 text-sm leading-6 text-slate-900 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!inputValue.trim() || disabled}
            className="h-[52px] w-[52px] shrink-0 rounded-full p-0 text-white shadow-lg transition hover:scale-105"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 12px 28px ${hexToRgba(theme.accent, 0.28)}`,
            }}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative z-50 mt-4 flex flex-col items-center gap-2">
          <VoiceButton
            accent={theme.accent}
            disabled={disabled || !recognitionSupported}
            isListening={isListening}
            isTranscribing={isTranscribing}
            onPressStart={onVoicePressStart}
            onPressEnd={onVoicePressEnd}
          />

          {isSpeaking ? (
            <Button
              type="button"
              variant="outline"
              onClick={onStopSpeaking}
              className="mt-1 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              {"Dừng đọc"}
            </Button>
          ) : null}

          {!apiConfigured ? (
            <p className="text-center text-sm text-amber-700">
              {"API của ngành hàng này chưa được cấu hình nên chatbot đang bị khóa gửi tin."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
