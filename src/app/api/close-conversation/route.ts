import { NextResponse } from "next/server"
import { z } from "zod"

import { getCmsConfig } from "@/features/cms/api/cms-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  departmentSlug: z.string().min(1),
  conversationId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const config = await getCmsConfig({ includeSecrets: true })
    const department = config.departments.find(
      (item) => item.slug === parsed.data.departmentSlug,
    )

    if (!department?.integration.apiKey) {
      return NextResponse.json({ error: "Department not configured" }, { status: 404 })
    }

    const baseUrl = process.env.API_ASSISTANT_BASE_URL || "http://localhost:8000"
    const url = new URL(
      `/api/external/close-conversation/${parsed.data.conversationId}`,
      baseUrl,
    ).toString()

    await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": department.integration.apiKey },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
