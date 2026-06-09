import Link from "next/link"
import { cn } from "@/lib/utils"
import { type TableStatus, type OrderStatus } from "@/types"
import { BellIcon } from "@phosphor-icons/react/dist/ssr"
import { formatRelativeTime } from "@/lib/utils/formatters"

interface ActiveOrder {
  status: OrderStatus
  created_at: string
  waiter_name: string
}

interface TableCardProps {
  id: string
  number: number
  capacity: number
  status: TableStatus
  activeOrder?: ActiveOrder | null
}

const ORDER_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:    "Pendiente",
  in_kitchen: "En cocina",
  ready:      "Lista ✓",
}

const ORDER_STATUS_STYLE: Partial<Record<OrderStatus, string>> = {
  pending:    "bg-amber-100 text-amber-700",
  in_kitchen: "bg-blue-100 text-blue-700",
  ready:      "bg-emerald-100 text-emerald-700",
}

const BASE = "flex flex-col items-center justify-center rounded-xl border-2 px-2 py-4 min-h-[96px] transition-all duration-200 cursor-pointer"

export function TableCard({ id, number, capacity, status, activeOrder }: TableCardProps) {
  const href = status === "available" ? `/order/${id}` : `/active`
  const isReady = activeOrder?.status === "ready"

  // ── Mesa libre ───────────────────────────────────────────────────────────────
  if (status === "available") {
    return (
      <Link href={href} className={cn(BASE, "bg-white border-zinc-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50 active:scale-[0.97]")}>
        <span className="text-4xl font-black leading-none tabular-nums text-zinc-800">{number}</span>
        <div className="flex items-center gap-1 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Libre</span>
        </div>
        <span className="text-[10px] text-zinc-300 mt-0.5">{capacity} pax</span>
      </Link>
    )
  }

  // ── Mesa con orden lista ─────────────────────────────────────────────────────
  if (isReady) {
    return (
      <Link href={href} className={cn(BASE, "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100 active:scale-[0.97]")}>
        <span className="text-4xl font-black leading-none tabular-nums text-emerald-700">{number}</span>
        <div className="flex items-center gap-1 mt-2">
          <BellIcon className="w-3.5 h-3.5 text-emerald-600 animate-bounce" weight="fill" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Lista</span>
        </div>
        <span className="text-[10px] text-emerald-500 mt-0.5 truncate w-full text-center px-1">
          {formatRelativeTime(activeOrder.created_at)}
        </span>
      </Link>
    )
  }

  // ── Mesa ocupada (pending / in_kitchen) ──────────────────────────────────────
  const orderStatusLabel = activeOrder ? ORDER_STATUS_LABEL[activeOrder.status] : null
  const orderStatusStyle = activeOrder ? ORDER_STATUS_STYLE[activeOrder.status] : ""

  return (
    <div className={cn(BASE, "bg-red-50 border-red-200 relative gap-0")}>
      <Link href="/active" className="flex flex-col items-center w-full">
        <span className="text-4xl font-black leading-none tabular-nums text-red-700">{number}</span>
        {activeOrder && orderStatusLabel ? (
          <>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5", orderStatusStyle)}>
              {orderStatusLabel}
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5">
              {formatRelativeTime(activeOrder.created_at)}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ocupada</span>
          </div>
        )}
      </Link>
      <Link
        href={`/order/${id}?addition=true`}
        className="mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1 transition-colors min-h-[28px] flex items-center border border-indigo-200 active:scale-95"
      >
        + Agregar
      </Link>
    </div>
  )
}
