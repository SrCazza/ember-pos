-- Añadir método de pago a órdenes entregadas
ALTER TABLE orders ADD COLUMN payment_method TEXT
  CHECK (payment_method IN ('cash', 'card'));
