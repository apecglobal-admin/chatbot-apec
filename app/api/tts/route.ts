import { NextResponse } from "next/server"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"
import { z } from "zod"

export const runtime = "nodejs"

const requestSchema = z.object({
  text: z.string().min(1),
  rate: z.string().optional(),
})

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

    const tts = new MsEdgeTTS()
    // Sử dụng giọng nữ tiếng Việt chuẩn xác (Hoài My) của Edge Neural
    await tts.setMetadata("vi-VN-HoaiMyNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    const { audioStream } = tts.toStream(text, rate ? { rate } : undefined)

    const readable = new ReadableStream({
      start(controller) {
        audioStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })

        audioStream.on("close", () => {
          controller.close()
        })

        audioStream.on("error", (err: Error) => {
          console.error("[TTS Stream Error]:", err)
          controller.error(err)
        })
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[TTS Error]:", error)
    return NextResponse.json({ error: "Không thể tạo giọng nói." }, { status: 500 })
  }
}
