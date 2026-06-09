import * as XLSX from "xlsx"
import { endOfDay } from "date-fns"

// ─── Shared helpers ────────────────────────────────────────────────────────────

function toDateStr(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d
  return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function toTimeStr(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

function diffMinutes(from: string | null | undefined, to: string | null | undefined): string {
  if (!from || !to) return "—"
  const mins = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)
  return String(mins)
}

function colWidth(w: number) {
  return { wch: w }
}

// Apply bold to a header row (row index 0-based)
function boldRow(ws: XLSX.WorkSheet, row: number, cols: number) {
  for (let c = 0; c < cols; c++) {
    const addr = XLSX.utils.encode_cell({ r: row, c })
    if (!ws[addr]) continue
    ws[addr].s = { font: { bold: true } }
  }
}

// ─── Reports export ────────────────────────────────────────────────────────────

interface ReportData {
  totalRevenue: number
  totalOrders: number
  avgKitchenTimeMinutes: number
  salesByDay: { date: string; revenue: number; orders: number }[]
  topDishes: { name: string; count: number; revenue: number }[]
  waiterStats: { name: string; orders: number; revenue: number }[]
}

export function exportReportsXLSX(data: ReportData, from: Date, to: Date): void {
  const wb = XLSX.utils.book_new()
  const fromStr = from.toISOString().split("T")[0]
  const toStr = endOfDay(to).toISOString().split("T")[0]
  const avgTicket = data.totalOrders > 0 ? (data.totalRevenue / data.totalOrders).toFixed(2) : "0.00"

  // Sheet 1: Resumen
  const resumen: (string | number)[][] = [
    ["Reporte de Ventas"],
    ["Período", `${toDateStr(from)} — ${toDateStr(to)}`],
    [],
    ["Métrica", "Valor"],
    ["Revenue total", `S/ ${data.totalRevenue.toFixed(2)}`],
    ["Total órdenes", data.totalOrders],
    ["Ticket promedio", `S/ ${avgTicket}`],
    ["Tiempo promedio cocina", `${data.avgKitchenTimeMinutes} min`],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
  wsResumen["!cols"] = [colWidth(28), colWidth(22)]
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

  // Sheet 2: Ventas por día
  const totalRevAll = data.salesByDay.reduce((s, d) => s + d.revenue, 0)
  const ventasRows: (string | number)[][] = [
    ["Fecha", "Ingresos (S/)", "Órdenes", "% del total"],
    ...data.salesByDay.map((d) => [
      d.date,
      Number(d.revenue.toFixed(2)),
      d.orders,
      totalRevAll > 0 ? `${((d.revenue / totalRevAll) * 100).toFixed(1)}%` : "0%",
    ]),
    [],
    ["TOTAL", Number(totalRevAll.toFixed(2)), data.salesByDay.reduce((s, d) => s + d.orders, 0), "100%"],
  ]
  const wsVentas = XLSX.utils.aoa_to_sheet(ventasRows)
  wsVentas["!cols"] = [colWidth(14), colWidth(16), colWidth(10), colWidth(12)]
  XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas por día")

  // Sheet 3: Top platos
  const totalDishRev = data.topDishes.reduce((s, d) => s + d.revenue, 0)
  const platosRows: (string | number)[][] = [
    ["#", "Plato", "Cantidad vendida", "Ingresos (S/)", "% del revenue"],
    ...data.topDishes.map((d, i) => [
      i + 1,
      d.name,
      d.count,
      Number(d.revenue.toFixed(2)),
      totalDishRev > 0 ? `${((d.revenue / totalDishRev) * 100).toFixed(1)}%` : "0%",
    ]),
  ]
  const wsPlatos = XLSX.utils.aoa_to_sheet(platosRows)
  wsPlatos["!cols"] = [colWidth(4), colWidth(28), colWidth(18), colWidth(14), colWidth(14)]
  XLSX.utils.book_append_sheet(wb, wsPlatos, "Top platos")

  // Sheet 4: Por camarero
  const totalWaiterRev = data.waiterStats.reduce((s, w) => s + w.revenue, 0)
  const camareroRows: (string | number)[][] = [
    ["Camarero", "Órdenes", "Ingresos (S/)", "Ticket promedio (S/)", "% del revenue"],
    ...data.waiterStats.map((w) => [
      w.name,
      w.orders,
      Number(w.revenue.toFixed(2)),
      w.orders > 0 ? Number((w.revenue / w.orders).toFixed(2)) : 0,
      totalWaiterRev > 0 ? `${((w.revenue / totalWaiterRev) * 100).toFixed(1)}%` : "0%",
    ]),
    [],
    ["TOTAL", data.waiterStats.reduce((s, w) => s + w.orders, 0), Number(totalWaiterRev.toFixed(2)), "", "100%"],
  ]
  const wsCamareros = XLSX.utils.aoa_to_sheet(camareroRows)
  wsCamareros["!cols"] = [colWidth(22), colWidth(10), colWidth(14), colWidth(20), colWidth(14)]
  XLSX.utils.book_append_sheet(wb, wsCamareros, "Por camarero")

  XLSX.writeFile(wb, `reporte_${fromStr}_${toStr}.xlsx`)
}

// ─── Orders export ─────────────────────────────────────────────────────────────

export interface ExportOrderItem {
  quantity: number
  notes: string | null
  name: string
  price: number
}

export interface ExportOrder {
  order_number: number | null
  status: string
  created_at: string
  sent_to_kitchen_at: string | null
  ready_at: string | null
  delivered_at: string | null
  payment_method: string | null
  notes: string | null
  tableNumber: number
  waiterName: string
  items: ExportOrderItem[]
}

const STATUS_ES: Record<string, string> = {
  pending: "Pendiente",
  in_kitchen: "En cocina",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
}

export function exportOrdersXLSX(orders: ExportOrder[], from: Date, to: Date): void {
  const wb = XLSX.utils.book_new()
  const fromStr = from.toISOString().split("T")[0]
  const toStr = endOfDay(to).toISOString().split("T")[0]

  // Sheet 1: Órdenes
  const ordersHeader = [
    "#Orden", "Mesa", "Camarero", "Estado", "Pago", "Total (S/)",
    "Fecha", "Hora creación", "Hora cocina", "Hora lista", "Hora entregada",
    "Tiempo prep. (min)", "Notas",
  ]
  const ordersRows: (string | number | null)[][] = [ordersHeader]

  for (const o of orders) {
    const total = o.items.reduce((s, i) => s + i.quantity * i.price, 0)
    const orderNum = o.order_number ? `#${String(o.order_number).padStart(5, "0")}` : "—"
    ordersRows.push([
      orderNum,
      o.tableNumber,
      o.waiterName,
      STATUS_ES[o.status] ?? o.status,
      o.payment_method === "cash" ? "Efectivo" : o.payment_method === "card" ? "Tarjeta" : "—",
      Number(total.toFixed(2)),
      toDateStr(o.created_at),
      toTimeStr(o.created_at),
      toTimeStr(o.sent_to_kitchen_at),
      toTimeStr(o.ready_at),
      toTimeStr(o.delivered_at),
      diffMinutes(o.sent_to_kitchen_at, o.ready_at),
      o.notes ?? "",
    ])
  }

  // Totals row
  const grandTotal = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity * i.price, 0), 0)
  ordersRows.push([])
  ordersRows.push(["TOTAL", "", "", "", "", Number(grandTotal.toFixed(2)), "", "", "", "", "", "", ""])

  const wsOrders = XLSX.utils.aoa_to_sheet(ordersRows)
  wsOrders["!cols"] = [
    colWidth(10), colWidth(6), colWidth(18), colWidth(12), colWidth(10), colWidth(12),
    colWidth(12), colWidth(14), colWidth(14), colWidth(12), colWidth(16), colWidth(18), colWidth(30),
  ]
  XLSX.utils.book_append_sheet(wb, wsOrders, "Órdenes")

  // Sheet 2: Detalle ítems
  const itemsHeader = [
    "#Orden", "Mesa", "Camarero", "Plato", "Cantidad", "Notas ítem", "Precio unit. (S/)", "Subtotal (S/)",
  ]
  const itemsRows: (string | number | null)[][] = [itemsHeader]

  for (const o of orders) {
    const orderNum = o.order_number ? `#${String(o.order_number).padStart(5, "0")}` : "—"
    for (const item of o.items) {
      itemsRows.push([
        orderNum,
        o.tableNumber,
        o.waiterName,
        item.name,
        item.quantity,
        item.notes ?? "",
        Number(item.price.toFixed(2)),
        Number((item.quantity * item.price).toFixed(2)),
      ])
    }
  }

  const wsItems = XLSX.utils.aoa_to_sheet(itemsRows)
  wsItems["!cols"] = [
    colWidth(10), colWidth(6), colWidth(18), colWidth(28), colWidth(10), colWidth(24), colWidth(18), colWidth(14),
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, "Detalle ítems")

  // Apply bold to header rows (SheetJS CE doesn't always apply styles in free version,
  // but the aoa_to_sheet structure ensures headers are the first row)
  boldRow(wsOrders, 0, ordersHeader.length)
  boldRow(wsItems, 0, itemsHeader.length)

  XLSX.writeFile(wb, `ordenes_${fromStr}_${toStr}.xlsx`)
}
