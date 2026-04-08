import { createHash } from "node:crypto"

import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_RESOURCE_TYPES = new Set(["image", "video"])

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "chatbot-apec/cms"

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Thiếu cấu hình Cloudinary. Cần khai báo CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.",
    )
  }

  return { cloudName, apiKey, apiSecret, folder }
}

function signUploadParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex")
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const resourceType = String(formData.get("resourceType") || "image")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Không tìm thấy file upload." }, { status: 400 })
    }

    if (!VALID_RESOURCE_TYPES.has(resourceType)) {
      return NextResponse.json({ error: "Loại media không hợp lệ." }, { status: 400 })
    }

    if (!file.type.startsWith(`${resourceType}/`)) {
      return NextResponse.json(
        { error: `File tải lên phải là ${resourceType}.` },
        { status: 400 },
      )
    }

    const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig()
    const timestamp = String(Math.floor(Date.now() / 1000))
    const uploadFolder = `${folder}/${resourceType}s`
    const signature = signUploadParams(
      {
        folder: uploadFolder,
        timestamp,
      },
      apiSecret,
    )

    const uploadBody = new FormData()
    uploadBody.append("file", file, file.name)
    uploadBody.append("api_key", apiKey)
    uploadBody.append("timestamp", timestamp)
    uploadBody.append("folder", uploadFolder)
    uploadBody.append("signature", signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: uploadBody,
      },
    )

    const data = (await response.json()) as {
      secure_url?: string
      public_id?: string
      error?: { message?: string }
    }

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary từ chối upload.")
    }

    return NextResponse.json({
      publicId: data.public_id,
      secureUrl: data.secure_url,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể upload media lên Cloudinary."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
