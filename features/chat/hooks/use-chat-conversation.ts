"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { DepartmentConfig } from "@/lib/cms-types"

import type { ChatThreadMessage } from "../types"
import { createWelcomeMessage, formatChatTimestamp } from "../utils"

interface UseChatConversationOptions {
  department: DepartmentConfig
  apiConfigured: boolean
  onAssistantMessage?: (text: string) => void
  onAssistantChunk?: (chunk: string) => void
}

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}


export function useChatConversation({
  department,
  apiConfigured,
  onAssistantMessage,
  onAssistantChunk,
}: UseChatConversationOptions) {
  const [messages, setMessages] = useState<ChatThreadMessage[]>(() => [
    createWelcomeMessage(department.welcomeMessage),
  ])
  const [userId, setUserId] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    department.suggestedPrompts || []
  )

  // Keep a ref to the abort controller so we can cancel in-flight streams
  const abortRef = useRef<AbortController | null>(null)

  const clearConversation = useCallback(() => {
    abortRef.current?.abort()
    setMessages([createWelcomeMessage(department.welcomeMessage)])
    setConversationId(null)
    setIsSubmitting(false)
    setErrorMessage("")
    setSuggestedPrompts(department.suggestedPrompts || [])
  }, [department.welcomeMessage])

  useEffect(() => {
    // Abort any in-flight stream when department changes
    clearConversation()
  }, [department.slug, clearConversation])

  useEffect(() => {
    setMessages((current) =>
      current.map((message, index) =>
        index === 0 && message.id === "welcome" && !message.timestamp
          ? { ...message, timestamp: formatChatTimestamp() }
          : message,
      ),
    )
  }, [department.slug])

  useEffect(() => {
    const storageKey = `apec-user-${department.slug}`
    const currentUserId =
      window.localStorage.getItem(storageKey) ??
      `${department.slug}-${generateId()}`

    window.localStorage.setItem(storageKey, currentUserId)
    setUserId(currentUserId)
  }, [department.slug])

  const sendMessage = useCallback(
    async (messageText: string) => {
      const content = messageText.trim()

      if (!content || !userId || isSubmitting || !apiConfigured) {
        return
      }

      const userMessage: ChatThreadMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: formatChatTimestamp(),
      }

      const assistantMessageId = generateId()

      setMessages((current) => [...current, userMessage])
      setErrorMessage("")
      setSuggestedPrompts([]) // Clear old suggestions
      setIsSubmitting(true)

      // Create an abort controller for this request
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departmentSlug: department.slug,
            message: content,
            userId,
            conversationId,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string }
          throw new Error(data.error ?? "Không gọi được chatbot ngành hàng.")
        }

        if (!response.body) {
          throw new Error("Trình duyệt không hỗ trợ streaming response.")
        }

        // Read the streaming NDJSON response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ""
        let buffer = "" // Buffer for incomplete NDJSON lines across chunk boundaries

        // Add an empty assistant message that we'll update as chunks arrive
        setMessages((current) => [
          ...current,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: formatChatTimestamp(),
          },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Append decoded text to buffer so partial lines from previous read are included
          buffer += decoder.decode(value, { stream: true })

          // Split by newline — the last element may be incomplete (no trailing newline)
          const lines = buffer.split("\n")
          // Keep the last (potentially incomplete) segment in the buffer
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            try {
              const data = JSON.parse(trimmed) as {
                chunk?: string
                done?: boolean
                response?: string
                conversation_id?: string
                suggestions?: string[]
              }

              if (data.chunk) {
                fullContent += data.chunk

                // Stream audio chunk piece immediately
                onAssistantChunk?.(data.chunk)

                // Update the assistant message in-place
                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg,
                  ),
                )
              }

              // When done, finalize conversation metadata
              if (data.done) {
                if (data.conversation_id) {
                  setConversationId(data.conversation_id)
                }
                if (data.suggestions) {
                  setSuggestedPrompts(data.suggestions)
                }
                if (data.response) {
                  fullContent = data.response
                  setMessages((current) =>
                    current.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent }
                        : msg,
                    ),
                  )
                }
              }
            } catch {
              // Skip malformed JSON lines
              console.warn("[chat] skipping non-JSON line:", trimmed.slice(0, 100))
            }
          }
        }

        // Process any remaining data in the buffer after stream ends
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer.trim()) as {
              chunk?: string
              done?: boolean
              response?: string
              conversation_id?: string
              suggestions?: string[]
            }

            if (data.chunk) {
              fullContent += data.chunk
              onAssistantChunk?.(data.chunk)
              
              setMessages((current) =>
                current.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg,
                ),
              )
            }

            if (data.done) {
              if (data.conversation_id) {
                setConversationId(data.conversation_id)
              }
              if (data.suggestions) {
                setSuggestedPrompts(data.suggestions)
              }
              if (data.response) {
                fullContent = data.response
                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg,
                  ),
                )
              }
            }
          } catch {
            console.warn("[chat] skipping trailing non-JSON buffer:", buffer.trim().slice(0, 100))
          }
        }

        onAssistantMessage?.(fullContent)
      } catch (error) {
        // Ignore abort errors (user navigated away / department changed)
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : "Hệ thống đang bận. Vui lòng thử lại sau."

        console.error("Failed to send chat message.", message)

        const fallbackResponse =
          "Xin lỗi, hiện tại đang có lỗi kỹ thuật. Xin thử lại sau."

        setErrorMessage("Hệ thống đang bận. Vui lòng thử lại sau.")
        setMessages((current) => {
          // Remove the empty streaming message if it was added
          const filtered = current.filter((msg) => msg.id !== assistantMessageId)
          return [
            ...filtered,
            {
              id: generateId(),
              role: "assistant" as const,
              content: fallbackResponse,
              timestamp: formatChatTimestamp(),
            },
          ]
        })

        onAssistantMessage?.(fallbackResponse)
      } finally {
        setIsSubmitting(false)
        abortRef.current = null
      }
    },
    [apiConfigured, conversationId, department.slug, isSubmitting, onAssistantMessage, userId],
  )

  return {
    clearConversation,
    errorMessage,
    isSubmitting,
    messages,
    sendMessage,
    suggestedPrompts,
  }
}
