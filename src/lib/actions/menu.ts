"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── Stations ───────────────────────────────────────────────────────────────

export async function createStation(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || "#6B7280"

  const { data: maxOrder } = await supabase
    .from("kitchen_stations")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const display_order = (maxOrder?.display_order ?? 0) + 1

  const { error } = await supabase
    .from("kitchen_stations")
    .insert({ name: name.trim(), color, display_order })

  if (error) return { error: error.message }
  revalidatePath("/menu/stations")
  return { success: true }
}

export async function updateStation(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const color = formData.get("color") as string

  const { error } = await supabase
    .from("kitchen_stations")
    .update({ name: name.trim(), color })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/stations")
  return { success: true }
}

export async function deleteStation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("kitchen_stations")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/stations")
  return { success: true }
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const icon = (formData.get("icon") as string) || "🍽️"

  const { data: maxOrder } = await supabase
    .from("menu_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const display_order = (maxOrder?.display_order ?? 0) + 1

  const { error } = await supabase
    .from("menu_categories")
    .insert({ name: name.trim(), icon, display_order })

  if (error) return { error: error.message }
  revalidatePath("/menu/categories")
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const icon = formData.get("icon") as string

  const { error } = await supabase
    .from("menu_categories")
    .update({ name: name.trim(), icon })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/categories")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/categories")
  return { success: true }
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export interface MenuItemInput {
  name: string
  description?: string | null
  price: number
  category_id: string
  station_id: string
  image_url?: string | null
  is_available?: boolean
}

export async function createMenuItem(data: MenuItemInput) {
  const supabase = await createClient()

  const { data: maxOrder } = await supabase
    .from("menu_items")
    .select("display_order")
    .eq("category_id", data.category_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const display_order = (maxOrder?.display_order ?? 0) + 1

  const { data: item, error } = await supabase
    .from("menu_items")
    .insert({ ...data, display_order })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath("/menu/items")
  return { id: item.id }
}

export async function updateMenuItem(id: string, data: Partial<MenuItemInput>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("menu_items")
    .update(data)
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/items")
  revalidatePath(`/menu/items/${id}`)
  return { success: true }
}

export async function toggleItemAvailability(id: string, currentValue: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: !currentValue })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/items")
  return { success: true }
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient()

  // Verificar que no tenga order_items asociados
  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("menu_item_id", id)

  if (count && count > 0) {
    return { error: "No se puede eliminar un plato con pedidos asociados" }
  }

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/menu/items")
  return { success: true }
}
