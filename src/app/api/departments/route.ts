import { NextResponse } from "next/server"

import { saveDepartment } from "@/lib/cms-store"
import type { DepartmentConfig } from "@/types/cms"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DepartmentConfig
    const config = await saveDepartment(body)

    return NextResponse.json({ config })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể thêm mới ngành hàng cms."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
