"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toggleItemAvailability } from "@/lib/actions/menu"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"

export function ToggleAvailabilityButton({
  id,
  isAvailable,
}: {
  id: string
  isAvailable: boolean
}) {
  const [available, setAvailable] = useState(isAvailable)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const result = await toggleItemAvailability(id, available)
    if (!result.error) setAvailable(!available)
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      title={available ? "Deshabilitar" : "Habilitar"}
      className={`min-h-[44px] min-w-[44px] ${available ? "text-zinc-500" : "text-amber-500"}`}
    >
      {available ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
    </Button>
  )
}
