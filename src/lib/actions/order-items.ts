"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function markItemReady(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("order_items")
    .update({ status: "ready" })
    .eq("id", itemId)

  if (error) return { error: error.message }

  revalidatePath("/display")
  return {}
}

export async function markItemPending(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("order_items")
    .update({ status: "pending" })
    .eq("id", itemId)

  if (error) return { error: error.message }
  revalidatePath("/display")
  return {}
}
