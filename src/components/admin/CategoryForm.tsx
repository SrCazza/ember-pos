"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORY_ICONS, getCategoryIconEntry } from "@/lib/utils/category-icons"

interface CategoryFormProps {
  defaultValues?: { name: string; icon: string }
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onSuccess?: () => void
  submitLabel?: string
}

export function CategoryForm({
  defaultValues,
  action,
  onSuccess,
  submitLabel = "Guardar",
}: CategoryFormProps) {
  const initialIcon = getCategoryIconEntry(defaultValues?.icon ?? "")
    ? (defaultValues?.icon ?? "fork-knife")
    : "fork-knife"
  const [icon, setIcon] = useState(initialIcon)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedEntry = getCategoryIconEntry(icon)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("icon", icon)
    const result = await action(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Nombre de la categoría</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ej: Carnes al Carbón"
          required
          className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Icono</Label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICONS.map((entry) => {
            const { Component } = entry
            const selected = icon === entry.name
            return (
              <button
                key={entry.name}
                type="button"
                title={entry.label}
                onClick={() => setIcon(entry.name)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 py-2.5 px-1 transition-colors ${
                  selected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                <Component weight="duotone" className="w-5 h-5" />
                <span className="text-[9px] font-medium truncate w-full text-center leading-tight opacity-70">
                  {entry.label.split(" / ")[0]}
                </span>
              </button>
            )
          })}
        </div>
        {selectedEntry && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <selectedEntry.Component weight="duotone" className="w-3.5 h-3.5 text-emerald-400" />
            <span>{selectedEntry.label}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
        {loading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  )
}
