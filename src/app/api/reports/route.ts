import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") ?? "today"
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const now = new Date()
  let from: Date
  let to: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  switch (period) {
    case "week":
      from = new Date(now)
      from.setDate(now.getDate() - 7)
      break
    case "month":
      from = new Date(now)
      from.setDate(now.getDate() - 30)
      break
    case "custom":
      from = fromParam ? new Date(fromParam) : new Date(now.setDate(now.getDate() - 7))
      to = toParam ? new Date(toParam) : new Date()
      break
    default: // today
      from = new Date()
      from.setHours(0, 0, 0, 0)
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, created_at, delivered_at, sent_to_kitchen_at, ready_at,
      waiter_id,
      profiles(name),
      order_items(
        quantity,
        menu_items(name, price)
      )
    `)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .in("status", ["delivered", "ready"])

  if (!orders) return NextResponse.json({ error: "Error fetching data" }, { status: 500 })

  // Calcular métricas
  let totalRevenue = 0
  const dishCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  const waiterStats: Record<string, { name: string; orders: number; revenue: number }> = {}
  const salesByDay: Record<string, { date: string; revenue: number; orders: number }> = {}

  for (const order of orders) {
    if (!order.created_at) continue
    const date = order.created_at.split("T")[0]
    if (!salesByDay[date]) salesByDay[date] = { date, revenue: 0, orders: 0 }
    salesByDay[date].orders++

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const waiterName = (order.profiles as any)?.name ?? "Unknown"
    if (!waiterStats[order.waiter_id]) {
      waiterStats[order.waiter_id] = { name: waiterName, orders: 0, revenue: 0 }
    }
    waiterStats[order.waiter_id].orders++

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of order.order_items as any[]) {
      const revenue = item.quantity * (item.menu_items?.price ?? 0)
      totalRevenue += revenue
      salesByDay[date].revenue += revenue
      waiterStats[order.waiter_id].revenue += revenue

      const name = item.menu_items?.name ?? "Unknown"
      if (!dishCounts[name]) dishCounts[name] = { name, count: 0, revenue: 0 }
      dishCounts[name].count += item.quantity
      dishCounts[name].revenue += revenue
    }
  }

  // Tiempo promedio de cocina
  const kitchenTimes = orders
    .filter((o) => o.sent_to_kitchen_at && o.ready_at)
    .map((o) => {
      const sent = new Date(o.sent_to_kitchen_at!).getTime()
      const ready = new Date(o.ready_at!).getTime()
      return (ready - sent) / 60000
    })

  const avgKitchenTimeMinutes =
    kitchenTimes.length > 0
      ? kitchenTimes.reduce((a, b) => a + b, 0) / kitchenTimes.length
      : 0

  return NextResponse.json({
    totalRevenue,
    totalOrders: orders.length,
    avgKitchenTimeMinutes: Math.round(avgKitchenTimeMinutes * 10) / 10,
    salesByDay: Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date)),
    topDishes: Object.values(dishCounts).sort((a, b) => b.count - a.count).slice(0, 10),
    waiterStats: Object.values(waiterStats).sort((a, b) => b.revenue - a.revenue),
  })
}
