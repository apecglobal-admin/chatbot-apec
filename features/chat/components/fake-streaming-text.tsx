"use client"

import { useEffect, useState } from "react"

interface FakeStreamingTextProps {
  text: string
  speed?: number
  cursorColor?: string
}

export function FakeStreamingText({
  text,
  speed = 60,
  cursorColor = "#4F46E5",
}: FakeStreamingTextProps) {
  const [displayed, setDisplayed] = useState("")
  const [isTypingDone, setIsTypingDone] = useState(false)

  useEffect(() => {
    setDisplayed("")
    setIsTypingDone(false)
    let i = 0

    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setIsTypingDone(true)
        clearInterval(iv)
      }
    }, speed)

    return () => clearInterval(iv)
  }, [text, speed])

  return (
    // Dùng inline để dấu chấm chạy theo sát chữ cuối cùng
    <span className="text-gray-800 leading-relaxed overflow-wrap-anywhere">
      <span>{displayed}</span>

      {isTypingDone ? (
        /* Dùng inline-flex ở đây để 3 chấm vẫn nằm ngang nhưng wrapper tổng là inline */
        <span className="ml-1 inline-flex gap-1 items-baseline">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="w-1 h-1 rounded-full animate-pop-and-fall"
              style={{
                backgroundColor: cursorColor,
                animationDelay: `${dot * 0.2}s`,
              }}
            />
          ))}
        </span>
      ) : (
        <span
          className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm align-middle"
          style={{ backgroundColor: cursorColor }}
        />
      )}
    </span>
  )
}