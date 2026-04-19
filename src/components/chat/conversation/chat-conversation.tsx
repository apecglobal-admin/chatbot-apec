"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { RotateCcw, Send, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DepartmentConfig, DepartmentTheme } from "@/types/cms";
import { hexToRgba } from "@/utils/color";

import { ResetTimerBar } from "./reset-timer-bar";
import { VoiceButton } from "./voice-button";
import { useChatConversation } from "../hooks/use-chat-conversation";
import { useVoiceAssistant } from "../hooks/use-voice-assistant";
import { BotAvatar } from "../shared/bot-avatar";
import { WalkingRobot } from "../shared/walking-robot";
import type { ChatThreadMessage } from "@/types/chat";
import { FakeStreamingText } from "../waiting-response/fake-streaming-text";
import { WaitingVideo } from "../waiting-response/waiting-video";
import { ChatMessage } from "./chat-message";


interface ChatConversationProps {
  department: DepartmentConfig;
  apiConfigured: boolean;
}

export function ChatConversation({
  department,
  apiConfigured,
}: ChatConversationProps) {
  const [inputValue, setInputValue] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoClearTarget, setAutoClearTarget] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const appendTTSChunkRef = useRef<((chunk: string) => void) | null>(null);
  const flushTTSRef = useRef<(() => void) | null>(null);
  const ttsEnabledRef = useRef(ttsEnabled);

  const {
    clearConversation,
    errorMessage,
    isSubmitting,
    messages,
    sendMessage,
    suggestedPrompts,
  } = useChatConversation({
    department,
    apiConfigured,
    onAssistantChunk: (chunk) => {
      if (ttsEnabledRef.current) {
        appendTTSChunkRef.current?.(chunk);
      }
    },
    onAssistantMessage: () => {
      if (ttsEnabledRef.current) {
        flushTTSRef.current?.();
      }
    },
  });

  const {
    isListening,
    isSpeaking,
    isTranscribing,
    recognitionSupported,
    appendTTSChunk,
    flushTTS,
    startListening,
    stopListening,
    stopSpeaking,
  } = useVoiceAssistant({
    onTranscriptChange: setInputValue,
    onTranscriptComplete: (text) => {
      setInputValue("");
      void sendMessage(text);
    },
    currentTranscript: inputValue,
  });

  useEffect(() => {
    appendTTSChunkRef.current = appendTTSChunk;
    flushTTSRef.current = flushTTS;
  }, [appendTTSChunk, flushTTS]);

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [inputValue, isListening, isSubmitting, messages]);

  useEffect(() => {
    setInputValue("");
  }, [department.slug]);

  const handleClearConversation = useCallback(() => {
    setInputValue("");
    setTtsEnabled(true);
    clearConversation();
  }, [clearConversation]);

  const inactivityTimeoutMinutes = department.inactivityTimeoutMinutes ?? 5;

  useEffect(() => {
    if (messages.length <= 1) {
      setAutoClearTarget(null);
      return;
    }

    const duration = inactivityTimeoutMinutes * 60 * 1000;
    setAutoClearTarget(Date.now() + duration);

    const timeoutId = setTimeout(() => {
      handleClearConversation();
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [
    messages,
    inputValue,
    isListening,
    handleClearConversation,
    inactivityTimeoutMinutes,
  ]);

  const handleSubmit = useCallback(
    (value: string) => {
      const nextValue = value.trim();

      if (!nextValue || isSubmitting || !apiConfigured) {
        return;
      }

      stopSpeaking();
      stopListening();
      setInputValue("");
      void sendMessage(nextValue);
    },
    [apiConfigured, isSubmitting, sendMessage, stopListening, stopSpeaking],
  );

  const theme = department.theme;
  const disabled = !apiConfigured || isSubmitting;
  const shouldShowWaitingState =
    isSubmitting &&
    !(
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      messages[messages.length - 1].content.length > 0
    );
  const waitingIndicatorMode =
    department.waitingConfig.mode === "video" ? "video" : "text";
  const waitingVideoUrl =
    department.waitingConfig.videoUrl || "/Robot-dao-boi.webm";
  const backgroundImage = theme.backgroundImageUrl
    ? `url("${theme.backgroundImageUrl}")`
    : "linear-gradient(180deg,#F7F4EC_0%,#EEF7F0_52%,#F7F0E9_100%)";

  return (
    <main className="relative flex h-screen flex-col bg-slate-50/50 px-4 py-6 md:px-8">
      <WalkingRobot />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60"
        style={{
          background: `radial-gradient(circle at top right, ${hexToRgba(theme.accent, 0.16)}, transparent 42%)`,
        }}
      />

      <section className="relative mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-4xl border border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div
          className="relative z-10 flex shrink-0 items-center justify-between px-6 py-4 md:px-8"
          style={{ backgroundColor: theme.accent }}
        >
          <div>
            <h2 className="text-lg font-bold text-white md:text-xl">
              {department.name}
            </h2>
            {department.description ? (
              <p className="mt-1 text-sm text-white/90">
                {department.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center">
            <ResetTimerBar
              targetTimestamp={messages.length > 1 ? autoClearTarget : null}
              durationSeconds={inactivityTimeoutMinutes * 60}
              onClear={handleClearConversation}
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
            {messages.map((message: ChatThreadMessage) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                theme={theme}
              />
            ))}

            {shouldShowWaitingState ? (
              <div className="mr-auto flex max-w-[90%] animate-in gap-3 fade-in slide-in-from-bottom-2 duration-300">
                <BotAvatar theme={theme} />
                <div className="flex flex-col gap-1.5">
                  {waitingIndicatorMode === "video" ? (
                    <WaitingVideo url={waitingVideoUrl} />
                  ) : (
                    <div
                      className="rounded-3xl rounded-bl-md border bg-white/92 px-4 py-3.5 text-sm leading-6 text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                      style={{
                        borderColor: hexToRgba(theme.accent, 0.14),
                      }}
                    >
                      <FakeStreamingText
                        text={
                          department.waitingConfig.text ||
                          "Đang tìm câu trả lời phù hợp cho bạn"
                        }
                        speed={department.waitingConfig.textSpeed || 60}
                        cursorColor={
                          department.waitingConfig.cursorColor || theme.accent
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
                      onClick={() => handleSubmit(prompt)}
                      disabled={disabled}
                      className={[
                        "rounded-full border px-3.5 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                        !theme.suggestedPromptsTextColor
                          ? "text-slate-100"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        backgroundColor:
                          theme.suggestedPromptsBgColor ||
                          hexToRgba(theme.accent, 0.9),
                        color: theme.suggestedPromptsTextColor || undefined,
                        borderColor: theme.suggestedPromptsBgColor
                          ? "transparent"
                          : hexToRgba(theme.accent, 0.14),
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
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(inputValue);
                    }
                  }}
                  placeholder={
                    department.placeholder || "Nhập câu hỏi của bạn..."
                  }
                  disabled={disabled}
                  className="min-h-11 max-h-30 resize-none border-0 bg-transparent px-3 text-sm leading-6 text-slate-900 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="button"
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim() || disabled}
                className="h-13 w-13 shrink-0 rounded-full p-0 text-white shadow-lg transition hover:scale-105"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `0 12px 28px ${hexToRgba(theme.accent, 0.7)}`,
                }}
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>

            <div className="relative z-50 mt-4 flex w-full flex-col items-center">
              <div className="relative flex min-h-16 w-full items-center justify-center">
                <div className="absolute left-5 flex flex-col items-start gap-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopSpeaking}
                    className={[
                      "rounded-full border-rose-200 bg-white/70 text-rose-600 shadow-lg transition-all hover:bg-rose-50 hover:text-rose-700",
                      isSpeaking
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                    ].join(" ")}
                  >
                    <VolumeX className="mr-2 h-4 w-4" />
                    {"Dừng đọc"}
                  </Button>

                  <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 shadow-lg transition-all">
                    <Switch
                      id="tts-toggle"
                      checked={ttsEnabled}
                      onCheckedChange={(enabled) => {
                        setTtsEnabled(enabled);
                        if (!enabled) {
                          stopSpeaking();
                        }
                      }}
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
                  onPressStart={() => {
                    if (recognitionSupported) {
                      void startListening();
                    }
                  }}
                  onPressEnd={() => {
                    if (recognitionSupported) {
                      stopListening({ submit: true });
                    }
                  }}
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
    </main>
  );
}
