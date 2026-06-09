"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="text-lg font-semibold text-zinc-900">Algo salió mal</h2>
      <p className="text-sm text-zinc-500 mt-1 mb-4">
        {error.message ?? "Error inesperado"}
      </p>
      <Button onClick={reset} variant="outline">
        Reintentar
      </Button>
    </div>
  )
}
