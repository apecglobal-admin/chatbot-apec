import { CmsShell } from "@/components/cms/shell/cms-shell"
import { getCmsConfig } from "@/lib/cms-store"

export const dynamic = "force-dynamic"

export default async function CmsPage() {
  try {
    const config = await getCmsConfig()

    return <CmsShell initialConfig={config} />
  } catch (error) {
    console.error("Failed to load CMS config page from Supabase.", error)
    throw error
  }
}
