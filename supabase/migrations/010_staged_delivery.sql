-- Camarero recoge del mostrador (timer KDS se congela)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- Entrega escalonada: cuándo se llevó cada ítem al cliente
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Categoría denormalizada (mismo patrón que station_id)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES menu_categories(id);

-- Camarero puede actualizar sus propios order_items para delivered_at
CREATE POLICY "order_items_waiter_deliver" ON order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.waiter_id = auth.uid()
  )
);

-- Índice para filtrar ítems pendientes de entrega
CREATE INDEX IF NOT EXISTS idx_order_items_delivered
  ON order_items(order_id) WHERE delivered_at IS NULL;
