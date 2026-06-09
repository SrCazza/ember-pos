import { createClient } from "@/lib/supabase/server"
import { ActiveOrdersList } from "@/components/waiter/ActiveOrdersList"

export default async function ActiveOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <ActiveOrdersList userId={user!.id} />
}
