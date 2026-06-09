"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DownloadSimpleIcon, SpinnerIcon } from "@phosphor-icons/react"

interface ExportButtonProps {
  onExport: (from: Date, to: Date) => Promise<void>
  defaultDays?: number
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]
}

function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

export function ExportButton({ onExport, defaultDays = 7 }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(daysAgoStr(defaultDays))
  const [to, setTo] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    const fromDate = new Date(from + "T00:00:00")
    const toDate = new Date(to + "T00:00:00")

    if (fromDate > toDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha fin.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      await onExport(fromDate, toDate)
      setOpen(false)
    } catch {
      setError("Error al generar el archivo. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setOpen((o) => !o); setError(null) }}
        className="min-h-[36px] text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700 gap-1.5"
      >
        <DownloadSimpleIcon className="w-3.5 h-3.5" weight="bold" />
        Exportar XLSX
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rango de exportación</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500">Desde</label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => { setFrom(e.target.value); setError(null) }}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500">Hasta</label>
              <input
                type="date"
                value={to}
                min={from}
                max={todayStr()}
                onChange={(e) => { setTo(e.target.value); setError(null) }}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); setError(null) }}
              disabled={loading}
              className="flex-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <DownloadSimpleIcon className="w-3.5 h-3.5" weight="bold" />
                  Descargar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
