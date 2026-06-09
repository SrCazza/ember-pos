import { type OrderStatus } from "@/types"

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  in_kitchen: "En Cocina",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_kitchen: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  delivered: "bg-zinc-100 text-zinc-500 border-zinc-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export const STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  in_kitchen: "bg-blue-600",
  ready: "bg-emerald-600",
  delivered: "bg-zinc-400",
  cancelled: "bg-red-600",
}

// Transiciones válidas del estado de órdenes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["in_kitchen", "cancelled"],
  in_kitchen: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
}

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const transitions = VALID_TRANSITIONS[current]
  return transitions.length > 0 ? transitions[0] : null
}

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
