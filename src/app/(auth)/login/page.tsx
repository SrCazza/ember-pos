"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  EyeIcon,
  EyeSlashIcon,
  ForkKnifeIcon,
  ClipboardTextIcon,
  FireIcon,
  ChartBarIcon,
} from "@phosphor-icons/react"

const roles = [
  {
    icon: ClipboardTextIcon,
    label: "Camarero",
    desc: "Toma pedidos",
  },
  {
    icon: FireIcon,
    label: "Cocina",
    desc: "Gestiona el ritmo",
  },
  {
    icon: ChartBarIcon,
    label: "Admin",
    desc: "Controla todo",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(35% 0.1 160 / 0.15), transparent)",
      }}
    >
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <ForkKnifeIcon className="w-7 h-7 text-emerald-400" weight="duotone" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Ember POS</h1>
          <p className="text-sm text-zinc-500 mt-1">Sistema de gestión para restaurante</p>
        </div>

        {/* Form card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@restaurante.com"
                required
                autoComplete="email"
                className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors mt-1"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>

        {/* Infografía de roles */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {roles.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 px-2"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-zinc-400" weight="duotone" />
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">{label}</span>
              <span className="text-[10px] text-zinc-600 text-center leading-tight">{desc}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-5">
          Ember POS · Sistema operativo interno
        </p>
      </div>
    </div>
  )
}
