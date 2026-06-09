"use client"

import { useEffect, useState } from "react"
import { formatDuration } from "@/lib/utils/formatters"

interface OrderTimerProps {
  startTime: string
  urgentAfterMinutes?: number
  onUrgencyChange?: (isUrgent: boolean) => void
}

export function OrderTimer({ startTime, urgentAfterMinutes = 15, onUrgencyChange }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const isUrgent = elapsed >= urgentAfterMinutes * 60
  const isWarning = elapsed >= (urgentAfterMinutes * 60 * 0.66)

  useEffect(() => {
    onUrgencyChange?.(isUrgent)
  }, [isUrgent, onUrgencyChange])

  return (
    <span className={`text-sm font-mono font-bold tabular-nums px-2.5 py-1 rounded-lg ${
      isUrgent
        ? "bg-red-500/20 text-red-400 border border-red-500/30"
        : isWarning
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          : "bg-zinc-700 text-zinc-300 border border-zinc-600"
    }`}>
      {formatDuration(elapsed)}
    </span>
  )
}
