"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NotesModal } from "./NotesModal"
import { type CartItem as CartItemType } from "@/types"
import { formatCurrency } from "@/lib/utils/formatters"
import { MinusIcon, PlusIcon, ChatCircleIcon } from "@phosphor-icons/react"

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (menuItemId: string, delta: number) => void
  onUpdateNotes: (menuItemId: string, notes: string) => void
}

export function CartItem({ item, onUpdateQuantity, onUpdateNotes }: CartItemProps) {
  const [notesOpen, setNotesOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
          {item.notes && (
            <span className="inline-flex items-center gap-1 mt-0.5 text-xs italic text-zinc-600 bg-zinc-100 rounded px-1.5 py-0.5 max-w-full">
              <ChatCircleIcon className="w-3 h-3 shrink-0 text-zinc-400" />
              <span className="truncate">{item.notes}</span>
            </span>
          )}
        </div>

        <span className="text-sm font-bold text-zinc-900 shrink-0">
          {formatCurrency(item.price * item.quantity)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotesOpen(true)}
          className={`min-h-[44px] min-w-[44px] ${item.notes ? "text-emerald-600 hover:text-emerald-700" : "text-zinc-400 hover:text-zinc-600"}`}
        >
          <ChatCircleIcon className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.menuItemId, -1)}
            className="w-8 h-8 p-0 min-h-[44px]"
          >
            <MinusIcon className="w-3 h-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.menuItemId, 1)}
            className="w-8 h-8 p-0 min-h-[44px]"
          >
            <PlusIcon className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <NotesModal
        open={notesOpen}
        onOpenChange={setNotesOpen}
        itemName={item.name}
        currentNotes={item.notes ?? ""}
        onSave={(notes) => onUpdateNotes(item.menuItemId, notes)}
      />
    </>
  )
}
