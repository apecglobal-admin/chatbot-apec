import { NextResponse } from "next/server"
import { z } from "zod"

import { getCmsConfig } from "@/lib/cms-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const requestSchema = z.object({
  departmentSlug: z.string().min(1),
  message: z.string().min(1).max(4000),
  userId: z.string().min(1),
  conversationId: z.string().nullish(),
})

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload không hợp lệ." },
        { status: 400 },
      )
    }

    const config = await getCmsConfig({ includeSecrets: true })
    const department = config.departments.find(
      (item) => item.slug === parsed.data.departmentSlug,
    )

    if (!department) {
      return NextResponse.json({ error: "Không tìm thấy ngành hàng." }, { status: 404 })
    }

    if (!department.integration.apiKey) {
      return NextResponse.json(
        { error: "Ngành hàng này chưa được cấu hình API key riêng." },
        { status: 503 },
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      department.integration.requestTimeoutMs,
    )

    try {
      const upstreamBody: Record<string, unknown> = {
        message: parsed.data.message,
        user_id: `${department.integration.partnerUserPrefix}-${parsed.data.userId}`,
        metadata: {
          assistant: department.integration.assistantSlug,
        },
      }

      if (parsed.data.conversationId) {
        upstreamBody.conversation_id = parsed.data.conversationId
      }

      const baseUrl = process.env.API_ASSISTANT_BASE_URL || "http://localhost:8000"
      const endpointUrl = new URL(department.integration.endpoint, baseUrl).toString()

      const upstream = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": department.integration.apiKey,
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
        cache: "no-store", // Ngăn Next.js tự động buffer toàn bộ response
      })

      clearTimeout(timeoutId)

      if (!upstream.ok) {
        const errorText = await upstream.text().catch(() => "")
        console.error(`[chat] upstream error:`, { status: upstream.status, body: errorText.slice(0, 500) })
        return NextResponse.json(
          { error: `API đối tác trả về lỗi (status ${upstream.status}).` },
          { status: upstream.status >= 400 ? upstream.status : 502 },
        )
      }

      if (!upstream.body) {
        return NextResponse.json(
          { error: "API đối tác không trả về nội dung." },
          { status: 502 },
        )
      }

      // Pipe the upstream NDJSON streaming body directly to the client
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-store",
          "X-Accel-Buffering": "no",
        },
      })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        console.error(`[chat] timeout after ${department.integration.requestTimeoutMs}ms`)
        return NextResponse.json(
          { error: "Hết thời gian chờ từ API đối tác." },
          { status: 504 },
        )
      }

      throw error
    }
  } catch (error) {
    console.error("[chat] unhandled error:", error)
    const message =
      error instanceof Error ? error.message : "Không thể gọi chatbot ngành hàng."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
