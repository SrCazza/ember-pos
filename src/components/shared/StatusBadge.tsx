import { Badge } from "@/components/ui/badge"
import { type OrderStatus } from "@/types"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils/order-status"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_COLORS[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
