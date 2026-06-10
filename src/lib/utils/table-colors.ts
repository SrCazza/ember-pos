const PALETTE = [
  "#EF4444", // 1 - red
  "#F97316", // 2 - orange
  "#EAB308", // 3 - yellow
  "#22C55E", // 4 - green
  "#06B6D4", // 5 - cyan
  "#3B82F6", // 6 - blue
  "#8B5CF6", // 7 - violet
  "#EC4899", // 8 - pink
  "#F43F5E", // 9 - rose
  "#14B8A6", // 10 - teal
]

export function getTableColor(tableNumber: number): string {
  return PALETTE[(tableNumber - 1) % PALETTE.length]
}
