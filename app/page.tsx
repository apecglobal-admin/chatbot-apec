import Link from "next/link"
import { ChevronRight, Settings2 } from "lucide-react"

import { hexToRgba } from "@/lib/color"
import { getCmsConfig } from "@/lib/cms-store"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  try {
    const config = await getCmsConfig()
    const configuredDepartments = config.departments.filter(
      (department) => department.integration.apiKeyConfigured,
    ).length

    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F7F4EC_0%,#EEF7F0_52%,#F7F0E9_100%)] px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Chọn đúng màn hình, gọi đúng trợ lý
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Ngành hàng đang triển khai
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {config.departments.map((department) => (
                <Link
                  key={department.id}
                  href={`/chat/${department.slug}`}
                  className="group overflow-hidden rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_28px_72px_rgba(15,23,42,0.10)]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, ${hexToRgba(
                      department.theme.accent,
                      0.09,
                    )}, rgba(255,255,255,0.92))`,
                  }}
                >
                  <div
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: department.theme.accentSoft,
                      color: department.theme.badge,
                    }}
                  >
                    {department.zoneLabel}
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                    {department.name}
                  </h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                    {department.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {department.suggestedPrompts.slice(0, 2).map((prompt) => (
                      <span
                        key={prompt}
                        className="rounded-full px-3 py-1 text-xs"
                        style={{
                          backgroundColor: hexToRgba(department.theme.accent, 0.12),
                          color: department.theme.badge,
                        }}
                      >
                        {prompt}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    )
  } catch (error) {
    console.error("Failed to load homepage CMS config from Supabase.", error)
    throw error
  }
}
