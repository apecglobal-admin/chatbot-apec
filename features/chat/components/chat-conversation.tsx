"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { RotateCcw, Send, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DepartmentTheme } from "@/lib/cms-types";
import { hexToRgba } from "@/lib/color";

import type { ChatThreadMessage } from "../types";
import { BotAvatar } from "./bot-avatar";
import { ChatMessage } from "./chat-message";
import { FakeStreamingText } from "./fake-streaming-text";
import { VoiceButton } from "./voice-button";
import { WaitingVideo } from "./waiting-video";

function ResetTimerBar({
  targetTimestamp,
  durationSeconds,
  onClear,
  theme,
  forceShowButton,
}: {
  targetTimestamp: number | null;
  durationSeconds: number;
  onClear: () => void;
  theme: DepartmentTheme;
  forceShowButton: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(() =>
    targetTimestamp ? Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!targetTimestamp) return;
    
    // Initial sync
    setTimeLeft(Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)));
    const handle = setInterval(() => {
      setTimeLeft(
        Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)),
      );
    }, 1000);
    return () => clearInterval(handle);
  }, [targetTimestamp]);

  if (!targetTimestamp && !forceShowButton) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progressPercent = targetTimestamp ? (timeLeft / durationSeconds) * 100 : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-black/15 px-4 py-2.5 shadow-inner backdrop-blur-sm">
      {/* Left Section (Info) */}
      {targetTimestamp !== null && (
        <div className="flex w-[210px] flex-col gap-1.5">
          <span className="text-xs font-semibold text-white/95">
            Cuộc trò chuyện sẽ làm mới sau: {minutes}:{seconds}
          </span>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {/* Middle: Vertical divider */}
      {targetTimestamp !== null && (
        <div className="h-8 w-px bg-white/20" />
      )}

      {/* Right Section (Action) */}
      <button
        type="button"
        onClick={onClear}
        className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold shadow-md transition-all hover:scale-105 hover:brightness-110 active:scale-95"
        style={{ color: theme.accent }}
      >
        <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-90" strokeWidth={2.5} />
        <span>Làm mới ngay</span>
      </button>
    </div>
  );
}

interface ChatConversationProps {
  apiConfigured: boolean;
  autoClearTarget: number | null;
  departmentDescription: string;
  departmentName: string;
  errorMessage: string;
  inputValue: string;
  isListening: boolean;
  isSpeaking: boolean;
  isSubmitting: boolean;
  isTranscribing: boolean;
  messages: ChatThreadMessage[];
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPromptSelect: (prompt: string) => void;
  onStopSpeaking: () => void;
  onSubmit: () => void;
  onClearConversation: () => void;
  onVoicePressStart: () => void;
  onVoicePressEnd: () => void;
  onTtsEnabledChange: (enabled: boolean) => void;
  placeholder: string;
  recognitionSupported: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  suggestedPrompts: string[];
  theme: DepartmentTheme;
  ttsEnabled: boolean;
}

export function ChatConversation({
  apiConfigured,
  autoClearTarget,
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
  onClearConversation,
  onVoicePressStart,
  onVoicePressEnd,
  onTtsEnabledChange,
  placeholder,
  recognitionSupported,
  scrollRef,
  suggestedPrompts,
  theme,
  ttsEnabled,
}: ChatConversationProps) {
  const disabled = !apiConfigured || isSubmitting;
  const shouldShowWaitingState =
    isSubmitting &&
    !(
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      messages[messages.length - 1].content.length > 0
    );
  const waitingIndicatorMode =
    theme.waitingIndicatorMode === "video" ? "video" : "text";
  const waitingVideoUrl = theme.waitingVideoUrl || "/Robot-dao-boi.webm";

  const backgroundImage = theme.backgroundImageUrl
    ? `url("${theme.backgroundImageUrl}")`
    : "linear-gradient(180deg,#F7F4EC_0%,#EEF7F0_52%,#F7F0E9_100%)";

  return (
    <section className="relative flex h-full flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div
        className="relative z-10 shrink-0 flex items-center justify-between px-6 py-4 md:px-8"
        style={{ backgroundColor: theme.accent }}
      >
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">
            {departmentName}
          </h2>
          {departmentDescription ? (
            <p className="mt-1 text-sm text-white/90">
              {departmentDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-center">
          <ResetTimerBar
            targetTimestamp={messages.length > 1 ? autoClearTarget : null}
            durationSeconds={(theme.inactivityTimeoutMinutes ?? 5) * 60}
            onClear={onClearConversation}
            theme={theme}
            forceShowButton={messages.length > 1 || !!errorMessage}
          />
        </div>
      </div>

      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{
          backgroundImage,
          backgroundPosition: "center",
          backgroundSize: theme.backgroundImageUrl ? "cover" : undefined,
        }}
      >
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 space-y-6 overflow-y-auto px-6 py-6 md:px-8"
        >
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
                    text={
                      theme.waitingText ||
                      "Đang tìm câu trả lời phù hợp cho bạn"
                    }
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

      <div className="relative z-10 border-t border-slate-200/60 px-5 pb-5 pt-4 md:px-8">
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
                  className={[
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                    !theme.suggestedPromptsTextColor ? "text-slate-100" : ""
                  ].filter(Boolean).join(" ")}
                  style={{
                    backgroundColor: theme.suggestedPromptsBgColor || hexToRgba(theme.accent, 0.9),
                    color: theme.suggestedPromptsTextColor || undefined,
                    borderColor: theme.suggestedPromptsBgColor ? "transparent" : hexToRgba(theme.accent, 0.14),
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-3">
          <div className="flex-1 rounded-[20px] border border-slate-200 bg-white px-1.5 shadow-sm transition focus-within:border-slate-300 focus-within:shadow-md">
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
              boxShadow: `0 12px 28px ${hexToRgba(theme.accent, 0.7)}`,
            }}
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>

        <div className="relative z-50 mt-4 flex w-full flex-col items-center">
          <div className="relative flex min-h-[64px] w-full items-center justify-center">
            <div className="absolute left-5 flex flex-col items-start gap-5">
              <Button
                type="button"
                variant="outline"
                onClick={onStopSpeaking}
                className={[
                  "rounded-full border-rose-200 bg-white/70 shadow-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all",
                  isSpeaking ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                ].join(" ")}
              >
                <VolumeX className="mr-2 h-4 w-4" />
                {"Dừng đọc"}
              </Button>

              <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 shadow-lg transition-all">
                <Switch
                  id="tts-toggle"
                  checked={ttsEnabled}
                  onCheckedChange={onTtsEnabledChange}
                />
                <Label
                  htmlFor="tts-toggle"
                  className="cursor-pointer text-sm font-semibold text-slate-700"
                >
                  Tự động đọc
                </Label>
              </div>
            </div>

            <VoiceButton
              accent={theme.accent}
              disabled={disabled || !recognitionSupported}
              isListening={isListening}
              isTranscribing={isTranscribing}
              onPressStart={onVoicePressStart}
              onPressEnd={onVoicePressEnd}
            />
          </div>

          {!apiConfigured ? (
            <p className="mt-2 text-center text-sm text-amber-700">
              {
                "API của ngành hàng này chưa được cấu hình nên chatbot đang bị khóa gửi tin."
              }
            </p>
          ) : null}
        </div>
      </div>
      </div>
    </section>
  );
}
