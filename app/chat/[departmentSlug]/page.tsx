import { notFound } from "next/navigation"

import { ChatbotShell } from "@/features/chat"
import { getCmsConfig } from "@/lib/cms-store"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    departmentSlug: string
  }>
}

export default async function DepartmentChatPage({ params }: PageProps) {
  const { departmentSlug } = await params

  try {
    const config = await getCmsConfig()
    const department = config.departments.find((item) => item.slug === departmentSlug)

    if (!department) {
      notFound()
    }

    return (
      <ChatbotShell
        department={department}
        apiConfigured={department.integration.apiKeyConfigured}
      />
    )
  } catch (error) {
    console.error(
      `Failed to load chat page config from Supabase for department slug "${departmentSlug}".`,
      error,
    )
    throw error
  }
}
