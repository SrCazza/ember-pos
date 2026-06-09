import { createClient } from "@/lib/supabase/server"
import { KitchenDisplay } from "@/components/kitchen/KitchenDisplay"

export default async function DisplayPage() {
  const supabase = await createClient()

  const { data: stations } = await supabase
    .from("kitchen_stations")
    .select("id, name, color")
    .order("display_order")

  return <KitchenDisplay stations={stations ?? []} />
}
