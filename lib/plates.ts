// Plate calculator — greedy algorithm with integer arithmetic

const SCALE = 1000000

function toMicro(val: number): number {
  return Math.round(val * SCALE)
}

function fromMicro(val: number): number {
  return val / SCALE
}

export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]
export const LB_PLATES = [55, 45, 35, 25, 10, 5, 2.5, 1]

export const KG_BARS = [20, 15, 10] as const
export const LB_BARS = [45, 35, 25] as const

export type PlateResult = {
  plates: number[]
  remainder: number
}

export function solve(target: number, denominations: number[]): PlateResult {
  const remaining = toMicro(target)
  const plates: number[] = []
  let left = remaining
  for (const denom of denominations) {
    const d = toMicro(denom)
    while (left >= d) {
      plates.push(denom)
      left -= d
    }
  }
  return { plates, remainder: fromMicro(left) }
}

export function perSide(total: number, bar: number): number {
  return (total - bar) / 2
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbToKg(lb: number): number {
  return Math.round(lb / 2.20462 * 10) / 10
}

export type PlateColor = {
  bg: string
  border?: "outline" | "outlineVariant"
}

const KG_COLORS: Record<number, PlateColor> = {
  25: { bg: "#E53935" },
  20: { bg: "#1E88E5" },
  15: { bg: "#FDD835" },
  10: { bg: "#43A047" },
  5: { bg: "#FFFFFF", border: "outline" },
  2.5: { bg: "#212121", border: "outlineVariant" },
  1.25: { bg: "#BDBDBD", border: "outline" },
  0.5: { bg: "#757575" },
}

const LB_COLORS: Record<number, PlateColor> = {
  55: { bg: "#E53935" },
  45: { bg: "#1E88E5" },
  35: { bg: "#FDD835" },
  25: { bg: "#43A047" },
  10: { bg: "#FFFFFF", border: "outline" },
  5: { bg: "#212121", border: "outlineVariant" },
  2.5: { bg: "#BDBDBD", border: "outline" },
  1: { bg: "#757575" },
}

export function color(weight: number, unit: "kg" | "lb"): PlateColor {
  const map = unit === "kg" ? KG_COLORS : LB_COLORS
  return map[weight] ?? { bg: "#757575" }
}

export function summarize(plates: number[]): { weight: number; count: number }[] {
  const counts = new Map<number, number>()
  for (const p of plates) {
    counts.set(p, (counts.get(p) ?? 0) + 1)
  }
  return [...counts.entries()].map(([weight, count]) => ({ weight, count }))
}
