"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

interface NotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  currentNotes: string
  onSave: (notes: string) => void
}

export function NotesModal({
  open,
  onOpenChange,
  itemName,
  currentNotes,
  onSave,
}: NotesModalProps) {
  const [notes, setNotes] = useState(currentNotes)

  function handleSave() {
    onSave(notes)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base text-zinc-900">Notas para: {itemName}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: sin cebolla, término medio, alergia a..."
          rows={3}
          autoFocus
          className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-emerald-500"
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 min-h-[44px] border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Guardar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
