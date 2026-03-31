"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface MicrophoneButtonProps {
  onTranscript?: (text: string) => void
  disabled?: boolean
  onListeningChange?: (isListening: boolean) => void
}

export function MicrophoneButton({ onTranscript, disabled, onListeningChange }: MicrophoneButtonProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [waveLevels, setWaveLevels] = useState<number[]>(Array(24).fill(0.1))
  const holdStartTime = useRef<number>(0)

  useEffect(() => {
    onListeningChange?.(isHolding)
  }, [isHolding, onListeningChange])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isHolding) {
      interval = setInterval(() => {
        setWaveLevels(
          Array(24)
            .fill(0)
            .map((_, i) => {
              const distanceFromCenter = Math.abs(i - 11.5) / 11.5
              const baseHeight = 1 - distanceFromCenter * 0.6
              return baseHeight * (0.3 + Math.random() * 0.7)
            })
        )
      }, 80)
    } else {
      setWaveLevels(Array(24).fill(0.1))
    }
    return () => clearInterval(interval)
  }, [isHolding])

  const handlePressStart = useCallback(() => {
    if (disabled) return
    holdStartTime.current = Date.now()
    setIsHolding(true)
  }, [disabled])

  const handlePressEnd = useCallback(() => {
    if (disabled || !isHolding) return
    
    const holdDuration = Date.now() - holdStartTime.current
    setIsHolding(false)
    
    // Only send if held for at least 300ms
    if (holdDuration >= 300) {
      // Simulate sending transcript - in real app this would be actual speech recognition result
      onTranscript?.("Tôi muốn tìm hiểu về lịch sử TP.HCM.")
    }
  }, [disabled, isHolding, onTranscript])

  // Handle mouse leave to stop recording if user drags out
  const handleMouseLeave = useCallback(() => {
    if (isHolding) {
      handlePressEnd()
    }
  }, [isHolding, handlePressEnd])

  return (
    <div className="relative flex flex-col items-center justify-center pt-6 pb-10">
      {/* Sound wave container */}
      <div className="relative flex items-center justify-center">
        {/* Left side waves */}
        <div className="absolute right-[calc(50%+45px)] md:right-[calc(50%+55px)] flex items-center gap-[2px] md:gap-[3px] h-20">
          {waveLevels.slice(0, 12).reverse().map((level, i) => (
            <div
              key={`left-${i}`}
              className="w-[2px] md:w-[3px] rounded-full transition-all duration-75"
              style={{
                height: isHolding ? `${Math.max(4, level * 70)}px` : "4px",
                background: `linear-gradient(to top, rgb(139, 92, 246), rgb(6, 182, 212))`,
                opacity: isHolding ? 0.5 + level * 0.5 : 0.2,
              }}
            />
          ))}
        </div>

        {/* Right side waves */}
        <div className="absolute left-[calc(50%+45px)] md:left-[calc(50%+55px)] flex items-center gap-[2px] md:gap-[3px] h-20">
          {waveLevels.slice(12).map((level, i) => (
            <div
              key={`right-${i}`}
              className="w-[2px] md:w-[3px] rounded-full transition-all duration-75"
              style={{
                height: isHolding ? `${Math.max(4, level * 70)}px` : "4px",
                background: `linear-gradient(to top, rgb(6, 182, 212), rgb(139, 92, 246))`,
                opacity: isHolding ? 0.5 + level * 0.5 : 0.2,
              }}
            />
          ))}
        </div>

        {/* Outer ring 4 */}
        <div
          className={cn(
            "absolute rounded-full transition-all duration-500",
            isHolding ? "opacity-20" : "opacity-5"
          )}
          style={{
            width: "180px",
            height: "180px",
            background: "transparent",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        />

        {/* Outer ring 3 */}
        <div
          className={cn(
            "absolute rounded-full transition-all duration-500",
            isHolding ? "opacity-30" : "opacity-10"
          )}
          style={{
            width: "150px",
            height: "150px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))",
            border: "1px solid rgba(139, 92, 246, 0.25)",
          }}
        />

        {/* Outer ring 2 */}
        <div
          className={cn(
            "absolute rounded-full transition-all duration-500",
            isHolding ? "opacity-50" : "opacity-20"
          )}
          style={{
            width: "120px",
            height: "120px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.25))",
            border: "1px solid rgba(139, 92, 246, 0.35)",
          }}
        />

        {/* Animated pulse ring when holding */}
        {isHolding && (
          <>
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: "95px",
                height: "95px",
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))",
                animationDuration: "2s",
              }}
            />
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: "95px",
                height: "95px",
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))",
                animationDuration: "2s",
                animationDelay: "0.5s",
              }}
            />
          </>
        )}

        {/* Main button - press and hold */}
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          disabled={disabled}
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full transition-all duration-300 select-none touch-none",
            "w-[85px] h-[85px] md:w-24 md:h-24",
            disabled && "opacity-50 cursor-not-allowed",
            isHolding && "scale-95"
          )}
          style={{
            background: isHolding 
              ? "linear-gradient(135deg, rgb(49, 46, 129), rgb(88, 28, 135))"
              : "linear-gradient(135deg, rgb(30, 27, 75), rgb(49, 46, 129))",
            boxShadow: isHolding
              ? "0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.2)"
              : "0 0 20px rgba(139, 92, 246, 0.2)",
          }}
        >
          <Mic
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 transition-all duration-300",
              isHolding ? "text-cyan-300 scale-110" : "text-white/80"
            )}
          />
        </button>
      </div>

      {/* Status text */}
      <div className="mt-5 text-center">
        <p
          className={cn(
            "text-base md:text-lg font-medium transition-all duration-300 text-white"
          )}
        >
          {isHolding ? "Đang nghe... (Buông để gửi)" : "Nhấn giữ để nói"}
        </p>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Hỗ trợ tiếng Việt
        </p>
      </div>
    </div>
  )
}
