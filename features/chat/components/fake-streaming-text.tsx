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
  cursorColor,
}: FakeStreamingTextProps) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    setDisplayed("")
    let i = 0
    let dotCount = 0

    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        dotCount = (dotCount + 1) % 4
        setDisplayed(text + ".".repeat(dotCount))
      }
    }, speed)

    return () => clearInterval(iv)
  }, [text, speed])

  return (
    <span style={{ opacity: 0.8 }}>
      {displayed}
      <span
        className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm align-middle"
        style={{ backgroundColor: cursorColor || "#4F46E5" }}
      />
    </span>
  )
}
