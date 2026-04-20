import { NextResponse } from "next/server"

import { saveCmsConfig } from "@/features/cms/api/cms-store"
import type { CmsConfig } from "@/features/cms/types/cms"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CmsConfig
    const config = await saveCmsConfig(body)

    return NextResponse.json({ config })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể lưu cấu hình CMS."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
