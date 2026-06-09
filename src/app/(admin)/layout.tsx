import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ForkKnife } from "@phosphor-icons/react/dist/ssr"
import { AdminNavLinks } from "@/components/admin/AdminNavLinks"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/login")

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar — dark */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ForkKnife className="w-4 h-4 text-emerald-400" weight="fill" />
            </div>
            <div>
              <span className="font-bold text-zinc-100 text-sm tracking-wide">Ember POS</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 mt-3 px-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-xs text-zinc-500 truncate">{profile?.name}</p>
          </div>
        </div>

        <AdminNavLinks />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
