"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { createStation, updateStation, deleteStation } from "@/lib/actions/menu"
import { StationForm } from "@/components/admin/StationForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PencilSimpleIcon, TrashIcon, PlusIcon } from "@phosphor-icons/react"

interface Station {
  id: string
  name: string
  color: string
  display_order: number
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Station | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null)

  async function fetchStations() {
    const supabase = createClient()
    const { data } = await supabase
      .from("kitchen_stations")
      .select("*")
      .order("display_order")
    setStations(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStations() }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estaciones de Cocina"
        description="Configura las áreas de preparación"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <PlusIcon className="w-4 h-4 mr-1" /> Nueva estación
          </Button>
        }
        variant="dark"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stations.length === 0 ? (
        <EmptyState
          icon="🍳"
          title="Sin estaciones"
          description="Crea la primera estación de cocina"
          variant="dark"
          action={
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              Nueva estación
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {stations.map((station) => (
            <div
              key={station.id}
              className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div
                className="w-3 h-8 rounded-full shrink-0"
                style={{ backgroundColor: station.color }}
              />
              <span className="font-medium text-zinc-100 flex-1">{station.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditTarget(station)}
                className="min-h-[44px] min-w-[44px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <PencilSimpleIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(station)}
                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 min-h-[44px] min-w-[44px]"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva estación</DialogTitle>
          </DialogHeader>
          <StationForm
            action={createStation}
            onSuccess={() => { setCreateOpen(false); fetchStations() }}
            submitLabel="Crear estación"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar estación</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <StationForm
              defaultValues={editTarget}
              action={(fd) => updateStation(editTarget.id, fd)}
              onSuccess={() => { setEditTarget(null); fetchStations() }}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar estación"
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteStation(deleteTarget.id)
            setDeleteTarget(null)
            fetchStations()
          }
        }}
      />
    </div>
  )
}
