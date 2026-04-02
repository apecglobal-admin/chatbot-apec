"use client"

import type { DepartmentTheme } from "@/lib/cms-types"
import { hexToRgba } from "@/lib/color"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  theme: DepartmentTheme
}

export function ChatMessage({
  role,
  content,
  timestamp,
  theme,
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex max-w-[90%] gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {!isUser ? (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white text-xs font-bold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
          style={{
            backgroundImage: theme.botAvatarUrl
              ? "none"
              : `linear-gradient(135deg, ${hexToRgba(theme.accent, 0.18)}, rgba(255,255,255,0.92))`,
          }}
        >
          {theme.botAvatarUrl ? (
            <img
              src={theme.botAvatarUrl}
              alt="AI"
              className="h-full w-full object-cover"
            />
          ) : (
            "AI"
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "rounded-[24px] border px-4 py-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
            isUser
              ? "rounded-br-md text-white"
              : "rounded-bl-md bg-white/92 text-slate-900",
          )}
          style={{
            background: isUser
              ? `linear-gradient(135deg, ${theme.userBubble}, ${theme.accent})`
              : undefined,
            borderColor: isUser
              ? hexToRgba(theme.accent, 0.08)
              : hexToRgba(theme.accent, 0.14),
          }}
        >
          <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
        </div>
        {timestamp ? (
          <span
            className={cn(
              "text-[11px] text-slate-400",
              isUser ? "mr-1 text-right" : "ml-1 text-left",
            )}
          >
            {timestamp}
          </span>
        ) : null}
      </div>
    </div>
  )
}
