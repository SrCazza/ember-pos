-- Habilitar Supabase Realtime para las tablas usadas en tiempo real.
-- Sin esto, postgres_changes no recibe eventos aunque la suscripción esté definida.

-- REPLICA IDENTITY FULL: Realtime necesita los valores ANTERIORES de la fila
-- para eventos UPDATE, especialmente cuando se filtra por columnas no-PK.
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE restaurant_tables REPLICA IDENTITY FULL;

-- Añadir tablas a la publicación supabase_realtime
-- (la publicación existe por defecto en Supabase pero sin tablas asignadas)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
