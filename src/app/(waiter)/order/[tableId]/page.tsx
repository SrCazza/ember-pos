import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { OrderBuilder } from "@/components/waiter/OrderBuilder"

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>
  searchParams: Promise<{ addition?: string }>
}) {
  const [{ tableId }, sp] = await Promise.all([params, searchParams])
  const isAddition = sp.addition === "true"

  const supabase = await createClient()

  const [{ data: table }, { data: categories }, { data: menuItems }] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, number, status")
      .eq("id", tableId)
      .single(),
    supabase
      .from("menu_categories")
      .select("id, name, icon")
      .order("display_order"),
    supabase
      .from("menu_items")
      .select("id, name, description, price, image_url, is_available, category_id, station_id")
      .order("display_order"),
  ])

  if (!table) notFound()
  // Solo bloquear acceso si la mesa está ocupada y NO es una adición
  if (table.status === "occupied" && !isAddition) redirect("/tables")

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col">
      <OrderBuilder
        tableId={table.id}
        tableNumber={table.number}
        isAddition={isAddition}
        categories={(categories ?? []).map((c) => ({ ...c, icon: c.icon ?? "🍽️" }))}
        menuItems={(menuItems ?? []).map((m) => ({ ...m, is_available: m.is_available ?? true }))}
      />
    </div>
  )
}
