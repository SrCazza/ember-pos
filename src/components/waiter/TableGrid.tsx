import { TableCard } from "./TableCard"
import { type TableStatus } from "@/types"

interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
}

interface TableGridProps {
  tables: Table[]
}

export function TableGrid({ tables }: TableGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          id={table.id}
          number={table.number}
          capacity={table.capacity}
          status={table.status}
        />
      ))}
    </div>
  )
}
