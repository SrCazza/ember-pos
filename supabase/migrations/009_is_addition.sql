-- Marcar órdenes que son adiciones a una mesa ya activa
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_addition BOOLEAN NOT NULL DEFAULT false;
