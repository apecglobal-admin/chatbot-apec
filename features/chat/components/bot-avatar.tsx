"use client"

import type { DepartmentTheme } from "@/lib/cms-types"
import { hexToRgba } from "@/lib/color"

interface BotAvatarProps {
  theme: DepartmentTheme
}

export function BotAvatar({ theme }: BotAvatarProps) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white text-xs font-bold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      style={{
        backgroundImage: theme.botAvatarUrl
          ? "none"
          : `linear-gradient(135deg, ${hexToRgba(theme.accent, 0.18)}, rgba(255,255,255,0.92))`,
      }}
    >
      {theme.botAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.botAvatarUrl}
          alt="AI"
          className="h-full w-full object-cover"
        />
      ) : (
        "AI"
      )}
    </div>
  )
}
