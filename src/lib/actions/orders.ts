"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface OrderItemInput {
  menuItemId: string
  quantity: number
  notes?: string
  stationId: string
  categoryId: string
}

export async function createOrder(
  tableId: string,
  items: OrderItemInput[],
  notes?: string,
  isAddition?: boolean
): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  // Crear la orden
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase.from("orders") as any)
    .insert({
      table_id: tableId,
      waiter_id: user.id,
      status: "pending",
      notes: notes || null,
      is_addition: isAddition ?? false,
    })
    .select()
    .single()

  if (orderError || !order) return { error: orderError?.message ?? "Error al crear orden" }

  // Insertar ítems
  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    notes: item.notes || null,
    station_id: item.stationId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category_id: item.categoryId as any,
    status: "pending" as const,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase.from("order_items") as any)
    .insert(orderItems)

  if (itemsError) {
    // Rollback: eliminar la orden
    await supabase.from("orders").delete().eq("id", order.id)
    return { error: itemsError.message }
  }

  // Actualizar estado de la mesa
  await supabase
    .from("restaurant_tables")
    .update({ status: "occupied" })
    .eq("id", tableId)

  revalidatePath("/tables")
  revalidatePath("/active")

  return { orderId: order.id }
}

export async function sendToKitchen(orderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({
      status: "in_kitchen",
      sent_to_kitchen_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")

  if (error) return { error: error.message }

  revalidatePath("/active")
  revalidatePath("/display")
  revalidatePath("/dashboard")

  return {}
}

export async function markOrderReady(orderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("status", "pending")

  if (count && count > 0) {
    return { error: "Hay ítems sin marcar. Marca todos los ítems antes de marcar la orden como lista." }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "ready",
      ready_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) return { error: error.message }

  revalidatePath("/display")
  revalidatePath("/active")
  revalidatePath("/dashboard")

  return {}
}

export async function markOrderDelivered(
  orderId: string,
  paymentMethod: "cash" | "card"
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("table_id")
    .eq("id", orderId)
    .single()

  // payment_method añadido en migración 007; regenerar tipos con:
  // pnpm exec supabase gen types typescript --project-id <ID> > src/types/database.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("orders") as any)
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
      payment_method: paymentMethod,
    })
    .eq("id", orderId)

  if (error) return { error: error.message }

  // Liberar mesa si no tiene más órdenes activas
  if (order?.table_id) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_id", order.table_id)
      .in("status", ["pending", "in_kitchen", "ready"])

    if (!count || count === 0) {
      await supabase
        .from("restaurant_tables")
        .update({ status: "available" })
        .eq("id", order.table_id)
    }
  }

  revalidatePath("/tables")
  revalidatePath("/active")
  revalidatePath("/dashboard")

  return {}
}

export async function markOrderPickedUp(orderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("orders") as any)
    .update({ picked_up_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "ready")

  if (error) return { error: error.message }

  revalidatePath("/display")
  revalidatePath("/active")

  return {}
}

export async function markCategoryDelivered(
  orderId: string,
  categoryId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("order_items") as any)
    .update({ delivered_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("category_id", categoryId)
    .eq("status", "ready")
    .is("delivered_at", null)

  if (error) return { error: error.message }

  revalidatePath("/active")

  return {}
}

export async function cancelOrder(orderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("table_id, status")
    .eq("id", orderId)
    .single()

  if (!order) return { error: "Orden no encontrada" }
  if (!["pending", "in_kitchen"].includes(order.status)) {
    return { error: "No se puede cancelar una orden en este estado" }
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)

  if (error) return { error: error.message }

  // Liberar mesa si no hay otras órdenes activas
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("table_id", order.table_id)
    .in("status", ["pending", "in_kitchen", "ready"])

  if (!count || count === 0) {
    await supabase
      .from("restaurant_tables")
      .update({ status: "available" })
      .eq("id", order.table_id)
  }

  revalidatePath("/tables")
  revalidatePath("/active")
  revalidatePath("/display")

  return {}
}
