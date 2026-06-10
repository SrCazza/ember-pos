"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { markOrderPickedUp } from "@/lib/actions/orders"
import { OrderCard } from "./OrderCard"
import { StationFilterBar } from "./StationFilterBar"
import { EmptyState } from "@/components/shared/EmptyState"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { formatDuration, formatOrderNumber } from "@/lib/utils/formatters"
import { ChefHatIcon, ClockCountdownIcon, UserIcon } from "@phosphor-icons/react"

interface Station {
  id: string
  name: string
  color: string
}

interface KitchenOrder {
  id: string
  order_number: number | null
  status: "in_kitchen" | "ready"
  is_addition: boolean
  table_number: number
  waiter_name: string
  waiter_email: string | null
  created_at: string
  sent_to_kitchen_at: string | null
  ready_at: string | null
  picked_up_at: string | null
  items: {
    id: string
    name: string
    quantity: number
    notes: string | null
    status: "pending" | "ready"
    station_id: string
    category_id: string
    category_name: string
    category_icon: string
    delivered_at: string | null
  }[]
}

interface PickedUpOrder {
  id: string
  order_number: number | null
  table_number: number
  waiter_name: string
  sent_to_kitchen_at: string | null
  ready_at: string | null
  picked_up_at: string
  items: { id: string; name: string; quantity: number; notes: string | null; category_name: string; category_icon: string }[]
}

interface Toast {
  id: string
  tableNumber: number
}

interface KitchenDisplayProps {
  stations: Station[]
}

function playKitchenDing() {
  try {
    const ctx = new AudioContext()
    const play = (freq: number, start: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.4)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.4)
    }
    play(880, 0)
    play(1100, 0.18)
  } catch {
    // Sin audio disponible
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

function prepSeconds(sent: string | null, ready: string | null): number | null {
  if (!sent || !ready) return null
  return Math.floor((new Date(ready).getTime() - new Date(sent).getTime()) / 1000)
}

const COLUMN_COLORS = {
  queue:     { hex: "#6366F1", bg: "bg-indigo-600",  text: "text-indigo-400",  border: "border-indigo-800/40",  headerBg: "bg-indigo-950/60" },
  preparing: { hex: "#F59E0B", bg: "bg-amber-500",   text: "text-amber-400",   border: "border-amber-800/40",   headerBg: "bg-amber-950/60"  },
  ready:     { hex: "#059669", bg: "bg-emerald-600", text: "text-emerald-400", border: "border-emerald-800/40", headerBg: "bg-emerald-950/60" },
} as const

type Column = keyof typeof COLUMN_COLORS

interface KanbanColumnProps {
  column: Column
  title: string
  count: number
  children: React.ReactNode
}

function KanbanColumn({ column, title, count, children }: KanbanColumnProps) {
  const c = COLUMN_COLORS[column]
  return (
    <div className={`flex flex-col min-h-0 rounded-2xl border ${c.border} overflow-hidden`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 shrink-0 ${c.headerBg}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
        <span className={`font-bold text-sm uppercase tracking-wider ${c.text}`}>{title}</span>
        <span className={`ml-auto text-xs font-bold w-6 h-6 rounded-full ${c.bg} text-white flex items-center justify-center`}>
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-900/60">
        {children}
      </div>
    </div>
  )
}

function PickedUpCard({ order }: { order: PickedUpOrder }) {
  const secs = prepSeconds(order.sent_to_kitchen_at, order.ready_at)

  // Group items by category
  const byCategory = order.items.reduce<Record<string, typeof order.items>>((acc, item) => {
    const key = item.category_name || "Sin categoría"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const categoryKeys = Object.keys(byCategory)

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-zinc-200 tabular-nums leading-none">{order.table_number}</span>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 leading-none">Mesa</span>
            {order.order_number && (
              <span className="text-[10px] font-mono text-zinc-600 leading-none mt-0.5">{formatOrderNumber(order.order_number)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {secs !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-700/50">
              <ClockCountdownIcon className="w-3 h-3 text-zinc-500" />
              <span className="text-xs font-mono text-zinc-400">{formatDuration(secs)}</span>
            </div>
          )}
          <span className="text-[10px] text-zinc-600">{formatTime(order.picked_up_at)}</span>
        </div>
      </div>

      {/* Waiter */}
      <div className="flex items-center gap-1 px-3 pt-2">
        <UserIcon className="w-3 h-3 text-zinc-600" weight="regular" />
        <span className="text-xs text-zinc-600">{order.waiter_name}</span>
      </div>

      {/* Items */}
      <div className="px-3 pb-3 pt-1 space-y-1.5">
        {categoryKeys.length > 1 ? (
          categoryKeys.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-1 mb-0.5">
                <CategoryIcon icon={byCategory[cat][0].category_icon} className="w-2.5 h-2.5 text-zinc-600" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{cat}</span>
              </div>
              {byCategory[cat].map((item) => (
                <p key={item.id} className="text-xs text-zinc-500 leading-relaxed pl-3.5">
                  <span className="font-semibold text-zinc-400">{item.quantity}×</span> {item.name}
                  {item.notes && <span className="text-zinc-600 italic"> · {item.notes}</span>}
                </p>
              ))}
            </div>
          ))
        ) : (
          order.items.map((item) => (
            <p key={item.id} className="text-xs text-zinc-500 leading-relaxed">
              <span className="font-semibold text-zinc-400">{item.quantity}×</span> {item.name}
              {item.notes && <span className="text-zinc-600 italic"> · {item.notes}</span>}
            </p>
          ))
        )}
      </div>
    </div>
  )
}

export function KitchenDisplay({ stations }: KitchenDisplayProps) {
  const [view, setView] = useState<"kitchen" | "history">("kitchen")
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [activeStation, setActiveStation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [startedOrders, setStartedOrders] = useState<Set<string>>(new Set())
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])

  // History state
  const [pickedUpOrders, setPickedUpOrders] = useState<PickedUpOrder[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const historyFetchedRef = useRef(false)

  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const initialLoadDoneRef = useRef(false)
  // Track orders pending pickup locally to prevent race-condition re-appearance
  const pendingPickupRef = useRef<Set<string>>(new Set())

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, sent_to_kitchen_at, ready_at, is_addition,
        restaurant_tables(number),
        profiles(name, email),
        order_items(
          id, quantity, notes, status, station_id, category_id, delivered_at,
          menu_items(name),
          menu_categories(name, icon)
        )
      `)
      .in("status", ["in_kitchen", "ready"])
      .order("sent_to_kitchen_at", { ascending: true, nullsFirst: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: KitchenOrder[] = (data as any[])
        .map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? null,
          status: o.status as "in_kitchen" | "ready",
          is_addition: o.is_addition ?? false,
          created_at: o.created_at,
          sent_to_kitchen_at: o.sent_to_kitchen_at,
          ready_at: o.ready_at ?? null,
          picked_up_at: o.picked_up_at ?? null,
          table_number: o.restaurant_tables?.number ?? 0,
          waiter_name: o.profiles?.name ?? "Camarero",
          waiter_email: o.profiles?.email ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: (o.order_items as any[]).map((item: any) => ({
            id: item.id,
            name: item.menu_items?.name ?? "",
            quantity: item.quantity,
            notes: item.notes,
            status: item.status as "pending" | "ready",
            station_id: item.station_id,
            category_id: item.category_id ?? "",
            category_name: (item.menu_categories as { name: string } | null)?.name ?? "",
            category_icon: (item.menu_categories as { icon: string } | null)?.icon ?? "fork-knife",
            delivered_at: item.delivered_at ?? null,
          })),
        }))
        // Exclude orders picked up in DB OR pending pickup locally (prevents race-condition re-appearance)
        .filter((o) => o.picked_up_at === null && !pendingPickupRef.current.has(o.id))

      // Notifications for new in_kitchen orders
      if (!initialLoadDoneRef.current) {
        knownOrderIdsRef.current = new Set(mapped.filter((o) => o.status === "in_kitchen").map((o) => o.id))
        initialLoadDoneRef.current = true
      } else {
        const newIds = mapped
          .filter((o) => o.status === "in_kitchen")
          .map((o) => o.id)
          .filter((id) => !knownOrderIdsRef.current.has(id))

        if (newIds.length > 0) {
          playKitchenDing()
          const newOrders = mapped.filter((o) => newIds.includes(o.id))
          setToasts((prev) => [...prev, ...newOrders.map((o) => ({ id: o.id, tableNumber: o.table_number }))])
          setNewOrderIds((prev) => new Set([...prev, ...newIds]))
          setTimeout(() => {
            setNewOrderIds((prev) => { const n = new Set(prev); newIds.forEach((id) => n.delete(id)); return n })
          }, 1200)
          newIds.forEach((id) => setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000))
        }
        knownOrderIdsRef.current = new Set(mapped.filter((o) => o.status === "in_kitchen").map((o) => o.id))
      }

      setOrders(mapped)
    }
    setLoading(false)
  }, [])

  const fetchHistory = useCallback(async () => {
    if (historyFetchedRef.current) return
    historyFetchedRef.current = true
    setHistoryLoading(true)

    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("orders")
      .select(`
        id, order_number, sent_to_kitchen_at, ready_at, picked_up_at,
        restaurant_tables(number),
        profiles(name),
        order_items(
          id, quantity, notes,
          menu_items(name),
          menu_categories(name, icon)
        )
      `)
      .not("picked_up_at", "is", null)
      .gte("created_at", today.toISOString())
      .order("picked_up_at", { ascending: false })
      .limit(100)

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPickedUpOrders((data as any[]).map((o: any) => ({
        id: o.id,
        order_number: o.order_number ?? null,
        table_number: o.restaurant_tables?.number ?? 0,
        waiter_name: o.profiles?.name ?? "Camarero",
        sent_to_kitchen_at: o.sent_to_kitchen_at ?? null,
        ready_at: o.ready_at ?? null,
        picked_up_at: o.picked_up_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (o.order_items as any[]).map((item: any) => ({
          id: item.id,
          name: item.menu_items?.name ?? "",
          quantity: item.quantity,
          notes: item.notes ?? null,
          category_name: (item.menu_categories as { name: string } | null)?.name ?? "",
          category_icon: (item.menu_categories as { icon: string } | null)?.icon ?? "fork-knife",
        })),
      })))
    }
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const pollInterval = setInterval(fetchOrders, 5000)
    const supabase = createClient()
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders()
        // Refresh history too if it was already loaded
        if (historyFetchedRef.current) {
          historyFetchedRef.current = false
          fetchHistory()
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchOrders())
      .subscribe()
    return () => { clearInterval(pollInterval); supabase.removeChannel(channel) }
  }, [fetchOrders, fetchHistory])

  useEffect(() => {
    if (view === "history") fetchHistory()
  }, [view, fetchHistory])

  const handleOrderReady = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "ready" as const } : o))
    setStartedOrders((prev) => { const n = new Set(prev); n.delete(orderId); return n })
  }, [])

  const handleStart = useCallback((orderId: string) => {
    setStartedOrders((prev) => new Set([...prev, orderId]))
  }, [])

  const handlePickedUp = useCallback(async (orderId: string) => {
    // Register locally BEFORE the async call to block fetchOrders from re-adding it
    pendingPickupRef.current = new Set([...pendingPickupRef.current, orderId])
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    await markOrderPickedUp(orderId)
    // After DB confirms, we can keep it in pendingPickup — fetchOrders will now filter by picked_up_at from DB
    // Invalidate history so it refreshes on next open
    historyFetchedRef.current = false
  }, [])

  // Aplicar filtro de estación
  const withStationFilter = (order: KitchenOrder) => ({
    ...order,
    items: activeStation ? order.items.filter((i) => i.station_id === activeStation) : order.items,
  })

  const queueOrders = orders
    .filter((o) => o.status === "in_kitchen" && !startedOrders.has(o.id) && !o.items.some((i) => i.status === "ready"))
    .map(withStationFilter)
    .filter((o) => o.items.length > 0)

  const preparingOrders = orders
    .filter((o) => o.status === "in_kitchen" && (startedOrders.has(o.id) || o.items.some((i) => i.status === "ready")))
    .map(withStationFilter)
    .filter((o) => o.items.length > 0)

  const readyOrders = orders
    .filter((o) => o.status === "ready")
    .map(withStationFilter)
    .filter((o) => o.items.length > 0)

  const totalActive = queueOrders.length + preparingOrders.length

  return (
    <div className="flex flex-col h-full p-4 gap-4 bg-zinc-900">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-slide-in-down bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[220px]">
            <ChefHatIcon className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Nueva orden — Mesa {toast.tableNumber}</span>
          </div>
        ))}
      </div>

      {/* Top bar: station filter + view toggle */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex-1 min-w-0">
          <StationFilterBar stations={stations} activeStation={activeStation} onSelect={setActiveStation} />
        </div>
        <div className="flex gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setView("kitchen")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              view === "kitchen"
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Cocina
          </button>
          <button
            onClick={() => setView("history")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              view === "history"
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Recogidas
            {pickedUpOrders.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-600 text-zinc-300">
                {pickedUpOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── KITCHEN VIEW ── */}
      {view === "kitchen" && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-full min-h-64 bg-zinc-800 rounded-2xl border border-zinc-700 animate-pulse" />
            ))}
          </div>
        ) : totalActive === 0 && readyOrders.length === 0 ? (
          <EmptyState
            icon={activeStation ? "🔍" : (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ChefHatIcon className="w-8 h-8 text-emerald-500" weight="duotone" />
              </div>
            )}
            title={activeStation ? "Sin órdenes para esta estación" : "La cocina está al día"}
            description={activeStation ? "No hay pedidos activos en esta estación ahora mismo" : "No hay órdenes pendientes ni en preparación"}
            variant="dark"
            className="flex-1"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
            <KanbanColumn column="queue" title="En cola" count={queueOrders.length}>
              {queueOrders.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">Sin órdenes en cola</p>
              ) : (
                queueOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    orderNumber={order.order_number}
                    tableNumber={order.table_number}
                    waiterName={order.waiter_name}
                    waiterEmail={order.waiter_email}
                    createdAt={order.created_at}
                    sentToKitchenAt={order.sent_to_kitchen_at}
                    column="queue"
                    isNew={newOrderIds.has(order.id)}
                    isAddition={order.is_addition}
                    items={order.items}
                    onOrderReady={() => handleOrderReady(order.id)}
                    onStart={() => handleStart(order.id)}
                  />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn column="preparing" title="Preparando" count={preparingOrders.length}>
              {preparingOrders.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">Ninguna en preparación</p>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    orderNumber={order.order_number}
                    tableNumber={order.table_number}
                    waiterName={order.waiter_name}
                    waiterEmail={order.waiter_email}
                    createdAt={order.created_at}
                    sentToKitchenAt={order.sent_to_kitchen_at}
                    column="preparing"
                    isNew={newOrderIds.has(order.id)}
                    isAddition={order.is_addition}
                    items={order.items}
                    allItemsReady={orders
                      .find((o) => o.id === order.id)
                      ?.items.every((i) => i.status === "ready" || !!i.delivered_at) ?? false
                    }
                    onOrderReady={() => handleOrderReady(order.id)}
                  />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn column="ready" title="Listas" count={readyOrders.length}>
              {readyOrders.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">Ninguna lista aún</p>
              ) : (
                readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    orderNumber={order.order_number}
                    tableNumber={order.table_number}
                    waiterName={order.waiter_name}
                    waiterEmail={order.waiter_email}
                    createdAt={order.created_at}
                    sentToKitchenAt={order.sent_to_kitchen_at}
                    readyAt={order.ready_at}
                    column="ready"
                    isAddition={order.is_addition}
                    items={order.items}
                    onOrderReady={() => handleOrderReady(order.id)}
                    onPickedUp={() => handlePickedUp(order.id)}
                  />
                ))
              )}
            </KanbanColumn>
          </div>
        )
      )}

      {/* ── HISTORY VIEW ── */}
      {view === "history" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {historyLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pickedUpOrders.length === 0 ? (
            <EmptyState
              icon={
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <ClockCountdownIcon className="w-8 h-8 text-zinc-500" weight="duotone" />
                </div>
              }
              title="Sin órdenes recogidas hoy"
              description="Las órdenes que el camarero marque como recogidas aparecerán aquí"
              variant="dark"
              className="flex-1"
            />
          ) : (
            <>
              <p className="text-xs text-zinc-600 mb-3">
                {pickedUpOrders.length} orden{pickedUpOrders.length !== 1 ? "es" : ""} recogida{pickedUpOrders.length !== 1 ? "s" : ""} hoy
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pickedUpOrders.map((order) => (
                  <PickedUpCard key={order.id} order={order} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
