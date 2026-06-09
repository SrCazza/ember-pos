# Restaurante POS — Blueprint

> Generado por The Architect — 2026-06-08
> Archetype: Internal Tool / Operational System (con Real-time)

---

## 1. Project Overview

### Vision

Sistema POS web para restaurante orientado a dispositivos táctiles (tablets y teléfonos). Permite a camareros tomar pedidos desde un menú digital, a la cocina recibir y gestionar órdenes en tiempo real desde pantallas de cocina, y al administrador monitorear operaciones y consultar reportes de desempeño.

El sistema opera siempre en red WiFi local. No requiere conectividad a internet externa para el flujo operativo principal (pedidos, cocina), aunque el hosting es remoto.

### Goals

- Eliminar la hoja de papel y reducir errores de comunicación cocina-sala
- Dar visibilidad en tiempo real del estado de cada mesa y orden
- Ofrecer datos accionables al administrador: ventas, platos top, tiempos de cocina

### Success Metrics

- Orden creada y visible en cocina en < 1 segundo
- UI 100% operativa en iPad (768px) y iPhone (390px)
- Admin puede consultar ventas del día sin fricción

---

## 2. Tech Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | Next.js 15 (App Router) | SSR para reportes, Client Components para real-time, routing por grupos |
| Lenguaje | TypeScript (strict) | Tipos generados desde Supabase, seguridad de datos en orden/menú |
| Estilos | Tailwind CSS v4 | Estándar, touch utilities nativas, breakpoints mobile-first |
| Componentes | shadcn/ui | Accesible, customizable, funciona sin JS para skeletons |
| Charts | Recharts | Ligero, composable, fácil integración con React state |
| Tablas | TanStack Table | Paginación server-side para historial de órdenes |
| Database | Supabase (PostgreSQL) | Auth + Realtime + Storage + RLS en un solo servicio |
| Real-time | Supabase Realtime | WebSockets over Postgres, zero infra adicional, filtra por canal |
| Auth | Supabase Auth + tabla `profiles` | Roles en DB, RLS enforcement sin servidor propio |
| Storage | Supabase Storage | Imágenes de platos, mismo SDK, bucket `menu-images` |
| Hosting | Vercel | Compatible con Supabase Realtime en serverless, preview por rama |
| Package Manager | pnpm | Velocidad, workspaces si se extiende |

---

## 3. Directory Structure

```
restaurante-pos/
  src/
    app/
      (auth)/
        login/
          page.tsx              # Login único para todos los roles
        layout.tsx              # Layout sin nav para auth
      (waiter)/
        layout.tsx              # Role guard: solo 'waiter'
        tables/
          page.tsx              # Grid táctil de mesas con estados
        order/
          [tableId]/
            page.tsx            # Constructor de pedido (categorías + carrito)
        active/
          page.tsx              # Mis mesas activas (read-only, estado actualizado)
      (kitchen)/
        layout.tsx              # Role guard: solo 'kitchen', layout full-screen
        display/
          page.tsx              # KDS — Kitchen Display System (real-time)
      (admin)/
        layout.tsx              # Role guard: solo 'admin', sidebar
        dashboard/
          page.tsx              # Overview: órdenes activas + mapa mesas (RT)
        menu/
          page.tsx              # Resumen: categorías + estaciones
          categories/
            page.tsx            # CRUD categorías
          stations/
            page.tsx            # CRUD estaciones de cocina
          items/
            page.tsx            # Lista de platos (con filtro)
            new/
              page.tsx          # Crear plato
            [id]/
              page.tsx          # Editar plato
        reports/
          page.tsx              # Analytics: ventas, top platos, tiempos
        users/
          page.tsx              # Gestión de usuarios del sistema
        tables/
          page.tsx              # Config de mesas (capacidad, número)
      api/
        reports/
          route.ts              # GET /api/reports?period=today|week|month
      globals.css
      layout.tsx                # Root layout (fuente Inter, metadata)
    components/
      ui/                       # shadcn/ui primitives generados
      waiter/
        TableGrid.tsx           # Grid responsive de mesas
        TableCard.tsx           # Tarjeta táctil de mesa (status coloreado)
        OrderBuilder.tsx        # Shell del constructor de pedido
        CategoryTabs.tsx        # Tabs con scroll horizontal para categorías
        MenuItemGrid.tsx        # Grid de platos (2 col mobile, 3 col tablet)
        MenuItemCard.tsx        # Tarjeta de plato con precio e imagen
        CartPanel.tsx           # Panel del carrito (slide-up mobile, aside tablet)
        CartItem.tsx            # Ítem en carrito con inline notes
        NotesModal.tsx          # Modal para agregar nota a un ítem
      kitchen/
        KitchenDisplay.tsx      # Client Component con suscripción Realtime
        OrderCard.tsx           # Tarjeta de orden (mesa, ítems, timer, acciones)
        OrderItemRow.tsx        # Fila de ítem con checkbox para marcar listo
        StationFilterBar.tsx    # Filtro horizontal de estaciones
        OrderTimer.tsx          # Timer mm:ss en tiempo real, coloreado por urgencia
      admin/
        LiveDashboard.tsx       # Client Component con suscripción RT
        KPICard.tsx             # Tarjeta de métrica (órdenes, ventas, tiempo)
        TableStatusMap.tsx      # Grid visual del estado de todas las mesas
        ActiveOrdersList.tsx    # Lista scrollable de órdenes activas
        SalesChart.tsx          # BarChart de ventas por período (Recharts)
        TopDishesChart.tsx      # BarChart horizontal de platos más pedidos
        KitchenTimeChart.tsx    # LineChart de tiempo promedio de preparación
        WaiterStatsTable.tsx    # TanStack Table de métricas por camarero
        MenuItemForm.tsx        # Formulario create/edit de plato (con upload)
        CategoryForm.tsx        # Formulario create/edit de categoría
        StationForm.tsx         # Formulario create/edit de estación
        UserForm.tsx            # Formulario crear usuario con rol
      shared/
        StatusBadge.tsx         # Badge con color según status de orden
        ConfirmDialog.tsx       # Dialog de confirmación para acciones destructivas
        EmptyState.tsx          # Estado vacío reutilizable
        PageHeader.tsx          # Header con título + breadcrumb + acciones
    lib/
      supabase/
        client.ts               # createBrowserClient() — para componentes client
        server.ts               # createServerClient() — para server components/actions
      actions/
        orders.ts               # createOrder, updateOrderStatus, cancelOrder
        order-items.ts          # updateItemStatus (cocina marca ítem listo)
        menu.ts                 # CRUD items, categories, stations
        users.ts                # createUser, updateRole, deactivateUser
        tables.ts               # updateTableStatus
      utils/
        formatters.ts           # formatCurrency, formatDuration, formatRelativeTime
        order-status.ts         # STATUS_LABELS, STATUS_COLORS, getNextStatus()
        cn.ts                   # cn() helper (clsx + twMerge)
    types/
      database.ts               # Generado: npx supabase gen types typescript
      index.ts                  # Re-exports + domain types compuestos
    middleware.ts                # Session refresh + redirección por rol
  supabase/
    migrations/
      001_schema.sql            # CREATE TABLE statements
      002_rls.sql               # Row Level Security policies
      003_functions.sql         # handle_new_user() trigger function
    seed.sql                    # Demo data: estaciones, categorías, platos, mesas
  public/
    logo.svg
  .env.local                    # NUNCA commitear
  .env.example                  # Template con keys vacías
  next.config.ts
  tailwind.config.ts
  components.json               # shadcn/ui config
  tsconfig.json
  package.json
```

---

## 4. Data Model

### Entities

**profiles** _(extiende auth.users de Supabase)_
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | = auth.users.id |
| name | TEXT | Nombre para mostrar |
| role | TEXT | `waiter` \| `kitchen` \| `admin` |
| is_active | BOOLEAN | Default true; false = no puede iniciar sesión |
| created_at | TIMESTAMPTZ | Default NOW() |

**kitchen_stations** _(estaciones de cocina)_
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | TEXT | Ej: "Parrilla", "Fríos", "Barra" |
| display_order | INT | Orden en filtros y UI |
| color | TEXT | Hex color para identificación visual |

**menu_categories**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | TEXT | Ej: "Carnes al Carbón" |
| icon | TEXT | Emoji o nombre de icono Lucide |
| display_order | INT | |

**menu_items**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| description | TEXT | Nullable |
| price | DECIMAL(10,2) | |
| image_url | TEXT | Nullable, Supabase Storage URL |
| category_id | UUID FK | → menu_categories |
| station_id | UUID FK | → kitchen_stations |
| is_available | BOOLEAN | Default true |
| display_order | INT | |

**restaurant_tables**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| number | INT UNIQUE | Número visible (1–10) |
| capacity | INT | |
| status | TEXT | `available` \| `occupied` \| `reserved` |

**orders**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| table_id | UUID FK | → restaurant_tables |
| waiter_id | UUID FK | → profiles |
| status | TEXT | `pending` \| `in_kitchen` \| `ready` \| `delivered` \| `cancelled` |
| notes | TEXT | Nota general de la orden (nullable) |
| created_at | TIMESTAMPTZ | |
| sent_to_kitchen_at | TIMESTAMPTZ | Nullable |
| ready_at | TIMESTAMPTZ | Nullable |
| delivered_at | TIMESTAMPTZ | Nullable |

**order_items**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| order_id | UUID FK | → orders (ON DELETE CASCADE) |
| menu_item_id | UUID FK | → menu_items |
| quantity | INT | Default 1 |
| notes | TEXT | Ej: "sin cebolla" (nullable) |
| station_id | UUID FK | Desnormalizado de menu_items.station_id para filtro cocina |
| status | TEXT | `pending` \| `ready` |

### Relationships
- `profiles` 1→N `orders` (un camarero tiene muchas órdenes)
- `restaurant_tables` 1→N `orders`
- `orders` 1→N `order_items`
- `menu_items` 1→N `order_items`
- `kitchen_stations` 1→N `menu_items` y 1→N `order_items`

### State Machine de Órdenes
```
pending → in_kitchen → ready → delivered
    └──────────────────────────→ cancelled
```
- `pending`: creada por camarero, aún no enviada a cocina
- `in_kitchen`: enviada, visible en KDS
- `ready`: cocina marcó todos los ítems listos
- `delivered`: camarero confirmó entrega (opcional en v1)
- `cancelled`: cancelada antes de llegar a cocina (o por admin)

### Database Schema (SQL para migrations)

```sql
-- 001_schema.sql

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('waiter', 'kitchen', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES menu_categories(id),
  station_id UUID NOT NULL REFERENCES kitchen_stations(id),
  is_available BOOLEAN DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES restaurant_tables(id),
  waiter_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_kitchen', 'ready', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_to_kitchen_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  station_id UUID NOT NULL REFERENCES kitchen_stations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes críticos
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_station ON order_items(station_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
```

```sql
-- 002_rls.sql

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper function para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- profiles: cada usuario lee su propio perfil; admin lee todos
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  USING (auth.uid() = id OR get_user_role() = 'admin');
CREATE POLICY "profiles_admin_write" ON profiles FOR ALL
  USING (get_user_role() = 'admin');

-- menú: todos leen; solo admin escribe
CREATE POLICY "menu_items_read" ON menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_admin_write" ON menu_items FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "menu_categories_read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "menu_categories_admin_write" ON menu_categories FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "kitchen_stations_read" ON kitchen_stations FOR SELECT USING (true);
CREATE POLICY "kitchen_stations_admin_write" ON kitchen_stations FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "restaurant_tables_read" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "restaurant_tables_admin_write" ON restaurant_tables FOR ALL
  USING (get_user_role() = 'admin');

-- orders: waiter ve las suyas; kitchen/admin ven todas activas
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  waiter_id = auth.uid() OR get_user_role() IN ('kitchen', 'admin')
);
CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (waiter_id = auth.uid());
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  (waiter_id = auth.uid() AND status = 'pending') OR
  get_user_role() IN ('kitchen', 'admin')
);

-- order_items: siguen permisos de su orden padre
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id
    AND (o.waiter_id = auth.uid() OR get_user_role() IN ('kitchen', 'admin'))
  )
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id
    AND o.waiter_id = auth.uid() AND o.status = 'pending')
);
CREATE POLICY "order_items_update" ON order_items FOR UPDATE USING (
  get_user_role() IN ('kitchen', 'admin')
);
```

```sql
-- 003_functions.sql

-- Auto-crear profile cuando se registra un usuario en auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'waiter')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 5. API Design

La mayor parte del acceso a datos usa **Server Components** (lectura directa Supabase) y **Server Actions** (mutaciones). Solo se necesita una API route para reportes complejos.

### Server Actions

**`lib/actions/orders.ts`**
```typescript
// createOrder(tableId, items: {menuItemId, quantity, notes, stationId}[], notes?)
//   → Inserta order + order_items en transacción, actualiza table.status = 'occupied'
//   → Retorna: { orderId: string } | { error: string }

// sendToKitchen(orderId)
//   → Actualiza order.status = 'in_kitchen', order.sent_to_kitchen_at = NOW()

// markOrderReady(orderId)
//   → Actualiza order.status = 'ready', order.ready_at = NOW()

// markOrderDelivered(orderId)
//   → Actualiza order.status = 'delivered', order.delivered_at = NOW()
//   → Actualiza table.status = 'available' si no hay más órdenes activas

// cancelOrder(orderId)
//   → Solo si status = 'pending' | 'in_kitchen' (con confirmación)
```

**`lib/actions/order-items.ts`**
```typescript
// markItemReady(itemId)
//   → Actualiza order_items.status = 'ready'
//   → Si todos los ítems de la orden están 'ready' → llama markOrderReady()
```

**`lib/actions/menu.ts`**
```typescript
// createMenuItem(data: MenuItemInput) → { id } | { error }
// updateMenuItem(id, data: Partial<MenuItemInput>)
// toggleItemAvailability(id)
// deleteMenuItem(id)  // solo si no tiene order_items asociados
// createCategory(name, icon) / updateCategory(id, data) / deleteCategory(id)
// createStation(name, color) / updateStation(id, data)
```

**`lib/actions/users.ts`**
```typescript
// createUser(email, name, role)
//   → supabase.auth.admin.createUser({ email, password: generada, user_metadata: {name, role} })
//   → Envía email de bienvenida con contraseña temporal vía Supabase
// updateUserRole(userId, role)
// deactivateUser(userId)
```

### API Routes

**`GET /api/reports?period=today|week|month|custom&from=&to=`**
```typescript
// Retorna JSON con:
{
  totalRevenue: number,
  totalOrders: number,
  avgKitchenTimeMinutes: number,
  salesByDay: { date: string, revenue: number, orders: number }[],
  topDishes: { name: string, count: number, revenue: number }[],
  kitchenTimeByDay: { date: string, avgMinutes: number }[],
  waiterStats: { name: string, orders: number, revenue: number }[]
}
```

---

## 6. Frontend Architecture

### Pages / Routes

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/login` | todos | Login con email + password |
| `/tables` | waiter | Grid de mesas: verde=libre, rojo=ocupada |
| `/order/[tableId]` | waiter | Constructor: tabs categorías + grid platos + carrito |
| `/active` | waiter | Mis órdenes activas con estado actualizado |
| `/display` | kitchen | KDS full-screen: tarjetas ordenadas por antigüedad |
| `/dashboard` | admin | KPIs en vivo + mapa mesas + lista órdenes activas |
| `/menu` | admin | Nav hacia categorías, estaciones, platos |
| `/menu/items` | admin | Lista de platos con filtro por categoría/estación |
| `/menu/items/new` | admin | Formulario crear plato |
| `/menu/items/[id]` | admin | Formulario editar plato |
| `/reports` | admin | Dashboard analítico con selector de período |
| `/users` | admin | Lista usuarios + formulario crear/editar |
| `/tables` (admin) | admin | Config de mesas: número, capacidad |

### Component Hierarchy — Página Clave: Order Builder

```
OrderBuilderPage (Server Component — carga menú inicial)
└── OrderBuilder (Client Component — estado del carrito)
    ├── CategoryTabs (scroll horizontal, touch-friendly)
    │   └── Tab[] (cada categoría)
    ├── MenuItemGrid
    │   └── MenuItemCard[] (imagen, nombre, precio, botón +)
    │       └── NotesModal (dialog para nota del ítem)
    ├── CartPanel (aside en tablet, slide-up en mobile)
    │   ├── CartItem[] (cantidad, notas inline, botón -)
    │   ├── OrderNotesInput (nota general)
    │   └── SendToKitchenButton (Server Action)
    └── EmptyCartPlaceholder
```

### Component Hierarchy — KDS (Kitchen Display)

```
KitchenDisplayPage (Server Component — carga config estaciones)
└── KitchenDisplay (Client Component — Supabase Realtime)
    ├── StationFilterBar (tabs de estaciones)
    └── OrdersGrid (layout: auto-fill, columnas según pantalla)
        └── OrderCard[] (orden por created_at ASC — más antiguo primero)
            ├── OrderHeader (mesa, camarero, hora)
            ├── OrderTimer (mm:ss, rojo si > 15 min)
            ├── OrderItemRow[] (checkbox + nombre + notas)
            └── MarkReadyButton (Server Action)
```

### State Management

| Tipo de dato | Estrategia |
|-------------|-----------|
| Menú (categorías, platos) | Server Component — fetch directo Supabase server |
| Carrito del pedido | Client Component — `useState` local, no necesita server hasta submit |
| Órdenes activas (KDS) | Client Component — Supabase Realtime `postgres_changes` |
| Dashboard live | Client Component — Supabase Realtime |
| Reportes / analytics | Server Component + `/api/reports` para queries complejos |
| Perfil usuario actual | Server Component → prop drilling o `Context` mínimo |

**Patrón Realtime (KDS y Dashboard):**
```typescript
// Suscripción en useEffect
const channel = supabase
  .channel('kitchen-orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `status=eq.in_kitchen`
  }, (payload) => {
    // Actualizar estado local
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'order_items',
  }, (payload) => {
    // Actualizar ítems
  })
  .subscribe()

return () => supabase.removeChannel(channel)
```

---

## 7. Design System

### Colors

| Rol | Token Tailwind | Hex | Uso |
|-----|---------------|-----|-----|
| Primary | `emerald-600` | `#059669` | Botones primarios, acciones positivas |
| Primary hover | `emerald-700` | `#047857` | Hover en primary |
| Background | `white` | `#FFFFFF` | Fondo de página |
| Surface | `zinc-50` | `#FAFAFA` | Cards, paneles, inputs |
| Border | `zinc-200` | `#E4E4E7` | Separadores, bordes |
| Text primary | `zinc-900` | `#18181B` | Texto principal |
| Text secondary | `zinc-500` | `#71717A` | Labels, texto secundario |
| Destructive | `red-600` | `#DC2626` | Cancelar, eliminar |
| Status: pending | `amber-500` | `#F59E0B` | Orden pendiente |
| Status: in_kitchen | `blue-600` | `#2563EB` | En cocina |
| Status: ready | `emerald-600` | `#059669` | Listo |
| Status: delivered | `zinc-400` | `#A1A1AA` | Entregado |
| Kitchen urgency | `red-500` | `#EF4444` | Timer > 15 min |

### Typography

| Rol | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Heading xl | Inter | 24px / 1.5rem | 700 |
| Heading lg | Inter | 20px / 1.25rem | 600 |
| Body | Inter | 16px / 1rem | 400 |
| Small / Label | Inter | 14px / 0.875rem | 400–500 |
| Kitchen number (mesa) | Inter | 36px / 2.25rem | 700 |
| Kitchen item | Inter | 18px / 1.125rem | 500 |
| Menu item name | Inter | 15px / 0.9375rem | 600 |
| Price | Inter | 16px / 1rem | 700 |

Cargar con `next/font/google`: `Inter({ subsets: ['latin'], variable: '--font-inter' })`

### Spacing & Layout

- Base: 4px — escala: 4, 8, 12, 16, 20, 24, 32, 48, 64
- Border radius: `rounded-lg` (8px) para cards, `rounded-xl` (12px) para modales, `rounded-full` para avatares/badges
- Shadows: `shadow-sm` por defecto, `shadow-md` para modales y CartPanel
- Max content width: `max-w-7xl` en admin, full-width en waiter/kitchen
- Touch targets: **mínimo 44×44px** en TODOS los botones táctiles
- Breakpoints clave: `sm` (640px), `md` (768px — iPad), `lg` (1024px)

### Component Style

Clean y funcional. Sin decoraciones innecesarias. Bordes sutiles (`zinc-200`), no shadows pesadas. Cards con `rounded-xl bg-white border border-zinc-200`. Botones primarios `bg-emerald-600 text-white rounded-lg`. Kitchen display: fondo `zinc-50`, tarjetas con borde izquierdo coloreado según urgencia. No hay animaciones decorativas — solo transiciones funcionales (`transition-colors`, fade en modales).

---

## 8. Authentication & Authorization

### Auth Flow

1. Admin crea usuarios vía `/users` (usa Supabase Auth Admin API con `supabase.auth.admin.createUser`)
2. Usuario recibe email con contraseña temporal → cambia al primer login
3. Login en `/login` con email + password → Supabase Auth → cookie de sesión
4. `middleware.ts` verifica sesión en cada request; redirige `/login` si no hay sesión
5. Post-login: middleware lee `profiles.role` → redirige según rol:
   - `waiter` → `/tables`
   - `kitchen` → `/display`
   - `admin` → `/dashboard`

### Protected Routes

| Prefijo | Acceso |
|---------|--------|
| `/login` | público |
| `/(waiter)/*` | role = `waiter` |
| `/(kitchen)/*` | role = `kitchen` |
| `/(admin)/*` | role = `admin` |

### Roles & Permissions

| Rol | Puede hacer |
|-----|-------------|
| `waiter` | Ver menú, crear órdenes en sus mesas, enviar a cocina, ver sus órdenes activas |
| `kitchen` | Ver todas las órdenes `in_kitchen`, filtrar por estación, marcar ítems/órdenes listos |
| `admin` | Todo lo anterior + gestión de menú + gestión de usuarios + reportes + config de mesas |

### Session Management

Supabase Auth con cookies HTTP-only via `@supabase/ssr`. Refresh automático en middleware. No se usa localStorage. Middleware en `src/middleware.ts` llama `supabase.auth.getUser()` en cada request y refresca el token si expira.

```typescript
// src/middleware.ts — patrón base
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* getAll/setAll via request/supabaseResponse */ } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    // Redirigir según rol si está en /login
    // Bloquear acceso si el rol no coincide con la ruta
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

---

## 9. Build Order

**Step 1: Project Scaffolding**
```bash
pnpm create next-app@latest restaurante-pos \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd restaurante-pos

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# shadcn/ui
pnpm dlx shadcn@latest init
# Instalar componentes base: button, dialog, input, label, select, tabs,
# badge, card, dropdown-menu, sheet, skeleton, toast, separator

# Charts y tablas
pnpm add recharts @tanstack/react-table

# Utilidades
pnpm add lucide-react date-fns clsx tailwind-merge class-variance-authority

# CLI Supabase (dev)
pnpm add -D supabase
```
Configurar `tsconfig.json` con `"strict": true`. Crear `.env.local` con keys de Supabase.

**Step 2: Supabase Schema & Seed**
```bash
npx supabase login
npx supabase init
npx supabase link --project-ref <TU_PROJECT_REF>
```
Crear `supabase/migrations/001_schema.sql`, `002_rls.sql`, `003_functions.sql` con el SQL de la Sección 4.
Crear `supabase/seed.sql` con los datos demo (ver Sección 10).
```bash
npx supabase db push
npx supabase db seed
# Generar tipos TypeScript
npx supabase gen types typescript --project-id <ID> > src/types/database.ts
```
En Supabase Dashboard → Storage: crear bucket `menu-images` (público).
En Auth → Settings: habilitar confirmación de email desactivada (sistema interno).

**Step 3: Auth + Middleware**
Crear `src/lib/supabase/client.ts` y `server.ts` siguiendo la guía oficial de `@supabase/ssr`.
Crear `src/middleware.ts` con sesión + redirección por rol (ver Sección 8).
Crear `src/app/(auth)/login/page.tsx` — formulario email/password, sin registro público.
Crear usuario admin inicial vía Supabase Dashboard → Authentication → Users.
Verificar flujo completo: login → redirección por rol → logout.

**Step 4: Admin — Gestión de Menú**
Crear layout admin con sidebar: links a Dashboard, Menú, Reportes, Usuarios, Mesas.
Crear páginas y Server Actions para:
- Estaciones de cocina: lista, crear, editar, eliminar
- Categorías: lista, crear, editar, eliminar
- Platos: lista con filtros, crear (con upload a Supabase Storage), editar, toggle disponibilidad
Componentes: `MenuItemForm`, `CategoryForm`, `StationForm`, `PageHeader`.
Validar que RLS funciona: solo admin puede escribir.

**Step 5: Waiter — Selección de Mesa**
Crear `src/app/(waiter)/tables/page.tsx` (Server Component — fetch lista mesas).
Crear `TableGrid.tsx`: grid responsive `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
Crear `TableCard.tsx`: número grande, capacidad, badge de estado, mínimo 80×80px táctil.
Click en mesa disponible → navegar a `/order/[tableId]`.
Mesa ocupada → mostrar info de la orden activa.
Layout waiter: sin sidebar, bottombar de navegación en mobile (`/tables`, `/active`).

**Step 6: Waiter — Constructor de Pedido**
`/order/[tableId]/page.tsx`: Server Component carga `menuItems` con `categories` joins.
`OrderBuilder.tsx` (Client Component): gestiona estado del carrito con `useState`.
`CategoryTabs.tsx`: scroll horizontal, badge con count de ítems en carrito por categoría.
`MenuItemGrid.tsx`: 2 cols en mobile, 3 en tablet. Imagen con `next/image`, precio, +/-.
`CartPanel.tsx`: `Sheet` de shadcn en mobile (slide desde abajo), `aside` en `md+`.
`CartItem.tsx`: nombre, cantidad con +/-, notas (click abre `NotesModal`), precio subtotal.
`NotesModal.tsx`: Dialog con `Textarea` libre.
Botón "Enviar a Cocina": llama Server Action `sendToKitchen()`, redirige a `/active`.
Auto-actualizar `restaurant_tables.status = 'occupied'` al enviar.

**Step 7: Kitchen Display (KDS)**
`/display/page.tsx`: Server Component minimal, carga config de estaciones para pasar al cliente.
`KitchenDisplay.tsx` (Client Component): suscripción Realtime a `orders` + `order_items`.
Al montar: fetch inicial de órdenes `in_kitchen` con `order_items` + `menu_items`.
Suscribir a cambios → merge con estado local.
`StationFilterBar.tsx`: filtro multi-select; cuando filtrado, mostrar solo `order_items` de esa estación en cada card.
`OrderCard.tsx`: borde izquierdo coloreado por urgencia. Timer: `useInterval` cada segundo.
`OrderItemRow.tsx`: checkbox → llama Server Action `markItemReady()`.
Cuando todos los ítems de la orden están `ready` → auto-marcar orden `ready` (en la SA).
Layout cocina: full-screen, sin nav, fondo `zinc-50`, tipografía grande.

**Step 8: Admin — Dashboard Live**
`/dashboard/page.tsx`: Server Component carga KPIs iniciales (órdenes hoy, revenue, avg time).
`LiveDashboard.tsx` (Client Component): Realtime para KPIs en tiempo real.
`KPICard.tsx` ×4: Órdenes activas, Revenue del día, Tiempo promedio prep, Mesas ocupadas.
`TableStatusMap.tsx`: grid de todas las mesas con color según status.
`ActiveOrdersList.tsx`: lista scrollable, status badge, camarero, timer desde creación.

**Step 9: Admin — Reportes**
`/reports/page.tsx` (Client Component — necesita interactividad para selector de período).
Selector de período: Hoy / Esta semana / Este mes / Rango custom (DatePicker shadcn).
Fetch a `/api/reports?period=...` → Recharts.
`SalesChart.tsx`: `BarChart` revenue + orders por día.
`TopDishesChart.tsx`: `BarChart` horizontal, top 10 platos por cantidad.
`KitchenTimeChart.tsx`: `LineChart` tiempo promedio por día.
`WaiterStatsTable.tsx`: TanStack Table — nombre, órdenes, revenue, tiempo promedio.
Botón "Exportar CSV" → genera y descarga en cliente.

**Step 10: Admin — Gestión de Usuarios**
`/users/page.tsx`: lista de usuarios del sistema con badge de rol.
Server Action `createUser()`: llama Supabase Auth Admin API (requiere `service_role` key — solo en server).
`UserForm.tsx`: nombre, email, rol. Al crear: Supabase genera invite email.
Editar rol, desactivar usuario (actualiza `profiles.is_active`).
**Importante**: `service_role` key solo en Server Actions, nunca en client.

**Step 11: Touch & Responsive Polish**
- Revisar todos los botones: `min-h-[44px] min-w-[44px]`
- Waiter mobile: bottom nav con icons Lucide, active state con `emerald-600`
- Kitchen: `overflow-hidden` en body, scroll solo dentro del grid de órdenes
- Menu grid: imágenes placeholder si `image_url` es null (`/placeholder-dish.svg`)
- Agregar `loading.tsx` en rutas lentas (reports, lista platos)
- Agregar `error.tsx` con botón retry
- Probar en DevTools: iPhone SE (390px), iPad (768px), Desktop (1280px)

**Step 12: Deploy**
```bash
# Instalar Vercel CLI
pnpm add -g vercel
vercel --prod
```
Variables de entorno en Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

En Supabase Dashboard → Auth → URL Configuration:
- Site URL: `https://tu-dominio.vercel.app`
- Redirect URLs: `https://tu-dominio.vercel.app/auth/callback`

---

## 10. Environment Setup

### Prerequisites
- Node.js 20+
- pnpm: `npm install -g pnpm`
- Cuenta en [supabase.com](https://supabase.com) (plan Free es suficiente)
- Cuenta en [vercel.com](https://vercel.com)

### Environment Variables

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key de Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server) | Supabase Dashboard → Settings → API |

### Seed Data Demo

Ejecutar `supabase/seed.sql` con los siguientes datos:

**Estaciones de cocina:**
- Parrilla (#EF4444), display_order 1
- Fríos (#3B82F6), display_order 2
- Barra (#8B5CF6), display_order 3

**Categorías:**
- 🥩 Carnes al Carbón, display_order 1
- 🥗 Entradas y Fríos, display_order 2
- 🍮 Postres, display_order 3
- 🍹 Bebidas, display_order 4

**Platos demo (20 ítems):**

| Nombre | Precio | Categoría | Estación |
|--------|--------|-----------|----------|
| Picaña (250g) | $18.90 | Carnes | Parrilla |
| T-Bone Steak (300g) | $24.50 | Carnes | Parrilla |
| Costillas BBQ (500g) | $22.00 | Carnes | Parrilla |
| Lomo Saltado | $16.50 | Carnes | Parrilla |
| Chorizo Parrillero | $12.00 | Carnes | Parrilla |
| Hamburguesa Gourmet | $14.90 | Carnes | Parrilla |
| Brocheta de Pollo | $13.50 | Carnes | Parrilla |
| Ceviche Clásico | $13.90 | Entradas | Fríos |
| Causa Rellena | $9.50 | Entradas | Fríos |
| Ensalada Caesar | $10.50 | Entradas | Fríos |
| Carpaccio de Res | $14.00 | Entradas | Fríos |
| Tabla de Quesos | $15.00 | Entradas | Fríos |
| Tiramisú | $7.50 | Postres | Fríos |
| Brownie con Helado | $8.00 | Postres | Fríos |
| Cheesecake Maracuyá | $7.00 | Postres | Fríos |
| Mousse de Chocolate | $7.50 | Postres | Fríos |
| Agua Mineral | $3.00 | Bebidas | Barra |
| Limonada Natural | $5.50 | Bebidas | Barra |
| Chicha Morada | $5.00 | Bebidas | Barra |
| Pisco Sour | $10.00 | Bebidas | Barra |

**Mesas:** números 1–10, capacidad 4 (mesas 1,2,3,4), capacidad 6 (mesas 5,6,7,8), capacidad 2 (9,10).

**Usuarios demo** — crear vía Supabase Dashboard Auth después del deploy:
- `waiter@demo.com` / `waiter123` / role: waiter
- `kitchen@demo.com` / `kitchen123` / role: kitchen
- `admin@demo.com` / `admin123` / role: admin

---

## 11. Dependencies

### Core

| Package | Propósito |
|---------|-----------|
| `next` | Framework |
| `react` + `react-dom` | UI runtime |
| `typescript` | Lenguaje |
| `tailwindcss` | Estilos |
| `@supabase/supabase-js` | DB, Auth, Realtime, Storage |
| `@supabase/ssr` | Integración con Next.js App Router (cookies) |
| `recharts` | Charts en admin |
| `@tanstack/react-table` | Tabla de reportes |
| `lucide-react` | Iconos |
| `date-fns` | Formateo de fechas |
| `clsx` + `tailwind-merge` | Composición de clases CSS |
| `class-variance-authority` | Variantes de componentes (shadcn/ui) |

### shadcn/ui Components

Instalar con `pnpm dlx shadcn@latest add <nombre>`:
`button`, `card`, `badge`, `dialog`, `sheet`, `input`, `label`, `select`, `tabs`,
`textarea`, `separator`, `skeleton`, `dropdown-menu`, `toast`, `table`, `form`

### Dev

| Package | Propósito |
|---------|-----------|
| `supabase` | CLI para migrations y type gen |
| `@types/node` | Tipos Node.js |
| `eslint` + config | Linting |
| `prettier` | Formateo |

---

## 12. Deployment Strategy

### Hosting
Vercel. Sin configuración especial — Next.js en modo serverless. Supabase Realtime funciona desde el cliente browser, no desde el servidor, por lo que serverless no afecta la funcionalidad RT.

### CI/CD
Push a `main` → auto-deploy en Vercel. PRs → preview URL automática. Suficiente para un sistema operativo de restaurante.

### Environments
| Entorno | Branch | Supabase | URL |
|---------|--------|----------|-----|
| Desarrollo | local | proyecto dev | localhost:3000 |
| Producción | main | proyecto prod | vercel.app / dominio custom |

No se necesita staging para un sistema de restaurante — se prueba localmente antes de desplegar.

---

## 13. Testing Strategy

### Manual Testing (prioritario para este tipo de sistema)

Flujos críticos a verificar antes de cada deploy:
1. Login con cada rol → redirección correcta
2. Waiter crea orden → aparece en KDS en < 1 segundo
3. Kitchen marca ítem listo → cuando todos listos, orden cambia a `ready`
4. Admin ve en reportes la orden del test
5. Funciona en DevTools mobile (390px iPhone, 768px iPad)

### Unit Tests (Vitest)

Testear únicamente lógica pura:
- `order-status.ts` — `getNextStatus()` y helpers
- `formatters.ts` — `formatCurrency`, `formatDuration`
- Server Actions con Supabase mock mínimo

```bash
pnpm add -D vitest @testing-library/react @vitejs/plugin-react
```

### E2E (Playwright — opcional en v1)

Si se implementa, cubrir el flujo crítico end-to-end:
1. Login como waiter → seleccionar mesa → crear orden → enviar
2. Login como kitchen → ver orden → marcar lista
3. Login como admin → ver dashboard → ver reporte

```bash
pnpm add -D @playwright/test
```

---

## 14. Skills to Use During Build

| Skill | Cuándo usar | Por qué |
|-------|-------------|---------|
| `/shadcn-ui` | Step 1 (scaffolding) + Steps 4–8 | Setup inicial, buscar y customizar componentes (Sheet, Dialog, Tabs) |
| `/ui-ux-pro-max` | Step 5–7 (waiter, kitchen, dashboard UI) | Kitchen display card design, order builder layout táctil |
| `/frontend-design` | Steps 5, 6, 7 (waiter + kitchen UI) | Implementar el sistema visual de forma coherente |
| `/playwright-cli` | Step 13 (testing) | Automatizar flujo waiter→kitchen→admin |

@UI_GUIDELINES.md

---

## 15. CLAUDE.md for Target Project

```markdown
# Restaurante POS

Sistema POS web para restaurante con roles waiter/kitchen/admin, tiempo real en cocina, y reportes de gestión.

## Commands

- `pnpm dev` — Servidor de desarrollo (localhost:3000)
- `pnpm build` — Build de producción
- `pnpm lint` — ESLint
- `pnpm test` — Vitest
- `npx supabase db push` — Aplicar migrations a Supabase
- `npx supabase gen types typescript --project-id <ID> > src/types/database.ts` — Regenerar tipos

## Tech Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Supabase (DB, Auth, Realtime, Storage) + Recharts + TanStack Table + Vercel

## Architecture

### Directory Structure
- `src/app/(auth)/` — Login, sin nav
- `src/app/(waiter)/` — Rutas protegidas role=waiter
- `src/app/(kitchen)/` — Rutas protegidas role=kitchen  
- `src/app/(admin)/` — Rutas protegidas role=admin
- `src/components/waiter|kitchen|admin|shared/` — Componentes por dominio
- `src/lib/supabase/` — `client.ts` (browser), `server.ts` (SSR)
- `src/lib/actions/` — Server Actions (mutations)
- `src/types/database.ts` — Auto-generado desde Supabase, NO editar a mano

### Data Flow
Server Components leen datos directamente vía `lib/supabase/server.ts`.
Mutaciones van por Server Actions en `lib/actions/*.ts`.
Real-time: Client Components usan `lib/supabase/client.ts` para suscripciones Realtime.
API route solo en `/api/reports` para queries analíticos complejos.

### Key Patterns
- Server Components por defecto. `"use client"` solo cuando hay estado interactivo o Realtime.
- Supabase Realtime en `useEffect` con cleanup `supabase.removeChannel(channel)`.
- RLS en Supabase enforces permisos por rol — no reimplementar en app layer.
- `service_role` key solo en Server Actions, NUNCA en código cliente.
- `station_id` está desnormalizado en `order_items` para filtro eficiente en cocina.

## Code Organization Rules

1. Un componente por archivo. Máximo 300 líneas. Extraer sub-componentes si crece.
2. Path alias `@/` para `src/`. Importar directamente, sin barrel exports.
3. Server Components por defecto. `"use client"` solo cuando hay interactividad o suscripción RT.
4. Toda mutación de DB va por Server Actions (`lib/actions/*.ts`). Nunca llamar Supabase desde Client Components para writes.
5. Componentes de cocina deben tener tap targets mínimo 44×44px. Verificar antes de marcar como terminado.

## Design System

### Colors
- Primary: `emerald-600` (#059669) — botones, acciones positivas
- Background: `white` / `zinc-50` (surfaces)
- Text: `zinc-900` (primary), `zinc-500` (secondary)
- Border: `zinc-200`
- Status pending: `amber-500` | in_kitchen: `blue-600` | ready: `emerald-600` | delivered: `zinc-400`
- Kitchen urgency (>15min): `red-500`

### Typography
- Fuente: Inter (next/font). Variable: `--font-inter`
- Cocina: mesa `text-4xl font-bold`, ítems `text-lg font-medium`
- UI general: body `text-base`, labels `text-sm`

### Style
- Border radius: `rounded-lg` cards, `rounded-xl` modales
- Shadows: `shadow-sm` por defecto, `shadow-md` para overlays
- Touch targets: `min-h-[44px]` en todos los botones del flujo waiter/kitchen

## Environment Variables

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública, solo puede leer lo que RLS permite) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (privada, solo en Server Actions/API routes) |

## Reglas No Negociables

1. TypeScript strict mode. Cero `any`. Usar tipos de `src/types/database.ts`.
2. `SUPABASE_SERVICE_ROLE_KEY` solo en server-side. En un Client Component es un fallo de seguridad crítico.
3. Toda la lógica de roles está en RLS de Supabase y en middleware. No duplicar validaciones de rol en UI.
4. Estado de órdenes sigue la máquina de estados: pending → in_kitchen → ready → delivered. Nunca saltar estados arbitrariamente.
5. Mínimo 44×44px en tap targets del flujo operativo (waiter + kitchen). Es un requisito de UX no negociable.
6. Regenerar `src/types/database.ts` con `supabase gen types` después de cambiar el schema. Nunca editar ese archivo a mano.
```

---

## 16. Reglas No Negociables

1. **TypeScript strict.** `"strict": true` en `tsconfig.json`. Cero `any`. Los tipos de Supabase son la fuente de verdad.

2. **`SUPABASE_SERVICE_ROLE_KEY` solo en server.** Nunca exportar ni usar en Client Components. Si se necesita en un componente cliente, hay que refactorizar a Server Action.

3. **RLS como autorización real.** No depender solo de redirecciones o checks en UI. La BD rechaza operaciones no autorizadas. Las redirecciones son UX, no seguridad.

4. **Máquina de estados de órdenes respetada.** Nunca actualizar `status` a un valor que no siga el flujo definido. `getNextStatus()` en `lib/utils/order-status.ts` es la única fuente de transiciones válidas.

5. **Touch targets mínimo 44×44px** en el flujo operativo (camarero + cocina). Usar `min-h-[44px] min-w-[44px]` en Tailwind. Verificar en DevTools mobile antes de dar por terminado cualquier componente táctil.

6. **No reimplementar auth en la app layer.** El middleware protege rutas. RLS protege datos. Fuera de esos dos puntos, no hay checks de rol duplicados.

7. **Un Server Action por mutación atómica.** No dividir una operación que debe ser transaccional (e.g., crear orden + ítems + actualizar estado mesa) en múltiples llamadas separadas desde el cliente.

8. **Tipos regenerados del schema, no escritos a mano.** `src/types/database.ts` es auto-generado. Editarlo a mano y luego hacer migrations crea divergencias silenciosas.
