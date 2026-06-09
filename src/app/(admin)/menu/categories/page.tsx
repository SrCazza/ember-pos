"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/menu"
import { CategoryForm } from "@/components/admin/CategoryForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PencilSimpleIcon, TrashIcon, PlusIcon } from "@phosphor-icons/react"
import { CategoryIcon } from "@/components/shared/CategoryIcon"

interface Category {
  id: string
  name: string
  icon: string
  display_order: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  async function fetchCategories() {
    const supabase = createClient()
    const { data } = await supabase
      .from("menu_categories")
      .select("*")
      .order("display_order")
    setCategories((data ?? []).map((c) => ({ ...c, icon: c.icon ?? "🍽️" })))
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Organiza los platos en categorías"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <PlusIcon className="w-4 h-4 mr-1" /> Nueva categoría
          </Button>
        }
        variant="dark"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="Sin categorías"
          description="Crea la primera categoría del menú"
          variant="dark"
          action={
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              Nueva categoría
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CategoryIcon icon={cat.icon} className="w-6 h-6 text-zinc-300" />
              <span className="font-medium text-zinc-100 flex-1">{cat.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditTarget(cat)}
                className="min-h-[44px] min-w-[44px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <PencilSimpleIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(cat)}
                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 min-h-[44px] min-w-[44px]"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <CategoryForm
            action={createCategory}
            onSuccess={() => { setCreateOpen(false); fetchCategories() }}
            submitLabel="Crear categoría"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <CategoryForm
              defaultValues={editTarget}
              action={(fd) => updateCategory(editTarget.id, fd)}
              onSuccess={() => { setEditTarget(null); fetchCategories() }}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar categoría"
        description={`¿Eliminar "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteCategory(deleteTarget.id)
            setDeleteTarget(null)
            fetchCategories()
          }
        }}
      />
    </div>
  )
}
