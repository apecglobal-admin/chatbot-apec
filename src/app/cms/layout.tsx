import { getCmsConfig } from "@/lib/cms-store"
import { CmsProvider as Provider } from "@/components/cms/layout/cms-provider"
import { Sidebar } from "@/components/cms/layout/sidebar"

export const dynamic = "force-dynamic"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await getCmsConfig()
  
  return (
    <Provider initialConfig={config}>
       <main className="min-h-screen bg-[linear-gradient(180deg,#edf2f7_0%,#f7f9fb_100%)] px-3 py-3 md:px-4 md:py-4">
          <div className="mx-auto grid max-w-375 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
             <Sidebar />
             {children}
          </div>
       </main>
    </Provider>
  )
}
