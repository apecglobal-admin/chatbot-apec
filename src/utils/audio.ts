/**
 * Streaming TTS Pipeline using Web Audio API queue
 */
export class TTSStreamer {
  private bufferText: string = ""
  private isPlaying = false
  private abortController: AbortController | null = null
  // Track all created URLs to ensure they are cleaned up even if never played
  private activeObjectURLs = new Set<string>()

  constructor(
    private options?: {
      playbackRate?: number
      onSpeakingStateChange?: (isSpeaking: boolean) => void
    },
  ) {
    this.abortController = new AbortController()
  }

  /**
   * Feed raw LLM text tokens as they arrive.
   */
  public appendTextTokens(text: string) {
    // If we aborted previously, we need a fresh controller to start new requests
    if (this.abortController?.signal.aborted) {
      this.abortController = new AbortController()
    }
    this.bufferText += text
  }

  /**
   * Call when stream completely finishes.
   */
  public async finish() {
    const finalChunk = this.bufferText.trim()
    this.bufferText = ""

    if (finalChunk.length === 0) return

    try {
      this.isPlaying = true
      this.options?.onSpeakingStateChange?.(true)

      const audioUrl = await this.synthesizeToEdgeTTS(finalChunk)
      if (audioUrl) {
        await this.playAudio(audioUrl)
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError") && (error as any).message !== "AbortError") {
        console.error("TTS generation or playback failed:", error)
      }
    } finally {
      this.isPlaying = false
      this.options?.onSpeakingStateChange?.(false)
    }
  }

  /**
   * Handles Edge TTS integration
   */
  private async synthesizeToEdgeTTS(text: string): Promise<string> {
    const cleanText = text
      // 1. Giữ lại text hiển thị của markdown link, xoá phần URL: [Tên Link](https://...) -> Tên Link
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // 2. Xoá toàn bộ các raw URL (http://, https://)
      .replace(/https?:\/\/[^\s]+/g, "")
      // 3. Xoá các ký tự markdown định dạng (*, #)
      .replace(/[*#]/g, "")
      .replace(/&/g, "và") // & → "và"
      .replace(/(\d),(\d{3})/g, "$1$2") // 72,155 → "72155" (bỏ dấu phẩy ngăn cách hàng nghìn)
      .replace(/VNĐ|VND\b/gi, "đồng") // VNĐ → "đồng"
      .replace(/kg\b/gi, "ki-lô-gam")
      .replace(/Ecoop/gi, "Ê cóp")
      // Xóa xuống dòng
      .replace(/[\n\r]+/g, " ")
      .trim()

    if (!cleanText) return ""

    if (this.abortController?.signal.aborted) {
      throw new Error("AbortError")
    }

    const playbackRate = this.options?.playbackRate ?? 1.2
    const rateParam =
      playbackRate !== 1 ? `${playbackRate > 1 ? "+" : ""}${Math.round((playbackRate - 1) * 100)}%` : undefined

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: cleanText, rate: rateParam }),
      signal: this.abortController?.signal,
    })

    if (!response.ok) {
      throw new Error(`TTS API error ${response.status}: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error("No response body")
    }

    const mediaSource = new MediaSource()
    const url = URL.createObjectURL(mediaSource)
    this.activeObjectURLs.add(url)

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

        let isAborted = false
        if (this.abortController) {
          this.abortController.signal.addEventListener(
            "abort",
            () => {
              isAborted = true
            },
            { once: true },
          )
        }

        while (!isAborted) {
          const { done, value } = await reader.read()
          if (done || isAborted) break
          if (value) {
            await appendChunk(value)
          }
        }

        if (mediaSource.readyState === "open" && !isAborted) {
          mediaSource.endOfStream()
        }
      } catch (err) {
        if (mediaSource.readyState === "open") {
          mediaSource.endOfStream("network")
        }
      }
    })

    return url
  }

  /**
   * Wraps HTML5 Audio element inside a Promise to monitor end events
   */
  private playAudio(url: string): Promise<void> {
    if (!url) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const audio = new Audio(url)

      const onAbort = () => {
        audio.pause()
        audio.currentTime = 0
        audio.src = "" // Force release of the media resource
        audio.load()
        resolve()
      }

      this.abortController?.signal.addEventListener("abort", onAbort, {
        once: true,
      })

      audio.onended = () => {
        this.abortController?.signal.removeEventListener("abort", onAbort)
        resolve()
      }

      audio.onerror = (e) => {
        this.abortController?.signal.removeEventListener("abort", onAbort)
        // e is a browser Event, not an Error. Extract the MediaError from the audio element.
        const mediaError = audio.error
        const message = mediaError
          ? `MediaError code ${mediaError.code}: ${mediaError.message || "unknown"}`
          : "Unknown audio playback error"
        reject(new Error(message))
      }

      audio.play().catch((err) => {
        this.abortController?.signal.removeEventListener("abort", onAbort)
        if (err.name !== "AbortError") {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort()
    }

    this.bufferText = ""

    // Revoke all created URLs that were caught in the queue or being synthesized
    this.activeObjectURLs.forEach((url) => URL.revokeObjectURL(url))
    this.activeObjectURLs.clear()

    this.isPlaying = false
    this.options?.onSpeakingStateChange?.(false)
  }
}
