"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createMenuItem, updateMenuItem, type MenuItemInput } from "@/lib/actions/menu"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils/formatters"
import { UploadSimpleIcon, XIcon, ImageIcon } from "@phosphor-icons/react"
import { CategoryIcon } from "@/components/shared/CategoryIcon"

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

const INPUT_CLS = "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
const LABEL_CLS = "text-zinc-400 text-xs font-semibold uppercase tracking-wider"
const SELECT_TRIGGER_CLS = "min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-0 focus-visible:ring-0"
const SELECT_CONTENT_CLS = "bg-zinc-900 border-zinc-700"
const SELECT_ITEM_CLS = "text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"

interface MenuItemFormProps {
  categories: { id: string; name: string; icon: string }[]
  stations: { id: string; name: string; color: string }[]
  defaultValues?: {
    id: string
    name: string
    description: string | null
    price: number
    category_id: string
    station_id: string
    image_url: string | null
    is_available: boolean
  }
}

async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()
  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path)
  return { url: data.publicUrl }
}

export function MenuItemForm({ categories, stations, defaultValues }: MenuItemFormProps) {
  const router = useRouter()
  const isEditing = !!defaultValues
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [price, setPrice] = useState(defaultValues?.price.toString() ?? "")
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? "")
  const [stationId, setStationId] = useState(defaultValues?.station_id ?? "")

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.image_url ?? null)
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(defaultValues?.image_url ?? null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Solo se aceptan imágenes JPG, PNG o WebP")
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen no puede superar 2 MB")
      return
    }

    setError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setSavedImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let finalImageUrl: string | null = savedImageUrl

    if (imageFile) {
      const result = await uploadImage(imageFile)
      if ("error" in result) {
        setError(`Error al subir imagen: ${result.error}`)
        setLoading(false)
        return
      }
      finalImageUrl = result.url
    }

    const data: MenuItemInput = {
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      category_id: categoryId,
      station_id: stationId,
      image_url: finalImageUrl,
    }

    const result = isEditing
      ? await updateMenuItem(defaultValues.id, data)
      : await createMenuItem(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/menu/items")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {/* Imagen */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Imagen (opcional)</Label>

        {imagePreview ? (
          <div className="relative w-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900" style={{ aspectRatio: "16/9" }}>
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={imagePreview.startsWith("blob:")}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer py-8">
            <ImageIcon className="w-8 h-8 text-zinc-500" />
            <div className="text-center">
              <span className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 justify-center">
                <UploadSimpleIcon className="w-4 h-4" />
                Subir imagen
              </span>
              <span className="text-xs text-zinc-500 mt-0.5 block">JPG, PNG, WebP — máx. 2 MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name" className={LABEL_CLS}>Nombre del plato</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Picaña (250g)"
          required
          className={`min-h-[44px] ${INPUT_CLS}`}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className={LABEL_CLS}>Descripción (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción breve del plato"
          rows={2}
          className={INPUT_CLS}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="price" className={LABEL_CLS}>Precio</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">S/</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
            className={`pl-8 min-h-[44px] ${INPUT_CLS}`}
          />
        </div>
        {price && !isNaN(parseFloat(price)) && (
          <p className="text-xs text-zinc-500">{formatCurrency(parseFloat(price))}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className={LABEL_CLS}>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger className={SELECT_TRIGGER_CLS}>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLS}>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} className={SELECT_ITEM_CLS}>
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={c.icon} className="w-4 h-4" />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className={LABEL_CLS}>Estación de cocina</Label>
        <Select value={stationId} onValueChange={setStationId} required>
          <SelectTrigger className={SELECT_TRIGGER_CLS}>
            <SelectValue placeholder="Seleccionar estación" />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLS}>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.id} className={SELECT_ITEM_CLS}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/menu/items")}
          className="min-h-[44px] border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !categoryId || !stationId}
          className="bg-emerald-600 hover:bg-emerald-500 min-h-[44px] text-white"
        >
          {loading
            ? imageFile
              ? "Subiendo imagen..."
              : "Guardando..."
            : isEditing
              ? "Actualizar plato"
              : "Crear plato"}
        </Button>
      </div>
    </form>
  )
}
