import { semantic } from "../constants/theme";

export function rpeColor(val: number): string {
  if (val <= 7) return semantic.beginner;
  if (val <= 8) return semantic.intermediate;
  return semantic.advanced;
}

export function rpeText(val: number): string {
  if (val <= 7) return semantic.onBeginner;
  if (val <= 8) return semantic.onIntermediate;
  return semantic.onAdvanced;
}
