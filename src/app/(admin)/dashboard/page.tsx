import { createClient } from "@/lib/supabase/server"
import { LiveDashboard } from "@/components/admin/LiveDashboard"
import { PageHeader } from "@/components/shared/PageHeader"
import { type TableStatus, type OrderStatus } from "@/types"

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "in_kitchen", "ready"])

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, number, status, capacity")
    .order("number")

  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id, status, created_at,
      restaurant_tables(number),
      profiles(name),
      order_items(quantity, menu_items(price))
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  type TableRow = { id: string; number: number; status: string; capacity: number }
  type RecentOrder = {
    id: string
    status: string
    created_at: string
    restaurant_tables: { number: number } | null
    profiles: { name: string } | null
    order_items: { quantity: number; menu_items: { price: number } | null }[]
  }

  const typedTables = (tables as TableRow[] | null) ?? []
  const typedOrders = (recentOrders as RecentOrder[] | null) ?? []

  const occupiedTables = typedTables.filter((t) => t.status === "occupied").length

  const orders = typedOrders.map((o) => {
    const total = o.order_items
      ?.reduce((sum, item) => sum + item.quantity * (item.menu_items?.price ?? 0), 0) ?? 0
    return {
      id: o.id,
      status: o.status as OrderStatus,
      created_at: o.created_at,
      tableNumber: o.restaurant_tables?.number ?? 0,
      waiterName: o.profiles?.name ?? "",
      total,
    }
  })

  const initialData = {
    activeOrders: activeOrders ?? 0,
    todayRevenue: 0,
    occupiedTables,
    avgKitchenMinutes: 0,
    tables: typedTables.map((t) => ({ ...t, status: t.status as TableStatus })),
    recentOrders: orders,
    ordersByHour: [] as { hour: string; orders: number; isCurrent: boolean }[],
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Operaciones en tiempo real" variant="dark" />
      <LiveDashboard initial={initialData} />
    </div>
  )
}
