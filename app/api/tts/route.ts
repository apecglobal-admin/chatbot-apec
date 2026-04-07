import { NextResponse } from "next/server"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"
import { z } from "zod"

export const runtime = "nodejs"

const requestSchema = z.object({
  text: z.string().min(1),
  rate: z.string().optional(),
})

const VOICE = "vi-VN-HoaiMyNeural"
const MAX_RETRIES = 3

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Delay toàn cục giữa các request để tránh spam Edge TTS bị rate limit ẩn
let lastGlobalRequestTime = 0;
const GLOBAL_DELAY_MS = 500;

/**
 * msedge-tts sometimes silently closes its stream without emitting any data
 * or errors for certain texts. This helper retries up to MAX_RETRIES times
 * with a fresh TTS instance each attempt.
 */
async function synthesizeWithRetry(
  text: string,
  rateOption?: { rate: string },
): Promise<Buffer> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const tts = new MsEdgeTTS()
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    const chunks: Buffer[] = []

    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const { audioStream } = tts.toStream(text, rateOption)

      audioStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      audioStream.on("close", () => {
        resolve(Buffer.concat(chunks))
      })

      audioStream.on("error", (err: Error) => {
        reject(err)
      })
    })

    if (audioBuffer.length > 0) {
      return audioBuffer
    }

    console.warn(
      `[TTS] Attempt ${attempt}/${MAX_RETRIES} returned empty audio for text: "${text}"`
    )

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 1000
      await sleep(delay)
    }
  }

  throw new Error(`TTS returned empty audio after ${MAX_RETRIES} retries`)
}

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload không hợp lệ." },
        { status: 400 },
      )
    }

    const { text, rate } = parsed.data
    const rateOption = rate ? { rate } : undefined

    // Thêm delay giữa các lần connect lên Edge TTS
    const now = Date.now();
    const timeToWait = Math.max(0, lastGlobalRequestTime + GLOBAL_DELAY_MS - now);
    lastGlobalRequestTime = now + timeToWait;
    
    if (timeToWait > 0) {
      await sleep(timeToWait);
    }

    const audioBuffer = await synthesizeWithRetry(text, rateOption)

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "Content-Length": audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("[TTS Error]:", error)
    return NextResponse.json({ error: "Không thể tạo giọng nói." }, { status: 500 })
  }
}
