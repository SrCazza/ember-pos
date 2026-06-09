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
