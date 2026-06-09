import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { formatCurrency } from "@/lib/utils/formatters"
import { ToggleAvailabilityButton } from "./ToggleAvailabilityButton"

export default async function ItemsPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from("menu_items")
    .select(`
      *,
      menu_categories(name, icon),
      kitchen_stations(name, color)
    `)
    .order("display_order")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platos"
        description={`${items?.length ?? 0} platos en el menú`}
        actions={
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
            <Link href="/menu/items/new">
              <PlusIcon className="w-4 h-4 mr-1" /> Nuevo plato
            </Link>
          </Button>
        }
        variant="dark"
      />

      {!items || items.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="Sin platos"
          description="Agrega el primer plato al menú"
          variant="dark"
          action={
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/menu/items/new">Nuevo plato</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100 truncate">{item.name}</span>
                  {!item.is_available && (
                    <Badge variant="outline" className="text-xs text-zinc-600 border-zinc-700 shrink-0">
                      No disponible
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                    <CategoryIcon
                      icon={(item.menu_categories as { name: string; icon: string } | null)?.icon ?? "fork-knife"}
                      className="w-3.5 h-3.5"
                    />
                    {(item.menu_categories as { name: string; icon: string } | null)?.name}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{
                      backgroundColor:
                        (item.kitchen_stations as { color: string } | null)?.color ?? "#6B7280",
                    }}
                  >
                    {(item.kitchen_stations as { name: string } | null)?.name}
                  </span>
                </div>
              </div>
              <span className="font-bold text-zinc-100 shrink-0">
                {formatCurrency(Number(item.price))}
              </span>
              <ToggleAvailabilityButton id={item.id} isAvailable={item.is_available ?? true} />
              <Button variant="ghost" size="sm" asChild className="min-h-[44px] min-w-[44px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
                <Link href={`/menu/items/${item.id}`}>
                  <PencilSimpleIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
