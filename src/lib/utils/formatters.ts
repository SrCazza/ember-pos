export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "hace un momento"
  if (diffMins === 1) return "hace 1 min"
  if (diffMins < 60) return `hace ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return "hace 1 hora"
  return `hace ${diffHours} horas`
}

export function getElapsedSeconds(dateString: string): number {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
}

export function formatOrderNumber(n: number | null | undefined): string {
  if (!n) return "—"
  return `#${String(n).padStart(5, "0")}`
}
