import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { UsersClient } from "./UsersClient"

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

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, role, is_active, created_at")
    .order("created_at")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description={`${users?.length ?? 0} usuarios en el sistema`}
        variant="dark"
      />
      <UsersClient
        initialUsers={(users ?? []).map((u) => ({
          ...u,
          is_active: u.is_active ?? true,
          created_at: u.created_at ?? "",
        }))}
      />
    </div>
  )
}
