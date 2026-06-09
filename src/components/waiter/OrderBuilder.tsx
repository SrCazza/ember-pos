"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MenuItemCard } from "./MenuItemCard"
import { CartItem } from "./CartItem"
import { createOrder, sendToKitchen } from "@/lib/actions/orders"
import { formatCurrency } from "@/lib/utils/formatters"
import { type CartItem as CartItemType } from "@/types"
import { ShoppingCartIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { CategoryIcon } from "@/components/shared/CategoryIcon"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  category_id: string
  station_id: string
}

interface Category {
  id: string
  name: string
  icon: string
}

interface OrderBuilderProps {
  tableId: string
  tableNumber: number
  isAddition?: boolean
  categories: Category[]
  menuItems: MenuItem[]
}

export function OrderBuilder({ tableId, tableNumber, isAddition, categories, menuItems }: OrderBuilderProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "")
  const [cart, setCart] = useState<CartItemType[]>([])
  const [orderNotes, setOrderNotes] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = searchQuery.trim().toLowerCase()
  const filteredItems = q
    ? menuItems.filter(
        (item) =>
          item.is_available &&
          (item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q))
      )
    : menuItems.filter((item) => item.category_id === activeCategory)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          stationId: item.station_id,
          categoryId: item.category_id,
        },
      ]
    })
  }

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c
      )
      return updated.filter((c) => c.quantity > 0)
    })
  }

  function updateNotes(menuItemId: string, notes: string) {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, notes } : c))
    )
  }

  async function handleSendToKitchen() {
    if (cart.length === 0) return
    setLoading(true)
    setError(null)

    const result = await createOrder(
      tableId,
      cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        stationId: item.stationId,
        categoryId: item.categoryId,
      })),
      orderNotes || undefined,
      isAddition
    )

    if ("error" in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    await sendToKitchen(result.orderId)
    router.push("/active")
  }

  const cartGroups = categories
    .map((cat) => ({
      cat,
      items: cart.filter((ci) => ci.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0)

  const cartContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
        {cart.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-sm">El carrito está vacío</p>
          </div>
        ) : cartGroups.length > 1 ? (
          cartGroups.map((g) => (
            <div key={g.cat.id}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100">
                <CategoryIcon icon={g.cat.icon} className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{g.cat.name}</span>
              </div>
              {g.items.map((item) => (
                <CartItem
                  key={item.menuItemId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onUpdateNotes={updateNotes}
                />
              ))}
            </div>
          ))
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.menuItemId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onUpdateNotes={updateNotes}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-zinc-200 pt-4 space-y-3 shrink-0">
          <Textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Notas generales de la orden..."
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center justify-between font-bold text-zinc-900">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
          >
            Enviar a cocina
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-zinc-900">Mesa {tableNumber}</h2>
          {isAddition && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              + Adición
            </span>
          )}
        </div>

        {/* Cart button — solo visible en mobile */}
        <div className="md:hidden">
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative min-h-[44px] min-w-[44px]">
                <ShoppingCartIcon className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
              <SheetHeader>
                <SheetTitle>Carrito — Mesa {tableNumber}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden mt-4">
                {cartContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex flex-1 min-h-0">
        {/* Columna izquierda: categorías + grid de platos */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Search bar */}
          <div className="px-3 py-2 bg-white border-b border-zinc-200 shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" weight="regular" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plato..."
                className="w-full min-h-[40px] pl-9 pr-9 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label="Limpiar búsqueda"
                >
                  <XIcon className="w-4 h-4" weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          <div className={`overflow-x-auto bg-white border-b border-zinc-200 shrink-0 ${q ? "opacity-40 pointer-events-none" : ""}`}>
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="flex w-max h-auto gap-1 px-3 py-2 bg-transparent">
                {categories.map((cat) => {
                  const count = cart
                    .filter((item) =>
                      menuItems.find((m) => m.id === item.menuItemId)?.category_id === cat.id
                    )
                    .reduce((sum, i) => sum + i.quantity, 0)
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="min-h-[44px] shrink-0 flex items-center gap-1.5"
                    >
                      <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const cartEntry = cart.find((c) => c.menuItemId === item.id)
                return (
                  <MenuItemCard
                    key={item.id}
                    {...item}
                    quantity={cartEntry?.quantity ?? 0}
                    onAdd={() => addToCart(item)}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel derecho persistente — visible en md+ */}
        <aside className="hidden md:flex w-80 border-l border-zinc-200 bg-white flex-col shrink-0">
          <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900">
                {isAddition ? "Adición" : "Orden"} — Mesa {tableNumber}
              </h3>
              {isAddition && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">+</span>
              )}
            </div>
            {totalItems > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {totalItems} ítem{totalItems !== 1 ? "s" : ""} · {formatCurrency(totalPrice)}
              </p>
            )}
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-hidden">
            {cartContent}
          </div>
        </aside>
      </div>

      {/* Bottom bar en mobile cuando hay ítems */}
      {totalItems > 0 && (
        <div className="md:hidden bg-white border-t border-zinc-200 p-3 shrink-0">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 font-semibold"
          >
            Ver carrito ({totalItems}) · {formatCurrency(totalPrice)}
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              Confirmar envío — Mesa {tableNumber}
              {isAddition && (
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  + Adición
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {cartGroups.length > 1 ? (
              <div className="space-y-3">
                {cartGroups.map((g) => (
                  <div key={g.cat.id}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CategoryIcon icon={g.cat.icon} className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{g.cat.name}</span>
                    </div>
                    <ul className="space-y-1">
                      {g.items.map((item) => (
                        <li key={item.menuItemId} className="flex justify-between gap-2 text-sm">
                          <span className="text-zinc-700">
                            <span className="font-semibold text-zinc-900">{item.quantity}×</span>{" "}
                            {item.name}
                            {item.notes && <span className="text-zinc-400 italic"> — {item.notes}</span>}
                          </span>
                          <span className="text-zinc-500 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {cart.map((item) => (
                  <li key={item.menuItemId} className="flex justify-between gap-2 text-sm">
                    <span className="text-zinc-700">
                      <span className="font-semibold text-zinc-900">{item.quantity}×</span>{" "}
                      {item.name}
                      {item.notes && (
                        <span className="text-zinc-400 italic"> — {item.notes}</span>
                      )}
                    </span>
                    <span className="text-zinc-500 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {orderNotes && (
              <p className="text-sm text-zinc-500 border-t border-zinc-200 pt-2 italic">
                Nota: {orderNotes}
              </p>
            )}

            <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
              className="min-h-[44px] flex-1"
            >
              Revisar
            </Button>
            <Button
              onClick={handleSendToKitchen}
              disabled={loading}
              className="min-h-[44px] flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              {loading ? "Enviando..." : "Confirmar y enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
