import { createClient } from "@/lib/supabase/server"
import { MenuItemForm } from "@/components/admin/MenuItemForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr"

export default async function NewItemPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: stations }] = await Promise.all([
    supabase.from("menu_categories").select("id, name, icon").order("display_order"),
    supabase.from("kitchen_stations").select("id, name, color").order("display_order"),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="min-h-[44px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
          <Link href="/menu/items">
            <CaretLeft className="w-4 h-4" />
          </Link>
        </Button>
        <PageHeader title="Nuevo plato" variant="dark" />
      </div>
      <MenuItemForm
        categories={(categories ?? []).map((c) => ({ ...c, icon: c.icon ?? "🍽️" }))}
        stations={stations ?? []}
      />
    </div>
  )
}
