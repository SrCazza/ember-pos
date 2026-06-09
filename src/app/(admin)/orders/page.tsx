import { createClient } from "@/lib/supabase/server"
import { OrderHistoryClient } from "@/components/admin/OrderHistoryClient"
import { PageHeader } from "@/components/shared/PageHeader"

export default async function OrdersPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("orders")
    .select(`
      id, order_number, status, created_at, sent_to_kitchen_at, ready_at, delivered_at,
      payment_method, notes,
      restaurant_tables(number),
      profiles(name),
      order_items(quantity, notes, status, menu_items(name, price))
    `)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de órdenes"
        description="Todas las órdenes del restaurante con detalle completo"
        variant="dark"
      />
      <OrderHistoryClient initialOrders={data ?? []} />
    </div>
  )
}
