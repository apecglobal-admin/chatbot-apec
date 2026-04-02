function normalizeHex(hex: string) {
  const value = hex.replace("#", "").trim()

  if (value.length === 3) {
    return value
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
  }

  return value.slice(0, 6)
}

export function hexToRgba(hex: string, alpha: number) {
  const normalized = normalizeHex(hex)

  if (normalized.length !== 6) {
    return `rgba(15, 23, 42, ${alpha})`
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
