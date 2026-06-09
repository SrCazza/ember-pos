"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser, updateUser } from "@/lib/actions/users"
import { type UserRole } from "@/types"

interface UserFormCreateProps {
  mode?: "create"
  onSuccess?: () => void
}

interface UserFormEditProps {
  mode: "edit"
  userId: string
  defaultValues: { name: string; role: UserRole }
  onSuccess?: () => void
}

type UserFormProps = UserFormCreateProps | UserFormEditProps

const ROLE_LABELS: Record<UserRole, string> = {
  waiter: "Camarero",
  kitchen: "Cocina",
  admin: "Administrador",
}

export function UserForm(props: UserFormProps) {
  const isEdit = props.mode === "edit"
  const [name, setName] = useState(isEdit ? props.defaultValues.name : "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(isEdit ? props.defaultValues.role : "waiter")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let result: { error?: string }
    if (isEdit) {
      result = await updateUser(props.userId, { name, role })
    } else {
      result = await createUser(email, name, role, password)
    }

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      if (!isEdit) {
        setName("")
        setEmail("")
        setPassword("")
        setRole("waiter")
      }
      props.onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Nombre</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          required
          className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
        />
      </div>

      {!isEdit && (
        <>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@restaurante.com"
              required
              className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Contraseña temporal</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
              className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-emerald-500"
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Rol</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="min-h-[44px] bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-0 focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
        {loading ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar cambios" : "Crear usuario")}
      </Button>
    </form>
  )
}
