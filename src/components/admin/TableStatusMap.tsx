import { cn } from "@/lib/utils"
import { type TableStatus } from "@/types"

interface Table {
  id: string
  number: number
  status: TableStatus
  capacity: number
}

const STATUS_STYLES: Record<TableStatus, string> = {
  available: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  occupied: "bg-red-500/10 border-red-500/30 text-red-400",
  reserved: "bg-amber-500/10 border-amber-500/30 text-amber-400",
}

interface TableStatusMapProps {
  tables: Table[]
}

export function TableStatusMap({ tables }: TableStatusMapProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {tables.map((table) => (
        <div
          key={table.id}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 py-3 px-2 text-center",
            STATUS_STYLES[table.status]
          )}
        >
          <span className="text-xl font-bold">{table.number}</span>
          <span className="text-xs mt-0.5 capitalize">{table.status === "available" ? "Libre" : table.status === "occupied" ? "Ocupada" : "Reservada"}</span>
        </div>
      ))}
    </div>
  )
}
