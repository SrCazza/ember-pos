"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { SquaresFourIcon, ClipboardTextIcon, SignOutIcon } from "@phosphor-icons/react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions/auth"

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // AudioContext no disponible (entorno sin audio)
  }
}

export function WaiterBottomNav({ userId }: { userId: string }) {
  const pathname = usePathname()
  const [readyCount, setReadyCount] = useState(0)
  const prevCountRef = useRef(0)

  const fetchReadyCount = useCallback(async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("waiter_id", userId)
      .eq("status", "ready")
    setReadyCount(count ?? 0)
  }, [userId])

  useEffect(() => {
    fetchReadyCount()
    const interval = setInterval(fetchReadyCount, 5000)

    const supabase = createClient()
    const channel = supabase
      .channel("waiter-ready-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchReadyCount())
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchReadyCount])

  useEffect(() => {
    if (readyCount > prevCountRef.current) {
      playBeep()
    }
    prevCountRef.current = readyCount
  }, [readyCount])

  const tablesActive = pathname === "/tables"
  const activeActive = pathname === "/active"

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-zinc-200 flex shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <Link
        href="/tables"
        className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-4 text-xs transition-colors cursor-pointer relative ${tablesActive ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-700"}`}
      >
        <SquaresFourIcon className="w-5 h-5" weight={tablesActive ? "fill" : "regular"} />
        <span className="font-medium">Mesas</span>
        {tablesActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-emerald-500" />}
      </Link>

      <Link
        href="/active"
        className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-4 text-xs transition-colors cursor-pointer relative ${activeActive ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-700"}`}
      >
        <div className="relative">
          <ClipboardTextIcon className="w-5 h-5" weight={activeActive ? "fill" : "regular"} />
          {readyCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
              {readyCount}
            </span>
          )}
        </div>
        <span className="font-medium">Mis órdenes</span>
        {activeActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-emerald-500" />}
      </Link>

      <form action={signOut} className="flex-1">
        <button
          type="submit"
          className="w-full flex flex-col items-center gap-1 pt-3 pb-4 text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <SignOutIcon className="w-5 h-5" />
          <span className="font-medium">Salir</span>
        </button>
      </form>
    </nav>
  )
}
