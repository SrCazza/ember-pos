"use client"

import { useEffect, useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TableCard } from "./TableCard"
import { type TableStatus, type OrderStatus } from "@/types"

interface ActiveOrder {
  status: OrderStatus
  created_at: string
  waiter_name: string
}

interface TableWithOrder {
  id: string
  number: number
  capacity: number
  status: TableStatus
  activeOrder: ActiveOrder | null
}

export function TablesClient() {
  const [tables, setTables] = useState<TableWithOrder[]>([])

  const fetchTables = useCallback(async () => {
    const supabase = createClient()

    const [{ data: tablesData }, { data: activeOrders }] = await Promise.all([
      supabase.from("restaurant_tables").select("id, number, capacity, status").order("number"),
      supabase
        .from("orders")
        .select("table_id, status, created_at, profiles(name)")
        .in("status", ["pending", "in_kitchen", "ready"])
        .order("created_at", { ascending: false }),
    ])

    // Una orden activa por mesa (la más reciente)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderByTable = new Map<string, ActiveOrder>()
    for (const o of (activeOrders ?? []) as any[]) {
      if (!orderByTable.has(o.table_id)) {
        orderByTable.set(o.table_id, {
          status: o.status as OrderStatus,
          created_at: o.created_at,
          waiter_name: o.profiles?.name ?? "Camarero",
        })
      }
    }

    setTables(
      (tablesData ?? []).map((t) => ({
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status as TableStatus,
        activeOrder: orderByTable.get(t.id) ?? null,
      }))
    )
  }, [])

  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 5000)

    const supabase = createClient()
    const channel = supabase
      .channel("tables-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchTables())
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => fetchTables())
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchTables])

  const available = tables.filter((t) => t.status === "available").length
  const occupied = tables.filter((t) => t.status === "occupied").length

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-zinc-900">Mesas</h2>
        <p className="text-sm text-zinc-500">
          {available} libres · {occupied} ocupadas
        </p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            id={table.id}
            number={table.number}
            capacity={table.capacity}
            status={table.status}
            activeOrder={table.activeOrder}
          />
        ))}
      </div>
    </div>
  )
}
