"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TTSStreamer } from "@/utils/audio"

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
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.2)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const currentTranscriptRef = useRef(currentTranscript)
  const streamerRef = useRef<TTSStreamer | null>(null)

  // Track whether to auto-submit when recording finishes
  const shouldSubmitRef = useRef(false)

  // Track if VAD detected actual speech during this recording
  const hasSpeechRef = useRef(false)
  const vadRef = useRef<any>(null)

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
      if (vadRef.current) {
        void vadRef.current.destroy()
      }
      streamerRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    streamerRef.current = new TTSStreamer({
      playbackRate,
      onSpeakingStateChange: setIsSpeaking,
    })
    return () => {
      streamerRef.current?.stop()
    }
  }, [playbackRate])

  const sendToGroq = useCallback(
    async (audioBlob: Blob, submit: boolean) => {
      // Skip tiny recordings or if VAD didn't detect speech
      if (audioBlob.size < 1000) {
        console.log("[Voice Assistant] Recording too short, skipping", {
          size: audioBlob.size,
        })
        return
      }

      if (!hasSpeechRef.current) {
        console.log("[Voice Assistant] VAD detected no speech, skipping API call to avoid hallucinations")
        return
      }

      setIsTranscribing(true)
      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")

        console.log("[Voice Assistant] Sending audio to transcribe API", {
          size: audioBlob.size,
          submit,
        })

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          console.warn("[Voice Assistant] Transcription API returned", {
            status: response.status,
            statusText: response.statusText,
          })
          return
        }

        const data = (await response.json()) as { text?: string }
        const transcribedText = data.text?.trim() || ""

        console.log("[Voice Assistant] Transcription response", {
          text: transcribedText,
          submit,
        })

        if (transcribedText) {
          const prefix = currentTranscriptRef.current
          const fullText = prefix
            ? `${prefix} ${transcribedText}`
            : transcribedText

          console.log("[Voice Assistant] Updating transcript", {
            prefix,
            transcribedText,
            fullText,
          })

          onTranscriptChange(fullText)

          if (submit) {
            setTimeout(() => {
              onTranscriptComplete(fullText)
            }, 50)
          }
        }
      } catch (error) {
        console.error("[Voice Assistant] Transcription error:", error)
      } finally {
        setIsTranscribing(false)
      }
    },
    [onTranscriptChange, onTranscriptComplete],
  )

  const startListening = useCallback(async () => {
    if (isListening || isTranscribing) {
      return false
    }

    stopSpeakingRef.current()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []
      shouldSubmitRef.current = false
      hasSpeechRef.current = false // Reset speech flag

      // Initialize VAD on the captured stream
      try {
        const { MicVAD } = await import("@ricky0123/vad-web")
        if (vadRef.current) {
          await vadRef.current.destroy()
        }
        vadRef.current = await MicVAD.new({
          baseAssetPath: "/",
          onnxWASMBasePath: "/",
          getStream: async () => stream,
          onSpeechStart: () => {
            hasSpeechRef.current = true
            console.log("[Voice Assistant] VAD: Speech detected")
          },
        })
        await vadRef.current.start()
      } catch (vadError) {
        console.warn("[Voice Assistant] VAD initialization failed, defaulting to true:", vadError)
        hasSpeechRef.current = true // Fallback if VAD fails to load
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("[Voice Assistant] Recording data available", {
            size: event.data.size,
            totalChunks: audioChunksRef.current.length + 1,
          })
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log("[Voice Assistant] MediaRecorder stopped")
        if (vadRef.current) {
          void vadRef.current.pause()
        }
        // Clean up the media stream
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop()
          }
          streamRef.current = null
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })

        console.log("[Voice Assistant] Audio blob created", {
          size: audioBlob.size,
          chunks: audioChunksRef.current.length,
          shouldSubmit: shouldSubmitRef.current,
        })

        // Transcribe logic
        if (audioBlob.size > 0) {
          void sendToGroq(audioBlob, shouldSubmitRef.current)
        }

        setIsListening(false)
        mediaRecorderRef.current = null
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
      return true
    } catch (error) {
      console.error("[Voice Assistant] Microphone access error:", error)
      setIsListening(false)
      return false
    }
  }, [isListening, isTranscribing, sendToGroq])

  // Keep stopSpeaking in a ref so startListening doesn't depend on it
  const stopSpeakingRef = useRef(() => {})

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    streamerRef.current?.stop()
    setIsSpeaking(false)
  }, [])

  useEffect(() => {
    stopSpeakingRef.current = stopSpeaking
  }, [stopSpeaking])

  const stopListening = useCallback(
    (options?: { submit?: boolean }) => {
      if (!mediaRecorderRef.current || !isListening) {
        return
      }

      shouldSubmitRef.current = options?.submit ?? false

      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    },
    [isListening],
  )

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening({ submit: true })
      return true
    }

    return startListening()
  }, [isListening, startListening, stopListening])

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

        if (!response.body) {
          throw new Error("No response body")
        }

        const mediaSource = new MediaSource()
        const url = URL.createObjectURL(mediaSource)

        mediaSource.addEventListener("sourceopen", async () => {
          try {
            const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg")
            const reader = response.body!.getReader()

            const appendChunk = async (chunk: Uint8Array) => {
              return new Promise<void>((resolve, reject) => {
                sourceBuffer.onupdateend = () => {
                  sourceBuffer.onupdateend = null
                  sourceBuffer.onerror = null
                  resolve()
                }
                sourceBuffer.onerror = (e) => {
                  sourceBuffer.onupdateend = null
                  sourceBuffer.onerror = null
                  reject(e)
                }
                try {
                  sourceBuffer.appendBuffer(chunk as unknown as BufferSource)
                } catch (e) {
                  reject(e)
                }
              })
            }

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value) {
                await appendChunk(value)
              }
            }

            if (mediaSource.readyState === "open") {
              mediaSource.endOfStream()
            }
          } catch (err) {
            console.error("Stream error in speak():", err)
            if (mediaSource.readyState === "open") {
              mediaSource.endOfStream("network")
            }
          }
        })

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
    [stopSpeaking, playbackRate],
  )

  const appendTTSChunk = useCallback((text: string) => {
    streamerRef.current?.appendTextTokens(text)
  }, [])

  const flushTTS = useCallback(() => {
    streamerRef.current?.finish()
  }, [])

  return {
    isListening,
    isSpeaking,
    isTranscribing,
    playbackRate,
    recognitionSupported: true, // Groq API always available server-side
    setPlaybackRate,
    speak,
    appendTTSChunk,
    flushTTS,
    startListening,
    stopListening,
    stopSpeaking,
    toggleListening,
  }
}


