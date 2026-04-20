"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { DepartmentConfig } from "@/features/cms/types/cms"

import type { ChatThreadMessage } from "@/features/chat/types/chat"
import { createWelcomeMessage } from "@/features/chat/utils/chat"
import { formatChatTimestamp, generateTimestampId } from "@/shared/utils/date"

interface UseChatConversationOptions {
  department: DepartmentConfig
  apiConfigured: boolean
  onAssistantMessage?: (text: string) => void
  onAssistantChunk?: (chunk: string) => void
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
  // Keep a ref to conversationId so event listeners always read the latest value
  const conversationIdRef = useRef<string | null>(null)

  const sendCloseBeacon = useCallback(
    (convId: string) => {
      const payload = JSON.stringify({ departmentSlug: department.slug, conversationId: convId })
      // sendBeacon is the only reliable way to send a request on page unload
      const sent = navigator.sendBeacon(
        "/api/close-conversation",
        new Blob([payload], { type: "application/json" }),
      )
      if (!sent) {
        // Fallback: keepalive fetch (works if page hasn't fully unloaded yet)
        void fetch("/api/close-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined)
      }
    },
    [department.slug],
  )

  const clearConversation = useCallback(() => {
    abortRef.current?.abort()
    // Close the current conversation before resetting
    if (conversationIdRef.current) {
      sendCloseBeacon(conversationIdRef.current)
    }
    setMessages([createWelcomeMessage(department.welcomeMessage)])
    setConversationId(null)
    conversationIdRef.current = null
    setIsSubmitting(false)
    setErrorMessage("")
    setSuggestedPrompts(department.suggestedPrompts || [])
  }, [department.welcomeMessage, sendCloseBeacon])

  useEffect(() => {
    // Abort any in-flight stream when department changes
    clearConversation()
  }, [department.slug, clearConversation])

  // Auto-close conversation when user closes the tab / browser
  useEffect(() => {
    const handleUnload = () => {
      if (conversationIdRef.current) {
        sendCloseBeacon(conversationIdRef.current)
      }
    }

    window.addEventListener("beforeunload", handleUnload)
    // visibilitychange catches mobile cases where beforeunload may not fire
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleUnload()
      }
    })

    return () => {
      window.removeEventListener("beforeunload", handleUnload)
    }
  }, [sendCloseBeacon])

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
    const storageKey = `ecoop-${department.slug}`
    const currentUserId =
      window.localStorage.getItem(storageKey) ??
      `${department.slug}-${generateTimestampId()}`

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
        id: `user-${generateTimestampId()}`,
        role: "user",
        content,
        timestamp: formatChatTimestamp(),
      }

      const assistantMessageId = `asst-${generateTimestampId()}`

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

        // Read the streaming SSE response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ""
        let buffer = "" // Buffer for incomplete lines across chunk boundaries
        let assistantMessageAdded = false // Only add message bubble on first chunk

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Append decoded text to buffer so partial lines are preserved
          buffer += decoder.decode(value, { stream: true })

          // Split by double newline to get SSE events
          const events = buffer.split("\n\n")
          // Keep the last (potentially incomplete) event in the buffer
          buffer = events.pop() ?? ""

          for (const eventStr of events) {
            const lines = eventStr.split("\n")
            let eventType = ""
            let eventData = ""

            // Parse SSE format: "event: name" and "data: content"
            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim()
              } else if (line.startsWith("data:")) {
                eventData = line.slice(5).trim()
              }
            }

            if (!eventData) continue

            try {
              const data = JSON.parse(eventData) as {
                chunk?: string
                done?: boolean
                response?: string
                conversation_id?: string
                suggestions?: string[]
              }

              if (eventType === "chunk" && data.chunk) {
                fullContent += data.chunk

                // Stream audio chunk piece immediately
                onAssistantChunk?.(data.chunk)

                if (!assistantMessageAdded) {
                  // Add the assistant bubble on the first chunk
                  assistantMessageAdded = true
                  setMessages((current) => [
                    ...current,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      content: fullContent,
                      timestamp: formatChatTimestamp(),
                    },
                  ])
                } else {
                  // Update the assistant message in-place
                  setMessages((current) =>
                    current.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent }
                        : msg,
                    ),
                  )
                }
              }

              // When done, finalize conversation metadata
              if (eventType === "done") {
                if (data.conversation_id) {
                  setConversationId(data.conversation_id)
                  conversationIdRef.current = data.conversation_id
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

              // Suggestions arrive as a separate event after done
              if (eventType === "suggestions" && data.suggestions) {
                setSuggestedPrompts(data.suggestions)
              }
            } catch (e) {
              // Skip malformed JSON data
              console.warn("[chat] skipping malformed SSE data:", eventData.slice(0, 100))
            }
          }
        }

        // Process any remaining data in the buffer after stream ends
        if (buffer.trim()) {
          const lines = buffer.trim().split("\n")
          let eventType = ""
          let eventData = ""

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
              eventData = line.slice(5).trim()
            }
          }

          if (eventData) {
            try {
              const data = JSON.parse(eventData) as {
                chunk?: string
                done?: boolean
                response?: string
                conversation_id?: string
                suggestions?: string[]
              }

              if (eventType === "chunk" && data.chunk) {
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

              if (eventType === "done") {
                if (data.conversation_id) {
                  setConversationId(data.conversation_id)
                  conversationIdRef.current = data.conversation_id
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

              // Suggestions arrive as a separate event after done
              if (eventType === "suggestions" && data.suggestions) {
                setSuggestedPrompts(data.suggestions)
              }
            } catch (e) {
              console.warn("[chat] skipping malformed trailing SSE data:", eventData.slice(0, 100))
            }
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
              id: `asst-${generateTimestampId()}`,
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
