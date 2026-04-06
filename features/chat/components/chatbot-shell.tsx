"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { hexToRgba } from "@/lib/color"

import { useChatConversation } from "../hooks/use-chat-conversation"
import { useVoiceAssistant } from "../hooks/use-voice-assistant"
import type { ChatbotShellProps } from "../types"
import { ChatConversation } from "./chat-conversation"
import { WalkingRobot } from "@/components/walking-robot"

export function ChatbotShell({
  department,
  apiConfigured,
}: ChatbotShellProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoClearTarget, setAutoClearTarget] = useState<number | null>(null)

  const {
    clearConversation,
    errorMessage,
    isSubmitting,
    messages,
    sendMessage,
  } = useChatConversation({
    department,
    apiConfigured,
  })

  const {
    isListening,
    isSpeaking,
    isTranscribing,
    recognitionSupported,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
  } = useVoiceAssistant({
    onTranscriptChange: setInputValue,
    onTranscriptComplete: (text) => {
      setInputValue("")
      void sendMessage(text)
    },
    currentTranscript: inputValue,
  })

  useEffect(() => {
    const container = scrollRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [inputValue, isListening, isSubmitting, messages])

  useEffect(() => {
    setInputValue("")
  }, [department.slug])

  useEffect(() => {
    const latestMessage = messages.at(-1)

    if (latestMessage?.role === "assistant" && latestMessage.id !== "welcome") {
      speak(latestMessage.content)
    }
  }, [messages, speak])

  const handleClearConversation = useCallback(() => {
    setInputValue("")
    clearConversation()
  }, [clearConversation])

  const inactivityTimeoutMinutes = department.theme.inactivityTimeoutMinutes ?? 5

  useEffect(() => {
    if (messages.length <= 1) {
      setAutoClearTarget(null)
      return
    }

    const duration = inactivityTimeoutMinutes * 60 * 1000
    setAutoClearTarget(Date.now() + duration)

    const timeoutId = setTimeout(() => {
      handleClearConversation()
    }, duration)

    return () => clearTimeout(timeoutId)
  }, [messages, inputValue, isListening, handleClearConversation, inactivityTimeoutMinutes])

  const handleSubmit = useCallback(
    (value: string) => {
      const nextValue = value.trim()

      if (!nextValue || isSubmitting || !apiConfigured) {
        return
      }

      stopSpeaking()
      stopListening()
      setInputValue("")
      void sendMessage(nextValue)
    },
    [apiConfigured, isSubmitting, sendMessage, stopListening, stopSpeaking],
  )

  const backgroundImage = department.theme.backgroundImageUrl
    ? `linear-gradient(180deg, rgba(247,244,236,0.94) 0%, rgba(238,247,240,0.94) 52%, rgba(247,240,233,0.96) 100%), url("${department.theme.backgroundImageUrl}")`
    : "linear-gradient(180deg,#F7F4EC_0%,#EEF7F0_52%,#F7F0E9_100%)"

  return (
    <main
      className="relative flex h-screen flex-col px-4 py-6 md:px-8"
      style={{
        backgroundImage,
        backgroundPosition: "center",
        backgroundSize: department.theme.backgroundImageUrl ? "cover" : undefined,
      }}
    >
      <WalkingRobot />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] opacity-60"
        style={{
          background: `radial-gradient(circle at top right, ${hexToRgba(department.theme.accent, 0.16)}, transparent 42%)`,
        }}
      />

      <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col gap-5">
        <ChatConversation
          apiConfigured={apiConfigured}
          autoClearTarget={autoClearTarget}
          departmentDescription={department.description}
          departmentName={department.name}
          errorMessage={errorMessage}
          inputValue={inputValue}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isSubmitting={isSubmitting}
          isTranscribing={isTranscribing}
          messages={messages}
          onInputChange={setInputValue}
          onInputKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(inputValue)
            }
          }}
          onPromptSelect={handleSubmit}
          onStopSpeaking={stopSpeaking}
          onSubmit={() => {
            handleSubmit(inputValue)
          }}
          onClearConversation={handleClearConversation}
          onVoicePressStart={() => {
            if (recognitionSupported) {
              startListening()
            }
          }}
          onVoicePressEnd={() => {
            if (recognitionSupported) {
              stopListening({ submit: true })
            }
          }}
          placeholder={department.placeholder || ""}
          recognitionSupported={recognitionSupported}
          scrollRef={scrollRef}
          suggestedPrompts={department.suggestedPrompts}
          theme={department.theme}
        />
      </div>
    </main>
  )
}
