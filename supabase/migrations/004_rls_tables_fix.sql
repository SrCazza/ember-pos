-- Permite a camareros y cocina actualizar el estado de las mesas.
-- La política anterior solo permitía al admin escribir en restaurant_tables,
-- lo que causaba que createOrder/markOrderDelivered/cancelOrder fallaran
-- silenciosamente al intentar cambiar table.status.
CREATE POLICY "restaurant_tables_staff_update" ON restaurant_tables FOR UPDATE
  USING (get_user_role() IN ('waiter', 'kitchen', 'admin'))
  WITH CHECK (get_user_role() IN ('waiter', 'kitchen', 'admin'));
