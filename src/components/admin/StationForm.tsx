"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16",
  "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6",
  "#EC4899", "#6B7280",
]

interface StationFormProps {
  defaultValues?: { name: string; color: string }
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onSuccess?: () => void
  submitLabel?: string
}

export function StationForm({
  defaultValues,
  action,
  onSuccess,
  submitLabel = "Guardar",
}: StationFormProps) {
  const [color, setColor] = useState(defaultValues?.color ?? "#6B7280")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("color", color)
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
        <Label htmlFor="name" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Nombre de la estación</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ej: Parrilla"
          required
          className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Color identificador</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#e4e4e7" : "transparent",
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-zinc-700"
            title="Color personalizado"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
        {loading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  )
}
