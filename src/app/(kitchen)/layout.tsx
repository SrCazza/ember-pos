import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { FireIcon } from "@phosphor-icons/react/dist/ssr"

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "kitchen" && profile?.role !== "admin") redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <header className="bg-zinc-950 border-b border-zinc-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <FireIcon className="w-4 h-4 text-emerald-400" weight="duotone" />
          </div>
          <div>
            <span className="font-bold text-zinc-100 tracking-wide text-sm">Ember</span>
            <span className="text-zinc-600 text-sm"> · Cocina</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{profile?.name}</span>
          <form action={signOut}>
            <button type="submit" className="text-xs text-zinc-600 hover:text-red-400 min-h-[44px] px-2 transition-colors cursor-pointer font-medium">
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
