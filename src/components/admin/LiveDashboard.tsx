"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { KPICard } from "./KPICard"
import { TableStatusMap } from "./TableStatusMap"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { type OrderStatus, type TableStatus } from "@/types"
import { formatCurrency, formatRelativeTime } from "@/lib/utils/formatters"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { FireIcon, ArmchairIcon, CalendarCheckIcon, CurrencyDollarIcon } from "@phosphor-icons/react"

interface DashboardData {
  activeOrders: number
  todayRevenue: number
  occupiedTables: number
  avgKitchenMinutes: number
  tables: { id: string; number: number; status: TableStatus; capacity: number }[]
  recentOrders: {
    id: string
    status: OrderStatus
    created_at: string
    tableNumber: number
    waiterName: string
    total: number
  }[]
  ordersByHour: { hour: string; orders: number; isCurrent: boolean }[]
}

export function LiveDashboard({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState(initial)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      { count: activeOrders },
      { data: todayOrders },
      { data: tables },
      { data: recentOrders },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "in_kitchen", "ready"]),
      supabase
        .from("orders")
        .select("id, created_at")
        .gte("created_at", today.toISOString()),
      supabase
        .from("restaurant_tables")
        .select("id, number, status, capacity")
        .order("number"),
      supabase
        .from("orders")
        .select(`
          id, status, created_at,
          restaurant_tables(number),
          profiles(name),
          order_items(quantity, menu_items(price))
        `)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    const occupiedTables = tables?.filter((t) => t.status === "occupied").length ?? 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = (recentOrders ?? []).map((o: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const total = (o.order_items as any[])
        ?.reduce((sum: number, item: any) => sum + item.quantity * (item.menu_items?.price ?? 0), 0) ?? 0
      return {
        id: o.id,
        status: o.status as OrderStatus,
        created_at: o.created_at,
        tableNumber: o.restaurant_tables?.number ?? 0,
        waiterName: o.profiles?.name ?? "",
        total,
      }
    })

    // Agrupar órdenes de hoy por hora (10h–23h)
    const currentHour = new Date().getHours()
    const hourBuckets: Record<number, number> = {}
    for (const o of (todayOrders ?? []) as { id: string; created_at: string }[]) {
      const h = new Date(o.created_at).getHours()
      hourBuckets[h] = (hourBuckets[h] ?? 0) + 1
    }
    const ordersByHour = Array.from({ length: 14 }, (_, i) => {
      const h = i + 10
      return { hour: `${h}h`, orders: hourBuckets[h] ?? 0, isCurrent: h === currentHour }
    })

    setData({
      activeOrders: activeOrders ?? 0,
      todayRevenue: todayOrders?.length ?? 0,
      occupiedTables,
      avgKitchenMinutes: 0,
      tables: (tables ?? []).map((t) => ({ ...t, status: t.status as TableStatus })),
      recentOrders: orders,
      ordersByHour,
    })
  }, [])

  useEffect(() => {
    fetchData()
    const supabase = createClient()
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Órdenes activas" value={data.activeOrders} icon={FireIcon} iconBg="bg-orange-500/10" iconColor="text-orange-400" />
        <KPICard title="Mesas ocupadas" value={`${data.occupiedTables}/${data.tables.length}`} icon={ArmchairIcon} iconBg="bg-zinc-800" iconColor="text-zinc-400" />
        <KPICard title="Órdenes hoy" value={data.todayRevenue} icon={CalendarCheckIcon} iconBg="bg-blue-500/10" iconColor="text-blue-400" />
        <KPICard title="Revenue estimado" value={formatCurrency(data.recentOrders.reduce((s, o) => s + o.total, 0))} icon={CurrencyDollarIcon} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
      </div>

      {/* Mapa de mesas */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="font-semibold text-zinc-100 mb-4">Estado de mesas</h3>
        <TableStatusMap tables={data.tables} />
      </div>

      {/* Órdenes por hora */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-zinc-100">Órdenes por hora — hoy</h3>
          <p className="text-xs text-zinc-600 mt-0.5">Volumen de órdenes creadas en cada hora del servicio</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.ordersByHour} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#71717a" }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [v, "Órdenes"]}
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#e4e4e7" }}
            />
            <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
              {data.ordersByHour.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isCurrent ? "#10b981" : "#3b82f6"}
                  fillOpacity={entry.isCurrent ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-zinc-600 mt-2">
          <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />hora actual
          <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 ml-3 mr-1 opacity-65" />hora pasada
        </p>
      </div>

      {/* Órdenes recientes */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="font-semibold text-zinc-100 mb-4">Órdenes recientes</h3>
        <div className="space-y-0">
          {data.recentOrders.map((order) => (
            <div key={order.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 -mx-2 px-2 rounded transition-colors">
              <span className="text-sm font-medium text-zinc-300 w-16 shrink-0">
                Mesa {order.tableNumber}
              </span>
              <span className="text-sm text-zinc-600 flex-1 truncate">{order.waiterName}</span>
              <StatusBadge status={order.status} />
              <span className="text-xs text-zinc-600 shrink-0">
                {formatRelativeTime(order.created_at)}
              </span>
            </div>
          ))}
          {data.recentOrders.length === 0 && (
            <p className="text-sm text-zinc-600 py-4 text-center">Sin órdenes aún</p>
          )}
        </div>
      </div>
    </div>
  )
}
