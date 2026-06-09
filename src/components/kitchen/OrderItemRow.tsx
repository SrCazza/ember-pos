"use client"

import { useState, useEffect } from "react"
import { markItemReady, markItemPending } from "@/lib/actions/order-items"

interface OrderItemRowProps {
  id: string
  name: string
  quantity: number
  notes: string | null
  status: "pending" | "ready"
  readOnly?: boolean
}

export function OrderItemRow({ id, name, quantity, notes, status: initialStatus, readOnly }: OrderItemRowProps) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  // Sincronizar con el prop cuando el padre re-renderiza tras un evento Realtime
  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  async function toggle() {
    if (readOnly) return
    setLoading(true)
    if (status === "pending") {
      const result = await markItemReady(id)
      if (!result.error) setStatus("ready")
    } else {
      const result = await markItemPending(id)
      if (!result.error) setStatus("pending")
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || readOnly}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors min-h-[52px] ${readOnly ? "cursor-default" : "cursor-pointer"} ${
        status === "ready"
          ? "bg-emerald-900/20 opacity-60"
          : "bg-zinc-700/50 hover:bg-zinc-700"
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
          status === "ready"
            ? "bg-emerald-600 border-emerald-600"
            : "border-zinc-500 hover:border-emerald-400"
        }`}
      >
        {status === "ready" && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`font-medium text-lg ${status === "ready" ? "line-through text-zinc-600" : "text-white"}`}>
          {quantity}× {name}
        </span>
        {notes && (
          <p className="text-sm text-zinc-400 truncate">{notes}</p>
        )}
      </div>
    </button>
  )
}
