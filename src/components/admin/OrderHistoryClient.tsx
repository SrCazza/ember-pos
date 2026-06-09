"use client"

import { useState, useCallback } from "react"
import { endOfDay } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/admin/ExportButton"
import { formatCurrency, formatOrderNumber } from "@/lib/utils/formatters"
import { exportOrdersXLSX, type ExportOrder } from "@/lib/utils/exporters"
import { type OrderStatus } from "@/types"

interface OrderItem {
  quantity: number
  notes: string | null
  status: string
  name: string
  price: number
}

interface HistoryOrder {
  id: string
  order_number: number | null
  status: OrderStatus
  created_at: string
  sent_to_kitchen_at: string | null
  ready_at: string | null
  delivered_at: string | null
  payment_method: string | null
  notes: string | null
  tableNumber: number
  waiterName: string
  items: OrderItem[]
}

type Period = "today" | "yesterday" | "week" | "month"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(o: any): HistoryOrder {
  return {
    id: o.id,
    order_number: o.order_number ?? null,
    status: o.status as OrderStatus,
    created_at: o.created_at,
    sent_to_kitchen_at: o.sent_to_kitchen_at ?? null,
    ready_at: o.ready_at ?? null,
    delivered_at: o.delivered_at ?? null,
    payment_method: o.payment_method ?? null,
    notes: o.notes ?? null,
    tableNumber: o.restaurant_tables?.number ?? 0,
    waiterName: o.profiles?.name ?? "—",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.order_items as any[]).map((item: any) => ({
      quantity: item.quantity,
      notes: item.notes ?? null,
      status: item.status,
      name: item.menu_items?.name ?? "—",
      price: item.menu_items?.price ?? 0,
    })),
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
}

function diffMinutes(from: string | null, to: string | null): string {
  if (!from || !to) return "—"
  const mins = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)
  return `${mins} min`
}

function OrderDetail({ order }: { order: HistoryOrder }) {
  const total = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const timeline: { label: string; value: string; sub?: string }[] = [
    { label: "Creada", value: formatTime(order.created_at) },
    { label: "Enviada a cocina", value: formatTime(order.sent_to_kitchen_at) },
    {
      label: "Lista",
      value: formatTime(order.ready_at),
      sub: order.sent_to_kitchen_at && order.ready_at
        ? `${diffMinutes(order.sent_to_kitchen_at, order.ready_at)} de preparación`
        : undefined,
    },
    {
      label: "Entregada",
      value: formatTime(order.delivered_at),
      sub: order.ready_at && order.delivered_at
        ? `${diffMinutes(order.ready_at, order.delivered_at)} de espera`
        : undefined,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Mesa</p>
          <p className="text-lg font-bold text-zinc-100">{order.tableNumber}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Camarero</p>
          <p className="text-sm font-medium text-zinc-200 truncate">{order.waiterName}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Estado</p>
          <StatusBadge status={order.status} />
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Pago</p>
          <p className="text-sm font-medium text-zinc-200">
            {order.payment_method === "cash" ? "Efectivo" : order.payment_method === "card" ? "Tarjeta" : "—"}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Tiempos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeline.map((t) => (
            <div key={t.label} className="text-center p-2 rounded-lg bg-zinc-800/40 border border-zinc-800">
              <p className="text-[10px] text-zinc-600 mb-1">{t.label}</p>
              <p className="text-sm font-mono font-bold text-zinc-300">{t.value}</p>
              {t.sub && <p className="text-[10px] text-zinc-600 mt-0.5">{t.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Ítems</p>
        <div className="space-y-1 rounded-lg border border-zinc-800 overflow-hidden">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 text-sm border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-zinc-300 tabular-nums mr-1.5">{item.quantity}×</span>
                <span className="text-zinc-300">{item.name}</span>
                {item.notes && <span className="text-zinc-600 italic ml-2 text-xs">({item.notes})</span>}
              </div>
              <span className="text-zinc-400 shrink-0 ml-3">{formatCurrency(item.quantity * item.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
        {order.notes && <p className="text-xs text-zinc-500 italic flex-1 mr-4">Nota: {order.notes}</p>}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="text-base font-bold text-zinc-100">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  week: "7 días",
  month: "30 días",
}

export function OrderHistoryClient({ initialOrders }: { initialOrders: object[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<HistoryOrder[]>((initialOrders as any[]).map(mapOrder))
  const [period, setPeriod] = useState<Period>("today")
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null)

  const fetchOrders = useCallback(async (p: Period) => {
    setLoading(true)
    const supabase = createClient()
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    if (p === "yesterday") from.setDate(from.getDate() - 1)
    else if (p === "week") from.setDate(from.getDate() - 7)
    else if (p === "month") from.setDate(from.getDate() - 30)

    const to = new Date()
    if (p === "yesterday") {
      to.setDate(to.getDate() - 1)
      to.setHours(23, 59, 59, 999)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
      .from("orders")
      .select(`
        id, order_number, status, created_at, sent_to_kitchen_at, ready_at, delivered_at,
        payment_method, notes,
        restaurant_tables(number),
        profiles(name),
        order_items(quantity, notes, status, menu_items(name, price))
      `)
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false })
      .limit(200)

    if (p === "yesterday") {
      q = q.lte("created_at", to.toISOString())
    }

    const { data } = await q
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setOrders((data ?? []).map((o: any) => mapOrder(o)))
    setLoading(false)
  }, [])

  function handlePeriodChange(p: Period) {
    setPeriod(p)
    fetchOrders(p)
  }

  async function handleExportOrders(from: Date, to: Date) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, sent_to_kitchen_at, ready_at, delivered_at,
        payment_method, notes,
        restaurant_tables(number),
        profiles(name),
        order_items(quantity, notes, status, menu_items(name, price))
      `)
      .gte("created_at", from.toISOString())
      .lte("created_at", endOfDay(to).toISOString())
      .order("created_at", { ascending: true })

    if (!data) throw new Error("No data")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportOrders: ExportOrder[] = (data as any[]).map((o: any) => ({
      order_number: o.order_number ?? null,
      status: o.status,
      created_at: o.created_at ?? "",
      sent_to_kitchen_at: o.sent_to_kitchen_at ?? null,
      ready_at: o.ready_at ?? null,
      delivered_at: o.delivered_at ?? null,
      payment_method: o.payment_method ?? null,
      notes: o.notes ?? null,
      tableNumber: o.restaurant_tables?.number ?? 0,
      waiterName: o.profiles?.name ?? "—",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (o.order_items as any[]).map((item: any) => ({
        quantity: item.quantity,
        notes: item.notes ?? null,
        name: item.menu_items?.name ?? "—",
        price: item.menu_items?.price ?? 0,
      })),
    }))

    exportOrdersXLSX(exportOrders, from, to)
  }

  const total = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity * i.price, 0), 0)

  const STATUS_LABEL: Partial<Record<string, string>> = {
    delivered: "Entregada",
    cancelled: "Cancelada",
    pending: "Pendiente",
    in_kitchen: "En cocina",
    ready: "Lista",
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filtro de período */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {(["today", "yesterday", "week", "month"] as Period[]).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => handlePeriodChange(p)}
                className={`min-h-[36px] text-xs font-semibold transition-all ${
                  period === p
                    ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            {loading ? "Cargando..." : `${orders.length} órdenes`}
            {!loading && orders.length > 0 && (
              <span className="ml-2 text-zinc-400 font-medium">{formatCurrency(total)}</span>
            )}
          </span>
          <div className="ml-auto">
            <ExportButton defaultDays={7} onExport={handleExportOrders} />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-600">Sin órdenes en este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-zinc-600 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-zinc-600 font-medium">Mesa</th>
                    <th className="text-left px-4 py-3 text-zinc-600 font-medium">Camarero</th>
                    <th className="text-left px-4 py-3 text-zinc-600 font-medium">Estado</th>
                    <th className="text-right px-4 py-3 text-zinc-600 font-medium">Total</th>
                    <th className="text-right px-4 py-3 text-zinc-600 font-medium">Hora</th>
                    <th className="text-right px-4 py-3 text-zinc-600 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const orderTotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                          {formatOrderNumber(order.order_number)}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 font-medium">
                          Mesa {order.tableNumber}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 truncate max-w-[120px]">
                          {order.waiterName}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-100 tabular-nums">
                          {formatCurrency(orderTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500 tabular-nums text-xs">
                          {formatTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600 text-xs">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {selectedOrder ? formatOrderNumber(selectedOrder.order_number) : ""} — Mesa{" "}
              {selectedOrder?.tableNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetail order={selectedOrder} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
