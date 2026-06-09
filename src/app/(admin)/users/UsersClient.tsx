"use client"

import { useState } from "react"
import { UserForm } from "@/components/admin/UserForm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { deactivateUser, reactivateUser } from "@/lib/actions/users"
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react"
import { createClient } from "@/lib/supabase/client"
import { type UserRole } from "@/types"

interface User {
  id: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  waiter: "Camarero",
  kitchen: "Cocina",
  admin: "Admin",
}

const ROLE_COLORS: Record<string, string> = {
  waiter: "bg-blue-100 text-blue-700 border-blue-200",
  kitchen: "bg-orange-100 text-orange-700 border-orange-200",
  admin: "bg-purple-100 text-purple-700 border-purple-200",
}

function isEmailLike(name: string) {
  return name.includes("@")
}

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)

  async function fetchUsers() {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, name, role, is_active, created_at")
      .order("created_at")
    if (data) setUsers(data.map((u) => ({ ...u, is_active: u.is_active ?? true, created_at: u.created_at ?? "" })))
  }

  async function handleToggleActive(user: User) {
    if (user.is_active) {
      await deactivateUser(user.id)
    } else {
      await reactivateUser(user.id)
    }
    fetchUsers()
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
        >
          <PlusIcon className="w-4 h-4 mr-1" /> Nuevo usuario
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors ${
              !user.is_active ? "opacity-50" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-zinc-100 truncate">
                  {isEmailLike(user.name) ? user.name.split("@")[0] : user.name}
                </p>
                {isEmailLike(user.name) && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    Sin nombre
                  </span>
                )}
              </div>
              {!user.is_active && (
                <p className="text-xs text-red-400 mt-0.5">Desactivado</p>
              )}
            </div>

            <Badge variant="outline" className={ROLE_COLORS[user.role]}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditTarget(user)}
              className="min-h-[44px] min-w-[44px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              title="Editar nombre y rol"
            >
              <PencilSimpleIcon className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleActive(user)}
              className={`min-h-[44px] border-zinc-700 ${!user.is_active ? "text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/10" : "text-red-400 hover:text-red-300 hover:border-red-500/50 hover:bg-red-500/10"} bg-transparent`}
            >
              {user.is_active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        ))}
      </div>

      {/* Crear usuario */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <UserForm onSuccess={() => { setCreateOpen(false); fetchUsers() }} />
        </DialogContent>
      </Dialog>

      {/* Editar usuario */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <UserForm
              mode="edit"
              userId={editTarget.id}
              defaultValues={{ name: editTarget.name, role: editTarget.role as UserRole }}
              onSuccess={() => { setEditTarget(null); fetchUsers() }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
