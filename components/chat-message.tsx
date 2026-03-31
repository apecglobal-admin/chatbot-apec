"use client"

import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
          AI
        </div>
      )}

      {/* Message Bubble */}
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "px-4 py-2.5 backdrop-blur-sm shadow-lg",
            isUser
              ? "bg-blue-500/90 text-white rounded-2xl rounded-tr-sm"
              : "bg-slate-800/90 text-white rounded-2xl rounded-tl-sm"
          )}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        {timestamp && (
          <span
            className={cn(
              "text-[10px] text-slate-400",
              isUser ? "text-right mr-1" : "text-left ml-1"
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  )
}
