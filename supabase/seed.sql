-- Estaciones de cocina
INSERT INTO kitchen_stations (name, color, display_order) VALUES
  ('Parrilla', '#EF4444', 1),
  ('Fríos', '#3B82F6', 2),
  ('Barra', '#8B5CF6', 3);

-- Categorías de menú
INSERT INTO menu_categories (name, icon, display_order) VALUES
  ('Carnes al Carbón', '🥩', 1),
  ('Entradas y Fríos', '🥗', 2),
  ('Postres', '🍮', 3),
  ('Bebidas', '🍹', 4);

-- Platos (usando subqueries para IDs)
INSERT INTO menu_items (name, price, category_id, station_id, display_order) VALUES
  -- Carnes al Carbón → Parrilla
  ('Picaña (250g)', 18.90,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 1),
  ('T-Bone Steak (300g)', 24.50,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 2),
  ('Costillas BBQ (500g)', 22.00,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 3),
  ('Lomo Saltado', 16.50,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 4),
  ('Chorizo Parrillero', 12.00,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 5),
  ('Hamburguesa Gourmet', 14.90,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 6),
  ('Brocheta de Pollo', 13.50,
    (SELECT id FROM menu_categories WHERE name = 'Carnes al Carbón'),
    (SELECT id FROM kitchen_stations WHERE name = 'Parrilla'), 7),
  -- Entradas y Fríos → Fríos
  ('Ceviche Clásico', 13.90,
    (SELECT id FROM menu_categories WHERE name = 'Entradas y Fríos'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 1),
  ('Causa Rellena', 9.50,
    (SELECT id FROM menu_categories WHERE name = 'Entradas y Fríos'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 2),
  ('Ensalada Caesar', 10.50,
    (SELECT id FROM menu_categories WHERE name = 'Entradas y Fríos'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 3),
  ('Carpaccio de Res', 14.00,
    (SELECT id FROM menu_categories WHERE name = 'Entradas y Fríos'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 4),
  ('Tabla de Quesos', 15.00,
    (SELECT id FROM menu_categories WHERE name = 'Entradas y Fríos'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 5),
  -- Postres → Fríos
  ('Tiramisú', 7.50,
    (SELECT id FROM menu_categories WHERE name = 'Postres'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 1),
  ('Brownie con Helado', 8.00,
    (SELECT id FROM menu_categories WHERE name = 'Postres'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 2),
  ('Cheesecake Maracuyá', 7.00,
    (SELECT id FROM menu_categories WHERE name = 'Postres'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 3),
  ('Mousse de Chocolate', 7.50,
    (SELECT id FROM menu_categories WHERE name = 'Postres'),
    (SELECT id FROM kitchen_stations WHERE name = 'Fríos'), 4),
  -- Bebidas → Barra
  ('Agua Mineral', 3.00,
    (SELECT id FROM menu_categories WHERE name = 'Bebidas'),
    (SELECT id FROM kitchen_stations WHERE name = 'Barra'), 1),
  ('Limonada Natural', 5.50,
    (SELECT id FROM menu_categories WHERE name = 'Bebidas'),
    (SELECT id FROM kitchen_stations WHERE name = 'Barra'), 2),
  ('Chicha Morada', 5.00,
    (SELECT id FROM menu_categories WHERE name = 'Bebidas'),
    (SELECT id FROM kitchen_stations WHERE name = 'Barra'), 3),
  ('Pisco Sour', 10.00,
    (SELECT id FROM menu_categories WHERE name = 'Bebidas'),
    (SELECT id FROM kitchen_stations WHERE name = 'Barra'), 4);

-- Mesas: 1-4 capacidad 4, 5-8 capacidad 6, 9-10 capacidad 2
INSERT INTO restaurant_tables (number, capacity) VALUES
  (1, 4), (2, 4), (3, 4), (4, 4),
  (5, 6), (6, 6), (7, 6), (8, 6),
  (9, 2), (10, 2);
