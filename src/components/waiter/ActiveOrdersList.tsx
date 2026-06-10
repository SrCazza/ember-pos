"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type OrderStatus } from "@/types"
import { formatRelativeTime, formatDuration, formatCurrency, formatOrderNumber } from "@/lib/utils/formatters"
import { markOrderDelivered, markCategoryDelivered } from "@/lib/actions/orders"
import { getTableColor } from "@/lib/utils/table-colors"
import { ClipboardTextIcon } from "@phosphor-icons/react"

// ─── Active orders types ────────────────────────────────────────────────────

interface ActiveOrderItem {
  id: string
  quantity: number
  notes: string | null
  status: "pending" | "ready"
  category_id: string | null
  delivered_at: string | null
  name: string
  category_name: string
  category_icon: string
}

interface ActiveOrder {
  id: string
  order_number: number | null
  status: OrderStatus
  created_at: string
  notes: string | null
  table_number: number
  items: ActiveOrderItem[]
}

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryIcon: string
  items: ActiveOrderItem[]
  allReady: boolean
  allDelivered: boolean
  firstDeliveredAt: string | null
}

// ─── History types ───────────────────────────────────────────────────────────

interface HistoryOrderItem {
  quantity: number
  notes: string | null
  name: string
  price: number
}

interface HistoryOrder {
  id: string
  order_number: number | null
  status: OrderStatus
  created_at: string
  delivered_at: string | null
  payment_method: string | null
  notes: string | null
  table_number: number
  items: HistoryOrderItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupOrderByCategory(order: ActiveOrder): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>()
  for (const item of order.items) {
    const key = item.category_id ?? "uncategorized"
    if (!map.has(key)) {
      map.set(key, {
        categoryId: key,
        categoryName: item.category_name || "Sin categoría",
        categoryIcon: item.category_icon || "fork-knife",
        items: [],
        allReady: false,
        allDelivered: false,
        firstDeliveredAt: null,
      })
    }
    map.get(key)!.items.push(item)
  }
  for (const group of map.values()) {
    group.allReady = group.items.every((i) => i.status === "ready")
    group.allDelivered = group.items.every((i) => i.delivered_at !== null)
    if (group.allDelivered) {
      const times = group.items.map((i) => i.delivered_at!).sort()
      group.firstDeliveredAt = times[0]
    }
  }
  return Array.from(map.values())
}

function DeliveredTimer({ deliveredAt }: { deliveredAt: string }) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 1000)
  )
  useEffect(() => {
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 1000)),
      1000
    )
    return () => clearInterval(interval)
  }, [deliveredAt])
  return (
    <span className="text-xs text-emerald-600 font-medium">
      Llevadas hace {formatDuration(elapsed)}
    </span>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2)
  const orderDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (orderDay.getTime() === today.getTime()) return "Hoy"
  if (orderDay.getTime() === yesterday.getTime()) return "Ayer"
  if (orderDay.getTime() === twoDaysAgo.getTime()) return "Hace 2 días"
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" })
}

// ─── Detail modal ────────────────────────────────────────────────────────────

function HistoryOrderDetail({ order }: { order: HistoryOrder }) {
  const total = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-zinc-500">Mesa {order.table_number}</span>
        <StatusBadge status={order.status} />
        {order.payment_method && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
            {order.payment_method === "cash" ? "Efectivo" : "Tarjeta"}
          </span>
        )}
      </div>
      <div className="space-y-1 rounded-lg border border-zinc-200 overflow-hidden">
        {order.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 text-sm border-b border-zinc-100 last:border-0"
          >
            <div>
              <span className="font-semibold text-zinc-800 mr-1">{item.quantity}×</span>
              <span className="text-zinc-700">{item.name}</span>
              {item.notes && <span className="text-zinc-400 italic ml-2 text-xs">({item.notes})</span>}
            </div>
            <span className="text-zinc-500 shrink-0 ml-3">{formatCurrency(item.quantity * item.price)}</span>
          </div>
        ))}
      </div>
      {order.notes && (
        <p className="text-xs text-zinc-400 italic">Nota de la orden: {order.notes}</p>
      )}
      <div className="flex justify-between pt-1 border-t border-zinc-200">
        <span className="text-sm text-zinc-500">Total</span>
        <span className="font-bold text-zinc-900">{formatCurrency(total)}</span>
      </div>
      {order.delivered_at && (
        <p className="text-xs text-zinc-400">
          Entregada a las {formatTime(order.delivered_at)}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveOrdersList({ userId }: { userId: string }) {
  const [view, setView] = useState<"active" | "history">("active")

  // Active view state
  const [orders, setOrders] = useState<ActiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [delivering, setDelivering] = useState<Set<string>>(new Set())
  const [deliveringCategory, setDeliveringCategory] = useState<Set<string>>(new Set())
  const deliveringRef = useRef<Set<string>>(new Set())

  // History view state
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<HistoryOrder | null>(null)
  const historyFetchedRef = useRef(false)

  useEffect(() => {
    deliveringRef.current = delivering
  }, [delivering])

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select(`
        id, status, created_at, notes,
        restaurant_tables(number),
        order_items(
          id, quantity, notes, status, category_id, delivered_at,
          menu_items(name),
          menu_categories(name, icon)
        )
      `)
      .eq("waiter_id", userId)
      .in("status", ["pending", "in_kitchen", "ready"])
      .order("created_at", { ascending: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOrders((data as any[]).filter((o: any) => !deliveringRef.current.has(o.id)).map((o: any) => ({
        id: o.id,
        order_number: o.order_number ?? null,
        status: o.status as OrderStatus,
        created_at: o.created_at ?? "",
        notes: o.notes,
        table_number: o.restaurant_tables?.number ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (o.order_items as any[]).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status as "pending" | "ready",
          category_id: item.category_id ?? null,
          delivered_at: item.delivered_at ?? null,
          name: item.menu_items?.name ?? "",
          category_name: (item.menu_categories as { name: string } | null)?.name ?? "",
          category_icon: (item.menu_categories as { icon: string } | null)?.icon ?? "fork-knife",
        })),
      })))
    }
    setLoading(false)
  }, [userId])

  const fetchHistory = useCallback(async () => {
    if (historyFetchedRef.current) return
    historyFetchedRef.current = true
    setHistoryLoading(true)
    const supabase = createClient()
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("orders")
      .select(`
        id, order_number, status, created_at, delivered_at, payment_method, notes,
        restaurant_tables(number),
        order_items(quantity, notes, menu_items(name, price))
      `)
      .eq("waiter_id", userId)
      .in("status", ["delivered", "cancelled"])
      .gte("created_at", twoDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHistoryOrders((data as any[]).map((o: any) => ({
        id: o.id,
        order_number: o.order_number ?? null,
        status: o.status as OrderStatus,
        created_at: o.created_at ?? "",
        delivered_at: o.delivered_at ?? null,
        payment_method: o.payment_method ?? null,
        notes: o.notes ?? null,
        table_number: o.restaurant_tables?.number ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (o.order_items as any[]).map((item: any) => ({
          quantity: item.quantity,
          notes: item.notes ?? null,
          name: item.menu_items?.name ?? "",
          price: item.menu_items?.price ?? 0,
        })),
      })))
    }
    setHistoryLoading(false)
  }, [userId])

  useEffect(() => {
    fetchOrders()
    const pollInterval = setInterval(fetchOrders, 5000)
    const supabase = createClient()
    const channel = supabase
      .channel("waiter-active-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchOrders())
      .subscribe()
    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  useEffect(() => {
    if (view === "history") fetchHistory()
  }, [view, fetchHistory])

  async function handleDeliver(orderId: string, paymentMethod: "cash" | "card") {
    setDelivering((prev) => new Set([...prev, orderId]))
    const result = await markOrderDelivered(orderId, paymentMethod)
    if (!result.error) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      setPayingOrderId(null)
      historyFetchedRef.current = false
    }
    setDelivering((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }

  async function handleDeliverCategory(orderId: string, categoryId: string) {
    const key = `${orderId}:${categoryId}`
    setDeliveringCategory((prev) => new Set([...prev, key]))
    await markCategoryDelivered(orderId, categoryId)
    setDeliveringCategory((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    fetchOrders()
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Mis órdenes activas</h2>
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const CARD_STYLE: Partial<Record<OrderStatus, string>> = {
    pending:    "border-amber-300 bg-amber-50/60",
    in_kitchen: "border-blue-300 bg-blue-50/60",
    ready:      "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100",
  }

  const HISTORY_CARD_BORDER: Partial<Record<OrderStatus, string>> = {
    delivered: "border-l-emerald-400",
    cancelled: "border-l-red-300",
  }

  const TIME_STYLE: Partial<Record<OrderStatus, string>> = {
    pending:    "text-amber-600",
    in_kitchen: "text-blue-600",
    ready:      "text-emerald-600",
  }

  // ── Group history by day ──
  const historyByDay = historyOrders.reduce<Record<string, HistoryOrder[]>>((acc, order) => {
    const label = dayLabel(order.created_at)
    if (!acc[label]) acc[label] = []
    acc[label].push(order)
    return acc
  }, {})
  const historyDays = Object.keys(historyByDay)

  return (
    <div className="p-4 space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Mis órdenes</h2>
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          <button
            onClick={() => setView("active")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "active"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Activas {orders.length > 0 && <span className="ml-1 text-emerald-600">({orders.length})</span>}
          </button>
          <button
            onClick={() => setView("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "history"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* ── ACTIVE VIEW ── */}
      {view === "active" && (
        <>
          {orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                <ClipboardTextIcon className="w-8 h-8 text-zinc-400" weight="duotone" />
              </div>
              <p className="text-zinc-700 font-medium">Sin órdenes activas</p>
              <p className="text-sm text-zinc-400 mt-1">Las órdenes que envíes a cocina aparecerán aquí</p>
            </div>
          ) : (
            orders.map((order) => {
              const hasCategories = order.items.some((i) => i.category_id !== null)
              const groups = hasCategories ? groupOrderByCategory(order) : []
              const allGroupsDelivered = hasCategories && groups.every((g) => g.allDelivered)
              const someGroupReady = hasCategories && groups.some((g) => g.allReady && !g.allDelivered)

              return (
                <div
                  key={order.id}
                  className={`rounded-xl border-2 border-l-4 p-4 space-y-3 transition-colors ${CARD_STYLE[order.status] ?? "border-zinc-200 bg-white"}`}
                  style={{ borderLeftColor: getTableColor(order.table_number) }}
                >
                  {/* Encabezado */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 text-base">Mesa {order.table_number}</span>
                        {order.order_number && (
                          <span className="text-xs font-mono text-zinc-400">{formatOrderNumber(order.order_number)}</span>
                        )}
                      </div>
                      <p className={`text-sm font-medium mt-0.5 ${TIME_STYLE[order.status] ?? "text-zinc-500"}`}>
                        {formatRelativeTime(order.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Con categorías: vista escalonada */}
                  {hasCategories ? (
                    <div className="space-y-2.5">
                      {groups.map((group) => {
                        const catKey = `${order.id}:${group.categoryId}`
                        const isDeliveringCat = deliveringCategory.has(catKey)
                        return (
                          <div key={group.categoryId} className="rounded-lg bg-white/60 border border-zinc-200/80 overflow-hidden">
                            {/* Group header */}
                            <div className={`flex items-center justify-between px-3 py-2 border-b border-zinc-100 ${group.allDelivered ? "bg-emerald-50/50" : "bg-white/40"}`}>
                              <div className="flex items-center gap-1.5">
                                <CategoryIcon
                                  icon={group.categoryIcon}
                                  className={`w-3.5 h-3.5 ${group.allDelivered ? "text-emerald-500" : group.allReady ? "text-emerald-600" : "text-zinc-400"}`}
                                />
                                <span className="text-xs font-semibold text-zinc-600">{group.categoryName}</span>
                              </div>
                              <div>
                                {group.allDelivered && group.firstDeliveredAt ? (
                                  <DeliveredTimer deliveredAt={group.firstDeliveredAt} />
                                ) : group.allReady ? (
                                  <span className="text-xs font-semibold text-emerald-600">Listo en cocina</span>
                                ) : (
                                  <span className="text-xs text-blue-500">En cocina</span>
                                )}
                              </div>
                            </div>

                            {/* Items */}
                            <div className="px-3 py-2 space-y-1">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      item.delivered_at ? "bg-emerald-500" : item.status === "ready" ? "bg-emerald-400" : "bg-zinc-300"
                                    }`}
                                  />
                                  <span className={`${item.delivered_at ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                                    {item.quantity}× {item.name}
                                  </span>
                                  {item.notes && (
                                    <span className="text-zinc-400 text-xs">({item.notes})</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Llevar a mesa — per category */}
                            {group.allReady && !group.allDelivered && (
                              <div className="px-3 pb-3">
                                <button
                                  onClick={() => handleDeliverCategory(order.id, group.categoryId)}
                                  disabled={isDeliveringCat || delivering.has(order.id)}
                                  className="w-full min-h-[44px] rounded-lg border-2 border-emerald-500 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                                >
                                  {isDeliveringCat ? "Registrando..." : `Llevar ${group.categoryName} a mesa`}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* Sin categorías: vista plana */
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.status === "ready" ? "bg-emerald-500" : "bg-zinc-300"
                            }`}
                          />
                          <span className="text-zinc-700">{item.quantity}× {item.name}</span>
                          {item.notes && <span className="text-zinc-400 text-xs">({item.notes})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {order.notes && (
                    <p className="text-xs text-zinc-400 italic">Nota: {order.notes}</p>
                  )}

                  {/* Acciones de entrega */}
                  <div className="pt-1 space-y-2">
                    {hasCategories && someGroupReady && !allGroupsDelivered && (
                      <button
                        onClick={() => setPayingOrderId(order.id)}
                        disabled={delivering.has(order.id)}
                        className="w-full min-h-[48px] rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                      >
                        Llevar todo y cobrar
                      </button>
                    )}

                    {((hasCategories && allGroupsDelivered) || (!hasCategories && order.status === "ready")) && payingOrderId !== order.id && (
                      <button
                        onClick={() => setPayingOrderId(order.id)}
                        disabled={delivering.has(order.id)}
                        className="w-full min-h-[48px] rounded-lg border-2 border-emerald-500 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                      >
                        Registrar pago
                      </button>
                    )}

                    {payingOrderId === order.id && (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500 font-medium">Método de pago:</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeliver(order.id, "cash")}
                            disabled={delivering.has(order.id)}
                            className="flex-1 min-h-[48px] rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                          >
                            Efectivo
                          </button>
                          <button
                            onClick={() => handleDeliver(order.id, "card")}
                            disabled={delivering.has(order.id)}
                            className="flex-1 min-h-[48px] rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                          >
                            Tarjeta
                          </button>
                        </div>
                        <button
                          onClick={() => setPayingOrderId(null)}
                          disabled={delivering.has(order.id)}
                          className="w-full text-xs text-zinc-400 hover:text-zinc-600 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === "history" && (
        <>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />)}
            </div>
          ) : historyDays.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                <ClipboardTextIcon className="w-8 h-8 text-zinc-400" weight="duotone" />
              </div>
              <p className="text-zinc-700 font-medium">Sin historial</p>
              <p className="text-sm text-zinc-400 mt-1">Aquí aparecerán las órdenes entregadas de los últimos 3 días</p>
            </div>
          ) : (
            historyDays.map((day) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3 mt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{day}</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="space-y-2.5">
                  {historyByDay[day].map((order) => {
                    const total = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
                    const borderCls = HISTORY_CARD_BORDER[order.status] ?? "border-l-zinc-300"
                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedHistory(order)}
                        className={`w-full text-left rounded-xl border border-zinc-200 border-l-4 ${borderCls} bg-white px-4 py-3.5 hover:bg-zinc-50 shadow-md hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">Mesa {order.table_number}</span>
                              {order.order_number && (
                                <span className="text-xs font-mono text-zinc-400">{formatOrderNumber(order.order_number)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <StatusBadge status={order.status} />
                              {order.payment_method && (
                                <span className="text-xs text-zinc-400">
                                  {order.payment_method === "cash" ? "Efectivo" : "Tarjeta"}
                                </span>
                              )}
                              <span className="text-xs text-zinc-300">·</span>
                              <span className="text-xs text-zinc-400">{order.items.length} ítem{order.items.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-zinc-800">{formatCurrency(total)}</span>
                            <p className="text-xs text-zinc-400 mt-0.5">{formatTime(order.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Detail modal for history */}
      <Dialog open={!!selectedHistory} onOpenChange={(o) => !o && setSelectedHistory(null)}>
        <DialogContent className="max-w-sm bg-white border-zinc-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              {selectedHistory ? formatOrderNumber(selectedHistory.order_number) : ""} — Mesa {selectedHistory?.table_number}
            </DialogTitle>
          </DialogHeader>
          {selectedHistory && <HistoryOrderDetail order={selectedHistory} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
