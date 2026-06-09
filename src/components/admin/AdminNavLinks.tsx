"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFourIcon,
  ForkKnifeIcon,
  ChartBarIcon,
  UsersIcon,
  TableIcon,
  SignOutIcon,
  ListBulletsIcon,
} from "@phosphor-icons/react"
import { signOut } from "@/lib/actions/auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
  { href: "/menu", label: "Menú", icon: ForkKnifeIcon },
  { href: "/reports", label: "Reportes", icon: ChartBarIcon },
  { href: "/orders", label: "Órdenes", icon: ListBulletsIcon },
  { href: "/users", label: "Usuarios", icon: UsersIcon },
  { href: "/mesas", label: "Mesas", icon: TableIcon },
]

export function AdminNavLinks() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                isActive
                  ? "bg-zinc-900 text-zinc-100 border-l-2 border-emerald-500 pl-[10px]"
                  : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300 border-l-2 border-transparent pl-[10px]"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"}`}
                weight={isActive ? "fill" : "regular"}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800/60">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-900/60 hover:text-red-400 transition-colors cursor-pointer border-l-2 border-transparent pl-[10px]"
          >
            <SignOutIcon className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )
}
