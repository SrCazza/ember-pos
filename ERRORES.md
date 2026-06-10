# ERRORES — Registro de errores cometidos

> Referencia rápida para no repetir los mismos errores.
> Actualizar cada vez que se identifique y corrija un nuevo error.

---

## E01 — Tailwind v4 + shadcn/ui: falta bloque `@theme inline`

**Fecha**: 2026-06-08
**Síntoma**: Dropdowns, popovers y selects aparecen con fondo negro ilegible en toda la app.
**Causa**: Tailwind v4 **NO** crea automáticamente utilidades de color desde variables CSS definidas en `:root`. shadcn/ui usa clases como `bg-popover`, `bg-card`, `text-muted-foreground` que dependen de que las variables CSS estén mapeadas a utilidades Tailwind mediante `@theme inline`. Sin ese bloque, los componentes reciben el color negro por defecto del navegador.
**Fix**: Añadir bloque `@theme inline` en `src/app/globals.css` antes de `@layer base`:
```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-popover: hsl(var(--popover));
  /* ... resto de variables ... */
}
```
**Archivo corregido**: `src/app/globals.css`
**Regla**: En Tailwind v4, cualquier variable CSS que se quiera usar como utilidad de color debe estar en `@theme inline`. No es automático.

---

## E02 — RLS PostgreSQL UPDATE sin `WITH CHECK` explícito bloquea transiciones de estado

**Fecha**: 2026-06-08
**Síntoma**: Las órdenes enviadas a cocina nunca aparecen en el KDS. El camarero envía la orden pero el estado no cambia.
**Causa**: PostgreSQL aplica la cláusula `USING` como `WITH CHECK` implícito cuando no se define `WITH CHECK` en una política UPDATE. La condición `(status = 'pending')` se evaluaba sobre la **fila resultante** (nueva), no la original. Al cambiar `status = 'pending' → 'in_kitchen'`, la nueva fila ya no cumple `status = 'pending'` → UPDATE rechazado silenciosamente. La orden queda en `pending` y nunca llega al KDS.
**Fix**: Siempre definir `WITH CHECK` explícito en políticas UPDATE que involucren máquinas de estado:
```sql
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    (waiter_id = auth.uid() AND status = 'pending') OR
    get_user_role() IN ('kitchen', 'admin')
  )
  WITH CHECK (
    waiter_id = auth.uid() OR
    get_user_role() IN ('kitchen', 'admin')
  );
```
**Archivo corregido**: `supabase/migrations/005_rls_orders_fix.sql`
**Regla**: En políticas RLS con FOR UPDATE, `USING` filtra qué filas se pueden modificar (basado en valores ANTERIORES). `WITH CHECK` valida los valores NUEVOS. Sin `WITH CHECK`, PostgreSQL usa `USING` para ambos — lo que rompe cualquier transición de estado.

---

## E03 — RLS `restaurant_tables` demasiado restrictiva: solo admin podía hacer UPDATE

**Fecha**: 2026-06-08
**Síntoma**: Las mesas siempre aparecen como "Libre" aunque el camarero haya creado una orden.
**Causa**: La política `restaurant_tables_admin_write` cubría `FOR ALL` solo para rol admin. El Server Action `createOrder` actualiza `restaurant_tables.status = 'occupied'` con la sesión del camarero → Supabase rechaza la operación silenciosamente (sin error, solo 0 filas afectadas).
**Fix**: Nueva política de UPDATE para roles operativos:
```sql
CREATE POLICY "restaurant_tables_staff_update" ON restaurant_tables FOR UPDATE
  USING (get_user_role() IN ('waiter', 'kitchen', 'admin'))
  WITH CHECK (get_user_role() IN ('waiter', 'kitchen', 'admin'));
```
**Archivo corregido**: `supabase/migrations/004_rls_tables_fix.sql`
**Regla**: Al diseñar RLS, verificar qué roles hacen escrituras en cada tabla desde Server Actions — no solo desde la UI de admin.

---

## E04 — `supabase db seed` no existe en CLI v2.105.0

**Fecha**: 2026-06-08
**Síntoma**: `pnpm exec supabase db seed` arroja "Error: unknown command 'seed'".
**Causa**: El subcomando `db seed` no existe en Supabase CLI v2.105.0. La documentación más reciente lo menciona, pero la versión instalada no lo tiene.
**Fix**: Usar el comando correcto para la versión disponible:
```bash
pnpm exec supabase db query --linked --file supabase/seed.sql
```
**Regla**: Para ejecutar SQL arbitrario contra el proyecto Supabase remoto: `supabase db query --linked --file <ruta>`.

---

## E06 — Supabase Realtime: tablas no añadidas a la publicación `supabase_realtime`

**Fecha**: 2026-06-08
**Síntoma**: Las suscripciones `postgres_changes` en Client Components no reciben ningún evento. El KDS de cocina no actualiza, la vista de órdenes del camarero tampoco.
**Causa**: La publicación `supabase_realtime` existe por defecto en Supabase pero está vacía. Las tablas deben añadirse explícitamente. Sin esto, ningún evento se emite aunque el código de suscripción esté correcto.
**Fix**:
```sql
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE restaurant_tables REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
```
**Archivo corregido**: `supabase/migrations/006_realtime.sql`
**Regla**: Cualquier tabla que use `postgres_changes` debe añadirse a `supabase_realtime` publication. Añadir también `REPLICA IDENTITY FULL` para que eventos UPDATE incluyan valores anteriores (requerido para filtros por columnas no-PK).

---

## E07 — `useState(initialProp)` en componente hijo no sincroniza cuando el padre re-renderiza

**Fecha**: 2026-06-08
**Síntoma**: `OrderItemRow` muestra el estado visual correcto localmente (optimista), pero cuando el padre re-renderiza con datos frescos de Realtime, el estado local del hijo no se actualiza.
**Causa**: `useState(initialStatus)` en React solo usa el valor inicial en el PRIMER render. Cambios posteriores en el prop `initialStatus` son ignorados por el hook.
**Fix**: Añadir `useEffect` para sincronizar:
```tsx
useEffect(() => {
  setStatus(initialStatus)
}, [initialStatus])
```
**Archivo corregido**: `src/components/kitchen/OrderItemRow.tsx`
**Regla**: Si un componente hijo necesita reflejar cambios del prop padre (no solo el valor inicial), usar `useEffect` para sincronizar. Alternativa: elevar el estado al padre.

---

## E05 — Diagnóstico incorrecto: asumir error de configuración del usuario antes de revisar RLS completo

**Fecha**: 2026-06-08
**Síntoma**: Se diagnosticó que kitchen@demo.com tenía `role = 'waiter'` en la tabla `profiles` (roles mal asignados al crear usuarios demo).
**Causa del error de diagnóstico**: El análisis saltó a la conclusión de "roles incorrectos" sin verificar primero las políticas RLS en detalle. El usuario tenía los roles correctamente asignados desde el inicio (`kitchen → kitchen`, `admin → admin`). El problema real era E02 (RLS WITH CHECK implícito).
**Impacto**: Se le pidió al usuario verificar/corregir algo que estaba bien, causando confusión innecesaria.
**Lección**: Antes de asumir error de configuración del usuario, agotar el análisis de código (políticas RLS, Server Actions, logs de Supabase). La causa más probable de "UPDATE silencioso" es siempre una política RLS mal definida, no el dato del usuario.

---

## E08 — Race condition: polling restaura tarjeta que se eliminó optimistamente

**Fecha**: 2026-06-08
**Síntoma**: Al marcar una orden como entregada, la tarjeta desaparece (optimista) pero reaparece unos segundos después antes de desaparecer definitivamente.
**Causa**: `fetchOrders` está en `useCallback([userId])` y no cierra sobre el estado actualizado de `delivering`. Cuando el polling dispara mientras el Server Action está en vuelo, `fetchOrders` devuelve la orden (aún `ready` en DB) y `setOrders(newData)` sobreescribe el estado, restaurando la tarjeta.
**Fix**: Usar un `useRef` sincronizado con `delivering` para que `fetchOrders` pueda filtrar las órdenes en vuelo:
```tsx
const deliveringRef = useRef<Set<string>>(new Set())
useEffect(() => { deliveringRef.current = delivering }, [delivering])
// En fetchOrders:
.filter((o) => !deliveringRef.current.has(o.id))
```
**Archivo corregido**: `src/components/waiter/ActiveOrdersList.tsx`
**Regla**: Cuando hay optimistic updates + polling, el polling siempre puede restaurar el estado optimista si el SA aún está en vuelo. La solución general es un `useRef` que rastrea las entidades "en proceso" y excluirlas del resultado del poll.

---

## E09 — RLS `orders_update` USING demasiado restrictivo: bloquea transición `ready → delivered`

**Fecha**: 2026-06-08
**Síntoma**: Al hacer clic en "Efectivo" o "Tarjeta" para marcar una orden como entregada, la tarjeta desaparece (optimista) pero reaparece en unos segundos. No hay error visible.
**Causa**: El `USING` de migration 005 tenía `status = 'pending'` para camareros. La cláusula `USING` filtra qué filas puede actualizar un usuario según los valores ACTUALES. Una orden en estado `ready` no cumple `status = 'pending'`, por lo que el UPDATE es bloqueado silenciosamente (0 filas afectadas, sin error). `markOrderDelivered` devuelve `{}` (sin error), el optimistic update elimina la tarjeta, pero la DB no cambió. El poll siguiente devuelve la orden y la restaura.
**Fix**: Migration 008 — ampliar el USING para incluir `status IN ('pending', 'ready')`:
```sql
USING (
  (waiter_id = auth.uid() AND status IN ('pending', 'ready')) OR
  get_user_role() IN ('kitchen', 'admin')
)
```
**Archivo corregido**: `supabase/migrations/008_rls_orders_delivered.sql`
**Regla**: Al diseñar transiciones de estado con RLS, el `USING` debe permitir el estado ORIGEN de cada transición que el rol necesita hacer. Revisar todas las transiciones de la máquina de estados contra el USING de cada rol.

---

## E10 — RLS `profiles_read_own` bloqueaba JOIN kitchen→waiter: mostraba "Camarero" en KDS

**Fecha**: 2026-06-09
**Síntoma**: Las tarjetas de cocina mostraban "Camarero" en lugar del nombre real del camarero que creó la orden. El email tampoco aparecía.
**Causa**: La política `profiles_read_own` permitía leer únicamente el propio perfil (`auth.uid() = id`). La query del KDS hace un JOIN implícito `orders → profiles(name, email)` para obtener el nombre del camarero. Al ejecutarse con la sesión del usuario de cocina, Supabase evaluaba RLS en la tabla `profiles` y bloqueaba silenciosamente cualquier fila que no fuera el propio usuario — devolviendo `null` en el JOIN, que el código mostraba como fallback "Camarero".
**Fix**: Migration 013 — reemplazar la política por una que permita lectura a todos los usuarios autenticados:
```sql
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_authenticated" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
```
**Archivo corregido**: `supabase/migrations/013_profiles_read_policy.sql`
**Regla**: En sistemas con roles internos (staff-only, sin datos de clientes), la política de lectura en `profiles` debe ser `auth.uid() IS NOT NULL`. La restricción `auth.uid() = id` rompe cualquier JOIN cross-user, incluyendo los necesarios para mostrar metadatos de creador/asignado en listas de recursos.

---

## E11 — Columna `email` ausente en `profiles`: se asumió que Supabase Auth la exponía automáticamente

**Fecha**: 2026-06-09
**Síntoma**: Intentar mostrar el email del camarero en las tarjetas de cocina falló porque la tabla `profiles` no tenía columna `email`, y el JOIN `profiles(name, email)` devolvía error de columna inexistente.
**Causa**: Se diseñó el modelo de datos asumiendo que `auth.users.email` sería accesible mediante el JOIN con `profiles`. En Supabase, `auth.users` es un esquema separado (`auth`) inaccesible directamente desde Client Components con la anon key. La tabla pública `profiles` solo tenía las columnas definidas explícitamente en la migration inicial.
**Fix**: Migration 012 — añadir columna `email` a `profiles`, backfill desde `auth.users`, y actualizar el trigger `handle_new_user()` para persistirla al crear usuarios:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
UPDATE profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id;
```
**Archivo corregido**: `supabase/migrations/012_profiles_email.sql`
**Regla**: Cualquier campo de `auth.users` que se necesite en queries del lado cliente (email, phone, metadata) debe desnormalizarse en la tabla `profiles` pública y mantenerse sincronizado mediante el trigger `handle_new_user()`. No asumir acceso directo al esquema `auth` desde el cliente.

---

## E12 — Filtro de estación en KDS rompía el guard `allReady`: cocina podía marcar orden lista sin completar todos los ítems

**Fecha**: 2026-06-10
**Síntoma**: Con un filtro de estación activo (ej. "Parrilla"), el botón "Marcar lista" se habilitaba aunque ítems de otras estaciones ("Fríos") todavía estuvieran pendientes. La orden pasaba a `ready` en DB pero en la vista del camarero los botones de entrega quedaban bloqueados (`group.allReady = false`), dejando la orden en un estado irrecuperable sin acción disponible.
**Causa**: `withStationFilter` en `KitchenDisplay.tsx` filtraba los ítems ANTES de pasarlos a `<OrderCard>`. Dentro del card, `allReady = items.every(i => i.status === 'ready')` operaba sobre el subconjunto filtrado. Si todos los ítems de "Parrilla" estaban listos, `allReady` era `true` aunque "Fríos" tuviera ítems pendientes.
**Fix**: Calcular `allItemsReady` sobre la lista completa (sin filtrar) y pasarlo como prop a `OrderCard`. El card usa este override en lugar del cálculo local cuando está presente. Además, `markOrderReady` ahora valida en servidor que no haya `order_items` con `status = 'pending'`.
**Archivos corregidos**: `src/components/kitchen/KitchenDisplay.tsx`, `src/components/kitchen/OrderCard.tsx`, `src/lib/actions/orders.ts`
**Regla**: Nunca calcular una validación de negocio sobre datos ya filtrados. Si el filtro es solo para display, calcular los guards sobre el dataset original antes de aplicar el filtro. Siempre acompañar los guards cliente con una validación servidor equivalente.

---

## E13 — `markOrderReady` sin validación server-side: guard solo existía en cliente

**Fecha**: 2026-06-10
**Síntoma**: El botón "Marcar lista" tenía un guard UI (`allReady`), pero la Server Action `markOrderReady` no verificaba nada. Cualquier llamada directa a la SA (o un bug de estado en el cliente, como E12) podía marcar una orden como lista con ítems pendientes.
**Causa**: La Server Action actualizaba `orders.status = 'ready'` sin consultar el estado de los `order_items` asociados. El guard era puramente presentacional.
**Fix**: Añadir al inicio de `markOrderReady` una query que cuente `order_items` con `status = 'pending'` para la orden. Si el count > 0, devolver `{ error: '...' }` sin actualizar.
**Archivo corregido**: `src/lib/actions/orders.ts`
**Regla**: Los guards de validación de negocio deben existir SIEMPRE en el servidor, independientemente de si existe un guard visual en el cliente. El cliente puede fallar, ser omitido, o tener bugs de estado.

---

## E14 — `delivered_at` de `order_items` no incluido en query del KDS: cocina ciega a recogidas parciales

**Fecha**: 2026-06-10
**Síntoma**: Cuando el camarero recogía una categoría parcialmente (`markCategoryDelivered`), la cocina no veía ningún cambio visual en las tarjetas del KDS. Los ítems recogidos aparecían idénticos a los no recogidos.
**Causa**: La columna `delivered_at` fue añadida a `order_items` en migration 010, y `markCategoryDelivered` la actualiza correctamente. Pero el select de `fetchOrders` en `KitchenDisplay.tsx` no incluía `delivered_at` en la lista de campos de `order_items`. El campo existía en DB pero nunca llegaba al cliente.
**Fix**: Añadir `delivered_at` al select de `order_items` en `fetchOrders`. Actualizar la interfaz `KitchenOrder.items` y el mapping. En `OrderItemRow`, renderizar un estado visual "↑ recogido" cuando `deliveredAt` tiene valor.
**Archivos corregidos**: `src/components/kitchen/KitchenDisplay.tsx`, `src/components/kitchen/OrderCard.tsx`, `src/components/kitchen/OrderItemRow.tsx`
**Regla**: Cuando se añade una columna a una tabla con una migration, revisar TODOS los selects que consultan esa tabla y decidir explícitamente si el campo es necesario en cada query. Una migration de schema no actualiza automáticamente los selects existentes.

---

## E15 — `markOrderDelivered` no seteaba `picked_up_at`: órdenes entregadas directamente por camarero nunca aparecían en historial de cocina

**Fecha**: 2026-06-10
**Síntoma**: Cuando el camarero usaba "Llevar todo y cobrar", la orden desaparecía del KDS (correcto — `status = 'delivered'`) pero nunca aparecía en la pestaña "Recogidas" del historial de cocina.
**Causa**: La query de `fetchHistory` en `KitchenDisplay.tsx` filtra por `.not("picked_up_at", "is", null)`. El campo `picked_up_at` solo lo escribe `markOrderPickedUp`, que se llama cuando la cocina pulsa "Marcar recogido" manualmente. Si el camarero entrega directamente (bypassing el paso de cocina), `picked_up_at` permanece `null` y la orden no aparece en el historial, aunque `status = 'delivered'`.
**Fix**: En `markOrderDelivered`, después de actualizar el status, hacer una segunda update que ponga `picked_up_at = NOW()` solo donde sea `null` (`.is("picked_up_at", null)`). Si cocina ya lo marcó antes, el timestamp original se preserva.
**Archivo corregido**: `src/lib/actions/orders.ts`
**Regla**: Cuando dos code paths distintos deben producir el mismo efecto observable (en este caso, "orden visible en historial"), ambos deben escribir todos los campos que ese efecto requiere. No asumir que un field siempre será poblado por otro flow previo.
