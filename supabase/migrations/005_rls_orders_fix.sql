-- Fix: la política orders_update no tenía WITH CHECK explícito.
-- PostgreSQL usa el USING como WITH CHECK por defecto, aplicado a la fila
-- resultante. Cuando el camarero cambia status pending → in_kitchen,
-- el check sobre la nueva fila evalúa (status = 'pending') = FALSE y rechaza
-- el UPDATE silenciosamente. La orden nunca llega al KDS.

DROP POLICY IF EXISTS "orders_update" ON orders;

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    -- Waiter puede modificar solo sus propias órdenes pendientes
    (waiter_id = auth.uid() AND status = 'pending') OR
    -- Kitchen y admin pueden modificar cualquier orden
    get_user_role() IN ('kitchen', 'admin')
  )
  WITH CHECK (
    -- La fila resultante debe pertenecer al mismo waiter (cualquier status)
    -- o ser actualizada por kitchen/admin
    waiter_id = auth.uid() OR
    get_user_role() IN ('kitchen', 'admin')
  );
