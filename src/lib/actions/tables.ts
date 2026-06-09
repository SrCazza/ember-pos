"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { type TableStatus } from "@/types"

export async function updateTableStatus(id: string, status: TableStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("restaurant_tables")
    .update({ status })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/tables")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createTable(number: number, capacity: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("restaurant_tables")
    .insert({ number, capacity })

  if (error) return { error: error.message }
  revalidatePath("/tables")
  return { success: true }
}

export async function updateTable(id: string, data: { number?: number; capacity?: number }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("restaurant_tables")
    .update(data)
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/tables")
  return { success: true }
}
