import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ForkKnifeIcon } from "@phosphor-icons/react/dist/ssr"
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav"

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "waiter" && profile?.role !== "admin") redirect("/login")

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-[0_1px_0_0_#e4e4e7]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ForkKnifeIcon className="w-4 h-4 text-emerald-600" weight="duotone" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight">Ember POS</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-sm text-zinc-500 font-medium">{profile?.name}</span>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <WaiterBottomNav userId={user.id} />
    </div>
  )
}
