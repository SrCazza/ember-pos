import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MenuItemForm } from "@/components/admin/MenuItemForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr"

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: item }, { data: categories }, { data: stations }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("id", id).single(),
    supabase.from("menu_categories").select("id, name, icon").order("display_order"),
    supabase.from("kitchen_stations").select("id, name, color").order("display_order"),
  ])

  if (!item) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="min-h-[44px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
          <Link href="/menu/items">
            <CaretLeft className="w-4 h-4" />
          </Link>
        </Button>
        <PageHeader title={`Editar: ${item.name}`} variant="dark" />
      </div>
      <MenuItemForm
        categories={(categories ?? []).map((c) => ({ ...c, icon: c.icon ?? "🍽️" }))}
        stations={stations ?? []}
        defaultValues={{
          id: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          category_id: item.category_id,
          station_id: item.station_id,
          image_url: item.image_url,
          is_available: item.is_available ?? true,
        }}
      />
    </div>
  )
}
