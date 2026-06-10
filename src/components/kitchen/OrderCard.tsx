"use client"

import { OrderTimer } from "./OrderTimer"
import { OrderItemRow } from "./OrderItemRow"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { markOrderReady } from "@/lib/actions/orders"
import { formatDuration, formatOrderNumber } from "@/lib/utils/formatters"
import { getTableColor } from "@/lib/utils/table-colors"
import { UserIcon } from "@phosphor-icons/react/dist/ssr"
import { useState, useCallback } from "react"

type Column = "queue" | "preparing" | "ready"

interface OrderItem {
  id: string
  name: string
  quantity: number
  notes: string | null
  status: "pending" | "ready"
  station_id: string
  category_id: string
  category_name: string
  category_icon: string
  delivered_at?: string | null
}

interface OrderCardProps {
  id: string
  orderNumber?: number | null
  tableNumber: number
  waiterName: string
  waiterEmail?: string | null
  createdAt: string
  sentToKitchenAt: string | null
  readyAt?: string | null
  column: Column
  isNew?: boolean
  isAddition?: boolean
  onOrderReady: () => void
  onStart?: () => void
  onPickedUp?: () => void
  items: OrderItem[]
  allItemsReady?: boolean
}

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryIcon: string
  items: OrderItem[]
}

function groupByCategory(items: OrderItem[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>()
  for (const item of items) {
    const key = item.category_id || "uncategorized"
    if (!map.has(key)) {
      map.set(key, {
        categoryId: key,
        categoryName: item.category_name || "",
        categoryIcon: item.category_icon || "fork-knife",
        items: [],
      })
    }
    map.get(key)!.items.push(item)
  }
  return Array.from(map.values())
}

export function OrderCard({
  id,
  orderNumber,
  tableNumber,
  waiterName,
  waiterEmail,
  createdAt,
  sentToKitchenAt,
  readyAt,
  column,
  isNew,
  isAddition,
  onOrderReady,
  onStart,
  onPickedUp,
  items,
  allItemsReady,
}: OrderCardProps) {
  const [marking, setMarking] = useState(false)
  const [pickingUp, setPickingUp] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const localAllReady = items.every((i) => i.status === "ready" || !!i.delivered_at)
  const allReady = allItemsReady ?? localAllReady
  const startTime = sentToKitchenAt ?? createdAt
  const tableColor = getTableColor(tableNumber)

  const handleUrgencyChange = useCallback((urgent: boolean) => setIsUrgent(urgent), [])

  const urgentActive = isUrgent && column !== "ready"
  const borderColor = urgentActive
    ? "#EF4444"
    : column === "queue" ? "#6366F1" : column === "preparing" ? "#F59E0B" : "#059669"

  async function handleMarkReady() {
    setMarking(true)
    const result = await markOrderReady(id)
    if (!result.error) onOrderReady()
    setMarking(false)
  }

  async function handlePickedUpClick() {
    if (!onPickedUp) return
    setPickingUp(true)
    onPickedUp()
  }

  const categoryGroups = groupByCategory(items)
  const showCategoryHeaders = categoryGroups.length > 1

  const frozenSeconds =
    readyAt && sentToKitchenAt
      ? Math.floor((new Date(readyAt).getTime() - new Date(sentToKitchenAt).getTime()) / 1000)
      : null

  return (
    <div
      className={`bg-zinc-900 rounded-xl border border-zinc-800 border-l-4 overflow-hidden shadow-xl shadow-black/50 ${isNew ? "animate-slide-in-down" : ""}`}
      style={{ borderLeftColor: borderColor }}
    >
      {/* Header */}
      <div className={`flex items-start justify-between px-4 py-3.5 border-b ${urgentActive ? "border-red-900/50 bg-red-950/15" : "border-zinc-800"}`}>
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 self-center shadow-sm"
              style={{ backgroundColor: tableColor }}
            />
            <span className="text-5xl font-black text-zinc-100 leading-none tracking-tighter tabular-nums">
              {tableNumber}
            </span>
            <div className="flex flex-col">
              <span className="text-base font-medium text-zinc-600">Mesa</span>
              {orderNumber && (
                <span className="text-xs font-mono text-zinc-600 leading-none">{formatOrderNumber(orderNumber)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-zinc-500" weight="regular" />
                <p className="text-xs text-zinc-500">{waiterName}</p>
              </div>
              {waiterEmail && (
                <p className="text-[10px] text-zinc-600 leading-none pl-4">{waiterEmail}</p>
              )}
            </div>
            {isAddition && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                + Adición
              </span>
            )}
            {urgentActive && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
                Demorada
              </span>
            )}
          </div>
        </div>

        {column === "ready" && frozenSeconds !== null ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/60">
              Tiempo total
            </span>
            <span className="text-lg font-mono font-bold tabular-nums px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {formatDuration(frozenSeconds)}
            </span>
          </div>
        ) : (
          <OrderTimer startTime={startTime} onUrgencyChange={handleUrgencyChange} />
        )}
      </div>

      {/* Items */}
      <div className="p-3 space-y-1">
        {showCategoryHeaders ? (
          categoryGroups.map((group) => (
            <div key={group.categoryId}>
              <div className="flex items-center gap-1.5 mb-1 mt-2 first:mt-0">
                <CategoryIcon icon={group.categoryIcon} className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  {group.categoryName}
                </span>
              </div>
              {group.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  quantity={item.quantity}
                  notes={item.notes}
                  status={item.status}
                  readOnly={column === "ready"}
                  deliveredAt={item.delivered_at ?? null}
                />
              ))}
            </div>
          ))
        ) : (
          items.map((item) => (
            <OrderItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              quantity={item.quantity}
              notes={item.notes}
              status={item.status}
              readOnly={column === "ready"}
              deliveredAt={item.delivered_at ?? null}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-1">
        {column === "queue" && (
          <Button
            onClick={onStart}
            className="w-full min-h-[52px] text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer rounded-lg"
          >
            Iniciar preparación
          </Button>
        )}

        {column === "preparing" && (
          <Button
            onClick={handleMarkReady}
            disabled={marking}
            className={`w-full min-h-[52px] text-base font-bold transition-all cursor-pointer rounded-lg ${
              allReady
                ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-900/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            {marking ? "Marcando..." : allReady ? "✓ Marcar lista" : "Marcar como listo"}
          </Button>
        )}

        {column === "ready" && (
          <Button
            onClick={handlePickedUpClick}
            disabled={pickingUp}
            className="w-full min-h-[52px] text-base font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors cursor-pointer rounded-lg disabled:opacity-60"
          >
            {pickingUp ? "Registrando..." : "↑ Marcar recogido"}
          </Button>
        )}
      </div>
    </div>
  )
}
