"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/formatters"
import { PlusIcon } from "@phosphor-icons/react"

interface MenuItemCardProps {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  quantity: number
  onAdd: () => void
}

export function MenuItemCard({
  name,
  description,
  price,
  image_url,
  is_available,
  quantity,
  onAdd,
}: MenuItemCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-zinc-200 overflow-hidden ${!is_available ? "opacity-50" : ""}`}>
      <div className="relative aspect-[4/3] bg-zinc-100">
        {image_url ? (
          <Image src={image_url} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-300">
            🍽️
          </div>
        )}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {quantity}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2">{name}</p>
        {description && (
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-zinc-900">{formatCurrency(price)}</span>
          <Button
            size="sm"
            onClick={onAdd}
            disabled={!is_available}
            className="w-9 h-9 p-0 bg-emerald-600 hover:bg-emerald-700 min-h-[44px] min-w-[44px]"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
