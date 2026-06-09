import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { TablesAdminClient } from "./TablesAdminClient"

export default async function AdminTablesPage() {
  const supabase = await createClient()

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, number, capacity, status")
    .order("number")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Mesas"
        description="Gestiona el número y capacidad de las mesas"
        variant="dark"
      />
      <TablesAdminClient initialTables={tables ?? []} />
    </div>
  )
}
