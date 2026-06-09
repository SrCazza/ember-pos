-- Fix: el USING de orders_update solo permitía a camareros actualizar órdenes
-- con status = 'pending'. markOrderDelivered necesita actualizar órdenes en
-- status = 'ready' → el UPDATE se bloqueaba silenciosamente (0 filas, sin error).

DROP POLICY IF EXISTS "orders_update" ON orders;

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    -- Waiter puede modificar sus propias órdenes en pending o ready
    (waiter_id = auth.uid() AND status IN ('pending', 'ready')) OR
    -- Kitchen y admin pueden modificar cualquier orden
    get_user_role() IN ('kitchen', 'admin')
  )
  WITH CHECK (
    -- La fila resultante debe pertenecer al mismo waiter o ser de kitchen/admin
    waiter_id = auth.uid() OR
    get_user_role() IN ('kitchen', 'admin')
  );
