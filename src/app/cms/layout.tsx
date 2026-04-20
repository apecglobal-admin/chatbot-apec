import { getCmsConfig } from "@/lib/cms-store"
import { CmsProvider as Provider } from "@/components/cms/layout/cms-provider"
import { Sidebar } from "@/components/cms/layout/sidebar"
import { getSession } from "@/features/auth/api/get-session"
import { AuthSync } from "@/features/auth/components/auth-sync"

export const dynamic = "force-dynamic"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await getCmsConfig()
  const session = await getSession()
  
  return (
    <Provider initialConfig={config}>
       <AuthSync session={session} />
       <main className="min-h-screen bg-slate-50/80 px-3 py-3 md:px-4 md:py-4">
          <div className="mx-auto grid max-w-375 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
             <Sidebar />
             {children}
          </div>
       </main>
    </Provider>
  )
}
