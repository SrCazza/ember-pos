"use client"

import { useState, useEffect } from "react"
import { endOfDay } from "date-fns"
import { PageHeader } from "@/components/shared/PageHeader"
import { KPICard } from "@/components/admin/KPICard"
import { ExportButton } from "@/components/admin/ExportButton"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/formatters"
import { exportReportsXLSX } from "@/lib/utils/exporters"
import {
  CurrencyDollarIcon,
  ClipboardTextIcon,
  TimerIcon,
  ReceiptIcon,
} from "@phosphor-icons/react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
  Cell,
} from "recharts"

type Period = "today" | "week" | "month"

interface ReportData {
  totalRevenue: number
  totalOrders: number
  avgKitchenTimeMinutes: number
  salesByDay: { date: string; revenue: number; orders: number }[]
  topDishes: { name: string; count: number; revenue: number }[]
  waiterStats: { name: string; orders: number; revenue: number }[]
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("today")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas y operaciones"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {(["today", "week", "month"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`min-h-[36px] text-xs font-semibold transition-all ${
                    period === p
                      ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {p === "today" ? "Hoy" : p === "week" ? "7 días" : "30 días"}
                </Button>
              ))}
            </div>
            <ExportButton
              defaultDays={7}
              onExport={async (from, to) => {
                const res = await fetch(
                  `/api/reports?period=custom&from=${from.toISOString()}&to=${endOfDay(to).toISOString()}`
                )
                const reportData: ReportData = await res.json()
                exportReportsXLSX(reportData, from, to)
              }}
            />
          </div>
        }
        variant="dark"
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Revenue total" value={formatCurrency(data.totalRevenue)} icon={CurrencyDollarIcon} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
            <KPICard title="Órdenes" value={data.totalOrders} icon={ClipboardTextIcon} iconBg="bg-blue-500/10" iconColor="text-blue-400" />
            <KPICard title="Tiempo promedio cocina" value={`${data.avgKitchenTimeMinutes} min`} icon={TimerIcon} iconBg="bg-amber-500/10" iconColor="text-amber-400" />
            <KPICard title="Ticket promedio" value={data.totalOrders > 0 ? formatCurrency(data.totalRevenue / data.totalOrders) : "S/ 0.00"} icon={ReceiptIcon} iconBg="bg-purple-500/10" iconColor="text-purple-400" />
          </div>

          {data.salesByDay.length > 1 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h3 className="font-semibold text-zinc-100 mb-4">Ventas por día</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#a1a1aa" }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.topDishes.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h3 className="font-semibold text-zinc-100 mb-4">Top 10 platos</h3>
              <ResponsiveContainer width="100%" height={Math.max(280, data.topDishes.length * 34)}>
                <BarChart data={data.topDishes} layout="vertical" margin={{ right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax"]}
                    allowDecimals={false}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [v, "Pedidos"]}
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#a1a1aa" }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.topDishes.map((_, i) => (
                      <Cell
                        key={i}
                        fill="#3b82f6"
                        fillOpacity={1 - (i / Math.max(data.topDishes.length, 1)) * 0.55}
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Tabla de detalle */}
              <div className="mt-4 border-t border-zinc-800 pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-1.5 text-zinc-600 font-medium">#</th>
                      <th className="text-left py-1.5 text-zinc-600 font-medium">Plato</th>
                      <th className="text-right py-1.5 text-zinc-600 font-medium">Pedidos</th>
                      <th className="text-right py-1.5 text-zinc-600 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topDishes.map((dish, i) => (
                      <tr key={dish.name} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                        <td className="py-1.5 text-zinc-600 tabular-nums">{i + 1}</td>
                        <td className="py-1.5 text-zinc-300">{dish.name}</td>
                        <td className="py-1.5 text-right font-semibold text-blue-400 tabular-nums">{dish.count}</td>
                        <td className="py-1.5 text-right font-medium text-zinc-100">{formatCurrency(dish.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.waiterStats.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h3 className="font-semibold text-zinc-100 mb-4">Rendimiento por camarero</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 text-zinc-600 font-medium">Camarero</th>
                      <th className="text-right py-2 text-zinc-600 font-medium">Órdenes</th>
                      <th className="text-right py-2 text-zinc-600 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.waiterStats.map((w) => (
                      <tr key={w.name} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2 text-zinc-300">{w.name}</td>
                        <td className="py-2 text-right text-zinc-400">{w.orders}</td>
                        <td className="py-2 text-right font-medium text-zinc-100">
                          {formatCurrency(w.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-zinc-500">Error al cargar reportes</p>
      )}
    </div>
  )
}
