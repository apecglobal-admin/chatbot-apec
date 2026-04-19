import { RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VoiceButton } from "@/components/chat/conversation/voice-button";
import { ChatMessage } from "@/components/chat/conversation/chat-message";
import { FakeStreamingText } from "@/components/chat/waiting-response/fake-streaming-text";
import { WaitingVideo } from "@/components/chat/waiting-response/waiting-video";
import { BotAvatar } from "@/components/chat/shared/bot-avatar";
import type { DepartmentConfig } from "@/types/cms";
import { cmsInsetClass, cmsInputClass } from "../shared/styles";
import { hexToRgba } from "@/utils/color";
import { cn } from "@/utils/ui";

interface PreviewProps {
  department: DepartmentConfig;
}

export function Preview({ department }: PreviewProps) {
  const theme = department.theme;
  const waitingIndicatorMode =
    department.waitingConfig.mode === "video" ? "video" : "text";
  const waitingVideoUrl =
    department.waitingConfig.videoUrl || "/Robot-dao-boi.webm";

  const backgroundImage = theme.backgroundImageUrl
    ? `url("${theme.backgroundImageUrl}")`
    : "linear-gradient(180deg,#F7F4EC_0%,#EEF7F0_52%,#F7F0E9_100%)";

  return (
    <div className="xl:sticky xl:top-4 w-full flex flex-col h-[calc(100vh-32px)]">
      {/* Main Chat Container Preview */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl mx-auto max-w-[400px]">
        {/* Header Area */}
        <div
          className="relative z-10 flex shrink-0 items-center justify-between px-5 py-3"
          style={{ backgroundColor: theme.accent }}
        >
          <div className="max-w-[70%]">
            <h2 className="line-clamp-1 text-sm font-bold text-white">
              {department.name}
            </h2>
            {department.description ? (
              <p className="line-clamp-1 mt-0.5 text-[10px] text-white/90">
                {department.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="group flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold shadow-md transition-all"
              style={{ color: theme.accent }}
            >
              <RotateCcw className="h-2.5 w-2.5" strokeWidth={2.5} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{
            backgroundImage,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative z-10 flex-1 space-y-4 overflow-y-auto custom-scrollbar px-5 py-4">
            <ChatMessage
              role="assistant"
              content={
                department.welcomeMessage ||
                "Chào bạn, tôi là trợ lý ảo hỗ trợ thông tin sản phẩm. Bạn cần giúp gì ạ?"
              }
              theme={theme}
            />

            <ChatMessage
              role="user"
              content={
                department.suggestedPrompts[0] ||
                "Khách đang hỏi về sản phẩm tại quầy này."
              }
              theme={theme}
            />

            <div className="mr-auto flex max-w-[90%] gap-3">
              <BotAvatar theme={theme} />
              <div className="flex flex-col gap-1.5">
                {waitingIndicatorMode === "video" ? (
                  <WaitingVideo url={waitingVideoUrl} />
                ) : (
                  <div
                    className="rounded-[20px] rounded-bl-md border bg-white/92 px-4 py-3 text-xs leading-5 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
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
          </div>

          {/* Footer Area */}
          <div className="relative z-10 px-5 pb-4 pt-3">
            {department.suggestedPrompts.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-center text-[9px] font-medium uppercase tracking-widest text-slate-400">
                  Có thể bạn muốn hỏi
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {department.suggestedPrompts.slice(0, 1).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className={cn(
                        "rounded-full border px-2 py-1 text-[9px] font-medium transition-all",
                        !theme.suggestedPromptsTextColor
                          ? "text-slate-100"
                          : "",
                      )}
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
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-[14px] border border-slate-200 bg-white px-1 shadow-sm transition">
                <Input
                  placeholder={
                    department.placeholder || "Nhập câu hỏi của bạn..."
                  }
                  readOnly
                  className="max-h-10 resize-none border-0 bg-transparent px-3 text-[11px] leading-5 text-slate-900 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="button"
                disabled
                className="h-9 w-9 shrink-0 rounded-full p-0 text-white shadow-lg"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `0 6px 16px ${hexToRgba(theme.accent, 0.4)}`,
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mt-3 flex w-full flex-col items-center">
              <div className="relative flex min-h-10 w-full items-center justify-center">
                <div className="absolute left-0 flex flex-col items-start">
                  <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 shadow-sm transition-all">
                    <Switch
                      id="tts-toggle-preview"
                      checked={true}
                      className="scale-75"
                    />
                    <Label
                      htmlFor="tts-toggle-preview"
                      className="cursor-pointer text-[9px] font-semibold text-slate-700"
                    >
                      Tự đọc
                    </Label>
                  </div>
                </div>

                <div className="scale-50 origin-center -my-8">
                  <VoiceButton
                    accent={theme.accent}
                    disabled={false}
                    isListening={false}
                    onPressStart={() => {}}
                    onPressEnd={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
