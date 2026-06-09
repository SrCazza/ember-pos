-- Número de orden secuencial visible (#00001)
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 1;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number BIGINT;

-- Backfill en orden cronológico para órdenes existentes
UPDATE orders
SET order_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn FROM orders
) sub
WHERE orders.id = sub.id;

-- Default para nuevas órdenes
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');

-- Avanzar el sequence al máximo existente para evitar colisiones con el backfill
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM orders), 0) + 1, false);
