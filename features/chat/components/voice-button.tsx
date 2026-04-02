"use client"

import { Mic, Square } from "lucide-react"

import { hexToRgba } from "@/lib/color"
import { cn } from "@/lib/utils"

interface VoiceButtonProps {
  accent: string
  disabled: boolean
  isListening: boolean
  onClick: () => void
}

export function VoiceButton({
  accent,
  disabled,
  isListening,
  onClick,
}: VoiceButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border border-white/70 bg-white/70"
          style={{
            boxShadow: `0 18px 45px ${hexToRgba(accent, 0.16)}`,
          }}
        />
        <span
          className={cn(
            "absolute inset-2 rounded-full border border-dashed transition",
            isListening ? "opacity-0 scale-110" : "opacity-40 scale-100",
          )}
          style={{
            borderColor: hexToRgba(accent, 0.35),
          }}
        />
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white transition-all duration-300",
            isListening ? "scale-[1.15]" : "hover:scale-[1.03]",
            disabled ? "cursor-not-allowed opacity-50" : "",
          )}
          style={{
            backgroundColor: isListening ? "#F43F5E" : accent,
            boxShadow: isListening
              ? "0 18px 36px rgba(244,63,94,0.35)"
              : `0 18px 36px ${hexToRgba(accent, 0.32)}`,
          }}
        >
          {isListening ? (
            <>
              <style>
                {`
                  @keyframes wave-bars {
                    0%, 100% { height: 12px; }
                    50% { height: 28px; }
                  }
                `}
              </style>
              <div className="flex h-10 items-center justify-center gap-1.5">
                {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-white transition-all"
                    style={{
                      animation: `wave-bars 1s infinite ease-in-out ${delay}s`,
                      height: '12px'
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-slate-900">
          {isListening ? "Đang nghe, nhấn để gửi" : "Nhấn để nói"}
        </p>
      </div>
    </div>
  )
}
