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
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoClearTarget, setAutoClearTarget] = useState<number | null>(null)

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
    onAssistantChunk: (chunk) => { if (ttsEnabledRef.current) appendTTSChunkRef.current?.(chunk) },
    onAssistantMessage: () => { if (ttsEnabledRef.current) flushTTSRef.current?.() },
  })

  const {
    isListening,
    isSpeaking,
    isTranscribing,
    recognitionSupported,
    speak,
    appendTTSChunk,
    flushTTS,
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

  // Use refs to avoid dependency cycles in useChatConversation setup
  const appendTTSChunkRef = useRef(appendTTSChunk)
  const flushTTSRef = useRef(flushTTS)
  const ttsEnabledRef = useRef(ttsEnabled)

  useEffect(() => {
    appendTTSChunkRef.current = appendTTSChunk
    flushTTSRef.current = flushTTS
  }, [appendTTSChunk, flushTTS])

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled
  }, [ttsEnabled])

  useEffect(() => {
    const container = scrollRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [inputValue, isListening, isSubmitting, messages])

  useEffect(() => {
    setInputValue("")
  }, [department.slug])

  const handleClearConversation = useCallback(() => {
    setInputValue("")
    setTtsEnabled(true)
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

  return (
    <main className="relative flex h-screen flex-col px-4 py-6 md:px-8 bg-slate-50/50">
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
          suggestedPrompts={suggestedPrompts}
          theme={department.theme}
          ttsEnabled={ttsEnabled}
          onTtsEnabledChange={(enabled) => {
            setTtsEnabled(enabled)
            if (!enabled) stopSpeaking()
          }}
        />
      </div>
    </main>
  )
}
