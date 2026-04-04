import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      )
    }

    // Groq Whisper may throw for silent/empty audio — return empty text instead of 500
    let text = ""
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3-turbo",
        temperature: 0,
        language: "vi",
        response_format: "verbose_json",
        prompt: "Trả về Tiếng Việt có nghĩa",
      })

      // Whisper hallucinates text on silent audio (e.g. "subscribe cho kênh...")
      // Use multiple signals from verbose_json segments to filter
      const result = transcription as unknown as {
        segments?: Array<{
          text: string
          no_speech_prob: number
          avg_logprob: number
          compression_ratio: number
        }>
      }

      console.log(
        "[Transcribe API] Segments:",
        JSON.stringify(result.segments?.map((s) => ({
          text: s.text,
          no_speech_prob: s.no_speech_prob,
          avg_logprob: s.avg_logprob,
          compression_ratio: s.compression_ratio,
        })), null, 2),
      )

      if (result.segments && result.segments.length > 0) {
        const realSegments = result.segments.filter((seg) => {
          // High no_speech_prob = likely silence
          if (seg.no_speech_prob > 0.3) return false
          // Very low avg_logprob = low confidence (hallucination)
          if (seg.avg_logprob < -1.0) return false
          // High compression_ratio = repetitive/hallucinated text
          if (seg.compression_ratio > 2.4) return false
          return true
        })
        text = realSegments.map((seg) => seg.text).join("").trim()
      } else {
        text = transcription.text || ""
      }
    } catch (groqError) {
      console.warn("[Transcribe API] Groq returned error (likely silent audio):", groqError)
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[Transcribe API] Error:", error)
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    )
  }
}
