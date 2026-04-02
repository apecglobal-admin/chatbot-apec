import type { DepartmentConfig } from "@/lib/cms-types"

export const themeFields: Array<{
  field: keyof DepartmentConfig["theme"]
  label: string
}> = [
  { field: "accent", label: "Accent" },
  { field: "accentSoft", label: "Accent soft" },
  { field: "panel", label: "Panel" },
  { field: "surface", label: "Surface" },
  { field: "userBubble", label: "User bubble" },
  { field: "assistantBubble", label: "Assistant bubble" },
  { field: "badge", label: "Badge text" },
]
