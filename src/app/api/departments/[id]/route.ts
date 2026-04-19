import { NextResponse } from "next/server"

import { deleteDepartment, saveDepartment } from "@/lib/cms-store"
import type { DepartmentConfig } from "@/types/cms"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as DepartmentConfig

    if (body.id !== id) {
      return NextResponse.json({ error: "ID không khớp." }, { status: 400 })
    }

    const config = await saveDepartment(body)

    return NextResponse.json({ config })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật cấu hình CMS."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const config = await deleteDepartment(id)

    return NextResponse.json({ config })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xóa ngành hàng CMS."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
