import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { ForkKnifeIcon, TagIcon, ChefHatIcon } from "@phosphor-icons/react/dist/ssr"

export default async function MenuPage() {
  const supabase = await createClient()

  const [{ count: itemsCount }, { count: categoriesCount }, { count: stationsCount }] =
    await Promise.all([
      supabase.from("menu_items").select("id", { count: "exact", head: true }),
      supabase.from("menu_categories").select("id", { count: "exact", head: true }),
      supabase.from("kitchen_stations").select("id", { count: "exact", head: true }),
    ])

  const sections = [
    {
      href: "/menu/items",
      label: "Platos",
      description: "Gestionar el catálogo de platos del restaurante",
      icon: ForkKnifeIcon,
      count: itemsCount ?? 0,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      href: "/menu/categories",
      label: "Categorías",
      description: "Organizar los platos en categorías del menú",
      icon: TagIcon,
      count: categoriesCount ?? 0,
      iconBg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      href: "/menu/stations",
      label: "Estaciones",
      description: "Configurar las estaciones de cocina",
      icon: ChefHatIcon,
      count: stationsCount ?? 0,
      iconBg: "bg-orange-500/10 border-orange-500/20",
      iconColor: "text-orange-400",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Menú" description="Platos, categorías y estaciones de cocina" variant="dark" />
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(({ href, label, description, icon: Icon, count, iconBg, iconColor }) => (
          <Link key={href} href={href}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} weight="duotone" />
              </div>
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{count}</p>
              <p className="text-sm font-semibold text-zinc-300 mt-1">{label}</p>
              <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
