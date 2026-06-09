"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createTable, updateTable } from "@/lib/actions/tables"
import { createClient } from "@/lib/supabase/client"
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react"

interface Table {
  id: string
  number: number
  capacity: number
  status: string
}

const INPUT_CLS = "min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
const LABEL_CLS = "text-zinc-400 text-xs font-semibold uppercase tracking-wider"

export function TablesAdminClient({ initialTables }: { initialTables: Table[] }) {
  const [tables, setTables] = useState(initialTables)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Table | null>(null)
  const [number, setNumber] = useState("")
  const [capacity, setCapacity] = useState("4")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchTables() {
    const supabase = createClient()
    const { data } = await supabase
      .from("restaurant_tables")
      .select("id, number, capacity, status")
      .order("number")
    if (data) setTables(data)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createTable(parseInt(number), parseInt(capacity))
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setCreateOpen(false)
    setNumber("")
    setCapacity("4")
    fetchTables()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setLoading(true)
    setError(null)
    const result = await updateTable(editTarget.id, { capacity: parseInt(capacity) })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setEditTarget(null)
    fetchTables()
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
        >
          <PlusIcon className="w-4 h-4 mr-1" /> Nueva mesa
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center relative hover:border-zinc-700 transition-colors"
          >
            <p className="text-3xl font-bold text-zinc-100">{table.number}</p>
            <p className="text-sm text-zinc-500 mt-1">{table.capacity} personas</p>
            <button
              onClick={() => { setEditTarget(table); setCapacity(table.capacity.toString()) }}
              className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <PencilSimpleIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva mesa</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label className={LABEL_CLS}>Número de mesa</Label>
              <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} min="1" required className={INPUT_CLS} />
            </div>
            <div className="space-y-1">
              <Label className={LABEL_CLS}>Capacidad (personas)</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required className={INPUT_CLS} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {loading ? "Creando..." : "Crear mesa"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Mesa {editTarget?.number}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <Label className={LABEL_CLS}>Capacidad (personas)</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required className={INPUT_CLS} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
