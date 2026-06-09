export type { Database } from "./database"

// Domain types compuestos
export type OrderStatus = "pending" | "in_kitchen" | "ready" | "delivered" | "cancelled"
export type OrderItemStatus = "pending" | "ready"
export type TableStatus = "available" | "occupied" | "reserved"
export type UserRole = "waiter" | "kitchen" | "admin"

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
  stationId: string
  categoryId: string
}

export interface MenuItemWithCategory {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  display_order: number
  category_id: string
  station_id: string
  menu_categories: {
    id: string
    name: string
    icon: string
    display_order: number
  }
  kitchen_stations: {
    id: string
    name: string
    color: string
  }
}

export interface OrderWithItems {
  id: string
  table_id: string
  waiter_id: string
  status: OrderStatus
  notes: string | null
  created_at: string
  sent_to_kitchen_at: string | null
  ready_at: string | null
  delivered_at: string | null
  restaurant_tables: {
    number: number
  }
  profiles: {
    name: string
  }
  order_items: {
    id: string
    quantity: number
    notes: string | null
    status: OrderItemStatus
    station_id: string
    menu_items: {
      id: string
      name: string
    }
    kitchen_stations: {
      id: string
      name: string
      color: string
    }
  }[]
}
