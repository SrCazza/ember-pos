"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { type UserRole } from "@/types"

function getAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js")
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createUser(
  email: string,
  name: string,
  role: UserRole,
  password: string
): Promise<{ error?: string; userId?: string }> {
  const supabase = await createClient()

  // Verificar que el caller es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Sin permisos" }

  // Crear usuario con service role (solo server-side)
  const adminClient = getAdminClient()
  const { data: newUser, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) return { error: error.message }

  revalidatePath("/users")
  return { userId: newUser.user.id }
}

export async function updateUser(
  userId: string,
  data: { name: string; role: UserRole }
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Sin permisos" }

  const { error } = await supabase
    .from("profiles")
    .update({ name: data.name, role: data.role })
    .eq("id", userId)

  if (error) return { error: error.message }
  revalidatePath("/users")
  return {}
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) return { error: error.message }
  revalidatePath("/users")
  return {}
}

export async function deactivateUser(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId)

  if (error) return { error: error.message }
  revalidatePath("/users")
  return {}
}

export async function reactivateUser(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("id", userId)

  if (error) return { error: error.message }
  revalidatePath("/users")
  return {}
}
