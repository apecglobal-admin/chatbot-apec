"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


import { MicrophoneButton } from "@/components/microphone-button"
import { ChatMessage } from "@/components/chat-message"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Tất nhiên rồi! Bạn muốn mình giúp gì nào?",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Tôi hiểu câu hỏi của bạn. Để tôi giúp bạn!",
        "Đó là một điểm hay! Đây là những gì tôi nghĩ...",
        "Cảm ơn bạn đã chia sẻ. Tôi ở đây để hỗ trợ bạn.",
        "Thú vị! Để tôi cung cấp một số thông tin về điều đó.",
        "Thành phố Hồ Chí Minh có lịch sử phong phú...",
      ]
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleVoiceTranscript = (text: string) => {
    handleSendMessage(text)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  return (
    <div className="relative flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/city-skyline.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-indigo-950/90" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center gap-3 px-4 py-3 bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Robot Avatar */}
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 40 40" className="w-9 h-9">
                {/* Robot Face Background */}
                <rect x="8" y="10" width="24" height="20" rx="6" fill="url(#faceGradient)" />
                {/* Visor/Eye Area */}
                <rect x="11" y="14" width="18" height="8" rx="4" fill="#0f172a" />
                {/* Eyes with glow */}
                <circle cx="16" cy="18" r="2.5" fill="#22d3ee">
                  <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="24" cy="18" r="2.5" fill="#22d3ee">
                  <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Eye highlights */}
                <circle cx="15" cy="17" r="1" fill="white" opacity="0.8" />
                <circle cx="23" cy="17" r="1" fill="white" opacity="0.8" />
                {/* Antenna */}
                <rect x="18" y="4" width="4" height="6" rx="2" fill="url(#antennaGradient)" />
                <circle cx="20" cy="4" r="3" fill="#22d3ee">
                  <animate attributeName="fill" values="#22d3ee;#a855f7;#22d3ee" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Mouth - friendly smile */}
                <path d="M15 26 Q20 29 25 26" stroke="#22d3ee" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Cheek accents */}
                <circle cx="12" cy="22" r="1.5" fill="#a855f7" opacity="0.5" />
                <circle cx="28" cy="22" r="1.5" fill="#a855f7" opacity="0.5" />
                {/* Gradients */}
                <defs>
                  <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <linearGradient id="antennaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div>
            <h1 className="font-semibold text-white text-lg">Chatbot Đàm Thoại - Robot Phản Hồi</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-green-400">Đang lắng nghe...</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-3 pb-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          {isTyping && (
            <div className="flex gap-2 max-w-[85%] mr-auto">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - above microphone */}
      <div className="relative z-10 px-4 py-2">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="py-5 rounded-full bg-slate-800/80 backdrop-blur-sm border-slate-700 text-white placeholder:text-slate-400"
              disabled={isTyping}
            />
          </div>
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Fixed Microphone Section at Bottom - Always Visible */}
      <div 
        className="relative z-20 flex-shrink-0 w-full"
        style={{
          background: "linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(30, 27, 75, 0.98) 70%, rgba(15, 23, 42, 0.8) 100%)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        <MicrophoneButton
          onTranscript={handleVoiceTranscript}
          disabled={isTyping}
          onListeningChange={setIsListening}
        />
      </div>

    </div>
  )
}
