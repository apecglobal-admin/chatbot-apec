"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: {
    transcript: string
  }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onstart: (() => void) | null
  abort: () => void
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
}

interface UseVoiceAssistantOptions {
  onTranscriptChange: (text: string) => void
  onTranscriptComplete: (text: string) => void
  currentTranscript?: string
}

export function useVoiceAssistant({
  onTranscriptChange,
  onTranscriptComplete,
  currentTranscript = "",
}: UseVoiceAssistantOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.2)

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transcriptRef = useRef("")
  
  const currentTranscriptRef = useRef(currentTranscript)
  useEffect(() => {
    currentTranscriptRef.current = currentTranscript
  }, [currentTranscript])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    audioRef.current = new Audio()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionApi) {
      setRecognitionSupported(false)
      return
    }

    setRecognitionSupported(true)

    const recognition = new SpeechRecognitionApi()
    recognition.lang = "vi-VN"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      const initial = currentTranscriptRef.current
      transcriptRef.current = initial ? `${initial} ` : ""
      setIsListening(true)
      onTranscriptChange(transcriptRef.current)
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]

        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        transcriptRef.current += `${finalTranscript} `
      }

      const fullTranscript = `${transcriptRef.current}${interimTranscript}`.trim()
      console.log("[Voice Assistant] Nghe được:", fullTranscript)
      onTranscriptChange(fullTranscript)
    }

    // Keep it updated if currentTranscript changes while not listening?
    // Not strictly needed, we just capture it on start.

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [onTranscriptChange])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      stopSpeaking()

      try {
        const cleanText = text.replace(/[*#]/g, "").trim()
        if (!cleanText) return

        setIsSpeaking(true)

        const rateParam =
          playbackRate !== 1
            ? `${playbackRate > 1 ? "+" : ""}${Math.round((playbackRate - 1) * 100)}%`
            : undefined

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: cleanText, rate: rateParam }),
        })

        if (!response.ok) {
          throw new Error("TTS API error")
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        if (audioRef.current) {
          audioRef.current.src = url
          
          audioRef.current.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(url)
          }
          
          audioRef.current.onerror = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(url)
          }

          await audioRef.current.play()
        }
      } catch (error) {
        console.error("Speak error:", error)
        setIsSpeaking(false)
      }
    },
    [stopSpeaking],
  )

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      return false
    }

    stopSpeaking()

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error(error)
    }

    return true
  }, [stopSpeaking])

  const stopListening = useCallback(
    (options?: { submit?: boolean }) => {
      if (!recognitionRef.current) {
        return
      }

      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      }

      const finalTranscript = transcriptRef.current.trim()

      if (options?.submit && finalTranscript) {
        onTranscriptChange(finalTranscript)
        onTranscriptComplete(finalTranscript)
      }
    },
    [isListening, onTranscriptChange, onTranscriptComplete],
  )

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening({ submit: true })
      return true
    }

    return startListening()
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSpeaking,
    playbackRate,
    recognitionSupported,
    setPlaybackRate,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
    toggleListening,
  }
}
