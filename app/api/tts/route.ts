import { NextResponse } from "next/server";
import { Communicate } from "edge-tts-universal";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(1),
  rate: z.string().optional(),
});

const VOICE = "vi-VN-HoaiMyNeural";
const GLOBAL_DELAY_MS = 500;
let lastGlobalRequestTime = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload không hợp lệ." },
        { status: 400 },
      );
    }

    const { text, rate } = parsed.data;

    // 1. Throttling để tránh bị Microsoft chặn
    const now = Date.now();
    const timeToWait = Math.max(
      0,
      lastGlobalRequestTime + GLOBAL_DELAY_MS - now,
    );
    lastGlobalRequestTime = now + timeToWait;
    if (timeToWait > 0) await sleep(timeToWait);

    // 2. Khởi tạo Communicate
    const communicate = new Communicate(text, {
      voice: VOICE,
      rate: rate || "+0%",
    });

    // 3. Tạo ReadableStream để stream dữ liệu về Client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Lặp qua các chunk từ stream của edge-tts-universal
          for await (const chunk of communicate.stream()) {
            if (chunk.type === "audio" && chunk.data) {
              // Gửi chunk dữ liệu (Uint8Array/Buffer) thẳng tới client
              controller.enqueue(chunk.data);
            }
          }
          controller.close();
        } catch (err) {
          console.error("[Stream Error]:", err);
          controller.error(err);
        }
      },
    });

    // 4. Trả về Response dạng stream
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked", // Tự động báo cho trình duyệt đây là stream
      },
    });
  } catch (error) {
    console.error("[TTS POST Error]:", error);
    return NextResponse.json(
      { error: "Không thể khởi tạo stream giọng nói." },
      { status: 500 },
    );
  }
}
